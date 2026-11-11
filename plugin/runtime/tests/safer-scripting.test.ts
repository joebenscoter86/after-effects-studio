// Stage 7, safer scripting — the Node side: what ae_do sends (rollback),
// what it reports back (rollback outcome, the caller's own line number),
// eval.run script files, and undo/redo with dialogs suppressed.
//
// Live facts these lean on (side-session note undo-hazard-live-finding.md):
// a throwing script keeps its partial change; an undo once raised an After
// Effects error box that blocked all scripting; and an error thrown on the
// caller's line 1 was reported as "(line 4)".

import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { RUNTIME_DIR } from "../src/config.js";
import { getOp, wantsDialogSuppression, wantsRollback, wantsUndoGroup } from "../src/registry.js";
import { contextTool } from "../src/tools/context.js";
import { doTool } from "../src/tools/do.js";
import "../src/operations/index.js";
import "../src/operations/eval.js";
import { FakeAe } from "./helpers/fake-ae.js";
import { nullTransport } from "./helpers/null-transport.js";

const OK_RESPONSE = { result: { result: { ok: true }, context: {} } };

const savedEval = process.env.AE_MCP_ENABLE_EVAL;
beforeEach(() => {
  process.env.AE_MCP_ENABLE_EVAL = "1";
});
afterEach(() => {
  if (savedEval === undefined) delete process.env.AE_MCP_ENABLE_EVAL;
  else process.env.AE_MCP_ENABLE_EVAL = savedEval;
});

function text(res: { content?: unknown }): string {
  const first = Array.isArray(res.content) ? (res.content[0] as { text?: unknown }) : undefined;
  return typeof first?.text === "string" ? first.text : "";
}
/** The error envelope's `error` object (code, message, details, hint). */
function structured(res: { structuredContent?: unknown }): Record<string, unknown> {
  const env = (res.structuredContent ?? {}) as { error?: Record<string, unknown> };
  return env.error ?? {};
}

describe("which calls roll back on failure", () => {
  it("mutations do, read-only calls and ungrouped calls do not", () => {
    expect(wantsRollback(getOp("layer.create_null")!, {})).toBe(true);
    expect(wantsRollback(getOp("comp.info")!, {})).toBe(false);
    expect(wantsRollback(getOp("project.undo")!, {})).toBe(false);
    expect(wantsRollback(getOp("project.open")!, {})).toBe(false);
  });

  it("eval.run and batch.run roll back unless the caller says rollback: false", () => {
    for (const name of ["eval.run", "batch.run"]) {
      expect(wantsRollback(getOp(name)!, {}), name).toBe(true);
      expect(wantsRollback(getOp(name)!, { rollback: false }), name).toBe(false);
    }
  });

  it("ae_do sends the decision to the dispatcher", async () => {
    const t = nullTransport(OK_RESPONSE);
    await doTool.handler({ operation: "layer.create_null", args: { comp: "Main" } }, t);
    await doTool.handler({ operation: "eval.run", args: { code: "return 1;", rollback: false } }, t);
    await doTool.handler({ operation: "project.undo", args: {} }, t);
    expect(t.calls.map((c) => c.rollback)).toEqual([true, false, false]);
  });
});

describe("what a failed call reports", () => {
  const rolledBack = {
    attempted: true,
    rolledBack: true,
    verified: "signature",
    reason: null,
    left: null,
    aeErrors: [],
  };

  it("names the rollback in the message and the details", async () => {
    const t = nullTransport({
      ok: false,
      result: null,
      error: "probe throw after a change (line 4)",
      errorCode: "JSX_THROW",
      line: 4,
      rollback: rolledBack,
    });
    const res = await doTool.handler({ operation: "eval.run", args: { code: "throw new Error('x');" } }, t);
    expect(res.isError).toBe(true);
    const details = (structured(res).details ?? {}) as Record<string, unknown>;
    expect(details.rollback).toEqual(rolledBack);
    expect(text(res)).toMatch(/rolled back/i);
  });

  it("says plainly when the rollback failed and what was left", async () => {
    const t = nullTransport({
      ok: false,
      result: null,
      error: "boom (line 4)",
      errorCode: "JSX_THROW",
      line: 4,
      rollback: { ...rolledBack, rolledBack: false, reason: "the undo command threw: nope", left: "the call's changes up to the failure are still applied, as one undo step" },
    });
    const res = await doTool.handler({ operation: "eval.run", args: { code: "x();" } }, t);
    expect(text(res)).toMatch(/NOT rolled back/);
    expect(text(res)).toContain("the undo command threw: nope");
    expect(text(res)).toContain("still applied");
  });

  it("reports a stopOnError batch that was rolled back", async () => {
    const t = nullTransport({
      result: {
        result: { ok: false, error: "1 of 3 operations failed", results: [], failed: 1, stoppedAt: 1, rollbackRequested: true, kept: null },
        context: {},
      },
      rollback: rolledBack,
    });
    const res = await doTool.handler(
      { operation: "batch.run", args: { ops: [{ operation: "comp.info", args: { comp: "Main" } }], stopOnError: true } },
      t,
    );
    expect(res.isError).toBe(true);
    expect(((structured(res).details ?? {}) as Record<string, unknown>).rollback).toEqual(rolledBack);
    expect(text(res)).toMatch(/rolled back/i);
  });
});

describe("error lines", () => {
  it("reports the caller's own line for inline code, not the wrapper's", async () => {
    // Live, 2026-11-10: a throw on the caller's line 1 came back as "(line 4)".
    const t = nullTransport({
      ok: false,
      result: null,
      error: "probe throw after a change (line 4)",
      errorCode: "JSX_THROW",
      line: 4,
    });
    const res = await doTool.handler(
      { operation: "eval.run", args: { code: "throw new Error('probe throw after a change');" } },
      t,
    );
    expect(text(res)).toContain("probe throw after a change (line 1 of your code)");
    expect(text(res)).not.toContain("(line 4)");
    expect(((structured(res).details ?? {}) as Record<string, unknown>).userCodeLine).toBe(1);
  });

  it("says when the line is in the plugin's wrapper rather than the caller's code", async () => {
    const t = nullTransport({ ok: false, result: null, error: "oops (line 2)", errorCode: "JSX_THROW", line: 2 });
    const res = await doTool.handler({ operation: "eval.run", args: { code: "return 1;" } }, t);
    expect(text(res)).toMatch(/oops \(line 2 of the plugin's wrapper/);
  });
});

describe("eval.run with a script file", () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), "stage7-scripts-"));
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  function script(name: string, body: string): string {
    const p = path.join(dir, name);
    writeFileSync(p, body, "utf8");
    return p;
  }

  it("sends the file's code, with the arguments in scope as `args`", async () => {
    const file = script("build.jsx", "var c = app.project.items.addComp(args.name);\nreturn c.name;\n");
    const t = nullTransport(OK_RESPONSE);
    const res = await doTool.handler(
      { operation: "eval.run", args: { file, args: { name: "Hero", n: [1, 2] } } },
      t,
    );
    expect(res.isError).toBeFalsy();
    expect(t.calls).toHaveLength(1);
    expect(t.calls[0].code).toContain("app.project.items.addComp(args.name);");
    expect(t.calls[0].code).toContain('var args = {"name":"Hero","n":[1,2]};');
    expect(t.calls[0].label).toBe("eval.run");
  });

  it("gives inline code the same `args`", async () => {
    const t = nullTransport(OK_RESPONSE);
    await doTool.handler({ operation: "eval.run", args: { code: "return args.k;", args: { k: 3 } } }, t);
    expect(t.calls[0].code).toContain('var args = {"k":3}; return args.k;');
  });

  it("reports the file and the line when the file's code throws", async () => {
    const file = script("throws.jsx", "var ok = 1;\nthrow new Error('bad step');\n");
    // Line 2 of the file: header (1) + wrapper (2) + 2 = 5.
    const t = nullTransport({ ok: false, result: null, error: "bad step (line 5)", errorCode: "JSX_THROW", line: 5 });
    const res = await doTool.handler({ operation: "eval.run", args: { file } }, t);
    expect(text(res)).toContain(`bad step (${file}:2)`);
    const details = (structured(res).details ?? {}) as Record<string, unknown>;
    expect(details.file).toBe(file);
    expect(details.fileLine).toBe(2);
  });

  const refusals: Array<[string, () => Record<string, unknown>, RegExp]> = [
    ["both code and file", () => ({ code: "return 1;", file: script("a.jsx", "return 1;") }), /either .*code.* or .*file/i],
    ["neither code nor file", () => ({}), /either .*code.* or .*file/i],
    ["a relative path", () => ({ file: "scripts/build.jsx" }), /absolute/],
    ["a missing file", () => ({ file: path.join(dir, "nope.jsx") }), /does not exist/],
    ["a directory", () => ({ file: dir }), /not a file/],
    ["an empty file", () => ({ file: script("empty.jsx", "") }), /empty/],
    ["a file that is too big", () => ({ file: script("big.jsx", "//" + "x".repeat(2 * 1024 * 1024)) }), /too large/],
    ["a binary file", () => ({ file: script("bin.jsx", "return 1;\u0000\u0001") }), /binary/],
  ];
  for (const [what, args, message] of refusals) {
    it(`refuses ${what} before contacting After Effects`, async () => {
      const t = nullTransport(OK_RESPONSE);
      const res = await doTool.handler({ operation: "eval.run", args: args() }, t);
      expect(res.isError).toBe(true);
      expect(text(res)).toMatch(message);
      expect(structured(res).code).toBe("INVALID_ARGS");
      expect(t.calls).toHaveLength(0);
    });
  }

  it("refuses a script inside the plugin's mailbox, even through a symlink", async () => {
    mkdirSync(RUNTIME_DIR, { recursive: true });
    const inside = path.join(RUNTIME_DIR, `stage7-${process.pid}.jsx`);
    writeFileSync(inside, "return 1;", "utf8");
    const link = path.join(dir, "link.jsx");
    symlinkSync(inside, link);
    try {
      for (const file of [inside, link]) {
        const t = nullTransport(OK_RESPONSE);
        const res = await doTool.handler({ operation: "eval.run", args: { file } }, t);
        expect(text(res), file).toMatch(/mailbox/);
        expect(t.calls).toHaveLength(0);
      }
    } finally {
      rmSync(inside, { force: true });
    }
  });

  it("refuses a batch child whose file is unusable, and still runs its siblings", () => {
    const jsx = getOp("batch.run")!.toJsx({
      ops: [
        { operation: "eval.run", args: { file: path.join(dir, "missing.jsx") } },
        { operation: "eval.run", args: { code: "return 'sibling';" } },
      ],
    });
    expect(jsx).toContain("does not exist");
    expect(jsx).toContain("return 'sibling';");
  });
});

describe("undo and redo", () => {
  it("now run with dialogs suppressed, still outside the undo group", () => {
    for (const [name, args] of [
      ["project.undo", {}],
      ["project.redo", {}],
      ["command.execute", { id: 16 }],
      ["command.execute", { id: 2035 }],
    ] as const) {
      const op = getOp(name)!;
      expect(wantsUndoGroup(op, args), name).toBe(false);
      expect(wantsDialogSuppression(op, args), name).toBe(true);
    }
  });

  function run(ae: FakeAe, name: string, args: Record<string, unknown>) {
    const jsx = getOp(name)!.toJsx(args);
    return ae.serve(name, `return (function() { ${jsx} })();`, {
      undoGroup: false,
      suppressDialogs: true,
    });
  }

  it("project.undo reverts the last step with dialogs suppressed, and says the project changed", () => {
    const ae = new FakeAe();
    ae.userStep("A");
    ae.userStep("B");
    const res = run(ae, "project.undo", { count: 1 });
    expect(res.ok).toBe(true);
    expect(res.result).toMatchObject({ ok: true, commandsRun: 1, changed: true, aeErrors: [] });
    expect(ae.names()).toEqual(["A"]);
    expect(ae.commands).toEqual([{ id: 16, suppressed: true }]);
  });

  it("never reports a step undone when the history was empty", () => {
    // Live, 2026-11-10: project.undo on an empty history answered
    // { done: 1, undone: 1 }.
    const ae = new FakeAe();
    const res = run(ae, "project.undo", {});
    const result = res.result as Record<string, unknown>;
    expect(result.ok).toBe(true);
    expect(result.changed).toBe(false);
    expect(result).not.toHaveProperty("undone");
    expect(result).not.toHaveProperty("done");
    expect(String(result.effect)).toMatch(/no change .*was seen/);
    expect(String(result.effect)).toMatch(/history was empty|nothing to undo/);
  });

  it("sees an undo of a layer rename in the active comp", () => {
    const ae = new FakeAe();
    const comp = ae.userStep("MAIN");
    ae.setActive(comp);
    ae.userLayerStep(comp, "L1");
    ae.userRenameLayerStep(comp, 1, "L1 renamed");
    const res = run(ae, "project.undo", {});
    expect((res.result as { changed: boolean }).changed).toBe(true);
  });

  it("project.redo replays it", () => {
    const ae = new FakeAe();
    ae.userStep("A");
    run(ae, "project.undo", {});
    const res = run(ae, "project.redo", { count: 1 });
    expect(res.result).toMatchObject({ ok: true, commandsRun: 1, changed: true });
    expect(ae.names()).toEqual(["A"]);
    expect(ae.commands.map((c) => c.id)).toEqual([16, 2035]);
  });

  it("project.redo with nothing to redo says no change was seen", () => {
    const ae = new FakeAe();
    ae.userStep("A");
    const res = run(ae, "project.redo", {});
    const result = res.result as Record<string, unknown>;
    expect(result.changed).toBe(false);
    expect(result).not.toHaveProperty("redone");
    expect(String(result.effect)).toMatch(/nothing to redo/);
  });

  it("counts only the commands that changed something", () => {
    const ae = new FakeAe();
    ae.userStep("A");
    const res = run(ae, "project.undo", { count: 3 });
    expect(res.result).toMatchObject({ commandsRun: 3, changed: true, commandsWithChange: 1 });
    expect(ae.names()).toEqual([]);
  });

  it("says in its result when After Effects reported an error", () => {
    const ae = new FakeAe();
    ae.userStep("A");
    ae.undoBehaviour = "revert-and-report";
    const res = run(ae, "project.undo", {});
    const result = res.result as { ok: boolean; aeErrors: string[]; warning?: string };
    expect(result.aeErrors).toHaveLength(1);
    expect(result.warning).toMatch(/reported 1 error/);
    expect(ae.modals).toEqual([]);
  });

  it("stops at an undo that throws and reports it as a failure", () => {
    const ae = new FakeAe();
    ae.userStep("A");
    ae.undoBehaviour = "throw";
    const res = run(ae, "project.undo", { count: 3 });
    const result = res.result as { ok: boolean; commandsRun: number; error: string };
    expect(result.ok).toBe(false);
    expect(result.commandsRun).toBe(0);
    expect(result.error).toMatch(/undo 1 of 3 threw/);
    expect(ae.commands).toHaveLength(1);
  });

  it("command.execute 16 goes through the same guarded path", () => {
    const ae = new FakeAe();
    ae.userStep("A");
    const res = run(ae, "command.execute", { id: 16 });
    expect(res.result).toMatchObject({ ok: true, commandId: 16, commandsRun: 1, changed: true });
    expect(ae.names()).toEqual([]);
  });
});

describe("ae_context's undo contract", () => {
  it("says what happens on failure", async () => {
    const t = nullTransport({ result: {} });
    await contextTool.handler({}, t);
    const code = t.calls[0].code;
    expect(code).toMatch(/rolled back/);
    expect(code).toMatch(/rollback: false/);
  });
});

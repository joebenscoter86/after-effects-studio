// Rollback when a request throws (stage 7, safer scripting).
//
// Measured on After Effects 2027 on 2026-11-10 (side-session note
// undo-hazard-live-finding.md): a script that throws part-way leaves its
// partial change applied as one undo step; a call that changed nothing leaves
// NO undo step, so an undo issued after it reverts the user's previous action;
// a change made inside the open group always records a step; and undo issued
// from inside the same request, after its group is closed, works.
//
// These run the real serve.jsx against tests/helpers/fake-ae.ts, which models
// exactly those measurements (and lets a test break undo on purpose).

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getOp } from "../src/registry.js";
import "../src/operations/index.js";
import "../src/operations/eval.js";
import { FakeAe } from "./helpers/fake-ae.js";

let ae: FakeAe;

beforeEach(() => {
  ae = new FakeAe();
  // Something the user did before this request: one undo step of its own.
  ae.userStep("USER_COMP");
});

describe("a grouped request that throws", () => {
  it("reverts its own change and reports a confirmed rollback", () => {
    const res = ae.serve(
      "c1",
      "app.project.items.addComp('PROBE'); throw new Error('probe throw after a change');",
      { rollback: true },
    );

    expect(res.ok).toBe(false);
    expect(res.error).toContain("probe throw after a change");
    expect(ae.names()).toEqual(["USER_COMP"]);
    expect(res.rollback).toMatchObject({ attempted: true, rolledBack: true, reason: null });
    expect(res.rollback?.verified).toBe("signature");
    // Exactly one undo, issued with dialogs suppressed.
    expect(ae.commands).toEqual([{ id: 16, suppressed: true }]);
    // The user's own step is still on the stack: one Ctrl+Z still reverts it.
    expect(ae.undoStack).toHaveLength(1);
    expect(ae.modals).toEqual([]);
  });

  it("never reverts the user's previous action when it changed nothing", () => {
    const res = ae.serve("c2", "throw new Error('nothing changed yet');", { rollback: true });

    expect(res.ok).toBe(false);
    // The undo consumed the request's own (marker) step, not USER_COMP.
    expect(ae.names()).toEqual(["USER_COMP"]);
    expect(ae.undoStack).toHaveLength(1);
    expect(res.rollback).toMatchObject({ attempted: true, rolledBack: true });
  });

  it("leaves no rollback marker behind", () => {
    ae.serve("c3", "app.project.items.addFolder('F'); throw new Error('x');", { rollback: true });
    expect(ae.names()).toEqual(["USER_COMP"]);
    expect(ae.names().some((n) => n.indexOf("rollback") !== -1)).toBe(false);
  });

  it("keeps the change when the request turned rollback off", () => {
    const res = ae.serve("c4", "app.project.items.addComp('KEEP'); throw new Error('x');", {
      rollback: false,
    });

    expect(res.ok).toBe(false);
    expect(ae.names()).toEqual(["USER_COMP", "KEEP"]);
    expect(ae.commands).toEqual([]);
    expect(res.rollback).toMatchObject({ attempted: false, rolledBack: false });
    expect(res.rollback?.reason).toMatch(/turned off/);
    expect(res.rollback?.left).toMatch(/still applied/);
    // Still one undo step: a later project.undo reverts the call.
    expect(ae.undoStack).toHaveLength(2);
  });

  it("does not roll back when the request said nothing (old contract)", () => {
    const res = ae.serve("c5", "app.project.items.addComp('OLD'); throw new Error('x');");
    expect(ae.names()).toEqual(["USER_COMP", "OLD"]);
    expect(ae.commands).toEqual([]);
    expect(res.rollback?.attempted ?? false).toBe(false);
  });
});

describe("when the undo itself goes wrong", () => {
  it("reports rolledBack:false with the reason when undo throws, and does not retry", () => {
    ae.undoBehaviour = "throw";
    const res = ae.serve("u1", "app.project.items.addComp('P'); throw new Error('x');", {
      rollback: true,
    });

    expect(res.ok).toBe(false);
    expect(res.error).toContain("x");
    expect(ae.commands).toHaveLength(1);
    expect(res.rollback).toMatchObject({ attempted: true, rolledBack: false });
    expect(res.rollback?.reason).toMatch(/can not undo now/);
    expect(res.rollback?.left).toMatch(/still applied/);
  });

  it("reports an error After Effects raised during the undo, without a modal", () => {
    ae.undoBehaviour = "report-only";
    const res = ae.serve("u2", "app.project.items.addComp('P'); throw new Error('x');", {
      rollback: true,
    });

    expect(res.rollback?.rolledBack).toBe(false);
    expect(res.rollback?.aeErrors).toEqual([expect.stringContaining("undo failed")]);
    expect(ae.modals).toEqual([]);
  });

  it("says so when the undo returned but did not take effect", () => {
    // The suppression scope swallowing the undo (the claim in serve.jsx's old
    // comment) looks exactly like this from inside the script.
    ae.undoBehaviour = "noop";
    const res = ae.serve("u3", "app.project.items.addComp('P'); throw new Error('x');", {
      rollback: true,
    });

    expect(res.rollback).toMatchObject({ attempted: true, rolledBack: false });
    expect(res.rollback?.reason).toMatch(/did not take effect/);
    expect(res.rollback?.left).toMatch(/marker/);
  });

  it("keeps a confirmed rollback but still passes on what After Effects reported", () => {
    ae.undoBehaviour = "revert-and-report";
    const res = ae.serve("u4", "app.project.items.addComp('P'); throw new Error('x');", {
      rollback: true,
    });

    expect(ae.names()).toEqual(["USER_COMP"]);
    expect(res.rollback?.rolledBack).toBe(true);
    expect(res.rollback?.aeErrors).toHaveLength(1);
  });

  it("does not undo at all when the marker cannot be added", () => {
    ae.refuseFolders = true;
    const res = ae.serve("u5", "app.project.items.addComp('P'); throw new Error('x');", {
      rollback: true,
    });

    expect(ae.commands).toEqual([]);
    expect(res.rollback).toMatchObject({ attempted: false, rolledBack: false });
    expect(res.rollback?.reason).toMatch(/marker/);
    expect(ae.names()).toEqual(["USER_COMP", "P"]);
  });

  it("does not undo after the project was replaced", () => {
    const res = ae.serve(
      "u6",
      "app.project.file = { fsName: '/other.aep' }; throw new Error('x');",
      { rollback: true },
    );
    expect(ae.commands).toEqual([]);
    expect(res.rollback?.reason).toMatch(/project/);
  });
});

describe("requests the rollback never touches", () => {
  it("issues no undo for a request that succeeds", () => {
    const res = ae.serve("s1", "app.project.items.addComp('OK'); return 1;", { rollback: true });
    expect(res.ok).toBe(true);
    expect(ae.commands).toEqual([]);
    expect(ae.names()).toEqual(["USER_COMP", "OK"]);
    expect(ae.undoStack).toHaveLength(2);
    expect(res.rollback ?? null).toBeNull();
  });

  it("leaves an ungrouped request (undo, redo, project open/new) alone", () => {
    const res = ae.serve("s2", "throw new Error('x');", {
      undoGroup: false,
      rollback: true,
    });
    expect(res.ok).toBe(false);
    expect(ae.commands).toEqual([]);
    expect(ae.names()).toEqual(["USER_COMP"]);
  });
});

describe("batch.run with stopOnError", () => {
  const savedEval = process.env.AE_MCP_ENABLE_EVAL;
  beforeEach(() => {
    process.env.AE_MCP_ENABLE_EVAL = "1";
  });
  afterEach(() => {
    if (savedEval === undefined) delete process.env.AE_MCP_ENABLE_EVAL;
    else process.env.AE_MCP_ENABLE_EVAL = savedEval;
  });

  const ops = [
    { operation: "eval.run", args: { code: "app.project.items.addComp('A'); return { ok: true };" } },
    { operation: "eval.run", args: { code: "app.project.items.addComp('B'); throw new Error('child 2 broke');" } },
    { operation: "eval.run", args: { code: "app.project.items.addComp('C'); return { ok: true };" } },
  ];

  function batch(args: Record<string, unknown>): string {
    return `return (function() { ${getOp("batch.run")!.toJsx(args)} })();`;
  }

  it("rolls the whole batch back when a child fails", () => {
    const res = ae.serve("b1", batch({ ops, stopOnError: true }), { rollback: true });

    expect(res.ok).toBe(true);
    expect(ae.names()).toEqual(["USER_COMP"]);
    const result = res.result as { ok: boolean; failed: number; stoppedAt: number; results: unknown[] };
    expect(result.ok).toBe(false);
    expect(result.stoppedAt).toBe(1);
    expect(result.results[2]).toEqual({ skipped: true });
    expect(res.rollback).toMatchObject({ attempted: true, rolledBack: true });
  });

  it("keeps the children before the failure with rollback:false, and says which", () => {
    const res = ae.serve("b2", batch({ ops, stopOnError: true, rollback: false }), {
      rollback: false,
    });

    expect(ae.names()).toEqual(["USER_COMP", "A", "B"]);
    const result = res.result as { kept: string };
    expect(result.kept).toMatch(/operation 0 .*kept/);
    expect(result.kept).toMatch(/operation 1 failed/);
    expect(ae.commands).toEqual([]);
  });

  it("does not roll back a batch without stopOnError: the others' changes stand", () => {
    const res = ae.serve("b3", batch({ ops }), { rollback: true });
    expect(ae.names()).toEqual(["USER_COMP", "A", "B", "C"]);
    expect(ae.commands).toEqual([]);
    expect((res.result as { failed: number }).failed).toBe(1);
  });
});

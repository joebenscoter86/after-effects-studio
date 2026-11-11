// No undo after a scripted render-queue change (stage 7, stop-ship guard).
//
// Live, 2026-11-10 (undo-hazard-live-finding.md, "Second incident"): after
// `render.list_templates` added and removed a temporary render-queue item, a
// later `project.undo` never returned — After Effects 2027 opened "Generate
// Recovery Project" and wrote a recovery copy of the project. The first
// incident that day (an undo raising an error box) also followed scripted
// render-queue work (an item added and rendered). Every undo that worked that
// day was in a session with no render-queue change. Two observations, so this
// is a precaution, not a proven cause.
//
// So: (1) a rollback never undoes a request that changed the render queue;
// (2) once any request changes it, a session flag in the engine's global
// state blocks rollback and undo/redo until a project is opened or created,
// unless the caller passes acceptRenderQueueRisk: true.

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AMBIENT_CONTEXT_JSX, getOp } from "../src/registry.js";
import { doTool } from "../src/tools/do.js";
import "../src/operations/index.js";
import "../src/operations/eval.js";
import { FakeAe } from "./helpers/fake-ae.js";
import { nullTransport } from "./helpers/null-transport.js";

type Rollback = {
  attempted: boolean;
  rolledBack: boolean;
  reason: string | null;
  left: string | null;
  next?: string | null;
  addedItems?: Array<{ id: number; name: string }>;
  renderQueue?: { changedInRequest: boolean | null; sessionFlag: unknown };
};

let ae: FakeAe;
beforeEach(() => {
  ae = new FakeAe();
  ae.userStep("USER_COMP");
});

const savedEval = process.env.AE_MCP_ENABLE_EVAL;
beforeEach(() => {
  process.env.AE_MCP_ENABLE_EVAL = "1";
});
afterEach(() => {
  if (savedEval === undefined) delete process.env.AE_MCP_ENABLE_EVAL;
  else process.env.AE_MCP_ENABLE_EVAL = savedEval;
});

/** A request that touches the render queue the way render.list_templates does: add, then remove. */
const ADD_AND_REMOVE_RQ =
  "var c = app.project.item(1); var q = app.project.renderQueue.items.add(c); q.remove(); return 1;";

function undoOp(name: string, args: Record<string, unknown>, options: { label?: string } = {}) {
  const jsx = getOp(name)!.toJsx(args);
  return ae.serve(options.label ?? name, `return (function() { ${jsx} })();`, {
    undoGroup: false,
    suppressDialogs: true,
    label: name,
  });
}

describe("a request that changed the render queue and then threw", () => {
  it("is not undone, and the report names the render queue and what is still applied", () => {
    const res = ae.serve(
      "r1",
      "app.project.items.addComp('PART'); app.project.renderQueue.items.add(app.project.item(1)); throw new Error('x');",
      { rollback: true },
    );
    const rb = res.rollback as Rollback;

    expect(ae.commands).toEqual([]);
    expect(rb).toMatchObject({ attempted: false, rolledBack: false });
    expect(rb.reason).toMatch(/render queue/);
    expect(rb.reason).toMatch(/crash recovery/);
    expect(rb.left).toMatch(/still applied/);
    expect(rb.addedItems).toEqual([{ id: expect.any(Number), name: "PART" }]);
    expect(rb.next).toMatch(/addedItems/);
    expect(rb.renderQueue?.changedInRequest).toBe(true);
    // No marker either: it would have been left behind.
    expect(ae.names()).toEqual(["USER_COMP", "PART"]);
  });

  it("counts a render-queue status change (a render) as a change", () => {
    ae.addRenderQueueItem(ae.items[0]);
    const res = ae.serve("r2", "app.project.renderQueue.render(); throw new Error('after render');", {
      rollback: true,
    });
    expect(ae.commands).toEqual([]);
    expect((res.rollback as Rollback).reason).toMatch(/render queue/);
  });

  it("is not undone even with acceptRenderQueueRisk (that only lifts the session block)", () => {
    const res = ae.serve(
      "r3",
      "app.project.renderQueue.items.add(app.project.item(1)); throw new Error('x');",
      { rollback: true, acceptRenderQueueRisk: true },
    );
    expect(ae.commands).toEqual([]);
    expect((res.rollback as Rollback).rolledBack).toBe(false);
  });
});

describe("the session flag", () => {
  it("is set by a request that leaves the render queue changed, even one that succeeds", () => {
    ae.serve("f1", ADD_AND_REMOVE_RQ.replace("q.remove(); ", ""), { rollback: true });
    expect(ae.engineGlobal.AE_MCP_SESSION).toMatchObject({
      renderQueueChanged: { by: "test" },
    });
  });

  it("is not set by a request that only reads the render queue", () => {
    ae.addRenderQueueItem(ae.items[0]);
    ae.serve("f2", "return app.project.renderQueue.numItems;", { rollback: true });
    const session = ae.engineGlobal.AE_MCP_SESSION as { renderQueueChanged?: unknown } | undefined;
    expect(session?.renderQueueChanged ?? null).toBeNull();
  });

  it("is set by add-and-remove of a temporary item: the queue looks the same, but the history holds the change", () => {
    // render.list_templates' pattern, which preceded the second incident.
    ae.serve("f3", ADD_AND_REMOVE_RQ, { rollback: true });
    const session = ae.engineGlobal.AE_MCP_SESSION as { renderQueueChanged?: unknown } | undefined;
    expect(session?.renderQueueChanged ?? null).not.toBeNull();
  });

  it("blocks a later rollback, and says how to lift it", () => {
    ae.serve("f4", ADD_AND_REMOVE_RQ, { rollback: true });
    const res = ae.serve("f5", "app.project.items.addComp('LATER'); throw new Error('x');", { rollback: true });
    const rb = res.rollback as Rollback;
    expect(ae.commands).toEqual([]);
    expect(rb.rolledBack).toBe(false);
    expect(rb.reason).toMatch(/earlier in this After Effects session/);
    expect(rb.reason).toMatch(/acceptRenderQueueRisk/);
    expect(ae.names()).toContain("LATER");
  });

  it("lets a rollback through with acceptRenderQueueRisk", () => {
    ae.serve("f6", ADD_AND_REMOVE_RQ, { rollback: true });
    const res = ae.serve("f7", "app.project.items.addComp('LATER'); throw new Error('x');", {
      rollback: true,
      acceptRenderQueueRisk: true,
    });
    expect((res.rollback as Rollback).rolledBack).toBe(true);
    expect(ae.names()).not.toContain("LATER");
  });

  it("makes project.undo, project.redo and the undo/redo menu commands refuse", () => {
    ae.serve("f8", ADD_AND_REMOVE_RQ, { rollback: true });
    for (const [name, args] of [
      ["project.undo", {}],
      ["project.redo", {}],
      ["command.execute", { id: 16 }],
      ["command.execute", { id: 2035 }],
    ] as const) {
      const r = undoOp(name, args).result as { ok: boolean; refused?: boolean; error: string };
      expect(r.ok, name).toBe(false);
      expect(r.refused, name).toBe(true);
      expect(r.error, name).toMatch(/render queue/);
      expect(r.error, name).toMatch(/crash recovery/);
      expect(r.error, name).toMatch(/acceptRenderQueueRisk: true/);
    }
    expect(ae.commands).toEqual([]);
  });

  it("lets project.undo through with acceptRenderQueueRisk: true", () => {
    ae.serve("f9", ADD_AND_REMOVE_RQ, { rollback: true });
    const r = undoOp("project.undo", { acceptRenderQueueRisk: true }).result as { ok: boolean };
    expect(r.ok).toBe(true);
    expect(ae.commands).toHaveLength(1);
  });

  it("is cleared by project.open and project.new", () => {
    for (const op of ["project.open", "project.new"]) {
      ae.serve(`c-${op}`, ADD_AND_REMOVE_RQ, { rollback: true });
      expect(getOp(op)!.toJsx({ path: "/x.aep" })).toContain("AE_MCP.clearRenderQueueRisk(");
      // What the op's JSX does once the new project is in place:
      ae.serve(`o-${op}`, `AE_MCP.clearRenderQueueRisk(${JSON.stringify(op)}); return 1;`, {
        undoGroup: false,
        label: op,
      });
      const session = ae.engineGlobal.AE_MCP_SESSION as { renderQueueChanged?: unknown };
      expect(session.renderQueueChanged ?? null, op).toBeNull();
    }
  });

  it("does not come back on the request that opened the project, whose queue differs from the old one", () => {
    ae.serve("g1", ADD_AND_REMOVE_RQ, { rollback: true });
    ae.addRenderQueueItem(ae.items[0]);
    ae.serve(
      "g2",
      "app.project.renderQueue.item(1).remove(); AE_MCP.clearRenderQueueRisk('project.open'); return 1;",
      { undoGroup: false, label: "project.open" },
    );
    const session = ae.engineGlobal.AE_MCP_SESSION as { renderQueueChanged?: unknown };
    expect(session.renderQueueChanged ?? null).toBeNull();
  });

  it("shows up in ae_do's ambient context", () => {
    // AMBIENT_CONTEXT_JSX is what every ae_do call appends to its code.
    expect(AMBIENT_CONTEXT_JSX).toContain("AE_MCP_SESSION");
    expect(AMBIENT_CONTEXT_JSX).toContain("_ctx.undoBlocked");
  });
});

describe("ae_do", () => {
  it("takes acceptRenderQueueRisk on eval.run, batch.run and the undo operations and sends it", async () => {
    const t = nullTransport({ result: { result: { ok: true }, context: {} } });
    await doTool.handler({ operation: "eval.run", args: { code: "return 1;", acceptRenderQueueRisk: true } }, t);
    await doTool.handler({ operation: "batch.run", args: { ops: [], acceptRenderQueueRisk: true } }, t);
    await doTool.handler({ operation: "project.undo", args: { acceptRenderQueueRisk: true } }, t);
    await doTool.handler({ operation: "project.redo", args: { acceptRenderQueueRisk: true } }, t);
    await doTool.handler({ operation: "command.execute", args: { id: 16, acceptRenderQueueRisk: true } }, t);
    await doTool.handler({ operation: "layer.create_null", args: { comp: "Main" } }, t);
    expect(t.calls.map((c) => c.acceptRenderQueueRisk)).toEqual([true, true, true, true, true, false]);
    expect(t.calls[2].code).toContain("AE_MCP.undoRedo(16, 1, true)");
  });

  it("render operations carry the warning", () => {
    for (const name of ["render.start", "render.add_to_queue", "render.remove_item", "render.list_templates"]) {
      expect(getOp(name)!.description, name).toMatch(/crash recovery/);
      expect(getOp(name)!.description, name).toMatch(/undo/);
    }
  });
});

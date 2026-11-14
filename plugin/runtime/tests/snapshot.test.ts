// Snapshots (stage 7): a numbered copy of the project before a risky change,
// and a restore that reopens it, without undo. Nothing here reaches After
// Effects: the fake keeps the open project's file and dirty flag.

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import "../src/operations/index.js";
import { runRestore, runSnapshot, type SnapshotIO } from "../src/operations/project.js";
import { getOp } from "../src/registry.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

let dir: string;
let file: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-snap-"));
  file = path.join(dir, "piece.aep");
  await fs.writeFile(file, "v1");
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

function fakeAe(state: { file: string | null; dirty: boolean }): SnapshotIO & { calls: string[]; state: Any } {
  const calls: string[] = [];
  return {
    calls,
    state,
    execute: async (code: string, opts: Any) => {
      calls.push(opts.label);
      if (/state/.test(opts.label)) return { ok: true, file: state.file, dirty: state.dirty };
      if (/save as/.test(opts.label)) {
        const target = JSON.parse(/new File\((".*?")\)/.exec(code)![1]);
        await fs.writeFile(target, "unsaved state");
        state.file = target;
        state.dirty = false;
        return { ok: true, file: target, dirty: false };
      }
      if (/close/.test(opts.label)) {
        state.file = null;
        return { ok: true };
      }
      if (/open/.test(opts.label)) {
        const target = JSON.parse(/new File\((".*?")\)/.exec(code)![1]);
        state.file = target;
        state.dirty = false;
        return { ok: true, file: target, dirty: false, content: await fs.readFile(target, "utf8") };
      }
      return { ok: false, error: "unexpected " + opts.label };
    },
  };
}

describe("project.snapshot", () => {
  it("copies a saved project to a numbered file beside it, without touching After Effects' open project", async () => {
    const io = fakeAe({ file, dirty: false });
    const a = await runSnapshot({ label: "before the grade" }, io);
    expect(a.ok).toBe(true);
    expect(a.number).toBe(1);
    expect(a.path).toBe(path.join(dir, "piece snapshots", "piece_snapshot_001.aep"));
    expect(await fs.readFile(a.path, "utf8")).toBe("v1");
    expect(io.calls).toEqual(["project.snapshot state"]);
    const b = await runSnapshot({}, io);
    expect(b.number).toBe(2);
    const index = JSON.parse(await fs.readFile(path.join(dir, "piece snapshots", "snapshots.json"), "utf8"));
    expect(index.map((s: Any) => s.label)).toEqual(["before the grade", null]);
    expect(io.state.file).toBe(file);
  });

  it("refuses with unsaved changes, naming the two ways on, and saves the snapshot as asked", async () => {
    const io = fakeAe({ file, dirty: true });
    const r = await runSnapshot({}, io);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/unsaved changes/);
    expect(r.error).toMatch(/save-as-snapshot/);
    const s = await runSnapshot({ unsaved: "save-as-snapshot" }, io);
    expect(s.ok).toBe(true);
    expect(await fs.readFile(s.path, "utf8")).toBe("unsaved state");
    expect(await fs.readFile(file, "utf8")).toBe("v1");
    expect(s.openFile).toBe(s.path);
    expect(s.note).toMatch(/now has the snapshot open/);
  });

  it("keeps an .aepx project's extension, and a user folder ending in ' snapshots' is not mistaken for one", async () => {
    const own = path.join(dir, "client snapshots");
    await fs.mkdir(own);
    const x = path.join(own, "cut.aepx");
    await fs.writeFile(x, "<xml/>");
    const s = await runSnapshot({}, fakeAe({ file: x, dirty: false }));
    expect(s.ok).toBe(true);
    expect(s.path).toBe(path.join(own, "cut snapshots", "cut_snapshot_001.aepx"));
  });

  it("refuses a project that was never saved", async () => {
    const r = await runSnapshot({}, fakeAe({ file: null, dirty: true }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/never been saved/);
  });

  it("is registered, and project.restore with it", () => {
    expect(getOp("project.snapshot")!.run).toBeTypeOf("function");
    expect(getOp("project.restore")!.run).toBeTypeOf("function");
  });
});

describe("project.restore", () => {
  it("puts snapshot N back in the project's own file and reopens it, after a snapshot of the current state", async () => {
    const io = fakeAe({ file, dirty: false });
    await runSnapshot({}, io);
    await fs.writeFile(file, "v2");
    const r = await runRestore({ number: 1 }, io);
    expect(r.ok).toBe(true);
    expect(await fs.readFile(file, "utf8")).toBe("v1");
    expect(io.state.file).toBe(file);
    expect(r.before.number).toBe(2);
    expect(await fs.readFile(r.before.path, "utf8")).toBe("v2");
    expect(io.calls.filter((c) => /close/.test(c))).toHaveLength(1);
  });

  it("refuses over unsaved changes unless told to discard them, and refuses a missing number", async () => {
    const io = fakeAe({ file, dirty: false });
    await runSnapshot({}, io);
    io.state.dirty = true;
    const r = await runRestore({ number: 1 }, io);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/unsaved changes/);
    expect((await runRestore({ number: 1, discardUnsaved: true }, io)).ok).toBe(true);
    const missing = await runRestore({ number: 9 }, io);
    expect(missing.ok).toBe(false);
    expect(missing.error).toMatch(/no snapshot 9/);
  });

  it("refuses when the open project is itself a snapshot", async () => {
    const io = fakeAe({ file, dirty: true });
    const s = await runSnapshot({ unsaved: "save-as-snapshot" }, io);
    const r = await runRestore({ number: s.number }, io);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/is itself a snapshot/);
  });
});

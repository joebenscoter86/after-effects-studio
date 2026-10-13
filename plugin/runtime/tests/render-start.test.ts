import { describe, expect, it } from "vitest";

import "../src/operations/index.js";
import { getOp } from "../src/registry.js";

type DiskFile = { bytes: number; modifiedMs: number };
type QueueItem = {
  render: boolean;
  status: string;
  numOutputModules: number;
  outputModule(index: number): { file: { fsName: string } | null };
};

function startRender(items: QueueItem[], disk: Map<string, DiskFile>, render: () => void) {
  const code = getOp("render.start")!.toJsx({});
  const queue = { numItems: items.length, item: (index: number) => items[index - 1], render };
  const MockFile = class {
    constructor(readonly path: string) {}
    get exists() { return disk.has(this.path); }
    get length() { return disk.get(this.path)?.bytes ?? 0; }
    get modified() {
      const ms = disk.get(this.path)?.modifiedMs;
      return ms === undefined ? null : new Date(ms);
    }
  };
  const run = new Function("app", "AE", "RQItemStatus", "File", code) as (
    app: { project: { renderQueue: typeof queue } },
    AE: { ensureParentDir: (file: unknown) => void },
    RQItemStatus: { QUEUED: string; DONE: string },
    File: typeof MockFile,
  ) => { ok: boolean; rendered: number; error?: string; items?: Array<{ verified: boolean }> };
  return run(
    { project: { renderQueue: queue } },
    { ensureParentDir: () => {} },
    { QUEUED: "QUEUED", DONE: "DONE" },
    MockFile,
  );
}

function item(status: string, path: string): QueueItem {
  return {
    render: true,
    status,
    numOutputModules: 1,
    outputModule: () => ({ file: { fsName: path } }),
  };
}

describe("render.start output evidence", () => {
  it("does not report a completed queue item as a new render", () => {
    const disk = new Map([["old.mov", { bytes: 100, modifiedMs: 1 }]]);
    let called = false;
    const result = startRender([item("DONE", "old.mov")], disk, () => { called = true; });
    expect(result).toMatchObject({ ok: false, rendered: 0 });
    expect(called).toBe(false);
  });

  it("counts a fresh queued output, excluding an already completed item", () => {
    const disk = new Map([["old.mov", { bytes: 100, modifiedMs: 1 }]]);
    const fresh = item("QUEUED", "new.mov");
    const result = startRender([item("DONE", "old.mov"), fresh], disk, () => {
      disk.set("new.mov", { bytes: 200, modifiedMs: 2 });
      fresh.status = "DONE";
    });
    expect(result).toMatchObject({ ok: true, rendered: 1 });
    expect(result.items).toHaveLength(1);
    expect(result.items?.[0]).toMatchObject({ verified: true });
  });

  it("fails when AE marks a queued item done but leaves its output absent", () => {
    const disk = new Map<string, DiskFile>();
    const queued = item("QUEUED", "missing.mov");
    const result = startRender([queued], disk, () => { queued.status = "DONE"; });
    expect(result).toMatchObject({ ok: false, rendered: 0 });
    expect(result.items?.[0]).toMatchObject({ verified: false });
  });

  it("does not accept an unchanged preexisting file as render evidence", () => {
    const disk = new Map([["same.mov", { bytes: 100, modifiedMs: 1 }]]);
    const queued = item("QUEUED", "same.mov");
    const result = startRender([queued], disk, () => { queued.status = "DONE"; });
    expect(result).toMatchObject({ ok: false, rendered: 0 });
  });

  it("rejects an empty output even when AE reports DONE", () => {
    const disk = new Map<string, DiskFile>();
    const queued = item("QUEUED", "empty.mov");
    const result = startRender([queued], disk, () => {
      disk.set("empty.mov", { bytes: 0, modifiedMs: 2 });
      queued.status = "DONE";
    });
    expect(result).toMatchObject({ ok: false, rendered: 0 });
  });

  it("rejects an item without an output path before invoking AE", () => {
    const queued = item("QUEUED", "unused.mov");
    queued.outputModule = () => ({ file: null });
    let called = false;
    const result = startRender([queued], new Map(), () => { called = true; });
    expect(result).toMatchObject({ ok: false, rendered: 0 });
    expect(result.error).toContain("has no output path");
    expect(called).toBe(false);
  });

  it("accepts a changed nonempty file when an output path is reused", () => {
    const disk = new Map([["same.mov", { bytes: 100, modifiedMs: 1 }]]);
    const queued = item("QUEUED", "same.mov");
    const result = startRender([queued], disk, () => {
      disk.set("same.mov", { bytes: 220, modifiedMs: 2 });
      queued.status = "DONE";
    });
    expect(result).toMatchObject({ ok: true, rendered: 1 });
  });
});

// subject.render_cutout in halves (first production use, 2026-11-12): a
// whole 43.5 s piece was rendered as frames 600 to 1304, then 0 to 599, with
// After Effects' disk cache emptied between, and the halves joined by a
// stream copy. `from` and `to` (comp seconds, clipped to the layer) render one
// span; the JSX it sends is read here. The render queue is faked: nothing
// reaches After Effects.

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import "../src/operations/index.js";
import { cutoutSpan, HALVES_JOIN_NOTE, runRenderCutout } from "../src/operations/keying.js";
import { getOp } from "../src/registry.js";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const PLAN = {
  ok: true,
  layer: "take.mov",
  keep: ["take.mov"],
  span: { start: 0, duration: 43.5, frames: 1305, frameRate: 30 },
  compSize: [1088, 1920],
  sourceSize: [1088, 1920],
  aeCache: { folder: null, version: "27.0x52" },
  templates: { output: ["High Quality with Alpha"], render: ["Best Settings"] },
};

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-cutout-halves-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

function io() {
  const calls: Any[] = [];
  return {
    calls,
    execute: async (code: string, opts: Any) => {
      calls.push({ code, ...opts });
      if (/plan/.test(opts.label)) return PLAN;
      return {
        ok: true,
        outputPath: path.join(dir, "half.mov"),
        frameCount: 0,
        renderSeconds: 130,
        restored: true,
        audio: {},
        warnings: [],
      };
    },
    render: async () => ({ ok: false, error: "not used" }),
    readImage: async () => {
      throw new Error("not used");
    },
    freeBytes: async () => 500e9,
  } as Any;
}

const spanOf = (code: string) => ({
  start: Number(/_rqi\.timeSpanStart = ([\d.]+);/.exec(code)![1]),
  duration: Number(/_rqi\.timeSpanDuration = ([\d.]+);/.exec(code)![1]),
});

describe("subject.render_cutout from / to", () => {
  it("renders the second half first, frames 600 to 1304, and says how the halves are joined", async () => {
    const f = io();
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "b.mov"), from: 20, to: 43.5 },
      f,
    );
    expect(res.ok).toBe(true);
    const sent = spanOf(f.calls[1].code);
    expect(sent.start).toBe(20);
    expect(sent.duration).toBeCloseTo(23.5, 9);
    expect(f.calls[1].timeoutMs).toBe(120_000 + 705 * 5_000);
    expect(res.span).toMatchObject({
      firstFrame: 600,
      lastFrame: 1304,
      frames: 705,
      clipped: false,
      whole: false,
    });
    expect(res.span.reading).toMatch(/frames 600 to 1304/);
    expect(res.halves).toBe(HALVES_JOIN_NOTE);
    expect(res.halves).toMatch(/ffmpeg -f concat -safe 0 -i halves\.txt -c copy whole\.mov/);
    expect(res.halves).toMatch(/Empty After Effects' disk cache between the halves/);
    expect(res.halves).toMatch(/frames 600 to 1304, then 0 to 599.*0\.002 of the frame/);
    const sidecar = JSON.parse(
      await fs.readFile(path.join(dir, "half.mov.comp-room.json"), "utf8"),
    );
    expect(sidecar.span).toMatchObject({ firstFrame: 600, lastFrame: 1304 });
  });

  it("renders the first half, frames 0 to 599, and clips a span that reaches past the layer", async () => {
    const f = io();
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "a.mov"), from: -5, to: 20 },
      f,
    );
    expect(spanOf(f.calls[1].code)).toEqual({ start: 0, duration: 20 });
    expect(res.span).toMatchObject({ firstFrame: 0, lastFrame: 599, frames: 600, clipped: true });
    expect(res.span.reading).toMatch(/clipped/);
  });

  it("renders the whole span as before without from / to, and says nothing of halves", async () => {
    const f = io();
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "w.mov") },
      f,
    );
    expect(spanOf(f.calls[1].code)).toEqual({ start: 0, duration: 43.5 });
    expect(res.span).toBeUndefined();
    expect(res.halves).toBeUndefined();
  });

  it("refuses a span that is empty or outside the layer, before rendering", async () => {
    for (const [from, to, why] of [
      [30, 20, /must be after/],
      [50, 60, /outside the layer/],
      ["10", 20, /must be a number/],
    ] as const) {
      const f = io();
      const res = await runRenderCutout(
        { comp: "Main", layer: 1, outputPath: path.join(dir, "x.mov"), from, to },
        f,
      );
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(why);
      expect(f.calls).toHaveLength(1);
    }
  });

  it("snaps to frames, and lists from and to among the operation's parameters", () => {
    expect(cutoutSpan({ start: 0, duration: 43.5, frameRate: 30 }, 20.01, 43.5)).toMatchObject({
      start: 20,
      firstFrame: 600,
    });
    const params = getOp("subject.render_cutout")!.params.map((p) => p.name);
    expect(params).toEqual(expect.arrayContaining(["from", "to"]));
    expect(getOp("subject.render_cutout")!.description).toContain(HALVES_JOIN_NOTE);
  });
});

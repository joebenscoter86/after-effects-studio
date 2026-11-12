// Watching motion (agent-eyes plan, stage 4): frame differences (`diff`), the
// `strip` shortcut and the series flags. The pure functions in color/motion.ts
// are tested on numbers and on the synthetic motion-* fixtures; the tool
// options go through the real ae_render_frame handler with an in-process fake
// transport, so nothing here can reach After Effects.
//
// The done-when for the stage: the stutter and the pop each show as a flagged
// pair, while the smooth move and the noise-only series do not.

import { promises as fs, readFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  DIFF_DEFAULTS,
  diffArgsError,
  pictureChange,
  pictureOf,
  resolveDiffThresholds,
  summarizeSeries,
} from "../src/color/motion.js";
import { decodePng } from "../src/color/png16.js";
import { renderFrameTool } from "../src/tools/render-frame.js";
import type { AeTransport, EvalRequest, EvalResult } from "../src/transport/AeTransport.js";

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "png");
const load = (name: string) => decodePng(readFileSync(path.join(FIXTURES, name)));

const smooth = (k: number) => `motion-smooth-${k}.png`;
const SMOOTH = [0, 1, 2, 3, 4, 5, 6, 7].map(smooth);
const STUTTER = [0, 1, 2, 3, 3, 5, 6, 7].map(smooth);
const POP = [0, 1, 2, 3].map(smooth).concat(["motion-pop-4.png"], [5, 6, 7].map(smooth));
const CUT = [0, 1, 2, 3].map(smooth).concat([4, 5, 6, 7].map((k) => `motion-cut-${k}.png`));
const NOISE = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => `motion-noise-${k}.png`);
const TIMES = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => k / 25);

// ---------------------------------------------------------------------------
// The series flags, on numbers alone
// ---------------------------------------------------------------------------

const t = resolveDiffThresholds();
const series = (changes: number[], share = 0.02) =>
  summarizeSeries(
    changes.map((change, i) => ({
      from: { index: i, time: i / 25 },
      to: { index: i + 1, time: (i + 1) / 25 },
      change,
      changedShare: change === 0 ? 0 : share,
    })),
    t,
  );
const kinds = (s: ReturnType<typeof series>) => s.flags.map((f) => f.kind);

describe("summarizeSeries", () => {
  it("flags nothing in a steady move", () => {
    const s = series([0.008, 0.008, 0.008, 0.008, 0.008, 0.008, 0.008]);
    expect(s.flags).toEqual([]);
    expect(s.median).toBeCloseTo(0.008, 6);
    expect(s.largest.change).toBeCloseTo(0.008, 6);
  });

  it("flags a repeated frame between moving neighbours as a stutter on that pair", () => {
    const s = series([0.008, 0.008, 0.008, 0, 0.016, 0.008, 0.008]);
    expect(kinds(s)).toEqual(["stutter"]);
    expect(s.flags[0].pairs).toEqual([3]);
    expect(s.flags[0].unreliablePairs).toEqual([2, 4]);
    expect(s.flags[0].frame).toEqual({ index: 4, time: 4 / 25 });
  });

  it("flags two neighbouring spikes as a one-frame pop of the frame they share", () => {
    const s = series([0.008, 0.008, 0.008, 0.048, 0.048, 0.008, 0.008]);
    expect(kinds(s)).toEqual(["pop"]);
    expect(s.flags[0].pairs).toEqual([3, 4]);
    expect(s.flags[0].frame).toEqual({ index: 4, time: 4 / 25 });
    expect(s.flags[0].ratio).toBeGreaterThan(t.spikeRatio);
  });

  it("flags one spike between ordinary pairs as a cut", () => {
    const s = series([0.008, 0.008, 0.008, 0.15, 0.006, 0.006, 0.006]);
    expect(kinds(s)).toEqual(["cut"]);
    expect(s.flags[0].pairs).toEqual([3]);
  });

  it("flags nothing when the change is grain alone", () => {
    expect(series([0.013, 0.014, 0.012, 0.013, 0.015, 0.013, 0.012], 0).flags).toEqual([]);
  });

  it("does not call a move starting from rest, or coming to rest, a cut or a stutter", () => {
    expect(series([0, 0, 0, 0.008, 0.008, 0.008, 0.008]).flags).toEqual([]);
    expect(series([0.008, 0.008, 0.008, 0, 0, 0, 0]).flags).toEqual([]);
  });

  it("does not let a pop's spikes turn the ordinary pair beside them into a stutter", () => {
    expect(kinds(series([0.048, 0.048, 0.008]))).not.toContain("stutter");
  });

  it("marks a spike on the first or last pair as being at the edge of the series", () => {
    const s = series([0.15, 0.008, 0.008, 0.008]);
    expect(kinds(s)).toEqual(["cut"]);
    expect(s.flags[0].atSeriesEdge).toBe(true);
  });

  it("takes caller thresholds", () => {
    const strict = summarizeSeries(
      [0.008, 0.008, 0.008, 0.048, 0.048, 0.008, 0.008].map((change, i) => ({
        from: { index: i, time: undefined },
        to: { index: i + 1, time: undefined },
        change,
        changedShare: 0.02,
      })),
      resolveDiffThresholds({ spikeRatio: 10 }),
    );
    expect(strict.flags).toEqual([]);
  });

  it("does not measure a pair against a repeated frame beside it, and flags the repeat", () => {
    // Found live: the first pair (0.019) read as a cut because its only
    // neighbour was a repeated frame (change exactly 0).
    const s = series([0.019, 0]);
    expect(kinds(s)).toEqual(["repeat"]);
    expect(s.flags[0].pairs).toEqual([1]);
    expect(s.flags[0].frame).toEqual({ index: 2, time: 2 / 25 });
    expect(s.flags[0].unreliablePairs).toEqual([0]);
    expect(s.flags[0].reading).toMatch(/unreliable/);
  });

  it("reads rounded times that repeat every third frame as stutters, not cuts", () => {
    const n = 0.006;
    const s = series([n, n, 0, 2 * n, n, 0, 2 * n, n]);
    expect(kinds(s)).toEqual(["stutter", "stutter"]);
    expect(s.flags[0].pairs).toEqual([2]);
    expect(s.flags[0].unreliablePairs).toEqual([1, 3]);
    expect(s.flags[1].pairs).toEqual([5]);
  });

  it("still finds a cut beside a repeat, against the pairs that are not repeats, and says so", () => {
    const s = series([0.006, 0.006, 0, 0.15, 0.006, 0.006]);
    expect(kinds(s)).toEqual(["stutter", "cut"]);
    const cut = s.flags[1];
    expect(cut.pairs).toEqual([3]);
    expect(cut.reference).toBeCloseTo(0.006, 6);
    expect(cut.besideRepeat).toBe(true);
    expect(cut.reading).toMatch(/repeated frame/);
  });

  it("flags nothing in a still series where every pair repeats", () => {
    expect(series([0, 0, 0, 0], 0).flags).toEqual([]);
  });

  it("counts a pair as a repeat up to repeatBelow", () => {
    expect(DIFF_DEFAULTS.repeatBelow).toBe(0.0001);
    const near = series([0.019, 0.00005]);
    expect(kinds(near)).toEqual(["repeat"]);
    const strict = summarizeSeries(
      [0.019, 0.00005].map((change, i) => ({
        from: { index: i, time: undefined },
        to: { index: i + 1, time: undefined },
        change,
        changedShare: 0.02,
      })),
      resolveDiffThresholds({ repeatBelow: 0 }),
    );
    expect(strict.flags.map((f) => f.kind)).not.toContain("repeat");
  });

  it("reports a jump two frames before a larger cut, not only the larger one", () => {
    // Found on a real comp (pro finish stage 2): two stray frames of another take
    // (123, 124) before the real cut at 125. Pair changes measured with diff at full
    // size; the piece's median pair change is 0.0037. Only 124→125 was flagged: the
    // pairs after 122→123 are 0.0106, 0.0881, 0.0079, whose median (0.0106) the
    // larger jump pulls up, so 0.0309 read as 2.9×, under spikeRatio.
    const q = 0.0037;
    const real = series([q, q, q, q, q, 0.030916, 0.010602, 0.088058, 0.007895, 0.008805, 0.0082, 0.0085]);
    expect(real.flags.map((f) => [f.kind, f.pairs[0]])).toEqual([["cut", 5], ["cut", 7]]);
    expect(real.flags[0].ratio).toBeGreaterThan(t.spikeRatio);
    // The same shape in round numbers: a jump, one ordinary pair, a larger jump.
    const synthetic = series([0.004, 0.004, 0.004, 0.004, 0.03, 0.011, 0.09, 0.008, 0.008, 0.008]);
    expect(synthetic.flags.map((f) => [f.kind, f.pairs[0]])).toEqual([["cut", 4], ["cut", 6]]);
  });

  it("does not call ordinary motion beside a cut a second cut", () => {
    const q = 0.004;
    const after = series([q, q, q, q, 0.09, 1.5 * q, 1.5 * q, 1.5 * q, 1.5 * q, 1.5 * q]);
    expect(after.flags.map((f) => [f.kind, f.pairs[0]])).toEqual([["cut", 4]]);
    const before = series([1.5 * q, 1.5 * q, 1.5 * q, 1.5 * q, 0.09, q, q, q, q]);
    expect(before.flags.map((f) => [f.kind, f.pairs[0]])).toEqual([["cut", 4]]);
    // Nor a pair just under the ratio beside two cuts.
    const between = series([q, q, q, q, 0.09, 2.5 * q, 0.09, q, q, q]);
    expect(between.flags.map((f) => f.kind)).toEqual(["cut", "cut"]);
  });

  it("reports a single pair without flags (nothing to stand out from)", () => {
    const s = series([0.2]);
    expect(s.pairs).toBe(1);
    expect(s.flags).toEqual([]);
  });
});

describe("diff thresholds", () => {
  it("has documented defaults", () => {
    expect(DIFF_DEFAULTS).toMatchObject({
      changeAbove: 0.04,
      spikeRatio: 3,
      holdRatio: 0.25,
      quietBelow: 0.002,
      movingShare: 0.0005,
      window: 3,
      amplify: 8,
      repeatBelow: 0.0001,
    });
  });

  it("refuses values out of range", () => {
    expect(diffArgsError({ spikeRatio: 1 })).toMatch(/spikeRatio/);
    expect(diffArgsError({ holdRatio: 1.5 })).toMatch(/holdRatio/);
    expect(diffArgsError({ window: 0 })).toMatch(/window/);
    expect(diffArgsError({ nonsense: 1 })).toMatch(/nonsense/);
    expect(diffArgsError({ spikeRatio: 4 })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// One pair of pictures
// ---------------------------------------------------------------------------

describe("pictureChange", () => {
  it("measures the mean absolute change, the changed share and where it changed", () => {
    const a = load(smooth(0));
    const b = load(smooth(1));
    const res = pictureChange(pictureOf(a, false), pictureOf(b, false), 64, 48, t);
    // The 10×10 square moves 4 px: 4 columns uncovered, 4 covered, 80 pixels
    // changing by (0.6, 0.2, 0.15) between orange and the background.
    expect(res.all.pixels).toBe(64 * 48);
    expect(res.all.changedPixels).toBe(80);
    expect(res.all.changedShare).toBeCloseTo(80 / 3072, 4);
    expect(res.all.change).toBeCloseTo((80 * ((0.6 + 0.2 + 0.15) / 3)) / 3072, 3);
    expect(res.all.maxAbsDelta).toBeCloseTo(0.6, 2);
    expect(res.all.changedBounds).toEqual({ x: 6, y: 19, width: 14, height: 10 });
  });

  it("reads zero between identical frames", () => {
    const a = pictureOf(load(smooth(3)), false);
    const res = pictureChange(a, a, 64, 48, t);
    expect(res.all.change).toBe(0);
    expect(res.all.changedPixels).toBe(0);
    expect(res.all.changedBounds).toBeNull();
  });

  it("splits the change by named regions", () => {
    const res = pictureChange(
      pictureOf(load(smooth(3)), false),
      pictureOf(load("motion-pop-4.png"), false),
      64,
      48,
      t,
      {
        regions: [
          { name: "left", x: 0, y: 0, width: 32, height: 48 },
          { name: "right", x: 32, y: 0, width: 32, height: 48 },
          { name: "gone", x: 500, y: 0, width: 4, height: 4 },
        ],
      },
    );
    const [left, right, gone] = res.regions!;
    expect(left).toMatchObject({ name: "left", pixels: 32 * 48 });
    expect(right).toMatchObject({ name: "right", changedPixels: 14 * 14 });
    expect((right as { change: number }).change).toBeGreaterThan(
      (left as { change: number }).change,
    );
    expect(gone).toMatchObject({ name: "gone" });
    expect((gone as { error: string }).error).toMatch(/outside/);
  });

  it("weights straight colour by alpha, so colour under transparent pixels does not count", () => {
    const img = load("keyed-rgba16.png");
    const pic = pictureOf(img, true);
    // (0, 0) is the screen: straight green at alpha 0 → nothing.
    expect([pic[0], pic[1], pic[2]]).toEqual([0, 0, 0]);
    // x 24 is the soft edge at alpha 0.5.
    const i = (6 * 32 + 24) * 3;
    expect(pic[i]).toBeCloseTo(0.4, 3);
  });

  it("builds an amplified grey thumbnail of the change", () => {
    const res = pictureChange(
      pictureOf(load(smooth(0)), false),
      pictureOf(load(smooth(1)), false),
      64,
      48,
      t,
      { thumb: { width: 32, height: 24 } },
    );
    const thumb = res.thumb!;
    expect(thumb.length).toBe(32 * 24);
    // A 2×2 block where every pixel changed by mean 0.317 → ×8, clipped to 1.
    expect(thumb[12 * 32 + 3]).toBe(1);
    expect(thumb[0]).toBe(0);
  });

  it("keeps a 1080×1920 pair fast", () => {
    const n = 1080 * 1920;
    const a = new Float32Array(n * 3);
    const b = new Float32Array(n * 3);
    for (let i = 0; i < b.length; i++) b[i] = (i % 7) / 7;
    pictureChange(a, b, 1080, 1920, t); // warm up
    const start = performance.now();
    pictureChange(a, b, 1080, 1920, t, { thumb: { width: 270, height: 480 } });
    expect(performance.now() - start).toBeLessThan(400);
  });
});

// ---------------------------------------------------------------------------
// Through the tool
// ---------------------------------------------------------------------------

interface FakeTransport extends AeTransport {
  calls: EvalRequest[];
}

const FPS = 25;

/** Fake AE: copies fixtures[i] to the i-th requested path; None working space; grey comp. */
function fakeAe(fixtures: string[]): FakeTransport {
  const calls: EvalRequest[] = [];
  return {
    calls,
    async execute(req: EvalRequest): Promise<EvalResult> {
      calls.push(req);
      const paths = JSON.parse(/var _paths = (.*);/.exec(req.code)![1]) as string[];
      let times = JSON.parse(/var _times = (.*);/.exec(req.code)![1]) as number[] | null;
      const strip = JSON.parse(/var _strip = (.*);/.exec(req.code)![1]) as {
        at: number;
        offsets: number[];
      } | null;
      if (times === null && strip !== null)
        times = strip.offsets.map((o) => Math.round(strip.at * FPS + o) / FPS);
      const frames = [];
      for (const [i, p] of paths.entries()) {
        await fs.mkdir(path.dirname(p), { recursive: true });
        await fs.copyFile(path.join(FIXTURES, fixtures[i % fixtures.length]), p);
        frames.push({
          ok: true,
          writtenTo: p,
          time: times![i],
          size: [64, 48],
          captureKind: "direct",
        });
      }
      return {
        ok: true,
        result: {
          ok: true,
          frames,
          captureKind: "direct",
          compName: "Main",
          workingSpace: "None",
          bitsPerChannel: 16,
          projectFile: null,
          bgColor: [0.3, 0.3, 0.35],
        },
        error: null,
        errorCode: null,
        stack: null,
        logs: [],
        durationMs: 0,
      };
    },
  };
}

type Structured = Record<string, any>;
async function render(
  args: Record<string, unknown>,
  fixtures: string[],
): Promise<{ res: Structured; isError: boolean; transport: FakeTransport }> {
  const transport = fakeAe(fixtures);
  const out = await renderFrameTool.handler(
    { compNameOrId: "Main", outPath: path.join(dir, "f.png"), ...args } as never,
    transport,
  );
  const sc = out.structuredContent as Structured;
  return {
    res: out.isError ? sc : (sc.result as Structured),
    isError: out.isError === true,
    transport,
  };
}

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-motion-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

const flagKinds = (res: Structured) =>
  (res.diff.series.flags as Array<{ kind: string }>).map((f) => f.kind);

describe("diff with times", () => {
  it("reports every consecutive pair and the series, and flags nothing in a smooth move", async () => {
    const { res, isError } = await render({ times: TIMES, diff: true }, SMOOTH);
    expect(isError).toBe(false);
    expect(res.diff.stage).toBe("output");
    expect(res.measurementStages.output).toMatch(/file as written/);
    expect(res.diffThresholds).toMatchObject(DIFF_DEFAULTS);
    const { pairs, series } = res.diff;
    expect(pairs).toHaveLength(7);
    expect(pairs[0].from).toEqual({ index: 0, time: 0 });
    expect(pairs[0].to).toEqual({ index: 1, time: 0.04 });
    expect(pairs[0].changedPixels).toBe(80);
    expect(pairs[0].changedBounds).toEqual({ x: 6, y: 19, width: 14, height: 10 });
    for (const p of pairs) expect(p.change).toBeCloseTo(pairs[0].change, 4);
    expect(series.pairs).toBe(7);
    expect(series.median).toBeCloseTo(pairs[0].change, 4);
    expect(series.flags).toEqual([]);
    expect(series.reading).toMatch(/no pair stands out/);
  });

  it("flags the repeated frame of a stutter", async () => {
    const { res } = await render({ times: TIMES, diff: true }, STUTTER);
    expect(flagKinds(res)).toEqual(["stutter"]);
    expect(res.diff.series.flags[0].pairs).toEqual([3]);
    expect(res.diff.series.flags[0].frame.index).toBe(4);
    expect(res.diff.pairs[3].change).toBe(0);
  });

  it("flags a one-frame pop", async () => {
    const { res } = await render({ times: TIMES, diff: true }, POP);
    expect(flagKinds(res)).toEqual(["pop"]);
    expect(res.diff.series.flags[0].pairs).toEqual([3, 4]);
    expect(res.diff.series.flags[0].frame.index).toBe(4);
    expect(res.diff.series.reading).toMatch(/pop/);
  });

  it("flags a hard cut", async () => {
    const { res } = await render({ times: TIMES, diff: true }, CUT);
    expect(flagKinds(res)).toEqual(["cut"]);
    expect(res.diff.series.flags[0].pairs).toEqual([3]);
    expect(res.diff.series.largest.pair).toBe(3);
  });

  it("flags nothing when only noise changes", async () => {
    const { res } = await render({ times: TIMES, diff: true }, NOISE);
    expect(res.diff.series.median).toBeGreaterThan(0.005);
    expect(res.diff.series.flags).toEqual([]);
  });

  it("splits each pair by the sampled regions", async () => {
    const { res } = await render(
      {
        times: TIMES,
        diff: true,
        sample: {
          regions: [
            { name: "left", x: 0, y: 0, width: 32, height: 48 },
            { name: "right", x: 32, y: 0, width: 32, height: 48 },
          ],
        },
      },
      POP,
    );
    const [left, right] = res.diff.pairs[3].regions;
    expect(left.name).toBe("left");
    expect(right.name).toBe("right");
    expect(right.changedPixels).toBe(14 * 14);
    expect(right.change).toBeGreaterThan(left.change);
  });

  it("passes caller thresholds through", async () => {
    const { res } = await render({ times: TIMES, diff: { spikeRatio: 10 } }, POP);
    expect(res.diffThresholds.spikeRatio).toBe(10);
    expect(res.diff.series.flags).toEqual([]);
  });

  it("writes an amplified, labelled sheet of the difference images beside the contact sheet", async () => {
    const { res } = await render({ times: TIMES, diff: { sheet: true }, contactSheet: {} }, POP);
    expect(res.contactSheet.writtenTo).toBe(path.join(dir, "f_sheet.png"));
    expect(res.diffSheet.writtenTo).toBe(path.join(dir, "f_diff.png"));
    expect(res.diffSheet.frames).toBe(7);
    expect(res.diffSheet.amplify).toBe(8);
    const sheet = decodePng(readFileSync(res.diffSheet.writtenTo));
    expect([sheet.width, sheet.height]).toEqual(res.diffSheet.size);
  });

  it("measures the matte when channels is alpha, and says so", async () => {
    const { res } = await render({ times: [0, 0.04], diff: true, channels: "alpha" }, [
      "flicker-a-rgba16.png",
      "flicker-b-rgba16.png",
    ]);
    expect(res.diff.pairs[0].change).toBeGreaterThan(0);
    expect(res.diff.picture).toMatch(/matte/);
  });

  it("measures the raw capture, as AE laid it over the comp background, with colorManaged off", async () => {
    const { res } = await render({ times: TIMES, diff: true, colorManaged: "off" }, STUTTER);
    expect(res.diff.picture).toMatch(/comp background/);
    expect(flagKinds(res)).toEqual(["stutter"]);
  });

  for (const [what, args] of [
    ["diff without times", { time: 0, diff: true }],
    ["diff with a single time", { times: [0], diff: true }],
    ["an out-of-range threshold", { times: [0, 1], diff: { holdRatio: 2 } }],
  ] as const) {
    it(`refuses ${what} before After Effects is contacted`, async () => {
      const { res, isError, transport } = await render(args as Record<string, unknown>, SMOOTH);
      expect(isError).toBe(true);
      expect(res.error.code).toBe("INVALID_ARGS");
      expect(transport.calls).toHaveLength(0);
    });
  }
});

describe("strip", () => {
  it("renders N frames around a time through the times path, with a sheet and diff on", async () => {
    const { res, isError, transport } = await render(
      { strip: { at: 1, frames: 5, maxDimension: 32 } },
      SMOOTH,
    );
    expect(isError).toBe(false);
    const code = transport.calls[0].code;
    expect(code).toContain("var _times = null;");
    expect(JSON.parse(/var _strip = (.*);/.exec(code)![1])).toEqual({
      at: 1,
      offsets: [-2, -1, 0, 1, 2],
    });
    expect(res.frames).toHaveLength(5);
    expect(res.frames.map((f: { time: number }) => f.time)).toEqual([0.92, 0.96, 1, 1.04, 1.08]);
    expect(res.contactSheet.writtenTo).toBe(path.join(dir, "f_sheet.png"));
    expect(res.contactSheet.thumbSize).toEqual([32, 24]);
    expect(res.diff.pairs).toHaveLength(4);
    expect(res.diffSheet.writtenTo).toBe(path.join(dir, "f_diff.png"));
    expect(res.strip).toMatchObject({ at: 1, frames: 5, step: 1 });
  });

  it("steps by more than one frame and keeps one more frame after the moment when N is even", async () => {
    const { transport } = await render({ strip: { at: 2, frames: 4, step: 2 } }, SMOOTH);
    const strip = JSON.parse(/var _strip = (.*);/.exec(transport.calls[0].code)![1]);
    expect(strip.offsets).toEqual([-2, 0, 2, 4]);
  });

  it("can switch diff off, or take diff thresholds", async () => {
    const off = await render({ strip: { at: 1, frames: 3 }, diff: false }, SMOOTH);
    expect(off.res.diff).toBeUndefined();
    expect(off.res.contactSheet).toBeDefined();
    const tuned = await render({ strip: { at: 1, frames: 3 }, diff: { spikeRatio: 5 } }, SMOOTH);
    expect(tuned.res.diffThresholds.spikeRatio).toBe(5);
  });

  for (const [what, args] of [
    ["strip with time", { strip: { at: 1, frames: 3 }, time: 1 }],
    ["strip with times", { strip: { at: 1, frames: 3 }, times: [1, 2] }],
    ["one frame", { strip: { at: 1, frames: 1 } }],
    ["too many frames", { strip: { at: 1, frames: 33 } }],
  ] as const) {
    it(`refuses ${what} before After Effects is contacted`, async () => {
      const { res, isError, transport } = await render(args as Record<string, unknown>, SMOOTH);
      expect(isError).toBe(true);
      expect(res.error.code).toBe("INVALID_ARGS");
      expect(transport.calls).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// The strip's times, worked out by the generated JSX against a mock comp
// ---------------------------------------------------------------------------

async function stripJsx(strip: Record<string, unknown>): Promise<string> {
  const transport = fakeAe(SMOOTH);
  await renderFrameTool.handler(
    { compNameOrId: "Main", outPath: path.join(dir, "f.png"), strip } as never,
    transport,
  );
  return transport.calls[0].code;
}

function runStrip(code: string, comp: { frameDuration: number; duration: number }) {
  const rendered: number[] = [];
  const mock = {
    id: 1,
    name: "Main",
    numLayers: 0,
    displayStartTime: 0,
    width: 64,
    height: 48,
    bgColor: [0, 0, 0],
    ...comp,
    layer: () => null,
    saveFrameToPng: (time: number) => rendered.push(time),
  };
  const AE = {
    findCompByNameOrId: () => mock,
    safeGet: (fn: () => unknown, fallback: unknown) => {
      try {
        return fn();
      } catch {
        return fallback;
      }
    },
    ensureParentDir: (p: string) => ({ fsName: p }),
    errText: (e: unknown) => String(e),
  };
  const app = { project: { workingSpace: "None", bitsPerChannel: 8, file: null } };
  const out = new Function("app", "AE", "CompItem", "FootageItem", code)(
    app,
    AE,
    class {},
    class {},
  ) as Record<string, any>;
  return { out, rendered };
}

describe("strip times in After Effects", () => {
  it("snaps the moment to a frame and renders frames around it", async () => {
    const { out, rendered } = runStrip(await stripJsx({ at: 1.01, frames: 3 }), {
      frameDuration: 1 / 25,
      duration: 10,
    });
    expect(rendered.map((v) => Math.round(v * 25))).toEqual([24, 25, 26]);
    expect(out.strip).toMatchObject({ at: 1, shiftedFrames: 0 });
  });

  it("shifts the window inside the comp at its start and its end, and says so", async () => {
    const start = runStrip(await stripJsx({ at: 0, frames: 5 }), {
      frameDuration: 1 / 25,
      duration: 10,
    });
    expect(start.rendered.map((v) => Math.round(v * 25))).toEqual([0, 1, 2, 3, 4]);
    expect(start.out.strip.shiftedFrames).toBe(2);
    const end = runStrip(await stripJsx({ at: 10, frames: 3 }), {
      frameDuration: 1 / 25,
      duration: 10,
    });
    expect(end.rendered.map((v) => Math.round(v * 25))).toEqual([247, 248, 249]);
    expect(end.out.strip.shiftedFrames).toBe(-2);
  });

  it("notes a comp shorter than the strip instead of rendering past its end", async () => {
    const { out, rendered } = runStrip(await stripJsx({ at: 0, frames: 5 }), {
      frameDuration: 1 / 25,
      duration: 3 / 25,
    });
    expect(Math.max(...rendered.map((v) => Math.round(v * 25)))).toBe(2);
    expect(out.strip.note).toMatch(/shorter/);
  });
});

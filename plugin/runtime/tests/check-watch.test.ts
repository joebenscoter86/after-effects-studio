// The whole-piece check's measuring (finish plan, stage 1): src/color/watch.ts
// on synthetic picture sequences made here, in memory. Nothing reaches After
// Effects. Each sequence is a quarter-size 1080x1920 frame (270x480): a
// mid-grey ramp with a light square that moves steadily, plus one seeded
// defect at a known frame.

import { describe, expect, it } from "vitest";

import {
  BOTTOM_CODE,
  TOP_CODE,
  measureFrame,
  PieceWatcher,
  resolveWatchThresholds,
  watchArgsError,
  type WatchFrame,
} from "../src/color/watch.js";

const W = 270;
const H = 480;
const FPS = 30;
const FD = 1 / FPS;

type Painter = (pic: Float32Array, k: number) => void;

/** The clean scene at frame k: a vertical ramp 0.3..0.5 and a 40 px square at 0.85 moving 3 px a frame. */
function scene(k: number, ...extra: Painter[]): Float32Array {
  const pic = new Float32Array(W * H * 3);
  for (let y = 0; y < H; y++) {
    const v = 0.3 + (0.2 * y) / H;
    for (let x = 0; x < W; x++) pic.fill(v, (y * W + x) * 3, (y * W + x) * 3 + 3);
  }
  const sx = 20 + ((3 * k) % 200);
  rect(pic, sx, 200, 40, 40, [0.85, 0.8, 0.75]);
  for (const p of extra) p(pic, k);
  return pic;
}

function rect(
  pic: Float32Array,
  x0: number,
  y0: number,
  w: number,
  h: number,
  c: [number, number, number],
) {
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++) {
      const i = (y * W + x) * 3;
      pic[i] = c[0];
      pic[i + 1] = c[1];
      pic[i + 2] = c[2];
    }
}

const fill =
  (c: [number, number, number]): Painter =>
  (pic) => {
    for (let i = 0; i < pic.length; i += 3) {
      pic[i] = c[0];
      pic[i + 1] = c[1];
      pic[i + 2] = c[2];
    }
  };

/** Run a sequence of frames 0..n-1 (stepping by every) through a watcher. */
function watch(
  n: number,
  pictureAt: (k: number) => Float32Array,
  opts: { every?: number; scale?: number; thresholds?: Record<string, number | null> } = {},
) {
  const every = opts.every ?? 1;
  const w = new PieceWatcher({
    thresholds: resolveWatchThresholds(opts.thresholds ?? {}),
    frameDuration: FD,
    every,
    scale: opts.scale ?? 4,
  });
  for (let k = 0; k < n; k += every) {
    const f: WatchFrame = { frame: k, pic: pictureAt(k), width: W, height: H };
    w.add(f);
  }
  return w.finish();
}

const kinds = (r: ReturnType<typeof watch>) => ({
  flags: r.flags.map((f) => `${f.kind}@${f.frame}`),
  stretches: r.stretches.map((s) => `${s.kind}@${s.from.frame}-${s.to.frame}`),
});

describe("measureFrame", () => {
  it("measures mean luma, near-black and near-white shares and clipping with the box", () => {
    const pic = scene(0, (p) => rect(p, 100, 50, 20, 10, [1, 1, 1]));
    const m = measureFrame(pic, W, H, resolveWatchThresholds());
    expect(m.meanLuma).toBeGreaterThan(0.3);
    expect(m.meanLuma).toBeLessThan(0.5);
    expect(m.darkShare).toBe(0);
    expect(m.clipHigh.all).toBeCloseTo(200 / (W * H), 6);
    expect(m.clipHigh.r).toBeCloseTo(200 / (W * H), 6);
    expect(m.clipHigh.box).toEqual({ x: 100, y: 50, width: 20, height: 10 });
    expect(m.clipLow.all).toBe(0);
    expect(m.clipLow.box).toBeNull();
  });

  it("counts one channel at the top code per channel, not as clipped to white", () => {
    const pic = scene(0, (p) => rect(p, 0, 0, 100, 100, [1, 0.2, 0]));
    const m = measureFrame(pic, W, H, resolveWatchThresholds());
    expect(m.clipHigh.r).toBeCloseTo(10000 / (W * H), 6);
    expect(m.clipHigh.g).toBe(0);
    expect(m.clipHigh.all).toBe(0);
    expect(m.clipLow.b).toBeCloseTo(10000 / (W * H), 6);
  });

  it("uses the 8-bit top and bottom codes", () => {
    expect(TOP_CODE).toBeCloseTo(254.5 / 255, 9);
    expect(BOTTOM_CODE).toBeCloseTo(0.5 / 255, 9);
  });

  it("measures a quarter-size 1080x1920 frame in a few milliseconds", () => {
    const pic = scene(3);
    const t = resolveWatchThresholds();
    measureFrame(pic, W, H, t);
    const runs = 20;
    const t0 = performance.now();
    for (let i = 0; i < runs; i++) measureFrame(pic, W, H, t);
    const ms = (performance.now() - t0) / runs;
    // The figure is reported in the hand-over; the bound only catches a regression.
    console.log(`measureFrame 270x480: ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(25);
  });
});

describe("PieceWatcher", () => {
  it("returns nothing for a clean steady move", () => {
    const r = watch(60, (k) => scene(k));
    expect(r.flags).toEqual([]);
    expect(r.stretches).toEqual([]);
    expect(r.framesChecked).toBe(60);
    expect(r.pairs).toBe(59);
  });

  it("finds a one-frame flash as a pop at its frame, and as a one-frame near-white stretch", () => {
    const r = watch(60, (k) => (k === 20 ? scene(k, fill([1, 1, 1])) : scene(k)));
    const pop = r.flags.find((f) => f.kind === "pop");
    expect(pop?.frame).toBe(20);
    expect(pop?.time).toBeCloseTo(20 / 30, 6);
    expect(pop?.ratio).toBeGreaterThan(3);
    expect(kinds(r).flags).toEqual(["pop@20"]);
    const white = r.stretches.find((s) => s.kind === "near-white");
    expect(white?.from.frame).toBe(20);
    expect(white?.to.frame).toBe(20);
    expect(white?.frames).toBe(1);
    // A whole white frame is also clipped to white.
    expect(kinds(r).stretches).toEqual(["near-white@20-20", "clipped-high@20-20"]);
  });

  it("finds a frozen stretch from its first to its last held frame", () => {
    // Frames 20..39 hold frame 20's picture: 20 frames, 0.667 s.
    const r = watch(60, (k) => scene(k >= 20 && k <= 39 ? 20 : k));
    const frozen = r.stretches.filter((s) => s.kind === "frozen");
    expect(frozen).toHaveLength(1);
    expect(frozen[0].from.frame).toBe(20);
    expect(frozen[0].to.frame).toBe(39);
    expect(frozen[0].frames).toBe(20);
    expect(frozen[0].seconds).toBeCloseTo(20 / 30, 6);
    // Holds are stated, not flagged as stutters.
    expect(r.flags.filter((f) => f.kind === "stutter")).toEqual([]);
  });

  it("does not report a hold shorter than frozenSeconds", () => {
    const r = watch(60, (k) => scene(k >= 20 && k <= 26 ? 20 : k));
    expect(r.stretches.filter((s) => s.kind === "frozen")).toEqual([]);
  });

  it("finds a clipped highlight with its box in comp pixels", () => {
    const blob: Painter = (p, k) => {
      if (k >= 30 && k <= 35) rect(p, 150, 300, 30, 30, [1, 1, 1]);
    };
    const r = watch(60, (k) => scene(k, blob));
    const clip = r.stretches.filter((s) => s.kind === "clipped-high");
    expect(clip).toHaveLength(1);
    expect(clip[0].from.frame).toBe(30);
    expect(clip[0].to.frame).toBe(35);
    expect(clip[0].worst?.share).toBeCloseTo(900 / (W * H), 6);
    // scale 4: measured pixels are 4 comp pixels.
    expect(clip[0].box).toEqual({ x: 600, y: 1200, width: 120, height: 120 });
  });

  it("finds near-black frames grouped into one stretch", () => {
    const r = watch(60, (k) => (k >= 40 && k <= 44 ? scene(k, fill([0, 0, 0])) : scene(k)));
    const black = r.stretches.filter((s) => s.kind === "near-black");
    expect(black).toHaveLength(1);
    expect(black[0].from.frame).toBe(40);
    expect(black[0].to.frame).toBe(44);
    expect(black[0].worst?.meanLuma).toBe(0);
    // Clipping low is off by default (a black background is at the bottom code by design).
    expect(r.stretches.some((s) => s.kind === "clipped-low")).toBe(false);
    const on = watch(60, (k) => (k >= 40 && k <= 44 ? scene(k, fill([0, 0, 0])) : scene(k)), {
      thresholds: { clipLowShare: 0.5 },
    });
    expect(on.stretches.some((s) => s.kind === "clipped-low")).toBe(true);
  });

  it("with every above 1: says a pop can be missed, and counts frozen length in frames", () => {
    // The flash is on an odd frame; every 2 never sees it.
    const r = watch(60, (k) => (k === 21 ? scene(k, fill([1, 1, 1])) : scene(k >= 20 && k <= 39 ? 20 : k)), {
      every: 2,
    });
    expect(r.step).toBe(2);
    expect(r.framesChecked).toBe(30);
    expect(r.flags.some((f) => f.kind === "pop")).toBe(false);
    expect(r.notes.join(" ")).toMatch(/one-frame pop .*missed/);
    expect(r.notes.join(" ")).toMatch(/1 frame in every 2 was checked/);
    expect(r.notes.join(" ")).not.toMatch(/\dth frame/);
    const frozen = r.stretches.filter((s) => s.kind === "frozen");
    expect(frozen).toHaveLength(1);
    // Sampled frames 20..38 are the same picture; the true hold may run up to every - 1 frames past each end.
    expect(frozen[0].from.frame).toBe(20);
    expect(frozen[0].to.frame).toBe(38);
    expect(frozen[0].frames).toBe(19);
    expect(frozen[0].uncertainFrames).toBe(1);
  });

  it("with every above 1: a flash on a sampled frame is still a pop", () => {
    const r = watch(60, (k) => (k === 20 ? scene(k, fill([1, 1, 1])) : scene(k)), { every: 2 });
    expect(r.flags.map((f) => `${f.kind}@${f.frame}`)).toEqual(["pop@20"]);
  });

  it("breaks the series at a missing frame instead of comparing across it", () => {
    const w = new PieceWatcher({
      thresholds: resolveWatchThresholds(),
      frameDuration: FD,
      every: 1,
      scale: 4,
    });
    for (let k = 0; k < 30; k++) if (k !== 12) w.add({ frame: k, pic: scene(k), width: W, height: H });
    const r = w.finish();
    expect(r.pairs).toBe(27);
    expect(r.flags).toEqual([]);
    expect(r.notes.join(" ")).toMatch(/not compared across/);
  });

  it("owns only the frames in its range: flags and stretches wholly outside are dropped", () => {
    const w = new PieceWatcher({
      thresholds: resolveWatchThresholds(),
      frameDuration: FD,
      every: 1,
      scale: 4,
      owned: { from: 20, to: 59 },
    });
    for (let k = 0; k < 60; k++)
      w.add({ frame: k, pic: k === 10 ? scene(k, fill([1, 1, 1])) : scene(k), width: W, height: H });
    const r = w.finish();
    expect(r.flags).toEqual([]);
    expect(r.stretches).toEqual([]);
    expect(r.framesChecked).toBe(40);
  });
});

describe("thresholds", () => {
  it("resolves defaults and overrides, and rejects bad values", () => {
    const t = resolveWatchThresholds({ frozenSeconds: 1 });
    expect(t.frozenSeconds).toBe(1);
    expect(t.clipLowShare).toBeNull();
    expect(t.changeAbove).toBe(0.04);
    expect(watchArgsError({ frozenSeconds: -1 })).toMatch(/frozenSeconds/);
    expect(watchArgsError({ nope: 1 })).toMatch(/not an option/);
    expect(watchArgsError({ clipLowShare: null })).toBeNull();
    expect(watchArgsError({ blackShare: 0.9 })).toBeNull();
  });
});

// The reference report (sheet.ts) and its compare: main colours, levels,
// colour, sharpness and grain at named regions, where the weight sits, cuts
// and motion; and the differences between a reference and a build, largest
// first. Synthetic frames: a textured room, a person who sways, a cut.

import { describe, expect, it } from "vitest";

import type { DecodedPng } from "../src/color/png16.js";
import {
  compareReferences,
  REFERENCE_DEFAULTS,
  referenceReport,
  type ReferenceReport,
} from "../src/color/sheet.js";

const W = 180;
const H = 320;
const N = 24;
const CUT = 12;

type Px = [number, number, number];

/** Deterministic noise in -1..1. */
function noise(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 31 - 1;
  };
}

interface Variant {
  cast?: boolean;
  scale?: number;
  blurRoom?: number;
  otherFootage?: boolean;
}

/** One frame: a room of shelves, a person (skin head, dark body) swaying, a cut at frame CUT. */
function frame(f: number, v: Variant = {}): DecodedPng {
  const after = f >= CUT;
  const rnd = noise(1000 + f);
  // The room: shelves (horizontal lines) and books (vertical stripes), bluish grey; it moves on the cut.
  const room = new Float64Array(W * H * 3);
  const shift = after ? 13 : 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const shelf = (y + shift) % 40 < 3;
      const book = ((x + shift) >> 3) & 1;
      const base: Px = shelf ? [0.55, 0.5, 0.45] : book ? [0.2, 0.24, 0.32] : [0.1, 0.12, 0.18];
      for (let c = 0; c < 3; c++) room[(y * W + x) * 3 + c] = base[c] + 0.012 * rnd();
    }
  let bg = room;
  if (v.blurRoom) {
    const r = v.blurRoom;
    bg = new Float64Array(room.length);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        for (let c = 0; c < 3; c++) {
          let s = 0;
          let n = 0;
          for (let dy = -r; dy <= r; dy++)
            for (let dx = -r; dx <= r; dx++) {
              const yy = Math.min(H - 1, Math.max(0, y + dy));
              const xx = Math.min(W - 1, Math.max(0, x + dx));
              s += room[(yy * W + xx) * 3 + c];
              n++;
            }
          bg[(y * W + x) * 3 + c] = s / n;
        }
  }
  // The person, scaled about the bottom centre of the frame.
  const k = v.scale ?? 1;
  // Other footage: the person holds still and a bright square sweeps across the top instead.
  const sway = v.otherFootage ? 0 : 6 * Math.sin(f / 3) + (after ? 15 : 0);
  const nod = v.otherFootage ? 0 : 4 * Math.sin(f / 2);
  const hx = (x: number) => 90 + (x - 90) / k;
  const hy = (y: number) => H + (y - H) / k;
  const rgb = new Float64Array(W * H * 3);
  const rnd2 = noise(7 + f);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      // Back to the person's own coordinates.
      const px = hx(x) - sway;
      const py = hy(y) - nod;
      const head = ((px - 90) / 30) ** 2 + ((py - 150) / 38) ** 2 <= 1;
      const body = py >= 190 && px >= 45 && px < 135;
      let c: Px | null = head ? [0.8, 0.55, 0.45] : body ? [0.1, 0.1, 0.12] : null;
      const i = (y * W + x) * 3;
      if (c) {
        const g = 0.012 * rnd2();
        c = [c[0] + g, c[1] + g, c[2] + g];
        for (let ch = 0; ch < 3; ch++) rgb[i + ch] = c[ch];
      } else for (let ch = 0; ch < 3; ch++) rgb[i + ch] = bg[i + ch];
      if (v.otherFootage && y >= 20 && y < 50 && x >= 5 + 6 * f && x < 35 + 6 * f)
        for (let ch = 0; ch < 3; ch++) rgb[i + ch] = 0.9;
      if (v.cast) {
        rgb[i] = Math.min(1, rgb[i] * 1.14);
        rgb[i + 1] *= 0.9;
        rgb[i + 2] = Math.min(1, rgb[i + 2] * 1.1);
      }
    }
  return { width: W, height: H, rgb, bitDepth: 8 };
}

const OPTS = { frameRate: 30, motionCell: 4 };
const series = (v: Variant = {}) =>
  Array.from({ length: N }, (_, f) => ({ img: frame(f, v), frame: f, time: f / 30 }));
const report = (v: Variant = {}): ReferenceReport => referenceReport(series(v), OPTS);

const REF = report();

describe("referenceReport", () => {
  it("gives the main colours with their shares, the levels, and the grid's regions", () => {
    expect(REF.frames).toBe(N);
    expect(REF.size).toEqual([W, H]);
    expect(REF.palette.length).toBeGreaterThan(1);
    expect(REF.palette.length).toBeLessThanOrEqual(REFERENCE_DEFAULTS.paletteColours);
    const total = REF.palette.reduce((s, c) => s + c.share, 0);
    expect(total).toBeGreaterThan(0.99);
    expect(total).toBeLessThan(1.01);
    for (let i = 1; i < REF.palette.length; i++)
      expect(REF.palette[i].share).toBeLessThanOrEqual(REF.palette[i - 1].share);
    expect(REF.palette[0].hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(REF.levels.lumaBlack).toBeLessThan(REF.levels.lumaMean);
    expect(REF.levels.lumaMean).toBeLessThan(REF.levels.lumaWhite);
    expect(REF.regions.map((r) => r.name)).toEqual([
      "top left",
      "top",
      "top right",
      "left",
      "middle",
      "right",
      "bottom left",
      "bottom",
      "bottom right",
    ]);
    const mid = REF.regions.find((r) => r.name === "middle")!;
    expect(mid.colour.L).toBeGreaterThan(0);
    expect(mid.sharpness.edgeWidth).not.toBeNull();
  });

  it("says where the weight of the frame sits, and where the moving subject is", () => {
    for (const p of [REF.weight.brightness, REF.weight.detail, REF.motion.subject!])
      for (const v of [p.x, p.y]) {
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThan(1);
      }
    // The person sways round the centre, low in the frame.
    expect(REF.motion.subject!.x).toBeGreaterThan(0.4);
    expect(REF.motion.subject!.x).toBeLessThan(0.65);
    expect(REF.motion.subject!.y).toBeGreaterThan(0.4);
  });

  it("finds the cut, and how much the picture moves between cuts", () => {
    expect(REF.motion.cuts).toEqual([{ frame: CUT, time: CUT / 30 }]);
    expect(REF.motion.meanChange).toBeGreaterThan(0);
    expect(REF.motion.map.width).toBe(W / 4);
    expect(REF.motion.map.height).toBe(H / 4);
  });

  it("reads one still: no motion, no cuts", () => {
    const one = referenceReport([{ img: frame(0), frame: 0 }], OPTS);
    expect(one.frames).toBe(1);
    expect(one.motion.cuts).toEqual([]);
    expect(one.motion.subject).toBeNull();
    expect(one.palette.length).toBeGreaterThan(0);
  });
});

describe("compareReferences", () => {
  it("lists nothing when the build is the reference", () => {
    const c = compareReferences(REF, report());
    expect(c.differences).toEqual([]);
    expect(c.reading).toMatch(/no difference/i);
  });

  it("names a cast, with its direction", () => {
    const c = compareReferences(REF, report({ cast: true }));
    expect(c.differences[0].measure).toBe("cast");
    expect(c.differences[0].reading).toMatch(/magenta/);
  });

  it("names a smaller subject, with how much smaller, when both are the same footage", () => {
    const c = compareReferences(REF, report({ scale: 0.78 }));
    const s = c.differences.find((d) => d.measure === "subject size")!;
    expect(s).toBeDefined();
    expect(c.subject!.scale).toBeGreaterThan(0.74);
    expect(c.subject!.scale).toBeLessThan(0.82);
    expect(s.reading).toMatch(/smaller/);
  });

  it("names a soft room, by region", () => {
    const c = compareReferences(REF, report({ blurRoom: 3 }));
    const s = c.differences.find((d) => d.measure === "sharpness")!;
    expect(s).toBeDefined();
    expect(s.reading).toMatch(/softer/);
    expect(s.reading).toMatch(/top left/);
  });

  it("puts all three at the top, largest first", () => {
    const c = compareReferences(REF, report({ cast: true, scale: 0.78, blurRoom: 3 }));
    const top = c.differences.slice(0, 4).map((d) => d.measure);
    for (const m of ["cast", "subject size", "sharpness"]) expect(top).toContain(m);
    for (let i = 1; i < c.differences.length; i++)
      expect(c.differences[i].size).toBeLessThanOrEqual(c.differences[i - 1].size);
    expect(c.reading).toMatch(/magenta/);
  });

  it("does not compare the subject's size between different footage", () => {
    const c = compareReferences(REF, report({ otherFootage: true }));
    expect(c.differences.find((d) => d.measure === "subject size")).toBeUndefined();
    expect(c.subject?.compared ?? false).toBe(false);
    expect(c.notes.join(" ")).toMatch(/not the same footage/);
  });

  it("names a cut the build does not have", () => {
    const noCut = referenceReport(
      Array.from({ length: N }, (_, f) => ({ img: frame(Math.min(f, CUT - 1) === f ? f : f - CUT), frame: f, time: f / 30 })),
      OPTS,
    );
    const c = compareReferences(REF, noCut);
    const cuts = c.differences.find((d) => d.measure === "cuts")!;
    expect(cuts).toBeDefined();
    expect(cuts.reading).toMatch(/frame 12/);
  });
});

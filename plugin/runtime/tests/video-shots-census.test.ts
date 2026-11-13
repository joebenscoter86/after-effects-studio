// video.shots and video.census (stage 13): every cut and the one-frame swap found on the clips, and nothing false on the
// clips that have none; the census classifier on made-up frame pairs; cadence numbers from a label string.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cadence, censusStep } from "../src/video/census.js";
import { runCensus, runShots } from "../src/video/run-shots-census.js";
import { clips, rng, writeClip } from "./helpers/video-clips.js";

let dir: string;
const files: Record<string, string> = {};
beforeAll(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-video-shots-"));
  for (const c of clips()) { const f = await writeClip(c, dir); if (f) files[c.name] = f; }
  if (!Object.keys(files).length) console.warn("ffmpeg is not installed: the video.shots tests are skipped");
}, 60_000);
afterAll(async () => { await fs.rm(dir, { recursive: true, force: true }); });

describe("video.shots", () => {
  it("finds the cut and the one-frame swap, and writes the sheets", async (ctx) => {
    if (!files["cut-and-swap"]) return ctx.skip();
    const r: any = await runShots({ file: files["cut-and-swap"], outDir: path.join(dir, "cs") });
    expect(r.ok).toBe(true);
    expect(r.cuts.map((c: any) => c.frame)).toEqual([30]);
    expect(r.swaps.map((c: any) => c.frame)).toEqual([45]);
    expect(r.shots).toHaveLength(2);
    expect(r.files.sheets.length).toBe(2); expect(r.files.strips.length).toBe(2);
  }, 60_000);
  it("no false cuts or swaps on clips that have none", async (ctx) => {
    if (!files["slide-spring"]) return ctx.skip();
    for (const name of ["slide-ease", "slide-linear", "slide-spring", "scale", "fade", "slide-over-moving-ground"]) {
      const r: any = await runShots({ file: files[name], outDir: path.join(dir, name), pictures: false });
      expect({ name, cuts: r.cuts.length, swaps: r.swaps.length }).toEqual({ name, cuts: 0, swaps: 0 });
    }
  }, 120_000);
});

describe("video.census", () => {
  const W = 160, H = 90, tex = (seed: number) => { const r = rng(seed); return Uint8Array.from({ length: W * H }, () => 40 + Math.floor(r() * 150)); };
  const shift = (a: Uint8Array, dx: number) => Uint8Array.from({ length: W * H }, (_, i) => { const y = Math.floor(i / W), x = (i % W) + dx; return a[y * W + Math.min(W - 1, Math.max(0, x))]; });
  it("classes calm, travel, local and cut", () => {
    const a = tex(1);
    expect(censusStep(a, a, W, H, 0, H).label).toBe("c");
    expect(censusStep(a, shift(a, 3), W, H, 0, H).label).toBe("T");
    const b = Uint8Array.from(a); for (let y = 30; y < 50; y++) for (let x = 60; x < 90; x++) b[y * W + x] = 255 - b[y * W + x];
    expect(censusStep(a, b, W, H, 0, H).label).toBe("l");
    expect(censusStep(a, tex(2), W, H, 0, H).label).toBe("X");
  });
  it("cadence: shares, travel runs, bursts and calm runs", () => {
    const c = cadence("ccccTTTTccccclllcccc", Array(20).fill(2), 0.1, 3);
    expect(c.shares).toEqual({ calm: 0.65, local: 0.15, travel: 0.2, cut: 0 });
    expect(c.travel.perMinute).toBeCloseTo(30, 6);   // one run in 2 s
    expect(c.travel.medianSeconds).toBeCloseTo(0.4, 6);
    expect(c.travel.medianSpeed).toBe(60);   // 2 px a step x 3 (to source px) / 0.1 s
    expect(c.burstsPer10s).toBeCloseTo(10, 6);
  });
  it("runs on a file and writes its labels and strip", async (ctx) => {
    if (!files["slide-ease"]) return ctx.skip();
    const r: any = await runCensus({ file: files["slide-ease"], outDir: path.join(dir, "census"), band: [0, 1] });
    expect(r.ok).toBe(true);
    expect(r.labels.length).toBe(19);   // 2 s at 0.1 s steps
    expect(r.labels).toMatch(/^c+[lT]+c+$/);   // calm, the slide, calm
    await fs.access(r.files.strip);
  }, 60_000);
});

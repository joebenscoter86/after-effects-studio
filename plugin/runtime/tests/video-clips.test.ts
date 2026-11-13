// The video tests' own clips: drawn with known moves and encoded with ffmpeg when the tests run (nothing committed as
// media). Skips, saying so, when ffmpeg is not installed.
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { aeEase, clips, H, spring, W, writeClip } from "./helpers/video-clips.js";

let dir: string;
let ffmpeg = true;
beforeAll(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-video-clips-"));
  ffmpeg = (await writeClip(clips()[0], dir)) !== null;
  if (!ffmpeg) console.warn("ffmpeg is not installed: the video clip tests are skipped");
});
afterAll(async () => { await fs.rm(dir, { recursive: true, force: true }); });

const probeFrames = (file: string) => new Promise<number>((resolve) => execFile("ffprobe", ["-v", "error", "-count_frames", "-select_streams", "v:0",
  "-show_entries", "stream=nb_read_frames,width,height", "-of", "csv=p=0", file], (_e, out) => resolve(Number(String(out).trim().split(",").pop()))));

describe("test clips", () => {
  it("the ease, the spring and the clips' truth are what they say", () => {
    expect(aeEase(0.5, 0.33, 0.33)).toBeCloseTo(0.5, 6);
    expect(aeEase(0.2, 0.33, 0.8)).toBeLessThan(0.2);   // a slow start
    let peak = 0; for (let t = 0; t < 2; t += 0.001) peak = Math.max(peak, spring(t, 0.35, 12));
    expect(peak).toBeCloseTo(1 + Math.exp(-0.35 * Math.PI / Math.sqrt(1 - 0.35 * 0.35)), 3);   // the damped spring's overshoot
    const cs = clips();
    expect(cs.map((c) => c.name)).toEqual(["slide-ease", "slide-linear", "slide-spring", "scale", "fade", "cut-and-swap", "variable-rate", "pulled-up-24", "slide-over-moving-ground"]);
    for (const c of cs) { expect(c.truth.path.length).toBe(c.frames); expect(c.draw(0).length).toBe(W * H * 3); }
  });
  it("every clip encodes and decodes to the frames it claims", async (ctx) => {
    if (!ffmpeg) return ctx.skip();
    for (const c of clips()) { const f = await writeClip(c, dir); expect(f).not.toBeNull(); expect(await probeFrames(f!)).toBe(c.frames); }
  });
});

// video.track on clips with known moves (stage 13): duration within a frame, distance within 2 %, ease within 10 points,
// the right model named; a fade's opacity; a scale; a slide over a scrolling ground. Skips without ffmpeg.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { probeVideo } from "../src/video/decode.js";
import { runTrack } from "../src/video/run-track.js";
import { clips, writeClip } from "./helpers/video-clips.js";

let dir: string;
const files: Record<string, string> = {};
beforeAll(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-video-track-"));
  for (const c of clips()) { const f = await writeClip(c, dir); if (f) files[c.name] = f; }
  if (!Object.keys(files).length) console.warn("ffmpeg is not installed: the video.track tests are skipped");
}, 60_000);
afterAll(async () => { await fs.rm(dir, { recursive: true, force: true }); });

const fps = 30;
async function track(name: string, region: number[], extra: Record<string, unknown> = {}) {
  return runTrack({ file: files[name], outDir: path.join(dir, name), region, ...extra });
}
const moveOf = (r: any, channel: string) => r.moves.find((m: any) => m.channel === channel);

describe("video.track", () => {
  it("an eased slide: duration, distance, influences, and keys to apply", async (ctx) => {
    if (!files["slide-ease"]) return ctx.skip();
    const r = await track("slide-ease", [296, 84, 48, 48]);
    expect(r.ok).toBe(true);
    const m = moveOf(r, "position");
    expect(m.best).toBe("ease");
    expect(Math.abs((m.fits.ease.end - m.fits.ease.start) * fps - 24)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.distance - 260) / 260).toBeLessThan(0.02);
    expect(Math.abs(m.fits.ease.outInfluence - 33)).toBeLessThanOrEqual(10);
    expect(Math.abs(m.fits.ease.inInfluence - 80)).toBeLessThanOrEqual(10);
    expect(m.apply.keys).toHaveLength(2);
    expect(r.notMeasured).toContain("rotation");
    expect(r.lost).toBeNull();
  }, 60_000);
  it("a linear slide is named linear", async (ctx) => {
    if (!files["slide-linear"]) return ctx.skip();
    const m = moveOf(await track("slide-linear", [296, 84, 48, 48]), "position");
    expect(m.best).toBe("linear");
    expect(Math.abs((m.fits.linear.end - m.fits.linear.start) * fps - 20)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.distance - 260) / 260).toBeLessThan(0.02);
  }, 60_000);
  it("a spring: its overshoot and frequency", async (ctx) => {
    if (!files["slide-spring"]) return ctx.skip();
    const m = moveOf(await track("slide-spring", [236, 84, 48, 48]), "position");
    expect(m.best).toBe("spring");
    const zeta = 0.35, omega = 12;
    expect(m.fits.spring.f).toBeCloseTo((omega * Math.sqrt(1 - zeta * zeta)) / (2 * Math.PI), 1);
    expect(m.fits.spring.overshoot).toBeCloseTo(Math.exp((-zeta * Math.PI) / Math.sqrt(1 - zeta * zeta)), 1);
    expect(Math.abs(m.distance - 200) / 200).toBeLessThan(0.02);
    expect(m.apply.librarySpring.freq).toBeGreaterThan(0);
  }, 60_000);
  it("a scale from 100 % to 180 %", async (ctx) => {
    if (!files["scale"]) return ctx.skip();
    const m = moveOf(await track("scale", [149, 65, 86, 86]), "scale");
    expect(m).toBeDefined();
    expect(m.start[0] / m.end[0]).toBeCloseTo(1 / 1.8, 1);
    expect(Math.abs((m.fits.ease.end - m.fits.ease.start) * fps - 15)).toBeLessThanOrEqual(1);
  }, 60_000);
  it("a file's frames and their own times, one per frame (no phantom frame from ffprobe's last empty line)", async (ctx) => {
    if (!files["fade"]) return ctx.skip();
    const info: any = await probeVideo(files["fade"]);
    expect(info.frames).toBe(40);
    expect(info.times.slice(0, 4)).toEqual([0, 1 / 30, 2 / 30, 3 / 30].map((t) => Math.round(t * 1e6) / 1e6));
    expect(info.variableRate).toBe(false);
  });
  it("a fade from 0 to 100 %", async (ctx) => {
    if (!files["fade"]) return ctx.skip();
    const r = await track("fade", [168, 84, 48, 48]);
    const m = moveOf(r, "opacity");
    expect(m).toBeDefined();
    expect(m.end[0]).toBeGreaterThan(90);
    expect(Math.abs((m.fits.linear.end - m.fits.linear.start) * fps - 12)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.fits.linear.start * fps - 8)).toBeLessThan(0.2);   // on its own frame
  }, 60_000);
  it("a variable frame rate: said, and the move fitted on the frames' own times", async (ctx) => {
    if (!files["variable-rate"]) return ctx.skip();
    const info: any = await probeVideo(files["variable-rate"]);
    expect(info.variableRate).toBe(true);
    expect(info.times[1]).toBeCloseTo(1 / 30 + 0.008, 3);
    const r: any = await track("variable-rate", [296, 84, 48, 48]);
    expect(r.video.variableRate).toBe(true);
    const m = moveOf(r, "position");
    expect(m.best).toBe("ease");
    expect(Math.abs((m.fits.ease.end - m.fits.ease.start) * fps - 24)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.fits.ease.outInfluence - 33)).toBeLessThanOrEqual(10); expect(Math.abs(m.fits.ease.inInfluence - 80)).toBeLessThanOrEqual(10);
  }, 60_000);
  it("a 24 fps piece inside 30 fps: its cadence and rate, and the move fitted on its unique frames", async (ctx) => {
    if (!files["pulled-up-24"]) return ctx.skip();
    const r: any = await track("pulled-up-24", [296, 84, 48, 48]);
    expect(r.cadence.period).toBe(5);
    expect(r.cadence.originalFps).toBeCloseTo(24, 1);
    const m = moveOf(r, "position");
    expect(m.best).toBe("ease");
    expect(Math.abs((m.fits.ease.end - m.fits.ease.start) - (27 - 8) / 24) * fps).toBeLessThanOrEqual(1);
    expect(Math.abs(m.fits.ease.outInfluence - 40)).toBeLessThanOrEqual(10); expect(Math.abs(m.fits.ease.inInfluence - 60)).toBeLessThanOrEqual(10);
    expect(Math.abs(m.distance - 260) / 260).toBeLessThan(0.02);
  }, 60_000);
  it("a slide over a scrolling ground follows the thing, not the ground", async (ctx) => {
    if (!files["slide-over-moving-ground"]) return ctx.skip();
    const m = moveOf(await track("slide-over-moving-ground", [296, 84, 48, 48]), "position");
    expect(Math.abs(m.distance - 260) / 260).toBeLessThan(0.02);
    expect(Math.abs((m.fits.ease.end - m.fits.ease.start) * fps - 24)).toBeLessThanOrEqual(1);
  }, 60_000);
});

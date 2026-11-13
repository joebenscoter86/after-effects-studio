// render.mux_audio: a mix made outside After Effects (a WAV) joined to the
// delivered picture. The picture is copied, the mix encoded to AAC at 48 kHz
// by ffmpeg (its own priming edit list), and the joined file checked as
// render.deliver checks its file, with a finding when the mix's length
// differs from the picture's by more than a frame.
//
// With ffmpeg installed, real files are made, joined and decoded again to
// measure where a click lands. Nothing here reaches After Effects.

import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import "../src/operations/index.js";
import { runMuxAudio } from "../src/operations/render.js";
import { getOp } from "../src/registry.js";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

function has(tool: string): boolean {
  try {
    execFileSync(tool, ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
const FFMPEG_THERE = has("ffmpeg") && has("ffprobe");

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-mux-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

const ff = (...args: string[]) =>
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);

/** A 2 s picture at 30 fps, as render.deliver writes one (H.264, here with a placeholder AAC track of its own). */
function picture(file: string) {
  ff(
    "-f",
    "lavfi",
    "-i",
    "color=c=gray:s=64x64:r=30:d=2",
    "-f",
    "lavfi",
    "-i",
    "anullsrc=r=48000:cl=mono:d=2",
    "-c:v",
    "libx264",
    "-bf",
    "0",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    file,
  );
}
/** A mono 48 kHz WAV of `seconds` with a tone under it and a click at sample 24,000. */
function mix(file: string, seconds: number) {
  ff(
    "-f",
    "lavfi",
    "-i",
    `aevalsrc='if(between(n,24000,24047),0.9,0.05*sin(2*PI*220*t))':s=48000:d=${seconds}`,
    "-c:a",
    "pcm_s16le",
    file,
  );
}
/** The first decoded sample (mono, 48 kHz) above half scale. */
function firstClick(file: string): number {
  const pcm = execFileSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      file,
      "-map",
      "0:a:0",
      "-f",
      "s16le",
      "-ac",
      "1",
      "-ar",
      "48000",
      "-",
    ],
    {
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  for (let i = 0; i + 1 < pcm.length; i += 2)
    if (Math.abs(pcm.readInt16LE(i)) > 16000) return i / 2;
  return -1;
}

describe("render.mux_audio without ffmpeg", () => {
  it("says plainly that it needs ffmpeg, and writes nothing", async () => {
    const video = path.join(dir, "pic.mp4");
    const audio = path.join(dir, "mix.wav");
    await fs.writeFile(video, "x");
    await fs.writeFile(audio, "x");
    const res = await runMuxAudio(
      { video, audio },
      { ffmpeg: [path.join(dir, "no-ffmpeg")], ffprobe: [path.join(dir, "no-ffprobe")] },
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/needs ffmpeg and ffprobe, and ffmpeg is not installed/);
    expect(res.error).toMatch(/Nothing was written/);
    expect((await fs.readdir(dir)).sort()).toEqual(["mix.wav", "pic.mp4"]);
  });

  it("refuses relative paths, a missing file, and an output that is its own input or already there", async () => {
    expect((await runMuxAudio({ video: "pic.mp4", audio: "/a.wav" })).error).toMatch(/absolute/);
    expect(
      (await runMuxAudio({ video: path.join(dir, "none.mp4"), audio: path.join(dir, "none.wav") }))
        .error,
    ).toMatch(/no file at/);
    const video = path.join(dir, "pic.mp4");
    const audio = path.join(dir, "mix.wav");
    await fs.writeFile(video, "x");
    await fs.writeFile(audio, "x");
    expect((await runMuxAudio({ video, audio, output: video })).error).toMatch(
      /must be a new file/,
    );
    await fs.writeFile(path.join(dir, "pic-mix.mp4"), "x");
    expect((await runMuxAudio({ video, audio })).error).toMatch(/already exists.*overwrite: true/);
  });

  it("is an operation with the parameters agreed, that does not touch the project", () => {
    const op = getOp("render.mux_audio")!;
    expect(op.category).toBe("render");
    expect(op.readOnly).toBe(true);
    expect(op.run).toBeTypeOf("function");
    expect(op.params.map((p) => p.name)).toEqual([
      "video",
      "audio",
      "output",
      "overwrite",
      "offsetSeconds",
      "bitrate",
    ]);
    expect(op.params.filter((p) => p.required).map((p) => p.name)).toEqual(["video", "audio"]);
    expect(op.description).toMatch(/render\.deliver for the picture, then this/);
  });
});

describe.skipIf(!FFMPEG_THERE)("render.mux_audio with ffmpeg", () => {
  it("joins the mix on its frame (the click at sample 24,000), copies the picture, and reports loudness", async () => {
    const video = path.join(dir, "pic.mp4");
    const audio = path.join(dir, "mix.wav");
    picture(video);
    mix(audio, 2);
    const res = await runMuxAudio({ video, audio });
    expect(res.ok).toBe(true);
    expect(res.output).toBe(path.join(dir, "pic-mix.mp4"));
    expect(res.check.passed).toBe(true);
    expect(res.check.findings).toEqual([]);
    expect(res.check.file.sync).toMatchObject({
      codec: "mp4a",
      skippedSamples: 1024,
      lateBySamples: 0,
    });
    expect(res.check.file.loudness.integratedLufs).toBeLessThan(0);
    expect(Number.isFinite(res.check.file.loudness.truePeakDbtp)).toBe(true);
    expect(res.check.reading).toMatch(/LUFS integrated, true peak .* dBTP/);
    expect(res.mixLength.differenceFrames).toBe(0);
    expect(firstClick(res.output)).toBe(24000);
    // The picture is the same stream, copied.
    const codec = execFileSync("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=codec_name,nb_frames",
      "-of",
      "csv=p=0",
      res.output,
    ])
      .toString()
      .trim();
    expect(codec).toBe("h264,60");
    expect((await fs.readdir(dir)).sort()).toEqual(["mix.wav", "pic-mix.mp4", "pic.mp4"]);
  }, 60_000);

  it("moves the mix sample-exact with offsetSeconds", async () => {
    const video = path.join(dir, "pic.mp4");
    const audio = path.join(dir, "mix.wav");
    picture(video);
    mix(audio, 1.5);
    const later = await runMuxAudio({
      video,
      audio,
      offsetSeconds: 0.5,
      output: path.join(dir, "later.mp4"),
    });
    expect(firstClick(later.output)).toBe(24000 + 24000);
    expect(later.check.file.sync.lateBySamples).toBe(0);
    expect(later.mixLength.differenceFrames).toBe(0);
    mix(audio, 2.25);
    const earlier = await runMuxAudio({
      video,
      audio,
      offsetSeconds: -0.25,
      output: path.join(dir, "earlier.mp4"),
    });
    expect(firstClick(earlier.output)).toBe(24000 - 12000);
    expect(earlier.mixLength.differenceFrames).toBe(0);
  }, 60_000);

  it("flags a mix more than a frame shorter than the picture", async () => {
    const video = path.join(dir, "pic.mp4");
    const audio = path.join(dir, "mix.wav");
    picture(video);
    mix(audio, 1.8);
    const res = await runMuxAudio({ video, audio });
    expect(res.ok).toBe(true);
    expect(res.check.passed).toBe(false);
    const f = res.check.findings.find((x: Any) => x.kind === "mix length");
    expect(f.reading).toMatch(/runs 1\.8 s and the picture 2 s: 0\.2 s \(6 frames\) shorter/);
    expect(res.next).toMatch(/^Stop/);
    // Within a frame is not a finding.
    mix(audio, 1.98);
    const close = await runMuxAudio({ video, audio, overwrite: true });
    expect(close.check.findings.filter((x: Any) => x.kind === "mix length")).toEqual([]);
  }, 60_000);
});

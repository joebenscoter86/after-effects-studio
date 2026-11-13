// render.deliver's sound (first production use, 2026-11-12): After Effects'
// AAC encoder starts the sound with 1,024 samples of priming and the MP4 has
// no edit list, so in players the voice ran 1,024 samples (0.64 of a frame at
// 30 fps, 48 kHz) late; and the delivery did not report integrated loudness
// or true peak.
//
// The edit list is read from the file's own boxes (synthetic movie boxes
// here). With ffmpeg installed, a file made like After Effects' (AAC, no edit
// list, a click at a known sample) is fixed and decoded again to measure
// where the click lands. Nothing here reaches After Effects.

import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import "../src/operations/index.js";
import {
  AE_AAC_PRIMING_SAMPLES,
  alignSound,
  parseEbur128Summary,
  readSoundSync,
  soundSyncOf,
  soundTrackFromMoov,
  type SoundSync,
} from "../src/operations/delivery-sound.js";
import {
  checkDelivered,
  probeDelivered,
  runDeliver,
  type DeliverIO,
} from "../src/operations/render.js";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

// ------------------------------------------------------------ synthetic boxes

const u32 = (n: number) => {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
};
const i32 = (n: number) => {
  const b = Buffer.alloc(4);
  b.writeInt32BE(n);
  return b;
};
const box = (type: string, ...parts: Buffer[]) => {
  const body = Buffer.concat(parts);
  return Buffer.concat([u32(body.length + 8), Buffer.from(type, "latin1"), body]);
};
const full = (type: string, ...parts: Buffer[]) => box(type, Buffer.alloc(4), ...parts);

function soundTrak(opts: { codec: string; rate: number; elst?: Array<[number, number]> }): Buffer {
  const entry = box(
    opts.codec,
    Buffer.alloc(6),
    Buffer.from([0, 1]),
    Buffer.alloc(8),
    Buffer.from([0, 2, 0, 16, 0, 0, 0, 0]),
    u32(opts.rate * 65536),
  );
  const stsd = full("stsd", u32(1), entry);
  const mdhd = full("mdhd", u32(0), u32(0), u32(opts.rate), u32(opts.rate * 2), Buffer.alloc(4));
  const hdlr = full("hdlr", u32(0), Buffer.from("soun", "latin1"), Buffer.alloc(12));
  const mdia = box("mdia", mdhd, hdlr, box("minf", box("stbl", stsd)));
  const edts = opts.elst
    ? [
        box(
          "edts",
          full(
            "elst",
            u32(opts.elst.length),
            ...opts.elst.flatMap(([d, t]) => [u32(d), i32(t), u32(0x10000)]),
          ),
        ),
      ]
    : [];
  return box("trak", ...edts, mdia);
}
function videoTrak(): Buffer {
  const hdlr = full("hdlr", u32(0), Buffer.from("vide", "latin1"), Buffer.alloc(12));
  return box(
    "trak",
    box("mdia", full("mdhd", u32(0), u32(0), u32(15360), u32(30720), Buffer.alloc(4)), hdlr),
  );
}
/** The inside of a moov box. */
const moovBody = (...traks: Buffer[]) =>
  Buffer.concat([full("mvhd", u32(0), u32(0), u32(1000), u32(2000)), ...traks]);

describe("the delivered file's sound sync, from its boxes", () => {
  it("reads After Effects' AAC with no edit list as 1,024 samples late (0.64 of a frame at 30 fps, 48 kHz)", () => {
    const t = soundTrackFromMoov(moovBody(videoTrak(), soundTrak({ codec: "mp4a", rate: 48000 })))!;
    expect(t).toMatchObject({
      codec: "mp4a",
      sampleRate: 48000,
      mediaTimescale: 48000,
      movieTimescale: 1000,
      edits: null,
    });
    const s = soundSyncOf(t);
    expect(s).toMatchObject({
      primingSamples: AE_AAC_PRIMING_SAMPLES,
      skippedSamples: 0,
      lateBySamples: 1024,
      lateMs: 21.33,
    });
    expect((s.lateBySamples / s.sampleRate) * 30).toBeCloseTo(0.64, 2);
    expect(s.reading).toMatch(/not skipped \(no edit list\)/);
  });
  it("reads an edit list that skips the priming as on its frame, and PCM as having no priming", () => {
    const fixed = soundSyncOf(
      soundTrackFromMoov(
        moovBody(soundTrak({ codec: "mp4a", rate: 48000, elst: [[2000, 1024]] })),
      )!,
    );
    expect(fixed).toMatchObject({ skippedSamples: 1024, lateBySamples: 0 });
    const zero = soundSyncOf(
      soundTrackFromMoov(moovBody(soundTrak({ codec: "mp4a", rate: 48000, elst: [[2000, 0]] })))!,
    );
    expect(zero.lateBySamples).toBe(1024);
    const pcm = soundSyncOf(
      soundTrackFromMoov(moovBody(soundTrak({ codec: "sowt", rate: 48000 })))!,
    );
    expect(pcm).toMatchObject({ primingSamples: 0, lateBySamples: 0 });
    // An empty edit before the sound delays it.
    const delayed = soundSyncOf(
      soundTrackFromMoov(
        moovBody(
          soundTrak({
            codec: "sowt",
            rate: 48000,
            elst: [
              [10, -1],
              [2000, 0],
            ],
          }),
        ),
      )!,
    );
    expect(delayed.lateBySamples).toBe(480);
    expect(soundTrackFromMoov(moovBody(videoTrak()))).toBeNull();
  });
});

describe("checkDelivered: sound on its frame, and its loudness", () => {
  const comp = {
    width: 1080,
    height: 1920,
    frameRate: 30,
    duration: 2,
    hasSound: true,
    soundLayers: ["voice"],
  };
  const base = {
    width: 1080,
    height: 1920,
    frameRate: 30,
    duration: 2,
    hasAudio: true,
    level: { source: "ffmpeg" as const, meanDb: -27, maxDb: -6 },
  };
  const late: SoundSync = soundSyncOf(
    soundTrackFromMoov(moovBody(soundTrak({ codec: "mp4a", rate: 48000 })))!,
  );
  const onFrame: SoundSync = soundSyncOf(
    soundTrackFromMoov(moovBody(soundTrak({ codec: "mp4a", rate: 48000, elst: [[2000, 1024]] })))!,
  );

  it("flags sound that is still late, with how much and the command that fixes it", () => {
    const r = checkDelivered(comp, {
      ...base,
      sync: late,
      alignment: {
        aligned: false,
        how: "ffmpeg is not installed, so the file could not be remuxed",
      },
    });
    expect(r.passed).toBe(false);
    expect(r.findings.map((f) => f.kind)).toEqual(["sound late"]);
    expect(r.findings[0].reading).toMatch(/1024 samples \(21\.33 ms, 0\.64 of a frame\) late/);
    expect(r.findings[0].reading).toMatch(/ffmpeg is not installed/);
    expect(r.findings[0].reading).toMatch(/-itsoffset -0\.021333/);
  });
  it("says the sound was put on its frame, and gives integrated loudness and true peak", () => {
    const r = checkDelivered(comp, {
      ...base,
      sync: onFrame,
      alignment: { aligned: true, how: "remuxed with ffmpeg", before: late, after: onFrame },
      loudness: { integratedLufs: -14.2, loudnessRangeLu: 5.1, truePeakDbtp: -1.4 },
    });
    expect(r.passed).toBe(true);
    expect(r.reading).toMatch(/on its frame \(it was 1024 samples late: remuxed with ffmpeg\)/);
    expect(r.reading).toMatch(/-14\.2 LUFS integrated, true peak -1\.4 dBTP, range 5\.1 LU/);
    expect(r.reading).not.toMatch(/can clip/);
    const hot = checkDelivered(comp, {
      ...base,
      sync: onFrame,
      loudness: { integratedLufs: -9, loudnessRangeLu: null, truePeakDbtp: 0.3 },
    });
    expect(hot.passed).toBe(true);
    expect(hot.reading).toMatch(/true peak is above -1 dBTP/);
  });
  it("reads ffmpeg's ebur128 summary", () => {
    const stderr = [
      "[Parsed_ebur128_1 @ 0x1] t: 2.9   TARGET:-23 LUFS    M: -33.8 S: -33.8     I: -33.8 LUFS       LRA:  20.0 LU  FTPK: -30.0 dBFS  TPK: -29.3 dBFS",
      "[Parsed_ebur128_1 @ 0x1] Summary:",
      "",
      "  Integrated loudness:",
      "    I:         -16.4 LUFS",
      "    Threshold: -26.7 LUFS",
      "",
      "  Loudness range:",
      "    LRA:         6.2 LU",
      "    Threshold: -36.5 LUFS",
      "",
      "  True peak:",
      "    Peak:       -0.8 dBFS",
    ].join("\n");
    expect(parseEbur128Summary(stderr)).toEqual({
      integratedLufs: -16.4,
      loudnessRangeLu: 6.2,
      truePeakDbtp: -0.8,
    });
    expect(parseEbur128Summary("no summary")).toBeNull();
  });
});

describe("render.deliver puts the sound on its frame before checking the file", () => {
  const STOCK = ["H.264 - Match Render Settings - 15 Mbps", "High Quality"];
  const late = soundSyncOf(
    soundTrackFromMoov(moovBody(soundTrak({ codec: "mp4a", rate: 48000 })))!,
  );
  const onFrame = soundSyncOf(
    soundTrackFromMoov(moovBody(soundTrak({ codec: "mp4a", rate: 48000, elst: [[2000, 1024]] })))!,
  );
  function io(withAlign: boolean): DeliverIO & { aligned: string[] } {
    const aligned: string[] = [];
    let fixed = false;
    return {
      aligned,
      execute: async (_code: string, opts: Any) => {
        if (/plan/.test(opts.label))
          return {
            ok: true,
            comp: "Main",
            width: 1080,
            height: 1920,
            frameRate: 30,
            duration: 2,
            hasSound: true,
            soundLayers: ["voice"],
            templates: STOCK,
          };
        if (/read back/.test(opts.label))
          return {
            ok: true,
            width: 1080,
            height: 1920,
            frameRate: 30,
            duration: 2,
            hasAudio: true,
            amplitudeTop: 21,
          };
        if (/deliver render/.test(opts.label))
          return { ok: true, outputPath: "/tmp/x.mp4", renderSeconds: 3, audio: {} };
        return { ok: false, error: "?" };
      },
      freeBytes: async () => 500e9,
      probe: async () => ({
        width: 1080,
        height: 1920,
        frameRate: 30,
        duration: 2,
        hasAudio: true,
        meanDb: -27,
        maxDb: -3,
        loudness: { integratedLufs: -15, loudnessRangeLu: 4, truePeakDbtp: -2 },
      }),
      soundSync: async () => (fixed ? onFrame : late),
      ...(withAlign
        ? {
            alignSound: async (file: string) => {
              aligned.push(file);
              fixed = true;
              return { aligned: true, how: "remuxed with ffmpeg", before: late, after: onFrame };
            },
          }
        : {}),
    };
  }
  it("remuxes late sound, reads it back on its frame and reports loudness", async () => {
    const f = io(true);
    const r = await runDeliver(
      { comp: "Main", preset: "vertical-reel", outputPath: "/tmp/x.mp4" },
      f,
    );
    expect(f.aligned).toEqual(["/tmp/x.mp4"]);
    expect(r.check.passed).toBe(true);
    expect(r.check.file.sync.lateBySamples).toBe(0);
    expect(r.check.file.loudness).toMatchObject({ integratedLufs: -15, truePeakDbtp: -2 });
    expect(r.check.reading).toMatch(/on its frame/);
  });
  it("is a 'sound late' finding when the sound cannot be remuxed", async () => {
    const r = await runDeliver(
      { comp: "Main", preset: "vertical-reel", outputPath: "/tmp/x.mp4" },
      io(false),
    );
    expect(r.check.passed).toBe(false);
    expect(r.check.findings.map((x: Any) => x.kind)).toEqual(["sound late"]);
  });
});

// ------------------------------------------------------------ with ffmpeg, measured

function has(tool: string): boolean {
  try {
    execFileSync(tool, ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
const FFMPEG_THERE = has("ffmpeg") && has("ffprobe");

/** The first sample of the decoded sound (mono s16, 48 kHz) above half scale. */
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

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-deliver-sound-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe.skipIf(!FFMPEG_THERE)(
  "with ffmpeg: a file made like After Effects' is put on its frame",
  () => {
    it("moves a click at sample 24,000 from 25,024 back to 24,000, nothing re-encoded, and measures the loudness", async () => {
      const file = path.join(dir, "delivery.mp4");
      // AAC with no edit list (as After Effects writes it), H.264 without B-frames, a click 0.5 s in.
      execFileSync("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=black:s=64x64:r=30:d=2",
        "-f",
        "lavfi",
        "-i",
        "aevalsrc='if(between(n,24000,24047),0.8,0)':s=48000:d=2",
        "-c:v",
        "libx264",
        "-bf",
        "0",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-use_editlist",
        "0",
        file,
      ]);
      const before = (await readSoundSync(file))!;
      expect(before).toMatchObject({
        codec: "mp4a",
        sampleRate: 48000,
        skippedSamples: 0,
        lateBySamples: 1024,
      });
      expect(firstClick(file)).toBe(24000 + 1024);
      const bytesBefore = (await fs.stat(file)).size;

      const res = await alignSound(file, before);
      expect(res.aligned).toBe(true);
      const after = (await readSoundSync(file))!;
      expect(after).toMatchObject({ skippedSamples: 1024, lateBySamples: 0 });
      expect(firstClick(file)).toBe(24000);
      // A remux, not an encode: the file is about the same size, and nothing is left beside it.
      expect(Math.abs((await fs.stat(file)).size - bytesBefore)).toBeLessThan(2048);
      expect(await fs.readdir(dir)).toEqual(["delivery.mp4"]);

      const probe = (await probeDelivered(file))!;
      expect(probe.hasAudio).toBe(true);
      expect(probe.loudness).not.toBeNull();
      expect(Number.isFinite(probe.loudness!.truePeakDbtp)).toBe(true);
      expect(probe.loudness!.truePeakDbtp).toBeLessThan(0);
    }, 60_000);
  },
);

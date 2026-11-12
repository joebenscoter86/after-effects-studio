// Reading motion and sound (professional-finish plan, stage 6): a property's
// curve with its speed and flags, onsets from loudness, timing files, and
// how far events sit from the nearest marker.

import { describe, expect, it } from "vitest";

import {
  analyzeCurve,
  CURVE_DEFAULTS,
  curveGraph,
  parseTiming,
  soundOnsets,
  syncReport,
} from "../src/color/motion.js";
import { promises as fsp } from "node:fs";
import os from "node:os";
import nodePath from "node:path";

import { decodePng } from "../src/color/png16.js";
import "../src/operations/index.js";
import { getOp } from "../src/registry.js";
import {
  runCurve,
  runSoundMarkers,
  runSync,
  type MotionSoundIO,
} from "../src/operations/sample.js";


const FPS = 30;
/** Value per frame from a function of time in 0..1 over [a, b] frames, held before and after. */
function move(n: number, a: number, b: number, from: number, to: number, shape: (u: number) => number) {
  return Array.from({ length: n }, (_, f) => {
    const u = f <= a ? 0 : f >= b ? 1 : (f - a) / (b - a);
    return { frame: f, time: f / FPS, value: [from + (to - from) * shape(u)] };
  });
}
const linear = (u: number) => u;
const easy = (u: number) => u * u * (3 - 2 * u); // ease in and out
const overshoot = (u: number) => (u < 0.7 ? easy(u / 0.7) * 1.15 : 1.15 - 0.15 * easy((u - 0.7) / 0.3));

describe("analyzeCurve", () => {
  it("finds one move with eased ends and flags nothing", () => {
    const r = analyzeCurve(move(60, 10, 40, 0, 300, easy), FPS);
    expect(r.moves).toHaveLength(1);
    expect(r.moves[0]).toMatchObject({ from: 10, to: 40, startEase: "eased", endEase: "eased" });
    expect(r.flags).toEqual([]);
    expect(r.frames[25].speed).toBeGreaterThan(0);
  });

  it("flags a linear move: no ease at either end", () => {
    const r = analyzeCurve(move(60, 10, 40, 0, 300, linear), FPS);
    expect(r.moves[0]).toMatchObject({ startEase: "none", endEase: "none" });
    const f = r.flags.find((x) => x.kind === "no ease")!;
    expect(f).toBeDefined();
    expect(f.reading).toMatch(/starts and stops at full speed/);
    expect(f.frames).toEqual([10, 40]);
  });

  it("flags a sudden jump in speed inside a move", () => {
    const s = move(60, 10, 40, 0, 300, (u) => (u < 0.5 ? 0.2 * easy(u * 2) : 0.2 + 0.8 * ((u - 0.5) * 2)));
    const r = analyzeCurve(s, FPS);
    expect(r.flags.some((x) => x.kind === "speed jump")).toBe(true);
  });

  it("reports how far a move overshoots and how long it takes to settle", () => {
    const r = analyzeCurve(move(80, 10, 50, 0, 200, overshoot), FPS);
    expect(r.moves).toHaveLength(1);
    const m = r.moves[0];
    expect(m.overshoot!.share).toBeGreaterThan(0.12);
    expect(m.overshoot!.share).toBeLessThan(0.18);
    expect(m.settle!.frames).toBeGreaterThan(5);
    expect(r.flags.find((x) => x.kind === "overshoot")!.reading).toMatch(/15%/);
  });

  it("reads 2D values by their length, and draws a graph", () => {
    const s = move(40, 5, 25, 0, 100, easy).map((x) => ({ ...x, value: [x.value[0], x.value[0] / 2] }));
    const r = analyzeCurve(s, FPS);
    expect(r.moves[0].distance).toBeCloseTo(Math.hypot(100, 50), 0);
    const g = curveGraph(r, { width: 200, height: 80 });
    expect(g.width).toBe(200);
    expect(g.rgb.length).toBe(200 * 80 * 3);
    expect(CURVE_DEFAULTS.noEaseAbove).toBeGreaterThan(0);
  });

  it("says a still property does not move", () => {
    const r = analyzeCurve(move(20, 0, 0, 5, 5, linear), FPS);
    expect(r.moves).toEqual([]);
    expect(r.reading).toMatch(/does not move/);
  });
});

describe("soundOnsets", () => {
  it("finds the frames where loudness rises past its threshold", () => {
    const v = Array.from({ length: 90 }, (_, f) => ([15, 16, 36, 37, 60, 61].includes(f) ? 21 : 0.2));
    const o = soundOnsets(v, FPS);
    expect(o.map((x) => x.frame)).toEqual([15, 36, 60]);
    expect(o[0].time).toBeCloseTo(0.5, 5);
  });

  it("finds nothing in silence", () => {
    expect(soundOnsets(new Array(30).fill(0), FPS)).toEqual([]);
  });
});

describe("parseTiming", () => {
  it("reads word lists in seconds or frames, and CSV", () => {
    expect(parseTiming(JSON.stringify([{ word: "one", start: 0.5 }, { text: "two", time: 1.25 }]), FPS)).toEqual([
      { time: 0.5, label: "one" },
      { time: 1.25, label: "two" },
    ]);
    expect(parseTiming(JSON.stringify([{ w: "ChatGPT", frame: 2 }]), FPS)).toEqual([{ time: 2 / FPS, label: "ChatGPT" }]);
    expect(parseTiming("time,label\n0.5,beat\n1.2,beat\n", FPS)).toEqual([
      { time: 0.5, label: "beat" },
      { time: 1.2, label: "beat" },
    ]);
  });

  it("refuses what it cannot read", () => {
    expect(() => parseTiming(JSON.stringify([{ word: "x" }]), FPS)).toThrow(/time/);
  });
});

describe("syncReport", () => {
  const markers = [0.5, 1.2, 2.0].map((t) => ({ time: t, label: "beat" }));
  it("gives each event's distance in frames to the nearest marker, and flags the late one", () => {
    const events = [
      { name: "hit 1", time: 0.5 },
      { name: "hit 2", time: 1.2 + 1 / FPS },
      { name: "hit 3", time: 2.0 + 4 / FPS },
    ];
    const r = syncReport(events, markers, FPS);
    expect(r.events.map((e) => e.frames)).toEqual([0, 1, 4]);
    expect(r.flags.map((f) => f.name)).toEqual(["hit 3"]);
    expect(r.flags[0].reading).toMatch(/4 frames after the nearest marker \('beat' at 2 s\)/);
  });

  it("allows more before the sound than after it", () => {
    const early = syncReport([{ name: "a", time: 0.5 - 3 / FPS }], markers, FPS);
    expect(early.flags).toEqual([]);
    const earlier = syncReport([{ name: "a", time: 0.5 - 5 / FPS }], markers, FPS);
    expect(earlier.flags[0].reading).toMatch(/5 frames before/);
  });

  it("says when there are no markers to compare with", () => {
    expect(syncReport([{ name: "a", time: 1 }], [], FPS).reading).toMatch(/no markers/i);
  });
});

// ------------------------------------------------------------ the operations

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function fakeIO(answers: Record<string, Any>): MotionSoundIO & { calls: Any[] } {
  const calls: Any[] = [];
  return {
    calls,
    execute: async (code: string, opts: Any) => {
      calls.push({ code, label: opts.label });
      const k = Object.keys(answers).find((a) => opts.label.includes(a));
      return k ? answers[k] : { ok: false, error: `no answer for ${opts.label}` };
    },
  };
}

describe("the operations", () => {
  it("are registered as Node operations", () => {
    for (const n of ["motion.curve", "sound.markers", "sound.sync"]) expect(getOp(n)!.run).toBeTypeOf("function");
  });

  it("motion.curve reads a property per frame, flags a linear move, and draws the graph", async () => {
    const dir = await fsp.mkdtemp(nodePath.join(os.tmpdir(), "ae-curve-"));
    const vals = move(60, 10, 40, 0, 300, linear).map((s) => [s.value[0], 540]);
    const io = fakeIO({
      "motion.curve": { ok: true, layer: "B", property: "Position", fps: 30, startFrame: 0, values: vals, keys: [{ time: 10 / 30, frame: 10 }, { time: 40 / 30, frame: 40 }] },
    });
    const out = nodePath.join(dir, "curve.png");
    const res = await runCurve({ comp: "Main", layer: "B", property: "Position", outPath: out }, io);
    expect(res.ok).toBe(true);
    expect(res.flags.map((f: Any) => f.kind)).toEqual(["no ease"]);
    expect(res.keys).toHaveLength(2);
    expect(io.calls[0].code).toContain("KeyframeInterpolationType.LINEAR");
    expect(res.frames).toBeUndefined(); // per-frame values only with perFrame: true
    expect(decodePng(await fsp.readFile(out)).width).toBe(480);
    expect(io.calls[0].code).toContain('"Transform"');
    await fsp.rm(dir, { recursive: true, force: true });
  });

  it("sound.markers puts beats from loudness on the comp, and says when the track reads as silence", async () => {
    const loud = Array.from({ length: 90 }, (_, f) => ([15, 16, 36, 37, 60, 61].includes(f) ? 21 : 0));
    const io = fakeIO({
      amplitude: { ok: true, fps: 30, left: loud, right: loud.map(() => 0), both: loud.map((v) => v / 2) },
      add: { ok: true, added: 3, removed: 0 },
    });
    const res = await runSoundMarkers({ comp: "Main", layer: "voice.wav" }, io);
    expect(res.ok).toBe(true);
    expect(res.markers.map((m: Any) => m.frame)).toEqual([15, 36, 60]);
    const add = io.calls.find((c) => /add/.test(c.label));
    expect(add.code).toContain("sound: beat");
    const silent = await runSoundMarkers(
      { comp: "Main", layer: "take.mp4" },
      fakeIO({ amplitude: { ok: true, fps: 30, left: new Array(90).fill(0), right: new Array(90).fill(0), both: new Array(90).fill(0) } }),
    );
    expect(silent.ok).toBe(false);
    expect(silent.error).toMatch(/silence/);
    expect(silent.error).toMatch(/mono WAV/);
    // A four-channel take read live as a top of 0.002 on the left and 0 on the right: silence too.
    const faint = new Array(90).fill(0).map((_, f) => (f % 7 === 0 ? 0.002 : 0));
    const flat = await runSoundMarkers(
      { comp: "Main", layer: "take.mp4" },
      fakeIO({ amplitude: { ok: true, fps: 30, left: faint, right: new Array(90).fill(0), both: faint.map((v) => v / 2) } }),
    );
    expect(flat.ok).toBe(false);
    expect(flat.error).toMatch(/silence/);
  });

  it("sound.markers reads a timing file", async () => {
    const dir = await fsp.mkdtemp(nodePath.join(os.tmpdir(), "ae-timing-"));
    const f = nodePath.join(dir, "words.json");
    await fsp.writeFile(f, JSON.stringify([{ w: "one", frame: 15 }, { w: "two", frame: 36 }]));
    const io = fakeIO({ fps: { ok: true, fps: 30 }, add: { ok: true, added: 2, removed: 0 } });
    const res = await runSoundMarkers({ comp: "Main", timing: f }, io);
    expect(res.ok).toBe(true);
    expect(res.markers.map((m: Any) => m.label)).toEqual(["one", "two"]);
    expect(io.calls.find((c) => /add/.test(c.label)).code).toContain("sound: one");
    await fsp.rm(dir, { recursive: true, force: true });
  });

  it("sound.sync measures in-points and key times against the comp's markers", async () => {
    const io = fakeIO({
      "sound.sync": {
        ok: true,
        fps: 30,
        markers: [0.5, 1.2, 2.0].map((t) => ({ time: t, comment: "sound: beat" })),
        events: [
          { name: "hit 1 in-point", time: 0.5 },
          { name: "hit 2 in-point", time: 1.2 },
          { name: "hit 3 in-point", time: 2.0 + 4 / 30 },
        ],
      },
    });
    const res = await runSync({ comp: "Main", inPoints: ["hit 1", "hit 2", "hit 3"] }, io);
    expect(res.ok).toBe(true);
    expect(res.flags.map((f: Any) => f.name)).toEqual(["hit 3 in-point"]);
    expect(res.events.map((e: Any) => e.frames)).toEqual([0, 0, 4]);
  });
});

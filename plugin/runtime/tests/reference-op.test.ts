// reference.report and reference.compare: the report on a still, a folder of
// frames, a movie or a comp, saved as JSON; a compare against a saved report.

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { encodePngSrgb8 } from "../src/color/png16.js";
import { runReferenceCompare, runReferenceReport, type FileIO } from "../src/operations/keying.js";
import "../src/operations/index.js";
import { getOp } from "../src/registry.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const W = 96;
const H = 160;
const CUT = 8;

/** A grey room with stripes, a pink square that drifts right, a cut at CUT where the room shifts. */
function picture(f: number, small = false): Float64Array {
  const rgb = new Float64Array(W * H * 3);
  const shift = f >= CUT ? 7 : 0;
  const k = small ? 0.75 : 1;
  const cx = 48 + 2 * Math.sin(f / 2) * 3;
  const cy = 100;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      const stripe = ((x + shift) >> 2) & 1 ? 0.3 : 0.15;
      const inSq = Math.abs(x - cx) <= 18 * k && Math.abs(y - cy) <= 26 * k;
      const c = inSq ? [0.8, 0.55, 0.5] : [stripe, stripe, stripe + 0.05];
      for (let ch = 0; ch < 3; ch++) rgb[i + ch] = c[ch];
    }
  return rgb;
}
const png = (f: number, small = false) => encodePngSrgb8(W, H, picture(f, small));

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-reference-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

/** A fake After Effects: a movie or comp of `frames` frames, rendered by frame number. */
function aeIO(frames = 16, small = false): FileIO & { calls: Any[] } {
  const calls: Any[] = [];
  return {
    calls,
    execute: async (code: string, opts: Any) => {
      calls.push({ label: opts.label, code });
      if (/setup/.test(opts.label))
        return { ok: true, compId: 901, compName: "reference 1", itemId: 77, itemName: "ref.mov", imported: true, width: W, height: H, frames, frameRate: 30 };
      if (/comp/.test(opts.label)) return { ok: true, name: "Main", width: W, height: H, frames, frameRate: 30 };
      if (/cleanup/.test(opts.label)) return { ok: true, removed: ["reference 1"] };
      return { ok: false, error: "unexpected" };
    },
    render: async (args: Any) => {
      calls.push({ render: args });
      const stem = args.outPath.replace(/\.png$/, "");
      const out = [];
      for (const [i, frame] of (args.frames as number[]).entries()) {
        const f = `${stem}_${i}.png`;
        await fs.writeFile(f, png(frame, small));
        out.push({ ok: true, frame, writtenTo: f });
      }
      return { ok: true, frames: out };
    },
    readImage: async (f: string) => (await import("../src/color/png16.js")).decodePng(await fs.readFile(f)),
    freeBytes: async () => 500e9,
    exists: async () => true,
  };
}

const noAE: FileIO = {
  execute: async () => {
    throw new Error("After Effects was called");
  },
  render: async () => {
    throw new Error("After Effects was called");
  },
  readImage: async (f: string) => (await import("../src/color/png16.js")).decodePng(await fs.readFile(f)),
  freeBytes: async () => 500e9,
};

describe("reference.report", () => {
  it("is registered, with reference.compare, as Node operations", () => {
    expect(getOp("reference.report")!.run).toBeTypeOf("function");
    expect(getOp("reference.compare")!.run).toBeTypeOf("function");
    expect(getOp("reference.report")!.description).toMatch(/frame numbers/);
  });

  it("reads a folder of frames in name order without After Effects, and saves the report", async () => {
    const frames = path.join(dir, "frames");
    await fs.mkdir(frames);
    for (let f = 0; f < 16; f++) await fs.writeFile(path.join(frames, `f_${String(f).padStart(3, "0")}.png`), png(f));
    const out = path.join(dir, "ref.json");
    const res = await runReferenceReport({ path: frames, outPath: out, frameRate: 30 }, noAE);
    expect(res.ok).toBe(true);
    expect(res.frames).toBe(16);
    expect(res.source).toMatchObject({ kind: "frames" });
    expect(res.report.motion.cuts).toEqual([{ frame: CUT, time: CUT / 30 }]);
    expect(res.report.motion.map).toBeUndefined(); // in the file, not the reply
    const saved = JSON.parse(await fs.readFile(out, "utf8"));
    expect(saved.motion.map.values.length).toBeGreaterThan(0);
    expect(res.savedTo).toBe(out);
  });

  it("reads one still", async () => {
    const still = path.join(dir, "still.png");
    await fs.writeFile(still, png(0));
    const res = await runReferenceReport({ path: still, outPath: path.join(dir, "s.json") }, noAE);
    expect(res.ok).toBe(true);
    expect(res.frames).toBe(1);
    expect(res.source.kind).toBe("still");
  });

  it("brings a movie into a throwaway comp, renders every frame by number, and cleans up", async () => {
    const io = aeIO(16);
    const res = await runReferenceReport(
      { path: path.join(dir, "ref.mov"), outPath: path.join(dir, "m.json") },
      io,
    );
    expect(res.ok).toBe(true);
    expect(res.frames).toBe(16);
    expect(res.source).toMatchObject({ kind: "movie", frameRate: 30 });
    const renders = io.calls.filter((c) => c.render).map((c) => c.render);
    expect(renders.every((r: Any) => Array.isArray(r.frames) && r.times === undefined)).toBe(true);
    expect(renders.flatMap((r: Any) => r.frames)).toEqual(Array.from({ length: 16 }, (_, i) => i));
    expect(io.calls.some((c) => /cleanup/.test(c.label))).toBe(true);
    expect(res.report.motion.cuts).toEqual([{ frame: CUT, time: CUT / 30 }]);
    // Captures are removed once read.
    const left = (await fs.readdir(dir)).filter((f) => f.endsWith(".png"));
    expect(left).toEqual([]);
  });

  it("reads a comp (the build) the same way, and compares it with a saved report", async () => {
    const refPath = path.join(dir, "ref.json");
    await runReferenceReport({ path: path.join(dir, "ref.mov"), outPath: refPath }, aeIO(16));
    const io = aeIO(16, true);
    const res = await runReferenceReport(
      { comp: "Main", outPath: path.join(dir, "build.json"), against: refPath },
      io,
    );
    expect(res.ok).toBe(true);
    expect(res.source).toMatchObject({ kind: "comp", name: "Main" });
    expect(io.calls.filter((c) => c.render).every((c: Any) => c.render.compNameOrId === "Main")).toBe(true);
    expect(res.compare.differences.length).toBeGreaterThan(0);
    expect(res.compare.reading).toBeTypeOf("string");
  });

  it("refuses without an outPath or with two sources", async () => {
    const a = await runReferenceReport({ path: path.join(dir, "x.png") }, noAE);
    expect(a.ok).toBe(false);
    expect(a.error).toMatch(/outPath/);
    const b = await runReferenceReport(
      { path: path.join(dir, "x.mov"), comp: "Main", outPath: path.join(dir, "y.json") },
      noAE,
    );
    expect(b.ok).toBe(false);
    expect(b.error).toMatch(/exactly one/);
  });
});

describe("reference.compare", () => {
  it("compares two saved reports, largest difference first, without After Effects", async () => {
    const frames = path.join(dir, "frames");
    const small = path.join(dir, "small");
    await fs.mkdir(frames);
    await fs.mkdir(small);
    for (let f = 0; f < 16; f++) {
      await fs.writeFile(path.join(frames, `f_${String(f).padStart(3, "0")}.png`), png(f));
      await fs.writeFile(path.join(small, `f_${String(f).padStart(3, "0")}.png`), png(f, true));
    }
    await runReferenceReport({ path: frames, outPath: path.join(dir, "a.json") }, noAE);
    await runReferenceReport({ path: small, outPath: path.join(dir, "b.json") }, noAE);
    const res = await runReferenceCompare({
      reference: path.join(dir, "a.json"),
      build: path.join(dir, "b.json"),
    });
    expect(res.ok).toBe(true);
    for (let i = 1; i < res.differences.length; i++)
      expect(res.differences[i].size).toBeLessThanOrEqual(res.differences[i - 1].size);
    expect(res.reading).toBeTypeOf("string");
  });
});

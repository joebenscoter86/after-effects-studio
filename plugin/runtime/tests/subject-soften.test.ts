// Offline tests for subject.soften_edge (professional-finish plan, stage 5):
// the closing check's measures (color/matte.ts), the operation run against
// made-up mattes through injected After Effects calls, and how the rest of the
// cut-out path finds the softened layer. Nothing here reaches After Effects.

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { furthestFrame, matteCoverage, subjectTop } from "../src/color/matte.js";
import { decodePng, encodePngSrgb8, encodePngSrgbRgba8 } from "../src/color/png16.js";
import {
  SOFT_EDGE_DEFAULTS,
  runSoftenEdge,
  softRegionBottom,
  softenBuildJsx,
  softenUndoJsx,
  type SoftenIO,
} from "../src/operations/keying.js";
import { getOp } from "../src/registry.js";
import "../src/operations/index.js";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const W = 200;
const H = 300;
let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "soften-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

/** A person: a head (circle, top at y = 50 + dy) on a body touching the bottom edge. */
function person(dy = 0, soft = false, band: [number, number, number] | null = null): Float64Array {
  const a = new Float64Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x + 0.5 - 100, y + 0.5 - (80 + dy)) - 30;
      let v = Math.max(
        y >= 110 + dy && x >= 40 && x < 160 ? 1 : 0,
        soft ? Math.min(1, Math.max(0, 0.5 - d / 6)) : d <= 0 ? 1 : 0,
      );
      if (band && y >= band[0] && y < band[1]) v = Math.min(v, band[2]);
      a[y * W + x] = v;
    }
  return a;
}

describe("the closing check's measures", () => {
  it("finds the subject's top", () => {
    expect(subjectTop(person(), W, H)).toBe(50);
    expect(subjectTop(person(12), W, H)).toBe(62);
  });

  it("counts nothing seen through when the result covers the matte as clicked", () => {
    const c = matteCoverage(person(), person(0, true), W, H);
    expect(c.seenThrough).toBe(0);
    expect(c.minAlpha).toBe(1);
  });

  it("counts a see-through band deep inside the subject, and its lowest alpha", () => {
    const c = matteCoverage(person(), person(0, false, [160, 170, 0.4]), W, H);
    expect(c.seenThrough).toBeGreaterThan(500);
    expect(c.minAlpha).toBeCloseTo(0.4, 6);
    expect(c.band).toEqual({ from: 160, to: 169 });
  });

  it("counts matte spread more than the set distance outside the outline as clicked", () => {
    const smear = person();
    for (let y = 60; y < 90; y++) for (let x = 20; x < 26; x++) smear[y * W + x] = 0.6; // 44 to 50 px off the head
    const c = matteCoverage(person(), smear, W, H, { outside: 10 });
    expect(c.outside.px).toBe(180);
    expect(c.outside.box).toEqual({ x: 20, y: 60, width: 6, height: 30 });
    expect(matteCoverage(person(), person(0, true), W, H).outside.px).toBe(0);
  });

  it("picks the frame whose outline is furthest from the click frame", () => {
    const f = furthestFrame(
      person(),
      [
        { frame: 10, alpha: person(2) },
        { frame: 20, alpha: person(20) },
        { frame: 30, alpha: person(8) },
      ],
      W,
      H,
    );
    expect(f.frame).toBe(20);
    expect(f.overlap).toBeLessThan(0.95);
  });

  it("puts the region's lower line an eighth of the frame under the lowest top", () => {
    expect(SOFT_EDGE_DEFAULTS).toMatchObject({
      radius: 8,
      smooth: 0,
      chatterReduction: 2,
      decontaminate: true,
      feather: 60,
      regionDepth: 0.12,
    });
    expect(softRegionBottom([776, 792, 780], 1920)).toBe(792 + 230);
    expect(softRegionBottom([776], 1920, 1000)).toBe(1000);
  });
});

describe("the build and its undo", () => {
  it("duplicates the matted layer twice, splits them with one feathered matte, Alpha Add, in a precomp, and switches the original off", () => {
    const j = softenBuildJsx({
      comp: "Main",
      layer: 1,
      radius: 8,
      smooth: 0,
      chatterReduction: 2,
      decontaminate: true,
      regionBottom: 1022,
      feather: 60,
    });
    for (const s of [
      "duplicate()",
      "TrackMatteType.ALPHA_INVERTED",
      "TrackMatteType.ALPHA)",
      "BlendingMode.ALPHA_ADD",
      "precompose(",
      '" soft edge"',
      "/baserefineedgeradius",
      "/HBspatialsmoothing",
      "/chatter_reduction2",
      "/rmcleanedgecolors",
      "audioEnabled = false",
      "_layer.enabled = false",
    ])
      expect(j, s).toContain(s);
    // No mask on the matted copies: a mask applies before the Object Matte (keying.md fact 38).
    expect(j).not.toMatch(
      /_up\.property\("ADBE Mask Parade"\)|_lo\.property\("ADBE Mask Parade"\)/,
    );
  });

  it("undoes by removing the precomp and switching the original back on", () => {
    const j = softenUndoJsx({ comp: "Main", layer: 1 });
    expect(j).toContain('" soft edge"');
    expect(j).toContain(".remove()");
    expect(j).toMatch(/_layer\.enabled = /);
  });

  it("is registered as a Node operation that says what it costs", () => {
    const op = getOp("subject.soften_edge")!;
    expect(op.run).toBeTypeOf("function");
    expect(op.description).toMatch(/twice/);
    expect(op.description).toMatch(/Decontaminate/);
  });
});

// ----------------------------------------------------- the run, with a fake

interface FakeState {
  built: boolean;
  undone: number;
}

/**
 * A fake After Effects: the matted layer "take" renders `asClicked(frame)`;
 * after the build, "take soft edge" renders `soft(frame)`; a render with no
 * isolate is the whole comp over navy, from whichever is on.
 */
function fakeIO(
  soft: (frame: number) => Float64Array,
  {
    asClicked = (f: number) => person(f >= 30 ? 20 : 0),
    buildFails = false,
    status = {} as Any,
  } = {},
): SoftenIO & { calls: Any[]; state: FakeState } {
  const state: FakeState = { built: false, undone: 0 };
  const calls: Any[] = [];
  const NAVY = [0.04, 0.07, 0.16];
  const SKIN = [0.8, 0.5, 0.5];
  return {
    calls,
    state,
    status: async () =>
      ({
        ok: true,
        layer: "take",
        objectMatte: { present: true },
        selections: [{ name: "Add Object 1", kind: "object", clickFrame: 0 }],
        summary: "1 object selected",
        span: { inFrame: 0, outFrame: 40, frameRate: 30 },
        sourceSize: [W, H],
        compSize: [W, H],
        ...status,
      }) as Any,
    execute: async (code: string, opts: Any) => {
      calls.push({ execute: opts.label });
      if (/undo/.test(opts.label)) {
        state.built = false;
        state.undone++;
        return { ok: true, removed: ["take soft edge"], restored: "take" };
      }
      if (buildFails) return { ok: false, error: "no Object Matte" };
      state.built = true;
      return { ok: true, softLayer: "take soft edge", precomp: "take soft edge", wasEnabled: true };
    },
    render: async (args: Any) => {
      calls.push({ render: args });
      const stem = args.outPath.replace(/\.png$/, "");
      const frames = [];
      for (const [i, frame] of (args.frames as number[]).entries()) {
        const f = `${stem}_${i}.png`;
        const iso = Array.isArray(args.isolate) ? args.isolate[0] : args.isolate;
        const a =
          iso === "take soft edge"
            ? soft(frame)
            : iso === "take"
              ? asClicked(frame)
              : state.built
                ? soft(frame)
                : asClicked(frame);
        if (args.channels === "rgba") {
          await fs.writeFile(
            f,
            encodePngSrgbRgba8(
              W,
              H,
              new Float64Array(W * H * 3).map((_, k) => SKIN[k % 3]),
              a,
            ),
          );
        } else {
          const rgb = new Float64Array(W * H * 3);
          for (let p = 0; p < W * H; p++)
            for (let k = 0; k < 3; k++) rgb[p * 3 + k] = SKIN[k] * a[p] + NAVY[k] * (1 - a[p]);
          await fs.writeFile(f, encodePngSrgb8(W, H, rgb));
        }
        frames.push({ ok: true, frame, writtenTo: f });
      }
      return { ok: true, frames };
    },
    readImage: async (f: string) => decodePng(await fs.readFile(f)),
    freeBytes: async () => 500e9,
  };
}

const ARGS = { comp: "Main", layer: "take", feather: 10 };

describe("subject.soften_edge", () => {
  it("builds, checks the click frame and the furthest frame, and keeps a build that passes", async () => {
    const io = fakeIO((f) => person(f >= 30 ? 20 : 0, true));
    const res = await runSoftenEdge({ ...ARGS, outDir: dir }, io);
    expect(res.ok).toBe(true);
    expect(io.state.built).toBe(true);
    expect(io.state.undone).toBe(0);
    expect(res.softLayer).toBe("take soft edge");
    expect(res.check.passed).toBe(true);
    expect(res.check.frames.map((c: Any) => c.frame)).toEqual([0, 32]);
    expect(res.check.furthest).toMatchObject({ frame: 32 });
    for (const c of res.check.frames) {
      expect(c.seenThrough).toBe(0);
      expect(c.colourDifference).toBeLessThan(1);
      expect(c.outside.px).toBe(0);
    }
    expect(res.region.bottom).toBe(70 + Math.round(0.12 * H)); // the lowest top (frame 32) + an eighth of the frame
    expect(res.region.chosen).toBe("automatic");
    expect(res.look.before.regionTop.edgeWidth).toBeLessThan(3);
    expect(res.look.after.regionTop.edgeWidth).toBeGreaterThan(
      res.look.before.regionTop.edgeWidth + 1.5,
    );
    expect(res.look.after.outside).toBeDefined();
    expect(res.look.after.regionTop).toHaveProperty("matteChange");
    expect(res.pictures.length).toBe(2);
    await fs.access(res.pictures[0]);
    expect(res.cost).toMatch(/twice/);
    // The measured render on the half-size take: time and cache against one matte.
    expect(res.cost).toMatch(/342 s/);
    expect(res.cost).toMatch(/9\.0 GB/);
  });

  it("undoes the build and says so when anything is seen through", async () => {
    const io = fakeIO((f) => person(f >= 30 ? 20 : 0, true, [180, 190, 0.3]));
    const res = await runSoftenEdge({ ...ARGS, outDir: dir }, io);
    expect(res.ok).toBe(false);
    expect(io.state.built).toBe(false);
    expect(io.state.undone).toBe(1);
    expect(res.check.passed).toBe(false);
    expect(res.check.frames[0].seenThrough).toBeGreaterThan(0);
    expect(res.error).toMatch(/seen through/);
    expect(res.error).toMatch(/undone/);
    expect(res.fallback).toMatch(/decontaminateEdgeColors: true/);
  });

  it("undoes the build when the matte spreads far outside the outline (a smear)", async () => {
    const smear = (f: number) => {
      const a = person(f >= 30 ? 20 : 0, true);
      for (let y = 60; y < 90; y++) for (let x = 20; x < 30; x++) a[y * W + x] = 0.7;
      return a;
    };
    const res = await runSoftenEdge({ ...ARGS, outDir: dir, outsideLimit: 50 }, fakeIO(smear));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/outside the outline/);
  });

  it("samples only the frames it is given, with the click frame", async () => {
    const io = fakeIO((f) => person(f >= 30 ? 20 : 0, true));
    const res = await runSoftenEdge({ ...ARGS, outDir: dir, sampleFrames: [10, 30] }, io);
    expect(res.ok).toBe(true);
    expect(res.region.tops.map((t: Any) => t.frame)).toEqual([0, 10, 30]);
    expect(res.check.furthest.frame).toBe(30);
    const first = io.calls.find((c: Any) => c.render)!.render;
    expect(Math.max(...first.frames)).toBe(30);
  });

  it("takes the region's line from the caller", async () => {
    const res = await runSoftenEdge(
      { ...ARGS, outDir: dir, regionBottom: 95 },
      fakeIO((f) => person(f >= 30 ? 20 : 0, true)),
    );
    expect(res.region).toMatchObject({ bottom: 95, chosen: "given" });
  });

  it("refuses before anything is clicked, or when the layer is already softened", async () => {
    const none = await runSoftenEdge(
      { ...ARGS, outDir: dir },
      fakeIO(() => person(), {
        status: {
          selections: [],
          summary:
            "Object Matte is on the layer but has no selection yet: the user has not clicked",
        },
      }),
    );
    expect(none.ok).toBe(false);
    expect(none.error).toMatch(/not clicked/);
    const twice = await runSoftenEdge(
      { ...ARGS, outDir: dir },
      fakeIO(() => person(), { status: { softEdge: { layer: "take soft edge" } } }),
    );
    expect(twice.ok).toBe(false);
    expect(twice.error).toMatch(/already/);
  });

  it("undoes on request in one call", async () => {
    const io = fakeIO(() => person());
    const res = await runSoftenEdge({ comp: "Main", layer: "take", undo: true }, io);
    expect(res.ok).toBe(true);
    expect(io.state.undone).toBe(1);
  });
});

// Offline tests for stage 12b, proofing the one-click cut-out: the enclosed
// hole finding and the fill mask (color/matte.ts), the close-clicks warning,
// and subject.check / subject.fill_gaps run against made-up mattes through
// injected After Effects calls. Nothing here reaches After Effects.
//
// The made-up matte is a 200 x 300 frame: a person-shaped solid block with a
// microphone-shaped hole in the chest (the missed mic, about 2,400 px here),
// a small gap beside it (the shock-mount gap, 120 px) and a 6 px pinhole.

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { enclosedHoles, growMask } from "../src/color/matte.js";
import { decodePng } from "../src/color/png16.js";
import {
  CUTOUT_HOLE_LIMIT,
  closeClicks,
  cutoutFindings,
  runFillGaps,
  runSubjectCheck,
  type CutoutIO,
} from "../src/operations/keying.js";
import { getOp } from "../src/registry.js";
import "../src/operations/index.js";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const W = 200;
const H = 300;

/** A person-shaped block (x 40..159, y 60..299, touching the bottom edge) with holes cut out of it. */
function matte(holes: Array<[number, number, number, number]> = []): Float64Array {
  const a = new Float64Array(W * H);
  for (let y = 60; y < H; y++) for (let x = 40; x < 160; x++) a[y * W + x] = 1;
  for (const [hx, hy, hw, hh] of holes)
    for (let y = hy; y < hy + hh; y++) for (let x = hx; x < hx + hw; x++) a[y * W + x] = 0;
  return a;
}
const MIC: [number, number, number, number] = [80, 150, 40, 60]; // 2,400 px
const GAP: [number, number, number, number] = [130, 160, 8, 15]; // 120 px
const PIN: [number, number, number, number] = [60, 100, 3, 2]; // 6 px

describe("enclosedHoles", () => {
  it("finds the regions below opaque that the frame edge cannot reach, largest first", () => {
    const { holes, mask, dropped } = enclosedHoles(matte([MIC, GAP, PIN]), W, H);
    expect(holes.map((h) => h.area)).toEqual([2400, 120, 6]);
    expect(holes[0]).toMatchObject({ x: 80, y: 150, width: 40, height: 60, meanAlpha: 0 });
    expect(dropped).toEqual({ count: 0, area: 0 });
    let set = 0;
    for (const v of mask) set += v;
    expect(set).toBe(2526);
  });

  it("leaves out the transparent background around the subject, which touches the edge", () => {
    const { holes } = enclosedHoles(matte(), W, H);
    expect(holes).toEqual([]);
  });

  it("drops the tiny ones from the list and the mask, and counts them", () => {
    const { holes, mask, dropped } = enclosedHoles(matte([MIC, PIN]), W, H, { minArea: 20 });
    expect(holes.map((h) => h.area)).toEqual([2400]);
    expect(dropped).toEqual({ count: 1, area: 6 });
    expect(mask[100 * W + 60]).toBe(0);
    expect(mask[150 * W + 80]).toBe(1);
  });

  it("counts partly transparent pixels as hole, as edge does", () => {
    const a = matte();
    for (let y = 120; y < 130; y++) for (let x = 90; x < 100; x++) a[y * W + x] = 0.5;
    expect(enclosedHoles(a, W, H).holes).toEqual([
      expect.objectContaining({ area: 100, meanAlpha: 0.5 }),
    ]);
  });
});

describe("growMask", () => {
  it("grows a mask by a radius in pixels, Euclidean, without wrapping at the frame edge", () => {
    const m = new Uint8Array(W * H);
    m[150 * W + 100] = 1;
    const g = growMask(m, W, H, 3);
    let n = 0;
    for (const v of g) n += v;
    expect(n).toBe(29); // the pixels within 3 px of one pixel
    expect(g[150 * W + 103]).toBe(1);
    expect(g[152 * W + 102]).toBe(1); // (2, 2): sqrt(8) is within 3
    expect(g[153 * W + 102]).toBe(0); // (2, 3): sqrt(13) is not
    const edge = new Uint8Array(W * H);
    edge[0] = 1;
    const ge = growMask(edge, W, H, 3);
    expect(ge[W - 1]).toBe(0);
    expect(growMask(m, W, H, 0)).toEqual(m);
  });
});

describe("closeClicks", () => {
  it("warns when two clicks sit close together, as the two mistaken clicks did", () => {
    const warnings = closeClicks(
      [
        { name: "Add Object 2", point: [1081, 2403] },
        { name: "Add Object 1", point: [1138, 2400] },
      ],
      [2176, 3840],
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({ a: "Add Object 2", b: "Add Object 1", limit: 108.8 });
    expect(warnings[0].distance).toBeCloseTo(57.08, 1);
    expect(warnings[0].reading).toMatch(/57 source pixels apart/);
    expect(warnings[0].reading).toMatch(/same thing/);
  });

  it("stays quiet for a click on the subject and one on the microphone", () => {
    expect(
      closeClicks(
        [
          { name: "Add Object 2", point: [1330, 3190] },
          { name: "Add Object 1", point: [1138, 2400] },
        ],
        [2176, 3840],
      ),
    ).toEqual([]);
  });

  it("takes its own distance and skips selections with no point", () => {
    const clicks = [
      { name: "a", point: [0, 0] as [number, number] },
      { name: "b", point: [30, 40] as [number, number] },
      { name: "c", point: null },
    ];
    expect(closeClicks(clicks, null, 60)).toHaveLength(1);
    expect(closeClicks(clicks, null, 40)).toEqual([]);
    expect(closeClicks(clicks, null)).toEqual([]); // no source size and no distance: no warning
  });
});

describe("cutoutFindings", () => {
  it("turns holes over the limit into findings, grouping one hole across frames", () => {
    const f = cutoutFindings(
      [
        {
          frame: 0,
          holes: [
            { x: 80, y: 150, width: 40, height: 60, area: 2400 },
            { x: 60, y: 100, width: 3, height: 2, area: 6 },
          ],
        },
        { frame: 40, holes: [{ x: 82, y: 151, width: 40, height: 60, area: 2380 }] },
        { frame: 80, holes: [] },
      ],
      1000,
    );
    expect(f).toEqual([
      {
        kind: "hole",
        frames: [0, 40],
        largestArea: 2400,
        box: { x: 80, y: 150, width: 42, height: 61 },
      },
    ]);
    expect(
      cutoutFindings([{ frame: 0, holes: [{ x: 0, y: 0, width: 3, height: 2, area: 6 }] }], 1000),
    ).toEqual([]);
  });

  it("uses a default limit chosen from the build record", () => {
    expect(CUTOUT_HOLE_LIMIT).toBe(1000);
  });
});

// ------------------------------------------------------- runs with fake AE

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-cutout-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

const STATUS_OK = {
  ok: true,
  layer: "raw_nogreen.mp4",
  objectMatte: { present: true, effectIndex: 1, count: 1 },
  selections: [
    { index: 1, name: "Add Object 2", kind: "object", point: [1081, 2403], durationStart: 15 },
    { index: 2, name: "Add Object 1", kind: "object", point: [1138, 2400], durationStart: 15 },
  ],
  counts: { object: 2, quickSelection: 0, other: 0 },
  summary: "2 objects selected",
  sourceSize: [2176, 3840],
  compSize: [W, H],
  span: { inFrame: 0, outFrame: 320, frameRate: 30 },
};

/** A fake render: every frame's matte is `matteAt(frame)`; edge holes measured from it. */
function fakeIO(
  matteAt: (frame: number) => Float64Array,
  extra: Partial<CutoutIO> = {},
): CutoutIO & { calls: Any[] } {
  const calls: Any[] = [];
  return {
    calls,
    status: async () => STATUS_OK as Any,
    render: async (args: Any) => {
      calls.push({ render: args });
      const frames = (args.frames as number[]).map((frame, i) => {
        const { holes } = enclosedHoles(matteAt(frame), W, H);
        return {
          ok: true,
          frame,
          writtenTo: `${args.outPath.replace(/\.png$/, "")}_${i}.png`,
          edge: {
            holes: {
              count: holes.length,
              area: holes.reduce((s, h) => s + h.area, 0),
              list: holes,
            },
          },
        };
      });
      return {
        ok: true,
        frames,
        contactSheet: { writtenTo: `${args.outPath.replace(/\.png$/, "")}_sheet.png` },
      };
    },
    readAlpha: async () => ({ width: W, height: H, alpha: matteAt(15) }),
    build: async (a: Any) => {
      calls.push({ build: a });
      return {
        ok: true,
        fillLayer: "raw_nogreen.mp4 gap fill",
        maskLayer: "raw_nogreen.mp4 gap mask",
        stillItem: "gap.png",
      };
    },
    ...extra,
  };
}

describe("subject.check", () => {
  it("is registered as an operation that runs in Node", () => {
    const op = getOp("subject.check")!;
    expect(op.run).toBeTypeOf("function");
    expect(op.category).toBe("subject");
  });

  it("renders the cut-out over a flat colour at the click frame and across the clip, early frames first", async () => {
    const io = fakeIO(() => matte());
    const res = await runSubjectCheck({ comp: "Main", layer: 1, outDir: dir, clickFrame: 15 }, io);
    const r = io.calls[0].render;
    expect(r).toMatchObject({
      compNameOrId: "Main",
      isolate: 1,
      over: "#ff00ff",
      contactSheet: {},
    });
    expect(r.edge).toMatchObject({ listed: expect.any(Number) });
    expect(r.frames).toEqual([...r.frames].sort((a: number, b: number) => a - b));
    expect(r.frames).toContain(15);
    expect(r.frames).toContain(0);
    expect(r.frames.length).toBe(9);
    expect(Math.max(...r.frames)).toBeLessThan(320);
    expect(res.ok).toBe(true);
    expect(res.picture).toMatch(/_sheet\.png$/);
    expect(res.frames[0].picture).toMatch(/\.png$/);
  });

  it("stops on a hole over the limit and says where it is, with the picture", async () => {
    const res = await runSubjectCheck(
      { comp: "Main", layer: 1, outDir: dir, holeLimit: 1000 },
      fakeIO(() => matte([MIC, GAP])),
    );
    expect(res.stop).toBe(true);
    expect(res.findings).toEqual([
      expect.objectContaining({
        kind: "hole",
        largestArea: 2400,
        box: { x: 80, y: 150, width: 40, height: 60 },
      }),
      expect.objectContaining({ kind: "close-clicks" }), // STATUS_OK's two clicks are 57 px apart
    ]);
    expect(res.findings[0].frames.length).toBe(8); // 8 frames across the clip; no click frame given
    expect(res.inOut).toMatch(/Out: .*hole.*2,400 px.*\(80, 150, 40 × 60\)/);
    expect(res.inOut).toMatch(/Look at the picture/);
    expect(res.next).toMatch(/show the user the picture/i);
    expect(res.frames[0].holesUnderLimit).toEqual({ count: 1, area: 120 });
  });

  it("reports the close clicks as a finding to stop on, and never takes the count as confirmation", async () => {
    const res = await runSubjectCheck(
      { comp: "Main", layer: 1, outDir: dir },
      fakeIO(() => matte()),
    );
    expect(res.findings).toEqual([expect.objectContaining({ kind: "close-clicks" })]);
    expect(res.stop).toBe(true);
    expect(res.clicks).toEqual([
      { name: "Add Object 2", kind: "object", point: [1081, 2403], durationStart: 15 },
      { name: "Add Object 1", kind: "object", point: [1138, 2400], durationStart: 15 },
    ]);
    expect(res.countNote).toMatch(/not a check/);
  });

  it("does not stop when there is nothing over the limit and the clicks are apart", async () => {
    const status = {
      ...STATUS_OK,
      selections: [STATUS_OK.selections[1], { ...STATUS_OK.selections[0], point: [1330, 3190] }],
    };
    const res = await runSubjectCheck(
      { comp: "Main", layer: 1, outDir: dir },
      fakeIO(() => matte([PIN]), { status: async () => status as Any }),
    );
    expect(res.stop).toBe(false);
    expect(res.findings).toEqual([]);
    expect(res.inOut).toMatch(/no enclosed hole over 1,000 px/);
    expect(res.next).toMatch(/still look at the picture/i);
  });

  it("refuses before rendering when nobody has clicked", async () => {
    const io = fakeIO(() => matte(), {
      status: async () =>
        ({
          ok: true,
          objectMatte: { present: false },
          selections: [],
          summary: "no Object Matte on this layer: the user has not clicked yet",
        }) as Any,
    });
    const res = await runSubjectCheck({ comp: "Main", layer: 1, outDir: dir }, io);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/has not clicked/);
    expect(io.calls).toEqual([]);
  });
});

describe("subject.fill_gaps", () => {
  it("is registered as a Node operation that changes the project", () => {
    const op = getOp("subject.fill_gaps")!;
    expect(op.run).toBeTypeOf("function");
    expect(op.readOnly).toBeFalsy();
  });

  it("fills the enclosed gaps at the reference frame, grown by 3 px, builds the fill and measures again", async () => {
    const still = path.join(dir, "gap-mask.png");
    let built = false;
    const io = fakeIO(
      (f) => (built ? matte(f === 240 ? [[90, 240, 40, 40]] : []) : matte([GAP, PIN])),
      {
        build: async (a: Any) => {
          built = true;
          io.calls.push({ build: a });
          return {
            ok: true,
            fillLayer: "raw_nogreen.mp4 gap fill",
            maskLayer: "raw_nogreen.mp4 gap mask",
            stillItem: "gap-mask.png",
          };
        },
      },
    );
    const res = await runFillGaps(
      { comp: "Main", layer: 1, frame: 15, stillPath: still, minArea: 20, outDir: dir },
      io,
    );

    expect(res.ok).toBe(true);
    expect(res.filled).toMatchObject({ holes: 1, area: 120, dropped: { count: 1, area: 6 } });
    expect(res.filled.grownArea).toBeGreaterThan(120);
    const img = decodePng(await fs.readFile(still));
    expect([img.width, img.height]).toEqual([W, H]);
    expect(img.rgb[(165 * W + 134) * 3]).toBeCloseTo(1, 2); // inside the gap
    expect(img.rgb[(165 * W + 140) * 3]).toBeCloseTo(1, 2); // 3 px outside it
    expect(img.rgb[(100 * W + 60) * 3]).toBeCloseTo(0, 2); // the dropped pinhole
    const build = io.calls.find((c) => c.build).build;
    expect(build).toMatchObject({ comp: "Main", layer: 1, stillPath: still });
    const after = io.calls.filter((c) => c.render).at(-1).render;
    expect(after.isolate).toEqual([1, "raw_nogreen.mp4 gap fill"]);
    expect(res.after.findings).toEqual([
      expect.objectContaining({ kind: "hole", frames: [240], largestArea: 1600 }),
    ]);
    expect(res.limits.join(" ")).toMatch(/one frame/);
    expect(res.limits.join(" ")).toMatch(/locked camera/);
    expect(res.limits.join(" ")).toMatch(/whatever is behind/);
  });

  it("fills only the holes inside `only` boxes", async () => {
    const still = path.join(dir, "gap-mask.png");
    const io = fakeIO(() => matte([MIC, GAP]));
    const res = await runFillGaps(
      {
        comp: "Main",
        layer: 1,
        frame: 15,
        stillPath: still,
        outDir: dir,
        only: [{ x: 125, y: 155, width: 20, height: 25 }],
      },
      io,
    );
    expect(res.filled).toMatchObject({ holes: 1, area: 120 });
    expect(res.filled.leftOut).toEqual({ count: 1, area: 2400 });
  });

  it("builds nothing when there is no enclosed gap", async () => {
    const io = fakeIO(() => matte());
    const res = await runFillGaps(
      { comp: "Main", layer: 1, frame: 15, stillPath: path.join(dir, "m.png"), outDir: dir },
      io,
    );
    expect(res.ok).toBe(true);
    expect(res.filled.holes).toBe(0);
    expect(io.calls.some((c) => c.build)).toBe(false);
    await expect(fs.access(path.join(dir, "m.png"))).rejects.toThrow();
  });

  it("refuses when the reference render is not at the comp's size", async () => {
    const io = fakeIO(() => matte([GAP]), {
      readAlpha: async () => ({
        width: W / 2,
        height: H / 2,
        alpha: new Float64Array((W * H) / 4),
      }),
    });
    const res = await runFillGaps(
      { comp: "Main", layer: 1, frame: 15, stillPath: path.join(dir, "m.png"), outDir: dir },
      io,
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/100 × 150.*comp's size 200 × 300/);
    expect(io.calls.some((c) => c.build)).toBe(false);
  });

  it("refuses a still path that is not an absolute .png", async () => {
    const res = await runFillGaps(
      { comp: "Main", layer: 1, stillPath: "gap.png", outDir: dir },
      fakeIO(() => matte([GAP])),
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/absolute path to a \.png/);
  });
});

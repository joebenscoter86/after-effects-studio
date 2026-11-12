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

import { cutoutRegions, enclosedHoles, growMask } from "../src/color/matte.js";
import { decodePng, encodePngSrgbRgba8 } from "../src/color/png16.js";
import {
  CUTOUT_HOLE_LIMIT,
  acceptedBy,
  alikeRegions,
  closeClicks,
  cutoutFindings,
  runFillGaps,
  runSubjectCheck,
  type CutoutIO,
} from "../src/operations/keying.js";
import { getOp } from "../src/registry.js";
import { validateOpArgs } from "../src/opschema.js";
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
        smallestArea: 2380,
        largestArea: 2400,
        largestFrame: 0,
        box: { x: 80, y: 150, width: 42, height: 61 },
      },
    ]);
    expect(
      cutoutFindings([{ frame: 0, holes: [{ x: 0, y: 0, width: 3, height: 2, area: 6 }] }], 1000),
    ).toEqual([]);
  });

  it("does not merge unlike regions across frames: the missed mic on one frame and the opening under the stand on the others", () => {
    const stand = (frame: number, area: number) => ({
      frame,
      openings: [{ x: 625, y: 1884, width: 91, height: 35, area, edges: ["bottom" as const] }],
    });
    const f = cutoutFindings(
      [
        {
          frame: 0,
          openings: [
            { x: 489, y: 1459, width: 368, height: 461, area: 114769, edges: ["bottom" as const] },
          ],
        },
        stand(15, 1862),
        stand(40, 2090),
      ],
      1000,
    );
    expect(f).toEqual([
      expect.objectContaining({
        kind: "opening",
        frames: [0],
        smallestArea: 114769,
        largestArea: 114769,
        largestFrame: 0,
      }),
      expect.objectContaining({
        kind: "opening",
        frames: [15, 40],
        smallestArea: 1862,
        largestArea: 2090,
        largestFrame: 40,
      }),
    ]);
  });

  it("groups a region that drifts a little between frames", () => {
    const f = cutoutFindings(
      [
        { frame: 0, holes: [{ x: 100, y: 100, width: 50, height: 50, area: 2500 }] },
        { frame: 40, holes: [{ x: 115, y: 100, width: 50, height: 50, area: 1400 }] },
      ],
      1000,
    );
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ frames: [0, 40], smallestArea: 1400, largestArea: 2500 });
  });

  it("calls two regions alike when their boxes overlap by half the union, or overlap with areas within a factor of two", () => {
    const a = { x: 0, y: 0, width: 100, height: 100, area: 5000 };
    expect(alikeRegions(a, { x: 10, y: 0, width: 100, height: 100, area: 5000 })).toBe(true);
    expect(alikeRegions(a, { x: 60, y: 0, width: 100, height: 100, area: 6000 })).toBe(true); // little overlap, similar size
    expect(alikeRegions(a, { x: 10, y: 10, width: 20, height: 20, area: 300 })).toBe(false); // inside it, far smaller
    expect(alikeRegions(a, { x: 200, y: 0, width: 100, height: 100, area: 5000 })).toBe(false); // apart
  });

  it("uses a default limit chosen from the build record", () => {
    expect(CUTOUT_HOLE_LIMIT).toBe(1000);
  });
});

// ------------------------------------------------- openings (stage 12b fix)
//
// A region below opaque that reaches the frame edge only between two places
// where the subject touches that edge is an opening: on the take, the missed
// microphone ran off the bottom of the frame, so it was no hole.

/** A matte from rectangles [x, y, w, h] set to `a` (later ones win). */
function rects(list: Array<[number, number, number, number, number]>): Float64Array {
  const m = new Float64Array(W * H);
  for (const [x0, y0, w, h, a] of list)
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) m[y * W + x] = a;
  return m;
}
const BODY: [number, number, number, number, number] = [40, 60, 120, 240, 1]; // x 40..159, y 60..299: on the bottom edge
const MIC_OFF: [number, number, number, number, number] = [80, 200, 40, 100, 0]; // runs off the bottom

describe("cutoutRegions", () => {
  it("calls a notch that runs off the bottom edge, between two contacts, an opening", () => {
    const { holes, openings } = cutoutRegions(rects([BODY, MIC_OFF]), W, H);
    expect(holes).toEqual([]);
    expect(openings).toEqual([
      { x: 80, y: 200, width: 40, height: 100, area: 4000, meanAlpha: 0, edges: ["bottom"] },
    ]);
  });

  it("calls the same notch closed at the bottom a hole", () => {
    const { holes, openings } = cutoutRegions(rects([BODY, [80, 200, 40, 90, 0]]), W, H);
    expect(openings).toEqual([]);
    expect(holes).toEqual([
      expect.objectContaining({ x: 80, y: 200, width: 40, height: 90, area: 3600 }),
    ]);
  });

  it("seals nothing where the subject touches an edge at one point only", () => {
    const m = rects([
      [40, 60, 120, 231, 1],
      [100, 291, 1, 9, 1],
    ]);
    expect(cutoutRegions(m, W, H)).toMatchObject({ holes: [], openings: [] });
  });

  it("finds nothing between two separate subjects on one edge when the gap reaches another edge", () => {
    const m = rects([
      [20, 100, 41, 200, 1],
      [140, 100, 41, 200, 1],
    ]);
    expect(cutoutRegions(m, W, H)).toMatchObject({ holes: [], openings: [] });
  });

  it("finds the opening between two legs joined above (an arm against the body)", () => {
    const m = rects([
      [20, 100, 161, 40, 1],
      [20, 140, 41, 160, 1],
      [140, 140, 41, 160, 1],
    ]);
    const { openings } = cutoutRegions(m, W, H);
    expect(openings).toEqual([
      expect.objectContaining({ x: 61, y: 140, width: 79, height: 160, edges: ["bottom"] }),
    ]);
    expect(openings[0].area).toBe(79 * 160);
  });

  it("seals the side edges too, and drops small regions", () => {
    const m = rects([
      [100, 50, 100, 200, 1],
      [150, 120, 50, 30, 0],
    ]);
    expect(cutoutRegions(m, W, H).openings).toEqual([
      expect.objectContaining({ edges: ["right"], area: 1500 }),
    ]);
    expect(cutoutRegions(m, W, H, { minArea: 2000 }).openings).toEqual([]);
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
    {
      index: 1,
      name: "Add Object 2",
      kind: "object",
      point: [1081, 2403],
      clickTime: 0.49999667,
      clickFrame: 15,
    },
    {
      index: 2,
      name: "Add Object 1",
      kind: "object",
      point: [1138, 2400],
      clickTime: 0.49999667,
      clickFrame: 15,
    },
  ],
  counts: { object: 2, quickSelection: 0, other: 0 },
  summary: "2 objects selected",
  sourceSize: [2176, 3840],
  compSize: [W, H],
  span: { inFrame: 0, outFrame: 320, frameRate: 30 },
};
const APART = {
  ...STATUS_OK,
  selections: [STATUS_OK.selections[1], { ...STATUS_OK.selections[0], point: [1330, 3190] }],
};

const opaque = (n: number) => new Float64Array(n).fill(1);

/**
 * A fake ae_render_frame: writes each frame's matte as an RGBA file (grey
 * subject), as the real one does with channels 'rgba'; `fail` frames come
 * back as captures that did not finish writing.
 */
function fakeIO(
  matteAt: (frame: number, args: Any) => Float64Array,
  { fail = new Set<number>(), ...extra }: Partial<CutoutIO> & { fail?: Set<number> } = {},
): CutoutIO & { calls: Any[] } {
  const calls: Any[] = [];
  return {
    calls,
    status: async () => STATUS_OK as Any,
    render: async (args: Any) => {
      calls.push({ render: args });
      const stem = args.outPath.replace(/\.png$/, "");
      const frames = [];
      for (const [i, frame] of (args.frames as number[]).entries()) {
        const writtenTo = `${stem}_${i}.png`;
        if (fail.has(frame)) {
          frames.push({
            ok: false,
            frame,
            error: "the capture did not finish writing within 39.0 s (missing, 0 bytes)",
          });
          continue;
        }
        const a = matteAt(frame, args);
        await fs.writeFile(
          writtenTo,
          encodePngSrgbRgba8(W, H, new Float64Array(W * H * 3).fill(0.5), a),
        );
        frames.push({
          ok: true,
          frame,
          writtenTo,
          edge: { width: { typical: 1, p90: 1.41 }, solidAreas: { count: 1 } },
        });
      }
      return { ok: true, frames };
    },
    readImage: async (file: string) => decodePng(await fs.readFile(file)),
    build: async (a: Any) => {
      calls.push({ build: a });
      return {
        ok: true,
        fillLayer: "raw_nogreen.mp4 gap fill",
        maskLayer: "raw_nogreen.mp4 gap mask",
        stillItem: "gap.png",
        stillItemId: 77,
      };
    },
    unbuild: async (a: Any) => {
      calls.push({ unbuild: a });
      return { ok: true, removed: [a.fillLayer, a.maskLayer, a.stillItemId] };
    },
    ...extra,
  };
}

const renders = (io: Any) => io.calls.filter((c: Any) => c.render).map((c: Any) => c.render);

describe("subject.check", () => {
  it("is registered as an operation that runs in Node, and says it can take minutes", () => {
    const op = getOp("subject.check")!;
    expect(op.run).toBeTypeOf("function");
    expect(op.category).toBe("subject");
    expect(op.description).toMatch(/minutes/);
  });

  it("renders the cut-out with its alpha at the click frames and across the clip, early frames first, with a settle time per frame", async () => {
    const io = fakeIO(() => matte());
    const res = await runSubjectCheck({ comp: "Main", layer: 1, outDir: dir }, io);
    const [r] = renders(io);
    expect(r).toMatchObject({ compNameOrId: "Main", isolate: 1, channels: "rgba", edge: true });
    expect(r.frames).toEqual([0, 15, 40, 80, 120, 160, 200, 240, 280]); // the click frame (15) from the selections
    expect(r.settleTimeoutMs).toBe(9 * 60_000);
    expect(res.ok).toBe(true);
    expect(res.checked).toEqual({ frames: 9, of: 9 });
    await fs.access(res.picture);
    expect(res.picture).toMatch(/cutout_sheet\.png$/);
    await fs.access(res.frames[0].picture);
    const over = decodePng(await fs.readFile(res.frames[0].picture));
    expect(over.rgb[0]).toBeCloseTo(1, 2); // magenta where the matte is clear
    expect(over.rgb[2]).toBeCloseTo(1, 2);
    expect(res.next).toMatch(/minutes/);
  });

  it("splits the frames into calls that each fit ae_render_frame's settle limit", async () => {
    const io = fakeIO(() => matte());
    await runSubjectCheck({ comp: "Main", layer: 1, outDir: dir, secondsPerFrame: 100 }, io);
    const rs = renders(io);
    expect(rs.map((r: Any) => r.frames.length)).toEqual([6, 3]);
    expect(rs.map((r: Any) => r.settleTimeoutMs)).toEqual([600_000, 300_000]);
    expect(new Set(rs.map((r: Any) => r.outPath)).size).toBe(2);
  });

  it("stops on an enclosed hole over the limit and says where it is", async () => {
    const res = await runSubjectCheck(
      { comp: "Main", layer: 1, outDir: dir, holeLimit: 1000 },
      fakeIO(() => matte([MIC, GAP]), { status: async () => APART as Any }),
    );
    expect(res.stop).toBe(true);
    expect(res.findings).toEqual([
      expect.objectContaining({
        kind: "hole",
        largestArea: 2400,
        box: { x: 80, y: 150, width: 40, height: 60 },
      }),
    ]);
    expect(res.findings[0].frames.length).toBe(9);
    expect(res.inOut).toMatch(/hole.*2,400 px.*\(80, 150, 40 × 60\)/);
    expect(res.frames[0].holesUnderLimit).toEqual({ count: 1, area: 120 });
    expect(res.next).toMatch(/show the user the picture/i);
  });

  it("stops on an opening that runs off the frame edge, the missed microphone of 2026-11-11", async () => {
    const res = await runSubjectCheck(
      { comp: "Main", layer: 1, outDir: dir },
      fakeIO(() => rects([BODY, MIC_OFF]), { status: async () => APART as Any }),
    );
    expect(res.stop).toBe(true);
    expect(res.findings).toEqual([
      expect.objectContaining({
        kind: "opening",
        edges: ["bottom"],
        largestArea: 4000,
        box: { x: 80, y: 200, width: 40, height: 100 },
      }),
    ]);
    expect(res.inOut).toMatch(/opening.*4,000 px.*reaches the bottom edge/);
    expect(res.inOut).toMatch(/something in front of the subject left out.*or a real gap/);
  });

  it("counts a frame that did not render as not checked, never as clean", async () => {
    const res = await runSubjectCheck(
      { comp: "Main", layer: 1, outDir: dir },
      fakeIO(() => matte(), { fail: new Set([0, 40]), status: async () => APART as Any }),
    );
    expect(res.stop).toBe(true);
    expect(res.checked).toEqual({ frames: 7, of: 9 });
    expect(res.findings).toEqual([
      expect.objectContaining({ kind: "not-checked", frames: [0, 40] }),
    ]);
    expect(res.findings[0].errors[0]).toMatch(/did not finish writing/);
    const f0 = res.frames.find((f: Any) => f.frame === 0);
    expect(f0).toMatchObject({ checked: false, holes: null, openings: null });
    expect(res.inOut).toMatch(/Checked 7 of 9 frames; 2 did not render \(0, 40\)/);
    expect(res.inOut).not.toMatch(/no enclosed hole/);
  });

  it("stops when no frame rendered", async () => {
    const all = new Set([0, 15, 40, 80, 120, 160, 200, 240, 280]);
    const res = await runSubjectCheck(
      { comp: "Main", layer: 1, outDir: dir },
      fakeIO(() => matte(), { fail: all, status: async () => APART as Any }),
    );
    expect(res.stop).toBe(true);
    expect(res.checked).toEqual({ frames: 0, of: 9 });
    expect(res.picture).toBeNull();
    expect(res.inOut).toMatch(/Checked 0 of 9 frames/);
  });

  it("reports the close clicks as a finding, and never takes the count as confirmation", async () => {
    const res = await runSubjectCheck(
      { comp: "Main", layer: 1, outDir: dir },
      fakeIO(() => matte()),
    );
    expect(res.findings).toEqual([expect.objectContaining({ kind: "close-clicks" })]);
    expect(res.stop).toBe(true);
    expect(res.clicks).toEqual([
      {
        name: "Add Object 2",
        kind: "object",
        point: [1081, 2403],
        clickTime: 0.49999667,
        clickFrame: 15,
      },
      {
        name: "Add Object 1",
        kind: "object",
        point: [1138, 2400],
        clickTime: 0.49999667,
        clickFrame: 15,
      },
    ]);
    expect(res.countNote).toMatch(/not a check/);
  });

  it("does not stop on regions the user accepted, and lists them", async () => {
    const arch = () =>
      rects([
        [20, 100, 161, 40, 1],
        [20, 140, 41, 160, 1],
        [140, 140, 41, 160, 1],
      ]);
    const first = await runSubjectCheck(
      { comp: "Main", layer: 1, outDir: dir },
      fakeIO(arch, { status: async () => APART as Any }),
    );
    expect(first.stop).toBe(true);
    expect(first.next).toMatch(/accept/);
    const box = first.findings[0].box;
    const second = await runSubjectCheck(
      { comp: "Main", layer: 1, outDir: dir, accept: [box] },
      fakeIO(arch, { status: async () => APART as Any }),
    );
    expect(second.stop).toBe(false);
    expect(second.findings).toEqual([]);
    expect(second.accepted).toEqual([expect.objectContaining({ kind: "opening", box })]);
  });

  it("does not stop when there is nothing over the limit and the clicks are apart", async () => {
    const res = await runSubjectCheck(
      { comp: "Main", layer: 1, outDir: dir },
      fakeIO(() => matte([PIN]), { status: async () => APART as Any }),
    );
    expect(res.stop).toBe(false);
    expect(res.findings).toEqual([]);
    expect(res.inOut).toMatch(
      /Nothing over the limit on 9 of 9 frames; the picture is at .*cutout_sheet\.png/,
    );
    expect(res.next).toMatch(/still look at the picture/i);
    expect(res.frames[0].opaqueShare).toBeCloseTo((120 * 240 - 6) / (W * H), 4);
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

  /** After the build: the cut-out and fill render with no holes, except `left` at frame 240; the fill alone shows the still. */
  function fillIO(
    still: string,
    before: Float64Array,
    { left = false, fillShows = "mask" as "mask" | "all", ...extra }: Any = {},
  ) {
    let built = false;
    const io: Any = fakeIO(() => before, {
      build: async (a: Any) => {
        built = true;
        io.calls.push({ build: a });
        return {
          ok: true,
          fillLayer: "raw_nogreen.mp4 gap fill",
          maskLayer: "raw_nogreen.mp4 gap mask",
          stillItem: "gap-mask.png",
          stillItemId: 77,
        };
      },
      ...extra,
    });
    const render = io.render;
    io.render = async (args: Any) => {
      if (!built) return render(args);
      if (Array.isArray(args.isolate) && args.isolate.length === 1) {
        // The fill layer alone: what shows through the still.
        const img = decodePng(await fs.readFile(still));
        const a =
          fillShows === "all"
            ? opaque(W * H)
            : Float64Array.from({ length: W * H }, (_, p) => img.rgb[p * 3]);
        const out = await fakeIO(() => a).render(args);
        io.calls.push({ render: args });
        return out;
      }
      const out = await fakeIO((f) => matte(left && f === 240 ? [[90, 240, 40, 40]] : [])).render(
        args,
      );
      io.calls.push({ render: args });
      return out;
    };
    return io;
  }

  it("fills the enclosed gaps at the reference frame, grown by 3 px, checks the fill alone, then measures again", async () => {
    const still = path.join(dir, "gap-mask.png");
    const io = fillIO(still, matte([GAP, PIN]), { left: true });
    const res = await runFillGaps(
      { comp: "Main", layer: 1, frame: 15, stillPath: still, minArea: 20, outDir: dir },
      io,
    );

    expect(res.ok).toBe(true);
    expect(res.filled).toMatchObject({ holes: 1, area: 120, dropped: { count: 1, area: 6 } });
    expect(res.filled.grownArea).toBeGreaterThan(120);
    const img = decodePng(await fs.readFile(still));
    expect([img.width, img.height]).toEqual([W, H]);
    expect(img.rgb[(165 * W + 134) * 3]).toBeCloseTo(1, 2);
    expect(img.rgb[(165 * W + 140) * 3]).toBeCloseTo(1, 2);
    expect(img.rgb[(100 * W + 60) * 3]).toBeCloseTo(0, 2);
    expect(io.calls.find((c: Any) => c.build).build).toMatchObject({
      comp: "Main",
      layer: 1,
      stillPath: still,
    });
    const rs = renders(io);
    expect(rs[0]).toMatchObject({ frames: [15], channels: "rgba", settleTimeoutMs: 60_000 });
    expect(rs[1]).toMatchObject({
      frames: [15],
      isolate: ["raw_nogreen.mp4 gap fill"],
      channels: "rgba",
    });
    expect(res.fillAlone).toMatchObject({
      covered: res.filled.grownArea,
      mask: res.filled.grownArea,
      ok: true,
    });
    expect(rs.at(-1).isolate).toEqual([1, "raw_nogreen.mp4 gap fill"]);
    expect(res.after.findings).toEqual([
      expect.objectContaining({ kind: "hole", frames: [240], largestArea: 1600 }),
    ]);
    expect(res.after.checked).toEqual({ frames: 9, of: 9 });
    expect(res.limits.join(" ")).toMatch(/one frame.*locked camera/);
    expect(res.limits.join(" ")).toMatch(/whatever is behind/);
  });

  it("undoes the build and refuses when the fill layer alone covers more than the mask", async () => {
    const still = path.join(dir, "gap-mask.png");
    const io = fillIO(still, matte([GAP]), { fillShows: "all" });
    const res = await runFillGaps(
      { comp: "Main", layer: 1, frame: 15, stillPath: still, outDir: dir },
      io,
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/fill layer alone covers 60,000 px.*mask.*undone/);
    expect(io.calls.find((c: Any) => c.unbuild).unbuild).toMatchObject({
      comp: "Main",
      fillLayer: "raw_nogreen.mp4 gap fill",
      maskLayer: "raw_nogreen.mp4 gap mask",
      stillItemId: 77,
    });
  });

  it("refuses plainly, building nothing, when the reference frame does not render", async () => {
    const io = fakeIO(() => matte([GAP]), { fail: new Set([15]) });
    const res = await runFillGaps(
      { comp: "Main", layer: 1, frame: 15, stillPath: path.join(dir, "m.png"), outDir: dir },
      io,
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(
      /reference frame 15 did not render.*did not finish writing.*Nothing was built/,
    );
    expect(io.calls.some((c: Any) => c.build)).toBe(false);
  });

  it("refuses plainly when the reference file cannot be read", async () => {
    const io = fakeIO(() => matte([GAP]), {
      readImage: async () => {
        throw Object.assign(
          new Error("ENOENT: no such file or directory, open 'fill-reference_0.png'"),
          { code: "ENOENT" },
        );
      },
    });
    const res = await runFillGaps(
      { comp: "Main", layer: 1, frame: 15, stillPath: path.join(dir, "m.png"), outDir: dir },
      io,
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/reference frame 15 did not render.*ENOENT.*Nothing was built/);
  });

  it("leaves openings alone and says so", async () => {
    const io = fakeIO(() => rects([BODY, MIC_OFF]));
    const res = await runFillGaps(
      { comp: "Main", layer: 1, frame: 15, stillPath: path.join(dir, "m.png"), outDir: dir },
      io,
    );
    expect(res.ok).toBe(true);
    expect(res.filled.holes).toBe(0);
    expect(res.filled.openingsNotFilled).toEqual({ count: 1, area: 4000 });
    expect(io.calls.some((c: Any) => c.build)).toBe(false);
  });

  it("fills only the holes inside `only` boxes", async () => {
    const still = path.join(dir, "gap-mask.png");
    const io = fillIO(still, matte([MIC, GAP]));
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

  it("refuses when the reference render is not at the comp's size", async () => {
    const io = fakeIO(() => matte([GAP]), {
      readImage: async () =>
        ({
          width: W / 2,
          height: H / 2,
          rgb: new Float64Array(0),
          alpha: new Float64Array((W * H) / 4),
          bitDepth: 8,
        }) as Any,
    });
    const res = await runFillGaps(
      { comp: "Main", layer: 1, frame: 15, stillPath: path.join(dir, "m.png"), outDir: dir },
      io,
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/100 × 150.*comp's size 200 × 300/);
    expect(io.calls.some((c: Any) => c.build)).toBe(false);
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

// ------------------------------------------------ stage 12b, second fixes

describe("accept", () => {
  const opening = {
    kind: "opening" as const,
    frames: [0],
    smallestArea: 114769,
    largestArea: 114769,
    largestFrame: 0,
    box: { x: 489, y: 1459, width: 368, height: 461 },
  };
  const hole = {
    kind: "hole" as const,
    frames: [15],
    smallestArea: 4623,
    largestArea: 4623,
    largestFrame: 15,
    box: { x: 538, y: 1619, width: 46, height: 132 },
  };

  it("matches a plain box to an opening of similar place and size, never to a hole inside it", () => {
    expect(acceptedBy(opening, [opening.box])).toBe(true);
    expect(acceptedBy(hole, [opening.box])).toBe(false);
    expect(acceptedBy(hole, [hole.box])).toBe(false); // a plain box means an opening
  });

  it("takes { box, kind } to accept a hole, and still needs a similar place", () => {
    expect(acceptedBy(hole, [{ box: hole.box, kind: "hole" }])).toBe(true);
    expect(acceptedBy(hole, [{ box: opening.box, kind: "hole" }])).toBe(false);
    expect(acceptedBy(opening, [{ box: { x: 489, y: 1459, width: 100, height: 100 } }])).toBe(
      false,
    );
  });
});

describe("subject.check: a frame that does not repeat", () => {
  /** Frame 0 renders without the mic the first time only (seen once on the take). */
  const flaky = (frame: number, args: Any) =>
    frame === 0 && !String(args.outPath).includes("recheck") ? rects([BODY, MIC_OFF]) : matte();

  it("renders each frame with a finding once more at the end, and reports a frame that differs as unstable", async () => {
    const io = fakeIO(flaky, { status: async () => APART as Any });
    const res = await runSubjectCheck({ comp: "Main", layer: 1, outDir: dir }, io);
    const rs = renders(io);
    expect(rs.at(-1)).toMatchObject({ frames: [0], channels: "rgba" });
    expect(rs.at(-1).outPath).toMatch(/recheck/);
    expect(res.stop).toBe(true);
    const u = res.findings.find((f: Any) => f.kind === "unstable");
    expect(u).toMatchObject({ frame: 0 });
    expect(u.first.regions).toEqual([expect.objectContaining({ kind: "opening", area: 4000 })]);
    expect(u.second.regions).toEqual([]);
    expect(u.first.opaqueShare).toBeLessThan(u.second.opaqueShare);
    await fs.access(u.first.picture);
    await fs.access(u.second.picture);
    expect(u.first.picture).not.toBe(u.second.picture);
    expect(u.reading).toMatch(/differed between two renders of the same frame/);
    expect(res.next).toMatch(/run subject\.check again/);
    expect(res.next).toMatch(/first frames of the delivered video/);
  });

  it("says a second render that agrees may come from the cache, not that the frame is stable", async () => {
    const io = fakeIO(() => rects([BODY, MIC_OFF]), { status: async () => APART as Any });
    const res = await runSubjectCheck({ comp: "Main", layer: 1, outDir: dir }, io);
    expect(res.findings.some((f: Any) => f.kind === "unstable")).toBe(false);
    expect(res.recheck).toMatchObject({
      frames: [0, 15, 40, 80, 120, 160, 200, 240, 280],
      agreed: 9,
      differed: [],
    });
    expect(res.recheck.note).toMatch(/cache/);
  });

  it("renders nothing again when nothing was over the limit, or when recheck is false", async () => {
    const io = fakeIO(() => matte(), { status: async () => APART as Any });
    const res = await runSubjectCheck({ comp: "Main", layer: 1, outDir: dir }, io);
    expect(renders(io)).toHaveLength(1);
    expect(res.recheck).toMatchObject({ frames: [] });
    const io2 = fakeIO(() => rects([BODY, MIC_OFF]), { status: async () => APART as Any });
    const res2 = await runSubjectCheck(
      { comp: "Main", layer: 1, outDir: dir, recheck: false },
      io2,
    );
    expect(renders(io2)).toHaveLength(1);
    expect(res2.recheck).toMatchObject({ skipped: true });
  });
});

describe("subject.check: what to do about close clicks", () => {
  it("says to take the later click out, and that the matte did not change on the take", async () => {
    const res = await runSubjectCheck(
      { comp: "Main", layer: 1, outDir: dir },
      fakeIO(() => matte()),
    );
    const f = res.findings.find((x: Any) => x.kind === "close-clicks");
    expect(f.advice).toMatch(/subject\.remove_selection \{ selection: "Add Object 2" \}/);
    expect(f.advice).toMatch(/did not change/);
  });
});

describe("subject.fill_gaps: sound", () => {
  it("reports that the fill copy's audio was switched off", async () => {
    const still = path.join(dir, "gap-mask.png");
    const io: Any = fakeIO(() => matte([GAP]));
    const base = io.build;
    io.build = async (a: Any) => ({ ...(await base(a)), audioOff: true });
    io.render = (
      (orig) => async (args: Any) =>
        Array.isArray(args.isolate) && args.isolate.length === 1
          ? fakeIO(() => Float64Array.from({ length: W * H }, () => 0)).render(args)
          : orig(args)
    )(io.render);
    const res = await runFillGaps(
      { comp: "Main", layer: 1, frame: 15, stillPath: still, outDir: dir },
      io,
    );
    expect(res.ok).toBe(true);
    expect(res.layers.audioOff).toBe(true);
    expect(res.next).toMatch(/audio.*switched off/);
  });
});

describe("subject.check's arguments", () => {
  it("takes recheck and accept entries with a kind through ae_do's schema", () => {
    const v = validateOpArgs(getOp("subject.check")!, {
      comp: "Main",
      layer: 1,
      outDir: "/tmp/x",
      recheck: false,
      accept: [
        { x: 0, y: 0, width: 10, height: 10 },
        { box: { x: 0, y: 0, width: 5, height: 5 }, kind: "hole" },
      ],
      secondsPerFrame: 90,
    });
    expect(v.ok).toBe(true);
  });
});

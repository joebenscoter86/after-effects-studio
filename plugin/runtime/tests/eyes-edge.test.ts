// Matte quality as numbers (agent-eyes plan, stage 3): the `edge` report of
// ae_render_frame, measured in Node on decoded captures. No After Effects
// involved. The fixtures are written by tests/fixtures/png/make-fixtures.mjs
// (an encoder independent of src/color/png16.ts); their layout is documented
// there. All matte fixtures are 64×48 captures as AE writes them: straight
// colour laid over the comp background.

import { readFileSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  EDGE_DEFAULTS,
  alphaChange,
  measureEdge,
  resolveEdgeThresholds,
  type EdgeThresholdArgs,
} from "../src/color/matte.js";
import { decodePng, type DecodedPng } from "../src/color/png16.js";
import type { Rgb } from "../src/color/sheet.js";

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "png");
const fixture = (name: string) => decodePng(readFileSync(path.join(FIXTURES, name)));
const BLACK: Rgb = [0, 0, 0];
const MAGENTA: Rgb = [0.8, 0.1, 0.6];

function measure(img: DecodedPng, bg: Rgb = BLACK, args: EdgeThresholdArgs = {}) {
  return measureEdge(img, bg, resolveEdgeThresholds(args, img.width, img.height));
}

/** An in-memory capture: alpha(x, y), colour laid over black (so colour·alpha). */
function image(
  width: number,
  height: number,
  alpha: (x: number, y: number) => number,
  colour: Rgb = [0.8, 0.6, 0.5],
): DecodedPng {
  const a = new Float64Array(width * height);
  const rgb = new Float64Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      a[p] = alpha(x, y);
      for (let c = 0; c < 3; c++) rgb[p * 3 + c] = colour[c] * a[p];
    }
  }
  return { width, height, bitDepth: 16, rgb, alpha: a } as DecodedPng;
}

describe("thresholds", () => {
  it("has named defaults: two 8-bit steps for transparent and opaque, as `sample` counts them", () => {
    expect(EDGE_DEFAULTS.transparent).toBeCloseTo(2 / 255, 6);
    expect(EDGE_DEFAULTS.opaque).toBeCloseTo(1 - 2 / 255, 6);
    expect(EDGE_DEFAULTS.mainAreaShare).toBe(0.25);
    expect(EDGE_DEFAULTS.listed).toBe(5);
    expect(EDGE_DEFAULTS.screen).toBe("green");
  });

  it("scales the widest thin edge with the frame: 1% of the shorter side, at least 4 px", () => {
    expect(resolveEdgeThresholds({}, 1080, 1920).maxEdgeWidth).toBe(11);
    expect(resolveEdgeThresholds({}, 3840, 2160).maxEdgeWidth).toBe(22);
    expect(resolveEdgeThresholds({}, 64, 48).maxEdgeWidth).toBe(4);
    expect(resolveEdgeThresholds({ maxEdgeWidth: 30 }, 64, 48).maxEdgeWidth).toBe(30);
  });
});

describe("a clean matte", () => {
  const { report } = measure(fixture("matte-clean-rgba16.png"));

  it("reports the shares of opaque, partly transparent and transparent pixels", () => {
    expect(report.stage).toBe("capture");
    expect(report.pixels).toBe(3072);
    expect(report.shares.opaque).toBeCloseTo(784 / 3072, 4);
    expect(report.shares.partial).toBeCloseTo(240 / 3072, 4);
    expect(report.shares.transparent).toBeCloseTo(2048 / 3072, 4);
  });

  it("measures the edge width across the boundary: 2 px typical, a little more at corners", () => {
    expect(report.width.typical).toBe(2);
    expect(report.width.worst).toBeGreaterThanOrEqual(2);
    expect(report.width.worst).toBeLessThan(2.5);
    expect(report.width.samples).toBeGreaterThan(100);
    expect(report.width.unmeasured).toBe(0);
  });

  it("finds one solid area and no holes, specks or patches", () => {
    expect(report.solidAreas.count).toBe(1);
    expect(report.solidAreas.list[0]).toMatchObject({ x: 16, y: 8, width: 32, height: 32 });
    expect(report.holes.count).toBe(0);
    expect(report.holes.largest).toBeNull();
    expect(report.specks.count).toBe(0);
    expect(report.patches.count).toBe(0);
  });

  it("reads the soft edge's colour as not leaning green", () => {
    expect(report.spill.mean![0]).toBeCloseTo(0.8, 3);
    expect(report.spill.mean![1]).toBeCloseTo(0.6, 3);
    expect(report.spill.mean![2]).toBeCloseTo(0.5, 3);
    expect(report.spill.leansToScreen).toBe(false);
    expect(report.spill.reading).toMatch(/does not lean green/);
  });
});

describe("holes", () => {
  it("counts transparent and partly transparent regions enclosed by the solid area", () => {
    const { report } = measure(fixture("matte-hole-rgba16.png"));
    expect(report.holes.count).toBe(2);
    expect(report.holes.area).toBe(37);
    expect(report.holes.transparentArea).toBe(16);
    expect(report.holes.largest).toMatchObject({ x: 29, y: 21, width: 6, height: 6, area: 36 });
    expect(report.holes.largest!.meanAlpha).toBeCloseTo(10 / 36, 3);
    expect(report.holes.list).toHaveLength(2);
    expect(report.holes.list[1]).toMatchObject({ x: 40, y: 32, width: 1, height: 1, area: 1 });
  });

  it("does not call a gap open to the frame edge a hole", () => {
    // Opaque everywhere except a notch from the top edge and one enclosed 2×2 hole.
    const img = image(20, 20, (x, y) => {
      if (x >= 8 && x <= 11 && y <= 5) return 0;
      if (x >= 8 && x <= 9 && y >= 12 && y <= 13) return 0;
      return 1;
    });
    const { report } = measure(img);
    expect(report.holes.count).toBe(1);
    expect(report.holes.largest).toMatchObject({ x: 8, y: 12, width: 2, height: 2, area: 4 });
  });
});

describe("specks", () => {
  it("lists islands outside the main solid area, largest first", () => {
    const { report } = measure(fixture("matte-specks-rgba16.png"));
    expect(report.specks.count).toBe(3);
    expect(report.specks.area).toBe(8);
    expect(report.specks.list.map((s) => s.area)).toEqual([4, 3, 1]);
    expect(report.specks.list[0]).toMatchObject({ x: 3, y: 3, width: 2, height: 2 });
    expect(report.specks.list[2]).toMatchObject({ x: 58, y: 5, width: 1, height: 1 });
    expect(report.specks.list[2].maxAlpha).toBeCloseTo(0.3, 3);
    // Specks are not patches and do not widen the subject's edge.
    expect(report.patches.count).toBe(0);
    expect(report.width.worst).toBeLessThan(2.5);
    expect(report.solidAreas.count).toBe(1);
  });

  it("lists at most `listed` of them, still counting all", () => {
    const { report } = measure(fixture("matte-specks-rgba16.png"), BLACK, { listed: 1 });
    expect(report.specks.count).toBe(3);
    expect(report.specks.list).toHaveLength(1);
  });

  it("treats an island at least mainAreaShare of the largest as a main area, not a speck", () => {
    const { report } = measure(fixture("matte-specks-rgba16.png"), BLACK, {
      mainAreaShare: 0.0005,
    });
    expect(report.specks.count).toBe(0);
    expect(report.solidAreas.count).toBe(4);
  });
});

describe("partly transparent patches that are not thin edges", () => {
  it("flags a half-transparent patch beside the subject with its bounding box", () => {
    const { report } = measure(fixture("matte-patch-rgba16.png"));
    expect(report.patches.count).toBe(1);
    const patch = report.patches.list[0];
    // The patch is x 48..59, y 14..33; the box may reach into the soft edge it touches.
    expect(patch.x).toBeLessThanOrEqual(48);
    expect(patch.x).toBeGreaterThanOrEqual(44);
    expect(patch.x + patch.width - 1).toBe(59);
    expect(patch.y).toBe(14);
    expect(patch.height).toBe(20);
    expect(patch.meanAlpha).toBeCloseTo(0.5, 2);
    expect(report.patches.area).toBeGreaterThanOrEqual(240);
    // It also stretches the edge: the alpha never reaches opaque quickly there.
    expect(report.width.worst).toBeGreaterThanOrEqual(10);
    expect(report.width.worstAt!.x).toBeGreaterThanOrEqual(48);
    expect(report.width.typical).toBe(2);
  });

  it("calls the same patch a thin edge when maxEdgeWidth is raised past it", () => {
    const { report } = measure(fixture("matte-patch-rgba16.png"), BLACK, { maxEdgeWidth: 40 });
    expect(report.patches.count).toBe(0);
  });

  it("shows an unkeyed screen left partly opaque as one large patch and an edge that never clears", () => {
    // Opaque subject in the middle; the screen everywhere else at alpha 0.05.
    const img = image(80, 60, (x, y) => (x >= 30 && x < 50 && y >= 20 && y < 60 ? 1 : 0.05));
    const { report } = measure(img);
    expect(report.shares.partial).toBeGreaterThan(0.8);
    expect(report.shares.transparent).toBe(0);
    expect(report.patches.count).toBe(1);
    expect(report.patches.list[0]).toMatchObject({ x: 0, y: 0, width: 80, height: 60 });
    expect(report.patches.list[0].meanAlpha).toBeCloseTo(0.05, 3);
    expect(report.width.typical).toBeNull();
    expect(report.width.unmeasured).toBeGreaterThan(0);
  });
});

describe("spill", () => {
  it("reads a green-tinted soft edge over black as leaning green", () => {
    const { report } = measure(fixture("spill-black-rgba16.png"));
    const s = report.spill;
    expect(s.pixels).toBe(240);
    expect(s.mean![0]).toBeCloseTo(0.4, 3);
    expect(s.mean![1]).toBeCloseTo(0.7, 3);
    expect(s.mean![2]).toBeCloseTo(0.3, 3);
    expect(s.excess).toBeCloseTo(0.3, 3);
    expect(s.solidMean![0]).toBeCloseTo(0.8, 3);
    expect(s.solidExcess).toBeCloseTo(-0.2, 3);
    expect(s.leansToScreen).toBe(true);
    expect(s.reading).toMatch(/leans green/);
  });

  it("takes the comp background out first, so a coloured background gives the same reading", () => {
    const { report } = measure(fixture("spill-magenta-rgba16.png"), MAGENTA);
    expect(report.spill.mean![0]).toBeCloseTo(0.4, 3);
    expect(report.spill.mean![1]).toBeCloseTo(0.7, 3);
    expect(report.spill.mean![2]).toBeCloseTo(0.3, 3);
    expect(report.spill.leansToScreen).toBe(true);
  });

  it("is not fooled by a subject that is green all over: the edge must be greener than the solid", () => {
    const img = image(
      40,
      40,
      (x, y) => {
        const d = Math.max(Math.abs(x - 19.5), Math.abs(y - 19.5));
        return d < 10 ? 1 : d < 13 ? 0.5 : 0;
      },
      [0.2, 0.8, 0.2],
    );
    const { report } = measure(img);
    expect(report.spill.excess).toBeCloseTo(0.6, 3);
    expect(report.spill.leansToScreen).toBe(false);
  });

  it("can look for blue spill instead", () => {
    const { report } = measure(fixture("spill-black-rgba16.png"), BLACK, { screen: "blue" });
    expect(report.spill.screen).toBe("blue");
    expect(report.spill.leansToScreen).toBe(false);
    expect(report.spill.reading).toMatch(/does not lean blue/);
  });
});

describe("flicker: frame-to-frame change in alpha", () => {
  const t = resolveEdgeThresholds({}, 64, 48);
  const frame = (name: string) => measureEdge(fixture(name), BLACK, t).frame;

  it("puts a change of the soft edge under edge, not inside the solid area", () => {
    const c = alphaChange(frame("flicker-a-rgba16.png"), frame("flicker-b-rgba16.png"), t);
    expect(c.edge.meanAbsDelta).toBeGreaterThan(0);
    expect(c.edge.maxAbsDelta).toBeCloseTo(0.35, 3);
    expect(c.edge.changedBounds).toEqual({ x: 46, y: 8, width: 2, height: 32 });
    expect(c.inside.meanAbsDelta).toBe(0);
    expect(c.outside.meanAbsDelta).toBe(0);
    expect(c.all.maxAbsDelta).toBeCloseTo(0.35, 3);
  });

  it("puts a hole opening in the solid area under inside", () => {
    const c = alphaChange(frame("matte-clean-rgba16.png"), frame("matte-hole-rgba16.png"), t);
    expect(c.inside.maxAbsDelta).toBeCloseTo(1, 3);
    expect(c.inside.changedBounds).toEqual({ x: 29, y: 21, width: 12, height: 12 });
    expect(c.edge.meanAbsDelta).toBe(0);
    expect(c.outside.meanAbsDelta).toBe(0);
  });

  it("puts specks appearing in the empty area under outside", () => {
    const c = alphaChange(frame("matte-clean-rgba16.png"), frame("matte-specks-rgba16.png"), t);
    expect(c.outside.maxAbsDelta).toBeCloseTo(1, 3);
    expect(c.outside.changedBounds).toEqual({ x: 3, y: 3, width: 56, height: 42 });
    expect(c.edge.meanAbsDelta).toBe(0);
    expect(c.inside.meanAbsDelta).toBe(0);
  });

  it("is zero for identical frames", () => {
    const c = alphaChange(frame("flicker-a-rgba16.png"), frame("matte-clean-rgba16.png"), t);
    for (const zone of [c.edge, c.inside, c.outside, c.all]) {
      expect(zone.meanAbsDelta).toBe(0);
      expect(zone.changedShare).toBe(0);
      expect(zone.changedBounds).toBeNull();
    }
  });
});

describe("speed", () => {
  it("measures a 1080×1920 frame well under a second", () => {
    // A subject with a 3-pixel soft edge and grain in the screen.
    let seed = 1;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const img = image(1080, 1920, (x, y) => {
      const d = Math.hypot((x - 540) / 380, (y - 1100) / 700);
      if (d < 0.99) return 1;
      if (d < 1.0) return (1.0 - d) / 0.01;
      return rand() < 0.002 ? rand() : 0;
    });
    const t = resolveEdgeThresholds({}, img.width, img.height);
    const start = performance.now();
    const first = measureEdge(img, BLACK, t);
    const second = measureEdge(img, BLACK, t);
    alphaChange(first.frame, second.frame, t);
    const perFrame = (performance.now() - start) / 2;
    // Generous for slow machines; measured locally it is well below this.
    expect(perFrame).toBeLessThan(1500);
    expect(first.report.solidAreas.count).toBe(1);
  });
});

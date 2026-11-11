// Screen measurement (agent-eyes plan, stage 6): the `screen` report of
// ae_render_frame, measured in Node on a decoded render of UN-KEYED source
// footage. No After Effects involved. The screen-* fixtures are written by
// tests/fixtures/png/make-fixtures.mjs (layout documented there): 96×64,
// opaque, a subject rectangle x 36..59 (x 60..83 in the uneven one) from
// y 16 to the bottom edge, colour (0.8, 0.6, 0.5).

import { readFileSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { decodePng, type DecodedPng } from "../src/color/png16.js";
import {
  SCREEN_DEFAULTS,
  SCREEN_COLOUR_NOTE,
  measureScreen,
  resolveScreenThresholds,
  screenArgsError,
  type ScreenArgs,
} from "../src/color/screen.js";
import type { Rgb } from "../src/color/sheet.js";

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "png");
const fixture = (name: string) => decodePng(readFileSync(path.join(FIXTURES, name)));

function measure(img: DecodedPng, args: ScreenArgs = {}) {
  return measureScreen(img, resolveScreenThresholds(args, img.width, img.height));
}

/** An in-memory capture: colour(x, y) with alpha(x, y), laid over black as AE writes it. */
function image(
  width: number,
  height: number,
  colour: (x: number, y: number) => Rgb,
  alpha: (x: number, y: number) => number = () => 1,
): DecodedPng {
  const a = new Float64Array(width * height);
  const rgb = new Float64Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      a[p] = alpha(x, y);
      const c = colour(x, y);
      for (let k = 0; k < 3; k++) rgb[p * 3 + k] = c[k] * a[p];
    }
  }
  return { width, height, bitDepth: 16, rgb, alpha: a } as DecodedPng;
}

const SKIN: Rgb = [0.8, 0.6, 0.5];
const closeRgb = (got: Rgb | null | undefined, want: Rgb, digits = 3) => {
  expect(got).not.toBeNull();
  for (let c = 0; c < 3; c++) expect(got![c]).toBeCloseTo(want[c], digits);
};

describe("thresholds", () => {
  it("has named, documented defaults a caller can override", () => {
    expect(SCREEN_DEFAULTS.screen).toBe("auto");
    expect(SCREEN_DEFAULTS.minExcess).toBe(0.04);
    expect(SCREEN_DEFAULTS.minDominance).toBe(0.15);
    expect(SCREEN_DEFAULTS.minScreenShare).toBe(0.02);
    expect(SCREEN_DEFAULTS.minCellShare).toBe(0.25);
    expect(SCREEN_DEFAULTS.unevenRatio).toBe(1.1);
    expect(SCREEN_DEFAULTS.grainAbove).toBe(0.01);
    expect(SCREEN_DEFAULTS.opaque).toBeCloseTo(1 - 2 / 255, 6);
    const t = resolveScreenThresholds({ minExcess: 0.1, columns: 3, rows: 2 }, 96, 64);
    expect(t).toMatchObject({ minExcess: 0.1, columns: 3, rows: 2, minDominance: 0.15 });
  });

  it("sizes the grid to square-ish cells, four across the shorter side", () => {
    expect(resolveScreenThresholds({}, 96, 64)).toMatchObject({ columns: 6, rows: 4 });
    expect(resolveScreenThresholds({}, 1080, 1920)).toMatchObject({ columns: 4, rows: 7 });
    expect(resolveScreenThresholds({}, 1920, 1080)).toMatchObject({ columns: 7, rows: 4 });
  });

  it("scales the band near the subject with the frame", () => {
    expect(resolveScreenThresholds({}, 1080, 1920)).toMatchObject({ nearSkip: 11, nearBand: 54 });
    expect(resolveScreenThresholds({}, 96, 64)).toMatchObject({ nearSkip: 2, nearBand: 4 });
  });

  it("refuses unusable overrides with a message naming the field", () => {
    expect(screenArgsError({ screen: "red" })).toMatch(/screen/);
    expect(screenArgsError({ minExcess: 2 })).toMatch(/minExcess/);
    expect(screenArgsError({ columns: 0 })).toMatch(/columns/);
    expect(screenArgsError({ rows: 1.5 })).toMatch(/rows/);
    expect(screenArgsError({ unevenRatio: 0.5 })).toMatch(/unevenRatio/);
    expect(screenArgsError({ nearBand: 0 })).toMatch(/nearBand/);
    expect(screenArgsError({})).toBeNull();
    expect(screenArgsError({ screen: "blue", columns: 2, rows: 3 })).toBeNull();
  });
});

describe("an even green screen", () => {
  const r = measure(fixture("screen-even-rgba16.png"));

  it("finds a green screen and says the values are capture values", () => {
    expect(r.stage).toBe("capture");
    expect(r.values).toBe("capture");
    expect(r.screen).toBe("green");
    expect(r.chosen).toBe("detected");
    expect(r.screenColourNote).toBe(SCREEN_COLOUR_NOTE);
    expect(SCREEN_COLOUR_NOTE).toMatch(/Screen Colour/);
    expect(SCREEN_COLOUR_NOTE).toMatch(/capture/);
  });

  it("counts which pixels are screen and their share of the frame", () => {
    expect(r.pixels).toBe(6144);
    expect(r.measured).toBe(6144);
    expect(r.leftOut).toBe(0);
    expect(r.screenPixels).toBe(6144 - 24 * 48);
    expect(r.share).toBeCloseTo((6144 - 1152) / 6144, 4);
    expect(r.bounds).toEqual({ x: 0, y: 0, width: 96, height: 64 });
  });

  it("suggests the screen colour: the median, and the colour nearest the subject", () => {
    closeRgb(r.colour!.median, [0.25, 0.55, 0.3]);
    closeRgb(r.colour!.mean, [0.25, 0.55, 0.3]);
    closeRgb(r.colour!.nearSubject!.colour, [0.25, 0.55, 0.3]);
    expect(r.colour!.nearSubject!.pixels).toBeGreaterThan(0);
    expect(r.colour!.nearSubject!.band).toEqual({ from: 2, to: 6 });
  });

  it("finds the subject as the largest area that is not screen", () => {
    expect(r.subject).toMatchObject({ box: { x: 36, y: 16, width: 24, height: 48 }, area: 1152 });
    expect(r.subject!.share).toBeCloseTo(1152 / 6144, 4);
  });

  it("reports the screen as even on a grid of cells", () => {
    const e = r.evenness!;
    expect(e).toMatchObject({ columns: 6, rows: 4, cellWidth: 16, cellHeight: 16 });
    expect(e.cells).toHaveLength(24);
    const cell = e.cells.find((c) => c.column === 0 && c.row === 0)!;
    expect(cell.box).toEqual({ x: 0, y: 0, width: 16, height: 16 });
    expect(cell.screenShare).toBe(1);
    closeRgb(cell.mean, [0.25, 0.55, 0.3]);
    expect(cell.level).toBeCloseTo(0.55, 3);
    expect(cell.luma).toBeCloseTo(0.2126 * 0.25 + 0.7152 * 0.55 + 0.0722 * 0.3, 3);
    expect(e.levelRatio).toBeCloseTo(1, 3);
    expect(e.uneven).toBe(false);
    expect(e.reading).toMatch(/even/);
  });

  it("leaves cells that are mostly subject out of darkest and brightest", () => {
    // Columns 2 and 3 (x 32..63), rows 1..3 are three quarters subject.
    const r2 = measure(fixture("screen-even-rgba16.png"), { minCellShare: 0.5 });
    const e = r2.evenness!;
    expect(e.cells.find((c) => c.column === 3 && c.row === 2)!.screenShare).toBe(0.25);
    expect(e.darkest!.screenShare).toBeGreaterThanOrEqual(0.5);
    expect(e.brightest!.screenShare).toBeGreaterThanOrEqual(0.5);
  });

  it("reads no grain on a clean synthetic screen", () => {
    expect(r.grain!.stdDev[1]).toBeLessThan(0.001);
    expect(r.grain!.grainy).toBe(false);
    expect(r.grain!.samples).toBeGreaterThan(1000);
  });
});

describe("an uneven green screen (1.5x from left to right)", () => {
  const r = measure(fixture("screen-uneven-rgba16.png"));

  it("finds the darkest and brightest cells with their boxes and the spread", () => {
    const e = r.evenness!;
    expect(e.darkest!.column).toBe(0);
    expect(e.brightest!.column).toBe(5);
    expect(e.darkest!.box.x).toBe(0);
    expect(e.brightest!.box.x).toBe(80);
    expect(e.levelRatio!).toBeGreaterThan(1.3);
    expect(e.levelRatio!).toBeLessThan(1.5);
    expect(e.uneven).toBe(true);
    expect(e.reading).toMatch(/uneven/);
    expect(e.reading).toMatch(/one Screen Colour/i);
  });

  it("says which side is darker", () => {
    // A plane fitted to the screen's level over its pixels, so the subject
    // hiding part of the screen does not tilt it, read at the ends of the
    // extent where screen was measured (5th to 95th percentile of the screen
    // pixels' positions: x 3..92, y 2..60 here): right / left, bottom / top.
    expect(r.evenness!.extent).toEqual({ x: 3, y: 2, width: 90, height: 59 });
    expect(r.evenness!.darkerSide).toEqual(["left"]);
    expect(r.evenness!.horizontal!).toBeCloseTo(
      (0.8 + (0.4 * 92) / 95) / (0.8 + (0.4 * 3) / 95),
      3,
    );
    expect(r.evenness!.vertical!).toBeCloseTo(1, 3);
  });

  it("picks the colour near the subject, brighter here than the screen's median", () => {
    const near = r.colour!.nearSubject!.colour;
    const median = r.colour!.median;
    expect(near[1]).toBeGreaterThan(median[1] + 0.03);
    // Every screen pixel keeps the hue: green leads red and blue in both.
    expect(near[1] - Math.max(near[0], near[2])).toBeGreaterThan(0.1);
  });

  it("still counts every screen pixel, dark side included", () => {
    expect(r.screenPixels).toBe(6144 - 1152);
  });
});

describe("evenness over the measured extent", () => {
  it("does not extrapolate past where screen was measured (a masked source)", () => {
    // Screen only in the top 20 rows, green 0.5 at y 0 to 0.6 at y 19; the
    // rest masked out. Fitting a plane and reading it at the frame's bottom
    // edge would claim 1.83x; over the screen's own rows it is 1.19x.
    const img = image(
      80,
      80,
      (_x, y) => [0.25, 0.5 + (0.1 * Math.min(y, 19)) / 19, 0.3],
      (_x, y) => (y < 20 ? 1 : 0),
    );
    const e = measure(img).evenness!;
    expect(e.extent).toEqual({ x: 3, y: 0, width: 73, height: 19 });
    expect(e.vertical!).toBeCloseTo((0.5 + (0.1 * 18) / 19) / 0.5, 3);
    expect(e.horizontal!).toBeCloseTo(1, 3);
    expect(e.darkerSide).toEqual(["top"]);
  });

  it("names every side past the threshold, strongest first", () => {
    // Brighter to the right (0.8x to 1.2x) and darker towards the bottom (1.1x to 0.9x).
    const img = image(80, 80, (x, y) => {
      const f = (0.8 + (0.4 * x) / 79) * (1.1 - (0.2 * y) / 79);
      return [0.25 * f, 0.5 * f, 0.3 * f];
    });
    const e = measure(img).evenness!;
    expect(e.horizontal!).toBeGreaterThan(1.3);
    expect(e.vertical!).toBeLessThan(1 / 1.15);
    expect(e.darkerSide).toEqual(["left", "bottom"]);
    expect(e.reading).toMatch(/darker on the left and the bottom/);
  });

  it("names no side on an even screen", () => {
    expect(measure(fixture("screen-even-rgba16.png")).evenness!.darkerSide).toEqual([]);
  });
});

describe("a blue screen", () => {
  const r = measure(fixture("screen-blue-rgba16.png"));

  it("detects blue and reads its colour", () => {
    expect(r.screen).toBe("blue");
    closeRgb(r.colour!.median, [0.15, 0.3, 0.7]);
    expect(r.evenness!.cells[0].level).toBeCloseTo(0.7, 3);
  });

  it("finds no screen when asked for green", () => {
    const g = measure(fixture("screen-blue-rgba16.png"), { screen: "green" });
    expect(g.screen).toBeNull();
    expect(g.chosen).toBe("given");
    expect(g.reading).toMatch(/no green screen/);
  });
});

describe("a frame with no screen", () => {
  const r = measure(fixture("screen-none-rgba16.png"));

  it("says so instead of inventing a colour", () => {
    expect(r.screen).toBeNull();
    expect(r.screenPixels).toBe(0);
    expect(r.colour).toBeNull();
    expect(r.evenness).toBeNull();
    expect(r.grain).toBeNull();
    expect(r.reading).toMatch(/no green or blue screen/);
  });
});

describe("a grainy screen", () => {
  const r = measure(fixture("screen-grainy-rgba8.png"));

  it("estimates the grain as a standard deviation per channel", () => {
    // Uniform ±0.06 has a standard deviation of 0.12 / √12 = 0.0346.
    for (let c = 0; c < 3; c++) {
      expect(r.grain!.stdDev[c]).toBeGreaterThan(0.03);
      expect(r.grain!.stdDev[c]).toBeLessThan(0.04);
    }
    expect(r.grain!.level).toBeCloseTo(r.grain!.stdDev[1], 6);
    expect(r.grain!.steps8bit).toBeCloseTo(r.grain!.stdDev[1] * 255, 1);
    expect(r.grain!.grainy).toBe(true);
    expect(r.grain!.reading).toMatch(/grain/);
  });

  it("keeps the colour estimates robust to it", () => {
    closeRgb(r.colour!.median, [0.25, 0.55, 0.3], 1);
    expect(Math.abs(r.colour!.median[1] - 0.55)).toBeLessThan(0.01);
    expect(r.evenness!.uneven).toBe(false);
  });
});

describe("pixels that are not opaque", () => {
  it("leaves transparent or masked pixels out and says how many", () => {
    const img = image(
      40,
      40,
      () => [0.25, 0.55, 0.3],
      (x) => (x < 10 ? 0 : 1),
    );
    const r = measure(img);
    expect(r.leftOut).toBe(400);
    expect(r.measured).toBe(1200);
    expect(r.share).toBeCloseTo(1, 4);
    closeRgb(r.colour!.median, [0.25, 0.55, 0.3]);
    expect(r.warning).toBeUndefined();
  });

  it("warns when most of the frame is transparent, as a keyed render is", () => {
    const img = image(
      40,
      40,
      (x) => (x < 30 ? [0, 1, 0] : SKIN),
      (x) => (x < 30 ? 0 : 1),
    );
    const r = measure(img);
    expect(r.warning).toMatch(/source/);
    expect(r.warning).toMatch(/View/);
  });

  it("still measures a frame with no alpha channel, as fully opaque", () => {
    const img = { ...fixture("screen-even-rgba16.png"), alpha: undefined } as DecodedPng;
    const r = measure(img);
    expect(r.measured).toBe(6144);
    expect(r.screen).toBe("green");
  });
});

describe("caller overrides", () => {
  it("uses the grid asked for", () => {
    const r = measure(fixture("screen-even-rgba16.png"), { columns: 2, rows: 2 });
    expect(r.evenness).toMatchObject({ columns: 2, rows: 2, cellWidth: 48, cellHeight: 32 });
  });

  it("counts fewer pixels as screen with a stricter dominance", () => {
    // (0.25, 0.55, 0.3): green leads by 0.25, 45% of its level.
    const r = measure(fixture("screen-even-rgba16.png"), { minDominance: 0.5 });
    expect(r.screen).toBeNull();
  });
});

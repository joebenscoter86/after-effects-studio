// The measuring half of ae_render_frame's "eyes" (agent-eyes plan, stages 1
// and 2), on fixture PNGs — no After Effects involved. The fixtures are
// written by tests/fixtures/png/make-fixtures.mjs with an encoder independent
// of src/color/png16.ts; their layout is documented there.

import { readFileSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  decodePng,
  encodePngGray8,
  encodePngSrgb8,
  encodePngSrgbRgba8,
} from "../src/color/png16.js";
import {
  CHECKERBOARD,
  compareRegions,
  flattenOver,
  histogramOf,
  sampleRegions,
  unmatte,
} from "../src/color/sheet.js";

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "png");
const fixture = (name: string) => decodePng(readFileSync(path.join(FIXTURES, name)));

/** PNG colour type from the IHDR chunk: 0 gray, 2 RGB, 6 RGBA. */
const colorType = (png: Buffer) => png.readUInt8(25);
const hasChunk = (png: Buffer, type: string) => png.includes(Buffer.from(type, "latin1"));

function rgbAt(rgb: Float64Array, width: number, x: number, y: number): number[] {
  const i = (y * width + x) * 3;
  return [rgb[i], rgb[i + 1], rgb[i + 2]];
}

describe("fixtures decode as documented", () => {
  it("keyed-rgba16 carries straight RGB with a 0 / 0.5 / 1 alpha", () => {
    const img = fixture("keyed-rgba16.png");
    expect(img.bitDepth).toBe(16);
    expect(img.alpha).toBeDefined();
    expect(img.alpha![0]).toBe(0);
    expect(img.alpha![10 * 32 + 12]).toBe(1);
    expect(img.alpha![10 * 32 + 24]).toBeCloseTo(0.5, 4);
    // The screen keeps its green under alpha 0: transparency is not black.
    expect(rgbAt(img.rgb, 32, 0, 0)).toEqual([0, 1, 0]);
  });
});

describe("encoders for the new channel outputs", () => {
  it("writes 8-bit RGBA with sRGB tags and keeps alpha", () => {
    const img = fixture("keyed-rgba16.png");
    const png = encodePngSrgbRgba8(img.width, img.height, img.rgb, img.alpha!);
    expect(colorType(png)).toBe(6);
    expect(hasChunk(png, "sRGB")).toBe(true);
    const back = decodePng(png);
    expect(back.bitDepth).toBe(8);
    expect(back.alpha![0]).toBe(0);
    expect(back.alpha![10 * 32 + 24]).toBeCloseTo(128 / 255, 6);
    expect(back.alpha![10 * 32 + 12]).toBe(1);
    expect(rgbAt(back.rgb, 32, 12, 10)).toEqual([204 / 255, 153 / 255, 128 / 255]);
  });

  it("writes an 8-bit greyscale matte without colour tags", () => {
    const img = fixture("keyed-rgba16.png");
    const png = encodePngGray8(img.width, img.height, img.alpha!);
    expect(colorType(png)).toBe(0);
    expect(hasChunk(png, "sRGB")).toBe(false);
    const back = decodePng(png);
    expect(back.alpha).toBeUndefined();
    expect(rgbAt(back.rgb, 32, 0, 0)).toEqual([0, 0, 0]);
    expect(rgbAt(back.rgb, 32, 12, 10)).toEqual([1, 1, 1]);
    expect(back.rgb[(10 * 32 + 24) * 3]).toBeCloseTo(128 / 255, 6);
  });
});

describe("flattenOver", () => {
  it("composites straight alpha over a solid colour", () => {
    const img = fixture("keyed-rgba16.png");
    const out = flattenOver(img, { kind: "color", color: [1, 0, 1] });
    expect(rgbAt(out, 32, 0, 0)).toEqual([1, 0, 1]);
    const opaque = rgbAt(out, 32, 12, 10);
    expect(opaque[0]).toBeCloseTo(0.8, 4);
    expect(opaque[1]).toBeCloseTo(0.6, 4);
    // Half-covered edge: 0.5·subject + 0.5·magenta.
    const edge = rgbAt(out, 32, 24, 10);
    expect(edge[0]).toBeCloseTo(0.9, 3);
    expect(edge[1]).toBeCloseTo(0.3, 3);
    expect(edge[2]).toBeCloseTo(0.75, 3);
    // The input is not modified.
    expect(rgbAt(img.rgb, 32, 0, 0)).toEqual([0, 1, 0]);
  });

  it("shows transparency as a checkerboard of CHECKERBOARD.size squares", () => {
    const img = fixture("keyed-rgba16.png");
    const out = flattenOver(img, { kind: "checkerboard" });
    const s = CHECKERBOARD.size;
    expect(rgbAt(out, 32, 0, 0)).toEqual(CHECKERBOARD.light);
    expect(rgbAt(out, 32, s, 0)).toEqual(CHECKERBOARD.dark);
    expect(rgbAt(out, 32, 0, s)).toEqual(CHECKERBOARD.dark);
    expect(rgbAt(out, 32, 12, 10)[0]).toBeCloseTo(0.8, 4);
  });

  it("returns an unchanged copy when the image has no alpha", () => {
    const img = fixture("opaque-rgb16.png");
    const out = flattenOver(img, { kind: "color", color: [1, 0, 1] });
    expect(out).not.toBe(img.rgb);
    expect(Array.from(out)).toEqual(Array.from(img.rgb));
  });
});

// saveFrameToPng lays RGB over the comp background (measured live):
// captured = colour·a + bg·(1 − a). unmatte gives the colour back.
describe("unmatte", () => {
  it("recovers the colour from a capture laid over a blue background", () => {
    const img = fixture("ae-blue-bg-rgba16.png");
    const out = unmatte(img, [0, 0, 1]);
    const red = rgbAt(out, 32, 10, 6);
    expect(red[0]).toBeCloseTo(1, 6);
    expect(red[1]).toBeCloseTo(0, 6);
    expect(red[2]).toBeCloseTo(0, 6);
    expect(rgbAt(out, 32, 18, 10)).toEqual([0, 1, 0]);
    // No colour where nothing covers the pixel.
    expect(rgbAt(out, 32, 0, 0)).toEqual([0, 0, 0]);
    // The input is not modified.
    expect(rgbAt(img.rgb, 32, 0, 0)).toEqual([0, 0, 1]);
  });

  it("on a black background divides out the alpha, as for premultiplied colour", () => {
    const out = unmatte(fixture("ae-black-bg-rgba16.png"), [0, 0, 0]);
    expect(rgbAt(out, 32, 10, 6)[0]).toBeCloseTo(1, 6);
  });

  it("an 8-bit capture gives the same colour, kept within 0..1", () => {
    const out = unmatte(fixture("ae-blue-bg-rgba8.png"), [0, 0, 1]);
    const red = rgbAt(out, 32, 10, 6);
    expect(red[0]).toBeCloseTo(1, 6);
    expect(red[2]).toBeGreaterThanOrEqual(0);
  });

  it("with flattenOver, re-lays the colour over a new backdrop", () => {
    const img = fixture("ae-blue-bg-rgba16.png");
    const out = flattenOver(
      { ...img, rgb: unmatte(img, [0, 0, 1]) },
      { kind: "color", color: [1, 0, 1] },
    );
    const a = 128 / 255;
    const red = rgbAt(out, 32, 10, 6);
    expect(red[0]).toBeCloseTo(1, 6);
    expect(red[2]).toBeCloseTo(1 - a, 6);
  });

  it("returns an unchanged copy when the image has no alpha", () => {
    const img = fixture("opaque-rgb16.png");
    const out = unmatte(img, [0, 0, 1]);
    expect(out).not.toBe(img.rgb);
    expect(Array.from(out)).toEqual(Array.from(img.rgb));
  });
});

describe("sampleRegions", () => {
  const img = fixture("keyed-rgba16.png");

  it("reports mean, min and max per channel and alpha coverage for a rectangle", () => {
    const [skin] = sampleRegions(img, [{ name: "skin", x: 10, y: 6, width: 4, height: 4 }]);
    expect(skin).toMatchObject({
      name: "skin",
      rect: { x: 10, y: 6, width: 4, height: 4 },
      clipped: false,
      pixels: 16,
    });
    if ("error" in skin) throw new Error(skin.error);
    expect(skin.mean[0]).toBeCloseTo(0.8, 4);
    expect(skin.min[1]).toBeCloseTo(0.6, 4);
    expect(skin.max[2]).toBeCloseTo(0.5, 4);
    expect(skin.alpha).toEqual({
      mean: 1,
      min: 1,
      max: 1,
      opaqueShare: 1,
      partialShare: 0,
      transparentShare: 0,
    });
  });

  it("samples one pixel for a point and splits coverage into opaque / partial / transparent", () => {
    const [edge, mixed] = sampleRegions(img, [
      { name: "edge", x: 24, y: 10 },
      { name: "mixed", x: 22, y: 4, width: 4, height: 1 },
    ]);
    if ("error" in edge || "error" in mixed) throw new Error("unexpected region error");
    expect(edge.pixels).toBe(1);
    expect(edge.rect).toEqual({ x: 24, y: 10, width: 1, height: 1 });
    expect(edge.alpha!.mean).toBeCloseTo(0.5, 4);
    // x 22, 23 opaque; 24 half; 25 transparent.
    expect(mixed.alpha!.mean).toBeCloseTo(0.625, 4);
    expect(mixed.alpha!.opaqueShare).toBe(0.5);
    expect(mixed.alpha!.partialShare).toBe(0.25);
    expect(mixed.alpha!.transparentShare).toBe(0.25);
    expect(mixed.min[0]).toBe(0);
    expect(mixed.max[0]).toBeCloseTo(0.8, 4);
  });

  it("clips a region that runs off the frame and refuses one wholly outside it", () => {
    const [partial, outside] = sampleRegions(img, [
      { name: "corner", x: 30, y: 22, width: 10, height: 10 },
      { name: "gone", x: 40, y: 0, width: 2, height: 2 },
    ]);
    expect(partial).toMatchObject({ clipped: true, rect: { x: 30, y: 22, width: 2, height: 2 } });
    expect(outside).toMatchObject({ name: "gone" });
    expect("error" in outside && outside.error).toMatch(/outside the 32×24 frame/);
  });

  it("reports alpha as null for an image without an alpha channel", () => {
    const [all] = sampleRegions(fixture("opaque-rgb16.png"), [
      { name: "all", x: 0, y: 0, width: 32, height: 24 },
    ]);
    if ("error" in all) throw new Error(all.error);
    expect(all.alpha).toBeNull();
    expect(all.mean[2]).toBeCloseTo(0.75, 4);
  });
});

describe("histogramOf", () => {
  it("counts every pixel per channel into equal-width bins", () => {
    const h = histogramOf(fixture("opaque-rgb16.png"), 4);
    expect(h.bins).toBe(4);
    expect(h.pixels).toBe(32 * 24);
    expect(h.r).toEqual([0, 768, 0, 0]);
    expect(h.g).toEqual([0, 0, 768, 0]);
    expect(h.b).toEqual([0, 0, 768, 0]);
    expect(h.a).toBeUndefined();
  });

  it("puts 1.0 in the last bin and includes alpha when present", () => {
    const h = histogramOf(fixture("keyed-rgba16.png"), 4);
    // 256 opaque subject pixels, 16 half-covered edge pixels, the rest screen.
    expect(h.a).toEqual([768 - 256 - 16, 0, 16, 256]);
    // Green: screen pixels are 1.0 (last bin), subject 0.6 (bin 2).
    expect(h.g).toEqual([0, 0, 272, 496]);
  });
});

describe("compareRegions", () => {
  it("reports signed and absolute per-channel differences between two frames", () => {
    const a = fixture("keyed-rgba16.png");
    const b = fixture("keyed-moved-rgba16.png");
    const [skin, screen] = compareRegions(a, b, [
      { name: "skin", x: 10, y: 6, width: 4, height: 4 },
      { name: "screen", x: 0, y: 0, width: 4, height: 4 },
    ]);
    if ("error" in skin || "error" in screen) throw new Error("unexpected region error");
    expect(skin.pixels).toBe(16);
    expect(skin.meanDelta[0]).toBeCloseTo(0.1, 4);
    expect(skin.meanDelta[1]).toBeCloseTo(-0.1, 4);
    expect(skin.meanDelta[2]).toBeCloseTo(0, 4);
    expect(skin.meanAbsDelta[1]).toBeCloseTo(0.1, 4);
    expect(skin.maxAbsDelta[0]).toBeCloseTo(0.1, 4);
    expect(skin.alpha).toEqual({ meanDelta: 0, meanAbsDelta: 0, maxAbsDelta: 0 });
    expect(screen.meanAbsDelta).toEqual([0, 0, 0]);
  });

  it("refuses frames of different sizes", () => {
    const a = fixture("keyed-rgba16.png");
    const small = decodePng(encodePngSrgb8(2, 2, new Float64Array(12)));
    expect(() => compareRegions(a, small, [{ name: "p", x: 0, y: 0 }])).toThrow(/size/);
  });
});

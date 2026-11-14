// Integration measures (professional-finish plan, stage 4): grain, edge
// sharpness, black and white points and colour (CIELAB) of named regions, the
// `look` option of ae_render_frame, measured in Node on decoded frames. Made-up
// images only; nothing here reaches After Effects.

import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { describe, expect, it } from "vitest";

import { encodePngSrgb8, encodePngSrgbRgba8, type DecodedPng } from "../src/color/png16.js";
import { renderFrameTool, renderJsx } from "../src/tools/render-frame.js";
import type { AeTransport, EvalRequest, EvalResult } from "../src/transport/AeTransport.js";
import {
  LOOK_DEFAULTS,
  compareLook,
  labOf,
  lookArgsError,
  lookCrops,
  measureLook,
  neutralGains,
  summarizeLookSeries,
  temporalGrain,
  type Rgb,
} from "../src/color/sheet.js";

/** A seeded random source, so the noise is the same on every run. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
/** Normal noise, Box-Muller. */
function gauss(r: () => number) {
  const u = Math.max(r(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}
const erf = (x: number) => {
  // Abramowitz and Stegun 7.1.26
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return x >= 0 ? y : -y;
};

interface Opts {
  width?: number;
  height?: number;
  /** Grain standard deviation per channel, in 8-bit steps. */
  grain?: number;
  /** Blur sigma of the vertical edge at x = edgeX, px (0: a hard step). */
  sigma?: number;
  edgeX?: number;
  dark?: Rgb;
  light?: Rgb;
  seed?: number;
  alpha?: (x: number, y: number) => number;
}

/** A frame split by one vertical edge, dark left and light right, with optional grain and blur. */
function frame(o: Opts = {}): DecodedPng {
  const w = o.width ?? 160;
  const h = o.height ?? 120;
  const ex = o.edgeX ?? 80;
  const dark = o.dark ?? [0.2, 0.2, 0.2];
  const light = o.light ?? [0.7, 0.7, 0.7];
  const r = rng(o.seed ?? 1);
  const rgb = new Float64Array(w * h * 3);
  const a = o.alpha ? new Float64Array(w * h) : undefined;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      // The pixel's share of the light side: a step at ex, or a Gaussian-blurred step.
      const t =
        (o.sigma ?? 0) > 0
          ? 0.5 * (1 + erf((x + 0.5 - ex) / ((o.sigma as number) * Math.SQRT2)))
          : x >= ex
            ? 1
            : 0;
      const p = y * w + x;
      for (let c = 0; c < 3; c++) {
        const v = dark[c] + (light[c] - dark[c]) * t + ((o.grain ?? 0) / 255) * gauss(r);
        rgb[p * 3 + c] = Math.min(1, Math.max(0, v));
      }
      if (a) a[p] = o.alpha!(x, y);
    }
  return { width: w, height: h, bitDepth: 16, rgb, alpha: a } as DecodedPng;
}

/** A flat frame of one colour. */
const flat = (c: Rgb, w = 64, h = 48): DecodedPng =>
  frame({ width: w, height: h, dark: c, light: c });

const WHOLE = { name: "all", x: 0, y: 0, width: 160, height: 120 };

describe("CIELAB", () => {
  it("reads a neutral grey as a* = b* = 0", () => {
    const g = labOf([0.5, 0.5, 0.5]);
    expect(g.L).toBeCloseTo(53.4, 0);
    expect(Math.abs(g.a)).toBeLessThan(0.01);
    expect(Math.abs(g.b)).toBeLessThan(0.01);
  });

  it("reads the take's lavender wall (134, 114, 142) as magenta and blue", () => {
    const wall = labOf([133.9 / 255, 114.1 / 255, 142.2 / 255]);
    expect(wall.a).toBeCloseTo(13.2, 0);
    expect(wall.b).toBeCloseTo(-12.5, 0);
    expect(wall.hue).toBeCloseTo(317, -1);
  });
});

describe("neutralGains", () => {
  it("gives per-channel gains that make the colour neutral at the same luma", () => {
    const wall: Rgb = [133.9 / 255, 114.1 / 255, 142.2 / 255];
    const g = neutralGains(wall);
    const out = wall.map((v, i) => v * g[i]);
    expect(out[0]).toBeCloseTo(out[1], 6);
    expect(out[1]).toBeCloseTo(out[2], 6);
    const luma = (c: number[]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    expect(luma(out)).toBeCloseTo(luma(wall), 6);
    expect(g[0]).toBeCloseTo(0.898, 2);
    expect(g[2]).toBeCloseTo(0.846, 2);
  });
});

describe("grain", () => {
  it("reads the standard deviation of white grain in 8-bit steps, through an edge", () => {
    const res = measureLook(frame({ grain: 4, seed: 3 }), { regions: [WHOLE] });
    const g = res.regions[0] as any;
    for (const v of g.grain.spatial) expect(v).toBeGreaterThan(3.5);
    for (const v of g.grain.spatial) expect(v).toBeLessThan(4.5);
  });

  it("reads small grain on 8-bit values (1.5 steps) within a fifth, in a frame and between frames", () => {
    const q8 = (img: DecodedPng) => {
      for (let i = 0; i < img.rgb.length; i++) img.rgb[i] = Math.round(img.rgb[i] * 255) / 255;
      return img;
    };
    const args = { regions: [WHOLE] };
    const a = q8(frame({ grain: 1.5, seed: 41 }));
    const b = q8(frame({ grain: 1.5, seed: 42 }));
    for (const v of (measureLook(a, args).regions[0] as any).grain.spatial) {
      expect(v).toBeGreaterThan(1.2);
      expect(v).toBeLessThan(1.8);
    }
    for (const v of temporalGrain(
      lookCrops(a, args).get("all")!,
      lookCrops(b, args).get("all")!,
    )!) {
      expect(v).toBeGreaterThan(1.2);
      expect(v).toBeLessThan(1.8);
    }
  });

  it("reads a clean frame as no grain", () => {
    const g = (measureLook(frame({}), { regions: [WHOLE] }).regions[0] as any).grain;
    for (const v of g.spatial) expect(v).toBeLessThan(0.05);
  });

  it("reads grain that changes from frame to frame, and none on a still element", () => {
    const args = { regions: [WHOLE] };
    const a = lookCrops(frame({ grain: 3, seed: 5 }), args);
    const b = lookCrops(frame({ grain: 3, seed: 6 }), args);
    const t = temporalGrain(a.get("all")!, b.get("all")!)!;
    for (const v of t) expect(v).toBeGreaterThan(2.6);
    for (const v of t) expect(v).toBeLessThan(3.4);
    const still = lookCrops(frame({ grain: 3, seed: 5 }), args);
    for (const v of temporalGrain(a.get("all")!, still.get("all")!)!) expect(v).toBe(0);
  });
});

describe("sharpness", () => {
  it("reads a hard edge as under a pixel wide", () => {
    const s = (measureLook(frame({}), { regions: [WHOLE] }).regions[0] as any).sharpness;
    expect(s.edgeWidth).toBeLessThan(1.2);
    expect(s.edges).toBeGreaterThan(10);
  });

  it("reads a blurred edge as about 2.56 sigma wide (the 10 to 90% rise)", () => {
    for (const sigma of [1, 2, 3]) {
      const s = (measureLook(frame({ sigma }), { regions: [WHOLE] }).regions[0] as any).sharpness;
      expect(s.edgeWidth).toBeGreaterThan(2.56 * sigma * 0.85);
      expect(s.edgeWidth).toBeLessThan(2.56 * sigma * 1.15);
    }
  });

  it("still reads the edge through grain", () => {
    const s = (
      measureLook(frame({ sigma: 2, grain: 3, seed: 9 }), { regions: [WHOLE] }).regions[0] as any
    ).sharpness;
    expect(s.edgeWidth).toBeGreaterThan(2.56 * 2 * 0.8);
    expect(s.edgeWidth).toBeLessThan(2.56 * 2 * 1.25);
  });

  it("says there is no edge in a flat region", () => {
    const s = (
      measureLook(flat([0.4, 0.4, 0.4]), {
        regions: [{ name: "f", x: 0, y: 0, width: 64, height: 48 }],
      }).regions[0] as any
    ).sharpness;
    expect(s.edgeWidth).toBeNull();
    expect(s.edges).toBe(0);
  });
});

describe("levels", () => {
  it("reports the black and white points per channel and in luma", () => {
    const l = (
      measureLook(frame({ dark: [0.1, 0.12, 0.14], light: [0.8, 0.82, 0.84] }), {
        regions: [WHOLE],
      }).regions[0] as any
    ).levels;
    expect(l.black[0]).toBeCloseTo(0.1, 2);
    expect(l.black[2]).toBeCloseTo(0.14, 2);
    expect(l.white[1]).toBeCloseTo(0.82, 2);
    expect(l.lumaBlack).toBeCloseTo(0.2126 * 0.1 + 0.7152 * 0.12 + 0.0722 * 0.14, 2);
  });

  it("counts only opaque pixels when the frame has alpha", () => {
    // The dark half is transparent: only the light half is the element.
    const img = frame({ alpha: (x) => (x >= 80 ? 1 : 0) });
    const r = measureLook(img, { regions: [WHOLE] }).regions[0] as any;
    expect(r.pixels).toBe(80 * 120);
    expect(r.levels.black[0]).toBeCloseTo(0.7, 2);
  });
});

describe("roles", () => {
  it("names the cast on a neutral, with the gains that remove it", () => {
    const res = measureLook(flat([133.9 / 255, 114.1 / 255, 142.2 / 255]), {
      regions: [{ name: "wall", x: 0, y: 0, width: 64, height: 48, role: "neutral" }],
    });
    const r = res.regions[0] as any;
    expect(r.cast.toward).toBe("magenta and blue");
    expect(r.cast.gains[0]).toBeCloseTo(0.898, 2);
    expect(r.cast.channelMixer).toEqual({ "Red-Red": 90, "Green-Green": 105, "Blue-Blue": 85 });
    expect(r.reading).toMatch(/wall reads a\* \+13\.\d, b\* -12\.\d/);
    expect(r.reading).toMatch(/a neutral reads 0, 0/);
  });

  it("calls a neutral within about 2 of 0, 0 neutral", () => {
    const r = measureLook(flat([0.5, 0.5, 0.505]), {
      regions: [{ name: "card", x: 0, y: 0, width: 64, height: 48, role: "neutral" }],
    }).regions[0] as any;
    expect(r.cast.toward).toBeNull();
    expect(r.reading).toMatch(/reads neutral/);
  });

  it("reads skin's hue angle against the usual range", () => {
    const pink = measureLook(flat([169 / 255, 103.5 / 255, 121 / 255]), {
      regions: [{ name: "forehead", x: 0, y: 0, width: 64, height: 48, role: "skin" }],
    }).regions[0] as any;
    expect(pink.colour.hue).toBeLessThan(10);
    expect(pink.reading).toMatch(/leans to magenta/);
    const warm = measureLook(flat([0.8, 0.6, 0.5]), {
      regions: [{ name: "cheek", x: 0, y: 0, width: 64, height: 48, role: "skin" }],
    }).regions[0] as any;
    expect(warm.colour.hue).toBeGreaterThan(40);
    expect(warm.reading).toMatch(/inside the usual range/);
  });
});

describe("an element against its plate", () => {
  const plate = { name: "plate", x: 0, y: 0, width: 80, height: 120, role: "plate" as const };
  const element = {
    name: "element",
    x: 80,
    y: 0,
    width: 80,
    height: 120,
    role: "element" as const,
  };
  /** Left half: a grainy, soft plate with its own edge; right half: a clean, sharp element. */
  function split(elementGrain: number, elementSigma: number): DecodedPng {
    const left = frame({ grain: 3, sigma: 2, edgeX: 40, seed: 11 });
    const right = frame({ grain: elementGrain, sigma: elementSigma, edgeX: 120, seed: 12 });
    const out = frame({});
    for (let y = 0; y < 120; y++)
      for (let x = 0; x < 160; x++)
        for (let c = 0; c < 3; c++) {
          const src = x < 80 ? left : right;
          out.rgb[(y * 160 + x) * 3 + c] = src.rgb[(y * 160 + x) * 3 + c];
        }
    return out;
  }

  it("says the clean, sharp element needs grain and softening", () => {
    const res = measureLook(split(0, 0), {
      regions: [plate, element],
      pairs: [{ element: "element", plate: "plate" }],
    });
    const p = res.pairs![0] as any;
    expect(p.grain.ratio).toBeLessThan(0.2);
    expect(p.sharpness.ratio).toBeLessThan(0.4);
    expect(p.readings.join(" ")).toMatch(/cleaner than the plate: add grain/);
    expect(p.readings.join(" ")).toMatch(/sharper than the plate: soften/);
  });

  it("says they match once the element has the plate's grain and softness", () => {
    const res = measureLook(split(3, 2), {
      regions: [plate, element],
      pairs: [{ element: "element", plate: "plate" }],
    });
    const p = res.pairs![0] as any;
    expect(p.grain.matches).toBe(true);
    expect(p.sharpness.matches).toBe(true);
    expect(p.readings.join(" ")).not.toMatch(/add grain|soften/);
  });

  it("uses the tolerances it reports", () => {
    expect(LOOK_DEFAULTS.grainTolerance).toBe(0.25);
    expect(LOOK_DEFAULTS.sharpnessTolerance).toBe(0.25);
    const p = compareLook(
      {
        name: "e",
        grain: { spatial: [1, 1, 1] },
        sharpness: { edgeWidth: 3, edges: 5 },
        levels: { lumaBlack: 0.1, lumaWhite: 0.9 },
      } as any,
      {
        name: "p",
        grain: { spatial: [1.2, 1.2, 1.2] },
        sharpness: { edgeWidth: 3.5, edges: 5 },
        levels: { lumaBlack: 0.05, lumaWhite: 0.9 },
      } as any,
    ) as any;
    expect(p.grain.matches).toBe(true);
    expect(p.sharpness.matches).toBe(true);
    expect(p.levels.blackDifference).toBeCloseTo(0.05, 4);
    expect(p.readings.join(" ")).toMatch(/blacks are lifted/);
  });
});

describe("across frames", () => {
  it("adds the frame-to-frame grain of each region and of each pair", () => {
    const args = {
      regions: [
        { name: "plate", x: 0, y: 0, width: 80, height: 120, role: "plate" as const },
        { name: "element", x: 80, y: 0, width: 80, height: 120, role: "element" as const },
      ],
      pairs: [{ element: "element", plate: "plate" }],
    };
    // The plate's grain changes every frame; the element is the same picture twice.
    const f0 = frame({ grain: 3, seed: 21 });
    const f1 = frame({ grain: 3, seed: 22 });
    for (let y = 0; y < 120; y++)
      for (let x = 80; x < 160; x++)
        for (let c = 0; c < 3; c++) f1.rgb[(y * 160 + x) * 3 + c] = f0.rgb[(y * 160 + x) * 3 + c];
    const s = summarizeLookSeries([lookCrops(f0, args), lookCrops(f1, args)], args) as any;
    const plate = s.regions.find((r: any) => r.name === "plate");
    const element = s.regions.find((r: any) => r.name === "element");
    expect(plate.temporal[1]).toBeGreaterThan(2.5);
    expect(element.temporal[1]).toBe(0);
    expect(s.pairs[0].readings.join(" ")).toMatch(/does not change from frame to frame/);
  });
});

describe("arguments", () => {
  it("refuses unusable look arguments with a message naming the field", () => {
    expect(lookArgsError({})).toMatch(/regions/);
    expect(
      lookArgsError({ regions: [{ name: "a", x: 0, y: 0, width: 4, height: 4, role: "sky" }] }),
    ).toMatch(/role/);
    expect(
      lookArgsError({
        regions: [{ name: "a", x: 0, y: 0, width: 4, height: 4 }],
        pairs: [{ element: "a", plate: "b" }],
      }),
    ).toMatch(/plate 'b'/);
    expect(lookArgsError({ regions: [{ name: "a", x: 0, y: 0, width: 4, height: 4 }] })).toBeNull();
  });
});

/** Fake After Effects: writes images[i] as the i-th capture, frame numbers from `frames`, no working space. */
function fakeAe(images: DecodedPng[], frameNumbers: number[]): AeTransport {
  return {
    async execute(req: EvalRequest): Promise<EvalResult> {
      const paths = JSON.parse(/var _paths = (.*);/.exec(req.code)![1]) as string[];
      const times = JSON.parse(/var _times = (.*);/.exec(req.code)![1]) as number[];
      const frames = [];
      for (const [i, p] of paths.entries()) {
        await fs.mkdir(path.dirname(p), { recursive: true });
        const img = images[i % images.length];
        await fs.writeFile(p, encodePngSrgb8(img.width, img.height, img.rgb));
        frames.push({
          ok: true,
          writtenTo: p,
          time: times[i],
          frame: frameNumbers[i],
          frameOffset: 0,
          size: [img.width, img.height],
          captureKind: "direct",
        });
      }
      return {
        ok: true,
        result: {
          ok: true,
          frames,
          captureKind: "direct",
          compName: "Main",
          workingSpace: "None",
          bitsPerChannel: 8,
          projectFile: null,
          bgColor: [0, 0, 0],
        },
        error: null,
        errorCode: null,
        stack: null,
        logs: [],
        durationMs: 0,
      };
    },
  };
}

describe("ae_render_frame look", () => {
  const LOOK = {
    regions: [
      { name: "plate", x: 0, y: 0, width: 80, height: 120, role: "plate" },
      { name: "element", x: 80, y: 0, width: 80, height: 120, role: "element" },
    ],
    pairs: [{ element: "element", plate: "plate" }],
  };

  it("reads each frame and the grain from frame to frame, through the tool", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "look-"));
    const f0 = frame({ grain: 3, sigma: 2, edgeX: 40, seed: 31 });
    const f1 = frame({ grain: 3, sigma: 2, edgeX: 40, seed: 32 });
    const out = await renderFrameTool.handler(
      {
        compNameOrId: "Main",
        outPath: path.join(dir, "f.png"),
        times: [0, 1 / 30],
        look: LOOK,
      } as never,
      fakeAe([f0, f1], [0, 1]),
    );
    const res = (out.structuredContent as any).result;
    expect(out.isError).toBeFalsy();
    expect(res.frames[0].look.regions[0].grain.spatial[1]).toBeGreaterThan(2);
    expect(res.frames[0].look.pairs[0].element).toBe("element");
    expect(res.lookSeries.regions[0].temporal[1]).toBeGreaterThan(2);
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("leaves the series out, and says why, when the frames are not consecutive", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "look-"));
    const out = await renderFrameTool.handler(
      {
        compNameOrId: "Main",
        outPath: path.join(dir, "f.png"),
        times: [0, 1],
        look: LOOK,
      } as never,
      fakeAe([frame({ grain: 3 })], [0, 30]),
    );
    const res = (out.structuredContent as any).result;
    expect(res.lookSeries).toBeUndefined();
    expect(res.lookWarning).toMatch(/consecutive frames/);
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("refuses a pair that names no region, before After Effects is called", async () => {
    let called = false;
    const t: AeTransport = {
      execute: async () => {
        called = true;
        throw new Error("no");
      },
    };
    const out = await renderFrameTool.handler(
      {
        compNameOrId: "Main",
        outPath: "/tmp/x.png",
        time: 0,
        look: { regions: [LOOK.regions[0]], pairs: [{ element: "e", plate: "plate" }] },
      } as never,
      t,
    );
    expect(out.isError).toBe(true);
    expect(JSON.stringify(out.structuredContent)).toMatch(/element 'e'/);
    expect(called).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// The matte's own edge (professional-finish plan, stage 5)
// ---------------------------------------------------------------------------

/** A frame whose alpha is a vertical step at x = 80, blurred by sigma (0: hard); straight colour from `colour(alpha)`. */
function matteFrame(
  sigma: number,
  colour: (a: number) => Rgb = () => [0.1, 0.07, 0.06],
  shift = 0,
): DecodedPng {
  const w = 160;
  const h = 120;
  const rgb = new Float64Array(w * h * 3);
  const alpha = new Float64Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const a =
        sigma > 0
          ? 0.5 * (1 - erf((x + 0.5 - 80 - shift) / (sigma * Math.SQRT2)))
          : x < 80 + shift
            ? 1
            : 0;
      const p = y * w + x;
      alpha[p] = a;
      const c = colour(a);
      for (let k = 0; k < 3; k++) rgb[p * 3 + k] = c[k];
    }
  return { width: w, height: h, bitDepth: 16, rgb, alpha } as DecodedPng;
}
const HAIR: Rgb = [0.1, 0.07, 0.06];
const WALL: Rgb = [0.525, 0.447, 0.557];

describe("look on a matte", () => {
  it("gives the widest tenth of the edge widths beside the median", () => {
    const s = (measureLook(frame({ sigma: 2 }), { regions: [WHOLE] }).regions[0] as any).sharpness;
    expect(s.p90).toBeGreaterThanOrEqual(s.edgeWidth);
    expect(s.p90).toBeLessThan(s.edgeWidth * 1.3);
  });

  it("reads the alpha's own edge width, widest tenth and soft band where the frame has alpha", () => {
    const hard = (measureLook(matteFrame(0), { regions: [WHOLE] }).regions[0] as any).matte;
    expect(hard.edgeWidth).toBeLessThan(1.2);
    expect(hard.softBand).toBeLessThan(0.1);
    const soft = (measureLook(matteFrame(3), { regions: [WHOLE] }).regions[0] as any).matte;
    expect(soft.edgeWidth).toBeGreaterThan(2.56 * 3 * 0.85);
    expect(soft.edgeWidth).toBeLessThan(2.56 * 3 * 1.15);
    expect(soft.p90).toBeGreaterThanOrEqual(soft.edgeWidth);
    // Soft pixels (alpha 0.02 to 0.98) per pixel of outline: about 2 x 2.05 sigma for a Gaussian edge.
    expect(soft.softBand).toBeGreaterThan(10);
    expect(soft.softBand).toBeLessThan(14);
    expect(measureLook(frame({}), { regions: [WHOLE] }).regions[0]).not.toHaveProperty("matte");
  });

  it("says how far the soft band's colour leans toward the background colour", () => {
    // Contaminated: the soft pixels carry the wall in proportion to their transparency.
    const dirty = matteFrame(3, (a) => HAIR.map((h, k) => h * a + WALL[k] * (1 - a)) as Rgb);
    const clean = matteFrame(3, () => HAIR);
    const args = { regions: [WHOLE], background: WALL };
    const d = (measureLook(dirty, args).regions[0] as any).edgeColour;
    const c = (measureLook(clean, args).regions[0] as any).edgeColour;
    expect(d.towardBackground).toBeGreaterThan(0.3);
    expect(c.towardBackground).toBeLessThan(0.05);
    expect(d.difference).toBeGreaterThan(c.difference);
    expect(d.reading).toMatch(/toward the background/);
    // Without a background colour, the band is still compared with the inside.
    const n = (measureLook(dirty, { regions: [WHOLE] }).regions[0] as any).edgeColour;
    expect(n.towardBackground).toBeNull();
    expect(n.difference).toBeGreaterThan(5);
  });

  it("says how much of a region is fully opaque and the lowest alpha in it, to catch a see-through band", () => {
    const solid = matteFrame(0);
    const inside = { name: "inside", x: 10, y: 10, width: 50, height: 100 };
    const m = (measureLook(solid, { regions: [inside] }).regions[0] as any).matte;
    expect(m.opaqueShare).toBe(1);
    expect(m.minAlpha).toBe(1);
    // A band at alpha 0.75 across the region, as two feathered masks that do not add up to one leave.
    for (let y = 50; y < 60; y++) for (let x = 0; x < 80; x++) solid.alpha![y * 160 + x] = 0.75;
    const b = (measureLook(solid, { regions: [inside] }).regions[0] as any).matte;
    expect(b.opaqueShare).toBeCloseTo(0.9, 2);
    expect(b.minAlpha).toBe(0.75);
  });

  it("adds the matte's change from frame to frame to the series", () => {
    const args = { regions: [WHOLE] };
    const same = summarizeLookSeries(
      [lookCrops(matteFrame(3), args), lookCrops(matteFrame(3), args)],
      args,
    ) as any;
    expect(same.regions[0].matteChange).toBe(0);
    const moved = summarizeLookSeries(
      [lookCrops(matteFrame(3), args), lookCrops(matteFrame(3, undefined, 1), args)],
      args,
    ) as any;
    expect(moved.regions[0].matteChange).toBeGreaterThan(0.001);
  });

  it("refuses a background that is not a colour", () => {
    expect(
      lookArgsError({
        regions: [{ name: "a", x: 0, y: 0, width: 4, height: 4 }],
        background: [2, 0, 0],
      }),
    ).toMatch(/background/);
    expect(
      lookArgsError({
        regions: [{ name: "a", x: 0, y: 0, width: 4, height: 4 }],
        background: [0.5, 0.4, 0.5],
      }),
    ).toBeNull();
  });
});

// ------------------------------------------------------- colour-managed projects (stage 7)

describe("ae_render_frame in a project under Adobe's colour management (ICC, ACEScg, 32 bpc)", () => {
  /** A capture payload as After Effects 27.0 reports it there; the RGBA file is written raw. */
  function managedAe(img: DecodedPng, cms: number | null, calls: string[]): AeTransport {
    return {
      async execute(req: EvalRequest): Promise<EvalResult> {
        calls.push(req.label ?? "");
        const paths = JSON.parse(/var _paths = (.*);/.exec(req.code)![1]) as string[];
        await fs.mkdir(path.dirname(paths[0]), { recursive: true });
        const alpha = new Float64Array(img.width * img.height).map((_, p) => ((p % img.width) < img.width / 2 ? 1 : 0));
        await fs.writeFile(paths[0], encodePngSrgbRgba8(img.width, img.height, img.rgb, alpha));
        return {
          ok: true,
          result: {
            ok: true,
            frames: [{ ok: true, writtenTo: paths[0], time: 0, frame: 0, frameOffset: 0, size: [img.width, img.height], captureKind: "direct" }],
            captureKind: "direct",
            compName: "Main",
            workingSpace: "ACEScg ACES Working Space AMPAS S-2014-004",
            colorManagementSystem: cms,
            bitsPerChannel: 32,
            projectFile: null,
            bgColor: [0, 0, 0],
          },
          error: null,
          errorCode: null,
          stack: null,
          logs: [],
          durationMs: 0,
        };
      },
    };
  }
  const REGION = { name: "patch", x: 0, y: 0, width: 40, height: 40 };

  it("refuses the colour readings in plain words, keeps the raw capture and the alpha measures, and never calibrates", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "managed-"));
    const calls: string[] = [];
    const out = await renderFrameTool.handler(
      {
        compNameOrId: "Main",
        outPath: path.join(dir, "f.png"),
        time: 0,
        sample: { regions: [REGION] },
        look: { regions: [{ ...REGION, role: "neutral" }] },
        edge: { screen: "green" },
        histogram: true,
        analyze: true,
        channels: "rgba",
      } as never,
      managedAe(frame({ grain: 3 }), 0, calls),
    );
    const res = (out.structuredContent as any).result;
    expect(out.isError).toBeFalsy();
    expect(calls).toEqual(["render_frame"]);
    expect(res.colorRefused.reason).toMatch(/colour-managed/);
    expect(res.colorRefused.reason).toMatch(/ACEScg/);
    expect(res.colorRefused.refused).toEqual(expect.arrayContaining(["sample (output)", "look", "histogram", "analyze", "edge spill", "channels rgba"]));
    expect(res.look).toBeUndefined();
    expect(res.histogram).toBeUndefined();
    expect(res.analysis).toBeUndefined();
    expect(res.samples[0].output).toBeUndefined();
    expect(res.samples[0].capture.mean).toBeDefined();
    expect(res.edge.width).toBeDefined();
    expect(res.edge.spill).toMatchObject({ refused: expect.stringMatching(/colour-managed/) });
    expect(res.colorWarning).toMatch(/raw/);
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("gives the raw working-space values without refusing when colorManaged is off", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "managed-"));
    const out = await renderFrameTool.handler(
      { compNameOrId: "Main", outPath: path.join(dir, "f.png"), time: 0, sample: { regions: [REGION] }, colorManaged: "off" } as never,
      managedAe(frame({ grain: 3 }), 0, []),
    );
    const res = (out.structuredContent as any).result;
    expect(res.colorRefused).toBeUndefined();
    expect(res.samples[0].output.mean).toBeDefined();
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("asks the capture script for the colour engine, and adds the OCIO layer only under OCIO", () => {
    const code = renderJsx({ compNameOrId: "Main" } as never, [0], ["/tmp/x.png"], true, null, null, null);
    expect(code).toMatch(/colorManagementSystem/);
    expect(code).toMatch(/_useOcio = [^;]*_cms === 1/);
  });
});

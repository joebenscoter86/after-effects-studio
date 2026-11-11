// ae_render_frame's new options (agent-eyes plan, stages 1 and 2) through the
// real tool handler, with an in-process fake transport: nothing here can
// reach After Effects. The fake stands in for saveFrameToPng by copying a
// fixture PNG to each path the generated JSX asks for, and answers with the
// payload the JSX would return for a comp whose working space is None (so no
// calibration round trip is made).
//
// The isolation tests at the bottom run the generated JSX itself against a
// mock comp, to prove every layer switch is restored — including when the
// render throws.

import { promises as fs, readFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { decodePng } from "../src/color/png16.js";
import { CHECKERBOARD } from "../src/color/sheet.js";
import { renderFrameTool } from "../src/tools/render-frame.js";
import type { AeTransport, EvalRequest, EvalResult } from "../src/transport/AeTransport.js";

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "png");
type Rgb = [number, number, number];

// The default fixture is a capture as saveFrameToPng really writes it
// (measured live): RGB already laid over the comp background, here blue.
// Layout in make-fixtures.mjs. Points: empty (0, 0), half red (10, 6) at
// alpha A, opaque green (18, 10).
const AE_BLUE = "ae-blue-bg-rgba16.png";
const BLUE: Rgb = [0, 0, 1];
const A = 128 / 255;
const EMPTY = [0, 0] as const;
const HALF_RED = [10, 6] as const;
const GREEN = [18, 10] as const;

interface FakeTransport extends AeTransport {
  calls: EvalRequest[];
}

/** Fake AE: writes fixtures[i] to the i-th requested path; reports a None working space. */
function fakeAe(fixtures: string[], bgColor: Rgb | null = BLUE): FakeTransport {
  const calls: EvalRequest[] = [];
  return {
    calls,
    async execute(req: EvalRequest): Promise<EvalResult> {
      calls.push(req);
      const paths = JSON.parse(/var _paths = (.*);/.exec(req.code)![1]) as string[];
      const times = JSON.parse(/var _times = (.*);/.exec(req.code)![1]) as number[];
      const frames = [];
      for (const [i, p] of paths.entries()) {
        await fs.mkdir(path.dirname(p), { recursive: true });
        await fs.copyFile(path.join(FIXTURES, fixtures[i % fixtures.length]), p);
        frames.push({
          ok: true,
          writtenTo: p,
          time: times[i],
          size: [32, 24],
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
          bitsPerChannel: 16,
          projectFile: null,
          bgColor,
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

type Structured = Record<string, any>;
async function render(
  args: Record<string, unknown>,
  fixtures: string[] = [AE_BLUE],
  bgColor: Rgb | null = BLUE,
): Promise<{ res: Structured; isError: boolean; transport: FakeTransport }> {
  const transport = fakeAe(fixtures, bgColor);
  const out = await renderFrameTool.handler(
    { compNameOrId: "Main", outPath: path.join(dir, "f.png"), ...args } as never,
    transport,
  );
  // Success: the render payload sits under `result`; errors: the envelope itself.
  const sc = out.structuredContent as Structured;
  return {
    res: out.isError ? sc : (sc.result as Structured),
    isError: out.isError === true,
    transport,
  };
}

const colorType = (file: string) => readFileSync(file).readUInt8(25);
function pixel(file: string, x: number, y: number): number[] {
  const img = decodePng(readFileSync(file));
  const i = (y * img.width + x) * 3;
  const out = [img.rgb[i], img.rgb[i + 1], img.rgb[i + 2]];
  if (img.alpha) out.push(img.alpha[y * img.width + x]);
  return out;
}
const q = (v: number) => Math.round(v * 255) / 255;
const at = (file: string, p: readonly [number, number]) => pixel(file, p[0], p[1]);

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-eyes-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Stage 1: channels and over
// ---------------------------------------------------------------------------

// AE lays the capture's RGB over the comp background, so the numbers below
// are the ones measured live: half red over blue is (128, 0, 127) at alpha
// 128; over magenta it must be (255, 0, 127), over the light checkerboard
// square (230, 102, 102).

describe("channels: rgb (default)", () => {
  it("leaves the capture's colour as AE composited it over the comp background", async () => {
    const { res, isError } = await render({ time: 0 });
    expect(isError).toBe(false);
    const file = res.writtenTo as string;
    expect(colorType(file)).toBe(2);
    expect(at(file, EMPTY)).toEqual([0, 0, 1]);
    expect(at(file, HALF_RED)).toEqual([128 / 255, 0, 127 / 255]);
    expect(at(file, GREEN)).toEqual([0, 1, 0]);
    expect(res).toMatchObject({ channels: "rgb", over: "background", alphaChannel: "present" });
  });

  it("reports the comp background as bgColor, with no second key for it", async () => {
    const { res } = await render({ time: 0 });
    expect(res.bgColor).toEqual(BLUE);
    expect(res.backgroundColor).toBeUndefined();
  });

  it("does not darken soft edges on a black background (no second multiply by alpha)", async () => {
    const { res } = await render({ time: 0 }, ["ae-black-bg-rgba16.png"], [0, 0, 0]);
    expect(at(res.writtenTo, HALF_RED)).toEqual([128 / 255, 0, 0]);
  });

  it("leaves an opaque capture's values as they were", async () => {
    const { res } = await render({ time: 0 }, ["opaque-rgb16.png"]);
    expect(pixel(res.writtenTo, 5, 5)).toEqual([0.25, 0.5, 0.75].map(q));
    expect(res.alphaChannel).toBe("absent");
  });
});

describe("over", () => {
  it("takes the comp background out before laying the colour over a hex colour", async () => {
    const { res } = await render({ time: 0, over: "#ff00ff" });
    expect(at(res.writtenTo, EMPTY)).toEqual([1, 0, 1]);
    // colour·a + magenta·(1 − a) = (a + 1 − a, 0, 1 − a).
    expect(at(res.writtenTo, HALF_RED)).toEqual([1, 0, 127 / 255]);
    expect(at(res.writtenTo, GREEN)).toEqual([0, 1, 0]);
    expect(res.over).toEqual([1, 0, 1]);
  });

  it("gives the same result whatever background AE laid the capture over", async () => {
    const { res } = await render(
      { time: 0, over: "#ff00ff" },
      ["ae-black-bg-rgba16.png"],
      [0, 0, 0],
    );
    expect(at(res.writtenTo, HALF_RED)).toEqual([1, 0, 127 / 255]);
    expect(at(res.writtenTo, EMPTY)).toEqual([1, 0, 1]);
  });

  it("checkerboard shows transparency as light and dark squares", async () => {
    const { res } = await render({ time: 0, over: "checkerboard" });
    expect(pixel(res.writtenTo, 0, 0)).toEqual(CHECKERBOARD.light.map(q));
    expect(pixel(res.writtenTo, CHECKERBOARD.size, 0)).toEqual(CHECKERBOARD.dark.map(q));
    // Half red over the light square: (a + 0.8·(1 − a), 0.8·(1 − a), 0.8·(1 − a)).
    expect(at(res.writtenTo, HALF_RED)).toEqual([230, 102, 102].map((v) => v / 255));
    expect(res.over).toBe("checkerboard");
  });

  it("accepts an [r, g, b] colour in 0..1", async () => {
    const { res } = await render({ time: 0, over: [1, 1, 1] });
    expect(at(res.writtenTo, EMPTY)).toEqual([1, 1, 1]);
    expect(at(res.writtenTo, HALF_RED)).toEqual([1, 127 / 255, 127 / 255]);
  });

  it("works on an 8-bit capture too", async () => {
    const { res } = await render({ time: 0, over: "#ff00ff" }, ["ae-blue-bg-rgba8.png"]);
    expect(at(res.writtenTo, HALF_RED)).toEqual([1, 0, 127 / 255]);
  });

  it("says so when the comp background colour is unknown, and treats it as black", async () => {
    const { res } = await render({ time: 0, over: "#ff00ff" }, ["ae-black-bg-rgba16.png"], null);
    expect(res.channelsWarning).toMatch(/background colour.*unknown/);
    expect(at(res.writtenTo, HALF_RED)).toEqual([1, 0, 127 / 255]);
  });

  it("warns that there was nothing to composite when the capture has no alpha", async () => {
    const { res } = await render({ time: 0, over: "checkerboard" }, ["opaque-rgb16.png"]);
    expect(res.alphaWarning).toMatch(/no alpha channel/);
    expect(pixel(res.writtenTo, 0, 0)).toEqual([0.25, 0.5, 0.75].map(q));
  });
});

describe("channels: rgba", () => {
  it("keeps the alpha channel and recovers the colour from under the comp background", async () => {
    const { res } = await render({ time: 0, channels: "rgba" });
    const file = res.writtenTo as string;
    expect(colorType(file)).toBe(6);
    // Straight colour, as PNG alpha means: the red solid itself, not red mixed with blue.
    expect(at(file, HALF_RED)).toEqual([1, 0, 0, A]);
    expect(at(file, GREEN)).toEqual([0, 1, 0, 1]);
    expect(at(file, EMPTY)).toEqual([0, 0, 0, 0]);
    expect(res.channels).toBe("rgba");
  });

  it("recovers the same colour from a black background", async () => {
    const { res } = await render(
      { time: 0, channels: "rgba" },
      ["ae-black-bg-rgba16.png"],
      [0, 0, 0],
    );
    expect(at(res.writtenTo, HALF_RED)).toEqual([1, 0, 0, A]);
  });

  it("warns when the capture had no alpha to keep", async () => {
    const { res } = await render({ time: 0, channels: "rgba" }, ["opaque-rgb16.png"]);
    expect(res.alphaWarning).toMatch(/no alpha channel/);
    expect(pixel(res.writtenTo, 0, 0)[3]).toBe(1);
  });
});

describe("channels: alpha", () => {
  it("writes the matte as greyscale: white where opaque, black where transparent", async () => {
    const { res } = await render({ time: 0, channels: "alpha" });
    const file = res.writtenTo as string;
    expect(colorType(file)).toBe(0);
    expect(at(file, EMPTY)).toEqual([0, 0, 0]);
    expect(at(file, GREEN)).toEqual([1, 1, 1]);
    expect(at(file, HALF_RED)[0]).toBeCloseTo(A, 6);
  });

  it("an 8-bit RGBA capture gives the same matte", async () => {
    const { res } = await render({ time: 0, channels: "alpha" }, ["ae-blue-bg-rgba8.png"]);
    expect(at(res.writtenTo, HALF_RED)[0]).toBeCloseTo(A, 6);
  });

  it("says plainly when the capture had no alpha channel at all", async () => {
    const { res, isError } = await render({ time: 0, channels: "alpha" }, ["opaque-rgb16.png"]);
    expect(isError).toBe(false);
    expect(res.alphaChannel).toBe("absent");
    expect(res.alphaWarning).toMatch(/no alpha channel.*all white/);
    expect(pixel(res.writtenTo, 0, 0)).toEqual([1, 1, 1]);
  });
});

describe("argument checks happen before After Effects is contacted", () => {
  const refused = [
    ["over with channels rgba", { time: 0, channels: "rgba", over: "checkerboard" }],
    ["over with channels alpha", { time: 0, channels: "alpha", over: "#000000" }],
    ["channels with colorManaged off", { time: 0, channels: "alpha", colorManaged: "off" }],
    ["over with colorManaged off", { time: 0, over: "checkerboard", colorManaged: "off" }],
    [
      "compare without times",
      { time: 0, sample: { regions: [{ name: "a", x: 0, y: 0 }] }, compare: {} },
    ],
    ["compare without sample", { times: [0, 1], compare: {} }],
    [
      "compare index out of range",
      { times: [0, 1], sample: { regions: [{ name: "a", x: 0, y: 0 }] }, compare: { to: 2 } },
    ],
    [
      "compare of a frame with itself",
      {
        times: [0, 1],
        sample: { regions: [{ name: "a", x: 0, y: 0 }] },
        compare: { from: 1, to: 1 },
      },
    ],
    [
      "duplicate region names",
      {
        time: 0,
        sample: {
          regions: [
            { name: "a", x: 0, y: 0 },
            { name: "a", x: 1, y: 1 },
          ],
        },
      },
    ],
    ["an empty isolate list", { time: 0, isolate: [] }],
  ] as const;
  for (const [what, args] of refused) {
    it(`refuses ${what}`, async () => {
      const { res, isError, transport } = await render(args as Record<string, unknown>);
      expect(isError).toBe(true);
      expect(res.error.code).toBe("INVALID_ARGS");
      expect(transport.calls).toHaveLength(0);
    });
  }

  it("refuses isolate in read-only mode, which must not touch layer switches", async () => {
    process.env.AE_MCP_READONLY = "1";
    try {
      const { res, isError, transport } = await render({ time: 0, isolate: "Him" });
      expect(isError).toBe(true);
      expect(res.error.code).toBe("FORBIDDEN");
      expect(transport.calls).toHaveLength(0);
    } finally {
      delete process.env.AE_MCP_READONLY;
    }
  });
});

describe("analyze and the contact sheet work with every channels option", () => {
  for (const channels of ["rgb", "rgba", "alpha"] as const) {
    it(`channels: ${channels}`, async () => {
      const { res, isError } = await render({
        times: [0, 0.5],
        channels,
        analyze: true,
        contactSheet: { thumbWidth: 32 },
      });
      expect(isError).toBe(false);
      expect(res.analysisWarning).toBeUndefined();
      expect(res.contactSheetWarning).toBeUndefined();
      // Analysis reads the capture, where the alpha channel still is.
      for (const f of res.frames) {
        expect(f.analysis.background.kind).toBe("transparent");
        expect(f.analysis.contentBounds).toEqual({ left: 8, top: 4, width: 16, height: 16 });
      }
      const sheetFile = res.contactSheet.writtenTo as string;
      expect(res.contactSheet.frames).toBe(2);
      expect(colorType(sheetFile)).toBe(2);
      // Tile 0's top-left pixel is empty (transparent in the capture).
      const screen = pixel(sheetFile, TILE_X, TILE_Y);
      if (channels === "rgb") expect(screen).toEqual(BLUE);
      if (channels === "alpha") expect(screen).toEqual([0, 0, 0]);
      // An RGBA file is shown on the sheet over the checkerboard.
      if (channels === "rgba") expect(screen).toEqual(CHECKERBOARD.light.map(q));
    });
  }

  it("colorManaged off: the raw capture is tiled as AE wrote it, over the comp background", async () => {
    const { res, isError } = await render({
      times: [0, 0.5],
      colorManaged: "off",
      contactSheet: { thumbWidth: 32 },
    });
    expect(isError).toBe(false);
    expect(pixel(res.contactSheet.writtenTo, TILE_X, TILE_Y)).toEqual(BLUE);
  });
});

/** Tile 0's top-left pixel on a sheet of 32-px tiles. */
const TILE_X = 8;
const TILE_Y = 8 + 7 * 2 + 6;

describe("over with times and a contact sheet", () => {
  it("applies the same background to every frame", async () => {
    const { res } = await render({ times: [0, 1], over: "#ff00ff" });
    for (const f of res.frames) expect(pixel(f.writtenTo, 0, 0)).toEqual([1, 0, 1]);
  });
});

// ---------------------------------------------------------------------------
// Stage 2: sample, histogram, compare
// ---------------------------------------------------------------------------

const REGIONS = [
  { name: "skin", x: 10, y: 6, width: 4, height: 4 },
  { name: "screen", x: 0, y: 0, width: 4, height: 4 },
  { name: "edge", x: 24, y: 10 },
];

const AE_REGIONS = [
  { name: "halfRed", x: 8, y: 4, width: 8, height: 8 },
  { name: "green", x: 16, y: 4, width: 8, height: 16 },
  { name: "empty", x: 0, y: 0, width: 4, height: 4 },
];

describe("sample", () => {
  it("measures each region on the capture (before conversion) and on the written file", async () => {
    const { res } = await render({ time: 0, sample: { regions: AE_REGIONS } });
    const [halfRed, green, empty] = res.samples;
    expect(halfRed.name).toBe("halfRed");
    // The capture's RGB is over the comp background, as AE wrote it.
    expect(halfRed.capture.mean).toEqual([0.502, 0, 0.498]);
    expect(halfRed.capture.alpha.mean).toBe(0.502);
    expect(empty.capture.mean).toEqual(BLUE);
    expect(empty.capture.alpha.transparentShare).toBe(1);
    expect(green.capture.mean).toEqual([0, 1, 0]);
    // The default rgb file is the same picture.
    expect(halfRed.output.meanHex).toBe("#80007f");
    expect(empty.output.mean).toEqual(BLUE);
    expect(empty.output.alpha).toBeNull();
  });

  it("says plainly that the capture's colour is laid over the comp background", async () => {
    const { res } = await render({ time: 0, sample: { regions: AE_REGIONS } });
    const capture = res.measurementStages.capture as string;
    expect(capture).toMatch(/before any colour conversion/);
    expect(capture).toMatch(/over the comp background colour \(`bgColor`\)/);
    expect(capture).not.toMatch(/straight alpha/);
    expect(res.measurementStages.output).toMatch(/file as written/);
    expect(res.measurementStages.output).toMatch(
      /'rgba'.*colour recovered from under the background/,
    );
  });

  it("with channels rgba, the output stage measures the colour without the background", async () => {
    const { res } = await render({ time: 0, channels: "rgba", sample: { regions: AE_REGIONS } });
    expect(res.samples[0].output.mean).toEqual([1, 0, 0]);
    expect(res.samples[0].output.alpha.mean).toBe(0.502);
  });

  it("can be limited to one stage", async () => {
    const { res } = await render({ time: 0, sample: { regions: AE_REGIONS, stage: "capture" } });
    expect(res.samples[0].capture).toBeDefined();
    expect(res.samples[0].output).toBeUndefined();
    expect(res.measurementStages.output).toBeUndefined();
  });

  it("reports per frame with times, and samples the matte itself with channels alpha", async () => {
    const { res } = await render({
      times: [0, 1],
      channels: "alpha",
      sample: { regions: AE_REGIONS },
    });
    for (const f of res.frames) {
      expect(f.samples[0].output.mean).toEqual([0.502, 0.502, 0.502]);
      expect(f.samples[1].output.mean).toEqual([1, 1, 1]);
      expect(f.samples[2].output.mean).toEqual([0, 0, 0]);
    }
    expect(res.samples).toBeUndefined();
  });

  it("names a region that falls outside the frame without failing the render", async () => {
    const { res, isError } = await render({
      time: 0,
      sample: { regions: [{ name: "off", x: 100, y: 100, width: 2, height: 2 }] },
    });
    expect(isError).toBe(false);
    expect(res.samples[0].capture.error).toMatch(/outside/);
  });
});

describe("histogram", () => {
  it("defaults to 32 bins on the written file", async () => {
    const { res } = await render({ time: 0, histogram: true }, ["opaque-rgb16.png"]);
    expect(res.histogram.stage).toBe("output");
    expect(res.histogram.bins).toBe(32);
    expect(res.histogram.r).toHaveLength(32);
    expect(res.histogram.r.reduce((a: number, b: number) => a + b, 0)).toBe(768);
  });

  it("can count the capture instead, alpha included", async () => {
    const { res } = await render({ times: [0], histogram: { bins: 4, stage: "capture" } });
    const h = res.frames[0].histogram;
    expect(h.stage).toBe("capture");
    // 576 empty pixels, 64 half covered (alpha 0.502), 128 opaque.
    expect(h.a).toEqual([576, 0, 64, 128]);
  });
});

describe("compare", () => {
  it("reports each region's difference between two rendered times, per stage", async () => {
    const { res, isError } = await render(
      { times: [0, 1], sample: { regions: REGIONS }, compare: {} },
      ["keyed-rgba16.png", "keyed-moved-rgba16.png"],
    );
    expect(isError).toBe(false);
    const c = res.comparison;
    expect(c.from).toEqual({ index: 0, time: 0 });
    expect(c.to).toEqual({ index: 1, time: 1 });
    const skin = c.regions.find((r: Structured) => r.name === "skin");
    expect(skin.capture.meanDelta[0]).toBeCloseTo(0.1, 4);
    expect(skin.capture.meanDelta[1]).toBeCloseTo(-0.1, 4);
    // 16-bit 0.9 and 0.8 land on 8-bit 230 and 204 in the written files.
    expect(skin.output.meanDelta[0]).toBeCloseTo((230 - 204) / 255, 4);
    const screen = c.regions.find((r: Structured) => r.name === "screen");
    expect(screen.output.maxAbsDelta).toEqual([0, 0, 0]);
  });

  it("takes explicit frame indices", async () => {
    const { res } = await render(
      { times: [0, 1, 2], sample: { regions: REGIONS }, compare: { from: 2, to: 0 } },
      ["keyed-rgba16.png", "keyed-rgba16.png", "keyed-moved-rgba16.png"],
    );
    expect(res.comparison.from).toEqual({ index: 2, time: 2 });
    expect(res.comparison.regions[0].capture.meanDelta[0]).toBeCloseTo(-0.1, 4);
  });
});

// ---------------------------------------------------------------------------
// Stage 3: edge (matte quality as numbers)
// ---------------------------------------------------------------------------

// 64×48 matte fixtures over a black comp background (layout in make-fixtures.mjs).
const BLACK_BG: Rgb = [0, 0, 0];
const MAGENTA_BG: Rgb = [0.8, 0.1, 0.6];

describe("edge", () => {
  it("reports matte quality for one frame, with the thresholds it used", async () => {
    const { res, isError } = await render(
      { time: 0, edge: true },
      ["matte-patch-rgba16.png"],
      BLACK_BG,
    );
    expect(isError).toBe(false);
    expect(res.edge.stage).toBe("capture");
    expect(res.edge.patches.count).toBe(1);
    expect(res.edge.width.typical).toBe(2);
    expect(res.edgeThresholds.maxEdgeWidth).toBe(4);
    expect(res.edgeThresholds.patchWindow).toBe(16);
    expect(res.edge.patches.list[0].thickest.thickness).toBeGreaterThan(10);
    expect(res.edge.patches.list[0].densest.pixels).toBeGreaterThan(0);
    expect(res.edgeThresholds.opaque).toBeCloseTo(1 - 2 / 255, 6);
    expect(res.measurementStages.capture).toMatch(/before any colour conversion/);
    expect(res.edgeFlicker).toBeUndefined();
  });

  it("un-mattes the soft edge with the comp background before reading its colour", async () => {
    const { res } = await render({ time: 0, edge: true }, ["spill-magenta-rgba16.png"], MAGENTA_BG);
    expect(res.edge.spill.mean[1]).toBeCloseTo(0.7, 3);
    expect(res.edge.spill.leansToScreen).toBe(true);
    expect(res.edgeWarning).toBeUndefined();
  });

  it("says so when the comp background is unknown, and un-mattes as if it were black", async () => {
    const { res } = await render({ time: 0, edge: true }, ["spill-black-rgba16.png"], null);
    expect(res.edge.spill.leansToScreen).toBe(true);
    expect(res.edgeWarning).toMatch(/background colour \(bgColor\) is unknown/);
  });

  it("passes caller thresholds through", async () => {
    const { res } = await render(
      { time: 0, edge: { listed: 1, maxEdgeWidth: 40 } },
      ["matte-specks-rgba16.png"],
      BLACK_BG,
    );
    expect(res.edge.specks.count).toBe(3);
    expect(res.edge.specks.list).toHaveLength(1);
    expect(res.edgeThresholds.maxEdgeWidth).toBe(40);
    expect(res.edgeThresholds.listed).toBe(1);
  });

  it("with times: a report per frame, and flicker per pair and overall", async () => {
    const { res } = await render(
      { times: [0, 0.04, 0.08], edge: true },
      ["flicker-a-rgba16.png", "flicker-b-rgba16.png", "flicker-b-rgba16.png"],
      BLACK_BG,
    );
    expect(res.edge).toBeUndefined();
    expect(res.frames).toHaveLength(3);
    for (const f of res.frames) expect(f.edge.solidAreas.count).toBe(1);
    const { pairs, overall } = res.edgeFlicker;
    expect(pairs).toHaveLength(2);
    expect(pairs[0].from).toEqual({ index: 0, time: 0 });
    expect(pairs[0].to).toEqual({ index: 1, time: 0.04 });
    expect(pairs[0].edge.meanAbsDelta).toBeGreaterThan(0);
    expect(pairs[0].inside.meanAbsDelta).toBe(0);
    expect(pairs[1].edge.meanAbsDelta).toBe(0);
    expect(overall.edge.maxAbsDelta).toBeCloseTo(0.35, 3);
    expect(overall.edge.meanAbsDelta).toBeCloseTo(pairs[0].edge.meanAbsDelta / 2, 3);
    expect(overall.edge.worstPair).toEqual({ from: 0, to: 1 });
    expect(overall.inside.meanAbsDelta).toBe(0);
  });

  it("works on the raw capture with colorManaged off", async () => {
    const { res, isError } = await render(
      { time: 0, edge: true, colorManaged: "off" },
      ["matte-hole-rgba16.png"],
      BLACK_BG,
    );
    expect(isError).toBe(false);
    expect(res.edge.holes.count).toBe(2);
  });

  it("warns instead of measuring when the capture has no alpha channel", async () => {
    const { res, isError } = await render({ times: [0, 1], edge: true }, ["opaque-rgb16.png"]);
    expect(isError).toBe(false);
    expect(res.frames[0].edge).toBeUndefined();
    expect(res.edgeFlicker).toBeUndefined();
    expect(res.edgeWarning).toMatch(/no alpha channel/);
  });

  it("reads a Keylight matte view from luminance when asked", async () => {
    const { res, isError } = await render(
      { time: 0, edge: { from: "luma" } },
      ["matte-luma-rgba16.png"],
      BLACK_BG,
    );
    expect(isError).toBe(false);
    expect(res.edge.matteFrom).toBe("luma");
    expect(res.edge.patches.count).toBe(1);
    expect(res.edge.spill.mean).toBeNull();
    expect(res.edgeThresholds.from).toBe("luma");
    expect(res.edgeWarning).toBeUndefined();
  });

  it("measures from luminance even when the capture has no alpha channel", async () => {
    const { res } = await render({ times: [0, 1], edge: { from: "luma" } }, ["opaque-rgb16.png"]);
    expect(res.frames[0].edge.matteFrom).toBe("luma");
    expect(res.edgeFlicker.pairs).toHaveLength(1);
    expect(res.edgeWarning).toBeUndefined();
  });

  const refusedEdge = [
    ["transparent at or above opaque", { transparent: 0.5, opaque: 0.4 }],
    ["an alpha threshold outside 0..1", { opaque: 1.5 }],
    ["a zero maxEdgeWidth", { maxEdgeWidth: 0 }],
    ["an unknown screen colour", { screen: "red" }],
    ["a zero patchWindow", { patchWindow: 0 }],
    ["an unknown matte source", { from: "red" }],
  ] as const;
  for (const [what, edge] of refusedEdge) {
    it(`refuses ${what} before After Effects is contacted`, async () => {
      const { res, isError, transport } = await render({ time: 0, edge });
      expect(isError).toBe(true);
      expect(res.error.code).toBe("INVALID_ARGS");
      expect(transport.calls).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// Stage 6: screen (measuring the green screen in the un-keyed source)
// ---------------------------------------------------------------------------

// 96×64 opaque source renders (layout in make-fixtures.mjs).
describe("screen", () => {
  it("measures the screen in one frame, with the thresholds it used", async () => {
    const { res, isError } = await render({ time: 0, screen: true }, ["screen-uneven-rgba16.png"]);
    expect(isError).toBe(false);
    expect(res.screen.stage).toBe("capture");
    expect(res.screen.values).toBe("capture");
    expect(res.screen.screen).toBe("green");
    expect(res.screen.evenness.uneven).toBe(true);
    expect(res.screen.evenness.darkerSide).toEqual(["left"]);
    expect(res.screen.colour.nearSubject.colour[1]).toBeGreaterThan(res.screen.colour.median[1]);
    expect(res.screen.screenColourNote).toMatch(/Screen Colour/);
    expect(res.screenThresholds).toMatchObject({ columns: 6, rows: 4, minExcess: 0.04 });
    expect(res.measurementStages.capture).toBeDefined();
  });

  it("measures each frame with `times`", async () => {
    const { res } = await render({ times: [0, 1], screen: true }, [
      "screen-even-rgba16.png",
      "screen-blue-rgba16.png",
    ]);
    expect(res.screen).toBeUndefined();
    expect(res.frames[0].screen.screen).toBe("green");
    expect(res.frames[1].screen.screen).toBe("blue");
  });

  it("takes overrides", async () => {
    const { res } = await render({ time: 0, screen: { screen: "blue", columns: 2, rows: 2 } }, [
      "screen-even-rgba16.png",
    ]);
    expect(res.screen.screen).toBeNull();
    expect(res.screen.reading).toMatch(/no blue screen/);
    expect(res.screenThresholds).toMatchObject({ screen: "blue", columns: 2, rows: 2 });
  });

  it("works on the raw capture with colorManaged off, beside edge", async () => {
    const { res, isError } = await render(
      { time: 0, screen: true, edge: true, colorManaged: "off" },
      ["screen-even-rgba16.png"],
    );
    expect(isError).toBe(false);
    expect(res.screen.screen).toBe("green");
    expect(res.edge.shares.opaque).toBe(1);
  });

  it("measures a capture with no alpha channel as opaque", async () => {
    const { res } = await render({ time: 0, screen: true }, ["opaque-rgb16.png"]);
    // Every pixel is (0.25, 0.5, 0.75): blue leads by 0.25, a third of its level.
    expect(res.screen.measured).toBe(32 * 24);
    expect(res.screen.screen).toBe("blue");
  });

  const refusedScreen = [
    ["an unknown screen", { screen: "red" }],
    ["a zero-column grid", { columns: 0 }],
    ["a share outside 0..1", { minExcess: 1.5 }],
  ] as const;
  for (const [what, screen] of refusedScreen) {
    it(`refuses ${what} before After Effects is contacted`, async () => {
      const { res, isError, transport } = await render({ time: 0, screen });
      expect(isError).toBe(true);
      expect(res.error.code).toBe("INVALID_ARGS");
      expect(transport.calls).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// isolate: the generated JSX, run against a mock comp
// ---------------------------------------------------------------------------

interface MockLayer {
  index: number;
  id: number;
  name: string;
  enabled: boolean;
  solo: boolean;
  locked: boolean;
  matchName: string;
  source: null;
}

function mockLayer(index: number, name: string, extra: Partial<MockLayer> = {}): MockLayer {
  let enabled = extra.enabled ?? true;
  let solo = extra.solo ?? false;
  let locked = extra.locked ?? false;
  const layer = {
    index,
    id: 100 + index,
    name,
    matchName: extra.matchName ?? "ADBE AV Layer",
    source: null,
    get locked() {
      return locked;
    },
    set locked(v: boolean) {
      locked = v;
    },
    get enabled() {
      return enabled;
    },
    set enabled(v: boolean) {
      if (locked) throw new Error(`layer ${name} is locked`);
      enabled = v;
    },
    get solo() {
      return solo;
    },
    set solo(v: boolean) {
      if (locked) throw new Error(`layer ${name} is locked`);
      solo = v;
    },
  };
  return layer as MockLayer;
}

/** Generated JSX for `args`, captured from a recording transport. */
async function jsxFor(args: Record<string, unknown>): Promise<string> {
  const transport = fakeAe(["keyed-rgba16.png"]);
  await renderFrameTool.handler(
    { compNameOrId: "Main", time: 0, outPath: path.join(dir, "f.png"), ...args } as never,
    transport,
  );
  return transport.calls[0].code;
}

function runJsx(
  code: string,
  layers: MockLayer[],
  save: (layers: MockLayer[]) => void = () => {},
  ensureParentDir: (p: string) => { fsName: string } = (p) => ({ fsName: p }),
): Record<string, any> {
  const comp = {
    id: 1,
    name: "Main",
    numLayers: layers.length,
    displayStartTime: 0,
    frameDuration: 1 / 30,
    bgColor: [0.1, 0.2, 0.3],
    layer: (i: number) => layers[i - 1],
    saveFrameToPng: () => save(layers),
  };
  class CompItem {}
  class FootageItem {}
  const AE = {
    findCompByNameOrId: () => comp,
    safeGet: (fn: () => unknown, fallback: unknown) => {
      try {
        return fn();
      } catch {
        return fallback;
      }
    },
    ensureParentDir,
    errText: (e: unknown) => (e instanceof Error ? e.message : String(e)),
    findLayerInComp: (c: typeof comp, ref: unknown) => {
      if (ref !== null && typeof ref === "object")
        return layers.find((l) => l.id === (ref as { id: number }).id) ?? null;
      if (typeof ref === "number") return layers[ref - 1] ?? null;
      return layers.find((l) => l.name === ref) ?? null;
    },
  };
  const app = { project: { workingSpace: "None", bitsPerChannel: 8, file: null } };
  const fn = new Function("app", "AE", "CompItem", "FootageItem", code);
  return fn(app, AE, CompItem, FootageItem) as Record<string, any>;
}

const state = (layers: MockLayer[]) =>
  layers.map((l) => ({ name: l.name, enabled: l.enabled, solo: l.solo, locked: l.locked }));

function stack(): MockLayer[] {
  return [
    mockLayer(1, "Title"),
    mockLayer(2, "Camera", { matchName: "ADBE Camera Layer" }),
    mockLayer(3, "Matte", { enabled: false }),
    mockLayer(4, "Him", { solo: true }),
    mockLayer(5, "Grade"),
    mockLayer(6, "Plate", { locked: true }),
    mockLayer(7, "Key light", { matchName: "ADBE Light Layer", enabled: false }),
  ];
}

describe("isolate", () => {
  it("renders only the named layers, keeps cameras and lights, then restores every switch", async () => {
    const layers = stack();
    const before = state(layers);
    let during: ReturnType<typeof state> = [];
    const out = runJsx(await jsxFor({ isolate: ["Him", 3] }), layers, (l) => {
      during = state(l);
    });
    expect(out.ok).toBe(true);
    const on = (name: string) => during.find((l) => l.name === name)!.enabled;
    expect(on("Him")).toBe(true);
    expect(on("Matte")).toBe(true); // a disabled layer named in isolate is shown
    expect(on("Title")).toBe(false);
    expect(on("Grade")).toBe(false);
    expect(on("Plate")).toBe(false); // locked, still switched off
    expect(on("Camera")).toBe(true);
    expect(on("Key light")).toBe(false); // left exactly as it was
    expect(during.every((l) => l.solo === false)).toBe(true);
    expect(state(layers)).toEqual(before);
    expect(out.isolation).toMatchObject({
      layers: [
        { index: 4, name: "Him" },
        { index: 3, name: "Matte" },
      ],
      restored: true,
    });
  });

  it("leaves audio-only layers alone: they have no picture, and their video switch may refuse", async () => {
    const layers = stack();
    const music = mockLayer(8, "Music");
    Object.defineProperty(music, "hasVideo", { value: false });
    Object.defineProperty(music, "enabled", {
      get: () => true,
      set: () => {
        throw new Error("audio-only layer has no video switch");
      },
    });
    layers.push(music);
    const out = runJsx(await jsxFor({ isolate: "Him" }), layers);
    expect(out.ok).toBe(true);
    expect(out.isolation.restored).toBe(true);
  });

  it("accepts a single layer by stable id", async () => {
    const layers = stack();
    let during: ReturnType<typeof state> = [];
    const out = runJsx(await jsxFor({ isolate: { id: 105 } }), layers, (l) => {
      during = state(l);
    });
    expect(out.ok).toBe(true);
    expect(during.filter((l) => l.enabled).map((l) => l.name)).toEqual(["Camera", "Grade"]);
  });

  it("restores every layer when the render throws", async () => {
    const layers = stack();
    const before = state(layers);
    const out = runJsx(await jsxFor({ isolate: "Him" }), layers, undefined, () => {
      throw new Error("disk full");
    });
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/disk full/);
    expect(out.isolation.restored).toBe(true);
    expect(state(layers)).toEqual(before);
  });

  it("restores every layer when saveFrameToPng itself fails", async () => {
    const layers = stack();
    const before = state(layers);
    const out = runJsx(await jsxFor({ isolate: "Him" }), layers, () => {
      throw new Error("render error");
    });
    expect(out.ok).toBe(false);
    expect(state(layers)).toEqual(before);
  });

  it("refuses a layer that is not in the comp before changing anything", async () => {
    const layers = stack();
    const before = state(layers);
    let rendered = false;
    const out = runJsx(await jsxFor({ isolate: ["Him", "Nobody"] }), layers, () => {
      rendered = true;
    });
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/no layer matching "Nobody"/);
    expect(rendered).toBe(false);
    expect(state(layers)).toEqual(before);
  });

  it("returns the comp background colour the default rgb output composites over", async () => {
    const out = runJsx(await jsxFor({}), stack());
    expect(out.bgColor).toEqual([0.1, 0.2, 0.3]);
    expect(out.isolation).toBeUndefined();
  });
});

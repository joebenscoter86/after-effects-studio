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
const BG: [number, number, number] = [0.1, 0.2, 0.3];

interface FakeTransport extends AeTransport {
  calls: EvalRequest[];
}

/** Fake AE: writes fixtures[i] to the i-th requested path; reports a None working space. */
function fakeAe(fixtures: string[]): FakeTransport {
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
          bgColor: BG,
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
  fixtures: string[] = ["keyed-rgba16.png"],
): Promise<{ res: Structured; isError: boolean; transport: FakeTransport }> {
  const transport = fakeAe(fixtures);
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

describe("channels: rgb (default)", () => {
  it("composites transparency over the comp background and writes 8-bit RGB", async () => {
    const { res, isError } = await render({ time: 0 });
    expect(isError).toBe(false);
    const file = res.writtenTo as string;
    expect(colorType(file)).toBe(2);
    expect(pixel(file, 0, 0)).toEqual(BG.map(q));
    expect(pixel(file, 12, 10)).toEqual([0.8, 0.6, 0.5].map(q));
    const edge = pixel(file, 24, 10);
    expect(edge[0]).toBeCloseTo(q(0.5 * 0.8 + 0.5 * BG[0]), 6);
    expect(res).toMatchObject({ channels: "rgb", over: "background", alphaChannel: "present" });
  });

  it("leaves an opaque capture's values as they were", async () => {
    const { res } = await render({ time: 0 }, ["opaque-rgb16.png"]);
    expect(pixel(res.writtenTo, 5, 5)).toEqual([0.25, 0.5, 0.75].map(q));
    expect(res.alphaChannel).toBe("absent");
  });
});

describe("over", () => {
  it("checkerboard shows transparency as light and dark squares", async () => {
    const { res } = await render({ time: 0, over: "checkerboard" });
    expect(pixel(res.writtenTo, 0, 0)).toEqual(CHECKERBOARD.light.map(q));
    expect(pixel(res.writtenTo, CHECKERBOARD.size, 0)).toEqual(CHECKERBOARD.dark.map(q));
    expect(pixel(res.writtenTo, 12, 10)).toEqual([0.8, 0.6, 0.5].map(q));
    expect(res.over).toBe("checkerboard");
  });

  it("accepts a hex colour, such as magenta to show a matte's holes", async () => {
    const { res } = await render({ time: 0, over: "#ff00ff" });
    expect(pixel(res.writtenTo, 0, 0)).toEqual([1, 0, 1]);
    // Half-covered edge, from the fixture's exact 16-bit values.
    const a = 32768 / 65535;
    const edge = pixel(res.writtenTo, 24, 10);
    expect(edge[0]).toBeCloseTo(q((52428 / 65535) * a + 1 * (1 - a)), 6);
    expect(edge[1]).toBeCloseTo(q((39321 / 65535) * a), 6);
    expect(res.over).toEqual([1, 0, 1]);
  });

  it("accepts an [r, g, b] colour in 0..1", async () => {
    const { res } = await render({ time: 0, over: [0, 0, 1] });
    expect(pixel(res.writtenTo, 0, 0)).toEqual([0, 0, 1]);
  });

  it("warns that there was nothing to composite when the capture has no alpha", async () => {
    const { res } = await render({ time: 0, over: "checkerboard" }, ["opaque-rgb16.png"]);
    expect(res.alphaWarning).toMatch(/no alpha channel/);
    expect(pixel(res.writtenTo, 0, 0)).toEqual([0.25, 0.5, 0.75].map(q));
  });
});

describe("channels: rgba", () => {
  it("keeps the alpha channel and the straight RGB under it", async () => {
    const { res } = await render({ time: 0, channels: "rgba" });
    const file = res.writtenTo as string;
    expect(colorType(file)).toBe(6);
    expect(pixel(file, 0, 0)).toEqual([0, 1, 0, 0]);
    expect(pixel(file, 24, 10)[3]).toBeCloseTo(128 / 255, 6);
    expect(pixel(file, 12, 10)).toEqual([...[0.8, 0.6, 0.5].map(q), 1]);
    expect(res.channels).toBe("rgba");
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
    expect(pixel(file, 0, 0)).toEqual([0, 0, 0]);
    expect(pixel(file, 12, 10)).toEqual([1, 1, 1]);
    expect(pixel(file, 24, 10)[0]).toBeCloseTo(128 / 255, 6);
  });

  it("an 8-bit RGBA capture gives the same matte", async () => {
    const { res } = await render({ time: 0, channels: "alpha" }, ["keyed-rgba8.png"]);
    expect(pixel(res.writtenTo, 24, 10)[0]).toBeCloseTo(128 / 255, 6);
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
        expect(f.analysis.contentBounds).toEqual({ left: 8, top: 4, width: 17, height: 16 });
      }
      const sheetFile = res.contactSheet.writtenTo as string;
      expect(res.contactSheet.frames).toBe(2);
      expect(colorType(sheetFile)).toBe(2);
      // Tile 0's top-left pixel is screen (transparent in the capture).
      const tileX = 8;
      const tileY = 8 + 7 * 2 + 6;
      const screen = pixel(sheetFile, tileX, tileY);
      if (channels === "rgb") expect(screen).toEqual(BG.map(q));
      if (channels === "alpha") expect(screen).toEqual([0, 0, 0]);
      // An RGBA file is shown on the sheet over the checkerboard, never as
      // its raw green.
      if (channels === "rgba") expect(screen).toEqual(CHECKERBOARD.light.map(q));
    });
  }
});

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

describe("sample", () => {
  it("measures each region on the capture (before conversion) and on the written file", async () => {
    const { res } = await render({ time: 0, sample: { regions: REGIONS } });
    expect(res.measurementStages.capture).toMatch(/before any colour conversion/);
    expect(res.measurementStages.output).toMatch(/file as written/);
    const [skin, screen, edge] = res.samples;
    expect(skin.name).toBe("skin");
    expect(skin.capture.mean[0]).toBeCloseTo(0.8, 4);
    expect(skin.output.mean[0]).toBeCloseTo(q(0.8), 4);
    // Under alpha 0 the capture still holds the screen's green; the output
    // shows what the default rgb file shows: the comp background.
    expect(screen.capture.mean).toEqual([0, 1, 0]);
    expect(screen.capture.alpha.transparentShare).toBe(1);
    expect(screen.output.mean[2]).toBeCloseTo(q(BG[2]), 4);
    expect(screen.output.alpha).toBeNull();
    expect(edge.capture.alpha.mean).toBeCloseTo(0.5, 4);
    expect(skin.output.meanHex).toBe("#cc9980");
  });

  it("can be limited to one stage", async () => {
    const { res } = await render({ time: 0, sample: { regions: REGIONS, stage: "capture" } });
    expect(res.samples[0].capture).toBeDefined();
    expect(res.samples[0].output).toBeUndefined();
    expect(res.measurementStages.output).toBeUndefined();
  });

  it("reports per frame with times, and samples the matte itself with channels alpha", async () => {
    const { res } = await render({
      times: [0, 1],
      channels: "alpha",
      sample: { regions: REGIONS },
    });
    for (const f of res.frames) {
      expect(f.samples[0].output.mean).toEqual([1, 1, 1]);
      expect(f.samples[1].output.mean).toEqual([0, 0, 0]);
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
    expect(h.a).toEqual([496, 0, 16, 256]);
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

// ae_check_comp (finish plan, stage 1) through the real tool handler, with an
// in-process fake transport: nothing here can reach After Effects. The fake
// answers the three scripts by label: the plan (a 1080x1920 comp at 30 fps),
// the captures (it writes a synthetic PNG for each requested frame, at the
// asked size or, to stand in for a saveFrameToPng that ignores
// resolutionFactor, at full size) and the structure read (a canned payload).
//
// The capture and structure scripts themselves run at the bottom against mock
// comps, to prove the resolution is put back when the script throws and that
// the bounds and expression walks report what they should.

import { existsSync, promises as fs, readFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { decodePng, encodePngSrgb8 } from "../src/color/png16.js";
import { checkCompTool } from "../src/tools/check-comp.js";
// @ts-expect-error: a plain .mjs module without types (the eval's scene, shared with its setup script)
import { FINISH } from "../../evals/picture/scenes.mjs";
import { captureJsx, structureJsx } from "../src/tools/check-comp-jsx.js";
import type { AeTransport, EvalRequest, EvalResult } from "../src/transport/AeTransport.js";

const CW = 1080;
const CH = 1920;
const FPS = 30;

type Rgb = [number, number, number];
interface Seed {
  flash?: number;
  frozen?: [number, number];
  clip?: [number, number];
}

/** The scene at frame k, w×h (any size: geometry is in comp pixels scaled down). */
function scene(k: number, w: number, h: number, seed: Seed): Float64Array {
  const s = w / CW;
  const rgb = new Float64Array(w * h * 3);
  if (seed.flash === k) return rgb.fill(1);
  const kk = seed.frozen && k >= seed.frozen[0] && k <= seed.frozen[1] ? seed.frozen[0] : k;
  for (let y = 0; y < h; y++) {
    const v = 0.3 + (0.2 * y) / h;
    rgb.fill(v, y * w * 3, (y + 1) * w * 3);
  }
  const box = (x0: number, y0: number, bw: number, bh: number, c: Rgb) => {
    for (let y = Math.round(y0 * s); y < Math.round((y0 + bh) * s); y++)
      for (let x = Math.round(x0 * s); x < Math.round((x0 + bw) * s); x++) {
        const i = (y * w + x) * 3;
        rgb[i] = c[0];
        rgb[i + 1] = c[1];
        rgb[i + 2] = c[2];
      }
  };
  box(80 + 12 * kk, 800, 160, 160, [0.85, 0.8, 0.75]);
  if (seed.clip && k >= seed.clip[0] && k <= seed.clip[1]) box(600, 1200, 120, 120, [1, 1, 1]);
  return rgb;
}

interface Fake extends AeTransport {
  calls: EvalRequest[];
  labels: () => string[];
}

const NO_STRUCTURE = {
  ok: true,
  bounds: { layersChecked: 1, samples: 20, total: 0, findings: [], skipped: [] },
  fonts: { ok: true, count: 0, fonts: [] },
  footage: { ok: true, count: 0, items: [] },
  nestedCompIds: [1],
  expressions: { compsWalked: 1, propertiesVisited: 40, total: 0, truncated: false, errors: [] },
};

function fakeAe(opts: {
  frames: number;
  seed?: Seed;
  honourFactor?: boolean;
  structure?: unknown;
  missingFootage?: unknown[];
  paint?: (k: number, w: number, h: number) => Float64Array;
}): Fake {
  const calls: EvalRequest[] = [];
  const ok = (result: unknown): EvalResult => ({
    ok: true,
    result,
    error: null,
    errorCode: null,
    stack: null,
    logs: [],
    durationMs: 0,
  });
  return {
    calls,
    labels: () => calls.map((c) => c.label ?? ""),
    async execute(req) {
      calls.push(req);
      if (req.label === "check_comp_plan") {
        return ok({
          ok: true,
          compName: "Main",
          compId: 1,
          width: CW,
          height: CH,
          frameDuration: 1 / FPS,
          duration: opts.frames / FPS,
          workAreaStart: 0,
          workAreaDuration: opts.frames / FPS,
          displayStartTime: 0,
          resolutionFactor: [1, 1],
          workingSpace: "None",
          bitsPerChannel: 8,
          missingFootage: opts.missingFootage ?? [],
        });
      }
      if (req.label === "check_comp_capture") {
        const frames = JSON.parse(/var _frameNums = (.*);/.exec(req.code)![1]) as number[];
        const paths = JSON.parse(/var _paths = (.*);/.exec(req.code)![1]) as string[];
        const factor = JSON.parse(/var _factor = (.*);/.exec(req.code)![1]) as number | null;
        const d = opts.honourFactor === false || factor === null ? 1 : factor;
        const w = Math.round(CW / d);
        const h = Math.round(CH / d);
        const out = [];
        for (const [i, k] of frames.entries()) {
          await fs.mkdir(path.dirname(paths[i]), { recursive: true });
          await fs.writeFile(paths[i], encodePngSrgb8(w, h, opts.paint ? opts.paint(k, w, h) : scene(k, w, h, opts.seed ?? {})));
          out.push({ ok: true, frame: k, writtenTo: paths[i], time: (k + 0.25) / FPS, captureKind: "direct" });
        }
        return ok({
          ok: true,
          frames: out,
          captureKind: "direct",
          resolution: { asked: factor, before: [1, 1], set: factor !== null && factor !== 1, restored: true },
          workingSpace: "None",
          bitsPerChannel: 8,
          projectFile: null,
          bgColor: [0, 0, 0],
        });
      }
      if (req.label === "check_comp_structure") return ok(opts.structure ?? NO_STRUCTURE);
      return { ...ok(null), ok: false, error: `unexpected call ${req.label}` };
    },
  };
}

type Structured = Record<string, any>;
async function check(args: Record<string, unknown>, transport: Fake) {
  const out = await checkCompTool.handler(
    { compNameOrId: "Main", outDir: dir, ...args } as never,
    transport,
  );
  const sc = out.structuredContent as Structured;
  return { res: out.isError ? sc : (sc.result as Structured), isError: out.isError === true };
}

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-check-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

const SEEDED: Seed = { flash: 20, frozen: [40, 59], clip: [70, 75] };
const OFF_FRAME = {
  ...NO_STRUCTURE,
  bounds: {
    layersChecked: 1,
    samples: 30,
    total: 1,
    skipped: [],
    findings: [
      {
        index: 2,
        name: "Title",
        type: "text",
        edge: "right",
        from: 1,
        to: 1.5,
        byPx: 240.5,
        extent: "partly",
        at: 1.5,
        box: { x: 700, y: 900, width: 620.5, height: 80 },
        via: "sourcePointToComp",
      },
    ],
  },
};

describe("ae_check_comp: one call over a seeded comp", () => {
  it("finds the flash, the frozen stretch, the clipped highlight and the off-frame title at their frames", async () => {
    const ae = fakeAe({ frames: 90, seed: SEEDED, structure: OFF_FRAME });
    const { res, isError } = await check({}, ae);
    expect(isError).toBe(false);
    expect(res.next).toBeNull();
    expect(res.checked.frames).toBe(90);
    expect(res.flags.filter((f: any) => f.kind === "pop").map((f: any) => f.frame)).toEqual([20]);
    const frozen = res.stretches.filter((s: any) => s.kind === "frozen");
    expect(frozen.map((s: any) => [s.from.frame, s.to.frame])).toEqual([[40, 59]]);
    expect(frozen[0].seconds).toBeCloseTo(20 / 30, 6);
    const clipped = res.stretches.filter((s: any) => s.kind === "clipped-high");
    // The flash frame is white, so it is clipped too.
    expect(clipped.map((s: any) => [s.from.frame, s.to.frame])).toEqual([
      [20, 20],
      [70, 75],
    ]);
    expect(clipped[1].box).toEqual({ x: 600, y: 1200, width: 120, height: 120 });
    const off = res.structure.offFrame.findings;
    expect(off).toHaveLength(1);
    expect(off[0]).toMatchObject({ edge: "right", byPx: 240.5, extent: "partly" });
    expect(off[0].from).toEqual({ time: 1, frame: 30 });
    expect(off[0].to).toEqual({ time: 1.5, frame: 45 });
    expect(res.counts.flags.pop).toBe(1);
    // The reduced size took effect and is reported.
    expect(res.capture.measuredSize).toEqual([270, 480]);
    expect(res.capture.capturedSize).toEqual([270, 480]);
    expect(res.capture.resolutionFactor).toMatch(/^honoured/);
    expect(res.capture.stage).toBe("output");
    expect(res.thresholds.frozenSeconds).toBe(0.5);
    expect(res.timings.framesCaptured).toBe(90);
    expect(res.timings.framesPerSecond).toBeGreaterThan(0);
  });

  it("writes one contact sheet of the flagged moments, keeps only its frames and deletes every other capture", async () => {
    const ae = fakeAe({ frames: 90, seed: SEEDED, structure: OFF_FRAME });
    const { res } = await check({}, ae);
    const sheet = res.sheet;
    expect(sheet.writtenTo).toMatch(/check-sheet-0-89\.png$/);
    expect(existsSync(sheet.writtenTo)).toBe(true);
    const frames = sheet.frames.map((f: any) => f.frame);
    expect(frames).toEqual(expect.arrayContaining([20, 40, 70, 30]));
    const kinds = Object.fromEntries(sheet.frames.map((f: any) => [f.frame, f.kinds.join("+")]));
    expect(kinds[20]).toMatch(/pop/);
    expect(kinds[40]).toBe("frozen");
    // The off-frame tile is the finding's first sampled time (1 s, frame 30), not worstAt (1.5 s).
    expect(kinds[30]).toBe("off-right");
    const offTile = sheet.frames.find((f: any) => f.frame === 30);
    expect(offTile.why.join(" ")).toMatch(/first sampled time past the right edge \(1 s\)/);
    const files = (await fs.readdir(dir)).sort();
    expect(files).toEqual(
      [path.basename(sheet.writtenTo), ...frames.map((k: number) => `frame-${k}.png`)].sort(),
    );
    const img = decodePng(readFileSync(sheet.writtenTo));
    expect(img.width).toBeGreaterThan(270);
  });
});

describe("ae_check_comp: a clean comp", () => {
  it("returns empty lists and no sheet, and leaves nothing behind", async () => {
    const ae = fakeAe({ frames: 60 });
    const { res } = await check({}, ae);
    expect(res.flags).toEqual([]);
    expect(res.stretches).toEqual([]);
    expect(res.structure.checked).toBe(true);
    expect(res.structure.offFrame.findings).toEqual([]);
    expect(res.sheet).toBeNull();
    expect(res.counts).toEqual({ flags: {}, stretches: {} });
    expect(await fs.readdir(dir).catch(() => [])).toEqual([]);
  });
});

describe("ae_check_comp: bounded calls", () => {
  it("caps the frames per call, captures in chunks and says where to continue", async () => {
    const ae = fakeAe({ frames: 90, seed: SEEDED, structure: OFF_FRAME });
    const first = await check({ maxFrames: 40, chunkFrames: 16 }, ae);
    expect(first.res.checked.from.frame).toBe(0);
    expect(first.res.checked.to.frame).toBe(39);
    expect(first.res.checked.frames).toBe(40);
    // 40 owned + 4 frames of look-ahead, in chunks of 16.
    expect(ae.labels().filter((l) => l === "check_comp_capture").length).toBeGreaterThanOrEqual(3);
    expect(first.res.next).toEqual({ startFrame: 40, time: 1.333333, framesLeft: 50 });
    expect(ae.labels()).not.toContain("check_comp_structure");
    expect(first.res.structure.checked).toBe(false);
    expect(first.res.flags.map((f: any) => `${f.kind}@${f.frame}`)).toContain("pop@20");

    const second = await check({ maxFrames: 40, chunkFrames: 16, startFrame: 40 }, ae);
    expect(second.res.checked.from.frame).toBe(40);
    expect(second.res.checked.to.frame).toBe(79);
    expect(second.res.checked.contextFrames.before).toBeGreaterThan(3);
    // The pop belongs to the first call; the frozen stretch and the clip to the second.
    expect(second.res.flags.some((f: any) => f.kind === "pop")).toBe(false);
    expect(
      second.res.stretches.filter((s: any) => s.kind === "frozen").map((s: any) => [s.from.frame, s.to.frame]),
    ).toEqual([[40, 59]]);
    expect(second.res.next.startFrame).toBe(80);

    const third = await check({ maxFrames: 40, chunkFrames: 16, startFrame: 80 }, ae);
    expect(third.res.next).toBeNull();
    expect(third.res.structure.checked).toBe(true);
    expect(ae.labels().filter((l) => l === "check_comp_structure")).toHaveLength(1);
  });

  it("with every 2: half the frames, and the notes say a pop can be missed", async () => {
    const ae = fakeAe({ frames: 60, seed: { flash: 21 } });
    const { res } = await check({ every: 2 }, ae);
    expect(res.step).toBe(2);
    expect(res.checked.frames).toBe(30);
    expect(res.flags).toEqual([]);
    expect(res.notes.join(" ")).toMatch(/one-frame pop .*missed/);
  });
});

describe("ae_check_comp: range", () => {
  it("clamps the range to the comp's duration (After Effects writes frames past the end without an error)", async () => {
    const ae = fakeAe({ frames: 30 });
    const { res } = await check({ from: 0, to: 10, sheet: false, structure: false }, ae);
    expect(res.range.to.frame).toBe(29);
    const asked = ae.calls
      .filter((c) => c.label === "check_comp_capture")
      .flatMap((c) => JSON.parse(/var _frameNums = (.*);/.exec(c.code)![1]) as number[]);
    expect(Math.max(...asked)).toBe(29);
  });

  it("says the project is left marked as changed when the resolution was set", async () => {
    const ae = fakeAe({ frames: 10 });
    const { res } = await check({ sheet: false, structure: false }, ae);
    expect(res.notes.join(" ")).toMatch(/marks the project as changed/);
  });
});

describe("ae_check_comp: capture size", () => {
  it("works when saveFrameToPng ignores the reduced size: says so and shrinks in Node", async () => {
    const ae = fakeAe({ frames: 12, seed: { flash: 5 }, honourFactor: false });
    const { res } = await check({ sheet: false, structure: false }, ae);
    expect(res.capture.capturedSize).toEqual([1080, 1920]);
    expect(res.capture.measuredSize).toEqual([270, 480]);
    expect(res.capture.resolutionFactor).toMatch(/^not honoured.*1080×1920.*270×480/);
    expect(res.flags.map((f: any) => `${f.kind}@${f.frame}`)).toEqual(["pop@5"]);
  }, 30_000);

  it("asks for the downsample factor in the capture script", async () => {
    const ae = fakeAe({ frames: 6 });
    await check({ downsample: 2, sheet: false, structure: false }, ae);
    const code = ae.calls.find((c) => c.label === "check_comp_capture")!.code;
    expect(code).toMatch(/var _factor = 2;/);
  });
});

describe("ae_check_comp: missing footage and arguments", () => {
  it("captures nothing when the comp's footage is missing, and still reads the structure", async () => {
    const ae = fakeAe({ frames: 30, missingFootage: [{ id: 9, name: "plate.mov", path: "/x/plate.mov" }] });
    const { res } = await check({}, ae);
    expect(res.picture.checked).toBe(false);
    expect(ae.labels()).not.toContain("check_comp_capture");
    expect(res.structure.checked).toBe(true);
    expect(res.missingFootage).toHaveLength(1);
  });

  it("rejects a safe area with both percent and px, and a bad threshold", async () => {
    const ae = fakeAe({ frames: 30 });
    expect((await check({ safeArea: { percent: 5, px: 10 } }, ae)).isError).toBe(true);
    const bad = await check({ thresholds: { frozenSeconds: 0 } }, ae);
    expect(bad.isError).toBe(true);
    expect(JSON.stringify(bad.res)).toMatch(/frozenSeconds/);
    expect(ae.calls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// The scripts themselves, against mock comps
// ---------------------------------------------------------------------------

const AE_HELPERS = {
  safeGet: (fn: () => unknown, fallback: unknown) => {
    try {
      return fn();
    } catch {
      return fallback;
    }
  },
  errText: (e: unknown) => (e instanceof Error ? e.message : String(e)),
  valueToJson: (v: unknown) => v,
};

describe("capture script: the comp's resolution", () => {
  function run(code: string, comp: Record<string, any>, ensureParentDir: (p: string) => unknown) {
    const AE = { ...AE_HELPERS, findCompByNameOrId: () => comp, ensureParentDir };
    const app = { project: { workingSpace: "None", bitsPerChannel: 8, file: null } };
    return new Function("app", "AE", code)(app, AE) as Record<string, any>;
  }
  function mockComp() {
    const seen: number[][] = [];
    const comp: Record<string, any> = {
      name: "Main",
      frameDuration: 1 / 30,
      bgColor: [0, 0, 0],
      resolutionFactor: [1, 1],
      saveFrameToPng: () => seen.push([...comp.resolutionFactor]),
    };
    return { comp, seen };
  }

  it("sets the asked factor for the captures and puts the old one back", () => {
    const { comp, seen } = mockComp();
    const out = run(captureJsx("Main", [0, 1], ["/a/0.png", "/a/1.png"], 4, false), comp, (p) => ({ fsName: p }));
    expect(out.ok).toBe(true);
    expect(seen).toEqual([
      [4, 4],
      [4, 4],
    ]);
    expect(comp.resolutionFactor).toEqual([1, 1]);
    expect(out.resolution).toMatchObject({ asked: 4, before: [1, 1], set: true, restored: true });
    expect(out.frames.map((f: any) => f.frame)).toEqual([0, 1]);
  });

  it("puts the factor back when the script throws part way", () => {
    const { comp, seen } = mockComp();
    let n = 0;
    const out = run(captureJsx("Main", [0, 1, 2], ["/a/0.png", "/a/1.png", "/a/2.png"], 4, false), comp, (p) => {
      if (++n === 2) throw new Error("disk full");
      return { fsName: p };
    });
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/disk full/);
    expect(seen).toEqual([[4, 4]]);
    expect(comp.resolutionFactor).toEqual([1, 1]);
    expect(out.resolution.restored).toBe(true);
  });

  it("captures at the comp's own size when the factor cannot be set, and touches nothing with factor null", () => {
    const { comp, seen } = mockComp();
    Object.defineProperty(comp, "resolutionFactor", {
      get: () => [2, 2],
      set: () => {
        throw new Error("read only here");
      },
    });
    const out = run(captureJsx("Main", [0], ["/a/0.png"], 4, false), comp, (p) => ({ fsName: p }));
    expect(out.ok).toBe(true);
    expect(out.resolution.set).toBe(false);
    expect(out.resolution.setError).toMatch(/read only/);
    expect(seen).toEqual([[2, 2]]);

    const plain = mockComp();
    const untouched = run(captureJsx("Main", [0], ["/a/0.png"], null, false), plain.comp, (p) => ({ fsName: p }));
    expect(untouched.resolution.set).toBe(false);
    expect(plain.seen).toEqual([[1, 1]]);
  });
});

describe("structure script", () => {
  class TextLayer {}
  class ShapeLayer {}
  class AVLayer {}
  class CompItem {}
  class FootageItem {}
  const PropertyType = { PROPERTY: 6212, INDEXED_GROUP: 6213, NAMED_GROUP: 6214 };

  function prop(name: string, extra: Record<string, unknown> = {}) {
    return { name, propertyType: PropertyType.PROPERTY, numKeys: 0, canSetExpression: true, expressionEnabled: false, expression: "", expressionError: "", ...extra };
  }
  function group(name: string, props: any[]) {
    return {
      name,
      propertyType: PropertyType.NAMED_GROUP,
      numProperties: props.length,
      property: (i: number | string) => (typeof i === "number" ? props[i - 1] : props.find((p) => p.matchName === i || p.name === i)),
    };
  }

  function run(code: string, comp: Record<string, any>) {
    const AE = { ...AE_HELPERS, findCompByNameOrId: () => comp };
    const app = { fonts: { missingOrSubstitutedFonts: [{ postScriptName: "Gone-Bold", familyName: "Gone", styleName: "Bold" }] }, project: { numItems: 0, item: () => null } };
    return new Function("app", "AE", "TextLayer", "ShapeLayer", "AVLayer", "CompItem", "FootageItem", "PropertyType", code)(
      app, AE, TextLayer, ShapeLayer, AVLayer, CompItem, FootageItem, PropertyType,
    ) as Record<string, any>;
  }

  /** A comp with a title sliding right (left edge 300 + 600 t px) and a nested comp holding a broken expression. */
  function mockComp() {
    const comp: Record<string, any> = { name: "Main", id: 1, width: 1080, height: 1920, frameDuration: 1 / 30, time: 0.5 };
    const opacity = { ...prop("Opacity"), matchName: "ADBE Opacity", valueAtTime: () => 100 };
    const position = { ...prop("Position", { numKeys: 2, keyTime: (k: number) => [0, 2][k - 1], expressionEnabled: true, expression: "wiggle(", expressionError: "Error: wiggle needs two arguments" }), matchName: "ADBE Position" };
    const transform = { ...group("Transform", [position, opacity]), matchName: "ADBE Transform Group" };
    const title = Object.assign(new TextLayer(), {
      index: 1, enabled: true, inPoint: 0, outPoint: 2,
      ...group("Title", [transform]),
      property: (i: number | string) => (i === 1 || i === "ADBE Transform Group" ? transform : undefined),
      sourceRectAtTime: () => ({ left: 0, top: -50, width: 400, height: 60 }),
      sourcePointToComp: (p: number[]) => [p[0] + 300 + 600 * comp.time, p[1] + 960],
    });
    const inner = Object.assign(new TextLayer(), {
      index: 1, enabled: true, inPoint: 0, outPoint: 2,
      ...group("Inner", [prop("Source Text", { expressionEnabled: true, expression: "thisComp.layer('x')", expressionError: "Error: layer 'x' not found" })]),
    });
    const nested = Object.assign(new CompItem(), { id: 2, name: "Nested", numLayers: 1, layer: () => inner });
    const pre = Object.assign(new AVLayer(), {
      index: 2, enabled: true, inPoint: 0, outPoint: 2, source: nested,
      ...group("Nested", []),
    });
    comp.numLayers = 2;
    comp.layer = (i: number) => [title, pre][i - 1];
    return comp;
  }

  const OPTS = { from: 0, to: 2, step: 0.1, margins: [0, 0, 0, 0] as [number, number, number, number], boundsOf: "text" as const, maxSamples: 400, maxItems: 20, maxProperties: 50000 };

  it("reports the title past the right edge while visible: when, by how much, partly then wholly", () => {
    const comp = mockComp();
    const out = run(structureJsx("Main", OPTS), comp);
    expect(out.ok).toBe(true);
    expect(out.bounds.layersChecked).toBe(1);
    expect(out.bounds.findings).toHaveLength(1);
    const f = out.bounds.findings[0];
    expect(f).toMatchObject({ name: "Title", type: "text", edge: "right", extent: "wholly" });
    // Right edge 700 + 600 t passes 1080 after t = 0.633: the first sample past it is 0.7.
    expect(f.from).toBeCloseTo(0.7, 6);
    expect(f.to).toBeCloseTo(1.9, 6);
    expect(f.byPx).toBeCloseTo(700 + 600 * 1.9 - 1080, 1);
    expect(comp.time).toBe(0.5);
  });

  it("measures against a safe area when one is given", () => {
    const out = run(structureJsx("Main", { ...OPTS, margins: [54, 96, 54, 96] }), mockComp());
    // Right edge of the safe area at 1026: 700 + 600 t > 1026 after t = 0.543.
    expect(out.bounds.findings[0].from).toBeCloseTo(0.6, 6);
  });

  it("finds expressions in error in the comp and in nested comps, and lists missing fonts", () => {
    const out = run(structureJsx("Main", OPTS), mockComp());
    expect(out.expressions.total).toBe(2);
    expect(out.expressions.compsWalked).toBe(2);
    expect(out.expressions.errors.map((e: any) => `${e.comp}/${e.layer}/${e.property}`)).toEqual([
      "Main/Title/Transform > Position",
      "Nested/Inner/Source Text",
    ]);
    expect(out.fonts).toMatchObject({ ok: true, count: 1 });
  });
});

// ---------------------------------------------------------------------------
// The eval's two comps (plugin/evals/picture: FINISH), modelled in Node
// ---------------------------------------------------------------------------

/**
 * A picture of FINISH at frame k, drawn the way the setup script builds it:
 * background, the moving dot, the title as a filled box (its text is not
 * drawn: the bounds check is the structure script's), the feathered glare
 * as a linear ramp, the flash.
 */
function finishFrame(kind: "seeded" | "clean", k: number, w: number, h: number): Float64Array {
  const F = FINISH;
  const s = w / F.width;
  const rgb = new Float64Array(w * h * 3);
  if (kind === "seeded" && k === F.flash.frame) return rgb.fill(1);
  for (let p = 0; p < w * h; p++) rgb.set(F.bg, p * 3);
  const last = F.frames - 1;
  const v = (F.dot.toX - F.dot.fromX) / last;
  let x = F.dot.fromX + v * k;
  if (kind === "seeded") {
    const { fromFrame: f0, toFrame: f1 } = F.frozen;
    x = k <= f0 ? F.dot.fromX + v * k : k <= f1 ? F.dot.fromX + v * f0 : F.dot.fromX + v * f0 + v * (k - f1);
  }
  const fill = (cx: number, cy: number, bw: number, bh: number, c: number[]) => {
    for (let y = Math.max(0, Math.round((cy - bh / 2) * s)); y < Math.min(h, Math.round((cy + bh / 2) * s)); y++)
      for (let xx = Math.max(0, Math.round((cx - bw / 2) * s)); xx < Math.min(w, Math.round((cx + bw / 2) * s)); xx++)
        rgb.set(c, (y * w + xx) * 3);
  };
  fill(x, F.dot.y, F.dot.size, F.dot.size, F.dot.colour);
  const T = F.title;
  let tx = T.x;
  if (kind === "seeded" && k > T.moveFromFrame)
    tx = k >= T.moveToFrame ? T.toX : T.x + ((T.toX - T.x) * (k - T.moveFromFrame)) / (T.moveToFrame - T.moveFromFrame);
  fill(tx, T.y - T.fontSize / 3, 540, T.fontSize * 0.75, T.colour);
  const G = F.glare;
  if (kind === "seeded" && k >= G.fromFrame && k <= G.toFrame) {
    for (let y = 0; y < h; y++)
      for (let xx = 0; xx < w; xx++) {
        const d = Math.hypot(xx / s - G.centre[0], y / s - G.centre[1]);
        const a = Math.max(0, Math.min(1, (G.radius - d) / G.feather + 0.5));
        if (a <= 0) continue;
        const i = (y * w + xx) * 3;
        for (let c = 0; c < 3; c++) rgb[i + c] = rgb[i + c] * (1 - a) + G.colour[c] * a;
      }
  }
  return rgb;
}

describe("ae_check_comp on a Node model of the eval's comps", () => {
  it("finds the seeded flash, frozen stretch and clipped glare at the scene's frames", async () => {
    const ae = fakeAe({ frames: FINISH.frames, paint: (k, w, h) => finishFrame("seeded", k, w, h) });
    const { res } = await check({ structure: false }, ae);
    const fps = FINISH.fps;
    expect(res.flags.filter((f: any) => f.kind === "pop").map((f: any) => f.frame)).toEqual([FINISH.flash.frame]);
    expect(res.stretches.filter((s: any) => s.kind === "frozen").map((s: any) => [s.from.frame, s.to.frame])).toEqual([
      [FINISH.frozen.fromFrame, FINISH.frozen.toFrame],
    ]);
    const clip = res.stretches.filter((s: any) => s.kind === "clipped-high").map((s: any) => [s.from.frame, s.to.frame]);
    expect(clip).toEqual([
      [FINISH.flash.frame, FINISH.flash.frame],
      [FINISH.glare.fromFrame, FINISH.glare.toFrame],
    ]);
    expect(res.stretches.find((s: any) => s.kind === "frozen").from.time).toBeCloseTo(FINISH.frozen.fromFrame / fps, 5);
  }, 30_000);

  it("returns nothing for the clean comp", async () => {
    const ae = fakeAe({ frames: FINISH.frames, paint: (k, w, h) => finishFrame("clean", k, w, h) });
    const { res } = await check({ structure: false }, ae);
    expect(res.flags).toEqual([]);
    expect(res.stretches).toEqual([]);
    expect(res.sheet).toBeNull();
  }, 30_000);
});

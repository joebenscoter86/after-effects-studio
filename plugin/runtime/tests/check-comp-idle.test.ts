// ae_check_comp's idle-layer report (0.4.1, spec item 4): any layer on screen
// longer than `idleSeconds` with nothing changing on it is listed under
// structure.idle. It is a report, never a fault.
//
// Through the real tool handler with an in-process fake transport: nothing
// here can reach After Effects. The fake answers the plan, writes a small
// moving picture for each capture, and runs the REAL structure script (the
// generated JSX) against a mock comp, so both halves of the report, the
// change times read in After Effects and the gaps worked out in Node, are
// the code that ships.

import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { encodePngSrgb8 } from "../src/color/png16.js";
import { checkCompTool } from "../src/tools/check-comp.js";
import type { AeTransport, EvalResult } from "../src/transport/AeTransport.js";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const W = 108;
const H = 192;
const FPS = 30;
const DURATION = 12;

class TextLayer {}
class ShapeLayer {}
class AVLayer {}
class CameraLayer {}
class LightLayer {}
class CompItem {}
class FootageItem {}
class SolidSource {}
class FileSource {}
const PropertyType = { PROPERTY: 6212, INDEXED_GROUP: 6213, NAMED_GROUP: 6214 };

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

function prop(matchName: string, extra: Record<string, unknown> = {}) {
  const keys = (extra.keys as number[] | undefined) ?? [];
  return {
    name: matchName,
    matchName,
    propertyType: PropertyType.PROPERTY,
    numKeys: keys.length,
    keyTime: (k: number) => keys[k - 1],
    canSetExpression: true,
    expressionEnabled: extra.expression !== undefined,
    expression: (extra.expression as string | undefined) ?? "",
    expressionError: "",
    valueAtTime: () => (extra.value as unknown) ?? 100,
  };
}

function group(name: string, props: Any[]) {
  return {
    name,
    matchName: name,
    propertyType: PropertyType.NAMED_GROUP,
    numProperties: props.length,
    property: (i: number | string) =>
      typeof i === "number" ? props[i - 1] : props.find((p) => p.matchName === i || p.name === i),
  };
}

interface LayerSpec {
  kind?: "shape" | "text" | "av" | "camera" | "light";
  name: string;
  inPoint?: number;
  outPoint?: number;
  startTime?: number;
  stretch?: number;
  keys?: number[];
  expression?: string;
  markers?: number[];
  parent?: Any;
  source?: Any;
  nullLayer?: boolean;
  adjustmentLayer?: boolean;
  guideLayer?: boolean;
  enabled?: boolean;
  timeRemap?: number[];
  /** The layer's box in comp pixels, for the full-frame test (default: a small bar). */
  box?: [number, number, number, number];
}

function layer(s: LayerSpec): Any {
  const Cls = {
    shape: ShapeLayer,
    text: TextLayer,
    av: AVLayer,
    camera: CameraLayer,
    light: LightLayer,
  }[s.kind ?? "shape"];
  const position = prop("ADBE Position", {
    keys: s.keys,
    expression: s.expression,
    value: [50, 50],
  });
  const opacity = prop("ADBE Opacity", { value: 100 });
  const transform = group("ADBE Transform Group", [position, opacity]);
  const props: Any[] = [prop("ADBE Marker", { keys: s.markers })];
  if (s.timeRemap) props.push(prop("ADBE Time Remapping", { keys: s.timeRemap }));
  props.push(transform);
  const box = s.box ?? [10, 10, 60, 20];
  return Object.assign(new Cls(), {
    ...group(s.name, props),
    name: s.name,
    enabled: s.enabled ?? true,
    inPoint: s.inPoint ?? 0,
    outPoint: s.outPoint ?? DURATION,
    startTime: s.startTime ?? 0,
    stretch: s.stretch ?? 100,
    parent: s.parent ?? null,
    source: s.source ?? null,
    nullLayer: s.nullLayer ?? false,
    adjustmentLayer: s.adjustmentLayer ?? false,
    guideLayer: s.guideLayer ?? false,
    threeDLayer: false,
    timeRemapEnabled: s.timeRemap !== undefined,
    hasVideo: true,
    sourceRectAtTime: () => ({ left: 0, top: 0, width: box[2], height: box[3] }),
    sourcePointToComp: (p: number[]) => [p[0] + box[0], p[1] + box[1]],
  });
}

function compOf(name: string, layers: Any[], duration = DURATION): Any {
  layers.forEach((L, i) => (L.index = i + 1));
  return Object.assign(new CompItem(), {
    name,
    id: name === "Main" ? 1 : 2,
    width: W,
    height: H,
    frameDuration: 1 / FPS,
    duration,
    time: 0,
    numLayers: layers.length,
    layer: (i: number) => layers[i - 1],
  });
}

function runStructure(code: string, comp: Any) {
  const AE = { ...AE_HELPERS, findCompByNameOrId: () => comp };
  const app = {
    fonts: { missingOrSubstitutedFonts: [] },
    project: { numItems: 0, item: () => null },
  };
  return new Function(
    "app",
    "AE",
    "TextLayer",
    "ShapeLayer",
    "AVLayer",
    "CameraLayer",
    "LightLayer",
    "CompItem",
    "FootageItem",
    "SolidSource",
    "FileSource",
    "PropertyType",
    code,
  )(
    app,
    AE,
    TextLayer,
    ShapeLayer,
    AVLayer,
    CameraLayer,
    LightLayer,
    CompItem,
    FootageItem,
    SolidSource,
    FileSource,
    PropertyType,
  );
}

function fakeAe(comp: Any): AeTransport & { structureCode: () => string } {
  const ok = (result: unknown): EvalResult => ({
    ok: true,
    result,
    error: null,
    errorCode: null,
    stack: null,
    logs: [],
    durationMs: 0,
  });
  let structureCode = "";
  return {
    structureCode: () => structureCode,
    async execute(req) {
      if (req.label === "check_comp_plan") {
        return ok({
          ok: true,
          compName: "Main",
          compId: 1,
          width: W,
          height: H,
          frameDuration: 1 / FPS,
          duration: DURATION,
          workAreaStart: 0,
          workAreaDuration: DURATION,
          displayStartTime: 0,
          resolutionFactor: [1, 1],
          workingSpace: "None",
          colorManagementSystem: 0,
          bitsPerChannel: 8,
          missingFootage: [],
        });
      }
      if (req.label === "check_comp_capture") {
        const frames = JSON.parse(/var _frameNums = (.*);/.exec(req.code)![1]) as number[];
        const paths = JSON.parse(/var _paths = (.*);/.exec(req.code)![1]) as string[];
        const factor = JSON.parse(/var _factor = (.*);/.exec(req.code)![1]) as number | null;
        const d = factor ?? 1;
        const w = Math.round(W / d);
        const h = Math.round(H / d);
        const out = [];
        for (const [i, k] of frames.entries()) {
          const rgb = new Float64Array(w * h * 3).fill(0.4);
          for (let y = 0; y < h; y++) {
            const x = (k * 2) % w;
            rgb.fill(0.9, (y * w + x) * 3, (y * w + x + 1) * 3);
          }
          await fs.mkdir(path.dirname(paths[i]), { recursive: true });
          await fs.writeFile(paths[i], encodePngSrgb8(w, h, rgb));
          out.push({
            ok: true,
            frame: k,
            writtenTo: paths[i],
            time: (k + 0.25) / FPS,
            captureKind: "direct",
          });
        }
        return ok({
          ok: true,
          frames: out,
          captureKind: "direct",
          resolution: {
            asked: factor,
            before: [1, 1],
            set: factor !== null && factor !== 1,
            restored: true,
          },
          workingSpace: "None",
          bitsPerChannel: 8,
          projectFile: null,
          bgColor: [0, 0, 0],
        });
      }
      if (req.label === "check_comp_structure") {
        structureCode = req.code;
        return ok(runStructure(req.code, comp));
      }
      return { ...ok(null), ok: false, error: `unexpected call ${req.label}` };
    },
  };
}

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-check-idle-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

async function check(layers: Any[], args: Record<string, unknown> = {}) {
  const ae = fakeAe(compOf("Main", layers));
  const out = await checkCompTool.handler(
    { compNameOrId: "Main", outDir: dir, from: 0, to: 0.5, ...args } as never,
    ae,
  );
  const sc = out.structuredContent as Any;
  return {
    res: out.isError ? sc : sc.result,
    isError: out.isError === true,
    text: (out.content as Any)[0].text as string,
  };
}

/** The idle entries without their reading, for exact comparison. */
const entries = (res: Any) =>
  (res.structure.idle as Any[]).map(({ layer, index, from, to, seconds }) => ({
    layer,
    index,
    from,
    to,
    seconds,
  }));

describe("ae_check_comp idle report: a layer with nothing changing", () => {
  it("flags a shape on screen 0-12 s with no keys (the finish-line command bar)", async () => {
    const { res, isError } = await check([layer({ name: "Command bar" })]);
    expect(isError).toBe(false);
    expect(res.structure.checked).toBe(true);
    expect(entries(res)).toEqual([
      { layer: "Command bar", index: 1, from: 0, to: 12, seconds: 12 },
    ]);
  });

  it("respects the threshold: 15 s lists nothing", async () => {
    const { res } = await check([layer({ name: "Command bar" })], { idleSeconds: 15 });
    expect(res.structure.idle).toEqual([]);
  });

  it("keys at 0 and 4 s on a 0-12 s layer, threshold 3: one entry, 4-12", async () => {
    const { res } = await check([layer({ name: "Bar", keys: [0, 4] })], { idleSeconds: 3 });
    expect(entries(res)).toEqual([{ layer: "Bar", index: 1, from: 4, to: 12, seconds: 8 }]);
  });

  it("idleSeconds 0 turns the report off", async () => {
    const ae = fakeAe(compOf("Main", [layer({ name: "Bar" })]));
    const out = await checkCompTool.handler(
      { compNameOrId: "Main", outDir: dir, from: 0, to: 0.5, idleSeconds: 0 } as never,
      ae,
    );
    const res = (out.structuredContent as Any).result;
    expect(res.structure.idle).toEqual([]);
    expect(res.structure.idleReport.idleSeconds).toBe(0);
    expect(res.structure.idleReport.reading).toMatch(/off/);
    expect(ae.structureCode()).toMatch(/"idleSeconds":0/);
  });

  it("refuses a negative idleSeconds", async () => {
    const parsed = (await import("zod")).z
      .object(checkCompTool.inputShape as Any)
      .safeParse({ compNameOrId: "Main", idleSeconds: -1 });
    expect(parsed.success).toBe(false);
  });

  it("sorts entries by seconds, longest first", async () => {
    const { res } = await check([layer({ name: "Short", keys: [0, 4] }), layer({ name: "Long" })]);
    expect(entries(res).map((e: Any) => [e.layer, e.seconds])).toEqual([
      ["Long", 12],
      ["Short", 8],
    ]);
  });
});

describe("ae_check_comp idle report: what counts as a change", () => {
  it("a keyed parent: the child is not flagged", async () => {
    const parent = layer({ name: "Rig", nullLayer: true, keys: [0, 12] });
    const child = layer({ name: "Child", parent });
    const { res } = await check([child, parent]);
    expect(res.structure.idle).toEqual([]);
  });

  it("a marker at 6 s: the longest gap is 6 s, flagged at threshold 5 as 6-12", async () => {
    const { res } = await check([layer({ name: "Bar", markers: [6] })]);
    expect(entries(res)).toEqual([{ layer: "Bar", index: 1, from: 6, to: 12, seconds: 6 }]);
  });

  it("a wiggle() expression: not flagged", async () => {
    const { res } = await check([layer({ name: "Bar", expression: "wiggle(2, 10)" })]);
    expect(res.structure.idle).toEqual([]);
  });

  it("a plain value + [0,10] expression: flagged", async () => {
    const { res } = await check([layer({ name: "Bar", expression: "value + [0,10]" })]);
    expect(entries(res)).toEqual([{ layer: "Bar", index: 1, from: 0, to: 12, seconds: 12 }]);
  });

  it("a precomp with inner keys every 2 s: not flagged", async () => {
    const inner = compOf("Inner", [
      layer({ name: "Dot", keys: [0, 2] }),
      layer({ name: "Dot 2", keys: [4] }),
      layer({ name: "Dot 3", keys: [6, 8] }),
      layer({ name: "Dot 4", keys: [10, 12] }),
    ]);
    const pre = layer({ kind: "av", name: "Pre", source: inner });
    const { res } = await check([pre]);
    expect(res.structure.idle).toEqual([]);
  });

  it("RF-4: a precomp starting at 10 s with inner keys at 0-2 s maps them to 10-12 s, so 0-10 s is idle", async () => {
    const inner = compOf("Inner", [layer({ name: "Dot", keys: [0, 2] })]);
    const pre = layer({
      kind: "av",
      name: "Pre",
      source: inner,
      startTime: 10,
      inPoint: 0,
      outPoint: 12,
    });
    const { res } = await check([pre]);
    expect(entries(res)).toEqual([{ layer: "Pre", index: 1, from: 0, to: 10, seconds: 10 }]);
  });

  it("a precomp with keyed time remap counts as changing", async () => {
    const inner = compOf("Inner", [layer({ name: "Still" })]);
    const pre = layer({ kind: "av", name: "Pre", source: inner, timeRemap: [0, 1] });
    const { res } = await check([pre]);
    expect(res.structure.idle).toEqual([]);
  });
});

describe("ae_check_comp idle report: exempt layers", () => {
  const playing = () =>
    Object.assign(new FootageItem(), {
      name: "clip.mov",
      duration: 10,
      width: W,
      height: H,
      mainSource: Object.assign(new FileSource(), { isStill: false }),
    });
  const solid = () =>
    Object.assign(new FootageItem(), {
      name: "Ground",
      duration: 0,
      width: W,
      height: H,
      mainSource: Object.assign(new SolidSource(), { isStill: true }),
    });

  it("cameras, lights, nulls, adjustment and guide layers, playing footage and a full-frame bottom solid are never listed", async () => {
    const { res } = await check([
      layer({ kind: "camera", name: "Camera" }),
      layer({ kind: "light", name: "Light" }),
      layer({ name: "Null", nullLayer: true }),
      layer({ kind: "av", name: "Adjust", adjustmentLayer: true }),
      layer({ name: "Guide", guideLayer: true }),
      layer({ kind: "av", name: "Footage", source: playing() }),
      layer({ kind: "av", name: "Ground", source: solid(), box: [0, 0, W, H] }),
    ]);
    expect(res.structure.idle).toEqual([]);
    expect(res.structure.idleReport.exempt).toBe(7);
  });

  it("a full-frame solid with a non-exempt layer below it is not a ground: both are listed", async () => {
    const { res } = await check([
      layer({ kind: "av", name: "Panel", source: solid(), box: [0, 0, W, H] }),
      layer({ name: "Bar" }),
    ]);
    expect(entries(res).map((e: Any) => e.layer)).toEqual(["Panel", "Bar"]);
  });

  it("a solid that does not cover the frame is listed even at the bottom", async () => {
    const { res } = await check([layer({ kind: "av", name: "Chip", source: solid() })]);
    expect(entries(res).map((e: Any) => e.layer)).toEqual(["Chip"]);
  });
});

describe("ae_check_comp idle report: the on-screen span (RF-3)", () => {
  it("a layer on screen 0-3 s with no keys, threshold 5: not flagged", async () => {
    const { res } = await check([layer({ name: "Flash card", outPoint: 3 })]);
    expect(res.structure.idle).toEqual([]);
  });

  it("a layer with inPoint -4 and outPoint 8 is measured over 0-8 s", async () => {
    const { res } = await check([layer({ name: "Early", inPoint: -4, outPoint: 8 })]);
    expect(entries(res)).toEqual([{ layer: "Early", index: 1, from: 0, to: 8, seconds: 8 }]);
  });
});

describe("ae_check_comp idle report: a report, never a fault", () => {
  it("leaves counts, flags, stretches, off-frame findings and the sheet as they are without it", async () => {
    const withIdle = await check([layer({ name: "Bar" })]);
    const without = await check([layer({ name: "Bar" })], { idleSeconds: 0 });
    expect(withIdle.res.structure.idle).toHaveLength(1);
    expect(without.res.structure.idle).toEqual([]);
    expect(withIdle.res.counts).toEqual(without.res.counts);
    expect(withIdle.res.flags).toEqual(without.res.flags);
    expect(withIdle.res.stretches).toEqual(without.res.stretches);
    expect(withIdle.res.structure.offFrame).toEqual(without.res.structure.offFrame);
    expect(withIdle.res.sheet).toEqual(without.res.sheet);
    expect(withIdle.res.structure.idleReport.heading).toBe("Report (not faults)");
    expect(withIdle.text).toContain("Report (not faults)");
  });
});

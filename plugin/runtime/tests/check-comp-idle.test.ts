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
const KeyframeInterpolationType = { LINEAR: 6612, BEZIER: 6613, HOLD: 6614 };
const MaskMode = { NONE: 6812, ADD: 6813 };

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
  const hold = (extra.hold as number[] | undefined) ?? [];
  const valueAt = extra.valueAt as ((t: number) => unknown) | undefined;
  return {
    name: matchName,
    matchName,
    propertyType: PropertyType.PROPERTY,
    numKeys: keys.length,
    keyTime: (k: number) => keys[k - 1],
    canSetExpression: true,
    expressionEnabled: extra.expression !== undefined,
    expression: (extra.expression as string | undefined) ?? "",
    expressionError: (extra.expressionError as string | undefined) ?? "",
    keyOutInterpolationType: (k: number) =>
      hold.includes(k) ? KeyframeInterpolationType.HOLD : KeyframeInterpolationType.BEZIER,
    valueAtTime: (t: number) => (valueAt ? valueAt(t) : ((extra.value as unknown) ?? 100)),
  };
}

function group(name: string, props: Any[], enabled = true) {
  return {
    name,
    matchName: name,
    enabled,
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
  /** Hold-out key indices (1-based) on the position keys. */
  hold?: number[];
  /** Scale: keys and a value at time (default [100, 100] throughout). */
  scale?: { keys?: number[]; valueAt: (t: number) => number[] };
  /** Opacity: keys and a value at time (default 100 throughout). */
  opacity?: { keys?: number[]; valueAt: (t: number) => number };
  /** Property groups added to the layer (effects, masks, text, contents). */
  extra?: Any[];
  isTrackMatte?: boolean;
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
    hold: s.hold,
    expression: s.expression,
    value: [50, 50],
  });
  const scale = prop("ADBE Scale", {
    keys: s.scale?.keys,
    valueAt: s.scale?.valueAt ?? (() => [100, 100]),
  });
  const opacity = prop("ADBE Opacity", {
    keys: s.opacity?.keys,
    valueAt: s.opacity?.valueAt ?? (() => 100),
  });
  const transform = group("ADBE Transform Group", [position, scale, opacity]);
  const props: Any[] = [prop("ADBE Marker", { keys: s.markers })];
  if (s.timeRemap) props.push(prop("ADBE Time Remapping", { keys: s.timeRemap }));
  props.push(transform, ...(s.extra ?? []));
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
    isTrackMatte: s.isTrackMatte ?? false,
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
    "KeyframeInterpolationType",
    "MaskMode",
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
    KeyframeInterpolationType,
    MaskMode,
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

// Fix round 1 (task review and a live run on the proof comp).

const mask = (opts: { keys?: number[]; mode?: number; enabled?: boolean } = {}) =>
  Object.assign(
    group("ADBE Mask Atom", [prop("ADBE Mask Shape", { keys: opts.keys })], opts.enabled ?? true),
    { maskMode: opts.mode ?? MaskMode.ADD },
  );
const masks = (...m: Any[]) => group("ADBE Mask Parade", m);

describe("ae_check_comp idle report: a gap the viewer cannot see is not reported", () => {
  it("a layer held at scale 0 from 0 to 6.5 s before its first scale key: no entry for 0-6.5 s", async () => {
    const disc = layer({
      name: "Disc",
      scale: { keys: [6.5, 7], valueAt: (t) => (t < 6.5 ? [0, 0] : [100, 100]) },
      outPoint: 10,
    });
    const { res } = await check([disc]);
    expect(res.structure.idle).toEqual([]);
  });

  it("a scale-0 gap is skipped but a later visible gap is still found", async () => {
    const disc = layer({
      name: "Disc",
      scale: { keys: [6.5, 7], valueAt: (t) => (t < 6.5 ? [0, 0] : [100, 100]) },
    });
    const { res } = await check([disc], { idleSeconds: 3 });
    expect(entries(res)).toEqual([{ layer: "Disc", index: 1, from: 7, to: 12, seconds: 5 }]);
  });

  it("scale 0 on x alone hides the layer", async () => {
    const disc = layer({
      name: "Sliver",
      scale: { keys: [8, 9], valueAt: (t) => (t < 8 ? [0, 100] : [100, 100]) },
    });
    const { res } = await check([disc]);
    expect(res.structure.idle).toEqual([]);
  });

  it("an opacity-0 layer before a fade: no entry for the hidden part", async () => {
    const card = layer({
      name: "Card",
      opacity: { keys: [8, 9], valueAt: (t) => (t < 8 ? 0 : 100) },
    });
    const { res } = await check([card]);
    expect(res.structure.idle).toEqual([]);
  });

  it("a parent at scale 0 hides its child", async () => {
    const parent = layer({ name: "Rig", nullLayer: true, scale: { valueAt: () => [0, 0] } });
    const child = layer({ name: "Child", parent });
    const { res } = await check([child, parent]);
    expect(res.structure.idle).toEqual([]);
  });

  it("a visible layer at scale 265 is still reported", async () => {
    const big = layer({ name: "Big", scale: { valueAt: () => [265, 265] } });
    const { res } = await check([big]);
    expect(entries(res)).toEqual([{ layer: "Big", index: 1, from: 0, to: 12, seconds: 12 }]);
  });
});

describe("ae_check_comp idle report: fix round 1 change sources", () => {
  it("a parent's opacity keys do not move its child", async () => {
    const parent = layer({
      name: "Rig",
      nullLayer: true,
      opacity: { keys: [0, 12], valueAt: () => 100 },
    });
    const child = layer({ name: "Child", parent });
    const { res } = await check([child, parent]);
    expect(entries(res)).toEqual([{ layer: "Child", index: 1, from: 0, to: 12, seconds: 12 }]);
  });

  it("a hold key: the value is constant after it, so the gap counts", async () => {
    const { res } = await check([layer({ name: "Bar", keys: [0, 8], hold: [1] })]);
    expect(entries(res)).toEqual([{ layer: "Bar", index: 1, from: 0, to: 8, seconds: 8 }]);
  });

  it("without the hold the same keys move the layer 0-8 s", async () => {
    const { res } = await check([layer({ name: "Bar", keys: [0, 8] })]);
    expect(res.structure.idle).toEqual([]);
  });

  it("an expression in error is not time-driven", async () => {
    const broken = layer({ name: "Broken" });
    const pos = broken.property("ADBE Transform Group").property("ADBE Position");
    Object.assign(pos, {
      expressionEnabled: true,
      expression: "wiggle(2, time",
      expressionError: "SyntaxError: missing )",
    });
    const { res } = await check([broken]);
    expect(entries(res)).toEqual([{ layer: "Broken", index: 1, from: 0, to: 12, seconds: 12 }]);
  });

  it("a Source Text expression using time counts as always changing", async () => {
    const text = group("ADBE Text Properties", [
      prop("ADBE Text Document", { expression: 'Math.floor(time * 10) + ""' }),
    ]);
    const { res } = await check([layer({ kind: "text", name: "Counter", extra: [text] })]);
    expect(res.structure.idle).toEqual([]);
  });

  it("keys on a text animator count", async () => {
    const animators = group("ADBE Text Animators", [
      group("ADBE Text Animator", [
        group("ADBE Text Animator Properties", [prop("ADBE Text Opacity", { keys: [0, 12] })]),
      ]),
    ]);
    const { res } = await check([layer({ kind: "text", name: "Title", extra: [animators] })]);
    expect(res.structure.idle).toEqual([]);
  });

  it("keys on an effect count", async () => {
    const fx = group("ADBE Effect Parade", [
      group("ADBE Gaussian Blur 2", [prop("ADBE Gaussian Blur 2-0001", { keys: [0, 12] })]),
    ]);
    const { res } = await check([layer({ name: "Soft", extra: [fx] })]);
    expect(res.structure.idle).toEqual([]);
  });

  it("keys on a mask property count", async () => {
    const { res } = await check([layer({ name: "Wipe", extra: [masks(mask({ keys: [0, 12] }))] })]);
    expect(res.structure.idle).toEqual([]);
  });
});

describe("ae_check_comp idle report: keyless motion counts as always changing", () => {
  it("a text animator with a Wiggly Selector", async () => {
    const animators = group("ADBE Text Animators", [
      group("ADBE Text Animator", [
        group("ADBE Text Selectors", [
          group("ADBE Text Wiggly Selector", [prop("ADBE Text Wiggly Max Amount")]),
        ]),
      ]),
    ]);
    const { res } = await check([layer({ kind: "text", name: "Jitter", extra: [animators] })]);
    expect(res.structure.idle).toEqual([]);
  });

  it("a Wiggle Paths operator", async () => {
    const contents = group("ADBE Root Vectors Group", [
      group("ADBE Vector Filter - Roughen", [prop("ADBE Vector Roughen Size")]),
    ]);
    const { res } = await check([layer({ name: "Squiggle", extra: [contents] })]);
    expect(res.structure.idle).toEqual([]);
  });

  it("a Wiggle Transform operator", async () => {
    const contents = group("ADBE Root Vectors Group", [
      group("ADBE Vector Filter - Wiggler", [prop("ADBE Vector Wiggler Rotation")]),
    ]);
    const { res } = await check([layer({ name: "Shaky", extra: [contents] })]);
    expect(res.structure.idle).toEqual([]);
  });

  it("a disabled Wiggle Transform operator does not count", async () => {
    const contents = group("ADBE Root Vectors Group", [
      group("ADBE Vector Filter - Wiggler", [prop("ADBE Vector Wiggler Rotation")], false),
    ]);
    const { res } = await check([layer({ name: "Still", extra: [contents] })]);
    expect(entries(res).map((e: Any) => e.layer)).toEqual(["Still"]);
  });
});

describe("ae_check_comp idle report: fix round 1 precomps, grounds and the cap", () => {
  it("a disabled inner layer of a precomp, and its markers, do not count", async () => {
    const inner = compOf("Inner", [
      layer({ name: "Off", enabled: false, keys: [0, 12], markers: [6] }),
      layer({ name: "Still" }),
    ]);
    const pre = layer({ kind: "av", name: "Pre", source: inner });
    const { res } = await check([pre]);
    expect(entries(res)).toEqual([{ layer: "Pre", index: 1, from: 0, to: 12, seconds: 12 }]);
  });

  it("a disabled inner layer that is a track matte still counts", async () => {
    const inner = compOf("Inner", [
      layer({ name: "Matte", enabled: false, isTrackMatte: true, keys: [0, 12] }),
      layer({ name: "Fill" }),
    ]);
    const pre = layer({ kind: "av", name: "Pre", source: inner });
    const { res } = await check([pre]);
    expect(res.structure.idle).toEqual([]);
  });

  const solid = () =>
    Object.assign(new FootageItem(), {
      name: "Ground",
      duration: 0,
      width: W,
      height: H,
      mainSource: Object.assign(new SolidSource(), { isStill: true }),
    });

  it("a full-frame bottom solid with an enabled mask is a card, not a ground", async () => {
    const { res } = await check([
      layer({
        kind: "av",
        name: "Card",
        source: solid(),
        box: [0, 0, W, H],
        extra: [masks(mask())],
      }),
    ]);
    expect(entries(res).map((e: Any) => e.layer)).toEqual(["Card"]);
    expect(res.structure.idleReport.exempt).toBe(0);
  });

  it("a mask set to None, or switched off, leaves the solid a ground", async () => {
    const { res } = await check([
      layer({
        kind: "av",
        name: "Ground",
        source: solid(),
        box: [0, 0, W, H],
        extra: [masks(mask({ mode: MaskMode.NONE }), mask({ enabled: false }))],
      }),
    ]);
    expect(res.structure.idle).toEqual([]);
    expect(res.structure.idleReport.exempt).toBe(1);
  });

  it("caps structure.idle at 20 entries and marks the report truncated", async () => {
    const many = Array.from({ length: 23 }, (_, i) => layer({ name: `Bar ${i + 1}` }));
    const { res } = await check(many);
    expect(res.structure.idle).toHaveLength(20);
    expect(res.structure.idleReport.count).toBe(23);
    expect(res.structure.idleReport.truncated).toBe(true);
  });

  it("is not marked truncated under the cap", async () => {
    const { res } = await check([layer({ name: "Bar" })]);
    expect(res.structure.idleReport.truncated).toBeUndefined();
  });
});

describe("ae_check_comp idle report: the tool description", () => {
  it("names the idle report and idleSeconds in the Structure sentence", () => {
    const d = checkCompTool.description;
    const structure = d.slice(d.indexOf("Structure,"), d.indexOf("One contact sheet"));
    expect(structure).toMatch(/idle/);
    expect(structure).toContain("`idleSeconds`");
  });
});

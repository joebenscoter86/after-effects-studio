// Offline tests for agent-eyes stage 6, the keying kit operations: key.keylight,
// key.view, key.cleanup and mask.get.
//
// Nothing here reaches After Effects. As in effect-controls.test.ts, the real
// helpers.jsx is evaluated in Node and the generated operation bodies are run
// against fake objects shaped like the ExtendScript DOM. The effects' match
// names, defaults and ranges are the ones After Effects 2027 reported live
// (keying-kit-live-facts, 2026-11-10); the MaskMode numbers are stand-ins (the
// helpers compare against the enum, never against numbers).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { getOp, listOps } from "../src/registry.js";
import { validateOpArgs } from "../src/opschema.js";
// Importing the operation registry for its registration side effects.
import "../src/operations/index.js";

const HELPERS_SRC = readFileSync(
  fileURLToPath(new URL("../jsx/helpers.jsx", import.meta.url)),
  "utf8",
);

const PVT = {
  NO_VALUE: 6412,
  ThreeD_SPATIAL: 6413,
  ThreeD: 6414,
  TwoD_SPATIAL: 6415,
  TwoD: 6416,
  OneD: 6417,
  COLOR: 6418,
  CUSTOM_VALUE: 6419,
  MARKER: 6420,
  LAYER_INDEX: 6421,
  MASK_INDEX: 6422,
  SHAPE: 6423,
  TEXT_DOCUMENT: 6424,
} as const;
const PT = { PROPERTY: 6212, INDEXED_GROUP: 6213, NAMED_GROUP: 6214 } as const;
const KIT = { LINEAR: 6612, BEZIER: 6613, HOLD: 6614 } as const;
const MASK_MODE = {
  NONE: 6812,
  ADD: 6813,
  SUBTRACT: 6814,
  INTERSECT: 6815,
  LIGHTEN: 6816,
  DARKEN: 6817,
  DIFFERENCE: 6818,
};
const FALLOFF = { FFO_SMOOTH: 7212, FFO_LINEAR: 7213 };

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

function loadAE(): Any {
  return new Function(
    "PropertyValueType",
    "PropertyType",
    "KeyframeInterpolationType",
    "MaskMode",
    "MaskFeatherFalloff",
    `${HELPERS_SRC}\n;return AE;`,
  )(PVT, PT, KIT, MASK_MODE, FALLOFF);
}

// ------------------------------------------------------------------ fakes

interface PropSpec {
  name: string;
  matchName: string;
  type: keyof typeof PVT;
  value: unknown;
  min?: number;
  max?: number;
  canVaryOverTime?: boolean;
}

/** A leaf property whose setValue changes what it reads back, recording writes. */
function prop(spec: PropSpec): Any {
  const p: Any = {
    name: spec.name,
    matchName: spec.matchName,
    propertyType: PT.PROPERTY,
    propertyValueType: PVT[spec.type],
    value: spec.value,
    hasMin: spec.min !== undefined,
    minValue: spec.min ?? 0,
    hasMax: spec.max !== undefined,
    maxValue: spec.max ?? 0,
    unitsText: "",
    canVaryOverTime: spec.canVaryOverTime ?? true,
    numKeys: 0,
    canSetExpression: true,
    expressionEnabled: false,
    expression: "",
    writes: [] as unknown[],
  };
  p.setValue = (v: unknown) => {
    p.writes.push(v);
    p.value = v;
  };
  return p;
}

const WIDE = 3921568.62745098;
type Row = [string, string, keyof typeof PVT, unknown, number?, number?];

const KEYLIGHT_ROWS: Row[] = [
  ["View", "Keylight 906-0002", "OneD", 11, 1, 11],
  ["Unpremultiply Result", "Keylight 906-0003", "OneD", 1, 0, 1],
  ["Screen Colour", "Keylight 906-0004", "COLOR", [0, 0, 0, 1], -WIDE, WIDE],
  ["Screen Gain", "Keylight 906-0005", "OneD", 100, 0, 5000],
  ["Screen Balance", "Keylight 906-0006", "OneD", 50, 0, 100],
  ["Despill Bias", "Keylight 906-0007", "COLOR", [0.498, 0.498, 0.498, 1], -WIDE, WIDE],
  ["Alpha Bias", "Keylight 906-0008", "COLOR", [0.498, 0.498, 0.498, 1], -WIDE, WIDE],
  ["Lock Biases Together", "Keylight 906-0009", "OneD", 1, 0, 1],
  ["Screen Pre-blur", "Keylight 906-0010", "OneD", 0, 0, 5000],
  ["Clip Black", "Keylight 906-0012", "OneD", 0, 0, 100],
  ["Clip White", "Keylight 906-0013", "OneD", 100, 0, 100],
  ["Clip Rollback", "Keylight 906-0014", "OneD", 0, 0, 5000],
  ["Screen Shrink/Grow", "Keylight 906-0015", "OneD", 0, -5000, 5000],
  ["Screen Softness", "Keylight 906-0016", "OneD", 0, 0, 5000],
  ["Screen Despot Black", "Keylight 906-0017", "OneD", 0, 0, 5000],
  ["Screen Despot White", "Keylight 906-0018", "OneD", 0, 0, 5000],
];
const KEY_CLEANER_ROWS: Row[] = [
  ["Additional Edge Radius", "ADBE KeyCleaner-0006", "OneD", 10, 0, 250],
  ["Reduce Chatter", "ADBE KeyCleaner-0002", "OneD", 0, 0, 1],
  ["Alpha Contrast", "ADBE KeyCleaner-0016", "OneD", 0, 0, 100],
  ["Strength", "ADBE KeyCleaner-0001", "OneD", 100, 0, 100],
];
const SPILL_ROWS: Row[] = [
  ["Method", "ADBE Spill2-0001", "OneD", 1, 1, 2],
  ["Suppression", "ADBE Spill2-1001", "OneD", 100, 0, 100],
  ["Key Color", "ADBE Spill2-0003", "COLOR", [0, 1, 0, 1], -WIDE, WIDE],
  ["Tolerance", "ADBE Spill2-0004", "OneD", 50, 0, 100],
  ["Desaturate", "ADBE Spill2-0005", "OneD", 50, 0, 100],
  ["Spill Range", "ADBE Spill2-0006", "OneD", 50, 0, 100],
  ["Spill Color Correction", "ADBE Spill2-0007", "OneD", 50, 0, 100],
  ["Luma Correction", "ADBE Spill2-0008", "OneD", 0, 0, 100],
];
const EFFECTS: Record<string, [string, Row[]]> = {
  "Keylight 906": ["Keylight (1.2)", KEYLIGHT_ROWS],
  "ADBE KeyCleaner": ["Key Cleaner", KEY_CLEANER_ROWS],
  "ADBE Spill2": ["Advanced Spill Suppressor", SPILL_ROWS],
  "ADBE Gaussian Blur 2": [
    "Gaussian Blur",
    [["Blurriness", "ADBE Gaussian Blur 2-0001", "OneD", 0, 0, 3000]],
  ],
};

/** The layer's Effects group: effects can be added, moved and removed, and know their index. */
class Parade {
  list: Any[] = [];
  name = "Effects";
  matchName = "ADBE Effect Parade";
  get numProperties() {
    return this.list.length;
  }
  property(k: number | string) {
    if (typeof k === "number") {
      if (k < 1 || k > this.list.length) throw new Error(`index ${k} out of range`);
      return this.list[k - 1];
    }
    return this.list.find((e) => e.name === k || e.matchName === k) ?? null;
  }
  addProperty(matchName: string) {
    const fx = makeEffect(this, matchName);
    this.list.push(fx);
    return fx;
  }
}

function makeEffect(parade: Parade, matchName: string): Any {
  const spec = EFFECTS[matchName];
  if (!spec) throw new Error(`cannot add ${matchName}`);
  const children = spec[1].map(([name, mn, type, value, min, max]) =>
    prop({
      name,
      matchName: mn,
      type,
      value: Array.isArray(value) ? [...value] : value,
      min,
      max,
      canVaryOverTime: mn !== "Keylight 906-0002",
    }),
  );
  const fx: Any = {
    name: spec[0],
    matchName,
    propertyType: PT.INDEXED_GROUP,
    propertyValueType: PVT.NO_VALUE,
    enabled: true,
    children,
    get numProperties() {
      return children.length;
    },
    get propertyIndex() {
      return parade.list.indexOf(fx) + 1;
    },
    property(k: number | string) {
      if (typeof k === "number") return children[k - 1] ?? null;
      return children.find((c) => c.name === k || c.matchName === k) ?? null;
    },
    moveTo(n: number) {
      const i = parade.list.indexOf(fx);
      parade.list.splice(i, 1);
      parade.list.splice(n - 1, 0, fx);
    },
    remove() {
      parade.list.splice(parade.list.indexOf(fx), 1);
    },
  };
  return fx;
}

const valueOf = (fx: Any, matchName: string) => fx.property(matchName).value;

interface MaskSpec {
  name: string;
  mode: keyof typeof MASK_MODE;
  inverted?: boolean;
  feather?: [number, number];
  expansion?: number;
  opacity?: number;
  closed?: boolean;
  vertices: number[][];
  pathKeys?: number;
  featherKeys?: number;
}

function makeMask(spec: MaskSpec, index: number): Any {
  const shape = {
    closed: spec.closed ?? true,
    vertices: spec.vertices,
    inTangents: spec.vertices.map(() => [0, 0]),
    outTangents: spec.vertices.map(() => [0, 0]),
    featherSegLocs: [],
  };
  const later = { ...shape, vertices: spec.vertices.map(([x, y]) => [x + 10, y]) };
  const leaf = (name: string, matchName: string, value: unknown, numKeys = 0) => ({
    name,
    matchName,
    value,
    numKeys,
    valueAtTime: (t: number) => (t >= 1 && matchName === "ADBE Mask Shape" ? later : value),
  });
  const props = [
    leaf("Mask Path", "ADBE Mask Shape", shape, spec.pathKeys ?? 0),
    leaf("Mask Feather", "ADBE Mask Feather", spec.feather ?? [0, 0], spec.featherKeys ?? 0),
    leaf("Mask Opacity", "ADBE Mask Opacity", spec.opacity ?? 100),
    leaf("Mask Expansion", "ADBE Mask Offset", spec.expansion ?? 0),
  ];
  return {
    name: spec.name,
    matchName: "ADBE Mask Atom",
    propertyIndex: index,
    maskMode: MASK_MODE[spec.mode],
    inverted: spec.inverted ?? false,
    locked: false,
    maskFeatherFalloff: FALLOFF.FFO_SMOOTH,
    property(k: string) {
      return props.find((p) => p.name === k || p.matchName === k) ?? null;
    },
  };
}

interface Scene {
  parade: Parade;
  masks: Any[];
  layer: Any;
}

function scene(effects: string[] = [], masks: MaskSpec[] = []): Scene {
  const parade = new Parade();
  for (const mn of effects) parade.addProperty(mn);
  const maskObjs = masks.map((m, i) => makeMask(m, i + 1));
  const maskGroup = {
    name: "Masks",
    matchName: "ADBE Mask Parade",
    get numProperties() {
      return maskObjs.length;
    },
    property(k: number | string) {
      if (typeof k === "number") {
        if (k < 1 || k > maskObjs.length) throw new Error(`index ${k} out of range`);
        return maskObjs[k - 1];
      }
      return maskObjs.find((m) => m.name === k) ?? null;
    },
  };
  const layer = {
    name: "KEYED",
    property(k: string) {
      if (k === "Effects" || k === "ADBE Effect Parade") return parade;
      if (k === "Masks" || k === "ADBE Mask Parade") return maskGroup;
      return null;
    },
  };
  return { parade, masks: maskObjs, layer };
}

/** Run a generated operation body against the scene's layer. */
function run(name: string, args: Record<string, unknown>, s: Scene): Any {
  const op = getOp(name);
  if (!op) throw new Error(`no op ${name}`);
  const v = validateOpArgs(op, { comp: "Main", layer: 1, ...args });
  if (!v.ok) return { ok: false, validation: v };
  const AE = loadAE();
  AE.findCompByNameOrId = () => ({ numLayers: 1 });
  AE.findLayerInComp = () => s.layer;
  const body = op.toJsx(v.value);
  return new Function(
    "AE",
    "PropertyValueType",
    "PropertyType",
    "KeyframeInterpolationType",
    "MaskMode",
    "MaskFeatherFalloff",
    body,
  )(AE, PVT, PT, KIT, MASK_MODE, FALLOFF);
}

const order = (s: Scene) => s.parade.list.map((e) => e.matchName);

// ------------------------------------------------------------- registration

describe("registration", () => {
  it("registers the keying operations so ae_catalog lists them", () => {
    const names = listOps().map((o) => o.name);
    for (const n of ["key.keylight", "key.view", "key.cleanup", "mask.get"])
      expect(names).toContain(n);
    expect(
      listOps("key")
        .map((o) => o.name)
        .sort(),
    ).toEqual(["key.cleanup", "key.keylight", "key.view"]);
  });

  it("marks only mask.get read-only", () => {
    expect(getOp("mask.get")!.readOnly).toBe(true);
    for (const n of ["key.keylight", "key.view", "key.cleanup"])
      expect(getOp(n)!.readOnly).toBeFalsy();
  });

  it("documents Adobe's intended chain in key.cleanup and the view names in key.view", () => {
    expect(getOp("key.cleanup")!.description).toMatch(
      /Intermediate Result.*Key Cleaner.*Advanced Spill Suppressor/,
    );
    const viewDoc = getOp("key.view")!.params.find((p) => p.name === "view")!.description;
    for (const v of ["source", "screen_matte", "status", "intermediate_result", "final_result"])
      expect(viewDoc).toContain(v);
  });

  it("refuses unknown arguments through the schema", () => {
    const v = validateOpArgs(getOp("key.keylight")!, { comp: "Main", layer: 1, clipblack: 10 });
    expect(v.ok).toBe(false);
  });
});

// --------------------------------------------------------------- key.keylight

describe("key.keylight", () => {
  it("adds Keylight with the measured screen colour and reads every value back", () => {
    const s = scene();
    const res = run(
      "key.keylight",
      { screenColour: [0.31, 0.505, 0.35], screenGain: 124, clipBlack: 40, clipWhite: 76 },
      s,
    );

    expect(res.ok).toBe(true);
    expect(res.added).toBe(true);
    expect(res.effectIndex).toBe(1);
    expect(order(s)).toEqual(["Keylight 906"]);
    expect(res.values.screenColour.slice(0, 3)).toEqual([0.31, 0.505, 0.35]);
    expect(res.values).toMatchObject({
      screenGain: 124,
      clipBlack: 40,
      clipWhite: 76,
      screenBalance: 50,
      view: 11,
    });
    for (const key of [
      "screenPreBlur",
      "screenShrinkGrow",
      "screenSoftness",
      "despotBlack",
      "despotWhite",
      "despillBias",
      "alphaBias",
      "lockBiases",
      "clipRollback",
    ]) {
      expect(res.values).toHaveProperty(key);
    }
    expect(res.written.sort()).toEqual(["clipBlack", "clipWhite", "screenColour", "screenGain"]);
  });

  it("updates the Keylight already on the layer instead of adding another", () => {
    const s = scene(["ADBE Gaussian Blur 2", "Keylight 906"]);
    const res = run(
      "key.keylight",
      { screenShrinkGrow: -0.6, screenSoftness: 0.6, screenPreBlur: 0.5, despotBlack: 2 },
      s,
    );

    expect(res.ok).toBe(true);
    expect(res.added).toBe(false);
    expect(res.effectIndex).toBe(2);
    expect(order(s)).toEqual(["ADBE Gaussian Blur 2", "Keylight 906"]);
    expect(res.values).toMatchObject({
      screenShrinkGrow: -0.6,
      screenSoftness: 0.6,
      screenPreBlur: 0.5,
      despotBlack: 2,
    });
  });

  it("needs a screen colour to add a new Keylight, and says how to measure one", () => {
    const s = scene();
    const res = run("key.keylight", { clipBlack: 10 }, s);

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/no Keylight/);
    expect(res.error).toMatch(/screenColour/);
    expect(res.error).toMatch(/screen/);
    expect(order(s)).toEqual([]);
  });

  it("refuses a value outside After Effects' range, writes nothing, and removes a Keylight it added", () => {
    const s = scene();
    const res = run("key.keylight", { screenColour: [0.3, 0.5, 0.35], clipBlack: 150 }, s);

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Clip Black/);
    expect(res.error).toMatch(/0 to 100/);
    expect(res.refused[0]).toMatchObject({ setting: "clipBlack" });
    expect(order(s)).toEqual([]);
  });

  it("refuses without touching an existing Keylight", () => {
    const s = scene(["Keylight 906"]);
    const fx = s.parade.list[0];
    const res = run("key.keylight", { clipBlack: 30, clipWhite: 120 }, s);

    expect(res.ok).toBe(false);
    expect(fx.property("Keylight 906-0012").writes).toEqual([]);
    expect(order(s)).toEqual(["Keylight 906"]);
  });

  it("checks colours before After Effects sees them", () => {
    const s = scene(["Keylight 906"]);
    for (const screenColour of [
      [0.3, 0.5],
      [0.3, 1.5, 0.2],
      ["a", 0, 0],
    ]) {
      const res = run("key.keylight", { screenColour }, s);
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/screenColour/);
    }
    expect(s.parade.list[0].property("Keylight 906-0004").writes).toEqual([]);
  });

  it("accepts four-number colours and writes three-number ones with alpha 1", () => {
    const s = scene(["Keylight 906"]);
    run("key.keylight", { screenColour: [0.3, 0.5, 0.35], despillBias: [0.5, 0.4, 0.4, 1] }, s);
    const fx = s.parade.list[0];
    expect(valueOf(fx, "Keylight 906-0004")).toEqual([0.3, 0.5, 0.35, 1]);
    expect(valueOf(fx, "Keylight 906-0007")).toEqual([0.5, 0.4, 0.4, 1]);
  });

  it("writes lockBiases as 0 or 1", () => {
    const s = scene(["Keylight 906"]);
    const res = run("key.keylight", { lockBiases: false }, s);
    expect(res.values.lockBiases).toBe(0);
  });

  it("chooses among several Keylights by effectIndex, and refuses an index that is not Keylight", () => {
    const s = scene(["Keylight 906", "ADBE Gaussian Blur 2", "Keylight 906"]);
    const res = run("key.keylight", { effectIndex: 3, clipBlack: 20 }, s);
    expect(res.ok).toBe(true);
    expect(res.effectIndex).toBe(3);
    expect(res.keylightCount).toBe(2);
    expect(valueOf(s.parade.list[2], "Keylight 906-0012")).toBe(20);
    expect(valueOf(s.parade.list[0], "Keylight 906-0012")).toBe(0);

    const bad = run("key.keylight", { effectIndex: 2, clipBlack: 20 }, s);
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/Gaussian Blur/);
    expect(bad.error).toMatch(/not Keylight/);

    const missing = run("key.keylight", { effectIndex: 9, clipBlack: 20 }, s);
    expect(missing.ok).toBe(false);
    expect(missing.error).toMatch(/no effect at index 9/);
  });

  it("with nothing to write, reports the current values (a read)", () => {
    const s = scene(["Keylight 906"]);
    const res = run("key.keylight", {}, s);
    expect(res.ok).toBe(true);
    expect(res.written).toEqual([]);
    expect(res.values.screenGain).toBe(100);
  });

  it("passes every argument through jsxVal", () => {
    const jsx = getOp("key.keylight")!.toJsx({
      comp: 'x"; app.quit(); "',
      layer: 1,
      clipBlack: 10,
    });
    expect(jsx).toContain(JSON.stringify('x"; app.quit(); "'));
  });
});

// ------------------------------------------------------------------ key.view

describe("key.view", () => {
  const VIEWS: Array<[string, number]> = [
    ["source", 1],
    ["source_alpha", 2],
    ["corrected_source", 3],
    ["colour_correction_edges", 4],
    ["screen_matte", 5],
    ["inside_mask", 6],
    ["outside_mask", 7],
    ["combined_matte", 8],
    ["status", 9],
    ["intermediate_result", 10],
    ["final_result", 11],
  ];

  it("sets every view by name and reports the previous one", () => {
    const s = scene(["Keylight 906"]);
    let previous = 11;
    for (const [name, number] of VIEWS) {
      const res = run("key.view", { view: name }, s);
      expect(res.ok).toBe(true);
      expect(res.view).toEqual({ number, name });
      expect(res.previous.number).toBe(previous);
      expect(valueOf(s.parade.list[0], "Keylight 906-0002")).toBe(number);
      previous = number;
    }
  });

  it("takes a number, and forgiving spellings of a name", () => {
    const s = scene(["Keylight 906"]);
    expect(run("key.view", { view: 5 }, s).view).toEqual({ number: 5, name: "screen_matte" });
    expect(run("key.view", { view: "Screen Matte" }, s).view.number).toBe(5);
    expect(run("key.view", { view: "color_correction_edges" }, s).view.number).toBe(4);
    expect(run("key.view", { view: "final-result" }, s).view.number).toBe(11);
  });

  it("restores the view it reported as previous", () => {
    const s = scene(["Keylight 906"]);
    const first = run("key.view", { view: "status" }, s);
    run("key.view", { view: first.previous.number }, s);
    expect(valueOf(s.parade.list[0], "Keylight 906-0002")).toBe(11);
  });

  it("refuses a wrong view name, listing the names", () => {
    const s = scene(["Keylight 906"]);
    for (const view of ["matte", 12, 0, 2.5]) {
      const res = run("key.view", { view }, s);
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/view/);
      expect(res.error).toMatch(/screen_matte/);
    }
    expect(s.parade.list[0].property("Keylight 906-0002").writes).toEqual([]);
  });

  it("says when the layer has no Keylight, naming the effects it has", () => {
    const s = scene(["ADBE Gaussian Blur 2"]);
    const res = run("key.view", { view: "status" }, s);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/no Keylight/);
    expect(res.error).toMatch(/Gaussian Blur/);
  });
});

// --------------------------------------------------------------- key.cleanup

describe("key.cleanup", () => {
  it("adds Key Cleaner then Advanced Spill Suppressor right after Keylight", () => {
    const s = scene(["Keylight 906", "ADBE Gaussian Blur 2"]);
    const res = run("key.cleanup", {}, s);

    expect(res.ok).toBe(true);
    expect(order(s)).toEqual([
      "Keylight 906",
      "ADBE KeyCleaner",
      "ADBE Spill2",
      "ADBE Gaussian Blur 2",
    ]);
    expect(res.keyCleaner).toMatchObject({ index: 2, added: true });
    expect(res.spillSuppressor).toMatchObject({ index: 3, added: true });
    expect(res.keyCleaner.values).toMatchObject({
      additionalEdgeRadius: 10,
      reduceChatter: 0,
      alphaContrast: 0,
      strength: 100,
    });
    expect(res.spillSuppressor.values).toMatchObject({ method: 1, suppression: 100 });
    expect(res.order.map((e: Any) => e.matchName)).toEqual(order(s));
  });

  it("writes their main settings, checked", () => {
    const s = scene(["Keylight 906"]);
    const res = run(
      "key.cleanup",
      {
        keyCleaner: {
          additionalEdgeRadius: 4,
          reduceChatter: true,
          alphaContrast: 30,
          strength: 80,
        },
        spillSuppressor: { suppression: 60, keyColor: [0.31, 0.505, 0.35] },
      },
      s,
    );
    expect(res.ok).toBe(true);
    expect(res.keyCleaner.values).toMatchObject({
      additionalEdgeRadius: 4,
      reduceChatter: 1,
      alphaContrast: 30,
      strength: 80,
    });
    expect(res.spillSuppressor.values.suppression).toBe(60);
    expect(res.spillSuppressor.values.keyColor).toEqual([0.31, 0.505, 0.35, 1]);
  });

  it("can take the spill colour from Keylight's Screen Colour", () => {
    const s = scene(["Keylight 906"]);
    run("key.keylight", { screenColour: [0.31, 0.505, 0.35] }, s);
    const res = run("key.cleanup", { spillSuppressor: { keyColor: "keylight" } }, s);
    expect(res.spillSuppressor.values.keyColor).toEqual([0.31, 0.505, 0.35, 1]);
  });

  it("updates existing ones and moves them into the chain order", () => {
    const s = scene(["ADBE Spill2", "Keylight 906", "ADBE Gaussian Blur 2", "ADBE KeyCleaner"]);
    const res = run("key.cleanup", { keyCleaner: { strength: 50 } }, s);
    expect(res.ok).toBe(true);
    expect(order(s)).toEqual([
      "Keylight 906",
      "ADBE KeyCleaner",
      "ADBE Spill2",
      "ADBE Gaussian Blur 2",
    ]);
    expect(res.keylight.index).toBe(1);
    expect(res.keyCleaner).toMatchObject({ index: 2, added: false });
    expect(res.spillSuppressor).toMatchObject({ index: 3, added: false });
    expect(valueOf(s.parade.list[1], "ADBE KeyCleaner-0001")).toBe(50);
  });

  it("leaves one out when asked", () => {
    const s = scene(["Keylight 906"]);
    const res = run("key.cleanup", { keyCleaner: false }, s);
    expect(order(s)).toEqual(["Keylight 906", "ADBE Spill2"]);
    expect(res.keyCleaner).toBeNull();
    const s2 = scene(["Keylight 906"]);
    run("key.cleanup", { spillSuppressor: false }, s2);
    expect(order(s2)).toEqual(["Keylight 906", "ADBE KeyCleaner"]);
  });

  it("lets the caller put Keylight on Intermediate Result, and says when it is not", () => {
    const s = scene(["Keylight 906"]);
    const plain = run("key.cleanup", {}, s);
    expect(plain.keylight.view).toEqual({ number: 11, name: "final_result" });
    expect(plain.chainNote).toMatch(/Intermediate Result/);

    const s2 = scene(["Keylight 906"]);
    const chained = run("key.cleanup", { keylightView: "intermediate_result" }, s2);
    expect(chained.keylight.view).toEqual({ number: 10, name: "intermediate_result" });
    expect(chained.chainNote).toBeUndefined();
  });

  it("needs Keylight on the layer", () => {
    const s = scene(["ADBE Gaussian Blur 2"]);
    const res = run("key.cleanup", {}, s);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/no Keylight/);
    expect(order(s)).toEqual(["ADBE Gaussian Blur 2"]);
  });

  it("refuses an out-of-range setting, removing what it added and moving nothing", () => {
    const s = scene(["ADBE Spill2", "Keylight 906"]);
    const res = run("key.cleanup", { keyCleaner: { additionalEdgeRadius: 300 } }, s);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Additional Edge Radius/);
    expect(order(s)).toEqual(["ADBE Spill2", "Keylight 906"]);
  });

  it("refuses unknown settings and wrong types before After Effects sees them", () => {
    const s = scene(["Keylight 906"]);
    expect(run("key.cleanup", { keyCleaner: { radius: 4 } }, s).error).toMatch(
      /radius.*additionalEdgeRadius/,
    );
    expect(run("key.cleanup", { spillSuppressor: { suppression: "lots" } }, s).error).toMatch(
      /suppression/,
    );
    expect(run("key.cleanup", { spillSuppressor: { keyColor: [2, 0, 0] } }, s).error).toMatch(
      /keyColor/,
    );
    expect(run("key.cleanup", { keyCleaner: 3 }, s).error).toMatch(/keyCleaner/);
    expect(run("key.cleanup", { keylightView: "matte" }, s).error).toMatch(/screen_matte/);
    expect(order(s)).toEqual(["Keylight 906"]);
  });
});

// ------------------------------------------------------------------ mask.get

describe("mask.get", () => {
  // The keyed layer measured live had these two masks.
  const MASKS: MaskSpec[] = [
    {
      name: "Mask 1",
      mode: "ADD",
      feather: [24, 24],
      vertices: [
        [0, 0],
        [100, 0],
        [100, 100],
        [50, 150],
        [0, 100],
        [0, 50],
      ],
      pathKeys: 3,
    },
    {
      name: "Mask 2",
      mode: "SUBTRACT",
      feather: [7, 7],
      inverted: true,
      opacity: 80,
      expansion: -2,
      vertices: [
        [10, 10],
        [20, 10],
        [20, 20],
        [15, 25],
        [10, 20],
        [5, 15],
        [5, 10],
      ],
    },
  ];

  it("reads every mask back with its mode by name", () => {
    const res = run("mask.get", {}, scene([], MASKS));
    expect(res.ok).toBe(true);
    expect(res.count).toBe(2);
    expect(res.masks[0]).toMatchObject({
      index: 1,
      name: "Mask 1",
      mode: "Add",
      inverted: false,
      feather: [24, 24],
      expansion: 0,
      opacity: 100,
      closed: true,
      vertexCount: 6,
      featherFalloff: "smooth",
    });
    expect(res.masks[0].vertices).toHaveLength(6);
    expect(res.masks[0].inTangents).toHaveLength(6);
    expect(res.masks[0].outTangents).toHaveLength(6);
    expect(res.masks[1]).toMatchObject({
      mode: "Subtract",
      inverted: true,
      opacity: 80,
      expansion: -2,
      vertexCount: 7,
    });
  });

  it("says which properties are keyframed", () => {
    const res = run("mask.get", {}, scene([], MASKS));
    expect(res.masks[0].keyframed).toEqual({
      path: true,
      feather: false,
      opacity: false,
      expansion: false,
    });
    expect(res.masks[0].numKeys.path).toBe(3);
    expect(res.masks[1].keyframed.path).toBe(false);
  });

  it("reads one mask by index or name", () => {
    const s = scene([], MASKS);
    expect(run("mask.get", { mask: 2 }, s).masks.map((m: Any) => m.name)).toEqual(["Mask 2"]);
    expect(run("mask.get", { mask: "Mask 1" }, s).masks.map((m: Any) => m.index)).toEqual([1]);
    const missing = run("mask.get", { mask: "Garbage" }, s);
    expect(missing.ok).toBe(false);
    expect(missing.error).toMatch(/Mask 1/);
  });

  it("reads the path at a given time", () => {
    const res = run("mask.get", { mask: 1, time: 1 }, scene([], MASKS));
    expect(res.masks[0].vertices[0]).toEqual([10, 0]);
    expect(res.time).toBe(1);
  });

  it("reports no masks as an empty list", () => {
    const res = run("mask.get", {}, scene());
    expect(res).toMatchObject({ ok: true, count: 0, masks: [] });
  });

  it("extends the mask operations rather than duplicating them: mask.add and mask.set_props take the modes it returns", () => {
    expect(getOp("mask.add")!.params.find((p) => p.name === "mode")!.description).toContain(
      "Subtract",
    );
    expect(getOp("mask.get")!.description).toMatch(/mask\.set_props|mask\.set_path/);
  });
});

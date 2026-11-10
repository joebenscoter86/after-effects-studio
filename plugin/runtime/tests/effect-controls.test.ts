// Offline tests for agent-eyes stage 5: effect properties with their ranges,
// effect.describe, and checked effect writes. Closes defects 2, 9 and 20 of
// quality/reports/2026-11-09-comp-room-limits.
//
// Nothing here reaches After Effects. The real helpers.jsx is evaluated in Node
// against fake property objects shaped like the ExtendScript DOM, and the
// generated operation bodies are run against the same fakes with the comp and
// layer lookups stubbed.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { getOp } from "../src/registry.js";
// Importing the operation registry for its registration side effects.
import "../src/operations/index.js";

const HELPERS_SRC = readFileSync(fileURLToPath(new URL("../jsx/helpers.jsx", import.meta.url)), "utf8");
const EXPORT_SRC = readFileSync(fileURLToPath(new URL("../jsx/export.jsx", import.meta.url)), "utf8");
const SCRIPTING_DOC = readFileSync(
  fileURLToPath(new URL("../../library/references/scripting.md", import.meta.url)),
  "utf8",
);

// ExtendScript enum values (as After Effects reports them).
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

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

/** The real AE helper object, built by evaluating helpers.jsx with the enums in scope. */
function loadAE(): Any {
  return new Function(
    "PropertyValueType",
    "PropertyType",
    "KeyframeInterpolationType",
    `${HELPERS_SRC}\n;return AE;`,
  )(PVT, PT, KIT);
}

interface FakePropSpec {
  name: string;
  matchName: string;
  type: keyof typeof PVT;
  value?: unknown;
  min?: number;
  max?: number;
  unitsText?: string;
  canVaryOverTime?: boolean;
  dropdown?: string[];
  throwOn?: string[];
}

/** A leaf Property as After Effects exposes it, recording writes. */
function fakeProp(spec: FakePropSpec): Any {
  const writes: Array<{ time: number | null; value: unknown }> = [];
  const fields: Record<string, unknown> = {
    name: spec.name,
    matchName: spec.matchName,
    propertyType: PT.PROPERTY,
    propertyValueType: PVT[spec.type],
    value: spec.value,
    hasMin: spec.min !== undefined,
    minValue: spec.min ?? 0,
    hasMax: spec.max !== undefined,
    maxValue: spec.max ?? 0,
    unitsText: spec.unitsText ?? "",
    canVaryOverTime: spec.canVaryOverTime ?? true,
    isDropdownEffect: spec.dropdown !== undefined,
    numKeys: 0,
    canSetExpression: true,
    expressionEnabled: false,
    expression: "",
    isModified: false,
  };
  if (spec.dropdown) fields.propertyParameters = spec.dropdown;
  const p: Any = { writes };
  for (const k of Object.keys(fields)) {
    Object.defineProperty(p, k, {
      enumerable: true,
      get() {
        if (spec.throwOn?.includes(k)) throw new Error(`reading ${k} failed`);
        return fields[k];
      },
    });
  }
  p.setValue = (v: unknown) => writes.push({ time: null, value: v });
  p.setValueAtTime = (t: number, v: unknown) => writes.push({ time: t, value: v });
  return p;
}

/** A property group (an effect, or a group inside one). Children by 1-based index, name or matchName. */
function fakeGroup(name: string, matchName: string, children: Any[], extra: Record<string, unknown> = {}): Any {
  return {
    name,
    matchName,
    propertyType: PT.NAMED_GROUP,
    propertyValueType: PVT.NO_VALUE,
    numProperties: children.length,
    property(key: number | string) {
      if (typeof key === "number") return children[key - 1] ?? null;
      return children.find((c) => c.name === key || c.matchName === key) ?? null;
    },
    ...extra,
  };
}

/** Gradient Wipe as After Effects 2027 reports it to scripting (completion and softness 0 to 1). */
function gradientWipe(): Any {
  return fakeGroup(
    "Gradient Wipe",
    "ADBE Gradient Wipe",
    [
      fakeProp({ name: "Transition Completion", matchName: "ADBE Gradient Wipe-0001", type: "OneD", value: 0, min: 0, max: 1, unitsText: "percent" }),
      fakeProp({ name: "Transition Softness", matchName: "ADBE Gradient Wipe-0002", type: "OneD", value: 0.1, min: 0, max: 1, unitsText: "percent" }),
      fakeProp({ name: "Gradient Layer", matchName: "ADBE Gradient Wipe-0003", type: "LAYER_INDEX", value: 1 }),
      fakeProp({ name: "Gradient Placement", matchName: "ADBE Gradient Wipe-0004", type: "OneD", value: 1, min: 1, max: 3, canVaryOverTime: false }),
      fakeProp({ name: "Invert Gradient", matchName: "ADBE Gradient Wipe-0005", type: "OneD", value: 0, min: 0, max: 1 }),
      fakeGroup("Compositing Options", "ADBE Effect Built In Params", [
        fakeProp({ name: "Effect Opacity", matchName: "ADBE Effect Mask Opacity", type: "OneD", value: 1, min: 0, max: 1 }),
        fakeProp({ name: "Masks", matchName: "ADBE Effect Mask Parade", type: "NO_VALUE" }),
      ]),
    ],
    { propertyType: PT.INDEXED_GROUP, propertyIndex: 1, enabled: true },
  );
}

// ---------------------------------------------------------------- item 1

describe("AE.serializeProperty reports what the effect controls show", () => {
  it("adds the reported range, units and whether the property can be keyed", () => {
    const AE = loadAE();
    const p = fakeProp({ name: "Transition Completion", matchName: "ADBE Gradient Wipe-0001", type: "OneD", value: 0.25, min: 0, max: 1, unitsText: "percent" });

    const out = AE.serializeProperty(p, { controls: true });

    expect(out).toMatchObject({
      name: "Transition Completion",
      matchName: "ADBE Gradient Wipe-0001",
      propertyValueType: "OneD",
      value: 0.25,
      minValue: 0,
      maxValue: 1,
      unitsText: "percent",
      canVaryOverTime: true,
    });
  });

  it("reports no range when After Effects reports none", () => {
    const AE = loadAE();
    const p = fakeProp({ name: "Blurriness", matchName: "ADBE Gaussian Blur 2-0001", type: "OneD", value: 12 });

    const out = AE.serializeProperty(p, { controls: true });

    expect(out).not.toHaveProperty("minValue");
    expect(out).not.toHaveProperty("maxValue");
    expect(out).not.toHaveProperty("unitsText");
  });

  it("reports one side of a range when only one side exists", () => {
    const AE = loadAE();
    const p = fakeProp({ name: "Radius", matchName: "X-0001", type: "OneD", value: 3, min: 0 });

    const out = AE.serializeProperty(p, { controls: true });

    expect(out.minValue).toBe(0);
    expect(out).not.toHaveProperty("maxValue");
  });

  it("survives getters that throw", () => {
    const AE = loadAE();
    const p = fakeProp({
      name: "Odd",
      matchName: "X-0002",
      type: "OneD",
      value: 1,
      min: 0,
      max: 1,
      throwOn: ["hasMin", "unitsText", "canVaryOverTime"],
    });

    const out = AE.serializeProperty(p, { controls: true });

    expect(out).not.toHaveProperty("minValue");
    expect(out.maxValue).toBe(1);
    expect(out).not.toHaveProperty("unitsText");
    expect(out).not.toHaveProperty("canVaryOverTime");
  });

  it("marks a property that cannot vary over time", () => {
    const AE = loadAE();
    const p = fakeProp({ name: "Gradient Placement", matchName: "X-0003", type: "OneD", value: 1, min: 1, max: 3, canVaryOverTime: false });

    expect(AE.serializeProperty(p, { controls: true }).canVaryOverTime).toBe(false);
  });

  it("stays as small as before without the controls option", () => {
    const AE = loadAE();
    const p = fakeProp({ name: "Transition Completion", matchName: "ADBE Gradient Wipe-0001", type: "OneD", value: 0.25, min: 0, max: 1, unitsText: "percent" });

    expect(Object.keys(AE.serializeProperty(p)).sort()).toEqual(["matchName", "name", "propertyValueType", "value"]);
  });

  it("passes the option down through nested groups", () => {
    const AE = loadAE();
    const tree = AE.serializePropertyGroup(gradientWipe(), 0, 6, { controls: true });

    expect(tree.properties[0].maxValue).toBe(1);
    expect(tree.groups[0].properties[0]).toMatchObject({ name: "Effect Opacity", minValue: 0, maxValue: 1 });
  });

  it("layer info carries the controls in full detail, not in summary detail or the project export", () => {
    const AE = loadAE();

    expect(AE._layerWalkOpts({})).toEqual({ controls: true });
    expect(AE._layerWalkOpts({ detail: "full" })).toEqual({ controls: true });
    expect(AE._layerWalkOpts({ detail: "summary" })).toEqual({ onlyModified: true });
    expect(AE._layerWalkOpts({ controls: false })).toBeNull();
    // The export is a description of project state, not of After Effects'
    // control metadata, and it is already large.
    expect(EXPORT_SRC).toMatch(/serializeLayerFull\(lay, \{[^}]*controls: false/);
  });
});

// ---------------------------------------------------------------- item 2

describe("AE.describeEffect", () => {
  it("returns one flat row per settable property, nested ones included", () => {
    const AE = loadAE();
    const rows = AE.describeEffect(gradientWipe()).properties;

    expect(rows.map((r: Any) => r.path)).toEqual([
      ["Transition Completion"],
      ["Transition Softness"],
      ["Gradient Layer"],
      ["Gradient Placement"],
      ["Invert Gradient"],
      ["Compositing Options", "Effect Opacity"],
    ]);
    expect(rows[5]).toMatchObject({
      name: "Effect Opacity",
      matchName: "ADBE Effect Mask Opacity",
      matchPath: ["ADBE Effect Built In Params", "ADBE Effect Mask Opacity"],
      valueType: "OneD",
      value: 1,
      minValue: 0,
      maxValue: 1,
    });
  });

  it("gives the range and units a write must respect", () => {
    const AE = loadAE();
    const row = AE.describeEffect(gradientWipe()).properties[0];

    expect(row).toMatchObject({
      name: "Transition Completion",
      matchName: "ADBE Gradient Wipe-0001",
      valueType: "OneD",
      value: 0,
      minValue: 0,
      maxValue: 1,
      unitsText: "percent",
      canVaryOverTime: true,
      numKeys: 0,
    });
  });

  it("lists menu items where the API exposes them", () => {
    const AE = loadAE();
    const fx = fakeGroup("Dropdown Menu Control", "ADBE Dropdown Control", [
      fakeProp({ name: "Menu", matchName: "ADBE Dropdown Control-0001", type: "OneD", value: 2, min: 1, max: 3, dropdown: ["Red", "Green", "Blue"] }),
    ]);

    expect(AE.describeEffect(fx).properties[0]).toMatchObject({ value: 2, minValue: 1, maxValue: 3, options: ["Red", "Green", "Blue"] });
  });

  it("leaves options out where the API does not expose them", () => {
    const AE = loadAE();
    const row = AE.describeEffect(gradientWipe()).properties[3];

    expect(row).not.toHaveProperty("options");
    expect(row).toMatchObject({ minValue: 1, maxValue: 3, canVaryOverTime: false });
  });

  it("counts properties without a value instead of listing them", () => {
    const AE = loadAE();

    expect(AE.describeEffect(gradientWipe()).skippedNoValue).toBe(1);
  });

  it("keeps a row whose value cannot be read", () => {
    const AE = loadAE();
    const fx = fakeGroup("Glow", "ADBE Glo2", [
      fakeProp({ name: "Glow Colors", matchName: "ADBE Glo2-0007", type: "OneD", value: 1, throwOn: ["value"] }),
    ]);

    expect(AE.describeEffect(fx).properties[0]).toMatchObject({ name: "Glow Colors", value: null });
  });
});

/** Run a generated operation body against a fake layer whose Effects group holds `effects`. */
function runOp(name: string, args: Record<string, unknown>, effects: Any[]): Any {
  const AE = loadAE();
  const effectsGroup = fakeGroup("Effects", "ADBE Effect Parade", effects);
  const layer = { name: "WIPE", property: (k: string) => (k === "Effects" || k === "ADBE Effect Parade" ? effectsGroup : null) };
  AE.findCompByNameOrId = () => ({ numLayers: 1 });
  AE.findLayerInComp = () => layer;
  const body = getOp(name)!.toJsx(args);
  return new Function("AE", "PropertyValueType", "PropertyType", "KeyframeInterpolationType", body)(AE, PVT, PT, KIT);
}

describe("effect.describe", () => {
  it("is a read-only operation", () => {
    expect(getOp("effect.describe")?.readOnly).toBe(true);
  });

  it("describes one effect found by index, display name or match name", () => {
    for (const effect of [1, "Gradient Wipe", "ADBE Gradient Wipe"]) {
      const res = runOp("effect.describe", { comp: "Main", layer: 1, effect }, [gradientWipe()]);

      expect(res.ok).toBe(true);
      expect(res.effect).toMatchObject({ index: 1, name: "Gradient Wipe", matchName: "ADBE Gradient Wipe" });
      expect(res.properties).toHaveLength(6);
    }
  });

  it("names the effects that are there when the one asked for is not", () => {
    const res = runOp("effect.describe", { comp: "Main", layer: 1, effect: "Glow" }, [gradientWipe()]);

    expect(res.ok).toBe(false);
    expect(res.error).toContain("Glow");
    expect(res.error).toContain("1 Gradient Wipe");
  });

  it("passes the effect argument through jsxVal", () => {
    const jsx = getOp("effect.describe")!.toJsx({ comp: "Main", layer: 1, effect: 'x"; app.quit(); "' });

    expect(jsx).toContain(JSON.stringify('x"; app.quit(); "'));
  });

  it("effect.list_on_layer stays a short index and points to effect.describe", () => {
    const op = getOp("effect.list_on_layer")!;
    expect(op.description).toContain("effect.describe");

    const res = runOp("effect.list_on_layer", { comp: "Main", layer: 1 }, [gradientWipe()]);
    expect(Object.keys(res.effects[0].properties[0]).sort()).toEqual(["index", "matchName", "name"]);
  });
});

// ---------------------------------------------------------------- item 3

describe("AE.checkPropertyWrite", () => {
  const completion = () =>
    fakeProp({ name: "Transition Completion", matchName: "ADBE Gradient Wipe-0001", type: "OneD", value: 0, min: 0, max: 1, unitsText: "percent" });

  it("refuses a value outside the reported range, naming the property, the value and the range", () => {
    const AE = loadAE();
    const msg = AE.checkPropertyWrite(completion(), 25);

    expect(msg).toContain("Transition Completion");
    expect(msg).toContain("25");
    expect(msg).toContain("0 to 1");
    expect(msg).toContain("skipCheck");
  });

  it("accepts a value inside the range, ends included", () => {
    const AE = loadAE();

    for (const v of [0, 0.25, 1]) expect(AE.checkPropertyWrite(completion(), v)).toBeNull();
  });

  it("checks one side of a range when only one is reported", () => {
    const AE = loadAE();
    const p = fakeProp({ name: "Radius", matchName: "X-0001", type: "OneD", value: 3, min: 0 });

    expect(AE.checkPropertyWrite(p, 1e6)).toBeNull();
    expect(AE.checkPropertyWrite(p, -1)).toContain("at least 0");
  });

  it("writes any number when no range is reported", () => {
    const AE = loadAE();
    const p = fakeProp({ name: "Blurriness", matchName: "ADBE Gaussian Blur 2-0001", type: "OneD", value: 0 });

    expect(AE.checkPropertyWrite(p, 5000)).toBeNull();
  });

  it("refuses a string or an array for a one-dimensional property", () => {
    const AE = loadAE();

    expect(AE.checkPropertyWrite(completion(), "0.5")).toContain("one number");
    expect(AE.checkPropertyWrite(completion(), [0.5])).toContain("one number");
  });

  it("accepts true and false for a one-dimensional property (checkboxes)", () => {
    const AE = loadAE();
    const p = fakeProp({ name: "Invert Gradient", matchName: "ADBE Gradient Wipe-0005", type: "OneD", value: 0, min: 0, max: 1 });

    expect(AE.checkPropertyWrite(p, true)).toBeNull();
    expect(AE.checkPropertyWrite(p, false)).toBeNull();
  });

  it("refuses the wrong number of dimensions", () => {
    const AE = loadAE();
    const point = fakeProp({ name: "Center", matchName: "X-0010", type: "TwoD_SPATIAL", value: [960, 540] });

    expect(AE.checkPropertyWrite(point, [1, 2])).toBeNull();
    expect(AE.checkPropertyWrite(point, 5)).toContain("2 numbers");
    expect(AE.checkPropertyWrite(point, [1, 2, 3])).toContain("2 numbers");
    expect(AE.checkPropertyWrite(point, [1, "2"])).toContain("2 numbers");
  });

  it("accepts two or three numbers for a three-dimensional property", () => {
    const AE = loadAE();
    const p = fakeProp({ name: "Position", matchName: "ADBE Position", type: "ThreeD_SPATIAL", value: [0, 0, 0] });

    expect(AE.checkPropertyWrite(p, [1, 2])).toBeNull();
    expect(AE.checkPropertyWrite(p, [1, 2, 3])).toBeNull();
    expect(AE.checkPropertyWrite(p, [1])).toContain("2 or 3 numbers");
  });

  it("accepts three or four numbers for a colour and refuses anything else", () => {
    const AE = loadAE();
    const c = fakeProp({ name: "Color", matchName: "ADBE Fill-0002", type: "COLOR", value: [1, 0, 0, 1] });

    expect(AE.checkPropertyWrite(c, [1, 0, 0])).toBeNull();
    expect(AE.checkPropertyWrite(c, [1, 0, 0, 1])).toBeNull();
    expect(AE.checkPropertyWrite(c, "#ff0000")).toContain("3 or 4 numbers");
  });

  it("refuses a range violation in any component of an array value", () => {
    const AE = loadAE();
    const p = fakeProp({ name: "Scale", matchName: "X-0011", type: "TwoD", value: [1, 1], min: 0, max: 10 });

    expect(AE.checkPropertyWrite(p, [5, 20])).toContain("0 to 10");
  });

  it("refuses a property with no value", () => {
    const AE = loadAE();
    const p = fakeProp({ name: "Masks", matchName: "ADBE Effect Mask Parade", type: "NO_VALUE" });

    expect(AE.checkPropertyWrite(p, 1)).toContain("no value");
  });

  it("leaves custom, shape, text and marker values to After Effects", () => {
    const AE = loadAE();
    for (const type of ["CUSTOM_VALUE", "SHAPE", "TEXT_DOCUMENT", "MARKER"] as const) {
      const p = fakeProp({ name: "X", matchName: "X", type, value: null });
      expect(AE.checkPropertyWrite(p, { anything: true })).toBeNull();
    }
  });

  it("does not block a write when the range cannot be read", () => {
    const AE = loadAE();
    const p = fakeProp({ name: "Odd", matchName: "X", type: "OneD", value: 0, min: 0, max: 1, throwOn: ["hasMin", "hasMax"] });

    expect(AE.checkPropertyWrite(p, 25)).toBeNull();
  });
});

describe("effect.set_property checks before it writes", () => {
  const args = { comp: "Main", layer: 1, effectIndex: 1, property: ["Transition Completion"] };

  it("refuses an out-of-range value and writes nothing", () => {
    const fx = gradientWipe();
    const res = runOp("effect.set_property", { ...args, value: 25 }, [fx]);

    expect(res.ok).toBe(false);
    expect(res.error).toContain("Transition Completion");
    expect(res.error).toContain("0 to 1");
    expect(res.range).toEqual({ min: 0, max: 1 });
    expect(fx.property(1).writes).toEqual([]);
  });

  it("refuses a keyframe write the same way", () => {
    const fx = gradientWipe();
    const res = runOp("effect.set_property", { ...args, value: 25, time: 1 }, [fx]);

    expect(res.ok).toBe(false);
    expect(fx.property(1).writes).toEqual([]);
  });

  it("writes a value in range as before", () => {
    const fx = gradientWipe();
    const res = runOp("effect.set_property", { ...args, value: 0.25 }, [fx]);

    expect(res).toMatchObject({ ok: true, name: "Transition Completion", matchName: "ADBE Gradient Wipe-0001" });
    expect(fx.property(1).writes).toEqual([{ time: null, value: 0.25 }]);
  });

  it("writes a keyframe in range at the given time", () => {
    const fx = gradientWipe();
    runOp("effect.set_property", { ...args, value: 1, time: 2 }, [fx]);

    expect(fx.property(1).writes).toEqual([{ time: 2, value: 1 }]);
  });

  it("writes without checking when skipCheck is true", () => {
    const fx = gradientWipe();
    const res = runOp("effect.set_property", { ...args, value: 25, skipCheck: true }, [fx]);

    expect(res.ok).toBe(true);
    expect(res.checked).toBe(false);
    expect(fx.property(1).writes).toEqual([{ time: null, value: 25 }]);
  });

  it("reports that the write was checked", () => {
    const res = runOp("effect.set_property", { ...args, value: 0.5 }, [gradientWipe()]);

    expect(res.checked).toBe(true);
  });

  it("declares skipCheck as a documented boolean parameter", () => {
    const param = getOp("effect.set_property")!.params.find((p) => p.name === "skipCheck");

    expect(param).toMatchObject({ type: "boolean", required: false });
    expect(param!.description).toMatch(/range/i);
  });
});

// ---------------------------------------------------------------- item 4

describe("scripting documentation records scale differences", () => {
  const section = SCRIPTING_DOC.slice(SCRIPTING_DOC.indexOf("## Effect value scales"));

  it("has a section on effect value scales observed in After Effects 2027", () => {
    expect(SCRIPTING_DOC).toContain("## Effect value scales");
    expect(section).toContain("After Effects 2027");
  });

  it("records the differences the limits report observed", () => {
    expect(section).toMatch(/Gradient Wipe[^\n]*Transition Completion[^\n]*0 to 1/);
    expect(section).toMatch(/Gradient Wipe[^\n]*Transition Softness[^\n]*0 to 1/);
    expect(section).toMatch(/Threshold[^\n]*Level[^\n]*0 to 1/);
  });

  it("points to effect.describe and skipCheck", () => {
    expect(section).toContain("effect.describe");
    expect(section).toContain("skipCheck");
  });
});

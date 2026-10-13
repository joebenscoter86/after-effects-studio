import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";
import { getOp } from "../src/registry.js";
import "../src/operations/index.js";

const helpers = readFileSync(new URL("../jsx/helpers.jsx", import.meta.url), "utf8");

function easeLengths(valueType: string, value: number[], expected: number) {
  const context = {
    PropertyValueType: {
      COLOR: "COLOR",
      TwoD: "TwoD",
      TwoD_SPATIAL: "TwoD_SPATIAL",
      ThreeD_SPATIAL: "ThreeD_SPATIAL",
    },
    KeyframeInterpolationType: { BEZIER: "BEZIER" },
    KeyframeEase: function KeyframeEase(this: { speed: number; influence: number }, speed: number, influence: number) {
      this.speed = speed;
      this.influence = influence;
    },
  } as Record<string, unknown>;
  runInNewContext(helpers, context);
  const ae = context.AE as { setEase: (prop: unknown, key: number, inInf: number, outInf: number) => void };
  let applied = false;
  const prop = {
    propertyValueType: valueType,
    keyValue: () => value,
    setTemporalEaseAtKey: (_key: number, incoming: unknown[], outgoing: unknown[]) => {
      expect(incoming).toHaveLength(expected);
      expect(outgoing).toHaveLength(expected);
      applied = true;
    },
    setInterpolationTypeAtKey: () => {},
  };
  ae.setEase(prop, 1, 33, 75);
  expect(applied).toBe(true);
}

describe("temporal ease dimensions", () => {
  it("uses one ease handle for a four-channel Color value", () => {
    easeLengths("COLOR", [1, 0.4, 0.2, 1], 1);
  });

  it("preserves per-dimension handles for ordinary vectors and one for spatial vectors", () => {
    easeLengths("TwoD", [100, 200], 2);
    easeLengths("TwoD_SPATIAL", [100, 200], 1);
  });

  it("routes the explicit easing operation through the same tested helper", () => {
    const jsx = getOp("keyframe.set_easing")!.toJsx({
      comp: "C",
      layer: 1,
      property: ["Contents", "Fill", "Color"],
      keyIndex: 1,
      preset: "ease",
    });
    expect(jsx).toContain("AE.setEase(_node, _ki, 33, 33)");
  });
});

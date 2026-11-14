// ae_comp_info returns the comp's markers (pro finish stage 2 live check: the
// reviewer agent has no ae_do, so it could not read the marker a brief names).
// Runs the REAL helpers.jsx and the comp-info snippet against a mock comp.
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";

import { COMP_INFO_FN } from "../src/operations/snippets.js";
import { compInfoTool } from "../src/tools/comp-info.js";
import { nullTransport } from "./helpers/null-transport.js";

const helpers = readFileSync(new URL("../jsx/helpers.jsx", import.meta.url), "utf8");

function compInfo(markers: Array<{ time: number; comment: string; duration?: number }>) {
  class CompItem {}
  class FootageItem {}
  const markerProperty = {
    name: "Marker",
    matchName: "ADBE Marker",
    propertyValueType: "MARKER",
    numKeys: markers.length,
    keyTime: (k: number) => markers[k - 1].time,
    keyValue: (k: number) => ({ comment: markers[k - 1].comment, chapter: "", url: "", frameTarget: "", cuePointName: "", duration: markers[k - 1].duration ?? 0, label: 0, protectedRegion: false }),
    keyInInterpolationType: () => 6613,
    keyOutInterpolationType: () => 6613,
  };
  const comp = Object.assign(new CompItem(), {
    id: 7, name: "review", label: 0, comment: "", parentFolder: null,
    width: 1920, height: 1080, frameRate: 30, duration: 6, numLayers: 0, bgColor: [0, 0, 0],
    workAreaStart: 0, workAreaDuration: 6, pixelAspect: 1, shutterAngle: 180, shutterPhase: -90, motionBlur: false,
    markerProperty,
    layer: () => null,
  });
  const context: Record<string, unknown> = {
    CompItem, FootageItem,
    PropertyValueType: { NO_VALUE: "NO_VALUE", MARKER: "MARKER" },
    KeyframeInterpolationType: { BEZIER: 6613, LINEAR: 6612, HOLD: 6614 },
    comp,
  };
  runInNewContext(helpers, context);
  return runInNewContext(`${COMP_INFO_FN}\n_compInfo(comp);`, context) as Record<string, any>;
}

describe("ae_comp_info: comp markers", () => {
  it("lists each comp marker's time and comment", () => {
    const info = compInfo([{ time: 2, comment: "hit" }, { time: 4.5, comment: "logo", duration: 0.5 }]);
    expect(info.ok).toBe(true);
    const keys = info.markers.keyframes;
    expect(keys.map((k: any) => [k.time, k.value.comment, k.value.duration])).toEqual([[2, "hit", 0], [4.5, "logo", 0.5]]);
  });
  it("says null when the comp has no markers", () => {
    expect(compInfo([]).markers).toBeNull();
  });
  it("is in the code the tool sends, single and batched, and in its description", async () => {
    for (const nameOrId of ["Main", ["Main", 42]]) {
      const transport = nullTransport();
      await compInfoTool.handler({ nameOrId } as never, transport);
      expect(transport.calls[0].code).toContain("AE.serializeCompMarkers(c)");
    }
    expect(compInfoTool.description).toMatch(/markers/);
  });
});

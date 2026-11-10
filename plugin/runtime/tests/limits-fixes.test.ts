// Offline tests for three operation bugs found by the 2026-11-09 native
// precision test (quality/reports/2026-11-09-comp-room-limits, defects 15-17).
// Assertions are on generated JSX and on the real helper source; the live
// behaviour each one guards against is quoted next to it.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { getOp } from "../src/registry.js";
import { saveProjectTool } from "../src/tools/save-project.js";
// Importing the operation registry for its registration side effects.
import "../src/operations/index.js";
import { nullTransport } from "./helpers/null-transport.js";

const HELPERS_SRC = readFileSync(fileURLToPath(new URL("../jsx/helpers.jsx", import.meta.url)), "utf8");

/** Source text of the statement that starts with `header`, through its closing brace. */
function extractFunction(src: string, header: string): string {
  const start = src.indexOf(header);
  if (start === -1) throw new Error(`not found in helpers.jsx: ${header}`);
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error(`unbalanced braces after: ${header}`);
}

// Defect 15. Live: shape.add_repeater { copies: 12, rotation: 30, endOpacity: 20 }
// threw "null is not an object (line 850)" after adding the repeater and
// setting copies and rotation; End Opacity stayed 100. The operation asked for
// a property called "ADBE Vector Repeater End Opacity", which does not exist:
// After Effects names the two "ADBE Vector Repeater Opacity 1" and "… Opacity 2"
// (read back live as End Opacity [ADBE Vector Repeater Opacity 2]).
describe("shape.add_repeater", () => {
  const base = { comp: "Main", layer: "RING", groupIndex: 1 };

  it("writes start and end opacity to the repeater's real properties", () => {
    const jsx = getOp("shape.add_repeater")!.toJsx({ ...base, startOpacity: 80, endOpacity: 20 });

    expect(jsx).toContain('property("ADBE Vector Repeater Opacity 1").setValue(80)');
    expect(jsx).toContain('property("ADBE Vector Repeater Opacity 2").setValue(20)');
    expect(jsx).not.toContain("ADBE Vector Repeater Start Opacity");
    expect(jsx).not.toContain("ADBE Vector Repeater End Opacity");
  });

  it("leaves the opacities alone when they are not given", () => {
    const jsx = getOp("shape.add_repeater")!.toJsx({ ...base, copies: 12, rotation: 30 });

    expect(jsx).not.toContain("ADBE Vector Repeater Opacity");
  });
});

// Defect 16. Live: keyframe.set_spatial { inTangent: [-100, 50], outTangent: [100, -50] }
// on a 2D layer's Position failed with "Unable to call setSpatialTangentsAtKey
// because of parameter 2. Value array does not have 3 elements." Position is a
// three-component property even on a 2D layer; the operation documents [x, y].
describe("spatial tangents fit the property's own dimensions", () => {
  /** The real helper, pulled out of helpers.jsx (lazily, so a missing helper fails its own tests only). */
  function fit(tangent: number[] | null, dims: number): number[] | null {
    const AE: { fitSpatialTangent?: (t: number[] | null, d: number) => number[] | null } = {};
    new Function("AE", `${extractFunction(HELPERS_SRC, "AE.fitSpatialTangent = function")};`)(AE);
    return AE.fitSpatialTangent!(tangent, dims);
  }

  it("pads [x, y] with a zero for a three-component property", () => {
    expect(fit([-100, 50], 3)).toEqual([-100, 50, 0]);
  });

  it("leaves a tangent of the right length unchanged", () => {
    expect(fit([1, 2, 3], 3)).toEqual([1, 2, 3]);
    expect(fit([1, 2], 2)).toEqual([1, 2]);
  });

  it("drops a z the property has no room for", () => {
    expect(fit([1, 2, 0], 2)).toEqual([1, 2]);
  });

  it("passes null through (keep the current tangent)", () => {
    expect(fit(null, 3)).toBeNull();
  });

  it("keyframe.set_spatial fits both tangents to the key's value before writing", () => {
    const jsx = getOp("keyframe.set_spatial")!.toJsx({
      comp: "Main",
      layer: 1,
      property: ["Transform", "Position"],
      keyIndex: 2,
      inTangent: [-100, 50],
      outTangent: [100, -50],
    });

    expect(jsx).toContain("_node.keyValue(_ki).length");
    expect(jsx).toContain("AE.fitSpatialTangent(_inT, _dims)");
    expect(jsx).toContain("AE.fitSpatialTangent(_outT, _dims)");
    const fitAt = jsx.indexOf("AE.fitSpatialTangent(_outT, _dims)");
    expect(fitAt).toBeLessThan(jsx.indexOf("setSpatialTangentsAtKey"));
  });
});

// Defect 17. Live: ae_save_project { path: ".../2026-11-09-native-gauntlet/gauntlet.aep" }
// with that folder missing failed with "File couldn't be opened for writing:
// …/gauntlet6355c2db-e8be-448c-b564-0f3e2640767a.aep" — After Effects' temp
// name, not the path that was asked for. The render operations already create
// missing output folders; Save As did not.
describe("ae_save_project", () => {
  it("creates the parent folder before Save As", async () => {
    const transport = nullTransport({ result: { ok: true, saved: true, path: "/new/folder/p.aep" } });
    await saveProjectTool.handler({ path: "/new/folder/p.aep" }, transport);

    const code = transport.calls[0].code;
    expect(code).toContain("AE.ensureParentDir(_path)");
    expect(code.indexOf("AE.ensureParentDir(_path)")).toBeLessThan(code.indexOf("app.project.save(f)"));
  });

  it("names the folder it could not create instead of failing on a temp file name", async () => {
    const transport = nullTransport({ result: { ok: true, saved: true, path: "/new/folder/p.aep" } });
    await saveProjectTool.handler({ path: "/new/folder/p.aep" }, transport);

    const code = transport.calls[0].code;
    expect(code).toContain("f.parent.exists");
    expect(code).toContain("cannot create folder");
    expect(code.indexOf("cannot create folder")).toBeLessThan(code.indexOf("app.project.save(f)"));
  });

  it("does not touch the filesystem for a plain save", async () => {
    const transport = nullTransport({ result: { ok: true, saved: true, path: "/x/p.aep" } });
    await saveProjectTool.handler({}, transport);

    // The guard is inside the Save As branch only.
    const code = transport.calls[0].code;
    const saveAs = code.slice(code.indexOf("if (_path)"), code.indexOf("if (!app.project.file)"));
    expect(saveAs).toContain("AE.ensureParentDir(_path)");
    expect(code.slice(code.indexOf("if (!app.project.file)"))).not.toContain("ensureParentDir");
  });
});

// Hand-over and delivery (professional-finish plan, stage 9): what the export
// keeps of compositing (defect 19), a project's lint, project info that fits
// a big project (defect 1), and delivery presets with a check of the file.
// Nothing here reaches After Effects: helpers.jsx runs against fakes.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import "../src/operations/index.js";
import {
  chooseDeliveryTemplate,
  checkDelivered,
  DELIVERY_PRESETS,
  runDeliver,
  type DeliverIO,
} from "../src/operations/render.js";
import { getOp } from "../src/registry.js";
import { projectInfoCode, PROJECT_INFO_DEFAULT_LIMIT } from "../src/tools/project-info.js";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const HELPERS_SRC = readFileSync(fileURLToPath(new URL("../jsx/helpers.jsx", import.meta.url)), "utf8");

const BlendingMode = { NORMAL: 5212, SCREEN: 5220, MULTIPLY: 5216, ADD: 5213 };
const TrackMatteType = { NO_TRACK_MATTE: 5012, ALPHA: 5013, ALPHA_INVERTED: 5014, LUMA: 5015, LUMA_INVERTED: 5016 };
const MaskMode = { NONE: 6812, ADD: 6813, SUBTRACT: 6814, INTERSECT: 6815, LIGHTEN: 6816, DARKEN: 6817, DIFFERENCE: 6818 };
const LightType = { PARALLEL: 4412, SPOT: 4413, POINT: 4414, AMBIENT: 4415 };
const PT = { PROPERTY: 6212, INDEXED_GROUP: 6213, NAMED_GROUP: 6214 };
class AVLayer {}
class CameraLayer {}
class LightLayer {}
class TextLayer extends AVLayer {}
class ShapeLayer extends AVLayer {}
class FolderItem {}
class CompItem {}
class FootageItem {}
class SolidSource {}
class FileSource {}

function loadAE(): Any {
  return new Function(
    "BlendingMode",
    "TrackMatteType",
    "MaskMode",
    "LightType",
    "PropertyType",
    "AVLayer",
    "CameraLayer",
    "LightLayer",
    "TextLayer",
    "ShapeLayer",
    "FolderItem",
    "CompItem",
    "FootageItem",
    "SolidSource",
    "FileSource",
    `${HELPERS_SRC}\n;return AE;`,
  )(
    BlendingMode,
    TrackMatteType,
    MaskMode,
    LightType,
    PT,
    AVLayer,
    CameraLayer,
    LightLayer,
    TextLayer,
    ShapeLayer,
    FolderItem,
    CompItem,
    FootageItem,
    SolidSource,
    FileSource,
  );
}

/** A property tree: leaves are { name, expression?, expressionError? }. */
function group(name: string, children: Any[]): Any {
  return {
    name,
    propertyType: PT.NAMED_GROUP,
    numProperties: children.length,
    property: (i: number | string) => (typeof i === "number" ? children[i - 1] : children.find((c) => c.name === i || c.matchName === i)),
  };
}
function leaf(name: string, expression = "", expressionError = ""): Any {
  return { name, propertyType: PT.PROPERTY, canSetExpression: true, expression, expressionEnabled: expression !== "", expressionError };
}

function layer(fields: Any, props: Any[] = []): Any {
  const base = Object.assign(new AVLayer(), { enabled: true, hasVideo: true, hasAudio: false, isTrackMatte: false, guideLayer: false, ...fields });
  const tree = group("layer", props);
  base.numProperties = tree.numProperties;
  base.property = (i: Any) =>
    i === "ADBE Mask Parade" ? (fields.masks ? group("Masks", fields.masks) : group("Masks", [])) : tree.property(i);
  return base;
}

// ------------------------------------------------------- defect 19: compositing

describe("compositing in the export and back (defect 19)", () => {
  it("reads blend mode, track matte, switches, mask modes and a light's type", () => {
    const AE = loadAE();
    const matte = layer({ name: "matte", index: 1, isTrackMatte: true });
    const filled = layer({
      name: "filled",
      index: 2,
      blendingMode: BlendingMode.SCREEN,
      trackMatteType: TrackMatteType.LUMA_INVERTED,
      trackMatteLayer: matte,
      adjustmentLayer: false,
      guideLayer: false,
      preserveTransparency: true,
      masks: [{ maskMode: MaskMode.SUBTRACT, inverted: true }, { maskMode: MaskMode.ADD, inverted: false }],
    });
    const c = AE.layerCompositing(filled);
    expect(c).toMatchObject({
      blendingMode: "SCREEN",
      trackMatte: { type: "LUMA_INVERTED", layer: { index: 1, name: "matte" } },
      preserveTransparency: true,
      masks: [{ mode: "Subtract", inverted: true }, { mode: "Add", inverted: false }],
    });
    const light = Object.assign(new LightLayer(), { name: "l", index: 3, lightType: LightType.SPOT, enabled: true, property: () => null });
    expect(AE.layerCompositing(light)).toMatchObject({ lightType: "SPOT" });
  });

  it("puts them back on an imported layer, the track matte once its layer exists", () => {
    const AE = loadAE();
    const masks = [{ maskMode: MaskMode.ADD, inverted: false }];
    const target = layer({ name: "filled", index: 2, blendingMode: BlendingMode.NORMAL, trackMatteType: TrackMatteType.NO_TRACK_MATTE, masks });
    const warnings: string[] = [];
    AE.applyLayerCompositing(target, { blendingMode: "SCREEN", preserveTransparency: true, masks: [{ mode: "Subtract", inverted: true }] }, (w: string) => warnings.push(w));
    expect(target.blendingMode).toBe(BlendingMode.SCREEN);
    expect(target.preserveTransparency).toBe(true);
    expect(masks[0]).toEqual({ maskMode: MaskMode.SUBTRACT, inverted: true });
    const matte = layer({ name: "matte", index: 1 });
    let set: Any = null;
    target.setTrackMatte = (l: Any, t: number) => (set = { l, t });
    const comp = { layer: (i: number) => (i === 1 ? matte : target) };
    AE.applyTrackMatte(target, comp, { type: "LUMA_INVERTED", layer: { index: 1, name: "matte" } }, (w: string) => warnings.push(w));
    expect(set).toEqual({ l: matte, t: TrackMatteType.LUMA_INVERTED });
    expect(warnings).toEqual([]);
  });
});

// ------------------------------------------------------- project.lint

function untidyProject() {
  const root = Object.assign(new FolderItem(), { name: "Root" });
  const footageFolder = Object.assign(new FolderItem(), { name: "Footage", parentFolder: root, id: 2 });
  const used = Object.assign(new FootageItem(), { name: "take.mov", id: 3, parentFolder: footageFolder, mainSource: new FileSource(), footageMissing: false, usedIn: [{}] });
  const unused = Object.assign(new FootageItem(), { name: "old take.mov", id: 4, parentFolder: footageFolder, mainSource: new FileSource(), footageMissing: false, usedIn: [] });
  const missing = Object.assign(new FootageItem(), { name: "gone.png", id: 5, parentFolder: footageFolder, mainSource: new FileSource(), footageMissing: true, usedIn: [{}] });
  const stray = Object.assign(new FootageItem(), { name: "logo.png", id: 6, parentFolder: root, mainSource: new FileSource(), footageMissing: false, usedIn: [{}] });
  const text = Object.assign(new TextLayer(), {
    name: "Title",
    index: 4,
    enabled: true,
    hasVideo: true,
    isTrackMatte: false,
    guideLayer: false,
    numProperties: 1,
    property: (i: Any) => (i === "ADBE Text Properties" ? { property: () => ({ value: { font: "Gone-Bold", text: "Title" } }) } : i === 1 ? group("Transform", [leaf("Opacity")]) : null),
  });
  const layers = [
    layer({ name: "hero", index: 1 }, [group("Transform", [leaf("Position", "wiggle(2, 10)"), leaf("Rotation", "thisComp.layer('x').rotation", "Error: layer named 'x' is missing")])]),
    layer({ name: "Shape Layer 3", index: 2 }),
    layer({ name: "old idea", index: 3, enabled: false }),
    text,
    layer({ name: "matte", index: 5, enabled: false, isTrackMatte: true }),
    layer({ name: "voice", index: 6, enabled: false, hasVideo: false, hasAudio: true }),
    layer({ name: "notes", index: 7, enabled: false, guideLayer: true }),
  ];
  const main = Object.assign(new CompItem(), { name: "Main", id: 7, parentFolder: root, usedIn: [], numLayers: layers.length, layer: (i: number) => layers[i - 1] });
  const pre = Object.assign(new CompItem(), { name: "Comp 2", id: 8, parentFolder: root, usedIn: [main], numLayers: 0, layer: () => null });
  const items = [footageFolder, used, unused, missing, stray, main, pre];
  return { rootFolder: root, numItems: items.length, item: (i: number) => items[i - 1] };
}

describe("project.lint", () => {
  it("names each planted problem and nothing else", () => {
    const AE = loadAE();
    const r = AE.lintProject(untidyProject(), { missingFonts: ["Gone-Bold"] });
    const got = r.findings.map((f: Any) => `${f.kind}: ${f.item ?? ""}${f.layer ? ` / ${f.layer}` : ""}`).sort();
    expect(got).toEqual(
      [
        "default name: Comp 2",
        "default name: Main / Shape Layer 3",
        "expression error: Main / hero",
        "missing font: Main / Title",
        "missing footage: gone.png",
        "outside folders: Comp 2",
        "outside folders: logo.png",
        "switched off: Main / old idea",
        "unused footage: old take.mov",
      ].sort(),
    );
    const expr = r.findings.find((f: Any) => f.kind === "expression error");
    expect(expr.detail).toMatch(/Rotation.*missing/);
    expect(r.counts["switched off"]).toBe(1);
  });

  it("lists the layers subject.use_cutout keeps switched off for a re-click as kept, not as findings", () => {
    const AE = loadAE();
    const fx = (mn: string) => ({ numProperties: 1, property: () => ({ matchName: mn }) });
    const matted = layer({ name: "take 1088", index: 1, enabled: false });
    const plain = matted.property;
    matted.property = (i: Any) => (i === "ADBE Effect Parade" ? fx("ADBE Samurai") : plain(i));
    const fill = layer({ name: "take 1088 gap fill", index: 2, enabled: false });
    const leftover = layer({ name: "take", index: 3, enabled: false });
    const layers = [matted, fill, leftover];
    const root = Object.assign(new FolderItem(), { name: "Root" });
    const comp = Object.assign(new CompItem(), { name: "Navy Cutout", id: 1, parentFolder: root, usedIn: [], numLayers: 3, layer: (i: number) => layers[i - 1] });
    const r = AE.lintProject({ rootFolder: root, numItems: 1, item: () => comp }, {});
    expect(r.findings.map((f: Any) => f.layer)).toEqual(["take"]);
    expect(r.kept.map((k: Any) => k.layer)).toEqual(["take 1088", "take 1088 gap fill"]);
    expect(r.kept[0].why).toMatch(/re-click/);
  });

  it("lists a video layer used for its sound alone (picture off, sound on) as kept, and one with its sound off too as a finding", () => {
    const AE = loadAE();
    const forSound = layer({ name: "take.mp4", index: 1, enabled: false, hasVideo: true, hasAudio: true, audioEnabled: true });
    const silentToo = layer({ name: "take", index: 2, enabled: false, hasVideo: true, hasAudio: true, audioEnabled: false });
    const layers = [forSound, silentToo];
    const root = Object.assign(new FolderItem(), { name: "Root" });
    const comp = Object.assign(new CompItem(), { name: "Main", id: 1, parentFolder: root, usedIn: [], numLayers: 2, layer: (i: number) => layers[i - 1] });
    const r = AE.lintProject({ rootFolder: root, numItems: 1, item: () => comp }, {});
    expect(r.findings.map((f: Any) => f.layer)).toEqual(["take"]);
    expect(r.findings[0].detail).toMatch(/sound is off too/);
    expect(r.kept).toEqual([expect.objectContaining({ layer: "take.mp4", why: expect.stringMatching(/for its sound/) })]);
  });

  it("is a read-only operation, and takes names to leave alone", () => {
    const op = getOp("project.lint")!;
    expect(op.readOnly).toBe(true);
    const AE = loadAE();
    const r = AE.lintProject(untidyProject(), { missingFonts: [], ignore: ["old idea", "Comp 2"] });
    expect(r.findings.some((f: Any) => f.layer === "old idea" || f.item === "Comp 2")).toBe(false);
  });
});

// ------------------------------------------------------- defect 1: project info

describe("ae_project_info on a big project (defect 1)", () => {
  it("lists a page of items with counts by type, and says how to read the rest", () => {
    expect(PROJECT_INFO_DEFAULT_LIMIT).toBe(100);
    const code = projectInfoCode({});
    expect(code).toContain("var _limit = 100");
    expect(code).toContain("counts");
    expect(projectInfoCode({ offset: 200, limit: 50 })).toContain("var _offset = 200");
  });
});

// ------------------------------------------------------- delivery

const STOCK = [
  "H.264 - Match Render Settings -  5 Mbps",
  "H.264 - Match Render Settings - 15 Mbps",
  "H.264 - Match Render Settings - 40 Mbps",
  "High Quality",
  "High Quality with Alpha",
  "Lossless",
  "Lossless with Alpha",
];

describe("delivery presets", () => {
  it("pick the documented stock template, and fall back plainly", () => {
    expect(Object.keys(DELIVERY_PRESETS)).toEqual(expect.arrayContaining(["vertical-reel", "master-alpha"]));
    expect(chooseDeliveryTemplate("vertical-reel", STOCK)).toMatchObject({ template: "H.264 - Match Render Settings - 15 Mbps", fallback: false });
    expect(chooseDeliveryTemplate("master-alpha", STOCK)).toMatchObject({ template: "High Quality with Alpha", fallback: false });
    const noH264 = chooseDeliveryTemplate("vertical-reel", ["High Quality", "Lossless"]);
    expect(noH264).toMatchObject({ template: "High Quality", fallback: true });
    expect((noH264 as Any).why).toMatch(/no H\.264 template/);
    const none = chooseDeliveryTemplate("master-alpha", ["High Quality", "TIFF Sequence with Alpha"]);
    expect("error" in none && none.error).toMatch(/no movie template with alpha/);
  });
});

describe("checkDelivered", () => {
  const comp = { width: 1080, height: 1920, frameRate: 30, duration: 2, hasSound: true, soundLayers: ["voice"] };
  it("passes a file that matches the comp, with its level", () => {
    const r = checkDelivered(comp, { width: 1080, height: 1920, frameRate: 30, duration: 2, hasAudio: true, level: { source: "ffmpeg", meanDb: -27, maxDb: -6 } });
    expect(r.passed).toBe(true);
    expect(r.reading).toMatch(/-27/);
  });
  it("flags a size, rate or length that differs", () => {
    const r = checkDelivered(comp, { width: 1080, height: 1080, frameRate: 25, duration: 1.5, hasAudio: true, level: null });
    expect(r.findings.map((f: Any) => f.kind)).toEqual(["size", "frame rate", "duration"]);
  });
  it("flags missing sound, and sound that reads as silence", () => {
    expect(checkDelivered(comp, { width: 1080, height: 1920, frameRate: 30, duration: 2, hasAudio: false, level: null }).findings[0].kind).toBe("sound missing");
    const silent = checkDelivered(comp, { width: 1080, height: 1920, frameRate: 30, duration: 2, hasAudio: true, level: { source: "After Effects", top: 0.002 } });
    expect(silent.findings[0].kind).toBe("sound silent");
    expect(silent.findings[0].reading).toMatch(/voice/);
    const quiet = checkDelivered(comp, { width: 1080, height: 1920, frameRate: 30, duration: 2, hasAudio: true, level: { source: "ffmpeg", meanDb: -91, maxDb: -91 } });
    expect(quiet.findings[0].kind).toBe("sound silent");
  });
  it("says it could not read the level, without failing on that alone", () => {
    const r = checkDelivered(comp, { width: 1080, height: 1920, frameRate: 30, duration: 2, hasAudio: true, level: null });
    expect(r.passed).toBe(true);
    expect(r.reading).toMatch(/level was not read/);
  });
});

describe("render.deliver", () => {
  function io(overrides: Any = {}): DeliverIO & { calls: Any[] } {
    const calls: Any[] = [];
    return {
      calls,
      execute: async (code: string, opts: Any) => {
        calls.push({ label: opts.label, code });
        if (/plan/.test(opts.label)) return { ok: true, comp: "Main", width: 1080, height: 1920, frameRate: 30, duration: 2, hasSound: true, soundLayers: ["voice"], templates: STOCK, ...overrides.plan };
        if (/read back/.test(opts.label)) return { ok: true, width: 1080, height: 1920, frameRate: 30, duration: 2, hasAudio: true, amplitudeTop: 21, ...overrides.back };
        if (/deliver render/.test(opts.label)) return { ok: true, outputPath: "/tmp/x.mp4", renderSeconds: 3, audio: {} };
        return { ok: false, error: "?" };
      },
      exists: async () => true,
      freeBytes: async () => 500e9,
      probe: overrides.probe ?? (async () => null),
    };
  }
  it("renders with the preset's template and checks the file it wrote", async () => {
    const f = io();
    const r = await runDeliver({ comp: "Main", preset: "vertical-reel", outputPath: "/tmp/x.mp4" }, f);
    expect(r.ok).toBe(true);
    expect(r.template).toBe("H.264 - Match Render Settings - 15 Mbps");
    expect(r.check.passed).toBe(true);
    expect(f.calls.find((c) => /deliver render/.test(c.label)).code).toContain("H.264 - Match Render Settings - 15 Mbps");
    expect(getOp("render.deliver")!.run).toBeTypeOf("function");
  });
  it("flags a file whose sound reads as silence, from After Effects when ffmpeg is not there", async () => {
    const r = await runDeliver({ comp: "Main", preset: "vertical-reel", outputPath: "/tmp/x.mp4" }, io({ back: { amplitudeTop: 0.002 } }));
    expect(r.check.passed).toBe(false);
    expect(r.check.findings[0].kind).toBe("sound silent");
  });
  it("uses ffmpeg's level when it is there", async () => {
    const r = await runDeliver(
      { comp: "Main", preset: "vertical-reel", outputPath: "/tmp/x.mp4" },
      io({ probe: async () => ({ width: 1080, height: 1920, frameRate: 30, duration: 2, hasAudio: true, meanDb: -26.9, maxDb: -3.1 }) }),
    );
    expect(r.check.passed).toBe(true);
    expect(r.check.file.level).toMatchObject({ source: "ffmpeg", meanDb: -26.9 });
  });
});

// ------------------------------------------------------- the import takes schema 3

import { SCHEMA_VERSION } from "../src/schema.js";
import { validateAeProjectDoc } from "../src/validate.js";

describe("schema 3 (compositing, camera and light options)", () => {
  it("is what the export writes and the import accepts", () => {
    const EXPORT_SRC = readFileSync(fileURLToPath(new URL("../jsx/export.jsx", import.meta.url)), "utf8");
    expect(EXPORT_SRC).toMatch(/AE\.EXPORT_SCHEMA_VERSION = 3;/);
    expect(SCHEMA_VERSION).toBe(3);
    const doc = { schemaVersion: 3, items: [] };
    expect(validateAeProjectDoc(doc).ok).toBe(true);
    expect(validateAeProjectDoc({ schemaVersion: 4, items: [] }).ok).toBe(false);
  });
});

describe("importing a switched-off layer", () => {
  it("sets solo only when it is on (After Effects refuses solo, even false, on a switched-off layer)", () => {
    const IMPORT_SRC = readFileSync(fileURLToPath(new URL("../jsx/import.jsx", import.meta.url)), "utf8");
    expect(IMPORT_SRC).not.toMatch(/if \(lspec\.solo !== undefined\) newLayer\.solo = lspec\.solo;/);
    expect(IMPORT_SRC).toMatch(/if \(lspec\.solo === true\) newLayer\.solo = true;/);
  });
});

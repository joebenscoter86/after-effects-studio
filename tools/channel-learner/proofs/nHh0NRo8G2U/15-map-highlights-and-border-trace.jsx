// nHh0NRo8G2U technique 15: on the grey map of 14, three translucent cyan ovals in Multiply sit over the places like
// printed washes, and a thick mustard line (Multiply) traces round the United States outline with Trim Paths End
// 0 -> 100 % over 13 -> 45 f, S-curve (recipe 15). The pinned prints of 14 sit on top unless args.prints is false.
// Tall comp 1080 x 1920, 23.976 fps, 5 s; map precomp "nHh0 15 map".
// Before frame: switch off the three TECH Wash layers (inside the map precomp).
// args: prelude; optional artDir (map.png, photo-*.png, pin.png), places, outline ([[x, y], ...] in plate pixels,
// starting at the top middle and running west first), washes ([[x, y, diameter] x3] in plate pixels), borderWidth, prints.
// Art run: borderColor, washColor, printSpecs (as 14's prints), sceneScale, focus or framePos.
//
// VERIFY: the map's lines show through the ovals and the border (Multiply); cyan over mustard reads green
// VERIFY: the border starts drawing at the outline's first point and at f42 (1:18) a short piece at the start is still undrawn (End about 97.9 %)
// VERIFY: return.report: stroke width = 1/20 of the outline's width unless args.borderWidth is given
$.evalFile(args.prelude);
var DIR = args.libDir || (new File(args.prelude)).parent.fsName;   // the libraries sit beside the prelude
$.evalFile(DIR + "/art.jsx");
$.evalFile(DIR + "/nh-core-lib.jsx");
$.evalFile(DIR + "/nh-map-lib.jsx");

var FRAMES = 120; // ASSUMED: 5 s; the trace ends at 45 f
var c = NH.scene("nHh0 15 map highlights", FRAMES);
// Art run: args.printSpecs or args.borderColor switch to the brief-driven builder (plate px, whole scene scaled as one group).
var brief = !!(args.printSpecs || args.borderColor);
var m = brief ?
  NHM.buildBrief(c, { n: "15", frames: FRAMES, artDir: args.artDir, artFolder: "art 15", sceneScale: args.sceneScale, focus: args.focus,
    framePos: args.framePos, prints: args.printSpecs || [],
    highlights: { outline: args.outline, borderColor: args.borderColor, borderWidth: args.borderWidth, washes: args.washes, washColor: args.washColor } }) :
  NHM.build(c, {
    n: "15", frames: FRAMES, artDir: args.artDir, artFolder: "art 15", places: args.places, highlights: true,
    outline: args.outline, washes: args.washes, borderWidth: args.borderWidth, prints: args.prints
  });
var end = m.highlights.border.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim").property("ADBE Vector Trim End");
return {
  comp: c.name, id: c.id, layers: c.numLayers, mapComp: m.mapComp.name, report: m.report,
  checks: "border End f29 " + NH.r1(end.valueAtTime(NH.t(29), false)) + " % (want ~50), f42 " + NH.r1(end.valueAtTime(NH.t(42), false)) + " % (want ~97.9)",
  tech: (brief ? "TECH Wash west lobe, central valley, south-east highlands" : "TECH Wash North America, TECH Wash Western Europe, TECH Wash Asia") + " (in " + m.mapComp.name + ")"
};

// Technique 21: paper texture through a title matte, with roughened edges.
// A copy of the texture sits under a black title and uses it as an alpha track matte; the copy is lifted (Curves in the
// recipe, Levels here) and the title's edges are broken up with Roughen Edges, so the letters are made of the paper itself.
// Stand-in texture: a precomp "21 paper texture" holding a solid with Fractal Noise tinted dark.
// Technique parts are named "TECH ...". For the before frame (black title sitting on the paper) run with args.before = true,
// or by hand: switch off "TECH texture in title" and switch on the "title" layer's video.
//
// VERIFY: TextLayer/AVLayer.setTrackMatte(layer, TrackMatteType.ALPHA) exists (After Effects 2023 and later).
// VERIFY: the matte layer ("title") still acts as the matte with its video switched off (enabled = false).
// VERIFY: Levels display name "Levels" adds "ADBE Easy Levels2"; its "Input White" is read in 0..1 here (33/255 = 0.129).
//         If the panel then shows 0.13 rather than 33, set 33 instead.
// VERIFY: Roughen Edges property display names "Border", "Edge Sharpness", "Fractal Influence", "Scale",
//         "Stretch Width or Height", "Complexity", "Evolution"; Edge Type left at its default (assumed Roughen).
// VERIFY: Evolution 1x +161.4 deg is the value 521.4 in degrees.
// VERIFY: Displacement Map property names "Displacement Map Layer", "Max Horizontal Displacement", "Max Vertical Displacement";
//         the layer parameter takes a layer index; Use For Horizontal Red, Use For Vertical Green, Center Map, Wrap off and
//         Expand Output on are left at the effect's defaults (assumed to be those).
// VERIFY: Fractal Noise property names "Contrast", "Brightness", "Scale", "Complexity"; Tint "Map Black To", "Map White To".
// VERIFY: font PostScript name "Impact" is installed (tall condensed caps); pass args.font otherwise.
$.evalFile(args.prelude);

var before = !!args.before;
var W = 1920, H = 1080, FPS = 24, DUR = 4;

// Stand-in texture in its own comp, so that "Source" of the layer already includes the effects
// (the recipe's Displacement Map reads the texture as Effects & Masks; a precomp makes Source and Effects & Masks the same).
// ASSUMED: texture look (recipe: "dark creased, scratched paper"; the source is not given).
var tc = P.freshComp("21 paper texture", W, H, FPS, DUR, [0, 0, 0]);
var paper = P.solid(tc, "21 paper", [0.5, 0.5, 0.5]);
var fn = P.effect(paper, "Fractal Noise");
var fni = fn.propertyIndex;
paper.property("ADBE Effect Parade").property(fni).property("Contrast").setValue(160);
paper.property("ADBE Effect Parade").property(fni).property("Brightness").setValue(-10);
paper.property("ADBE Effect Parade").property(fni).property("Scale").setValue(45);
paper.property("ADBE Effect Parade").property(fni).property("Complexity").setValue(10);
var tint = P.effect(paper, "Tint");
var ti = tint.propertyIndex;
paper.property("ADBE Effect Parade").property(ti).property("Map Black To").setValue([0.02, 0.02, 0.02]);
paper.property("ADBE Effect Parade").property(ti).property("Map White To").setValue([0.115, 0.11, 0.105]); // Run fix: was 0.30; with Input White 33/255 the title clipped to white. The paper now peaks near 29/255 so the lifted title reads grey.

var c = P.freshComp("21 texture through a matte", W, H, FPS, DUR, [0.03, 0.03, 0.035]);

// 1. Texture at the bottom, black title above it.
var tex = c.layers.add(tc);
tex.name = "texture";
// Run fix: sizes from the recipe's layout line. Title word 54% of the width wide, 42% of the height tall (cap height),
// centred at 50% across, 47% down; strokes about 3% of the width thick, so a condensed face lighter than Impact.
// ASSUMED: the word (recipe: "a tall condensed all-caps word"; font not given).
// Run fix: a font found by name may be a substitute; take the first candidate that is really installed.
var cand = [args.font || "DINCondensed-Bold", "BebasNeue-Regular", "Oswald-Medium", "Impact", "HelveticaNeue-CondensedBold"];
var FONT = null, ci, fo;
for (ci = 0; ci < cand.length && !FONT; ci++) {
  try { fo = app.fonts.getFontsByPostScriptName(cand[ci]); if (fo.length && !fo[0].isSubstitute) FONT = cand[ci]; } catch (errFont) {}
}
if (!FONT) FONT = "Impact";
var WORD = args.word || "DUST";
var TW = 0.54 * W, TH = 0.42 * H;
var title = P.text(c, WORD, { size: 500, font: FONT, color: [0, 0, 0], name: "title" });
var tdocP = title.property("ADBE Text Properties").property("ADBE Text Document");
var r0 = title.sourceRectAtTime(0, false);
var td = tdocP.value;
var fsz = 500 * TH / r0.height;
td.fontSize = fsz;
tdocP.setValue(td);
r0 = title.sourceRectAtTime(0, false);
// Tracking brings the word to the measured width (1000 units = one em per letter gap).
td = tdocP.value;
var trk = Math.round((TW - r0.width) / (WORD.length - 1) * 1000 / fsz);
td.tracking = trk;
tdocP.setValue(td);
r0 = title.sourceRectAtTime(0, false);
P.tf(title, "ADBE Anchor Point").setValue([r0.left + r0.width / 2, r0.top + r0.height / 2]);
P.tf(title, "ADBE Position").setValue([0.50 * W, 0.47 * H]);
var tfill = P.effect(title, "Fill");
title.property("ADBE Effect Parade").property(tfill.propertyIndex).property("Color").setValue([0, 0, 0]);

// Example content: small white labels round the title (not part of the technique), placed from the layout line:
// a line under the title at 77% down, about 15% of the width wide; a top line centred at 12% down;
// a block at the bottom left, 4% in, 85 to 94% down.
var fitW = function (l, w) {
  var rr = l.sourceRectAtTime(0, false);
  var s = 100 * w / rr.width;
  P.tf(l, "ADBE Scale").setValue([s, s]);
};
var lb1 = P.text(c, "PRINTED MATTER", { size: 28, font: FONT, color: [1, 1, 1], tracking: 200, pos: [0.50 * W, 0.77 * H], name: "label under" });
fitW(lb1, 0.15 * W);
var lb2 = P.text(c, "VOL. 02", { size: 28, font: FONT, color: [1, 1, 1], tracking: 200, pos: [0.50 * W, 0.12 * H], name: "label top" });
var lb3 = P.text(c, "EDITION OF 50\rRISOGRAPH\rTWO INKS", { size: 26, font: FONT, color: [1, 1, 1], tracking: 150, name: "label bottom left" });
var r3 = lb3.sourceRectAtTime(0, false);
var s3 = 100 * (0.09 * H) / r3.height;
P.tf(lb3, "ADBE Scale").setValue([s3, s3]);
P.tf(lb3, "ADBE Anchor Point").setValue([r3.left, r3.top]);
P.tf(lb3, "ADBE Position").setValue([0.04 * W, 0.85 * H]);

if (!before) {
  // 2. Duplicate the texture and put the copy directly under the title.
  var tex2 = tex.duplicate();
  tex2.name = "TECH texture in title";
  tex2.moveAfter(title);

  // 3. Alpha track matte from the title, not inverted; the title's own video off.
  tex2.setTrackMatte(title, TrackMatteType.ALPHA);
  title.enabled = false;

  // 4. Lift the matted copy so the title reads lighter than the background.
  // SUBSTITUTE: Levels with Input White 33/255 stands in for Curves (RGB, white point dragged to input ~33); Curves points
  // cannot be set by script. A straight line from (0,0) to (33,255) is exactly a Levels white point.
  var lv = P.effect(tex2, "Levels");
  var lvi = lv.propertyIndex;
  tex2.property("ADBE Effect Parade").property(lvi).property("Input White").setValue(33 / 255);
  tex2.property("ADBE Effect Parade").property(lvi).name = "TECH lift (Curves substitute)";

  // 6. Displacement Map on the title, above Roughen Edges in the stack (it is already there when Roughen Edges is added);
  // driven by the bottom texture (shown in the recipe, not narrated).
  // ASSUMED: kept as part of the build because the recipe shows it on the matte layer; it is named TECH too.
  var dm = P.effect(title, "Displacement Map");
  var dmi = dm.propertyIndex;
  title.property("ADBE Effect Parade").property(dmi).property("Displacement Map Layer").setValue(tex.index);
  title.property("ADBE Effect Parade").property(dmi).property("Max Horizontal Displacement").setValue(0);
  title.property("ADBE Effect Parade").property(dmi).property("Max Vertical Displacement").setValue(46);
  title.property("ADBE Effect Parade").property(dmi).name = "TECH Displacement Map";

  // 5. Roughen Edges on the title (the matte).
  var re = P.effect(title, "Roughen Edges");
  var rei = re.propertyIndex;
  var R = function (n) { return title.property("ADBE Effect Parade").property(rei).property(n); };
  R("Border").setValue(19);
  R("Edge Sharpness").setValue(10);
  R("Fractal Influence").setValue(1);
  R("Scale").setValue(10);
  R("Stretch Width or Height").setValue(0);
  R("Complexity").setValue(2);
  R("Evolution").setValue(360 + 161.4);
  title.property("ADBE Effect Parade").property(rei).name = "TECH Roughen Edges";
}

// Run fix: each run leaves the earlier run's "paper" solid unused in the project; remove this script's own unused ones.
var oi, oit, removed = 0;
for (oi = app.project.numItems; oi >= 1; oi--) {
  oit = app.project.item(oi);
  if (oit instanceof FootageItem && oit.name === "21 paper" && oit.mainSource instanceof SolidSource && oit.usedIn.length === 0) { oit.remove(); removed++; }
}
var rf = title.sourceRectAtTime(0, false);
return { comp: c.name, id: c.id, layers: c.numLayers, before: before, textureComp: tc.name, font: FONT, fontSize: fsz, tracking: trk,
  titleRect: [rf.width, rf.height] };

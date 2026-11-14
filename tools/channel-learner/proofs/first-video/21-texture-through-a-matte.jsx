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
// Rebuild with artwork (2026-11-14): art from PROOF/21/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// The Fractal Noise stand-in is gone: "Paper BG" is paper.png at 46.875 % (fills 1920 x 1080), and its duplicate
// "TECH texture in title" is matted by the title, lifted with Levels Input White 70/255 (brief: the real paper is
// brighter in its marks), and the title's Roughen Edges retuned on this paper. Labels in Space Mono Bold, #EDEBE6.
// For the movie, everything is parented to "push null", which scales 100 -> 103 % over the comp (a slow push).
$.evalFile(args.artLib);
var ARTDIR = args.artDir;

var before = !!args.before;
var W = 1920, H = 1080, FPS = 24, DUR = 4;

var c = P.freshComp("21 texture through a matte", W, H, FPS, DUR, ART.hex("#080808"));
(function () { var j, it; for (j = app.project.numItems; j >= 1; j--) { it = app.project.item(j); if (it instanceof CompItem && it.name === "21 paper texture" && it.usedIn.length === 0) it.remove(); else if (it instanceof FootageItem && it.usedIn.length === 0 && (it.name === "21 paper" || it.name === "21 push null")) it.remove(); } })();

// 1. Texture at the bottom, black title above it.
var tex = c.layers.add(ART.footage(ARTDIR, "paper.png", "art 21"));
tex.name = "Paper BG";
P.tf(tex, "ADBE Scale").setValue([46.875, 46.875]);
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
var LCOL = ART.hex("#EDEBE6"), LFONT = args.labelFont || "SpaceMono-Bold", LSIZE = args.labelSize || 24;
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
// The Displacement Map (vertical 46, Center Map) pushes the letters by the paper's green away from mid grey; this paper
// is dark (median about 26/255), so the whole title shifts. args.dmShift moves the layer to compensate (measured on the render).
var DMS = before ? 0 : (args.dmShift !== undefined ? args.dmShift : 35) /* run: the map pushed the letters about 35 px down on this paper */;
P.tf(title, "ADBE Position").setValue([0.50 * W, 0.47 * H - DMS]);
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
var lb1 = P.text(c, "PRINTED MATTER", { size: LSIZE, font: LFONT, color: LCOL, tracking: 150, pos: [0.50 * W, 0.77 * H], name: "label under" });
var lb2 = P.text(c, "VOL. 02", { size: LSIZE, font: LFONT, color: LCOL, tracking: 150, pos: [0.50 * W, 0.12 * H], name: "label top" });
var lb3 = P.text(c, "EDITION OF 50\rRISOGRAPH\rTWO INKS", { size: LSIZE, font: LFONT, color: LCOL, tracking: 150, name: "label bottom left" });
var t3 = lb3.property("ADBE Text Properties").property("ADBE Text Document"), d3 = t3.value;
d3.justification = ParagraphJustification.LEFT_JUSTIFY; d3.autoLeading = false; d3.leading = Math.round(LSIZE * 1.6); t3.setValue(d3);
var r3 = lb3.sourceRectAtTime(0, false);
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
  tex2.property("ADBE Effect Parade").property(lvi).property("Input White").setValue((args.white || 100) / 255);
  // Run: the brief's Input White 70 put the letters' median at 83 (top of D) but 37 at its bottom and clipped the T's top
  // to 237: the sheet is lighter top right. White 100 with Gamma 1.6 evens it to about 100 / 61 / 171, creases still white.
  if (args.gamma !== 0) tex2.property("ADBE Effect Parade").property(lvi).property("Gamma").setValue(args.gamma || 1.6);
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
  // Recipe: Border 19, Sharpness 10, Scale 10. Brief: on this paper break the edge in a few larger bites, not a fine fuzz.
  R("Border").setValue(args.border !== undefined ? args.border : 16);
  R("Edge Sharpness").setValue(args.sharp !== undefined ? args.sharp : 6);
  R("Fractal Influence").setValue(1);
  R("Scale").setValue(args.rscale !== undefined ? args.rscale : 120 /* run: 45 gave an even scallop; 120 breaks the edge in larger bites */);
  R("Stretch Width or Height").setValue(0);
  R("Complexity").setValue(2);
  R("Evolution").setValue(360 + 161.4);
  title.property("ADBE Effect Parade").property(rei).name = "TECH Roughen Edges";
}

// Slow push for the movie: everything parented to a static null, then the null scales 100 -> 103 %.
var push = c.layers.addNull(DUR);
push.name = "push null"; push.source.name = "21 push null";
var pl;
for (pl = 2; pl <= c.numLayers; pl++) c.layer(pl).parent = push;
var ps = P.tf(push, "ADBE Scale");
ps.setValueAtTime(0, [100, 100]); ps.setValueAtTime(DUR, [args.push || 103, args.push || 103]);
var removed = 0;
var rf = title.sourceRectAtTime(0, false);
return { comp: c.name, id: c.id, layers: c.numLayers, before: before, labelFont: lb1.property("ADBE Text Properties").property("ADBE Text Document").value.font, font: FONT, fontSize: fsz, tracking: trk,
  titleRect: [rf.width, rf.height] };

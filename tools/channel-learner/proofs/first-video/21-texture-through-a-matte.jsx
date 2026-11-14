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
var paper = P.solid(tc, "paper", [0.5, 0.5, 0.5]);
var fn = P.effect(paper, "Fractal Noise");
var fni = fn.propertyIndex;
paper.property("ADBE Effect Parade").property(fni).property("Contrast").setValue(160);
paper.property("ADBE Effect Parade").property(fni).property("Brightness").setValue(-10);
paper.property("ADBE Effect Parade").property(fni).property("Scale").setValue(45);
paper.property("ADBE Effect Parade").property(fni).property("Complexity").setValue(10);
var tint = P.effect(paper, "Tint");
var ti = tint.propertyIndex;
paper.property("ADBE Effect Parade").property(ti).property("Map Black To").setValue([0.02, 0.02, 0.02]);
paper.property("ADBE Effect Parade").property(ti).property("Map White To").setValue([0.3, 0.29, 0.27]);

var c = P.freshComp("21 texture through a matte", W, H, FPS, DUR, [0.03, 0.03, 0.035]);

// 1. Texture at the bottom, black title above it.
var tex = c.layers.add(tc);
tex.name = "texture";
// ASSUMED: word, font and size (recipe: "a tall condensed all-caps word"; font and size not given).
var title = P.text(c, args.word || "GRIT", { size: args.size || 520, font: args.font || "Impact", color: [0, 0, 0], name: "title" });
var tfill = P.effect(title, "Fill");
title.property("ADBE Effect Parade").property(tfill.propertyIndex).property("Color").setValue([0, 0, 0]);

// Example content: small white labels round the title (not part of the technique).
P.text(c, "VOL. 02", { size: 28, color: [1, 1, 1], tracking: 200, pos: [W / 2 - 380, H / 2 - 300], name: "label 1" });
P.text(c, "PRINTED MATTER", { size: 28, color: [1, 1, 1], tracking: 200, pos: [W / 2 + 330, H / 2 + 310], name: "label 2" });

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

return { comp: c.name, id: c.id, layers: c.numLayers, before: before, textureComp: tc.name };

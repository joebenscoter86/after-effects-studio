// Technique 3: glowing blue gradient line that draws on from a button (Trim Paths + 3 stacked Glows).
// VERIFY: "ADBE Vector Graphic - G-Stroke" exists, and its Colors property cannot be set by script (see SUBSTITUTE).
// VERIFY: Layer.setTrackMatte(matteLayer, TrackMatteType.ALPHA) exists in this AE version.
// VERIFY: match names "ADBE Glow" and "ADBE Ramp"; Gradient Ramp props "Start of Ramp","Start Color","End of Ramp","End Color","Ramp Shape" (Ramp Shape 1 = linear).
// VERIFY: Glow property display names: "Glow Threshold" (set as 60 meaning 60 %), "Glow Radius", "Glow Intensity", "Composite Original", "Glow Operation", "Glow Colors".
// VERIFY: Composite Original enum: 1 On Top, 2 Behind, 3 None. Glow Operation: 1 Add. Glow Colors: 1 Original Colors.
// VERIFY: "ADBE Vector Filter - Trim" with "ADBE Vector Trim End"; rounded rect "ADBE Vector Shape - Rect" with "ADBE Vector Rect Roundness".
// VERIFY: KeyframeEase(0,33.33) Easy Ease via setTemporalEaseAtKey; layer.motionBlur and comp.motionBlur.
// VERIFY: glow on the matte layer: whether the track matte uses the layer's alpha including the glow halo (expected yes).
$.evalFile(args.prelude);
var c = P.freshComp("03 glowing gradient line", 1080, 1920, 24, 5, [0, 0, 0]);
var BX = 540, BY = 700, BH = 260;

// --- colour layer: a Gradient Ramp solid that the line is cut from.
// SUBSTITUTE: a multi-stop Gradient Stroke needs the Gradient Editor (Colors can't be set by script).
// Built as a Gradient Ramp solid shown through the line's alpha (track matte). Ramp has only two colours;
// the recipe's light-dark-light across five stops is reduced to light (at button) -> deeper blue (below).
var fill = P.solid(c, "TECH gradient fill", [0.5, 0.6, 0.9], 1080, 1920);
var ramp = P.effect(fill, "ADBE Ramp");
ramp = fill.property("ADBE Effect Parade").property(1);
ramp.property("Ramp Shape").setValue(1);
ramp.property("Start of Ramp").setValue([540, 830]);
ramp.property("Start Color").setValue([0.533, 0.643, 0.867]); // #88A4DD (recipe, start stop lightened)
ramp.property("End of Ramp").setValue([440, 1500]);
ramp.property("End Color").setValue([0.2, 0.353, 0.655]);     // #335AA7 (recipe stop at 21 %)

// --- the line: shape layer, S curve, plain stroke (matte source), Trim Paths
var sh = P.shape(c, "TECH line");
var line = sh.layer;
// ASSUMED: path points; recipe gives only the shape (vertical start, diagonal middle, near-vertical end, ~16 % of width left over ~37 % height).
P.path(sh, [[0, 0], [-90, 520], [-190, 1100]], [[0, 0], [0, -260], [0, -250]], [[0, 260], [0, 250], [0, 0]], false);
var si = P.stroke(sh, [1, 1, 1, 1], 10, 2); // 10 px (recipe), round cap ASSUMED
// Trim Paths
var cont = P.contents(sh);
var tp = cont.addProperty("ADBE Vector Filter - Trim");
var tpi = tp.propertyIndex;
var end = P.contents(sh).property(tpi).property("ADBE Vector Trim End");
// ASSUMED: grow 0 -> 100 % from 1 s, 15 frames (0.6 s) long (recipe: keys 1:03 and ~1:18 in a 25 fps source)
end.setValueAtTime(1, 0);
end.setValueAtTime(1.625, 100);
end = P.contents(sh).property(tpi).property("ADBE Vector Trim End");
var ease = new KeyframeEase(0, 33.33);
end.setTemporalEaseAtKey(1, [ease], [ease]);
end.setTemporalEaseAtKey(2, [ease], [ease]);
P.tf(line, "ADBE Anchor Point").setValue([0, 0]);
P.tf(line, "ADBE Position").setValue([BX, BY + BH / 2]);
line.motionBlur = true;
c.motionBlur = true;

// --- three stacked Glows on the line layer (recipe values)
var gl = [[50, 0.2], [100, 1.0], [150, 0.2]];
var i, g;
for (i = 0; i < 3; i++) {
  g = P.effect(line, "ADBE Glow");
  g = line.property("ADBE Effect Parade").property(g.propertyIndex);
  g.name = "TECH Glow " + (i + 1);
  g.property("Glow Threshold").setValue(60);
  g.property("Glow Radius").setValue(gl[i][0]);
  g.property("Glow Intensity").setValue(gl[i][1]);
  g.property("Composite Original").setValue(2);
  g.property("Glow Operation").setValue(1);
  g.property("Glow Colors").setValue(1);
}
// Line is the matte for the fill layer below it.
fill.setTrackMatte(line, TrackMatteType.ALPHA);

// --- stand-in button above the line (precondition of the recipe): red rounded rect + label
var bt = P.shape(c, "button");
var rc = P.contents(bt).addProperty("ADBE Vector Shape - Rect");
P.contents(bt).property(1).property("ADBE Vector Rect Size").setValue([400, BH]);
P.contents(bt).property(1).property("ADBE Vector Rect Roundness").setValue(60);
var f = P.contents(bt).addProperty("ADBE Vector Graphic - Fill");
P.contents(bt).property(2).property("ADBE Vector Fill Color").setValue([0.85, 0.12, 0.15, 1]);
P.tf(bt.layer, "ADBE Position").setValue([BX, BY]);
P.text(c, "Next idea", { size: 64, pos: [BX, BY], name: "label" });
return { comp: c.name, id: c.id, layers: c.numLayers };

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
var BX = 540, BCY = 595, BH = 213;  // button centre y = 31 % of 1920 (brief), height 318*0.67
// --- Art (brief.md): ground + button imported into project folder "art 03"
var ARTDIR = args.art || "~/Assets/comp-room-studies/channel-study/tYRvoI04pJk/proof/03/art/";
var artFolder = null, fi, imp = {};
for (fi = app.project.numItems; fi >= 1; fi--) { if (app.project.item(fi) instanceof FolderItem && app.project.item(fi).name === "art 03") artFolder = app.project.item(fi); }
if (!artFolder) artFolder = app.project.items.addFolder("art 03");
var names = ["backdrop.png", "button.png"], ni, it2;
for (ni = 0; ni < names.length; ni++) {
  for (fi = artFolder.numItems; fi >= 1; fi--) { if (artFolder.item(fi).name === names[ni]) imp[names[ni]] = artFolder.item(fi); }
  if (!imp[names[ni]]) { it2 = app.project.importFile(new ImportOptions(new File(ARTDIR + names[ni]))); it2.parentFolder = artFolder; imp[names[ni]] = it2; }
}
var SW = args.strokeW || 3;                 // 10 px / 3840 share on a 1080 comp
var GR = args.glowScale || 0.15;            // glow radii scaled with the comp (recipe 50/100/150 at 3840)
var LY = 672;                               // line start: button bottom centre, hidden behind the button
// --- colour layer: a Gradient Ramp solid that the line is cut from.
// SUBSTITUTE: a multi-stop Gradient Stroke needs the Gradient Editor (Colors can't be set by script).
// Built as a Gradient Ramp solid shown through the line's alpha (track matte). Ramp has only two colours;
// the recipe's light-dark-light across five stops is reduced to light (at button) -> deeper blue (below).
var fill = P.solid(c, "TECH gradient fill", [0.5, 0.6, 0.9], 1080, 1920);
var ramp = P.effect(fill, "ADBE Ramp");
ramp = fill.property("ADBE Effect Parade").property(1);
ramp.property("Ramp Shape").setValue(1);
// Luminance ramp white -> black, then Tritone maps it to light / dark / light: the light-dark-light of the recipe.
ramp.property("Start of Ramp").setValue([540, 700]);
ramp.property("Start Color").setValue([1, 1, 1]);
ramp.property("End of Ramp").setValue([540, 1330]);   // luma 0.5 (the dark stop) falls at y ~1015, mid-bend
ramp.property("End Color").setValue([0, 0, 0]);
// CC Toner (Pentone) did not follow the ramp (flat Midtones colour at every row, with GPU on or off); Tritone does.
var tn = P.effect(fill, "ADBE Tritone");
tn = fill.property("ADBE Effect Parade").property(2);
function rgb(r, g, b) { return [r / 255, g / 255, b / 255, 1]; }
tn.property("Highlights").setValue(rgb(args.cHi ? args.cHi[0] : 105, args.cHi ? args.cHi[1] : 113, args.cHi ? args.cHi[2] : 205));
tn.property("Midtones").setValue(rgb(args.cDk ? args.cDk[0] : 88, args.cDk ? args.cDk[1] : 98, args.cDk ? args.cDk[2] : 160));
tn.property("Shadows").setValue(rgb(args.cLo ? args.cLo[0] : 100, args.cLo ? args.cLo[1] : 112, args.cLo ? args.cLo[2] : 215));

// --- the line: shape layer, S curve, plain stroke (matte source), Trim Paths
var sh = P.shape(c, "TECH line");
var line = sh.layer;
// ASSUMED: path points; recipe gives only the shape (vertical start, diagonal middle, near-vertical end, ~16 % of width left over ~37 % height).
// Rebuilt for the review: vertical start, steep ~55 deg middle (V0->V1: long vertical handles make an S whose midpoint leans ~54 deg), near-vertical run off the bottom.
P.path(sh, [[0, 0], [-230, 330], [-275, 1250]], [[0, 0], [0, -165], [0, -300]], [[0, 165], [0, 200], [0, 0]], false);
var si = P.stroke(sh, [1, 1, 1, 1], SW, 2); // 10 px at 3840 = 3 px at 1080, round cap ASSUMED
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
P.tf(line, "ADBE Position").setValue([BX, LY]);
line.motionBlur = true;
c.motionBlur = true;

// --- three stacked Glows on the line layer (recipe values)
var gl = [[50 * GR, 0.2], [100 * GR, 1.0], [150 * GR, 0.2]];
var i, g;
for (i = 0; i < 3; i++) {
  g = P.effect(line, "ADBE Glo2");
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

// --- button art above the line, label above that, ground at the bottom
var bt = c.layers.add(imp["button.png"]);
bt.name = "Button";
P.tf(bt, "ADBE Position").setValue([BX, BCY]);
P.tf(bt, "ADBE Scale").setValue([67, 67, 100]);
var lb = P.text(c, "Next idea", { size: 44, pos: [BX, BCY], name: "Label", color: [0.949, 0.957, 0.98] });
try { var td = lb.property("ADBE Text Properties").property("ADBE Text Document"); var dv = td.value; dv.font = "Inter-SemiBold"; td.setValue(dv); } catch (e) {}
var gd = c.layers.add(imp["backdrop.png"]);
gd.name = "Ground";
gd.moveToEnd();
return { comp: c.name, id: c.id, layers: c.numLayers, font: lb.property("ADBE Text Properties").property("ADBE Text Document").value.font };

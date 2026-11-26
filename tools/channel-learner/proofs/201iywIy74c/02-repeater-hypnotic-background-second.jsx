// Technique 2: concentric gradient discs from a Repeater with eased scale and rotation.
// VERIFY: "ADBE Vector Graphic - G-Fill" is the Gradient Fill match name.
// VERIFY: "ADBE Vector Grad Type" (1 = linear), "ADBE Vector Grad Start Pt", "ADBE Vector Grad End Pt", "ADBE Vector Grad Colors".
// VERIFY: setValue on "ADBE Vector Grad Colors" may be unsupported/throw in scripting. If so, fix by another route (e.g. 10 layers rig with Gradient Ramp + ellipse mask) and report it as a finding.
// VERIFY: if setValue accepts it, the value format assumed is the flat array [pos,r,g,b, ... ] for colour stops then [pos,opacity] for alpha stops (see GRAD below); may be a different layout.
// VERIFY: repeater match names: "ADBE Vector Filter - Repeater", "ADBE Vector Repeater Copies", "ADBE Vector Repeater Offset", "ADBE Vector Repeater Order" (2 = Below), "ADBE Vector Repeater Transform".
// VERIFY: repeater transform match names "ADBE Vector Repeater Anchor", "...Position", "...Scale", "...Rotation".
// VERIFY: repeater Order enum 1 = Above, 2 = Below.
// VERIFY: KeyframeEase arrays: Scale (2D) takes 2 KeyframeEase objects, Rotation takes 1; speed units are %/s and deg/s.
// VERIFY: Hue/Saturation display name "Hue/Saturation", property "Master Hue" (only used when args.hue is given).
// VERIFY: new repeater at the root of Contents repeats the group above it (as the Contents > Add menu does).
$.evalFile(args.prelude);
var c = P.freshComp("02 repeater hypnotic background", 1080, 1920, 29.97, 5, [0.922, 0.906, 0.961]);
var cx = c.width / 2, cy = c.height / 2;

// Ground: near-white grey F2F2F2 (the comp background colour is the same; a solid makes it a layer too).
var ART = "~/Assets/comp-room-studies/channel-study/201iywIy74c/proof/02/art/";
var artF = null, i0;
for (i0 = 1; i0 <= app.project.numItems; i0++) { if (app.project.item(i0) instanceof FolderItem && app.project.item(i0).name === "art 02") artF = app.project.item(i0); }
if (!artF) artF = app.project.items.addFolder("art 02");
var bdI = null, grI = null;
for (i0 = 1; i0 <= app.project.numItems; i0++) { var it0 = app.project.item(i0); if (it0.parentFolder === artF) { if (it0.name === "backdrop.png") bdI = it0; if (it0.name === "grain-overlay.png") grI = it0; } }
if (!bdI) { bdI = app.project.importFile(new ImportOptions(new File(ART + "backdrop.png"))); bdI.parentFolder = artF; }
if (!grI) { grI = app.project.importFile(new ImportOptions(new File(ART + "grain-overlay.png"))); grI.parentFolder = artF; }
var ground = c.layers.add(bdI); ground.name = "ground";

// FINDING: "ADBE Vector Grad Colors" has no value in scripting (NO_VALUE), so a Gradient Fill cannot be given its colours.
// SUBSTITUTE: ten stacked layers play the Repeater's ten copies. Copy i = scale s^i, rotation i*r about the centre, exactly the
// repeater's compounding. Each is a comp-size solid with Gradient Ramp (white left -> C49FFF right across the 410 px disc) and a 410 px ellipse mask.
var ctrl = c.layers.addNull(c.duration); ctrl.name = "TECH repeater ctrl";
var fxs = P.effect(ctrl, "ADBE Slider Control"); fxs.name = "Scale";
fxs = P.effect(ctrl, "ADBE Slider Control"); fxs.name = "Rot";
var sSl = ctrl.property("ADBE Effect Parade").property("Scale").property(1);
var rSl = ctrl.property("ADBE Effect Parade").property("Rot").property(1);
var tEnd = 2.9; // squeezed key gap
sSl.setValueAtTime(0, 100); sSl.setValueAtTime(tEnd, 143.3);
rSl.setValueAtTime(0, 0); rSl.setValueAtTime(tEnd, 34.3);
// Easy ease, steep start, zero speed into the last key. ASSUMED influences 70 out / 80 in, start speed 3x average.
var avgS = 43.3 / tEnd, avgR = 34.3 / tEnd;
sSl.setTemporalEaseAtKey(1, [new KeyframeEase(0, 33)], [new KeyframeEase(avgS * 3, 70)]);
sSl.setTemporalEaseAtKey(2, [new KeyframeEase(0, 80)], [new KeyframeEase(0, 33)]);
rSl.setTemporalEaseAtKey(1, [new KeyframeEase(0, 33)], [new KeyframeEase(avgR * 3, 70)]);
rSl.setTemporalEaseAtKey(2, [new KeyframeEase(0, 80)], [new KeyframeEase(0, 33)]);
var i, K = 0.5523 * 205, LX = 2000, LY = 2000; // solids are 4000 square so rotated big rings are not clipped by the corners
for (i = 9; i >= 0; i--) {
  var rl = P.solid(c, "TECH ring " + i, [1, 1, 1], 4000, 4000);
  var ms = new Shape();
  ms.vertices = [[LX, LY - 205], [LX + 205, LY], [LX, LY + 205], [LX - 205, LY]];
  ms.inTangents = [[-K, 0], [0, -K], [K, 0], [0, K]];
  ms.outTangents = [[K, 0], [0, K], [-K, 0], [0, -K]];
  ms.closed = true;
  var mk = rl.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
  rl.property("ADBE Mask Parade").property(mk.propertyIndex).property("ADBE Mask Shape").setValue(ms);
  var rp = P.effect(rl, "ADBE Ramp");
  rp.property("ADBE Ramp-0001").setValue([LX - 205, LY]);
  rp.property("ADBE Ramp-0002").setValue([1, 1, 1]);
  rp.property("ADBE Ramp-0003").setValue([LX + 205, LY]);
  rp.property("ADBE Ramp-0004").setValue([0.7686, 0.6235, 1]);
  rp.property("ADBE Ramp-0005").setValue(1);
  // Scale is applied inside the mask and the ramp points (layer scale stays 100): Collapse Transformations rendered the ramp in comp space, so every ring showed the same unrotated gradient.
  var RX = 'var r = 205 * Math.pow(thisComp.layer("TECH repeater ctrl").effect("Scale")(1) / 100, ' + i + '); ';
  rl.property("ADBE Mask Parade").property(1).property("ADBE Mask Shape").expression = RX + 'var k = 0.5523 * r; createPath([[' + LX + ', ' + LY + ' - r], [' + LX + ' + r, ' + LY + '], [' + LX + ', ' + LY + ' + r], [' + LX + ' - r, ' + LY + ']], [[-k, 0], [0, -k], [k, 0], [0, k]], [[k, 0], [0, k], [-k, 0], [0, -k]], true)';
  rl.property("ADBE Effect Parade").property(1).property("ADBE Ramp-0001").expression = RX + '[' + LX + ' - r, ' + LY + ']';
  rl.property("ADBE Effect Parade").property(1).property("ADBE Ramp-0003").expression = RX + '[' + LX + ' + r, ' + LY + ']';
  P.tf(rl, "ADBE Rotate Z").expression = 'thisComp.layer("TECH repeater ctrl").effect("Rot")(1) * ' + i;
  if (args.hue !== undefined) { var hs = P.effect(rl, "Hue/Saturation"); hs.property("Master Hue").setValue(args.hue); }
}
var grain = c.layers.add(grI); grain.name = "grain";
grain.blendingMode = BlendingMode.SOFT_LIGHT;
grain.property("ADBE Transform Group").property("ADBE Opacity").setValue(32);
// Stand-in title with a simple overshoot pop-in (the full bounce is technique 01 of the recipe's source, not this one).
var t = P.text(c, "Hypnotic", { size: 134, color: [0.165, 0.106, 0.302], pos: [cx, cy - 60], font: args.font || "HelveticaNeue-Bold", name: "title" });
var ts = P.tf(t, "ADBE Scale");
ts.setValueAtTime(0.3, [0, 0]);
ts.setValueAtTime(0.6, [118, 118]);
ts.setValueAtTime(0.8, [96, 96]);
ts.setValueAtTime(0.95, [100, 100]);

return { comp: c.name, id: c.id, layers: c.numLayers };

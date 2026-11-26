// Technique 2: concentric gradient discs from ONE ellipse shape layer + Repeater (own Transform keyed), with art.
// Colours: Gradient Fill colours cannot be set by script; keep the default white-to-black ramp and recolour with Tint (substitute for stops only).
$.evalFile(args.prelude);
var c = P.freshComp("02 repeater hypnotic background", 1080, 1920, 29.97, 5, [0.922, 0.906, 0.961]);
var cx = c.width / 2, cy = c.height / 2;
var ART = "~/Assets/comp-room-studies/channel-study/201iywIy74c/proof/02/art/";
var artF = null, i0;
for (i0 = 1; i0 <= app.project.numItems; i0++) { if (app.project.item(i0) instanceof FolderItem && app.project.item(i0).name === "art 02") artF = app.project.item(i0); }
if (!artF) artF = app.project.items.addFolder("art 02");
var bdI = null, grI = null;
for (i0 = 1; i0 <= app.project.numItems; i0++) { var it0 = app.project.item(i0); if (it0.parentFolder === artF) { if (it0.name === "backdrop.png") bdI = it0; if (it0.name === "grain-overlay.png") grI = it0; } }
if (!bdI) { bdI = app.project.importFile(new ImportOptions(new File(ART + "backdrop.png"))); bdI.parentFolder = artF; }
if (!grI) { grI = app.project.importFile(new ImportOptions(new File(ART + "grain-overlay.png"))); grI.parentFolder = artF; }
var ground = c.layers.add(bdI); ground.name = "ground";

var sh = P.shape(c, "TECH rings");
P.ellipse(sh, [410, 410]);
var con = P.contents(sh);
con.addProperty("ADBE Vector Graphic - G-Fill");
var gi = 0, k;
for (k = 1; k <= con.numProperties; k++) { if (con.property(k).matchName === "ADBE Vector Graphic - G-Fill") gi = k; }
var gf = con.property(gi);
gf.property("ADBE Vector Grad Type").setValue(1);
gf.property("ADBE Vector Grad Start Pt").setValue([-205, 0]);
gf.property("ADBE Vector Grad End Pt").setValue([205, 0]);
var gcol = null; try { gcol = String(gf.property("ADBE Vector Grad Colors").propertyValueType); } catch (e0) { gcol = "err " + e0; }
P.tf(sh.layer, "ADBE Position").setValue([cx, cy]);

var root = sh.layer.property("ADBE Root Vectors Group");
root.addProperty("ADBE Vector Filter - Repeater");
var ri = 0;
for (k = 1; k <= root.numProperties; k++) { if (root.property(k).matchName === "ADBE Vector Filter - Repeater") ri = k; }
var rep = root.property(ri);
rep.property("ADBE Vector Repeater Copies").setValue(10);
rep.property("ADBE Vector Repeater Offset").setValue(0);
rep.property("ADBE Vector Repeater Order").setValue(args.order || 1); // enum 1 = Below in this AE (2 put the biggest copy on top; checked by render)
var rt = root.property(ri).property("ADBE Vector Repeater Transform");
rt.property("ADBE Vector Repeater Position").setValue([0, 0]);
rt = root.property(ri).property("ADBE Vector Repeater Transform");
var sc = rt.property("ADBE Vector Repeater Scale");
var ro = rt.property("ADBE Vector Repeater Rotation");
var tEnd = 2.9;
sc.setValueAtTime(0, [100, 100]); sc.setValueAtTime(tEnd, [143.3, 143.3]);
ro.setValueAtTime(0, 0); ro.setValueAtTime(tEnd, 34.3);
var avgS = 43.3 / tEnd, avgR = 34.3 / tEnd;
var inf = (args.infl !== undefined) ? args.infl : 25;
sc.setTemporalEaseAtKey(1, [new KeyframeEase(0, 33), new KeyframeEase(0, 33)], [new KeyframeEase(avgS * 3, inf), new KeyframeEase(avgS * 3, inf)]);
sc.setTemporalEaseAtKey(2, [new KeyframeEase(0, 80), new KeyframeEase(0, 80)], [new KeyframeEase(0, 33), new KeyframeEase(0, 33)]);
ro.setTemporalEaseAtKey(1, [new KeyframeEase(0, 33)], [new KeyframeEase(avgR * 3, inf)]);
ro.setTemporalEaseAtKey(2, [new KeyframeEase(0, 80)], [new KeyframeEase(0, 33)]);

// Colour substitute: Tint. Default ramp reads white at the start point (left); Tint keeps white white and maps the black end to C49FFF.
var tn = P.effect(sh.layer, "ADBE Tint");
tn.property("ADBE Tint-0001").setValue([0.7686, 0.6235, 1]); // Map Black To
tn.property("ADBE Tint-0002").setValue([1, 1, 1]);           // Map White To
if (args.hue !== undefined) { var hs = P.effect(sh.layer, "Hue/Saturation"); hs.property("Master Hue").setValue(args.hue); }

var grain = c.layers.add(grI); grain.name = "grain";
grain.blendingMode = BlendingMode.SOFT_LIGHT;
grain.property("ADBE Transform Group").property("ADBE Opacity").setValue(32);
var t = P.text(c, "Hypnotic", { size: 134, color: [0.165, 0.106, 0.302], pos: [cx, cy - 60], font: args.font || "HelveticaNeue-Bold", name: "title" });
var ts = P.tf(t, "ADBE Scale");
ts.setValueAtTime(0.3, [0, 0]); ts.setValueAtTime(0.6, [118, 118]); ts.setValueAtTime(0.8, [96, 96]); ts.setValueAtTime(0.95, [100, 100]);
return { comp: c.name, id: c.id, layers: c.numLayers, gradColorsType: gcol, order: (function(){var a=[],j;for(j=1;j<=c.numLayers;j++)a.push(c.layer(j).name);return a;})() };

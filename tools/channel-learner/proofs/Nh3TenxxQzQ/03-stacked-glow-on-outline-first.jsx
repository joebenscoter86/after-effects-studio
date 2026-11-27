// Technique 03: four stacked Glow effects (radii 50, 165, 480, 1000) blooming a thin outline of the Lumenfold lockup.
// The Glows sit on the outline layer itself, below its three CC Light Sweep effects.
// VERIFY: P.effect with display names "CC Light Sweep", "Glow", "Find Edges" (addProperty by display name; else use match names ADBE Glo2, CC Light Sweep, ADBE Find Edges)
// VERIFY: Find Edges "Invert" = 1 gives white lines on black (if it gives dark lines on white, flip the value)
// VERIFY: Find Edges property names "Invert" and "Blend With Original"
// VERIFY: CC Light Sweep property names Center, Direction, Width, Light Color, Light Reception (enum 1 Add assumed, left at default here)
// VERIFY: CC Light Sweep Direction is a rotating beam from Center, so two Direction keys at 0 s and 5 s sweep it round
// VERIFY: Glow property names "Glow Threshold" (percent, 24 means 24 %), "Glow Radius", "Glow Intensity"
// VERIFY: PropertyBase.duplicate() on an effect puts the copy right after the original and named "Glow 2" etc.
// VERIFY: effect.name is settable (renaming to "TECH Glow ...")
// VERIFY: Layer.setTrackMatte(layer, TrackMatteType.LUMA) hides the matte layer and uses luminance as alpha
// VERIFY: TextDocument.fontObject.isSubstituted exists in this version (used to detect a missing Montserrat-SemiBold)
// VERIFY: layer.blendingMode = BlendingMode.ADD on the footage-over-backdrop stack
$.evalFile(args.prelude);
if (!args.artDir) throw new Error("args.artDir (PROOF/shared-art) is required");

var W = 1080, H = 1920, FPS = 24, DUR = 5;
// ASSUMED: tutorial logo about 0.6 of 1080 high = 648 px; our mark is ~682 px high, so radii scale by about 1.05.
var S = 1.05;
var markW = 610;                 // ASSUMED: lockup fills ~0.62 of frame width (name 1.1 x mark width = 671 px)
var markScale = markW / 682;
var markH = 762 * markScale;
var nameW = markW * 1.1;
var cy = H * 0.46;

var c = P.freshComp("03 stacked glow", W, H, FPS, DUR, [0, 0, 0]);
var outComp = P.freshComp("03 outline", W, H, FPS, DUR, [0, 0, 0]);
var lock = P.freshComp("03 lockup", W, H, FPS, DUR, [0, 0, 0]);

// ---- lockup: mark over name, white on an opaque black solid (so Find Edges has a full frame) ----
var markItem = app.project.importFile(new ImportOptions(new File(args.artDir + "/mark.png")));
var backItem = app.project.importFile(new ImportOptions(new File(args.backdropFile ? args.backdropFile : args.artDir + "/backdrop.png")));

var font = "Montserrat-SemiBold";
// measure at size 100 to fit the width
var probe = P.text(lock, "Lumenfold", { size: 100, font: font, tracking: 40 });
var fontNote = "Montserrat-SemiBold";
if (probe.property("ADBE Text Properties").property("ADBE Text Document").value.fontObject.isSubstituted) {
  font = "Montserrat-ExtraBold";
  fontNote = "Montserrat-ExtraBold (SemiBold missing)";
}
var w100 = probe.sourceRectAtTime(0, false).width;
probe.remove();
var fsize = 100 * nameW / w100;
var nameLayer = P.text(lock, "Lumenfold", { size: fsize, font: font, tracking: 40, name: "name" });
var nr = nameLayer.sourceRectAtTime(0, false);
var gap = 0.18 * markH;
var total = markH + gap + nr.height;
var top = cy - total / 2;
P.tf(nameLayer, "Position").setValue([W / 2, top + markH + gap + nr.height / 2]);

var mk = lock.layers.add(markItem);
mk.name = "mark";
P.tf(mk, "Scale").setValue([markScale * 100, markScale * 100]);
P.tf(mk, "Position").setValue([W / 2, top + markH / 2]);

var blk = P.solid(lock, "black", [0, 0, 0]);
blk.moveToEnd();

// ---- outline comp: edges of the lockup as a luma matte over a dim solid ----
var dim = P.solid(outComp, "outline base", [0.04, 0.04, 0.04]);
var ed = outComp.layers.add(lock);
ed.name = "edges";
var fe = P.effect(ed, "Find Edges");
fe.property("Invert").setValue(1);
fe.property("Blend With Original").setValue(0);
dim.setTrackMatte(ed, TrackMatteType.LUMA);

// ---- main comp ----
var bg = c.layers.add(backItem);
bg.name = "backdrop";
var ol = c.layers.add(outComp);
ol.name = "outline";
ol.blendingMode = BlendingMode.ADD;

// three CC Light Sweeps; Direction keyed at 0 s and 5 s (a still at frame 0 shows a partial outline)
var cols = [[0.78, 0.16, 0.78], [1, 1, 1], [1, 0.4, 0.8]];  // magenta, white, pink (ASSUMED: recipe sets no sweep colours)
var d0 = [-30, 60, 150];
var d1 = [150, 240, 330];
var wd = [40, 60, 50];                                        // ASSUMED widths, scaled by S
var i, sw;
for (i = 0; i < 3; i++) {
  sw = P.effect(ol, "CC Light Sweep");
  sw.property("Center").setValue([W / 2, cy]);
  sw.property("Width").setValue(wd[i] * S);
  sw.property("Light Color").setValue(cols[i]);
  sw.property("Direction").setValueAtTime(0, d0[i]);
  sw.property("Direction").setValueAtTime(DUR, d1[i]);
  sw.name = "Sweep " + (i + 1);
}

// Glow below the sweeps: threshold 24, radius 50, intensity 1.3; rest default
var gl = P.effect(ol, "Glow");
gl.property("Glow Threshold").setValue(24);
gl.property("Glow Radius").setValue(50 * S);
gl.property("Glow Intensity").setValue(1.3);
var radii = [165, 480, 1000];
var idx = gl.propertyIndex;
var cp;
for (i = 0; i < 3; i++) {
  ol.property("ADBE Effect Parade").property(idx).duplicate();
  idx = idx + 1;
  ol.property("ADBE Effect Parade").property(idx).property("Glow Radius").setValue(Math.min(1000, radii[i] * S)); // Glow Radius is capped at 1000
}
// rename after all copies exist, so every one starts with "TECH "
var first = idx - 3;
for (i = 0; i < 4; i++) {
  ol.property("ADBE Effect Parade").property(first + i).name = "TECH Glow " + (i + 1);
}

return { comp: c.name, id: c.id, layers: c.numLayers, font: fontNote, effects: ol.property("ADBE Effect Parade").numProperties };

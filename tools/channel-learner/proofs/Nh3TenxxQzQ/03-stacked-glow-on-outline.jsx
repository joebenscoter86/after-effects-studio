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
// ASSUMED: tutorial logo about 0.6 of 1080 high = 648 px; radii scale by our mark's height over that.
var markW = 560;                 // mark 616 x 791 (shared mark); name 1.1 x mark width = 616 px, about 0.57 of the frame width
var markScale = markW / 616;
var markH = 791 * markScale;
var S = markH / 530;   // recipe layout: the tutorial logo is about 530 px tall (49 % of its 1080 frame); scale pixel values by our mark height over that
var nameW = markW * 1.1;
var cy = H * 0.46;

var c = P.freshComp("03 stacked glow", W, H, FPS, DUR, [0, 0, 0]);
var outComp = P.freshComp("03 outline", W, H, FPS, DUR, [0, 0, 0]);
var litComp = P.freshComp("03 lit", W, H, FPS, DUR, [0, 0, 0]);
var lock = P.freshComp("03 lockup", W, H, FPS, DUR, [0, 0, 0]);

// ---- lockup: mark over name, white on an opaque black solid (so Find Edges has a full frame) ----
var markItem = app.project.importFile(new ImportOptions(new File(args.artDir + "/mark.png")));
var backItem = app.project.importFile(new ImportOptions(new File(args.artDir + "/backdrop.png")));
var artFolder = null, ai;
for (ai = 1; ai <= app.project.numItems; ai++) { if (app.project.item(ai) instanceof FolderItem && app.project.item(ai).name === "art 03") artFolder = app.project.item(ai); }
if (!artFolder) artFolder = app.project.items.addFolder("art 03");
markItem.parentFolder = artFolder;
backItem.parentFolder = artFolder;

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


// ---- main comp ----
var bg = c.layers.add(backItem);
bg.name = "backdrop";
// The lockup with Fill (black) and the three sweeps lives in "03 outline"; the layer in the main comp carries a mask (only a partial
// outline is lit at the proof moment: recipe layout), then the four Glows. Mask comes before effects, so it cuts the lit line, not the art.
// The black body would hide the Glows (Composite Original Behind), so "03 lit" takes the alpha from the lit lines' luminance
// (Shift Channels, Take Alpha From Luminance = 5). It is a level below the mask: a mask cannot clip it on the same layer,
// because Shift Channels reads the colour of masked-out pixels.
var litIn = litComp.layers.add(outComp);
litIn.name = "outline lines";
var sc = P.effect(litIn, "Shift Channels");
var scNames = [], q;
for (q = 1; q <= sc.numProperties; q++) scNames.push(sc.property(q).name);
sc.property("Take Alpha From").setValue(args.alphaFrom || 5); // menu: 2 Red, 3 Green, 4 Blue, 5 Luminance
var scAlpha = sc.property("Take Alpha From").value;

var ol = c.layers.add(litComp);
ol.name = "outline";
ol.blendingMode = BlendingMode.ADD;
var inner = outComp.layers.add(lock);
inner.name = "lockup";
// Fill (black) first so the lockup body is invisible; only the sweeps' edge lines show (the outline of technique 02).
var fill = P.effect(inner, "Fill");
fill.property("Color").setValue([0, 0, 0]);

// three CC Light Sweeps as in 02 (Sweep Intensity 0, Edge Intensity 90, Edge Thickness 4, Width 79, Sharp, Add), Directions 14/251/118 at time 0.
var cols = args.cols || [[1, 0, 0.8], [1, 1, 1], [1, 0.4, 0.8]];  // ASSUMED colour owners (sweep 1 magenta lights the top and tail, sweep 2 white the left crescent, sweep 3 pink): white, magenta, pink (recipe: white left crescent, magenta top and tail, pink fragment)
var d0 = args.dirs || [14, 251, 118];
var wd = args.widths || [30, 230, 79];
var i, sw;
for (i = 0; i < 3; i++) {
  sw = P.effect(inner, "CC Light Sweep");
  sw.property("Center").setValue([W / 2, cy]);
  sw.property("Shape").setValue(3);
  sw.property("Width").setValue(wd[i] * S);
  sw.property("Sweep Intensity").setValue(0);
  sw.property("Edge Intensity").setValue(args.edgeInt || 250);
  sw.property("Edge Thickness").setValue(4 * S);
  sw.property("Light Color").setValue(cols[i]);
  sw.property("Light Reception").setValue(1);
  sw.property("Direction").setValueAtTime(0, d0[i]);
  sw.property("Direction").setValueAtTime(DUR, d0[i] + 360);
  sw.name = "Sweep " + (i + 1);
}

// Mask on the outline layer: keeps one continuous stretch (left crescent, over the tip, down the notch).
if (!args.noMask) {
  var mkMask = ol.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
  var msh = new Shape();
  msh.vertices = args.maskVerts || [[250, 440], [730, 440], [730, 640], [560, 640], [440, 720], [395, 750], [250, 750]];
  msh.closed = true;
  mkMask.property("ADBE Mask Shape").setValue(msh);
}
// Glow below the sweeps: threshold 24, radius 50, intensity 1.3; rest default
var gl = P.effect(ol, "Glow");
gl.property("Glow Threshold").setValue(61.2); // panel 24 % = 61.2 on the 0-255 scale
gl.property("Glow Radius").setValue(50 * S);
gl.property("Glow Intensity").setValue(1.3);
gl.property("Glow Colors").setValue(1); // 1 = Original Colors (a fresh Glow reads 2 = A & B Colors, which whitens every halo)
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

return { scNames: scNames, scAlpha: scAlpha, comp: c.name, id: c.id, layers: c.numLayers, font: fontNote, effects: ol.property("ADBE Effect Parade").numProperties };

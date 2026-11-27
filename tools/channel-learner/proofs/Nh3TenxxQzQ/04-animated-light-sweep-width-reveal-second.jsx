// Technique 04: animated light-sweep width. Three edge-only CC Light Sweeps (white, magenta, amber) on the Lumenfold lockup,
// Width keyed 0 -> 80 so the rims start hidden and spread, Direction keyed with Easy Ease over two turns, four Glows below.
// VERIFY: "ADBE Fill", "CC Light Sweep" and "ADBE Glo2" accepted by canAddProperty (P.effect throws otherwise)
// VERIFY: CC Light Sweep property names: Center, Direction, Shape, Width, Edge Intensity, Edge Thickness, Sweep Intensity, Light Color, Light Reception
// VERIFY: Shape 3 = Sharp; Light Reception 1 = Add
// VERIFY: Direction accepts degrees beyond 360 (734, 971, 838 down to 720 is the end value); Direction is a one-dimension angle property
// VERIFY: Glow property names: Glow Threshold, Glow Radius, Glow Intensity; Glow Threshold takes 24 as percent (0-100)
// VERIFY: renaming an effect with .name works and the new name is then found by property(name)
// VERIFY: setTemporalEaseAtKey on Direction takes one KeyframeEase in each array
// VERIFY: Montserrat-SemiBold resolves (TextDocument.font read back); tracking 40 in 1/1000 em
// VERIFY: args.artDir holds mark.png and backdrop.png; Light Center is comp pixels because the lockup precomp is comp-sized
// VERIFY: a key at 5.96 s on a 6 s comp is accepted
// ASSUMED: lockup layout as in 01 (mark 74.9 %, name 562 px wide, gap 0.18 of mark height, centre 46 % down)
// ASSUMED: pixel values scaled by 1.02 (our mark 571 px high over tutorial logo about 560): Width 79 -> 80, 240 -> 245, Glow radii 480 -> 490, 1000 -> 1020; Edge Thickness 4 stays 4
// ASSUMED: Glow 1 radius 40 and Glow 2 radius 150 (recipe does not read them), threshold 24, intensity 1.3 on all four
// ASSUMED: Light colours white, #C14DFF (magenta), #FF8A3D (amber) from the lead notes
// ASSUMED: second Width key at 1.6 s on all three; comp 6 s so sweep 1's 240 key is at 5.96 s (tutorial 6:02) and its 79 key at 5.07 s
// ASSUMED: the Direction 24 degree edit at 6:02 is left out (the recipe finds no key for it)
$.evalFile(args.prelude);
var W = 1080, H = 1920, FPS = 24, DUR = 6;
var art = args.artDir || args.art;
var markPath = args.markPath || (art + "/mark.png");
var bgPath = args.backdropPath || (art + "/backdrop-dark.png");
var artFolder = null;
for (var fi = 1; fi <= app.project.numItems; fi++) { if (app.project.item(fi) instanceof FolderItem && app.project.item(fi).name === "art 04") artFolder = app.project.item(fi); }
if (!artFolder) artFolder = app.project.items.addFolder("art 04");
var K = 1.02;

// ---- lockup precomp (same build as 01)
var lk = P.freshComp("04 lockup", W, H, FPS, DUR, [0, 0, 0]);
var markItem = app.project.importFile(new ImportOptions(new File(markPath)));
markItem.parentFolder = artFolder;
var ml = lk.layers.add(markItem);
ml.name = "mark";
var mScale = 562 / 1.1 / markItem.width * 100;
var mH = markItem.height * mScale / 100;
var textSize = 90;
var tl = P.text(lk, "Lumenfold", { size: textSize, font: "Montserrat-SemiBold", tracking: 40, name: "name" });
var r = tl.sourceRectAtTime(0, false);
textSize = textSize * 562 / r.width;
tl.remove();
tl = P.text(lk, "Lumenfold", { size: textSize, font: "Montserrat-SemiBold", tracking: 40, name: "name" });
var td = tl.property("ADBE Text Properties").property("ADBE Text Document");
if (td.value.font !== "Montserrat-SemiBold") {
  var d2 = td.value; d2.font = "Montserrat-ExtraBold"; td.setValue(d2);
}
r = tl.sourceRectAtTime(0, false);
var gap = 0.18 * mH;
var lockH = mH + gap + r.height;
var cy = H * 0.46;
var top = cy - lockH / 2;
P.tf(ml, "Scale").setValue([mScale, mScale]);
P.tf(ml, "Position").setValue([W / 2, top + mH / 2]);
P.tf(tl, "Position").setValue([W / 2, top + mH + gap + r.height / 2]);

// ---- main comp
var c = P.freshComp("04 animated light sweep", W, H, FPS, DUR, [0, 0, 0]);
var bgItem = app.project.importFile(new ImportOptions(new File(bgPath)));
bgItem.parentFolder = artFolder;
var bg = c.layers.add(bgItem);
bg.name = "backdrop";
var L = c.layers.add(lk);
L.name = "lockup";
L.blendingMode = BlendingMode.ADD;

var fill = P.effect(L, "ADBE Fill");
fill.name = "Fill black";
L.property("ADBE Effect Parade").property("Fill black").property("Color").setValue([0, 0, 0, 1]);

var names = ["TECH CC Light Sweep 1", "TECH CC Light Sweep 2", "TECH CC Light Sweep 3"];
var colors = [[1, 1, 1, 1], [0.757, 0.302, 1, 1], [1, 0.541, 0.239, 1]];
var dirStart = [14, 251, 118];
var tEnd = 5 + 2 / 24;      // 5:02
var i, e, ease, wp, dp;
for (i = 0; i < 3; i++) {
  var fx = P.effect(L, "CC Light Sweep");
  fx.name = names[i];
  e = L.property("ADBE Effect Parade").property(names[i]);
  e.property("Center").setValue([W / 2, cy]);
  e.property("Shape").setValue(3);               // Sharp
  e.property("Sweep Intensity").setValue(0);
  e.property("Edge Intensity").setValue(90);
  e.property("Edge Thickness").setValue(4);
  e.property("Light Color").setValue(colors[i]);
  e.property("Light Reception").setValue(1);     // Add

  // Width: 0 at t=0 up to 80 at 1.6 s, linear keys
  wp = e.property("Width");
  wp.setValueAtTime(0, 0);
  wp.setValueAtTime(1.6, 79 * K);
  if (i === 0) {
    wp.setValueAtTime(tEnd, 79 * K);
    wp.setValueAtTime(5.96, 240 * K);
  }

  // Direction: two turns, Easy Ease on both keys
  dp = e.property("Direction");
  dp.setValueAtTime(0, dirStart[i]);
  dp.setValueAtTime(tEnd, 720);
  ease = new KeyframeEase(0, 33.333);
  dp.setTemporalEaseAtKey(1, [ease], [ease]);
  dp.setTemporalEaseAtKey(2, [ease], [ease]);
}

// ---- four Glows below the sweeps
var radii = [50, 165, 480 * K, 1000]; // recipe step 1: 50/165/480/1000 (Glow Radius max is 1000)
var glowDump = [];
for (i = 0; i < 4; i++) {
  var g = P.effect(L, "ADBE Glo2");
  g.name = "TECH Glow " + (i + 1);
  e = L.property("ADBE Effect Parade").property("TECH Glow " + (i + 1));
  e.property("Glow Based On").setValue(2);         // 2 = Color Channel (1 = Alpha glowed the whole silhouette)
  e.property("Glow Threshold").setValue(24 * 2.55); // script range 0-255: 24 % = 61.2
  e.property("Glow Radius").setValue(radii[i]);
  e.property("Glow Intensity").setValue(1.3);
  // Rebuild 2: Glows 1 and 2 raised (16, 10) to reach the measured halo; recipe's 1.3 stays on 3 and 4 (see build-notes Run second)
  var gInt = args.glowInt || [16, 10, 1.3, 1.3];
  e.property("Glow Intensity").setValue(gInt[i]);
  if (args.glowSet) {
    var gs = args.glowSet;
    for (var gk in gs) { if (gs.hasOwnProperty(gk)) e.property(gk).setValue(gs[gk]); }
  }
}

lk.hideShyLayers = false;
return { glowDump: glowDump, comp: c.name, id: c.id, layers: c.numLayers, font: td.value.font, effects: L.property("ADBE Effect Parade").numProperties };

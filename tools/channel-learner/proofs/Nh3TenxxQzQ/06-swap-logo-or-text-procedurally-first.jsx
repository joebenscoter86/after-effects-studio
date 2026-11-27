// Technique 06: swap the artwork inside the pre-comp; the whole reveal stack on the pre-comp layer carries over.
// Default state "name": Lumenfold in type alone (the recipe's second state, lead-notes' 06 exception). args.state === "lockup" shows the mark + name instead (first state).
// The pre-comp holds: name text (top), mark image with Fill white, old logo placeholder (eye off). The main comp holds backdrop + pre-comp layer with the reveal stack (Add).
// VERIFY: "ADBE Fill", "CC Light Sweep", "ADBE Glo2" and "CC Composite" accepted by canAddProperty (P.effect throws otherwise)
// VERIFY: CC Light Sweep property names: Center, Direction, Shape, Width, Edge Intensity, Edge Thickness, Sweep Intensity, Light Color, Light Reception
// VERIFY: Shape 3 = Sharp; Light Reception 1 = Add
// VERIFY: CC Composite property names: Opacity, Composite Original, RGB Only; default Composite Original is "In front" (not set here)
// VERIFY: Direction accepts values beyond 360 (720 end); setTemporalEaseAtKey takes one KeyframeEase per array on Direction
// VERIFY: Glow property names: Glow Threshold, Glow Radius, Glow Intensity; threshold 24 is percent
// VERIFY: Montserrat-SemiBold resolves (font read back); tracking 40 in 1/1000 em
// VERIFY: effect .name rename works and the new name is found by property(name)
// VERIFY: Fill effect property name "Color"
// VERIFY: args.artDir (or args.art) holds mark.png and backdrop.png
// VERIFY: Light Center is in layer (pre-comp) pixels: 540, 960 is the pre-comp centre
// ASSUMED: all keys of recipe 05 timed at 0.8 of the tutorial's seconds so the reveal settles inside a 6 s comp (5:02 -> 4.05 s, 5:18 -> 4.48, 5:20 -> 4.53, 5:26 -> 4.69, 6:06 -> 4.96, 6:22 -> 5.39, 1:17 -> 1.25)
// ASSUMED: name 742 px wide in the pre-comp and the layer's Scale key 100 -> 75.7 % kept, so it rests 562 px wide (52 % of frame width); the mark in lockup state 742/1.1 wide
// ASSUMED: sweeps, glows and their pixel values as in 04 (K 1.02, Glow 1 radius 40, Glow 2 radius 150, threshold 24, intensity 1.3, light colours white / #C14DFF / #FF8A3D, direction starts 14 / 251 / 118, Edge Thickness 4, Edge Intensity 90)
// ASSUMED: composite Opacity 0 -> 100 and Light Sweep 1 Sweep Intensity 0 -> 18 -> 0 per recipe 05; Edge Intensity 90 -> 215
// ASSUMED: the old logo placeholder is a hidden text layer "OLD LOGO"; the recipe's old logo is not given
// SUBSTITUTE: dragging the image into the pre-comp, applying Fill from Effects & Presets and Align panel centring become addLayer, P.effect and Position values
$.evalFile(args.prelude);
var W = 1080, H = 1920, FPS = 24, DUR = 6;
var art = args.artDir || args.art;
var state = args.state || "name";
var K = 1.02;
var TS = 0.8;
var nameW = 485; // rests 367 px wide (brief: 0.34 of frame width) after the 75.7 % key

// ---- pre-comp: old logo (hidden), mark with Fill white, name text
var lk = P.freshComp("06 logo precomp", W, H, FPS, DUR, [0, 0, 0]);
var old = P.text(lk, "OLD LOGO", { size: 120, font: "Montserrat-SemiBold", name: "old logo" });
old.enabled = false;
var markItem = app.project.importFile(new ImportOptions(new File(art + "/mark.png")));
var ml = lk.layers.add(markItem);
ml.name = "new mark";
var mScale = nameW / 1.1 / markItem.width * 100;
var mH = markItem.height * mScale / 100;
P.tf(ml, "Scale").setValue([mScale, mScale]);
var mf = P.effect(ml, "ADBE Fill");
mf.name = "Fill white";
ml.property("ADBE Effect Parade").property("Fill white").property("Color").setValue([1, 1, 1, 1]);

var textSize = 90;
var tl = P.text(lk, "Lumenfold", { size: textSize, font: "Montserrat-SemiBold", tracking: 40, name: "name" });
var r = tl.sourceRectAtTime(0, false);
textSize = textSize * nameW / r.width;
tl.remove();
tl = P.text(lk, "Lumenfold", { size: textSize, font: "Montserrat-SemiBold", tracking: 40, name: "name" });
var td = tl.property("ADBE Text Properties").property("ADBE Text Document");
if (td.value.font !== "Montserrat-SemiBold") {
  var d2 = td.value; d2.font = "Montserrat-ExtraBold"; td.setValue(d2);
}
r = tl.sourceRectAtTime(0, false);
if (state === "lockup") {
  var gap = 0.18 * mH;
  var lockH = mH + gap + r.height;
  var top = H / 2 - lockH / 2;
  P.tf(ml, "Position").setValue([W / 2, top + mH / 2]);
  P.tf(tl, "Position").setValue([W / 2, top + mH + gap + r.height / 2]);
} else {
  ml.enabled = false;
  P.tf(tl, "Position").setValue([W / 2, H / 2]);
}
tl.moveToBeginning();

// ---- main comp
var c = P.freshComp("06 swap logo or text", W, H, FPS, DUR, [0, 0, 0]);
var bgItem = app.project.importFile(new ImportOptions(new File(art + "/backdrop.png")));
var bg = c.layers.add(bgItem);
bg.name = "backdrop";
var L = c.layers.add(lk);
L.name = "logo precomp";
L.blendingMode = BlendingMode.ADD;
P.tf(L, "Position").setValue([W / 2, H * 0.46]);
var sc = P.tf(L, "Scale");
var tEnd = (5 + 2 / 30) * TS;
sc.setValueAtTime(0, [100, 100]);
sc.setValueAtTime(tEnd, [75.7, 75.7]);

var fill = P.effect(L, "ADBE Fill");
fill.name = "TECH Fill black";
L.property("ADBE Effect Parade").property("TECH Fill black").property("Color").setValue([0, 0, 0, 1]);

var names = ["TECH CC Light Sweep 1", "TECH CC Light Sweep 2", "TECH CC Light Sweep 3"];
var colors = [[1, 1, 1, 1], [0.757, 0.302, 1, 1], [1, 0.541, 0.239, 1]];
var dirStart = [14, 251, 118];
var t120 = (1 + 17 / 30) * TS;
var t520 = (5 + 20 / 30) * TS;
var t526 = (5 + 26 / 30) * TS;
var t606 = (6 + 6 / 30) * TS;
var t622 = (6 + 22 / 30) * TS;
var t518 = (5 + 18 / 30) * TS;
var i, e, ease, wp, dp, ep, sp;
for (i = 0; i < 3; i++) {
  var fx = P.effect(L, "CC Light Sweep");
  fx.name = names[i];
  e = L.property("ADBE Effect Parade").property(names[i]);
  e.property("Center").setValue([W / 2, H / 2]);
  e.property("Shape").setValue(3);
  e.property("Sweep Intensity").setValue(0);
  e.property("Edge Intensity").setValue(90);
  e.property("Edge Thickness").setValue(4);
  e.property("Light Color").setValue(colors[i]);
  e.property("Light Reception").setValue(1);

  wp = e.property("Width");
  wp.setValueAtTime(0, 0);
  wp.setValueAtTime(t120, 79 * K);
  wp.setValueAtTime(tEnd, 79 * K);
  if (i === 0) {
    wp.setValueAtTime(t520, 240 * K);
    wp.setValueAtTime(t622, 0);
  } else {
    wp.setValueAtTime(t606, 0);
  }

  dp = e.property("Direction");
  dp.setValueAtTime(0, dirStart[i]);
  dp.setValueAtTime(tEnd, 720);
  ease = new KeyframeEase(0, 33.333);
  dp.setTemporalEaseAtKey(1, [ease], [ease]);
  dp.setTemporalEaseAtKey(2, [ease], [ease]);

  if (i === 0) {
    ep = e.property("Edge Intensity");
    ep.setValueAtTime(tEnd, 90);
    ep.setValueAtTime(t520, 215);
    sp = e.property("Sweep Intensity");
    sp.setValueAtTime(tEnd, 0);
    sp.setValueAtTime(t526, 18);
    sp.setValueAtTime(t622, 0);
  }
}

var radii = [40, 150, 480 * K, Math.min(1000, 1000 * K)]; // Glow Radius maxes at 1000
for (i = 0; i < 4; i++) {
  var g = P.effect(L, "ADBE Glo2");
  g.name = "TECH Glow " + (i + 1);
  e = L.property("ADBE Effect Parade").property("TECH Glow " + (i + 1));
  e.property("Glow Threshold").setValue(24);
  e.property("Glow Radius").setValue(radii[i]);
  e.property("Glow Intensity").setValue(1.3);
}

var cc = P.effect(L, "CC Composite");
cc.name = "TECH CC Composite";
e = L.property("ADBE Effect Parade").property("TECH CC Composite");
var op = e.property("Opacity");
op.setValueAtTime(t518, 0);
op.setValueAtTime(t622, 100);

return { comp: c.name, id: c.id, state: state, layers: c.numLayers, font: td.value.font, effects: L.property("ADBE Effect Parade").numProperties };

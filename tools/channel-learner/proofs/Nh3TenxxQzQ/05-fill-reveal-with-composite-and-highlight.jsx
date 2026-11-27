// Technique 05: solid fill fades in over the glowing outline, with a hot highlight and a small scale-down.
// One lockup layer (precomp, Add over the backdrop). Stack top to bottom: Fill (black), 3 x CC Light Sweep, 4 x Glow, CC Composite.
// VERIFY: match names "ADBE Fill", "CC Light Sweep", "ADBE Glow", "CC Composite" accepted by canAddProperty (P.effect throws if not)
// VERIFY: CC Composite property display names "Opacity", "Composite Original" (1 In front, 2 Behind), "RGB Only"; Opacity scale 0-100
// VERIFY: whether CC Composite in front shows the ORIGINAL (unfilled white) lockup over the glowing outline, as the recipe's step 1 says
// VERIFY: Glow property display names "Glow Threshold" (value 24 means 24 %, not 0-255?), "Glow Radius", "Glow Intensity"
// VERIFY: CC Light Sweep property display names: Center, Direction, Shape, Width, Sweep Intensity, Edge Intensity, Edge Thickness, Light Color, Light Reception
// VERIFY: Shape menu 3 = Sharp; Light Reception 1 = Add
// VERIFY: Fill property "Color"; effect.name assignment accepted
// VERIFY: Direction accepts 720 as degrees (2 turns); setTemporalEaseAtKey takes one KeyframeEase for Direction
// VERIFY: app.fonts.getFontsByPostScriptName exists and returns Font with isSubstitute
// VERIFY: setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, ...LINEAR) fine on 1-D properties
// VERIFY: layer Anchor Point set to the lockup centre keeps the lockup where it is when Position is set to the same point
// VERIFY: effects (Glow, sweeps) scale with the layer Scale so the end state shows no halo only because Widths are 0 and glows sit above the composite
// VERIFY: at the end (Width 0, Composite 100 %) Glow has no leftover halo: the Glows are above CC Composite in the stack, so they should only see the black-filled body
// ASSUMED: the recipe's 30 fps times are multiplied by 0.8 to fit a 6 s, 24 fps comp (recipe's 6:22 = 6.73 s; ours 5.39 s); order and ratios kept
// ASSUMED: sizes in pixels scaled by K = our mark height / tutorial logo height (530 px, as in script 02)
// ASSUMED: Composite Original In front, RGB Only on (recipe: defaults)
// ASSUMED: Glow Threshold 24, Intensity 1.3, radii 50/165/480/1000 scaled by K (recipe 03)
// ASSUMED: sweep colours white, #CC00FF, #FCA000 and directions 14/251/118, as in script 02 (recipe 02)
// ASSUMED: all new keys linear (the recipe infers linear)
$.evalFile(args.prelude);

var artDir = args.artDir || args.art;
if (!artDir) throw new Error("args.artDir (folder holding mark.png and backdrop.png) is required");
var artFolder = null;
var artCache = {};
function importArt(name) {
  // Always import a fresh copy: an item of the same name left from an earlier run may hold an older file
  if (artCache[name]) return artCache[name];
  var i, it;
  if (!artFolder) {
    for (i = 1; i <= app.project.numItems; i++) {
      it = app.project.item(i);
      if (it instanceof FolderItem && it.name === "art 05") artFolder = it;
    }
    if (!artFolder) artFolder = app.project.items.addFolder("art 05");
  }
  var f = new File(artDir + "/" + name);
  if (!f.exists) throw new Error("missing art: " + f.fsName);
  it = app.project.importFile(new ImportOptions(f));
  it.parentFolder = artFolder;
  artCache[name] = it;
  return it;
}
// recipe time (frame number at 30 fps) -> our seconds (x 0.8)
function T(f30) { return f30 / 30 * 0.8; }
// 5:02 = 152, 5:18 = 168, 5:20 = 170, 5:26 = 176, 6:06 = 186, 6:22 = 202
var F502 = 152, F518 = 168, F520 = 170, F526 = 176, F606 = 186, F622 = 202;
function key(prop, f30, v) {
  prop.setValueAtTime(T(f30), v);
  var k = prop.nearestKeyIndex(T(f30));
  prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
}

var W = 1080, H = 1920, DUR = 6;
var c = P.freshComp("05 fill reveal", W, H, 24, DUR, [0.02, 0.03, 0.06]);
var lk = P.freshComp("05 lockup", W, H, 24, DUR, [0, 0, 0]);

// ---- lockup precomp (same layout as script 02) ----
var tutLogoH = 560; // recipe layout: logo 280 px tall in a 540 px picture
var lockW = 0.519 * W;
var markW = lockW / 1.1;
var markItem = importArt("mark.png");
var markS = markW / markItem.width;
var markH = markItem.height * markS;
var K = markH / tutLogoH;

var mark = lk.layers.add(markItem);
mark.name = "mark";
P.tf(mark, "ADBE Scale").setValue([markS * 100, markS * 100]);
var fonts = app.fonts.getFontsByPostScriptName("Montserrat-SemiBold");
var fontName = "Montserrat-SemiBold";
if (!fonts || fonts.length === 0 || fonts[0].isSubstitute) {
  fontName = "Montserrat-ExtraBold"; // ASSUMED fallback from the lead notes
}
var nm = P.text(lk, "Lumenfold", { size: 100, font: fontName, tracking: 40, name: "name" });
var r = nm.sourceRectAtTime(0, false);
var ts = (lockW / r.width) * 100;
P.tf(nm, "ADBE Scale").setValue([ts, ts]);
var nameH = r.height * ts / 100;
var cx = W / 2, cy = 0.46 * H;
var gap = 0.18 * markH;
var total = markH + gap + nameH;
var top = cy - total / 2;
P.tf(mark, "ADBE Position").setValue([cx, top + markH / 2]);
P.tf(nm, "ADBE Position").setValue([cx, top + markH + gap + nameH / 2]);

// ---- main comp ----
var bd = c.layers.add(importArt("backdrop.png"));
bd.name = "backdrop";
var L = c.layers.add(lk);
L.name = "lockup";
L.blendingMode = BlendingMode.ADD;

var fill = P.effect(L, "ADBE Fill");
fill.name = "TECH Fill";
L.property("ADBE Effect Parade").property("TECH Fill").property("Color").setValue([0, 0, 0, 1]);

// Light colours as in 04 (recipe 02: 255/255/255, 200/0/255, 255/160/0), which gave 04 its coloured haze
var cols = [[1, 1, 1, 1], [200 / 255, 0, 1, 1], [1, 160 / 255, 0, 1]];
var dirs = [14, 251, 118];
var t1 = T(F502);
var i, e, p, k, ease, nmS;
for (i = 0; i < 3; i++) {
  nmS = "TECH CC Light Sweep " + (i + 1);
  P.effect(L, "CC Light Sweep").name = nmS;
  e = L.property("ADBE Effect Parade").property(nmS);
  e.property("Center").setValue([cx, cy + (i === 0 ? (args.sweepDy === undefined ? 0 : args.sweepDy) : 0)]);
  e.property("Direction").setValue(dirs[i]);
  e.property("Shape").setValue(3);
  e.property("Width").setValue(79 * K);
  e.property("Sweep Intensity").setValue(0);
  e.property("Edge Intensity").setValue(90);
  e.property("Edge Thickness").setValue(4 * K);
  e.property("Light Color").setValue(cols[i]);
  e.property("Light Reception").setValue(1);
  p = e.property("Direction");
  p.setValueAtTime(0, dirs[i]);
  p.setValueAtTime(t1, 720 + (i === 0 ? (args.sweepDir || 0) : 0));
  ease = new KeyframeEase(0, 33.33);
  for (k = 1; k <= 2; k++) p.setTemporalEaseAtKey(k, [ease], [ease]);
}

// four Glows (recipe 03)
var rad = [50, 165, 480, 1000];
for (i = 0; i < 4; i++) {
  nmS = "TECH Glow " + (i + 1);
  P.effect(L, "ADBE Glo2").name = nmS;
  e = L.property("ADBE Effect Parade").property(nmS);
  // Threshold 46 of 255 (18 %), not the recipe 03's 24 % (61.2): at 61.2 the stack did not bloom the sweep at all; 40 flooded the frame; 44-46 gives the flare blob (see build-notes Run second)
  e.property("Glow Threshold").setValue(args.thr || 61.2);
  e.property("Glow Based On").setValue(2);
  e.property("Glow Radius").setValue(Math.min(1000, rad[i] * K)); // Glow Radius max is 1000
  e.property("Glow Intensity").setValue(1.3);
  // Glow Colors LAST: set before Based On / Radius it read back 2 (A & B Colors) in the third build; 1 = Original Colors
  e.property("Glow Colors").setValue(1);
  if (e.property("Glow Colors").value !== 1) throw new Error("Glow Colors did not stick");
}

// ---- technique 05 proper ----
// CC Composite last in the stack
P.effect(L, "CC Composite").name = "TECH CC Composite";
var cc = L.property("ADBE Effect Parade").property("TECH CC Composite");
// Composite Original and RGB Only left at their defaults (3 = In front, RGB Only on), as the recipe says
cc.property("Opacity").setValue(100);
cc = L.property("ADBE Effect Parade").property("TECH CC Composite");
key(cc.property("Opacity"), F518, 0);
cc = L.property("ADBE Effect Parade").property("TECH CC Composite");
key(cc.property("Opacity"), F622, 100);

// sweep 1 widths: 79 (kept from the earlier technique) at 0 and 5:02, 240 at 5:20, 0 at 6:22
e = L.property("ADBE Effect Parade").property("TECH CC Light Sweep 1");
key(e.property("Width"), 0, 0); // 04: rims start hidden (Width 0) and spread to 79 by 1:17
e = L.property("ADBE Effect Parade").property("TECH CC Light Sweep 1");
key(e.property("Width"), 47, 79 * K);
e = L.property("ADBE Effect Parade").property("TECH CC Light Sweep 1");
key(e.property("Width"), F502, 79 * K);
e = L.property("ADBE Effect Parade").property("TECH CC Light Sweep 1");
key(e.property("Width"), F520, 240 * K);
e = L.property("ADBE Effect Parade").property("TECH CC Light Sweep 1");
key(e.property("Width"), F622, 0);
// sweeps 2 and 3: 79 at 5:02, 0 at 6:06
for (i = 2; i <= 3; i++) {
  e = L.property("ADBE Effect Parade").property("TECH CC Light Sweep " + i);
  key(e.property("Width"), 0, 0);
  e = L.property("ADBE Effect Parade").property("TECH CC Light Sweep " + i);
  key(e.property("Width"), 47, 79 * K);
  e = L.property("ADBE Effect Parade").property("TECH CC Light Sweep " + i);
  key(e.property("Width"), F502, 79 * K);
  e = L.property("ADBE Effect Parade").property("TECH CC Light Sweep " + i);
  key(e.property("Width"), F606, 0);
}
// sweep 1 Edge Intensity 90 -> 215
e = L.property("ADBE Effect Parade").property("TECH CC Light Sweep 1");
key(e.property("Edge Intensity"), F502, 90);
e = L.property("ADBE Effect Parade").property("TECH CC Light Sweep 1");
key(e.property("Edge Intensity"), F520, 215);
// sweep 1 Sweep Intensity 0 -> 18 -> 0 (the hot highlight)
e = L.property("ADBE Effect Parade").property("TECH CC Light Sweep 1");
key(e.property("Sweep Intensity"), F502, 0);
e = L.property("ADBE Effect Parade").property("TECH CC Light Sweep 1");
key(e.property("Sweep Intensity"), F526, 18);
e = L.property("ADBE Effect Parade").property("TECH CC Light Sweep 1");
key(e.property("Sweep Intensity"), F622, 0);

// Scale 100 -> 75.7 % by 5:02, about the lockup centre
P.tf(L, "ADBE Anchor Point").setValue([cx, cy]);
P.tf(L, "ADBE Position").setValue([cx, cy]);
key(P.tf(L, "ADBE Scale"), 0, [100, 100]);
key(P.tf(L, "ADBE Scale"), F502, [75.7, 75.7]);

lk.hideShyLayers = false;
return { comp: c.name, id: c.id, layers: c.numLayers, markH: markH, scaleK: K, font: fontName, endTime: T(F622) };

// Technique 12: hollow glowing ring from a filled orb (inverted matte), then Echo trails.
// VERIFY:
// VERIFY: match names "CC Sphere", "ADBE Turbulent Displace", "ADBE Radial Blur", "ADBE Echo", "ADBE Ramp" (display names may not work with canAddProperty)
// VERIFY: CC Sphere property names "Radius", "Offset", "Render"; Render dropdown 1 Full, 2 Outside, 3 Inside
// VERIFY: Turbulent Displace names "Displacement", "Amount", "Size", "Offset (Turbulence)", "Complexity", "Evolution", "Pinning"; Displacement 1 = Turbulent, Pinning 1 = Pin All
// VERIFY: Radial Blur names "Amount", "Type", "Center", "Antialiasing (Best Quality)"; Type 1 = Spin; Antialiasing 1 = Low
// VERIFY: Echo names "Echo Time (seconds)", "Number Of Echoes", "Starting Intensity", "Decay", "Echo Operator"; Add is dropdown item 1
// VERIFY: layer.setTrackMatte(matteLayer, TrackMatteType.ALPHA_INVERTED) exists (AE 23+) and keeps the matte layer visible-switch as set
// VERIFY: Gradient Ramp names "Start of Ramp", "Start Color", "End of Ramp", "End Color", "Ramp Shape" (1 Linear)
// VERIFY: layer.blendingMode = BlendingMode.SCREEN on a solid
// VERIFY: CC Sphere on a comp-sized layer makes alpha outside the sphere (so the inverted matte works)
$.evalFile(args.prelude);

var W = 1080, H = 1920, FPS = 24;
var R = 240;               // ASSUMED: sphere radius; ring ~44% of the width (recipe: scale to the share, not 680)
var RATIO = 650.6 / 680;   // matte radius / orb radius (step 7)

function setDrop(prop, v) { prop.setValue(v); }

function sphereFx(layer, r0, r1) {
  var e = P.effect(layer, "CC Sphere");
  e.property("Radius").setValueAtTime(0, r0);
  e.property("Radius").setValueAtTime(6 / FPS, r1);   // keys at frame 0 and 6 (step 1)
  e.property("Offset").setValue([W / 2, H / 2]);
  e.property("Render").setValue(2);                    // Outside
}
function turbFx(layer) {
  var e = P.effect(layer, "ADBE Turbulent Displace");
  e.property("Displacement").setValue(1);              // Turbulent
  e.property("Amount").setValue(40);                   // ASSUMED: 50 was for a 3840 comp
  e.property("Size").setValue(200);                    // ASSUMED: 351 scaled down for the smaller comp
  e.property("Offset (Turbulence)").setValue([W / 2, H / 2]);
  e.property("Complexity").setValue(1);
  e.property("Pinning").setValue(1);                   // Pin All
  // ASSUMED: the recipe says the wobble moves but gives no Evolution keys; same keys on both layers keep the shapes identical
  e.property("Evolution").setValueAtTime(0, 0);
  e.property("Evolution").setValueAtTime(6, 720);
}

// Source comps
var gsrc = P.freshComp("12 src gradient orb", W, H, FPS, 6, [0, 0, 0]);
var g1 = P.solid(gsrc, "teal to violet", [0, 0, 0]);
var rp = P.effect(g1, "ADBE Ramp");
rp.property("Start of Ramp").setValue([0, 0]);
rp.property("Start Color").setValue([0.1, 0.55, 0.6]);      // teal, upper left
rp.property("End of Ramp").setValue([W * 0.4, H]);
rp.property("End Color").setValue([0.2, 0.2, 0.65]);        // violet-blue, bottom
rp.property("Ramp Shape").setValue(1);
var g2 = P.solid(gsrc, "cyan right", [0, 0, 0]);
var rp2 = P.effect(g2, "ADBE Ramp");
rp2.property("Start of Ramp").setValue([W, H * 0.4]);
rp2.property("Start Color").setValue([0.1, 0.7, 1]);        // cyan, right edge
rp2.property("End of Ramp").setValue([W * 0.45, H * 0.4]);
rp2.property("End Color").setValue([0, 0, 0]);
rp2.property("Ramp Shape").setValue(1);
g2.blendingMode = BlendingMode.SCREEN;

var wsrc = P.freshComp("12 src white shape", W, H, FPS, 6, [0, 0, 0]);
P.solid(wsrc, "white", [1, 1, 1]);                           // step 2

// Orb comp: matte layer above, orb below with inverted matte (steps 1, 4-7)
var oc = P.freshComp("12 src ring orb", W, H, FPS, 6, [0, 0, 0]);
var orb = oc.layers.add(gsrc);
orb.name = "orb";
sphereFx(orb, R, R * 1.05);
turbFx(orb);
var matte = oc.layers.add(wsrc);
matte.name = "matte shape";
// step 5/7: matte radius smaller than the orb's by the ratio (650.6 / 680)
sphereFx(matte, R * RATIO, R * 1.05 * RATIO);
turbFx(matte);
var rb = P.effect(matte, "ADBE Radial Blur");
rb.property("Amount").setValue(14);
rb.property("Type").setValue(1);                             // Spin
rb.property("Center").setValue([W / 2, H / 2]);
rb.property("Antialiasing (Best Quality)").setValue(1);      // Low
// matte is added last so it is on top; orb below uses it
orb.setTrackMatte(matte, TrackMatteType.ALPHA_INVERTED);

// Technique comp (step 8-11)
var c = P.freshComp("12 ring orb matte and echo", W, H, FPS, 5, [0, 0, 0]);
// art (brief.md): Ground backdrop at the bottom, in project folder "art 12"
var artFolder = null, ai;
for (ai = 1; ai <= app.project.numItems; ai++) { var itm = app.project.item(ai); if (itm instanceof FolderItem && itm.name === "art 12") artFolder = itm; }
var bgItem = null;
if (artFolder) { for (ai = 1; ai <= artFolder.numItems; ai++) if (artFolder.item(ai).name === "backdrop.png") bgItem = artFolder.item(ai); }
if (!artFolder) { artFolder = app.project.items.addFolder("art 12"); }
if (!bgItem) { bgItem = app.project.importFile(new ImportOptions(new File(args.art + "/backdrop.png"))); bgItem.parentFolder = artFolder; }
var ground = c.layers.add(bgItem);
ground.name = "Ground";
var lower = c.layers.add(oc);
lower.name = "orb (fades out)";
var upper = c.layers.add(oc);                                // SUBSTITUTE: Alt-drag replace; same comp added twice
upper.name = "TECH ring (echo)";
upper.blendingMode = BlendingMode.ADD;                       // brief: Add so echoes sum to a glow
upper.moveBefore(lower);
// step 9: lower orb opacity 100 -> 0 over 14 frames
var t0 = 0.5;
var op = P.tf(lower, "ADBE Opacity");
op.setValueAtTime(t0, 100);
op.setValueAtTime(t0 + 14 / FPS, 0);
// step 10: Echo on the upper layer
var ec = P.effect(upper, "ADBE Echo");
ec.property("Echo Time (seconds)").setValue(-0.3);
ec.property("Starting Intensity").setValue(1);
ec.property("Decay").setValue(1);
ec.property("Echo Operator").setValue(1);                    // Add
// step 11: count 0 -> 4 over ~0.4 s (ASSUMED start at the same moment as the fade)
ec.property("Number Of Echoes").setValueAtTime(t0, 0);
ec.property("Number Of Echoes").setValueAtTime(t0 + 0.4, 4);

return { comp: c.name, id: c.id, layers: c.numLayers };

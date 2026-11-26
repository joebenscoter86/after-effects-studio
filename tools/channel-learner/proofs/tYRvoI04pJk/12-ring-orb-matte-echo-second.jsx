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
var A = args || {};
var R = A.R || 290;                 // ASSUMED: sphere radius at t=0 (ring ~50% of the width at the render moment)
var RATIO = 650.6 / 680;            // matte radius / orb radius (step 7)
var CX = A.cx || 500, CY = 960;     // ring centre (48% across, 50% down at ~1.5 s)
var AMT = (A.amt !== undefined) ? A.amt : 32;      // Turbulent Amount (recipe 50 at R=680; raised for one pinch + one bulge)
var SIZE = (A.size !== undefined) ? A.size : 150;  // Turbulent Size
var TOX = (A.ox !== undefined) ? A.ox : W / 2, TOY = (A.oy !== undefined) ? A.oy : H / 2;
var EVO = (A.evo !== undefined) ? A.evo : 150;     // Evolution degrees over 6 s (slow: copies change shape, not swing)
var SHRINK = 0.1, DRIFT = 0.05, DRIFTY = (A.dy !== undefined) ? A.dy : 0.05;                    // per second: radius shrink and centre drift to the right, as shares of R

// radius/centre keys: the ring shrinks and drifts right so later (echo) copies nest inside the front line, most at the left
function sphereFx(layer, k) {
  var e = P.effect(layer, "CC Sphere");
  var T1 = 2.5;
  e.property("Radius").setValueAtTime(0, R * k);
  e.property("Radius").setValueAtTime(T1, R * k * (1 - SHRINK * T1));
  e.property("Offset").setValueAtTime(0, [CX, CY]);
  e.property("Offset").setValueAtTime(T1, [CX + DRIFT * R * T1, CY - DRIFTY * R * T1]);
  e.property("Render").setValue(2);                    // Outside
  // flat shading so the gradient (not CC Sphere's default light from the left) sets where the ring is bright
  e.property("Ambient").setValue(100);
  e.property("Diffuse").setValue(0);
  e.property("Specular").setValue(0);
}
function turbFx(layer) {
  var e = P.effect(layer, "ADBE Turbulent Displace");
  e.property("Displacement").setValue(1);              // Turbulent
  e.property("Amount").setValue(AMT);
  e.property("Size").setValue(SIZE);
  e.property("Offset (Turbulence)").setValue([TOX, TOY]);
  e.property("Complexity").setValue(1);
  e.property("Pinning").setValue(1);                   // Pin All
  e.property("Evolution").setValueAtTime(0, 0);
  e.property("Evolution").setValueAtTime(6, EVO);
}

// Source comps: the gradient orb. Cyan end on the right / upper right, dim teal upper left, dim violet-blue bottom.
var gsrc = P.freshComp("12 src gradient orb", W, H, FPS, 6, [0, 0, 0]);
var g1 = P.solid(gsrc, "teal to violet", [0, 0, 0]);
var rp = P.effect(g1, "ADBE Ramp");
rp.property("Start of Ramp").setValue([CX - 0.75 * R, CY - 0.6 * R]);
rp.property("Start Color").setValue([0.07, 0.20, 0.22]);    // teal, upper left (dim)
rp.property("End of Ramp").setValue([CX - 0.2 * R, CY + 0.95 * R]);
rp.property("End Color").setValue([0.10, 0.11, 0.30]);      // violet-blue, bottom
rp.property("Ramp Shape").setValue(1);
var g2 = P.solid(gsrc, "cyan right", [0, 0, 0]);
var rp2 = P.effect(g2, "ADBE Ramp");
rp2.property("Start of Ramp").setValue([CX + 0.95 * R, CY - 0.37 * R]);
rp2.property("Start Color").setValue([0.11, 0.32, 0.50]);      // cyan, right / upper right
rp2.property("End of Ramp").setValue([CX, CY + 0.2 * R]);
rp2.property("End Color").setValue([0, 0, 0]);
rp2.property("Ramp Shape").setValue(1);
g2.blendingMode = BlendingMode.SCREEN;

var wsrc = P.freshComp("12 src white shape", W, H, FPS, 6, [0, 0, 0]);
P.solid(wsrc, "white", [1, 1, 1]);                           // step 2

// Filled orb comp (the original orb: this is the lower layer that fades)
var fc = P.freshComp("12 src filled orb", W, H, FPS, 6, [0, 0, 0]);
var forb = fc.layers.add(gsrc);
forb.name = "orb";
sphereFx(forb, 1);
turbFx(forb);

// Orb comp: matte layer above, orb below with inverted matte (steps 1, 4-7)
var oc = P.freshComp("12 src ring orb", W, H, FPS, 6, [0, 0, 0]);
var orb = oc.layers.add(gsrc);
orb.name = "orb";
sphereFx(orb, 1);
turbFx(orb);
var matte = oc.layers.add(wsrc);
matte.name = "matte shape";
sphereFx(matte, RATIO);                                      // step 5/7: matte radius = orb radius x 650.6/680
turbFx(matte);
var rb = P.effect(matte, "ADBE Radial Blur");
rb.property("Amount").setValue(14);
rb.property("Type").setValue(1);                             // Spin
rb.property("Center").setValue([CX, CY]);
rb.property("Antialiasing (Best Quality)").setValue(1);      // Low
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
var lower = c.layers.add(fc);
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

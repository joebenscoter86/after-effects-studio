// Technique 10: glowing liquid orb from blurred wiggling shapes, wrapped on CC Sphere, lumped by Turbulent Displace.
// VERIFY: matchName "ADBE Vector Filter - Wiggler" for Wiggle Paths
// VERIFY: Wiggle Paths property match names ADBE Vector Wiggler Size / Detail / Points / Speed (Wiggles/Second)
// VERIFY: Wiggle Paths Points enum: 1 = Corner, 2 = Smooth (assumed)
// VERIFY: Radial Blur display names "Amount", "Center", "Type"; Type enum 1 = Spin, 2 = Zoom
// VERIFY: CC Sphere display names "Rotation Y", "Rotation Z", "Radius", "Offset", "Render", "Light Intensity", "Light Height", "Light Direction", "Ambient", "Diffuse", "Specular", "Roughness", "Metal", "Reflective" (may need to be read from the Rotation / Light / Shading groups)
// VERIFY: CC Sphere Render enum: 1 Full, 2 Outside, 3 Inside (Outside = 2 assumed)
// VERIFY: Turbulent Displace names "Displacement", "Amount", "Size", "Offset (Turbulence)", "Complexity", "Evolution", "Pinning"; Displacement 1 = Turbulent; Pinning enum: 1 No Pinning, 2 Pin All (assumed)
// VERIFY: addProperty("ADBE Vector Filter - Wiggler") on a group's Contents is allowed
// VERIFY: Radius with the overshoot expression and two keys: velocityAtTime on a 1-D property works
// VERIFY: layer.adjustmentLayer = true on a solid layer
// VERIFY: the pre-comp is made as a second comp "10 orb source" (SUBSTITUTE for Layer > Pre-compose)
$.evalFile(args.prelude);

var W = 1080, H = 1920, CX = W / 2, CY = H / 2;
var src = P.freshComp("10 orb source", W, H, 24, 5, [0, 0, 0]);
var c = P.freshComp("10 liquid orb", W, H, 24, 5, [0, 0, 0]);

// --- source comp: loose shapes (big, so the blur leaves masses, not stripes) ---
// kind: "ellipse" or "rect". Fill and a thick blue-violet stroke, then Wiggle Paths.
function addBlob(layer, name, kind, size, pos, fillCol) {
  var root = layer.property("ADBE Root Vectors Group");
  var g = root.addProperty("ADBE Vector Group");
  g.name = name;
  var gi = g.propertyIndex;
  var cont = root.property(gi).property("ADBE Vectors Group");
  var shp = cont.addProperty(kind === "ellipse" ? "ADBE Vector Shape - Ellipse" : "ADBE Vector Shape - Rect");
  shp = root.property(gi).property("ADBE Vectors Group").property(shp.propertyIndex);
  shp.property(kind === "ellipse" ? "ADBE Vector Ellipse Size" : "ADBE Vector Rect Size").setValue(size);
  var f = root.property(gi).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
  root.property(gi).property("ADBE Vectors Group").property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(fillCol);
  var s = root.property(gi).property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
  var si = s.propertyIndex;
  root.property(gi).property("ADBE Vectors Group").property(si).property("ADBE Vector Stroke Color").setValue([0.12, 0.10, 0.45, 1]); // ASSUMED dark blue-violet
  root.property(gi).property("ADBE Vectors Group").property(si).property("ADBE Vector Stroke Width").setValue(70); // ASSUMED: recipe says 38-50 on 3840 wide; scaled up for a thicker violet share
  var w = root.property(gi).property("ADBE Vectors Group").addProperty("ADBE Vector Filter - Wiggler");
  var wi = w.propertyIndex;
  var wp = root.property(gi).property("ADBE Vectors Group").property(wi);
  wp.property("ADBE Vector Wiggler Size").setValue(243 * 0.6); // ASSUMED: 243 scaled for the smaller comp
  wp.property("ADBE Vector Wiggler Detail").setValue(0);
  wp.property("ADBE Vector Wiggler Points").setValue(2);
  wp.property("ADBE Vector Wiggler Speed").setValue(2);
  root.property(gi).property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue(pos);
}

var shA = src.layers.addShape();
shA.name = "shapes A";
addBlob(shA, "ellipse", "ellipse", [620, 620], [CX - 220, CY - 500], [0.15, 0.7, 0.35]); // soft green (ASSUMED values)
addBlob(shA, "rectangle", "rect", [720, 620], [CX + 150, CY + 60], [0.1, 0.8, 0.85]);   // bright cyan, right of centre (recipe: not in the middle)
var shB = src.layers.addShape();
shB.name = "shapes B";
addBlob(shB, "ellipse", "ellipse", [700, 700], [CX - 100, CY + 500], [0.1, 0.45, 0.8]); // ASSUMED: extra blue mass, second layer moves differently
addBlob(shB, "rectangle", "rect", [640, 560], [CX - 250, CY + 80], [0.12, 0.2, 0.55]);   // ASSUMED
shB.property("ADBE Transform Group").property("ADBE Position").setValue([CX + 60, CY - 40]); // "move that a bit"
// Second layer wiggles differently: different seed.
shB.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Filter - Wiggler").property("ADBE Vector Wiggler Random Seed").setValue(7);
shB.property("ADBE Root Vectors Group").property(2).property("ADBE Vectors Group").property("ADBE Vector Filter - Wiggler").property("ADBE Vector Wiggler Random Seed").setValue(11);

// Two adjustment layers with spin Radial Blur, centres on opposite sides.
var adj1 = P.solid(src, "blur 1", [1, 1, 1]);
adj1.adjustmentLayer = true;
var rb1 = P.effect(adj1, "Radial Blur");
rb1.property("Type").setValue(1);
rb1.property("Amount").setValue(102);
rb1.property("Center").setValue([300, 1400]); // recipe 848,1636 of 3840x2160, scaled to 1080x1920
var adj2 = P.solid(src, "blur 2", [1, 1, 1]);
adj2.adjustmentLayer = true;
var rb2 = P.effect(adj2, "Radial Blur");
rb2.property("Type").setValue(1);
rb2.property("Amount").setValue(120); // ASSUMED: "push the amount up more"
rb2.property("Center").setValue([780, 500]); // ASSUMED: other side

// --- main comp: the pre-comp layer with CC Sphere and Turbulent Displace ---
var orb = c.layers.add(src);
orb.name = "orb";
var R = 380; // ASSUMED: 680 of a 2160 high comp scaled to 9:16 so the orb is about 70% of the width

var sph = P.effect(orb, "CC Sphere");
sph.property("Radius").setValue(R);
sph.property("Offset").setValue([CX, CY]);
sph.property("Render").setValue(2);
sph.property("Light Intensity").setValue(264);
sph.property("Light Height").setValue(100);
sph.property("Light Direction").setValue(-85);
sph.property("Ambient").setValue(10);
sph.property("Diffuse").setValue(100);
sph.property("Specular").setValue(10);
sph.property("Roughness").setValue(0.05);
sph.property("Metal").setValue(100);
sph.property("Reflective").setValue(0);
// Reflection Map (the layer itself) not set: stays at its default. ASSUMED harmless.
sph.property("Rotation Z").expression = "time*50";

var td = P.effect(orb, "Turbulent Displace");
td.property("Displacement").setValue(1);
td.property("Amount").setValue(45);   // ASSUMED: raised from the scaled 28 so the outline swings about 1.3
td.property("Size").setValue(200);    // about 0.52 of the radius
td.property("Complexity").setValue(1);
td.property("Offset (Turbulence)").setValue([CX, CY]);
td.property("Pinning").setValue(2);
td.property("Evolution").expression = "time*100";

// Pop-in: Radius 0 -> R, Rotation Y 78 -> 0, easy ease, bounce overshoot on Radius.
sph = orb.property("ADBE Effect Parade").property("CC Sphere");
var rad = sph.property("Radius");
rad.setValueAtTime(0, 0);
rad.setValueAtTime(1, R); // ASSUMED: second key at 1 s, not read in the recipe
var ry = sph.property("Rotation Y");
ry.setValueAtTime(0, 78);
ry.setValueAtTime(2, 0);
var ease = new KeyframeEase(0, 33.33);
var k;
for (k = 1; k <= 2; k++) {
  rad.setTemporalEaseAtKey(k, [ease], [ease]);
  ry.setTemporalEaseAtKey(k, [ease], [ease]);
}
// ASSUMED: the author's pinned-comment text is not in the recipe; this is the standard overshoot with amp .04, freq 1.8, decay 3.
rad.expression =
  "amp = .04; freq = 1.8; decay = 3;\n" +
  "n = 0;\n" +
  "if (numKeys > 0) { n = nearestKey(time).index; if (key(n).time > time) n--; }\n" +
  "if (n > 0) { t = time - key(n).time; v = velocityAtTime(key(n).time - thisComp.frameDuration / 10); value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t); } else { value; }";

return { comp: c.name, id: c.id, layers: c.numLayers, source: src.name };

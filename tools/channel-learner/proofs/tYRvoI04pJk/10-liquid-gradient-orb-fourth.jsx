// Technique 10: glowing liquid orb from blurred wiggling shapes, CC Sphere and Turbulent Displace.
// VERIFIED: Wiggle Paths match name is "ADBE Vector Filter - Roughen" (Wiggler is Wiggle Transform); children Size, Detail, Points, Wiggles/Second, Correlation, Random Seed.
// VERIFY: Wiggle Paths "Points" dropdown: Smooth = 2 (Corner = 1)
// VERIFY: Wiggle Paths "Size" and "Detail" are named exactly that (Size may be "Size", Detail "Detail")
// VERIFY: Radial Blur display name "Radial Blur"; property names "Type", "Amount", "Center"; Type Spin = 1 (Zoom = 2)
// VERIFY: Adjustment layer made via addSolid then .adjustmentLayer = true
// VERIFY: CC Sphere display name "CC Sphere"; top-level "Radius", "Offset", "Render"; Render Outside = 2 (Full 1, Inside 3)
// VERIFY: CC Sphere groups are named "Rotation", "Light", "Shading" with children "Rotation Y", "Rotation Z", "Light Intensity", "Light Height", "Light Direction", "Ambient", "Diffuse", "Specular", "Roughness", "Metal", "Reflective"
// VERIFY: Turbulent Displace display name "Turbulent Displace"; properties "Displacement" (Turbulent = 1), "Amount", "Size", "Offset (Turbulence)", "Complexity", "Evolution", "Pinning" (Pin All = 2?)
// VERIFY: Expression on an effect property accepts numKeys / nearestKey / velocityAtTime (bounce)
// VERIFY: KeyframeEase(0, 33.33) for easy ease (F9) via setTemporalEaseAtKey
// VERIFY: layers.add(compItem) in the main comp for the source comp; source comp is removed by name on re-run
$.evalFile(args.prelude);

// Local helper (prelude candidate): find a child by display name inside a group, throw when missing.
function need(parent, name) {
  var p = parent.property(name);
  if (!p) throw new Error("property not found: " + name);
  return p;
}

// Remove any earlier build: main comp first, then the source comp.
var LIGHTH = (args && args.lightH) || 70, TDAMT = (args && args.tdAmt) || 40;
var c = P.freshComp("10 liquid gradient orb", 1080, 1920, 24, 5, [0, 0, 0]);
// SUBSTITUTE: the recipe pre-composes all layers by menu (Cmd+Shift+C, dialog); we build the layers in a source comp and add it as a layer.
var src = P.freshComp("10 orb source", 1080, 1920, 24, 5, [0, 0, 0]);

var ground = src.layers.addSolid([0.10, 0.15, 0.46], "violet ground", 1080, 1920, 1, 5); // recipe step 1: orb comp on a black ground; without it the sphere is half transparent
// ASSUMED: recipe comp is 3840x2160; scaled for a 1080x1920 frame (radius 400 gives an orb about 74% of the width).
function wiggleShape(name, kind, fillColor, seed, pos, dim) {
  dim = dim || 1;
  var l = src.layers.addShape();
  l.name = name;
  var g = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
  var gi = g.propertyIndex;
  var cont = function () { return l.property("ADBE Root Vectors Group").property(gi).property("ADBE Vectors Group"); };
  var shp;
  if (kind === "ellipse") {
    shp = cont().addProperty("ADBE Vector Shape - Ellipse");
    cont().property(shp.propertyIndex).property("ADBE Vector Ellipse Size").setValue([380 * dim, 380 * dim]);
  } else {
    shp = cont().addProperty("ADBE Vector Shape - Rect");
    cont().property(shp.propertyIndex).property("ADBE Vector Rect Size").setValue([420 * dim, 300 * dim]);
  }
  var w = cont().addProperty("ADBE Vector Filter - Roughen");
  var wi = w.propertyIndex;
  var wp = cont().property(wi);
  need(wp, "Size").setValue(70); // ASSUMED: 243 scaled down for the smaller comp
  need(wp, "Detail").setValue(0);
  need(wp, "Points").setValue(2);
  need(wp, "Wiggles/Second").setValue(2);
  need(wp, "Random Seed").setValue(seed); // ASSUMED: recipe leaves seed at 0; offset on the copy so the two differ
  var f = cont().addProperty("ADBE Vector Graphic - Fill");
  cont().property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(fillColor);
  var s = cont().addProperty("ADBE Vector Graphic - Stroke");
  var si = s.propertyIndex;
  cont().property(si).property("ADBE Vector Stroke Color").setValue([0.165, 0.165, 0.549, 1]); // ASSUMED dark blue-violet
  cont().property(si).property("ADBE Vector Stroke Width").setValue(40); // ASSUMED: 38 px in the video, scaled
  l.property("ADBE Transform Group").property("ADBE Position").setValue(pos);
  return l;
}

// Layer 1 holds the ellipse and rectangle; layer 2 is the copy offset for a different layout.
// Round 4: three large masses (each about the sphere radius or more), no stripes-sized shapes.
var a = wiggleShape("shapes A ellipse", "ellipse", [0.373, 0.827, 0.553, 1], 0, [400, 760], 0.8); // small green patch top-left
var b = wiggleShape("shapes A rect", "rect", [0.16, 0.62, 0.66, 1], 0, [650, 960], 1.6); // broad cyan mass right of centre
var a2 = wiggleShape("shapes B ellipse", "ellipse", [0.12, 0.45, 0.85, 1], 7, [420, 1100], 1.7); // azure/blue mass left-below
function radial(name, amount, center) {
  var l = src.layers.addSolid([1, 1, 1], name, 1080, 1920, 1, 5);
  l.adjustmentLayer = true;
  var e = P.effect(l, "ADBE Radial Blur");
  need(e, "Type").setValue(1);
  need(e, "Amount").setValue(amount);
  need(e, "Center").setValue(center);
  return l;
}
// ASSUMED: centres scaled from 848,1636 of 3840x2160; second mirrored; amounts 64 raised to 102 and a stronger second pass (recipe: second not read).
// Round 2 (review): ~a third of the smear is blue-violet, no black left in the source.
radial("blur 1", 50, [300, 1450]);
radial("blur 2", 70, [780, 470]);

// Main comp: source layer with the sphere.
var o = c.layers.add(src);
o.name = "TECH orb";
var sph = P.effect(o, "CC Sphere");
sph.name = "TECH CC Sphere";
need(sph, "Radius").setValue(200); // ASSUMED: 680 scaled for the 1080 wide frame
need(sph, "Offset").setValue([540, 864]);
need(sph, "Render").setValue(2);
var lt = sph; // CC Sphere params are flat (Light/Shading/Rotation are header params, not groups)
need(lt, "Light Intensity").setValue((args && args.lightI) || 180); // recipe 264 clips the body to cyan on this source; lowered per review (a) // render check: raised later if murky
need(lt, "Light Height").setValue(LIGHTH);
need(lt, "Light Direction").setValue(-85);
var sh = sph;
need(sh, "Ambient").setValue(10);
need(sh, "Diffuse").setValue(100);
need(sh, "Specular").setValue(10);
need(sh, "Roughness").setValue(0.05);
need(sh, "Metal").setValue(100);
need(sh, "Reflective").setValue(0);
var rot = sph;
need(rot, "Rotation Z").expression = "time*50";

var td = P.effect(o, "ADBE Turbulent Displace");
td.name = "TECH Turbulent Displace";
need(td, "Displacement").setValue(1);
need(td, "Amount").setValue(TDAMT); // ASSUMED: 50 scaled
need(td, "Size").setValue(100); // ASSUMED: 350 scaled
need(td, "Complexity").setValue(1);
need(td, "Offset (Turbulence)").setValue([540, 864]);
need(td, "Pinning").setValue(2); // Pin All; VERIFY index
need(td, "Evolution").expression = "time*100";

// Pop-in. Re-fetch the effect by name after adding more effects.
var fx = o.property("ADBE Effect Parade");
var sph2 = fx.property("TECH CC Sphere");
var rad = need(sph2, "Radius");
rad.setValueAtTime(0, 0);
rad.setValueAtTime(1.2, 200); // ASSUMED: second key time and value not read
var ry = need(sph2, "Rotation Y");
ry.setValueAtTime(0, 78);
ry.setValueAtTime(2, 0);
var ease = new KeyframeEase(0, 33.33); // F9 easy ease
var k;
for (k = 1; k <= 2; k++) {
  rad.setTemporalEaseAtKey(k, [ease], [ease]);
  ry.setTemporalEaseAtKey(k, [ease], [ease]);
}
// ASSUMED: the pinned-comment text is unknown beyond "amp = .04; freq = 1.8", decay 3, time_max 3; standard overshoot written here.
rad.expression =
  "amp = .04; freq = 1.8; decay = 3; time_max = 3;\n" +
  "n = 0;\n" +
  "if (numKeys > 0) { n = nearestKey(time).index; if (key(n).time > time) n--; }\n" +
  "if (n == 0 || time - key(n).time > time_max) { value; } else {\n" +
  "  t = time - key(n).time;\n" +
  "  v = velocityAtTime(key(n).time - .001);\n" +
  "  value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);\n" +
  "}";

return { comp: c.name, id: c.id, layers: c.numLayers, source: src.name };

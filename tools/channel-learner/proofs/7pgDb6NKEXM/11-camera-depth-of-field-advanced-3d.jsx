// Technique 11: three glossy extruded plates in a receding diagonal row, seen through an Advanced 3D two-node camera with depth of field and a slow orbit.
// args: prelude, artLib, artDir (PROOF/11/art), opts (optional overrides for tuning: plateScale, plateRot, positions, floorY, aperture, blurLevel, focus, lightRot)
// VERIFY:
// Advanced 3D renderer is "ADBE Calder" (found building 10)
// Camera Options: "ADBE Camera Depth of Field", "ADBE Camera Aperture", "ADBE Camera Focus Distance", "ADBE Camera Focus Area Width", "ADBE Camera Split Blur Level" (Near, Far Blur Level, two values)
// Two-node camera: addCamera gives a two-node camera (Point of Interest = Anchor Point)
// Fix pass: rotation X 0, Y -64, Z 0 (corrected recipe: left edge nearer). Floor 952 and Shadow Darkness 66 % as the recipe gives reach 0.42 of the floor.
// ASSUMED (tuned to the layout, the recipe allows it): plate Scale 66 % (recipe 64 % of an unknown plate size), Rotation X -5 Y +60 Z 0
//   (not shown; +60 turns the right side to the camera and makes the faces tall and narrow), floor Y 905 and Scale 3000 %.
// TUNED: Aperture 17 px with Near, Far Blur Level 462 % and Focus Distance 2102.7 as shown (recipe: 181.3 does not transfer; match edge widths).
// TUNED: Shadow Darkness 100 % (recipe 66 % inferred unchanged, listed as unknown); 66 % gave 0.69 of the floor against the measured 0.43.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
var o = args.opts || {};
function opt(k, d) { return (o[k] !== undefined) ? o[k] : d; }

var c = P.freshComp("11 camera-depth-of-field-advanced-3d", 1920, 1080, 23.976, 5, ART.hex("#EDF5F7"));
c.renderer = "ADBE Calder";
if (c.renderer !== "ADBE Calder") throw new Error("renderer did not take: " + c.renderer);
var folder = "art 11";

var bg = P.solid(c, "background", ART.hex("#E9EFF2"));
var ramp = P.effect(bg, "ADBE Ramp");
var miss = ART.setFx(ramp, { "Start of Ramp": [0, 540], "Start Color": ART.hex("#E9EFF2"), "End of Ramp": [1920, 540], "End Color": ART.hex("#EFFAFB") });
if (miss.length) throw new Error("ramp params: " + miss.join(", "));

var floor = c.layers.addParametricMesh("floor", ParametricMeshType.PLANE);
P.tf(floor, "ADBE Rotate X").setValue(90);
P.tf(floor, "ADBE Position").setValue([960, opt("floorY", 952), 0]);
var fs = opt("floorScale", 3000); // ASSUMED: recipe 888 %, but in this camera its far edge shows (the recipe's pitfall); scaled until it leaves the picture
P.tf(floor, "ADBE Scale").setValue([fs, fs, fs]);
floor.property("ADBE Compositing Options Group").property("ADBE Accepts Shadows").setValue(2);

function makePlate(name, gname, file, pos) {
  var sh = P.shape(c, name);
  var rr = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  rr.property("ADBE Vector Rect Size").setValue([1000, 1160]);
  P.contents(sh).property(1).property("ADBE Vector Rect Roundness").setValue(120);
  var fill = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  P.contents(sh).property(fill.propertyIndex).property("ADBE Vector Fill Color").setValue(ART.hex("#121315"));
  var plate = sh.layer;
  plate.threeDLayer = true;
  var s = opt("plateScale", 66);
  P.tf(plate, "ADBE Position").setValue(pos);
  P.tf(plate, "ADBE Scale").setValue([s, s, s]);
  var r = opt("plateRot", [0, -64, 0]); // fix pass: corrected recipe, left edge nearer (Y -64)
  P.tf(plate, "ADBE Rotate X").setValue(r[0]);
  P.tf(plate, "ADBE Rotate Y").setValue(r[1]);
  P.tf(plate, "ADBE Rotate Z").setValue(r[2]);
  plate.property("ADBE Extrsn Options Group").property("ADBE Extrsn Depth").setValue(26);
  var mo = plate.property("ADBE Material Options Group");
  mo.property("ADBE Casts Shadows").setValue(1);
  mo.property("ADBE Accepts Shadows").setValue(1);
  mo.property("ADBE Accepts Lights").setValue(1);
  mo.property("ADBE Shininess Coefficient").setValue(100);
  mo.property("ADBE Metal Coefficient").setValue(78);
  var g = c.layers.add(ART.footage(args.artDir, file, folder));
  g.name = gname;
  g.threeDLayer = true;
  g.parent = plate;
  // Parenting keeps the world transform; reset so the graphics lie on the plate face.
  P.tf(g, "ADBE Orientation").setValue([0, 0, 0]);
  P.tf(g, "ADBE Rotate X").setValue(0);
  P.tf(g, "ADBE Rotate Y").setValue(0);
  P.tf(g, "ADBE Rotate Z").setValue(0);
  P.tf(g, "ADBE Scale").setValue([50, 50, 50]);
  P.tf(g, "ADBE Position").setValue([0, 0, -1]);
  var gm = g.property("ADBE Material Options Group");
  gm.property("ADBE Accepts Lights").setValue(0);
  gm.property("ADBE Accepts Shadows").setValue(1);
  return plate;
}
// Fix pass: X shifted right (+90, +110, +30) from the shown 506 / 826 / 1136 so each plate covers the right part of the one behind
// and the row sits on the layout shares with our plate size.
var pos = opt("positions", [[596, 459, 362], [936, 459, 140], [1166, 459, 0]]);
// Rear first so the layer order reads rear > middle > front (depth sorting is by Z in Advanced 3D anyway).
makePlate("plate rear", "graphics rear", "panel-c-graphics.png", pos[0]);
makePlate("plate middle", "graphics middle", "panel-b-graphics.png", pos[1]);
makePlate("plate front", "graphics front", "panel-a-graphics.png", pos[2]);

var L = c.layers.addLight("Environment Light", [960, 540]);
L.lightType = LightType.ENVIRONMENT;
var lr = opt("lightRot", [7, 0]);
P.tf(L, "ADBE Rotate X").setValue(lr[0]);
P.tf(L, "ADBE Rotate Y").setValue(lr[1]);
var lo = L.property("ADBE Light Options Group");
lo.property("ADBE Light Intensity").setValue(opt("intensity", 136));
lo.property("ADBE Casts Shadows").setValue(1);
lo.property("ADBE Light Shadow Darkness").setValue(opt("darkness", 66));

// Two-node camera, 50 mm preset (Zoom 2666.7 px in a 1920 comp), depth of field on.
var cam = c.layers.addCamera("Camera 1", [960, 540]);
var co = cam.property("ADBE Camera Options Group");
co.property("ADBE Camera Zoom").setValue(2666.7);
co.property("ADBE Camera Depth of Field").setValue(1);
co.property("ADBE Camera Aperture").setValue(opt("aperture", 17));
co.property("ADBE Camera Focus Distance").setValue(opt("focus", 2102.7));
co.property("ADBE Camera Focus Area Width").setValue(0);
var bl = opt("blurLevel", 462);
co.property("ADBE Camera Split Blur Level").setValue([bl, bl]);
var t2 = 118 / 23.976; // 0:00:04:22
var poi = P.tf(cam, "ADBE Anchor Point"), cp = P.tf(cam, "ADBE Position");
poi.setValueAtTime(0, [934.0, 490.2, 0.0]);
cp.setValueAtTime(0, [934.0, 490.2, -2388.6]);
poi.setValueAtTime(t2, [921.9, 493.6, 16.6]);
cp.setValueAtTime(t2, [1325.2, 365.5, -2334.2]);
// ASSUMED: linear keys (the recipe: "plain linear diamonds"); setValueAtTime gives linear by default.

return { comp: c.name, id: c.id, layers: c.numLayers, t2: t2, camAuto: cam.autoOrient };

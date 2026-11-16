// Technique 10: a flat UI graphic on a glossy extruded plate (Advanced 3D), floating over a pale floor with a cast shadow.
// args: prelude, artLib, artDir (PROOF/10/art), opts (optional overrides: plateScale, platePos, plateRot, floorY, lightRot, intensity, darkness)
// VERIFY:
// comp.renderer: RESOLVED, Advanced 3D is "ADBE Calder" on AE 27.0 ("ADBE Advanced 3d" is Classic 3D)
// layers.addParametricMesh(name, ParametricMeshType.PLANE) (confirmed by probe); its Accepts Shadows lives in Compositing Options, Only = 2?
// The plane mesh's default orientation (faces camera?), so X Rotation 90 lays it flat
// Environment light shadow direction from X 92 / Y 200 in our scene
// SUBSTITUTE: the tutorial pre-composes template elements; our graphics are one PNG footage layer (art brief: "use the footage layer directly").
// ASSUMED: plate Scale 79 %, Position 950,445,0 so the 1000 x 1160 face fills the layout shares; Y Rotation 0 (recipe: close to 0).
// ASSUMED: floor Y 975 (recipe 952 in its own scene; 1003 gave a band a third too thick, 955 tucked it under the plate with no gap).
// Floor fix: Scale 3000 % (recipe 888 % is the tutorial scene's; here its far edge showed as a line at y 0.82).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
var o = args.opts || {};
function opt(k, d) { return (o[k] !== undefined) ? o[k] : d; }

var c = P.freshComp("10 2d-graphics-on-extruded-3d-plate", 1920, 1080, 23.976, 4, ART.hex("#EDF5F7"));
c.renderer = "ADBE Calder"; // Advanced 3D is "ADBE Calder"; "ADBE Advanced 3d" is Classic 3D (hides Geometry Options)
if (c.renderer !== "ADBE Calder") throw new Error("renderer did not take: " + c.renderer);
var folder = "art 10";

// Background: near-white cool, a touch lighter to the right (recipe's measured 233,239,242 -> 240,251,252).
var bg = P.solid(c, "background", ART.hex("#E9EFF2"));
var ramp = P.effect(bg, "ADBE Ramp");
var miss = ART.setFx(ramp, { "Start of Ramp": [0, 540], "Start Color": ART.hex("#E9EFF2"), "End of Ramp": [1920, 540], "End Color": ART.hex("#F0FBFC") });
if (miss.length) throw new Error("ramp params: " + miss.join(", "));

// Floor: plane mesh, shadow catcher only.
var floor = c.layers.addParametricMesh("floor", ParametricMeshType.PLANE);
P.tf(floor, "ADBE Rotate X").setValue(opt("floorRotX", 90));
P.tf(floor, "ADBE Position").setValue([960, opt("floorY", 975), 0]);
var fs = opt("floorScale", 3000); // floor fix: 888 % (the tutorial scene) leaves the far edge in view here
P.tf(floor, "ADBE Scale").setValue([fs, fs, fs]);
floor.property("ADBE Compositing Options Group").property("ADBE Accepts Shadows").setValue(opt("floorAccepts", 2));

// Plate: black rounded rectangle, extruded 26, glossy metal.
var sh = P.shape(c, "plate");
var rr = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
rr.property("ADBE Vector Rect Size").setValue([1000, 1160]);
P.contents(sh).property(1).property("ADBE Vector Rect Roundness").setValue(120);
var fill = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
P.contents(sh).property(fill.propertyIndex).property("ADBE Vector Fill Color").setValue(ART.hex("#121315"));
var plate = sh.layer;
plate.threeDLayer = true;
var ps = opt("plateScale", 78); // fix pass: recipe 10 build note, Scale 78 % at the result
P.tf(plate, "ADBE Position").setValue(opt("platePos", [950, 445, 0]));
P.tf(plate, "ADBE Scale").setValue([ps, ps, ps]);
// Fix pass: X -28.8, Y -5, Z 0 reach the sheen target (dark, warm, bright only at the lower-left corner) and a 3 deg clockwise roll.
// The sheen is very sensitive to X: -29 with Y 0 gave a white clipped band across the bottom; -36 left the plate black.
var pr = opt("plateRot", [-28.8, -5, 0]);
P.tf(plate, "ADBE Rotate X").setValue(pr[0]);
P.tf(plate, "ADBE Rotate Y").setValue(pr[1]);
P.tf(plate, "ADBE Rotate Z").setValue(pr[2]);
plate.property("ADBE Extrsn Options Group").property("ADBE Extrsn Depth").setValue(26);
var mo = plate.property("ADBE Material Options Group");
mo.property("ADBE Casts Shadows").setValue(1);
mo.property("ADBE Accepts Shadows").setValue(1);
mo.property("ADBE Accepts Lights").setValue(1);
mo.property("ADBE Shininess Coefficient").setValue(100);
mo.property("ADBE Metal Coefficient").setValue(78);

// Graphics: flat, parented to the plate at Z -1, not lit.
var gItem = ART.footage(args.artDir, "panel-a-graphics.png", folder);
var g = c.layers.add(gItem);
g.name = "graphics";
g.threeDLayer = true;
g.parent = plate;
// Setting a parent keeps the child's world transform, so the plate's rotation and scale are compensated
// into the child; reset them so the graphics lie in the plate's plane.
P.tf(g, "ADBE Orientation").setValue([0, 0, 0]);
P.tf(g, "ADBE Rotate X").setValue(0);
P.tf(g, "ADBE Rotate Y").setValue(0);
P.tf(g, "ADBE Rotate Z").setValue(0);
P.tf(g, "ADBE Scale").setValue([50, 50, 50]);
P.tf(g, "ADBE Position").setValue([0, 0, opt("graphicsZ", -1)]);
var gm = g.property("ADBE Material Options Group");
gm.property("ADBE Accepts Lights").setValue(0);
gm.property("ADBE Accepts Shadows").setValue(1);

// Environment light, shadows on.
var L = c.layers.addLight("Environment Light", [960, 540]);
L.lightType = LightType.ENVIRONMENT;
var lr = opt("lightRot", [92, 200]);
P.tf(L, "ADBE Rotate X").setValue(lr[0]);
P.tf(L, "ADBE Rotate Y").setValue(lr[1]);
var lo = L.property("ADBE Light Options Group");
lo.property("ADBE Light Intensity").setValue(opt("intensity", 136));
lo.property("ADBE Casts Shadows").setValue(1);
lo.property("ADBE Light Shadow Darkness").setValue(opt("darkness", 66));

return { comp: c.name, id: c.id, layers: c.numLayers, floorAccepts: floor.property("ADBE Compositing Options Group").property("ADBE Accepts Shadows").value, renderer: c.renderer };

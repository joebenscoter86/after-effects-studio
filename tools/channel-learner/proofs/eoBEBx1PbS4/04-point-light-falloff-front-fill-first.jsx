// eoBEBx1PbS4 technique 04: a soft front fill from a point light with Smooth falloff, on 02's scene with 03's rim light.
// args { prelude, scene }. Judge at comp time 0:00:02:21 (frame 69). The technique's light is "TECH Point Light 1":
// switch it off for the before frame (the recipe's own comparison, step 6).
// VERIFY: Light Options "Falloff" enum, Smooth = 2 (None 1, Smooth 2, Inverse Square Clamped 3); "Radius" and "Falloff Distance" display names.
$.evalFile(args.prelude);
$.evalFile(args.scene);
var c = TIDES.comp("eoBE 04 fill");
var s = TIDES.set(c);
var w = TIDES.litWord(c, s.env);
// Recipe 04 step 1: 03's rim light lowered from 316 % to 216 %.
TIDES.rim(c, "Parallel Light 1", 216);
// Steps 2-5: Point, Smooth falloff, white, Intensity 100 %, Radius 589, Falloff Distance 373, no shadows, at 456,530,-666.7.
var L = c.layers.addLight("TECH Point Light 1", [960, 540]);
L.lightType = LightType.POINT;
TIDES.prop(L.property("ADBE Transform Group"), "Position").setValue([456, 530, -666.7]);
var lo = function () { return L.property("ADBE Light Options Group"); };
TIDES.prop(lo(), "Intensity").setValue(100);
TIDES.prop(lo(), "Color").setValue([1, 1, 1]);
TIDES.prop(lo(), "Falloff").setValue(2);
TIDES.prop(lo(), "Radius").setValue(589);
TIDES.prop(lo(), "Falloff Distance").setValue(373);
// Casts Shadows is hidden on this point light under Advanced 3D (setValue throws "hidden"; even reading it as a string throws), so it is left as created.
return { comp: c.name, id: c.id, layers: c.numLayers };

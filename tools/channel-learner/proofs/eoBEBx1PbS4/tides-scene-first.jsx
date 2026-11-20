// Shared scene for eoBEBx1PbS4 techniques 01, 03 and 04 (art set "TIDES"). Loaded after the prelude.
// ExtendScript (ES3).
var TIDES = {};
TIDES.ART = "/Users/joeb/after-effects-studio/.claude/worktrees/agent-eyes-stage-7-f1d606/quality/renders/channel-study/eoBEBx1PbS4/proof/01/art";
TIDES.FPS = 23.976;
// Property of `group` by display name; throws when missing.
TIDES.prop = function (group, name) {
  var i;
  for (i = 1; i <= group.numProperties; i++) if (group.property(i).name === name) return group.property(i);
  throw new Error("property not found: " + name + " in " + group.name);
};
TIDES.hex = function (h) {
  return [parseInt(h.substr(1, 2), 16) / 255, parseInt(h.substr(3, 2), 16) / 255, parseInt(h.substr(5, 2), 16) / 255];
};
// The word. opts: scale (percent), baseline (comp y of the letter bases, or null to centre the word), fill [r,g,b].
// The tutorial sets 100 px type and scales the layer up (recipe 01 step 1: about 340 %); we do the same, so the
// recipe's Geometry Options values (Extrusion 20, Bevel 2, in layer units) keep the tutorial's proportions.
// 100 px at Scale 306 % equals the brief's 450 px at 68 %; 450 % equals its 450 px at 100 %.
TIDES.word = function (comp, opts) {
  var l = comp.layers.addText("TIDES");
  var tp = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = tp.value;
  d.resetCharStyle();
  d.font = "ArchivoBlack-Regular";
  d.fontSize = 100;
  d.tracking = -30;
  d.fillColor = opts.fill || [1, 1, 1];
  d.applyFill = true;
  d.applyStroke = false;
  d.justification = ParagraphJustification.CENTER_JUSTIFY;
  tp.setValue(d);
  l.name = "TIDES";
  l.threeDLayer = true;
  var r = l.sourceRectAtTime(0, false);
  var tf = l.property("ADBE Transform Group");
  if (opts.baseline !== undefined && opts.baseline !== null) {
    tf.property("ADBE Anchor Point").setValue([r.left + r.width / 2, 0, 0]);
    tf.property("ADBE Position").setValue([comp.width / 2, opts.baseline, 0]);
  } else {
    tf.property("ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2, 0]);
    tf.property("ADBE Position").setValue([comp.width / 2, comp.height / 2, 0]);
  }
  tf.property("ADBE Scale").setValue([opts.scale, opts.scale, opts.scale]);
  // Recipe 01 steps 4-5: Extrusion Depth 20, Bevel Style Convex, Bevel Depth 2, Hole Bevel Depth 100 %.
  var geo = l.property("ADBE Extrsn Options Group");
  geo.property("ADBE Extrsn Depth").setValue(20);
  geo.property("ADBE Bevel Styles").setValue(4); // VERIFY: None 1, Angular 2, Concave 3, Convex 4
  geo.property("ADBE Bevel Depth").setValue(2);
  geo.property("ADBE Hole Bevel Depth").setValue(100);
  return l;
};
// Recipe 01 steps 11-12, on every face slot: Scale, Uniform Tiling on, Randomize Offset on, seed 0.
// Only after the owner's hand step (Material Assignment > Add Override > All and the Material pick in the
// Properties panel): before it the four intrinsic slots are hidden and setValue throws "property ... is hidden".
TIDES.texture = function (l, scale, seed) {
  var ma = l.property("ADBE3D Material Parade"), i, a, n = ma.numProperties;
  for (i = 1; i <= n; i++) {
    a = l.property("ADBE3D Material Parade").property(i);
    a.property("ADBE3D Uniform Tiling").setValue(1);
    a.property("ADBE3D Material Scale").setValue([scale, scale]);
    a.property("ADBE3D Mat Rand Offset").setValue(1);
    a.property("ADBE3D Mat Rand Offset Seed").setValue(seed || 0);
  }
  return l;
};
// The set of recipe 02 as briefed for 03/04: backdrop, shadow-only floor, environment backlight.
TIDES.set = function (comp) {
  var col = TIDES.hex("#F6D8C2");
  var bd = comp.layers.addSolid(col, "Backdrop", comp.width, comp.height, 1, comp.duration);
  var fl = bd.duplicate();
  fl.name = "Floor";
  fl.threeDLayer = true;
  var ftf = fl.property("ADBE Transform Group");
  ftf.property("ADBE Rotate X").setValue(90);
  ftf.property("ADBE Position").setValue([960, 721, 0]);
  ftf.property("ADBE Scale").setValue([627, 627, 627]);
  var mo = fl.property("ADBE Material Options Group");
  mo.property("ADBE Accepts Shadows").setValue(2); // VERIFY: Off 0? / On 1 / Only 2
  mo.property("ADBE Casts Shadows").setValue(1);
  mo.property("ADBE Accepts Lights").setValue(1);
  var env = comp.layers.addLight("Environment Light 1", [960, 540]);
  env.lightType = LightType.ENVIRONMENT;
  var etf = env.property("ADBE Transform Group");
  etf.property("ADBE Rotate X").setValue(-25);
  var yr = env.property("ADBE Transform Group").property("ADBE Rotate Y");
  yr.setValueAtTime(0, 235);
  yr.setValueAtTime(119 / TIDES.FPS, 195);
  yr.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
  yr.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
  var lo = env.property("ADBE Light Options Group");
  TIDES.prop(lo, "Intensity").setValue(187);
  TIDES.prop(env.property("ADBE Light Options Group"), "Casts Shadows").setValue(1);
  TIDES.prop(env.property("ADBE Light Options Group"), "Shadow Darkness").setValue(100);
  return { backdrop: bd, floor: fl, env: env };
};
// Parallel rim light, recipe 03.
TIDES.rim = function (comp, name, intensity) {
  var L = comp.layers.addLight(name, [960, 540]);
  L.lightType = LightType.PARALLEL;
  var tf = L.property("ADBE Transform Group");
  TIDES.prop(tf, "Point of Interest").setValue([960, 540, 0]);
  TIDES.prop(L.property("ADBE Transform Group"), "Position").setValue([2920, -100, 2663.3]);
  var lo = L.property("ADBE Light Options Group");
  TIDES.prop(lo, "Intensity").setValue(intensity);
  TIDES.prop(L.property("ADBE Light Options Group"), "Color").setValue([1, 1, 1]);
  TIDES.prop(L.property("ADBE Light Options Group"), "Casts Shadows").setValue(0);
  return L;
};
// The lit word for 03/04: the 03/04 size (brief: 450 px at 100 % = 100 px at 450 %), letter bases on the floor line,
// casting shadows. SUBSTITUTE: the material cannot be assigned by script (see 01), so the fill carries the tile's
// mean colour, #949A79 (148,154,121, measured on paint-tile-1024.png), which the default material shades instead.
TIDES.MEAN = [148 / 255, 154 / 255, 121 / 255];
TIDES.litWord = function (comp, above) {
  var w = TIDES.word(comp, { scale: 450, baseline: 721, fill: TIDES.MEAN });
  w.property("ADBE Material Options Group").property("ADBE Casts Shadows").setValue(1);
  w.moveAfter(above);
  return w;
};
TIDES.comp = function (name) {
  var c = P.freshComp(name, 1920, 1080, TIDES.FPS, 120 / TIDES.FPS, [0, 0, 0]);
  c.renderer = "ADBE Calder"; // Advanced 3D on AE 27.0
  if (c.renderer !== "ADBE Calder") throw new Error("renderer did not take: " + c.renderer);
  return c;
};

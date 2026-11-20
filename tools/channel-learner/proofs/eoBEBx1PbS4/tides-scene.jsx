// Shared scene for eoBEBx1PbS4 techniques 01, 03 and 04 (art set "TIDES"). Loaded after the prelude.
// ExtendScript (ES3).
var TIDES = {};
TIDES.ART = "~/Assets/comp-room-studies/channel-study/eoBEBx1PbS4/proof/01/art";
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
// The paint's own colour (brief: mean of the tile's paint pixels), for the bevels and sides in the second run.
TIDES.PAINT = [171 / 255, 199 / 255, 161 / 255];
// The faces' fill under the Multiply texture: paint x 1.08, so the tile's paint pixels (around its mean) land near it.
TIDES.PAINT_HI = [171 * 1.08 / 255, 199 * 1.08 / 255, 161 * 1.08 / 255];
// Second run: fill = the paint colour, and the tile on the front faces (TIDES.faceTex, call it after this).
TIDES.litWord = function (comp, above, fill) {
  var w = TIDES.word(comp, { scale: 450, baseline: 721, fill: fill || TIDES.MEAN });
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

// ---- Second run (2026-11-19): the material fallback, on the owner's decision ("Yes, use the fallback"). ----
// SUBSTITUTE: AE 27.0 here offers no Material section for 3D text (Properties panel shows Layer Transform, Text,
// Paragraph, Text Animation only), so the worn-enamel tile goes onto the front faces as a separate 3D layer:
// a precomp of the tile, tiled as a grid of layers, a different patch per letter (stands in for Randomize Offset),
// alpha-matted by a 2D copy of the word choked by part of the bevel width, laid over the rendered 3D scene in Multiply.
// The extruded word itself takes the paint's colour x 1.08, so bevels and sides read as the same painted metal, untextured.
TIDES.footage = function (file, folderName) {
  var f = null, i, it;
  for (i = 1; i <= app.project.numItems; i++) { it = app.project.item(i); if (it instanceof FolderItem && it.name === folderName) f = it; }
  if (!f) f = app.project.items.addFolder(folderName);
  for (i = 1; i <= f.numItems; i++) if (f.item(i).name === file) return f.item(i);
  var item = app.project.importFile(new ImportOptions(new File(TIDES.ART + "/" + file)));
  item.parentFolder = f;
  return item;
};
// A 2D copy of the word with the same text, anchor and position as TIDES.word (so it lies on the z = 0 plane's footprint).
TIDES.word2D = function (comp, opts) {
  var l = comp.layers.addText("TIDES");
  var tp = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = tp.value;
  d.resetCharStyle();
  d.font = "ArchivoBlack-Regular"; d.fontSize = 100; d.tracking = -30;
  d.fillColor = [1, 1, 1]; d.applyFill = true; d.applyStroke = false;
  d.justification = ParagraphJustification.CENTER_JUSTIFY;
  tp.setValue(d);
  var r = l.sourceRectAtTime(0, false);
  var tf = l.property("ADBE Transform Group");
  if (opts.baseline !== undefined && opts.baseline !== null) {
    tf.property("ADBE Anchor Point").setValue([r.left + r.width / 2, 0]);
    tf.property("ADBE Position").setValue([comp.width / 2, opts.baseline]);
  } else {
    tf.property("ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]);
    tf.property("ADBE Position").setValue([comp.width / 2, comp.height / 2]);
  }
  tf.property("ADBE Scale").setValue([opts.scale, opts.scale]);
  return l;
};
// Letter spans as shares of the width at Scale 450 % (brief 04, measured on a flat render), boundaries between letters.
TIDES.SPANS = [[0.12, 0.295], [0.295, 0.372], [0.372, 0.555], [0.555, 0.705], [0.705, 0.89]];
// One different region of the tile per letter (offsets in tile repeats).
TIDES.OFFSETS = [[0.00, 0.00], [0.37, 0.61], [0.71, 0.19], [0.23, 0.83], [0.58, 0.42]];
// opts: scale (word %), baseline, repeatPx (one tile repeat in comp px), choke (px), name (layer name), tag (comp tag), folder.
TIDES.faceTex = function (main, opts) {
  var pc = P.freshComp(main.name + " face texture", 1920, 1080, TIDES.FPS, main.duration, [0, 0, 0]);
  var tile = TIDES.footage("paint-tile-2048.png", opts.folder);
  var k = opts.scale / 450, i, j, t, r = opts.repeatPx, s = 100 * r / 2048;
  // The tile field: a grid of tile layers, each scaled to one repeat (Motion Tile works at the layer's own 2048 px
  // and asked for a 25 000 px output, which never finished rendering). One repeat larger than the comp on every side.
  var cols = Math.ceil((1920 + 2 * r) / r), rows = Math.ceil((1080 + 2 * r) / r);
  var fc = P.freshComp(main.name + " tile field", cols * r, rows * r, TIDES.FPS, main.duration, [0, 0, 0]);
  for (i = 0; i < cols; i++) for (j = 0; j < rows; j++) {
    t = fc.layers.add(tile);
    t.property("ADBE Transform Group").property("ADBE Scale").setValue([s, s]);
    t.property("ADBE Transform Group").property("ADBE Position").setValue([r / 2 + i * r, r / 2 + j * r]);
  }
  // Divide the field by the paint colour x 1.08 (input white per channel; clipped above), as an adjustment layer on top.
  var adj = fc.layers.addSolid([1, 1, 1], "albedo / paint", fc.width, fc.height, 1, fc.duration);
  adj.adjustmentLayer = true;
  var lv = P.effect(adj, "ADBE Pro Levels2");
  var unit = TIDES.prop(lv, "Red Input White").value > 1.5 ? 255 : 1; // VERIFY: Levels reads 0-1 or 0-255 by script
  TIDES.prop(lv, "Red Input White").setValue(TIDES.PAINT_HI[0] * unit);
  TIDES.prop(adj.property("ADBE Effect Parade").property(1), "Green Input White").setValue(TIDES.PAINT_HI[1] * unit);
  TIDES.prop(adj.property("ADBE Effect Parade").property(1), "Blue Input White").setValue(TIDES.PAINT_HI[2] * unit);
  for (i = 0; i < 5; i++) {
    t = pc.layers.add(fc);
    t.name = "tile " + "TIDES".charAt(i);
    // Field centred on the comp, shifted by this letter's offset (less than one repeat each way).
    var off = (opts.offsets || TIDES.OFFSETS)[i];
    t.property("ADBE Transform Group").property("ADBE Position").setValue([960 + off[0] * r - r / 2, 540 + off[1] * r - r / 2]);
    // Its matte: the 2D word cut to this letter's column (masks act before effects, so the column is cut on the
    // text, not on the tiled layer), choked by the bevel width so the rounded bevel keeps its own 3D shading.
    var matte = TIDES.word2D(pc, opts);
    matte.name = "matte " + "TIDES".charAt(i);
    var x0 = 960 + (TIDES.SPANS[i][0] * 1920 - 960) * k, x1 = 960 + (TIDES.SPANS[i][1] * 1920 - 960) * k;
    var tf = matte.property("ADBE Transform Group");
    var px = tf.property("ADBE Position").value, ap = tf.property("ADBE Anchor Point").value, sc = opts.scale / 100;
    var sh = new Shape();
    sh.vertices = [[ap[0] + (x0 - px[0]) / sc, ap[1] + (0 - px[1]) / sc], [ap[0] + (x1 - px[0]) / sc, ap[1] + (0 - px[1]) / sc],
                   [ap[0] + (x1 - px[0]) / sc, ap[1] + (1080 - px[1]) / sc], [ap[0] + (x0 - px[0]) / sc, ap[1] + (1080 - px[1]) / sc]];
    sh.closed = true;
    matte.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    matte.property("ADBE Mask Parade").property(1).property("ADBE Mask Shape").setValue(sh);
    if (opts.choke > 0) {
      var ch = P.effect(matte, "ADBE Simple Choker");
      TIDES.prop(ch, "Choke Matte").setValue(opts.choke);
    }
    t.setTrackMatte(matte, TrackMatteType.ALPHA);
    matte.enabled = false;
  }
  // The face layer is 2D, in Multiply, over the rendered 3D scene: the default camera never moves, so the front faces
  // sit exactly on the 2D word's footprint. Multiply keeps every light's shading of the real faces (a 3D tile layer
  // in front of them was lit as if from the front by the backlight: two-sided, it read full bright while the faces
  // read dark). The field is divided by the paint colour (Levels per channel, below), so paint stays the face's own
  // lit colour and the rust and bare steel darken it by their ratio to the paint.
  var L = main.layers.add(pc);
  L.name = opts.name;
  L.blendingMode = BlendingMode.MULTIPLY;
  L.moveToBeginning();
  return { layer: L, precomp: pc, field: fc, tileScale: s };
};
// SUBSTITUTE for the Advanced 3D renderer's shadow sampling (no scriptable quality setting on the comp): an
// adjustment layer masked to the floor below the letter bases, Gaussian Blur, smoothing the environment light's
// shadow grain without moving its levels.
TIDES.floorSmooth = function (comp, topY, blur) {
  var a = comp.layers.addSolid([1, 1, 1], "Floor smoothing", comp.width, comp.height, 1, comp.duration);
  a.adjustmentLayer = true;
  var m = a.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
  var sh = new Shape();
  sh.vertices = [[0, topY], [comp.width, topY], [comp.width, comp.height], [0, comp.height]];
  sh.closed = true;
  a.property("ADBE Mask Parade").property(1).property("ADBE Mask Shape").setValue(sh);
  a.property("ADBE Mask Parade").property(1).property("ADBE Mask Feather").setValue([6, 6]);
  var g = P.effect(a, "ADBE Gaussian Blur 2");
  TIDES.prop(g, "Blurriness").setValue(blur);
  TIDES.prop(a.property("ADBE Effect Parade").property(1), "Repeat Edge Pixels").setValue(1);
  return a;
};
// Second run's lit word with its face texture and the floor smoothing, for 03 and 04.
// repeatPx 550 (brief: one repeat about 550 px at this size); no choke (the texture runs over the front bevel; Multiply keeps its shading).
TIDES.texturedScene = function (main, folder, opt) {
  // The 3D scene lives in its own Advanced 3D comp ("<main> 3D"): with the 2D Multiply texture layer in the same comp,
  // switching the rim light off made the environment light throw its shadow sideways from the S alone (run second).
  opt = opt || {};
  var c = TIDES.comp(main.name + " 3D");
  var s = TIDES.set(c);
  var w = TIDES.litWord(c, s.env, TIDES.PAINT_HI);
  var sceneLayer = main.layers.add(c);
  sceneLayer.name = "3D scene";
  var f = TIDES.faceTex(main, { scale: 450, baseline: 721, repeatPx: opt.repeatPx || 550, choke: opt.choke === undefined ? 0 : opt.choke, name: "Face texture", folder: folder });
  s.word = w; s.face = f.layer; s.c3d = c; s.sceneLayer = sceneLayer;
  return s;
};

// ---- Third run (01): rust carried round the letter edges and onto the sides and bevels. ----
// SUBSTITUTE: per-face colour is not scriptable on 3D text here, so the rust goes on in 2D: a rust-coloured solid in
// Multiply (rust / paint x 1.08, so the paint-coloured sides become the tile's rust mean), matted by an "edge band":
// the 3D render's silhouette minus the word's 2D footprint shrunk by `inset` px with roughened edges. The band covers
// the side faces, the bevel rim and an irregular strip of the front face's edge.
TIDES.RUST = [126 / 255, 102 / 255, 74 / 255];
TIDES.edgeRust = function (main, sceneComp, opts) {
  var bc = P.freshComp(main.name + " edge band", 1920, 1080, TIDES.FPS, main.duration, [0, 0, 0]);
  bc.layers.add(sceneComp).name = "silhouette";
  var cut = TIDES.word2D(bc, opts);
  cut.name = "front footprint";
  if (opts.inset > 0) TIDES.prop(P.effect(cut, "ADBE Simple Choker"), "Choke Matte").setValue(opts.inset);
  var rg = P.effect(cut, "ADBE Roughen Edges");
  TIDES.prop(rg, "Border").setValue(opts.border);
  TIDES.prop(cut.property("ADBE Effect Parade").property(rg.propertyIndex), "Scale").setValue(opts.roughScale);
  cut.blendingMode = BlendingMode.SILHOUETE_ALPHA;
  // Break the band up so paint survives in places along the edges (layout: about 41 % paint in the outer band):
  // hard-contrast Fractal Noise as a luma stencil keeps the rust only where the noise is bright.
  var nz = bc.layers.addSolid([1, 1, 1], "edge wear", 1920, 1080, 1, bc.duration);
  var fn = P.effect(nz, "ADBE Fractal Noise");
  TIDES.prop(fn, "Contrast").setValue(opts.noiseContrast || 400);
  TIDES.prop(nz.property("ADBE Effect Parade").property(1), "Brightness").setValue(opts.noiseBrightness || 0); // run third: -9 gave 41 % paint in the outer 8 px band
  // Fractal Noise's Transform group has Uniform Scaling on by default (no property of that display name to set).
  TIDES.prop(nz.property("ADBE Effect Parade").property(1), "Scale").setValue(opts.noiseScale || 40); // effect params are flat: Transform is a topic
  nz.blendingMode = BlendingMode.STENCIL_LUMA;
  var band = main.layers.add(bc);
  band.name = "edge band matte";
  var col = [TIDES.RUST[0] / TIDES.PAINT_HI[0], TIDES.RUST[1] / TIDES.PAINT_HI[1], TIDES.RUST[2] / TIDES.PAINT_HI[2]];
  var rs = main.layers.addSolid(col, opts.name, 1920, 1080, 1, main.duration);
  rs.blendingMode = BlendingMode.MULTIPLY;
  rs.setTrackMatte(band, TrackMatteType.ALPHA);
  band.enabled = false;
  return { layer: rs, band: band, comp: bc };
};

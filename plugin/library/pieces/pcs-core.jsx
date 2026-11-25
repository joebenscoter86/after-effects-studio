// PCS core: what every piece uses. Load it once, then ask for the pieces you need:
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); PCS.need('stage'); PCS.need('flip');
// The house style is on from the start; PCS.use('<style id>') picks another.
// ES3, run through Comp Room eval.run with rollback: false.
//
// A piece makes ONE object or ONE move and returns its layer(s). Pieces hold what makes a graphic look built and lit
// (thickness, light, shadow, overshoot). They hold NO look and NO layout:
//   - colours, type, materials and light come from a STYLE (PCS.use), which the brief chooses;
//   - where things sit, what they say and when they move is the brief's decision.
// Each piece is one file in this folder (<name>.jsx) whose header says what it does, its call and an example;
// ae_arsenal find returns it by the job a beat does, and ae_arsenal get returns its call.

if (typeof PCS === 'undefined') { PCS = {}; }
PCS.dir = (new File($.fileName)).parent.fsName;
PCS.MG = 'ADBE Material Options Group';
PCS.GEO = 'ADBE Extrsn Options Group';
// After Effects keeps script globals between runs: each load of this file starts clean, so a changed piece or style
// file is read again and no style carries over from an earlier run.
PCS.warnings = [];
PCS.loaded = {};

// Loads a piece's file once per call of eval.run. Pieces that rely on other pieces call this themselves.
PCS.need = function (name) {
  if (PCS.loaded[name]) { return; }
  var f = new File(PCS.dir + '/' + name + '.jsx');
  if (!f.exists) { throw new Error('No piece "' + name + '" in ' + PCS.dir); }
  PCS.loaded[name] = true;
  $.evalFile(f);
};

// ---- style ---------------------------------------------------------------
// A style is a small block of plain values the brief picks; no piece hard-codes a colour. Each one is a file in
// styles/<id>.json beside this file, read once here: its "values" are what the pieces use (ground, surface, ink, accent,
// light, grain, font, thickness, material). ae_arsenal browse and find list them as styles; get shows one.
//   house                 the house look, and the default when no style is picked.
//   example-*             examples that prove the pieces carry no look of their own. Not a house look.
//   <look id>             an existing Comp Room look written as a block, so a brief can borrow it for a section.
PCS.STYLE_DEFAULT = 'house';
PCS.readStyles = function () {
  var out = {}; var dir = new Folder(PCS.dir + '/styles');
  var files = dir.exists ? dir.getFiles('*.json') : [];
  for (var i = 0; i < files.length; i++) {
    var f = files[i]; f.encoding = 'UTF-8';
    if (!f.open('r')) { continue; }
    var text = f.read(); f.close();
    // ExtendScript has no JSON object; these are our own shipped data files.
    var block = eval('(' + text + ')');
    out[block.id] = block.values;
    if (block.previous) {   // the style's values before its last tune, kept so the two can be compared: '<id>-previous'
      var pv = {}; var k;
      for (k in block.values) { if (block.values.hasOwnProperty(k)) { pv[k] = block.values[k]; } }
      for (k in block.previous.values) { if (block.previous.values.hasOwnProperty(k)) { pv[k] = block.previous.values[k]; } }
      out[block.id + '-previous'] = pv;
    }
  }
  if (!out[PCS.STYLE_DEFAULT]) { throw new Error('No ' + PCS.STYLE_DEFAULT + ' style in ' + dir.fsName); }
  return out;
};
PCS.styles = PCS.readStyles();
PCS.S = PCS.styles[PCS.STYLE_DEFAULT];
// PCS.use('house'), PCS.use('example-night-glass'), or PCS.use({ ...a style object }): keys it leaves out come from the house style.
PCS.use = function (s) {
  var base = PCS.styles[PCS.STYLE_DEFAULT]; var src = (typeof s === 'string') ? PCS.styles[s] : s; var out = {}; var k;
  if (!src) {
    var names = []; for (k in PCS.styles) { if (PCS.styles.hasOwnProperty(k)) { names.push(k); } }
    throw new Error('Unknown style "' + s + '"; styles: ' + names.join(', '));
  }
  for (k in base) { if (base.hasOwnProperty(k)) { out[k] = base[k]; } }
  for (k in src) { if (src.hasOwnProperty(k)) { out[k] = src[k]; } }
  PCS.S = out; return out;
};

// ---- helpers -------------------------------------------------------------
PCS.TG = function (L) { return L.property('ADBE Transform Group'); };
PCS.sp = function (L, grp, mn, v) { try { L.property(grp).property(mn).setValue(v); return true; } catch (e) { return false; } };
PCS.ease = function (p) { for (var j = 1; j <= p.numKeys; j++) { try { AE.setEase(p, j, 70, 70); } catch (err) {} } };
// Replaces ALL keys on the property. keys: [[time, value], ...]
PCS.kf = function (p, keys) {
  while (p.numKeys > 0) { p.removeKey(1); }
  for (var i = 0; i < keys.length; i++) { p.setValueAtTime(keys[i][0], keys[i][1]); }
  PCS.ease(p);
};
// Appends: keeps every key before the first new one, so moves chain on one object (stand up, then flip, then flip back).
PCS.kfFrom = function (p, keys) {
  var t0 = keys[0][0] - 0.0005;
  for (var k = p.numKeys; k >= 1; k--) { if (p.keyTime(k) >= t0) { p.removeKey(k); } }
  for (var i = 0; i < keys.length; i++) { p.setValueAtTime(keys[i][0], keys[i][1]); }
  PCS.ease(p);
};
PCS.hold = function (p, keys) {
  for (var i = 0; i < keys.length; i++) {
    var k = p.addKey(keys[i][0]); p.setValueAtKey(k, keys[i][1]);
    p.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
  }
};
// A clean cut at time t: from t on the property holds v. Earlier keys are kept, and the key before t holds its value up
// to t instead of easing into the cut. A property with no keys keeps its current value before t. (One key alone would
// hold its value for ALL time in After Effects, so a cut never goes on as a lone key.)
PCS.cutAt = function (p, t, v) {
  if (p.numKeys === 0) { var k0 = p.addKey(0); p.setValueAtKey(k0, p.value); }
  for (var j = p.numKeys; j >= 1; j--) { if (Math.abs(p.keyTime(j) - t) < 0.0005) { p.removeKey(j); } }
  var k = p.addKey(t); p.setValueAtKey(k, v);
  var hold = KeyframeInterpolationType.HOLD;
  p.setInterpolationTypeAtKey(k, p.keyInInterpolationType(k), hold);
  if (k > 1) { p.setInterpolationTypeAtKey(k - 1, p.keyInInterpolationType(k - 1), hold); }
};
// Hidden until t, shown from t, whatever earlier keys said (a stand-up's reveal, say): keys before t are set to 0.
PCS.showFrom = function (p, t) {
  PCS.cutAt(p, 0, 0);
  for (var k = 1; k <= p.numKeys; k++) { if (p.keyTime(k) < t - 0.0005) { p.setValueAtKey(k, 0); } }
  PCS.cutAt(p, t, 100);
};
PCS.zero = function (L) {
  var T = PCS.TG(L);
  try { T.property('ADBE Orientation').setValue([0, 0, 0]); } catch (e) {}
  try { T.property('ADBE Rotate X').setValue(0); T.property('ADBE Rotate Y').setValue(0); T.property('ADBE Rotate Z').setValue(0); } catch (e2) {}
};
PCS.findItem = function (name) {
  for (var i = 1; i <= app.project.numItems; i++) { if (app.project.item(i).name === name) { return app.project.item(i); } }
  return null;
};
// Removes a comp and what only it used: its solids (a stage's backplate and grain) and the library's own files it imported
// (the light map), so re-running a scene leaves nothing behind. Footage from anywhere else is left in the project.
PCS.removeComp = function (comp) {
  var mine = []; var lib = new Folder(PCS.dir).fsName; var prefix = comp.name + ' ';
  for (var i = 1; i <= comp.numLayers; i++) {
    var src = comp.layer(i).source;
    if (src instanceof CompItem && src.name.indexOf(prefix) === 0) { mine.push(src); continue; }   // its own sub-comps, named after it
    if (!src || !(src instanceof FootageItem)) { continue; }
    var solid = src.mainSource instanceof SolidSource;
    var ours = !solid && src.mainSource && src.mainSource.file && src.mainSource.file.fsName.indexOf(lib) === 0;
    if (solid || ours) { mine.push(src); }
  }
  comp.remove();
  for (var j = 0; j < mine.length; j++) {
    try { if (mine[j].usedIn.length === 0) { if (mine[j] instanceof CompItem) { PCS.removeComp(mine[j]); } else { mine[j].remove(); } } } catch (e) {}
  }
};
// The project's item for this file, imported the first time. Matched by path, so a same-named file from elsewhere is not taken.
PCS.importOnce = function (path) {
  var f = new File(path); var name = decodeURI(f.name);
  for (var i = 1; i <= app.project.numItems; i++) {
    var it = app.project.item(i);
    if (it.name === name && it instanceof FootageItem && it.mainSource && it.mainSource.file && it.mainSource.file.fsName === f.fsName) { return it; }
  }
  return app.project.importFile(new ImportOptions(f));
};
// The style's font by weight name. A font set by name alone silently falls back, so this warns when it is missing.
PCS.font = function (weight) {
  try { var f = app.fonts.getFontsByFamilyNameAndStyleName(PCS.S.font, weight); if (f && f.length) { return f[0]; } } catch (e) {}
  PCS.warnings.push('Font not found: ' + PCS.S.font + ' ' + weight);
  return null;
};
// Every piece calls this: new layers go just under the grain and the face card, which are 2D and must stay on top.
// A 3D layer left above them falls out of the depth sort and shows through other objects.
PCS.seat = function (comp, L) {
  var g = null; try { g = comp.layer('grain'); } catch (e) {}
  if (g && L.index < g.index) { L.moveAfter(g); }
  return L;
};
PCS.material = function (L) {
  var m = PCS.S.material; if (!m) { return; }
  if (m.specular !== undefined) { PCS.sp(L, PCS.MG, 'ADBE Specular Coefficient', m.specular); }
  if (m.shininess !== undefined) { PCS.sp(L, PCS.MG, 'ADBE Shininess Coefficient', m.shininess); }
  if (m.metal !== undefined) { PCS.sp(L, PCS.MG, 'ADBE Metal Coefficient', m.metal); }
};
// The colour to give a lit object so it renders as the colour named. Advanced 3D renders a face as its colour times the
// light on it, and the house light lifts a face above its colour, so a saturated accent would clip to a pale tint. With
// the style's litCap, a colour whose brightest channel passes the cap is scaled down to it; darker colours are unchanged.
PCS.lit = function (c) {
  var cap = PCS.S.litCap; if (!cap || !c) { return c; }
  var m = Math.max(c[0], c[1], c[2]); if (m <= cap) { return c; }
  var k = cap / m; return [c[0] * k, c[1] * k, c[2] * k];
};
PCS.setText = function (L, o) {
  var d = L.property('ADBE Text Properties').property('ADBE Text Document');
  var v = d.value;
  v.fontSize = o.size || 64; v.fillColor = o.color || PCS.S.type;
  v.justification = ParagraphJustification.CENTER_JUSTIFY;
  var fo = PCS.font(o.weight || PCS.S.weight); if (fo) { v.fontObject = fo; }
  d.setValue(v);
  if (o.maxWidth) {
    var w = L.sourceRectAtTime(0, false).width;
    if (w > o.maxWidth) { v = d.value; v.fontSize = Math.floor(v.fontSize * o.maxWidth / w); d.setValue(v); }
  }
  var r = L.sourceRectAtTime(0, false);
  var ax = (o.anchor === 'left') ? r.left : r.left + r.width / 2;
  PCS.TG(L).property('ADBE Anchor Point').setValue([ax, r.top + r.height / 2, 0]);
  return r.width;
};
// All layers parented (at any depth) to `layer`.
PCS.children = function (layer) {
  var comp = layer.containingComp; var out = [];
  for (var i = 1; i <= comp.numLayers; i++) {
    var L = comp.layer(i); var p = L.parent;
    while (p) { if (p.index === layer.index) { out.push(L); break; } p = p.parent; }
  }
  return out;
};
// Where a point of a layer (its own coordinates, default its anchor) sits in the comp's 3D space at time t, parents and
// all. After Effects gives this only to expressions, so a temporary null asks for it and is removed.
PCS.toWorld = function (layer, local, t) {
  var comp = layer.containingComp;
  var N = comp.layers.addNull(); N.threeDLayer = true; N.parent = layer; PCS.zero(N);
  PCS.TG(N).property('ADBE Anchor Point').setValue([0, 0, 0]);
  PCS.TG(N).property('ADBE Position').setValue(local || PCS.TG(layer).property('ADBE Anchor Point').valueAtTime(t || 0, false));
  var fx = N.property('ADBE Effect Parade').addProperty('ADBE Point3D Control');
  fx.property(1).expression = 'toWorld([0,0,0])';
  var p = fx.property(1).valueAtTime(t || 0, false);
  var src = N.source; N.remove();
  try { if (src && src.usedIn.length === 0) { src.remove(); } } catch (e) {}   // a null leaves its solid in the project
  return p;
};
// An expression's reference to a layer, by name. Expressions find a layer by its name, so a name shared with another
// layer in the comp is made unique first (with a warning), or the expression would follow the wrong one.
PCS.ref = function (layer) {
  var comp = layer.containingComp; var n = 0;
  for (var i = 1; i <= comp.numLayers; i++) { if (comp.layer(i).name === layer.name) { n++; } }
  if (n > 1) { var was = layer.name; layer.name = was + ' ' + layer.index; PCS.warnings.push('renamed "' + was + '" to "' + layer.name + '" so a light can follow it'); }
  return 'thisComp.layer("' + layer.name.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")';
};
// A colour k of the way from a to b.
PCS.mix = function (a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; };
// A rounded rectangle as a mask or path Shape: centre [cx, cy], size [w, h], corner radius r.
PCS.roundRect = function (cx, cy, w, h, r) {
  r = Math.max(0, Math.min(r || 0, w / 2, h / 2)); var k = 0.5523 * r;
  var l = cx - w / 2; var t = cy - h / 2; var R = cx + w / 2; var B = cy + h / 2;
  var s = new Shape();
  s.vertices = [[l + r, t], [R - r, t], [R, t + r], [R, B - r], [R - r, B], [l + r, B], [l, B - r], [l, t + r]];
  s.inTangents = [[-k, 0], [0, 0], [0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0]];
  s.outTangents = [[0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k]];
  s.closed = true;
  return s;
};
// A plate records its size in its comment (depth=, bevel=, w=, h=, round=, hi=: the brightest channel of the colour it was named with) so later pieces can seat things on it.
// (A key must start a word: 'h=' must not match the end of 'depth='.)
PCS.num = function (plate, key, dflt) { var m = new RegExp('(^|\\s)' + key + '=([\\d.]+)').exec(plate.comment || ''); return m ? parseFloat(m[2]) : dflt; };
PCS.bevelOf = function (plate) { return PCS.num(plate, 'bevel', 3); };
PCS.depthOf = function (plate) { return PCS.num(plate, 'depth', 40); };

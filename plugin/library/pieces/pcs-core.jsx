// PCS core: what every piece uses. Load it once, then ask for the pieces you need:
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); PCS.need('stage'); PCS.need('flip');
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
PCS.warnings = PCS.warnings || [];
PCS.loaded = PCS.loaded || {};

// Loads a piece's file once per call of eval.run. Pieces that rely on other pieces call this themselves.
PCS.need = function (name) {
  if (PCS.loaded[name]) { return; }
  var f = new File(PCS.dir + '/' + name + '.jsx');
  if (!f.exists) { throw new Error('No piece "' + name + '" in ' + PCS.dir); }
  PCS.loaded[name] = true;
  $.evalFile(f);
};

// ---- style ---------------------------------------------------------------
// A style is plain data the brief picks or writes; no piece hard-codes a colour.
// The two below are EXAMPLES that prove the pieces carry no look of their own. Neither is a house look.
// (Build stage 2 turns styles into catalog entries; this block is the mechanism they use.)
PCS.styles = PCS.styles || {
  'example-warm-paper': {
    ground: [0.045, 0.05, 0.07], backplate: [0.10, 0.115, 0.17],
    surface: [0.96, 0.93, 0.87], ink: [0.10, 0.11, 0.15], type: [0.96, 0.93, 0.87],
    accent: [0.90, 0.27, 0.17], onAccent: [0.96, 0.93, 0.87], quiet: [0.30, 0.36, 0.52],
    keyColor: [1, 0.86, 0.68], fillColor: [1, 0.88, 0.72], keyIntensity: 125, fillIntensity: 65, envIntensity: 40,
    grain: 3.5, font: 'Jost', weight: 'SemiBold', depth: 40, bevel: 3, tilt: [4, -8], material: null
  },
  'example-night-glass': {
    ground: [0.02, 0.03, 0.05], backplate: [0.05, 0.08, 0.13],
    surface: [0.16, 0.22, 0.34], ink: [0.93, 0.96, 1.0], type: [0.93, 0.96, 1.0],
    accent: [0.38, 0.86, 0.72], onAccent: [0.03, 0.08, 0.10], quiet: [0.10, 0.14, 0.22],
    keyColor: [0.80, 0.90, 1.0], fillColor: [0.62, 0.74, 1.0], keyIntensity: 150, fillIntensity: 80, envIntensity: 60,
    grain: 2, font: 'Jost', weight: 'Medium', depth: 26, bevel: 5, tilt: [3, -6],
    material: { specular: 70, shininess: 60, metal: 40 }
  }
};
PCS.S = PCS.S || PCS.styles['example-warm-paper'];
// PCS.use('example-warm-paper'), or PCS.use({ ...a style object }): missing keys fall back to the first example.
PCS.use = function (s) {
  var base = PCS.styles['example-warm-paper']; var src = (typeof s === 'string') ? PCS.styles[s] : s; var out = {}; var k;
  if (!src) { throw new Error('Unknown style "' + s + '"'); }
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
PCS.zero = function (L) {
  var T = PCS.TG(L);
  try { T.property('ADBE Orientation').setValue([0, 0, 0]); } catch (e) {}
  try { T.property('ADBE Rotate X').setValue(0); T.property('ADBE Rotate Y').setValue(0); T.property('ADBE Rotate Z').setValue(0); } catch (e2) {}
};
PCS.findItem = function (name) {
  for (var i = 1; i <= app.project.numItems; i++) { if (app.project.item(i).name === name) { return app.project.item(i); } }
  return null;
};
PCS.importOnce = function (path) {
  var f = new File(path);
  var it = PCS.findItem(decodeURI(f.name));
  if (it && it.mainSource && it.mainSource.file && it.mainSource.file.fsName === f.fsName) { return it; }
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
// A plate records its size in its comment (depth=, bevel=, w=, h=) so later pieces can seat things on it.
PCS.num = function (plate, key, dflt) { var m = new RegExp(key + '=([\\d.]+)').exec(plate.comment || ''); return m ? parseFloat(m[1]) : dflt; };
PCS.bevelOf = function (plate) { return PCS.num(plate, 'bevel', 3); };
PCS.depthOf = function (plate) { return PCS.num(plate, 'depth', 40); };

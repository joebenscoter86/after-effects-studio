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
PCS.zero = function (L) {
  var T = PCS.TG(L);
  try { T.property('ADBE Orientation').setValue([0, 0, 0]); } catch (e) {}
  try { T.property('ADBE Rotate X').setValue(0); T.property('ADBE Rotate Y').setValue(0); T.property('ADBE Rotate Z').setValue(0); } catch (e2) {}
};
PCS.findItem = function (name) {
  for (var i = 1; i <= app.project.numItems; i++) { if (app.project.item(i).name === name) { return app.project.item(i); } }
  return null;
};
// Removes a comp and the solids only it used (a stage's backplate and grain), so re-running a scene leaves nothing behind.
PCS.removeComp = function (comp) {
  var solids = [];
  for (var i = 1; i <= comp.numLayers; i++) {
    var src = comp.layer(i).source;
    if (src && src instanceof FootageItem && src.mainSource instanceof SolidSource) { solids.push(src); }
  }
  comp.remove();
  for (var j = 0; j < solids.length; j++) { try { if (solids[j].usedIn.length === 0) { solids[j].remove(); } } catch (e) {} }
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

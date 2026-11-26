// Shared helpers for the proof builds. Loaded with $.evalFile(args.prelude) at the top of each proof script.
// ExtendScript (ES3). Nothing here opens, closes or saves a project.
var P = {};

// Remove an earlier build of the same comp so a proof can be re-run.
P.freshComp = function (name, w, h, fps, dur, bg) {
  var i, it;
  for (i = app.project.numItems; i >= 1; i--) {
    it = app.project.item(i);
    if (it instanceof CompItem && it.name === name) it.remove();
  }
  var c = app.project.items.addComp(name, w, h, 1, dur, fps);
  if (bg) c.bgColor = bg;
  return c;
};

P.solid = function (comp, name, color, w, h) {
  return comp.layers.addSolid(color, name, w || comp.width, h || comp.height, 1, comp.duration);
};

P.text = function (comp, str, opts) {
  opts = opts || {};
  var l = comp.layers.addText(str);
  var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value;
  d.resetCharStyle();
  d.fontSize = opts.size || 72;
  d.fillColor = opts.color || [1, 1, 1];
  d.applyFill = true;
  d.applyStroke = false;
  if (opts.font) d.font = opts.font;
  d.justification = ParagraphJustification.CENTER_JUSTIFY;
  if (opts.tracking !== undefined) d.tracking = opts.tracking;
  prop.setValue(d);
  // Centre the anchor on the text's own bounds so position means its middle.
  var r = l.sourceRectAtTime(0, false);
  l.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]);
  l.property("ADBE Transform Group").property("ADBE Position").setValue(opts.pos || [comp.width / 2, comp.height / 2]);
  if (opts.name) l.name = opts.name;
  return l;
};

// A shape layer with one group; returns { layer, group, contents }.
P.shape = function (comp, name) {
  var l = comp.layers.addShape();
  l.name = name;
  var g = l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
  return { layer: l, group: g };
};
P.contents = function (sh) {
  return sh.layer.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
};
P.ellipse = function (sh, size) {
  var e = P.contents(sh).addProperty("ADBE Vector Shape - Ellipse");
  e.property("ADBE Vector Ellipse Size").setValue(size);
  return e;
};
P.path = function (sh, verts, ins, outs, closed) {
  var p = P.contents(sh).addProperty("ADBE Vector Shape - Group");
  var s = new Shape();
  s.vertices = verts;
  if (ins) s.inTangents = ins;
  if (outs) s.outTangents = outs;
  s.closed = !!closed;
  p.property("ADBE Vector Shape").setValue(s);
  return p;
};
// Adds a stroke and returns its index inside the group (re-fetch by index: adding properties invalidates references).
P.stroke = function (sh, color, width, cap) {
  var c = P.contents(sh);
  var s = c.addProperty("ADBE Vector Graphic - Stroke");
  var idx = s.propertyIndex;
  s = c.property(idx);
  s.property("ADBE Vector Stroke Color").setValue(color);
  s.property("ADBE Vector Stroke Width").setValue(width);
  if (cap) c.property(idx).property("ADBE Vector Stroke Line Cap").setValue(cap); // 1 butt, 2 round, 3 projecting
  return idx;
};
P.dashes = function (sh, strokeIdx, dash, gap) {
  var d = P.contents(sh).property(strokeIdx).property("ADBE Vector Stroke Dashes");
  d.addProperty("ADBE Vector Stroke Dash 1");
  P.contents(sh).property(strokeIdx).property("ADBE Vector Stroke Dashes").property("ADBE Vector Stroke Dash 1").setValue(dash);
  P.contents(sh).property(strokeIdx).property("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Gap 1");
  P.contents(sh).property(strokeIdx).property("ADBE Vector Stroke Dashes").property("ADBE Vector Stroke Gap 1").setValue(gap);
};
P.effect = function (layer, matchName) {
  var fx = layer.property("ADBE Effect Parade");
  if (!fx.canAddProperty(matchName)) throw new Error("effect not available: " + matchName);
  var e = fx.addProperty(matchName);
  return layer.property("ADBE Effect Parade").property(e.propertyIndex);
};
P.tf = function (layer, name) {
  return layer.property("ADBE Transform Group").property(name);
};

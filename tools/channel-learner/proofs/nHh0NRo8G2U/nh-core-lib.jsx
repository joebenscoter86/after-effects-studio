// Shared pieces for the nHh0NRo8G2U proofs 07-15 (loaded after prelude.jsx and art.jsx). ExtendScript (ES3).
// Tall comps (1080 x 1920, 23.976 fps) with a black `Background` solid, the uniform layout mapping from the recipes'
// 1920 x 1080 measurements, cubic-bezier eases converted to After Effects speed and influence, text with font fallback,
// effect setters by display name, shape-layer pieces and an off-frame check.
//
// VERIFY: KeyframeEase speed on a 1D property (Trim Start falling 50 -> 0) is signed: a falling value takes a negative speed
// VERIFY: Position (2D layer) propertyValueType is ThreeD_SPATIAL or TwoD_SPATIAL, takes ONE KeyframeEase per side, and keyValue length sizes the spatial tangents
// VERIFY: KeyframeEase influence 88 on both sides of one segment (sum 176) is accepted (the 0.88/0.12 S-curve needs it)
// VERIFY: TextDocument.leading is settable after autoLeading = false
// VERIFY: renaming an effect (fx.name = "TECH ...") is allowed and it can be found again by the new name
var NH = {};
NH.W = 1080;
NH.H = 1920;
NH.FPS = 23.976;
NH.SCURVE = [0.88, 0.14, 0.12, 0.86];   // the extension's saved S-curve (recipes 07-15)
NH.FASTIN = [0.04, 0.47, 0.53, 0.93];   // the extension's "Fast In" (recipes 07 labels, 11)
NH.fontLog = [];
NH.t = function (f) { return f / NH.FPS; };

// Uniform mapping of a recipe's 1920 x 1080 figure into the tall frame: p' = dst + scale * (p - src).
// Apply it to every size, position, stroke width and travel distance; never to percentages, timings, eases, opacities, counts.
NH.mapper = function (scale, src, dst) {
  return {
    s: scale, src: src, dst: dst,
    pt: function (x, y) { return [dst[0] + scale * (x - src[0]), dst[1] + scale * (y - src[1])]; },
    len: function (d) { return d * scale; }
  };
};

// The scene comp: tall, 23.976 fps, black, with a black full-frame solid named Background at the bottom.
NH.scene = function (name, frames) {
  var c = P.freshComp(name, NH.W, NH.H, NH.FPS, frames / NH.FPS, [0, 0, 0]);
  NH.background(c);
  return c;
};
NH.background = function (c) {
  var l = P.solid(c, "Background", [0, 0, 0], c.width, c.height);
  l.name = "Background";
  l.moveToEnd();
  return l;
};
NH.adjust = function (c, name) {
  var l = P.solid(c, name, [1, 1, 1], c.width, c.height);
  l.adjustmentLayer = true;
  l.name = name;
  return l;
};
NH.inPoint = function (layer, frame) { layer.inPoint = frame / NH.FPS; };

// ---------- effects ----------
// Add the first effect of `names` (match or display names) this After Effects knows; rename it to `newName` if given.
NH.addFx = function (layer, names, newName) {
  var fx = layer.property("ADBE Effect Parade"), i, e;
  for (i = 0; i < names.length; i++) {
    if (fx.canAddProperty(names[i])) {
      e = fx.addProperty(names[i]);
      var idx = e.propertyIndex;
      e = layer.property("ADBE Effect Parade").property(idx);
      if (newName) {
        e.name = newName;
        e = layer.property("ADBE Effect Parade").property(newName);
      }
      return e;
    }
  }
  throw new Error("effect not available: " + names.join(" / "));
};
// Set effect parameters by display name. A key may list alternatives separated by "|" ("Scale|Scale Height").
// Throws on any name not found (nothing hidden).
NH.setFx = function (fx, values) {
  var missing = [], k, j, a, alts, found;
  for (k in values) {
    alts = k.split("|");
    found = false;
    for (a = 0; a < alts.length && !found; a++) {
      for (j = 1; j <= fx.numProperties; j++) {
        if (fx.property(j).name === alts[a]) { fx.property(j).setValue(values[k]); found = true; break; }
      }
    }
    if (!found) missing.push(k);
  }
  if (missing.length) throw new Error(fx.name + ": parameters not found: " + missing.join(", "));
};
NH.fxProp = function (fx, name) {
  var j;
  for (j = 1; j <= fx.numProperties; j++) if (fx.property(j).name === name) return fx.property(j);
  throw new Error(fx.name + ": parameter not found: " + name);
};
// Black-and-white grade of recipes 12, 14: Hue/Saturation Master Saturation -100, then Levels with 8-bit input black/white.
// Levels values by script may read 0-1 or 0-255: the scale is read from the fresh effect's Input White.
NH.grade = function (c, name, inBlack8, inWhite8) {
  var l = NH.adjust(c, name);
  var hs = NH.addFx(l, ["ADBE HUE SATURATION", "Hue/Saturation"]);
  NH.setFx(hs, { "Master Saturation": -100 });
  var lv = NH.addFx(l, ["ADBE Easy Levels2", "Levels"]);
  var unit = NH.fxProp(lv, "Input White").value > 1.5 ? 255 : 1;
  NH.setFx(lv, { "Input Black": inBlack8 / 255 * unit, "Input White": inWhite8 / 255 * unit, "Gamma": 1 });
  return { layer: l, levelsUnit: unit, read: "Levels in " + NH.fxProp(lv, "Input Black").value + " / " + NH.fxProp(lv, "Input White").value + " (unit " + unit + ")" };
};
NH.posterize = function (c, name, rate) {
  var l = NH.adjust(c, name);
  var fx = NH.addFx(l, ["ADBE Posterize Time", "Posterize Time"]);
  NH.setFx(fx, { "Frame Rate": rate });
  return l;
};

// ---------- keys ----------
// keys: [[frame, value], ...]. curves: one cubic-bezier [x1, y1, x2, y2] for every segment, or an array of them per segment.
// Converted from the curve's end slopes: out of a key, influence = x1, speed = (y1 / x1) * the segment's average speed;
// into a key, influence = 1 - x2, speed = ((1 - y2) / (1 - x2)) * average (lesson 31).
// overrides: { "<key number, 1-based>": { inSpeed, inInf, outSpeed, outInf } } replaces computed values (speeds in the
// property's units per second, already mapped). Spatial keys get straight (zero) tangents so the path never bows.
NH.keys = function (prop, keys, curves, overrides) {
  var i, n = keys.length, idx = [];
  for (i = 0; i < n; i++) prop.setValueAtTime(keys[i][0] / NH.FPS, keys[i][1]);
  for (i = 0; i < n; i++) idx.push(prop.nearestKeyIndex(keys[i][0] / NH.FPS));
  var pvt = prop.propertyValueType;
  var spatial = (pvt === PropertyValueType.TwoD_SPATIAL || pvt === PropertyValueType.ThreeD_SPATIAL);
  var v0 = keys[0][1];
  var dims = spatial ? 1 : ((v0 instanceof Array) ? v0.length : 1);
  var curveOf = function (seg) { return (curves[0] instanceof Array) ? curves[seg] : curves; };
  var avg = function (seg) {
    var a = keys[seg], b = keys[seg + 1], dt = (b[0] - a[0]) / NH.FPS, d, s = 0, out = [];
    if (spatial) {
      for (d = 0; d < Math.min(a[1].length, b[1].length); d++) s += (b[1][d] - a[1][d]) * (b[1][d] - a[1][d]);
      return [Math.sqrt(s) / dt];
    }
    if (dims === 1) return [(b[1] - a[1]) / dt];
    for (d = 0; d < dims; d++) out.push((b[1][d] - a[1][d]) / dt);
    return out;
  };
  var clampInf = function (x) { return Math.max(0.1, Math.min(100, x)); };
  var easeArr = function (speeds, inf) {
    var r = [], d;
    for (d = 0; d < dims; d++) r.push(new KeyframeEase(speeds[d], clampInf(inf)));
    return r;
  };
  var filled = function (x) { var r = [], d; for (d = 0; d < dims; d++) r.push(x); return r; };
  var report = [];
  for (i = 0; i < n; i++) {
    var inS = filled(0), inI = 33.33, outS = filled(0), outI = 33.33, c, a, d, o;
    if (i > 0) {
      c = curveOf(i - 1); a = avg(i - 1);
      inI = (1 - c[2]) * 100;
      for (d = 0; d < dims; d++) inS[d] = (1 - c[3]) / (1 - c[2]) * a[d];
    }
    if (i < n - 1) {
      c = curveOf(i); a = avg(i);
      outI = c[0] * 100;
      for (d = 0; d < dims; d++) outS[d] = c[1] / c[0] * a[d];
    }
    o = overrides ? overrides[String(i + 1)] : null;
    if (o) {
      if (o.inSpeed !== undefined) inS = filled(o.inSpeed);
      if (o.inInf !== undefined) inI = o.inInf;
      if (o.outSpeed !== undefined) outS = filled(o.outSpeed);
      if (o.outInf !== undefined) outI = o.outInf;
    }
    prop.setInterpolationTypeAtKey(idx[i], KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    prop.setTemporalEaseAtKey(idx[i], easeArr(inS, inI), easeArr(outS, outI));
    report.push("k" + (i + 1) + "@" + keys[i][0] + "f in " + Math.round(inS[0] * 100) / 100 + "/" + Math.round(inI * 100) / 100 +
      " out " + Math.round(outS[0] * 100) / 100 + "/" + Math.round(outI * 100) / 100);
  }
  if (spatial) {
    for (i = 0; i < n; i++) {
      var len = prop.keyValue(idx[i]).length, z = [], q;
      for (q = 0; q < len; q++) z.push(0);
      prop.setSpatialAutoBezierAtKey(idx[i], false);
      prop.setSpatialContinuousAtKey(idx[i], false);
      prop.setSpatialTangentsAtKey(idx[i], z, z);
    }
  }
  return report.join("; ");
};

// ---------- text ----------
// Try each PostScript name in `faces` until one reads back as itself and not a substitute (after the Tf0E lib).
NH.setFont = function (prop, faces, label) {
  var i, d, back, fo, ok = false, used = null;
  for (i = 0; i < faces.length && !ok; i++) {
    d = prop.value;
    d.font = faces[i];
    prop.setValue(d);
    back = prop.value;
    fo = null;
    try { fo = back.fontObject; } catch (e) { fo = null; } // fontObject is AE 24+; absent means only the name check counts
    ok = (back.font === faces[i]) && !(fo && fo.isSubstitute);
    used = back.font;
  }
  var r = { label: label, wanted: faces[0], used: used, isSubstitute: !(ok && used === faces[0]), found: ok };
  NH.fontLog.push(r);
  return r;
};
NH.fontReport = function () {
  var out = [], i, r;
  for (i = 0; i < NH.fontLog.length; i++) {
    r = NH.fontLog[i];
    out.push(r.label + ": wanted " + r.wanted + ", used " + r.used + (r.isSubstitute ? " (SUBSTITUTE)" : "") + (r.found ? "" : " (NO FACE FOUND)"));
  }
  return out.join(" | ");
};
// Point text. o: size, color, faces, just ("left" | "right" | "center"), tracking, leading, pos, name,
// anchor "origin" (layer origin: the baseline's start, end or middle by justification) or "ink" (ink-box centre).
NH.text = function (c, str, o) {
  var l = c.layers.addText(str);
  var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value;
  d.resetCharStyle();
  d.resetParagraphStyle();
  d.fontSize = o.size;
  d.fillColor = o.color || [1, 1, 1];
  d.applyFill = true;
  d.applyStroke = false;
  d.tracking = o.tracking || 0;
  if (o.just === "right") d.justification = ParagraphJustification.RIGHT_JUSTIFY;
  else if (o.just === "left") d.justification = ParagraphJustification.LEFT_JUSTIFY;
  else d.justification = ParagraphJustification.CENTER_JUSTIFY;
  if (o.leading) { d.autoLeading = false; d.leading = o.leading; }
  prop.setValue(d);
  l.name = o.name || str;
  NH.setFont(prop, o.faces, l.name);
  if (o.anchor === "ink") {
    var r = l.sourceRectAtTime(0, false);
    P.tf(l, "ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]);
  } else {
    P.tf(l, "ADBE Anchor Point").setValue([0, 0]);
  }
  if (o.pos) P.tf(l, "ADBE Position").setValue(o.pos);
  return l;
};
// Ink box of an unparented, unrotated, 100 % layer in comp pixels at frame f.
NH.inkBox = function (l, f) {
  var t = (f || 0) / NH.FPS;
  var r = l.sourceRectAtTime(t, false);
  var a = P.tf(l, "ADBE Anchor Point").valueAtTime(t, false);
  var p = P.tf(l, "ADBE Position").valueAtTime(t, false);
  var x0 = p[0] - a[0] + r.left, y0 = p[1] - a[1] + r.top;
  return { left: x0, top: y0, right: x0 + r.width, bottom: y0 + r.height };
};
NH.r1 = function (x) { return Math.round(x * 10) / 10; };
NH.boxStr = function (b) { return "x " + NH.r1(b.left) + "-" + NH.r1(b.right) + ", y " + NH.r1(b.top) + "-" + NH.r1(b.bottom); };
// Warn when a box comes within `gutter` px of the frame edge (16 px phone gutter by default) or past it.
NH.frameWarn = function (label, b, gutter) {
  var g = (gutter === undefined) ? 16 : gutter, w = [];
  if (b.left < g) w.push("left " + NH.r1(b.left));
  if (b.right > NH.W - g) w.push("right " + NH.r1(b.right));
  if (b.top < g) w.push("top " + NH.r1(b.top));
  if (b.bottom > NH.H - g) w.push("bottom " + NH.r1(b.bottom));
  return w.length ? (label + " past the 16 px gutter: " + w.join(", ")) : "";
};

// ---------- shapes ----------
// A shape layer whose contents are drawn in comp pixels around `pos` (anchor 0,0 at `pos`).
NH.shapeLayer = function (c, name, pos) {
  var sh = P.shape(c, name);
  P.tf(sh.layer, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(sh.layer, "ADBE Position").setValue(pos || [0, 0]);
  return sh;
};
NH.fill = function (sh, color) {
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  P.contents(sh).property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(color);
  return f.propertyIndex;
};
NH.trim = function (sh) {
  var t = P.contents(sh).addProperty("ADBE Vector Filter - Trim");
  return t.propertyIndex;
};
NH.trimProp = function (sh, idx, which) {
  return P.contents(sh).property(idx).property("ADBE Vector Trim " + which); // Start, End, Offset
};
NH.rect = function (sh, size, pos) {
  var r = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  var i = r.propertyIndex;
  P.contents(sh).property(i).property("ADBE Vector Rect Size").setValue(size);
  P.contents(sh).property(i).property("ADBE Vector Rect Position").setValue(pos || [0, 0]);
  return i;
};
// Add another group to a shape layer holding a closed polygon with a flat fill; returns the group's index.
NH.polyGroup = function (layer, name, verts, color) {
  var root = layer.property("ADBE Root Vectors Group");
  var g = root.addProperty("ADBE Vector Group");
  var gi = g.propertyIndex;
  layer.property("ADBE Root Vectors Group").property(gi).name = name;
  var vg = function () { return layer.property("ADBE Root Vectors Group").property(gi).property("ADBE Vectors Group"); };
  var p = vg().addProperty("ADBE Vector Shape - Group");
  var s = new Shape();
  s.vertices = verts;
  s.closed = true;
  vg().property(p.propertyIndex).property("ADBE Vector Shape").setValue(s);
  var f = vg().addProperty("ADBE Vector Graphic - Fill");
  vg().property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(color);
  return gi;
};

// A colour given as "#RRGGBB" or [r, g, b] (0-1); `def` when absent.
NH.color = function (v, def) {
  if (v === undefined || v === null) return def;
  if (typeof v === "string") return ART.hex(v);
  return v;
};
// Static setting text from an art brief (kicker, headline, units line, captions, source): not the technique.
// items: [{ text, font (PostScript name), size, color, tracking, x, y (baseline), just ("center" | "left" | "right"), name }],
// all in tall-frame pixels. Returns the layers (added on top; put adjustment layers after this call).
NH.dressing = function (c, items) {
  var out = [], i, it;
  if (!items) return out;
  for (i = 0; i < items.length; i++) {
    it = items[i];
    out.push(NH.text(c, it.text, {
      size: it.size, color: NH.color(it.color, [1, 1, 1]), faces: [it.font || "Poppins-SemiBold", "Poppins-SemiBold", "Montserrat-SemiBold"],
      just: it.just || "center", tracking: it.tracking || 0, anchor: "origin", pos: [it.x, it.y], name: it.name || ("Setting " + (i + 1))
    }));
  }
  return out;
};

// ---------- art ----------
// Footage `file` from args.artDir if both exist, imported once into project folder `folder`; otherwise null (stand-in).
NH.art = function (dir, file, folder) {
  if (!dir) return null;
  var f = new File(dir + "/" + file);
  if (!f.exists) return null;
  return ART.footage(dir, file, folder);
};

// Shared ES3 helpers for every style package. No project mutation happens at load. Loaded before a style's module in proofs and reels.
var AESLib = (function () {
  function ease(prop, times, values, mode) {   // mode: "settle" (arrive), "travel" (S-curve), "exit" (accelerate away), "linear", "hold"
    for (var i = 0; i < times.length; i++) prop.setValueAtTime(times[i], values[i]);
    for (var j = 0; j < times.length; j++) { var k = prop.nearestKeyIndex(times[j]);
      if (mode === "hold") { prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); continue; }
      if (mode === "linear") { prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR); continue; }
      var ii = 85, oi = 28; if (mode === "exit") { ii = 12; oi = 75; } else if (mode === "travel") { ii = 82; oi = 82; }
      var sp = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
      var d = (!sp && prop.value instanceof Array) ? prop.value.length : 1, a = [], b = [];
      for (var n = 0; n < d; n++) { a.push(new KeyframeEase(0, ii)); b.push(new KeyframeEase(0, oi)); }
      prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); prop.setTemporalEaseAtKey(k, a, b); }
    return prop; }
  function importFile(p) { var f = new File(p); if (!f.exists) throw new Error("missing " + p);
    for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof FootageItem && it.file && it.file.fsName === f.fsName) return it; }
    return app.project.importFile(new ImportOptions(f)); }
  function clearOwned(comp, prefix) { if (!prefix || prefix.length < 3) throw new Error("Use a prefix of at least three characters");
    for (var i = comp.numLayers; i >= 1; i--) if (comp.layer(i).name.indexOf(prefix) === 0) comp.layer(i).remove(); }
  function font(family, style) { var f = app.fonts.getFontsByFamilyNameAndStyleName(family, style); if (!f || !f.length) throw new Error(family + " " + style + " is not installed"); return f[0].postScriptName; }
  // a text layer: o = { family, style, size, color, pos, just ("left"|"center"|"right"), leading, tracking, t0, t1 }
  function text(comp, name, str, o) { var L = comp.layers.addText(str || " "); L.name = name; var sp = L.property("Source Text"), td = sp.value;
    td.font = font(o.family, o.style); td.fontSize = o.size; td.applyFill = true; td.fillColor = o.color || [0, 0, 0]; td.applyStroke = false;
    if (o.just === "left") td.justification = ParagraphJustification.LEFT_JUSTIFY; else if (o.just === "right") td.justification = ParagraphJustification.RIGHT_JUSTIFY; else td.justification = ParagraphJustification.CENTER_JUSTIFY;
    if (o.leading) { td.autoLeading = false; td.leading = o.leading; } if (o.tracking !== undefined) td.tracking = o.tracking; sp.setValue(td);
    if (o.pos) L.position.setValue(o.pos); if (o.t0 !== undefined) L.inPoint = o.t0; if (o.t1 !== undefined) L.outPoint = o.t1; return L; }
  // text keys in ONE setValuesAtTimes call: a key per setValueAtTime costs AE a full update each time and freezes the UI for minutes on
  // glyph pictures and typed lines. Each value is a copy of the layer's styled TextDocument with only the text changed.
  function textKeys(layer, times, strings) { var sp = layer.property("Source Text"), vals = [];
    for (var k = 0; k < strings.length; k++) { var d = sp.value; d.text = strings[k] || " "; vals.push(d); }
    if (times.length) sp.setValuesAtTimes(times, vals); return times.length; }
  function bakeText(layer, strings, fps, t0) { var ts = [], ss = [];
    for (var k = 0; k < strings.length; k++) { if (k > 0 && strings[k] === strings[k - 1]) continue; ts.push((t0 || 0) + k / fps); ss.push(strings[k]); } return textKeys(layer, ts, ss); }
  function readJSON(p) { var f = new File(p); if (!f.exists) throw new Error("missing " + p); f.encoding = "UTF-8"; f.open("r"); var s = f.read(); f.close(); return eval("(" + s + ")"); }
  return { ease: ease, importFile: importFile, clearOwned: clearOwned, font: font, text: text, bakeText: bakeText, textKeys: textKeys, readJSON: readJSON };
})();

// Portable ES3 helpers. Loading this file never inspects or mutates a project.
var AESType = (function () {
  function finite(n) { return typeof n === "number" && isFinite(n); }
  function array(a) { return Object.prototype.toString.call(a) === "[object Array]"; }
  function nonempty(s) { return typeof s === "string" && /\S/.test(s); }
  function error(code, message) { var e = new Error(message); e.aesCode = code; throw e; }
  function target(layer, time) {
    if (!layer || !layer.containingComp || !finite(time) || time < 0 || time > layer.containingComp.duration) error("INVALID_ARGUMENT", "Valid layer and time within comp required");
    var group = layer.property("ADBE Text Properties");
    var prop = group && group.property("ADBE Text Document");
    if (!prop) error("INVALID_ARGUMENT", "Text layer required");
    return prop;
  }
  function measure(layer, time) {
    var prop = target(layer, time), doc = prop.valueAtTime(time, false);
    if (!/\S/.test(doc.text)) return {left:0, top:0, width:0, height:0, time:time, space:"source"};
    var r = layer.sourceRectAtTime(time, false);
    if (!finite(r.left) || !finite(r.top) || !finite(r.width) || !finite(r.height) || r.width < 0 || r.height < 0) error("NATIVE_ERROR", "Invalid native source bounds");
    return {left:r.left, top:r.top, width:r.width, height:r.height, time:time, space:"source"};
  }
  function fit(layer, options) {
    var prop, original, wrote = false, warnings = [], o = options, chosen;
    try {
      if (!o || !nonempty(o.owner) || !array(o.ownedLayerIds)) error("INVALID_ARGUMENT", "Explicit owner and ownedLayerIds required");
      var owned = false, i;
      for (i = 0; i < o.ownedLayerIds.length; i++) {
        if (!finite(o.ownedLayerIds[i]) || o.ownedLayerIds[i] % 1 !== 0) error("INVALID_ARGUMENT", "ownedLayerIds must contain integer IDs");
        if (layer && layer.id === o.ownedLayerIds[i]) owned = true;
      }
      if (!owned) error("CONFLICT", "Target ID is outside owned scope");
      prop = target(layer, o.time);
      if (layer.locked || prop.numKeys > 0 || prop.expressionEnabled || nonempty(prop.expression)) error("CONFLICT", "Locked or animated/expressed Source Text must be preserved");
      var r = o.rect;
      if (!r || !finite(r.left) || !finite(r.top) || !finite(r.width) || !finite(r.height) || r.width <= 0 || r.height <= 0) error("INVALID_ARGUMENT", "Positive finite rect dimensions required");
      if (!finite(o.minFontSize) || !finite(o.maxFontSize) || o.minFontSize <= 0 || o.maxFontSize < o.minFontSize) error("INVALID_ARGUMENT", "Valid min/max font sizes required");
      if (o.wrap !== "preserve" && o.wrap !== "paragraph") error("INVALID_ARGUMENT", "wrap must be preserve or paragraph");
      if (!nonempty(o.requestedFont) || !array(o.fallbackFonts)) error("INVALID_ARGUMENT", "Requested PostScript font and approved fallback list required");
      for (i = 0; i < o.fallbackFonts.length; i++) if (!nonempty(o.fallbackFonts[i])) error("INVALID_ARGUMENT", "Fallback font names must be nonempty");
      original = prop.value;
      if ((o.wrap === "paragraph") !== !!original.boxText) error("UNSUPPORTED", "Point/paragraph conversion is unsupported; use matching wrap policy");
      // Horizontal Latin and common punctuation only. Never silently reshape unsupported scripts.
      if (/[^\u0009\u000a\u000d\u0020-\u024f\u0300-\u036f\u2000-\u206f]/.test(original.text)) error("UNSUPPORTED", "Initial typography scope is horizontal Latin text");
      if (typeof LineOrientation !== "undefined" && original.lineOrientation !== LineOrientation.HORIZONTAL) error("UNSUPPORTED", "Horizontal text required");
      if (original.boxText && typeof original.boxOverflow !== "boolean") error("UNSUPPORTED", "Native paragraph overflow inspection unavailable");
      if (!app.fonts || !app.fonts.getFontsByPostScriptName) error("UNSUPPORTED", "Native font resolution unavailable");
      var candidates = [o.requestedFont].concat(o.fallbackFonts);
      var glyphText = original.text.replace(/[\r\n\t]/g, "");
      for (i = 0; i < candidates.length && !chosen; i++) {
        var fonts = app.fonts.getFontsByPostScriptName(candidates[i]);
        for (var j = 0; fonts && j < fonts.length; j++) {
          if (!fonts[j].isSubstitute && fonts[j].postScriptName === candidates[i] && typeof fonts[j].hasGlyphsFor === "function" && (!glyphText || fonts[j].hasGlyphsFor(glyphText))) { chosen = fonts[j]; break; }
        }
      }
      if (!chosen) error("FONT_UNAVAILABLE", "No approved installed font with verified glyph coverage");
      if (chosen.postScriptName !== o.requestedFont) warnings.push("Approved fallback: " + chosen.postScriptName + " (requested " + o.requestedFont + ")");
      function apply(size) {
        var doc = prop.value;
        doc.font = chosen.postScriptName; doc.fontSize = size;
        if (doc.boxText) doc.boxTextSize = [r.width, r.height];
        wrote = true; prop.setValue(doc);
        var actual = prop.value;
        if (actual.text !== original.text || actual.font !== chosen.postScriptName || !actual.fontObject || actual.fontObject.isSubstitute || actual.fontObject.postScriptName !== chosen.postScriptName) error("NATIVE_ERROR", "Native font/copy readback differs from requested result");
        if (!finite(actual.fontSize) || actual.fontSize < o.minFontSize - 0.0001 || actual.fontSize > o.maxFontSize + 0.0001) error("NATIVE_ERROR", "Native font size escaped requested limits");
        var bounds = measure(layer, o.time);
        return {fontSize:actual.fontSize, bounds:bounds, overflow:bounds.width > r.width + 0.01 || bounds.height > r.height + 0.01 || (actual.boxText && actual.boxOverflow)};
      }
      var result = apply(o.maxFontSize);
      if (result.overflow) {
        result = apply(o.minFontSize);
        if (!result.overflow) {
          var low = o.minFontSize, high = o.maxFontSize;
          for (i = 0; i < 16 && high - low > 0.05; i++) {
            var mid = (low + high) / 2, probe = apply(mid);
            if (probe.overflow) high = mid; else low = mid;
          }
          result = apply(low);
        }
      }
      return {ok:true, created:[], warnings:warnings, fontSize:result.fontSize, overflow:!!result.overflow, bounds:result.bounds, resolvedFont:chosen.postScriptName};
    } catch (e) {
      var out = {ok:false, error:{code:e.aesCode || "NATIVE_ERROR", message:String(e.message || e)}, created:[], warnings:warnings};
      if (wrote) {
        out.error.code = "NATIVE_ERROR";
        try {
          prop.setValue(original);
          var restored = prop.value;
          if (restored.text !== original.text || restored.font !== original.font || restored.fontSize !== original.fontSize || (original.boxText && (restored.boxTextSize[0] !== original.boxTextSize[0] || restored.boxTextSize[1] !== original.boxTextSize[1]))) out.uncertain = true;
        } catch (restoreError) { out.uncertain = true; }
        out.warnings.push("Native write failed; attempted local Source Text restoration. Inspect before retrying.");
      }
      return out;
    }
  }
  function staticProp(prop, name) {
    if (!prop) error("UNSUPPORTED", "Missing property " + name);
    if (prop.numKeys > 0 || prop.expressionEnabled || nonempty(prop.expression)) error("CONFLICT", "Existing animation/expression: " + name);
    if (prop.dimensionsSeparated) error("UNSUPPORTED", "Separated dimensions: " + name);
    return prop;
  }
  function animationPreflight(layer, o) {
    if (!o || !nonempty(o.owner) || !array(o.ownedLayerIds)) error("INVALID_ARGUMENT", "Explicit owned identity required");
    var owned = false;
    for (var i = 0; i < o.ownedLayerIds.length; i++) {
      if (!finite(o.ownedLayerIds[i]) || o.ownedLayerIds[i] % 1 !== 0) error("INVALID_ARGUMENT", "Integer owned IDs required");
      if (layer && layer.id === o.ownedLayerIds[i]) owned = true;
    }
    if (!owned) error("CONFLICT", "Target outside owned IDs");
    if (!finite(o.start) || !finite(o.duration) || o.duration <= 0 || !layer || !layer.containingComp || o.start < 0 || o.start + o.duration > layer.containingComp.duration || o.start < layer.inPoint || o.start + o.duration > layer.outPoint) error("INVALID_ARGUMENT", "Animation range must be positive and within layer/comp");
    if (layer.locked) error("CONFLICT", "Locked layer");
    var source = staticProp(target(layer, o.start), "Source Text"), doc = source.value;
    if (!nonempty(doc.text) || /[^\u0009\u000a\u000d\u0020-\u024f\u0300-\u036f\u2000-\u206f]/.test(doc.text)) error("UNSUPPORTED", "Nonempty horizontal Latin copy required");
    if (typeof LineOrientation !== "undefined" && doc.lineOrientation !== LineOrientation.HORIZONTAL) error("UNSUPPORTED", "Horizontal text required");
    var animators = layer.property("ADBE Text Properties").property("ADBE Text Animators");
    if (animators.numProperties > 0) error("CONFLICT", "Existing text animators must be preserved");
    return {source:source, animators:animators, transform:layer.property("ADBE Transform Group")};
  }
  function animate(prop, times, values) {
    for (var i = 0; i < times.length; i++) prop.setValueAtTime(times[i], values[i]);
    for (var k = 1; k <= times.length; k++) {
      var dims = 1, incoming = [], outgoing = [];
      if (!prop.isSpatial && array(values[0])) dims = values[0].length;
      for (var d = 0; d < dims; d++) { incoming.push(new KeyframeEase(0, 70)); outgoing.push(new KeyframeEase(0, 35)); }
      prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
      prop.setTemporalEaseAtKey(k, incoming, outgoing);
    }
  }
  function failure(e, wrote, created) {
    var r = {ok:false, error:{code:e.aesCode || "NATIVE_ERROR", message:String(e.message || e)}, created:created, warnings:[]};
    if (wrote) { r.error.code = "NATIVE_ERROR"; r.uncertain = true; r.warnings.push("Partial native edits may remain. Inspect returned identities before retrying."); }
    return r;
  }
  function reveal(layer, o) {
    var created = [], wrote = false, targets = [];
    try {
      var p = animationPreflight(layer, o);
      if (!finite(o.intensity) || o.intensity < 0 || o.intensity > 1) error("INVALID_ARGUMENT", "Intensity must be in [0,1]");
      if (o.technique !== "clean" && o.technique !== "stagger" && o.technique !== "masked" && o.technique !== "impact") error("INVALID_ARGUMENT", "Unknown reveal technique");
      if (o.unit !== "word" && o.unit !== "line") error("INVALID_ARGUMENT", "Unit must be word or line");
      var opacity = staticProp(p.transform.property("ADBE Opacity"), "Opacity");
      var position, scale, masks, bounds;
      if (o.technique === "clean") position = staticProp(p.transform.property("ADBE Position"), "Position");
      if (o.technique === "impact") scale = staticProp(p.transform.property("ADBE Scale"), "Scale");
      if (o.technique === "masked") {
        masks = layer.property("ADBE Mask Parade");
        if (!masks || masks.numProperties > 0) error("CONFLICT", "Existing masks must be preserved");
        bounds = measure(layer, o.start);
      }
      var end = o.start + o.duration;
      function mark(propName) { targets.push({layerId:layer.id, propertyPath:propName}); }
      // All preflight checks finish before the first native write.
      wrote = true;
      if (o.technique === "clean" || o.technique === "impact") {
        animate(opacity, [o.start,end], [0,opacity.value]); mark(["ADBE Transform Group","ADBE Opacity"]);
      }
      if (position) {
        var rest = position.value, from = rest.slice(0); from[1] += 36 * o.intensity;
        animate(position, [o.start,end], [from,rest]); mark(["ADBE Transform Group","ADBE Position"]);
      }
      if (scale) {
        var base = scale.value, small = [], over = [];
        for (var d = 0; d < base.length; d++) { small.push(base[d] * (1 - 0.2 * o.intensity)); over.push(base[d] * (1 + 0.035 * o.intensity)); }
        animate(scale, [o.start,o.start+o.duration*0.7,end], [small,over,base]); mark(["ADBE Transform Group","ADBE Scale"]);
      }
      if (o.technique === "stagger") {
        var anim = p.animators.addProperty("ADBE Text Animator");
        var index = anim.propertyIndex;
        created.push({layerId:layer.id,kind:"text-animator",name:anim.name});
        anim.name = o.owner + " | stagger"; created[created.length-1].name = anim.name;
        anim.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue(0);
        anim = p.animators.property(index);
        var sel = anim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        sel.property("ADBE Text Range Advanced").property("ADBE Text Range Type2").setValue(o.unit === "word" ? 3 : 4);
        var start = sel.property("ADBE Text Percent Start");
        animate(start, [o.start,end], [0,100]);
        mark(["ADBE Text Properties","ADBE Text Animators",index,"ADBE Text Selectors",1,"ADBE Text Percent Start"]);
      }
      if (masks) {
        var mask = masks.addProperty("ADBE Mask Atom");
        created.push({layerId:layer.id,kind:"mask",name:mask.name});
        mask.name = o.owner + " | reveal"; created[created.length-1].name = mask.name;
        var x = bounds.left - 2, y = bounds.top - 2, h = bounds.height + 4;
        function shape(width) { var s = new Shape(); s.vertices=[[x,y],[x+width,y],[x+width,y+h],[x,y+h]]; s.inTangents=[[0,0],[0,0],[0,0],[0,0]]; s.outTangents=[[0,0],[0,0],[0,0],[0,0]]; s.closed=true; return s; }
        animate(mask.property("ADBE Mask Shape"), [o.start,end], [shape(0),shape(bounds.width+4)]);
        mark(["ADBE Mask Parade",mask.propertyIndex,"ADBE Mask Shape"]);
      }
      return {ok:true,created:created,warnings:[],targets:targets};
    } catch (e) { return failure(e,wrote,created); }
  }
  function replacePhrase(comp, o) {
    var wrote = false;
    try {
      if (!o || !o.sourceLayer || !o.targetLayer || o.sourceLayer.id === o.targetLayer.id) error("INVALID_ARGUMENT", "Distinct source and target layers required");
      var source = o.sourceLayer, dest = o.targetLayer;
      if (source.containingComp !== comp || dest.containingComp !== comp) error("INVALID_ARGUMENT", "Both layers must belong to supplied comp");
      if (o.align !== "left" && o.align !== "center" && o.align !== "right") error("INVALID_ARGUMENT", "Unknown alignment");
      var a = animationPreflight(source,o), b = animationPreflight(dest,o), props = [];
      var layers = [source,dest], states = [];
      for (var i = 0; i < layers.length; i++) {
        var layer = layers[i], tr = layer.property("ADBE Transform Group");
        if (layer.parent || layer.threeDLayer) error("UNSUPPORTED", "Phrase alignment supports unparented 2D text");
        var pos = staticProp(tr.property("ADBE Position"),"Position"), sc = staticProp(tr.property("ADBE Scale"),"Scale"), anchor = staticProp(tr.property("ADBE Anchor Point"),"Anchor Point"), rot = staticProp(tr.property("ADBE Rotate Z"),"Rotation"), op = staticProp(tr.property("ADBE Opacity"),"Opacity");
        if (rot.value !== 0 || sc.value[0] <= 0 || sc.value[1] <= 0) error("UNSUPPORTED", "Alignment requires positive scale and zero rotation");
        states.push({pos:pos,scale:sc.value,anchor:anchor.value,opacity:op,bounds:measure(layer,o.start)});
      }
      var f = 0; if (o.align === "center") f = 0.5; if (o.align === "right") f = 1;
      function edge(s) { return (s.bounds.left+s.bounds.width*f-s.anchor[0])*s.scale[0]/100; }
      var s = states[0], t = states[1], position = t.pos.value.slice(0);
      position[0] = s.pos.value[0]+edge(s)-edge(t);
      // Align the top of measured glyph bounds, not incompatible font baselines.
      position[1] = s.pos.value[1]+(s.bounds.top-s.anchor[1])*s.scale[1]/100-(t.bounds.top-t.anchor[1])*t.scale[1]/100;
      wrote = true; t.pos.setValue(position);
      // Staged crossfade keeps the two distinct phrases from colliding at midpoint.
      var middle = o.start+o.duration/2, end = o.start+o.duration;
      animate(s.opacity,[o.start,middle,end],[s.opacity.value,0,0]);
      animate(t.opacity,[o.start,middle,end],[0,0,t.opacity.value]);
      return {ok:true,created:[],warnings:[],sourceLayerId:source.id,targetLayerId:dest.id,targets:[{layerId:source.id,propertyPath:["ADBE Transform Group","ADBE Opacity"]},{layerId:dest.id,propertyPath:["ADBE Transform Group","ADBE Opacity"]},{layerId:dest.id,propertyPath:["ADBE Transform Group","ADBE Position"]}]};
    } catch (e) { return failure(e,wrote,[]); }
  }

  return {measure:measure, fit:fit, reveal:reveal, replacePhrase:replacePhrase};
})();

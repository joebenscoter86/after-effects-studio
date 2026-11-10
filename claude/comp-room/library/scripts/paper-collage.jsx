// Native ES3 collage helpers. Loading this library never inspects or edits a project.
var AESCollage = (function () {
  function finite(n) { return typeof n === "number" && isFinite(n); }
  function array(a) { return Object.prototype.toString.call(a) === "[object Array]"; }
  function nonempty(s) { return typeof s === "string" && /\S/.test(s); }
  function error(code, message) { var e = new Error(message); e.aesCode = code; throw e; }
  function unit(n, name) { if (!finite(n) || n < 0 || n > 1) error("INVALID_ARGUMENT", name + " must be finite in [0,1]"); }
  function shared(o, comp) {
    if (!o || !nonempty(o.owner) || !comp || !finite(comp.frameRate) || comp.frameRate <= 0) error("INVALID_ARGUMENT", "Owner and a valid composition are required");
    unit(o.texture, "texture"); unit(o.border, "border"); unit(o.shadow, "shadow"); unit(o.intensity, "intensity");
    if (!finite(o.stepHz) || o.stepHz <= 0 || o.stepHz > comp.frameRate) error("INVALID_ARGUMENT", "stepHz must be positive and no greater than comp fps");
    if (!finite(o.seed) || o.seed < 0 || o.seed % 1 !== 0 || o.seed > 9007199254740991) error("INVALID_ARGUMENT", "seed must be a nonnegative safe integer");
  }
  function failure(e, wrote, created) {
    var r = {ok:false,error:{code:e.aesCode || "NATIVE_ERROR",message:String(e.message || e)},created:created,warnings:[]};
    if (wrote) { r.error.code = "NATIVE_ERROR"; r.uncertain = true; r.warnings.push("Partial native edits may remain. Inspect created identities before retrying."); }
    return r;
  }
  function property(group, matchName) { var p = group && group.property(matchName); if (!p) error("UNSUPPORTED", "Missing native property " + matchName); return p; }
  function effectParade(layer) { var p = layer.property("ADBE Effect Parade"); if (!p || typeof p.canAddProperty !== "function") error("UNSUPPORTED", "Native effect group unavailable"); return p; }
  function effectPreflight(effects) {
    var names = ["ADBE Roughen Edges", "ADBE Noise2", "ADBE Drop Shadow"];
    for (var i = 0; i < names.length; i++) if (!effects.canAddProperty(names[i])) error("UNSUPPORTED", "Native effect unavailable: " + names[i]);
    for (var j = 1; j <= effects.numProperties; j++) {
      var existing = effects.property(j);
      if (existing && typeof existing.name === "string" && existing.name.indexOf("AESCollage:") === 0) error("CONFLICT", "Layer already has AESCollage effects; inspect before reapplying");
    }
  }
  function targetProp(layer, name, keyedProperties) {
    var p = property(property(layer, "ADBE Transform Group"), name), path = "ADBE Transform Group/" + name;
    if (p.dimensionsSeparated) error("UNSUPPORTED", "Separated dimensions: " + path);
    if (p.expressionEnabled || nonempty(p.expression)) error("CONFLICT", "Existing expression: " + path);
    if (p.numKeys > 0) {
      var allowed = false;
      for (var i = 0; i < keyedProperties.length; i++) if (keyedProperties[i] === path) allowed = true;
      if (!allowed) error("CONFLICT", "Existing unowned keys: " + path);
    }
    return p;
  }
  function expression(seed, hz, amount, dimension) {
    // value is AE's authored/keyed value. No layer index or global random state.
    var stableSeed = seed % 1000000007;
    var a = "var k=Math.floor(time*" + hz + "+0.000001);";
    a += "var x=Math.sin((k+" + stableSeed + ")*12.9898)*43758.5453;";
    a += "var y=Math.sin((k+" + (stableSeed + 137) + ")*78.233)*12783.183;";
    a += "var n=x-Math.floor(x)-0.5;var m=y-Math.floor(y)-0.5;";
    return a + (dimension === 2 ? "value+[n*" + amount + ",m*" + amount + "];" : "value+n*" + amount + ";");
  }
  function setEffect(effect, label, values) {
    effect.name = "AESCollage:" + label;
    for (var i = 0; i < values.length; i++) {
      var p = effect.property(values[i][0]);
      if (!p || typeof p.setValue !== "function") error("UNSUPPORTED", "Native " + label + " parameter unavailable: " + values[i][0]);
      p.setValue(values[i][1]);
    }
  }
  function material(layer, effects, o, createdEffects) {
    var rough = effects.addProperty("ADBE Roughen Edges");
    if (!rough) error("NATIVE_ERROR", "Could not add Roughen Edges");
    createdEffects.push("ADBE Roughen Edges");
    setEffect(rough,"edge",[["ADBE Roughen Edges-0002",1.2 + o.border * 6],["ADBE Roughen Edges-0005",18 + o.border * 24]]);
    var noise = effects.addProperty("ADBE Noise2");
    if (!noise) error("NATIVE_ERROR", "Could not add Noise");
    createdEffects.push("ADBE Noise2");
    setEffect(noise,"grain",[["ADBE Noise2-0001",o.texture * 7]]);
    var shadow = effects.addProperty("ADBE Drop Shadow");
    if (!shadow) error("NATIVE_ERROR", "Could not add Drop Shadow");
    createdEffects.push("ADBE Drop Shadow");
    setEffect(shadow,"shadow",[["ADBE Drop Shadow-0002",o.shadow * 62],["ADBE Drop Shadow-0003",135],["ADBE Drop Shadow-0004",2 + o.shadow * 14],["ADBE Drop Shadow-0005",3 + o.shadow * 20]]);
  }
  function treatCutout(layer, o) {
    var created = [], wrote = false, effectsAdded = [];
    try {
      shared(o, layer && layer.containingComp);
      if (!array(o.ownedLayerIds) || !layer || !finite(layer.id) || layer.id % 1 !== 0) error("INVALID_ARGUMENT", "Explicit owned layer IDs required");
      var owned = false, i;
      for (i = 0; i < o.ownedLayerIds.length; i++) {
        if (!finite(o.ownedLayerIds[i]) || o.ownedLayerIds[i] % 1 !== 0) error("INVALID_ARGUMENT", "Owned IDs must be integers");
        if (o.ownedLayerIds[i] === layer.id) owned = true;
      }
      if (!owned || layer.locked) error("CONFLICT", "Target is not an unlocked owned layer");
      if (layer.threeDLayer || layer.property("ADBE Text Properties")) error("UNSUPPORTED", "Cutout treatment requires a two-dimensional non-text layer");
      var keyed = o.keyedProperties || [];
      if (!array(keyed)) error("INVALID_ARGUMENT", "keyedProperties must be an array");
      for (i = 0; i < keyed.length; i++) if (keyed[i] !== "ADBE Transform Group/ADBE Position" && keyed[i] !== "ADBE Transform Group/ADBE Rotate Z") error("INVALID_ARGUMENT", "Unknown keyed property");
      var position = targetProp(layer,"ADBE Position",keyed);
      var rotation = targetProp(layer,"ADBE Rotate Z",keyed);
      var effects = effectParade(layer); effectPreflight(effects);
      // All target checks precede the first change; an effect failure is reported as uncertain.
      wrote = true;
      material(layer,effects,o,effectsAdded);
      var paths = [];
      if (o.intensity > 0) {
        position.expression = expression(o.seed,o.stepHz,o.intensity * 10,2);
        paths.push("ADBE Transform Group/ADBE Position");
        rotation.expression = expression(o.seed + 19,o.stepHz,o.intensity * 2,1);
        paths.push("ADBE Transform Group/ADBE Rotate Z");
      }
      return {ok:true,created:created,warnings:[],layerId:layer.id,changedPropertyPaths:paths,createdEffects:effectsAdded};
    } catch (e) { return failure(e,wrote,created); }
  }
  function paper(comp, o) {
    var created = [], wrote = false, effectsAdded = [];
    try {
      shared(o,comp);
      if (!nonempty(o.name) || !finite(o.width) || !finite(o.height) || o.width <= 0 || o.height <= 0 || !array(o.color) || o.color.length !== 3) error("INVALID_ARGUMENT", "Paper name, dimensions and RGB required");
      for (var i = 0; i < 3; i++) unit(o.color[i], "color channel");
      if (!comp.layers || typeof comp.layers.addShape !== "function") error("UNSUPPORTED", "Native shape layers unavailable");
      // Native effect support is checked before layer creation where the host exposes app.effects.
      if (typeof app !== "undefined" && app.effects) {
        var available = {}, effectsList = app.effects;
        for (i = 0; i < effectsList.length; i++) available[effectsList[i].matchName] = true;
        if (!available["ADBE Roughen Edges"] || !available["ADBE Noise2"] || !available["ADBE Drop Shadow"]) error("UNSUPPORTED", "Required native material effect unavailable");
      }
      wrote = true;
      var layer = comp.layers.addShape();
      if (!layer) error("NATIVE_ERROR", "Could not add paper shape");
      created.push({layerId:layer.id,kind:"shape",name:o.name});
      layer.name = o.name;
      var root = property(layer,"ADBE Root Vectors Group");
      var group = root.addProperty("ADBE Vector Group");
      if (!group) error("NATIVE_ERROR", "Could not add paper group");
      group.name = "Editable paper edge";
      var contents = property(group,"ADBE Vectors Group");
      var path = contents.addProperty("ADBE Vector Shape - Group");
      var shape = new Shape(), vertices = [], ins = [], outs = [];
      var points = 24, halfW = o.width / 2, halfH = o.height / 2;
      for (i = 0; i < points; i++) {
        var edge = Math.floor(i / 6), frac = (i % 6) / 6, j = (Math.sin((o.seed + i * 17) * 12.9898) * 43758.5453); j = (j - Math.floor(j) - .5) * o.border * 12;
        if (edge === 0) vertices.push([-halfW + frac * o.width, -halfH + j]);
        else if (edge === 1) vertices.push([halfW + j, -halfH + frac * o.height]);
        else if (edge === 2) vertices.push([halfW - frac * o.width, halfH + j]);
        else vertices.push([-halfW + j, halfH - frac * o.height]);
        ins.push([0,0]); outs.push([0,0]);
      }
      shape.vertices = vertices; shape.inTangents = ins; shape.outTangents = outs; shape.closed = true;
      property(path,"ADBE Vector Shape").setValue(shape);
      var fill = contents.addProperty("ADBE Vector Graphic - Fill");
      property(fill,"ADBE Vector Fill Color").setValue(o.color);
      if (o.border > 0) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        property(stroke,"ADBE Vector Stroke Color").setValue([Math.max(0,o.color[0]-.14),Math.max(0,o.color[1]-.14),Math.max(0,o.color[2]-.14)]);
        property(stroke,"ADBE Vector Stroke Width").setValue(.5 + o.border * 2);
      }
      var effects = effectParade(layer); effectPreflight(effects); material(layer,effects,o,effectsAdded);
      if (o.intensity > 0) property(property(layer,"ADBE Transform Group"),"ADBE Rotate Z").expression = expression(o.seed + 19,o.stepHz,o.intensity * 1.2,1);
      return {ok:true,created:created,warnings:[],layerId:layer.id,effectPaths:effectsAdded,shapePaths:["ADBE Root Vectors Group/ADBE Vector Group/ADBE Vectors Group/ADBE Vector Shape - Group"]};
    } catch (e) { return failure(e,wrote,created); }
  }
  return {paper:paper,treatCutout:treatCutout};
})();

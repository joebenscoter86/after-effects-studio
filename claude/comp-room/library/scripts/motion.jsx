// Brand-neutral ES3 motion helpers. No project mutation happens at load.
var AESMotion = (function () {
  function frames(n, comp) { return n / comp.frameRate; }
  function keys(prop, times, values, mode) {
    if (times.length !== values.length || !times.length) throw new Error("Equal nonempty time/value arrays required");
    for (var n = 1; n < times.length; n++) if (times[n] <= times[n-1]) throw new Error("Times must increase");
    for (var i = 0; i < times.length; i++) prop.setValueAtTime(times[i], values[i]);
    for (var j = 0; j < times.length; j++) {
      var k = prop.nearestKeyIndex(times[j]);
      if (mode === "linear") {
        prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
      } else {
        var dims = (!prop.isSpatial && (prop.propertyValueType === PropertyValueType.TwoD || prop.propertyValueType === PropertyValueType.ThreeD)) ? prop.value.length : 1;
        var ii = mode === "exit" ? 12 : mode === "travel" ? 82 : 85;
        var oi = mode === "exit" ? 75 : mode === "travel" ? 82 : 28;
        var incoming = [], outgoing = [];
        for (var d = 0; d < dims; d++) { incoming.push(new KeyframeEase(0, ii)); outgoing.push(new KeyframeEase(0, oi)); }
        prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
        prop.setTemporalEaseAtKey(k, incoming, outgoing);
      }
    }
    return prop;
  }
  var spring = "var n=0;if(numKeys>0){n=nearestKey(time).index;if(key(n).time>time)n--;}if(n>0&&n==numKeys){var t=time-key(n).time;var v=velocityAtTime(key(n).time-thisComp.frameDuration/10);value+v*0.05*Math.sin(2.6*t*2*Math.PI)/Math.exp(6.5*t);}else value;";
  function pop(layer, start, duration, base) {
    var rest = base || layer.scale.value, zero = [];
    for (var i = 0; i < rest.length; i++) zero.push(0);
    keys(layer.scale, [start,start+duration], [zero,rest], "linear");
    layer.scale.expression = spring;
  }
  function pivot(layer, point) { layer.anchorPoint.setValue(point); layer.position.setValue(point); return layer; }
  function clearOwned(comp, prefix) {
    if (!prefix || prefix.length < 4) throw new Error("Use a unique scene prefix of at least four characters");
    for (var i = comp.numLayers; i >= 1; i--) if (comp.layer(i).name.indexOf(prefix) === 0) comp.layer(i).remove();
  }
  return {frames:frames,keys:keys,pop:pop,pivot:pivot,clearOwned:clearOwned,spring:spring};
})();

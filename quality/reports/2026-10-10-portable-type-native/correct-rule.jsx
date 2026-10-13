var expectedSuffix = "/quality/renders/2026-10-10-portable-type-native/margin-03-v1-diagnostic.aep";
var actual = app.project.file ? app.project.file.fsName : "";
if (actual.slice(-expectedSuffix.length) !== expectedSuffix) throw new Error("Unexpected AFT17 project; rule correction withheld");
var comp = AE.findItemById(13);
if (!comp || comp.name !== "AFT17_TYPE_MARGIN03_v1_20261010" || comp.numLayers !== 12) throw new Error("Unexpected AFT17 comp state");
var rule = AE.findLayerById(comp, 36);
if (!rule || rule.name !== "AFT17_TYPE_rule_to_index") throw new Error("Owned rule layer missing");
var tr = rule.property("ADBE Transform Group");
var pos = tr.property("ADBE Position");
var scale = tr.property("ADBE Scale");
var rot = tr.property("ADBE Rotate Z");
AE.removeAllKeys(pos); AE.removeAllKeys(scale); AE.removeAllKeys(rot);
var times = [1.7, 2.3, 3.0, 3.35];
var positions = [[825,634],[825,634],[1765,634],[1765,530]];
var scales = [[0,100],[100,100],[6,100],[6,100]];
var rotations = [0,0,0,90];
for (var i=0; i<times.length; i++) {
  pos.setValueAtTime(times[i], positions[i]);
  scale.setValueAtTime(times[i], scales[i]);
  rot.setValueAtTime(times[i], rotations[i]);
}
for (var k=1; k<=times.length; k++) {
  AE.setEase(pos,k,70,70); AE.setEase(scale,k,70,70); AE.setEase(rot,k,70,70);
}
return {compId:comp.id, ruleId:rule.id, layerCount:comp.numLayers, times:times, positions:positions, scales:scales, rotations:rotations};

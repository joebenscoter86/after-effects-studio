if (app.project.file !== null || app.project.numItems !== 0) throw new Error("AFT17 type build requires an empty untitled project");
var project = app.project;
var comp = project.items.addComp("AFT17_TYPE_MARGIN03_v1_20261010", 1920, 1080, 1, 7, 30);
comp.bgColor = [0.965, 0.953, 0.929];
var ink = [0.13, 0.145, 0.16];
var cobalt = [0.19, 0.32, 0.78];
var bg = comp.layers.addSolid([0.965, 0.953, 0.929], "AFT17_TYPE_ground", 1920, 1080, 1, 7);
bg.moveToEnd();
function transform(layer, matchName) { return layer.property("ADBE Transform Group").property(matchName); }
function textLayer(name, value, size, x, y, color, font) {
  var layer = comp.layers.addText(value);
  layer.name = name;
  var source = layer.property("ADBE Text Properties").property("ADBE Text Document");
  var doc = source.value;
  doc.text = value;
  doc.font = font;
  doc.fontSize = size;
  doc.applyFill = true;
  doc.fillColor = color;
  doc.applyStroke = false;
  doc.justification = ParagraphJustification.CENTER_JUSTIFY;
  source.setValue(doc);
  transform(layer, "ADBE Position").setValue([x, y]);
  return layer;
}
function key(prop, t, v) { prop.setValueAtTime(t, v); }
function ease(prop) { for (var k=1; k<=prop.numKeys; k++) AE.setEase(prop, k, 70, 70); }
var glyphs = ["M", "A", "R", "G", "I", "N"];
var xs = [425, 585, 745, 905, 1065, 1225];
var offsets = [[-95,-70],[-60,95],[-35,-100],[40,95],[65,-70],[105,80]];
var letterIds = [];
for (var i=0; i<glyphs.length; i++) {
  var letter = textLayer("AFT17_TYPE_letter_"+i+"_"+glyphs[i], glyphs[i], 180, xs[i], 520, ink, "HelveticaNeue-Medium");
  var pos = transform(letter, "ADBE Position");
  var op = transform(letter, "ADBE Opacity");
  var start = 0.13 + i*0.12;
  var end = 0.95 + i*0.13;
  key(pos, start, [xs[i]+offsets[i][0], 520+offsets[i][1]]);
  key(pos, end, [xs[i], 520]);
  key(op, start, 0); key(op, start+0.18, 100);
  ease(pos); ease(op);
  letterIds.push(letter.id);
}
var slash = textLayer("AFT17_TYPE_slash", "/", 168, 1390, 520, ink, "HelveticaNeue-Light");
var number = textLayer("AFT17_TYPE_number_03", "03", 168, 1565, 520, ink, "HelveticaNeue-Medium");
var slashOp = transform(slash, "ADBE Opacity");
var numberOp = transform(number, "ADBE Opacity");
key(slashOp, 2.45, 0); key(slashOp, 2.8, 100); ease(slashOp);
key(numberOp, 2.58, 0); key(numberOp, 2.98, 100); ease(numberOp);
var rule = comp.layers.addShape();
rule.name = "AFT17_TYPE_rule_to_index";
AE.rect(rule, [980, 8], [0,0], {name:"Rule", fill:cobalt});
var rulePos = transform(rule, "ADBE Position");
var ruleScale = transform(rule, "ADBE Scale");
var ruleRot = transform(rule, "ADBE Rotate Z");
var ruleOp = transform(rule, "ADBE Opacity");
key(rulePos, 1.7, [825, 634]); key(rulePos, 2.3, [825, 634]); key(rulePos, 3.35, [1770, 535]);
key(ruleScale, 1.7, [0,100]); key(ruleScale, 2.3, [100,100]); key(ruleScale, 3.35, [6,100]);
key(ruleRot, 2.3, 0); key(ruleRot, 3.35, 90);
key(ruleOp, 1.7, 100);
ease(rulePos); ease(ruleScale); ease(ruleRot);
var payoff = textLayer("AFT17_TYPE_payoff", "Notes in motion.", 59, 960, 758, ink, "HelveticaNeue");
var payoffOp = transform(payoff, "ADBE Opacity");
var payoffPos = transform(payoff, "ADBE Position");
key(payoffOp, 3.55, 0); key(payoffOp, 4.2, 100); ease(payoffOp);
key(payoffPos, 3.55, [960, 782]); key(payoffPos, 4.2, [960, 758]); ease(payoffPos);
var label = textLayer("AFT17_TYPE_top_label", "EDITORIAL STUDY  /  03", 28, 960, 173, ink, "HelveticaNeue");
var labelOp = transform(label, "ADBE Opacity");
key(labelOp, 0.0, 0); key(labelOp, 0.6, 100); ease(labelOp);
return {compId:comp.id, compName:comp.name, numLayers:comp.numLayers, letterIds:letterIds, slashId:slash.id, numberId:number.id, ruleId:rule.id, payoffId:payoff.id, labelId:label.id, groundId:bg.id};

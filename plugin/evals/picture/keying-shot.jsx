// Setup for picture eval 18 (keying). Run it unchanged as the `code` of
// ae_do { operation: "eval.run" }. It builds a synthetic green-screen shot in
// the open project from solids, masks and effects (no footage, no files):
//   - a source comp: a green screen ramped 1.5x brighter to the right, a grey
//     stand in the top-left corner, a figure precomp of feathered masked
//     solids with six thin hair strands that drifts 4 px right and 2 px down
//     over frames 0..8 and then holds, and AE's Noise effect on an
//     adjustment layer over everything (fine grain);
//   - a key comp holding the source comp as one layer, "green shot".
// Everything goes in a new folder with a unique name; nothing existing is
// changed, removed or rendered, and the render queue is not touched. It
// refuses (and builds nothing) unless the project is 8 bpc with no working
// space, the setup the grader's numbers were measured in.
// NOT VERIFIED IN AFTER EFFECTS: whether the Ramp and Noise property names
// below resolve, whether Noise changes from frame to frame, and how AE's mask
// feather compares with the linear ramp the thresholds were calibrated on.
// SCENE-BEGIN
var SCENE = {"id":"keying-shot","version":1,"width":1080,"height":1920,"fps":24,"frames":16,"bg":[0,0,0],"layer":"green shot","screen":{"left":[0.2,0.36,0.24],"right":[0.3,0.54,0.36]},"grainAmount":2,"motion":{"to":[4,2],"untilFrame":8},"parts":[{"name":"body","colour":[0.16,0.21,0.36],"feather":6,"polygons":[[[300,1080],[780,1080],[800,1940],[280,1940]],[[230,1110],[320,1100],[330,1700],[250,1710]]]},{"name":"skin","colour":[0.67,0.46,0.4],"feather":6,"polygons":[[[480,940],[600,940],[600,1100],[480,1100]],[[690,820],[688.72,844.8],[684.89,869.18],[678.58,892.71],[669.9,915],[659,935.66],[646.07,954.35],[631.31,970.74],[615,984.54],[597.4,995.54],[578.82,1003.53],[559.58,1008.37],[540,1010],[520.42,1008.37],[501.18,1003.53],[482.6,995.54],[465,984.54],[448.69,970.74],[433.93,954.35],[421,935.66],[410.1,915],[401.42,892.71],[395.11,869.18],[391.28,844.8],[390,820],[391.28,795.2],[395.11,770.82],[401.42,747.29],[410.1,725],[421,704.34],[433.93,685.65],[448.69,669.26],[465,655.46],[482.6,644.46],[501.18,636.47],[520.42,631.63],[540,630],[559.58,631.63],[578.82,636.47],[597.4,644.46],[615,655.46],[631.31,669.26],[646.07,685.65],[659,704.34],[669.9,725],[678.58,747.29],[684.89,770.82],[688.72,795.2]]]},{"name":"hair","colour":[0.22,0.15,0.1],"feather":4,"polygons":[[[380,800],[381.37,775.85],[385.45,752.12],[392.18,729.2],[401.44,707.5],[413.06,687.38],[426.86,669.19],[442.6,653.23],[460,639.79],[478.77,629.08],[498.59,621.3],[519.12,616.58],[540,615],[560.88,616.58],[581.41,621.3],[601.23,629.08],[620,639.79],[637.4,653.23],[653.14,669.19],[666.94,687.38],[678.56,707.5],[687.82,729.2],[694.55,752.12],[698.63,775.85],[700,800]]]},{"name":"strands","colour":[0.22,0.15,0.1],"feather":1.5,"polygons":[[[468.5,660],[471.5,660],[431.5,515],[428.5,515]],[[496.5,660],[499.5,660],[475.5,515],[472.5,515]],[[524.5,660],[527.5,660],[519.5,515],[516.5,515]],[[552.5,660],[555.5,660],[563.5,515],[560.5,515]],[[580.5,660],[583.5,660],[607.5,515],[604.5,515]],[[608.5,660],[611.5,660],[651.5,515],[648.5,515]]]}],"stand":{"colour":[0.45,0.45,0.47],"box":{"x":40,"y":40,"width":110,"height":290}},"gradeFrames":{"keyed":[4,10,11,12,13],"edge":[4,10],"flicker":[10,11,12,13],"source":10},"screenBoxes":[{"name":"screen left","x":40,"y":420,"width":160,"height":580},{"name":"screen right","x":860,"y":300,"width":180,"height":1300},{"name":"screen top","x":300,"y":60,"width":500,"height":380},{"name":"screen low left","x":40,"y":1750,"width":160,"height":150}],"subjectBoxes":[{"name":"body core","x":340,"y":1140,"width":400,"height":740},{"name":"head core","x":470,"y":830,"width":140,"height":130},{"name":"hair core","x":480,"y":660,"width":120,"height":100}],"standBox":{"name":"corner stand","x":34,"y":34,"width":122,"height":302}};
// SCENE-END
var proj = app.project;
if (!proj) throw new Error("No project is open.");
if (proj.bitsPerChannel !== 8) throw new Error("The keying eval needs an 8 bpc project; this one is " + proj.bitsPerChannel + " bpc. Nothing was built.");
var ws = String(proj.workingSpace === undefined ? "None" : proj.workingSpace);
if (ws !== "None" && ws !== "") throw new Error("The keying eval needs a project with no working space; this one uses '" + ws + "'. Nothing was built.");

var W = SCENE.width, H = SCENE.height, FPS = SCENE.fps, DUR = SCENE.frames / SCENE.fps;
var MARK = "comp-room picture eval: " + SCENE.id + " v" + SCENE.version;
var stamp = String(new Date().getTime());
var folder = proj.items.addFolder("Comp Room eval keying " + stamp);
folder.comment = MARK;

function rgba(c) { return [c[0], c[1], c[2], 1]; }
function rectPoly(b) { return [[b.x, b.y], [b.x + b.width, b.y], [b.x + b.width, b.y + b.height], [b.x, b.y + b.height]]; }
function addComp(name) {
  var c = proj.items.addComp(name, W, H, 1, DUR, FPS);
  c.parentFolder = folder; c.bgColor = SCENE.bg; c.comment = MARK;
  return c;
}
function solid(comp, name, colour) {
  var l = comp.layers.addSolid(colour, name, W, H, 1, DUR);
  l.source.parentFolder = folder; l.comment = MARK;
  return l;
}
function addMask(layer, points, feather) {
  var m = layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
  var s = new Shape(); s.vertices = points; s.closed = true;
  m.property("ADBE Mask Shape").setValue(s);
  m.property("ADBE Mask Feather").setValue([feather, feather]);
  m.maskMode = MaskMode.ADD;
  return m;
}
function setProp(effect, matchName, displayName, value) {
  var p = effect.property(matchName);
  if (!p) p = effect.property(displayName);
  if (!p) throw new Error("Effect " + effect.matchName + " has no property " + matchName + " / " + displayName + ". Nothing else was changed after this point; the folder " + folder.name + " is partial.");
  p.setValue(value);
}

// The figure: each part one solid with a mask per polygon, later parts on top.
var figure = addComp("Comp Room eval figure " + stamp);
for (var i = 0; i < SCENE.parts.length; i++) {
  var part = SCENE.parts[i];
  var l = solid(figure, part.name, part.colour);
  for (var k = 0; k < part.polygons.length; k++) addMask(l, part.polygons[k], part.feather);
}

// The source: screen, stand, figure, grain (bottom to top).
var source = addComp("Comp Room eval green source " + stamp);
var screen = solid(source, "screen", SCENE.screen.left);
var ramp = screen.property("ADBE Effect Parade").addProperty("ADBE Ramp");
setProp(ramp, "ADBE Ramp-0001", "Start of Ramp", [0, H / 2]);
setProp(ramp, "ADBE Ramp-0002", "Start Color", rgba(SCENE.screen.left));
setProp(ramp, "ADBE Ramp-0003", "End of Ramp", [W, H / 2]);
setProp(ramp, "ADBE Ramp-0004", "End Color", rgba(SCENE.screen.right));
var stand = solid(source, "stand", SCENE.stand.colour);
addMask(stand, rectPoly(SCENE.stand.box), 0);
var figLayer = source.layers.add(figure);
figLayer.name = "figure";
var pos = figLayer.property("ADBE Transform Group").property("ADBE Position");
pos.setValueAtTime(0, [W / 2, H / 2]);
pos.setValueAtTime(SCENE.motion.untilFrame / FPS, [W / 2 + SCENE.motion.to[0], H / 2 + SCENE.motion.to[1]]);
var grain = solid(source, "grain", [0.5, 0.5, 0.5]);
grain.adjustmentLayer = true;
var noise = grain.property("ADBE Effect Parade").addProperty("ADBE Noise");
setProp(noise, "ADBE Noise-0001", "Amount of Noise", SCENE.grainAmount);

// The comp the agent keys.
var key = addComp("Comp Room eval key " + stamp);
var shot = key.layers.add(source);
shot.name = SCENE.layer;

return {
  ok: true,
  scene: SCENE.id + " v" + SCENE.version,
  folder: folder.name,
  keyComp: { id: key.id, name: key.name },
  sourceComp: { id: source.id, name: source.name },
  layer: SCENE.layer,
  fps: FPS,
  frames: SCENE.frames,
  note: "Key the layer '" + SCENE.layer + "' in keyComp. Do not edit sourceComp or the figure comp."
};

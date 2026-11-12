// Setup for picture eval 24 (sit an element in its plate). Run it unchanged as
// the `code` of ae_do { operation: "eval.run" }. It builds, from solids, masks
// and two effects (no footage, no files):
//   - a plate comp: a wall and a dark panel, with Gaussian Blur and then Noise
//     on an adjustment layer above them (the plate's softness and grain);
//   - an element comp: a light card with a dark stripe, hard-edged and clean;
//   - a seat comp holding "plate" (bottom) and "element" (top).
// Everything goes in a new folder with a unique name; nothing existing is
// changed, removed or rendered, and the render queue is not touched. It
// refuses unless the project is 8 bpc with no working space.
// SCENE-BEGIN
var SCENE = {"id":"seat-plate","version":1,"width":1280,"height":720,"fps":24,"frames":24,"bg":[0,0,0],"layer":"element","plateLayer":"plate","plate":{"wall":[0.45,0.43,0.4],"panel":{"colour":[0.12,0.12,0.13],"box":{"x":120,"y":150,"width":400,"height":450}},"blur":6,"noise":6},"element":{"card":{"colour":[0.78,0.76,0.72],"box":{"x":760,"y":160,"width":360,"height":400}},"stripe":{"colour":[0.15,0.15,0.16],"box":{"x":760,"y":330,"width":360,"height":80}}},"gradeFrames":[0,1],"regions":{"plate":{"x":40,"y":200,"width":180,"height":350},"element":{"x":800,"y":250,"width":280,"height":240}},"expected":{"plate":{"temporalGrain":4.42,"spatialGrain":4.43,"edgeWidth":4.7,"lumaMean":0.2616},"element":{"temporalGrain":0,"spatialGrain":0,"edgeWidth":0.8,"lumaMean":0.558}}};
// SCENE-END
var proj = app.project;
if (!proj) throw new Error("No project is open.");
if (proj.bitsPerChannel !== 8) throw new Error("The seat eval needs an 8 bpc project; this one is " + proj.bitsPerChannel + " bpc. Nothing was built.");
var ws = String(proj.workingSpace === undefined ? "None" : proj.workingSpace);
if (ws !== "None" && ws !== "") throw new Error("The seat eval needs a project with no working space; this one uses '" + ws + "'. Nothing was built.");

var W = SCENE.width, H = SCENE.height, FPS = SCENE.fps, DUR = SCENE.frames / SCENE.fps;
var MARK = "comp-room picture eval: " + SCENE.id + " v" + SCENE.version;
var stamp = String(new Date().getTime());
var folder = proj.items.addFolder("Comp Room eval seat " + stamp);
folder.comment = MARK;

function rectPoly(b) { return [[b.x, b.y], [b.x + b.width, b.y], [b.x + b.width, b.y + b.height], [b.x, b.y + b.height]]; }
function addComp(name) {
  var c = proj.items.addComp(name, W, H, 1, DUR, FPS);
  c.parentFolder = folder; c.bgColor = SCENE.bg; c.comment = MARK;
  return c;
}
function solid(comp, name, colour, poly) {
  var l = comp.layers.addSolid(colour, name, W, H, 1, DUR);
  l.source.parentFolder = folder; l.comment = MARK;
  if (poly) {
    var m = l.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    var s = new Shape(); s.vertices = poly; s.closed = true;
    m.property("ADBE Mask Shape").setValue(s);
    m.maskMode = MaskMode.ADD;
  }
  return l;
}
function setProp(effect, matchName, displayName, value) {
  var p = null;
  try { p = effect.property(matchName); } catch (e1) { p = null; }
  if (!p) { for (var i = 1; i <= effect.numProperties; i++) if (effect.property(i).name === displayName) p = effect.property(i); }
  if (!p) throw new Error("Effect " + effect.matchName + " has no property " + matchName + " / " + displayName + "; the folder " + folder.name + " is partial.");
  p.setValue(value);
}

var plate = addComp("Comp Room eval plate " + stamp);
solid(plate, "wall", SCENE.plate.wall, null);
solid(plate, "panel", SCENE.plate.panel.colour, rectPoly(SCENE.plate.panel.box));
var finish = solid(plate, "plate finish", [1, 1, 1], null);
finish.adjustmentLayer = true;
var fx = finish.property("ADBE Effect Parade");
var blur = fx.addProperty("ADBE Gaussian Blur 2");
setProp(blur, "ADBE Gaussian Blur 2-0001", "Blurriness", SCENE.plate.blur);
setProp(blur, "ADBE Gaussian Blur 2-0003", "Repeat Edge Pixels", 1);
var noise = fx.addProperty("ADBE Noise2");
setProp(noise, "ADBE Noise2-0001", "Amount of Noise", SCENE.plate.noise);

var element = addComp("Comp Room eval element " + stamp);
solid(element, "card", SCENE.element.card.colour, rectPoly(SCENE.element.card.box));
solid(element, "stripe", SCENE.element.stripe.colour, rectPoly(SCENE.element.stripe.box));

var comp = addComp("Comp Room eval seat " + stamp);
var plateLayer = comp.layers.add(plate);
plateLayer.name = SCENE.plateLayer;
var elementLayer = comp.layers.add(element);
elementLayer.name = SCENE.layer;

return {
  ok: true,
  scene: SCENE.id + " v" + SCENE.version,
  folder: folder.name,
  seatComp: { id: comp.id, name: comp.name },
  elementLayer: SCENE.layer,
  plateLayer: SCENE.plateLayer,
  regions: SCENE.regions,
  note: "Change the layer '" + SCENE.layer + "' itself (effects on that layer). Leave the plate and the precomps as they are."
};

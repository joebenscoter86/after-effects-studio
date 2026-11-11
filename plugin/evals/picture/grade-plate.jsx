// Setup for picture eval 19 (grade to plate). Run it unchanged as the `code`
// of ae_do { operation: "eval.run" }. It builds, from solids, masks and one
// Ramp effect (no footage, no files):
//   - a plate comp: a warm grey wall, a dark doorway (plate shadow), a grey
//     panel (plate neutral) and a light window panel (plate highlight);
//   - a subject comp: shirt, trousers, a held card, a head and a grey ramp
//     strip, whose colours are the plate's shadow / neutral / highlight put
//     through a deliberate error: out = true x (1.08, 1.00, 0.86) + 0.05,
//     a warm cast (red up 8%, blue down 14%) and raised blacks (+0.05);
//   - a grade comp holding "plate" (bottom) and "subject" (top).
// Everything goes in a new folder with a unique name; nothing existing is
// changed, removed or rendered, and the render queue is not touched. It
// refuses unless the project is 8 bpc with no working space.
// NOT VERIFIED IN AFTER EFFECTS: the Ramp property names below, and that an
// 8 bpc solid renders back within one 8-bit step of the colour it was given.
// SCENE-BEGIN
var SCENE = {"id":"grade-plate","version":1,"width":1920,"height":1080,"fps":24,"frames":24,"bg":[0,0,0],"layer":"subject","plateLayer":"plate","error":{"cast":[1.08,1,0.86],"lift":0.05},"truth":{"shadow":[0.07,0.07,0.08],"neutral":[0.45,0.45,0.45],"highlight":[0.82,0.82,0.8]},"plate":{"wall":[0.42,0.4,0.37],"rects":[{"name":"doorway","colour":[0.07,0.07,0.08],"box":{"x":100,"y":300,"width":300,"height":700}},{"name":"grey panel","colour":[0.45,0.45,0.45],"box":{"x":1400,"y":250,"width":350,"height":350}},{"name":"window panel","colour":[0.82,0.82,0.8],"box":{"x":1450,"y":700,"width":350,"height":250}}]},"subject":{"rects":[{"name":"shirt","colour":[0.536,0.5,0.437],"box":{"x":720,"y":400,"width":460,"height":360}},{"name":"trousers","colour":[0.1256,0.12,0.1188],"box":{"x":720,"y":760,"width":460,"height":320}},{"name":"card","colour":[0.9356,0.87,0.738],"box":{"x":780,"y":460,"width":160,"height":120}}],"head":{"colour":[0.7736,0.51,0.394],"centre":[950,290],"radii":[90,110]},"strip":{"box":{"x":1110,"y":420,"width":40,"height":640},"top":[0.9572,0.89,0.7724],"bottom":[0.1148,0.11,0.1016]}},"gradeFrame":0,"regions":{"subject shadow":{"x":780,"y":820,"width":300,"height":220},"subject neutral":{"x":800,"y":620,"width":200,"height":120},"subject highlight":{"x":800,"y":480,"width":120,"height":80},"plate shadow":{"x":140,"y":360,"width":220,"height":580},"plate neutral":{"x":1440,"y":290,"width":270,"height":270},"plate highlight":{"x":1490,"y":740,"width":270,"height":170}},"subjectBox":{"x":700,"y":170,"width":500,"height":910}};
// SCENE-END
var proj = app.project;
if (!proj) throw new Error("No project is open.");
if (proj.bitsPerChannel !== 8) throw new Error("The grade eval needs an 8 bpc project; this one is " + proj.bitsPerChannel + " bpc. Nothing was built.");
var ws = String(proj.workingSpace === undefined ? "None" : proj.workingSpace);
if (ws !== "None" && ws !== "") throw new Error("The grade eval needs a project with no working space; this one uses '" + ws + "'. Nothing was built.");

var W = SCENE.width, H = SCENE.height, FPS = SCENE.fps, DUR = SCENE.frames / SCENE.fps;
var MARK = "comp-room picture eval: " + SCENE.id + " v" + SCENE.version;
var stamp = String(new Date().getTime());
var folder = proj.items.addFolder("Comp Room eval grade " + stamp);
folder.comment = MARK;

function rgba(c) { return [c[0], c[1], c[2], 1]; }
function rectPoly(b) { return [[b.x, b.y], [b.x + b.width, b.y], [b.x + b.width, b.y + b.height], [b.x, b.y + b.height]]; }
function ellipsePoly(c, r) {
  var pts = [];
  for (var i = 0; i < 48; i++) { var t = 2 * Math.PI * i / 48; pts.push([c[0] + r[0] * Math.cos(t), c[1] + r[1] * Math.sin(t)]); }
  return pts;
}
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
  var p = effect.property(matchName);
  if (!p) p = effect.property(displayName);
  if (!p) throw new Error("Effect " + effect.matchName + " has no property " + matchName + " / " + displayName + "; the folder " + folder.name + " is partial.");
  p.setValue(value);
}

var plate = addComp("Comp Room eval plate " + stamp);
solid(plate, "wall", SCENE.plate.wall, null);
for (var i = 0; i < SCENE.plate.rects.length; i++) {
  var pr = SCENE.plate.rects[i];
  solid(plate, pr.name, pr.colour, rectPoly(pr.box));
}

var subject = addComp("Comp Room eval subject " + stamp);
for (var j = 0; j < SCENE.subject.rects.length; j++) {
  var sr = SCENE.subject.rects[j];
  solid(subject, sr.name, sr.colour, rectPoly(sr.box));
}
var st = SCENE.subject.strip;
var strip = solid(subject, "ramp strip", st.top, rectPoly(st.box));
var ramp = strip.property("ADBE Effect Parade").addProperty("ADBE Ramp");
var mid = st.box.x + st.box.width / 2;
setProp(ramp, "ADBE Ramp-0001", "Start of Ramp", [mid, st.box.y]);
setProp(ramp, "ADBE Ramp-0002", "Start Color", rgba(st.top));
setProp(ramp, "ADBE Ramp-0003", "End of Ramp", [mid, st.box.y + st.box.height - 1]);
setProp(ramp, "ADBE Ramp-0004", "End Color", rgba(st.bottom));
solid(subject, "head", SCENE.subject.head.colour, ellipsePoly(SCENE.subject.head.centre, SCENE.subject.head.radii));

var comp = addComp("Comp Room eval grade " + stamp);
var plateLayer = comp.layers.add(plate);
plateLayer.name = SCENE.plateLayer;
var subjectLayer = comp.layers.add(subject);
subjectLayer.name = SCENE.layer;

return {
  ok: true,
  scene: SCENE.id + " v" + SCENE.version,
  folder: folder.name,
  gradeComp: { id: comp.id, name: comp.name },
  subjectLayer: SCENE.layer,
  plateLayer: SCENE.plateLayer,
  regions: SCENE.regions,
  note: "Grade the layer '" + SCENE.layer + "' itself (effects on that layer). Leave the plate and the precomps as they are."
};

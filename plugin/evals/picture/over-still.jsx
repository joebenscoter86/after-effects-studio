// Setup for picture eval 20 (a reusable still over a new background). Run it
// unchanged as the `code` of ae_do { operation: "eval.run" }. It builds one
// comp with a strong pink background colour and one layer, "glow": a warm
// white solid with an elliptical mask, radius 220 px, feathered 200 px. A
// capture of it has the pink laid into every soft pixel's RGB (a capture's
// RGB is already laid over the comp background), so a still made from a raw
// capture shows a pink fringe when laid over anything else.
// Everything goes in a new folder with a unique name; nothing existing is
// changed, removed or rendered, and the render queue is not touched. It
// refuses unless the project is 8 bpc with no working space.
// NOT VERIFIED IN AFTER EFFECTS: how the 200 px feather's falloff compares
// with the linear ramp the offline tests model (the checks compare the
// agent's still with a reference render of the same layer, so they do not
// depend on the falloff's shape).
// SCENE-BEGIN
var SCENE = {"id":"over-still","version":1,"width":1080,"height":1080,"fps":24,"frames":24,"bg":[0.85,0.2,0.6],"layer":"glow","glow":{"colour":[1,0.92,0.7],"centre":[540,540],"radius":220,"feather":200},"navy":[0.043137254901960784,0.12156862745098039,0.22745098039215686],"navyHex":"#0b1f3a","gradeFrame":0,"ring":{"inner":150,"outer":300}};
// SCENE-END
var proj = app.project;
if (!proj) throw new Error("No project is open.");
if (proj.bitsPerChannel !== 8) throw new Error("The over eval needs an 8 bpc project; this one is " + proj.bitsPerChannel + " bpc. Nothing was built.");
var ws = String(proj.workingSpace === undefined ? "None" : proj.workingSpace);
if (ws !== "None" && ws !== "") throw new Error("The over eval needs a project with no working space; this one uses '" + ws + "'. Nothing was built.");

var W = SCENE.width, H = SCENE.height, FPS = SCENE.fps, DUR = SCENE.frames / SCENE.fps;
var MARK = "comp-room picture eval: " + SCENE.id + " v" + SCENE.version;
var stamp = String(new Date().getTime());
var folder = proj.items.addFolder("Comp Room eval over " + stamp);
folder.comment = MARK;

var comp = proj.items.addComp("Comp Room eval glow " + stamp, W, H, 1, DUR, FPS);
comp.parentFolder = folder; comp.bgColor = SCENE.bg; comp.comment = MARK;
var g = SCENE.glow;
var layer = comp.layers.addSolid(g.colour, SCENE.layer, W, H, 1, DUR);
layer.source.parentFolder = folder; layer.comment = MARK;
var pts = [];
for (var i = 0; i < 48; i++) { var t = 2 * Math.PI * i / 48; pts.push([g.centre[0] + g.radius * Math.cos(t), g.centre[1] + g.radius * Math.sin(t)]); }
var m = layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
var s = new Shape(); s.vertices = pts; s.closed = true;
m.property("ADBE Mask Shape").setValue(s);
m.property("ADBE Mask Feather").setValue([g.feather, g.feather]);
m.maskMode = MaskMode.ADD;

return {
  ok: true,
  scene: SCENE.id + " v" + SCENE.version,
  folder: folder.name,
  overComp: { id: comp.id, name: comp.name },
  layer: SCENE.layer,
  note: "Leave the comp's background colour as it is."
};

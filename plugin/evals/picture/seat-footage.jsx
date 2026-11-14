// Setup for picture eval 27 (sit an element in real footage). Run it
// unchanged as the `code` of ae_do { operation: "eval.run" }. The suite writer
// (release/claude-evals.mjs) fills in the clip it was handed and the plate
// region it measured, between FOOTAGE-BEGIN and FOOTAGE-END; this copy in the
// repository has neither and refuses. It imports the clip and builds:
//   - a plate comp holding the clip at its own size and rate (the first
//     2 s, or the whole clip when shorter);
//   - an element comp: the seat eval's clean card with a dark stripe, placed
//     by share of the frame (scenes.mjs FOOTAGE);
//   - a seat comp holding "plate" (bottom) and "element" (top).
// Everything goes in a new folder with a unique name; nothing existing is
// changed, removed or rendered, and the render queue is not touched. It
// refuses unless the project is 8 bpc with no working space.
// NOT VERIFIED IN AFTER EFFECTS: that the imported clip renders with the
// pixels ffmpeg decodes (stage 11 measured the two within 0.0013 on five
// reels; the plate-untouched check allows for that).
// SCENE-BEGIN
var SCENE = {"id":"seat-footage","version":1,"env":"COMP_ROOM_EVAL_FOOTAGE","maxSide":1920,"minFrames":2,"seconds":2,"bg":[0,0,0],"layer":"element","plateLayer":"plate","element":{"card":{"colour":[0.78,0.76,0.72],"box":{"x":0.55,"y":0.08,"width":0.35,"height":0.26}},"stripe":{"colour":[0.15,0.15,0.16],"box":{"x":0.55,"y":0.18,"width":0.35,"height":0.06}}},"region":{"x":0.58,"y":0.12,"width":0.29,"height":0.18},"gradeFrames":[0,1],"blocks":6,"margin":24};
// SCENE-END
// FOOTAGE-BEGIN
var FOOTAGE_FILE = null;
var PLATE_REGION = null;
// FOOTAGE-END
var proj = app.project;
if (!proj) throw new Error("No project is open.");
if (FOOTAGE_FILE === null) throw new Error("This copy of the setup names no clip: write the suite with " + SCENE.env + " set. Nothing was built.");
if (proj.bitsPerChannel !== 8) throw new Error("The footage eval needs an 8 bpc project; this one is " + proj.bitsPerChannel + " bpc. Nothing was built.");
var ws = String(proj.workingSpace === undefined ? "None" : proj.workingSpace);
if (ws !== "None" && ws !== "") throw new Error("The footage eval needs a project with no working space; this one uses '" + ws + "'. Nothing was built.");
var clipFile = new File(FOOTAGE_FILE);
if (!clipFile.exists) throw new Error("The clip the suite was written with is not there any more. Nothing was built.");

var MARK = "comp-room picture eval: " + SCENE.id + " v" + SCENE.version;
var stamp = String(new Date().getTime());
var folder = proj.items.addFolder("Comp Room eval footage " + stamp);
folder.comment = MARK;
var clip = proj.importFile(new ImportOptions(clipFile));
clip.parentFolder = folder; clip.comment = MARK;
if (clip.pixelAspect !== 1) throw new Error("The clip's pixels are not square (" + clip.pixelAspect + "); the folder " + folder.name + " is partial.");

var W = clip.width, H = clip.height, FPS = clip.frameRate, DUR = Math.min(clip.duration, SCENE.seconds);
function px(b) {
    var x = Math.round(b.x * W), y = Math.round(b.y * H);
    return { x: x, y: y, width: Math.round((b.x + b.width) * W) - x, height: Math.round((b.y + b.height) * H) - y };
}
function rectPoly(b) { return [[b.x, b.y], [b.x + b.width, b.y], [b.x + b.width, b.y + b.height], [b.x, b.y + b.height]]; }
function addComp(name) {
    var c = proj.items.addComp(name, W, H, 1, DUR, FPS);
    c.parentFolder = folder; c.bgColor = SCENE.bg; c.comment = MARK;
    return c;
}
function solid(comp, name, colour, poly) {
    var l = comp.layers.addSolid(colour, name, W, H, 1, DUR);
    l.source.parentFolder = folder; l.comment = MARK;
    var m = l.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    var s = new Shape(); s.vertices = poly; s.closed = true;
    m.property("ADBE Mask Shape").setValue(s);
    m.maskMode = MaskMode.ADD;
    return l;
}

var plate = addComp("Comp Room eval plate " + stamp);
var clipLayer = plate.layers.add(clip);
clipLayer.name = "clip"; clipLayer.comment = MARK;
if (clipLayer.hasAudio) clipLayer.audioEnabled = false;

var element = addComp("Comp Room eval element " + stamp);
solid(element, "card", SCENE.element.card.colour, rectPoly(px(SCENE.element.card.box)));
solid(element, "stripe", SCENE.element.stripe.colour, rectPoly(px(SCENE.element.stripe.box)));

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
    size: [W, H],
    fps: FPS,
    regions: { plate: PLATE_REGION, element: px(SCENE.region) },
    note: "Give the layer element the plate's grain and softness with effects on that layer only; measure with ae_render_frame look on these regions."
};

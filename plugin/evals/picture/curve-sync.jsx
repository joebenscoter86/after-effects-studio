// Setup for picture eval 26 (read motion and sound). Run it unchanged as the
// `code` of ae_do { operation: "eval.run" }. It builds one comp, 1920x1080 at
// 30 fps, 6 s, from solids (no footage, no files): card A slides right once,
// eased at both ends; card B slides left once on linear keys; three comp
// markers "sound: beat 1" to "sound: beat 3" (the form sound.markers writes)
// at 4.0, 4.5 and 5.0 s; and three badges that should appear on those beats,
// the third four frames late (scenes.mjs CURVE says where each is).
// Everything goes in a new folder with a unique name; nothing existing is
// changed, removed or rendered, and the render queue is not touched. It
// refuses unless the project is 8 bpc with no working space.
// NOT VERIFIED IN AFTER EFFECTS: that KeyframeEase(0, 66) on both of card A's
// keys reads as eased to motion.curve (its offline tests model the speeds,
// not this call), and that markerProperty takes the three markers as written.
// SCENE-BEGIN
var SCENE = {"id":"curve-sync","version":1,"width":1920,"height":1080,"fps":30,"frames":180,"bg":[0.1,0.11,0.14],"eased":{"name":"card A","colour":[0.85,0.55,0.3],"size":[240,160],"y":280,"fromX":300,"toX":1200,"fromFrame":15,"toFrame":45,"influence":66},"linear":{"name":"card B","colour":[0.3,0.6,0.85],"size":[240,160],"y":560,"fromX":1600,"toX":700,"fromFrame":60,"toFrame":90},"beats":[{"frame":120,"comment":"sound: beat 1"},{"frame":135,"comment":"sound: beat 2"},{"frame":150,"comment":"sound: beat 3"}],"badges":[{"name":"badge 1","inFrame":120,"x":500},{"name":"badge 2","inFrame":135,"x":960},{"name":"badge 3","inFrame":154,"x":1420}],"badge":{"size":140,"y":860,"colour":[0.95,0.85,0.2]}};
// SCENE-END
var proj = app.project;
if (!proj) throw new Error("No project is open.");
if (proj.bitsPerChannel !== 8) throw new Error("The curve eval needs an 8 bpc project; this one is " + proj.bitsPerChannel + " bpc. Nothing was built.");
var ws = String(proj.workingSpace === undefined ? "None" : proj.workingSpace);
if (ws !== "None" && ws !== "") throw new Error("The curve eval needs a project with no working space; this one uses '" + ws + "'. Nothing was built.");

var W = SCENE.width, H = SCENE.height, FPS = SCENE.fps, FD = 1 / SCENE.fps, DUR = SCENE.frames / SCENE.fps;
var MARK = "comp-room picture eval: " + SCENE.id + " v" + SCENE.version;
var stamp = String(new Date().getTime());
var folder = proj.items.addFolder("Comp Room eval curve " + stamp);
folder.comment = MARK;

var comp = proj.items.addComp("Comp Room eval curve " + stamp, W, H, 1, DUR, FPS);
comp.parentFolder = folder; comp.comment = MARK; comp.bgColor = SCENE.bg;

function solid(colour, name, w, h) {
    var l = comp.layers.addSolid(colour, name, w, h, 1, DUR);
    l.source.parentFolder = folder;
    l.comment = MARK;
    return l;
}
function slide(layer, m, eased) {
    var p = layer.property("ADBE Transform Group").property("ADBE Position");
    p.setValueAtTime(m.fromFrame * FD, [m.fromX, m.y]);
    p.setValueAtTime(m.toFrame * FD, [m.toX, m.y]);
    for (var k = 1; k <= p.numKeys; k++) {
        if (eased) {
            p.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
            p.setTemporalEaseAtKey(k, [new KeyframeEase(0, m.influence)], [new KeyframeEase(0, m.influence)]);
        } else {
            p.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
        }
    }
}

solid(SCENE.bg, "background", W, H);
slide(solid(SCENE.eased.colour, SCENE.eased.name, SCENE.eased.size[0], SCENE.eased.size[1]), SCENE.eased, true);
slide(solid(SCENE.linear.colour, SCENE.linear.name, SCENE.linear.size[0], SCENE.linear.size[1]), SCENE.linear, false);

for (var b = 0; b < SCENE.badges.length; b++) {
    var bd = SCENE.badges[b];
    var badge = solid(SCENE.badge.colour, bd.name, SCENE.badge.size, SCENE.badge.size);
    badge.property("ADBE Transform Group").property("ADBE Position").setValue([bd.x, SCENE.badge.y]);
    badge.inPoint = bd.inFrame * FD;
}
for (var i = 0; i < SCENE.beats.length; i++) {
    comp.markerProperty.setValueAtTime(SCENE.beats[i].frame * FD, new MarkerValue(SCENE.beats[i].comment));
}
comp.workAreaStart = 0;
comp.workAreaDuration = DUR;

return {
    ok: true,
    scene: SCENE.id + " v" + SCENE.version,
    folder: folder.name,
    curveComp: { id: comp.id, name: comp.name },
    layers: [SCENE.eased.name, SCENE.linear.name, SCENE.badges[0].name, SCENE.badges[1].name, SCENE.badges[2].name],
    note: "Check how each card moves and whether each badge appears on its beat; write what you find to the findings file the grader's plan names."
};

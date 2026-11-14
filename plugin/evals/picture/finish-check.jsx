// Setup for picture eval 21 (check a whole comp and name what is wrong). Run
// it unchanged as the `code` of ae_do { operation: "eval.run" }. It builds
// two comps, 1080x1920 at 30 fps, 5 s: "seeded", with four defects at known
// frames (a one-frame white flash, a stretch where nothing moves, a title
// that slides off the right edge, a white glare clipped to 255), and "clean",
// the same move with none of them (scenes.mjs FINISH says where each is).
// Everything goes in a new folder with a unique name; nothing existing is
// changed, removed or rendered, and the render queue is not touched. It
// refuses unless the project is 8 bpc with no working space.
// NOT VERIFIED IN AFTER EFFECTS: the title's width in the default font (the
// grader accepts any time inside the title's slide), and that a solid with
// in and out points one frame apart shows on exactly that one frame.
// SCENE-BEGIN
var SCENE = {"id":"finish-check","version":1,"width":1080,"height":1920,"fps":30,"frames":150,"bg":[0.12,0.14,0.2],"dot":{"name":"dot","size":160,"colour":[0.85,0.55,0.3],"y":1500,"fromX":150,"toX":930},"flash":{"name":"flash","frame":36,"colour":[1,1,1]},"frozen":{"fromFrame":60,"toFrame":80},"title":{"name":"Title","text":"FINISH","fontSize":140,"colour":[0.95,0.93,0.88],"x":540,"y":700,"moveFromFrame":90,"moveToFrame":135,"toX":1500},"glare":{"name":"glare","fromFrame":120,"toFrame":134,"centre":[300,1100],"radius":140,"feather":40,"colour":[1,1,1]}};
// SCENE-END
var proj = app.project;
if (!proj) throw new Error("No project is open.");
if (proj.bitsPerChannel !== 8) throw new Error("The finish eval needs an 8 bpc project; this one is " + proj.bitsPerChannel + " bpc. Nothing was built.");
var ws = String(proj.workingSpace === undefined ? "None" : proj.workingSpace);
if (ws !== "None" && ws !== "") throw new Error("The finish eval needs a project with no working space; this one uses '" + ws + "'. Nothing was built.");

var W = SCENE.width, H = SCENE.height, FPS = SCENE.fps, FD = 1 / SCENE.fps, DUR = SCENE.frames / SCENE.fps;
var LAST = SCENE.frames - 1;
var MARK = "comp-room picture eval: " + SCENE.id + " v" + SCENE.version;
var stamp = String(new Date().getTime());
var folder = proj.items.addFolder("Comp Room eval finish " + stamp);
folder.comment = MARK;

function linearKeys(prop, keys) {
    for (var i = 0; i < keys.length; i++) prop.setValueAtTime(keys[i][0] * FD, keys[i][1]);
    for (var k = 1; k <= prop.numKeys; k++) prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
}

function solid(comp, colour, name, w, h) {
    var l = comp.layers.addSolid(colour, name, w, h, 1, DUR);
    l.source.parentFolder = folder;
    l.comment = MARK;
    return l;
}

function build(kind) {
    var comp = proj.items.addComp("Comp Room eval " + kind + " " + stamp, W, H, 1, DUR, FPS);
    comp.parentFolder = folder; comp.comment = MARK; comp.bgColor = SCENE.bg;
    solid(comp, SCENE.bg, "background", W, H);

    var d = SCENE.dot;
    var dot = solid(comp, d.colour, d.name, d.size, d.size);
    var pos = dot.property("ADBE Transform Group").property("ADBE Position");
    pos.dimensionsSeparated = true;
    var tr = dot.property("ADBE Transform Group");
    tr.property("ADBE Position_1").setValue(d.y);
    var v = (d.toX - d.fromX) / LAST;
    if (kind === "seeded") {
        var f0 = SCENE.frozen.fromFrame, f1 = SCENE.frozen.toFrame;
        var held = d.fromX + v * f0;
        linearKeys(tr.property("ADBE Position_0"), [[0, d.fromX], [f0, held], [f1, held], [LAST, held + v * (LAST - f1)]]);
    } else {
        linearKeys(tr.property("ADBE Position_0"), [[0, d.fromX], [LAST, d.toX]]);
    }

    var t = SCENE.title;
    var title = comp.layers.addText(t.text);
    title.name = t.name; title.comment = MARK;
    var src = title.property("ADBE Text Properties").property("ADBE Text Document");
    var doc = src.value;
    doc.fontSize = t.fontSize;
    doc.applyFill = true;
    doc.fillColor = t.colour;
    doc.applyStroke = false;
    doc.justification = ParagraphJustification.CENTER_JUSTIFY;
    src.setValue(doc);
    var tp = title.property("ADBE Transform Group").property("ADBE Position");
    tp.dimensionsSeparated = true;
    var ttr = title.property("ADBE Transform Group");
    ttr.property("ADBE Position_1").setValue(t.y);
    if (kind === "seeded") linearKeys(ttr.property("ADBE Position_0"), [[t.moveFromFrame, t.x], [t.moveToFrame, t.toX]]);
    else ttr.property("ADBE Position_0").setValue(t.x);

    if (kind === "seeded") {
        var g = SCENE.glare;
        var glare = solid(comp, g.colour, g.name, 2 * g.radius, 2 * g.radius);
        glare.property("ADBE Transform Group").property("ADBE Position").setValue(g.centre);
        var pts = [];
        for (var i = 0; i < 48; i++) { var a = 2 * Math.PI * i / 48; pts.push([g.radius + g.radius * Math.cos(a), g.radius + g.radius * Math.sin(a)]); }
        var m = glare.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        var s = new Shape(); s.vertices = pts; s.closed = true;
        m.property("ADBE Mask Shape").setValue(s);
        m.property("ADBE Mask Feather").setValue([g.feather, g.feather]);
        glare.inPoint = g.fromFrame * FD;
        glare.outPoint = (g.toFrame + 1) * FD;

        var fl = SCENE.flash;
        var flash = solid(comp, fl.colour, fl.name, W, H);
        flash.inPoint = fl.frame * FD;
        flash.outPoint = (fl.frame + 1) * FD;
    }
    comp.workAreaStart = 0;
    comp.workAreaDuration = DUR;
    return { id: comp.id, name: comp.name };
}

var seeded = build("seeded");
var clean = build("clean");
return {
    ok: true,
    scene: SCENE.id + " v" + SCENE.version,
    folder: folder.name,
    seededComp: seeded,
    cleanComp: clean,
    note: "Check both comps; write what you find to the findings file the grader's plan names."
};

// Shared "Harbour Watch" scene for il_OcNyqDOE techniques 02, 03, 08 and 10. Loaded after the prelude and art.jsx.
// ExtendScript (ES3). Values from proof/02/art/brief.md + layout.json (2D) and proof/03/art/brief.md (3D).
var HW = {};
HW.ART = "/Users/joeb/after-effects-studio/.claude/worktrees/agent-eyes-stage-7-f1d606/quality/renders/channel-study/il_OcNyqDOE/proof/02/art";
HW.FOLDER = "art il_O 02"; // shared files, imported once; 03, 08 and 10 reuse them
HW.FPS = 23.976;
// name, file, flat x, y, scale, Z, 3D X, Y, scale, mirrored, grade ("full", "curves" or "none")
HW.LAYERS = [
  ["Sky", "sky.png", 960, 540, 76, 7940, 960.0, 540.0, 311.4, false, "none"],
  ["Town", "town.png", 960, 670, 150, 4730, 960.0, 900.6, 253.8, false, "none"],
  ["Bare Tree L", "cut/baretree.png", 326, 265, 52, 1770, -94.8, 82.5, 83.9, false, "full"],
  ["Bare Tree R", "cut/baretree.png", 1180, 520, 48, 1770, 1326.0, 506.7, 77.5, true, "full"],
  ["Cypress", "cut/cypress.png", 557, 512, 44, 1200, 375.7, 499.4, 74.0, false, "full"],
  ["Ledge", "cut/ledge.png", 672, 973, 72, 0, 672.0, 973.0, 72.0, false, "full"],
  ["Wall", "wall-grey.png", 1710, 640, 71, -600, 1541.3, 617.5, 71.0, false, "curves"],
  ["Boy", "cut/boy.png", 758, 672, 24, 0, 758.0, 672.0, 24.0, false, "full"],
  ["Woman", "cut/woman.png", 893, 643, 29, 0, 893.0, 643.0, 29.0, false, "full"],
  ["Grass 1", "grass.png", 330, 949, 55, -830, 526.1, 821.7, 37.9, false, "full"],
  ["Grass 2", "grass.png", 960, 949, 55, -830, 960.0, 821.7, 37.9, true, "full"],
  ["Grass 3", "grass.png", 1590, 949, 55, -830, 1393.9, 821.7, 37.9, false, "full"],
  ["Branch R", "cut/branch-right.png", 1726, 803, 51, -1810, 1226.6, 642.8, 20.5, false, "full"],
  ["Branch L", "cut/branch-left.png", 295, 706, 67, -1810, 735.1, 604.3, 26.9, false, "full"]
];
// v2 layout (02/art/brief.md section v2, layout-v2.json): free-standing lamp, smaller wall, ledge to the left edge,
// branches at the recipe's 1.9 times and grass at 1.45 times. Same columns as HW.LAYERS.
HW.LAYERS_V2 = [
  ["Sky", "sky.png", 960, 540, 76, 7940, 960.0, 540.0, 311.4, false, "none"],
  ["Town", "town.png", 960, 670, 150, 4730, 960.0, 900.6, 253.8, false, "none"],
  ["Bare Tree L", "cut/baretree.png", 326, 265, 52, 1770, -94.8, 82.5, 83.9, false, "full"],
  ["Bare Tree R", "cut/baretree.png", 1180, 520, 48, 1770, 1326.0, 506.7, 77.5, true, "full"],
  ["Cypress", "cut/cypress.png", 557, 512, 44, 1200, 375.7, 499.4, 74.0, false, "full"],
  ["Ledge", "cut/ledge.png", 554, 1023, 90, 0, 554, 1023, 90, false, "full"],
  ["Wall", "wall-v2-grey.png", 1741, 657, 52, -600, 1689.3, 619.8, 52.0, false, "curves"],
  ["Lamp", "lamppost.png", 1267, 1002, 37, -600, 1123.5, 905.0, 37.0, false, "curves"],
  ["Boy", "cut/boy.png", 758, 672, 24, 0, 758.0, 672.0, 24.0, false, "full"],
  ["Woman", "cut/woman.png", 893, 643, 29, 0, 893.0, 643.0, 29.0, false, "full"],
  ["Grass 1", "grass.png", 330, 949, 55, -830, 505.4, 899.5, 54.9, false, "full"],
  ["Grass 2", "grass.png", 960, 949, 55, -830, 960.0, 899.5, 54.9, true, "full"],
  ["Grass 3", "grass.png", 1590, 949, 55, -830, 1414.6, 899.5, 54.9, false, "full"],
  ["Branch R", "cut/branch-right.png", 1656, 730, 60, -1810, 1123.5, 531.6, 36.6, false, "full"],
  ["Branch L", "cut/branch-left.png", 295, 706, 67, -1810, 725.5, 546.4, 40.9, false, "full"]
];
HW.prop = function (group, name) {
  var i;
  for (i = 1; i <= group.numProperties; i++) if (group.property(i).name === name) return group.property(i);
  throw new Error("property not found: " + name + " in " + group.name);
};
HW.comp = function (name, dur) {
  return P.freshComp(name, 1920, 1080, HW.FPS, dur, [0, 0, 0]);
};
// Recipe 02 steps 1-4: Tritone (Midtones #1C3C4C, Highlights #282828, Shadows black, Blend 0) then Curves.
// SUBSTITUTE: Curves' single point (about 160 -> 95) cannot be set by script; Levels Gamma 0.5 stands in
// (recipe 02 build notes: the shown curve behaves like a power of 1.7 to 2.2, Levels Gamma 0.47 to 0.57, 0.5 fits best).
// prefix: "TECH " so the runner can switch the grade off for a before frame.
HW.grade = function (layer, kind, prefix) {
  var pre = prefix || "";
  var tri = P.effect(layer, "ADBE Tritone");
  tri.name = pre + "Tritone";
  tri = layer.property("ADBE Effect Parade").property(pre + "Tritone");
  HW.prop(tri, "Highlights").setValue([40 / 255, 40 / 255, 40 / 255, 1]);
  HW.prop(tri, "Midtones").setValue([28 / 255, 60 / 255, 76 / 255, 1]);
  HW.prop(tri, "Shadows").setValue([0, 0, 0, 1]);
  HW.prop(tri, "Blend With Original").setValue(0);
  var lv = P.effect(layer, "ADBE Easy Levels2");
  lv.name = pre + "Curves (Levels stand-in)";
  lv = layer.property("ADBE Effect Parade").property(pre + "Curves (Levels stand-in)");
  HW.prop(lv, "Gamma").setValue(0.5);
  if (kind === "curves") {
    // Recipe 02 step 6: the wall's Tritone Blend With Original 36 %; step 7: its Tritone switched off, Curves kept.
    tri = layer.property("ADBE Effect Parade").property(pre + "Tritone");
    HW.prop(tri, "Blend With Original").setValue(36);
    tri.name = "Tritone (off: step 7)";
    layer.property("ADBE Effect Parade").property("Tritone (off: step 7)").enabled = false;
  }
};
// Place the scene. opts: { depth: bool (03's 3D values), grade: bool, prefix }
HW.build = function (c, opts) {
  var i, row, item, l, sx;
  var made = {};
  var T = opts.v2 ? HW.LAYERS_V2 : HW.LAYERS;
  for (i = 0; i < T.length; i++) {
    row = T[i];
    if (row[1].indexOf("cut/") === 0) item = ART.footage(HW.ART + "/cut", row[1].substr(4), HW.FOLDER);
    else item = ART.footage(HW.ART, row[1], HW.FOLDER);
    // ART.footage keys by file name; cut/ files are found by their own names (no clashes: cut/grass.png, cut/town.png and cut/wall.png are not used)
    l = c.layers.add(item);
    l.moveToBeginning();
    l.name = row[0];
    if (opts.depth && opts.override && opts.override[row[0]]) {
      // [Z, X, Y, scale, Z rotation]: a layer moved off its 03 value (08 third run: near branches at Z -650)
      var o = opts.override[row[0]];
      l.threeDLayer = true;
      sx = row[9] ? -o[3] : o[3];
      P.tf(l, "ADBE Position").setValue([o[1], o[2], o[0]]);
      P.tf(l, "ADBE Scale").setValue([sx, o[3], o[3]]);
      if (o[4]) P.tf(l, "ADBE Rotate Z").setValue(o[4]);
    } else if (opts.depth) {
      l.threeDLayer = true;
      sx = row[9] ? -row[8] : row[8];
      P.tf(l, "ADBE Position").setValue([row[6], row[7], row[5]]);
      P.tf(l, "ADBE Scale").setValue([sx, row[8], row[8]]);
    } else {
      sx = row[9] ? -row[4] : row[4];
      P.tf(l, "ADBE Position").setValue([row[2], row[3]]);
      P.tf(l, "ADBE Scale").setValue([sx, row[4]]);
    }
    if (opts.grade && row[10] !== "none") HW.grade(l, row[10], opts.prefix);
    made[row[0]] = l;
  }
  return made;
};
// A comp-size solid whose source is named `name`; earlier unused solids of that name (our own re-run orphans) are removed first.
HW.solid = function (c, name, color, layerName) {
  var k, it;
  for (k = app.project.numItems; k >= 1; k--) {
    it = app.project.item(k);
    if (it instanceof FootageItem && it.mainSource instanceof SolidSource && it.name === name && it.usedIn.length === 0) it.remove();
  }
  var l = c.layers.addSolid(color, name, c.width, c.height, 1, c.duration);
  if (layerName) l.name = layerName;
  return l;
};
// Recipe 04 camera: Two-Node, 50 mm (zoom 2666.7), Depth of Field on, focus linked to `subject`,
// POI / Position keyed linear from (960,540,0) / (960,540,-2666.7) at 0 to (958.7,542,0) / (958.7,542,-1749.5) at 3 s.
HW.camera = function (c, subject, aperture) {
  var cam = c.layers.addCamera("Camera 1", [960, 540]);
  cam.autoOrient = AutoOrientType.CAMERA_OR_POINT_OF_INTEREST; // two-node
  var co = cam.property("ADBE Camera Options Group");
  co.property("ADBE Camera Zoom").setValue(2666.7);
  co.property("ADBE Camera Depth of Field").setValue(1);
  co.property("ADBE Camera Aperture").setValue(aperture);
  // SUBSTITUTE: Layer > Camera > Link Focus Distance to Layer is a menu command; this expression does the same.
  co.property("ADBE Camera Focus Distance").expression =
    'var s = thisComp.layer("' + subject + '");\nlength(toWorld([0,0,0]), s.toWorld(s.transform.anchorPoint));';
  var poi = cam.property("ADBE Transform Group").property("ADBE Anchor Point");
  var pos = cam.property("ADBE Transform Group").property("ADBE Position");
  poi.setValueAtTime(0, [960, 540, 0]);
  poi.setValueAtTime(3, [958.7, 542.0, 0]);
  pos.setValueAtTime(0, [960, 540, -2666.7]);
  pos.setValueAtTime(3, [958.7, 542.0, -1749.5]);
  var k;
  for (k = 1; k <= 2; k++) {
    poi.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR);
    pos.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR);
  }
  return cam;
};
// Recipe 07 rebuild: CC Particle World on a 2D comp-size solid, leaf texture, scene grade pasted on.
// opts: { preroll } seconds the solid starts before 0 so leaves are already across the frame (ASSUMED).
HW.leaves = function (c, opts) {
  var leafItem = ART.footage(HW.ART + "/cut", "leaf.png", "art il_O 08");
  var leaf = c.layers.add(leafItem);
  leaf.moveToBeginning();
  leaf.name = "Leaf";
  P.tf(leaf, "ADBE Scale").setValue([31, 31]);
  var s = HW.solid(c, "il_O Leaves", [0.5, 0.5, 0.5], "Leaves");
  s.moveToBeginning();
  s.startTime = -opts.preroll;
  s.outPoint = c.duration;
  var leafIndex = leaf.index;
  var pw = P.effect(s, "CC Particle World");
  pw = s.property("ADBE Effect Parade").property(1);
  HW.prop(pw, "Birth Rate").setValue(opts.birthRate === undefined ? 2.0 : opts.birthRate);
  HW.prop(pw, "Longevity (sec)").setValue(28.7);
  pw.property("CC Particle World-0007").setValue(-0.82); // Producer Position X
  pw.property("CC Particle World-0011").setValue(0.245); // Producer Radius Y
  pw.property("CC Particle World-0015").setValue(opts.twirl); // Physics Animation: Twirl
  pw.property("CC Particle World-0016").setValue(opts.velocity === undefined ? 0.91 : opts.velocity); // Velocity
  if (opts.axis) { // Direction Axis X, Y, Z
    pw.property("CC Particle World-0095").setValue(opts.axis[0]);
    pw.property("CC Particle World-0096").setValue(opts.axis[1]);
    pw.property("CC Particle World-0097").setValue(opts.axis[2]);
  }
  pw.property("CC Particle World-0018").setValue(opts.gravity === undefined ? 0.020 : opts.gravity); // Gravity
  if (opts.gravVec) { // Gravity Vector X, Y, Z (07 leaves it at 0, 1, 0)
    pw.property("CC Particle World-0100").setValue(opts.gravVec[0]);
    pw.property("CC Particle World-0101").setValue(opts.gravVec[1]);
    pw.property("CC Particle World-0102").setValue(opts.gravVec[2]);
  }
  if (opts.resistance !== undefined) pw.property("CC Particle World-0041").setValue(opts.resistance);
  pw.property("CC Particle World-0019").setValue(0.80); // Extra
  pw.property("CC Particle World-0023").setValue(opts.quad); // Particle Type: Textured QuadPolygon
  pw.property("CC Particle World-0045").setValue(leafIndex); // Texture Layer
  pw.property("CC Particle World-0024").setValue(opts.birthSize === undefined ? 0.150 : opts.birthSize); // Birth Size
  pw.property("CC Particle World-0025").setValue(opts.deathSize === undefined ? 1.500 : opts.deathSize); // Death Size
  leaf = c.layer("Leaf");
  leaf.enabled = false;
  HW.grade(c.layer("Leaves"), "full", "");
  return c.layer("Leaves");
};
// Recipe 08: CC Rainfall on an adjustment layer at the top, Wind 840, the rest at defaults.
HW.rain = function (c, name) {
  var r = HW.solid(c, "il_O Rain", [1, 1, 1], name);
  r.adjustmentLayer = true;
  r.moveToBeginning();
  var fx = P.effect(r, "CC Rainfall");
  fx = r.property("ADBE Effect Parade").property(1);
  HW.prop(fx, "Wind").setValue(840);
  return r;
};

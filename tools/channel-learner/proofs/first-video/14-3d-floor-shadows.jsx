// Technique 14: real cast shadows on an invisible 3D floor.
// A white 3D solid laid flat (X Rotation 90) under the 3D graphics, Material Options Accepts Shadows "Only",
// so it shows nothing but the shadows falling on it. A point light behind the graphics casts soft shadows
// forward onto it. The graphics have Accepts Lights off so the light does not shade or tint them.
// Switch-off for a "before" frame: disable the two layers named "TECH floor" and "TECH point light" (or args.before).
//
// Rebuild with artwork (2026-11-14): art from PROOF/14/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// 2D `backdrop` (backdrop.png 150 %); 3D footage layers `panel` (panel-home.png 35.6 %) and `player card`
// (player-card.png 23.2 %) standing with their visible bottom edges on the floor line (78 % down, Y 842); the floor
// directly under them; the point light; then the 2D title "TACTILE" (Anton, white) and "simply" (Pinyon Script, charcoal).
// The cut-outs' own alpha casts the shadows (3D footage layers cast shadows under Classic 3D like the tutorial's precomps).
// Movie: a camera with the default comp camera's zoom drifts slowly in and to the right; its last keyframe lies past the
// comp's end, so it is still moving on the last frame.
// Earlier VERIFY items resolved in the first run (renderer id, Material Options values, Light Options names).
// VERIFY (rebuild): 3D footage layers with alpha cast alpha-shaped shadows onto the "Only" floor.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
args = args || {};
var ARTDIR = args.artDir;
var FOLDER = "art 14";
var W = 1920, H = 1080, FPS = 24, DUR = args.dur || 6;
var BEFORE = (args.before === true);
var FLOORY = 0.78 * H;

function graphicMaterial(layer) {
  layer.property("ADBE Material Options Group").property("ADBE Accepts Lights").setValue(0);
  layer.property("ADBE Material Options Group").property("ADBE Casts Shadows").setValue(1);
  layer.property("ADBE Material Options Group").property("ADBE Accepts Shadows").setValue(1);
}
function pickFont(list) {
  var i, f;
  for (i = 0; i < list.length; i++) {
    try { f = app.fonts.getFontsByPostScriptName(list[i]); if (f.length && !f[0].isSubstitute) return list[i]; } catch (e) {}
  }
  return list[list.length - 1];
}

var c = P.freshComp("14 floor shadows", W, H, FPS, DUR, ART.hex("#D9D3C9"));
c.renderer = "ADBE Advanced 3d"; // Classic 3D, as in the tutorial
// Remove this technique's own unused solids from earlier builds.
(function () {
  var i, it, col;
  for (i = app.project.numItems; i >= 1; i--) {
    it = app.project.item(i);
    if (!(it instanceof FootageItem) || !(it.mainSource instanceof SolidSource) || it.usedIn.length > 0) continue;
    col = it.mainSource.color;
    if (it.name === "TECH floor" || it.name === "14 floor") it.remove();
    else if (it.name === "background" && Math.abs(col[0] - 0.92) < 0.002 && Math.abs(col[1] - 0.93) < 0.002) it.remove();
  }
})();

var bd = c.layers.add(ART.footage(ARTDIR, "backdrop.png", FOLDER));
bd.name = "backdrop";
P.tf(bd, "ADBE Scale").setValue([150, 150]);
P.tf(bd, "ADBE Position").setValue([W / 2, H / 2]);

// Objects: scale, horizontal centre (share), cut-out trim padding (16 px at source scale) below the visible bottom.
function stand(file, name, s, xc) {
  var ft = ART.footage(ARTDIR, file, FOLDER);
  var L = c.layers.add(ft);
  L.name = name;
  L.threeDLayer = true;
  P.tf(L, "ADBE Scale").setValue([s, s, s]);
  var h = ft.height * s / 100;
  // visible bottom edge (16 px of padding above the layer's bottom) on the floor line
  P.tf(L, "ADBE Position").setValue([xc * W, FLOORY - h / 2 + 16 * s / 100, 0]);
  graphicMaterial(L);
  return L;
}
var panel = stand("panel-home.png", "panel", 35.6, 0.34);
var card = stand("player-card.png", "player card", 23.2, 0.69);

var floor = null, light = null;
if (!BEFORE) {
  floor = P.solid(c, "14 floor", [1, 1, 1], W, H);
  floor.name = "TECH floor";
  floor.threeDLayer = true;
  P.tf(floor, "ADBE Rotate X").setValue(90);
  P.tf(floor, "ADBE Position").setValue([960, FLOORY, 0]);
  P.tf(floor, "ADBE Scale").setValue([233, 233, 233]);
  floor.property("ADBE Material Options Group").property("ADBE Accepts Shadows").setValue(2);
  floor.property("ADBE Material Options Group").property("ADBE Casts Shadows").setValue(0);
  floor.moveAfter(panel);  // directly under the lowest 3D graphic, above the 2D backdrop

  light = c.layers.addLight("TECH point light", [960, 540]);
  light.lightType = LightType.POINT;
  P.tf(light, "ADBE Position").setValue(args.lightPos || [-440, 460, 2483.3]);
  var LO = function (n) { return light.property("ADBE Light Options Group").property(n); };
  LO("Intensity").setValue(100);
  LO("Color").setValue([1, 1, 1]);
  LO("Falloff").setValue(2); // Smooth
  LO("Radius").setValue(3530);
  LO("Falloff Distance").setValue(500);
  LO("Casts Shadows").setValue(1);
  // First run's correction: 45 % (recipe) gave half the tutorial's darkness; 78 % matched. args.shadowDarkness overrides.
  // Rebuild run: on the greige backdrop 78 % read as a near-black slab under the clay objects; 50 % keeps it soft and warm.
  LO("Shadow Darkness").setValue(args.shadowDarkness === undefined ? 50 : args.shadowDarkness);
  LO("Shadow Diffusion").setValue(args.diffusion || 205);
}

// Title, 2D, above everything.
var FA = pickFont(["Anton-Regular", "Impact"]);
var FS = pickFont(["PinyonScript-Regular", "PinyonScript", "SnellRoundhand"]);
var t1 = P.text(c, "TACTILE", { size: 300, font: FA, color: [1, 1, 1], name: "TACTILE", pos: [0.70 * W, 0.345 * H] });
// fit the word to 54-86 % across
var r1 = t1.sourceRectAtTime(0, false);
var s1 = 100 * (0.32 * W) / r1.width;
P.tf(t1, "ADBE Scale").setValue([s1, s1]);
var t2 = P.text(c, "simply", { size: 190, font: FS, color: ART.hex("#2E2B28"), name: "simply", pos: [0.71 * W, 0.20 * H] });
t1.moveToBeginning(); t2.moveToBeginning();

// Camera drift for the movie (default comp camera: zoom 2666.7 at z -2666.7).
var cam = c.layers.addCamera("camera", [W / 2, H / 2]);
cam.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(2666.7);
cam.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
var cp = P.tf(cam, "ADBE Position");
var END = DUR + 3;
cp.setValueAtTime(0, [W / 2, H / 2, -2666.7]);
cp.setValueAtTime(END, [W / 2 + 90, H / 2, -2666.7 + 240]);
// ease out of rest at the start only; the last key is past the comp's end, so the move never stops on screen
cp.setTemporalEaseAtKey(1, [new KeyframeEase(0, 60)], [new KeyframeEase(0, 60)]);
cp.setTemporalEaseAtKey(2, [new KeyframeEase(0, 20)], [new KeyframeEase(0, 20)]);
cam.moveToBeginning();
t1.moveToBeginning(); t2.moveToBeginning();

return { comp: c.name, layers: c.numLayers, before: BEFORE, fonts: [FA, FS], tactileScale: s1, panelPos: P.tf(panel, "ADBE Position").value, cardPos: P.tf(card, "ADBE Position").value };

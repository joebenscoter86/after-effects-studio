// Technique 01: overshoot bounce on a word's drop-in (Position expression reading arrival speed), second word staggered a frame behind.
// VERIFY:
// - setTemporalEaseAtKey on Position: expects an array of ONE KeyframeEase (not 2) when dimensions are not separated; if it throws "wrong number of eases", pass two.
// - KeyframeEase speed units for Position are px/s; the raised incoming speed 1350 is assumed to be a positive magnitude.
// - setInterpolationTypeAtKey(k, BEZIER, BEZIER) needed before ease takes effect on linear keys.
// - Font "Poppins-Bold" (PostScript name) may not be installed; AE then falls back silently. Pass args.font to override.
// - Setting layer.inPoint after keys exist: keys before the in-point are kept (assumed).
// - Expression on Position with value + velocity: velocityAtTime on a 2D position returns an array; value + v*scalar works as array math.
// - comp.motionBlur and layer.motionBlur property names; default shutter angle 180.
// - P.text sets justification centre and anchor from sourceRectAtTime; text bounds with the Bold font may shift anchor slightly.
$.evalFile(args.prelude);

var FPS = 29.97002997002997; // recipe frames are 29.97 fps frames
var c = P.freshComp("01 bounce word stagger", 1080, 1920, FPS, 4, [242 / 255, 242 / 255, 242 / 255]);
var fd = 1 / FPS;
// ASSUMED: the recipe's scene is 1920x1080; it is placed in the middle of the 9:16 frame by shifting x by -420 and y by +420 (rest 960,540 -> 540,960).
var DX = -420, DY = 420;
var REST_Y = 540 + DY;
var START_Y = 102 + DY;      // recipe: first key about 102, well above rest
var LIFT_Y = 505 + DY;       // ASSUMED: "a little bit" of lift, 35 px
var EXIT_Y = 2100;           // ASSUMED: past the bottom of the 1920-high frame (recipe 1272 only fits a 1080 frame)
var FONT = args.font || "Poppins-Bold";
var INK = [34 / 255, 34 / 255, 34 / 255];

var EXPR =
  "n = 0;\n" +
  "if (numKeys > 0) {\n" +
  "  n = nearestKey(time).index;\n" +
  "  if (key(n).time > time) { n--; }\n" +
  "}\n" +
  "t = (n == 0) ? 0 : time - key(n).time;\n" +
  "if (n > 0) {\n" +
  "  v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);\n" +
  "  amp = 0.06; freq = 1.8; decay = 5;\n" +
  "  value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);\n" +
  "} else { value; }";

function easeAt(layer, k, inSpeed, inInf, outSpeed, outInf) {
  var pos = layer.property("ADBE Transform Group").property("ADBE Position");
  pos.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
  pos.setTemporalEaseAtKey(k, [new KeyframeEase(inSpeed, inInf)], [new KeyframeEase(outSpeed, outInf)]);
}

// frames: array of [frame, y]; x fixed. Returns layer.
function word(str, x, name, frames) {
  var l = P.text(c, str, { size: 103.2, color: INK, font: FONT, name: name, pos: [x, REST_Y] });
  var pos = P.tf(l, "ADBE Position");
  var i;
  for (i = 0; i < frames.length; i++) {
    pos.setValueAtTime(frames[i][0] * fd, [x, frames[i][1]]);
  }
  l.property("ADBE Transform Group").property("ADBE Position").expression = EXPR;
  l.motionBlur = true;
  return l;
}

// First word: entrance 0,3 then exit 25,30,34 (five keys).
var w1 = word("Drop", 960 + DX, "word 1 (exits)", [[0, START_Y], [3, REST_Y], [25, REST_Y], [30, LIFT_Y], [34, EXIT_Y]]);
// entrance: key 1 out = easy ease with influence ~16%; key 2 in = raised handle 1350 px/s at ~50%, out = easy ease
easeAt(w1, 1, 0, 16, 0, 16);
easeAt(w1, 2, 1350, 50, 0, 33.33);
// exit keys: F9 easy ease
easeAt(w1, 3, 0, 33.33, 0, 33.33);
easeAt(w1, 4, 0, 33.33, 0, 33.33);
easeAt(w1, 5, 0, 33.33, 0, 33.33);
w1.inPoint = 1 * fd; // trim by one frame

// Left word: keys at 32 and 35, rest x 688. Right word: 33 and 36, rest x 1085.9.
var w2 = word("Soft", 688 + DX, "word 2 (left)", [[32, START_Y], [35, REST_Y]]);
easeAt(w2, 1, 0, 16, 0, 16);
easeAt(w2, 2, 1350, 50, 0, 33.33);
w2.inPoint = 33 * fd;

var w3 = word("Land", 1085.9 + DX, "word 3 (right)", [[33, START_Y], [36, REST_Y]]);
easeAt(w3, 1, 0, 16, 0, 16);
easeAt(w3, 2, 1350, 50, 0, 33.33);
w3.inPoint = 34 * fd;

// Art: backdrop from brief, folder "art 01", bottom layer, 100%.
var folder = null, i2;
for (i2 = 1; i2 <= app.project.numItems; i2++) { var it2 = app.project.item(i2); if (it2 instanceof FolderItem && it2.name === "art 01") folder = it2; }
if (!folder) folder = app.project.items.addFolder("art 01");
var bdItem = null;
for (i2 = 1; i2 <= app.project.numItems; i2++) { var it3 = app.project.item(i2); if (it3.name === "backdrop.png") bdItem = it3; }
if (!bdItem) { bdItem = app.project.importFile(new ImportOptions(new File("~/Assets/comp-room-studies/channel-study/201iywIy74c/proof/01/art/backdrop.png"))); bdItem.parentFolder = folder; }
var bd = c.layers.add(bdItem);
bd.name = "backdrop";
bd.moveToEnd();
bd.property("ADBE Transform Group").property("ADBE Position").setValue([540, 960]);

c.motionBlur = true;
c.shutterAngle = 180;
return { comp: c.name, id: c.id, layers: c.numLayers };

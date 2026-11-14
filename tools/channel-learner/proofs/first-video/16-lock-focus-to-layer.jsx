// Technique 16: keep a chosen layer sharp while the camera travels (Link Focus Distance to Layer).
// A layered 3D landscape and a one-node camera parented to a null; the null pushes in towards a small figure on a
// hilltop. The camera's Focus Distance carries an expression that follows the figure, so it stays sharp.
// Before frame: run with args.before = true (the Focus Distance expression switched off; the static value under it is
// the start distance, so the figure goes soft as the camera pushes in).
//
// Rebuild with artwork (2026-11-14): art from PROOF/16/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// All 3D footage layers. In-focus group at the figure's depth z 590: `hill main`, `tree round`, `tree cone`, `figure`.
// Behind: `sky` (sky with sun), `hills far` (z 1100), clouds (z 900). In front: `cloud small 2` (z 250), `hills near`.
// Each layer is placed by where it should read on screen at the END of the push (see `art`), so sizes follow the brief.
// The push (from the first run): figure grows x 2.73 over a 2064 px dolly along Z while the camera sinks 119 px.
// Earlier VERIFY items resolved in the first run (camera option match names, one-node camera, toWorld in the expression).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
args = args || {};
var ARTDIR = args.artDir;
var FOLDER = "art 16";
var W = 1920, H = 1080, FPS = 24, DUR = args.dur || 6;
var Z = 2666.7;           // camera zoom (50 mm default at 1920)
var D = 2064, CAMY1 = 659.3;

var c = P.freshComp("16 lock focus", W, H, FPS, DUR, ART.hex("#8E7F9C"));
(function () {
  var j, it;
  for (j = app.project.numItems; j >= 1; j--) {
    it = app.project.item(j);
    if (it instanceof FootageItem && it.mainSource instanceof SolidSource && it.usedIn.length === 0 &&
        (it.name === "16 sky" || it.name === "16 camera rig" || it.name === "16 sky backing")) it.remove();
  }
})();

// Screen growth of a layer at depth z over the push.
function growth(z) { return (z + Z) / (z + Z - D); }
var report = [];
// Place a 3D footage layer so that at the END of the push the image point `ip` (shares of the image, default its
// centre) reads at screen point (ex, ey) and the whole image reads `ew` px wide. Optional anchor in source px.
function art(file, name, z, ex, ey, ew, ip) {
  var ft = ART.footage(ARTDIR, file, FOLDER);
  var L = c.layers.add(ft);
  L.name = name;
  L.threeDLayer = true;
  var k = (z + Z - D) / Z;             // world px per end-screen px at depth z
  var s = 100 * ew / ft.width * k;     // layer scale
  ip = ip || [0.5, 0.5];
  P.tf(L, "ADBE Anchor Point").setValue([ip[0] * ft.width, ip[1] * ft.height, 0]);
  P.tf(L, "ADBE Position").setValue([960 + (ex - 960) * k, CAMY1 + (ey - 540) * k, z]);
  P.tf(L, "ADBE Scale").setValue([s, s, s]);
  // where it reads at the start (camera at 960, 540, -Z)
  var wx = 960 + (ex - 960) * k, wy = CAMY1 + (ey - 540) * k, k0 = Z / (z + Z);
  var sw = ew / growth(z);
  report.push(name + ": start " + Math.round(sw) + " px wide, anchor at (" + Math.round(960 + (wx - 960) * k0) + ", " + Math.round(540 + (wy - 540) * k0) + ")");
  return L;
}

// A 2D backing behind the sky plate, in its top colour, in case an edge of the plate shows at the start.
var back = P.solid(c, "16 sky backing", ART.hex("#8E7F9C"));
back.name = "sky backing";

// Sky with sun. The sun disc is about 44 % of the image's width, its centre near the image's bottom edge.
// Run: at the brief's z 1381 a plate sized for a 55 % disc at the end is only 1176 px wide at the start (growth 2.04),
// far short of the frame. Placed deeper (args.skyZ, default 5000) it grows only x 1.45, so a plate that covers the frame
// at the start gives a disc of about 64 % of the width at the end (brief 55 %; start about 44 %, brief 27 %).
var SKYZ = args.skyZ || 5000;
var skyEndW = Math.max(2400, 1.04 * W * growth(SKYZ));
var sky = art("sky-sun.png", "sky", SKYZ, 960, args.sunY || 735, skyEndW, [0.5, 0.99]);

var far = art("hills-far.png", "hills far", 1100, 960, 0.55 * H, args.farW || 4500, [0.5, 108 / 619]);
var cb = art("cloud-big.png", "cloud big", 900, 0.15 * W, 0.12 * H, 600);
var cs = art("cloud-small.png", "cloud small", 900, 0.86 * W, 0.10 * H, 450);

// The in-focus group at z 590. Hill crest (top centre of the art, 2 px down) at 50 % across, 65 % down.
var HW = args.hillW || 3600;
var hill = art("hill-main.png", "hill main", 590, 960, 0.65 * H, HW, [0.5, 2 / 815]);
// Feet on the hill's surface: the hill art's top edge measured from its alpha (source px from the top at shares of
// its width): 0.35 -> 49, 0.40 -> 24, 0.60 -> 30, 0.65 -> 60. Trees centred at 29.5 % and 72 % across (brief).
function surfaceY(sx) {
  var prof = [[0.30, 84], [0.35, 49], [0.40, 24], [0.45, 8], [0.50, 2], [0.55, 10], [0.60, 30], [0.65, 60], [0.70, 102]];
  var u = 0.5 + (sx - 960) / HW, i, a, b, y = 2;
  for (i = 0; i < prof.length - 1; i++) {
    a = prof[i]; b = prof[i + 1];
    if (u >= a[0] && u <= b[0]) y = a[1] + (u - a[0]) / (b[0] - a[0]) * (b[1] - a[1]);
  }
  return 0.65 * H + (y - 2) * HW / 2688 + 3; // 3 px into the grass so the foot is planted
}
var tr = art("tree-round.png", "tree round", 590, 0.295 * W, surfaceY(0.295 * W), 173, [765 / 1530, 2277 / 2281]);
var tc = art("tree-cone.png", "tree cone", 590, 0.72 * W, surfaceY(0.72 * W), 115, [712 / 1425, 2622 / 2626]);
// Figure: 162 px tall at the end -> width 162 * 1467 / 2306.
var fig = art("figure.png", "figure", 590, 960, 0.65 * H + 2, 162 * 1467 / 2306, [733 / 1467, 2302 / 2306]);

// Fringe (brief): the cut-outs' alpha ramps over about 6 source px; the round tree's crown also carries an opaque warm
// band about 30 source px wide on its left (painted rim light), which read as a halo round the crown at the end of the
// push. Simple Choker trims it (source px; the tree reads at 0.113 of its source size at the end).
function choke(L, px) {
  var e = P.effect(L, "ADBE Simple Choker");
  L.property("ADBE Effect Parade").property(e.propertyIndex).property("Choke Matte").setValue(px);
}
choke(tr, args.chokeTree === undefined ? 18 : args.chokeTree);
choke(tc, 4); choke(fig, 3);
var cs2 = art("cloud-small.png", "cloud small 2", 250, 0.70 * W, 0.22 * H, 500);
// Near mounds: at z 100 they grow x 3.94 over the push. Sized so they frame the start (args.nearW); by the end they
// have slid out past the frame's sides, the classic push-through. Run: 7200 wide with its bottom at 1500 (end px) left
// the mounds' hard bottom and side edges inside the start frame; 8000 at 2300 puts them outside it.
var near = art("hills-near.png", "hills near", 100, 960, args.nearY || 2300, args.nearW || 8000, [0.5, 1.0]);

// Camera and rig.
var cam = c.layers.addCamera("camera", [960, 540]);
cam.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
P.tf(cam, "ADBE Position").setValue([960, 540, -Z]);
var opts = cam.property("ADBE Camera Options Group");
opts.property("ADBE Camera Zoom").setValue(Z);
opts.property("ADBE Camera Depth of Field").setValue(1);
opts.property("ADBE Camera Aperture").setValue(args.aperture || 400);  // first run: 400 (200 gave little softness)
opts.property("ADBE Camera Blur Level").setValue(100);

var rig = c.layers.addNull(DUR);
rig.name = "camera rig";
rig.source.name = "16 camera rig";
rig.threeDLayer = true;
P.tf(rig, "ADBE Anchor Point").setValue([0, 0, 0]);
P.tf(rig, "ADBE Position").setValue([960, 540, 0]);
cam.parent = rig;
// The push runs the whole comp: eased out of rest, still travelling (slowly) on the last frame.
var rp = P.tf(rig, "ADBE Position");
rp.setValueAtTime(0, [960, 540, 0]);
rp.setValueAtTime(DUR, [960, CAMY1, D]);
rp.setTemporalEaseAtKey(1, [new KeyframeEase(0, 70)], [new KeyframeEase(0, 70)]);
rp.setTemporalEaseAtKey(2, [new KeyframeEase(args.endSpeed || 160, 45)], [new KeyframeEase(args.endSpeed || 160, 45)]);

// The technique: Link Focus Distance to Layer, written as the equivalent expression.
var fd = cam.property("ADBE Camera Options Group").property("ADBE Camera Focus Distance");
var fw = P.tf(fig, "ADBE Position").value;
var dx = fw[0] - 960, dy = fw[1] - 540, dz = fw[2] + Z;
fd.setValue(Math.sqrt(dx * dx + dy * dy + dz * dz));
fd.expression = 'var t = thisComp.layer("figure");\nlength(toWorld([0,0,0]), t.toWorld(t.anchorPoint));';
if (args.before) cam.property("ADBE Camera Options Group").property("ADBE Camera Focus Distance").expressionEnabled = false;

// 2D stack: backing at the bottom, then far to near, camera and rig on top.
back.moveToEnd();
return { comp: c.name, layers: c.numLayers, before: !!args.before, skyEndW: Math.round(skyEndW), start: report };

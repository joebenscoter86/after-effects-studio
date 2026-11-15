// Technique 17: tie a 3D scene together with Fog 3D applied to its precomp.
// Inner comp "17 fog scene": the night forest as 3D layers at depth with one camera. Outer comp "17 depth fog": that comp
// as one layer, Fog 3D on it ("TECH Fog 3D"), and a 2D lantern glow above it so the fog does not grey the light.
// Before frame: run with args.before = true (Fog 3D switched off), or switch "TECH Fog 3D" off by hand.
//
// Rebuild with artwork (2026-11-14): art from PROOF/17/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// Inside the precomp, far to near: `sky mist` z 6000, `trunks far` z 3500, `trunks mid` z 1500 (60 px left on screen),
// `figure` z 0, `shrubs mid` z -150, `trunks near` z -700, `foliage front` z -1200. Full-frame plates are scaled by
// (2666.7 + z) / 2666.7 so each reads at its brief size through the camera. The art is already graded to night levels
// (brief); no further darkening.
// Earlier runs found: match name "ADBE FOG_3D", properties "-0001".."-0008"; Fog 3D reads depth from a precomp of 3D
// layers as the distance from the precomp's camera in pixels (figure 2667), and the recipe's 51 / -23 fog nothing.
// Movie: the camera drifts slowly right and in (eased out of rest, still moving on the last frame); the glow follows
// the lantern through an expression.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
args = args || {};
var ARTDIR = args.artDir;
var FOLDER = "art 17";
var W = 1920, H = 1080, FPS = 23.976, DUR = args.dur || 6;
var CAMD = 2666.7;

var c = P.freshComp("17 depth fog", W, H, FPS, DUR, ART.hex("#0B1428"));
var s = P.freshComp("17 fog scene", W, H, FPS, DUR, ART.hex("#0B1428"));
(function () {
  var j, it;
  for (j = app.project.numItems; j >= 1; j--) {
    it = app.project.item(j);
    if (it instanceof FootageItem && it.mainSource instanceof SolidSource && it.usedIn.length === 0 &&
        (it.name === "17 night" || it.name === "17 ground" || it.name === "17 lantern glow")) it.remove();
  }
})();

function plate(file, name, z, xShift, blur) {
  var ft = ART.footage(ARTDIR, file, FOLDER);
  ft.mainSource.reload(); // polish: the v2 art replaced files of the same names on disk
  var L = s.layers.add(ft);
  L.name = name;
  L.threeDLayer = true;
  var f = (CAMD + z) / CAMD;
  var sc = 100 * W / 2688 * f;
  P.tf(L, "ADBE Scale").setValue([sc, sc, sc]);
  P.tf(L, "ADBE Position").setValue([960 + (xShift || 0) * f, 540, z]);
  if (blur) ART.setFx(P.effect(L, "ADBE Gaussian Blur 2"), { "Blurriness": blur, "Repeat Edge Pixels": 1 });
  return L;
}
// Polish (2026-11-14), art v2 (brief "## Art v2"): every trunk is darker than the fog colour and the mist a little
// lighter, so the fog lifts the trunks and dims the gaps. All four trunk layers stand behind the figure, inside the fog,
// at the brief's z; their positions are in the files (no shift). The sky is back at z 8000 with a light blur; no blur on
// the trunks (their softness is painted). Plates get a 3 % margin for the camera drift.
var sky = plate("sky-mist.png", "sky mist", args.skyZ || 8000, 0, 5);
var skS = P.tf(sky, "ADBE Scale").value[0] * 1.06;
P.tf(sky, "ADBE Scale").setValue([skS, skS, skS]);
var TZ = args.trunkZ || { far: 2865, back: 2720, mid: 2570, near: 2420 };
function trunks(file, name, z) {
  var L = plate(file, name, z, 0, 0);
  var v = P.tf(L, "ADBE Scale").value[0] * 1.03;
  P.tf(L, "ADBE Scale").setValue([v, v, v]);
  return L;
}
var tfar = trunks("trunks-far.png", "trunks far", TZ.far);
var tback = trunks("trunks-back.png", "trunks back", TZ.back);
var tmid = trunks("trunks-mid.png", "trunks mid", TZ.mid);
var tnear = trunks("trunks-near.png", "trunks near", TZ.near);

// Figure: 529 px tall at z 0, spanning 39 to 56 % across, feet at 83 % down (anchor at the bottom centre).
var fft = ART.footage(ARTDIR, "figure-lantern.png", FOLDER);
var fig = s.layers.add(fft);
fig.name = "figure";
fig.threeDLayer = true;
var FS = 529 / fft.height;
P.tf(fig, "ADBE Anchor Point").setValue([fft.width / 2, fft.height, 0]);
P.tf(fig, "ADBE Scale").setValue([100 * FS, 100 * FS, 100 * FS]);
P.tf(fig, "ADBE Position").setValue([0.475 * W, 0.83 * H, 0]);
// Fringe check (brief): the cut-out's alpha ramps over about 4 source px; Simple Choker trims it (source px).
var ch = P.effect(fig, "ADBE Simple Choker");
fig.property("ADBE Effect Parade").property(ch.propertyIndex).property("Choke Matte").setValue(args.choke === undefined ? 4 : args.choke);

var shr = plate("shrubs-mid.png", "shrubs mid", -150, 0, 0);
// Run: at full frame the shrubs' top line dips to about 85 % down in the middle and the boots (83 %) floated above it;
// raised 100 screen px so the shrubs cover the boots (brief).
P.tf(shr, "ADBE Position").setValue([960, 540 - (args.shrubLift || 100) * (CAMD - 150) / CAMD, -150]);
var fol = plate("foliage-front.png", "foliage front", -1200, 0, 0);

// Art v2: the trunk and shrub alpha is clean, so the v1 "alpha harden" chokers are off (brief); args.harden puts them
// back on the layers in front of fogged depth if fog blotches return at their edges.
function harden(L, px) {
  var e = P.effect(L, "ADBE Simple Choker");
  L.property("ADBE Effect Parade").property(e.propertyIndex).property("Choke Matte").setValue(px);
  L.property("ADBE Effect Parade").property(e.propertyIndex).name = "alpha harden";
}
var HC = args.harden === undefined ? 0 : args.harden;
if (HC > 0) { harden(shr, HC); harden(fol, HC); }
// Polish run: with fog on, the front foliage drew a dark outline round every frond and the upper picture had dark
// specks. Fog 3D gives each pixel the depth of its nearest layer even where that layer is nearly transparent, so the
// fronds' soft outer fringe and stray faint alpha specks in the foliage and shrub files took their unfogged depth and
// let the unfogged dark trunks show through. Levels (Individual Controls) on alpha clears alpha below ACUT and rescales
// the rest, so a fringe is either solid (foliage depth) or gone (trunk depth).
var fogFixMissing = [];
function alphaCut(L, black) {
  var e = P.effect(L, "ADBE Pro Levels2");
  e.name = "alpha cut";
  fogFixMissing = fogFixMissing.concat(ART.setFx(L.property("ADBE Effect Parade").property("alpha cut"), { "Alpha Input Black": black }));
}
var ACUT = args.alphaCut === undefined ? 0.3 : args.alphaCut;
if (ACUT > 0) { alphaCut(fol, ACUT); alphaCut(shr, ACUT); }

// One-node camera looking straight down Z, drifting right and in.
var cam = s.layers.addCamera("scene camera", [960, 540]);
cam.autoOrient = AutoOrientType.NO_AUTO_ORIENT;
cam.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(CAMD);
var cp = P.tf(cam, "ADBE Position");
cp.setValueAtTime(0, [960 - 40, 540, -CAMD]);
cp.setValueAtTime(DUR, [960 + 40, 540, -CAMD + 120]);
cp.setTemporalEaseAtKey(1, [new KeyframeEase(0, 60)], [new KeyframeEase(0, 60)]);
cp.setTemporalEaseAtKey(2, [new KeyframeEase(15, 30)], [new KeyframeEase(15, 30)]);

// Step 1 (substitute for Pre-compose): the scene as one layer of the outer comp.
var pre = c.layers.add(s);
pre.name = "fog scene";

// Steps 2-4: Fog 3D on the precomp layer.
var fx = P.effect(pre, "ADBE FOG_3D");
fx.name = "TECH Fog 3D";
fx = pre.property("ADBE Effect Parade").property("TECH Fog 3D");
fx.property("ADBE FOG_3D-0001").setValue(ART.hex(args.fogColor || "#0E2737").concat([1])); // brief's fog colour
// Depth = distance from the precomp's camera: figure 2667, shrubs 2517; art v2 trunks 5087 (near) to 5532 (far), sky 10667.
// Start just behind the figure (recipe's proof note, brief); End beyond the far trunks, tuned by eye on the render.
fx.property("ADBE FOG_3D-0002").setValue(args.fogStart !== undefined ? args.fogStart : 2700);
fx.property("ADBE FOG_3D-0003").setValue(args.fogEnd !== undefined ? args.fogEnd : 12000); // art v2 brief: 12000; tuned on the measured shares
fx.property("ADBE FOG_3D-0004").setValue(100); // Fog Opacity
fx.property("ADBE FOG_3D-0005").setValue(24);  // Scattering Density
fx.property("ADBE FOG_3D-0006").setValue(1);   // Foggy Background
fx.property("ADBE FOG_3D-0008").setValue(100); // Layer Contribution
fx.enabled = !args.before;

// Lantern glow (brief): 2D orange solid with a feathered ellipse mask, Add, about 40 %, about 300 px across, above the
// precomp. Its position follows the lantern through the inner camera (toComp on the 3D figure layer).
// The lantern's centre in the figure's source pixels (measured on the art: about 15 % across, 17 % down).
var LX = args.lanternX || 0.152 * fft.width, LY = args.lanternY || 0.171 * fft.height;
var GS = 800; // run: a 400 px solid cut the feathered edge off in a visible square
var glow = c.layers.addSolid(ART.hex("#FF9A3C"), "17 lantern glow", GS, GS, 1, DUR);
glow.name = "lantern glow";
var m = glow.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
var sh = new Shape();
var r = 150, k = 0.5523 * r;
sh.vertices = [[GS / 2, GS / 2 - r], [GS / 2 + r, GS / 2], [GS / 2, GS / 2 + r], [GS / 2 - r, GS / 2]];
sh.inTangents = [[-k, 0], [0, -k], [k, 0], [0, k]];
sh.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]];
sh.closed = true;
m.property("ADBE Mask Shape").setValue(sh);
glow.property("ADBE Mask Parade").property(1).property("ADBE Mask Feather").setValue([120, 120]);
glow.blendingMode = BlendingMode.ADD;
P.tf(glow, "ADBE Opacity").setValue(args.glowOpacity || 40);
P.tf(glow, "ADBE Position").expression = 'var L = comp("17 fog scene").layer("figure");\nL.toComp([' + LX.toFixed(1) + ', ' + LY.toFixed(1) + ', 0]);';

var gp = P.tf(glow, "ADBE Position").valueAtTime(0, false);
return { fogFixMissing: fogFixMissing.join(","), alphaBlack: (ACUT > 0 ? fol.property("ADBE Effect Parade").property("alpha cut").property("Alpha Input Black").value : null), comp: c.name, scene: s.name, sceneLayers: s.numLayers, before: !!args.before, glowAt0: [Math.round(gp[0]), Math.round(gp[1])] };

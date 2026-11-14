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
  var L = s.layers.add(ART.footage(ARTDIR, file, FOLDER));
  L.name = name;
  L.threeDLayer = true;
  var f = (CAMD + z) / CAMD;
  var sc = 100 * W / 2688 * f;
  P.tf(L, "ADBE Scale").setValue([sc, sc, sc]);
  P.tf(L, "ADBE Position").setValue([960 + (xShift || 0) * f, 540, z]);
  if (blur) ART.setFx(P.effect(L, "ADBE Gaussian Blur 2"), { "Blurriness": blur, "Repeat Edge Pixels": 1 });
  return L;
}
// sky: brief "about 2000 x 1130 on screen" -> 2000 / 1920 of a full-frame plate
// Run: at the brief's z 6000 the sky sat 2500 px behind the far trunks, whose painted alpha is soft and noisy (they fade
// into haze at the bottom). Fog 3D takes one depth per pixel, so where that alpha flickers the depth jumps between the
// trunks and the sky and the fog came out in pale blotches. The sky now stands just behind the far trunks (z 3600), so
// both get nearly the same fog and the blotches go; the trunks keep their own z (args.skyZ).
var sky = plate("sky-mist.png", "sky mist", args.skyZ || 3600, 0, 6);
var skS = P.tf(sky, "ADBE Scale").value[0] * 2000 / 1920 * 1.06; // run: +6 % margin for the camera drift
P.tf(sky, "ADBE Scale").setValue([skS, skS, skS]);
var tfar = plate("trunks-far.png", "trunks far", 3500, 0, 3.5);
var tmid = plate("trunks-mid.png", "trunks mid", 1500, -60, 0);

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
var tnear = plate("trunks-near.png", "trunks near", -700, 0, 0);
var fol = plate("foliage-front.png", "foliage front", -1200, 0, 0);

// Run: Fog 3D takes the depth of the nearest layer even where that layer is barely there, so wherever the shrubs' soft
// painted tops or the mid trunks' soft edges were partly transparent, the far haze behind them showed through UNfogged:
// pale blotches along the shrub line and speckle down the trunk edges. Simple Choker on every layer that stands in front
// of fogged depth hardens those low-alpha fringes (it is also the fringe check the brief asks for).
function harden(L, px) {
  var e = P.effect(L, "ADBE Simple Choker");
  L.property("ADBE Effect Parade").property(e.propertyIndex).property("Choke Matte").setValue(px);
  L.property("ADBE Effect Parade").property(e.propertyIndex).name = "alpha harden";
}
var HC = args.harden === undefined ? 1 : args.harden;
if (HC > 0) { harden(tmid, HC); harden(shr, HC); harden(tnear, HC); harden(fol, HC); }

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
// Depth = distance from the precomp's camera: figure 2667, shrubs 2517, mid trunks 4167, far trunks 6167, sky 8667.
// Start just behind the figure (recipe's proof note, brief); End beyond the far trunks, tuned by eye on the render.
fx.property("ADBE FOG_3D-0002").setValue(args.fogStart !== undefined ? args.fogStart : 2700);
fx.property("ADBE FOG_3D-0003").setValue(args.fogEnd !== undefined ? args.fogEnd : 11000); // run: 9500 sank the far trunks almost to the fog colour
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
return { comp: c.name, scene: s.name, sceneLayers: s.numLayers, before: !!args.before, glowAt0: [Math.round(gp[0]), Math.round(gp[1])] };

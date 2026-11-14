// Technique 23: dial motion blur strength with the comp's shutter angle.
// A ring of bold white words spinning around the Y axis in 3D over a dark, grainy background,
// layer and comp motion blur on, shutter angle raised from 180 to 720 so the words smear into long horizontal streaks.
// The technique is a comp setting, not a layer, so nothing is named TECH: for the "before" frame run with
// args.shutterAngle = 180 (or set comp.shutterAngle = 180 and back to 720 afterwards).
//
// VERIFY: comp.shutterAngle, comp.shutterPhase, comp.motionBlurSamplesPerFrame, comp.motionBlurAdaptiveSampleLimit are the scripting names.
// VERIFY: comp.motionBlur is the comp Enable Motion Blur toggle and layer.motionBlur the layer switch.
// VERIFY: Y Rotation sign: each word should lie tangent to the ring (face outward). If words look radial, flip the sign of ry below.
// VERIFY: "Noise" is the display name of Noise & Grain > Noise and "Amount of Noise" its property (percent).
// VERIFY: the font "Poppins-Bold" is installed (01 used Poppins-Light); pass args.font to override.
// VERIFY: render.preview honours comp motion blur (Best quality, motion blur on) so the streaks show in build.mov.
$.evalFile(args.prelude);

// Run fix: sizes from the recipe's layout line (the assumed sizes predate it).
//  - ring about 51% of the width across, front word 31% of the width wide with capitals 10% of the height tall, back word
//    capitals 7% tall: with the default 50 mm view (zoom 2666.67) that is a ring radius of about 470 px (front scale 1.21,
//    back 0.85), layer-space capitals of 89 px and a word about 490 px wide;
//  - ring spans 33% to 72% down: more than three cap heights, so the camera looks down on the ring a little (about 6 degrees);
//  - a darker copy of each word sits one cap height under it;
//  - at 720 degrees the front word's uprights smear about 1% of the width (19 px): two frames of travel, so about 8 px a frame
//    in layer space, about 1 degree a frame, 24 degrees a second. The script's first guess (two turns in 5 s) was six times faster.
var FPS = 23.976;                     // recipe: comp 1920 x 1080, 23.976 fps
var DUR = 5;                          // ASSUMED: 5 s
var W = 1920, H = 1080;
var ZOOM = 2666.67;
var R = 470;
var DEG_PER_S = (args.degPerSec !== undefined) ? args.degPerSec : 24;
var NW = 5;                           // five copies of one word fill the ring (2 * pi * 470 = 2953 px; word 490 px)
var WORD = args.word || "MOTION";     // stand-in word (the example repeats one word)
var CAP = 0.10 * H / (ZOOM / (ZOOM - R));   // layer-space cap height that reads 10% of the height at the front
var WW = 0.31 * W / (ZOOM / (ZOOM - R));    // layer-space word width that reads 31% of the width at the front
var c = P.freshComp("23 shutter angle blur", W, H, FPS, DUR, [0.04, 0.04, 0.05]);

// Dark grainy background.
var bg = P.solid(c, "23 background", [0.07, 0.07, 0.08]);
bg.name = "background";
var noise = P.effect(bg, "Noise");
bg.property("ADBE Effect Parade").property(noise.propertyIndex).property("Amount of Noise").setValue(8); // ASSUMED: grain amount

// Camera placed explicitly: the default 50 mm view, raised so it looks down on the ring.
// Run fix: 6 degrees gave a ring 43% to 69% down; 13 degrees and the ring centre at 45% down give the layout's 33% to 72%.
var TILT = (args.tilt !== undefined ? args.tilt : 13) * Math.PI / 180;
var RINGY = (args.ringY !== undefined) ? args.ringY : 0.451 * H;
var cam = c.layers.addCamera("camera", [W / 2, H / 2]);
cam.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(ZOOM);
P.tf(cam, "ADBE Anchor Point").setValue([W / 2, H / 2, 0]);
P.tf(cam, "ADBE Position").setValue([W / 2, H / 2 - ZOOM * Math.sin(TILT), -ZOOM * Math.cos(TILT)]);

// 3D null that carries the ring and spins it.
var ctl = c.layers.addNull(DUR);
ctl.source.name = "23 ring spin";
ctl.name = "ring spin";
ctl.threeDLayer = true;
P.tf(ctl, "ADBE Anchor Point").setValue([0, 0, 0]);
P.tf(ctl, "ADBE Position").setValue([W / 2, RINGY, 0]);
var spin = P.tf(ctl, "ADBE Rotate Y");
spin.setValueAtTime(0, 0);
spin.setValueAtTime(DUR, DEG_PER_S * DUR);
// Linear, so the spin speed is constant (the recipe gives no easing).
spin.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
spin.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);

// Run fix: a font found by name may be a substitute; take the first candidate that is really installed.
var cand = [args.font || "Poppins-Bold", "Poppins-SemiBold", "Montserrat-Bold", "HelveticaNeue-Bold", "Arial-BoldMT"];
var FONT = null, ci, fo;
for (ci = 0; ci < cand.length && !FONT; ci++) {
  try { fo = app.fonts.getFontsByPostScriptName(cand[ci]); if (fo.length && !fo[0].isSubstitute) FONT = cand[ci]; } catch (errFont) {}
}
if (!FONT) FONT = "Arial-BoldMT";

// Size the word from its own rectangle: capitals CAP tall, word WW wide (tracking takes up the difference).
var probe = P.text(c, WORD, { size: 100, font: FONT, color: [1, 1, 1], name: "probe" });
var pr = probe.sourceRectAtTime(0, false);
var FS = 100 * CAP / pr.height;
var pd = probe.property("ADBE Text Properties").property("ADBE Text Document");
var pdoc = pd.value; pdoc.fontSize = FS; pd.setValue(pdoc);
pr = probe.sourceRectAtTime(0, false);
var TRK = Math.round((WW - pr.width) / (WORD.length - 1) * 1000 / FS);
probe.remove();

var sign = (args.rySign !== undefined) ? args.rySign : -1;
var i, a, t, ry, k, col, rr;
for (i = 0; i < NW; i++) {
  a = i * 2 * Math.PI / NW;
  ry = sign * a * 180 / Math.PI;
  // k = 1: the darker copy, one cap height below (added first so it sits under the white word in the stack).
  // ASSUMED: plain darker copy, not flipped (the recipe cannot tell at this blur).
  for (k = 1; k >= 0; k--) {
    col = k ? [0.3, 0.3, 0.32] : [1, 1, 1];
    t = P.text(c, WORD, { size: FS, font: FONT, color: col, tracking: TRK, name: "word " + (i + 1) + (k ? " dark copy" : "") });
    t.threeDLayer = true;
    t.parent = ctl;
    // Parent space: the null's anchor is at its origin, so positions are offsets from the ring centre.
    P.tf(t, "ADBE Position").setValue([R * Math.sin(a), k * CAP, -R * Math.cos(a)]);
    P.tf(t, "ADBE Rotate Y").setValue(ry);
    t.motionBlur = true; // step 1: layer motion blur switch
  }
}

// Step 1: comp motion blur on. Steps 2-5: Composition Settings > Advanced > Motion Blur.
// SUBSTITUTE: the Composition Settings dialog is replaced by setting the comp's properties directly.
c.motionBlur = true;
c.shutterAngle = (args.shutterAngle !== undefined) ? args.shutterAngle : 720; // 180 default -> 720
c.shutterPhase = -90;
c.motionBlurSamplesPerFrame = 16;
c.motionBlurAdaptiveSampleLimit = 128;

// Remove this script's own unused solids from earlier runs.
var oi, oit;
for (oi = app.project.numItems; oi >= 1; oi--) {
  oit = app.project.item(oi);
  if (oit instanceof FootageItem && oit.mainSource instanceof SolidSource && oit.usedIn.length === 0 &&
      (oit.name === "23 background" || oit.name === "23 ring spin")) oit.remove();
}
return { comp: c.name, id: c.id, layers: c.numLayers, shutterAngle: c.shutterAngle, shutterPhase: c.shutterPhase, fps: c.frameRate,
  samples: c.motionBlurSamplesPerFrame, adaptive: c.motionBlurAdaptiveSampleLimit, motionBlur: c.motionBlur,
  font: FONT, fontSize: FS, tracking: TRK, cap: CAP, wordWidth: WW };

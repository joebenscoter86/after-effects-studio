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
// Rebuild with artwork (2026-11-14): art from PROOF/23/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// Stage.png (2D, 75 %) under a moving Grain adjustment; the ring is now four faces of a square in plan (the recipe's
// "four repeats of one word with a round dot between each"; the brief: a box with flat faces and sharp corners), one word
// centred on each face and a filled dot at each corner; under each word a dark copy (#2A2D31, 2 px #8A9097 stroke) one
// cap height lower. The technique is unchanged: layer and comp motion blur on, shutter angle 180 -> 720.
$.evalFile(args.artLib);
var ARTDIR = args.artDir;

// Sizes from the layout line: ring 51 % of the width across, front word 31 % wide with capitals 10 % of the height,
// back word capitals about 7 %. With the default 50 mm view (zoom 2666.67) a square of side S, seen face-on, is
// S * Z / (Z - S/2) wide: 979 px gives S = 827, front scale 1.184, back scale 0.866 (back capitals 7.3 %).
// Smear at 720 degrees 1.25 % of the width = 24 px over two frames = 10 px a frame in layer space at the front face
// (413 px from the axis): about 1.39 degrees a frame, 33 degrees a second.
var FPS = 23.976, DUR = args.dur || 6;
var W = 1920, H = 1080;
var ZOOM = 2666.67;
var S = 827, HALF = S / 2;
var FRONT = ZOOM / (ZOOM - HALF);
var DEG_PER_S = (args.degPerSec !== undefined) ? args.degPerSec : 33;
var WORD = args.word || "MOTION";
var CAP = 0.10 * H / FRONT;
var WW = 0.31 * W / FRONT;
var c = P.freshComp("23 shutter angle blur", W, H, FPS, DUR, ART.hex("#050506"));

// Stage: 2D backdrop, never motion-blurred.
var stage = c.layers.add(ART.footage(ARTDIR, "stage.png", "art 23"));
stage.name = "Stage";
P.tf(stage, "ADBE Scale").setValue([75, 75]);
// Brief: if the floor's bright streak competes with the front word, lower its output white to about 70 %.
var lv = P.effect(stage, "ADBE Easy Levels2");
ART.setFx(lv, { "Output White": (args.stageWhite !== undefined ? args.stageWhite : 0.8) });

// Grain: adjustment layer, Noise 4 % (Noise is new on every frame, so it moves).
var grain = P.solid(c, "23 grain", [1, 1, 1]);
grain.name = "Grain";
grain.adjustmentLayer = true;
ART.setFx(P.effect(grain, "ADBE Noise"), { "Amount of Noise": 4 });

// Camera: the default 50 mm view, raised to look down 13 degrees (ring 33 % to 72 % down, layout).
var TILT = (args.tilt !== undefined ? args.tilt : 13) * Math.PI / 180;
var RINGY = (args.ringY !== undefined) ? args.ringY : 0.451 * H;
var cam = c.layers.addCamera("camera", [W / 2, H / 2]);
cam.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(ZOOM);
P.tf(cam, "ADBE Anchor Point").setValue([W / 2, H / 2, 0]);
P.tf(cam, "ADBE Position").setValue([W / 2, H / 2 - ZOOM * Math.sin(TILT), -ZOOM * Math.cos(TILT)]);

var ctl = c.layers.addNull(DUR);
ctl.source.name = "23 ring spin";
ctl.name = "ring spin";
ctl.threeDLayer = true;
P.tf(ctl, "ADBE Anchor Point").setValue([0, 0, 0]);
P.tf(ctl, "ADBE Position").setValue([W / 2, RINGY, 0]);
var spin = P.tf(ctl, "ADBE Rotate Y");
spin.setValueAtTime(0, (args.startAngle !== undefined ? args.startAngle : -20));
spin.setValueAtTime(DUR, (args.startAngle !== undefined ? args.startAngle : -20) + DEG_PER_S * DUR);
// Linear: constant speed, still spinning on the last frame.
spin.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
spin.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);

var cand = [args.font || "Montserrat-Black", "Poppins-Bold", "Arial-BoldMT"];
var FONT = null, ci, fo;
for (ci = 0; ci < cand.length && !FONT; ci++) {
  try { fo = app.fonts.getFontsByPostScriptName(cand[ci]); if (fo.length && !fo[0].isSubstitute) FONT = cand[ci]; } catch (errFont) {}
}
if (!FONT) FONT = "Arial-BoldMT";

var probe = P.text(c, WORD, { size: 100, font: FONT, color: [1, 1, 1], name: "probe" });
var pr = probe.sourceRectAtTime(0, false);
var FS = 100 * CAP / pr.height;
var pd = probe.property("ADBE Text Properties").property("ADBE Text Document");
var pdoc = pd.value; pdoc.fontSize = FS; pd.setValue(pdoc);
pr = probe.sourceRectAtTime(0, false);
var TRK = Math.round((WW - pr.width) / (WORD.length - 1) * 1000 / FS);
probe.remove();

var WHITE = ART.hex("#F4F4F2");
var i, a, t, k, td, tdp, dot, ex, ez;
for (i = 0; i < 4; i++) {
  a = i * Math.PI / 2;               // face normals at 0, 90, 180, 270 degrees
  for (k = 1; k >= 0; k--) {
    // Polish (2026-11-14): the dark copies were #2A2D31 with a 2 px #8A9097 stroke and read as muddy outlined grey type
    // over the floor's light pool. Now a plain deep fill, no stroke (args.copyColor), so each reads as a shadowed echo.
    t = P.text(c, WORD, { size: FS, font: FONT, color: k ? ART.hex(args.copyColor || "#15171A") : WHITE, tracking: TRK,
      name: "word " + (i + 1) + (k ? " dark copy" : "") });
    t.threeDLayer = true;
    t.parent = ctl;
    P.tf(t, "ADBE Position").setValue([HALF * Math.sin(a), k * CAP, -HALF * Math.cos(a)]);
    P.tf(t, "ADBE Rotate Y").setValue(-a * 180 / Math.PI);
    t.motionBlur = true;
  }
  // Dot at the corner after this face, 30 % of the cap height, set at 45 degrees between the two faces.
  ex = HALF * Math.sin(a) + HALF * Math.cos(a);
  ez = -HALF * Math.cos(a) + HALF * Math.sin(a);
  dot = P.shape(c, "dot " + (i + 1));
  // Polish: 30 % of the cap height (27 px) read as stray specks in three-quarter views; 40 % (args.dotShare).
  P.ellipse(dot, [(args.dotShare || 0.4) * CAP, (args.dotShare || 0.4) * CAP]);
  (function (sh) { var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill"); P.contents(sh).property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(WHITE); })(dot);
  dot.layer.threeDLayer = true;
  dot.layer.parent = ctl;
  P.tf(dot.layer, "ADBE Position").setValue([ex, 0, ez]);
  P.tf(dot.layer, "ADBE Rotate Y").setValue(-(a + Math.PI / 4) * 180 / Math.PI);
  dot.layer.motionBlur = true;
}
cam.moveToBeginning();

c.motionBlur = true;
c.shutterAngle = (args.shutterAngle !== undefined) ? args.shutterAngle : 720;
c.shutterPhase = -90;
c.motionBlurSamplesPerFrame = 16;
c.motionBlurAdaptiveSampleLimit = 128;

var oi, oit;
for (oi = app.project.numItems; oi >= 1; oi--) {
  oit = app.project.item(oi);
  if (oit instanceof FootageItem && oit.mainSource instanceof SolidSource && oit.usedIn.length === 0 &&
      (oit.name === "23 background" || oit.name === "23 ring spin" || oit.name === "23 grain")) oit.remove();
}
return { comp: c.name, id: c.id, layers: c.numLayers, shutterAngle: c.shutterAngle, fps: c.frameRate, font: FONT, fontSize: FS, tracking: TRK, cap: CAP, wordWidth: WW };

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

var FPS = 23.976;                     // recipe: comp 1920 x 1080, 23.976 fps
var DUR = 5;                          // ASSUMED: 5 s
var R = 520;                          // ASSUMED: ring radius
var TURNS = 2;                        // ASSUMED: two turns in 5 s (about 55 px of travel a frame at the front of the ring)
var words = ["MOTION", "BLUR", "SHUTTER", "ANGLE", "SPEED", "STREAK", "FRAME", "SPIN"]; // stand-in words
var c = P.freshComp("23 shutter angle blur", 1920, 1080, FPS, DUR, [0.04, 0.04, 0.05]);

// Dark grainy background.
var bg = P.solid(c, "background", [0.07, 0.07, 0.08]);
var noise = P.effect(bg, "Noise");
noise.property("Amount of Noise").setValue(8); // ASSUMED: grain amount

// 3D null that carries the ring and spins it.
var ctl = c.layers.addNull(DUR);
ctl.name = "ring spin";
ctl.threeDLayer = true;
P.tf(ctl, "ADBE Anchor Point").setValue([0, 0, 0]);
P.tf(ctl, "ADBE Position").setValue([960, 540, 0]);
var spin = P.tf(ctl, "ADBE Rotate Y");
spin.setValueAtTime(0, 0);
spin.setValueAtTime(DUR, 360 * TURNS);
// Linear, so the spin speed is constant (the recipe gives no easing).
spin.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
spin.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);

var i, a, t, ry;
for (i = 0; i < words.length; i++) {
  a = i * 2 * Math.PI / words.length;
  t = P.text(c, words[i], { size: 110, font: args.font || "Poppins-Bold", color: [1, 1, 1], name: "word " + (i + 1) });
  t.threeDLayer = true;
  t.parent = ctl;
  // Parent space: the null's anchor is at its origin, so positions are offsets from the ring centre.
  P.tf(t, "ADBE Position").setValue([R * Math.sin(a), 0, -R * Math.cos(a)]);
  ry = -a * 180 / Math.PI; // VERIFY sign (see above)
  P.tf(t, "ADBE Rotate Y").setValue(ry);
  t.motionBlur = true; // step 1: layer motion blur switch
}

// Step 1: comp motion blur on. Steps 2-5: Composition Settings > Advanced > Motion Blur.
// SUBSTITUTE: the Composition Settings dialog is replaced by setting the comp's properties directly.
c.motionBlur = true;
c.shutterAngle = (args.shutterAngle !== undefined) ? args.shutterAngle : 720; // 180 default -> 720
c.shutterPhase = -90;
c.motionBlurSamplesPerFrame = 16;
c.motionBlurAdaptiveSampleLimit = 128;

return { comp: c.name, id: c.id, layers: c.numLayers, shutterAngle: c.shutterAngle, shutterPhase: c.shutterPhase, fps: c.frameRate };

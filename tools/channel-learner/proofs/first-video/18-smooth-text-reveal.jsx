// Technique 18: soft word-by-word rise-and-fade text reveal.
// One text animator with Position (0,75) and Opacity 0, a Range Selector based on Words with Shape Ramp Up,
// Ease High -50 and Ease Low 100, and two linear Offset keyframes from -100 to 100.
//
// VERIFY: a script-made "ADBE Text Animator" has no Range Selector until "ADBE Text Selector" is added (guarded below)
// VERIFY: "ADBE Text Position 3D" takes a three-value array on a 2D text layer ([0,75,0])
// VERIFY: Range Selector match names: "ADBE Text Percent Start", "ADBE Text Percent End", "ADBE Text Percent Offset",
//         "ADBE Text Range Advanced", "ADBE Text Range Units", "ADBE Text Range Type2" (Based On),
//         "ADBE Text Selector Mode", "ADBE Text Selector Max Amount", "ADBE Text Range Shape",
//         "ADBE Text Levels Max Ease" (Ease High), "ADBE Text Levels Min Ease" (Ease Low), "ADBE Text Randomize Order"
// VERIFY: Based On enum 3 = Words (1 Characters, 2 Characters Excluding Spaces, 4 Lines); Shape enum 2 = Ramp Up
//         (1 Square, 3 Ramp Down, 4 Triangle, 5 Round, 6 Smooth); Units 1 = Percentage; Mode 1 = Add
// VERIFY: font PostScript name "Poppins-Bold" is installed (pass args.font to override)
$.evalFile(args.prelude);

var c = P.freshComp("18 smooth text reveal", 1920, 1080, 23.976, 5, [0.96, 0.95, 0.93]);
P.solid(c, "paper", [0.96, 0.95, 0.93]);

// ASSUMED: wording, font, size, centred two lines; the recipe names only "two-line bold sans, near-black".
var txt = P.text(c, "Every word arrives\rsoftly, one by one", {
  size: 120, font: args.font || "Poppins-Bold", color: [0.08, 0.08, 0.09], name: "headline"
});
var f = c.frameDuration;
txt.inPoint = 29 * f; // the layer's in point is 0:00:01:05, where the first Offset key sits

// Steps 1 to 3: one animator with Position and Opacity.
var animators = txt.property("ADBE Text Properties").property("ADBE Text Animators");
var aIdx = animators.addProperty("ADBE Text Animator").propertyIndex;
function anim() { return txt.property("ADBE Text Properties").property("ADBE Text Animators").property(aIdx); }
anim().name = "Animator 1";
anim().property("ADBE Text Animator Properties").addProperty("ADBE Text Position 3D");
anim().property("ADBE Text Animator Properties").property("ADBE Text Position 3D").setValue([0, 75, 0]); // the end state's 75, not the first 115
anim().property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity");
anim().property("ADBE Text Animator Properties").property("ADBE Text Opacity").setValue(0);

// Step 4: Range Selector 1 > Advanced.
if (anim().property("ADBE Text Selectors").numProperties === 0) {
  anim().property("ADBE Text Selectors").addProperty("ADBE Text Selector");
}
function sel() { return anim().property("ADBE Text Selectors").property(1); }
function adv() { return sel().property("ADBE Text Range Advanced"); }
sel().property("ADBE Text Percent Start").setValue(0);
sel().property("ADBE Text Percent End").setValue(100);
adv().property("ADBE Text Range Units").setValue(1);       // Percentage
adv().property("ADBE Text Range Type2").setValue(3);       // Based On: Words
adv().property("ADBE Text Selector Mode").setValue(1);     // Add
adv().property("ADBE Text Selector Max Amount").setValue(100);
adv().property("ADBE Text Range Shape").setValue(2);       // Ramp Up
adv().property("ADBE Text Levels Max Ease").setValue(-50); // Ease High
adv().property("ADBE Text Levels Min Ease").setValue(100); // Ease Low
adv().property("ADBE Text Randomize Order").setValue(0);

// Step 5: Offset -100 at 0:00:01:05 (frame 29) to 100 at 0:00:03:06 (frame 78), both linear.
var off = sel().property("ADBE Text Percent Offset");
off.setValueAtTime(29 * f, -100);
off.setValueAtTime(78 * f, 100);
off.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
off.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);

return { comp: c.name, layer: txt.name, keys: off.numKeys, revealStart: 29 * f, revealEnd: 78 * f };

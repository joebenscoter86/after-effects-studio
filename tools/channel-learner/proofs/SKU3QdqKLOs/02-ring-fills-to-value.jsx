// SKU3QdqKLOs technique 02: a ring that fills to the counter's value. Art build (PROOF/02/art/brief.md).
// Rig from 01 (null "Controls", Slider "Value 1", 0 at 0:00 to 83 at 3:00; both keys Easy Ease, influence 100 %).
// Two identical ellipse rings, path 515 px, no fill, 100 px Butt-cap stroke: a dim track (#2A2733) under a copy in the
// brief's accent (#FF6B3D in place of the recipe's #FFC200) whose Trim Paths End is the slider, so the arc grows
// clockwise from twelve o'clock to 83 %. The 01 counter sits in the ring's hole, left-aligned: only the landed "83%"
// is centred. Ring centre 540,998 (the brief: below 36 % of the height the plate is darker than the track).
// The author-pass stand-in version is 02-ring-fills-to-value-first.jsx.
//
// args: prelude, artLib, lib, artDir. Optional: args.wiggle (adds wiggle(2,5) to the slider), args.end (default 83).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.lib);

function ring(c, name, color, center, diameter, width, withTrim) {
  var sh = P.shape(c, name);
  P.ellipse(sh, [diameter, diameter]);
  P.stroke(sh, color, width, 1); // no fill; Butt cap
  if (withTrim) { // after the stroke, where the interface appends it; it trims the stroke above it in the group
    var t = P.contents(sh).addProperty("ADBE Vector Filter - Trim");
    var ti = t.propertyIndex;
    P.contents(sh).property(ti).property("ADBE Vector Trim Start").setValue(0);
    P.contents(sh).property(ti).property("ADBE Vector Trim Offset").setValue(0);
    P.contents(sh).property(ti).property("ADBE Vector Trim End").expression = SLIDER;
  }
  P.tf(sh.layer, "ADBE Position").setValue(center);
  return sh.layer;
}

var W = 1080, H = 1920, FPS = 24, DUR = 5, END = args.end || 83, FOLDER = "art SKU3 02";
var c = P.freshComp("SKU3 02 ring", W, H, FPS, DUR, [16 / 255, 24 / 255, 33 / 255]);
backdrop(c, args.artDir, FOLDER);
var MONO = "IBMPlexMono-Medium", COND = "BarlowSemiCondensed-SemiBold", BODY = "Montserrat-Medium";
txt(c, "of new accounts finish setup\ron their first day.", { size: 38, leading: 52, color: ART.hex("#A9B3C4"), font: BODY, just: "C", x: 540, top: 1428, name: "Caption" });
txt(c, "PAST STEP ONE", { size: 72, color: ART.hex("#EEF2F8"), font: COND, just: "C", x: 540, top: 537, name: "Heading" });
txt(c, "ONBOARDING", { size: 30, color: ART.hex("#FF6B3D"), font: MONO, just: "C", x: 540, top: 460, name: "Kicker" });

var RC = [540, 998], DIAM = 515, BAND = 100;
var ctl = rig(c, END, 100); // Easy Ease, influence 100 % in and out, speed 0
if (args.wiggle) ctl.property("ADBE Effect Parade").property("Value 1").property("ADBE Slider Control-0001").expression = "wiggle(2,5)";
ring(c, "Track ring", [42 / 255, 39 / 255, 51 / 255, 1], RC, DIAM, BAND, false);   // #2A2733
ring(c, "Arc ring", ART.hex("#FF6B3D").concat([1]), RC, DIAM, BAND, true);
ctl.moveToBeginning();

// Counter on top: left-aligned, its landed figure centred in the hole (recipe step 5).
var counter = txt(c, END + "%", { size: 111, color: [1, 1, 1], font: "Montserrat-Black", just: "L", x: 0, cy: RC[1], name: "Counter" });
var rr = counter.sourceRectAtTime(0, false);
P.tf(counter, "ADBE Position").setValue([RC[0] - rr.width / 2, RC[1]]);
counter.property("ADBE Text Properties").property("ADBE Text Document").expression = "Math.round(" + SLIDER + ') + "%"';

return { comp: c.name, id: c.id, layers: c.numLayers, counterLeft: RC[0] - rr.width / 2, landedWidth: rr.width, fontWarnings: FONT_WARN.join("; ") };

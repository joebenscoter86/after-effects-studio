// Technique 25: frame an image in a custom shape with a track matte.
// On a white slide, a dark "building photo" stand-in (a solid with a Gradient Ramp) is matted to one shape layer
// made of three rounded rectangles: a wide top bar and two blocks hanging down left and right, leaving a notch
// in the lower middle where black "Thank You" text sits on the white slide.
// Not a finish, so nothing is named TECH; the "before" state (grey shape over the slide, no matte) is args.matte = false.
//
// VERIFY: layer.setTrackMatte(matte, TrackMatteType.ALPHA) exists in AE 2027 (AE 23+).
// VERIFY: a matte layer with enabled = false still works as the matte (the UI turns its eye off by itself).
// VERIFY: "Gradient Ramp" display name and its properties "Start of Ramp", "Start Color", "End of Ramp", "End Color".
// VERIFY: Rectangle 3's recipe values (595 x 1285 at 1374.5, 261.5) are in shape-layer space; here the layer's position and anchor are 0,0 so they read as comp pixels.
// VERIFY: shape Rect, Fill and Stroke match names as in 22.
$.evalFile(args.prelude);

function addRect(sh, size, pos, round) {
  var r = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  var idx = r.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Rect Size").setValue(size);
  P.contents(sh).property(idx).property("ADBE Vector Rect Position").setValue(pos);
  P.contents(sh).property(idx).property("ADBE Vector Rect Roundness").setValue(round);
  return idx;
}
function addFill(sh, color) {
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  var idx = f.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Fill Color").setValue(color);
  return idx;
}

// ASSUMED: comp 1920 x 1080, 24 fps, 4 s (recipe: comp size unknown).
var c = P.freshComp("25 custom media frame", 1920, 1080, 24, 4, [1, 1, 1]);
var slide = P.solid(c, "white slide", [1, 1, 1]);

// Step 1: the frame shape, three rectangles in one shape layer with one grey fill and a switched-off stroke.
var frame = P.shape(c, "frame shape");
P.tf(frame.layer, "ADBE Anchor Point").setValue([0, 0]);
P.tf(frame.layer, "ADBE Position").setValue([0, 0]);
// Rectangle 1: wide bar across the top. ASSUMED: spans the outer edges of the two blocks (x 248..1672), y -100..560, bleeding off the top
// because Rectangle 3 (recipe values) already runs past the top edge.
addRect(frame, [1424, 660], [960, 230], 20);
// Rectangle 2: left block. ASSUMED: narrower than Rectangle 3 (x 248..648) so the notch is wide enough for the text.
addRect(frame, [400, 1285], [448, 261.5], 20);
// Rectangle 3: right block, recipe values.
addRect(frame, [595, 1285], [1374.5, 261.5], 20);
addFill(frame, [0.5, 0.5, 0.5, 1]); // ASSUMED: grey value
var st = P.stroke(frame, [0, 0, 0, 1], 3);
P.contents(frame).property(st).enabled = false; // recipe: Stroke Width 3.0, stroke switched off

// The "photo": a dark building stand-in, created after the shape so it sits directly above it (step 2).
var photo = P.solid(c, "building photo", [0.15, 0.17, 0.2]);
var ramp = P.effect(photo, "Gradient Ramp");
ramp.property("Start of Ramp").setValue([960, 0]);
ramp.property("Start Color").setValue([0.32, 0.36, 0.42]);
ramp.property("End of Ramp").setValue([960, 1080]);
ramp.property("End Color").setValue([0.05, 0.06, 0.08]);

// Step 3: the photo's eye stays on (a hidden layer renders nothing even with a matte).
photo.enabled = true;

// Steps 4-5: alpha matte to the shape; the shape's eye goes off.
if (args.matte !== false) {
  photo.setTrackMatte(frame.layer, TrackMatteType.ALPHA);
  frame.layer.enabled = false;
} else {
  photo.enabled = false; // before: grey shape over the slide, clip hidden
}

// The headline in the notch (on the white slide, below the top bar, between the blocks: x 648..1077).
P.text(c, "Thank You", { size: 78, color: [0, 0, 0], pos: [862, 760], name: "thank you" }); // ASSUMED: size and place

return { comp: c.name, id: c.id, layers: c.numLayers, matte: (args.matte !== false) };

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
// Rebuild with artwork (2026-11-14): art from PROOF/25/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// The Gradient Ramp stand-in is gone: "Facade" is facade.png (blue-hour brutalist block) at 66.7 %, centred across on the
// frame with its bottom edge on the frame's bottom edge, alpha-matted to the frame shape. Anchor at the image's bottom
// centre, so the slow push (66.7 -> 69 % over the comp, linear to the last frame) keeps the bottom edge covered.
// Small slide text in Poppins Regular (#111111 at 60 %) with one accent dot #E8913A; headline Poppins SemiBold #111111.
$.evalFile(args.artLib);
var ARTDIR = args.artDir;

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

// Run fix: comp 3840 x 2160 (the recipe measures it; the script predates that) and the shapes from the layout line.
// A new shape layer sits at the comp centre with its anchor at 0,0, so the recipe's Rectangle 3 values
// (595 x 1285 at 1374.5, 261.5) land at x 2997..3592, y 699..1984 in the comp: the layout's right block
// (15.4% of the width wide, the frame's full height, right edge at 93.4%). The other two follow from the layout:
// the left block is its mirror, and the top bar spans both blocks and is 29% of the height deep.
var W = 3840, H = 2160;
var DUR = args.dur || 6;
var c = P.freshComp("25 custom media frame", W, H, 24, DUR, [1, 1, 1]);
var slide = P.solid(c, "25 white slide", [1, 1, 1]);
slide.name = "white slide";

// Step 1: the frame shape, three rectangles in one shape layer with one grey fill and a switched-off stroke.
var frame = P.shape(c, "frame shape");
P.tf(frame.layer, "ADBE Anchor Point").setValue([0, 0]);
P.tf(frame.layer, "ADBE Position").setValue([W / 2, H / 2]);
var R3 = { size: [595, 1285], pos: [1374.5, 261.5] };                 // recipe values
var top = R3.pos[1] - R3.size[1] / 2;                                  // -381 (699 in the comp)
var outer = R3.pos[0] + R3.size[0] / 2;                                // 1672 (3592 in the comp)
var BAR = 0.29 * H;                                                    // 626 px deep (layout)
// Rectangle 1: wide bar across the top, spanning both blocks.
addRect(frame, [outer * 2, BAR], [0, top + BAR / 2], 20);
// Rectangle 2: left block, the mirror of Rectangle 3 (layout: both blocks 15.4% of the width wide).
addRect(frame, R3.size, [-R3.pos[0], R3.pos[1]], 20);
// Rectangle 3: right block, recipe values.
addRect(frame, R3.size, R3.pos, 20);
addFill(frame, [0.5, 0.5, 0.5, 1]); // ASSUMED: grey value
var st = P.stroke(frame, [0, 0, 0, 1], 3);
P.contents(frame).property(st).enabled = false; // recipe: Stroke Width 3.0, stroke switched off

// The photo, created after the shape so it sits directly above it (step 2).
var photo = c.layers.add(ART.footage(ARTDIR, "facade.png", "art 25"));
photo.name = "Facade";
var FB = H / 2 + R3.pos[1] + R3.size[1] / 2;   // frame bottom in the comp (1984)
P.tf(photo, "ADBE Anchor Point").setValue([photo.source.width / 2, photo.source.height]);
P.tf(photo, "ADBE Position").setValue([W / 2, FB]);
var fsc = P.tf(photo, "ADBE Scale");
fsc.setValueAtTime(0, [66.7, 66.7]);
fsc.setValueAtTime(DUR, [args.push || 69, args.push || 69]);

// Step 3: the photo's eye stays on (a hidden layer renders nothing even with a matte).
photo.enabled = true;

// Steps 4-5: alpha matte to the shape; the shape's eye goes off.
if (args.matte !== false) {
  photo.setTrackMatte(frame.layer, TrackMatteType.ALPHA);
  frame.layer.enabled = false;
} else {
  photo.enabled = false; // before: grey shape over the slide, clip hidden
}

// The headline in the notch: about 52% of the width wide, capitals 12% of the height tall, centred at 50% across (layout);
// placed in the middle of the notch (the layout gives no height for it).
var cand = [args.font || "Poppins-SemiBold", "Poppins-Bold", "HelveticaNeue-Bold", "Arial-BoldMT"];
var FONT = null, ci, fo;
for (ci = 0; ci < cand.length && !FONT; ci++) {
  try { fo = app.fonts.getFontsByPostScriptName(cand[ci]); if (fo.length && !fo[0].isSubstitute) FONT = cand[ci]; } catch (errFont) {}
}
if (!FONT) FONT = "Arial-BoldMT";
var probe = P.text(c, "T", { size: 100, font: FONT, color: [0, 0, 0], name: "probe" });
var FS = 100 * (0.12 * H) / probe.sourceRectAtTime(0, false).height;
probe.remove();
var STR = args.headline || "Thank You";
var notchTop = H / 2 + top + BAR, notchBottom = H / 2 + top + R3.size[1];
var head = P.text(c, STR, { size: FS, font: FONT, color: ART.hex("#111111"), name: "headline" });
var hr = head.sourceRectAtTime(0, false);
var TRK = Math.round((0.52 * W - hr.width) / (STR.length - 1) * 1000 / FS);
var hp = head.property("ADBE Text Properties").property("ADBE Text Document");
var hd = hp.value; hd.tracking = TRK; hp.setValue(hd);
hr = head.sourceRectAtTime(0, false);
P.tf(head, "ADBE Anchor Point").setValue([hr.left + hr.width / 2, hr.top + hr.height / 2]);
P.tf(head, "ADBE Position").setValue([W / 2, (notchTop + notchBottom) / 2]);

// Small slide text (brief): studio name top left on the frame's left edge, page number top right on its right edge,
// both 1.2 % of the height (cap height), #111111 at 60 %, with one accent dot before the studio name.
var SFONT = "Poppins-Regular";
try { var sfo = app.fonts.getFontsByPostScriptName(SFONT); if (!sfo.length || sfo[0].isSubstitute) SFONT = FONT; } catch (eS) { SFONT = FONT; }
var SCAP = 0.012 * H, SFS = 100, LEFTX = W / 2 - outer, RIGHTX = W / 2 + outer, SY = 0.215 * H;
function small(str, name, alignRight) {
  var l = P.text(c, str, { size: SFS, font: SFONT, color: ART.hex("#111111"), tracking: 120, name: name });
  var r = l.sourceRectAtTime(0, false), k = SCAP / r.height * 100;
  var tp = l.property("ADBE Text Properties").property("ADBE Text Document"), td = tp.value; td.fontSize = SFS * k / 100 * (100 / 100); tp.setValue(td);
  r = l.sourceRectAtTime(0, false);
  P.tf(l, "ADBE Anchor Point").setValue([alignRight ? r.left + r.width : r.left, r.top + r.height]);
  P.tf(l, "ADBE Opacity").setValue(60);
  return l;
}
var sn = small("STUDIO BRUT  /  HOUSING STUDIES", "studio name", false);
P.tf(sn, "ADBE Position").setValue([LEFTX + 54, SY]);
var pg = small("24 / 24", "page number", true);
P.tf(pg, "ADBE Position").setValue([RIGHTX, SY]);
var acc = P.shape(c, "accent dot");
P.ellipse(acc, [22, 22]);
(function () { var f = P.contents(acc).addProperty("ADBE Vector Graphic - Fill"); P.contents(acc).property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(ART.hex("#E8913A")); })();
P.tf(acc.layer, "ADBE Position").setValue([LEFTX + 11, SY - SCAP / 2]);

// Remove this script's own unused solids from earlier runs.
var oi, oit;
for (oi = app.project.numItems; oi >= 1; oi--) {
  oit = app.project.item(oi);
  if (oit instanceof FootageItem && oit.mainSource instanceof SolidSource && oit.usedIn.length === 0 &&
      (oit.name === "25 white slide" || oit.name === "25 building photo")) oit.remove();
}
var ml = null; try { ml = photo.trackMatteLayer ? photo.trackMatteLayer.name : null; } catch (e1) {}
return { comp: c.name, id: c.id, layers: c.numLayers, matte: (args.matte !== false), matteLayer: ml, shapeEye: frame.layer.enabled,
  font: FONT, smallFont: SFONT, fontSize: FS, tracking: TRK, headline: [hr.width, hr.height], notch: [notchTop, notchBottom] };

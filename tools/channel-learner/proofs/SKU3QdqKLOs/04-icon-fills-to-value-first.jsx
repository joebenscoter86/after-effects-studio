// SKU3QdqKLOs technique 04: an icon that fills up to a value.
// A flat icon coloured dim slate (#273641) with the Fill effect; a duplicate above it coloured #FFCD10 and shown only
// through an alpha track matte: a shape layer holding one vertical two-point path (bottom vertex first) through the
// icon's middle, 464 px Butt stroke, Trim Paths End = the rig's slider. The stroke's square rises from the bottom
// with a hard horizontal edge. Rig from 01: null "Controls", Slider "Value 1", 0 at 0:00 to 83 at 3:00, Easy Ease
// (End 83 gives the measured 86 % fill). A large white figure with a caption counts first, on its own slider "Value 2".
// Portrait 1080 x 1920 for a phone.
//
// VERIFY: font PostScript names "Montserrat-Black", "Montserrat-Regular" are installed; substitutes are reported
// VERIFY: TextDocument.fontObject.isSubstitute exists (read guarded)
// VERIFY: effect match name ADBE Fill and its parameter display name "Color"; setValue with an [r, g, b] array
// VERIFY: layer.duplicate() places the copy directly above and keeps the Fill effect
// VERIFY: layer.setTrackMatte(matteLayer, TrackMatteType.ALPHA) exists (After Effects 2023+); setting matte.enabled = false afterwards keeps the matte working
// VERIFY: "ADBE Vector Fill Rule" value 2 is Even-Odd, which cuts the porthole circle out of the rocket body
// VERIFY: Trim End grows from the path's first vertex (the bottom one), so the yellow rises from the icon's bottom
// VERIFY: sourceRectAtTime on the shape layer returns the bounds of the rotated rocket paths (rotation is baked into the vertices)
//
// args.prelude (required). Optional: args.end (fill slider's end, default 83), args.figure (counter's end, default 863),
// args.font, args.bodyFont.
$.evalFile(args.prelude);

// ---- local helpers (candidates for the prelude: rig, txt, bgSolid, fontCheck) ----
var FONT_WARN = [];
function fontCheck(layer) {
  var d = layer.property("ADBE Text Properties").property("ADBE Text Document").value;
  if (d.fontObject && d.fontObject.isSubstitute) FONT_WARN.push(layer.name + ": " + d.font + " is a substitute");
}
// Text with justification "L", "C" or "R"; the anchor sits on the text's bounds at that side, vertically centred.
function txt(c, str, o) {
  var l = c.layers.addText(str);
  var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value;
  d.resetCharStyle();
  d.fontSize = o.size;
  d.fillColor = o.color;
  d.applyFill = true;
  d.applyStroke = false;
  if (o.font) d.font = o.font;
  if (o.tracking !== undefined) d.tracking = o.tracking;
  d.justification = o.just === "L" ? ParagraphJustification.LEFT_JUSTIFY : (o.just === "R" ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.CENTER_JUSTIFY);
  prop.setValue(d);
  if (o.name) l.name = o.name;
  var r = l.sourceRectAtTime(0, false);
  var ax = o.just === "L" ? r.left : (o.just === "R" ? r.left + r.width : r.left + r.width / 2);
  P.tf(l, "ADBE Anchor Point").setValue([ax, r.top + r.height / 2]);
  P.tf(l, "ADBE Position").setValue(o.pos);
  fontCheck(l);
  return l;
}
// Remove unused solids of this exact name left by earlier runs, then add a full-frame one at the bottom.
function bgSolid(c, name, color) {
  var i, it;
  for (i = app.project.numItems; i >= 1; i--) {
    it = app.project.item(i);
    if (it instanceof FootageItem && it.name === name && it.mainSource instanceof SolidSource && it.usedIn.length === 0) it.remove();
  }
  var s = P.solid(c, name, color);
  s.moveToEnd();
  return s;
}
// The value rig shared by 01-04: a null "Controls" with a Slider Control "Value 1", 0 at 0:00 to `end` at 3:00.
// ease: "linear", or a number = Easy Ease influence in percent on both keys (speed 0).
function rig(c, end, ease) {
  var n = c.layers.addNull();
  n.name = "Controls";
  var fx = P.effect(n, "ADBE Slider Control");
  fx.name = "Value 1";
  var s = n.property("ADBE Effect Parade").property("Value 1").property("ADBE Slider Control-0001");
  s.setValueAtTime(0, 0);
  s.setValueAtTime(3, end); // 3:00 at 24 fps = 3.0 s exactly
  var k;
  for (k = 1; k <= s.numKeys; k++) {
    if (ease === "linear") {
      s.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    } else {
      s.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
      s.setTemporalEaseAtKey(k, [new KeyframeEase(0, ease)], [new KeyframeEase(0, ease)]);
    }
  }
  return n;
}
var SLIDER = 'thisComp.layer("Controls").effect("Value 1")("Slider")';
function shapeFill(sh, color) {
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  var idx = f.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Fill Color").setValue(color);
  P.contents(sh).property(idx).property("ADBE Vector Fill Rule").setValue(2); // Even-Odd: the porthole is a hole
  return idx;
}
// Rotate a list of points (and tangents) by `deg` on screen (y down, positive = clockwise).
function rot(pts, deg) {
  var a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), out = [], i;
  for (i = 0; i < pts.length; i++) out.push([pts[i][0] * ca - pts[i][1] * sa, pts[i][0] * sa + pts[i][1] * ca]);
  return out;
}
function zeros(n) { var z = [], i; for (i = 0; i < n; i++) z.push([0, 0]); return z; }
function rocketPath(sh, verts, ins, outs) {
  P.path(sh, rot(verts, 45), rot(ins || zeros(verts.length), 45), rot(outs || zeros(verts.length), 45), true);
}

// ---- build ----
var W = 1080, H = 1920, FPS = 24, DUR = 5;
var END = args.end || 83;       // build note: End about 83 gives the measured 86 % fill; the typed value is unknown
var FIGURE = args.figure || 863;
var GROUND = [20 / 255, 18 / 255, 25 / 255];
var DIM = [39 / 255, 54 / 255, 65 / 255];   // #273641 (swatch read)
var BRIGHT = [1, 205 / 255, 16 / 255];      // #FFCD10 (typed)
var ICON = 344;                             // icon about 344 x 344 comp px
var IC = [W / 2, 800];                      // icon centred across, above the figure (they sat side by side)
var c = P.freshComp("SKU3 04 icon", W, H, FPS, DUR, GROUND);
bgSolid(c, "SKU3 04 background", GROUND);

// Stand-in figure and caption (from 01), stacked under the icon. Figure left-aligned, landed value centred.
var FIG_Y = IC[1] + ICON / 2 + 150;
txt(c, "rockets launched this year", { size: 36, color: [0.62, 0.64, 0.7], font: args.bodyFont || "Montserrat-Regular", just: "C", pos: [W / 2, FIG_Y + 95], name: "caption" });
var counter = txt(c, FIGURE + "k", { size: 111, color: [1, 1, 1], font: args.font || "Montserrat-Black", just: "L", pos: [0, FIG_Y], name: "counter" });
var rr = counter.sourceRectAtTime(0, false);
P.tf(counter, "ADBE Position").setValue([W / 2 - rr.width / 2, FIG_Y]);

// Rig: Value 1 drives the fill; Value 2 drives the figure, which lands first (ASSUMED: 0 to 863 over 0:00-0:18).
var ctl = rig(c, END, 33.33); // ASSUMED: default Easy Ease influence; the recipe shows hourglass keys only
var fx2 = P.effect(ctl, "ADBE Slider Control");
fx2.name = "Value 2";
var s2 = ctl.property("ADBE Effect Parade").property("Value 2").property("ADBE Slider Control-0001");
s2.setValueAtTime(0, 0);
s2.setValueAtTime(18 / FPS, FIGURE);
s2.setInterpolationTypeAtKey(1, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
s2.setInterpolationTypeAtKey(2, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
s2.setTemporalEaseAtKey(1, [new KeyframeEase(0, 33.33)], [new KeyframeEase(0, 33.33)]);
s2.setTemporalEaseAtKey(2, [new KeyframeEase(0, 33.33)], [new KeyframeEase(0, 33.33)]);
counter.property("ADBE Text Properties").property("ADBE Text Document").expression = 'Math.round(thisComp.layer("Controls").effect("Value 2")("Slider")) + "k"';

// Stand-in icon: a flat rocket pointing up-right, one shape layer, its own fill overridden by the Fill effect.
var K = 0.5523;
var sh = P.shape(c, "icon dim");
rocketPath(sh, [[0, -175], [60, -60], [60, 105], [-60, 105], [-60, -60]],
  [[-30, 12], [0, -60], [0, 0], [0, 0], [0, 0]],
  [[30, 12], [0, 0], [0, 0], [0, 0], [0, -60]]);                                   // body with an ogive nose
rocketPath(sh, [[60, 10], [110, 95], [110, 150], [60, 105]]);                      // right fin
rocketPath(sh, [[-60, 10], [-60, 105], [-110, 150], [-110, 95]]);                  // left fin
rocketPath(sh, [[-32, 120], [32, 120], [0, 185]]);                                 // flame
var R = 28, cy = -45;                                                              // porthole (a hole)
rocketPath(sh, [[0, cy - R], [R, cy], [0, cy + R], [-R, cy]],
  [[-R * K, 0], [0, -R * K], [R * K, 0], [0, R * K]],
  [[R * K, 0], [0, R * K], [-R * K, 0], [0, -R * K]]);
shapeFill(sh, [0.5, 0.5, 0.5, 1]);
var dim = sh.layer;
var r = dim.sourceRectAtTime(0, false);
var sc = ICON / Math.max(r.width, r.height) * 100;
P.tf(dim, "ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]);
P.tf(dim, "ADBE Position").setValue(IC);
P.tf(dim, "ADBE Scale").setValue([sc, sc]);
var iconH = r.height * sc / 100;
P.effect(dim, "ADBE Fill").property("Color").setValue(DIM);

// Bright copy above it.
var bright = dim.duplicate();
bright.name = "icon bright";
bright.property("ADBE Effect Parade").property(1).property("Color").setValue(BRIGHT);

// Matte: a vertical path from 14 px below the icon's bottom to 16 px above its top, bottom vertex first, 464 px stroke.
var mt = P.shape(c, "FILL matte");
var yB = IC[1] + iconH / 2 + 14, yT = IC[1] - iconH / 2 - 16;
P.path(mt, [[IC[0], yB], [IC[0], yT]], null, null, false);
var t = P.contents(mt).addProperty("ADBE Vector Filter - Trim");
var ti = t.propertyIndex;
P.contents(mt).property(ti).property("ADBE Vector Trim End").expression = SLIDER;
P.stroke(mt, [1, 0.8, 0, 1], 464, 1); // colour irrelevant: it is only a matte; Butt cap keeps the edge flat
P.tf(mt.layer, "ADBE Position").setValue([0, 0]);
var matte = mt.layer;
matte.moveBefore(bright);
bright.setTrackMatte(matte, TrackMatteType.ALPHA);
matte.enabled = false;
ctl.moveToBeginning();

var L = yB - yT;
return { comp: c.name, id: c.id, layers: c.numLayers, iconHeight: iconH, matteLength: L,
  predictedFill: (END / 100 * L - 14) / iconH, fontWarnings: FONT_WARN.join("; ") };

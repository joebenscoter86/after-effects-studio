// Technique 12: long soft shadow from a radially blurred black copy.
// Each object gets a copy underneath, parented to it, turned solid with Fill, streaked with CC Radial Fast Blur
// (Amount 95, Zoom Standard, centre up and to the left of the object so the streak runs down and to the right), then
// softened with Gaussian Blur 25.6. The title throws no shadow (recipe: the letters lie flat).
// Switch-off for a "before" frame: disable every layer whose name starts with "TECH shadow" (or run with args.before).
//
// Rebuild with artwork (2026-11-14): art from PROOF/12/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// The shape stand-ins are gone. "page" is page.png at 37.5 %; six raised clay blocks (block square, pillar, cube sage,
// bar left, slab pill, slab wide) are cut-outs, each placed inside its own comp-sized precomp ("12 obj <name>") so that
// the shadow copy is a comp-sized, unscaled layer: CC Radial Fast Blur's Center then reads comp pixels, the blurs work
// in comp pixels (a footage layer at 6.5 % would shrink a 25.6 px Gaussian Blur to under 2 px), and the streak is not
// clipped at the cut-out's trimmed edge. Fill colour is the brief's shadow ink #3A332B, not pure black.
// Title "Calm" (Instrument Serif Italic) over "shapes" (Poppins Bold), taupe, above every shadow, no shadow copies.
// Movie: everything is parented to "push null", which scales 100 -> 104 % linearly over the comp (keeps moving to the end).
//
// Earlier VERIFY items (resolved in the first run, see build-notes.md): match names "ADBE Fill", "CC Radial Fast Blur",
// "ADBE Gaussian Blur 2"; Zoom 1 = Standard; Blur Dimensions 1 = both; Repeat Edge Pixels 1 = on; Fill Opacity 0..1.
// VERIFY (rebuild): on a comp-sized precomp layer at 100 % the Center reads comp pixels, as on comp-sized shape layers.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
args = args || {};
var ARTDIR = args.artDir;
var FOLDER = "art 12";
var W = 1920, H = 1080, FPS = 24, DUR = args.dur || 6;
var BEFORE = (args.before === true);

function fxp(layer, effectName, prop) {
  var p = layer.property("ADBE Effect Parade").property(effectName).property(prop);
  if (!p) throw new Error("property not found: " + effectName + " > " + prop + " on " + layer.name);
  return p;
}

var c = P.freshComp("12 long soft shadow", W, H, FPS, DUR, ART.hex("#EFEBE3"));
// Remove this technique's own leftovers: the first build's background solid (#F4F6F8), earlier object precomps and push null.
(function () {
  var i, it, col;
  for (i = app.project.numItems; i >= 1; i--) {
    it = app.project.item(i);
    if (it instanceof CompItem && it.name.indexOf("12 obj ") === 0) { it.remove(); continue; }
    if (!(it instanceof FootageItem) || !(it.mainSource instanceof SolidSource) || it.usedIn.length > 0) continue;
    col = it.mainSource.color;
    if (it.name === "12 push null") it.remove();
    else if (it.name === "background" && Math.abs(col[0] - 0.9569) < 0.002 && Math.abs(col[1] - 0.9647) < 0.002 && Math.abs(col[2] - 0.9725) < 0.002) it.remove();
  }
})();

var page = c.layers.add(ART.footage(ARTDIR, "page.png", FOLDER));
page.name = "page";
P.tf(page, "ADBE Scale").setValue([37.5, 37.5]);
P.tf(page, "ADBE Position").setValue([W / 2, H / 2]);

// Objects from the brief: file, layer name, scale %, centre (shares), shadow direction (degrees below horizontal).
// Directions: the recipe's layout measures 10 (top-left block), 38 (tall right bar), 40 (small lower block) and 71 (left
// bar). The brief asks for one light from the upper left with every shadow down and to the right, matching the drawn
// side faces; so the recipe's per-object variety is kept but pulled toward the brief's light (args.dirs overrides).
var DIRS = args.dirs || [22, 38, 40, 60, 48, 30];
var OBJ = [
  { file: "block-square.png", name: "block square", s: 6.5, x: 0.145, y: 0.155 },
  { file: "pillar-terracotta.png", name: "pillar", s: 8.9, x: 0.89, y: 0.315 },
  { file: "cube-sage.png", name: "cube sage", s: 4.2, x: 0.335, y: 0.805 },
  { file: "bar-long.png", name: "bar left", s: 10.6, x: 0.11, y: 0.63 },
  { file: "slab-pill.png", name: "slab pill", s: 21, x: 0.50, y: 0.77 },
  { file: "slab-wide.png", name: "slab wide", s: 16.8, x: 0.73, y: 0.12 }
];
// Run: spread 46 deg (centres 100 to 620 px out) gave shadows that read dense at the object; the 60 px sage cube still
// read faint, so it alone gets a closer centre (70 deg). args.spreads overrides per object, args.spread all of them.
// Polish (2026-11-14): the 46-degree fan broke the recipe's measured look (near-parallel bands about as wide as their
// object). Spread is back to 15 degrees for every object (centres several object-widths out). Density is kept by
// Multiply at 100 % and by stacking the shadow copy (args.stack copies, default 2), never by widening the fan. The small
// sage cube's shadow copy is scaled 2x about the cube (a Transform effect before the blur) so it carries enough mass.
var SPREADS = args.spreads || (args.spread ? [args.spread, args.spread, args.spread, args.spread, args.spread, args.spread] : [15, 15, 15, 15, 15, 15]);
var STACK = args.stack || 2;
var PADX = args.padX !== undefined ? args.padX : 1200, PADY = args.padY !== undefined ? args.padY : 1000;
var GROW = args.grow || { "cube sage": 2 };
var AMOUNT = args.amount || 95;
var GAUSS = args.gauss === undefined ? 25.6 : args.gauss;
// Run (rebuild): the far centres of the first build (15 deg spread) spread a small block's mass over a ray 20 times its
// distance, so the shadow at the object read only 10 to 20 levels. Spread 32 deg brings the centres in; opacity 100 %
// in Multiply lets the warm ink darken the paper (grid lines show through) instead of greying it. Recipe: blend not shown.
var OPAC = args.shadowOpacity === undefined ? 100 : args.shadowOpacity;
var MULT = (args.multiply !== false);
var INK = ART.hex(args.ink || "#3A332B");

var objs = [], shadows = [], centres = [];
var k;
for (k = 0; k < OBJ.length; k++) {
  var o = OBJ[k];
  var ft = ART.footage(ARTDIR, o.file, FOLDER);
  // Polish: the 15-degree centres sit far outside the frame, and CC Radial Fast Blur stops its Center at the layer's
  // edge. Each object precomp is padded by PADX / PADY on every side, so the layer is bigger than the comp and the
  // centre lands inside it; effect points then read comp pixels + [PADX, PADY].
  var pc = app.project.items.addComp("12 obj " + o.name, W + 2 * PADX, H + 2 * PADY, 1, DUR, FPS);
  pc.parentFolder = ART.folder(FOLDER);
  var inner = pc.layers.add(ft);
  P.tf(inner, "ADBE Scale").setValue([o.s, o.s]);
  P.tf(inner, "ADBE Position").setValue([o.x * W + PADX, o.y * H + PADY]);
  var L = c.layers.add(pc);
  L.name = o.name;
  objs.push(L);
  if (BEFORE) continue;

  var stk;
  for (stk = 1; stk <= STACK; stk++) {
  // Step 1: duplicate; the copy underneath is the shadow, parented to its object.
  var s = L.duplicate();
  s.name = "TECH shadow " + o.name + (stk > 1 ? " " + stk : "");
  s.moveAfter(L);
  s.parent = L;
  if (GROW[o.name]) {
    P.effect(s, "ADBE Geometry2");
    fxp(s, "Transform", "Anchor Point").setValue([o.x * W + PADX, o.y * H + PADY]);
    fxp(s, "Transform", "Position").setValue([o.x * W + PADX, o.y * H + PADY]);
    fxp(s, "Transform", "Scale Height").setValue(100 * GROW[o.name]); // Transform names its scale "Scale Height" / "Scale Width"
    fxp(s, "Transform", "Scale Width").setValue(100 * GROW[o.name]);
  }
  // Step 2: no layer styles on the copy (the cut-outs carry none).
  // Step 3: solid with Fill, the brief's warm shadow ink.
  P.effect(s, "ADBE Fill");
  fxp(s, "Fill", "Color").setValue(INK.concat([1]));
  // Step 4: CC Radial Fast Blur, Amount 95, Zoom Standard.
  P.effect(s, "CC Radial Fast Blur");
  fxp(s, "CC Radial Fast Blur", "Amount").setValue(AMOUNT);
  fxp(s, "CC Radial Fast Blur", "Zoom").setValue(1);
  // Step 5: aim. Centre opposite the shadow's direction; distance from the spread wanted (see the first run's notes).
  var wpx = ft.width * o.s / 100, hpx = ft.height * o.s / 100;
  var th = DIRS[k] * Math.PI / 180;
  var across = (wpx * Math.abs(Math.sin(th)) + hpx * Math.abs(Math.cos(th))) * (GROW[o.name] || 1); // a grown copy keeps the same spread
  var d = (across / 2) / Math.tan(SPREADS[k] * Math.PI / 360);
  var cen = [o.x * W - d * Math.cos(th), o.y * H - d * Math.sin(th)];
  fxp(s, "CC Radial Fast Blur", "Center").setValue([cen[0] + PADX, cen[1] + PADY]);
  if (stk === 1) centres.push([Math.round(cen[0]), Math.round(cen[1]), Math.round(d)]);
  // Step 6: Gaussian Blur.
  P.effect(s, "ADBE Gaussian Blur 2");
  fxp(s, "Gaussian Blur", "Blurriness").setValue(GAUSS);
  fxp(s, "Gaussian Blur", "Blur Dimensions").setValue(1);
  fxp(s, "Gaussian Blur", "Repeat Edge Pixels").setValue(1);
  // Second copy only tops up the density: one copy measured 30 / 21 / 15 % peak darkening at 0.19 / 0.22 / 0.25 w below
  // the top-left block (reference 36 / 25 / 17 %), two full copies 51 / 38 / 28 %; the top-up copy runs at args.stackOpacity.
  P.tf(s, "ADBE Opacity").setValue(stk > 1 ? (args.stackOpacity !== undefined ? args.stackOpacity : 25) : OPAC);
  if (MULT) s.blendingMode = BlendingMode.MULTIPLY;
  shadows.push(s.name);
  }
}

// Title, flat on the page, above every shadow.
function pickFont(list) {
  var i, f;
  for (i = 0; i < list.length; i++) {
    try { f = app.fonts.getFontsByPostScriptName(list[i]); if (f.length && !f[0].isSubstitute) return list[i]; } catch (e) {}
  }
  return list[list.length - 1];
}
var TAUPE = ART.hex("#9C9183");
var F1 = pickFont(["InstrumentSerif-Italic", "Georgia-Italic"]);
var F2 = pickFont(["Poppins-Bold", "HelveticaNeue-Bold"]);
var up = P.text(c, "Calm", { size: args.upSize || 230, font: F1, color: TAUPE, name: "Calm", pos: [(args.upX || 0.50) * W, (args.upY || 0.28) * H] });
var lo = P.text(c, "shapes", { size: args.loSize || 300, font: F2, color: TAUPE, tracking: -10, name: "shapes", pos: [(args.loX || 0.50) * W, (args.loY || 0.49) * H] });
lo.moveToBeginning(); up.moveToBeginning();

// Slow push for the movie.
var push = c.layers.addNull(DUR);
push.name = "push null"; push.source.name = "12 push null";
var pl;
for (pl = 1; pl <= c.numLayers; pl++) if (c.layer(pl) !== push && !c.layer(pl).parent) c.layer(pl).parent = push;
var ps = P.tf(push, "ADBE Scale");
ps.setValueAtTime(0, [100, 100]); ps.setValueAtTime(DUR, [args.push || 104, args.push || 104]);

var r1 = up.sourceRectAtTime(0, false), r2 = lo.sourceRectAtTime(0, false);
return { comp: c.name, layers: c.numLayers, before: BEFORE, fonts: [F1, F2], calm: [r1.width, r1.height], shapes: [r2.width, r2.height, r2.top], centres: centres, switchOff: shadows.join(", ") };

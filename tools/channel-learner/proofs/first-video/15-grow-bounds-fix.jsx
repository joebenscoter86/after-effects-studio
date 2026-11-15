// Technique 15: un-clip an effect with Grow Bounds.
// Each shadow copy (a duplicate of a tightly trimmed cut-out) gets Fill (dark), CC Radial Fast Blur and Gaussian Blur.
// The radial streak runs past the layer's box and is cut off with a hard edge. Grow Bounds at the top of the effect
// stack gives the effects room so the streak runs on.
// Before frame: run with args.before = true (every "TECH Grow Bounds" switched off), or switch them off by hand.
//
// Rebuild with artwork (2026-11-14): art from PROOF/15/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// Dawn hilltop: sky with sun, three clouds, far hills, `hill main`, then the three shadow copies (`tree round shadow`,
// `tree cone shadow`, `figure shadow`), `tree round`, `tree cone`, `figure`, `hills near`. All 2D footage layers.
// The cut-outs are big sources shown at 3.3 to 4.3 %, so every effect on them works in the source's own pixels:
// the Gaussian Blur and the Grow Bounds Pixels are given in source pixels (the recipe's 71.2 would be 3 comp px here).
// The shadow copies are matted (alpha) by `hill matte`, a duplicate of `hill main`, so no haze shows against the sky.
// Each cut-out gets a Simple Choker to trim a warm fringe from the generated alpha (see build-notes).
// Movie: everything sits under "push null" (scale 100 -> 103 % linear), and the clouds drift sideways; nothing stops.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
args = args || {};
var ARTDIR = args.artDir;
var FOLDER = "art 15";
var W = 1920, H = 1080, FPS = 24, DUR = args.dur || 6;
var BEFORE = (args.before === true);

function fx(layer, name) { return layer.property("ADBE Effect Parade").property(name); }

var c = P.freshComp("15 grow bounds", W, H, FPS, DUR, ART.hex("#8E7F9C"));
// Remove this technique's own leftovers: the stand-in tree precomp and the push null solid.
(function () {
  var i, it;
  for (i = app.project.numItems; i >= 1; i--) {
    it = app.project.item(i);
    if (it instanceof CompItem && it.name === "15 tree art" && it.usedIn.length === 0) it.remove();
    else if (it instanceof CompItem && it.name.indexOf("15 obj ") === 0) it.remove();
    else if (it instanceof FootageItem && it.mainSource instanceof SolidSource && it.usedIn.length === 0 && (it.name === "15 push null" || it.name === "sky")) {
      if (it.name === "15 push null" || (it.name === "sky" && it.mainSource.color[0] === 1 && it.mainSource.color[1] === 1)) it.remove();
    }
  }
})();

function put(file, name, s, pos, anchor) {
  var L = c.layers.add(ART.footage(ARTDIR, file, FOLDER));
  L.name = name;
  if (anchor) P.tf(L, "ADBE Anchor Point").setValue(anchor);
  P.tf(L, "ADBE Scale").setValue([s, s]);
  P.tf(L, "ADBE Position").setValue(pos);
  return L;
}
// Fringe trim on a cut-out: Simple Choker, in source pixels.
function choke(L, px) {
  if (!px) return;
  var e = P.effect(L, "ADBE Simple Choker");
  L.property("ADBE Effect Parade").property(e.propertyIndex).property("Choke Matte").setValue(px);
  L.property("ADBE Effect Parade").property(e.propertyIndex).name = "fringe choke";
}
var CHOKE = args.choke === undefined ? 4 : args.choke;

var sky = put("sky-sun.png", "sky", 37.5, [960, 324]);
var cb = put("cloud-big.png", "cloud big", 14, [330, 190]);
var cs2 = put("cloud-small.png", "cloud small 2", 8, [1190, 300]);
var cs = put("cloud-small.png", "cloud small", 12, [1540, 150]);
choke(cb, CHOKE); choke(cs2, CHOKE); choke(cs, CHOKE);
// Clouds drift slowly (px per second), never stopping.
cb.property("ADBE Transform Group").property("ADBE Position").expression = "value + [time * 9, 0]";
cs2.property("ADBE Transform Group").property("ADBE Position").expression = "value + [time * 5, 0]";
cs.property("ADBE Transform Group").property("ADBE Position").expression = "value + [-time * 7, 0]";
var far = put("hills-far.png", "hills far", 75, [960, 794]);
// Polish (2026-11-14): the hilltop group (hill main, the three objects and their shadows) is scaled by GS about the
// crest, so the objects read at phone size and their shadows fill the lower frame. The technique's values stay the
// recipe's; only the layout changes (prove-run step 0, lesson 12).
var GS = args.groupScale || 1.5;
var CY = 1041 - 701 / 2;              // hill crest, comp px (hill main's top edge)
function gp(p) { return [960 + (p[0] - 960) * GS, CY + (p[1] - CY) * GS]; }
var hill = put("hill-main.png", "hill main", 86 * GS, gp([960, 1041]));

// Objects: file, name, scale, anchor (feet), position, and the shadow's CC Radial Fast Blur centre height above the
// feet in source pixels (straight above, so the streak runs straight down the hill toward us).
var OBJ = [
  { file: args.treeRoundFile || "tree-round-rimless.png", name: "tree round", s: 4.3, a: [765, 2277], p: [0.40 * W, 0.655 * H] },
  { file: "tree-cone.png", name: "tree cone", s: 3.9, a: [712, 2622], p: [0.60 * W, 0.659 * H] }, // run: at 0.655 its trunk stopped 4 px above the sloping hill
  { file: "figure.png", name: "figure", s: 3.3, a: [733, 2302], p: [0.50 * W, 0.645 * H] } // run: at 0.64 the boots hovered 3 px above the soft crest
];
// Run: 1.55 (the plain build's ratio) streaked only about a third of the object's height past its feet; the zoom streak
// grows with the centre's distance, so 3.5 reaches the layout's "about as long as the object is tall".
// Polish: with Amount 95 back, a copy standing on its feet with the centre above it gives a 1 / distance streak that
// either fades from the foot (centre close) or runs to the frame's bottom (centre far); the reference's streak holds
// 21-30 % darker for most of an object height, then ends within about half a height. The recipe leaves the shadow
// copy's making open, so the copy is laid down the hill instead: flipped about the feet and stretched FLIPK times
// (the shadow a back light throws toward us), with the centre CEN object heights above the feet in the layer's own
// space, which after the flip sits FLIPK * CEN heights below the feet: the zoom streak then holds and fades out
// before the shadow's far end.
var FLIPK = args.flipK === undefined ? 1.55 : args.flipK;   // 0 = the old upright copy
var CEN = args.centreAbove || (FLIPK ? 1.875 : 3);   // centre height above the feet, as a share of the object's own height
// Run: with the recipe's Amount 95 every streak ran to the bottom of the frame (a zoom streak reaches about
// 1 / (1 - Amount) times the centre's distance), and a centre close enough to stop it fanned the crowns into a haze over
// the whole hill. The shadow itself is this tip's starting point, not its technique (the technique is Grow Bounds), so
// it is tuned to the layout instead: centre 3 object heights above the feet (a narrow band); Amount 25 stopped the
// streak at the feet, 70 ends it about one object height below them (65 to about 73 % down, as the layout says).
// Opacity 100 % (brief: 55 to 70 %): a thin streak is already light, and at 70 % it read barely darker than the hill.
var AMT = args.amount || 95;      // Polish: back to the recipe's 95 (lesson 12)
var GAUSS = (args.gauss || 5) * GS;         // comp px (recipe 71.2 was on a layer of unknown scale; the plain build had 18 comp px)
var GROW = args.grow || 2050;          // recipe's Pixels (source px)
var OPAC = args.shadowOpacity || 65;   // polish: 65 with the laid-down copy (brief 55-70 %)
var INK = ART.hex("#1F3324");

// The matte for the shadows: a duplicate of the hill, its video off.
var hm = hill.duplicate();
hm.name = "hill matte";

// Run: on the footage layers themselves (sources 2281 to 2626 px tall at 3.3 to 4.3 %) CC Radial Fast Blur barely
// streaked at all, whatever the centre (the shadow was the blurred silhouette only). Each cut-out now sits in its own
// tight precomp at display size ("15 obj <name>", the box hugs the object, as the brief wants for the clip), and the
// object and its shadow copy are that precomp layer at 100 %: the effects then work in comp pixels, as in the plain build.
var objs = [], shadows = [], inners = [], k, o, L, s, gb;
for (k = 0; k < OBJ.length; k++) {
  o = OBJ[k];
  var ft = ART.footage(ARTDIR, o.file, FOLDER);
  var os = o.s * GS;
  var pw = Math.ceil(ft.width * os / 100) + 2, ph = Math.ceil(ft.height * os / 100) + 2;
  var pc = app.project.items.addComp("15 obj " + o.name, pw, ph, 1, DUR, FPS);
  pc.parentFolder = ART.folder(FOLDER);
  var inn = pc.layers.add(ft);
  P.tf(inn, "ADBE Scale").setValue([os, os]);
  P.tf(inn, "ADBE Position").setValue([pw / 2, ph / 2]);
  inners.push(inn);
  L = c.layers.add(pc);
  L.name = o.name;
  // anchor at the feet, in the precomp's pixels
  var ax = pw / 2 + (o.a[0] - ft.width / 2) * os / 100, ay = ph / 2 + (o.a[1] - ft.height / 2) * os / 100;
  P.tf(L, "ADBE Anchor Point").setValue([ax, ay]);
  P.tf(L, "ADBE Position").setValue(gp(o.p));
  o.ax = ax; o.ay = ay; o.hpx = ph;
  objs.push(L);
}
for (k = 0; k < OBJ.length; k++) {
  o = OBJ[k]; L = objs[k];
  s = L.duplicate();
  s.name = o.name + " shadow";
  s.moveAfter(objs[0]);            // all three shadow copies sit under the three objects, above the hill
  // Step 1: Fill, CC Radial Fast Blur, Gaussian Blur.
  P.effect(s, "ADBE Fill");
  fx(s, "Fill").property("Color").setValue(INK.concat([1]));
  P.effect(s, "CC Radial Fast Blur");
  fx(s, "CC Radial Fast Blur").property("Center").setValue([o.ax, o.ay - CEN * o.hpx]);
  fx(s, "CC Radial Fast Blur").property("Amount").setValue(AMT);
  fx(s, "CC Radial Fast Blur").property("Zoom").setValue(1);
  P.effect(s, "ADBE Gaussian Blur 2");
  fx(s, "Gaussian Blur").property("Blurriness").setValue(GAUSS);
  fx(s, "Gaussian Blur").property("Blur Dimensions").setValue(1);
  fx(s, "Gaussian Blur").property("Repeat Edge Pixels").setValue(1);
  P.tf(s, "ADBE Opacity").setValue(OPAC);
  if (FLIPK) P.tf(s, "ADBE Scale").setValue([100, -100 * FLIPK]);
  // Steps 2-3: Grow Bounds at the top of the stack.
  gb = P.effect(s, "Grow Bounds"); // run: the match name "ADBE Grow Bounds" is refused; the display name adds it
  gb.name = "TECH Grow Bounds";
  fx(s, "TECH Grow Bounds").moveTo(1);
  fx(s, "TECH Grow Bounds").property("Pixels").setValue(GROW);
  fx(s, "TECH Grow Bounds").enabled = !BEFORE;
  // Keep the shadow on the ground (brief).
  s.setTrackMatte(hm, TrackMatteType.ALPHA);
  if (args.noShadow) s.enabled = false;   // measurement baseline only
  shadows.push(s);
}
// Fringe trim on the objects themselves (after duplicating, so the shadows keep the full silhouette).
for (k = 0; k < inners.length; k++) choke(inners[k], CHOKE); // on the footage inside each precomp (source px)
hm.enabled = false;

var near = put("hills-near.png", "hills near", 71.43, [960, 669]);
near.moveToBeginning();

// Slow push for the movie.
var push = c.layers.addNull(DUR);
push.name = "push null"; push.source.name = "15 push null";
P.tf(push, "ADBE Position").setValue([960, 0.64 * H]);
var pl;
for (pl = 1; pl <= c.numLayers; pl++) if (c.layer(pl) !== push && !c.layer(pl).parent) c.layer(pl).parent = push;
var ps = P.tf(push, "ADBE Scale");
ps.setValueAtTime(0, [100, 100]); ps.setValueAtTime(DUR, [args.push || 103, args.push || 103]);

var order = [], i;
for (i = 1; i <= shadows[0].property("ADBE Effect Parade").numProperties; i++) order.push(shadows[0].property("ADBE Effect Parade").property(i).name);
var names = [];
for (i = 1; i <= c.numLayers; i++) names.push(c.layer(i).name);
return { comp: c.name, layers: names.join(" | "), before: BEFORE, shadowStack: order.join(" > ") };

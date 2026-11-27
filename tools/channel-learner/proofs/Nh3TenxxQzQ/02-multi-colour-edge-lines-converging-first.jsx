// Technique 2: three coloured CC Light Sweep edge lines that spin in and meet at one angle.
// Lumenfold lockup (mark + name) in a precomp; Fill black on the precomp layer so only the edges show;
// three CC Light Sweep copies (white, violet, orange), Sweep Intensity 0, Direction keyed 2 turns to 720.
//
// VERIFY: effect display name "CC Light Sweep" works with addProperty (match name may be "CC Light Sweep" or "ADBE CC Light Sweep")
// VERIFY: effect display name "Fill" works with addProperty (match name ADBE Fill)
// VERIFY: property display names "Center", "Direction", "Shape", "Width", "Sweep Intensity", "Edge Intensity", "Edge Thickness", "Light Color", "Light Reception"
// VERIFY: Shape menu index: 1 Linear, 2 Smooth, 3 Sharp
// VERIFY: Light Reception menu index: 1 Add, 2 Composite, 3 Cutout
// VERIFY: Fill's colour property is named "Color"
// VERIFY: new effects added by script are appended below earlier ones (Fill must be applied first, i.e. on top of the stack)
// VERIFY: effect.name assignment accepted for "TECH CC Light Sweep n"
// VERIFY: app.fonts.getFontsByPostScriptName exists and returns Font objects with isSubstitute
// VERIFY: layer.blendingMode = BlendingMode.ADD on the precomp layer hides the Fill's black body over the backdrop
// VERIFY: setTemporalEaseAtKey accepts one KeyframeEase for the one-dimensional Direction property
// VERIFY: text bounds from sourceRectAtTime(0,false) are the ink-ish box used to size the name to 1.1x the mark width
$.evalFile(args.prelude);

var artDir = args.artDir || args.art;
if (!artDir) throw new Error("args.artDir (folder holding mark.png and backdrop.png) is required");
var artFolder = null;
(function () {
  var j;
  for (j = 1; j <= app.project.numItems; j++) {
    if (app.project.item(j) instanceof FolderItem && app.project.item(j).name === "art 02") artFolder = app.project.item(j);
  }
  if (!artFolder) artFolder = app.project.items.addFolder("art 02");
})();
function importArt(name) {
  var i, it;
  for (i = 1; i <= app.project.numItems; i++) {
    it = app.project.item(i);
    if (it instanceof FootageItem && it.name === name && it.parentFolder === artFolder) return it;
  }
  var f = new File(artDir + "/" + name);
  if (!f.exists) throw new Error("missing art: " + f.fsName);
  it = app.project.importFile(new ImportOptions(f));
  it.parentFolder = artFolder;
  return it;
}

var W = 1080, H = 1920, DUR = 6;
var c = P.freshComp("02 multi-colour edge lines", W, H, 24, DUR, [0.02, 0.03, 0.06]);
var lk = P.freshComp("02 lockup", W, H, 24, DUR, [0, 0, 0]);

// ---- lockup precomp: mark on top, name below, both white ----
var tutLogoH = 530;                       // tutorial logo height in its 1080p frame (recipe layout: ~265 px on the 540 px picture)
var lockW = 0.49 * W;                     // lockup width share: tutorial logo's 49 % of frame height, applied to our width
var markW = lockW / 1.1;                  // name is about 1.1 x the mark's width
var markS = markW / 682;
var markH = 762 * markS;
var K = markH / tutLogoH;                 // scale for the recipe's pixel values

var mark = lk.layers.add(importArt("mark.png"));
mark.name = "mark";
P.tf(mark, "ADBE Scale").setValue([markS * 100, markS * 100]);

var fonts = app.fonts.getFontsByPostScriptName("Montserrat-SemiBold");
var fontName = "Montserrat-SemiBold";
if (!fonts || fonts.length === 0 || fonts[0].isSubstitute) {
  fontName = "Montserrat-ExtraBold"; // ASSUMED: lead notes' fallback when SemiBold cannot be set
}
var nm = P.text(lk, "Lumenfold", { size: 100, font: fontName, tracking: 40, name: "name" });
var r = nm.sourceRectAtTime(0, false);
var ts = (lockW / r.width) * 100;        // percent scale so the name is lockW wide
P.tf(nm, "ADBE Scale").setValue([ts, ts]);
var nameH = r.height * ts / 100;

var cx = W / 2, cy = 0.46 * H;            // lockup centre, 46 % down
var gap = 0.18 * markH;
var total = markH + gap + nameH;
var top = cy - total / 2;
P.tf(mark, "ADBE Position").setValue([cx, top + markH / 2]);
P.tf(nm, "ADBE Position").setValue([cx, top + markH + gap + nameH / 2]);

// ---- main comp: backdrop, then the lockup layer carrying the effects ----
var bd = c.layers.add(importArt("backdrop.png"));
bd.name = "backdrop";
var L = c.layers.add(lk);
L.name = "lockup edges";
L.blendingMode = BlendingMode.ADD; // recipe: effect layer on Add so the black body drops out over the ground

// Fill (black) first so it is applied before the sweeps; it makes the body invisible
var fill = P.effect(L, "Fill");
fill.property("Color").setValue([0, 0, 0]);

var cols = [[1, 1, 1], [204 / 255, 0, 1], [252 / 255, 160 / 255, 0]];  // white, CC00FF, orange (swatch 252,160,0)
var dirs = [14, 251, 118];
var t1 = 5 + 2 / 30;                      // 5 s 2 frames at the tutorial's 30 fps
var i, e, p, k, ease;
for (i = 0; i < 3; i++) {
  e = P.effect(L, "CC Light Sweep");
  e.name = "TECH CC Light Sweep " + (i + 1);
  e.property("Center").setValue([cx, cy]);       // lockup centre
  e.property("Direction").setValue(dirs[i]);
  e.property("Shape").setValue(3);                // Sharp
  e.property("Width").setValue(79 * K);
  e.property("Sweep Intensity").setValue(0);
  e.property("Edge Intensity").setValue(90);
  e.property("Edge Thickness").setValue(4 * K);
  e.property("Light Color").setValue(cols[i]);
  e.property("Light Reception").setValue(1);      // Add
  p = e.property("Direction");
  p.setValueAtTime(0, dirs[i]);
  p.setValueAtTime(t1, 720);                      // 2 turns, 0 degrees; accumulates turns
  ease = new KeyframeEase(0, 33.33);              // Easy Ease (F9)
  for (k = 1; k <= 2; k++) p.setTemporalEaseAtKey(k, [ease], [ease]);
  if (args.reshaped) {
    // ASSUMED: the recipe's speed-graph reshape (never previewed): start influence ~16 %, end influence ~30 %
    p.setTemporalEaseAtKey(1, [new KeyframeEase(0, 33.33)], [new KeyframeEase(0, 16)]);
    p.setTemporalEaseAtKey(2, [new KeyframeEase(0, 30)], [new KeyframeEase(0, 33.33)]);
  }
}
return { comp: c.name, id: c.id, layers: c.numLayers, markH: markH, scaleK: K, font: fontName };

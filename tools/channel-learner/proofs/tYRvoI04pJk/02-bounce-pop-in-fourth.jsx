// Technique 02: overshoot-bounce pop-in for an icon (expression on Scale) + letter-by-letter text rise (animator with Expression Selector).
// VERIFY:
// VERIFY: match names "ADBE Text Animators", "ADBE Text Animator", "ADBE Text Animator Properties", "ADBE Text Position 3D", "ADBE Text Opacity"
// VERIFY: match names "ADBE Text Selectors", "ADBE Text Expressible Selector", "ADBE Text Expressible Amount"
// VERIFY: the Expression Selector's Based On (Characters) is the default; no scripting of it attempted
// VERIFY: Position 3D animator property takes a 3-value array [0,50,0]
// VERIFY: "ADBE Vector Shape - Rect", "ADBE Vector Rect Size", "ADBE Vector Rect Roundness", "ADBE Vector Graphic - Fill", "ADBE Vector Fill Color"
// VERIFY: setting layer.parent after creating leaves local Position values unchanged (positions set after parenting, as offsets from the button centre)
// VERIFY: velocityAtTime on a 3-value Scale returns an array and value+v*... works in expression
// VERIFY: expression time vs layer in-point: animator expression uses time - thisLayer.inPoint
// VERIFY: comp.motionBlur and layer.motionBlur property names; P.text with font Poppins-Medium may be missing (falls back)
$.evalFile(args.prelude);
var FPS = 25;
var c = P.freshComp("02 bounce pop-in", 1080, 1920, FPS, 4, [0, 0, 0]);

// --- Art (brief.md): backdrop and icon imported into project folder "art 02" ---
var ARTDIR = args.art || "~/Assets/comp-room-studies/channel-study/tYRvoI04pJk/proof/02/art/";
var artFolder = null, fi, imp = {};
for (fi = app.project.numItems; fi >= 1; fi--) { if (app.project.item(fi) instanceof FolderItem && app.project.item(fi).name === "art 02") artFolder = app.project.item(fi); }
if (!artFolder) artFolder = app.project.items.addFolder("art 02");
var names = ["backdrop.png", "icon-upload.png"], ni, it2;
for (ni = 0; ni < names.length; ni++) {
  for (fi = artFolder.numItems; fi >= 1; fi--) { if (artFolder.item(fi).name === names[ni]) imp[names[ni]] = artFolder.item(fi); }
  if (!imp[names[ni]]) {
    it2 = app.project.importFile(new ImportOptions(new File(ARTDIR + names[ni])));
    it2.parentFolder = artFolder;
    imp[names[ni]] = it2;
  }
}
var bd = c.layers.add(imp["backdrop.png"]);
bd.name = "Backdrop";

// --- Button (stand-in for the earlier button technique): red rounded rect, flies up into place.
var btn = P.shape(c, "button");
var bc = P.contents(btn);
var rc = bc.addProperty("ADBE Vector Shape - Rect");
rc.property("ADBE Vector Rect Size").setValue([920, 372]);
rc.property("ADBE Vector Rect Roundness").setValue(186);
var fl = P.contents(btn).addProperty("ADBE Vector Graphic - Fill");
P.contents(btn).property(fl.propertyIndex).property("ADBE Vector Fill Color").setValue([0.9, 0.12, 0.15, 1]);
var bpos = P.tf(btn.layer, "ADBE Position");
bpos.setValueAtTime(0, [540, 1500]);
bpos.setValueAtTime(11 / FPS, [540, 960]);
var bsc = P.tf(btn.layer, "ADBE Scale");
bsc.setValueAtTime(0, [70, 70, 100]);
bsc.setValueAtTime(11 / FPS, [100, 100, 100]);
var brot = P.tf(btn.layer, "ADBE Rotate Z");
brot.setValueAtTime(0, -8);
brot.setValueAtTime(11 / FPS, 0);
btn.layer.motionBlur = true;

// RUN THIRD: layout per recipe layout line (button 527x213 -> 920x372; icon 14 % of button width = 129 px glyph = scale 37 % of the 512 file; word 41.6 % = ~383 px; word ink height ~120 px).
// --- Icon: art PNG icon-upload.png (white, 512 px), Scale keys 0 -> 42 % (glyph ~146 px).
var ic = c.layers.add(imp["icon-upload.png"]);
ic.name = "Icon";
ic.parent = btn.layer;
P.tf(ic, "ADBE Rotate Z").setValue(0); // VERIFIED: layer.parent keeps the world transform, so the button's -8 deg at time 0 leaks into the child as +8; reset it
P.tf(ic, "ADBE Position").setValue([-230, 0]); // group (glyph + gap + word) centred in the button
var isc = P.tf(ic, "ADBE Scale");
isc.setValueAtTime(11 / FPS, [0, 0, 0]);
isc.setValueAtTime(13 / FPS, [37, 37, 37]); // RUN FOURTH: 2-frame growth (review: take grows in ~2 frames)
// Bounce (inertial overshoot). Recipe: amp 0.04, freq 1.8 shown; decay 3, time_max 3 from the pinned comment.
// SUBSTITUTE: the author's one-click Bounce button in a script panel; the expression text is written in directly.
isc.expression =
  "amp = 0.025;\n" +
  "freq = 1.8;\n" +
  "decay = 3;\n" +
  "time_max = 3;\n" +
  "n = 0;\n" +
  "if (numKeys > 0) {\n" +
  "  n = nearestKey(time).index;\n" +
  "  if (key(n).time > time) n--;\n" +
  "}\n" +
  "if (n == 0) { t = 0; } else { t = time - key(n).time; }\n" +
  "if (n > 0 && t < time_max) {\n" +
  "  v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);\n" +
  "  value + v * amp * Math.sin(t * freq * Math.PI * 2) / Math.exp(decay * t);\n" +
  "} else {\n" +
  "  value;\n" +
  "}";
ic.motionBlur = true;

// --- Text "Upload" with an animator: Position 0,50 + Opacity 0 %, Expression Selector.
var tl = P.text(c, "Upload", { size: 118, font: args.font || "HelveticaNeue-Medium", name: "label" });
tl.parent = btn.layer;
P.tf(tl, "ADBE Rotate Z").setValue(0);
P.tf(tl, "ADBE Scale").setValue([100, 100, 100]); // same parenting leak: button scale 70 % at time 0 had made it 142.9 %
P.tf(tl, "ADBE Position").setValue([108, 0]);
tl.inPoint = 6 / FPS; // recipe: trimmed to about frame 6 (animator starts at layer start)
var tg = tl.property("ADBE Text Properties");
var an = tg.property("ADBE Text Animators").addProperty("ADBE Text Animator");
an = tl.property("ADBE Text Properties").property("ADBE Text Animators").property(an.propertyIndex);
an.property("ADBE Text Animator Properties").addProperty("ADBE Text Position 3D");
an.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity");
an.property("ADBE Text Animator Properties").property("ADBE Text Position 3D").setValue([0, 50, 0]);
an.property("ADBE Text Animator Properties").property("ADBE Text Opacity").setValue(0);
an.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
var amt = an.property("ADBE Text Selectors").property("ADBE Text Expressible Selector").property("ADBE Text Expressible Amount");
// SUBSTITUTE: the author's one-click per-character text-bounce preset; exact expression unknown.
// ASSUMED: delay 0.08 s per letter, rise 0.25 s (comment says 0.12 s), eased; amount 100 = fully displaced/hidden.
amt.expression =
  "delay = 0.08;\n" +
  "dur = 0.25;\n" +
  "t = time - thisLayer.inPoint - (textIndex - 1) * delay;\n" +
  "100 * (1 - ease(t, 0, dur, 0, 1));";
tl.motionBlur = true;

c.motionBlur = true;
c.shutterAngle = 180;
c.openInViewer();
return { comp: c.name, id: c.id, layers: c.numLayers };

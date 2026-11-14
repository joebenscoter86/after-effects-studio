// Technique 11: soft embossed finish for a white shape on a pale background.
// A white disc on a near-white cool grey background, with a small dark two-line title. A copy of the disc on top,
// "TECH disc finish", carries the finish: a gentle grey-blue linear gradient (#F1F5F7 to #DAE1E7 at 40 degrees)
// and a Bevel and Emboss layer style (Inner Bevel, Smooth, Size 5, both modes Screen, both colours white, 100 %).
// Switch-off for a "before" frame: disable layer "TECH disc finish" (the plain white disc underneath stays).
//
// SUBSTITUTE: the Gradient Overlay layer style's "Colors" cannot be set by script (recipe build notes). By default the
// gradient is built as a Gradient Ramp effect ("TECH gradient overlay substitute") on the finish layer instead, with the
// recipe's two colours, angle 40 degrees and Align with Layer (the ramp spans the disc's bounds along that angle).
// Pass args.realGradientOverlay = true to also add the real Gradient Overlay style with its settable values; its
// colours must then be set by hand in the Gradient Editor, and the substitute ramp is switched off.
//
// VERIFY: app.findMenuCommandId("Bevel and Emboss") and ("Gradient Overlay") return non-zero in the installed language, and app.executeCommand adds the style to the selected layer of the comp opened with openInViewer().
// VERIFY: layer style groups and properties are reachable by display name: "Layer Styles" > "Bevel and Emboss" > "Style", "Technique", "Depth", "Direction", "Size", "Soften", "Use Global Light", "Angle", "Altitude", "Highlight Mode", "Highlight Color", "Highlight Opacity", "Shadow Mode", "Shadow Color", "Shadow Opacity".
// VERIFY: Bevel Style popup 2 = Inner Bevel (1 Outer Bevel); Technique 1 = Smooth; Direction 1 = Up.
// VERIFY: Shadow Mode is set to Screen by copying the value of Highlight Mode, which is Screen by default (avoids guessing the blend-mode index); result.readBack shows both.
// VERIFY: Highlight/Shadow Opacity and Depth take 0-100 values; colours take [r, g, b, a].
// VERIFY: Gradient Ramp ("ADBE Ramp") keeps the shape layer's alpha (it should, as on text layers), and "Ramp Shape" 1 = Linear.
// VERIFY: Ramp points set by the expression fromComp([x, y]) land where intended on a shape layer.
// VERIFY: the layer style angle convention: 40 degrees counter-clockwise from the right, stop 0 at the tail, stop 99.8 % at the head of that direction (so light lower left, darker upper right). If the reference is lighter at the top, pass args.reverse = true.
// VERIFY (only with args.realGradientOverlay): Gradient Overlay "Blend Mode", "Opacity", "Gradient Smoothness", "Angle", "Style" (1 Linear), "Reverse", "Align with Layer", "Scale", "Offset".
$.evalFile(args.prelude);
args = args || {};

function fill(sh, color) {
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  var idx = f.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Fill Color").setValue(color);
  return idx;
}
function hex(h) {
  return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
}
function selectOnly(comp, layer) {
  var i;
  for (i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
  layer.selected = true;
}
function runMenu(name) {
  var id = app.findMenuCommandId(name);
  if (!id) throw new Error("menu command not found: " + name);
  app.executeCommand(id);
}
function style(layer, styleName) {
  var g = layer.property("Layer Styles") || layer.property("ADBE Layer Styles");
  if (!g) throw new Error("no Layer Styles group on " + layer.name);
  var s = g.property(styleName);
  if (!s) throw new Error("layer style not found after menu command: " + styleName);
  return s;
}
function sp(layer, styleName, prop) {
  var p = style(layer, styleName).property(prop);
  if (!p) throw new Error("layer style property not found: " + styleName + " > " + prop);
  return p;
}

// ASSUMED: background #EDF1F4 (near-white, cool grey); disc pure white, 600 px; the recipe gives neither value.
var c = P.freshComp("11 white on light finish", 1920, 1080, 24, 4, [0.93, 0.945, 0.957]);
var bg = P.solid(c, "background", hex("EDF1F4"));

var D = args.diameter || 600;
var C = [960, 540];
var disc = P.shape(c, "disc");
P.ellipse(disc, [D, D]);
fill(disc, [1, 1, 1, 1]);
P.tf(disc.layer, "ADBE Position").setValue(C);

// The finish lives on a copy on top, so switching that copy off shows the plain disc.
var fin = disc.layer.duplicate();
fin.name = "TECH disc finish";
fin.moveBefore(disc.layer);

// Small dark two-line title on top (unstyled).
// ASSUMED: font left to the default unless args.font is given.
var title = P.text(c, "Soft\rfinish", { size: 64, color: [0.16, 0.19, 0.24], font: args.font, name: "title" });
title.moveToBeginning();

// Steps 1-2 (substitute): gradient #F1F5F7 at stop 0 to #DAE1E7 at stop 99.8 %, angle 40 degrees, aligned to the layer.
var ang = 40 * Math.PI / 180;
var dir = [Math.cos(ang), -Math.sin(ang)]; // comp y runs down
var L = D * (Math.abs(Math.cos(ang)) + Math.abs(Math.sin(ang))); // ASSUMED: Align with Layer spans the bounds along the angle
var sgn = args.reverse ? -1 : 1;
var p0 = [C[0] - sgn * dir[0] * L / 2, C[1] - sgn * dir[1] * L / 2];
var p1 = [C[0] + sgn * dir[0] * L / 2 * 0.998, C[1] + sgn * dir[1] * L / 2 * 0.998];
var ramp = P.effect(fin, "ADBE Ramp");
ramp.name = "TECH gradient overlay substitute";
ramp = fin.property("ADBE Effect Parade").property("TECH gradient overlay substitute");
ramp.property("Ramp Shape").setValue(1);
ramp.property("Start Color").setValue(hex("F1F5F7"));
ramp.property("End Color").setValue(hex("DAE1E7"));
ramp.property("Start of Ramp").expression = "fromComp([" + p0[0] + ", " + p0[1] + "])";
ramp.property("End of Ramp").expression = "fromComp([" + p1[0] + ", " + p1[1] + "])";

// Layer styles need the comp open and the layer selected.
c.openInViewer();

if (args.realGradientOverlay) {
  selectOnly(c, fin);
  runMenu("Gradient Overlay");
  sp(fin, "Gradient Overlay", "Opacity").setValue(100);
  sp(fin, "Gradient Overlay", "Gradient Smoothness").setValue(100);
  sp(fin, "Gradient Overlay", "Angle").setValue(40);
  sp(fin, "Gradient Overlay", "Style").setValue(1);
  sp(fin, "Gradient Overlay", "Reverse").setValue(0);
  sp(fin, "Gradient Overlay", "Align with Layer").setValue(1);
  sp(fin, "Gradient Overlay", "Scale").setValue(100);
  sp(fin, "Gradient Overlay", "Offset").setValue([0, 0]);
  // Colors (#F1F5F7 at 0 %, #DAE1E7 at 99.8 %) by hand in the Gradient Editor.
  fin.property("ADBE Effect Parade").property("TECH gradient overlay substitute").enabled = false;
}

// Step 3: Bevel and Emboss.
selectOnly(c, fin);
runMenu("Bevel and Emboss");
var B = "Bevel and Emboss";
sp(fin, B, "Style").setValue(2); // Inner Bevel
sp(fin, B, "Technique").setValue(1); // Smooth
sp(fin, B, "Depth").setValue(100);
sp(fin, B, "Direction").setValue(1); // Up
sp(fin, B, "Size").setValue(5);
sp(fin, B, "Soften").setValue(0);
sp(fin, B, "Use Global Light").setValue(0);
sp(fin, B, "Angle").setValue(120);
sp(fin, B, "Altitude").setValue(30);
sp(fin, B, "Highlight Color").setValue([1, 1, 1, 1]);
sp(fin, B, "Highlight Opacity").setValue(100);
// The recipe's key point: the shadow becomes white in Screen mode, at 100 %.
sp(fin, B, "Shadow Mode").setValue(sp(fin, B, "Highlight Mode").value);
sp(fin, B, "Shadow Color").setValue([1, 1, 1, 1]);
sp(fin, B, "Shadow Opacity").setValue(100);

return {
  comp: c.name,
  layers: c.numLayers,
  switchOff: "layer TECH disc finish",
  gradient: args.realGradientOverlay ? "real Gradient Overlay (set colours by hand)" : "Gradient Ramp substitute",
  readBack: {
    style: sp(fin, B, "Style").value,
    technique: sp(fin, B, "Technique").value,
    highlightMode: sp(fin, B, "Highlight Mode").value,
    shadowMode: sp(fin, B, "Shadow Mode").value,
    shadowOpacity: sp(fin, B, "Shadow Opacity").value
  }
};

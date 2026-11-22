// Technique 06: a faint graph-paper backdrop (recipe 06-faint-graph-paper-backdrop).
// Builds on 01-05. The scene's content (bar, labels now #253814, photos precomp, arrows) lives in "nHh0 06 content",
// lifted 60 x SCALE px to centre the group. Below it a comp-size solid "TECH Grid" with Grid (Corner Point, cell 17 x 14
// recipe px, Border 2, colour #C0DEF8, Blending Mode None), then "Background" #F3F3F3. Above everything, 05's two adjustment
// layers. SUBSTITUTE: Pre-compose of the content layers is built directly inside the content precomp.
// Before frame: switch off "TECH Grid" (the grid layer). The finish layers from 05 are TECH too; leave them on for 06's before.
// args: prelude, lib; optional artDir, artLib, artFolder, labels, scale, centre, segColors, labelColor, labelFaces, labelSize, stepHeights, ground.
//
// VERIFY: match name "ADBE Grid"; display names "Anchor", "Size From", "Corner", "Border", "Invert Grid", "Color", "Opacity", "Blending Mode"
// VERIFY: Grid "Size From" 1 = Corner Point (menu order Corner Point, Width Slider, Width & Height Sliders)
// VERIFY: Grid "Blending Mode" 1 = None (lines only, the rest of the layer transparent)
// VERIFY: Grid "Opacity" takes percent (100)
// VERIFY: Grid's point controls on a comp-size solid read comp pixels
$.evalFile(args.prelude);
$.evalFile(args.lib);
NH.init(args, "06");
var PAPER = { ground: "#F3F3F3", grid: "#C0DEF8", corner: [977, 554], border: 2, lift: 60, label: "#253814" };
var c = NH.scene("06", "graph paper", 144, PAPER.ground); // ASSUMED: 6 s, as 05
var cc = NH.freshComp("nHh0 06 content", NH.FRAMES, [0, 0, 0]);
var r = NH.content(cc, { rise: true, pop: true, arrows: true, photoComp: true, labelColor: args.labelColor || PAPER.label }); // the brief's ink colour when passed
var cl = c.layers.add(cc);
cl.name = "Content";
// ASSUMED: the lift ("about 60 px", inferred from the picture), scaled.
P.tf(cl, "ADBE Position").setValue(NH.vec([c.width / 2, c.height / 2 - NH.len(PAPER.lift)], NH.dims(P.tf(cl, "ADBE Position"))));
var gl = P.solid(c, "TECH Grid", [1, 1, 1], c.width, c.height); // its own colour does not show with Blending Mode None
gl.name = "TECH Grid";
gl.moveAfter(cl);
var g = NH.effect(gl, "ADBE Grid", "TECH Grid");
NH.setFx(g, { "Anchor": NH.pt([960, 540]), "Size From": 1 });
g = gl.property("ADBE Effect Parade").property("TECH Grid");
// ASSUMED: Feather left at its default (the recipe never opens it).
NH.setFx(g, { "Corner": NH.pt(PAPER.corner), "Border": NH.len(PAPER.border), "Invert Grid": 0, "Color": NH.hex(PAPER.grid), "Opacity": 100, "Blending Mode": 1 });
g = gl.property("ADBE Effect Parade").property("TECH Grid");
if (NH.artDir) NH.dress(c, { paper: true, lift: 40, above: gl }); // art brief: ink type, kicker and headline up 40 px, above the grid
var f = NH.finish(c);
return NH.report(c, {
  contentComp: cc.name + ": " + NH.stack(cc),
  grid: "Size From " + NH.fxProp(g, "Size From").value + ", Blending Mode " + NH.fxProp(g, "Blending Mode").value +
    ", Anchor " + NH.fxProp(g, "Anchor").value.join(",") + ", Corner " + NH.fxProp(g, "Corner").value.join(",") + ", Border " + NH.fxProp(g, "Border").value,
  wiggleAmp: f.amp
});

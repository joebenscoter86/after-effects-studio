// Probe: one CC Particle World cell per Particle Type index (args.from .. args.to) in a 5 x 3 grid, leaf texture,
// to find Textured QuadPolygon. Comp "il_O probe types"; delete it after looking (args.remove).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.scene);
var c = HW.comp("il_O probe types", 2);
if (args.remove) { c.remove(); var k, it; for (k = app.project.numItems; k >= 1; k--) { it = app.project.item(k); if (it instanceof FootageItem && it.name === "il_O probe cell" && it.usedIn.length === 0) it.remove(); } return "removed"; }
var leaf = c.layers.add(ART.footage(HW.ART + "/cut", "leaf.png", "art il_O 08"));
leaf.name = "Leaf";
var n, s, pw, i = 0;
for (n = args.from; n <= args.to; n++) {
  s = HW.solid(c, "il_O probe cell", [0, 0, 0], "type " + n);
  P.tf(s, "ADBE Scale").setValue([20, 20]);
  P.tf(s, "ADBE Position").setValue([192 + (i % 5) * 384, 180 + Math.floor(i / 5) * 360]);
  P.effect(s, "CC Particle World");
  pw = s.property("ADBE Effect Parade").property(1);
  pw.property("CC Particle World-0004").setValue(20);
  pw.property("CC Particle World-0015").setValue(5);
  pw.property("CC Particle World-0018").setValue(0);
  pw.property("CC Particle World-0023").setValue(n);
  pw.property("CC Particle World-0045").setValue(c.layer("Leaf").index);
  pw.property("CC Particle World-0024").setValue(1.0);
  pw.property("CC Particle World-0025").setValue(1.0);
  i++;
}
c.layer("Leaf").enabled = false;
return { comp: c.name, cells: i };

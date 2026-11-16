// Technique 05: two stacked Drop Shadows seat the cut-out wheel (the 03 scene, art in PROOF/03/art).
// args: prelude, artLib, helm, artDir, cards (default true).
// Values from the 05 art brief: the recipe's 37/262/1051 scaled by 0.37/0.334 for the wheel at 33.4 %.
// Effects are named "TECH Drop Shadow" and "TECH Drop Shadow 2" so the runner can switch them off for before.png.
// Checked on the run: Softness takes 1164 (max 30000). Drop Shadow Opacity is 0-255 by script (default reads 127.5 = 50 %), so 50 % is 127.5.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.helm);
var r = HELM.build("05 soft-doubled-drop-shadow", 6, args.artDir);
var vals = [
  { "Shadow Color": [0, 0, 0], "Opacity": 127.5, "Direction": 135, "Distance": 41, "Softness": 290 },
  { "Shadow Color": [0, 0, 0], "Opacity": 127.5, "Direction": 135, "Distance": 41, "Softness": 1164 }
];
var names = ["TECH Drop Shadow", "TECH Drop Shadow 2"];
var back = [], i, fx, miss;
// Art fix, not the technique: the PNG's pale edge fringe shows as a light outline against the halo; choke it ~1 comp px first.
var ch = P.effect(r.wheel, "ADBE Simple Choker");
var mc = ART.setFx(ch, { "Choke Matte": args.choke !== undefined ? args.choke : 4 });
if (mc.length) throw new Error("choker params: " + mc.join(", "));
ch.name = "Art edge choke";
for (i = 0; i < 2; i++) {
  fx = P.effect(r.wheel, "ADBE Drop Shadow");
  miss = ART.setFx(fx, vals[i]);
  if (miss.length) throw new Error("drop shadow params: " + miss.join(", "));
  fx.name = names[i];
}
for (i = 2; i <= 3; i++) {
  fx = r.wheel.property("ADBE Effect Parade").property(i);
  back.push(fx.name + ": dist " + fx.property("Distance").value + ", soft " + fx.property("Softness").value + ", op " + fx.property("Opacity").value + ", dir " + fx.property("Direction").value);
}
if (args.cards === false) {
  for (i = 0; i < r.cards.length; i++) {
    var ks = ["backing", "photo", "tab", "rule", "name", "role"], k;
    for (k = 0; k < ks.length; k++) r.cards[i][ks[k]].enabled = false;
  }
}
return { comp: r.comp.name, id: r.comp.id, layers: r.comp.numLayers, readBack: back.join(" | "), fontSubs: HELM.subs.join(" | ") };

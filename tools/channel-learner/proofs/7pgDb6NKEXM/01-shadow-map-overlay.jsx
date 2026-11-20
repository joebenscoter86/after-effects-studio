// Technique 01: window-light shadow map over a flat layout.
// args: prelude, artLib (art.jsx), card (shadow-card.jsx), artDir (PROOF/01/art).
// VERIFY: Fill "Opacity" takes 0..1 (shown as 100 %); if it reads 1 %, set 100.
// VERIFY: band edges land where the recipe's layout line measures them (render and measure).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.card);
var card = SC.card("01 card", 4, args.artDir, 0);
card.parentFolder = ART.folder("art 01");
var c = P.freshComp("01 shadow-map-overlay", 1920, 1080, 23.976, 4, [0.98, 0.976, 0.96]);
var cl = c.layers.add(card);
cl.name = "Card";
var s = SC.shadow(c, "TECH shadow map");
return { comp: c.name, id: c.id, layers: c.numLayers, masks: s.property("ADBE Mask Parade").numProperties, fontSubs: SC.subs.join(" | ") };

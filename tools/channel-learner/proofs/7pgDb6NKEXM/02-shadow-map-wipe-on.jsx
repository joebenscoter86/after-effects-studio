// Technique 02: soft diagonal Linear Wipe that brings the 01 shadow map on.
// args: prelude, artLib, card, artDir (PROOF/01/art; 02 reuses 01's art).
// VERIFY: Linear Wipe direction at -49 deg: at 50 % the shadow must remain lower left; else use 131.
// VERIFY: text selector "ADBE Text Percent Start" animates the left-to-right letter fade.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.card);
// ASSUMED: title letters fade over the first 0.6 s (recipe: last letter still missing at 5 frames; brief: about a second).
var card = SC.card("02 card", 4, args.artDir, 0.6);
card.parentFolder = ART.folder("art 01");
var c = P.freshComp("02 shadow-map-wipe-on", 1920, 1080, 23.976, 4, [0.98, 0.976, 0.96]);
c.layers.add(card).name = "Card";
var s = SC.shadow(c, "TECH shadow map");
var w = P.effect(s, "ADBE Linear Wipe");
var miss = ART.setFx(w, { "Wipe Angle": args.angle !== undefined ? args.angle : -49, "Feather": 139 });
if (miss.length) throw new Error("Linear Wipe params not found: " + miss.join(", "));
var tc = null, j;
for (j = 1; j <= w.numProperties; j++) if (w.property(j).name === "Transition Completion") tc = w.property(j);
tc.setValueAtTime(0, 100);
// Fix pass: second key at 0.7 s (shown 1.0 s) and incoming influence 60 reach the recipe's measured arrival.
tc.setValueAtTime(0.7, 0);
tc.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
tc.setTemporalEaseAtKey(2, [new KeyframeEase(0, 60)], [new KeyframeEase(0, 60)]);
return { comp: c.name, id: c.id, fontSubs: SC.subs.join(" | ") };

// Technique 8: perform puppet-pin motion live with the mouse.
// A stand-in character sits by a train window; her head sways gently while the body stays still,
// driven by a dozen irregularly spaced keyframes like the ones a live Ctrl/Cmd-drag recording writes.
//
// SUBSTITUTE: the whole performance. In the interface you place three Puppet Position Pins (head, two shoulders)
// and Cmd-drag the head pin to record it. Puppet pins cannot be created by script and live recording is hand-only,
// so the head is a separate layer pivoting at the neck, and its Rotation and Position carry a hand-written
// "recorded" take: 13 keys at irregular spacing from 0:00 to about 3:13, as the recipe describes for Puppet Pin 1.
// The two shoulder pins (which only hold the body still) are stood in for by the body layer having no keyframes.
//
// VERIFY: comp frame rate 23.976 is accepted by addComp (the recipe's comp runs at 23.976)
// VERIFY: a shape layer with anchor [0,0] and position [0,0] draws its contents in comp coordinates
// VERIFY: shape property match names ADBE Vector Shape - Rect / ADBE Vector Rect Size / ADBE Vector Rect Position / ADBE Vector Rect Roundness / ADBE Vector Ellipse Position
// VERIFY: layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom") then "ADBE Mask Shape" for the window mask
// VERIFY: setTemporalAutoBezierAtKey exists on the Rotation and Position properties (used to smooth the take)
$.evalFile(args.prelude);
// Rebuild with artwork (2026-11-14): art from PROOF/08/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// SUBSTITUTE (still): the real step is by hand. A person places Puppet pins on "character" (crown at 0.46, 0.17 of the
// comp; shoulders at 0.26, 0.80 and 0.68, 0.76; optionally the cardigan button 0.53, 0.93; Triangles 300+, Expansion 3-5)
// and Cmd-drags the crown pin to record it. Pins cannot be created by script, so this build bends the cut-out with
// CC Bender (Base on the chest below the hair line, Top on the crown), its Amount carrying a hand-written "recorded"
// take: 13 irregular keys, a slow lean mostly one way with small returns. A second, faint vertical squash (Transform
// effect scale about the chest) stands in for the nod. Shoulders and cardigan below the Base do not move.
// Layers: backdrop (Camera Lens Blur 4), character (Matte Choker on the hair rim, CC Bender, nod), grain.
$.evalFile(args.artLib);
var ARTDIR = args.artDir;
var DUR = 5;
var c = P.freshComp("08 record puppet pin motion", 1920, 1080, 23.976, DUR, ART.hex("#0F1733"));
(function () { var j, it; for (j = app.project.numItems; j >= 1; j--) { it = app.project.item(j); if (it instanceof FootageItem && it.usedIn.length === 0 && it.name === "08 grain") it.remove(); } })();

var bd = c.layers.add(ART.footage(ARTDIR, "backdrop.png", "art 08"));
bd.name = "backdrop";
var lb = P.effect(bd, "ADBE Camera Lens Blur");
var lbMiss = ART.setFx(lb, { "Blur Radius": args.lensBlur !== undefined ? args.lensBlur : 4 });

var ch = c.layers.add(ART.footage(ARTDIR, "character.png", "art 08"));
ch.name = "character";
var SC = 54.4;
P.tf(ch, "ADBE Scale").setValue([SC, SC]);
// Top-left corner at 314, 108: position = corner + half the scaled size.
var W = ch.source.width, H = ch.source.height;
P.tf(ch, "ADBE Position").setValue([314 + W * SC / 200, 108 + H * SC / 200]);
function L(cx, cy) { return [(cx - 314) / (SC / 100), (cy - 108) / (SC / 100)]; } // comp -> layer pixels

// Edge: the brief warns of a faint light rim on the hair; choke it.
var chk = P.effect(ch, "ADBE Matte Choker");
var chkMiss = ART.setFx(chk, { "Geometric Softness 1": args.soft !== undefined ? args.soft : 0.5, "Choke 1": args.choke !== undefined ? args.choke : 1, "Gray Level Softness 1": 0.1 });

// The stand-in deformation. Base on the chest at the turtleneck's base (comp y about 0.72), Top on the crown pin.
var BASE = L(args.baseX || 900, args.baseY || 0.72 * 1080);
var TOP = L(0.46 * 1920, 0.17 * 1080);
var bn = P.effect(ch, "CC Bender");
bn.name = "TECH sway";
var bnMiss = ART.setFx(bn, { "Top": TOP, "Base": BASE });
var amt = null, j;
for (j = 1; j <= bn.numProperties; j++) if (bn.property(j).name === "Amount") amt = bn.property(j);
var bnProps = []; for (j = 1; j <= bn.numProperties; j++) bnProps.push(bn.property(j).name);
// The "recorded" take: times irregular as a live drag writes them; mostly one way (lean right, towards the lamp),
// with small returns. Scaled by args.amp.
var AMP = args.amp || 2.2; // run: Amount 13 x 1 moved the upper head about 20 px; x 2.2 gives about 56 px (brief: 3-5 % of 1080)
var T = [0, 0.33, 0.58, 0.96, 1.25, 1.50, 1.88, 2.17, 2.42, 2.79, 3.04, 3.38, 3.63];
var A = [0, 3, 7, 11, 13, 12, 9, 10, 13, 14, 12, 9, 8];
if (amt) {
  for (j = 0; j < T.length; j++) amt.setValueAtTime(T[j], A[j] * AMP);
  for (j = 1; j <= amt.numKeys; j++) amt.setTemporalAutoBezierAtKey(j, true);
}

// Nod: Transform effect scaling height about the base, 100 -> 98.6 -> 100 twice, offset in time from the lean.
var tr = P.effect(ch, "ADBE Geometry2");
tr.name = "TECH nod";
var trMiss = ART.setFx(tr, { "Anchor Point": BASE, "Position": BASE });
var sh = null; var uni = null;
for (j = 1; j <= tr.numProperties; j++) { if (tr.property(j).name === "Uniform Scale") uni = tr.property(j); if (tr.property(j).name === "Scale Height") sh = tr.property(j); }
if (uni) uni.setValue(0);
var NT = [0, 0.7, 1.15, 1.6, 2.6, 3.0, 3.5], NV = [100, 100, 98.6, 100, 100, 98.8, 100];
if (sh) { for (j = 0; j < NT.length; j++) sh.setValueAtTime(NT[j], NV[j]); for (j = 1; j <= sh.numKeys; j++) sh.setTemporalAutoBezierAtKey(j, true); }

// Film grain over everything (lo-fi plate already has grain; a little moving noise ties the cut-out to it).
var gr = P.solid(c, "08 grain", [0.5, 0.5, 0.5]);
gr.name = "grain";
var nz = P.effect(gr, "ADBE Noise");
ART.setFx(nz, { "Amount of Noise": 100 });
gr.blendingMode = BlendingMode.OVERLAY;
P.tf(gr, "ADBE Opacity").setValue(args.grain !== undefined ? args.grain : 12);

return { comp: c.name, id: c.id, base: BASE, top: TOP, missing: { lens: lbMiss, choker: chkMiss, bender: bnMiss, nod: trMiss }, benderProps: bnProps, haveAmount: !!amt, haveScaleH: !!sh };

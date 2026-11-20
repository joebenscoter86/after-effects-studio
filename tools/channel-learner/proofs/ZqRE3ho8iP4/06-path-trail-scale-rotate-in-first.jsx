// ZqRE3ho8iP4 technique 06: photo cards born as tilted specks grow and straighten along a looping path and brake into a stack.
// args { prelude, artLib, cards }. Art: proof/06/art/brief.md.
// SUBSTITUTE: the Pen-tool mask path pasted into Position (interface only) is keyed directly on the recipe's five measured
//   path points with smooth spatial tangents; keys at 0 / 1.4 / 3.4 / 4.8 / 6 s, keys 2-4 roving.
// ASSUMED: the last point is put where the recipe's landed front card is measured (centre 85 % across, 70 % down: card
//   71-99 % x 52-88 %), not at the path's drawn end (82 %, 70 %); the anchor 11.9,7.3 is left at the card centre.
// ASSUMED: start Rotation -20 (the result's counter-clockwise lean, per the recipe), Scale 0 -> 100, Rotation -> 0 at 6 s;
//   6 s keys Easy Ease in (33.33 %), 0 s keys linear. Copies every 0.3 s by layer start time, earlier pairs on top.
// ASSUMED: 7 s comp (a card's 6 s trip plus the stack holding), 23 cards (births 0 to 6.6 s), photos repeat from l09.
// VERIFY: spatial tangents for the custom path; roving re-times keys 2-4.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.cards);
var dirL = ZC.ART + "/02/art/photos";
var dirP = ZC.ART + "/06/art";
var fold = "art ZqRE 06";
var c = ZC.comp("ZqRE 06 trail", 168, "#E4E4E4");
var order = ["l13-harbour-boats", "l09-cove-rowboat", "p01", "l11-terrace-table", "p02", "l14-curtain-room", "p06",
  "l10-village-lane", "p03", "l12-reader-deckchair", "p04", "l16-potter-wheel", "l15-cliff-divers"];
var crops = { p01: "p01-woman-rust-linen-landscape", p02: "p02-man-sea-blue-landscape", p03: "p03-woman-olive-shutters-landscape",
  p04: "p04-lemon-bowl-landscape", p06: "p06-swimmer-rocks-landscape" };
function photoFor(i) {
  var name = i < order.length ? order[i] : order[1 + ((i - order.length) % (order.length - 1))];
  if (crops[name]) return { item: ART.footage(dirP, crops[name] + ".png", fold), scale: 59.7 };
  return { item: ART.footage(dirL, name + ".png", fold), scale: 26.3 };
}
var pts = [[755.9, 919.3], [288, 508], [1133, 194], [1632, 551], [1632, 756]];
var tin = [[0, 0], [60, 220], [-330, 0], [0, -110], [0, -70]];
var tout = [[-260, -40], [-60, -220], [330, 0], [0, 110], [0, 0]];
var times = [0, 1.4, 3.4, 4.8, 6.0];
var N = 23, stagger = 0.3, k, j, m, ph, pos, S, R, L, pf;
function v3(v, n) { return n === 3 ? [v[0], v[1], 0] : v; }
for (k = N - 1; k >= 0; k--) {
  pf = photoFor(k);
  m = ZC.matte(c, "Matte " + (k + 1), [525, 390], 0, [960, 540]);
  ph = ZC.photo(c, pf.item, "Photo " + (k + 1), pf.scale, [960, 540], m);
  pos = P.tf(m, "ADBE Position");
  for (j = 0; j < 5; j++) pos.setValueAtTime(times[j], pts[j]);
  L = pos.value.length;
  for (j = 1; j <= 5; j++) pos.setSpatialTangentsAtKey(j, v3(tin[j - 1], L), v3(tout[j - 1], L));
  pos.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
  for (j = 2; j <= 4; j++) pos.setInterpolationTypeAtKey(j, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
  ZC.ease(pos, 5, 33.33, 33.33);
  for (j = 2; j <= 4; j++) pos.setRovingAtKey(j, true);
  S = P.tf(m, "ADBE Scale");
  S.setValueAtTime(0, [0, 0]);
  S.setValueAtTime(6, [100, 100]);
  S.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
  ZC.ease(S, 2, 33.33, 33.33);
  R = P.tf(m, "ADBE Rotate Z");
  R.setValueAtTime(0, -20);
  R.setValueAtTime(6, 0);
  R.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
  ZC.ease(R, 2, 33.33, 33.33);
  m.startTime = k * stagger;
  ph.startTime = k * stagger;
}
var ink = ART.hex("#07211B");
var t1 = ZC.textLayer(c, "SUMMER", "InstrumentSerif-Regular", 165, ink, ParagraphJustification.CENTER_JUSTIFY, 70, 0);
t1.name = "Title";
P.tf(t1, "ADBE Position").setValue([979, 600]);
var t2 = ZC.textLayer(c, "salt and slow light", "JostRoman-Light", 42, ink, ParagraphJustification.CENTER_JUSTIFY, 167, 0);
t2.name = "Subline";
P.tf(t2, "ADBE Position").setValue([979, 652]);
// Path length and key times after roving (card 1).
var p1 = P.tf(c.layer("Matte 1"), "ADBE Position"), len = 0, prev = p1.valueAtTime(0, false), cur, tt;
for (tt = 0.02; tt <= 6.001; tt += 0.02) { cur = p1.valueAtTime(tt, false); len += Math.sqrt(Math.pow(cur[0] - prev[0], 2) + Math.pow(cur[1] - prev[1], 2)); prev = cur; }
var kt = [];
for (j = 1; j <= p1.numKeys; j++) kt.push(Math.round(p1.keyTime(j) * 100) / 100);
var sp = [];
for (tt = 0; tt <= 6; tt += 1) { cur = p1.valueAtTime(tt, false); sp.push(tt + ":" + Math.round(cur[0]) + "," + Math.round(cur[1])); }
return { comp: c.name, id: c.id, frames: Math.round(c.duration * c.frameRate), pathLen: Math.round(len), keyTimes: kt.join(" "), samples: sp.join(" ") };

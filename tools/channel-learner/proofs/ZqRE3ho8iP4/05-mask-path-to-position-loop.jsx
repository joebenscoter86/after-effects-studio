// ZqRE3ho8iP4 technique 05: flat photo cards orbit an oval counter-clockwise forever (one lap per 10 s, constant speed).
// args { prelude, artLib, cards }. Art: proof/05/art/brief.md (photos in proof/02/art/photos).
// SUBSTITUTE: the tutorial copies an Ellipse mask's path and pastes it into Position (interface only). Here the same oval
//   (centre 960,543, radii 825 x 337) is keyed directly: keys at 0 / 2.5 / 5 / 7.5 / 10 s on the top, left, bottom, right
//   and top points, spatial tangents 0.5523 x radius (a Bezier ellipse, as the pasted mask gives), keys 2-4 roving.
// ASSUMED: each copy's keys slid k x (10 s / 15) later; the expression loops backwards before the first key as well as
//   forwards after the last (the recipe asks whether a loopIn was used), so every card is already on the oval at frame 0.
// ASSUMED: 6 s comp (the 3-6 s rule); the grain layer is left out (the recipe measures no visible grain).
// VERIFY: setSpatialTangentsAtKey on a 2D layer's Position takes 2- or 3-element arrays (matched to the value length).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.cards);
var dir = ZC.ART + "/02/art/photos";
var fold = "art ZqRE 05";
var c = ZC.comp("ZqRE 05 orbit", 144, "#EEEBE4");
var files = ["p01-woman-rust-linen", "l13-harbour-boats", "p05-white-stairs", "l11-terrace-table", "p06-swimmer-rocks",
  "l09-cove-rowboat", "p02-man-sea-blue", "l14-curtain-room", "p04-lemon-bowl", "l10-village-lane",
  "p03-woman-olive-shutters", "l12-reader-deckchair", "p07-jug-windowsill", "l16-potter-wheel", "p08-hat-blue-door"];
var N = files.length, lap = 10, d = lap / N;
var cx = 960, cy = 543, rx = 825, ry = 337, kx = 0.5523 * rx, ky = 0.5523 * ry;
var pts = [[cx, cy - ry], [cx - rx, cy], [cx, cy + ry], [cx + rx, cy], [cx, cy - ry]];
// Travel is top -> left -> bottom -> right -> top (counter-clockwise on screen).
var tin = [[kx, 0], [0, -ky], [-kx, 0], [0, ky], [kx, 0]];
var tout = [[-kx, 0], [0, ky], [kx, 0], [0, -ky], [-kx, 0]];
var k, j, m, ph, pos, port, size, scale, L, a, b;
function vec(v, n) { return n === 3 ? [v[0], v[1], 0] : v; }
for (k = 0; k < N; k++) {
  port = files[k].charAt(0) === "p";
  size = port ? [222.5, 300.3] : [300.5, 214.3];
  scale = port ? 25.7 : 14.5;
  m = ZC.matte(c, "Matte " + (k + 1), size, 0, [cx, cy]);
  ph = ZC.photo(c, ART.footage(dir, files[k] + ".png", fold), "Photo " + (k + 1), scale, [cx, cy], m);
  pos = P.tf(m, "ADBE Position");
  for (j = 0; j < 5; j++) pos.setValueAtTime(j * 2.5 + k * d, pts[j]);
  L = pos.value.length;
  for (j = 1; j <= 5; j++) {
    pos.setInterpolationTypeAtKey(j, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    pos.setSpatialTangentsAtKey(j, vec(tin[j - 1], L), vec(tout[j - 1], L));
  }
  for (j = 2; j <= 4; j++) pos.setRovingAtKey(j, true);
  // SUBSTITUTE for loopOut(): the same cycle written out so it also runs before the first key (loopIn left cards parked).
  pos.expression = 'var t0 = key(1).time, T = key(numKeys).time - t0; valueAtTime(t0 + (((time - t0) % T) + T) % T);';
}
// Title in the empty middle (02/05 brief type).
var ink = ART.hex("#0A221A");
var t1 = ZC.textLayer(c, "SUMMER", "InstrumentSerif-Regular", 165, ink, ParagraphJustification.CENTER_JUSTIFY, 70, 0);
t1.name = "Title";
P.tf(t1, "ADBE Position").setValue([960, 600]);
var t2 = ZC.textLayer(c, "salt and slow light", "JostRoman-Light", 42, ink, ParagraphJustification.CENTER_JUSTIFY, 167, 0);
t2.name = "Subline";
P.tf(t2, "ADBE Position").setValue([960, 652]);
var out = { comp: c.name, id: c.id, frames: Math.round(c.duration * c.frameRate), lenDims: L };
var p0 = P.tf(c.layer("Matte 1"), "ADBE Position"), s = [], tt;
for (tt = 0; tt <= 10; tt += 1.25) s.push(tt + ":" + Math.round(p0.valueAtTime(tt, false)[0]) + "," + Math.round(p0.valueAtTime(tt, false)[1]));
out.card1 = s.join(" ");
out.card15at0 = P.tf(c.layer("Matte 15"), "ADBE Position").valueAtTime(0, true).join(",");
out.exprErr = P.tf(c.layer("Matte 15"), "ADBE Position").expressionError;
out.fonts = [t1.property("ADBE Text Properties").property("ADBE Text Document").value.font, t2.property("ADBE Text Properties").property("ADBE Text Document").value.font].join(" / ");
return out;

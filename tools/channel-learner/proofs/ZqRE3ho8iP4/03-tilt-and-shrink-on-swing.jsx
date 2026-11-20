// ZqRE3ho8iP4 technique 03: on top of 02's pivot swing, the card's own Scale and Rotation (about its bottom-edge anchor)
// shrink it to 68 % and lean it outward at the sides, full size and upright at the top.
// args { prelude, artLib, cards }. Art: proof/03/art/brief.md (cards 1-3 from proof/02/art).
// The recipe builds one card (keys 0/17/24/41 f). Its result frame and the art brief show the chained copies of recipe 04
// (an incoming copy at the lower right while the first card is up), so copies k = 1..3 are added the way 04 states:
// each copy parented to the same looping null, folded one 34-degree step further round (+34 k on its own Rotation),
// its Scale/Rotation keys slid k x 24 frames later. That chain is 04's technique, built here only to give the result picture.
// VERIFY: Scale's temporal ease wants one KeyframeEase per dimension (3 on a 2D layer?).
// ASSUMED: every Scale and Rotation key eased 86 % in and out (the recipe reads 86.23 % on the first key's outgoing handle).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.cards);
var dir = ZC.ART + "/02/art";
var fold = "art ZqRE 03";
var c = ZC.comp("ZqRE 03 tilt shrink", 96, "#F7F4ED");
var logo = ART.footage(dir, "logo-sun-wave.png", fold);
var specs = [
  { tag: "1", file: "hero-1-rust.png", lines: ["Salt", "Season"], pills: ["Travel", "Coast"] },
  { tag: "2", file: "hero-2-sea-blue.png", lines: ["Harbour", "Light"], pills: ["Journal", "People"] },
  { tag: "3", file: "hero-3-olive.png", lines: ["Linen", "Days"], pills: ["Style", "Summer"] },
  { tag: "4", file: "hero-1-rust.png", lines: ["Salt", "Season"], pills: ["Travel", "Coast"] }
];
var n = c.layers.addNull();
n.name = "Pivot null";
P.tf(n, "ADBE Position").setValue([960, 1080 * 1.36]);
var mattes = [], k, card, m;
for (k = 0; k < specs.length; k++) {
  card = ZC.coverCard(c, {
    tag: specs[k].tag, photo: ART.footage(dir, specs[k].file, fold), logo: logo,
    lines: specs[k].lines, pills: specs[k].pills
  }, [960, 540]);
  m = card.matte;
  P.tf(m, "ADBE Anchor Point").setValue([0, 356]);
  P.tf(m, "ADBE Position").setValue([960, 896]);
  if (k > 0) {
    // Recipe 04 steps 2-6: a static helper null at the pivot turned k steps (+34 k), the copy parented to it,
    // then re-parented to the main null, which folds the helper's turn into the copy's Position and Rotation.
    var h = c.layers.addNull();
    P.tf(h, "ADBE Position").setValue([960, 1080 * 1.36]);
    m.parent = h;
    P.tf(h, "ADBE Rotate Z").setValue(34 * k); // turned after parenting, so the copy moves round the pivot
    m.parent = n;
    h.remove();
  } else {
    m.parent = n; // null still at 0 degrees: nothing is folded in
  }
  mattes.push(m);
}
n.moveToBeginning();
// 02's null.
var rot = P.tf(n, "ADBE Rotate Z");
rot.setValueAtTime(ZC.f(0), 34);
rot.setValueAtTime(ZC.f(17), 0);
rot.setValueAtTime(ZC.f(24), 0);
ZC.ease(rot, 1, 33.33, 76.71);
ZC.ease(rot, 2, 77, 33.33);
rot.setInterpolationTypeAtKey(3, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
rot.expression = 'loopOut("offset")';
// 03's keys on each matte, copy k offset by 24 k frames and folded +34 k.
var times = [0, 17, 24, 41], sc = [68, 100, 100, 68], ro = [23, 0, 0, -22], j, S, R;
for (k = 0; k < mattes.length; k++) {
  S = P.tf(mattes[k], "ADBE Scale");
  R = P.tf(mattes[k], "ADBE Rotate Z");
  for (j = 0; j < 4; j++) {
    S.setValueAtTime(ZC.f(times[j] + 24 * k), [sc[j], sc[j]]);
    R.setValueAtTime(ZC.f(times[j] + 24 * k), ro[j] + 34 * k);
  }
  for (j = 1; j <= 4; j++) { ZC.ease(S, j, 86, 86); ZC.ease(R, j, 86, 86); }
}
var out = { comp: c.name, id: c.id, frames: Math.round(c.duration * c.frameRate), scaleDims: ZC.dims(P.tf(mattes[0], "ADBE Scale")) };
var s = [], f;
for (f = 0; f <= 41; f += 4) s.push(f + ":" + Math.round(P.tf(mattes[0], "ADBE Scale").valueAtTime(ZC.f(f), false)[0]) + "/" + Math.round(P.tf(mattes[0], "ADBE Rotate Z").valueAtTime(ZC.f(f), false)));
out.card1 = s.join(" ");
out.copyRot = [P.tf(mattes[1], "ADBE Rotate Z").valueAtTime(0, false), P.tf(mattes[1], "ADBE Position").value.join(",")];
return out;

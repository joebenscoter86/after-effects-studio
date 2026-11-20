// ZqRE3ho8iP4 technique 08 (on 07's box): two square rings of four 3D photo walls, the front turning clockwise at 40 deg/s,
// the one 1340 px behind it anticlockwise, seen end-on through the default camera.
// args { prelude, artLib, cards }. Art: proof/08/art/brief.md.
// 07's box: cards 1100 x 680, Roundness 45, Y Rotation 90 (the result's, not the panel's 97), anchor Z 440,
//   Orientation Z 0/90/180/270, parented to a 3D null at the comp centre with time*40 on Z Rotation. No camera layer.
// VERIFY: Orientation then Y Rotation stands each card as a wall facing the axis; anchor Z on a shape layer is in its own space.
// ASSUMED: the back ring's cards are built fresh (not duplicated) and set to the front cards' null-space Position + [0,0,1340]
//   after parenting to null B (the recipe's "0, 0, 1340" is in its null's space, whose origin is not given in numbers).
// ASSUMED: 4 s comp, two rings only (the brief's).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.cards);
var dir = ZC.ART + "/02/art/photos";
var fold = "art ZqRE 08";
var c = ZC.comp("ZqRE 08 tunnel", 96, "#101010");
var front = ["l13-harbour-boats", "l09-cove-rowboat", "l10-village-lane", "l14-curtain-room"];
var back = ["l11-terrace-table", "l15-cliff-divers", "l12-reader-deckchair", "l16-potter-wheel"];
function nullAt(name, expr) {
  var n = c.layers.addNull();
  n.name = name;
  n.threeDLayer = true;
  P.tf(n, "ADBE Position").setValue([960, 540, 0]);
  P.tf(n, "ADBE Rotate Z").expression = expr;
  return n;
}
function ring(files, tag) {
  var out = [], k, cd;
  for (k = 0; k < 4; k++) {
    cd = ZC.card3D(c, tag + (k + 1), ART.footage(dir, files[k] + ".png", fold), [1100, 680], 45, 50);
    P.tf(cd.matte, "ADBE Anchor Point").setValue([0, 0, 440]);
    P.tf(cd.matte, "ADBE Rotate Y").setValue(90);
    P.tf(cd.matte, "ADBE Orientation").setValue([0, 0, k * 90]);
    out.push(cd.matte);
  }
  return out;
}
var nA = nullAt("Null 1 (cw)", "time*40");
var nB = nullAt("Null 2 (ccw)", "time*-40");
var B = ring(back, "B");
var A = ring(front, "A");
var k, pA = [];
for (k = 0; k < 4; k++) { A[k].parent = nA; pA.push(P.tf(A[k], "ADBE Position").value); }
for (k = 0; k < 4; k++) {
  B[k].parent = nB;
  P.tf(B[k], "ADBE Position").setValue([pA[k][0], pA[k][1], pA[k][2] + 1340]);
}
nA.moveToBeginning();
nB.moveToBeginning();
return { comp: c.name, id: c.id, frames: Math.round(c.duration * c.frameRate), frontPos: pA[0].join(","), backPos: P.tf(B[0], "ADBE Position").value.join(",") };

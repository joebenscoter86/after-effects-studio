// ZqRE3ho8iP4 technique 11 (on 10's ring): a 24 mm two-node camera inside a turning ring of fifteen 3D photo cards.
// args { prelude, artLib, cards }. Art: proof/11/art/brief.md.
// 10's ring: card i a 3D rounded card 570 x 710 at the comp centre, anchor Z -1480, Y Rotation -24 i, i = 0..14, shapes
//   parented to a 3D null at the comp centre with time*20 on Y Rotation.
// SUBSTITUTE: 10's hand dolly of the default view is stood in by a camera layer (Zoom 2666.7, Position 960,540,-1455),
//   kept below the technique's camera; it is the "before" view.
// SUBSTITUTE: the Camera Settings dialog (24mm preset, Create Camera From Current View off) is replaced by addCamera with
//   Zoom 1280 px (24 mm on a 36 mm film across 1920 px) at Position 960,540,-1280, Point of Interest 960,540,0.
// TECH: the 24 mm camera is "TECH Camera 24mm"; switch it off for before.png (the stand-in then is the active camera).
// ASSUMED: corner radius 45 (the brief; the recipe measures 3-4 % of the card width, about 20 px). 4 s comp.
// VERIFY: camera zoom match name "ADBE Camera Zoom"; depth of field off by default.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.cards);
var dirP = ZC.ART + "/02/art/photos";
var dirL = ZC.ART + "/11/art";
var fold = "art ZqRE 11";
var c = ZC.comp("ZqRE 11 wide lens", 96, "#E4E4E4");
var ring = ["p01-woman-rust-linen", "l09", "p02-man-sea-blue", "l13", "p05-white-stairs", "l11", "p03-woman-olive-shutters",
  "l14", "p06-swimmer-rocks", "l10", "p07-jug-windowsill", "l12", "p04-lemon-bowl", "l16", "p08-hat-blue-door"];
var crops = { l09: "l09-cove-rowboat", l10: "l10-village-lane", l11: "l11-terrace-table", l12: "l12-reader-deckchair",
  l13: "l13-harbour-boats", l14: "l14-curtain-room", l16: "l16-potter-wheel" };
var n = c.layers.addNull();
n.name = "Ring null";
n.threeDLayer = true;
P.tf(n, "ADBE Position").setValue([960, 540, 0]);
P.tf(n, "ADBE Rotate Y").expression = "time*20";
var i, cd, item, sc;
for (i = 0; i < ring.length; i++) {
  if (crops[ring[i]]) { item = ART.footage(dirL, crops[ring[i]] + "-portrait.png", fold); sc = 50; }
  else { item = ART.footage(dirP, ring[i] + ".png", fold); sc = 64.8; }
  cd = ZC.card3D(c, String(i + 1), item, [570, 710], 45, sc);
  P.tf(cd.matte, "ADBE Anchor Point").setValue([0, 0, -1480]);
  P.tf(cd.matte, "ADBE Rotate Y").setValue(-24 * i);
  cd.matte.parent = n; // the null reads 0 at time 0, so nothing is folded in
}
n.moveToBeginning();
function cam(name, zoom, z) {
  var k = c.layers.addCamera(name, [960, 540]);
  k.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(zoom);
  P.tf(k, "ADBE Position").setValue([960, 540, z]);
  P.tf(k, "ADBE Anchor Point").setValue([960, 540, 0]);
  return k;
}
var standIn = cam("Camera 10 stand-in (dolly)", 2666.7, -1455);
var wide = cam("TECH Camera 24mm", 1280, -1280);
return { comp: c.name, id: c.id, frames: Math.round(c.duration * c.frameRate),
  wideDOF: wide.property("ADBE Camera Options Group").property("ADBE Camera Depth of Field").value,
  top: c.layer(1).name };

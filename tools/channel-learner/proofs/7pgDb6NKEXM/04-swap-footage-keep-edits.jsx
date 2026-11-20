// Technique 04: replace a card's photo source and keep everything built on it (the 03 scene, art in PROOF/03/art).
// args: prelude, artLib, helm, artDir, swap (false renders the "before").
// SUBSTITUTE: the Alt/Option-drag from the Project panel is layer.replaceSource(item, false), as the recipe's build note says.
// Checked on the run: replaceSource moves the Anchor Point to the new image centre (440,584 -> 1080,1432) and keeps Scale (39.3).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.helm);
var r = HELM.build("04 swap-footage-keep-edits", 6, args.artDir);
var out = { comp: r.comp.name, id: r.comp.id, layers: r.comp.numLayers, fontSubs: HELM.subs.join(" | ") };
if (args.swap) {
  // swap 1: card 1 (master 0 deg), portrait-13 is 2160 px wide, so Scale must be re-fitted (recipe step 3)
  var p1 = r.cards[0].photo;
  var oldAnchor = P.tf(p1, "ADBE Anchor Point").value;
  var oldScale = P.tf(p1, "ADBE Scale").value;
  var oldW = p1.source.width;
  p1.replaceSource(ART.footage(args.artDir, "portrait-13.png", "art 03"), false);
  out.afterSwapAnchor = P.tf(p1, "ADBE Anchor Point").value.toString();
  out.afterSwapScale = P.tf(p1, "ADBE Scale").value.toString();
  // re-fit: scale by old width / new width so the photo is the window's width again
  var ns = oldScale[0] * oldW / p1.source.width;
  P.tf(p1, "ADBE Scale").setValue([ns, ns]);
  out.refitScale = ns;
  out.oldAnchor = oldAnchor.toString();
  // swap 2: card 2 (master 30 deg), same pixel size, no re-fit
  r.cards[1].photo.replaceSource(ART.footage(args.artDir, "portrait-14.png", "art 03"), false);
  out.matte1 = p1.trackMatteLayer ? p1.trackMatteLayer.name : "none";
  out.parent1 = p1.parent ? p1.parent.name : "none";
}
return out;

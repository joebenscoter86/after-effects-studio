// piece: picture-face
// name: A picture or screenshot as the face of an object
// does: Puts a picture, a screenshot, a movie or a comp on a plate's front face, filled to the face inside a small rim and cut to its rounded corners, so the screen is part of a lit object rather than a flat card.
// use it for: a real screen or app shown as a device; a document page; a photo on a card; the product itself
// job: show-real-screen; support: make-concrete, introduce-tool
// provides: environment: screen
// works with: piece-plate, piece-stage, piece-room, piece-flip
// call: PCS.pictureFace(plate, { source, inset, fit, lit, name })
// option source: a project item (footage or comp) or a file path (imported once)
// option inset: the rim of plate left showing around the picture, default 18
// option fit: 'cover' (default) fills the face and trims the overflow; 'contain' shows the whole picture
// option lit: false (default) keeps the picture's own colours, like a screen; true lets the stage's lights fall on it, like a print
// returns: the picture layer, seated on the plate (it moves, turns and stands up with it)
// example:
//   var tablet = PCS.plate(st.comp, { name: 'tablet', w: 820, h: 560, round: 44, pos: [540, 600, 0] });
//   PCS.pictureFace(tablet, { source: 'screenshots/app.png' });
// note: the plate's own colour shows as the rim: a dark surface reads as a device, the accent as a frame.
// note: set the plate a little larger than the picture's shape; a cover fit trims what does not fit the face.
// ---
PCS.need('on-face');
PCS.pictureFace = function (plate, o) {
  var comp = plate.containingComp; var src = o.source;
  if (typeof src === 'string') { src = PCS.importOnce(src); }
  if (!src) { throw new Error('pictureFace: no source'); }
  var L = comp.layers.add(src); L.name = o.name || (plate.name + ' picture'); PCS.seat(comp, L);
  var inset = (o.inset === undefined) ? 18 : o.inset;
  var w = PCS.num(plate, 'w', 600) - 2 * inset; var h = PCS.num(plate, 'h', 400) - 2 * inset;
  var round = PCS.num(plate, 'round', 0);
  var sw = src.width; var sh = src.height;
  var k = (o.fit === 'contain') ? Math.min(w / sw, h / sh) : Math.max(w / sw, h / sh);
  var mw = Math.min(sw, w / k); var mh = Math.min(sh, h / k);
  var m = L.property('ADBE Mask Parade').addProperty('ADBE Mask Atom');
  m.property('ADBE Mask Shape').setValue(PCS.roundRect(sw / 2, sh / 2, mw, mh, Math.max(0, round - inset) / k));
  PCS.TG(L).property('ADBE Anchor Point').setValue([sw / 2, sh / 2, 0]);
  PCS.onFace(L, plate, [0, 0], false);
  PCS.TG(L).property('ADBE Scale').setValue([k * 100, k * 100, 100]);
  if (o.lit) { PCS.sp(L, PCS.MG, 'ADBE Accepts Lights', 1); }
  return L;
};

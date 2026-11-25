// piece: plate
// name: Thick lit plate
// does: Makes one thick, bevelled slab that takes the light and casts a shadow: a card, a pill, a tile, a chip or a bar.
// use it for: anything that should look built rather than drawn; the object words and pictures sit on (a card, a document, a receipt, a tile, a pill)
// job: add-depth; support: light-the-hero, list-items
// provides: material: gloss; depth: extrusion; depth: shadow
// works with: piece-stage, piece-flip
// call: PCS.plate(comp, { name, w, h, round, color, depth, bevel, pos, tilt })
// option w, h: size in pixels
// option round: corner radius; h / 2 makes a pill
// option color: default the style's surface colour
// option depth: thickness, default the style's depth
// option bevel: edge bevel, 0 for none; default the style's bevel
// option pos: [x, y, z]
// option tilt: [x, y] resting angle in degrees; default the style's tilt, which shows the side wall and the bottom edge
// returns: the plate layer (its front face at local z 0; the body runs back to z = depth)
// example:
//   var st = PCS.stage({ name: 'BEAT 3', duration: 5 });
//   var pill = PCS.plate(st.comp, { name: 'pill', w: 780, h: 160, round: 80, pos: [540, 300, 0] });
// note: two equal plates on screen means no hero; make one bigger, nearer or in the pool of light.
// ---
PCS.plate = function (comp, o) {
  var S = PCS.S;
  var L = comp.layers.addShape(); L.name = o.name || 'plate';
  var c = L.property('ADBE Root Vectors Group').addProperty('ADBE Vector Group').property('ADBE Vectors Group');
  var r = c.addProperty('ADBE Vector Shape - Rect');
  r.property('ADBE Vector Rect Size').setValue([o.w, o.h]);
  r.property('ADBE Vector Rect Roundness').setValue(o.round || 0);
  c.addProperty('ADBE Vector Graphic - Fill').property('ADBE Vector Fill Color').setValue(PCS.lit(o.color || S.surface));
  L.threeDLayer = true;
  var depth = (o.depth === undefined) ? S.depth : o.depth;
  var bevel = (o.bevel === undefined) ? S.bevel : o.bevel;
  PCS.sp(L, PCS.GEO, 'ADBE Extrsn Depth', depth);
  if (bevel > 0) { PCS.sp(L, PCS.GEO, 'ADBE Bevel Styles', 2); PCS.sp(L, PCS.GEO, 'ADBE Bevel Depth', bevel); }
  PCS.sp(L, PCS.MG, 'ADBE Casts Shadows', 1);
  PCS.material(L);
  if (o.pos) { PCS.TG(L).property('ADBE Position').setValue(o.pos); }
  var tilt = o.tilt || S.tilt;
  PCS.TG(L).property('ADBE Rotate X').setValue(tilt[0]);
  PCS.TG(L).property('ADBE Rotate Y').setValue(tilt[1]);
  var named = o.color || S.surface; var hi = Math.max(named[0], named[1], named[2]);
  L.comment = 'depth=' + depth + ' bevel=' + bevel + ' w=' + o.w + ' h=' + o.h + ' round=' + (o.round || 0) + ' hi=' + Math.round(hi * 1000) / 1000;
  return PCS.seat(comp, L);
};

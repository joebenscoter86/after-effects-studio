// Proof scene for the move piece: an accent tile with a tick turns over to its "?" side while it grows and rises into
// place, with a small overshoot, and its pool of light follows it and grows with it. Three frames side by side: before,
// on the way, at rest.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/move.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF move <style>' (an earlier one of the same name is replaced); touches nothing else.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('stage'); PCS.need('two-sided'); PCS.need('tick'); PCS.need('label'); PCS.need('on-face'); PCS.need('flip'); PCS.need('move'); PCS.need('spot');
  var name = 'CR PIECE PROOF move ' + id;
  var st = PCS.stage({ name: name, duration: 2, replace: true }); var c = st.comp; var S = PCS.S;
  var tile = PCS.twoSided(c, { name: 'tile', w: 300, h: 300, round: 56, color: S.accent, backColor: S.quiet, pos: [540, 1020, 0] });
  PCS.onFace(PCS.tick(c, { size: 250 }), tile.front);
  PCS.onFace(PCS.label(c, { text: '?', size: 200, on: 'surface' }), tile.back);
  PCS.flip(tile.front, { t: 0.6, dur: 0.5 });
  PCS.move(tile.front, { t: 0.6, dur: 0.5, to: [540, 640], scale: 160, overshoot: 6 });
  PCS.spot(c, { name: 'pool', on: tile.front });
  return { comp: name, id: c.id, frames: [0.3, 0.85, 1.6], across: true, warnings: PCS.warnings };
}

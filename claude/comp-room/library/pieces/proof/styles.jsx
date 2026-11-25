// Proof scene for a style: the same pieces in the same places, so styles are judged side by side on one picture.
// A titled pill, an accent tile with its word lit by a spot, a quiet bar, and a pill turning over to its accent back.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/styles.jsx'));
//   return PCS_STYLE_PROOF('house');
// Makes one new comp named 'CR STYLE PROOF <style>' (an earlier one of the same name is replaced); touches nothing else.
// Its still is the frame at PCS_STYLE_PROOF(...).frame.
function PCS_STYLE_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = [];
  PCS.use(id);
  PCS.need('stage'); PCS.need('plate'); PCS.need('spot'); PCS.need('flip');
  var name = 'CR STYLE PROOF ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 3 }); var comp = st.comp; var S = PCS.S;

  function word(text, parent, size, color, z) {
    var L = comp.layers.addText(text); PCS.setText(L, { size: size, color: color, maxWidth: 0.86 * PCS.num(parent, 'w', 600) });
    PCS.seat(comp, L); L.threeDLayer = true; L.parent = parent; PCS.zero(L);
    PCS.TG(L).property('ADBE Position').setValue([0, 0, z === undefined ? -3 : z]);
    PCS.sp(L, PCS.MG, 'ADBE Accepts Lights', 0);
    return L;
  }

  var title = PCS.plate(comp, { name: 'title pill', w: 780, h: 170, round: 85, pos: [540, 400, 0] });
  word('Same pieces', title, 84, S.ink);

  var tile = PCS.plate(comp, { name: 'accent tile', w: 330, h: 330, round: 56, color: S.accent, pos: [330, 800, 0] });
  word('Yes', tile, 120, S.onAccent);
  var card = PCS.plate(comp, { name: 'card', w: 380, h: 330, round: 40, pos: [770, 800, 0] });
  for (var i = 0; i < 3; i++) {
    var bar = PCS.plate(comp, { name: 'card line ' + (i + 1), w: 260 - i * 50, h: 26, round: 13, color: S.quiet, depth: 6, bevel: 0, tilt: [0, 0] });
    bar.parent = card; PCS.zero(bar);
    PCS.TG(bar).property('ADBE Position').setValue([-30 - i * 25, -90 + i * 70, -4]);
  }

  var turner = PCS.plate(comp, { name: 'turning pill', w: 700, h: 170, round: 85, pos: [540, 1230, 0] });
  var back = PCS.plate(comp, { name: 'turning pill back', w: 700, h: 170, round: 85, color: S.accent, depth: 4, bevel: 0, tilt: [0, 0] });
  back.parent = turner; PCS.zero(back);
  PCS.TG(back).property('ADBE Position').setValue([0, 0, PCS.depthOf(turner) + 2 * PCS.bevelOf(turner) + 2]);
  word('Before', turner, 78, S.ink);
  var after = word('After', turner, 78, S.onAccent, PCS.depthOf(turner) + 2 * PCS.bevelOf(turner) + 8);
  PCS.TG(after).property('ADBE Rotate X').setValue(180);
  PCS.flip(turner, { t: 1.2, axis: 'x' });

  var pool = PCS.spot(comp, { name: 'pool on the tile', pos: [330, 300, -900], aim: [330, 800, 0], intensity: 0, cone: 40 });
  PCS.kf(pool.property('ADBE Light Options Group').property('ADBE Light Intensity'), [[0.2, 0], [1.0, 70]]);

  return { comp: comp.name, id: comp.id, frame: 1.4, style: id, warnings: PCS.warnings };
}

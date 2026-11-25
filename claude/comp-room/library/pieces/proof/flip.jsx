// Proof scene for the flip piece: three pills that turn over on the x axis at staggered times, so one frame
// (PCS_PROOF.frame) shows one still flat, one mid-turn and one turned to its back.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/flip.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF flip <style>' (an earlier one of the same name is replaced); touches nothing else.
function PCS_PROOF(styleName) {
  PCS.warnings = [];
  PCS.use(styleName || 'house');
  PCS.need('stage'); PCS.need('plate'); PCS.need('flip');
  var name = 'CR PIECE PROOF flip ' + (styleName || 'house');
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 3 }); var comp = st.comp; var S = PCS.S;
  var words = [['Question', 'Answer'], ['Before', 'After'], ['Guess', 'Proof']];
  var starts = [1.8, 1.24, 0.6];   // at 1.4 s: the top one not yet turned, the middle one mid-turn, the bottom one turned
  var plates = [];
  for (var i = 0; i < 3; i++) {
    var y = 420 + i * 300;
    var p = PCS.plate(comp, { name: 'pill ' + (i + 1), w: 700, h: 170, round: 85, pos: [540, y, 0] });
    var back = PCS.plate(comp, { name: 'pill ' + (i + 1) + ' back', w: 700, h: 170, round: 85, color: S.accent, depth: 4, bevel: 0, tilt: [0, 0] });
    back.parent = p; PCS.zero(back);
    PCS.TG(back).property('ADBE Position').setValue([0, 0, PCS.depthOf(p) + 2 * PCS.bevelOf(p) + 2]);
    var fr = comp.layers.addText(words[i][0]); PCS.setText(fr, { size: 78, color: S.ink }); PCS.seat(comp, fr);
    fr.threeDLayer = true; fr.parent = p; PCS.zero(fr); PCS.TG(fr).property('ADBE Position').setValue([0, 0, -3]);
    PCS.sp(fr, PCS.MG, 'ADBE Accepts Lights', 0);
    var bk = comp.layers.addText(words[i][1]); PCS.setText(bk, { size: 78, color: S.onAccent }); PCS.seat(comp, bk);
    bk.threeDLayer = true; bk.parent = p; PCS.zero(bk);
    PCS.TG(bk).property('ADBE Position').setValue([0, 0, PCS.depthOf(p) + 2 * PCS.bevelOf(p) + 8]);
    PCS.TG(bk).property('ADBE Rotate X').setValue(180);
    PCS.sp(bk, PCS.MG, 'ADBE Accepts Lights', 0);
    PCS.flip(p, { t: starts[i], axis: 'x' });
    plates.push(p.name);
  }
  return { comp: comp.name, id: comp.id, frame: 1.4, plates: plates, warnings: PCS.warnings };
}

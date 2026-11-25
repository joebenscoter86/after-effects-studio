// Proof scene for the spot piece: two equal cards on the stage, one under a pool of light that has risen on it,
// so the light picks the hero. Frame: PCS_PROOF.frame.
// Run: $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/spot.jsx')); return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF spot <style>' (an earlier one of the same name is replaced); touches nothing else.
function PCS_PROOF(styleName) {
  PCS.warnings = []; PCS.use(styleName || 'house');
  PCS.need('stage'); PCS.need('plate'); PCS.need('spot');
  var name = 'CR PIECE PROOF spot ' + (styleName || 'house');
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 2 }); var c = st.comp;
  PCS.plate(c, { name: 'card left', w: 400, h: 520, round: 34, pos: [300, 720, 0] });
  PCS.plate(c, { name: 'card right', w: 400, h: 520, round: 34, pos: [790, 720, 0] });
  var pool = PCS.spot(c, { name: 'pool', pos: [790, 250, -900], aim: [790, 720, 0], intensity: 0, cone: 40 });
  PCS.kf(pool.property('ADBE Light Options Group').property('ADBE Light Intensity'), [[0.2, 0], [1.0, 150]]);
  return { comp: name, id: c.id, frame: 1.2, warnings: PCS.warnings };
}

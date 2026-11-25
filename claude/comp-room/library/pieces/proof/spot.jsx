// Proof scene for the spot piece: two equal cards side by side; a pool of light has risen on the right one while the
// stage's key dipped, so one is plainly the lit hero and the other is not. Frame: PCS_PROOF.frame.
// Run: $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/spot.jsx')); return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF spot <style>' (an earlier one of the same name is replaced); touches nothing else.
function PCS_PROOF(styleName) {
  PCS.warnings = []; PCS.use(styleName || 'house');
  PCS.need('stage'); PCS.need('plate'); PCS.need('spot');
  var name = 'CR PIECE PROOF spot ' + (styleName || 'house');
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var st = PCS.stage({ name: name, duration: 2 }); var c = st.comp;
  PCS.plate(c, { name: 'card left', w: 400, h: 520, round: 34, pos: [300, 700, 0] });
  var hero = PCS.plate(c, { name: 'card right', w: 400, h: 520, round: 34, pos: [790, 700, 0] });
  PCS.spot(c, { name: 'pool', on: hero, t: 0.2, dimKey: 0.6 });
  return { comp: name, id: c.id, frame: 1.2, warnings: PCS.warnings };
}

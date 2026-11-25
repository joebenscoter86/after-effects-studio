// Proof scene for the picture-face piece: a tablet and a phone, each a lit slab with a screen on its face. The screen is a
// small app drawn here from shapes in the style's colours (a sub-comp named after the proof), so no picture ships.
// Run in one eval.run (rollback: false):
//   $.evalFile(File('<library>/pieces/pcs-core.jsx')); $.evalFile(File('<library>/pieces/proof/picture-face.jsx'));
//   return PCS_PROOF('house');
// Makes one new comp named 'CR PIECE PROOF picture-face <style>' and its screen sub-comp (earlier ones are replaced); touches nothing else.
// Its still is the frame at PCS_PROOF(...).frame.
function PCS_PROOF(styleName) {
  var id = styleName || PCS.STYLE_DEFAULT;
  PCS.warnings = []; PCS.use(id);
  PCS.need('stage'); PCS.need('plate'); PCS.need('picture-face');
  var name = 'CR PIECE PROOF picture-face ' + id;
  var old = PCS.findItem(name); if (old) { PCS.removeComp(old); }
  var oldScreen = PCS.findItem(name + ' screen'); if (oldScreen) { oldScreen.remove(); }
  var S = PCS.S;
  // the stand-in screen: a dashboard with a header, a side list, a bar chart and a button
  var scr = app.project.items.addComp(name + ' screen', 1280, 800, 1, 4, 30);
  scr.bgColor = S.ink;
  var soft = PCS.mix(S.ink, S.quiet, 0.28);
  function box(nm, x, y, w, h, r, col) {
    var L = scr.layers.addShape(); L.name = nm;
    var g = L.property('ADBE Root Vectors Group').addProperty('ADBE Vector Group').property('ADBE Vectors Group');
    var rc = g.addProperty('ADBE Vector Shape - Rect'); rc.property('ADBE Vector Rect Size').setValue([w, h]); rc.property('ADBE Vector Rect Roundness').setValue(r);
    g.addProperty('ADBE Vector Graphic - Fill').property('ADBE Vector Fill Color').setValue(col);
    PCS.TG(L).property('ADBE Position').setValue([x + w / 2, y + h / 2]);
    return L;
  }
  box('page', 0, 0, 1280, 800, 0, S.ink);
  box('header', 0, 0, 1280, 96, 0, S.surface);
  box('header dot', 40, 30, 36, 36, 18, S.accent);
  box('header title', 100, 38, 260, 20, 10, S.ink);
  box('side', 0, 96, 300, 704, 0, soft);
  for (var i = 0; i < 6; i++) { box('side item ' + (i + 1), 36, 150 + i * 80, 200 - (i % 3) * 40, 22, 11, i === 1 ? S.accent : S.quiet); }
  var hs = [180, 260, 220, 340, 300, 420];
  for (var b = 0; b < hs.length; b++) { box('bar ' + (b + 1), 380 + b * 120, 640 - hs[b], 78, hs[b], 12, b === hs.length - 1 ? S.accent : S.quiet); }
  box('axis', 360, 650, 760, 6, 3, S.surface);
  box('button', 900, 130, 240, 70, 35, S.accent);
  box('card line 1', 380, 140, 380, 24, 12, S.surface);
  box('card line 2', 380, 184, 260, 18, 9, S.quiet);

  var st = PCS.stage({ name: name, duration: 2 }); var c = st.comp;
  var tablet = PCS.plate(c, { name: 'tablet', w: 860, h: 560, round: 46, pos: [500, 560, 0], tilt: [6, -16] });
  PCS.pictureFace(tablet, { source: scr, inset: 22 });
  var phone = PCS.plate(c, { name: 'phone', w: 300, h: 600, round: 52, pos: [850, 980, -160], tilt: [4, -22] });
  PCS.pictureFace(phone, { source: scr, inset: 16 });
  return { comp: name, id: c.id, frame: 1.0, warnings: PCS.warnings };
}

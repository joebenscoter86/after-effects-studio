// piece: rows
// name: Raised rows of content on a card
// does: Lays thin lit bars on a plate's face as lines of a log, a list or a document, each growing in from the left in turn, with an optional tick before each.
// use it for: evidence on a card: a test log, a checklist, a receipt, a document, a list that fills as it is read
// job: list-items; support: show-proof, make-concrete
// provides: motion: stagger; depth: extrusion
// works with: piece-plate, piece-tick, piece-stand-up
// call: PCS.rows(comp, plate, { n, widths, left, top, rowWidth, h, gap, color, ticks, t, stagger })
// option n: how many rows, default 3
// option widths: each row's share of rowWidth (0 to 1), default [0.86, 0.62, 0.94, 0.5, 0.78, 0.7], repeating
// option left, top: where the first row starts, from the plate's centre (default left = -rowWidth / 2, top = 0: the first row on the plate's middle line, the rest below it)
// option rowWidth: the longest row's width, default 70 percent of the plate's width; with ticks, the rows start 2.2 x h to the right of left, after the tick
// option h, gap: row height, default 22, and the space between rows, default 34, so row i sits at top + i x (h + gap) and n rows take n x h + (n - 1) x gap
// option color: default a tone between the style's surface and ink
// option ticks: true puts a small tick before each row
// option t, stagger: the first row grows in at t, the next one stagger seconds later (default 0.09); each row grows from its left over 0.22 s and its tick pops in with it, so the last row is in at t + (n - 1) x stagger + 0.22; without t all show from the start
// returns: { rows, ticks }
// example:
//   var card = PCS.plate(st.comp, { name: 'card', w: 720, h: 470, round: 34, pos: [540, 900, 0] });
//   PCS.rows(st.comp, card, { n: 3, left: -300, top: -150, rowWidth: 430, ticks: true, t: 3.1 });
// ---
PCS.need('plate'); PCS.need('on-face'); PCS.need('tick');
PCS.rows = function (comp, plate, o) {
  var S = PCS.S; var n = o.n || 3; var h = o.h || 22; var gap = o.gap || 34;
  var W = o.rowWidth || (PCS.num(plate, 'w', 600) * 0.7);
  var widths = o.widths || [0.86, 0.62, 0.94, 0.5, 0.78, 0.7];
  var col = o.color || [(S.surface[0] + S.ink[0]) / 2, (S.surface[1] + S.ink[1]) / 2, (S.surface[2] + S.ink[2]) / 2];
  var left = (o.left === undefined) ? -W / 2 : o.left; var top = o.top || 0;
  var out = { rows: [], ticks: [] };
  for (var i = 0; i < n; i++) {
    var w = W * widths[i % widths.length]; var y = top + i * (h + gap);
    var x0 = left + (o.ticks ? h * 2.2 : 0);
    var R = PCS.plate(comp, { name: 'row ' + (i + 1), w: w, h: h, round: h / 2, color: col, depth: S.rowDepth || 6, bevel: S.rowBevel || 0, tilt: [0, 0] });
    PCS.onFace(R, plate, [x0 + w / 2, y], true);
    out.rows.push(R);
    var t = (o.t === undefined) ? undefined : o.t + i * (o.stagger === undefined ? 0.09 : o.stagger);
    if (t !== undefined) {
      var sc = PCS.TG(R).property('ADBE Scale'); var ap = PCS.TG(R).property('ADBE Anchor Point');
      ap.setValue([-w / 2, 0, 0]); PCS.TG(R).property('ADBE Position').setValue([x0, y, -6]);
      PCS.kf(sc, [[t, [0, 100, 100]], [t + 0.22, [100, 100, 100]]]);
    }
    if (o.ticks) {
      var K = PCS.tick(comp, { size: h * 2.4, color: S.ink, t: t, name: 'row tick ' + (i + 1) });
      PCS.onFace(K, plate, [left + h * 0.7, y]);
      out.ticks.push(K);
    }
  }
  return out;
};

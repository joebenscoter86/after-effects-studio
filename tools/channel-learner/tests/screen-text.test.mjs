import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, chmodSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { diffBoxes, diffRows, isTimeLike, isValueLike, readBoxes, toRows } from '../lib/screen-text.mjs';

const box = (t, x, y, c = 0.9, w = 0.03, h = 0.01) => ({ t, c, x, y, w, h });

test('diffBoxes: a value changing beside its label gives one labelled change', () => {
  const prev = [box('Amount', 0.10, 0.40), box('50.0', 0.20, 0.40)];
  const cur = [box('Amount', 0.10, 0.40), box('40.0', 0.20, 0.40)];
  assert.deepEqual(diffBoxes(prev, cur), [
    { kind: 'changed', text: '40.0', was: '50.0', label: 'Amount', x: 0.20, y: 0.40 },
  ]);
});

test('diffBoxes: a new row appears, a removed row is gone', () => {
  const prev = [box('Amount', 0.10, 0.40), box('Old row', 0.10, 0.60)];
  const cur = [box('Amount', 0.10, 0.40), box('Opacity', 0.10, 0.45), box('100%', 0.20, 0.45)];
  const changes = diffBoxes(prev, cur);
  assert.deepEqual(changes.filter((c) => c.kind === 'appeared').map((c) => [c.text, c.label]), [
    ['Opacity', undefined],
    ['100%', 'Opacity'],
  ]);
  assert.deepEqual(changes.filter((c) => c.kind === 'gone').map((c) => c.text), ['Old row']);
  assert.equal(changes.length, 3);
});

test('diffBoxes: low-confidence icon junk that flickers gives nothing (Review Focus 3)', () => {
  const prev = [box('Amount', 0.10, 0.40), box('**B00•', 0.05, 0.40, 0.3)];
  const cur = [box('Amount', 0.10, 0.40), box('*8O0', 0.05, 0.40, 0.3)];
  assert.deepEqual(diffBoxes(prev, cur), []);
  // and junk that comes and goes is not reported either
  assert.deepEqual(diffBoxes([box('Amount', 0.1, 0.4)], cur), []);
});

test('diffBoxes: boxes with fewer than two letters or digits are skipped', () => {
  const prev = [box('•', 0.30, 0.30), box('x', 0.40, 0.30)];
  const cur = [box('◆', 0.30, 0.30), box('y', 0.40, 0.30)];
  assert.deepEqual(diffBoxes(prev, cur), []);
});

test('diffBoxes: boxes inside an ignored rectangle give nothing', () => {
  const ignore = [{ x: 0.7, y: 0.0, w: 0.3, h: 0.5 }];
  const prev = [box('Buy now 20%', 0.75, 0.10)];
  const cur = [box('Buy now 30%', 0.75, 0.10), box('Limited', 0.80, 0.30)];
  assert.deepEqual(diffBoxes(prev, cur, { ignore }), []);
  assert.ok(diffBoxes(prev, cur).length > 0);
});

test('diffBoxes: a box shifted by less than posTol with the same text gives nothing', () => {
  const prev = [box('Layer Name', 0.10, 0.20)];
  const cur = [box('Layer Name', 0.104, 0.197)];
  assert.deepEqual(diffBoxes(prev, cur), []);
  // shifted beyond posTol it is a different box
  const far = [box('Layer Name', 0.12, 0.20)];
  assert.deepEqual(diffBoxes(prev, far).map((c) => c.kind).sort(), ['appeared', 'gone']);
});

function fakeOcr(dir) {
  const log = join(dir, 'calls.log');
  const script = join(dir, 'ocr');
  writeFileSync(
    script,
    `#!/bin/sh
echo "$#" >> "${log}"
for f in "$@"; do
  case "$f" in
    *bad*) printf '{"file":"%s","error":"load"}\\n' "$f" ;;
    *) printf '{"file":"%s","boxes":[{"t":"Poppins","c":1,"x":0.1,"y":0.2,"w":0.05,"h":0.01}]}\\n' "$f" ;;
  esac
done
`,
  );
  chmodSync(script, 0o755);
  return { script, log };
}

test('readBoxes: runs the binary in batches and keys boxes by the path given', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'screen-text-'));
  try {
    const { script, log } = fakeOcr(dir);
    const images = ['a.png', 'b.png', 'c.png', 'd.png', 'e.png'];
    const map = await readBoxes(script, images, { batch: 2 });
    assert.deepEqual([...map.keys()], images);
    assert.deepEqual(map.get('c.png'), [{ t: 'Poppins', c: 1, x: 0.1, y: 0.2, w: 0.05, h: 0.01 }]);
    assert.deepEqual(readFileSync(log, 'utf8').trim().split('\n'), ['2', '2', '1']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('readBoxes: an unreadable image is left out and the rest still come back', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'screen-text-'));
  try {
    const { script } = fakeOcr(dir);
    const map = await readBoxes(script, ['a.png', 'bad.png', 'c.png']);
    assert.deepEqual([...map.keys()], ['a.png', 'c.png']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('readBoxes: a binary that fails rejects', async () => {
  await assert.rejects(readBoxes('/bin/false', ['a.png']));
});

test('diffBoxes: a one-digit value changing beside its label is reported', () => {
  const prev = [box('Grid Spacing', 0.10, 0.50), box('3', 0.20, 0.50)];
  const cur = [box('Grid Spacing', 0.10, 0.50), box('7', 0.20, 0.50)];
  assert.deepEqual(diffBoxes(prev, cur), [
    { kind: 'changed', text: '7', was: '3', label: 'Grid Spacing', x: 0.20, y: 0.50 },
  ]);
});

test('diffBoxes: short values are kept, short icon junk is dropped', () => {
  const kept = ['3', '7', '0 %', '0%', '-50', '100.0', '0x+90.0°', '0x+45.0°', ' 12px '];
  const dropped = ['v', '+', 'Ф#/', '•', '%'];
  for (const t of kept) {
    assert.equal(diffBoxes([], [box(t, 0.5, 0.5)]).length, 1, `expected "${t}" kept`);
  }
  for (const t of dropped) {
    assert.equal(diffBoxes([], [box(t, 0.5, 0.5)]).length, 0, `expected "${t}" dropped`);
  }
});

test('diffBoxes: minConf defaults to 0.6, compared with >=', () => {
  assert.deepEqual(diffBoxes([], [box('*tt =', 0.5, 0.5, 0.5)]), []);
  assert.equal(diffBoxes([], [box('Opacity', 0.5, 0.5, 0.6)]).length, 1);
  assert.equal(diffBoxes([], [box('*tt =', 0.5, 0.5, 0.5)], { minConf: 0.5 }).length, 1);
});

// ---------- rows: label-keyed, position-free value tracking ----------

// A small made-up properties panel: label boxes on the left, value boxes on the right.
const panel = [
  ['Stroke Width', '12.0'],
  ['Line Cap', 'Butt Cap'],
  ['Dash', '0.0'],
  ['Gap', '0.0'],
];
// The same panel drawn at a zoom `s` and shifted by (dx, dy): every box scaled and moved.
function panelAt(values, s = 1, dx = 0, dy = 0) {
  const out = [];
  values.forEach(([label, value], i) => {
    const y = 0.5 + i * 0.03;
    out.push({ t: label, c: 1, x: dx + 0.2 * s, y: dy + y * s, w: 0.05 * s, h: 0.013 * s });
    out.push({ t: value, c: 1, x: dx + 0.32 * s, y: dy + (y + 0.001) * s, w: 0.02 * s, h: 0.013 * s });
  });
  return out;
}

test('toRows pairs each label with the nearest box to its right on the same row', () => {
  const rows = toRows(panelAt(panel));
  assert.deepEqual(rows.map((r) => [r.label, r.value]), panel);
  assert.equal(rows[0].x, 0.32);
});

test('toRows: a label with no box to its right within maxGap gives no row; a value is not also a label', () => {
  const boxes = [
    box('Lonely', 0.1, 0.2, 1, 0.04, 0.013),
    box('Far', 0.1, 0.3, 1, 0.03, 0.013), box('9.0', 0.6, 0.3, 1, 0.02, 0.013),
    box('Line Cap', 0.1, 0.4, 1, 0.04, 0.013), box('Round Cap', 0.2, 0.4, 1, 0.04, 0.013),
  ];
  assert.deepEqual(toRows(boxes).map((r) => [r.label, r.value]), [['Line Cap', 'Round Cap']]);
});

test('toRows trims icon marks and colons off labels and values', () => {
  const boxes = [
    box('• Stroke Width', 0.1, 0.2, 1, 0.05, 0.013), box('• 18.0', 0.2, 0.2, 1, 0.02, 0.013),
    box('v Ö Twist Angle', 0.1, 0.3, 1, 0.05, 0.013), box('0x +0.0°', 0.2, 0.3, 1, 0.02, 0.013),
    box('Stroke:', 0.1, 0.4, 1, 0.02, 0.013), box('18 px', 0.15, 0.4, 1, 0.02, 0.013),
  ];
  assert.deepEqual(toRows(boxes).map((r) => [r.label, r.value]), [
    ['Stroke Width', '18.0'], ['Twist Angle', '0x +0.0°'], ['Stroke', '18 px'],
  ]);
});

test('toRows: a box ending in a colon is a label, never the value of the label before it', () => {
  const boxes = [
    box('Fill:', 0.10, 0.03, 1, 0.01, 0.013),
    box('Stroke:', 0.13, 0.03, 1, 0.02, 0.013),
    box('18 px', 0.16, 0.03, 1, 0.02, 0.013),
  ];
  assert.deepEqual(toRows(boxes).map((r) => [r.label, r.value]), [['Stroke', '18 px']]);
});

test('toRows: timecodes, ruler ticks and viewer readouts give no rows (review d)', () => {
  const boxes = [
    box('Current Time', 0.05, 0.5, 1, 0.04, 0.015), box('0:00:04:00', 0.1, 0.5, 1, 0.04, 0.015),
    box('Frame', 0.05, 0.52, 1, 0.04, 0.013), box('00096 (23.976 fps)', 0.1, 0.52, 1, 0.06, 0.013),
    box('Ruler', 0.40, 0.6, 1, 0.03, 0.013), box('0:00f', 0.45, 0.6, 1, 0.02, 0.013),
    box('01:12f', 0.50, 0.6, 1, 0.02, 0.013), box('05:00f', 0.55, 0.6, 1, 0.02, 0.013),
    box('43.2 %', 0.19, 0.45, 1, 0.02, 0.013), box('Full', 0.24, 0.45, 1, 0.01, 0.013),
    box('+0.0', 0.40, 0.45, 1, 0.01, 0.013),
  ];
  assert.deepEqual(toRows(boxes), []);
});

test('isTimeLike', () => {
  for (const t of ['0:00:04:00', '00096 (23.976 fps)', '01:12f', '0:00f', '05:00f', '03;00f', '05:12f 06:00f', 'Full', 'Half', 'Quarter', 'Third']) {
    assert.equal(isTimeLike(t), true, t);
  }
  for (const t of ['Gap', '67.0', '100 %', '0x+90.0°', 'Full Screen', 'Round Cap', '12-13']) {
    assert.equal(isTimeLike(t), false, t);
  }
});

test('isValueLike', () => {
  for (const t of ['3', '67.0', '-75.0', '100 %', '0 %', '90°', '0x+90.0°', '0x +0.0°', '12px']) assert.equal(isValueLike(t), true, t);
  for (const t of ['Round Cap', 'Gap', 'Poppins', '%', 'v']) assert.equal(isValueLike(t), false, t);
});

test('diffRows: the same panel at another zoom and offset gives no changes (review a)', () => {
  const seen = new Map();
  diffRows(seen, toRows(panelAt(panel)));
  assert.deepEqual(diffRows(seen, toRows(panelAt(panel, 1.6, -0.12, -0.3))), []);
});

test('diffRows: Gap 0.0 then 67.0 across a zoom change is one changed (review b)', () => {
  const seen = new Map();
  diffRows(seen, toRows(panelAt(panel)));
  const after = panel.map(([l, v]) => [l, l === 'Gap' ? '67.0' : v]);
  const changes = diffRows(seen, toRows(panelAt(after, 1.3, 0.05, -0.1)));
  assert.equal(changes.length, 1);
  assert.deepEqual({ ...changes[0], x: 0, y: 0 }, { kind: 'changed', label: 'Gap', was: '0.0', text: '67.0', x: 0, y: 0 });
});

test('diffRows: two Opacity rows 100% and 100% becoming 100% and 0% is one changed (review c)', () => {
  const seen = new Map();
  const two = (a, b) => toRows([
    box('Opacity', 0.1, 0.30, 1, 0.03, 0.013), box(a, 0.2, 0.30, 1, 0.02, 0.013),
    box('Opacity', 0.1, 0.40, 1, 0.03, 0.013), box(b, 0.2, 0.40, 1, 0.02, 0.013),
  ]);
  diffRows(seen, two('100%', '100%'));
  const changes = diffRows(seen, two('100%', '0%'));
  assert.deepEqual(changes.map((c) => [c.kind, c.label, c.was, c.text]), [['changed', 'Opacity', '100%', '0%']]);
});

test('diffRows: a new label appears; a label off screen gives nothing and is still remembered (review e)', () => {
  const seen = new Map();
  const first = diffRows(seen, [{ label: 'Blur', value: '5.0', x: 0.3, y: 0.2 }]);
  assert.deepEqual(first, [{ kind: 'appeared', label: 'Blur', text: '5.0', x: 0.3, y: 0.2 }]);
  assert.deepEqual(diffRows(seen, [{ label: 'Angle', value: '45°', x: 0.3, y: 0.4 }]).map((c) => c.label), ['Angle']);
  assert.deepEqual(seen.get('Blur'), ['5.0']);
  assert.deepEqual(diffRows(seen, [{ label: 'Blur', value: '5.0', x: 0.1, y: 0.9 }]), []);
});

test('diffRows: a label whose value list grows reports only the new values as appeared', () => {
  const rows = ['None', 'None', 'Null 1'].map((v, i) => ({ label: 'Parent', value: v, x: 0.5, y: 0.1 * i }));
  const seen2 = new Map();
  diffRows(seen2, rows.slice(0, 1));
  assert.deepEqual(diffRows(seen2, rows).map((c) => [c.kind, c.text]), [['appeared', 'Null 1']]);
  assert.deepEqual(seen2.get('Parent'), ['None', 'None', 'Null 1']);
});

test('toRows: an icon read together with its value, or text that starts with a number, is not a label', () => {
  const row = (label, y) => [box(label, 0.10, y, 1, 0.03, 0.013), box('60 px', 0.15, y, 1, 0.02, 0.013)];
  const boxes = [
    ...row('IT 100 %', 0.1), ...row('rT 72 px', 0.2), ...row('8 bpc', 0.3), ...row('A$ 0 px', 0.4), ...row('12-13 Comp', 0.5),
    ...row('Stroke 1', 0.6), ...row('Shape Layer 2', 0.7),
  ];
  assert.deepEqual(toRows(boxes).map((r) => r.label), ['Stroke 1', 'Shape Layer 2']);
});

test('toRows: punctuation stuck to a word is trimmed; a value of one stray letter is no value', () => {
  const boxes = [
    box('•Gradient FX', 0.10, 0.2, 1, 0.04, 0.013), box('•None', 0.16, 0.2, 1, 0.02, 0.013),
    box('Light', 0.10, 0.3, 1, 0.03, 0.013), box('p.', 0.16, 0.3, 1, 0.01, 0.013),
  ];
  assert.deepEqual(toRows(boxes).map((r) => [r.label, r.value]), [['Gradient FX', 'None']]);
});

test('toRows: maxGap defaults to 0.13 of the frame width', () => {
  const at = (gap) => [box('Opacity', 0.10, 0.2, 1, 0.04, 0.013), box('50%', 0.14 + gap, 0.2, 1, 0.02, 0.013)];
  assert.equal(toRows(at(0.12)).length, 1);
  assert.equal(toRows(at(0.14)).length, 0);
  assert.equal(toRows(at(0.14), { maxGap: 0.3 }).length, 1);
});

test('toRows: switch-column glyphs, two-letter icons and menu-bar neighbours give no rows', () => {
  const row = (label, value, y) => [box(label, 0.10, y, 1, 0.04, 0.013), box(value, 0.16, y, 1, 0.02, 0.013)];
  const boxes = [
    ...row('Shadow', 'Ф#/fx', 0.10), ...row('Glow', 'P#/fx', 0.15), ...row('Ball Size', 'NºO', 0.20), ...row('Size', 'Zfх', 0.25),
    ...row('TT', '60 px', 0.30), ...row('VA', '27', 0.35), ...row('Effect', 'Animation', 0.40), ...row('View', 'Window', 0.45),
    ...row('Ball Size', '7.0', 0.50),
  ];
  assert.deepEqual(toRows(boxes).map((r) => [r.label, r.value]), [['Ball Size', '7.0']]);
});

test('toRows reads a rotation\'s revolutions O as 0', () => {
  const boxes = [box('Rotation', 0.10, 0.2, 1, 0.04, 0.013), box('Ox +90.0°', 0.16, 0.2, 1, 0.02, 0.013)];
  assert.deepEqual(toRows(boxes).map((r) => r.value), ['0x +90.0°']);
});

test('toRows: stopwatch and twirl marks read as O, vO or v• are trimmed; a run of menu names is no value', () => {
  const boxes = [
    box('O Twist Angle', 0.10, 0.2, 1, 0.04, 0.013), box('0.0', 0.16, 0.2, 1, 0.02, 0.013),
    box('vO Blur', 0.10, 0.3, 1, 0.04, 0.013), box('2.0', 0.16, 0.3, 1, 0.02, 0.013),
    box('v• Gap', 0.10, 0.4, 1, 0.04, 0.013), box('9.0', 0.16, 0.4, 1, 0.02, 0.013),
    box('Effect', 0.10, 0.5, 1, 0.02, 0.013), box('Animation View Window Help', 0.13, 0.5, 1, 0.08, 0.013),
  ];
  assert.deepEqual(toRows(boxes).map((r) => [r.label, r.value]), [['Twist Angle', '0.0'], ['Blur', '2.0'], ['Gap', '9.0']]);
});

test('toRows + diffRows: misreadings of the same text are not changes; real value changes are', () => {
  const frame = (value) => toRows([box('Taper Mode', 0.10, 0.4, 0.95, 0.05, 0.013), box(value, 0.17, 0.4, 0.95, 0.05, 0.013)]);
  const changesFor = (readings) => {
    const seen = new Map();
    return readings.flatMap((v) => diffRows(seen, frame(v))).filter((c) => c.kind === 'changed').map((c) => [c.was, c.text]);
  };
  // junk: icon glyphs read differently, a stray letter, a colon read as "i"
  assert.deepEqual(changesFor(['fx', 'Zfx', 'Vfx', 'Zfx']), []);
  assert.deepEqual(changesFor(['VA O', 'VA', 'VA O']), []);
  assert.deepEqual(changesFor(['Above Next in Pt V', 'Above Next in P: V']), []);
  // a truncated reading of the same words
  assert.deepEqual(changesFor(['Sideways Motion', 'Sideways']), []);
  // keepers
  for (const [a, b] of [['0.0', '67.0'], ['100%', '0%'], ['Butt Cap', 'Round Cap'], ['Square', 'Ramp Up'],
    ['Characters', 'Words'], ['Standard', 'Brightest']]) {
    assert.deepEqual(changesFor([a, b]), [[a, b]], `${a} -> ${b}`);
  }
  // a dropped misreading still updates what was seen, so the next real change starts from it
  assert.deepEqual(changesFor(['Standard', 'Standord', 'Brightest']), [['Standord', 'Brightest']]);
});

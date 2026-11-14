import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, chmodSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { diffBoxes, readBoxes } from '../lib/screen-text.mjs';

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

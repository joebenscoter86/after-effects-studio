// Tests for the parts of the pieces check that do not need After Effects: which proofs it runs, the script it sends,
// how it reads a proof's still, and the comparison and its limits. The check itself runs on demand with After Effects
// open (node tools/pieces/check.mjs); it is not part of these tests.
//   node --test 'tools/pieces/tests/*.test.mjs'
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { proofNames, proofCode, stillPlan, compare, passes, reportLine, aeRunning, PIXEL_TOLERANCE, CHANGED_LIMIT, PROOFS } from '../check.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

test('check: runs every piece that has a proof scene, and every piece has one', () => {
  const pieces = fs.readdirSync(path.join(ROOT, 'plugin', 'library', 'pieces')).filter((f) => f.endsWith('.jsx') && f !== 'pcs-core.jsx').map((f) => f.slice(0, -4)).sort();
  assert.deepEqual(proofNames(), pieces);
  assert.ok(!proofNames().includes('styles'), 'the style proof is not a piece');
  for (const n of proofNames()) assert.ok(fs.existsSync(path.join(PROOFS, `${n}.jsx`)));
});

test('check: the script loads the core and the proof by forward-slash path and builds the proof in the style', () => {
  const code = proofCode('/lib', 'spot', 'house');
  assert.match(code, /\$\.evalFile\(File\("\/lib\/pieces\/pcs-core\.jsx"\)\);/);
  assert.match(code, /\$\.evalFile\(File\("\/lib\/pieces\/proof\/spot\.jsx"\)\);/);
  assert.match(code, /return PCS_PROOF\("house"\);$/);
});

test('check: a proof\'s still is one frame, a band of frames, or frames across', () => {
  assert.deepEqual(stillPlan({ frame: 1.2 }), { kind: 'frame', times: [1.2] });
  assert.deepEqual(stillPlan({ frames: [0.3, 1, 1.9], band: [300, 380] }), { kind: 'band', times: [0.3, 1, 1.9], band: [300, 380] });
  assert.deepEqual(stillPlan({ frames: [0.9, 1.75, 3.6], across: true }), { kind: 'across', times: [0.9, 1.75, 3.6] });
  assert.throws(() => stillPlan({ frames: [1, 2] }), /band|across/);
  assert.throws(() => stillPlan({}), /frame/);
});

const picture = (w, h, fill) => Buffer.alloc(w * h * 3, fill);

test('check: render noise passes; a changed patch past the limit fails and is boxed', () => {
  const w = 480; const h = 854;
  const a = picture(w, h, 40);
  const noisy = Buffer.from(a);
  for (let i = 0; i < noisy.length; i += 97) noisy[i] = 40 + PIXEL_TOLERANCE;          // every pixel within the tolerance
  const n = compare(a, noisy, w, h);
  assert.equal(n.changed, 0); assert.equal(n.box, null); assert.ok(passes(n));

  const patch = (side) => { const b = Buffer.from(a); for (let y = 100; y < 100 + side; y++) for (let x = 200; x < 200 + side; x++) b[(y * w + x) * 3 + 1] = 200; return b; };
  const small = compare(a, patch(15), w, h);                                               // 225 px: 0.05%
  assert.ok(passes(small), `a 15 px patch is ${(100 * small.changed).toFixed(3)}%`);
  const big = compare(a, patch(25), w, h);                                                 // 625 px: 0.15%
  assert.ok(!passes(big));
  assert.deepEqual(big.box, [200, 100, 25, 25]);
  assert.equal(big.max, 160);
  assert.match(reportLine('room', big, 2), /^FAIL room .*changed area x 200\.\.224, y 100\.\.124$/);
  assert.doesNotMatch(reportLine('room', small, 2), /changed area/);
});

test('check: the limits are the measured ones (tolerance 16 of 255, 0.1% of pixels)', () => {
  assert.equal(PIXEL_TOLERANCE, 16);
  assert.equal(CHANGED_LIMIT, 0.001);
  assert.throws(() => compare(Buffer.alloc(3), Buffer.alloc(6), 1, 1), /different sizes/);
});

test('check: After Effects cannot be open on a platform it does not run on', () => {
  assert.equal(aeRunning('linux'), false);
});

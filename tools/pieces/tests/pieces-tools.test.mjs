// Tests for the pieces' own tools: the light map generator, the stacked-still maker, and the shipped pieces' text.
//   node --test 'tools/pieces/tests/*.test.mjs'
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMap, encodeHDR, decodeHDR, meanRadiance, toRGBE, radianceAt, DEFAULT_OUT, BACKGROUND } from '../studio-strips.mjs';
import { stillArgs, acrossArgs } from '../still.mjs';
import { functionsOf } from '../../channel-learner/arsenal.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const PIECES = path.join(ROOT, 'plugin', 'library', 'pieces');

test('light map: encoding round-trips within RGBE precision', () => {
  const map = renderMap(64);
  const back = decodeHDR(encodeHDR(map));
  assert.equal(back.w, 64); assert.equal(back.h, 32);
  for (let i = 0; i < map.px.length; i += 3) {
    const top = Math.max(map.px[i], map.px[i + 1], map.px[i + 2]);   // RGBE shares one exponent: error scales with the brightest channel
    for (let c = 0; c < 3; c++) assert.ok(Math.abs(map.px[i + c] - back.px[i + c]) <= Math.max(1e-6, top / 128), `pixel value ${i + c}`);
  }
  assert.deepEqual(toRGBE(0, 0, 0), [0, 0, 0, 0]);
});

test('light map: the shipped file is what the generator makes at 512, small, and has the strip lights', () => {
  const shipped = fs.readFileSync(DEFAULT_OUT);
  assert.ok(shipped.length < 262144, 'under the package size limit for one file');
  assert.deepEqual(shipped, encodeHDR(renderMap(512)));
  const m = decodeHDR(shipped);
  assert.equal(m.w, 512); assert.equal(m.h, 256);
  const mean = meanRadiance(m);
  assert.ok(mean[0] > 0.3 && mean[0] < 0.5, `mean red ${mean[0]}`);
  assert.ok(radianceAt(1024, 400)[0] > 10, 'the warm key strip is bright');
  assert.deepEqual(radianceAt(700, 900), BACKGROUND, 'black between the lights');
  assert.ok(!/\/Users\//.test(shipped.toString('latin1')), 'no home path in the file');
});

test('stacked still: crops one band from each frame and stacks them with a line between', () => {
  const args = stillArgs(['a.png', 'b.png', 'c.png'], [300, 380], 'out.png');
  const filter = args[args.indexOf('-filter_complex') + 1];
  assert.match(filter, /^\[0:v\]crop=iw:380:0:300,pad=iw:ih\+6:0:0:0x3a3a40\[f0\];/);
  assert.match(filter, /\[2:v\]crop=iw:380:0:300\[f2\];\[f0\]\[f1\]\[f2\]vstack=inputs=3$/);
  assert.equal(args.at(-1), 'out.png');
  assert.throws(() => stillArgs(['a.png'], [0, 10], 'o.png'), /two or more frames/);
  const across = acrossArgs(['a.png', 'b.png'], 'o.png');
  assert.match(across[across.indexOf('-filter_complex') + 1], /hstack=inputs=2$/);
});

test('pieces: each file defines its functions once, and the move pieces cut with PCS.cutAt (a lone hold key holds for all time)', () => {
  const files = fs.readdirSync(PIECES).filter((n) => n.endsWith('.jsx') && n !== 'pcs-core.jsx');
  const owner = new Map();
  for (const f of files) {
    const fns = functionsOf(fs.readFileSync(path.join(PIECES, f), 'utf8'));
    assert.ok(fns.length, `${f} defines a PCS function`);
    for (const fn of fns) { assert.ok(!owner.has(fn), `PCS.${fn} in ${f} and ${owner.get(fn)}`); owner.set(fn, f); }
  }
  for (const f of ['hide.jsx', 'swap-face.jsx']) {
    const t = fs.readFileSync(path.join(PIECES, f), 'utf8');
    assert.match(t, /PCS\.cutAt\(/, f);
    assert.doesNotMatch(t, /PCS\.hold\([^)]*\[\[t, 0\]\]\)/, `${f} never sets a lone hold key`);
  }
  const core = fs.readFileSync(path.join(PIECES, 'pcs-core.jsx'), 'utf8');
  assert.match(core, /PCS\.num = function[^\n]*\(\^\|\\\\s\)/, "PCS.num reads 'h=' only at a word start, never the end of 'depth='");
});

test('pieces: every proof scene says how its still is made (one frame, a band of frames, or frames across)', () => {
  for (const f of fs.readdirSync(path.join(PIECES, 'proof')).filter((n) => n.endsWith('.jsx'))) {
    const t = fs.readFileSync(path.join(PIECES, 'proof', f), 'utf8');
    assert.match(t, /frame: [\d.]+|frames: \[[\d., ]+\], (band: \[\d+, \d+\]|across: true)/, f);
  }
});

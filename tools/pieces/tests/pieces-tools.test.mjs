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

// The fixes from the independent rebuild of the test beat (2026-11-24), each proved by render; these keep them in.
const piece = (n) => fs.readFileSync(path.join(PIECES, `${n}.jsx`), 'utf8');

test('spot: a pool on an object follows it, goes out with it, and stops before the wall behind it', () => {
  const t = piece('spot');
  assert.match(t, /\.expression = at \+ ' \+ ' \+ v3\(follow\.off\)/, 'the light position follows the object by expression');
  assert.match(t, /L\.active \? value \* L\.transform\.opacity \/ 100 : 0/, 'off while the object is hidden or out of its time');
  assert.match(t, /'ADBE Light Falloff Type', 2\)/, 'in front, the light falls off just past the object');
  assert.match(t, /var names = \['key', 'fill'\]/, 'dimKey dips the stage key and fill together');
  assert.match(t, /PCS\.num\(layer, 'hi'/, "the pool's strength follows the named colour's brightest channel");
  assert.match(piece('hide'), /layer instanceof LightLayer\) \{ layer\.outPoint = t;/, 'hideAfter ends a light');
});

test('moves: land-on finishes a running flip, stand-up hinges on its bottom edge, tip-away hides type before it squashes', () => {
  assert.match(piece('land-on'), /r\.keyValue\(r\.numKeys\) : cur;\s+\/\/ where a running flip was going/);
  assert.match(piece('land-on'), /still moves after the landing ends/);
  const su = piece('stand-up');
  assert.match(su, /\/\/ option hinge: 'bottom' \(default\)/);
  assert.match(su, /PCS\.hold\(A, \[\[0, local\], \[until, a\]\]\)/, 'the hinge returns to the middle once it has settled');
  assert.match(piece('tip-away'), />= 50\) \{ cut = tf; break; \}/);
  assert.match(piece('swap-face'), /PCS\.showFrom\(/, 'the new face stays hidden until the swap even after a stand-up revealed it');
});

test('words: placed by pos or under an object, centred on what is shown, and the holder stays free to move', () => {
  const t = piece('words');
  for (const o of ['pos', 'under', 'centre']) assert.match(t, new RegExp(`// option ${o}:`), o);
  assert.match(t, /; below: space between/);
  assert.match(t, /C\.parent = H;/, 'the centring is on an inner null, not the holder');
  assert.doesNotMatch(t, /PCS\.kf\(PCS\.TG\(H\)/, "the holder's own position is never keyed");
});

test('styles: the house tune is recoverable as house-previous, and the other styles keep their old look', () => {
  const read = (n) => JSON.parse(fs.readFileSync(path.join(PIECES, 'styles', `${n}.json`), 'utf8'));
  const h = read('house');
  assert.deepEqual(h.previous.values, { fillIntensity: 80, depth: 36, bevel: 4, fillReach: 0, litCap: 0, rowDepth: 6, rowBevel: 0, quiet: [0.34, 0.35, 0.4], typeLit: 0 });
  assert.deepEqual([h.values.ground, h.values.surface, h.values.ink, h.values.accent], [[0.063, 0.063, 0.071], [0.2, 0.2, 0.225], [0.949, 0.933, 0.894], [1, 0.373, 0.243]], "the house's four colours stay");
  for (const n of ['dark-keynote', 'example-night-glass', 'example-warm-paper', 'glass-product']) {
    const v = read(n).values;
    assert.deepEqual([v.fillReach, v.litCap, v.rowDepth, v.rowBevel, v.typeLit], [0, 0, 6, 0, 0], `${n} keeps the old behaviour`);
  }
  assert.match(piece('pcs-core'), /out\[block\.id \+ '-previous'\] = pv;/);
});

test('catalog: the stage carries the placing know-how a cold builder needs', () => {
  const t = piece('stage');
  for (const re of [/on screen in y 220 to 1180/, /no more than about a fifth of it empty/, /one hero per picture/, /comp y about 285 to 1230/, /PCS\.onScreen\(layer, null, t\)/, /type on a plate is flat/, /keeps a held picture alive/]) assert.match(t, re);
});

test('move: to a place and a size, eased, chainable, and the pool grows with it', () => {
  const t = piece('move');
  for (const o of ['t', 'dur', 'to', 'by', 'scale', 'overshoot']) assert.match(t, new RegExp(`// option ${o}:`), o);
  assert.match(t, /absolute \(100 is its own size/);
  assert.match(t, /if \(p\.keyTime\(k\) >= t - 0\.0005\) \{ p\.removeKey\(k\); \}/, 'keys before t are kept, so moves chain');
  assert.match(piece('spot'), /'ADBE Light Cone Angle'\)\.expression = 'var s = '/, "the pool's cone follows the object's scale");
  assert.match(piece('pcs-core'), /keyOutInterpolationType\(j\) === H \|\| p\.keyInInterpolationType\(j\) === H\) \{ continue; \}/, 'easing leaves held keys held');
  assert.ok(fs.existsSync(path.join(PIECES, 'proof', 'move.jsx')), 'it has a proof scene');
});

test('stage: replace rebuilds a comp in its place and refuses one used inside another', () => {
  const t = piece('stage');
  assert.match(t, /\/\/ option replace: true rebuilds the comp in its place/);
  assert.match(t, /PCS\.removeComp\(same\[r\]\)/);
  assert.match(t, /usedIn\.length\) \{ throw new Error/);
  assert.match(piece('pcs-core'), /PCS\.onScreen = function \(layer, local, t\)/);
});

test('get texts: rows states its defaults, land-on its absolute scale, stand-up takes hero words, type3d reads as cream', () => {
  const r = piece('rows');
  for (const re of [/default \[0\.86, 0\.62, 0\.94, 0\.5, 0\.78, 0\.7\]/, /row height, default 22/, /between rows, default 34/, /\(default 0\.09\)/, /over 0\.22 s/]) assert.match(r, re);
  assert.match(piece('land-on'), /absolute \(100 is its own size/);
  assert.match(piece('stand-up'), /a hero word from piece-type3d/);
  assert.match(piece('type3d'), /PCS\.typeColor\(o\.color\)/);
  const h = JSON.parse(fs.readFileSync(path.join(PIECES, 'styles', 'house.json'), 'utf8'));
  assert.ok(Array.isArray(h.values.typeLit), 'the house sets the colour a lit hero word needs to render cream');
});

// library/styles/whiteboard/tools/font.mjs
// node tools/font.mjs --in assets/fonts/EMSTech.json --out <cache>/font.json
// Turns the EMS Tech single-line font (OFL; strokes as flat [x, y, x, y, ...] arrays in font units, y up) into the table the AE module reads:
// units of cap height (cap = 1), y down, baseline at 0, each glyph's ink centred in its advance. Adds the few symbols the font lacks.
import fs from 'node:fs'; import path from 'node:path';
const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const inp = arg('in'), out = arg('out');
if (!inp || !out) { console.error('usage: node tools/font.mjs --in EMSTech.json --out font.json'); process.exit(2); }
const src = JSON.parse(fs.readFileSync(inp, 'utf8')).glyphs, CAP = 677, r3 = v => Math.round(v * 1000) / 1000, g = {};
for (const [ch, gl] of Object.entries(src)) {
  const xs = gl.s.flatMap(s => s.filter((_, i) => i % 2 === 0)), shift = xs.length ? gl.w / 2 - (Math.min(...xs) + Math.max(...xs)) / 2 : 0;
  g[ch] = { w: r3(gl.w / CAP), s: gl.s.map(s => s.map((v, i) => i % 2 === 0 ? r3((v + shift) / CAP) : r3(-v / CAP))) };
}
// hand-defined symbols in the same hand (cap units, y down): a tick and an arrow
g['✓'] = { w: .8, s: [[.08, -.42, .3, -.12, .76, -.86]] };
g['→'] = { w: 1, s: [[.06, -.4, .94, -.42], [.7, -.62, .94, -.42, .7, -.2]] };
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ name: 'EMS Tech', cap: 1, xh: r3(447 / CAP), g }));
console.log(`wrote ${Object.keys(g).length} glyphs to ${out}`);

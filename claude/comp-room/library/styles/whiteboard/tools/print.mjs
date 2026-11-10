// library/styles/whiteboard/tools/print.mjs
// node tools/print.mjs --in <frame.png> --out <cache>/print.png [--w 1000]
// The real frame as a glossy photo print to stick on the board: resized, a touch less contrast and a warm cast, as a print under room light.
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const inp = arg('in'), out = arg('out'), w = Number(arg('w', 1000));
if (!inp || !out) { console.error('usage: node tools/print.mjs --in frame.png --out print.png [--w 1000]'); process.exit(2); }
fs.mkdirSync(path.dirname(out), { recursive: true });
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', inp, '-vf', `scale=${w}:-2:flags=lanczos,eq=contrast=0.94:saturation=0.92:gamma=1.03,colorbalance=rm=0.03:bm=-0.03`, '-frames:v', '1', out], { encoding: 'utf8' });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
console.log('wrote ' + out);

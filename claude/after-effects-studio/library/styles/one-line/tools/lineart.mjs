// library/styles/one-line/tools/lineart.mjs
// node tools/lineart.mjs --in <frame.png> --out <cache>/lineart.png [--w 600]
// The real frame redrawn as ink lines on white: greyscale, a soft blur, edge detection, inverted, the lines thickened a touch.
// In the style the frame is never a photo; it is more of the one line.
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const inp = arg('in'), out = arg('out'), w = Number(arg('w', 600));
if (!inp || !out) { console.error('usage: node tools/lineart.mjs --in frame.png --out lineart.png [--w 600]'); process.exit(2); }
fs.mkdirSync(path.dirname(out), { recursive: true });
const vf = `scale=${w}:-2:flags=lanczos,format=gray,gblur=sigma=1.3,edgedetect=low=0.06:high=0.18:mode=wires,negate,erosion,gblur=sigma=0.6`;
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', inp, '-vf', vf, '-frames:v', '1', out], { encoding: 'utf8' });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
console.log('wrote ' + out);

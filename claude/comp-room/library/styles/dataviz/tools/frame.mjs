// library/styles/dataviz/tools/frame.mjs
// The real frame as a small print to pin on the paper: scaled to --w px wide, colour toned down a little and warmed so it sits on cream.
// node tools/frame.mjs --in <png> --out <png> [--w 300]. Node 20+ and ffmpeg only.
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : undefined; };
const src = arg('in'), out = arg('out'), w = Number(arg('w') || 300);
if (!src || !out) { console.error('usage: node tools/frame.mjs --in <png> --out <png> [--w 300]'); process.exit(2); }
if (!fs.existsSync(src)) { console.error('missing ' + src); process.exit(1); }
fs.mkdirSync(path.dirname(out), { recursive: true });
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', `scale=${w}:-2:flags=lanczos,eq=saturation=0.78:contrast=0.96,colorbalance=rs=0.04:bs=-0.05:rm=0.03:bm=-0.04`, '-frames:v', '1', out], { encoding: 'utf8' });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
console.log('print -> ' + out);

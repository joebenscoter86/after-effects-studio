// library/styles/microgame/tools/frame.mjs
// The real frame, filled to the game screen's size (--w by --h, cropped to cover, centred). The module pixelates, tiles and nests it natively.
// node tools/frame.mjs --in <png> --out <png> [--w 1080 --h 1920]. Node 20+ and ffmpeg only.
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : undefined; };
const src = arg('in'), out = arg('out'), w = Number(arg('w') || 1080), h = Number(arg('h') || 1920);
if (!src || !out) { console.error('usage: node tools/frame.mjs --in <png> --out <png> [--w 1080 --h 1920]'); process.exit(2); }
if (!fs.existsSync(src)) { console.error('missing ' + src); process.exit(1); }
fs.mkdirSync(path.dirname(out), { recursive: true });
const vf = `scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${w}:${h}`;
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', vf, '-frames:v', '1', out], { encoding: 'utf8' });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
console.log('frame -> ' + out);

// library/styles/living-screencast/tools/frame.mjs
// The real frame, sized for the app's viewer pane: scaled to --w px wide (aspect kept), nothing else. The UI draws its corners and shadow.
// node tools/frame.mjs --in <png> --out <png> [--w 540]. Node 20+ and ffmpeg only.
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : undefined; };
const src = arg('in'), out = arg('out'), w = Number(arg('w') || 540);
if (!src || !out) { console.error('usage: node tools/frame.mjs --in <png> --out <png> [--w 540]'); process.exit(2); }
if (!fs.existsSync(src)) { console.error('missing ' + src); process.exit(1); }
fs.mkdirSync(path.dirname(out), { recursive: true });
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', `scale=${w}:-2:flags=lanczos`, '-frames:v', '1', out], { encoding: 'utf8' });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
console.log('frame -> ' + out);

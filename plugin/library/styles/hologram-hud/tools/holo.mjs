// library/styles/hologram-hud/tools/holo.mjs
// node tools/holo.mjs --in <frame.png> --out-frame <cache>/frame.png --out-lines <cache>/lines.png [--crop 912:640:84:1222]
// The real frame for the hologram: cropped to the webcam half, greyscale with lifted contrast (AE tints it in the hue), and its own
// line art (edges as white lines on black, additive in AE), the picture the carry beat turns the frame into. Node 20+ and ffmpeg only.
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const inp = arg('in'), outF = arg('out-frame'), outL = arg('out-lines'), crop = arg('crop', '912:640:84:1222');
if (!inp || !outF || !outL) { console.error('usage: node tools/holo.mjs --in frame.png --out-frame frame.png --out-lines lines.png [--crop w:h:x:y]'); process.exit(2); }
if (!fs.existsSync(inp)) { console.error('missing ' + inp); process.exit(1); }
for (const o of [outF, outL]) fs.mkdirSync(path.dirname(o), { recursive: true });
const run = (vf, out) => { const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', inp, '-vf', vf, '-frames:v', '1', out], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr); process.exit(1); } };
run(`crop=${crop},format=gray,eq=contrast=1.25:brightness=0.03:gamma=0.9,format=rgb24`, outF);
run(`crop=${crop},format=gray,gblur=sigma=1.4,edgedetect=low=0.05:high=0.16:mode=wires,dilation,format=rgb24`, outL);
console.log('frame -> ' + outF + '\nlines -> ' + outL);

// glass-product/tools/plates.mjs: file one Blender plate for After Effects.
// node tools/plates.mjs --shot <id> --frames <dir of 0001.png ...> --out <plate.mov> [--clip <scene clip>]
// The plate is the shot's PNG frames (tools/glass_scene.py) encoded once as ProRes 422 HQ at 30 fps. A plate already filed is kept, so
// a proof never re-renders; once the plate is filed the frames folder can go. Missing both: prints the Blender command that makes it.
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const LENGTH = { title: 39, picture: 52, input: 45, number: 52, line: 41, carry: 41, end: 54 };
const a = process.argv.slice(2), opt = {}; for (let i = 0; i < a.length; i += 2) opt[a[i].replace(/^--/, '')] = a[i + 1];
const n = LENGTH[opt.shot]; if (!n || !opt.frames || !opt.out) { console.error('usage: plates.mjs --shot <' + Object.keys(LENGTH).join('|') + '> --frames <dir> --out <plate.mov>'); process.exit(2); }
if (fs.existsSync(opt.out) && fs.statSync(opt.out).size > 0) process.exit(0);
const have = fs.existsSync(opt.frames) ? fs.readdirSync(opt.frames).filter(f => /^\d{4}\.png$/.test(f)).length : 0;
if (have < n) {
  const scene = path.join(path.dirname(fileURLToPath(import.meta.url)), 'glass_scene.py');
  console.error(`the ${opt.shot} plate is not rendered (${have} of ${n} frames in ${opt.frames}). Render it with Blender:\n` +
    `  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python ${scene} -- shot=${opt.shot} out=${opt.frames}` +
    (opt.shot === 'input' && opt.clip ? ` clip=${opt.clip}` : '') + (opt.shot === 'number' ? ' number=<the beat value>' : ''));
  process.exit(1);
}
fs.mkdirSync(path.dirname(opt.out), { recursive: true });
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '30', '-start_number', '1', '-i', path.join(opt.frames, '%04d.png'), '-frames:v', String(n),
  '-c:v', 'prores_ks', '-profile:v', '3', '-pix_fmt', 'yuv422p10le', opt.out], { encoding: 'utf8' });
if (r.status !== 0) { console.error('ffmpeg failed:\n' + r.stderr); process.exit(1); }

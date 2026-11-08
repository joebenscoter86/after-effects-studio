#!/usr/bin/env node
// library/styles/backrooms/tools/plates.mjs
// The rooms plate for one scene: renders tools/rooms.py with local Blender (EEVEE, 720x1280 on purpose: the VHS pass upscales it)
// and files it as one H.264 plus data.json (the TV screen's corners, blur and fog per frame; the blackouts and the tape tear).
// node tools/plates.mjs --scene <dir> --cache <dir> --out <cache>/plates.json [--cached-only] [--force]
// Cached in <cache>/plates-<key>/ by a hash of rooms.py, scene.json and the notice font: a matching cache returns at once. Render it
// by hand before building (a few minutes on an M5), so After Effects is not left waiting on it.
// Frames go to a scratch folder deleted once plates.mp4 is filed; an interrupted render resumes from the frames on disk.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), PKG = path.resolve(HERE, '..');
const a = process.argv.slice(2), opt = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; }, flag = k => a.includes(k);
const sceneDir = opt('--scene'), cache = opt('--cache'), out = opt('--out');
if (!sceneDir || !cache || !out) { console.error('usage: plates.mjs --scene <dir> --cache <dir> --out <json> [--cached-only] [--force]'); process.exit(2); }
const die = m => { console.error(m); process.exit(1); };
const sceneFile = path.join(sceneDir, 'scene.json'), scene = JSON.parse(fs.readFileSync(sceneFile, 'utf8'));
const rooms = path.join(HERE, 'rooms.py'), font = path.join(PKG, 'assets', 'fonts', 'BarlowSemiCondensed-SemiBold.ttf');
const key = crypto.createHash('sha1').update(fs.readFileSync(rooms)).update(fs.readFileSync(sceneFile)).update(fs.readFileSync(path.join(sceneDir, scene.words || 'words.json'))).update(fs.readFileSync(font)).digest('hex').slice(0, 10);
const dir = path.join(cache, `plates-${key}`), mp4 = path.join(dir, 'plates.mp4'), data = path.join(dir, 'data.json');
const done = () => fs.existsSync(mp4) && fs.existsSync(data);
if (flag('--force')) fs.rmSync(dir, { recursive: true, force: true });
if (!done()) {
  if (flag('--cached-only')) die(`the rooms plate is missing or stale: node ${path.join(HERE, 'plates.mjs')} --scene ${sceneDir} --cache ${cache} --out ${out}`);
  const blender = process.env.BLENDER || '/Applications/Blender.app/Contents/MacOS/Blender';
  if (!fs.existsSync(blender)) die(`Blender not found at ${blender} (set BLENDER)`);
  const frames = path.join(dir, 'frames'); fs.mkdirSync(frames, { recursive: true });
  console.error(`rendering the rooms plate into ${frames} (a few minutes)`);
  const r = spawnSync(blender, ['-b', '--factory-startup', '--python', rooms, '--', sceneFile, frames, `notice=${font}`], { encoding: 'utf8', maxBuffer: 2 ** 28, stdio: ['ignore', 'pipe', 'pipe'] });
  if (!/ROOMS DONE/.test(r.stdout || '')) die('Blender failed:\n' + String(r.stdout || '').split('\n').filter(l => /Error|Traceback|line /.test(l)).slice(-12).join('\n') + (r.stderr || '').slice(-2000));
  const n = Math.ceil(scene.duration * scene.fps), have = fs.readdirSync(frames).filter(f => /^f_\d{4}\.png$/.test(f)).length;
  if (have < n) die(`only ${have} of ${n} frames rendered; rerun to resume`);
  const e = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(scene.fps), '-i', path.join(frames, 'f_%04d.png'), '-c:v', 'libx264', '-crf', '12', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-r', String(scene.fps), mp4], { encoding: 'utf8' });
  if (e.status !== 0) die('ffmpeg could not file the plate:\n' + e.stderr);
  fs.copyFileSync(path.join(frames, 'data.json'), data);
  fs.rmSync(frames, { recursive: true, force: true });
}
// keep only this key's plate
for (const d of fs.readdirSync(cache)) if (/^plates-/.test(d) && d !== `plates-${key}`) fs.rmSync(path.join(cache, d), { recursive: true, force: true });
fs.writeFileSync(out, JSON.stringify({ video: mp4, data, key, fps: scene.fps }));
console.log(out);

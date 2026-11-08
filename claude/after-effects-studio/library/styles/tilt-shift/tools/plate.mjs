// node tools/plate.mjs --scene <scene dir> --cache <dir> [--samples N] [--cached-only]
// The miniature town plate: tools/town.py rendered by local Blender (EEVEE, physical depth of field) into PNG frames, filed as one
// ProRes 4444 movie with alpha at <cache>/town.mov, plus <cache>/track.json. The frames are deleted once the movie is filed.
// Cached by a hash of town.py, the scene, its words and the digit font: a matching cache returns at once. Render it BEFORE proving
// (about 15 to 30 minutes on an M5), so After Effects is not left waiting on it.
// --cached-only fails instead of rendering (the second prepare entry, which only names track.json).
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), a = process.argv.slice(2), opt = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
const sceneDir = path.resolve(opt('--scene') || ''), cache = path.resolve(opt('--cache') || ''), samples = opt('--samples') || '48';
const BLENDER = process.env.BLENDER || '/Applications/Blender.app/Contents/MacOS/Blender';
const sceneFile = path.join(sceneDir, 'scene.json'); if (!fs.existsSync(sceneFile)) { console.error('no scene.json in ' + sceneDir); process.exit(1); }
const scene = JSON.parse(fs.readFileSync(sceneFile, 'utf8')), words = path.join(sceneDir, scene.words || 'words.json');
const font = path.join(HERE, '..', 'assets', 'fonts', 'BarlowSemiCondensed-SemiBold.ttf');
const h = crypto.createHash('sha1'); for (const f of [path.join(HERE, 'town.py'), sceneFile, words, font]) h.update(fs.readFileSync(f)); h.update(samples);
const hash = h.digest('hex'), mov = path.join(cache, 'town.mov'), stamp = path.join(cache, 'town.hash'), frames = path.join(cache, 'frames'), n = Math.ceil(scene.duration * scene.fps);
const complete = () => fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8') === hash && fs.existsSync(mov) && fs.statSync(mov).size > 1e6 && fs.existsSync(path.join(cache, 'track.json'));
if (complete()) { console.log(`plate cached (${n} frames)`); process.exit(0); }
if (a.includes('--cached-only')) { console.error(`the town plate is missing or stale: node ${path.join(HERE, 'plate.mjs')} --scene ${sceneDir} --cache ${cache}`); process.exit(1); }
// a partial render with this hash resumes (town.py skips finished frames); another hash starts over
fs.mkdirSync(cache, { recursive: true }); const pend = path.join(cache, 'town.hash.pending');
if (!fs.existsSync(pend) || fs.readFileSync(pend, 'utf8') !== hash) fs.rmSync(frames, { recursive: true, force: true });
fs.writeFileSync(pend, hash);
console.error(`rendering the town plate (${n} frames) with Blender; this takes a while`);
const r = spawnSync(BLENDER, ['-b', '--factory-startup', '--python', path.join(HERE, 'town.py'), '--', sceneFile, cache, `samples=${samples}`, `font=${font}`],
  { encoding: 'utf8', maxBuffer: 2 ** 30 });
if (r.status !== 0 || !/PLATE DONE/.test(r.stdout || '')) { console.error('Blender failed:\n' + (r.stdout || '').split('\n').filter(l => /Error|Traceback|line /.test(l)).slice(-12).join('\n') + (r.stderr || '').slice(-2000)); process.exit(1); }
const missing = Array.from({ length: n }, (_, i) => path.join(frames, String(i + 1).padStart(4, '0') + '.png')).filter(f => !fs.existsSync(f) || fs.statSync(f).size < 5000);
if (missing.length) { console.error(`${missing.length} frames missing after the render`); process.exit(1); }
const e = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(scene.fps), '-start_number', '1', '-i', path.join(frames, '%04d.png'), '-frames:v', String(n),
  '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-alpha_bits', '16', mov], { encoding: 'utf8' });
if (e.status !== 0) { console.error('ffmpeg failed:\n' + e.stderr); process.exit(1); }
fs.renameSync(pend, stamp); fs.rmSync(frames, { recursive: true, force: true });
console.log(`plate rendered (${n} frames) -> ${mov}`);

// node tools/plate.mjs --scene <scene dir> --cache <dir> [--samples N] [--cached-only]
// The island plate: tools/island.py rendered by Blender (local, EEVEE) into <cache>/plate/island_NNNN.png plus <cache>/track.json.
// Cached by a hash of island.py, the scene, its words and the font: a matching cache returns at once. Render it before proving
// (about 6 to 10 minutes on an M5), so After Effects is not left waiting on it.
// --cached-only fails instead of rendering (the second prepare entry, which only names track.json).
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), a = process.argv.slice(2), opt = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
const sceneDir = path.resolve(opt('--scene') || ''), cache = path.resolve(opt('--cache') || ''), samples = opt('--samples') || '32';
const BLENDER = process.env.BLENDER || '/Applications/Blender.app/Contents/MacOS/Blender';
const sceneFile = path.join(sceneDir, 'scene.json'); if (!fs.existsSync(sceneFile)) { console.error('no scene.json in ' + sceneDir); process.exit(1); }
const scene = JSON.parse(fs.readFileSync(sceneFile, 'utf8')), words = path.join(sceneDir, scene.words || 'words.json');
const font = path.join(HERE, '..', 'assets', 'fonts', 'Fredoka[wdth,wght].ttf');
const h = crypto.createHash('sha1'); for (const f of [path.join(HERE, 'island.py'), sceneFile, words, font]) h.update(fs.readFileSync(f)); h.update(samples);
const hash = h.digest('hex'), plate = path.join(cache, 'plate'), stamp = path.join(plate, '.hash'), n = Math.ceil(scene.duration * scene.fps);
const frame = i => path.join(plate, `island_${String(i).padStart(4, '0')}.png`);
const complete = () => fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8') === hash && fs.existsSync(path.join(cache, 'track.json')) &&
  Array.from({ length: n }, (_, i) => frame(i + 1)).every(f => fs.existsSync(f) && fs.statSync(f).size > 5000);
if (complete()) { console.log(`plate cached (${n} frames)`); process.exit(0); }
if (a.includes('--cached-only')) { console.error(`the island plate is missing or stale: node ${path.join(HERE, 'plate.mjs')} --scene ${sceneDir} --cache ${cache}`); process.exit(1); }
// a stale plate (another hash) is cleared first; a partial one with this hash resumes (island.py skips finished frames)
const prev = [stamp, stamp + '.pending'].filter(f => fs.existsSync(f)).map(f => fs.readFileSync(f, 'utf8'))[0];
if (prev !== hash) fs.rmSync(plate, { recursive: true, force: true });
fs.mkdirSync(plate, { recursive: true }); fs.writeFileSync(stamp + '.pending', hash);
console.error(`rendering the island plate (${n} frames) with Blender; this takes several minutes`);
const r = spawnSync(BLENDER, ['-b', '--factory-startup', '--python', path.join(HERE, 'island.py'), '--', sceneFile, cache, `samples=${samples}`, `font=${font}`],
  { encoding: 'utf8', maxBuffer: 2 ** 30 });
if (r.status !== 0 || !/PLATE DONE/.test(r.stdout || '')) { console.error('Blender failed:\n' + (r.stdout || '').split('\n').filter(l => /Error|Traceback|line /.test(l)).slice(-12).join('\n') + (r.stderr || '').slice(-2000)); process.exit(1); }
fs.renameSync(stamp + '.pending', stamp);
if (!complete()) { console.error('the plate render finished but frames are missing'); process.exit(1); }
console.log(`plate rendered (${n} frames)`);

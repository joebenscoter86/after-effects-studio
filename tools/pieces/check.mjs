// The pieces check: re-renders every piece's proof scene in After Effects and compares each with the still the catalog
// ships (plugin/library/arsenal/stills/piece-<name>.jpg). Run it on demand, and before a release (quality/release-criteria.md).
//
//   node tools/pieces/check.mjs [--only spot,room] [--style house] [--out <folder>] [--keep] [--accept]
//
// It needs After Effects open (any project), ffmpeg and the built server (plugin/runtime/dist/index.js); it is not part of the
// offline tests. When After Effects is not open it says so and stops with exit code 3, having changed nothing; it never
// starts After Effects itself. A full run of the 19 pieces takes about 40 seconds.
//
// For each piece it builds the proof comp, renders the frames the proof names, makes the still the same way the catalog
// did (one frame; or the band of several frames stacked; or frames side by side), cuts it to the catalog's size, and
// compares it with the shipped still. Comparison (see compare() below): a pixel has changed when one of its colour
// channels moved by more than 16 of 255; a piece fails when more than 0.1% of its pixels changed (about 400 pixels of
// the 480 x 854 still: a 20 x 20 patch). Every piece that fails is named, with a picture of saved | new | difference
// in the out folder. Why these numbers: two renders of the same proofs never moved a pixel by more than 16 on 2026-11-24
// (at most 20, in 0.001% of pixels), while the stills of two pieces cut before the light map changed differed in 0.6%
// and 1.1% of pixels past 16.
//
// The project is left as found: every item the run adds (proof comps, their layers' sources, imported light maps and
// pictures) is removed at the end, and the project is never saved. A proof replaces an earlier comp of its own name
// ('CR PIECE PROOF <piece> <style>'), so do not keep work in comps of that name.
//
// --accept writes the new stills as the saved ones (quality/renders/pieces/<name>.png and the catalog still) for the
// pieces checked, for when a piece was changed on purpose, and the first still of a new piece; then run
// `node tools/channel-learner/arsenal.mjs`.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stillArgs, acrossArgs } from './still.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const LIBRARY = path.join(ROOT, 'plugin', 'library');
export const PROOFS = path.join(LIBRARY, 'pieces', 'proof');
export const STILLS = path.join(LIBRARY, 'arsenal', 'stills');
const SERVER = path.join(ROOT, 'plugin', 'runtime', 'dist', 'index.js');
const STILL_WIDTH = 480;                 // the catalog's still width (tools/channel-learner/arsenal.mjs)

/** A pixel has changed when a channel moved by more than this (0..255). */
export const PIXEL_TOLERANCE = 16;
/** A piece fails when more than this share of its pixels changed. */
export const CHANGED_LIMIT = 0.001;

/** The pieces with a proof scene, in name order (styles.jsx is the style proof, not a piece's). */
export function proofNames(dir = PROOFS) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.jsx') && f !== 'styles.jsx').map((f) => f.slice(0, -4)).sort();
}

/** The ExtendScript that builds one piece's proof comp and returns what the proof says about its still. */
export function proofCode(library, name, style) {
  const q = (s) => JSON.stringify(s.split(path.sep).join('/'));
  return `$.evalFile(File(${q(`${library}/pieces/pcs-core.jsx`)})); $.evalFile(File(${q(`${library}/pieces/proof/${name}.jsx`)}));\n` +
    `return PCS_PROOF(${JSON.stringify(style)});`;
}

/** How a proof's still is made, from what PCS_PROOF returned: one frame, a stacked band, or frames side by side. */
export function stillPlan(r) {
  if (typeof r.frame === 'number') return { kind: 'frame', times: [r.frame] };
  if (!Array.isArray(r.frames) || r.frames.length < 2) throw new Error('a proof returns frame, or frames with band or across');
  if (r.across) return { kind: 'across', times: r.frames };
  if (Array.isArray(r.band) && r.band.length === 2) return { kind: 'band', times: r.frames, band: r.band };
  throw new Error('a proof with several frames returns band: [top, height] or across: true');
}

/**
 * Compares two pictures of the same size, as RGB bytes. Returns the share of pixels that changed (a channel moved by
 * more than `tolerance`), the mean change per channel (0..255), the largest, and the box holding the changed pixels.
 */
export function compare(a, b, width, height, tolerance = PIXEL_TOLERANCE) {
  if (a.length !== b.length || a.length !== width * height * 3) throw new Error('pictures of different sizes');
  let changed = 0; let sum = 0; let max = 0;
  let x0 = width; let y0 = height; let x1 = -1; let y1 = -1;
  for (let i = 0, p = 0; i < a.length; i += 3, p++) {
    const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]));
    sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    if (d > max) max = d;
    if (d > tolerance) {
      changed++;
      const x = p % width; const y = (p - x) / width;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  return { changed: changed / (width * height), mean: sum / a.length, max, box: x1 < 0 ? null : [x0, y0, x1 - x0 + 1, y1 - y0 + 1] };
}

/** Pass or fail for one comparison. */
export const passes = (c, limit = CHANGED_LIMIT) => c.changed <= limit;

/** One line of the report. */
export function reportLine(name, c, seconds) {
  const verdict = passes(c) ? 'pass' : 'FAIL';
  const where = c.box && verdict === 'FAIL' ? `  changed area x ${c.box[0]}..${c.box[0] + c.box[2] - 1}, y ${c.box[1]}..${c.box[1] + c.box[3] - 1}` : '';
  return `${verdict.padEnd(5)}${name.padEnd(14)}${(100 * c.changed).toFixed(2).padStart(6)}% of pixels changed  mean ${c.mean.toFixed(2).padStart(5)}  max ${String(c.max).padStart(3)}  ${seconds.toFixed(1)} s${where}`;
}

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg: ${r.stderr || r.error}`);
}

/** A picture's size and RGB bytes. */
function readRGB(file) {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  const [width, height] = probe.stdout.trim().split(',').map(Number);
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`ffmpeg could not read ${file}`);
  return { width, height, rgb: r.stdout };
}

/** saved | new | difference (brightened eight times), side by side. */
function diffPicture(saved, fresh, out) {
  ffmpeg(['-i', saved, '-i', fresh, '-filter_complex',
    '[0]format=rgb24,split[a][a2];[1]format=rgb24,split[b][b2];[a][b]blend=all_mode=difference,lutrgb=r=val*8:g=val*8:b=val*8[d];[a2][b2][d]hstack=inputs=3',
    '-frames:v', '1', out]);
}

/** Whether After Effects is running. macOS and Windows; elsewhere it cannot be open, so false. */
export function aeRunning(platform = process.platform) {
  if (platform === 'darwin') return spawnSync('pgrep', ['-x', 'After Effects']).status === 0;
  if (platform === 'win32') return /AfterFX\.exe/i.test(spawnSync('tasklist', ['/FI', 'IMAGENAME eq AfterFX.exe'], { encoding: 'utf8' }).stdout || '');
  return false;
}

/** The JSON a tool call returned (its first text part), or an error with the server's words. */
function payload(res) {
  const text = (res.content || []).find((x) => x.type === 'text')?.text ?? '';
  let j; try { j = JSON.parse(text); } catch { throw new Error(text || 'no reply'); }
  if (res.isError || j.ok === false) throw new Error(j.error?.message || j.error || j.message || text);
  return j;
}

async function main(argv) {
  const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
  const flag = (n) => argv.includes(n);
  const style = arg('--style', 'house');
  const all = proofNames();
  const only = arg('--only') ? arg('--only').split(',') : all;
  const unknown = only.filter((n) => !all.includes(n));
  if (unknown.length) { console.error(`no proof scene for: ${unknown.join(', ')}`); return 2; }
  const out = path.resolve(arg('--out', fs.mkdtempSync(path.join(os.tmpdir(), 'pieces-check-'))));
  fs.mkdirSync(out, { recursive: true });

  if (!fs.existsSync(SERVER)) { console.error('The server is not built: run `node plugin/scripts/build.mjs` first.'); return 2; }
  if (spawnSync('ffmpeg', ['-version']).status !== 0) { console.error('ffmpeg is not installed; the check needs it to make and compare stills.'); return 2; }
  if (!aeRunning()) {
    console.error('After Effects is not open. Open it (any project will do) and run the check again. Nothing was changed.');
    return 3;
  }

  const require = createRequire(path.join(ROOT, 'plugin', 'runtime', 'package.json'));
  const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
  const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
  const client = new Client({ name: 'pieces-check', version: '1' });
  await client.connect(new StdioClientTransport({
    command: process.execPath, args: [SERVER], cwd: path.dirname(path.dirname(SERVER)),
    env: { ...process.env, AE_MCP_ENABLE_EVAL: '1' }, stderr: 'ignore',
  }));
  const run = async (code) => payload(await client.callTool({ name: 'ae_do', arguments: { operation: 'eval.run', args: { code, rollback: false } } }, undefined, { timeout: 300000 }));
  const result = (j) => j.result ?? j.data?.result ?? j.data ?? j;

  const started = Date.now();
  let before;
  try {
    before = result(await run('var ids = []; for (var i = 1; i <= app.project.numItems; i++) { ids.push(app.project.item(i).id); } return { ids: ids };')).ids;
  } catch (e) {
    console.error(`After Effects is open but did not answer: ${e.message}`);
    await client.close(); return 3;
  }
  console.log(`Checking ${only.length} piece${only.length === 1 ? '' : 's'} in style "${style}" against the catalog's stills; pictures in ${out}`);

  const failed = []; const errors = [];
  try {
    for (const name of only) {
      const t0 = Date.now();
      try {
        const proof = result(await run(proofCode(LIBRARY, name, style)));
        const plan = stillPlan(proof);
        const stem = path.join(out, name);
        const frames = [];
        if (plan.times.length === 1) {
          payload(await client.callTool({ name: 'ae_render_frame', arguments: { compNameOrId: proof.id, time: plan.times[0], outPath: `${stem}-frame.png` } }, undefined, { timeout: 300000 }));
          frames.push(`${stem}-frame.png`);
        } else {
          const r = result(payload(await client.callTool({ name: 'ae_render_frame', arguments: { compNameOrId: proof.id, times: plan.times, outPath: `${stem}-frame.png` } }, undefined, { timeout: 300000 })));
          frames.push(...r.frames.map((f) => f.writtenTo));
        }
        const full = `${stem}.png`;
        if (plan.kind === 'frame') fs.copyFileSync(frames[0], full);
        else ffmpeg((plan.kind === 'band' ? stillArgs(frames, plan.band, full) : acrossArgs(frames, full)).slice(2));
        const fresh = `${stem}.jpg`;
        ffmpeg(['-i', full, '-vf', `scale=${STILL_WIDTH}:-2:flags=lanczos`, '-q:v', '4', fresh]);
        const saved = path.join(STILLS, `piece-${name}.jpg`);
        if (!fs.existsSync(saved) && flag('--accept')) {   // a new piece: its first still becomes the saved one
          fs.mkdirSync(path.join(ROOT, 'quality', 'renders', 'pieces'), { recursive: true });
          fs.copyFileSync(full, path.join(ROOT, 'quality', 'renders', 'pieces', `${name}.png`));
          fs.copyFileSync(fresh, saved);
          console.log(`NEW  ${name.padEnd(14)}no saved still yet: saved this one (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
          continue;
        }
        if (!fs.existsSync(saved)) throw new Error(`no saved still at plugin/library/arsenal/stills/piece-${name}.jpg`);
        const A = readRGB(saved); const B = readRGB(fresh);
        if (A.width !== B.width || A.height !== B.height) throw new Error(`the new still is ${B.width} x ${B.height}, the saved one ${A.width} x ${A.height}`);
        const c = compare(A.rgb, B.rgb, A.width, A.height);
        console.log(reportLine(name, c, (Date.now() - t0) / 1000));
        if (!passes(c)) { failed.push(name); diffPicture(saved, fresh, `${stem}-difference.png`); }
        if (flag('--accept')) {
          fs.mkdirSync(path.join(ROOT, 'quality', 'renders', 'pieces'), { recursive: true });
          fs.copyFileSync(full, path.join(ROOT, 'quality', 'renders', 'pieces', `${name}.png`));
          fs.copyFileSync(fresh, saved);
        }
      } catch (e) {
        errors.push(name);
        console.log(`ERROR${name.padEnd(14)}${String(e.message).split('\n')[0]}`);
      }
    }
  } finally {
    if (!flag('--keep')) {
      // Everything the run added, newest first; folders after their contents.
      const keep = JSON.stringify(before);
      await run(`var keep = ${keep}; var k = {}; for (var i = 0; i < keep.length; i++) { k[keep[i]] = 1; }\n` +
        'var mine = []; for (var j = 1; j <= app.project.numItems; j++) { var it = app.project.item(j); if (!k[it.id]) { mine.push(it); } }\n' +
        'mine.sort(function (a, b) { return (a instanceof FolderItem) - (b instanceof FolderItem) || b.id - a.id; });\n' +
        'for (var m = 0; m < mine.length; m++) { try { mine[m].remove(); } catch (e) {} }\n' +
        'return { removed: mine.length, items: app.project.numItems };').catch((e) => console.error(`could not remove the proof comps: ${e.message}`));
    }
    await client.close();
  }

  const total = (Date.now() - started) / 1000;
  const n = only.length - failed.length - errors.length;
  console.log(`\n${n} of ${only.length} pass in ${Math.floor(total / 60)} min ${Math.round(total % 60)} s.` +
    (failed.length ? ` Changed: ${failed.join(', ')} (saved | new | difference in ${out}).` : '') +
    (errors.length ? ` Could not check: ${errors.join(', ')}.` : ''));
  if (flag('--accept')) console.log('Saved the new stills; run `node tools/channel-learner/arsenal.mjs` to update the catalog.');
  return failed.length || errors.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.error(e.stack || e.message); process.exit(1); });
}

#!/usr/bin/env node
// Small comparison sheets for a proof, so a reviewer opens one 512-px picture instead of several
// full-size frames. run-stage.mjs makes them before every prove-review run.
//   node contact-sheet.mjs <proof/<n> folder>
// Writes in that folder:
//   sheet.png         the still pair: the tutorial's result above the build, each 512 wide
//   sheet-motion.png  when reference.mp4 and build.mov both exist: four moments (1/8, 3/8, 5/8 and 7/8
//                     of each clip), one per row, the tutorial left and the build right, each 256 wide
//   side-by-side.png and side-by-side.mp4: the full-size pairs for the owner (reviewers do not open them)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const SHEET_WIDTH = 512;
export const MOMENTS = [0.125, 0.375, 0.625, 0.875];

const even = (v) => Math.max(2, Math.round(v / 2) * 2);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Height of a cell `w` wide for a picture of size [pw, ph], kept between lo and hi. */
export const cellHeight = ([pw, ph], w, lo, hi) => even(clamp(w * (ph / pw || 9 / 16), lo, hi));

const cell = (i, w, h, name) =>
  `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=0x808080,setsar=1,format=rgb24[${name}]`;

export function stillSheetCommand({ ref, build, out, refSize, width = SHEET_WIDTH }) {
  const h = cellHeight(refSize, width, 144, 512);
  return ['-hide_banner', '-loglevel', 'error', '-y', '-i', ref, '-i', build,
    '-filter_complex', `${cell(0, width, h, 'a')};${cell(1, width, h, 'b')};[a][b]vstack=inputs=2[v]`,
    '-map', '[v]', '-frames:v', '1', out];
}

export function motionSheetCommand({ ref, build, out, refSize, refDur, buildDur, width = SHEET_WIDTH }) {
  const w = width / 2;
  const h = cellHeight(refSize, w, 72, 256);
  const cmd = ['-hide_banner', '-loglevel', 'error', '-y'];
  const f = [];
  MOMENTS.forEach((s, k) => {
    cmd.push('-ss', (s * refDur).toFixed(3), '-i', ref, '-ss', (s * buildDur).toFixed(3), '-i', build);
    f.push(cell(2 * k, w, h, `r${k}`), cell(2 * k + 1, w, h, `b${k}`), `[r${k}][b${k}]hstack=inputs=2[row${k}]`);
  });
  f.push(`${MOMENTS.map((_, k) => `[row${k}]`).join('')}vstack=inputs=${MOMENTS.length}[v]`);
  return [...cmd, '-filter_complex', f.join(';'), '-map', '[v]', '-frames:v', '1', out];
}

const sideBySideStill = (ref, build, out) => ['-hide_banner', '-loglevel', 'error', '-y', '-i', ref, '-i', build,
  '-filter_complex', '[0:v]scale=-2:540,setsar=1[a];[1:v]scale=-2:540,setsar=1[b];[a][b]hstack=inputs=2[v]',
  '-map', '[v]', '-frames:v', '1', out];
const sideBySideMovie = (ref, build, out) => ['-hide_banner', '-loglevel', 'error', '-y', '-i', ref, '-i', build,
  '-filter_complex', '[0:v]scale=-2:540,setsar=1,fps=30[a];[1:v]scale=-2:540,setsar=1,fps=30[b];[a][b]hstack=inputs=2:shortest=1[v]',
  '-map', '[v]', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-an', out];

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${(r.stderr || r.error?.message || '').trim().split('\n').slice(-2).join(' | ')}`);
}

export function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', file], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffprobe could not read ${file}`);
  const j = JSON.parse(r.stdout);
  return { width: j.streams?.[0]?.width, height: j.streams?.[0]?.height, duration: Number(j.format?.duration) || null };
}

/** Make every sheet for one proof folder. Throws when the reference or the build is missing. */
export async function makeProofSheets(dir, { run = ffmpeg, read = probe } = {}) {
  const p = (f) => path.join(dir, f);
  for (const f of ['reference.png', 'build.png']) {
    if (!fs.existsSync(p(f))) throw new Error(`${p(f)} is missing (references come from proofs/references.mjs, builds from prove-run)`);
  }
  const ref = read(p('reference.png'));
  run(stillSheetCommand({ ref: p('reference.png'), build: p('build.png'), out: p('sheet.png'), refSize: [ref.width, ref.height] }));
  run(sideBySideStill(p('reference.png'), p('build.png'), p('side-by-side.png')));
  const made = ['sheet.png', 'side-by-side.png'];
  if (fs.existsSync(p('reference.mp4')) && fs.existsSync(p('build.mov'))) {
    const rm = read(p('reference.mp4'));
    const bm = read(p('build.mov'));
    run(motionSheetCommand({ ref: p('reference.mp4'), build: p('build.mov'), out: p('sheet-motion.png'),
      refSize: [rm.width, rm.height], refDur: rm.duration || 1, buildDur: bm.duration || 1 }));
    run(sideBySideMovie(p('reference.mp4'), p('build.mov'), p('side-by-side.mp4')));
    made.push('sheet-motion.png', 'side-by-side.mp4');
  } else if (fs.existsSync(p('sheet-motion.png'))) {
    fs.rmSync(p('sheet-motion.png'));
  }
  return made;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!process.argv[2]) { console.error('usage: contact-sheet.mjs <proof/<n> folder>'); process.exit(2); }
  makeProofSheets(path.resolve(process.argv[2])).then((m) => console.log(m.join(' ')), (e) => { console.error(e.message); process.exit(1); });
}

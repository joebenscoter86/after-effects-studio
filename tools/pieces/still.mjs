// Makes a piece's catalog picture from several frames of its proof render, so a move reads in one picture: the same
// horizontal band of each frame stacked top to bottom in time order (--band), or whole frames side by side (--across)
// for a change of the whole picture, each with a thin line between.
//
//   node tools/pieces/still.mjs --band <top>,<height> --out quality/renders/pieces/<name>.png <frame1.png> <frame2.png> ...
//   node tools/pieces/still.mjs --across --out quality/renders/pieces/<name>.png <frame1.png> <frame2.png> ...
//
// The band is in frame pixels (1080 x 1920 proofs); the proof scene returns it as `band` (or `across: true`) with its `frames`.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** ffmpeg arguments that crop the band from each frame and stack them with a line of `gap` pixels between. */
export function stillArgs(frames, [top, height], out, { gap = 6, line = '0x3a3a40' } = {}) {
  if (frames.length < 2) throw new Error('a stacked still needs two or more frames');
  const parts = frames.map((_, i) => `[${i}:v]crop=iw:${height}:0:${top}${i < frames.length - 1 ? `,pad=iw:ih+${gap}:0:0:${line}` : ''}[f${i}]`);
  const filter = `${parts.join(';')};${frames.map((_, i) => `[f${i}]`).join('')}vstack=inputs=${frames.length}`;
  return ['-loglevel', 'error', '-y', ...frames.flatMap((f) => ['-i', f]), '-filter_complex', filter, '-frames:v', '1', out];
}

/** ffmpeg arguments that put whole frames side by side with a line of `gap` pixels between. */
export function acrossArgs(frames, out, { gap = 12, line = '0x3a3a40' } = {}) {
  if (frames.length < 2) throw new Error('a still across needs two or more frames');
  const parts = frames.map((_, i) => `[${i}:v]${i < frames.length - 1 ? `pad=iw+${gap}:ih:0:0:${line}` : 'null'}[f${i}]`);
  const filter = `${parts.join(';')};${frames.map((_, i) => `[f${i}]`).join('')}hstack=inputs=${frames.length}`;
  return ['-loglevel', 'error', '-y', ...frames.flatMap((f) => ['-i', f]), '-filter_complex', filter, '-frames:v', '1', out];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const take = (n) => { const i = argv.indexOf(n); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, 2); return v; };
  const ai = argv.indexOf('--across'); const across = ai >= 0; if (across) argv.splice(ai, 1);
  const band = (take('--band') ?? '').split(',').map(Number);
  const out = take('--out');
  if ((!across && (band.length !== 2 || band.some((n) => !Number.isFinite(n)))) || !out) {
    console.error('usage: node tools/pieces/still.mjs (--band <top>,<height> | --across) --out <file.png> <frames...>');
    process.exit(2);
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const r = spawnSync('ffmpeg', across ? acrossArgs(argv, out) : stillArgs(argv, band, out), { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
  console.log(out);
}

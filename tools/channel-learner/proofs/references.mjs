#!/usr/bin/env node
// Cut each recipe's "result" (the tutorial's own finished picture) out of the source video, for comparing with a build.
//   node references.mjs <study dir> [--fps <rate>]
// The frame rate is <study>/state.json's video.fps unless --fps is given.
// Reads <study>/recipes/*.md, writes <study>/proof/<n>/reference.png and, for animated results, reference.mp4.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const even = (v) => v - (v % 2);

/**
 * Read a recipe's `result:` line. Returns null when there is none (or no crop), { skip: reason }
 * when it cannot be cut, else { start, end, animated, crop: [x, y, w, h] (all even), at }.
 * `at`, the time of the still, is taken from, in order: frame=f<digits> (divided by fps),
 * a scratch file named result-<seconds>.png, "cut at <seconds> s", the middle of start..end.
 */
export function parseResult(text, { fps } = {}) {
  const line = text.split('\n').find((l) => l.startsWith('result:'));
  if (!line) return null;
  const num = (re) => { const m = line.match(re); return m ? Number(m[1]) : null; };
  const crop = line.match(/crop=(\d+),(\d+),(\d+),(\d+)/);
  if (!crop) return null;
  const [x, y, w, h] = crop.slice(1).map(Number).map(even);
  if (w < 2 || h < 2) return { skip: `crop ${crop.slice(1).join(',')} is too small` };
  const start = num(/start=([\d.]+)/);
  const end = num(/end=([\d.]+)/);
  const frame = num(/frame=f(\d+)/);
  let at;
  if (frame !== null) {
    if (!(fps > 0)) return { skip: 'no frame rate to turn the frame number into a time' };
    at = frame / fps;
  } else {
    at = num(/result-(\d+(?:\.\d+)?)\.png/) ?? num(/cut (?:from \S+ )?at (\d+(?:\.\d+)?) ?s\b/);
    if (at === null && start !== null && end !== null) at = (start + end) / 2;
    if (at === null) return { skip: 'no time: no frame, start or end' };
  }
  return { start, end, animated: /\banimated\b/.test(line), crop: [x, y, w, h], at };
}

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  return r.status === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const study = process.argv[2];
  if (!study) { console.error('usage: references.mjs <study dir> [--fps <rate>]'); process.exit(2); }
  const fpsAt = process.argv.indexOf('--fps');
  const statePath = path.join(study, 'state.json');
  const fps = fpsAt > 0 ? Number(process.argv[fpsAt + 1])
    : fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')).video?.fps : undefined;
  const src = path.join(study, 'source.mp4');
  for (const f of fs.readdirSync(path.join(study, 'recipes')).filter((x) => x.endsWith('.md')).sort()) {
    const n = f.slice(0, 2);
    const res = parseResult(fs.readFileSync(path.join(study, 'recipes', f), 'utf8'), { fps });
    if (!res) { console.log(`${n}: no usable result line`); continue; }
    if (res.skip) { console.log(`${n}: skipped, ${res.skip}`); continue; }
    const [x, y, w, h] = res.crop;
    const dir = path.join(study, 'proof', n);
    fs.mkdirSync(dir, { recursive: true });
    const okStill = ffmpeg(['-ss', String(res.at), '-i', src, '-frames:v', '1', '-vf', `crop=${w}:${h}:${x}:${y}`, path.join(dir, 'reference.png')]);
    let okMovie = true;
    if (res.animated && res.start !== null && res.end !== null) {
      okMovie = ffmpeg(['-ss', String(res.start), '-t', String(res.end - res.start), '-i', src, '-vf', `crop=${w}:${h}:${x}:${y}`, '-an', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', path.join(dir, 'reference.mp4')]);
    }
    console.log(`${n}: ${res.animated ? 'animated' : 'still'} ${res.start}-${res.end}s still at ${res.at}s crop ${w}x${h}+${x}+${y} ${okStill && okMovie ? 'ok' : 'FAILED'}`);
  }
}

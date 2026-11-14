#!/usr/bin/env node
// Cut each recipe's "result" (the tutorial's own finished picture) out of the source video, for comparing with a build.
//   node references.mjs <study dir> [--fps 60]
// Reads <study>/recipes/*.md, writes <study>/proof/<n>/reference.png and, for animated results, reference.mp4.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export function parseResult(text) {
  const line = text.split('\n').find((l) => l.startsWith('result:'));
  if (!line) return null;
  const num = (re) => { const m = line.match(re); return m ? Number(m[1]) : null; };
  const crop = line.match(/crop=(\d+),(\d+),(\d+),(\d+)/);
  const frame = line.match(/frame=f(\d+)/);
  if (!crop) return null;
  return {
    start: num(/start=([\d.]+)/), end: num(/end=([\d.]+)/),
    animated: /\banimated\b/.test(line),
    crop: crop.slice(1).map(Number),
    frame: frame ? Number(frame[1]) : null,
  };
}

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  return r.status === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const study = process.argv[2];
  const fpsAt = process.argv.indexOf('--fps');
  const fps = fpsAt > 0 ? Number(process.argv[fpsAt + 1]) : 60;
  if (!study) { console.error('usage: references.mjs <study dir> [--fps 60]'); process.exit(2); }
  const src = path.join(study, 'source.mp4');
  for (const f of fs.readdirSync(path.join(study, 'recipes')).filter((x) => x.endsWith('.md')).sort()) {
    const n = f.slice(0, 2);
    const res = parseResult(fs.readFileSync(path.join(study, 'recipes', f), 'utf8'));
    if (!res) { console.log(`${n}: no usable result line`); continue; }
    const [x, y, w, h] = res.crop;
    const dir = path.join(study, 'proof', n);
    fs.mkdirSync(dir, { recursive: true });
    // crop needs even sizes for the movie
    const ew = w - (w % 2), eh = h - (h % 2);
    const at = res.frame !== null ? res.frame / fps : (res.start + res.end) / 2;
    const okStill = ffmpeg(['-ss', String(at), '-i', src, '-frames:v', '1', '-vf', `crop=${ew}:${eh}:${x}:${y}`, path.join(dir, 'reference.png')]);
    let okMovie = true;
    if (res.animated && res.start !== null && res.end !== null) {
      okMovie = ffmpeg(['-ss', String(res.start), '-t', String(res.end - res.start), '-i', src, '-vf', `crop=${ew}:${eh}:${x}:${y}`, '-an', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', path.join(dir, 'reference.mp4')]);
    }
    console.log(`${n}: ${res.animated ? 'animated' : 'still'} ${res.start}-${res.end}s crop ${ew}x${eh}+${x}+${y} ${okStill && okMovie ? 'ok' : 'FAILED'}`);
  }
}

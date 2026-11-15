#!/usr/bin/env node
// Put a crop of the tutorial's result (left) beside our build (right), as a still or a movie.
//   node side-by-side.mjs --ref <video> --crop x,y,w,h --at <s> --build <png> --out <png>
//   node side-by-side.mjs --ref <video> --crop x,y,w,h --start <s> --dur <s> --build <movie> --out <mp4> [--build-start <s>]
// --height sets the height of each half (default 540). The crop is in the reference video's own pixels.
import { spawnSync } from 'node:child_process';

function args(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i += 2) o[argv[i].replace(/^--/, '')] = argv[i + 1];
  return o;
}

export function sideBySideCommand(o) {
  const h = Number(o.height || 540);
  const [x, y, w, hh] = String(o.crop).split(',').map(Number);
  if (![x, y, w, hh].every(Number.isFinite)) throw new Error('--crop needs x,y,w,h');
  const still = o.at !== undefined;
  const left = `[0:v]crop=${w}:${hh}:${x}:${y},scale=-2:${h},setsar=1[l]`;
  const right = `[1:v]scale=-2:${h},setsar=1,format=yuv420p[r]`;
  const stack = `[l]format=yuv420p[l2];[l2][r]hstack=inputs=2[v]`;
  const cmd = ['-hide_banner', '-loglevel', 'error', '-y'];
  if (still) cmd.push('-ss', String(o.at), '-i', o.ref, '-i', o.build);
  else {
    cmd.push('-ss', String(o.start), '-t', String(o.dur), '-i', o.ref);
    if (o['build-start']) cmd.push('-ss', String(o['build-start']));
    cmd.push('-t', String(o.dur), '-i', o.build);
  }
  cmd.push('-filter_complex', `${left};${right};${stack}`, '-map', '[v]');
  if (still) cmd.push('-frames:v', '1');
  else cmd.push('-r', '30', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-an');
  cmd.push(o.out);
  return cmd;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const o = args(process.argv.slice(2));
  for (const k of ['ref', 'crop', 'build', 'out']) if (!o[k]) { console.error(`missing --${k}`); process.exit(2); }
  const r = spawnSync('ffmpeg', sideBySideCommand(o), { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}

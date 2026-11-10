#!/usr/bin/env node
// frame.mjs: a real image or video frame -> a colour PNG cropped and sized for the game-show polaroid card. Needs Node 20+ and ffmpeg. No npm packages.
// Flat style, so the frame is only cropped, scaled and lifted a little in saturation (it has to sit next to candy colours without looking grey).
//
//   node frame.mjs --in frame.png --out frame.png [--crop x,y,w,h] [--w 760 --h 540] [--sat 1.15] [--at 0]   (--at: a video frame's time)
import { spawnSync } from 'node:child_process';
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : A[i + 1]; };
const IN = arg('in'), OUT = arg('out'); if (!IN || !OUT) { console.error('usage: node frame.mjs --in <image|video> --out <file.png> [options]'); process.exit(2); }
const W = +arg('w', 760), H = +arg('h', 540), cr = arg('crop', null), c = cr ? cr.split(',') : null;
const vf = (c ? `crop=${c[2]}:${c[3]}:${c[0]}:${c[1]},` : '') + `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},eq=saturation=${arg('sat', 1.15)}`;
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(arg('at', 0)), '-i', IN, '-vf', vf, '-frames:v', '1', OUT], { encoding: 'utf8' });
if (r.status) { console.error('ffmpeg failed (is it installed?)\n' + r.stderr); process.exit(1); }
console.log(OUT);

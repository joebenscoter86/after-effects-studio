#!/usr/bin/env node
// print.mjs: a real image or video frame -> a flat greyscale photo module (PNG) for AESSwiss: cropped to the module, grey, a little contrast,
// the way a Swiss poster prints a photograph. Needs Node 20+ and ffmpeg. No npm packages.
//
//   node print.mjs --in frame.png --out photo.png [--crop x,y,w,h] [--w 936 --h 720] [--contrast 1.25] [--at 0]   (--at: a video frame's time)
import { spawnSync } from 'node:child_process';
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : A[i + 1]; };
const IN = arg('in'), OUT = arg('out'); if (!IN || !OUT) { console.error('usage: node print.mjs --in <image|video> --out <file.png> [options]'); process.exit(2); }
const W = +arg('w', 936), H = +arg('h', 720), cr = arg('crop', null), c = cr ? cr.split(',') : null;
const vf = (c ? `crop=${c[2]}:${c[3]}:${c[0]}:${c[1]},` : '') + `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},format=gray,eq=contrast=${arg('contrast', 1.25)}:brightness=0.02`;
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(arg('at', 0)), '-i', IN, '-vf', vf, '-frames:v', '1', OUT], { encoding: 'utf8' });
if (r.status) { console.error('ffmpeg failed (is it installed?)\n' + r.stderr); process.exit(1); }
console.log(OUT);

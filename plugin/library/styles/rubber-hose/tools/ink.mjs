#!/usr/bin/env node
// ink.mjs: real footage (or one still) -> a 1930s cartoon cel for AESRubberHose: grey only, flattened into a few flat grey steps (no gradient,
// like a painted cel), bright whites and ink blacks pushed apart, with thick ink contours multiplied over it. Sampled on twos (12 fps), so
// the footage moves like the drawn cast. Output is an mp4 at 12 fps, or a png when --still is given or --out ends in .png.
// Needs Node 20+ and ffmpeg. No npm packages.
//
//   node ink.mjs --in clip.mp4 --out ink.mp4 [--ss 4.0 --t 1.6] [--crop x,y,w,h] [--w 760 --h 540] [--steps 4] [--still]
import { spawnSync } from 'node:child_process';
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : A[i + 1]; }, flag = k => A.includes('--' + k);
const IN = arg('in'), OUT = arg('out'); if (!IN || !OUT) { console.error('usage: node ink.mjs --in <video|image> --out <file.mp4|file.png> [options]'); process.exit(2); }
const W = +arg('w', 760), H = +arg('h', 540), cr = arg('crop', null), c = cr ? cr.split(',') : null, steps = +arg('steps', 4);
const q = Math.round(256 / steps);                                                       // each band snaps to one flat grey, from ink to paper white
const flat = `lut=y='clip(floor(val/${q})*${Math.round(235 / (steps - 1))}+18\\,18\\,246)'`;
const pre = (c ? `crop=${c[2]}:${c[3]}:${c[0]}:${c[1]},` : '') + `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},`
  + 'format=gray,eq=contrast=1.2:brightness=0.1:gamma=1.9,gblur=sigma=1.4';
const graph = `[0:v]${pre},split[a][b];[a]gblur=sigma=3.2,${flat}[w];`
  + '[b]edgedetect=mode=wires:low=0.06:high=0.16,negate,erosion,erosion,gblur=sigma=0.7[e];'
  + '[w][e]blend=all_mode=multiply,format=yuv420p[o]';
const still = flag('still') || /\.png$/i.test(OUT);
const args = ['-v', 'error', '-y', '-ss', String(arg('ss', 0)), ...(still ? [] : ['-t', String(arg('t', 1.6))]), '-i', IN, '-filter_complex', graph, '-map', '[o]'];
if (still) args.push('-frames:v', '1'); else args.push('-r', '12', '-an', '-c:v', 'libx264', '-crf', '14', '-pix_fmt', 'yuv420p');
const r = spawnSync('ffmpeg', [...args, OUT], { encoding: 'utf8' });
if (r.status) { console.error('ffmpeg failed (is it installed?)\n' + r.stderr); process.exit(1); }
console.log(OUT);

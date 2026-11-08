#!/usr/bin/env node
// redraw.mjs: real footage (or one still) -> a period ink drawing for AESSilent: grey only, softened, luminance posterised into soft wash
// steps, with ink contours (edge wires, thickened) multiplied over it. AE's hatch pass then cross-hatches its darks, so footage and the
// drawn sets share one hand. Output is an mp4 at 16 fps (the hand-cranked rate) or a png when --still is given.
// Needs Node 20+ and ffmpeg. No npm packages.
//
//   node redraw.mjs --in clip.mp4 --out redraw.mp4 [--ss 4.0 --t 1.5] [--crop x,y,w,h] [--w 860 --h 980] [--steps 5] [--still]
import { spawnSync } from 'node:child_process';
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : A[i + 1]; }, flag = k => A.includes('--' + k);
const IN = arg('in'), OUT = arg('out'); if (!IN || !OUT) { console.error('usage: node redraw.mjs --in <video|image> --out <file.mp4|file.png> [options]'); process.exit(2); }
const W = +arg('w', 860), H = +arg('h', 980), cr = arg('crop', null), c = cr ? cr.split(',') : null, steps = +arg('steps', 5);
const q = Math.round(255 / steps);                                                     // wash steps: each band snaps to its middle grey
const wash = `lut=y='clip(floor(val/${q})*${q}+${Math.round(q / 2)}\\,14\\,240)'`;
const pre = (c ? `crop=${c[2]}:${c[3]}:${c[0]}:${c[1]},` : '') + `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},`
  + 'format=gray,eq=contrast=1.15:brightness=0.04:gamma=1.45,gblur=sigma=1.6';
const graph = `[0:v]${pre},split[a][b];[a]gblur=sigma=2.4,${wash}[w];`
  + '[b]edgedetect=mode=wires:low=0.05:high=0.14,negate,erosion,gblur=sigma=0.6[e];'
  + '[w][e]blend=all_mode=multiply,format=yuv420p[o]';
const still = flag('still') || /\.png$/i.test(OUT);
const args = ['-v', 'error', '-y', '-ss', String(arg('ss', 0)), ...(still ? [] : ['-t', String(arg('t', 1.5))]), '-i', IN, '-filter_complex', graph, '-map', '[o]'];
if (still) args.push('-frames:v', '1'); else args.push('-r', '16', '-an', '-c:v', 'libx264', '-crf', '14', '-pix_fmt', 'yuv420p');
const r = spawnSync('ffmpeg', [...args, OUT], { encoding: 'utf8' });
if (r.status) { console.error('ffmpeg failed (is it installed?)\n' + r.stderr); process.exit(1); }
console.log(OUT);

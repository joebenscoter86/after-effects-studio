#!/usr/bin/env node
// tone.mjs: real footage (or one still) -> a grey TONE plate for AESEngraving to engrave. Engraving wants a full tonal range (light is
// bare paper, mid tones one or two hatch families), so the frame is cropped, greyed, softened and pushed through a gentle curve (darks to
// about 0.1, skin to about 0.85), then a thin dark keep-line from the edges is multiplied over it. AE's three hatch families turn the tones into swelling lines.
// Output: an mp4 on twos (12 fps) or a png when --still is given. Needs Node 20+ and ffmpeg. No npm packages.
//
//   node tone.mjs --in clip.mp4 --out tone.mp4 [--ss 4.0 --t 1.5] [--crop x,y,w,h] [--w 952 --h 1074] [--curve "0/.04 .25/.14 .55/.52 .8/.86 1/.97"] [--still]
import { spawnSync } from 'node:child_process';
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : A[i + 1]; }, flag = k => A.includes('--' + k);
const IN = arg('in'), OUT = arg('out'); if (!IN || !OUT) { console.error('usage: node tone.mjs --in <video|image> --out <file.mp4|file.png> [options]'); process.exit(2); }
const W = +arg('w', 952), H = +arg('h', 1074), cr = arg('crop', null), c = cr ? cr.split(',') : null;
const curve = arg('curve', '0/0.04 0.25/0.14 0.55/0.52 0.8/0.86 1/0.97').split(' ').map(p => p.split('/').map(Number).join('/')).join(' ');
const pre = (c ? `crop=${c[2]}:${c[3]}:${c[0]}:${c[1]},` : '') + `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},`
  + `format=gray,gblur=sigma=1.4,curves=all='${curve}'`;
const graph = `[0:v]${pre},split[a][b];[b]edgedetect=mode=wires:low=0.08:high=0.2,negate,erosion,gblur=sigma=0.7,lut=y='clip(val+70\\,0\\,255)'[e];`
  + '[a][e]blend=all_mode=multiply,format=yuv420p[o]';
const still = flag('still') || /\.png$/i.test(OUT);
const args = ['-v', 'error', '-y', '-ss', String(arg('ss', 0)), ...(still ? [] : ['-t', String(arg('t', 1.5))]), '-i', IN, '-filter_complex', graph, '-map', '[o]'];
if (still) args.push('-frames:v', '1'); else args.push('-r', '12', '-an', '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p');
const r = spawnSync('ffmpeg', [...args, OUT], { encoding: 'utf8' });
if (r.status) { console.error('ffmpeg failed (is it installed?)\n' + r.stderr); process.exit(1); }
console.log(OUT);

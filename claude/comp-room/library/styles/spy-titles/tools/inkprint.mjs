#!/usr/bin/env node
// inkprint.mjs: a real image or video frame -> a flat three-ink cut-paper print (PNG) for AESSpy: cropped, softened, then every pixel
// snapped to one of three opaque inks (dark, mid, light) by its brightness, the way a spy title flattens a photograph into cut paper.
// Needs Node 20+ and ffmpeg. No npm packages.
//
//   node inkprint.mjs --in frame.png --out print.png [--crop x,y,w,h] [--w 600 --h 920] [--cuts 62,138] [--inks 1B1714,D23A22,EFE4C9] [--at 0]
import { spawnSync } from 'node:child_process';
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : A[i + 1]; };
const IN = arg('in'), OUT = arg('out'); if (!IN || !OUT) { console.error('usage: node inkprint.mjs --in <image|video> --out <file.png> [options]'); process.exit(2); }
const W = +arg('w', 600), H = +arg('h', 920), cr = arg('crop', null), c = cr ? cr.split(',') : null;
const [lo, hi] = arg('cuts', '62,138').split(',').map(Number), inks = arg('inks', '1B1714,D23A22,EFE4C9').split(',');
const ch = (hex, i) => parseInt(hex.substr(2 * i, 2), 16);
const lut = i => `if(lt(val\\,${lo})\\,${ch(inks[0], i)}\\,if(lt(val\\,${hi})\\,${ch(inks[1], i)}\\,${ch(inks[2], i)}))`;
const vf = (c ? `crop=${c[2]}:${c[3]}:${c[0]}:${c[1]},` : '') + `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},`
  + `format=gray,gblur=sigma=2.2,eq=contrast=1.3,format=rgb24,lutrgb=r='${lut(0)}':g='${lut(1)}':b='${lut(2)}',median=radius=2`;
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(arg('at', 0)), '-i', IN, '-vf', vf, '-frames:v', '1', OUT], { encoding: 'utf8' });
if (r.status) { console.error('ffmpeg failed (is it installed?)\n' + r.stderr); process.exit(1); }
console.log(OUT);

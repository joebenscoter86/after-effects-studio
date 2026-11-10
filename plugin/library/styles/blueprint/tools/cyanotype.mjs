#!/usr/bin/env node
// cyanotype.mjs: a real image or video frame -> one of two flat PNGs for AESBlueprint, cropped to the figure on the sheet.
//   --mode tone   the frame as a grey contact print (AE tints it and screens it onto the blue, so light areas bleach to white)
//   --mode trace  the frame's edges as white lines on black (AE adds it onto the blue, so it reads as line work drawn on the sheet)
// Needs Node 20+ and ffmpeg. No npm packages.
//
//   node cyanotype.mjs --in frame.png --out tone.png --mode tone [--crop x,y,w,h] [--w 840 --h 600] [--at 0]   (--at: a video frame's time)
import { spawnSync } from 'node:child_process';
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : A[i + 1]; };
const IN = arg('in'), OUT = arg('out'), MODE = arg('mode', 'tone');
if (!IN || !OUT || !['tone', 'trace'].includes(MODE)) { console.error('usage: node cyanotype.mjs --in <image|video> --out <file.png> --mode tone|trace [options]'); process.exit(2); }
const W = +arg('w', 840), H = +arg('h', 600), cr = arg('crop', null), c = cr ? cr.split(',') : null;
const fit = (c ? `crop=${c[2]}:${c[3]}:${c[0]}:${c[1]},` : '') + `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},format=gray`;
const vf = MODE === 'tone'
  ? `${fit},eq=contrast=1.35:brightness=0.04`
  : `${fit},gblur=sigma=1.6,edgedetect=low=${arg('low', 0.025)}:high=${arg('high', 0.07)}:mode=wires,dilation=threshold0=255,gblur=sigma=0.7,eq=contrast=1.6`;
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(arg('at', 0)), '-i', IN, '-vf', vf, '-frames:v', '1', OUT], { encoding: 'utf8' });
if (r.status) { console.error('ffmpeg failed (is it installed?)\n' + r.stderr); process.exit(1); }
console.log(OUT);

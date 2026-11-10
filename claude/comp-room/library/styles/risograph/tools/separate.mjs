#!/usr/bin/env node
// separate.mjs: a real image or video frame -> a plate separation (PNG) for AESRiso: an RGB image whose channels are ink densities, not colours
// (R = plate 1, G = plate 2, B = plate 3; 0 = no ink, 255 = solid). Plate 1 carries the shadows (it prints the photo alone), plate 2 a light
// tint over everything that is not paper (the skin), plate 3 stays empty, so no area of the photo uses more than two plates and one tint.
// The plate comps of AESRiso halftone it with the rest of the frame. Needs Node 20+ and ffmpeg. No npm packages.
//
//   node separate.mjs --in clip.mp4 --out photo.png [--at 4.6] [--crop x,y,w,h] [--w 860 --h 860]
//        [--shadow 0.18,0.62] (plate 1: solid below the first lightness, none above the second) [--tint 0.42] (plate 2's density at black)
import { spawnSync } from 'node:child_process';
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : A[i + 1]; };
const IN = arg('in'), OUT = arg('out'); if (!IN || !OUT) { console.error('usage: node separate.mjs --in <image|video> --out <file.png> [options]'); process.exit(2); }
const W = +arg('w', 860), H = +arg('h', 860), cr = arg('crop', null), c = cr ? cr.split(',') : null;
const [s0, s1] = arg('shadow', '0.18,0.62').split(',').map(Number), tint = +arg('tint', .42);
const vf = (c ? `crop=${c[2]}:${c[3]}:${c[0]}:${c[1]},` : '') + `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},gblur=sigma=0.8`;
const ff = spawnSync('ffmpeg', ['-v', 'error', '-ss', String(arg('at', 0)), '-i', IN, '-vf', vf, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 2 ** 28 });
if (ff.status || ff.stdout.length < W * H * 3) { console.error('ffmpeg failed (is it installed?)\n' + ff.stderr); process.exit(1); }
const src = ff.stdout, out = Buffer.alloc(W * H * 3), sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
for (let i = 0; i < W * H; i++) { const L = (.3 * src[i * 3] + .59 * src[i * 3 + 1] + .11 * src[i * 3 + 2]) / 255;
  out[i * 3] = Math.round(255 * sm((s1 - L) / (s1 - s0)));                 // plate 1: the shadows, solid in the darks
  out[i * 3 + 1] = Math.round(255 * tint * sm((.96 - L) / .5));             // plate 2: a light tint wherever the photo is not paper
  out[i * 3 + 2] = 0; }
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-i', '-', '-frames:v', '1', OUT], { input: out, maxBuffer: 2 ** 28 });
if (r.status) { console.error('ffmpeg failed writing the PNG\n' + r.stderr); process.exit(1); }
console.log(JSON.stringify({ out: OUT, w: W, h: H }));

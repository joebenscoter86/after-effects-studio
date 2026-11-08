#!/usr/bin/env node
// screen.mjs: one plate's halftone screen (a greyscale PNG the size of the frame) for AESRiso. A cosine spot function on a grid rotated to the
// plate's screen angle, stored as a threshold: dark at the dot centres, light between them. In the plate comp the screen is subtracted from the
// plate's density and Levels cuts the result, so a dot's area grows with the density and anything above ~92 percent prints solid.
// The screen is fixed to the paper, not to the drawing: a moving picture slides under it, as if every frame were printed anew.
// Needs Node 20+ and ffmpeg. No npm packages.
//
//   node screen.mjs --out screen.png [--w 1080 --h 1920] [--period 9] [--angle 15] [--lo 0.04 --hi 0.9]
import { spawnSync } from 'node:child_process';
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : A[i + 1]; };
const OUT = arg('out'); if (!OUT) { console.error('usage: node screen.mjs --out <file.png> [--w 1080 --h 1920 --period 9 --angle 15]'); process.exit(2); }
const W = +arg('w', 1080), H = +arg('h', 1920), P = +arg('period', 9), th = +arg('angle', 15) * Math.PI / 180, lo = +arg('lo', .04), hi = +arg('hi', .9);
const ct = Math.cos(th), st = Math.sin(th), k = 2 * Math.PI / P, buf = Buffer.alloc(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const u = (x + .5) * ct + (y + .5) * st, v = -(x + .5) * st + (y + .5) * ct, s = .5 + .25 * (Math.cos(k * u) + Math.cos(k * v));   // 1 at a dot centre
  buf[y * W + x] = Math.round(255 * (lo + (hi - lo) * (1 - s))); }
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', `${W}x${H}`, '-i', '-', '-frames:v', '1', OUT], { input: buf, maxBuffer: 2 ** 28 });
if (r.status) { console.error('ffmpeg failed (is it installed?)\n' + r.stderr); process.exit(1); }
console.log(JSON.stringify({ out: OUT, w: W, h: H, period: P, angle: +arg('angle', 15) }));

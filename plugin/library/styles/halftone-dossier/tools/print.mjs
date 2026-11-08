#!/usr/bin/env node
// print.mjs: a real image or video frame -> a two-ink overprinted halftone (RGB PNG on white, for a Multiply layer in AESDossier).
// The dark ink (navy, 45 degrees) carries the shadows; the overprint ink (cobalt, 15 degrees, nudged a few pixels as a misregistration)
// carries the midtones. Where both print they multiply, as offset inks do. Highlights print nothing. Needs Node 20+ and ffmpeg.
//
//   node print.mjs --in frame.png --out print.png [--crop x,y,w,h] [--w 600 --h 720] [--cell 9] [--ink 1E2A4A] [--over 2D4FC0] [--shift 3] [--at 0]
import { spawnSync } from 'node:child_process'; import fs from 'node:fs'; import { png, hex, args } from './png.mjs';
const arg = args(process.argv.slice(2)), IN = arg('in'), OUT = arg('out');
if (!IN || !OUT) { console.error('usage: node print.mjs --in <image|video> --out <file.png> [options]'); process.exit(2); }
const W = +arg('w', 600), H = +arg('h', 720), CELL = +arg('cell', 9), SHIFT = +arg('shift', 3), S = 3, cr = arg('crop', null), c = cr ? cr.split(',') : null;
const INK = hex(arg('ink', '1E2A4A')), OVER = hex(arg('over', '2D4FC0'));
const vf = (c ? `crop=${c[2]}:${c[3]}:${c[0]}:${c[1]},` : '') + `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},eq=contrast=1.35:brightness=0.05:gamma=1.1`;
const ff = spawnSync('ffmpeg', ['-v', 'error', '-ss', String(arg('at', 0)), '-i', IN, '-vf', vf, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 2 ** 28 });
if (ff.status) { console.error('ffmpeg failed (is it installed?)\n' + ff.stderr); process.exit(1); }
const src = ff.stdout, lum = new Float32Array(W * H);
for (let i = 0; i < W * H; i++) lum[i] = (.3 * src[i * 3] + .59 * src[i * 3 + 1] + .11 * src[i * 3 + 2]) / 255;
const BW = W * S, BH = H * S, buf = new Float32Array(BW * BH * 3).fill(1);           // white paper, ink multiplies in
// a dot layer: tone(l) -> density 0..1; every dot multiplies its ink into the buffer
function layer(tone, col, ang, dx, dy) { const th = ang * Math.PI / 180, ct = Math.cos(th), st = Math.sin(th), R = Math.ceil((W + H) / CELL) + 2, m = col.map(v => v / 255);
  for (let i = -R; i < R; i++) for (let j = -R; j < R; j++) { const x = (i * ct - j * st) * CELL + W / 2, y = (i * st + j * ct) * CELL + H / 2;
    if (x < 0 || y < 0 || x >= W || y >= H) continue; const v = tone(lum[(y | 0) * W + (x | 0)]); if (v <= .03) continue;
    const rad = CELL * S * .62 * Math.sqrt(v), cx = (x + dx) * S, cy = (y + dy) * S;
    for (let yy = Math.max(0, Math.floor(cy - rad)); yy <= Math.min(BH - 1, Math.ceil(cy + rad)); yy++)
      for (let xx = Math.max(0, Math.floor(cx - rad)); xx <= Math.min(BW - 1, Math.ceil(cx + rad)); xx++)
        if ((xx - cx) ** 2 + (yy - cy) ** 2 <= rad * rad) { const o = (yy * BW + xx) * 3; buf[o] *= m[0]; buf[o + 1] *= m[1]; buf[o + 2] *= m[2]; } } }
const clamp = v => Math.max(0, Math.min(1, v));
layer(l => clamp((.84 - l) / .84), OVER, 15, SHIFT, SHIFT);                     // overprint ink: everything but the highlights
layer(l => .88 * clamp((.42 - l) / .42), INK, 45, 0, 0);                                  // dark ink: the shadows
const out = Buffer.alloc(W * H * 3);                                                     // box-downsample S x S
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let k = 0; k < 3; k++) { let s = 0; for (let v = 0; v < S; v++) for (let u = 0; u < S; u++) s += buf[(((y * S + v) * BW) + x * S + u) * 3 + k]; out[(y * W + x) * 3 + k] = Math.round(255 * s / (S * S)); }
fs.writeFileSync(OUT, png(out, W, H, 3)); console.log(JSON.stringify({ out: OUT, w: W, h: H }));

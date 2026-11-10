#!/usr/bin/env node
// screen.mjs: a halftone screen for AESDossier (grey PNG). Each pixel holds its distance to the nearest dot centre of a rotated grid,
// divided by (k * step): 0 at a dot centre, 1 at the radius where a full-density dot ends. In After Effects a density field minus this
// screen (Subtract blend), pushed through Exposure, gives dots whose radius follows the density: the print screen of a real press.
// Needs Node 20+. No npm packages.
//
//   node screen.mjs --out screen.png [--w 1080 --h 1920] [--step 24] [--angle 45] [--k 0.72]
import fs from 'node:fs'; import { png, args } from './png.mjs';
const arg = args(process.argv.slice(2)), OUT = arg('out');
if (!OUT) { console.error('usage: node screen.mjs --out <file.png> [--w 1080 --h 1920 --step 24 --angle 45 --k 0.72]'); process.exit(2); }
const W = +arg('w', 1080), H = +arg('h', 1920), STEP = +arg('step', 24), K = +arg('k', .72), th = +arg('angle', 45) * Math.PI / 180;
const c = Math.cos(th), s = Math.sin(th), px = Buffer.alloc(W * H), cx = W / 2, cy = H / 2;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const dx = x + .5 - cx, dy = y + .5 - cy, u = (dx * c + dy * s) / STEP, v = (-dx * s + dy * c) / STEP;   // grid coordinates, centred on the frame
  const fu = u - Math.round(u), fv = v - Math.round(v), d = Math.sqrt(fu * fu + fv * fv) * STEP;
  px[y * W + x] = Math.round(255 * Math.min(1, d / (K * STEP))); }
fs.writeFileSync(OUT, png(px, W, H, 1)); console.log(JSON.stringify({ out: OUT, w: W, h: H, step: STEP }));

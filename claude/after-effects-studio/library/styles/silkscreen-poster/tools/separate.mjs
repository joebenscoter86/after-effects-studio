#!/usr/bin/env node
// separate.mjs: a real image or video frame -> one ink separation (RGBA PNG) for AESSilk: cropped, softened, and every pixel darker than the
// level's cut printed in that level's flat ink, the rest transparent. Run once per ink (--level 0, 1, 2 ...) and stack the results lightest
// first, so later (darker) inks cover earlier ones, the way a screen print lays one opaque ink per pull. Paper shows where no ink prints.
// Needs Node 20+ and ffmpeg. No npm packages.
//
//   node separate.mjs --in frame.png --out sep0.png --level 0 [--cuts 205,130,62] [--inks F6CD98,3E7079,1E3B3F]
//        [--crop x,y,w,h] [--w 928 --h 1048] [--soft 2.4] [--at 0]           (--at: the time of a video frame)
import { spawnSync } from 'node:child_process'; import zlib from 'node:zlib';
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : A[i + 1]; };
const IN = arg('in'), OUT = arg('out'); if (!IN || !OUT) { console.error('usage: node separate.mjs --in <image|video> --out <file.png> --level <n> [options]'); process.exit(2); }
const W = +arg('w', 928), H = +arg('h', 1048), L = +arg('level', 0), cuts = arg('cuts', '205,130,62').split(',').map(Number);
const inks = arg('inks', 'F6CD98,3E7079,1E3B3F').split(','), cut = cuts[L], ink = inks[L];
if (cut === undefined || !ink) { console.error(`level ${L} needs a cut and an ink`); process.exit(2); }
const rgb = [0, 2, 4].map(i => parseInt(ink.replace('#', '').slice(i, i + 2), 16)), cr = arg('crop', null), c = cr ? cr.split(',') : null;
const vf = (c ? `crop=${c[2]}:${c[3]}:${c[0]}:${c[1]},` : '') + `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},`
  + `format=gray,gblur=sigma=${arg('soft', 2.4)},eq=contrast=1.25,median=radius=2`;
const ff = spawnSync('ffmpeg', ['-v', 'error', '-ss', String(arg('at', 0)), '-i', IN, '-vf', vf, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 2 ** 28 });
if (ff.status || ff.stdout.length < W * H) { console.error('ffmpeg failed (is it installed?)\n' + ff.stderr); process.exit(1); }
// hard edges: a pixel prints or it does not (no anti-aliased ramp inside an ink, the stencil is binary)
const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) { const r = y * (W * 4 + 1); raw[r] = 0;
  for (let x = 0; x < W; x++) { const v = ff.stdout[y * W + x], o = r + 1 + x * 4; if (v < cut) { raw[o] = rgb[0]; raw[o + 1] = rgb[1]; raw[o + 2] = rgb[2]; raw[o + 3] = 255; } } }
const CRC = new Int32Array(256).map((_, n) => { let k = n; for (let j = 0; j < 8; j++) k = k & 1 ? 0xedb88320 ^ (k >>> 1) : k >>> 1; return k; });
const crc = b => { let k = -1; for (const x of b) k = CRC[(k ^ x) & 255] ^ (k >>> 8); return (k ^ -1) >>> 0; };
const chunk = (t, d) => { const tb = Buffer.from(t), len = Buffer.alloc(4), cc = Buffer.alloc(4); len.writeUInt32BE(d.length); cc.writeUInt32BE(crc(Buffer.concat([tb, d]))); return Buffer.concat([len, tb, d, cc]); };
const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6;
const fs = await import('node:fs');
fs.writeFileSync(OUT, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
console.log(OUT);

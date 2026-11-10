#!/usr/bin/env node
// glyphs.mjs: a video (or image) -> the CRT style's glyph pictures, baked per output frame, for AESCrt.glyphTiers().
// Needs Node 20+ and ffmpeg. No npm packages.
//
//   node glyphs.mjs --in clip.mp4 --out glyphs.json [--cols 120] [--rows-from 6 --rows-to 80] [--fps 24] [--start 0] [--dur 3.94]
//        [--cols-from 0 --cols-to <cols>] [--speed 1] [--cw 8.5] [--ink-on-light] [--accent-red] [--accent-box x0,y0,x1,y1] [--accent-from 4.40 --accent-to 4.66]
//
// --cols: cells across the source width; rows follow from the source aspect and the 1:2 cell. --rows-from/--rows-to keep a band of rows, --cols-from/--cols-to a band of columns (crop to one region of a layout).
// --ink-on-light: the source is dark ink on light paper, so ink becomes glyphs (phosphor draws light). Without it, light becomes glyphs.
// --accent-red: cells that are saturated red go to the accent tier (the style's one second colour); --accent-box limits that to a source
// rectangle and --accent-from/--accent-to to a source time window, so a red title elsewhere stays in the phosphor.
// Output: { fps, cw, cols, rows, n, dim: [str], mid: [str], bold: [str], accent: [str] }; each str joins the rows with "\r".
// The density ramp is VT323's measured ink coverage x dim / normal / bold (the reference engine's makeRamp), with its 4x4 ordered dither.
import { spawnSync } from 'node:child_process'; import fs from 'node:fs';
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : (A[i + 1] && !A[i + 1].startsWith('--') ? A[i + 1] : true); };
const IN = arg('in'), OUT = arg('out', 'glyphs.json'); if (!IN) { console.error('usage: node glyphs.mjs --in <video|image> --out glyphs.json [options]'); process.exit(2); }
const COLS = +arg('cols', 120), FPS = +arg('fps', 24), START = +arg('start', 0), SPEED = +arg('speed', 1), CW = +arg('cw', 8.5);
const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', IN], { encoding: 'utf8' });
if (probe.status) { console.error('ffprobe failed (is ffmpeg installed?)\n' + probe.stderr); process.exit(1); }
const P = JSON.parse(probe.stdout), SW = P.streams[0].width, SH = P.streams[0].height, SDUR = +(P.format.duration || 0);
const ROWS = Math.round(COLS * SH / SW / 2), R0 = +arg('rows-from', 0), R1 = +arg('rows-to', ROWS), DUR = +arg('dur', SDUR ? (SDUR - START) / SPEED : 1 / FPS);
const C0 = +arg('cols-from', 0), C1 = +arg('cols-to', COLS), CN = C1 - C0;
const N = Math.max(1, Math.round(DUR * FPS)), SX = 4, SY = 4, PW = COLS * SX, PH = ROWS * SY;
// one ffmpeg pass: the frames at the output rate (source time = START + k / FPS * SPEED), scaled to SX x SY samples per cell, raw RGB
const ff = spawnSync('ffmpeg', ['-v', 'error', '-ss', String(START), '-i', IN, '-t', String(N / FPS * SPEED), '-vf', `fps=${FPS / SPEED},scale=${PW}:${PH}:flags=area`, '-frames:v', String(N), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 2 ** 31 });
if (ff.status) { console.error('ffmpeg failed\n' + ff.stderr); process.exit(1); }
const FR = PW * PH * 3, got = Math.floor(ff.stdout.length / FR);
// the VT323 ramp (char, brightness) in increasing ink, measured once from the font (VT323, free from Google Fonts)
const RAMP = [[' ', 0], ['-', .42], ['-', .7], [':', .42], ['-', 1], ['+', .42], [':', .7], ['=', .7], [':', 1], ['=', 1], ['*', .7], ['+', 1], ['*', 1], ['%', .7], ['#', .7], ['@', .7], ['%', 1], ['#', 1], ['@', 1]];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16 - .5);
function pick(L, i, j, d = .6) { const n = RAMP.length - 1; let h = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; h -= Math.floor(h);
  const x = L * n + (BAYER[(j & 3) * 4 + (i & 3)] * .5 + (h - .5) * .5) * d * 1.6; return RAMP[Math.max(0, Math.min(n, Math.round(x)))]; }
const INK = !!arg('ink-on-light', false), RED = !!arg('accent-red', false), BOX = arg('accent-box', null), AF = +arg('accent-from', -1e9), AT = +arg('accent-to', 1e9);
const box = BOX ? BOX.split(',').map(Number) : [0, 0, SW, SH];
const out = { fps: FPS, cw: CW, cols: CN, rows: R1 - R0, n: N, dim: [], mid: [], bold: [], accent: [] };
for (let k = 0; k < N; k++) {
  const f = Math.min(k, got - 1), base = f * FR, tSrc = START + k / FPS * SPEED, accentOn = RED && tSrc >= AF && tSrc <= AT;
  const T = { dim: [], mid: [], bold: [], accent: [] };
  for (let j = R0; j < R1; j++) {
    const row = { dim: Array(CN).fill(' '), mid: Array(CN).fill(' '), bold: Array(CN).fill(' '), accent: Array(CN).fill(' ') };
    for (let i = C0; i < C1; i++) {
      let s = 0, red = 0;
      for (let v = 0; v < SY; v++) for (let u = 0; u < SX; u++) { const o = base + (((j * SY + v) * PW) + i * SX + u) * 3, r = ff.stdout[o] / 255, g = ff.stdout[o + 1] / 255, b = ff.stdout[o + 2] / 255;
        const lum = .3 * r + .59 * g + .11 * b; s += INK ? Math.max(0, Math.min(1, (.88 - lum) / .88)) : lum;
        if (accentOn && r > .55 && r - Math.max(g, b) > .32) { const x = (i + u / SX) / COLS * SW, y = (j + v / SY) / ROWS * SH; if (x >= box[0] && x <= box[2] && y >= box[1] && y <= box[3]) red++; } }
      const L = s / (SX * SY), isRed = red / (SX * SY) > .18;
      if (L < .07 && !isRed) continue;
      const [ch, a] = pick(Math.pow(Math.min(1, Math.max(0, isRed ? Math.max(L, .75) : L * 1.1)), 1.2), i, j);
      if (ch === ' ') continue;
      row[isRed ? 'accent' : a < .5 ? 'dim' : a < .9 ? 'mid' : 'bold'][i - C0] = ch;
    }
    for (const t in T) T[t].push(row[t].join('').replace(/ +$/, ''));
  }
  for (const t in T) out[t].push(T[t].join('\r'));
}
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(JSON.stringify({ out: OUT, frames: N, cols: CN, rows: R1 - R0, sourceFrames: got, kb: Math.round(fs.statSync(OUT).size / 1024) }));

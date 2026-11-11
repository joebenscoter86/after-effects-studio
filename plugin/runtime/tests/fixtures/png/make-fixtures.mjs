#!/usr/bin/env node
// Writes the small PNG fixtures the render-frame "eyes" tests read. Run it
// from anywhere: `node tests/fixtures/png/make-fixtures.mjs`. The encoder here
// is deliberately independent of src/color/png16.ts, so the tests check the
// plugin's decoder and encoders against bytes it did not produce itself.
//
// All fixtures are 32×24.
//
// What saveFrameToPng really writes (measured live, 2026-11-10, AE 27.0, a
// project with no working space, 8 and 16 bpc): an alpha channel, and RGB
// already laid over the comp background colour,
// captured = colour·a + bgColor·(1 − a). A red solid at 50% opacity on a
// blue-background comp read (0.502, 0, 0.498) at alpha 0.502; empty pixels
// read (0, 0, 1) at alpha 0. These fixtures reproduce that, with a = 128/255
// (exact at 8 and 16 bits):
//   ae-blue-bg-rgba16.png  comp background (0, 0, 1). Empty everywhere: (0, 0, 1),
//                      alpha 0. Half red: x 8..15, y 4..11, red at alpha a, so
//                      (a, 0, 1 − a). Opaque green: x 16..23, y 4..19, (0, 1, 0), alpha 1.
//   ae-blue-bg-rgba8.png   the same at 8 bits (an 8 bpc project).
//   ae-black-bg-rgba16.png the same layout over a black background: empty (0, 0, 0)
//                      at alpha 0, half red (a, 0, 0), which is premultiplied colour.
//
// The keyed-* fixtures are synthetic straight-alpha images (colour under
// alpha 0 that is not the background), NOT what AE writes. They exercise the
// pure measuring functions and the decoder:
//   keyed-rgba16.png   16-bit RGBA.
//                      Screen: straight RGB (0, 1, 0), alpha 0, everywhere.
//                      Subject: x 8..23, y 4..19, RGB (0.8, 0.6, 0.5), alpha 1.
//                      Soft edge: column x 24, y 4..19, same RGB, alpha 0.5.
//   keyed-rgba8.png    the same picture at 8 bits (an 8 bpc project).
//   keyed-moved-rgba16.png
//                      the same layout, subject RGB (0.9, 0.5, 0.5): the
//                      second frame of a `compare`.
//   opaque-rgb16.png   16-bit RGB with no alpha channel, every pixel
//                      (0.25, 0.5, 0.75): a capture of a comp with no
//                      transparency, or an AE that flattens.
//
// The matte-*, spill-* and flicker-* fixtures (agent-eyes stage 3, the
// `edge` report) are 64×48 captures as AE writes them: straight colour laid
// over the comp background, captured = colour·a + bg·(1 − a). Each holds one
// subject: an opaque core x 18..45, y 10..37, then a soft edge two pixels
// wide, alpha 0.75 at Chebyshev distance 1 from the core and 0.25 at
// distance 2 (so the subject covers x 16..47, y 8..39), colour (0.8, 0.6, 0.5).
// Everything else is empty (alpha 0). Background black unless named.
//   matte-clean-rgba16.png   just the subject.
//   matte-hole-rgba16.png    plus a hole in the core: x 30..33, y 22..25 at
//                            alpha 0 inside a one-pixel ring (x 29..34,
//                            y 21..26) at alpha 0.5; and one pixel (40, 32)
//                            at alpha 0.4.
//   matte-specks-rgba16.png  plus three specks in the empty area: x 3..4,
//                            y 3..4 at alpha 1; (58, 5) at alpha 0.3;
//                            x 55..57, y 44 at alpha 1.
//   matte-patch-rgba16.png   plus a half-transparent patch beside the subject
//                            (a chair remnant): x 48..59, y 14..33, alpha 0.5,
//                            colour (0.5, 0.5, 0.5), touching the soft edge.
//   spill-black-rgba16.png   the soft edge's colour is green-tinted
//                            (0.4, 0.7, 0.3); the core stays (0.8, 0.6, 0.5).
//   spill-magenta-rgba16.png the same over a magenta comp background
//                            (0.8, 0.1, 0.6).
//   flicker-a-rgba16.png     the subject as in matte-clean.
//   flicker-b-rgba16.png     the next frame: on the right side (x 46, 47) the
//                            soft edge reads 0.4 and 0.1 instead of 0.75 and
//                            0.25. Nothing else changes.
//
// The screen-* fixtures (agent-eyes stage 6, the `screen` report) are 96×64
// renders of UN-KEYED source footage: every pixel opaque (alpha 1), as a
// source render of a full-frame clip comes back. Each holds a subject, a
// rectangle in colour (0.8, 0.6, 0.5) from y 16 to the bottom edge (a person
// cut by the frame), x 36..59 unless named. Synthetic; no real footage.
//   screen-even-rgba16.png   an even green screen (0.25, 0.55, 0.3).
//   screen-uneven-rgba16.png a green screen whose level runs 1.5x from left to
//                            right: (0.25, 0.5, 0.3)·f, f = 0.8 + 0.4·x/95, so
//                            green 0.4 at x 0 to 0.6 at x 95. Subject at
//                            x 60..83 (on the brighter side).
//   screen-blue-rgba16.png   an even blue screen (0.15, 0.3, 0.7).
//   screen-none-rgba16.png   no screen: a grey wall (0.6, 0.6, 0.6) above
//                            y 32, a brown floor (0.5, 0.4, 0.3) below.
//   screen-grainy-rgba8.png  the even green screen with grain: every channel
//                            of every pixel (subject too) moved by a uniform
//                            random amount in ±0.06 (standard deviation
//                            0.0346), from a fixed seed; 8 bits.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as zlib from "node:zlib";

const HERE = dirname(fileURLToPath(import.meta.url));

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([head.subarray(4), data])) >>> 0, 0);
  return Buffer.concat([head, data, crc]);
}

/** pixel(x, y) → array of channel values 0..1; colorType 2 (RGB) or 6 (RGBA). */
function encode(bitDepth, colorType, pixel, W = 32, H = 24) {
  const channels = colorType === 6 ? 4 : 3;
  const bps = bitDepth / 8;
  const stride = W * channels * bps;
  const max = bitDepth === 16 ? 65535 : 255;
  const raw = Buffer.alloc(H * (stride + 1));
  for (let y = 0; y < H; y++) {
    const row = y * (stride + 1);
    // Filter type 1 (Sub) on odd rows, so the decoder's unfiltering is
    // exercised too, not only the trivial "None" filter.
    const filter = y % 2;
    raw[row] = filter;
    const line = Buffer.alloc(stride);
    for (let x = 0; x < W; x++) {
      const v = pixel(x, y);
      for (let c = 0; c < channels; c++) {
        const q = Math.round(v[c] * max);
        const off = (x * channels + c) * bps;
        if (bps === 2) line.writeUInt16BE(q, off);
        else line[off] = q;
      }
    }
    const bpp = channels * bps;
    for (let i = 0; i < stride; i++) {
      raw[row + 1 + i] = filter === 1 && i >= bpp ? (line[i] - line[i - bpp]) & 0xff : line[i];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr.writeUInt8(bitDepth, 8);
  ihdr.writeUInt8(colorType, 9);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function keyed(subject) {
  return (x, y) => {
    const inRows = y >= 4 && y <= 19;
    if (inRows && x >= 8 && x <= 23) return [...subject, 1];
    if (inRows && x === 24) return [...subject, 0.5];
    return [0, 1, 0, 0];
  };
}

/** A capture as saveFrameToPng writes it: each layer's colour laid over `bg`. */
function aeCapture(bg) {
  const a = 128 / 255;
  return (x, y) => {
    if (x >= 8 && x <= 15 && y >= 4 && y <= 11) {
      return [1 * a + bg[0] * (1 - a), bg[1] * (1 - a), bg[2] * (1 - a), a];
    }
    if (x >= 16 && x <= 23 && y >= 4 && y <= 19) return [0, 1, 0, 1];
    return [...bg, 0];
  };
}

// ---- stage 3: matte quality (64×48) ----
const MW = 64;
const MH = 48;
const SKIN = [0.8, 0.6, 0.5];

/** Chebyshev distance from the subject's opaque core (0 inside it). */
function ring(x, y) {
  const dx = x < 18 ? 18 - x : x > 45 ? x - 45 : 0;
  const dy = y < 10 ? 10 - y : y > 37 ? y - 37 : 0;
  return Math.max(dx, dy);
}

/** The subject: [straight colour, alpha], or null outside it. */
function subject(x, y, edge = SKIN, ramp = [0.75, 0.25]) {
  const d = ring(x, y);
  if (d === 0) return [SKIN, 1];
  if (d <= ramp.length) return [edge, ramp[d - 1]];
  return null;
}

/** Lay straight [colour, alpha] over the comp background, as AE writes the capture. */
function overBg(bg, straight) {
  return (x, y) => {
    const s = straight(x, y) ?? [[0, 0, 0], 0];
    const [c, a] = s;
    return [c[0] * a + bg[0] * (1 - a), c[1] * a + bg[1] * (1 - a), c[2] * a + bg[2] * (1 - a), a];
  };
}

const matte = (bg, straight) => encode(16, 6, overBg(bg, straight), MW, MH);
const BLACK = [0, 0, 0];

function withHole(x, y) {
  if (x >= 30 && x <= 33 && y >= 22 && y <= 25) return [SKIN, 0];
  if (x >= 29 && x <= 34 && y >= 21 && y <= 26) return [SKIN, 0.5];
  if (x === 40 && y === 32) return [SKIN, 0.4];
  return subject(x, y);
}

function withSpecks(x, y) {
  if (x >= 3 && x <= 4 && y >= 3 && y <= 4) return [SKIN, 1];
  if (x === 58 && y === 5) return [SKIN, 0.3];
  if (x >= 55 && x <= 57 && y === 44) return [SKIN, 1];
  return subject(x, y);
}

function withPatch(x, y) {
  if (x >= 48 && x <= 59 && y >= 14 && y <= 33) return [[0.5, 0.5, 0.5], 0.5];
  return subject(x, y);
}

const GREENISH = [0.4, 0.7, 0.3];

function flickered(x, y) {
  return x >= 46 ? subject(x, y, SKIN, [0.4, 0.1]) : subject(x, y);
}

// ---- stage 6: screen measurement (96×64) ----
const SW = 96;
const SH = 64;

/** A source render: opaque everywhere, the subject over `screenAt(x, y)`. */
function source(screenAt, subjectX0 = 36, noise = null) {
  return (x, y) => {
    const inSubject = y >= 16 && x >= subjectX0 && x <= subjectX0 + 23;
    const c = inSubject ? SKIN : screenAt(x, y);
    const n = noise ? noise() : [0, 0, 0];
    return [0, 1, 2].map((i) => Math.min(1, Math.max(0, c[i] + n[i]))).concat(1);
  };
}

/** Deterministic uniform grain in ±amp per channel (a small LCG; same bytes every run). */
function grain(amp, seed = 12345) {
  let s = seed >>> 0;
  const next = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return () => [0, 1, 2].map(() => (next() * 2 - 1) * amp);
}

const EVEN_GREEN = [0.25, 0.55, 0.3];
const uneven = (x) => [0.25, 0.5, 0.3].map((v) => v * (0.8 + (0.4 * x) / 95));

const files = {
  "ae-blue-bg-rgba16.png": encode(16, 6, aeCapture([0, 0, 1])),
  "ae-blue-bg-rgba8.png": encode(8, 6, aeCapture([0, 0, 1])),
  "ae-black-bg-rgba16.png": encode(16, 6, aeCapture([0, 0, 0])),
  "keyed-rgba16.png": encode(16, 6, keyed([0.8, 0.6, 0.5])),
  "keyed-rgba8.png": encode(8, 6, keyed([0.8, 0.6, 0.5])),
  "keyed-moved-rgba16.png": encode(16, 6, keyed([0.9, 0.5, 0.5])),
  "opaque-rgb16.png": encode(16, 2, () => [0.25, 0.5, 0.75]),
  "matte-clean-rgba16.png": matte(BLACK, (x, y) => subject(x, y)),
  "matte-hole-rgba16.png": matte(BLACK, withHole),
  "matte-specks-rgba16.png": matte(BLACK, withSpecks),
  "matte-patch-rgba16.png": matte(BLACK, withPatch),
  "spill-black-rgba16.png": matte(BLACK, (x, y) => subject(x, y, GREENISH)),
  "spill-magenta-rgba16.png": matte([0.8, 0.1, 0.6], (x, y) => subject(x, y, GREENISH)),
  "flicker-a-rgba16.png": matte(BLACK, (x, y) => subject(x, y)),
  "flicker-b-rgba16.png": matte(BLACK, flickered),
  "screen-even-rgba16.png": encode(
    16,
    6,
    source(() => EVEN_GREEN),
    SW,
    SH,
  ),
  "screen-uneven-rgba16.png": encode(
    16,
    6,
    source((x) => uneven(x), 60),
    SW,
    SH,
  ),
  "screen-blue-rgba16.png": encode(
    16,
    6,
    source(() => [0.15, 0.3, 0.7]),
    SW,
    SH,
  ),
  "screen-none-rgba16.png": encode(
    16,
    6,
    source((_x, y) => (y < 32 ? [0.6, 0.6, 0.6] : [0.5, 0.4, 0.3])),
    SW,
    SH,
  ),
  "screen-grainy-rgba8.png": encode(
    8,
    6,
    source(() => EVEN_GREEN, 36, grain(0.06)),
    SW,
    SH,
  ),
};
for (const [name, bytes] of Object.entries(files)) writeFileSync(join(HERE, name), bytes);
console.log(`wrote ${Object.keys(files).length} fixtures to ${HERE}`);

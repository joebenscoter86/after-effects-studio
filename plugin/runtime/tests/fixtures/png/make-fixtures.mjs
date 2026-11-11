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

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as zlib from "node:zlib";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 32;
const H = 24;

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([head.subarray(4), data])) >>> 0, 0);
  return Buffer.concat([head, data, crc]);
}

/** pixel(x, y) → array of channel values 0..1; colorType 2 (RGB) or 6 (RGBA). */
function encode(bitDepth, colorType, pixel) {
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

const files = {
  "ae-blue-bg-rgba16.png": encode(16, 6, aeCapture([0, 0, 1])),
  "ae-blue-bg-rgba8.png": encode(8, 6, aeCapture([0, 0, 1])),
  "ae-black-bg-rgba16.png": encode(16, 6, aeCapture([0, 0, 0])),
  "keyed-rgba16.png": encode(16, 6, keyed([0.8, 0.6, 0.5])),
  "keyed-rgba8.png": encode(8, 6, keyed([0.8, 0.6, 0.5])),
  "keyed-moved-rgba16.png": encode(16, 6, keyed([0.9, 0.5, 0.5])),
  "opaque-rgb16.png": encode(16, 2, () => [0.25, 0.5, 0.75]),
};
for (const [name, bytes] of Object.entries(files)) writeFileSync(join(HERE, name), bytes);
console.log(`wrote ${Object.keys(files).length} fixtures to ${HERE}`);

import * as zlib from "node:zlib";
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function readChunks(buf) {
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error("not a PNG file");
  const chunks = [];
  let pos = 8;
  while (pos + 8 <= buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString("latin1", pos + 4, pos + 8);
    chunks.push({ type, data: buf.subarray(pos + 8, pos + 8 + length) });
    pos += 12 + length;
    if (type === "IEND") break;
  }
  return chunks;
}
function channelsFor(colorType) {
  switch (colorType) {
    case 0:
      return 1;
    // grayscale
    case 2:
      return 3;
    // RGB
    case 4:
      return 2;
    // gray + alpha
    case 6:
      return 4;
    // RGBA
    default:
      throw new Error(`unsupported PNG color type ${colorType} (palette images are out of scope)`);
  }
}
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}
function decodePng(buf) {
  const chunks = readChunks(buf);
  const ihdr = chunks.find((c) => c.type === "IHDR");
  if (!ihdr) throw new Error("PNG missing IHDR");
  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  const bitDepth = ihdr.data.readUInt8(8);
  const colorType = ihdr.data.readUInt8(9);
  const interlace = ihdr.data.readUInt8(12);
  if (interlace !== 0) throw new Error("interlaced PNG is not supported");
  if (bitDepth !== 8 && bitDepth !== 16) throw new Error(`unsupported PNG bit depth ${bitDepth}`);
  const channels = channelsFor(colorType);
  const idat = Buffer.concat(chunks.filter((c) => c.type === "IDAT").map((c) => c.data));
  const raw = zlib.inflateSync(idat);
  const bytesPerSample = bitDepth / 8;
  const bytesPerPixel = channels * bytesPerSample;
  const stride = width * bytesPerPixel;
  if (raw.length < height * (stride + 1)) throw new Error("PNG pixel data truncated");
  const rgb = new Float64Array(width * height * 3);
  const hasAlpha = channels === 2 || channels === 4;
  const alpha = hasAlpha ? new Float64Array(width * height) : void 0;
  const maxVal = bitDepth === 16 ? 65535 : 255;
  const prev = Buffer.alloc(stride);
  const cur = Buffer.alloc(stride);
  const grayish = channels <= 2;
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    const filter = raw[rowStart];
    raw.copy(cur, 0, rowStart + 1, rowStart + 1 + stride);
    switch (filter) {
      case 0:
        break;
      case 1:
        for (let i = bytesPerPixel; i < stride; i++)
          cur[i] = cur[i] + cur[i - bytesPerPixel] & 255;
        break;
      case 2:
        for (let i = 0; i < stride; i++) cur[i] = cur[i] + prev[i] & 255;
        break;
      case 3:
        for (let i = 0; i < stride; i++) {
          const left = i >= bytesPerPixel ? cur[i - bytesPerPixel] : 0;
          cur[i] = cur[i] + (left + prev[i] >> 1) & 255;
        }
        break;
      case 4:
        for (let i = 0; i < stride; i++) {
          const left = i >= bytesPerPixel ? cur[i - bytesPerPixel] : 0;
          const upLeft = i >= bytesPerPixel ? prev[i - bytesPerPixel] : 0;
          cur[i] = cur[i] + paeth(left, prev[i], upLeft) & 255;
        }
        break;
      default:
        throw new Error(`unknown PNG filter ${filter} at row ${y}`);
    }
    for (let x = 0; x < width; x++) {
      const px = x * bytesPerPixel;
      const out = (y * width + x) * 3;
      for (let ch = 0; ch < 3; ch++) {
        const srcCh = grayish ? 0 : ch;
        const off = px + srcCh * bytesPerSample;
        const v = bitDepth === 16 ? cur.readUInt16BE(off) : cur[off];
        rgb[out + ch] = v / maxVal;
      }
      if (alpha) {
        const off = px + (channels - 1) * bytesPerSample;
        const a = bitDepth === 16 ? cur.readUInt16BE(off) : cur[off];
        alpha[y * width + x] = a / maxVal;
      }
    }
    cur.copy(prev);
  }
  return alpha ? { width, height, rgb, alpha, bitDepth } : { width, height, rgb, bitDepth };
}
function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "latin1");
  const crcBody = Buffer.concat([head.subarray(4), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(crcBody) >>> 0, 0);
  return Buffer.concat([head, data, crc]);
}
const to8 = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255);
function encode8(width, height, colorType, srgbTags, write, level = 6) {
  const channels = colorType === 0 ? 1 : colorType === 2 ? 3 : 4;
  const stride = width * channels;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) write(y * width + x, raw, rowStart + 1 + x * channels);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(colorType, 9);
  const gama = Buffer.alloc(4);
  gama.writeUInt32BE(45455, 0);
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk("IHDR", ihdr),
    ...srgbTags ? [chunk("sRGB", Buffer.from([0])), chunk("gAMA", gama)] : [],
    chunk("IDAT", zlib.deflateSync(raw, { level })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}
function encodePngSrgb8(width, height, rgb, level = 6) {
  return encode8(
    width,
    height,
    2,
    true,
    (p, out, at) => {
      out[at] = to8(rgb[p * 3]);
      out[at + 1] = to8(rgb[p * 3 + 1]);
      out[at + 2] = to8(rgb[p * 3 + 2]);
    },
    level
  );
}
function encodePngSrgbRgba8(width, height, rgb, alpha) {
  return encode8(width, height, 6, true, (p, out, at) => {
    out[at] = to8(rgb[p * 3]);
    out[at + 1] = to8(rgb[p * 3 + 1]);
    out[at + 2] = to8(rgb[p * 3 + 2]);
    out[at + 3] = to8(alpha[p]);
  });
}
function encodePngGray8(width, height, values) {
  return encode8(width, height, 0, false, (p, out, at) => {
    out[at] = to8(values[p]);
  });
}
export {
  decodePng,
  encodePngGray8,
  encodePngSrgb8,
  encodePngSrgbRgba8
};

import { distanceTo, labelRegions } from "./matte.js";
const SCREEN_DEFAULTS = {
  screen: "auto",
  minExcess: 0.04,
  minDominance: 0.15,
  minScreenShare: 0.02,
  opaque: 1 - 2 / 255,
  columns: "auto",
  rows: "auto",
  minCellShare: 0.25,
  nearSkip: "auto",
  nearBand: "auto",
  unevenRatio: 1.1,
  grainAbove: 0.01
};
const SCREEN_COLOUR_NOTE = "Colours are capture values: the opaque pixels of the render as saveFrameToPng wrote them, so the comp background does not mix in. In a project with no working space (8 bpc, as measured live in After Effects 2027) these are the footage's own 0..1 values, the scale Keylight's Screen Colour takes, so colour.nearSubject (or colour.median) can go to key.keylight's screenColour as it is. In a colour-managed project they are working-space values scaled by After Effects' capture transfer; that has not been checked against Keylight, so confirm the key with the Screen Matte and Status views. Measure the source un-keyed (Keylight View 'source', or the key off, and isolate the layer): a keyed render has no screen left, and Keylight despills what it outputs.";
function autoGrid(width, height) {
  const short = Math.min(width, height);
  const across = 4;
  const along = Math.max(1, Math.round(across * Math.max(width, height) / short));
  return width <= height ? { columns: across, rows: along } : { columns: along, rows: across };
}
function resolveScreenThresholds(args, width, height) {
  const grid = autoGrid(width, height);
  const short = Math.min(width, height);
  return {
    screen: args.screen ?? SCREEN_DEFAULTS.screen,
    minExcess: args.minExcess ?? SCREEN_DEFAULTS.minExcess,
    minDominance: args.minDominance ?? SCREEN_DEFAULTS.minDominance,
    minScreenShare: args.minScreenShare ?? SCREEN_DEFAULTS.minScreenShare,
    opaque: args.opaque ?? SCREEN_DEFAULTS.opaque,
    columns: args.columns ?? grid.columns,
    rows: args.rows ?? grid.rows,
    minCellShare: args.minCellShare ?? SCREEN_DEFAULTS.minCellShare,
    nearSkip: args.nearSkip ?? Math.max(2, Math.round(0.01 * short)),
    nearBand: args.nearBand ?? Math.max(4, Math.round(0.05 * short)),
    unevenRatio: args.unevenRatio ?? SCREEN_DEFAULTS.unevenRatio,
    grainAbove: args.grainAbove ?? SCREEN_DEFAULTS.grainAbove
  };
}
function screenArgsError(args) {
  if (args.screen !== void 0 && args.screen !== "auto" && args.screen !== "green" && args.screen !== "blue") {
    return "`screen.screen` must be 'auto', 'green' or 'blue'";
  }
  for (const key of [
    "minExcess",
    "minDominance",
    "minScreenShare",
    "opaque",
    "minCellShare",
    "grainAbove"
  ]) {
    const v = args[key];
    if (v !== void 0 && (typeof v !== "number" || !(v >= 0 && v <= 1))) {
      return `\`screen.${key}\` must be a number in 0..1`;
    }
  }
  for (const key of ["columns", "rows"]) {
    const v = args[key];
    if (v !== void 0 && (!Number.isInteger(v) || v < 1 || v > 64)) {
      return `\`screen.${key}\` must be a whole number from 1 to 64`;
    }
  }
  const skip = args.nearSkip;
  if (skip !== void 0 && (typeof skip !== "number" || !Number.isFinite(skip) || skip < 0)) {
    return "`screen.nearSkip` must be 0 or more (pixels)";
  }
  const band = args.nearBand;
  if (band !== void 0 && (typeof band !== "number" || !Number.isFinite(band) || band < 1)) {
    return "`screen.nearBand` must be at least 1 (pixels)";
  }
  const u = args.unevenRatio;
  if (u !== void 0 && (typeof u !== "number" || !Number.isFinite(u) || u < 1)) {
    return "`screen.unevenRatio` must be a number of 1 or more";
  }
  return null;
}
const r4 = (v) => Math.round(v * 1e4) / 1e4;
const r4rgb = (v) => [r4(v[0]), r4(v[1]), r4(v[2])];
const luma = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const CH = { green: 1, blue: 2 };
function screenTest(rgb, p, ch, t) {
  const v = rgb[p * 3 + ch];
  const others = ch === 1 ? Math.max(rgb[p * 3], rgb[p * 3 + 2]) : Math.max(rgb[p * 3], rgb[p * 3 + 1]);
  const lead = v - others;
  return lead >= t.minExcess && lead >= t.minDominance * v;
}
const BINS = 65536;
function histMedian(h, count) {
  const out = [0, 0, 0];
  const half = (count + 1) / 2;
  for (let c = 0; c < 3; c++) {
    let acc = 0;
    const base = c * BINS;
    for (let b = 0; b < BINS; b++) {
      acc += h[base + b];
      if (acc >= half) {
        out[c] = b / (BINS - 1);
        break;
      }
    }
  }
  return out;
}
function addToHist(h, rgb, p) {
  for (let c = 0; c < 3; c++) {
    const v = Math.min(1, Math.max(0, rgb[p * 3 + c]));
    h[c * BINS + Math.round(v * (BINS - 1))]++;
  }
}
function measureScreen(img, t) {
  const { width, height, rgb } = img;
  const alpha = img.alpha;
  const n = width * height;
  const measuredAt = (p) => !alpha || alpha[p] >= t.opaque;
  let measured = 0;
  for (let p = 0; p < n; p++) if (measuredAt(p)) measured++;
  const leftOut = n - measured;
  const kinds = t.screen === "auto" ? ["green", "blue"] : [t.screen];
  let kind = kinds[0];
  let best = -1;
  for (const k of kinds) {
    let count2 = 0;
    for (let p = 0; p < n; p++) if (measuredAt(p) && screenTest(rgb, p, CH[k], t)) count2++;
    if (count2 > best) {
      best = count2;
      kind = k;
    }
  }
  const ch = CH[kind];
  const found = measured > 0 && best / measured >= t.minScreenShare && best > 0;
  const base = {
    stage: "capture",
    values: "capture",
    screen: found ? kind : null,
    chosen: t.screen === "auto" ? "detected" : "given",
    pixels: n,
    measured,
    leftOut,
    screenPixels: 0,
    share: 0,
    bounds: null,
    colour: null,
    subject: null,
    evenness: null,
    grain: null,
    reading: "",
    screenColourNote: SCREEN_COLOUR_NOTE
  };
  if (leftOut > n / 2) {
    base.warning = `${Math.round(100 * leftOut / n)}% of the frame is transparent or partly transparent, as a keyed render is. Measure the source: set Keylight's View to 'source' (key.view) or switch the key off, and isolate the keyed layer so nothing else is in the render.`;
  }
  if (!found) {
    const what = t.screen === "auto" ? "green or blue" : t.screen;
    base.reading = `no ${what} screen found: fewer than ${Math.round(t.minScreenShare * 100)}% of the ${measured} measured pixels have ${what} leading the other channels by at least ${t.minExcess} and ${Math.round(t.minDominance * 100)}% of its level`;
    return base;
  }
  const isScreen = new Uint8Array(n);
  const hist = new Uint32Array(3 * BINS);
  const sum = [0, 0, 0];
  let count = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -1;
  let maxY = -1;
  for (let p = 0; p < n; p++) {
    if (!measuredAt(p) || !screenTest(rgb, p, ch, t)) continue;
    isScreen[p] = 1;
    count++;
    addToHist(hist, rgb, p);
    for (let c = 0; c < 3; c++) sum[c] += rgb[p * 3 + c];
    const x = p % width;
    const y = (p - x) / width;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const median = histMedian(hist, count);
  const mean = [sum[0] / count, sum[1] / count, sum[2] / count];
  const labels = new Int32Array(n);
  const queue = new Int32Array(n);
  const ones = alpha ?? new Float64Array(n).fill(1);
  const regions = labelRegions(
    ones,
    width,
    height,
    (p) => measuredAt(p) && isScreen[p] === 0,
    true,
    labels,
    queue,
    -1
  );
  let subjectId = 0;
  for (let i = 0; i < regions.length; i++) {
    if (subjectId === 0 || regions[i].area > regions[subjectId - 1].area) subjectId = i + 1;
  }
  let subject = null;
  let nearSubject = null;
  if (subjectId > 0) {
    const s = regions[subjectId - 1];
    subject = {
      box: { x: s.minX, y: s.minY, width: s.maxX - s.minX + 1, height: s.maxY - s.minY + 1 },
      area: s.area,
      share: r4(s.area / n)
    };
    const mask = new Float64Array(n);
    for (let p = 0; p < n; p++) if (labels[p] === subjectId) mask[p] = 1;
    const scratch = new Float32Array(n);
    const dist = new Float32Array(n);
    distanceTo(mask, width, height, (a) => a > 0.5, scratch, dist);
    const from = t.nearSkip;
    const to = t.nearSkip + t.nearBand;
    const nearHist = new Uint32Array(3 * BINS);
    let nearCount = 0;
    for (let p = 0; p < n; p++) {
      if (isScreen[p] === 0 || !(dist[p] > from && dist[p] <= to)) continue;
      addToHist(nearHist, rgb, p);
      nearCount++;
    }
    if (nearCount > 0) {
      nearSubject = {
        colour: r4rgb(histMedian(nearHist, nearCount)),
        pixels: nearCount,
        band: { from, to }
      };
    }
  }
  const evenness = measureEvenness(img, isScreen, measuredAt, ch, kind, t);
  const grain = measureGrain(img, isScreen, ch, kind, t);
  const near = nearSubject ? nearSubject.colour : null;
  const fmt = (c) => `(${c.map((v) => v.toFixed(3)).join(", ")})`;
  base.screenPixels = count;
  base.share = r4(count / measured);
  base.bounds = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  base.colour = { median: r4rgb(median), mean: r4rgb(mean), nearSubject };
  base.subject = subject;
  base.evenness = evenness;
  base.grain = grain;
  base.reading = `${kind} screen, ${Math.round(base.share * 100)}% of the measured pixels; median ${fmt(median)}` + (near ? `, near the subject ${fmt(near)}` : "") + `. ${evenness.reading}. ${grain ? grain.reading : "grain not measured (no screen pixel has screen all round it)"}.`;
  return base;
}
function measureEvenness(img, isScreen, measuredAt, ch, kind, t) {
  const { width, height, rgb } = img;
  const cols = Math.min(t.columns, width);
  const rows = Math.min(t.rows, height);
  const xs = Array.from({ length: cols + 1 }, (_, i) => Math.floor(i * width / cols));
  const ys = Array.from({ length: rows + 1 }, (_, i) => Math.floor(i * height / rows));
  const cells = [];
  let s1 = 0;
  let su = 0;
  let sv = 0;
  let suu = 0;
  let suv = 0;
  let svv = 0;
  let sl = 0;
  let sul = 0;
  let svl = 0;
  const du = Math.max(1, width - 1);
  const dv = Math.max(1, height - 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let m = 0;
      let k = 0;
      const acc = [0, 0, 0];
      for (let y = ys[r]; y < ys[r + 1]; y++) {
        for (let x = xs[c]; x < xs[c + 1]; x++) {
          const p = y * width + x;
          if (!measuredAt(p)) continue;
          m++;
          if (isScreen[p] === 0) continue;
          k++;
          for (let q = 0; q < 3; q++) acc[q] += rgb[p * 3 + q];
          const u = x / du;
          const v = y / dv;
          const l = rgb[p * 3 + ch];
          s1++;
          su += u;
          sv += v;
          suu += u * u;
          suv += u * v;
          svv += v * v;
          sl += l;
          sul += u * l;
          svl += v * l;
        }
      }
      const cellMean = k > 0 ? [acc[0] / k, acc[1] / k, acc[2] / k] : null;
      cells.push({
        column: c,
        row: r,
        box: { x: xs[c], y: ys[r], width: xs[c + 1] - xs[c], height: ys[r + 1] - ys[r] },
        screenShare: m > 0 ? r4(k / m) : 0,
        mean: cellMean ? r4rgb(cellMean) : null,
        luma: cellMean ? r4(luma(cellMean)) : null,
        level: cellMean ? r4(cellMean[ch]) : null
      });
    }
  }
  const eligible = cells.filter(
    (c) => c.level !== null && c.screenShare >= t.minCellShare
  );
  let darkest = null;
  let brightest = null;
  for (const c of eligible) {
    if (darkest === null || c.level < darkest.level) darkest = c;
    if (brightest === null || c.level > brightest.level) brightest = c;
  }
  const levelRatio = darkest && brightest && darkest.level > 0 ? r4(brightest.level / darkest.level) : null;
  const lumaRatio = darkest && brightest && darkest.luma > 0 ? r4(brightest.luma / darkest.luma) : null;
  const uneven = levelRatio !== null && levelRatio > t.unevenRatio;
  const plane = solve3(
    [
      [s1, su, sv],
      [su, suu, suv],
      [sv, suv, svv]
    ],
    [sl, sul, svl]
  );
  let horizontal = null;
  let vertical = null;
  if (plane) {
    const [a, b, c] = plane;
    const at = (u, v) => a + b * u + c * v;
    const ratio = (hi, lo) => lo > 0 && hi > 0 ? r4(hi / lo) : null;
    horizontal = ratio(at(1, 0.5), at(0, 0.5));
    vertical = ratio(at(0.5, 1), at(0.5, 0));
  }
  const strength = (r) => r === null ? 0 : Math.max(r, 1 / r);
  let darkerSide = null;
  const hs = strength(horizontal);
  const vs = strength(vertical);
  if (Math.max(hs, vs) > t.unevenRatio) {
    darkerSide = hs >= vs ? horizontal > 1 ? "left" : "right" : vertical > 1 ? "top" : "bottom";
  }
  const where = (c) => `cell ${c.column},${c.row} at x ${c.box.x}, y ${c.box.y}`;
  let reading;
  if (darkest === null || brightest === null || levelRatio === null) {
    reading = `no grid cell is at least ${Math.round(t.minCellShare * 100)}% screen, so evenness was not read`;
  } else {
    const spread = `the screen's ${kind} level runs from ${darkest.level.toFixed(3)} (${where(darkest)}) to ${brightest.level.toFixed(3)} (${where(brightest)}), ${levelRatio.toFixed(2)}x`;
    reading = uneven ? `uneven: ${spread}` + (darkerSide ? `, darker on the ${darkerSide}` : "") + ". One Screen Colour will not fit all of it: key from the colour near the subject, then check the darker part in the Screen Matte view (Clip Black, a second key, or a garbage mask)" : `even: ${spread}`;
  }
  return {
    columns: cols,
    rows,
    cellWidth: xs[1] - xs[0],
    cellHeight: ys[1] - ys[0],
    cells,
    darkest,
    brightest,
    levelRatio,
    lumaRatio,
    uneven,
    horizontal,
    vertical,
    darkerSide,
    reading
  };
}
function solve3(m, v) {
  const det = (a) => a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
  const d = det(m);
  if (!Number.isFinite(d) || Math.abs(d) < 1e-12) return null;
  const col = (i) => m.map((row, r) => row.map((x, c) => c === i ? v[r] : x));
  return [det(col(0)) / d, det(col(1)) / d, det(col(2)) / d];
}
function measureGrain(img, isScreen, ch, kind, t) {
  const { width, height, rgb } = img;
  const ss = [0, 0, 0];
  let k = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = y * width + x;
      if (isScreen[p] === 0) continue;
      let all = true;
      for (let dy = -1; dy <= 1 && all; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (isScreen[p + dy * width + dx] === 0) {
            all = false;
            break;
          }
        }
      }
      if (!all) continue;
      for (let c = 0; c < 3; c++) {
        let s = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) s += rgb[(p + dy * width + dx) * 3 + c];
        }
        const d = rgb[p * 3 + c] - s / 9;
        ss[c] += d * d;
      }
      k++;
    }
  }
  if (k === 0) return null;
  const sd = [0, 1, 2].map((c) => Math.sqrt(ss[c] / k * 9 / 8));
  const level = sd[ch];
  const grainy = level > t.grainAbove;
  const steps = level * 255;
  return {
    stdDev: r4rgb(sd),
    level: r4(level),
    steps8bit: Math.round(steps * 100) / 100,
    samples: k,
    grainy,
    reading: `grain: ${kind} varies by ${level.toFixed(4)} (standard deviation, about ${steps.toFixed(1)} 8-bit steps) about its local mean` + (grainy ? "; grainy enough to break a hard matte into specks and chatter, so try Keylight's Screen Pre-blur before raising Clip Black" : "; fine enough not to need pre-blur")
  };
}
export {
  SCREEN_COLOUR_NOTE,
  SCREEN_DEFAULTS,
  measureScreen,
  resolveScreenThresholds,
  screenArgsError
};

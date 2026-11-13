import { clipRegion } from "./sheet.js";
const DIFF_DEFAULTS = {
  changeAbove: 0.04,
  spikeRatio: 3,
  holdRatio: 0.25,
  quietBelow: 2e-3,
  movingShare: 5e-4,
  window: 3,
  amplify: 8,
  repeatBelow: 1e-4
};
const LIMITS = {
  changeAbove: { min: 0, max: 1 },
  spikeRatio: { min: 1, max: 1e3, above: true },
  holdRatio: { min: 0, max: 1, above: true },
  quietBelow: { min: 0, max: 1 },
  movingShare: { min: 0, max: 1 },
  window: { min: 1, max: 16, int: true },
  amplify: { min: 1, max: 1e3 },
  repeatBelow: { min: 0, max: 1 }
};
function resolveDiffThresholds(args = {}) {
  const out = { ...DIFF_DEFAULTS };
  for (const key of Object.keys(DIFF_DEFAULTS)) {
    const v = args[key];
    if (typeof v === "number") out[key] = v;
  }
  return out;
}
function diffArgsError(args) {
  for (const [key, value] of Object.entries(args)) {
    if (key === "sheet") continue;
    const limit = LIMITS[key];
    if (!limit) {
      return `\`diff.${key}\` is not an option (options: ${Object.keys(LIMITS).join(", ")}, sheet)`;
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return `\`diff.${key}\` must be a number`;
    }
    const low = limit.above ? value <= limit.min : value < limit.min;
    if (low || value > limit.max || limit.int && !Number.isInteger(value)) {
      const range = limit.above ? `above ${limit.min} and at most ${limit.max}` : `${limit.min} to ${limit.max}`;
      return `\`diff.${key}\` must be ${limit.int ? "a whole number " : ""}${range}, not ${value}`;
    }
  }
  return null;
}
function pictureOf(img, straight) {
  const n = img.width * img.height;
  const out = new Float32Array(n * 3);
  const a = straight ? img.alpha : void 0;
  if (!a) {
    out.set(img.rgb);
    return out;
  }
  for (let p = 0; p < n; p++) {
    const w = a[p];
    const i = p * 3;
    out[i] = img.rgb[i] * w;
    out[i + 1] = img.rgb[i + 1] * w;
    out[i + 2] = img.rgb[i + 2] * w;
  }
  return out;
}
const r6 = (v) => Math.round(v * 1e6) / 1e6;
function rectStats(prev, cur, width, x0, y0, x1, y1, above, perPixel) {
  let sum = 0;
  let maxAbs = 0;
  let changed = 0;
  let bx0 = Infinity;
  let by0 = Infinity;
  let bx1 = -1;
  let by1 = -1;
  for (let y = y0; y < y1; y++) {
    let i = (y * width + x0) * 3;
    for (let x = x0; x < x1; x++, i += 3) {
      const dr = Math.abs(cur[i] - prev[i]);
      const dg = Math.abs(cur[i + 1] - prev[i + 1]);
      const db = Math.abs(cur[i + 2] - prev[i + 2]);
      const m = dr > dg ? dr > db ? dr : db : dg > db ? dg : db;
      const mean = (dr + dg + db) / 3;
      sum += mean;
      if (m > maxAbs) maxAbs = m;
      if (m > above) {
        changed++;
        if (x < bx0) bx0 = x;
        if (x > bx1) bx1 = x;
        if (y < by0) by0 = y;
        if (y > by1) by1 = y;
      }
      if (perPixel) perPixel(x, y, mean);
    }
  }
  const pixels = (x1 - x0) * (y1 - y0);
  return {
    pixels,
    change: r6(pixels > 0 ? sum / pixels : 0),
    maxAbsDelta: r6(maxAbs),
    changedPixels: changed,
    changedShare: r6(pixels > 0 ? changed / pixels : 0),
    changedBounds: changed > 0 ? { x: bx0, y: by0, width: bx1 - bx0 + 1, height: by1 - by0 + 1 } : null
  };
}
function pictureChange(prev, cur, width, height, t, opts = {}) {
  let perPixel;
  let sums = null;
  let counts = null;
  const tw = opts.thumb?.width ?? 0;
  if (opts.thumb) {
    const th = opts.thumb.height;
    sums = new Float64Array(tw * th);
    counts = new Float64Array(tw * th);
    const col = new Int32Array(width);
    for (let x = 0; x < width; x++) col[x] = Math.min(tw - 1, Math.floor(x * tw / width));
    const row = new Int32Array(height);
    for (let y = 0; y < height; y++) row[y] = Math.min(th - 1, Math.floor(y * th / height)) * tw;
    const s = sums;
    const c = counts;
    perPixel = (x, y, mean) => {
      const k = row[y] + col[x];
      s[k] += mean;
      c[k]++;
    };
  }
  const all = rectStats(prev, cur, width, 0, 0, width, height, t.changeAbove, perPixel);
  const out = { all };
  if (opts.regions) {
    out.regions = opts.regions.map((region) => {
      const clip = clipRegion({ width, height }, region);
      if (!clip)
        return { name: region.name, error: `region is outside the ${width}\xD7${height} frame` };
      const { x, y, width: w, height: h } = clip.rect;
      return {
        name: region.name,
        ...rectStats(prev, cur, width, x, y, x + w, y + h, t.changeAbove)
      };
    });
  }
  if (sums && counts) {
    const thumb = new Float64Array(sums.length);
    for (let k = 0; k < sums.length; k++) {
      thumb[k] = counts[k] > 0 ? Math.min(1, sums[k] / counts[k] * t.amplify) : 0;
    }
    out.thumb = thumb;
  }
  return out;
}
function lowerMedian(values) {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) / 2)];
}
function side(pairs, p, dir, window, skip) {
  const changes = [];
  const shares = [];
  for (let k = 1; k <= window; k++) {
    const j = p + dir * k;
    if (j < 0 || j >= pairs.length) break;
    if (skip.has(j)) continue;
    changes.push(pairs[j].change);
    shares.push(pairs[j].changedShare);
  }
  if (changes.length === 0) return null;
  return { change: lowerMedian(changes), share: lowerMedian(shares) };
}
const fmt = (v) => v.toFixed(4);
const frameText = (f) => `#${f.index}${f.time === void 0 ? "" : ` (${r6(f.time)} s)`}`;
function summarizeSeries(pairs, t) {
  const n = pairs.length;
  const changes = pairs.map((p) => p.change);
  let largest = 0;
  let smallest = 0;
  for (let i = 1; i < n; i++) {
    if (changes[i] > changes[largest]) largest = i;
    if (changes[i] < changes[smallest]) smallest = i;
  }
  const summary = {
    pairs: n,
    median: n > 0 ? r6(lowerMedian(changes)) : 0,
    mean: n > 0 ? r6(changes.reduce((a, b) => a + b, 0) / n) : 0,
    largest: { pair: largest, change: n > 0 ? changes[largest] : 0 },
    smallest: { pair: smallest, change: n > 0 ? changes[smallest] : 0 },
    flags: [],
    reading: ""
  };
  if (n < 2) {
    summary.reading = n === 0 ? "no pair of consecutive frames to compare" : "one pair: nothing to compare it with, so nothing is flagged (render at least three frames)";
    return summary;
  }
  const repeats = new Set(pairs.flatMap((p, i) => p.change <= t.repeatBelow ? [i] : []));
  const near = (i, set) => {
    for (let k = 1; k <= t.window; k++) if (set.has(i - k) || set.has(i + k)) return true;
    return false;
  };
  const standsOut = (p, i, skip) => {
    if (repeats.has(i) || p.changedShare < t.movingShare) return null;
    const sides = [side(pairs, i, -1, t.window, skip), side(pairs, i, 1, t.window, skip)].filter(
      (s) => s !== null
    );
    if (sides.length === 0) return null;
    const reference = Math.max(...sides.map((s) => s.change), t.quietBelow);
    if (sides.some((s) => p.change < t.spikeRatio * Math.max(s.change, t.quietBelow))) return null;
    return { reference, edge: i === 0 || i === n - 1, besideRepeat: near(i, repeats) };
  };
  const first = pairs.map((p, i) => standsOut(p, i, repeats));
  const firstSpikes = new Set(first.flatMap((s, i) => s ? [i] : []));
  const skipBoth = /* @__PURE__ */ new Set([...repeats, ...firstSpikes]);
  const spike = pairs.map(
    (p, i) => first[i] ?? (firstSpikes.size > 0 ? standsOut(p, i, skipBoth) : null)
  );
  const spikes = new Set(spike.flatMap((s, i) => s ? [i] : []));
  const repeatNote = " (a repeated frame is next to it and was left out of the comparison)";
  const flags = [];
  for (let i = 0; i < n; i++) {
    const s = spike[i];
    if (!s) continue;
    const runStart = i === 0 || !spike[i - 1];
    if (!runStart) continue;
    let end = i;
    while (end + 1 < n && spike[end + 1]) end++;
    if (end === i + 1) {
      const reference = Math.max(s.reference, spike[end].reference);
      const change = Math.min(pairs[i].change, pairs[end].change);
      const frame = pairs[i].to;
      const flag = {
        kind: "pop",
        pairs: [i, end],
        frame,
        change,
        reference: r6(reference),
        ratio: r6(change / reference),
        reading: `frame ${frameText(frame)} differs from the frames before and after it by ${fmt(change)} or more, while its neighbours change about ${fmt(reference)}: a one-frame pop`
      };
      if (s.besideRepeat || spike[end].besideRepeat) {
        flag.besideRepeat = true;
        flag.reading += repeatNote;
      }
      flags.push(flag);
      continue;
    }
    for (let j = i; j <= end; j++) {
      const sj = spike[j];
      const between = [pairs[j].from, pairs[j].to];
      const flag = {
        kind: "cut",
        pairs: [j],
        between,
        change: pairs[j].change,
        reference: r6(sj.reference),
        ratio: r6(pairs[j].change / sj.reference),
        reading: `${frameText(between[0])} to ${frameText(between[1])} changes ${fmt(pairs[j].change)}, ${(pairs[j].change / sj.reference).toFixed(1)}\xD7 its neighbours: a cut or a jump`
      };
      if (sj.edge) {
        flag.atSeriesEdge = true;
        flag.reading += " (first or last pair: it could also be a pop of the end frame)";
      }
      if (sj.besideRepeat) {
        flag.besideRepeat = true;
        flag.reading += repeatNote;
      }
      flags.push(flag);
    }
  }
  const moving = (s) => s !== null && s.change >= t.quietBelow && s.share >= t.movingShare;
  const notSpikes = /* @__PURE__ */ new Set([...spikes, ...repeats]);
  const neighbours = (i) => [i - 1, i + 1].filter((j) => j >= 0 && j < n && !repeats.has(j));
  for (let i = 0; i < n; i++) {
    if (spikes.has(i)) continue;
    const before = side(pairs, i, -1, t.window, notSpikes);
    const after = side(pairs, i, 1, t.window, notSpikes);
    const frame = pairs[i].to;
    const unreliablePairs = neighbours(i);
    const unreliable = unreliablePairs.length > 0 ? `; pair${unreliablePairs.length > 1 ? "s" : ""} ${unreliablePairs.join(" and ")} beside it ${unreliablePairs.length > 1 ? "are" : "is"} measured across the repeat, so ${unreliablePairs.length > 1 ? "their readings are" : "its reading is"} unreliable` : "";
    if (before && after && moving(before) && moving(after)) {
      const reference2 = Math.min(before.change, after.change);
      if (pairs[i].change > t.holdRatio * reference2) continue;
      flags.push({
        kind: "stutter",
        pairs: [i],
        frame,
        change: pairs[i].change,
        reference: r6(reference2),
        ratio: r6(pairs[i].change / reference2),
        unreliablePairs,
        reading: `frame ${frameText(frame)} barely changes from the one before (${fmt(pairs[i].change)}) while the frames around it move about ${fmt(reference2)}: a repeated frame, a stutter${unreliable}. Rounded times can do this: a time just below a frame boundary renders the frame before (see frameWarning)`
      });
      continue;
    }
    if (!repeats.has(i)) continue;
    const rawBefore = side(pairs, i, -1, t.window, spikes);
    const rawAfter = side(pairs, i, 1, t.window, spikes);
    const atEdge = rawBefore === null || rawAfter === null;
    if (!atEdge || !(moving(rawBefore) || moving(rawAfter))) continue;
    const reference = (moving(rawBefore) ? rawBefore : rawAfter).change;
    flags.push({
      kind: "repeat",
      pairs: [i],
      frame,
      change: pairs[i].change,
      reference: r6(reference),
      ratio: r6(pairs[i].change / reference),
      atSeriesEdge: true,
      unreliablePairs,
      reading: `frame ${frameText(frame)} repeats the one before (change ${fmt(pairs[i].change)}) beside motion of about ${fmt(reference)}, at the ${rawBefore === null ? "start" : "end"} of the series, so a stutter cannot be told from a hold${unreliable}`
    });
  }
  flags.sort((a, b) => a.pairs[0] - b.pairs[0]);
  summary.flags = flags;
  const counts = ["pop", "stutter", "cut", "repeat"].map((k) => [k, flags.filter((f) => f.kind === k).length]).filter(([, c]) => c > 0).map(([k, c]) => `${c} ${k}${c > 1 ? "s" : ""}`);
  summary.reading = `${n} pairs, median change ${fmt(summary.median)}, largest ${fmt(summary.largest.change)} (pair ${largest}); ` + (flags.length === 0 ? "no pair stands out from its neighbours" : `${counts.join(", ")}: ${flags.map((f) => `${f.kind} at pair ${f.pairs.join("+")}`).join("; ")}`);
  return summary;
}
function cellLuma(img, cell) {
  const w = Math.ceil(img.width / cell);
  const h = Math.ceil(img.height / cell);
  const out = new Float32Array(w * h);
  const n = new Float32Array(w * h);
  for (let y = 0; y < img.height; y++) {
    const row = Math.floor(y / cell) * w;
    for (let x = 0; x < img.width; x++) {
      const p = (y * img.width + x) * 3;
      const k = row + Math.floor(x / cell);
      out[k] += 0.2126 * img.rgb[p] + 0.7152 * img.rgb[p + 1] + 0.0722 * img.rgb[p + 2];
      n[k]++;
    }
  }
  for (let k = 0; k < out.length; k++) out[k] /= n[k] || 1;
  return out;
}
function aboveFloor(m) {
  const s = m.values.slice().sort((a, b) => a - b);
  const floor = s[Math.floor(s.length / 2)] ?? 0;
  return Float64Array.from(m.values, (v) => Math.max(0, v - floor));
}
function motionCentre(m) {
  const a = aboveFloor(m);
  let s = 0;
  let sx = 0;
  let sy = 0;
  for (let y = 0; y < m.height; y++)
    for (let x = 0; x < m.width; x++) {
      const v = a[y * m.width + x];
      s += v;
      sx += v * (x + 0.5);
      sy += v * (y + 0.5);
    }
  if (s <= 0) return null;
  const cx = sx / s;
  const cy = sy / s;
  let vx = 0;
  let vy = 0;
  for (let y = 0; y < m.height; y++)
    for (let x = 0; x < m.width; x++) {
      const v = a[y * m.width + x];
      vx += v * (x + 0.5 - cx) ** 2;
      vy += v * (y + 0.5 - cy) ** 2;
    }
  const r3 = (v) => Math.round(v * 1e3) / 1e3;
  return {
    x: r3(cx / m.width),
    y: r3(cy / m.height),
    spreadX: r3(Math.sqrt(vx / s) / m.width),
    spreadY: r3(Math.sqrt(vy / s) / m.height)
  };
}
function registerMotionMaps(ref, build) {
  const ra = aboveFloor(ref);
  const ba = aboveFloor(build);
  const rc = motionCentre(ref);
  const bc = motionCentre(build);
  if (!rc || !bc) return null;
  const W = ref.width;
  const H = ref.height;
  const crx = rc.x * W;
  const cry = rc.y * H;
  const cbx = bc.x * build.width;
  const cby = bc.y * build.height;
  const kx = build.width / W;
  const ky = build.height / H;
  const corr = (s, dx, dy) => {
    let sab = 0;
    let saa = 0;
    let sbb = 0;
    let sa = 0;
    let sb = 0;
    let n = 0;
    for (let y = 0; y < H; y++) {
      const by = Math.floor(s * (y + 0.5 - cry) * ky + cby + dy);
      if (by < 0 || by >= build.height) continue;
      for (let x = 0; x < W; x++) {
        const bx = Math.floor(s * (x + 0.5 - crx) * kx + cbx + dx);
        if (bx < 0 || bx >= build.width) continue;
        const va = ra[y * W + x];
        const vb = ba[by * build.width + bx];
        sab += va * vb;
        saa += va * va;
        sbb += vb * vb;
        sa += va;
        sb += vb;
        n++;
      }
    }
    if (n < 4) return -1;
    const d = (saa - sa * sa / n) * (sbb - sb * sb / n);
    return d > 0 ? (sab - sa * sb / n) / Math.sqrt(d) : -1;
  };
  const rx = Math.max(2, Math.ceil(0.12 * build.width));
  const ry = Math.max(2, Math.ceil(0.12 * build.height));
  let best = { c: -2, s: 1, dx: 0, dy: 0 };
  for (let s = 0.5; s <= 1.6001; s += 0.02)
    for (let dy = -ry; dy <= ry; dy++)
      for (let dx = -rx; dx <= rx; dx++) {
        const c = corr(s, dx, dy);
        if (c > best.c) best = { c, s, dx, dy };
      }
  const coarse = best;
  for (let s = coarse.s - 0.02; s <= coarse.s + 0.02001; s += 5e-3)
    for (let dy = coarse.dy - 1; dy <= coarse.dy + 1; dy++)
      for (let dx = coarse.dx - 1; dx <= coarse.dx + 1; dx++) {
        const c = corr(s, dx, dy);
        if (c > best.c) best = { c, s, dx, dy };
      }
  const r3 = (v) => Math.round(v * 1e3) / 1e3;
  return {
    scale: r3(best.s),
    from: { x: rc.x, y: rc.y },
    to: { x: r3((cbx + best.dx) / build.width), y: r3((cby + best.dy) / build.height) },
    correlation: r3(best.c)
  };
}
export {
  DIFF_DEFAULTS,
  cellLuma,
  diffArgsError,
  motionCentre,
  pictureChange,
  pictureOf,
  registerMotionMaps,
  resolveDiffThresholds,
  summarizeSeries
};

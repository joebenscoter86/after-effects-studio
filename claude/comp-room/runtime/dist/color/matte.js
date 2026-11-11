const EDGE_DEFAULTS = {
  transparent: 2 / 255,
  opaque: 1 - 2 / 255,
  maxEdgeWidth: "auto",
  mainAreaShare: 0.25,
  listed: 5,
  screen: "green",
  spillMinAlpha: 0.1,
  spillThreshold: 0.03,
  changeAbove: 0.05,
  patchWindow: "auto"
};
const CONTOUR_ALPHA = 0.5;
function autoMaxEdgeWidth(width, height) {
  return Math.max(4, Math.round(0.01 * Math.min(width, height)));
}
function resolveEdgeThresholds(args, width, height) {
  const maxEdgeWidth = args.maxEdgeWidth ?? autoMaxEdgeWidth(width, height);
  return {
    transparent: args.transparent ?? EDGE_DEFAULTS.transparent,
    opaque: args.opaque ?? EDGE_DEFAULTS.opaque,
    maxEdgeWidth,
    mainAreaShare: args.mainAreaShare ?? EDGE_DEFAULTS.mainAreaShare,
    listed: args.listed ?? EDGE_DEFAULTS.listed,
    screen: args.screen ?? EDGE_DEFAULTS.screen,
    spillMinAlpha: args.spillMinAlpha ?? EDGE_DEFAULTS.spillMinAlpha,
    spillThreshold: args.spillThreshold ?? EDGE_DEFAULTS.spillThreshold,
    changeAbove: args.changeAbove ?? EDGE_DEFAULTS.changeAbove,
    patchWindow: args.patchWindow ?? Math.round(4 * maxEdgeWidth)
  };
}
function edgeArgsError(args) {
  const unit = ["transparent", "opaque", "mainAreaShare", "spillMinAlpha", "changeAbove"];
  for (const key of unit) {
    const v = args[key];
    if (v !== void 0 && (typeof v !== "number" || !(v >= 0 && v <= 1))) {
      return `\`edge.${key}\` must be a number in 0..1`;
    }
  }
  const t = args.transparent ?? EDGE_DEFAULTS.transparent;
  const o = args.opaque ?? EDGE_DEFAULTS.opaque;
  if (t >= o) return "`edge.transparent` must be below `edge.opaque`";
  const w = args.maxEdgeWidth;
  if (w !== void 0 && (typeof w !== "number" || !Number.isFinite(w) || w < 1)) {
    return "`edge.maxEdgeWidth` must be at least 1 (pixels)";
  }
  const pw = args.patchWindow;
  if (pw !== void 0 && (typeof pw !== "number" || !Number.isFinite(pw) || pw < 1)) {
    return "`edge.patchWindow` must be at least 1 (pixels)";
  }
  const listed = args.listed;
  if (listed !== void 0 && (!Number.isInteger(listed) || listed < 0)) {
    return "`edge.listed` must be a whole number, 0 or more";
  }
  const s = args.spillThreshold;
  if (s !== void 0 && (typeof s !== "number" || !(s >= 0 && s <= 1))) {
    return "`edge.spillThreshold` must be a number in 0..1";
  }
  if (args.screen !== void 0 && args.screen !== "green" && args.screen !== "blue") {
    return "`edge.screen` must be 'green' or 'blue'";
  }
  return null;
}
const OUTSIDE = 0;
const EDGE = 1;
const INSIDE = 2;
const r2 = (v) => Math.round(v * 100) / 100;
const r4 = (v) => Math.round(v * 1e4) / 1e4;
const r4rgb = (v) => [r4(v[0]), r4(v[1]), r4(v[2])];
const INF = 1e20;
function dt1d(f, n, d, v, z) {
  let k = -1;
  for (let q = 0; q < n; q++) {
    const fq = f[q];
    if (fq >= INF) continue;
    if (k < 0) {
      k = 0;
      v[0] = q;
      z[0] = -Infinity;
      z[1] = Infinity;
      continue;
    }
    let s = 0;
    for (; ; ) {
      const r = v[k];
      s = (fq + q * q - (f[r] + r * r)) / (2 * q - 2 * r);
      if (s <= z[k]) k--;
      else break;
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  if (k < 0) {
    d.fill(INF, 0, n);
    return;
  }
  let j = 0;
  for (let q = 0; q < n; q++) {
    while (z[j + 1] < q) j++;
    const r = v[j];
    d[q] = (q - r) * (q - r) + f[r];
  }
}
function distanceTo(alpha, width, height, isSource, scratch, out) {
  const n = Math.max(width, height);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) f[y] = isSource(alpha[y * width + x]) ? 0 : INF;
    dt1d(f, height, d, v, z);
    for (let y = 0; y < height; y++) scratch[y * width + x] = d[y];
  }
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) f[x] = scratch[row + x];
    dt1d(f, width, d, v, z);
    for (let x = 0; x < width; x++) out[row + x] = d[x] >= INF / 2 ? Infinity : Math.sqrt(d[x]);
  }
}
const newRegion = () => ({
  area: 0,
  minX: Infinity,
  minY: Infinity,
  maxX: -1,
  maxY: -1,
  alphaSum: 0,
  alphaMax: 0,
  transparent: 0,
  touchesBorder: false
});
function addPixel(r, x, y, a) {
  r.area++;
  if (x < r.minX) r.minX = x;
  if (x > r.maxX) r.maxX = x;
  if (y < r.minY) r.minY = y;
  if (y > r.maxY) r.maxY = y;
  r.alphaSum += a;
  if (a > r.alphaMax) r.alphaMax = a;
}
const box = (r) => ({
  x: r.minX,
  y: r.minY,
  width: r.maxX - r.minX + 1,
  height: r.maxY - r.minY + 1
});
const N4X = [1, -1, 0, 0];
const N4Y = [0, 0, 1, -1];
const N8X = [1, -1, 0, 0, 1, 1, -1, -1];
const N8Y = [0, 0, 1, -1, 1, -1, 1, -1];
function labelRegions(alpha, width, height, inSet, eight, labels, queue, transparentAt) {
  labels.fill(0);
  const regions = [];
  const nx = eight ? N8X : N4X;
  const ny = eight ? N8Y : N4Y;
  const total = width * height;
  for (let start = 0; start < total; start++) {
    if (labels[start] !== 0 || !inSet(start)) continue;
    const region = newRegion();
    regions.push(region);
    const id = regions.length;
    labels[start] = id;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    while (head < tail) {
      const p = queue[head++];
      const x = p % width;
      const y = (p - x) / width;
      const a = alpha[p];
      addPixel(region, x, y, a);
      if (a <= transparentAt) region.transparent++;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) region.touchesBorder = true;
      for (let k = 0; k < nx.length; k++) {
        const qx = x + nx[k];
        const qy = y + ny[k];
        if (qx < 0 || qy < 0 || qx >= width || qy >= height) continue;
        const q = qy * width + qx;
        if (labels[q] !== 0 || !inSet(q)) continue;
        labels[q] = id;
        queue[tail++] = q;
      }
    }
  }
  return regions;
}
const byArea = (a, b) => b.area - a.area;
function screenExcess(c, screen) {
  return screen === "green" ? c[1] - Math.max(c[0], c[2]) : c[2] - Math.max(c[0], c[1]);
}
function measureEdge(img, bg, t) {
  const alpha = img.alpha;
  if (!alpha) throw new Error("the capture has no alpha channel");
  const { width, height } = img;
  const n = width * height;
  const isT = (a) => a <= t.transparent;
  const isO = (a) => a >= t.opaque;
  let opaque = 0;
  let transparent = 0;
  for (let p = 0; p < n; p++) {
    if (isO(alpha[p])) opaque++;
    else if (isT(alpha[p])) transparent++;
  }
  const scratch = new Float32Array(n);
  const dT = new Float32Array(n);
  const dO = new Float32Array(n);
  distanceTo(alpha, width, height, isT, scratch, dT);
  distanceTo(alpha, width, height, isO, scratch, dO);
  const labels = new Int32Array(n);
  const queue = new Int32Array(n);
  const islands = labelRegions(
    alpha,
    width,
    height,
    (p) => alpha[p] > t.transparent,
    true,
    labels,
    queue,
    t.transparent
  );
  const largest = islands.reduce((m2, r) => Math.max(m2, r.area), 0);
  const isMain = islands.map((r) => r.area > 0 && r.area >= t.mainAreaShare * largest);
  const mains = islands.filter((_, i) => isMain[i]).sort(byArea);
  const specks = islands.filter((_, i) => !isMain[i]).sort(byArea);
  const widths = [];
  let unmeasured = 0;
  let worst = -1;
  let worstAt = null;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (alpha[p] < CONTOUR_ALPHA || labels[p] === 0 || !isMain[labels[p] - 1]) continue;
      let onContour = false;
      for (let k = 0; k < 4 && !onContour; k++) {
        const qx = x + N4X[k];
        const qy = y + N4Y[k];
        if (qx < 0 || qy < 0 || qx >= width || qy >= height) continue;
        if (alpha[qy * width + qx] < CONTOUR_ALPHA) onContour = true;
      }
      if (!onContour) continue;
      const sum = dT[p] + dO[p];
      if (!Number.isFinite(sum)) {
        unmeasured++;
        continue;
      }
      const w = Math.max(0, sum - 1);
      widths.push(w);
      if (w > worst) {
        worst = w;
        worstAt = { x, y };
      }
    }
  }
  widths.sort((a, b) => a - b);
  const m = widths.length;
  const median = m === 0 ? null : m % 2 ? widths[(m - 1) / 2] : (widths[m / 2 - 1] + widths[m / 2]) / 2;
  const belowOpaque = labelRegions(
    alpha,
    width,
    height,
    (p) => alpha[p] < t.opaque,
    false,
    labels,
    queue,
    t.transparent
  );
  const holes = belowOpaque.filter((r) => !r.touchesBorder).sort(byArea);
  const half = t.maxEdgeWidth / 2;
  const isPartial = (p) => alpha[p] > t.transparent && alpha[p] < t.opaque;
  const isCore = (p) => isPartial(p) && Math.min(dT[p], dO[p]) > half;
  labels.fill(0);
  let tail = 0;
  let ids = 0;
  for (let start = 0; start < n; start++) {
    if (labels[start] !== 0 || !isCore(start)) continue;
    ids++;
    labels[start] = ids;
    let head = tail;
    queue[tail++] = start;
    while (head < tail) {
      const p = queue[head++];
      const x = p % width;
      const y = (p - x) / width;
      for (let k = 0; k < 8; k++) {
        const qx = x + N8X[k];
        const qy = y + N8Y[k];
        if (qx < 0 || qy < 0 || qx >= width || qy >= height) continue;
        const q = qy * width + qx;
        if (labels[q] !== 0 || !isCore(q)) continue;
        labels[q] = ids;
        queue[tail++] = q;
      }
    }
  }
  let levelStart = 0;
  let levelEnd = tail;
  for (let step = 0; step < Math.ceil(half) && levelStart < levelEnd; step++) {
    for (let i = levelStart; i < levelEnd; i++) {
      const p = queue[i];
      const x = p % width;
      const y = (p - x) / width;
      for (let k = 0; k < 8; k++) {
        const qx = x + N8X[k];
        const qy = y + N8Y[k];
        if (qx < 0 || qy < 0 || qx >= width || qy >= height) continue;
        const q = qy * width + qx;
        if (labels[q] !== 0 || !isPartial(q)) continue;
        labels[q] = labels[p];
        queue[tail++] = q;
      }
    }
    levelStart = levelEnd;
    levelEnd = tail;
  }
  const patchRegions = Array.from({ length: ids }, newRegion);
  for (let i = 0; i < tail; i++) {
    const p = queue[i];
    const x = p % width;
    addPixel(patchRegions[labels[p] - 1], x, (p - x) / width, alpha[p]);
  }
  const patchId = new Map(patchRegions.map((r, i) => [r, i + 1]));
  patchRegions.sort(byArea);
  const patchList = patchRegions.slice(0, t.listed).map((r) => patchEntry(r, patchId.get(r), labels, alpha, dT, dO, width, t.patchWindow));
  const edgeSum = [0, 0, 0];
  const solidSum = [0, 0, 0];
  let edgeCount = 0;
  let solidCount = 0;
  const zones = new Uint8Array(n);
  const M = t.maxEdgeWidth;
  for (let p = 0; p < n; p++) {
    const a = alpha[p];
    zones[p] = dT[p] <= M && dO[p] <= M ? EDGE : a >= CONTOUR_ALPHA ? INSIDE : OUTSIDE;
    const partial = a > t.transparent && a < t.opaque;
    const solid = a >= t.opaque && dT[p] <= M;
    if (!(partial && a >= t.spillMinAlpha) && !solid) continue;
    const sum = solid ? solidSum : edgeSum;
    for (let c = 0; c < 3; c++) {
      const v = img.rgb[p * 3 + c];
      sum[c] += a >= 1 ? v : Math.min(1, Math.max(0, (v - bg[c] * (1 - a)) / a));
    }
    if (solid) solidCount++;
    else edgeCount++;
  }
  const meanOf = (s, k) => k === 0 ? null : [s[0] / k, s[1] / k, s[2] / k];
  const edgeMean = meanOf(edgeSum, edgeCount);
  const solidMean = meanOf(solidSum, solidCount);
  const excess = edgeMean ? screenExcess(edgeMean, t.screen) : null;
  const solidExcess = solidMean ? screenExcess(solidMean, t.screen) : null;
  const leans = excess !== null && excess > t.spillThreshold && (solidExcess === null || excess - solidExcess > t.spillThreshold);
  const report = {
    stage: "capture",
    pixels: n,
    shares: {
      opaque: r4(opaque / n),
      partial: r4((n - opaque - transparent) / n),
      transparent: r4(transparent / n)
    },
    width: {
      typical: median === null ? null : r2(median),
      p90: m === 0 ? null : r2(widths[Math.floor(0.9 * (m - 1))]),
      worst: m === 0 ? null : r2(worst),
      worstAt,
      samples: m,
      unmeasured
    },
    solidAreas: {
      count: mains.length,
      list: mains.slice(0, t.listed).map((r) => ({ ...box(r), area: r.area }))
    },
    holes: {
      count: holes.length,
      area: holes.reduce((s, r) => s + r.area, 0),
      transparentArea: holes.reduce((s, r) => s + r.transparent, 0),
      largest: holes.length ? holeEntry(holes[0]) : null,
      list: holes.slice(0, t.listed).map(holeEntry)
    },
    specks: {
      count: specks.length,
      area: specks.reduce((s, r) => s + r.area, 0),
      list: specks.slice(0, t.listed).map((r) => ({
        ...box(r),
        area: r.area,
        meanAlpha: r4(r.alphaSum / r.area),
        maxAlpha: r4(r.alphaMax)
      }))
    },
    patches: {
      count: patchRegions.length,
      area: patchRegions.reduce((s, r) => s + r.area, 0),
      list: patchList
    },
    spill: {
      screen: t.screen,
      pixels: edgeCount,
      mean: edgeMean ? r4rgb(edgeMean) : null,
      solidMean: solidMean ? r4rgb(solidMean) : null,
      excess: excess === null ? null : r4(excess),
      solidExcess: solidExcess === null ? null : r4(solidExcess),
      leansToScreen: leans,
      reading: spillReading(t, edgeCount, excess, solidExcess, leans)
    }
  };
  return { report, frame: { width, height, alpha: Float32Array.from(alpha), zones } };
}
function holeEntry(r) {
  return { ...box(r), area: r.area, meanAlpha: r4(r.alphaSum / r.area) };
}
function patchEntry(r, id, labels, alpha, dT, dO, width, window) {
  const b = box(r);
  let depth = -1;
  let at = { x: b.x, y: b.y };
  let thickness = 0;
  for (let y = b.y; y < b.y + b.height; y++) {
    for (let x = b.x; x < b.x + b.width; x++) {
      const p = y * width + x;
      if (labels[p] !== id) continue;
      const m = Math.min(dT[p], dO[p]);
      if (m > depth) {
        depth = m;
        at = { x, y };
        thickness = Number.isFinite(dT[p]) && Number.isFinite(dO[p]) ? dT[p] + dO[p] - 1 : 2 * m - 1;
      }
    }
  }
  const bw = b.width;
  const bh = b.height;
  const ww = Math.max(1, Math.min(Math.round(window), bw));
  const wh = Math.max(1, Math.min(Math.round(window), bh));
  const sc = new Float64Array((bw + 1) * (bh + 1));
  const sa = new Float64Array((bw + 1) * (bh + 1));
  const W = bw + 1;
  for (let j = 0; j < bh; j++) {
    let rowC = 0;
    let rowA = 0;
    for (let i = 0; i < bw; i++) {
      const p = (b.y + j) * width + (b.x + i);
      if (labels[p] === id) {
        rowC++;
        rowA += alpha[p];
      }
      sc[(j + 1) * W + i + 1] = sc[j * W + i + 1] + rowC;
      sa[(j + 1) * W + i + 1] = sa[j * W + i + 1] + rowA;
    }
  }
  const rect = (s, i, j) => s[(j + wh) * W + i + ww] - s[j * W + i + ww] - s[(j + wh) * W + i] + s[j * W + i];
  let bestC = -1;
  let bestA = 0;
  let bi = 0;
  let bj = 0;
  for (let j = 0; j + wh <= bh; j++) {
    for (let i = 0; i + ww <= bw; i++) {
      const c = rect(sc, i, j);
      if (c > bestC) {
        bestC = c;
        bestA = rect(sa, i, j);
        bi = i;
        bj = j;
      }
    }
  }
  return {
    ...b,
    area: r.area,
    meanAlpha: r4(r.alphaSum / r.area),
    thickest: { ...at, thickness: r2(Math.max(0, thickness)) },
    densest: {
      x: b.x + bi,
      y: b.y + bj,
      width: ww,
      height: wh,
      pixels: bestC,
      share: r4(bestC / (ww * wh)),
      meanAlpha: bestC > 0 ? r4(bestA / bestC) : 0
    }
  };
}
function spillReading(t, pixels, excess, solidExcess, leans) {
  const other = t.screen === "green" ? "red and blue" : "red and green";
  if (pixels === 0 || excess === null) {
    return `no partly transparent pixels at or above alpha ${t.spillMinAlpha} to read a colour from`;
  }
  const lean = `its ${t.screen} exceeds the larger of ${other} by ${excess.toFixed(3)}`;
  const versus = solidExcess === null ? "" : `; the solid area just inside the edge: ${solidExcess.toFixed(3)}`;
  return leans ? `the soft edge leans ${t.screen} (likely spill): ${lean}${versus}` : `the soft edge does not lean ${t.screen} beyond the subject's own colour: ${lean}${versus}`;
}
const zoneAcc = () => ({
  pixels: 0,
  sum: 0,
  max: 0,
  changed: 0,
  minX: Infinity,
  minY: Infinity,
  maxX: -1,
  maxY: -1
});
function finishZone(z) {
  return {
    pixels: z.pixels,
    meanAbsDelta: z.pixels ? r4(z.sum / z.pixels) : 0,
    maxAbsDelta: r4(z.max),
    changedShare: z.pixels ? r4(z.changed / z.pixels) : 0,
    changedBounds: z.changed === 0 ? null : { x: z.minX, y: z.minY, width: z.maxX - z.minX + 1, height: z.maxY - z.minY + 1 }
  };
}
function alphaChange(prev, cur, t) {
  if (prev.width !== cur.width || prev.height !== cur.height) {
    throw new Error(
      `cannot compare frames of different size (${prev.width}\xD7${prev.height} vs ${cur.width}\xD7${cur.height})`
    );
  }
  const { width } = cur;
  const acc = [zoneAcc(), zoneAcc(), zoneAcc()];
  const all = zoneAcc();
  const n = width * cur.height;
  for (let p = 0; p < n; p++) {
    const zp = prev.zones[p];
    const zc = cur.zones[p];
    const zone = zp === INSIDE || zc === INSIDE ? INSIDE : zp === OUTSIDE || zc === OUTSIDE ? OUTSIDE : EDGE;
    const d = Math.abs(cur.alpha[p] - prev.alpha[p]);
    for (const z of [acc[zone], all]) {
      z.pixels++;
      z.sum += d;
      if (d > z.max) z.max = d;
      if (d > t.changeAbove) {
        z.changed++;
        const x = p % width;
        const y = (p - x) / width;
        if (x < z.minX) z.minX = x;
        if (x > z.maxX) z.maxX = x;
        if (y < z.minY) z.minY = y;
        if (y > z.maxY) z.maxY = y;
      }
    }
  }
  return {
    edge: finishZone(acc[EDGE]),
    inside: finishZone(acc[INSIDE]),
    outside: finishZone(acc[OUTSIDE]),
    all: finishZone(all)
  };
}
function summarizeFlicker(pairs) {
  const zone = (key) => {
    let mean = 0;
    let max = 0;
    let share = 0;
    let worst = null;
    for (const pair of pairs) {
      const z = pair[key];
      mean += z.meanAbsDelta;
      share += z.changedShare;
      if (z.maxAbsDelta > max) max = z.maxAbsDelta;
      if (z.meanAbsDelta > 0 && (worst === null || z.meanAbsDelta > worst[key].meanAbsDelta)) {
        worst = pair;
      }
    }
    const k = Math.max(1, pairs.length);
    return {
      meanAbsDelta: r4(mean / k),
      maxAbsDelta: r4(max),
      changedShare: r4(share / k),
      worstPair: worst ? { from: worst.from.index, to: worst.to.index } : null
    };
  };
  return { edge: zone("edge"), inside: zone("inside"), outside: zone("outside"), all: zone("all") };
}
export {
  CONTOUR_ALPHA,
  EDGE_DEFAULTS,
  addPixel,
  alphaChange,
  autoMaxEdgeWidth,
  box,
  distanceTo,
  edgeArgsError,
  labelRegions,
  measureEdge,
  newRegion,
  resolveEdgeThresholds,
  summarizeFlicker
};

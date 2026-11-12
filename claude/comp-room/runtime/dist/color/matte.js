const EDGE_DEFAULTS = {
  from: "alpha",
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
    from: args.from ?? EDGE_DEFAULTS.from,
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
  if (args.from !== void 0 && args.from !== "alpha" && args.from !== "luma") {
    return "`edge.from` must be 'alpha' or 'luma'";
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
function lumaMatte(img) {
  const n = img.width * img.height;
  const out = new Float64Array(n);
  const rgb = img.rgb;
  for (let p = 0; p < n; p++) {
    const r = rgb[p * 3];
    const g = rgb[p * 3 + 1];
    const b = rgb[p * 3 + 2];
    const y = r === g && g === b ? r : 0.2126 * r + 0.7152 * g + 0.0722 * b;
    out[p] = y < 0 ? 0 : y > 1 ? 1 : y;
  }
  return out;
}
function measureEdge(img, bg, t) {
  const fromLuma = t.from === "luma";
  const alpha = fromLuma ? lumaMatte(img) : img.alpha;
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
  const median2 = m === 0 ? null : m % 2 ? widths[(m - 1) / 2] : (widths[m / 2 - 1] + widths[m / 2]) / 2;
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
    if (fromLuma || !(partial && a >= t.spillMinAlpha) && !solid) continue;
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
    matteFrom: t.from,
    pixels: n,
    shares: {
      opaque: r4(opaque / n),
      partial: r4((n - opaque - transparent) / n),
      transparent: r4(transparent / n)
    },
    width: {
      typical: median2 === null ? null : r2(median2),
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
      reading: fromLuma ? "not read: the matte came from luminance (a Keylight matte view), which carries no subject colour; read spill on the keyed result with `from: 'alpha'`" : spillReading(t, edgeCount, excess, solidExcess, leans)
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
function enclosedHoles(alpha, width, height, opts = {}) {
  const below = opts.below ?? EDGE_DEFAULTS.opaque;
  const minArea = opts.minArea ?? 1;
  const n = width * height;
  const a = alpha instanceof Float64Array ? alpha : Float64Array.from(alpha);
  const labels = new Int32Array(n);
  const queue = new Int32Array(n);
  const regions = labelRegions(
    a,
    width,
    height,
    (p) => a[p] < below,
    false,
    labels,
    queue,
    EDGE_DEFAULTS.transparent
  );
  const keep = new Uint8Array(regions.length + 1);
  const holes = [];
  const dropped = { count: 0, area: 0 };
  const leftOut = { count: 0, area: 0 };
  const entry = (r) => ({
    ...box(r),
    area: r.area,
    meanAlpha: Math.round(r.alphaSum / r.area * 1e3) / 1e3
  });
  regions.forEach((r, i) => {
    if (r.touchesBorder) return;
    if (r.area < minArea) {
      dropped.count++;
      dropped.area += r.area;
      return;
    }
    if (opts.keep && !opts.keep(entry(r))) {
      leftOut.count++;
      leftOut.area += r.area;
      return;
    }
    keep[i + 1] = 1;
    holes.push({ r, id: i + 1 });
  });
  const mask = new Uint8Array(n);
  for (let p = 0; p < n; p++) if (keep[labels[p]]) mask[p] = 1;
  holes.sort((x, y) => y.r.area - x.r.area);
  return { holes: holes.map(({ r }) => entry(r)), mask, dropped, leftOut };
}
function growMask(mask, width, height, radius) {
  if (radius <= 0) return Uint8Array.from(mask);
  const src = Float64Array.from(mask);
  const scratch = new Float32Array(width * height);
  const dist = new Float32Array(width * height);
  distanceTo(src, width, height, (v) => v > 0, scratch, dist);
  const out = new Uint8Array(width * height);
  for (let p = 0; p < out.length; p++) if (dist[p] <= radius + 1e-9) out[p] = 1;
  return out;
}
function cutoutRegions(alpha, width, height, opts = {}) {
  const below = opts.below ?? EDGE_DEFAULTS.opaque;
  const minArea = opts.minArea ?? 1;
  const n = width * height;
  const a = Float64Array.from(alpha);
  const original = alpha;
  const sealedEdge = new Int8Array(n).fill(-1);
  const EDGES = ["top", "bottom", "left", "right"];
  const edgePixels = (e) => {
    const out = [];
    if (e < 2) {
      const y = e === 0 ? 0 : height - 1;
      for (let x = 0; x < width; x++) out.push(y * width + x);
    } else {
      const x = e === 2 ? 0 : width - 1;
      for (let y = 0; y < height; y++) out.push(y * width + x);
    }
    return out;
  };
  for (let e = 0; e < 4; e++) {
    const px = edgePixels(e);
    let first = -1;
    let last = -1;
    let count = 0;
    for (let i = 0; i < px.length; i++)
      if (original[px[i]] >= below) {
        if (first < 0) first = i;
        last = i;
        count++;
      }
    if (count < 2) continue;
    for (let i = first; i <= last; i++) {
      const p = px[i];
      if (original[p] < below) {
        if (sealedEdge[p] < 0) sealedEdge[p] = e;
        a[p] = 1;
      }
    }
  }
  const labels = new Int32Array(n);
  const queue = new Int32Array(n);
  const regions = labelRegions(
    a,
    width,
    height,
    (p) => a[p] < below,
    false,
    labels,
    queue,
    EDGE_DEFAULTS.transparent
  );
  const extra = regions.map(() => ({
    area: 0,
    sum: 0,
    minX: Infinity,
    minY: Infinity,
    maxX: -1,
    maxY: -1,
    edges: /* @__PURE__ */ new Set()
  }));
  for (let p = 0; p < n; p++) {
    const e = sealedEdge[p];
    if (e < 0) continue;
    const x = p % width;
    const y = (p - x) / width;
    const q = e === 0 ? p + width : e === 1 ? p - width : e === 2 ? p + 1 : p - 1;
    const qx = q % width;
    const qy = (q - qx) / width;
    if (q < 0 || q >= n || e >= 2 && Math.abs(qy - y) !== 0) continue;
    const id = labels[q];
    if (!id || regions[id - 1].touchesBorder) continue;
    const r = extra[id - 1];
    r.area++;
    r.sum += original[p];
    r.minX = Math.min(r.minX, x);
    r.maxX = Math.max(r.maxX, x);
    r.minY = Math.min(r.minY, y);
    r.maxY = Math.max(r.maxY, y);
    r.edges.add(EDGES[e]);
  }
  const holes = [];
  const openings = [];
  const dropped = { count: 0, area: 0 };
  regions.forEach((r, i) => {
    if (r.touchesBorder) return;
    const x = extra[i];
    const area = r.area + x.area;
    if (area < minArea) {
      dropped.count++;
      dropped.area += area;
      return;
    }
    const minX = Math.min(r.minX, x.minX);
    const minY = Math.min(r.minY, x.minY);
    const entry = {
      x: minX,
      y: minY,
      width: Math.max(r.maxX, x.maxX) - minX + 1,
      height: Math.max(r.maxY, x.maxY) - minY + 1,
      area,
      meanAlpha: Math.round((r.alphaSum + x.sum) / area * 1e3) / 1e3
    };
    if (x.edges.size > 0) openings.push({ ...entry, edges: EDGES.filter((e) => x.edges.has(e)) });
    else holes.push(entry);
  });
  holes.sort((p, q) => q.area - p.area);
  openings.sort((p, q) => q.area - p.area);
  return { holes, openings, dropped };
}
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length;
  return m % 2 ? s[(m - 1) / 2] : (s[m / 2 - 1] + s[m / 2]) / 2;
};
const r6 = (n) => Math.round(n * 1e6) / 1e6;
function outlineTracker(opts = {}) {
  const gap = opts.gap ?? 30;
  const limit = opts.limit ?? 2e-3;
  const minFrames = opts.minFrames ?? 60;
  const step = Math.round((opts.step ?? 0.1) * 255);
  const lumaStep = Math.round(0.05 * 255);
  const ring = [];
  const neighbours = [];
  const windows = [];
  const changed = (x, y) => {
    let n = 0;
    for (let p = 0; p < x.length; p++) if (Math.abs(x[p] - y[p]) > step) n++;
    return n / x.length;
  };
  const footage = (p, c) => {
    let n = 0;
    for (let i = 0; i < p.a.length; i++)
      if (p.a[i] >= 250 && c.a[i] >= 250 && Math.abs(p.l[i] - c.l[i]) > lumaStep) n++;
    return n / p.a.length;
  };
  return {
    add(frame, alpha, rgb, width, height) {
      const n = width * height;
      const a = new Uint8Array(n);
      const l = new Uint8Array(n);
      for (let p = 0; p < n; p++) {
        a[p] = Math.round(Math.min(1, Math.max(0, alpha[p])) * 255);
        if (rgb)
          l[p] = Math.round(
            Math.min(
              1,
              Math.max(0, 0.2126 * rgb[p * 3] + 0.7152 * rgb[p * 3 + 1] + 0.0722 * rgb[p * 3 + 2])
            ) * 255
          );
      }
      const cur = { frame, a, l };
      const prev = ring[ring.length - 1];
      if (prev && prev.frame === frame - 1) neighbours.push(changed(prev.a, a));
      let partner;
      for (const e of ring) if (e.frame <= frame - gap) partner = e;
      if (partner)
        windows.push({
          a: partner.frame,
          b: frame,
          drift: changed(partner.a, a),
          footage: footage(partner, cur)
        });
      ring.push(cur);
      let keepFrom = 0;
      for (let i = 0; i < ring.length; i++) if (ring[i].frame <= frame + 1 - gap) keepFrom = i;
      ring.splice(0, keepFrom);
    },
    result() {
      const frozen = [];
      let run = [];
      const close = () => {
        if (run.length >= 2) {
          const from = run[0].a;
          const to = run[run.length - 1].b;
          if (to - from + 1 >= minFrames)
            frozen.push({
              from,
              to,
              length: to - from + 1,
              drift: r6(Math.max(...run.map((w) => w.drift))),
              footageChange: r6(median(run.map((w) => w.footage)) ?? 0)
            });
        }
        run = [];
      };
      for (const w of windows) {
        if (w.drift < limit) run.push(w);
        else close();
      }
      close();
      const stats = (xs) => ({
        min: xs.length ? r6(Math.min(...xs)) : null,
        median: xs.length ? r6(median(xs)) : null,
        max: xs.length ? r6(Math.max(...xs)) : null
      });
      return {
        at: "full size: the share of the frame whose alpha changed by more than " + (opts.step ?? 0.1),
        neighbours: { ...stats(neighbours), pairs: neighbours.length },
        drift: { gap, ...stats(windows.map((w) => w.drift)), windows: windows.length },
        limits: { gap, limit, minFrames, step: opts.step ?? 0.1 },
        frozen
      };
    }
  };
}
const SPECK_DEFAULTS = { opaque: 0.5, minArea: 20, maxArea: 2e3, neck: 1 };
function erodeCross(m, w, h, times) {
  let cur = m;
  for (let t = 0; t < times; t++) {
    const next = new Uint8Array(cur.length);
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x;
        next[p] = cur[p] & cur[p - 1] & cur[p + 1] & cur[p - w] & cur[p + w];
      }
    cur = next;
  }
  return cur;
}
function labelMask(m, w, h) {
  const a = new Float64Array(m.length);
  for (let i = 0; i < m.length; i++) a[i] = m[i];
  const labels = new Int32Array(m.length);
  const regions = labelRegions(
    a,
    w,
    h,
    (p) => m[p] === 1,
    true,
    labels,
    new Int32Array(m.length),
    -1
  );
  return { labels, regions };
}
function speckPieces(alpha, width, height, opts = {}) {
  const o = { ...SPECK_DEFAULTS, ...opts };
  const w = width;
  const m = new Uint8Array(w * height);
  for (let i = 0; i < m.length; i++) m[i] = alpha[i] >= o.opaque ? 1 : 0;
  const { labels } = labelMask(erodeCross(m, w, height, o.neck), w, height);
  for (let t = 0; t < o.neck + 1; t++) {
    const grown = labels.slice();
    for (let y = 0; y < height; y++)
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (!m[p] || labels[p]) continue;
        const n = x > 0 && labels[p - 1] || x < w - 1 && labels[p + 1] || y > 0 && labels[p - w] || y < height - 1 && labels[p + w] || 0;
        if (n) grown[p] = n;
      }
    labels.set(grown);
  }
  const rest = new Uint8Array(m.length);
  for (let i = 0; i < m.length; i++) rest[i] = m[i] && !labels[i] ? 1 : 0;
  const thin = labelMask(rest, w, height);
  const stats = /* @__PURE__ */ new Map();
  const add = (key, x, y) => {
    let s = stats.get(key);
    if (!s) stats.set(key, s = { minX: x, minY: y, maxX: x, maxY: y, area: 0, edge: false });
    s.area++;
    if (x < s.minX) s.minX = x;
    if (x > s.maxX) s.maxX = x;
    if (y < s.minY) s.minY = y;
    if (y > s.maxY) s.maxY = y;
    if (x === 0 || y === 0 || x === w - 1 || y === height - 1) s.edge = true;
  };
  for (let y = 0; y < height; y++)
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (labels[p]) add(`g${labels[p]}`, x, y);
      else if (thin.labels[p]) add(`t${thin.labels[p]}`, x, y);
    }
  const list = [...stats.values()].sort((a, b) => b.area - a.area);
  const main = list[0];
  if (!main) return [];
  const pieces = [];
  for (const [key, s] of stats) {
    if (s === main || s.edge || s.area < o.minArea || s.area > o.maxArea) continue;
    if (key.startsWith("t")) {
      let touches = false;
      const id = Number(key.slice(1));
      for (let y = s.minY; y <= s.maxY && !touches; y++)
        for (let x = s.minX; x <= s.maxX && !touches; x++) {
          const p = y * w + x;
          if (thin.labels[p] !== id) continue;
          for (const q of [p - 1, p + 1, p - w, p + w, p - w - 1, p - w + 1, p + w - 1, p + w + 1])
            if (q >= 0 && q < m.length && labels[q]) touches = true;
        }
      if (touches) continue;
    }
    pieces.push({
      x: s.minX,
      y: s.minY,
      width: s.maxX - s.minX + 1,
      height: s.maxY - s.minY + 1,
      area: s.area
    });
  }
  return pieces.sort((p, q) => q.area - p.area);
}
export {
  CONTOUR_ALPHA,
  EDGE_DEFAULTS,
  SPECK_DEFAULTS,
  addPixel,
  alphaChange,
  autoMaxEdgeWidth,
  box,
  cutoutRegions,
  distanceTo,
  edgeArgsError,
  enclosedHoles,
  growMask,
  labelRegions,
  lumaMatte,
  measureEdge,
  newRegion,
  outlineTracker,
  resolveEdgeThresholds,
  speckPieces,
  summarizeFlicker
};

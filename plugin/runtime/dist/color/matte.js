// Matte quality as numbers (agent-eyes plan, stage 3): the `edge` report of
// ae_render_frame. Everything here is measured in Node on a decoded capture's
// alpha channel (and, for spill, its colour after the comp background is taken
// out with the same formula as unmatte()). It reports numbers and places; it
// never passes or fails a key.
//
// The pieces, all on one frame:
//   - shares of opaque, partly transparent and transparent pixels;
//   - edge width: at every pixel on the 50% alpha contour of a main solid
//     area, how far the alpha takes to go from transparent to opaque across
//     the boundary (distance to the nearest transparent pixel + distance to
//     the nearest opaque pixel − 1, Euclidean, in pixels);
//   - holes: 4-connected regions below `opaque` that do not touch the frame
//     border, so are enclosed by the solid area;
//   - main solid areas and specks: 8-connected islands of covered pixels
//     (alpha above `transparent`); the largest, and any at least
//     `mainAreaShare` of it, are main areas; the rest are specks;
//   - patches: partly transparent regions thicker than a thin edge (their
//     core lies more than maxEdgeWidth / 2 from any transparent or opaque
//     pixel), grown back out by that much to their full extent;
//   - spill: the mean straight colour of the partly transparent pixels and of
//     the solid pixels just inside the edge, and whether the edge leans
//     towards the screen colour more than the subject does.
// And between two frames: the change in alpha, split into edge, inside the
// solid area, and outside it (see alphaChange).
//
// Memory: per frame a few full-size typed arrays live while it is measured
// (two Float32 distance maps, a Float32 scratch map, an Int32 label map and
// queue, a Uint8 mark map: about 34 bytes a pixel, ~70 MB at 1080×1920), and
// only `frame` (Float32 alpha + Uint8 zones, 5 bytes a pixel) is kept for the
// next frame's flicker. No decoded frame is held.
/**
 * The defaults and why:
 * - transparent / opaque: two 8-bit steps from 0 and 1, the same cut `sample`
 *   uses for its alpha shares, so the two reports agree. Anything a key leaves
 *   above that in the screen is real (it will show over a bright plate).
 * - maxEdgeWidth: 1% of the frame's shorter side, at least 4 px (11 px at
 *   1080×1920). A keyed hair or shoulder edge at HD is a few pixels; wider
 *   transitions (heavy motion blur, a half-keyed remnant, an unkeyed screen)
 *   are reported as patches so they are not averaged into "edge".
 * - mainAreaShare 0.25: a second subject a quarter of the first's size is a
 *   subject; smaller islands are specks. Main areas are listed, so nothing is
 *   hidden either way.
 * - listed 5: enough to find the worst places without flooding the response.
 * - spillMinAlpha 0.1: un-matting divides by alpha, so below ~0.1 a pixel's
 *   recovered colour is mostly quantisation noise.
 * - spillThreshold 0.03: about eight 8-bit steps of lean towards the screen
 *   channel; smaller leans are within grading noise.
 * - changeAbove 0.05: alpha changes below this are invisible in practice;
 *   8-bit capture noise alone is 1/255.
 * - from "alpha": the keyed result's coverage. "luma" only for a render
 *   whose RGB is the matte (Keylight View 5 or 8); spill is not read then.
 * - patchWindow: four times maxEdgeWidth (44 px at 1080×1920): large enough
 *   to hold a remnant worth fixing, small enough that a long band's box does
 *   not hide where most of it is.
 */
export const EDGE_DEFAULTS = {
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
    patchWindow: "auto",
};
/** The alpha that marks the boundary itself, where edge width is sampled. */
export const CONTOUR_ALPHA = 0.5;
/** Default maxEdgeWidth for a frame: 1% of the shorter side, at least 4 px. */
export function autoMaxEdgeWidth(width, height) {
    return Math.max(4, Math.round(0.01 * Math.min(width, height)));
}
/** Caller overrides on top of the defaults, for a frame of this size. */
export function resolveEdgeThresholds(args, width, height) {
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
        patchWindow: args.patchWindow ?? Math.round(4 * maxEdgeWidth),
    };
}
/** Why a set of caller thresholds cannot be used, or null when it can. */
export function edgeArgsError(args) {
    const unit = ["transparent", "opaque", "mainAreaShare", "spillMinAlpha", "changeAbove"];
    for (const key of unit) {
        const v = args[key];
        if (v !== undefined && (typeof v !== "number" || !(v >= 0 && v <= 1))) {
            return `\`edge.${key}\` must be a number in 0..1`;
        }
    }
    const t = args.transparent ?? EDGE_DEFAULTS.transparent;
    const o = args.opaque ?? EDGE_DEFAULTS.opaque;
    if (t >= o)
        return "`edge.transparent` must be below `edge.opaque`";
    const w = args.maxEdgeWidth;
    if (w !== undefined && (typeof w !== "number" || !Number.isFinite(w) || w < 1)) {
        return "`edge.maxEdgeWidth` must be at least 1 (pixels)";
    }
    const pw = args.patchWindow;
    if (pw !== undefined && (typeof pw !== "number" || !Number.isFinite(pw) || pw < 1)) {
        return "`edge.patchWindow` must be at least 1 (pixels)";
    }
    const listed = args.listed;
    if (listed !== undefined && (!Number.isInteger(listed) || listed < 0)) {
        return "`edge.listed` must be a whole number, 0 or more";
    }
    const s = args.spillThreshold;
    if (s !== undefined && (typeof s !== "number" || !(s >= 0 && s <= 1))) {
        return "`edge.spillThreshold` must be a number in 0..1";
    }
    if (args.from !== undefined && args.from !== "alpha" && args.from !== "luma") {
        return "`edge.from` must be 'alpha' or 'luma'";
    }
    if (args.screen !== undefined && args.screen !== "green" && args.screen !== "blue") {
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
// ---------------------------------------------------------------------------
// Euclidean distance transform (Felzenszwalb & Huttenlocher), separable
// ---------------------------------------------------------------------------
const INF = 1e20;
/** 1-D squared distance transform of f[0..n) into d; INF entries are not sources. */
function dt1d(f, n, d, v, z) {
    let k = -1;
    for (let q = 0; q < n; q++) {
        const fq = f[q];
        if (fq >= INF)
            continue;
        if (k < 0) {
            k = 0;
            v[0] = q;
            z[0] = -Infinity;
            z[1] = Infinity;
            continue;
        }
        let s = 0;
        for (;;) {
            const r = v[k];
            s = (fq + q * q - (f[r] + r * r)) / (2 * q - 2 * r);
            if (s <= z[k])
                k--;
            else
                break;
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
        while (z[j + 1] < q)
            j++;
        const r = v[j];
        d[q] = (q - r) * (q - r) + f[r];
    }
}
/**
 * Distance from every pixel to the nearest pixel where `isSource` holds;
 * Infinity if none. Exported for the screen measurement (screen.ts).
 */
export function distanceTo(alpha, width, height, isSource, scratch, out) {
    const n = Math.max(width, height);
    const f = new Float64Array(n);
    const d = new Float64Array(n);
    const v = new Int32Array(n);
    const z = new Float64Array(n + 1);
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++)
            f[y] = isSource(alpha[y * width + x]) ? 0 : INF;
        dt1d(f, height, d, v, z);
        for (let y = 0; y < height; y++)
            scratch[y * width + x] = d[y];
    }
    for (let y = 0; y < height; y++) {
        const row = y * width;
        for (let x = 0; x < width; x++)
            f[x] = scratch[row + x];
        dt1d(f, width, d, v, z);
        for (let x = 0; x < width; x++)
            out[row + x] = d[x] >= INF / 2 ? Infinity : Math.sqrt(d[x]);
    }
}
export const newRegion = () => ({
    area: 0,
    minX: Infinity,
    minY: Infinity,
    maxX: -1,
    maxY: -1,
    alphaSum: 0,
    alphaMax: 0,
    transparent: 0,
    touchesBorder: false,
});
export function addPixel(r, x, y, a) {
    r.area++;
    if (x < r.minX)
        r.minX = x;
    if (x > r.maxX)
        r.maxX = x;
    if (y < r.minY)
        r.minY = y;
    if (y > r.maxY)
        r.maxY = y;
    r.alphaSum += a;
    if (a > r.alphaMax)
        r.alphaMax = a;
}
export const box = (r) => ({
    x: r.minX,
    y: r.minY,
    width: r.maxX - r.minX + 1,
    height: r.maxY - r.minY + 1,
});
const N4X = [1, -1, 0, 0];
const N4Y = [0, 0, 1, -1];
const N8X = [1, -1, 0, 0, 1, 1, -1, -1];
const N8Y = [0, 0, 1, -1, 1, -1, 1, -1];
/**
 * Flood-fill every region of pixels where `inSet` holds (4- or 8-connected),
 * writing 1-based region ids into `labels` and returning one Region each.
 * Exported for the screen measurement (screen.ts).
 */
export function labelRegions(alpha, width, height, inSet, eight, labels, queue, transparentAt) {
    labels.fill(0);
    const regions = [];
    const nx = eight ? N8X : N4X;
    const ny = eight ? N8Y : N4Y;
    const total = width * height;
    for (let start = 0; start < total; start++) {
        if (labels[start] !== 0 || !inSet(start))
            continue;
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
            if (a <= transparentAt)
                region.transparent++;
            if (x === 0 || y === 0 || x === width - 1 || y === height - 1)
                region.touchesBorder = true;
            for (let k = 0; k < nx.length; k++) {
                const qx = x + nx[k];
                const qy = y + ny[k];
                if (qx < 0 || qy < 0 || qx >= width || qy >= height)
                    continue;
                const q = qy * width + qx;
                if (labels[q] !== 0 || !inSet(q))
                    continue;
                labels[q] = id;
                queue[tail++] = q;
            }
        }
    }
    return regions;
}
const byArea = (a, b) => b.area - a.area;
// ---------------------------------------------------------------------------
// One frame
// ---------------------------------------------------------------------------
function screenExcess(c, screen) {
    return screen === "green" ? c[1] - Math.max(c[0], c[2]) : c[2] - Math.max(c[0], c[1]);
}
/**
 * The matte in a render whose RGB is the matte (Keylight's Screen Matte and
 * Combined Matte views): Rec. 709 luminance of the capture values, clamped to
 * 0..1; a grey pixel (r = g = b) is taken as it is.
 */
export function lumaMatte(img) {
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
/**
 * Measure one capture's matte. `bg` is the comp background AE laid the
 * capture's RGB over (see unmatte); it is taken out before the spill colour
 * is read. The matte is the capture's alpha, or with `t.from` "luma" its
 * luminance (then spill is not read: there is no subject colour). Throws when
 * the matte comes from alpha and the capture has none.
 */
export function measureEdge(img, bg, t) {
    const fromLuma = t.from === "luma";
    const alpha = fromLuma ? lumaMatte(img) : img.alpha;
    if (!alpha)
        throw new Error("the capture has no alpha channel");
    const { width, height } = img;
    const n = width * height;
    const isT = (a) => a <= t.transparent;
    const isO = (a) => a >= t.opaque;
    let opaque = 0;
    let transparent = 0;
    for (let p = 0; p < n; p++) {
        if (isO(alpha[p]))
            opaque++;
        else if (isT(alpha[p]))
            transparent++;
    }
    // Distance maps: to the nearest transparent and the nearest opaque pixel.
    const scratch = new Float32Array(n);
    const dT = new Float32Array(n);
    const dO = new Float32Array(n);
    distanceTo(alpha, width, height, isT, scratch, dT);
    distanceTo(alpha, width, height, isO, scratch, dO);
    const labels = new Int32Array(n);
    const queue = new Int32Array(n);
    // Islands of covered pixels: main solid areas and specks.
    const islands = labelRegions(alpha, width, height, (p) => alpha[p] > t.transparent, true, labels, queue, t.transparent);
    const largest = islands.reduce((m, r) => Math.max(m, r.area), 0);
    const isMain = islands.map((r) => r.area > 0 && r.area >= t.mainAreaShare * largest);
    const mains = islands.filter((_, i) => isMain[i]).sort(byArea);
    const specks = islands.filter((_, i) => !isMain[i]).sort(byArea);
    // Edge width on the main areas' 50% contour.
    const widths = [];
    let unmeasured = 0;
    let worst = -1;
    let worstAt = null;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const p = y * width + x;
            if (alpha[p] < CONTOUR_ALPHA || labels[p] === 0 || !isMain[labels[p] - 1])
                continue;
            let onContour = false;
            for (let k = 0; k < 4 && !onContour; k++) {
                const qx = x + N4X[k];
                const qy = y + N4Y[k];
                if (qx < 0 || qy < 0 || qx >= width || qy >= height)
                    continue;
                if (alpha[qy * width + qx] < CONTOUR_ALPHA)
                    onContour = true;
            }
            if (!onContour)
                continue;
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
    // Holes: regions below opaque, 4-connected, that do not reach the border.
    const belowOpaque = labelRegions(alpha, width, height, (p) => alpha[p] < t.opaque, false, labels, queue, t.transparent);
    const holes = belowOpaque.filter((r) => !r.touchesBorder).sort(byArea);
    // Patches: partly transparent cores thicker than a thin edge, grown back
    // out to their full extent through partly transparent pixels.
    const half = t.maxEdgeWidth / 2;
    const isPartial = (p) => alpha[p] > t.transparent && alpha[p] < t.opaque;
    const isCore = (p) => isPartial(p) && Math.min(dT[p], dO[p]) > half;
    labels.fill(0);
    let tail = 0;
    let ids = 0;
    for (let start = 0; start < n; start++) {
        if (labels[start] !== 0 || !isCore(start))
            continue;
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
                if (qx < 0 || qy < 0 || qx >= width || qy >= height)
                    continue;
                const q = qy * width + qx;
                if (labels[q] !== 0 || !isCore(q))
                    continue;
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
                if (qx < 0 || qy < 0 || qx >= width || qy >= height)
                    continue;
                const q = qy * width + qx;
                if (labels[q] !== 0 || !isPartial(q))
                    continue;
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
    const patchList = patchRegions
        .slice(0, t.listed)
        .map((r) => patchEntry(r, patchId.get(r), labels, alpha, dT, dO, width, t.patchWindow));
    // Spill: straight colour of the soft edge and of the solid just inside it.
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
        if (fromLuma || (!(partial && a >= t.spillMinAlpha) && !solid))
            continue;
        const sum = solid ? solidSum : edgeSum;
        for (let c = 0; c < 3; c++) {
            const v = img.rgb[p * 3 + c];
            sum[c] += a >= 1 ? v : Math.min(1, Math.max(0, (v - bg[c] * (1 - a)) / a));
        }
        if (solid)
            solidCount++;
        else
            edgeCount++;
    }
    const meanOf = (s, k) => k === 0 ? null : [s[0] / k, s[1] / k, s[2] / k];
    const edgeMean = meanOf(edgeSum, edgeCount);
    const solidMean = meanOf(solidSum, solidCount);
    const excess = edgeMean ? screenExcess(edgeMean, t.screen) : null;
    const solidExcess = solidMean ? screenExcess(solidMean, t.screen) : null;
    const leans = excess !== null &&
        excess > t.spillThreshold &&
        (solidExcess === null || excess - solidExcess > t.spillThreshold);
    const report = {
        stage: "capture",
        matteFrom: t.from,
        pixels: n,
        shares: {
            opaque: r4(opaque / n),
            partial: r4((n - opaque - transparent) / n),
            transparent: r4(transparent / n),
        },
        width: {
            typical: median === null ? null : r2(median),
            p90: m === 0 ? null : r2(widths[Math.floor(0.9 * (m - 1))]),
            worst: m === 0 ? null : r2(worst),
            worstAt,
            samples: m,
            unmeasured,
        },
        solidAreas: {
            count: mains.length,
            list: mains.slice(0, t.listed).map((r) => ({ ...box(r), area: r.area })),
        },
        holes: {
            count: holes.length,
            area: holes.reduce((s, r) => s + r.area, 0),
            transparentArea: holes.reduce((s, r) => s + r.transparent, 0),
            largest: holes.length ? holeEntry(holes[0]) : null,
            list: holes.slice(0, t.listed).map(holeEntry),
        },
        specks: {
            count: specks.length,
            area: specks.reduce((s, r) => s + r.area, 0),
            list: specks.slice(0, t.listed).map((r) => ({
                ...box(r),
                area: r.area,
                meanAlpha: r4(r.alphaSum / r.area),
                maxAlpha: r4(r.alphaMax),
            })),
        },
        patches: {
            count: patchRegions.length,
            area: patchRegions.reduce((s, r) => s + r.area, 0),
            list: patchList,
        },
        spill: {
            screen: t.screen,
            pixels: edgeCount,
            mean: edgeMean ? r4rgb(edgeMean) : null,
            solidMean: solidMean ? r4rgb(solidMean) : null,
            excess: excess === null ? null : r4(excess),
            solidExcess: solidExcess === null ? null : r4(solidExcess),
            leansToScreen: leans,
            reading: fromLuma
                ? "not read: the matte came from luminance (a Keylight matte view), which carries no subject " +
                    "colour; read spill on the keyed result with `from: 'alpha'`"
                : spillReading(t, edgeCount, excess, solidExcess, leans),
        },
    };
    return { report, frame: { width, height, alpha: Float32Array.from(alpha), zones } };
}
function holeEntry(r) {
    return { ...box(r), area: r.area, meanAlpha: r4(r.alphaSum / r.area) };
}
/** A patch's box plus where it is thickest and its densest window (see PatchEntry). */
function patchEntry(r, id, labels, alpha, dT, dO, width, window) {
    const b = box(r);
    // Thickest: the deepest pixel.
    let depth = -1;
    let at = { x: b.x, y: b.y };
    let thickness = 0;
    for (let y = b.y; y < b.y + b.height; y++) {
        for (let x = b.x; x < b.x + b.width; x++) {
            const p = y * width + x;
            if (labels[p] !== id)
                continue;
            const m = Math.min(dT[p], dO[p]);
            if (m > depth) {
                depth = m;
                at = { x, y };
                thickness =
                    Number.isFinite(dT[p]) && Number.isFinite(dO[p]) ? dT[p] + dO[p] - 1 : 2 * m - 1;
            }
        }
    }
    // Densest window: summed-area tables of patch pixels and their alpha over the box.
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
            meanAlpha: bestC > 0 ? r4(bestA / bestC) : 0,
        },
    };
}
function spillReading(t, pixels, excess, solidExcess, leans) {
    const other = t.screen === "green" ? "red and blue" : "red and green";
    if (pixels === 0 || excess === null) {
        return `no partly transparent pixels at or above alpha ${t.spillMinAlpha} to read a colour from`;
    }
    const lean = `its ${t.screen} exceeds the larger of ${other} by ${excess.toFixed(3)}`;
    const versus = solidExcess === null ? "" : `; the solid area just inside the edge: ${solidExcess.toFixed(3)}`;
    return leans
        ? `the soft edge leans ${t.screen} (likely spill): ${lean}${versus}`
        : `the soft edge does not lean ${t.screen} beyond the subject's own colour: ${lean}${versus}`;
}
const zoneAcc = () => ({
    pixels: 0,
    sum: 0,
    max: 0,
    changed: 0,
    minX: Infinity,
    minY: Infinity,
    maxX: -1,
    maxY: -1,
});
function finishZone(z) {
    return {
        pixels: z.pixels,
        meanAbsDelta: z.pixels ? r4(z.sum / z.pixels) : 0,
        maxAbsDelta: r4(z.max),
        changedShare: z.pixels ? r4(z.changed / z.pixels) : 0,
        changedBounds: z.changed === 0
            ? null
            : { x: z.minX, y: z.minY, width: z.maxX - z.minX + 1, height: z.maxY - z.minY + 1 },
    };
}
/**
 * The change in alpha from `prev` to `cur`, split by where it happened. Each
 * frame marks its pixels as edge (within maxEdgeWidth of both a transparent
 * and an opaque pixel), inside (otherwise, alpha ≥ 0.5) or outside. A pixel
 * inside the solid area in either frame counts as inside — so a hole opening
 * or closing is inside, not edge; otherwise outside in either frame counts
 * as outside (specks appearing); the rest is edge. Real motion is change
 * too: read these on a held shot, or against how much the subject moves.
 */
export function alphaChange(prev, cur, t) {
    if (prev.width !== cur.width || prev.height !== cur.height) {
        throw new Error(`cannot compare frames of different size (${prev.width}×${prev.height} vs ${cur.width}×${cur.height})`);
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
            if (d > z.max)
                z.max = d;
            if (d > t.changeAbove) {
                z.changed++;
                const x = p % width;
                const y = (p - x) / width;
                if (x < z.minX)
                    z.minX = x;
                if (x > z.maxX)
                    z.maxX = x;
                if (y < z.minY)
                    z.minY = y;
                if (y > z.maxY)
                    z.maxY = y;
            }
        }
    }
    return {
        edge: finishZone(acc[EDGE]),
        inside: finishZone(acc[INSIDE]),
        outside: finishZone(acc[OUTSIDE]),
        all: finishZone(all),
    };
}
/** Over every pair: mean of the per-pair means, the largest single change, the worst pair. */
export function summarizeFlicker(pairs) {
    const zone = (key) => {
        let mean = 0;
        let max = 0;
        let share = 0;
        let worst = null;
        for (const pair of pairs) {
            const z = pair[key];
            mean += z.meanAbsDelta;
            share += z.changedShare;
            if (z.maxAbsDelta > max)
                max = z.maxAbsDelta;
            if (z.meanAbsDelta > 0 && (worst === null || z.meanAbsDelta > worst[key].meanAbsDelta)) {
                worst = pair;
            }
        }
        const k = Math.max(1, pairs.length);
        return {
            meanAbsDelta: r4(mean / k),
            maxAbsDelta: r4(max),
            changedShare: r4(share / k),
            worstPair: worst ? { from: worst.from.index, to: worst.to.index } : null,
        };
    };
    return { edge: zone("edge"), inside: zone("inside"), outside: zone("outside"), all: zone("all") };
}
/**
 * The holes `edge` reports (4-connected regions below `below`, default edge's
 * opaque threshold, that do not reach the frame edge), as a list and as a
 * mask: 1 for every pixel of a kept hole. Holes smaller than `minArea` pixels
 * are left out of both and counted in `dropped`; holes `keep` refuses are left
 * out and counted in `leftOut`.
 */
export function enclosedHoles(alpha, width, height, opts = {}) {
    const below = opts.below ?? EDGE_DEFAULTS.opaque;
    const minArea = opts.minArea ?? 1;
    const n = width * height;
    const a = alpha instanceof Float64Array ? alpha : Float64Array.from(alpha);
    const labels = new Int32Array(n);
    const queue = new Int32Array(n);
    const regions = labelRegions(a, width, height, (p) => a[p] < below, false, labels, queue, EDGE_DEFAULTS.transparent);
    const keep = new Uint8Array(regions.length + 1);
    const holes = [];
    const dropped = { count: 0, area: 0 };
    const leftOut = { count: 0, area: 0 };
    const entry = (r) => ({
        ...box(r),
        area: r.area,
        meanAlpha: Math.round((r.alphaSum / r.area) * 1000) / 1000,
    });
    regions.forEach((r, i) => {
        if (r.touchesBorder)
            return;
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
    for (let p = 0; p < n; p++)
        if (keep[labels[p]])
            mask[p] = 1;
    holes.sort((x, y) => y.r.area - x.r.area);
    return { holes: holes.map(({ r }) => entry(r)), mask, dropped, leftOut };
}
/** `mask` grown by `radius` px: every pixel within that Euclidean distance of a set pixel is set. */
export function growMask(mask, width, height, radius) {
    if (radius <= 0)
        return Uint8Array.from(mask);
    const src = Float64Array.from(mask);
    const scratch = new Float32Array(width * height);
    const dist = new Float32Array(width * height);
    distanceTo(src, width, height, (v) => v > 0, scratch, dist);
    const out = new Uint8Array(width * height);
    for (let p = 0; p < out.length; p++)
        if (dist[p] <= radius + 1e-9)
            out[p] = 1;
    return out;
}
/**
 * Holes and openings in a cut-out's matte. A hole is a region below `below`
 * (default edge's opaque threshold) that cannot reach the frame edge, as
 * `edge` reports it. An opening reaches the frame edge only between two
 * places where the subject touches that edge: on each of the four edges, the
 * pixels between the first and the last opaque pixel on it are treated as
 * solid (an edge with fewer than two opaque pixels is left open), and a
 * region enclosed only because of that sealing is an opening. On a take with
 * no green screen (2026-11-11) a microphone left out of the matte ran off the
 * bottom of the frame: an opening of about 115,000 px, not a hole. An opening
 * can also be a real gap, such as between an arm and the body. The sealed edge
 * pixels that were below opaque count in the opening they close. Regions
 * smaller than `minArea` are left out and counted in `dropped`.
 */
export function cutoutRegions(alpha, width, height, opts = {}) {
    const below = opts.below ?? EDGE_DEFAULTS.opaque;
    const minArea = opts.minArea ?? 1;
    const n = width * height;
    // One copy, sealed below; the given alpha is read as it is.
    const a = Float64Array.from(alpha);
    const original = alpha;
    // Seal each edge between its first and last opaque pixel. `sealedEdge`
    // records, per sealed pixel that was below opaque, which edge sealed it.
    const sealedEdge = new Int8Array(n).fill(-1);
    const EDGES = ["top", "bottom", "left", "right"];
    const edgePixels = (e) => {
        const out = [];
        if (e < 2) {
            const y = e === 0 ? 0 : height - 1;
            for (let x = 0; x < width; x++)
                out.push(y * width + x);
        }
        else {
            const x = e === 2 ? 0 : width - 1;
            for (let y = 0; y < height; y++)
                out.push(y * width + x);
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
                if (first < 0)
                    first = i;
                last = i;
                count++;
            }
        if (count < 2)
            continue;
        for (let i = first; i <= last; i++) {
            const p = px[i];
            if (original[p] < below) {
                if (sealedEdge[p] < 0)
                    sealedEdge[p] = e;
                a[p] = 1;
            }
        }
    }
    const labels = new Int32Array(n);
    const queue = new Int32Array(n);
    const regions = labelRegions(a, width, height, (p) => a[p] < below, false, labels, queue, EDGE_DEFAULTS.transparent);
    // Each sealed pixel joins the enclosed region next to it (one step inward).
    const extra = regions.map(() => ({
        area: 0,
        sum: 0,
        minX: Infinity,
        minY: Infinity,
        maxX: -1,
        maxY: -1,
        edges: new Set(),
    }));
    for (let p = 0; p < n; p++) {
        const e = sealedEdge[p];
        if (e < 0)
            continue;
        const x = p % width;
        const y = (p - x) / width;
        const q = e === 0 ? p + width : e === 1 ? p - width : e === 2 ? p + 1 : p - 1;
        const qx = q % width;
        const qy = (q - qx) / width;
        if (q < 0 || q >= n || (e >= 2 && Math.abs(qy - y) !== 0))
            continue;
        const id = labels[q];
        if (!id || regions[id - 1].touchesBorder)
            continue;
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
        if (r.touchesBorder)
            return;
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
            meanAlpha: Math.round(((r.alphaSum + x.sum) / area) * 1000) / 1000,
        };
        if (x.edges.size > 0)
            openings.push({ ...entry, edges: EDGES.filter((e) => x.edges.has(e)) });
        else
            holes.push(entry);
    });
    holes.sort((p, q) => q.area - p.area);
    openings.sort((p, q) => q.area - p.area);
    return { holes, openings, dropped };
}
const median = (xs) => {
    if (!xs.length)
        return null;
    const s = [...xs].sort((a, b) => a - b);
    const m = s.length;
    return m % 2 ? s[(m - 1) / 2] : (s[m / 2 - 1] + s[m / 2]) / 2;
};
const r6 = (n) => Math.round(n * 1e6) / 1e6;
/**
 * Feed frames in order (any spacing) with their alpha and straight RGB; the
 * result says how much the outline changed between neighbouring frames and
 * over `gap` frames, and where it did not move. Frames are kept as 8-bit alpha
 * and luma, only as far back as a comparison can still need them. Measured at
 * full size.
 */
export function outlineTracker(opts = {}) {
    const gap = opts.gap ?? 30;
    const limit = opts.limit ?? 0.002;
    const minFrames = opts.minFrames ?? 60;
    const step = Math.round((opts.step ?? 0.1) * 255);
    const lumaStep = Math.round(0.05 * 255);
    const ring = [];
    const neighbours = [];
    const windows = [];
    const changed = (x, y) => {
        let n = 0;
        for (let p = 0; p < x.length; p++)
            if (Math.abs(x[p] - y[p]) > step)
                n++;
        return n / x.length;
    };
    const footage = (p, c) => {
        let n = 0;
        for (let i = 0; i < p.a.length; i++)
            if (p.a[i] >= 250 && c.a[i] >= 250 && Math.abs(p.l[i] - c.l[i]) > lumaStep)
                n++;
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
                    l[p] = Math.round(Math.min(1, Math.max(0, 0.2126 * rgb[p * 3] + 0.7152 * rgb[p * 3 + 1] + 0.0722 * rgb[p * 3 + 2])) * 255);
            }
            const cur = { frame, a, l };
            const prev = ring[ring.length - 1];
            if (prev && prev.frame === frame - 1)
                neighbours.push(changed(prev.a, a));
            let partner;
            for (const e of ring)
                if (e.frame <= frame - gap)
                    partner = e;
            if (partner)
                windows.push({
                    a: partner.frame,
                    b: frame,
                    drift: changed(partner.a, a),
                    footage: footage(partner, cur),
                });
            ring.push(cur);
            // A later frame's partner is the latest frame at least `gap` before it: anything older than that can go.
            let keepFrom = 0;
            for (let i = 0; i < ring.length; i++)
                if (ring[i].frame <= frame + 1 - gap)
                    keepFrom = i;
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
                            footageChange: r6(median(run.map((w) => w.footage)) ?? 0),
                        });
                }
                run = [];
            };
            for (const w of windows) {
                if (w.drift < limit)
                    run.push(w);
                else
                    close();
            }
            close();
            const stats = (xs) => ({
                min: xs.length ? r6(Math.min(...xs)) : null,
                median: xs.length ? r6(median(xs)) : null,
                max: xs.length ? r6(Math.max(...xs)) : null,
            });
            return {
                at: "full size: the share of the frame whose alpha changed by more than " +
                    (opts.step ?? 0.1),
                neighbours: { ...stats(neighbours), pairs: neighbours.length },
                drift: { gap, ...stats(windows.map((w) => w.drift)), windows: windows.length },
                limits: { gap, limit, minFrames, step: opts.step ?? 0.1 },
                frozen,
            };
        },
    };
}
// ---------------------------------------------------------------------------
// Specks: small opaque pieces apart from the main cut-out
// ---------------------------------------------------------------------------
/**
 * Chosen on the delivered cut-out of the 4K fresh-session test (320 frames,
 * 1080 x 1920): a thin dark sliver of chair 1 to 5 px off the right arm, on
 * frames 227 to 260, read 20 to 238 px; nothing else in the file was a piece
 * of 20 px or more apart from the body except a fingertip running off the
 * bottom edge (frame 49), which a piece touching the frame edge is not
 * counted as. Under 20 px are single specks of noise (3 px on frame 249);
 * over 2,000 px is another object, not a speck. `neck`: a piece joined to the
 * cut-out by a neck up to 2 px wide counts as apart (an opening of 1 px).
 * `minRun`: a speck stops a check only when the same piece is there on at
 * least this many frames in a row. On that file and on the cut-out matted at
 * 2176 x 3840 (cutout-12c), every piece of chair that lasted was on 2 or more
 * frames in a row (15, 2, 5 and 3), while bits on single frames (chair by the
 * left arm, a wisp of hair on frame 105) were each there for a thirtieth of a
 * second. Two files of one take: the limits and minRun come from them alone.
 */
export const SPECK_DEFAULTS = { opaque: 0.5, minArea: 20, maxArea: 2000, neck: 1, minRun: 2 };
function statAdd(st, id, x, y, onEdge) {
    if (st.area[id] === undefined) {
        st.area[id] = 0;
        st.minX[id] = x;
        st.minY[id] = y;
        st.maxX[id] = x;
        st.maxY[id] = y;
        st.edge[id] = false;
    }
    st.area[id]++;
    if (x < st.minX[id])
        st.minX[id] = x;
    if (x > st.maxX[id])
        st.maxX[id] = x;
    if (y < st.minY[id])
        st.minY[id] = y;
    if (y > st.maxY[id])
        st.maxY[id] = y;
    if (onEdge)
        st.edge[id] = true;
}
/**
 * Small opaque pieces apart from the main cut-out, or joined to it only by a
 * neck up to 2 px wide: opaque at `opaque` alpha or more, `minArea` to
 * `maxArea` px, not touching the frame edge. Largest first. Works inside the
 * box around the opaque pixels and grows labels back only over the pixels
 * the erosion took (about 5.5 ms a 1080 x 1920 frame, 1.8 s for 320).
 */
export function speckPieces(alpha, width, height, opts = {}) {
    const o = { ...SPECK_DEFAULTS, ...opts };
    // The box around the opaque pixels, one pixel larger where the frame allows.
    let bx0 = width;
    let by0 = height;
    let bx1 = -1;
    let by1 = -1;
    for (let y = 0; y < height; y++) {
        const row = y * width;
        let first = -1;
        let last = -1;
        for (let x = 0; x < width; x++)
            if (alpha[row + x] >= o.opaque) {
                if (first < 0)
                    first = x;
                last = x;
            }
        if (first < 0)
            continue;
        if (first < bx0)
            bx0 = first;
        if (last > bx1)
            bx1 = last;
        if (y < by0)
            by0 = y;
        by1 = y;
    }
    if (bx1 < 0)
        return [];
    bx0 = Math.max(0, bx0 - 1);
    by0 = Math.max(0, by0 - 1);
    bx1 = Math.min(width - 1, bx1 + 1);
    by1 = Math.min(height - 1, by1 + 1);
    const w = bx1 - bx0 + 1;
    const h = by1 - by0 + 1;
    const n = w * h;
    const m = new Uint8Array(n);
    for (let y = 0; y < h; y++) {
        const src = (y + by0) * width + bx0;
        for (let x = 0; x < w; x++)
            m[y * w + x] = alpha[src + x] >= o.opaque ? 1 : 0;
    }
    const onEdge = (x, y) => x + bx0 === 0 || y + by0 === 0 || x + bx0 === width - 1 || y + by0 === height - 1;
    // Erode by the neck (a 3 x 3 cross); `ring` holds the opaque pixels the erosion took.
    let er = m;
    for (let t = 0; t < o.neck; t++) {
        const next = new Uint8Array(n);
        for (let y = 1; y < h - 1; y++)
            for (let x = 1; x < w - 1; x++) {
                const p = y * w + x;
                next[p] = er[p] & er[p - 1] & er[p + 1] & er[p - w] & er[p + w];
            }
        er = next;
    }
    let ring = [];
    for (let p = 0; p < n; p++)
        if (m[p] && !er[p])
            ring.push(p);
    // Label what is left (8-connected), with each label's area and box gathered as it fills.
    const labels = new Int32Array(n);
    const queue = new Int32Array(n);
    const st = { area: [], minX: [], minY: [], maxX: [], maxY: [], edge: [] };
    /** Fill one 8-connected piece of `mask` from `start` as label `id`; record its stats. */
    const fill = (mask, start, id) => {
        labels[start] = id;
        let head = 0;
        let tail = 0;
        queue[tail++] = start;
        let x0 = w;
        let y0 = h;
        let x1 = -1;
        let y1 = -1;
        while (head < tail) {
            const p = queue[head++];
            const x = p % w;
            const y = (p - x) / w;
            if (x < x0)
                x0 = x;
            if (x > x1)
                x1 = x;
            if (y < y0)
                y0 = y;
            if (y > y1)
                y1 = y;
            const ya = y > 0 ? -1 : 0;
            const yb = y < h - 1 ? 1 : 0;
            const xa = x > 0 ? -1 : 0;
            const xb = x < w - 1 ? 1 : 0;
            for (let dy = ya; dy <= yb; dy++)
                for (let dx = xa; dx <= xb; dx++) {
                    const q = p + dy * w + dx;
                    if (mask[q] && !labels[q]) {
                        labels[q] = id;
                        queue[tail++] = q;
                    }
                }
        }
        st.area[id] = tail;
        st.minX[id] = x0;
        st.minY[id] = y0;
        st.maxX[id] = x1;
        st.maxY[id] = y1;
        st.edge[id] = onEdge(x0, y0) || onEdge(x1, y1);
    };
    // The eroded mask is labelled by row runs joined with union-find (8-connected): runs, not pixels.
    const rs = [];
    const reEnd = [];
    const ry = [];
    const parent = [];
    const find = (i) => {
        while (parent[i] !== i) {
            parent[i] = parent[parent[i]];
            i = parent[i];
        }
        return i;
    };
    let prevFrom = 0;
    let prevTo = 0;
    for (let y = 0; y < h; y++) {
        const rowFrom = rs.length;
        const row = y * w;
        let x = 0;
        while (x < w) {
            if (!er[row + x]) {
                x++;
                continue;
            }
            const x0 = x;
            while (x < w && er[row + x])
                x++;
            const r = rs.length;
            rs.push(x0);
            reEnd.push(x);
            ry.push(y);
            parent.push(r);
            // Runs in the row above touching [x0 - 1, x] (8-connected).
            for (let k = prevFrom; k < prevTo; k++) {
                if (reEnd[k] < x0 || rs[k] > x)
                    continue;
                const a = find(k);
                const b2 = find(r);
                if (a !== b2)
                    parent[Math.max(a, b2)] = Math.min(a, b2);
            }
        }
        prevFrom = rowFrom;
        prevTo = rs.length;
    }
    const idOf = new Map();
    let grownEnd = 1;
    for (let k = 0; k < rs.length; k++) {
        const root = find(k);
        let id = idOf.get(root);
        if (id === undefined) {
            id = grownEnd++;
            idOf.set(root, id);
            st.area[id] = 0;
            st.minX[id] = rs[k];
            st.minY[id] = ry[k];
            st.maxX[id] = reEnd[k] - 1;
            st.maxY[id] = ry[k];
            st.edge[id] = false;
        }
        const len = reEnd[k] - rs[k];
        st.area[id] += len;
        if (rs[k] < st.minX[id])
            st.minX[id] = rs[k];
        if (reEnd[k] - 1 > st.maxX[id])
            st.maxX[id] = reEnd[k] - 1;
        if (ry[k] < st.minY[id])
            st.minY[id] = ry[k];
        if (ry[k] > st.maxY[id])
            st.maxY[id] = ry[k];
        if (onEdge(rs[k], ry[k]) || onEdge(reEnd[k] - 1, ry[k]))
            st.edge[id] = true;
        labels.fill(id, ry[k] * w + rs[k], ry[k] * w + reEnd[k]);
    }
    // Grow the labels back over the ring: a piece joined only by a neck up to 2 px wide comes back as its own label.
    for (let t = 0; t < o.neck + 1 && ring.length; t++) {
        const take = [];
        const left = [];
        for (const p of ring) {
            const x = p % w;
            const v = (x > 0 && labels[p - 1]) ||
                (x < w - 1 && labels[p + 1]) ||
                (p >= w && labels[p - w]) ||
                (p + w < n && labels[p + w]) ||
                0;
            if (v)
                take.push([p, v]);
            else
                left.push(p);
        }
        for (const [p, v] of take) {
            labels[p] = v;
            const x = p % w;
            const y = (p - x) / w;
            statAdd(st, v, x, y, onEdge(x, y));
        }
        ring = left;
        if (!take.length)
            break;
    }
    // Ring pixels no grown label reached (pieces thinner than the neck) get labels of their own.
    const rest = new Uint8Array(n);
    for (const p of ring)
        rest[p] = 1;
    let end = grownEnd;
    for (const p of ring)
        if (!labels[p])
            fill(rest, p, end++);
    // A thin label touching a grown one is part of it (a hair, a cable).
    const touchesGrown = new Uint8Array(end);
    for (const p of ring) {
        const id = labels[p];
        if (touchesGrown[id])
            continue;
        const x = p % w;
        const y = (p - x) / w;
        for (let dy = -1; dy <= 1 && !touchesGrown[id]; dy++)
            for (let dx = -1; dx <= 1; dx++) {
                const xx = x + dx;
                const yy = y + dy;
                if (xx < 0 || yy < 0 || xx >= w || yy >= h)
                    continue;
                const q = labels[yy * w + xx];
                if (q && q < grownEnd) {
                    touchesGrown[id] = 1;
                    break;
                }
            }
    }
    // The main cut-out is the largest piece.
    let main = 1;
    for (let id = 1; id < end; id++)
        if ((st.area[id] ?? 0) > (st.area[main] ?? 0))
            main = id;
    const pieces = [];
    for (let id = 1; id < end; id++) {
        const a = st.area[id] ?? 0;
        if (id === main || st.edge[id] || a < o.minArea || a > o.maxArea)
            continue;
        if (id >= grownEnd && touchesGrown[id])
            continue;
        pieces.push({
            x: st.minX[id] + bx0,
            y: st.minY[id] + by0,
            width: st.maxX[id] - st.minX[id] + 1,
            height: st.maxY[id] - st.minY[id] + 1,
            area: a,
        });
    }
    return pieces.sort((p, q) => q.area - p.area);
}
//# sourceMappingURL=matte.js.map
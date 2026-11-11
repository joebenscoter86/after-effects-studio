// Watching motion (agent-eyes plan, stage 4): the `diff` report of
// ae_render_frame. For each consecutive pair of rendered frames it measures how
// much the picture changed, where, and by named region; over the series it
// finds the pairs that stand out from their neighbours: a one-frame pop, a
// stutter (a frame repeated while everything around it moves) and a cut.
// Numbers and places only; it never passes or fails a shot.
//
// What is compared is the picture as the written file shows it (stage
// 'output'): display values 0..1. For the default rgb output that is the
// capture as AE laid it over the comp background (or over `over`), so a
// transparent area reads the background in both frames and does not change;
// for an rgba file this call wrote, straight colour weighted by its alpha (as
// over black), so colour under transparent pixels does not count; for the
// alpha output, the matte.
//
// Memory: one previous picture is kept (Float32, 3 values a pixel: ~25 MB at
// 1080×1920); a pair's change is one pass over the two, with the per-region
// sums done on the regions' own rectangles and the thumbnail of the change
// accumulated in the same pass.
import { clipRegion } from "./sheet.js";
/**
 * Why these values:
 * - changeAbove 0.04: about ten 8-bit steps. Frame-to-frame grain on real
 *   footage stays far below it (the green screen measured live had a grain
 *   standard deviation of 0.0035, so a difference of two frames' grain is
 *   about 0.005); anything a viewer sees as a change is above it.
 * - spikeRatio 3: a steady move changes about the same amount every frame, and
 *   eases change it by well under 2× from one frame to the next; a pop or a
 *   cut is several times its neighbours.
 * - holdRatio 0.25: a repeated frame reads 0, or render noise, between
 *   neighbours that move; a slow ease is never a quarter of the frames beside it.
 * - quietBelow 0.002: half an 8-bit step on average over the frame; below it
 *   nothing visible changed, so it is the floor a spike is measured against
 *   (otherwise a tiny change after a still stretch would be an infinite ratio).
 * - movingShare 0.0005: 0.05% of the pixels (about 1,000 at 1080×1920, a 32 px
 *   square): grain alone changes none above changeAbove, so a grainy still
 *   shot never counts as moving and a dropped frame in it is not a stutter.
 * - window 3: three pairs each side is enough to tell a pop from a change of
 *   speed, short enough to follow an ease.
 * - amplify 8: a change of 0.03 shows at a quarter of full white on the sheet.
 */
export const DIFF_DEFAULTS = {
    changeAbove: 0.04,
    spikeRatio: 3,
    holdRatio: 0.25,
    quietBelow: 0.002,
    movingShare: 0.0005,
    window: 3,
    amplify: 8,
};
const LIMITS = {
    changeAbove: { min: 0, max: 1 },
    spikeRatio: { min: 1, max: 1000, above: true },
    holdRatio: { min: 0, max: 1, above: true },
    quietBelow: { min: 0, max: 1 },
    movingShare: { min: 0, max: 1 },
    window: { min: 1, max: 16, int: true },
    amplify: { min: 1, max: 1000 },
};
export function resolveDiffThresholds(args = {}) {
    const out = { ...DIFF_DEFAULTS };
    for (const key of Object.keys(DIFF_DEFAULTS)) {
        const v = args[key];
        if (typeof v === "number")
            out[key] = v;
    }
    return out;
}
/** Null when the threshold object is acceptable, else what is wrong with it. */
export function diffArgsError(args) {
    for (const [key, value] of Object.entries(args)) {
        if (key === "sheet")
            continue;
        const limit = LIMITS[key];
        if (!limit) {
            return `\`diff.${key}\` is not an option (options: ${Object.keys(LIMITS).join(", ")}, sheet)`;
        }
        if (typeof value !== "number" || !Number.isFinite(value)) {
            return `\`diff.${key}\` must be a number`;
        }
        const low = limit.above ? value <= limit.min : value < limit.min;
        if (low || value > limit.max || (limit.int && !Number.isInteger(value))) {
            const range = limit.above
                ? `above ${limit.min} and at most ${limit.max}`
                : `${limit.min} to ${limit.max}`;
            return `\`diff.${key}\` must be ${limit.int ? "a whole number " : ""}${range}, not ${value}`;
        }
    }
    return null;
}
/**
 * The picture a pair is compared on: RGB 0..1 per pixel. `straight` is true
 * only for an rgba file this call wrote (straight colour): its colour is
 * weighted by alpha. A raw capture's alpha is ignored: its RGB is already over
 * the comp background.
 */
export function pictureOf(img, straight) {
    const n = img.width * img.height;
    const out = new Float32Array(n * 3);
    const a = straight ? img.alpha : undefined;
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
            const m = dr > dg ? (dr > db ? dr : db) : dg > db ? dg : db;
            const mean = (dr + dg + db) / 3;
            sum += mean;
            if (m > maxAbs)
                maxAbs = m;
            if (m > above) {
                changed++;
                if (x < bx0)
                    bx0 = x;
                if (x > bx1)
                    bx1 = x;
                if (y < by0)
                    by0 = y;
                if (y > by1)
                    by1 = y;
            }
            if (perPixel)
                perPixel(x, y, mean);
        }
    }
    const pixels = (x1 - x0) * (y1 - y0);
    return {
        pixels,
        change: r6(pixels > 0 ? sum / pixels : 0),
        maxAbsDelta: r6(maxAbs),
        changedPixels: changed,
        changedShare: r6(pixels > 0 ? changed / pixels : 0),
        changedBounds: changed > 0 ? { x: bx0, y: by0, width: bx1 - bx0 + 1, height: by1 - by0 + 1 } : null,
    };
}
/** How one picture changed into the next, whole frame and per region. */
export function pictureChange(prev, cur, width, height, t, opts = {}) {
    let perPixel;
    let sums = null;
    let counts = null;
    const tw = opts.thumb?.width ?? 0;
    if (opts.thumb) {
        const th = opts.thumb.height;
        sums = new Float64Array(tw * th);
        counts = new Float64Array(tw * th);
        const col = new Int32Array(width);
        for (let x = 0; x < width; x++)
            col[x] = Math.min(tw - 1, Math.floor((x * tw) / width));
        const row = new Int32Array(height);
        for (let y = 0; y < height; y++)
            row[y] = Math.min(th - 1, Math.floor((y * th) / height)) * tw;
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
                return { name: region.name, error: `region is outside the ${width}×${height} frame` };
            const { x, y, width: w, height: h } = clip.rect;
            return {
                name: region.name,
                ...rectStats(prev, cur, width, x, y, x + w, y + h, t.changeAbove),
            };
        });
    }
    if (sums && counts) {
        const thumb = new Float64Array(sums.length);
        for (let k = 0; k < sums.length; k++) {
            thumb[k] = counts[k] > 0 ? Math.min(1, (sums[k] / counts[k]) * t.amplify) : 0;
        }
        out.thumb = thumb;
    }
    return out;
}
/** The lower middle value: with an even count, the smaller of the two middle values. */
function lowerMedian(values) {
    const s = [...values].sort((a, b) => a - b);
    return s[Math.floor((s.length - 1) / 2)];
}
function side(pairs, p, dir, window, skip) {
    const changes = [];
    const shares = [];
    for (let k = 1; k <= window; k++) {
        const j = p + dir * k;
        if (j < 0 || j >= pairs.length)
            break;
        if (skip.has(j))
            continue;
        changes.push(pairs[j].change);
        shares.push(pairs[j].changedShare);
    }
    if (changes.length === 0)
        return null;
    return { change: lowerMedian(changes), share: lowerMedian(shares) };
}
const fmt = (v) => v.toFixed(4);
const frameText = (f) => `#${f.index}${f.time === undefined ? "" : ` (${r6(f.time)} s)`}`;
/**
 * Median, extremes and the pairs that stand out. A spike stands out from the
 * neighbours on every side it has (so a move starting from rest is not a cut):
 * two spikes in a row are a one-frame pop of the frame they share, a lone
 * spike is a cut (or a jump). A hold — a pair that barely changes while the
 * neighbours on both sides move — is a stutter: a repeated frame. Spikes are
 * left out of a hold's neighbours, so the pair beside a pop is not a stutter.
 */
export function summarizeSeries(pairs, t) {
    const n = pairs.length;
    const changes = pairs.map((p) => p.change);
    let largest = 0;
    let smallest = 0;
    for (let i = 1; i < n; i++) {
        if (changes[i] > changes[largest])
            largest = i;
        if (changes[i] < changes[smallest])
            smallest = i;
    }
    const summary = {
        pairs: n,
        median: n > 0 ? r6(lowerMedian(changes)) : 0,
        mean: n > 0 ? r6(changes.reduce((a, b) => a + b, 0) / n) : 0,
        largest: { pair: largest, change: n > 0 ? changes[largest] : 0 },
        smallest: { pair: smallest, change: n > 0 ? changes[smallest] : 0 },
        flags: [],
        reading: "",
    };
    if (n < 2) {
        summary.reading =
            n === 0
                ? "no pair of consecutive frames to compare"
                : "one pair: nothing to compare it with, so nothing is flagged (render at least three frames)";
        return summary;
    }
    const none = new Set();
    const spike = pairs.map((p, i) => {
        if (p.changedShare < t.movingShare)
            return null;
        const sides = [side(pairs, i, -1, t.window, none), side(pairs, i, 1, t.window, none)].filter((s) => s !== null);
        if (sides.length === 0)
            return null;
        const reference = Math.max(...sides.map((s) => s.change), t.quietBelow);
        if (sides.some((s) => p.change < t.spikeRatio * Math.max(s.change, t.quietBelow)))
            return null;
        return { reference, edge: sides.length < 2 };
    });
    const spikes = new Set(spike.flatMap((s, i) => (s ? [i] : [])));
    const flags = [];
    for (let i = 0; i < n; i++) {
        const s = spike[i];
        if (!s)
            continue;
        const runStart = i === 0 || !spike[i - 1];
        if (!runStart)
            continue;
        let end = i;
        while (end + 1 < n && spike[end + 1])
            end++;
        if (end === i + 1) {
            const reference = Math.max(s.reference, spike[end].reference);
            const change = Math.min(pairs[i].change, pairs[end].change);
            const frame = pairs[i].to;
            flags.push({
                kind: "pop",
                pairs: [i, end],
                frame,
                change,
                reference: r6(reference),
                ratio: r6(change / reference),
                reading: `frame ${frameText(frame)} differs from the frames before and after it by ${fmt(change)} or more, while its neighbours change about ${fmt(reference)}: a one-frame pop`,
            });
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
                reading: `${frameText(between[0])} to ${frameText(between[1])} changes ${fmt(pairs[j].change)}, ${(pairs[j].change / sj.reference).toFixed(1)}× its neighbours: a cut or a jump`,
            };
            if (sj.edge) {
                flag.atSeriesEdge = true;
                flag.reading += " (first or last pair: it could also be a pop of the end frame)";
            }
            flags.push(flag);
        }
    }
    for (let i = 0; i < n; i++) {
        if (spikes.has(i))
            continue;
        const before = side(pairs, i, -1, t.window, spikes);
        const after = side(pairs, i, 1, t.window, spikes);
        if (!before || !after)
            continue;
        const moving = (s) => s.change >= t.quietBelow && s.share >= t.movingShare;
        if (!moving(before) || !moving(after))
            continue;
        const reference = Math.min(before.change, after.change);
        if (pairs[i].change > t.holdRatio * reference)
            continue;
        const frame = pairs[i].to;
        flags.push({
            kind: "stutter",
            pairs: [i],
            frame,
            change: pairs[i].change,
            reference: r6(reference),
            ratio: r6(pairs[i].change / reference),
            reading: `frame ${frameText(frame)} barely changes from the one before (${fmt(pairs[i].change)}) while the frames around it move about ${fmt(reference)}: a repeated frame, a stutter`,
        });
    }
    flags.sort((a, b) => a.pairs[0] - b.pairs[0]);
    summary.flags = flags;
    const counts = ["pop", "stutter", "cut"]
        .map((k) => [k, flags.filter((f) => f.kind === k).length])
        .filter(([, c]) => c > 0)
        .map(([k, c]) => `${c} ${k}${c > 1 ? "s" : ""}`);
    summary.reading =
        `${n} pairs, median change ${fmt(summary.median)}, largest ${fmt(summary.largest.change)} (pair ${largest}); ` +
            (flags.length === 0
                ? "no pair stands out from its neighbours"
                : `${counts.join(", ")}: ${flags.map((f) => `${f.kind} at pair ${f.pairs.join("+")}`).join("; ")}`);
    return summary;
}
//# sourceMappingURL=motion.js.map
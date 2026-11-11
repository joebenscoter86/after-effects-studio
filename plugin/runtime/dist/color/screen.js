// Screen measurement (agent-eyes plan, stage 6): the `screen` report of
// ae_render_frame. Measured in Node on a decoded render of the UN-KEYED source
// (Keylight View 1 "Source", or the key switched off), before any key is set:
// once a key has run, the screen is gone and Keylight has despilled what is
// left, so the screen's colour and evenness can only be read from the source.
//
// What it reports, all from one frame:
//   - which screen it is (green or blue), detected or as given;
//   - which pixels count as screen: the screen channel leads the larger of the
//     other two by at least `minExcess`, and by at least `minDominance` of its
//     own level (so a dark green-grey shadow and a neutral wall do not count);
//     their share of the measured (opaque) pixels and their bounds;
//   - a suggested screen colour: the per-channel median of the screen pixels
//     (robust to grain and to a few subject-edge pixels), their mean, and the
//     median of the screen pixels in a band just outside the subject, which is
//     where the key has to work;
//   - the subject: the largest 8-connected area that is not screen;
//   - evenness: per-cell mean colour, luma and screen-channel level on a grid,
//     the darkest and brightest cells (only cells at least `minCellShare`
//     screen) with their boxes, the spread as a ratio, and a plane fitted to
//     the level over every screen pixel, giving the left-to-right and
//     top-to-bottom ratios even where the subject hides part of the screen.
//     The plane is read only across the extent where screen was measured
//     (5th to 95th percentile of the screen pixels' x and y), never
//     extrapolated to the frame's edges (a masked source has screen in part
//     of the frame only), and every side darker past unevenRatio is named;
//   - grain: the standard deviation of each channel about its 3×3 local mean,
//     on screen pixels whose neighbours are all screen (a smooth gradient
//     cancels out of a 3×3 mean, so unevenness does not count as grain).
//
// Values are capture values (see SCREEN_COLOUR_NOTE). Only opaque pixels are
// measured: a partly transparent pixel's RGB is mixed with the comp background.
//
// Memory, per frame while it is measured: a Uint8 screen map, an Int32 label
// map and queue, a Float64 subject map, two Float32 distance maps (about 33
// bytes a pixel, ~70 MB at 1080×1920). Nothing is kept afterwards.
import { distanceTo, labelRegions } from "./matte.js";
/**
 * The defaults and why:
 * - minExcess 0.04 (about ten 8-bit steps): the real screen measured live
 *   (2026-11-10) led by 0.13 to 0.16 in its lit parts and about 0.06 in its
 *   darkest corner; skin, grey and brown lead by zero or less.
 * - minDominance 0.15: the lead must be a real share of the level, so a
 *   near-black pixel with a little green noise is not screen. The measured
 *   screen sat at 0.25 to 0.35.
 * - minScreenShare 0.02: below that, what leans green is set dressing or
 *   spill, not a screen.
 * - opaque 1 − 2/255, as `edge` and `sample` count opaque.
 * - grid: four cells across the shorter side, square-ish cells (4 × 7 at
 *   1080×1920, 7 × 4 at 1920×1080). The live measurement used 4 × 6.
 * - minCellShare 0.25: a cell that is mostly subject says little about the screen.
 * - nearSkip 1% of the shorter side, at least 2 px (11 at 1080): past the
 *   subject's soft edge and the worst spill. nearBand 5%, at least 4 px (54 at
 *   1080): close enough to be the screen the key meets at the subject.
 * - unevenRatio 1.1: a 10% spread in level is about what one Screen Colour
 *   with modest Clip settings absorbs; the measured screen was 1.5x.
 * - grainAbove 0.01 (about 2.5 8-bit steps): finer grain is quantisation.
 */
export const SCREEN_DEFAULTS = {
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
    grainAbove: 0.01,
};
/** Said with every report: what the colours are, and what that means for Keylight. */
export const SCREEN_COLOUR_NOTE = "Colours are capture values: the opaque pixels of the render as saveFrameToPng wrote them, so " +
    "the comp background does not mix in. In a project with no working space (8 bpc, as measured " +
    "live in After Effects 2027) these are the footage's own 0..1 values, the scale Keylight's " +
    "Screen Colour takes, so colour.nearSubject (or colour.median) can go to key.keylight's " +
    "screenColour as it is. In a colour-managed project they are working-space values scaled by " +
    "After Effects' capture transfer; that has not been checked against Keylight, so confirm the " +
    "key with the Screen Matte and Status views. Measure the source un-keyed (Keylight View " +
    "'source', or the key off, and isolate the layer): a keyed render has no screen left, and " +
    "Keylight despills what it outputs.";
/** Cells across the shorter side, and the grid for a frame of this size. */
function autoGrid(width, height) {
    const short = Math.min(width, height);
    const across = 4;
    const along = Math.max(1, Math.round((across * Math.max(width, height)) / short));
    return width <= height ? { columns: across, rows: along } : { columns: along, rows: across };
}
/** Caller overrides on top of the defaults, for a frame of this size. */
export function resolveScreenThresholds(args, width, height) {
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
        grainAbove: args.grainAbove ?? SCREEN_DEFAULTS.grainAbove,
    };
}
/** Why a set of caller thresholds cannot be used, or null when it can. */
export function screenArgsError(args) {
    if (args.screen !== undefined &&
        args.screen !== "auto" &&
        args.screen !== "green" &&
        args.screen !== "blue") {
        return "`screen.screen` must be 'auto', 'green' or 'blue'";
    }
    for (const key of [
        "minExcess",
        "minDominance",
        "minScreenShare",
        "opaque",
        "minCellShare",
        "grainAbove",
    ]) {
        const v = args[key];
        if (v !== undefined && (typeof v !== "number" || !(v >= 0 && v <= 1))) {
            return `\`screen.${key}\` must be a number in 0..1`;
        }
    }
    for (const key of ["columns", "rows"]) {
        const v = args[key];
        if (v !== undefined && (!Number.isInteger(v) || v < 1 || v > 64)) {
            return `\`screen.${key}\` must be a whole number from 1 to 64`;
        }
    }
    const skip = args.nearSkip;
    if (skip !== undefined && (typeof skip !== "number" || !Number.isFinite(skip) || skip < 0)) {
        return "`screen.nearSkip` must be 0 or more (pixels)";
    }
    const band = args.nearBand;
    if (band !== undefined && (typeof band !== "number" || !Number.isFinite(band) || band < 1)) {
        return "`screen.nearBand` must be at least 1 (pixels)";
    }
    const u = args.unevenRatio;
    if (u !== undefined && (typeof u !== "number" || !Number.isFinite(u) || u < 1)) {
        return "`screen.unevenRatio` must be a number of 1 or more";
    }
    return null;
}
const r4 = (v) => Math.round(v * 1e4) / 1e4;
const r4rgb = (v) => [r4(v[0]), r4(v[1]), r4(v[2])];
const luma = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const CH = { green: 1, blue: 2 };
/** Whether pixel p is screen: its screen channel leads the others by minExcess and minDominance. */
function screenTest(rgb, p, ch, t) {
    const v = rgb[p * 3 + ch];
    const others = ch === 1 ? Math.max(rgb[p * 3], rgb[p * 3 + 2]) : Math.max(rgb[p * 3], rgb[p * 3 + 1]);
    const lead = v - others;
    return lead >= t.minExcess && lead >= t.minDominance * v;
}
const BINS = 65536;
/** Per-channel median from three histograms of BINS bins over 0..1. */
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
/**
 * Measure the screen in one render of the un-keyed source. Throws nothing on
 * a frame without a screen: it says so in `reading`.
 */
export function measureScreen(img, t) {
    const { width, height, rgb } = img;
    const alpha = img.alpha;
    const n = width * height;
    const measuredAt = (p) => !alpha || alpha[p] >= t.opaque;
    let measured = 0;
    for (let p = 0; p < n; p++)
        if (measuredAt(p))
            measured++;
    const leftOut = n - measured;
    // Which screen.
    const kinds = t.screen === "auto" ? ["green", "blue"] : [t.screen];
    let kind = kinds[0];
    let best = -1;
    for (const k of kinds) {
        let count = 0;
        for (let p = 0; p < n; p++)
            if (measuredAt(p) && screenTest(rgb, p, CH[k], t))
                count++;
        if (count > best) {
            best = count;
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
        screenColourNote: SCREEN_COLOUR_NOTE,
    };
    if (leftOut > n / 2) {
        base.warning =
            `${Math.round((100 * leftOut) / n)}% of the frame is transparent or partly transparent, as a ` +
                "keyed render is. Measure the source: set Keylight's View to 'source' (key.view) or switch the " +
                "key off, and isolate the keyed layer so nothing else is in the render.";
    }
    if (!found) {
        const what = t.screen === "auto" ? "green or blue" : t.screen;
        base.reading =
            `no ${what} screen found: fewer than ${Math.round(t.minScreenShare * 100)}% of the ` +
                `${measured} measured pixels have ${what} leading the other channels by at least ` +
                `${t.minExcess} and ${Math.round(t.minDominance * 100)}% of its level`;
        return base;
    }
    // Screen pixels: a map, bounds, histograms, sums.
    const isScreen = new Uint8Array(n);
    const hist = new Uint32Array(3 * BINS);
    const sum = [0, 0, 0];
    let count = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -1;
    let maxY = -1;
    for (let p = 0; p < n; p++) {
        if (!measuredAt(p) || !screenTest(rgb, p, ch, t))
            continue;
        isScreen[p] = 1;
        count++;
        addToHist(hist, rgb, p);
        for (let c = 0; c < 3; c++)
            sum[c] += rgb[p * 3 + c];
        const x = p % width;
        const y = (p - x) / width;
        if (x < minX)
            minX = x;
        if (x > maxX)
            maxX = x;
        if (y < minY)
            minY = y;
        if (y > maxY)
            maxY = y;
    }
    const median = histMedian(hist, count);
    const mean = [sum[0] / count, sum[1] / count, sum[2] / count];
    // The subject: the largest 8-connected area of measured pixels that are not screen.
    const labels = new Int32Array(n);
    const queue = new Int32Array(n);
    const ones = alpha ?? new Float64Array(n).fill(1);
    const regions = labelRegions(ones, width, height, (p) => measuredAt(p) && isScreen[p] === 0, true, labels, queue, -1);
    let subjectId = 0;
    for (let i = 0; i < regions.length; i++) {
        if (subjectId === 0 || regions[i].area > regions[subjectId - 1].area)
            subjectId = i + 1;
    }
    let subject = null;
    let nearSubject = null;
    if (subjectId > 0) {
        const s = regions[subjectId - 1];
        subject = {
            box: { x: s.minX, y: s.minY, width: s.maxX - s.minX + 1, height: s.maxY - s.minY + 1 },
            area: s.area,
            share: r4(s.area / n),
        };
        const mask = new Float64Array(n);
        for (let p = 0; p < n; p++)
            if (labels[p] === subjectId)
                mask[p] = 1;
        const scratch = new Float32Array(n);
        const dist = new Float32Array(n);
        distanceTo(mask, width, height, (a) => a > 0.5, scratch, dist);
        const from = t.nearSkip;
        const to = t.nearSkip + t.nearBand;
        const nearHist = new Uint32Array(3 * BINS);
        let nearCount = 0;
        for (let p = 0; p < n; p++) {
            if (isScreen[p] === 0 || !(dist[p] > from && dist[p] <= to))
                continue;
            addToHist(nearHist, rgb, p);
            nearCount++;
        }
        if (nearCount > 0) {
            nearSubject = {
                colour: r4rgb(histMedian(nearHist, nearCount)),
                pixels: nearCount,
                band: { from, to },
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
    base.reading =
        `${kind} screen, ${Math.round(base.share * 100)}% of the measured pixels; median ${fmt(median)}` +
            (near ? `, near the subject ${fmt(near)}` : "") +
            `. ${evenness.reading}. ${grain ? grain.reading : "grain not measured (no screen pixel has screen all round it)"}.`;
    return base;
}
function measureEvenness(img, isScreen, measuredAt, ch, kind, t) {
    const { width, height, rgb } = img;
    const cols = Math.min(t.columns, width);
    const rows = Math.min(t.rows, height);
    const xs = Array.from({ length: cols + 1 }, (_, i) => Math.floor((i * width) / cols));
    const ys = Array.from({ length: rows + 1 }, (_, i) => Math.floor((i * height) / rows));
    const cells = [];
    // Plane fit of the level over every screen pixel, x and y scaled to 0..1:
    // level ≈ a + b·u + c·v. Normal equations accumulated in one pass.
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
    // Screen pixels per column and per row, for the measured extent.
    const perX = new Float64Array(width);
    const perY = new Float64Array(height);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let m = 0;
            let k = 0;
            const acc = [0, 0, 0];
            for (let y = ys[r]; y < ys[r + 1]; y++) {
                for (let x = xs[c]; x < xs[c + 1]; x++) {
                    const p = y * width + x;
                    if (!measuredAt(p))
                        continue;
                    m++;
                    if (isScreen[p] === 0)
                        continue;
                    k++;
                    for (let q = 0; q < 3; q++)
                        acc[q] += rgb[p * 3 + q];
                    perX[x]++;
                    perY[y]++;
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
                level: cellMean ? r4(cellMean[ch]) : null,
            });
        }
    }
    const eligible = cells.filter((c) => c.level !== null && c.screenShare >= t.minCellShare);
    let darkest = null;
    let brightest = null;
    for (const c of eligible) {
        if (darkest === null || c.level < darkest.level)
            darkest = c;
        if (brightest === null || c.level > brightest.level)
            brightest = c;
    }
    const levelRatio = darkest && brightest && darkest.level > 0 ? r4(brightest.level / darkest.level) : null;
    const lumaRatio = darkest && brightest && darkest.luma > 0 ? r4(brightest.luma / darkest.luma) : null;
    const uneven = levelRatio !== null && levelRatio > t.unevenRatio;
    // Solve the 3×3 normal equations (Cramer's rule).
    const plane = solve3([
        [s1, su, sv],
        [su, suu, suv],
        [sv, suv, svv],
    ], [sl, sul, svl]);
    const [x0, x1] = percentileRange(perX, s1);
    const [y0, y1] = percentileRange(perY, s1);
    const extent = { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
    let horizontal = null;
    let vertical = null;
    if (plane && s1 > 0) {
        const [a, b, c] = plane;
        const at = (u, v) => a + b * u + c * v;
        const ratio = (hi, lo) => (lo > 0 && hi > 0 ? r4(hi / lo) : null);
        const uc = su / s1;
        const vc = sv / s1;
        if (x1 > x0)
            horizontal = ratio(at(x1 / du, vc), at(x0 / du, vc));
        if (y1 > y0)
            vertical = ratio(at(uc, y1 / dv), at(uc, y0 / dv));
    }
    const sides = [];
    if (horizontal !== null) {
        sides.push({
            side: horizontal > 1 ? "left" : "right",
            strength: Math.max(horizontal, 1 / horizontal),
        });
    }
    if (vertical !== null) {
        sides.push({
            side: vertical > 1 ? "top" : "bottom",
            strength: Math.max(vertical, 1 / vertical),
        });
    }
    const darkerSide = sides
        .filter((d) => d.strength > t.unevenRatio)
        .sort((p, q) => q.strength - p.strength)
        .map((d) => d.side);
    const where = (c) => `cell ${c.column},${c.row} at x ${c.box.x}, y ${c.box.y}`;
    let reading;
    if (darkest === null || brightest === null || levelRatio === null) {
        reading = `no grid cell is at least ${Math.round(t.minCellShare * 100)}% screen, so evenness was not read`;
    }
    else {
        const spread = `the screen's ${kind} level runs from ${darkest.level.toFixed(3)} (${where(darkest)}) to ` +
            `${brightest.level.toFixed(3)} (${where(brightest)}), ${levelRatio.toFixed(2)}x`;
        reading = uneven
            ? `uneven: ${spread}` +
                (darkerSide.length ? `, darker on the ${darkerSide.join(" and the ")}` : "") +
                ". One Screen Colour will not fit all of it: key from the colour near the subject, then " +
                "check the darker part in the Screen Matte view (Clip Black, a second key, or a garbage mask)"
            : `even: ${spread}`;
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
        extent,
        horizontal,
        vertical,
        darkerSide,
        reading,
    };
}
/** First and last index holding the 5th and 95th percentile of `counts` (total `total`). */
function percentileRange(counts, total) {
    if (total <= 0)
        return [0, counts.length - 1];
    const lo = 0.05 * total;
    const hi = 0.95 * total;
    let acc = 0;
    let first = -1;
    let last = counts.length - 1;
    for (let i = 0; i < counts.length; i++) {
        acc += counts[i];
        if (first < 0 && acc >= lo)
            first = i;
        if (acc >= hi) {
            last = i;
            break;
        }
    }
    return [Math.max(0, first), last];
}
function solve3(m, v) {
    const det = (a) => a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) -
        a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) +
        a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
    const d = det(m);
    if (!Number.isFinite(d) || Math.abs(d) < 1e-12)
        return null;
    const col = (i) => m.map((row, r) => row.map((x, c) => (c === i ? v[r] : x)));
    return [det(col(0)) / d, det(col(1)) / d, det(col(2)) / d];
}
function measureGrain(img, isScreen, ch, kind, t) {
    const { width, height, rgb } = img;
    const ss = [0, 0, 0];
    let k = 0;
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const p = y * width + x;
            if (isScreen[p] === 0)
                continue;
            let all = true;
            for (let dy = -1; dy <= 1 && all; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (isScreen[p + dy * width + dx] === 0) {
                        all = false;
                        break;
                    }
                }
            }
            if (!all)
                continue;
            for (let c = 0; c < 3; c++) {
                let s = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++)
                        s += rgb[(p + dy * width + dx) * 3 + c];
                }
                const d = rgb[p * 3 + c] - s / 9;
                ss[c] += d * d;
            }
            k++;
        }
    }
    if (k === 0)
        return null;
    // A pixel minus its 3×3 mean has variance (8/9)·σ² for independent grain.
    const sd = [0, 1, 2].map((c) => Math.sqrt(((ss[c] / k) * 9) / 8));
    const level = sd[ch];
    const grainy = level > t.grainAbove;
    const steps = level * 255;
    return {
        stdDev: r4rgb(sd),
        level: r4(level),
        steps8bit: Math.round(steps * 100) / 100,
        samples: k,
        grainy,
        reading: `grain: ${kind} varies by ${level.toFixed(4)} (standard deviation, about ${steps.toFixed(1)} 8-bit ` +
            `steps) about its local mean` +
            (grainy
                ? "; grainy enough to break a hard matte into specks and chatter, so try Keylight's Screen " +
                    "Pre-blur before raising Clip Black"
                : "; fine enough not to need pre-blur"),
    };
}
//# sourceMappingURL=screen.js.map
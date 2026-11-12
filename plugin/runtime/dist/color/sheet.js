// Frame inspection for the render tool: tiling several captures into one
// labelled contact sheet, and measuring a capture (edge bands, content
// bounds, coverage) so a motion check does not need a human — or an image
// model — to spot a black bar or an element that slid off frame.
//
// Pure Node, zero dependencies: pixels come from png16.decodePng, and the
// only text ever drawn is a frame index and a time, which a 5×7 bitmap
// font covers.
import { cellLuma, DIFF_DEFAULTS, motionCentre, pictureChange, pictureOf, registerMotionMaps, summarizeSeries, } from "./motion.js";
/** Per-channel tolerance for "same color": two 8-bit steps. */
const TOL = 2 / 255;
function px(img, x, y) {
    const i = (y * img.width + x) * 3;
    return [img.rgb[i], img.rgb[i + 1], img.rgb[i + 2]];
}
function same(a, b) {
    return (Math.abs(a[0] - b[0]) <= TOL && Math.abs(a[1] - b[1]) <= TOL && Math.abs(a[2] - b[2]) <= TOL);
}
function isBackground(img, x, y, bg) {
    if (img.alpha)
        return img.alpha[y * img.width + x] <= TOL;
    return bg !== null && same(px(img, x, y), bg);
}
/** The color most of the four corners share (ties go to the top-left). */
function cornerColor(img) {
    const corners = [
        px(img, 0, 0),
        px(img, img.width - 1, 0),
        px(img, 0, img.height - 1),
        px(img, img.width - 1, img.height - 1),
    ];
    let best = corners[0];
    let bestCount = 0;
    for (const c of corners) {
        const count = corners.filter((o) => same(o, c)).length;
        if (count > bestCount) {
            best = c;
            bestCount = count;
        }
    }
    return best;
}
/** True when every pixel along one row (or column) is background-like or one color. */
function lineUniform(img, fixed, horizontal) {
    const n = horizontal ? img.width : img.height;
    const first = horizontal ? px(img, 0, fixed) : px(img, fixed, 0);
    let transparent = img.alpha !== undefined;
    for (let i = 0; i < n; i++) {
        const x = horizontal ? i : fixed;
        const y = horizontal ? fixed : i;
        if (transparent && img.alpha[y * img.width + x] > TOL)
            transparent = false;
        if (!same(px(img, x, y), first))
            return { uniform: false, transparent: false, color: first };
    }
    return { uniform: true, transparent, color: first };
}
function edgeBand(img, side) {
    const horizontal = side === "top" || side === "bottom";
    const n = horizontal ? img.height : img.width;
    let width = 0;
    let color = null;
    let transparent = true;
    for (let i = 0; i < n; i++) {
        const fixed = side === "top" || side === "left" ? i : n - 1 - i;
        const line = lineUniform(img, fixed, horizontal);
        if (!line.uniform)
            break;
        if (color === null)
            color = line.color;
        else if (!same(color, line.color))
            break;
        if (!line.transparent)
            transparent = false;
        width++;
    }
    if (width === 0)
        return { width: 0, kind: "none", color: null };
    return { width, kind: transparent && img.alpha ? "transparent" : "color", color };
}
/** Measure a capture. Works on the raw decode so alpha is still there. */
export function analyzeFrame(img) {
    const { width, height } = img;
    const bgColor = img.alpha ? null : cornerColor(img);
    const sum = [0, 0, 0];
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    let content = 0;
    const first = px(img, 0, 0);
    let uniform = true;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 3;
            sum[0] += img.rgb[i];
            sum[1] += img.rgb[i + 1];
            sum[2] += img.rgb[i + 2];
            if (uniform && !same(px(img, x, y), first))
                uniform = false;
            if (!isBackground(img, x, y, bgColor)) {
                content++;
                if (x < minX)
                    minX = x;
                if (x > maxX)
                    maxX = x;
                if (y < minY)
                    minY = y;
                if (y > maxY)
                    maxY = y;
            }
        }
    }
    const total = width * height;
    return {
        width,
        height,
        meanRgb: [sum[0] / total, sum[1] / total, sum[2] / total],
        uniform,
        background: img.alpha
            ? { kind: "transparent", color: null }
            : { kind: "color", color: bgColor },
        contentBounds: content === 0
            ? null
            : { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
        coverage: content / total,
        edges: {
            top: edgeBand(img, "top"),
            bottom: edgeBand(img, "bottom"),
            left: edgeBand(img, "left"),
            right: edgeBand(img, "right"),
        },
    };
}
// ---------------------------------------------------------------------------
// Transparency: what a transparent pixel is shown against
// ---------------------------------------------------------------------------
/** The checkerboard drawn behind transparency: mid greys, so black and white both read. */
export const CHECKERBOARD = {
    size: 16,
    light: [0.8, 0.8, 0.8],
    dark: [0.6, 0.6, 0.6],
};
/**
 * The colour under a capture's comp background. saveFrameToPng writes an
 * alpha channel, but its RGB is already laid over the comp background colour
 * (measured live, AE 27.0, 8 and 16 bpc): captured = colour·a + bg·(1 − a).
 * So colour = (captured − bg·(1 − a)) / a, clamped to 0..1, and 0 where
 * a = 0 (nothing covers the pixel, so there is no colour to recover). On a
 * black background this is un-premultiplying. Returns a new RGB buffer; an
 * image without alpha comes back as an unchanged copy.
 */
export function unmatte(img, bg) {
    const out = Float64Array.from(img.rgb);
    const alpha = img.alpha;
    if (!alpha)
        return out;
    for (let p = 0; p < alpha.length; p++) {
        const a = alpha[p];
        if (a >= 1)
            continue;
        const i = p * 3;
        for (let c = 0; c < 3; c++) {
            out[i + c] = a <= 0 ? 0 : Math.min(1, Math.max(0, (out[i + c] - bg[c] * (1 - a)) / a));
        }
    }
    return out;
}
/**
 * Composite straight (unassociated) colour over a backdrop:
 * out = rgb·a + backdrop·(1 − a). Returns a new RGB buffer; an image without
 * alpha comes back as an unchanged copy. A raw capture is not straight (see
 * unmatte): take its comp background out first.
 */
export function flattenOver(img, backdrop) {
    const out = Float64Array.from(img.rgb);
    const alpha = img.alpha;
    if (!alpha)
        return out;
    const { width, height } = img;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const p = y * width + x;
            const a = alpha[p];
            if (a >= 1)
                continue;
            const bg = backdrop.kind === "color"
                ? backdrop.color
                : (Math.floor(x / CHECKERBOARD.size) + Math.floor(y / CHECKERBOARD.size)) % 2 === 0
                    ? CHECKERBOARD.light
                    : CHECKERBOARD.dark;
            const i = p * 3;
            out[i] = out[i] * a + bg[0] * (1 - a);
            out[i + 1] = out[i + 1] * a + bg[1] * (1 - a);
            out[i + 2] = out[i + 2] * a + bg[2] * (1 - a);
        }
    }
    return out;
}
const r4 = (v) => Math.round(v * 1e4) / 1e4;
const r4rgb = (v) => [r4(v[0]), r4(v[1]), r4(v[2])];
/** Clip a region to the frame; null when nothing of it is inside. */
export function clipRegion(img, region) {
    const x0 = Math.floor(region.x);
    const y0 = Math.floor(region.y);
    const x1 = x0 + Math.max(1, Math.floor(region.width ?? 1));
    const y1 = y0 + Math.max(1, Math.floor(region.height ?? 1));
    const cx0 = Math.max(0, x0);
    const cy0 = Math.max(0, y0);
    const cx1 = Math.min(img.width, x1);
    const cy1 = Math.min(img.height, y1);
    if (cx1 <= cx0 || cy1 <= cy0)
        return null;
    return {
        rect: { x: cx0, y: cy0, width: cx1 - cx0, height: cy1 - cy0 },
        clipped: cx0 !== x0 || cy0 !== y0 || cx1 !== x1 || cy1 !== y1,
    };
}
function outside(img, region) {
    return { name: region.name, error: `region is outside the ${img.width}×${img.height} frame` };
}
/** Mean, minimum and maximum per channel, and alpha coverage, for each region. */
export function sampleRegions(img, regions) {
    return regions.map((region) => {
        const clip = clipRegion(img, region);
        if (!clip)
            return outside(img, region);
        const { rect } = clip;
        const sum = [0, 0, 0];
        const min = [Infinity, Infinity, Infinity];
        const max = [-Infinity, -Infinity, -Infinity];
        let aSum = 0;
        let aMin = Infinity;
        let aMax = -Infinity;
        let opaque = 0;
        let transparent = 0;
        for (let y = rect.y; y < rect.y + rect.height; y++) {
            for (let x = rect.x; x < rect.x + rect.width; x++) {
                const p = y * img.width + x;
                for (let c = 0; c < 3; c++) {
                    const v = img.rgb[p * 3 + c];
                    sum[c] += v;
                    if (v < min[c])
                        min[c] = v;
                    if (v > max[c])
                        max[c] = v;
                }
                if (img.alpha) {
                    const a = img.alpha[p];
                    aSum += a;
                    if (a < aMin)
                        aMin = a;
                    if (a > aMax)
                        aMax = a;
                    if (a >= 1 - TOL)
                        opaque++;
                    else if (a <= TOL)
                        transparent++;
                }
            }
        }
        const n = rect.width * rect.height;
        return {
            name: region.name,
            rect,
            clipped: clip.clipped,
            pixels: n,
            mean: r4rgb([sum[0] / n, sum[1] / n, sum[2] / n]),
            min: r4rgb(min),
            max: r4rgb(max),
            alpha: img.alpha
                ? {
                    mean: r4(aSum / n),
                    min: r4(aMin),
                    max: r4(aMax),
                    opaqueShare: r4(opaque / n),
                    partialShare: r4((n - opaque - transparent) / n),
                    transparentShare: r4(transparent / n),
                }
                : null,
        };
    });
}
/** Whole-frame per-channel histogram with `bins` equal-width bins over 0..1. */
export function histogramOf(img, bins) {
    const n = img.width * img.height;
    const counts = [0, 1, 2].map(() => Array.from({ length: bins }, () => 0));
    const aCounts = img.alpha ? Array.from({ length: bins }, () => 0) : undefined;
    const bin = (v) => Math.min(bins - 1, Math.max(0, Math.floor(v * bins)));
    for (let p = 0; p < n; p++) {
        for (let c = 0; c < 3; c++)
            counts[c][bin(img.rgb[p * 3 + c])]++;
        if (aCounts && img.alpha)
            aCounts[bin(img.alpha[p])]++;
    }
    return {
        bins,
        pixels: n,
        r: counts[0],
        g: counts[1],
        b: counts[2],
        ...(aCounts ? { a: aCounts } : {}),
    };
}
/** Per-region differences between two frames of the same size, `to` minus `from`. */
export function compareRegions(from, to, regions) {
    if (from.width !== to.width || from.height !== to.height) {
        throw new Error(`cannot compare frames of different size (${from.width}×${from.height} vs ${to.width}×${to.height})`);
    }
    const withAlpha = from.alpha !== undefined && to.alpha !== undefined;
    return regions.map((region) => {
        const clip = clipRegion(from, region);
        if (!clip)
            return outside(from, region);
        const { rect } = clip;
        const delta = [0, 0, 0];
        const absSum = [0, 0, 0];
        const absMax = [0, 0, 0];
        let aDelta = 0;
        let aAbs = 0;
        let aMax = 0;
        for (let y = rect.y; y < rect.y + rect.height; y++) {
            for (let x = rect.x; x < rect.x + rect.width; x++) {
                const p = y * from.width + x;
                for (let c = 0; c < 3; c++) {
                    const d = to.rgb[p * 3 + c] - from.rgb[p * 3 + c];
                    delta[c] += d;
                    absSum[c] += Math.abs(d);
                    if (Math.abs(d) > absMax[c])
                        absMax[c] = Math.abs(d);
                }
                if (withAlpha) {
                    const d = to.alpha[p] - from.alpha[p];
                    aDelta += d;
                    aAbs += Math.abs(d);
                    if (Math.abs(d) > aMax)
                        aMax = Math.abs(d);
                }
            }
        }
        const n = rect.width * rect.height;
        return {
            name: region.name,
            rect,
            clipped: clip.clipped,
            pixels: n,
            meanDelta: r4rgb([delta[0] / n, delta[1] / n, delta[2] / n]),
            meanAbsDelta: r4rgb([absSum[0] / n, absSum[1] / n, absSum[2] / n]),
            maxAbsDelta: r4rgb(absMax),
            alpha: withAlpha
                ? { meanDelta: r4(aDelta / n), meanAbsDelta: r4(aAbs / n), maxAbsDelta: r4(aMax) }
                : null,
        };
    });
}
/** "#rrggbb" for an RGB triple in 0..1, as an 8-bit file stores it. */
export function rgbHex(rgb) {
    return `#${rgb
        .map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, "0"))
        .join("")}`;
}
/** Area-averaging downscale to exactly tw×th. */
export function resample(img, tw, th) {
    const out = new Float64Array(tw * th * 3);
    const counts = new Float64Array(tw * th);
    for (let y = 0; y < img.height; y++) {
        const ty = Math.min(th - 1, Math.floor((y * th) / img.height));
        for (let x = 0; x < img.width; x++) {
            const tx = Math.min(tw - 1, Math.floor((x * tw) / img.width));
            const si = (y * img.width + x) * 3;
            const di = (ty * tw + tx) * 3;
            out[di] += img.rgb[si];
            out[di + 1] += img.rgb[si + 1];
            out[di + 2] += img.rgb[si + 2];
            counts[ty * tw + tx]++;
        }
    }
    for (let i = 0; i < tw * th; i++) {
        const c = counts[i] || 1;
        out[i * 3] /= c;
        out[i * 3 + 1] /= c;
        out[i * 3 + 2] /= c;
    }
    return out;
}
// 5×7 glyphs for the only text the sheets ever carry: "#<index> <time>s" on the
// contact sheet, "#<from>><to> <change> x<gain> !" on the diff sheet, and
// "<time>s <kind>" (lowercase words such as "pop", "frozen", "off-right") on
// the ae_check_comp sheet.
const GLYPHS = {
    "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
    "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
    "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
    "3": ["#####", "...#.", "..#..", "...#.", "....#", "#...#", ".###."],
    "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
    "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
    "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
    "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
    "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
    "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
    ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
    ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
    "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
    ">": [".#...", "..#..", "...#.", "....#", "...#.", "..#..", ".#..."],
    x: [".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
    "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
    "#": [".#.#.", ".#.#.", "#####", ".#.#.", "#####", ".#.#.", ".#.#."],
    s: [".....", ".....", ".####", "#....", ".###.", "....#", "####."],
    f: ["..##.", ".#...", "###..", ".#...", ".#...", ".#...", ".#..."],
    a: [".....", ".....", ".###.", "....#", ".####", "#...#", ".####"],
    b: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "####."],
    c: [".....", ".....", ".###.", "#....", "#....", "#...#", ".###."],
    d: ["....#", "....#", ".####", "#...#", "#...#", "#...#", ".####"],
    e: [".....", ".....", ".###.", "#...#", "#####", "#....", ".###."],
    g: [".....", ".....", ".####", "#...#", "#...#", "#...#", ".####", "....#", ".###."],
    h: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "#...#"],
    i: ["..#..", ".....", ".##..", "..#..", "..#..", "..#..", ".###."],
    j: ["...#.", ".....", "..##.", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
    k: ["#....", "#....", "#..#.", "#.#..", "##...", "#.#..", "#..#."],
    l: [".##..", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
    m: [".....", ".....", "##.#.", "#.#.#", "#.#.#", "#...#", "#...#"],
    n: [".....", ".....", "####.", "#...#", "#...#", "#...#", "#...#"],
    o: [".....", ".....", ".###.", "#...#", "#...#", "#...#", ".###."],
    p: [".....", ".....", "####.", "#...#", "#...#", "#...#", "####.", "#....", "#...."],
    q: [".....", ".....", ".####", "#...#", "#...#", "#...#", ".####", "....#", "....#"],
    r: [".....", ".....", "#.##.", "##..#", "#....", "#....", "#...."],
    t: [".#...", ".#...", "###..", ".#...", ".#...", ".#..#", "..##."],
    u: [".....", ".....", "#...#", "#...#", "#...#", "#..##", ".##.#"],
    v: [".....", ".....", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
    w: [".....", ".....", "#...#", "#...#", "#.#.#", "#.#.#", ".#.#."],
    y: [".....", ".....", "#...#", "#...#", "#...#", "#...#", ".####", "....#", ".###."],
    z: [".....", ".....", "#####", "...#.", "..#..", ".#...", "#####"],
    "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
    " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
};
const GLYPH_W = 5;
/** Rows from the top of a glyph to its baseline; g, j, p, q and y add two rows below it. */
const GLYPH_H = 7;
const FONT_SCALE = 2;
// Text starts 2 px into the strip: 7 rows to the baseline plus 2 descender rows
// end 18 px down, inside the 20 px strip.
const LABEL_H = GLYPH_H * FONT_SCALE + 6;
/** Width of one label character on a sheet, px: labels longer than a tile is wide run into the next tile. */
export const LABEL_CHAR_PX = (GLYPH_W + 1) * FONT_SCALE;
function drawText(rgb, width, x0, y0, text, color) {
    let cx = x0;
    for (const ch of text) {
        const glyph = GLYPHS[ch] ?? GLYPHS[" "];
        for (let gy = 0; gy < glyph.length; gy++) {
            for (let gx = 0; gx < GLYPH_W; gx++) {
                if (glyph[gy][gx] !== "#")
                    continue;
                for (let sy = 0; sy < FONT_SCALE; sy++) {
                    for (let sx = 0; sx < FONT_SCALE; sx++) {
                        const x = cx + gx * FONT_SCALE + sx;
                        const y = y0 + gy * FONT_SCALE + sy;
                        const i = (y * width + x) * 3;
                        rgb[i] = color[0];
                        rgb[i + 1] = color[1];
                        rgb[i + 2] = color[2];
                    }
                }
            }
        }
        cx += (GLYPH_W + 1) * FONT_SCALE;
    }
}
/** Tile frames into one image with a label strip above each tile. */
export function composeContactSheet(frames, opts = {}) {
    if (frames.length === 0)
        throw new Error("contact sheet needs at least one frame");
    const gap = opts.gap ?? 8;
    const bg = opts.background ?? [0.12, 0.12, 0.12];
    const columns = Math.max(1, Math.min(frames.length, opts.columns ?? Math.ceil(Math.sqrt(frames.length))));
    const rows = Math.ceil(frames.length / columns);
    const srcW = Math.max(...frames.map((f) => f.width));
    const srcH = Math.max(...frames.map((f) => f.height));
    const thumbWidth = Math.max(16, Math.min(opts.thumbWidth ?? 480, srcW));
    const thumbHeight = Math.max(1, Math.round((srcH * thumbWidth) / srcW));
    const cellW = thumbWidth;
    const cellH = LABEL_H + thumbHeight;
    const width = gap + columns * (cellW + gap);
    const height = gap + rows * (cellH + gap);
    const rgb = new Float64Array(width * height * 3);
    for (let i = 0; i < width * height; i++) {
        rgb[i * 3] = bg[0];
        rgb[i * 3 + 1] = bg[1];
        rgb[i * 3 + 2] = bg[2];
    }
    for (const [n, frame] of frames.entries()) {
        const col = n % columns;
        const row = Math.floor(n / columns);
        const x0 = gap + col * (cellW + gap);
        const y0 = gap + row * (cellH + gap);
        // Keep each frame's own aspect; a smaller frame just leaves background.
        const tw = Math.max(1, Math.min(thumbWidth, Math.round((frame.width * thumbWidth) / srcW)));
        const th = Math.max(1, Math.min(thumbHeight, Math.round((frame.height * tw) / frame.width)));
        const thumb = resample(frame, tw, th);
        for (let y = 0; y < th; y++) {
            for (let x = 0; x < tw; x++) {
                const si = (y * tw + x) * 3;
                const di = ((y0 + LABEL_H + y) * width + (x0 + x)) * 3;
                rgb[di] = thumb[si];
                rgb[di + 1] = thumb[si + 1];
                rgb[di + 2] = thumb[si + 2];
            }
        }
        const label = opts.labels?.[n] ?? `#${n}`;
        drawText(rgb, width, x0 + 2, y0 + 2, label, [0.95, 0.95, 0.95]);
    }
    return { width, height, rgb, columns, rows, thumbWidth, thumbHeight };
}
/** Label text for a frame: "#3 1.500s" — only characters the font has. */
export function frameLabel(index, time) {
    return time === undefined ? `#${index}` : `#${index} ${time.toFixed(3)}s`;
}
export const LOOK_ROLES = ["neutral", "skin", "plate", "element"];
/**
 * Starting points, not measured judgments: a quarter either way for grain and
 * edge width; 0.02 (about five 8-bit steps) for black and white points; a
 * CIELAB a* or b* of 2 as the smallest cast called a cast (a colour
 * difference of about 2 is near the threshold of seeing one side by side).
 */
export const LOOK_DEFAULTS = {
    minContrast: 0.1,
    grainTolerance: 0.25,
    sharpnessTolerance: 0.25,
    levelTolerance: 0.02,
    castAbove: 2,
    /** Pixels at or above this alpha count as the element when the frame has alpha. */
    opaque: 0.98,
    /** Half-length of the profile read across an edge, px: edges up to about 10 px wide (sigma 4). */
    edgeReach: 12,
    /** Profiles are the mean of this many neighbouring lines. */
    edgeLines: 5,
    /** Skin hue angle (CIELAB h, degrees) commonly reported for skin of many tones under neutral light. */
    skinHue: [40, 65],
};
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const labF = (t) => (t > (6 / 29) ** 3 ? Math.cbrt(t) : t / (3 * (6 / 29) ** 2) + 4 / 29);
/** CIELAB (D65) of an sRGB colour given as display values 0..1. */
export function labOf(rgb) {
    const [r, g, b] = rgb.map((v) => srgbToLinear(Math.min(1, Math.max(0, v))));
    const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
    const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
    const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
    const fx = labF(x);
    const fy = labF(y);
    const fz = labF(z);
    const L = 116 * fy - 16;
    const A = 500 * (fx - fy);
    const B = 200 * (fy - fz);
    const hue = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
    const r2 = (v) => Math.round(v * 100) / 100;
    return {
        L: r2(L),
        a: r2(A),
        b: r2(B),
        chroma: r2(Math.hypot(A, B)),
        hue: Math.round(hue * 10) / 10,
    };
}
const luma = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
/**
 * Per-channel gains on the display values that make `rgb` neutral at its
 * own luma: equal values read a* = b* = 0 whatever the encoding.
 */
export function neutralGains(rgb) {
    const k = luma(rgb);
    return rgb.map((v) => (v > 0 ? k / v : 1));
}
function cropOf(img, rect, opaque) {
    const { x, y, width, height } = rect;
    const rgb = new Float64Array(width * height * 3);
    const use = new Uint8Array(width * height);
    const alpha = img.alpha ? new Float64Array(width * height) : undefined;
    for (let j = 0; j < height; j++)
        for (let i = 0; i < width; i++) {
            const p = (y + j) * img.width + (x + i);
            const q = j * width + i;
            for (let c = 0; c < 3; c++)
                rgb[q * 3 + c] = img.rgb[p * 3 + c];
            use[q] = !img.alpha || img.alpha[p] >= opaque ? 1 : 0;
            if (alpha && img.alpha)
                alpha[q] = img.alpha[p];
        }
    return alpha ? { rect, width, height, rgb, use, alpha } : { rect, width, height, rgb, use };
}
/** Every region's crop, for the frame-to-frame grain (and kept small: regions only). */
export function lookCrops(img, args) {
    const out = new Map();
    for (const r of args.regions) {
        const clip = clipRegion(img, r);
        if (clip)
            out.set(r.name, cropOf(img, clip.rect, LOOK_DEFAULTS.opaque));
    }
    return out;
}
const MAD_TO_SD = 1.4826;
function median(v) {
    if (!v.length)
        return NaN;
    const s = v.slice().sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function percentile(v, p) {
    if (!v.length)
        return NaN;
    const s = v.slice().sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))))];
}
/**
 * Standard deviation of `v` with outliers left out: values further from the
 * median than four robust spreads (1.4826 x the median absolute deviation),
 * or three 8-bit steps when that is wider, do not count. The plain median
 * absolute deviation is too coarse on 8-bit values at one or two steps of
 * grain; trimming keeps an edge through the region from counting as grain.
 */
const robustSd = (v) => {
    const m = median(v);
    const band = Math.max(4 * MAD_TO_SD * median(v.map((x) => Math.abs(x - m))), 3 / 255);
    let n = 0;
    let sum = 0;
    let sq = 0;
    for (const x of v)
        if (Math.abs(x - m) <= band) {
            n++;
            sum += x;
            sq += x * x;
        }
    if (n < 2)
        return 0;
    const mean = sum / n;
    return Math.sqrt(Math.max(0, sq / n - mean * mean));
};
const steps = (v) => Math.round(v * 255 * 100) / 100;
/**
 * Grain in one frame, per channel, in 8-bit steps: the robust spread of each
 * pixel minus the mean of its 3 x 3 neighbourhood, scaled so white grain of
 * standard deviation s reads s. The median absolute deviation keeps an edge
 * through the region from counting as grain.
 */
function spatialGrain(c) {
    const out = [];
    const scale = 1 / Math.sqrt(8 / 9);
    for (let ch = 0; ch < 3; ch++) {
        const res = [];
        for (let y = 1; y < c.height - 1; y += 1)
            for (let x = 1; x < c.width - 1; x += 1) {
                let ok = true;
                let sum = 0;
                for (let dy = -1; dy <= 1 && ok; dy++)
                    for (let dx = -1; dx <= 1; dx++) {
                        const q = (y + dy) * c.width + (x + dx);
                        if (!c.use[q]) {
                            ok = false;
                            break;
                        }
                        sum += c.rgb[q * 3 + ch];
                    }
                if (!ok)
                    continue;
                res.push(c.rgb[(y * c.width + x) * 3 + ch] - sum / 9);
            }
        out.push(res.length ? steps(robustSd(res) * scale) : NaN);
    }
    return out;
}
/**
 * Grain between two frames of the same region, per channel, in 8-bit steps:
 * the robust spread of the frame difference over the square root of two. A
 * still element reads 0; grain that changes every frame reads its size.
 */
export function temporalGrain(a, b) {
    if (a.width !== b.width || a.height !== b.height)
        return null;
    const out = [];
    for (let ch = 0; ch < 3; ch++) {
        const d = [];
        for (let q = 0; q < a.use.length; q++)
            if (a.use[q] && b.use[q])
                d.push(b.rgb[q * 3 + ch] - a.rgb[q * 3 + ch]);
        if (!d.length)
            return null;
        out.push(steps(robustSd(d) / Math.SQRT2));
    }
    return out;
}
/**
 * Edge width: across each edge with a luma step of at least `minContrast`,
 * the distance from 10% to 90% of the step, read on the mean of `edgeLines`
 * neighbouring lines, horizontally and vertically. A hard step reads about
 * 0.8 px; a Gaussian blur of sigma s about 2.56 s. Median over the edges.
 */
function edgeWidths(c, minContrast) {
    const R = LOOK_DEFAULTS.edgeReach;
    const half = LOOK_DEFAULTS.edgeLines >> 1;
    const Y = new Float64Array(c.width * c.height);
    for (let q = 0; q < Y.length; q++)
        Y[q] = c.use[q] ? luma([c.rgb[q * 3], c.rgb[q * 3 + 1], c.rgb[q * 3 + 2]]) : NaN;
    const widths = [];
    const scan = (along, across, at) => {
        // `u` runs along the profile, `v` across the lines averaged.
        for (let v = half; v < across - half; v += 2) {
            const prof = (u) => {
                let s = 0;
                for (let k = -half; k <= half; k++)
                    s += at(u, v + k);
                return s / (2 * half + 1);
            };
            let u = R;
            while (u < along - R - 1) {
                const d = Math.abs(prof(u + 1) - prof(u));
                const span = prof(u + R + 1) - prof(u - R);
                if (!Number.isFinite(d) || !Number.isFinite(span) || Math.abs(span) < minContrast) {
                    u++;
                    continue;
                }
                // The steepest step within reach is the edge's centre.
                let best = u;
                let bestD = d;
                for (let w = Math.max(R, u - R); w <= Math.min(along - R - 2, u + R); w++) {
                    const dw = Math.abs(prof(w + 1) - prof(w));
                    if (dw > bestD) {
                        best = w;
                        bestD = dw;
                    }
                }
                if (best !== u) {
                    u = best > u ? best : u + 1;
                    continue;
                }
                const p = [];
                for (let k = -R; k <= R + 1; k++)
                    p.push(prof(u + k));
                const lo = (p[0] + p[1]) / 2;
                const hi = (p[p.length - 1] + p[p.length - 2]) / 2;
                if (Math.abs(hi - lo) >= minContrast * 0.8) {
                    const q = p.map((x) => (x - lo) / (hi - lo));
                    const cross = (t) => {
                        for (let k = 1; k < q.length; k++)
                            if (q[k] >= t)
                                return k - 1 + (t - q[k - 1]) / (q[k] - q[k - 1] || 1);
                        return NaN;
                    };
                    const wdt = cross(0.9) - cross(0.1);
                    if (Number.isFinite(wdt) && wdt > 0)
                        widths.push(wdt);
                }
                u += R;
            }
        }
    };
    scan(c.width, c.height, (u, v) => Y[v * c.width + u]);
    scan(c.height, c.width, (u, v) => Y[u * c.width + v]);
    if (widths.length < 3)
        return { edgeWidth: null, p90: null, edges: widths.length };
    return {
        edgeWidth: Math.round(median(widths) * 100) / 100,
        p90: Math.round(percentile(widths, 90) * 100) / 100,
        edges: widths.length,
    };
}
function levelsOf(c) {
    const ch = [[], [], []];
    const Ys = [];
    for (let q = 0; q < c.use.length; q++) {
        if (!c.use[q])
            continue;
        const px = [c.rgb[q * 3], c.rgb[q * 3 + 1], c.rgb[q * 3 + 2]];
        for (let k = 0; k < 3; k++)
            ch[k].push(px[k]);
        Ys.push(luma(px));
    }
    const mean = ch.map((v) => v.reduce((s, x) => s + x, 0) / (v.length || 1));
    return {
        black: r4rgb(ch.map((v) => percentile(v, 0.5))),
        white: r4rgb(ch.map((v) => percentile(v, 99.5))),
        mean: r4rgb(mean),
        lumaBlack: r4(percentile(Ys, 0.5)),
        lumaWhite: r4(percentile(Ys, 99.5)),
        lumaMean: r4(luma(mean)),
    };
}
const signed = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;
/** The direction of a cast from CIELAB a* and b*, larger first; null under `castAbove`. */
function castWords(a, b) {
    const parts = [];
    if (Math.abs(a) >= LOOK_DEFAULTS.castAbove)
        parts.push([Math.abs(a), a > 0 ? "magenta" : "green"]);
    if (Math.abs(b) >= LOOK_DEFAULTS.castAbove)
        parts.push([Math.abs(b), b > 0 ? "yellow" : "blue"]);
    if (!parts.length)
        return null;
    return parts
        .sort((x, y) => y[0] - x[0])
        .map((p) => p[1])
        .join(" and ");
}
function roleReading(name, role, lab, levels, rep) {
    if (role === "neutral") {
        const toward = castWords(lab.a, lab.b);
        const gains = neutralGains(levels.mean);
        const mix = (g) => Math.round(g * 100);
        rep.cast = {
            a: lab.a,
            b: lab.b,
            amount: lab.chroma,
            toward,
            gains: [r4(gains[0]), r4(gains[1]), r4(gains[2])],
            channelMixer: {
                "Red-Red": mix(gains[0]),
                "Green-Green": mix(gains[1]),
                "Blue-Blue": mix(gains[2]),
            },
        };
        rep.reading = toward
            ? `${name} reads a* ${signed(lab.a)}, b* ${signed(lab.b)} (CIELAB): a cast toward ${toward} of ${lab.chroma.toFixed(1)}, if the surface is really neutral; a neutral reads 0, 0, and under about 2 is hard to see. ` +
                `Gains on the display values that make it neutral at its own brightness: red ${rep.cast.gains[0]}, green ${rep.cast.gains[1]}, blue ${rep.cast.gains[2]} (Channel Mixer Red-Red ${rep.cast.channelMixer["Red-Red"]}, Green-Green ${rep.cast.channelMixer["Green-Green"]}, Blue-Blue ${rep.cast.channelMixer["Blue-Blue"]}).`
            : `${name} reads neutral: a* ${signed(lab.a)}, b* ${signed(lab.b)} (CIELAB; under about 2 is hard to see).`;
    }
    else if (role === "skin") {
        const [lo, hi] = LOOK_DEFAULTS.skinHue;
        const h = lab.hue > 270 ? lab.hue - 360 : lab.hue;
        const where = h < lo
            ? `below the usual range, so it leans to magenta (pink); ${(lo - h).toFixed(0)}° short of ${lo}°`
            : h > hi
                ? `above the usual range, so it leans to yellow; ${(h - hi).toFixed(0)}° past ${hi}°`
                : "inside the usual range";
        rep.reading = `${name} (skin) has a hue angle of ${h.toFixed(0)}° and chroma ${lab.chroma.toFixed(1)} (CIELAB): ${where}. Skin of many tones commonly reads about ${lo} to ${hi}° under neutral light; that range is a general reference, not measured on this footage, so judge it against a neutral in the same light as well.`;
    }
}
const meanOf = (v) => v.reduce((s, x) => s + x, 0) / v.length;
/** An element region against its plate: grain, edge width, black and white points, with what to do. */
export function compareLook(element, plate, tol = {}) {
    const gt = tol.grain ?? LOOK_DEFAULTS.grainTolerance;
    const st = tol.sharpness ?? LOOK_DEFAULTS.sharpnessTolerance;
    const eg = meanOf(element.grain.spatial);
    const pg = meanOf(plate.grain.spatial);
    const gRatio = pg > 0 ? Math.round((eg / pg) * 100) / 100 : null;
    const gMatch = gRatio === null ? null : Math.abs(gRatio - 1) <= gt;
    const ew = element.sharpness.edgeWidth;
    const pw = plate.sharpness.edgeWidth;
    const sRatio = ew !== null && pw !== null && pw > 0 ? Math.round((ew / pw) * 100) / 100 : null;
    const sMatch = sRatio === null ? null : Math.abs(sRatio - 1) <= st;
    const bd = r4(element.levels.lumaBlack - plate.levels.lumaBlack);
    const wd = r4(element.levels.lumaWhite - plate.levels.lumaWhite);
    const readings = [];
    const e = element.name;
    if (gRatio !== null && !gMatch)
        readings.push(gRatio < 1
            ? `${e} is cleaner than the plate: add grain (grain ${eg.toFixed(2)} against ${pg.toFixed(2)} 8-bit steps).`
            : `${e} is grainier than the plate: take grain out or add less (${eg.toFixed(2)} against ${pg.toFixed(2)} 8-bit steps).`);
    if (sRatio !== null && !sMatch)
        readings.push(sRatio < 1
            ? `${e} is sharper than the plate: soften it (edges ${ew} px against ${pw} px wide, 10 to 90%).`
            : `${e} is softer than the plate: sharpen it, or soften the plate's match less (edges ${ew} px against ${pw} px).`);
    // Black and white points compare only when both regions hold the darkest (or brightest) part of their picture.
    const deepest = "if both regions hold the deepest shadow of their picture";
    const brightest = "if both regions hold the brightest highlight of their picture";
    if (Math.abs(bd) > LOOK_DEFAULTS.levelTolerance)
        readings.push(bd > 0
            ? `${e}'s blacks are lifted against the plate's (${element.levels.lumaBlack} against ${plate.levels.lumaBlack}): ${deepest}, seat them lower.`
            : `${e}'s blacks are deeper than the plate's (${element.levels.lumaBlack} against ${plate.levels.lumaBlack}): ${deepest}, lift them.`);
    if (Math.abs(wd) > LOOK_DEFAULTS.levelTolerance)
        readings.push(wd > 0
            ? `${e}'s whites are brighter than the plate's (${element.levels.lumaWhite} against ${plate.levels.lumaWhite}): ${brightest}, bring them down.`
            : `${e}'s whites are duller than the plate's (${element.levels.lumaWhite} against ${plate.levels.lumaWhite}): ${brightest}, bring them up.`);
    if (pw === null || ew === null)
        readings.push("Edge width was not compared: one side has no edge strong enough to read; pick regions that each hold an edge.");
    if (!readings.length)
        readings.push(`${e} matches the plate in grain, edge width and black and white points, within the tolerances.`);
    return {
        element: element.name,
        plate: plate.name,
        grain: {
            element: Math.round(eg * 100) / 100,
            plate: Math.round(pg * 100) / 100,
            ratio: gRatio,
            matches: gMatch,
        },
        sharpness: { element: ew, plate: pw, ratio: sRatio, matches: sMatch },
        levels: { blackDifference: bd, whiteDifference: wd },
        readings,
    };
}
/** The matte's edge in a crop with alpha: widths on the alpha, and soft pixels per pixel of outline. */
function matteEdge(c, minContrast) {
    const a = c.alpha;
    const grey = new Float64Array(a.length * 3);
    for (let q = 0; q < a.length; q++)
        grey[q * 3] = grey[q * 3 + 1] = grey[q * 3 + 2] = a[q];
    const widths = edgeWidths({ ...c, rgb: grey, use: new Uint8Array(a.length).fill(1) }, minContrast);
    let soft = 0;
    let outline = 0;
    let opaque = 0;
    let minAlpha = 1;
    const w = c.width;
    for (let y = 0; y < c.height; y++)
        for (let x = 0; x < w; x++) {
            const v = a[y * w + x];
            if (v > 0.02 && v < 0.98)
                soft++;
            if (v >= 0.99)
                opaque++;
            if (v < minAlpha)
                minAlpha = v;
            if (v < 0.5)
                continue;
            const p = y * w + x;
            if ((x > 0 && a[p - 1] < 0.5) ||
                (x < w - 1 && a[p + 1] < 0.5) ||
                (y > 0 && a[p - w] < 0.5) ||
                (y < c.height - 1 && a[p + w] < 0.5))
                outline++;
        }
    return {
        ...widths,
        softBand: outline ? Math.round((soft / outline) * 100) / 100 : null,
        opaqueShare: Math.round((opaque / a.length) * 10000) / 10000,
        minAlpha: Math.round(minAlpha * 10000) / 10000,
    };
}
/**
 * The soft band's colour (pixels at alpha 0.2 to 0.98, straight colour) against the colour well
 * inside (opaque, with nothing under 0.98 within 6 px), and how far it leans toward `background`:
 * 0 is the inside's colour, 1 the background's. Wall colour left in the soft pixels rings the
 * subject; a share under about 0.15 did not show on the take measured (keying.md).
 */
function edgeColourOf(c, background) {
    const a = c.alpha;
    const w = c.width;
    const band = [0, 0, 0];
    const inside = [0, 0, 0];
    let nb = 0;
    let ni = 0;
    for (let y = 0; y < c.height; y++)
        for (let x = 0; x < w; x++) {
            const p = y * w + x;
            const v = a[p];
            if (v > 0.2 && v < 0.98) {
                for (let k = 0; k < 3; k++)
                    band[k] += c.rgb[p * 3 + k];
                nb++;
            }
            else if (v >= 0.98) {
                let deep = true;
                for (let dy = -6; dy <= 6 && deep; dy += 2)
                    for (let dx = -6; dx <= 6; dx += 2) {
                        const yy = y + dy;
                        const xx = x + dx;
                        if (yy < 0 || xx < 0 || yy >= c.height || xx >= w || a[yy * w + xx] < 0.98) {
                            deep = false;
                            break;
                        }
                    }
                if (deep) {
                    for (let k = 0; k < 3; k++)
                        inside[k] += c.rgb[p * 3 + k];
                    ni++;
                }
            }
        }
    if (!nb || !ni)
        return {
            band: nb ? labOf(band.map((v) => v / nb)) : null,
            inside: ni ? labOf(inside.map((v) => v / ni)) : null,
            difference: null,
            towardBackground: null,
            reading: !nb
                ? "no soft edge in the region"
                : "nothing far enough inside the edge to compare with",
        };
    const lb = labOf(band.map((v) => v / nb));
    const li = labOf(inside.map((v) => v / ni));
    const difference = Math.round(Math.hypot(lb.L - li.L, lb.a - li.a, lb.b - li.b) * 10) / 10;
    let toward = null;
    if (background) {
        const lw = labOf(background);
        const dir = [lw.L - li.L, lw.a - li.a, lw.b - li.b];
        const d = [lb.L - li.L, lb.a - li.a, lb.b - li.b];
        const n2 = dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2;
        toward =
            n2 > 0
                ? Math.round(((d[0] * dir[0] + d[1] * dir[1] + d[2] * dir[2]) / n2) * 100) / 100
                : null;
    }
    const reading = toward === null
        ? `The soft edge differs from the colour well inside by ${difference} (CIELAB); give \`background\` (the wall's colour) to read how much of it is the background.`
        : `The soft edge's colour sits ${Math.round(toward * 100)}% of the way from the colour well inside toward the background (${difference} apart, CIELAB)` +
            (toward > 0.25
                ? ": background colour left in the edge, which rings the subject over a new background; Decontaminate Edge Colors takes it out."
                : ".");
    return { band: lb, inside: li, difference, towardBackground: toward, reading };
}
/** Grain, edge width, black and white points and colour of each region, and each element against its plate. */
export function measureLook(img, args) {
    const minContrast = args.minContrast ?? LOOK_DEFAULTS.minContrast;
    const regions = args.regions.map((r) => {
        const clip = clipRegion(img, r);
        if (!clip)
            return outside(img, r);
        const c = cropOf(img, clip.rect, LOOK_DEFAULTS.opaque);
        let pixels = 0;
        for (const u of c.use)
            pixels += u;
        if (!pixels)
            return { name: r.name, error: "no opaque pixels in the region" };
        const levels = levelsOf(c);
        const colour = labOf(levels.mean);
        const rep = {
            name: r.name,
            role: r.role ?? null,
            rect: clip.rect,
            clipped: clip.clipped,
            pixels,
            levels,
            grain: { spatial: spatialGrain(c) },
            sharpness: edgeWidths(c, minContrast),
            colour,
        };
        if (c.alpha) {
            rep.matte = matteEdge(c, minContrast);
            rep.edgeColour = edgeColourOf(c, args.background);
        }
        roleReading(r.name, r.role ?? null, colour, levels, rep);
        return rep;
    });
    const out = { regions };
    if (args.pairs?.length) {
        const byName = new Map(regions.map((r) => [r.name, r]));
        out.pairs = args.pairs.map((p) => {
            const e = byName.get(p.element);
            const pl = byName.get(p.plate);
            if (!e || "error" in e || !pl || "error" in pl)
                return {
                    element: p.element,
                    plate: p.plate,
                    error: "one side of the pair could not be measured",
                };
            return compareLook(e, pl, { grain: args.grainTolerance, sharpness: args.sharpnessTolerance });
        });
    }
    return out;
}
/** Frame-to-frame grain of each region over consecutive frames (crops from lookCrops, in order). */
export function summarizeLookSeries(frames, args) {
    const regions = args.regions.map((r) => {
        const per = [];
        for (let i = 1; i < frames.length; i++) {
            const a = frames[i - 1].get(r.name);
            const b = frames[i].get(r.name);
            const t = a && b ? temporalGrain(a, b) : null;
            if (t)
                per.push(t);
        }
        const temporal = per.length
            ? [0, 1, 2].map((k) => Math.round(median(per.map((p) => p[k])) * 100) / 100)
            : null;
        // The matte's change from frame to frame: mean |change in alpha| over the region, median over the pairs.
        const changes = [];
        for (let i = 1; i < frames.length; i++) {
            const a = frames[i - 1].get(r.name)?.alpha;
            const b = frames[i].get(r.name)?.alpha;
            if (!a || !b || a.length !== b.length)
                continue;
            let sum = 0;
            for (let q = 0; q < a.length; q++)
                sum += Math.abs(b[q] - a[q]);
            changes.push(sum / a.length);
        }
        const matteChange = changes.length ? Math.round(median(changes) * 10000) / 10000 : null;
        return { name: r.name, temporal, pairs: per.length, matteChange };
    });
    const out = { regions };
    if (args.pairs?.length) {
        const by = new Map(regions.map((r) => [r.name, r]));
        out.pairs = args.pairs.map((p) => {
            const et = by.get(p.element)?.temporal;
            const pt = by.get(p.plate)?.temporal;
            const e = et ? Math.round(meanOf(et) * 100) / 100 : null;
            const pl = pt ? Math.round(meanOf(pt) * 100) / 100 : null;
            const readings = [];
            if (e !== null && pl !== null && pl > 0.3) {
                if (e < pl * 0.25)
                    readings.push(`${p.element}'s grain does not change from frame to frame and the plate's does (${e} against ${pl} 8-bit steps): animate the grain.`);
                else if (Math.abs(e / pl - 1) > (args.grainTolerance ?? LOOK_DEFAULTS.grainTolerance))
                    readings.push(`${p.element}'s frame-to-frame grain is ${e} against the plate's ${pl} 8-bit steps.`);
            }
            return {
                element: p.element,
                plate: p.plate,
                element_temporal: e,
                plate_temporal: pl,
                readings,
            };
        });
    }
    return out;
}
/** A message naming the field, or null when `look` is usable. */
export function lookArgsError(args) {
    const regions = args.regions;
    if (!Array.isArray(regions) || regions.length === 0 || regions.length > 64)
        return "`look.regions` must list 1 to 64 regions";
    const names = new Set();
    for (const r of regions) {
        if (typeof r?.name !== "string" || !r.name)
            return "every `look.regions` entry needs a name";
        if (names.has(r.name))
            return `\`look.regions\` names '${r.name}' twice`;
        names.add(r.name);
        if (typeof r.x !== "number" || typeof r.y !== "number")
            return `\`look.regions\` '${r.name}' needs x and y`;
        if (r.role !== undefined && !LOOK_ROLES.includes(r.role))
            return `\`look.regions\` '${r.name}' has role '${String(r.role)}'; use ${LOOK_ROLES.join(", ")}`;
    }
    if (args.pairs !== undefined) {
        if (!Array.isArray(args.pairs))
            return "`look.pairs` must be a list of { element, plate }";
        for (const p of args.pairs) {
            if (!names.has(String(p?.element)))
                return `\`look.pairs\` names element '${String(p?.element)}', which is not a region`;
            if (!names.has(String(p?.plate)))
                return `\`look.pairs\` names plate '${String(p?.plate)}', which is not a region`;
        }
    }
    if (args.background !== undefined &&
        (!Array.isArray(args.background) ||
            args.background.length !== 3 ||
            !args.background.every((v) => typeof v === "number" && v >= 0 && v <= 1)))
        return "`look.background` must be [r, g, b], each 0..1";
    for (const k of ["minContrast", "grainTolerance", "sharpnessTolerance"]) {
        const v = args[k];
        if (v !== undefined && (typeof v !== "number" || !(v > 0) || v > 1))
            return `\`look.${k}\` must be a number above 0 and at most 1`;
    }
    return null;
}
// ---------------------------------------------------------------------------
// Working to a reference: one report on a still, frames or a movie, the same
// report on a build, and the differences between the two, largest first.
// ---------------------------------------------------------------------------
/**
 * Starting points, not measured judgments, for what counts as a difference:
 * a CIELAB a* or b* of 2 (as `look` calls a cast), 3 in L*, 0.02 in a black,
 * white or mean level, a quarter in edge width or grain, 5% in the subject's
 * size, 3% of the frame in a position. Two motion maps line up as the same
 * footage at a correlation of 0.6 or more (0.94 measured between two builds
 * of one take; see reference-study.md).
 */
export const REFERENCE_DEFAULTS = {
    grid: 3,
    paletteColours: 6,
    /** Every this many pixels across and down go into the main colours. */
    paletteStep: 6,
    /** Frames spread over the input that colour, levels, sharpness and grain are read on. */
    lookFrames: 24,
    /** Cell of the motion map, px. */
    motionCell: 16,
    castStep: 2,
    lightnessStep: 3,
    levelStep: 0.02,
    ratioStep: 1.25,
    sizeStep: 0.05,
    placeStep: 0.03,
    sameFootage: 0.6,
    shareStep: 0.05,
    /** A colour of the reference with no colour of the build within this (CIELAB) is missing. */
    colourMatch: 10,
    /**
     * With nothing saying how far apart a folder's frames are: a median change
     * between neighbouring files of this or more reads as frames far apart. On
     * the round-two movies, every twentieth frame read medians of 0.026 and
     * 0.029; every frame 0.007 (largest pair 0.029, a cut 0.088).
     */
    spreadGuess: 0.02,
};
const GRID_NAMES = [
    ["top left", "top", "top right"],
    ["left", "middle", "right"],
    ["bottom left", "bottom", "bottom right"],
];
/** The frame cut into thirds each way, named as a person would point at them. */
export function gridRegions(width, height) {
    const out = [];
    for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++) {
            const x0 = Math.round((c * width) / 3);
            const y0 = Math.round((r * height) / 3);
            out.push({
                name: GRID_NAMES[r][c],
                x: x0,
                y: y0,
                width: Math.round(((c + 1) * width) / 3) - x0,
                height: Math.round(((r + 1) * height) / 3) - y0,
            });
        }
    return out;
}
/** Luma and per-channel 0.5th and 99.5th percentiles and means, from histograms on every other pixel. */
function frameLevels(img) {
    const BINS = 1024;
    const hist = [new Uint32Array(BINS), new Uint32Array(BINS), new Uint32Array(BINS), new Uint32Array(BINS)];
    const sum = [0, 0, 0];
    let n = 0;
    for (let y = 0; y < img.height; y += 2)
        for (let x = 0; x < img.width; x += 2) {
            const p = (y * img.width + x) * 3;
            const px = [img.rgb[p], img.rgb[p + 1], img.rgb[p + 2]];
            for (let c = 0; c < 3; c++) {
                hist[c][Math.min(BINS - 1, Math.max(0, Math.floor(px[c] * BINS)))]++;
                sum[c] += px[c];
            }
            hist[3][Math.min(BINS - 1, Math.max(0, Math.floor(luma(px) * BINS)))]++;
            n++;
        }
    const pct = (h, q) => {
        const want = q * n;
        let acc = 0;
        for (let b = 0; b < BINS; b++) {
            acc += h[b];
            if (acc >= want)
                return (b + 0.5) / BINS;
        }
        return 1;
    };
    const mean = sum.map((v) => v / (n || 1));
    return {
        lumaBlack: pct(hist[3], 0.005),
        lumaWhite: pct(hist[3], 0.995),
        lumaMean: luma(mean),
        black: [0, 1, 2].map((c) => pct(hist[c], 0.005)),
        white: [0, 1, 2].map((c) => pct(hist[c], 0.995)),
    };
}
/** Centres of brightness (luma) and of detail (luma gradient), on every fourth pixel. */
function frameWeight(img) {
    const s = 4;
    let lw = 0;
    let lx = 0;
    let ly = 0;
    let dw = 0;
    let dx = 0;
    let dy = 0;
    const Y = (x, y) => {
        const p = (y * img.width + x) * 3;
        return luma([img.rgb[p], img.rgb[p + 1], img.rgb[p + 2]]);
    };
    for (let y = 0; y + s < img.height; y += s)
        for (let x = 0; x + s < img.width; x += s) {
            const v = Y(x, y);
            lw += v;
            lx += v * x;
            ly += v * y;
            const g = Math.abs(Y(x + s, y) - v) + Math.abs(Y(x, y + s) - v);
            dw += g;
            dx += g * x;
            dy += g * y;
        }
    const r3 = (v) => Math.round(v * 1000) / 1000;
    return {
        brightness: lw > 0 ? { x: r3(lx / lw / img.width), y: r3(ly / lw / img.height) } : { x: 0.5, y: 0.5 },
        detail: dw > 0 ? { x: r3(dx / dw / img.width), y: r3(dy / dw / img.height) } : { x: 0.5, y: 0.5 },
    };
}
/** Main colours: k-means in CIELAB, started from the points furthest apart, ten rounds. */
function paletteOf(samples, k) {
    if (!samples.length)
        return [];
    const pts = samples.map((s) => s.lab);
    const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    const centres = [];
    const mean = [0, 1, 2].map((c) => pts.reduce((s, p) => s + p[c], 0) / pts.length);
    let far = 0;
    for (let i = 1; i < pts.length; i++)
        if (d2(pts[i], mean) > d2(pts[far], mean))
            far = i;
    centres.push(pts[far].slice());
    const near = pts.map((p) => d2(p, centres[0]));
    while (centres.length < k) {
        let f = 0;
        for (let i = 1; i < pts.length; i++)
            if (near[i] > near[f])
                f = i;
        if (near[f] <= 1)
            break;
        centres.push(pts[f].slice());
        for (let i = 0; i < pts.length; i++)
            near[i] = Math.min(near[i], d2(pts[i], pts[f]));
    }
    const of = new Int32Array(pts.length);
    for (let round = 0; round < 10; round++) {
        for (let i = 0; i < pts.length; i++) {
            let best = 0;
            for (let c = 1; c < centres.length; c++)
                if (d2(pts[i], centres[c]) < d2(pts[i], centres[best]))
                    best = c;
            of[i] = best;
        }
        const acc = centres.map(() => [0, 0, 0, 0]);
        for (let i = 0; i < pts.length; i++) {
            const a = acc[of[i]];
            for (let c = 0; c < 3; c++)
                a[c] += pts[i][c];
            a[3]++;
        }
        acc.forEach((a, c) => {
            if (a[3])
                centres[c] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]];
        });
    }
    const rgbAcc = centres.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < pts.length; i++) {
        const a = rgbAcc[of[i]];
        for (let c = 0; c < 3; c++)
            a[c] += samples[i].rgb[c];
        a[3]++;
    }
    return rgbAcc
        .filter((a) => a[3] > 0)
        .map((a) => {
        const rgb = [a[0] / a[3], a[1] / a[3], a[2] / a[3]];
        return { hex: rgbHex(rgb), colour: labOf(rgb), share: Math.round((a[3] / pts.length) * 1000) / 1000 };
    })
        .sort((x, y) => y.share - x.share);
}
const medianOf = (v) => (v.length ? median(v) : null);
/**
 * The reference report, read one frame at a time so a movie never sits in
 * memory: main colours and their shares, black and white points and mean,
 * colour, sharpness and grain at the grid's regions and any named ones, where
 * the weight of the frame sits, and, when the frames are consecutive, cuts
 * and how much and where the picture moves. Colour and texture are read on
 * up to `lookFrames` frames spread over the `total`; motion on every
 * neighbouring pair (one previous picture kept).
 */
export function referenceReader(opts) {
    const D = REFERENCE_DEFAULTS;
    const nLook = Math.max(1, Math.min(opts.total, opts.lookFrames ?? D.lookFrames));
    const lookIdx = new Set();
    for (let i = 0; i < nLook; i++)
        lookIdx.add(Math.floor((i * opts.total) / nLook));
    const cell = opts.motionCell ?? D.motionCell;
    let size = null;
    let regions = [];
    let added = 0;
    const perRegion = new Map();
    const levels = [];
    const weights = [];
    const samples = [];
    const pairs = [];
    const pairMaps = [];
    let prev = null;
    function add(f) {
        const img = f.img;
        if (!size) {
            size = [img.width, img.height];
            regions = [...gridRegions(img.width, img.height), ...(opts.regions ?? [])];
        }
        else if (img.width !== size[0] || img.height !== size[1])
            throw new Error(`frame ${f.frame} is ${img.width}×${img.height}, not ${size[0]}×${size[1]} like the first`);
        if (lookIdx.has(added)) {
            const look = measureLook(img, { regions });
            for (const r of look.regions) {
                if ("error" in r)
                    continue;
                const e = perRegion.get(r.name) ?? { mean: [], ew: [], p90: [], grain: [], role: r.role };
                e.mean.push(r.levels.mean);
                if (r.sharpness.edgeWidth !== null)
                    e.ew.push(r.sharpness.edgeWidth);
                if (r.sharpness.p90 !== null)
                    e.p90.push(r.sharpness.p90);
                e.grain.push((r.grain.spatial[0] + r.grain.spatial[1] + r.grain.spatial[2]) / 3);
                perRegion.set(r.name, e);
            }
            levels.push(frameLevels(img));
            weights.push(frameWeight(img));
            for (let y = 0; y < img.height; y += D.paletteStep)
                for (let x = 0; x < img.width; x += D.paletteStep) {
                    const p = (y * img.width + x) * 3;
                    const rgb = [img.rgb[p], img.rgb[p + 1], img.rgb[p + 2]];
                    const l = labOf(rgb);
                    samples.push({ lab: [l.L, l.a, l.b], rgb });
                }
        }
        const pic = pictureOf(img, false);
        const cells = cellLuma(img, cell);
        if (prev) {
            const ch = pictureChange(prev.pic, pic, img.width, img.height, DIFF_DEFAULTS);
            pairs.push({
                from: { index: prev.frame, time: prev.time },
                to: { index: f.frame, time: f.time },
                change: ch.all.change,
                changedShare: ch.all.changedShare,
            });
            const m = new Float32Array(cells.length);
            for (let k = 0; k < m.length; k++)
                m[k] = Math.abs(cells[k] - prev.cells[k]);
            pairMaps.push(m);
        }
        prev = { pic, cells, frame: f.frame, time: f.time };
        added++;
    }
    function finish() {
        if (!size)
            throw new Error("no frames to read");
        const [width, height] = size;
        const avg = (v) => v.reduce((s, x) => s + x, 0) / (v.length || 1);
        const r3 = (v) => Math.round(v * 1000) / 1000;
        const r2 = (v) => Math.round(v * 100) / 100;
        const regionReports = [];
        for (const r of regions) {
            const e = perRegion.get(r.name);
            if (!e || !e.mean.length)
                continue;
            const mean = [0, 1, 2].map((c) => r4(avg(e.mean.map((m) => m[c]))));
            const ew = medianOf(e.ew);
            const p90 = medianOf(e.p90);
            regionReports.push({
                name: r.name,
                role: e.role,
                colour: labOf(mean),
                mean,
                sharpness: { edgeWidth: ew === null ? null : r2(ew), p90: p90 === null ? null : r2(p90) },
                grain: r2(avg(e.grain)),
            });
        }
        const gridEw = regionReports
            .slice(0, 9)
            .flatMap((r) => (r.sharpness.edgeWidth === null ? [] : [r.sharpness.edgeWidth]));
        // Neighbours only: every pair one frame apart, unless the change says otherwise when nothing was said.
        const notes = [];
        const neighbours = pairs.length > 0 && pairs.every((q) => q.to.index === q.from.index + 1);
        let spacing = opts.spacing ?? { how: "rendered", step: neighbours ? 1 : null };
        let consecutive = neighbours;
        const medianChange = pairs.length ? median(pairs.map((q) => q.change)) : 0;
        const mc = medianChange.toFixed(4);
        // File names counting 0, 1, 2 can belong to frames pulled far apart (ffmpeg numbers what it writes), so they are checked too.
        const unsure = spacing.how === "assumed" || (spacing.how === "file names" && spacing.step === 1);
        if (consecutive && unsure) {
            const said = spacing.how === "file names"
                ? "The file names count up by one"
                : "Nothing said how far apart the frames are";
            if (medianChange >= D.spreadGuess) {
                consecutive = false;
                spacing = { how: "guessed from change", step: null };
                notes.push(`${said}, but neighbouring files change by a median of ${mc}, as frames far apart do (${D.spreadGuess} or more), so this guess reads them as spread: cuts and movement are not read. Pass frameStep: 1 if they are neighbours.`);
            }
            else if (spacing.how === "file names")
                notes.push(`The frames are neighbours, read from their file names (neighbouring files change by a median of ${mc}).`);
            else
                notes.push(`Nothing said how far apart the frames are; they were assumed to be neighbours (neighbouring files change by a median of ${mc}, under the ${D.spreadGuess} that spread frames read), so cuts and movement were read. Pass frameStep if they are not.`);
        }
        else if (pairs.length && !consecutive) {
            const apart = spacing.step ? `${spacing.step} frames apart` : "unevenly spaced";
            notes.push(`The frames are ${apart}, ${spacing.how === "given" ? "as given" : spacing.how === "file names" ? "read from their file names" : "as rendered"}: cuts and movement are not read, and the motion map shows what differs between the frames read, not motion.`);
        }
        const summary = consecutive && pairs.length >= 2 ? summarizeSeries(pairs, DIFF_DEFAULTS) : null;
        const cutPairs = new Set((summary?.flags ?? []).filter((fl) => fl.kind === "cut").flatMap((fl) => fl.pairs));
        const mw = Math.ceil(width / cell);
        const mh = Math.ceil(height / cell);
        const acc = new Float64Array(mw * mh);
        let counted = 0;
        let changeSum = 0;
        pairMaps.forEach((m, i) => {
            if (cutPairs.has(i))
                return;
            for (let k = 0; k < acc.length; k++)
                acc[k] += m[k];
            changeSum += pairs[i].change;
            counted++;
        });
        const meanChange = consecutive && counted ? Math.round((changeSum / counted) * 1e6) / 1e6 : null;
        const map = {
            width: mw,
            height: mh,
            cell,
            values: Array.from(acc, (v) => Math.round((counted ? v / counted : 0) * 1e5) / 1e5),
        };
        return {
            frames: added,
            notes,
            size: [width, height],
            frameRate: opts.frameRate ?? null,
            palette: paletteOf(samples, D.paletteColours),
            levels: {
                lumaBlack: r4(avg(levels.map((l) => l.lumaBlack))),
                lumaWhite: r4(avg(levels.map((l) => l.lumaWhite))),
                lumaMean: r4(avg(levels.map((l) => l.lumaMean))),
                black: [0, 1, 2].map((c) => r4(avg(levels.map((l) => l.black[c])))),
                white: [0, 1, 2].map((c) => r4(avg(levels.map((l) => l.white[c])))),
            },
            regions: regionReports,
            weight: {
                brightness: {
                    x: r3(avg(weights.map((w) => w.brightness.x))),
                    y: r3(avg(weights.map((w) => w.brightness.y))),
                },
                detail: { x: r3(avg(weights.map((w) => w.detail.x))), y: r3(avg(weights.map((w) => w.detail.y))) },
            },
            sharpness: { edgeWidth: gridEw.length ? r2(median(gridEw)) : null },
            grain: r2(avg(regionReports.slice(0, 9).map((r) => r.grain))),
            motion: {
                consecutive,
                spacing,
                spread: !consecutive,
                pairs: pairs.length,
                cuts: [...cutPairs]
                    .sort((a, b) => a - b)
                    .map((i) => ({ frame: pairs[i].to.index, time: pairs[i].to.time ?? null })),
                meanChange,
                map,
                subject: counted ? motionCentre(map) : null,
            },
        };
    }
    return { add, finish };
}
/** The reference report on frames already in memory (a still, or a few frames). */
export function referenceReport(frames, opts = {}) {
    const r = referenceReader({ ...opts, total: frames.length });
    for (const f of frames)
        r.add(f);
    return r.finish();
}
/** The build against the reference: every difference over its step, largest first, in words. */
export function compareReferences(ref, build) {
    const D = REFERENCE_DEFAULTS;
    const out = [];
    const notes = [];
    const f1 = (v) => v.toFixed(1);
    const pctOf = (v) => `${Math.round(v * 100)}%`;
    const list = (items, max = 4) => items.length <= max ? items.join("; ") : `${items.slice(0, max).join("; ")}; and ${items.length - max} more`;
    const byName = new Map(build.regions.map((r) => [r.name, r]));
    const pairsOf = ref.regions.flatMap((r) => (byName.has(r.name) ? [[r, byName.get(r.name)]] : []));
    // Cast: a* and b* moved together.
    const cast = pairsOf
        .map(([r, b]) => ({ name: r.name, da: b.colour.a - r.colour.a, db: b.colour.b - r.colour.b, r, b }))
        .map((c) => ({ ...c, d: Math.hypot(c.da, c.db) }))
        .filter((c) => c.d >= D.castStep)
        .sort((x, y) => y.d - x.d);
    if (cast.length) {
        const da = cast.reduce((s, c) => s + c.da, 0) / cast.length;
        const db = cast.reduce((s, c) => s + c.db, 0) / cast.length;
        const words = castWords(da, db) ?? "a different colour";
        out.push({
            measure: "cast",
            size: Math.round((cast[0].d / D.castStep) * 10) / 10,
            reading: `The build leans ${words} against the reference in ${cast.length} of ${pairsOf.length} regions (a* ${signed(da)}, b* ${signed(db)} on average, CIELAB): ` +
                list(cast.map((c) => `${c.name} a* ${f1(c.b.colour.a)} b* ${f1(c.b.colour.b)} against ${f1(c.r.colour.a)} ${f1(c.r.colour.b)}`)) +
                ".",
            reference: Object.fromEntries(cast.map((c) => [c.name, { a: c.r.colour.a, b: c.r.colour.b }])),
            build: Object.fromEntries(cast.map((c) => [c.name, { a: c.b.colour.a, b: c.b.colour.b }])),
        });
    }
    // Lightness.
    const light = pairsOf
        .map(([r, b]) => ({ name: r.name, d: b.colour.L - r.colour.L, r, b }))
        .filter((c) => Math.abs(c.d) >= D.lightnessStep)
        .sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
    if (light.length)
        out.push({
            measure: "lightness",
            size: Math.round((Math.abs(light[0].d) / D.lightnessStep) * 10) / 10,
            reading: `Lightness differs in ${light.length} of ${pairsOf.length} regions: ` +
                list(light.map((c) => `${c.name} ${c.d < 0 ? "darker" : "lighter"} (L* ${f1(c.b.colour.L)} against ${f1(c.r.colour.L)})`)) +
                ".",
        });
    // Sharpness and grain: ratios.
    const ratioItem = (measure, get, more, less, unit) => {
        const rows = pairsOf
            .map(([r, b]) => ({ name: r.name, rv: get(r), bv: get(b) }))
            .filter((c) => c.rv !== null && c.bv !== null && c.rv > 0 && c.bv > 0)
            .map((c) => ({ ...c, k: Math.log(c.bv / c.rv) / Math.log(D.ratioStep) }))
            .filter((c) => Math.abs(c.k) >= 1)
            .sort((x, y) => Math.abs(y.k) - Math.abs(x.k));
        if (!rows.length)
            return;
        const up = rows.filter((c) => c.k > 0);
        const down = rows.filter((c) => c.k < 0);
        const part = (rs, word) => rs.length ? `${word} in ${list(rs.map((c) => `${c.name} (${c.bv}${unit} against ${c.rv}${unit})`))}` : "";
        out.push({
            measure,
            size: Math.round(Math.abs(rows[0].k) * 10) / 10,
            reading: `The build is ${[part(up, more), part(down, less)].filter(Boolean).join("; and ")}.`,
        });
    };
    ratioItem("sharpness", (r) => r.sharpness.edgeWidth, "softer", "sharper", " px");
    ratioItem("grain", (r) => r.grain, "grainier", "smoother (less grain)", "");
    // Levels.
    const lv = [];
    let lvMax = 0;
    for (const [k, word] of [
        ["lumaBlack", "black point"],
        ["lumaWhite", "white point"],
        ["lumaMean", "mean level"],
    ]) {
        const d = build.levels[k] - ref.levels[k];
        if (Math.abs(d) < D.levelStep)
            continue;
        lvMax = Math.max(lvMax, Math.abs(d) / D.levelStep);
        lv.push(`${word} ${d > 0 ? "higher" : "lower"} (${build.levels[k].toFixed(3)} against ${ref.levels[k].toFixed(3)})`);
    }
    if (lv.length)
        out.push({ measure: "levels", size: Math.round(lvMax * 10) / 10, reading: `Levels: ${lv.join("; ")}.` });
    // The subject: the two motion maps lined up.
    let subject = null;
    if (ref.motion.subject && build.motion.subject) {
        const reg = registerMotionMaps(ref.motion.map, build.motion.map);
        if (reg) {
            const compared = reg.correlation >= D.sameFootage;
            subject = { ...reg, compared };
            const spreadSides = [ref, build].filter((r) => r.motion.spread);
            if (compared && spreadSides.length)
                notes.push(`The subject's size and place rest on spread frames (what differs between frames ${[...new Set(spreadSides.map((r) => (r.motion.spacing.step ? `${r.motion.spacing.step} apart` : "spaced unknown or unevenly")))].join(" and ")}${spreadSides.length === 2 ? " on both sides" : ` on the ${spreadSides[0] === ref ? "reference's" : "build's"} side`}, not motion), lined up at correlation ${reg.correlation}. Trusted from ${D.sameFootage}: on the round-two pair, every frame read 0.93 and 80 to 81%, every twentieth 0.68 to 0.71 and 81 to 82%.`);
            if (!compared)
                notes.push(`The moving parts of the two do not line up (correlation ${reg.correlation}): not the same footage, or not framed alike, so the subject's size and place are not compared.`);
            else {
                const k = Math.log(reg.scale) / Math.log(1 + D.sizeStep);
                if (Math.abs(k) >= 1)
                    out.push({
                        measure: "subject size",
                        size: Math.round(Math.abs(k) * 10) / 10,
                        reading: `The moving subject is ${pctOf(reg.scale)} of its size in the reference: ${reg.scale < 1 ? "smaller" : "larger"} in frame (the two lined up at correlation ${reg.correlation}).`,
                        reference: 1,
                        build: reg.scale,
                    });
                const dx = reg.to.x - reg.from.x;
                const dy = reg.to.y - reg.from.y;
                const dist = Math.hypot(dx, dy);
                if (dist >= D.placeStep)
                    out.push({
                        measure: "subject place",
                        size: Math.round((dist / D.placeStep) * 10) / 10,
                        reading: `The moving subject sits ${[Math.abs(dy) >= D.placeStep / 2 ? `${pctOf(Math.abs(dy))} of the height ${dy > 0 ? "lower" : "higher"}` : "", Math.abs(dx) >= D.placeStep / 2 ? `${pctOf(Math.abs(dx))} of the width ${dx > 0 ? "right" : "left"}` : ""].filter(Boolean).join(" and ")} than in the reference.`,
                    });
            }
        }
    }
    else if (ref.motion.subject || build.motion.subject)
        notes.push("Only one of the two has motion to read, so the subject is not compared.");
    // Where the weight sits.
    for (const [k, word] of [
        ["brightness", "brightness"],
        ["detail", "detail"],
    ]) {
        const dx = build.weight[k].x - ref.weight[k].x;
        const dy = build.weight[k].y - ref.weight[k].y;
        const dist = Math.hypot(dx, dy);
        if (dist >= D.placeStep)
            out.push({
                measure: `weight of ${word}`,
                size: Math.round((dist / D.placeStep) * 10) / 10,
                reading: `The centre of ${word} sits at ${pctOf(build.weight[k].x)} across, ${pctOf(build.weight[k].y)} down, against ${pctOf(ref.weight[k].x)}, ${pctOf(ref.weight[k].y)} in the reference.`,
            });
    }
    // Main colours the build lacks.
    const missing = ref.palette
        .filter((c) => c.share >= D.shareStep)
        .map((c) => {
        let best = Infinity;
        for (const b of build.palette)
            best = Math.min(best, Math.hypot(b.colour.L - c.colour.L, b.colour.a - c.colour.a, b.colour.b - c.colour.b));
        return { c, best };
    })
        .filter((m) => m.best >= D.colourMatch);
    if (missing.length)
        out.push({
            measure: "main colours",
            size: Math.round((Math.max(...missing.map((m) => m.best)) / D.colourMatch) * 10) / 10,
            reading: `Main colours of the reference with nothing within ${D.colourMatch} (CIELAB) among the build's: ${list(missing.map((m) => `${m.c.hex} (${pctOf(m.c.share)} of the reference, nearest ${f1(m.best)} away)`))}.`,
        });
    // Cuts and motion.
    if (ref.motion.consecutive && build.motion.consecutive) {
        const has = (cuts, f) => cuts.some((c) => Math.abs(c.frame - f) <= 1);
        const lost = ref.motion.cuts.filter((c) => !has(build.motion.cuts, c.frame));
        const extra = build.motion.cuts.filter((c) => !has(ref.motion.cuts, c.frame));
        if (lost.length || extra.length)
            out.push({
                measure: "cuts",
                size: 3 * (lost.length + extra.length),
                reading: [
                    lost.length ? `The reference cuts at ${lost.map((c) => `frame ${c.frame}`).join(", ")}; the build does not.` : "",
                    extra.length ? `The build cuts at ${extra.map((c) => `frame ${c.frame}`).join(", ")}; the reference does not.` : "",
                ]
                    .filter(Boolean)
                    .join(" "),
            });
        const rm = ref.motion.meanChange;
        const bm = build.motion.meanChange;
        if (rm && bm) {
            const k = Math.log(bm / rm) / Math.log(D.ratioStep);
            if (Math.abs(k) >= 1)
                out.push({
                    measure: "motion",
                    size: Math.round(Math.abs(k) * 10) / 10,
                    reading: `The build's picture moves ${k > 0 ? "more" : "less"} between frames: mean change ${bm.toFixed(4)} against ${rm.toFixed(4)}.`,
                });
        }
    }
    else
        notes.push(`Cuts and movement are not read on frames that are not neighbours (${[!ref.motion.consecutive ? "the reference's" : "", !build.motion.consecutive ? "the build's" : ""].filter(Boolean).join(" and ")}), so they are not compared.`);
    out.sort((a, b) => b.size - a.size);
    return {
        differences: out,
        subject,
        notes,
        reading: out.length
            ? `${out.length} difference${out.length > 1 ? "s" : ""}, largest first. ${out
                .slice(0, 3)
                .map((d) => d.reading)
                .join(" ")}`
            : "No difference over its step between the build and the reference.",
    };
}
//# sourceMappingURL=sheet.js.map
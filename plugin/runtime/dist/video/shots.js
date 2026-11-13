// The shot list of a video file (stage 13): cuts, one-frame swaps inside a shot, and the changes that are neither.
// Cuts follow the rules of a cut detector that worked on real reels (64 x 36 grey, the change against the median of the
// frames round it); swaps are found by region, since a one-frame swap of a small part of the frame, or between two dark
// pictures, moves no global score. Pure functions here; the runner decodes and writes the pictures.
export const SHOT_RULES = { cutMin: 12, ratio: 4, heldRatio: 3, around: 12, softMin: 10, softRatio: 8, softEvery: 4, swapMin: 10, swapBack: 0.35, flashShare: 0.7 };
const median = (a) => { if (!a.length)
    return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
/** Cuts, swaps and flashes from per-frame statistics (stats[i].change is frame i against frame i - 1). */
export function shotList(stats, rules = SHOT_RULES) {
    const n = stats.length, ch = stats.map((s) => s.change), out = { cuts: [], swaps: [], notCuts: [], shots: [] };
    const swapAt = new Set();
    // one-frame swaps: frame i differs from i - 1 and from i + 1, while i + 1 is back to i - 1 (whole frame, or one region)
    for (let i = 1; i + 1 < n; i++) {
        const a = stats[i], b = stats[i + 1];
        if (a.change >= rules.swapMin && b.change >= rules.swapMin && b.back < rules.swapBack * Math.min(a.change, b.change)) {
            swapAt.add(i);
            out.swaps.push({ frame: a.index, time: a.time, change: Math.round(a.change * 10) / 10, region: null });
            continue;
        }
        for (let r = 0; r < a.regions.length; r++) {
            const ra = a.regions[r], rb = b.regions[r];
            const loc = median(stats.slice(Math.max(1, i - rules.around), Math.min(n, i + rules.around + 1)).map((s) => s.regions[r]));
            if (ra >= Math.max(rules.swapMin * 2, 4 * loc) && rb >= Math.max(rules.swapMin * 2, 4 * loc) && b.regionsBack[r] < rules.swapBack * Math.min(ra, rb)) {
                swapAt.add(i);
                out.swaps.push({ frame: a.index, time: a.time, change: Math.round(ra * 10) / 10, region: r });
                break;
            }
        }
    }
    for (let i = 1; i < n; i++) {
        if (swapAt.has(i) || swapAt.has(i - 1))
            continue;
        const nb = [...ch.slice(Math.max(1, i - rules.around), i), ...ch.slice(i + 1, Math.min(n, i + rules.around + 1))];
        const med = median(nb), held = nb.filter((x) => x < 1).length > 0.6 * nb.length;
        const hard = ch[i] >= rules.cutMin && ch[i] >= (held ? rules.heldRatio : rules.ratio) * Math.max(med, 0.5);
        const soft = !hard && ch[i] >= rules.softMin && ch[i] >= rules.softRatio * Math.max(med, 0.5) && ch[i] >= rules.softEvery * Math.max(ch[i - 1], i + 1 < n ? ch[i + 1] : 0);
        if (!hard && !soft)
            continue;
        if (stats[i].shiftShare >= rules.flashShare) {
            out.notCuts.push({ frame: stats[i].index, time: stats[i].time, kind: "flash", change: Math.round(ch[i] * 10) / 10 });
            continue;
        }
        const last = out.cuts[out.cuts.length - 1];
        if (last && stats[i].index - last.frame <= 3) {
            if (ch[i] > last.change)
                Object.assign(last, { frame: stats[i].index, time: stats[i].time, change: Math.round(ch[i] * 10) / 10 });
            continue;
        }
        out.cuts.push({ frame: stats[i].index, time: stats[i].time, change: Math.round(ch[i] * 10) / 10, ...(soft ? { soft: true } : {}) });
    }
    let from = stats[0]?.index ?? 0, start = stats[0]?.time ?? 0;
    for (const c of out.cuts) {
        const k = stats.findIndex((s) => s.index === c.frame);
        out.shots.push({ from, to: c.frame - 1, start, end: stats[k - 1]?.time ?? c.time });
        from = c.frame;
        start = c.time;
    }
    if (n)
        out.shots.push({ from, to: stats[n - 1].index, start, end: stats[n - 1].time });
    return out;
}
/** Statistics of frame c against b (the frame before) and a (two before); grey images w x h, split into a 4 x 4 grid. */
export function frameStats(index, time, a, b, c, w, h) {
    const grid = 4, regions = Array(grid * grid).fill(0), regionsBack = Array(grid * grid).fill(0), counts = Array(grid * grid).fill(0);
    let change = 0, back = 0, mean = 0;
    if (b)
        for (let i = 0; i < c.length; i++)
            mean += c[i] - b[i];
    mean = b ? mean / c.length : 0;
    let resid = 0;
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            const i = y * w + x, r = Math.min(grid - 1, Math.floor((y * grid) / h)) * grid + Math.min(grid - 1, Math.floor((x * grid) / w));
            const d = b ? Math.abs(c[i] - b[i]) : 0, e = a ? Math.abs(c[i] - a[i]) : 0;
            change += d;
            back += e;
            regions[r] += d;
            regionsBack[r] += e;
            counts[r]++;
            if (b)
                resid += Math.abs(c[i] - b[i] - mean);
        }
    const N = w * h;
    return { index, time, change: change / N, back: a ? back / N : Infinity, regions: regions.map((v, r) => v / counts[r]), regionsBack: regionsBack.map((v, r) => (a ? v / counts[r] : Infinity)),
        shiftShare: change > 0 ? Math.max(0, 1 - resid / change) : 0 };
}
//# sourceMappingURL=shots.js.map
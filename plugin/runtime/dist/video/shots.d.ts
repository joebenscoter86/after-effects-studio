export interface ShotRules {
    /** A cut: change at least `cutMin` and at least `ratio` times the median of `around` frames each side. */
    cutMin: number;
    ratio: number;
    heldRatio: number;
    around: number;
    /** A soft cut: at least `softMin`, `softRatio` times the median, and `softEvery` times every neighbour. */
    softMin: number;
    softRatio: number;
    softEvery: number;
    /** A one-frame swap: the frame differs from both neighbours by `swapMin` or more while they differ by under `swapBack` of that. */
    swapMin: number;
    swapBack: number;
    /** A flash: the change is mostly brightness (a uniform shift), not a different picture. */
    flashShare: number;
    /** Not a cut: the frame registers on the one before under some whole-frame shift with at least this score
     * (normalised cross-correlation over the overlap) and that shift leaves at most sameResidual of the change: the same
     * picture, panned. Chosen on drawn clips: pans scored 0.875 to 1.0 with a residual up to 0.34; cuts 0.19 to 0.795,
     * with a residual from 0.47. */
    sameScore: number;
    sameResidual: number;
}
export declare const SHOT_RULES: ShotRules;
export interface Shift {
    /** b(x, y) is a(x - dx, y - dy): the picture moved by (dx, dy) grid pixels from a to b. */
    dx: number;
    dy: number;
    /** Normalised cross-correlation over the overlap (-1..1), and the overlap's share of the frame. */
    score: number;
    overlap: number;
    /** Mean absolute difference over the overlap at this shift, as a share of the difference at no shift. */
    residual: number;
}
/**
 * The whole-frame shift that best takes frame a onto frame b (grey, w x h), every shift up to maxDx and maxDy, scored by
 * normalised cross-correlation over the overlap only (at least minOverlap of the frame). Two frames of one picture panned
 * fast match well at some shift; two different pictures match at none. near: search only round a shift (coarse to fine).
 */
export declare function registerShift(a: ArrayLike<number>, b: ArrayLike<number>, w: number, h: number, o?: {
    maxDx?: number;
    maxDy?: number;
    minOverlap?: number;
    near?: {
        dx: number;
        dy: number;
        r: number;
    };
}): Shift | null;
export interface FrameStats {
    index: number;
    time: number;
    /** Mean absolute change against the frame before (0..255), over the whole frame and per region of a 4 x 4 grid. */
    change: number;
    regions: number[];
    /** Change against the frame two before (whole frame and per region): a swap returns to it. */
    back: number;
    regionsBack: number[];
    /** Of the change, the part a single brightness shift explains (0..1): near 1 for a flash. */
    shiftShare: number;
}
export interface ShotList {
    cuts: Array<{
        frame: number;
        time: number;
        change: number;
        soft?: boolean;
    }>;
    swaps: Array<{
        frame: number;
        time: number;
        change: number;
        region: number | null;
    }>;
    notCuts: Array<{
        frame: number;
        time: number;
        kind: "flash" | "pan" | "motion";
        change: number;
        shift?: {
            dx: number;
            dy: number;
            score: number;
        };
    }>;
    shots: Array<{
        from: number;
        to: number;
        start: number;
        end: number;
    }>;
}
/**
 * Cuts, swaps and flashes from per-frame statistics (stats[i].change is frame i against frame i - 1). register(i), when
 * given, registers frame i on frame i - 1: a candidate that registers is the same picture, a pan (or a fast move inside
 * it, at no shift), listed under notCuts, not a cut.
 */
export declare function shotList(stats: FrameStats[], rules?: ShotRules, register?: (i: number) => Shift | null): ShotList;
/** Statistics of frame c against b (the frame before) and a (two before); grey images w x h, split into a 4 x 4 grid. */
export declare function frameStats(index: number, time: number, a: Uint8Array | null, b: Uint8Array | null, c: Uint8Array, w: number, h: number): FrameStats;
//# sourceMappingURL=shots.d.ts.map
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
}
export declare const SHOT_RULES: ShotRules;
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
        kind: "flash";
        change: number;
    }>;
    shots: Array<{
        from: number;
        to: number;
        start: number;
        end: number;
    }>;
}
/** Cuts, swaps and flashes from per-frame statistics (stats[i].change is frame i against frame i - 1). */
export declare function shotList(stats: FrameStats[], rules?: ShotRules): ShotList;
/** Statistics of frame c against b (the frame before) and a (two before); grey images w x h, split into a 4 x 4 grid. */
export declare function frameStats(index: number, time: number, a: Uint8Array | null, b: Uint8Array | null, c: Uint8Array, w: number, h: number): FrameStats;
//# sourceMappingURL=shots.d.ts.map
export interface InkMask {
    /** Luma (0.299 r + 0.587 g + 0.114 b) within [lo, hi]. */
    luma?: [number, number];
    /** The smallest of r, g, b within [lo, hi] (white ink on colour). */
    minChannel?: [number, number];
    /** Hue in degrees within [from, to] (wrapping when from > to), with saturation and value (0..1) over these. */
    hue?: [number, number];
    minSat?: number;
    minVal?: number;
    /** Within tol (each channel) of this colour. */
    rgb?: [number, number, number];
    tol?: number;
    /** Differs from the empty frame (filled by the caller) by more than tol on some channel. */
    empty?: number;
}
export interface InkFrame {
    count: number;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    cx: number;
    cy: number;
    level: number;
}
export declare function luma(r: number, g: number, b: number): number;
/** Whether a pixel is ink. emptyPx: the empty frame's pixel (for the difference mask). */
export declare function isInk(m: InkMask, r: number, g: number, b: number, emptyPx?: [number, number, number]): boolean;
/**
 * One frame's ink (rgb24, w x h, the box at scale k of the source): its bounding box over rows and columns holding at
 * least minCount ink pixels, centroid, area and the box's mean luma, in source pixels (offset ox, oy). count 0: empty.
 */
export declare function inkOf(rgb: Uint8Array, w: number, h: number, m: InkMask, o: {
    k: number;
    ox: number;
    oy: number;
    minCount?: number;
    empty?: Uint8Array;
}): InkFrame;
/** Curves the ink measure can fit, each one value (or two for the centroid) per frame. */
export declare const INK_CURVES: readonly ["centroid", "x0", "x1", "y0", "y1", "width", "height", "size", "level"];
export type InkCurve = (typeof INK_CURVES)[number];
export declare function inkValue(f: InkFrame, c: InkCurve): number[] | null;
/** What a curve is like, for pairing with the match's channels and for the units. */
export declare function inkLike(c: InkCurve): {
    like: "position" | "scale" | "opacity";
    axis?: 0 | 1;
    unit: string;
};
/**
 * The witness: per frame, how many pixels of the box changed by more than 10 levels since the frame before; the runs
 * of frames that change beyond the box's own noise (three times its median, at least 0.05 % of the box), joined
 * across gaps of up to two frames but never across a break (a cut). A run is given as the last frame unchanged and the last frame that changed.
 */
export declare function witnessRuns(counts: number[], pixels: number, breaks?: Set<number>): {
    runs: Array<{
        from: number;
        to: number;
    }>;
    threshold: number;
    ground: "still" | "moving";
};
//# sourceMappingURL=ink.d.ts.map
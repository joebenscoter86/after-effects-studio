/** In-place radix-2 FFT of (re, im), length a power of two; inverse when inv. */
export declare function fft(re: Float64Array, im: Float64Array, inv?: boolean): void;
/** Resample a grey image to a new size (bilinear). */
export declare function resize(src: Float64Array, w: number, h: number, nw: number, nh: number): Float64Array;
export interface Match {
    x: number;
    y: number;
    scale: number;
    ncc: number;
    opacity: number;
}
/**
 * Best match of template t (tw x th) in frame f (fw x fh) over scales, by normalised cross-correlation. x, y: the
 * matched window's centre in frame pixels (sub-pixel); scale: of the template; opacity: the window's regression slope on
 * the (scaled) template, clamped 0..1.5. near: limit the search to a box round a point (x, y, radius).
 */
export declare function matchTemplate(f: Float64Array, fw: number, fh: number, t: Float64Array, tw: number, th: number, scales: number[], near?: {
    x: number;
    y: number;
    r: number;
}): Match | null;
/** Scales round s: a geometric set from lo to hi in n steps. */
export declare function scaleSet(lo: number, hi: number, n: number): number[];
/** Refine a scale by a parabola through the scores at s / k, s and s * k. */
export declare function refineScale(f: Float64Array, fw: number, fh: number, t: Float64Array, tw: number, th: number, m: Match, k?: number): Match;
//# sourceMappingURL=track.d.ts.map
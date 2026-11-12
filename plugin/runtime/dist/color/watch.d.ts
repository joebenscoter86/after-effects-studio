import type { Box } from "./matte.js";
import { type DiffThresholds } from "./motion.js";
export interface WatchThresholds extends Omit<DiffThresholds, "amplify"> {
    /** A run of pairs with no visible change is reported as frozen when it lasts at least this long, seconds. */
    frozenSeconds: number;
    /** A pair shows no visible change when at most this share of pixels changed by more than changeAbove. */
    frozenShare: number;
    /** A pixel is near-black when its brightest channel is at or below this. */
    darkBelow: number;
    /** A pixel is near-white when its darkest channel is at or above this. */
    lightAbove: number;
    /** A frame is near-black when at least this share of its pixels is near-black ... */
    blackShare: number;
    /** ... or its mean luma is at or below this. */
    blackMean: number;
    /** A frame is near-white when at least this share of its pixels is near-white ... */
    whiteShare: number;
    /** ... or its mean luma is at or above this. */
    whiteMean: number;
    /** A frame is clipped high when at least this share of its pixels is at the top code in all three channels. */
    clipHighShare: number;
    /** The same at the bottom code; null (the default) measures it but never flags it. */
    clipLowShare: number | null;
}
export type WatchThresholdArgs = Partial<WatchThresholds>;
/**
 * Why these values (the diff ones are motion.ts DIFF_DEFAULTS, reasons there):
 * - frozenSeconds 0.5: fifteen frames at 30 fps. A viewer notices motion
 *   stopping well inside half a second; a two- or three-frame hold is a
 *   stutter (flagged on its own), not a freeze.
 * - frozenShare 0.00002: two pixels in 100,000 (about three at 270x480): no
 *   pixel visibly changed, allowing a couple of noisy pixels. Grain stays
 *   below changeAbove (0.04), so a grainy still reads as frozen, which it is
 *   to a viewer.
 * - darkBelow 0.04 / lightAbove 0.96: ten 8-bit steps from black or white.
 * - blackShare / whiteShare 0.99: the whole frame, give or take a small
 *   element (a 2% white title on black is not a black frame).
 * - blackMean 0.01 / whiteMean 0.99: two to three 8-bit steps from black or
 *   white on average, whatever the pixels are.
 * - clipHighShare 0.005: half a percent of the frame (about 10,000 pixels at
 *   1080x1920, a 100 px square) at 255 in all three channels: a blown
 *   highlight a viewer sees as a flat white patch. Pure white graphics are at
 *   the top code by design; the box says where, the reader judges.
 * - clipLowShare null: a pure black background is at the bottom code
 *   everywhere by design; set it (for footage) to flag crushed blacks.
 */
export declare const WATCH_DEFAULTS: WatchThresholds;
export declare function resolveWatchThresholds(args?: WatchThresholdArgs): WatchThresholds;
/** Null when the threshold object is acceptable, else what is wrong with it. */
export declare function watchArgsError(args: Record<string, unknown>): string | null;
/** A display value at or above this is the 8-bit top code (255). */
export declare const TOP_CODE: number;
/** A display value at or below this is the 8-bit bottom code (0). */
export declare const BOTTOM_CODE: number;
export interface ClipStats {
    /** Share of pixels at the code, per channel. */
    r: number;
    g: number;
    b: number;
    /** Share of pixels at the code in all three channels (clipped to white, or to black). */
    all: number;
    /** The box around the pixels at the code in all three channels, measured pixels; null when none. */
    box: Box | null;
}
export interface FrameMeasure {
    /** Mean of Rec. 709 luma (0.2126 r + 0.7152 g + 0.0722 b) of the display values. */
    meanLuma: number;
    /** Share of pixels whose brightest channel is at or below darkBelow. */
    darkShare: number;
    /** Share of pixels whose darkest channel is at or above lightAbove. */
    lightShare: number;
    clipHigh: ClipStats;
    clipLow: ClipStats;
}
/** One pass over a picture: brightness, near-black / near-white shares, clipping. */
export declare function measureFrame(pic: Float32Array, width: number, height: number, t: Pick<WatchThresholds, "darkBelow" | "lightAbove">): FrameMeasure;
export interface WatchFrame {
    /** Frame number, counted from the comp's first frame (0). */
    frame: number;
    /** Display values 0..1, RGB per pixel, width × height. */
    pic: Float32Array;
    width: number;
    height: number;
}
export interface FramePoint {
    frame: number;
    /** Seconds from the comp's start: frame × frame duration. */
    time: number;
}
export type MomentKind = "pop" | "cut" | "stutter" | "repeat";
export interface MomentFlag {
    kind: MomentKind;
    /** pop: the frame that differs from both neighbours; cut: the first frame after it; stutter / repeat: the frame that repeats the one before. */
    frame: number;
    time: number;
    /** cut: the frame before it. */
    fromFrame?: number;
    change: number;
    reference: number;
    ratio: number;
    /** Where the picture changed (comp pixels): the pair into the flagged frame. */
    box?: Box | null;
    atSeriesEdge?: boolean;
    besideRepeat?: boolean;
    reading: string;
}
export type StretchKind = "frozen" | "near-black" | "near-white" | "clipped-high" | "clipped-low";
export interface Stretch {
    kind: StretchKind;
    /** The first and last checked frame of the stretch. */
    from: FramePoint;
    to: FramePoint;
    /** to − from + 1. */
    frames: number;
    /** frames × frame duration. */
    seconds: number;
    /** With every above 1: the stretch may run up to this many frames further at each end. */
    uncertainFrames?: number;
    /** Begins at the first frame this call checked, or ends at its last, while the range goes on. */
    openStart?: boolean;
    openEnd?: boolean;
    /** The frame that reads furthest past the threshold, and its numbers. */
    worst?: {
        frame: number;
        time: number;
        share?: number;
        meanLuma?: number;
        channels?: Rgb3;
    };
    /** frozen: the largest change of any pair in the stretch. */
    largestChange?: number;
    /** clipped: the box around the clipped pixels over the whole stretch, comp pixels. */
    box?: Box | null;
    reading: string;
}
type Rgb3 = {
    r: number;
    g: number;
    b: number;
};
export interface PieceFindings {
    step: number;
    /** Owned frames measured. */
    framesChecked: number;
    /** Pairs compared (owned or not). */
    pairs: number;
    /** All flags found in the owned frames, sorted by time. */
    flags: MomentFlag[];
    stretches: Stretch[];
    /** Over the owned frames: the extremes, so a clean report still says what was seen. */
    extremes: {
        meanLuma: {
            min: number;
            max: number;
        };
        clipHighAll: {
            max: number;
            frame: number | null;
        };
        clipLowAll: {
            max: number;
            frame: number | null;
        };
        pairChange: {
            median: number;
            max: number;
        };
    } | null;
    notes: string[];
}
export interface PieceOptions {
    thresholds: WatchThresholds;
    frameDuration: number;
    /** Frames between checked frames (1 = every frame). */
    every: number;
    /** Comp pixels per measured pixel (the capture's reduction), for boxes. */
    scale: number;
    /** The frames this call reports on; frames outside are context for the comparison. Default: all. */
    owned?: {
        from: number;
        to: number;
    };
    /** The range starts before / goes on after the frames this watcher sees. */
    openStart?: boolean;
    openEnd?: boolean;
}
export declare class PieceWatcher {
    private readonly t;
    private readonly o;
    private prev;
    private readonly frames;
    /** Pairs, split where a frame is missing or the size changes. */
    private readonly segments;
    private gaps;
    measureMs: number;
    constructor(opts: PieceOptions);
    /** Measure one frame (frames must arrive in increasing order) and keep only what the report needs. */
    add(f: WatchFrame): void;
    private point;
    private ownedFrame;
    private scaleBox;
    finish(): PieceFindings;
    private spansOwned;
    private momentOf;
    private edges;
    private frozenStretches;
    /** Runs of consecutive checked frames whose `score` is not null; the worst is the highest score. */
    private frameStretches;
}
export {};
//# sourceMappingURL=watch.d.ts.map
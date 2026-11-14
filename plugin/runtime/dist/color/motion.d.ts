import type { Box } from "./matte.js";
import type { DecodedPng } from "./png16.js";
import { type RegionSpec } from "./sheet.js";
export interface DiffThresholds {
    /** A pixel has changed when one of its channels moved by more than this (display values 0..1). */
    changeAbove: number;
    /** A pair is a spike when its change is at least this many times its neighbours' on each side. */
    spikeRatio: number;
    /** A pair is a hold (a repeated frame) when its change is at most this share of its neighbours'. */
    holdRatio: number;
    /** Mean changes below this read as no visible change; also the least reference a spike is measured against. */
    quietBelow: number;
    /** Neighbours count as moving (for a stutter), and a spike counts, only when at least this share of pixels changed. */
    movingShare: number;
    /** How many pairs on each side are a pair's neighbours. */
    window: number;
    /** Gain of the difference images on the diff sheet. */
    amplify: number;
    /**
     * A pair whose change is at most this is a repeated frame (identical
     * pictures read 0). Repeats are never used as a reference for other pairs.
     */
    repeatBelow: number;
}
export type DiffThresholdArgs = Partial<DiffThresholds>;
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
 * - repeatBelow 0.0001: a repeated frame reads exactly 0 (measured live: ten
 *   pairs from rounded times, all 0); 0.0001 is a fortieth of an 8-bit step
 *   on average, far below any grain, so only a repeat (or a frame differing
 *   in a few pixels) is below it. A repeat beside a pair would otherwise be
 *   that pair's reference and make an ordinary change read as a cut.
 */
export declare const DIFF_DEFAULTS: DiffThresholds;
export declare function resolveDiffThresholds(args?: DiffThresholdArgs): DiffThresholds;
/** Null when the threshold object is acceptable, else what is wrong with it. */
export declare function diffArgsError(args: Record<string, unknown>): string | null;
/**
 * The picture a pair is compared on: RGB 0..1 per pixel. `straight` is true
 * only for an rgba file this call wrote (straight colour): its colour is
 * weighted by alpha. A raw capture's alpha is ignored: its RGB is already over
 * the comp background.
 */
export declare function pictureOf(img: DecodedPng, straight: boolean): Float32Array;
export interface PictureChangeStats {
    pixels: number;
    /** Mean over pixels of the mean over r, g, b of |Δ|: display values 0..1. */
    change: number;
    /** Largest single-channel |Δ|. */
    maxAbsDelta: number;
    /** Pixels where a channel changed by more than changeAbove. */
    changedPixels: number;
    changedShare: number;
    /** The box around the changed pixels, capture pixels; null when none changed. */
    changedBounds: Box | null;
}
export type RegionChange = ({
    name: string;
} & PictureChangeStats) | {
    name: string;
    error: string;
};
export interface PictureChangeResult {
    all: PictureChangeStats;
    regions?: RegionChange[];
    /** Grey thumbnail of the change, thumb.width × thumb.height, amplified and clipped to 0..1. */
    thumb?: Float64Array;
}
/** How one picture changed into the next, whole frame and per region. */
export declare function pictureChange(prev: Float32Array, cur: Float32Array, width: number, height: number, t: DiffThresholds, opts?: {
    regions?: RegionSpec[];
    thumb?: {
        width: number;
        height: number;
    };
}): PictureChangeResult;
export interface FrameRef {
    index: number;
    time: number | undefined;
}
export interface SeriesPair {
    from: FrameRef;
    to: FrameRef;
    change: number;
    changedShare: number;
}
export type FlagKind = "pop" | "stutter" | "cut" | "repeat";
export interface SeriesFlag {
    kind: FlagKind;
    /** Indices into `pairs`. */
    pairs: number[];
    /** pop: the frame that differs from both neighbours; stutter: the frame that repeats the one before. */
    frame?: FrameRef;
    /** cut: the frames on either side. */
    between?: [FrameRef, FrameRef];
    change: number;
    /** The neighbours' change it stands out from (the smaller side for a spike). */
    reference: number;
    ratio: number;
    /** The pair is the first or last of the series, so only one side could be compared. */
    atSeriesEdge?: boolean;
    /** cut / pop: a repeated frame is among the neighbours; it was left out of the reference. */
    besideRepeat?: boolean;
    /**
     * stutter / repeat: the pairs next to the repeated frame. Their change is
     * measured across a repeat (the one after spans two frames' motion), so
     * read them with care.
     */
    unreliablePairs?: number[];
    reading: string;
}
export interface SeriesSummary {
    pairs: number;
    median: number;
    mean: number;
    largest: {
        pair: number;
        change: number;
    };
    smallest: {
        pair: number;
        change: number;
    };
    flags: SeriesFlag[];
    reading: string;
}
/**
 * Median, extremes and the pairs that stand out. A spike stands out from the
 * neighbours on every side it has (so a move starting from rest is not a cut),
 * by spikeRatio over the median of up to `window` pairs on that side; a pair
 * is looked at a second time with the spikes already found left out of its
 * neighbours, so a smaller jump beside a larger one is still reported:
 * two spikes in a row are a one-frame pop of the frame they share, a lone
 * spike is a cut (or a jump). A hold — a pair that barely changes while the
 * neighbours on both sides move — is a stutter: a repeated frame. Spikes are
 * left out of a hold's neighbours, so the pair beside a pop is not a stutter.
 * Repeated frames (change ≤ repeatBelow) are left out of every reference (a 0
 * beside a pair would make an ordinary change read as a cut); a repeat at the
 * start or end of the series beside motion is flagged `repeat`, and stutters
 * and repeats name the pairs beside them as unreliable.
 */
export declare function summarizeSeries(pairs: SeriesPair[], t: DiffThresholds): SeriesSummary;
/** Mean absolute change of luma per cell over the pairs counted, row-major. */
export interface MotionMap {
    width: number;
    height: number;
    /** The cell's size in frame pixels. */
    cell: number;
    values: number[];
}
/** Luma averaged over cells of `cell` px: the picture a motion map is built from. */
export declare function cellLuma(img: DecodedPng, cell: number): Float32Array;
/** Centre and spread of what moves, as shares of the frame's width and height; null when nothing does. */
export declare function motionCentre(m: MotionMap): {
    x: number;
    y: number;
    spreadX: number;
    spreadY: number;
} | null;
export interface MotionRegistration {
    /** The build's moving parts are this many times their size in the reference. */
    scale: number;
    /** Where the reference's centre of motion lands in the build, as shares of the frame. */
    from: {
        x: number;
        y: number;
    };
    to: {
        x: number;
        y: number;
    };
    /** Correlation of the two maps once lined up (1 is the same pattern). */
    correlation: number;
}
/**
 * Line the build's motion map up with the reference's: the scale (0.5 to 1.6)
 * and shift that best match the two patterns of change, searched round their
 * centres of motion. Two cuts of the same take move the same way, so the
 * scale is how much bigger or smaller the moving subject is; on different
 * footage the correlation stays low.
 */
export declare function registerMotionMaps(ref: MotionMap, build: MotionMap): MotionRegistration | null;
/**
 * Starting points, not measured judgments:
 * - restBelow 0.02: a frame moving under 2% of the property's top speed is at rest.
 * - noEaseAbove 0.6: a move whose first (or last) moving frame already runs at
 *   60% of its middle speed starts (or stops) with no ease; an ease of any
 *   length starts near 0 (an easy ease's first frame of 30 runs at about 7%).
 * - jumpRatio 2.5 and jumpShare 0.25: inside a move, speed changing 2.5 times
 *   from one frame to the next and by a quarter of the move's top speed.
 * - settleWithin 0.01: within 1% of the move's distance of where it ends is settled.
 * - joinGap 2: moves at rest for 2 frames or fewer are one move (an overshoot
 *   turns back through zero speed).
 */
export declare const CURVE_DEFAULTS: {
    restBelow: number;
    noEaseAbove: number;
    jumpRatio: number;
    jumpShare: number;
    settleWithin: number;
    joinGap: number;
};
export interface CurveSample {
    frame: number;
    time: number;
    value: number[];
}
export interface CurveMove {
    /** The last frame at rest before the move, and the first at rest after it. */
    from: number;
    to: number;
    distance: number;
    /** Units a second. */
    peakSpeed: number;
    peakFrame: number;
    startEase: "eased" | "none";
    endEase: "eased" | "none";
    /** Past where it ends, along the way it moved: units and share of the distance. */
    overshoot: {
        amount: number;
        share: number;
        frame: number;
    } | null;
    /** Frames from first reaching the end value to staying within settleWithin of it. */
    settle: {
        frames: number;
        from: number;
        at: number;
    } | null;
}
export interface CurveFlag {
    kind: "no ease" | "speed jump" | "overshoot";
    frames: number[];
    reading: string;
}
export interface CurveReport {
    frames: Array<CurveSample & {
        speed: number;
    }>;
    moves: CurveMove[];
    flags: CurveFlag[];
    reading: string;
}
/** Speed per frame, the moves, and flags for a move with no ease, a jump in speed, and overshoot with its settle. */
export declare function analyzeCurve(samples: CurveSample[], fps: number, opts?: Partial<typeof CURVE_DEFAULTS>): CurveReport;
/** A small graph of the curve: each value channel scaled to its range (light), speed (orange), moves shaded, flags in red. */
export declare function curveGraph(r: CurveReport, size?: {
    width: number;
    height: number;
}): {
    width: number;
    height: number;
    rgb: Float64Array;
};
/**
 * Frames where loudness (Convert Audio to Keyframes' amplitude per frame)
 * rises past `share` of the way from its median to its top, at least `gap`
 * frames after the last. On three tone bursts at 0.5, 1.2 and 2.0 s it read
 * frames 15, 36 and 60.
 */
export declare function soundOnsets(values: number[], fps: number, opts?: {
    share?: number;
    gap?: number;
}): Array<{
    frame: number;
    time: number;
    level: number;
}>;
/** Word or beat times from a timing file: a JSON list ({ word|w|text|label, start|time|t seconds, or frame }) or CSV (time,label). */
export declare function parseTiming(text: string, fps: number): Array<{
    time: number;
    label: string;
}>;
/**
 * Where picture meets sound: the detectability thresholds in ITU-R BT.1359
 * are sound 45 ms early and 125 ms late against the picture; at 30 fps, a
 * picture event 2 frames after its sound, or 4 frames before it, is flagged.
 */
export declare const SYNC_DEFAULTS: {
    lateFrames: number;
    earlyFrames: number;
};
export interface SyncEvent {
    name: string;
    time: number;
    frames: number;
    marker: {
        time: number;
        label: string;
    } | null;
}
/** Each event's distance in frames to the nearest marker; late (after the marker) and early (before) beyond the limits are flagged. */
export declare function syncReport(events: Array<{
    name: string;
    time: number;
}>, markers: Array<{
    time: number;
    label: string;
}>, fps: number, opts?: Partial<typeof SYNC_DEFAULTS>): {
    events: SyncEvent[];
    flags: Array<SyncEvent & {
        reading: string;
    }>;
    reading: string;
};
//# sourceMappingURL=motion.d.ts.map
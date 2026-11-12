import { type MotionMap, type MotionRegistration } from "./motion.js";
import type { DecodedPng } from "./png16.js";
export type Rgb = [number, number, number];
export interface EdgeBand {
    /** Rows (top/bottom) or columns (left/right) of one uniform color at that edge. */
    width: number;
    /** transparent = alpha 0 all along the band; color = one opaque color; none = no uniform band. */
    kind: "transparent" | "color" | "none";
    color: Rgb | null;
}
export interface FrameAnalysis {
    width: number;
    height: number;
    /** Mean of the capture's RGB (before any color conversion). */
    meanRgb: Rgb;
    /** True when every pixel is one color (an empty or fully covered frame). */
    uniform: boolean;
    /** What "nothing" looks like in this frame: alpha 0 when there is alpha, else the corner color. */
    background: {
        kind: "transparent" | "color";
        color: Rgb | null;
    };
    /** Bounding box of every pixel that is not background, or null when the frame is all background. */
    contentBounds: {
        left: number;
        top: number;
        width: number;
        height: number;
    } | null;
    /** Fraction (0..1) of pixels that are not background. */
    coverage: number;
    edges: {
        top: EdgeBand;
        bottom: EdgeBand;
        left: EdgeBand;
        right: EdgeBand;
    };
}
/** Measure a capture. Works on the raw decode so alpha is still there. */
export declare function analyzeFrame(img: DecodedPng): FrameAnalysis;
/** The checkerboard drawn behind transparency: mid greys, so black and white both read. */
export declare const CHECKERBOARD: {
    size: number;
    light: Rgb;
    dark: Rgb;
};
export type Backdrop = {
    kind: "color";
    color: Rgb;
} | {
    kind: "checkerboard";
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
export declare function unmatte(img: DecodedPng, bg: Rgb): Float64Array;
/**
 * Composite straight (unassociated) colour over a backdrop:
 * out = rgb·a + backdrop·(1 − a). Returns a new RGB buffer; an image without
 * alpha comes back as an unchanged copy. A raw capture is not straight (see
 * unmatte): take its comp background out first.
 */
export declare function flattenOver(img: DecodedPng, backdrop: Backdrop): Float64Array;
/** A named point (no width/height: one pixel) or rectangle, in capture pixels. */
export interface RegionSpec {
    name: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
}
export interface PixelRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface AlphaStats {
    mean: number;
    min: number;
    max: number;
    /** Shares (0..1) of the region's pixels that are fully opaque, partly covered, fully transparent. */
    opaqueShare: number;
    partialShare: number;
    transparentShare: number;
}
export interface RegionStats {
    name: string;
    /** The rectangle actually measured, after clipping to the frame. */
    rect: PixelRect;
    clipped: boolean;
    pixels: number;
    /** Per channel [r, g, b], 0..1, rounded to 4 decimals. */
    mean: Rgb;
    min: Rgb;
    max: Rgb;
    /** Null when the image has no alpha channel. */
    alpha: AlphaStats | null;
}
export interface RegionError {
    name: string;
    error: string;
}
/** Clip a region to the frame; null when nothing of it is inside. */
export declare function clipRegion(img: {
    width: number;
    height: number;
}, region: RegionSpec): {
    rect: PixelRect;
    clipped: boolean;
} | null;
/** Mean, minimum and maximum per channel, and alpha coverage, for each region. */
export declare function sampleRegions(img: DecodedPng, regions: RegionSpec[]): Array<RegionStats | RegionError>;
export interface FrameHistogram {
    bins: number;
    pixels: number;
    /** Pixel counts per bin, bin i covering [i/bins, (i+1)/bins); 1.0 lands in the last bin. */
    r: number[];
    g: number[];
    b: number[];
    /** Present only when the image has an alpha channel. */
    a?: number[];
}
/** Whole-frame per-channel histogram with `bins` equal-width bins over 0..1. */
export declare function histogramOf(img: DecodedPng, bins: number): FrameHistogram;
export interface RegionDiff {
    name: string;
    rect: PixelRect;
    clipped: boolean;
    pixels: number;
    /** Mean of (to − from) per channel: the region's average shift, signed. */
    meanDelta: Rgb;
    /** Mean of |to − from| per channel: how much its pixels changed. */
    meanAbsDelta: Rgb;
    maxAbsDelta: Rgb;
    /** Null unless both frames have an alpha channel. */
    alpha: {
        meanDelta: number;
        meanAbsDelta: number;
        maxAbsDelta: number;
    } | null;
}
/** Per-region differences between two frames of the same size, `to` minus `from`. */
export declare function compareRegions(from: DecodedPng, to: DecodedPng, regions: RegionSpec[]): Array<RegionDiff | RegionError>;
/** "#rrggbb" for an RGB triple in 0..1, as an 8-bit file stores it. */
export declare function rgbHex(rgb: Rgb): string;
export interface SheetOptions {
    /** Tiles per row (default: ceil(sqrt(n))). */
    columns?: number;
    /** Width of each tile in px; frames are never upscaled (default 480). */
    thumbWidth?: number;
    /** One label per frame, drawn above its tile. */
    labels?: string[];
    gap?: number;
    background?: Rgb;
}
export interface SheetImage {
    width: number;
    height: number;
    rgb: Float64Array;
    columns: number;
    rows: number;
    thumbWidth: number;
    thumbHeight: number;
}
/** Area-averaging downscale to exactly tw×th. */
export declare function resample(img: DecodedPng, tw: number, th: number): Float64Array;
/** Width of one label character on a sheet, px: labels longer than a tile is wide run into the next tile. */
export declare const LABEL_CHAR_PX: number;
/** Tile frames into one image with a label strip above each tile. */
export declare function composeContactSheet(frames: DecodedPng[], opts?: SheetOptions): SheetImage;
/** Label text for a frame: "#3 1.500s" — only characters the font has. */
export declare function frameLabel(index: number, time: number | undefined): string;
/** What a region is, for the readings: a neutral surface, skin, the plate, or the element laid over it. */
export type LookRole = "neutral" | "skin" | "plate" | "element";
export declare const LOOK_ROLES: LookRole[];
export interface LookRegionSpec extends RegionSpec {
    role?: LookRole;
}
export interface LookArgs {
    regions: LookRegionSpec[];
    /** Element regions measured against plate regions, by name. */
    pairs?: Array<{
        element: string;
        plate: string;
    }>;
    /** Smallest luma step (0..1) counted as an edge. Default 0.1. */
    minContrast?: number;
    /** An element whose grain or edge width is within this share of the plate's matches it. Default 0.25. */
    grainTolerance?: number;
    sharpnessTolerance?: number;
    /** The background the subject was cut from (a wall's mean colour, 0..1): the soft edge's colour is read against it. */
    background?: Rgb | number[];
}
/**
 * Starting points, not measured judgments: a quarter either way for grain and
 * edge width; 0.02 (about five 8-bit steps) for black and white points; a
 * CIELAB a* or b* of 2 as the smallest cast called a cast (a colour
 * difference of about 2 is near the threshold of seeing one side by side).
 */
export declare const LOOK_DEFAULTS: {
    minContrast: number;
    grainTolerance: number;
    sharpnessTolerance: number;
    levelTolerance: number;
    castAbove: number;
    /** Pixels at or above this alpha count as the element when the frame has alpha. */
    opaque: number;
    /** Half-length of the profile read across an edge, px: edges up to about 10 px wide (sigma 4). */
    edgeReach: number;
    /** Profiles are the mean of this many neighbouring lines. */
    edgeLines: number;
    /** Skin hue angle (CIELAB h, degrees) commonly reported for skin of many tones under neutral light. */
    skinHue: [number, number];
};
export interface Lab {
    L: number;
    a: number;
    b: number;
    chroma: number;
    /** CIELAB hue angle h, degrees 0..360 (0 red-magenta, 90 yellow, 180 green, 270 blue). */
    hue: number;
}
/** CIELAB (D65) of an sRGB colour given as display values 0..1. */
export declare function labOf(rgb: Rgb): Lab;
/**
 * Per-channel gains on the display values that make `rgb` neutral at its
 * own luma: equal values read a* = b* = 0 whatever the encoding.
 */
export declare function neutralGains(rgb: Rgb): Rgb;
/** The region's pixels, straight colour, element pixels only when the frame has alpha. */
export interface LookCrop {
    rect: PixelRect;
    width: number;
    height: number;
    rgb: Float64Array;
    /** 1 where the pixel counts (opaque enough, or no alpha), else 0. */
    use: Uint8Array;
    /** The region's alpha, when the frame has one. */
    alpha?: Float64Array;
}
/** Every region's crop, for the frame-to-frame grain (and kept small: regions only). */
export declare function lookCrops(img: DecodedPng, args: LookArgs): Map<string, LookCrop>;
/**
 * Grain between two frames of the same region, per channel, in 8-bit steps:
 * the robust spread of the frame difference over the square root of two. A
 * still element reads 0; grain that changes every frame reads its size.
 */
export declare function temporalGrain(a: LookCrop, b: LookCrop): Rgb | null;
export interface LookLevels {
    /** 0.5th and 99.5th percentiles per channel, 0..1. */
    black: Rgb;
    white: Rgb;
    mean: Rgb;
    lumaBlack: number;
    lumaWhite: number;
    lumaMean: number;
}
export interface LookRegionReport {
    name: string;
    role: LookRole | null;
    rect: PixelRect;
    clipped: boolean;
    /** Pixels measured: opaque ones only when the frame has alpha. */
    pixels: number;
    levels: LookLevels;
    /** Per channel, in 8-bit steps (one step is 1/255). */
    grain: {
        spatial: Rgb;
    };
    /** Median and widest tenth (90th percentile) of the 10 to 90% widths, px. */
    sharpness: {
        edgeWidth: number | null;
        p90: number | null;
        edges: number;
    };
    /** CIELAB of the region's mean colour. */
    colour: Lab;
    /**
     * With alpha: the matte's own edge, read on the alpha (10 to 90% widths, median and widest
     * tenth, px) and the soft band, soft pixels (alpha 0.02 to 0.98) per pixel of outline.
     */
    matte?: {
        edgeWidth: number | null;
        p90: number | null;
        edges: number;
        softBand: number | null;
        /** Share of the region's pixels at alpha 0.99 or more, and the lowest alpha: a region inside the subject reads 1 and 1. */
        opaqueShare: number;
        minAlpha: number;
    };
    /** With alpha: the soft band's colour (straight) against the colour well inside, and against `background`. */
    edgeColour?: {
        band: Lab | null;
        inside: Lab | null;
        difference: number | null;
        towardBackground: number | null;
        reading: string;
    };
    cast?: {
        a: number;
        b: number;
        amount: number;
        toward: string | null;
        gains: Rgb;
        channelMixer: {
            "Red-Red": number;
            "Green-Green": number;
            "Blue-Blue": number;
        };
    };
    reading?: string;
}
export interface LookPairReport {
    element: string;
    plate: string;
    grain: {
        element: number;
        plate: number;
        ratio: number | null;
        matches: boolean | null;
    };
    sharpness: {
        element: number | null;
        plate: number | null;
        ratio: number | null;
        matches: boolean | null;
    };
    levels: {
        blackDifference: number;
        whiteDifference: number;
    };
    readings: string[];
}
/** An element region against its plate: grain, edge width, black and white points, with what to do. */
export declare function compareLook(element: Pick<LookRegionReport, "name" | "grain" | "sharpness" | "levels">, plate: Pick<LookRegionReport, "name" | "grain" | "sharpness" | "levels">, tol?: {
    grain?: number;
    sharpness?: number;
}): LookPairReport;
export interface LookFrame {
    regions: Array<LookRegionReport | RegionError>;
    pairs?: Array<LookPairReport | {
        element: string;
        plate: string;
        error: string;
    }>;
}
/** Grain, edge width, black and white points and colour of each region, and each element against its plate. */
export declare function measureLook(img: DecodedPng, args: LookArgs): LookFrame;
export interface LookSeries {
    regions: Array<{
        name: string;
        temporal: Rgb | null;
        pairs: number;
        matteChange: number | null;
    }>;
    pairs?: Array<{
        element: string;
        plate: string;
        element_temporal: number | null;
        plate_temporal: number | null;
        readings: string[];
    }>;
}
/** Frame-to-frame grain of each region over consecutive frames (crops from lookCrops, in order). */
export declare function summarizeLookSeries(frames: Array<Map<string, LookCrop>>, args: LookArgs): LookSeries;
/** A message naming the field, or null when `look` is usable. */
export declare function lookArgsError(args: Record<string, unknown>): string | null;
/**
 * Starting points, not measured judgments, for what counts as a difference:
 * a CIELAB a* or b* of 2 (as `look` calls a cast), 3 in L*, 0.02 in a black,
 * white or mean level, a quarter in edge width or grain, 5% in the subject's
 * size, 3% of the frame in a position. Two motion maps line up as the same
 * footage at a correlation of 0.6 or more (0.94 measured between two builds
 * of one take; see reference-study.md).
 */
export declare const REFERENCE_DEFAULTS: {
    grid: number;
    paletteColours: number;
    /** Every this many pixels across and down go into the main colours. */
    paletteStep: number;
    /** Frames spread over the input that colour, levels, sharpness and grain are read on. */
    lookFrames: number;
    /** Cell of the motion map, px. */
    motionCell: number;
    castStep: number;
    lightnessStep: number;
    levelStep: number;
    ratioStep: number;
    sizeStep: number;
    placeStep: number;
    sameFootage: number;
    shareStep: number;
    /** A colour of the reference with no colour of the build within this (CIELAB) is missing. */
    colourMatch: number;
};
/** The frame cut into thirds each way, named as a person would point at them. */
export declare function gridRegions(width: number, height: number): RegionSpec[];
export interface ReferenceRegion {
    name: string;
    role: LookRole | null;
    /** CIELAB of the region's mean colour over the frames read. */
    colour: Lab;
    mean: Rgb;
    /** Median over the frames of the region's edge width and widest tenth, px. */
    sharpness: {
        edgeWidth: number | null;
        p90: number | null;
    };
    /** Spatial grain, mean of the three channels, 8-bit steps. */
    grain: number;
}
export interface ReferenceReport {
    frames: number;
    size: [number, number];
    frameRate: number | null;
    /** Main colours over the frames read, largest share first. */
    palette: Array<{
        hex: string;
        colour: Lab;
        share: number;
    }>;
    levels: {
        lumaBlack: number;
        lumaWhite: number;
        lumaMean: number;
        black: Rgb;
        white: Rgb;
    };
    regions: ReferenceRegion[];
    /** Centres of brightness and of detail, as shares of the frame's width and height. */
    weight: {
        brightness: {
            x: number;
            y: number;
        };
        detail: {
            x: number;
            y: number;
        };
    };
    sharpness: {
        edgeWidth: number | null;
    };
    grain: number;
    motion: {
        /** The frames were consecutive, so cuts and motion were read. */
        consecutive: boolean;
        pairs: number;
        cuts: Array<{
            frame: number;
            time: number | null;
        }>;
        /** Mean change between neighbouring frames, cuts left out (display values 0..1). */
        meanChange: number | null;
        /** Where the picture moves, cuts left out. */
        map: MotionMap;
        /** The centre and spread of what moves (the subject, in a talking-head shot); null with no motion. */
        subject: {
            x: number;
            y: number;
            spreadX: number;
            spreadY: number;
        } | null;
    };
}
export interface ReferenceInputFrame {
    img: DecodedPng;
    /** The frame's number in its source; consecutive numbers make pairs. */
    frame: number;
    time?: number;
}
export interface ReferenceOptions {
    /** How many frames will be added: the look frames are spread over them. */
    total: number;
    regions?: LookRegionSpec[];
    frameRate?: number;
    motionCell?: number;
    lookFrames?: number;
}
/**
 * The reference report, read one frame at a time so a movie never sits in
 * memory: main colours and their shares, black and white points and mean,
 * colour, sharpness and grain at the grid's regions and any named ones, where
 * the weight of the frame sits, and, when the frames are consecutive, cuts
 * and how much and where the picture moves. Colour and texture are read on
 * up to `lookFrames` frames spread over the `total`; motion on every
 * neighbouring pair (one previous picture kept).
 */
export declare function referenceReader(opts: ReferenceOptions): {
    add: (f: ReferenceInputFrame) => void;
    finish: () => ReferenceReport;
};
/** The reference report on frames already in memory (a still, or a few frames). */
export declare function referenceReport(frames: ReferenceInputFrame[], opts?: Omit<ReferenceOptions, "total">): ReferenceReport;
export interface ReferenceDifference {
    measure: string;
    /** How many times the smallest difference this measure calls a difference: the list's order. */
    size: number;
    reading: string;
    reference?: unknown;
    build?: unknown;
}
export interface ReferenceComparison {
    differences: ReferenceDifference[];
    /** The moving subject lined up between the two, when both have motion. */
    subject: (MotionRegistration & {
        compared: boolean;
    }) | null;
    notes: string[];
    reading: string;
}
/** The build against the reference: every difference over its step, largest first, in words. */
export declare function compareReferences(ref: ReferenceReport, build: ReferenceReport): ReferenceComparison;
//# sourceMappingURL=sheet.d.ts.map
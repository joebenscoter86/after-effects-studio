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
 * Composite an image's straight (unassociated) alpha over a backdrop:
 * out = rgb·a + backdrop·(1 − a). Returns a new RGB buffer; an image without
 * alpha comes back as an unchanged copy. Straight alpha is what the PNG
 * format defines; whether saveFrameToPng follows it is one of the checks the
 * live test records.
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
/** Tile frames into one image with a label strip above each tile. */
export declare function composeContactSheet(frames: DecodedPng[], opts?: SheetOptions): SheetImage;
/** Label text for a frame: "#3 1.500s" — only characters the font has. */
export declare function frameLabel(index: number, time: number | undefined): string;
//# sourceMappingURL=sheet.d.ts.map
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
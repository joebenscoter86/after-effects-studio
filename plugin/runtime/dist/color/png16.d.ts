export interface DecodedPng {
    width: number;
    height: number;
    /** Row-major RGB triples, values normalized to 0..1. */
    rgb: Float64Array;
    /**
     * Row-major alpha, 0..1, when the file carried an alpha channel (RGBA /
     * gray+alpha); absent otherwise. The color pipeline ignores it — frame
     * analysis is what needs to tell "transparent" from "black".
     */
    alpha?: Float64Array;
    bitDepth: 8 | 16;
}
/** Decode a PNG into normalized RGB. Throws on interlaced or palette images. */
export declare function decodePng(buf: Buffer): DecodedPng;
/**
 * Encode normalized RGB into an 8-bit PNG carrying explicit sRGB tags
 * (sRGB + gAMA), so every viewer agrees on the color space — the untagged
 * output of saveFrameToPng was one of the two sources of "wrong color"
 * reports.
 */
export declare function encodePngSrgb8(width: number, height: number, rgb: Float64Array): Buffer;
//# sourceMappingURL=png16.d.ts.map
import type { Rgb } from "../color/sheet.js";
import type { AeTransport } from "../transport/AeTransport.js";
/** Converts a capture's RGB to display sRGB, in place. Alpha is never converted. */
export type Convert = (rgb: Float64Array) => void;
/** What the conversion reads from a capture call's payload, and the two fields it reports through. */
export interface ColorPayload {
    workingSpace?: string;
    bitsPerChannel?: number;
    projectFile?: string | null;
    captureKind?: "ocio" | "direct" | null;
    colorPipeline?: string;
    colorWarning?: string;
}
export declare function validRgb(value: unknown): Rgb | null;
/**
 * Decide how the captures are converted to viewer-accurate sRGB (see the
 * tool description for the three pipelines) and return the conversion,
 * applied in place to RGB only — alpha is coverage, not colour, and is never
 * converted. Reports through payload.colorPipeline / payload.colorWarning;
 * returns null (and never throws) when the files must stay raw.
 */
export declare function colorConversion(payload: ColorPayload, transport: AeTransport): Promise<Convert | null>;
//# sourceMappingURL=capture-shared.d.ts.map
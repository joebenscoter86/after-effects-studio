import { z } from "zod";
import { type Rgb } from "../color/sheet.js";
import type { AeTransport } from "../transport/AeTransport.js";
import { type ColorPayload } from "./capture-shared.js";
export interface CapturedFrame {
    frame: number;
    /** The written file, when the capture finished. */
    path?: string;
    error?: string;
}
/** What the capture reports about how it captured: colour settings and the size it asked for. */
export interface CaptureInfo extends ColorPayload {
    bgColor?: Rgb | null;
    resolution?: {
        asked: number | null;
        before: [number, number] | null;
        set: boolean;
        restored?: boolean;
        setError?: string;
        restoreError?: string;
    };
}
export interface CaptureChunk {
    frames: CapturedFrame[];
    info: CaptureInfo;
    /** Wall time of the capture, settle wait included. */
    seconds: number;
}
/** Frame numbers in, file paths out. */
export interface FrameSource {
    capture(frames: number[], dir: string): Promise<CaptureChunk | {
        error: string;
        details?: unknown;
    }>;
}
/** saveFrameToPng, a chunk at a time, waiting for the asynchronously written files. */
export declare function aeFrameSource(transport: AeTransport, comp: string | number, opts: {
    factor: number | null;
    tryOcio: boolean;
    settleTimeoutMs?: number;
    pixels: number;
}): FrameSource;
/** Items listed at most per list (counts are always complete). */
export declare const LIST_CAP = 20;
export declare const checkCompTool: import("./define-tool.js").ToolSpec<{
    compNameOrId: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
    from: z.ZodOptional<z.ZodNumber>;
    to: z.ZodOptional<z.ZodNumber>;
    startFrame: z.ZodOptional<z.ZodNumber>;
    every: z.ZodOptional<z.ZodNumber>;
    downsample: z.ZodOptional<z.ZodNumber>;
    maxFrames: z.ZodOptional<z.ZodNumber>;
    chunkFrames: z.ZodOptional<z.ZodNumber>;
    thresholds: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodNumber, z.ZodNull]>>>;
    safeArea: z.ZodOptional<z.ZodObject<{
        percent: z.ZodOptional<z.ZodNumber>;
        px: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    boundsOf: z.ZodOptional<z.ZodEnum<{
        text: "text";
        all: "all";
    }>>;
    boundsStep: z.ZodOptional<z.ZodNumber>;
    structure: z.ZodOptional<z.ZodBoolean>;
    colorManaged: z.ZodOptional<z.ZodEnum<{
        auto: "auto";
        off: "off";
    }>>;
    settleTimeoutMs: z.ZodOptional<z.ZodNumber>;
    outDir: z.ZodOptional<z.ZodString>;
    sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodObject<{
        maxTiles: z.ZodOptional<z.ZodNumber>;
        thumbWidth: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>]>>;
}>;
//# sourceMappingURL=check-comp.d.ts.map
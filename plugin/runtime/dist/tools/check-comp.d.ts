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
    /**
     * Captures asked of After Effects that had not finished writing when the
     * wait ended (no capture finished for the stall limit): After Effects may
     * still write them, so their folder must not be deleted and no more
     * captures may be queued behind them.
     */
    outstanding: string[];
}
export interface CaptureFailure {
    error: string;
    details?: unknown;
    /** As CaptureChunk.outstanding: captures the failed script may already have queued. */
    outstanding: string[];
}
/** Frame numbers in, file paths out. */
export interface FrameSource {
    capture(frames: number[], dir: string): Promise<CaptureChunk | CaptureFailure>;
}
/**
 * How long the wait for a chunk goes on after the last capture finished
 * before After Effects is taken to have stopped writing (60 s: a quarter-size
 * capture of a heavy comp takes a few seconds, not a minute).
 */
export declare const CAPTURE_STALL_MS = 60000;
/** The frame number a capture path names (frame-<k>.png), or null. */
export declare function frameOfCapture(file: string): number | null;
/**
 * saveFrameToPng, a chunk at a time, waiting for the asynchronously written
 * files. The wait follows After Effects' pace: it goes on while captures keep
 * finishing and ends when none has finished for `stallMs`, so a long or heavy
 * comp is not cut off by a budget fixed in advance. Whatever is not finished
 * then is returned as `outstanding`; a script that failed part way, or a call
 * that timed out after After Effects took it, is waited on the same way
 * before the failure is returned, since the frames it queued are still
 * written.
 */
export declare function aeFrameSource(transport: AeTransport, comp: string | number, opts: {
    factor: number | null;
    tryOcio: boolean;
    settleTimeoutMs?: number;
    stallMs?: number;
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
    stallTimeoutMs: z.ZodOptional<z.ZodNumber>;
    outDir: z.ZodOptional<z.ZodString>;
    sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodObject<{
        maxTiles: z.ZodOptional<z.ZodNumber>;
        thumbWidth: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>]>>;
}>;
//# sourceMappingURL=check-comp.d.ts.map
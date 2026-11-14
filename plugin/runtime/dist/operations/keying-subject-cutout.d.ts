import { type FileIO, type Json } from "./keying-shared.js";
/** How two halves of a cut-out are joined, with what the first piece measured across the join (2026-11-12). */
export declare const HALVES_JOIN_NOTE: string;
/**
 * The span subject.render_cutout renders: the layer's whole span, or
 * `from`..`to` (comp seconds) clipped to it and snapped to frame boundaries.
 */
export declare function cutoutSpan(layerSpan: {
    start: number;
    duration: number;
    frameRate: number;
}, from: unknown, to: unknown): {
    start: number;
    duration: number;
    frames: number;
    firstFrame: number;
    lastFrame: number;
    clipped: boolean;
    whole: boolean;
} | {
    error: string;
};
/**
 * Free space required on top of the movie: After Effects writes its disk cache
 * to the same drive while it renders, by an amount nobody measured for one
 * render (42.1 GB over an evening). 3 GB: the 2 GB asked for, and one more.
 */
export declare const RENDER_MARGIN_BYTES: number;
/** The movie subject.render_cutout will write, estimated from the comp's frame size and frame count. */
export declare function renderCutoutBytes(frames: number, size: [number, number] | number[]): number;
/** The output template to use: the caller's (when it exists), else one that writes a movie with alpha; or a refusal. */
export declare function chooseAlphaTemplate(available: string[], wanted?: string): {
    template: string;
    why: string;
} | {
    error: string;
};
/** JSX: what render_cutout will render (the layer, its gap fill, the span) and the output templates on this machine. */
export declare function renderCutoutPlanJsx(args: {
    comp: unknown;
    layer: unknown;
}): string;
/**
 * JSX: render the comp with only `keep` switched on (cameras, lights and
 * audio-only layers left as they are; solo cleared), through one temporary
 * render-queue item; other queue items are parked. Every switch is put back
 * and the item removed, even when the render fails.
 */
export declare function renderCutoutJsx(args: {
    comp: unknown;
    keep: string[];
    outputPath: string;
    outputTemplate: string;
    start: number;
    duration: number;
    overwrite: boolean;
    subject?: string;
}): string;
export declare function runRenderCutout(args: Record<string, unknown>, io: FileIO): Promise<Json>;
/**
 * A change in opaque share between neighbouring frames above this is a
 * jump. On the take of 2026-11-11 the rendered cut-out ran from 0.279 to
 * 0.314 with no step over 0.012 at full frame rate; a dropped microphone is
 * about 0.05. Half way, rounded down.
 */
export declare const CHECK_FILE_JUMP_LIMIT = 0.025;
/** Which frames of an n-frame file to read: all up to `cap`; beyond it, pairs (k, k + 1) every step, and the first and last three. */
export declare function checkFileFrames(n: number, cap: number): {
    frames: number[];
    step: number;
};
/** a* at or above this reads as skin-like warm colour; at or below SPECK_PALE_A as pale grey or white (the first piece: chair +7, skin +30). */
export declare const SPECK_SKIN_A = 20;
export declare const SPECK_PALE_A = 12;
export declare function runCheckFile(args: Record<string, unknown>, io: FileIO): Promise<Json>;
/**
 * JSX: put the rendered cut-out in the comp in place of the live matte. The
 * movie is in comp space (render_cutout renders the comp with only the
 * cut-out and its fill on), so it goes in untransformed at the comp's centre,
 * directly above the cut-out layer, over the cut-out's span. The cut-out's
 * and the fill's pictures are switched off; they stay in the project, with
 * the selections, for a later re-click. The original keeps its audio; the
 * movie's audio is switched off.
 */
export declare function useCutoutJsx(args: {
    comp: unknown;
    layer: unknown;
    path?: string;
    item?: number;
    startTime?: number;
}): string;
//# sourceMappingURL=keying-subject-cutout.d.ts.map
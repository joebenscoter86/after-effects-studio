import { type Box, type FrameEdge } from "../color/matte.js";
import { type DecodedPng } from "../color/png16.js";
export declare const KEYLIGHT_MATCH_NAME = "Keylight 906";
export declare const KEY_CLEANER_MATCH_NAME = "ADBE KeyCleaner";
export declare const SPILL_SUPPRESSOR_MATCH_NAME = "ADBE Spill2";
/** Keylight's View values 1..11, by name (confirmed live by rendering each). */
export declare const KEYLIGHT_VIEWS: readonly ["source", "source_alpha", "corrected_source", "colour_correction_edges", "screen_matte", "inside_mask", "outside_mask", "combined_matte", "status", "intermediate_result", "final_result"];
type Kind = "number" | "colour" | "switch";
interface Setting {
    matchName: string;
    kind: Kind;
    doc: string;
}
/** The Keylight settings key.keylight writes, as After Effects 2027 reports them. */
export declare const KEYLIGHT_SETTINGS: Record<string, Setting>;
export declare const KEY_CLEANER_SETTINGS: Record<string, Setting>;
export declare const SPILL_SUPPRESSOR_SETTINGS: Record<string, Setting>;
/** A Keylight view by name (forgiving spelling) or number 1..11 → number, or a message. */
export declare function keylightViewNumber(v: unknown): number | string;
export declare const OBJECT_MATTE_MATCH_NAME = "ADBE Samurai";
export declare const OBJECT_MATTE_SELECTIONS_MATCH_NAME = "ADBE Samurai Strokes Group";
interface MatteSetting {
    matchName: string;
    name: string;
    /** Range and default as After Effects 27.0 reported them; null where not measured. */
    min: number | null;
    max: number | null;
    default: number | null;
    kind: "number" | "switch";
    /** subject.settings writes it. */
    writable: boolean;
    /** What a switch does, for its parameter's description. */
    doc?: string;
}
/** Object Matte's settings, as After Effects 27.0 reported them (2026-11-11). */
export declare const OBJECT_MATTE_SETTINGS: Record<string, MatteSetting>;
/** Said to the user before the steps, and in the skill before building starts. */
export declare const SUBJECT_MATTE_NOTICE = "One step here needs you in After Effects: a single click on the subject, about ten seconds. Everything before and after it I do.";
/**
 * The user's steps for the click, written once. subject.prepare returns them
 * with the clip's name and the subject filled in; keying.md quotes the
 * defaults (no clip name, "the person") and a test keeps the two the same.
 */
export declare function subjectMatteSteps(opts?: {
    clip?: string;
    subject?: string;
}): string[];
export type SelectionKind = "object" | "rectangle" | "quick-selection" | "other";
/**
 * A selection's kind from its name: a click with the Object Matte Tool
 * ("Add Object N"), a click that dragged a little and became a rectangle
 * ("Add Object Rect N", which may select nothing), a stroke with the old
 * brush ("Quick Select Foreground N"), or other.
 */
export declare function selectionKind(name: string): SelectionKind;
/** Two clicks closer than this share of the source's shorter side probably selected the same thing. */
export declare const CLOSE_CLICK_SHARE = 0.05;
export interface CloseClick {
    a: string;
    b: string;
    distance: number;
    limit: number;
    reading: string;
}
/**
 * Pairs of selections whose clicked points (source pixels) are closer than
 * `minDistance`, default CLOSE_CLICK_SHARE of the source's shorter side. The
 * two mistaken clicks of 2026-11-11 were 57 px apart on a 2176 x 3840 source;
 * the click on the microphone was about 820 px from them.
 */
export declare function closeClicks(clicks: Array<{
    name: string;
    point: [number, number] | number[] | null;
}>, sourceSize: [number, number] | number[] | null, minDistance?: number): CloseClick[];
/** A hole or opening at least this big (px at the comp's size) is a finding the agent stops on and shows. */
export declare const CUTOUT_HOLE_LIMIT = 1000;
/** Settle time asked of ae_render_frame per frame. Measured: 20 to 40 s a frame the first time on a 2176 x 3840 take. */
export declare const CUTOUT_SECONDS_PER_FRAME = 60;
type RegionBox = Box & {
    area: number;
    edges?: FrameEdge[];
};
export interface RegionFinding {
    kind: "hole" | "opening";
    frames: number[];
    smallestArea: number;
    largestArea: number;
    /** The frame where it was largest. */
    largestFrame: number;
    box: Box;
    edges?: FrameEdge[];
}
/**
 * Two regions are alike (the same thing on two frames, or on two renders of
 * one frame) when their boxes overlap by at least half their union, or when
 * they overlap and their areas are within a factor of two. A small opening
 * under a microphone stand inside the box of a missed microphone is not
 * alike to it (2026-11-11: 1,862 px against 114,769 px).
 */
export declare function alikeRegions(a: Box & {
    area: number;
}, b: Box & {
    area: number;
}): boolean;
/** An `accept` entry: a plain box (it accepts openings) or { box, kind }. */
export type AcceptEntry = Box | {
    box: Box;
    kind?: "hole" | "opening" | "speck";
}
/** A frozen outline seen and accepted (a subject that really is still), optionally only over these frames. */
 | {
    kind: "frozen";
    from?: number;
    to?: number;
};
/**
 * Whether a finding is one the user accepted: an entry of the same kind
 * (openings unless the entry says "hole") whose box overlaps the finding's by
 * at least half their union. A hole is never accepted through an opening's
 * box, and a box does not accept what merely lies inside it.
 */
export declare function acceptedBy(f: RegionFinding, accept: AcceptEntry[]): boolean;
/** Holes and openings at least `limit` px, each kind grouped across frames where they are alike. */
export declare function cutoutFindings(frames: Array<{
    frame: number;
    holes?: RegionBox[] | null;
    openings?: RegionBox[] | null;
}>, limit: number): RegionFinding[];
type Json = any;
/** Every After Effects call subject.check and subject.fill_gaps make. */
export interface CutoutIO {
    /** subject.status for the layer. */
    status(): Promise<Json>;
    /** ae_render_frame with these arguments; its result payload, or { ok: false, error }. */
    render(args: Record<string, unknown>): Promise<Json>;
    /** A written PNG, decoded. */
    readImage(file: string): Promise<DecodedPng>;
    /** The fill's build in After Effects (fillBuildJsx). */
    build(args: {
        comp: unknown;
        layer: unknown;
        stillPath: string;
    }): Promise<Json>;
    /** Undo the fill's build (fillUnbuildJsx). */
    unbuild(args: {
        comp: unknown;
        fillLayer: string;
        maskLayer: string;
        stillItemId: number | null;
    }): Promise<Json>;
    writePng?(file: string, data: Buffer): Promise<void>;
    /** Free bytes on the volume holding `dir` (default: fs.statfs), or null when unknown. */
    freeBytes?(dir: string): Promise<number | null>;
    /** Which volume holds `dir` (default: the device of its nearest existing folder). */
    volumeOf?(dir: string): Promise<string | number | null>;
}
/** What the pixel helpers need from After Effects: a render, and the files it wrote. */
type PixelIO = Pick<CutoutIO, "render" | "readImage" | "writePng" | "freeBytes" | "volumeOf">;
/** Footage this many times the comp's size in both directions, scaled down at least as much, is matted at the delivery size instead. */
export declare const OVERSIZE_FACTOR = 1.5;
export interface PrepareFootage {
    sourceSize: number[] | null;
    compSize: number[] | null;
    scale: number[] | null;
    frames: number | null;
    file: string | null;
    hasAudio: boolean;
}
export interface AudioStream {
    channels: number;
    layout: string | null;
}
export interface PrepareIO {
    /** Runs subject.prepare's JSX and returns its result. */
    execute(code: string): Promise<Json>;
    /** The file's audio streams (ffprobe), or null when they could not be read. */
    probeAudio(file: string): Promise<AudioStream[] | null>;
}
/** When the layer's source is well over the comp's size and scaled down to fit: the numbers, and the copy to make before the click. */
export declare function sourceAdviceFor(f: PrepareFootage | null | undefined): Json | null;
/** Sound After Effects may read as silence: more than two channels, or audio in the file that After Effects does not report. */
export declare function soundAdviceFor(f: PrepareFootage | null | undefined, streams: AudioStream[] | null): {
    soundAdvice?: Json;
    soundNote?: string;
};
/** subject.prepare: the JSX that opens the layer for the click, then the footage and sound checks in Node. */
export declare function runSubjectPrepare(args: Record<string, unknown>, io: PrepareIO): Promise<Json>;
/**
 * Free space required on top of the movie: After Effects writes its disk cache
 * to the same drive while it renders, by an amount nobody measured for one
 * render (42.1 GB over an evening). 3 GB: the 2 GB asked for, and one more.
 */
export declare const RENDER_MARGIN_BYTES: number;
/** The movie subject.render_cutout will write, estimated from the comp's frame size and frame count. */
export declare function renderCutoutBytes(frames: number, size: [number, number] | number[]): number;
/** Free bytes on the volume holding `dir`, read on its nearest existing folder; null when it cannot be read. */
export declare function statfsFree(dir: string): Promise<number | null>;
/**
 * After Effects' disk cache written while it tracks Object Matte through
 * `frames` frames of a source this size: one 16-bit RGBA frame of the source
 * per frame (8 bytes a pixel). Measured: one render of 320 frames of a 2176 x
 * 3840 take added about 19 GB (estimate 21.4 GB).
 */
export declare function cacheBytesFor(frames: number, sourceSize: [number, number] | number[] | null | undefined): number;
/** Where After Effects keeps its disk cache: <Disk Cache folder>/Adobe/After Effects/<major.minor>. */
export declare function aeCacheRoot(folder: string | null | undefined, version: string | null | undefined): string | null;
/**
 * The size of After Effects' disk cache and the free space on its drive, and
 * a note for the user when that drive is low. Reads only: nothing is deleted
 * and no preference is changed.
 */
export declare function diskReport(cache: {
    folder: string | null;
    version: string | null;
} | null | undefined, freeFn?: (dir: string) => Promise<number | null>): Promise<Json>;
/** Time spent in the renders a call made, summed over its ae_render_frame calls (ms). */
export interface RenderTally {
    frames: number;
    calls: number;
    ms: number;
    aeCallMs: number;
    settleMs: number;
    renderNodeMs: number;
}
/** Time spent on the pixels in Node (ms): reading the files, finding regions, writing the pictures and the sheet. */
export interface PixelTally {
    frames: number;
    readMs: number;
    regionsMs: number;
    picturesMs: number;
    sheetMs: number;
    ms: number;
}
export declare function runSubjectCheck(args: Record<string, unknown>, io: CutoutIO): Promise<Json>;
export declare function runFillGaps(args: Record<string, unknown>, io: CutoutIO): Promise<Json>;
/** JSX: remove subject.fill_gaps' two layers and its imported still. */
export declare function fillUnbuildJsx(args: {
    comp: unknown;
    fillLayer: string;
    maskLayer: string;
    stillItemId: number | null;
}): string;
/**
 * JSX for subject.fill_gaps' build: import the still, add it as a hidden
 * layer, duplicate the footage layer directly under the cut-out with its
 * Object Matte removed, and give the copy the still as its luma track matte
 * (setTrackMatte; its ALPHA form was confirmed in After Effects 27.0, LUMA was
 * not). Refuses when a fill is already there.
 */
export declare function fillBuildJsx(args: {
    comp: unknown;
    layer: unknown;
    stillPath: string;
}): string;
/** What subject.render_cutout and subject.check_file need from After Effects. */
export interface FileIO extends PixelIO {
    /** Run ExtendScript; its result, or { ok: false, error }. */
    execute(code: string, opts: {
        label: string;
        timeoutMs: number;
        undoGroup?: boolean;
    }): Promise<Json>;
    /** Whether a file exists on this machine (default: fs.access). */
    exists?(file: string): Promise<boolean>;
}
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
}): string;
export declare function runRenderCutout(args: Record<string, unknown>, io: FileIO): Promise<Json>;
/** Default most frames subject.check_file reads one by one; beyond it, it reads pairs in steps. About 0.55 s a frame measured. */
export declare const CHECK_FILE_MAX_FRAMES = 400;
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
export {};
//# sourceMappingURL=keying.d.ts.map
import { type Json } from "./keying-shared.js";
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
/**
 * For the agent, on the cut-out operations' descriptions and results: the
 * click cannot be made unattended (first production use, 2026-11-12: a piece
 * meant to run overnight still needed it).
 */
export declare const SUBJECT_ATTENDED_NOTE: string;
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
 * The size of After Effects' disk cache and the free space on its drive, and
 * a note for the user when that drive is low. Reads only: nothing is deleted
 * and no preference is changed.
 */
export declare function diskReport(cache: {
    folder: string | null;
    version: string | null;
} | null | undefined, freeFn?: (dir: string) => Promise<number | null>): Promise<Json>;
export {};
//# sourceMappingURL=keying-subject-prepare.d.ts.map
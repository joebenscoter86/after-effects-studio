import { type Box } from "../color/matte.js";
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
/** A hole at least this big (px at the comp's size) is a finding the agent stops on and shows. */
export declare const CUTOUT_HOLE_LIMIT = 1000;
type HoleBox = Box & {
    area: number;
};
export interface HoleFinding {
    kind: "hole";
    frames: number[];
    largestArea: number;
    box: Box;
}
/** Holes at least `limit` px, grouped across frames where their boxes overlap. */
export declare function cutoutFindings(frames: Array<{
    frame: number;
    holes: HoleBox[];
}>, limit: number): HoleFinding[];
type Json = any;
/** Every After Effects call subject.check and subject.fill_gaps make. */
export interface CutoutIO {
    /** subject.status for the layer. */
    status(): Promise<Json>;
    /** ae_render_frame with these arguments; its result payload, or { ok: false, error }. */
    render(args: Record<string, unknown>): Promise<Json>;
    /** A written PNG's alpha. */
    readAlpha(file: string): Promise<{
        width: number;
        height: number;
        alpha: ArrayLike<number>;
    }>;
    /** The fill's build in After Effects (fillBuildJsx). */
    build(args: {
        comp: unknown;
        layer: unknown;
        stillPath: string;
    }): Promise<Json>;
    writePng?(file: string, data: Buffer): Promise<void>;
}
export declare function runSubjectCheck(args: Record<string, unknown>, io: CutoutIO): Promise<Json>;
export declare function runFillGaps(args: Record<string, unknown>, io: CutoutIO): Promise<Json>;
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
export {};
//# sourceMappingURL=keying.d.ts.map
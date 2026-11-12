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
/** A selection's kind from its name: a click with the Object Matte Tool, a stroke with the old brush, or other. */
export declare function selectionKind(name: string): "object" | "quick-selection" | "other";
export {};
//# sourceMappingURL=keying.d.ts.map
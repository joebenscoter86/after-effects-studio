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
export {};
//# sourceMappingURL=keying-key.d.ts.map
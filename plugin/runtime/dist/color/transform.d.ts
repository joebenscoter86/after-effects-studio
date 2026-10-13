export type Mat3 = readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number]
];
/** ACEScg (AP1, D60) → linear Rec.709/sRGB (D65, Bradford CAT). */
export declare const AP1_TO_REC709: Mat3;
/** ACES2065-1 (AP0, D60) → linear Rec.709/sRGB (D65, Bradford CAT). */
export declare const AP0_TO_REC709: Mat3;
export declare function srgbEncode(x: number): number;
/**
 * Scene-linear working space → display sRGB (encoded 0..1), in place over an
 * interleaved RGB Float64Array. `toRec709` converts the working primaries to
 * linear Rec.709 first; the ACES output transform then tone-maps to display.
 */
export declare function sceneLinearToDisplaySrgb(rgb: Float64Array, toRec709: Mat3): void;
export interface WorkingSpaceProfile {
    /** Matrix from working primaries to linear Rec.709. */
    toRec709: Mat3;
    /** Human-readable note for the tool response. */
    note: string;
}
/**
 * Map an After Effects working-space name (Project.workingSpace) to the
 * conversion this module can perform. Returns null for spaces we cannot
 * faithfully convert — the caller should fall back to raw output plus a
 * warning pointing at the clipboard capture method.
 */
export declare function profileForWorkingSpace(workingSpace: string): WorkingSpaceProfile | null;
//# sourceMappingURL=transform.d.ts.map
export interface CensusRules {
    block: number;
    search: number;
    /** A pixel has changed past this (0..255). */
    pixel: number;
    calmBelow: number;
    travelMoved: number;
    cutChanged: number;
    cutMoved: number;
    /** A block is textured past this standard deviation. */
    texture: number;
}
export declare const CENSUS_RULES: CensusRules;
export interface Step {
    changed: number;
    moved: number;
    textured: number;
    shift: number;
    label: "c" | "l" | "T" | "X";
}
/** One step: frame b against frame a (grey, w x h), over rows y0..y1. */
export declare function censusStep(a: Uint8Array, b: Uint8Array, w: number, h: number, y0: number, y1: number, rules?: CensusRules): Step;
export interface Cadence {
    shares: {
        calm: number;
        local: number;
        travel: number;
        cut: number;
    };
    travel: {
        perMinute: number;
        medianSeconds: number;
        medianSpeed: number;
    };
    burstsPer10s: number;
    calmRuns: {
        medianSeconds: number;
        maxSeconds: number;
    };
}
/** Cadence numbers from a string of labels at `step` seconds a step; speed from each step's median shift (px a step). */
export declare function cadence(labels: string, shifts: number[], step: number, pxScale: number): Cadence;
//# sourceMappingURL=census.d.ts.map
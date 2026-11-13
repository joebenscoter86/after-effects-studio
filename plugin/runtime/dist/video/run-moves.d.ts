import { type CurveSample } from "../color/motion.js";
type Json = Record<string, any>;
export declare function runMoves(args: Json): Promise<Json>;
export interface Tolerance {
    frames: number;
    distanceShare: number;
    easePoints: number;
}
export declare const TIGHT: Tolerance;
/** Moves of a sampled property, fitted as video.track fits them (so a built curve and a measured move compare like for like). */
export declare function movesOfSamples(samples: CurveSample[], fps: number, channel: string): Json[];
export declare function runCompareMoves(args: Json, readProperty?: (a: Json) => Promise<Json>): Promise<Json>;
export {};
//# sourceMappingURL=run-moves.d.ts.map
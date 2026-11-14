import { type CutoutIO, type Json } from "./keying-shared.js";
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
export declare function runSubjectCheck(args: Record<string, unknown>, io: CutoutIO): Promise<Json>;
export declare function runFillGaps(args: Record<string, unknown>, io: CutoutIO): Promise<Json>;
//# sourceMappingURL=keying-subject-check.d.ts.map
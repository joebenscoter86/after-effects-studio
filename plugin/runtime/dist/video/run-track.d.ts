import { type VideoInfo, type VideoTools } from "./decode.js";
type Json = Record<string, any>;
export declare const NOT_MEASURED: string[];
/** Region as [x, y, w, h] in source pixels, or as shares of the frame when every value is 1 or under. */
export declare function regionPx(r: unknown, w: number, h: number): [number, number, number, number] | null;
/** The file's frame at a time (seconds from its first frame): the last frame that starts at or before it. */
export declare function frameAt(info: VideoInfo, t: number): number;
export interface TrackOptions {
    tools?: VideoTools;
    workLong?: number;
    minNcc?: number;
}
export declare function runTrack(args: Json, opts?: TrackOptions): Promise<Json>;
export {};
//# sourceMappingURL=run-track.d.ts.map
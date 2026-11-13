/** The wait for one frame, as before stage 4: hit once live on a keyed 1080×1920 comp. */
export declare const SETTLE_BASE_MS = 15000;
/** Extra wait for each further frame of 1080×1920 (scaled by pixel count), and the least per frame. */
export declare const SETTLE_PER_HD_FRAME_MS = 3000;
export declare const SETTLE_MIN_PER_FRAME_MS = 1000;
/**
 * How long to wait for `frames` captures of `pixelsPerFrame` each: 15 s for
 * the first (unchanged for a single frame), then 3 s per further frame of
 * 1080×1920, proportionally more for bigger frames and never less than 1 s.
 */
export declare function settleTimeoutFor(frames: number, pixelsPerFrame: number): number;
/** What was at a path before the render: so a left-over file is not taken for the new capture. */
export interface FileStamp {
    exists: boolean;
    size: number;
    mtimeNs: bigint;
    ino: bigint;
}
export declare function stampFiles(paths: string[]): Promise<FileStamp[]>;
export type UnsettledState = "missing" | "empty" | "unchanged" | "writing";
export interface UnsettledFile {
    index: number;
    path: string;
    /** missing: never appeared; empty: 0 bytes; unchanged: still the file from before the render; writing: still growing or incomplete. */
    state: UnsettledState;
    bytes: number;
}
export interface SettleResult {
    /** Indices (into `paths`) of the files that finished, ascending. */
    settled: number[];
    unsettled: UnsettledFile[];
    waitedMs: number;
    timeoutMs: number;
    /** The stall limit, when the wait was extended by progress. */
    stallMs?: number;
}
export interface SettleOptions {
    timeoutMs: number;
    /** Stamps from stampFiles() taken before the render; a file equal to its stamp is not new. */
    before?: FileStamp[];
    /** Size must hold this long when the file is not a complete PNG. Default 250 ms. */
    stableMs?: number;
    /**
     * Keep waiting past `timeoutMs` while files keep finishing: each file that
     * finishes moves the deadline to at least `stallMs` from then. The wait
     * ends when every file has finished, or when none has finished for
     * `stallMs` (and the `timeoutMs` budget is spent). Unset: `timeoutMs` is a
     * fixed budget, as before.
     */
    stallMs?: number;
}
/** Wait until every path has finished writing, or the time runs out; never throws. */
export declare function waitForSettled(paths: string[], opts: SettleOptions): Promise<SettleResult>;
/**
 * Read a file once it has finished writing (see waitForSettled). Throws when
 * `timeoutMs` elapses first.
 */
export declare function readFileSettled(filePath: string, timeoutMs?: number, stableMs?: number): Promise<Buffer>;
//# sourceMappingURL=settled-read.d.ts.map
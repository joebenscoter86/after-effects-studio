/**
 * Read a file once it has settled: present, non-empty, and unchanged in size
 * for `stableMs`. Throws when `timeoutMs` elapses first.
 */
export declare function readFileSettled(filePath: string, timeoutMs?: number, stableMs?: number): Promise<Buffer>;
//# sourceMappingURL=settled-read.d.ts.map
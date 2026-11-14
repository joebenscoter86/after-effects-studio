type Json = any;
export interface SnapshotIO {
    execute(code: string, opts: {
        label: string;
        timeoutMs: number;
    }): Promise<Json>;
}
export declare function runSnapshot(args: Record<string, unknown>, io: SnapshotIO): Promise<Json>;
export declare function runRestore(args: Record<string, unknown>, io: SnapshotIO): Promise<Json>;
export {};
//# sourceMappingURL=project.d.ts.map
/** Largest script file eval.run reads. Build scripts measured so far are ~365 KB. */
export declare const MAX_SCRIPT_FILE_BYTES: number;
/** Largest `args` value, serialized. It is inlined into the generated code. */
export declare const MAX_SCRIPT_ARGS_BYTES: number;
/**
 * Check and read a script file. Exported for tests; ae_do reaches it through
 * the operation's `prepare` hook.
 */
export declare function readScriptFile(file: string): {
    ok: true;
    code: string;
} | {
    ok: false;
    error: string;
    hint?: string;
};
//# sourceMappingURL=eval.d.ts.map
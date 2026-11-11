import { z } from "zod";
import type { RollbackReport } from "../transport/AeTransport.js";
export declare const doTool: import("./define-tool.js").ToolSpec<{
    operation: z.ZodString;
    args: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    timeoutMs: z.ZodOptional<z.ZodNumber>;
}>;
/**
 * One sentence on what became of the rollback, for the error message — the
 * structured report rides in details.rollback. Empty when none was needed.
 */
export declare function rollbackSentence(rb: RollbackReport | null | undefined): string;
//# sourceMappingURL=do.d.ts.map
import { z } from "zod";
export declare const doTool: import("./define-tool.js").ToolSpec<{
    operation: z.ZodString;
    args: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    timeoutMs: z.ZodOptional<z.ZodNumber>;
}>;
//# sourceMappingURL=do.d.ts.map
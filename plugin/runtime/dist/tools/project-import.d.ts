import { z } from "zod";
export declare const projectImportTool: import("./define-tool.js").ToolSpec<{
    inPath: z.ZodOptional<z.ZodString>;
    json: z.ZodOptional<z.ZodUnknown>;
    clearFirst: z.ZodOptional<z.ZodBoolean>;
    dryRun: z.ZodOptional<z.ZodBoolean>;
    skipValidation: z.ZodOptional<z.ZodBoolean>;
}>;
//# sourceMappingURL=project-import.d.ts.map
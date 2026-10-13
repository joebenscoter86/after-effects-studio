import { z } from "zod";
export declare const layerInfoTool: import("./define-tool.js").ToolSpec<{
    compNameOrId: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
    layerIndex: z.ZodUnion<readonly [z.ZodNumber, z.ZodArray<z.ZodNumber>, z.ZodLiteral<"all">]>;
    includeProperties: z.ZodOptional<z.ZodBoolean>;
    detail: z.ZodOptional<z.ZodEnum<{
        full: "full";
        summary: "summary";
    }>>;
}>;
//# sourceMappingURL=layer-info.d.ts.map
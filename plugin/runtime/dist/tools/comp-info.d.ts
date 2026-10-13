import { z } from "zod";
export declare const compInfoTool: import("./define-tool.js").ToolSpec<{
    nameOrId: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>]>;
}>;
//# sourceMappingURL=comp-info.d.ts.map
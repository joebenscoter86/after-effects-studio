import { z } from "zod";
export declare const renderFrameTool: import("./define-tool.js").ToolSpec<{
    compNameOrId: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
    time: z.ZodOptional<z.ZodNumber>;
    times: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    outPath: z.ZodString;
    useDisplayStartTime: z.ZodOptional<z.ZodBoolean>;
    colorManaged: z.ZodOptional<z.ZodEnum<{
        auto: "auto";
        off: "off";
    }>>;
    analyze: z.ZodOptional<z.ZodBoolean>;
    contactSheet: z.ZodOptional<z.ZodObject<{
        columns: z.ZodOptional<z.ZodNumber>;
        thumbWidth: z.ZodOptional<z.ZodNumber>;
        outPath: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}>;
//# sourceMappingURL=render-frame.d.ts.map
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
    channels: z.ZodOptional<z.ZodEnum<{
        alpha: "alpha";
        rgb: "rgb";
        rgba: "rgba";
    }>>;
    over: z.ZodOptional<z.ZodUnion<readonly [z.ZodEnum<{
        checkerboard: "checkerboard";
        background: "background";
    }>, z.ZodString, z.ZodArray<z.ZodNumber>]>>;
    isolate: z.ZodOptional<z.ZodUnion<readonly [z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodObject<{
        id: z.ZodNumber;
    }, z.core.$strip>]>, z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodObject<{
        id: z.ZodNumber;
    }, z.core.$strip>]>>]>>;
    sample: z.ZodOptional<z.ZodObject<{
        regions: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            x: z.ZodNumber;
            y: z.ZodNumber;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        stage: z.ZodOptional<z.ZodEnum<{
            both: "both";
            output: "output";
            capture: "capture";
        }>>;
    }, z.core.$strip>>;
    histogram: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodObject<{
        bins: z.ZodOptional<z.ZodNumber>;
        stage: z.ZodOptional<z.ZodEnum<{
            output: "output";
            capture: "capture";
        }>>;
    }, z.core.$strip>]>>;
    compare: z.ZodOptional<z.ZodObject<{
        from: z.ZodOptional<z.ZodNumber>;
        to: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    edge: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodObject<{
        transparent: z.ZodOptional<z.ZodNumber>;
        opaque: z.ZodOptional<z.ZodNumber>;
        maxEdgeWidth: z.ZodOptional<z.ZodNumber>;
        mainAreaShare: z.ZodOptional<z.ZodNumber>;
        listed: z.ZodOptional<z.ZodNumber>;
        screen: z.ZodOptional<z.ZodEnum<{
            green: "green";
            blue: "blue";
        }>>;
        spillMinAlpha: z.ZodOptional<z.ZodNumber>;
        spillThreshold: z.ZodOptional<z.ZodNumber>;
        changeAbove: z.ZodOptional<z.ZodNumber>;
        patchWindow: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>]>>;
    screen: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodObject<{
        screen: z.ZodOptional<z.ZodEnum<{
            auto: "auto";
            green: "green";
            blue: "blue";
        }>>;
        minExcess: z.ZodOptional<z.ZodNumber>;
        minDominance: z.ZodOptional<z.ZodNumber>;
        minScreenShare: z.ZodOptional<z.ZodNumber>;
        opaque: z.ZodOptional<z.ZodNumber>;
        columns: z.ZodOptional<z.ZodNumber>;
        rows: z.ZodOptional<z.ZodNumber>;
        minCellShare: z.ZodOptional<z.ZodNumber>;
        nearSkip: z.ZodOptional<z.ZodNumber>;
        nearBand: z.ZodOptional<z.ZodNumber>;
        unevenRatio: z.ZodOptional<z.ZodNumber>;
        grainAbove: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>]>>;
}>;
//# sourceMappingURL=render-frame.d.ts.map
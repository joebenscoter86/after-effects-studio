import { z } from "zod";
/**
 * Where inside a frame `frames` and `strip` render: a quarter of a frame past
 * its start. Found live: a time a hair below a boundary renders the frame
 * before (1.4333 for 43/30 rendered frame 42), and an exact boundary is at
 * the mercy of floating point. A quarter in is the same frame whether After
 * Effects floors the time or rounds it.
 */
export declare const FRAME_PICK = 0.25;
/**
 * A requested time within this fraction of a frame below the next frame's
 * start is reported (frameWarning): 2% of a frame, 0.7 ms at 30 fps. Times
 * rounded to four decimals land there (43/30 → 1.4333 is 0.1% below frame 43);
 * a time deliberately between frames is not.
 */
export declare const NEAR_FRAME_BOUNDARY = 0.02;
/**
 * The warning for a call's requested times, or undefined: two times that
 * resolve to the same frame, and times just below a frame boundary. The
 * times are never moved; this only says what After Effects will render.
 */
export declare function frameWarnings(frames: Array<{
    time?: number;
    frame?: number;
    frameOffset?: number;
}>, near?: number): string | undefined;
export declare const renderFrameTool: import("./define-tool.js").ToolSpec<{
    compNameOrId: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
    time: z.ZodOptional<z.ZodNumber>;
    times: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    strip: z.ZodOptional<z.ZodObject<{
        at: z.ZodNumber;
        frames: z.ZodNumber;
        step: z.ZodOptional<z.ZodNumber>;
        maxDimension: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    frames: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    outPath: z.ZodString;
    useDisplayStartTime: z.ZodOptional<z.ZodBoolean>;
    colorManaged: z.ZodOptional<z.ZodEnum<{
        auto: "auto";
        off: "off";
    }>>;
    settleTimeoutMs: z.ZodOptional<z.ZodNumber>;
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
            capture: "capture";
            output: "output";
        }>>;
    }, z.core.$strip>>;
    histogram: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodObject<{
        bins: z.ZodOptional<z.ZodNumber>;
        stage: z.ZodOptional<z.ZodEnum<{
            capture: "capture";
            output: "output";
        }>>;
    }, z.core.$strip>]>>;
    compare: z.ZodOptional<z.ZodObject<{
        from: z.ZodOptional<z.ZodNumber>;
        to: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    edge: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodObject<{
        from: z.ZodOptional<z.ZodEnum<{
            alpha: "alpha";
            luma: "luma";
        }>>;
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
    look: z.ZodOptional<z.ZodObject<{
        regions: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            x: z.ZodNumber;
            y: z.ZodNumber;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            role: z.ZodOptional<z.ZodEnum<{
                neutral: "neutral";
                skin: "skin";
                plate: "plate";
                element: "element";
            }>>;
        }, z.core.$strip>>;
        pairs: z.ZodOptional<z.ZodArray<z.ZodObject<{
            element: z.ZodString;
            plate: z.ZodString;
        }, z.core.$strip>>>;
        minContrast: z.ZodOptional<z.ZodNumber>;
        grainTolerance: z.ZodOptional<z.ZodNumber>;
        sharpnessTolerance: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    diff: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodObject<{
        changeAbove: z.ZodOptional<z.ZodNumber>;
        spikeRatio: z.ZodOptional<z.ZodNumber>;
        holdRatio: z.ZodOptional<z.ZodNumber>;
        quietBelow: z.ZodOptional<z.ZodNumber>;
        movingShare: z.ZodOptional<z.ZodNumber>;
        window: z.ZodOptional<z.ZodNumber>;
        amplify: z.ZodOptional<z.ZodNumber>;
        repeatBelow: z.ZodOptional<z.ZodNumber>;
        sheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodObject<{
            columns: z.ZodOptional<z.ZodNumber>;
            thumbWidth: z.ZodOptional<z.ZodNumber>;
            outPath: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>]>>;
    }, z.core.$strip>]>>;
}>;
//# sourceMappingURL=render-frame.d.ts.map
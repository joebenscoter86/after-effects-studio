import { z } from "zod";
export declare function readLibrary(document?: string, query?: string, root?: string): {
    startHere: string[];
    documents: {
        id: string;
        title: string;
        kind: string;
    }[];
    modules: {
        id: string;
        kind: "style" | "foundation" | "capability";
        title: string;
        summary: string;
        entryDocument: string;
        requires: string[];
        tags: string[];
        evidence: import("./library-modules.js").Evidence;
    }[];
    document?: undefined;
    title?: undefined;
    kind?: undefined;
    content?: undefined;
} | {
    document: string;
    title: string;
    kind: string;
    content: string;
    startHere?: undefined;
    documents?: undefined;
    modules?: undefined;
};
export declare const libraryTool: import("./define-tool.js").ToolSpec<{
    document: z.ZodOptional<z.ZodString>;
    query: z.ZodOptional<z.ZodString>;
}>;
//# sourceMappingURL=library.d.ts.map
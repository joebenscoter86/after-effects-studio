import { z } from "zod";
type Entry = {
    id: string;
    title: string;
    path: string;
    sha256: string;
    kind: string;
};
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
/** One document's manifest entry and its checked text. */
export declare function readLibraryEntry(document: string, root?: string): {
    entry: Entry;
    content: string;
};
/**
 * A document reply: text only (see library-parts.ts for why there is no structured part), its first line the
 * document's id, kind, size and sha256. Whole when it fits in one reply, else the outline and opening; with
 * `section`, the sections asked for.
 */
export declare function libraryDocumentReply(document: string, section?: string | string[], root?: string): string;
export declare const libraryTool: import("./define-tool.js").ToolSpec<{
    document: z.ZodOptional<z.ZodString>;
    query: z.ZodOptional<z.ZodString>;
    section: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
}>;
export {};
//# sourceMappingURL=library.d.ts.map
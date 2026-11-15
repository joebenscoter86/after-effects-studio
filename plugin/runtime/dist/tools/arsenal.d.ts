import { z } from "zod";
export type ArsenalRecipe = {
    id: string;
    revision: string;
    name: string;
    line: string;
    status: "proven" | "unproven";
    kind: "technique" | "build-aid" | "unmatched";
    job: string | null;
    support: string[];
    mood: string[];
    needs: string[];
    duration: number | string | null;
    motion: string | null;
    difficulty: number | null;
    taught_by: number;
    section: {
        document: string;
        heading: string;
    };
    still: {
        path: string;
        sha256: string;
    } | null;
};
export type ArsenalCatalog = {
    vocab: string;
    version: string;
    jobs: string[];
    recipes: ArsenalRecipe[];
};
export type BeatAsk = {
    vocab?: string;
    job: string;
    support?: string[];
    duration?: number;
    takeaway?: string;
    mood?: string[];
    assets?: Record<string, unknown> | string[] | "none";
    constraints?: {
        aspect?: string;
        theme?: string;
        palette?: string;
        status?: "proven" | "any";
    };
    exclude?: string[];
    limit?: number;
};
export type Candidate = Pick<ArsenalRecipe, "id" | "revision" | "name" | "line" | "status" | "needs" | "duration" | "motion" | "section"> & {
    still: string | null;
    fit: string;
};
export type FindAnswer = {
    vocab: string;
    version: string;
    results: Candidate[];
    relaxed?: string[];
};
/** A refusal the asker can act on (an unknown job, another vocab); the message says what is valid. */
export declare class ArsenalRefusal extends Error {
}
/** Per beat: a ranked shortlist. Refuses another vocab or an unknown job id; never guesses one. */
export declare function findTechniques(catalog: ArsenalCatalog, ask: BeatAsk): FindAnswer;
export declare function loadCatalog(root?: string): ArsenalCatalog;
/** The job vocabulary: each job's id, group, name and one-line definition, and the two tags that are not jobs. */
export declare function listJobs(root?: string): {
    vocab: string;
    groups: Record<string, string>;
    jobs: {
        id: string;
        group: string;
        name: string;
        definition: string;
    }[];
    tags: Record<string, string>;
};
/** One recipe's full text as a reply: a header line with id@revision, a warning when a pinned revision differs. */
export declare function recipeReply(id: string, revision: string | undefined, root?: string): string;
export declare const arsenalTool: import("./define-tool.js").ToolSpec<{
    action: z.ZodEnum<{
        find: "find";
        get: "get";
        jobs: "jobs";
    }>;
    vocab: z.ZodOptional<z.ZodString>;
    job: z.ZodOptional<z.ZodString>;
    support: z.ZodOptional<z.ZodArray<z.ZodString>>;
    duration: z.ZodOptional<z.ZodNumber>;
    takeaway: z.ZodOptional<z.ZodString>;
    mood: z.ZodOptional<z.ZodArray<z.ZodString>>;
    assets: z.ZodOptional<z.ZodUnion<readonly [z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodArray<z.ZodString>, z.ZodLiteral<"none">]>>;
    constraints: z.ZodOptional<z.ZodObject<{
        aspect: z.ZodOptional<z.ZodString>;
        theme: z.ZodOptional<z.ZodString>;
        palette: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            any: "any";
            proven: "proven";
        }>>;
    }, z.core.$strip>>;
    exclude: z.ZodOptional<z.ZodArray<z.ZodString>>;
    limit: z.ZodOptional<z.ZodNumber>;
    id: z.ZodOptional<z.ZodString>;
    revision: z.ZodOptional<z.ZodString>;
}>;
//# sourceMappingURL=arsenal.d.ts.map
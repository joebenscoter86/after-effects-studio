import { z } from "zod";
export declare const LEVELS: readonly ["direction", "world", "recipe"];
export type Level = (typeof LEVELS)[number];
/** One catalog entry at any level. A recipe has a job (or is a build aid); a style is a direction or a world. */
export type ArsenalEntry = {
    id: string;
    revision: string;
    name: string;
    line: string;
    status: "proven" | "unproven";
    kind: "technique" | "build-aid" | "unmatched" | "style";
    level: Level;
    /** Other levels the entry serves (a world that is also a direction). */
    also_level?: Level[];
    /** What the entry gives a piece, "key" or "key: word", from the catalog's provides vocabulary. */
    provides: string[];
    cost: {
        renderer: "classic" | "advanced-3d" | "blender";
        seconds_per_frame?: number;
        measured?: string;
    };
    composes: string[];
    shelf: "shipped" | "user";
    good_for?: string;
    /** Why an entry has no still; browse hides it unless asked. */
    no_still?: string;
    job: string | null;
    support: string[];
    mood: string[];
    needs: string[];
    duration: number | string | null;
    motion: string | null;
    difficulty: number | null;
    taught_by: number;
    /** Only on a variant: the id of the entry it is a variant of. */
    variant_of?: string;
    /** The ids of this entry's variants; empty when it has none. */
    variants: string[];
    section: {
        document: string;
        heading: string | null;
    };
    still: {
        path: string;
        sha256: string;
    } | null;
};
/** A recipe entry: the name the job query and its tests use. */
export type ArsenalRecipe = ArsenalEntry;
export type ArsenalCatalog = {
    vocab: string;
    version: string;
    jobs: string[];
    levels?: readonly Level[];
    provides?: Record<string, string[]>;
    entries: ArsenalEntry[];
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
    variants?: string[];
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
/** "material: glass" -> ["material", "glass"]; "depth" -> ["depth", null]; anything else null. */
export declare function parseProvides(p: string): [string, string | null] | null;
export declare const atLevel: (e: ArsenalEntry, level: Level) => boolean;
export type ProvidesAsk = {
    level?: string;
    provides?: string[];
    shelf?: "shipped" | "user";
    status?: "proven" | "any";
    exclude?: string[];
    limit?: number;
};
export type EntrySummary = Pick<ArsenalEntry, "id" | "revision" | "level" | "also_level" | "name" | "line" | "status" | "kind" | "provides" | "needs" | "cost" | "section"> & {
    still: string | null;
    fit: string;
    variants?: string[];
};
export type ProvidesAnswer = {
    vocab: string;
    version: string;
    results: EntrySummary[];
    relaxed?: string[];
};
/**
 * Entries across levels by what they provide and/or by level. Proven only unless status is any (relaxed when that
 * leaves nothing). Ranked by how many asked provides an entry gives, then with a still before without, then catalog
 * order; never by a preferred look. A variant stands behind its parent.
 */
export declare function findByProvides(catalog: ArsenalCatalog, ask: ProvidesAsk): ProvidesAnswer;
export type BrowseAsk = {
    level?: string;
    provides?: string[];
    shelf?: "shipped" | "user";
    page?: number;
    page_size?: number;
    include_unpictured?: boolean;
};
export type BrowseTile = {
    n: number;
    id: string;
    name: string;
    level: Level;
    also_level?: Level[];
    provides: string[];
    status: ArsenalEntry["status"];
    no_still?: string;
};
export type BrowsePage = {
    vocab: string;
    version: string;
    level: Level | "all";
    provides?: string[];
    page: number;
    pages: number;
    page_size: number;
    total: number;
    hidden_without_still: number;
    tiles: BrowseTile[];
};
export declare const BROWSE_PAGE = 12;
export declare const BROWSE_PAGE_MAX = 24;
/**
 * One page of a level (or every level, directions first) as tiles: id, name and provides for each, in catalog order.
 * Entries with no still are hidden unless include_unpictured, and counted. A variant stands behind its parent.
 */
export declare function browseCatalog(catalog: ArsenalCatalog, ask?: BrowseAsk): BrowsePage;
export declare function loadCatalog(root?: string): ArsenalCatalog;
/** The job vocabulary (each job's id, group, name and one-line definition, and the two tags that are not jobs), the levels and the provides vocabulary. */
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
    levels: readonly ("world" | "direction" | "recipe")[];
    provides: Record<string, string[]>;
};
/** One recipe's full text as a reply: a header line with id@revision, a warning when a pinned revision differs. */
export declare function recipeReply(id: string, revision: string | undefined, root?: string): string;
export declare const arsenalTool: import("./define-tool.js").ToolSpec<{
    action: z.ZodEnum<{
        find: "find";
        browse: "browse";
        get: "get";
        jobs: "jobs";
    }>;
    level: z.ZodOptional<z.ZodEnum<{
        world: "world";
        direction: "direction";
        recipe: "recipe";
    }>>;
    provides: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
    shelf: z.ZodOptional<z.ZodEnum<{
        user: "user";
        shipped: "shipped";
    }>>;
    page: z.ZodOptional<z.ZodNumber>;
    page_size: z.ZodOptional<z.ZodNumber>;
    include_unpictured: z.ZodOptional<z.ZodBoolean>;
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
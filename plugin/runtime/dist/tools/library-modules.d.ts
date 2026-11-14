/** Pure catalog validation. File access belongs to the library reader. */
export type InputSpec = {
    name: string;
    required: boolean;
    default: string | null;
    constraints: string;
};
export type Evidence = {
    technical: 'not-tested' | 'passed' | 'failed';
    visual: 'not-reviewed' | 'accepted' | 'revision-needed';
    reports: string[];
};
export type Module = {
    id: string;
    kind: 'foundation' | 'capability' | 'style';
    title: string;
    summary: string;
    tags: string[];
    whenToUse: string[];
    whenNotToUse: string[];
    entryDocument: string;
    requires: string[];
    documents: string[];
    compatibleWith: string[];
    inputs: InputSpec[];
    assetRequirements: string[];
    fontRequirements: string[];
    fallbacks: string[];
    examples: string[];
    reviewChecks: string[];
    provenanceRefs: string[];
    evidence: Evidence;
};
export type Catalog = {
    schemaVersion: 1;
    modules: Module[];
};
export type Refs = {
    documentIds: Set<string>;
    provenanceIds: Set<string>;
};
/** Only portable repository report paths or public HTTPS references are allowed. */
export declare function isReportReference(value: string): boolean;
export declare function validateCatalog(raw: unknown, refs: Refs): Catalog;
/**
 * A library query's words: lower-cased, split on whitespace and on punctuation other than "-" and ".",
 * each word once. A one-word query gives that word, so it matches exactly as the whole query did.
 */
export declare function queryWords(query?: string): string[];
/** The query words a module matches in its id, title, summary or tags. */
export declare function moduleWords(m: Module, words: string[]): string[];
/** Every module with no query; otherwise those matching at least one of its words, in catalog order. */
export declare function findModules(catalog: Catalog, query?: string): Module[];
//# sourceMappingURL=library-modules.d.ts.map
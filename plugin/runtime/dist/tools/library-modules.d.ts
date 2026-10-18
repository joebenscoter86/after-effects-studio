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
export declare function findModules(catalog: Catalog, query?: string): Module[];
//# sourceMappingURL=library-modules.d.ts.map
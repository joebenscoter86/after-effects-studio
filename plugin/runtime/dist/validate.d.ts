export interface ValidationIssue {
    path: string;
    message: string;
}
export interface ValidationResult {
    ok: boolean;
    issues: ValidationIssue[];
    warnings: ValidationIssue[];
}
export declare function validateAeProjectDoc(doc: unknown): ValidationResult;
//# sourceMappingURL=validate.d.ts.map
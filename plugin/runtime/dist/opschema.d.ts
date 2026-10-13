import type { Operation, OperationParam } from "./registry.js";
export interface ArgIssue {
    path: string;
    message: string;
}
export type ValidateOpArgsResult = {
    ok: true;
    value: Record<string, unknown>;
} | {
    ok: false;
    issues: ArgIssue[];
};
/** Human-readable type of a received value, for the error message. */
export declare function describeValue(v: unknown): string;
/**
 * Nearest declared name for a key the caller got wrong, or null when nothing
 * is close enough to be worth suggesting. The threshold scales with name
 * length so short names don't collect nonsense suggestions.
 */
export declare function suggestName(key: string, candidates: readonly string[]): string | null;
/** Compact `name: type (required)` summary, attached to every INVALID_ARGS error. */
export declare function summarizeParams(params: readonly OperationParam[]): string[];
/**
 * Validate `raw` against an operation's declared parameters.
 *
 * Checks, in order: the args container is an object, every required parameter
 * is present, every present value matches its declared type, and no unknown
 * keys were passed. Defaults are deliberately NOT filled in here — `toJsx` is
 * the single place an operation applies them.
 */
export declare function validateOpArgs(op: Operation, raw: unknown): ValidateOpArgsResult;
//# sourceMappingURL=opschema.d.ts.map
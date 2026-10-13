import type { Operation } from "./registry.js";
/**
 * How a tool is presented to MCP clients that gate on behaviour hints.
 * Orthogonal to `blockedInReadOnly`: `ae_render_frame` writes a PNG (so it is not
 * a pure read) but never touches the project (so read-only mode allows it).
 */
export type ToolEffect = "read" | "write" | "destructive";
export interface Denial {
    message: string;
    hint?: string;
}
export declare function evalRunEnabled(): boolean;
export declare function readOnlyMode(): boolean;
/** Parsed AE_MCP_ALLOW_CATEGORIES, or null when no allowlist is configured. */
export declare function allowedCategories(): Set<string> | null;
/** Non-null when this operation must be refused under the current policy. */
export declare function denyOperation(op: Operation): Denial | null;
/**
 * Denial for an operation that is not in the registry *because* the config
 * withheld it, rather than because the name is wrong.
 *
 * `eval.run` is only imported when the opt-in is set, so a plain registry miss
 * would report UNKNOWN_OPERATION with a spelling suggestion — which reads as
 * "no such feature" and hides the fact that there is a switch. Callers check
 * this before falling back to the unknown-name path.
 */
export declare function denyUnregisteredOperation(name: string): Denial | null;
/** Same idea at category granularity, for `ae_catalog({ category })`. */
export declare function denyUnregisteredCategory(category: string): Denial | null;
/** Non-null when this tool must not be registered under the current policy. */
export declare function denyTool(name: string, blockedInReadOnly: boolean): Denial | null;
/** One-line description of the active policy, for the startup banner. */
export declare function policySummary(): string;
//# sourceMappingURL=policy.d.ts.map
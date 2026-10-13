import type { ToolResult } from "./tools/types.js";
export type AeErrorCode = 
/** After Effects could not be located on this machine. */
"AE_NOT_FOUND"
/**
 * No running After Effects instance can take the call: the one named by
 * AE_MCP_INSTANCE has no live agent, several are live and none was named,
 * or the push launch started a throwaway instance instead of reaching one.
 */
 | "NO_INSTANCE"
/**
 * After Effects is showing a modal dialog, so no script can run until
 * someone closes it. `details.dialogs` lists what it says (Windows and
 * macOS; on macOS the text needs Accessibility permission).
 */
 | "DIALOG_OPEN"
/** macOS denied this host permission to send Apple events to AE. */
 | "AUTOMATION_DENIED"
/** AE never wrote a response before the deadline. */
 | "TIMEOUT"
/** Node-side failure: spawn, filesystem, JSON write. */
 | "TRANSPORT"
/** dispatcher.jsx failed before it could run our code. */
 | "DISPATCHER"
/** The generated ExtendScript threw inside AE. */
 | "JSX_THROW"
/** The operation ran to completion and reported `{ ok: false }`. */
 | "OPERATION_FAILED"
/** No operation with that name (or it is filtered out by policy). */
 | "UNKNOWN_OPERATION"
/** No such operation category. */
 | "UNKNOWN_CATEGORY"
/** Arguments failed the operation's parameter schema. */
 | "INVALID_ARGS"
/** A project JSON document failed schema validation. */
 | "VALIDATION"
/** Blocked by AE_MCP_READONLY / AE_MCP_ALLOW_CATEGORIES / missing AE_MCP_ENABLE_EVAL. */
 | "FORBIDDEN"
/** Node-side read/write of a path the caller supplied. */
 | "IO";
export declare function isRetryable(code: AeErrorCode): boolean;
export interface AeErrorExtra {
    /** Machine-readable specifics: offending args, valid alternatives, issues. */
    details?: Record<string, unknown>;
    /** ExtendScript stack, when AE gave us one. */
    stack?: string | null;
    /** Breadcrumbs pushed via `log()` before the failure. */
    logs?: string[];
    durationMs?: number;
    /** Human-facing next step, when there is a concrete one. */
    hint?: string;
}
export interface AeErrorEnvelope {
    ok: false;
    error: {
        code: AeErrorCode;
        message: string;
        retryable: boolean;
    } & AeErrorExtra;
}
export declare function errorEnvelope(code: AeErrorCode, message: string, extra?: AeErrorExtra): AeErrorEnvelope;
/** Build a complete MCP ToolResult for a failure. */
export declare function errorResult(code: AeErrorCode, message: string, extra?: AeErrorExtra): ToolResult;
//# sourceMappingURL=errors.d.ts.map
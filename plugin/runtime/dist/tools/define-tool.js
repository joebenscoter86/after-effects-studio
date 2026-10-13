import { errorResult } from "../errors.js";
/**
 * Typed tool factory. Infers the handler's argument type from `inputShape`
 * so every tool definition stays short and consistent.
 */
export function defineTool(spec) {
    return spec;
}
/** Wraps a successful payload into a standard MCP ToolResult. */
export function jsonResult(payload) {
    const envelope = { ok: true, ...payload };
    return {
        content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }],
        structuredContent: envelope,
        isError: false,
    };
}
/**
 * Our JSX convention is that an operation reports application-level failure by
 * RETURNING `{ ok: false, error }` — the script itself ran fine, so the
 * transport reports success. Every caller must therefore look one level down,
 * or a "comp not found" reads as a successful render.
 */
export function jsxReportedFailure(result) {
    if (result === null || typeof result !== "object" || Array.isArray(result))
        return null;
    const r = result;
    if (r.ok !== false)
        return null;
    return { error: typeof r.error === "string" ? r.error : "operation reported ok: false" };
}
/**
 * Converts a transport-level EvalResult (the parsed dispatcher response) into
 * an MCP ToolResult, mapping all three failure layers — transport, dispatcher,
 * and the operation's own `{ ok: false }` — onto the unified error envelope.
 */
export function toMcpResult(result) {
    if (!result.ok) {
        return errorResult(result.errorCode ?? "TRANSPORT", result.error ?? "unknown failure", {
            ...(result.dialogs?.length ? { details: { dialogs: result.dialogs } } : {}),
            stack: result.stack,
            logs: result.logs,
            durationMs: result.durationMs,
        });
    }
    const reported = jsxReportedFailure(result.result);
    if (reported) {
        return errorResult("OPERATION_FAILED", reported.error, {
            details: { result: result.result },
            logs: result.logs,
            durationMs: result.durationMs,
        });
    }
    return jsonResult({
        result: result.result,
        logs: result.logs,
        durationMs: result.durationMs,
    });
}
//# sourceMappingURL=define-tool.js.map
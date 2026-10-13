// Unified error envelope.
//
// Failures reach the model from four different layers — the Node transport,
// the dispatcher, the ExtendScript we generated, and the operation's own
// `{ ok: false }` return — and used to arrive in four different shapes. Every
// tool now reports failure as:
//
//   { ok: false, error: { code, message, retryable, ... } }
//
// so the model can branch on `code` instead of pattern-matching prose: inspect
// after TIMEOUT, fix the arguments (INVALID_ARGS), pick another operation
// (UNKNOWN_OPERATION), or stop and tell the user (AE_NOT_FOUND, FORBIDDEN).
/** No error code alone proves that an identical AE write is safe to replay. */
const RETRYABLE = new Set();
export function isRetryable(code) {
    return RETRYABLE.has(code);
}
export function errorEnvelope(code, message, extra = {}) {
    const error = {
        code,
        message,
        retryable: isRetryable(code),
    };
    const hint = extra.hint ?? (code === "TIMEOUT"
        ? "Inspect the actual After Effects project state before retrying. A write may already have completed."
        : undefined);
    if (hint !== undefined)
        error.hint = hint;
    if (extra.details !== undefined)
        error.details = extra.details;
    if (extra.stack !== undefined && extra.stack !== null)
        error.stack = extra.stack;
    if (extra.logs !== undefined && extra.logs.length > 0)
        error.logs = extra.logs;
    if (extra.durationMs !== undefined)
        error.durationMs = extra.durationMs;
    return { ok: false, error };
}
/** Build a complete MCP ToolResult for a failure. */
export function errorResult(code, message, extra = {}) {
    const envelope = errorEnvelope(code, message, extra);
    const lines = [`[${code}] ${message}`];
    if (envelope.error.hint)
        lines.push(`hint: ${envelope.error.hint}`);
    if (envelope.error.details)
        lines.push(JSON.stringify(envelope.error.details, null, 2));
    if (envelope.error.stack)
        lines.push(envelope.error.stack);
    return {
        content: [{ type: "text", text: lines.join("\n") }],
        structuredContent: envelope,
        isError: true,
    };
}
//# sourceMappingURL=errors.js.map
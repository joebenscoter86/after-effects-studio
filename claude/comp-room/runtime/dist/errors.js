const RETRYABLE = /* @__PURE__ */ new Set();
function isRetryable(code) {
  return RETRYABLE.has(code);
}
function errorEnvelope(code, message, extra = {}) {
  const error = {
    code,
    message,
    retryable: isRetryable(code)
  };
  const hint = extra.hint ?? (code === "TIMEOUT" ? "Inspect the actual After Effects project state before retrying. A write may already have completed." : void 0);
  if (hint !== void 0) error.hint = hint;
  if (extra.details !== void 0) error.details = extra.details;
  if (extra.stack !== void 0 && extra.stack !== null) error.stack = extra.stack;
  if (extra.logs !== void 0 && extra.logs.length > 0) error.logs = extra.logs;
  if (extra.durationMs !== void 0) error.durationMs = extra.durationMs;
  return { ok: false, error };
}
function errorResult(code, message, extra = {}) {
  const envelope = errorEnvelope(code, message, extra);
  const lines = [`[${code}] ${message}`];
  if (envelope.error.hint) lines.push(`hint: ${envelope.error.hint}`);
  if (envelope.error.details) lines.push(JSON.stringify(envelope.error.details, null, 2));
  if (envelope.error.stack) lines.push(envelope.error.stack);
  return {
    content: [{ type: "text", text: lines.join("\n") }],
    structuredContent: envelope,
    isError: true
  };
}
export {
  errorEnvelope,
  errorResult,
  isRetryable
};

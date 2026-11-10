import { errorResult } from "../errors.js";
function defineTool(spec) {
  return spec;
}
function jsonResult(payload) {
  const envelope = { ok: true, ...payload };
  return {
    content: [{ type: "text", text: JSON.stringify(envelope, null, 2) }],
    structuredContent: envelope,
    isError: false
  };
}
function jsxReportedFailure(result) {
  if (result === null || typeof result !== "object" || Array.isArray(result)) return null;
  const r = result;
  if (r.ok !== false) return null;
  return { error: typeof r.error === "string" ? r.error : "operation reported ok: false" };
}
function toMcpResult(result) {
  if (!result.ok) {
    return errorResult(result.errorCode ?? "TRANSPORT", result.error ?? "unknown failure", {
      ...result.dialogs?.length ? { details: { dialogs: result.dialogs } } : {},
      stack: result.stack,
      logs: result.logs,
      durationMs: result.durationMs
    });
  }
  const reported = jsxReportedFailure(result.result);
  if (reported) {
    return errorResult("OPERATION_FAILED", reported.error, {
      details: { result: result.result },
      logs: result.logs,
      durationMs: result.durationMs
    });
  }
  return jsonResult({
    result: result.result,
    logs: result.logs,
    durationMs: result.durationMs
  });
}
export {
  defineTool,
  jsonResult,
  jsxReportedFailure,
  toMcpResult
};

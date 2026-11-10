function evalRunEnabled() {
  if (readOnlyMode()) return false;
  return process.env.AE_MCP_ENABLE_EVAL === "1";
}
function readOnlyMode() {
  return process.env.AE_MCP_READONLY === "1";
}
function allowedCategories() {
  const raw = process.env.AE_MCP_ALLOW_CATEGORIES?.trim();
  if (!raw) return null;
  const categories = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return categories.length > 0 ? new Set(categories) : null;
}
function denyOperation(op) {
  if (readOnlyMode() && !op.readOnly) {
    return {
      message: `operation '${op.name}' modifies the project and AE_MCP_READONLY=1 is set`,
      hint: "Unset AE_MCP_READONLY to allow mutations, or use a read-only operation (ae_catalog lists only those while read-only mode is on)."
    };
  }
  const allowed = allowedCategories();
  if (allowed && !allowed.has(op.category)) {
    return {
      message: `operation category '${op.category}' is not in AE_MCP_ALLOW_CATEGORIES`,
      hint: `Allowed categories: ${Array.from(allowed).sort().join(", ")}`
    };
  }
  if (op.category === "eval" && !evalRunEnabled()) return EVAL_DENIAL;
  return null;
}
const EVAL_DENIAL = {
  message: "eval.run is disabled on this server",
  hint: "Set AE_MCP_ENABLE_EVAL=1 (and unset AE_MCP_READONLY) to allow arbitrary ExtendScript, or use a dedicated operation from ae_catalog."
};
function denyUnregisteredOperation(name) {
  return name === "eval.run" && !evalRunEnabled() ? EVAL_DENIAL : null;
}
function denyUnregisteredCategory(category) {
  return category === "eval" && !evalRunEnabled() ? EVAL_DENIAL : null;
}
function denyTool(name, blockedInReadOnly) {
  if (readOnlyMode() && blockedInReadOnly) {
    return {
      message: `tool '${name}' modifies the project and AE_MCP_READONLY=1 is set`,
      hint: "Unset AE_MCP_READONLY to allow mutations."
    };
  }
  return null;
}
function policySummary() {
  const parts = [];
  parts.push(readOnlyMode() ? "readonly=ON (no project mutations)" : "readonly=off");
  const allowed = allowedCategories();
  parts.push(allowed ? `categories=${Array.from(allowed).sort().join("|")}` : "categories=all");
  parts.push(evalRunEnabled() ? "eval.run=ENABLED" : "eval.run=disabled");
  return parts.join(", ");
}
export {
  allowedCategories,
  denyOperation,
  denyTool,
  denyUnregisteredCategory,
  denyUnregisteredOperation,
  evalRunEnabled,
  policySummary,
  readOnlyMode
};

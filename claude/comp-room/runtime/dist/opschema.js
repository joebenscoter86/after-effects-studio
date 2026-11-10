function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function typeMatches(type, v) {
  switch (type) {
    case "string":
      return typeof v === "string";
    case "number":
      return typeof v === "number" && Number.isFinite(v);
    case "boolean":
      return typeof v === "boolean";
    case "array":
      return Array.isArray(v);
    case "object":
      return isPlainObject(v);
    case "any":
      return true;
  }
}
function describeValue(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "number" && !Number.isFinite(v)) return "non-finite number";
  return typeof v;
}
function levenshtein(a, b) {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  const curr = Array.from({ length: b.length + 1 }, () => 0);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}
function suggestName(key, candidates) {
  const lowered = key.toLowerCase();
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const distance = levenshtein(lowered, candidate.toLowerCase());
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  if (best === null) return null;
  const budget = Math.max(1, Math.floor(Math.max(key.length, best.length) * 0.4));
  return bestDistance <= budget ? best : null;
}
function summarizeParams(params) {
  return params.map(
    (p) => `${p.name}: ${p.type} (${p.required ? "required" : "optional"}${p.nullable ? ", nullable" : ""})`
  );
}
function validateOpArgs(op, raw) {
  if (raw === void 0 || raw === null) raw = {};
  if (!isPlainObject(raw)) {
    return {
      ok: false,
      issues: [{ path: "args", message: `must be an object, got ${describeValue(raw)}` }]
    };
  }
  const issues = [];
  const declared = op.params;
  const declaredNames = declared.map((p) => p.name);
  for (const param of declared) {
    const value = raw[param.name];
    if (value === void 0) {
      if (param.required) {
        issues.push({
          path: param.name,
          message: `missing required parameter (${param.type}) \u2014 ${param.description}`
        });
      }
      continue;
    }
    if (value === null) {
      if (!param.nullable && param.type !== "any") {
        issues.push({
          path: param.name,
          message: `must be ${param.type}, got null \u2014 omit the key instead of passing null`
        });
      }
      continue;
    }
    if (!typeMatches(param.type, value)) {
      issues.push({
        path: param.name,
        message: `must be ${param.type}, got ${describeValue(value)}`
      });
    }
  }
  for (const key of Object.keys(raw)) {
    if (declaredNames.includes(key)) continue;
    if (raw[key] === void 0) continue;
    const suggestion = suggestName(key, declaredNames);
    issues.push({
      path: key,
      message: suggestion ? `unknown parameter \u2014 did you mean '${suggestion}'?` : `unknown parameter (this operation accepts: ${declaredNames.join(", ") || "no parameters"})`
    });
  }
  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: raw };
}
export {
  describeValue,
  suggestName,
  summarizeParams,
  validateOpArgs
};

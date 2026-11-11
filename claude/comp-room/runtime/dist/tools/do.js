import { z } from "zod";
import { errorResult } from "../errors.js";
import { summarizeParams, suggestName, validateOpArgs } from "../opschema.js";
import { denyOperation, denyUnregisteredOperation } from "../policy.js";
import {
  AMBIENT_CONTEXT_JSX,
  denyAppConfig,
  getOp,
  listOps,
  prepareOp,
  wantsDialogSuppression,
  wantsRollback,
  wantsUndoGroup
} from "../registry.js";
import { defineTool, jsonResult, jsxReportedFailure } from "./define-tool.js";
const doTool = defineTool({
  name: "ae_do",
  title: "Execute operation",
  description: "Execute an atomic operation by name (from ae_catalog). Operations can create, change and delete project content; open, close, clear and save projects; render and write files; run After Effects menu commands; change After Effects preferences; start or stop After Effects instances; read and close dialogs that block scripting; and, through eval.run when enabled, run custom ExtendScript with the user's own access to After Effects, files and system commands. Arguments are validated against the operation's declared parameters before anything reaches AE. Have more than one operation to run? Wrap them in ONE batch.run instead of several ae_do calls \u2014 read/verify steps (comp.info, layer.info, render.frame) can ride in the same batch. Every call is automatically wrapped in ONE undo group: a single Ctrl+Z (or project.undo) reverts the entire call, and a batch.run counts as one call. If a call that changes the project THROWS, its own changes are rolled back before the error is returned (one undo, with dialogs suppressed); details.rollback says whether that worked and what is left if not. eval.run and batch.run take rollback: false to keep a partial result. Never call app.beginUndoGroup/endUndoGroup in eval.run code \u2014 the wrapper already did. The exception is undo/redo itself (project.undo, project.redo, command.execute id 16/2035): those run outside the group, with dialogs suppressed, report any error After Effects raised, and cannot ride inside a batch.run. Response includes ambient context (active comp, selected layers, project state) at zero extra round trips. Example: ae_do({ operation: 'keyframe.add', args: { comp: 'Main', layer: 1, property: ['Transform','Position'], time: 2, value: [960,540] } })",
  group: "operations",
  // NOT withheld in read-only mode: ae_do is the only way to reach the
  // read-only operations, and withholding it would leave ae_catalog listing
  // operations nothing can execute. Gating happens per operation below, via
  // denyOperation(). The destructive annotation still reflects the worst case
  // rather than leaving clients to guess from an absent hint.
  blockedInReadOnly: false,
  effect: "destructive",
  inputShape: {
    operation: z.string().describe("Operation name from ae_catalog (e.g. 'layer.create_solid', 'keyframe.add')."),
    args: z.record(z.string(), z.unknown()).optional().describe(
      "Arguments for the operation. Validated against ae_catalog's declared params: missing required args, wrong types, and unknown keys are rejected before AE is contacted. Omit for zero-param operations."
    ),
    timeoutMs: z.number().int().positive().optional().describe(
      "Per-call timeout in milliseconds (default 60000). Raise for long operations like render.start or big batch.run calls."
    )
  },
  handler: async (doArgs, transport) => {
    const op = getOp(doArgs.operation);
    if (!op) {
      const withheld = denyUnregisteredOperation(doArgs.operation);
      if (withheld) {
        return errorResult("FORBIDDEN", withheld.message, {
          details: { operation: doArgs.operation },
          hint: withheld.hint
        });
      }
      const suggestion = suggestName(
        doArgs.operation,
        listOps().map((o) => o.name)
      );
      return errorResult("UNKNOWN_OPERATION", `unknown operation '${doArgs.operation}'`, {
        details: { operation: doArgs.operation, suggestion },
        hint: suggestion ? `Did you mean '${suggestion}'? Use ae_catalog to list operations.` : "Use ae_catalog to discover available operations."
      });
    }
    const denial = denyOperation(op);
    if (denial) {
      return errorResult("FORBIDDEN", denial.message, {
        details: { operation: op.name, category: op.category },
        hint: denial.hint
      });
    }
    const validated = validateOpArgs(op, doArgs.args);
    if (!validated.ok) {
      return errorResult(
        "INVALID_ARGS",
        `invalid arguments for '${op.name}': ` + validated.issues.map((i) => `${i.path} \u2014 ${i.message}`).join("; "),
        {
          details: {
            operation: op.name,
            issues: validated.issues,
            expected: summarizeParams(op.params)
          },
          hint: `ae_catalog({ category: '${op.category}' }) returns the full parameter reference.`
        }
      );
    }
    const consent = denyAppConfig(op, validated.value);
    if (consent) {
      return errorResult("FORBIDDEN", consent, {
        details: { operation: op.name, category: op.category },
        hint: "Ask the user first if they have not explicitly requested this change."
      });
    }
    const prepared = prepareOp(op, validated.value);
    if (!prepared.ok) {
      return errorResult("INVALID_ARGS", `invalid arguments for '${op.name}': ${prepared.error}`, {
        details: { operation: op.name },
        ...prepared.hint ? { hint: prepared.hint } : {}
      });
    }
    const opArgs = prepared.args;
    const sourceFile = prepared.source?.file ?? null;
    if (op.run) {
      const started = Date.now();
      let opResult2;
      try {
        opResult2 = await op.run(opArgs, transport);
      } catch (err) {
        return errorResult(
          "TRANSPORT",
          `${op.name}: ${err instanceof Error ? err.message : String(err)}`,
          {
            details: { operation: op.name },
            stack: err instanceof Error ? err.stack ?? null : null,
            durationMs: Date.now() - started
          }
        );
      }
      const reported2 = jsxReportedFailure(opResult2);
      if (reported2) {
        const extra = opResult2;
        return errorResult(extra.errorCode ?? "OPERATION_FAILED", `${op.name}: ${reported2.error}`, {
          details: { operation: op.name, result: opResult2 },
          durationMs: Date.now() - started,
          ...extra.hint ? { hint: extra.hint } : {}
        });
      }
      return jsonResult({
        result: opResult2,
        context: null,
        logs: [],
        durationMs: Date.now() - started
      });
    }
    const userJsx = op.toJsx(opArgs);
    const wrappedCode = `
        var _opResult = (function() {
            ${userJsx}
        })();
        ${AMBIENT_CONTEXT_JSX}
        return { result: _opResult, context: _ctx };
    `;
    const wrapperLinesAboveUserJsx = countLines(wrappedCode.slice(0, wrappedCode.indexOf(userJsx)));
    const result = await transport.execute({
      code: wrappedCode,
      label: op.name,
      // Undo/Redo opt out (Operation.undoGroup): they must reach AE with no
      // group open, or they resolve against this call's own group instead of
      // the previous call the caller means to revert.
      undoGroup: wantsUndoGroup(op, opArgs),
      // Undo/Redo now keep dialog suppression too: an undo once raised an
      // After Effects error box that blocked all scripting until a person
      // clicked it (2026-11-10). Operation.suppressDialogs can still opt out.
      suppressDialogs: wantsDialogSuppression(op, opArgs),
      // A throw inside the group is rolled back (Operation.rollback).
      rollback: wantsRollback(op, opArgs),
      // Only operations that declare the argument can pass it (unknown keys
      // are rejected above): eval.run, batch.run and the undo/redo ones.
      acceptRenderQueueRisk: opArgs.acceptRenderQueueRisk === true,
      timeoutMs: doArgs.timeoutMs ?? 6e4
    });
    if (!result.ok) {
      const location = jsxErrorLocation(result.line, wrappedCode, wrapperLinesAboveUserJsx, op.name, {
        userLines: countLines(userJsx) + 1,
        file: sourceFile
      });
      const message = callerLineMessage(result.error ?? "unknown failure", result.line, location) + rollbackSentence(result.rollback);
      return errorResult(result.errorCode ?? "TRANSPORT", message, {
        details: {
          operation: op.name,
          ...location,
          ...result.rollback ? { rollback: result.rollback } : {},
          ...result.dialogs?.length ? { dialogs: result.dialogs } : {}
        },
        stack: result.stack,
        logs: result.logs,
        durationMs: result.durationMs
      });
    }
    const { result: opResult, context } = result.result;
    const reported = jsxReportedFailure(opResult);
    if (reported) {
      return errorResult("OPERATION_FAILED", `${op.name}: ${reported.error}${rollbackSentence(result.rollback)}`, {
        details: {
          operation: op.name,
          result: opResult,
          context,
          ...result.rollback ? { rollback: result.rollback } : {}
        },
        logs: result.logs,
        durationMs: result.durationMs,
        ...isBatchShaped(opResult) ? {
          hint: "Inspect details.result.results \u2014 each entry matches the input order and carries its own error."
        } : {}
      });
    }
    return jsonResult({
      result: opResult,
      context,
      logs: result.logs,
      durationMs: result.durationMs,
      ...result.rollback ? { rollback: result.rollback } : {}
    });
  }
});
function rollbackSentence(rb) {
  if (!rb) return "";
  const errors = rb.aeErrors?.length ? ` After Effects reported during the undo: ${rb.aeErrors.join(" | ")}.` : "";
  if (rb.rolledBack) {
    const checked = rb.verified === "signature" ? "checked against the project's items before the call" : rb.verified === "partial" ? "checked against the first 1000 items and the item count" : "checked by the rollback marker only";
    return ` \u2014 Rolled back: the call's changes were undone before this error was returned (${checked}).${errors}`;
  }
  const next = rb.next ? ` Next: ${rb.next}` : "";
  if (!rb.attempted) {
    return ` \u2014 Not rolled back (${rb.reason ?? "no reason given"})${rb.left ? `: ${rb.left}` : ""}.${next}${errors}`;
  }
  return ` \u2014 NOT rolled back: ${rb.reason ?? "the rollback could not be confirmed"}. Left: ${rb.left ?? "unknown \u2014 inspect the project"}.${next}${errors}`;
}
function isBatchShaped(opResult) {
  if (opResult === null || typeof opResult !== "object") return false;
  return Array.isArray(opResult.results);
}
function countLines(text) {
  let n = 0;
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") n++;
  return n;
}
const NEW_FUNCTION_HEADER_LINES = 1;
function jsxErrorLocation(line, wrappedCode, wrapperLinesAboveUserJsx, opName, source) {
  if (typeof line !== "number" || !Number.isFinite(line)) return {};
  const wrappedLine = line - NEW_FUNCTION_HEADER_LINES;
  const out = { errorLine: line };
  const userLine = wrappedLine - wrapperLinesAboveUserJsx;
  if (opName === "eval.run") {
    if (userLine >= 1 && userLine <= source.userLines) {
      out.userCodeLine = userLine;
      if (source.file !== null) {
        out.file = source.file;
        out.fileLine = userLine;
      }
    } else {
      out.inWrapper = true;
    }
  }
  const lines = wrappedCode.split("\n");
  if (wrappedLine >= 1 && wrappedLine <= lines.length) {
    const from = Math.max(1, wrappedLine - 2);
    const to = Math.min(lines.length, wrappedLine + 2);
    const excerpt = [];
    for (let n = from; n <= to; n++) {
      excerpt.push(
        `${n === wrappedLine ? ">" : " "} ${n - wrapperLinesAboveUserJsx}| ${lines[n - 1]}`
      );
    }
    out.codeExcerpt = excerpt.join("\n");
  }
  return out;
}
function callerLineMessage(message, line, location) {
  if (typeof line !== "number") return message;
  const raw = `(line ${line})`;
  if (message.indexOf(raw) === -1) return message;
  let replacement = null;
  if (typeof location.fileLine === "number" && typeof location.file === "string") {
    replacement = `(${location.file}:${location.fileLine})`;
  } else if (typeof location.userCodeLine === "number") {
    replacement = `(line ${location.userCodeLine} of your code)`;
  } else if (location.inWrapper === true) {
    replacement = `(line ${line} of the plugin's wrapper, not your code \u2014 see details.codeExcerpt)`;
  }
  return replacement === null ? message : message.replace(raw, replacement);
}
export {
  doTool,
  rollbackSentence
};

import { summarizeParams, validateOpArgs } from "../opschema.js";
import { denyOperation, denyUnregisteredOperation } from "../policy.js";
import { denyAppConfig, getOp, jsxVal, registerOp, wantsUndoGroup } from "../registry.js";
registerOp({
  name: "batch.run",
  category: "batch",
  description: "Execute multiple operations in a single IPC call (~400ms total instead of 400ms \xD7 N). Operations run sequentially inside ONE undo group \u2014 a single Ctrl+Z reverts the whole batch, however many ops it contained. That group is also why undo/redo children (project.undo, command.execute id 16/2035) are rejected here: call those as their own ae_do. If one fails, subsequent ops still run unless stopOnError. Results array matches input order; the response reports how many failed. Mix in read/verify children \u2014 comp.info, layer.info, render.frame \u2014 to mutate AND verify in the same call, e.g. [...mutations, { operation: 'render.frame', args: { \u2026 } }].",
  params: [
    {
      name: "ops",
      type: "array",
      description: 'Array of { operation, args } objects, e.g. [{ "operation": "layer.create_solid", "args": { "comp": "Main", "color": [1,0,0] } }]',
      required: true
    },
    {
      name: "stopOnError",
      type: "boolean",
      description: "Stop executing remaining ops if one fails (default false)",
      required: false
    }
  ],
  // The wrapper itself mutates nothing; each child is gated individually below,
  // so a batch of read-only operations stays usable under AE_MCP_READONLY.
  readOnly: true,
  toJsx(args) {
    if (!Array.isArray(args.ops)) {
      return `
                return { ok: false, error: "ops must be an array" };
            `;
    }
    const ops = args.ops;
    const stopOnError = !!args.stopOnError;
    const opBlocks = [];
    for (let i = 0; i < ops.length; i++) {
      const entry = ops[i];
      const opName = entry && typeof entry === "object" && typeof entry.operation === "string" ? entry.operation : void 0;
      const op = opName !== void 0 ? getOp(opName) : void 0;
      if (!op) {
        const withheld = opName !== void 0 ? denyUnregisteredOperation(opName) : null;
        opBlocks.push(
          rejectBlock(
            i,
            withheld ? denialText(withheld) : `unknown operation: ${String(opName)}`,
            stopOnError
          )
        );
        continue;
      }
      const denial = denyOperation(op);
      if (denial) {
        opBlocks.push(rejectBlock(i, denialText(denial), stopOnError));
        continue;
      }
      const validated = validateOpArgs(op, entry.args);
      if (!validated.ok) {
        const detail = `invalid arguments for '${op.name}': ` + validated.issues.map((issue) => `${issue.path} \u2014 ${issue.message}`).join("; ") + ` (expects ${summarizeParams(op.params).join(", ") || "no parameters"})`;
        opBlocks.push(rejectBlock(i, detail, stopOnError));
        continue;
      }
      const consent = denyAppConfig(op, validated.value);
      if (consent) {
        opBlocks.push(rejectBlock(i, consent, stopOnError));
        continue;
      }
      if (!wantsUndoGroup(op, validated.value)) {
        opBlocks.push(
          rejectBlock(
            i,
            `'${op.name}' cannot run inside batch.run \u2014 the batch is one undo group and undo/redo must not run inside one. Call it as its own ae_do.`,
            stopOnError
          )
        );
        continue;
      }
      const jsx = op.toJsx(validated.value);
      opBlocks.push(`
                if (!_stopped) {
                    try {
                        var _r${i} = (function() { ${jsx} })();
                        if (_r${i} && _r${i}.ok === false) { _failed++; ${stopOnError ? `_stopped = true;` : ""} }
                        _results.push(_r${i});
                    } catch(e) {
                        _failed++;
                        _results.push({ ok: false, error: AE.errText(e) });
                        ${stopOnError ? "_stopped = true;" : ""}
                    }
                } else {
                    _results.push({ skipped: true });
                }
            `);
    }
    return `
            var _results = [];
            var _failed = 0;
            var _stopped = false;
            ${opBlocks.join("\n")}
            return {
                ok: _failed === 0,
                error: _failed === 0 ? null : (_failed + " of " + _results.length + " operations failed"),
                results: _results,
                count: _results.length,
                failed: _failed
            };
        `;
  }
});
function denialText(denial) {
  return denial.hint ? `${denial.message} \u2014 ${denial.hint}` : denial.message;
}
function rejectBlock(index, message, stopOnError) {
  return `
                if (!_stopped) {
                    _failed++;
                    _results.push({ ok: false, error: ${jsxVal(message)}, index: ${index} });
                    ${stopOnError ? "_stopped = true;" : ""}
                } else {
                    _results.push({ skipped: true });
                }
            `;
}

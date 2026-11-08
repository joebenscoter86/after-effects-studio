import { promises as fs } from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { errorResult } from "../errors.js";
import { validateAeProjectDoc } from "../validate.js";
import { defineTool, jsonResult, toMcpResult } from "./define-tool.js";
const projectImportTool = defineTool({
  name: "ae_project_import_json",
  title: "Import project JSON",
  description: "Rebuild the project from JSON (produced by ae_project_export_json). Supports `clearFirst`, `dryRun` (validate-only), `skipValidation`.",
  group: "document",
  blockedInReadOnly: true,
  effect: "destructive",
  inputShape: {
    inPath: z.string().optional().describe(
      "Absolute path to a JSON document produced by ae_project_export_json. Mutually exclusive with `json`."
    ),
    json: z.unknown().optional().describe("Inline JSON document (object, not string). Mutually exclusive with `inPath`."),
    clearFirst: z.boolean().optional().describe(
      "Remove all existing items from the current project before importing. Default: false (appends)."
    ),
    dryRun: z.boolean().optional().describe(
      "If true, validate the document and return a plan without touching AE. Useful for debugging malformed exports."
    ),
    skipValidation: z.boolean().optional().describe(
      "Skip Node-side schema validation. Only use if you trust the input and want to hand broken data to AE for diagnosis."
    )
  },
  handler: async (args, transport) => {
    let doc;
    if (args.inPath) {
      const abs = path.resolve(args.inPath);
      try {
        doc = JSON.parse(await fs.readFile(abs, "utf8"));
      } catch (err) {
        return errorResult(
          "IO",
          `cannot read project document at ${abs}: ${err instanceof Error ? err.message : String(err)}`,
          { details: { inPath: abs } }
        );
      }
    } else if (args.json !== void 0) {
      doc = args.json;
    } else {
      return errorResult("INVALID_ARGS", "must provide either `inPath` or `json`", {
        hint: "`inPath` takes an absolute path to a document produced by ae_project_export_json; `json` takes the document inline as an object."
      });
    }
    let warnings = [];
    if (!args.skipValidation) {
      const v = validateAeProjectDoc(doc);
      if (!v.ok) {
        return errorResult(
          "VALIDATION",
          "document failed schema validation:\n" + v.issues.map((i) => `  ${i.path || "(root)"}: ${i.message}`).join("\n"),
          {
            details: { issues: v.issues, warnings: v.warnings },
            hint: "Run with dryRun: true to inspect the plan, or skipValidation: true to hand the document to AE as-is for diagnosis."
          }
        );
      }
      warnings = v.warnings;
    }
    if (args.dryRun) {
      const items = doc.items ?? [];
      return jsonResult({
        dryRun: true,
        valid: !args.skipValidation,
        itemCount: items.length,
        warnings,
        summary: summarizePlan(doc)
      });
    }
    const code = `
        return AE.importProject(payload.doc, payload.opts);
    `;
    const result = await transport.execute({
      code,
      payload: { doc, opts: { clearFirst: !!args.clearFirst } },
      label: "project_import_json",
      timeoutMs: 6e5
    });
    return toMcpResult(result);
  }
});
function summarizePlan(doc) {
  const items = doc.items ?? [];
  let folders = 0, comps = 0, solids = 0, files = 0, layers = 0;
  for (const it of items) {
    if (it.type === "FolderItem") folders++;
    else if (it.type === "CompItem") {
      comps++;
      if (Array.isArray(it.layers)) layers += it.layers.length;
    } else if (it.type === "FootageItem") {
      const sk = it.sourceKind;
      if (sk === "solid") solids++;
      else if (sk === "file") files++;
    }
  }
  return { folders, comps, solids, files, layers };
}
export {
  projectImportTool
};

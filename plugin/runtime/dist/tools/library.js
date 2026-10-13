import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";
import { PACKAGE_ROOT } from "../config.js";
import { defineTool, jsonResult } from "./define-tool.js";
import { errorResult } from "../errors.js";
export function readLibrary(document, query, root = path.resolve(PACKAGE_ROOT, "../library")) {
    const base = realpathSync(root);
    const manifest = JSON.parse(readFileSync(path.join(base, "manifest.json"), "utf8"));
    const entries = manifest.documents;
    if (!document) {
        const needle = query?.toLowerCase();
        return { startHere: ["motion-language", "production-workflow", "brief-template"], documents: entries.filter(e => !needle || `${e.id} ${e.title} ${e.kind}`.toLowerCase().includes(needle)) };
    }
    const entry = entries.find(e => e.id === document);
    if (!entry)
        throw new Error("Unknown library document. Call ae_library without arguments for valid IDs.");
    const file = realpathSync(path.resolve(base, entry.path));
    const rel = path.relative(base, file);
    if (!rel || rel.startsWith("..") || path.isAbsolute(rel))
        throw new Error("Library path escapes bundle");
    const content = readFileSync(file, "utf8");
    if (createHash("sha256").update(content).digest("hex") !== entry.sha256)
        throw new Error("Library hash mismatch: regenerate manifest after intentional edits");
    return { document: entry.id, title: entry.title, kind: entry.kind, content };
}
export const libraryTool = defineTool({
    name: "ae_library", title: "Motion design library", group: "document", effect: "read", blockedInReadOnly: false,
    description: "Read the bundled production-derived motion language, detailed choreography/camera/material modules, worked scenes and native JSX. Begin EVERY motion task with motion-language, production-workflow and brief-template. Craft applies to all styles; JoeB appearance is optional. Offline; no AE, original repo or account required. Omit document to list IDs and startHere; query filters the index. Pass an ID to read complete contents.",
    inputShape: { document: z.string().optional(), query: z.string().optional() },
    handler: async ({ document, query }) => {
        try {
            return jsonResult(readLibrary(document, query));
        }
        catch (e) {
            return errorResult("IO", e instanceof Error ? e.message : String(e));
        }
    },
});
//# sourceMappingURL=library.js.map
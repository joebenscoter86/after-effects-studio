import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";
import { PACKAGE_ROOT } from "../config.js";
import { defineTool, jsonResult } from "./define-tool.js";
import { errorResult } from "../errors.js";

import { validateCatalog, findModules } from "./library-modules.js";

type Entry = { id: string; title: string; path: string; sha256: string; kind: string };
function boundedFile(base: string, relative: string) {
  const candidate = path.resolve(base, relative);
  const inside = (file: string) => {
    const rel = path.relative(base, file);
    if (!rel || rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel)) throw new Error("Library path escapes bundle");
  };
  inside(candidate);
  const file = realpathSync(candidate);
  inside(file);
  return file;
}
export function readLibrary(document?: string, query?: string, root = path.resolve(PACKAGE_ROOT, "../library")) {
  const base = realpathSync(root);
  const manifest = JSON.parse(readFileSync(boundedFile(base, "manifest.json"), "utf8")) as { documents: Entry[] };
  const entries = manifest.documents;
  const read = (entry: Entry) => {
    const content = readFileSync(boundedFile(base, entry.path), "utf8");
    if (createHash("sha256").update(content).digest("hex") !== entry.sha256) throw new Error("Library hash mismatch: regenerate manifest after intentional edits");
    return content;
  };
  if (!document) {
    const needle = query?.trim().toLowerCase();
    const catalogEntry = entries.find(e => e.id === "module-catalog");
    let catalog = {schemaVersion: 1 as const, modules: [] as import("./library-modules.js").Module[]};
    if (catalogEntry) {
      try {
        const raw: unknown = JSON.parse(read(catalogEntry));
        const sourceMap = JSON.parse(readFileSync(boundedFile(base, "source-map.json"), "utf8"));
        catalog = validateCatalog(raw, {documentIds: new Set(entries.map(e => e.id)), provenanceIds: new Set((sourceMap.sources ?? []).map((s: {id?: string}) => s.id).filter((id: unknown): id is string => typeof id === "string"))});
      } catch (e) { throw new Error(`Module catalog: ${e instanceof Error ? e.message : String(e)}`); }
    }
    const matches = findModules(catalog, query);
    const entryIds = new Set(matches.map(m => m.entryDocument));
    const seen = new Set<string>();
    return {
      startHere: ["motion-language", "production-workflow", "brief-template"],
      documents: entries.filter(e => {
        if (seen.has(e.id)) return false;
        if (!needle || `${e.id} ${e.title} ${e.kind}`.toLowerCase().includes(needle) || entryIds.has(e.id)) {seen.add(e.id); return true;}
        return false;
      }),
      modules: matches.map(({id,kind,title,summary,entryDocument,requires,tags,evidence}) => ({id,kind,title,summary,entryDocument,requires,tags,evidence})),
    };
  }
  const entry = entries.find(e => e.id === document);
  if (!entry) throw new Error("Unknown library document. Call ae_library without arguments for valid IDs.");
  return { document: entry.id, title: entry.title, kind: entry.kind, content: read(entry) };
}
export const libraryTool = defineTool({
  name: "ae_library", title: "Motion design library", group: "document", effect: "read", blockedInReadOnly: false,
  description: "Read the bundled production-derived motion language, detailed choreography/camera/material modules, worked scenes and native JSX. Begin EVERY motion task with motion-language, production-workflow and brief-template. Craft applies to all styles; JoeB appearance is optional. Offline; no AE, original repo or account required. Omit document to list IDs and startHere; query filters the index. Pass an ID to read complete contents.",
  inputShape: { document: z.string().optional(), query: z.string().optional() },
  handler: async ({ document, query }) => {
    try { return jsonResult(readLibrary(document, query)); }
    catch (e) { return errorResult("IO", e instanceof Error ? e.message : String(e)); }
  },
});

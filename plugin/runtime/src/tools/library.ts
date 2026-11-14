import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";
import { PACKAGE_ROOT } from "../config.js";
import { defineTool, jsonResult } from "./define-tool.js";
import { errorResult } from "../errors.js";

import { validateCatalog, findModules, moduleWords, queryWords } from "./library-modules.js";
import { REPLY_CHARS, sectionsReply, wholeOrOutline } from "./library-parts.js";

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
    // Each word of the query counts once for a document when it is in the document's id, title or
    // kind, or in a matched module that points at it. Best score first; ties keep the listing order.
    const words = queryWords(query);
    const viaModules = new Map<string, Set<string>>();
    for (const m of matches) for (const w of moduleWords(m, words)) viaModules.set(m.entryDocument, (viaModules.get(m.entryDocument) ?? new Set()).add(w));
    const seen = new Set<string>();
    const scored: {entry: Entry; score: number}[] = [];
    for (const e of entries) {
      if (seen.has(e.id)) continue;
      const text = `${e.id} ${e.title} ${e.kind}`.toLowerCase();
      const score = needle ? words.filter(w => text.includes(w) || viaModules.get(e.id)?.has(w)).length : 1;
      if (score > 0) {seen.add(e.id); scored.push({entry: e, score});}
    }
    return {
      startHere: ["motion-language", "production-workflow", "brief-template"],
      documents: [...scored].sort((a, b) => b.score - a.score).map(({entry}) => ({id: entry.id, title: entry.title, kind: entry.kind})),
      modules: matches.map(({id,kind,title,summary,entryDocument,requires,tags,evidence}) => ({id,kind,title,summary,entryDocument,requires,tags,evidence})),
    };
  }
  const entry = entries.find(e => e.id === document);
  if (!entry) throw new Error("Unknown library document. Call ae_library without arguments for valid IDs.");
  return { document: entry.id, title: entry.title, kind: entry.kind, content: read(entry) };
}

/** One document's manifest entry and its checked text. */
export function readLibraryEntry(document: string, root = path.resolve(PACKAGE_ROOT, "../library")): { entry: Entry; content: string } {
  const base = realpathSync(root);
  const manifest = JSON.parse(readFileSync(boundedFile(base, "manifest.json"), "utf8")) as { documents: Entry[] };
  const entry = manifest.documents.find(e => e.id === document);
  if (!entry) throw new Error("Unknown library document. Call ae_library without arguments for valid IDs.");
  const content = readFileSync(boundedFile(base, entry.path), "utf8");
  if (createHash("sha256").update(content).digest("hex") !== entry.sha256) throw new Error("Library hash mismatch: regenerate manifest after intentional edits");
  return { entry, content };
}

/**
 * A document reply: text only (see library-parts.ts for why there is no structured part), its first line the
 * document's id, kind, size and sha256. Whole when it fits in one reply, else the outline and opening; with
 * `section`, the sections asked for.
 */
export function libraryDocumentReply(document: string, section?: string | string[], root?: string): string {
  const { entry, content } = readLibraryEntry(document, root);
  if (section === undefined) return wholeOrOutline(entry, content);
  return sectionsReply(entry, content, Array.isArray(section) ? section : [section]);
}
export const libraryTool = defineTool({
  name: "ae_library", title: "Motion design library", group: "document", effect: "read", blockedInReadOnly: false,
  description: "Read the bundled production-derived motion language, detailed choreography/camera/material modules, worked scenes and native JSX. Begin every After Effects motion task with motion-language, production-workflow and brief-template. Craft applies to all styles; JoeB appearance is optional. Offline; no AE, original repo or account required. Omit document to list IDs and startHere; query filters the index. " +
    `Pass an ID to read a document: whole when it fits in one reply (${REPLY_CHARS} characters), otherwise its outline and opening only, which say so on their first line; then pass section (a heading's exact text or the name the outline shows, or a list of them) to read those sections, several in one call while they fit. Read the sections a job needs before relying on a long document.`,
  inputShape: {
    document: z.string().optional(),
    query: z.string().optional(),
    section: z.union([z.string(), z.array(z.string())]).optional().describe("With document: a section's name from its outline, or a list of them"),
  },
  handler: async ({ document, query, section }) => {
    try {
      if (!document) {
        if (section !== undefined) return errorResult("INVALID_ARGS", "section needs a document: pass document and section together");
        return jsonResult(readLibrary(undefined, query));
      }
      return { content: [{ type: "text", text: libraryDocumentReply(document, section) }], isError: false };
    }
    catch (e) { return errorResult("IO", e instanceof Error ? e.message : String(e)); }
  },
});

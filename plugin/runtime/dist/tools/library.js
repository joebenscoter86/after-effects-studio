import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";
import { PACKAGE_ROOT } from "../config.js";
import { defineTool, jsonResult } from "./define-tool.js";
import { errorResult } from "../errors.js";
import { validateCatalog, findModules } from "./library-modules.js";
import { REPLY_CHARS, sectionsReply, wholeOrOutline } from "./library-parts.js";
function boundedFile(base, relative) {
    const candidate = path.resolve(base, relative);
    const inside = (file) => {
        const rel = path.relative(base, file);
        if (!rel || rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel))
            throw new Error("Library path escapes bundle");
    };
    inside(candidate);
    const file = realpathSync(candidate);
    inside(file);
    return file;
}
export function readLibrary(document, query, root = path.resolve(PACKAGE_ROOT, "../library")) {
    const base = realpathSync(root);
    const manifest = JSON.parse(readFileSync(boundedFile(base, "manifest.json"), "utf8"));
    const entries = manifest.documents;
    const read = (entry) => {
        const content = readFileSync(boundedFile(base, entry.path), "utf8");
        if (createHash("sha256").update(content).digest("hex") !== entry.sha256)
            throw new Error("Library hash mismatch: regenerate manifest after intentional edits");
        return content;
    };
    if (!document) {
        const needle = query?.trim().toLowerCase();
        const catalogEntry = entries.find(e => e.id === "module-catalog");
        let catalog = { schemaVersion: 1, modules: [] };
        if (catalogEntry) {
            try {
                const raw = JSON.parse(read(catalogEntry));
                const sourceMap = JSON.parse(readFileSync(boundedFile(base, "source-map.json"), "utf8"));
                catalog = validateCatalog(raw, { documentIds: new Set(entries.map(e => e.id)), provenanceIds: new Set((sourceMap.sources ?? []).map((s) => s.id).filter((id) => typeof id === "string")) });
            }
            catch (e) {
                throw new Error(`Module catalog: ${e instanceof Error ? e.message : String(e)}`);
            }
        }
        const matches = findModules(catalog, query);
        const entryIds = new Set(matches.map(m => m.entryDocument));
        const seen = new Set();
        return {
            startHere: ["motion-language", "production-workflow", "brief-template"],
            documents: entries.filter(e => {
                if (seen.has(e.id))
                    return false;
                if (!needle || `${e.id} ${e.title} ${e.kind}`.toLowerCase().includes(needle) || entryIds.has(e.id)) {
                    seen.add(e.id);
                    return true;
                }
                return false;
            }).map(({ id, title, kind }) => ({ id, title, kind })),
            modules: matches.map(({ id, kind, title, summary, entryDocument, requires, tags, evidence }) => ({ id, kind, title, summary, entryDocument, requires, tags, evidence })),
        };
    }
    const entry = entries.find(e => e.id === document);
    if (!entry)
        throw new Error("Unknown library document. Call ae_library without arguments for valid IDs.");
    return { document: entry.id, title: entry.title, kind: entry.kind, content: read(entry) };
}
/** One document's manifest entry and its checked text. */
export function readLibraryEntry(document, root = path.resolve(PACKAGE_ROOT, "../library")) {
    const base = realpathSync(root);
    const manifest = JSON.parse(readFileSync(boundedFile(base, "manifest.json"), "utf8"));
    const entry = manifest.documents.find(e => e.id === document);
    if (!entry)
        throw new Error("Unknown library document. Call ae_library without arguments for valid IDs.");
    const content = readFileSync(boundedFile(base, entry.path), "utf8");
    if (createHash("sha256").update(content).digest("hex") !== entry.sha256)
        throw new Error("Library hash mismatch: regenerate manifest after intentional edits");
    return { entry, content };
}
/**
 * A document reply: text only (see library-parts.ts for why there is no structured part), its first line the
 * document's id, kind, size and sha256. Whole when it fits in one reply, else the outline and opening; with
 * `section`, the sections asked for.
 */
export function libraryDocumentReply(document, section, root) {
    const { entry, content } = readLibraryEntry(document, root);
    if (section === undefined)
        return wholeOrOutline(entry, content);
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
                if (section !== undefined)
                    return errorResult("INVALID_ARGS", "section needs a document: pass document and section together");
                return jsonResult(readLibrary(undefined, query));
            }
            return { content: [{ type: "text", text: libraryDocumentReply(document, section) }], isError: false };
        }
        catch (e) {
            return errorResult("IO", e instanceof Error ? e.message : String(e));
        }
    },
});
//# sourceMappingURL=library.js.map
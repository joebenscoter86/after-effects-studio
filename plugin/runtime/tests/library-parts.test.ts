// Reading a library document in parts: every reply stays under one reply's size, every byte of a long document is
// reachable through its sections, a short document comes back whole and unchanged, an outline says on its first lines
// that it is not the document, and a reply is text only (the host passes a structured part on instead of the text).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { libraryDocumentReply, libraryTool, readLibraryEntry } from "../src/tools/library.js";
import { OPENING, PART_CHARS, REPLY_CHARS, WHOLE, allSections, header, ownText, parseDocument, partName, sectionNames, splitText } from "../src/tools/library-parts.js";

const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "library");
const manifest = JSON.parse(readFileSync(path.join(LIB, "manifest.json"), "utf8")) as { documents: Array<{ id: string; title: string; kind: string; path: string; sha256: string }> };
const LONG = ["keying", "style-pixel-headline", "style-index", "style-pixel-headline-jsx"];
const reply = (id: string, section?: string | string[]) => libraryDocumentReply(id, section, LIB);
const isLong = (id: string) => { const { entry, content } = readLibraryEntry(id, LIB); return `${header(entry, content.length)}\n\n${content}`.length > REPLY_CHARS; };

/** The text of block `name` in a sections reply ("== name (N characters) ==" then exactly N characters). */
function blockText(r: string, name: string): string | null {
  const head = `\n== ${name} (`;
  const i = r.indexOf(head);
  if (i < 0) return null;
  const m = r.slice(i + head.length).match(/^(\d+) characters\) ==\n/);
  if (!m) return null;
  const from = i + head.length + m[0].length;
  return r.slice(from, from + Number(m[1]));
}

describe("ae_library in parts", () => {
  it("the long documents come back as an outline that says it is not the document, with the hash and size on its first line", () => {
    for (const id of LONG) {
      const { entry, content } = readLibraryEntry(id, LIB);
      const r = reply(id);
      const [first, second] = r.split("\n");
      expect(first).toBe(header(entry, content.length));
      expect(first).toContain(`sha256 ${entry.sha256}`);
      expect(second).toMatch(/^OUTLINE ONLY, NOT THE DOCUMENT\. /);
      expect(second).toContain(`${content.length} characters in ${allSections(parseDocument(content, entry.path)).length} sections`);
      expect(second).toContain("nothing after the opening has been read yet");
      expect(r.length).toBeLessThanOrEqual(REPLY_CHARS);
    }
    expect(reply("style-pixel-headline-jsx")).toMatch(/load the whole file inside eval\.run with \$\.evalFile/);
  });

  it("every section and part of every long document comes back under the size", () => {
    for (const e of manifest.documents.filter((d) => isLong(d.id))) {
      const { content } = readLibraryEntry(e.id, LIB);
      for (const name of sectionNames(parseDocument(content, e.path), content)) expect(reply(e.id, name).length, `${e.id}: ${name}`).toBeLessThanOrEqual(REPLY_CHARS);
    }
  });

  it("every byte of every long document is reachable through its sections, in order", () => {
    for (const e of manifest.documents.filter((d) => isLong(d.id))) {
      const { content } = readLibraryEntry(e.id, LIB);
      const doc = parseDocument(content, e.path);
      // what the replies hand back, leaf by leaf: the opening, then each section's own text (or its parts)
      const take = (name: string) => { const t = blockText(reply(e.id, name), name); expect(t, `${e.id}: ${name}`).not.toBeNull(); return t as string; };
      const pieces = (base: string, own: string) => {
        const parts = splitText(own);
        return parts.length > 1 ? parts.map((_, i) => take(partName(base, i + 1, parts.length))) : null;
      };
      let rebuilt = "";
      if (!doc.sections.length) { rebuilt = (pieces(WHOLE, content) ?? [content]).join(""); }
      else {
        const op = pieces(OPENING, doc.opening);
        if (op) rebuilt += op.join("");
        else { const r = reply(e.id); expect(r.endsWith(`Opening:\n${doc.opening}`), `${e.id}: opening`).toBe(true); rebuilt += doc.opening; }
        for (const s of allSections(doc)) {
          const own = ownText(s);
          const parts = pieces(s.name, own);
          if (parts) { rebuilt += parts.join(""); continue; }
          const r = reply(e.id, s.name);
          if (s.text.length <= PART_CHARS) expect(blockText(r, s.name)).toBe(s.text);   // the whole section, subsections included
          else expect(r.endsWith(own), `${e.id}: ${s.name}'s own text`).toBe(true);
          rebuilt += own;
        }
      }
      if (doc.form === "json") {
        // JSON sections are its values, laid out again: they rebuild the same object
        const obj = Object.fromEntries(doc.sections.map((s) => [s.title, JSON.parse(s.text)]));
        expect(obj).toEqual(JSON.parse(content));
      } else expect(rebuilt, e.id).toBe(content);
    }
  });

  it("a short document comes back whole and unchanged, under its header line", () => {
    const short = manifest.documents.filter((d) => !isLong(d.id));
    expect(short.length).toBeGreaterThan(80);
    for (const e of short) {
      const { entry, content } = readLibraryEntry(e.id, LIB);
      expect(reply(e.id)).toBe(`${header(entry, content.length)}\n\n${content}`);
    }
  });

  it("a section is asked for by its exact heading, or by its path where the heading repeats; a miss is refused with the list", () => {
    const names = sectionNames(parseDocument(readLibraryEntry("keying", LIB).content, "references/keying.md"), "");
    expect(names).toContain("Tell the user first");
    // "The procedure" is a heading twice: the top-level one keeps its name, the one under the cut-out gets its path
    expect(names).toContain("The procedure");
    expect(names).toContain("Cutting a subject out with Object Matte > The procedure");
    expect(blockText(reply("keying", "The procedure"), "The procedure")).toMatch(/^## The procedure\n/);
    const r = reply("keying", "Tell the user first");
    expect(blockText(r, "Tell the user first")).toMatch(/^### Tell the user first\n[\s\S]*One step here needs you in After Effects/);
    expect(() => reply("keying", "tell the user first")).toThrow(/keying has no section "tell the user first" \(names must match exactly\)\. Its sections, by the names to ask for: .*"Tell the user first"/);
    expect(() => reply("keying", "Object Matte > The procedure")).toThrow(/"Cutting a subject out with Object Matte > The procedure"/);
  });

  it("several sections come back in one call, in order, while they fit; the rest are named", () => {
    const r = reply("style-pixel-headline", ["D6. The checks, and what each catches", "D1. Before a frame is built"]);
    expect(r.split("\n")[1]).toMatch(/: 2 of 2 asked for, in order\.$/);
    expect(r.indexOf("== D6.")).toBeLessThan(r.indexOf("== D1."));
    const { content } = readLibraryEntry("keying", LIB);
    const big = allSections(parseDocument(content, "references/keying.md")).filter((s) => s.text.length < PART_CHARS && s.text.length > 9_000).map((s) => s.name);
    expect(big.length).toBeGreaterThanOrEqual(2);
    const r2 = reply("keying", [...big, ...big.map((n) => n)].slice(0, 6));
    expect(r2.length).toBeLessThanOrEqual(REPLY_CHARS);
    expect(r2.split("\n")[1]).toMatch(/Not sent, to stay under one reply/);
  });

  it("a section too long for one reply comes back as its own text and its subsections' outline, or in parts", () => {
    const r = reply("keying", "Cutting a subject out with Object Matte");
    expect(r).toMatch(/== Cutting a subject out with Object Matte \(\d+ characters, longer than one reply\): its own text and the outline of its subsections/);
    expect(r).toMatch(/Subsections:\n {2}- Cutting a subject out with Object Matte > Facts measured in After Effects 27\.0|Subsections:\n- /);
    expect(r.length).toBeLessThanOrEqual(REPLY_CHARS);
  });

  it("is text only for a document, and the index is unchanged", async () => {
    const doc = await libraryTool.handler({ document: "keying" } as never, {} as never);
    expect(doc.structuredContent).toBeUndefined();
    expect((doc.content[0] as { text: string }).text).toMatch(/^ae_library document keying: /);
    const index = await libraryTool.handler({} as never, {} as never);
    expect((index.structuredContent as { startHere: string[] }).startHere).toEqual(["motion-language", "production-workflow", "brief-template"]);
    const bad = await libraryTool.handler({ section: "x" } as never, {} as never);
    expect(bad.isError).toBe(true);
  });

  it("splitText keeps every character and cuts at blank lines first", () => {
    const t = Array.from({ length: 40 }, (_, i) => `paragraph ${i} ${"x".repeat(90)}\n\n`).join("");
    const parts = splitText(t, 1_000);
    expect(parts.join("")).toBe(t);
    expect(parts.every((p) => p.length <= 1_000)).toBe(true);
    expect(parts.slice(0, -1).every((p) => p.endsWith("\n\n"))).toBe(true);
    expect(splitText("a".repeat(2_500), 1_000).map((p) => p.length)).toEqual([1_000, 1_000, 500]);
  });
});

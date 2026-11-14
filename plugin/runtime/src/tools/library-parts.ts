// Reading a library document in parts. A host saves a long tool result to a file instead of handing it to the
// session, and a session that cannot read that file never sees the document (stage 10: keying, 93 KB, and the pixel
// headline style, 69 KB, were both lost this way in the eval runner's sandbox). So a document whose reply would be
// longer than REPLY_CHARS comes back as its outline and its opening, and its sections are asked for by name.
//
// Measured on 2026-11-14 with Claude Code 2.1.322, through a probe server and the session's own transcript:
//   - When a result carries both text and structuredContent, the host hands the session the structured part, not
//     the text. Whoever changes a reply's shape needs this more than the number: a reply that keeps the document in
//     its text and only facts in structuredContent shows the session the facts and hides the document. So a document
//     reply here is text only, with no structuredContent: one copy, not JSON-escaped, and its header line carries
//     what the structured part used to (id, kind, size, sha256).
//   - Results of 20,000 to 48,016 characters all reached the session inline; the host's documentation saves any text
//     result longer than 50,000 characters to a file. REPLY_CHARS is 40,000, a fifth under that.

export const REPLY_CHARS = 40_000;
/** Room kept in every reply for its header and the section titles around the text. */
const FRAME_CHARS = 2_000;
export const PART_CHARS = REPLY_CHARS - FRAME_CHARS;

export interface Section {
  /** The heading's text (a function's name, a JSON key or entry id). */
  title: string;
  /** Unique name: the title, or "parent > title" when the title alone repeats. */
  name: string;
  level: number;
  /** The whole section, its subsections included. */
  text: string;
  /** The section's own text: its heading up to its first subsection (all of it when it has none). */
  intro: string;
  children: Section[];
}

export interface ParsedDocument {
  form: "markdown" | "json" | "code" | "text";
  /** Everything before the first section. */
  opening: string;
  sections: Section[];
}

const walk = (list: Section[], out: Section[] = []): Section[] => { for (const s of list) { out.push(s); walk(s.children, out); } return out; };
export const allSections = (doc: ParsedDocument): Section[] => walk(doc.sections);
/** A section's own text: all of it when it has no subsections. */
export const ownText = (s: Section): string => (s.children.length ? s.intro : s.text);

/** Give every section a unique name: its title, or its path ("A > B") where the title repeats. */
function nameSections(doc: ParsedDocument): ParsedDocument {
  const all = allSections(doc);
  const count = new Map<string, number>();
  for (const s of all) count.set(s.title, (count.get(s.title) ?? 0) + 1);
  const visit = (list: Section[], trail: string[]) => {
    for (const s of list) {
      s.name = (count.get(s.title) ?? 0) > 1 ? [...trail, s.title].join(" > ") : s.title;
      visit(s.children, [...trail, s.title]);
    }
  };
  visit(doc.sections, []);
  // a path can still repeat (the same heading twice under one parent): number the later ones
  const seen = new Map<string, number>();
  for (const s of all) { const n = (seen.get(s.name) ?? 0) + 1; seen.set(s.name, n); if (n > 1) s.name = `${s.name} (${n})`; }
  return doc;
}

/** Markdown: sections at `##` to `######` headings outside fenced code, nested by level. */
function parseMarkdown(text: string): ParsedDocument {
  const heads: Array<{ at: number; level: number; title: string }> = [];
  let fence = false;
  for (const m of text.matchAll(/^.*$/gm)) {
    const line = m[0];
    if (/^\s*(\x60{3}|~{3})/.test(line)) { fence = !fence; continue; }   // a code fence (written without backticks)
    if (fence) continue;
    const h = line.match(/^(#{2,6})\s+(.+?)\s*#*\s*$/);
    if (h) heads.push({ at: m.index ?? 0, level: h[1].length, title: h[2] });
  }
  const roots: Section[] = [];
  const stack: Section[] = [];
  const levels: number[] = [];
  for (const [i, h] of heads.entries()) {
    while (levels.length && levels[levels.length - 1] >= h.level) { stack.pop(); levels.pop(); }
    const next = heads.slice(i + 1).find((x) => x.level <= h.level);
    const end = next ? next.at : text.length;
    const firstChild = heads[i + 1] && heads[i + 1].level > h.level ? heads[i + 1].at : end;
    const s: Section = { title: h.title, name: h.title, level: h.level, text: text.slice(h.at, end), intro: text.slice(h.at, firstChild), children: [] };
    (stack.length ? stack[stack.length - 1].children : roots).push(s);
    stack.push(s);
    levels.push(h.level);
  }
  return nameSections({ form: "markdown", opening: text.slice(0, heads.length ? heads[0].at : text.length), sections: roots });
}

/** JSON: one section per top-level key; an array of objects with unique string ids has one subsection per entry. */
function parseJson(text: string): ParsedDocument | null {
  let value: unknown;
  try { value = JSON.parse(text); } catch { return null; }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const sections: Section[] = [];
  const small: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    const t = JSON.stringify(v, null, 2);
    const items = Array.isArray(v) && v.length && v.every((e) => e && typeof e === "object" && typeof (e as { id?: unknown }).id === "string")
      ? (v as Array<{ id: string }>) : null;
    const children: Section[] = items && new Set(items.map((e) => e.id)).size === items.length
      ? items.map((e) => { const et = JSON.stringify(e, null, 2); return { title: e.id, name: e.id, level: 3, text: et, intro: et, children: [] }; })
      : [];
    sections.push({ title: key, name: key, level: 2, text: t, intro: children.length ? "" : t, children });
    if (t.length <= 2_000) small[key] = v;
  }
  return nameSections({ form: "json", opening: Object.keys(small).length ? JSON.stringify(small, null, 2) : "", sections });
}

/** Code: one section per function declared at the shallowest indent that declares three or more. */
function parseCode(text: string): ParsedDocument | null {
  const decls = [...text.matchAll(/^( *)(?:function\s+([A-Za-z_$][\w$]*)\s*\(|def\s+([A-Za-z_]\w*)\s*\()/gm)]
    .map((m) => ({ at: m.index ?? 0, indent: m[1].length, title: m[2] ?? m[3] }));
  const byIndent = new Map<number, number>();
  for (const d of decls) byIndent.set(d.indent, (byIndent.get(d.indent) ?? 0) + 1);
  const indent = [...byIndent.entries()].filter(([, n]) => n >= 3).map(([i]) => i).sort((a, b) => a - b)[0];
  if (indent === undefined) return null;
  const top = decls.filter((d) => d.indent === indent);
  const sections: Section[] = top.map((d, i) => {
    const t = text.slice(d.at, i + 1 < top.length ? top[i + 1].at : text.length);
    return { title: d.title, name: d.title, level: 2, text: t, intro: t, children: [] };
  });
  return nameSections({ form: "code", opening: text.slice(0, top[0].at), sections });
}

/** A document's sections by its form: Markdown by headings, JSON by keys, code by functions, anything else none. */
export function parseDocument(text: string, file: string): ParsedDocument {
  if (/\.md$/i.test(file)) return parseMarkdown(text);
  if (/\.json$/i.test(file)) { const j = parseJson(text); if (j) return j; }
  if (/\.(jsx|js|mjs|py)$/i.test(file)) { const c = parseCode(text); if (c) return c; }
  return { form: "text", opening: "", sections: [] };
}

/** Text cut at blank lines (then at line ends, then anywhere) into pieces of at most `max` characters, in order. */
export function splitText(text: string, max: number = PART_CHARS): string[] {
  if (text.length <= max) return [text];
  const out: string[] = [];
  let cur = "";
  const add = (piece: string) => {
    if (cur.length + piece.length <= max) { cur += piece; return; }
    if (cur) { out.push(cur); cur = ""; }
    if (piece.length <= max) { cur = piece; return; }
    for (const line of piece.match(/[^\n]*\n|[^\n]+$/g) ?? [piece]) {
      if (cur.length + line.length <= max) { cur += line; continue; }
      if (cur) { out.push(cur); cur = ""; }
      for (let i = 0; i < line.length; i += max) { const c = line.slice(i, i + max); if (c.length === max) out.push(c); else cur = c; }
    }
  };
  for (const p of text.match(/[\s\S]*?\n\n+|[\s\S]+$/g) ?? [text]) add(p);
  if (cur) out.push(cur);
  return out;
}

export interface Entry { id: string; title: string; path: string; kind: string; sha256: string }

export const partName = (name: string, k: number, n: number): string => `${name} (part ${k} of ${n})`;
/** The names a document's opening or a sectionless document's parts go by. */
export const OPENING = "(opening)";
export const WHOLE = "(whole)";

/** Every name a caller may ask for, in document order: sections, and the parts of any whose own text is too long. */
export function sectionNames(doc: ParsedDocument, text: string): string[] {
  const out: string[] = [];
  const op = splitText(doc.opening);
  if (op.length > 1) op.forEach((_, i) => out.push(partName(OPENING, i + 1, op.length)));
  if (!doc.sections.length) {
    const w = splitText(text);
    if (w.length > 1) w.forEach((_, i) => out.push(partName(WHOLE, i + 1, w.length)));
  }
  for (const s of allSections(doc)) {
    out.push(s.name);
    const parts = splitText(ownText(s));
    if (parts.length > 1) parts.forEach((_, i) => out.push(partName(s.name, i + 1, parts.length)));
  }
  return out;
}

/** The first line of every document reply: what the structured part used to carry, so a reader can check it against the manifest. */
export const header = (e: Entry, chars: number): string => `ae_library document ${e.id}: ${e.title} (kind ${e.kind}, ${chars} characters, sha256 ${e.sha256})`;

function outlineLines(list: Section[], depth = 0): string[] {
  const out: string[] = [];
  for (const s of list) {
    const parts = splitText(ownText(s)).length;
    out.push(`${"  ".repeat(depth)}- ${s.name} (${s.text.length} characters${parts > 1 ? `; its own text in ${parts} parts` : ""})`);
    out.push(...outlineLines(s.children, depth + 1));
  }
  return out;
}

const loadNote = (e: Entry) => `To use this code, load the whole file inside eval.run with $.evalFile from the plugin's library folder (${e.path}), as its document says; read a function here only to see what it does.`;

/** The reply for a document with no section asked for: whole when it fits, else its outline and opening. */
export function wholeOrOutline(e: Entry, text: string, doc: ParsedDocument = parseDocument(text, e.path)): string {
  const whole = `${header(e, text.length)}\n\n${text}`;
  if (whole.length <= REPLY_CHARS) return whole;
  if (!doc.sections.length) {
    const parts = splitText(text);
    return [
      header(e, text.length),
      `PART 1 OF ${parts.length}, NOT THE WHOLE DOCUMENT. ${e.id} (${e.title}, ${e.kind}) is ${text.length} characters, longer than one reply (${REPLY_CHARS} characters). ` +
        `Ask for the rest: ae_library { document: "${e.id}", section: [${parts.slice(1).map((_, i) => JSON.stringify(partName(WHOLE, i + 2, parts.length))).join(", ")}] }.`,
      "",
      parts[0],
    ].join("\n");
  }
  const opening = splitText(doc.opening);
  return [
    header(e, text.length),
    `OUTLINE ONLY, NOT THE DOCUMENT. ${e.id} (${e.title}, ${e.kind}) is ${text.length} characters in ${allSections(doc).length} sections, longer than one reply (${REPLY_CHARS} characters). ` +
      "Below are its outline and its opening; nothing after the opening has been read yet. " +
      `Read the sections the job needs before relying on this document: ae_library { document: "${e.id}", section: ["<section>", ...] }, several in one call while they fit.`,
    ...(doc.form === "code" ? [loadNote(e)] : []),
    "",
    "Outline (each section and its size; ask for a section by the name shown):",
    ...outlineLines(doc.sections),
    "",
    opening.length > 1 ? `Opening (part 1 of ${opening.length}; ask for ${JSON.stringify(partName(OPENING, 2, opening.length))} next):` : "Opening:",
    opening[0] ?? "",
  ].join("\n");
}

interface Resolved { name: string; text?: string; tooLong?: Section }

/** One asked-for name: a section (exact name), or a part of a section's own text, of the opening or of the whole. */
function resolve(doc: ParsedDocument, text: string, asked: string): Resolved | null {
  const want = asked.trim();
  const part = want.match(/^(.*) \(part (\d+) of (\d+)\)$/);
  if (part) {
    const [, base, k, n] = part;
    let source: string | null = null;
    if (base === OPENING) source = doc.opening;
    else if (base === WHOLE && !doc.sections.length) source = text;
    else { const s = allSections(doc).find((x) => x.name === base); if (s) source = ownText(s); }
    if (source === null) return null;
    const parts = splitText(source);
    const i = Number(k) - 1;
    if (parts.length < 2 || Number(n) !== parts.length || i < 0 || i >= parts.length) return null;
    return { name: partName(base, i + 1, parts.length), text: parts[i] };
  }
  const s = allSections(doc).find((x) => x.name === want);
  if (!s) return null;
  return s.text.length <= PART_CHARS ? { name: s.name, text: s.text } : { name: s.name, tooLong: s };
}

/** The reply for asked-for sections: each in order while the reply stays under the size, the rest named. */
export function sectionsReply(e: Entry, text: string, asked: string[], doc: ParsedDocument = parseDocument(text, e.path)): string {
  if (!asked.length) throw new Error("section is empty: name at least one section");
  const missing = asked.filter((a) => !resolve(doc, text, a));
  if (missing.length) {
    const names = sectionNames(doc, text);
    throw new Error(`${e.id} has no section ${missing.map((m) => JSON.stringify(m)).join(", ")} (names must match exactly). ` +
      (names.length ? `Its sections, by the names to ask for: ${names.map((n) => JSON.stringify(n)).join(", ")}.` : "It has no sections: read it without section."));
  }
  const blocks: string[] = [];
  const notSent: string[] = [];
  let size = 0;
  for (const a of asked) {
    const r = resolve(doc, text, a) as Resolved;
    let block: string;
    if (r.tooLong) {
      const s = r.tooLong;
      const own = splitText(ownText(s));
      block = [
        `== ${s.name} (${s.text.length} characters, longer than one reply): ${s.children.length ? "its own text and the outline of its subsections; ask for those by name" : `part 1 of ${own.length}`} ==`,
        ...(s.children.length ? ["Subsections:", ...outlineLines(s.children)] : []),
        ...(own.length > 1 ? [`Its own text is in ${own.length} parts: ${own.map((_, i) => JSON.stringify(partName(s.name, i + 1, own.length))).join(", ")}. Part 1:`] : []),
        own[0],
      ].join("\n");
    } else block = `== ${r.name} (${(r.text ?? "").length} characters) ==\n${r.text}`;
    if (blocks.length && size + block.length > PART_CHARS) { notSent.push(r.name); continue; }
    blocks.push(block);
    size += block.length;
  }
  const head = `SECTIONS of ${e.id} (${e.title}, ${e.kind}, ${text.length} characters in ${allSections(doc).length} sections): ${blocks.length} of ${asked.length} asked for, in order.` +
    (notSent.length ? ` Not sent, to stay under one reply (${REPLY_CHARS} characters): ${notSent.map((n) => JSON.stringify(n)).join(", ")}; ask for them in another call.` : "") +
    (doc.form === "code" ? ` ${loadNote(e)}` : "");
  return [header(e, text.length), head, "", ...blocks].join("\n");
}

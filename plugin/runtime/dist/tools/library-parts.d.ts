export declare const REPLY_CHARS = 40000;
export declare const PART_CHARS: number;
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
export declare const allSections: (doc: ParsedDocument) => Section[];
/** A section's own text: all of it when it has no subsections. */
export declare const ownText: (s: Section) => string;
/** A document's sections by its form: Markdown by headings, JSON by keys, code by functions, anything else none. */
export declare function parseDocument(text: string, file: string): ParsedDocument;
/** Text cut at blank lines (then at line ends, then anywhere) into pieces of at most `max` characters, in order. */
export declare function splitText(text: string, max?: number): string[];
export interface Entry {
    id: string;
    title: string;
    path: string;
    kind: string;
    sha256: string;
}
export declare const partName: (name: string, k: number, n: number) => string;
/** The names a document's opening or a sectionless document's parts go by. */
export declare const OPENING = "(opening)";
export declare const WHOLE = "(whole)";
/** Every name a caller may ask for, in document order: sections, and the parts of any whose own text is too long. */
export declare function sectionNames(doc: ParsedDocument, text: string): string[];
/** The first line of every document reply: what the structured part used to carry, so a reader can check it against the manifest. */
export declare const header: (e: Entry, chars: number) => string;
/** The reply for a document with no section asked for: whole when it fits, else its outline and opening. */
export declare function wholeOrOutline(e: Entry, text: string, doc?: ParsedDocument): string;
/** The reply for asked-for sections: each in order while the reply stays under the size, the rest named. */
export declare function sectionsReply(e: Entry, text: string, asked: string[], doc?: ParsedDocument): string;
//# sourceMappingURL=library-parts.d.ts.map
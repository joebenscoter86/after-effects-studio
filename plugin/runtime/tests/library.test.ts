import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { readLibrary } from "../src/tools/library.js";
describe("studio library", () => {
  it("lists documents by id, title and kind only, so the listing stays small", () => {
    // Paths and hashes are for the server; Claude reads documents by id. Policy 5B asks for frugal responses.
    for (const doc of readLibrary().documents ?? []) expect(Object.keys(doc).toSorted()).toEqual(["id", "kind", "title"]);
  });
  it("lists and reads the shipped design and portable JSX without AE", () => {
    const ids = readLibrary().documents!.map(d=>d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["motion-language", "production-workflow", "construction", "camera-continuity", "assets-depth", "type-evidence", "reference-study", "failure-atlas", "worked-scenes", "brief-template", "design", "timing", "scripting", "quality", "scene-recipes", "joeb-preset", "motion-jsx", "house-jsx", "joeb-motion-jsx"]) expect(ids).toContain(id);
    expect(ids).toContain('module-catalog');expect(ids).toContain('module-template');
    expect(readLibrary().modules?.map(m=>m.id)).toContain('foundation');
    expect(readLibrary().startHere).toEqual(["motion-language", "production-workflow", "brief-template"]);
    for (const doc of readLibrary().documents ?? []) {
      expect(readLibrary(doc.id).content?.length).toBeGreaterThan(100);
    }
    expect(readLibrary("design").content).toContain("Design before motion");
    expect(readLibrary("motion-jsx").content).toContain("AESMotion");
  });
  it("serves the keying and compositing procedure with the facts measured live", () => {
    // Agent-eyes stage 6. The facts an agent would otherwise get wrong.
    const doc = readLibrary("keying").content!;
    for (const op of ["key.keylight", "key.view", "key.cleanup", "mask.get", "screen: true", "edge: true"]) expect(doc).toContain(op);
    expect(doc).toMatch(/comp background/);
    expect(doc).toMatch(/despills/);
    expect(doc).toMatch(/feather/);
    expect(doc).toMatch(/0\.37.*0\.56/);
    expect(doc).toMatch(/Intermediate Result.*Key Cleaner.*Advanced Spill Suppressor/s);
    expect(doc).toMatch(/magenta/);
    expect(doc).toMatch(/[Ss]top/);
    // Measured in the stage 6 live check.
    expect(doc).toContain('from: "luma"');
    expect(doc).toMatch(/7\.1 to 15\.1 px/);
    expect(doc).toMatch(/before and after/);
  });
  it("serves the review procedure both build skills point to", () => {
    // Pro finish stage 2: a review by someone who did not build the piece.
    const doc = readLibrary("review").content!;
    expect(readLibrary().documents!.find(d => d.id === "review")?.kind).toBe("guidance");
    // What the reviewer is handed, and what it is not.
    for (const s of ["brief", "ae_check_comp", "ae_render_frame", "render.preview", "builder's notes"]) expect(doc).toContain(s);
    // The severity scale and the form of a finding.
    for (const s of ["first-watch", "careful-watch", "polish", "evidence", "Not judged"]) expect(doc).toContain(s);
    expect(doc).toMatch(/[Nn]o score/);
    // The loop's stop rule.
    expect(doc).toMatch(/two review passes/);
    // Flags are fixed or named as intended; the two real whole-piece examples.
    expect(doc).toMatch(/intended/);
    expect(doc).toMatch(/stray frames of another take just before a cut/);
    expect(doc).toMatch(/two jumps close together, render every frame between them/);
    expect(doc).toMatch(/stray frames of the next take/);
    // Delegation, with the fallback said out loud.
    expect(doc).toContain("comp-room:motion-reviewer");
    expect(doc).toMatch(/not independent/);
    // Marker times are where the reviewer can read them.
    expect(doc).toMatch(/ae_comp_info` lists the comp's markers/);
  });
  it("makes the review a required step of a build, and the reviewer's skill starts from the whole piece", () => {
    const skill = (name: string) => readFileSync(new URL(`../../skills/${name}/SKILL.md`, import.meta.url), "utf8");
    const studio = skill("motion-studio");
    expect(studio).toMatch(/ae_check_comp/);
    expect(studio).toMatch(/`review`/);
    expect(studio).toMatch(/comp-room:motion-reviewer/);
    expect(studio).toMatch(/not independent/);
    expect(studio).toMatch(/[Dd]o not (say|call)[^.]*done/);
    const review = skill("motion-review");
    expect(review).toMatch(/ae_check_comp/);
    expect(review).toMatch(/`review`/);
    expect(review).toMatch(/first-watch/);
    // Short enough to follow: the reviewer's skill was 18 lines before this stage.
    expect(review.split("\n").length).toBeLessThan(40);
  });
  it("rejects arbitrary paths instead of reading a user file", () => {
    expect(() => readLibrary("../../package.json")).toThrow("Unknown library");
  });
  it("detects changed content and manifest path escape", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "aes-library-"));
    try {
      writeFileSync(path.join(root,"doc.md"),"changed");
      writeFileSync(path.join(root,"manifest.json"),JSON.stringify({documents:[{id:"x",path:"doc.md",sha256:"wrong"}]}));
      expect(() => readLibrary("x",undefined,root)).toThrow("hash mismatch");
      writeFileSync(path.join(root,"manifest.json"),JSON.stringify({documents:[{id:"x",path:"..",sha256:"wrong"}]}));
      expect(() => readLibrary("x",undefined,root)).toThrow("escapes bundle");
    } finally { rmSync(root,{recursive:true,force:true}); }
  });
});

describe("library search, word by word", () => {
  // Release evals, 2026-11-14: sessions searched "delivery hand-over export alpha audio" and got no
  // documents, because the whole query was matched as one substring; they never reached `quality`.
  const all = readLibrary();
  const docs = all.documents!;
  const modules = all.modules!;
  /** The rule before this change, for one word: the word in "id title kind", or in a module that points at the document. */
  const before = (word: string) => {
    const w = word.trim().toLowerCase();
    const mods = modules.filter(m => [m.id, m.title, m.summary, ...m.tags].some(v => v.toLowerCase().includes(w)));
    const entry = new Set(mods.map(m => m.entryDocument));
    return {
      documents: docs.filter(d => `${d.id} ${d.title} ${d.kind}`.toLowerCase().includes(w) || entry.has(d.id)).map(d => d.id),
      modules: mods.map(m => m.id),
    };
  };
  const ids = (q: string) => ({ documents: readLibrary(undefined, q).documents!.map(d => d.id), modules: readLibrary(undefined, q).modules!.map(m => m.id) });

  it("returns exactly what it did for a one-word query, in the same order", () => {
    for (const word of ["delivery", "keying", "style", "quality", "type"]) {
      expect(before(word).documents.length, word).toBeGreaterThan(0);
      expect(ids(word), word).toEqual(before(word));
    }
  });

  it("finds quality first for the query the hand-over sessions used", () => {
    expect(ids("delivery hand-over export alpha audio").documents[0]).toBe("quality");
    expect(ids("delivery handover export render alpha audio").documents[0]).toBe("quality");
  });

  it("ranks a document matching more words first, then keeps the listing order", () => {
    // "quality" matches both words of its title; assets-depth is listed earlier but matches one.
    const got = ids("delivery quality").documents;
    expect(got[0]).toBe("quality");
    expect(got).toEqual(["quality", ...before("quality").documents.concat(before("delivery").documents).filter((id, i, a) => id !== "quality" && a.indexOf(id) === i).toSorted((a, b) => docs.findIndex(d => d.id === a) - docs.findIndex(d => d.id === b))]);
  });

  it("keeps hyphenated and dotted words whole and splits on other punctuation", () => {
    expect(ids("hand-over")).toEqual(before("hand-over"));
    expect(ids("keying, delivery").documents.toSorted()).toEqual(["keying", "quality"]);
  });

  it("returns the same empty shape when nothing matches, and counts a repeated word once", () => {
    const none = readLibrary(undefined, "zzznomatch qqqq");
    expect(none).toEqual({ startHere: ["motion-language", "production-workflow", "brief-template"], documents: [], modules: [] });
    expect(ids("quality quality")).toEqual(ids("quality"));
  });
});

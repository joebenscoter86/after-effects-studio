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
    expect(doc).toMatch(/two frames after the footage cut/);
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

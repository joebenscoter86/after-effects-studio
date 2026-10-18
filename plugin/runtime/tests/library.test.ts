import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { readLibrary } from "../src/tools/library.js";
describe("studio library", () => {
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

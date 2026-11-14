// The look sheet (stage 11) on pieces drawn for it: three pieces of one look (one palette, one black point, one rhythm;
// grain wide apart), and a fourth like the first but softer. The sheet finds the shared measures, marks the wide one,
// and the softer piece is reported on edge width and nothing else. Skips, saying so, without ffmpeg.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { SHOT_LIMIT } from "../src/color/look.js";
import "../src/operations/index.js";
import { runReferenceCompare, runReferenceReport } from "../src/operations/keying-reference.js";
import { runLookSheet, runLookSheetAdd } from "../src/operations/look-sheet.js";
import { getOp } from "../src/registry.js";
import { lookPieces } from "./helpers/look-pieces.js";
import { writeClip } from "./helpers/video-clips.js";

// Node only: nothing here reaches After Effects
const io: any = { readImage: async () => { throw new Error("no After Effects in this test"); }, execute: async () => ({ ok: false, error: "no After Effects" }), render: async () => [] };
let dir: string, sheetDir: string;
const files: Record<string, string> = {};
let sheetReply: any;
beforeAll(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-look-sheet-"));
  for (const c of lookPieces()) { const f = await writeClip(c, dir); if (f) files[c.name] = f; }
  if (!files["look-a"]) { console.warn("ffmpeg is not installed: the look sheet tests are skipped"); return; }
  sheetDir = path.join(dir, "sheet");
  sheetReply = await runLookSheet({ outDir: sheetDir, pieces: ["look-a", "look-b", "look-c"].map((n) => ({ label: `piece ${n.slice(5)}`, path: files[n] })) }, io);
}, 300_000);
afterAll(async () => { await fs.rm(dir, { recursive: true, force: true }); });

const sheetOf = async () => JSON.parse(await fs.readFile(path.join(sheetDir, "sheet.json"), "utf8"));

describe("reference.sheet", () => {
  it("finds what the pieces share and marks what varies", async (ctx) => {
    if (!files["look-a"]) return ctx.skip();
    expect(sheetReply.ok).toBe(true);
    expect(sheetReply.standing).toBe("3 pieces: a look");
    const s = await sheetOf(), m = (k: string) => s.measures.find((x: any) => x.key === k);
    for (const k of ["levels.black", "rhythm.cutsPerMinute", "rhythm.shotMedian", "rhythm.calm"]) expect({ k, look: m(k).look, pieces: m(k).pieces }).toEqual({ k, look: true, pieces: 3 });
    expect(m("texture.grain").look).toBe(false);
    expect(m("texture.grain").why).toMatch(/varies in your pieces/);
    // the palette: paper, navy and vermilion, each in all three pieces
    const looks = s.palette.filter((c: any) => c.look);
    expect(looks.length).toBeGreaterThanOrEqual(3);
    expect(looks.every((c: any) => c.pieces === 3)).toBe(true);
    // every piece read by ffmpeg, the colour it was decoded with said (these drawn files carry no tags)
    expect(sheetReply.pieces.every((p: any) => p.via === "ffmpeg" && /assumed/.test(p.colour))).toBe(true);
  }, 60_000);
  it("its page names pieces by their labels, says how many pieces, and the shot list's limit beside the shot lengths", async (ctx) => {
    if (!files["look-a"]) return ctx.skip();
    const page = await fs.readFile(path.join(sheetDir, "sheet.md"), "utf8");
    expect(page).toMatch(/3 pieces: a look: piece a, piece b, piece c/);
    expect(page).not.toContain(dir);
    const rhythm = page.slice(page.indexOf("## Rhythm"));
    expect(rhythm.slice(0, rhythm.indexOf("\n## ", 3))).toContain(SHOT_LIMIT);
    expect(page).toMatch(/## Varies in your pieces/);
  }, 60_000);
  it("a piece off in one measure is reported on that measure and no other, against the user's own range", async (ctx) => {
    if (!files["look-soft"]) return ctx.skip();
    const r: any = await runReferenceReport({ path: files["look-soft"], outPath: path.join(dir, "soft.json"), rhythm: true, against: path.join(sheetDir, "sheet.json") }, io);
    expect(r.ok).toBe(true);
    expect(r.compare.differences.map((d: any) => d.measure)).toEqual(["edge width"]);
    expect(r.compare.differences[0].reading).toMatch(/^edge width [\d.]+ px; your pieces sit between [\d.]+ px and [\d.]+ px \(3 pieces\)\.$/);
    // the same through reference.compare, with the saved report (its rhythm kept in it)
    const c: any = await runReferenceCompare({ reference: path.join(sheetDir, "sheet.json"), build: path.join(dir, "soft.json") });
    expect(c.differences.map((d: any) => d.measure)).toEqual(["edge width"]);
    expect(c.notCompared.join(" ")).toMatch(/grain/);
    // a piece of the look itself sits inside it
    const a: any = await runReferenceReport({ path: files["look-a"], outPath: path.join(dir, "a.json"), rhythm: true, against: path.join(sheetDir, "sheet.json") }, io);
    expect(a.compare.differences).toEqual([]);
    expect((await runReferenceCompare({ reference: path.join(dir, "a.json"), build: path.join(sheetDir, "sheet.json") }) as any).error).toMatch(/give the sheet as `reference`/);
  }, 120_000);
  it("adds a piece without measuring the others again", async (ctx) => {
    if (!files["look-soft"]) return ctx.skip();
    const before = await Promise.all(["piece-a", "piece-b", "piece-c"].map((n) => fs.stat(path.join(sheetDir, "pieces", `${n}.json`)).then((s) => s.mtimeMs)));
    const r: any = await runLookSheetAdd({ sheet: path.join(sheetDir, "sheet.json"), piece: { label: "piece d", path: files["look-soft"] } }, io);
    expect(r.ok).toBe(true);
    expect(r.measured).toEqual(["piece d"]);
    expect(r.standing).toBe("4 pieces: a look");
    const after = await Promise.all(["piece-a", "piece-b", "piece-c"].map((n) => fs.stat(path.join(sheetDir, "pieces", `${n}.json`)).then((s) => s.mtimeMs)));
    expect(after).toEqual(before);
    expect((await sheetOf()).measures.find((x: any) => x.key === "texture.edge").look).toBe(false);   // now it varies
    expect((await runLookSheetAdd({ sheet: path.join(sheetDir, "sheet.json"), piece: { label: "piece d", path: files["look-soft"] } }, io) as any).error).toMatch(/already has/);
  }, 120_000);
  it("one piece is one piece: its own numbers, said so", async (ctx) => {
    if (!files["look-a"]) return ctx.skip();
    const r: any = await runLookSheet({ outDir: path.join(dir, "one"), pieces: [{ label: "only", path: files["look-a"] }] }, io);
    expect(r.standing).toMatch(/^one piece/);
    const c: any = await runReferenceCompare({ reference: path.join(dir, "one", "sheet.json"), build: path.join(dir, "soft.json") });
    expect(c.differences.find((d: any) => d.measure === "edge width").reading).toMatch(/your 1 piece: /);
  }, 60_000);
  it("refuses pieces without labels, or with the same label twice", async () => {
    expect(((await runLookSheet({ outDir: path.join(os.tmpdir(), "x"), pieces: [{ path: "/a.mp4" }, { path: "/b.mp4" }] }, io)) as any).error).toMatch(/label/);
    expect(((await runLookSheet({ outDir: path.join(os.tmpdir(), "x"), pieces: [{ label: "a", path: "/a.mp4" }, { label: "a", path: "/b.mp4" }] }, io)) as any).error).toMatch(/own `label`/);
  });
  it("is registered beside the reference operations", () => {
    for (const n of ["reference.sheet", "reference.sheet_add"]) expect(getOp(n)?.category).toBe("look");
  });
});

// The technique arsenal: the per-beat query (the same rules as tools/channel-learner/catalog.mjs findTechniques, whose
// tests these mirror), reading a recipe by id and pinned revision, the job list, and the ae_arsenal tool's replies.
// Offline: nothing here contacts After Effects.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { arsenalTool, browseCatalog, findByProvides, findTechniques, listJobs, loadCatalog, parseProvides, queryWords, recipeReply, stem, type ArsenalCatalog, type ArsenalRecipe, type BeatAsk } from "../src/tools/arsenal.js";
import { existsSync } from "node:fs";

const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "library");
const JOBS = ["before-after", "point-at-detail", "light-the-hero", "finish-the-look", "add-depth", "hand-over"];

// A catalog record in the shipped shape; `status: "proven"` or unproven, kind technique unless given.
function rec(i: number, slug: string, o: Partial<ArsenalRecipe> = {}): ArsenalRecipe {
  return {
    id: `${String(i).padStart(2, "0")}-${slug}`, revision: `rev${slug}`.padEnd(8, "0").slice(0, 8), name: `Name ${slug}`, line: `Line ${slug}.`,
    status: "unproven", kind: "technique", level: "recipe", provides: [], cost: { renderer: "classic" }, composes: [], shelf: "shipped", job: "before-after", support: [], mood: [], needs: [], duration: 2, motion: "one-shot",
    difficulty: 1, taught_by: 1, variants: [], section: { document: "arsenal-line", heading: `Name ${slug}` }, still: null, ...o,
  };
}
// entries: [{ slug, group?, ...record fields }]; taught_by counts the entries sharing a group, as the builder does.
function catalogOf(entries: Array<Partial<ArsenalRecipe> & { slug: string; group?: string }>): ArsenalCatalog {
  const groups: Record<string, number> = {};
  for (const e of entries) if (e.group) groups[e.group] = (groups[e.group] ?? 0) + 1;
  return {
    vocab: "jobs-v1", version: "abcdef12", jobs: JOBS,
    entries: entries.map(({ slug, group, ...o }, i) => rec(i + 1, slug, { taught_by: group ? groups[group] : 1, ...o })),
  };
}
const ids = (out: { results: Array<{ id: string }> }) => out.results.map((r) => r.id.slice(3));
const ask = (o: Partial<BeatAsk> = {}): BeatAsk => ({ vocab: "jobs-v1", job: "before-after", ...o });
const P = { status: "proven" as const };

describe("findTechniques: the rules of catalog.mjs", () => {
  it("refuses an ask written against another vocabulary", () => {
    const cat = catalogOf([{ slug: "a", ...P }]);
    expect(() => findTechniques(cat, ask({ vocab: "jobs-v2" }))).toThrow(/vocab jobs-v2.*catalog is jobs-v1/);
  });

  it("refuses an unknown job id and lists the valid ones", () => {
    const cat = catalogOf([{ slug: "a", ...P }]);
    expect(() => findTechniques(cat, ask({ job: "before-and-after" }))).toThrow(/unknown job "before-and-after".*before-after, point-at-detail, light-the-hero/);
    expect(() => findTechniques(cat, ask({ support: ["glowy"] }))).toThrow(/unknown job "glowy"/);
  });

  it("answers carry the vocab and the catalog version", () => {
    const out = findTechniques(catalogOf([{ slug: "a", ...P }]), ask());
    expect(out.vocab).toBe("jobs-v1");
    expect(out.version).toBe("abcdef12");
  });

  it("never returns build-aid or unmatched recipes", () => {
    const cat = catalogOf([{ slug: "aid", ...P, kind: "build-aid", job: null }, { slug: "odd", ...P, kind: "unmatched", job: null }, { slug: "ok", ...P }]);
    expect(ids(findTechniques(cat, ask({ constraints: { status: "any" } })))).toEqual(["ok"]);
  });

  it("matches the job as a recipe's primary or support job, and nothing else", () => {
    const cat = catalogOf([{ slug: "primary", ...P }, { slug: "support", ...P, job: "add-depth", support: ["before-after"] }, { slug: "other", ...P, job: "hand-over" }]);
    expect(ids(findTechniques(cat, ask()))).toEqual(["primary", "support"]);
  });

  it("proven only by default; status any lets unproven through", () => {
    const cat = catalogOf([{ slug: "p", ...P }, { slug: "u" }]);
    expect(ids(findTechniques(cat, ask()))).toEqual(["p"]);
    expect(ids(findTechniques(cat, ask({ constraints: { status: "any" } })))).toEqual(["p", "u"]);
  });

  it("drops excluded ids", () => {
    const cat = catalogOf([{ slug: "a", ...P }, { slug: "b", ...P }]);
    expect(ids(findTechniques(cat, ask({ exclude: ["01-a"] })))).toEqual(["b"]);
  });

  it("drops recipes needing assets the beat does not have; type and shapes always pass", () => {
    const cat = catalogOf([
      { slug: "nothing", ...P, needs: [] }, { slug: "typeshapes", ...P, needs: ["type", "shapes"] }, { slug: "footage", ...P, needs: ["footage"] },
      { slug: "photo", ...P, needs: ["photo"] }, { slug: "illus", ...P, needs: ["illustration"] },
    ]);
    expect(ids(findTechniques(cat, ask({ assets: { type: "24 / 25" } })))).toEqual(["nothing", "typeshapes"]);
    expect(ids(findTechniques(cat, ask({ assets: { screen: "a recording" } })))).toEqual(["nothing", "typeshapes", "footage"]);
    expect(ids(findTechniques(cat, ask({ assets: { footage: "x" } })))).toEqual(["nothing", "typeshapes", "footage"]);
    expect(ids(findTechniques(cat, ask({ assets: { library: "agent" } })))).toEqual(["nothing", "typeshapes", "photo", "illus"]);
    expect(ids(findTechniques(cat, ask({ assets: { photo: "p" } })))).toEqual(["nothing", "typeshapes", "photo", "illus"]);
    expect(ids(findTechniques(cat, ask({ assets: ["photo"] })))).toEqual(["nothing", "typeshapes", "photo", "illus"]);
    expect(ids(findTechniques(cat, ask({ assets: "none" })))).toEqual(["nothing", "typeshapes"]);
    expect(findTechniques(cat, ask()).results).toHaveLength(5);
  });

  it("ranks primary before support-only, then proven, then taught_by, then mood, then duration", () => {
    const cat = catalogOf([
      { slug: "support", ...P, job: "add-depth", support: ["before-after"], group: "g", mood: ["calm"] },
      { slug: "unproven", job: "before-after" },
      { slug: "near", ...P, duration: 4 },
      { slug: "far", ...P, duration: 12 },
      { slug: "mood", ...P, mood: ["Premium"], duration: 12 },
      { slug: "taught", ...P, group: "shared", duration: 12 },
      { slug: "taught2", job: "hand-over", group: "shared" },
    ]);
    const out = findTechniques(cat, ask({ mood: ["premium"], duration: 4.6, constraints: { status: "any" }, limit: 10 }));
    expect(ids(out)).toEqual(["taught", "mood", "near", "far", "unproven", "support"]);
  });

  it("reads a duration of the form \"1.5 s+\" as fitting from 1.5 up", () => {
    const cat = catalogOf([{ slug: "open", ...P, duration: "1.5 s+" }, { slug: "fixed", ...P, duration: 3 }]);
    expect(ids(findTechniques(cat, ask({ duration: 2.5 })))).toEqual(["open", "fixed"]);
  });

  it("limit defaults to 5", () => {
    const cat = catalogOf(Array.from({ length: 7 }, (_, i) => ({ slug: `r${i}`, ...P })));
    expect(findTechniques(cat, ask()).results).toHaveLength(5);
    expect(findTechniques(cat, ask({ limit: 2 })).results).toHaveLength(2);
  });

  it("each result carries the fields a brief needs and a plain fit line", () => {
    const cat = catalogOf([{ slug: "a", ...P, needs: ["footage"], mood: ["premium", "calm"], duration: 3, motion: "one-shot" }]);
    const [r] = findTechniques(cat, ask({ mood: ["premium"], assets: { footage: "x" } })).results;
    expect(Object.keys(r).sort()).toEqual(["duration", "fit", "id", "line", "motion", "name", "needs", "revision", "section", "status", "still"].sort());
    expect(r.id).toBe("01-a");
    expect(r.revision).toBe(cat.entries[0].revision);
    expect(r.fit).toMatch(/primary job before-after/);
    expect(r.fit).toMatch(/needs met: footage/);
    expect(r.fit).toMatch(/mood: premium/);
  });

  it("when status leaves nothing, returns the nearest by job and says status was relaxed", () => {
    const cat = catalogOf([{ slug: "u" }, { slug: "other", ...P, job: "hand-over" }]);
    const out = findTechniques(cat, ask());
    expect(ids(out)).toEqual(["u"]);
    expect(out.relaxed).toEqual(["status"]);
    expect(out.results[0].fit).toMatch(/unproven/);
  });

  it("relaxes needs only after status, and never the job or the exclusions", () => {
    const cat = catalogOf([{ slug: "foot", needs: ["footage"] }, { slug: "ex", ...P }, { slug: "other", ...P, job: "hand-over" }]);
    const out = findTechniques(cat, ask({ assets: { type: "x" }, exclude: ["02-ex"] }));
    expect(ids(out)).toEqual(["foot"]);
    expect(out.relaxed).toEqual(["status", "needs"]);
    const none = findTechniques(cat, ask({ job: "light-the-hero" }));
    expect(none.results).toEqual([]);
    expect(none.relaxed).toBeUndefined();
  });

  it("a full answer carries no relaxed field", () => {
    expect("relaxed" in findTechniques(catalogOf([{ slug: "a", ...P }]), ask())).toBe(false);
  });

  it("never returns a variant on its own; its parent carries the variant ids", () => {
    const cat = catalogOf([
      { slug: "a", ...P, duration: 12, taught_by: 2, variants: ["02-v"] },
      { slug: "v", ...P, duration: 2, variant_of: "01-a" },
      { slug: "plain", ...P, duration: 2 },
    ]);
    const out = findTechniques(cat, ask({ duration: 2 }));
    expect(out.results.map((r) => r.id)).toEqual(["01-a", "03-plain"]);
    expect(out.results[0].variants).toEqual(["02-v"]);
    expect("variants" in out.results[1]).toBe(false);
    expect(out.results[0].fit).toMatch(/taught 2 times/);
    expect(findTechniques(cat, ask({ exclude: ["01-a"] })).results.map((r) => r.id)).toEqual(["03-plain"]);
  });

  // A variant can be learned for another beat than its parent (a bounce on step pictures, then the same bounce on a
  // title): it is found for its own job when its parent does not serve that job, and says whose variant it is.
  it("a variant whose job its parent does not serve is a candidate on its own, naming its parent", () => {
    const cat = catalogOf([
      { slug: "a", ...P, job: "point-at-detail", variants: ["02-v", "03-w"] },
      { slug: "v", ...P, variant_of: "01-a" },
      { slug: "w", ...P, job: "point-at-detail", support: ["before-after"], variant_of: "01-a" },
    ]);
    const out = findTechniques(cat, ask());
    expect(out.results.map((r) => r.id)).toEqual(["02-v", "03-w"]);
    expect(out.results[0].variant_of).toBe("01-a");
    expect(out.results[0].fit).toMatch(/variant of 01-a/);
    expect(findTechniques(cat, ask({ job: "point-at-detail" })).results.map((r) => r.id)).toEqual(["01-a"]);
  });
});

describe("the shipped arsenal", () => {
  const manifest = JSON.parse(readFileSync(path.join(LIB, "manifest.json"), "utf8")) as { documents: Array<{ id: string; path: string; kind: string }> };
  const index = JSON.parse(readFileSync(path.join(LIB, "arsenal", "index.json"), "utf8")) as { documents: Array<{ id: string; path: string; kind: string }> };

  it("the library manifest registers every document the arsenal index lists, with its path and kind", () => {
    for (const d of index.documents) {
      expect(manifest.documents.find((e) => e.id === d.id), d.id).toMatchObject({ path: d.path, kind: d.kind });
    }
    expect(manifest.documents.find((e) => e.id === "arsenal-index")?.kind).toBe("catalog");
  });

  it("add-depth, proven only, returns five proven recipes", () => {
    const out = findTechniques(loadCatalog(LIB), { vocab: "jobs-v1", job: "add-depth" });
    expect(out.results).toHaveLength(5);
    expect(out.results.every((r) => r.status === "proven")).toBe(true);
    expect(out.relaxed).toBeUndefined();
  });

  // An empty job returns an empty list, not an error. count-things is still empty after
  // explainer cookbook piece 1 filled land-number; move this to another empty job when it fills.
  it("count-things returns none", () => {
    expect(findTechniques(loadCatalog(LIB), { vocab: "jobs-v1", job: "count-things" }).results).toEqual([]);
  });

  it("every variant can be found for each of its jobs, as itself or through its parent", () => {
    const cat = loadCatalog(LIB);
    const variants = cat.entries.filter((r) => r.variant_of && r.kind === "technique");
    expect(variants.length).toBeGreaterThan(0);
    for (const v of variants) {
      for (const job of [v.job!, ...v.support]) {
        const got = findTechniques(cat, { vocab: "jobs-v1", job, constraints: { status: "any" }, limit: 500 }).results.map((r) => r.id);
        expect(got.includes(v.id) || got.includes(v.variant_of!), `${v.id} for ${job}`).toBe(true);
      }
    }
    expect(findTechniques(cat, { vocab: "jobs-v1", job: "reveal-headline", limit: 500 }).results.map((r) => r.id)).toContain("01-bounce-keyframes-word-stagger");
  });

  it("make-it-pop is refused with the valid job ids", () => {
    expect(() => findTechniques(loadCatalog(LIB), { vocab: "jobs-v1", job: "make-it-pop" })).toThrow(/unknown job "make-it-pop".*land-number/);
  });

  it("every proven technique, piece and style with a still has its JPEG in the package, and no other entry has one", () => {
    const cat = loadCatalog(LIB);
    for (const r of cat.entries) {
      if (r.still) expect(r.status === "proven" && (r.kind === "technique" || r.kind === "piece" || r.kind === "style"), r.id).toBe(true);
      if (r.still) expect(readFileSync(path.join(LIB, r.still.path)).subarray(0, 2).toString("hex"), r.id).toBe("ffd8");
    }
    expect(cat.entries.filter((r) => r.still).length).toBeGreaterThan(0);
  });
});

describe("reading a recipe", () => {
  const cat = () => loadCatalog(LIB);

  it("returns the recipe's full text under its id and revision", () => {
    const r = cat().entries.find((x) => x.id === "12-long-soft-shadow")!;
    const text = recipeReply("12-long-soft-shadow", undefined, LIB);
    expect(text.split("\n")[0]).toContain(`12-long-soft-shadow@${r.revision}`);
    expect(text).toContain(`## ${r.name}`);
    expect(text).toMatch(/^steps:$/m);
    expect(text).not.toMatch(/WARNING/);
  });

  it("warns, and still answers, when the pinned revision is not the shipped one", () => {
    const r = cat().entries.find((x) => x.id === "12-long-soft-shadow")!;
    const text = recipeReply("12-long-soft-shadow", "00000000", LIB);
    expect(text).toMatch(new RegExp(`WARNING: pinned revision 00000000; the shipped revision is ${r.revision}`));
    expect(text).toContain(`## ${r.name}`);
    expect(recipeReply("12-long-soft-shadow", r.revision, LIB)).not.toMatch(/WARNING/);
  });

  it("refuses an unknown id", () => {
    expect(() => recipeReply("99-nope", undefined, LIB)).toThrow(/unknown id "99-nope"; ae_arsenal browse and find return ids/);
  });
});

describe("reading a variant", () => {
  // A small library holding a parent and its variant, laid out and hashed as the shipped one is.
  function library(): string {
    const root = mkdtempSync(path.join(tmpdir(), "arsenal-variant-"));
    mkdirSync(path.join(root, "arsenal"));
    const recipes = "# Arsenal recipes: Line jobs\n\n## Name a\nid: 01-a\nrevision: reva0000\njob: before-after\nstatus: unproven\nsteps:\n1. Do a.\n\n"
      + "## Name v\nid: 02-v\nrevision: revv0000\njob: before-after\nstatus: unproven\nvariant of: 01-a\ndiffers: Slower.\nsteps:\n1. Do v.\n";
    const catalog = JSON.stringify({ vocab: "jobs-v1", version: "abcdef12", jobs: JOBS, entries: [
      rec(1, "a", { revision: "reva0000", taught_by: 2, variants: ["02-v"] }),
      rec(2, "v", { revision: "revv0000", variant_of: "01-a" }),
    ] });
    const docs = [["arsenal-catalog", "arsenal/catalog.json", catalog], ["arsenal-line", "arsenal/recipes-line.md", recipes]] as const;
    for (const [, p, text] of docs) writeFileSync(path.join(root, p), text);
    writeFileSync(path.join(root, "manifest.json"), JSON.stringify({ documents: docs.map(([id, p, text]) => ({ id, path: p, kind: "catalog", sha256: createHash("sha256").update(text).digest("hex") })) }));
    return root;
  }

  it("get works for a variant id, and the reply head names its parent", () => {
    const root = library();
    try {
      const text = recipeReply("02-v", undefined, root);
      expect(text.split("\n")[0]).toMatch(/^ae_arsenal recipe 02-v@revv0000 \(unproven, technique; variant of 01-a;/);
      expect(text).toMatch(/^differs: Slower\.$/m);
      expect(recipeReply("01-a", undefined, root).split("\n")[0]).not.toMatch(/variant of/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});

describe("the job list", () => {
  it("lists every job in the vocabulary with its group and one-line definition", () => {
    const jobs = listJobs(LIB);
    expect(jobs.vocab).toBe("jobs-v1");
    expect(jobs.jobs.map((j) => j.id)).toEqual(loadCatalog(LIB).jobs);
    expect(jobs.jobs.find((j) => j.id === "add-depth")).toMatchObject({ group: "picture", name: expect.any(String), definition: expect.stringMatching(/\S/) });
    expect(Object.keys(jobs.tags)).toEqual(["build-aid", "unmatched"]);
  });
});

describe("ae_arsenal", () => {
  const call = (args: Record<string, unknown>) => arsenalTool.handler(args as never, {} as never);
  const text = (r: { content: Array<{ type: string; text?: string }> }) => r.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");

  it("find returns the shortlist as text and each candidate's still as image content, with no structured part", async () => {
    const r = await call({ action: "find", job: "add-depth" });
    expect(r.isError).toBe(false);
    expect(r.structuredContent).toBeUndefined();
    const answer = JSON.parse(r.content[0].type === "text" ? r.content[0].text : "");
    expect(answer.results).toHaveLength(5);
    const images = r.content.filter((c) => c.type === "image");
    expect(images.length).toBe(answer.results.filter((x: { still: unknown }) => x.still).length);
    expect(images.length).toBeGreaterThan(0);
    for (const img of images) {
      expect(img).toMatchObject({ mimeType: "image/jpeg" });
      expect(Buffer.from((img as { data: string }).data, "base64").subarray(0, 2).toString("hex")).toBe("ffd8");
    }
  });

  it("find without a vocab asks against the shipped one; a wrong vocab or job is refused with the valid list", async () => {
    expect((await call({ action: "find", vocab: "jobs-v1", job: "add-depth" })).isError).toBe(false);
    const wrong = await call({ action: "find", vocab: "jobs-v9", job: "add-depth" });
    expect(wrong.isError).toBe(true);
    expect(text(wrong)).toMatch(/vocab jobs-v9.*catalog is jobs-v1/);
    const pop = await call({ action: "find", job: "make-it-pop" });
    expect(pop.isError).toBe(true);
    expect(text(pop)).toMatch(/unknown job "make-it-pop".*add-depth/);
  });

  it("find without a job is refused", async () => {
    const r = await call({ action: "find" });
    expect(r.isError).toBe(true);
    expect(text(r)).toMatch(/job/);
  });

  it("get returns the recipe text, and a warning for another revision", async () => {
    const r = await call({ action: "get", id: "12-long-soft-shadow", revision: "00000000" });
    expect(r.isError).toBe(false);
    expect(text(r)).toMatch(/WARNING: pinned revision 00000000/);
    expect(text(r)).toMatch(/^steps:$/m);
    const missing = await call({ action: "get" });
    expect(missing.isError).toBe(true);
  });

  it("jobs lists the vocabulary", async () => {
    const r = await call({ action: "jobs" });
    expect(r.isError).toBe(false);
    expect(text(r)).toMatch(/add-depth/);
    expect(text(r)).toMatch(/land-number/);
  });
});

describe("being found", () => {
  it("the motion-studio skill tells an agent planning shots to ask ae_arsenal per beat, by job, before building", () => {
    const skill = readFileSync(path.join(LIB, "..", "skills", "motion-studio", "SKILL.md"), "utf8");
    expect(skill).toMatch(/ae_arsenal[^.]*\bper beat\b[^.]*\bjob\b[^.]*before building/i);
  });
});

// ---------- three levels: browse, find across levels, get for any level ----------

describe("across levels: the rules", () => {
  const VOCAB = { material: ["glass", "paper"], floor: ["gloss-dark"], depth: [] as string[] };
  const style = (i: number, slug: string, o: Partial<ArsenalRecipe> = {}) => rec(i, slug, {
    id: `style-${slug}`, kind: "style", level: "style", job: null, status: "proven", still: { path: `arsenal/stills/style-${slug}.jpg`, sha256: "x" }, ...o,
  });
  const catalog = (): ArsenalCatalog => ({
    vocab: "jobs-v1", version: "abcdef12", jobs: JOBS, levels: ["style", "world", "recipe"], provides: VOCAB,
    entries: [
      rec(1, "glassrecipe", { status: "proven", provides: ["material: glass", "depth"], still: { path: "a.jpg", sha256: "x" } }),
      rec(2, "paper", { status: "proven", provides: ["material: paper"], still: { path: "b.jpg", sha256: "x" } }),
      rec(3, "aid", { status: "proven", kind: "build-aid", job: null, provides: ["depth"], no_still: "build aid" }),
      style(4, "glassworld", { level: "world", also_level: ["style"], provides: ["material: glass", "floor: gloss-dark"] }),
      style(5, "poster", { provides: ["material: paper"] }),
      style(6, "nostill", { provides: ["material: glass"], still: null, no_still: "no proof movie" }),
    ],
  });

  it("parses provides as key or key: word", () => {
    expect(parseProvides("material: glass")).toEqual(["material", "glass"]);
    expect(parseProvides("Floor")).toEqual(["floor", null]);
    expect(parseProvides("glass!")).toBeNull();
  });

  it("find by provides crosses levels: the glass world and the glass recipe together, best match first", () => {
    const out = findByProvides(catalog(), { provides: ["material: glass", "floor: gloss-dark"] });
    expect(out.results.map((r) => r.id)).toEqual(["style-glassworld", "01-glassrecipe", "style-nostill"]);
    expect(out.results[0].fit).toMatch(/world, also style; provides material: glass, floor: gloss-dark; proven/);
    expect(out.results[2].fit).toMatch(/no still: no proof movie/);
  });

  it("a bare key matches any word under it; level narrows; also_level counts", () => {
    expect(findByProvides(catalog(), { provides: ["material"], limit: 10 }).results.map((r) => r.id)).toEqual(["01-glassrecipe", "02-paper", "style-glassworld", "style-poster", "style-nostill"]);
    expect(findByProvides(catalog(), { level: "world" }).results.map((r) => r.id)).toEqual(["style-glassworld"]);
    expect(findByProvides(catalog(), { level: "style", provides: ["material: glass"] }).results.map((r) => r.id)).toEqual(["style-glassworld", "style-nostill"]);
  });

  it("refuses an unknown level, provides key or word, naming the valid ones, and an empty ask", () => {
    expect(() => findByProvides(catalog(), { level: "scene" })).toThrow(/unknown level "scene"; valid levels: style, world, recipe/);
    expect(() => findByProvides(catalog(), { provides: ["sparkle"] })).toThrow(/unknown provides key "sparkle"; valid keys: material, floor, depth/);
    expect(() => findByProvides(catalog(), { provides: ["material: wood"] })).toThrow(/unknown material word "wood"; valid material words: glass, paper/);
    expect(() => findByProvides(catalog(), {})).toThrow(/needs a job, a level, provides or a query/);
  });

  it("a job query never returns a style, whatever it provides", () => {
    const out = findTechniques(catalog(), { vocab: "jobs-v1", job: "before-after", constraints: { status: "any" }, limit: 20 });
    expect(out.results.map((r) => r.id)).toEqual(["01-glassrecipe", "02-paper"]);
  });

  it("browse shows a level in catalog order, hides entries with no still unless asked, and counts them", () => {
    const page = browseCatalog(catalog(), { level: "style" });
    expect(page.tiles.map((t) => t.id)).toEqual(["style-glassworld", "style-poster"]);
    expect(page.hidden_without_still).toBe(1);
    expect(page.tiles[0]).toMatchObject({ n: 1, name: "Name glassworld", level: "world", also_level: ["style"], provides: ["material: glass", "floor: gloss-dark"] });
    const all = browseCatalog(catalog(), { level: "style", include_unpictured: true });
    expect(all.tiles.map((t) => t.id)).toEqual(["style-glassworld", "style-poster", "style-nostill"]);
    expect(all.tiles[2].no_still).toBe("no proof movie");
  });

  it("browse with no level shows every level, styles first, each entry once; provides filters", () => {
    expect(browseCatalog(catalog()).tiles.map((t) => t.id)).toEqual(["style-glassworld", "style-poster", "01-glassrecipe", "02-paper"]);
    expect(browseCatalog(catalog(), { provides: ["material: paper"] }).tiles.map((t) => t.id)).toEqual(["style-poster", "02-paper"]);
  });

  it("a variant stands behind its parent unless it alone gives what was asked; then it is found and browsed, naming its parent", () => {
    const cat = catalog();
    cat.entries[0].variants = ["07-varpaper"];
    cat.entries.push(rec(7, "varpaper", { status: "proven", provides: ["material: paper", "material: glass"], variant_of: "01-glassrecipe", still: { path: "c.jpg", sha256: "x" } }));
    expect(findByProvides(cat, { provides: ["material: glass"] }).results.map((r) => r.id)).not.toContain("07-varpaper");
    const paper = findByProvides(cat, { provides: ["material: paper"], level: "recipe" });
    expect(paper.results.map((r) => r.id)).toEqual(["02-paper", "07-varpaper"]);
    expect(paper.results[1].variant_of).toBe("01-glassrecipe");
    expect(paper.results[1].fit).toMatch(/variant of 01-glassrecipe/);
    expect(browseCatalog(cat).tiles.map((t) => t.id)).not.toContain("07-varpaper");
    const tiles = browseCatalog(cat, { provides: ["material: paper"] }).tiles;
    expect(tiles.map((t) => t.id)).toEqual(["style-poster", "02-paper", "07-varpaper"]);
    expect(tiles[2].variant_of).toBe("01-glassrecipe");
  });

  it("browse pages: page size, numbering across pages, the last page when asked past it", () => {
    const p2 = browseCatalog(catalog(), { page: 2, page_size: 3 });
    expect(p2).toMatchObject({ page: 2, pages: 2, page_size: 3, total: 4 });
    expect(p2.tiles.map((t) => [t.n, t.id])).toEqual([[4, "02-paper"]]);
    expect(browseCatalog(catalog(), { page: 9, page_size: 3 }).page).toBe(2);
    expect(browseCatalog(catalog(), { page_size: 500 }).page_size).toBe(24);
  });
});

describe("the shipped catalog at three levels", () => {
  const cat = () => loadCatalog(LIB);

  it("every entry has a level, provides from the vocabulary, cost, composes, shelf, and a still or the reason it has none", () => {
    const c = cat();
    expect(c.levels).toEqual(["style", "world", "recipe"]);
    for (const e of c.entries) {
      expect(["style", "world", "recipe"], e.id).toContain(e.level);
      expect(e.shelf, e.id).toBe("shipped");
      expect(Array.isArray(e.composes), e.id).toBe(true);
      expect(["classic", "advanced-3d", "blender"], e.id).toContain(e.cost.renderer);
      expect(Boolean(e.still) || Boolean(e.no_still), e.id).toBe(true);
      for (const p of e.provides) {
        const k = parseProvides(p)!;
        expect(c.provides![k[0]], `${e.id} ${p}`).toBeDefined();
        if (k[1]) expect(c.provides![k[0]], `${e.id} ${p}`).toContain(k[1]);
      }
      if (e.kind === "technique") expect(e.provides.length, e.id).toBeGreaterThan(0);
    }
  });

  it("every recipe is level recipe; every visual style is a style or a world, readable through ae_library", () => {
    const c = cat();
    const manifest = JSON.parse(readFileSync(path.join(LIB, "manifest.json"), "utf8")) as { documents: Array<{ id: string }> };
    const styles = JSON.parse(readFileSync(path.join(LIB, "styles", "index.json"), "utf8")) as { styles: Array<{ id: string }> };
    for (const e of c.entries.filter((x) => x.kind !== "style")) expect(e.level, e.id).toBe("recipe");
    // the visual styles; the house and example style blocks are style entries of their own (role), tested below
    const styleEntries = c.entries.filter((x) => x.kind === "style" && !x.role);
    expect(styleEntries.map((e) => e.id).sort()).toEqual(styles.styles.map((s) => `style-${s.id}`).sort());
    for (const e of styleEntries) {
      expect(["style", "world"], e.id).toContain(e.level);
      expect(manifest.documents.some((d) => d.id === e.section.document), e.id).toBe(true);
    }
  });

  it("acceptance: find with provides material: glass returns the glass-product world", () => {
    const out = findByProvides(cat(), { provides: ["material: glass"] });
    expect(out.results.map((r) => r.id)).toContain("style-glass-product");
    const world = findByProvides(cat(), { provides: ["material: glass", "floor: gloss-dark"] });
    expect(world.results[0].id).toBe("style-glass-product");
  });

  it("acceptance: browse at the world level shows glass product, with its still", () => {
    const page = browseCatalog(cat(), { level: "world" });
    const tile = page.tiles.find((t) => t.id === "style-glass-product");
    expect(tile).toMatchObject({ level: "world", name: "Glass product" });
    expect(tile!.provides).toContain("material: glass");
    expect(cat().entries.find((e) => e.id === "style-glass-product")!.still).not.toBeNull();
  });

  it("a job query on the shipped catalog returns no style, for every job", () => {
    const c = cat();
    const recipesOnly: ArsenalCatalog = { ...c, entries: c.entries.filter((e) => e.kind !== "style") };
    for (const job of c.jobs) {
      const a = findTechniques(c, { vocab: c.vocab, job, constraints: { status: "any" }, limit: 20 });
      const b = findTechniques(recipesOnly, { vocab: c.vocab, job, constraints: { status: "any" }, limit: 20 });
      expect(a.results.map((r) => r.id), job).toEqual(b.results.map((r) => r.id));
    }
  });
});

describe("ae_arsenal across levels", () => {
  const call = (args: Record<string, unknown>) => arsenalTool.handler(args as never, {} as never);
  const text = (r: { content: Array<{ type: string; text?: string }> }) => r.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");

  it("browse returns a labelled page: a legend, then a label line before each still", async () => {
    const r = await call({ action: "browse", level: "world" });
    expect(r.isError).toBe(false);
    expect(r.structuredContent).toBeUndefined();
    const t = text(r);
    expect(t).toMatch(/^ae_arsenal browse: level world; page 1 of 1/);
    expect(t).toMatch(/Tile \d+: style-glass-product · Glass product · world, also style · pieces: PCS\.use\('glass-product'\) · provides material: glass/);
    const kinds = r.content.map((c) => c.type);
    const firstImage = kinds.indexOf("image");
    expect(firstImage).toBeGreaterThan(1);
    expect(kinds[firstImage - 1]).toBe("text");
    const images = r.content.filter((c) => c.type === "image");
    expect(images.length).toBeGreaterThan(0);
    for (const img of images) expect(Buffer.from((img as { data: string }).data, "base64").subarray(0, 2).toString("hex")).toBe("ffd8");
  });

  it("browse pages through the recipes, twelve at a time by default", async () => {
    const r = await call({ action: "browse", level: "recipe", page: 2 });
    const page = JSON.parse(text(r).split("\n").slice(1).join("\n").split("\nTile ")[0]);
    expect(page).toMatchObject({ page: 2, page_size: 12 });
    expect(page.tiles[0].n).toBe(13);
    expect(page.hidden_without_still).toBeGreaterThan(0);
  });

  it("find with provides returns entries across levels with their stills; a job query is unchanged", async () => {
    const r = await call({ action: "find", provides: "material: glass" });
    expect(r.isError).toBe(false);
    const answer = JSON.parse(r.content[0].type === "text" ? r.content[0].text : "");
    expect(answer.results.map((x: { id: string }) => x.id)).toContain("style-glass-product");
    expect(r.content.some((c) => c.type === "image")).toBe(true);
    const both = await call({ action: "find", job: "add-depth", provides: "depth" });
    expect(both.isError).toBe(true);
    expect(text(both)).toMatch(/not both/);
    const bad = await call({ action: "find", provides: "material: wood" });
    expect(bad.isError).toBe(true);
    expect(text(bad)).toMatch(/valid material words: glass/);
  });

  it("get works for a world: its catalog facts and its ae_library document, with its still", async () => {
    const r = await call({ action: "get", id: "style-glass-product" });
    expect(r.isError).toBe(false);
    const t = text(r);
    expect(t.split("\n")[0]).toMatch(/^ae_arsenal world style-glass-product@[0-9a-f]{8} \(world, also style; proven; shelf shipped;/);
    expect(t).toMatch(/^provides: material: glass; /m);
    expect(t).toMatch(/^cost: renderer blender, /m);
    expect(t).toMatch(/Glass product/);
    expect(r.content.some((c) => c.type === "image")).toBe(true);
    const pinned = await call({ action: "get", id: "style-glass-product", revision: "00000000" });
    expect(text(pinned)).toMatch(/WARNING: pinned revision 00000000/);
  });

  it("a brief's pinned recipe id@revision still resolves through get with no warning", async () => {
    const r = loadCatalog(LIB).entries.find((e) => e.id === "12-long-soft-shadow")!;
    const out = await call({ action: "get", id: r.id, revision: r.revision });
    expect(out.isError).toBe(false);
    expect(text(out)).not.toMatch(/WARNING/);
    expect(text(out).split("\n")[0]).toContain(`12-long-soft-shadow@${r.revision}`);
  });

  it("jobs also lists the levels and the provides vocabulary", async () => {
    const out = JSON.parse(text(await call({ action: "jobs" })));
    expect(out.levels).toEqual(["style", "world", "recipe"]);
    expect(out.provides.material).toContain("glass");
  });
});

// ---------- pieces: runnable recipes, found first, answered with their call ----------

describe("pieces: the rules", () => {
  const CALL = { load: "flip", signature: "PCS.flip(layer, { t })", options: [{ name: "t", text: "start time" }], returns: "the layer", example: "PCS.flip(p, { t: 1 });", notes: [] };
  const piece = (i: number, slug: string, o: Partial<ArsenalRecipe> = {}) => rec(i, slug, {
    id: `piece-${slug}`, kind: "piece", status: "proven", duration: null, motion: null, still: { path: `arsenal/stills/piece-${slug}.jpg`, sha256: "x" },
    use_for: "something that turns over", call: { ...CALL, load: slug }, ...o,
  });
  const catalog = (): ArsenalCatalog => ({
    vocab: "jobs-v1", version: "abcdef12", jobs: JOBS, levels: ["style", "world", "recipe"], provides: { motion: ["flip"] },
    entries: [
      rec(1, "turnover", { status: "proven", line: "A card turns over to show its back.", taught_by: 3 }),
      rec(2, "wipe", { status: "proven", line: "A wipe from left to right." }),
      piece(3, "flip", { name: "Flip an object over", line: "Turns an object over to its other side.", provides: ["motion: flip"], support: ["hand-over"] }),
      piece(4, "spot", { name: "Spot light", line: "Lights one object.", job: "light-the-hero", use_for: "the one thing to look at" }),
    ],
  });

  it("a job find lists the piece first, ahead of a proven written recipe taught three times, and names its call", () => {
    const out = findTechniques(catalog(), ask());
    expect(out.results.map((r) => r.id)).toEqual(["piece-flip", "01-turnover", "02-wipe"]);
    expect(out.results[0]).toMatchObject({ kind: "piece", call: "PCS.flip(layer, { t })" });
    expect(out.results[0].fit).toMatch(/^piece: runnable code, get returns its call; primary job before-after/);
    expect(out.results[1]).not.toHaveProperty("kind");
    // a piece that only supports the asked job still comes before a recipe whose primary job it is
    expect(findTechniques(catalog(), ask({ job: "hand-over" })).results.map((r) => r.id)).toEqual(["piece-flip"]);
  });

  it("plain words drop the common ones and are cut to their stems", () => {
    expect(queryWords("something that turns over")).toEqual(["turn", "over"]);
    expect(["flips", "flipping", "flipped"].map(stem)).toEqual(["flip", "flip", "flip"]);
    expect(["turns", "turning", "turned"].map(stem)).toEqual(["turn", "turn", "turn"]);
    expect([stem("glass"), stem("pieces"), stem("piece")]).toEqual(["glass", "piec", "piec"]);
  });

  it("a query keeps the entries carrying the most of its words, pieces first", () => {
    const out = findByProvides(catalog(), { query: "something that turns over" });
    expect(out.words).toEqual(["turn", "over"]);
    expect(out.results.map((r) => r.id)).toEqual(["piece-flip", "01-turnover"]);
    expect(out.results[0]).toMatchObject({ kind: "piece", call: "PCS.flip(layer, { t })", use_for: "something that turns over" });
    expect(out.results[0].fit).toMatch(/words: turn, over of turn, over/);
    expect(out.relaxed).toBeUndefined();
  });

  it("when no entry carries every word, the best partial matches come back and relaxed says so", () => {
    const out = findByProvides(catalog(), { query: "wipe the floor clean" });
    expect(out.results.map((r) => r.id)).toEqual(["02-wipe"]);
    expect(out.relaxed).toEqual(["words"]);
    expect(findByProvides(catalog(), { query: "zebra" }).results).toEqual([]);
  });

  it("a query made only of common words is refused", () => {
    expect(() => findByProvides(catalog(), { query: "something that" })).toThrow(/no words to look for/);
  });
});

describe("pieces in the shipped catalog", () => {
  const cat = () => loadCatalog(LIB);
  const pieces = () => cat().entries.filter((e) => e.kind === "piece");

  it("every piece is a proven recipe with a still, a call, readable files, and known partners", () => {
    const c = cat();
    const manifest = JSON.parse(readFileSync(path.join(LIB, "manifest.json"), "utf8")) as { documents: Array<{ id: string; path: string }> };
    expect(pieces().length).toBeGreaterThan(0);
    expect(manifest.documents.some((d) => d.id === "pieces-core-jsx" && d.path === "pieces/pcs-core.jsx")).toBe(true);
    for (const p of pieces()) {
      expect(p.level, p.id).toBe("recipe");
      expect(p.status, p.id).toBe("proven");
      expect(p.still, p.id).not.toBeNull();
      expect(p.call!.signature, p.id).toMatch(/^PCS\.\w+\(/);
      expect(existsSync(path.join(LIB, "pieces", `${p.call!.load}.jsx`)), p.id).toBe(true);
      expect(manifest.documents.some((d) => d.id === p.section.document), p.id).toBe(true);
      expect(manifest.documents.some((d) => d.id === `${p.id}-proof`), p.id).toBe(true);
      for (const other of p.composes) expect(c.entries.some((e) => e.id === other), `${p.id} works with ${other}`).toBe(true);
      for (const r of p.requires ?? []) expect(existsSync(path.join(LIB, "pieces", `${r}.jsx`)), `${p.id} loads ${r}`).toBe(true);
    }
  });

  it("pieces come first in the catalog, so a browse of recipes shows them first", () => {
    const c = cat();
    const firstOther = c.entries.findIndex((e) => e.kind !== "piece");
    expect(c.entries.slice(firstOther).some((e) => e.kind === "piece")).toBe(false);
    expect(browseCatalog(c, { level: "recipe" }).tiles[0].id).toMatch(/^piece-/);
  });

  it("acceptance: \"something that turns over\" returns the flip piece first, with its picture and its call", () => {
    const out = findByProvides(cat(), { query: "something that turns over" });
    expect(out.results[0]).toMatchObject({ id: "piece-flip", kind: "piece" });
    expect(out.results[0].still).toBe("arsenal/stills/piece-flip.jpg");
    expect(out.results[0].call).toMatch(/^PCS\.flip\(layer/);
  });

  it("a job find for before-after lists the flip piece first", () => {
    const c = cat();
    expect(findTechniques(c, { vocab: c.vocab, job: "before-after" }).results[0].id).toBe("piece-flip");
  });
});

describe("ae_arsenal with pieces", () => {
  const call = (args: Record<string, unknown>) => arsenalTool.handler(args as never, {} as never);
  const text = (r: { content: Array<{ type: string; text?: string }> }) => r.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");

  it("find with a query returns the flip piece first, with its still", async () => {
    const r = await call({ action: "find", query: "something that turns over" });
    expect(r.isError).toBe(false);
    const answer = JSON.parse(text(r).split("\nStill of ")[0]);
    expect(answer.results[0].id).toBe("piece-flip");
    const kinds = r.content.map((c) => c.type);
    expect(kinds[1]).toBe("text");
    expect((r.content[1] as { text: string }).text).toMatch(/^Still of piece-flip/);
    expect(kinds[2]).toBe("image");
    const both = await call({ action: "find", job: "before-after", query: "turns over" });
    expect(both.isError).toBe(true);
    expect(text(both)).toMatch(/not both/);
  });

  it("get for a piece returns how to call it, not prose: the load line with this install's path, the call, options, an example", async () => {
    const r = await call({ action: "get", id: "piece-flip" });
    expect(r.isError).toBe(false);
    const t = text(r);
    expect(t.split("\n")[0]).toMatch(/^ae_arsenal piece piece-flip@[0-9a-f]{8} \(proven; recipe level, runnable code;/);
    // the example calls the stage and the plate too, so the load line loads them
    const load = /\$\.evalFile\(File\("([^"]+)"\)\); PCS\.need\('plate'\); PCS\.need\('stage'\); PCS\.need\('flip'\);$/m.exec(t);
    expect(load).not.toBeNull();
    expect(path.isAbsolute(load![1]) && existsSync(load![1])).toBe(true);
    expect(t).toMatch(/^call: PCS\.flip\(layer, \{ t, dur, axis, dir \}\)$/m);
    expect(t).toMatch(/^options:\n  t: start time/m);
    expect(t).toMatch(/^example:\n  var st = PCS\.stage\(/m);
    expect(t).toMatch(/^works with: piece-plate, piece-stage$/m);
    expect(r.content.some((c) => c.type === "image")).toBe(true);
    const pinned = await call({ action: "get", id: "piece-flip", revision: "00000000" });
    expect(text(pinned)).toMatch(/WARNING: pinned revision 00000000.*The piece changed since it was pinned: this is the shipped call/);
  });

  it("a piece's load line finds the other pieces its example calls by the functions their files define, not by file name", async () => {
    const c = loadCatalog(LIB);
    const pieces = c.entries.filter((e) => e.kind === "piece");
    for (const p of pieces) {
      expect(p.call!.functions?.length, p.id).toBeGreaterThan(0);
      const file = readFileSync(path.join(LIB, "pieces", `${p.call!.load}.jsx`), "utf8");
      for (const f of p.call!.functions!) expect(file, `${p.id} defines PCS.${f}`).toMatch(new RegExp(`^PCS\\.${f}\\s*=\\s*function`, "m"));
    }
    // land-on's example stands the card up first: PCS.standUp lives in stand-up.jsx
    const t = text(await call({ action: "get", id: "piece-land-on" }));
    expect(t).toMatch(/PCS\.need\('stand-up'\); PCS\.need\('land-on'\);$/m);
    // every PCS call in every example is loaded by that piece's load line (or by the core)
    for (const p of pieces) {
      const reply = text(await call({ action: "get", id: p.id }));
      const loaded = [...reply.matchAll(/PCS\.need\('([a-z0-9-]+)'\)/g)].map((m) => m[1]);
      for (const [, f] of p.call!.example.matchAll(/PCS\.([A-Za-z0-9_]+)\(/g)) {
        const owner = pieces.find((o) => o.call!.functions?.includes(f));
        if (owner) expect(loaded, `${p.id} example calls PCS.${f}`).toContain(owner.call!.load);
      }
    }
  });

  it("plain words an agent would use find the stage 3 pieces", () => {
    const ids = (q: string) => findByProvides(loadCatalog(LIB), { query: q }).results.map((r) => r.id);
    expect(ids("a pill that stands up")).toContain("piece-stand-up");
    expect(ids("words that appear one by one")[0]).toBe("piece-words");
    expect(ids("a screenshot on an object")[0]).toBe("piece-picture-face");
    expect(ids("a lit room for a cutaway")).toContain("piece-room");
    expect(ids("hand over from the face card to a cutaway")[0]).toBe("piece-hand-over");
    expect(ids("a number as a 3d object")[0]).toBe("piece-type3d");
    expect(ids("change what a card says")[0]).toBe("piece-swap-face");
  });

  it("browse labels a piece as runnable", async () => {
    const t = text(await call({ action: "browse", level: "recipe" }));
    expect(t).toMatch(/Tile 1: piece-\w+ · [^·]+ · recipe · piece \(runnable; get returns its call\) · provides/);
  });
});

// ---------- styles as data: the house style, examples and borrowed looks ----------

describe("style blocks in the shipped catalog", () => {
  const cat = () => loadCatalog(LIB);
  const call = (args: Record<string, unknown>) => arsenalTool.handler(args as never, {} as never);
  const text = (r: { content: Array<{ type: string; text?: string }> }) => r.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
  const block = (id: string) => JSON.parse(readFileSync(path.join(LIB, "pieces", "styles", `${id}.json`), "utf8"));

  it("the house style is the one default, first among the styles, with its still and the pieces its proof uses", () => {
    const c = cat();
    const defaults = c.entries.filter((e) => e.default);
    expect(defaults.map((e) => e.id)).toEqual(["style-house"]);
    const house = defaults[0];
    expect(house).toMatchObject({ level: "style", kind: "style", role: "house", block: "house", status: "proven" });
    expect(house.still).not.toBeNull();
    expect(house.composes).toEqual(expect.arrayContaining(["piece-stage", "piece-plate", "piece-spot", "piece-flip"]));
    expect(house.open).toEqual(["the quiet grid ground", "the house face card with its cream rim"]);
    expect(browseCatalog(c, { level: "style" }).tiles[0].id).toBe("style-house");
  });

  it("the house values are the picked graphite: near-black ground, graphite objects, cream type, one vermilion, Jost SemiBold, no grain", () => {
    const v = block("house").values;
    expect(v.ground).toEqual([0.063, 0.063, 0.071]);
    expect(v.surface).toEqual([0.2, 0.2, 0.225]);
    expect(v.type).toEqual([0.949, 0.933, 0.894]);
    expect(v.accent).toEqual([1, 0.373, 0.243]);
    expect([v.font, v.weight, v.grain]).toEqual(["Jost", "SemiBold", 0]);
  });

  it("the examples are labelled as examples, never the house; the borrowed looks sit on their own style entries", () => {
    const c = cat();
    for (const id of ["style-example-warm-paper", "style-example-night-glass"]) {
      const e = c.entries.find((x) => x.id === id)!;
      expect(e, id).toMatchObject({ role: "example", block: id.replace("style-", "") });
      expect(e.default, id).toBeUndefined();
      expect(e.name, id).toMatch(/^Example: /);
    }
    for (const id of ["dark-keynote", "glass-product"]) {
      expect(c.entries.find((x) => x.id === `style-${id}`)!.block).toBe(id);
      expect(block(id)).toMatchObject({ role: "look", borrowed_from: `style-${id}` });
    }
  });

  it("every style block the catalog names is readable through the library, and pcs-core defaults to house", () => {
    const manifest = JSON.parse(readFileSync(path.join(LIB, "manifest.json"), "utf8")) as { documents: Array<{ id: string }> };
    for (const e of cat().entries.filter((x) => x.block)) expect(manifest.documents.some((d) => d.id === `pieces-style-${e.block}`), e.id).toBe(true);
    const core = readFileSync(path.join(LIB, "pieces", "pcs-core.jsx"), "utf8");
    expect(core).toMatch(/PCS\.STYLE_DEFAULT = 'house';/);
    expect(core).not.toMatch(/'example-warm-paper': \{/); // the values live in styles/*.json, not in the code
  });

  it("get on the house style says how to use it in pieces, that it is the default, what is still open, with its values and still", async () => {
    const r = await call({ action: "get", id: "style-house" });
    expect(r.isError).toBe(false);
    const t = text(r);
    expect(t.split("\n")[0]).toMatch(/^ae_arsenal style style-house@[0-9a-f]{8} \(style; the house style; proven;/);
    expect(t).toMatch(/^in pieces: PCS\.use\('house'\) after loading pieces\/pcs-core\.jsx \(the default: pieces use it when no style is picked\)/m);
    expect(t).toMatch(/^not in it yet: the quiet grid ground$/m);
    expect(t).toMatch(/"surface": \[/);
    expect(r.content.some((c) => c.type === "image")).toBe(true);
  });

  it("get on a borrowed look adds its block after the look's own document", async () => {
    const t = text(await call({ action: "get", id: "style-dark-keynote" }));
    expect(t).toMatch(/^in pieces: PCS\.use\('dark-keynote'\)/m);
    expect(t).toMatch(/style block for pieces \(pieces-style-dark-keynote\):\n\{/);
  });

  it("browse labels the house and example styles", async () => {
    const t = text(await call({ action: "browse", level: "style" }));
    expect(t).toMatch(/Tile 1: style-house · House: graphite · style · the house style, the default for pieces · pieces: PCS\.use\('house'\)/);
    expect(t).toMatch(/style-example-night-glass · Example: night glass · style · an example style, not a house look/);
  });
});

// The technique arsenal: the per-beat query (the same rules as tools/channel-learner/catalog.mjs findTechniques, whose
// tests these mirror), reading a recipe by id and pinned revision, the job list, and the ae_arsenal tool's replies.
// Offline: nothing here contacts After Effects.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { arsenalTool, findTechniques, listJobs, loadCatalog, recipeReply, type ArsenalCatalog, type ArsenalRecipe, type BeatAsk } from "../src/tools/arsenal.js";

const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "library");
const JOBS = ["before-after", "point-at-detail", "light-the-hero", "finish-the-look", "add-depth", "hand-over"];

// A catalog record in the shipped shape; `status: "proven"` or unproven, kind technique unless given.
function rec(i: number, slug: string, o: Partial<ArsenalRecipe> = {}): ArsenalRecipe {
  return {
    id: `${String(i).padStart(2, "0")}-${slug}`, revision: `rev${slug}`.padEnd(8, "0").slice(0, 8), name: `Name ${slug}`, line: `Line ${slug}.`,
    status: "unproven", kind: "technique", job: "before-after", support: [], mood: [], needs: [], duration: 2, motion: "one-shot",
    difficulty: 1, taught_by: 1, variants: [], section: { document: "arsenal-line", heading: `Name ${slug}` }, still: null, ...o,
  };
}
// entries: [{ slug, group?, ...record fields }]; taught_by counts the entries sharing a group, as the builder does.
function catalogOf(entries: Array<Partial<ArsenalRecipe> & { slug: string; group?: string }>): ArsenalCatalog {
  const groups: Record<string, number> = {};
  for (const e of entries) if (e.group) groups[e.group] = (groups[e.group] ?? 0) + 1;
  return {
    vocab: "jobs-v1", version: "abcdef12", jobs: JOBS,
    recipes: entries.map(({ slug, group, ...o }, i) => rec(i + 1, slug, { taught_by: group ? groups[group] : 1, ...o })),
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
    expect(r.revision).toBe(cat.recipes[0].revision);
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

  it("make-it-pop is refused with the valid job ids", () => {
    expect(() => findTechniques(loadCatalog(LIB), { vocab: "jobs-v1", job: "make-it-pop" })).toThrow(/unknown job "make-it-pop".*land-number/);
  });

  it("every proven technique with a still has its JPEG in the package, and no other recipe has one", () => {
    const cat = loadCatalog(LIB);
    for (const r of cat.recipes) {
      if (r.still) expect(r.status === "proven" && r.kind === "technique", r.id).toBe(true);
    }
    expect(cat.recipes.filter((r) => r.still).length).toBeGreaterThan(0);
  });
});

describe("reading a recipe", () => {
  const cat = () => loadCatalog(LIB);

  it("returns the recipe's full text under its id and revision", () => {
    const r = cat().recipes.find((x) => x.id === "12-long-soft-shadow")!;
    const text = recipeReply("12-long-soft-shadow", undefined, LIB);
    expect(text.split("\n")[0]).toContain(`12-long-soft-shadow@${r.revision}`);
    expect(text).toContain(`## ${r.name}`);
    expect(text).toMatch(/^steps:$/m);
    expect(text).not.toMatch(/WARNING/);
  });

  it("warns, and still answers, when the pinned revision is not the shipped one", () => {
    const r = cat().recipes.find((x) => x.id === "12-long-soft-shadow")!;
    const text = recipeReply("12-long-soft-shadow", "00000000", LIB);
    expect(text).toMatch(new RegExp(`WARNING: pinned revision 00000000; the shipped revision is ${r.revision}`));
    expect(text).toContain(`## ${r.name}`);
    expect(recipeReply("12-long-soft-shadow", r.revision, LIB)).not.toMatch(/WARNING/);
  });

  it("refuses an unknown id", () => {
    expect(() => recipeReply("99-nope", undefined, LIB)).toThrow(/unknown recipe "99-nope"/);
  });
});

describe("reading a variant", () => {
  // A small library holding a parent and its variant, laid out and hashed as the shipped one is.
  function library(): string {
    const root = mkdtempSync(path.join(tmpdir(), "arsenal-variant-"));
    mkdirSync(path.join(root, "arsenal"));
    const recipes = "# Arsenal recipes: Line jobs\n\n## Name a\nid: 01-a\nrevision: reva0000\njob: before-after\nstatus: unproven\nsteps:\n1. Do a.\n\n"
      + "## Name v\nid: 02-v\nrevision: revv0000\njob: before-after\nstatus: unproven\nvariant of: 01-a\ndiffers: Slower.\nsteps:\n1. Do v.\n";
    const catalog = JSON.stringify({ vocab: "jobs-v1", version: "abcdef12", jobs: JOBS, recipes: [
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

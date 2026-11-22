#!/usr/bin/env node
// The arsenal as Comp Room ships it: plugin/library/arsenal/, generated from the recipe drafts in one command.
//   node tools/channel-learner/arsenal.mjs [--renders <folder holding quality/renders>] [--jobs <Content's jobs.json>]
//     [--examples <file>] [--drafts <dir>] [--tags <file>] [--proofs <file>] [--credits <file>] [--out <dir>]
//     [--readme <file>] [--no-manifest]
// Writes the jobs file (Content's version, groups, tags, ids, names and definitions, with the public examples in
// arsenal-public-examples.json, since Content's own examples come from the owner's reels; the fields the runtime does not
// read are dropped), the catalog data file, an index and the recipes grouped by job group, each proven recipe's status
// line shortened to its acceptance date (the drafts keep the full line); makes a small
// JPEG still from our own proof render for each proven technique (never a tutorial frame); writes the README gallery
// that shows those stills (the directory rule: every bundled image is shown in the README); regenerates the library
// manifest. Never hand-edit the output. Design: product/arsenal-catalog-design.md.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from './catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FILE_LIMIT = 262_144;    // the Claude directory's limit for a non-image file
const TEXT_FILES_MAX = 12;     // the arsenal's budget of package files, stills aside (design)
const STILL_WIDTH = 480;
const GROUP_ORDER = ['line', 'picture', 'connective', 'build-aid'];
const AID_LABEL = 'Build aids and unmatched recipes';
const START = '<!-- arsenal-stills:start -->';
const END = '<!-- arsenal-stills:end -->';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const EXAMPLES_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'arsenal-public-examples.json');

/** Names no shipped arsenal file may contain (whole words, any case), besides the creators in the credits. The one list. */
export const PRIVATE_NAMES = ['Joe', 'JoeB', 'Benscoter', 'Claude', 'Anthropic', 'Higgsfield'];

// ---------- scrubbing: the shipped text keeps the craft and drops where it was learned ----------

const DROPPED_FIELDS = /^(source|result|before|longest on|jobs):/;

function tidy(line) {
  const indent = line.match(/^\s*/)[0];
  let s = line.slice(indent.length);
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\s*[–-]\s*(?=[,;)])/g, '')
      .replace(/ +([,;)])/g, '$1')
      .replace(/(?<![\w$\])])\(\s*[,;]\s*/g, '(')
      .replace(/[,;]\s*(?=\))/g, '')
      .replace(/([,;])(\s*[,;])+/g, '$1')
      .replace(/(?<![\w$\])])\(\s+(?=\S)(?!\))/g, '(')
      .replace(/\s+(?:and|or|with|compared with|compared)\s*(?=[,;)])/g, '')
      .replace(/(?<![\w$\])])\s*\(\s*(?:compared|and|with|or)?\s*\)/g, '')
      .replace(/\s*\((?:frame,? ?|cut from,? ?|saved as)+\)/g, '')
      .replace(/,? (?:and )?saved as\s*(?=[,;.)]|[A-Z]|$)/g, '')
      .replace(/\b(a crop|a still) of(?=[,;.)])/g, '$1')
      .replace(/\bcut from\s*(?=[,;.)]|$)/g, 'cut from the source video')
      .replace(/[;,]?\s*\bgrid in\s*(?=[.;,)])/g, '')
      .replace(/ +\.(?=\s|$)/g, '.')
      .replace(/ {2,}/g, ' ');
  }
  return indent + s.trimEnd();
}

const FRAME = String.raw`(?:clean_)?f\d{4,6}(?:-crop)?`;
// A run of frame ids with what joins them ("f001 and f002", "f001–f002, f003") and the preposition before it.
const FRAMES = new RegExp(String.raw`(?:\s*\b(?:between|from|at|in|on|of|after|before|by|until|to|with)\s+)?\b${FRAME}(?:\s*(?:,|and|–|-|to|\/)\s*${FRAME})*\b`, 'g');
// A time in the source video: thirty seconds or more (a beat's keys sit well under that), alone or as a range,
// with the words that point at it. Times on a timeline ("keys at 0 s and 4.96 s") stay.
const SOURCE_TIME = /(\s*\b(?:(?:cut|cuts|in cuts|cut frame|shown|measured|glimpsed|on screen|settled to|appears|enters the crop by)\s+)?(?:at |by |about |from |before |after |until |to )*)(\d+(?:\.\d+)?)(?:\s*(?:–|-|\/|and)\s*\d+(?:\.\d+)?)* ?s\b/g;

/** One line with its provenance removed: video ids, frame numbers, study paths and source times. */
export function scrubLine(line, videos = []) {
  let s = line;
  for (const v of videos) s = s.split(v).join('the source video');
  s = s.replace(/measured on (?:STUDY\/)?scratch\/[^\s,;)]+(?:,? cut (?:from \S+ )?at [\d.]+ ?s)?/g, 'measured on a still of the result')
    .replace(/(?:STUDY\/)?scratch\/[^\s,;)]*[^\s,;).]/g, '')
    .replace(/\b[\w.-]+\.(?:png|jpe?g|mp4|mov)\b/g, '')
    .replace(/\s*\b(?:at |from )?source \d+(?:\.\d+)?(?:\s*(?:–|-|and)\s*\d+(?:\.\d+)?)? ?s\b/g, '')
    .replace(FRAMES, '')
    .replace(SOURCE_TIME, (m, lead, first) => (parseFloat(first) >= 30 ? (/^\s*\b(?:shown|measured)\b/.test(lead) ? lead.match(/^\s*\w+/)[0] : '') : m))
    .replace(/\s*\bcut (?:from )?\s*at\b(?=\s*[,;).])/g, '');
  return s === line ? line : tidy(s);
}

/** One recipe section's text with its provenance removed. */
export function scrubRecipe(text, { videos = [] } = {}) {
  return text.split('\n').filter((l) => !DROPPED_FIELDS.test(l)).map((l) => scrubLine(l, videos)).join('\n');
}

// ---------- building ----------

function sectionsOf(text) {
  return text.split(/^(?=## )/m).filter((s) => s.startsWith('## ')).map((s) => s.trim());
}

const groupOf = (r, jobs) => (r.kind === 'technique' ? jobs.jobs.find((j) => j.id === r.job)?.group ?? 'build-aid' : 'build-aid');
const docId = (g) => `arsenal-${g}`;
const recipeFile = (g) => `recipes-${g}.md`;
const jobsFile = (jobs) => `jobs-v${String(jobs.version).replace(/^v/, '')}.json`;
const isStillKind = (r) => r.status === 'proven' && r.kind === 'technique';

/** Proven techniques with a proof render: id -> the render's path as proof-stills.json gives it. */
export function wantedStills(catalog) {
  return Object.fromEntries(catalog.recipes.filter((r) => isStillKind(r) && r.still).map((r) => [r.id, r.still]));
}

/**
 * A shipped recipe's status line: `status: proven (accepted by <name> <date>: ...)` becomes `status: proven (accepted <date>)`.
 * The drafts keep the full line, as the record. Any other line, a status line with no name among them, is left alone.
 */
export function publicStatus(line) {
  return line.replace(/^(\s*status: proven) \(accepted by \D+? (\d{4}-\d{2}-\d{2})\b.*\)\s*$/, '$1 (accepted $2)');
}

/** The top-level fields of Content's jobs file that the runtime reads (plugin/runtime/src/tools/arsenal.ts JobsFile). */
const JOBS_FIELDS = ['version', 'groups', 'tags', 'jobs'];

/** Content's phrases that name a person, and the generic wording the shipped jobs file uses instead. Exact phrases only. */
export const JOBS_REWORDING = {
  'never becomes a job without Joe': "never becomes a job without the owner's approval",
};
const reword = (s) => Object.entries(JOBS_REWORDING).reduce((t, [from, to]) => t.split(from).join(to), s);
const rewordAll = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? reword(v) : v]));

/**
 * The shipped jobs file: Content's version, groups, tags and jobs (ids, groups, names and definitions as Content has them),
 * each job's example swapped for the public one (id -> one line), the group and tag text reworded by JOBS_REWORDING, laid
 * out as Content lays it out; the fields the runtime does not read are dropped. Refuses a Content job with no public
 * example, and a public example for a job Content lacks.
 */
export function publicJobs(content, examples) {
  const jobs = Object.fromEntries(Object.entries(content).filter(([k]) => JOBS_FIELDS.includes(k))
    .map(([k, v]) => [k, (k === 'groups' || k === 'tags') && v && typeof v === 'object' ? rewordAll(v) : v]));
  const ids = jobs.jobs.map((j) => j.id);
  const missing = ids.filter((id) => typeof examples[id] !== 'string' || !examples[id].trim());
  const unknown = Object.keys(examples).filter((id) => !ids.includes(id));
  const problems = [];
  if (missing.length) problems.push(`no public example for ${missing.join(', ')}`);
  if (unknown.length) problems.push(`public examples for jobs Content does not have: ${unknown.join(', ')}`);
  if (problems.length) throw new Error(`refused: ${problems.join('; ')}`);
  const inline = (o) => `{${Object.entries(o).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ')}}`;
  const block = (o) => `{\n${Object.entries(o).map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}\n  }`;
  const top = Object.entries(jobs).filter(([k]) => k !== 'jobs').map(([k, v]) => `  ${JSON.stringify(k)}: ${v && typeof v === 'object' ? block(v) : JSON.stringify(v)}`);
  const rows = jobs.jobs.map((j) => `    ${inline({ ...j, example: examples[j.id] })}`);
  return `{\n${[...top, `  "jobs": [\n${rows.join(',\n')}\n  ]`].join(',\n')}\n}\n`;
}

/**
 * The arsenal's files from a built catalog (catalog.mjs buildCatalog). `jobs` is Content's jobs file, shipped with the
 * public `examples` (publicJobs); `stills` maps id -> JPEG bytes already made; `creators` are names no shipped file may
 * contain, checked with PRIVATE_NAMES.
 */
export function buildArsenal({ catalog, jobs, examples, draftsDir, stills = {}, creators = [], fileLimit = FILE_LIMIT }) {
  const jobsText = publicJobs(jobs, examples);
  const videos = [...new Set(catalog.recipes.map((r) => r.video).filter(Boolean))];
  const drafts = new Map();
  const textOf = (r) => {
    if (!drafts.has(r.section.file)) drafts.set(r.section.file, sectionsOf(fs.readFileSync(path.join(draftsDir, r.section.file), 'utf8')));
    const s = drafts.get(r.section.file).find((t) => t.startsWith(`## ${r.section.heading}\n`) && new RegExp(`^id:\\s*(?:${r.video}-)?${r.id.replace(r.video + '-', '')}\\s*$`, 'm').test(t));
    if (!s) throw new Error(`refused: no section "${r.section.heading}" (${r.id}) in ${r.section.file}`);
    return s;
  };

  // A variant ships in its parent's group file, right after its parent.
  const byId = new Map(catalog.recipes.map((r) => [r.id, r]));
  const home = (r) => (r.variant_of ? byId.get(r.variant_of) : r);
  const sectionText = new Map();
  const records = [];
  const shippedStills = {};
  for (const r of catalog.recipes) {
    const g = groupOf(home(r), jobs);
    const own = textOf(r).split('\n').map(publicStatus).map((l) => (r.variant_of && /^variant of:/.test(l) ? `variant of: ${r.variant_of}` : l)).join('\n');
    const body = scrubRecipe(own, { videos }).split('\n').filter((l, i) => i > 0 && !/^id:/.test(l)).join('\n');
    const job = r.kind === 'technique' ? `job: ${r.job}${r.support.length ? `; support: ${r.support.join(', ')}` : ''}` : `job: none (${r.kind})`;
    sectionText.set(r.id, { g, text: `## ${r.name}\nid: ${r.id}\nrevision: ${r.revision}\n${job}\n${body}\n` });
    let still = null;
    if (isStillKind(r) && stills[r.id]) {
      still = { path: `arsenal/stills/${r.id}.jpg`, sha256: sha(stills[r.id]) };
      shippedStills[r.id] = stills[r.id];
    }
    records.push({
      id: r.id, revision: r.revision, name: r.name, line: scrubLine(r.line, videos), status: r.status, kind: r.kind, job: r.job, support: r.support,
      mood: r.mood, needs: r.needs, duration: r.duration, motion: r.motion, difficulty: r.difficulty, taught_by: r.taught_by,
      ...(r.variant_of ? { variant_of: r.variant_of } : {}), variants: r.variants ?? [],
      section: { document: docId(g), heading: r.name }, still,
    });
  }
  // A parent and its variants are one chunk, so they always share a file.
  const byGroup = new Map();
  for (const r of catalog.recipes.filter((x) => !x.variant_of)) {
    const ids = [r.id, ...(r.variants ?? [])];
    const { g } = sectionText.get(r.id);
    (byGroup.get(g) ?? byGroup.set(g, []).get(g)).push({ ids, text: ids.map((id) => sectionText.get(id).text).join('\n') });
  }

  const files = new Map();
  files.set(jobsFile(jobs), jobsText);
  // A group too big for one package file goes into numbered parts (recipes-line.md, recipes-line-2.md, ...),
  // filled in catalog order; each record names the part that holds its section.
  const groups = GROUP_ORDER.filter((g) => byGroup.has(g));
  const recipeDocs = [];
  const docOf = new Map();
  for (const g of groups) {
    const label = g === 'build-aid' ? AID_LABEL : jobs.groups?.[g] ?? g;
    const intro = g === 'build-aid'
      ? 'Recipes that help a build but serve no beat, and recipes that fit no job yet. A beat query never returns them; read one by id with ae_arsenal get.'
      : 'Recipes whose primary job is in this group. Find candidates for a beat with ae_arsenal find; read one with ae_arsenal get, or a section here by its heading.';
    const head = (k) => `# Arsenal recipes: ${label}${k > 1 ? ` (part ${k})` : ''}\n\nGenerated from the recipe drafts; do not edit by hand. ${intro}\n\n`;
    const parts = [[]];
    for (const chunk of byGroup.get(g)) {
      const cur = parts[parts.length - 1];
      const grown = head(parts.length) + [...cur, chunk].map((c) => c.text).join('\n');
      if (cur.length && Buffer.byteLength(grown) > fileLimit) parts.push([chunk]);
      else cur.push(chunk);
    }
    const title = `Arsenal recipes: ${g === 'build-aid' ? AID_LABEL.toLowerCase() : (jobs.groups?.[g] ?? g).toLowerCase()}`;
    parts.forEach((chunks, i) => {
      const k = i + 1;
      const file = k === 1 ? recipeFile(g) : `recipes-${g}-${k}.md`;
      const id = k === 1 ? docId(g) : `${docId(g)}-${k}`;
      files.set(file, head(k) + chunks.map((c) => c.text).join('\n'));
      recipeDocs.push({ id, title: parts.length > 1 ? `${title} (part ${k} of ${parts.length})` : title, path: `arsenal/${file}`, kind: 'recipes' });
      for (const c of chunks) for (const rid of c.ids) docOf.set(rid, id);
    });
  }
  for (const rec of records) rec.section.document = docOf.get(rec.id);
  files.set('catalog.json', `${JSON.stringify({ vocab: catalog.vocab, version: catalog.version, jobs: catalog.jobs, recipes: records }, null, 1)}\n`);
  const documents = [
    { id: 'arsenal-index', title: 'Technique arsenal index: documents, vocabulary and counts', path: 'arsenal/index.json', kind: 'catalog' },
    { id: 'arsenal-catalog', title: 'Technique arsenal catalog: one record per recipe, queried by ae_arsenal', path: 'arsenal/catalog.json', kind: 'catalog' },
    { id: 'arsenal-jobs', title: `Job vocabulary ${catalog.vocab}: the jobs a beat asks for`, path: `arsenal/${jobsFile(jobs)}`, kind: 'catalog' },
    ...recipeDocs,
  ];
  const index = {
    arsenal: 'Technique recipes for beats, filed under the job vocabulary. Ask ae_arsenal per beat by job (find), read the chosen recipe (get), list the jobs (jobs).',
    tool: 'ae_arsenal', vocab: catalog.vocab, version: catalog.version, documents,
    counts: { recipes: records.length, proven: records.filter((r) => r.status === 'proven').length, stills: Object.keys(shippedStills).length },
  };
  files.set('index.json', `${JSON.stringify(index, null, 1)}\n`);

  const problems = [];
  for (const [f, text] of files) {
    const bytes = Buffer.byteLength(text);
    if (bytes > fileLimit) problems.push(`${f} is ${bytes} bytes, over the ${fileLimit}-byte package file limit`);
    for (const [kind, names] of [['a creator', creators], ['a private name', PRIVATE_NAMES]]) {
      for (const c of names) {
        if (c && new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) problems.push(`${f} names ${kind}: ${c}`);
      }
    }
  }
  if (files.size > TEXT_FILES_MAX) problems.push(`${files.size} text files, over the arsenal's ${TEXT_FILES_MAX}`);
  if (problems.length) throw new Error(`refused: ${problems.join('; ')}`);
  return { files, stills: shippedStills, wanted: wantedStills(catalog), index };
}

/** Writes the arsenal into outDir, which it owns: makes missing stills, keeps existing ones, removes what is stale. */
export function writeArsenal({ catalog, jobs, examples, draftsDir, outDir, rendersRoot, makeStill = ffmpegStill, creators = [] }) {
  const stillsDir = path.join(outDir, 'stills');
  fs.mkdirSync(stillsDir, { recursive: true });
  const stills = {};
  const missing = [];
  for (const [id, from] of Object.entries(wantedStills(catalog))) {
    const to = path.join(stillsDir, `${id}.jpg`);
    if (!fs.existsSync(to)) {
      if (!rendersRoot) { missing.push(id); continue; }
      try { makeStill(path.resolve(rendersRoot, from), to); } catch { missing.push(id); continue; }
    }
    stills[id] = fs.readFileSync(to);
  }
  const built = buildArsenal({ catalog, jobs, examples, draftsDir, stills, creators });
  for (const f of fs.readdirSync(stillsDir)) if (!built.stills[f.replace(/\.jpg$/, '')]) fs.rmSync(path.join(stillsDir, f));
  for (const f of fs.readdirSync(outDir)) if (f !== 'stills' && !built.files.has(f)) fs.rmSync(path.join(outDir, f), { recursive: true });
  for (const [f, text] of built.files) fs.writeFileSync(path.join(outDir, f), text);
  if (!Object.keys(built.stills).length) fs.rmSync(stillsDir, { recursive: true });
  return { ...built, missing };
}

/** A small JPEG of our own proof render, STILL_WIDTH wide. */
function ffmpegStill(from, to) {
  if (!fs.existsSync(from)) throw new Error(`no render at ${from}`);
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', from, '-vf', `scale=${STILL_WIDTH}:-2:flags=lanczos`, '-q:v', '4', to], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg failed on ${from}: ${r.stderr}`);
}

// ---------- the README gallery ----------

/** The README block that shows every shipped still (paths relative to the package root). */
export function galleryBlock(catalog) {
  const shown = catalog.recipes.filter((r) => r.still);
  if (!shown.length) return 'No proven technique has a still yet.';
  return [
    'Proven techniques in the arsenal, each a still of our own proof build. The ae_arsenal tool returns them with its shortlist.',
    '',
    ...shown.map((r) => {
      const n = r.variants?.length ?? 0;
      return `![${r.name}${n ? ` (${n} variant${n === 1 ? '' : 's'})` : ''}](library/${r.still.path})`;
    }),
  ].join('\n');
}

export function withGallery(readme, block) {
  const a = readme.indexOf(START);
  const b = readme.indexOf(END);
  if (a < 0 || b < a) throw new Error(`refused: the README has no ${START} ... ${END} block`);
  return `${readme.slice(0, a + START.length)}\n${block}\n${readme.slice(b)}`;
}

/** Channel names from the credits table: the names no shipped file may contain. */
export function creatorsOf(credits) {
  const names = [];
  for (const line of credits.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    const m = cells[2]?.match(/^\[([^\]]+)\]\(/);
    if (m && !names.includes(m[1])) names.push(m[1]);
  }
  return names;
}

// ---------- CLI ----------

function arg(argv, name, fallback) { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : fallback; }

function vendoredJobs(outDir) {
  const found = fs.existsSync(outDir) ? fs.readdirSync(outDir).filter((f) => /^jobs-v[\d.]+\.json$/.test(f)) : [];
  if (found.length !== 1) throw Object.assign(new Error(`pass --jobs <Content's jobs.json>: ${outDir} holds ${found.length} vendored jobs files`), { usage: true });
  return path.join(outDir, found[0]);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  try {
    const drafts = arg(argv, '--drafts', path.join(ROOT, 'product', 'arsenal-drafts'));
    const out = arg(argv, '--out', path.join(ROOT, 'plugin', 'library', 'arsenal'));
    const jobsPath = arg(argv, '--jobs') ?? vendoredJobs(out);
    const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
    const examples = JSON.parse(fs.readFileSync(arg(argv, '--examples', EXAMPLES_FILE), 'utf8'));
    const tags = JSON.parse(fs.readFileSync(arg(argv, '--tags', path.join(drafts, 'tags.json')), 'utf8'));
    const proofs = JSON.parse(fs.readFileSync(arg(argv, '--proofs', path.join(drafts, 'proof-stills.json')), 'utf8'));
    const creators = creatorsOf(fs.readFileSync(arg(argv, '--credits', path.join(drafts, 'CREDITS.md')), 'utf8'));
    const catalog = buildCatalog({ draftsDir: drafts, tags, jobs, proofs });
    fs.mkdirSync(out, { recursive: true });
    const res = writeArsenal({ catalog, jobs, examples, draftsDir: drafts, outDir: out, rendersRoot: arg(argv, '--renders', ROOT), creators });
    const readme = arg(argv, '--readme', path.join(ROOT, 'claude', 'src', 'README.md'));
    fs.writeFileSync(readme, withGallery(fs.readFileSync(readme, 'utf8'), galleryBlock(JSON.parse(res.files.get('catalog.json')))));
    if (!argv.includes('--no-manifest')) {
      const m = spawnSync(process.execPath, [path.join(ROOT, 'plugin', 'scripts', 'manifest.mjs')], { encoding: 'utf8' });
      if (m.status !== 0) throw new Error(`manifest: ${m.stderr}`);
    }
    console.log(JSON.stringify({ vocab: catalog.vocab, version: catalog.version, recipes: catalog.recipes.length, stills: Object.keys(res.stills).length, missing: res.missing, out }));
    if (res.missing.length) console.error(`no still for ${res.missing.join(', ')}: no proof render found; pass --renders <folder holding quality/renders>`);
  } catch (e) { console.error(e.message); process.exit(e.usage ? 2 : 1); }
}

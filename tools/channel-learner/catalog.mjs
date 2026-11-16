#!/usr/bin/env node
// The technique catalog: built by code from the recipe drafts and their job tags, queried per beat.
//   node tools/channel-learner/catalog.mjs build --drafts <dir> --tags <tags.json> (--jobs <jobs.json> | --jobs-ids a,b,c) [--proofs <proofs.json>] --out <catalog.json>
//   node tools/channel-learner/catalog.mjs find --catalog <catalog.json> --ask '<json>'
// Design: product/arsenal-catalog-design.md. The job vocabulary is Content's jobs.json; this side never invents a job.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { statusOf } from './assemble.mjs';

const hash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 8);
const KINDS = ['technique', 'build-aid', 'unmatched'];

/** Recipe sections of one draft: each `## ` section that has an `id:` line, with its full text. */
function sectionsOf(text) {
  return text.split(/^(?=## )/m).filter((s) => s.startsWith('## ') && /^id:\s*\S/m.test(s)).map((s) => s.trim());
}

const vocabOf = (jobs) => (jobs.version !== undefined ? `jobs-v${String(jobs.version).replace(/^v/, '')}` : null);
const keyOf = (video, n) => `${video}#${n}`;
const normKey = (k) => { const [v, n] = k.split('#'); return keyOf(v, parseInt(n, 10)); };

/** Build the catalog object. `jobs` is Content's jobs file ({ version, jobs: [{ id }] }); `proofs` maps id to a still of our own proof render. */
export function buildCatalog({ draftsDir, tags, jobs, proofs = {} }) {
  const jobIds = jobs.jobs.map((j) => j.id);
  const vocab = vocabOf(jobs) ?? tags.vocab;
  if (tags.vocab !== vocab) throw new Error(`refused: tags are ${tags.vocab} but the jobs file is ${vocab}`);

  const drafts = [];
  for (const file of fs.readdirSync(draftsDir).filter((f) => f.endsWith('.md')).sort()) {
    const video = file.replace(/\.md$/, '');
    sectionsOf(fs.readFileSync(path.join(draftsDir, file), 'utf8')).forEach((text, i) => {
      const id = text.match(/^id:\s*(\S+)/m)[1];
      const n = /^\d+-/.test(id) ? parseInt(id, 10) : i + 1;
      const name = text.match(/^## (.+)$/m)[1].trim();
      drafts.push({ key: keyOf(video, n), id, video, n, name, text, file });
    });
  }

  const tagged = Object.fromEntries(Object.entries(tags.recipes).map(([k, t]) => [normKey(k), { ...t, key: k }]));
  const problems = [];
  const known = new Set(jobIds);
  for (const d of drafts) if (!tagged[d.key]) problems.push(`no tag for ${d.key} (${d.id})`);
  const byKey = new Set(drafts.map((d) => d.key));
  for (const [k, t] of Object.entries(tagged)) {
    if (!byKey.has(k)) { problems.push(`no recipe for tag ${t.key}`); continue; }
    if (!KINDS.includes(t.kind)) problems.push(`tag ${t.key}: kind "${t.kind}" is not one of ${KINDS.join(', ')}`);
    if (t.kind === 'technique') {
      const bad = [t.job, ...(t.support || [])].filter((j) => !known.has(j));
      if (bad.length) problems.push(`tag ${t.key}: ${bad.map((j) => `"${j}"`).join(', ')} not in ${vocab}`);
    }
  }
  for (const d of drafts) {
    const t = tagged[d.key];
    if (t?.id && t.id !== d.id && t.id !== `${d.video}-${d.id}`) problems.push(`tag ${t.key}: id ${t.id} does not name the recipe there, ${d.id}`);
  }
  // Variants (design, "One technique, one entry"): a tag's variant_of names its parent's `<video>#<nn>`, one level only,
  // the same kind; the draft carries `variant of: <parent id> (<video> #<n>)` and `differs: ...` after its status line.
  const draftOf = Object.fromEntries(drafts.map((d) => [d.key, d]));
  const idAt = (k) => tagged[k]?.id || draftOf[k]?.id;
  for (const d of drafts) {
    const t = tagged[d.key];
    if (!t) continue;
    const line = d.text.match(/^variant of:\s*(\S+)/m)?.[1];
    if (t.variant_of === undefined || t.variant_of === null) {
      if (line) problems.push(`tag ${t.key}: the draft says "variant of: ${line}" but the tag has no variant_of`);
      continue;
    }
    const pk = normKey(String(t.variant_of));
    const parent = tagged[pk];
    if (!parent || !draftOf[pk]) { problems.push(`tag ${t.key}: variant_of ${t.variant_of} names no recipe`); continue; }
    if (parent.variant_of !== undefined && parent.variant_of !== null) problems.push(`tag ${t.key}: variant of ${parent.key}, which is itself a variant (one level only)`);
    if (parent.kind !== t.kind) problems.push(`tag ${t.key}: kind ${t.kind} but its parent ${parent.key} is ${parent.kind}`);
    const pid = idAt(pk);
    if (!line) problems.push(`tag ${t.key}: a variant whose draft has no "variant of:" line`);
    else if (line !== pid && line !== draftOf[pk].id) problems.push(`tag ${t.key}: the draft says "variant of: ${line}" but the tag names ${pid}`);
    if (!/^differs:\s*\S/m.test(d.text)) problems.push(`tag ${t.key}: a variant whose draft has no "differs:" line`);
  }
  if (problems.length) throw new Error(`refused: ${problems.join('; ')}`);

  const groups = {};
  for (const d of drafts) { const g = tagged[d.key].group; if (g) groups[g] = (groups[g] || 0) + 1; }
  const variantsOf = {};
  for (const d of drafts) { const v = tagged[d.key].variant_of; if (v !== undefined && v !== null) (variantsOf[normKey(String(v))] ??= []).push(d); }
  // Taught by: the group's count (or 1), plus each variant not already counted in that group.
  const taughtBy = (d) => {
    const g = tagged[d.key].group;
    return (g ? groups[g] : 1) + (variantsOf[d.key] || []).filter((v) => !g || tagged[v.key].group !== g).length;
  };

  const recipes = drafts.map((d) => {
    const t = tagged[d.key];
    const s = statusOf(d.text);
    const status = s.proven && s.accepted ? 'proven' : 'unproven';
    return {
      id: t.id || d.id, video: d.video, n: d.n, name: d.name,
      line: (d.text.match(/^what it does for a beat:\s*(.+)$/m) || [, ''])[1].trim(),
      status, kind: t.kind, job: t.job ?? null, support: t.support || [], mood: t.mood || [], needs: t.needs || [],
      duration: t.duration ?? null, motion: t.motion ?? null, difficulty: t.difficulty ?? null, group: t.group ?? null, why: t.why ?? null,
      section: { file: d.file, heading: d.name },
      revision: hash(d.text),
      still: status === 'proven' ? (proofs[t.id || d.id] ?? null) : null,
      taught_by: taughtBy(d),
      ...(t.variant_of !== undefined && t.variant_of !== null ? { variant_of: idAt(normKey(String(t.variant_of))) } : {}),
      variants: (variantsOf[d.key] || []).map((v) => idAt(v.key)),
    };
  });
  const dup = recipes.map((r) => r.id).filter((id, i, all) => all.indexOf(id) !== i);
  if (dup.length) throw new Error(`refused: ids used twice: ${[...new Set(dup)].join(', ')}`);

  return {
    vocab, version: hash(recipes.map((r) => `${r.id}@${r.revision}`).sort().join('\n')),
    jobs: jobIds, recipes,
  };
}

// Which recipe `needs` each kind of beat asset can meet. A need not listed here (type, shapes,
// 3D camera, none...) is built inside After Effects and always passes.
//   screen and footage are both moving pictures: either meets `footage`.
//   photo meets `photo`, and `illustration` (art to drive an effect); library (rendered cast) meets photo,
//   illustration and character; logo meets illustration.
const MET_BY = {
  footage: ['footage', 'screen'],
  photo: ['photo', 'library'],
  illustration: ['photo', 'library', 'logo'],
  character: ['library'],
};
const lower = (xs) => (xs || []).map((x) => String(x).toLowerCase());

function assetKinds(assets) {
  if (assets === undefined || assets === null) return null; // not given: needs are not filtered
  if (assets === 'none') return [];
  if (Array.isArray(assets)) return lower(assets);
  return lower(Object.keys(assets));
}
const unmet = (needs, have) => lower(needs).filter((n) => MET_BY[n] && !MET_BY[n].some((a) => have.includes(a)));

// Distance from a beat's length to a recipe's play length: "any" or none fits; "1.5 s+" fits from 1.5.
function distance(duration, want) {
  if (want === undefined || duration === null || duration === undefined) return 0;
  const m = String(duration).match(/(\d+(?:\.\d+)?)\s*(?:s)?\s*(\+)?/);
  if (!m) return 0;
  const d = parseFloat(m[1]);
  return m[2] ? Math.max(0, d - want) : Math.abs(d - want);
}

/** Per beat: a ranked shortlist. Refuses a different vocab or an unknown job id; never guesses. */
export function findTechniques(catalog, ask) {
  if (ask.vocab !== catalog.vocab) throw new Error(`refused: ask is vocab ${ask.vocab} but the catalog is ${catalog.vocab}`);
  for (const j of [ask.job, ...(ask.support || [])]) {
    if (!catalog.jobs.includes(j)) throw new Error(`refused: unknown job "${j}"; valid ids: ${catalog.jobs.join(', ')}`);
  }
  const support = ask.support || [];
  const mood = lower(ask.mood);
  const have = assetKinds(ask.assets);
  const exclude = new Set(ask.exclude || []);
  const limit = ask.limit ?? 5;

  // Job match tier: 0 primary job, 1 the asked job is one of its supports, 2 it serves one of the beat's support jobs.
  const tier = (r) => (r.job === ask.job ? 0 : r.support.includes(ask.job) ? 1 : [r.job, ...r.support].some((j) => support.includes(j)) ? 2 : null);
  // A variant is never a candidate on its own: its parent stands for it and lists it (variants).
  const byJob = catalog.recipes.filter((r) => r.kind === 'technique' && !r.variant_of && tier(r) !== null && !exclude.has(r.id));

  const pass = (r, loose) =>
    (loose.includes('status') || ask.constraints?.status === 'any' || r.status === 'proven')
    && (loose.includes('needs') || have === null || unmet(r.needs, have).length === 0);

  let relaxed = [];
  let hits = byJob.filter((r) => pass(r, relaxed));
  for (const step of ['status', 'needs']) {
    if (hits.length || !byJob.length) break;
    relaxed = [...relaxed, step];
    hits = byJob.filter((r) => pass(r, relaxed));
  }

  const overlap = (r) => lower(r.mood).filter((m) => mood.includes(m));
  const ranked = hits.map((r) => ({ r, key: [tier(r), r.status === 'proven' ? 0 : 1, -r.taught_by, -overlap(r).length, distance(r.duration, ask.duration)] }))
    .sort((a, b) => { for (let i = 0; i < a.key.length; i++) if (a.key[i] !== b.key[i]) return a.key[i] - b.key[i]; return 0; })
    .slice(0, limit);

  const fit = (r) => {
    const t = tier(r);
    const job = t === 0 ? `primary job ${ask.job}` : t === 1 ? `supports ${ask.job}` : `serves support job ${[r.job, ...r.support].find((j) => support.includes(j))}`;
    const missing = have === null ? [] : unmet(r.needs, have);
    const needs = !r.needs.length ? 'needs nothing'
      : missing.length ? `needs ${missing.join(', ')}, not on hand`
        : have === null ? `needs ${r.needs.join(', ')}` : `needs met: ${r.needs.join(', ')}`;
    const m = overlap(r);
    const parts = [job, needs, m.length ? `mood: ${m.join(', ')}` : mood.length ? 'no mood overlap' : null,
      r.taught_by > 1 ? `taught ${r.taught_by} times` : null, r.status === 'proven' ? 'proven' : 'unproven, needs a test build first'];
    return parts.filter(Boolean).join('; ');
  };

  const out = {
    vocab: catalog.vocab, version: catalog.version,
    results: ranked.map(({ r }) => ({
      id: r.id, revision: r.revision, name: r.name, line: r.line, status: r.status, needs: r.needs,
      duration: r.duration, motion: r.motion, still: r.still, section: r.section, fit: fit(r),
      ...(r.variants?.length ? { variants: r.variants } : {}),
    })),
  };
  if (relaxed.length && out.results.length) out.relaxed = relaxed;
  return out;
}

function arg(argv, name) { const i = argv.indexOf(name); return i > 0 ? argv[i + 1] : undefined; }
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  try {
    if (argv[0] === 'build') {
      const tags = readJson(arg(argv, '--tags'));
      const jobsPath = arg(argv, '--jobs');
      const jobs = jobsPath ? readJson(jobsPath) : { jobs: (arg(argv, '--jobs-ids') || '').split(',').filter(Boolean).map((id) => ({ id })) };
      const proofsPath = arg(argv, '--proofs');
      const out = arg(argv, '--out');
      if (!arg(argv, '--drafts') || !out || !jobs.jobs.length) throw Object.assign(new Error('usage: catalog.mjs build --drafts <dir> --tags <file> (--jobs <file> | --jobs-ids a,b) [--proofs <file>] --out <file>'), { usage: true });
      const catalog = buildCatalog({ draftsDir: arg(argv, '--drafts'), tags, jobs, proofs: proofsPath ? readJson(proofsPath) : {} });
      fs.writeFileSync(out, `${JSON.stringify(catalog, null, 2)}\n`);
      console.log(JSON.stringify({ vocab: catalog.vocab, version: catalog.version, recipes: catalog.recipes.length, out }));
    } else if (argv[0] === 'find') {
      if (!arg(argv, '--catalog') || !arg(argv, '--ask')) throw Object.assign(new Error("usage: catalog.mjs find --catalog <file> --ask '<json>'"), { usage: true });
      console.log(JSON.stringify(findTechniques(readJson(arg(argv, '--catalog')), JSON.parse(arg(argv, '--ask'))), null, 2));
    } else {
      throw Object.assign(new Error('usage: catalog.mjs build|find ...'), { usage: true });
    }
  } catch (e) { console.error(e.message); process.exit(e.usage ? 2 : 1); }
}

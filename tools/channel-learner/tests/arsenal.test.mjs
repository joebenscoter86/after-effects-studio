import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../catalog.mjs';
import { scrubRecipe, buildArsenal, writeArsenal, galleryBlock, withGallery, creatorsOf, publicJobs, publicStatus, JOBS_REWORDING, PRIVATE_NAMES, levelsProblems, readStyles, parseProvides } from '../arsenal.mjs';

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'arsenal.mjs');
const ACCEPTED = 'status: proven (accepted by the owner 2026-11-14: rebuilt and compared)';
const sha = (b) => createHash('sha256').update(b).digest('hex');

// A recipe section in the draft format, with the provenance lines the drafts carry.
const recipe = (n, slug, { name = `Technique ${slug}`, status = 'status: unproven', video = 'vidAAAAAAAA', body = '' } = {}) =>
  `## ${name}\nid: ${String(n).padStart(2, '0')}-${slug}\n${status}\nsource: ${video} 18–39 s\njobs: lines and shapes\n`
  + `what it does for a beat: What ${slug} does.\nsteps:\n1. Draw it. (said; shown f001441, f001631)\n   - Width: 18 (shown f001631)\n`
  + `layout: ring 0.29 of the width (all measured on scratch/01/layout-crop.png, cut at 38.9 s, shares of the whole comp)\n`
  + `result: start=37.9 end=39.5 frame=scratch/01/result-38.9.png (cut from source.mp4 at 38.9 s)\nbefore: f001441 (plain ring)\n`
  + `longest on: Setting up the dashes.\nbuild notes: Set the gap by script (inferred).${body}\nunknowns: The size.\n`;

const JOBS = {
  version: '1', groups: { line: 'Line jobs', picture: 'Picture jobs', connective: 'Connective jobs' },
  jobs: [
    { id: 'before-after', group: 'line', name: 'Show a change of state', definition: 'Same thing before and after.' },
    { id: 'add-depth', group: 'picture', name: 'Add depth', definition: 'Make flat layers read as one space.' },
    { id: 'hand-over', group: 'connective', name: 'Hand over', definition: 'Change picture without a cut.' },
  ],
};
const JOBS_TEXT = `${JSON.stringify(JOBS, null, 1)}\n`;
const EXAMPLES = { 'before-after': 'the cluttered dashboard, then the clean one', 'add-depth': 'the product on the table with a real shadow', 'hand-over': 'the camera travels along the map to the next stop' };
const tag = (id, o = {}) => ({ id, kind: 'technique', job: 'before-after', support: [], mood: [], needs: [], duration: 2, motion: 'one-shot', difficulty: 1, group: null, why: 'quote', ...o });

// entries: [{ slug, status?: 'proven', video?, ...tag fields }] -> { dir, catalog }
function fixture(entries, proofs = {}) {
  const dir = fs.mkdtempSync(path.join(tmpdir(), 'arsenal-test-'));
  const byVideo = {};
  const tags = {};
  for (const e of entries) {
    const { slug, status, video = 'vidAAAAAAAA', lines, ...t } = e;
    (byVideo[video] ??= []).push({ slug, status, lines, t });
  }
  for (const [video, list] of Object.entries(byVideo)) {
    const sections = list.map(({ slug, status, lines }, i) => recipe(i + 1, slug, { status: `${status === 'proven' ? ACCEPTED : 'status: unproven'}${lines ? `\n${lines}` : ''}`, video, name: `Name ${slug}` }));
    fs.writeFileSync(path.join(dir, `${video}.md`), `# Techniques\n\n${sections.join('\n')}`);
    list.forEach(({ slug, t }, i) => { tags[`${video}#${i + 1}`] = tag(`${String(i + 1).padStart(2, '0')}-${slug}`, t); });
  }
  const catalog = buildCatalog({ draftsDir: dir, jobs: JOBS, tags: { vocab: 'jobs-v1', recipes: tags }, proofs });
  return { dir, catalog };
}
const build = (entries, o = {}) => {
  const { dir, catalog } = fixture(entries, o.proofs);
  try { return buildArsenal({ catalog, jobs: JOBS, examples: EXAMPLES, draftsDir: dir, stills: o.stills ?? {}, creators: o.creators ?? ['Some Channel'], ...(o.fileLimit ? { fileLimit: o.fileLimit } : {}) }); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
};

// ---------- scrubRecipe ----------

test('scrub: drops the source, result, before, longest-on and old jobs lines', () => {
  const out = scrubRecipe(recipe(1, 'dots'), { videos: ['vidAAAAAAAA'] });
  for (const field of ['source:', 'result:', 'before:', 'longest on:', 'jobs:']) assert.doesNotMatch(out, new RegExp(`^${field}`, 'm'), field);
  assert.match(out, /^what it does for a beat: What dots does\.$/m);
  assert.match(out, /^unknowns: The size\.$/m);
});

test('scrub: removes frame numbers, study paths and media file names but keeps the evidence words', () => {
  const out = scrubRecipe(recipe(1, 'dots'), { videos: ['vidAAAAAAAA'] });
  assert.doesNotMatch(out, /\bf\d{4,6}\b/);
  assert.doesNotMatch(out, /scratch\/|\.png|\.mp4/);
  assert.match(out, /^1\. Draw it\. \(said; shown\)$/m);
  assert.match(out, /^ {3}- Width: 18 \(shown\)$/m);
  assert.match(out, /\(inferred\)/);
  assert.doesNotMatch(out, /\( |, \)|\(\)|,,| ,/);
});

test('scrub: no joining word or empty bracket is left where a frame, a path or a time was', () => {
  const line = (s) => scrubRecipe(`steps:\n${s}`, { videos: [] }).split('\n')[1];
  assert.equal(line('1. It reads −1480.0 (shown f027527 and scratch/10/anchor-459.0s.png).'), '1. It reads −1480.0 (shown).');
  assert.equal(line('2. The arcs move in the result (f003401 compared with f002408), but no keys show.'), '2. The arcs move in the result, but no keys show.');
  assert.equal(line('3. Near zero (shown f007938 and at 132.6 s, read off the graph).'), '3. Near zero (shown, read off the graph).');
  assert.equal(line('4. Holds 0.1 s (at 213.2 s the border is inside the crop).'), '4. Holds 0.1 s (the border is inside the crop).');
  assert.equal(line('6. Caveat: frame f012798 is cut from source.mp4 at 213.3 s (saved as scratch/04/r.png); the panels zoom.'), '6. Caveat: frame is cut from the source video; the panels zoom.');
  assert.equal(line('7. Same entrance (frame f001441, cut from source.mp4 at 309.8 s, saved as scratch/1/a.png); in time.'), '7. Same entrance; in time.');
  assert.equal(line('8. Shows Tritone (cut from source.mp4 at 125.0 s).'), '8. Shows Tritone.');
  assert.equal(line('9. The result frame is cut from source.mp4 and saved as scratch/2/r.png. The time reads 0.'), '9. The result frame is cut from the source video. The time reads 0.');
  assert.equal(line('10. Glow (said; shown in a crop of f001441, saved as scratch/2/c.png).'), '10. Glow (said; shown in a crop).');
  assert.equal(line('11. It plays (inferred from the order of f001441 and f001631).'), '11. It plays (inferred from the order).');
  assert.equal(line('12. Width 55% (measured); grid in scratch/11/layout.png. The crop trims.'), '12. Width 55% (measured). The crop trims.');
  assert.equal(line('13. It plays after the span ends (about 343 s). The mouse.'), '13. It plays after the span ends. The mouse.');
  assert.equal(line('14. Set to the rusty .sbsar (shown f001441).'), '14. Set to the rusty .sbsar (shown).');
  assert.equal(line('5. Copy with layer.duplicate() and loopOut() (shown f001441).'), '5. Copy with layer.duplicate() and loopOut() (shown).');
});

test('scrub: layout measurements keep their numbers and lose the study frame and its source time', () => {
  const out = scrubRecipe(recipe(1, 'dots'), { videos: [] });
  assert.match(out, /^layout: ring 0\.29 of the width \(all measured on a still of the result, shares of the whole comp\)$/m);
});

test('scrub: a list of frames goes with the words that join it', () => {
  const line = (s) => scrubRecipe(`steps:\n${s}`, { videos: [] }).split('\n')[1];
  assert.equal(line('1. Set it. (said; shown f003401 and f002408, layer list)'), '1. Set it. (said; shown, layer list)');
  assert.equal(line('2. It moves (inferred from the tool shown and text not moving between f001441 and f002999).'), '2. It moves (inferred from the tool shown and text not moving).');
  assert.equal(line('3. Kept frame f002288 shows the same.'), '3. Kept frame shows the same.');
  assert.doesNotMatch(line('4. Shown (f001441–f001631, f001766).'), /f\d|–|\(\)/);
});

test('scrub: times in the source video go; times on a timeline stay', () => {
  const line = (s) => scrubRecipe(`steps:\n${s}`, { videos: [] }).split('\n')[1];
  assert.equal(line('1. Hide it (shown, tooltip at 92.8 s).'), '1. Hide it (shown, tooltip).');
  assert.equal(line('2. Keep it (shown, 135.5–137.2 s).'), '2. Keep it (shown).');
  assert.doesNotMatch(line('3. Before 148.45 s a circle is selected.'), /148/);
  assert.equal(line('4. Keys at 0 s and 4.96 s, one turn every 12 s.'), '4. Keys at 0 s and 4.96 s, one turn every 12 s.');
  assert.equal(line('5. Last key at 10 s (shown at 337.6 s).'), '5. Last key at 10 s (shown).');
});

test('scrub: removes a video id wherever it appears', () => {
  const out = scrubRecipe(recipe(1, 'dots', { body: ' Same as in vidAAAAAAAA at 12 s.' }), { videos: ['vidAAAAAAAA'] });
  assert.doesNotMatch(out, /vidAAAAAAAA/);
});

// ---------- buildArsenal ----------

test('build: recipes are grouped one file per job group, build aids and unmatched in their own file', () => {
  const { files } = build([
    { slug: 'line', status: 'proven' },
    { slug: 'pic', job: 'add-depth' },
    { slug: 'hand', job: 'hand-over' },
    { slug: 'aid', kind: 'build-aid', job: null },
    { slug: 'odd', kind: 'unmatched', job: null },
  ]);
  assert.deepEqual([...files.keys()].sort(), ['catalog.json', 'index.json', 'jobs-v1.json', 'recipes-build-aid.md', 'recipes-connective.md', 'recipes-line.md', 'recipes-picture.md']);
  assert.match(files.get('recipes-line.md'), /^## Name line$/m);
  assert.match(files.get('recipes-picture.md'), /^## Name pic$/m);
  assert.match(files.get('recipes-build-aid.md'), /^## Name aid$/m);
  assert.match(files.get('recipes-build-aid.md'), /^## Name odd$/m);
});

test('build: a group too big for one package file is split into numbered parts, each record pointing at the part that holds it', () => {
  const entries = Array.from({ length: 6 }, (_, i) => ({ slug: `line${i}`, lines: `variations: ${'a longer note '.repeat(300)}` }));
  const one = build(entries).files.get('recipes-line.md');
  const limit = Math.ceil(Buffer.byteLength(one) / 2.5);
  const { files, index } = build(entries, { fileLimit: limit });
  const parts = [...files.keys()].filter((f) => /^recipes-line(-\d+)?\.md$/.test(f)).sort();
  assert.ok(parts.length >= 3, `expected the line group in 3+ parts, got ${parts.join(', ')}`);
  assert.ok(parts.includes('recipes-line.md') && parts.includes('recipes-line-2.md'), parts.join(', '));
  assert.match(index.documents.find((d) => d.id === 'arsenal-line-2').title, /part 2 of \d/);
  for (const f of parts) assert.ok(Buffer.byteLength(files.get(f)) <= limit, `${f} over the limit`);
  const docs = new Map(index.documents.map((d) => [d.id, d.path.replace(/^arsenal\//, '')]));
  for (const r of JSON.parse(files.get('catalog.json')).entries) {
    const file = docs.get(r.section.document);
    assert.ok(file, `${r.id} points at ${r.section.document}, which the index does not list`);
    assert.match(files.get(file), new RegExp(`^## ${r.section.heading}\\nid: ${r.id}$`, 'm'));
  }
});

test('build: a group with no recipes gets no file', () => {
  const { files } = build([{ slug: 'line', status: 'proven' }]);
  assert.deepEqual([...files.keys()].sort(), ['catalog.json', 'index.json', 'jobs-v1.json', 'recipes-line.md']);
});

test('build: each shipped recipe carries its id, revision and jobs, and none of its provenance', () => {
  const { files } = build([{ slug: 'pic', job: 'add-depth', support: ['before-after'], status: 'proven' }]);
  const text = files.get('recipes-picture.md');
  const cat = JSON.parse(files.get('catalog.json'));
  assert.match(text, /^id: 01-pic$/m);
  assert.match(text, new RegExp(`^revision: ${cat.entries[0].revision}$`, 'm'));
  assert.match(text, /^job: add-depth; support: before-after$/m);
  assert.match(text, /^status: proven \(accepted 2026-11-14\)$/m);
  assert.doesNotMatch(text, /accepted by|rebuilt and compared/);
  assert.doesNotMatch(text, /vidAAAAAAAA|\bf\d{4,6}\b|scratch\//);
  assert.equal(JSON.parse(files.get('catalog.json')).entries[0].status, 'proven');
});

test('status: a shipped status line keeps the acceptance date and drops who accepted it and what they said', () => {
  assert.equal(publicStatus('status: proven (accepted by Joe 2026-11-14: rebuilt in After Effects (twice) and compared; he said "yes they all match")'), 'status: proven (accepted 2026-11-14)');
  assert.equal(publicStatus('status: proven (accepted by the owner 2026-11-14: rebuilt and compared)'), 'status: proven (accepted 2026-11-14)');
});

test('status: a status line without a name, and any other line, is left alone', () => {
  for (const line of ['status: proven (accepted 2026-11-14)', 'status: proven (accepted 2026-11-14: rebuilt)', 'status: unproven', 'steps: accepted by the owner 2026-11-14: x)']) {
    assert.equal(publicStatus(line), line);
  }
});

test('status: the drafts on disk keep the full line; only the shipped recipe is shortened', () => {
  const { dir, catalog } = fixture([{ slug: 'a', status: 'proven' }]);
  try {
    buildArsenal({ catalog, jobs: JOBS, examples: EXAMPLES, draftsDir: dir, stills: {}, creators: [] });
    assert.match(fs.readFileSync(path.join(dir, 'vidAAAAAAAA.md'), 'utf8'), /^status: proven \(accepted by the owner 2026-11-14: rebuilt and compared\)$/m);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('build: the catalog line is scrubbed like the recipe text', () => {
  const { dir, catalog } = fixture([{ slug: 'a' }]);
  try {
    catalog.recipes[0].line = 'Sets up depth (off at f010901) as in vidAAAAAAAA.';
    const { files } = buildArsenal({ catalog, jobs: JOBS, examples: EXAMPLES, draftsDir: dir, stills: {}, creators: [] });
    assert.equal(JSON.parse(files.get('catalog.json')).entries[0].line, 'Sets up depth (off) as in the source video.');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('build: the catalog records point at the shipped document and drop the source fields', () => {
  const { files } = build([{ slug: 'pic', job: 'add-depth', mood: ['calm'], needs: ['footage'], group: 'g' }]);
  const cat = JSON.parse(files.get('catalog.json'));
  assert.equal(cat.vocab, 'jobs-v1');
  assert.deepEqual(cat.jobs, ['before-after', 'add-depth', 'hand-over']);
  const [r] = cat.entries;
  assert.deepEqual(r.section, { document: 'arsenal-picture', heading: 'Name pic' });
  for (const field of ['video', 'n', 'why', 'group']) assert.equal(field in r, false, field);
  assert.deepEqual(r.mood, ['calm']);
  assert.deepEqual(r.needs, ['footage']);
  assert.equal(r.taught_by, 1);
  assert.equal(r.still, null);
  assert.doesNotMatch(files.get('catalog.json'), /vidAAAAAAAA/);
});

test('build: a still ships only for a proven technique, with its path and hash', () => {
  const jpg = Buffer.from('fake jpeg bytes');
  const { files, stills } = build([
    { slug: 'p', status: 'proven' },
    { slug: 'u' },
    { slug: 'aid', status: 'proven', kind: 'build-aid', job: null },
  ], { proofs: { '01-p': 'x/01.png', '02-u': 'x/02.png', '03-aid': 'x/03.png' }, stills: { '01-p': jpg, '03-aid': jpg } });
  const cat = JSON.parse(files.get('catalog.json'));
  assert.deepEqual(cat.entries.map((r) => r.still), [{ path: 'arsenal/stills/01-p.jpg', sha256: sha(jpg) }, null, null]);
  assert.deepEqual(Object.keys(stills), ['01-p']);
});

test('build: wanted lists the proven techniques that have a proof render', () => {
  const { wanted } = build([{ slug: 'p', status: 'proven' }, { slug: 'q', status: 'proven' }, { slug: 'u' }], { proofs: { '01-p': 'x/01.png', '03-u': 'x/03.png' } });
  assert.deepEqual(wanted, { '01-p': 'x/01.png' });
});

// Content's jobs file as Content writes it: the fields the runtime reads, and the ones it does not, some naming the owner.
const CONTENT_JOBS = {
  version: '1',
  approved: 'Joe, 2026-11-14 ("yes to all", via the channel-learner session)',
  design: 'docs/superpowers/specs/x.md',
  notes: 'The ids are the contract. Joe approves every change.',
  groups: JOBS.groups,
  tags: {
    'build-aid': 'A recipe that helps build but serves no beat. Never returned by a beat query.',
    unmatched: 'A recipe that fits no job yet. Goes to the proposals queue; never becomes a job without Joe.',
  },
  jobs: JOBS.jobs.map((j) => ({ ...j, example: `private example for ${j.id}` })),
};

test('build: the jobs file keeps Content\'s ids, groups, names and definitions and ships the public examples', () => {
  const { dir, catalog } = fixture([{ slug: 'a', status: 'proven' }]);
  try {
    const { files } = buildArsenal({ catalog, jobs: CONTENT_JOBS, examples: EXAMPLES, draftsDir: dir, stills: {}, creators: [] });
    const shipped = JSON.parse(files.get('jobs-v1.json'));
    assert.equal(shipped.version, '1');
    assert.deepEqual(shipped.groups, JOBS.groups);
    assert.deepEqual(shipped.jobs.map(({ id, group, name, definition }) => ({ id, group, name, definition })), JOBS.jobs);
    assert.deepEqual(Object.fromEntries(shipped.jobs.map((j) => [j.id, j.example])), EXAMPLES);
    assert.doesNotMatch(files.get('jobs-v1.json'), /private example/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('jobs: ships only the top-level fields the runtime reads, in Content\'s order', () => {
  const shipped = JSON.parse(publicJobs(CONTENT_JOBS, EXAMPLES));
  assert.deepEqual(Object.keys(shipped), ['version', 'groups', 'tags', 'jobs']);
  assert.deepEqual(Object.keys(shipped.tags), ['build-aid', 'unmatched']);
  assert.equal(shipped.tags['build-aid'], CONTENT_JOBS.tags['build-aid']);
});

test('jobs: text that names the owner is reworded by the explicit map, and nothing else changes', () => {
  const shipped = JSON.parse(publicJobs(CONTENT_JOBS, EXAMPLES));
  assert.equal(shipped.tags.unmatched, 'A recipe that fits no job yet. Goes to the proposals queue; never becomes a job without the owner\'s approval.');
  assert.equal(JOBS_REWORDING['never becomes a job without Joe'], 'never becomes a job without the owner\'s approval');
  assert.equal(JSON.parse(publicJobs(JOBS, EXAMPLES)).tags, undefined);
});

test('guard: passes on Content\'s jobs file and drafts accepted by a named person', () => {
  const { dir, catalog } = fixture([{ slug: 'a', status: 'proven' }, { slug: 'b' }]);
  try {
    const draft = path.join(dir, 'vidAAAAAAAA.md');
    fs.writeFileSync(draft, fs.readFileSync(draft, 'utf8').replace('accepted by the owner 2026-11-14: rebuilt and compared', 'accepted by Joe 2026-11-14: rebuilt by Joe; he said "yes"'));
    const { files } = buildArsenal({ catalog, jobs: CONTENT_JOBS, examples: EXAMPLES, draftsDir: dir, stills: {}, creators: [] });
    assert.match(files.get('recipes-line.md'), /^status: proven \(accepted 2026-11-14\)$/m);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('guard: the repo\'s own drafts and jobs file build, and the shipped arsenal names no private name', () => {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  const drafts = path.join(root, 'product', 'arsenal-drafts');
  const out = path.join(root, 'plugin', 'library', 'arsenal');
  const jobs = JSON.parse(fs.readFileSync(path.join(out, 'jobs-v1.json'), 'utf8'));
  const examples = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'channel-learner', 'arsenal-public-examples.json'), 'utf8'));
  const catalog = buildCatalog({ draftsDir: drafts, jobs, tags: JSON.parse(fs.readFileSync(path.join(drafts, 'tags.json'), 'utf8')), proofs: JSON.parse(fs.readFileSync(path.join(drafts, 'proof-stills.json'), 'utf8')) });
  const creators = creatorsOf(fs.readFileSync(path.join(drafts, 'CREDITS.md'), 'utf8'));
  assert.doesNotThrow(() => buildArsenal({ catalog, jobs, examples, draftsDir: drafts, creators }));
  for (const f of fs.readdirSync(out).filter((n) => n !== 'stills')) {
    const text = fs.readFileSync(path.join(out, f), 'utf8');
    for (const n of PRIVATE_NAMES) assert.doesNotMatch(text, new RegExp(`\\b${n}\\b`, 'i'), `${f} names ${n}`);
  }
});

test('jobs: written one job per line, the way Content lays its file out', () => {
  const text = publicJobs({ version: '1', groups: { line: 'Line jobs' }, jobs: [{ id: 'a', group: 'line', name: 'A', definition: 'D.', example: 'old' }] }, { a: 'new' });
  assert.equal(text, '{\n  "version": "1",\n  "groups": {\n    "line": "Line jobs"\n  },\n  "jobs": [\n    {"id": "a", "group": "line", "name": "A", "definition": "D.", "example": "new"}\n  ]\n}\n');
});

test('jobs: refuses a Content job with no public example, naming it', () => {
  const { 'add-depth': _, ...missing } = EXAMPLES;
  assert.throws(() => publicJobs(JOBS, missing), /no public example for add-depth/);
  const { dir, catalog } = fixture([{ slug: 'a' }]);
  try {
    assert.throws(() => buildArsenal({ catalog, jobs: JOBS, examples: missing, draftsDir: dir, stills: {}, creators: [] }), /no public example for add-depth/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('jobs: refuses a public example for a job id Content does not have, naming it', () => {
  assert.throws(() => publicJobs(JOBS, { ...EXAMPLES, 'old-job': 'x', 'other-job': 'y' }), /public examples for jobs Content does not have: old-job, other-job/);
});

test('jobs: the plugin\'s public examples cover exactly the shipped job ids and name no one', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const examples = JSON.parse(fs.readFileSync(path.join(here, '..', 'arsenal-public-examples.json'), 'utf8'));
  const shipped = JSON.parse(fs.readFileSync(path.join(here, '..', '..', '..', 'plugin', 'library', 'arsenal', 'jobs-v1.json'), 'utf8'));
  assert.deepEqual(Object.keys(examples).sort(), shipped.jobs.map((j) => j.id).sort());
  for (const [id, ex] of Object.entries(examples)) {
    assert.equal(typeof ex, 'string', id);
    assert.ok(ex.length > 0 && !ex.includes('\n'), id);
    for (const n of PRIVATE_NAMES) assert.doesNotMatch(ex, new RegExp(`\\b${n}\\b`, 'i'), `${id} names ${n}`);
  }
});

test('build: the index names the documents, the vocab, the catalog version and the counts', () => {
  const { files } = build([{ slug: 'a', status: 'proven' }, { slug: 'pic', job: 'add-depth' }], { proofs: { '01-a': 'x.png' }, stills: { '01-a': Buffer.from('j') } });
  const index = JSON.parse(files.get('index.json'));
  const cat = JSON.parse(files.get('catalog.json'));
  assert.equal(index.tool, 'ae_arsenal');
  assert.equal(index.vocab, 'jobs-v1');
  assert.equal(index.version, cat.version);
  assert.deepEqual(index.documents.map((d) => [d.id, d.path, d.kind]), [
    ['arsenal-index', 'arsenal/index.json', 'catalog'],
    ['arsenal-catalog', 'arsenal/catalog.json', 'catalog'],
    ['arsenal-jobs', 'arsenal/jobs-v1.json', 'catalog'],
    ['arsenal-line', 'arsenal/recipes-line.md', 'recipes'],
    ['arsenal-picture', 'arsenal/recipes-picture.md', 'recipes'],
  ]);
  assert.deepEqual(index.counts, { recipes: 2, proven: 1, stills: 1 });
});

test('build: refuses shipped text that names a creator', () => {
  assert.throws(() => build([{ slug: 'a', status: 'proven' }], { creators: ['Name a'] }), /names a creator.*Name a/);
});

test('guard: one list of private names, checked alongside the creators', () => {
  assert.deepEqual(PRIVATE_NAMES, ['Joe', 'JoeB', 'Benscoter', 'Claude', 'Anthropic', 'Higgsfield']);
});

test('guard: refuses a recipe, the catalog or the jobs file that names a private name, whole word and any case', () => {
  const { dir, catalog } = fixture([{ slug: 'a', status: 'proven' }]);
  const run = (o = {}) => buildArsenal({ catalog, jobs: JOBS, examples: EXAMPLES, draftsDir: dir, stills: {}, creators: [], ...o });
  try {
    const draft = path.join(dir, 'vidAAAAAAAA.md');
    const original = fs.readFileSync(draft, 'utf8');
    fs.writeFileSync(draft, original.replace('1. Draw it.', '1. Draw it the way joe does.'));
    assert.throws(() => run(), /recipes-line\.md names a private name: Joe/);
    fs.writeFileSync(draft, original);
    catalog.recipes[0].line = 'Built the way JOEB builds it.';
    assert.throws(() => run(), /catalog\.json names a private name: JoeB/);
    catalog.recipes[0].line = 'A plain line.';
    assert.throws(() => run({ examples: { ...EXAMPLES, 'add-depth': 'a Higgsfield render with a shadow' } }), /jobs-v1\.json names a private name: Higgsfield/);
    assert.throws(() => run({ jobs: { ...JOBS, tags: { unmatched: 'Anthropic approves.' } } }), /jobs-v1\.json names a private name: Anthropic/);
    assert.doesNotThrow(() => run({ examples: { ...EXAMPLES, 'add-depth': 'Joey and Claudette on a mat' } }));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('build: refuses a file over the 256 KiB package limit', () => {
  const big = 'x'.repeat(270_000);
  const { dir, catalog } = fixture([{ slug: 'a' }]);
  try {
    catalog.recipes[0].line = big;
    assert.throws(() => buildArsenal({ catalog, jobs: JOBS, examples: EXAMPLES, draftsDir: dir, stills: {}, creators: [] }), /catalog\.json is \d+ bytes, over the 262144/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// ---------- variants ----------

// A parent in vidAAAAAAAA and a variant of it in vidBBBBBBBB whose own job is in another group.
const FAMILY = [
  { slug: 'parent', status: 'proven' },
  { slug: 'other' },
  { slug: 'var', video: 'vidBBBBBBBB', job: 'add-depth', variant_of: 'vidAAAAAAAA#1',
    lines: 'variant of: 01-parent (vidAAAAAAAA #1)\ndiffers: Wider gap (shown f001441), and the turn is slower than in vidBBBBBBBB.' },
];

test('variants: a variant ships beside its parent, in the parent\'s job group file, right after it', () => {
  const { files } = build(FAMILY);
  assert.deepEqual([...files.keys()].sort(), ['catalog.json', 'index.json', 'jobs-v1.json', 'recipes-line.md'], 'no picture file: the variant follows its parent');
  const text = files.get('recipes-line.md');
  const order = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(order, ['Name parent', 'Name var', 'Name other']);
  const cat = JSON.parse(files.get('catalog.json'));
  const by = Object.fromEntries(cat.entries.map((r) => [r.id, r]));
  assert.deepEqual(by['01-var'].section, { document: 'arsenal-line', heading: 'Name var' });
  assert.equal(by['01-var'].variant_of, '01-parent');
  assert.equal(by['01-var'].job, 'add-depth');
  assert.deepEqual(by['01-parent'].variants, ['01-var']);
  assert.equal(by['01-parent'].taught_by, 2);
  assert.deepEqual(by['02-other'].variants, []);
  assert.equal('variant_of' in by['02-other'], false);
});

test('variants: the shipped variant names only its parent recipe and keeps its differences, scrubbed', () => {
  const { files } = build(FAMILY);
  const section = files.get('recipes-line.md').split(/^(?=## )/m).find((t) => t.startsWith('## Name var\n'));
  assert.match(section, /^variant of: 01-parent$/m);
  assert.match(section, /^differs: Wider gap \(shown\), and the turn is slower than in the source video\.$/m);
  assert.doesNotMatch(section, /vid[AB]{8}|#1|\bf\d{4,6}\b/);
  assert.match(section, /^job: add-depth$/m);
});

test('variants: the name guard runs on the variant lines', () => {
  const named = (differs) => [FAMILY[0], FAMILY[1], { ...FAMILY[2], lines: `variant of: 01-parent (vidAAAAAAAA #1)\ndiffers: ${differs}` }];
  assert.throws(() => build(named('Built the way Joe builds it.')), /recipes-line\.md names a private name: Joe/);
  assert.throws(() => build(named('As Some Channel sets it.')), /recipes-line\.md names a creator: Some Channel/);
});

test('gallery: a recipe with variants shows how many', () => {
  const block = galleryBlock({ entries: [
    { id: '01-p', name: 'Round dots', still: { path: 'arsenal/stills/01-p.jpg' }, variants: ['02-a', '03-b'] },
    { id: '04-q', name: 'One more', still: { path: 'arsenal/stills/04-q.jpg' }, variants: ['05-c'] },
    { id: '06-r', name: 'Plain', still: { path: 'arsenal/stills/06-r.jpg' }, variants: [] },
  ] });
  assert.match(block, /^!\[Round dots \(2 variants\)\]\(library\/arsenal\/stills\/01-p\.jpg\)$/m);
  assert.match(block, /^!\[One more \(1 variant\)\]\(/m);
  assert.match(block, /^!\[Plain\]\(/m);
});

// ---------- writeArsenal ----------

test('write: writes the files, makes each wanted still once, keeps an existing one and removes stale ones', () => {
  const { dir, catalog } = fixture([{ slug: 'p', status: 'proven' }, { slug: 'q', status: 'proven' }], { '01-p': 'proofs/01.png', '02-q': 'proofs/02.png' });
  const out = fs.mkdtempSync(path.join(tmpdir(), 'arsenal-out-'));
  try {
    fs.mkdirSync(path.join(out, 'stills'));
    fs.writeFileSync(path.join(out, 'stills', '02-q.jpg'), 'kept');
    fs.writeFileSync(path.join(out, 'stills', '09-gone.jpg'), 'stale');
    fs.writeFileSync(path.join(out, 'recipes-old.md'), 'stale');
    const made = [];
    const makeStill = (from, to) => { made.push(from); fs.writeFileSync(to, `made from ${from}`); };
    const res = writeArsenal({ catalog, jobs: JOBS, examples: EXAMPLES, draftsDir: dir, outDir: out, rendersRoot: '/renders', makeStill, creators: [] });
    assert.deepEqual(made, ['/renders/proofs/01.png']);
    assert.equal(fs.readFileSync(path.join(out, 'stills', '02-q.jpg'), 'utf8'), 'kept');
    assert.deepEqual(fs.readdirSync(path.join(out, 'stills')).sort(), ['01-p.jpg', '02-q.jpg']);
    assert.deepEqual(fs.readdirSync(out).sort(), ['catalog.json', 'index.json', 'jobs-v1.json', 'recipes-line.md', 'stills']);
    const cat = JSON.parse(fs.readFileSync(path.join(out, 'catalog.json'), 'utf8'));
    assert.equal(cat.entries[1].still.sha256, sha('kept'));
    assert.deepEqual(res.missing, []);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(out, { recursive: true, force: true }); }
});

test('write: a wanted still with no render and no existing copy is reported missing, and ships no still', () => {
  const { dir, catalog } = fixture([{ slug: 'p', status: 'proven' }], { '01-p': 'proofs/01.png' });
  const out = fs.mkdtempSync(path.join(tmpdir(), 'arsenal-out-'));
  try {
    const makeStill = () => { throw new Error('no such render'); };
    const res = writeArsenal({ catalog, jobs: JOBS, examples: EXAMPLES, draftsDir: dir, outDir: out, rendersRoot: null, makeStill, creators: [] });
    assert.deepEqual(res.missing, ['01-p']);
    assert.equal(JSON.parse(fs.readFileSync(path.join(out, 'catalog.json'), 'utf8')).entries[0].still, null);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(out, { recursive: true, force: true }); }
});

// ---------- README gallery ----------

test('gallery: shows each shipped still with Markdown image syntax, under its recipe name', () => {
  const cat = { entries: [
    { id: '01-p', name: 'Round dots', still: { path: 'arsenal/stills/01-p.jpg' } },
    { id: '02-u', name: 'No still', still: null },
  ] };
  const block = galleryBlock(cat);
  assert.match(block, /!\[Round dots\]\(library\/arsenal\/stills\/01-p\.jpg\)/);
  assert.doesNotMatch(block, /No still/);
  assert.doesNotMatch(block, /`/);
});

test('gallery: replaces only the marked block, and refuses a README without the markers', () => {
  const readme = 'Intro\n\n<!-- arsenal-stills:start -->\nold\n<!-- arsenal-stills:end -->\n\nOutro\n';
  const out = withGallery(readme, 'new block');
  assert.equal(out, 'Intro\n\n<!-- arsenal-stills:start -->\nnew block\n<!-- arsenal-stills:end -->\n\nOutro\n');
  assert.throws(() => withGallery('Intro\n', 'x'), /arsenal-stills:start/);
});

test('creators: read from the credits table, one per channel', () => {
  const credits = '| Draft | Channel | Video |\n|---|---|---|\n| `a.md` | [Chan One](https://x) | [T](https://y) |\n| `b.md` | [Chan One](https://x) | [U](https://z) |\n| `c.md` | [Other](https://q) | [V](https://w) |\n';
  assert.deepEqual(creatorsOf(credits), ['Chan One', 'Other']);
});

// ---------- CLI ----------

test('cli: one command builds the arsenal from drafts, tags and a jobs file, and writes the gallery', () => {
  const { dir } = fixture([{ slug: 'a' }]);
  const out = path.join(dir, 'out');
  const readme = path.join(dir, 'README.md.txt');
  try {
    fs.writeFileSync(path.join(dir, 'tags.json'), JSON.stringify({ vocab: 'jobs-v1', recipes: { 'vidAAAAAAAA#1': tag('01-a') } }));
    fs.writeFileSync(path.join(dir, 'jobs.json'), JOBS_TEXT);
    fs.writeFileSync(path.join(dir, 'examples.json'), JSON.stringify(EXAMPLES));
    fs.writeFileSync(path.join(dir, 'proofs.json'), '{}');
    fs.writeFileSync(path.join(dir, 'CREDITS.txt'), '| Draft | Channel | Video |\n|---|---|---|\n| `x` | [Chan](https://c) | [V](https://v) |\n');
    fs.writeFileSync(readme, 'R\n<!-- arsenal-stills:start -->\n<!-- arsenal-stills:end -->\n');
    const r = spawnSync(process.execPath, [CLI, '--drafts', dir, '--tags', path.join(dir, 'tags.json'), '--jobs', path.join(dir, 'jobs.json'),
      '--proofs', path.join(dir, 'proofs.json'), '--examples', path.join(dir, 'examples.json'), '--credits', path.join(dir, 'CREDITS.txt'), '--out', out, '--readme', readme, '--no-manifest'], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(fs.readdirSync(out).sort(), ['catalog.json', 'index.json', 'jobs-v1.json', 'recipes-line.md']);
    assert.match(r.stdout, /"recipes":1/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// ---------- three levels: levels.json, style entries, stills required or marked ----------

const VOCAB = { material: ['glass', 'paper'], floor: ['gloss-dark'], depth: [] };
const STYLE = { id: 'glassy', title: 'Glassy', summary: 'A glass object on a dark floor. More words.', goodFor: 'A product reveal', needs: ['blender'], contentStatus: 'proven', pluginProof: null };
const levelsFor = (catalog, o = {}) => ({
  provides: VOCAB, beats: ['title', 'picture', 'input'], private_beats: { input: 'the speaker' },
  recipes: Object.fromEntries(catalog.recipes.map((r) => [r.id, { provides: ['depth'] }])),
  styles: { glassy: { level: 'world', also_level: ['direction'], provides: ['material: glass', 'floor: gloss-dark'], cost: { renderer: 'blender', seconds_per_frame: 0.07 }, still: { beat: 'picture' }, composes: [] } },
  ...o,
});
const buildLevels = (entries, edit = (l) => l, o = {}) => {
  const { dir, catalog } = fixture(entries, o.proofs);
  try {
    return buildArsenal({ catalog, jobs: JOBS, examples: EXAMPLES, draftsDir: dir, stills: o.stills ?? {}, creators: [],
      levels: edit(levelsFor(catalog)), styles: o.styles ?? [STYLE], styleDocs: { glassy: '# Glassy\n\nText.\n' } });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
};

test('levels: provides is "key" or "key: word"', () => {
  assert.deepEqual(parseProvides('material: glass'), ['material', 'glass']);
  assert.deepEqual(parseProvides('depth'), ['depth', null]);
  assert.equal(parseProvides('Material Glass!'), null);
});

test('levels: every entry gets level, provides, cost, composes and shelf; recipes are level recipe', () => {
  const jpg = Buffer.from('jpeg');
  const cat = JSON.parse(buildLevels([{ slug: 'p', status: 'proven' }], (l) => l, { proofs: { '01-p': 'x.png' }, stills: { '01-p': jpg, 'style-glassy': jpg } }).files.get('catalog.json'));
  assert.deepEqual(cat.levels, ['direction', 'world', 'recipe']);
  assert.deepEqual(cat.provides, VOCAB);
  const [r, s] = cat.entries;
  assert.equal(r.level, 'recipe');
  assert.deepEqual(r.provides, ['depth']);
  assert.deepEqual(r.cost, { renderer: 'classic' });
  assert.deepEqual(r.composes, []);
  assert.equal(r.shelf, 'shipped');
  assert.equal(s.id, 'style-glassy');
  assert.equal(s.level, 'world');
  assert.deepEqual(s.also_level, ['direction']);
  assert.equal(s.kind, 'style');
  assert.equal(s.job, null);
  assert.equal(s.line, 'A glass object on a dark floor.');
  assert.deepEqual(s.section, { document: 'style-glassy', heading: null });
  assert.deepEqual(s.still, { path: 'arsenal/stills/style-glassy.jpg', sha256: sha(jpg) });
  assert.match(s.revision, /^[0-9a-f]{8}$/);
});

test('levels: recipe revisions are the same with or without levels, so pinned ids keep resolving', () => {
  const plain = JSON.parse(build([{ slug: 'p', status: 'proven' }]).files.get('catalog.json')).entries;
  const lv = JSON.parse(buildLevels([{ slug: 'p', status: 'proven' }]).files.get('catalog.json')).entries;
  assert.equal(lv[0].revision, plain[0].revision);
});

test('levels: an entry with no still carries the reason, never a bare null', () => {
  const cat = JSON.parse(buildLevels([{ slug: 'u' }, { slug: 'aid', status: 'proven', kind: 'build-aid', job: null }]).files.get('catalog.json'));
  const by = Object.fromEntries(cat.entries.map((e) => [e.id, e]));
  assert.match(by['01-u'].no_still, /unproven/);
  assert.match(by['02-aid'].no_still, /build aid/);
  assert.match(by['style-glassy'].no_still, /no still made yet/);
  for (const e of cat.entries) assert.ok(e.still || e.no_still, e.id);
});

test('levels: refuses provides outside the vocabulary, a technique with none, and a recipe with no record', () => {
  const entries = [{ slug: 'p', status: 'proven' }];
  assert.throws(() => buildLevels(entries, (l) => ({ ...l, recipes: { '01-p': { provides: ['sparkle'] } } })), /provides key "sparkle" is not in the vocabulary/);
  assert.throws(() => buildLevels(entries, (l) => ({ ...l, recipes: { '01-p': { provides: ['material: wood'] } } })), /"material: wood" is not one of the material words/);
  assert.throws(() => buildLevels(entries, (l) => ({ ...l, recipes: { '01-p': { provides: [] } } })), /a technique needs at least one provides/);
  assert.throws(() => buildLevels(entries, (l) => ({ ...l, recipes: {} })), /recipe 01-p has no levels record/);
  assert.throws(() => buildLevels(entries, (l) => ({ ...l, recipes: { ...l.recipes, '09-x': { provides: ['depth'] } } })), /levels record for 09-x, which is not a recipe/);
});

test('levels: refuses a style without a record, a record without a style, a bad level and a still from a private beat', () => {
  const entries = [{ slug: 'p', status: 'proven' }];
  assert.throws(() => buildLevels(entries, (l) => ({ ...l, styles: {} })), /style glassy has no levels record/);
  assert.throws(() => buildLevels(entries, (l) => l, { styles: [] }), /levels record for style glassy, which is not in the style index/);
  assert.throws(() => buildLevels(entries, (l) => ({ ...l, styles: { glassy: { ...l.styles.glassy, level: 'recipe' } } })), /level "recipe" is not direction or world/);
  assert.throws(() => buildLevels(entries, (l) => ({ ...l, styles: { glassy: { ...l.styles.glassy, still: { beat: 'input' } } } })), /still beat "input" is private/);
});

test('write: a style still is cut once from its proof movie at the named beat, then kept', () => {
  const { dir, catalog } = fixture([{ slug: 'p', status: 'proven' }], { '01-p': 'proofs/01.png' });
  const out = fs.mkdtempSync(path.join(tmpdir(), 'arsenal-out-'));
  const proofs = fs.mkdtempSync(path.join(tmpdir(), 'style-proofs-'));
  try {
    fs.mkdirSync(path.join(proofs, 'glassy', 'proof'), { recursive: true });
    fs.writeFileSync(path.join(proofs, 'glassy', 'proof', 'card.json'), JSON.stringify({ beatTimes: [0.65, 2.17, 3.79] }));
    const cuts = [];
    const args = { catalog, jobs: JOBS, examples: EXAMPLES, draftsDir: dir, outDir: out, rendersRoot: '/r', creators: [],
      makeStill: (from, to) => fs.writeFileSync(to, 'recipe'),
      levels: levelsFor(catalog), styles: [STYLE], styleDocs: { glassy: '# Glassy\n' }, styleProofs: proofs,
      makeStyleStill: (from, t, to) => { cuts.push([path.relative(proofs, from), t]); fs.writeFileSync(to, 'style'); } };
    writeArsenal(args);
    writeArsenal(args);
    assert.deepEqual(cuts, [['glassy/proof/proof.mp4', 2.17]]);
    const cat = JSON.parse(fs.readFileSync(path.join(out, 'catalog.json'), 'utf8'));
    assert.equal(cat.entries.find((e) => e.id === 'style-glassy').still.sha256, sha('style'));
  } finally { for (const d of [dir, out, proofs]) fs.rmSync(d, { recursive: true, force: true }); }
});

test('gallery: styles are shown with their level, recipes as before', () => {
  const block = galleryBlock({ entries: [
    { id: 'style-g', kind: 'style', level: 'world', also_level: ['direction'], name: 'Glassy', still: { path: 'arsenal/stills/style-g.jpg' } },
    { id: '01-p', kind: 'technique', name: 'Round dots', still: { path: 'arsenal/stills/01-p.jpg' }, variants: [] },
  ] });
  assert.match(block, /^!\[Glassy \(world and direction\)\]\(library\/arsenal\/stills\/style-g\.jpg\)$/m);
  assert.match(block, /^!\[Round dots\]\(library\/arsenal\/stills\/01-p\.jpg\)$/m);
});

test('guard: the repo\'s levels.json is sound against its drafts and the shipped style index', () => {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  const drafts = path.join(root, 'product', 'arsenal-drafts');
  const jobs = JSON.parse(fs.readFileSync(path.join(root, 'plugin', 'library', 'arsenal', 'jobs-v1.json'), 'utf8'));
  const catalog = buildCatalog({ draftsDir: drafts, jobs, tags: JSON.parse(fs.readFileSync(path.join(drafts, 'tags.json'), 'utf8')) });
  const { styles } = readStyles(path.join(root, 'plugin', 'library', 'styles'));
  assert.deepEqual(levelsProblems(JSON.parse(fs.readFileSync(path.join(drafts, 'levels.json'), 'utf8')), catalog, styles), []);
});

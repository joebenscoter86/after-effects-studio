import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildCatalog, findTechniques } from '../catalog.mjs';

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'catalog.mjs');
const ACCEPTED = 'status: proven (accepted by Joe 2026-11-14: rebuilt and compared)';

// A recipe section in the draft format; `status` is the whole status line.
const recipe = (n, slug, { name = `Technique ${slug}`, status = 'status: unproven', line = `What ${slug} does.`, body = '' } = {}) =>
  `## ${name}\nid: ${String(n).padStart(2, '0')}-${slug}\n${status}\nsource: vidA 1-2 s\nwhat it does for a beat: ${line}\nsteps:\n1. Do it. (said)${body}\n`;

// files: { 'vidA.md': [recipe(...), ...] }; extra non-recipe files are written as given.
function drafts(files) {
  const dir = fs.mkdtempSync(path.join(tmpdir(), 'catalog-test-'));
  for (const [f, sections] of Object.entries(files)) {
    const text = Array.isArray(sections)
      ? `# Techniques from one video\n\n| # | Technique |\n|---|---|\n\n${sections.join('\n')}`
      : sections;
    fs.writeFileSync(path.join(dir, f), text);
  }
  return dir;
}

const JOBS = { version: '1', jobs: ['before-after', 'point-at-detail', 'light-the-hero', 'finish-the-look', 'add-depth', 'hand-over'].map((id) => ({ id, group: 'line' })) };
const tag = (id, o = {}) => ({ id, kind: 'technique', job: 'before-after', support: [], mood: [], needs: [], duration: 2, motion: 'one-shot', difficulty: 1, group: null, why: 'test', ...o });
const tagsOf = (recipes) => ({ vocab: 'jobs-v1', recipes });

function withDir(files, fn) {
  const dir = drafts(files);
  try { return fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// ---------- buildCatalog ----------

test('build: each recipe carries id, video, n, name, line, section and its tags', () => {
  withDir({ 'vidA.md': [recipe(1, 'dots', { name: 'Round dots', line: 'Dots on a ring.' }), recipe(2, 'arc')], 'README.md': '# Readme\n\n## Not a recipe\ntext\n' }, (dir) => {
    const cat = buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({
      'vidA#1': tag('01-dots', { mood: ['calm'], needs: ['footage'], motion: 'loop' }),
      'vidA#2': tag('02-arc'),
    }) });
    assert.equal(cat.recipes.length, 2);
    const r = cat.recipes[0];
    assert.equal(r.id, '01-dots');
    assert.equal(r.video, 'vidA');
    assert.equal(r.n, 1);
    assert.equal(r.name, 'Round dots');
    assert.equal(r.line, 'Dots on a ring.');
    assert.deepEqual(r.section, { file: 'vidA.md', heading: 'Round dots' });
    assert.deepEqual(r.mood, ['calm']);
    assert.deepEqual(r.needs, ['footage']);
    assert.equal(r.motion, 'loop');
    assert.equal(r.kind, 'technique');
  });
});

test('build: status is proven only when the status line records a dated acceptance', () => {
  withDir({ 'vidA.md': [
    recipe(1, 'a', { status: ACCEPTED }),
    recipe(2, 'b', { status: 'status: proven' }),
    recipe(3, 'c', { status: 'status: unproven' }),
  ] }, (dir) => {
    const cat = buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({ 'vidA#1': tag('01-a'), 'vidA#2': tag('02-b'), 'vidA#3': tag('03-c') }) });
    assert.deepEqual(cat.recipes.map((r) => r.status), ['proven', 'unproven', 'unproven']);
  });
});

test('build: revision is a short hash that changes only when the recipe text changes', () => {
  const build = (body) => withDir({ 'vidA.md': [recipe(1, 'a', { body }), recipe(2, 'b')] }, (dir) =>
    buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({ 'vidA#1': tag('01-a'), 'vidA#2': tag('02-b') }) }));
  const one = build('');
  const same = build('');
  const edited = build('\n2. Another step. (said)');
  assert.match(one.recipes[0].revision, /^[0-9a-f]{8}$/);
  assert.equal(one.recipes[0].revision, same.recipes[0].revision);
  assert.notEqual(one.recipes[0].revision, edited.recipes[0].revision);
  assert.equal(one.recipes[1].revision, edited.recipes[1].revision, 'the other recipe keeps its revision');
});

test('build: the catalog version is a hash of all revisions, stamped with the vocab', () => {
  const build = (body) => withDir({ 'vidA.md': [recipe(1, 'a', { body })] }, (dir) =>
    buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({ 'vidA#1': tag('01-a') }) }));
  const a = build(''), b = build(''), c = build('\nmore');
  assert.equal(a.vocab, 'jobs-v1');
  assert.match(a.version, /^[0-9a-f]{8}$/);
  assert.equal(a.version, b.version);
  assert.notEqual(a.version, c.version);
});

test('build: vocab is derived from the jobs file version, in the shape Content ships', () => {
  const contentShape = {
    version: '2', groups: { line: 'Line jobs', picture: 'Picture jobs', connective: 'Connective jobs' },
    tags: { 'build-aid': 'helps build', unmatched: 'fits no job' },
    jobs: [{ id: 'before-after', group: 'line', name: 'Show a change of state', definition: 'd', example: 'e' }],
  };
  withDir({ 'vidA.md': [recipe(1, 'a')] }, (dir) => {
    const cat = buildCatalog({ draftsDir: dir, jobs: contentShape, tags: { vocab: 'jobs-v2', recipes: { 'vidA#1': tag('01-a') } } });
    assert.equal(cat.vocab, 'jobs-v2');
    assert.deepEqual(cat.jobs, ['before-after']);
    assert.throws(() => buildCatalog({ draftsDir: dir, jobs: contentShape, tags: tagsOf({ 'vidA#1': tag('01-a') }) }),
      /tags are jobs-v1 but the jobs file is jobs-v2/);
  });
});

test('build: build-aid and unmatched are tags, not jobs, so a technique may not use them as its job', () => {
  withDir({ 'vidA.md': [recipe(1, 'a'), recipe(2, 'b')] }, (dir) => {
    const cat = buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({
      'vidA#1': tag('01-a', { kind: 'build-aid', job: null }),
      'vidA#2': tag('02-b', { kind: 'unmatched', job: null }),
    }) });
    assert.deepEqual(cat.recipes.map((r) => r.kind), ['build-aid', 'unmatched']);
    assert.throws(() => buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({
      'vidA#1': tag('01-a', { job: 'build-aid' }), 'vidA#2': tag('02-b'),
    }) }), /vidA#1.*build-aid/);
  });
});

test('build: still is our proof render only for a proven recipe', () => {
  withDir({ 'vidA.md': [recipe(1, 'a', { status: ACCEPTED }), recipe(2, 'b'), recipe(3, 'c', { status: ACCEPTED })] }, (dir) => {
    const cat = buildCatalog({ draftsDir: dir, jobs: JOBS,
      tags: tagsOf({ 'vidA#1': tag('01-a'), 'vidA#2': tag('02-b'), 'vidA#3': tag('03-c') }),
      proofs: { '01-a': 'proofs/01.png', '02-b': 'proofs/02.png' } });
    assert.deepEqual(cat.recipes.map((r) => r.still), ['proofs/01.png', null, null]);
  });
});

test('build: taught_by counts the recipes sharing a group, at least 1', () => {
  withDir({ 'vidA.md': [recipe(1, 'a'), recipe(2, 'b')], 'vidB.md': [recipe(1, 'c'), recipe(2, 'd')] }, (dir) => {
    const cat = buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({
      'vidA#1': tag('01-a', { group: 'shadow' }), 'vidA#2': tag('02-b'),
      'vidB#1': tag('01-c', { group: 'shadow' }), 'vidB#2': tag('02-d', { group: 'glow' }),
    }) });
    assert.deepEqual(cat.recipes.map((r) => r.taught_by), [2, 1, 2, 1]);
  });
});

test('build: refuses tags whose job or support id is not in the vocabulary, naming them', () => {
  withDir({ 'vidA.md': [recipe(1, 'a'), recipe(2, 'b')] }, (dir) => {
    assert.throws(() => buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({
      'vidA#1': tag('01-a', { job: 'animate-counter' }),
      'vidA#2': tag('02-b', { support: ['add-depth', 'make-it-pop'] }),
    }) }), (e) => /vidA#1.*animate-counter/.test(e.message) && /vidA#2.*make-it-pop/.test(e.message));
  });
});

test('build: refuses a recipe with no tag and a tag with no recipe, naming them', () => {
  withDir({ 'vidA.md': [recipe(1, 'a'), recipe(2, 'b')] }, (dir) => {
    assert.throws(() => buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({ 'vidA#1': tag('01-a'), 'vidZ#9': tag('09-z') }) }),
      (e) => /no tag.*vidA#2/.test(e.message) && /no recipe.*vidZ#9/.test(e.message));
  });
});

test('build: refuses a tag whose id does not name the recipe at that place', () => {
  withDir({ 'vidA.md': [recipe(1, 'a')] }, (dir) => {
    assert.throws(() => buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({ 'vidA#1': tag('01-wrong') }) }), /vidA#1.*01-wrong.*01-a/);
  });
});

// ---------- composed recipes ----------
// composed.md holds recipes that chain proven recipes into one beat, learned from no video (explainer cookbook piece 10).

test('composed: a recipe in composed.md has no video and lists what it composes, recipes and pieces', () => {
  const chain = recipe(1, 'chain', { body: '\ncomposes: 01-a, 02-b; piece-tick' });
  withDir({ 'vidA.md': [recipe(1, 'a'), recipe(2, 'b')], 'composed.md': [chain] }, (dir) => {
    const cat = buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({ 'vidA#1': tag('01-a'), 'vidA#2': tag('02-b'), 'composed#1': tag('01-chain', { job: 'hand-over' }) }) });
    const r = cat.recipes.find((x) => x.id === '01-chain');
    assert.equal(r.video, null);
    assert.deepEqual(r.composes, ['01-a', '02-b', 'piece-tick']);
    assert.deepEqual(r.section, { file: 'composed.md', heading: 'Technique chain' });
    assert.equal(cat.recipes.find((x) => x.id === '01-a').video, 'vidA');
    assert.equal('composes' in cat.recipes.find((x) => x.id === '01-a'), false);
  });
});

test('composed: refuses a composed recipe naming a recipe that is not in the drafts, one with no composes line, and a composes line elsewhere', () => {
  withDir({ 'vidA.md': [recipe(1, 'a')], 'composed.md': [recipe(1, 'chain', { body: '\ncomposes: 01-a, 07-gone' })] }, (dir) => {
    assert.throws(() => buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({ 'vidA#1': tag('01-a'), 'composed#1': tag('01-chain') }) }), /01-chain composes 07-gone, which is no recipe in the drafts/);
  });
  withDir({ 'vidA.md': [recipe(1, 'a')], 'composed.md': [recipe(1, 'chain')] }, (dir) => {
    assert.throws(() => buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({ 'vidA#1': tag('01-a'), 'composed#1': tag('01-chain') }) }), /01-chain is in composed\.md but has no composes line/);
  });
  withDir({ 'vidA.md': [recipe(1, 'a', { body: '\ncomposes: 01-a' })] }, (dir) => {
    assert.throws(() => buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({ 'vidA#1': tag('01-a') }) }), /01-a has a composes line, but only composed\.md holds composed recipes/);
  });
});

// ---------- variants ----------

// A variant's status line followed by the two lines a variant's draft carries.
const variantLines = (parent, where, { status = 'status: unproven', differs = 'Uses a wider gap and a slower turn.' } = {}) =>
  `${status}\nvariant of: ${parent} (${where})\ndiffers: ${differs}`;

test('variants: a variant keeps its own id, revision, section and status and names its parent; the parent lists it', () => {
  withDir({ 'vidA.md': [recipe(1, 'a', { status: ACCEPTED })], 'vidB.md': [recipe(1, 'b', { status: variantLines('01-a', 'vidA #1') })] }, (dir) => {
    const cat = buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({
      'vidA#1': tag('01-a'),
      'vidB#1': tag('01-b', { variant_of: 'vidA#1', job: 'add-depth' }),
    }) });
    const [a, b] = cat.recipes;
    assert.equal(b.id, '01-b');
    assert.equal(b.variant_of, '01-a');
    assert.equal(b.status, 'unproven');
    assert.equal(b.job, 'add-depth', 'a variant keeps its own job; nothing is inherited');
    assert.deepEqual(b.section, { file: 'vidB.md', heading: 'Technique b' });
    assert.match(b.revision, /^[0-9a-f]{8}$/);
    assert.notEqual(b.revision, a.revision);
    assert.deepEqual(a.variants, ['01-b']);
    assert.deepEqual(b.variants, []);
    assert.equal('variant_of' in a, false, 'only a variant carries variant_of');
  });
});

test('variants: every record carries variants, empty when it has none', () => {
  withDir({ 'vidA.md': [recipe(1, 'a'), recipe(2, 'b')] }, (dir) => {
    const cat = buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({ 'vidA#1': tag('01-a'), 'vidA#2': tag('02-b') }) });
    assert.deepEqual(cat.recipes.map((r) => r.variants), [[], []]);
    assert.equal(cat.recipes.some((r) => 'variant_of' in r), false);
  });
});

test('variants: the parent is taught by itself, its variants and its group, a variant in the same group counted once', () => {
  withDir({
    'vidA.md': [recipe(1, 'a'), recipe(2, 'g')],
    'vidB.md': [recipe(1, 'v1', { status: variantLines('01-a', 'vidA #1') }), recipe(2, 'v2', { status: variantLines('01-a', 'vidA #1') })],
    'vidC.md': [recipe(1, 'solo'), recipe(2, 'sv', { status: variantLines('01-solo', 'vidC #1') })],
  }, (dir) => {
    const cat = buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({
      'vidA#1': tag('01-a', { group: 'shadow' }), 'vidA#2': tag('02-g', { group: 'shadow' }),
      'vidB#1': tag('01-v1', { variant_of: 'vidA#1', group: 'shadow' }), 'vidB#2': tag('02-v2', { variant_of: 'vidA#01' }),
      'vidC#1': tag('01-solo'), 'vidC#2': tag('02-sv', { variant_of: 'vidC#1' }),
    }) });
    const by = Object.fromEntries(cat.recipes.map((r) => [r.id, r]));
    assert.equal(by['01-a'].taught_by, 4, 'group shadow (a, g, v1) plus v2, v1 not counted twice');
    assert.deepEqual(by['01-a'].variants, ['01-v1', '02-v2']);
    assert.equal(by['01-solo'].taught_by, 2);
    assert.equal(by['02-g'].taught_by, 3, 'a group member keeps its group count');
  });
});

test('variants: refuses a variant_of that names no recipe, a parent that is itself a variant, and a kind that differs', () => {
  withDir({
    'vidA.md': [recipe(1, 'a'), recipe(2, 'aid')],
    'vidB.md': [recipe(1, 'b', { status: variantLines('01-a', 'vidA #1') }), recipe(2, 'c', { status: variantLines('01-b', 'vidB #1') }),
      recipe(3, 'd', { status: variantLines('09-z', 'vidZ #9') }), recipe(4, 'e', { status: variantLines('02-aid', 'vidA #2') })],
  }, (dir) => {
    assert.throws(() => buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({
      'vidA#1': tag('01-a'), 'vidA#2': tag('02-aid', { kind: 'build-aid', job: null }),
      'vidB#1': tag('01-b', { variant_of: 'vidA#1' }), 'vidB#2': tag('02-c', { variant_of: 'vidB#1' }),
      'vidB#3': tag('03-d', { variant_of: 'vidZ#9' }), 'vidB#4': tag('04-e', { variant_of: 'vidA#2' }),
    }) }), (e) => /vidB#2.*variant of vidB#1, which is itself a variant/.test(e.message)
      && /vidB#3.*variant_of vidZ#9 names no recipe/.test(e.message)
      && /vidB#4.*kind technique.*parent vidA#2 is build-aid/.test(e.message)
      && !/vidB#1/.test(e.message.replace(/variant of vidB#1/g, '')));
  });
});

test('variants: a variant\'s own job and support tags still validate against the vocabulary', () => {
  withDir({ 'vidA.md': [recipe(1, 'a'), recipe(2, 'b', { status: variantLines('01-a', 'vidA #1') })] }, (dir) => {
    assert.throws(() => buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({
      'vidA#1': tag('01-a'), 'vidA#2': tag('02-b', { variant_of: 'vidA#1', job: 'make-it-pop' }),
    }) }), /vidA#2.*make-it-pop/);
  });
});

test('variants: the draft lines and the tag must agree on the parent', () => {
  withDir({ 'vidA.md': [recipe(1, 'a'), recipe(2, 'b', { status: variantLines('01-a', 'vidA #1') }), recipe(3, 'c'), recipe(4, 'd', { status: 'status: unproven\nvariant of: 01-a (vidA #1)' })] }, (dir) => {
    assert.throws(() => buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({
      'vidA#1': tag('01-a'), 'vidA#2': tag('02-b'), 'vidA#3': tag('03-c', { variant_of: 'vidA#1' }), 'vidA#4': tag('04-d', { variant_of: 'vidA#1' }),
    }) }), (e) => /vidA#2.*variant of: 01-a.*no variant_of/.test(e.message)
      && /vidA#3.*no "variant of:" line/.test(e.message)
      && /vidA#4.*no "differs:" line/.test(e.message));
    assert.throws(() => buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({
      'vidA#1': tag('01-a'), 'vidA#2': tag('02-b', { variant_of: 'vidA#3' }), 'vidA#3': tag('03-c'), 'vidA#4': tag('04-d'),
    }) }), /vidA#2.*"variant of: 01-a" but the tag names 03-c/);
  });
});

// ---------- findTechniques ----------

// A ready catalog for query tests: built from fixtures once.
function catalogOf(entries) {
  // entries: [{ slug, status?: 'proven', ...tag fields }]
  const sections = entries.map((e, i) => recipe(i + 1, e.slug, { status: e.status === 'proven' ? ACCEPTED : 'status: unproven', name: `Name ${e.slug}`, line: `Line ${e.slug}.` }));
  const tags = {};
  entries.forEach((e, i) => { const { slug, status, ...t } = e; tags[`vidA#${i + 1}`] = tag(`${String(i + 1).padStart(2, '0')}-${slug}`, t); });
  return withDir({ 'vidA.md': sections }, (dir) => buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf(tags), proofs: {} }));
}
const ids = (out) => out.results.map((r) => r.id.slice(3));
const ask = (o) => ({ vocab: 'jobs-v1', job: 'before-after', ...o });

test('find: refuses an ask written against another vocabulary', () => {
  const cat = catalogOf([{ slug: 'a', status: 'proven' }]);
  assert.throws(() => findTechniques(cat, ask({ vocab: 'jobs-v2' })), /vocab jobs-v2.*catalog is jobs-v1/);
});

test('find: refuses an unknown job id and lists the valid ones', () => {
  const cat = catalogOf([{ slug: 'a', status: 'proven' }]);
  assert.throws(() => findTechniques(cat, ask({ job: 'before-and-after' })), /unknown job "before-and-after".*before-after, point-at-detail, light-the-hero/);
  assert.throws(() => findTechniques(cat, ask({ support: ['glowy'] })), /unknown job "glowy"/);
});

test('find: answers carry the vocab and the catalog version', () => {
  const cat = catalogOf([{ slug: 'a', status: 'proven' }]);
  const out = findTechniques(cat, ask({}));
  assert.equal(out.vocab, 'jobs-v1');
  assert.equal(out.version, cat.version);
});

test('find: never returns build-aid or unmatched recipes', () => {
  const cat = catalogOf([
    { slug: 'aid', status: 'proven', kind: 'build-aid', job: null },
    { slug: 'odd', status: 'proven', kind: 'unmatched', job: null },
    { slug: 'ok', status: 'proven' },
  ]);
  assert.deepEqual(ids(findTechniques(cat, ask({ constraints: { status: 'any' } }))), ['ok']);
});

test('find: matches the job as a recipe\'s primary or support job, and nothing else', () => {
  const cat = catalogOf([
    { slug: 'primary', status: 'proven' },
    { slug: 'support', status: 'proven', job: 'add-depth', support: ['before-after'] },
    { slug: 'other', status: 'proven', job: 'hand-over' },
  ]);
  assert.deepEqual(ids(findTechniques(cat, ask({}))), ['primary', 'support']);
});

test('find: proven only by default; status any lets unproven through', () => {
  const cat = catalogOf([{ slug: 'p', status: 'proven' }, { slug: 'u' }]);
  assert.deepEqual(ids(findTechniques(cat, ask({}))), ['p']);
  assert.deepEqual(ids(findTechniques(cat, ask({ constraints: { status: 'any' } }))), ['p', 'u']);
});

test('find: drops excluded ids', () => {
  const cat = catalogOf([{ slug: 'a', status: 'proven' }, { slug: 'b', status: 'proven' }]);
  assert.deepEqual(ids(findTechniques(cat, ask({ exclude: ['01-a'] }))), ['b']);
});

test('find: drops recipes needing assets the beat does not have; type and shapes always pass', () => {
  const cat = catalogOf([
    { slug: 'nothing', status: 'proven', needs: [] },
    { slug: 'typeshapes', status: 'proven', needs: ['type', 'shapes'] },
    { slug: 'footage', status: 'proven', needs: ['footage'] },
    { slug: 'photo', status: 'proven', needs: ['photo'] },
    { slug: 'illus', status: 'proven', needs: ['illustration'] },
  ]);
  assert.deepEqual(ids(findTechniques(cat, ask({ assets: { type: '24 / 25' } }))), ['nothing', 'typeshapes']);
  assert.deepEqual(ids(findTechniques(cat, ask({ assets: { screen: 'a recording' } }))), ['nothing', 'typeshapes', 'footage']);
  assert.deepEqual(ids(findTechniques(cat, ask({ assets: { footage: 'x' } }))), ['nothing', 'typeshapes', 'footage']);
  assert.deepEqual(ids(findTechniques(cat, ask({ assets: { library: 'agent' } }))), ['nothing', 'typeshapes', 'photo', 'illus']);
  assert.deepEqual(ids(findTechniques(cat, ask({ assets: { photo: 'p' } }))), ['nothing', 'typeshapes', 'photo', 'illus']);
  assert.deepEqual(ids(findTechniques(cat, ask({ assets: 'none' }))), ['nothing', 'typeshapes']);
  assert.equal(findTechniques(cat, ask({})).results.length, 5, 'no assets given: needs are not filtered');
});

test('find: ranks primary before support-only, then proven, then taught_by, then mood, then duration', () => {
  const cat = catalogOf([
    { slug: 'support', status: 'proven', job: 'add-depth', support: ['before-after'], group: 'g', mood: ['calm'] },
    { slug: 'unproven', job: 'before-after' },
    { slug: 'near', status: 'proven', duration: 4 },
    { slug: 'far', status: 'proven', duration: 12 },
    { slug: 'mood', status: 'proven', mood: ['Premium'], duration: 12 },
    { slug: 'taught', status: 'proven', group: 'shared', duration: 12 },
    { slug: 'taught2', job: 'hand-over', group: 'shared' },
  ]);
  const out = findTechniques(cat, ask({ mood: ['premium'], duration: 4.6, constraints: { status: 'any' }, limit: 10 }));
  assert.deepEqual(ids(out), ['taught', 'mood', 'near', 'far', 'unproven', 'support']);
});

test('find: limit defaults to 5', () => {
  const cat = catalogOf(Array.from({ length: 7 }, (_, i) => ({ slug: `r${i}`, status: 'proven' })));
  assert.equal(findTechniques(cat, ask({})).results.length, 5);
  assert.equal(findTechniques(cat, ask({ limit: 2 })).results.length, 2);
});

test('find: each result carries the fields a brief needs and a plain fit line', () => {
  const cat = catalogOf([{ slug: 'a', status: 'proven', needs: ['footage'], mood: ['premium', 'calm'], duration: 3, motion: 'one-shot' }]);
  const [r] = findTechniques(cat, ask({ mood: ['premium'], assets: { footage: 'x' } })).results;
  assert.deepEqual(Object.keys(r).sort(), ['duration', 'fit', 'id', 'line', 'motion', 'name', 'needs', 'revision', 'section', 'status', 'still'].sort());
  assert.equal(r.id, '01-a');
  assert.equal(r.revision, cat.recipes[0].revision);
  assert.equal(r.line, 'Line a.');
  assert.match(r.fit, /primary job before-after/);
  assert.match(r.fit, /needs met: footage/);
  assert.match(r.fit, /mood: premium/);
});

test('find: when status leaves nothing, returns the nearest by job and says status was relaxed', () => {
  const cat = catalogOf([{ slug: 'u' }, { slug: 'other', status: 'proven', job: 'hand-over' }]);
  const out = findTechniques(cat, ask({}));
  assert.deepEqual(ids(out), ['u']);
  assert.deepEqual(out.relaxed, ['status']);
  assert.match(out.results[0].fit, /unproven/);
});

test('find: relaxes needs only after status, and never the job or the exclusions', () => {
  const cat = catalogOf([{ slug: 'foot', needs: ['footage'] }, { slug: 'ex', status: 'proven' }, { slug: 'other', status: 'proven', job: 'hand-over' }]);
  const out = findTechniques(cat, ask({ assets: { type: 'x' }, exclude: ['02-ex'] }));
  assert.deepEqual(ids(out), ['foot']);
  assert.deepEqual(out.relaxed, ['status', 'needs']);
  const none = findTechniques(cat, ask({ job: 'light-the-hero' }));
  assert.deepEqual(none.results, []);
  assert.equal(none.relaxed, undefined);
});

test('find: a full answer carries no relaxed field', () => {
  const cat = catalogOf([{ slug: 'a', status: 'proven' }]);
  assert.equal('relaxed' in findTechniques(cat, ask({})), false);
});

test('find: never returns a variant on its own; its parent carries the variant ids', () => {
  withDir({ 'vidA.md': [recipe(1, 'a', { status: ACCEPTED }), recipe(2, 'v', { status: variantLines('01-a', 'vidA #1', { status: ACCEPTED }) }), recipe(3, 'plain', { status: ACCEPTED })] }, (dir) => {
    const cat = buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({
      'vidA#1': tag('01-a', { duration: 12 }), 'vidA#2': tag('02-v', { variant_of: 'vidA#1', duration: 2 }), 'vidA#3': tag('03-plain', { duration: 2 }),
    }) });
    const out = findTechniques(cat, ask({ duration: 2 }));
    assert.deepEqual(out.results.map((r) => r.id), ['01-a', '03-plain'], 'the parent ranks first: taught twice');
    assert.deepEqual(out.results[0].variants, ['02-v']);
    assert.equal('variants' in out.results[1], false, 'a candidate with no variants carries no variants field');
    assert.match(out.results[0].fit, /taught 2 times/);
    assert.deepEqual(findTechniques(cat, ask({ exclude: ['01-a'] })).results.map((r) => r.id), ['03-plain']);
  });
});

test('find: a variant whose job its parent does not serve is a candidate on its own, naming its parent', () => {
  withDir({ 'vidA.md': [recipe(1, 'a', { status: ACCEPTED }), recipe(2, 'v', { status: variantLines('01-a', 'vidA #1', { status: ACCEPTED }) })] }, (dir) => {
    const cat = buildCatalog({ draftsDir: dir, jobs: JOBS, tags: tagsOf({
      'vidA#1': tag('01-a', { job: 'point-at-detail' }), 'vidA#2': tag('02-v', { variant_of: 'vidA#1' }),
    }) });
    const out = findTechniques(cat, ask({}));
    assert.deepEqual(out.results.map((r) => r.id), ['02-v']);
    assert.equal(out.results[0].variant_of, '01-a');
    assert.match(out.results[0].fit, /variant of 01-a/);
    assert.deepEqual(findTechniques(cat, ask({ job: 'point-at-detail' })).results.map((r) => r.id), ['01-a']);
  });
});

// ---------- CLI ----------

const run = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });

test('cli: build writes the catalog from a jobs file, and find answers from it', () => {
  withDir({ 'vidA.md': [recipe(1, 'a', { status: ACCEPTED })] }, (dir) => {
    const tagsPath = path.join(dir, 'tags.json'), jobsPath = path.join(dir, 'jobs.json'), out = path.join(dir, 'catalog.json');
    fs.writeFileSync(tagsPath, JSON.stringify(tagsOf({ 'vidA#1': tag('01-a') })));
    fs.writeFileSync(jobsPath, JSON.stringify(JOBS));
    const b = run('build', '--drafts', dir, '--tags', tagsPath, '--jobs', jobsPath, '--out', out);
    assert.equal(b.status, 0, b.stderr);
    assert.equal(JSON.parse(fs.readFileSync(out, 'utf8')).recipes[0].id, '01-a');
    const f = run('find', '--catalog', out, '--ask', JSON.stringify(ask({})));
    assert.equal(f.status, 0, f.stderr);
    assert.equal(JSON.parse(f.stdout).results[0].id, '01-a');
  });
});

test('cli: build accepts --jobs-ids until the jobs file lands, taking the vocab from the tags', () => {
  withDir({ 'vidA.md': [recipe(1, 'a')] }, (dir) => {
    const tagsPath = path.join(dir, 'tags.json'), out = path.join(dir, 'catalog.json');
    fs.writeFileSync(tagsPath, JSON.stringify(tagsOf({ 'vidA#1': tag('01-a') })));
    const b = run('build', '--drafts', dir, '--tags', tagsPath, '--jobs-ids', 'before-after,hand-over', '--out', out);
    assert.equal(b.status, 0, b.stderr);
    const cat = JSON.parse(fs.readFileSync(out, 'utf8'));
    assert.equal(cat.vocab, 'jobs-v1');
    assert.deepEqual(cat.jobs, ['before-after', 'hand-over']);
  });
});

test('cli: refusals exit non-zero with the reason and write nothing', () => {
  withDir({ 'vidA.md': [recipe(1, 'a')] }, (dir) => {
    const tagsPath = path.join(dir, 'tags.json'), out = path.join(dir, 'catalog.json');
    fs.writeFileSync(tagsPath, JSON.stringify(tagsOf({ 'vidA#1': tag('01-a', { job: 'nope' }) })));
    const b = run('build', '--drafts', dir, '--tags', tagsPath, '--jobs-ids', 'before-after', '--out', out);
    assert.equal(b.status, 1);
    assert.match(b.stderr, /nope/);
    assert.equal(fs.existsSync(out), false);
    fs.writeFileSync(tagsPath, JSON.stringify(tagsOf({ 'vidA#1': tag('01-a') })));
    run('build', '--drafts', dir, '--tags', tagsPath, '--jobs-ids', 'before-after', '--out', out);
    const f = run('find', '--catalog', out, '--ask', JSON.stringify(ask({ job: 'zzz' })));
    assert.equal(f.status, 1);
    assert.match(f.stderr, /unknown job "zzz".*before-after/);
  });
});

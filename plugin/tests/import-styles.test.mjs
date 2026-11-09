// Tests for the style importer. Run: node --test plugin/tests/import-styles.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { selectStyles, importStyles } from '../scripts/import-styles.mjs';

async function write(root, rel, data) {
  const file = path.join(root, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
}

async function listFiles(root, rel = '') {
  const out = [];
  for (const e of await fs.readdir(path.join(root, rel), { withFileTypes: true })) {
    const child = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await listFiles(root, child)));
    else out.push(child);
  }
  return out.sort();
}

const SOURCE = { name: 'Lemo-Opuscar x', url: 'https://github.com/lemomo-ai/lemo-opuscar', license: 'MIT', lemoSlug: 'x' };

function styleJson(id, extra = {}) {
  return JSON.stringify({
    id, title: `Title ${id}`, tier: 'native', status: 'proven', statusNote: '', skill: id,
    module: `${id}.jsx`, moduleGlobal: 'AESX', summary: `The ${id} look. It has a second sentence.`,
    triggers: [`${id} look`], fonts: [{ family: 'Inter Tight', style: 'Medium', file: 'assets/fonts/InterTight.ttf', license: 'OFL-1.1', licenseFile: 'assets/fonts/OFL-InterTight.txt' }],
    effects: [], prepare: [], source: SOURCE, proof: { date: '2026-10-16' }, ...extra,
  });
}

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'styles-src-'));
  await write(root, 'harness/lib/aes-lib.jsx', 'var AESLib = {};\n');
  await write(root, 'picker/notes.json', JSON.stringify({ 'fixture-native': { goodFor: 'Calm product explainers' } }));

  await write(root, 'fixture-native/style.json', styleJson('fixture-native', { tools: [{ file: 'tools/x.mjs', needs: ['node', 'ffmpeg'] }] }));
  await write(root, 'fixture-native/STYLE.md', '# Fixture\n\nCache: `~/Assets/joeb/styles/fixture-native/` per scene.\n');
  await write(root, 'fixture-native/fixture-native.jsx', 'var AESX = (function () { return {}; })();\n');
  await write(root, 'fixture-native/tools/x.mjs', '// production/styles/fixture-native/tools/x.mjs\n// renders plates with local Blender\n');
  await write(root, 'fixture-native/assets/fonts/InterTight.ttf', 'font');
  await write(root, 'fixture-native/assets/fonts/OFL-InterTight.txt', 'ofl');
  await write(root, 'fixture-native/assets/LICENSE-lemo-opuscar.txt', 'MIT License\n\nCopyright (c) 2026 LemoLab\n');
  await write(root, 'fixture-native/proof/card.json', '{}');

  await write(root, 'fixture-line/style.json', styleJson('fixture-line', { tools: [{ file: 'tools/font.mjs', needs: ['node'] }] }));
  await write(root, 'fixture-line/STYLE.md', '# Line\n');
  await write(root, 'fixture-line/fixture-line.jsx', 'var AESX = {};\n');
  await write(root, 'fixture-line/tools/font.mjs', '// reads assets/fonts/Line.json\n');
  await write(root, 'fixture-line/assets/fonts/Line.json', '{}');
  await write(root, 'fixture-line/assets/fonts/OFL-Line.txt', 'ofl');
  await write(root, 'fixture-line/assets/fonts/Other.ttf', 'font');
  await write(root, 'fixture-line/assets/fonts/OFL-Other.txt', 'ofl');

  await write(root, 'fixture-gen/style.json', styleJson('fixture-gen', { generated: [{ id: 'plate' }] }));
  // Content's real shape: an object naming the provider and the pieces.
  await write(root, 'fixture-genobj/style.json', styleJson('fixture-genobj', { generated: { provider: 'x', objects: [{ id: 'wood' }] } }));
  await write(root, 'study-x/style.json', styleJson('study-x', { status: 'blocked', statusNote: 'study', study: true }));
  await write(root, 'joeb-house/style.json', styleJson('joeb-house'));
  return root;
}

async function runImport(from) {
  const plugin = await fs.mkdtemp(path.join(os.tmpdir(), 'styles-dst-'));
  await write(plugin, 'library/source-map.json', JSON.stringify({ inspected: 'x', purpose: 'p', sources: [] }));
  const to = path.join(plugin, 'library');
  const skillDir = path.join(plugin, 'skills', 'visual-styles');
  const result = await importStyles({ from, to, skillDir, commit: 'abc1234' });
  return { plugin, to, skillDir, result };
}

test('selects only proven styles without generated pieces', async () => {
  const ids = (await selectStyles(await fixture())).map((s) => s.id);
  assert.deepEqual(ids, ['fixture-line', 'fixture-native']);
});

test('copies STYLE.md, module and tools, and nothing else', async () => {
  const { to } = await runImport(await fixture());
  assert.deepEqual(await listFiles(path.join(to, 'styles', 'fixture-native')),
    ['STYLE.md', 'fixture-native.jsx', 'tools/x.mjs']);
});

test('keeps font data a tool reads, with its own OFL text only', async () => {
  const { to } = await runImport(await fixture());
  assert.deepEqual(await listFiles(path.join(to, 'styles', 'fixture-line')),
    ['STYLE.md', 'assets/fonts/Line.json', 'assets/fonts/OFL-Line.txt', 'fixture-line.jsx', 'tools/font.mjs']);
});

test('writes shared files once and skips excluded packages with reasons', async () => {
  const { to, result } = await runImport(await fixture());
  assert.equal(await fs.readFile(path.join(to, 'styles', 'aes-lib.jsx'), 'utf8'), 'var AESLib = {};\n');
  assert.match(await fs.readFile(path.join(to, 'styles', 'LICENSE-lemo-opuscar.txt'), 'utf8'), /LemoLab/);
  assert.deepEqual(result.imported, ['fixture-line', 'fixture-native']);
  const reasons = Object.fromEntries(result.skipped.map((s) => [s.id, s.reason]));
  assert.match(reasons['fixture-gen'], /generated/);
  assert.match(reasons['fixture-genobj'], /generated/);
  assert.match(reasons['study-x'], /study|blocked/);
  assert.match(reasons['joeb-house'], /house/);
});

test('index lists needs, adding blender when a tool calls it', async () => {
  const { to } = await runImport(await fixture());
  const index = JSON.parse(await fs.readFile(path.join(to, 'styles', 'index.json'), 'utf8'));
  assert.deepEqual(index.source, { repo: 'Content', path: 'production/styles', commit: 'abc1234' });
  const native = index.styles.find((s) => s.id === 'fixture-native');
  assert.deepEqual(native.needs, ['blender', 'ffmpeg', 'node']);
  assert.equal(native.goodFor, 'Calm product explainers');
  assert.equal(native.contentStatus, 'proven');
  assert.equal(native.contentProof, '2026-10-16');
  assert.deepEqual(native.fonts, [{ family: 'Inter Tight', style: 'Medium', license: 'OFL-1.1', source: 'Google Fonts' }]);
  const line = index.styles.find((s) => s.id === 'fixture-line');
  assert.deepEqual(line.needs, ['node']);
  assert.equal(line.goodFor, 'The fixture-line look.');
});

test('rewrites Content package paths and reports the rest', async () => {
  const { to, result } = await runImport(await fixture());
  const tool = await fs.readFile(path.join(to, 'styles', 'fixture-native', 'tools', 'x.mjs'), 'utf8');
  assert.match(tool, /^\/\/ library\/styles\/fixture-native\/tools\/x\.mjs$/m);
  assert.ok(result.adaptations.some((a) => a.file === 'styles/fixture-native/STYLE.md' && a.line === 3 && a.text.includes('~/Assets')));
});

test('records provenance for every imported file', async () => {
  const { to } = await runImport(await fixture());
  const map = JSON.parse(await fs.readFile(path.join(to, 'source-map.json'), 'utf8'));
  const paths = map.sources.map((s) => s.path);
  assert.ok(paths.includes('production/styles/fixture-native/STYLE.md'));
  assert.ok(paths.includes('production/styles/fixture-native/tools/x.mjs'));
  assert.ok(map.sources.filter((s) => s.id.startsWith('historical-')).every((s) => /^[0-9a-f]{64}$/.test(s.sha256)));
});

test('keeps provenance entries it did not create', async () => {
  const from = await fixture();
  const plugin = await fs.mkdtemp(path.join(os.tmpdir(), 'styles-dst-'));
  const handWritten = { id: 'content-fixture-native-2026-10-17', path: 'production/styles/fixture-native/STYLE.md', sourceRevision: 'x' };
  await write(plugin, 'library/source-map.json', JSON.stringify({ sources: [handWritten] }));
  const args = { from, to: path.join(plugin, 'library'), skillDir: path.join(plugin, 'skills', 'visual-styles'), commit: 'abc1234' };
  await importStyles(args);
  await importStyles(args);
  const map = JSON.parse(await fs.readFile(path.join(plugin, 'library', 'source-map.json'), 'utf8'));
  assert.deepEqual(map.sources.filter((s) => s.id === handWritten.id), [handWritten]);
});

test('records the import as one module-level provenance entry', async () => {
  const from = await fixture();
  const { plugin, to, skillDir } = await runImport(from);
  await importStyles({ from, to, skillDir, commit: 'def5678' });
  const map = JSON.parse(await fs.readFile(path.join(plugin, 'library', 'source-map.json'), 'utf8'));
  const entries = map.sources.filter((s) => s.id === 'content-style-library');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].sourceRevision, 'def5678');
  assert.equal(entries[0].path, 'production/styles');
  assert.deepEqual(entries[0].styles, ['fixture-line', 'fixture-native']);
  assert.match(entries[0].attribution, /LemoLab/);
});

test('re-import replaces earlier imports without duplicating provenance', async () => {
  const from = await fixture();
  const { plugin, to, skillDir } = await runImport(from);
  await fs.writeFile(path.join(to, 'styles', 'fixture-native', 'stale.md'), 'old');
  await importStyles({ from, to, skillDir, commit: 'abc1234' });
  await assert.rejects(fs.access(path.join(to, 'styles', 'fixture-native', 'stale.md')));
  const map = JSON.parse(await fs.readFile(path.join(plugin, 'library', 'source-map.json'), 'utf8'));
  const count = map.sources.filter((s) => s.path === 'production/styles/fixture-native/STYLE.md').length;
  assert.equal(count, 1);
});

test('refuses a private home path', async () => {
  const from = await fixture();
  await write(from, 'fixture-native/fixture-native.jsx', 'var p = "/Users/someone/x";\n');
  await assert.rejects(runImport(from), /fixture-native\.jsx/);
});

test('generated skill warns that buildScene carries the test scene\'s own lines and pacing', async () => {
  const { skillDir } = await runImport(await fixture());
  const skill = await fs.readFile(path.join(skillDir, 'SKILL.md'), 'utf8');
  assert.match(skill, /captions and labels are the test scene's own lines/);
  assert.match(skill, /about ten seconds/);
});

test('generated skill names every style and fits the limit', async () => {
  const { skillDir } = await runImport(await fixture());
  const skill = await fs.readFile(path.join(skillDir, 'SKILL.md'), 'utf8');
  const front = skill.match(/^---\nname: visual-styles\ndescription: (.+)\n---\n/);
  assert.ok(front, 'frontmatter with name and one-line description');
  assert.ok(front[1].length <= 1024, `description is ${front[1].length} characters`);
  for (const title of ['Title fixture-native', 'Title fixture-line']) assert.ok(front[1].includes(title));
  assert.match(skill, /\| Title fixture-native \| `fixture-native` \| native \| Calm product explainers \|/);
});

test('adaptation rules rewrite proof notes, upstream clone paths and caches', async () => {
  const from = await fixture();
  await write(from, 'fixture-proof/style.json', styleJson('fixture-proof'));
  await write(from, 'fixture-proof/STYLE.md', [
    '# Proof',
    'The proof is the shared test scene, built by `buildScene` and proven with `node production/styles/harness/prove.mjs fixture-proof`, which rebuilds it.',
    'Adapted from Lemo-Opuscar (MIT, LemoLab), cloned at `~/Assets/lemo-opuscar/styles/fixture-proof/`.',
    '- Cache: `~/Assets/joeb/styles/fixture-proof/` (`plate/`), per scene for reel renders.',
    '',
  ].join('\n'));
  await write(from, 'fixture-proof/fixture-proof.jsx', '// buildScene: the shared test scene (production/styles/scene) as x.\n');
  const { to, result } = await runImport(from);
  const md = await fs.readFile(path.join(to, 'styles/fixture-proof/STYLE.md'), 'utf8');
  assert.equal(md.split('\n')[1], "Before import, the shared test scene was built by `buildScene` from a blank project and rendered in the author's proof setup, then compared with Lemo-Opuscar's fixture-proof reference. In this plugin, render frames of your own build and check them against this file.");
  assert.equal(md.split('\n')[2], 'Adapted from Lemo-Opuscar (MIT, LemoLab), at `https://github.com/lemomo-ai/lemo-opuscar/tree/main/styles/fixture-proof/`.');
  assert.equal(md.split('\n')[3], '- Cache: the folder you pass as `--cache` (`plate/`).');
  const jsx = await fs.readFile(path.join(to, 'styles/fixture-proof/fixture-proof.jsx'), 'utf8');
  assert.equal(jsx, "// buildScene: the shared test scene (the library's seven-beat test scene) as x.\n");
  assert.deepEqual(result.adaptations.filter((a) => a.file.startsWith('styles/fixture-proof/')), []);
});

// ---- The real imported library -------------------------------------------------

const LIBRARY = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'library');

test('every index entry has its files and every folder has an entry', async () => {
  const index = JSON.parse(await fs.readFile(path.join(LIBRARY, 'styles/index.json'), 'utf8'));
  const ids = index.styles.map((s) => s.id).sort();
  assert.equal(ids.length, 30);
  for (const s of index.styles) {
    await fs.access(path.join(LIBRARY, 'styles', s.id, 'STYLE.md'));
    await fs.access(path.join(LIBRARY, 'styles', s.id, s.module));
    for (const tool of s.tools) await fs.access(path.join(LIBRARY, 'styles', s.id, tool));
  }
  const folders = (await fs.readdir(path.join(LIBRARY, 'styles'), { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  assert.deepEqual(folders, ids);
});

test('no shipped style file names a Content-only location', async () => {
  const offenders = [];
  for (const rel of await listFiles(path.join(LIBRARY, 'styles'))) {
    let text = await fs.readFile(path.join(LIBRARY, 'styles', rel), 'utf8');
    // The index's source block is provenance, which may name Content paths.
    if (rel === 'index.json') text = JSON.stringify({ ...JSON.parse(text), source: undefined }, null, 2);
    text.split('\n').forEach((line, i) => {
      if (/~\/Assets|prove\.mjs|go\.sh|production\/styles|Higgsfield/.test(line)) offenders.push(`${rel}:${i + 1}`);
    });
  }
  assert.deepEqual(offenders, []);
});

// ---- Second review --------------------------------------------------------------

import { spawnSync } from 'node:child_process';

test('3D tools stop on a missing Blender, not on a font file that is not shipped', async () => {
  const scene = await fs.mkdtemp(path.join(os.tmpdir(), 'scene-'));
  await write(scene, 'scene.json', JSON.stringify({ id: 't', width: 1080, height: 1920, fps: 30, duration: 1, words: 'words.json', beats: [] }));
  await write(scene, 'words.json', '[]');
  const runs = [
    ['lowpoly-island/tools/plate.mjs', ['--scene', scene, '--cache', await fs.mkdtemp(path.join(os.tmpdir(), 'c-'))]],
    ['tilt-shift/tools/plate.mjs', ['--scene', scene, '--cache', await fs.mkdtemp(path.join(os.tmpdir(), 'c-'))]],
    ['backrooms/tools/plates.mjs', ['--scene', scene, '--cache', await fs.mkdtemp(path.join(os.tmpdir(), 'c-')), '--out', path.join(os.tmpdir(), 'p.json')]],
  ];
  for (const [tool, args] of runs) {
    const r = spawnSync(process.execPath, [path.join(LIBRARY, 'styles', tool), ...args], { encoding: 'utf8', env: { ...process.env, BLENDER: '/nonexistent/Blender', FONT_PATH: '' } });
    const out = r.stdout + r.stderr;
    assert.notEqual(r.status, 0, `${tool} should fail without Blender`);
    assert.doesNotMatch(out, /\.ttf|assets\/fonts/, `${tool} failed on a font: ${out.slice(0, 300)}`);
    assert.match(out, /Blender|ENOENT.*nonexistent/i, `${tool}: ${out.slice(0, 300)}`);
  }
});

test('no shipped style file points at font files that are not shipped', async () => {
  const offenders = [];
  for (const rel of await listFiles(path.join(LIBRARY, 'styles'))) {
    if (rel.startsWith('whiteboard/assets/fonts/')) continue;
    const text = await fs.readFile(path.join(LIBRARY, 'styles', rel), 'utf8');
    text.split('\n').forEach((line, i) => {
      if (/assets\/fonts\/(?!EMSTech|OFL-EMSTech)/.test(line)) offenders.push(`${rel}:${i + 1}`);
    });
  }
  assert.deepEqual(offenders, []);
});

test('nothing users see names Content, its harness or its owner', async () => {
  const CONTENT = /~\/Assets|production\/|harness|prove\.mjs|\bprov(e|es|ing)\b|go\.sh|Higgsfield|\bJoe\b|joeb|Runpod|assets\/LICENSE-lemo-opuscar/i;
  const offenders = [];
  const scan = (label, text) => text.split('\n').forEach((line, i) => { if (CONTENT.test(line)) offenders.push(`${label}:${i + 1}: ${line.trim().slice(0, 80)}`); });
  for (const rel of await listFiles(path.join(LIBRARY, 'styles'))) {
    if (rel === 'paper-collage.md') continue; // the plugin's own document, not imported from Content
    let text = await fs.readFile(path.join(LIBRARY, 'styles', rel), 'utf8');
    if (rel === 'index.json') text = JSON.stringify({ ...JSON.parse(text), source: undefined }, null, 2);
    scan(rel, text);
  }
  scan('SKILL.md', await fs.readFile(path.join(LIBRARY, '..', 'skills', 'visual-styles', 'SKILL.md'), 'utf8'));
  assert.deepEqual(offenders, []);
});

test('picker triggers name no brand or franchise', async () => {
  const index = JSON.parse(await fs.readFile(path.join(LIBRARY, 'styles/index.json'), 'utf8'));
  const triggers = index.styles.flatMap((s) => s.triggers);
  for (const banned of [/la linea/i, /rsa animate/i, /gatsby/i, /apple/i]) {
    assert.deepEqual(triggers.filter((t) => banned.test(t)), [], `trigger matches ${banned}`);
  }
  assert.deepEqual(index.styles.filter((s) => /apple/i.test(s.goodFor + s.summary)).map((s) => s.id), []);
});

test('the skill lists every style, paper collage included, with its fonts', async () => {
  const skill = await fs.readFile(path.join(LIBRARY, '..', 'skills', 'visual-styles', 'SKILL.md'), 'utf8');
  assert.match(skill, /\| Style \| id \| Tier \| Good for \| Fonts \| Needs \|/);
  assert.match(skill, /paper-collage/);
  assert.match(skill, /\| Woodcut print \| `woodcut` \| print \| [^|]+ \| IM FELL/);
});

test('plugin-side proof survives a re-import', async () => {
  const from = await fixture();
  const { to, skillDir } = await runImport(from);
  const indexPath = path.join(to, 'styles', 'index.json');
  const index = JSON.parse(await fs.readFile(indexPath, 'utf8'));
  assert.ok(index.styles.every((s) => s.pluginProof === null));
  index.styles.find((s) => s.id === 'fixture-native').pluginProof = { date: '2026-11-09', report: 'quality/reports/x/report.md' };
  await fs.writeFile(indexPath, JSON.stringify(index));
  await importStyles({ from, to, skillDir, commit: 'abc1234' });
  const again = JSON.parse(await fs.readFile(indexPath, 'utf8'));
  assert.deepEqual(again.styles.find((s) => s.id === 'fixture-native').pluginProof, { date: '2026-11-09', report: 'quality/reports/x/report.md' });
  assert.equal(again.styles.find((s) => s.id === 'fixture-line').pluginProof, null);
});

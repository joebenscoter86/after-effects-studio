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
  assert.deepEqual(native.fonts, [{ family: 'Inter Tight', style: 'Medium', license: 'OFL-1.1' }]);
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
  assert.ok(map.sources.every((s) => /^[0-9a-f]{64}$/.test(s.sha256)));
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

test('generated skill names every style and fits the limit', async () => {
  const { skillDir } = await runImport(await fixture());
  const skill = await fs.readFile(path.join(skillDir, 'SKILL.md'), 'utf8');
  const front = skill.match(/^---\nname: visual-styles\ndescription: (.+)\n---\n/);
  assert.ok(front, 'frontmatter with name and one-line description');
  assert.ok(front[1].length <= 1024, `description is ${front[1].length} characters`);
  for (const title of ['Title fixture-native', 'Title fixture-line']) assert.ok(front[1].includes(title));
  assert.match(skill, /\| Title fixture-native \| `fixture-native` \| native \| Calm product explainers \|/);
});

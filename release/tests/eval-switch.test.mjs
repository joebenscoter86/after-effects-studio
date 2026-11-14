// The command that runs eval cases against the package and against a copy with one stage switched off: every switch
// applies cleanly to a copy, leaves its library readable and true to its hashes, takes away what it names and nothing
// the plain copy has; a category switch is honoured by the copy's own server; both arms' suites are written; and the
// two scores are read and set side by side. Nothing here starts a session or reaches After Effects.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { SWITCHES, PACKAGE, allCategories, applySwitch, cutPassage, prepareArms, rehashLibrary, sideBySide, summarize } from '../eval-switch.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CANON = JSON.parse(await fs.readFile(path.join(ROOT, 'plugin', 'evals', 'evals.json'), 'utf8'));
const { readLibrary } = await import(pathToFileURL(path.join(ROOT, 'plugin', 'runtime', 'dist', 'tools', 'library.js')).href);
const tmp = (prefix) => fs.mkdtemp(path.join(os.tmpdir(), prefix));
const sha = (t) => createHash('sha256').update(t).digest('hex');

async function freshCopy() {
  const copy = path.join(await tmp('switch-'), 'copy');
  await fs.cp(PACKAGE, copy, { recursive: true });
  return copy;
}

/** Every manifest entry's file is there and matches its hash, and the library lists and reads through the runtime. */
async function libraryHolds(copy) {
  const lib = path.join(copy, 'library');
  const manifest = JSON.parse(await fs.readFile(path.join(lib, 'manifest.json'), 'utf8'));
  for (const e of manifest.documents) assert.equal(sha(await fs.readFile(path.join(lib, e.path), 'utf8')), e.sha256, e.path);
  const index = readLibrary(undefined, undefined, lib);
  assert.ok(index, 'the library lists');
  for (const e of manifest.documents) readLibrary(e.id, undefined, lib);
  return manifest.documents.map((e) => e.id);
}

test('each switch names its cases, and every case it names exists', () => {
  for (const [name, sw] of Object.entries(SWITCHES)) {
    assert.ok(sw.what && sw.cases.length, name);
    for (const id of sw.cases) assert.ok(CANON.evals.some((c) => c.id === id), `${name}: case ${id}`);
  }
  assert.deepEqual(Object.keys(SWITCHES), ['stage-1', 'stage-6', 'stage-12', 'stage-11', 'stage-9', 'stage-13', 'stage-14']);
});

test('every switch applies to a copy and leaves its library whole; the text it cuts is gone', async () => {
  const plainIds = await libraryHolds(PACKAGE);
  for (const [name, sw] of Object.entries(SWITCHES)) {
    const copy = await freshCopy();
    const { done } = await applySwitch(copy, name);
    assert.ok(done.length, name);
    const ids = await libraryHolds(copy);
    for (const rel of sw.remove ?? []) assert.ok(!existsSync(path.join(copy, rel)), `${name}: ${rel} removed`);
    for (const c of sw.cut ?? []) {
      const text = await fs.readFile(path.join(copy, c.file), 'utf8');
      assert.ok(!text.includes(c.from), `${name}: ${c.from.slice(0, 40)} cut from ${c.file}`);
      if (c.to && c.to !== '\n' && c.keepTo !== false) assert.ok(text.includes(c.to), `${name}: ${c.to.slice(0, 40)} kept in ${c.file}`);
    }
    if (sw.remove) assert.ok(ids.length < plainIds.length, `${name}: its documents left the manifest`);
    else assert.deepEqual(ids, plainIds, `${name}: no document lost`);
  }
});

test('the text switches take away what the stage gave the builder and keep what came before it', async () => {
  const read = async (copy, f) => fs.readFile(path.join(copy, f), 'utf8');
  const c12 = await freshCopy(); await applySwitch(c12, 'stage-12');
  // what case 23 rests on: the notice, the seven steps, the check and the file path
  for (const f of ['library/references/keying.md', 'skills/motion-studio/SKILL.md']) {
    assert.doesNotMatch(await read(c12, f), /Tell the user first|One step here needs you in After Effects|Object Matte Tool|subject\.(?:prepare|check|render_cutout)/, f);
  }
  assert.match(await read(c12, 'library/references/keying.md'), /### Keylight alone/);
  assert.match(await read(c12, 'library/references/keying.md'), /The method is: measure, change one thing, measure again\./);
  const c9 = await freshCopy(); await applySwitch(c9, 'stage-9');
  for (const f of ['library/references/quality.md', 'skills/motion-studio/SKILL.md']) assert.doesNotMatch(await read(c9, f), /project\.lint|render\.deliver|master-alpha/, f);
  assert.match(await read(c9, 'skills/motion-studio/SKILL.md'), /Deliver editable project\/assets/);
  const c13 = await freshCopy(); await applySwitch(c13, 'stage-13');
  assert.doesNotMatch(await read(c13, 'skills/motion-studio/SKILL.md'), /reference-teardown|video\.track/);
  const c14 = await freshCopy(); await applySwitch(c14, 'stage-14');
  const vs = await read(c14, 'skills/visual-styles/SKILL.md');
  assert.doesNotMatch(vs, /Pixel headline|pixel-headline/);
  assert.match(vs, /Pictogram motion, Risograph print,/);
  assert.match(vs, /\(MIT, LemoLab\)\. In `style-index`/);
  assert.ok(!JSON.parse(await read(c14, 'library/styles/index.json')).styles.some((s) => s.id === 'pixel-headline'));
  const c11 = await freshCopy(); await applySwitch(c11, 'stage-11');
  assert.doesNotMatch(await read(c11, 'skills/motion-studio/SKILL.md'), /reference\.sheet/);
  assert.doesNotMatch(await read(c11, 'library/language/reference-study.md'), /reference\.sheet/);
});

test('cutPassage cuts between its markers and refuses a marker that is not there', () => {
  assert.equal(cutPassage('a [b] c', { from: '[b]', to: ' c' }), 'a  c');
  assert.equal(cutPassage('row 1\nrow 2\nrow 3\n', { from: 'row 2', to: '\n', keepTo: false }), 'row 1\nrow 3\n');
  assert.throws(() => cutPassage('abc', { from: 'x', to: 'c' }, 'here'), /here: no "x" to cut from/);
  assert.throws(() => cutPassage('abc', { from: 'a', to: 'x' }, 'here'), /here: no "x" after "a"/);
});

test('a category switch allows every other category, eval.run\'s included, in the copy\'s start.mjs alone', async () => {
  const all = await allCategories();
  assert.ok(all.includes('eval') && all.includes('motion') && all.includes('sound'));
  const copy = await freshCopy();
  await applySwitch(copy, 'stage-6');
  const start = await fs.readFile(path.join(copy, 'start.mjs'), 'utf8');
  const allowed = start.match(/AE_MCP_ALLOW_CATEGORIES = "([^"]+)"/)[1].split(',');
  assert.deepEqual(allowed, all.filter((c) => c !== 'motion' && c !== 'sound'));
  assert.equal(await fs.readFile(path.join(PACKAGE, 'start.mjs'), 'utf8'), (await fs.readFile(path.join(PACKAGE, 'start.mjs'), 'utf8')));
  assert.doesNotMatch(await fs.readFile(path.join(PACKAGE, 'start.mjs'), 'utf8'), /ALLOW_CATEGORIES/);
});

/** One tool call on a package copy's own MCP server (stdio), offline: the result's text. */
function callServer(copy, tool, args) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.AE_MCP_EXE; delete env.AE_MCP_RUNTIME_DIR; delete env.AE_MCP_ALLOW_CATEGORIES;
    const child = spawn(process.execPath, [path.join(copy, 'start.mjs')], { stdio: ['pipe', 'pipe', 'ignore'], env });
    let buf = '';
    const send = (m) => child.stdin.write(`${JSON.stringify(m)}\n`);
    const timer = setTimeout(() => { child.kill(); reject(new Error('the server did not answer')); }, 20_000);
    child.stdout.on('data', (d) => {
      buf += d;
      for (let i; (i = buf.indexOf('\n')) >= 0;) {
        const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1);
        if (m.id === 1) { send({ jsonrpc: '2.0', method: 'notifications/initialized' }); send({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: tool, arguments: args } }); }
        if (m.id === 2) { clearTimeout(timer); child.kill(); resolve(m.result?.content?.map((c) => c.text).join('\n') ?? JSON.stringify(m.error)); }
      }
    });
    send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'eval-switch-test', version: '0' } } });
  });
}

test('the switched copy\'s own server refuses the switched-off operations, and the plain copy\'s does not', async () => {
  const off = await freshCopy();
  await applySwitch(off, 'stage-6');
  assert.match(await callServer(off, 'ae_do', { operation: 'sound.sync', args: { comp: 'x' } }), /FORBIDDEN.*operation category 'sound' is not in AE_MCP_ALLOW_CATEGORIES/s);
  assert.match(await callServer(off, 'ae_catalog', { category: 'motion' }), /FORBIDDEN.*category 'motion' exists but every operation in it is blocked/s);
  const plain = await callServer(PACKAGE, 'ae_catalog', { category: 'sound' });
  assert.doesNotMatch(plain, /FORBIDDEN/);
  assert.match(plain, /sound\.sync/);
});

test('both arms are written with the same suite; mixed or unknown cases are refused', async () => {
  const out = path.join(await tmp('arms-'), 'arms');
  const arms = await prepareArms(out, 'stage-12');
  assert.deepEqual(arms.map((a) => a.arm), ['plain', 'off-stage-12']);
  for (const a of arms) {
    assert.equal(a.set, 'planning');
    assert.deepEqual(a.cases.map((c) => c.id), [23]);
    const graders = (dir) => fs.readdir(path.join(dir, 'evals', a.cases[0].name, 'graders'));
    assert.deepEqual(await graders(a.copy), await graders(arms[0].copy));
  }
  assert.ok((await fs.readdir(path.join(arms[0].copy, 'evals', arms[0].cases[0].name, 'graders'))).includes('answer-subject-steps.md'));
  const pic = await prepareArms(path.join(await tmp('arms-'), 'arms'), 'stage-1');
  assert.equal(pic[0].set, 'picture');
  assert.deepEqual(pic[1].withhold, ['ae_check_comp']);
  await assert.rejects(prepareArms(path.join(await tmp('arms-'), 'arms'), 'stage-1', { cases: [21, 23] }), /different grants/);
  await assert.rejects(prepareArms(path.join(await tmp('arms-'), 'arms'), 'stage-1', { cases: [99] }), /no case 99/);
  await assert.rejects(prepareArms(out, 'stage-12'), /not empty/);
  await assert.rejects(prepareArms(path.join(await tmp('arms-'), 'arms'), 'stage-2'), /no switch stage-2/);
});

// The shape `claude plugin eval --json` writes (seen on a real run that failed to log in): cases, their graders with
// types, and per-run grader verdicts under arms.with.
const resultOf = (passes) => ({
  cases: [{
    name: '23-i-have-a-30-second-vertical',
    graders: [{ name: 'assertion-1', type: 'llm' }, { name: 'answer-subject-steps', type: 'regex' }, { name: 'plugin-skill', type: 'tool_used' }],
    arms: { with: passes.map((p, i) => ({ score: p.score, turns: 9 + i, durationSeconds: 60, costUsd: 0.3, judgeCostUsd: 0.01,
      graders: [{ name: 'assertion-1', passed: p.llm, scored: true }, { name: 'answer-subject-steps', passed: p.regex, scored: true }, { name: 'plugin-skill', passed: true, scored: true }] })) },
    aggregates: { score: passes.reduce((s, p) => s + p.score, 0) / passes.length },
  }],
});

test('the scores are read in two parts, the checks without a model first, and set side by side', () => {
  const plain = summarize(resultOf([{ score: 1, llm: true, regex: true }, { score: 2 / 3, llm: false, regex: true }]));
  const off = summarize(resultOf([{ score: 1 / 3, llm: false, regex: false }, { score: 1 / 3, llm: true, regex: false }]));
  assert.deepEqual(plain[0].checks, { pass: 4, all: 4 });
  assert.deepEqual(plain[0].judged, { pass: 1, all: 2 });
  assert.deepEqual(off[0].checks, { pass: 2, all: 4 });
  assert.equal(plain[0].runs, 2);
  assert.ok(Math.abs(plain[0].costUsd - 0.62) < 1e-9);
  const table = sideBySide(plain, off, 'stage-12');
  assert.match(table, /^\| Case \| checks, plain \| checks, stage-12 off \|/);
  assert.match(table, /\| 23-i-have-a-30-second-vertical \| 4\/4 \| 2\/4 \| 1\/2 \| 1\/2 \| 0\.83 \| 0\.33 \|/);
});

test('the library manifest is re-hashed after a cut and drops entries for removed files', async () => {
  const copy = await freshCopy();
  const doc = path.join(copy, 'library', 'references', 'quality.md');
  await fs.appendFile(doc, '\nAn extra line.\n');
  await fs.rm(path.join(copy, 'library', 'techniques', 'reference-teardown.md'));
  const { dropped } = await rehashLibrary(copy);
  assert.equal(dropped, 1);
  await libraryHolds(copy);
});

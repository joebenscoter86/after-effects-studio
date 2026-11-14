#!/usr/bin/env node
// One command for "does this stage move the score": a chosen set of eval cases run against a copy of the Claude
// package as built, and against a copy with one stage switched off, the two scores printed side by side.
//
//   node release/eval-switch.mjs --off <stage> [--cases 21,26] [--runs N] [--out <dir>] [--max-cost-usd 20] [--write-only]
//
// A stage is switched off in its copy only, three ways, and nothing in the repository changes:
//   grant: a plugin tool left out of --allow-tools (stage 1's ae_check_comp);
//   category: the copy's start.mjs allows every operation category but the stage's (AE_MCP_ALLOW_CATEGORIES, the
//     runtime's own policy filter: the catalog stops listing them and ae_do refuses them);
//   text: the stage's own files deleted, or its passages cut between exact markers, and the copy's library manifest
//     re-hashed so the rest reads as before.
// Stages 7 and 9's operations sit in the project and render categories, which every case needs, so neither can be
// switched off by category; stage 9's guidance can be, by text. Stages 5 and 5b live inside subject.soften_edge.
//
// Each arm is one `claude plugin eval` run (one run per case unless --runs; no no-plugin arm; the report kept local;
// picture cases one at a time). The scores are read in two parts: the checks that need no model (regex, tool use,
// files) first, the judged score beside them. --write-only writes both copies and their suites and prints the two
// commands without starting a session.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { evalArgs, evalCommand, writeEvalSuite } from './claude-evals.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PACKAGE = path.join(ROOT, 'claude', 'comp-room');
const DIST = path.join(ROOT, 'plugin', 'runtime', 'dist');

const SKILL = 'skills/motion-studio/SKILL.md';
export const SWITCHES = {
  'stage-1': {
    what: 'the whole-piece check: ae_check_comp withheld from the grant',
    withhold: ['ae_check_comp'],
    cases: [21],
  },
  'stage-6': {
    what: 'reading motion and sound: the motion and sound operation categories off (motion.curve, sound.markers, sound.sync, and stage 13\'s motion.compare_moves with them)',
    categoriesOff: ['motion', 'sound'],
    cases: [26],
  },
  'stage-12': {
    what: 'the one-click cut-out: the subject operations off, keying\'s Object Matte section and the skill\'s cut-out section cut',
    categoriesOff: ['subject'],
    // (passing mentions in other documents, such as unattended-runs and word-timing, stay: the guidance goes)
    cut: [
      { file: 'library/references/keying.md', from: ' For cutting a person or object out of footage with or without a green screen, see', to: ' The method is:' },
      { file: 'library/references/keying.md', from: '- `subject.prepare`, `subject.status` and `subject.settings` cut a subject out', to: '\n', keepTo: false },
      { file: 'library/references/keying.md', from: '## Cutting a subject out with Object Matte', to: '### Keylight alone' },
      { file: SKILL, from: '## Cutting a subject out of footage: one click by the user', to: "## The user's own look" },
    ],
    cases: [23],
  },
  'stage-11': {
    what: 'the user\'s own look: the look-sheet sections of reference-study and of the skill cut',
    cut: [
      { file: 'library/language/reference-study.md', from: "## The user's own look: a look sheet", to: '## Rebuild a bounded study' },
      { file: SKILL, from: "## The user's own look", to: "## A reference's motion" },
    ],
    cases: [25],
  },
  'stage-9': {
    what: 'hand-over and delivery guidance: quality\'s delivery and lint passages and the skill\'s sentence on them cut (the operations stay: they share the project and render categories)',
    cut: [
      { file: 'library/references/quality.md', from: '**Deliver with a preset and check the file.**', to: '## Colour-managed and 32 bpc projects' },
      { file: 'library/references/quality.md', from: '**Lint the project before handing it over.**', to: 'Report what changed, the project and render paths' },
      { file: SKILL, from: 'Before handing over, run `project.lint`', to: 'Deliver editable project/assets' },
    ],
    cases: [28],
  },
  'stage-13': {
    what: 'tearing down a reference: the video operations off, the reference-teardown technique removed and the skill\'s section cut',
    categoriesOff: ['video'],
    remove: ['library/techniques/reference-teardown.md'],
    cut: [{ file: SKILL, from: "## A reference's motion", to: '## Long or unattended runs' }],
    cases: [29],
  },
  'stage-14': {
    what: 'the pixel headline style: its folder removed, its entry dropped from the style index, and the visual-styles skill\'s lines on it cut',
    remove: ['library/styles/pixel-headline'],
    dropJson: [{ file: 'library/styles/index.json', key: 'styles', id: 'pixel-headline' }],
    cut: [
      { file: 'skills/visual-styles/SKILL.md', from: ' Pixel headline,', to: ' Risograph print,' },
      { file: 'skills/visual-styles/SKILL.md', from: ', except Pixel headline: it is the plugin\'s own, written from its own measurements (`origin` is `plugin` in `style-index`, and `proofNote` says how far it is tested)', to: '. In `style-index`' },
      { file: 'skills/visual-styles/SKILL.md', from: "Pixel headline is the plugin's own style; read its STYLE.md for what was measured and how far it is tested.", to: '\n', keepTo: false },
      { file: 'skills/visual-styles/SKILL.md', from: '| Pixel headline | `pixel-headline` |', to: '\n', keepTo: false },
    ],
    cases: [30],
  },
};

/** Every operation category the runtime registers, eval included (it loads on its own). */
export async function allCategories(dist = DIST) {
  await import(pathToFileURL(path.join(dist, 'operations', 'index.js')).href);
  await import(pathToFileURL(path.join(dist, 'operations', 'eval.js')).href);
  const { listCategories } = await import(pathToFileURL(path.join(dist, 'registry.js')).href);
  return listCategories();
}

/** Cut `text` from `from` up to `to` (kept), or through `to` when keepTo is false; '' runs to the end. Throws when a marker is missing. */
export function cutPassage(text, { from, to, keepTo = true }, label = '') {
  const a = text.indexOf(from);
  if (a < 0) throw new Error(`${label}: no ${JSON.stringify(from.slice(0, 60))} to cut from`);
  if (to === '') return text.slice(0, a);
  const b = text.indexOf(to, a + from.length);
  if (b < 0) throw new Error(`${label}: no ${JSON.stringify(to.slice(0, 60))} after ${JSON.stringify(from.slice(0, 60))}`);
  return text.slice(0, a) + text.slice(keepTo ? b : b + to.length);
}

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

/** The copy's library manifest made true again: entries for removed files dropped, every other file re-hashed. */
export async function rehashLibrary(copy) {
  const lib = path.join(copy, 'library');
  const file = path.join(lib, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(file, 'utf8'));
  const kept = [];
  for (const e of manifest.documents) {
    const p = path.join(lib, e.path);
    if (!existsSync(p)) continue;
    kept.push({ ...e, sha256: sha256(await fs.readFile(p, 'utf8')) });
  }
  const dropped = manifest.documents.length - kept.length;
  await fs.writeFile(file, `${JSON.stringify({ ...manifest, documents: kept }, null, 2)}\n`);
  return { dropped };
}

const START_LINE = "process.env.AE_MCP_ENABLE_EVAL ??= '1';";

/** Switch a stage off in a package copy. Returns the tools to withhold from the grant and what was done. */
export async function applySwitch(copy, name) {
  const sw = SWITCHES[name];
  if (!sw) throw new Error(`no switch ${name}; known: ${Object.keys(SWITCHES).join(', ')}`);
  const done = [];
  for (const rel of sw.remove ?? []) {
    if (!existsSync(path.join(copy, rel))) throw new Error(`${name}: ${rel} is not in the package`);
    await fs.rm(path.join(copy, rel), { recursive: true });
    done.push(`removed ${rel}`);
  }
  for (const c of sw.cut ?? []) {
    const p = path.join(copy, c.file);
    const before = await fs.readFile(p, 'utf8');
    const after = cutPassage(before, c, `${name} ${c.file}`);
    await fs.writeFile(p, after);
    done.push(`cut ${before.length - after.length} characters from ${c.file}`);
  }
  for (const j of sw.dropJson ?? []) {
    const p = path.join(copy, j.file);
    const d = JSON.parse(await fs.readFile(p, 'utf8'));
    const n = d[j.key].length;
    d[j.key] = d[j.key].filter((e) => e.id !== j.id);
    if (d[j.key].length !== n - 1) throw new Error(`${name}: ${j.file} has no ${j.key} entry ${j.id}`);
    await fs.writeFile(p, `${JSON.stringify(d, null, 2)}\n`);
    done.push(`dropped ${j.id} from ${j.file}`);
  }
  if (sw.categoriesOff?.length) {
    const all = await allCategories();
    for (const c of sw.categoriesOff) if (!all.includes(c)) throw new Error(`${name}: no operation category ${c}`);
    const allowed = all.filter((c) => !sw.categoriesOff.includes(c));
    const p = path.join(copy, 'start.mjs');
    const start = await fs.readFile(p, 'utf8');
    if (!start.includes(START_LINE)) throw new Error(`${name}: start.mjs has changed; the category switch looks for ${START_LINE}`);
    await fs.writeFile(p, start.replace(START_LINE, `${START_LINE}\n// Switched off for an eval comparison: ${sw.categoriesOff.join(', ')}.\nprocess.env.AE_MCP_ALLOW_CATEGORIES = ${JSON.stringify(allowed.join(','))};`));
    done.push(`categories off: ${sw.categoriesOff.join(', ')}`);
  }
  if (sw.remove || sw.cut || sw.dropJson) {
    const { dropped } = await rehashLibrary(copy);
    done.push(`library manifest re-hashed${dropped ? `, ${dropped} entries dropped` : ''}`);
  }
  if (sw.withhold?.length) done.push(`withheld from the grant: ${sw.withhold.join(', ')}`);
  return { withhold: sw.withhold ?? [], done };
}

/** Write the plain and switched copies and their suites under `out`. */
export async function prepareArms(out, name, { cases: ids, env = process.env } = {}) {
  const sw = SWITCHES[name];
  if (!sw) throw new Error(`no switch ${name}; known: ${Object.keys(SWITCHES).join(', ')}`);
  const canon = JSON.parse(await fs.readFile(path.join(ROOT, 'plugin', 'evals', 'evals.json'), 'utf8'));
  const want = ids ?? sw.cases;
  const chosen = canon.evals.filter((c) => want.includes(c.id));
  if (chosen.length !== want.length) throw new Error(`no case ${want.filter((id) => !chosen.some((c) => c.id === id)).join(', ')}`);
  const kinds = new Set(chosen.map((c) => (c.picture ? 'picture' : 'planning')));
  if (kinds.size !== 1) throw new Error('picture and planning cases need different grants: run them separately');
  const set = [...kinds][0];
  try { if ((await fs.readdir(out)).length) throw new Error(`${out} is not empty`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const arms = [];
  for (const arm of ['plain', `off-${name}`]) {
    const copy = path.join(out, arm);
    await fs.cp(PACKAGE, copy, { recursive: true });
    const sw2 = arm === 'plain' ? { withhold: [], done: ['the package as built'] } : await applySwitch(copy, name);
    const cases = await writeEvalSuite({ ...canon, evals: chosen }, path.join(copy, 'evals'), { set, env });
    if (cases.skipped.length) throw new Error(cases.skipped.map((s) => s.why).join('; '));
    arms.push({ arm, copy, set, cases, withhold: sw2.withhold, done: sw2.done });
  }
  return arms;
}

const DETERMINISTIC = new Set(['regex', 'tool_used', 'tool_order', 'file_exists']);

/** One arm's scores per case, from `claude plugin eval --json`: the checks without a model apart from the judged ones. */
export function summarize(result) {
  return result.cases.map((c) => {
    const types = Object.fromEntries((c.graders ?? []).map((g) => [g.name, g.type]));
    const runs = c.arms?.with ?? [];
    const count = (pick) => {
      let pass = 0, all = 0;
      for (const r of runs) for (const g of r.graders ?? []) if (g.scored !== false && !g.withOnly && pick(types[g.name])) { all++; if (g.passed) pass++; }
      return { pass, all };
    };
    const mean = (f) => (runs.length ? runs.reduce((s, r) => s + (f(r) ?? 0), 0) / runs.length : NaN);
    return {
      name: c.name, runs: runs.length,
      score: c.aggregates?.score ?? mean((r) => r.score),
      checks: count((t) => DETERMINISTIC.has(t)),
      judged: count((t) => !DETERMINISTIC.has(t)),
      turns: mean((r) => r.turns), seconds: mean((r) => r.durationSeconds),
      costUsd: runs.reduce((s, r) => s + (r.costUsd ?? 0) + (r.judgeCostUsd ?? 0), 0),
      errors: runs.map((r) => r.error).filter(Boolean),
    };
  });
}

/** The two arms side by side, one line per case. */
export function sideBySide(plain, off, name) {
  const f = (x) => `${x.checks.pass}/${x.checks.all}`;
  const j = (x) => `${x.judged.pass}/${x.judged.all}`;
  const n2 = (v) => (Number.isFinite(v) ? v.toFixed(2) : '-');
  const lines = [`| Case | checks, plain | checks, ${name} off | judged, plain | judged, off | score, plain | score, off | turns | seconds | cost $ |`, '|---|---|---|---|---|---|---|---|---|---|'];
  for (const p of plain) {
    const o = off.find((x) => x.name === p.name) ?? { checks: { pass: 0, all: 0 }, judged: { pass: 0, all: 0 }, score: NaN, turns: NaN, seconds: NaN, costUsd: 0, errors: ['no result'] };
    lines.push(`| ${p.name} | ${f(p)} | ${f(o)} | ${j(p)} | ${j(o)} | ${n2(p.score)} | ${n2(o.score)} | ${n2(p.turns)} / ${n2(o.turns)} | ${n2(p.seconds)} / ${n2(o.seconds)} | ${n2(p.costUsd)} / ${n2(o.costUsd)} |`);
    for (const e of [...p.errors.map((x) => `plain: ${x}`), ...o.errors.map((x) => `off: ${x}`)]) lines.push(`|  | ${e} | | | | | | | | |`);
  }
  return lines.join('\n');
}

function runArm(a, { runs, maxCost }) {
  const json = path.join(path.dirname(a.copy), `${a.arm}.json`);
  const extra = ['--trust-plugin', '--json', json, '--output-dir', path.join(path.dirname(a.copy), `${a.arm}-results`), ...(maxCost ? ['--max-cost-usd', String(maxCost)] : [])];
  const args = evalArgs(a.copy, a.cases, { set: a.set, runs, withhold: a.withhold, extra });
  return new Promise((resolve, reject) => {
    const child = spawn('claude', args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', async (code) => {
      try { resolve({ code, result: JSON.parse(await fs.readFile(json, 'utf8')) }); }
      catch { reject(new Error(`${a.arm}: claude plugin eval exited ${code} and wrote no result`)); }
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (flag) => { const i = process.argv.indexOf(flag); return i < 0 ? undefined : process.argv[i + 1]; };
  const name = arg('--off');
  if (!name || !SWITCHES[name]) {
    console.error(`usage: node release/eval-switch.mjs --off <${Object.keys(SWITCHES).join('|')}> [--cases 21,26] [--runs N] [--out <dir>] [--max-cost-usd N] [--write-only]`);
    process.exit(2);
  }
  const ids = arg('--cases')?.split(',').map(Number);
  const out = path.resolve(arg('--out') ?? path.join(os.tmpdir(), `comp-room-${name}-${Date.now()}`));
  const arms = await prepareArms(out, name, { cases: ids });
  const runs = Number(arg('--runs') ?? (arms[0].set === 'picture' ? 1 : 3));
  console.log(`${name} off: ${SWITCHES[name].what}`);
  for (const a of arms) console.log(`  ${a.arm}: ${a.copy} (${a.done.join('; ')}); ${a.cases.length} ${a.set} case${a.cases.length === 1 ? '' : 's'}`);
  if (arms[0].set === 'picture') console.log('  picture cases change the open project: After Effects must be on an 8 bpc scratch project with no working space.');
  if (process.argv.includes('--write-only')) {
    for (const a of arms) console.log(`\n${evalCommand(a.copy, a.cases, { set: a.set, runs, withhold: a.withhold, extra: ['--trust-plugin'] })}`);
    process.exit(0);
  }
  const maxCost = arg('--max-cost-usd');
  const results = [];
  for (const a of arms) results.push(await runArm(a, { runs, maxCost }));
  const [plain, off] = results.map((r) => summarize(r.result));
  const table = sideBySide(plain, off, name);
  await fs.writeFile(path.join(out, 'compare.md'), `# ${name} off\n\n${SWITCHES[name].what}\n\n${table}\n`);
  await fs.writeFile(path.join(out, 'compare.json'), `${JSON.stringify({ name, what: SWITCHES[name].what, runs, plain, off }, null, 2)}\n`);
  console.log(`\n${table}\n\n(${path.join(out, 'compare.md')})`);
}

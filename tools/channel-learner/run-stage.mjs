#!/usr/bin/env node
// Run the channel learner's model stages as fresh headless Claude runs: one run per recipe per
// stage, each with its own model, turn limit and dollar cap, and a budget for the whole video.
//
//   node tools/channel-learner/run-stage.mjs video  --study <dir>            techniques, write, check, fix rounds, assemble
//   node tools/channel-learner/run-stage.mjs <stage> --study <dir>           one stage, every recipe still to do
//   node tools/channel-learner/run-stage.mjs spent  --study <dir>            what the video has cost so far
//
// Options: --only 01,07 (these recipes, even if done)  --budget-usd 40 (the video's limit)
//   --jobs 3 (runs at once; prove-run is always one)  --dry-run (print the plan, start nothing)
//   --proof <dir> (default <study>/proof)  --scripts <dir> (default proofs/<video id>)
//   --drafts <dir> (menu; default product/arsenal-drafts)  --results <file> (default <study>/runs.jsonl)
//
// Every run appends one line of JSON to the results file:
//   { at, video, stage, unit, model, pass, note, costUsd, turns, peakContext, minutes, limit? }
// Read that file to follow a video; the runs' own work never passes through the caller's context.
//
// Exit codes: 0 every run passed, 1 some run failed, 2 bad arguments, 4 stopped at the budget.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const PROMPTS = path.join(HERE, 'prompts');

// ---------- the one table: what each stage runs on ----------
//
// model:    the model every run of the stage uses. Always named here; never inherited.
//           Sonnet for stages that follow written rules; Opus only where the look is judged.
// per:      'recipe' = one run per technique; 'video' or 'drafts' = one run in all.
// maxTurns: a run that reaches it stops and is recorded as a fail ("hit the turn limit").
// runUsd:   the most one run may spend (claude --max-budget-usd); also recorded as a fail.
// mcp:      the connected tools the run may use; stages without it start with none loaded.
// alone:    never two runs at once (After Effects takes one driver).
export const STAGES = {
  techniques:     { model: 'sonnet', per: 'video',  maxTurns: 20,  runUsd: 1 },
  distil:         { model: 'sonnet', per: 'recipe', maxTurns: 60,  runUsd: 4 },
  check:          { model: 'sonnet', per: 'recipe', maxTurns: 50,  runUsd: 3 },
  layout:         { model: 'sonnet', per: 'recipe', maxTurns: 25,  runUsd: 1 },
  // The Higgsfield connector is mcp__claude_ai_Higgsfield in a headless run; an interactive session may list it under its id.
  art:            { model: 'sonnet', per: 'recipe', maxTurns: 60,  runUsd: 4, mcp: ['mcp__claude_ai_Higgsfield', 'mcp__af2a5bee-d258-4aa6-8bf9-8eb2060db0e2'] },
  'prove-author': { model: 'sonnet', per: 'recipe', maxTurns: 40,  runUsd: 3 },
  'prove-run':    { model: 'sonnet', per: 'recipe', maxTurns: 120, runUsd: 8, mcp: ['mcp__plugin_comp-room_comp-room'], alone: true },
  'prove-review': { model: 'opus',   per: 'recipe', maxTurns: 40,  runUsd: 5 },
  menu:           { model: 'sonnet', per: 'drafts', maxTurns: 40,  runUsd: 4 },
  // A lead is no longer a model run: `video` (below) does its work in code. The row stays so a
  // lead session someone opens by hand uses this model (LESSONS.md, "Running a video").
  'video-lead':   { model: 'sonnet', per: 'video',  maxTurns: 30,  runUsd: 2 },
};

/** The most one video may spend across all its runs, in dollars as Claude Code reports them. */
export const VIDEO_BUDGET_USD = 40;
/** A run still going after this many minutes is stopped and recorded as a fail. */
export const RUN_MINUTES = { default: 45, 'prove-run': 90 };

const BASE_TOOLS = ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'];

// Standing notes every writer and checker gets (they were the lead's to pass on).
const STANDING_NOTES = [
  "The timeline's words come from speech recognition: trust the screen for names.",
  'The on-screen text reader misses lone single digits and sometimes a minus sign: crop and read those.',
  'Ignore junk "Changed" items.',
  'Keep scratch files under your own names inside STUDY/scratch/<n>/ only.',
  'No git. No After Effects.',
];

// ---------- the claude command ----------

export function claudeArgs(stage, { runUsd, addDirs = [] } = {}) {
  const s = STAGES[stage];
  if (!s) throw new Error(`unknown stage ${stage}`);
  const tools = s.mcp ? [...BASE_TOOLS, 'ToolSearch'] : BASE_TOOLS;
  const args = [
    '-p',
    '--model', s.model,
    '--output-format', 'stream-json', '--verbose',
    '--no-session-persistence',
    '--max-turns', String(s.maxTurns),
    '--max-budget-usd', Number(runUsd ?? s.runUsd).toFixed(2),
    '--permission-mode', 'acceptEdits',
    '--tools', tools.join(','),
    '--allowedTools', [...tools, ...(s.mcp || [])].join(','),
    '--disable-slash-commands',
  ];
  if (!s.mcp) args.push('--strict-mcp-config');
  for (const d of addDirs) args.push('--add-dir', d);
  return args;
}

/** Read a stream-json run: cost, turns, peak context of the run itself, and its RESULT line. */
export function parseStream(stdout) {
  let peakContext = 0;
  let result = null;
  for (const line of String(stdout).split('\n')) {
    if (!line.trim().startsWith('{')) continue;
    let ev;
    try { ev = JSON.parse(line); } catch { continue; }
    if (ev.type === 'assistant' && !ev.parent_tool_use_id && ev.message?.usage) {
      const u = ev.message.usage;
      const size = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
      peakContext = Math.max(peakContext, size);
    }
    if (ev.type === 'result') result = ev;
  }
  if (!result) return { peakContext, subtype: null };
  const text = typeof result.result === 'string' ? result.result : '';
  const m = [...text.matchAll(/^\s*RESULT:\s*(pass|fail)\b[\s—–:-]*(.*)$/gim)].pop();
  return {
    subtype: result.subtype,
    isError: !!result.is_error,
    costUsd: Number(result.total_cost_usd) || 0,
    turns: result.num_turns ?? null,
    peakContext,
    text,
    verdict: m ? { pass: m[1].toLowerCase() === 'pass', note: m[2].trim() } : null,
    models: Object.keys(result.modelUsage || {}),
  };
}

// ---------- the results file ----------

export function readResults(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap((l) => {
    try { return [JSON.parse(l)]; } catch { return []; }
  });
}

export const spentOn = (results, video) =>
  results.filter((r) => r.video === video).reduce((sum, r) => sum + (Number(r.costUsd) || 0), 0);

const money = (v) => `$${v.toFixed(2)}`;

// ---------- a study folder ----------

const readJson = (p, fallback = null) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; } };
const mtime = (p) => { try { return fs.statSync(p).mtimeMs; } catch { return null; } };
const findFile = (dir, re) => { try { const f = fs.readdirSync(dir).filter((n) => re.test(n)).sort()[0]; return f ? path.join(dir, f) : null; } catch { return null; } };
const recipeFile = (ctx, n) => findFile(path.join(ctx.study, 'recipes'), new RegExp(`^${n}-.*\\.md$`));
/** A technique's build script: SCRIPTS/<n>-<slug>.jsx, never the finished example copied into every scripts folder. */
const EXAMPLE_SCRIPT = '01-dotted-line.jsx';
const scriptFile = (ctx, n) => { try { const f = fs.readdirSync(ctx.scripts).filter((x) => x !== EXAMPLE_SCRIPT && new RegExp(`^${n}-.*\\.jsx$`).test(x)).sort()[0]; return f ? path.join(ctx.scripts, f) : null; } catch { return null; } };
const checkFile = (ctx, n) => path.join(ctx.study, 'checks', `${n}.md`);

/** What a check file says: { verdict: 'pass'|'fail'|null, round } (null when there is none). */
export function readCheck(file) {
  if (!fs.existsSync(file)) return null;
  const t = fs.readFileSync(file, 'utf8');
  return {
    verdict: (t.match(/^verdict:\s*(pass|fail)/m) || [])[1] || null,
    round: Number((t.match(/^round:\s*(\d+)/m) || [])[1] || 1),
  };
}

export function context(o = {}, stage = null) {
  if (!o.study && stage !== 'menu') throw new Error('--study <dir> is needed');
  const study = o.study ? path.resolve(o.study) : null;
  const state = study ? readJson(path.join(study, 'state.json'), {}) : {};
  const info = study ? readJson(path.join(study, 'source.info.json'), {}) : {};
  const id = state.video?.id || info.id || (study ? path.basename(study) : 'menu');
  return {
    study,
    video: { id, fps: state.video?.fps ?? info.fps ?? null, width: info.width ?? null, height: info.height ?? null },
    proof: path.resolve(o.proof || (study ? path.join(study, 'proof') : '.')),
    scripts: path.resolve(o.scripts || path.join(HERE, 'proofs', id)),
    drafts: path.resolve(o.drafts || path.join(REPO, 'product', 'arsenal-drafts')),
    results: path.resolve(o.results || (study ? path.join(study, 'runs.jsonl') : path.join(homedir(), 'Assets', 'comp-room-studies', 'menu-runs.jsonl'))),
    budgetUsd: Number(o.budgetUsd ?? VIDEO_BUDGET_USD),
  };
}

/** The units a stage works on, in order. */
function allUnits(stage, ctx) {
  const per = STAGES[stage].per;
  if (per !== 'recipe') return [per];
  if (stage === 'distil') return (readJson(path.join(ctx.study, 'techniques.json'), []) || []).map((t) => String(t.n));
  try {
    return fs.readdirSync(path.join(ctx.study, 'recipes')).map((f) => (f.match(/^(\d+)-.*\.md$/) || [])[1]).filter(Boolean).sort();
  } catch { return []; }
}

/** Does this unit still need this stage? Files decide where they can; else the last result. */
function pending(stage, unit, ctx, results) {
  if (stage === 'techniques') return !fs.existsSync(path.join(ctx.study, 'techniques.json'));
  if (stage === 'distil') {
    const r = recipeFile(ctx, unit);
    if (!r) return true;
    const c = readCheck(checkFile(ctx, unit));
    return !!c && c.verdict === 'fail' && c.round < 3 && mtime(checkFile(ctx, unit)) >= mtime(r);
  }
  if (stage === 'check') {
    const r = recipeFile(ctx, unit);
    if (!r) return false;
    const c = checkFile(ctx, unit);
    return !fs.existsSync(c) || mtime(r) > mtime(c);
  }
  const last = results.filter((x) => x.video === ctx.video.id && x.stage === stage && x.unit === unit).pop();
  return !last || !last.pass;
}

// ---------- what each run is told, and how its outcome is judged ----------

function runBlock(stage, unit, ctx) {
  const L = [];
  const per = STAGES[stage].per;
  L.push('', '---', '', '## This run', '');
  L.push(per === 'recipe' ? `Your one unit of work: technique ${unit} (and nothing else)` : `Your one unit of work: ${unit}`);
  L.push('');
  L.push(`You are one fresh run with one job. The instructions above are \`${path.join(PROMPTS, `${stage}.md`)}\`; files they name "beside this file" are in \`${PROMPTS}\`. Do not start other agents. Where they say "for each technique" or "your technique numbers", that is technique ${unit} only.`);
  L.push('');
  if (ctx.study) L.push(`- STUDY: \`${ctx.study}\``);
  if (/^(art|prove)/.test(stage)) L.push(`- PROOF: \`${ctx.proof}\``);
  if (/^prove-(author|run)$/.test(stage)) L.push(`- SCRIPTS: \`${ctx.scripts}\``);
  if (stage === 'prove-run') { const sf = scriptFile(ctx, unit); if (sf) L.push(`- Script: \`${sf}\` (yours to run; \`${EXAMPLE_SCRIPT}\` is only the finished example)`); }
  if (stage === 'prove-run') {
    const rv = path.join(ctx.proof, unit, 'review.md');
    const v = fs.existsSync(rv) ? (fs.readFileSync(rv, 'utf8').match(/^verdict:\s*(.+)$/m) || [])[1]?.trim() : null;
    if (v && !/^matches\b/.test(v)) L.push(`- This is a rebuild: the last build was reviewed "${v}". Read \`${rv}\`, its \`the look\`, \`missing from the recipe\` and \`to fix\` lines, and aim for its targets (estimates: measure your own render). Keep the earlier build's files under their label, as step 3 says.`);
  }
  if (stage === 'menu') L.push(`- DRAFTS: \`${ctx.drafts}\``);
  const v = ctx.video;
  if (ctx.study) L.push(`- Video: ${v.id}${v.width ? `, ${v.width} by ${v.height}` : ''}${v.fps ? `, ${v.fps} frames a second` : ''}`);
  if (per === 'recipe' && stage !== 'distil') {
    const r = recipeFile(ctx, unit);
    if (r) L.push(`- Recipe: \`${r}\``);
  }
  if (stage === 'distil' || stage === 'check') {
    L.push('- Standing notes:');
    for (const n of STANDING_NOTES) L.push(`  - ${n.replace('<n>', unit)}`);
    const extras = path.join(ctx.study, 'extras.md');
    if (fs.existsSync(extras)) {
      L.push(`- Beside the video: \`${extras}\` holds what the author gave outside the recording (a pinned comment's expression, the description), copied word for word. Read it when the narration points to it. A step or value taken from it is marked \`said (pinned comment)\` (or \`said (description)\`); the screen still decides what was actually used, and our recipe text stays in our own words.`);
    }
  }
  if (stage === 'distil') {
    const c = readCheck(checkFile(ctx, unit));
    if (c && c.verdict === 'fail') {
      L.push(`- This is a fix. The recipe failed its check (round ${c.round}): \`${checkFile(ctx, unit)}\` (checks/${unit}.md). Verify each point on the frames before changing the recipe, change only what the evidence supports, and keep the file name.`);
    }
  }
  if (stage === 'check') {
    const c = readCheck(checkFile(ctx, unit));
    const round = c ? c.round + 1 : 1;
    // From round 3 on (round 4 and later only when the lead revives a held recipe) a check looks at the lines
    // the last fix changed: lines that passed a full check are not re-opened (LESSONS.md, lesson 37).
    const narrow = round >= 3;
    L.push(`- This is round ${round}: write \`round: ${round}${narrow ? ' (changed lines only)' : ''}\` as the first line of checks/${unit}.md.${narrow ? ` Check only the lines changed since round ${round - 1}.` : ''}`);
  }
  if (stage === 'prove-review') {
    L.push(`- The contact sheets are made: \`PROOF/${unit}/sheet.png\`${fs.existsSync(path.join(ctx.proof, unit, 'sheet-motion.png')) ? ` and \`PROOF/${unit}/sheet-motion.png\`` : ''}.`);
  }
  L.push('');
  L.push('Finish with your report as the instructions say, then one last line on its own:');
  L.push('`RESULT: pass — <at most 15 words>` when the job is done, or `RESULT: fail — <the reason, at most 15 words>`.');
  return L.join('\n');
}

export function buildPrompt(stage, unit, ctx) {
  return `${fs.readFileSync(path.join(PROMPTS, `${stage}.md`), 'utf8').trimEnd()}\n${runBlock(stage, unit, ctx)}\n`;
}

const freshSince = (p, started) => { const t = mtime(p); return t !== null && t >= started - 1000; };

/** Did the run leave what its stage must leave? { ok, note } */
function judgeOutput(stage, unit, ctx, started) {
  const proof = path.join(ctx.proof, unit);
  switch (stage) {
    case 'techniques': {
      const t = readJson(path.join(ctx.study, 'techniques.json'));
      return Array.isArray(t) && t.length ? { ok: true, note: `${t.length} techniques` } : { ok: false, note: 'no techniques.json' };
    }
    case 'distil': {
      const r = recipeFile(ctx, unit);
      return r && freshSince(r, started) ? { ok: true } : { ok: false, note: `no recipe file written for ${unit}` };
    }
    case 'check': {
      const f = checkFile(ctx, unit);
      if (!freshSince(f, started)) return { ok: false, note: `no checks/${unit}.md written` };
      const c = readCheck(f);
      if (c.verdict === 'pass') return { ok: true, note: `check passed (round ${c.round})` };
      return { ok: false, verdictFail: true, note: `recipe failed its check (round ${c.round})` };
    }
    case 'layout': {
      const r = recipeFile(ctx, unit);
      return r && /^layout:/m.test(fs.readFileSync(r, 'utf8')) ? { ok: true } : { ok: false, note: 'no layout: line in the recipe' };
    }
    case 'art':
      return freshSince(path.join(proof, 'art', 'brief.md'), started) ? { ok: true } : { ok: false, note: 'no art/brief.md written' };
    case 'prove-author': {
      const s = scriptFile(ctx, unit);
      return s && freshSince(s, started) ? { ok: true } : { ok: false, note: `no script ${unit}-*.jsx written` };
    }
    case 'prove-run':
      return freshSince(path.join(proof, 'build.png'), started) ? { ok: true } : { ok: false, note: 'no build.png rendered' };
    case 'prove-review': {
      const f = path.join(proof, 'review.md');
      if (!freshSince(f, started)) return { ok: false, note: 'no review.md written' };
      const v = (fs.readFileSync(f, 'utf8').match(/^verdict:\s*(.+)$/m) || [])[1]?.trim() || 'none';
      return /^matches\b/.test(v) ? { ok: true, note: 'matches' } : { ok: false, verdictFail: true, note: `review: ${v}` };
    }
    case 'menu':
      return freshSince(path.join(ctx.drafts, 'INDEX.md'), started) ? { ok: true } : { ok: false, note: 'no INDEX.md written' };
    default:
      return { ok: true };
  }
}

/** Work done in code before a run starts. Throws to fail the run without starting it. */
async function prepare(stage, unit, ctx, deps) {
  if (stage === 'prove-author') {
    fs.mkdirSync(ctx.scripts, { recursive: true });
    for (const f of ['prelude.jsx', '01-dotted-line.jsx']) {
      const from = path.join(HERE, 'proofs', 'first-video', f);
      const to = path.join(ctx.scripts, f);
      if (!fs.existsSync(to) && fs.existsSync(from)) fs.copyFileSync(from, to);
    }
  }
  if (stage === 'prove-run' && !scriptFile(ctx, unit)) {
    throw new Error(`no script ${unit}-*.jsx in ${ctx.scripts}: run prove-author first`);
  }
  if (stage === 'prove-review') await deps.makeSheets(path.join(ctx.proof, unit));
}

// ---------- running ----------

function realClaude(args, input, { cwd, minutes }) {
  return new Promise((ok) => {
    const env = { ...process.env };
    delete env.CLAUDECODE; // a run started from inside a Claude session is still its own session
    const child = spawn('claude', args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, minutes * 60000);
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr = (stderr + d).slice(-2000); });
    child.on('error', (e) => { clearTimeout(timer); ok({ code: -1, stdout, stderr: e.message }); });
    child.on('close', (code) => { clearTimeout(timer); ok({ code, stdout, stderr, timedOut }); });
    child.stdin.end(input);
  });
}

function realExec(cmd, args, { cwd } = {}) {
  return new Promise((ok) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('error', (e) => ok({ code: -1, out: e.message }));
    child.on('close', (code) => ok({ code, out }));
  });
}

async function defaultDeps() {
  const { makeProofSheets } = await import('./proofs/contact-sheet.mjs');
  return { claude: realClaude, exec: realExec, makeSheets: makeProofSheets, log: (l) => console.log(l) };
}

async function runOne(stage, unit, ctx, deps, runUsd) {
  const s = STAGES[stage];
  const started = Date.now();
  const base = { at: new Date(started).toISOString(), video: ctx.video.id, stage, unit, model: s.model };
  let rec;
  try {
    await prepare(stage, unit, ctx, deps);
  } catch (e) {
    rec = { ...base, pass: false, note: `not started: ${e.message}`, costUsd: 0, turns: 0, peakContext: 0, minutes: 0 };
  }
  if (!rec) {
    const cwd = stage === 'menu' ? ctx.drafts : ctx.study;
    const addDirs = [...new Set([HERE, ctx.proof, ctx.scripts, ctx.drafts].filter((d) => d && d !== cwd && fs.existsSync(d)))];
    const minutes = RUN_MINUTES[stage] ?? RUN_MINUTES.default;
    const out = await deps.claude(claudeArgs(stage, { runUsd, addDirs }), buildPrompt(stage, unit, ctx), { cwd, minutes });
    const r = parseStream(out.stdout);
    // keep the run's raw output beside the results, for diagnosing a failure without re-running it
    const streamFile = path.join(path.dirname(ctx.results), 'runs', `${stage}-${unit}-${base.at.replace(/[:.]/g, '-')}.jsonl`);
    try {
      fs.mkdirSync(path.dirname(streamFile), { recursive: true });
      fs.writeFileSync(streamFile, `${out.stdout}${out.stderr ? `\n${JSON.stringify({ type: 'stderr', text: out.stderr })}\n` : ''}`);
    } catch { /* the record matters more than its log */ }
    rec = { ...base, pass: false, note: '', costUsd: r.costUsd || 0, turns: r.turns ?? null, peakContext: r.peakContext, minutes: Math.round((Date.now() - started) / 600) / 100 };
    if (r.models?.length) rec.models = r.models;
    rec.stream = streamFile;
    if (out.timedOut) { rec.limit = 'time'; rec.note = `stopped after ${minutes} minutes`; }
    else if (r.subtype === 'error_max_turns') { rec.limit = 'turns'; rec.note = `hit the turn limit (${s.maxTurns})`; }
    else if (r.subtype === 'error_max_budget_usd') { rec.limit = 'budget'; rec.note = `hit the run budget (${money(runUsd)})`; }
    else if (!r.subtype) rec.note = `claude exited ${out.code} with no result: ${String(out.stderr || '').trim().split('\n').slice(-2).join(' | ')}`;
    else if (r.isError) rec.note = `run error (${r.subtype}): ${r.text.slice(0, 120)}`;
    else {
      const j = judgeOutput(stage, unit, ctx, started);
      const said = r.verdict;
      rec.pass = j.ok && (!said || said.pass);
      rec.note = [j.note, said ? said.note : 'no RESULT line'].filter(Boolean).join('; ');
    }
  }
  fs.mkdirSync(path.dirname(ctx.results), { recursive: true });
  fs.appendFileSync(ctx.results, `${JSON.stringify(rec)}\n`);
  deps.log(`${rec.pass ? 'pass' : 'FAIL'}  ${stage} ${unit}  ${money(rec.costUsd)}  ${rec.peakContext ? `${Math.round(rec.peakContext / 1000)}k ctx  ` : ''}${rec.note}`);
  return rec;
}

/**
 * Run one stage over its units: one fresh run each, in order, `jobs` at a time.
 * opts: { study, only?, redo?, budgetUsd?, jobs?, dryRun?, exclude? (Set), proof?, scripts?, drafts?, results? }
 * Returns { ran: [records], stopped?: { stage, unit, spent, budget, notStarted } }.
 */
export async function runStage(stage, opts, depsIn) {
  if (!STAGES[stage]) throw new Error(`unknown stage ${stage}; stages: ${Object.keys(STAGES).join(', ')}`);
  if (stage === 'video-lead') return runVideo(opts, depsIn);
  const deps = { ...(await defaultDeps()), ...depsIn };
  const ctx = context(opts, stage);
  const results = readResults(ctx.results);
  const only = opts.only?.length ? opts.only.map(String) : null;
  const units = (only || allUnits(stage, ctx))
    .filter((u) => only || opts.redo || pending(stage, u, ctx, results))
    .filter((u) => !opts.exclude?.has(`${stage} ${u}`));
  const ran = [];
  if (opts.dryRun) {
    for (const u of units) deps.log(`would run  ${stage} ${u}  on ${STAGES[stage].model}  (turns ${STAGES[stage].maxTurns}, at most ${money(STAGES[stage].runUsd)})`);
    deps.log(`${units.length} runs; ${ctx.video.id} has spent ${money(spentOn(results, ctx.video.id))} of ${money(ctx.budgetUsd)}`);
    return { ran, units };
  }
  const jobs = STAGES[stage].alone ? 1 : Math.max(1, Number(opts.jobs) || 1);
  const queue = [...units];
  let stopped = null;
  const worker = async () => {
    while (queue.length && !stopped) {
      const spent = spentOn(readResults(ctx.results), ctx.video.id);
      const left = ctx.budgetUsd - spent;
      if (left <= 0) {
        stopped = { stage, unit: queue[0], spent, budget: ctx.budgetUsd, notStarted: [...queue] };
        break;
      }
      const unit = queue.shift();
      const rec = await runOne(stage, unit, ctx, deps, Math.min(STAGES[stage].runUsd, left));
      ran.push(rec);
    }
  };
  await Promise.all(Array.from({ length: Math.min(jobs, units.length) || 1 }, worker));
  if (stopped) {
    deps.log(`Budget reached for ${ctx.video.id}: ${money(stopped.spent)} spent of ${money(stopped.budget)}. ` +
      `Stopped before ${stage} ${stopped.unit}; not started: ${stopped.notStarted.join(', ')}. ` +
      'Raise --budget-usd to go on; finished runs are kept and skipped.');
  }
  return { ran, stopped, units };
}

/**
 * A video from timeline to checked recipes, in code (the work video-lead.md used to do with agents):
 * list the techniques, write each recipe, check each, up to two fix rounds, hold what still fails,
 * assemble. No unit is run twice for the same stage in one go unless its check asked for a fix.
 */
export async function runVideo(opts, depsIn) {
  const deps = { ...(await defaultDeps()), ...depsIn };
  const ctx = context(opts);
  const exclude = opts.exclude || new Set();
  const o = { ...opts, only: null, redo: false, exclude };
  const ran = [];
  if (opts.dryRun) {
    const first = fs.existsSync(path.join(ctx.study, 'techniques.json')) ? [] : ['techniques'];
    for (const stage of [...first, 'distil', 'check']) await runStage(stage, o, deps);
    deps.log('then: fix rounds for failed checks (up to round 3), hold what still fails, assemble');
    return { ran };
  }
  const step = async (stage) => {
    const r = await runStage(stage, o, deps);
    ran.push(...r.ran);
    // a run that failed (not a check that failed) is not run again in this go
    for (const rec of r.ran) if (!(stage === 'check' && /failed its check/.test(rec.note)) && !rec.pass) exclude.add(`${stage} ${rec.unit}`);
    return r.stopped;
  };
  let stopped = fs.existsSync(path.join(ctx.study, 'techniques.json')) ? null : await step('techniques');
  for (let round = 1; round <= 3 && !stopped; round += 1) {
    stopped = await step('distil');
    if (!stopped) stopped = await step('check');
    const more = allUnits('distil', ctx).some((u) => !exclude.has(`distil ${u}`) && pending('distil', u, ctx, []))
      || allUnits('check', ctx).some((u) => !exclude.has(`check ${u}`) && pending('check', u, ctx, []));
    if (!more) break;
  }
  if (stopped) return { ran, stopped };
  // hold recipes that failed their third check
  const held = [];
  for (const u of allUnits('check', ctx)) {
    const c = readCheck(checkFile(ctx, u));
    if (c && c.verdict === 'fail' && c.round >= 3) {
      const r = recipeFile(ctx, u);
      fs.mkdirSync(path.join(ctx.study, 'held'), { recursive: true });
      fs.renameSync(r, path.join(ctx.study, 'held', path.basename(r)));
      fs.appendFileSync(path.join(ctx.study, 'drafts-held.md'), `- ${u}: failed its check in round ${c.round} (checks/${u}.md)\n`);
      held.push(u);
    }
  }
  if (held.length) deps.log(`held: ${held.join(', ')} (see drafts-held.md)`);
  const a = await deps.exec('node', [path.join(HERE, 'assemble.mjs'), ctx.study], { cwd: REPO });
  deps.log(`assemble: ${a.code === 0 ? 'done' : 'refused'} ${String(a.out || '').trim().split('\n').slice(-2).join(' | ')}`);
  const spent = spentOn(readResults(ctx.results), ctx.video.id);
  deps.log(`${ctx.video.id}: ${ran.filter((r) => r.pass).length} runs passed, ${ran.filter((r) => !r.pass).length} failed; ${money(spent)} spent of ${money(ctx.budgetUsd)}`);
  return { ran, held, assembled: a.code === 0 };
}

// ---------- command line ----------

function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) { o._.push(a); continue; }
    const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (['redo', 'dryRun'].includes(key)) o[key] = true;
    else o[key] = argv[(i += 1)];
  }
  if (o.only) o.only = o.only.split(',').map((s) => s.trim()).filter(Boolean);
  return o;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const o = parseArgs(process.argv.slice(2));
  const cmd = o._[0];
  try {
    if (!cmd) throw new Error(`usage: run-stage.mjs <video|spent|${Object.keys(STAGES).join('|')}> --study <dir> [options]`);
    if (cmd === 'spent') {
      const ctx = context(o);
      const res = readResults(ctx.results).filter((r) => r.video === ctx.video.id);
      const by = {};
      for (const r of res) { by[r.stage] ??= { runs: 0, failed: 0, usd: 0 }; by[r.stage].runs += 1; by[r.stage].failed += r.pass ? 0 : 1; by[r.stage].usd += r.costUsd || 0; }
      for (const [s, v] of Object.entries(by)) console.log(`${s.padEnd(13)} ${String(v.runs).padStart(3)} runs  ${String(v.failed).padStart(3)} failed  ${money(v.usd)}`);
      console.log(`${ctx.video.id}: ${money(spentOn(res, ctx.video.id))} spent of ${money(ctx.budgetUsd)}`);
      process.exit(0);
    }
    const out = cmd === 'video' ? await runVideo(o, {}) : await runStage(cmd, o, {});
    if (out.stopped) process.exit(4);
    process.exit(out.ran.every((r) => r.pass) ? 0 : 1);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
}

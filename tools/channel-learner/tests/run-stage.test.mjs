import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STAGES, claudeArgs, parseStream, runStage, runVideo, readResults,
} from '../run-stage.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS = path.join(HERE, '..', 'prompts');

// ---------- a made-up study folder and a fake `claude` ----------

function study(techniques = ['01', '02', '03']) {
  const dir = fs.mkdtempSync(path.join(tmpdir(), 'run-stage-test-'));
  fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify({ video: { id: 'vid9', fps: 30 } }));
  fs.writeFileSync(path.join(dir, 'source.info.json'), JSON.stringify({ id: 'vid9', width: 1920, height: 1080 }));
  fs.writeFileSync(path.join(dir, 'techniques.json'),
    JSON.stringify(techniques.map((n) => ({ n, slug: `trick-${n}`, start: 0, end: 1, purpose: 'x' }))));
  for (const d of ['recipes', 'checks', 'proof']) fs.mkdirSync(path.join(dir, d));
  return dir;
}

/** The last line a real stream-json run prints. */
const resultLine = ({ subtype = 'success', cost = 0.5, turns = 3, text = 'done\nRESULT: pass — ok' } = {}) =>
  JSON.stringify({ type: 'result', subtype, is_error: subtype !== 'success', total_cost_usd: cost,
    num_turns: turns, result: subtype === 'success' ? text : undefined, duration_ms: 1000,
    modelUsage: { 'claude-sonnet-5-5': {} } });
const assistantLine = (input, read, created, parent = null) => JSON.stringify({
  type: 'assistant', parent_tool_use_id: parent,
  message: { usage: { input_tokens: input, cache_read_input_tokens: read, cache_creation_input_tokens: created, output_tokens: 10 } },
});

/** A fake claude that records each call and, per call, does what `act` says. */
function fakeClaude(act) {
  const calls = [];
  const claude = async (args, input, opts) => {
    const unit = (input.match(/^Your one unit of work: (?:technique )?(\S+)/m) || [])[1];
    calls.push({ args, input, opts, unit });
    const r = (await act({ args, input, unit, n: calls.length })) || {};
    return { code: r.code ?? 0, stderr: '', stdout: r.stdout ?? `${assistantLine(1000, 20000, 500)}\n${resultLine(r)}\n` };
  };
  return { claude, calls };
}

const quiet = { log: () => {} };

// ---------- the model map ----------

test('every stage names its model in the one table: Sonnet except prove-review on Opus, never Fable', () => {
  const sonnet = ['distil', 'check', 'prove-author', 'prove-run', 'layout', 'art', 'menu', 'techniques', 'video-lead'];
  for (const s of sonnet) assert.equal(STAGES[s]?.model, 'sonnet', s);
  assert.equal(STAGES['prove-review'].model, 'opus');
  for (const [name, s] of Object.entries(STAGES)) {
    assert.ok(['sonnet', 'opus', 'haiku'].includes(s.model), `${name}: ${s.model}`);
    assert.ok(!/fable/i.test(s.model), name);
    if (name !== 'prove-review') assert.notEqual(s.model, 'opus', `${name} must not default to Opus`);
    assert.ok(fs.existsSync(path.join(PROMPTS, `${name}.md`)), `prompts/${name}.md`);
    assert.ok(s.maxTurns > 0 && s.runUsd > 0, `${name} has a ceiling`);
  }
});

test('the command always passes the stage model and its ceilings, and never resumes', () => {
  for (const stage of Object.keys(STAGES)) {
    const a = claudeArgs(stage, { runUsd: 1.5, addDirs: ['/x'] });
    const at = (flag) => a[a.indexOf(flag) + 1];
    assert.equal(at('--model'), STAGES[stage].model);
    assert.equal(at('--max-turns'), String(STAGES[stage].maxTurns));
    assert.equal(at('--max-budget-usd'), '1.50');
    assert.ok(a.includes('--no-session-persistence'));
    for (const f of ['--resume', '-r', '--continue', '-c', '--session-id', '--fork-session']) assert.ok(!a.includes(f), f);
    assert.ok(!at('--tools').split(',').includes('Agent'), 'no subagents inside a run');
  }
});

test('a run on prove-review really starts Opus and a run on distil really starts Sonnet', async () => {
  const dir = study(['01']);
  fs.writeFileSync(path.join(dir, 'recipes', '01-trick-01.md'), 'recipe');
  const { claude, calls } = fakeClaude(() => {});
  await runStage('distil', { study: dir, only: ['01'] }, { ...quiet, claude });
  const model = calls[0].args[calls[0].args.indexOf('--model') + 1];
  assert.equal(model, 'sonnet');
  const proof = path.join(dir, 'proof', '01');
  fs.mkdirSync(proof);
  const fake2 = fakeClaude(() => { fs.writeFileSync(path.join(proof, 'review.md'), 'verdict: matches\n'); });
  await runStage('prove-review', { study: dir, only: ['01'] }, { ...quiet, claude: fake2.claude, makeSheets: async () => {} });
  assert.equal(fake2.calls[0].args[fake2.calls[0].args.indexOf('--model') + 1], 'opus');
});

// ---------- one recipe per run ----------

test('one fresh run per recipe: each prompt names one technique and nothing is resumed', async () => {
  const dir = study(['01', '02', '03']);
  const { claude, calls } = fakeClaude(({ unit }) => {
    fs.writeFileSync(path.join(dir, 'recipes', `${unit}-trick.md`), `## Technique ${unit}\n`);
  });
  const out = await runStage('distil', { study: dir }, { ...quiet, claude });
  assert.equal(calls.length, 3);
  assert.deepEqual(calls.map((c) => c.unit), ['01', '02', '03']);
  for (const c of calls) {
    const others = ['01', '02', '03'].filter((n) => n !== c.unit);
    const runBlock = c.input.slice(c.input.indexOf('## This run'));
    for (const o of others) assert.ok(!runBlock.includes(`technique ${o}`), `run for ${c.unit} mentions ${o}`);
    assert.ok(!c.args.includes('--resume'));
  }
  const lines = readResults(path.join(dir, 'runs.jsonl'));
  assert.equal(lines.length, 3);
  assert.deepEqual(lines.map((l) => [l.stage, l.unit, l.pass, l.model]),
    [['distil', '01', true, 'sonnet'], ['distil', '02', true, 'sonnet'], ['distil', '03', true, 'sonnet']]);
  assert.equal(lines[0].peakContext, 21500);
  assert.ok(fs.readFileSync(lines[0].stream, 'utf8').includes('"type":"result"'), 'raw output kept beside the results');
  assert.equal(lines[0].costUsd, 0.5);
  assert.equal(out.ran.length, 3);
});

test('a run that hits its turn limit is recorded as a fail with the reason, and not tried again', async () => {
  const dir = study(['01', '02']);
  const { claude, calls } = fakeClaude(({ unit }) => {
    if (unit === '01') return { subtype: 'error_max_turns', cost: 0.9, turns: 60 };
    fs.writeFileSync(path.join(dir, 'recipes', `${unit}-trick.md`), 'x');
  });
  await runStage('distil', { study: dir }, { ...quiet, claude });
  assert.deepEqual(calls.map((c) => c.unit), ['01', '02']);
  const [first] = readResults(path.join(dir, 'runs.jsonl'));
  assert.equal(first.pass, false);
  assert.equal(first.limit, 'turns');
  assert.match(first.note, /turn limit \(60\)/);
  assert.equal(first.costUsd, 0.9);
});

test('a run that hits its own budget is a fail; a run that writes nothing is a fail', async () => {
  const dir = study(['01', '02']);
  const { claude } = fakeClaude(({ unit }) => (unit === '01' ? { subtype: 'error_max_budget_usd', cost: 4 } : {}));
  await runStage('distil', { study: dir }, { ...quiet, claude });
  const [a, b] = readResults(path.join(dir, 'runs.jsonl'));
  assert.equal(a.limit, 'budget');
  assert.match(a.note, /run budget/);
  assert.equal(b.pass, false);
  assert.match(b.note, /no recipe file/);
});

test('the video chain does not retry a failed run within one go', async () => {
  const dir = study(['01']);
  const { claude, calls } = fakeClaude(({ input }) => {
    if (/distil|Writing technique recipes/.test(input)) return { subtype: 'error_max_turns' };
  });
  await runVideo({ study: dir }, { ...quiet, claude, exec: async () => ({ code: 0, out: '' }) });
  assert.equal(calls.length, 1);
});

test('a check that fails is a fail; its round goes up and after round 3 the recipe is held', async () => {
  const dir = study(['01']);
  const recipe = path.join(dir, 'recipes', '01-trick.md');
  let round = 0;
  let tick = 0;
  const T0 = Date.now();
  // each write lands a second after the one before, as real runs minutes apart would
  const write = (p, text) => { fs.writeFileSync(p, text); const t = new Date(T0 + 1000 * ++tick); fs.utimesSync(p, t, t); };
  const { claude, calls } = fakeClaude(({ input }) => {
    if (input.includes('# Checking recipes')) {
      round += 1;
      assert.ok(input.includes(`round: ${round}`), `check is told round ${round}`);
      write(path.join(dir, 'checks', '01.md'), `round: ${round}\nverdict: fail\nfailures: x\n`);
    } else {
      assert.ok(round === 0 || input.includes('checks/01.md'), 'a fix run is given the check file');
      write(recipe, `v${round}`);
    }
  });
  const exec = async () => ({ code: 0, out: '' });
  await runVideo({ study: dir }, { ...quiet, claude, exec });
  assert.equal(calls.filter((c) => c.input.includes('# Checking recipes')).length, 3);
  assert.equal(calls.length, 6);
  assert.ok(fs.existsSync(path.join(dir, 'held', '01-trick.md')));
  assert.match(fs.readFileSync(path.join(dir, 'drafts-held.md'), 'utf8'), /01/);
  const checks = readResults(path.join(dir, 'runs.jsonl')).filter((l) => l.stage === 'check');
  assert.ok(checks.every((l) => l.pass === false));
});

// ---------- the budget per video ----------

test('the budget stops new runs once the video has spent its limit, and says where it stopped', async () => {
  const dir = study(['01', '02', '03', '04']);
  fs.writeFileSync(path.join(dir, 'runs.jsonl'),
    `${JSON.stringify({ video: 'vid9', stage: 'distil', unit: '00', pass: true, costUsd: 9 })}\n` +
    `${JSON.stringify({ video: 'other', stage: 'distil', unit: '00', pass: true, costUsd: 100 })}\n`);
  const logs = [];
  const { claude, calls } = fakeClaude(({ unit }) => {
    fs.writeFileSync(path.join(dir, 'recipes', `${unit}-t.md`), 'x');
    return { cost: 0.75 };
  });
  const out = await runStage('distil', { study: dir, budgetUsd: 10 }, { claude, log: (l) => logs.push(l) });
  assert.deepEqual(calls.map((c) => c.unit), ['01', '02']);
  assert.equal(out.stopped.unit, '03');
  assert.deepEqual(out.stopped.notStarted, ['03', '04']);
  assert.ok(logs.some((l) => /budget/i.test(l) && l.includes('03') && l.includes('10.00')), logs.join('\n'));
  // the run's own cap never exceeds what is left of the video's budget
  const cap = (c) => Number(c.args[c.args.indexOf('--max-budget-usd') + 1]);
  assert.equal(cap(calls[0]), 1);
  assert.equal(cap(calls[1]), 0.25);
});

test('the budget also stops the video chain before its next stage', async () => {
  const dir = study(['01']);
  fs.writeFileSync(path.join(dir, 'runs.jsonl'), `${JSON.stringify({ video: 'vid9', costUsd: 50 })}\n`);
  const { claude, calls } = fakeClaude(() => {});
  const out = await runVideo({ study: dir, budgetUsd: 40 }, { ...quiet, claude, exec: async () => ({ code: 0 }) });
  assert.equal(calls.length, 0);
  assert.equal(out.stopped.stage, 'distil');
});

// ---------- reading a run ----------

test('parseStream takes peak context from the run itself, not from subagents', () => {
  const s = [
    assistantLine(10, 30000, 2000),
    assistantLine(5, 90000, 100),
    assistantLine(5, 500000, 0, 'toolu_1'),
    'not json',
    resultLine({ cost: 1.25, turns: 7, text: 'report\nRESULT: fail — no clean frame' }),
  ].join('\n');
  const r = parseStream(s);
  assert.equal(r.peakContext, 90105);
  assert.equal(r.costUsd, 1.25);
  assert.equal(r.turns, 7);
  assert.equal(r.subtype, 'success');
  assert.deepEqual(r.verdict, { pass: false, note: 'no clean frame' });
  assert.deepEqual(r.models, ['claude-sonnet-5-5']);
});

test('dry run prints the plan and starts nothing', async () => {
  const dir = study(['01', '02']);
  const logs = [];
  const { claude, calls } = fakeClaude(() => {});
  await runStage('distil', { study: dir, dryRun: true }, { claude, log: (l) => logs.push(l) });
  assert.equal(calls.length, 0);
  assert.ok(logs.some((l) => l.includes('01') && l.includes('sonnet')));
  assert.ok(!fs.existsSync(path.join(dir, 'runs.jsonl')));
});

test('material the author gave beside the video (extras.md) is named to writers and checkers, and only when it exists', async () => {
  const dir = study(['01']);
  const write = ({ unit }) => fs.writeFileSync(path.join(dir, 'recipes', `${unit}-trick.md`), `## Technique ${unit}\n`);
  const without = fakeClaude(write);
  await runStage('distil', { study: dir }, { ...quiet, claude: without.claude });
  assert.ok(!without.calls[0].input.includes('extras.md'), 'no extras note without the file');

  fs.writeFileSync(path.join(dir, 'extras.md'), '# Beside the video\n\nPinned comment: an expression.\n');
  for (const stage of ['distil', 'check']) {
    const { claude, calls } = fakeClaude(write);
    await runStage(stage, { study: dir, only: ['01'] }, { ...quiet, claude });
    const runBlock = calls[0].input.slice(calls[0].input.indexOf('## This run'));
    assert.ok(runBlock.includes(`\`${path.join(dir, 'extras.md')}\``), `${stage} run names extras.md`);
    assert.ok(/said \(pinned comment\)/.test(runBlock), `${stage} run says how to mark a step taken from it`);
  }
});

test('every check after round 2 looks only at the lines changed since the check before it', async () => {
  const dir = study(['01']);
  fs.writeFileSync(path.join(dir, 'recipes', '01-trick.md'), '## Technique 01\n');
  for (const [prev, round] of [[2, 3], [3, 4], [4, 5]]) {
    fs.writeFileSync(path.join(dir, 'checks', '01.md'), `round: ${prev}\nverdict: fail\n`);
    const t = Date.now() / 1000 + 5;
    fs.utimesSync(path.join(dir, 'recipes', '01-trick.md'), t, t);
    const { claude, calls } = fakeClaude(() => {});
    await runStage('check', { study: dir, only: ['01'] }, { ...quiet, claude });
    const runBlock = calls[0].input.slice(calls[0].input.indexOf('## This run'));
    assert.ok(runBlock.includes(`\`round: ${round} (changed lines only)\``), `round ${round} is marked changed lines only`);
    assert.ok(runBlock.includes(`Check only the lines changed since round ${prev}.`), `round ${round} checks the lines changed since round ${prev}`);
  }
});

test('proofs are built at 9:16, the phone frame the owner reviews on: the art, script and comp rules all say so', () => {
  for (const f of ['prove-author.md', 'prove.md', 'art.md']) {
    const text = fs.readFileSync(path.join(PROMPTS, f), 'utf8');
    assert.ok(text.includes('1080 by 1920'), `${f} names the 1080 by 1920 frame`);
    assert.ok(!text.includes('1920 by 1080'), `${f} no longer asks for 1920 by 1080`);
  }
});

test('art runs may call the image generator under the name a headless run gives it', () => {
  const args = claudeArgs('art');
  const allowed = args[args.indexOf('--allowedTools') + 1].split(',');
  assert.ok(allowed.includes('mcp__claude_ai_Higgsfield'), 'headless name of the Higgsfield connector is allowed');
  assert.ok(!args.includes('--strict-mcp-config'), 'connected tools are loaded for art');
});

test('a build run is told its own script by name, never the 01 example that every scripts folder holds', async () => {
  const dir = study(['01']);
  fs.writeFileSync(path.join(dir, 'recipes', '01-zigzag.md'), '## Technique 01\n');
  const scripts = path.join(dir, 'scripts');
  fs.mkdirSync(scripts);
  fs.writeFileSync(path.join(scripts, '01-dotted-line.jsx'), '// the finished example\n');
  fs.writeFileSync(path.join(scripts, '01-zigzag.jsx'), '// technique 01\n');
  const { claude, calls } = fakeClaude(() => {});
  await runStage('prove-run', { study: dir, scripts }, { ...quiet, claude });
  const runBlock = calls[0].input.slice(calls[0].input.indexOf('## This run'));
  assert.ok(runBlock.includes(`- Script: \`${path.join(scripts, '01-zigzag.jsx')}\``), 'names the technique script');
  assert.ok(!runBlock.includes(`- Script: \`${path.join(scripts, '01-dotted-line.jsx')}\``), 'does not give the example as the script');
});

test('a rebuild after a review that did not match is pointed at that review', async () => {
  const dir = study(['01']);
  fs.writeFileSync(path.join(dir, 'recipes', '01-zigzag.md'), '## Technique 01\n');
  const scripts = path.join(dir, 'scripts');
  fs.mkdirSync(scripts);
  fs.writeFileSync(path.join(scripts, '01-zigzag.jsx'), '// technique 01\n');
  const { claude, calls } = fakeClaude(() => {});
  await runStage('prove-run', { study: dir, scripts }, { ...quiet, claude });
  assert.ok(!calls[0].input.includes('review.md'), 'a first build is not sent to a review');
  fs.mkdirSync(path.join(dir, 'proof', '01'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'proof', '01', 'review.md'), 'verdict: partly\nto fix: thinner line\n');
  const again = fakeClaude(() => {});
  await runStage('prove-run', { study: dir, scripts, only: ['01'] }, { ...quiet, claude: again.claude });
  const runBlock = again.calls[0].input.slice(again.calls[0].input.indexOf('## This run'));
  assert.ok(runBlock.includes(`\`${path.join(dir, 'proof', '01', 'review.md')}\``), 'names the review');
  assert.match(runBlock, /to fix/);
});

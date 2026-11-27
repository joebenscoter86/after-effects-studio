import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STAGES, claudeArgs, parseStream, runStage, runVideo, readResults, uncoveredSpeech, savePrintedCheck,
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
  const bareBlock = without.calls[0].input.slice(without.calls[0].input.indexOf('## This run'));
  assert.ok(!bareBlock.includes('extras.md'), 'no extras note in the run block without the file');

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

// Lesson 54: after the match step wrote 04's merge lines, its changed-lines check re-checked the
// previous fix and wrote no merge line, so assemble could not take the variant.
test('a check of a recipe whose merge lines no check has confirmed is told to check them and write merge:', async () => {
  const dir = study(['01']);
  const recipe = path.join(dir, 'recipes', '01-trick.md');
  const cases = [
    ['## Technique 01\nstatus: unproven\nvariant of: 04-parent (abc #04)\ndiffers: shared ...\n', 'round: 3 (changed lines only)\nverdict: pass\n', true],
    ['## Technique 01\nstatus: unproven\nvariant of: 04-parent (abc #04)\ndiffers: shared ...\n', 'round: 4 (changed lines only)\nverdict: pass\nmerge: confirmed\n', false],
    ['## Technique 01\nstatus: unproven\nvariant of: 04-parent (abc #04)\ndiffers: shared ...\n', 'round: 4 (changed lines only)\nverdict: fail\nmerge: refused\n', true],
    ['## Technique 01\nstatus: unproven\n', 'round: 2\nverdict: pass\n', false],
  ];
  for (const [body, check, told] of cases) {
    fs.writeFileSync(recipe, body);
    fs.writeFileSync(path.join(dir, 'checks', '01.md'), check);
    const t = Date.now() / 1000 + 5;
    fs.utimesSync(recipe, t, t);
    const { claude, calls } = fakeClaude(() => {});
    await runStage('check', { study: dir, only: ['01'] }, { ...quiet, claude });
    const runBlock = calls[0].input.slice(calls[0].input.indexOf('## This run'));
    const said = /merge lines/.test(runBlock) && /`merge: confirmed` or `merge: refused`/.test(runBlock);
    assert.equal(said, told, `${check.split('\n').join(' | ')}: ${told ? 'told' : 'not told'} to check the merge lines`);
  }
});

test('proofs are built at 9:16, the phone frame the owner reviews on: the art, script and comp rules all say so', () => {
  for (const f of ['prove-author.md', 'prove.md', 'art.md']) {
    const text = fs.readFileSync(path.join(PROMPTS, f), 'utf8');
    assert.ok(text.includes('1080 by 1920'), `${f} names the 1080 by 1920 frame`);
    assert.ok(!text.includes('1920 by 1080'), `${f} no longer asks for 1920 by 1080`);
  }
});

test('sizes carry to a 9:16 proof: writers, checkers and builders size parts by their object and objects by the short side (lesson 44)', () => {
  for (const f of ['distil.md', 'check.md', 'prove-run.md']) {
    const text = fs.readFileSync(path.join(PROMPTS, f), 'utf8');
    assert.ok(text.includes('short side'), `${f} sizes the main object against the frame's short side`);
  }
  for (const f of ['distil.md', 'check.md']) {
    const text = fs.readFileSync(path.join(PROMPTS, f), 'utf8');
    assert.ok(/pixel value|value in pixels/.test(text) && text.includes('object size it was set for'), `${f} gives a pixel effect value with the object size it was set for`);
  }
});

test('a technique that is a move keeps a played result window; a still is not traded for it (lesson 45)', () => {
  for (const f of ['distil.md', 'check.md']) {
    const text = fs.readFileSync(path.join(PROMPTS, f), 'utf8');
    assert.ok(text.includes('played window'), `${f} asks for a played window when the technique is a move`);
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

test('a build run is told the current script, never an earlier copy kept under a label (lesson 49)', async () => {
  const dir = study(['01']);
  fs.writeFileSync(path.join(dir, 'recipes', '01-zigzag.md'), '## Technique 01\n');
  const scripts = path.join(dir, 'scripts');
  fs.mkdirSync(scripts);
  for (const f of ['01-zigzag.jsx', '01-zigzag-eighth.jsx', '01-zigzag-first.jsx', '01-zigzag-second-prior.jsx', '01-zigzag-2026-11-19a.jsx']) {
    fs.writeFileSync(path.join(scripts, f), `// ${f}\n`);
  }
  const { claude, calls } = fakeClaude(() => {});
  await runStage('prove-run', { study: dir, scripts }, { ...quiet, claude });
  const runBlock = calls[0].input.slice(calls[0].input.indexOf('## This run'));
  assert.ok(runBlock.includes(`- Script: \`${path.join(scripts, '01-zigzag.jsx')}\``), 'names the unlabelled script');
});

test('a build run reached through the study link is told the proof folder\'s real path too (lesson 46)', async () => {
  const dir = study(['01']);
  fs.writeFileSync(path.join(dir, 'recipes', '01-zigzag.md'), '## Technique 01\n');
  const scripts = path.join(dir, 'scripts');
  fs.mkdirSync(scripts);
  fs.writeFileSync(path.join(scripts, '01-zigzag.jsx'), '// technique 01\n');
  const link = path.join(fs.mkdtempSync(path.join(tmpdir(), 'run-stage-link-')), 'study');
  fs.symlinkSync(dir, link);
  const { claude, calls } = fakeClaude(() => {});
  await runStage('prove-run', { study: link, scripts }, { ...quiet, claude });
  const real = fs.realpathSync(path.join(dir, 'proof'));
  assert.ok(calls[0].input.includes(`- PROOF's real path: \`${real}\``), 'names the real folder a project may be opened from');
  const rules = fs.readFileSync(path.join(PROMPTS, 'prove-run.md'), 'utf8');
  assert.ok(rules.includes('real path'), 'prove-run.md accepts the project by its real path');
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
  assert.match(runBlock, /target against measured/, 'a rebuild measures each of its review\'s figures (lesson 47)');
  assert.match(runBlock, /five rounds/, 'and keeps tuning past the first build\'s two or three rounds');
  assert.match(runBlock, /what matches/, 'and keeps what its review already found matching');
  assert.ok(fs.readFileSync(path.join(PROMPTS, 'prove-run.md'), 'utf8').includes('target against measured'), 'prove-run.md says so too');
});

test('committed proof scripts name no home folder; paths come from args or start with ~/ (lesson 48)', () => {
  const root = path.join(HERE, '..', 'proofs');
  const bad = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (/\.(jsx|js|mjs|md|json)$/.test(e.name) && /\/(Users|home)\/[^/\s"']+\//.test(fs.readFileSync(f, 'utf8'))) bad.push(path.relative(root, f));
    }
  };
  walk(root);
  assert.deepEqual(bad, [], 'scripts with a home folder spelled out');
  for (const f of ['prove-author.md', 'prove-run.md']) {
    assert.ok(fs.readFileSync(path.join(PROMPTS, f), 'utf8').includes('never a home folder spelled out'), `${f} says so`);
  }
});

test('narration that no technique span covers is named, so a late start or early end is seen before the writers run (lesson 50)', async () => {
  const words = (from, n, text) => Array.from({ length: n }, (_, i) => ({ t: from + i * 0.5, end: from + i * 0.5 + 0.4, text: `${text}${i}` }));
  const timeline = { chapters: [
    { sentences: [{ words: words(0, 12, 'hello') }] },          // intro, 0–6 s
    { sentences: [{ words: words(20, 30, 'card') }] },           // the card is drawn, 20–35 s
    { sentences: [{ words: words(40, 20, 'blur') }] },           // the technique, 40–50 s
    { sentences: [{ words: words(52, 12, 'rest') }] },           // "do the same to the rest", 52–58 s
    { sentences: [{ words: words(70, 4, 'bye') }] },             // a short sign-off, under 10 words
  ] };
  const late = uncoveredSpeech(timeline, [{ n: '01', start: 40, end: 50.5 }]);
  assert.deepEqual(late.map((g) => [g.start, Math.round(g.end)]), [[0, 6], [20, 35], [52, 58]]);
  assert.match(late[1].words, /^card0 card1/);
  assert.deepEqual(uncoveredSpeech(timeline, [{ n: '01', start: 20, end: 60 }]).map((g) => g.start), [0], 'only the intro is left once the span is widened');

  // The techniques run's note carries them.
  const dir = study(['01']);
  fs.unlinkSync(path.join(dir, 'techniques.json'));
  fs.writeFileSync(path.join(dir, 'timeline.json'), JSON.stringify(timeline));
  const { claude } = fakeClaude(() => {
    fs.writeFileSync(path.join(dir, 'techniques.json'), JSON.stringify([{ n: '01', slug: 'blur', start: 40, end: 50.5, purpose: 'x' }]));
  });
  await runStage('techniques', { study: dir }, { ...quiet, claude });
  const [r] = readResults(path.join(dir, 'runs.jsonl'));
  assert.ok(r.pass, 'listing passes');
  assert.match(r.note, /speech in no span: 0:00–0:05 "hello0[^;]*; 0:20–0:34 "card0/);
  for (const f of ['techniques.md', 'video-lead.md']) {
    assert.ok(fs.readFileSync(path.join(PROMPTS, f), 'utf8').includes('speech in no span'), `${f} names the note`);
  }
});

test('the owner\'s proof requirements reach art and build runs through PROOF/lead-notes.md, and only when it exists', async () => {
  const told = async (stage, withNote) => {
    const dir = study(['01']);
    fs.writeFileSync(path.join(dir, 'recipes', '01-zigzag.md'), '## Technique 01\n');
    const scripts = path.join(dir, 'scripts');
    fs.mkdirSync(scripts);
    fs.writeFileSync(path.join(scripts, '01-zigzag.jsx'), '// technique 01\n');
    const note = path.join(dir, 'proof', 'lead-notes.md');
    if (withNote) fs.writeFileSync(note, '# Lead notes\nInvented app mark; Inter Tight for SF Pro.\n');
    fs.mkdirSync(path.join(dir, 'proof', '01'), { recursive: true });
    const { claude, calls } = fakeClaude(() => {});
    await runStage(stage, { study: dir, scripts, only: ['01'] }, { ...quiet, claude, makeSheets: async () => {} });
    assert.equal(calls.length, 1, `${stage} ran once`);
    return calls[0].input.slice(calls[0].input.indexOf('## This run')).includes(`- Lead notes: \`${note}\``);
  };
  assert.equal(await told('prove-run', false), false, 'no note file, no line');
  for (const stage of ['art', 'prove-author', 'prove-run']) assert.equal(await told(stage, true), true, `${stage} is told`);
  assert.equal(await told('prove-review', true), false, 'the review judges against the tutorial, not the brief');
});

test('code the author gave is quoted whole in the recipe, and the check compares it word for word (lesson 51)', () => {
  const distil = fs.readFileSync(path.join(PROMPTS, 'distil.md'), 'utf8');
  const check = fs.readFileSync(path.join(PROMPTS, 'check.md'), 'utf8');
  assert.match(distil, /quote the whole text word for word in a fenced block/, 'writers quote it');
  assert.match(check, /carries that text in full in a fenced block/, 'checkers ask for it');
  assert.match(check, /word for word/, 'and compare it with extras.md');
});

test('a check run that prints its check instead of writing it has the check saved, for its own recipe only (lesson 52)', async () => {
  const dir = study(['01']);
  fs.writeFileSync(path.join(dir, 'recipes', '01-trick-01.md'), '## Technique 01\n');
  const printed = 'Done.\n\nround: 3 (changed lines only)\nrecipe: 01-trick-01\nverdict: pass\nfailures:\n- none\n\nRESULT: pass — fixed';
  const { claude } = fakeClaude(() => ({ text: printed }));
  await runStage('check', { study: dir, only: ['01'] }, { ...quiet, claude });
  const saved = fs.readFileSync(path.join(dir, 'checks', '01.md'), 'utf8');
  assert.match(saved, /^round: 3 \(changed lines only\)\nrecipe: 01-trick-01\nverdict: pass/);
  assert.ok(!/RESULT:/.test(saved), 'the RESULT line is not part of the check');
  const [r] = readResults(path.join(dir, 'runs.jsonl'));
  assert.ok(r.pass, 'counts as a passed check');
  assert.match(r.note, /saved from the run's message/);

  const other = path.join(dir, 'checks', '02.md');
  assert.equal(savePrintedCheck('round: 1\nrecipe: 03-else\nverdict: pass\n', other, '02'), false, 'another recipe\'s check is not saved');
  assert.equal(savePrintedCheck('round: 1\nrecipe: 02-x\n', other, '02'), false, 'no verdict, no check');
  assert.ok(!fs.existsSync(other));
});

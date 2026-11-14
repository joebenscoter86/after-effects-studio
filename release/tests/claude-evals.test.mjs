// Tests for the converter that turns the canonical plugin/evals prompts into a `claude plugin eval` suite.
// Run: node --test 'release/tests/*.test.mjs'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { writeEvalSuite, claudePrompt, pictureCommand, evalArgs, checkAnswer, answerPattern, subjectSteps, ANSWER_CHECKS, moduleClosure, GRADER_MODULES, NOTICE_LIMIT } from '../claude-evals.mjs';
import { THRESHOLDS } from '../../plugin/evals/picture/checks.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CANON = JSON.parse(await fs.readFile(path.join(ROOT, 'plugin', 'evals', 'evals.json'), 'utf8'));
// The planning set (the default): every case without `picture`. The picture set is tested at the end.
const PLAN = { ...CANON, evals: CANON.evals.filter((c) => !c.picture) };
const PICTURES = CANON.evals.filter((c) => c.picture);
const tmp = (prefix) => fs.mkdtemp(path.join(os.tmpdir(), prefix));

function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
  assert.ok(m, 'front matter block');
  return { head: m[1], body: m[2] };
}

test('writes one case per canonical prompt, in order', async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  const cases = await writeEvalSuite(CANON, out);
  assert.equal(cases.length, PLAN.evals.length);
  const dirs = (await fs.readdir(out)).sort();
  assert.equal(dirs.length, PLAN.evals.length);
  assert.match(dirs[0], /^01-/);
  assert.match(dirs.at(-1), new RegExp(`^${String(PLAN.evals.at(-1).id).padStart(2, '0')}-`));
});

test('the prompt body is the canonical prompt, with Codex skill syntax made Claude syntax', async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  await writeEvalSuite(CANON, out);
  for (const [i, c] of PLAN.evals.entries()) {
    const dir = (await fs.readdir(out)).sort()[i];
    const { head, body } = frontMatter(await fs.readFile(path.join(out, dir, 'prompt.md'), 'utf8'));
    if (!c.files?.length) assert.equal(body.trim(), claudePrompt(c.prompt).trim());
    else {
      // a planning case with its own files: the canonical prompt, then the files by their names in the workspace,
      // where the case's scaffold copies them (a run cannot read the eval directory)
      assert.ok(body.trim().startsWith(claudePrompt(c.prompt).trim()), `case ${c.id}`);
      assert.ok(body.includes("This case's files are in your working folder"), `case ${c.id}`);
      for (const f of c.files) {
        assert.ok(body.includes(`\`${f}\``), `case ${c.id} names ${f}`);
        assert.ok(!body.includes(path.join(out, dir)), `case ${c.id}: no path into the eval directory`);
        await fs.access(path.join(out, dir, 'files', f));
      }
      await fs.access(path.join(out, dir, 'case.yaml'));
    }
    assert.match(head, /^max_turns: \d+$/m);
    assert.match(head, /allowed_tools: \[.*Skill.*\]/);
  }
  assert.equal(claudePrompt('Use $typography to plan an editorial After Effects title.'), '/comp-room:typography Plan an editorial After Effects title.');
  assert.equal(claudePrompt('Plan a title. No $ signs here.'), 'Plan a title. No $ signs here.');
});

test('one LLM grader per canonical assertion, carrying the expected output as context', async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  await writeEvalSuite(CANON, out);
  for (const [i, c] of PLAN.evals.entries()) {
    const dir = path.join(out, (await fs.readdir(out)).sort()[i], 'graders');
    const files = (await fs.readdir(dir)).filter((f) => /^assertion-\d+\.md$/.test(f)).sort();
    assert.equal(files.length, c.assertions.length, `case ${c.id}`);
    for (const [k, f] of files.entries()) {
      const { head, body } = frontMatter(await fs.readFile(path.join(dir, f), 'utf8'));
      assert.match(head, /^type: llm$/m);
      assert.ok(body.includes(c.assertions[k]), `case ${c.id} assertion ${k + 1}`);
      assert.ok(body.includes(c.expected_output), `case ${c.id} expected output`);
    }
  }
});

test('process assertions are judged on the trace, outcome assertions on the final message', async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  await writeEvalSuite(CANON, out);
  const read = async (id, k) => { const i = PLAN.evals.findIndex((c) => c.id === id);
    return frontMatter(await fs.readFile(path.join(out, (await fs.readdir(out)).sort()[i], 'graders', `assertion-${k}.md`), 'utf8')).head; };
  assert.match(await read(5, 1), /^focus: trace$/m);                     // "Trace records typography/SKILL.md ..."
  assert.match(await read(6, 1), /^focus: trace$/m);                     // "No typography or other motion skill file is read."
  assert.doesNotMatch(await read(1, 1), /^focus:/m);                     // the authored build's composition, in the answer
});

test('negative controls score a no-plugin-skill check; every other case reports whether a plugin skill fired', async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  await writeEvalSuite(CANON, out);
  const dirs = (await fs.readdir(out)).sort();
  for (const [i, c] of PLAN.evals.entries()) {
    const g = path.join(out, dirs[i], 'graders'), files = await fs.readdir(g);
    const negative = /no .*skill activation/i.test(c.expected_output);
    if (negative) {
      const { head } = frontMatter(await fs.readFile(path.join(g, 'no-plugin-skill.md'), 'utf8'));
      assert.match(head, /^type: tool_used$/m); assert.match(head, /^tool: Skill$/m); assert.match(head, /^max: 0$/m); assert.match(head, /^arm: both$/m);
      assert.ok(!files.includes('plugin-skill.md'), `case ${c.id}`);
    } else {
      const { head } = frontMatter(await fs.readFile(path.join(g, 'plugin-skill.md'), 'utf8'));
      assert.match(head, /^type: tool_used$/m); assert.match(head, /^tool: Skill$/m); assert.match(head, /comp-room/);
    }
  }
  assert.deepEqual(PLAN.evals.filter((c) => /no .*skill activation/i.test(c.expected_output)).map((c) => c.id), [6, 9]);
});

test('the cases grant only read-only built-in tools; MCP grants stay on the command line', async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  await writeEvalSuite(CANON, out);
  const { head } = frontMatter(await fs.readFile(path.join(out, (await fs.readdir(out)).sort()[0], 'prompt.md'), 'utf8'));
  assert.doesNotMatch(head, /mcp__/);
  assert.match(head, /^timeout_seconds: \d+$/m);
});

test('refuses to write into a folder that already holds files', async () => {
  const out = await tmp('evals-');
  await fs.writeFile(path.join(out, 'keep.txt'), 'x');
  await assert.rejects(writeEvalSuite(CANON, out), /not empty/);
});

test('the canonical evals: 22 planning cases and the picture cases, ids in order', () => {
  assert.equal(PLAN.evals.length, 22);
  assert.deepEqual(CANON.evals.map((c) => c.id), CANON.evals.map((_, i) => i + 1));
  assert.deepEqual(PICTURES.map((c) => c.picture.check), ['keying', 'grade', 'over', 'finish', 'review', 'seat', 'curve', 'footage']);
  for (const c of PICTURES) {
    for (const f of c.files) assert.ok(f.startsWith('picture/'), f);
    assert.ok(c.files.includes(`picture/${c.picture.setup}`));
    assert.match(c.prompt, new RegExp(`\`${c.picture.setup.replace('.', '\\.')}\``));
    assert.match(c.prompt, new RegExp(`node grade\\.mjs ${c.picture.check} --plan`));
    assert.match(c.prompt, /render queue/);
    assert.match(c.expected_output, /scores 0 on every picture check by construction/);
  }
});

test('the grade prompt names the same reference regions the grader samples', async () => {
  const { GRADE } = await import('../../plugin/evals/picture/scenes.mjs');
  const prompt = PICTURES.find((c) => c.picture.check === 'grade').prompt;
  for (const [name, b] of Object.entries(GRADE.regions)) assert.ok(prompt.includes(`${name} (${b.x}, ${b.y}, ${b.width}, ${b.height})`), name);
});

test('the review prompt hands over the same brief the setup returns, and the review is its own skill\'s job', async () => {
  const { REVIEW } = await import('../../plugin/evals/picture/scenes.mjs');
  const c = PICTURES.find((x) => x.picture.check === 'review');
  assert.ok(c.prompt.includes(`The brief: ${REVIEW.brief} `));
  assert.match(claudePrompt(c.prompt), /^\/comp-room:motion-review /);
  assert.match(c.prompt, /do not decode/);
});

test('the default set leaves the picture cases out', async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  const cases = await writeEvalSuite(CANON, out);
  assert.equal(cases.length, PLAN.evals.length);
  for (const dir of await fs.readdir(out)) {
    const { head } = frontMatter(await fs.readFile(path.join(out, dir, 'prompt.md'), 'utf8'));
    assert.doesNotMatch(head, /Bash|picture/);
  }
});

// The footage case is written only when its clip is named; these tests write the set without one.
const NO_CLIP = {};
const WRITTEN = PICTURES.filter((c) => !c.picture.footage);

test('the picture set: each case carries its setup, grader and runtime copy, a scoped Bash grant and one regex grader per check', async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  const cases = await writeEvalSuite(CANON, out, { set: 'picture', env: NO_CLIP });
  assert.deepEqual(cases.map((c) => c.id), WRITTEN.map((c) => c.id));
  assert.deepEqual(cases.skipped.map((s) => s.id), [27]);
  assert.match(cases.skipped[0].why, /COMP_ROOM_EVAL_FOOTAGE/);
  const dirs = (await fs.readdir(out)).sort();
  assert.match(dirs[0], /^18-/);
  const modules = await moduleClosure(path.join(ROOT, 'plugin', 'runtime', 'dist'));
  for (const m of GRADER_MODULES) assert.ok(modules.includes(m), m);
  for (const [i, c] of WRITTEN.entries()) {
    const dir = path.join(out, dirs[i]);
    for (const f of ['grade.mjs', 'checks.mjs', 'scenes.mjs', c.picture.setup, 'grade-config.json']) await fs.access(path.join(dir, 'files', f));
    for (const m of modules) await fs.access(path.join(dir, 'files', 'runtime', m));
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(dir, 'files', 'grade-config.json'), 'utf8')), { runtimeDist: 'runtime' });
    const { head, body } = frontMatter(await fs.readFile(path.join(dir, 'prompt.md'), 'utf8'));
    assert.ok(head.includes('"Bash(node grade.mjs:*)"'), head);
    assert.match(head, /^tags: \[picture\]$/m);
    assert.ok(body.includes(`the setup script is \`${c.picture.setup}\``));
    assert.ok(body.includes(`\`node grade.mjs ${c.picture.check} --plan\``));
    assert.ok(!body.includes(out), 'no path into the eval directory');
    assert.equal(await fs.readFile(path.join(dir, 'case.yaml'), 'utf8'), `schema_version: "1.1"\nname: ${dirs[i]}\ncontext:\n  scaffold_script: scaffold.sh\n`);
    const ids = THRESHOLDS[c.picture.check].filter((t) => !t.setup).map((t) => t.id);
    const files = (await fs.readdir(path.join(dir, 'graders'))).filter((f) => f.startsWith('check-')).sort();
    assert.deepEqual(files, ids.map((id) => `check-${id}.md`).sort());
    for (const id of ids) {
      const g = frontMatter(await fs.readFile(path.join(dir, 'graders', `check-${id}.md`), 'utf8'));
      assert.match(g.head, /^type: regex$/m);
      assert.match(g.head, /^target: \{source: file, path: picture-grade\/verdict\.txt\}$/m);
      assert.doesNotMatch(g.head, /^flags:/m);                            // the runner documents only `i`
      const re = new RegExp(g.head.match(/^pattern: '(.*)'$/m)[1]);
      assert.ok(re.test(`PICTURE-GRADE x\nPICTURE-CHECK ${c.picture.check}.${id} PASS | measured: a | value: 1 | limit: 2\n`));
      assert.ok(re.test(`PICTURE-CHECK ${c.picture.check}.${id} PASS | measured: a | value: 1 | limit: 2\n`));
      assert.ok(!re.test(`PICTURE-CHECK ${c.picture.check}.${id} FAIL | measured: a | value: 1 | limit: 2\n`));
      assert.ok(!re.test(`x PICTURE-CHECK ${c.picture.check}.${id} PASS | measured: a\n`));
    }
    assert.equal(cases[i].graders, c.assertions.length + ids.length);
    // the skill indicator is scored in a one-arm run: only where the prompt asks for a skill
    const skill = (await fs.readdir(path.join(dir, 'graders'))).includes('plugin-skill.md');
    assert.equal(skill, /\$[a-z]/.test(c.prompt), `case ${c.id}`);
  }
  const cmd = pictureCommand('/copy', cases);
  assert.match(cmd, / -j 1 /);
  assert.match(cmd, / --ablation none /);
  assert.match(cmd, / --no-publish /);
  assert.match(cmd, / --scaffold /);
  assert.match(cmd, /__ae_do /);
  assert.match(cmd, /__ae_render_frame /);
  assert.equal(cmd.split("'Bash(node grade.mjs:*)'").length, 2, 'the grader grant once');
});

test('the run arguments: one run, no no-plugin arm, the report kept local, and a tool can be withheld', () => {
  const cases = [{ id: 21, bash: 'Bash(node /x/grade.mjs:*)' }];
  const args = evalArgs('/copy', cases, { set: 'picture', withhold: ['ae_check_comp'], extra: ['--case', '21-*'] });
  assert.deepEqual(args.slice(0, 3), ['plugin', 'eval', '/copy']);
  for (const [flag, value] of [['--runs', '1'], ['-j', '1'], ['--ablation', 'none'], ['--threshold', '0'], ['--case', '21-*']]) assert.equal(args[args.indexOf(flag) + 1], value, flag);
  assert.ok(args.includes('--no-publish') && args.includes('--allow-real-servers') && args.includes('--scaffold'));
  assert.ok(!args.some((a) => a.endsWith('__ae_check_comp')));
  assert.ok(args.some((a) => a.endsWith('__ae_render_frame')) && args.includes('Bash(node /x/grade.mjs:*)'));
  const planning = evalArgs('/copy', [], { runs: 3 });
  assert.equal(planning[planning.indexOf('--runs') + 1], '3');
  assert.ok(!planning.some((a) => /__ae_do$|__ae_render_frame$|^Bash/.test(a)));
});

test("a case's scaffold copies its files into an empty workspace, and the grader runs there on its own runtime", async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  await writeEvalSuite(CANON, out, { set: 'picture', env: NO_CLIP });
  const dir = path.join(out, (await fs.readdir(out)).sort()[2]);
  const workspace = await tmp('workspace-');
  await promisify(execFile)('bash', [path.join(dir, 'scaffold.sh')], { cwd: workspace, env: { PATH: process.env.PATH, HOME: workspace } });
  for (const f of ['grade.mjs', 'checks.mjs', 'scenes.mjs', 'over-still.jsx', 'grade-config.json', 'runtime/color/sheet.js']) await fs.access(path.join(workspace, f));
  await fs.rm(out, { recursive: true, force: true });                     // nothing in the eval directory to fall back on
  const { stdout } = await promisify(execFile)(process.execPath, ['grade.mjs', 'over'], { cwd: workspace });
  assert.match(stdout, /^PICTURE-RESULT over 0\/2 checks passed$/m);
  await fs.access(path.join(workspace, 'picture-grade', 'verdict.txt'));  // where the regex graders read it
});

test('the picture set refuses a runtime build older than its sources', async () => {
  const base = await tmp('stale-');
  const dist = path.join(base, 'dist'), src = path.join(base, 'src');
  for (const m of await moduleClosure(path.join(ROOT, 'plugin', 'runtime', 'dist'))) {
    await fs.mkdir(path.dirname(path.join(dist, m)), { recursive: true });
    await fs.copyFile(path.join(ROOT, 'plugin', 'runtime', 'dist', m), path.join(dist, m));
  }
  await fs.mkdir(path.join(src, 'color'), { recursive: true });
  await fs.writeFile(path.join(src, 'color', 'sheet.ts'), '// changed after the build\n');
  const old = new Date(Date.now() - 60_000);
  await fs.utimes(path.join(dist, 'color', 'sheet.js'), old, old);
  await assert.rejects(writeEvalSuite(CANON, path.join(base, 'evals'), { set: 'picture', runtimeDist: dist, env: NO_CLIP }), /dist\/color\/sheet\.js is older than src\/color\/sheet\.ts/);
  const now = new Date(Date.now() + 5_000);
  await fs.utimes(path.join(dist, 'color', 'sheet.js'), now, now);
  const cases = await writeEvalSuite(CANON, path.join(base, 'evals2'), { set: 'picture', runtimeDist: dist, env: NO_CLIP });
  assert.equal(cases.length, WRITTEN.length);
});

// The subject-matte planning case (stages 12, 12b): it passes only when the answer gives the manual-click notice up
// front, every click step from keying.md word for word and in order, and subject.check before further building with a
// hole shown to the user.
const SUBJECT = PLAN.evals.find((c) => c.answer_checks?.includes('subject-steps'));
const CHECK = 'After you say done, and before anything else is built, I run subject.check: it renders the cut-out across the clip, and if it finds a hole (a missed microphone) I stop and show you the picture.';
const STEPS = await subjectSteps();
const NOTICE = 'One step here needs you in After Effects: a single click on you in the clip, about ten seconds, once the footage is in its comp and before the background goes behind you.';
const PLAN_BODY = Array.from({ length: 12 }, (_, i) => `Beat ${i + 1}, frames ${i * 75} to ${i * 75 + 74}: the title and the background move as described, with holds and eases chosen from the motion language.`).join('\n');
const list = (steps) => steps.map((t, i) => `${i + 1}. ${t}`).join('\n');
const FILE = 'Then I render the cut-out once with subject.render_cutout, check every frame of the file with subject.check_file, and build the piece on it with subject.use_cutout.';
const answer = ({ notice = NOTICE, steps = STEPS, noticeLast = false, check = CHECK, file = FILE } = {}) =>
  noticeLast ? `Story proposal.\n\n${PLAN_BODY}\n\n${list(steps)}\n\n${check}\n\n${file}\n\n${notice}` : `${notice}\n\nStory proposal.\n\nThe click:\n\n${list(steps)}\n\n${check}\n\n${file}\n\n${PLAN_BODY}\n`;
const ALL_PASS = { 'subject-notice-first': true, 'subject-steps': true, 'subject-check-first': true, 'subject-file-first': true };
const verdict = async (text) => Object.fromEntries((await checkAnswer(SUBJECT, text)).map((r) => [r.id, r.pass]));

test('the subject-matte case: a footage brief with no green screen, graded by both answer checks', () => {
  assert.ok(SUBJECT, 'a planning case with answer checks');
  assert.match(SUBJECT.prompt, /no green screen/);
  assert.match(SUBJECT.prompt, /stop before After Effects/);
  assert.deepEqual(SUBJECT.answer_checks, ['subject-notice-first', 'subject-steps', 'subject-check-first', 'subject-file-first']);
  assert.equal(STEPS.length, 7);
  for (const id of SUBJECT.answer_checks) assert.ok(ANSWER_CHECKS[id]);
  assert.match(SUBJECT.assertions.join(' '), /ten seconds/);
  assert.match(SUBJECT.assertions.join(' '), /seven click steps/);
  assert.match(SUBJECT.assertions.join(' '), /subject\.check right after the click and before anything else is built/);
  const withChecks = CANON.evals.filter((x) => x.answer_checks).map((x) => x.id);
  assert.deepEqual(withChecks, [23, 28, 29, 30]);
  for (const c of CANON.evals) for (const id of c.answer_checks ?? []) assert.ok(ANSWER_CHECKS[id], `case ${c.id}: ${id}`);
});

test('the subject-matte case passes an answer with the notice first, the steps and the check before building', async () => {
  assert.deepEqual(await verdict(answer()), ALL_PASS);
  // The clip's name and the subject filled in, markdown emphasis and curly quotes still pass.
  const filled = STEPS.map((t, i) => i === 0 ? t.replace("the clip's name", '"desk-talk.mov"')
    : i === 4 ? 'Move the pointer over **yourself** in the Layer panel. You tint magenta. Click once.'
    : i === 5 ? t.replace('Do not click the person again.', 'Do not click yourself again.')
    : t.replace(/"([^"]*)"/g, '“$1”'));
  assert.deepEqual(await verdict(answer({ steps: filled })), ALL_PASS);
});

test('the subject-matte case fails without the notice, with it last, or with a step changed, dropped or moved', async () => {
  const noNotice = await verdict(answer({ notice: 'Here is the plan.' }));
  assert.equal(noNotice['subject-notice-first'], false);
  assert.equal((await verdict(answer({ notice: 'One manual click in After Effects will be needed.' })))['subject-notice-first'], false); // no time given
  assert.equal((await verdict(answer({ noticeLast: true })))['subject-notice-first'], false);
  const paraphrased = STEPS.map((t, i) => i === 1 ? 'Pick the Object Matte Tool in the toolbar.' : t);
  assert.equal((await verdict(answer({ steps: paraphrased })))['subject-steps'], false);
  assert.equal((await verdict(answer({ steps: STEPS.slice(0, 5) })))['subject-steps'], false);
  const swapped = [STEPS[0], STEPS[2], STEPS[1], ...STEPS.slice(3)];
  assert.equal((await verdict(answer({ steps: swapped })))['subject-steps'], false);
  assert.equal((await verdict(answer({ steps: STEPS.map((t) => t.replace('No Spacebar and no Freeze are needed.', 'Then press Spacebar.')) })))['subject-steps'], false);
});

test('the subject-matte case fails without subject.check, with it not before building, or with no hole shown', async () => {
  assert.equal((await verdict(answer({ check: 'After you say done I look at the cut-out.' })))['subject-check-first'], false);
  // the order shown rather than said: the check with the hole shown, then the render after it, passes; the same check
  // after the render and the build does not
  assert.equal((await verdict(answer({ check: 'Then I run subject.check and show you the picture of any hole.' })))['subject-check-first'], true);
  assert.equal((await verdict(answer({ check: '', file: `${FILE} Then I run subject.check and show you the picture of any hole.` })))['subject-check-first'], false);
  assert.equal((await verdict(answer({ check: 'Before anything else is built I run subject.check on the cut-out.' })))['subject-check-first'], false);
  // An opening counts as well as a hole: the missed microphone ran off the frame edge.
  assert.equal((await verdict(answer({ check: 'Before anything else is built I run subject.check; an opening it finds, such as a missed microphone, I show you in its picture.' })))['subject-check-first'], true);
  // A selection count instead of the check: the run of 2026-11-11.
  assert.equal((await verdict(answer({ check: 'subject.status says 2 objects selected, so the cut-out is done before anything else is built.' })))['subject-check-first'], false);
});

test('the subject-matte checks accept the plain words a plan for the user uses, and still require the order', async () => {
  // as a run's plan put it (case 23, 2026-11-14): the quick check, then render once, check the file, build on it
  const quick = 'Quick check. I check the cut-out around the frame you clicked. If any part of you is missing or there are holes, I\u2019ll tell you right away and show you the picture.';
  const once = 'Render once. I render the cut-out to a file with transparency. Then I check every frame of that file, and I build the piece on the file rather than the live cut-out.';
  assert.deepEqual(await verdict(answer({ check: quick, file: once })), ALL_PASS);
  // "If anything is missing, I'll tell you … with a picture" counts as the hole shown
  const missing = '**Quick check** (seconds): holes and openings around the click frame. If anything is missing, I\u2019ll tell you in plain words with a picture path before doing anything else.';
  assert.equal((await verdict(answer({ check: missing, file: once })))['subject-check-first'], true);
  // building on the file before checking it fails, in plain words as with the names
  assert.equal((await verdict(answer({ file: 'Render the cut-out once to a movie with alpha, then build on that file. File check: subject.check_file reads every frame.' })))['subject-file-first'], false);
  // a general check of the edges is not the check of the cut-out (the switched-off answers' kind)
  assert.equal((await verdict(answer({ check: 'I check your outline over bright magenta and measure flicker on still frames.', file: once })))['subject-check-first'], false);
  assert.equal((await verdict(answer({ check: quick, file: 'Then it renders the matte for all 900 frames, and I check the result frame by frame.' })))['subject-file-first'], false);
});

test('the subject-matte case fails without the render and the file check, or with them out of order', async () => {
  const v = async (file) => (await verdict(answer({ file })))['subject-file-first'];
  assert.equal(await v('Then I build the piece on the live matte.'), false);
  assert.equal(await v('Then I render it with subject.render_cutout and build on it.'), false);
  assert.equal(await v('First subject.check_file, then subject.render_cutout.'), false);
  assert.equal(await v('I render with subject.render_cutout, put it in with subject.use_cutout, then run subject.check_file.'), false);
  assert.equal(await v(FILE), true);
});

test('answer checks refuse a name they do not know', async () => {
  await assert.rejects(checkAnswer({ id: 99, answer_checks: ['nope'] }, 'x'), /unknown answer check nope/);
});

// The answer checks are scored by the runner: each is a regex grader on the final answer with the very pattern the
// offline check uses (no flags; YAML single quotes, quotes doubled).
const unyaml = (head) => head.match(/^pattern: '(.*)'$/m)[1].replace(/''/g, "'");

test('a case with answer checks gets one regex grader per check, the same pattern the offline check runs', async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  const cases = await writeEvalSuite(CANON, out);
  const dirs = (await fs.readdir(out)).sort();
  for (const [i, c] of PLAN.evals.entries()) {
    const g = path.join(out, dirs[i], 'graders');
    const files = (await fs.readdir(g)).filter((f) => f.startsWith('answer-')).sort();
    assert.deepEqual(files, (c.answer_checks ?? []).map((id) => `answer-${id}.md`).sort(), `case ${c.id}`);
    for (const id of c.answer_checks ?? []) {
      const { head, body } = frontMatter(await fs.readFile(path.join(g, `answer-${id}.md`), 'utf8'));
      assert.match(head, /^type: regex$/m);
      assert.doesNotMatch(head, /^(flags|target):/m);                     // the final message, no flags
      assert.equal(unyaml(head), await answerPattern(id));
      assert.ok(body.includes(ANSWER_CHECKS[id].what));
    }
    assert.equal(cases[i].graders, c.assertions.length + (c.answer_checks?.length ?? 0));
  }
  // the grader's pattern, read back from the file, gives the offline verdict on the case's own answers
  const i = PLAN.evals.findIndex((c) => c === SUBJECT);
  for (const id of SUBJECT.answer_checks) {
    const re = new RegExp(unyaml(frontMatter(await fs.readFile(path.join(out, dirs[i], 'graders', `answer-${id}.md`), 'utf8')).head));
    assert.equal(re.test(answer()), true, id);
    assert.equal(re.test(answer({ notice: 'Here is the plan.', steps: STEPS.slice(0, 3), check: 'Then I look.', file: 'Then I build.' })), false, id);
  }
});

test(`the notice counts as up front when it starts within the first ${NOTICE_LIMIT} characters`, async () => {
  const pad = (n) => `${'Background on the piece, which runs to length. '.repeat(Math.ceil(n / 47)).slice(0, n)}\n\n`;
  const early = `${pad(NOTICE_LIMIT - 300)}${answer()}`;
  const late = `${pad(NOTICE_LIMIT + 300)}${answer()}`;
  assert.equal((await verdict(early))['subject-notice-first'], true);
  assert.equal((await verdict(late))['subject-notice-first'], false);
  // the first sentence that names the click must carry the time, or one of the next two sentences
  const split = answer({ notice: 'One manual click in After Effects will be needed. It comes once the footage is in. It takes about ten seconds.' });
  assert.equal((await verdict(split))['subject-notice-first'], true);
  const tooFar = answer({ notice: 'One manual click in After Effects will be needed. It comes once the footage is in. Then I build. It takes about ten seconds.' });
  assert.equal((await verdict(tooFar))['subject-notice-first'], false);
});

const byCase = (id) => CANON.evals.find((c) => c.id === id);
const passes = async (id, text) => Object.fromEntries((await checkAnswer(byCase(id), text)).map((r) => [r.id, r.pass]));

test('the hand-over case passes an answer that lints and delivers with both presets, and fails one that does not', async () => {
  assert.deepEqual(await passes(28, 'Before hand-over I run project.lint and fix or name each finding. Then render.deliver with vertical-reel for the reel and master-alpha for the master, and I check each file.'),
    { 'handover-lint': true, 'handover-deliver': true });
  assert.deepEqual(await passes(28, 'I tidy the layer names, render H.264 and ProRes 4444 from the render queue and watch both files.'),
    { 'handover-lint': false, 'handover-deliver': false });
  assert.equal((await passes(28, 'project.lint first; render.deliver with vertical-reel.'))['handover-deliver'], false);   // no master with alpha
});

test('the teardown case passes an answer that measures the file and compares the build, and fails one that does not', async () => {
  assert.deepEqual(await passes(29, 'I run video.shots for the cuts, video.census for how much moves and video.track on each move, then motion.compare_moves on the render.'),
    { 'teardown-measures': true, 'teardown-compare': true });
  assert.deepEqual(await passes(29, 'I watch the reference, count the cuts by eye and match the timing by feel.'),
    { 'teardown-measures': false, 'teardown-compare': false });
  assert.equal((await passes(29, 'video.shots and video.track, then motion.compare_moves.'))['teardown-measures'], false); // no census
});

test('the pixel headline case passes an answer with the builders and the word on its first frame, and fails one without', async () => {
  assert.deepEqual(await passes(30, 'Each beat: leadIn, then heroWord on the voice’s first frame of the stressed word, then pixelBlocks and cardStack.'),
    { 'pixel-builders': true, 'pixel-word-lands': true });
  assert.deepEqual(await passes(30, 'Each beat shows a big bold word with a glow and some blocks, timed to the sentence.'),
    { 'pixel-builders': false, 'pixel-word-lands': false });
  assert.equal((await passes(30, 'The giant word lands on the **first frame** of that **word** in the voice.'))['pixel-word-lands'], true);
});

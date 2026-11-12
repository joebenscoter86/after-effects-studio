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

import { writeEvalSuite, claudePrompt, pictureCommand, checkAnswer, subjectSteps, ANSWER_CHECKS } from '../claude-evals.mjs';
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
    assert.equal(body.trim(), claudePrompt(c.prompt).trim());
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

test('the canonical evals: 18 planning cases and the picture cases, ids in order', () => {
  assert.equal(PLAN.evals.length, 18);
  assert.deepEqual(CANON.evals.map((c) => c.id), CANON.evals.map((_, i) => i + 1));
  assert.deepEqual(PICTURES.map((c) => c.picture.check), ['keying', 'grade', 'over', 'finish', 'review']);
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

test('the picture set: each case carries its setup and grader, a scoped Bash grant and one regex grader per check', async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  const dist = path.join(ROOT, 'plugin', 'runtime', 'dist');
  const cases = await writeEvalSuite(CANON, out, { set: 'picture', runtimeDist: dist });
  assert.deepEqual(cases.map((c) => c.id), PICTURES.map((c) => c.id));
  const dirs = (await fs.readdir(out)).sort();
  assert.match(dirs[0], /^18-/);
  for (const [i, c] of PICTURES.entries()) {
    const dir = path.join(out, dirs[i]);
    for (const f of ['grade.mjs', 'checks.mjs', 'scenes.mjs', c.picture.setup, 'grade-config.json']) await fs.access(path.join(dir, f));
    const { head, body } = frontMatter(await fs.readFile(path.join(dir, 'prompt.md'), 'utf8'));
    assert.ok(head.includes(`"Bash(node ${path.join(dir, 'grade.mjs')}:*)"`), head);
    assert.match(head, /^tags: \[picture\]$/m);
    assert.ok(body.includes(path.join(dir, c.picture.setup)));
    const ids = THRESHOLDS[c.picture.check].filter((t) => !t.setup).map((t) => t.id);
    const files = (await fs.readdir(path.join(dir, 'graders'))).filter((f) => f.startsWith('check-')).sort();
    assert.deepEqual(files, ids.map((id) => `check-${id}.md`).sort());
    for (const id of ids) {
      const g = frontMatter(await fs.readFile(path.join(dir, 'graders', `check-${id}.md`), 'utf8'));
      assert.match(g.head, /^type: regex$/m);
      assert.match(g.head, /^target: \{source: file, path: picture-grade\/verdict\.txt\}$/m);
      const pattern = g.head.match(/^pattern: '(.*)'$/m)[1];
      const re = new RegExp(pattern, 'm');
      assert.ok(re.test(`x\nPICTURE-CHECK ${c.picture.check}.${id} PASS | measured: a | value: 1 | limit: 2\n`));
      assert.ok(!re.test(`PICTURE-CHECK ${c.picture.check}.${id} FAIL | measured: a | value: 1 | limit: 2\n`));
    }
    assert.equal(cases[i].graders, c.assertions.length + ids.length);
  }
  const cmd = pictureCommand('/copy', cases);
  assert.match(cmd, / -j 1 /);
  assert.match(cmd, /ae_do'/);
  assert.match(cmd, /ae_render_frame'/);
  for (const c of cases) assert.ok(cmd.includes(`'${c.bash}'`));
});

test('a picture case\'s copied grader runs from the case folder with its config', async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  await writeEvalSuite(CANON, out, { set: 'picture', runtimeDist: path.join(ROOT, 'plugin', 'runtime', 'dist') });
  const dir = path.join(out, (await fs.readdir(out)).sort()[2]);
  const cwd = await tmp('run-');
  const { stdout } = await promisify(execFile)(process.execPath, [path.join(dir, 'grade.mjs'), 'over'], { cwd });
  assert.match(stdout, /^PICTURE-RESULT over 0\/2 checks passed$/m);
});

test('the picture set refuses to guess where the runtime is', async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  await assert.rejects(writeEvalSuite(CANON, out, { set: 'picture' }), /no runtime\/dist/);
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
const answer = ({ notice = NOTICE, steps = STEPS, noticeLast = false, check = CHECK } = {}) =>
  noticeLast ? `Story proposal.\n\n${PLAN_BODY}\n\n${list(steps)}\n\n${check}\n\n${notice}` : `${notice}\n\nStory proposal.\n\nThe click:\n\n${list(steps)}\n\n${check}\n\n${PLAN_BODY}\n`;
const ALL_PASS = { 'subject-notice-first': true, 'subject-steps': true, 'subject-check-first': true };
const verdict = async (text) => Object.fromEntries((await checkAnswer(SUBJECT, text)).map((r) => [r.id, r.pass]));

test('the subject-matte case: a footage brief with no green screen, graded by both answer checks', () => {
  assert.ok(SUBJECT, 'a planning case with answer checks');
  assert.match(SUBJECT.prompt, /no green screen/);
  assert.match(SUBJECT.prompt, /stop before After Effects/);
  assert.deepEqual(SUBJECT.answer_checks, ['subject-notice-first', 'subject-steps', 'subject-check-first']);
  assert.equal(STEPS.length, 7);
  for (const id of SUBJECT.answer_checks) assert.ok(ANSWER_CHECKS[id]);
  assert.match(SUBJECT.assertions.join(' '), /ten seconds/);
  assert.match(SUBJECT.assertions.join(' '), /seven click steps/);
  assert.match(SUBJECT.assertions.join(' '), /subject\.check right after the click and before anything else is built/);
  for (const c of CANON.evals.filter((x) => x !== SUBJECT)) assert.equal(c.answer_checks, undefined, `case ${c.id}`);
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
  assert.equal((await verdict(answer({ check: 'Then I run subject.check and show you the picture of any hole.' })))['subject-check-first'], false);
  assert.equal((await verdict(answer({ check: 'Before anything else is built I run subject.check on the cut-out.' })))['subject-check-first'], false);
  // An opening counts as well as a hole: the missed microphone ran off the frame edge.
  assert.equal((await verdict(answer({ check: 'Before anything else is built I run subject.check; an opening it finds, such as a missed microphone, I show you in its picture.' })))['subject-check-first'], true);
  // A selection count instead of the check: the run of 2026-11-11.
  assert.equal((await verdict(answer({ check: 'subject.status says 2 objects selected, so the cut-out is done before anything else is built.' })))['subject-check-first'], false);
});

test('answer checks refuse a name they do not know', async () => {
  await assert.rejects(checkAnswer({ id: 99, answer_checks: ['nope'] }, 'x'), /unknown answer check nope/);
});

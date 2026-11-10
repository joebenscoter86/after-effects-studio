// Tests for the converter that turns the canonical plugin/evals prompts into a `claude plugin eval` suite.
// Run: node --test 'release/tests/*.test.mjs'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeEvalSuite, claudePrompt } from '../claude-evals.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CANON = JSON.parse(await fs.readFile(path.join(ROOT, 'plugin', 'evals', 'evals.json'), 'utf8'));
const tmp = (prefix) => fs.mkdtemp(path.join(os.tmpdir(), prefix));

function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
  assert.ok(m, 'front matter block');
  return { head: m[1], body: m[2] };
}

test('writes one case per canonical prompt, in order', async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  const cases = await writeEvalSuite(CANON, out);
  assert.equal(cases.length, CANON.evals.length);
  const dirs = (await fs.readdir(out)).sort();
  assert.equal(dirs.length, CANON.evals.length);
  assert.match(dirs[0], /^01-/);
  assert.match(dirs.at(-1), new RegExp(`^${String(CANON.evals.length).padStart(2, '0')}-`));
});

test('the prompt body is the canonical prompt, with Codex skill syntax made Claude syntax', async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  await writeEvalSuite(CANON, out);
  for (const [i, c] of CANON.evals.entries()) {
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
  for (const [i, c] of CANON.evals.entries()) {
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
  const read = async (id, k) => { const i = CANON.evals.findIndex((c) => c.id === id);
    return frontMatter(await fs.readFile(path.join(out, (await fs.readdir(out)).sort()[i], 'graders', `assertion-${k}.md`), 'utf8')).head; };
  assert.match(await read(5, 1), /^focus: trace$/m);                     // "Trace records typography/SKILL.md ..."
  assert.match(await read(6, 1), /^focus: trace$/m);                     // "No typography or other motion skill file is read."
  assert.doesNotMatch(await read(1, 1), /^focus:/m);                     // the authored build's composition, in the answer
});

test('negative controls score a no-plugin-skill check; every other case reports whether a plugin skill fired', async () => {
  const out = path.join(await tmp('evals-'), 'evals');
  await writeEvalSuite(CANON, out);
  const dirs = (await fs.readdir(out)).sort();
  for (const [i, c] of CANON.evals.entries()) {
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
  assert.deepEqual(CANON.evals.filter((c) => /no .*skill activation/i.test(c.expected_output)).map((c) => c.id), [6, 9]);
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

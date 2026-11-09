#!/usr/bin/env node
// Turns the canonical plugin/evals/evals.json prompts into a `claude plugin eval` suite: one case folder per prompt
// (prompt.md) with one LLM grader per canonical assertion. The suite is written into a copy of the Claude package
// for a run and is not shipped in the package.
//
//   node release/claude-evals.mjs --out <plugin copy>/evals
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_NAME = 'after-effects-studio';
// Read-only built-ins only. The plugin's MCP tools are granted on the command line (`--allow-tools`), read tools only,
// so no case can change the open After Effects project.
export const ALLOWED_TOOLS = ['Read', 'Glob', 'Grep', 'Skill', 'ToolSearch'];
export const READ_TOOLS = ['ae_library', 'ae_catalog', 'ae_context', 'ae_version_info', 'ae_project_info', 'ae_comp_info', 'ae_layer_info']
  .map((t) => `mcp__plugin_${PLUGIN_NAME}_${PLUGIN_NAME}__${t}`);
export const MAX_TURNS = 20;
export const TIMEOUT_SECONDS = 600;
const SKILLS = 'motion-studio|typography|paper-collage|motion-review|ae-control|visual-styles';
const SKILL_MATCH = `'"skill"\\s*:\\s*"(?:${PLUGIN_NAME}:)?(?:${SKILLS})"'`;
// An assertion about what the session did (reads, skill choice, operations) is judged on the trace, not the answer.
const PROCESS = /trace|\bread\b|skill|operation|mutation|AE call|handoff|selection|asset creation/i;
const NEGATIVE = /no .*skill activation/i;

// Codex invokes a skill with `$name`; Claude with `/<plugin>:<name>` at the start of the prompt.
export function claudePrompt(prompt) {
  const lead = prompt.match(/^Use \$([a-z][a-z-]*) to (\w)([\s\S]*)$/);
  if (lead) return `/${PLUGIN_NAME}:${lead[1]} ${lead[2].toUpperCase()}${lead[3]}`;
  return prompt.replace(/\$([a-z][a-z-]*)\b/g, `the ${PLUGIN_NAME}:$1 skill`);
}

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 6).join('-');

function graderText(assertion, expected) {
  const trace = PROCESS.test(assertion);
  return `---\ntype: llm\nweight: 1\n${trace ? 'focus: trace\n' : ''}---\n\n` +
    `Judge the agent's ${trace ? 'session (its tool calls, the files it read and its final response)' : 'final response'} against one requirement.\n\n` +
    `Requirement: ${assertion}\n\nContext, what a strong answer contains overall: ${expected}\n\nPass when the requirement is clearly met, fail when it is not.\n`;
}

// Negative controls must not load a plugin skill in either arm; elsewhere a plugin skill firing is an indicator, not a score.
const skillGrader = (negative) => negative
  ? `---\ntype: tool_used\ntool: Skill\ninput_match: ${SKILL_MATCH}\nmin: 0\nmax: 0\narm: both\n---\n\nNo ${PLUGIN_NAME} skill is loaded for an unrelated request.\n`
  : `---\ntype: tool_used\ntool: Skill\ninput_match: ${SKILL_MATCH}\n---\n\nA ${PLUGIN_NAME} skill was loaded.\n`;

export async function writeEvalSuite(canon, outDir) {
  try { if ((await fs.readdir(outDir)).length) throw new Error(`${outDir} is not empty`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const width = String(canon.evals.length).length < 2 ? 2 : String(canon.evals.length).length;
  const cases = [];
  for (const [i, c] of canon.evals.entries()) {
    const name = `${String(i + 1).padStart(width, '0')}-${slug(c.prompt)}`, dir = path.join(outDir, name);
    await fs.mkdir(path.join(dir, 'graders'), { recursive: true });
    await fs.writeFile(path.join(dir, 'prompt.md'),
      `---\nmax_turns: ${MAX_TURNS}\ntimeout_seconds: ${TIMEOUT_SECONDS}\nallowed_tools: [${ALLOWED_TOOLS.join(', ')}]\n---\n\n${claudePrompt(c.prompt)}\n`);
    for (const [k, a] of c.assertions.entries()) await fs.writeFile(path.join(dir, 'graders', `assertion-${k + 1}.md`), graderText(a, c.expected_output));
    const negative = NEGATIVE.test(c.expected_output);
    await fs.writeFile(path.join(dir, 'graders', negative ? 'no-plugin-skill.md' : 'plugin-skill.md'), skillGrader(negative));
    cases.push({ id: c.id, name, graders: c.assertions.length });
  }
  return cases;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--out');
  if (i < 0 || !process.argv[i + 1]) { console.error('usage: node release/claude-evals.mjs --out <plugin copy>/evals'); process.exit(2); }
  const canon = JSON.parse(await fs.readFile(path.join(ROOT, 'plugin', 'evals', 'evals.json'), 'utf8'));
  const cases = await writeEvalSuite(canon, path.resolve(process.argv[i + 1]));
  console.log(`wrote ${cases.length} cases, ${cases.reduce((n, c) => n + c.graders, 0)} graders`);
}

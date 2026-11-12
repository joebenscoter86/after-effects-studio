#!/usr/bin/env node
// Turns the canonical plugin/evals/evals.json prompts into a `claude plugin eval` suite: one case folder per prompt
// (prompt.md) with one LLM grader per canonical assertion. The suite is written into a copy of the Claude package
// for a run and is not shipped in the package.
//
// Two sets, never mixed in one suite, because they need different grants:
//   planning (default): the cases without `picture`. Read-only: no case can change the open After Effects project.
//   picture: the cases with `picture` (evals that score a rendered frame). Each case builds a synthetic shot in the
//     open project, works on it, renders the frames the grader names and runs the grader once
//     (plugin/evals/picture/grade.mjs); one regex grader per check reads the verdict file. They need write tools,
//     a scoped Bash grant for the grader, an 8 bpc test project with no working space, and one run at a time.
//
//   node release/claude-evals.mjs --out <plugin copy>/evals [--set planning|picture]
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_NAME = JSON.parse(await fs.readFile(path.join(ROOT, 'claude', 'src', 'plugin.json'), 'utf8')).name;
// Read-only built-ins only. The plugin's MCP tools are granted on the command line (`--allow-tools`), read tools only,
// so no case can change the open After Effects project.
export const ALLOWED_TOOLS = ['Read', 'Glob', 'Grep', 'Skill', 'ToolSearch'];
export const READ_TOOLS = ['ae_library', 'ae_catalog', 'ae_context', 'ae_version_info', 'ae_project_info', 'ae_comp_info', 'ae_layer_info']
  .map((t) => `mcp__plugin_${PLUGIN_NAME}_${PLUGIN_NAME}__${t}`);
export const MAX_TURNS = 20;
export const TIMEOUT_SECONDS = 600;
// Picture cases build, key or grade, measure and render: more turns and time, and the plugin's write tools.
export const PICTURE_MAX_TURNS = 80;
export const PICTURE_TIMEOUT_SECONDS = 1800;
export const PICTURE_TOOLS = ['ae_do', 'ae_render_frame', 'ae_check_comp'].map((t) => `mcp__plugin_${PLUGIN_NAME}_${PLUGIN_NAME}__${t}`);
const PICTURE_SRC = path.join(ROOT, 'plugin', 'evals', 'picture');
const PICTURE_SHARED = ['grade.mjs', 'checks.mjs', 'scenes.mjs'];
const VERDICT = 'picture-grade/verdict.txt';
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

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// One regex grader per picture check, read from the verdict the grader wrote in the run's working folder.
function pictureGrader(check, id) {
  return `---\ntype: regex\ntarget: {source: file, path: ${VERDICT}}\npattern: '^PICTURE-CHECK ${escapeRe(id)} PASS '\nflags: m\nweight: 1\n---\n\n` +
    `${id}: ${check.what}; limit ${check.min ?? ''}${check.min !== undefined && check.max !== undefined ? ' to ' : ''}${check.max ?? ''} ${check.unit}. ` +
    `Why: ${check.why} Source: ${check.source}.${check.guess ? ' The limit is partly a guess.' : ''}\n`;
}

/** Where the runtime the grader measures with lives: the package copy that holds the suite. */
async function findRuntimeDist(outDir) {
  for (let dir = path.resolve(outDir); ; dir = path.dirname(dir)) {
    const dist = path.join(dir, 'runtime', 'dist');
    try { await fs.access(path.join(dist, 'color', 'matte.js')); return dist; } catch { /* keep looking */ }
    if (path.dirname(dir) === dir) throw new Error(`no runtime/dist above ${outDir}: write the picture set into a package copy, or pass runtimeDist`);
  }
}

export async function writeEvalSuite(canon, outDir, { set = 'planning', runtimeDist } = {}) {
  if (!['planning', 'picture'].includes(set)) throw new Error(`unknown set ${set}`);
  try { if ((await fs.readdir(outDir)).length) throw new Error(`${outDir} is not empty`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const picture = set === 'picture';
  const chosen = canon.evals.filter((c) => !!c.picture === picture);
  const width = Math.max(2, String(Math.max(...canon.evals.map((c) => c.id))).length);
  const thresholds = picture ? (await import(pathToFileURL(path.join(PICTURE_SRC, 'checks.mjs')).href)).THRESHOLDS : null;
  const dist = picture ? (runtimeDist ?? await findRuntimeDist(outDir)) : null;
  const cases = [];
  for (const c of chosen) {
    const name = `${String(c.id).padStart(width, '0')}-${slug(c.prompt)}`, dir = path.resolve(outDir, name);
    await fs.mkdir(path.join(dir, 'graders'), { recursive: true });
    let prompt = claudePrompt(c.prompt), head = `max_turns: ${MAX_TURNS}\ntimeout_seconds: ${TIMEOUT_SECONDS}\nallowed_tools: [${ALLOWED_TOOLS.join(', ')}]\n`;
    let bash = null;
    if (picture) {
      for (const f of [...PICTURE_SHARED, c.picture.setup]) await fs.copyFile(path.join(PICTURE_SRC, f), path.join(dir, f));
      await fs.writeFile(path.join(dir, 'grade-config.json'), `${JSON.stringify({ runtimeDist: dist }, null, 2)}\n`);
      const grader = path.join(dir, 'grade.mjs');
      bash = `Bash(node ${grader}:*)`;
      prompt += `\n\nThis case's files: the setup script is ${path.join(dir, c.picture.setup)} (read it and pass its whole text as eval.run's code). ` +
        `Run the grader as \`node ${grader} ${c.picture.check} --plan\` and, at the end, \`node ${grader} ${c.picture.check}\`, from your working folder.`;
      head = `max_turns: ${PICTURE_MAX_TURNS}\ntimeout_seconds: ${PICTURE_TIMEOUT_SECONDS}\nallowed_tools: [${[...ALLOWED_TOOLS, `"${bash}"`].join(', ')}]\ntags: [picture]\n`;
    }
    await fs.writeFile(path.join(dir, 'prompt.md'), `---\n${head}---\n\n${prompt}\n`);
    for (const [k, a] of c.assertions.entries()) await fs.writeFile(path.join(dir, 'graders', `assertion-${k + 1}.md`), graderText(a, c.expected_output));
    const checks = picture ? thresholds[c.picture.check].filter((t) => !t.setup) : [];
    for (const check of checks) await fs.writeFile(path.join(dir, 'graders', `check-${check.id}.md`), pictureGrader(check, `${c.picture.check}.${check.id}`));
    const negative = NEGATIVE.test(c.expected_output);
    await fs.writeFile(path.join(dir, 'graders', negative ? 'no-plugin-skill.md' : 'plugin-skill.md'), skillGrader(negative));
    cases.push({ id: c.id, name, graders: c.assertions.length + checks.length, ...(bash ? { bash } : {}) });
  }
  return cases;
}

/** The `claude plugin eval` command for a written picture suite (one run at a time: one After Effects). */
export function pictureCommand(pluginCopy, cases) {
  const tools = [...READ_TOOLS, ...PICTURE_TOOLS, ...cases.map((c) => c.bash)].map((t) => `'${t}'`).join(' ');
  return `claude plugin eval ${pluginCopy} --runs 1 -j 1 --allow-real-servers --no-publish --threshold 0 --allow-tools ${tools}`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (flag) => { const i = process.argv.indexOf(flag); return i < 0 ? undefined : process.argv[i + 1]; };
  const out = arg('--out'), set = arg('--set') ?? 'planning';
  if (!out || !['planning', 'picture'].includes(set)) {
    console.error('usage: node release/claude-evals.mjs --out <plugin copy>/evals [--set planning|picture]'); process.exit(2);
  }
  const canon = JSON.parse(await fs.readFile(path.join(ROOT, 'plugin', 'evals', 'evals.json'), 'utf8'));
  const cases = await writeEvalSuite(canon, path.resolve(out), { set });
  console.log(`wrote ${cases.length} ${set} cases, ${cases.reduce((n, c) => n + c.graders, 0)} graders`);
  if (set === 'picture') {
    console.log('Run against an 8 bpc test project with no working space, with After Effects open and nothing else in it that matters:');
    console.log(pictureCommand(path.dirname(path.resolve(out)), cases));
  }
}

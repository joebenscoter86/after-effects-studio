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

// Answer checks: a planning case's `answer_checks` names checks that read the agent's final answer without a model.
// They are run offline here (release tests give each a passing and failing answer); the suite still grades the case
// with its LLM assertions. The click steps are read from keying.md, where subject.prepare's text is quoted.
const KEYING_MD = path.join(ROOT, 'plugin', 'library', 'references', 'keying.md');

/** The click steps as keying.md quotes them ("Tell the user first"), in order. */
export async function subjectSteps() {
  const md = await fs.readFile(KEYING_MD, 'utf8');
  const sec = md.split('\n### Tell the user first\n')[1]?.split('\n### ')[0];
  if (!sec) throw new Error('keying.md has no "Tell the user first" section');
  const steps = [...sec.matchAll(/^(\d+)\. (.+)$/gm)].map((m) => m[2]);
  if (steps.length < 6) throw new Error(`keying.md quotes ${steps.length} click steps; expected at least 6`);
  return steps;
}

// Straight quotes, no markdown emphasis or quote markers, one space: a step pasted into a list or a blockquote still reads the same.
const plain = (t) => t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\*\*|__|`/g, '').replace(/^\s*>\s?/gm, '').replace(/\s+/g, ' ');

/** A step as a pattern: its words exactly, with the clip's name (step 1) and the subject (step 4) free. */
function stepPattern(step) {
  let re = escapeRe(plain(step));
  re = re.replace(escapeRe("the clip's name"), `(?:the clip's name|"[^"]{1,80}"|[^)]{1,80})`);
  re = re.replace(escapeRe('over the person in the Layer panel. They tint magenta.'),
    '(?:over the person in the Layer panel\\. They tint magenta\\.|over [^.]{1,60} in the Layer panel\\. [^.]{1,60} tints? magenta\\.)');
  re = re.replace(escapeRe('Do not click the person again.'), 'Do not click [^.]{1,60} again\\.');
  return new RegExp(re);
}

export const ANSWER_CHECKS = {
  'subject-notice-first': {
    what: 'the answer says up front that one manual click in After Effects is needed and that it takes about ten seconds',
    async check(answer) {
      const text = plain(answer);
      // A sentence (or two) naming a manual step or a click by the user, and about ten seconds.
      const m = text.match(/[^.!?]*(?:manual|by hand|your click|you(?:'ll| will)? (?:need to )?click|one click|a single click)[^.!?]*[.!?](?:[^.!?]*[.!?]){0,2}/i);
      if (!m || !/\b(?:ten|10) seconds\b/i.test(m[0])) return { pass: false, why: 'no notice of a manual click that takes about ten seconds' };
      // Up front: within the first quarter of the answer (at least its first 1200 characters), and before the steps.
      const limit = Math.max(1200, Math.floor(text.length / 4));
      if (m.index > limit) return { pass: false, why: `the notice starts at character ${m.index}, after the first ${limit}` };
      const step2 = text.search(stepPattern((await subjectSteps())[1]));
      if (step2 >= 0 && step2 < m.index) return { pass: false, why: 'the notice comes after the steps' };
      return { pass: true, why: `notice at character ${m.index}` };
    },
  },
  'subject-steps': {
    what: "the answer gives the click steps from keying.md word for word and in order (the clip's name and the subject may be filled in)",
    async check(answer) {
      const text = plain(answer);
      let from = 0;
      for (const [i, step] of (await subjectSteps()).entries()) {
        const m = stepPattern(step).exec(text.slice(from));
        if (!m) return { pass: false, why: `step ${i + 1} is missing, changed or out of order: ${step}` };
        from += m.index + m[0].length;
      }
      return { pass: true, why: 'every step, in order' };
    },
  },
  'subject-check-first': {
    what: 'the answer runs subject.check after the click and before anything else is built, and says a hole or opening it finds is shown to the user',
    async check(answer) {
      const text = plain(answer);
      const at = [...text.matchAll(/subject\.check/g)].map((m) => m.index);
      if (!at.length) return { pass: false, why: 'subject.check is not in the plan' };
      const before = /before (?:any|anything|further|more|other|the rest)\b[^.]{0,60}?\b(?:build|built|building|compositing|composite|else|work)/i;
      if (!at.some((i) => before.test(text.slice(Math.max(0, i - 300), i + 300))))
        return { pass: false, why: 'subject.check is not said to come before anything else is built' };
      if (!/\b(?:show|picture)[^.]{0,150}\b(?:hole|opening)|\b(?:hole|opening)[^.]{0,150}\b(?:show|picture)/i.test(text))
        return { pass: false, why: 'the answer does not say a hole or opening is shown to the user' };
      return { pass: true, why: `subject.check at character ${at[0]}, before further building, with the hole shown` };
    },
  },
  'subject-file-first': {
    what: 'the answer renders the cut-out once (subject.render_cutout) and checks the file (subject.check_file) before building on it',
    async check(answer) {
      const text = plain(answer);
      const render = text.search(/subject\.render_cutout/);
      const file = text.search(/subject\.check_file/);
      if (render < 0) return { pass: false, why: 'subject.render_cutout is not in the plan' };
      if (file < 0) return { pass: false, why: 'subject.check_file is not in the plan' };
      if (file < render) return { pass: false, why: 'the file is checked before it is rendered' };
      const use = text.search(/subject\.use_cutout/);
      if (use >= 0 && use < file) return { pass: false, why: 'the file is built on before it is checked' };
      return { pass: true, why: 'render, then check the file, then build on it' };
    },
  },
};

/** Run a case's answer checks on an answer: [{ id, pass, why }]. */
export async function checkAnswer(c, answer) {
  const out = [];
  for (const id of c.answer_checks ?? []) {
    const check = ANSWER_CHECKS[id];
    if (!check) throw new Error(`case ${c.id}: unknown answer check ${id}`);
    out.push({ id, ...(await check.check(answer)) });
  }
  return out;
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
    if (!picture && c.files?.length) {
      // a planning case's own files (a look sheet, say), copied beside it and named in the prompt
      for (const f of c.files) { await fs.mkdir(path.dirname(path.join(dir, f)), { recursive: true }); await fs.copyFile(path.join(PICTURE_SRC, '..', f), path.join(dir, f)); }
      prompt += `\n\nThis case's files: ${c.files.map((f) => `${f} is ${path.join(dir, f)}`).join('; ')}.`;
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

#!/usr/bin/env node
// Turns the canonical plugin/evals/evals.json prompts into a `claude plugin eval` suite: one case folder per prompt
// (prompt.md) with one LLM grader per canonical assertion. The suite is written into a copy of the Claude package
// for a run and is not shipped in the package.
//
// Two sets, never mixed in one suite, because they need different grants:
//   planning (default): the cases without `picture`. Read-only: no case can change the open After Effects project.
//     A case's `answer_checks` become regex graders on the final answer, the same patterns the offline check uses.
//   picture: the cases with `picture` (evals that score a rendered frame). Each case builds a synthetic shot in the
//     open project, works on it, renders the frames the grader names and runs the grader once
//     (plugin/evals/picture/grade.mjs); one regex grader per check reads the verdict file. They need write tools,
//     a scoped Bash grant for the grader, an 8 bpc test project with no working space, and one run at a time.
//     Each case carries its own copy of the runtime modules the grader measures with (copied from
//     plugin/runtime/dist, refused when dist is older than its sources), so a suite runs wherever it is written.
//     The footage case (27) is written only when COMP_ROOM_EVAL_FOOTAGE names a clip; its plate is measured from
//     that clip here, with ffmpeg, before any session starts.
//
//   node release/claude-evals.mjs --out <plugin copy>/evals [--set planning|picture]
import { existsSync } from 'node:fs';
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

/** The runtime build the picture grader measures with, and the modules it loads (checks.mjs loadRuntime). */
export const RUNTIME_DIST = path.join(ROOT, 'plugin', 'runtime', 'dist');
export const GRADER_MODULES = ['color/matte.js', 'color/screen.js', 'color/sheet.js', 'color/png16.js'];
// A fresh checkout writes src and dist in the same second or two, in no set order.
const FRESH_SLACK_MS = 2000;

// Codex invokes a skill with `$name`; Claude with `/<plugin>:<name>` at the start of the prompt.
export function claudePrompt(prompt) {
  const lead = prompt.match(/^Use \$([a-z][a-z-]*) to (\w)([\s\S]*)$/);
  if (lead) return `/${PLUGIN_NAME}:${lead[1]} ${lead[2].toUpperCase()}${lead[3]}`;
  return prompt.replace(/\$([a-z][a-z-]*)\b/g, `the ${PLUGIN_NAME}:$1 skill`);
}

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 6).join('-');
// A YAML single-quoted scalar: quotes doubled, nothing else escaped.
const yamlQuote = (s) => `'${s.replace(/'/g, "''")}'`;

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

// One regex grader per picture check, read from the verdict the grader wrote in the run's working folder. The
// pattern finds the line without regex flags (the runner documents only `i`).
function pictureGrader(check, id) {
  return `---\ntype: regex\ntarget: {source: file, path: ${VERDICT}}\npattern: '(?:^|\\n)PICTURE-CHECK ${escapeRe(id)} PASS '\nweight: 1\n---\n\n` +
    `${id}: ${check.what}; limit ${check.min ?? ''}${check.min !== undefined && check.max !== undefined ? ' to ' : ''}${check.max ?? ''} ${check.unit}. ` +
    `Why: ${check.why} Source: ${check.source}.${check.guess ? ' The limit is partly a guess.' : ''}\n`;
}

// ---------------------------------------------------------------------------
// The grader's own copy of the runtime modules
// ---------------------------------------------------------------------------

const IMPORT = /(?:^|[\s;])(?:import|export)\s[^'"`;]*?from\s*(['"])([^'"]+)\1|(?:^|[\s;])import\s*\(\s*(['"])([^'"]+)\3\s*\)|(?:^|[\s;])import\s*(['"])([^'"]+)\5/g;

/** The dist files `entries` import, and theirs in turn (relative imports; node: built-ins are left as they are). */
export async function moduleClosure(distDir, entries = GRADER_MODULES) {
  const seen = new Set();
  const visit = async (rel) => {
    if (seen.has(rel)) return;
    seen.add(rel);
    const text = await fs.readFile(path.join(distDir, rel), 'utf8');
    for (const m of text.matchAll(IMPORT)) {
      const spec = m[2] ?? m[4] ?? m[6];
      if (spec.startsWith('node:')) continue;
      if (!spec.startsWith('.')) throw new Error(`${rel} imports ${spec}: the grader's modules may import only each other and node: built-ins`);
      await visit(path.posix.normalize(path.posix.join(path.posix.dirname(rel), spec)));
    }
  };
  for (const e of entries) await visit(e);
  return [...seen].sort();
}

/** Refuse when a module is older than its TypeScript source: dist was not rebuilt after a change. */
export async function assertFresh(distDir, files) {
  const src = path.join(distDir, '..', 'src');
  for (const rel of files) {
    const ts = rel.replace(/\.js$/, '.ts');
    let s;
    try { s = await fs.stat(path.join(src, ts)); } catch { continue; }
    const d = await fs.stat(path.join(distDir, rel));
    if (s.mtimeMs > d.mtimeMs + FRESH_SLACK_MS) {
      throw new Error(`dist/${rel} is older than src/${ts}: rebuild the runtime (npx tsc in plugin/runtime) before writing the picture set`);
    }
  }
}

// ---------------------------------------------------------------------------
// Answer checks: regex patterns on the raw final answer
// ---------------------------------------------------------------------------
// A planning case's `answer_checks` names checks that read the agent's final answer without a model. Each is one
// JavaScript regex, with no flags, on the answer as written: release tests run it offline on passing and failing
// answers, and the suite writes it as a regex grader, so the runner scores the same pattern. The click steps are read
// from keying.md, where subject.prepare's text is quoted.
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

// Markdown emphasis or code marks, which may sit beside any word or punctuation.
const MARK = '(?:\\*\\*|__|`)';
// One space between words: any whitespace, with emphasis, code or blockquote marks round it.
const GAP = `(?:${MARK}|>|\\s)*\\s(?:${MARK}|>|\\s)*`;
const QUOTE = { "'": "['‘’]", '‘': "['‘’]", '’': "['‘’]", '"': '["“”]', '“': '["“”]', '”': '["“”]' };
const wordChar = (c) => /[\p{L}\p{N}]/u.test(c);

/** Literal words as a pattern on the raw answer: either quote style, a gap between words, marks beside punctuation. */
export function rawText(text, { caseless = false } = {}) {
  return text.trim().split(/\s+/).map((word) => {
    const chars = [...word];
    return chars.map((ch, i) => {
      let out = QUOTE[ch] ?? (caseless && /[a-z]/i.test(ch) ? `[${ch.toLowerCase()}${ch.toUpperCase()}]` : escapeRe(ch));
      const next = chars[i + 1];
      if (next !== undefined && (!wordChar(ch) || !wordChar(next))) out += `${MARK}*`;
      return out;
    }).join('');
  }).join(GAP);
}
const ci = (t) => rawText(t, { caseless: true });

// Parts of a step that subject.prepare fills in: the clip's name (step 1) and the subject (steps 5 and 6).
const FREE = [
  ["the clip's name", () => `(?:${rawText("the clip's name")}|["“”][^"“”]{1,80}["“”]|[^)]{1,80})`],
  ['over the person in the Layer panel. They tint magenta.', () => `(?:${rawText('over the person in the Layer panel. They tint magenta.')}|` +
    `${rawText('over')}${GAP}[^.]{1,60}${GAP}${rawText('in the Layer panel.')}${GAP}[^.]{1,60}${GAP}${rawText('tint')}s?${GAP}${rawText('magenta.')})`],
  ['Do not click the person again.', () => `${rawText('Do not click')}${GAP}[^.]{1,60}${GAP}${rawText('again.')}`],
];

/** A click step as a pattern: its words exactly, with the clip's name and the subject free. */
export function stepPattern(step) {
  const hits = FREE.map(([lit, pat]) => ({ at: step.indexOf(lit), lit, pat })).filter((h) => h.at >= 0).sort((a, b) => a.at - b.at);
  const parts = [];
  let from = 0;
  for (const h of hits) { parts.push({ text: step.slice(from, h.at) }, { pattern: h.pat() }); from = h.at + h.lit.length; }
  parts.push({ text: step.slice(from) });
  let out = '';
  for (const p of parts) {
    if (p.pattern) { out += p.pattern; continue; }
    if (!p.text) continue;
    const lead = /^\s/.test(p.text), trail = /\s$/.test(p.text), body = p.text.trim();
    if (out) out += lead ? GAP : `${MARK}*`;
    if (body) out += rawText(body);
    if (trail) out += GAP;
    else if (body) out += `${MARK}*`;
  }
  return out;
}

// The notice must start within this many characters of the answer's start (and before the steps). A regex cannot
// take a share of the answer's length, so the limit is fixed: about a quarter of a long plan.
export const NOTICE_LIMIT = 2000;

const KEY = `(?:${['manual', 'by hand', 'your click', 'one click', 'a single click'].map(ci).join('|')}|` +
  `${ci('you')}(?:${ci("'ll")}|${GAP}${ci('will')})?${GAP}(?:${ci('need to')}${GAP})?${ci('click')})`;
const TEN = `\\b(?:${ci('ten')}|10)${GAP}${ci('seconds')}\\b`;
const BEFORE = `${ci('before')}${GAP}(?:${['any', 'anything', 'further', 'more', 'other', 'the rest'].map(ci).join('|')})\\b[^.]{0,60}?\\b` +
  `(?:${['build', 'built', 'building', 'compositing', 'composite', 'else', 'work'].map(ci).join('|')})`;
const HOLE = `\\b(?:${ci('show')}|${ci('picture')})[^.]{0,150}\\b(?:${ci('hole')}|${ci('opening')})|\\b(?:${ci('hole')}|${ci('opening')})[^.]{0,150}\\b(?:${ci('show')}|${ci('picture')})`;

export const ANSWER_CHECKS = {
  'subject-notice-first': {
    what: `the answer says up front (starting within its first ${NOTICE_LIMIT} characters, and before the click steps) that one manual click in After Effects is needed, and within that sentence or the next two that it takes about ten seconds`,
    async pattern() {
      const step2 = stepPattern((await subjectSteps())[1]);
      // The first sentence naming a manual step or a click starts within the limit, with no step 2 before it, and
      // "ten seconds" is in that sentence or the next two.
      return `^(?:(?!${KEY}|${step2})[\\s\\S]){0,${NOTICE_LIMIT}}?(?=[^.!?]*${KEY})(?=(?:[^.!?]*[.!?]){0,2}[^.!?]*${TEN}[^.!?]*[.!?])`;
    },
  },
  'subject-steps': {
    what: "the answer gives the click steps from keying.md word for word and in order (the clip's name and the subject may be filled in)",
    async pattern() { return (await subjectSteps()).map(stepPattern).join('[\\s\\S]*?'); },
  },
  'subject-check-first': {
    what: 'the answer runs subject.check after the click and before anything else is built (said within 300 characters of it), and says a hole or opening it finds is shown to the user',
    async pattern() {
      const op = 'subject\\.check';
      return `^(?=[\\s\\S]*?(?:${BEFORE}[\\s\\S]{0,300}?${op}|${op}[\\s\\S]{0,300}?${BEFORE}))(?=[\\s\\S]*?(?:${HOLE}))`;
    },
  },
  'subject-file-first': {
    what: 'the answer renders the cut-out once (subject.render_cutout) and checks the file (subject.check_file) before building on it (subject.use_cutout)',
    async pattern() {
      return '^(?:(?!subject\\.(?:check_file|use_cutout))[\\s\\S])*?subject\\.render_cutout(?:(?!subject\\.use_cutout)[\\s\\S])*?subject\\.check_file';
    },
  },
  // Hand-over and delivery (stage 9): the operations and presets by name, which only its guidance gives.
  'handover-lint': {
    what: 'the answer names project.lint as the check before hand-over',
    async pattern() { return 'project\\.lint'; },
  },
  'handover-deliver': {
    what: 'the answer delivers with render.deliver and names the vertical-reel and master-alpha presets',
    async pattern() { return '^(?=[\\s\\S]*?render\\.deliver)(?=[\\s\\S]*?vertical-reel)(?=[\\s\\S]*?master-alpha)'; },
  },
  // Tearing down a reference from a file (stage 13).
  'teardown-measures': {
    what: 'the answer measures the reference with video.shots, video.census, and video.track or video.moves',
    async pattern() { return '^(?=[\\s\\S]*?video\\.shots)(?=[\\s\\S]*?video\\.census)(?=[\\s\\S]*?video\\.(?:track|moves))'; },
  },
  'teardown-compare': {
    what: 'the answer checks the build against the reference with motion.compare_moves',
    async pattern() { return 'motion\\.compare_moves'; },
  },
  // Building in the pixel headline style (stage 14): its builders and its rule for the giant word.
  'pixel-builders': {
    what: 'the answer names the style\'s builders heroWord and pixelBlocks',
    async pattern() { return '^(?=[\\s\\S]*?\\bheroWord\\b)(?=[\\s\\S]*?\\bpixelBlocks\\b)'; },
  },
  'pixel-word-lands': {
    what: 'the answer lands the giant word on the voice\'s first frame of that word (said within one sentence)',
    async pattern() { return `${ci('first frame')}[^.]{0,80}${ci('word')}|${ci('word')}[^.]{0,80}${ci('first frame')}`; },
  },
};

/** The answer check's pattern, by id. */
export async function answerPattern(id) {
  const check = ANSWER_CHECKS[id];
  if (!check) throw new Error(`unknown answer check ${id}`);
  return check.pattern();
}

/** Run a case's answer checks on an answer: [{ id, pass, why }]. */
export async function checkAnswer(c, answer) {
  const out = [];
  for (const id of c.answer_checks ?? []) {
    if (!ANSWER_CHECKS[id]) throw new Error(`case ${c.id}: unknown answer check ${id}`);
    const pass = new RegExp(await answerPattern(id)).test(answer);
    out.push({ id, pass, why: pass ? 'matches' : `does not match: ${ANSWER_CHECKS[id].what}` });
  }
  return out;
}

async function answerGrader(id) {
  return `---\ntype: regex\nweight: 1\npattern: ${yamlQuote(await answerPattern(id))}\n---\n\n` +
    `${ANSWER_CHECKS[id].what}. The pattern is the offline answer check \`${id}\` (release/claude-evals.mjs).\n`;
}

// ---------------------------------------------------------------------------
// The footage case: its clip, measured before any session
// ---------------------------------------------------------------------------

/** The plate's truth from the handed clip: frames 0 and 1 decoded with ffmpeg, measured by the grader's own code. */
export async function footageTruth(clip, distDir = RUNTIME_DIST) {
  const { FOOTAGE } = await import(pathToFileURL(path.join(PICTURE_SRC, 'scenes.mjs')).href);
  const { loadRuntime, measureFootageTruth } = await import(pathToFileURL(path.join(PICTURE_SRC, 'checks.mjs')).href);
  const video = await import(pathToFileURL(path.join(distDir, 'video', 'movie-rgb.js')).href);
  const info = await video.probeVideo(clip);
  if (info === null) throw new Error('the footage case needs ffmpeg and ffprobe on PATH');
  if ('error' in info) throw new Error(info.error);
  if (info.variableRate) throw new Error('the clip has a variable frame rate; hand the footage case a constant-rate clip');
  if (info.frames < FOOTAGE.minFrames) throw new Error(`the clip has ${info.frames} frames; the footage case needs at least ${FOOTAGE.minFrames}`);
  if (Math.max(info.width, info.height) > FOOTAGE.maxSide) {
    throw new Error(`the clip is ${info.width}x${info.height}; the footage case takes at most ${FOOTAGE.maxSide} px on the longer side (hand it a half-size copy)`);
  }
  const colour = await video.movieColour(clip);
  const frames = [];
  for await (const f of video.movieFrames(info, FOOTAGE.gradeFrames, colour)) frames.push(f.img);
  if (frames.length !== FOOTAGE.gradeFrames.length) throw new Error(`ffmpeg gave ${frames.length} of the clip's first frames`);
  return { ...measureFootageTruth(frames, await loadRuntime(distDir)), clip: { fps: info.nominalFps, frames: info.frames, colour: colour.reading } };
}

/** The footage setup with the clip and the plate region filled in (both JSON). */
export function footageSetup(text, clip, plateRegion) {
  const block = /\/\/ FOOTAGE-BEGIN\n[\s\S]*?\n\/\/ FOOTAGE-END/;
  if (!block.test(text)) throw new Error('the footage setup has no FOOTAGE-BEGIN / FOOTAGE-END block');
  return text.replace(block, () => `// FOOTAGE-BEGIN\nvar FOOTAGE_FILE = ${JSON.stringify(clip)};\nvar PLATE_REGION = ${JSON.stringify(plateRegion)};\n// FOOTAGE-END`);
}

export const FOOTAGE_NEEDS = 'a locked-off clip with grain and some still edges, at least 2 frames at a constant rate, at most 1920 px on its longer side, square pixels';

// ---------------------------------------------------------------------------
// The suite
// ---------------------------------------------------------------------------

const shellSingle = (s) => `'${s.replace(/'/g, "'\\''")}'`;

/**
 * case.yaml beside prompt.md (prompt.md's fields win; its graders are added), naming scaffold.sh: it runs in the
 * run's empty workspace before the session and copies the case's files/ into it. The runner does not tell the script
 * where the case is, so the path is written into it.
 */
async function writeScaffold(dir, name) {
  await fs.writeFile(path.join(dir, 'case.yaml'), `schema_version: "1.1"\nname: ${name}\ncontext:\n  scaffold_script: scaffold.sh\n`);
  await fs.writeFile(path.join(dir, 'scaffold.sh'), `#!/bin/bash\n# Copy this case's files into the run's workspace (the working folder).\nset -euo pipefail\ncp -R ${shellSingle(path.join(dir, 'files'))}/. .\n`, { mode: 0o755 });
}

/**
 * Write one set of cases into `outDir` (empty or missing). Returns the cases written; `skipped` on the array lists
 * cases not written and why (the footage case without its clip). `runtimeDist`: the dist the picture grader's modules
 * are copied from (default plugin/runtime/dist). `env`: where COMP_ROOM_EVAL_FOOTAGE is read (default process.env).
 */
export async function writeEvalSuite(canon, outDir, { set = 'planning', runtimeDist = RUNTIME_DIST, env = process.env } = {}) {
  if (!['planning', 'picture'].includes(set)) throw new Error(`unknown set ${set}`);
  try { if ((await fs.readdir(outDir)).length) throw new Error(`${outDir} is not empty`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const picture = set === 'picture';
  const chosen = canon.evals.filter((c) => !!c.picture === picture);
  const width = Math.max(2, String(Math.max(...canon.evals.map((c) => c.id))).length);
  const thresholds = picture ? (await import(pathToFileURL(path.join(PICTURE_SRC, 'checks.mjs')).href)).THRESHOLDS : null;
  let modules = null;
  if (picture) {
    modules = await moduleClosure(runtimeDist);
    await assertFresh(runtimeDist, modules);
  }
  const cases = [];
  cases.skipped = [];
  for (const c of chosen) {
    const footageVar = picture ? c.picture.footage : undefined;
    const clip = footageVar ? env[footageVar] : undefined;
    if (footageVar && !clip) {
      cases.skipped.push({ id: c.id, why: `case ${c.id} skipped: set ${footageVar} to a clip to write it (${FOOTAGE_NEEDS})` });
      continue;
    }
    const name = `${String(c.id).padStart(width, '0')}-${slug(c.prompt)}`, dir = path.resolve(outDir, name);
    await fs.mkdir(path.join(dir, 'graders'), { recursive: true });
    let prompt = claudePrompt(c.prompt), head = `max_turns: ${MAX_TURNS}\ntimeout_seconds: ${TIMEOUT_SECONDS}\nallowed_tools: [${ALLOWED_TOOLS.join(', ')}]\n`;
    let bash = null;
    // A run starts in an empty workspace and cannot read the eval directory, so a case's own files go in files/ and
    // its scaffold script copies them into the workspace before the session starts (`--scaffold`).
    const files = path.join(dir, 'files');
    if (picture) {
      await fs.mkdir(files, { recursive: true });
      for (const f of PICTURE_SHARED) await fs.copyFile(path.join(PICTURE_SRC, f), path.join(files, f));
      let setup = await fs.readFile(path.join(PICTURE_SRC, c.picture.setup), 'utf8');
      if (footageVar) {
        const truth = await footageTruth(path.resolve(clip), runtimeDist);
        await fs.writeFile(path.join(files, 'footage-truth.json'), `${JSON.stringify(truth, null, 2)}\n`);
        setup = footageSetup(setup, path.resolve(clip), truth.plateRegion);
      }
      await fs.writeFile(path.join(files, c.picture.setup), setup);
      for (const rel of modules) {
        await fs.mkdir(path.dirname(path.join(files, 'runtime', rel)), { recursive: true });
        await fs.copyFile(path.join(runtimeDist, rel), path.join(files, 'runtime', rel));
      }
      await fs.writeFile(path.join(files, 'grade-config.json'), `${JSON.stringify({ runtimeDist: 'runtime' }, null, 2)}\n`);
      bash = 'Bash(node grade.mjs:*)';
      prompt += `\n\nThis case's files are in your working folder: the setup script is \`${c.picture.setup}\` (read it and pass its whole text as eval.run's code). ` +
        `Run the grader as \`node grade.mjs ${c.picture.check} --plan\` and, at the end, \`node grade.mjs ${c.picture.check}\`, from your working folder.`;
      head = `max_turns: ${PICTURE_MAX_TURNS}\ntimeout_seconds: ${PICTURE_TIMEOUT_SECONDS}\nallowed_tools: [${[...ALLOWED_TOOLS, `"${bash}"`].join(', ')}]\ntags: [picture]\n`;
    }
    if (!picture && c.files?.length) {
      // a planning case's own files (a look sheet, say), copied into the workspace and named in the prompt
      for (const f of c.files) { await fs.mkdir(path.dirname(path.join(files, f)), { recursive: true }); await fs.copyFile(path.join(PICTURE_SRC, '..', f), path.join(files, f)); }
      prompt += `\n\nThis case's files are in your working folder: ${c.files.map((f) => `\`${f}\``).join(', ')}.`;
    }
    if (existsSync(files)) await writeScaffold(dir, name);
    await fs.writeFile(path.join(dir, 'prompt.md'), `---\n${head}---\n\n${prompt}\n`);
    for (const [k, a] of c.assertions.entries()) await fs.writeFile(path.join(dir, 'graders', `assertion-${k + 1}.md`), graderText(a, c.expected_output));
    const checks = picture ? thresholds[c.picture.check].filter((t) => !t.setup) : [];
    for (const check of checks) await fs.writeFile(path.join(dir, 'graders', `check-${check.id}.md`), pictureGrader(check, `${c.picture.check}.${check.id}`));
    const answers = c.answer_checks ?? [];
    for (const id of answers) await fs.writeFile(path.join(dir, 'graders', `answer-${id}.md`), await answerGrader(id));
    // With one arm the skill indicator is scored, so a picture case gets it only when its prompt asks for a skill.
    const negative = NEGATIVE.test(c.expected_output);
    if (!picture || /\$[a-z]/.test(c.prompt)) await fs.writeFile(path.join(dir, 'graders', negative ? 'no-plugin-skill.md' : 'plugin-skill.md'), skillGrader(negative));
    cases.push({ id: c.id, name, graders: c.assertions.length + checks.length + answers.length, ...(bash ? { bash } : {}) });
  }
  return cases;
}

// ---------------------------------------------------------------------------
// The command
// ---------------------------------------------------------------------------

/**
 * The `claude plugin eval` arguments for a written suite. One run per case and no no-plugin arm (`--ablation none`:
 * the picture cases cannot reach After Effects without the plugin, and the planning baseline is its own question);
 * the report stays local. Picture cases run one at a time (one After Effects). `withhold` leaves named plugin tools
 * out of the grant (`ae_check_comp`, say); `extra` adds arguments (`--case`, `--max-cost-usd`, `--trust-plugin`).
 */
export function evalArgs(pluginCopy, cases, { set = 'planning', runs = 1, withhold = [], extra = [] } = {}) {
  const picture = set === 'picture';
  const tools = [...READ_TOOLS, ...(picture ? PICTURE_TOOLS : []), ...cases.map((c) => c.bash).filter(Boolean)]
    .filter((t) => !withhold.some((w) => t === `mcp__plugin_${PLUGIN_NAME}_${PLUGIN_NAME}__${w}`));
  return ['plugin', 'eval', pluginCopy, '--runs', String(runs), '-j', picture ? '1' : '4', '--ablation', 'none',
    '--allow-real-servers', '--no-publish', '--threshold', '0', '--scaffold', ...extra, '--allow-tools', ...[...new Set(tools)]];
}

const shellQuote = (a) => (/^[\w@%+=:,./-]+$/.test(a) ? a : `'${a.replace(/'/g, "'\\''")}'`);

/** The command line, for a person to run. */
export const evalCommand = (pluginCopy, cases, opts) => ['claude', ...evalArgs(pluginCopy, cases, opts)].map(shellQuote).join(' ');
export const pictureCommand = (pluginCopy, cases, opts = {}) => evalCommand(pluginCopy, cases, { ...opts, set: 'picture' });

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (flag) => { const i = process.argv.indexOf(flag); return i < 0 ? undefined : process.argv[i + 1]; };
  const out = arg('--out'), set = arg('--set') ?? 'planning';
  if (!out || !['planning', 'picture'].includes(set)) {
    console.error('usage: node release/claude-evals.mjs --out <plugin copy>/evals [--set planning|picture]'); process.exit(2);
  }
  const canon = JSON.parse(await fs.readFile(path.join(ROOT, 'plugin', 'evals', 'evals.json'), 'utf8'));
  const cases = await writeEvalSuite(canon, path.resolve(out), { set });
  console.log(`wrote ${cases.length} ${set} cases, ${cases.reduce((n, c) => n + c.graders, 0)} graders`);
  for (const s of cases.skipped) console.log(s.why);
  if (set === 'picture') console.log('Run against an 8 bpc test project with no working space, with After Effects open and nothing else in it that matters:');
  console.log(evalCommand(path.dirname(path.resolve(out)), cases, { set }));
  if (!existsSync(path.join(path.dirname(path.resolve(out)), '.claude-plugin'))) console.log('(the folder above --out is not a plugin copy: write the suite into <copy>/evals)');
}

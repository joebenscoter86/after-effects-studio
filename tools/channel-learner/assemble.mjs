#!/usr/bin/env node
// Collect a video's checked recipes into one tracked draft and add the video to the credits.
//   node tools/channel-learner/assemble.mjs <study dir> [--out product/arsenal-drafts]
// Refuses unless every recipe passes recipeProblems: checks/<n>.md says "verdict: pass" and,
// when it has a "recipe:" line, names this recipe; checks/layout-<n>.md, when there,
// says "layout verdict: pass"; and the newest of those is no older than the recipe.
import fs from 'node:fs';
import path from 'node:path';

const readIf = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
const mtime = (p) => fs.statSync(p).mtimeMs;

/** Recipes that may not be assembled, each with its reason, in file order. */
export function recipeProblems(study) {
  const files = fs.readdirSync(path.join(study, 'recipes')).filter((f) => f.endsWith('.md')).sort();
  const out = [];
  for (const f of files) {
    const n = f.slice(0, 2);
    const checkPath = path.join(study, 'checks', `${n}.md`);
    const layoutPath = path.join(study, 'checks', `layout-${n}.md`);
    const check = readIf(checkPath);
    const layout = readIf(layoutPath);
    const named = check?.match(/^recipe:\s*(\S+)/m)?.[1].replace(/\.md$/, '');
    let reason = null;
    if (!check || !/^verdict:\s*pass/m.test(check)) reason = 'no passing check';
    else if (named && named !== f.replace(/\.md$/, '')) reason = 'check names another recipe';
    else if (layout !== null && !/^layout verdict:\s*pass/m.test(layout)) reason = 'layout check failed';
    else {
      const newest = Math.max(mtime(checkPath), layout !== null ? mtime(layoutPath) : -Infinity);
      if (newest < mtime(path.join(study, 'recipes', f))) reason = 'edited after its check';
    }
    if (reason) out.push({ recipe: f, reason });
  }
  return out;
}

export function assemble(study, outDir) {
  const info = JSON.parse(fs.readFileSync(path.join(study, 'source.info.json'), 'utf8'));
  const problems = recipeProblems(study);
  if (problems.length) throw new Error(`refused: ${problems.map((p) => `${p.recipe} (${p.reason})`).join('; ')}`);
  const files = fs.readdirSync(path.join(study, 'recipes')).filter((f) => f.endsWith('.md')).sort();
  const rows = [], bodies = [];
  for (const f of files) {
    const n = f.slice(0, 2);
    const text = fs.readFileSync(path.join(study, 'recipes', f), 'utf8').trim();
    const check = fs.readFileSync(path.join(study, 'checks', `${n}.md`), 'utf8');
    const round = (check.match(/^round:\s*(\d)/m) || [, '1'])[1];
    const name = (text.match(/^## (.+)$/m) || [, f])[1];
    const jobs = (text.match(/^jobs: (.+)$/m) || [, ''])[1];
    rows.push(`| ${n} | ${name} | ${jobs} | ${round} |`);
    bodies.push(text);
  }
  const head = [
    `# Techniques from one video (${files.length} recipes, all unproven)`, '',
    'Written by the channel learner from the video\'s narration and screen together, then checked against the video by a second reader. Every recipe here passed that check; none has been accepted by Joe, and none is in the plugin. `status: unproven` means it has not been built in After Effects and compared with the tutorial\'s own result.', '',
    'Each step is marked `said` (narrated), `shown` (on screen; `fNNNNNN` is a frame in the local study folder, frame number divided by the video\'s frame rate is seconds) or `inferred` (our reading). The `source` and frame references are for checking and stay out of the plugin. Credits: `CREDITS.md`.', '',
    '| # | Technique | Jobs | Check passed in round |', '|---|---|---|---|', ...rows, '',
  ];
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${info.id}.md`), `${head.join('\n')}\n${bodies.join('\n\n')}\n`);
  const creditsPath = path.join(outDir, 'CREDITS.md');
  let credits = fs.existsSync(creditsPath) ? fs.readFileSync(creditsPath, 'utf8') : '# Credits\n\n| Draft | Channel | Video |\n|---|---|---|\n';
  if (!credits.includes(`\`${info.id}.md\``)) {
    credits = `${credits.trimEnd()}\n| \`${info.id}.md\` | [${info.channel}](${info.channel_url}) | [${info.title}](https://www.youtube.com/watch?v=${info.id}) |\n`;
    fs.writeFileSync(creditsPath, credits);
  }
  return { id: info.id, recipes: files.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const study = process.argv[2];
  const at = process.argv.indexOf('--out');
  if (!study) { console.error('usage: assemble.mjs <study dir> [--out <dir>]'); process.exit(2); }
  try { console.log(assemble(study, at > 0 ? process.argv[at + 1] : 'product/arsenal-drafts')); }
  catch (e) { console.error(e.message); process.exit(1); }
}

#!/usr/bin/env node
// Collect a video's checked recipes into one tracked draft and add the video to the credits.
//   node tools/channel-learner/assemble.mjs <study dir> [--out product/arsenal-drafts]
// Refuses unless every recipe passes recipeProblems: checks/<n>.md says "verdict: pass" and,
// when it has a "recipe:" line, names this recipe; a recipe with "variant of:" has "merge: confirmed" in it;
// checks/layout-<n>.md, when there,
// says "layout verdict: pass"; and the newest of those is no older than the recipe.
import fs from 'node:fs';
import path from 'node:path';

const readIf = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
const mtime = (p) => fs.statSync(p).mtimeMs;

/** Recipes that may not be assembled, each with its reason, in file order. */
// "status: proven" counts only with the acceptance written beside it, e.g.
// "status: proven (accepted by Joe 2026-11-14: ...)"; only the owner proves a recipe.
export function statusOf(text) {
  const line = (text.match(/^status:\s*(.+)$/m) || [, 'unproven'])[1];
  return { proven: /^proven\b/.test(line), accepted: /\baccepted\b.*\d{4}-\d{2}-\d{2}/.test(line) };
}

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
    if (!reason) {
      const status = statusOf(fs.readFileSync(path.join(study, 'recipes', f), 'utf8'));
      if (status.proven && !status.accepted) reason = 'proven without a recorded acceptance';
    }
    // A variant's merge lines are checked against its parent (check.md check 11; LESSONS 14).
    if (!reason && /^variant of:/m.test(fs.readFileSync(path.join(study, 'recipes', f), 'utf8'))
      && !/^merge:\s*confirmed/m.test(check)) reason = 'variant without a confirmed merge';
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
  let proven = 0;
  for (const f of files) {
    const n = f.slice(0, 2);
    const text = fs.readFileSync(path.join(study, 'recipes', f), 'utf8').trim();
    const check = fs.readFileSync(path.join(study, 'checks', `${n}.md`), 'utf8');
    const round = (check.match(/^round:\s*(\d)/m) || [, '1'])[1];
    const name = (text.match(/^## (.+)$/m) || [, f])[1];
    const jobs = (text.match(/^jobs: (.+)$/m) || [, ''])[1];
    const status = statusOf(text).proven ? 'proven' : 'unproven';
    if (status === 'proven') proven += 1;
    rows.push(`| ${n} | ${name} | ${jobs} | ${round} | ${status} |`);
    bodies.push(text);
  }
  const head = [
    `# Techniques from one video (${files.length} recipes, ${proven ? `${proven} proven` : 'all unproven'})`, '',
    `Written by the channel learner from the video\'s narration and screen together, then checked against the video by a second reader. Every recipe here passed that check; none is in the plugin. \`status: proven\` means it was built in After Effects from the recipe alone, compared with the tutorial\'s own result, and accepted by Joe (${proven} of ${files.length}); \`status: unproven\` means it has not been.`, '',
    'Each step is marked `said` (narrated), `shown` (on screen; `fNNNNNN` is a frame in the local study folder, frame number divided by the video\'s frame rate is seconds) or `inferred` (our reading). The `source` and frame references are for checking and stay out of the plugin. Credits: `CREDITS.md`.', '',
    '| # | Technique | Jobs | Check passed in round | Status |', '|---|---|---|---|---|', ...rows, '',
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

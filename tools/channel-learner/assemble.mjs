#!/usr/bin/env node
// Collect a video's checked recipes into one tracked draft and add the video to the credits.
//   node tools/channel-learner/assemble.mjs <study dir> [--out product/arsenal-drafts]
// Refuses unless every recipe has a check file whose verdict is "pass".
import fs from 'node:fs';
import path from 'node:path';

export function assemble(study, outDir) {
  const info = JSON.parse(fs.readFileSync(path.join(study, 'source.info.json'), 'utf8'));
  const files = fs.readdirSync(path.join(study, 'recipes')).filter((f) => f.endsWith('.md')).sort();
  const rows = [], bodies = [], notPassed = [];
  for (const f of files) {
    const n = f.slice(0, 2);
    const text = fs.readFileSync(path.join(study, 'recipes', f), 'utf8').trim();
    const checkPath = path.join(study, 'checks', `${n}.md`);
    const check = fs.existsSync(checkPath) ? fs.readFileSync(checkPath, 'utf8') : '';
    if (!/^verdict:\s*pass/m.test(check)) { notPassed.push(f); continue; }
    const round = (check.match(/^round:\s*(\d)/m) || [, '1'])[1];
    const name = (text.match(/^## (.+)$/m) || [, f])[1];
    const jobs = (text.match(/^jobs: (.+)$/m) || [, ''])[1];
    rows.push(`| ${n} | ${name} | ${jobs} | ${round} |`);
    bodies.push(text);
  }
  if (notPassed.length) throw new Error(`not passed: ${notPassed.join(', ')}`);
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

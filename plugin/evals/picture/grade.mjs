#!/usr/bin/env node
// The picture evals' grader. The agent under test runs it twice from its
// working folder:
//
//   node grade.mjs <name> --plan   print what to hand in (the final ae_render_frame calls, paths in
//                                  ./picture-grade/, or the findings file and its form) and every check's limit
//   node grade.mjs <name>          grade what was handed in ONCE: print the verdict and write
//                                  picture-grade/verdict.txt and verdict.json
//
// A second grade is refused (exit 3) and leaves the first verdict as it was,
// so the verdict is the state the agent finished in. The eval suite's regex
// graders read picture-grade/verdict.txt, one PICTURE-CHECK line per check.
//
// The measurements come from the plugin's runtime (runtime/dist/color). It is
// found from grade-config.json next to this file ({ "runtimeDist": "<dir>" },
// written by release/claude-evals.mjs), else by walking up from this file to a
// folder holding runtime/dist/color/matte.js (the plugin, or a package copy).
import { existsSync, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { THRESHOLDS, formatVerdict, gradeDir, loadRuntime, renderPlan } from './checks.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

function runtimeDist() {
  const cfg = path.join(HERE, 'grade-config.json');
  if (existsSync(cfg)) return path.resolve(HERE, JSON.parse(readFileSync(cfg, 'utf8')).runtimeDist);
  for (let dir = HERE; ; dir = path.dirname(dir)) {
    const dist = path.join(dir, 'runtime', 'dist');
    if (existsSync(path.join(dist, 'color', 'matte.js'))) return dist;
    if (path.dirname(dir) === dir) throw new Error('cannot find runtime/dist/color/matte.js above the grader');
  }
}

const [name, ...rest] = process.argv.slice(2);
if (!name || !THRESHOLDS[name] || rest.some((a) => a !== '--plan')) {
  console.error(`usage: node grade.mjs <${Object.keys(THRESHOLDS).join('|')}> [--plan]`);
  process.exit(2);
}
const dir = path.join(await fs.realpath(process.cwd()), 'picture-grade');
const verdictFile = path.join(dir, 'verdict.txt');

if (rest.includes('--plan')) {
  await fs.mkdir(dir, { recursive: true });
  process.stdout.write(renderPlan(name, dir));
  process.exit(0);
}
if (existsSync(verdictFile)) {
  console.log(`already graded: ${verdictFile} stands; the grade runs once.`);
  process.exit(3);
}
const res = await gradeDir(name, dir, await loadRuntime(runtimeDist()));
const text = formatVerdict(name, res);
await fs.mkdir(dir, { recursive: true });
await fs.writeFile(path.join(dir, 'verdict.json'), JSON.stringify({ eval: name, ...res }, null, 2) + '\n');
await fs.writeFile(verdictFile, text);
process.stdout.write(text);

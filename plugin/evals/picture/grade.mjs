#!/usr/bin/env node
// The picture evals' grader. The agent under test runs it twice from its
// working folder:
//
//   node grade.mjs <name> --plan   print what to hand in (the final ae_render_frame calls, paths in
//                                  ./picture-grade/, or the findings file and its form) and every check's limit
//   node grade.mjs <name>          grade what was handed in ONCE: print the verdict and write
//                                  picture-grade/verdict.txt and verdict.json
//   node grade.mjs <name> --findings '<json>'
//                                  for the evals graded on findings (finish, review, curve): write
//                                  them to picture-grade/findings.json, then grade ONCE. A session
//                                  granted only this grader has no other way to write a file.
//
// A second grade is refused (exit 3) and leaves the first verdict as it was,
// so the verdict is the state the agent finished in. The eval suite's regex
// graders read picture-grade/verdict.txt, one PICTURE-CHECK line per check.
//
// The measurements come from the plugin's runtime (dist/color). In a written
// suite the case carries its own copy of the modules the grader needs, and
// grade-config.json next to this file says where ({ "runtimeDist": "runtime" },
// written by release/claude-evals.mjs). Without the config (run from the
// repository) it walks up from this file to a folder holding
// runtime/dist/color/matte.js. The footage eval also reads footage-truth.json,
// the plate as measured from the handed clip, next to this file.
import { existsSync, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { EVALS, THRESHOLDS, formatVerdict, gradeDir, loadRuntime, renderPlan } from './checks.mjs';

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
const planOnly = rest.length === 1 && rest[0] === '--plan';
const findingsArg = rest.length === 2 && rest[0] === '--findings' ? rest[1] : null;
if (!name || !THRESHOLDS[name] || (rest.length && !planOnly && findingsArg === null)) {
  console.error(`usage: node grade.mjs <${Object.keys(THRESHOLDS).join('|')}> [--plan | --findings '<json>']`);
  process.exit(2);
}
if (findingsArg !== null && !EVALS[name].findings) {
  console.error(`the ${name} eval is graded on its renders, not on findings: run node grade.mjs ${name} without --findings`);
  process.exit(2);
}
const dir = path.join(await fs.realpath(process.cwd()), 'picture-grade');
const verdictFile = path.join(dir, 'verdict.txt');

if (planOnly) {
  await fs.mkdir(dir, { recursive: true });
  process.stdout.write(renderPlan(name, dir));
  process.exit(0);
}
if (existsSync(verdictFile)) {
  console.log(`already graded: ${verdictFile} stands; the grade runs once.`);
  process.exit(3);
}
if (findingsArg !== null) {
  // Bad JSON is refused before anything is written, so the one grade is not spent on a quoting slip.
  let doc;
  try { doc = JSON.parse(findingsArg); } catch (error) {
    console.error(`the findings are not JSON (${error.message}); nothing was written or graded`);
    process.exit(2);
  }
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, EVALS[name].findings), `${JSON.stringify(doc, null, 2)}\n`);
}
const truthFile = path.join(HERE, 'footage-truth.json');
const truth = name === 'footage' && existsSync(truthFile) ? JSON.parse(readFileSync(truthFile, 'utf8')) : null;
const res = await gradeDir(name, dir, await loadRuntime(runtimeDist()), { truth });
const text = formatVerdict(name, res);
await fs.mkdir(dir, { recursive: true });
await fs.writeFile(path.join(dir, 'verdict.json'), JSON.stringify({ eval: name, ...res }, null, 2) + '\n');
await fs.writeFile(verdictFile, text);
process.stdout.write(text);

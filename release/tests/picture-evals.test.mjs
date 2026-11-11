// Offline tests for the picture evals' grading logic (plugin/evals/picture/):
// synthetic captures of each eval's scene, drawn by picture-model.mjs at full
// size, graded with the same runtime measurements ae_render_frame uses.
// Run: node --test 'release/tests/*.test.mjs'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import {
  THRESHOLDS, checkIds, formatVerdict, gradeGrade, gradeKeying, gradeOver, loadRuntime, renderPlan, EVALS,
} from '../../plugin/evals/picture/checks.mjs';
import { SCENES, GRADE } from '../../plugin/evals/picture/scenes.mjs';
import { gradeFrame, keyedFrame, keyingSource, overFile, undoGradeError, writePng } from './picture-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PICTURE = path.join(ROOT, 'plugin', 'evals', 'picture');
const DIST = path.join(ROOT, 'plugin', 'runtime', 'dist');
const FIXTURES = path.join(ROOT, 'plugin', 'runtime', 'tests', 'fixtures', 'png');
const rt = await loadRuntime(DIST);
const run = promisify(execFile);

const byId = (checks) => Object.fromEntries(checks.map((c) => [c.id.split('.').pop(), c]));
const failing = (checks) => checks.filter((c) => !c.pass).map((c) => c.id.split('.').pop()).sort();

// Built once: a key's frames take about half a second each to measure at 1080x1920.
const keyedOf = (kind) => KEYING_FRAMES.map((f) => keyedFrame(f, kind));
const KEYING_FRAMES = SCENES.keying.gradeFrames.keyed;
const SOURCE = keyingSource(SCENES.keying.gradeFrames.source);
const GOOD = gradeKeying({ source: SOURCE, keyed: keyedOf('good') }, rt);

test('every setup script carries the same scene the grader reads', async () => {
  for (const [name, ev] of Object.entries(EVALS)) {
    const jsx = await fs.readFile(path.join(PICTURE, ev.setup), 'utf8');
    const m = jsx.match(/\/\/ SCENE-BEGIN\n\s*var SCENE = (.*);\n\s*\/\/ SCENE-END/);
    assert.ok(m, `${ev.setup} has a SCENE block`);
    assert.deepEqual(JSON.parse(m[1]), SCENES[name], `${ev.setup} matches scenes.mjs`);
    assert.doesNotMatch(jsx, /renderQueue|executeCommand|beginUndoGroup|endUndoGroup|\.remove\(\)|app\.open|newProject|\.close\(/,
      `${ev.setup} uses no render queue, undo, removal or project switch`);
    assert.match(jsx, /bitsPerChannel/);
    assert.match(jsx, /workingSpace/);
  }
});

test('thresholds live in one table: every check has a limit, a reason and a source', () => {
  for (const [name, list] of Object.entries(THRESHOLDS)) {
    assert.ok(list.length >= 3, name);
    for (const t of list) {
      assert.match(t.id, /^[a-z]+(-[a-z]+)*$/, `${name}.${t.id}`);
      assert.ok(t.min !== undefined || t.max !== undefined || t.equals !== undefined, `${name}.${t.id} has a limit`);
      assert.ok(t.why.length > 20 && t.source.length > 1, `${name}.${t.id} says why and where from`);
      assert.equal(typeof t.guess, 'boolean');
    }
    assert.deepEqual(checkIds(name), list.filter((t) => !t.setup).map((t) => `${name}.${t.id}`));
  }
});

test('keying: a good key passes every check, with the numbers the model gives', () => {
  assert.deepEqual(failing(GOOD.setup), []);
  assert.deepEqual(failing(GOOD.checks), []);
  const c = byId(GOOD.checks);
  assert.ok(c['typical-width'].values.every((v) => v >= 4 && v <= 7), c['typical-width'].value);
  assert.ok(c['partial-share'].values.every((v) => v > 0.008 && v < 0.013), c['partial-share'].value);
  assert.ok(c['edge-flicker'].values[0] > 0 && c['edge-flicker'].values[0] < 0.04, c['edge-flicker'].value);
});

test('keying: a hard-edged key fails on edge width, and only on the edge', () => {
  const r = gradeKeying({ source: SOURCE, keyed: keyedOf('hard') }, rt);
  const fails = failing(r.checks);
  assert.ok(fails.includes('typical-width'), fails.join());
  for (const ok of ['screen-transparent', 'subject-opaque', 'stand-gone', 'largest-patch', 'specks']) assert.ok(!fails.includes(ok), ok);
});

test('keying: a screen left partly opaque fails on transparency, share, patch and the stand', () => {
  const r = gradeKeying({ source: SOURCE, keyed: keyedOf('half') }, rt);
  const fails = failing(r.checks);
  for (const f of ['screen-transparent', 'partial-share', 'largest-patch', 'stand-gone']) assert.ok(fails.includes(f), `${f} in ${fails}`);
  assert.ok(!fails.includes('subject-opaque'));
});

test('keying: captures without alpha, or of the wrong size, fail every check with the reason', async () => {
  const noAlpha = rt.png16.decodePng(await fs.readFile(path.join(FIXTURES, 'opaque-rgb16.png')));
  const small = rt.png16.decodePng(await fs.readFile(path.join(FIXTURES, 'matte-clean-rgba16.png')));
  for (const bad of [noAlpha, small]) {
    const r = gradeKeying({ source: SOURCE, keyed: KEYING_FRAMES.map(() => bad) }, rt);
    assert.equal(r.checks.length, checkIds('keying').length);
    for (const c of r.checks) { assert.equal(c.pass, false); assert.match(c.value, /alpha|size/); }
  }
});

test('keying: a source render that is not the built shot marks the run invalid', () => {
  const grey = { width: 1080, height: 1920, rgb: new Float64Array(1080 * 1920 * 3).fill(0.5), alpha: new Float64Array(1080 * 1920).fill(1), bitDepth: 8 };
  const r = gradeKeying({ source: grey, keyed: keyedOf('good') }, rt);
  assert.ok(failing(r.setup).length > 0);
  assert.ok(r.checks.every((c) => !c.pass && /invalid/.test(c.value)));
});

test('grade: matching the plate within tolerance passes; a cast left in fails; a crushed grade fails', () => {
  const near = gradeGrade({ frame: gradeFrame((c) => undoGradeError(c).map((v, i) => v + [0.008, -0.006, 0.01][i])) }, rt);
  assert.deepEqual(failing(near.checks), []);
  const ungraded = gradeGrade({ frame: gradeFrame() }, rt);
  assert.deepEqual(failing(ungraded.checks), ['highlight-match', 'neutral-match', 'shadow-match']);
  // Levels fixed, the warm cast left: red and blue are off in the neutral and highlight.
  const cast = gradeGrade({ frame: gradeFrame((c) => c.map((v) => v - GRADE.error.lift)) }, rt);
  assert.deepEqual(failing(cast.checks), ['highlight-match', 'neutral-match']);
  const crushed = gradeGrade({ frame: gradeFrame((c) => undoGradeError(c).map((v) => (v - 0.1) * 1.1)) }, rt);
  assert.ok(failing(crushed.checks).includes('no-crush'));
  const clipped = gradeGrade({ frame: gradeFrame((c) => undoGradeError(c).map((v) => v * 1.25)) }, rt);
  assert.ok(failing(clipped.checks).includes('no-clip'));
  const platePainted = gradeGrade({ frame: gradeFrame((c) => c, (c) => c.map((v, i) => v * GRADE.error.cast[i] + GRADE.error.lift)) }, rt);
  assert.ok(failing(platePainted.checks).includes('plate-untouched'));
});

test('over: a straight-colour still matches over; a raw capture with the background baked in does not', () => {
  const reference = overFile('reference');
  const good = gradeOver({ still: overFile('rgba'), reference }, rt);
  assert.deepEqual(failing(good.setup), []);
  assert.deepEqual(failing(good.checks), []);
  assert.deepEqual(failing(gradeOver({ still: overFile('raw'), reference }, rt).checks), ['matches-over']);
  assert.deepEqual(failing(gradeOver({ still: overFile('rgb'), reference }, rt).checks), ['matches-over', 'still-has-alpha']);
});

test('the verdict has one line per check: what was measured, the value, the limit, pass or fail', () => {
  const text = formatVerdict('keying', GOOD);
  const lines = text.split('\n').filter((l) => l.startsWith('PICTURE-CHECK '));
  assert.equal(lines.length, checkIds('keying').length);
  for (const [i, id] of checkIds('keying').entries()) {
    assert.match(lines[i], new RegExp(`^PICTURE-CHECK ${id.replace('.', '\\.')} (PASS|FAIL) \\| measured: .+ \\| value: .+ \\| limit: .+$`));
  }
  assert.match(text, /^PICTURE-RESULT keying \d+\/\d+ checks passed$/m);
  assert.match(text, /^PICTURE-SETUP /m);
});

test('the grader CLI prints a plan, grades the renders once, and refuses a second grade', async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'picture-'));
  const cli = path.join(PICTURE, 'grade.mjs');
  const plan = (await run(process.execPath, [cli, 'grade', '--plan'], { cwd })).stdout;
  assert.match(plan, /ae_render_frame/);
  assert.ok(plan.includes(path.join(await fs.realpath(cwd), 'picture-grade', 'grade.png')), plan);
  assert.equal(plan, renderPlan('grade', path.join(await fs.realpath(cwd), 'picture-grade')));
  await writePng(rt, path.join(cwd, 'picture-grade', 'grade_0.png'), gradeFrame(undoGradeError));
  const out = (await run(process.execPath, [cli, 'grade'], { cwd })).stdout;
  assert.match(out, /PICTURE-RESULT grade 6\/6 checks passed/);
  const verdict = await fs.readFile(path.join(cwd, 'picture-grade', 'verdict.txt'), 'utf8');
  assert.equal(verdict.trim(), out.trim());
  const json = JSON.parse(await fs.readFile(path.join(cwd, 'picture-grade', 'verdict.json'), 'utf8'));
  assert.equal(json.checks.length, 6);
  await assert.rejects(run(process.execPath, [cli, 'grade'], { cwd }), (e) => e.code === 3 && /already graded/.test(e.stdout + e.stderr));
  assert.equal(await fs.readFile(path.join(cwd, 'picture-grade', 'verdict.txt'), 'utf8'), verdict);
});

test('the grader CLI reports missing renders as failed checks, not a crash', async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'picture-'));
  const out = (await run(process.execPath, [path.join(PICTURE, 'grade.mjs'), 'over'], { cwd })).stdout;
  assert.match(out, /PICTURE-CHECK over\.still-has-alpha FAIL \| measured: .*missing/);
  assert.match(out, /PICTURE-RESULT over 0\/\d+ checks passed/);
});

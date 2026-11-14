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
import vm from 'node:vm';

import {
  THRESHOLDS, checkIds, formatVerdict, gradeFinish, gradeGrade, gradeKeying, gradeOver, gradeReview, gradeSeat, loadRuntime, renderPlan, EVALS,
  REVIEW_TRUTH, REVIEW_KINDS, SEVERITIES, gradeCurve, CURVE_TRUTH, CURVE_KINDS, gradeDir,
} from '../../plugin/evals/picture/checks.mjs';
import { SCENES, GRADE, decodeBuild, reviewBuild } from '../../plugin/evals/picture/scenes.mjs';
import { gradeFrame, keyedFrame, keyingSource, overFile, seatFrame, undoGradeError, writePng } from './picture-model.mjs';

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
    if (ev.encoded) {
      const m = jsx.match(/\/\/ SCENE-BEGIN\n\s*var DATA = "([A-Za-z0-9+/=]+)";\n\s*\/\/ SCENE-END/);
      assert.ok(m, `${ev.setup} has an encoded SCENE block`);
      assert.deepEqual(decodeBuild(m[1]), reviewBuild(SCENES[name]),
        `${ev.setup} matches scenes.mjs: its DATA line must be encodeBuild(reviewBuild())`);
      // The script's own ES3 decoder gives back the same build.
      const fn = jsx.match(/function decode\(s\) \{[\s\S]*?\n\}/)[0];
      assert.deepEqual(JSON.parse(vm.runInNewContext(`${fn}; decode(${JSON.stringify(m[1])})`)), reviewBuild(SCENES[name]));
      // Neither the script nor the layer names it makes say what was planted.
      const plain = jsx.replace(m[1], '');
      assert.doesNotMatch(plain, /\b(magenta|cast|fringe|halo|soft|blur\w*|late|landFrame)\b/i, `${ev.setup} reads as a generic builder`);
      const names = reviewBuild(SCENES[name]).comps.flatMap((c) => [c.name, ...c.layers.map((l) => l.name)]);
      assert.deepEqual(names.filter((n) => /\b(magenta|cast|fringe|soft|blur|late|outline)\b/i.test(n)), []);
      assert.ok(jsx.includes(`var BRIEF = ${JSON.stringify(SCENES[name].brief)};`), `${ev.setup} hands over the brief in scenes.mjs`);
    } else {
      const m = jsx.match(/\/\/ SCENE-BEGIN\n\s*var SCENE = (.*);\n\s*\/\/ SCENE-END/);
      assert.ok(m, `${ev.setup} has a SCENE block`);
      assert.deepEqual(JSON.parse(m[1]), SCENES[name], `${ev.setup} matches scenes.mjs`);
    }
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

const seatPair = (opts) => SCENES.seat.gradeFrames.map((f) => seatFrame(f, opts));
const MATCHED = { element: { sigma: SCENES.seat.expected.plate.edgeWidth / 2.56, grain: SCENES.seat.expected.plate.temporalGrain } };

test('seat: an element given the plate\'s grain and softness passes every check', () => {
  const r = gradeSeat({ frames: seatPair(MATCHED) }, rt);
  assert.deepEqual(failing(r.checks), [], JSON.stringify(r.checks.map((c) => [c.id, c.value])));
});

test('seat: the clean, sharp element as built fails on grain and softness, so the eval can fail', () => {
  const r = gradeSeat({ frames: seatPair() }, rt);
  assert.deepEqual(failing(r.checks), ['grain-match', 'softness-match']);
});

test('seat: grain alone fails softness; softness alone fails grain; too much of either fails', () => {
  const p = SCENES.seat.expected.plate;
  assert.deepEqual(failing(gradeSeat({ frames: seatPair({ element: { grain: p.temporalGrain } }) }, rt).checks), ['softness-match']);
  assert.deepEqual(failing(gradeSeat({ frames: seatPair({ element: { sigma: p.edgeWidth / 2.56 } }) }, rt).checks), ['grain-match']);
  assert.deepEqual(failing(gradeSeat({ frames: seatPair({ element: { sigma: 2 * p.edgeWidth / 2.56, grain: 2 * p.temporalGrain } }) }, rt).checks), ['grain-match', 'softness-match']);
});

test('seat: softening or cleaning the plate instead fails plate-untouched', () => {
  const r = gradeSeat({ frames: seatPair({ ...MATCHED, plate: { sigma: 3, grain: 1 } }) }, rt);
  assert.ok(failing(r.checks).includes('plate-untouched'), JSON.stringify(failing(r.checks)));
});

test('seat: grain that does not change from frame to frame does not count', () => {
  // The same frame twice: the element has grain in each frame but none between them.
  const one = seatFrame(0, MATCHED);
  assert.ok(failing(gradeSeat({ frames: [one, one] }, rt).checks).includes('grain-match'));
});

test('seat: a missing or wrong-size render fails every check with the reason', () => {
  const r = gradeSeat({ frames: [seatFrame(0, MATCHED), null] }, rt);
  assert.ok(r.checks.every((c) => !c.pass && /missing/.test(c.value)));
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

// ---------------------------------------------------------------------------
// The whole-piece check (eval 21): graded on the findings the agent writes
// ---------------------------------------------------------------------------

const FOUND = {
  seeded: [
    { kind: 'flash', from: 1.2 },
    { kind: 'frozen', from: 2.0, to: 2.6667 },
    { kind: 'off-frame', from: 3.4, note: 'Title past the right edge' },
    { kind: 'clipped', from: 4.0, to: 4.4667 },
    { kind: 'other', from: 4.0, note: 'jump where the glare appears' },
  ],
  clean: [],
};

test('finish: the four seeded defects named at their times pass, extras in the seeded comp are not scored', () => {
  const r = gradeFinish(FOUND);
  assert.deepEqual(failing(r.checks), []);
  assert.deepEqual(r.checks.map((c) => c.id), checkIds('finish'));
});

test('finish: a missing defect, a wrong time or a finding in the clean comp fails', () => {
  const without = (kind) => ({ ...FOUND, seeded: FOUND.seeded.filter((f) => f.kind !== kind) });
  assert.deepEqual(failing(gradeFinish(without('flash')).checks), ['flash']);
  assert.match(byId(gradeFinish(without('frozen')).checks).frozen.value, /no frozen named/);
  const late = { ...FOUND, seeded: FOUND.seeded.map((f) => (f.kind === 'flash' ? { ...f, from: 1.3 } : f)) };
  assert.deepEqual(failing(gradeFinish(late).checks), ['flash']);
  const early = { ...FOUND, seeded: FOUND.seeded.map((f) => (f.kind === 'off-frame' ? { ...f, from: 0 } : f)) };
  assert.deepEqual(failing(gradeFinish(early).checks), ['off-frame']);
  const short = { ...FOUND, seeded: FOUND.seeded.map((f) => (f.kind === 'frozen' ? { ...f, to: 2.3 } : f)) };
  assert.deepEqual(failing(gradeFinish(short).checks), ['frozen']);
  const noisy = { ...FOUND, clean: [{ kind: 'other', from: 1 }] };
  assert.deepEqual(failing(gradeFinish(noisy).checks), ['clean-quiet']);
  const all = gradeFinish({ seeded: [], clean: [] });
  assert.deepEqual(failing(all.checks), ['clipped', 'flash', 'frozen', 'off-frame']);
});

test('finish: a missing or malformed findings file marks the run invalid', () => {
  for (const bad of [null, [], { seeded: [{ kind: 'pop', from: 1 }], clean: [] }, { seeded: [{ kind: 'flash' }], clean: [] }, { seeded: [] }]) {
    const r = gradeFinish(bad);
    assert.equal(r.setup[0].pass, false, JSON.stringify(bad));
    assert.ok(r.checks.every((c) => !c.pass && /invalid/.test(c.value)));
  }
});

test('finish: the grader CLI prints the findings format, grades the file once', async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'picture-'));
  const cli = path.join(PICTURE, 'grade.mjs');
  const plan = (await run(process.execPath, [cli, 'finish', '--plan'], { cwd })).stdout;
  const file = path.join(await fs.realpath(cwd), 'picture-grade', 'findings.json');
  assert.ok(plan.includes(JSON.stringify(file)), plan);
  assert.doesNotMatch(plan, /ae_render_frame/);
  assert.equal(plan, renderPlan('finish', path.dirname(file)));
  await fs.writeFile(file, JSON.stringify(FOUND));
  const out = (await run(process.execPath, [cli, 'finish'], { cwd })).stdout;
  assert.match(out, /PICTURE-RESULT finish 5\/5 checks passed/);
  await assert.rejects(run(process.execPath, [cli, 'finish'], { cwd }), (e) => e.code === 3);
});

// ---------------------------------------------------------------------------
// The independent review (eval 22): a reviewer names four planted defects
// ---------------------------------------------------------------------------

const finding = (kind, from, extra = {}) => ({
  kind, from, where: 'the subject', evidence: 'frame-0042.png', severity: 'careful-watch', ...extra,
});
const REVIEWED = {
  findings: [
    finding('colour', 3.0, { to: 6.0, severity: 'first-watch', where: "presenter's shirt and face, take 2", evidence: 'shirt samples r 0.71 g 0.55 b 0.69 against the wall 0.46 grey' }),
    finding('focus', 4.0, { to: 5.0, where: 'the wall behind the presenter', evidence: 'cut flags at 4.0 and 5.0 s; the grid lines are gone at 4.5 s' }),
    finding('timing', 2.2667, { where: 'orange badge, top right', evidence: 'strip around 2.0 s: the badge is still falling at the hit marker, lands on frame 68' }),
    finding('edge', 1.0, { to: 3.0, where: "presenter's outline, take 1", evidence: 'full-size frame at 1.0 s: a light line about 4 px wide around the head and shoulders' }),
  ],
  intended: [{ from: 3.0, note: 'cut to take 2, in the brief' }],
  notJudged: ['motion at speed: no preview movie', 'sound'],
};
const withFindings = (list) => ({ ...REVIEWED, findings: list });
const drop = (...kinds) => withFindings(REVIEWED.findings.filter((f) => !kinds.includes(f.kind)));
const moved = (kind, from) => REVIEWED.findings.map((f) => (f.kind === kind ? { ...f, from, to: undefined } : f));

test('review: the scene puts each planted defect where the truth says', () => {
  const s = SCENES.review;
  assert.equal(REVIEW_TRUTH.edge.from, 0);
  assert.equal(REVIEW_TRUTH.edge.to, s.takes[1].fromFrame / s.fps);
  assert.equal(REVIEW_TRUTH.colour.from, s.takes[1].fromFrame / s.fps);
  assert.equal(REVIEW_TRUTH.focus.from, s.soft.fromFrame / s.fps);
  assert.equal(REVIEW_TRUTH.timing.from, s.marker.frame / s.fps);
  assert.ok(s.badge.landFrame - s.marker.frame >= 6, 'the badge lands several frames after the marker');
  // The marker reads as the brief names it: After Effects shows a comp marker by its comment.
  assert.equal(s.marker.comment, s.marker.name);
  assert.ok(s.brief.includes(`marker "${s.marker.comment}", ${s.marker.frame / s.fps}.0 s`), s.brief);
  assert.deepEqual(reviewBuild(s).comps.find((c) => c.main).markers, [{ frame: s.marker.frame, name: 'hit', comment: 'hit' }]);
  assert.ok(s.takes[0].fringe && !s.takes[1].fringe && !s.takes[0].cast && s.takes[1].cast);
  // The cast leans magenta: red and blue up, green down.
  const [r, g, b] = s.takes[1].cast;
  assert.ok(r > 1 && b > 1 && g < 1);
  // Decoy kinds, so the list of kinds does not say what was planted.
  assert.ok(REVIEW_KINDS.length >= 7 && REVIEW_KINDS.includes('other'));
  assert.deepEqual(SEVERITIES, ['first-watch', 'careful-watch', 'polish']);
});

test('review: all four named at their times pass, intended flags and what was not judged are not scored', () => {
  const r = gradeReview(REVIEWED);
  assert.deepEqual(failing(r.checks), []);
  assert.deepEqual(r.checks.map((c) => c.id), checkIds('review'));
  assert.equal(byId(r.checks).found.values[0], 4);
  assert.equal(byId(r.checks).stray.values[0], 0);
});

test('review: three of four still pass; two missing fail', () => {
  assert.deepEqual(failing(gradeReview(drop('edge')).checks), []);
  assert.match(byId(gradeReview(drop('edge')).checks).found.what, /edge not named/);
  assert.deepEqual(failing(gradeReview(drop('edge', 'timing')).checks), ['found']);
});

test('review: a wrong time does not count, and counts as stray', () => {
  // The cast named in take 1, where the subject is neutral.
  const wrong = gradeReview(withFindings(moved('colour', 1.0)));
  assert.equal(byId(wrong.checks).found.values[0], 3);
  assert.equal(byId(wrong.checks).stray.values[0], 1);
  // The hit named well after the landing; and the soft plate a second late: two misses fail.
  const two = gradeReview(withFindings(moved('timing', 2.6).map((f) => (f.kind === 'focus' ? { ...f, from: 5.4, to: undefined } : f))));
  assert.deepEqual(failing(two.checks), ['found']);
  // A defect named under the wrong kind is not a match.
  const kind = gradeReview(withFindings(REVIEWED.findings.map((f) => (f.kind === 'edge' ? { ...f, kind: 'colour' } : f))));
  assert.equal(byId(kind.checks).found.values[0], 3);
});

test('review: a flood of findings fails, even when it covers every defect', () => {
  const flood = [];
  for (const kind of ['colour', 'focus', 'timing', 'edge']) for (let t = 0; t < 6; t += 0.5) flood.push(finding(kind, t));
  const r = gradeReview(withFindings(flood));
  assert.equal(byId(r.checks).found.values[0], 4);
  assert.deepEqual(failing(r.checks), ['stray']);
  // Two extras are allowed: a reviewer may see something the setup did not plant.
  const extras = withFindings([...REVIEWED.findings, finding('other', 0.5), finding('motion', 5.5)]);
  assert.deepEqual(failing(gradeReview(extras).checks), []);
  const three = withFindings([...REVIEWED.findings, finding('other', 0.5), finding('motion', 5.5), finding('framing', 1.5)]);
  assert.deepEqual(failing(gradeReview(three).checks), ['stray']);
});

test('review: duplicates of a named defect are neither counted twice nor stray', () => {
  const dup = withFindings([...REVIEWED.findings, finding('colour', 4.5)]);
  const r = gradeReview(dup);
  assert.equal(byId(r.checks).found.values[0], 4);
  assert.equal(byId(r.checks).stray.values[0], 0);
});

test('review: a findings file not in the review form marks the run invalid', () => {
  const strip = (key) => withFindings(REVIEWED.findings.map((f, i) => (i === 0 ? Object.fromEntries(Object.entries(f).filter(([k]) => k !== key)) : f)));
  for (const bad of [null, [], { intended: [] }, strip('severity'), strip('evidence'), strip('where'), strip('from'),
    withFindings([finding('cast', 3)]), withFindings([finding('colour', 3, { severity: 'major' })]), { ...REVIEWED, intended: 'none' }]) {
    const r = gradeReview(bad);
    assert.equal(r.setup[0].pass, false, JSON.stringify(bad));
    assert.ok(r.checks.every((c) => !c.pass && /invalid/.test(c.value)));
  }
});

test('review: the grader CLI prints the findings format, grades the file once', async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'picture-'));
  const cli = path.join(PICTURE, 'grade.mjs');
  const plan = (await run(process.execPath, [cli, 'review', '--plan'], { cwd })).stdout;
  const file = path.join(await fs.realpath(cwd), 'picture-grade', 'findings.json');
  assert.ok(plan.includes(JSON.stringify(file)), plan);
  assert.equal(plan, renderPlan('review', path.dirname(file)));
  for (const s of [...REVIEW_KINDS, ...SEVERITIES, 'where', 'evidence', 'intended', 'notJudged']) assert.ok(plan.includes(s), s);
  // The plan must not give away what was planted.
  assert.doesNotMatch(plan, /\b(magenta|blur\w*|fringe|halo|late|marker|cast)\b/i);
  await fs.writeFile(file, JSON.stringify(REVIEWED));
  const out = (await run(process.execPath, [cli, 'review'], { cwd })).stdout;
  assert.match(out, /PICTURE-RESULT review 2\/2 checks passed/);
  await assert.rejects(run(process.execPath, [cli, 'review'], { cwd }), (e) => e.code === 3);
});

// ---------------------------------------------------------------------------
// Read motion and sound (eval 26): graded on the findings file
// ---------------------------------------------------------------------------

const CURVE_FOUND = {
  findings: [
    { kind: 'no-ease', layer: 'card B', from: 2.0, to: 3.0, note: 'motion.curve: starts and stops at full speed' },
    { kind: 'late', layer: 'badge 3', from: 5.133, frames: 4, note: 'sound.sync: 4 frames after beat 3' },
  ],
};
const curveWith = (change) => ({ findings: change(CURVE_FOUND.findings.map((f) => ({ ...f }))) });

test('curve: the scene puts the linear move and the late hit where the truth says', () => {
  const c = SCENES.curve;
  assert.deepEqual(CURVE_TRUTH.linear, { layer: 'card B', from: 2, to: 3 });
  assert.equal(CURVE_TRUTH.late.frames, 4);
  assert.deepEqual(c.badges.map((b, i) => b.inFrame - c.beats[i].frame), [0, 0, 4]);
  assert.ok(c.eased.toFrame < c.linear.fromFrame, 'the two moves do not overlap');
  assert.ok(CURVE_KINDS.includes('no-ease') && CURVE_KINDS.includes('late'));
});

test('curve: the linear move and the late hit named, nothing else, passes every check', () => {
  const r = gradeCurve(CURVE_FOUND);
  assert.ok(r.setup.every((x) => x.pass));
  assert.deepEqual(failing(r.checks), []);
  assert.deepEqual(r.checks.map((c) => c.id), checkIds('curve'));
  // the late hit given as a time alone: its frames follow from the beat
  assert.deepEqual(failing(gradeCurve(curveWith((f) => [f[0], { kind: 'late', layer: 'Badge 3', from: 5.1333 }])).checks), []);
});

test('curve: a bad findings file fails the check it should, and an unreadable one fails them all', () => {
  assert.deepEqual(failing(gradeCurve(curveWith((f) => [f[1]])).checks), ['linear-move']);
  assert.deepEqual(failing(gradeCurve(curveWith((f) => [{ ...f[0], layer: 'card A' }, f[1]])).checks), ['eased-quiet', 'linear-move']);
  assert.deepEqual(failing(gradeCurve(curveWith((f) => [f[0]])).checks), ['late-hit']);
  assert.deepEqual(failing(gradeCurve(curveWith((f) => [f[0], { ...f[1], frames: 8 }])).checks), ['late-hit']);
  assert.deepEqual(failing(gradeCurve(curveWith((f) => [...f, { kind: 'early', layer: 'badge 1', from: 3.9, frames: -3 }])).checks), ['on-beat-quiet']);
  assert.deepEqual(failing(gradeCurve(curveWith((f) => [...f, { kind: 'overshoot', layer: 'card A', from: 1.5 }])).checks), ['eased-quiet']);
  for (const bad of [null, [], { findings: 'none' }, curveWith((f) => [{ ...f[0], kind: 'linear' }]), curveWith((f) => [{ ...f[0], layer: '' }])]) {
    const r = gradeCurve(bad);
    assert.equal(r.setup[0].pass, false);
    assert.deepEqual(failing(r.checks), ['eased-quiet', 'late-hit', 'linear-move', 'on-beat-quiet']);
  }
});

test('curve: the plan names the findings file and its form, and gradeDir reads it', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'curve-'));
  const plan = renderPlan('curve', dir);
  assert.ok(plan.includes(JSON.stringify(path.join(dir, 'findings.json'))));
  for (const k of CURVE_KINDS) assert.ok(plan.includes(`"${k}"`), k);
  assert.match(plan, /curve\.late-hit: .*limit 3 to 5 frames/);
  assert.equal((await gradeDir('curve', dir, rt)).setup[0].pass, false);
  await fs.writeFile(path.join(dir, 'findings.json'), JSON.stringify(CURVE_FOUND));
  assert.deepEqual(failing((await gradeDir('curve', dir, rt)).checks), []);
});

test('the findings evals take their findings on the grader\'s command line, once, and refuse bad JSON without grading', async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'findings-'));
  const grader = path.join(PICTURE, 'grade.mjs');
  const doc = JSON.stringify({ findings: [{ kind: 'no-ease', layer: 'card B', from: 2.0 }, { kind: 'late', layer: 'badge 3', from: 5.133, frames: 4, note: "it's late" }] });
  await assert.rejects(run(process.execPath, [grader, 'curve', '--findings', '{not json'], { cwd }), (e) => e.code === 2 && /not JSON/.test(e.stderr));
  await assert.rejects(fs.access(path.join(cwd, 'picture-grade', 'verdict.txt')));
  const { stdout } = await run(process.execPath, [grader, 'curve', '--findings', doc], { cwd });
  assert.match(stdout, /^PICTURE-RESULT curve 4\/4 checks passed$/m);
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(cwd, 'picture-grade', 'findings.json'), 'utf8')), JSON.parse(doc));
  await assert.rejects(run(process.execPath, [grader, 'curve', '--findings', doc], { cwd }), (e) => e.code === 3);
  await assert.rejects(run(process.execPath, [grader, 'seat', '--findings', doc], { cwd }), (e) => e.code === 2 && /graded on its renders/.test(e.stderr));
  for (const name of ['finish', 'review', 'curve']) assert.match(renderPlan(name, cwd), new RegExp(`node grade\\.mjs ${name} --findings '<json>'`));
});

test('the grader reads renders as ae_render_frame names them: <stem>_<call id>_<index>.png, the newest call when there are several', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'callid-'));
  const { findRender } = await import('../../plugin/evals/picture/checks.mjs');
  // an earlier call, before the change: clean and sharp; the final call: matched
  const [clean0, clean1] = seatPair({});
  const [good0, good1] = seatPair(MATCHED);
  await writePng(rt, path.join(dir, 'seat_0aa11bb2_0.png'), clean0);
  await writePng(rt, path.join(dir, 'seat_0aa11bb2_1.png'), clean1);
  const old = new Date(Date.now() - 60_000);
  for (const f of ['seat_0aa11bb2_0.png', 'seat_0aa11bb2_1.png']) await fs.utimes(path.join(dir, f), old, old);
  await writePng(rt, path.join(dir, 'seat_9ff88ee7_0.png'), good0);
  await writePng(rt, path.join(dir, 'seat_9ff88ee7_1.png'), good1);
  assert.equal(await findRender(dir, 'seat_0.png'), 'seat_9ff88ee7_0.png');
  assert.equal(await findRender(dir, 'seat_2.png'), null);
  assert.equal(await findRender(dir, 'glow-still.png'), null);
  assert.deepEqual(failing((await gradeDir('seat', dir, rt)).checks), []);
  // the plain name, when it is there, is the file
  await writePng(rt, path.join(dir, 'seat_0.png'), clean0);
  assert.equal(await findRender(dir, 'seat_0.png'), 'seat_0.png');
});

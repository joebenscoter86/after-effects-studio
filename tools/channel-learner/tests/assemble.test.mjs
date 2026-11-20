import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { assemble, recipeProblems } from '../assemble.mjs';

const T0 = new Date('2026-01-01T00:00:00Z');
const at = (minutes) => new Date(T0.getTime() + minutes * 60000);

// recipes: { id: { recipeAt, check?, checkAt?, layout?, layoutAt? } }
function study(recipes) {
  const dir = fs.mkdtempSync(path.join(tmpdir(), 'assemble-test-'));
  fs.writeFileSync(path.join(dir, 'source.info.json'), JSON.stringify({
    id: 'vid9', title: 'Made-up tips', channel: 'Nobody', channel_url: 'https://example.invalid/c',
  }));
  fs.mkdirSync(path.join(dir, 'recipes'));
  fs.mkdirSync(path.join(dir, 'checks'));
  for (const [id, r] of Object.entries(recipes)) {
    const n = id.slice(0, 2);
    const file = (p, text, when) => { fs.writeFileSync(p, text); fs.utimesSync(p, when, when); };
    file(path.join(dir, 'recipes', `${id}.md`), `## Technique ${n}\njobs: test\n`, at(r.recipeAt ?? 0));
    if (r.check !== undefined) file(path.join(dir, 'checks', `${n}.md`), r.check, at(r.checkAt ?? 1));
    if (r.layout !== undefined) file(path.join(dir, 'checks', `layout-${n}.md`), r.layout, at(r.layoutAt ?? 1));
  }
  return dir;
}

const pass = (id) => `round: 1\n${id ? `recipe: ${id}\n` : ''}verdict: pass\nfailures:\n`;

test('assemble: each reason a recipe is refused', () => {
  const dir = study({
    '01-ok': { check: pass('01-ok') },
    '02-no-recipe-line': { check: pass() },
    '03-edited': { recipeAt: 5, check: pass('03-edited'), checkAt: 2 },
    '04-layout-failed': { check: pass('04-layout-failed'), layout: 'layout verdict: fail\n' },
    '05-other': { check: pass('05-something-else') },
    '06-failed': { check: 'recipe: 06-failed\nverdict: fail\n' },
    '07-missing': {},
    '08-layout-later': { recipeAt: 5, check: pass('08-layout-later'), checkAt: 2, layout: 'layout verdict: pass\n', layoutAt: 6 },
    '09-layout-pass-old': { recipeAt: 5, check: pass('09-layout-pass-old'), checkAt: 4, layout: 'layout verdict: pass\n', layoutAt: 3 },
  });
  try {
    assert.deepEqual(recipeProblems(dir), [
      { recipe: '03-edited.md', reason: 'edited after its check' },
      { recipe: '04-layout-failed.md', reason: 'layout check failed' },
      { recipe: '05-other.md', reason: 'check names another recipe' },
      { recipe: '06-failed.md', reason: 'no passing check' },
      { recipe: '07-missing.md', reason: 'no passing check' },
      { recipe: '09-layout-pass-old.md', reason: 'edited after its check' },
    ]);
    assert.throws(() => assemble(dir, path.join(dir, 'out')),
      /03-edited\.md \(edited after its check\).*04-layout-failed\.md \(layout check failed\).*05-other\.md \(check names another recipe\).*07-missing\.md \(no passing check\)/s);
    assert.equal(fs.existsSync(path.join(dir, 'out')), false, 'nothing written');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('assemble: recipes whose checks pass and are newer are collected', () => {
  const dir = study({
    '01-a': { check: pass('01-a') },
    '02-b': { recipeAt: 3, check: pass('02-b'), checkAt: 3, layout: 'layout verdict: pass\n', layoutAt: 1 },
  });
  try {
    assert.deepEqual(recipeProblems(dir), []);
    assert.deepEqual(assemble(dir, path.join(dir, 'out')), { id: 'vid9', recipes: 2 });
    assert.match(fs.readFileSync(path.join(dir, 'out', 'vid9.md'), 'utf8'), /Technique 02/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('assemble: proven recipes are counted, and proven needs a recorded acceptance', () => {
  const dir = study({ '01-a': { check: pass('01-a') }, '02-b': { check: pass('02-b') }, '03-c': { check: pass('03-c') } });
  const setStatus = (id, line) => {
    const p = path.join(dir, 'recipes', `${id}.md`);
    const when = fs.statSync(p).mtime;
    fs.writeFileSync(p, `## Technique ${id.slice(0, 2)}\n${line}\njobs: test\n`);
    fs.utimesSync(p, when, when);
  };
  try {
    setStatus('01-a', 'status: proven (accepted by Joe 2026-11-14: built in After Effects, compared with the result)');
    setStatus('02-b', 'status: unproven');
    setStatus('03-c', 'status: unproven');
    assemble(dir, path.join(dir, 'out'));
    const out = fs.readFileSync(path.join(dir, 'out', 'vid9.md'), 'utf8');
    assert.match(out, /^# Techniques from one video \(3 recipes, 1 proven\)/);
    assert.doesNotMatch(out, /none has been accepted/);
    assert.match(out, /\| 01 \| Technique 01 \| test \| 1 \| proven \|/);
    assert.match(out, /\| 02 \| Technique 02 \| test \| 1 \| unproven \|/);

    setStatus('03-c', 'status: proven');
    assert.deepEqual(recipeProblems(dir), [{ recipe: '03-c.md', reason: 'proven without a recorded acceptance' }]);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('assemble: a variant needs its merge confirmed by the check (LESSONS 14)', () => {
  const dir = study({ '01-a': { check: pass('01-a') }, '02-b': { check: pass('02-b') }, '03-c': { check: pass('03-c') } });
  const variant = (id, checkText) => {
    const p = path.join(dir, 'recipes', `${id}.md`);
    fs.writeFileSync(p, `## Technique ${id.slice(0, 2)}\nstatus: unproven\nvariant of: 04-parent (vid0 #04)\ndiffers: here x; in the parent y.\njobs: test\n`);
    fs.utimesSync(p, at(0), at(0));
    const c = path.join(dir, 'checks', `${id.slice(0, 2)}.md`);
    fs.writeFileSync(c, checkText);
    fs.utimesSync(c, at(1), at(1));
  };
  try {
    variant('01-a', `${pass('01-a')}merge: confirmed\n`);
    variant('02-b', `${pass('02-b')}merge: refused\nmerge failures:\n- wrong\n`);
    variant('03-c', pass('03-c'));
    assert.deepEqual(recipeProblems(dir), [
      { recipe: '02-b.md', reason: 'variant without a confirmed merge' },
      { recipe: '03-c.md', reason: 'variant without a confirmed merge' },
    ]);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

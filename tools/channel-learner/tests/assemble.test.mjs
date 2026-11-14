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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseResult } from '../proofs/references.mjs';

const line = (rest) => `## A made-up recipe\nresult: ${rest}\nsteps:\n`;

test('parseResult: where the still is cut, in order: frame number, scratch file name, "cut at", midpoint', () => {
  assert.equal(parseResult(line('start=10 end=12 still crop=100,50,300,200 frame=f000600'), { fps: 30 }).at, 20);
  assert.equal(parseResult(line('start=10 end=12 animated crop=100,50,300,200 frame=f000720 (cut at 11.1 s)'), { fps: 60 }).at, 12);
  assert.equal(parseResult(line('start=37 end=40 animated crop=100,50,300,200 frame=scratch/03/result-38.4.png (cut from source.mp4 at 38.4 s)'), { fps: 60 }).at, 38.4);
  assert.equal(parseResult(line('start=20 end=30 still crop=100,50,300,200 (cut at 27.5 s)'), { fps: 60 }).at, 27.5);
  assert.equal(parseResult(line('start=4 end=6 still crop=100,50,300,200'), { fps: 60 }).at, 5);
});

test('parseResult: odd crop corners and sizes are evened; too-small crops and lines with no time are skipped', () => {
  const r = parseResult(line('start=4 end=6 animated crop=101,51,301,201'), { fps: 60 });
  assert.deepEqual(r.crop, [100, 50, 300, 200]);
  assert.equal(r.animated, true);
  assert.match(parseResult(line('start=4 end=6 still crop=10,10,1,200'), { fps: 60 }).skip, /too small/);
  assert.match(parseResult(line('still crop=10,10,100,200'), { fps: 60 }).skip, /no time/);
  assert.match(parseResult(line('still crop=10,10,100,200 frame=f000100'), {}).skip, /frame rate/);
  assert.equal(parseResult('## no result line\n', { fps: 60 }), null);
});

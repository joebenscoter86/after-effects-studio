import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { frameDiff, measureChanges, noisyCells, pickFrames } from '../lib/change.mjs';

// ---------- frameDiff ----------

test('frameDiff finds a 10x10 block in the right cell with the right share', () => {
  const w = 40, h = 20;
  const prev = new Uint8Array(w * h);
  const cur = new Uint8Array(w * h);
  for (let y = 10; y < 20; y++) for (let x = 10; x < 20; x++) cur[y * w + x] = 100;
  const d = frameDiff(prev, cur, w, h, [4, 2], 12);
  assert.equal(d.cells.length, 8);
  // cell (row 1, col 1) is index 5 and is fully changed
  assert.equal(d.cells[5], 1);
  for (let i = 0; i < 8; i++) if (i !== 5) assert.equal(d.cells[i], 0);
  assert.equal(d.share, 100 / 800);
  assert.ok(Math.abs(d.mean - (100 * 100) / 800) < 1e-3);
});

test('frameDiff ignores differences at or under the pixel threshold in share and cells', () => {
  const w = 40, h = 20;
  const prev = new Uint8Array(w * h);
  const cur = new Uint8Array(w * h).fill(12);
  const d = frameDiff(prev, cur, w, h, [4, 2], 12);
  assert.equal(d.share, 0);
  assert.deepEqual(d.cells, new Array(8).fill(0));
  assert.ok(d.mean > 0);
});

test('identical frames give zeros (Review Focus 5)', () => {
  const w = 32, h = 18;
  const a = new Uint8Array(w * h).map((_, i) => i % 251);
  const d = frameDiff(a, a.slice(), w, h, [16, 9], 12);
  assert.equal(d.mean, 0);
  assert.equal(d.share, 0);
  assert.deepEqual(d.cells, new Array(144).fill(0));
});

// ---------- synthetic FrameStat helpers ----------

const FPS = 30;
const NCELLS = 4; // cell 0 = content, cell 3 = noisy advert panel

function makeStats(seconds, activeAt) {
  const n = Math.round(seconds * FPS);
  const stats = [];
  for (let f = 0; f < n; f++) {
    const cells = new Array(NCELLS).fill(0);
    activeAt(f, cells);
    const share = cells.reduce((a, b) => a + b, 0) / NCELLS;
    stats.push({ f, t: f / FPS, mean: share * 50, share, cells });
  }
  return stats;
}

// noisy cell 3: active 8 frames, calm 2 frames, repeating (80 % active)
const noisy = (f, cells) => { if (f % 10 < 8) cells[3] = 0.2; };
// a three-frame change at 2 s; a 5 s run from 8 s to 13 s
const content = (f, cells) => {
  if (f >= 60 && f < 63) cells[0] = 0.3;
  if (f >= 240 && f < 390) cells[0] = 0.3;
};

test('noisyCells finds a cell active in 80% of frames and not one active in 10%', () => {
  const stats = makeStats(20, (f, cells) => {
    noisy(f, cells);
    if (f % 10 === 0) cells[1] = 0.5; // 10 % active
  });
  assert.deepEqual(noisyCells(stats), [3]);
});

test('pickFrames keeps one settle frame after a three-frame change', () => {
  const stats = makeStats(5, (f, cells) => { if (f >= 60 && f < 63) cells[0] = 0.3; });
  const kept = pickFrames(stats, []);
  assert.deepEqual(kept, [{ f: 63, t: 63 / FPS, why: 'settle' }]);
});

test('pickFrames keeps motion frames about a second apart through a 5 s run, then settles', () => {
  const stats = makeStats(20, (f, cells) => { if (f >= 240 && f < 390) cells[0] = 0.3; });
  const kept = pickFrames(stats, []);
  const motion = kept.filter((k) => k.why === 'motion');
  assert.ok(motion.length >= 4 && motion.length <= 5, `motion frames: ${motion.length}`);
  for (let i = 1; i < motion.length; i++) {
    const gap = motion[i].t - motion[i - 1].t;
    assert.ok(Math.abs(gap - 1) < 0.05, `gap ${gap}`);
  }
  for (const m of motion) assert.ok(m.f >= 240 && m.f < 390);
  const settle = kept.filter((k) => k.why === 'settle');
  assert.deepEqual(settle.map((k) => k.f), [390]);
});

test('pickFrames keeps sentence starts at the exact frame', () => {
  const stats = makeStats(10, () => {});
  const kept = pickFrames(stats, [0.5, 4.2, 9.0]);
  assert.deepEqual(kept, [
    { f: 15, t: 15 / FPS, why: 'sentence' },
    { f: 126, t: 126 / FPS, why: 'sentence' },
    { f: 270, t: 270 / FPS, why: 'sentence' },
  ]);
});

test('pickFrames drops a frame closer than minGap, but settle replaces motion', () => {
  // run from frame 0 to frame 44 (1.5 s): motion at 1.0 s (f30), settle at f45 (0.5 s later: kept)
  // run from frame 0 to 35: motion at f30, settle at f36 is 0.2 s later -> replaces motion
  const stats = makeStats(4, (f, cells) => { if (f < 36) cells[0] = 0.3; });
  const kept = pickFrames(stats, [1.1]);
  assert.deepEqual(kept.map((k) => [k.f, k.why]), [[36, 'settle']]);
});

test('a 60 fps file holding 30 fps content: repeated frames are calm, not events (Review Focus 5)', () => {
  // 60 fps, motion for 3 s where every second frame repeats the one before it (zero change)
  const fps = 60;
  const stats = [];
  for (let f = 0; f < 600; f++) {
    const cells = [0, 0, 0, 0];
    if (f >= 120 && f < 300 && f % 2 === 0) cells[0] = 0.3;
    stats.push({ f, t: f / fps, mean: 0, share: cells[0] / 4, cells });
  }
  const kept = pickFrames(stats, []);
  const settle = kept.filter((k) => k.why === 'settle');
  assert.equal(settle.length, 1);
  assert.equal(settle[0].f, 299);
  assert.equal(settle[0].t, 299 / 60);
  const motion = kept.filter((k) => k.why === 'motion');
  assert.equal(motion.length, 2); // at about 1 s and 2 s into the 3 s run
  for (const k of kept) assert.equal(k.t, k.f / fps);
});

test('ignoring the noisy cell keeps the frame count small; not ignoring it floods (Review Focus 2)', () => {
  const stats = makeStats(20, (f, cells) => { noisy(f, cells); content(f, cells); });
  const sentences = [0.5, 6.0, 15.0];
  const ignored = pickFrames(stats, sentences, { ignoreCells: noisyCells(stats) });
  assert.ok(ignored.length <= 12, `ignored kept ${ignored.length}`);
  assert.ok(ignored.some((k) => k.why === 'settle' && k.f === 63));
  assert.ok(ignored.some((k) => k.why === 'settle' && k.f === 390));
  const flooded = pickFrames(stats, sentences);
  assert.ok(flooded.length > 12, `not ignored kept ${flooded.length}`);
  assert.ok(flooded.length > ignored.length);
});

test('kept frames are sorted by time and none is closer than minGap', () => {
  const stats = makeStats(20, (f, cells) => { content(f, cells); });
  const kept = pickFrames(stats, [2.05, 8.5, 13.02]);
  for (let i = 1; i < kept.length; i++) {
    assert.ok(kept[i].t - kept[i - 1].t >= 0.25 - 1e-9, `gap at ${i}`);
  }
});

// ---------- measureChanges (local ffmpeg, temp dir) ----------

test('measureChanges writes 2 x fps lines with one active stretch', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'change-test-'));
  try {
    const clip = join(dir, 'clip.mkv');
    execFileSync('ffmpeg', [
      '-v', 'error', '-f', 'lavfi',
      '-i', "color=c=black:s=320x180:r=30:d=2,drawbox=x=80:y=40:w=80:h=60:color=white:t=fill:enable='gte(t,1)'",
      '-c:v', 'ffv1', '-y', clip,
    ]);
    const out = join(dir, 'changes.jsonl');
    const progress = [];
    const res = await measureChanges(clip, out, { width: 160, height: 90, onProgress: (n) => progress.push(n) });
    assert.equal(res.fps, 30);
    assert.equal(res.frames, 60);
    const lines = readFileSync(out, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    assert.equal(lines.length, 60);
    lines.forEach((s, i) => {
      assert.equal(s.f, i);
      assert.equal(s.t, i / 30);
      assert.equal(s.cells.length, 144);
    });
    const active = lines.filter((s) => s.share > 0).map((s) => s.f);
    assert.ok(active.length >= 1);
    // one contiguous stretch, starting at 1 s
    assert.equal(active[0], 30);
    assert.equal(active[active.length - 1] - active[0], active.length - 1);
    assert.ok(active.length <= 2);
    // box covers 40x30 of 160x90 = 1/12 of the frame
    assert.ok(Math.abs(lines[30].share - 1 / 12) < 0.01);
    assert.ok(progress.length > 0 && progress[progress.length - 1] === 60);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

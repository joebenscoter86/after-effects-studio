import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline, renderTimelineMarkdown, formatTime } from '../lib/timeline.mjs';

const w = (t, end, text) => ({ t, end, text });
const sentences = [
  { i: 0, start: 0, end: 2, text: 'Open the effect.', words: [w(0, 1, 'Open'), w(1, 2, 'the effect.')] },
  { i: 1, start: 3, end: 5, text: 'Set the amount to 40.', words: [w(3, 5, 'Set the amount to 40.')] },
];

const video = { id: 'abc', title: 'Ten tips', duration: 10, fps: 30 };

function input(extra = {}) {
  return {
    video,
    chapters: [],
    sentences,
    kept: [
      { f: 30, t: 1.0, why: 'settle', file: 'frames/f000030.png' },
      { f: 120, t: 4.0, why: 'sentence', file: 'frames/f000120.png' },
    ],
    changes: [
      { kind: 'changed', text: '40.0', was: '50.0', label: 'Amount', x: 0.5, y: 0.3, t: 4.0 },
      { kind: 'appeared', text: 'Gaussian Blur', x: 0.1, y: 0.2, t: 2.5 },
    ],
    ...extra,
  };
}

test('frames and changes go to the sentence containing their time; a pause goes to the previous sentence', () => {
  const tl = buildTimeline(input());
  const [s0, s1] = tl.chapters[0].sentences;
  assert.deepEqual(s0.frames.map((k) => k.f), [30]);
  assert.deepEqual(s1.frames.map((k) => k.f), [120]);
  assert.deepEqual(s0.changes.map((c) => c.text), ['Gaussian Blur']);
  assert.deepEqual(s1.changes.map((c) => c.text), ['40.0']);
});

test('no chapters gives one chapter spanning the video', () => {
  const tl = buildTimeline(input());
  assert.equal(tl.chapters.length, 1);
  assert.equal(tl.chapters[0].start, 0);
  assert.equal(tl.chapters[0].end, 10);
  assert.equal(tl.chapters[0].sentences.length, 2);
  assert.equal(tl.video.id, 'abc');
});

test('a sentence belongs to the chapter containing its start, even when it runs past the boundary', () => {
  const tl = buildTimeline(input({
    chapters: [
      { title: 'Intro', start: 0, end: 1.5 },
      { title: 'Tip 1', start: 1.5, end: 10 },
    ],
  }));
  assert.equal(tl.chapters.length, 2);
  assert.deepEqual(tl.chapters[0].sentences.map((s) => s.i), [0]);
  assert.deepEqual(tl.chapters[1].sentences.map((s) => s.i), [1]);
  assert.equal(tl.chapters[1].i, 1);
  // the frame at 1.0 s still follows its sentence into chapter 0
  assert.deepEqual(tl.chapters[0].sentences[0].frames.map((k) => k.f), [30]);
});

test('a frame before the first sentence goes to the first sentence', () => {
  const tl = buildTimeline(input({
    sentences: [{ ...sentences[1] }],
    kept: [{ f: 0, t: 0, why: 'settle', file: 'frames/f000000.png' }],
    changes: [],
  }));
  assert.deepEqual(tl.chapters[0].sentences[0].frames.map((k) => k.f), [0]);
});

test('renderTimelineMarkdown shows chapters, times, text, value changes and frame files', () => {
  const md = renderTimelineMarkdown(buildTimeline(input({
    chapters: [{ title: 'Tip 1', start: 62.5, end: 70 }, { title: 'Intro', start: 0, end: 62.5 }],
  })));
  assert.match(md, /Amount: 50\.0 → 40\.0/);
  assert.match(md, /## Intro \(0:00\.0\)/);
  assert.match(md, /## Tip 1 \(1:02\.5\)/);
  assert.match(md, /Set the amount to 40\./);
  assert.match(md, /f000120\.png/);
  assert.match(md, /appeared: Gaussian Blur/);
  assert.ok(md.indexOf('Intro') < md.indexOf('Tip 1'), 'chapters in time order');
});

test('formatTime', () => {
  assert.equal(formatTime(0), '0:00.0');
  assert.equal(formatTime(62.54), '1:02.5');
  assert.equal(formatTime(3725), '1:02:05.0');
});

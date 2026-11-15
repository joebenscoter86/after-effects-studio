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
  // an appeared text that is not a value (here "Gaussian Blur") is no longer listed: only value-like
  // first-seen values reach the page ("New values:")
  assert.doesNotMatch(md, /Gaussian Blur/);
  assert.ok(md.indexOf('Intro') < md.indexOf('Tip 1'), 'chapters in time order');
});

test('formatTime', () => {
  assert.equal(formatTime(0), '0:00.0');
  assert.equal(formatTime(62.54), '1:02.5');
  assert.equal(formatTime(3725), '1:02:05.0');
});

// ---------- named on screen, and the short per-sentence lists ----------

const capSentences = [
  { i: 0, start: 0, end: 4, text: 'Switch the line cap over to a round cap.', words: [] },
  { i: 1, start: 5, end: 8, text: 'Then lower the opacity of the stroke.', words: [] },
];
const capRows = {
  30: [
    { label: 'Line Cap', value: 'Butt Cap', x: 0.3, y: 0.6 },
    { label: 'Opacity', value: '100 %', x: 0.3, y: 0.7 },
  ],
  60: [
    { label: 'Line Cap', value: 'Round Cap', x: 0.3, y: 0.6 },
    { label: 'Opacity', value: '100 %', x: 0.3, y: 0.7 },
  ],
  180: [{ label: 'Opacity', value: '40 %', x: 0.3, y: 0.7 }],
};
const capKept = [
  { f: 30, t: 1, why: 'settle', file: 'frames/f000030.png' },
  { f: 60, t: 2, why: 'settle', file: 'frames/f000060.png' },
  { f: 180, t: 6, why: 'settle', file: 'frames/f000180.png' },
];

test('mentioned: rows whose label the sentence names, once per label, last frame wins (review f)', () => {
  for (const rowsByFrame of [capRows, new Map(Object.entries(capRows).map(([k, v]) => [Number(k), v]))]) {
    const tl = buildTimeline({ video, chapters: [], sentences: capSentences, kept: capKept, changes: [], rowsByFrame });
    const [s0, s1] = tl.chapters[0].sentences;
    assert.deepEqual(s0.mentioned, [{ label: 'Line Cap', value: 'Round Cap', f: 60 }]);
    assert.deepEqual(s1.mentioned, [{ label: 'Opacity', value: '40 %', f: 180 }]);
  }
  // without rows every sentence still has an empty list
  const bare = buildTimeline({ video, chapters: [], sentences: capSentences, kept: capKept, changes: [] });
  assert.deepEqual(bare.chapters[0].sentences[0].mentioned, []);
});

test('mentioned: a label with no word of three letters or more is never named; a word must match whole', () => {
  const rowsByFrame = { 30: [{ label: 'IT', value: '100 %', x: 0, y: 0 }, { label: 'Cap', value: 'Round Cap', x: 0, y: 0 }] };
  const tl = buildTimeline({ video, chapters: [], sentences: [{ i: 0, start: 0, end: 4, text: 'Is it capped? Pick a cap.', words: [] }],
    kept: [capKept[0]], changes: [], rowsByFrame });
  assert.deepEqual(tl.chapters[0].sentences[0].mentioned.map((m) => m.label), ['Cap']);
});

test('renderTimelineMarkdown: Changed, New values (value-like only), Named on screen, frames with why', () => {
  const tl = buildTimeline({
    video, chapters: [], sentences: capSentences, kept: capKept, rowsByFrame: capRows,
    changes: [
      { kind: 'changed', label: 'Line Cap', was: 'Butt Cap', text: 'Round Cap', x: 0, y: 0, t: 2 },
      { kind: 'appeared', label: 'Gap', text: '67.0', x: 0, y: 0, t: 1 },
      { kind: 'appeared', label: 'Layer Name', text: 'Shape Layer 1', x: 0, y: 0, t: 1 },
    ],
  });
  const md = renderTimelineMarkdown(tl);
  assert.match(md, /Changed: Line Cap: Butt Cap → Round Cap/);
  assert.match(md, /New values: Gap: 67\.0/);
  assert.doesNotMatch(md, /Shape Layer 1/);
  assert.match(md, /Named on screen: Line Cap: Round Cap/);
  assert.match(md, /f000060\.png \(settle\)/);
  // the second sentence has no changes: no empty Changed or New values line under it
  const second = md.slice(md.indexOf('Then lower'));
  assert.doesNotMatch(second, /Changed:|New values:/);
});

test('renderTimelineMarkdown caps each list at 12 with (+N more) (review g)', () => {
  const changes = Array.from({ length: 15 }, (_, k) => ({ kind: 'appeared', label: `Prop ${k}`, text: `${k}.0`, x: 0, y: 0, t: 1 }));
  const md = renderTimelineMarkdown(buildTimeline({ video, chapters: [], sentences: capSentences.slice(0, 1), kept: [], changes }));
  const line = md.split('\n').find((l) => l.includes('New values:'));
  assert.match(line, /Prop 11: 11\.0 \(\+3 more\)$/);
  assert.doesNotMatch(line, /Prop 12/);
});

test('renderTimelineMarkdown: a label changed several times in a sentence shows first → last; a round trip shows nothing', () => {
  const ch = (label, was, text, t) => ({ kind: 'changed', label, was, text, x: 0, y: 0, t });
  const md = renderTimelineMarkdown(buildTimeline({
    video, chapters: [], sentences: capSentences.slice(0, 1), kept: [],
    changes: [ch('Gap', '10.0', '101.0', 1), ch('Layer', 'None', 'fx', 1.5), ch('Gap', '101.0', '67.0', 2), ch('Layer', 'fx', 'None', 3)],
  }));
  const line = md.split('\n').find((l) => l.includes('Changed:'));
  assert.equal(line, '  - Changed: Gap: 10.0 → 67.0');
});

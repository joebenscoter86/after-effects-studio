import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseJson3,
  parseWhisperJson,
  toSentences,
  compareTranscripts,
  isSpeech,
  screenOnlySentences,
} from '../lib/words.mjs';

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} != ${b}`);

// Three caption events in YouTube's rolling style: a window-setup event with
// no segs, a "\n" append event, and events whose durations overlap the next.
const json3 = {
  events: [
    { tStartMs: 0, dDurationMs: 60000, id: 1 },
    {
      tStartMs: 1000, dDurationMs: 4000,
      segs: [{ utf8: 'open' }, { utf8: ' the', tOffsetMs: 400 }, { utf8: ' panel', tOffsetMs: 700 }],
    },
    { tStartMs: 2000, dDurationMs: 1000, aAppend: 1, segs: [{ utf8: '\n' }] },
    {
      tStartMs: 2000, dDurationMs: 3000,
      segs: [{ utf8: 'then' }, { utf8: '  drag ', tOffsetMs: 500 }],
    },
    {
      tStartMs: 6000, dDurationMs: 1500,
      segs: [{ utf8: 'done' }],
    },
  ],
};

test('parseJson3 gives exact times, trimmed text and ends', () => {
  const w = parseJson3(json3);
  assert.deepEqual(w.map((x) => x.text), ['open', 'the', 'panel', 'then', 'drag', 'done']);
  const starts = [1.0, 1.4, 1.7, 2.0, 2.5, 6.0];
  // Next word's start, but never past the event's end; the last word ends with its event.
  const ends = [1.4, 1.7, 2.0, 2.5, 5.0, 7.5];
  w.forEach((x, i) => {
    close(x.t, starts[i], `start ${i}`);
    close(x.end, ends[i], `end ${i}`);
  });
});

test('parseJson3 copes with no events at all', () => {
  assert.deepEqual(parseJson3({}), []);
});

const words = (list, step = 0.3, start = 0) =>
  list.map((text, i) => ({ t: start + i * step, end: start + (i + 1) * step, text }));

test('toSentences breaks after . ? !', () => {
  const s = toSentences(words(['Open', 'it.', 'Is', 'it', 'there?', 'Yes!', 'Good']));
  assert.deepEqual(s.map((x) => x.text), ['Open it.', 'Is it there?', 'Yes!', 'Good']);
  assert.deepEqual(s.map((x) => x.i), [0, 1, 2, 3]);
  close(s[0].start, 0, 'start');
  close(s[0].end, 0.6, 'end');
  assert.equal(s[1].words.length, 3);
});

test('toSentences breaks unpunctuated words at a 1.5 s gap (Review Focus 1)', () => {
  const a = words(['set', 'the', 'amount']);
  const b = words(['then', 'render'], 0.3, a[2].end + 1.5);
  const s = toSentences([...a, ...b]);
  assert.deepEqual(s.map((x) => x.text), ['set the amount', 'then render']);
});

test('toSentences keeps unpunctuated words together under the gap', () => {
  const a = words(['set', 'the', 'amount']);
  const b = words(['then', 'render'], 0.3, a[2].end + 1.0);
  assert.equal(toSentences([...a, ...b]).length, 1);
});

test('toSentences breaks unpunctuated words at 40 words (Review Focus 1)', () => {
  const list = Array.from({ length: 95 }, (_, i) => `w${i}`);
  const s = toSentences(words(list));
  assert.deepEqual(s.map((x) => x.words.length), [40, 40, 15]);
  assert.equal(s[1].words[0].text, 'w40');
});

test('toSentences honours maxGap and maxWords options', () => {
  const list = Array.from({ length: 10 }, (_, i) => `w${i}`);
  assert.equal(toSentences(words(list), { maxWords: 5 }).length, 2);
  assert.equal(toSentences(words(list, 0.3), { maxGap: 0.1 }).length, 1); // gaps are zero
  const spaced = list.map((text, i) => ({ t: i, end: i + 0.5, text }));
  assert.equal(toSentences(spaced, { maxGap: 0.4 }).length, 10);
});

test('toSentences of no words is empty', () => {
  assert.deepEqual(toSentences([]), []);
});

test('compareTranscripts finds the one changed number', () => {
  const a = words(['Set', 'the', 'amount', 'to', '40.']);
  const b = words(['set', 'the', 'amount,', 'to', '14']);
  const r = compareTranscripts(a, b);
  close(r.agreement, 0.8, 'agreement');
  assert.equal(r.disagreements.length, 1);
  assert.equal(r.disagreements[0].a, '40.');
  assert.equal(r.disagreements[0].b, '14');
  close(r.disagreements[0].t, a[4].t, 'time');
});

test('compareTranscripts reports words only one side has', () => {
  const a = words(['add', 'a', 'glow']);
  const b = words(['add', 'glow']);
  const r = compareTranscripts(a, b);
  close(r.agreement, 2 / 3, 'agreement');
  assert.deepEqual(r.disagreements.map((d) => [d.a, d.b]), [['a', '']]);
  close(r.disagreements[0].t, a[1].t, 'time');
});

test('compareTranscripts of identical and empty transcripts', () => {
  const a = words(['one', 'two']);
  assert.deepEqual(compareTranscripts(a, a), { agreement: 1, disagreements: [] });
  assert.deepEqual(compareTranscripts([], []), { agreement: 1, disagreements: [] });
});

// whisper-cli -ml 1 -sow -oj: one segment per word, text with a leading space.
const whisper = {
  result: { language: 'en' },
  transcription: [
    { timestamps: { from: '00:00:00,000', to: '00:00:00,410' }, offsets: { from: 0, to: 410 }, text: ' Hello' },
    { timestamps: { from: '00:00:00,410', to: '00:00:00,900' }, offsets: { from: 410, to: 900 }, text: ' world' },
    { timestamps: { from: '00:00:00,900', to: '00:00:00,950' }, offsets: { from: 900, to: 950 }, text: '.' },
    { timestamps: { from: '00:00:01,000', to: '00:00:03,000' }, offsets: { from: 1000, to: 3000 }, text: ' [BLANK_AUDIO]' },
    { timestamps: { from: '00:00:03,000', to: '00:00:03,000' }, offsets: { from: 3000, to: 3000 }, text: '' },
  ],
};

test('parseWhisperJson gives words in seconds, trimmed', () => {
  const w = parseWhisperJson(whisper);
  assert.deepEqual(w.map((x) => x.text), ['Hello', 'world.']);
  close(w[0].t, 0, 't0');
  close(w[0].end, 0.41, 'end0');
  close(w[1].t, 0.41, 't1');
  close(w[1].end, 0.95, 'end1');
});

test('parseWhisperJson copes with no transcription', () => {
  assert.deepEqual(parseWhisperJson({}), []);
});

// A music-only video (Tf0EiCGOEYs): whisper splits "(soft music)" into two segments,
// and YouTube's automatic captions hold "[Music]", "[Applause]" and stray words.
test('parseWhisperJson drops a marker split across segments', () => {
  const seg = (from, text) => ({ offsets: { from, to: from + 400 }, text });
  const w = parseWhisperJson({ transcription: [
    seg(0, ' (soft'), seg(400, ' music)'), seg(800, ' Open'), seg(1200, ' [BLANK_AUDIO]'), seg(1600, ' [soft'), seg(2000, ' music]'), seg(2400, ' it.'),
  ] });
  assert.deepEqual(w.map((x) => x.text), ['Open', 'it.']);
});

test('parseJson3 drops [Music] and other bracketed markers', () => {
  const w = parseJson3({ events: [
    { tStartMs: 0, dDurationMs: 900, segs: [{ utf8: '[Music]' }] },
    { tStartMs: 1000, dDurationMs: 900, segs: [{ utf8: 'so' }, { utf8: ' [Applause]', tOffsetMs: 300 }] },
  ] });
  assert.deepEqual(w.map((x) => x.text), ['so']);
});

test('isSpeech needs about ten words a minute', () => {
  const words = (n) => Array.from({ length: n }, (_, i) => ({ t: i, end: i + 0.5, text: 'w' }));
  assert.equal(isSpeech(words(2), 919), false, 'two stray words in 15 minutes');
  assert.equal(isSpeech(words(160), 919), true);
  assert.equal(isSpeech(words(6), 6), true, 'a short clip with a few words');
  assert.equal(isSpeech([], 6), false);
  assert.equal(isSpeech(words(3), undefined), true, 'no duration: any words count');
});

test('screenOnlySentences cuts each chapter into windows of at most 8 s', () => {
  const s = screenOnlySentences([{ start: 0, end: 12 }, { start: 12, end: 36 }, { start: 36, end: 40 }], 40);
  assert.deepEqual(s.map((x) => [x.start, x.end]), [[0, 6], [6, 12], [12, 20], [20, 28], [28, 36], [36, 40]]);
  assert.ok(s.every((x, i) => x.i === i && x.text === '(no speech)' && x.words.length === 0));
});

test('screenOnlySentences without chapters windows the whole video', () => {
  assert.deepEqual(screenOnlySentences([], 10).map((x) => [x.start, x.end]), [[0, 5], [5, 10]]);
});

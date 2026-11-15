// Timeline assembly and the readable page. Pure: no file or process access.
//
// A sentence belongs to the chapter containing its START time (chapter
// boundaries in real captions fall mid-sentence). A frame or change belongs to
// the sentence whose span contains its time, or the previous sentence when it
// falls in a pause; anything before the first sentence goes to the first one.

import { isValueLike } from './screen-text.mjs';

export function formatTime(seconds) {
  const tenths = Math.round(Math.max(0, seconds) * 10);
  const h = Math.floor(tenths / 36000);
  const m = Math.floor((tenths % 36000) / 600);
  const s = ((tenths % 600) / 10).toFixed(1).padStart(4, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

// Index of the last sentence whose start is at or before t (0 when t precedes all).
function sentenceIndexAt(starts, t) {
  let lo = 0;
  let hi = starts.length - 1;
  let found = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= t) { found = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return found;
}

export function buildTimeline(input) {
  const { video } = input;
  const sentences = [...(input.sentences ?? [])].sort((a, b) => a.start - b.start)
    .map((s) => ({ ...s, frames: [], changes: [], mentioned: [] }));
  const starts = sentences.map((s) => s.start);

  if (sentences.length > 0) {
    for (const k of [...(input.kept ?? [])].sort((a, b) => a.t - b.t)) {
      sentences[sentenceIndexAt(starts, k.t)].frames.push(k);
    }
    for (const c of [...(input.changes ?? [])].sort((a, b) => a.t - b.t)) {
      sentences[sentenceIndexAt(starts, c.t)].changes.push(c);
    }
  }

  const rowsFor = rowLookup(input.rowsByFrame);
  for (const s of sentences) s.mentioned = mentionedIn(s, rowsFor);

  let chapters = [...(input.chapters ?? [])].sort((a, b) => a.start - b.start);
  if (chapters.length === 0) {
    chapters = [{ title: video.title ?? '', start: 0, end: video.duration ?? (sentences.at(-1)?.end ?? 0) }];
  }
  const out = chapters.map((c, i) => ({ i, title: c.title, start: c.start, end: c.end, sentences: [] }));
  const chapterStarts = out.map((c) => c.start);
  for (const s of sentences) out[sentenceIndexAt(chapterStarts, s.start)].sentences.push(s);

  return { video: { ...video }, chapters: out };
}

// rowsByFrame may be a Map or a plain object keyed by frame number.
function rowLookup(rowsByFrame) {
  if (!rowsByFrame) return () => [];
  if (rowsByFrame instanceof Map) return (f) => rowsByFrame.get(f) ?? rowsByFrame.get(String(f)) ?? [];
  return (f) => rowsByFrame[f] ?? [];
}

const wordsOf = (text) => String(text).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

// A label is named in a sentence when every word of it with three or more
// letters is a word of the sentence, or the whole label occurs in it as a
// phrase. A label with no word of three letters or more ("IT") is never named.
function names(sentenceWords, sentencePhrase, label) {
  const words = wordsOf(label);
  const long = words.filter((w) => w.length >= 3);
  if (long.length === 0) return false;
  if (long.every((w) => sentenceWords.has(w))) return true;
  return sentencePhrase.includes(` ${words.join(' ')} `);
}

function mentionedIn(sentence, rowsFor) {
  const words = wordsOf(sentence.text);
  const set = new Set(words);
  const phrase = ` ${words.join(' ')} `;
  const byLabel = new Map();
  for (const k of sentence.frames) {
    for (const r of rowsFor(k.f)) {
      if (!names(set, phrase, r.label)) continue;
      byLabel.delete(r.label); // the last frame's value wins; order by last sighting
      byLabel.set(r.label, { label: r.label, value: r.value, f: k.f });
    }
  }
  return [...byLabel.values()];
}

const LIST_CAP = 12;

function capped(items) {
  const unique = [...new Set(items)];
  if (unique.length <= LIST_CAP) return unique.join(' · ');
  return `${unique.slice(0, LIST_CAP).join(' · ')} (+${unique.length - LIST_CAP} more)`;
}

// One item per label per sentence: the first `was` and the last `text`
// (scrubbing a value gives a run of changes); a round trip back to where it started is dropped.
function collapse(changes) {
  const byLabel = new Map();
  for (const c of changes) {
    const key = c.label ?? '';
    const run = byLabel.get(key);
    byLabel.set(key, run ? { ...run, text: c.text } : { ...c });
  }
  return [...byLabel.values()].filter((c) => c.was !== c.text);
}

const pair = (label, text) => (label ? `${label}: ${text}` : text);

function basename(file) {
  return String(file).split('/').pop();
}

export function renderTimelineMarkdown(timeline) {
  const { video } = timeline;
  const lines = [`# ${video.title ?? video.id}`, ''];
  const facts = [`id ${video.id}`];
  if (video.duration != null) facts.push(`duration ${formatTime(video.duration)}`);
  if (video.fps != null) facts.push(`${video.fps} fps`);
  if (video.wordsFrom) facts.push(`words from ${video.wordsFrom}`);
  lines.push(facts.join(' · '), '');

  for (const ch of timeline.chapters) {
    lines.push(`## ${ch.title} (${formatTime(ch.start)})`, '');
    for (const s of ch.sentences) {
      lines.push(`- **${formatTime(s.start)}** ${s.text}`);
      const changed = collapse(s.changes.filter((c) => c.kind === 'changed')).map((c) => pair(c.label, `${c.was} → ${c.text}`));
      const fresh = s.changes.filter((c) => c.kind === 'appeared' && isValueLike(c.text)).map((c) => pair(c.label, c.text));
      const named = (s.mentioned ?? []).map((m) => pair(m.label, m.value));
      if (changed.length) lines.push(`  - Changed: ${capped(changed)}`);
      if (fresh.length) lines.push(`  - New values: ${capped(fresh)}`);
      if (named.length) lines.push(`  - Named on screen: ${capped(named)}`);
      if (s.frames.length) {
        const files = s.frames.map((k) => `${basename(k.file ?? `f${k.f}`)}${k.why ? ` (${k.why})` : ''}`);
        lines.push(`  - frames: ${files.join(', ')}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

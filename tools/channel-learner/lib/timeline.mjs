// Timeline assembly and the readable page. Pure: no file or process access.
//
// A sentence belongs to the chapter containing its START time (chapter
// boundaries in real captions fall mid-sentence). A frame or change belongs to
// the sentence whose span contains its time, or the previous sentence when it
// falls in a pause; anything before the first sentence goes to the first one.

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
    .map((s) => ({ ...s, frames: [], changes: [] }));
  const starts = sentences.map((s) => s.start);

  if (sentences.length > 0) {
    for (const k of [...(input.kept ?? [])].sort((a, b) => a.t - b.t)) {
      sentences[sentenceIndexAt(starts, k.t)].frames.push(k);
    }
    for (const c of [...(input.changes ?? [])].sort((a, b) => a.t - b.t)) {
      sentences[sentenceIndexAt(starts, c.t)].changes.push(c);
    }
  }

  let chapters = [...(input.chapters ?? [])].sort((a, b) => a.start - b.start);
  if (chapters.length === 0) {
    chapters = [{ title: video.title ?? '', start: 0, end: video.duration ?? (sentences.at(-1)?.end ?? 0) }];
  }
  const out = chapters.map((c, i) => ({ i, title: c.title, start: c.start, end: c.end, sentences: [] }));
  const chapterStarts = out.map((c) => c.start);
  for (const s of sentences) out[sentenceIndexAt(chapterStarts, s.start)].sentences.push(s);

  return { video: { ...video }, chapters: out };
}

function describeChange(c) {
  const label = c.label ? `${c.label}: ` : '';
  if (c.kind === 'changed') return `${label}${c.was} → ${c.text}`;
  return `${c.kind}: ${label}${c.text}`;
}

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
      for (const c of s.changes) lines.push(`  - ${formatTime(c.t)} ${describeChange(c)}`);
      if (s.frames.length) lines.push(`  - frames: ${s.frames.map((k) => basename(k.file ?? `f${k.f}`)).join(', ')}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

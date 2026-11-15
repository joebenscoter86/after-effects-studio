// Words and sentences: captions and whisper output to timed words, words to
// sentences, and a word-level comparison of two transcripts.
//
// Word = { t, end, text } in seconds.
// Sentence = { i, start, end, text, words }.

const SPLIT = /\s+/u;

// YouTube json3 captions. Events can lack segs (window set-up) or hold only
// "\n" (line appends); rolling captions overlap, so an event's end can lie
// after the next event's first word. A word ends at the next word's start,
// never past its own event's end; the last word ends with its event.
export function parseJson3(json) {
  const raw = [];
  for (const ev of json?.events ?? []) {
    if (!Array.isArray(ev.segs)) continue;
    const evStart = (ev.tStartMs ?? 0) / 1000;
    const evEnd = evStart + (ev.dDurationMs ?? 0) / 1000;
    const segs = ev.segs
      .map((s) => ({ at: evStart + (s.tOffsetMs ?? 0) / 1000, parts: String(s.utf8 ?? '').trim().split(SPLIT).filter(Boolean) }))
      .filter((s) => s.parts.length);
    segs.forEach((s, k) => {
      // A seg holding several words: spread them evenly up to the next seg.
      const until = k + 1 < segs.length ? segs[k + 1].at : evEnd;
      const step = Math.max(0, until - s.at) / s.parts.length;
      s.parts.forEach((text, j) => raw.push({ t: s.at + j * step, evEnd, text }));
    });
  }
  raw.sort((a, b) => a.t - b.t);
  return raw.map((w, k) => {
    const next = raw[k + 1];
    let end = next ? Math.min(next.t, w.evEnd) : w.evEnd;
    if (!(end >= w.t)) end = w.t;
    return { t: w.t, end, text: w.text };
  });
}

// whisper-cli -ml 1 -sow -oj: { transcription: [{ offsets: { from, to } (ms), text }] },
// one segment per word with a leading space. Empty segments and markers such
// as "[BLANK_AUDIO]" are dropped; a segment that starts with punctuation
// (".", ",", "'s") is joined to the word before it.
export function parseWhisperJson(json) {
  const out = [];
  for (const seg of json?.transcription ?? []) {
    const text = String(seg.text ?? '').trim();
    if (!text) continue;
    if (/^[[(].*[\])]$/u.test(text)) continue;
    const t = (seg.offsets?.from ?? 0) / 1000;
    const end = Math.max(t, (seg.offsets?.to ?? 0) / 1000);
    const prev = out[out.length - 1];
    if (prev && /^[^\p{L}\p{N}]/u.test(text)) {
      prev.text += text;
      prev.end = Math.max(prev.end, end);
      continue;
    }
    out.push({ t, end, text });
  }
  return out;
}

// Break after a word ending . ? or !, before a gap over maxGap, or at maxWords.
export function toSentences(words, opts = {}) {
  const maxGap = opts.maxGap ?? 1.2;
  const maxWords = opts.maxWords ?? 40;
  const out = [];
  let cur = [];
  const flush = () => {
    if (!cur.length) return;
    out.push({
      i: out.length,
      start: cur[0].t,
      end: cur[cur.length - 1].end,
      text: cur.map((w) => w.text).join(' '),
      words: cur,
    });
    cur = [];
  };
  words.forEach((w, k) => {
    cur.push(w);
    const next = words[k + 1];
    if (
      /[.?!]["')\]]*$/u.test(w.text) ||
      cur.length >= maxWords ||
      (next && next.t - w.end > maxGap)
    ) flush();
  });
  flush();
  return out;
}

const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// Align two transcripts by longest common subsequence of normalised words.
// Each run of unmatched words between matches is paired off one to one; a
// word only one side has is reported against ''. agreement is matched words
// over the longer transcript's length.
export function compareTranscripts(a, b) {
  const A = a.filter((w) => norm(w.text));
  const B = b.filter((w) => norm(w.text));
  const n = A.length;
  const m = B.length;
  if (!n && !m) return { agreement: 1, disagreements: [] };
  const na = A.map((w) => norm(w.text));
  const nb = B.map((w) => norm(w.text));
  const W = m + 1;
  const L = new Int32Array((n + 1) * W);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      L[i * W + j] = na[i] === nb[j]
        ? L[(i + 1) * W + j + 1] + 1
        : Math.max(L[(i + 1) * W + j], L[i * W + j + 1]);
    }
  }
  const disagreements = [];
  let runA = [];
  let runB = [];
  const flush = () => {
    for (let k = 0; k < Math.max(runA.length, runB.length); k++) {
      const wa = runA[k];
      const wb = runB[k];
      disagreements.push({ t: (wa ?? wb).t, a: wa ? wa.text : '', b: wb ? wb.text : '' });
    }
    runA = [];
    runB = [];
  };
  let i = 0;
  let j = 0;
  let matched = 0;
  while (i < n && j < m) {
    if (na[i] === nb[j]) {
      flush();
      matched++;
      i++;
      j++;
    } else if (L[(i + 1) * W + j] >= L[i * W + j + 1]) {
      runA.push(A[i++]);
    } else {
      runB.push(B[j++]);
    }
  }
  while (i < n) runA.push(A[i++]);
  while (j < m) runB.push(B[j++]);
  flush();
  return { agreement: matched / Math.max(n, m), disagreements };
}

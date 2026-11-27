#!/usr/bin/env node
// Channel learner command line.
//
//   node tools/channel-learner/learn.mjs gather <url> --out <dir>
//   node tools/channel-learner/learn.mjs align <dir>
//   node tools/channel-learner/learn.mjs status <dir>
//   node tools/channel-learner/learn.mjs link <worktree root> [--to <dir>]
//     points <root>/quality/renders/channel-study at the shared studies folder (default
//     ~/Assets/comp-room-studies/channel-study), outside every worktree, so archiving a session
//     cannot delete a study; refuses a real folder or a link elsewhere and changes nothing.
//   (gather and align take --redo <step>[,<step>] to run finished steps again)
//
// <dir>/state.json is the ledger:
//   { video: { id, url, title, duration, fps }, words?, steps: { <name>: { done, at, note? } }, stopped?: { step, reason } }
// Each step records itself and is skipped once done; files already in <dir>
// (source.info.json, source.mp4, captions.*.json3, audio.wav, whisper.json) are adopted.
//
// align writes boxes.jsonl (recognised text per kept frame) in the text step and rows.jsonl
// (label and value pairs per kept frame, from boxes.jsonl) in the timeline step, so
// `--redo timeline` rebuilds the value list without reading text again.
//
// Outside actions go through `deps` so tests can pass fakes; the real ones are below.
// Exit codes: 0 done, 1 a step failed, 2 stopped because the video has no usable words,
// 3 stopped because YouTube asked to confirm we are not a bot (gather stops at once and
// does not try again; run it again later).
// A video download refused with HTTP 403 is fetched once more before the step fails.
//
// --redo <step> also clears every later step. A redone gather step fetches its file again
// (the old one is set aside and put back if the fetch fails). audio.wav and whisper.json
// are written under a temporary name and renamed when complete.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compareTranscripts, isSpeech, parseJson3, parseWhisperJson, screenOnlySentences, toSentences } from './lib/words.mjs';
import { measureChanges, noisyCells, pickFrames } from './lib/change.mjs';
import { diffRows, readBoxes, toRows } from './lib/screen-text.mjs';
import { buildTimeline, renderTimelineMarkdown } from './lib/timeline.mjs';

export const STEPS = ['info', 'video', 'captions', 'audio', 'whisper', 'changes', 'frames', 'text', 'timeline'];

const HERE = dirname(fileURLToPath(import.meta.url));
const OCR_BINARY = join(HERE, '.build', 'ocr');
const WHISPER_MODEL = join(homedir(), '.whisper-cpp', 'ggml-medium.en.bin');
const AUTO_LANG = 'en-orig';

// ---------- real outside actions ----------

/**
 * 1920-wide JPEG copies of full-size frames, <outDir>/<name>.jpg, for agents to look at (the prompts read
 * frames-small/; full-size frames stay for crops). macOS `sips`, eight at a time.
 */
export async function smallFramesSips({ images, outDir, width = 1920, jobs = 8 }) {
  await mkdir(outDir, { recursive: true });
  const queue = [...images];
  const worker = async () => {
    for (let p = queue.shift(); p; p = queue.shift()) {
      const out = join(outDir, p.split('/').pop().replace(/\.png$/, '.jpg'));
      await exec('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '80', '--resampleWidth', String(width), p, '--out', out]);
    }
  };
  await Promise.all(Array.from({ length: jobs }, worker));
}

function exec(cmd, args, { cwd } = {}) {
  return new Promise((ok, fail) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'inherit', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => {
      process.stderr.write(d);
      stderr = (stderr + d).slice(-4000);
    });
    child.on('error', fail);
    child.on('close', (code) => {
      if (code === 0) ok();
      else fail(new Error(`${cmd} exited ${code}: ${stderr.trim().split('\n').slice(-3).join(' | ')}`));
    });
  });
}

/**
 * Extract frames (by decoded-frame index, as measureChanges counts them) as full-size PNGs
 * named <outDir>/f<6-digit frame>.png. One ffmpeg process per batch selects many frames
 * and stops after the last one; the output count is checked against the request.
 */
export async function extractFramesFfmpeg({ video, frames, outDir, batch = 1000 }) {
  const wanted = [...new Set(frames)].sort((a, b) => a - b);
  await mkdir(outDir, { recursive: true });
  for (let i = 0; i < wanted.length; i += batch) {
    const group = wanted.slice(i, i + batch);
    const tmp = await mkdtemp(join(outDir, '.extract-'));
    try {
      const select = group.map((f) => `eq(n,${f})`).join('+');
      await exec('ffmpeg', ['-v', 'error', '-nostdin', '-i', video, '-map', '0:v:0', '-an',
        '-vf', `select='${select}'`, '-fps_mode', 'passthrough', '-frames:v', String(group.length),
        '-start_number', '0', join(tmp, '%06d.png')]);
      const made = (await readdir(tmp)).filter((n) => n.endsWith('.png')).sort();
      if (made.length !== group.length) {
        throw new Error(`ffmpeg wrote ${made.length} of ${group.length} frames (${group[0]}..${group.at(-1)})`);
      }
      for (let k = 0; k < group.length; k++) await rename(join(tmp, made[k]), join(outDir, frameName(group[k])));
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  }
}

// --ignore-config: a user's yt-dlp config (which may carry sign-in settings) is never read.
export const realDeps = {
  fetchInfo: ({ url, dir }) => exec('yt-dlp', ['--ignore-config', '--no-playlist', '--skip-download', '--write-info-json',
    '-o', 'source.%(ext)s', url], { cwd: dir }),
  downloadVideo: ({ url, dir }) => exec('yt-dlp', ['--ignore-config', '--no-playlist', '-f', '401+140/315+251/bv*[height<=2160]+ba',
    '--merge-output-format', 'mp4', '--write-info-json', '-o', 'source.%(ext)s', url], { cwd: dir }),
  fetchCaptions: ({ url, dir, lang, auto }) => exec('yt-dlp', ['--ignore-config', '--no-playlist', '--skip-download',
    auto ? '--write-auto-subs' : '--write-subs', '--sub-langs', lang, '--sub-format', 'json3',
    '-o', 'captions.%(ext)s', url], { cwd: dir }),
  // `out` is the temporary file to write (audio.part.wav, whisper.part.json); the caller renames it.
  extractAudio: ({ dir, out }) => exec('ffmpeg', ['-y', '-nostdin', '-v', 'error', '-i', 'source.mp4',
    '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', out], { cwd: dir }),
  transcribe: ({ dir, out }) => exec('whisper-cli', ['-m', WHISPER_MODEL, '-f', 'audio.wav',
    '-ml', '1', '-sow', '-oj', '-of', out.replace(/\.json$/, ''), '-np'], { cwd: dir }),
  measureChanges: (video, out) => measureChanges(video, out, {
    onProgress: (f) => { if (f % 6000 === 0) console.log(`  changes: ${f} frames`); },
  }),
  extractFrames: (args) => extractFramesFfmpeg(args),
  smallFrames: (args) => smallFramesSips(args),
  readBoxes: async (images) => {
    if (!existsSync(OCR_BINARY)) throw new Error(`no OCR binary at ${OCR_BINARY}; run tools/channel-learner/ocr/build.sh`);
    return readBoxes(OCR_BINARY, images);
  },
  log: (...a) => console.log(...a),
};

// ---------- ledger and files ----------

const frameName = (f) => `f${String(f).padStart(6, '0')}.png`;
const errText = (e) => (e && e.message ? e.message : String(e));

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function readJsonl(path) {
  const text = await readFile(path, 'utf8');
  return text.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
}

async function loadState(dir) {
  const p = join(dir, 'state.json');
  if (!existsSync(p)) return { video: {}, steps: {} };
  const s = await readJson(p);
  s.video ??= {};
  s.steps ??= {};
  return s;
}

async function saveState(dir, state) {
  const p = join(dir, 'state.json');
  await writeFile(`${p}.tmp`, JSON.stringify(state, null, 2) + '\n');
  await rename(`${p}.tmp`, p);
}

function mark(state, step, note, extra = {}) {
  state.steps[step] = { done: true, at: new Date().toISOString(), ...(note ? { note } : {}), ...extra };
}

function markFailed(state, step, note) {
  state.steps[step] = { done: false, at: new Date().toISOString(), note };
}

const done = (state, step) => state.steps[step]?.done === true;

// Creator-uploaded English tracks listed in the info JSON's `subtitles`.
function creatorLangs(info) {
  const keys = Object.keys(info?.subtitles ?? {}).filter((k) => /^en($|[-_])/i.test(k));
  return keys.sort((a, b) => (a === 'en' ? -1 : b === 'en' ? 1 : a.localeCompare(b)));
}

// The word sources present in <dir>, in the order the timeline prefers them:
// captions the creator uploaded, then whisper, then YouTube's automatic captions.
// A source with too few words for its length (isSpeech) is music or noise, not speech.
async function wordSources(dir, info) {
  const out = [];
  const speech = (words) => isSpeech(words, info?.duration);
  for (const lang of creatorLangs(info)) {
    const file = `captions.${lang}.json3`;
    if (existsSync(join(dir, file))) {
      const words = parseJson3(await readJson(join(dir, file)));
      if (speech(words)) { out.push({ name: 'captions-creator', file, words }); break; }
    }
  }
  if (existsSync(join(dir, 'whisper.json'))) {
    const words = parseWhisperJson(await readJson(join(dir, 'whisper.json')));
    if (speech(words)) out.push({ name: 'whisper', file: 'whisper.json', words });
  }
  const autoFile = `captions.${AUTO_LANG}.json3`;
  if (existsSync(join(dir, autoFile))) {
    const words = parseJson3(await readJson(join(dir, autoFile)));
    if (speech(words)) out.push({ name: 'captions-auto', file: autoFile, words });
  }
  return out;
}

function noWordsReason(state) {
  const why = (s) => state.steps[s]?.note ?? (done(state, s) ? 'done but empty' : 'not run');
  return `no usable words: captions (${why('captions')}); whisper (${why('whisper')})`;
}

// A tutorial with music and no narration: whisper ran and heard no speech. With chapters
// to split it by, the timeline is built from the screen alone (screenOnlySentences);
// without chapters there is nothing to hang the techniques on, so it stops.
const SCREEN_ONLY = 'none (screen only)';
const chaptersOf = (info) => (info?.chapters ?? []).map((c) => ({ title: c.title, start: c.start_time, end: c.end_time }));
const screenOnly = (state, info) => done(state, 'whisper') && chaptersOf(info).length > 0;
const noSpeechReason = (state) => `no speech: whisper ran (${state.steps.whisper?.note ?? 'done'}) but heard only music or markers, and the video has no chapters to split it by`;

// YouTube's "Sign in to confirm you're not a bot". Retrying soon only makes it worse.
const BOT_CHECK = /confirm you.?re not a bot|sign in to confirm/i;
const isBotCheck = (e) => BOT_CHECK.test(errText(e));
const botReason = (e) => `youtube bot check: ${errText(e).split('\n')[0].trim()}`;
// yt-dlp's "unable to download video data: HTTP Error 403: Forbidden".
const HTTP_403 = /HTTP Error 403/;

// Run one step unless done. `body` returns a note (or { note, extra }). Failure records `stopped`.
async function step(dir, state, name, body) {
  if (done(state, name)) return true;
  try {
    const r = await body();
    if (r && typeof r === 'object') mark(state, name, r.note, r.extra);
    else mark(state, name, r);
    await saveState(dir, state);
    return true;
  } catch (e) {
    markFailed(state, name, errText(e));
    state.stopped = { step: name, reason: isBotCheck(e) ? botReason(e) : errText(e) };
    await saveState(dir, state);
    return false;
  }
}

// Adopt `file` if it is in dir, else run `fetch` and check the file appeared.
// fresh: set an existing file aside and fetch anyway; the old file is put back if that fails.
async function adoptOrFetch(dir, file, fetch, { fresh = false } = {}) {
  const p = join(dir, file);
  const old = `${p}.redo-old`;
  if (fresh && existsSync(p)) await rename(p, old);
  try {
    if (existsSync(p)) return `adopted ${file}`;
    await fetch();
    if (!existsSync(p)) throw new Error(`${file} was not written`);
    await rm(old, { force: true });
    return `wrote ${file}`;
  } catch (e) {
    if (existsSync(old) && !existsSync(p)) await rename(old, p);
    throw e;
  }
}

// Like adoptOrFetch for a file we make: `make(tmp)` writes the temporary name, which is
// renamed to `file` only when it succeeds, so a partial file is never adopted.
async function adoptOrMake(dir, file, tmp, make, opts) {
  await rm(join(dir, tmp), { force: true });
  try {
    return await adoptOrFetch(dir, file, async () => {
      await make(tmp);
      if (!existsSync(join(dir, tmp))) throw new Error(`${tmp} was not written`);
      await rename(join(dir, tmp), join(dir, file));
    }, opts);
  } finally {
    await rm(join(dir, tmp), { force: true });
  }
}

// --redo clears the named steps and every step after the earliest of them.
function clearForRedo(state, redo) {
  if (!redo.length) return;
  const from = Math.min(...redo.map((s) => STEPS.indexOf(s)));
  for (const s of STEPS.slice(from)) delete state.steps[s];
}

// ---------- gather ----------

async function gather(url, dir, d, redo) {
  await mkdir(dir, { recursive: true });
  const state = await loadState(dir);
  delete state.stopped;
  clearForRedo(state, redo);
  const fresh = (name) => ({ fresh: redo.includes(name) });
  const failed = () => {
    if (!state.stopped?.reason.startsWith('youtube bot check')) return 1;
    d.log(`stopped at ${state.stopped.step}: ${state.stopped.reason}; not trying again in this run`);
    return 3;
  };

  if (!(await step(dir, state, 'info', () => adoptOrFetch(dir, 'source.info.json', () => d.fetchInfo({ url, dir }), fresh('info'))))) return failed();
  const info = await readJson(join(dir, 'source.info.json'));
  state.video = {
    ...state.video,
    id: info.id ?? state.video.id,
    url: info.webpage_url ?? url,
    title: info.title ?? state.video.title,
    duration: info.duration ?? state.video.duration,
    fps: state.video.fps ?? info.fps,
  };
  await saveState(dir, state);
  d.log(`gather ${state.video.id}: ${state.video.title}`);

  // A 403 here is YouTube refusing one signed stream URL; a fresh yt-dlp call gets new URLs and
  // has worked at once (LESSONS.md lesson 53). One more try only: it is not the bot check.
  const download = async () => {
    try {
      await d.downloadVideo({ url, dir });
    } catch (e) {
      if (isBotCheck(e) || !HTTP_403.test(errText(e))) throw e;
      d.log('video download refused with HTTP 403; fetching it once more');
      await d.downloadVideo({ url, dir });
    }
  };
  if (!(await step(dir, state, 'video', () => adoptOrFetch(dir, 'source.mp4', download, fresh('video'))))) return failed();

  // Captions are fetched apart from the video: a failure here (HTTP 429 is common) is noted,
  // does not stop gather, and is retried on the next run.
  if (!done(state, 'captions')) {
    const tries = [...creatorLangs(info).map((lang) => ({ lang, auto: false })), { lang: AUTO_LANG, auto: true }];
    const errors = [];
    let got = null;
    for (const t of tries) {
      const file = `captions.${t.lang}.json3`;
      try {
        const note = await adoptOrFetch(dir, file, () => d.fetchCaptions({ url, dir, lang: t.lang, auto: t.auto }), fresh('captions'));
        got = { note, file, auto: t.auto };
        break;
      } catch (e) {
        if (isBotCheck(e)) {
          markFailed(state, 'captions', errText(e));
          state.stopped = { step: 'captions', reason: botReason(e) };
          await saveState(dir, state);
          return failed();
        }
        errors.push(`${t.lang}: ${errText(e)}`);
      }
    }
    if (got) mark(state, 'captions', got.note, { file: got.file, auto: got.auto });
    else markFailed(state, 'captions', errors.join('; '));
    await saveState(dir, state);
  }

  // Whisper always runs when it can: it is the fallback and the check on the captions.
  if (!done(state, 'audio')) {
    try {
      mark(state, 'audio', await adoptOrMake(dir, 'audio.wav', 'audio.part.wav', (out) => d.extractAudio({ dir, out }), fresh('audio')));
    } catch (e) { markFailed(state, 'audio', errText(e)); }
    await saveState(dir, state);
  }
  if (!done(state, 'whisper')) {
    try {
      if (!done(state, 'audio')) throw new Error(`no audio (${state.steps.audio?.note})`);
      mark(state, 'whisper', await adoptOrMake(dir, 'whisper.json', 'whisper.part.json', (out) => d.transcribe({ dir, out }), fresh('whisper')));
    } catch (e) { markFailed(state, 'whisper', errText(e)); }
    await saveState(dir, state);
  }

  const sources = await wordSources(dir, info);
  if (sources.length === 0 && screenOnly(state, info)) {
    d.log('gather done; no speech (music only), so align will build the timeline from the screen and the chapters');
    return 0;
  }
  if (sources.length === 0) {
    state.stopped = { step: 'gather', reason: done(state, 'whisper') ? noSpeechReason(state) : noWordsReason(state) };
    await saveState(dir, state);
    d.log(`stopped: ${state.stopped.reason}`);
    return 2;
  }
  d.log(`gather done; words available from ${sources.map((s) => s.name).join(', ')}`);
  return 0;
}

// ---------- align ----------

async function align(dir, d, redo) {
  const state = await loadState(dir);
  if (!done(state, 'info') || !done(state, 'video')) {
    d.log(`align: ${dir} has no gathered video; run gather first`);
    return 1;
  }
  delete state.stopped;
  clearForRedo(state, redo);
  const info = await readJson(join(dir, 'source.info.json'));
  const video = join(dir, 'source.mp4');

  const sources = await wordSources(dir, info);
  if (sources.length === 0 && !screenOnly(state, info)) {
    state.stopped = { step: 'align', reason: done(state, 'whisper') ? noSpeechReason(state) : noWordsReason(state) };
    await saveState(dir, state);
    d.log(`stopped: ${state.stopped.reason}`);
    return 2;
  }
  const [chosen, other] = sources.length ? sources : [{ name: SCREEN_ONLY, words: [] }];
  const sentences = sources.length
    ? toSentences(chosen.words)
    : screenOnlySentences(chaptersOf(info), info.duration);

  const changesPath = join(dir, 'changes.jsonl');
  if (!(await step(dir, state, 'changes', async () => {
    const r = await d.measureChanges(video, changesPath);
    if (r?.fps) state.video.fps = r.fps;
    return `${r?.frames} frames at ${r?.fps} fps`;
  }))) return 1;

  const keptPath = join(dir, 'kept.json');
  const framesDir = join(dir, 'frames');
  if (!(await step(dir, state, 'frames', async () => {
    const stats = await readJsonl(changesPath);
    const noisy = noisyCells(stats);
    const kept = pickFrames(stats, sentences.map((s) => s.start), { ignoreCells: noisy })
      .map((k) => ({ ...k, file: `frames/${frameName(k.f)}` }));
    await writeFile(keptPath, JSON.stringify({ noisyCells: noisy, kept }, null, 2) + '\n');
    const todo = kept.filter((k) => !existsSync(join(dir, k.file))).map((k) => k.f);
    if (todo.length) await d.extractFrames({ video, frames: todo, outDir: framesDir });
    const missing = kept.filter((k) => !existsSync(join(dir, k.file)));
    if (missing.length) throw new Error(`${missing.length} of ${kept.length} frames missing after extraction (first ${missing[0].file})`);
    const small = (k) => join(dir, k.file.replace(/^frames\//, 'frames-small/').replace(/\.png$/, '.jpg'));
    const toShrink = kept.filter((k) => !existsSync(small(k)));
    if (toShrink.length) await d.smallFrames({ images: toShrink.map((k) => join(dir, k.file)), outDir: join(dir, 'frames-small') });
    const noSmall = kept.filter((k) => !existsSync(small(k)));
    if (noSmall.length) throw new Error(`${noSmall.length} of ${kept.length} small frames missing (first ${noSmall[0].file})`);
    return `${kept.length} frames kept from ${stats.length}; noisy cells ${noisy.length ? noisy.join(',') : 'none'}`;
  }))) return 1;

  const boxesPath = join(dir, 'boxes.jsonl');
  if (!(await step(dir, state, 'text', async () => {
    const { kept } = await readJson(keptPath);
    const images = kept.map((k) => join(dir, k.file));
    const map = await d.readBoxes(images);
    let unread = 0;
    const lines = kept.map((k, i) => {
      const boxes = map.get(images[i]);
      if (!boxes) unread++;
      return JSON.stringify({ file: k.file, f: k.f, t: k.t, boxes: boxes ?? null });
    });
    await writeFile(boxesPath, lines.join('\n') + (lines.length ? '\n' : ''));
    const note = `${kept.length - unread} of ${kept.length} frames read${unread ? `; ${unread} unreadable` : ''}`;
    if (unread > kept.length / 2) throw new Error(`too few frames read: ${note}`);
    return note;
  }))) return 1;

  if (!(await step(dir, state, 'timeline', async () => {
    const { kept } = await readJson(keptPath);
    const boxRows = await readJsonl(boxesPath);
    const ignorePath = join(dir, 'ignore.json');
    let ignore = [];
    if (existsSync(ignorePath)) {
      const raw = await readJson(ignorePath);
      ignore = Array.isArray(raw) ? raw : (raw.ignore ?? []);
    }
    const chapters = chaptersOf(info);
    // Values are tracked by label, not position (the editor zooms and pans the recording),
    // and each chapter starts with nothing seen.
    const chapterStarts = chapters.map((c) => c.start).sort((a, b) => a - b);
    const chapterAt = (t) => chapterStarts.filter((s) => s <= t).length;
    const changes = [];
    const rowsByFrame = new Map();
    const rowLines = [];
    let seen = new Map();
    let chapter = null;
    for (const row of [...boxRows].sort((a, b) => a.t - b.t)) {
      const rows = row.boxes ? toRows(row.boxes, { ignore }) : [];
      rowsByFrame.set(row.f, rows);
      rowLines.push(JSON.stringify({ f: row.f, t: row.t, rows }));
      if (!row.boxes) continue;
      const ch = chapterAt(row.t);
      if (ch !== chapter) { seen = new Map(); chapter = ch; }
      for (const c of diffRows(seen, rows)) changes.push({ ...c, t: row.t, f: row.f });
    }
    await writeFile(join(dir, 'rows.jsonl'), rowLines.join('\n') + (rowLines.length ? '\n' : ''));
    const timeline = buildTimeline({
      video: { ...state.video, wordsFrom: chosen.name },
      chapters, sentences, kept, changes, rowsByFrame,
    });
    const count = (kind) => changes.filter((c) => c.kind === kind).length;
    const mentioned = timeline.chapters.reduce((n, c) => n + c.sentences.reduce((m, s) => m + s.mentioned.length, 0), 0);
    await writeFile(join(dir, 'timeline.json'), JSON.stringify(timeline, null, 2) + '\n');
    await writeFile(join(dir, 'timeline.md'), renderTimelineMarkdown(timeline));
    if (other) {
      const cmp = compareTranscripts(chosen.words, other.words);
      await writeFile(join(dir, 'transcript-check.json'),
        JSON.stringify({ a: chosen.name, b: other.name, ...cmp }, null, 2) + '\n');
    }
    state.words = chosen.name;
    return `words from ${chosen.name}; ${sentences.length} sentences, ${kept.length} frames; `
      + `${count('changed')} changed, ${count('appeared')} appeared, ${mentioned} named on screen`
      + (other ? `; checked against ${other.name}` : '');
  }))) return 1;

  d.log(`align done: ${join(dir, 'timeline.md')}`);
  return 0;
}

// ---------- status ----------

async function status(dir, d) {
  if (!existsSync(join(dir, 'state.json'))) {
    d.log(`no ledger at ${join(dir, 'state.json')}`);
    return 1;
  }
  const state = await loadState(dir);
  const v = state.video;
  d.log(`${v.id ?? '?'}  ${v.title ?? ''}  ${v.duration ?? '?'} s  ${v.fps ?? '?'} fps${state.words ? `  words: ${state.words}` : ''}`);
  for (const s of STEPS) {
    const r = state.steps[s];
    const flag = r?.done ? 'done' : 'not done';
    d.log(`${s.padEnd(9)} ${flag.padEnd(9)}${r?.at ? ` ${r.at}` : ''}${r?.note ? `  ${r.note}` : ''}`);
  }
  if (state.stopped) d.log(`stopped at ${state.stopped.step}: ${state.stopped.reason}`);
  return 0;
}

// ---------- link ----------

export const STUDIES = join(homedir(), 'Assets', 'comp-room-studies', 'channel-study');

async function link(root, to, d) {
  const { lstat, readlink, symlink } = await import('node:fs/promises');
  const at = join(root, 'quality', 'renders', 'channel-study');
  let st = null;
  try { st = await lstat(at); } catch { /* missing */ }
  if (st?.isSymbolicLink()) {
    const now = await readlink(at);
    if (resolve(dirname(at), now) === resolve(to)) { d.log(`${at} already points at ${to}`); return 0; }
    d.log(`refused: ${at} is a link to ${now}, not ${to}; change it by hand`);
    return 1;
  }
  if (st) { d.log(`refused: ${at} is a real folder; move its studies into ${to} by hand, then link`); return 1; }
  await mkdir(dirname(at), { recursive: true });
  await symlink(to, at);
  d.log(`linked ${at} -> ${to}`);
  return 0;
}

// ---------- entry ----------

const USAGE = 'usage: learn.mjs gather <url> --out <dir> | align <dir> | status <dir> | link <worktree root> [--to <dir>]   [--redo <step>[,<step>]]';

export async function run(argv, deps = {}) {
  const d = { ...realDeps, ...deps };
  const args = [...argv];
  const take = (flag) => {
    const i = args.indexOf(flag);
    if (i < 0) return undefined;
    const [, value] = args.splice(i, 2);
    return value;
  };
  const out = take('--out');
  const to = take('--to');
  const redo = (take('--redo') ?? '').split(',').filter(Boolean);
  const bad = redo.filter((s) => !STEPS.includes(s));
  if (bad.length) { d.log(`unknown step ${bad.join(', ')}; steps are ${STEPS.join(', ')}`); return 1; }
  const [cmd, target] = args;
  try {
    if (cmd === 'gather' && target && out) return await gather(target, resolve(out), d, redo);
    if (cmd === 'align' && target) return await align(resolve(target), d, redo);
    if (cmd === 'status' && target) return await status(resolve(target), d);
    if (cmd === 'link' && target) return await link(resolve(target), resolve(to ?? STUDIES), d);
  } catch (e) {
    d.log(`error: ${errText(e)}`);
    return 1;
  }
  d.log(USAGE);
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}

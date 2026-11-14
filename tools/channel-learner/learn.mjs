#!/usr/bin/env node
// Channel learner command line.
//
//   node tools/channel-learner/learn.mjs gather <url> --out <dir>
//   node tools/channel-learner/learn.mjs align <dir>
//   node tools/channel-learner/learn.mjs status <dir>
//   (gather and align take --redo <step>[,<step>] to run finished steps again)
//
// <dir>/state.json is the ledger:
//   { video: { id, url, title, duration, fps }, words?, steps: { <name>: { done, at, note? } }, stopped?: { step, reason } }
// Each step records itself and is skipped once done; files already in <dir>
// (source.info.json, source.mp4, captions.*.json3, audio.wav, whisper.json) are adopted.
//
// Outside actions go through `deps` so tests can pass fakes; the real ones are below.
// Exit codes: 0 done, 1 a step failed, 2 stopped because the video has no usable words.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compareTranscripts, parseJson3, parseWhisperJson, toSentences } from './lib/words.mjs';
import { measureChanges, noisyCells, pickFrames } from './lib/change.mjs';
import { diffBoxes, readBoxes } from './lib/screen-text.mjs';
import { buildTimeline, renderTimelineMarkdown } from './lib/timeline.mjs';

export const STEPS = ['info', 'video', 'captions', 'audio', 'whisper', 'changes', 'frames', 'text', 'timeline'];

const HERE = dirname(fileURLToPath(import.meta.url));
const OCR_BINARY = join(HERE, '.build', 'ocr');
const WHISPER_MODEL = join(homedir(), '.whisper-cpp', 'ggml-medium.en.bin');
const AUTO_LANG = 'en-orig';

// ---------- real outside actions ----------

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

export const realDeps = {
  fetchInfo: ({ url, dir }) => exec('yt-dlp', ['--no-playlist', '--skip-download', '--write-info-json',
    '-o', 'source.%(ext)s', url], { cwd: dir }),
  downloadVideo: ({ url, dir }) => exec('yt-dlp', ['--no-playlist', '-f', '401+140/315+251/bv*[height<=2160]+ba',
    '--merge-output-format', 'mp4', '--write-info-json', '-o', 'source.%(ext)s', url], { cwd: dir }),
  fetchCaptions: ({ url, dir, lang, auto }) => exec('yt-dlp', ['--no-playlist', '--skip-download',
    auto ? '--write-auto-subs' : '--write-subs', '--sub-langs', lang, '--sub-format', 'json3',
    '-o', 'captions.%(ext)s', url], { cwd: dir }),
  extractAudio: ({ dir }) => exec('ffmpeg', ['-y', '-nostdin', '-v', 'error', '-i', 'source.mp4',
    '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', 'audio.wav'], { cwd: dir }),
  transcribe: ({ dir }) => exec('whisper-cli', ['-m', WHISPER_MODEL, '-f', 'audio.wav',
    '-ml', '1', '-sow', '-oj', '-of', 'whisper', '-np'], { cwd: dir }),
  measureChanges: (video, out) => measureChanges(video, out, {
    onProgress: (f) => { if (f % 6000 === 0) console.log(`  changes: ${f} frames`); },
  }),
  extractFrames: (args) => extractFramesFfmpeg(args),
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
async function wordSources(dir, info) {
  const out = [];
  for (const lang of creatorLangs(info)) {
    const file = `captions.${lang}.json3`;
    if (existsSync(join(dir, file))) {
      const words = parseJson3(await readJson(join(dir, file)));
      if (words.length) { out.push({ name: 'captions-creator', file, words }); break; }
    }
  }
  if (existsSync(join(dir, 'whisper.json'))) {
    const words = parseWhisperJson(await readJson(join(dir, 'whisper.json')));
    if (words.length) out.push({ name: 'whisper', file: 'whisper.json', words });
  }
  const autoFile = `captions.${AUTO_LANG}.json3`;
  if (existsSync(join(dir, autoFile))) {
    const words = parseJson3(await readJson(join(dir, autoFile)));
    if (words.length) out.push({ name: 'captions-auto', file: autoFile, words });
  }
  return out;
}

function noWordsReason(state) {
  const why = (s) => state.steps[s]?.note ?? (done(state, s) ? 'done but empty' : 'not run');
  return `no usable words: captions (${why('captions')}); whisper (${why('whisper')})`;
}

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
    state.stopped = { step: name, reason: errText(e) };
    await saveState(dir, state);
    return false;
  }
}

// Adopt `file` if it is in dir, else run `fetch` and check the file appeared.
async function adoptOrFetch(dir, file, fetch) {
  if (existsSync(join(dir, file))) return `adopted ${file}`;
  await fetch();
  if (!existsSync(join(dir, file))) throw new Error(`${file} was not written`);
  return `wrote ${file}`;
}

// ---------- gather ----------

async function gather(url, dir, d, redo) {
  await mkdir(dir, { recursive: true });
  const state = await loadState(dir);
  delete state.stopped;
  for (const s of redo) delete state.steps[s];

  if (!(await step(dir, state, 'info', () => adoptOrFetch(dir, 'source.info.json', () => d.fetchInfo({ url, dir }))))) return 1;
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

  if (!(await step(dir, state, 'video', () => adoptOrFetch(dir, 'source.mp4', () => d.downloadVideo({ url, dir }))))) return 1;

  // Captions are fetched apart from the video: a failure here (HTTP 429 is common) is noted,
  // does not stop gather, and is retried on the next run.
  if (!done(state, 'captions')) {
    const tries = [...creatorLangs(info).map((lang) => ({ lang, auto: false })), { lang: AUTO_LANG, auto: true }];
    const errors = [];
    let got = null;
    for (const t of tries) {
      const file = `captions.${t.lang}.json3`;
      try {
        const note = await adoptOrFetch(dir, file, () => d.fetchCaptions({ url, dir, lang: t.lang, auto: t.auto }));
        got = { note, file, auto: t.auto };
        break;
      } catch (e) {
        errors.push(`${t.lang}: ${errText(e)}`);
      }
    }
    if (got) mark(state, 'captions', got.note, { file: got.file, auto: got.auto });
    else markFailed(state, 'captions', errors.join('; '));
    await saveState(dir, state);
  }

  // Whisper always runs when it can: it is the fallback and the check on the captions.
  if (!done(state, 'audio')) {
    try { mark(state, 'audio', await adoptOrFetch(dir, 'audio.wav', () => d.extractAudio({ dir }))); } catch (e) { markFailed(state, 'audio', errText(e)); }
    await saveState(dir, state);
  }
  if (!done(state, 'whisper')) {
    try {
      if (!done(state, 'audio')) throw new Error(`no audio (${state.steps.audio?.note})`);
      mark(state, 'whisper', await adoptOrFetch(dir, 'whisper.json', () => d.transcribe({ dir })));
    } catch (e) { markFailed(state, 'whisper', errText(e)); }
    await saveState(dir, state);
  }

  const sources = await wordSources(dir, info);
  if (sources.length === 0) {
    state.stopped = { step: 'gather', reason: noWordsReason(state) };
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
  for (const s of redo) delete state.steps[s];
  const info = await readJson(join(dir, 'source.info.json'));
  const video = join(dir, 'source.mp4');

  const sources = await wordSources(dir, info);
  if (sources.length === 0) {
    state.stopped = { step: 'align', reason: noWordsReason(state) };
    await saveState(dir, state);
    d.log(`stopped: ${state.stopped.reason}`);
    return 2;
  }
  const [chosen, other] = sources;
  const sentences = toSentences(chosen.words);

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
    return `${kept.length - unread} of ${kept.length} frames read${unread ? `; ${unread} unreadable` : ''}`;
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
    const changes = [];
    let prev = null;
    for (const row of boxRows) {
      if (!row.boxes) continue;
      if (prev) for (const c of diffBoxes(prev.boxes, row.boxes, { ignore })) changes.push({ ...c, t: row.t, f: row.f });
      prev = row;
    }
    const chapters = (info.chapters ?? []).map((c) => ({ title: c.title, start: c.start_time, end: c.end_time }));
    const timeline = buildTimeline({
      video: { ...state.video, wordsFrom: chosen.name },
      chapters, sentences, kept, changes,
    });
    await writeFile(join(dir, 'timeline.json'), JSON.stringify(timeline, null, 2) + '\n');
    await writeFile(join(dir, 'timeline.md'), renderTimelineMarkdown(timeline));
    if (other) {
      const cmp = compareTranscripts(chosen.words, other.words);
      await writeFile(join(dir, 'transcript-check.json'),
        JSON.stringify({ a: chosen.name, b: other.name, ...cmp }, null, 2) + '\n');
    }
    state.words = chosen.name;
    return `words from ${chosen.name}; ${sentences.length} sentences, ${kept.length} frames, ${changes.length} text changes`
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

// ---------- entry ----------

const USAGE = 'usage: learn.mjs gather <url> --out <dir> | align <dir> | status <dir>   [--redo <step>[,<step>]]';

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
  const redo = (take('--redo') ?? '').split(',').filter(Boolean);
  const bad = redo.filter((s) => !STEPS.includes(s));
  if (bad.length) { d.log(`unknown step ${bad.join(', ')}; steps are ${STEPS.join(', ')}`); return 1; }
  const [cmd, target] = args;
  try {
    if (cmd === 'gather' && target && out) return await gather(target, resolve(out), d, redo);
    if (cmd === 'align' && target) return await align(resolve(target), d, redo);
    if (cmd === 'status' && target) return await status(resolve(target), d);
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

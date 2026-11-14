import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run, extractFramesFfmpeg } from '../learn.mjs';

// ---------- fixtures ----------

const json3 = (words) => ({
  events: words.map(([ms, text]) => ({ tStartMs: ms, dDurationMs: 900, segs: [{ utf8: text, tOffsetMs: 0 }] })),
});
const autoCaptions = json3([[0, 'open'], [500, 'gajon'], [1000, 'blur'], [3000, 'set'], [3400, 'the'], [3800, 'amount']]);
const creatorCaptions = json3([[0, 'Open'], [500, 'Gaussian'], [1000, 'Blur.'], [3000, 'Set'], [3400, 'the'], [3800, 'amount.']]);
const whisper = {
  transcription: [
    { offsets: { from: 0, to: 0 }, text: '' },
    { offsets: { from: 0, to: 480 }, text: ' Open' },
    { offsets: { from: 500, to: 980 }, text: ' Gaussian' },
    { offsets: { from: 1000, to: 1400 }, text: ' Blur.' },
    { offsets: { from: 3000, to: 3380 }, text: ' Set' },
    { offsets: { from: 3400, to: 3780 }, text: ' the' },
    { offsets: { from: 3800, to: 4200 }, text: ' amount.' },
  ],
};
const info = (extra = {}) => ({
  id: 'vid1', webpage_url: 'https://example.invalid/watch?v=vid1', title: 'Ten tips', duration: 6, fps: 30,
  subtitles: {}, chapters: [{ title: 'Intro', start_time: 0, end_time: 2.5 }, { title: 'Tip 1', start_time: 2.5, end_time: 6 }],
  ...extra,
});

async function tempDir() {
  return mkdtemp(join(tmpdir(), 'channel-learner-test-'));
}

// Fakes that write the files the real tools would, and count their calls.
function fakes(dir, opts = {}) {
  const calls = {};
  const count = (name) => { calls[name] = (calls[name] ?? 0) + 1; };
  const logs = [];
  const deps = {
    fetchInfo: async ({ dir: d }) => { count('fetchInfo'); await writeFile(join(d, 'source.info.json'), JSON.stringify(opts.info ?? info())); },
    downloadVideo: async ({ dir: d }) => { count('downloadVideo'); await writeFile(join(d, 'source.mp4'), 'video'); },
    fetchCaptions: async ({ dir: d, lang, auto }) => {
      count(`fetchCaptions:${lang}:${auto ? 'auto' : 'creator'}`);
      if (opts.captionsFail) throw new Error('HTTP Error 429: Too Many Requests');
      await writeFile(join(d, `captions.${lang}.json3`), JSON.stringify(auto ? autoCaptions : creatorCaptions));
    },
    extractAudio: async ({ dir: d }) => { count('extractAudio'); await writeFile(join(d, 'audio.wav'), 'wav'); },
    transcribe: async ({ dir: d }) => {
      count('transcribe');
      if (opts.whisperFail) throw new Error('whisper-cli: model not found');
      await writeFile(join(d, 'whisper.json'), JSON.stringify(whisper));
    },
    measureChanges: async (video, out) => {
      count('measureChanges');
      // 6 s at 30 fps; cell 0 changes on frames 30-32; cell 1 changes on every frame (the advert panel).
      const lines = [];
      for (let f = 0; f < 180; f++) {
        const cells = new Array(4).fill(0);
        if (f >= 30 && f <= 32) cells[0] = 0.2;
        cells[1] = 0.3;
        lines.push(JSON.stringify({ f, t: f / 30, mean: 1, share: 0.1, cells }));
      }
      await writeFile(out, lines.join('\n') + '\n');
      return { frames: 180, fps: 30 };
    },
    extractFrames: async ({ frames, outDir }) => {
      count('extractFrames');
      await mkdir(outDir, { recursive: true });
      const keep = opts.dropFrame ? frames.slice(1) : frames;
      for (const f of keep) await writeFile(join(outDir, `f${String(f).padStart(6, '0')}.png`), 'png');
    },
    readBoxes: async (images) => {
      count('readBoxes');
      const label = { t: 'Amount', c: 0.95, x: 0.1, y: 0.3, w: 0.08, h: 0.02 };
      const value = (t) => ({ t, c: 0.95, x: 0.3, y: 0.3, w: 0.05, h: 0.02 });
      return new Map(images.map((p, k) => [p, [label, value(k === 0 ? '50.0' : '40.0')]]));
    },
    log: (...a) => logs.push(a.join(' ')),
  };
  return { deps, calls, logs };
}

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));

// ---------- gather ----------

test('gather runs every step once and skips completed steps on a second run', async () => {
  const dir = await tempDir();
  try {
    const { deps, calls } = fakes(dir);
    assert.equal(await run(['gather', 'https://example.invalid/watch?v=vid1', '--out', dir], deps), 0);
    assert.deepEqual(calls, {
      fetchInfo: 1, downloadVideo: 1, 'fetchCaptions:en-orig:auto': 1, extractAudio: 1, transcribe: 1,
    });
    const state = await readJson(join(dir, 'state.json'));
    for (const s of ['info', 'video', 'captions', 'audio', 'whisper']) assert.equal(state.steps[s].done, true, s);
    assert.equal(state.video.id, 'vid1');
    assert.equal(state.video.title, 'Ten tips');
    assert.equal(state.video.fps, 30);

    const again = fakes(dir);
    assert.equal(await run(['gather', 'https://example.invalid/watch?v=vid1', '--out', dir], again.deps), 0);
    assert.deepEqual(again.calls, {});
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('gather adopts files that are already there', async () => {
  const dir = await tempDir();
  try {
    await writeFile(join(dir, 'source.info.json'), JSON.stringify(info()));
    await writeFile(join(dir, 'source.mp4'), 'video');
    await writeFile(join(dir, 'captions.en-orig.json3'), JSON.stringify(autoCaptions));
    await writeFile(join(dir, 'audio.wav'), 'wav');
    await writeFile(join(dir, 'whisper.json'), JSON.stringify(whisper));
    const { deps, calls } = fakes(dir);
    assert.equal(await run(['gather', 'https://example.invalid/watch?v=vid1', '--out', dir], deps), 0);
    assert.deepEqual(calls, {});
    const state = await readJson(join(dir, 'state.json'));
    assert.equal(state.steps.video.done, true);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('gather prefers a creator-uploaded en track when the info lists one', async () => {
  const dir = await tempDir();
  try {
    const { deps, calls } = fakes(dir, { info: info({ subtitles: { en: [{ ext: 'json3' }], live_chat: [] } }) });
    assert.equal(await run(['gather', 'https://example.invalid/watch?v=vid1', '--out', dir], deps), 0);
    assert.equal(calls['fetchCaptions:en:creator'], 1);
    assert.equal(calls['fetchCaptions:en-orig:auto'], undefined);
    assert.ok(existsSync(join(dir, 'captions.en.json3')));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('a caption failure keeps the video, falls back to whisper, and is retried next run', async () => {
  const dir = await tempDir();
  try {
    const { deps } = fakes(dir, { captionsFail: true });
    assert.equal(await run(['gather', 'https://example.invalid/watch?v=vid1', '--out', dir], deps), 0);
    const state = await readJson(join(dir, 'state.json'));
    assert.equal(state.steps.video.done, true);
    assert.notEqual(state.steps.captions?.done, true);
    assert.match(state.steps.captions.note, /429/);
    assert.equal(state.steps.whisper.done, true);
    assert.equal(state.stopped, undefined);

    const again = fakes(dir);
    assert.equal(await run(['gather', 'https://example.invalid/watch?v=vid1', '--out', dir], again.deps), 0);
    assert.deepEqual(again.calls, { 'fetchCaptions:en-orig:auto': 1 });
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('with neither captions nor whisper, gather stops with a reason and exits 2', async () => {
  const dir = await tempDir();
  try {
    const { deps } = fakes(dir, { captionsFail: true, whisperFail: true });
    assert.equal(await run(['gather', 'https://example.invalid/watch?v=vid1', '--out', dir], deps), 2);
    const state = await readJson(join(dir, 'state.json'));
    assert.ok(state.stopped, 'stopped is recorded');
    assert.match(state.stopped.reason, /429/);
    assert.match(state.stopped.reason, /model not found/);
    assert.equal(state.steps.video.done, true, 'the video is kept');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

// ---------- align ----------

async function gathered(opts = {}) {
  const dir = await tempDir();
  const { deps } = fakes(dir, opts);
  assert.equal(await run(['gather', 'https://example.invalid/watch?v=vid1', '--out', dir], deps), opts.expectGather ?? 0);
  return dir;
}

test('align writes kept frames, boxes, the timeline and the transcript check; a second run does nothing', async () => {
  const dir = await gathered();
  try {
    await writeFile(join(dir, 'ignore.json'), JSON.stringify([{ x: 0.9, y: 0.9, w: 0.1, h: 0.1 }]));
    const { deps, calls } = fakes(dir);
    assert.equal(await run(['align', dir], deps), 0);
    assert.deepEqual(calls, { measureChanges: 1, extractFrames: 1, readBoxes: 1 });

    const kept = await readJson(join(dir, 'kept.json'));
    assert.deepEqual(kept.noisyCells, [1], 'the always-changing cell is found');
    assert.ok(kept.kept.length >= 2);
    for (const k of kept.kept) assert.ok(existsSync(join(dir, k.file)), k.file);
    assert.match(kept.kept[0].file, /^frames\/f\d{6}\.png$/);

    const boxLines = (await readFile(join(dir, 'boxes.jsonl'), 'utf8')).trim().split('\n');
    assert.equal(boxLines.length, kept.kept.length);

    const md = await readFile(join(dir, 'timeline.md'), 'utf8');
    assert.match(md, /Amount: 50\.0 → 40\.0/);
    const tl = await readJson(join(dir, 'timeline.json'));
    assert.deepEqual(tl.chapters.map((c) => c.title), ['Intro', 'Tip 1']);
    // no creator track: whisper is chosen over YouTube's automatic captions
    assert.equal(tl.video.wordsFrom, 'whisper');
    assert.match(tl.chapters[0].sentences[0].text, /Gaussian/);

    const check = await readJson(join(dir, 'transcript-check.json'));
    assert.equal(check.a, 'whisper');
    assert.equal(check.b, 'captions-auto');
    assert.ok(check.agreement > 0 && check.agreement < 1);
    assert.ok(check.disagreements.length >= 1);

    const state = await readJson(join(dir, 'state.json'));
    for (const s of ['changes', 'frames', 'text', 'timeline']) assert.equal(state.steps[s].done, true, s);
    assert.equal(state.words, 'whisper');
    assert.match(state.steps.timeline.note, /whisper/);

    const again = fakes(dir);
    assert.equal(await run(['align', dir], again.deps), 0);
    assert.deepEqual(again.calls, {});
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('align takes creator captions first, then whisper, then automatic captions', async () => {
  const creator = await gathered({ info: info({ subtitles: { en: [{ ext: 'json3' }] } }) });
  const autoOnly = await gathered({ whisperFail: true });
  try {
    assert.equal(await run(['align', creator], fakes(creator).deps), 0);
    assert.equal((await readJson(join(creator, 'timeline.json'))).video.wordsFrom, 'captions-creator');
    assert.equal((await readJson(join(creator, 'transcript-check.json'))).b, 'whisper');

    assert.equal(await run(['align', autoOnly], fakes(autoOnly).deps), 0);
    assert.equal((await readJson(join(autoOnly, 'timeline.json'))).video.wordsFrom, 'captions-auto');
    assert.equal(existsSync(join(autoOnly, 'transcript-check.json')), false, 'nothing to compare with');
  } finally {
    await rm(creator, { recursive: true, force: true });
    await rm(autoOnly, { recursive: true, force: true });
  }
});

test('align stops with exit 2 when there are no words', async () => {
  const dir = await gathered({ captionsFail: true, whisperFail: true, expectGather: 2 });
  try {
    const { deps, calls } = fakes(dir);
    assert.equal(await run(['align', dir], deps), 2);
    assert.deepEqual(calls, {});
    assert.ok((await readJson(join(dir, 'state.json'))).stopped.reason);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('align fails the frames step when an extracted frame is missing', async () => {
  const dir = await gathered();
  try {
    const { deps } = fakes(dir, { dropFrame: true });
    assert.equal(await run(['align', dir], deps), 1);
    const state = await readJson(join(dir, 'state.json'));
    assert.notEqual(state.steps.frames?.done, true);
    assert.equal(state.stopped.step, 'frames');
    assert.match(state.stopped.reason, /missing/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

// ---------- status ----------

test('status prints each step and whether it is done', async () => {
  const dir = await gathered({ captionsFail: true });
  try {
    const { deps, logs } = fakes(dir);
    assert.equal(await run(['status', dir], deps), 0);
    const out = logs.join('\n');
    assert.match(out, /video\s+done/);
    assert.match(out, /captions\s+not done.*429/);
    assert.match(out, /timeline\s+not done/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

// ---------- the real frame extractor, on a tiny ffmpeg clip ----------

test('extractFramesFfmpeg writes exactly the requested frames, named by frame number', async () => {
  const dir = await tempDir();
  try {
    const clip = join(dir, 'clip.mp4');
    // black for 15 frames at 30 fps, then a white box from frame 15
    const made = spawnSync('ffmpeg', ['-v', 'error', '-nostdin', '-f', 'lavfi', '-i', 'color=black:size=64x36:rate=30:duration=1',
      '-vf', "drawbox=x=8:y=8:w=20:h=20:color=white:t=fill:enable='gte(n,15)'", '-pix_fmt', 'yuv420p', clip]);
    assert.equal(made.status, 0, String(made.stderr));
    const outDir = join(dir, 'frames');
    await extractFramesFfmpeg({ video: clip, frames: [14, 0, 15], outDir, batch: 2 });
    assert.deepEqual((await readdir(outDir)).sort(), ['f000000.png', 'f000014.png', 'f000015.png']);
    const [a, b, c] = await Promise.all(['f000000', 'f000014', 'f000015'].map((n) => readFile(join(outDir, `${n}.png`))));
    assert.ok(a.equals(b), 'frames 0 and 14 are both plain black');
    assert.ok(!b.equals(c), 'frame 15 has the box');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

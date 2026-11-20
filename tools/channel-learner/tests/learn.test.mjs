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
  const bot = (name) => {
    if (opts.botAt === name) throw new Error('ERROR: [video] vid1: Sign in to confirm you\u2019re not a bot. Try again later\nsecond line');
  };
  const deps = {
    fetchInfo: async ({ dir: d }) => { count('fetchInfo'); bot('info'); await writeFile(join(d, 'source.info.json'), JSON.stringify(opts.info ?? info())); },
    downloadVideo: async ({ dir: d }) => {
      count('downloadVideo');
      bot('video');
      if (opts.downloadFail) throw new Error('HTTP Error 503');
      await writeFile(join(d, 'source.mp4'), opts.video ?? 'video');
    },
    fetchCaptions: async ({ dir: d, lang, auto }) => {
      count(`fetchCaptions:${lang}:${auto ? 'auto' : 'creator'}`);
      bot('captions');
      if (opts.captionsFail) throw new Error('HTTP Error 429: Too Many Requests');
      await writeFile(join(d, `captions.${lang}.json3`), JSON.stringify(auto ? autoCaptions : creatorCaptions));
    },
    extractAudio: async ({ dir: d, out }) => {
      count('extractAudio');
      await writeFile(join(d, out ?? 'audio.wav'), opts.audioInterrupt ? 'wa' : 'wav');
      if (opts.audioInterrupt) throw new Error('ffmpeg killed');
    },
    transcribe: async ({ dir: d, out }) => {
      count('transcribe');
      if (opts.whisperFail) throw new Error('whisper-cli: model not found');
      await writeFile(join(d, out ?? 'whisper.json'), JSON.stringify(whisper));
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
    smallFrames: async ({ images, outDir }) => {
      count('smallFrames');
      await mkdir(outDir, { recursive: true });
      for (const p of images) await writeFile(join(outDir, p.split('/').pop().replace(/\.png$/, '.jpg')), 'jpg');
    },
    readBoxes: async (images) => {
      count('readBoxes');
      const label = { t: 'Amount', c: 0.95, x: 0.1, y: 0.3, w: 0.08, h: 0.02 };
      const value = (t) => ({ t, c: 0.95, x: 0.3, y: 0.3, w: 0.05, h: 0.02 });
      const read = opts.unreadable ? images.slice(0, Math.floor(images.length / 3)) : images;
      return new Map(read.map((p, k) => [p, [label, value(k === 0 ? '50.0' : '40.0')]]));
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
    assert.deepEqual(calls, { measureChanges: 1, extractFrames: 1, smallFrames: 1, readBoxes: 1 });

    const kept = await readJson(join(dir, 'kept.json'));
    assert.deepEqual(kept.noisyCells, [1], 'the always-changing cell is found');
    assert.ok(kept.kept.length >= 2);
    for (const k of kept.kept) assert.ok(existsSync(join(dir, k.file)), k.file);
    // the 1920-wide JPEGs every writer and checker prompt reads (LESSONS 16)
    for (const k of kept.kept) assert.ok(existsSync(join(dir, k.file.replace(/^frames\//, 'frames-small/').replace(/\.png$/, '.jpg'))), k.file);
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

test('align tracks values by label, writes rows.jsonl, and starts each chapter fresh (review h)', async () => {
  const dir = await gathered();
  try {
    assert.equal(await run(['align', dir], fakes(dir).deps), 0);
    const kept = (await readJson(join(dir, 'kept.json'))).kept;
    const rows = (await readFile(join(dir, 'rows.jsonl'), 'utf8')).trim().split('\n').map((l) => JSON.parse(l));
    assert.equal(rows.length, kept.length);
    assert.deepEqual(rows[0], { f: kept[0].f, t: kept[0].t, rows: [{ label: 'Amount', value: '50.0', x: 0.3, y: 0.3 }] });

    // the fake shows Amount 50.0 on the first kept frame and 40.0 on every later one
    const tl = await readJson(join(dir, 'timeline.json'));
    const intro = tl.chapters[0].sentences.flatMap((s) => s.changes);
    const tip = tl.chapters[1].sentences.flatMap((s) => s.changes);
    assert.deepEqual(intro.map((c) => [c.kind, c.label, c.was, c.text]),
      [['appeared', 'Amount', undefined, '50.0'], ['changed', 'Amount', '50.0', '40.0']]);
    // a new chapter forgets what it saw: 40.0 is new again, not "no change"
    assert.deepEqual(tip.map((c) => [c.kind, c.label, c.text]), [['appeared', 'Amount', '40.0']]);
    assert.match((await readJson(join(dir, 'state.json'))).steps.timeline.note, /1 changed, 2 appeared/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('align --redo timeline rebuilds from boxes.jsonl without reading text again', async () => {
  const dir = await gathered();
  try {
    assert.equal(await run(['align', dir], fakes(dir).deps), 0);
    const again = fakes(dir);
    assert.equal(await run(['align', dir, '--redo', 'timeline'], again.deps), 0);
    assert.deepEqual(again.calls, {});
    assert.ok(existsSync(join(dir, 'rows.jsonl')));
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

test('--redo of a step also clears every later step', async () => {
  const dir = await gathered();
  try {
    assert.equal(await run(['align', dir], fakes(dir).deps), 0);
    const before = await readJson(join(dir, 'state.json'));
    const again = fakes(dir);
    assert.equal(await run(['align', dir, '--redo', 'changes'], again.deps), 0);
    // frames are already on disk, so only changes and text call out; text and timeline run again
    assert.deepEqual(again.calls, { measureChanges: 1, readBoxes: 1 });
    const after = await readJson(join(dir, 'state.json'));
    for (const s of ['changes', 'frames', 'text', 'timeline']) assert.notEqual(after.steps[s].at, before.steps[s].at, s);
    assert.equal(after.steps.whisper.at, before.steps.whisper.at, 'earlier steps are kept');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('gather --redo fetches a gathered file again instead of adopting it', async () => {
  const dir = await gathered();
  try {
    for (const [step, call] of [['whisper', 'transcribe'], ['audio', 'extractAudio'],
      ['captions', 'fetchCaptions:en-orig:auto'], ['video', 'downloadVideo'], ['info', 'fetchInfo']]) {
      const again = fakes(dir, { video: `video for ${step}` });
      assert.equal(await run(['gather', 'https://example.invalid/watch?v=vid1', '--out', dir, '--redo', step], again.deps), 0, step);
      assert.equal(again.calls[call], 1, `${step} fetched again`);
    }
    // later steps are cleared but only the named step fetches again; the rest re-adopt their files
    assert.equal(await readFile(join(dir, 'source.mp4'), 'utf8'), 'video for video');
    // a failed re-fetch puts the old file back
    const failing = fakes(dir, { downloadFail: true });
    assert.equal(await run(['gather', 'https://example.invalid/watch?v=vid1', '--out', dir, '--redo', 'video'], failing.deps), 1);
    assert.equal(await readFile(join(dir, 'source.mp4'), 'utf8'), 'video for video');
    assert.equal(existsSync(join(dir, 'source.mp4.redo-old')), false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('an interrupted audio extraction is not adopted by the next run; leftover partial files are never adopted', async () => {
  const dir = await tempDir();
  try {
    const first = fakes(dir, { audioInterrupt: true });
    assert.equal(await run(['gather', 'https://example.invalid/watch?v=vid1', '--out', dir], first.deps), 0);
    assert.notEqual((await readJson(join(dir, 'state.json'))).steps.audio.done, true);
    assert.equal(existsSync(join(dir, 'audio.wav')), false, 'no audio.wav from a failed extraction');

    const again = fakes(dir);
    assert.equal(await run(['gather', 'https://example.invalid/watch?v=vid1', '--out', dir], again.deps), 0);
    assert.equal(again.calls.extractAudio, 1, 'extracted again, not adopted');
    assert.equal(await readFile(join(dir, 'audio.wav'), 'utf8'), 'wav');
    assert.equal(again.calls.transcribe, 1);
    assert.ok(existsSync(join(dir, 'whisper.json')));
    const leftovers = (await readdir(dir)).filter((n) => /part/.test(n));
    assert.deepEqual(leftovers, []);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('a YouTube bot check stops gather at once with exit 3 and a plain reason', async () => {
  for (const [at, expectCalls] of [
    ['info', { fetchInfo: 1 }],
    ['video', { fetchInfo: 1, downloadVideo: 1 }],
    ['captions', { fetchInfo: 1, downloadVideo: 1, 'fetchCaptions:en:creator': 1 }],
  ]) {
    const dir = await tempDir();
    try {
      const { deps, calls, logs } = fakes(dir, { botAt: at, info: info({ subtitles: { en: [{ ext: 'json3' }] } }) });
      assert.equal(await run(['gather', 'https://example.invalid/watch?v=vid1', '--out', dir], deps), 3, at);
      assert.deepEqual(calls, expectCalls, `${at}: nothing else is fetched`);
      const state = await readJson(join(dir, 'state.json'));
      assert.deepEqual(state.stopped, {
        step: at, reason: 'youtube bot check: ERROR: [video] vid1: Sign in to confirm you’re not a bot. Try again later',
      });
      assert.equal(logs.filter((l) => /bot check/.test(l)).length, 1, `${at}: one line logged`);
    } finally { await rm(dir, { recursive: true, force: true }); }
  }
});

test('every yt-dlp call ignores user config, and there is no cookie or sign-in option', async () => {
  const src = await readFile(new URL('../learn.mjs', import.meta.url), 'utf8');
  const calls = [...src.matchAll(/exec\('yt-dlp', \[([^\]]*)/g)].map((m) => m[1]);
  assert.ok(calls.length >= 1);
  for (const args of calls) assert.match(args, /'--ignore-config'/);
  assert.doesNotMatch(src, /cookie|--username|--password|netrc/i);
});

test('align fails the text step when fewer than half of the kept frames could be read', async () => {
  const dir = await gathered();
  try {
    assert.equal(await run(['align', dir], fakes(dir, { unreadable: true }).deps), 1);
    const state = await readJson(join(dir, 'state.json'));
    assert.notEqual(state.steps.text?.done, true);
    assert.equal(state.stopped.step, 'text');
    assert.match(state.stopped.reason, /of \d+ frames read/);
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

// ---------- link: study folders live outside every worktree ----------

test('link points quality/renders/channel-study at the shared studies folder, and keeps a correct link', async () => {
  const { symlink, readlink, lstat } = await import('node:fs/promises');
  const base = await mkdtemp(join(tmpdir(), 'learn-link-'));
  const root = join(base, 'worktree');
  const studies = join(base, 'studies');
  await mkdir(root, { recursive: true });
  await mkdir(studies, { recursive: true });
  const logs = [];
  assert.equal(await run(['link', root, '--to', studies], { log: (m) => logs.push(m) }), 0);
  const at = join(root, 'quality', 'renders', 'channel-study');
  assert.ok((await lstat(at)).isSymbolicLink());
  assert.equal(await readlink(at), studies);
  assert.equal(await run(['link', root, '--to', studies], { log: (m) => logs.push(m) }), 0);
  await rm(base, { recursive: true, force: true });
});

test('link refuses a real folder or a link elsewhere and changes nothing', async () => {
  const { symlink, readlink } = await import('node:fs/promises');
  const base = await mkdtemp(join(tmpdir(), 'learn-link-'));
  const studies = join(base, 'studies');
  await mkdir(studies, { recursive: true });
  const real = join(base, 'a');
  await mkdir(join(real, 'quality', 'renders', 'channel-study', 'vid1'), { recursive: true });
  const logs = [];
  assert.equal(await run(['link', real, '--to', studies], { log: (m) => logs.push(m) }), 1);
  assert.ok(existsSync(join(real, 'quality', 'renders', 'channel-study', 'vid1')));
  assert.match(logs.join('\n'), /real folder/);
  const other = join(base, 'b');
  await mkdir(join(other, 'quality', 'renders'), { recursive: true });
  await symlink(join(base, 'elsewhere'), join(other, 'quality', 'renders', 'channel-study'));
  assert.equal(await run(['link', other, '--to', studies], { log: (m) => logs.push(m) }), 1);
  assert.equal(await readlink(join(other, 'quality', 'renders', 'channel-study')), join(base, 'elsewhere'));
  await rm(base, { recursive: true, force: true });
});

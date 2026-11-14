// Tests for the blind-comparison script, on clips drawn here from ffmpeg's own test sources.
// Run: node --test 'release/tests/*.test.mjs'
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { prepare, verdict, tools, checkOutputs, STATES } from '../../quality/blind/blind.mjs';

const exec = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPT = path.join(ROOT, 'quality', 'blind', 'blind.mjs');
const TOOLS = await tools();
const SKIP = !TOOLS.ffmpeg || !TOOLS.ffprobe ? 'ffmpeg or ffprobe is not on PATH; the blind-comparison tests need both' : false;
// Only AudioToolbox AAC holds a constant bit rate; with ffmpeg's built-in AAC different sound gives different bit rates.
const CBR_SKIP = SKIP || (!TOOLS.aacAt && 'AudioToolbox AAC (aac_at) is not in this ffmpeg; identical bit rates for different sound need it');
const made = [];
const tmp = async (prefix) => { const d = await fs.mkdtemp(path.join(os.tmpdir(), prefix)); made.push(d); return d; };
after(async () => { for (const d of made) await fs.rm(d, { recursive: true, force: true }); });

const ff = (...args) => exec('ffmpeg', ['-nostdin', '-v', 'error', '-y', ...args]);
const picture = (size, rate, seconds) => ['-f', 'lavfi', '-i', `testsrc2=s=${size}:r=${rate}:d=${seconds}`];
const H264 = ['-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p'];
const INPUT_TAGS = {
  one: { title: 'Build one title', comment: 'first comment', encoder: 'Encoder One', creation_time: '2024-01-02T03:04:05Z', handler: 'Build one handler' },
  two: { title: 'Build two title', comment: 'second comment', encoder: 'Encoder Two', creation_time: '2025-05-06T07:08:09Z', handler: 'Build two handler' },
};
const tagArgs = (t) => ['-metadata', `title=${t.title}`, '-metadata', `comment=${t.comment}`, '-metadata', `encoder=${t.encoder}`,
  '-metadata', `creation_time=${t.creation_time}`, '-metadata:s:v:0', `handler_name=${t.handler}`];

let clipsMade;
function clips() { return (clipsMade ??= makeClips()); }
async function makeClips() {
  const dir = await tmp('blind-clips-');
  const c = (name) => path.join(dir, name);
  await Promise.all([
    ff(...picture('160x284', 30, 2), ...H264, ...tagArgs(INPUT_TAGS.one), c('build-one.mov')),
    ff(...picture('120x212', 24, 1.5), ...H264, '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', ...tagArgs(INPUT_TAGS.two), c('build-two.mp4')),
    ff(...picture('120x212', 24, 1), '-f', 'lavfi', '-i', 'sine=f=440:r=44100:d=1', ...H264, '-c:a', 'pcm_s16le', c('mono-44k.mov')),
    ff(...picture('120x212', 24, 1), '-f', 'lavfi', '-i', 'sine=f=660:r=48000:d=1', ...H264, '-ac', '2', '-c:a', 'aac', c('stereo-48k.mp4')),
    ff(...picture('160x240', 24, 0.5), ...H264, c('wide.mp4')),
    ff(...picture('160x284', 24, 1), ...H264, c('picture.mp4')),
  ]);
  // One picture twice: with its sound, and with the picture starting 0.5 s into the sound (a start offset).
  await Promise.all([
    ff('-i', c('picture.mp4'), '-f', 'lavfi', '-i', 'sine=f=440:r=48000:d=1', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', c('plain.mp4')),
    ff('-itsoffset', '0.5', '-i', c('picture.mp4'), '-f', 'lavfi', '-i', 'sine=f=440:r=48000:d=1.5', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', c('offset.mp4')),
  ]);
  return { dir, one: c('build-one.mov'), two: c('build-two.mp4'), mono: c('mono-44k.mov'), stereo: c('stereo-48k.mp4'), wide: c('wide.mp4'),
    plain: c('plain.mp4'), offset: c('offset.mp4') };
}

async function cli(...args) {
  try { const { stdout, stderr } = await exec(process.execPath, [SCRIPT, ...args]); return { code: 0, stdout, stderr }; }
  catch (e) { return { code: e.code, stdout: e.stdout, stderr: e.stderr }; }
}
async function ffprobe(file) {
  const { stdout } = await exec('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-count_frames', '-of', 'json', file]);
  const info = JSON.parse(stdout);
  delete info.format.filename;
  return info;
}
async function firstFrame(file) {
  const { stdout } = await exec('ffmpeg', ['-v', 'error', '-i', file, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { encoding: 'buffer', maxBuffer: 1 << 26 });
  return stdout;
}
const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const judged = (dir) => ['A', 'B'].map((l) => path.join(dir, 'judge', `${l}.mp4`));
// Everything ffprobe says about a movie but the fields that follow the picture itself.
function description(info) {
  const streams = info.streams.map((s) => { const { bit_rate, ...rest } = s; return s.codec_type === 'video' ? rest : s; });
  const { size, bit_rate, ...format } = info.format;
  return { streams, format };
}

// Two inputs that differ in container, tags, name, size, rate and length, prepared once through the command line.
let differing;
function prepareDiffering() {
  return (differing ??= (async () => {
    const c = await clips();
    const out = path.join(await tmp('blind-'), 'comparison');
    const run = await cli('prepare', c.one, c.two, '--out', out);
    assert.equal(run.code, 0, run.stderr);
    return { out, run };
  })());
}

test('two different inputs give A.mp4 and B.mp4 that agree on everything but the picture', { skip: SKIP }, async () => {
  const { out } = await prepareDiffering();
  assert.deepEqual((await fs.readdir(path.join(out, 'judge'))).sort(), ['A.mp4', 'B.mp4']);
  const [a, b] = await Promise.all(judged(out).map(ffprobe));
  assert.deepEqual(description(a), description(b));
  assert.equal(a.format.tags.major_brand, 'isom');
  assert.deepEqual(a.streams.map((s) => s.codec_type), ['video']);
  const v = a.streams[0];
  // the smaller size (same shape), the lower rate, and the shorter length at that rate: 1.5 s at 24 fps
  assert.deepEqual([v.codec_name, v.profile, v.pix_fmt, v.width, v.height, v.r_frame_rate], ['h264', 'High', 'yuv420p', 120, 212, '24/1']);
  assert.equal(Number(v.nb_read_frames), 36);
  assert.equal(Number(b.streams[0].nb_read_frames), 36);
  // no tag from either input
  const tags = [a.format.tags, ...a.streams.map((s) => s.tags), b.format.tags, ...b.streams.map((s) => s.tags)].flatMap((t) => Object.entries(t ?? {}));
  for (const [k] of tags) assert.ok(!['title', 'comment', 'creation_time'].includes(k), `output tag ${k}`);
  const inputText = [...Object.values(INPUT_TAGS.one), ...Object.values(INPUT_TAGS.two), 'build-one', 'build-two', '2024-01-02', '2025-05-06'];
  for (const [k, val] of tags) for (const s of inputText) assert.ok(!String(val).toLowerCase().includes(s.toLowerCase()), `output tag ${k} carries "${s}"`);
  // one instant, whole seconds
  const [sa, sb] = await Promise.all(judged(out).map((f) => fs.stat(f)));
  assert.equal(sa.mtimeMs, sb.mtimeMs);
  assert.equal(sa.atimeMs, sb.atimeMs);
  assert.equal(sa.mtimeMs % 1000, 0);
  const record = await readJson(path.join(out, 'record.json'));
  assert.equal(record.selfCheck.result, 'passed');
  assert.equal(record.length.framesKept, 36);
  assert.deepEqual(record.length.inputs.map((i) => i.framesAtTargetRate), [48, 36]);
  assert.equal(new Date(record.outputs.time).getTime(), sa.mtimeMs);
});

test('the same input given twice gives byte-identical movies', { skip: SKIP }, async () => {
  const c = await clips();
  const out = path.join(await tmp('blind-'), 'same');
  await prepare({ movies: [c.stereo, c.stereo], out });
  const [a, b] = await Promise.all(judged(out).map((f) => fs.readFile(f)));
  assert.ok(a.length > 0);
  assert.ok(a.equals(b), 'A.mp4 and B.mp4 differ');
});

test('an input with a start offset still begins with its own first picture', { skip: SKIP }, async () => {
  const c = await clips();
  const offset = await ffprobe(c.offset);
  assert.equal(Number(offset.streams.find((s) => s.codec_type === 'video').start_time), 0.5); // the clip really has the offset
  const out = path.join(await tmp('blind-'), 'offset');
  await prepare({ movies: [c.offset, c.plain], out, toss: () => 0 }); // A is the offset input, B the same picture without it
  const [fromOffset, fromPlain] = judged(out);
  const [a, b] = await Promise.all([fromOffset, fromPlain].map(firstFrame));
  assert.equal(a.length, 160 * 284 * 3);
  assert.ok(a.equals(b), 'the first frame of the offset input is not its first picture');
  for (const info of await Promise.all([fromOffset, fromPlain].map(ffprobe))) {
    const v = info.streams.find((s) => s.codec_type === 'video');
    assert.equal(Number(v.start_time), 0);
    assert.equal(Number(v.nb_read_frames), 24);
  }
});

test('one input with sound and one without is refused unless --sound says what to do', { skip: SKIP }, async () => {
  const c = await clips();
  const out = path.join(await tmp('blind-'), 'refused');
  const run = await cli('prepare', c.stereo, c.two, '--out', out);
  assert.notEqual(run.code, 0);
  assert.match(run.stderr, /first input has sound and second input has none/);
  assert.match(run.stderr, /--sound drop/);
  assert.match(run.stderr, /--sound silence/);
  await assert.rejects(fs.access(out), 'nothing is written when refused');
  const named = await cli('prepare', c.two, c.stereo, '--out', out, '--name-1', 'old build', '--name-2', 'new build');
  assert.match(named.stderr, /new build has sound and old build has none/);
});

test('--sound drop gives two movies without a sound track', { skip: SKIP }, async () => {
  const c = await clips();
  const out = path.join(await tmp('blind-'), 'drop');
  await prepare({ movies: [c.stereo, c.two], out, sound: 'drop' });
  for (const info of await Promise.all(judged(out).map(ffprobe))) assert.deepEqual(info.streams.map((s) => s.codec_type), ['video']);
  assert.equal((await readJson(path.join(out, 'record.json'))).sound.treatment, 'dropped');
});

test('--sound silence gives both movies the same sound track description', { skip: CBR_SKIP }, async () => {
  const c = await clips();
  const out = path.join(await tmp('blind-'), 'silence');
  await prepare({ movies: [c.stereo, c.two], out, sound: 'silence' });
  const [a, b] = (await Promise.all(judged(out).map(ffprobe))).map((info) => info.streams.filter((s) => s.codec_type === 'audio'));
  assert.equal(a.length, 1);
  assert.deepEqual(a, b);
  assert.deepEqual([a[0].codec_name, a[0].profile, a[0].sample_rate, a[0].channels], ['aac', 'LC', '48000', 2]);
});

test('sound at different rates and channel counts comes out with identical sound fields, bit rate included', { skip: CBR_SKIP }, async () => {
  const c = await clips();
  const [mono, stereo] = await Promise.all([c.mono, c.stereo].map(ffprobe));
  assert.deepEqual([mono.streams[1].sample_rate, mono.streams[1].channels], ['44100', 1]);
  assert.deepEqual([stereo.streams[1].sample_rate, stereo.streams[1].channels], ['48000', 2]);
  const out = path.join(await tmp('blind-'), 'rates');
  await prepare({ movies: [c.mono, c.stereo], out });
  const [a, b] = (await Promise.all(judged(out).map(ffprobe))).map((info) => info.streams.find((s) => s.codec_type === 'audio'));
  assert.deepEqual(a, b);
  assert.ok(Number(a.bit_rate) > 0);
  assert.deepEqual([a.sample_rate, a.channels, a.channel_layout], ['48000', 2, 'stereo']);
});

test('shapes more than 1 % apart are refused, and so is a folder that is not empty', { skip: SKIP }, async () => {
  const c = await clips();
  const out = path.join(await tmp('blind-'), 'shape');
  await assert.rejects(prepare({ movies: [c.two, c.wide], out }), /shapes differ by .* more than 1 % is refused/);
  await assert.rejects(fs.access(out));
  const full = await tmp('blind-full-');
  await fs.writeFile(path.join(full, 'keep.txt'), 'x');
  await assert.rejects(prepare({ movies: [c.one, c.two], out: full }), /not empty/);
});

test('the key is outside judge/, private, and in neither the record nor what prepare prints', { skip: SKIP }, async () => {
  const { out, run } = await prepareDiffering();
  const key = await readJson(path.join(out, 'key.json'));
  assert.deepEqual([key.A.name, key.B.name].sort(), ['first input', 'second input']);
  assert.ok(!(await fs.readdir(path.join(out, 'judge'))).includes('key.json'));
  assert.equal((await fs.stat(path.join(out, 'key.json'))).mode & 0o777, 0o600);
  const record = await readJson(path.join(out, 'record.json'));
  assert.equal(record.state, STATES.open);
  assert.equal(record.key, null);
  assert.equal(record.verdict, null);
  assert.deepEqual(Object.keys(record.outputs['A.mp4']), ['sha256']);
  const json = await fs.readFile(path.join(out, 'record.json'), 'utf8');
  const md = await fs.readFile(path.join(out, 'record.md'), 'utf8');
  for (const text of [json, md]) {
    assert.ok(!text.includes(key.tossedAt), 'the toss time');
    assert.ok(!text.includes('key.json'));
  }
  for (const line of md.split('\n').filter((l) => /\b[AB]\.mp4\b/.test(l))) assert.doesNotMatch(line, /first input|second input/, line);
  assert.equal(run.stdout, `The movies for the judge are in ${path.join(out, 'judge')}:\n  A.mp4\n  B.mp4\n`);
  assert.equal(run.stderr, '');
});

test('the toss decides which input is A', { skip: SKIP }, async () => {
  const c = await clips();
  const outs = [];
  for (const side of [0, 1]) {
    const out = path.join(await tmp('blind-'), `toss-${side}`);
    await prepare({ movies: [c.one, c.two], out, toss: () => side });
    outs.push(out);
  }
  const keys = await Promise.all(outs.map((o) => readJson(path.join(o, 'key.json'))));
  assert.deepEqual(keys.map((k) => k.A.name), ['first input', 'second input']);
  assert.deepEqual(keys.map((k) => k.B.name), ['second input', 'first input']);
  // the movies swap with the toss: A one way is byte for byte B the other way
  const [a0, b1] = await Promise.all([judged(outs[0])[0], judged(outs[1])[1]].map((f) => fs.readFile(f)));
  assert.ok(a0.equals(b1));
});

test('verdict refuses without a pick and refuses a second verdict; an empty note is recorded as empty', { skip: SKIP }, async () => {
  const c = await clips();
  const out = path.join(await tmp('blind-'), 'twice');
  await prepare({ movies: [c.one, c.two], out });
  const none = await cli('verdict', out);
  assert.notEqual(none.code, 0);
  assert.match(none.stderr, /needs --pick A, B or none/);
  assert.equal((await readJson(path.join(out, 'record.json'))).state, STATES.open);
  assert.notEqual((await cli('verdict', out, '--pick', 'C')).code, 0);
  const first = await cli('verdict', out, '--pick', 'none');
  assert.equal(first.code, 0, first.stderr);
  const record = await readJson(path.join(out, 'record.json'));
  assert.deepEqual([record.verdict.pick, record.verdict.notes, record.key.pick, record.state], ['none', '', 'none', STATES.judged]);
  const second = await cli('verdict', out, '--pick', 'A');
  assert.notEqual(second.code, 0);
  assert.match(second.stderr, /already has a verdict/);
  assert.equal((await readJson(path.join(out, 'record.json'))).verdict.pick, 'none');
});

test('the verdict is written before the key is read: with the key unreadable it is still recorded', { skip: SKIP || (process.getuid?.() === 0 && 'root reads any file') }, async () => {
  const c = await clips();
  const out = path.join(await tmp('blind-'), 'locked');
  await prepare({ movies: [c.one, c.two], out });
  const keyFile = path.join(out, 'key.json');
  await fs.chmod(keyFile, 0o000);
  try {
    const run = await cli('verdict', out, '--pick', 'A', '--notes', 'A moves more cleanly');
    assert.notEqual(run.code, 0);
    assert.match(run.stderr, /key could not be opened/);
    assert.match(run.stdout, /^Verdict: A$/m);
    const record = await readJson(path.join(out, 'record.json'));
    assert.deepEqual([record.verdict.pick, record.verdict.notes, record.state, record.key], ['A', 'A moves more cleanly', STATES.recorded, null]);
    assert.equal(record.keyError.reason, 'EACCES');
    const md = await fs.readFile(path.join(out, 'record.md'), 'utf8');
    assert.match(md, /- Pick: A/);
    assert.match(md, /The key could not be opened/);
    assert.doesNotMatch(md, /A\.mp4: /);
  } finally { await fs.chmod(keyFile, 0o600); }
});

test('after a verdict the record holds the pick, the notes, both times and which was which', { skip: SKIP }, async () => {
  const c = await clips();
  const out = path.join(await tmp('blind-'), 'judged');
  await prepare({ movies: [c.one, c.two], out, names: ['old build', 'new build'] });
  const done = await verdict({ dir: out, pick: 'B', notes: 'B keeps its shadows' });
  const key = await readJson(path.join(out, 'key.json'));
  const record = await readJson(path.join(out, 'record.json'));
  assert.equal(record.state, STATES.judged);
  assert.deepEqual([record.verdict.pick, record.verdict.notes], ['B', 'B keeps its shadows']);
  assert.deepEqual([record.key.A, record.key.B, record.key.pick], [key.A.name, key.B.name, key.B.name]);
  assert.ok(Date.parse(record.verdict.at) <= Date.parse(record.key.openedAt), 'verdict time after key-opened time');
  assert.deepEqual(done.key, record.key);
  const md = await fs.readFile(path.join(out, 'record.md'), 'utf8');
  assert.ok(md.includes(`- A.mp4: ${key.A.name}`) && md.includes(`- B.mp4: ${key.B.name}`) && md.includes(`- Picked: ${key.B.name}`));
  assert.ok(md.includes('- Notes: B keeps its shadows'));
});

test('the record holds no absolute path and no input file name', { skip: SKIP }, async () => {
  const { out } = await prepareDiffering();
  const c = await clips();
  const real = await fs.realpath(os.tmpdir());
  for (const file of ['record.json', 'record.md']) {
    const text = await fs.readFile(path.join(out, file), 'utf8');
    for (const s of [out, c.dir, os.tmpdir(), real, os.homedir()]) assert.ok(!text.includes(s), `${file} holds ${s}`);
    assert.doesNotMatch(text, /(^|[\s"'`(=])\/[\w.-]+\/[\w.-]/m, `${file} holds an absolute path`);
    for (const s of ['build-one', 'build-two', '.mov']) assert.ok(!text.toLowerCase().includes(s), `${file} holds ${s}`);
  }
  const record = await readJson(path.join(out, 'record.json'));
  assert.deepEqual(record.inputs.map((i) => i.name), ['first input', 'second input']);
  assert.ok(record.ffmpeg.runs.every((r) => r.encode.includes('<input>') && r.encode.at(-1) === '<output>'));
  assert.match(record.ffmpeg.version, /^ffmpeg version /);
});

test('the self-check names the field that differs and lets only the picture fields differ', () => {
  const movie = () => ({
    streams: [{ index: 0, codec_type: 'video', codec_name: 'h264', profile: 'High', pix_fmt: 'yuv420p', width: 120, height: 212, r_frame_rate: '24/1',
      duration: '1.500000', nb_frames: '36', nb_read_frames: '36', bit_rate: '1000', tags: { handler_name: 'VideoHandler' } }],
    format: { duration: '1.500000', size: '100', bit_rate: '500', tags: { major_brand: 'isom' } },
  });
  const target = { width: 120, height: 212, rate: { num: 24, den: 1 }, frames: 36, withSound: false };
  assert.equal(checkOutputs(movie(), movie(), target).passed, true);
  const picture = movie();
  Object.assign(picture.streams[0], { bit_rate: '2000' });
  Object.assign(picture.format, { size: '200', bit_rate: '900' });
  assert.equal(checkOutputs(movie(), picture, target).passed, true);
  const pixels = movie();
  pixels.streams[0].pix_fmt = 'yuv444p';
  assert.match(checkOutputs(movie(), pixels, target).problem, /differ in video\.pix_fmt/);
  const tagged = movie();
  tagged.format.tags.title = 'x';
  assert.match(checkOutputs(movie(), tagged, target).problem, /differ in format\.tags\.title/);
  const reference = { 'video.tags.handler_name': 'VideoHandler', 'format.tags.major_brand': 'isom' };
  assert.equal(checkOutputs(movie(), movie(), target, reference).passed, true);
  assert.match(checkOutputs(tagged, tagged, target, reference).problem, /tag format\.tags\.title is not one ffmpeg writes/);
  assert.match(checkOutputs(movie(), movie(), { ...target, frames: 30 }).problem, /nb_frames is 36, not 30/);
});

// Blind comparison of two movies (two builds of the same passage), shown to a judge as A and B.
// prepare puts both inputs through one fixed ffmpeg treatment, tosses which input becomes A, keeps the key in key.json
// outside the judge folder and writes record.json and record.md without it. verdict records the pick, then opens the key.
// Run: node quality/blind/blind.mjs prepare <movie-1> <movie-2> --out <dir> [--name-1 <text>] [--name-2 <text>] [--sound drop|silence]
//      node quality/blind/blind.mjs verdict <dir> --pick A|B|none [--notes <text>]
// Needs ffmpeg and ffprobe on PATH. Tests: release/tests/blind.test.mjs.
import { execFile } from 'node:child_process';
import { createReadStream } from 'node:fs';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';

const exec = promisify(execFile);

export const DEFAULT_NAMES = ['first input', 'second input'];
export const STATES = { open: 'awaiting verdict', recorded: 'verdict recorded, key not opened', judged: 'judged', failed: 'self-check failed' };
const TOOL = 'quality/blind/blind.mjs';
const INPUT = '<input>';
const OUTPUT = '<output>';
const SOUND_RATE = 48000;
const THREADS = '4';
const PICTURE_ARGS = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-threads', THREADS,
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv'];
// AudioToolbox's constant bit rate gives the same stream size whatever the sound. The built-in encoder's size follows
// the sound, so with it two different soundtracks stop at the self-check on bit_rate. For aac_at, profile 1 is AAC-LC.
const SOUND_ARGS = {
  aac_at: ['-c:a', 'aac_at', '-aac_at_mode', 'cbr', '-profile:a', '1', '-b:a', '192k', '-ar', '48000', '-ac', '2'],
  aac: ['-c:a', 'aac', '-profile:a', 'aac_low', '-b:a', '192k', '-ar', '48000', '-ac', '2'],
};
const FINISH_ARGS = ['-map_metadata', '-1', '-map_chapters', '-1', '-fflags', '+bitexact', '-flags:v', '+bitexact', '-flags:a', '+bitexact',
  '-movflags', '+faststart', '-f', 'mp4'];
// The only ffprobe fields that follow the picture itself; A and B may differ in these and nothing else.
export const PICTURE_FIELDS = ['video.bit_rate', 'format.size', 'format.bit_rate'];
const RGB = /^(rgb|bgr|gbr|argb|abgr|0rgb|0bgr|x2rgb|x2bgr|pal8|gray|ya|monow|monob)/;

export class BlindError extends Error {}
const refuse = (message) => { throw new BlindError(message); };

async function run(cmd, args) {
  try { return (await exec(cmd, args, { maxBuffer: 1 << 28 })).stdout; }
  catch (e) { throw new Error(`${cmd} failed: ${String(e.stderr || e.message).trim().split('\n').slice(-3).join(' ')}`); }
}

let toolCache;
// The ffmpeg and ffprobe version lines (null when missing) and whether AudioToolbox AAC is there.
export async function tools() {
  if (toolCache) return toolCache;
  const version = async (cmd) => { try { return (await exec(cmd, ['-version'])).stdout.split('\n')[0].trim(); } catch { return null; } };
  const [ffmpeg, ffprobe] = await Promise.all([version('ffmpeg'), version('ffprobe')]);
  const encoders = ffmpeg ? await run('ffmpeg', ['-hide_banner', '-encoders']) : '';
  return (toolCache = { ffmpeg, ffprobe, aacAt: /^\s*A\S*\s+aac_at\s/m.test(encoders) });
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
function rational(text) {
  const m = /^(\d+)[/:](\d+)$/.exec(text ?? '');
  if (!m || !Number(m[1]) || !Number(m[2])) return null;
  const g = gcd(Number(m[1]), Number(m[2]));
  return { num: Number(m[1]) / g, den: Number(m[2]) / g };
}
const rateText = (r) => `${r.num}/${r.den}`;
const sameRate = (a, b) => a.num * b.den === b.num * a.den;
const seconds = (frames, rate) => Number(((frames * rate.den) / rate.num).toFixed(6));

async function sha256(file) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

// What prepare needs to know about one input. Stream indexes and colour stay out of the record.
export async function probe(file, name = 'input') {
  const info = JSON.parse(await run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]));
  const streams = info.streams ?? [];
  const v = streams.find((s) => s.codec_type === 'video' && !s.disposition?.attached_pic);
  if (!v) refuse(`${name} has no video stream`);
  const a = streams.find((s) => s.codec_type === 'audio');
  const rate = rational(v.r_frame_rate) ?? rational(v.avg_frame_rate);
  if (!rate) refuse(`${name} has no frame rate ffprobe can read`);
  const counted = JSON.parse(await run('ffprobe', ['-v', 'error', '-select_streams', String(v.index), '-count_frames',
    '-show_entries', 'stream=nb_read_frames', '-of', 'json', file]));
  const sar = rational(v.sample_aspect_ratio) ?? { num: 1, den: 1 };
  let width = Math.round((v.width * sar.num) / sar.den), height = v.height;
  const rotation = Number(v.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? 0);
  if (Math.abs(rotation) % 180 === 90) [width, height] = [height, width];
  return {
    width, height, rate, rFrameRate: v.r_frame_rate, avgFrameRate: v.avg_frame_rate,
    duration: Number(v.duration ?? info.format?.duration ?? 0), frames: Number(counted.streams?.[0]?.nb_read_frames ?? 0),
    pictureStart: Number(v.start_time ?? 0),
    sound: a ? { channels: a.channels, sampleRate: Number(a.sample_rate), start: Number(a.start_time ?? v.start_time ?? 0) } : null,
    videoIndex: v.index, audioIndex: a?.index,
    // Untagged YUV is read as BT.709, as players do; tagged input converts from what it says.
    untaggedYuv: !RGB.test(v.pix_fmt ?? '') && (!v.color_space || ['unknown', 'reserved'].includes(v.color_space)),
  };
}

function countArgs(p, rate) {
  return ['-nostdin', '-hide_banner', '-v', 'error', '-i', INPUT, '-filter_complex', `[0:${p.videoIndex}]setpts=PTS-STARTPTS,fps=${rateText(rate)}[v]`,
    '-map', '[v]', '-fps_mode', 'passthrough', '-f', 'null', '-', '-progress', 'pipe:1', '-nostats'];
}

// The sound chain: start at the first picture, stereo at 48 kHz (mono copied to both sides), padded or cut to exactly `samples`.
function soundChain(p, samples) {
  const tail = `aresample=${SOUND_RATE},aformat=sample_fmts=s16:channel_layouts=stereo`;
  const end = `apad=whole_len=${samples},atrim=end_sample=${samples}`;
  if (!p) return `asetpts=PTS-STARTPTS,${tail},${end}`; // the silent track
  const lead = p.sound.start - p.pictureStart, shift = Math.round(Math.abs(lead) * SOUND_RATE);
  const align = !shift ? '' : lead < 0 ? `,atrim=start_sample=${shift},asetpts=PTS-STARTPTS` : `,adelay=delays=${shift}S:all=1`;
  const mono = p.sound.channels === 1 ? ',pan=stereo|c0=c0|c1=c0' : '';
  return `asetpts=PTS-STARTPTS${mono},${tail}${align},${end}`;
}

function encodeArgs(p, plan) {
  const { width, height, rate, frames, samples, withSound } = plan;
  const args = ['-nostdin', '-hide_banner', '-v', 'error', '-n', '-i', INPUT];
  const graph = [`[0:${p.videoIndex}]${p.untaggedYuv ? 'setparams=colorspace=bt709,' : ''}setpts=PTS-STARTPTS,`
    + `scale=${width}:${height}:flags=lanczos:out_color_matrix=bt709:out_range=tv:out_chroma_loc=left,fps=${rateText(rate)},format=yuv420p,setsar=1[v]`];
  if (withSound && p.sound) graph.push(`[0:${p.audioIndex}]${soundChain(p, samples)}[a]`);
  else if (withSound) { args.push('-f', 'lavfi', '-i', `anullsrc=r=${SOUND_RATE}:cl=stereo`); graph.push(`[1:a]${soundChain(null, samples)}[a]`); }
  args.push('-filter_complex', graph.join(';'), '-map', '[v]', ...(withSound ? ['-map', '[a]'] : []), '-frames:v', String(frames), '-fps_mode', 'passthrough',
    ...PICTURE_ARGS, ...(withSound ? SOUND_ARGS[plan.encoder] : ['-an']), ...FINISH_ARGS, OUTPUT);
  return args;
}

const fill = (args, input, output) => args.map((a) => (a === INPUT ? input : a === OUTPUT ? output : a));

async function framesAtRate(file, p, rate) {
  const out = await run('ffmpeg', fill(countArgs(p, rate), file));
  return Number([...out.matchAll(/^frame=(\d+)$/gm)].at(-1)?.[1] ?? 0);
}

async function describe(file) {
  const info = JSON.parse(await run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-count_frames', '-of', 'json', file]));
  delete info.format?.filename;
  return info;
}

// ffprobe JSON as flat "video.pix_fmt" style fields; a second stream of a kind becomes video2, audio2 and so on.
export function flatten(info) {
  const out = {}, seen = {};
  const put = (prefix, obj) => {
    for (const [k, val] of Object.entries(obj ?? {})) {
      if (val && typeof val === 'object' && !Array.isArray(val)) put(`${prefix}.${k}`, val);
      else out[`${prefix}.${k}`] = val;
    }
  };
  for (const s of info.streams ?? []) { seen[s.codec_type] = (seen[s.codec_type] ?? 0) + 1; put(seen[s.codec_type] > 1 ? `${s.codec_type}${seen[s.codec_type]}` : s.codec_type, s); }
  put('format', info.format);
  return out;
}

const tagsOf = (flat) => Object.fromEntries(Object.entries(flat).filter(([k]) => /^\w+\.tags\./.test(k)));

// Tags of a movie made with the same output arguments from ffmpeg's own test source, which has no tags to carry.
async function referenceTags(plan) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'blind-reference-'));
  try {
    const file = path.join(dir, 'reference.mp4');
    const sound = plan.withSound ? ['-f', 'lavfi', '-i', `anullsrc=r=${SOUND_RATE}:cl=stereo`, '-map', '0:v', '-map', '1:a', '-af', 'atrim=end_sample=4800'] : ['-map', '0:v'];
    await run('ffmpeg', ['-nostdin', '-hide_banner', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=s=64x64:r=24', ...sound, '-frames:v', '2',
      ...PICTURE_ARGS, ...(plan.withSound ? SOUND_ARGS[plan.encoder] : ['-an']), ...FINISH_ARGS, file]);
    return tagsOf(flatten(await describe(file)));
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
}

// The self-check: A and B agree on every ffprobe field but the picture's own and match the target; with `reference`
// (from referenceTags) their tags must be exactly the reference's, so none came from an input.
// Returns { passed: true, ... } or { passed: false, problem }.
export function checkOutputs(a, b, expected, reference = null) {
  const fa = flatten(a), fb = flatten(b);
  const fail = (problem) => ({ passed: false, problem });
  const fields = [...new Set([...Object.keys(fa), ...Object.keys(fb)])].sort();
  const compared = fields.filter((k) => !PICTURE_FIELDS.includes(k));
  for (const k of compared) {
    if (!(k in fa) || !(k in fb)) return fail(`A.mp4 and B.mp4 differ in ${k}: only one has it`);
    if (JSON.stringify(fa[k]) !== JSON.stringify(fb[k])) return fail(`A.mp4 and B.mp4 differ in ${k}`);
  }
  const want = {
    'video.codec_name': 'h264', 'video.profile': 'High', 'video.pix_fmt': 'yuv420p', 'video.width': expected.width, 'video.height': expected.height,
    'video.nb_frames': expected.frames, 'video.nb_read_frames': expected.frames,
    ...(expected.withSound ? { 'audio.codec_name': 'aac', 'audio.profile': 'LC', 'audio.sample_rate': SOUND_RATE, 'audio.channels': 2 } : {}),
  };
  for (const [k, val] of Object.entries(want)) if (String(fa[k]) !== String(val)) return fail(`${k} is ${fa[k] ?? 'missing'}, not ${val}`);
  const rate = rational(fa['video.r_frame_rate']);
  if (!rate || !sameRate(rate, expected.rate)) return fail(`video.r_frame_rate is ${fa['video.r_frame_rate']}, not ${rateText(expected.rate)}`);
  if (Math.abs(Number(fa['video.duration']) - (expected.frames * expected.rate.den) / expected.rate.num) > expected.rate.den / expected.rate.num / 2) {
    return fail(`video.duration is ${fa['video.duration']}, not ${seconds(expected.frames, expected.rate)}`);
  }
  const kinds = (a.streams ?? []).map((s) => s.codec_type).join(',');
  if (kinds !== (expected.withSound ? 'video,audio' : 'video')) return fail(`the streams are ${kinds}, not ${expected.withSound ? 'video,audio' : 'video'}`);
  const own = tagsOf(fa);
  if (reference) {
    for (const k of new Set([...Object.keys(own), ...Object.keys(reference)])) {
      if (!(k in reference)) return fail(`tag ${k} is not one ffmpeg writes on its own`);
      if (own[k] !== reference[k]) return fail(`tag ${k} is not what ffmpeg writes on its own`);
    }
  }
  const tags = {};
  for (const [k, val] of Object.entries(own)) { const [where, , name] = k.split('.'); (tags[where] ??= {})[name] = val; }
  return {
    passed: true, fieldsCompared: compared.length, allowedToDiffer: PICTURE_FIELDS, tags,
    agreed: {
      codec: fa['video.codec_name'], profile: fa['video.profile'], pixelFormat: fa['video.pix_fmt'], size: `${fa['video.width']}x${fa['video.height']}`,
      frameRate: fa['video.r_frame_rate'], frames: Number(fa['video.nb_read_frames']), duration: Number(fa['format.duration']),
      sound: expected.withSound ? { codec: fa['audio.codec_name'], profile: fa['audio.profile'], sampleRate: Number(fa['audio.sample_rate']),
        channels: fa['audio.channels'], bitRate: Number(fa['audio.bit_rate']), duration: Number(fa['audio.duration']) } : null,
    },
  };
}

async function syncDir(dir) {
  try { const fh = await fs.open(dir, 'r'); try { await fh.sync(); } finally { await fh.close(); } } catch { /* not every platform syncs a folder */ }
}

// Write, fsync, rename into place, fsync the folder.
async function writeDurable(file, text, mode = 0o644) {
  const tmp = `${file}.tmp`;
  const fh = await fs.open(tmp, 'w', mode);
  try { await fh.writeFile(text); await fh.sync(); } finally { await fh.close(); }
  await fs.chmod(tmp, mode);
  await fs.rename(tmp, file);
  await syncDir(path.dirname(file));
}

async function writeRecord(dir, record) {
  await writeDurable(path.join(dir, 'record.json'), `${JSON.stringify(record, null, 2)}\n`);
  await writeDurable(path.join(dir, 'record.md'), renderMarkdown(record));
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function soundPlan(probes, names, sound) {
  const has = probes.map((p) => Boolean(p.sound));
  const named = (i) => names[i];
  if (sound === 'drop') {
    const which = has[0] && has[1] ? 'Both inputs had sound' : has[0] || has[1] ? `Only ${named(has[0] ? 0 : 1)} had sound` : 'Neither input had sound';
    return { withSound: false, treatment: 'dropped', text: `${which}; with --sound drop neither movie has a sound track.` };
  }
  if (!has[0] && !has[1]) return { withSound: false, treatment: 'none', text: 'Neither input has sound, so neither movie has a sound track.' };
  if (has[0] !== has[1]) {
    const yes = has[0] ? 0 : 1, no = 1 - yes;
    if (sound !== 'silence') {
      refuse(`${named(yes)} has sound and ${named(no)} has none. Choose --sound drop (neither movie gets a sound track) `
        + `or --sound silence (${named(no)} gets a silent track, so both have one).`);
    }
    return { withSound: true, treatment: 'silence added', text: `${named(no)} has no sound; with --sound silence it was given a silent track, so both movies have one.` };
  }
  return { withSound: true, treatment: 'encoded alike', text: 'Both inputs have sound; both went through the same sound chain.' };
}

// Prepare a blind comparison. movies: two paths; out: the folder (absent or empty); names: what the record calls each
// input; sound: undefined, 'drop' or 'silence'; toss: (n) => integer in [0, n), for tests (default crypto.randomInt).
// Returns where the judge's movies are; it never returns or prints the key.
export async function prepare({ movies, out, names = [], sound, toss = crypto.randomInt } = {}) {
  if (!Array.isArray(movies) || movies.length !== 2) refuse('prepare needs two movies');
  if (!out) refuse('prepare needs --out <dir>');
  if (sound !== undefined && !['drop', 'silence'].includes(sound)) refuse(`--sound must be drop or silence, not ${sound}`);
  names = [0, 1].map((i) => (names[i] ?? DEFAULT_NAMES[i]).trim());
  if (names.some((n) => !n)) refuse('an input name cannot be empty');
  if (names[0] === names[1]) refuse('the two inputs need different names');
  movies = movies.map((m) => path.resolve(m));
  out = path.resolve(out);
  for (const [i, m] of movies.entries()) {
    const st = await fs.stat(m).catch(() => null);
    if (!st?.isFile()) refuse(`${names[i]} is not a readable file: ${m}`);
  }
  const outStat = await fs.stat(out).catch(() => null);
  if (outStat && !outStat.isDirectory()) refuse(`${out} exists and is not a folder`);
  if (outStat && (await fs.readdir(out)).length) refuse(`${out} is not empty`);
  const t = await tools();
  if (!t.ffmpeg || !t.ffprobe) refuse('ffmpeg and ffprobe must be on PATH');

  const started = new Date();
  const probes = [await probe(movies[0], names[0]), await probe(movies[1], names[1])];
  const soundDone = soundPlan(probes, names, sound);
  const shape = probes.map((p) => p.width / p.height);
  const apart = Math.max(...shape) / Math.min(...shape) - 1;
  if (apart > 0.01) {
    refuse(`the two movies' shapes differ by ${(apart * 100).toFixed(1)} % (${names[0]} ${probes[0].width}x${probes[0].height}, `
      + `${names[1]} ${probes[1].width}x${probes[1].height}); more than 1 % is refused`);
  }
  const small = probes[1].width * probes[1].height < probes[0].width * probes[0].height ? probes[1] : probes[0];
  const width = Math.max(2, Math.floor(small.width / 2) * 2), height = Math.max(2, Math.floor(small.height / 2) * 2);
  const rate = probes[1].rate.num * probes[0].rate.den < probes[0].rate.num * probes[1].rate.den ? probes[1].rate : probes[0].rate;
  const atRate = [await framesAtRate(movies[0], probes[0], rate), await framesAtRate(movies[1], probes[1], rate)];
  const frames = Math.min(...atRate);
  if (!frames) refuse(`${names[atRate.indexOf(0)]} gives no frames at ${rateText(rate)}`);
  const samples = Math.round((frames * SOUND_RATE * rate.den) / rate.num);
  const plan = { width, height, rate, frames, samples, withSound: soundDone.withSound, encoder: t.aacAt ? 'aac_at' : 'aac' };
  const args = probes.map((p) => encodeArgs(p, plan));
  const hashes = [await sha256(movies[0]), await sha256(movies[1])];

  const record = {
    kind: 'blind comparison', tool: TOOL, state: STATES.open, preparedAt: started.toISOString(),
    inputs: probes.map((p, i) => ({
      name: names[i], sha256: hashes[i],
      probe: {
        width: p.width, height: p.height, frameRate: rateText(p.rate), rFrameRate: p.rFrameRate, avgFrameRate: p.avgFrameRate,
        duration: p.duration, frames: p.frames, framesAtTargetRate: atRate[i], pictureStart: p.pictureStart,
        sound: p.sound ? { present: true, channels: p.sound.channels, sampleRate: p.sound.sampleRate, start: p.sound.start } : { present: false },
      },
    })),
    target: {
      width, height, frameRate: rateText(rate), frames, seconds: seconds(frames, rate),
      size: 'the smaller input by pixel count, rounded down to even numbers, square pixels', rate: 'the lower of the two',
      picture: 'H.264 High (libx264), yuv420p, CRF 15, preset slow, 4 threads, BT.709 tags, lanczos scaling',
      sound: plan.withSound ? `AAC-LC, 192 kb/s, 48 kHz, stereo (${plan.encoder === 'aac_at' ? 'AudioToolbox, constant bit rate' : "ffmpeg's built-in AAC"}), ${samples} samples` : 'none',
      container: 'mp4, faststart, no metadata or chapters from the inputs, bitexact',
    },
    sound: { treatment: soundDone.treatment, text: soundDone.text },
    length: {
      framesKept: frames, seconds: seconds(frames, rate),
      inputs: names.map((n, i) => ({ name: n, frames: probes[i].frames, framesAtTargetRate: atRate[i], framesCut: atRate[i] - frames })),
    },
    ffmpeg: { version: t.ffmpeg, ffprobeVersion: t.ffprobe, runs: names.map((n, i) => ({ input: n, count: countArgs(probes[i], rate), encode: args[i] })) },
    outputs: null, selfCheck: null, verdict: null, key: null,
  };

  // Which input is A, and which movie is made first, are two separate tosses.
  const tosses = [toss(2), toss(2)];
  if (tosses.some((x) => x !== 0 && x !== 1)) throw new Error('a toss must give 0 or 1');
  const tossedAt = new Date().toISOString();
  const inputOf = tosses[0] ? { A: 1, B: 0 } : { A: 0, B: 1 };
  const order = tosses[1] ? ['B', 'A'] : ['A', 'B'];

  const judge = path.join(out, 'judge');
  const made = [];
  const madeOut = !outStat;
  await fs.mkdir(judge, { recursive: true });
  try {
    const temp = {};
    for (const label of order) {
      temp[label] = path.join(judge, `tmp-${crypto.randomBytes(6).toString('hex')}.mp4`);
      made.push(temp[label]);
      await run('ffmpeg', fill(args[inputOf[label]], movies[inputOf[label]], temp[label]));
    }
    const movie = (label) => path.join(judge, `${label}.mp4`);
    for (const label of order) { await fs.rename(temp[label], movie(label)); made.push(movie(label)); }
    // One instant, in whole seconds, before either file was written; on macOS this also sets both birth times to it.
    const instant = Math.floor(started.getTime() / 1000);
    for (const label of order) await fs.utimes(movie(label), instant, instant);

    const check = checkOutputs(await describe(movie('A')), await describe(movie('B')), plan, await referenceTags(plan));
    if (!check.passed) {
      for (const f of made) await fs.rm(f, { force: true });
      await fs.rmdir(judge).catch(() => {});
      record.state = STATES.failed;
      record.selfCheck = { result: 'failed', problem: check.problem, note: 'the movies were removed; nothing here should be judged' };
      await writeRecord(out, record);
      refuse(`self-check failed: ${check.problem}. Both movies were removed; record.json says why. Remove ${out} to try again.`);
    }
    record.outputs = { 'A.mp4': { sha256: await sha256(movie('A')) }, 'B.mp4': { sha256: await sha256(movie('B')) }, time: new Date(instant * 1000).toISOString() };
    const { passed, ...found } = check;
    record.selfCheck = { result: 'passed', ...found, tagsMatchReference: true };
    const key = {
      A: { input: inputOf.A + 1, name: names[inputOf.A], sha256: hashes[inputOf.A] },
      B: { input: inputOf.B + 1, name: names[inputOf.B], sha256: hashes[inputOf.B] },
      tossedAt, madeFirst: order[0],
    };
    made.push(path.join(out, 'key.json'));
    await writeDurable(path.join(out, 'key.json'), `${JSON.stringify(key, null, 2)}\n`, 0o600);
    made.push(path.join(out, 'record.json'), path.join(out, 'record.md'));
    await writeRecord(out, record);
  } catch (e) {
    if (record.state !== STATES.failed) {
      for (const f of made) await fs.rm(f, { force: true });
      for (const f of await fs.readdir(judge).catch(() => [])) if (/^tmp-[0-9a-f]+\.mp4$/.test(f)) await fs.rm(path.join(judge, f), { force: true });
      await fs.rmdir(judge).catch(() => {});
      if (madeOut) await fs.rmdir(out).catch(() => {});
    }
    throw e;
  }
  return { judge, movies: ['A.mp4', 'B.mp4'] };
}

// Record the verdict, fsync it, and only then open the key. Returns { verdict, key } or { verdict, key: null, keyError }.
export async function verdict({ dir, pick, notes = '' } = {}) {
  const chosen = { a: 'A', b: 'B', none: 'none' }[String(pick ?? '').trim().toLowerCase()];
  if (!chosen) refuse(pick === undefined ? 'verdict needs --pick A, B or none' : `--pick must be A, B or none, not ${pick}`);
  if (!dir) refuse('verdict needs the comparison folder');
  dir = path.resolve(dir);
  let record;
  try { record = JSON.parse(await fs.readFile(path.join(dir, 'record.json'), 'utf8')); } catch (e) { refuse(`cannot read ${path.join(dir, 'record.json')}: ${e.code ?? e.message}`); }
  if (record.verdict) refuse(`this comparison already has a verdict (${record.verdict.pick}, given ${record.verdict.at})`);
  if (record.state !== STATES.open) refuse(`the record's state is "${record.state}", not "${STATES.open}"`);
  record.verdict = { pick: chosen, notes: String(notes ?? ''), at: new Date().toISOString() };
  record.state = STATES.recorded;
  await writeRecord(dir, record);

  const openedAt = new Date().toISOString();
  let key;
  try {
    key = JSON.parse(await fs.readFile(path.join(dir, 'key.json'), 'utf8'));
    const names = record.inputs.map((i) => i.name);
    if (!names.includes(key.A?.name) || !names.includes(key.B?.name) || key.A.name === key.B.name) throw new Error('key.json does not match the record');
  } catch (e) {
    record.keyError = { at: openedAt, reason: e.code ?? e.message };
    await writeRecord(dir, record);
    return { verdict: record.verdict, key: null, keyError: record.keyError.reason };
  }
  record.key = { openedAt, A: key.A.name, B: key.B.name, pick: chosen === 'none' ? 'none' : key[chosen].name };
  record.state = STATES.judged;
  await writeRecord(dir, record);
  return { verdict: record.verdict, key: record.key };
}

const cell = (text) => String(text).replace(/\|/g, '\\|');
const shellWord = (a) => (a === INPUT || a === OUTPUT || /^[\w@%+=:,./-]+$/.test(a) ? a : `'${a.replace(/'/g, `'\\''`)}'`);

export function renderMarkdown(r) {
  const [i1, i2] = r.inputs;
  const row = (label, f) => `| ${label} | ${cell(f(i1))} | ${cell(f(i2))} |`;
  const sound = (i) => (i.probe.sound.present ? `yes, ${plural(i.probe.sound.channels, 'channel')} at ${i.probe.sound.sampleRate} Hz` : 'no');
  const L = ['# Blind comparison record', '', `- State: ${r.state}`, `- Prepared: ${r.preparedAt}`, `- Script: \`${r.tool}\``, '',
    '## Inputs', '', `| | ${cell(i1.name)} | ${cell(i2.name)} |`, '| --- | --- | --- |',
    row('SHA-256', (i) => `\`${i.sha256}\``), row('Picture size', (i) => `${i.probe.width} x ${i.probe.height}`), row('Frame rate', (i) => i.probe.frameRate),
    row('Duration', (i) => `${i.probe.duration} s`), row('Frames', (i) => i.probe.frames), row(`Frames at ${r.target.frameRate}`, (i) => i.probe.framesAtTargetRate),
    row('First picture at', (i) => `${i.probe.pictureStart} s`), row('Sound', sound), '',
    '## Treatment', '', 'Both inputs went through the same ffmpeg command; only the input changes.', '',
    `- Size: ${r.target.width} x ${r.target.height} (${r.target.size}).`, `- Frame rate: ${r.target.frameRate} (${r.target.rate}).`,
    `- Length: ${plural(r.length.framesKept, 'frame')}, ${r.length.seconds} s, the shorter input at the target rate, each starting at its own first picture.`,
    ...r.length.inputs.map((i) => `  - ${i.name}: ${i.framesAtTargetRate} at the target rate, ${i.framesCut ? `${i.framesCut} cut from the end` : 'none cut'}.`),
    `- Picture: ${r.target.picture}.`, `- Sound: ${r.sound.text} ${r.target.sound === 'none' ? '' : `${r.target.sound}.`}`.trimEnd(),
    `- Container: ${r.target.container}.`, ''];
  if (r.outputs) {
    L.push('## Movies for the judge', '', 'In `judge/`, with the same access and modification time, ' + `${r.outputs.time}.`, '', '| Movie | SHA-256 |', '| --- | --- |',
      `| A.mp4 | \`${r.outputs['A.mp4'].sha256}\` |`, `| B.mp4 | \`${r.outputs['B.mp4'].sha256}\` |`, '');
  }
  L.push('## Self-check', '');
  if (r.selfCheck?.result === 'passed') {
    const s = r.selfCheck;
    L.push(`Passed. ffprobe read both movies; they agree on all ${s.fieldsCompared} other fields (codec, profile, pixel format, size, rate, frame count, `
      + `duration, every sound field, container and stream tags) and differ only in ${s.allowedToDiffer.join(', ')}, which follow the picture itself. `
      + 'Their tags are exactly those of a reference movie made the same way from ffmpeg\'s own test source, so no tag carries anything from an input.', '',
    `- Agreed: ${s.agreed.codec} ${s.agreed.profile}, ${s.agreed.pixelFormat}, ${s.agreed.size}, ${s.agreed.frameRate}, ${plural(s.agreed.frames, 'frame')}, ${s.agreed.duration} s.`,
    `- Sound: ${s.agreed.sound ? `${s.agreed.sound.codec} ${s.agreed.sound.profile}, ${s.agreed.sound.sampleRate} Hz, ${plural(s.agreed.sound.channels, 'channel')}, ${s.agreed.sound.bitRate} b/s, ${s.agreed.sound.duration} s` : 'no sound track in either'}.`,
    `- Tags: ${Object.entries(s.tags).map(([where, t]) => `${where} ${Object.entries(t).map(([k, v]) => `${k}=${v}`).join(', ')}`).join('; ')}.`, '');
  } else if (r.selfCheck) L.push(`Failed: ${r.selfCheck.problem}. The movies were removed; nothing here should be judged.`, '');
  else L.push('Not run.', '');
  L.push('## Commands', '', `\`${r.ffmpeg.version}\``, '');
  for (const run of r.ffmpeg.runs) {
    L.push(`${run.input}, frames at the target rate:`, '', '```', `ffmpeg ${run.count.map(shellWord).join(' ')}`, '```', '',
      `${run.input}, the movie:`, '', '```', `ffmpeg ${run.encode.map(shellWord).join(' ')}`, '```', '');
  }
  L.push('## Verdict', '');
  if (!r.verdict) L.push('Not given yet. The key stays closed until a verdict is recorded.', '');
  else L.push(`- Pick: ${r.verdict.pick}`, `- Notes: ${r.verdict.notes || '(none)'}`, `- Given: ${r.verdict.at}`, '');
  if (r.verdict) {
    L.push('## Key', '');
    if (r.key) {
      L.push(`- Opened: ${r.key.openedAt}`, `- A.mp4: ${r.key.A}`, `- B.mp4: ${r.key.B}`, `- Picked: ${r.key.pick === 'none' ? 'neither' : r.key.pick}`, '');
    } else if (r.keyError) L.push(`The key could not be opened (${r.keyError.reason}, ${r.keyError.at}).`, '');
    else L.push('Not opened yet.', '');
  }
  return `${L.join('\n').trimEnd()}\n`;
}

const USAGE = `Usage:
  node ${TOOL} prepare <movie-1> <movie-2> --out <dir> [--name-1 <text>] [--name-2 <text>] [--sound drop|silence]
  node ${TOOL} verdict <dir> --pick A|B|none [--notes <text>]`;

export async function main(argv) {
  const [command, ...rest] = argv;
  if (command === 'prepare') {
    const { values, positionals } = parseArgs({ args: rest, allowPositionals: true,
      options: { out: { type: 'string' }, 'name-1': { type: 'string' }, 'name-2': { type: 'string' }, sound: { type: 'string' } } });
    if (positionals.length !== 2) refuse(`prepare needs two movies\n${USAGE}`);
    const done = await prepare({ movies: positionals, out: values.out, names: [values['name-1'], values['name-2']], sound: values.sound });
    process.stdout.write(`The movies for the judge are in ${done.judge}:\n${done.movies.map((m) => `  ${m}\n`).join('')}`);
    return 0;
  }
  if (command === 'verdict') {
    const { values, positionals } = parseArgs({ args: rest, allowPositionals: true, options: { pick: { type: 'string' }, notes: { type: 'string' } } });
    if (positionals.length !== 1) refuse(`verdict needs the comparison folder\n${USAGE}`);
    const done = await verdict({ dir: positionals[0], pick: values.pick, notes: values.notes });
    process.stdout.write(`Verdict: ${done.verdict.pick}\nNotes: ${done.verdict.notes || '(none)'}\nGiven: ${done.verdict.at}\n`);
    if (!done.key) {
      process.stderr.write(`The key could not be opened (${done.keyError}). The verdict is recorded; the key is not.\n`);
      return 1;
    }
    process.stdout.write(`Key opened: ${done.key.openedAt}\nA.mp4: ${done.key.A}\nB.mp4: ${done.key.B}\nPicked: ${done.key.pick === 'none' ? 'neither' : done.key.pick}\n`);
    return 0;
  }
  refuse(USAGE);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (e) => {
    process.stderr.write(`blind: ${e.message}\n`);
    process.exitCode = 1;
  });
}

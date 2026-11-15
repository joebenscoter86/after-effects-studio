// Per-frame change measurement, noisy-cell detection and kept-frame selection.
// FrameStat = { f, t, mean, share, cells }   Kept = { f, t, why: 'settle' | 'motion' | 'sentence' }

import { spawn, execFile } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);
const round = (x, d) => { const p = 10 ** d; return Math.round(x * p) / p; };

const indexCache = new Map();
function cellIndex(w, h, gw, gh) {
  const key = `${w}x${h}/${gw}x${gh}`;
  let v = indexCache.get(key);
  if (!v) {
    const col = new Uint16Array(w);
    for (let x = 0; x < w; x++) col[x] = Math.floor((x * gw) / w);
    const row = new Uint16Array(h);
    for (let y = 0; y < h; y++) row[y] = Math.floor((y * gh) / h);
    const size = new Float64Array(gw * gh);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) size[row[y] * gw + col[x]]++;
    v = { col, row, size };
    indexCache.set(key, v);
  }
  return v;
}

// Difference of two 8-bit grey frames. mean: mean absolute difference (0-255);
// share: share of pixels whose difference exceeds pixelThreshold; cells: that share per grid cell, row by row.
export function frameDiff(prev, cur, w, h, grid, pixelThreshold) {
  const [gw, gh] = grid;
  const { col, row, size } = cellIndex(w, h, gw, gh);
  const counts = new Float64Array(gw * gh);
  let sum = 0;
  let changed = 0;
  for (let y = 0; y < h; y++) {
    const base = y * w;
    const rowBase = row[y] * gw;
    for (let x = 0; x < w; x++) {
      const i = base + x;
      const d = cur[i] > prev[i] ? cur[i] - prev[i] : prev[i] - cur[i];
      sum += d;
      if (d > pixelThreshold) { changed++; counts[rowBase + col[x]]++; }
    }
  }
  const n = w * h;
  const cells = new Array(gw * gh);
  for (let c = 0; c < cells.length; c++) cells[c] = round(counts[c] / size[c], 4);
  return { mean: round(sum / n, 3), share: round(changed / n, 4), cells };
}

async function probeFps(videoPath) {
  const { stdout } = await execFileP('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate',
    '-of', 'default=noprint_wrappers=1:nokey=1', videoPath,
  ]);
  const [a, b = '1'] = stdout.trim().split('\n')[0].split('/');
  const fps = Number(a) / Number(b);
  if (!Number.isFinite(fps) || fps <= 0) throw new Error(`no frame rate for ${videoPath}: ${stdout}`);
  return fps;
}

// Decodes every frame to grey with ffmpeg, streaming, and writes one FrameStat JSON line per frame.
// opts.duration (seconds) limits how much of the file is read; opts.onProgress(framesDone) is called as it goes.
export async function measureChanges(videoPath, outPath, opts = {}) {
  const w = opts.width ?? 960;
  const h = opts.height ?? 540;
  const grid = opts.grid ?? [16, 9];
  const threshold = opts.pixelThreshold ?? 12;
  const onProgress = opts.onProgress;
  const fps = await probeFps(videoPath);
  const frameSize = w * h;

  const args = ['-v', 'error', '-nostdin'];
  if (opts.duration != null) args.push('-t', String(opts.duration));
  args.push('-i', videoPath, '-map', '0:v:0', '-an', '-fps_mode', 'passthrough',
    '-vf', `scale=${w}:${h},format=gray`, '-pix_fmt', 'gray', '-f', 'rawvideo', 'pipe:1');

  const out = createWriteStream(outPath);
  const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  ff.stderr.on('data', (d) => { stderr += d; if (stderr.length > 20000) stderr = stderr.slice(-20000); });

  let prev = null;
  let cur = new Uint8Array(frameSize);
  let fill = 0;
  let f = 0;
  const zeroCells = new Array(grid[0] * grid[1]).fill(0);

  const emit = () => {
    let stat;
    if (prev === null) stat = { f, t: f / fps, mean: 0, share: 0, cells: zeroCells };
    else stat = { f, t: f / fps, ...frameDiff(prev, cur, w, h, grid, threshold) };
    const ok = out.write(JSON.stringify(stat) + '\n');
    f++;
    // swap buffers instead of allocating
    const spare = prev ?? new Uint8Array(frameSize);
    prev = cur;
    cur = spare;
    fill = 0;
    if (onProgress && (f % 60 === 0)) onProgress(f);
    return ok;
  };

  await new Promise((resolve, reject) => {
    let settled = false;
    const fail = (e) => { if (!settled) { settled = true; ff.kill('SIGKILL'); out.destroy(); reject(e); } };
    ff.on('error', fail);
    out.on('error', fail);
    ff.stdout.on('data', (chunk) => {
      let off = 0;
      let pause = false;
      while (off < chunk.length) {
        const take = Math.min(frameSize - fill, chunk.length - off);
        cur.set(chunk.subarray(off, off + take), fill);
        fill += take;
        off += take;
        if (fill === frameSize && !emit()) pause = true;
      }
      if (pause) { ff.stdout.pause(); out.once('drain', () => ff.stdout.resume()); }
    });
    ff.on('close', (code) => {
      if (settled) return;
      if (code !== 0) return fail(new Error(`ffmpeg exited ${code}: ${stderr.trim()}`));
      if (fill !== 0) return fail(new Error(`ffmpeg output ended mid-frame (${fill} of ${frameSize} bytes)`));
      out.end(() => { settled = true; resolve(); });
    });
  });
  if (onProgress) onProgress(f);
  return { frames: f, fps };
}

// Cells whose changed share exceeds cellShare in more than activeShare of frames.
export function noisyCells(stats, opts = {}) {
  const cellShare = opts.cellShare ?? 0.01;
  const activeShare = opts.activeShare ?? 0.5;
  if (stats.length === 0) return [];
  const n = stats[0].cells.length;
  const counts = new Array(n).fill(0);
  for (const s of stats) for (let c = 0; c < n; c++) if (s.cells[c] > cellShare) counts[c]++;
  const out = [];
  for (let c = 0; c < n; c++) if (counts[c] / stats.length > activeShare) out.push(c);
  return out;
}

// Chooses the frames worth looking at. See the plan's Task 2 for the rules.
// Active runs are joined across calm gaps shorter than settleFrames, so a 60 fps file holding
// 24 or 30 fps content (every other frame a repeat, hence calm) counts as one run, not many events.
export function pickFrames(stats, sentenceStarts, opts = {}) {
  const ignore = new Set(opts.ignoreCells ?? []);
  const cellShare = opts.cellShare ?? 0.01;
  const settleFrames = opts.settleFrames ?? 6;
  const motionEvery = opts.motionEvery ?? 1.0;
  const minGap = opts.minGap ?? 0.25;
  const n = stats.length;
  if (n === 0) return [];

  const active = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const cells = stats[i].cells;
    for (let c = 0; c < cells.length; c++) {
      if (cells[c] > cellShare && !ignore.has(c)) { active[i] = 1; break; }
    }
  }

  const cand = [];
  const add = (i, why) => cand.push({ f: stats[i].f, t: stats[i].t, why });

  let i = 0;
  while (i < n) {
    if (!active[i]) { i++; continue; }
    const start = i;
    let last = i;
    let j = i + 1;
    // Extend the run until settleFrames calm frames follow its latest active frame (or the video ends).
    while (j < n && j - last <= settleFrames) {
      if (active[j]) last = j;
      j++;
    }
    const t0 = stats[start].t;
    const tEnd = stats[last].t;
    for (let k = 1; t0 + k * motionEvery < tEnd + 1e-9; k++) {
      const target = t0 + k * motionEvery;
      const idx = firstAtOrAfter(stats, target, start, last);
      if (idx > start && idx <= last) add(idx, 'motion');
    }
    if (last + 1 < n) add(last + 1, 'settle');
    i = last + 1;
  }

  for (const s of sentenceStarts) {
    const idx = firstAtOrAfter(stats, s, 0, n - 1);
    if (idx >= 0) add(idx, 'sentence');
  }

  const rank = { settle: 0, motion: 1, sentence: 2 };
  cand.sort((a, b) => a.t - b.t || rank[a.why] - rank[b.why]);

  const kept = [];
  for (const c of cand) {
    const prev = kept[kept.length - 1];
    if (prev && prev.f === c.f) continue;
    if (prev && c.t - prev.t < minGap - 1e-9) {
      if (c.why === 'settle' && prev.why === 'motion') {
        kept.pop();
        const before = kept[kept.length - 1];
        if (before && c.t - before.t < minGap - 1e-9) continue;
        kept.push(c);
      }
      continue;
    }
    kept.push(c);
  }
  return kept;
}

// Index of the first stat in [lo, hi] with t >= target (allowing float slack), or -1.
function firstAtOrAfter(stats, target, lo, hi) {
  const eps = 1e-6;
  if (lo > hi || stats[hi].t < target - eps) return -1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (stats[mid].t >= target - eps) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

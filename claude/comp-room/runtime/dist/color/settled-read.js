import { promises as fs } from "node:fs";
const SETTLE_BASE_MS = 15e3;
const SETTLE_PER_HD_FRAME_MS = 3e3;
const SETTLE_MIN_PER_FRAME_MS = 1e3;
const HD_PIXELS = 1080 * 1920;
const POLL_MS = 60;
const IEND = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function settleTimeoutFor(frames, pixelsPerFrame) {
  const n = Math.max(1, Math.floor(frames));
  const perFrame = Math.max(
    SETTLE_MIN_PER_FRAME_MS,
    Math.round(SETTLE_PER_HD_FRAME_MS * Math.max(0, pixelsPerFrame) / HD_PIXELS)
  );
  return SETTLE_BASE_MS + (n - 1) * perFrame;
}
async function stampFiles(paths) {
  return Promise.all(
    paths.map(async (p) => {
      try {
        const st = await fs.stat(p, { bigint: true });
        return { exists: true, size: Number(st.size), mtimeNs: st.mtimeNs, ino: st.ino };
      } catch {
        return { exists: false, size: 0, mtimeNs: 0n, ino: 0n };
      }
    })
  );
}
async function endsWithIend(p, size) {
  if (size < IEND.length) return false;
  let fh = null;
  try {
    fh = await fs.open(p, "r");
    const tail = Buffer.alloc(IEND.length);
    await fh.read(tail, 0, IEND.length, size - IEND.length);
    return tail.equals(IEND);
  } catch {
    return false;
  } finally {
    await fh?.close();
  }
}
async function waitForSettled(paths, opts) {
  const stableMs = opts.stableMs ?? 250;
  const start = Date.now();
  const deadline = start + opts.timeoutMs;
  const done = /* @__PURE__ */ new Set();
  const state = paths.map(() => ({
    size: -1,
    changedAt: start,
    status: "missing"
  }));
  for (; ; ) {
    await Promise.all(
      paths.map(async (p, i) => {
        if (done.has(i)) return;
        const s = state[i];
        let st = null;
        try {
          st = await fs.stat(p, { bigint: true });
        } catch {
        }
        if (st === null) {
          s.status = "missing";
          s.size = -1;
          return;
        }
        const size = Number(st.size);
        const was = opts.before?.[i];
        if (was?.exists && was.size === size && was.mtimeNs === st.mtimeNs && was.ino === st.ino) {
          s.status = "unchanged";
          s.size = size;
          return;
        }
        if (size !== s.size) {
          s.size = size;
          s.changedAt = Date.now();
        }
        if (size === 0) {
          s.status = "empty";
          return;
        }
        s.status = "writing";
        if (await endsWithIend(p, size) || Date.now() - s.changedAt >= stableMs) done.add(i);
      })
    );
    if (done.size === paths.length || Date.now() > deadline) break;
    await sleep(POLL_MS);
  }
  const settled = [...done].sort((a, b) => a - b);
  const unsettled = [];
  for (const [i, p] of paths.entries()) {
    if (done.has(i)) continue;
    unsettled.push({
      index: i,
      path: p,
      state: state[i].status,
      bytes: Math.max(0, state[i].size)
    });
  }
  return { settled, unsettled, waitedMs: Date.now() - start, timeoutMs: opts.timeoutMs };
}
async function readFileSettled(filePath, timeoutMs = SETTLE_BASE_MS, stableMs = 250) {
  const res = await waitForSettled([filePath], { timeoutMs, stableMs });
  if (res.settled.length === 0) {
    throw new Error(
      `file did not settle within ${timeoutMs}ms (saveFrameToPng writes asynchronously): ${filePath}`
    );
  }
  return fs.readFile(filePath);
}
export {
  SETTLE_BASE_MS,
  SETTLE_MIN_PER_FRAME_MS,
  SETTLE_PER_HD_FRAME_MS,
  readFileSettled,
  settleTimeoutFor,
  stampFiles,
  waitForSettled
};

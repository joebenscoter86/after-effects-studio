// CompItem.saveFrameToPng returns before the PNG hits the disk — the write
// completes asynchronously (measured on AE 26.3: the file appears up to a few
// hundred ms after the ExtendScript call returns, and even File.exists inside
// the same script run reports false). Any consumer that reads the capture
// right after the call must wait for the file to be written completely.
//
// A file counts as finished when it is present, non-empty, different from
// what was at that path before the render (when a stamp was taken), and
// either ends in a PNG IEND chunk (a PNG is complete once its last chunk is
// written: no further wait) or has kept the same size for `stableMs` (the
// fallback for anything else).
//
// With several frames, After Effects queues one asynchronous write per frame
// after the script returns, so the wait is for all of them together, and its
// budget grows with the number of frames and their size (settleTimeoutFor).
// When it runs out, the answer says which frames finished and which did not,
// so a caller can keep the finished ones.
//
// A fixed budget does not follow After Effects' real pace: on a long, heavy
// comp (a 1,305-frame piece with a cut-out, 2026-11-12) the frames past
// about 640 came slower than the budget allowed, every later chunk timed out
// and the captures piled up in After Effects' queue. With `stallMs` the wait
// goes on for as long as captures keep finishing, and ends only when none has
// finished for that long (or the budget runs out before the first does).
import { promises as fs } from "node:fs";
/** The wait for one frame, as before stage 4: hit once live on a keyed 1080×1920 comp. */
export const SETTLE_BASE_MS = 15_000;
/** Extra wait for each further frame of 1080×1920 (scaled by pixel count), and the least per frame. */
export const SETTLE_PER_HD_FRAME_MS = 3_000;
export const SETTLE_MIN_PER_FRAME_MS = 1_000;
const HD_PIXELS = 1080 * 1920;
const POLL_MS = 60;
const IEND = Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * How long to wait for `frames` captures of `pixelsPerFrame` each: 15 s for
 * the first (unchanged for a single frame), then 3 s per further frame of
 * 1080×1920, proportionally more for bigger frames and never less than 1 s.
 */
export function settleTimeoutFor(frames, pixelsPerFrame) {
    const n = Math.max(1, Math.floor(frames));
    const perFrame = Math.max(SETTLE_MIN_PER_FRAME_MS, Math.round((SETTLE_PER_HD_FRAME_MS * Math.max(0, pixelsPerFrame)) / HD_PIXELS));
    return SETTLE_BASE_MS + (n - 1) * perFrame;
}
export async function stampFiles(paths) {
    return Promise.all(paths.map(async (p) => {
        try {
            const st = await fs.stat(p, { bigint: true });
            return { exists: true, size: Number(st.size), mtimeNs: st.mtimeNs, ino: st.ino };
        }
        catch {
            return { exists: false, size: 0, mtimeNs: 0n, ino: 0n };
        }
    }));
}
async function endsWithIend(p, size) {
    if (size < IEND.length)
        return false;
    let fh = null;
    try {
        fh = await fs.open(p, "r");
        const tail = Buffer.alloc(IEND.length);
        await fh.read(tail, 0, IEND.length, size - IEND.length);
        return tail.equals(IEND);
    }
    catch {
        return false;
    }
    finally {
        await fh?.close();
    }
}
/** Wait until every path has finished writing, or the time runs out; never throws. */
export async function waitForSettled(paths, opts) {
    const stableMs = opts.stableMs ?? 250;
    const start = Date.now();
    let deadline = start + opts.timeoutMs;
    const done = new Set();
    const state = paths.map(() => ({
        size: -1,
        changedAt: start,
        status: "missing",
    }));
    for (;;) {
        const before = done.size;
        await Promise.all(paths.map(async (p, i) => {
            if (done.has(i))
                return;
            const s = state[i];
            let st = null;
            try {
                st = await fs.stat(p, { bigint: true });
            }
            catch {
                /* not there yet */
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
            if ((await endsWithIend(p, size)) || Date.now() - s.changedAt >= stableMs)
                done.add(i);
        }));
        if (opts.stallMs !== undefined && done.size > before)
            deadline = Math.max(deadline, Date.now() + opts.stallMs);
        if (done.size === paths.length || Date.now() > deadline)
            break;
        await sleep(POLL_MS);
    }
    const settled = [...done].sort((a, b) => a - b);
    const unsettled = [];
    for (const [i, p] of paths.entries()) {
        if (done.has(i))
            continue;
        unsettled.push({
            index: i,
            path: p,
            state: state[i].status,
            bytes: Math.max(0, state[i].size),
        });
    }
    return {
        settled,
        unsettled,
        waitedMs: Date.now() - start,
        timeoutMs: opts.timeoutMs,
        ...(opts.stallMs !== undefined ? { stallMs: opts.stallMs } : {}),
    };
}
/**
 * Read a file once it has finished writing (see waitForSettled). Throws when
 * `timeoutMs` elapses first.
 */
export async function readFileSettled(filePath, timeoutMs = SETTLE_BASE_MS, stableMs = 250) {
    const res = await waitForSettled([filePath], { timeoutMs, stableMs });
    if (res.settled.length === 0) {
        throw new Error(`file did not settle within ${timeoutMs}ms (saveFrameToPng writes asynchronously): ${filePath}`);
    }
    return fs.readFile(filePath);
}
//# sourceMappingURL=settled-read.js.map
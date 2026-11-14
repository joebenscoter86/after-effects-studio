// ae_check_comp and After Effects' capture queue (first production use,
// 2026-11-12). saveFrameToPng returns before the file is written: After
// Effects queues one write per frame. On a 1,305-frame piece the check's
// fixed settle budget ran out for the frames past about 640, it went on
// asking for more chunks on top of the unfinished ones, returned with about
// 700 captures still queued and deleted the folder After Effects was writing
// into, which raised an error box in After Effects.
//
// The fake here stands in for that queue: the capture script returns at once
// and the files are written afterwards, one after another, at a pace the test
// sets (slower past frame 640), or not at all until the test lets them go.
// Like After Effects it does not create a folder that has gone: a write into
// a deleted folder is recorded as an error. Nothing here reaches After
// Effects.

import { existsSync, promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { encodePngSrgb8 } from "../src/color/png16.js";
import { waitForSettled } from "../src/color/settled-read.js";
import { checkCompTool } from "../src/tools/check-comp.js";
import type { AeTransport, EvalRequest, EvalResult } from "../src/transport/AeTransport.js";

const FPS = 30;
const CW = 216;
const CH = 384;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

interface QueueFake extends AeTransport {
  calls: EvalRequest[];
  captureCalls: () => number;
  /** Writes still queued when each capture script arrived. */
  queuedAtCall: number[];
  pending: () => number;
  writeErrors: string[];
  /** Resolves once every queued write has been made (or failed). */
  idle: () => Promise<void>;
}

function picture(k: number, w: number, h: number): Float64Array {
  const rgb = new Float64Array(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const on = Math.abs(x - ((k * 2) % w)) < 4;
      rgb[i] = on ? 0.8 : 0.3;
      rgb[i + 1] = 0.35 + (0.2 * y) / h;
      rgb[i + 2] = 0.4;
    }
  return rgb;
}

function queueAe(opts: {
  frames: number;
  /** Milliseconds After Effects takes to write frame k, after the previous write. */
  msPerFrame: (k: number) => number;
  /** Frames after this one are held until `release` resolves (After Effects stops writing). */
  holdAfter?: number;
  release?: Promise<void>;
  /** The script throws after asking for this many frames of its chunk (a script that fails part way). */
  failAfter?: number;
}): QueueFake {
  const calls: EvalRequest[] = [];
  const queuedAtCall: number[] = [];
  const writeErrors: string[] = [];
  let pending = 0;
  let chain: Promise<void> = Promise.resolve();
  const ok = (result: unknown): EvalResult => ({
    ok: true,
    result,
    error: null,
    errorCode: null,
    stack: null,
    logs: [],
    durationMs: 0,
  });
  return {
    calls,
    queuedAtCall,
    writeErrors,
    pending: () => pending,
    idle: async () => {
      for (;;) {
        const c = chain;
        await c;
        if (c === chain) return;
      }
    },
    captureCalls: () => calls.filter((c) => c.label === "check_comp_capture").length,
    async execute(req) {
      calls.push(req);
      if (req.label === "check_comp_plan") {
        return ok({
          ok: true,
          compName: "Long",
          compId: 1,
          width: CW,
          height: CH,
          frameDuration: 1 / FPS,
          duration: opts.frames / FPS,
          workAreaStart: 0,
          workAreaDuration: opts.frames / FPS,
          displayStartTime: 0,
          resolutionFactor: [1, 1],
          workingSpace: "None",
          bitsPerChannel: 8,
          missingFootage: [],
        });
      }
      if (req.label === "check_comp_capture") {
        queuedAtCall.push(pending);
        const frames = JSON.parse(/var _frameNums = (.*);/.exec(req.code)![1]) as number[];
        const paths = JSON.parse(/var _paths = (.*);/.exec(req.code)![1]) as string[];
        const factor = JSON.parse(/var _factor = (.*);/.exec(req.code)![1]) as number | null;
        const d = factor ?? 1;
        const w = Math.round(CW / d);
        const h = Math.round(CH / d);
        const asked = opts.failAfter !== undefined ? frames.slice(0, opts.failAfter) : frames;
        const out = [];
        for (const [i, k] of asked.entries()) {
          pending++;
          const file = paths[i];
          chain = chain.then(async () => {
            if (opts.holdAfter !== undefined && k > opts.holdAfter && opts.release)
              await opts.release;
            await sleep(opts.msPerFrame(k));
            try {
              // After Effects writes into the folder it was given; it does not make it again.
              await fs.writeFile(file, encodePngSrgb8(w, h, picture(k, w, h)));
            } catch (err) {
              writeErrors.push(`${path.basename(file)}: ${(err as Error).message}`);
            } finally {
              pending--;
            }
          });
          out.push({
            ok: true,
            frame: k,
            writtenTo: file,
            time: (k + 0.25) / FPS,
            captureKind: "direct",
          });
        }
        if (opts.failAfter !== undefined) {
          return ok({
            ok: false,
            error: "capture failed: the script stopped",
            resolution: { asked: factor, before: [1, 1], set: true, restored: true },
            frames: out,
          });
        }
        return ok({
          ok: true,
          frames: out,
          captureKind: "direct",
          resolution: {
            asked: factor,
            before: [1, 1],
            set: factor !== null && factor !== 1,
            restored: true,
          },
          workingSpace: "None",
          bitsPerChannel: 8,
          projectFile: null,
          bgColor: [0, 0, 0],
        });
      }
      if (req.label === "check_comp_structure") {
        return ok({
          ok: true,
          bounds: { layersChecked: 0, samples: 0, total: 0, findings: [], skipped: [] },
          fonts: { ok: true, count: 0, fonts: [] },
          footage: { ok: true, count: 0, items: [] },
          nestedCompIds: [1],
          expressions: {
            compsWalked: 1,
            propertiesVisited: 0,
            total: 0,
            truncated: false,
            errors: [],
          },
        });
      }
      return { ...ok(null), ok: false, error: `unexpected call ${req.label}` };
    },
  };
}

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-check-queue-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

async function check(args: Record<string, unknown>, ae: QueueFake) {
  const out = await checkCompTool.handler(
    { compNameOrId: "Long", outDir: dir, ...args } as never,
    ae,
  );
  const sc = out.structuredContent as Any;
  expect(out.isError ?? false).toBe(false);
  return sc.result as Any;
}

describe("waitForSettled with a stall limit", () => {
  it("goes on past its budget while files keep finishing, and ends once none has finished for the stall limit", async () => {
    const files = [0, 1, 2, 3, 4, 5].map((i) => path.join(dir, `f${i}.png`));
    const png = encodePngSrgb8(2, 2, new Float64Array(12));
    void (async () => {
      for (const f of files.slice(0, 4)) {
        await sleep(80);
        await fs.writeFile(f, png);
      }
    })();
    const fixed = await waitForSettled(files.slice(0, 4), { timeoutMs: 120 });
    expect(fixed.settled.length).toBeLessThan(4);
    const t0 = Date.now();
    const res = await waitForSettled(files, { timeoutMs: 120, stallMs: 250 });
    // The four that kept coming were waited for; the two that never came ended the wait a stall after the last.
    expect(res.settled).toEqual([0, 1, 2, 3]);
    expect(res.unsettled.map((u) => u.index)).toEqual([4, 5]);
    expect(Date.now() - t0).toBeGreaterThanOrEqual(250);
    expect(res.stallMs).toBe(250);
  });
});

describe("ae_check_comp on a long comp whose captures come slower past frame 640", () => {
  // The budget a chunk gets up front (settleTimeoutMs) is far shorter than a
  // chunk takes past frame 640 (100 frames at 4 ms): only a wait that follows
  // the queue's pace finishes it.
  const slowLate = (k: number) => (k < 640 ? 1 : 4);

  it("checks all 1,305 frames at every fifth frame in one call, never asking for a chunk while one is queued", async () => {
    const ae = queueAe({ frames: 1305, msPerFrame: slowLate });
    const res = await check(
      { every: 5, settleTimeoutMs: 150, stallTimeoutMs: 2000, sheet: false },
      ae,
    );
    expect(res.checked.frames).toBe(261);
    expect(res.captureFailures).toBeUndefined();
    expect(res.next).toBeNull();
    expect(res.coverage).toMatchObject({ framesAsked: 261, framesMeasured: 261, complete: true });
    expect(res.captureQueue.outstanding).toBe(0);
    expect(ae.pending()).toBe(0);
    expect(ae.queuedAtCall.every((n) => n === 0)).toBe(true);
    expect(ae.writeErrors).toEqual([]);
    expect(await fs.readdir(dir).catch(() => [])).toEqual([]);
  });

  it("checks every frame of the 1,305 across calls (next.startFrame), each call complete", async () => {
    const ae = queueAe({ frames: 1305, msPerFrame: slowLate });
    let startFrame: number | undefined;
    let measuredTotal = 0;
    let calls = 0;
    for (;;) {
      const res = await check(
        {
          settleTimeoutMs: 150,
          stallTimeoutMs: 2000,
          sheet: false,
          ...(startFrame !== undefined ? { startFrame } : {}),
        },
        ae,
      );
      calls++;
      expect(res.coverage.complete).toBe(true);
      expect(res.captureQueue.outstanding).toBe(0);
      measuredTotal += res.coverage.framesMeasured;
      if (res.next === null) break;
      startFrame = res.next.startFrame;
      expect(calls).toBeLessThan(10);
    }
    expect(calls).toBe(5);
    expect(measuredTotal).toBe(1305);
    expect(ae.queuedAtCall.every((n) => n === 0)).toBe(true);
    expect(ae.writeErrors).toEqual([]);
  }, 60_000);
});

describe("ae_check_comp when After Effects stops writing captures", () => {
  it("asks for nothing more, keeps the folder After Effects may still write into, and says what was outstanding and where to continue", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const ae = queueAe({ frames: 300, msPerFrame: () => 1, holdAfter: 130, release: gate });
    const res = await check({ settleTimeoutMs: 100, stallTimeoutMs: 300 }, ae);
    // The second chunk (frames 100 to 199) stopped after frame 130; no third chunk and no sheet was asked for.
    expect(ae.captureCalls()).toBe(2);
    expect(res.captureQueue.outstanding).toBe(69);
    expect(res.captureQueue.frames[0]).toBe(131);
    expect(res.captureQueue.reading).toMatch(/kept, not deleted/);
    expect(res.coverage).toMatchObject({ framesAsked: 300, framesMeasured: 131, complete: false });
    expect(res.next).toMatchObject({ startFrame: 131 });
    expect(res.notes.join(" ")).toMatch(/After Effects stopped writing captures: 69/);
    expect(res.structure.checked).toBe(false);
    const folder: string = res.captureQueue.folder;
    expect(existsSync(folder)).toBe(true);
    // After Effects writes the rest later, into the folder that is still there.
    release();
    await ae.idle();
    expect(ae.writeErrors).toEqual([]);
    expect((await fs.readdir(folder)).length).toBe(69);
  });

  it("waits for the frames a failed script had already queued before it returns, then deletes the folder", async () => {
    const ae = queueAe({ frames: 60, msPerFrame: () => 20, failAfter: 10 });
    const res = await check({ settleTimeoutMs: 50, stallTimeoutMs: 1000 }, ae);
    expect(ae.pending()).toBe(0);
    expect(res.captureError.error).toMatch(/the script stopped/);
    expect(res.captureQueue.outstanding).toBe(0);
    expect(res.coverage.complete).toBe(false);
    expect(res.next).toMatchObject({ startFrame: 0 });
    await ae.idle();
    expect(ae.writeErrors).toEqual([]);
    expect(await fs.readdir(dir).catch(() => [])).toEqual([]);
  });
});

// The wait for saveFrameToPng's asynchronous writes (agent-eyes plan, stage
// 4). The budget scales with the number of frames and their size; a complete
// PNG (its IEND chunk written) counts as finished at once; a file left over
// from before the render does not count; and when the wait gives up it says
// which frames finished, so the caller can keep them. Through the tool with an
// in-process fake transport: nothing here can reach After Effects.

import { promises as fs, readFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  SETTLE_BASE_MS,
  readFileSettled,
  settleTimeoutFor,
  stampFiles,
  waitForSettled,
} from "../src/color/settled-read.js";
import { renderFrameTool } from "../src/tools/render-frame.js";
import type { AeTransport, EvalRequest, EvalResult } from "../src/transport/AeTransport.js";

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "png");
const PNG = readFileSync(path.join(FIXTURES, "motion-smooth-0.png"));
const HD = 1080 * 1920;

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-settle-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe("settleTimeoutFor", () => {
  it("keeps 15 s for one frame, whatever its size", () => {
    expect(SETTLE_BASE_MS).toBe(15_000);
    expect(settleTimeoutFor(1, HD)).toBe(15_000);
    expect(settleTimeoutFor(1, 64 * 48)).toBe(15_000);
  });

  it("adds time for every further frame, more for bigger frames", () => {
    expect(settleTimeoutFor(9, HD)).toBe(15_000 + 8 * 3_000);
    expect(settleTimeoutFor(9, 4 * HD)).toBe(15_000 + 8 * 12_000);
    // Small frames still get a second each.
    expect(settleTimeoutFor(32, 64 * 48)).toBe(15_000 + 31 * 1_000);
  });
});

describe("waitForSettled", () => {
  it("takes a complete PNG at once, without waiting for its size to hold still", async () => {
    const p = path.join(dir, "a.png");
    await fs.writeFile(p, PNG);
    const start = Date.now();
    const res = await waitForSettled([p], { timeoutMs: 5_000, stableMs: 3_000 });
    expect(res.settled).toEqual([0]);
    expect(Date.now() - start).toBeLessThan(1_000);
  });

  it("waits while a PNG is still being written", async () => {
    const p = path.join(dir, "a.png");
    await fs.writeFile(p, PNG.subarray(0, 100));
    setTimeout(() => void fs.writeFile(p, PNG), 200);
    const res = await waitForSettled([p], { timeoutMs: 3_000, stableMs: 2_000 });
    expect(res.settled).toEqual([0]);
    expect(res.waitedMs).toBeGreaterThanOrEqual(150);
    expect(res.waitedMs).toBeLessThan(1_500);
  });

  it("falls back to a size that holds still for files that are not PNG", async () => {
    const p = path.join(dir, "a.bin");
    await fs.writeFile(p, "not a png");
    const res = await waitForSettled([p], { timeoutMs: 2_000, stableMs: 200 });
    expect(res.settled).toEqual([0]);
  });

  it("does not take a file left over from before the render", async () => {
    const p = path.join(dir, "old.png");
    await fs.writeFile(p, PNG);
    const before = await stampFiles([p]);
    const res = await waitForSettled([p], { timeoutMs: 300, before });
    expect(res.settled).toEqual([]);
    expect(res.unsettled).toEqual([
      expect.objectContaining({ index: 0, path: p, state: "unchanged" }),
    ]);
  });

  it("takes a left-over file once it is written again", async () => {
    const p = path.join(dir, "old.png");
    await fs.writeFile(p, PNG);
    const before = await stampFiles([p]);
    setTimeout(() => void fs.writeFile(p, PNG), 100);
    const res = await waitForSettled([p], { timeoutMs: 2_000, before });
    expect(res.settled).toEqual([0]);
  });

  it("reports which frames finished and which did not", async () => {
    const paths = ["a.png", "b.png", "c.png", "d.png"].map((n) => path.join(dir, n));
    await fs.writeFile(paths[0], PNG);
    await fs.writeFile(paths[2], PNG);
    await fs.writeFile(paths[3], PNG.subarray(0, 50));
    const res = await waitForSettled(paths, { timeoutMs: 300, stableMs: 5_000 });
    expect(res.settled).toEqual([0, 2]);
    expect(res.unsettled).toEqual([
      expect.objectContaining({ index: 1, state: "missing", bytes: 0 }),
      expect.objectContaining({ index: 3, state: "writing", bytes: 50 }),
    ]);
    expect(res.timeoutMs).toBe(300);
  });
});

describe("readFileSettled", () => {
  it("still reads one file, and still throws when it never settles", async () => {
    const p = path.join(dir, "a.png");
    await fs.writeFile(p, PNG);
    expect((await readFileSettled(p)).equals(PNG)).toBe(true);
    await expect(readFileSettled(path.join(dir, "never.png"), 200)).rejects.toThrow(
      /did not settle within 200ms/,
    );
  });
});

// ---------------------------------------------------------------------------
// Through the tool
// ---------------------------------------------------------------------------

/** Fake AE that writes only the frames in `write` (the others never appear), `delayMs` after it returns. */
function fakeAe(write: number[], delayMs = 0): AeTransport & { calls: EvalRequest[] } {
  const calls: EvalRequest[] = [];
  return {
    calls,
    async execute(req: EvalRequest): Promise<EvalResult> {
      calls.push(req);
      const paths = JSON.parse(/var _paths = (.*);/.exec(req.code)![1]) as string[];
      const times = JSON.parse(/var _times = (.*);/.exec(req.code)![1]) as number[];
      const writeAll = async () => {
        for (const i of write) {
          await fs.mkdir(path.dirname(paths[i]), { recursive: true });
          await fs.writeFile(paths[i], PNG);
        }
      };
      if (delayMs > 0) setTimeout(() => void writeAll(), delayMs);
      else await writeAll();
      return {
        ok: true,
        result: {
          ok: true,
          frames: paths.map((p, i) => ({
            ok: true,
            writtenTo: p,
            time: times[i],
            size: [64, 48],
            captureKind: "direct",
          })),
          captureKind: "direct",
          compName: "Main",
          workingSpace: "None",
          bitsPerChannel: 16,
          projectFile: null,
          bgColor: [0, 0, 0],
        },
        error: null,
        errorCode: null,
        stack: null,
        logs: [],
        durationMs: 0,
      };
    },
  };
}

async function render(args: Record<string, unknown>, transport: AeTransport) {
  const out = await renderFrameTool.handler(
    { compNameOrId: "Main", outPath: path.join(dir, "f.png"), ...args } as never,
    transport,
  );
  const sc = out.structuredContent as Record<string, any>;
  return out.isError ? sc : (sc.result as Record<string, any>);
}

describe("ae_render_frame waits for every capture, and keeps the finished ones", () => {
  it("waits for captures written after the script returned", async () => {
    const res = await render({ times: [0, 0.04, 0.08], analyze: true }, fakeAe([0, 1, 2], 150));
    expect(res.captureWarning).toBeUndefined();
    expect(res.captureSettle.settled).toEqual([0, 1, 2]);
    expect(res.captureSettle.unsettled).toEqual([]);
    for (const f of res.frames) expect(f.analysis).toBeDefined();
  });

  it("scales the default wait with the frames and their size", async () => {
    const res = await render({ times: [0, 0.04, 0.08] }, fakeAe([0, 1, 2]));
    expect(res.captureSettle.timeoutMs).toBe(settleTimeoutFor(3, 64 * 48));
  });

  it("names the frames that did not finish and still measures the others", async () => {
    const res = await render(
      { times: [0, 0.04, 0.08], analyze: true, diff: true, contactSheet: {}, settleTimeoutMs: 300 },
      fakeAe([0, 2]),
    );
    expect(res.ok).toBe(true);
    expect(res.captureSettle.settled).toEqual([0, 2]);
    expect(res.captureSettle.unsettled).toEqual([
      expect.objectContaining({ index: 1, state: "missing" }),
    ]);
    expect(res.captureWarning).toMatch(/1 of 3/);
    expect(res.frames[1].ok).toBe(false);
    expect(res.frames[1].error).toMatch(/did not finish writing/);
    expect(res.frames[0].analysis).toBeDefined();
    expect(res.frames[2].analysis).toBeDefined();
    expect(res.diff.pairs).toEqual([]);
    expect(res.diffWarning).toMatch(/missing/);
    expect(res.contactSheet.frames).toBe(2);
  });

  it("does not take a file left at the frame's path by an earlier render", async () => {
    // A batch's files carry a call id now, so a file of an earlier render is never at this call's path.
    await fs.writeFile(path.join(dir, "f_1.png"), PNG);
    const res = await render({ times: [0, 0.04, 0.08], settleTimeoutMs: 300 }, fakeAe([0, 2]));
    expect(res.captureSettle.unsettled).toEqual([
      expect.objectContaining({ index: 1, state: "missing" }),
    ]);
    // A single frame keeps the path it was given, and a file left there is still not taken.
    const single = path.join(dir, "one.png");
    await fs.writeFile(single, PNG);
    const one = await renderFrameTool.handler(
      { compNameOrId: "Main", outPath: single, time: 0, settleTimeoutMs: 300 } as never,
      fakeAe([]),
    );
    expect((one.structuredContent as any).result.captureSettle.unsettled).toEqual([
      expect.objectContaining({ index: 0, state: "unchanged" }),
    ]);
  });

  it("refuses a settle timeout that is not a positive number", async () => {
    const transport = fakeAe([0]);
    const res = await render({ time: 0, settleTimeoutMs: 0 }, transport);
    expect(res.error.code).toBe("INVALID_ARGS");
    expect(transport.calls).toHaveLength(0);
  });

  it("a single frame that never appears keeps the old answer: the raw result and a warning", async () => {
    const res = await render({ time: 0, settleTimeoutMs: 200 }, fakeAe([]));
    expect(res.captureWarning).toMatch(/did not finish writing/);
    expect(res.captureSettle.unsettled).toHaveLength(1);
  });

  it("a single complete frame is read without the old quarter-second wait", async () => {
    const start = Date.now();
    await render({ time: 0 }, fakeAe([0]));
    expect(Date.now() - start).toBeLessThan(240);
  });
});

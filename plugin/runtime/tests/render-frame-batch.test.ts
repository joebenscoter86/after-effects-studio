// ae_render_frame batches across calls (first production use, 2026-11-12).
// Batch files used to be named <stem>_<index>, the same every call. Since
// saveFrameToPng writes after the script returns, a write still pending from
// an earlier call could land at the same name after this call's stamp and be
// taken for this call's frame, mixing frames between calls. Batch files now
// carry a call id, and `batch.files` says which frame each file holds.
//
// The fake transport writes the asked-for files itself, now or later.
// Nothing here reaches After Effects.

import { promises as fs, readFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { framePaths, renderFrameTool } from "../src/tools/render-frame.js";
import type { AeTransport, EvalRequest, EvalResult } from "../src/transport/AeTransport.js";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const PNG = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "png", "motion-smooth-0.png"),
);
const FPS = 30;
/** Times a quarter of a frame inside each frame. */
const at = (frames: number[]) => frames.map((k) => (k + 0.25) / FPS);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-batch-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

/** A fake that writes the files at `write` (indices) after `delayMs`, and remembers every path it was asked for. */
function fakeAe(
  plan: (call: number) => { write: number[]; delayMs: number },
): AeTransport & { asked: string[][]; pending: Promise<void>[] } {
  const asked: string[][] = [];
  const pending: Promise<void>[] = [];
  return {
    asked,
    pending,
    async execute(req: EvalRequest): Promise<EvalResult> {
      const paths = JSON.parse(/var _paths = (.*);/.exec(req.code)![1]) as string[];
      const times = JSON.parse(/var _times = (.*);/.exec(req.code)![1]) as number[];
      const call = asked.length;
      asked.push(paths);
      const { write, delayMs } = plan(call);
      pending.push(
        (async () => {
          await sleep(delayMs);
          for (const i of write) await fs.writeFile(paths[i], PNG);
        })(),
      );
      return {
        ok: true,
        result: {
          ok: true,
          frames: paths.map((p, i) => ({
            ok: true,
            writtenTo: p,
            time: times[i],
            frame: Math.floor(times[i] * FPS + 1e-6),
            frameOffset: 0,
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
  return (out.structuredContent as Any).result as Any;
}

describe("ae_render_frame batch files are unique per call", () => {
  it("names a batch's files <stem>_<call id>_<index>, a new id every call; a single frame keeps its path", () => {
    const a = framePaths("/x/f.png", 3, true);
    const b = framePaths("/x/f.png", 3, true);
    expect(a[0]).toMatch(/^\/x\/f_[0-9a-f]{8}_0\.png$/);
    expect(a[2]).toMatch(/_2\.png$/);
    expect(a[0]).not.toBe(b[0]);
    expect(framePaths("/x/f.png", 1, false)).toEqual(["/x/f.png"]);
  });

  it("never takes a late write from an earlier call for this call's frame", async () => {
    // Call 0 gives up before its files arrive; they land during call 1's wait. Call 1 gets only its frame 0.
    let releaseLate!: () => void;
    const late = new Promise<void>((r) => (releaseLate = r));
    const ae = fakeAe((call) =>
      call === 0 ? { write: [], delayMs: 0 } : { write: [0], delayMs: 0 },
    );
    const first = await render({ times: at([10, 11, 12]), settleTimeoutMs: 150 }, ae);
    expect(first.captureSettle.settled).toEqual([]);
    // Call 0's files now arrive, at its own names, while call 1 waits.
    const lateWrites = (async () => {
      await late;
      for (const p of ae.asked[0]) await fs.writeFile(p, PNG);
    })();
    setTimeout(releaseLate, 50);
    const second = await render({ times: at([20, 21, 22]), settleTimeoutMs: 400 }, ae);
    await lateWrites;
    expect(second.captureSettle.settled).toEqual([0]);
    expect(second.captureSettle.unsettled.map((u: Any) => u.index)).toEqual([1, 2]);
    expect(ae.asked[1].some((p) => ae.asked[0].includes(p))).toBe(false);
    expect(second.batch.files.map((f: Any) => [f.frame, f.ok])).toEqual([
      [20, true],
      [21, false],
      [22, false],
    ]);
  });

  it("reports which frame each file holds", async () => {
    const ae = fakeAe(() => ({ write: [0, 1, 2], delayMs: 0 }));
    const res = await render({ times: at([5, 9, 30]) }, ae);
    expect(res.batch.id).toMatch(/^[0-9a-f]{8}$/);
    expect(res.batch.files).toEqual(
      ae.asked[0].map((p, i) => ({
        index: i,
        path: p,
        frame: [5, 9, 30][i],
        time: expect.any(Number),
        ok: true,
      })),
    );
    for (const f of res.batch.files) expect(f.path).toContain(`_${res.batch.id}_${f.index}.png`);
    const one = await render(
      { time: 0 },
      fakeAe(() => ({ write: [0], delayMs: 0 })),
    );
    expect(one.batch).toBeUndefined();
  });
});

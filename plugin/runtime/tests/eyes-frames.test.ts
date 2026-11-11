// Frame addressing (agent-eyes stage 4 follow-up). Found live: a time a hair
// below a frame boundary renders the previous frame (43/30 rounded to 1.4333
// rendered frame 42), so a series of rounded times repeated every third
// frame. `frames: [..]` addresses frames by number; for `time` / `times` the
// JSX reports the frame each time resolves to, and Node warns when two times
// land on one frame or a time sits just below a boundary. Times are never
// moved. Nothing here can reach After Effects: the JSX runs against a mock
// comp, the handler against an in-process fake transport.

import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FRAME_PICK, NEAR_FRAME_BOUNDARY, frameWarnings } from "../src/tools/render-frame.js";
import { renderFrameTool } from "../src/tools/render-frame.js";
import type { AeTransport, EvalRequest, EvalResult } from "../src/transport/AeTransport.js";

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "png");
const FPS = 30;

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-frames-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

/** The generated JSX for these args (the fake records it and answers nothing useful). */
async function jsxFor(args: Record<string, unknown>): Promise<string> {
  let code = "";
  const transport: AeTransport = {
    async execute(req: EvalRequest): Promise<EvalResult> {
      code = req.code;
      return {
        ok: true,
        result: { ok: false, error: "recorded only" },
        error: null,
        errorCode: null,
        stack: null,
        logs: [],
        durationMs: 0,
      };
    },
  };
  await renderFrameTool.handler(
    { compNameOrId: "Main", outPath: path.join(dir, "f.png"), ...args } as never,
    transport,
  );
  return code;
}

/** Run the JSX against a mock comp; returns its answer and the times saveFrameToPng got. */
function runJsx(code: string, comp: { frameDuration: number; duration: number }) {
  const rendered: number[] = [];
  const mock = {
    id: 1,
    name: "Main",
    numLayers: 0,
    displayStartTime: 0,
    width: 64,
    height: 48,
    bgColor: [0, 0, 0],
    ...comp,
    layer: () => null,
    saveFrameToPng: (time: number) => rendered.push(time),
  };
  const AE = {
    findCompByNameOrId: () => mock,
    safeGet: (fn: () => unknown, fallback: unknown) => {
      try {
        return fn();
      } catch {
        return fallback;
      }
    },
    ensureParentDir: (p: string) => ({ fsName: p }),
    errText: (e: unknown) => String(e),
  };
  const app = { project: { workingSpace: "None", bitsPerChannel: 8, file: null } };
  const out = new Function("app", "AE", "CompItem", "FootageItem", code)(
    app,
    AE,
    class {},
    class {},
  ) as Record<string, any>;
  return { out, rendered };
}

const COMP30 = { frameDuration: 1 / 30, duration: 10 };

describe("frames: [..] in After Effects", () => {
  it("renders each frame a quarter of a frame inside it, and reports the frame", async () => {
    expect(FRAME_PICK).toBe(0.25);
    const { out, rendered } = runJsx(await jsxFor({ frames: [0, 42, 43] }), COMP30);
    expect(rendered.map((t) => t * FPS)).toEqual(
      [0.25, 42.25, 43.25].map((v) => expect.closeTo(v, 9)),
    );
    expect(out.frames.map((f: { frame: number }) => f.frame)).toEqual([0, 42, 43]);
    expect(out.frames[1].frameOffset).toBeCloseTo(0.25, 6);
  });

  it("refuses a frame past the comp's last, before rendering anything", async () => {
    const { out, rendered } = runJsx(await jsxFor({ frames: [10, 300] }), COMP30);
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/frame 300 is past the comp's last frame, 299/);
    expect(rendered).toEqual([]);
  });

  it("sends the numbers, not times", async () => {
    const code = await jsxFor({ frames: [5, 6] });
    expect(code).toContain("var _times = null;");
    expect(JSON.parse(/var _frameNums = (.*);/.exec(code)![1])).toEqual([5, 6]);
  });
});

describe("time and times report the frame they resolve to", () => {
  it("names the frame and where in it each time falls, without moving the time", async () => {
    const { out, rendered } = runJsx(await jsxFor({ times: [1.4333, 43 / 30, 1.45] }), COMP30);
    expect(rendered).toEqual([1.4333, 43 / 30, 1.45]);
    expect(out.frames.map((f: { frame: number }) => f.frame)).toEqual([42, 43, 43]);
    expect(out.frames[0].frameOffset).toBeCloseTo(0.999, 3);
    // 43/30 in floating point is a hair from 43: treated as on the boundary.
    expect(out.frames[1].frameOffset).toBe(0);
    expect(out.frames[2].frameOffset).toBeCloseTo(0.5, 6);
  });

  it("strip frames are reported by number too, rendered a quarter inside", async () => {
    const { out, rendered } = runJsx(await jsxFor({ strip: { at: 1.4333, frames: 3 } }), COMP30);
    expect(out.frames.map((f: { frame: number }) => f.frame)).toEqual([42, 43, 44]);
    expect(rendered.map((t) => t * FPS)).toEqual(
      [42.25, 43.25, 44.25].map((v) => expect.closeTo(v, 9)),
    );
  });
});

describe("frameWarnings", () => {
  it("has a named near-boundary threshold", () => {
    expect(NEAR_FRAME_BOUNDARY).toBe(0.02);
  });

  it("warns when a time sits just below a frame boundary", () => {
    const w = frameWarnings([{ time: 1.4333, frame: 42, frameOffset: 0.999 }]);
    expect(w).toMatch(/#0/);
    expect(w).toMatch(/frame 42/);
    expect(w).toMatch(/0\.1% of a frame below frame 43/);
    expect(w).toMatch(/frames: \[/);
  });

  it("warns when two requested times land on the same frame", () => {
    const w = frameWarnings([
      { time: 1.4, frame: 42, frameOffset: 0 },
      { time: 1.41, frame: 42, frameOffset: 0.3 },
      { time: 1.5, frame: 45, frameOffset: 0 },
    ]);
    expect(w).toMatch(/#0 and #1 both render frame 42/);
  });

  it("says nothing for times on or well inside frames", () => {
    expect(
      frameWarnings([
        { time: 0, frame: 0, frameOffset: 0 },
        { time: 0.0417, frame: 1, frameOffset: 0.25 },
        { time: 0.0833, frame: 2, frameOffset: 0.5 },
        { time: 0.1, frame: 3, frameOffset: 0.97 },
      ]),
    ).toBeUndefined();
  });

  it("takes a caller threshold", () => {
    expect(frameWarnings([{ time: 0.1, frame: 3, frameOffset: 0.97 }], 0.05)).toMatch(
      /3\.0% of a frame/,
    );
  });

  it("ignores frames without a reported number (older answers)", () => {
    expect(frameWarnings([{ time: 1 }, { time: 2 }])).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Through the handler
// ---------------------------------------------------------------------------

/** Fake AE that answers like the JSX: frame and frameOffset per frame (30 fps). */
function fakeAe(): AeTransport & { calls: EvalRequest[] } {
  const calls: EvalRequest[] = [];
  return {
    calls,
    async execute(req: EvalRequest): Promise<EvalResult> {
      calls.push(req);
      const paths = JSON.parse(/var _paths = (.*);/.exec(req.code)![1]) as string[];
      let times = JSON.parse(/var _times = (.*);/.exec(req.code)![1]) as number[] | null;
      const nums = JSON.parse(/var _frameNums = (.*);/.exec(req.code)![1]) as number[] | null;
      if (times === null && nums !== null) times = nums.map((k) => (k + 0.25) / FPS);
      const frames = [];
      for (const [i, p] of paths.entries()) {
        await fs.mkdir(path.dirname(p), { recursive: true });
        await fs.copyFile(path.join(FIXTURES, `motion-smooth-${i % 8}.png`), p);
        const pos = times![i] * FPS;
        const frame = Math.floor(pos + 1e-6);
        frames.push({
          ok: true,
          writtenTo: p,
          time: times![i],
          frame,
          frameOffset: Math.max(0, pos - frame),
          size: [64, 48],
          captureKind: "direct",
        });
      }
      return {
        ok: true,
        result: {
          ok: true,
          frames,
          captureKind: "direct",
          compName: "Main",
          workingSpace: "None",
          bitsPerChannel: 16,
          projectFile: null,
          bgColor: [0.3, 0.3, 0.35],
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

async function render(args: Record<string, unknown>) {
  const transport = fakeAe();
  const out = await renderFrameTool.handler(
    { compNameOrId: "Main", outPath: path.join(dir, "f.png"), ...args } as never,
    transport,
  );
  const sc = out.structuredContent as Record<string, any>;
  return {
    res: out.isError ? sc : (sc.result as Record<string, any>),
    isError: out.isError,
    transport,
  };
}

describe("ae_render_frame frame reporting", () => {
  it("warns about rounded times that repeat a frame, and leaves the times as asked", async () => {
    const { res } = await render({ times: [1.4, 1.4333, 1.4667, 1.5], diff: true });
    expect(res.frames.map((f: { frame: number }) => f.frame)).toEqual([42, 42, 44, 45]);
    expect(res.frames[1].time).toBe(1.4333);
    expect(res.frameWarning).toMatch(/#0 and #1 both render frame 42/);
    expect(res.frameWarning).toMatch(/below frame 43/);
  });

  it("reports the frame of a single time at the top level", async () => {
    const { res } = await render({ time: 1.4333 });
    expect(res.frame).toBe(42);
    expect(res.frameWarning).toMatch(/below frame 43/);
  });

  it("renders frames by number through the times path, with diff", async () => {
    const { res } = await render({ frames: [40, 41, 42, 43], diff: true });
    expect(res.frames.map((f: { frame: number }) => f.frame)).toEqual([40, 41, 42, 43]);
    expect(res.frameWarning).toBeUndefined();
    expect(res.diff.pairs).toHaveLength(3);
  });

  for (const [what, args] of [
    ["frames with time", { frames: [1], time: 0 }],
    ["frames with times", { frames: [1], times: [0] }],
    ["frames with strip", { frames: [1], strip: { at: 0, frames: 3 } }],
    ["a fractional frame", { frames: [1.5] }],
    ["a negative frame", { frames: [-1] }],
    ["no frames", { frames: [] }],
    ["more than 32 frames", { frames: Array.from({ length: 33 }, (_, i) => i) }],
  ] as const) {
    it(`refuses ${what} before After Effects is contacted`, async () => {
      const { res, isError, transport } = await render(args as Record<string, unknown>);
      expect(isError).toBe(true);
      expect(res.error.code).toBe("INVALID_ARGS");
      expect(transport.calls).toHaveLength(0);
    });
  }
});

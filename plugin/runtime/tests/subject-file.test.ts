// Offline tests for stage 12c, "render the cut-out once, check the file, build
// on the file": subject.render_cutout (the render queue, faked), subject.
// check_file (frame reading, faked) and subject.use_cutout (the comp, faked).
// Nothing here reaches After Effects.

import { promises as fs, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { decodePng, encodePngSrgbRgba8 } from "../src/color/png16.js";
import {
  CHECK_FILE_JUMP_LIMIT,
  RENDER_MARGIN_BYTES,
  aeCacheRoot,
  cacheBytesFor,
  checkFileFrames,
  diskReport,
  renderCutoutBytes,
  renderCutoutJsx,
  renderCutoutPlanJsx,
  runCheckFile,
  runRenderCutout,
  useCutoutJsx,
  type FileIO,
} from "../src/operations/keying.js";
import {
  SEEN_THROUGH_DEFAULTS,
  SPECK_DEFAULTS,
  seenThroughInside,
  speckPieces,
} from "../src/color/matte.js";
import { getOp } from "../src/registry.js";
import "../src/operations/index.js";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const HELPERS_SRC = readFileSync(
  fileURLToPath(new URL("../jsx/helpers.jsx", import.meta.url)),
  "utf8",
);
const PT = { PROPERTY: 6212, INDEXED_GROUP: 6213, NAMED_GROUP: 6214 };
const PVT = { NO_VALUE: 6412, OneD: 6417, TwoD: 6416, ThreeD: 6414, COLOR: 6418 };
function loadAE(): Any {
  return new Function("PropertyValueType", "PropertyType", `${HELPERS_SRC}\n;return AE;`)(PVT, PT);
}

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-cutout-file-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe("registration", () => {
  it("registers render_cutout and check_file as Node operations and use_cutout as JSX", () => {
    for (const n of ["subject.render_cutout", "subject.check_file"]) {
      expect(getOp(n)!.run).toBeTypeOf("function");
      expect(getOp(n)!.readOnly).toBeFalsy();
    }
    expect(getOp("subject.use_cutout")!.run).toBeUndefined();
    expect(getOp("subject.render_cutout")!.description).toMatch(/undo and rollback are refused/);
  });
});

// ------------------------------------------------------- render_cutout

const PLAN = {
  ok: true,
  layer: "raw_nogreen.mp4",
  fillLayer: "raw_nogreen.mp4 gap fill",
  keep: ["raw_nogreen.mp4", "raw_nogreen.mp4 gap fill"],
  span: { start: 0, duration: 10.6667, frames: 320, frameRate: 30 },
  compSize: [1080, 1920],
  sourceSize: [2176, 3840],
  aeCache: { folder: null, version: "27.0x52" },
  templates: {
    output: [
      "High Quality",
      "High Quality with Alpha",
      "Lossless with Alpha",
      "TIFF Sequence with Alpha",
    ],
    render: ["Best Settings"],
  },
};

function renderIO(plan: Any = PLAN): FileIO & { calls: Any[] } {
  const calls: Any[] = [];
  return {
    calls,
    execute: async (code: string, opts: Any) => {
      calls.push({ code, ...opts });
      if (/plan/.test(opts.label)) return plan;
      return {
        ok: true,
        outputPath: path.join(dir, "cut.mov"),
        frameCount: 320,
        frameRate: 30,
        timeSpanStart: 0,
        durationSeconds: 10.6667,
        renderSeconds: 390,
        bytes: 123456789,
        layersSwitched: ["BG"],
        restored: true,
        audio: { "Output Audio": "Off" },
        warnings: [],
      };
    },
    render: async () => ({ ok: false, error: "not used" }),
    readImage: async () => {
      throw new Error("not used");
    },
    freeBytes: async () => 500e9,
  };
}

describe("subject.render_cutout with the gap fill switched off", () => {
  it("refuses before rendering, in plain words, when the fill layer exists and is off", async () => {
    const io = renderIO({ ...PLAN, fillEnabled: false });
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "cut.mov") },
      io,
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/'raw_nogreen\.mp4 gap fill' is switched off/);
    expect(res.error).toMatch(/gaps open/);
    expect(res.error).toMatch(/withoutFill: true/);
    expect(io.calls).toHaveLength(1);
  });

  it("renders with withoutFill: true and says in the result that the gaps are open", async () => {
    const io = renderIO({ ...PLAN, fillEnabled: false });
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "cut.mov"), withoutFill: true },
      io,
    );
    expect(res.ok).toBe(true);
    expect(res.fillWarning).toMatch(/switched off/);
    expect(res.fillWarning).toMatch(/gaps open/);
    expect(res.next).toMatch(/gaps open/);
  });

  it("says nothing when the fill is on, and the plan reads the fill's switch", async () => {
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "cut.mov") },
      renderIO({ ...PLAN, fillEnabled: true }),
    );
    expect(res.ok).toBe(true);
    expect(res.fillWarning).toBeUndefined();
    expect(renderCutoutPlanJsx({ comp: "Main", layer: 1 })).toContain("fillEnabled");
  });
});

describe("subject.render_cutout on a softened edge", () => {
  it("counts the disk cache of both matte passes, and keeps the soft-edge layer the plan names", async () => {
    const io = renderIO({
      ...PLAN,
      keep: ["raw_nogreen.mp4 soft edge", "raw_nogreen.mp4 gap fill"],
      matteCopies: 2,
    });
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "cut.mov") },
      io,
    );
    expect(res.space.parts.cache).toBe(2 * cacheBytesFor(320, [2176, 3840]));
    expect(res.layers).toEqual(["raw_nogreen.mp4 soft edge", "raw_nogreen.mp4 gap fill"]);
    expect(res.space.cacheNote ?? res.cacheNote ?? "").toMatch(/two/);
  });

  it("plans to keep the soft-edge layer in place of the matted one", () => {
    const j = renderCutoutPlanJsx({ comp: "Main", layer: 1 });
    expect(j).toContain('" soft edge"');
    expect(j).toContain("matteCopies");
  });
});

describe("subject.render_cutout", () => {
  it("renders the layer with its gap fill through a template that carries alpha, with time to finish", async () => {
    const io = renderIO();
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "cut.mov") },
      io,
    );
    expect(res.ok).toBe(true);
    const r = io.calls[1];
    expect(r.label).toBe("subject.render_cutout");
    expect(r.code).toContain('"High Quality with Alpha"');
    expect(r.code).toContain('"raw_nogreen.mp4 gap fill"');
    expect(r.timeoutMs).toBeGreaterThanOrEqual(120_000 + 320 * 5_000);
    expect(res).toMatchObject({
      outputPath: path.join(dir, "cut.mov"),
      frameCount: 320,
      renderSeconds: 390,
      outputTemplate: "High Quality with Alpha",
    });
    expect(res.templateChoice).toMatch(/carries alpha/);
    expect(res.sound).toMatch(/original layer keeps the sound/);
    expect(res.next).toMatch(/subject\.check_file/);
  });

  it("takes a named template only when it exists", async () => {
    const io = renderIO();
    const ok = await runRenderCutout(
      {
        comp: "Main",
        layer: 1,
        outputPath: path.join(dir, "c.mov"),
        outputTemplate: "Lossless with Alpha",
      },
      io,
    );
    expect(ok.outputTemplate).toBe("Lossless with Alpha");
    const bad = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "c.mov"), outputTemplate: "Nope" },
      renderIO(),
    );
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/no output template named 'Nope'.*High Quality with Alpha/);
  });

  it("refuses plainly when no movie template carries alpha", async () => {
    const io = renderIO({
      ...PLAN,
      templates: { output: ["High Quality", "TIFF Sequence with Alpha"], render: [] },
    });
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "c.mov") },
      io,
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/no output template that writes a movie with alpha/);
    expect(res.error).toMatch(/TIFF Sequence with Alpha/);
    expect(io.calls).toHaveLength(1);
  });

  it("refuses a path that is not absolute", async () => {
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: "cut.mov" },
      renderIO(),
    );
    expect(res.error).toMatch(/absolute/);
  });
});

// The render's JSX against a fake comp and render queue.
function queueWorld({ throwOnRender = false, existing = false } = {}) {
  const log: string[] = [];
  const mk = (name: string, enabled = true, extra: Any = {}) => ({
    name,
    enabled,
    hasVideo: true,
    matchName: "ADBE AV Layer",
    ...extra,
  });
  const layers = [
    mk("Title"),
    mk("raw_nogreen.mp4"),
    mk("raw_nogreen.mp4 gap mask", false),
    mk("raw_nogreen.mp4 gap fill"),
    mk("Camera", true, { matchName: "ADBE Camera Layer" }),
    mk("BG"),
  ];
  const comp: Any = {
    name: "Main",
    frameDuration: 1 / 30,
    get numLayers() {
      return layers.length;
    },
    layer: (i: number) => layers[i - 1],
  };
  const files: Record<string, Any> = existing
    ? { "/out/cut.mov": { length: 5, modified: new Date(1) } }
    : {};
  const items: Any[] = [{ render: true }];
  const rq: Any = {
    rendering: false,
    get numItems() {
      return items.length;
    },
    item: (i: number) => items[i - 1],
    items: {
      add(c: Any) {
        const om: Any = {
          templates: ["High Quality with Alpha"],
          applyTemplate(t: string) {
            log.push(`template:${t}`);
          },
          getSettings: () => ({ "Output Audio": "Off", Channels: "RGB + Alpha" }),
          set file(f: Any) {
            om._file = f;
          },
          get file() {
            return om._file;
          },
        };
        const it: Any = {
          comp: c,
          status: 0,
          outputModule: () => om,
          remove() {
            items.splice(items.indexOf(it), 1);
            log.push("removed");
          },
          elapsedSeconds: 390,
        };
        items.push(it);
        return it;
      },
    },
    render() {
      log.push(
        `render:${layers
          .filter((l) => l.enabled)
          .map((l) => l.name)
          .join("|")}`,
      );
      if (throwOnRender) throw new Error("disk full");
      items[items.length - 1].status = 3;
      files[items[items.length - 1].outputModule().file.fsName] = {
        length: 999,
        modified: new Date(2),
      };
    },
  };
  function File(this: Any, p: string) {
    this.fsName = p;
    Object.defineProperty(this, "exists", { get: () => !!files[p] });
    Object.defineProperty(this, "length", { get: () => files[p]?.length ?? 0 });
    Object.defineProperty(this, "modified", { get: () => files[p]?.modified ?? null });
    this.parent = { exists: true, create: () => true };
  }
  const app = { project: { renderQueue: rq } };
  return { comp, layers, items, log, app, File };
}

function runRender(w: Any, args: Record<string, unknown> = {}) {
  const AE = loadAE();
  AE.findCompByNameOrId = () => w.comp;
  AE.ensureParentDir = (p: string) => new w.File(p);
  AE.applyTemplate = (target: Any, name: string) => {
    target.applyTemplate(name);
    return null;
  };
  const body = renderCutoutJsx({
    comp: "Main",
    keep: ["raw_nogreen.mp4", "raw_nogreen.mp4 gap fill"],
    outputPath: "/out/cut.mov",
    outputTemplate: "High Quality with Alpha",
    start: 0,
    duration: 10.6667,
    overwrite: false,
    ...args,
  });
  return new Function("AE", "app", "File", "RQItemStatus", "GetSettingsFormat", body)(
    AE,
    w.app,
    w.File,
    { DONE: 3 },
    { STRING: 1 },
  );
}

describe("renderCutoutJsx", () => {
  it("renders with only the cut-out and its fill switched on, cameras left alone, then puts every switch back", () => {
    const w = queueWorld();
    const res = runRender(w);
    expect(res.ok).toBe(true);
    expect(w.log).toContain("render:raw_nogreen.mp4|raw_nogreen.mp4 gap fill|Camera");
    expect(w.layers.map((l: Any) => l.enabled)).toEqual([true, true, false, true, true, true]);
    expect(res.layersSwitched.sort()).toEqual(["BG", "Title"]);
    expect(res.restored).toBe(true);
    expect(w.log).toContain("removed");
    expect(w.items).toHaveLength(1);
    expect(w.items[0].render).toBe(true); // the other queue item, parked and unparked
    expect(res.audio).toMatchObject({ "Output Audio": "Off" });
  });

  it("puts every switch back and removes its queue item when the render fails", () => {
    const w = queueWorld({ throwOnRender: true });
    const res = runRender(w);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/disk full/);
    expect(w.layers.map((l: Any) => l.enabled)).toEqual([true, true, false, true, true, true]);
    expect(w.items).toHaveLength(1);
  });

  it("refuses to write over an existing file unless asked", () => {
    const res = runRender(queueWorld({ existing: true }));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/already exists/);
  });
});

// ------------------------------------------------------- check_file

const W = 200;
const H = 300;
/** The rendered cut-out: a body with the mic in; on `dropped` frames the mic is gone (an opening off the bottom). */
function fileFrame(frame: number, dropped: Set<number>): Float64Array {
  const a = new Float64Array(W * H);
  for (let y = 60; y < H; y++) for (let x = 40; x < 160; x++) a[y * W + x] = 1;
  if (dropped.has(frame))
    for (let y = 200; y < H; y++) for (let x = 80; x < 120; x++) a[y * W + x] = 0;
  return a;
}

function fileIO({
  frames = 120,
  dropped = new Set<number>(),
  fail = new Set<number>(),
  matteAt = null as ((frame: number) => Float64Array) | null,
} = {}): FileIO & { calls: Any[] } {
  const calls: Any[] = [];
  return {
    calls,
    execute: async (code: string, opts: Any) => {
      calls.push({ code, ...opts });
      if (/setup/.test(opts.label))
        return {
          ok: true,
          compId: 901,
          compName: "check_file 1",
          itemId: 77,
          imported: true,
          width: W,
          height: H,
          frames,
          frameRate: 30,
        };
      return { ok: true, removed: ["check_file 1"] };
    },
    render: async (args: Any) => {
      calls.push({ render: args });
      const stem = args.outPath.replace(/\.png$/, "");
      const out = [];
      for (const [i, frame] of (args.frames as number[]).entries()) {
        if (fail.has(frame)) {
          out.push({
            ok: false,
            frame,
            error: "the capture did not finish writing within 10.0 s (missing, 0 bytes)",
          });
          continue;
        }
        const f = `${stem}_${i}.png`;
        await fs.writeFile(
          f,
          encodePngSrgbRgba8(
            W,
            H,
            new Float64Array(W * H * 3).fill(0.5),
            matteAt ? matteAt(frame) : fileFrame(frame, dropped),
          ),
        );
        out.push({ ok: true, frame, writtenTo: f });
      }
      return {
        ok: true,
        frames: out,
        timing: { aeCallMs: 10, settleMs: 5, nodeMs: 5, totalMs: 20 },
      };
    },
    readImage: async (f: string) => decodePng(await fs.readFile(f)),
    exists: async (p: string) => p === "/x/cut.mov",
    freeBytes: async () => 500e9,
  };
}
const renders = (io: Any) => io.calls.filter((c: Any) => c.render).map((c: Any) => c.render);

describe("checkFileFrames", () => {
  it("reads every frame up to the cap", () => {
    expect(checkFileFrames(10, 400)).toEqual({ frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], step: 1 });
  });

  it("beyond the cap reads neighbouring pairs in steps, and always the first and last three frames", () => {
    const { frames, step } = checkFileFrames(1000, 100);
    expect(step).toBe(20);
    for (const f of [0, 1, 2, 997, 998, 999, 20, 21, 40, 41, 980, 981]) expect(frames).toContain(f);
    expect(frames).not.toContain(30);
    expect(frames.length).toBeLessThanOrEqual(106);
  });
});

describe("subject.check_file", () => {
  it("reads every frame of the file in batches of at most 32, in a throwaway comp it removes afterwards", async () => {
    const io = fileIO();
    const res = await runCheckFile({ path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9 }, io);
    expect(res.ok).toBe(true);
    const rs = renders(io);
    expect(rs.flatMap((r: Any) => r.frames)).toEqual(Array.from({ length: 120 }, (_, i) => i));
    expect(Math.max(...rs.map((r: Any) => r.frames.length))).toBeLessThanOrEqual(32);
    expect(rs[0]).toMatchObject({ compNameOrId: 901, channels: "rgba" });
    expect(rs[0].edge).toBeUndefined();
    expect(res.checked).toEqual({ frames: 120, of: 120 });
    expect(res.stop).toBe(false);
    expect(res.opaque).toMatchObject({
      min: expect.any(Number),
      max: expect.any(Number),
      largestStep: expect.objectContaining({ change: 0 }),
    });
    expect(res.compared).toMatch(/119 pairs of neighbouring frames/);
    const cleanup = io.calls.find((c: Any) => /cleanup/.test(c.label));
    expect(cleanup.code).toContain("901");
    expect(cleanup.code).toMatch(/removeItem[^;]*true/);
    expect(res.inOut).toMatch(/Nothing over the limit/);
    await fs.access(res.picture);
  });

  it("finds a frame that lost a large region: a jump in the opaque share, and the opening on that frame", async () => {
    const io = fileIO({ dropped: new Set([100]) });
    const res = await runCheckFile({ path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9 }, io);
    expect(res.stop).toBe(true);
    const jumps = res.findings.filter((f: Any) => f.kind === "jump");
    expect(jumps.map((j: Any) => [j.from, j.to])).toEqual([
      [99, 100],
      [100, 101],
    ]);
    expect(jumps[0].change).toBeCloseTo(4000 / (W * H), 3);
    expect(res.findings).toContainEqual(
      expect.objectContaining({ kind: "opening", frames: [100] }),
    );
    expect(res.inOut).toMatch(/jump/);
    await fs.access(jumps[0].pictures[1]);
  });

  it("stops on a frame that could not be read", async () => {
    const res = await runCheckFile(
      { path: "/x/cut.mov", outDir: dir },
      fileIO({ fail: new Set([7]) }),
    );
    expect(res.stop).toBe(true);
    expect(res.checked).toEqual({ frames: 119, of: 120 });
    expect(res.findings).toContainEqual(
      expect.objectContaining({ kind: "not-checked", frames: [7] }),
    );
    expect(res.compared).toMatch(/117 pairs/);
  });

  it("compares only true neighbours when it reads in steps, so motion between samples is no jump", async () => {
    const io = fileIO({ frames: 1000 });
    const res = await runCheckFile(
      { path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9, maxFrames: 100 },
      io,
    );
    expect(res.step).toBe(20);
    expect(res.compared).toMatch(
      /pairs of neighbouring frames \(each frame and the next\), one pair every 20 frames/,
    );
  });

  it("keeps the footage item when asked, and never removes an item it was given", async () => {
    const io = fileIO();
    await runCheckFile(
      { path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9, keepFootage: true },
      io,
    );
    expect(io.calls.find((c: Any) => /cleanup/.test(c.label)).code).toMatch(/removeItem[^;]*false/);
  });

  it("refuses a missing file before After Effects is asked", async () => {
    const io = fileIO();
    const res = await runCheckFile({ path: path.join(dir, "nope.mov"), outDir: dir }, io);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/no file at/);
    expect(io.calls).toEqual([]);
  });

  it("uses a jump limit between the largest step measured and a dropped object", () => {
    expect(CHECK_FILE_JUMP_LIMIT).toBe(0.025);
  });
});

// ------------------------------------------------------- use_cutout

function useWorld({ taken = false, soft = false } = {}) {
  const layers: Any[] = [];
  const mk = (name: string, extra: Any = {}) => {
    const l: Any = {
      name,
      enabled: true,
      hasAudio: true,
      audioEnabled: true,
      inPoint: 0,
      outPoint: 10.6667,
      startTime: 0,
      get index() {
        return layers.indexOf(l) + 1;
      },
      moveBefore(o: Any) {
        layers.splice(layers.indexOf(l), 1);
        layers.splice(layers.indexOf(o), 0, l);
      },
      ...extra,
    };
    return l;
  };
  const cut = mk("raw_nogreen.mp4", { inPoint: 0.5, outPoint: 10 });
  layers.push(
    mk("Title"),
    cut,
    mk("raw_nogreen.mp4 gap mask", { enabled: false, hasAudio: false }),
    mk("raw_nogreen.mp4 gap fill", { audioEnabled: false }),
    mk("BG"),
  );
  if (taken) layers.push(mk("raw_nogreen.mp4 cut-out"));
  if (soft) {
    cut.enabled = false;
    layers.splice(
      1,
      0,
      mk("raw_nogreen.mp4 soft edge", {
        comment: '{"compRoom":"soft-edge","layer":"raw_nogreen.mp4"}',
        hasAudio: false,
      }),
    );
  }
  const comp: Any = {
    name: "Main",
    width: 1080,
    height: 1920,
    get numLayers() {
      return layers.length;
    },
    layer: (i: number) => layers[i - 1],
    layers: {
      add(item: Any) {
        const l = mk(item.name);
        layers.unshift(l);
        return l;
      },
    },
  };
  const app = {
    project: {
      importFile: (io: Any) => ({ name: path.basename(io.file.fsName), id: 55 }),
      itemByID: () => null,
    },
  };
  function File(this: Any, p: string) {
    this.fsName = p;
    this.exists = true;
  }
  function ImportOptions(this: Any, f: Any) {
    this.file = f;
  }
  return { comp, layers, cut, app, File, ImportOptions };
}

function runUse(w: Any, args: Record<string, unknown> = {}) {
  const AE = loadAE();
  AE.findCompByNameOrId = () => w.comp;
  AE.findLayerInComp = () => w.cut;
  const body = useCutoutJsx({ comp: "Main", layer: 2, path: "/out/cut.mov", ...args });
  return new Function("AE", "app", "File", "ImportOptions", body)(
    AE,
    w.app,
    w.File,
    w.ImportOptions,
  );
}

describe("subject.use_cutout", () => {
  it("puts the movie above the cut-out, over the same span, and switches the matte and fill pictures off", () => {
    const w = useWorld();
    const res = runUse(w);
    expect(res.ok).toBe(true);
    expect(w.layers.map((l: Any) => l.name)).toEqual([
      "Title",
      "raw_nogreen.mp4 cut-out",
      "raw_nogreen.mp4",
      "raw_nogreen.mp4 gap mask",
      "raw_nogreen.mp4 gap fill",
      "BG",
    ]);
    const movie = w.layers[1];
    expect(movie).toMatchObject({
      startTime: 0.5,
      inPoint: 0.5,
      outPoint: 10,
      audioEnabled: false,
    });
    expect(w.cut.enabled).toBe(false);
    expect(w.cut.audioEnabled).toBe(true); // the original keeps the sound
    expect(w.layers[4].enabled).toBe(false);
    expect(res.switchedOff).toEqual(["raw_nogreen.mp4", "raw_nogreen.mp4 gap fill"]);
    expect(res.movieLayer).toBe("raw_nogreen.mp4 cut-out");
    expect(res.note).toMatch(/selections/);
  });

  it("with a softened edge, puts the movie above the soft-edge layer and switches it off too", () => {
    const w = useWorld({ soft: true });
    const res = runUse(w);
    expect(res.ok).toBe(true);
    expect(w.layers.map((l: Any) => l.name).slice(0, 4)).toEqual([
      "Title",
      "raw_nogreen.mp4 cut-out",
      "raw_nogreen.mp4 soft edge",
      "raw_nogreen.mp4",
    ]);
    expect(w.layers[2].enabled).toBe(false);
    expect(res.switchedOff).toContain("raw_nogreen.mp4 soft edge");
  });

  it("starts the movie where the render started when told", () => {
    const w = useWorld();
    runUse(w, { startTime: 0 });
    expect(w.layers[1].startTime).toBe(0);
  });

  it("refuses when the comp already has the cut-out movie", () => {
    const res = runUse(useWorld({ taken: true }));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/already has a layer 'raw_nogreen.mp4 cut-out'/);
  });
});

// ------------------------------------------- what a file check leaves behind

/** Frames 0..n-1 all carry a small opening under the "stand" (as on the take); `dropped` frames lose the mic too. */
function standFrame(frame: number, dropped: Set<number>): Float64Array {
  const a = fileFrame(frame, dropped);
  for (let y = 280; y < H; y++) for (let x = 130; x < 150; x++) a[y * W + x] = 0; // 400 px opening off the bottom
  for (let y = 240; y < H; y++) for (let x = 130; x < 150; x++) a[y * W + x] = 0; // grow it to 1,200 px
  return a;
}
const STAND_BOX = { x: 130, y: 240, width: 20, height: 60 };

function standIO(opts: { frames?: number; dropped?: Set<number> } = {}) {
  const io = fileIO(opts);
  const seen: number[] = [];
  const base = io.render;
  io.render = async (args: Any) => {
    // How many raw captures are on disk when each batch starts.
    seen.push((await fs.readdir(dir)).filter((f) => /^check-file-\d+_\d+\.png$/.test(f)).length);
    const stem = args.outPath.replace(/\.png$/, "");
    const out = await base(args);
    for (const [i, frame] of (args.frames as number[]).entries())
      await fs.writeFile(
        `${stem}_${i}.png`,
        encodePngSrgbRgba8(
          W,
          H,
          new Float64Array(W * H * 3).fill(0.5),
          standFrame(frame, opts.dropped ?? new Set()),
        ),
      );
    return out;
  };
  return Object.assign(io, { seen });
}
const pngs = async () => (await fs.readdir(dir)).filter((f) => f.endsWith(".png"));

describe("subject.check_file: what it leaves in outDir", () => {
  it("deletes each raw capture once read, and writes no picture for regions the user accepted", async () => {
    const io = standIO();
    const res = await runCheckFile(
      { path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9, accept: [STAND_BOX] },
      io,
    );
    expect(res.stop).toBe(false);
    expect(res.accepted).toHaveLength(1);
    expect(await pngs()).toEqual(["check-file_sheet.png"]);
    expect(res.pictures).toMatchObject({
      written: 0,
      bytes: 0,
      sheet: path.join(dir, "check-file_sheet.png"),
      capturesKept: false,
    });
    expect(Math.max(...io.seen)).toBeLessThanOrEqual(34); // a batch at a time, not the whole file
  });

  it("writes full-size pictures only for the largest frame of each finding and both frames of each jump", async () => {
    const io = standIO({ dropped: new Set([100]) });
    const res = await runCheckFile({ path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9 }, io);
    expect(res.stop).toBe(true);
    const stand = res.findings.find((f: Any) => f.kind === "opening" && f.frames.length > 1);
    const over = (await pngs()).filter((f) => f.endsWith("_over.png"));
    // The stand opening's largest frame, and frames 99, 100, 101 (the jumps and the mic opening on 100).
    expect(over.length).toBe(new Set([stand.largestFrame, 99, 100, 101]).size);
    expect(res.pictures.written).toBe(over.length);
    expect(res.pictures.bytes).toBeGreaterThan(0);
    expect((await pngs()).filter((f) => /^check-file-\d+_\d+\.png$/.test(f))).toEqual([]);
    const jump = res.findings.find((f: Any) => f.kind === "jump");
    for (const p of jump.pictures) await fs.access(p);
  });

  it("keeps the raw captures when asked", async () => {
    const res = await runCheckFile(
      { path: "/x/cut.mov", outDir: dir, keepCaptures: true },
      standIO(),
    );
    expect((await pngs()).filter((f) => /^check-file-\d+_\d+\.png$/.test(f))).toHaveLength(120);
    expect(res.pictures.capturesKept).toBe(true);
  });

  it("adds up its pixel timing: the parts are no more than the whole", async () => {
    const res = await runCheckFile(
      { path: "/x/cut.mov", outDir: dir },
      standIO({ dropped: new Set([100]) }),
    );
    const p = res.timing.pixels;
    expect(p.readMs + p.regionsMs + p.picturesMs + p.sheetMs).toBeLessThanOrEqual(p.ms + 5);
  });
});

// ------------------------------------------------- free space (a full drive stalled a render)

const GB = 1e9;
describe("free space before a render", () => {
  it("estimates the movie from the comp's size and frame count: 0.76 MB a 1080 x 1920 frame, scaled by pixels", () => {
    expect(renderCutoutBytes(320, [1080, 1920])).toBeCloseTo(243.2e6, -5);
    expect(renderCutoutBytes(320, [2160, 3840])).toBeCloseTo(4 * 243.2e6, -5);
    expect(RENDER_MARGIN_BYTES).toBeGreaterThanOrEqual(2 * GB);
  });

  it("refuses before rendering when the drive has less than the movie plus the margin, and says the numbers", async () => {
    const io = renderIO();
    io.freeBytes = async () => 1 * GB;
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "cut.mov") },
      io,
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/1\.0 GB free/);
    expect(res.error).toMatch(/Edit > Purge > All Memory & Disk Cache/);
    expect(res.space).toMatchObject({
      free: 1 * GB,
      where: dir,
      needed: expect.any(Number),
      margin: RENDER_MARGIN_BYTES,
    });
    expect(res.space.parts).toMatchObject({ movie: expect.any(Number), cache: expect.any(Number) });
    expect(io.calls.filter((c: Any) => c.label === "subject.render_cutout")).toEqual([]);
  });

  it("renders when there is room", async () => {
    const io = renderIO();
    io.freeBytes = async () => 30 * GB;
    expect(
      (await runRenderCutout({ comp: "Main", layer: 1, outputPath: path.join(dir, "cut.mov") }, io))
        .ok,
    ).toBe(true);
  });

  it("on a timeout, adds the free space and names a full drive as the likely cause when it is low", async () => {
    const io = renderIO();
    let calls = 0;
    io.freeBytes = async () => (++calls === 1 ? 30 * GB : 0.4 * GB);
    const exec = io.execute;
    io.execute = async (code: string, opts: Any) =>
      opts.label === "subject.render_cutout"
        ? {
            ok: false,
            error:
              "timeout after 1720000ms waiting for After Effects to respond (a modal dialog may be open)",
          }
        : exec(code, opts);
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "cut.mov") },
      io,
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/0\.4 GB free.*full drive is a likely cause/);
    expect(res.spaceAtTimeout).toMatchObject({ free: 0.4 * GB, where: dir });
  });

  it("on a timeout with room on the drive, keeps the modal-dialog text and does not blame the drive", async () => {
    const io = renderIO();
    const exec = io.execute;
    io.execute = async (code: string, opts: Any) =>
      opts.label === "subject.render_cutout"
        ? {
            ok: false,
            error:
              "timeout after 1720000ms waiting for After Effects to respond (a modal dialog may be open)",
          }
        : exec(code, opts);
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "cut.mov") },
      io,
    );
    expect(res.error).toMatch(/modal dialog/);
    expect(res.error).not.toMatch(/full drive/);
    expect(res.spaceAtTimeout.free).toBe(500e9);
  });
});

describe("free space before a file check", () => {
  it("refuses before reading frames, and still removes the throwaway comp", async () => {
    const io = fileIO();
    io.freeBytes = async () => 0.1 * GB;
    const res = await runCheckFile({ path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9 }, io);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/free on/);
    expect(res.space.where).toBe(dir);
    expect(io.calls.filter((c: Any) => c.render)).toEqual([]);
    expect(io.calls.some((c: Any) => /cleanup/.test(c.label))).toBe(true);
  });
});

describe("After Effects' disk cache", () => {
  it("finds the cache under <folder>/Adobe/After Effects/<major.minor>", () => {
    expect(aeCacheRoot("/Volumes/Work/Library/Caches", "27.0x52")).toBe(
      "/Volumes/Work/Library/Caches/Adobe/After Effects/27.0",
    );
    expect(aeCacheRoot("", "27.0")).toBeNull();
    expect(aeCacheRoot("/c", "")).toBeNull();
  });

  it("reports the cache's size and the free space on its drive, with the remedy when it is low", async () => {
    const root = path.join(dir, "Adobe", "After Effects", "27.0");
    await fs.mkdir(path.join(root, "Disk Cache - x.noindex", "a"), { recursive: true });
    await fs.writeFile(path.join(root, "Disk Cache - x.noindex", "a", "1.bin"), Buffer.alloc(3000));
    await fs.writeFile(path.join(root, "Disk Cache - x.noindex", "2.bin"), Buffer.alloc(2000));
    const low = await diskReport({ folder: dir, version: "27.0x1" }, async () => 0.5 * GB);
    expect(low).toMatchObject({
      cacheRoot: root,
      cacheBytes: 5000,
      complete: true,
      free: 0.5 * GB,
      low: true,
    });
    expect(low.note).toMatch(/Edit > Purge > All Memory & Disk Cache/);
    expect(low.note).toMatch(/nothing was deleted/i);
    const fine = await diskReport({ folder: dir, version: "27.0x1" }, async () => 200 * GB);
    expect(fine.low).toBe(false);
    expect(fine.note).toBeUndefined();
  });

  it("says when the cache folder could not be read", async () => {
    const r = await diskReport({ folder: null, version: "27.0" }, async () => 1 * GB);
    expect(r).toMatchObject({ cacheRoot: null, cacheBytes: null });
  });
});

describe("subject.status reads the disk cache folder", () => {
  it("runs in Node so it can measure the cache, and its JSX still works inside batch.run", () => {
    const op = getOp("subject.status")!;
    expect(op.run).toBeTypeOf("function");
    expect(op.readOnly).toBe(true);
    const body = op.toJsx({ comp: "Main", layer: 1 });
    expect(body).toContain("Disk Cache Controls");
    expect(body).toContain("Folder 7");
    expect(body).not.toMatch(/setPref|savePrefAsString|purge/i);
  });
});

// ------------------------------------- the cache a render writes (about 19 GB for the take)

describe("the cache a render writes", () => {
  it("is estimated at a 16-bit RGBA frame of the source for every frame tracked through", () => {
    expect(cacheBytesFor(320, [2176, 3840])).toBe(320 * 2176 * 3840 * 8); // 21.4 GB; 19 GB measured
  });

  it("render_cutout needs the movie, the cache and the margin on one drive, and refuses with the parts", async () => {
    const io = renderIO();
    io.freeBytes = async () => 10 * GB;
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "cut.mov") },
      io,
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/cache/);
    expect(res.space.parts.cache).toBe(cacheBytesFor(320, [2176, 3840]));
    expect(res.space.parts.movie).toBeCloseTo(243.2e6, -5);
    expect(res.space.needed).toBe(Math.round(res.space.parts.movie + res.space.parts.cache));
  });

  it("checks the cache's drive and the output's drive each against its own share when they differ", async () => {
    const cacheDir = path.join(dir, "cachevol");
    const plan = { ...PLAN, aeCache: { folder: cacheDir, version: "27.0x52" } };
    const io = renderIO(plan);
    io.volumeOf = async (d: string) => (d.startsWith(cacheDir) ? "cache-volume" : "output-volume");
    io.freeBytes = async (d: string) => (d.startsWith(cacheDir) ? 10 * GB : 5 * GB);
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "cut.mov") },
      io,
    );
    expect(res.ok).toBe(false);
    expect(res.space.where).toBe(path.join(cacheDir, "Adobe", "After Effects", "27.0"));
    expect(res.space.volumes).toHaveLength(2);
    // With room for the cache on its own drive, the output's drive needs only the movie and the margin.
    io.freeBytes = async (d: string) => (d.startsWith(cacheDir) ? 30 * GB : 5 * GB);
    const ok = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "cut2.mov") },
      io,
    );
    expect(ok.ok).toBe(true);
    expect(ok.space.volumes.map((v: Any) => v.ok)).toEqual([true, true]);
  });

  it("says in its result how much the render should add to the cache, and to purge once the file is checked", async () => {
    const io = renderIO();
    io.freeBytes = async () => 60 * GB;
    const res = await runRenderCutout(
      { comp: "Main", layer: 1, outputPath: path.join(dir, "cut.mov") },
      io,
    );
    expect(res.ok).toBe(true);
    expect(res.space.parts.cache).toBe(cacheBytesFor(320, [2176, 3840]));
    expect(res.next).toMatch(/Edit > Purge > All Memory & Disk Cache/);
    expect(res.next).toMatch(/about 21\.4 GB/);
    expect(res.cacheNote).toMatch(/nothing was deleted/i);
  });
});

// ------------------------------------------ a cut-out whose outline never moves

import { outlineTracker } from "../src/color/matte.js";

/** A body whose left edge sits at x0, with grey footage whose brightness changes with `shade`. */
function bodyAt(x0: number): Float64Array {
  const a = new Float64Array(W * H);
  for (let y = 60; y < H; y++)
    for (let x = x0; x < x0 + 120; x++) if (x >= 0 && x < W) a[y * W + x] = 1;
  return a;
}
const wobble = (f: number) => [0, 3, -2, 4, -3, 1, -4, 2][f % 8] + Math.floor(f / 4); // a few px a frame, drifting
const grey = (v: number) => new Float64Array(W * H * 3).fill(v);

describe("outlineTracker", () => {
  it("finds a run where the outline did not move, with the footage changing inside it", () => {
    const t = outlineTracker({ gap: 30, limit: 0.002, minFrames: 60 });
    for (let f = 0; f < 90; f++) t.add(f, bodyAt(40), grey(0.3 + 0.004 * f), W, H);
    const r = t.result();
    expect(r.frozen).toEqual([expect.objectContaining({ from: 0, to: 89, length: 90 })]);
    expect(r.frozen[0].footageChange).toBeGreaterThan(0);
    expect(r.neighbours).toMatchObject({ min: 0, median: 0, max: 0, pairs: 89 });
    expect(r.drift).toMatchObject({ gap: 30, min: 0, max: 0, windows: 60 });
    expect(r.at).toMatch(/full size/);
  });

  it("finds nothing when the edge wobbles a few pixels a frame", () => {
    const t = outlineTracker({ gap: 30, limit: 0.002, minFrames: 60 });
    for (let f = 0; f < 90; f++) t.add(f, bodyAt(40 + wobble(f)), grey(0.3), W, H);
    const r = t.result();
    expect(r.frozen).toEqual([]);
    expect(r.neighbours.median).toBeGreaterThan(0.002);
  });

  it("compares sparse frames with the latest frame at least a gap earlier (a check across the clip)", () => {
    const t = outlineTracker({ gap: 30, limit: 0.002, minFrames: 60 });
    for (const f of [0, 40, 80, 120, 160]) t.add(f, bodyAt(40), grey(0.3 + 0.001 * f), W, H);
    expect(t.result().frozen).toEqual([expect.objectContaining({ from: 0, to: 160 })]);
    expect(t.result().neighbours.pairs).toBe(0);
  });
});

describe("subject.check_file: a frozen outline", () => {
  function frozenIO(moving: boolean) {
    const io = fileIO({ frames: 90 });
    const base = io.render;
    io.render = async (args: Any) => {
      const out = await base(args);
      const stem = args.outPath.replace(/\.png$/, "");
      for (const [i, frame] of (args.frames as number[]).entries())
        await fs.writeFile(
          `${stem}_${i}.png`,
          encodePngSrgbRgba8(
            W,
            H,
            grey(0.3 + 0.004 * frame),
            bodyAt(moving ? 40 + wobble(frame) : 40),
          ),
        );
      return out;
    };
    return io;
  }

  it("reports the outline not moving while the footage did, with two pictures far apart, and stops", async () => {
    const res = await runCheckFile({ path: "/x/cut.mov", outDir: dir }, frozenIO(false));
    expect(res.stop).toBe(true);
    const f = res.findings.find((x: Any) => x.kind === "frozen");
    expect(f).toMatchObject({ from: 0, to: 89, length: 90 });
    expect(f.reading).toMatch(/did not move for 90 frames while the footage did/);
    expect(f.reading).toMatch(/replaced after the click/);
    expect(f.reading).toMatch(/genuinely motionless/);
    expect(f.pictures).toHaveLength(2);
    for (const p of f.pictures) await fs.access(p);
    expect(res.outline).toMatchObject({
      neighbours: expect.any(Object),
      drift: expect.any(Object),
    });
  });

  it("does not report a cut-out whose edge moves", async () => {
    const res = await runCheckFile({ path: "/x/cut.mov", outDir: dir }, frozenIO(true));
    expect(res.findings.filter((x: Any) => x.kind === "frozen")).toEqual([]);
  });

  it("takes an accept of kind frozen for a subject that is really still", async () => {
    const res = await runCheckFile(
      { path: "/x/cut.mov", outDir: dir, accept: [{ kind: "frozen" }] },
      frozenIO(false),
    );
    expect(res.findings.filter((x: Any) => x.kind === "frozen")).toEqual([]);
    expect(res.accepted).toContainEqual(expect.objectContaining({ kind: "frozen" }));
  });

  it("takes the limits as arguments", async () => {
    const res = await runCheckFile(
      { path: "/x/cut.mov", outDir: dir, frozenFrames: 200 },
      frozenIO(false),
    );
    expect(res.findings.filter((x: Any) => x.kind === "frozen")).toEqual([]);
  });
});

// ------------------------------------------------------- specks

/** The body of fileFrame with a thin dark sliver 2 px off its right side (x 162..164, y 120..149, 90 px) on `on` frames. */
function sliverFrame(on: Set<number>, neck = false) {
  return (frame: number) => {
    const a = fileFrame(frame, new Set());
    if (on.has(frame)) {
      for (let y = 120; y < 150; y++) for (let x = 162; x < 165; x++) a[y * W + x] = 1;
      // A neck one pixel high, two wide, joining it to the body: nearly separate.
      if (neck) for (let x = 160; x < 162; x++) a[130 * W + x] = 1;
    }
    return a;
  };
}

describe("speckPieces", () => {
  const body = () => fileFrame(0, new Set());
  it("finds a small opaque piece apart from the main cut-out", () => {
    const a = sliverFrame(new Set([0]))(0);
    expect(speckPieces(a, W, H)).toEqual([{ x: 162, y: 120, width: 3, height: 30, area: 90 }]);
  });

  it("finds one joined to the cut-out only by a neck a pixel or two wide", () => {
    const a = sliverFrame(new Set([0]), true)(0);
    const p = speckPieces(a, W, H);
    expect(p).toHaveLength(1);
    // The neck's pixels go to one side or the other.
    expect(p[0].x).toBeGreaterThanOrEqual(160);
    expect(p[0].x + p[0].width).toBe(165);
    expect(p[0].area).toBeGreaterThanOrEqual(90);
    expect(p[0].area).toBeLessThanOrEqual(92);
  });

  it("leaves out the clean cut-out, pieces under 20 px or over 2,000 px, and pieces on the frame edge", () => {
    expect(speckPieces(body(), W, H)).toEqual([]);
    const dot = body();
    for (let y = 20; y < 22; y++) for (let x = 20; x < 22; x++) dot[y * W + x] = 1;
    expect(speckPieces(dot, W, H)).toEqual([]);
    const big = body();
    for (let y = 0 + 5; y < 50; y++) for (let x = 165; x < 195; x++) big[y * W + x] = 1; // 1,350 px: still a speck
    expect(speckPieces(big, W, H)).toHaveLength(1);
    const bigger = new Float64Array(400 * 300);
    for (let y = 60; y < 300; y++) for (let x = 40; x < 160; x++) bigger[y * 400 + x] = 1;
    for (let y = 10; y < 60; y++) for (let x = 250; x < 300; x++) bigger[y * 400 + x] = 1; // 2,500 px: another object
    expect(speckPieces(bigger, 400, 300)).toEqual([]);
    const edge = body();
    for (let y = 0; y < 10; y++) for (let x = 170; x < 175; x++) edge[y * W + x] = 1;
    expect(speckPieces(edge, W, H)).toEqual([]);
  });

  it("uses the limits it is given", () => {
    const a = sliverFrame(new Set([0]))(0);
    expect(speckPieces(a, W, H, { minArea: 100 })).toEqual([]);
    expect(SPECK_DEFAULTS).toMatchObject({
      minArea: 20,
      maxArea: 2000,
      neck: 1,
      opaque: 0.5,
      minRun: 2,
    });
  });
});

describe("subject.check_file: specks", () => {
  it("reports a sliver on the frames it is on, with the largest area, the box and a picture, and stops", async () => {
    const on = new Set([50, 51, 52, 53, 54, 55]);
    const res = await runCheckFile(
      { path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9 },
      fileIO({ matteAt: sliverFrame(on) }),
    );
    const f = res.findings.find((x: Any) => x.kind === "speck");
    expect(f).toBeDefined();
    expect(f.frames).toEqual([50, 51, 52, 53, 54, 55]);
    expect(f.longestRun).toBe(6);
    expect(f.largestArea).toBe(90);
    expect(f.box).toEqual({ x: 162, y: 120, width: 3, height: 30 });
    await fs.access(f.picture);
    expect(res.stop).toBe(true);
    expect(res.inOut).toMatch(/small opaque piece/);
    expect(res.inOut).not.toMatch(/Nothing over the limit/);
    expect(res.next).toMatch(/speck/);
  });

  it("a speck on one frame, or on single frames apart, is a note that does not stop", async () => {
    for (const on of [new Set([50]), new Set([50, 52, 54])]) {
      const res = await runCheckFile(
        { path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9 },
        fileIO({ matteAt: sliverFrame(on) }),
      );
      expect(res.findings.filter((x: Any) => x.kind === "speck")).toEqual([]);
      expect(res.stop).toBe(false);
      expect(res.notes).toEqual([
        expect.objectContaining({
          kind: "speck",
          frames: [...on],
          longestRun: 1,
          box: { x: 162, y: 120, width: 3, height: 30 },
        }),
      ]);
      expect(res.inOut.match(/never on 2 or more frames in a row/g)).toHaveLength(1);
    }
  });

  it("two frames in a row are enough to stop", async () => {
    const res = await runCheckFile(
      { path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9 },
      fileIO({ matteAt: sliverFrame(new Set([50, 51])) }),
    );
    expect(res.findings.find((x: Any) => x.kind === "speck")).toMatchObject({
      frames: [50, 51],
      longestRun: 2,
    });
    expect(res.stop).toBe(true);
    expect(res.notes).toEqual([]);
  });

  it("says what the speck pass cost", async () => {
    const res = await runCheckFile(
      { path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9 },
      fileIO(),
    );
    expect(res.timing.speck).toMatchObject({ frames: 120 });
    expect(res.timing.speck.ms).toBeTypeOf("number");
  });

  it("finds nothing on a clean file", async () => {
    const res = await runCheckFile(
      { path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9 },
      fileIO(),
    );
    expect(res.findings.filter((x: Any) => x.kind === "speck")).toEqual([]);
  });

  it("takes an accepted speck off the findings", async () => {
    const on = new Set([50, 51, 52]);
    const res = await runCheckFile(
      {
        path: "/x/cut.mov",
        outDir: dir,
        frozenFrames: 1e9,
        accept: [{ kind: "speck", box: { x: 158, y: 116, width: 12, height: 40 } }],
      },
      fileIO({ matteAt: sliverFrame(on) }),
    );
    expect(res.findings.filter((x: Any) => x.kind === "speck")).toEqual([]);
    expect(res.accepted).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "speck" })]),
    );
    expect(res.stop).toBe(false);
  });
});

// ------------------------------------------------------- seen through inside

/** The body of fileFrame with a band of rows y0..y1 at `alpha` right across it, on `on` frames (all when null). */
function seamFrame(on: Set<number> | null, alpha = 0.75, y0 = 150, y1 = 160) {
  return (frame: number) => {
    const a = fileFrame(frame, new Set());
    if (!on || on.has(frame))
      for (let y = y0; y < y1; y++) for (let x = 40; x < 160; x++) a[y * W + x] = alpha;
    return a;
  };
}

describe("seenThroughInside", () => {
  it("counts partly see-through pixels more than 30 px inside the cut-out body", () => {
    const r = seenThroughInside(seamFrame(null)(0), W, H);
    // The body is x 40..159: 30 px in from each side leaves x 70..129, 60 px, over 10 rows.
    expect(r.px).toBe(600);
    expect(r.box).toEqual({ x: 70, y: 150, width: 60, height: 10 });
  });

  it("leaves out a clean body, the soft edge near the outline, nearly solid pixels and the frame edge", () => {
    expect(seenThroughInside(fileFrame(0, new Set()), W, H).px).toBe(0);
    const soft = fileFrame(0, new Set());
    for (let y = 60; y < H; y++)
      for (let x = 40; x < 60; x++) soft[y * W + x] = Math.min(1, (x - 39) / 20);
    expect(seenThroughInside(soft, W, H).px).toBe(0);
    expect(seenThroughInside(seamFrame(null, 0.97)(0), W, H).px).toBe(0);
    // A band in the last 30 rows, where the body runs off the frame, is not counted.
    expect(seenThroughInside(seamFrame(null, 0.75, 280, 290)(0), W, H).px).toBe(0);
  });

  it("has the limits chosen on the two files of the half-size take", () => {
    expect(SEEN_THROUGH_DEFAULTS).toEqual({ solid: 0.5, below: 0.95, deep: 30, minArea: 400, minRun: 2 });
  });
});

describe("subject.check_file: seen through inside the cut-out", () => {
  it("finds a seam across the body on the frames it is on, with a picture, and stops", async () => {
    const on = new Set(Array.from({ length: 20 }, (_, i) => 40 + i));
    const res = await runCheckFile(
      { path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9 },
      fileIO({ matteAt: seamFrame(on) }),
    );
    const f = res.findings.find((x: Any) => x.kind === "seen-through");
    expect(f).toBeDefined();
    expect(f.frames).toEqual([...on]);
    expect(f.longestRun).toBe(20);
    expect(f.largestArea).toBe(600);
    expect(f.box).toEqual({ x: 70, y: 150, width: 60, height: 10 });
    await fs.access(f.picture);
    expect(f.reading).toMatch(/soften_edge/);
    expect(res.stop).toBe(true);
    expect(res.next).toMatch(/undo: true/);
    expect(res.next).toMatch(/Decontaminate/);
    expect(res.seenThroughLimits).toMatchObject({ deep: 30, below: 0.95, minArea: 400 });
    expect(res.timing.seenThrough.frames).toBe(120);
  });

  it("does not count a seam that is too small, and keeps one on single frames to the notes", async () => {
    const thin = await runCheckFile(
      { path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9 },
      fileIO({ matteAt: seamFrame(null, 0.75, 150, 155) }), // 300 px: under 400
    );
    expect(thin.findings.filter((x: Any) => x.kind === "seen-through")).toEqual([]);
    const flash = await runCheckFile(
      { path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9 },
      fileIO({ matteAt: seamFrame(new Set([50, 70])) }),
    );
    expect(flash.findings.filter((x: Any) => x.kind === "seen-through")).toEqual([]);
    expect(flash.stop).toBe(false);
    expect(flash.notes).toContainEqual(
      expect.objectContaining({ kind: "seen-through", frames: [50, 70], longestRun: 1 }),
    );
  });

  it("finds nothing on a clean file", async () => {
    const res = await runCheckFile(
      { path: "/x/cut.mov", outDir: dir, frozenFrames: 1e9 },
      fileIO(),
    );
    expect(res.findings.filter((x: Any) => x.kind === "seen-through")).toEqual([]);
    expect(res.notes.filter((x: Any) => x.kind === "seen-through")).toEqual([]);
  });
});

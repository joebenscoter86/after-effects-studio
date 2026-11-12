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
  checkFileFrames,
  diskReport,
  renderCutoutBytes,
  renderCutoutJsx,
  runCheckFile,
  runRenderCutout,
  useCutoutJsx,
  type FileIO,
} from "../src/operations/keying.js";
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
            fileFrame(frame, dropped),
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
    const res = await runCheckFile({ path: "/x/cut.mov", outDir: dir }, io);
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
    const res = await runCheckFile({ path: "/x/cut.mov", outDir: dir }, io);
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
    const res = await runCheckFile({ path: "/x/cut.mov", outDir: dir, maxFrames: 100 }, io);
    expect(res.step).toBe(20);
    expect(res.compared).toMatch(
      /pairs of neighbouring frames \(each frame and the next\), one pair every 20 frames/,
    );
  });

  it("keeps the footage item when asked, and never removes an item it was given", async () => {
    const io = fileIO();
    await runCheckFile({ path: "/x/cut.mov", outDir: dir, keepFootage: true }, io);
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

function useWorld({ taken = false } = {}) {
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
    const res = await runCheckFile({ path: "/x/cut.mov", outDir: dir, accept: [STAND_BOX] }, io);
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
    const res = await runCheckFile({ path: "/x/cut.mov", outDir: dir }, io);
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
    expect(io.calls.filter((c: Any) => c.label === "subject.render_cutout")).toEqual([]);
  });

  it("renders when there is room", async () => {
    const io = renderIO();
    io.freeBytes = async () => 20 * GB;
    expect(
      (await runRenderCutout({ comp: "Main", layer: 1, outputPath: path.join(dir, "cut.mov") }, io))
        .ok,
    ).toBe(true);
  });

  it("on a timeout, adds the free space and names a full drive as the likely cause when it is low", async () => {
    const io = renderIO();
    let calls = 0;
    io.freeBytes = async () => (++calls === 1 ? 20 * GB : 0.4 * GB);
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
    const res = await runCheckFile({ path: "/x/cut.mov", outDir: dir }, io);
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

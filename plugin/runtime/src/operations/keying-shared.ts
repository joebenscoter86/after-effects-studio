// Helpers more than one of the keying files uses (key, subject, reference).
// Moved whole from keying.ts (which still registers them, in their order, and re-exports what it exported).

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { cutoutRegions, type FrozenRun, EDGE_DEFAULTS, type Box, type FrameEdge } from "../color/matte.js";
import { decodePng, encodePngSrgb8, type DecodedPng } from "../color/png16.js";
import { composeContactSheet, flattenOver, resample } from "../color/sheet.js";
import { jsxFail, jsxVal, jsxCompLayerPreamble, jsxCompPreamble, getOp } from "../registry.js";
import type { AeTransport } from "../transport/AeTransport.js";
import { renderFrameTool } from "../tools/render-frame.js";


export const compLayerParams = [
  { name: "comp", type: "any" as const, description: "Comp name or id", required: true },
  {
    name: "layer",
    type: "any" as const,
    description: "1-based layer index, or the layer name",
    required: true,
  },
];

/** JSX: `_fxRoot` = the layer's effect stack. */
export const FX_ROOT_JSX = `
            var _fxRoot = _layer.property("ADBE Effect Parade");
            if (!_fxRoot) return { ok: false, error: "layer '" + _layer.name + "' cannot carry effects" };
`;

// ------------------------------------------------------------------------
// Subject matte ("finish like a professional", stage 12): After Effects
// 2027's Object Matte (the old Roto Brush, match name ADBE Samurai). A script
// cannot make its selection: the user clicks the subject once with the Object
// Matte Tool, and these operations do everything around that click. The match
// names, names, ranges and defaults below are the ones After Effects 27.0
// reported live (macOS, 2026-11-11). The slash match names resolve there
// (fx.property("/rmreducechatter")), and so do the display names; every lookup
// still falls back to walking the effect's properties and comparing matchName,
// then display name, in case another version differs.

export const OBJECT_MATTE_MATCH_NAME = "ADBE Samurai";
export const OBJECT_MATTE_SELECTIONS_MATCH_NAME = "ADBE Samurai Strokes Group";

/** For the agent: how a whole piece's cut-out was rendered in production (2026-11-12). */
export const SUBJECT_WHOLE_PIECE_NOTE =
  "For a whole piece, scale the take to delivery size first (a delivery-size copy of the footage, before the click: sourceAdvice), then render the cut-out in halves, emptying After Effects' disk cache between them: " +
  "two halves of a 43.5 s piece at 1088 x 1920 took about 4.3 minutes and 12 GB of cache each. Check free disk space before each half. " +
  "subject.render_cutout takes from and to (comp seconds) for each half; join the halves with a stream copy (HALVES_JOIN_NOTE).";

/** Two clicks closer than this share of the source's shorter side probably selected the same thing. */
export const CLOSE_CLICK_SHARE = 0.05;

export const COUNT_NOTE =
  "A selection count is not a check: it does not say what was selected. Run subject.check and look at its picture before building anything on the cut-out.";

export const NEED_CLICK =
  "run subject.prepare and ask the user for the click, relaying its steps word for word";

export const subjectIndexParam = {
  name: "effectIndex",
  type: "number" as const,
  description:
    "1-based index of the Object Matte to use when the layer has several (it must be Object Matte, ADBE Samurai). Default: the first in the stack.",
  required: false,
};

// ------------------------------------------------------------------------
// Proofing the cut-out (stage 12b). After the click, subject.check renders
// the cut-out with its alpha at the click frame and across the clip, finds
// holes and openings, and draws it over a flat colour for the user;
// subject.fill_gaps fills enclosed gaps (a shock mount with the shirt behind
// it) from a still made at one frame. Both run in Node: the pixels are read
// with color/matte.ts, and every After Effects call goes through `CutoutIO`,
// so the tests drive them with made-up mattes.

/** A hole or opening at least this big (px at the comp's size) is a finding the agent stops on and shows. */
export const CUTOUT_HOLE_LIMIT = 1000;
export const CUTOUT_OVER = "#ff00ff";
/** Settle time asked of ae_render_frame per frame. Measured: 20 to 40 s a frame the first time on a 2176 x 3840 take. */
export const CUTOUT_SECONDS_PER_FRAME = 60;
/** ae_render_frame's largest settleTimeoutMs. */
export const SETTLE_MAX_MS = 600_000;
export const THUMB = 360;
/** zlib level for the check's own pictures: 3.5 times faster than the default 6 on a synthetic 1080 x 1920 frame with noise, for files about 3% larger. */
export const PICTURE_DEFLATE = 1;

export type RegionBox = Box & { area: number; edges?: FrameEdge[] };
export interface RegionFinding {
  kind: "hole" | "opening";
  frames: number[];
  smallestArea: number;
  largestArea: number;
  /** The frame where it was largest. */
  largestFrame: number;
  box: Box;
  edges?: FrameEdge[];
}

export const intersects = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
export const union = (a: Box, b: Box): Box => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
};
export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
export const boxText = (b: Box) => `(${b.x}, ${b.y}, ${b.width} × ${b.height})`;
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const boxArea = (b: Box) => b.width * b.height;
export const iou = (a: Box, b: Box) => {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  if (w <= 0 || h <= 0) return 0;
  const inter = w * h;
  return inter / (boxArea(a) + boxArea(b) - inter);
};

/**
 * Two regions are alike (the same thing on two frames, or on two renders of
 * one frame) when their boxes overlap by at least half their union, or when
 * they overlap and their areas are within a factor of two. A small opening
 * under a microphone stand inside the box of a missed microphone is not
 * alike to it (2026-11-11: 1,862 px against 114,769 px).
 */
export function alikeRegions(a: Box & { area: number }, b: Box & { area: number }): boolean {
  if (iou(a, b) >= 0.5) return true;
  if (!intersects(a, b)) return false;
  const big = Math.max(a.area, b.area);
  const small = Math.min(a.area, b.area);
  return small > 0 && big / small <= 2;
}

/** An `accept` entry: a plain box (it accepts openings) or { box, kind }. */
export type AcceptEntry =
  | Box
  | { box: Box; kind?: "hole" | "opening" | "speck" }
  /** A frozen outline seen and accepted (a subject that really is still), optionally only over these frames. */
  | { kind: "frozen"; from?: number; to?: number };

export const isFrozenEntry = (e: AcceptEntry): e is { kind: "frozen"; from?: number; to?: number } =>
  !("box" in e) && (e as { kind?: string }).kind === "frozen";

/** Whether a frozen run is one the user accepted: an entry of kind frozen, over frames that overlap it (or any). */
export function frozenAccepted(run: FrozenRun, accept: AcceptEntry[]): boolean {
  return accept.some(
    (e) =>
      isFrozenEntry(e) &&
      (e.from === undefined || e.from <= run.to) &&
      (e.to === undefined || e.to >= run.from),
  );
}

/**
 * Whether a finding is one the user accepted: an entry of the same kind
 * (openings unless the entry says "hole") whose box overlaps the finding's by
 * at least half their union. A hole is never accepted through an opening's
 * box, and a box does not accept what merely lies inside it.
 */
export function acceptedBy(f: RegionFinding, accept: AcceptEntry[]): boolean {
  return accept.some((e) => {
    if (isFrozenEntry(e)) return false;
    const box = "box" in e ? e.box : (e as Box);
    const kind = ("box" in e ? e.kind : undefined) ?? "opening";
    return kind === f.kind && iou(f.box, box) >= 0.5;
  });
}

/** Holes and openings at least `limit` px, each kind grouped across frames where they are alike. */
export function cutoutFindings(
  frames: Array<{ frame: number; holes?: RegionBox[] | null; openings?: RegionBox[] | null }>,
  limit: number,
): RegionFinding[] {
  const out: RegionFinding[] = [];
  for (const kind of ["hole", "opening"] as const) {
    const groups: Array<{ f: RegionFinding; members: RegionBox[] }> = [];
    for (const fr of frames) {
      for (const h of (kind === "hole" ? fr.holes : fr.openings) ?? []) {
        if (h.area < limit) continue;
        const b = { x: h.x, y: h.y, width: h.width, height: h.height };
        const g = groups.find((x) => x.members.some((m) => alikeRegions(m, h)));
        if (g) {
          const f = g.f;
          g.members.push(h);
          f.box = union(f.box, b);
          if (h.area > f.largestArea) {
            f.largestArea = h.area;
            f.largestFrame = fr.frame;
          }
          f.smallestArea = Math.min(f.smallestArea, h.area);
          if (!f.frames.includes(fr.frame)) f.frames.push(fr.frame);
          if (f.edges) for (const e of h.edges ?? []) if (!f.edges.includes(e)) f.edges.push(e);
        } else
          groups.push({
            members: [h],
            f: {
              kind,
              frames: [fr.frame],
              smallestArea: h.area,
              largestArea: h.area,
              largestFrame: fr.frame,
              box: b,
              ...(kind === "opening" ? { edges: [...(h.edges ?? [])] } : {}),
            },
          });
      }
    }
    out.push(...groups.map((g) => g.f).sort((a, b) => b.largestArea - a.largestArea));
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;

/** Every After Effects call subject.check and subject.fill_gaps make. */
export interface CutoutIO {
  /** subject.status for the layer. */
  status(): Promise<Json>;
  /** ae_render_frame with these arguments; its result payload, or { ok: false, error }. */
  render(args: Record<string, unknown>): Promise<Json>;
  /** A written PNG, decoded. */
  readImage(file: string): Promise<DecodedPng>;
  /** The fill's build in After Effects (fillBuildJsx). */
  build(args: { comp: unknown; layer: unknown; stillPath: string }): Promise<Json>;
  /** Undo the fill's build (fillUnbuildJsx). */
  unbuild(args: {
    comp: unknown;
    fillLayer: string;
    maskLayer: string;
    stillItemId: number | null;
  }): Promise<Json>;
  writePng?(file: string, data: Buffer): Promise<void>;
  /** Free bytes on the volume holding `dir` (default: fs.statfs), or null when unknown. */
  freeBytes?(dir: string): Promise<number | null>;
  /** Which volume holds `dir` (default: the device of its nearest existing folder). */
  volumeOf?(dir: string): Promise<string | number | null>;
}

/** What the pixel helpers need from After Effects: a render, and the files it wrote. */
export type PixelIO = Pick<CutoutIO, "render" | "readImage" | "writePng" | "freeBytes" | "volumeOf">;

export async function writePng(io: PixelIO, file: string, data: Buffer) {
  if (io.writePng) return io.writePng(file, data);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
}

// ------------------------------------------------------------------ free space
// On 2026-11-12 a render of the cut-out stalled for 28 minutes on a drive with
// 498 MB free instead of failing; After Effects' disk cache had grown to 42.1
// GB in one evening of Object Matte work, against a Disk Cache setting of 10 GB.

export const GB = 1e9;
export const gb = (n: number) => `${(n / GB).toFixed(1)} GB`;
/** On top of what a check writes (captures, pictures): 1 GB. */
export const PICTURE_MARGIN_BYTES = 1 * GB;
/** One raw RGBA capture at most (uncompressed 8 bit): the upper bound used for a check's files. */
export const captureBytes = (size: [number, number] | number[] | null | undefined) =>
  (Array.isArray(size) ? size[0] * size[1] : 1080 * 1920) * 4;

/** Free bytes on the volume holding `dir`, read on its nearest existing folder; null when it cannot be read. */
export async function statfsFree(dir: string): Promise<number | null> {
  let d = path.resolve(dir);
  for (;;) {
    try {
      const st = await fs.statfs(d);
      return Number(st.bavail) * Number(st.bsize);
    } catch {
      const up = path.dirname(d);
      if (up === d) return null;
      d = up;
    }
  }
}

/** null when `dir` has room for `needed` plus `margin`; otherwise a refusal that says the numbers. */
export async function spaceRefusal(
  io: { freeBytes?(dir: string): Promise<number | null> },
  dir: string,
  needed: number,
  margin: number,
  what: string,
): Promise<Json | null> {
  const free = await (io.freeBytes ?? statfsFree)(dir);
  if (free === null || free >= needed + margin) return null;
  return {
    ok: false,
    error:
      `only ${gb(free)} free on the drive holding ${dir}; ${what} needs about ${gb(needed)} plus a margin of ${gb(margin)} ` +
      "(After Effects writes its disk cache to the same drive while it renders, and a render on a nearly full drive stalls instead of failing). " +
      "Free some space first, for example by purging After Effects' cache: Edit > Purge > All Memory & Disk Cache. Nothing was rendered.",
    space: { free, needed: Math.round(needed), margin, where: dir },
  };
}

/**
 * After Effects' disk cache written while it tracks Object Matte through
 * `frames` frames of a source this size: one 16-bit RGBA frame of the source
 * per frame (8 bytes a pixel). Measured: one render of 320 frames of a 2176 x
 * 3840 take added about 19 GB (estimate 21.4 GB).
 */
export function cacheBytesFor(
  frames: number,
  sourceSize: [number, number] | number[] | null | undefined,
): number {
  const [w, h] = Array.isArray(sourceSize) && sourceSize.length >= 2 ? sourceSize : [1920, 1080];
  return frames * w * h * 8;
}

/** The volume holding `dir`: the device number of its nearest existing folder, or null. */
export async function volumeKey(dir: string): Promise<number | null> {
  let d = path.resolve(dir);
  for (;;) {
    try {
      return (await fs.stat(d)).dev;
    } catch {
      const up = path.dirname(d);
      if (up === d) return null;
      d = up;
    }
  }
}

export type SpaceParts = { movie?: number; cache?: number; pictures?: number };
export const PART_NAMES: Record<keyof SpaceParts, string> = {
  movie: "the movie",
  cache: "After Effects' disk cache",
  pictures: "captures and pictures",
};

/**
 * Room for each part on the drive that holds it: the parts on one volume are
 * added up and checked against that volume's free space plus `margin`. A
 * refusal names the first drive short of room, with every part and number.
 */
export async function spacePlan(
  io: {
    freeBytes?(dir: string): Promise<number | null>;
    volumeOf?(dir: string): Promise<string | number | null>;
  },
  entries: Array<{ where: string; parts: SpaceParts }>,
  margin: number,
  what: string,
): Promise<{ volumes: Json[]; refusal: Json | null }> {
  const byVol: Array<{ key: string | number | null; where: string; parts: SpaceParts }> = [];
  for (const e of entries) {
    const key = await (io.volumeOf ?? volumeKey)(e.where);
    const v = byVol.find((x) => x.key === key && key !== null);
    if (v)
      for (const [k, n] of Object.entries(e.parts))
        v.parts[k as keyof SpaceParts] = (v.parts[k as keyof SpaceParts] ?? 0) + (n ?? 0);
    else byVol.push({ key, where: e.where, parts: { ...e.parts } });
  }
  const volumes: Json[] = [];
  let refusal: Json | null = null;
  for (const v of byVol) {
    const free = await (io.freeBytes ?? statfsFree)(v.where);
    const needed = Object.values(v.parts).reduce((a, b) => a + (b ?? 0), 0);
    const ok = free === null || free >= needed + margin;
    const row = { where: v.where, free, parts: v.parts, needed: Math.round(needed), margin, ok };
    volumes.push(row);
    if (!ok && !refusal) {
      const partText = Object.entries(v.parts)
        .map(([k, n]) => `${PART_NAMES[k as keyof SpaceParts]} ${gb(n ?? 0)}`)
        .join(", ");
      refusal = {
        ok: false,
        error:
          `only ${gb(free as number)} free on the drive holding ${v.where}; ${what} needs about ${gb(needed)} there (${partText}) plus a margin of ${gb(margin)}. ` +
          "A render on a nearly full drive stalls instead of failing. Free some space first, for example by purging After Effects' cache: Edit > Purge > All Memory & Disk Cache. Nothing was rendered.",
        space: { ...row, volumes },
      };
    }
  }
  if (refusal) refusal.space.volumes = volumes;
  return { volumes, refusal };
}

/** The frames After Effects tracks through to render `frames`: the first to the last asked for. */
export const trackedSpan = (frames: number[]) =>
  frames.length ? Math.max(...frames) - Math.min(...frames) + 1 : 0;

/** Where After Effects keeps its disk cache: <Disk Cache folder>/Adobe/After Effects/<major.minor>. */
export function aeCacheRoot(
  folder: string | null | undefined,
  version: string | null | undefined,
): string | null {
  if (!folder || !version) return null;
  const m = /^(\d+)\.(\d+)/.exec(version);
  if (!m) return null;
  return path.join(folder, "Adobe", "After Effects", `${m[1]}.${m[2]}`);
}

/** Defaults for the frozen-outline finding (see outlineTracker); not yet calibrated live on a frozen and a real file. */
export const FROZEN_DEFAULTS = { gap: 30, limit: 0.002, minFrames: 60 };
export const frozenOpts = (args: Record<string, unknown>) => ({
  gap: typeof args.frozenGap === "number" ? args.frozenGap : FROZEN_DEFAULTS.gap,
  limit: typeof args.frozenLimit === "number" ? args.frozenLimit : FROZEN_DEFAULTS.limit,
  minFrames: typeof args.frozenFrames === "number" ? args.frozenFrames : FROZEN_DEFAULTS.minFrames,
});

/** A frozen run as a finding, with what it probably means and how to wave it through. */
export function frozenFinding(run: FrozenRun, pictures: Array<string | null>): Json {
  const moved = run.footageChange > 0.001;
  return {
    kind: "frozen",
    ...run,
    pictures,
    reading:
      `The cut-out's outline did not move for ${run.length} frames` +
      (moved
        ? ` while the footage did (frames ${run.from} to ${run.to}; ${(run.footageChange * 100).toFixed(1)}% of the frame changed inside the outline)`
        : ` (frames ${run.from} to ${run.to}), and the picture inside it barely changed either`) +
      ". The selection is probably not tracking: this happens when the layer's footage is replaced after the click. Click again on this footage (subject.prepare, then the steps). " +
      'If the subject is genuinely motionless (a product on a table, a locked-off object) this is expected: pass accept: [{ kind: "frozen" }] to wave it through once seen.',
  };
}

/** Time spent in the renders a call made, summed over its ae_render_frame calls (ms). */
export interface RenderTally {
  frames: number;
  calls: number;
  ms: number;
  aeCallMs: number;
  settleMs: number;
  renderNodeMs: number;
}
/** Time spent on the pixels in Node (ms): reading the files, finding regions, writing the pictures and the sheet. */
export interface PixelTally {
  frames: number;
  readMs: number;
  regionsMs: number;
  picturesMs: number;
  sheetMs: number;
  ms: number;
}
export const renderTally = (): RenderTally => ({
  frames: 0,
  calls: 0,
  ms: 0,
  aeCallMs: 0,
  settleMs: 0,
  renderNodeMs: 0,
});
export const pixelTally = (): PixelTally => ({
  frames: 0,
  readMs: 0,
  regionsMs: 0,
  picturesMs: 0,
  sheetMs: 0,
  ms: 0,
});
export const since = (t: number) => performance.now() - t;
export const roundTally = <T extends object>(t: T): T =>
  Object.fromEntries(
    Object.entries(t).map(([k, v]) => [k, typeof v === "number" ? Math.round(v) : v]),
  ) as T;

export interface RenderedFrame {
  frame: number;
  ok: boolean;
  file?: string;
  error?: string;
  edge?: Json;
}

/**
 * Render `frames` with `base` arguments, in as many ae_render_frame calls as
 * its settle limit needs at `perFrameMs` a frame. A call that fails marks its
 * frames failed; a frame that did not settle comes back failed with
 * ae_render_frame's error.
 */
export async function renderChunked(
  io: PixelIO,
  base: Record<string, unknown>,
  frames: number[],
  perFrameMs: number,
  outDir: string,
  stem: string,
  tally: RenderTally = renderTally(),
  firstCall = 0,
): Promise<RenderedFrame[]> {
  // ae_render_frame takes at most 32 frames a call, and its settle wait at most 600 s.
  const size = Math.max(1, Math.min(32, Math.floor(SETTLE_MAX_MS / perFrameMs)));
  const out: RenderedFrame[] = [];
  for (let c = 0; c * size < frames.length; c++) {
    const chunk = frames.slice(c * size, (c + 1) * size);
    const t0 = performance.now();
    const payload = await io.render({
      ...base,
      frames: chunk,
      outPath: path.join(outDir, `${stem}-${firstCall + c}.png`),
      settleTimeoutMs: Math.min(SETTLE_MAX_MS, Math.max(1, Math.round(perFrameMs * chunk.length))),
    });
    tally.calls++;
    tally.frames += chunk.length;
    tally.ms += since(t0);
    tally.aeCallMs += payload?.timing?.aeCallMs ?? 0;
    tally.settleMs += payload?.timing?.settleMs ?? payload?.captureSettle?.waitedMs ?? 0;
    tally.renderNodeMs += payload?.timing?.nodeMs ?? 0;
    if (!payload?.ok) {
      for (const frame of chunk)
        out.push({
          frame,
          ok: false,
          error: `the render call failed: ${payload?.error ?? "no result"}`,
        });
      continue;
    }
    const list: Json[] =
      payload.frames ?? (payload.writtenTo ? [{ ...payload, ok: true, frame: chunk[0] }] : []);
    for (const [i, frame] of chunk.entries()) {
      const f = list.find((x: Json) => x.frame === frame) ?? list[i];
      if (!f) out.push({ frame, ok: false, error: "not in the render's result" });
      else if (f.ok === false || typeof f.writtenTo !== "string")
        out.push({ frame, ok: false, error: f.error ?? "the frame was not written" });
      else out.push({ frame, ok: true, file: f.writtenTo, edge: f.edge });
    }
  }
  return out;
}

export function parseHex(c: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return [1, 0, 1];
  const v = parseInt(m[1], 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

export interface FrameReading {
  frame: number;
  checked: boolean;
  file?: string;
  picture?: string;
  holes: RegionBox[] | null;
  openings: RegionBox[] | null;
  opaqueShare?: number;
  holesUnderLimit?: { count: number; area: number };
  openingsUnderLimit?: { count: number; area: number };
  edgeWidth?: { typical: number | null; p90: number | null } | null;
  solidAreas?: number | null;
  error?: string;
}

/** Read each rendered frame's alpha: holes and openings, a picture over `over`, and one contact sheet. */
export async function measureFrames(
  io: PixelIO,
  rendered: RenderedFrame[],
  limit: number,
  over: string,
  sheetPath: string,
  tally: PixelTally = pixelTally(),
  pictures = true,
  onImage?: (r: FrameReading, img: DecodedPng) => void,
): Promise<{ readings: FrameReading[]; picture: string | null }> {
  const started = performance.now();
  const colour = parseHex(over);
  const readings: FrameReading[] = [];
  const thumbs: DecodedPng[] = [];
  const labels: string[] = [];
  const split = (list: RegionBox[]) => ({
    big: list.filter((r) => r.area >= limit),
    small: {
      count: list.filter((r) => r.area < limit).length,
      area: list.filter((r) => r.area < limit).reduce((s, r) => s + r.area, 0),
    },
  });
  for (const r of rendered) {
    if (!r.ok || !r.file) {
      readings.push({
        frame: r.frame,
        checked: false,
        holes: null,
        openings: null,
        error: r.error,
      });
      continue;
    }
    let img: DecodedPng;
    const tRead = performance.now();
    try {
      img = await io.readImage(r.file);
    } catch (err) {
      readings.push({
        frame: r.frame,
        checked: false,
        holes: null,
        openings: null,
        error: `could not read ${r.file}: ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    } finally {
      tally.readMs += since(tRead);
    }
    if (!img.alpha) {
      readings.push({
        frame: r.frame,
        checked: false,
        holes: null,
        openings: null,
        error: `${r.file} has no alpha channel`,
      });
      continue;
    }
    tally.frames++;
    const tRegions = performance.now();
    const regions = cutoutRegions(img.alpha, img.width, img.height);
    let opaquePx = 0;
    const alpha = img.alpha;
    for (let p = 0; p < alpha.length; p++) if (alpha[p] >= EDGE_DEFAULTS.opaque) opaquePx++;
    tally.regionsMs += since(tRegions);
    const h = split(regions.holes);
    const o = split(regions.openings);
    const tPic = performance.now();
    if (!pictures) {
      readings.push({
        frame: r.frame,
        checked: true,
        file: r.file,
        opaqueShare: Math.round((opaquePx / img.alpha.length) * 10000) / 10000,
        holes: h.big,
        openings: o.big,
        holesUnderLimit: h.small,
        openingsUnderLimit: o.small,
      });
      onImage?.(readings[readings.length - 1], img);
      continue;
    }
    const composite = flattenOver(img, { kind: "color", color: colour });
    const picture = r.file.replace(/\.png$/i, "") + "_over.png";
    await writePng(io, picture, encodePngSrgb8(img.width, img.height, composite, PICTURE_DEFLATE));
    const tw = Math.min(THUMB, img.width);
    const th = Math.max(1, Math.round((img.height * tw) / img.width));
    thumbs.push({
      width: tw,
      height: th,
      rgb: resample({ ...img, rgb: composite }, tw, th),
      bitDepth: 8,
    });
    labels.push(`frame ${r.frame}`);
    tally.picturesMs += since(tPic);
    readings.push({
      frame: r.frame,
      checked: true,
      file: r.file,
      picture,
      opaqueShare: Math.round((opaquePx / img.alpha.length) * 10000) / 10000,
      holes: h.big,
      openings: o.big,
      holesUnderLimit: h.small,
      openingsUnderLimit: o.small,
      edgeWidth: r.edge?.width
        ? { typical: r.edge.width.typical ?? null, p90: r.edge.width.p90 ?? null }
        : null,
      solidAreas: r.edge?.solidAreas?.count ?? null,
    });
    onImage?.(readings[readings.length - 1], img);
  }
  let picture: string | null = null;
  const tSheet = performance.now();
  if (thumbs.length) {
    const sheet = composeContactSheet(thumbs, { labels, thumbWidth: THUMB });
    await writePng(
      io,
      sheetPath,
      encodePngSrgb8(sheet.width, sheet.height, sheet.rgb, PICTURE_DEFLATE),
    );
    picture = sheetPath;
  }
  tally.sheetMs += since(tSheet);
  tally.ms += since(started);
  return { readings, picture };
}

export function regionLines(findings: RegionFinding[], frames: number) {
  return findings.map(
    (f) =>
      `${f.smallestArea === f.largestArea ? `${fmt(f.largestArea)} px` : `${fmt(f.smallestArea)} to ${fmt(f.largestArea)} px (largest on frame ${f.largestFrame})`} at ${boxText(f.box)} on ${f.frames.length} of ${frames} frames (${f.frames.join(", ")})` +
      (f.kind === "opening" && f.edges?.length
        ? `, reaches the ${f.edges.join(" and ")} edge`
        : ""),
  );
}

export const needSelection = (st: Json): string | null => {
  if (!st?.objectMatte?.present || !Array.isArray(st.selections) || st.selections.length === 0)
    return `${st?.summary ?? "no selection"}; ${NEED_CLICK}`;
  return null;
};

export const perFrameMsOf = (args: Record<string, unknown>) =>
  Math.max(
    1,
    Math.round(
      (typeof args.secondsPerFrame === "number" && args.secondsPerFrame > 0
        ? args.secondsPerFrame
        : CUTOUT_SECONDS_PER_FRAME) * 1000,
    ),
  );

/** The findings over the limit, the not-checked frames, and a plain statement, for a set of readings. */
export function summarize(
  readings: FrameReading[],
  limit: number,
  accept: AcceptEntry[],
  picture: string | null = null,
  passText: string | null = null,
) {
  const regions = cutoutFindings(readings, limit);
  const accepted = regions.filter((f) => acceptedBy(f, accept));
  const open = regions.filter((f) => !accepted.includes(f));
  const missed = readings.filter((r) => !r.checked);
  const checked = { frames: readings.length - missed.length, of: readings.length };
  const notChecked = missed.length
    ? [
        {
          kind: "not-checked",
          frames: missed.map((r) => r.frame),
          errors: [...new Set(missed.map((r) => r.error ?? "not rendered"))],
        },
      ]
    : [];
  const holes = open.filter((f) => f.kind === "hole");
  const openings = open.filter((f) => f.kind === "opening");
  const parts: string[] = [];
  parts.push(
    missed.length
      ? `Checked ${checked.frames} of ${checked.of} frames; ${missed.length} did not render (${missed.map((r) => r.frame).join(", ")}): ${notChecked[0].errors.join("; ")}. Those frames were not checked.`
      : `Checked ${checked.frames} of ${checked.of} frames.`,
  );
  if (holes.length)
    parts.push(
      `${plural(holes.length, "enclosed hole")} of ${fmt(limit)} px or more inside the cut-out: ${regionLines(holes, readings.length).join("; ")}. A hole is something in front of the subject not selected (a cup) or a gap inside a piece that no click fills (subject.fill_gaps).`,
    );
  if (openings.length)
    parts.push(
      `${plural(openings.length, "opening")} of ${fmt(limit)} px or more, closed off by the subject and the frame edge: ${regionLines(openings, readings.length).join("; ")}. An opening may be something in front of the subject left out (a microphone, a desk), or a real gap such as between an arm and the body; the picture decides.`,
    );
  if (!holes.length && !openings.length)
    parts.push(
      missed.length
        ? `No hole or opening of ${fmt(limit)} px or more on the ${checked.frames} frames checked; the other ${missed.length} were not checked.`
        : (passText ??
            `Nothing over the limit on ${checked.frames} of ${checked.of} frames; the picture is at ${picture ?? "(none)"}.`),
    );
  if (accepted.length)
    parts.push(
      `Accepted earlier and not counted: ${regionLines(accepted, readings.length).join("; ")}.`,
    );
  return { findings: [...open, ...notChecked] as Json[], accepted, checked, text: parts.join(" ") };
}

export type KindRegion = RegionBox & { kind: "hole" | "opening" };
export const regionsOf = (r: FrameReading): KindRegion[] => [
  ...(r.holes ?? []).map((x) => ({ ...x, kind: "hole" as const })),
  ...(r.openings ?? []).map((x) => ({ ...x, kind: "opening" as const })),
];

/** A rendered frame drawn over the flat colour, written next to it as <file>_over.png. */
export async function overPicture(io: PixelIO, file: string, over: string): Promise<string | null> {
  try {
    const img = await io.readImage(file);
    const picture = file.replace(/\.png$/i, "") + "_over.png";
    await writePng(
      io,
      picture,
      encodePngSrgb8(
        img.width,
        img.height,
        flattenOver(img, { kind: "color", color: parseHex(over) }),
        PICTURE_DEFLATE,
      ),
    );
    return picture;
  } catch {
    return null;
  }
}

/** JSX: remove subject.fill_gaps' two layers and its imported still. */
export function fillUnbuildJsx(args: {
  comp: unknown;
  fillLayer: string;
  maskLayer: string;
  stillItemId: number | null;
}): string {
  return `
            ${jsxCompPreamble(args as Record<string, unknown>)}
            var _names = [${jsxVal(args.fillLayer)}, ${jsxVal(args.maskLayer)}];
            var _removed = [];
            for (var _ni = 0; _ni < _names.length; _ni++) {
                for (var _li = _comp.numLayers; _li >= 1; _li--) {
                    var _l = _comp.layer(_li);
                    if (_l.name === _names[_ni]) { _l.remove(); _removed.push(_names[_ni]); break; }
                }
            }
            var _id = ${jsxVal(args.stillItemId)};
            if (_id !== null) {
                var _item = AE.safeGet(function () { return app.project.itemByID(_id); }, null);
                if (_item) { var _iname = _item.name; _item.remove(); _removed.push(_iname); }
            }
            return { ok: true, removed: _removed };
        `;
}

/**
 * JSX for subject.fill_gaps' build: import the still, add it as a hidden
 * layer, duplicate the footage layer directly under the cut-out with its
 * Object Matte removed, and give the copy the still as its luma track matte
 * (setTrackMatte; its ALPHA form was confirmed in After Effects 27.0, LUMA was
 * not). Refuses when a fill is already there.
 */
export function fillBuildJsx(args: { comp: unknown; layer: unknown; stillPath: string }): string {
  return `
            ${jsxCompLayerPreamble(args as Record<string, unknown>)}
            var _fillName = _layer.name + " gap fill";
            var _maskName = _layer.name + " gap mask";
            for (var _li = 1; _li <= _comp.numLayers; _li++) {
                var _ln = _comp.layer(_li).name;
                if (_ln === _fillName || _ln === _maskName) return { ok: false, error: "comp " + _comp.name + " already has a layer '" + _ln + "'; delete the earlier fill's two layers first" };
            }
            var _file = new File(${jsxVal(args.stillPath)});
            if (!_file.exists) return { ok: false, error: "no file at " + ${jsxVal(args.stillPath)} };
            var _item = app.project.importFile(new ImportOptions(_file));
            var _mask = _comp.layers.add(_item);
            _mask.name = _maskName;
            var _fill = _layer.duplicate();
            _fill.name = _fillName;
            var _fxs = _fill.property("ADBE Effect Parade");
            var _removed = 0;
            if (_fxs) {
                for (var _fi = _fxs.numProperties; _fi >= 1; _fi--) {
                    if (_fxs.property(_fi).matchName === ${jsxVal(OBJECT_MATTE_MATCH_NAME)}) { _fxs.property(_fi).remove(); _removed++; }
                }
            }
            _fill.moveAfter(_layer);
            _mask.moveBefore(_fill);
            var _spanError = null;
            try {
                _mask.startTime = 0;
                _mask.inPoint = Math.min(_layer.inPoint, _layer.outPoint);
                _mask.outPoint = Math.max(_layer.inPoint, _layer.outPoint);
            } catch (eSpan) { _spanError = AE.errText(eSpan); }
            _fill.setTrackMatte(_mask, TrackMatteType.LUMA);
            _mask.enabled = false;
            var _audioOff = false;
            var _audioError = null;
            if (AE.safeGet(function () { return _fill.hasAudio; }, false)) {
                try { _fill.audioEnabled = false; _audioOff = true; } catch (eAud) { _audioError = AE.errText(eAud); }
            }
            var _out = { ok: true, fillLayer: _fill.name, fillIndex: _fill.index, maskLayer: _mask.name, maskIndex: _mask.index, stillItem: _item.name, stillItemId: AE.safeGet(function () { return _item.id; }, null), removedFromCopy: _removed, audioOff: _audioOff, hasAudio: AE.safeGet(function () { return _fill.hasAudio; }, false) };
            if (_audioError !== null) _out.audioError = _audioError;
            if (_spanError !== null) _out.maskSpanError = _spanError;
            return _out;
        `;
}

/** The CutoutIO a live call uses: subject.status and ae_render_frame through `transport`. */
export function liveCutoutIO(args: Record<string, unknown>, transport: AeTransport): CutoutIO {
  return {
    async status() {
      const code = getOp("subject.status")!.toJsx({
        comp: args.comp,
        layer: args.layer,
        effectIndex: args.effectIndex,
      });
      const r = await transport.execute({
        code,
        label: "subject.status",
        undoGroup: false,
        timeoutMs: 30_000,
      });
      return r.ok ? r.result : { ok: false, error: r.error ?? "subject.status failed" };
    },
    async render(renderArgs) {
      const out = await renderFrameTool.handler(renderArgs as never, transport);
      const sc = out.structuredContent as Json;
      if (out.isError)
        return {
          ok: false,
          error: sc?.error?.message ?? sc?.error ?? "ae_render_frame failed",
          details: sc,
        };
      return sc?.result ?? { ok: false, error: "ae_render_frame returned no result" };
    },
    async readImage(file) {
      return decodePng(await fs.readFile(file));
    },
    async unbuild(a) {
      const r = await transport.execute({
        code: fillUnbuildJsx(a),
        label: "subject.fill_gaps undo",
        undoGroup: true,
        suppressDialogs: true,
        timeoutMs: 60_000,
      });
      return r.ok ? r.result : { ok: false, error: r.error ?? "undoing the build failed" };
    },
    async build(a) {
      const r = await transport.execute({
        code: fillBuildJsx(a),
        label: "subject.fill_gaps",
        undoGroup: true,
        suppressDialogs: true,
        rollback: true,
        timeoutMs: 60_000,
      });
      return r.ok
        ? r.result
        : { ok: false, error: r.error ?? "the build failed", rollback: r.rollback };
    },
  };
}

export const NODE_ONLY = (name: string) =>
  jsxFail(
    `${name} runs in Node (it reads pixels), so it cannot ride inside batch.run; call it through ae_do`,
  );
export const overParam = {
  name: "over",
  type: "string" as const,
  description: `The flat colour of the picture (default '${CUTOUT_OVER}').`,
  required: false,
};

// ------------------------------------------------------------------------
// Stage 12c: render the cut-out once, check the file, build on the file.
// After Effects recomputes Object Matte on every capture (nine frames across
// a 320-frame take cost 236 to 287 s on each of five identical renders), and
// a script cannot freeze it. Rendered once to a movie with alpha (390 s for
// all 320 frames), the cut-out reads back at about 0.55 s a frame and cannot
// change afterwards. These three operations do that.

/** What subject.render_cutout and subject.check_file need from After Effects. */
export interface FileIO extends PixelIO {
  /** Run ExtendScript; its result, or { ok: false, error }. */
  execute(
    code: string,
    opts: { label: string; timeoutMs: number; undoGroup?: boolean },
  ): Promise<Json>;
  /** Whether a file exists on this machine (default: fs.access). */
  exists?(file: string): Promise<boolean>;
}

/** Default most frames subject.check_file reads one by one; beyond it, it reads pairs in steps. About 0.55 s a frame measured. */
export const CHECK_FILE_MAX_FRAMES = 400;

/** JSX: the movie (a file, or a footage item by id) in a throwaway comp of its own size. */
export function fileCompJsx(args: { path: string | null; item: number | null }): string {
  return `
            var _item = null;
            var _imported = false;
            if (${jsxVal(args.item)} !== null) {
                _item = AE.safeGet(function () { return app.project.itemByID(${jsxVal(args.item)}); }, null);
                if (!_item) return { ok: false, error: "no project item with id " + ${jsxVal(args.item)} };
            } else {
                var _f = new File(${jsxVal(args.path)});
                if (!_f.exists) return { ok: false, error: "no file at " + ${jsxVal(args.path)} };
                _item = app.project.importFile(new ImportOptions(_f));
                _imported = true;
            }
            if (!AE.safeGet(function () { return _item.hasVideo; }, false)) return { ok: false, error: "'" + _item.name + "' has no video" };
            var _fr = AE.safeGet(function () { return _item.frameRate; }, 0) || 30;
            var _dur = _item.duration;
            var _c = app.project.items.addComp("check_file " + _item.name, _item.width, _item.height, AE.safeGet(function () { return _item.pixelAspect; }, 1) || 1, _dur, _fr);
            _c.layers.add(_item);
            return { ok: true, compId: _c.id, compName: _c.name, itemId: _item.id, itemName: _item.name, imported: _imported,
                width: _item.width, height: _item.height, frames: Math.round(_dur * _fr), frameRate: _fr };
        `;
}

/** JSX: remove the throwaway comp, and the imported footage item when asked. */
export function fileCleanupJsx(args: {
  compId: number;
  itemId: number | null;
  removeItem: boolean;
}): string {
  return `
            var _removed = [];
            var _c = AE.safeGet(function () { return app.project.itemByID(${jsxVal(args.compId)}); }, null);
            if (_c) { var _cn = _c.name; _c.remove(); _removed.push(_cn); }
            var removeItem = ${jsxVal(args.removeItem)};
            if (removeItem && ${jsxVal(args.itemId)} !== null) {
                var _it = AE.safeGet(function () { return app.project.itemByID(${jsxVal(args.itemId)}); }, null);
                if (_it) { var _in = _it.name; _it.remove(); _removed.push(_in); }
            }
            return { ok: true, removed: _removed };
        `;
}

/** The FileIO a live call uses. */
export function liveFileIO(transport: AeTransport): FileIO {
  const cut = liveCutoutIO({}, transport);
  return {
    render: cut.render,
    readImage: cut.readImage,
    async execute(code, opts) {
      const r = await transport.execute({
        code,
        label: opts.label,
        timeoutMs: opts.timeoutMs,
        undoGroup: opts.undoGroup ?? true,
        suppressDialogs: true,
      });
      return r.ok ? r.result : { ok: false, error: r.error ?? `${opts.label} failed` };
    },
    exists: (file) =>
      fs.access(file).then(
        () => true,
        () => false,
      ),
  };
}

// ---------------------------------------------------------------------------
// subject.soften_edge: a softer edge inside a region (keying.md, Recipe 3, look C)
// ---------------------------------------------------------------------------

/**
 * Look C of keying.md fact 39, the user's choice for a person: Base Refine
 * Edge Radius 8, Smooth 0, Chatter Reduction 2, Decontaminate Edge Colors on
 * both copies. The region is everything above a line; by default that line
 * sits `regionDepth` of the comp's height under the lowest top of the subject
 * on the frames sampled (on the half-size take: tops 776 to 792, line 1022,
 * where the hair ends at the temples). Feather 60 px, as measured.
 */
export const SOFT_EDGE_DEFAULTS = {
  radius: 8,
  smooth: 0,
  chatterReduction: 2,
  decontaminate: true,
  feather: 60,
  regionDepth: 0.12,
  /** By default the check samples the click frame and every `nearStep`th frame after it, up to `near` frames on. */
  near: 60,
  nearStep: 10,
  /** The closing check: a pixel solid in the matte as clicked and more than this far inside its edge must stay solid. */
  deep: 30,
  /** Matte more than this far outside the outline as clicked counts as spread (a smear). */
  outside: 10,
  /** Spread pixels allowed before the build is undone (look C left 0 to 12 px on the take; look D's smear was 156). */
  outsideLimit: 50,
  /** Face colour against the matte as clicked, CIELAB difference allowed. */
  colourLimit: 1,
};

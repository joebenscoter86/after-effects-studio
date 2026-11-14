// Subject operations, check and fill: subject.check, subject.fill_gaps.
// Moved whole from keying.ts (which still registers them, in their order, and re-exports what it exported).

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { cutoutRegions, outlineTracker, EDGE_DEFAULTS, enclosedHoles, growMask, type Box } from "../color/matte.js";
import { encodePngGray8, type DecodedPng } from "../color/png16.js";
import { rejectedOutputPath } from "../config.js";
import { registerOp } from "../registry.js";
import { CLOSE_CLICK_SHARE, COUNT_NOTE, CUTOUT_HOLE_LIMIT, CUTOUT_OVER, CUTOUT_SECONDS_PER_FRAME, NODE_ONLY, PICTURE_MARGIN_BYTES, acceptedBy, aeCacheRoot, alikeRegions, cacheBytesFor, captureBytes, compLayerParams, fmt, frozenAccepted, frozenFinding, frozenOpts, intersects, liveCutoutIO, measureFrames, needSelection, overParam, overPicture, perFrameMsOf, pixelTally, plural, regionsOf, renderChunked, renderTally, roundTally, since, spacePlan, subjectIndexParam, summarize, trackedSpan, writePng, type AcceptEntry, type CutoutIO, type FrameReading, type Json, type KindRegion, type PixelTally, type RegionFinding, type RenderTally } from "./keying-shared.js";


export interface CloseClick {
  a: string;
  b: string;
  distance: number;
  limit: number;
  reading: string;
}

const closeClickReading = (a: string, b: string, d: number, limit: number) =>
  `${a} and ${b} were clicked ${Math.round(d)} source pixels apart (closer than ${Math.round(limit)}): ` +
  "they probably selected the same thing, so a click meant for something else (a microphone) may have landed on the subject again";

/**
 * Pairs of selections whose clicked points (source pixels) are closer than
 * `minDistance`, default CLOSE_CLICK_SHARE of the source's shorter side. The
 * two mistaken clicks of 2026-11-11 were 57 px apart on a 2176 x 3840 source;
 * the click on the microphone was about 820 px from them.
 */
export function closeClicks(
  clicks: Array<{ name: string; point: [number, number] | number[] | null }>,
  sourceSize: [number, number] | number[] | null,
  minDistance?: number,
): CloseClick[] {
  const limit =
    minDistance ??
    (sourceSize
      ? Math.round(CLOSE_CLICK_SHARE * Math.min(sourceSize[0], sourceSize[1]) * 100) / 100
      : null);
  if (limit === null) return [];
  const out: CloseClick[] = [];
  const pts = clicks.filter((c) => Array.isArray(c.point) && c.point.length >= 2);
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      const p = pts[i].point as number[];
      const q = pts[j].point as number[];
      const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (d < limit)
        out.push({
          a: pts[i].name,
          b: pts[j].name,
          distance: Math.round(d * 100) / 100,
          limit,
          reading: closeClickReading(pts[i].name, pts[j].name, d, limit),
        });
    }
  return out;
}
// From the build record of 2026-11-11 at 1080 x 1920: a missed microphone left
// an opening of about 115,000 px (it ran off the bottom of the frame), a gap in
// its shock mount a hole of about 4,500 px, an arm against the body an opening
// of about 10,400 px, and the leftovers after filling were 7 to 835 px.
const CUTOUT_FRAMES = 8;
const EDGE_TRANSPARENT = EDGE_DEFAULTS.transparent;

const QUICK_NOTE =
  "Quick check: the click frames and two frames either side, which After Effects renders in seconds. A missed object, an enclosed gap and a second click on the same thing show there. " +
  "To look across the clip, render the cut-out once (subject.render_cutout) and check the file (subject.check_file); across: true checks the live matte across the clip instead, which takes minutes (4 to 9 for nine frames on a 2176 x 3840 take), because After Effects recomputes the matte on every capture.";
const ACROSS_NOTE =
  "Across the clip on the live matte: After Effects recomputes the matte on every capture, so this takes minutes (4 to 9 for nine frames on a 2176 x 3840 take). Rendering the cut-out once (subject.render_cutout) and checking the file (subject.check_file) reads every frame in about the time of one pass.";

/** The quick check's frames: each click frame and two either side, inside the layer; the layer's first three frames when no click frame is known. */
function quickFrames(span: Json, clickFrames: Array<number | null | undefined>): number[] {
  const a = span?.inFrame ?? 0;
  const b = span?.outFrame ?? a + 3;
  const set = new Set<number>();
  for (const c of clickFrames) {
    if (typeof c !== "number") continue;
    for (let d = -2; d <= 2; d++) {
      const f = Math.round(c) + d;
      if (f >= a && f < b) set.add(f);
    }
  }
  if (!set.size) for (let f = a; f < Math.min(b, a + 3); f++) set.add(f);
  return [...set].sort((x, y) => x - y);
}

/** Frames to look at: `count` evenly spaced across the layer, plus `extra`, inside the layer, sorted. */
function framesAcross(
  span: Json,
  count: number,
  extra: Array<number | null | undefined>,
): number[] {
  const a = span?.inFrame ?? 0;
  const b = span?.outFrame ?? a + 1;
  const set = new Set<number>();
  for (let i = 0; i < count; i++) set.add(a + Math.floor((i * (b - a)) / count));
  for (const e of extra) if (typeof e === "number" && e >= a && e < b) set.add(Math.round(e));
  return [...set].sort((x, y) => x - y).slice(0, 64);
}

const TAKES_MINUTES =
  "This check can take minutes: on a 2176 x 3840 take each frame took 20 to 40 s the first time (the matte is tracked from the click), well under a second once rendered; tell the user before it runs on a long or large clip.";

const RECHECK_NOTE =
  "Each frame with a hole or opening over the limit was rendered a second time at the end. After Effects may have served the second render from its cache, so two renders that agree do not show the frame is stable; " +
  "a frame that differed between them did come out differently (on 2026-11-11 frame 0 of a take rendered once without the microphone and then with it; the cause is not known).";

/** Render once more each frame with a region over the limit, and report the frames whose regions differ. */
async function recheckFrames(
  io: CutoutIO,
  readings: FrameReading[],
  limit: number,
  over: string,
  outDir: string,
  perFrameMs: number,
  base: Record<string, unknown>,
  accept: AcceptEntry[],
  renders: RenderTally,
  pixels: PixelTally,
) {
  // A region the user accepted needs no second look; a frame whose regions are all accepted is not rendered again.
  const isAccepted = (x: KindRegion) =>
    acceptedBy(
      { kind: x.kind, box: { x: x.x, y: x.y, width: x.width, height: x.height } } as RegionFinding,
      accept,
    );
  const withRegions = readings.filter((r) => r.checked && regionsOf(r).length > 0);
  const first = withRegions.filter((r) => !regionsOf(r).every(isAccepted));
  const skippedAccepted = withRegions.length - first.length;
  const frames = first.map((r) => r.frame);
  if (!frames.length)
    return {
      frames,
      agreed: 0,
      differed: [] as number[],
      failed: [] as number[],
      skippedAccepted,
      unstable: [] as Json[],
      note: skippedAccepted
        ? `No frame was rendered a second time: the regions on ${plural(skippedAccepted, "frame")} were all accepted.`
        : "No frame had a hole or opening over the limit, so none was rendered a second time.",
    };
  const rendered = await renderChunked(
    io,
    base,
    frames,
    perFrameMs,
    outDir,
    "cutout-recheck",
    renders,
  );
  // Regions only: a picture is drawn afterwards for a frame that differs, not for the ones that agree.
  const { readings: again } = await measureFrames(
    io,
    rendered,
    limit,
    over,
    path.join(outDir, "cutout-recheck_sheet.png"),
    pixels,
    false,
  );
  const unstable: Json[] = [];
  const failed: number[] = [];
  let agreed = 0;
  const brief = (rs: KindRegion[]) =>
    rs.map((x) => ({
      kind: x.kind,
      area: x.area,
      box: { x: x.x, y: x.y, width: x.width, height: x.height },
    }));
  for (const a of first) {
    const b = again.find((x) => x.frame === a.frame);
    if (!b || !b.checked) {
      failed.push(a.frame);
      continue;
    }
    const ra = regionsOf(a);
    const rb = regionsOf(b);
    const matched = (x: KindRegion, ys: KindRegion[]) =>
      ys.some((y) => y.kind === x.kind && alikeRegions(x, y));
    if (ra.every((x) => matched(x, rb)) && rb.every((y) => matched(y, ra))) {
      agreed++;
      continue;
    }
    const tPic = performance.now();
    const secondPicture = b.file ? await overPicture(io, b.file, over) : null;
    pixels.picturesMs += since(tPic);
    pixels.ms += since(tPic);
    unstable.push({
      kind: "unstable",
      frame: a.frame,
      first: { regions: brief(ra), opaqueShare: a.opaqueShare ?? null, picture: a.picture },
      second: { regions: brief(rb), opaqueShare: b.opaqueShare ?? null, picture: secondPicture },
      reading:
        `Frame ${a.frame}: the cut-out differed between two renders of the same frame ` +
        `(opaque share ${a.opaqueShare} then ${b.opaqueShare}; ${plural(ra.length, "region")} then ${rb.length} over the limit). Both pictures are kept.`,
    });
  }
  return {
    frames,
    agreed,
    differed: unstable.map((u) => u.frame),
    failed,
    skippedAccepted,
    unstable,
    captures: again.map((r) => r.file).filter((f): f is string => typeof f === "string"),
    note:
      RECHECK_NOTE +
      (failed.length
        ? ` Frames ${failed.join(", ")} did not render the second time and were not compared.`
        : "") +
      (skippedAccepted
        ? ` ${plural(skippedAccepted, "frame")} whose regions were all accepted ${skippedAccepted === 1 ? "was" : "were"} not rendered again.`
        : ""),
  };
}

const closeHead = (pairs: CloseClick[]) =>
  `${plural(pairs.length, "pair")} of clicks closer than ${Math.round(pairs[0].limit)} source pixels ` +
  `(${pairs
    .slice(0, 3)
    .map((p) => `${p.a} and ${p.b}`)
    .join("; ")}${pairs.length > 3 ? `; and ${pairs.length - 3} more` : ""})`;

/** Close clicks on a matte with nothing missing: said once, and no stop. */
function closeNote(pairs: CloseClick[]): string {
  return `Clicks: ${closeHead(pairs)}. Nothing is missing, so they need not change anything; they are close together and probably redundant, and can be removed (notes gives the commands).`;
}

/** The later click of each close pair. */
function laterClicks(pairs: CloseClick[]): string[] {
  const num = (n: string) => Number(/(\d+)\s*$/.exec(n)?.[1] ?? -1);
  return [...new Set(pairs.map((p) => (num(p.a) >= num(p.b) ? p.a : p.b)))];
}

/** Optional on a clean matte: removing the redundant clicks. */
function closeNoteAdvice(pairs: CloseClick[]): string {
  return (
    "To remove the redundant clicks, take the later one of each pair out: " +
    laterClicks(pairs)
      .map((n) => `subject.remove_selection { selection: "${n}" }`)
      .join(", then ") +
    ". Measured twice: on the take of 2026-11-11 the matte did not change when the redundant click was removed (opaque share 0.3083 before and after on frame 0); on 2026-11-12, removing five of twelve close clicks left the click frame identical and the opaque share the same on the frames near it, with only a thin band along the outline different elsewhere (After Effects tracking again after the change). Then run subject.check again. Leaving them in is also fine."
  );
}

/** Close clicks alongside something missing: the click meant for it may have landed on the subject again. */
function closeMissText(pairs: CloseClick[]): string {
  return `Clicks: ${closeHead(pairs)}. With something missing, two of them probably selected the same thing, so a click meant for something else (a microphone) may have landed on the subject again; the close-clicks finding says which to take out.`;
}

/** What to do about two clicks on the same thing: take the later one out. */
function closeAdvice(pairs: CloseClick[]): string {
  return (
    "When both clicks are on the same thing, take the later one out: " +
    laterClicks(pairs)
      .map((n) => `subject.remove_selection { selection: "${n}" }`)
      .join(", then ") +
    ". On the take of 2026-11-11 the matte did not change when the redundant click was removed (opaque share 0.3083 before and after on frame 0). If the later click was meant for something else (a microphone), ask for that click again."
  );
}

function checkTiming(
  statusMs: number,
  first: RenderTally,
  second: RenderTally,
  pixels: PixelTally,
  totalMs: number,
) {
  return {
    statusMs: Math.round(statusMs),
    firstRender: roundTally(first),
    secondRender: roundTally(second),
    pixels: roundTally(pixels),
    totalMs: Math.round(totalMs),
  };
}

const secs = (ms: number) => (ms / 1000).toFixed(1);

/** One sentence on where the time went, for the skill to tell the user how long a check takes. */
function timeReading(
  first: RenderTally,
  second: RenderTally,
  pixels: PixelTally,
  totalMs: number,
): string {
  const ae = first.aeCallMs + second.aeCallMs;
  const settle = first.settleMs + second.settleMs;
  const renderNode = first.renderNodeMs + second.renderNodeMs;
  const frames = first.frames + second.frames;
  const head =
    `This check took ${secs(totalMs)} s: ${secs(ae)} s in After Effects rendering ${plural(frames, "frame")} ` +
    `(${first.frames} first, ${second.frames} again), ${secs(settle)} s waiting for the files to finish writing, ` +
    `${secs(renderNode + pixels.ms)} s in Node (${secs(pixels.ms)} s of it reading the pixels and drawing the pictures).`;
  const share = totalMs > 0 ? (ae + settle) / totalMs : 0;
  return share >= 0.6 && frames > 0
    ? `${head} Most of it was After Effects rendering, about ${secs((ae + settle) / frames)} s a frame; frames it has rendered before are much quicker.`
    : head;
}

export async function runSubjectCheck(args: Record<string, unknown>, io: CutoutIO): Promise<Json> {
  const outDir = args.outDir;
  if (typeof outDir !== "string" || !path.isAbsolute(outDir))
    return { ok: false, error: "`outDir` must be an absolute folder for the pictures" };
  const limit = typeof args.holeLimit === "number" ? args.holeLimit : CUTOUT_HOLE_LIMIT;
  const over = typeof args.over === "string" ? args.over : CUTOUT_OVER;
  const accept = Array.isArray(args.accept) ? (args.accept as AcceptEntry[]) : [];
  const started = performance.now();
  const st = await io.status();
  const statusMs = since(started);
  if (!st?.ok) return { ok: false, error: st?.error ?? "subject.status failed", status: st };
  const missing = needSelection(st);
  if (missing) return { ok: false, error: missing };
  const first = renderTally();
  const second = renderTally();
  const pixels = pixelTally();
  const clicks = (st.selections as Json[]).map((s) => ({
    name: s.name,
    kind: s.kind,
    point: s.point ?? null,
    clickTime: s.clickTime ?? null,
    clickFrame: s.clickFrame ?? null,
  }));
  const across = args.across === true;
  const clickFrames = [args.clickFrame as number | undefined, ...clicks.map((c) => c.clickFrame)];
  const frames = Array.isArray(args.frames)
    ? (args.frames as number[]).slice().sort((a, b) => a - b)
    : across
      ? framesAcross(
          st.span,
          typeof args.count === "number" ? args.count : CUTOUT_FRAMES,
          clickFrames,
        )
      : quickFrames(st.span, clickFrames);
  const checkSpace = await spacePlan(
    io,
    [
      { where: outDir, parts: { pictures: frames.length * 2 * 2 * captureBytes(st.compSize) } },
      // After Effects tracks the matte through every frame from the first to the last asked for.
      {
        where: aeCacheRoot(st.aeCache?.folder, st.aeCache?.version) ?? outDir,
        parts: { cache: cacheBytesFor(trackedSpan(frames), st.sourceSize ?? st.compSize) },
      },
    ],
    PICTURE_MARGIN_BYTES,
    "this check",
  );
  if (checkSpace.refusal) return checkSpace.refusal;
  // After subject.fill_gaps the delivered cut-out is the layer and its gap fill together.
  const fillLayer: string | null = typeof st.fillLayer === "string" ? st.fillLayer : null;
  // After subject.soften_edge the cut-out is its precomp layer, not the matted layer (switched off).
  const cutLayer = typeof st.softEdge?.layer === "string" ? st.softEdge.layer : args.layer;
  const isolate = fillLayer ? [cutLayer, fillLayer] : cutLayer;
  const outline = outlineTracker(frozenOpts(args));
  const rendered = await renderChunked(
    io,
    { compNameOrId: args.comp, isolate, channels: "rgba", edge: true },
    frames,
    perFrameMsOf(args),
    outDir,
    "cutout",
    first,
  );
  const { readings, picture } = await measureFrames(
    io,
    rendered,
    limit,
    over,
    path.join(outDir, "cutout_sheet.png"),
    pixels,
    true,
    (r, img) => {
      if (img.alpha) outline.add(r.frame, img.alpha, img.rgb, img.width, img.height);
    },
  );
  const outlineResult = outline.result();
  const sum = summarize(readings, limit, accept, picture);
  const close = closeClicks(clicks, st.sourceSize ?? null);
  const findings: Json[] = [...sum.findings];
  const recheck =
    args.recheck === false
      ? { skipped: true, note: "recheck: false; no frame was rendered a second time" }
      : await recheckFrames(
          io,
          readings,
          limit,
          over,
          outDir,
          perFrameMsOf(args),
          // No edge report on the second render: only the regions are compared (edge costs about 1 s a 1080 x 1920 frame).
          { compNameOrId: args.comp, isolate, channels: "rgba" },
          accept,
          second,
          pixels,
        );
  if ("unstable" in recheck) findings.push(...recheck.unstable);
  const frozenAcceptedRuns: Json[] = [];
  for (const run of outlineResult.frozen) {
    if (frozenAccepted(run, accept)) {
      frozenAcceptedRuns.push({ kind: "frozen", ...run });
      continue;
    }
    const pic = (f: number) => readings.find((r) => r.frame === f)?.picture ?? null;
    findings.push(frozenFinding(run, [pic(run.from), pic(run.to)]));
  }
  // Close clicks explain a miss (a click meant for the microphone that landed on the chest); on a
  // matte with nothing missing they are the pieces of something clicked one by one, as the steps ask.
  const somethingMissing = findings.length > 0;
  const notes: Json[] = [];
  if (close.length && somethingMissing)
    findings.push({ kind: "close-clicks", pairs: close, advice: closeAdvice(close) });
  else if (close.length)
    notes.push({
      kind: "close-clicks",
      pairs: close,
      reading: closeNote(close),
      advice: closeNoteAdvice(close),
    });
  const rects = clicks.filter((c) => c.kind === "rectangle").map((c) => c.name);
  const solid = readings.find((r) => typeof r.solidAreas === "number")?.solidAreas;
  const inText =
    `In: ${st.summary}` +
    (fillLayer ? ` (with its gap fill (${fillLayer}))` : "") +
    (typeof solid === "number"
      ? `, making ${plural(solid, "solid area")} on the first frame checked`
      : "") +
    ".";
  const clickText = !close.length
    ? ""
    : somethingMissing
      ? ` ${closeMissText(close)}`
      : ` ${closeNote(close)}`;
  const rectText = rects.length
    ? ` ${rects.join(", ")}: a click that dragged a little; it may hold nothing (subject.remove_selection).`
    : "";
  const pictureText = picture
    ? ` Look at the picture (${picture}): it shows what no number does, such as the background kept or something the brief names left out.`
    : " No frame rendered, so there is no picture.";
  const stop = findings.length > 0;
  // The raw captures have been read (and drawn over the flat colour); they go now unless the caller keeps them.
  if (args.keepCaptures !== true) {
    const files = [
      ...readings.map((r) => r.file),
      ...("captures" in recheck ? (recheck.captures as string[]) : []),
    ].filter((f): f is string => typeof f === "string");
    await Promise.all(files.map((f) => fs.rm(f, { force: true })));
    for (const r of readings) delete r.file;
  }
  return {
    ok: true,
    layer: st.layer,
    fillLayer,
    stop,
    findings,
    notes,
    accepted: [...sum.accepted, ...frozenAcceptedRuns],
    outline: outlineResult,
    checked: sum.checked,
    recheck:
      "unstable" in recheck
        ? {
            frames: recheck.frames,
            agreed: recheck.agreed,
            differed: recheck.differed,
            failed: recheck.failed,
            skippedAccepted: recheck.skippedAccepted,
            note: recheck.note,
          }
        : recheck,
    inOut: `${inText} ${sum.text}${clickText}${rectText}${stop || !picture ? pictureText : ""}`,
    picture,
    frames: readings,
    clicks,
    countNote: COUNT_NOTE,
    scope: {
      across: across && !Array.isArray(args.frames),
      frames,
      note: across || Array.isArray(args.frames) ? ACROSS_NOTE : QUICK_NOTE,
    },
    timing: checkTiming(statusMs, first, second, pixels, since(started)),
    timeReading: timeReading(first, second, pixels, since(started)),
    holeLimit: limit,
    next: stop
      ? "Stop. In your reply, before the next call, tell the user what is out in plain words and give the picture's path; then fix it, before building anything else. " +
        (findings.some((f) => f.kind === "unstable")
          ? "A frame came out differently on two renders (kind 'unstable'): run subject.check again, and look at the first frames of the delivered video as well. "
          : "") +
        "Something left out needs another click (subject.prepare, then the steps); a wrong extra click comes out with subject.remove_selection; an enclosed gap no click fills goes to subject.fill_gaps, without `only` (every enclosed gap at once: one under the limit here can grow past it on other frames; openings are never filled). " +
        "When the user says a region shown is fine (a real gap between an arm and the body), run subject.check again with accept: [that finding's box] (an opening), or accept: [{ box, kind: 'hole' }] for a hole, so it is not shown again. Two clicks on the same thing: take the later one out with subject.remove_selection. " +
        "Frames not checked: run subject.check again on those frames with a larger secondsPerFrame. " +
        TAKES_MINUTES
      : "Nothing over the limit. Still look at the picture yourself and tell the user what is in and what is out before building on the cut-out. " +
        TAKES_MINUTES,
  };
}

const FILL_LIMITS = (frame: number) => [
  `The still comes from one frame (frame ${frame}): it assumes a locked camera and that what is in front of the subject does not move. Anything that moves away from the still's gaps shows through the fill.`,
  "What shows through a filled gap is whatever is behind it in the footage. That is the subject only while the subject is behind the gap.",
  "Every enclosed gap at that frame is filled, including a real one (between an arm and the body) where the background will show, and including those under the limit, which can grow past it on other frames; pass `only` boxes only to keep a real enclosed gap unfilled. Openings (regions that reach the frame edge) are never filled.",
];

export async function runFillGaps(args: Record<string, unknown>, io: CutoutIO): Promise<Json> {
  // Every raw capture the fill renders is read and then removed, unless the caller keeps them.
  const captures: string[] = [];
  const watched: CutoutIO = {
    ...io,
    render: async (a) => {
      const out = await io.render(a);
      for (const f of out?.frames ?? [])
        if (typeof f?.writtenTo === "string") captures.push(f.writtenTo);
      if (typeof out?.writtenTo === "string") captures.push(out.writtenTo);
      return out;
    },
  };
  try {
    const res = await fillGaps(args, watched);
    if (args.keepCaptures !== true) for (const r of res?.after?.frames ?? []) delete r.file;
    return res;
  } finally {
    if (args.keepCaptures !== true)
      await Promise.all(captures.map((f) => fs.rm(f, { force: true })));
  }
}

async function fillGaps(args: Record<string, unknown>, io: CutoutIO): Promise<Json> {
  const still = args.stillPath;
  if (
    typeof still !== "string" ||
    !path.isAbsolute(still) ||
    path.extname(still).toLowerCase() !== ".png"
  ) {
    return {
      ok: false,
      error:
        "`stillPath` must be an absolute path to a .png file, kept with the project (the comp will use it)",
    };
  }
  const rejected = rejectedOutputPath(still);
  if (rejected) return { ok: false, error: rejected };
  const outDir =
    typeof args.outDir === "string" && path.isAbsolute(args.outDir)
      ? args.outDir
      : path.dirname(still);
  const limit = typeof args.holeLimit === "number" ? args.holeLimit : CUTOUT_HOLE_LIMIT;
  const over = typeof args.over === "string" ? args.over : CUTOUT_OVER;
  const minArea = typeof args.minArea === "number" ? args.minArea : 20;
  const grow = typeof args.grow === "number" ? args.grow : 3;
  const perFrameMs = perFrameMsOf(args);
  const started = performance.now();
  const st = await io.status();
  const statusMs = since(started);
  const refTally = renderTally();
  const aloneTally = renderTally();
  const afterTally = renderTally();
  const pixels = pixelTally();
  let buildMs = 0;
  if (!st?.ok) return { ok: false, error: st?.error ?? "subject.status failed", status: st };
  const missing = needSelection(st);
  if (missing) return { ok: false, error: missing };
  const frame = typeof args.frame === "number" ? args.frame : (st.span?.inFrame ?? 0);
  const fillFrames = Array.isArray(args.frames)
    ? [frame, ...(args.frames as number[])]
    : args.across === true
      ? [st.span?.inFrame ?? 0, Math.max(0, (st.span?.outFrame ?? 1) - 1), frame]
      : [frame - 2, frame + 2];
  const fillSpace = await spacePlan(
    io,
    [
      { where: outDir, parts: { pictures: 16 * 2 * captureBytes(st.compSize) } },
      {
        where: aeCacheRoot(st.aeCache?.folder, st.aeCache?.version) ?? outDir,
        parts: { cache: cacheBytesFor(trackedSpan(fillFrames), st.sourceSize ?? st.compSize) },
      },
    ],
    PICTURE_MARGIN_BYTES,
    "filling the gaps",
  );
  if (fillSpace.refusal) return fillSpace.refusal;

  const [ref] = await renderChunked(
    io,
    { compNameOrId: args.comp, isolate: args.layer, channels: "rgba" },
    [frame],
    perFrameMs,
    outDir,
    "fill-reference",
    refTally,
  );
  const refused = (why: string) => ({
    ok: false,
    error: `the reference frame ${frame} did not render (${why}). Nothing was built. Try again with a larger secondsPerFrame.`,
  });
  if (!ref?.ok || !ref.file) return refused(ref?.error ?? "no result");
  let img: DecodedPng;
  try {
    img = await io.readImage(ref.file);
  } catch (err) {
    return refused(err instanceof Error ? err.message : String(err));
  }
  if (!img.alpha) return refused(`${ref.file} has no alpha channel`);
  const [cw, ch] = Array.isArray(st.compSize) ? st.compSize : [img.width, img.height];
  if (img.width !== cw || img.height !== ch) {
    return {
      ok: false,
      error: `the reference render came back ${img.width} × ${img.height}, not the comp's size ${cw} × ${ch}; set the comp to Full resolution and try again. Nothing was built.`,
    };
  }
  const only = Array.isArray(args.only) ? (args.only as Box[]) : null;
  const found = enclosedHoles(img.alpha, img.width, img.height, {
    minArea,
    keep: only ? (h) => only.some((b) => intersects(h, b)) : undefined,
  });
  const openings = cutoutRegions(img.alpha, img.width, img.height, { minArea }).openings;
  const area = found.holes.reduce((s, h) => s + h.area, 0);
  const filled: Json = {
    holes: found.holes.length,
    area,
    list: found.holes.slice(0, 20),
    dropped: found.dropped,
    leftOut: found.leftOut,
    openingsNotFilled: { count: openings.length, area: openings.reduce((s, o) => s + o.area, 0) },
    grow,
    minArea,
  };
  if (found.holes.length === 0) {
    return {
      ok: true,
      reference: { frame, file: ref.file },
      filled,
      reading:
        `No enclosed gap of ${minArea} px or more to fill at frame ${frame}; nothing was built.` +
        (openings.length
          ? ` ${plural(openings.length, "opening")} reaching the frame edge were left alone: an opening is never filled.`
          : ""),
      limits: FILL_LIMITS(frame),
    };
  }
  const grown = growMask(found.mask, img.width, img.height, grow);
  const values = new Float64Array(grown.length);
  let grownArea = 0;
  for (let p = 0; p < grown.length; p++)
    if (grown[p]) {
      values[p] = 1;
      grownArea++;
    }
  filled.grownArea = grownArea;
  filled.still = still;
  await writePng(io, still, encodePngGray8(img.width, img.height, values));
  const tBuild = performance.now();
  const built = await io.build({ comp: args.comp, layer: args.layer, stillPath: still });
  buildMs = since(tBuild);
  if (!built?.ok)
    return {
      ok: false,
      error: `the still was written to ${still}, but the fill could not be built: ${built?.error ?? "no result"}`,
      filled,
      build: built,
    };
  const layers = {
    fill: built.fillLayer,
    mask: built.maskLayer,
    stillItem: built.stillItem,
    stillItemId: built.stillItemId ?? null,
    audioOff: built.audioOff === true,
    audio:
      built.audioOff === true
        ? "switched off, so the footage's sound plays once"
        : built.hasAudio === false
          ? "the footage has no audio: nothing to switch off"
          : built.audioError
            ? `could not be switched off: ${built.audioError}`
            : "left as it was",
    ...(built.audioError ? { audioError: built.audioError } : {}),
  };

  // The fill layer alone must show no more than the still lets through.
  const [alone] = await renderChunked(
    io,
    { compNameOrId: args.comp, isolate: [built.fillLayer], channels: "rgba" },
    [frame],
    perFrameMs,
    outDir,
    "fill-alone",
    aloneTally,
  );
  let fillAlone: Json;
  try {
    if (!alone?.ok || !alone.file) throw new Error(alone?.error ?? "not rendered");
    const a = await io.readImage(alone.file);
    let covered = 0;
    for (const v of a.alpha ?? []) if (v > EDGE_TRANSPARENT) covered++;
    fillAlone = { covered, mask: grownArea, ok: covered <= grownArea * 1.1 + 100 };
  } catch (err) {
    fillAlone = {
      covered: null,
      mask: grownArea,
      ok: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  if (fillAlone.ok === false) {
    const undone = await io.unbuild({
      comp: args.comp,
      fillLayer: built.fillLayer,
      maskLayer: built.maskLayer,
      stillItemId: layers.stillItemId,
    });
    return {
      ok: false,
      error:
        `the fill layer alone covers ${fmt(fillAlone.covered)} px, more than the gap mask's ${fmt(grownArea)} px: the track matte is not limiting it. ` +
        (undone?.ok
          ? `The build was undone (${(undone.removed ?? []).join(", ")}).`
          : `Undoing the build failed (${undone?.error ?? "no result"}): delete '${built.fillLayer}' and '${built.maskLayer}' by hand.`),
      filled,
      fillAlone,
      layers,
    };
  }

  const frames = Array.isArray(args.frames)
    ? (args.frames as number[]).slice().sort((a, b) => a - b)
    : args.across === true
      ? framesAcross(st.span, typeof args.count === "number" ? args.count : CUTOUT_FRAMES, [frame])
      : quickFrames(st.span, [frame]);
  const afterRendered = await renderChunked(
    io,
    {
      compNameOrId: args.comp,
      isolate: [
        typeof st.softEdge?.layer === "string" ? st.softEdge.layer : args.layer,
        built.fillLayer,
      ],
      channels: "rgba",
      edge: true,
    },
    frames,
    perFrameMs,
    outDir,
    "fill-after",
    afterTally,
  );
  const measured = await measureFrames(
    io,
    afterRendered,
    limit,
    over,
    path.join(outDir, "fill-after_sheet.png"),
    pixels,
  );
  const sum = summarize(measured.readings, limit, []);
  return {
    ok: true,
    reference: { frame, file: ref.file },
    filled,
    fillAlone,
    layers,
    after: {
      frames: measured.readings,
      findings: sum.findings,
      checked: sum.checked,
      picture: measured.picture,
      reading: sum.text,
    },
    limits: FILL_LIMITS(frame),
    timing: {
      statusMs: Math.round(statusMs),
      referenceRender: roundTally(refTally),
      buildMs: Math.round(buildMs),
      fillAloneRender: roundTally(aloneTally),
      afterRender: roundTally(afterTally),
      pixels: roundTally(pixels),
      totalMs: Math.round(since(started)),
    },
    next:
      "Show the user the picture after the fill and say what is left. To undo the fill, delete the two layers it added." +
      (layers.audioOff
        ? " The fill copy's audio was switched off, so the footage's sound plays once."
        : "") +
      (built.audioError
        ? ` The fill copy's audio could not be switched off (${built.audioError}): the sound may play twice; switch it off by hand.`
        : "") +
      (fillAlone.ok === null
        ? " The fill layer alone could not be rendered, so whether the track matte limits it was not checked: look at it."
        : ""),
  };
}
const frameListParam = {
  name: "frames",
  type: "array" as const,
  description:
    "Comp frame numbers to look at, instead of the default: `count` frames evenly spaced across the layer, plus the click frame.",
  required: false,
};

const secondsPerFrameParam = {
  name: "secondsPerFrame",
  type: "number" as const,
  description: `Settle time to allow each frame, s (default ${CUTOUT_SECONDS_PER_FRAME}; measured 20 to 40 s a frame the first time on a 2176 x 3840 take). Frames are split over several renders when one cannot hold them (600 s a render).`,
  required: false,
};

registerOp({
  name: "subject.check",
  category: "subject",
  description:
    "Proof a subject matte after the user says done, before anything else is built. Run it while the user is still there: what it finds can need another click, and a click cannot be made unattended. Renders the cut-out with its alpha (ae_render_frame isolate, channels 'rgba'; with the layer's gap fill from subject.fill_gaps when the comp has one, reported as fillLayer) at the click frames and frames across the clip, " +
    "finds holes (regions below opaque the frame edge cannot reach) and openings (regions closed off only by the subject and the frame edge: the missed microphone of 2026-11-11 ran off the bottom of the frame), draws each frame over a flat colour and one contact sheet, and returns " +
    "picture (the sheet), findings, accepted, checked {frames, of}, inOut (a plain statement of what is in and what is out), frames, clicks and stop. " +
    `A hole or opening of holeLimit px or more (default ${CUTOUT_HOLE_LIMIT}, at the comp's size) is a finding; so are frames that did not render (kind 'not-checked': a frame that was not rendered is never counted as clean). Two clicks close together are a finding only when something is missing too (a click meant for it may have landed on the subject again); otherwise they are the pieces of something clicked one by one, listed in notes, and do not set stop. ` +
    "With stop true: say in your reply what is out, in plain words, and give the picture's path, before the next call. `accept` entries (earlier findings the user called fine, such as a real gap between an arm and the body) are not counted again. " +
    "Each frame with a finding is rendered once more at the end; a frame whose cut-out differs between the two renders is a finding of kind 'unstable' (seen once on 2026-11-11, cause unknown; agreement may come from the cache and does not prove a frame stable). " +
    "A selection count is not a check. It can take minutes: 20 to 40 s a frame the first time on a 2176 x 3840 take; say so to the user before it runs. " +
    "`timing` says where the time went (status, each render's After Effects call, settle wait and Node work, the pixel work, the total) and `timeReading` says it in one sentence.",
  params: [
    ...compLayerParams,
    {
      name: "outDir",
      type: "string",
      description: "Absolute folder for the pictures.",
      required: true,
    },
    {
      name: "clickFrame",
      type: "number",
      description:
        "A comp frame to look at as well. The selections' own click frames are always looked at.",
      required: false,
    },
    frameListParam,
    {
      name: "count",
      type: "number",
      description: `How many frames across the layer (default ${CUTOUT_FRAMES}).`,
      required: false,
    },
    {
      name: "holeLimit",
      type: "number",
      description: `Smallest hole or opening that is a finding, px at the comp's size (default ${CUTOUT_HOLE_LIMIT}).`,
      required: false,
    },
    {
      name: "accept",
      type: "array",
      description:
        "Findings the user has seen and called fine, so a later run does not stop on them: each a box {x, y, width, height} (it accepts an opening) or { box, kind: 'hole' | 'opening' }. A finding is accepted only by an entry of its kind whose box overlaps its own by at least half their union; a hole inside an accepted opening's box is not accepted.",
      required: false,
    },
    {
      name: "across",
      type: "boolean",
      description:
        "Look across the clip (count frames spread over the layer) on the live matte instead of the quick check (the click frames and two either side). Takes minutes: 4 to 9 for nine frames on a 2176 x 3840 take; prefer subject.render_cutout and subject.check_file.",
      required: false,
    },
    {
      name: "recheck",
      type: "boolean",
      description:
        "Render each frame with a hole or opening over the limit once more at the end and report a frame that differs (kind 'unstable'). Default true; false skips it.",
      required: false,
    },
    {
      name: "frozenLimit",
      type: "number",
      description:
        "A drift over frozenGap frames (share of the frame whose alpha changed by more than 0.1) under this counts as an unmoved outline (default 0.002; not yet calibrated live).",
      required: false,
    },
    {
      name: "frozenFrames",
      type: "number",
      description:
        "Shortest run of unmoved outline that is a 'frozen' finding, frames (default 60).",
      required: false,
    },
    {
      name: "frozenGap",
      type: "number",
      description: "Frames between the two frames compared for drift (default 30).",
      required: false,
    },
    {
      name: "keepCaptures",
      type: "boolean",
      description:
        "Keep the raw captures ae_render_frame wrote (default false: each is removed once read; the pictures stay).",
      required: false,
    },
    secondsPerFrameParam,
    overParam,
    subjectIndexParam,
  ],
  toJsx: () => NODE_ONLY("subject.check"),
  run: (args, transport) => runSubjectCheck(args, liveCutoutIO(args, transport)),
});

registerOp({
  name: "subject.fill_gaps",
  category: "subject",
  description:
    "Fill enclosed gaps in a subject matte that no click fills (a gap in a microphone's shock mount with the shirt behind it): reads the matte at one reference frame at the comp's size, keeps the regions below opaque that the frame edge cannot reach (openings are never filled), drops those under minArea (default 20 px), grows the rest by `grow` px (default 3), " +
    "writes them as a still (stillPath), and adds a copy of the same footage under the cut-out showing only through that still (luma track matte). It then renders the fill layer alone and undoes the build when that covers more than the mask, and measures holes and openings again across the clip. " +
    "Refuses, building nothing, when the reference frame does not render. Limits, stated in the result: one reference frame, so it assumes a locked camera and a prop that does not move; what shows through is whatever is behind the gap. `only` boxes fill just the gaps they touch. " +
    "Can take minutes, as subject.check does (180 s on the take). Verified in After Effects 27.0 on one take (2026-11-11): the layers, the luma track matte, a switched-off mask that still mattes, and the measurements after; undoing the build when the fill covers too much is not verified there. The fill copy's audio is switched off (audioOff) so the sound does not play twice.",
  params: [
    ...compLayerParams,
    {
      name: "stillPath",
      type: "string",
      description: "Absolute .png path for the gap mask, kept with the project (the comp uses it).",
      required: true,
    },
    {
      name: "frame",
      type: "number",
      description: "Reference comp frame (default: the layer's first frame; use the click frame).",
      required: false,
    },
    {
      name: "minArea",
      type: "number",
      description: "Smallest gap filled, px (default 20).",
      required: false,
    },
    {
      name: "grow",
      type: "number",
      description: "Grow each gap by this many px (default 3).",
      required: false,
    },
    {
      name: "only",
      type: "array",
      description:
        "Boxes {x, y, width, height} in comp pixels: fill only the gaps they touch (from subject.check's findings). Leave it out to fill every enclosed gap, which is the default to use: pass it only to keep a real enclosed gap (between an arm and the body) unfilled; a gap under the limit at one frame can grow past it on others.",
      required: false,
    },
    {
      name: "outDir",
      type: "string",
      description: "Absolute folder for the measuring renders (default: the still's folder).",
      required: false,
    },
    frameListParam,
    {
      name: "count",
      type: "number",
      description: `How many frames to measure after the fill (default ${CUTOUT_FRAMES}).`,
      required: false,
    },
    {
      name: "holeLimit",
      type: "number",
      description: `Smallest hole or opening reported after the fill, px (default ${CUTOUT_HOLE_LIMIT}).`,
      required: false,
    },
    {
      name: "across",
      type: "boolean",
      description:
        "Measure after the fill across the clip instead of near the reference frame. Takes minutes; prefer subject.render_cutout and subject.check_file.",
      required: false,
    },
    {
      name: "keepCaptures",
      type: "boolean",
      description:
        "Keep the raw captures ae_render_frame wrote (default false: each is removed once read; the pictures stay).",
      required: false,
    },
    secondsPerFrameParam,
    overParam,
    subjectIndexParam,
  ],
  toJsx: () => NODE_ONLY("subject.fill_gaps"),
  run: (args, transport) => runFillGaps(args, liveCutoutIO(args, transport)),
});

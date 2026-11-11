// ae_check_comp (finish plan, stage 1): one call that walks a comp's work
// area (or a given range), measures every frame in Node and lists what a
// viewer would notice: flagged moments, stretches, structure findings read
// from the project, and one contact sheet of the flagged moments.
//
// A tool of its own rather than another ae_render_frame option: that tool
// renders at most 32 frames a call and keeps whole frames for its per-frame
// reports; this one streams hundreds of frames at a reduced size, holds only
// the previous frame and small records, and returns one report. It shares
// ae_render_frame's capture pieces (the saveFrameToPng snippet, the OCIO
// display-transform capture, the colour conversion and the settled read).
//
// The capture path sits behind FrameSource (frame numbers in, file paths out)
// so a render-queue PNG sequence can be added later without touching the
// measuring.
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { z } from "zod";
import { decodePng, encodePngSrgb8 } from "../color/png16.js";
import { settleTimeoutFor, stampFiles, waitForSettled } from "../color/settled-read.js";
import { composeContactSheet, LABEL_CHAR_PX, resample } from "../color/sheet.js";
import { PieceWatcher, resolveWatchThresholds, watchArgsError, } from "../color/watch.js";
import { rejectedOutputPath } from "../config.js";
import { errorResult } from "../errors.js";
import { readOnlyMode } from "../policy.js";
import { colorConversion } from "./capture-shared.js";
import { captureJsx, planJsx, structureJsx } from "./check-comp-jsx.js";
import { defineTool, jsonResult, toMcpResult } from "./define-tool.js";
const frameFile = (dir, frame) => path.join(dir, `frame-${frame}.png`).replace(/\\/g, "/");
/** saveFrameToPng, a chunk at a time, waiting for the asynchronously written files. */
export function aeFrameSource(transport, comp, opts) {
    return {
        async capture(frames, dir) {
            const t0 = performance.now();
            const paths = frames.map((k) => frameFile(dir, k));
            await fs.mkdir(dir, { recursive: true });
            const before = await stampFiles(paths);
            const result = await transport.execute({
                code: captureJsx(comp, frames, paths, opts.factor, opts.tryOcio),
                label: "check_comp_capture",
                timeoutMs: 60_000 + frames.length * 5_000,
            });
            if (!result.ok)
                return { error: result.error ?? "capture call failed", details: result };
            const payload = result.result;
            if (!payload || payload.ok !== true) {
                return {
                    error: payload?.error ?? "capture reported no result",
                    details: { resolution: payload?.resolution },
                };
            }
            const rendered = payload.frames ?? [];
            const ok = rendered.filter((f) => f.ok && typeof f.writtenTo === "string");
            const settle = await waitForSettled(ok.map((f) => f.writtenTo), {
                timeoutMs: opts.settleTimeoutMs ?? settleTimeoutFor(ok.length, opts.pixels),
                before: ok.map((f) => before[frames.indexOf(f.frame)]),
            });
            const settled = new Set(settle.settled.map((i) => ok[i].frame));
            const out = frames.map((frame) => {
                const r = rendered.find((f) => f.frame === frame);
                if (!r)
                    return { frame, error: "not captured" };
                if (!r.ok)
                    return { frame, error: r.error ?? "capture failed" };
                if (!settled.has(frame)) {
                    const u = settle.unsettled.find((x) => ok[x.index]?.frame === frame);
                    return {
                        frame,
                        error: `the capture did not finish writing within ${(settle.timeoutMs / 1000).toFixed(1)} s (${u?.state ?? "missing"})`,
                    };
                }
                return { frame, path: r.writtenTo };
            });
            return {
                frames: out,
                info: {
                    captureKind: payload.captureKind ?? null,
                    workingSpace: payload.workingSpace,
                    bitsPerChannel: payload.bitsPerChannel,
                    projectFile: payload.projectFile ?? null,
                    bgColor: payload.bgColor ?? null,
                    resolution: payload.resolution,
                },
                seconds: (performance.now() - t0) / 1000,
            };
        },
    };
}
/**
 * Decode, convert to display values (the output stage), shrink to `target`
 * when the capture came back bigger, and clamp. With a conversion the values
 * are quantized to 8 bits, as the file ae_render_frame writes would hold them.
 */
async function readPicture(file, target, convert) {
    const img = decodePng(await fs.readFile(file));
    if (convert)
        convert(img.rgb);
    let rgb = img.rgb;
    let width = img.width;
    let height = img.height;
    if (width > target.width + 1 || height > target.height + 1) {
        rgb = resample(img, target.width, target.height);
        width = target.width;
        height = target.height;
    }
    const pic = new Float32Array(rgb.length);
    for (let i = 0; i < rgb.length; i++) {
        const v = rgb[i] < 0 ? 0 : rgb[i] > 1 ? 1 : rgb[i];
        pic[i] = convert ? Math.round(v * 255) / 255 : v;
        rgb[i] = pic[i];
    }
    return { pic, rgb, width, height, captured: [img.width, img.height] };
}
// ---------------------------------------------------------------------------
// The tool
// ---------------------------------------------------------------------------
/** Items listed at most per list (counts are always complete). */
export const LIST_CAP = 20;
const DEFAULT_MAX_TILES = 12;
const r6 = (v) => Math.round(v * 1e6) / 1e6;
const r3 = (v) => Math.round(v * 1e3) / 1e3;
/** Pick at most `cap` items, worst first, taking turns between kinds so no kind crowds the others out. */
function capWorst(items, kindOf, severity, cap) {
    const byKind = new Map();
    for (const it of items) {
        const k = kindOf(it);
        if (!byKind.has(k))
            byKind.set(k, []);
        byKind.get(k).push(it);
    }
    for (const list of byKind.values())
        list.sort((a, b) => severity(b) - severity(a));
    const out = [];
    const lists = [...byKind.values()];
    for (let round = 0; out.length < cap && lists.some((l) => l.length > round); round++) {
        for (const l of lists)
            if (round < l.length && out.length < cap)
                out.push(l[round]);
    }
    return out;
}
function countBy(items, kindOf) {
    const out = {};
    for (const it of items)
        out[kindOf(it)] = (out[kindOf(it)] ?? 0) + 1;
    return out;
}
const stretchSeverity = (s) => s.kind === "clipped-high" || s.kind === "clipped-low" ? (s.worst?.share ?? 0) * 1000 + s.frames : s.frames;
const flagSeverity = (f) => f.kind === "pop" || f.kind === "cut" ? f.ratio : 1 / (f.ratio + 1e-6);
const thresholdsSchema = z
    .record(z.string(), z.union([z.number(), z.null()]))
    .optional()
    .describe("Override any threshold (the rest keep their defaults, all reported back as `thresholds`): " +
    "frozenSeconds 0.5 (a run with no visible change at least this long is a frozen stretch), " +
    "frozenShare 0.00002 (a pair shows no visible change when at most this share of pixels changed by more than changeAbove), " +
    "darkBelow 0.04 / lightAbove 0.96 (a pixel is near-black when its brightest channel is at or below, near-white when its darkest is at or above), " +
    "blackShare 0.99 / blackMean 0.01 (a frame is near-black when that share of pixels is near-black, or its mean luma is at or below), " +
    "whiteShare 0.99 / whiteMean 0.99 (the same for near-white), " +
    "clipHighShare 0.005 (a frame is clipped when that share of pixels is at 255 in all three channels), " +
    "clipLowShare null (the same at 0; null measures but never flags: a black background is at 0 by design), " +
    "and the diff thresholds of ae_render_frame: changeAbove 0.04, spikeRatio 3, holdRatio 0.25, quietBelow 0.002, " +
    "movingShare 0.0005, window 3, repeatBelow 0.0001.");
const CHECK_COMP_SHAPE = {
    compNameOrId: z.union([z.string(), z.number()]).describe("Composition name or numeric item id."),
    from: z
        .number()
        .nonnegative()
        .optional()
        .describe("Start of the range, seconds from the comp's start (default: the work area's start)."),
    to: z
        .number()
        .positive()
        .optional()
        .describe("End of the range (exclusive), seconds from the comp's start (default: the work area's end)."),
    startFrame: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe("Continue a range: the `next.startFrame` an earlier call returned (same other arguments)."),
    every: z
        .number()
        .int()
        .min(1)
        .max(60)
        .optional()
        .describe("Check every Nth frame (default 1, every frame). Above 1 is faster but a one-frame pop or flash between " +
        "checked frames is missed, a stutter can no longer be told from a short hold, and stretch ends are " +
        "known to within N − 1 frames; the result says so in `notes`."),
    downsample: z
        .number()
        .int()
        .min(1)
        .max(8)
        .optional()
        .describe("Capture size: 1 full, 2 half, 4 quarter (default; 270×480 for 1080×1920). Applied through the comp's " +
        "resolutionFactor before saveFrameToPng and put back afterwards, even when the script fails. Whether " +
        "saveFrameToPng honours it is measured on the PNG that comes back (`capture`): a full-size capture is " +
        "shrunk in Node to the asked size, so the numbers mean the same either way."),
    maxFrames: z
        .number()
        .int()
        .min(1)
        .max(2000)
        .optional()
        .describe("Frames checked per call at most (default 300); the rest is left for `next`."),
    chunkFrames: z
        .number()
        .int()
        .min(1)
        .max(120)
        .optional()
        .describe("Frames per After Effects script (default 30)."),
    thresholds: thresholdsSchema,
    safeArea: z
        .object({
        percent: z
            .number()
            .min(0)
            .max(45)
            .optional()
            .describe("Inset on each side, as a percent of the frame's width (left/right) and height (top/bottom)."),
        px: z.number().min(0).optional().describe("Inset on each side, comp pixels."),
    })
        .optional()
        .describe("Check bounds against a safe area instead of the frame edge (default: the frame)."),
    boundsOf: z
        .enum(["text", "all"])
        .optional()
        .describe("Which layers the bounds check measures: 'text' (default) or 'all' visible layers with pixels. Other " +
        "layer types are opt-in because backgrounds and shapes bleed off frame on purpose."),
    boundsStep: z
        .number()
        .positive()
        .optional()
        .describe("Bounds are sampled at every keyframe time and every boundsStep seconds (default 0.1)."),
    structure: z
        .boolean()
        .optional()
        .describe("Run the structure checks on the call that reaches the end of the range (default true)."),
    colorManaged: z
        .enum(["auto", "off"])
        .optional()
        .describe("'auto' (default) measures the picture after colour conversion, as ae_render_frame; 'off' the raw capture."),
    settleTimeoutMs: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("How long to wait for each chunk's captures to finish writing (default: grows with the chunk)."),
    outDir: z
        .string()
        .optional()
        .describe("Folder for the contact sheet and its frames (default: a new folder under the system temp folder)."),
    sheet: z
        .union([
        z.boolean(),
        z.object({
            maxTiles: z.number().int().min(1).max(48).optional(),
            thumbWidth: z.number().int().min(64).max(1024).optional(),
        }),
    ])
        .optional()
        .describe("The contact sheet of flagged moments (default on, at most 12 tiles; the rest are counted)."),
};
export const checkCompTool = defineTool({
    name: "ae_check_comp",
    title: "Check comp",
    description: "Check a whole comp the way a viewer would watch it, in one call: walks the work area (or `from`..`to`), " +
        "renders every frame (or every `every`th) at a reduced size, measures each in Node and lists what stands out. " +
        "Flagged moments (`flags`, sorted by time): a one-frame pop or flash, a cut or jump, a stutter (a frame " +
        "repeated while the frames around move) and a repeat at the edge of the range — the `diff` flags of " +
        "ae_render_frame over the whole piece. Stretches: frozen (no visible change for at least frozenSeconds; a " +
        "held title is legitimate, the report states the fact), near-black and near-white frames, and clipping " +
        "(pixels at 255 in all three channels, with the box where they sit; per-channel shares alongside). " +
        "Structure, read from the project on the call that reaches the end of the range: text layers whose bounds " +
        "leave the frame (or `safeArea`) while visible — layer, time range, edge, by how many pixels, partly or " +
        "wholly outside — missing fonts and footage, and expressions in error (in nested comps too). One contact " +
        "sheet tiles the flagged moments, labelled with time and kind; the frames on it are kept beside it, every " +
        "other capture is deleted as soon as it is measured. A clean comp returns empty lists and no sheet. " +
        "Bounded: at most `maxFrames` frames a call (default 300); when the range is not finished the result " +
        "says where to continue (`next.startFrame`): call again with the same arguments plus that startFrame. " +
        "Numbers are display values of the picture the viewer sees (stage 'output', after colour conversion, " +
        "as ae_render_frame writes the file), with the thresholds used; it never says pass or fail. Times are " +
        "seconds from the comp's start (frame × frame duration), ignoring the display start time.",
    group: "render",
    // Like ae_render_frame: survives read-only mode (it renders and reads, and
    // the check is the point of a review session). Not a never-touches-the-
    // project tool: the reduced size is the comp's resolutionFactor, set and
    // put back in each capture script, and a colour-managed capture adds and
    // removes a transient adjustment layer — one undo step each. Read-only
    // mode skips both and shrinks full-size captures in Node instead.
    blockedInReadOnly: false,
    effect: "write",
    inputShape: CHECK_COMP_SHAPE,
    handler: async (args, transport) => {
        const invalid = (message) => errorResult("INVALID_ARGS", message);
        if (args.thresholds !== undefined) {
            const err = watchArgsError(args.thresholds);
            if (err)
                return invalid(err);
        }
        if (args.from !== undefined && args.to !== undefined && args.to <= args.from) {
            return invalid("`to` must be after `from`");
        }
        if (args.safeArea && (args.safeArea.percent === undefined) === (args.safeArea.px === undefined)) {
            return invalid("`safeArea` takes exactly one of `percent` or `px`");
        }
        if (args.outDir !== undefined) {
            const rejection = rejectedOutputPath(args.outDir);
            if (rejection !== null)
                return errorResult("IO", rejection, { hint: "Pick a folder outside the mailbox." });
        }
        return checkComp(args, transport);
    },
});
/** The frames of the range, from frame `first` (inclusive) to `end` (exclusive), every `every`. */
function sampled(first, end, every) {
    const out = [];
    for (let k = first; k < end; k += every)
        out.push(k);
    return out;
}
async function checkComp(args, transport) {
    const started = performance.now();
    const every = args.every ?? 1;
    const downsample = args.downsample ?? 4;
    const maxFrames = args.maxFrames ?? 300;
    const chunkFrames = args.chunkFrames ?? 30;
    const t = resolveWatchThresholds((args.thresholds ?? {}));
    const notes = [];
    const planRes = await transport.execute({
        code: planJsx(args.compNameOrId),
        label: "check_comp_plan",
    });
    if (!planRes.ok)
        return toMcpResult(planRes);
    const plan = planRes.result;
    if (!plan || plan.ok !== true)
        return toMcpResult(planRes);
    const fd = plan.frameDuration;
    const compFrames = Math.max(1, Math.round(plan.duration / fd));
    // The range, in frames from the comp's first frame.
    const fromSec = args.from ?? plan.workAreaStart;
    const toSec = args.to ?? plan.workAreaStart + plan.workAreaDuration;
    const first = Math.max(0, Math.min(compFrames - 1, Math.floor(fromSec / fd + 1e-6)));
    const end = Math.max(first + 1, Math.min(compFrames, Math.ceil(toSec / fd - 1e-6)));
    const all = sampled(first, end, every);
    let startIdx = 0;
    if (args.startFrame !== undefined) {
        startIdx = all.findIndex((k) => k >= args.startFrame);
        if (startIdx < 0) {
            return errorResult("INVALID_ARGS", `startFrame ${args.startFrame} is past the range (frames ${first} to ${all[all.length - 1]})`);
        }
    }
    const owned = all.slice(startIdx, startIdx + maxFrames);
    const ownedFrom = owned[0];
    const ownedTo = owned[owned.length - 1];
    const remaining = all.length - (startIdx + owned.length);
    // Context on either side so the comparison at the call's edges is the one a
    // single call over the whole range would make: before, the window plus a
    // frozen stretch's length; after, the window.
    const before = startIdx > 0 ? Math.min(startIdx, t.window + 1 + Math.ceil(t.frozenSeconds / (fd * every))) : 0;
    const after = remaining > 0 ? Math.min(remaining, t.window + 1) : 0;
    const frames = all.slice(startIdx - before, startIdx + owned.length + after);
    const next = remaining > 0
        ? {
            startFrame: ownedTo + every,
            time: r6((ownedTo + every) * fd),
            framesLeft: remaining,
        }
        : null;
    const outDir = path
        .resolve(args.outDir ??
        path.join(os.tmpdir(), "comp-room-check", `${String(plan.compName).replace(/[^A-Za-z0-9_-]+/g, "-").slice(0, 40)}-${Date.now()}`))
        .replace(/\\/g, "/");
    const capDir = path.join(outDir, `captures-${randomUUID().slice(0, 8)}`).replace(/\\/g, "/");
    const readOnly = readOnlyMode();
    const target = {
        width: Math.max(1, Math.round(plan.width / downsample)),
        height: Math.max(1, Math.round(plan.height / downsample)),
    };
    const source = aeFrameSource(transport, args.compNameOrId, {
        factor: readOnly ? null : downsample,
        tryOcio: args.colorManaged !== "off" && !readOnly,
        settleTimeoutMs: args.settleTimeoutMs,
        pixels: target.width * target.height,
    });
    const report = {
        comp: {
            name: plan.compName,
            id: plan.compId,
            size: [plan.width, plan.height],
            frameRate: r3(1 / fd),
            duration: r6(plan.duration),
        },
        range: {
            from: { frame: first, time: r6(first * fd) },
            to: { frame: all[all.length - 1], time: r6(all[all.length - 1] * fd) },
            source: args.from !== undefined || args.to !== undefined ? "from/to" : "work area",
            framesToCheck: all.length,
        },
        step: every,
    };
    // A comp with missing footage renders placeholder bars, not the piece:
    // nothing is captured (as ae_render_frame refuses); structure still runs.
    if (plan.missingFootage.length > 0) {
        report.picture = {
            checked: false,
            reason: `source media missing for comp ${plan.compName}; restore or relink it, then check again`,
        };
        report.missingFootage = plan.missingFootage;
        report.structure = await runStructure(args, transport, plan, first, end, fd);
        report.next = null;
        report.timings = { totalSeconds: r3((performance.now() - started) / 1000) };
        return jsonResult({ result: report });
    }
    // Capture and measure, a chunk at a time; each capture is deleted once measured.
    let watcher = null;
    let info = null;
    let convert = null;
    const color = {};
    let captureSeconds = 0;
    let readSeconds = 0;
    let captured = null;
    let measured = null;
    const failures = [];
    let captureError = null;
    let measuredFrames = 0;
    for (let c = 0; c < frames.length && captureError === null; c += chunkFrames) {
        const chunk = frames.slice(c, c + chunkFrames);
        const res = await source.capture(chunk, capDir);
        if ("error" in res) {
            captureError = { error: res.error, atFrame: chunk[0], details: res.details };
            break;
        }
        captureSeconds += res.seconds;
        if (info === null) {
            info = res.info;
            Object.assign(color, res.info);
            if (args.colorManaged !== "off")
                convert = await colorConversion(color, transport);
        }
        if (res.info.resolution?.set && res.info.resolution.restored === false) {
            notes.push(`the comp's resolution could not be put back to ${JSON.stringify(res.info.resolution.before)} after a capture (${res.info.resolution.restoreError ?? "unknown error"}): set it in the comp panel`);
        }
        for (const f of res.frames) {
            if (!f.path) {
                failures.push({ frame: f.frame, error: f.error ?? "capture failed" });
                continue;
            }
            const r0 = performance.now();
            try {
                const pic = await readPicture(f.path, target, convert);
                captured ??= pic.captured;
                measured ??= [pic.width, pic.height];
                watcher ??= new PieceWatcher({
                    thresholds: t,
                    frameDuration: fd,
                    every,
                    scale: plan.width / pic.width,
                    owned: { from: ownedFrom, to: ownedTo },
                    openStart: startIdx > 0,
                    openEnd: remaining > 0,
                });
                watcher.add({ frame: f.frame, pic: pic.pic, width: pic.width, height: pic.height });
                measuredFrames++;
            }
            catch (err) {
                failures.push({ frame: f.frame, error: `could not read the capture: ${err instanceof Error ? err.message : String(err)}` });
            }
            readSeconds += (performance.now() - r0) / 1000;
            await fs.rm(f.path, { force: true });
        }
    }
    await fs.rm(capDir, { recursive: true, force: true });
    const findings = watcher ? watcher.finish() : null;
    const measureSeconds = watcher ? watcher.measureMs / 1000 : 0;
    // Where the check stops: a failed capture leaves `next` at the first frame not measured.
    let nextOut = next;
    if (captureError !== null && captureError.atFrame <= ownedTo) {
        const at = Math.max(captureError.atFrame, ownedFrom);
        nextOut = { startFrame: at, time: r6(at * fd), framesLeft: all.length - all.indexOf(at) };
    }
    report.checked = {
        from: { frame: ownedFrom, time: r6(ownedFrom * fd) },
        to: { frame: ownedTo, time: r6(ownedTo * fd) },
        frames: findings?.framesChecked ?? 0,
        contextFrames: { before, after },
        captureFailures: failures.length,
    };
    report.next = nextOut;
    const asked = readOnly ? null : downsample;
    const resolution = info?.resolution;
    const honoured = captured === null ? null : Math.abs(captured[0] - target.width) <= 1 && Math.abs(captured[1] - target.height) <= 1;
    report.capture = {
        downsample,
        compSize: [plan.width, plan.height],
        askedSize: [target.width, target.height],
        capturedSize: captured,
        measuredSize: measured,
        resolutionFactor: asked === null
            ? "not touched (read-only mode): captured at the comp's own resolution and shrunk in Node"
            : resolution?.setError
                ? `could not be set (${resolution.setError}): captured at the comp's own resolution and shrunk in Node`
                : honoured === null
                    ? "unknown: nothing was captured"
                    : honoured
                        ? `honoured: saveFrameToPng wrote ${captured[0]}×${captured[1]}`
                        : `not honoured: saveFrameToPng wrote ${captured[0]}×${captured[1]}, shrunk in Node to ${measured?.[0]}×${measured?.[1]}`,
        captureKind: info?.captureKind ?? null,
        stage: "output",
        picture: convert !== null
            ? "display values of the picture the viewer sees, as ae_render_frame writes the file: after colour conversion (colorPipeline), clamped and rounded to 8 bits; the capture's RGB is already laid over the comp background, so transparent areas read that colour"
            : "the raw capture (colorManaged off, or the colour conversion failed: see colorWarning): working-space values, over the comp background",
        ...(color.colorPipeline ? { colorPipeline: color.colorPipeline } : {}),
        ...(color.colorWarning ? { colorWarning: color.colorWarning } : {}),
    };
    if (captureError !== null) {
        report.captureError = captureError;
        notes.push(`capturing stopped at frame ${captureError.atFrame}: ${captureError.error}. What was measured is reported; call again with startFrame ${(nextOut ?? { startFrame: captureError.atFrame }).startFrame} to continue`);
    }
    if (failures.length > 0) {
        report.captureFailures = failures.slice(0, LIST_CAP);
        notes.push(`${failures.length} frame${failures.length > 1 ? "s" : ""} could not be captured or read; the series is broken there (see captureFailures)`);
    }
    report.thresholds = t;
    const flags = findings?.flags ?? [];
    const stretches = findings?.stretches ?? [];
    const shownFlags = capWorst(flags, (f) => f.kind, flagSeverity, LIST_CAP).sort((a, b) => a.frame - b.frame);
    const shownStretches = capWorst(stretches, (s) => s.kind, stretchSeverity, LIST_CAP).sort((a, b) => a.from.frame - b.from.frame);
    report.counts = {
        flags: countBy(flags, (f) => f.kind),
        stretches: countBy(stretches, (s) => s.kind),
    };
    report.flags = shownFlags;
    if (shownFlags.length < flags.length)
        report.flagsOmitted = flags.length - shownFlags.length;
    report.stretches = shownStretches;
    if (shownStretches.length < stretches.length)
        report.stretchesOmitted = stretches.length - shownStretches.length;
    if (findings?.extremes)
        report.extremes = findings.extremes;
    notes.push(...(findings?.notes ?? []));
    // Structure: on the call that reaches the end of the range. Read after the
    // capture pass, so expressions have been evaluated (expressionError).
    let structureSeconds = 0;
    let structure = null;
    if (nextOut === null && args.structure !== false) {
        const s0 = performance.now();
        structure = await runStructure(args, transport, plan, first, end, fd);
        structureSeconds = (performance.now() - s0) / 1000;
        report.structure = structure;
    }
    else {
        report.structure = {
            checked: false,
            reason: args.structure === false
                ? "structure: false"
                : "structure checks run on the call that reaches the end of the range (next is not null)",
        };
    }
    // The contact sheet: the flagged moments, captured again at the same size
    // and kept beside the sheet.
    let sheetSeconds = 0;
    report.sheet = null;
    if (args.sheet !== false && findings !== null) {
        const s0 = performance.now();
        const sheetOpts = typeof args.sheet === "object" ? args.sheet : {};
        const sheet = await makeSheet(source, outDir, shownFlags, shownStretches, structure, fd, { from: first, to: end - 1 }, target, convert, sheetOpts.maxTiles ?? DEFAULT_MAX_TILES, sheetOpts.thumbWidth, `${ownedFrom}-${ownedTo}`);
        sheetSeconds = (performance.now() - s0) / 1000;
        report.sheet = sheet;
    }
    await fs.rmdir(outDir).catch(() => { });
    const total = (performance.now() - started) / 1000;
    report.timings = {
        captureSeconds: r3(captureSeconds),
        readSeconds: r3(readSeconds),
        measureSeconds: r3(measureSeconds),
        structureSeconds: r3(structureSeconds),
        sheetSeconds: r3(sheetSeconds),
        totalSeconds: r3(total),
        framesCaptured: measuredFrames,
        framesPerSecond: total > 0 ? r3(measuredFrames / total) : null,
        msPerFrame: measuredFrames > 0
            ? { capture: r3((captureSeconds * 1000) / measuredFrames), read: r3(((readSeconds - measureSeconds) * 1000) / measuredFrames), measure: r3((measureSeconds * 1000) / measuredFrames) }
            : null,
    };
    if (readOnly) {
        notes.push("read-only mode: the comp's resolution and the OCIO capture layer were not touched, so captures were full size (slower) and colour came from the pure-math conversion");
    }
    report.notes = notes;
    return jsonResult({ result: report });
}
async function runStructure(args, transport, plan, first, end, fd) {
    const pct = args.safeArea?.percent;
    const px = args.safeArea?.px;
    const margins = pct !== undefined
        ? [(plan.width * pct) / 100, (plan.height * pct) / 100, (plan.width * pct) / 100, (plan.height * pct) / 100]
        : px !== undefined
            ? [px, px, px, px]
            : [0, 0, 0, 0];
    const step = Math.max(fd, Math.round((args.boundsStep ?? 0.1) / fd) * fd);
    const opts = {
        from: first * fd,
        to: end * fd,
        step,
        margins,
        boundsOf: args.boundsOf ?? "text",
        maxSamples: 400,
        maxItems: LIST_CAP,
        maxProperties: 50_000,
    };
    const res = await transport.execute({
        code: structureJsx(args.compNameOrId, opts),
        label: "check_comp_structure",
        timeoutMs: 120_000,
    });
    if (!res.ok)
        return { checked: false, reason: `structure script failed: ${res.error ?? "unknown"}` };
    const s = res.result;
    if (!s || s.ok !== true)
        return { checked: false, reason: `structure script failed: ${s?.error ?? "no result"}` };
    const offFrame = s.bounds.findings
        .map((f) => ({
        layer: { index: f.index, name: f.name, type: f.type },
        edge: f.edge,
        from: { time: r6(f.from), frame: Math.floor(f.from / fd + 1e-6) },
        to: { time: r6(f.to), frame: Math.floor(f.to / fd + 1e-6) },
        byPx: f.byPx,
        extent: f.extent,
        worstAt: { time: r6(f.at), frame: Math.floor(f.at / fd + 1e-6) },
        box: f.box,
        reading: `${f.type} layer ${f.index} "${f.name}" ${f.extent === "wholly" ? "is wholly" : "is partly"} past the ${f.edge} edge of the ${margins.some((m) => m > 0) ? "safe area" : "frame"} ` +
            `from ${r6(f.from)} s to ${r6(f.to)} s while visible, by up to ${f.byPx} px (at ${r6(f.at)} s)`,
    }))
        .sort((a, b) => a.from.time - b.from.time);
    const footageInComp = s.footage.items.filter((it) => it.usedInComps.length > 0);
    return {
        checked: true,
        safeArea: {
            margins: { left: r6(margins[0]), top: r6(margins[1]), right: r6(margins[2]), bottom: r6(margins[3]) },
            against: margins.some((m) => m > 0) ? "safe area" : "frame edge",
        },
        offFrame: {
            count: s.bounds.total,
            layersChecked: s.bounds.layersChecked,
            samples: s.bounds.samples,
            sampleStep: r6(step),
            boundsOf: opts.boundsOf,
            findings: offFrame,
            ...(s.bounds.total > offFrame.length ? { omitted: s.bounds.total - offFrame.length } : {}),
            ...(s.bounds.skipped.length > 0 ? { skipped: s.bounds.skipped.slice(0, LIST_CAP) } : {}),
            note: "top-level layers of this comp only (not inside nested comps); sampled at keyframe times and every sampleStep " +
                "seconds, so a range's ends are known to within one step; a layer is visible when its eye is on, the time is " +
                "inside its in and out points and its own opacity is above 0 (a parent's opacity is not counted)",
        },
        missingFonts: s.fonts.ok
            ? { count: s.fonts.count ?? 0, fonts: (s.fonts.fonts ?? []).slice(0, LIST_CAP), scope: "project-wide" }
            : { count: null, error: s.fonts.error },
        missingFootage: {
            count: s.footage.count,
            items: footageInComp.slice(0, LIST_CAP).concat(s.footage.items.filter((it) => it.usedInComps.length === 0).slice(0, Math.max(0, LIST_CAP - footageInComp.length))),
            scope: "project-wide (usedInComps names the comps that use each)",
        },
        expressionErrors: {
            count: s.expressions.total,
            errors: s.expressions.errors,
            compsWalked: s.expressions.compsWalked,
            propertiesVisited: s.expressions.propertiesVisited,
            ...(s.expressions.truncated ? { truncated: true } : {}),
            note: "read after the frames were rendered: expressionError may only be filled in once After Effects has evaluated the expression",
        },
    };
}
/** Tile labels are short: a quarter-size portrait tile fits about 22 characters. */
const SHORT = {
    "near-black": "black",
    "near-white": "white",
    "clipped-high": "clip",
    "clipped-low": "crush",
};
async function makeSheet(source, outDir, flags, stretches, structure, fd, range, target, convert, maxTiles, thumbWidth, tag) {
    const tiles = new Map();
    const add = (frame, kind) => {
        const k = Math.max(range.from, Math.min(range.to, frame));
        const tile = tiles.get(k) ?? { frame: k, kinds: [] };
        if (!tile.kinds.includes(kind))
            tile.kinds.push(kind);
        tiles.set(k, tile);
    };
    for (const f of flags)
        add(f.frame, f.kind);
    for (const s of stretches)
        add(s.kind === "frozen" ? s.from.frame : (s.worst?.frame ?? s.from.frame), s.kind);
    const off = structure?.offFrame
        ?.findings ?? [];
    for (const o of off)
        add(o.worstAt.frame, `off-${o.edge}`);
    if (tiles.size === 0)
        return null;
    const all = [...tiles.values()].sort((a, b) => a.frame - b.frame);
    const chosen = all.slice(0, maxTiles);
    const res = await source.capture(chosen.map((c) => c.frame), outDir);
    if ("error" in res)
        return { writtenTo: null, error: `the sheet's frames could not be captured: ${res.error}` };
    const images = [];
    const labels = [];
    const kept = [];
    for (const c of chosen) {
        const got = res.frames.find((f) => f.frame === c.frame);
        if (!got?.path)
            continue;
        try {
            const pic = await readPicture(got.path, target, convert);
            await fs.writeFile(got.path, encodePngSrgb8(pic.width, pic.height, pic.rgb));
            images.push({ width: pic.width, height: pic.height, rgb: pic.rgb, bitDepth: 8 });
            kept.push({ frame: c.frame, time: r6(c.frame * fd), kinds: c.kinds, path: got.path });
        }
        catch {
            await fs.rm(got.path, { force: true });
        }
    }
    if (images.length === 0)
        return { writtenTo: null, error: "none of the sheet's frames could be read" };
    const tileW = Math.min(thumbWidth ?? 320, images[0].width);
    const maxChars = Math.max(4, Math.floor((tileW - 4) / LABEL_CHAR_PX));
    for (const k of kept)
        labels.push(`${k.time.toFixed(2)}s ${k.kinds.map((x) => SHORT[x] ?? x).join("+")}`.slice(0, maxChars));
    const sheet = composeContactSheet(images, {
        columns: Math.min(4, images.length),
        thumbWidth: tileW,
        labels,
    });
    const sheetPath = path.join(outDir, `check-sheet-${tag}.png`).replace(/\\/g, "/");
    await fs.writeFile(sheetPath, encodePngSrgb8(sheet.width, sheet.height, sheet.rgb));
    return {
        writtenTo: sheetPath,
        size: [sheet.width, sheet.height],
        tiles: kept.length,
        omitted: all.length - chosen.length,
        frames: kept,
        label: "each tile is labelled '<time>s <kind>' (several joined by +; black, white, clip and crush stand for near-black, near-white, clipped-high and clipped-low), time in seconds from the comp's start",
    };
}
//# sourceMappingURL=check-comp.js.map
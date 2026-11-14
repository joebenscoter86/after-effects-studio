// Reference operations: reference.report and reference.compare.
// Moved whole from keying.ts (which still registers them, in their order, and re-exports what it exported).
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { compareWithSheet, isPiece, isSheet } from "../color/look.js";
import { compareReferences, referenceReader } from "../color/sheet.js";
import { registerOp, jsxCompPreamble } from "../registry.js";
import { iccManagedReason } from "../tools/capture-shared.js";
import { movieColour, movieFrames, probeVideo } from "../video/movie-rgb.js";
import { measureRhythm } from "../video/rhythm.js";
import { CHECK_FILE_MAX_FRAMES, NODE_ONLY, PICTURE_MARGIN_BYTES, SETTLE_MAX_MS, captureBytes, fileCleanupJsx, fileCompJsx, liveFileIO, renderChunked, renderTally, roundTally, since, spaceRefusal } from "./keying-shared.js";
// ---------------------------------------------------------------------------
// Working to a reference (professional-finish plan, stage 3)
// ---------------------------------------------------------------------------
const MOVIE_EXT = /\.(mov|mp4|m4v|mxf|avi|webm|mkv|mpe?g)$/i;
const naturalOrder = (a, b) => a.localeCompare(b, undefined, { numeric: true });
/** The report without its motion map (the map is in the saved file, for the compare). */
function reportForReply(r) {
    const { map: _map, ...motion } = r.motion;
    return { ...r, motion };
}
/** JSX: a comp's size, length and rate. */
function referenceCompJsx(args) {
    return `
            ${jsxCompPreamble(args)}
            return { ok: true, name: _comp.name, id: _comp.id, width: _comp.width, height: _comp.height,
                frames: Math.round(_comp.duration * _comp.frameRate), frameRate: _comp.frameRate };
        `;
}
export async function runReferenceReport(args, io) {
    const started = performance.now();
    const outPath = args.outPath;
    if (typeof outPath !== "string" || !path.isAbsolute(outPath) || !/\.json$/i.test(outPath))
        return { ok: false, error: "`outPath` must be an absolute path for the report (.json)" };
    const sources = ["path", "item", "comp"].filter((k) => args[k] !== undefined && args[k] !== null);
    if (sources.length !== 1)
        return {
            ok: false,
            error: "give exactly one of `path` (a still, a folder of frames or a movie), `item` (a footage item's id) or `comp` (a build)",
        };
    const regions = Array.isArray(args.regions) ? args.regions : undefined;
    const cap = typeof args.maxFrames === "number" && args.maxFrames >= 1 ? Math.floor(args.maxFrames) : CHECK_FILE_MAX_FRAMES;
    const outDir = path.dirname(outPath);
    await fs.mkdir(outDir, { recursive: true });
    const keepCaptures = args.keepCaptures === true;
    const perFrameMs = Math.max(1, Math.round((typeof args.secondsPerFrame === "number" && args.secondsPerFrame > 0 ? args.secondsPerFrame : 10) * 1000));
    // Which frames: all up to `cap`, else spread evenly (then cuts and motion are not read).
    const pick = (n) => {
        if (n <= cap)
            return Array.from({ length: n }, (_, i) => i);
        const out = new Set();
        for (let i = 0; i < cap; i++)
            out.add(Math.floor((i * n) / cap));
        return [...out].sort((a, b) => a - b);
    };
    let source;
    let report;
    const renders = renderTally();
    const p = typeof args.path === "string" ? args.path : null;
    if (p !== null && !path.isAbsolute(p))
        return { ok: false, error: "`path` must be absolute" };
    const stat = p !== null ? await fs.stat(p).catch(() => null) : null;
    // A movie, read by ffmpeg in Node when it is installed (After Effects is the fallback, or asked for with via).
    const viaAe = args.via === "after-effects";
    const movieInfo = p !== null && MOVIE_EXT.test(p) && !viaAe && stat ? await probeVideo(p) : null;
    const colour = movieInfo && !("error" in movieInfo) ? await movieColour(p) : null;
    if (p !== null && movieInfo && !("error" in movieInfo) && colour) {
        const idx = pick(movieInfo.frames);
        // read as the After Effects path reads a movie: the same frames, the same reader
        const reader = referenceReader({ total: idx.length, regions, frameRate: movieInfo.nominalFps });
        for await (const fr of movieFrames(movieInfo, idx, colour))
            reader.add({ img: fr.img, frame: fr.frame, time: fr.time });
        report = reader.finish();
        source = { kind: "movie", path: p, via: "ffmpeg", frames: movieInfo.frames, read: idx.length, frameRate: movieInfo.nominalFps, colour: { matrix: colour.matrix, range: colour.range, tags: colour.tags, assumed: colour.assumed, reading: colour.reading } };
    }
    else if (p !== null && !MOVIE_EXT.test(p)) {
        // A still or a folder of frames: read in Node, no After Effects.
        if (!stat)
            return { ok: false, error: `nothing at ${p}` };
        const files = stat.isDirectory()
            ? (await fs.readdir(p))
                .filter((f) => /\.png$/i.test(f))
                .sort(naturalOrder)
                .map((f) => path.join(p, f))
            : [p];
        if (!files.length)
            return { ok: false, error: `no PNG frames in ${p}` };
        if (!files.every((f) => /\.png$/i.test(f)))
            return { ok: false, error: "a still must be a PNG (render other formats to PNG first)" };
        const idx = pick(files.length);
        const frameRate = typeof args.frameRate === "number" ? args.frameRate : undefined;
        // How far apart the files are: given, else the numbers in their names, else assumed neighbours (and checked against the change).
        const given = typeof args.frameStep === "number" && args.frameStep >= 1 ? Math.round(args.frameStep) : null;
        const nums = files.map((f) => {
            const m = /(\d+)(?!.*\d)/.exec(path.basename(f, path.extname(f)));
            return m ? Number(m[1]) : null;
        });
        const named = nums.every((n) => n !== null) && nums.every((n, i) => i === 0 || n > nums[i - 1]);
        const numberOf = (i) => (given !== null ? i * given : named ? nums[i] : i);
        const steps = idx.slice(1).map((i, k) => numberOf(i) - numberOf(idx[k]));
        const even = steps.length > 0 && steps.every((d) => d === steps[0]) ? steps[0] : null;
        const spacing = given !== null
            ? { how: "given", step: idx.length < files.length ? null : given }
            : named
                ? { how: "file names", step: even }
                : { how: "assumed", step: even };
        const reader = referenceReader({ total: idx.length, regions, frameRate, spacing });
        for (const i of idx) {
            const n = numberOf(i);
            reader.add({
                img: await io.readImage(files[i]),
                frame: n,
                time: frameRate ? n / frameRate : undefined,
            });
        }
        report = reader.finish();
        source = {
            kind: stat.isDirectory() ? "frames" : "still",
            path: p,
            files: files.length,
            read: idx.length,
            frameRate: frameRate ?? null,
        };
    }
    else {
        // A movie or footage item (into a throwaway comp), or a comp: rendered through After Effects by frame number.
        // Under Adobe's own colour management the captures do not match the viewer (stage 7): refuse first.
        const cm = await io.execute("return { ok: true, workingSpace: String(AE.safeGet(function () { return app.project.workingSpace; }, 'None')), colorManagementSystem: AE.safeGet(function () { return Number(app.project.colorManagementSystem); }, null), bitsPerChannel: app.project.bitsPerChannel };", { label: "reference.report colour", timeoutMs: 30_000, undoGroup: false });
        if (cm?.ok && cm.workingSpace && cm.workingSpace !== "None" && cm.workingSpace !== "" && cm.colorManagementSystem !== 1)
            return {
                ok: false,
                error: `${iccManagedReason(cm.workingSpace, cm.bitsPerChannel)} reference.report reads colour, levels, grain and sharpness from rendered frames, so it does not run here. A PNG still or a folder of frames is read without After Effects and still works.`,
            };
        const fromComp = args.comp !== undefined;
        const setup = fromComp
            ? await io.execute(referenceCompJsx({ comp: args.comp }), { label: "reference.report comp", timeoutMs: 60_000, undoGroup: false })
            : await io.execute(fileCompJsx({ path: p, item: typeof args.item === "number" ? args.item : null }), {
                label: "reference.report setup",
                timeoutMs: 120_000,
                undoGroup: true,
            });
        if (!setup?.ok)
            return { ok: false, error: setup?.error ?? "could not read the source in After Effects", setup };
        const compRef = fromComp ? args.comp : setup.compId;
        let cleanup = null;
        try {
            const roomless = await spaceRefusal(io, outDir, 40 * captureBytes([setup.width, setup.height]), PICTURE_MARGIN_BYTES, "this reference report");
            if (roomless)
                return roomless;
            const idx = pick(setup.frames);
            const reader = referenceReader({ total: idx.length, regions, frameRate: setup.frameRate });
            // A chunk at a time: render, read, remove.
            const size = Math.max(1, Math.min(32, Math.floor(SETTLE_MAX_MS / perFrameMs)));
            for (let b = 0; b * size < idx.length; b++) {
                const chunk = idx.slice(b * size, (b + 1) * size);
                const got = await renderChunked(io, { compNameOrId: compRef }, chunk, perFrameMs, outDir, "reference", renders, b);
                for (const r of got) {
                    if (!r.ok || !r.file)
                        return { ok: false, error: `frame ${r.frame} did not render: ${r.error ?? "no file"}` };
                    reader.add({ img: await io.readImage(r.file), frame: r.frame, time: r.frame / setup.frameRate });
                    if (!keepCaptures)
                        await fs.rm(r.file, { force: true });
                }
            }
            report = reader.finish();
        }
        finally {
            if (!fromComp)
                cleanup = await io.execute(fileCleanupJsx({ compId: setup.compId, itemId: setup.itemId, removeItem: setup.imported === true }), { label: "reference.report cleanup", timeoutMs: 60_000, undoGroup: true });
        }
        source = fromComp
            ? { kind: "comp", name: setup.name, frames: setup.frames, frameRate: setup.frameRate }
            : { kind: p !== null ? "movie" : "item", path: p, item: setup.itemName, frames: setup.frames, frameRate: setup.frameRate, cleanup };
    }
    // the rhythm (stage 13's census and shot list over the whole movie), when asked for: kept in the saved report
    let rhythm = null, rhythmNote = null;
    if (args.rhythm === true) {
        if (p !== null && MOVIE_EXT.test(p)) {
            const r = await measureRhythm(p);
            if ("error" in r)
                rhythmNote = `The rhythm was not measured: ${r.error}`;
            else
                rhythm = r;
        }
        else
            rhythmNote = "The rhythm is measured on a movie only (video.census and video.shots read it): render the build to a file and report that.";
    }
    await fs.writeFile(outPath, JSON.stringify(rhythm ? { ...report, rhythm } : report));
    let compare;
    if (typeof args.against === "string") {
        try {
            const against = JSON.parse(await fs.readFile(args.against, "utf8"));
            compare = isSheet(against) ? compareWithSheet(against, { report, rhythm }) : compareReferences(against, report);
        }
        catch (e) {
            compare = { error: `could not compare with ${args.against}: ${e instanceof Error ? e.message : String(e)}` };
        }
    }
    const reply = reportForReply(report);
    return {
        ok: true,
        source,
        frames: report.frames,
        report: reply,
        savedTo: outPath,
        ...(compare ? { compare } : {}),
        notes: [
            ...report.notes,
            ...(rhythmNote ? [rhythmNote] : []),
            ...(source.kind !== "frames" && source.kind !== "still" && !report.motion.consecutive && report.frames > 1
                ? [`Only ${report.frames} frames spread over the source were read (maxFrames ${cap}), so cuts and motion were not.`]
                : []),
        ],
        ...(rhythm ? { rhythm } : {}),
        timing: { render: roundTally(renders), totalMs: Math.round(since(started)) },
        next: compare
            ? "Read the differences largest first and decide which to fix; measure again after each fix."
            : "Run the same report on the build (comp) with against: this file's path, or reference.compare with two saved reports.",
    };
}
export async function runReferenceCompare(args) {
    const read = async (k) => {
        const v = args[k];
        if (typeof v !== "string" || !path.isAbsolute(v))
            throw new Error(`\`${k}\` must be the absolute path of a saved report`);
        return JSON.parse(await fs.readFile(v, "utf8"));
    };
    try {
        const ref = (await read("reference"));
        const build = (await read("build"));
        if (isSheet(ref)) {
            // a sheet: the build's report (with its rhythm when measured), or a piece a sheet saved
            const piece = isPiece(build) ? build : { report: build, rhythm: build.rhythm ?? null, type: null };
            return compareWithSheet(ref, piece);
        }
        if (isSheet(build))
            return { ok: false, error: "`build` is a look sheet: give the sheet as `reference` and the build's saved report as `build`" };
        return { ok: true, ...compareReferences(ref, (isPiece(build) ? build.report : build)) };
    }
    catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
}
const REFERENCE_REGIONS_PARAM = {
    name: "regions",
    type: "array",
    description: "Named regions in frame pixels, read beside the grid's nine ({ name, x, y, width, height, role? }); name the parts you mean (a wall, the subject's face, a neutral headrest) so the differences say them.",
    required: false,
};
registerOp({
    name: "reference.report",
    category: "look",
    description: "Measure a reference, or a build, for working to it. Give exactly one source: `path` (a PNG still, a folder of PNG frames in name order, or a movie), `item` (a footage item's id) or `comp` (the build). Stills and folders are read in Node; a movie is decoded by ffmpeg in Node when ffmpeg is installed (its YUV-to-RGB matrix and range read from the file's tags, Rec. 709 video range assumed where a tag is missing, and the reply says which; checked against After Effects' own render of the same 400 frames of five delivered 1080 x 1920 reels: levels within 0.0013, CIELAB within 0.04, edge width and grain within 0.02), else, like an item, brought into a throwaway comp and, like a comp, rendered through ae_render_frame by frame numbers (a quarter of a frame inside each frame, so no time lands on the frame before; checked live at 30, 29.97 and 24 fps), read and removed a chunk at a time. " +
        "Reports the main colours and their shares (k-means in CIELAB), black and white points and mean, CIELAB colour, edge width (sharpness) and grain at the grid's nine regions (top left to bottom right) and any named `regions`, where the weight of the frame sits (centres of brightness and of detail), and on consecutive frames the cuts, the mean change between frames and where the picture moves (a motion map; its centre is the moving subject in a talking-head shot). Colour and texture are read on 24 frames spread over the source, motion on every pair. " +
        "Saves the whole report as JSON at `outPath` (the reply leaves the motion map out). With `against` (a saved report of the reference) it adds `compare`: the differences largest first, each over a step (a CIELAB a* or b* of 2 is a cast, a quarter in edge width or grain, 5% in the subject's size, 3% of the frame in a place), in words. The subject's size and place are compared by lining up the two motion maps, only when they match as the same footage. " +
        "Measured live (After Effects 27.0): 235 frames of a 1080 x 1920 H.264 movie in 314 s, and of a comp in 317 s, nothing added to the disk cache. A comp renders without the compression noise of a delivered movie, so against a movie reference its grain reads lower: compare like with like where grain matters.",
    params: [
        { name: "path", type: "string", description: "Absolute path of a PNG still, a folder of PNG frames, or a movie.", required: false },
        { name: "item", type: "number", description: "A footage item's id, instead of path.", required: false },
        { name: "comp", type: "string", description: "A comp (the build), by name or id, instead of path.", required: false },
        { name: "outPath", type: "string", description: "Absolute path for the report (.json). Captures are written beside it and removed once read.", required: true },
        REFERENCE_REGIONS_PARAM,
        { name: "against", type: "string", description: "A saved report (the reference), or a look sheet (reference.sheet's sheet.json), to compare this one with. Against a sheet, only the measures of the user's look are compared, each against their own range and the number of pieces it rests on.", required: false },
        { name: "via", type: "string", description: "How a movie is read: 'ffmpeg' (the default when ffmpeg is installed: decoded in Node, no After Effects) or 'after-effects' (rendered frame by frame).", required: false },
        { name: "rhythm", type: "boolean", description: "Also measure a movie's rhythm (video.census over the whole movie and video.shots: calm, local and travel shares, travel moves a minute, calm runs, bursts, shot lengths, cuts a minute), kept in the saved report so a look sheet can compare it.", required: false },
        { name: "frameRate", type: "number", description: "Frames per second of a folder of frames (for times).", required: false },
        {
            name: "frameStep",
            type: "number",
            description: "How many frames apart a folder's files are (1: neighbours). Without it the step is read from numbers in the file names; with none, the files are taken as neighbours unless neighbouring files change by a median of 0.02 or more, as frames far apart do (a guess, said in notes). Cuts and movement are read only on neighbours.",
            required: false,
        },
        { name: "maxFrames", type: "number", description: `Most frames read (default ${CHECK_FILE_MAX_FRAMES}); beyond it frames are spread and cuts and motion are not read.`, required: false },
        { name: "secondsPerFrame", type: "number", description: "Render time allowed a frame (default 10).", required: false },
        { name: "keepCaptures", type: "boolean", description: "Keep the rendered frames (default false).", required: false },
    ],
    toJsx: () => NODE_ONLY("reference.report"),
    run: (args, transport) => runReferenceReport(args, liveFileIO(transport)),
});
registerOp({
    name: "reference.compare",
    category: "look",
    readOnly: true,
    description: "Compare two saved reference reports (reference.report's outPath): every difference over its step, largest first, in words (cast, lightness, sharpness, grain, levels, the moving subject's size and place, where the weight sits, main colours missing, cuts, motion). `reference` may be a look sheet (reference.sheet): then only the measures of the user's look are compared, each against their own range ('black point 0.09; your pieces sit between 0.02 and 0.04 (4 pieces)'); inside the range, or within one step of it, is no difference. No pass or fail. Node only; no After Effects.",
    params: [
        { name: "reference", type: "string", description: "Absolute path of the reference's saved report, or of a look sheet (sheet.json).", required: true },
        { name: "build", type: "string", description: "Absolute path of the build's saved report (with its rhythm when reference.report measured it), or of a piece a sheet saved.", required: true },
    ],
    toJsx: () => NODE_ONLY("reference.compare"),
    run: (args) => runReferenceCompare(args),
});
//# sourceMappingURL=keying-reference.js.map
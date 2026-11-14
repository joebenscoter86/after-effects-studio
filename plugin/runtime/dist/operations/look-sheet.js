// The look sheet's operations (stage 11): reference.sheet measures a user's approved pieces and keeps what stays the
// same across them, and how much it varies; reference.sheet_add measures one more piece without measuring the others
// again. Each piece is measured as reference.report measures it (a movie decoded by ffmpeg in Node when ffmpeg is
// installed), with its rhythm from stage 13's census and shot list, and its type when a comp's project is read.
// A build is then compared with the sheet by reference.compare or reference.report's `against`.
import { promises as fs } from "node:fs";
import os from "node:os";
import * as path from "node:path";
import { buildSheet, isPiece, isSheet, sheetMarkdown } from "../color/look.js";
import { registerOp, jsxVal } from "../registry.js";
import { measureRhythm } from "../video/rhythm.js";
import { runReferenceReport } from "./keying-reference.js";
import { CHECK_FILE_MAX_FRAMES, NODE_ONLY, liveFileIO } from "./keying-shared.js";
const MOVIE_EXT = /\.(mov|mp4|m4v|mxf|avi|webm|mkv|mpe?g)$/i;
const slug = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "piece";
/** The text layers of a comp: fonts, sizes (as a share of the comp's height, with the layer's own scale) and fills. */
function typeJsx(comp) {
    return `var c = AE.findCompByNameOrId(${jsxVal(comp)});
if (!c) return { ok: false, error: "no comp " + ${jsxVal(String(comp))} };
var out = [];
for (var i = 1; i <= c.numLayers; i++) {
  var l = c.layer(i);
  if (!(l instanceof TextLayer) || !l.enabled) continue;
  var mid = (Math.max(0, l.inPoint) + Math.min(c.duration, l.outPoint)) / 2;
  var d = l.property("ADBE Text Properties").property("ADBE Text Document").valueAtTime(mid, false);
  var sc = AE.safeGet(function () { return l.property("ADBE Transform Group").property("ADBE Scale").valueAtTime(mid, false); }, [100, 100]);
  out.push({ font: String(d.font), size: d.fontSize * Math.abs(sc[1]) / 100, tracking: d.tracking, fill: d.applyFill ? d.fillColor : null });
}
return { ok: true, height: c.height, layers: out };`;
}
function hexOf(c) {
    return c ? "#" + c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("") : null;
}
/** One piece measured: its report, its rhythm (a movie with ffmpeg) and its type (a comp with project: true). */
async function measurePiece(spec, dir, io, maxFrames, regions) {
    const label = typeof spec.label === "string" && spec.label.trim() ? spec.label.trim() : null;
    if (!label)
        return { error: "every piece needs a `label` (it names the piece on the sheet's page)" };
    const hasPath = typeof spec.path === "string", hasComp = spec.comp !== undefined;
    if (hasPath === hasComp)
        return { error: `piece "${label}": give exactly one of \`path\` (a movie, a folder of PNG frames or a still) and \`comp\`` };
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "look-piece-"));
    try {
        const r = await runReferenceReport({ ...(hasPath ? { path: spec.path } : { comp: spec.comp }), outPath: path.join(tmp, "report.json"), maxFrames, ...(regions ? { regions } : {}), ...(spec.via ? { via: spec.via } : {}) }, io);
        if (!r.ok)
            return { error: `piece "${label}": ${r.error}` };
        const report = JSON.parse(await fs.readFile(path.join(tmp, "report.json"), "utf8"));
        let rhythm = null, rhythmNote = null;
        if (hasPath && MOVIE_EXT.test(spec.path)) {
            const rh = await measureRhythm(spec.path);
            if ("error" in rh)
                rhythmNote = rh.error;
            else
                rhythm = rh;
        }
        let type = null;
        if (hasComp && spec.project === true) {
            const t = await io.execute(typeJsx(spec.comp), { label: "reference.sheet type", timeoutMs: 60_000, undoGroup: false });
            if (t?.ok) {
                const ls = t.layers, sizes = ls.map((l) => l.size / t.height).sort((a, b) => a - b), tr = ls.map((l) => l.tracking).sort((a, b) => a - b);
                const mid = (a) => (a.length ? a[a.length >> 1] : null);
                type = { layers: ls.length, fonts: [...new Set(ls.map((l) => String(l.font)))], sizeMedian: mid(sizes), sizeLargest: sizes.length ? sizes[sizes.length - 1] : null, trackingMedian: mid(tr), fills: [...new Set(ls.map((l) => hexOf(l.fill)).filter((x) => !!x))] };
            }
        }
        const src = r.source;
        return { kind: "look-piece", label, report, rhythm, type,
            source: { kind: src.kind, via: src.via ?? (src.kind === "frames" || src.kind === "still" ? "node" : "after-effects"), frames: src.frames ?? src.files ?? null, read: r.frames, frameRate: src.frameRate ?? null, ...(src.colour ? { colour: src.colour } : {}), ...(rhythmNote ? { rhythmNote } : {}), path: spec.path ?? null, comp: spec.comp ?? null } };
    }
    finally {
        await fs.rm(tmp, { recursive: true, force: true });
    }
}
async function writeSheet(dir, pieces) {
    const sheet = buildSheet(pieces), json = path.join(dir, "sheet.json"), page = path.join(dir, "sheet.md");
    await fs.writeFile(json, JSON.stringify(sheet, null, 1));
    await fs.writeFile(page, sheetMarkdown(sheet));
    return { sheet, json, page };
}
function reply(sheet, json, page, started, measured) {
    const look = sheet.measures.filter((m) => m.look).length, varies = sheet.measures.length - look;
    return { ok: true, standing: sheet.standing, pieces: sheet.pieces.map((p) => ({ label: p.label, via: p.source.via, colour: p.source.colour?.reading ?? null })), measured,
        measures: { look, varies }, colours: sheet.palette.filter((c) => c.look).map((c) => c.hex), files: { sheet: json, page },
        seconds: Math.round((performance.now() - started) / 100) / 10,
        reading: `A look sheet from ${sheet.standing}: ${look} measures hold across the pieces, ${varies} vary (not compared); ${sheet.palette.filter((c) => c.look).length} main colours are part of the look. Read ${path.basename(page)}; compare a build with reference.compare { reference: sheet.json, build } or reference.report { against: sheet.json }.`,
        next: "Compare a build with the sheet before hand-over: reference.report on its render with against: the sheet (rhythm: true for the rhythm)." };
}
export async function runLookSheet(args, io) {
    const started = performance.now();
    if (typeof args.outDir !== "string" || !path.isAbsolute(args.outDir))
        return { ok: false, error: "`outDir` must be an absolute folder for the sheet" };
    const pieces = Array.isArray(args.pieces) ? args.pieces : [];
    if (!pieces.length)
        return { ok: false, error: "`pieces` must list the approved pieces: [{ label, path } or { label, comp, project? }]" };
    const labels = pieces.map((p) => p?.label);
    if (new Set(labels).size !== labels.length)
        return { ok: false, error: "every piece needs its own `label`" };
    const maxFrames = typeof args.maxFrames === "number" && args.maxFrames >= 1 ? Math.floor(args.maxFrames) : CHECK_FILE_MAX_FRAMES;
    await fs.mkdir(path.join(args.outDir, "pieces"), { recursive: true });
    const done = [];
    for (const spec of pieces) {
        const p = await measurePiece(spec, args.outDir, io, maxFrames, args.regions);
        if ("error" in p)
            return { ok: false, error: p.error, measuredBefore: done.map((d) => d.piece.label) };
        const file = path.join("pieces", `${slug(p.label)}.json`);
        await fs.writeFile(path.join(args.outDir, file), JSON.stringify(p));
        done.push({ piece: p, file });
    }
    const { sheet, json, page } = await writeSheet(args.outDir, done);
    return reply(sheet, json, page, started, done.map((d) => d.piece.label));
}
export async function runLookSheetAdd(args, io) {
    const started = performance.now();
    if (typeof args.sheet !== "string" || !path.isAbsolute(args.sheet))
        return { ok: false, error: "`sheet` must be the absolute path of a sheet.json from reference.sheet" };
    let sheet;
    try {
        sheet = JSON.parse(await fs.readFile(args.sheet, "utf8"));
    }
    catch (e) {
        return { ok: false, error: `could not read ${args.sheet}: ${e.message}` };
    }
    if (!isSheet(sheet))
        return { ok: false, error: `${args.sheet} is not a look sheet` };
    const dir = path.dirname(args.sheet), spec = (args.piece ?? {});
    if (sheet.pieces.some((p) => p.label === spec.label))
        return { ok: false, error: `the sheet already has a piece labelled "${spec.label}"` };
    // the pieces already measured, read back (never measured again)
    const old = [];
    for (const p of sheet.pieces) {
        const got = JSON.parse(await fs.readFile(path.join(dir, p.file), "utf8"));
        if (!isPiece(got))
            return { ok: false, error: `${p.file} is not a measured piece` };
        old.push({ piece: got, file: p.file });
    }
    const maxFrames = typeof args.maxFrames === "number" && args.maxFrames >= 1 ? Math.floor(args.maxFrames) : CHECK_FILE_MAX_FRAMES;
    const p = await measurePiece(spec, dir, io, maxFrames, args.regions);
    if ("error" in p)
        return { ok: false, error: p.error };
    let file = path.join("pieces", `${slug(p.label)}.json`);
    for (let k = 2; old.some((o) => o.file === file); k++)
        file = path.join("pieces", `${slug(p.label)}-${k}.json`);
    await fs.mkdir(path.join(dir, "pieces"), { recursive: true });
    await fs.writeFile(path.join(dir, file), JSON.stringify(p));
    const w = await writeSheet(dir, [...old, { piece: p, file }]);
    return reply(w.sheet, w.json, w.page, started, [p.label]);
}
const PIECES_DESC = "The approved pieces: [{ label, path, via? }] for a movie, a folder of PNG frames or a still (via: 'after-effects' renders a movie through After Effects instead of decoding it with ffmpeg), or [{ label, comp, project? }] for a comp (project: true also reads its text layers' fonts, sizes and tracking). The label names the piece on the sheet's page.";
registerOp({
    name: "reference.sheet",
    category: "look",
    description: "A look sheet from a user's approved pieces: what stays the same across them, and how much it varies. Each piece is measured as reference.report measures it (a movie decoded by ffmpeg in Node when it is installed, no After Effects), with its rhythm from stage 13's census and shot list (calm, local and travel shares, travel moves a minute, calm runs, bursts, shot lengths, cuts a minute) and, for a comp with project: true, its type. " +
        "For each measure the sheet keeps the middle value, the lowest and highest piece and how many pieces it rests on; a measure whose range is wider than 3 of reference.compare's steps varies in the user's pieces and is never compared. Main colours are matched across pieces (within CIELAB 10) and are part of the look when two thirds of the pieces carry them. One piece is its own numbers, two give a range, three or more a look, and the sheet says how many every time. " +
        "Writes sheet.json, sheet.md (pieces named by their labels) and one file per piece under pieces/ (numbers only, nothing of the pictures), so reference.sheet_add never measures a piece twice. It describes what the pieces did, not what a new piece must do. Compare a build with reference.compare { reference: sheet.json } or reference.report { against: sheet.json }.",
    params: [
        { name: "pieces", type: "array", description: PIECES_DESC, required: true },
        { name: "outDir", type: "string", description: "Absolute folder for the sheet.", required: true },
        { name: "maxFrames", type: "number", description: `Most frames read a piece for its report (default ${CHECK_FILE_MAX_FRAMES}); the rhythm is read over the whole movie.`, required: false },
        { name: "regions", type: "array", description: "Named regions in frame pixels, read beside the grid's nine in every piece.", required: false },
    ],
    toJsx: () => NODE_ONLY("reference.sheet"),
    run: (args, transport) => runLookSheet(args, liveFileIO(transport)),
});
registerOp({
    name: "reference.sheet_add",
    category: "look",
    description: "Add one approved piece to a look sheet (reference.sheet): the piece is measured, the others are read back from their saved files, and the sheet and its page are written again with the new ranges.",
    params: [
        { name: "sheet", type: "string", description: "Absolute path of the sheet.json.", required: true },
        { name: "piece", type: "object", description: "{ label, path } or { label, comp, project? }, as in reference.sheet.", required: true },
        { name: "maxFrames", type: "number", description: `Most frames read for the piece's report (default ${CHECK_FILE_MAX_FRAMES}).`, required: false },
    ],
    toJsx: () => NODE_ONLY("reference.sheet_add"),
    run: (args, transport) => runLookSheetAdd(args, liveFileIO(transport)),
});
//# sourceMappingURL=look-sheet.js.map
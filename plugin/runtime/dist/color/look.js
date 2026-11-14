// The look sheet (stage 11): what stays the same across a user's approved pieces, and how much it varies. Pure
// functions: a piece's measures from its reference report (and its rhythm, and its type when a project was read), a
// sheet from pieces, a piece compared with a sheet, and the sheet's readable page. Numbers only: nothing of the
// pieces' pictures is kept, and pieces are named by the labels the caller gave.
import { REFERENCE_DEFAULTS } from "./sheet.js";
export const LOOK_RULES = {
    /** A measure is part of the look when its range across pieces is within this many of its comparison steps. */
    lookSteps: 3,
    /** A main colour is part of the look when this share of the pieces carry it (at least two thirds). */
    colourPieces: 2 / 3,
    /** Main colours under this share of a piece are left out of its palette. */
    colourShare: 0.02,
    /** A build's colour this large with nothing like it in the pieces is named. */
    newColourShare: 0.05,
    /** Pieces before a sheet is called a look. */
    lookPieces: 3,
};
const D = REFERENCE_DEFAULTS;
const P = (key, group, name, unit, how, step, digits, floor) => ({ key, group, name, unit, how, step, digits, ...(floor ? { floor } : {}) });
/** Every measure a piece gives. */
export function pieceMeasures(p) {
    const r = p.report, out = [];
    const add = (def, v) => { if (typeof v === "number" && Number.isFinite(v))
        out.push({ def, value: v }); };
    add(P("levels.black", "levels", "black point", "", "add", D.levelStep, 3), r.levels.lumaBlack);
    add(P("levels.white", "levels", "white point", "", "add", D.levelStep, 3), r.levels.lumaWhite);
    add(P("levels.mean", "levels", "mean level", "", "add", D.levelStep, 3), r.levels.lumaMean);
    for (const g of r.regions) {
        add(P(`region.${g.name}.L`, "colour by region", `lightness (L*) at ${g.name}`, "", "add", D.lightnessStep, 1), g.colour.L);
        add(P(`region.${g.name}.a`, "colour by region", `a* at ${g.name}`, "", "add", D.castStep, 1), g.colour.a);
        add(P(`region.${g.name}.b`, "colour by region", `b* at ${g.name}`, "", "add", D.castStep, 1), g.colour.b);
    }
    add(P("texture.edge", "texture", "edge width", " px", "ratio", D.ratioStep, 2), r.sharpness.edgeWidth);
    add(P("texture.grain", "texture", "grain", "", "ratio", D.ratioStep, 2, 0.05), r.grain);
    add(P("place.brightness.x", "placement", "centre of brightness across", "", "add", D.placeStep, 3), r.weight.brightness.x);
    add(P("place.brightness.y", "placement", "centre of brightness down", "", "add", D.placeStep, 3), r.weight.brightness.y);
    add(P("place.detail.x", "placement", "centre of detail across", "", "add", D.placeStep, 3), r.weight.detail.x);
    add(P("place.detail.y", "placement", "centre of detail down", "", "add", D.placeStep, 3), r.weight.detail.y);
    const s = r.motion.subject;
    if (s) {
        add(P("place.subject.x", "placement", "moving subject's centre across", "", "add", D.placeStep, 3), s.x);
        add(P("place.subject.y", "placement", "moving subject's centre down", "", "add", D.placeStep, 3), s.y);
    }
    const rh = p.rhythm;
    if (rh) {
        add(P("rhythm.calm", "rhythm", "calm share", "", "add", D.shareStep, 2), rh.census.calm);
        add(P("rhythm.local", "rhythm", "local movement share", "", "add", D.shareStep, 2), rh.census.local);
        add(P("rhythm.travel", "rhythm", "whole-stage travel share", "", "add", D.shareStep, 2), rh.census.travel);
        add(P("rhythm.travelPerMinute", "rhythm", "travel moves a minute", "", "ratio", D.ratioStep, 1, 1), rh.census.travelPerMinute);
        add(P("rhythm.calmRun", "rhythm", "calm run, median", " s", "ratio", D.ratioStep, 2, 0.1), rh.census.calmRunMedian);
        add(P("rhythm.bursts", "rhythm", "bursts every 10 s", "", "ratio", D.ratioStep, 2, 0.2), rh.census.burstsPer10s);
        add(P("rhythm.shotMedian", "rhythm", "shot length, median", " s", "ratio", D.ratioStep, 2, 0.2), rh.shots.medianSeconds);
        add(P("rhythm.cutsPerMinute", "rhythm", "cuts a minute", "", "ratio", D.ratioStep, 1, 1), rh.shots.cutsPerMinute);
    }
    const t = p.type;
    if (t) {
        add(P("type.sizeMedian", "type", "text size, median (share of frame height)", "", "ratio", D.ratioStep, 3, 0.005), t.sizeMedian);
        add(P("type.sizeLargest", "type", "largest text size (share of frame height)", "", "ratio", D.ratioStep, 3, 0.005), t.sizeLargest);
        add(P("type.tracking", "type", "tracking, median", "", "add", 10, 0), t.trackingMedian);
    }
    return out;
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const lv = (def, v) => (def.how === "ratio" ? Math.log(Math.max(v, def.floor ?? 1e-6)) : v);
const lstep = (def) => (def.how === "ratio" ? Math.log(def.step) : def.step);
const fmt = (def, v) => `${Number(v.toFixed(def.digits))}${def.unit}`;
const dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const hexOfLab = (lab) => {
    const fy = (lab[0] + 16) / 116, fx = fy + lab[1] / 500, fz = fy - lab[2] / 200, inv = (t) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
    const X = inv(fx) * 0.95047, Y = inv(fy), Z = inv(fz) * 1.08883;
    const lin = [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.204 * Y + 1.057 * Z];
    return "#" + lin.map((u) => Math.round(255 * Math.max(0, Math.min(1, u <= 0.0031308 ? 12.92 * u : 1.055 * u ** (1 / 2.4) - 0.055)))).map((v) => v.toString(16).padStart(2, "0")).join("");
};
/** The shot list's known limit, said beside the shot lengths. */
export const SHOT_LIMIT = "Shot lengths come from video.shots, which can read a change inside a shot (a launch, a flip) as a cut, so a shot can read shorter than it is.";
const standingOf = (n) => (n <= 1 ? "one piece: these are its own numbers, not a range" : n < LOOK_RULES.lookPieces ? `${n} pieces: a range, not yet a look` : `${n} pieces: a look`);
/** A sheet from pieces (with the file each was saved to). */
export function buildSheet(pieces) {
    const n = pieces.length, byKey = new Map();
    for (const { piece } of pieces)
        for (const v of pieceMeasures(piece)) {
            if (!byKey.has(v.def.key))
                byKey.set(v.def.key, []);
            byKey.get(v.def.key).push(v);
        }
    const measures = [];
    for (const vals of byKey.values()) {
        const def = vals[0].def, xs = vals.map((v) => v.value), min = Math.min(...xs), max = Math.max(...xs);
        const spreadSteps = (lv(def, max) - lv(def, min)) / lstep(def);
        const look = spreadSteps <= LOOK_RULES.lookSteps + 1e-9;
        measures.push({ ...def, median: median(xs), min, max, pieces: vals.length, look,
            ...(look ? {} : { why: `varies in your pieces: ${fmt(def, min)} to ${fmt(def, max)}, ${spreadSteps.toFixed(1)} steps apart (a look holds within ${LOOK_RULES.lookSteps})` }) });
    }
    // main colours, matched across pieces within the comparison's own colour match
    const clusters = [];
    pieces.forEach(({ piece }, i) => {
        for (const c of piece.report.palette.filter((c) => c.share >= LOOK_RULES.colourShare)) {
            const lab = [c.colour.L, c.colour.a, c.colour.b];
            const hit = clusters.find((k) => dE(k.lab, lab) <= D.colourMatch);
            if (hit) {
                hit.members.push({ i, share: c.share, lab });
                const m = hit.members;
                hit.lab = [0, 1, 2].map((d) => m.reduce((s, x) => s + x.lab[d], 0) / m.length);
            }
            else
                clusters.push({ lab, members: [{ i, share: c.share, lab }] });
        }
    });
    const palette = clusters.map((k) => {
        const per = new Map();
        for (const m of k.members)
            per.set(m.i, (per.get(m.i) ?? 0) + m.share);
        const shares = [...per.values()];
        return { hex: hexOfLab(k.lab), lab: k.lab.map((v) => Math.round(v * 10) / 10), pieces: per.size, ofPieces: n,
            shareMin: Math.round(Math.min(...shares) * 1000) / 1000, shareMax: Math.round(Math.max(...shares) * 1000) / 1000, look: per.size >= Math.ceil(LOOK_RULES.colourPieces * n - 1e-9) };
    }).sort((a, b) => b.pieces - a.pieces || b.shareMax - a.shareMax);
    const typed = pieces.filter((p) => p.piece.type);
    const fontCount = new Map();
    for (const p of typed)
        for (const f of new Set(p.piece.type.fonts))
            fontCount.set(f, (fontCount.get(f) ?? 0) + 1);
    const rhythmless = pieces.filter((p) => !p.piece.rhythm).map((p) => p.piece.label);
    return {
        kind: "look-sheet", version: 1,
        pieces: pieces.map(({ piece, file }) => ({ label: piece.label, file, source: piece.source })),
        rules: LOOK_RULES, standing: standingOf(n), measures, palette,
        type: typed.length ? { fonts: [...fontCount].map(([font, k]) => ({ font, pieces: k })).sort((a, b) => b.pieces - a.pieces), pieces: typed.length } : null,
        notMeasured: [
            ...(typed.length < n ? [`type (fonts, sizes, tracking): read only from a project, ${typed.length} of ${n} pieces had one; from a movie alone it is not measurable`] : []),
            ...(rhythmless.length ? [`rhythm for ${rhythmless.join(", ")}: needs the piece as a movie read by ffmpeg`] : []),
            "a cut-out's edge (not in version 1)",
            "the tracker's per-move numbers (not reliable enough to average)",
        ],
        notes: [
            "The sheet describes what these pieces did, not what a new piece must do.",
        ],
    };
}
/** A piece (a report, with its rhythm and type when measured) compared with a sheet: only the look's measures, against the user's own range. */
export function compareWithSheet(sheet, piece) {
    const values = new Map(pieceMeasures(piece).map((v) => [v.def.key, v.value]));
    const n = sheet.pieces.length, of = (k) => `${k} piece${k === 1 ? "" : "s"}`;
    const diffs = [], inside = [], notCompared = [];
    for (const m of sheet.measures) {
        const v = values.get(m.key);
        if (!m.look) {
            notCompared.push(`${m.name} (${m.why})`);
            continue;
        }
        if (v === undefined) {
            if (m.group === "rhythm" || m.group === "type")
                notCompared.push(`${m.name} (not measured on this piece)`);
            continue;
        }
        const def = m, lo = lv(def, m.min), hi = lv(def, m.max), x = lv(def, v), st = lstep(def);
        const beyond = x < lo - st ? (lo - x) / st : x > hi + st ? (x - hi) / st : 0;
        if (!beyond) {
            inside.push(m.name);
            continue;
        }
        const range = m.min === m.max ? `your ${of(m.pieces)}: ${fmt(def, m.min)}` : `your pieces sit between ${fmt(def, m.min)} and ${fmt(def, m.max)} (${of(m.pieces)})`;
        diffs.push({ measure: m.name, size: Math.round(beyond * 10) / 10, value: Number(v.toFixed(m.digits)), range: [m.min, m.max], pieces: m.pieces, reading: `${m.name} ${fmt(def, v)}; ${range}.` });
    }
    // colours: a colour of the look the piece lacks, or a large colour of the piece the pieces never had
    const pal = piece.report.palette.map((c) => ({ hex: c.hex, share: c.share, lab: [c.colour.L, c.colour.a, c.colour.b] }));
    for (const c of sheet.palette.filter((c) => c.look))
        if (!pal.some((p) => dE(p.lab, c.lab) <= D.colourMatch))
            diffs.push({ measure: "main colours", size: 1, value: "missing", pieces: c.pieces, reading: `${c.hex} is missing; ${c.pieces} of your ${of(n)} carry it (${Math.round(c.shareMin * 100)} to ${Math.round(c.shareMax * 100)} % of the frame).` });
    for (const p of pal.filter((p) => p.share >= LOOK_RULES.newColourShare))
        if (!sheet.palette.some((c) => dE(p.lab, c.lab) <= D.colourMatch))
            diffs.push({ measure: "main colours", size: 1, value: p.hex, pieces: n, reading: `${p.hex} covers ${Math.round(p.share * 100)} % of the frame; none of your ${of(n)} has a colour like it.` });
    if (sheet.type && piece.type) {
        const known = new Set(sheet.type.fonts.map((f) => f.font));
        const fresh = piece.type.fonts.filter((f) => !known.has(f));
        if (fresh.length)
            diffs.push({ measure: "fonts", size: 1, value: fresh.join(", "), pieces: sheet.type.pieces, reading: `${fresh.join(", ")} ${fresh.length === 1 ? "is" : "are"} not in your pieces; they use ${sheet.type.fonts.map((f) => f.font).join(", ")} (${of(sheet.type.pieces)} with a project).` });
    }
    diffs.sort((a, b) => b.size - a.size);
    return {
        ok: true, against: "look sheet", standing: sheet.standing, differences: diffs, insideTheLook: inside, notCompared,
        reading: diffs.length ? `${diffs.length} difference${diffs.length === 1 ? "" : "s"} from your ${sheet.standing.split(":")[0]}, largest first: ${diffs.map((d) => d.reading).join(" ")}` : `Within your pieces' range on every measure of the look (${sheet.standing.split(":")[0]}).`,
    };
}
export function isSheet(x) { return !!x && typeof x === "object" && x.kind === "look-sheet"; }
export function isPiece(x) { return !!x && typeof x === "object" && x.kind === "look-piece"; }
/** The sheet's readable page: the look first, then what varies, the colours, the rhythm's limits and what was not measured. */
export function sheetMarkdown(s) {
    const of = (k) => `${k} piece${k === 1 ? "" : "s"}`;
    const row = (m) => { const d = m; return `| ${m.name} | ${fmt(d, m.median)} | ${m.min === m.max ? fmt(d, m.min) : `${fmt(d, m.min)} to ${fmt(d, m.max)}`} | ${m.pieces} |`; };
    const groups = [...new Set(s.measures.map((m) => m.group))];
    const lines = [`# Look sheet`, "", `${s.standing[0].toUpperCase()}${s.standing.slice(1)}: ${s.pieces.map((p) => p.label).join(", ")}.`, "", ...s.notes.map((x) => `- ${x}`), ""];
    for (const g of groups) {
        const look = s.measures.filter((m) => m.group === g && m.look);
        if (!look.length)
            continue;
        lines.push(`## ${g[0].toUpperCase()}${g.slice(1)}`, "", "| Measure | Middle | Range | Pieces |", "|---|---|---|---|", ...look.map(row), "");
        if (g === "rhythm")
            lines.push(SHOT_LIMIT, "");
    }
    const varies = s.measures.filter((m) => !m.look);
    if (varies.length)
        lines.push("## Varies in your pieces (not compared)", "", ...varies.map((m) => `- ${m.name}: ${m.why}`), "");
    lines.push("## Main colours", "", "| Colour | Pieces | Share of the frame | Part of the look |", "|---|---|---|---|", ...s.palette.map((c) => `| ${c.hex} | ${c.pieces} of ${c.ofPieces} | ${Math.round(c.shareMin * 100)} to ${Math.round(c.shareMax * 100)} % | ${c.look ? "yes" : "no"} |`), "");
    if (s.type)
        lines.push("## Type", "", `From ${of(s.type.pieces)} with a project: ${s.type.fonts.map((f) => `${f.font} (${f.pieces})`).join(", ")}.`, "");
    lines.push("## Not measured", "", ...s.notMeasured.map((x) => `- ${x}`), "");
    return lines.join("\n");
}
//# sourceMappingURL=look.js.map
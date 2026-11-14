// Subject operations, soften edge: subject.soften_edge.
// Moved whole from keying.ts (which still registers them, in their order, and re-exports what it exported).
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { distanceTo, furthestFrame, matteCoverage, subjectTop } from "../color/matte.js";
import { labOf, lookCrops, measureLook, summarizeLookSeries } from "../color/sheet.js";
import { registerOp, jsxVal, jsxCompLayerPreamble } from "../registry.js";
import { OBJECT_MATTE_MATCH_NAME, OBJECT_MATTE_SELECTIONS_MATCH_NAME, PICTURE_MARGIN_BYTES, SETTLE_MAX_MS, SOFT_EDGE_DEFAULTS, aeCacheRoot, cacheBytesFor, captureBytes, compLayerParams, liveCutoutIO, needSelection, perFrameMsOf, since, spacePlan, trackedSpan } from "./keying-shared.js";
export const SOFT_EDGE_COST = "The soft edge is two copies of the matte, so After Effects computes Object Matte twice for every frame: a render writes about twice the disk cache and takes several times as long (on the half-size take, 320 frames at 1088 × 1920: 342 s and 9.0 GB of cache, against 65 to 92 s and about 5 GB with one matte; subject.render_cutout counts both copies).";
/** The region's lower line: given, or `regionDepth` of the comp's height under the lowest top of the subject. */
export function softRegionBottom(tops, compHeight, given) {
    if (typeof given === "number" && Number.isFinite(given))
        return Math.round(given);
    const valid = tops.filter((t) => t >= 0);
    const lowest = valid.length ? Math.max(...valid) : 0;
    return Math.min(compHeight, lowest + Math.round(SOFT_EDGE_DEFAULTS.regionDepth * compHeight));
}
const SOFT_MARKER = "soft-edge";
/**
 * JSX: build the soft edge of fact 38. Two duplicates of the matted layer
 * (both keep the selections): the upper with Refine Edge, the lower as
 * clicked, each with Decontaminate Edge Colors when asked and its sound off;
 * one solid with a feathered mask over the region, the upper copy's Alpha
 * matte and the lower's Alpha Inverted matte (applied after the effects, so
 * the two add up to one); the upper copy in Alpha Add; the three precomposed
 * into "<layer> soft edge", placed above the matted layer, which is switched
 * off and otherwise untouched (it keeps the sound).
 */
export function softenBuildJsx(args) {
    const marker = {
        compRoom: SOFT_MARKER,
        radius: args.radius,
        smooth: args.smooth,
        chatterReduction: args.chatterReduction,
        decontaminate: args.decontaminate,
        regionBottom: args.regionBottom,
        feather: args.feather,
    };
    return `
            ${jsxCompLayerPreamble(args)}
            var _name = _layer.name + " soft edge";
            for (var _li = 1; _li <= _comp.numLayers; _li++) if (_comp.layer(_li).name === _name) return { ok: false, error: "comp " + _comp.name + " already has a layer '" + _name + "'; undo it first (subject.soften_edge { undo: true })" };
            var _fxRoot = _layer.property("ADBE Effect Parade");
            var _om = null;
            for (var _fi = 1; _fi <= _fxRoot.numProperties; _fi++) if (_fxRoot.property(_fi).matchName === ${jsxVal(OBJECT_MATTE_MATCH_NAME)}) { _om = _fi; break; }
            if (_om === null) return { ok: false, error: "layer '" + _layer.name + "' has no Object Matte" };
            function _walk(g, mn) {
                for (var k = 1; k <= g.numProperties; k++) {
                    var p = g.property(k);
                    if (p.matchName === mn) return p;
                    if (p.propertyType !== PropertyType.PROPERTY && p.matchName !== ${jsxVal(OBJECT_MATTE_SELECTIONS_MATCH_NAME)}) { var r = _walk(p, mn); if (r) return r; }
                }
                return null;
            }
            function _set(layer, vals) {
                var fx = layer.property("ADBE Effect Parade").property(_om);
                for (var k in vals) { if (!vals.hasOwnProperty(k)) continue; var p = _walk(fx, k); if (!p) throw new Error("Object Matte has no property " + k); p.setValue(vals[k]); }
            }
            var _wasEnabled = _layer.enabled;
            var _up = _layer.duplicate(); _up.name = _layer.name + " soft";
            var _lo = _layer.duplicate(); _lo.name = _layer.name + " as clicked";
            var _dec = ${jsxVal(args.decontaminate ? 1 : 0)};
            _set(_up, { "/baserefineedgeradius": ${jsxVal(args.radius)}, "/HBspatialsmoothing": ${jsxVal(args.smooth)}, "/chatter_reduction2": ${jsxVal(args.chatterReduction)}, "/rmcleanedgecolors": _dec });
            _set(_lo, { "/rmcleanedgecolors": _dec });
            var _copies = [_up, _lo];
            for (var _ci = 0; _ci < _copies.length; _ci++) {
                var _c = _copies[_ci];
                _c.enabled = true;
                if (AE.safeGet(function () { return _c.hasAudio; }, false)) { try { _c.audioEnabled = false; } catch (eA) {} }
            }
            var _w = _comp.width, _h = _comp.height;
            var _z = _comp.layers.addSolid([1, 1, 1], _layer.name + " edge region", _w, _h, 1, _comp.duration);
            var _m = _z.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
            var _sh = new Shape();
            _sh.vertices = [[-_w, -_h], [2 * _w, -_h], [2 * _w, ${jsxVal(args.regionBottom)}], [-_w, ${jsxVal(args.regionBottom)}]];
            _sh.closed = true;
            _m.property("ADBE Mask Shape").setValue(_sh);
            _m.property("ADBE Mask Feather").setValue([${jsxVal(args.feather)}, ${jsxVal(args.feather)}]);
            _m.maskMode = MaskMode.ADD;
            _lo.moveBefore(_layer); _up.moveBefore(_lo); _z.moveBefore(_up);
            _up.setTrackMatte(_z, TrackMatteType.ALPHA);
            _lo.setTrackMatte(_z, TrackMatteType.ALPHA_INVERTED);
            _up.blendingMode = BlendingMode.ALPHA_ADD;
            var _pc = _comp.layers.precompose([_z.index, _up.index, _lo.index], _name, true);
            var _pl = null;
            for (var _pi = 1; _pi <= _comp.numLayers; _pi++) if (AE.safeGet(function () { return _comp.layer(_pi).source; }, null) === _pc) { _pl = _comp.layer(_pi); break; }
            if (!_pl) throw new Error("the precomp layer was not found after precompose");
            _pl.name = _name;
            var _mk = ${jsxVal(marker)};
            _mk.layer = _layer.name; _mk.wasEnabled = _wasEnabled;
            function _q(t) { var o = ""; for (var i = 0; i < t.length; i++) { var ch = t.charAt(i); if (ch === '"' || ch === '\\\\') o += '\\\\'; o += ch; } return '"' + o + '"'; }
            _pl.comment = "{" + '"compRoom":"' + _mk.compRoom + '","layer":' + _q(String(_mk.layer)) + ',"radius":' + _mk.radius + ',"smooth":' + _mk.smooth + ',"chatterReduction":' + _mk.chatterReduction + ',"decontaminate":' + _mk.decontaminate + ',"regionBottom":' + _mk.regionBottom + ',"feather":' + _mk.feather + ',"wasEnabled":' + _mk.wasEnabled + "}";
            _pc.comment = "comp-room ${SOFT_MARKER} of " + _layer.name;
            _pl.moveBefore(_layer);
            _pl.enabled = true;
            _layer.enabled = false;
            return { ok: true, softLayer: _name, softIndex: _pl.index, precomp: _pc.name, precompId: _pc.id, wasEnabled: _wasEnabled,
                inside: [_layer.name + " edge region", _layer.name + " soft", _layer.name + " as clicked"] };
        `;
}
/** JSX: remove what softenBuildJsx made and switch the matted layer back as it was. */
export function softenUndoJsx(args) {
    return `
            ${jsxCompLayerPreamble(args)}
            var _name = _layer.name + " soft edge";
            var _pl = null;
            for (var _li = 1; _li <= _comp.numLayers; _li++) {
                var _l = _comp.layer(_li);
                if (_l.name === _name && String(AE.safeGet(function () { return _l.comment; }, "")).indexOf(${jsxVal(SOFT_MARKER)}) >= 0) { _pl = _l; break; }
            }
            if (!_pl) return { ok: false, error: "comp " + _comp.name + " has no soft edge for layer '" + _layer.name + "'" };
            var _was = true;
            try { var _st = eval("(" + _pl.comment + ")"); if (_st && _st.wasEnabled === false) _was = false; } catch (eJ) {}
            var _pc = _pl.source;
            var _solids = [];
            for (var _ii = 1; _ii <= _pc.numLayers; _ii++) {
                var _src = AE.safeGet(function () { return _pc.layer(_ii).source; }, null);
                if (_src && _src.mainSource && _src.mainSource instanceof SolidSource) _solids.push(_src);
            }
            _pl.remove();
            var _removed = [_name];
            try { _pc.remove(); _removed.push("precomp " + _name); } catch (eP) {}
            for (var _si = 0; _si < _solids.length; _si++) { try { if (_solids[_si].usedIn.length === 0) { _solids[_si].remove(); _removed.push("solid"); } } catch (eS) {} }
            _layer.enabled = _was;
            return { ok: true, removed: _removed, restored: _layer.name, enabled: _layer.enabled };
        `;
}
const meanLab = (img, pick) => {
    const sum = [0, 0, 0];
    let n = 0;
    for (let p = 0; p < img.width * img.height; p++) {
        if (!pick(p))
            continue;
        for (let k = 0; k < 3; k++)
            sum[k] += img.rgb[p * 3 + k];
        n++;
    }
    return n ? { lab: labOf(sum.map((v) => v / n)), n } : null;
};
const deltaE = (a, b) => Math.hypot(a.L - b.L, a.a - b.a, a.b - b.b);
export async function runSoftenEdge(args, io) {
    const started = performance.now();
    if (args.undo === true) {
        const u = await io.execute(softenUndoJsx({ comp: args.comp, layer: args.layer }), {
            label: "subject.soften_edge undo",
            timeoutMs: 60_000,
        });
        return u?.ok
            ? { ...u, note: "The comp is back to the single matted layer." }
            : { ok: false, error: u?.error ?? "the undo failed" };
    }
    if (args.across !== undefined)
        return {
            ok: false,
            error: "`across` was removed: sampling the whole clip before the render cost more disk cache than the render (12.9 GB estimated against 9.5 GB on the half-size take). subject.check_file reads every frame of the rendered file instead: it stops on see-through inside the cut-out and notes the frames where the hair crosses the region's line. Leave `across` out, or give sampleFrames.",
        };
    const outDir = args.outDir;
    if (typeof outDir !== "string" || !path.isAbsolute(outDir))
        return { ok: false, error: "`outDir` must be an absolute folder for the pictures" };
    const num = (k, d) => typeof args[k] === "number" && Number.isFinite(args[k]) ? args[k] : d;
    const D = SOFT_EDGE_DEFAULTS;
    const settings = {
        radius: num("radius", D.radius),
        smooth: num("smooth", D.smooth),
        chatterReduction: num("chatterReduction", D.chatterReduction),
        decontaminate: typeof args.decontaminate === "boolean" ? args.decontaminate : D.decontaminate,
        feather: num("feather", D.feather),
    };
    const outsideLimit = num("outsideLimit", D.outsideLimit);
    const background = Array.isArray(args.background) ? args.background : undefined;
    const st = await io.status();
    if (!st?.ok)
        return { ok: false, error: st?.error ?? "subject.status failed", status: st };
    const missing = needSelection(st);
    if (missing)
        return { ok: false, error: missing };
    if (st.softEdge)
        return {
            ok: false,
            error: `the layer already has a soft edge ('${st.softEdge.layer}'); undo it first with subject.soften_edge { undo: true }`,
        };
    const span = st.span ?? { inFrame: 0, outFrame: 1 };
    const clicks = (st.selections ?? [])
        .map((s) => s.clickFrame)
        .filter((f) => typeof f === "number");
    const click = clicks.length ? Math.min(...clicks) : span.inFrame;
    // Frames to sample: those given (each inside the layer), or every `nearStep`th frame in the `near` frames from the click. The click frame always.
    const sampling = Array.isArray(args.sampleFrames) ? "given" : "near the click";
    const nearFrames = [];
    for (let f = click; f < Math.min(span.outFrame, click + D.near); f += D.nearStep)
        nearFrames.push(f);
    const samples = Array.isArray(args.sampleFrames)
        ? [
            ...new Set([
                click,
                ...args.sampleFrames
                    .filter((f) => typeof f === "number" && f >= span.inFrame && f < span.outFrame)
                    .map((f) => Math.round(f)),
            ]),
        ].sort((a, b) => a - b)
        : nearFrames;
    const held = [];
    for (let f = click; f < Math.min(span.outFrame, click + 5); f++)
        held.push(f);
    const perFrame = perFrameMsOf(args);
    const room = await spacePlan(io, [
        {
            where: outDir,
            parts: { pictures: (samples.length + held.length) * 4 * captureBytes(st.compSize) },
        },
        {
            where: aeCacheRoot(st.aeCache?.folder, st.aeCache?.version) ?? outDir,
            parts: { cache: 3 * cacheBytesFor(trackedSpan(samples), st.sourceSize ?? st.compSize) },
        },
    ], PICTURE_MARGIN_BYTES, "the soft edge's check");
    if (room.refusal)
        return room.refusal;
    const captures = [];
    const renderFrames = async (frames, name, extra) => {
        const r = await io.render({
            compNameOrId: args.comp,
            frames,
            outPath: path.join(outDir, `${name}.png`),
            settleTimeoutMs: Math.min(SETTLE_MAX_MS, frames.length * perFrame + 30_000),
            ...extra,
        });
        const out = new Map();
        for (const f of (r?.frames ?? [])) {
            if (!f?.ok || typeof f.writtenTo !== "string")
                continue;
            captures.push(f.writtenTo);
            out.set(f.frame, { file: f.writtenTo, img: await io.readImage(f.writtenTo) });
        }
        return out;
    };
    const uniq = (a) => [...new Set(a)].sort((x, y) => x - y);
    // 1. The matte as clicked, on the sampled frames and the held stretch.
    const asClicked = await renderFrames(uniq([...samples, ...held]), "soft-edge_as-clicked", {
        isolate: args.layer,
        channels: "rgba",
    });
    const ref = asClicked.get(click);
    if (!ref?.img.alpha)
        return { ok: false, error: `the matte as clicked did not render on frame ${click}` };
    const W = ref.img.width;
    const H = ref.img.height;
    const others = samples
        .filter((f) => f !== click && asClicked.get(f)?.img.alpha)
        .map((f) => ({ frame: f, alpha: asClicked.get(f).img.alpha }));
    const furthest = others.length
        ? furthestFrame(ref.img.alpha, others, W, H)
        : { frame: click, overlap: 1 };
    const tops = samples.map((f) => asClicked.get(f)?.img.alpha
        ? subjectTop(asClicked.get(f).img.alpha, W, H)
        : -1);
    const given = typeof args.regionBottom === "number" ? args.regionBottom : undefined;
    const bottom = softRegionBottom(tops, H, given);
    const checkFrames = uniq([click, furthest.frame]);
    // Regions for look: the region's top and sides, and the outline below it.
    const top = subjectTop(ref.img.alpha, W, H);
    const xs = (y0, y1) => {
        let a = W;
        let b = -1;
        for (let y = Math.max(0, y0); y < Math.min(H, y1); y++)
            for (let x = 0; x < W; x++)
                if (ref.img.alpha[y * W + x] >= 0.5) {
                    if (x < a)
                        a = x;
                    if (x > b)
                        b = x;
                }
        return b < 0
            ? null
            : { x: Math.max(0, a - 12), width: Math.min(W, b + 13) - Math.max(0, a - 12) };
    };
    const regionDefs = [
        { name: "regionTop", y0: top - 20, y1: top + Math.max(40, Math.round(0.035 * H)) },
        {
            name: "regionSide",
            y0: top + Math.max(40, Math.round(0.035 * H)),
            y1: bottom - Math.round(settings.feather / 2),
        },
        {
            name: "outside",
            y0: bottom + settings.feather + 20,
            y1: bottom + settings.feather + 20 + Math.round(0.1 * H),
        },
    ];
    const lookArgs = {
        regions: regionDefs
            .filter((r) => r.y1 - r.y0 >= 6)
            .map((r) => ({
            name: r.name,
            y: Math.max(0, r.y0),
            height: Math.min(H, r.y1) - Math.max(0, r.y0),
            ...(xs(r.y0, r.y1) ?? { x: 0, width: W }),
        })),
        minContrast: 0.08,
        ...(background ? { background } : {}),
    };
    const lookOf = (frames) => {
        const first = frames.get(click)?.img;
        if (!first)
            return null;
        const per = measureLook(first, lookArgs).regions;
        const series = summarizeLookSeries(held.filter((f) => frames.get(f)).map((f) => lookCrops(frames.get(f).img, lookArgs)), lookArgs);
        const out = {};
        for (const r of per) {
            if ("error" in r)
                continue;
            out[r.name] = {
                box: r.rect,
                edgeWidth: r.matte?.edgeWidth ?? null,
                p90: r.matte?.p90 ?? null,
                softBand: r.matte?.softBand ?? null,
                towardBackground: r.edgeColour?.towardBackground ?? null,
                edgeColourDifference: r.edgeColour?.difference ?? null,
                matteChange: series.regions.find((x) => x.name === r.name)?.matteChange ?? null,
            };
        }
        return out;
    };
    const lookBefore = lookOf(asClicked);
    // 2. The whole comp before, on the check frames.
    const wholeBefore = await renderFrames(checkFrames, "soft-edge_whole-before", {});
    // 3. Build.
    const built = await io.execute(softenBuildJsx({ comp: args.comp, layer: args.layer, ...settings, regionBottom: bottom }), { label: "subject.soften_edge", timeoutMs: 120_000 });
    if (!built?.ok)
        return { ok: false, error: built?.error ?? "the build failed", built };
    const softLayer = built.softLayer;
    // 4. After: the soft-edge layer alone, and the whole comp.
    const after = await renderFrames(uniq([...checkFrames, ...held]), "soft-edge_after", {
        isolate: softLayer,
        channels: "rgba",
    });
    const wholeAfter = await renderFrames(checkFrames, "soft-edge_whole-after", {});
    // 5. The closing check.
    const checks = checkFrames.map((f) => {
        const a = asClicked.get(f)?.img;
        const b = after.get(f)?.img;
        const wb = wholeBefore.get(f)?.img;
        const wa = wholeAfter.get(f)?.img;
        if (!a?.alpha || !b?.alpha || !wb || !wa)
            return { frame: f, error: "a render of this frame is missing", seenThrough: null };
        const cov = matteCoverage(a.alpha, b.alpha, W, H, { deep: D.deep, outside: D.outside });
        // Colour inside the subject, as clicked against after: the whole of it, and each band of rows across the region's line.
        const scratch = new Float32Array(W * H);
        const dIn = new Float32Array(W * H);
        distanceToSolid(a.alpha, W, H, scratch, dIn);
        const deepAt = (p) => a.alpha[p] >= 0.99 && dIn[p] > D.deep;
        let worst = 0;
        const whole0 = meanLab(wb, deepAt);
        const whole1 = meanLab(wa, deepAt);
        if (whole0 && whole1)
            worst = deltaE(whole0.lab, whole1.lab);
        for (let y = Math.max(0, bottom - settings.feather); y < Math.min(H, bottom + settings.feather); y += 4) {
            const inRow = (p) => p >= y * W && p < (y + 4) * W && deepAt(p);
            const r0 = meanLab(wb, inRow);
            const r1 = meanLab(wa, inRow);
            if (r0 && r1 && r0.n >= 20)
                worst = Math.max(worst, deltaE(r0.lab, r1.lab));
        }
        return {
            frame: f,
            seenThrough: cov.seenThrough,
            minAlpha: cov.minAlpha,
            band: cov.band,
            outside: cov.outside,
            colourDifference: Math.round(worst * 100) / 100,
        };
    });
    const failures = [];
    for (const c of checks) {
        if (c.seenThrough === null)
            failures.push(`frame ${c.frame}: ${c.error}`);
        else {
            if (c.seenThrough > 0)
                failures.push(`frame ${c.frame}: ${c.seenThrough} px seen through (alpha down to ${c.minAlpha}, rows ${c.band?.from} to ${c.band?.to})`);
            if ((c.outside?.px ?? 0) > outsideLimit)
                failures.push(`frame ${c.frame}: ${c.outside.px} px of matte more than ${D.outside} px outside the outline as clicked (a smear, within ${JSON.stringify(c.outside.box)})`);
            if ((c.colourDifference ?? 0) > D.colourLimit)
                failures.push(`frame ${c.frame}: colour inside the subject differs from the matte as clicked by ${c.colourDifference} (CIELAB)`);
        }
    }
    const check = {
        passed: failures.length === 0,
        frames: checks,
        furthest,
        failures,
        definition: `seen through: a pixel solid in the matte as clicked and more than ${D.deep} px inside its edge that is under 0.99 after; outside: matte at alpha 0.2 or more lying more than ${D.outside} px outside the outline as clicked (allowed: ${outsideLimit} px); colour: CIELAB difference inside the subject against the matte as clicked (allowed: ${D.colourLimit})`,
    };
    // Pictures: the whole comp after, on the check frames (kept); every other capture goes.
    const pictures = checkFrames
        .map((f) => wholeAfter.get(f)?.file)
        .filter((f) => typeof f === "string");
    if (args.keepCaptures !== true)
        await Promise.all(captures.filter((c) => !pictures.includes(c)).map((c) => fs.rm(c, { force: true })));
    const region = {
        bottom,
        feather: settings.feather,
        chosen: given === undefined ? "automatic" : "given",
        tops: samples.map((f, i) => ({ frame: f, top: tops[i] })),
        rule: given === undefined
            ? `${Math.round(D.regionDepth * 100)}% of the comp's height under the lowest top of the subject on the sampled frames`
            : "regionBottom as given",
    };
    const last = samples[samples.length - 1];
    const sampled = {
        how: sampling,
        frames: samples,
        leavesOut: `Only frames ${click} to ${last} were read: a later frame where the subject has moved further from the click, or sits lower (its hair then reaches below the region's line and keeps the hard edge there), is not checked here. subject.check_file reads every frame of the rendered file: it stops on see-through inside the cut-out, and notes the frames where the subject's top sits low enough for the hair to cross the region's line (render_cutout writes the line beside the file).`,
    };
    const timing = { totalMs: Math.round(since(started)) };
    if (!check.passed) {
        const undo = await io.execute(softenUndoJsx({ comp: args.comp, layer: args.layer }), {
            label: "subject.soften_edge undo",
            timeoutMs: 60_000,
        });
        return {
            ok: false,
            error: `the soft edge failed its closing check and was undone (${undo?.ok ? "the comp is back to the single matted layer" : `the undo failed: ${undo?.error}; run subject.soften_edge { undo: true }`}): ${failures.join("; ")}`,
            check,
            region,
            sampling: sampled,
            settings,
            undone: undo,
            pictures,
            fallback: `Fall back to Decontaminate Edge Colors alone on the matted layer, which changes no alpha: subject.settings { comp, layer, decontaminateEdgeColors: true }.`,
            timing,
        };
    }
    return {
        ok: true,
        softLayer,
        precomp: built.precomp,
        inside: built.inside,
        region,
        sampling: sampled,
        settings,
        check,
        look: { before: lookBefore, after: lookOf(after) },
        pictures,
        cost: SOFT_EDGE_COST,
        undo: "subject.soften_edge { comp, layer, undo: true } takes the comp back to the single matted layer (it removes the precomp and switches the matted layer back on).",
        next: "Look at the pictures (whole frames over the background) and show the user the region at twice size before and after. Then render the cut-out (subject.render_cutout keeps this layer and counts both copies' cache) and check the file (subject.check_file): a seen-through finding there means undo the soft edge and render again with the fallback, Decontaminate Edge Colors alone.",
        timing,
    };
}
/** Distance from each pixel to the nearest one under 0.99 (inside depth of the solid matte). */
function distanceToSolid(alpha, w, h, scratch, out) {
    distanceTo(alpha, w, h, (a) => a < 0.99, scratch, out);
}
registerOp({
    name: "subject.soften_edge",
    category: "subject",
    description: "Soften a subject matte's edge inside a region (usually the hair) and prove it: builds keying.md fact 38's construction from the matted layer (Object Matte, ADBE Samurai): two copies of it in a precomp '<layer> soft edge', the upper with Refine Edge (Base Refine Edge Radius, the refine group's Smooth and Chatter Reduction), the lower as clicked, both with Decontaminate Edge Colors, split by one feathered matte over the region (the upper copy's Alpha track matte, the lower's Alpha Inverted, the upper in Alpha Add). The matted layer is switched off and otherwise untouched; it keeps the sound. " +
        "Defaults: look C, the user's choice on the half-size take (radius 8, Smooth 0, Chatter Reduction 2, Decontaminate on, feather 60). The region is everything above a line: `regionBottom` (comp pixels), or by default 12% of the comp's height under the lowest top of the subject on the sampled frames. " +
        "Then it runs the closing check on the click frame and the frame furthest from it (the least overlap of the outline with the click frame's, from the sampled frames: by default the click frame and every 10th frame of the 60 after it): no pixel solid in the matte as clicked and more than 30 px inside its edge may drop under 0.99, the colour inside the subject must match the matte as clicked within 1 (CIELAB), and no more than `outsideLimit` px may spread over 10 px outside the outline. On any failure it undoes the build and says so; the fallback is Decontaminate Edge Colors alone (subject.settings). " +
        "Reports look before and after on the region's top and sides and on the outline below it (edge width and widest tenth on the alpha, soft band, the share of `background`'s colour in the edge when given, the change from frame to frame over five held frames), the region and how it was chosen, and the whole frames after as pictures. " +
        "After it, subject.check, subject.fill_gaps, subject.render_cutout and subject.use_cutout use the soft-edge layer. Two copies of the matte mean Object Matte is computed twice for every frame: a render writes about twice the disk cache and takes several times as long (on the half-size take, 342 s and 9.0 GB against 65 to 92 s and about 5 GB with one matte). The result's `sampling` says which frames were read and what that leaves out; subject.check_file reads every frame of the render: it reports see-through inside the cut-out, which means undo the soft edge and render again with the fallback, and notes the frames where the subject sits low enough for its hair to cross the region's line (subject.render_cutout writes the line beside the file). undo: true takes the comp back to the single matted layer. Ran in After Effects 27.0 on the half-size take with the default sampling (frames 0 to 50): 34 s, 1.6 GB of disk cache.",
    params: [
        ...compLayerParams,
        {
            name: "outDir",
            type: "string",
            description: "Absolute folder for the pictures (needed unless undo).",
            required: false,
        },
        {
            name: "radius",
            type: "number",
            description: `Base Refine Edge Radius of the upper copy (default ${SOFT_EDGE_DEFAULTS.radius}).`,
            required: false,
        },
        {
            name: "smooth",
            type: "number",
            description: `The refine group's Smooth (default ${SOFT_EDGE_DEFAULTS.smooth}).`,
            required: false,
        },
        {
            name: "chatterReduction",
            type: "number",
            description: `The refine group's Chatter Reduction menu, 1 to 4 (default ${SOFT_EDGE_DEFAULTS.chatterReduction}; 1 turns its Reduce Chatter off).`,
            required: false,
        },
        {
            name: "decontaminate",
            type: "boolean",
            description: "Decontaminate Edge Colors on both copies (default true).",
            required: false,
        },
        {
            name: "regionBottom",
            type: "number",
            description: "The region's lower line, comp pixels from the top; the region is everything above it. Default: worked out from the matte.",
            required: false,
        },
        {
            name: "feather",
            type: "number",
            description: `Feather of the region's line, px (default ${SOFT_EDGE_DEFAULTS.feather}).`,
            required: false,
        },
        {
            name: "background",
            type: "array",
            description: "The background the subject was cut from ([r, g, b] 0..1, the wall's mean): look then reports the share of it in the edge.",
            required: false,
        },
        {
            name: "sampleFrames",
            type: "array",
            description: `Frames to sample in place of the default, the click frame and every ${SOFT_EDGE_DEFAULTS.nearStep}th frame of the ${SOFT_EDGE_DEFAULTS.near} after it (frames 0 to 50 on the half-size take: 4 s, nothing added to the disk cache). The click frame is always added. Sampling far into the clip makes After Effects track the matte out to each frame; the whole clip is covered after the render by subject.check_file instead.`,
            required: false,
        },
        {
            name: "outsideLimit",
            type: "number",
            description: `Spread pixels allowed more than 10 px outside the outline before the build is undone (default ${SOFT_EDGE_DEFAULTS.outsideLimit}).`,
            required: false,
        },
        {
            name: "secondsPerFrame",
            type: "number",
            description: "Settle time allowed per frame rendered (default 60).",
            required: false,
        },
        {
            name: "keepCaptures",
            type: "boolean",
            description: "Keep the raw captures (default false: only the whole frames after stay).",
            required: false,
        },
        {
            name: "undo",
            type: "boolean",
            description: "Take the comp back to the single matted layer: remove the soft-edge precomp and switch the matted layer back on.",
            required: false,
        },
    ],
    toJsx() {
        return "throw new Error('subject.soften_edge runs in Node');";
    },
    async run(args, transport) {
        const cut = liveCutoutIO(args, transport);
        return runSoftenEdge(args, {
            status: cut.status,
            render: cut.render,
            readImage: cut.readImage,
            async execute(code, opts) {
                const r = await transport.execute({
                    code,
                    label: opts.label,
                    timeoutMs: opts.timeoutMs ?? 60_000,
                    undoGroup: true,
                    suppressDialogs: true,
                });
                return r.ok ? r.result : { ok: false, error: r.error ?? `${opts.label} failed` };
            },
        });
    },
});
//# sourceMappingURL=keying-subject-soften.js.map
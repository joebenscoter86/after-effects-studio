// One measured curve into moves (stage 13): used for the tracker's match, for the ink measure, and for a built
// property, so all three are measured alike. Each move carries its three fits, the keys to apply, and two durations
// named for what they are: the fit's keys (what is set in After Effects) and the visible span (from the last frame at
// rest to the first frame settled, as a hand study counts it). A move whose start or end was not seen is partial: what
// was not seen is not measured.
import { analyzeCurve } from "../color/motion.js";
import { fitEaseBetween, fitEaseSeen, fitMove, fitSpringTail, keysFor } from "./fit.js";
const r2 = (x) => Math.round(x * 100) / 100;
const r4 = (x) => Math.round(x * 10000) / 10000;
const median = (a) => { if (!a.length)
    return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
export function movesOfChannel(samples, o) {
    if (samples.length < 4)
        return [];
    const { fps, atFps } = o, moving = o.movingSpeed ?? 0.02, gap = 2.5 / fps, at = (t) => r2(t * atFps);
    const report = analyzeCurve(samples, fps, { joinGap: 6 }); // a spring slows to a stop at each turn: one move
    const moves = report.moves, out = [];
    for (const mv of moves) {
        if (mv.distance < o.minMove)
            continue;
        const i0 = samples.findIndex((s) => s.frame === mv.from), i1 = samples.findIndex((s) => s.frame === mv.to);
        if (i0 < 0 || i1 <= i0)
            continue;
        const prevMove = [...moves].reverse().find((x) => x.to < mv.from), nextMove = moves.find((x) => x.from > mv.to);
        const restStart = prevMove ? Math.max(0, samples.findIndex((s) => s.frame === prevMove.to)) : 0;
        const restEnd = nextMove ? samples.findIndex((s) => s.frame === nextMove.from) : samples.length - 1;
        // the move's end value: the median of the rest that follows it (up to 10 samples, or the next move), else its last
        const tailVals = samples.slice(i1, Math.max(i1 + 1, Math.min(restEnd + 1, i1 + 10))).map((s) => s.value);
        const end = tailVals[0].map((_, d) => median(tailVals.map((x) => x[d])));
        const startV = samples[i0].value, way = end.map((e, d) => e - startV[d]), len2 = way.reduce((s, x) => s + x * x, 0);
        if (len2 <= 0)
            continue;
        const dist = Math.sqrt(len2), prog = (s) => s.value.reduce((acc, v, d) => acc + (v - startV[d]) * way[d], 0) / len2;
        const lo = Math.max(0, i0 - 3), hi = Math.min(samples.length - 1, i1 + 6);
        const fitS = samples.slice(lo, hi + 1).map((s) => ({ time: s.time, y: prog(s) }));
        const fits = fitMove(fitS, { start: samples[i0].time, end: samples[i1].time }), tail = fitSpringTail(fitS), seen = fitEaseSeen(fitS);
        const best = fits[fits.best];
        // the visible span, on a wider window: the last sample within eps of the start, the first that stays within eps of the end
        const wlo = Math.max(restStart, i0 - 12), whi = Math.min(restEnd, i1 + 15), P = samples.map((s, k) => (k >= wlo && k <= whi ? prog(s) : NaN));
        const mad = (a, c) => median(a.map((v) => Math.abs(v - c))) * 1.4826;
        const after = P.slice(i1, whi + 1).filter(Number.isFinite), before = P.slice(wlo, i0 + 1).filter(Number.isFinite);
        const noise = Math.max(after.length >= 3 ? mad(after, 1) : 0, before.length >= 3 ? mad(before, 0) : 0);
        const eps = Math.max(3 * noise, o.epsAbs / dist, 0.0015);
        let mid = i1;
        for (let k = i0; k <= i1; k++)
            if (P[k] >= 0.5) {
                mid = k;
                break;
            }
        let a = null, b = null;
        for (let k = mid; k >= wlo; k--)
            if (Math.abs(P[k]) <= eps) {
                a = k;
                break;
            }
        // the end: the first sample that stays within endShare of the end value (a hand study's "visibly stopped"; the last
        // frame of any change at all is the witness's)
        const band = Math.max(eps, o.endShare ?? 0.02);
        for (let k = mid; k <= whi && b === null; k++) {
            let ok = true;
            for (let j = k; j <= whi; j++)
                if (Math.abs(P[j] - 1) > band) {
                    ok = false;
                    break;
                }
            if (ok)
                b = k;
        }
        const step = (k) => k + 1 < samples.length && Number.isFinite(P[k + 1]) ? (P[k + 1] - P[k]) / Math.max(1e-6, (samples[k + 1].time - samples[k].time) * fps) : 0;
        const contigBefore = (k) => k > 0 && samples[k].time - samples[k - 1].time <= gap;
        const contigAfter = (k) => k + 1 < samples.length && samples[k + 1].time - samples[k].time <= gap;
        const begins = !contigBefore(a ?? i0) ? o.beginsAt?.(samples[a ?? i0].frame) ?? null : null;
        const startSeen = a !== null && (begins !== null || contigBefore(a) || Math.abs(step(a)) <= moving);
        // a move still under way on a shot's last frame ends with the shot: its end is the cut
        const endsAtCut = !contigAfter(i1) && i1 === whi && !!o.endsAt?.(samples[i1].frame);
        if (endsAtCut && (b === null || b >= whi))
            b = i1;
        const endSeen = endsAtCut || (b !== null && b < whi && contigAfter(b));
        const visible = a !== null && b !== null ? samples[b].time - samples[a].time : null;
        // the frames the measure covers round the move: the unbroken run of samples that holds it
        let c0 = i0, c1 = i1;
        while (contigBefore(c0))
            c0--;
        while (contigAfter(c1))
            c1++;
        const keysSec = best.model === "spring" ? best.reachesEndAt - best.start : best.end - best.start;
        const m = {
            curve: mv,
            from: { frame: mv.from, time: samples[i0].time, at: at(samples[i0].time) }, to: { frame: mv.to, time: samples[i1].time, at: at(samples[i1].time) },
            duration: {
                seconds: visible !== null && startSeen && endSeen ? r4(visible) : null, at: visible !== null && startSeen && endSeen ? at(visible) : null,
                as: "visible: from the last frame at rest to the first frame that stays within 2 % of the end (as the hand studies count it)",
                keys: { seconds: r4(keysSec), at: at(keysSec), as: "the fit's keys (what is set in After Effects)" },
                visible: visible === null ? null : { seconds: r4(visible), at: at(visible), fromFrame: samples[a].frame, toFrame: samples[b].frame, fromTime: samples[a].time, toTime: samples[b].time },
            },
            start: startV.map(r2), end: end.map(r2), distance: r2(dist),
            fits: { ease: fits.ease, linear: fits.linear, spring: fits.spring, springTail: tail, easeSeen: seen,
                // keys held at the visible span's ends (the last frame at rest, the first settled), the influences fitted
                easeVisible: visible !== null && visible > 0 ? fitEaseBetween(fitS, samples[a].time, samples[b].time) : null }, best: fits.best, margin: fits.margin,
            apply: keysFor(best, startV, end, atFps),
            seen: { start: startSeen, end: endSeen, begins, ...(endsAtCut ? { ends: "cut" } : {}) }, covers: { fromFrame: samples[c0].frame, toFrame: samples[c1].frame },
            status: "measured",
        };
        if (!startSeen) {
            const first = samples[a ?? i0];
            m.status = `partial: the start was not seen (already moving at frame ${first.frame}, the first frame measured); duration, distance and ease out are not measured, only the settle`;
            m.notMeasured = ["duration", "distance", "ease out"];
            m.seenTravel = m.distance;
            m.distance = null;
            m.apply = null;
            m.settle = { end: m.end, inInfluence: (seen ?? fits.ease).inInfluence };
        }
        else if (!endSeen) {
            m.status = "partial: the end was not seen (still moving where the measure stops); duration, distance and ease in are not measured";
            m.notMeasured = ["duration", "distance", "ease in"];
            m.seenTravel = m.distance;
            m.distance = null;
            m.apply = null;
        }
        else if (best.rms > 0.05)
            m.status = "measured, loosely (rms over 0.05)";
        out.push(m);
    }
    return out;
}
//# sourceMappingURL=measure-move.js.map
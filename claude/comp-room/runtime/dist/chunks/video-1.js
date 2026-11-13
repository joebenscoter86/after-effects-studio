import { __esmMin } from "./rolldown-runtime.js";
import { FFMPEG, FFPROBE, init_delivery_sound, runTool } from "./operations-1.js";
import { analyzeCurve, encodePngSrgb8, init_motion, init_png16 } from "./color-1.js";
import { spawn } from "node:child_process";
import { promises } from "node:fs";
import path from "node:path";

// video/fit.js
function nelderMead(f, x0, steps, iterations = 600) {
	const n = x0.length;
	let simplex = [x0.slice(), ...x0.map((_, i) => x0.map((v, j) => j === i ? v + steps[i] : v))].map((x) => ({
		x,
		v: f(x)
	}));
	for (let it = 0; it < iterations; it++) {
		simplex.sort((a, b) => a.v - b.v);
		const best = simplex[0], worst = simplex[n], second = simplex[n - 1];
		if (Math.abs(worst.v - best.v) < 1e-12) break;
		const c = Array(n).fill(0);
		for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c[j] += simplex[i].x[j] / n;
		const at = (t) => c.map((cj, j) => cj + t * (worst.x[j] - cj));
		const r = at(-1), fr = f(r);
		if (fr < best.v) {
			const e = at(-2), fe = f(e);
			simplex[n] = fe < fr ? {
				x: e,
				v: fe
			} : {
				x: r,
				v: fr
			};
			continue;
		}
		if (fr < second.v) {
			simplex[n] = {
				x: r,
				v: fr
			};
			continue;
		}
		const k = fr < worst.v ? at(-.5) : at(.5), fk = f(k);
		if (fk < Math.min(fr, worst.v)) {
			simplex[n] = {
				x: k,
				v: fk
			};
			continue;
		}
		simplex = simplex.map((s, i) => i === 0 ? s : {
			x: s.x.map((v, j) => best.x[j] + .5 * (v - best.x[j])),
			v: f(s.x.map((v, j) => best.x[j] + .5 * (v - best.x[j])))
		});
	}
	simplex.sort((a, b) => a.v - b.v);
	return {
		x: simplex[0].x,
		value: simplex[0].v
	};
}
function aeEase(t, outInfluence, inInfluence) {
	if (t <= 0) return 0;
	if (t >= 1) return 1;
	const x1 = outInfluence, x2 = 1 - inInfluence;
	const bx = (u2) => 3 * (1 - u2) * (1 - u2) * u2 * x1 + 3 * (1 - u2) * u2 * u2 * x2 + u2 * u2 * u2;
	let lo = 0, hi = 1;
	for (let i = 0; i < 40; i++) {
		const m = (lo + hi) / 2;
		if (bx(m) < t) lo = m;
		else hi = m;
	}
	const u = (lo + hi) / 2;
	return 3 * (1 - u) * u * u + u * u * u;
}
function springFromRest(t, f, d) {
	if (t <= 0) return 0;
	const w = 2 * Math.PI * f;
	return 1 - Math.exp(-d * t) * (Math.cos(w * t) + d / w * Math.sin(w * t));
}
function rmsOf(s, model) {
	let e = 0;
	for (const p of s) {
		const d = model(p.time) - p.y;
		e += d * d;
	}
	return Math.sqrt(e / Math.max(1, s.length));
}
function fitMove(s, guess) {
	const dur0 = Math.max(.001, guess.end - guess.start), tSpan = s.length ? s[s.length - 1].time - s[0].time : dur0;
	const fe = (x) => {
		const a = x[0], b = Math.max(a + .001, x[1]), o = clamp(x[2], .01, 1), i = clamp(x[3], .01, 1);
		return rmsOf(s, (t) => aeEase((t - a) / (b - a), o, i));
	};
	let bestE = {
		x: [
			guess.start,
			guess.end,
			.33,
			.33
		],
		value: Infinity
	};
	for (const o0 of [
		.15,
		.33,
		.6,
		.85
	]) for (const i0 of [
		.15,
		.33,
		.6,
		.85
	]) {
		const r = nelderMead(fe, [
			guess.start,
			guess.end,
			o0,
			i0
		], [
			dur0 * .1,
			dur0 * .1,
			.1,
			.1
		]);
		if (r.value < bestE.value) bestE = r;
	}
	const ease = {
		model: "ease",
		start: bestE.x[0],
		end: Math.max(bestE.x[0] + .001, bestE.x[1]),
		outInfluence: Math.round(clamp(bestE.x[2], .01, 1) * 1e3) / 10,
		inInfluence: Math.round(clamp(bestE.x[3], .01, 1) * 1e3) / 10,
		rms: bestE.value
	};
	const fl = (x) => {
		const a = x[0], b = Math.max(a + .001, x[1]);
		return rmsOf(s, (t) => clamp((t - a) / (b - a), 0, 1));
	};
	const rl = nelderMead(fl, [guess.start, guess.end], [dur0 * .1, dur0 * .1]);
	const linear = {
		model: "linear",
		start: rl.x[0],
		end: Math.max(rl.x[0] + .001, rl.x[1]),
		rms: rl.value
	};
	const fs = (x) => {
		const f2 = clamp(x[1], .2, 20), d2 = clamp(x[2], .1, 60);
		return rmsOf(s, (t) => springFromRest(t - x[0], f2, d2));
	};
	let bestS = {
		x: [
			guess.start,
			2,
			6
		],
		value: Infinity
	};
	for (const f0 of [
		.8,
		1.5,
		3,
		6
	]) for (const d0 of [
		2,
		5,
		10,
		20
	]) {
		const r = nelderMead(fs, [
			guess.start,
			f0,
			d0
		], [
			dur0 * .1,
			f0 * .3,
			d0 * .3
		]);
		if (r.value < bestS.value) bestS = r;
	}
	const f = clamp(bestS.x[1], .2, 20), d = clamp(bestS.x[2], .1, 60), w = 2 * Math.PI * f;
	const tc = (Math.PI / 2 + Math.atan(d / w)) / w;
	const peakT = Math.PI / w, overshoot = Math.max(0, springFromRest(peakT, f, d) - 1);
	let settle = tSpan;
	for (let t = 0; t < 30; t += .001) if (Math.exp(-d * t) * Math.sqrt(1 + (d / w) ** 2) < .02) {
		settle = t;
		break;
	}
	const spring = {
		model: "spring",
		start: bestS.x[0],
		f: Math.round(f * 1e3) / 1e3,
		d: Math.round(d * 1e3) / 1e3,
		A: Math.round(Math.sqrt(1 + (d / w) ** 2) * Math.exp(-d * tc) * 1e3) / 1e3,
		reachesEndAt: bestS.x[0] + tc,
		overshoot: Math.round(overshoot * 1e3) / 1e3,
		settle,
		rms: bestS.value
	};
	const ranked = [
		ease,
		linear,
		spring
	].sort((a, b) => a.rms - b.rms);
	return {
		ease,
		linear,
		spring,
		best: ranked[0].model,
		margin: ranked[0].rms > 0 ? Math.round(ranked[1].rms / ranked[0].rms * 100) / 100 : Infinity
	};
}
function fitEaseSeen(s, lo = .015) {
	const cross = (th, from = 1) => {
		for (let k = Math.max(1, from); k < s.length; k++) if (s[k].y >= th && s[k - 1].y < th) return {
			k,
			t: s[k - 1].time + (th - s[k - 1].y) / (s[k].y - s[k - 1].y) * (s[k].time - s[k - 1].time)
		};
		return null;
	};
	const c0 = cross(lo), c1 = c0 ? cross(1 - lo, c0.k) : null;
	if (!c0 || !c1 || c1.t <= c0.t) return null;
	const a = c0.t, b = c1.t;
	const f = (x) => {
		const o = clamp(x[0], .01, 1), i = clamp(x[1], .01, 1);
		return rmsOf(s, (t) => aeEase((t - a) / (b - a), o, i));
	};
	let best = {
		x: [.33, .33],
		value: Infinity
	};
	for (const o0 of [
		.1,
		.33,
		.6,
		.9
	]) for (const i0 of [
		.1,
		.33,
		.6,
		.9
	]) {
		const r = nelderMead(f, [o0, i0], [.1, .1], 300);
		if (r.value < best.value) best = r;
	}
	return {
		model: "ease",
		seen: true,
		start: a,
		end: b,
		outInfluence: Math.round(clamp(best.x[0], .01, 1) * 1e3) / 10,
		inInfluence: Math.round(clamp(best.x[1], .01, 1) * 1e3) / 10,
		rms: best.value
	};
}
function fitSpringTail(s) {
	const i0 = s.findIndex((p) => p.y >= 1);
	if (i0 < 0 || !s.slice(i0).some((p) => p.y > 1.01)) return null;
	const t0 = i0 > 0 ? s[i0 - 1].time + (1 - s[i0 - 1].y) / (s[i0].y - s[i0 - 1].y) * (s[i0].time - s[i0 - 1].time) : s[i0].time;
	const tail = s.slice(i0).map((p) => ({
		time: p.time - t0,
		y: p.y
	}));
	const fe = (x) => {
		const A = x[0], f = clamp(x[1], .1, 20), d = clamp(x[2], 0, 60);
		return rmsOf(tail, (t) => 1 + A * Math.exp(-d * t) * Math.sin(2 * Math.PI * f * t));
	};
	const cross = [];
	for (let i = 1; i < tail.length; i++) if ((tail[i - 1].y - 1) * (tail[i].y - 1) < 0) {
		const a = tail[i - 1], b = tail[i];
		cross.push(a.time + (1 - a.y) / (b.y - a.y) * (b.time - a.time));
	}
	const fGuess = cross.length >= 1 ? 1 / (2 * (cross.length >= 2 ? (cross[cross.length - 1] - cross[0]) / (cross.length - 1) : cross[0])) : 1.5;
	const peak = Math.max(...tail.map((p) => p.y)) - 1;
	let best = {
		x: [
			peak,
			fGuess,
			5
		],
		value: Infinity
	};
	for (const f0 of [
		fGuess,
		.8,
		1.5,
		3,
		6
	]) for (const d0 of [
		1,
		2,
		5,
		10
	]) for (const a0 of [peak, peak * 2]) {
		const r = nelderMead(fe, [
			a0,
			f0,
			d0
		], [
			a0 * .3,
			f0 * .3,
			d0 * .3
		]);
		if (r.value < best.value) best = r;
	}
	return {
		A: Math.round(best.x[0] * 1e3) / 1e3,
		f: Math.round(clamp(best.x[1], .1, 20) * 1e3) / 1e3,
		d: Math.round(clamp(best.x[2], 0, 60) * 1e3) / 1e3,
		from: t0,
		rms: best.value
	};
}
function keysFor(fit, a, b, fps) {
	const v = (k) => a.map((x, i) => Math.round((x + (b[i] - x) * k) * 1e3) / 1e3);
	const one = (x) => x.length === 1 ? x[0] : x;
	if (fit.model === "ease") return { keys: [{
		time: r4(fit.start),
		value: one(v(0)),
		interp: "ease",
		outInfluence: fit.outInfluence,
		outSpeed: 0
	}, {
		time: r4(fit.end),
		value: one(v(1)),
		interp: "ease",
		inInfluence: fit.inInfluence,
		inSpeed: 0
	}] };
	if (fit.model === "linear") return { keys: [{
		time: r4(fit.start),
		value: one(v(0)),
		interp: "linear"
	}, {
		time: r4(fit.end),
		value: one(v(1)),
		interp: "linear"
	}] };
	const rise = Math.max(.001, fit.reachesEndAt - fit.start), baked = [];
	for (let t = fit.start; t <= fit.start + fit.settle + 1 / fps; t += 1 / fps) baked.push({
		time: r4(t),
		value: one(v(springFromRest(t - fit.start, fit.f, fit.d))),
		interp: "linear"
	});
	return {
		keys: [{
			time: r4(fit.start),
			value: one(v(0)),
			interp: "linear"
		}, {
			time: r4(fit.reachesEndAt),
			value: one(v(1)),
			interp: "linear"
		}],
		librarySpring: {
			freq: fit.f,
			decay: fit.d,
			amp: Math.round(fit.A * rise * 1e4) / 1e4,
			form: "value + v * amp * sin(freq * t * 2 * PI) / exp(decay * t) after the last key (motion-jsx spring)"
		},
		baked
	};
}
var clamp, r4;
function init_fit() {
	return (init_fit = __esmMin((() => {
		clamp = (x, a, b) => Math.max(a, Math.min(b, x));
		r4 = (x) => Math.round(x * 1e4) / 1e4;
	})))();
}

// video/run-moves.js
async function readJson(p, what) {
	if (typeof p !== "string" || !path.isAbsolute(p)) return { error: `${what} must be an absolute path to a JSON file` };
	try {
		return JSON.parse(await promises.readFile(p, "utf8"));
	} catch (e) {
		return { error: `could not read ${what} ${p}: ${e.message}` };
	}
}
function row(label, m, atFps) {
	const best = m.fits[m.best], at = (s) => r2(s * atFps);
	const tail = m.fits.springTail;
	return {
		move: label,
		channel: m.channel,
		unit: m.unit,
		start: {
			seconds: r2(m.from.time * 1e3) / 1e3,
			at: at(m.from.time)
		},
		duration: {
			seconds: m.duration.seconds,
			at: at(m.duration.seconds)
		},
		distance: m.distance,
		from: m.start,
		to: m.end,
		ease: m.best === "ease" ? `${best.outInfluence} / ${best.inInfluence}` : m.best,
		spring: tail ? {
			A: tail.A,
			f: tail.f,
			d: tail.d
		} : null,
		best: m.best,
		margin: m.margin,
		rms: r2(best.rms * 1e3) / 1e3,
		status: m.status ?? "measured",
		apply: m.apply
	};
}
async function runMoves(args) {
	if (typeof args.outDir !== "string" || !path.isAbsolute(args.outDir)) return {
		ok: false,
		error: "`outDir` must be an absolute folder path"
	};
	const atFps = typeof args.atFps === "number" && args.atFps > 0 ? args.atFps : 30;
	const tracks = Array.isArray(args.tracks) ? args.tracks : [];
	if (!tracks.length && !Array.isArray(args.inferred)) return {
		ok: false,
		error: "`tracks` must list track.json files from video.track ([{ path, label }] or paths)"
	};
	const rows = [], notes = [];
	for (let i = 0; i < tracks.length; i++) {
		const t = typeof tracks[i] === "string" ? { path: tracks[i] } : tracks[i], j = await readJson(t.path, "a track");
		if ("error" in j) return {
			ok: false,
			error: j.error
		};
		if (j.lost) notes.push(`${t.label ?? path.basename(path.dirname(t.path))}: ${j.lost.reading}`);
		j.moves.forEach((m, k) => rows.push(row(`${t.label ?? `track ${i + 1}`}${j.moves.length > 1 ? ` ${k + 1}` : ""}`, m, atFps)));
	}
	for (const m of args.inferred ?? []) rows.push({
		move: m.label ?? "inferred",
		channel: m.channel ?? null,
		status: "inferred",
		reason: m.reason ?? "no reason given",
		...m
	});
	for (const m of args.untested ?? []) rows.push({
		move: m.label ?? "untested",
		status: "untested",
		reason: m.reason ?? "not tracked"
	});
	const shots = args.shots ? await readJson(args.shots, "shots") : null, census = args.census ? await readJson(args.census, "census") : null;
	if (shots && "error" in shots) return {
		ok: false,
		error: shots.error
	};
	if (census && "error" in census) return {
		ok: false,
		error: census.error
	};
	const scenes = shots ? shots.shots : [{
		start: 0,
		end: Infinity
	}];
	const lines = [
		"# Beat sheet (measured)",
		"",
		`Frames at ${atFps} fps. Rows marked inferred or untested were not measured from the picture; see the table.`,
		""
	];
	scenes.forEach((s, i) => {
		const inShot = rows.filter((r) => r.start && r.start.seconds >= s.start - 1e-6 && r.start.seconds <= s.end + 1e-6);
		const travel = census ? census.steps?.filter((st) => st.time >= s.start && st.time <= s.end && st.label === "T").length ?? 0 : null;
		lines.push(`## Scene ${i + 1} \u2014 ${r2(s.start * atFps)} to ${Number.isFinite(s.end) ? r2(s.end * atFps) : "end"}`, "");
		lines.push("- One visual argument; operation (before → action → resolution): (not measured: read the picture)");
		lines.push(`- Events: ${inShot.length ? inShot.map((r) => `${r.start.at}: ${r.move} (${r.channel}) ${r.distance}${r.unit ?? ""} over ${r.duration.at} frames, ${r.best === "ease" ? `ease ${r.ease}` : r.best}${r.spring ? `, spring A ${r.spring.A} f ${r.spring.f} d ${r.spring.d}` : ""}`).join("; ") : "none measured"}`);
		lines.push(`- Camera: ${travel === null ? "(no census given)" : travel ? `whole-stage travel in ${travel} census steps` : "no whole-stage travel in the census"}`);
		lines.push(`- Continuity: ${i + 1 < scenes.length ? "a cut to the next shot" : "the last shot"}`);
		lines.push("- Type roles, exact strings, material, depth, data sources: (not measured)", "");
	});
	if (notes.length) lines.push("## Not measured", "", ...notes.map((n) => `- ${n}`), "");
	await promises.mkdir(args.outDir, { recursive: true });
	const jsonPath = path.join(args.outDir, "moves.json"), sheetPath = path.join(args.outDir, "beat-sheet.md");
	await promises.writeFile(jsonPath, JSON.stringify({
		atFps,
		moves: rows,
		notes
	}, null, 1));
	await promises.writeFile(sheetPath, lines.join("\n"));
	const counts = {
		measured: rows.filter((r) => String(r.status).startsWith("measured")).length,
		inferred: rows.filter((r) => r.status === "inferred").length,
		untested: rows.filter((r) => r.status === "untested").length
	};
	return {
		ok: true,
		atFps,
		counts,
		moves: rows.map(({ apply, ...r }) => r),
		files: {
			json: jsonPath,
			beatSheet: sheetPath
		},
		reading: `${rows.length} moves: ${counts.measured} measured, ${counts.inferred} inferred, ${counts.untested} untested. Each measured move carries its keys in keyframe.apply's form (moves.json, apply).`
	};
}
function movesOfSamples(samples, fps, channel) {
	const report = analyzeCurve(samples, fps, { joinGap: 6 }), out = [];
	for (const mv of report.moves) {
		const i0 = samples.findIndex((s) => s.frame === mv.from), i1 = samples.findIndex((s) => s.frame === mv.to);
		if (i0 < 0 || i1 <= i0) continue;
		const startV = samples[i0].value, way = samples[Math.min(samples.length - 1, i1)].value.map((e, d) => e - startV[d]), len2 = way.reduce((s, x) => s + x * x, 0);
		if (len2 <= 0) continue;
		const prog = samples.slice(Math.max(0, i0 - 3), Math.min(samples.length, i1 + 7)).map((s) => ({
			time: s.time,
			y: s.value.reduce((a, v, d) => a + (v - startV[d]) * way[d], 0) / len2
		}));
		const fits = fitMove(prog, {
			start: samples[i0].time,
			end: samples[i1].time
		}), best = fits[fits.best], seen = fitEaseSeen(prog);
		out.push({
			channel,
			from: {
				frame: mv.from,
				time: samples[i0].time
			},
			distance: Math.sqrt(len2),
			best: fits.best,
			fits: {
				...fits,
				easeSeen: seen
			},
			curve: mv,
			duration: { seconds: seen ? seen.end - seen.start : fits.best === "spring" ? best.settle : best.end - best.start }
		});
	}
	return out;
}
function compare(label, measured, built, tol, atFps) {
	const d = (a) => r2(a * atFps), checks = [];
	const add = (what, mv, bv, unit, within) => checks.push({
		what,
		measured: r2(mv),
		built: r2(bv),
		unit,
		within,
		reading: `${label}: ${what} ${r2(bv)}${unit} against ${r2(mv)}${unit}, ${within ? "within" : "outside"} tolerance`
	});
	add("duration", d(measured.duration.seconds), d(built.duration.seconds), " frames", Math.abs(measured.duration.seconds - built.duration.seconds) * atFps <= tol.frames + 1e-9);
	add("distance", measured.distance, built.distance, "", Math.abs(built.distance - measured.distance) <= tol.distanceShare * Math.abs(measured.distance) + 1e-9);
	const me = measured.fits.easeSeen && built.fits.easeSeen ? measured.fits.easeSeen : measured.fits.ease, be = measured.fits.easeSeen && built.fits.easeSeen ? built.fits.easeSeen : built.fits.ease;
	if (measured.best === "ease" || built.best === "ease") {
		add("ease out", me.outInfluence, be.outInfluence, " %", Math.abs(me.outInfluence - be.outInfluence) <= tol.easePoints);
		add("ease in", me.inInfluence, be.inInfluence, " %", Math.abs(me.inInfluence - be.inInfluence) <= tol.easePoints);
	}
	if (measured.best === "spring" || built.best === "spring") add("overshoot", measured.fits.spring.overshoot * 100, built.fits.spring.overshoot * 100, " %", Math.abs(measured.fits.spring.overshoot - built.fits.spring.overshoot) * 100 <= tol.easePoints);
	if (measured.best !== built.best) checks.push({
		what: "kind",
		measured: measured.best,
		built: built.best,
		within: false,
		reading: `${label}: built as ${built.best} against a measured ${measured.best}`
	});
	return {
		move: label,
		within: checks.every((c) => c.within),
		checks
	};
}
async function runCompareMoves(args, readProperty) {
	const atFps = typeof args.atFps === "number" && args.atFps > 0 ? args.atFps : 30;
	const tol = {
		...TIGHT,
		...args.tolerance && typeof args.tolerance === "object" ? args.tolerance : {}
	};
	const mj = typeof args.measured === "string" ? await readJson(args.measured, "measured") : { moves: args.measured };
	if ("error" in mj) return {
		ok: false,
		error: mj.error
	};
	const measured = (mj.moves ?? []).filter((m) => m && m.fits);
	if (!measured.length) return {
		ok: false,
		error: "`measured` has no tracked moves (give a track.json from video.track, or its moves)"
	};
	let built = [], source = "";
	if (typeof args.buildTrack === "string") {
		const bj = await readJson(args.buildTrack, "buildTrack");
		if ("error" in bj) return {
			ok: false,
			error: bj.error
		};
		built = bj.moves ?? [];
		source = `the build's render (${path.basename(args.buildTrack)})`;
	} else if (args.comp !== void 0 && args.layer !== void 0 && args.property !== void 0) {
		if (!readProperty) return {
			ok: false,
			error: "reading a property needs After Effects"
		};
		const r = await readProperty({
			comp: args.comp,
			layer: args.layer,
			property: args.property,
			start: args.start,
			end: args.end,
			perFrame: true
		});
		if (!r?.ok) return {
			ok: false,
			error: r?.error ?? "could not read the property"
		};
		const name = String(Array.isArray(args.property) ? args.property[args.property.length - 1] : args.property).toLowerCase();
		const channel = name.includes("scale") ? "scale" : name.includes("opacity") ? "opacity" : "position";
		built = movesOfSamples(r.frames.map((f) => ({
			frame: f.frame,
			time: f.time,
			value: f.value
		})), r.fps, channel);
		source = `${r.layer} > ${r.property}`;
	} else return {
		ok: false,
		error: "give the build as `comp`, `layer` and `property`, or as `buildTrack` (a track.json of the build's render, which is the one that counts)"
	};
	const results = [];
	measured.forEach((m, i) => {
		const pick = built.filter((b) => b.channel === m.channel).sort((a, b) => Math.abs(a.from.time - m.from.time) - Math.abs(b.from.time - m.from.time))[0];
		const label = `move ${i + 1} (${m.channel})`;
		results.push(pick ? compare(label, m, pick, tol, atFps) : {
			move: label,
			within: false,
			checks: [{
				what: "missing",
				within: false,
				reading: `${label}: no ${m.channel} move in ${source}`
			}]
		});
	});
	const out = results.flatMap((r) => r.checks.filter((c) => !c.within).map((c) => c.reading));
	return {
		ok: true,
		atFps,
		tolerance: tol,
		build: source,
		results,
		within: results.every((r) => r.within),
		reading: out.length ? out.join("; ") : `Every measured move is within tolerance in ${source}.`,
		...typeof args.buildTrack !== "string" ? { note: "This compared the property. Compare the render too (video.track on the rendered file, then buildTrack): a property can pass while the picture does not, as when the subject leans; the picture is the one that counts." } : {}
	};
}
var r2, TIGHT;
function init_run_moves() {
	return (init_run_moves = __esmMin((() => {
		init_motion();
		init_fit();
		r2 = (x) => Math.round(x * 100) / 100;
		TIGHT = {
			frames: 1,
			distanceShare: .02,
			easePoints: 10
		};
	})))();
}

// video/census.js
function censusStep(a, b, w, h, y0, y1, rules = CENSUS_RULES) {
	let changedPx = 0, total = 0;
	for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) {
		total++;
		if (Math.abs(a[y * w + x] - b[y * w + x]) > rules.pixel) changedPx++;
	}
	const changed = total ? changedPx / total : 0, B = rules.block, S = rules.search;
	let textured = 0, moved = 0;
	const shifts = [];
	for (let by = y0 + S; by + B + S <= y1; by += B) for (let bx = S; bx + B + S <= w; bx += B) {
		let m = 0, m2 = 0;
		for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) {
			const v = a[(by + y) * w + bx + x];
			m += v;
			m2 += v * v;
		}
		const n = B * B;
		if (Math.sqrt(Math.max(0, m2 / n - (m / n) ** 2)) <= rules.texture) continue;
		textured++;
		const cost = (dx, dy) => {
			let s = 0;
			for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) s += Math.abs(a[(by + y) * w + bx + x] - b[(by + y + dy) * w + bx + x + dx]);
			return s;
		};
		const zero = cost(0, 0);
		let best = zero, bdx = 0, bdy = 0;
		for (let dy = -S; dy <= S; dy++) for (let dx = -S; dx <= S; dx++) {
			if (!dx && !dy) continue;
			const c = cost(dx, dy);
			if (c < best) {
				best = c;
				bdx = dx;
				bdy = dy;
			}
		}
		if ((bdx || bdy) && best < .7 * zero && zero > 3 * n) {
			moved++;
			shifts.push(Math.hypot(bdx, bdy));
		}
	}
	const mv = textured >= 3 ? moved / textured : 0;
	const label = changed > rules.cutChanged && mv < rules.cutMoved ? "X" : mv >= rules.travelMoved && changed > rules.calmBelow ? "T" : changed < rules.calmBelow ? "c" : "l";
	const sorted = shifts.sort((x, y) => x - y);
	return {
		changed,
		moved: mv,
		textured,
		shift: sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0,
		label
	};
}
function cadence(labels, shifts, step, pxScale) {
	const n = labels.length || 1, count = (c) => [...labels].filter((x) => x === c).length / n;
	const runs = [];
	for (let i = 0; i < labels.length; i++) {
		if (labels[i] !== "T") continue;
		let j = i;
		while (j + 1 < labels.length && labels[j + 1] === "T") j++;
		const last = runs[runs.length - 1];
		if (last && i - last[1] - 1 <= 2) last[1] = j;
		else runs.push([i, j]);
		i = j;
	}
	const travelRuns = runs.filter(([a, b]) => (b - a + 1) * step >= .2);
	const med = (a) => {
		if (!a.length) return 0;
		const s = [...a].sort((x, y) => x - y);
		return s[Math.floor(s.length / 2)];
	};
	const speeds = travelRuns.map(([a, b]) => med(shifts.slice(a, b + 1)) * pxScale / step);
	const calmRuns = [];
	let bursts = 0, calmLen = 0;
	for (const c of labels) if (c === "c") calmLen++;
	else {
		if (calmLen * step >= .3) bursts++;
		if (calmLen) calmRuns.push(calmLen * step);
		calmLen = 0;
	}
	if (calmLen) calmRuns.push(calmLen * step);
	const seconds = labels.length * step;
	return {
		shares: {
			calm: r3(count("c")),
			local: r3(count("l")),
			travel: r3(count("T")),
			cut: r3(count("X"))
		},
		travel: {
			perMinute: seconds ? r3(travelRuns.length / seconds * 60) : 0,
			medianSeconds: r3(med(travelRuns.map(([a, b]) => (b - a + 1) * step))),
			medianSpeed: Math.round(med(speeds))
		},
		burstsPer10s: seconds ? r3(bursts / seconds * 10) : 0,
		calmRuns: {
			medianSeconds: r3(med(calmRuns)),
			maxSeconds: r3(Math.max(0, ...calmRuns))
		}
	};
}
var CENSUS_RULES, r3;
function init_census() {
	return (init_census = __esmMin((() => {
		CENSUS_RULES = {
			block: 16,
			search: 6,
			pixel: 8,
			calmBelow: .004,
			travelMoved: .5,
			cutChanged: .55,
			cutMoved: .35,
			texture: 5
		};
		r3 = (x) => Math.round(x * 1e3) / 1e3;
	})))();
}

// video/decode.js
function rate(s) {
	if (!s) return NaN;
	const [a, b] = s.split("/").map(Number);
	return b ? a / b : a;
}
async function probeVideo(file, tools = VIDEO_TOOLS) {
	const head = await runTool(tools.ffprobe, [
		"-v",
		"error",
		"-select_streams",
		"v:0",
		"-show_entries",
		"stream=width,height,r_frame_rate,avg_frame_rate,duration:format=duration",
		"-of",
		"json",
		file
	], 6e4);
	if (head === null) return null;
	if (head.failed) return { error: `ffprobe could not read ${file}: ${head.stderr.trim().slice(0, 300)}` };
	let j;
	try {
		j = JSON.parse(head.stdout);
	} catch {
		return { error: `ffprobe gave no stream information for ${file}` };
	}
	const st = j.streams?.[0];
	if (!st) return { error: `${file} has no video stream` };
	const pk = await runTool(tools.ffprobe, [
		"-v",
		"error",
		"-select_streams",
		"v:0",
		"-show_entries",
		"packet=pts_time",
		"-of",
		"csv=p=0",
		file
	], 12e4);
	if (pk === null) return null;
	const raw = pk.stdout.split("\n").map((l) => l.split(",")[0].trim()).filter((l) => l !== "" && l !== "N/A").map(Number).filter((t) => Number.isFinite(t)).sort((a, b) => a - b);
	if (!raw.length) return { error: `${file} has no video frames` };
	const t0 = raw[0], times = raw.map((t) => t - t0);
	const iv = [];
	for (let i = 1; i < times.length; i++) iv.push(times[i] - times[i - 1]);
	const sorted = [...iv].sort((a, b) => a - b), med = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
	const nominal = rate(String(st.r_frame_rate)), duration = Number(j.format?.duration ?? st.duration ?? times[times.length - 1] + med);
	return {
		file,
		width: Number(st.width),
		height: Number(st.height),
		frames: times.length,
		duration,
		nominalFps: nominal,
		averageFps: duration > 0 ? times.length / duration : nominal,
		times,
		variableRate: sorted.length > 1 && sorted[sorted.length - 1] - sorted[0] > .1 * med,
		intervals: {
			min: sorted[0] ?? 0,
			max: sorted[sorted.length - 1] ?? 0,
			median: med
		}
	};
}
async function* readFrames(info, o, tools = VIDEO_TOOLS) {
	const from = Math.max(0, Math.min(info.frames - 1, o.from)), to = Math.max(from, Math.min(info.frames - 1, o.to));
	const half = (info.intervals.median || 1 / 30) / 2, seek = Math.max(0, info.times[from] - half);
	const filters = [];
	if (o.fps) filters.push(`fps=${o.fps}`);
	if (o.crop) filters.push(`crop=${Math.round(o.crop[2])}:${Math.round(o.crop[3])}:${Math.round(o.crop[0])}:${Math.round(o.crop[1])}`);
	filters.push(`scale=${o.width}:${o.height}:flags=area`);
	const count = o.fps ? Math.max(1, Math.round((info.times[to] - info.times[from]) * o.fps) + 1) : to - from + 1;
	const args = [
		"-v",
		"error",
		...seek > 0 ? ["-ss", seek.toFixed(6)] : [],
		"-i",
		info.file,
		"-map",
		"0:v:0",
		...o.fps ? [] : ["-fps_mode", "passthrough"],
		"-frames:v",
		String(count),
		"-vf",
		filters.join(","),
		"-f",
		"rawvideo",
		"-pix_fmt",
		o.gray ? "gray" : "rgb24",
		"pipe:1"
	];
	const size = o.width * o.height * (o.gray ? 1 : 3);
	let proc = null;
	for (const bin of tools.ffmpeg) try {
		proc = await new Promise((resolve, reject) => {
			const p = spawn(bin, args, { stdio: [
				"ignore",
				"pipe",
				"pipe"
			] });
			p.once("error", reject);
			p.once("spawn", () => resolve(p));
		});
		break;
	} catch (e) {
		if (e.code !== "ENOENT") throw e;
	}
	if (!proc) throw new Error(NO_FFMPEG);
	let stderr = "";
	proc.stderr.on("data", (d) => {
		stderr += String(d);
	});
	let buf = Buffer.alloc(0), index = from;
	try {
		for await (const chunk of proc.stdout) {
			buf = buf.length ? Buffer.concat([buf, chunk]) : chunk;
			while (buf.length >= size && (o.fps ? index - from < count : index <= to)) {
				yield {
					index: o.fps ? index - from : index,
					time: o.fps ? info.times[from] + (index - from) / o.fps : info.times[index],
					data: new Uint8Array(buf.subarray(0, size))
				};
				buf = buf.subarray(size);
				index++;
			}
		}
	} finally {
		if (proc.exitCode === null) proc.kill();
	}
	if (!o.fps && index <= to && stderr.trim()) throw new Error(`ffmpeg stopped at frame ${index} of ${info.file}: ${stderr.trim().slice(0, 300)}`);
}
function meanDiff(a, b) {
	let s = 0;
	for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
	return s / a.length;
}
function cadenceOf(diffs, fps, still = .6, moving = 1.5) {
	const repeats = [];
	for (let i = 1; i < diffs.length; i++) {
		if (diffs[i] >= still) continue;
		const before = i >= 2 ? diffs[i - 1] : Infinity, after = i + 1 < diffs.length ? diffs[i + 1] : Infinity;
		if (Math.min(before, after) > moving) repeats.push(i);
	}
	let period = null;
	if (repeats.length >= 3) {
		const gaps = [];
		for (let i = 1; i < repeats.length; i++) gaps.push(repeats[i] - repeats[i - 1]);
		const counts = /* @__PURE__ */ new Map();
		for (const g of gaps) counts.set(g, (counts.get(g) ?? 0) + 1);
		const [best, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
		if (best >= 2 && n >= .6 * gaps.length) period = best;
	}
	const originalFps = period ? Math.round(fps * (period - 1) / period * 1e3) / 1e3 : null;
	return {
		repeats,
		period,
		originalFps,
		reading: period ? `Every ${period}th frame repeats the one before while things move: likely made at ${originalFps} fps inside ${Math.round(fps * 1e3) / 1e3} fps. Moves are measured on the unique frames at their own times.` : repeats.length ? `${repeats.length} frames repeat the one before, with no steady pattern; they are left out of the fits.` : "No repeated frames while things move."
	};
}
var VIDEO_TOOLS, NO_FFMPEG;
function init_decode() {
	return (init_decode = __esmMin((() => {
		init_delivery_sound();
		VIDEO_TOOLS = {
			ffmpeg: FFMPEG,
			ffprobe: FFPROBE
		};
		NO_FFMPEG = "ffmpeg and ffprobe are not installed, so the video cannot be read. Install them (macOS: brew install ffmpeg; Windows: winget install ffmpeg) and try again.";
	})))();
}

// video/track.js
function fft(re, im, inv = false) {
	const n = re.length;
	for (let i = 1, j = 0; i < n; i++) {
		let bit = n >> 1;
		for (; j & bit; bit >>= 1) j ^= bit;
		j ^= bit;
		if (i < j) {
			[re[i], re[j]] = [re[j], re[i]];
			[im[i], im[j]] = [im[j], im[i]];
		}
	}
	for (let len = 2; len <= n; len <<= 1) {
		const ang = (inv ? 2 : -2) * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
		for (let i = 0; i < n; i += len) {
			let cr = 1, ci = 0;
			for (let k = 0; k < len / 2; k++) {
				const a = i + k, b = a + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
				re[b] = re[a] - xr;
				im[b] = im[a] - xi;
				re[a] += xr;
				im[a] += xi;
				const t = cr * wr - ci * wi;
				ci = cr * wi + ci * wr;
				cr = t;
			}
		}
	}
	if (inv) for (let i = 0; i < n; i++) {
		re[i] /= n;
		im[i] /= n;
	}
}
function fft2(img, w, h, P, Q) {
	const re = new Float64Array(P * Q), im = new Float64Array(P * Q);
	for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) re[y * P + x] = img[y * w + x];
	const rr = new Float64Array(P), ri = new Float64Array(P);
	for (let y = 0; y < Q; y++) {
		rr.set(re.subarray(y * P, y * P + P));
		ri.set(im.subarray(y * P, y * P + P));
		fft(rr, ri);
		re.set(rr, y * P);
		im.set(ri, y * P);
	}
	const cr = new Float64Array(Q), ci = new Float64Array(Q);
	for (let x = 0; x < P; x++) {
		for (let y = 0; y < Q; y++) {
			cr[y] = re[y * P + x];
			ci[y] = im[y * P + x];
		}
		fft(cr, ci);
		for (let y = 0; y < Q; y++) {
			re[y * P + x] = cr[y];
			im[y * P + x] = ci[y];
		}
	}
	return {
		re,
		im
	};
}
function ifft2(re, im, P, Q) {
	const cr = new Float64Array(Q), ci = new Float64Array(Q);
	for (let x = 0; x < P; x++) {
		for (let y = 0; y < Q; y++) {
			cr[y] = re[y * P + x];
			ci[y] = im[y * P + x];
		}
		fft(cr, ci, true);
		for (let y = 0; y < Q; y++) {
			re[y * P + x] = cr[y];
			im[y * P + x] = ci[y];
		}
	}
	const rr = new Float64Array(P), ri = new Float64Array(P);
	for (let y = 0; y < Q; y++) {
		rr.set(re.subarray(y * P, y * P + P));
		ri.set(im.subarray(y * P, y * P + P));
		fft(rr, ri, true);
		re.set(rr, y * P);
	}
	return re;
}
function resize(src, w, h, nw, nh) {
	const out = new Float64Array(nw * nh);
	for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
		const sx = Math.min(w - 1, Math.max(0, (x + .5) * w / nw - .5)), sy = Math.min(h - 1, Math.max(0, (y + .5) * h / nh - .5));
		const x0 = Math.floor(sx), y0 = Math.floor(sy), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1), fx = sx - x0, fy = sy - y0;
		out[y * nw + x] = src[y0 * w + x0] * (1 - fx) * (1 - fy) + src[y0 * w + x1] * fx * (1 - fy) + src[y1 * w + x0] * (1 - fx) * fy + src[y1 * w + x1] * fx * fy;
	}
	return out;
}
function matchTemplate(f, fw, fh, t, tw, th, scales, near) {
	const P = pow2(fw), Q = pow2(fh), F = fft2(f, fw, fh, P, Q);
	const I = new Float64Array((fw + 1) * (fh + 1)), I2 = new Float64Array((fw + 1) * (fh + 1));
	for (let y = 0; y < fh; y++) {
		let s = 0, s2 = 0;
		for (let x = 0; x < fw; x++) {
			const v = f[y * fw + x];
			s += v;
			s2 += v * v;
			I[(y + 1) * (fw + 1) + x + 1] = I[y * (fw + 1) + x + 1] + s;
			I2[(y + 1) * (fw + 1) + x + 1] = I2[y * (fw + 1) + x + 1] + s2;
		}
	}
	const box = (A, x, y, w, h) => A[(y + h) * (fw + 1) + x + w] - A[y * (fw + 1) + x + w] - A[(y + h) * (fw + 1) + x] + A[y * (fw + 1) + x];
	let best = null;
	for (const sc of scales) {
		const w = Math.max(4, Math.round(tw * sc)), h = Math.max(4, Math.round(th * sc));
		if (w >= fw || h >= fh) continue;
		const ts = resize(t, tw, th, w, h);
		let m = 0;
		for (let i = 0; i < ts.length; i++) m += ts[i];
		m /= ts.length;
		let tv = 0;
		for (let i = 0; i < ts.length; i++) {
			ts[i] -= m;
			tv += ts[i] * ts[i];
		}
		if (tv < 1e-6) continue;
		const T = fft2(ts, w, h, P, Q);
		const re = new Float64Array(P * Q), im = new Float64Array(P * Q);
		for (let i = 0; i < P * Q; i++) {
			re[i] = F.re[i] * T.re[i] + F.im[i] * T.im[i];
			im[i] = F.im[i] * T.re[i] - F.re[i] * T.im[i];
		}
		const c = ifft2(re, im, P, Q), n = w * h;
		const x0 = near ? Math.max(0, Math.floor(near.x - near.r - w / 2)) : 0, x1 = near ? Math.min(fw - w, Math.ceil(near.x + near.r - w / 2)) : fw - w;
		const y0 = near ? Math.max(0, Math.floor(near.y - near.r - h / 2)) : 0, y1 = near ? Math.min(fh - h, Math.ceil(near.y + near.r - h / 2)) : fh - h;
		const score = (x, y) => {
			const s = box(I, x, y, w, h), v = box(I2, x, y, w, h) - s * s / n;
			return v > 1e-6 ? c[y * P + x] / Math.sqrt(v * tv) : -1;
		};
		let bx = -1, by = -1, bs = -2;
		for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
			const s = score(x, y);
			if (s > bs) {
				bs = s;
				bx = x;
				by = y;
			}
		}
		if (bx < 0 || best && bs <= best.ncc) continue;
		const para = (a, b, cc) => {
			const den = a - 2 * b + cc;
			return Math.abs(den) > 1e-9 ? Math.max(-.5, Math.min(.5, .5 * (a - cc) / den)) : 0;
		};
		const dx = bx > 0 && bx < fw - w ? para(score(bx - 1, by), bs, score(bx + 1, by)) : 0, dy = by > 0 && by < fh - h ? para(score(bx, by - 1), bs, score(bx, by + 1)) : 0;
		const slope = c[by * P + bx] / tv;
		best = {
			x: bx + dx + w / 2,
			y: by + dy + h / 2,
			scale: sc,
			ncc: bs,
			opacity: Math.max(0, Math.min(1.5, slope))
		};
	}
	return best;
}
function scaleSet(lo, hi, n) {
	if (n <= 1 || hi <= lo) return [lo];
	return Array.from({ length: n }, (_, i) => lo * Math.pow(hi / lo, i / (n - 1)));
}
function refineScale(f, fw, fh, t, tw, th, m, k = 1.02) {
	const lo = matchTemplate(f, fw, fh, t, tw, th, [m.scale / k], {
		x: m.x,
		y: m.y,
		r: 3
	}), hi = matchTemplate(f, fw, fh, t, tw, th, [m.scale * k], {
		x: m.x,
		y: m.y,
		r: 3
	});
	if (!lo || !hi) return m;
	const a = lo.ncc, b = m.ncc, c = hi.ncc, den = a - 2 * b + c;
	const off = Math.abs(den) > 1e-9 ? Math.max(-1, Math.min(1, .5 * (a - c) / den)) : 0;
	return {
		...m,
		scale: m.scale * Math.pow(k, off)
	};
}
var pow2;
function init_track() {
	return (init_track = __esmMin((() => {
		pow2 = (n) => {
			let p = 1;
			while (p < n) p <<= 1;
			return p;
		};
	})))();
}

// video/run-track.js
function regionPx(r, w, h) {
	const a = Array.isArray(r) ? r.map(Number) : r && typeof r === "object" ? [
		"x",
		"y",
		"w",
		"h"
	].map((k) => Number(r[k])) : null;
	if (!a || a.length !== 4 || a.some((v) => !Number.isFinite(v)) || a[2] <= 0 || a[3] <= 0) return null;
	return a.every((v) => v <= 1) ? [
		a[0] * w,
		a[1] * h,
		a[2] * w,
		a[3] * h
	] : a;
}
function frameAt(info, t) {
	let lo = 0, hi = info.frames - 1;
	while (lo < hi) {
		const m = lo + hi + 1 >> 1;
		if (info.times[m] <= t + 1e-6) lo = m;
		else hi = m - 1;
	}
	return lo;
}
async function runTrack(args, opts = {}) {
	const tools = opts.tools ?? VIDEO_TOOLS, minNcc = opts.minNcc ?? .8;
	if (typeof args.file !== "string" || !path.isAbsolute(args.file)) return {
		ok: false,
		error: "`file` must be an absolute path to a video file"
	};
	if (typeof args.outDir !== "string" || !path.isAbsolute(args.outDir)) return {
		ok: false,
		error: "`outDir` must be an absolute folder path"
	};
	const started = performance.now();
	const info = await probeVideo(args.file, tools);
	if (info === null) return {
		ok: false,
		error: NO_FFMPEG
	};
	if ("error" in info) return {
		ok: false,
		error: info.error
	};
	const reg = regionPx(args.region, info.width, info.height);
	if (!reg) return {
		ok: false,
		error: "`region` must be [x, y, width, height] in pixels, or as shares of the frame (all 1 or under), round the thing in the reference frame"
	};
	const atFps = typeof args.atFps === "number" && args.atFps > 0 ? args.atFps : 30;
	const f0 = typeof args.start === "number" ? frameAt(info, args.start) : 0, f1 = typeof args.end === "number" ? frameAt(info, args.end) : info.frames - 1;
	if (f1 <= f0) return {
		ok: false,
		error: "`end` must be after `start`"
	};
	const refF = typeof args.ref === "number" ? frameAt(info, args.ref) : f1;
	const k = Math.min(1, (opts.workLong ?? 480) / Math.max(info.width, info.height)), W = Math.max(8, Math.round(info.width * k)), H = Math.max(8, Math.round(info.height * k));
	const sr = Array.isArray(args.scaleRange) && args.scaleRange.length === 2 ? args.scaleRange.map(Number) : [.25, 2.5];
	let ref = null;
	for await (const fr of readFrames(info, {
		from: refF,
		to: refF,
		width: W,
		height: H,
		gray: true
	}, tools)) ref = Float64Array.from(fr.data);
	if (!ref) return {
		ok: false,
		error: `could not read frame ${refF} of ${args.file}`
	};
	const tx = Math.round(reg[0] * k), ty = Math.round(reg[1] * k), tw = Math.max(4, Math.round(reg[2] * k)), th = Math.max(4, Math.round(reg[3] * k));
	const tmpl = new Float64Array(tw * th);
	for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) tmpl[y * tw + x] = ref[Math.min(H - 1, ty + y) * W + Math.min(W - 1, tx + x)];
	const rows = [];
	let prev = null, last = null;
	for await (const fr of readFrames(info, {
		from: f0,
		to: f1,
		width: W,
		height: H,
		gray: true
	}, tools)) {
		const img = Float64Array.from(fr.data), diff = last ? meanDiff(fr.data, last) : 0;
		let m = null;
		if (prev) {
			const r = Math.max(6, Math.round(.08 * Math.max(W, H))), sw = Math.ceil(tw * prev.scale * 1.35), sh = Math.ceil(th * prev.scale * 1.35);
			const cx0 = Math.max(0, Math.floor(prev.x - r - sw / 2)), cy0 = Math.max(0, Math.floor(prev.y - r - sh / 2));
			const cw = Math.min(W - cx0, Math.ceil(2 * r + sw)), ch = Math.min(H - cy0, Math.ceil(2 * r + sh));
			const crop = new Float64Array(cw * ch);
			for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) crop[y * cw + x] = img[(cy0 + y) * W + cx0 + x];
			let centre = prev.scale, local = matchTemplate(crop, cw, ch, tmpl, tw, th, scaleSet(centre / 1.04, centre * 1.04, 9));
			for (let k2 = 0; k2 < 6 && local && Math.abs(Math.log(local.scale / centre)) > Math.log(1.04) - 1e-6; k2++) {
				centre = local.scale > centre ? centre * 1.07 : centre / 1.07;
				const next = matchTemplate(crop, cw, ch, tmpl, tw, th, scaleSet(centre / 1.04, centre * 1.04, 9));
				if (!next || next.ncc < local.ncc) break;
				local = next;
			}
			if (local && local.ncc < .92) {
				const wide = matchTemplate(crop, cw, ch, tmpl, tw, th, scaleSet(prev.scale / 1.3, prev.scale * 1.3, 15));
				if (wide && wide.ncc > local.ncc) {
					const fine = matchTemplate(crop, cw, ch, tmpl, tw, th, scaleSet(wide.scale / 1.03, wide.scale * 1.03, 7));
					local = fine && fine.ncc >= wide.ncc ? fine : wide;
				}
			}
			if (local) m = {
				...local,
				x: local.x + cx0,
				y: local.y + cy0
			};
		}
		if (!m || m.ncc < minNcc) {
			let g = matchTemplate(img, W, H, tmpl, tw, th, scaleSet(sr[0], sr[1], 33));
			if (g) {
				const fine = matchTemplate(img, W, H, tmpl, tw, th, scaleSet(g.scale / 1.05, g.scale * 1.05, 11), {
					x: g.x,
					y: g.y,
					r: 4
				});
				if (fine && fine.ncc >= g.ncc) g = fine;
			}
			if (g && (!m || g.ncc > m.ncc)) m = g;
		}
		if (m && m.ncc >= minNcc) m = refineScale(img, W, H, tmpl, tw, th, m, 1.01);
		let still;
		if (!m || m.ncc < minNcc) {
			let mean = 0;
			for (let i = 0; i < tmpl.length; i++) mean += tmpl[i];
			mean /= tmpl.length;
			let cov = 0, tv = 0, wm = 0;
			for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) wm += img[Math.min(H - 1, ty + y) * W + Math.min(W - 1, tx + x)];
			wm /= tw * th;
			for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
				const t = tmpl[y * tw + x] - mean, v = img[Math.min(H - 1, ty + y) * W + Math.min(W - 1, tx + x)] - wm;
				cov += t * v;
				tv += t * t;
			}
			still = tv > 1e-6 ? Math.max(0, Math.min(1.5, cov / tv)) : 0;
		}
		rows.push({
			index: fr.index,
			time: fr.time,
			m: m && m.ncc >= minNcc ? m : null,
			diff,
			still
		});
		if (m && m.ncc >= minNcc) prev = m;
		last = fr.data;
	}
	const decodeSeconds = (performance.now() - started) / 1e3;
	const cad = cadenceOf(rows.map((r) => r.diff), 1 / (info.intervals.median || 1 / 30));
	const rep = new Set(cad.repeats.map((i) => rows[i].index));
	let lost = null;
	for (let i = 1; i + 2 < rows.length; i++) if (rows[i - 1].m && !rows[i].m && !rows[i + 1].m && !rows[i + 2].m && (rows[i - 1].m.opacity ?? 1) > .35) {
		lost = {
			frame: rows[i].index,
			time: rows[i].time,
			reading: `Lost the region at frame ${rows[i].index} (${rows[i].time.toFixed(3)} s): the match fell under ${minNcc} while it was still visible; nothing past it is measured.`
		};
		break;
	}
	const usable = rows.filter((r) => r.m && !rep.has(r.index) && (!lost || r.index < lost.frame));
	const toSrc = (m) => ({
		x: m.x / k,
		y: m.y / k,
		scale: m.scale * 100,
		opacity: m.opacity * 100
	});
	const channels = [
		{
			name: "position",
			unit: "px",
			value: (m) => {
				const s = toSrc(m);
				return [s.x, s.y];
			}
		},
		{
			name: "scale",
			unit: "%",
			value: (m) => [toSrc(m).scale]
		},
		{
			name: "opacity",
			unit: "%",
			value: (m) => [toSrc(m).opacity]
		}
	];
	const at = (t) => Math.round(t * atFps * 100) / 100;
	const out = {
		ok: true,
		file: args.file,
		region: reg,
		span: {
			from: f0,
			to: f1,
			start: info.times[f0],
			end: info.times[f1]
		},
		ref: refF,
		atFps,
		video: {
			width: info.width,
			height: info.height,
			frames: info.frames,
			nominalFps: info.nominalFps,
			averageFps: Math.round(info.averageFps * 1e3) / 1e3,
			variableRate: info.variableRate,
			intervals: info.intervals
		},
		cadence: {
			repeats: [...rep],
			period: cad.period,
			originalFps: cad.originalFps,
			reading: cad.reading
		},
		lost,
		notMeasured: NOT_MEASURED,
		moves: []
	};
	const fps = cad.originalFps ?? 1 / (info.intervals.median || 1 / 30);
	for (const ch of channels) {
		const samples = ch.name === "opacity" ? rows.filter((r) => !rep.has(r.index) && (!lost || r.index < lost.frame) && (r.m || r.still !== void 0)).map((r) => ({
			frame: r.index,
			time: r.time,
			value: r.m ? ch.value(r.m) : [r.still * 100]
		})) : usable.map((r) => ({
			frame: r.index,
			time: r.time,
			value: ch.value(r.m)
		}));
		if (samples.length < 4) continue;
		const span = Math.max(...samples.map((s) => s.value[0])) - Math.min(...samples.map((s) => s.value[0]));
		const span2 = samples[0].value.length > 1 ? Math.max(...samples.map((s) => s.value[1])) - Math.min(...samples.map((s) => s.value[1])) : 0;
		const minMove = ch.name === "position" ? Math.max(2, .004 * Math.max(info.width, info.height)) : 2;
		if (Math.max(span, span2) < minMove) continue;
		const report = analyzeCurve(samples, fps, { joinGap: 6 });
		for (const mv of report.moves) {
			if (mv.distance < minMove) continue;
			const i0 = samples.findIndex((s) => s.frame === mv.from), i1 = samples.findIndex((s) => s.frame === mv.to);
			if (i0 < 0 || i1 <= i0) continue;
			const nextMove = report.moves.find((x) => x.from > mv.to), restEnd = nextMove ? samples.findIndex((s) => s.frame === nextMove.from) : samples.length - 1;
			const tailVals = samples.slice(i1, Math.max(i1 + 1, Math.min(restEnd + 1, i1 + 10))).map((s) => s.value);
			const end = tailVals[0].map((_, d) => {
				const v = tailVals.map((x) => x[d]).sort((a, b) => a - b);
				return v[Math.floor(v.length / 2)];
			});
			const startV = samples[i0].value, way = end.map((e, d) => e - startV[d]), len2 = way.reduce((s, x) => s + x * x, 0);
			if (len2 <= 0) continue;
			const lo = Math.max(0, i0 - 3), hi = Math.min(samples.length - 1, i1 + 6);
			const prog = samples.slice(lo, hi + 1).map((s) => ({
				time: s.time,
				y: s.value.reduce((acc, v, d) => acc + (v - startV[d]) * way[d], 0) / len2
			}));
			const fits = fitMove(prog, {
				start: samples[i0].time,
				end: samples[i1].time
			}), tail = fitSpringTail(prog), seen = fitEaseSeen(prog);
			const best = fits[fits.best];
			out.moves.push({
				channel: ch.name,
				unit: ch.unit,
				curve: mv,
				from: {
					frame: mv.from,
					time: samples[i0].time,
					at: at(samples[i0].time)
				},
				to: {
					frame: mv.to,
					time: samples[i1].time,
					at: at(samples[i1].time)
				},
				duration: (() => {
					const sec = seen ? seen.end - seen.start : best.model === "spring" ? best.settle : best.end - best.start;
					return {
						seconds: Math.round(sec * 1e4) / 1e4,
						at: at(sec),
						as: seen ? "seen (1.5 % to 98.5 % of the travel)" : "the best fit's span"
					};
				})(),
				start: startV.map((v) => Math.round(v * 100) / 100),
				end: end.map((v) => Math.round(v * 100) / 100),
				distance: Math.round(Math.sqrt(len2) * 100) / 100,
				fits: {
					ease: fits.ease,
					linear: fits.linear,
					spring: fits.spring,
					springTail: tail,
					easeSeen: seen
				},
				best: fits.best,
				margin: fits.margin,
				apply: keysFor(best, startV, end, atFps),
				match: (() => {
					const n = usable.filter((r) => r.index >= mv.from && r.index <= mv.to).map((r) => r.m.ncc).sort((a, b) => a - b);
					return n.length ? {
						median: Math.round(n[Math.floor(n.length / 2)] * 1e3) / 1e3,
						min: Math.round(n[0] * 1e3) / 1e3
					} : null;
				})(),
				status: "measured"
			});
		}
	}
	for (const mv of out.moves) if (mv.match && mv.match.median < .85) mv.status = `uncertain: the region matched weakly (median ${mv.match.median}); look at the frames before using it`;
	else if (mv.fits[mv.best].rms > .05) mv.status = "measured, loosely (rms over 0.05)";
	const nccAll = rows.filter((r) => r.m).map((r) => r.m.ncc).sort((a, b) => a - b);
	out.match = {
		matchedFrames: nccAll.length,
		frames: rows.length,
		median: nccAll.length ? Math.round(nccAll[Math.floor(nccAll.length / 2)] * 1e3) / 1e3 : null,
		threshold: minNcc
	};
	await promises.mkdir(args.outDir, { recursive: true });
	const jsonPath = path.join(args.outDir, "track.json"), csvPath = path.join(args.outDir, "track.csv");
	const perFrame = rows.map((r) => ({
		index: r.index,
		time: Math.round(r.time * 1e6) / 1e6,
		at: at(r.time),
		repeat: rep.has(r.index),
		...r.m ? {
			...Object.fromEntries(Object.entries(toSrc(r.m)).map(([a, v]) => [a, Math.round(v * 100) / 100])),
			ncc: Math.round(r.m.ncc * 1e3) / 1e3
		} : { matched: false }
	}));
	await promises.writeFile(jsonPath, JSON.stringify({
		...out,
		frames: perFrame
	}, null, 1));
	await promises.writeFile(csvPath, ["index,time,at,x,y,scale,opacity,ncc,repeat", ...perFrame.map((p) => [
		p.index,
		p.time,
		p.at,
		p.x ?? "",
		p.y ?? "",
		p.scale ?? "",
		p.opacity ?? "",
		p.ncc ?? "",
		p.repeat ? 1 : 0
	].join(","))].join("\n"));
	const seconds = Math.round((performance.now() - started) / 1e3 * 100) / 100;
	return {
		...out,
		files: {
			json: jsonPath,
			csv: csvPath
		},
		timings: {
			seconds,
			decodeAndMatchSeconds: Math.round(decodeSeconds * 100) / 100,
			frames: rows.length
		},
		reading: `${out.moves.length} move${out.moves.length === 1 ? "" : "s"} measured over frames ${f0} to ${f1}${lost ? `; ${lost.reading}` : ""}. ${cad.reading} Not measured: ${NOT_MEASURED.join(", ")}.`
	};
}
var NOT_MEASURED;
function init_run_track() {
	return (init_run_track = __esmMin((() => {
		init_motion();
		init_decode();
		init_fit();
		init_track();
		NOT_MEASURED = [
			"rotation",
			"skew and perspective",
			"motion blur and its shutter",
			"colour and tint change",
			"depth (3D)",
			"anything outside the region's own picture (shadows, reflections)"
		];
	})))();
}

// video/shots.js
function shotList(stats, rules = SHOT_RULES) {
	const n = stats.length, ch = stats.map((s) => s.change), out = {
		cuts: [],
		swaps: [],
		notCuts: [],
		shots: []
	};
	const swapAt = /* @__PURE__ */ new Set();
	for (let i = 1; i + 1 < n; i++) {
		const a = stats[i], b = stats[i + 1];
		if (a.change >= rules.swapMin && b.change >= rules.swapMin && b.back < rules.swapBack * Math.min(a.change, b.change)) {
			swapAt.add(i);
			out.swaps.push({
				frame: a.index,
				time: a.time,
				change: Math.round(a.change * 10) / 10,
				region: null
			});
			continue;
		}
		for (let r = 0; r < a.regions.length; r++) {
			const ra = a.regions[r], rb = b.regions[r];
			const loc = median(stats.slice(Math.max(1, i - rules.around), Math.min(n, i + rules.around + 1)).map((s) => s.regions[r]));
			if (ra >= Math.max(rules.swapMin * 2, 4 * loc) && rb >= Math.max(rules.swapMin * 2, 4 * loc) && b.regionsBack[r] < rules.swapBack * Math.min(ra, rb)) {
				swapAt.add(i);
				out.swaps.push({
					frame: a.index,
					time: a.time,
					change: Math.round(ra * 10) / 10,
					region: r
				});
				break;
			}
		}
	}
	for (let i = 1; i < n; i++) {
		if (swapAt.has(i) || swapAt.has(i - 1)) continue;
		const nb = [...ch.slice(Math.max(1, i - rules.around), i), ...ch.slice(i + 1, Math.min(n, i + rules.around + 1))];
		const med = median(nb), held = nb.filter((x) => x < 1).length > .6 * nb.length;
		const hard = ch[i] >= rules.cutMin && ch[i] >= (held ? rules.heldRatio : rules.ratio) * Math.max(med, .5);
		const soft = !hard && ch[i] >= rules.softMin && ch[i] >= rules.softRatio * Math.max(med, .5) && ch[i] >= rules.softEvery * Math.max(ch[i - 1], i + 1 < n ? ch[i + 1] : 0);
		if (!hard && !soft) continue;
		if (stats[i].shiftShare >= rules.flashShare) {
			out.notCuts.push({
				frame: stats[i].index,
				time: stats[i].time,
				kind: "flash",
				change: Math.round(ch[i] * 10) / 10
			});
			continue;
		}
		const last = out.cuts[out.cuts.length - 1];
		if (last && stats[i].index - last.frame <= 3) {
			if (ch[i] > last.change) Object.assign(last, {
				frame: stats[i].index,
				time: stats[i].time,
				change: Math.round(ch[i] * 10) / 10
			});
			continue;
		}
		out.cuts.push({
			frame: stats[i].index,
			time: stats[i].time,
			change: Math.round(ch[i] * 10) / 10,
			...soft ? { soft: true } : {}
		});
	}
	let from = stats[0]?.index ?? 0, start = stats[0]?.time ?? 0;
	for (const c of out.cuts) {
		const k = stats.findIndex((s) => s.index === c.frame);
		out.shots.push({
			from,
			to: c.frame - 1,
			start,
			end: stats[k - 1]?.time ?? c.time
		});
		from = c.frame;
		start = c.time;
	}
	if (n) out.shots.push({
		from,
		to: stats[n - 1].index,
		start,
		end: stats[n - 1].time
	});
	return out;
}
function frameStats(index, time, a, b, c, w, h) {
	const grid = 4, regions = Array(16).fill(0), regionsBack = Array(16).fill(0), counts = Array(16).fill(0);
	let change = 0, back = 0, mean = 0;
	if (b) for (let i = 0; i < c.length; i++) mean += c[i] - b[i];
	mean = b ? mean / c.length : 0;
	let resid = 0;
	for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
		const i = y * w + x, r = Math.min(3, Math.floor(y * grid / h)) * grid + Math.min(3, Math.floor(x * grid / w));
		const d = b ? Math.abs(c[i] - b[i]) : 0, e = a ? Math.abs(c[i] - a[i]) : 0;
		change += d;
		back += e;
		regions[r] += d;
		regionsBack[r] += e;
		counts[r]++;
		if (b) resid += Math.abs(c[i] - b[i] - mean);
	}
	const N = w * h;
	return {
		index,
		time,
		change: change / N,
		back: a ? back / N : Infinity,
		regions: regions.map((v, r) => v / counts[r]),
		regionsBack: regionsBack.map((v, r) => a ? v / counts[r] : Infinity),
		shiftShare: change > 0 ? Math.max(0, 1 - resid / change) : 0
	};
}
var SHOT_RULES, median;
function init_shots() {
	return (init_shots = __esmMin((() => {
		SHOT_RULES = {
			cutMin: 12,
			ratio: 4,
			heldRatio: 3,
			around: 12,
			softMin: 10,
			softRatio: 8,
			softEvery: 4,
			swapMin: 10,
			swapBack: .35,
			flashShare: .7
		};
		median = (a) => {
			if (!a.length) return 0;
			const s = [...a].sort((x, y) => x - y);
			return s[Math.floor(s.length / 2)];
		};
	})))();
}

// video/run-shots-census.js
async function open(args, tools) {
	if (typeof args.file !== "string" || !path.isAbsolute(args.file)) return { error: "`file` must be an absolute path to a video file" };
	if (typeof args.outDir !== "string" || !path.isAbsolute(args.outDir)) return { error: "`outDir` must be an absolute folder path" };
	const info = await probeVideo(args.file, tools);
	if (info === null) return { error: NO_FFMPEG };
	if ("error" in info) return { error: info.error };
	const f0 = typeof args.start === "number" ? frameAt(info, args.start) : 0, f1 = typeof args.end === "number" ? frameAt(info, args.end) : info.frames - 1;
	if (f1 <= f0) return { error: "`end` must be after `start`" };
	return {
		info,
		f0,
		f1
	};
}
async function tilePng(info, frames, out, tile, tools) {
	if (!frames.length) return false;
	const sel = frames.map((f) => `eq(n\\,${f})`).join("+");
	const r = await runTool(tools.ffmpeg, [
		"-v",
		"error",
		"-y",
		"-i",
		info.file,
		"-vf",
		`select='${sel}',scale=${tile}:-2,tile=${frames.length}x1`,
		"-fps_mode",
		"passthrough",
		"-frames:v",
		"1",
		out
	], 12e4);
	return !!r && !r.failed;
}
async function runShots(args, tools = VIDEO_TOOLS) {
	const t0 = performance.now(), o = await open(args, tools);
	if ("error" in o) return {
		ok: false,
		error: o.error
	};
	const { info, f0, f1 } = o, { w, h } = size(info, 64), stats = [];
	let a = null, b = null;
	for await (const fr of readFrames(info, {
		from: f0,
		to: f1,
		width: w,
		height: h,
		gray: true
	}, tools)) {
		stats.push(frameStats(fr.index, fr.time, a, b, fr.data, w, h));
		a = b;
		b = fr.data;
	}
	const list = shotList(stats);
	await promises.mkdir(args.outDir, { recursive: true });
	const atFps = typeof args.atFps === "number" && args.atFps > 0 ? args.atFps : 30, at = (t) => Math.round(t * atFps * 100) / 100;
	const sheets = [], strips = [];
	if (args.pictures !== false) {
		for (let s = 0; s < list.shots.length && s < 60; s++) {
			const sh = list.shots[s], n = Math.min(8, sh.to - sh.from + 1), fr = Array.from({ length: n }, (_, i) => Math.round(sh.from + i * (sh.to - sh.from) / Math.max(1, n - 1)));
			const p = path.join(args.outDir, `shot-${String(s + 1).padStart(3, "0")}.png`);
			if (await tilePng(info, [...new Set(fr)], p, 160, tools)) sheets.push(p);
		}
		const changes = [...list.cuts.map((c) => c.frame), ...list.swaps.map((c) => c.frame)].sort((x, y) => x - y);
		for (const c of changes.slice(0, 40)) {
			const fr = [
				c - 2,
				c - 1,
				c,
				c + 1,
				c + 2
			].filter((f) => f >= 0 && f < info.frames), p = path.join(args.outDir, `change-${c}.png`);
			if (await tilePng(info, fr, p, 160, tools)) strips.push(p);
		}
	}
	const jsonPath = path.join(args.outDir, "shots.json");
	const result = {
		ok: true,
		file: args.file,
		atFps,
		span: {
			from: f0,
			to: f1
		},
		video: {
			width: info.width,
			height: info.height,
			frames: info.frames,
			nominalFps: info.nominalFps,
			variableRate: info.variableRate
		},
		cuts: list.cuts.map((c) => ({
			...c,
			at: at(c.time)
		})),
		swaps: list.swaps.map((c) => ({
			...c,
			at: at(c.time)
		})),
		notCuts: list.notCuts.map((c) => ({
			...c,
			at: at(c.time)
		})),
		shots: list.shots.map((s) => ({
			...s,
			at: [at(s.start), at(s.end)]
		}))
	};
	await promises.writeFile(jsonPath, JSON.stringify(result, null, 1));
	return {
		...result,
		shots: result.shots.length > 40 ? `${result.shots.length} shots: see shots.json` : result.shots,
		files: {
			json: jsonPath,
			sheets,
			strips
		},
		timings: {
			seconds: timing(t0),
			frames: stats.length
		},
		reading: `${list.cuts.length} cut${list.cuts.length === 1 ? "" : "s"}, ${list.swaps.length} one-frame swap${list.swaps.length === 1 ? "" : "s"}, ${list.notCuts.length} flash${list.notCuts.length === 1 ? "" : "es"} set aside, ${list.shots.length} shot${list.shots.length === 1 ? "" : "s"}.${info.variableRate ? " The file's frame rate varies; frames are timed by their own timestamps." : ""}`
	};
}
async function runCensus(args, tools = VIDEO_TOOLS) {
	const t0 = performance.now(), o = await open(args, tools);
	if ("error" in o) return {
		ok: false,
		error: o.error
	};
	const { info, f0, f1 } = o, step = typeof args.window === "number" && args.window > 0 ? args.window : .1, { w, h } = size(info, 320);
	const band = Array.isArray(args.band) && args.band.length === 2 ? args.band.map(Number) : [.15, .6];
	const y0 = Math.max(0, Math.round(band[0] * h)), y1 = Math.min(h, Math.round(band[1] * h)), pageTest = args.pageTest === true;
	const blur = (src) => {
		const out = new Uint8Array(src.length);
		for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
			let s = 0, c = 0;
			for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
				const yy = y + dy, xx = x + dx;
				if (yy >= 0 && yy < h && xx >= 0 && xx < w) {
					s += src[yy * w + xx] * (dx || dy ? 1 : 4);
					c += dx || dy ? 1 : 4;
				}
			}
			out[y * w + x] = Math.round(s / c);
		}
		return out;
	};
	const isPage = (f) => {
		const x0 = Math.round(5 * w / 180), x1 = Math.round(174 * w / 180);
		let m = 0, m2 = 0, n = 0;
		for (let y = 3; y <= 16 && y < h; y++) for (let x = x0; x <= x1 && x < w; x++) {
			const v = f[y * w + x];
			m += v;
			m2 += v * v;
			n++;
		}
		return n > 0 && Math.sqrt(Math.max(0, m2 / n - (m / n) ** 2)) < 9;
	};
	let prev = null;
	const labels = [], shifts = [], steps = [];
	for await (const fr of readFrames(info, {
		from: f0,
		to: f1,
		width: w,
		height: h,
		gray: true,
		fps: 1 / step
	}, tools)) {
		const cur = blur(fr.data);
		if (prev) {
			if (pageTest && (!isPage(prev) || !isPage(cur))) {
				labels.push(".");
				shifts.push(0);
				steps.push({
					time: fr.time,
					label: "."
				});
			} else {
				const s = censusStep(prev, cur, w, h, y0, y1);
				labels.push(s.label);
				shifts.push(s.shift);
				steps.push({
					time: Math.round(fr.time * 1e3) / 1e3,
					label: s.label,
					changed: Math.round(s.changed * 1e4) / 1e4,
					moved: Math.round(s.moved * 1e3) / 1e3
				});
			}
		}
		prev = cur;
	}
	const lab = labels.join(""), cad = cadence(lab.replace(/\./g, ""), shifts.filter((_, i) => labels[i] !== "."), step, Math.max(info.width, info.height) / Math.max(w, h));
	await promises.mkdir(args.outDir, { recursive: true });
	const col = {
		c: [
			90,
			90,
			90
		],
		l: [
			230,
			200,
			60
		],
		T: [
			240,
			120,
			30
		],
		X: [
			220,
			40,
			40
		],
		".": [
			0,
			0,
			0
		]
	}, sw = Math.max(1, labels.length), sh = 24, rgb = new Float64Array(sw * sh * 3);
	for (let x = 0; x < sw; x++) for (let y = 0; y < sh; y++) rgb.set(col[labels[x] ?? "."].map((v) => v / 255), (y * sw + x) * 3);
	const strip = path.join(args.outDir, "census.png"), jsonPath = path.join(args.outDir, "census.json");
	await promises.writeFile(strip, encodePngSrgb8(sw, sh, rgb));
	const result = {
		ok: true,
		file: args.file,
		window: step,
		band,
		pageTest,
		rules: CENSUS_RULES,
		labels: lab,
		cadence: cad
	};
	await promises.writeFile(jsonPath, JSON.stringify({
		...result,
		steps
	}, null, 1));
	return {
		...result,
		labels: lab.length > 600 ? `${lab.slice(0, 600)}\u2026 (${lab.length} steps: see census.json)` : lab,
		files: {
			json: jsonPath,
			strip
		},
		timings: {
			seconds: timing(t0),
			steps: labels.length
		},
		reading: `${labels.length} steps of ${step} s: calm ${Math.round(cad.shares.calm * 100)} %, local ${Math.round(cad.shares.local * 100)} %, travel ${Math.round(cad.shares.travel * 100)} %, cut ${Math.round(cad.shares.cut * 100)} %; ${cad.travel.perMinute} travel moves a minute (median ${cad.travel.medianSeconds} s); ${cad.burstsPer10s} bursts every 10 s; calm runs median ${cad.calmRuns.medianSeconds} s. A stage with little texture reads calmer than it looks (the census study's own caveat).`
	};
}
var size, timing;
function init_run_shots_census() {
	return (init_run_shots_census = __esmMin((() => {
		init_png16();
		init_delivery_sound();
		init_census();
		init_decode();
		init_run_track();
		init_shots();
		size = (info, long) => {
			const k = long / Math.max(info.width, info.height);
			return {
				w: Math.max(4, Math.round(info.width * k / 2) * 2),
				h: Math.max(4, Math.round(info.height * k / 2) * 2)
			};
		};
		timing = (t0) => Math.round((performance.now() - t0) / 1e3 * 100) / 100;
	})))();
}

export { init_run_moves, init_run_shots_census, init_run_track, runCensus, runCompareMoves, runMoves, runShots, runTrack };
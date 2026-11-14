import { __esmMin } from "./rolldown-runtime.js";
import { init_registry, jsxVal } from "./core-1.js";
import { promises } from "node:fs";
import * as os$1 from "node:os";
import * as path$1 from "node:path";
import { randomUUID } from "node:crypto";
import * as zlib from "node:zlib";

// color/motion.js
function resolveDiffThresholds(args = {}) {
	const out = { ...DIFF_DEFAULTS };
	for (const key of Object.keys(DIFF_DEFAULTS)) {
		const v = args[key];
		if (typeof v === "number") out[key] = v;
	}
	return out;
}
function diffArgsError(args) {
	for (const [key, value] of Object.entries(args)) {
		if (key === "sheet") continue;
		const limit = LIMITS$1[key];
		if (!limit) return `\`diff.${key}\` is not an option (options: ${Object.keys(LIMITS$1).join(", ")}, sheet)`;
		if (typeof value !== "number" || !Number.isFinite(value)) return `\`diff.${key}\` must be a number`;
		if ((limit.above ? value <= limit.min : value < limit.min) || value > limit.max || limit.int && !Number.isInteger(value)) {
			const range = limit.above ? `above ${limit.min} and at most ${limit.max}` : `${limit.min} to ${limit.max}`;
			return `\`diff.${key}\` must be ${limit.int ? "a whole number " : ""}${range}, not ${value}`;
		}
	}
	return null;
}
function pictureOf(img, straight) {
	const n = img.width * img.height;
	const out = new Float32Array(n * 3);
	const a = straight ? img.alpha : void 0;
	if (!a) {
		out.set(img.rgb);
		return out;
	}
	for (let p = 0; p < n; p++) {
		const w = a[p];
		const i = p * 3;
		out[i] = img.rgb[i] * w;
		out[i + 1] = img.rgb[i + 1] * w;
		out[i + 2] = img.rgb[i + 2] * w;
	}
	return out;
}
function rectStats(prev, cur, width, x0, y0, x1, y1, above, perPixel) {
	let sum = 0;
	let maxAbs = 0;
	let changed = 0;
	let bx0 = Infinity;
	let by0 = Infinity;
	let bx1 = -1;
	let by1 = -1;
	for (let y = y0; y < y1; y++) {
		let i = (y * width + x0) * 3;
		for (let x = x0; x < x1; x++, i += 3) {
			const dr = Math.abs(cur[i] - prev[i]);
			const dg = Math.abs(cur[i + 1] - prev[i + 1]);
			const db = Math.abs(cur[i + 2] - prev[i + 2]);
			const m = dr > dg ? dr > db ? dr : db : dg > db ? dg : db;
			const mean = (dr + dg + db) / 3;
			sum += mean;
			if (m > maxAbs) maxAbs = m;
			if (m > above) {
				changed++;
				if (x < bx0) bx0 = x;
				if (x > bx1) bx1 = x;
				if (y < by0) by0 = y;
				if (y > by1) by1 = y;
			}
			if (perPixel) perPixel(x, y, mean);
		}
	}
	const pixels = (x1 - x0) * (y1 - y0);
	return {
		pixels,
		change: r6$2(pixels > 0 ? sum / pixels : 0),
		maxAbsDelta: r6$2(maxAbs),
		changedPixels: changed,
		changedShare: r6$2(pixels > 0 ? changed / pixels : 0),
		changedBounds: changed > 0 ? {
			x: bx0,
			y: by0,
			width: bx1 - bx0 + 1,
			height: by1 - by0 + 1
		} : null
	};
}
function pictureChange(prev, cur, width, height, t, opts = {}) {
	let perPixel;
	let sums = null;
	let counts = null;
	const tw = opts.thumb?.width ?? 0;
	if (opts.thumb) {
		const th = opts.thumb.height;
		sums = new Float64Array(tw * th);
		counts = new Float64Array(tw * th);
		const col = new Int32Array(width);
		for (let x = 0; x < width; x++) col[x] = Math.min(tw - 1, Math.floor(x * tw / width));
		const row = new Int32Array(height);
		for (let y = 0; y < height; y++) row[y] = Math.min(th - 1, Math.floor(y * th / height)) * tw;
		const s = sums;
		const c = counts;
		perPixel = (x, y, mean) => {
			const k = row[y] + col[x];
			s[k] += mean;
			c[k]++;
		};
	}
	const out = { all: rectStats(prev, cur, width, 0, 0, width, height, t.changeAbove, perPixel) };
	if (opts.regions) out.regions = opts.regions.map((region) => {
		const clip = clipRegion({
			width,
			height
		}, region);
		if (!clip) return {
			name: region.name,
			error: `region is outside the ${width}\xD7${height} frame`
		};
		const { x, y, width: w, height: h } = clip.rect;
		return {
			name: region.name,
			...rectStats(prev, cur, width, x, y, x + w, y + h, t.changeAbove)
		};
	});
	if (sums && counts) {
		const thumb = new Float64Array(sums.length);
		for (let k = 0; k < sums.length; k++) thumb[k] = counts[k] > 0 ? Math.min(1, sums[k] / counts[k] * t.amplify) : 0;
		out.thumb = thumb;
	}
	return out;
}
function lowerMedian(values) {
	const s = [...values].sort((a, b) => a - b);
	return s[Math.floor((s.length - 1) / 2)];
}
function side(pairs, p, dir, window, skip) {
	const changes = [];
	const shares = [];
	for (let k = 1; k <= window; k++) {
		const j = p + dir * k;
		if (j < 0 || j >= pairs.length) break;
		if (skip.has(j)) continue;
		changes.push(pairs[j].change);
		shares.push(pairs[j].changedShare);
	}
	if (changes.length === 0) return null;
	return {
		change: lowerMedian(changes),
		share: lowerMedian(shares)
	};
}
function summarizeSeries(pairs, t) {
	const n = pairs.length;
	const changes = pairs.map((p) => p.change);
	let largest = 0;
	let smallest = 0;
	for (let i = 1; i < n; i++) {
		if (changes[i] > changes[largest]) largest = i;
		if (changes[i] < changes[smallest]) smallest = i;
	}
	const summary = {
		pairs: n,
		median: n > 0 ? r6$2(lowerMedian(changes)) : 0,
		mean: n > 0 ? r6$2(changes.reduce((a, b) => a + b, 0) / n) : 0,
		largest: {
			pair: largest,
			change: n > 0 ? changes[largest] : 0
		},
		smallest: {
			pair: smallest,
			change: n > 0 ? changes[smallest] : 0
		},
		flags: [],
		reading: ""
	};
	if (n < 2) {
		summary.reading = n === 0 ? "no pair of consecutive frames to compare" : "one pair: nothing to compare it with, so nothing is flagged (render at least three frames)";
		return summary;
	}
	const repeats = new Set(pairs.flatMap((p, i) => p.change <= t.repeatBelow ? [i] : []));
	const near = (i, set) => {
		for (let k = 1; k <= t.window; k++) if (set.has(i - k) || set.has(i + k)) return true;
		return false;
	};
	const standsOut = (p, i, skip) => {
		if (repeats.has(i) || p.changedShare < t.movingShare) return null;
		const sides = [side(pairs, i, -1, t.window, skip), side(pairs, i, 1, t.window, skip)].filter((s) => s !== null);
		if (sides.length === 0) return null;
		const reference = Math.max(...sides.map((s) => s.change), t.quietBelow);
		if (sides.some((s) => p.change < t.spikeRatio * Math.max(s.change, t.quietBelow))) return null;
		return {
			reference,
			edge: i === 0 || i === n - 1,
			besideRepeat: near(i, repeats)
		};
	};
	const first = pairs.map((p, i) => standsOut(p, i, repeats));
	const firstSpikes = new Set(first.flatMap((s, i) => s ? [i] : []));
	const skipBoth = /* @__PURE__ */ new Set([...repeats, ...firstSpikes]);
	const spike = pairs.map((p, i) => first[i] ?? (firstSpikes.size > 0 ? standsOut(p, i, skipBoth) : null));
	const spikes = new Set(spike.flatMap((s, i) => s ? [i] : []));
	const repeatNote = " (a repeated frame is next to it and was left out of the comparison)";
	const flags = [];
	for (let i = 0; i < n; i++) {
		const s = spike[i];
		if (!s) continue;
		if (!(i === 0 || !spike[i - 1])) continue;
		let end = i;
		while (end + 1 < n && spike[end + 1]) end++;
		if (end === i + 1) {
			const reference = Math.max(s.reference, spike[end].reference);
			const change = Math.min(pairs[i].change, pairs[end].change);
			const frame = pairs[i].to;
			const flag = {
				kind: "pop",
				pairs: [i, end],
				frame,
				change,
				reference: r6$2(reference),
				ratio: r6$2(change / reference),
				reading: `frame ${frameText(frame)} differs from the frames before and after it by ${fmt$2(change)} or more, while its neighbours change about ${fmt$2(reference)}: a one-frame pop`
			};
			if (s.besideRepeat || spike[end].besideRepeat) {
				flag.besideRepeat = true;
				flag.reading += repeatNote;
			}
			flags.push(flag);
			continue;
		}
		for (let j = i; j <= end; j++) {
			const sj = spike[j];
			const between = [pairs[j].from, pairs[j].to];
			const flag = {
				kind: "cut",
				pairs: [j],
				between,
				change: pairs[j].change,
				reference: r6$2(sj.reference),
				ratio: r6$2(pairs[j].change / sj.reference),
				reading: `${frameText(between[0])} to ${frameText(between[1])} changes ${fmt$2(pairs[j].change)}, ${(pairs[j].change / sj.reference).toFixed(1)}\xD7 its neighbours: a cut or a jump`
			};
			if (sj.edge) {
				flag.atSeriesEdge = true;
				flag.reading += " (first or last pair: it could also be a pop of the end frame)";
			}
			if (sj.besideRepeat) {
				flag.besideRepeat = true;
				flag.reading += repeatNote;
			}
			flags.push(flag);
		}
	}
	const moving = (s) => s !== null && s.change >= t.quietBelow && s.share >= t.movingShare;
	const notSpikes = /* @__PURE__ */ new Set([...spikes, ...repeats]);
	const neighbours = (i) => [i - 1, i + 1].filter((j) => j >= 0 && j < n && !repeats.has(j));
	for (let i = 0; i < n; i++) {
		if (spikes.has(i)) continue;
		const before = side(pairs, i, -1, t.window, notSpikes);
		const after = side(pairs, i, 1, t.window, notSpikes);
		const frame = pairs[i].to;
		const unreliablePairs = neighbours(i);
		const unreliable = unreliablePairs.length > 0 ? `; pair${unreliablePairs.length > 1 ? "s" : ""} ${unreliablePairs.join(" and ")} beside it ${unreliablePairs.length > 1 ? "are" : "is"} measured across the repeat, so ${unreliablePairs.length > 1 ? "their readings are" : "its reading is"} unreliable` : "";
		if (before && after && moving(before) && moving(after)) {
			const reference2 = Math.min(before.change, after.change);
			if (pairs[i].change > t.holdRatio * reference2) continue;
			flags.push({
				kind: "stutter",
				pairs: [i],
				frame,
				change: pairs[i].change,
				reference: r6$2(reference2),
				ratio: r6$2(pairs[i].change / reference2),
				unreliablePairs,
				reading: `frame ${frameText(frame)} barely changes from the one before (${fmt$2(pairs[i].change)}) while the frames around it move about ${fmt$2(reference2)}: a repeated frame, a stutter${unreliable}. Rounded times can do this: a time just below a frame boundary renders the frame before (see frameWarning)`
			});
			continue;
		}
		if (!repeats.has(i)) continue;
		const rawBefore = side(pairs, i, -1, t.window, spikes);
		const rawAfter = side(pairs, i, 1, t.window, spikes);
		if (!(rawBefore === null || rawAfter === null) || !(moving(rawBefore) || moving(rawAfter))) continue;
		const reference = (moving(rawBefore) ? rawBefore : rawAfter).change;
		flags.push({
			kind: "repeat",
			pairs: [i],
			frame,
			change: pairs[i].change,
			reference: r6$2(reference),
			ratio: r6$2(pairs[i].change / reference),
			atSeriesEdge: true,
			unreliablePairs,
			reading: `frame ${frameText(frame)} repeats the one before (change ${fmt$2(pairs[i].change)}) beside motion of about ${fmt$2(reference)}, at the ${rawBefore === null ? "start" : "end"} of the series, so a stutter cannot be told from a hold${unreliable}`
		});
	}
	flags.sort((a, b) => a.pairs[0] - b.pairs[0]);
	summary.flags = flags;
	const counts = [
		"pop",
		"stutter",
		"cut",
		"repeat"
	].map((k) => [k, flags.filter((f) => f.kind === k).length]).filter(([, c]) => c > 0).map(([k, c]) => `${c} ${k}${c > 1 ? "s" : ""}`);
	summary.reading = `${n} pairs, median change ${fmt$2(summary.median)}, largest ${fmt$2(summary.largest.change)} (pair ${largest}); ` + (flags.length === 0 ? "no pair stands out from its neighbours" : `${counts.join(", ")}: ${flags.map((f) => `${f.kind} at pair ${f.pairs.join("+")}`).join("; ")}`);
	return summary;
}
function cellLuma(img, cell) {
	const w = Math.ceil(img.width / cell);
	const h = Math.ceil(img.height / cell);
	const out = new Float32Array(w * h);
	const n = new Float32Array(w * h);
	for (let y = 0; y < img.height; y++) {
		const row = Math.floor(y / cell) * w;
		for (let x = 0; x < img.width; x++) {
			const p = (y * img.width + x) * 3;
			const k = row + Math.floor(x / cell);
			out[k] += .2126 * img.rgb[p] + .7152 * img.rgb[p + 1] + .0722 * img.rgb[p + 2];
			n[k]++;
		}
	}
	for (let k = 0; k < out.length; k++) out[k] /= n[k] || 1;
	return out;
}
function aboveFloor(m) {
	const s = m.values.slice().sort((a, b) => a - b);
	const floor = s[Math.floor(s.length / 2)] ?? 0;
	return Float64Array.from(m.values, (v) => Math.max(0, v - floor));
}
function motionCentre(m) {
	const a = aboveFloor(m);
	let s = 0;
	let sx = 0;
	let sy = 0;
	for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) {
		const v = a[y * m.width + x];
		s += v;
		sx += v * (x + .5);
		sy += v * (y + .5);
	}
	if (s <= 0) return null;
	const cx = sx / s;
	const cy = sy / s;
	let vx = 0;
	let vy = 0;
	for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) {
		const v = a[y * m.width + x];
		vx += v * (x + .5 - cx) ** 2;
		vy += v * (y + .5 - cy) ** 2;
	}
	const r3 = (v) => Math.round(v * 1e3) / 1e3;
	return {
		x: r3(cx / m.width),
		y: r3(cy / m.height),
		spreadX: r3(Math.sqrt(vx / s) / m.width),
		spreadY: r3(Math.sqrt(vy / s) / m.height)
	};
}
function registerMotionMaps(ref, build) {
	const ra = aboveFloor(ref);
	const ba = aboveFloor(build);
	const rc = motionCentre(ref);
	const bc = motionCentre(build);
	if (!rc || !bc) return null;
	const W = ref.width;
	const H = ref.height;
	const crx = rc.x * W;
	const cry = rc.y * H;
	const cbx = bc.x * build.width;
	const cby = bc.y * build.height;
	const kx = build.width / W;
	const ky = build.height / H;
	const corr = (s, dx, dy) => {
		let sab = 0;
		let saa = 0;
		let sbb = 0;
		let sa = 0;
		let sb = 0;
		let n = 0;
		for (let y = 0; y < H; y++) {
			const by = Math.floor(s * (y + .5 - cry) * ky + cby + dy);
			if (by < 0 || by >= build.height) continue;
			for (let x = 0; x < W; x++) {
				const bx = Math.floor(s * (x + .5 - crx) * kx + cbx + dx);
				if (bx < 0 || bx >= build.width) continue;
				const va = ra[y * W + x];
				const vb = ba[by * build.width + bx];
				sab += va * vb;
				saa += va * va;
				sbb += vb * vb;
				sa += va;
				sb += vb;
				n++;
			}
		}
		if (n < 4) return -1;
		const d = (saa - sa * sa / n) * (sbb - sb * sb / n);
		return d > 0 ? (sab - sa * sb / n) / Math.sqrt(d) : -1;
	};
	const rx = Math.max(2, Math.ceil(.12 * build.width));
	const ry = Math.max(2, Math.ceil(.12 * build.height));
	let best = {
		c: -2,
		s: 1,
		dx: 0,
		dy: 0
	};
	for (let s = .5; s <= 1.6001; s += .02) for (let dy = -ry; dy <= ry; dy++) for (let dx = -rx; dx <= rx; dx++) {
		const c = corr(s, dx, dy);
		if (c > best.c) best = {
			c,
			s,
			dx,
			dy
		};
	}
	const coarse = best;
	for (let s = coarse.s - .02; s <= coarse.s + .02001; s += .005) for (let dy = coarse.dy - 1; dy <= coarse.dy + 1; dy++) for (let dx = coarse.dx - 1; dx <= coarse.dx + 1; dx++) {
		const c = corr(s, dx, dy);
		if (c > best.c) best = {
			c,
			s,
			dx,
			dy
		};
	}
	const r3 = (v) => Math.round(v * 1e3) / 1e3;
	return {
		scale: r3(best.s),
		from: {
			x: rc.x,
			y: rc.y
		},
		to: {
			x: r3((cbx + best.dx) / build.width),
			y: r3((cby + best.dy) / build.height)
		},
		correlation: r3(best.c)
	};
}
function analyzeCurve(samples, fps, opts = {}) {
	const o = { ...CURVE_DEFAULTS };
	for (const [k, v] of Object.entries(opts)) if (typeof v === "number") o[k] = v;
	const frames = samples.map((s, i) => ({
		...s,
		speed: i === 0 ? 0 : rnd(norm(sub(s.value, samples[i - 1].value)) * fps)
	}));
	const peak = Math.max(0, ...frames.map((f) => f.speed));
	const flags = [];
	if (peak <= 1e-9) return {
		frames,
		moves: [],
		flags,
		reading: "The property does not move over the frames read."
	};
	const moving = frames.map((f) => f.speed > o.restBelow * peak);
	const runs = [];
	for (let i = 0; i < frames.length; i++) {
		if (!moving[i]) continue;
		let j = i;
		while (j + 1 < frames.length && moving[j + 1]) j++;
		const last = runs[runs.length - 1];
		if (last && i - last[1] - 1 <= o.joinGap) last[1] = j;
		else runs.push([i, j]);
		i = j;
	}
	const moves = runs.map(([i0, i1]) => {
		const from = Math.max(0, i0 - 1);
		const to = i1;
		const sp = frames.slice(i0, i1 + 1).map((f) => f.speed);
		const mid = median$3(sp);
		let pk = i0;
		for (let i = i0; i <= i1; i++) if (frames[i].speed > frames[pk].speed) pk = i;
		const start = frames[from].value;
		const end = frames[to].value;
		const way = sub(end, start);
		const distance = norm(way);
		const unit = distance > 0 ? way.map((x) => x / distance) : way;
		let over = 0;
		let overFrame = -1;
		let crossed = -1;
		for (let i = i0; i <= to; i++) {
			const p = sub(frames[i].value, end).reduce((s, x, k) => s + x * unit[k], 0);
			if (p > over) {
				over = p;
				overFrame = frames[i].frame;
			}
			if (crossed < 0 && p >= -o.settleWithin * distance) crossed = i;
		}
		const overshoot = distance > 0 && over / distance >= o.settleWithin ? {
			amount: rnd(over),
			share: rnd(over / distance),
			frame: overFrame
		} : null;
		let settle = null;
		if (overshoot && crossed >= 0) {
			let at = to;
			while (at - 1 > crossed && norm(sub(frames[at - 1].value, end)) <= o.settleWithin * distance) at--;
			settle = {
				frames: frames[at].frame - frames[crossed].frame,
				from: frames[crossed].frame,
				at: frames[at].frame
			};
		}
		return {
			from: frames[from].frame,
			to: frames[to].frame,
			distance: rnd(distance),
			peakSpeed: rnd(frames[pk].speed),
			peakFrame: frames[pk].frame,
			startEase: mid > 0 && frames[i0].speed >= o.noEaseAbove * mid ? "none" : "eased",
			endEase: mid > 0 && frames[i1].speed >= o.noEaseAbove * mid ? "none" : "eased",
			overshoot,
			settle
		};
	});
	for (const [k, m] of moves.entries()) {
		const [i0, i1] = runs[k];
		const span = `The move from frame ${m.from} to ${m.to}`;
		const mid = median$3(frames.slice(i0, i1 + 1).map((f) => f.speed));
		const pc = (v) => `${Math.round(v / (mid || 1) * 100)}%`;
		if (m.startEase === "none" || m.endEase === "none") {
			const both = m.startEase === "none" && m.endEase === "none";
			flags.push({
				kind: "no ease",
				frames: both ? [m.from, m.to] : m.startEase === "none" ? [m.from] : [m.to],
				reading: `${span} ${both ? "starts and stops at full speed" : m.startEase === "none" ? "starts at full speed" : "stops at full speed"} (no ease): its ${both ? `first and last moving frames run at ${pc(frames[i0].speed)} and ${pc(frames[i1].speed)}` : m.startEase === "none" ? `first moving frame runs at ${pc(frames[i0].speed)}` : `last moving frame runs at ${pc(frames[i1].speed)}`} of its middle speed. Ease it, unless a mechanical, constant move is meant.`
			});
		}
		const movePeak = m.peakSpeed;
		for (let j = i0 + 2; j <= i1 - 1; j++) {
			const a = frames[j - 1].speed;
			const b = frames[j].speed;
			const lo = Math.min(a, b);
			if (Math.abs(b - a) >= o.jumpShare * movePeak && (lo <= 0 || Math.max(a, b) / lo >= o.jumpRatio)) flags.push({
				kind: "speed jump",
				frames: [frames[j - 1].frame, frames[j].frame],
				reading: `${span} jumps in speed between frames ${frames[j - 1].frame} and ${frames[j].frame}: ${rnd(a, 10)} to ${rnd(b, 10)} units a second (top ${rnd(movePeak, 10)}). Look at the keys there.`
			});
		}
		if (m.overshoot) flags.push({
			kind: "overshoot",
			frames: [m.overshoot.frame],
			reading: `${span} overshoots by ${Math.round(m.overshoot.share * 100)}% of its distance (${rnd(m.overshoot.amount, 10)} units, at frame ${m.overshoot.frame})${m.settle ? ` and takes ${m.settle.frames} frames to settle within ${o.settleWithin * 100}% (frames ${m.settle.from} to ${m.settle.at})` : ""}. Whether that is the bounce you want is a judgment.`
		});
	}
	const problems = flags.filter((f) => f.kind !== "overshoot");
	return {
		frames,
		moves,
		flags,
		reading: `${moves.length} move${moves.length === 1 ? "" : "s"} over frames ${frames[0].frame} to ${frames[frames.length - 1].frame}; ` + (problems.length ? problems.map((f) => f.reading).join(" ") : "every move eases in and out, with no jump in speed.") + flags.filter((f) => f.kind === "overshoot").map((f) => ` ${f.reading}`).join("")
	};
}
function curveGraph(r, size = {
	width: 480,
	height: 160
}) {
	const { width: W, height: H } = size;
	const rgb = new Float64Array(W * H * 3);
	const put = (x, y, c) => {
		if (x < 0 || y < 0 || x >= W || y >= H) return;
		const p = (Math.round(y) * W + Math.round(x)) * 3;
		rgb[p] = c[0];
		rgb[p + 1] = c[1];
		rgb[p + 2] = c[2];
	};
	for (let i = 0; i < W * H; i++) rgb.set([
		.08,
		.08,
		.1
	], i * 3);
	const n = r.frames.length;
	if (!n) return {
		width: W,
		height: H,
		rgb
	};
	const pad = 6;
	const X = (i) => pad + (W - 12) * i / Math.max(1, n - 1);
	const Y = (u) => H - pad - (H - 12) * u;
	const first = r.frames[0].frame;
	for (const m of r.moves) for (let x = Math.floor(X(m.from - first)); x <= Math.ceil(X(m.to - first)); x++) for (let y = pad; y < H - pad; y++) put(x, y, [
		.14,
		.14,
		.18
	]);
	const line = (vals, c) => {
		const lo = Math.min(...vals);
		const hi = Math.max(...vals);
		const s = hi - lo > 1e-12 ? hi - lo : 1;
		for (let i = 1; i < n; i++) {
			const x0 = X(i - 1);
			const x1 = X(i);
			const y0 = Y((vals[i - 1] - lo) / s);
			const y1 = Y((vals[i] - lo) / s);
			const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
			for (let k = 0; k <= steps; k++) put(x0 + (x1 - x0) * k / steps, y0 + (y1 - y0) * k / steps, c);
		}
	};
	const dims = r.frames[0].value.length;
	for (let d = 0; d < dims; d++) line(r.frames.map((f) => f.value[d] ?? 0), [
		.85 - .2 * d,
		.85,
		.9
	]);
	line(r.frames.map((f) => f.speed), [
		1,
		.55,
		.15
	]);
	for (const f of r.flags.filter((x) => x.kind !== "overshoot")) for (const fr of f.frames) for (let y = pad; y < 16; y++) put(X(fr - first), y, [
		.95,
		.2,
		.2
	]);
	return {
		width: W,
		height: H,
		rgb
	};
}
function soundOnsets(values, fps, opts = {}) {
	const share = opts.share ?? .3;
	const gap = opts.gap ?? 3;
	const top = Math.max(0, ...values);
	if (top <= 1e-6) return [];
	const floor = median$3(values);
	const thr = floor + share * (top - floor);
	const out = [];
	let last = -Infinity;
	for (let f = 0; f < values.length; f++) if (values[f] >= thr && (f === 0 || values[f - 1] < thr) && f - last >= gap) {
		out.push({
			frame: f,
			time: f / fps,
			level: rnd(values[f])
		});
		last = f;
	}
	return out;
}
function parseTiming(text, fps) {
	const t = text.trim();
	if (t.startsWith("[") || t.startsWith("{")) {
		const j = JSON.parse(t);
		return (Array.isArray(j) ? j : j.words ?? j.markers ?? j.beats ?? []).map((e, i) => {
			const x = typeof e === "number" ? { time: e } : e;
			const label = String(x.word ?? x.w ?? x.text ?? x.label ?? x.name ?? "");
			const time = [
				x.start,
				x.time,
				x.t
			].find((v) => typeof v === "number") ?? (typeof x.frame === "number" ? x.frame / fps : void 0);
			if (time === void 0) throw new Error(`entry ${i + 1} of the timing file has no time (start, time or t in seconds, or frame)`);
			return {
				time,
				label
			};
		});
	}
	const out = [];
	for (const line of t.split(/\r?\n/)) {
		const [a, ...rest] = line.split(",");
		const time = Number(a);
		if (!line.trim() || !Number.isFinite(time)) continue;
		out.push({
			time,
			label: rest.join(",").trim()
		});
	}
	if (!out.length) throw new Error("no time,label lines in the timing file");
	return out;
}
function syncReport(events, markers, fps, opts = {}) {
	const o = {
		lateFrames: opts.lateFrames ?? SYNC_DEFAULTS.lateFrames,
		earlyFrames: opts.earlyFrames ?? SYNC_DEFAULTS.earlyFrames
	};
	if (!markers.length) return {
		events: [],
		flags: [],
		reading: "No markers to compare with: add word or beat markers first (sound.markers)."
	};
	const out = events.map((e) => {
		let best = markers[0];
		for (const m of markers) if (Math.abs(m.time - e.time) < Math.abs(best.time - e.time)) best = m;
		return {
			name: e.name,
			time: rnd(e.time, 1e4),
			frames: Math.round((e.time - best.time) * fps),
			marker: best
		};
	});
	const flags = out.filter((e) => e.frames >= o.lateFrames || e.frames <= -o.earlyFrames).map((e) => {
		const n = Math.abs(e.frames);
		return {
			...e,
			reading: `${e.name} is ${n} frame${n === 1 ? "" : "s"} ${e.frames > 0 ? "after" : "before"} the nearest marker (${e.marker?.label ? `'${e.marker.label}' ` : ""}at ${rnd(e.marker.time, 1e3)} s): ${e.frames > 0 ? "late" : "early"} (flagged from ${e.frames > 0 ? o.lateFrames : o.earlyFrames} frames ${e.frames > 0 ? "after" : "before"}).`
		};
	});
	return {
		events: out,
		flags,
		reading: flags.length ? flags.map((f) => f.reading).join(" ") : `All ${out.length} events are within ${o.lateFrames - 1} frame${o.lateFrames - 1 === 1 ? "" : "s"} after and ${o.earlyFrames - 1} before their nearest marker.`
	};
}
var DIFF_DEFAULTS, LIMITS$1, r6$2, fmt$2, frameText, CURVE_DEFAULTS, median$3, norm, sub, rnd, SYNC_DEFAULTS;
function init_motion() {
	return (init_motion = __esmMin((() => {
		init_sheet();
		DIFF_DEFAULTS = {
			changeAbove: .04,
			spikeRatio: 3,
			holdRatio: .25,
			quietBelow: .002,
			movingShare: 5e-4,
			window: 3,
			amplify: 8,
			repeatBelow: 1e-4
		};
		LIMITS$1 = {
			changeAbove: {
				min: 0,
				max: 1
			},
			spikeRatio: {
				min: 1,
				max: 1e3,
				above: true
			},
			holdRatio: {
				min: 0,
				max: 1,
				above: true
			},
			quietBelow: {
				min: 0,
				max: 1
			},
			movingShare: {
				min: 0,
				max: 1
			},
			window: {
				min: 1,
				max: 16,
				int: true
			},
			amplify: {
				min: 1,
				max: 1e3
			},
			repeatBelow: {
				min: 0,
				max: 1
			}
		};
		r6$2 = (v) => Math.round(v * 1e6) / 1e6;
		fmt$2 = (v) => v.toFixed(4);
		frameText = (f) => `#${f.index}${f.time === void 0 ? "" : ` (${r6$2(f.time)} s)`}`;
		CURVE_DEFAULTS = {
			restBelow: .02,
			noEaseAbove: .6,
			jumpRatio: 2.5,
			jumpShare: .25,
			settleWithin: .01,
			joinGap: 2
		};
		median$3 = (v) => {
			if (!v.length) return 0;
			const s = v.slice().sort((a, b) => a - b);
			const m = s.length >> 1;
			return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
		};
		norm = (v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
		sub = (a, b) => a.map((x, i) => x - (b[i] ?? 0));
		rnd = (v, k = 1e3) => Math.round(v * k) / k;
		SYNC_DEFAULTS = {
			lateFrames: 2,
			earlyFrames: 4
		};
	})))();
}

// color/sheet.js
function px(img, x, y) {
	const i = (y * img.width + x) * 3;
	return [
		img.rgb[i],
		img.rgb[i + 1],
		img.rgb[i + 2]
	];
}
function same(a, b) {
	return Math.abs(a[0] - b[0]) <= TOL && Math.abs(a[1] - b[1]) <= TOL && Math.abs(a[2] - b[2]) <= TOL;
}
function isBackground(img, x, y, bg) {
	if (img.alpha) return img.alpha[y * img.width + x] <= TOL;
	return bg !== null && same(px(img, x, y), bg);
}
function cornerColor(img) {
	const corners = [
		px(img, 0, 0),
		px(img, img.width - 1, 0),
		px(img, 0, img.height - 1),
		px(img, img.width - 1, img.height - 1)
	];
	let best = corners[0];
	let bestCount = 0;
	for (const c of corners) {
		const count = corners.filter((o) => same(o, c)).length;
		if (count > bestCount) {
			best = c;
			bestCount = count;
		}
	}
	return best;
}
function lineUniform(img, fixed, horizontal) {
	const n = horizontal ? img.width : img.height;
	const first = horizontal ? px(img, 0, fixed) : px(img, fixed, 0);
	let transparent = img.alpha !== void 0;
	for (let i = 0; i < n; i++) {
		const x = horizontal ? i : fixed;
		const y = horizontal ? fixed : i;
		if (transparent && img.alpha[y * img.width + x] > TOL) transparent = false;
		if (!same(px(img, x, y), first)) return {
			uniform: false,
			transparent: false,
			color: first
		};
	}
	return {
		uniform: true,
		transparent,
		color: first
	};
}
function edgeBand(img, side) {
	const horizontal = side === "top" || side === "bottom";
	const n = horizontal ? img.height : img.width;
	let width = 0;
	let color = null;
	let transparent = true;
	for (let i = 0; i < n; i++) {
		const line = lineUniform(img, side === "top" || side === "left" ? i : n - 1 - i, horizontal);
		if (!line.uniform) break;
		if (color === null) color = line.color;
		else if (!same(color, line.color)) break;
		if (!line.transparent) transparent = false;
		width++;
	}
	if (width === 0) return {
		width: 0,
		kind: "none",
		color: null
	};
	return {
		width,
		kind: transparent && img.alpha ? "transparent" : "color",
		color
	};
}
function analyzeFrame(img) {
	const { width, height } = img;
	const bgColor = img.alpha ? null : cornerColor(img);
	const sum = [
		0,
		0,
		0
	];
	let minX = width;
	let minY = height;
	let maxX = -1;
	let maxY = -1;
	let content = 0;
	const first = px(img, 0, 0);
	let uniform = true;
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		const i = (y * width + x) * 3;
		sum[0] += img.rgb[i];
		sum[1] += img.rgb[i + 1];
		sum[2] += img.rgb[i + 2];
		if (uniform && !same(px(img, x, y), first)) uniform = false;
		if (!isBackground(img, x, y, bgColor)) {
			content++;
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}
	}
	const total = width * height;
	return {
		width,
		height,
		meanRgb: [
			sum[0] / total,
			sum[1] / total,
			sum[2] / total
		],
		uniform,
		background: img.alpha ? {
			kind: "transparent",
			color: null
		} : {
			kind: "color",
			color: bgColor
		},
		contentBounds: content === 0 ? null : {
			left: minX,
			top: minY,
			width: maxX - minX + 1,
			height: maxY - minY + 1
		},
		coverage: content / total,
		edges: {
			top: edgeBand(img, "top"),
			bottom: edgeBand(img, "bottom"),
			left: edgeBand(img, "left"),
			right: edgeBand(img, "right")
		}
	};
}
function unmatte(img, bg) {
	const out = Float64Array.from(img.rgb);
	const alpha = img.alpha;
	if (!alpha) return out;
	for (let p = 0; p < alpha.length; p++) {
		const a = alpha[p];
		if (a >= 1) continue;
		const i = p * 3;
		for (let c = 0; c < 3; c++) out[i + c] = a <= 0 ? 0 : Math.min(1, Math.max(0, (out[i + c] - bg[c] * (1 - a)) / a));
	}
	return out;
}
function flattenOver(img, backdrop) {
	const out = Float64Array.from(img.rgb);
	const alpha = img.alpha;
	if (!alpha) return out;
	const { width, height } = img;
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		const p = y * width + x;
		const a = alpha[p];
		if (a >= 1) continue;
		const bg = backdrop.kind === "color" ? backdrop.color : (Math.floor(x / CHECKERBOARD.size) + Math.floor(y / CHECKERBOARD.size)) % 2 === 0 ? CHECKERBOARD.light : CHECKERBOARD.dark;
		const i = p * 3;
		out[i] = out[i] * a + bg[0] * (1 - a);
		out[i + 1] = out[i + 1] * a + bg[1] * (1 - a);
		out[i + 2] = out[i + 2] * a + bg[2] * (1 - a);
	}
	return out;
}
function clipRegion(img, region) {
	const x0 = Math.floor(region.x);
	const y0 = Math.floor(region.y);
	const x1 = x0 + Math.max(1, Math.floor(region.width ?? 1));
	const y1 = y0 + Math.max(1, Math.floor(region.height ?? 1));
	const cx0 = Math.max(0, x0);
	const cy0 = Math.max(0, y0);
	const cx1 = Math.min(img.width, x1);
	const cy1 = Math.min(img.height, y1);
	if (cx1 <= cx0 || cy1 <= cy0) return null;
	return {
		rect: {
			x: cx0,
			y: cy0,
			width: cx1 - cx0,
			height: cy1 - cy0
		},
		clipped: cx0 !== x0 || cy0 !== y0 || cx1 !== x1 || cy1 !== y1
	};
}
function outside(img, region) {
	return {
		name: region.name,
		error: `region is outside the ${img.width}\xD7${img.height} frame`
	};
}
function sampleRegions(img, regions) {
	return regions.map((region) => {
		const clip = clipRegion(img, region);
		if (!clip) return outside(img, region);
		const { rect } = clip;
		const sum = [
			0,
			0,
			0
		];
		const min = [
			Infinity,
			Infinity,
			Infinity
		];
		const max = [
			-Infinity,
			-Infinity,
			-Infinity
		];
		let aSum = 0;
		let aMin = Infinity;
		let aMax = -Infinity;
		let opaque = 0;
		let transparent = 0;
		for (let y = rect.y; y < rect.y + rect.height; y++) for (let x = rect.x; x < rect.x + rect.width; x++) {
			const p = y * img.width + x;
			for (let c = 0; c < 3; c++) {
				const v = img.rgb[p * 3 + c];
				sum[c] += v;
				if (v < min[c]) min[c] = v;
				if (v > max[c]) max[c] = v;
			}
			if (img.alpha) {
				const a = img.alpha[p];
				aSum += a;
				if (a < aMin) aMin = a;
				if (a > aMax) aMax = a;
				if (a >= .9921568627450981) opaque++;
				else if (a <= TOL) transparent++;
			}
		}
		const n = rect.width * rect.height;
		return {
			name: region.name,
			rect,
			clipped: clip.clipped,
			pixels: n,
			mean: r4rgb$2([
				sum[0] / n,
				sum[1] / n,
				sum[2] / n
			]),
			min: r4rgb$2(min),
			max: r4rgb$2(max),
			alpha: img.alpha ? {
				mean: r4$2(aSum / n),
				min: r4$2(aMin),
				max: r4$2(aMax),
				opaqueShare: r4$2(opaque / n),
				partialShare: r4$2((n - opaque - transparent) / n),
				transparentShare: r4$2(transparent / n)
			} : null
		};
	});
}
function histogramOf(img, bins) {
	const n = img.width * img.height;
	const counts = [
		0,
		1,
		2
	].map(() => Array.from({ length: bins }, () => 0));
	const aCounts = img.alpha ? Array.from({ length: bins }, () => 0) : void 0;
	const bin = (v) => Math.min(bins - 1, Math.max(0, Math.floor(v * bins)));
	for (let p = 0; p < n; p++) {
		for (let c = 0; c < 3; c++) counts[c][bin(img.rgb[p * 3 + c])]++;
		if (aCounts && img.alpha) aCounts[bin(img.alpha[p])]++;
	}
	return {
		bins,
		pixels: n,
		r: counts[0],
		g: counts[1],
		b: counts[2],
		...aCounts ? { a: aCounts } : {}
	};
}
function compareRegions(from, to, regions) {
	if (from.width !== to.width || from.height !== to.height) throw new Error(`cannot compare frames of different size (${from.width}\xD7${from.height} vs ${to.width}\xD7${to.height})`);
	const withAlpha = from.alpha !== void 0 && to.alpha !== void 0;
	return regions.map((region) => {
		const clip = clipRegion(from, region);
		if (!clip) return outside(from, region);
		const { rect } = clip;
		const delta = [
			0,
			0,
			0
		];
		const absSum = [
			0,
			0,
			0
		];
		const absMax = [
			0,
			0,
			0
		];
		let aDelta = 0;
		let aAbs = 0;
		let aMax = 0;
		for (let y = rect.y; y < rect.y + rect.height; y++) for (let x = rect.x; x < rect.x + rect.width; x++) {
			const p = y * from.width + x;
			for (let c = 0; c < 3; c++) {
				const d = to.rgb[p * 3 + c] - from.rgb[p * 3 + c];
				delta[c] += d;
				absSum[c] += Math.abs(d);
				if (Math.abs(d) > absMax[c]) absMax[c] = Math.abs(d);
			}
			if (withAlpha) {
				const d = to.alpha[p] - from.alpha[p];
				aDelta += d;
				aAbs += Math.abs(d);
				if (Math.abs(d) > aMax) aMax = Math.abs(d);
			}
		}
		const n = rect.width * rect.height;
		return {
			name: region.name,
			rect,
			clipped: clip.clipped,
			pixels: n,
			meanDelta: r4rgb$2([
				delta[0] / n,
				delta[1] / n,
				delta[2] / n
			]),
			meanAbsDelta: r4rgb$2([
				absSum[0] / n,
				absSum[1] / n,
				absSum[2] / n
			]),
			maxAbsDelta: r4rgb$2(absMax),
			alpha: withAlpha ? {
				meanDelta: r4$2(aDelta / n),
				meanAbsDelta: r4$2(aAbs / n),
				maxAbsDelta: r4$2(aMax)
			} : null
		};
	});
}
function rgbHex(rgb) {
	return `#${rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("")}`;
}
function resample(img, tw, th) {
	const out = new Float64Array(tw * th * 3);
	const counts = new Float64Array(tw * th);
	for (let y = 0; y < img.height; y++) {
		const ty = Math.min(th - 1, Math.floor(y * th / img.height));
		for (let x = 0; x < img.width; x++) {
			const tx = Math.min(tw - 1, Math.floor(x * tw / img.width));
			const si = (y * img.width + x) * 3;
			const di = (ty * tw + tx) * 3;
			out[di] += img.rgb[si];
			out[di + 1] += img.rgb[si + 1];
			out[di + 2] += img.rgb[si + 2];
			counts[ty * tw + tx]++;
		}
	}
	for (let i = 0; i < tw * th; i++) {
		const c = counts[i] || 1;
		out[i * 3] /= c;
		out[i * 3 + 1] /= c;
		out[i * 3 + 2] /= c;
	}
	return out;
}
function drawText(rgb, width, x0, y0, text, color) {
	let cx = x0;
	for (const ch of text) {
		const glyph = GLYPHS[ch] ?? GLYPHS[" "];
		for (let gy = 0; gy < glyph.length; gy++) for (let gx = 0; gx < GLYPH_W; gx++) {
			if (glyph[gy][gx] !== "#") continue;
			for (let sy = 0; sy < FONT_SCALE; sy++) for (let sx = 0; sx < FONT_SCALE; sx++) {
				const x = cx + gx * FONT_SCALE + sx;
				const i = ((y0 + gy * FONT_SCALE + sy) * width + x) * 3;
				rgb[i] = color[0];
				rgb[i + 1] = color[1];
				rgb[i + 2] = color[2];
			}
		}
		cx += 12;
	}
}
function composeContactSheet(frames, opts = {}) {
	if (frames.length === 0) throw new Error("contact sheet needs at least one frame");
	const gap = opts.gap ?? 8;
	const bg = opts.background ?? [
		.12,
		.12,
		.12
	];
	const columns = Math.max(1, Math.min(frames.length, opts.columns ?? Math.ceil(Math.sqrt(frames.length))));
	const rows = Math.ceil(frames.length / columns);
	const srcW = Math.max(...frames.map((f) => f.width));
	const srcH = Math.max(...frames.map((f) => f.height));
	const thumbWidth = Math.max(16, Math.min(opts.thumbWidth ?? 480, srcW));
	const thumbHeight = Math.max(1, Math.round(srcH * thumbWidth / srcW));
	const cellW = thumbWidth;
	const cellH = LABEL_H + thumbHeight;
	const width = gap + columns * (cellW + gap);
	const height = gap + rows * (cellH + gap);
	const rgb = new Float64Array(width * height * 3);
	for (let i = 0; i < width * height; i++) {
		rgb[i * 3] = bg[0];
		rgb[i * 3 + 1] = bg[1];
		rgb[i * 3 + 2] = bg[2];
	}
	for (const [n, frame] of frames.entries()) {
		const col = n % columns;
		const row = Math.floor(n / columns);
		const x0 = gap + col * (cellW + gap);
		const y0 = gap + row * (cellH + gap);
		const tw = Math.max(1, Math.min(thumbWidth, Math.round(frame.width * thumbWidth / srcW)));
		const th = Math.max(1, Math.min(thumbHeight, Math.round(frame.height * tw / frame.width)));
		const thumb = resample(frame, tw, th);
		for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
			const si = (y * tw + x) * 3;
			const di = ((y0 + LABEL_H + y) * width + (x0 + x)) * 3;
			rgb[di] = thumb[si];
			rgb[di + 1] = thumb[si + 1];
			rgb[di + 2] = thumb[si + 2];
		}
		const label = opts.labels?.[n] ?? `#${n}`;
		drawText(rgb, width, x0 + 2, y0 + 2, label, [
			.95,
			.95,
			.95
		]);
	}
	return {
		width,
		height,
		rgb,
		columns,
		rows,
		thumbWidth,
		thumbHeight
	};
}
function frameLabel(index, time) {
	return time === void 0 ? `#${index}` : `#${index} ${time.toFixed(3)}s`;
}
function labOf(rgb) {
	const [r, g, b] = rgb.map((v) => srgbToLinear(Math.min(1, Math.max(0, v))));
	const x = (.4124564 * r + .3575761 * g + .1804375 * b) / .95047;
	const y = .2126729 * r + .7151522 * g + .072175 * b;
	const z = (.0193339 * r + .119192 * g + .9503041 * b) / 1.08883;
	const fx = labF(x);
	const fy = labF(y);
	const fz = labF(z);
	const L = 116 * fy - 16;
	const A = 500 * (fx - fy);
	const B = 200 * (fy - fz);
	const hue = (Math.atan2(B, A) * 180 / Math.PI + 360) % 360;
	const r2 = (v) => Math.round(v * 100) / 100;
	return {
		L: r2(L),
		a: r2(A),
		b: r2(B),
		chroma: r2(Math.hypot(A, B)),
		hue: Math.round(hue * 10) / 10
	};
}
function neutralGains(rgb) {
	const k = luma$1(rgb);
	return rgb.map((v) => v > 0 ? k / v : 1);
}
function cropOf(img, rect, opaque) {
	const { x, y, width, height } = rect;
	const rgb = new Float64Array(width * height * 3);
	const use = new Uint8Array(width * height);
	const alpha = img.alpha ? new Float64Array(width * height) : void 0;
	for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
		const p = (y + j) * img.width + (x + i);
		const q = j * width + i;
		for (let c = 0; c < 3; c++) rgb[q * 3 + c] = img.rgb[p * 3 + c];
		use[q] = !img.alpha || img.alpha[p] >= opaque ? 1 : 0;
		if (alpha && img.alpha) alpha[q] = img.alpha[p];
	}
	return alpha ? {
		rect,
		width,
		height,
		rgb,
		use,
		alpha
	} : {
		rect,
		width,
		height,
		rgb,
		use
	};
}
function lookCrops(img, args) {
	const out = /* @__PURE__ */ new Map();
	for (const r of args.regions) {
		const clip = clipRegion(img, r);
		if (clip) out.set(r.name, cropOf(img, clip.rect, LOOK_DEFAULTS.opaque));
	}
	return out;
}
function median$2(v) {
	if (!v.length) return NaN;
	const s = v.slice().sort((a, b) => a - b);
	const m = s.length >> 1;
	return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function percentile(v, p) {
	if (!v.length) return NaN;
	const s = v.slice().sort((a, b) => a - b);
	return s[Math.min(s.length - 1, Math.max(0, Math.round(p / 100 * (s.length - 1))))];
}
function spatialGrain(c) {
	const out = [];
	const scale = 1 / Math.sqrt(8 / 9);
	for (let ch = 0; ch < 3; ch++) {
		const res = [];
		for (let y = 1; y < c.height - 1; y += 1) for (let x = 1; x < c.width - 1; x += 1) {
			let ok = true;
			let sum = 0;
			for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) {
				const q = (y + dy) * c.width + (x + dx);
				if (!c.use[q]) {
					ok = false;
					break;
				}
				sum += c.rgb[q * 3 + ch];
			}
			if (!ok) continue;
			res.push(c.rgb[(y * c.width + x) * 3 + ch] - sum / 9);
		}
		out.push(res.length ? steps(robustSd(res) * scale) : NaN);
	}
	return out;
}
function temporalGrain(a, b) {
	if (a.width !== b.width || a.height !== b.height) return null;
	const out = [];
	for (let ch = 0; ch < 3; ch++) {
		const d = [];
		for (let q = 0; q < a.use.length; q++) if (a.use[q] && b.use[q]) d.push(b.rgb[q * 3 + ch] - a.rgb[q * 3 + ch]);
		if (!d.length) return null;
		out.push(steps(robustSd(d) / Math.SQRT2));
	}
	return out;
}
function edgeWidths(c, minContrast) {
	const R = LOOK_DEFAULTS.edgeReach;
	const half = LOOK_DEFAULTS.edgeLines >> 1;
	const Y = new Float64Array(c.width * c.height);
	for (let q = 0; q < Y.length; q++) Y[q] = c.use[q] ? luma$1([
		c.rgb[q * 3],
		c.rgb[q * 3 + 1],
		c.rgb[q * 3 + 2]
	]) : NaN;
	const widths = [];
	const scan = (along, across, at) => {
		for (let v = half; v < across - half; v += 2) {
			const prof = (u2) => {
				let s = 0;
				for (let k = -half; k <= half; k++) s += at(u2, v + k);
				return s / (2 * half + 1);
			};
			let u = R;
			while (u < along - R - 1) {
				const d = Math.abs(prof(u + 1) - prof(u));
				const span = prof(u + R + 1) - prof(u - R);
				if (!Number.isFinite(d) || !Number.isFinite(span) || Math.abs(span) < minContrast) {
					u++;
					continue;
				}
				let best = u;
				let bestD = d;
				for (let w = Math.max(R, u - R); w <= Math.min(along - R - 2, u + R); w++) {
					const dw = Math.abs(prof(w + 1) - prof(w));
					if (dw > bestD) {
						best = w;
						bestD = dw;
					}
				}
				if (best !== u) {
					u = best > u ? best : u + 1;
					continue;
				}
				const p = [];
				for (let k = -R; k <= R + 1; k++) p.push(prof(u + k));
				const lo = (p[0] + p[1]) / 2;
				const hi = (p[p.length - 1] + p[p.length - 2]) / 2;
				if (Math.abs(hi - lo) >= minContrast * .8) {
					const q = p.map((x) => (x - lo) / (hi - lo));
					const cross = (t) => {
						for (let k = 1; k < q.length; k++) if (q[k] >= t) return k - 1 + (t - q[k - 1]) / (q[k] - q[k - 1] || 1);
						return NaN;
					};
					const wdt = cross(.9) - cross(.1);
					if (Number.isFinite(wdt) && wdt > 0) widths.push(wdt);
				}
				u += R;
			}
		}
	};
	scan(c.width, c.height, (u, v) => Y[v * c.width + u]);
	scan(c.height, c.width, (u, v) => Y[u * c.width + v]);
	if (widths.length < 3) return {
		edgeWidth: null,
		p90: null,
		edges: widths.length
	};
	return {
		edgeWidth: Math.round(median$2(widths) * 100) / 100,
		p90: Math.round(percentile(widths, 90) * 100) / 100,
		edges: widths.length
	};
}
function levelsOf(c) {
	const ch = [
		[],
		[],
		[]
	];
	const Ys = [];
	for (let q = 0; q < c.use.length; q++) {
		if (!c.use[q]) continue;
		const px2 = [
			c.rgb[q * 3],
			c.rgb[q * 3 + 1],
			c.rgb[q * 3 + 2]
		];
		for (let k = 0; k < 3; k++) ch[k].push(px2[k]);
		Ys.push(luma$1(px2));
	}
	const mean = ch.map((v) => v.reduce((s, x) => s + x, 0) / (v.length || 1));
	return {
		black: r4rgb$2(ch.map((v) => percentile(v, .5))),
		white: r4rgb$2(ch.map((v) => percentile(v, 99.5))),
		mean: r4rgb$2(mean),
		lumaBlack: r4$2(percentile(Ys, .5)),
		lumaWhite: r4$2(percentile(Ys, 99.5)),
		lumaMean: r4$2(luma$1(mean))
	};
}
function castWords(a, b) {
	const parts = [];
	if (Math.abs(a) >= LOOK_DEFAULTS.castAbove) parts.push([Math.abs(a), a > 0 ? "magenta" : "green"]);
	if (Math.abs(b) >= LOOK_DEFAULTS.castAbove) parts.push([Math.abs(b), b > 0 ? "yellow" : "blue"]);
	if (!parts.length) return null;
	return parts.sort((x, y) => y[0] - x[0]).map((p) => p[1]).join(" and ");
}
function roleReading(name, role, lab, levels, rep) {
	if (role === "neutral") {
		const toward = castWords(lab.a, lab.b);
		const gains = neutralGains(levels.mean);
		const mix = (g) => Math.round(g * 100);
		rep.cast = {
			a: lab.a,
			b: lab.b,
			amount: lab.chroma,
			toward,
			gains: [
				r4$2(gains[0]),
				r4$2(gains[1]),
				r4$2(gains[2])
			],
			channelMixer: {
				"Red-Red": mix(gains[0]),
				"Green-Green": mix(gains[1]),
				"Blue-Blue": mix(gains[2])
			}
		};
		rep.reading = toward ? `${name} reads a* ${signed(lab.a)}, b* ${signed(lab.b)} (CIELAB): a cast toward ${toward} of ${lab.chroma.toFixed(1)}, if the surface is really neutral; a neutral reads 0, 0, and under about 2 is hard to see. Gains on the display values that make it neutral at its own brightness: red ${rep.cast.gains[0]}, green ${rep.cast.gains[1]}, blue ${rep.cast.gains[2]} (Channel Mixer Red-Red ${rep.cast.channelMixer["Red-Red"]}, Green-Green ${rep.cast.channelMixer["Green-Green"]}, Blue-Blue ${rep.cast.channelMixer["Blue-Blue"]}).` : `${name} reads neutral: a* ${signed(lab.a)}, b* ${signed(lab.b)} (CIELAB; under about 2 is hard to see).`;
	} else if (role === "skin") {
		const [lo, hi] = LOOK_DEFAULTS.skinHue;
		const h = lab.hue > 270 ? lab.hue - 360 : lab.hue;
		const where = h < lo ? `below the usual range, so it leans to magenta (pink); ${(lo - h).toFixed(0)}\xB0 short of ${lo}\xB0` : h > hi ? `above the usual range, so it leans to yellow; ${(h - hi).toFixed(0)}\xB0 past ${hi}\xB0` : "inside the usual range";
		rep.reading = `${name} (skin) has a hue angle of ${h.toFixed(0)}\xB0 and chroma ${lab.chroma.toFixed(1)} (CIELAB): ${where}. Skin of many tones commonly reads about ${lo} to ${hi}\xB0 under neutral light; that range is a general reference, not measured on this footage, so judge it against a neutral in the same light as well.`;
	}
}
function compareLook(element, plate, tol = {}) {
	const gt = tol.grain ?? LOOK_DEFAULTS.grainTolerance;
	const st = tol.sharpness ?? LOOK_DEFAULTS.sharpnessTolerance;
	const eg = meanOf(element.grain.spatial);
	const pg = meanOf(plate.grain.spatial);
	const gRatio = pg > 0 ? Math.round(eg / pg * 100) / 100 : null;
	const gMatch = gRatio === null ? null : Math.abs(gRatio - 1) <= gt;
	const ew = element.sharpness.edgeWidth;
	const pw = plate.sharpness.edgeWidth;
	const sRatio = ew !== null && pw !== null && pw > 0 ? Math.round(ew / pw * 100) / 100 : null;
	const sMatch = sRatio === null ? null : Math.abs(sRatio - 1) <= st;
	const bd = r4$2(element.levels.lumaBlack - plate.levels.lumaBlack);
	const wd = r4$2(element.levels.lumaWhite - plate.levels.lumaWhite);
	const readings = [];
	const e = element.name;
	if (gRatio !== null && !gMatch) readings.push(gRatio < 1 ? `${e} is cleaner than the plate: add grain (grain ${eg.toFixed(2)} against ${pg.toFixed(2)} 8-bit steps).` : `${e} is grainier than the plate: take grain out or add less (${eg.toFixed(2)} against ${pg.toFixed(2)} 8-bit steps).`);
	if (sRatio !== null && !sMatch) readings.push(sRatio < 1 ? `${e} is sharper than the plate: soften it (edges ${ew} px against ${pw} px wide, 10 to 90%).` : `${e} is softer than the plate: sharpen it, or soften the plate's match less (edges ${ew} px against ${pw} px).`);
	const deepest = "if both regions hold the deepest shadow of their picture";
	const brightest = "if both regions hold the brightest highlight of their picture";
	if (Math.abs(bd) > LOOK_DEFAULTS.levelTolerance) readings.push(bd > 0 ? `${e}'s blacks are lifted against the plate's (${element.levels.lumaBlack} against ${plate.levels.lumaBlack}): ${deepest}, seat them lower.` : `${e}'s blacks are deeper than the plate's (${element.levels.lumaBlack} against ${plate.levels.lumaBlack}): ${deepest}, lift them.`);
	if (Math.abs(wd) > LOOK_DEFAULTS.levelTolerance) readings.push(wd > 0 ? `${e}'s whites are brighter than the plate's (${element.levels.lumaWhite} against ${plate.levels.lumaWhite}): ${brightest}, bring them down.` : `${e}'s whites are duller than the plate's (${element.levels.lumaWhite} against ${plate.levels.lumaWhite}): ${brightest}, bring them up.`);
	if (pw === null || ew === null) readings.push("Edge width was not compared: one side has no edge strong enough to read; pick regions that each hold an edge.");
	if (!readings.length) readings.push(`${e} matches the plate in grain, edge width and black and white points, within the tolerances.`);
	return {
		element: element.name,
		plate: plate.name,
		grain: {
			element: Math.round(eg * 100) / 100,
			plate: Math.round(pg * 100) / 100,
			ratio: gRatio,
			matches: gMatch
		},
		sharpness: {
			element: ew,
			plate: pw,
			ratio: sRatio,
			matches: sMatch
		},
		levels: {
			blackDifference: bd,
			whiteDifference: wd
		},
		readings
	};
}
function matteEdge(c, minContrast) {
	const a = c.alpha;
	const grey = new Float64Array(a.length * 3);
	for (let q = 0; q < a.length; q++) grey[q * 3] = grey[q * 3 + 1] = grey[q * 3 + 2] = a[q];
	const widths = edgeWidths({
		...c,
		rgb: grey,
		use: new Uint8Array(a.length).fill(1)
	}, minContrast);
	let soft = 0;
	let outline = 0;
	let opaque = 0;
	let minAlpha = 1;
	const w = c.width;
	for (let y = 0; y < c.height; y++) for (let x = 0; x < w; x++) {
		const v = a[y * w + x];
		if (v > .02 && v < .98) soft++;
		if (v >= .99) opaque++;
		if (v < minAlpha) minAlpha = v;
		if (v < .5) continue;
		const p = y * w + x;
		if (x > 0 && a[p - 1] < .5 || x < w - 1 && a[p + 1] < .5 || y > 0 && a[p - w] < .5 || y < c.height - 1 && a[p + w] < .5) outline++;
	}
	return {
		...widths,
		softBand: outline ? Math.round(soft / outline * 100) / 100 : null,
		opaqueShare: Math.round(opaque / a.length * 1e4) / 1e4,
		minAlpha: Math.round(minAlpha * 1e4) / 1e4
	};
}
function edgeColourOf(c, background) {
	const a = c.alpha;
	const w = c.width;
	const band = [
		0,
		0,
		0
	];
	const inside = [
		0,
		0,
		0
	];
	let nb = 0;
	let ni = 0;
	for (let y = 0; y < c.height; y++) for (let x = 0; x < w; x++) {
		const p = y * w + x;
		const v = a[p];
		if (v > .2 && v < .98) {
			for (let k = 0; k < 3; k++) band[k] += c.rgb[p * 3 + k];
			nb++;
		} else if (v >= .98) {
			let deep = true;
			for (let dy = -6; dy <= 6 && deep; dy += 2) for (let dx = -6; dx <= 6; dx += 2) {
				const yy = y + dy;
				const xx = x + dx;
				if (yy < 0 || xx < 0 || yy >= c.height || xx >= w || a[yy * w + xx] < .98) {
					deep = false;
					break;
				}
			}
			if (deep) {
				for (let k = 0; k < 3; k++) inside[k] += c.rgb[p * 3 + k];
				ni++;
			}
		}
	}
	if (!nb || !ni) return {
		band: nb ? labOf(band.map((v) => v / nb)) : null,
		inside: ni ? labOf(inside.map((v) => v / ni)) : null,
		difference: null,
		towardBackground: null,
		reading: !nb ? "no soft edge in the region" : "nothing far enough inside the edge to compare with"
	};
	const lb = labOf(band.map((v) => v / nb));
	const li = labOf(inside.map((v) => v / ni));
	const difference = Math.round(Math.hypot(lb.L - li.L, lb.a - li.a, lb.b - li.b) * 10) / 10;
	let toward = null;
	if (background) {
		const lw = labOf(background);
		const dir = [
			lw.L - li.L,
			lw.a - li.a,
			lw.b - li.b
		];
		const d = [
			lb.L - li.L,
			lb.a - li.a,
			lb.b - li.b
		];
		const n2 = dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2;
		toward = n2 > 0 ? Math.round((d[0] * dir[0] + d[1] * dir[1] + d[2] * dir[2]) / n2 * 100) / 100 : null;
	}
	const reading = toward === null ? `The soft edge differs from the colour well inside by ${difference} (CIELAB); give \`background\` (the wall's colour) to read how much of it is the background.` : `The soft edge's colour sits ${Math.round(toward * 100)}% of the way from the colour well inside toward the background (${difference} apart, CIELAB)` + (toward > .25 ? ": background colour left in the edge, which rings the subject over a new background; Decontaminate Edge Colors takes it out." : ".");
	return {
		band: lb,
		inside: li,
		difference,
		towardBackground: toward,
		reading
	};
}
function measureLook(img, args) {
	const minContrast = args.minContrast ?? LOOK_DEFAULTS.minContrast;
	const regions = args.regions.map((r) => {
		const clip = clipRegion(img, r);
		if (!clip) return outside(img, r);
		const c = cropOf(img, clip.rect, LOOK_DEFAULTS.opaque);
		let pixels = 0;
		for (const u of c.use) pixels += u;
		if (!pixels) return {
			name: r.name,
			error: "no opaque pixels in the region"
		};
		const levels = levelsOf(c);
		const colour = labOf(levels.mean);
		const rep = {
			name: r.name,
			role: r.role ?? null,
			rect: clip.rect,
			clipped: clip.clipped,
			pixels,
			levels,
			grain: { spatial: spatialGrain(c) },
			sharpness: edgeWidths(c, minContrast),
			colour
		};
		if (c.alpha) {
			rep.matte = matteEdge(c, minContrast);
			rep.edgeColour = edgeColourOf(c, args.background);
		}
		roleReading(r.name, r.role ?? null, colour, levels, rep);
		return rep;
	});
	const out = { regions };
	if (args.pairs?.length) {
		const byName = new Map(regions.map((r) => [r.name, r]));
		out.pairs = args.pairs.map((p) => {
			const e = byName.get(p.element);
			const pl = byName.get(p.plate);
			if (!e || "error" in e || !pl || "error" in pl) return {
				element: p.element,
				plate: p.plate,
				error: "one side of the pair could not be measured"
			};
			return compareLook(e, pl, {
				grain: args.grainTolerance,
				sharpness: args.sharpnessTolerance
			});
		});
	}
	return out;
}
function summarizeLookSeries(frames, args) {
	const regions = args.regions.map((r) => {
		const per = [];
		for (let i = 1; i < frames.length; i++) {
			const a = frames[i - 1].get(r.name);
			const b = frames[i].get(r.name);
			const t = a && b ? temporalGrain(a, b) : null;
			if (t) per.push(t);
		}
		const temporal = per.length ? [
			0,
			1,
			2
		].map((k) => Math.round(median$2(per.map((p) => p[k])) * 100) / 100) : null;
		const changes = [];
		for (let i = 1; i < frames.length; i++) {
			const a = frames[i - 1].get(r.name)?.alpha;
			const b = frames[i].get(r.name)?.alpha;
			if (!a || !b || a.length !== b.length) continue;
			let sum = 0;
			for (let q = 0; q < a.length; q++) sum += Math.abs(b[q] - a[q]);
			changes.push(sum / a.length);
		}
		const matteChange = changes.length ? Math.round(median$2(changes) * 1e4) / 1e4 : null;
		return {
			name: r.name,
			temporal,
			pairs: per.length,
			matteChange
		};
	});
	const out = { regions };
	if (args.pairs?.length) {
		const by = new Map(regions.map((r) => [r.name, r]));
		out.pairs = args.pairs.map((p) => {
			const et = by.get(p.element)?.temporal;
			const pt = by.get(p.plate)?.temporal;
			const e = et ? Math.round(meanOf(et) * 100) / 100 : null;
			const pl = pt ? Math.round(meanOf(pt) * 100) / 100 : null;
			const readings = [];
			if (e !== null && pl !== null && pl > .3) {
				if (e < pl * .25) readings.push(`${p.element}'s grain does not change from frame to frame and the plate's does (${e} against ${pl} 8-bit steps): animate the grain.`);
				else if (Math.abs(e / pl - 1) > (args.grainTolerance ?? LOOK_DEFAULTS.grainTolerance)) readings.push(`${p.element}'s frame-to-frame grain is ${e} against the plate's ${pl} 8-bit steps.`);
			}
			return {
				element: p.element,
				plate: p.plate,
				element_temporal: e,
				plate_temporal: pl,
				readings
			};
		});
	}
	return out;
}
function lookArgsError(args) {
	const regions = args.regions;
	if (!Array.isArray(regions) || regions.length === 0 || regions.length > 64) return "`look.regions` must list 1 to 64 regions";
	const names = /* @__PURE__ */ new Set();
	for (const r of regions) {
		if (typeof r?.name !== "string" || !r.name) return "every `look.regions` entry needs a name";
		if (names.has(r.name)) return `\`look.regions\` names '${r.name}' twice`;
		names.add(r.name);
		if (typeof r.x !== "number" || typeof r.y !== "number") return `\`look.regions\` '${r.name}' needs x and y`;
		if (r.role !== void 0 && !LOOK_ROLES.includes(r.role)) return `\`look.regions\` '${r.name}' has role '${String(r.role)}'; use ${LOOK_ROLES.join(", ")}`;
	}
	if (args.pairs !== void 0) {
		if (!Array.isArray(args.pairs)) return "`look.pairs` must be a list of { element, plate }";
		for (const p of args.pairs) {
			if (!names.has(String(p?.element))) return `\`look.pairs\` names element '${String(p?.element)}', which is not a region`;
			if (!names.has(String(p?.plate))) return `\`look.pairs\` names plate '${String(p?.plate)}', which is not a region`;
		}
	}
	if (args.background !== void 0 && (!Array.isArray(args.background) || args.background.length !== 3 || !args.background.every((v) => typeof v === "number" && v >= 0 && v <= 1))) return "`look.background` must be [r, g, b], each 0..1";
	for (const k of [
		"minContrast",
		"grainTolerance",
		"sharpnessTolerance"
	]) {
		const v = args[k];
		if (v !== void 0 && (typeof v !== "number" || !(v > 0) || v > 1)) return `\`look.${k}\` must be a number above 0 and at most 1`;
	}
	return null;
}
function gridRegions(width, height) {
	const out = [];
	for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
		const x0 = Math.round(c * width / 3);
		const y0 = Math.round(r * height / 3);
		out.push({
			name: GRID_NAMES[r][c],
			x: x0,
			y: y0,
			width: Math.round((c + 1) * width / 3) - x0,
			height: Math.round((r + 1) * height / 3) - y0
		});
	}
	return out;
}
function frameLevels(img) {
	const BINS = 1024;
	const hist = [
		new Uint32Array(BINS),
		new Uint32Array(BINS),
		new Uint32Array(BINS),
		new Uint32Array(BINS)
	];
	const sum = [
		0,
		0,
		0
	];
	let n = 0;
	for (let y = 0; y < img.height; y += 2) for (let x = 0; x < img.width; x += 2) {
		const p = (y * img.width + x) * 3;
		const px2 = [
			img.rgb[p],
			img.rgb[p + 1],
			img.rgb[p + 2]
		];
		for (let c = 0; c < 3; c++) {
			hist[c][Math.min(1023, Math.max(0, Math.floor(px2[c] * BINS)))]++;
			sum[c] += px2[c];
		}
		hist[3][Math.min(1023, Math.max(0, Math.floor(luma$1(px2) * BINS)))]++;
		n++;
	}
	const pct = (h, q) => {
		const want = q * n;
		let acc = 0;
		for (let b = 0; b < BINS; b++) {
			acc += h[b];
			if (acc >= want) return (b + .5) / BINS;
		}
		return 1;
	};
	const mean = sum.map((v) => v / (n || 1));
	return {
		lumaBlack: pct(hist[3], .005),
		lumaWhite: pct(hist[3], .995),
		lumaMean: luma$1(mean),
		black: [
			0,
			1,
			2
		].map((c) => pct(hist[c], .005)),
		white: [
			0,
			1,
			2
		].map((c) => pct(hist[c], .995))
	};
}
function frameWeight(img) {
	const s = 4;
	let lw = 0;
	let lx = 0;
	let ly = 0;
	let dw = 0;
	let dx = 0;
	let dy = 0;
	const Y = (x, y) => {
		const p = (y * img.width + x) * 3;
		return luma$1([
			img.rgb[p],
			img.rgb[p + 1],
			img.rgb[p + 2]
		]);
	};
	for (let y = 0; y + s < img.height; y += s) for (let x = 0; x + s < img.width; x += s) {
		const v = Y(x, y);
		lw += v;
		lx += v * x;
		ly += v * y;
		const g = Math.abs(Y(x + s, y) - v) + Math.abs(Y(x, y + s) - v);
		dw += g;
		dx += g * x;
		dy += g * y;
	}
	const r3 = (v) => Math.round(v * 1e3) / 1e3;
	return {
		brightness: lw > 0 ? {
			x: r3(lx / lw / img.width),
			y: r3(ly / lw / img.height)
		} : {
			x: .5,
			y: .5
		},
		detail: dw > 0 ? {
			x: r3(dx / dw / img.width),
			y: r3(dy / dw / img.height)
		} : {
			x: .5,
			y: .5
		}
	};
}
function paletteOf(samples, k) {
	if (!samples.length) return [];
	const pts = samples.map((s) => s.lab);
	const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
	const centres = [];
	const mean = [
		0,
		1,
		2
	].map((c) => pts.reduce((s, p) => s + p[c], 0) / pts.length);
	let far = 0;
	for (let i = 1; i < pts.length; i++) if (d2(pts[i], mean) > d2(pts[far], mean)) far = i;
	centres.push(pts[far].slice());
	const near = pts.map((p) => d2(p, centres[0]));
	while (centres.length < k) {
		let f = 0;
		for (let i = 1; i < pts.length; i++) if (near[i] > near[f]) f = i;
		if (near[f] <= 1) break;
		centres.push(pts[f].slice());
		for (let i = 0; i < pts.length; i++) near[i] = Math.min(near[i], d2(pts[i], pts[f]));
	}
	const of = new Int32Array(pts.length);
	for (let round = 0; round < 10; round++) {
		for (let i = 0; i < pts.length; i++) {
			let best = 0;
			for (let c = 1; c < centres.length; c++) if (d2(pts[i], centres[c]) < d2(pts[i], centres[best])) best = c;
			of[i] = best;
		}
		const acc = centres.map(() => [
			0,
			0,
			0,
			0
		]);
		for (let i = 0; i < pts.length; i++) {
			const a = acc[of[i]];
			for (let c = 0; c < 3; c++) a[c] += pts[i][c];
			a[3]++;
		}
		acc.forEach((a, c) => {
			if (a[3]) centres[c] = [
				a[0] / a[3],
				a[1] / a[3],
				a[2] / a[3]
			];
		});
	}
	const rgbAcc = centres.map(() => [
		0,
		0,
		0,
		0
	]);
	for (let i = 0; i < pts.length; i++) {
		const a = rgbAcc[of[i]];
		for (let c = 0; c < 3; c++) a[c] += samples[i].rgb[c];
		a[3]++;
	}
	return rgbAcc.filter((a) => a[3] > 0).map((a) => {
		const rgb = [
			a[0] / a[3],
			a[1] / a[3],
			a[2] / a[3]
		];
		return {
			hex: rgbHex(rgb),
			colour: labOf(rgb),
			share: Math.round(a[3] / pts.length * 1e3) / 1e3
		};
	}).sort((x, y) => y.share - x.share);
}
function referenceReader(opts) {
	const D = REFERENCE_DEFAULTS;
	const nLook = Math.max(1, Math.min(opts.total, opts.lookFrames ?? D.lookFrames));
	const lookIdx = /* @__PURE__ */ new Set();
	for (let i = 0; i < nLook; i++) lookIdx.add(Math.floor(i * opts.total / nLook));
	const cell = opts.motionCell ?? D.motionCell;
	let size = null;
	let regions = [];
	let added = 0;
	const perRegion = /* @__PURE__ */ new Map();
	const levels = [];
	const weights = [];
	const samples = [];
	const pairs = [];
	const pairMaps = [];
	let prev = null;
	function add(f) {
		const img = f.img;
		if (!size) {
			size = [img.width, img.height];
			regions = [...gridRegions(img.width, img.height), ...opts.regions ?? []];
		} else if (img.width !== size[0] || img.height !== size[1]) throw new Error(`frame ${f.frame} is ${img.width}\xD7${img.height}, not ${size[0]}\xD7${size[1]} like the first`);
		if (lookIdx.has(added)) {
			const look = measureLook(img, { regions });
			for (const r of look.regions) {
				if ("error" in r) continue;
				const e = perRegion.get(r.name) ?? {
					mean: [],
					ew: [],
					p90: [],
					grain: [],
					role: r.role
				};
				e.mean.push(r.levels.mean);
				if (r.sharpness.edgeWidth !== null) e.ew.push(r.sharpness.edgeWidth);
				if (r.sharpness.p90 !== null) e.p90.push(r.sharpness.p90);
				e.grain.push((r.grain.spatial[0] + r.grain.spatial[1] + r.grain.spatial[2]) / 3);
				perRegion.set(r.name, e);
			}
			levels.push(frameLevels(img));
			weights.push(frameWeight(img));
			for (let y = 0; y < img.height; y += D.paletteStep) for (let x = 0; x < img.width; x += D.paletteStep) {
				const p = (y * img.width + x) * 3;
				const rgb = [
					img.rgb[p],
					img.rgb[p + 1],
					img.rgb[p + 2]
				];
				const l = labOf(rgb);
				samples.push({
					lab: [
						l.L,
						l.a,
						l.b
					],
					rgb
				});
			}
		}
		const pic = pictureOf(img, false);
		const cells = cellLuma(img, cell);
		if (prev) {
			const ch = pictureChange(prev.pic, pic, img.width, img.height, DIFF_DEFAULTS);
			pairs.push({
				from: {
					index: prev.frame,
					time: prev.time
				},
				to: {
					index: f.frame,
					time: f.time
				},
				change: ch.all.change,
				changedShare: ch.all.changedShare
			});
			const m = new Float32Array(cells.length);
			for (let k = 0; k < m.length; k++) m[k] = Math.abs(cells[k] - prev.cells[k]);
			pairMaps.push(m);
		}
		prev = {
			pic,
			cells,
			frame: f.frame,
			time: f.time
		};
		added++;
	}
	function finish() {
		if (!size) throw new Error("no frames to read");
		const [width, height] = size;
		const avg = (v) => v.reduce((s, x) => s + x, 0) / (v.length || 1);
		const r3 = (v) => Math.round(v * 1e3) / 1e3;
		const r2 = (v) => Math.round(v * 100) / 100;
		const regionReports = [];
		for (const r of regions) {
			const e = perRegion.get(r.name);
			if (!e || !e.mean.length) continue;
			const mean = [
				0,
				1,
				2
			].map((c) => r4$2(avg(e.mean.map((m) => m[c]))));
			const ew = medianOf(e.ew);
			const p90 = medianOf(e.p90);
			regionReports.push({
				name: r.name,
				role: e.role,
				colour: labOf(mean),
				mean,
				sharpness: {
					edgeWidth: ew === null ? null : r2(ew),
					p90: p90 === null ? null : r2(p90)
				},
				grain: r2(avg(e.grain))
			});
		}
		const gridEw = regionReports.slice(0, 9).flatMap((r) => r.sharpness.edgeWidth === null ? [] : [r.sharpness.edgeWidth]);
		const notes = [];
		const neighbours = pairs.length > 0 && pairs.every((q) => q.to.index === q.from.index + 1);
		let spacing = opts.spacing ?? {
			how: "rendered",
			step: neighbours ? 1 : null
		};
		let consecutive = neighbours;
		const medianChange = pairs.length ? median$2(pairs.map((q) => q.change)) : 0;
		const mc = medianChange.toFixed(4);
		const unsure = spacing.how === "assumed" || spacing.how === "file names" && spacing.step === 1;
		if (consecutive && unsure) {
			const said = spacing.how === "file names" ? "The file names count up by one" : "Nothing said how far apart the frames are";
			if (medianChange >= D.spreadGuess) {
				consecutive = false;
				spacing = {
					how: "guessed from change",
					step: null
				};
				notes.push(`${said}, but neighbouring files change by a median of ${mc}, as frames far apart do (${D.spreadGuess} or more), so this guess reads them as spread: cuts and movement are not read. Pass frameStep: 1 if they are neighbours.`);
			} else if (spacing.how === "file names") notes.push(`The frames are neighbours, read from their file names (neighbouring files change by a median of ${mc}).`);
			else notes.push(`Nothing said how far apart the frames are; they were assumed to be neighbours (neighbouring files change by a median of ${mc}, under the ${D.spreadGuess} that spread frames read), so cuts and movement were read. Pass frameStep if they are not.`);
		} else if (pairs.length && !consecutive) {
			const apart = spacing.step ? `${spacing.step} frames apart` : "unevenly spaced";
			notes.push(`The frames are ${apart}, ${spacing.how === "given" ? "as given" : spacing.how === "file names" ? "read from their file names" : "as rendered"}: cuts and movement are not read, and the motion map shows what differs between the frames read, not motion.`);
		}
		const summary = consecutive && pairs.length >= 2 ? summarizeSeries(pairs, DIFF_DEFAULTS) : null;
		const cutPairs = new Set((summary?.flags ?? []).filter((fl) => fl.kind === "cut").flatMap((fl) => fl.pairs));
		const mw = Math.ceil(width / cell);
		const mh = Math.ceil(height / cell);
		const acc = new Float64Array(mw * mh);
		let counted = 0;
		let changeSum = 0;
		pairMaps.forEach((m, i) => {
			if (cutPairs.has(i)) return;
			for (let k = 0; k < acc.length; k++) acc[k] += m[k];
			changeSum += pairs[i].change;
			counted++;
		});
		const meanChange = consecutive && counted ? Math.round(changeSum / counted * 1e6) / 1e6 : null;
		const map = {
			width: mw,
			height: mh,
			cell,
			values: Array.from(acc, (v) => Math.round((counted ? v / counted : 0) * 1e5) / 1e5)
		};
		return {
			frames: added,
			notes,
			size: [width, height],
			frameRate: opts.frameRate ?? null,
			palette: paletteOf(samples, D.paletteColours),
			levels: {
				lumaBlack: r4$2(avg(levels.map((l) => l.lumaBlack))),
				lumaWhite: r4$2(avg(levels.map((l) => l.lumaWhite))),
				lumaMean: r4$2(avg(levels.map((l) => l.lumaMean))),
				black: [
					0,
					1,
					2
				].map((c) => r4$2(avg(levels.map((l) => l.black[c])))),
				white: [
					0,
					1,
					2
				].map((c) => r4$2(avg(levels.map((l) => l.white[c]))))
			},
			regions: regionReports,
			weight: {
				brightness: {
					x: r3(avg(weights.map((w) => w.brightness.x))),
					y: r3(avg(weights.map((w) => w.brightness.y)))
				},
				detail: {
					x: r3(avg(weights.map((w) => w.detail.x))),
					y: r3(avg(weights.map((w) => w.detail.y)))
				}
			},
			sharpness: { edgeWidth: gridEw.length ? r2(median$2(gridEw)) : null },
			grain: r2(avg(regionReports.slice(0, 9).map((r) => r.grain))),
			motion: {
				consecutive,
				spacing,
				spread: !consecutive,
				pairs: pairs.length,
				cuts: [...cutPairs].sort((a, b) => a - b).map((i) => ({
					frame: pairs[i].to.index,
					time: pairs[i].to.time ?? null
				})),
				meanChange,
				map,
				subject: counted ? motionCentre(map) : null
			}
		};
	}
	return {
		add,
		finish
	};
}
function compareReferences(ref, build) {
	const D = REFERENCE_DEFAULTS;
	const out = [];
	const notes = [];
	const f1 = (v) => v.toFixed(1);
	const pctOf = (v) => `${Math.round(v * 100)}%`;
	const list = (items, max = 4) => items.length <= max ? items.join("; ") : `${items.slice(0, max).join("; ")}; and ${items.length - max} more`;
	const byName = new Map(build.regions.map((r) => [r.name, r]));
	const pairsOf = ref.regions.flatMap((r) => byName.has(r.name) ? [[r, byName.get(r.name)]] : []);
	const cast = pairsOf.map(([r, b]) => ({
		name: r.name,
		da: b.colour.a - r.colour.a,
		db: b.colour.b - r.colour.b,
		r,
		b
	})).map((c) => ({
		...c,
		d: Math.hypot(c.da, c.db)
	})).filter((c) => c.d >= D.castStep).sort((x, y) => y.d - x.d);
	if (cast.length) {
		const da = cast.reduce((s, c) => s + c.da, 0) / cast.length;
		const db = cast.reduce((s, c) => s + c.db, 0) / cast.length;
		const words = castWords(da, db) ?? "a different colour";
		out.push({
			measure: "cast",
			size: Math.round(cast[0].d / D.castStep * 10) / 10,
			reading: `The build leans ${words} against the reference in ${cast.length} of ${pairsOf.length} regions (a* ${signed(da)}, b* ${signed(db)} on average, CIELAB): ` + list(cast.map((c) => `${c.name} a* ${f1(c.b.colour.a)} b* ${f1(c.b.colour.b)} against ${f1(c.r.colour.a)} ${f1(c.r.colour.b)}`)) + ".",
			reference: Object.fromEntries(cast.map((c) => [c.name, {
				a: c.r.colour.a,
				b: c.r.colour.b
			}])),
			build: Object.fromEntries(cast.map((c) => [c.name, {
				a: c.b.colour.a,
				b: c.b.colour.b
			}]))
		});
	}
	const light = pairsOf.map(([r, b]) => ({
		name: r.name,
		d: b.colour.L - r.colour.L,
		r,
		b
	})).filter((c) => Math.abs(c.d) >= D.lightnessStep).sort((x, y) => Math.abs(y.d) - Math.abs(x.d));
	if (light.length) out.push({
		measure: "lightness",
		size: Math.round(Math.abs(light[0].d) / D.lightnessStep * 10) / 10,
		reading: `Lightness differs in ${light.length} of ${pairsOf.length} regions: ` + list(light.map((c) => `${c.name} ${c.d < 0 ? "darker" : "lighter"} (L* ${f1(c.b.colour.L)} against ${f1(c.r.colour.L)})`)) + "."
	});
	const ratioItem = (measure, get, more, less, unit) => {
		const rows = pairsOf.map(([r, b]) => ({
			name: r.name,
			rv: get(r),
			bv: get(b)
		})).filter((c) => c.rv !== null && c.bv !== null && c.rv > 0 && c.bv > 0).map((c) => ({
			...c,
			k: Math.log(c.bv / c.rv) / Math.log(D.ratioStep)
		})).filter((c) => Math.abs(c.k) >= 1).sort((x, y) => Math.abs(y.k) - Math.abs(x.k));
		if (!rows.length) return;
		const up = rows.filter((c) => c.k > 0);
		const down = rows.filter((c) => c.k < 0);
		const part = (rs, word) => rs.length ? `${word} in ${list(rs.map((c) => `${c.name} (${c.bv}${unit} against ${c.rv}${unit})`))}` : "";
		out.push({
			measure,
			size: Math.round(Math.abs(rows[0].k) * 10) / 10,
			reading: `The build is ${[part(up, more), part(down, less)].filter(Boolean).join("; and ")}.`
		});
	};
	ratioItem("sharpness", (r) => r.sharpness.edgeWidth, "softer", "sharper", " px");
	ratioItem("grain", (r) => r.grain, "grainier", "smoother (less grain)", "");
	const lv = [];
	let lvMax = 0;
	for (const [k, word] of [
		["lumaBlack", "black point"],
		["lumaWhite", "white point"],
		["lumaMean", "mean level"]
	]) {
		const d = build.levels[k] - ref.levels[k];
		if (Math.abs(d) < D.levelStep) continue;
		lvMax = Math.max(lvMax, Math.abs(d) / D.levelStep);
		lv.push(`${word} ${d > 0 ? "higher" : "lower"} (${build.levels[k].toFixed(3)} against ${ref.levels[k].toFixed(3)})`);
	}
	if (lv.length) out.push({
		measure: "levels",
		size: Math.round(lvMax * 10) / 10,
		reading: `Levels: ${lv.join("; ")}.`
	});
	let subject = null;
	if (ref.motion.subject && build.motion.subject) {
		const reg = registerMotionMaps(ref.motion.map, build.motion.map);
		if (reg) {
			const compared = reg.correlation >= D.sameFootage;
			subject = {
				...reg,
				compared
			};
			const spreadSides = [ref, build].filter((r) => r.motion.spread);
			if (compared && spreadSides.length) notes.push(`The subject's size and place rest on spread frames (what differs between frames ${[...new Set(spreadSides.map((r) => r.motion.spacing.step ? `${r.motion.spacing.step} apart` : "spaced unknown or unevenly"))].join(" and ")}${spreadSides.length === 2 ? " on both sides" : ` on the ${spreadSides[0] === ref ? "reference's" : "build's"} side`}, not motion), lined up at correlation ${reg.correlation}. Trusted from ${D.sameFootage}: on the round-two pair, every frame read 0.93 and 80 to 81%, every twentieth 0.68 to 0.71 and 81 to 82%.`);
			if (!compared) notes.push(`The moving parts of the two do not line up (correlation ${reg.correlation}): not the same footage, or not framed alike, so the subject's size and place are not compared.`);
			else {
				const k = Math.log(reg.scale) / Math.log(1 + D.sizeStep);
				if (Math.abs(k) >= 1) out.push({
					measure: "subject size",
					size: Math.round(Math.abs(k) * 10) / 10,
					reading: `The moving subject is ${pctOf(reg.scale)} of its size in the reference: ${reg.scale < 1 ? "smaller" : "larger"} in frame (the two lined up at correlation ${reg.correlation}).`,
					reference: 1,
					build: reg.scale
				});
				const dx = reg.to.x - reg.from.x;
				const dy = reg.to.y - reg.from.y;
				const dist = Math.hypot(dx, dy);
				if (dist >= D.placeStep) out.push({
					measure: "subject place",
					size: Math.round(dist / D.placeStep * 10) / 10,
					reading: `The moving subject sits ${[Math.abs(dy) >= D.placeStep / 2 ? `${pctOf(Math.abs(dy))} of the height ${dy > 0 ? "lower" : "higher"}` : "", Math.abs(dx) >= D.placeStep / 2 ? `${pctOf(Math.abs(dx))} of the width ${dx > 0 ? "right" : "left"}` : ""].filter(Boolean).join(" and ")} than in the reference.`
				});
			}
		}
	} else if (ref.motion.subject || build.motion.subject) notes.push("Only one of the two has motion to read, so the subject is not compared.");
	for (const [k, word] of [["brightness", "brightness"], ["detail", "detail"]]) {
		const dx = build.weight[k].x - ref.weight[k].x;
		const dy = build.weight[k].y - ref.weight[k].y;
		const dist = Math.hypot(dx, dy);
		if (dist >= D.placeStep) out.push({
			measure: `weight of ${word}`,
			size: Math.round(dist / D.placeStep * 10) / 10,
			reading: `The centre of ${word} sits at ${pctOf(build.weight[k].x)} across, ${pctOf(build.weight[k].y)} down, against ${pctOf(ref.weight[k].x)}, ${pctOf(ref.weight[k].y)} in the reference.`
		});
	}
	const missing = ref.palette.filter((c) => c.share >= D.shareStep).map((c) => {
		let best = Infinity;
		for (const b of build.palette) best = Math.min(best, Math.hypot(b.colour.L - c.colour.L, b.colour.a - c.colour.a, b.colour.b - c.colour.b));
		return {
			c,
			best
		};
	}).filter((m) => m.best >= D.colourMatch);
	if (missing.length) out.push({
		measure: "main colours",
		size: Math.round(Math.max(...missing.map((m) => m.best)) / D.colourMatch * 10) / 10,
		reading: `Main colours of the reference with nothing within ${D.colourMatch} (CIELAB) among the build's: ${list(missing.map((m) => `${m.c.hex} (${pctOf(m.c.share)} of the reference, nearest ${f1(m.best)} away)`))}.`
	});
	if (ref.motion.consecutive && build.motion.consecutive) {
		const has = (cuts, f) => cuts.some((c) => Math.abs(c.frame - f) <= 1);
		const lost = ref.motion.cuts.filter((c) => !has(build.motion.cuts, c.frame));
		const extra = build.motion.cuts.filter((c) => !has(ref.motion.cuts, c.frame));
		if (lost.length || extra.length) out.push({
			measure: "cuts",
			size: 3 * (lost.length + extra.length),
			reading: [lost.length ? `The reference cuts at ${lost.map((c) => `frame ${c.frame}`).join(", ")}; the build does not.` : "", extra.length ? `The build cuts at ${extra.map((c) => `frame ${c.frame}`).join(", ")}; the reference does not.` : ""].filter(Boolean).join(" ")
		});
		const rm = ref.motion.meanChange;
		const bm = build.motion.meanChange;
		if (rm && bm) {
			const k = Math.log(bm / rm) / Math.log(D.ratioStep);
			if (Math.abs(k) >= 1) out.push({
				measure: "motion",
				size: Math.round(Math.abs(k) * 10) / 10,
				reading: `The build's picture moves ${k > 0 ? "more" : "less"} between frames: mean change ${bm.toFixed(4)} against ${rm.toFixed(4)}.`
			});
		}
	} else notes.push(`Cuts and movement are not read on frames that are not neighbours (${[!ref.motion.consecutive ? "the reference's" : "", !build.motion.consecutive ? "the build's" : ""].filter(Boolean).join(" and ")}), so they are not compared.`);
	out.sort((a, b) => b.size - a.size);
	return {
		differences: out,
		subject,
		notes,
		reading: out.length ? `${out.length} difference${out.length > 1 ? "s" : ""}, largest first. ${out.slice(0, 3).map((d) => d.reading).join(" ")}` : "No difference over its step between the build and the reference."
	};
}
var TOL, CHECKERBOARD, r4$2, r4rgb$2, GLYPHS, GLYPH_W, FONT_SCALE, LABEL_H, LOOK_ROLES, LOOK_DEFAULTS, srgbToLinear, labF, luma$1, MAD_TO_SD, robustSd, steps, signed, meanOf, REFERENCE_DEFAULTS, GRID_NAMES, medianOf;
function init_sheet() {
	return (init_sheet = __esmMin((() => {
		init_motion();
		TOL = 2 / 255;
		CHECKERBOARD = {
			size: 16,
			light: [
				.8,
				.8,
				.8
			],
			dark: [
				.6,
				.6,
				.6
			]
		};
		r4$2 = (v) => Math.round(v * 1e4) / 1e4;
		r4rgb$2 = (v) => [
			r4$2(v[0]),
			r4$2(v[1]),
			r4$2(v[2])
		];
		GLYPHS = {
			"0": [
				".###.",
				"#...#",
				"#..##",
				"#.#.#",
				"##..#",
				"#...#",
				".###."
			],
			"1": [
				"..#..",
				".##..",
				"..#..",
				"..#..",
				"..#..",
				"..#..",
				".###."
			],
			"2": [
				".###.",
				"#...#",
				"....#",
				"...#.",
				"..#..",
				".#...",
				"#####"
			],
			"3": [
				"#####",
				"...#.",
				"..#..",
				"...#.",
				"....#",
				"#...#",
				".###."
			],
			"4": [
				"...#.",
				"..##.",
				".#.#.",
				"#..#.",
				"#####",
				"...#.",
				"...#."
			],
			"5": [
				"#####",
				"#....",
				"####.",
				"....#",
				"....#",
				"#...#",
				".###."
			],
			"6": [
				"..##.",
				".#...",
				"#....",
				"####.",
				"#...#",
				"#...#",
				".###."
			],
			"7": [
				"#####",
				"....#",
				"...#.",
				"..#..",
				".#...",
				".#...",
				".#..."
			],
			"8": [
				".###.",
				"#...#",
				"#...#",
				".###.",
				"#...#",
				"#...#",
				".###."
			],
			"9": [
				".###.",
				"#...#",
				"#...#",
				".####",
				"....#",
				"...#.",
				".##.."
			],
			".": [
				".....",
				".....",
				".....",
				".....",
				".....",
				".##..",
				".##.."
			],
			":": [
				".....",
				".##..",
				".##..",
				".....",
				".##..",
				".##..",
				"....."
			],
			"-": [
				".....",
				".....",
				".....",
				"#####",
				".....",
				".....",
				"....."
			],
			">": [
				".#...",
				"..#..",
				"...#.",
				"....#",
				"...#.",
				"..#..",
				".#..."
			],
			x: [
				".....",
				".....",
				"#...#",
				".#.#.",
				"..#..",
				".#.#.",
				"#...#"
			],
			"!": [
				"..#..",
				"..#..",
				"..#..",
				"..#..",
				"..#..",
				".....",
				"..#.."
			],
			"#": [
				".#.#.",
				".#.#.",
				"#####",
				".#.#.",
				"#####",
				".#.#.",
				".#.#."
			],
			s: [
				".....",
				".....",
				".####",
				"#....",
				".###.",
				"....#",
				"####."
			],
			f: [
				"..##.",
				".#...",
				"###..",
				".#...",
				".#...",
				".#...",
				".#..."
			],
			a: [
				".....",
				".....",
				".###.",
				"....#",
				".####",
				"#...#",
				".####"
			],
			b: [
				"#....",
				"#....",
				"####.",
				"#...#",
				"#...#",
				"#...#",
				"####."
			],
			c: [
				".....",
				".....",
				".###.",
				"#....",
				"#....",
				"#...#",
				".###."
			],
			d: [
				"....#",
				"....#",
				".####",
				"#...#",
				"#...#",
				"#...#",
				".####"
			],
			e: [
				".....",
				".....",
				".###.",
				"#...#",
				"#####",
				"#....",
				".###."
			],
			g: [
				".....",
				".....",
				".####",
				"#...#",
				"#...#",
				"#...#",
				".####",
				"....#",
				".###."
			],
			h: [
				"#....",
				"#....",
				"####.",
				"#...#",
				"#...#",
				"#...#",
				"#...#"
			],
			i: [
				"..#..",
				".....",
				".##..",
				"..#..",
				"..#..",
				"..#..",
				".###."
			],
			j: [
				"...#.",
				".....",
				"..##.",
				"...#.",
				"...#.",
				"...#.",
				"...#.",
				"#..#.",
				".##.."
			],
			k: [
				"#....",
				"#....",
				"#..#.",
				"#.#..",
				"##...",
				"#.#..",
				"#..#."
			],
			l: [
				".##..",
				"..#..",
				"..#..",
				"..#..",
				"..#..",
				"..#..",
				".###."
			],
			m: [
				".....",
				".....",
				"##.#.",
				"#.#.#",
				"#.#.#",
				"#...#",
				"#...#"
			],
			n: [
				".....",
				".....",
				"####.",
				"#...#",
				"#...#",
				"#...#",
				"#...#"
			],
			o: [
				".....",
				".....",
				".###.",
				"#...#",
				"#...#",
				"#...#",
				".###."
			],
			p: [
				".....",
				".....",
				"####.",
				"#...#",
				"#...#",
				"#...#",
				"####.",
				"#....",
				"#...."
			],
			q: [
				".....",
				".....",
				".####",
				"#...#",
				"#...#",
				"#...#",
				".####",
				"....#",
				"....#"
			],
			r: [
				".....",
				".....",
				"#.##.",
				"##..#",
				"#....",
				"#....",
				"#...."
			],
			t: [
				".#...",
				".#...",
				"###..",
				".#...",
				".#...",
				".#..#",
				"..##."
			],
			u: [
				".....",
				".....",
				"#...#",
				"#...#",
				"#...#",
				"#..##",
				".##.#"
			],
			v: [
				".....",
				".....",
				"#...#",
				"#...#",
				"#...#",
				".#.#.",
				"..#.."
			],
			w: [
				".....",
				".....",
				"#...#",
				"#...#",
				"#.#.#",
				"#.#.#",
				".#.#."
			],
			y: [
				".....",
				".....",
				"#...#",
				"#...#",
				"#...#",
				"#...#",
				".####",
				"....#",
				".###."
			],
			z: [
				".....",
				".....",
				"#####",
				"...#.",
				"..#..",
				".#...",
				"#####"
			],
			"+": [
				".....",
				"..#..",
				"..#..",
				"#####",
				"..#..",
				"..#..",
				"....."
			],
			" ": [
				".....",
				".....",
				".....",
				".....",
				".....",
				".....",
				"....."
			]
		};
		GLYPH_W = 5;
		FONT_SCALE = 2;
		LABEL_H = 20;
		LOOK_ROLES = [
			"neutral",
			"skin",
			"plate",
			"element"
		];
		LOOK_DEFAULTS = {
			minContrast: .1,
			grainTolerance: .25,
			sharpnessTolerance: .25,
			levelTolerance: .02,
			castAbove: 2,
			/** Pixels at or above this alpha count as the element when the frame has alpha. */
			opaque: .98,
			/** Half-length of the profile read across an edge, px: edges up to about 10 px wide (sigma 4). */
			edgeReach: 12,
			/** Profiles are the mean of this many neighbouring lines. */
			edgeLines: 5,
			/** Skin hue angle (CIELAB h, degrees) commonly reported for skin of many tones under neutral light. */
			skinHue: [40, 65]
		};
		srgbToLinear = (c) => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
		labF = (t) => t > (6 / 29) ** 3 ? Math.cbrt(t) : t / (3 * (6 / 29) ** 2) + 4 / 29;
		luma$1 = (c) => .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
		MAD_TO_SD = 1.4826;
		robustSd = (v) => {
			const m = median$2(v);
			const band = Math.max(4 * MAD_TO_SD * median$2(v.map((x) => Math.abs(x - m))), 3 / 255);
			let n = 0;
			let sum = 0;
			let sq = 0;
			for (const x of v) if (Math.abs(x - m) <= band) {
				n++;
				sum += x;
				sq += x * x;
			}
			if (n < 2) return 0;
			const mean = sum / n;
			return Math.sqrt(Math.max(0, sq / n - mean * mean));
		};
		steps = (v) => Math.round(v * 255 * 100) / 100;
		signed = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;
		meanOf = (v) => v.reduce((s, x) => s + x, 0) / v.length;
		REFERENCE_DEFAULTS = {
			grid: 3,
			paletteColours: 6,
			/** Every this many pixels across and down go into the main colours. */
			paletteStep: 6,
			/** Frames spread over the input that colour, levels, sharpness and grain are read on. */
			lookFrames: 24,
			/** Cell of the motion map, px. */
			motionCell: 16,
			castStep: 2,
			lightnessStep: 3,
			levelStep: .02,
			ratioStep: 1.25,
			sizeStep: .05,
			placeStep: .03,
			sameFootage: .6,
			shareStep: .05,
			/** A colour of the reference with no colour of the build within this (CIELAB) is missing. */
			colourMatch: 10,
			/**
			* With nothing saying how far apart a folder's frames are: a median change
			* between neighbouring files of this or more reads as frames far apart. On
			* the round-two movies, every twentieth frame read medians of 0.026 and
			* 0.029; every frame 0.007 (largest pair 0.029, a cut 0.088).
			*/
			spreadGuess: .02
		};
		GRID_NAMES = [
			[
				"top left",
				"top",
				"top right"
			],
			[
				"left",
				"middle",
				"right"
			],
			[
				"bottom left",
				"bottom",
				"bottom right"
			]
		];
		medianOf = (v) => v.length ? median$2(v) : null;
	})))();
}

// color/matte.js
function autoMaxEdgeWidth(width, height) {
	return Math.max(4, Math.round(.01 * Math.min(width, height)));
}
function resolveEdgeThresholds(args, width, height) {
	const maxEdgeWidth = args.maxEdgeWidth ?? autoMaxEdgeWidth(width, height);
	return {
		from: args.from ?? EDGE_DEFAULTS.from,
		transparent: args.transparent ?? EDGE_DEFAULTS.transparent,
		opaque: args.opaque ?? EDGE_DEFAULTS.opaque,
		maxEdgeWidth,
		mainAreaShare: args.mainAreaShare ?? EDGE_DEFAULTS.mainAreaShare,
		listed: args.listed ?? EDGE_DEFAULTS.listed,
		screen: args.screen ?? EDGE_DEFAULTS.screen,
		spillMinAlpha: args.spillMinAlpha ?? EDGE_DEFAULTS.spillMinAlpha,
		spillThreshold: args.spillThreshold ?? EDGE_DEFAULTS.spillThreshold,
		changeAbove: args.changeAbove ?? EDGE_DEFAULTS.changeAbove,
		patchWindow: args.patchWindow ?? Math.round(4 * maxEdgeWidth)
	};
}
function edgeArgsError(args) {
	for (const key of [
		"transparent",
		"opaque",
		"mainAreaShare",
		"spillMinAlpha",
		"changeAbove"
	]) {
		const v = args[key];
		if (v !== void 0 && (typeof v !== "number" || !(v >= 0 && v <= 1))) return `\`edge.${key}\` must be a number in 0..1`;
	}
	if ((args.transparent ?? EDGE_DEFAULTS.transparent) >= (args.opaque ?? EDGE_DEFAULTS.opaque)) return "`edge.transparent` must be below `edge.opaque`";
	const w = args.maxEdgeWidth;
	if (w !== void 0 && (typeof w !== "number" || !Number.isFinite(w) || w < 1)) return "`edge.maxEdgeWidth` must be at least 1 (pixels)";
	const pw = args.patchWindow;
	if (pw !== void 0 && (typeof pw !== "number" || !Number.isFinite(pw) || pw < 1)) return "`edge.patchWindow` must be at least 1 (pixels)";
	const listed = args.listed;
	if (listed !== void 0 && (!Number.isInteger(listed) || listed < 0)) return "`edge.listed` must be a whole number, 0 or more";
	const s = args.spillThreshold;
	if (s !== void 0 && (typeof s !== "number" || !(s >= 0 && s <= 1))) return "`edge.spillThreshold` must be a number in 0..1";
	if (args.from !== void 0 && args.from !== "alpha" && args.from !== "luma") return "`edge.from` must be 'alpha' or 'luma'";
	if (args.screen !== void 0 && args.screen !== "green" && args.screen !== "blue") return "`edge.screen` must be 'green' or 'blue'";
	return null;
}
function dt1d(f, n, d, v, z) {
	let k = -1;
	for (let q = 0; q < n; q++) {
		const fq = f[q];
		if (fq >= INF) continue;
		if (k < 0) {
			k = 0;
			v[0] = q;
			z[0] = -Infinity;
			z[1] = Infinity;
			continue;
		}
		let s = 0;
		for (;;) {
			const r = v[k];
			s = (fq + q * q - (f[r] + r * r)) / (2 * q - 2 * r);
			if (s <= z[k]) k--;
			else break;
		}
		k++;
		v[k] = q;
		z[k] = s;
		z[k + 1] = Infinity;
	}
	if (k < 0) {
		d.fill(INF, 0, n);
		return;
	}
	let j = 0;
	for (let q = 0; q < n; q++) {
		while (z[j + 1] < q) j++;
		const r = v[j];
		d[q] = (q - r) * (q - r) + f[r];
	}
}
function distanceTo(alpha, width, height, isSource, scratch, out) {
	const n = Math.max(width, height);
	const f = new Float64Array(n);
	const d = new Float64Array(n);
	const v = new Int32Array(n);
	const z = new Float64Array(n + 1);
	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) f[y] = isSource(alpha[y * width + x]) ? 0 : INF;
		dt1d(f, height, d, v, z);
		for (let y = 0; y < height; y++) scratch[y * width + x] = d[y];
	}
	for (let y = 0; y < height; y++) {
		const row = y * width;
		for (let x = 0; x < width; x++) f[x] = scratch[row + x];
		dt1d(f, width, d, v, z);
		for (let x = 0; x < width; x++) out[row + x] = d[x] >= INF / 2 ? Infinity : Math.sqrt(d[x]);
	}
}
function addPixel(r, x, y, a) {
	r.area++;
	if (x < r.minX) r.minX = x;
	if (x > r.maxX) r.maxX = x;
	if (y < r.minY) r.minY = y;
	if (y > r.maxY) r.maxY = y;
	r.alphaSum += a;
	if (a > r.alphaMax) r.alphaMax = a;
}
function labelRegions(alpha, width, height, inSet, eight, labels, queue, transparentAt) {
	labels.fill(0);
	const regions = [];
	const nx = eight ? N8X : N4X;
	const ny = eight ? N8Y : N4Y;
	const total = width * height;
	for (let start = 0; start < total; start++) {
		if (labels[start] !== 0 || !inSet(start)) continue;
		const region = newRegion();
		regions.push(region);
		const id = regions.length;
		labels[start] = id;
		let head = 0;
		let tail = 0;
		queue[tail++] = start;
		while (head < tail) {
			const p = queue[head++];
			const x = p % width;
			const y = (p - x) / width;
			const a = alpha[p];
			addPixel(region, x, y, a);
			if (a <= transparentAt) region.transparent++;
			if (x === 0 || y === 0 || x === width - 1 || y === height - 1) region.touchesBorder = true;
			for (let k = 0; k < nx.length; k++) {
				const qx = x + nx[k];
				const qy = y + ny[k];
				if (qx < 0 || qy < 0 || qx >= width || qy >= height) continue;
				const q = qy * width + qx;
				if (labels[q] !== 0 || !inSet(q)) continue;
				labels[q] = id;
				queue[tail++] = q;
			}
		}
	}
	return regions;
}
function screenExcess(c, screen) {
	return screen === "green" ? c[1] - Math.max(c[0], c[2]) : c[2] - Math.max(c[0], c[1]);
}
function lumaMatte(img) {
	const n = img.width * img.height;
	const out = new Float64Array(n);
	const rgb = img.rgb;
	for (let p = 0; p < n; p++) {
		const r = rgb[p * 3];
		const g = rgb[p * 3 + 1];
		const b = rgb[p * 3 + 2];
		const y = r === g && g === b ? r : .2126 * r + .7152 * g + .0722 * b;
		out[p] = y < 0 ? 0 : y > 1 ? 1 : y;
	}
	return out;
}
function measureEdge(img, bg, t) {
	const fromLuma = t.from === "luma";
	const alpha = fromLuma ? lumaMatte(img) : img.alpha;
	if (!alpha) throw new Error("the capture has no alpha channel");
	const { width, height } = img;
	const n = width * height;
	const isT = (a) => a <= t.transparent;
	const isO = (a) => a >= t.opaque;
	let opaque = 0;
	let transparent = 0;
	for (let p = 0; p < n; p++) if (isO(alpha[p])) opaque++;
	else if (isT(alpha[p])) transparent++;
	const scratch = new Float32Array(n);
	const dT = new Float32Array(n);
	const dO = new Float32Array(n);
	distanceTo(alpha, width, height, isT, scratch, dT);
	distanceTo(alpha, width, height, isO, scratch, dO);
	const labels = new Int32Array(n);
	const queue = new Int32Array(n);
	const islands = labelRegions(alpha, width, height, (p) => alpha[p] > t.transparent, true, labels, queue, t.transparent);
	const largest = islands.reduce((m2, r) => Math.max(m2, r.area), 0);
	const isMain = islands.map((r) => r.area > 0 && r.area >= t.mainAreaShare * largest);
	const mains = islands.filter((_, i) => isMain[i]).sort(byArea);
	const specks = islands.filter((_, i) => !isMain[i]).sort(byArea);
	const widths = [];
	let unmeasured = 0;
	let worst = -1;
	let worstAt = null;
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		const p = y * width + x;
		if (alpha[p] < .5 || labels[p] === 0 || !isMain[labels[p] - 1]) continue;
		let onContour = false;
		for (let k = 0; k < 4 && !onContour; k++) {
			const qx = x + N4X[k];
			const qy = y + N4Y[k];
			if (qx < 0 || qy < 0 || qx >= width || qy >= height) continue;
			if (alpha[qy * width + qx] < .5) onContour = true;
		}
		if (!onContour) continue;
		const sum = dT[p] + dO[p];
		if (!Number.isFinite(sum)) {
			unmeasured++;
			continue;
		}
		const w = Math.max(0, sum - 1);
		widths.push(w);
		if (w > worst) {
			worst = w;
			worstAt = {
				x,
				y
			};
		}
	}
	widths.sort((a, b) => a - b);
	const m = widths.length;
	const median2 = m === 0 ? null : m % 2 ? widths[(m - 1) / 2] : (widths[m / 2 - 1] + widths[m / 2]) / 2;
	const holes = labelRegions(alpha, width, height, (p) => alpha[p] < t.opaque, false, labels, queue, t.transparent).filter((r) => !r.touchesBorder).sort(byArea);
	const half = t.maxEdgeWidth / 2;
	const isPartial = (p) => alpha[p] > t.transparent && alpha[p] < t.opaque;
	const isCore = (p) => isPartial(p) && Math.min(dT[p], dO[p]) > half;
	labels.fill(0);
	let tail = 0;
	let ids = 0;
	for (let start = 0; start < n; start++) {
		if (labels[start] !== 0 || !isCore(start)) continue;
		ids++;
		labels[start] = ids;
		let head = tail;
		queue[tail++] = start;
		while (head < tail) {
			const p = queue[head++];
			const x = p % width;
			const y = (p - x) / width;
			for (let k = 0; k < 8; k++) {
				const qx = x + N8X[k];
				const qy = y + N8Y[k];
				if (qx < 0 || qy < 0 || qx >= width || qy >= height) continue;
				const q = qy * width + qx;
				if (labels[q] !== 0 || !isCore(q)) continue;
				labels[q] = ids;
				queue[tail++] = q;
			}
		}
	}
	let levelStart = 0;
	let levelEnd = tail;
	for (let step = 0; step < Math.ceil(half) && levelStart < levelEnd; step++) {
		for (let i = levelStart; i < levelEnd; i++) {
			const p = queue[i];
			const x = p % width;
			const y = (p - x) / width;
			for (let k = 0; k < 8; k++) {
				const qx = x + N8X[k];
				const qy = y + N8Y[k];
				if (qx < 0 || qy < 0 || qx >= width || qy >= height) continue;
				const q = qy * width + qx;
				if (labels[q] !== 0 || !isPartial(q)) continue;
				labels[q] = labels[p];
				queue[tail++] = q;
			}
		}
		levelStart = levelEnd;
		levelEnd = tail;
	}
	const patchRegions = Array.from({ length: ids }, newRegion);
	for (let i = 0; i < tail; i++) {
		const p = queue[i];
		const x = p % width;
		addPixel(patchRegions[labels[p] - 1], x, (p - x) / width, alpha[p]);
	}
	const patchId = new Map(patchRegions.map((r, i) => [r, i + 1]));
	patchRegions.sort(byArea);
	const patchList = patchRegions.slice(0, t.listed).map((r) => patchEntry(r, patchId.get(r), labels, alpha, dT, dO, width, t.patchWindow));
	const edgeSum = [
		0,
		0,
		0
	];
	const solidSum = [
		0,
		0,
		0
	];
	let edgeCount = 0;
	let solidCount = 0;
	const zones = new Uint8Array(n);
	const M = t.maxEdgeWidth;
	for (let p = 0; p < n; p++) {
		const a = alpha[p];
		zones[p] = dT[p] <= M && dO[p] <= M ? EDGE : a >= .5 ? INSIDE : OUTSIDE;
		const partial = a > t.transparent && a < t.opaque;
		const solid = a >= t.opaque && dT[p] <= M;
		if (fromLuma || !(partial && a >= t.spillMinAlpha) && !solid) continue;
		const sum = solid ? solidSum : edgeSum;
		for (let c = 0; c < 3; c++) {
			const v = img.rgb[p * 3 + c];
			sum[c] += a >= 1 ? v : Math.min(1, Math.max(0, (v - bg[c] * (1 - a)) / a));
		}
		if (solid) solidCount++;
		else edgeCount++;
	}
	const meanOf = (s, k) => k === 0 ? null : [
		s[0] / k,
		s[1] / k,
		s[2] / k
	];
	const edgeMean = meanOf(edgeSum, edgeCount);
	const solidMean = meanOf(solidSum, solidCount);
	const excess = edgeMean ? screenExcess(edgeMean, t.screen) : null;
	const solidExcess = solidMean ? screenExcess(solidMean, t.screen) : null;
	const leans = excess !== null && excess > t.spillThreshold && (solidExcess === null || excess - solidExcess > t.spillThreshold);
	return {
		report: {
			stage: "capture",
			matteFrom: t.from,
			pixels: n,
			shares: {
				opaque: r4$1(opaque / n),
				partial: r4$1((n - opaque - transparent) / n),
				transparent: r4$1(transparent / n)
			},
			width: {
				typical: median2 === null ? null : r2(median2),
				p90: m === 0 ? null : r2(widths[Math.floor(.9 * (m - 1))]),
				worst: m === 0 ? null : r2(worst),
				worstAt,
				samples: m,
				unmeasured
			},
			solidAreas: {
				count: mains.length,
				list: mains.slice(0, t.listed).map((r) => ({
					...box(r),
					area: r.area
				}))
			},
			holes: {
				count: holes.length,
				area: holes.reduce((s, r) => s + r.area, 0),
				transparentArea: holes.reduce((s, r) => s + r.transparent, 0),
				largest: holes.length ? holeEntry(holes[0]) : null,
				list: holes.slice(0, t.listed).map(holeEntry)
			},
			specks: {
				count: specks.length,
				area: specks.reduce((s, r) => s + r.area, 0),
				list: specks.slice(0, t.listed).map((r) => ({
					...box(r),
					area: r.area,
					meanAlpha: r4$1(r.alphaSum / r.area),
					maxAlpha: r4$1(r.alphaMax)
				}))
			},
			patches: {
				count: patchRegions.length,
				area: patchRegions.reduce((s, r) => s + r.area, 0),
				list: patchList
			},
			spill: {
				screen: t.screen,
				pixels: edgeCount,
				mean: edgeMean ? r4rgb$1(edgeMean) : null,
				solidMean: solidMean ? r4rgb$1(solidMean) : null,
				excess: excess === null ? null : r4$1(excess),
				solidExcess: solidExcess === null ? null : r4$1(solidExcess),
				leansToScreen: leans,
				reading: fromLuma ? "not read: the matte came from luminance (a Keylight matte view), which carries no subject colour; read spill on the keyed result with `from: 'alpha'`" : spillReading(t, edgeCount, excess, solidExcess, leans)
			}
		},
		frame: {
			width,
			height,
			alpha: Float32Array.from(alpha),
			zones
		}
	};
}
function holeEntry(r) {
	return {
		...box(r),
		area: r.area,
		meanAlpha: r4$1(r.alphaSum / r.area)
	};
}
function patchEntry(r, id, labels, alpha, dT, dO, width, window) {
	const b = box(r);
	let depth = -1;
	let at = {
		x: b.x,
		y: b.y
	};
	let thickness = 0;
	for (let y = b.y; y < b.y + b.height; y++) for (let x = b.x; x < b.x + b.width; x++) {
		const p = y * width + x;
		if (labels[p] !== id) continue;
		const m = Math.min(dT[p], dO[p]);
		if (m > depth) {
			depth = m;
			at = {
				x,
				y
			};
			thickness = Number.isFinite(dT[p]) && Number.isFinite(dO[p]) ? dT[p] + dO[p] - 1 : 2 * m - 1;
		}
	}
	const bw = b.width;
	const bh = b.height;
	const ww = Math.max(1, Math.min(Math.round(window), bw));
	const wh = Math.max(1, Math.min(Math.round(window), bh));
	const sc = new Float64Array((bw + 1) * (bh + 1));
	const sa = new Float64Array((bw + 1) * (bh + 1));
	const W = bw + 1;
	for (let j = 0; j < bh; j++) {
		let rowC = 0;
		let rowA = 0;
		for (let i = 0; i < bw; i++) {
			const p = (b.y + j) * width + (b.x + i);
			if (labels[p] === id) {
				rowC++;
				rowA += alpha[p];
			}
			sc[(j + 1) * W + i + 1] = sc[j * W + i + 1] + rowC;
			sa[(j + 1) * W + i + 1] = sa[j * W + i + 1] + rowA;
		}
	}
	const rect = (s, i, j) => s[(j + wh) * W + i + ww] - s[j * W + i + ww] - s[(j + wh) * W + i] + s[j * W + i];
	let bestC = -1;
	let bestA = 0;
	let bi = 0;
	let bj = 0;
	for (let j = 0; j + wh <= bh; j++) for (let i = 0; i + ww <= bw; i++) {
		const c = rect(sc, i, j);
		if (c > bestC) {
			bestC = c;
			bestA = rect(sa, i, j);
			bi = i;
			bj = j;
		}
	}
	return {
		...b,
		area: r.area,
		meanAlpha: r4$1(r.alphaSum / r.area),
		thickest: {
			...at,
			thickness: r2(Math.max(0, thickness))
		},
		densest: {
			x: b.x + bi,
			y: b.y + bj,
			width: ww,
			height: wh,
			pixels: bestC,
			share: r4$1(bestC / (ww * wh)),
			meanAlpha: bestC > 0 ? r4$1(bestA / bestC) : 0
		}
	};
}
function spillReading(t, pixels, excess, solidExcess, leans) {
	const other = t.screen === "green" ? "red and blue" : "red and green";
	if (pixels === 0 || excess === null) return `no partly transparent pixels at or above alpha ${t.spillMinAlpha} to read a colour from`;
	const lean = `its ${t.screen} exceeds the larger of ${other} by ${excess.toFixed(3)}`;
	const versus = solidExcess === null ? "" : `; the solid area just inside the edge: ${solidExcess.toFixed(3)}`;
	return leans ? `the soft edge leans ${t.screen} (likely spill): ${lean}${versus}` : `the soft edge does not lean ${t.screen} beyond the subject's own colour: ${lean}${versus}`;
}
function finishZone(z) {
	return {
		pixels: z.pixels,
		meanAbsDelta: z.pixels ? r4$1(z.sum / z.pixels) : 0,
		maxAbsDelta: r4$1(z.max),
		changedShare: z.pixels ? r4$1(z.changed / z.pixels) : 0,
		changedBounds: z.changed === 0 ? null : {
			x: z.minX,
			y: z.minY,
			width: z.maxX - z.minX + 1,
			height: z.maxY - z.minY + 1
		}
	};
}
function alphaChange(prev, cur, t) {
	if (prev.width !== cur.width || prev.height !== cur.height) throw new Error(`cannot compare frames of different size (${prev.width}\xD7${prev.height} vs ${cur.width}\xD7${cur.height})`);
	const { width } = cur;
	const acc = [
		zoneAcc(),
		zoneAcc(),
		zoneAcc()
	];
	const all = zoneAcc();
	const n = width * cur.height;
	for (let p = 0; p < n; p++) {
		const zp = prev.zones[p];
		const zc = cur.zones[p];
		const zone = zp === INSIDE || zc === INSIDE ? INSIDE : zp === OUTSIDE || zc === OUTSIDE ? OUTSIDE : EDGE;
		const d = Math.abs(cur.alpha[p] - prev.alpha[p]);
		for (const z of [acc[zone], all]) {
			z.pixels++;
			z.sum += d;
			if (d > z.max) z.max = d;
			if (d > t.changeAbove) {
				z.changed++;
				const x = p % width;
				const y = (p - x) / width;
				if (x < z.minX) z.minX = x;
				if (x > z.maxX) z.maxX = x;
				if (y < z.minY) z.minY = y;
				if (y > z.maxY) z.maxY = y;
			}
		}
	}
	return {
		edge: finishZone(acc[EDGE]),
		inside: finishZone(acc[INSIDE]),
		outside: finishZone(acc[OUTSIDE]),
		all: finishZone(all)
	};
}
function summarizeFlicker(pairs) {
	const zone = (key) => {
		let mean = 0;
		let max = 0;
		let share = 0;
		let worst = null;
		for (const pair of pairs) {
			const z = pair[key];
			mean += z.meanAbsDelta;
			share += z.changedShare;
			if (z.maxAbsDelta > max) max = z.maxAbsDelta;
			if (z.meanAbsDelta > 0 && (worst === null || z.meanAbsDelta > worst[key].meanAbsDelta)) worst = pair;
		}
		const k = Math.max(1, pairs.length);
		return {
			meanAbsDelta: r4$1(mean / k),
			maxAbsDelta: r4$1(max),
			changedShare: r4$1(share / k),
			worstPair: worst ? {
				from: worst.from.index,
				to: worst.to.index
			} : null
		};
	};
	return {
		edge: zone("edge"),
		inside: zone("inside"),
		outside: zone("outside"),
		all: zone("all")
	};
}
function enclosedHoles(alpha, width, height, opts = {}) {
	const below = opts.below ?? EDGE_DEFAULTS.opaque;
	const minArea = opts.minArea ?? 1;
	const n = width * height;
	const a = alpha instanceof Float64Array ? alpha : Float64Array.from(alpha);
	const labels = new Int32Array(n);
	const regions = labelRegions(a, width, height, (p) => a[p] < below, false, labels, new Int32Array(n), EDGE_DEFAULTS.transparent);
	const keep = new Uint8Array(regions.length + 1);
	const holes = [];
	const dropped = {
		count: 0,
		area: 0
	};
	const leftOut = {
		count: 0,
		area: 0
	};
	const entry = (r) => ({
		...box(r),
		area: r.area,
		meanAlpha: Math.round(r.alphaSum / r.area * 1e3) / 1e3
	});
	regions.forEach((r, i) => {
		if (r.touchesBorder) return;
		if (r.area < minArea) {
			dropped.count++;
			dropped.area += r.area;
			return;
		}
		if (opts.keep && !opts.keep(entry(r))) {
			leftOut.count++;
			leftOut.area += r.area;
			return;
		}
		keep[i + 1] = 1;
		holes.push({
			r,
			id: i + 1
		});
	});
	const mask = new Uint8Array(n);
	for (let p = 0; p < n; p++) if (keep[labels[p]]) mask[p] = 1;
	holes.sort((x, y) => y.r.area - x.r.area);
	return {
		holes: holes.map(({ r }) => entry(r)),
		mask,
		dropped,
		leftOut
	};
}
function growMask(mask, width, height, radius) {
	if (radius <= 0) return Uint8Array.from(mask);
	const src = Float64Array.from(mask);
	const scratch = new Float32Array(width * height);
	const dist = new Float32Array(width * height);
	distanceTo(src, width, height, (v) => v > 0, scratch, dist);
	const out = new Uint8Array(width * height);
	for (let p = 0; p < out.length; p++) if (dist[p] <= radius + 1e-9) out[p] = 1;
	return out;
}
function cutoutRegions(alpha, width, height, opts = {}) {
	const below = opts.below ?? EDGE_DEFAULTS.opaque;
	const minArea = opts.minArea ?? 1;
	const n = width * height;
	const a = Float64Array.from(alpha);
	const original = alpha;
	const sealedEdge = new Int8Array(n).fill(-1);
	const EDGES = [
		"top",
		"bottom",
		"left",
		"right"
	];
	const edgePixels = (e) => {
		const out = [];
		if (e < 2) {
			const y = e === 0 ? 0 : height - 1;
			for (let x = 0; x < width; x++) out.push(y * width + x);
		} else {
			const x = e === 2 ? 0 : width - 1;
			for (let y = 0; y < height; y++) out.push(y * width + x);
		}
		return out;
	};
	for (let e = 0; e < 4; e++) {
		const px = edgePixels(e);
		let first = -1;
		let last = -1;
		let count = 0;
		for (let i = 0; i < px.length; i++) if (original[px[i]] >= below) {
			if (first < 0) first = i;
			last = i;
			count++;
		}
		if (count < 2) continue;
		for (let i = first; i <= last; i++) {
			const p = px[i];
			if (original[p] < below) {
				if (sealedEdge[p] < 0) sealedEdge[p] = e;
				a[p] = 1;
			}
		}
	}
	const labels = new Int32Array(n);
	const regions = labelRegions(a, width, height, (p) => a[p] < below, false, labels, new Int32Array(n), EDGE_DEFAULTS.transparent);
	const extra = regions.map(() => ({
		area: 0,
		sum: 0,
		minX: Infinity,
		minY: Infinity,
		maxX: -1,
		maxY: -1,
		edges: /* @__PURE__ */ new Set()
	}));
	for (let p = 0; p < n; p++) {
		const e = sealedEdge[p];
		if (e < 0) continue;
		const x = p % width;
		const y = (p - x) / width;
		const q = e === 0 ? p + width : e === 1 ? p - width : e === 2 ? p + 1 : p - 1;
		const qy = (q - q % width) / width;
		if (q < 0 || q >= n || e >= 2 && Math.abs(qy - y) !== 0) continue;
		const id = labels[q];
		if (!id || regions[id - 1].touchesBorder) continue;
		const r = extra[id - 1];
		r.area++;
		r.sum += original[p];
		r.minX = Math.min(r.minX, x);
		r.maxX = Math.max(r.maxX, x);
		r.minY = Math.min(r.minY, y);
		r.maxY = Math.max(r.maxY, y);
		r.edges.add(EDGES[e]);
	}
	const holes = [];
	const openings = [];
	const dropped = {
		count: 0,
		area: 0
	};
	regions.forEach((r, i) => {
		if (r.touchesBorder) return;
		const x = extra[i];
		const area = r.area + x.area;
		if (area < minArea) {
			dropped.count++;
			dropped.area += area;
			return;
		}
		const minX = Math.min(r.minX, x.minX);
		const minY = Math.min(r.minY, x.minY);
		const entry = {
			x: minX,
			y: minY,
			width: Math.max(r.maxX, x.maxX) - minX + 1,
			height: Math.max(r.maxY, x.maxY) - minY + 1,
			area,
			meanAlpha: Math.round((r.alphaSum + x.sum) / area * 1e3) / 1e3
		};
		if (x.edges.size > 0) openings.push({
			...entry,
			edges: EDGES.filter((e) => x.edges.has(e))
		});
		else holes.push(entry);
	});
	holes.sort((p, q) => q.area - p.area);
	openings.sort((p, q) => q.area - p.area);
	return {
		holes,
		openings,
		dropped
	};
}
function outlineTracker(opts = {}) {
	const gap = opts.gap ?? 30;
	const limit = opts.limit ?? .002;
	const minFrames = opts.minFrames ?? 60;
	const step = Math.round((opts.step ?? .1) * 255);
	const lumaStep = Math.round(12.75);
	const ring = [];
	const neighbours = [];
	const windows = [];
	const changed = (x, y) => {
		let n = 0;
		for (let p = 0; p < x.length; p++) if (Math.abs(x[p] - y[p]) > step) n++;
		return n / x.length;
	};
	const footage = (p, c) => {
		let n = 0;
		for (let i = 0; i < p.a.length; i++) if (p.a[i] >= 250 && c.a[i] >= 250 && Math.abs(p.l[i] - c.l[i]) > lumaStep) n++;
		return n / p.a.length;
	};
	return {
		add(frame, alpha, rgb, width, height) {
			const n = width * height;
			const a = new Uint8Array(n);
			const l = new Uint8Array(n);
			for (let p = 0; p < n; p++) {
				a[p] = Math.round(Math.min(1, Math.max(0, alpha[p])) * 255);
				if (rgb) l[p] = Math.round(Math.min(1, Math.max(0, .2126 * rgb[p * 3] + .7152 * rgb[p * 3 + 1] + .0722 * rgb[p * 3 + 2])) * 255);
			}
			const cur = {
				frame,
				a,
				l
			};
			const prev = ring[ring.length - 1];
			if (prev && prev.frame === frame - 1) neighbours.push(changed(prev.a, a));
			let partner;
			for (const e of ring) if (e.frame <= frame - gap) partner = e;
			if (partner) windows.push({
				a: partner.frame,
				b: frame,
				drift: changed(partner.a, a),
				footage: footage(partner, cur)
			});
			ring.push(cur);
			let keepFrom = 0;
			for (let i = 0; i < ring.length; i++) if (ring[i].frame <= frame + 1 - gap) keepFrom = i;
			ring.splice(0, keepFrom);
		},
		result() {
			const frozen = [];
			let run = [];
			const close = () => {
				if (run.length >= 2) {
					const from = run[0].a;
					const to = run[run.length - 1].b;
					if (to - from + 1 >= minFrames) frozen.push({
						from,
						to,
						length: to - from + 1,
						drift: r6$1(Math.max(...run.map((w) => w.drift))),
						footageChange: r6$1(median$1(run.map((w) => w.footage)) ?? 0)
					});
				}
				run = [];
			};
			for (const w of windows) if (w.drift < limit) run.push(w);
			else close();
			close();
			const stats = (xs) => ({
				min: xs.length ? r6$1(Math.min(...xs)) : null,
				median: xs.length ? r6$1(median$1(xs)) : null,
				max: xs.length ? r6$1(Math.max(...xs)) : null
			});
			return {
				at: "full size: the share of the frame whose alpha changed by more than " + (opts.step ?? .1),
				neighbours: {
					...stats(neighbours),
					pairs: neighbours.length
				},
				drift: {
					gap,
					...stats(windows.map((w) => w.drift)),
					windows: windows.length
				},
				limits: {
					gap,
					limit,
					minFrames,
					step: opts.step ?? .1
				},
				frozen
			};
		}
	};
}
function statAdd(st, id, x, y, onEdge) {
	if (st.area[id] === void 0) {
		st.area[id] = 0;
		st.minX[id] = x;
		st.minY[id] = y;
		st.maxX[id] = x;
		st.maxY[id] = y;
		st.edge[id] = false;
	}
	st.area[id]++;
	if (x < st.minX[id]) st.minX[id] = x;
	if (x > st.maxX[id]) st.maxX[id] = x;
	if (y < st.minY[id]) st.minY[id] = y;
	if (y > st.maxY[id]) st.maxY[id] = y;
	if (onEdge) st.edge[id] = true;
}
function speckPieces(alpha, width, height, opts = {}, rgb) {
	const o = {
		...SPECK_DEFAULTS,
		...opts
	};
	let bx0 = width;
	let by0 = height;
	let bx1 = -1;
	let by1 = -1;
	for (let y = 0; y < height; y++) {
		const row = y * width;
		let first = -1;
		let last = -1;
		for (let x = 0; x < width; x++) if (alpha[row + x] >= o.opaque) {
			if (first < 0) first = x;
			last = x;
		}
		if (first < 0) continue;
		if (first < bx0) bx0 = first;
		if (last > bx1) bx1 = last;
		if (y < by0) by0 = y;
		by1 = y;
	}
	if (bx1 < 0) return [];
	bx0 = Math.max(0, bx0 - 1);
	by0 = Math.max(0, by0 - 1);
	bx1 = Math.min(width - 1, bx1 + 1);
	by1 = Math.min(height - 1, by1 + 1);
	const w = bx1 - bx0 + 1;
	const h = by1 - by0 + 1;
	const n = w * h;
	const m = new Uint8Array(n);
	for (let y = 0; y < h; y++) {
		const src = (y + by0) * width + bx0;
		for (let x = 0; x < w; x++) m[y * w + x] = alpha[src + x] >= o.opaque ? 1 : 0;
	}
	const onEdge = (x, y) => x + bx0 === 0 || y + by0 === 0 || x + bx0 === width - 1 || y + by0 === height - 1;
	let er = m;
	for (let t = 0; t < o.neck; t++) {
		const next = new Uint8Array(n);
		for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
			const p = y * w + x;
			next[p] = er[p] & er[p - 1] & er[p + 1] & er[p - w] & er[p + w];
		}
		er = next;
	}
	let ring = [];
	for (let p = 0; p < n; p++) if (m[p] && !er[p]) ring.push(p);
	const labels = new Int32Array(n);
	const queue = new Int32Array(n);
	const st = {
		area: [],
		minX: [],
		minY: [],
		maxX: [],
		maxY: [],
		edge: []
	};
	const fill = (mask, start, id) => {
		labels[start] = id;
		let head = 0;
		let tail = 0;
		queue[tail++] = start;
		let x0 = w;
		let y0 = h;
		let x1 = -1;
		let y1 = -1;
		while (head < tail) {
			const p = queue[head++];
			const x = p % w;
			const y = (p - x) / w;
			if (x < x0) x0 = x;
			if (x > x1) x1 = x;
			if (y < y0) y0 = y;
			if (y > y1) y1 = y;
			const ya = y > 0 ? -1 : 0;
			const yb = y < h - 1 ? 1 : 0;
			const xa = x > 0 ? -1 : 0;
			const xb = x < w - 1 ? 1 : 0;
			for (let dy = ya; dy <= yb; dy++) for (let dx = xa; dx <= xb; dx++) {
				const q = p + dy * w + dx;
				if (mask[q] && !labels[q]) {
					labels[q] = id;
					queue[tail++] = q;
				}
			}
		}
		st.area[id] = tail;
		st.minX[id] = x0;
		st.minY[id] = y0;
		st.maxX[id] = x1;
		st.maxY[id] = y1;
		st.edge[id] = onEdge(x0, y0) || onEdge(x1, y1);
	};
	const rs = [];
	const reEnd = [];
	const ry = [];
	const parent = [];
	const find = (i) => {
		while (parent[i] !== i) {
			parent[i] = parent[parent[i]];
			i = parent[i];
		}
		return i;
	};
	let prevFrom = 0;
	let prevTo = 0;
	for (let y = 0; y < h; y++) {
		const rowFrom = rs.length;
		const row = y * w;
		let x = 0;
		while (x < w) {
			if (!er[row + x]) {
				x++;
				continue;
			}
			const x0 = x;
			while (x < w && er[row + x]) x++;
			const r = rs.length;
			rs.push(x0);
			reEnd.push(x);
			ry.push(y);
			parent.push(r);
			for (let k = prevFrom; k < prevTo; k++) {
				if (reEnd[k] < x0 || rs[k] > x) continue;
				const a = find(k);
				const b2 = find(r);
				if (a !== b2) parent[Math.max(a, b2)] = Math.min(a, b2);
			}
		}
		prevFrom = rowFrom;
		prevTo = rs.length;
	}
	const idOf = /* @__PURE__ */ new Map();
	let grownEnd = 1;
	for (let k = 0; k < rs.length; k++) {
		const root = find(k);
		let id = idOf.get(root);
		if (id === void 0) {
			id = grownEnd++;
			idOf.set(root, id);
			st.area[id] = 0;
			st.minX[id] = rs[k];
			st.minY[id] = ry[k];
			st.maxX[id] = reEnd[k] - 1;
			st.maxY[id] = ry[k];
			st.edge[id] = false;
		}
		const len = reEnd[k] - rs[k];
		st.area[id] += len;
		if (rs[k] < st.minX[id]) st.minX[id] = rs[k];
		if (reEnd[k] - 1 > st.maxX[id]) st.maxX[id] = reEnd[k] - 1;
		if (ry[k] < st.minY[id]) st.minY[id] = ry[k];
		if (ry[k] > st.maxY[id]) st.maxY[id] = ry[k];
		if (onEdge(rs[k], ry[k]) || onEdge(reEnd[k] - 1, ry[k])) st.edge[id] = true;
		labels.fill(id, ry[k] * w + rs[k], ry[k] * w + reEnd[k]);
	}
	for (let t = 0; t < o.neck + 1 && ring.length; t++) {
		const take = [];
		const left = [];
		for (const p of ring) {
			const x = p % w;
			const v = x > 0 && labels[p - 1] || x < w - 1 && labels[p + 1] || p >= w && labels[p - w] || p + w < n && labels[p + w] || 0;
			if (v) take.push([p, v]);
			else left.push(p);
		}
		for (const [p, v] of take) {
			labels[p] = v;
			const x = p % w;
			const y = (p - x) / w;
			statAdd(st, v, x, y, onEdge(x, y));
		}
		ring = left;
		if (!take.length) break;
	}
	const rest = new Uint8Array(n);
	for (const p of ring) rest[p] = 1;
	let end = grownEnd;
	for (const p of ring) if (!labels[p]) fill(rest, p, end++);
	const touchesGrown = new Uint8Array(end);
	for (const p of ring) {
		const id = labels[p];
		if (touchesGrown[id]) continue;
		const x = p % w;
		const y = (p - x) / w;
		for (let dy = -1; dy <= 1 && !touchesGrown[id]; dy++) for (let dx = -1; dx <= 1; dx++) {
			const xx = x + dx;
			const yy = y + dy;
			if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
			const q = labels[yy * w + xx];
			if (q && q < grownEnd) {
				touchesGrown[id] = 1;
				break;
			}
		}
	}
	let main = 1;
	for (let id = 1; id < end; id++) if ((st.area[id] ?? 0) > (st.area[main] ?? 0)) main = id;
	const pieces = [];
	for (let id = 1; id < end; id++) {
		const a = st.area[id] ?? 0;
		if (id === main || st.edge[id] || a < o.minArea || a > o.maxArea) continue;
		if (id >= grownEnd && touchesGrown[id]) continue;
		const piece = {
			x: st.minX[id] + bx0,
			y: st.minY[id] + by0,
			width: st.maxX[id] - st.minX[id] + 1,
			height: st.maxY[id] - st.minY[id] + 1,
			area: a
		};
		if (rgb && rgb.length >= width * height * 3) {
			let sl = 0;
			let sa = 0;
			let sb = 0;
			let k = 0;
			for (let y = st.minY[id]; y <= st.maxY[id]; y++) for (let x = st.minX[id]; x <= st.maxX[id]; x++) {
				const p = y * w + x;
				if (labels[p] !== id || !m[p]) continue;
				const i = ((y + by0) * width + x + bx0) * 3;
				const lab = labOf([
					rgb[i],
					rgb[i + 1],
					rgb[i + 2]
				]);
				sl += lab.L;
				sa += lab.a;
				sb += lab.b;
				k++;
			}
			if (k > 0) {
				const r1 = (v) => Math.round(v * 10) / 10;
				piece.colour = {
					L: r1(sl / k),
					a: r1(sa / k),
					b: r1(sb / k),
					pixels: k
				};
			}
		}
		pieces.push(piece);
	}
	return pieces.sort((p, q) => q.area - p.area);
}
function subjectTop(alpha, width, height) {
	for (let y = 0; y < height; y++) {
		const row = y * width;
		for (let x = 0; x < width; x++) if (alpha[row + x] >= .5) return y;
	}
	return -1;
}
function overlapOf(a, b) {
	let inter = 0;
	let uni = 0;
	for (let p = 0; p < a.length; p++) {
		const x = a[p] >= .5;
		const y = b[p] >= .5;
		if (x && y) inter++;
		if (x || y) uni++;
	}
	return uni ? inter / uni : 1;
}
function furthestFrame(ref, others, width, height) {
	let best = {
		frame: others[0]?.frame ?? -1,
		overlap: 1
	};
	for (const o of others) {
		const ov = Math.round(overlapOf(ref, o.alpha) * 1e4) / 1e4;
		if (ov < best.overlap) best = {
			frame: o.frame,
			overlap: ov
		};
	}
	return best;
}
function matteCoverage(asClicked, result, width, height, opts = {}) {
	const deep = opts.deep ?? 30;
	const outside = opts.outside ?? 10;
	const spreadAlpha = opts.spreadAlpha ?? .2;
	const n = width * height;
	const scratch = new Float32Array(n);
	const dIn = new Float32Array(n);
	const dOut = new Float32Array(n);
	distanceTo(asClicked, width, height, (a) => a < .99, scratch, dIn);
	distanceTo(asClicked, width, height, (a) => a >= .5, scratch, dOut);
	let seen = 0;
	let minAlpha = 1;
	let from = -1;
	let to = -1;
	let px = 0;
	let x0 = width;
	let y0 = height;
	let x1 = -1;
	let y1 = -1;
	for (let p = 0; p < n; p++) {
		const y = p / width | 0;
		if (asClicked[p] >= .99 && dIn[p] > deep) {
			const r = result[p];
			if (r < minAlpha) minAlpha = r;
			if (r < .99) {
				seen++;
				if (from < 0 || y < from) from = y;
				if (y > to) to = y;
			}
		}
		if (result[p] >= spreadAlpha && dOut[p] > outside) {
			px++;
			const x = p - y * width;
			if (x < x0) x0 = x;
			if (x > x1) x1 = x;
			if (y < y0) y0 = y;
			if (y > y1) y1 = y;
		}
	}
	return {
		seenThrough: seen,
		minAlpha: Math.round(minAlpha * 1e4) / 1e4,
		band: seen ? {
			from,
			to
		} : null,
		outside: {
			px,
			box: px ? {
				x: x0,
				y: y0,
				width: x1 - x0 + 1,
				height: y1 - y0 + 1
			} : null
		},
		deep,
		outsideDistance: outside
	};
}
function seenThroughInside(alpha, width, height, opts = {}) {
	const { solid, below, deep } = {
		...SEEN_THROUGH_DEFAULTS,
		...opts
	};
	let x0 = width, y0 = height, x1 = -1, y1 = -1;
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (alpha[y * width + x] >= solid) {
		if (x < x0) x0 = x;
		if (x > x1) x1 = x;
		if (y < y0) y0 = y;
		if (y > y1) y1 = y;
	}
	if (x1 < 0) return {
		px: 0,
		box: null
	};
	x0 = Math.max(0, x0 - 1);
	y0 = Math.max(0, y0 - 1);
	x1 = Math.min(width - 1, x1 + 1);
	y1 = Math.min(height - 1, y1 + 1);
	const w = x1 - x0 + 1;
	const h = y1 - y0 + 1;
	const crop = new Float64Array(w * h);
	for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) crop[y * w + x] = alpha[(y + y0) * width + x + x0];
	const dist = new Float32Array(w * h);
	distanceTo(crop, w, h, (a) => a < solid, new Float32Array(w * h), dist);
	let px = 0;
	let bx0 = width, by0 = height, bx1 = -1, by1 = -1;
	for (let y = 0; y < h; y++) {
		const fy = y + y0;
		if (fy < deep || fy >= height - deep) continue;
		for (let x = 0; x < w; x++) {
			const fx = x + x0;
			if (fx < deep || fx >= width - deep) continue;
			const a = crop[y * w + x];
			if (a < solid || a >= below || !(dist[y * w + x] > deep)) continue;
			px++;
			if (fx < bx0) bx0 = fx;
			if (fx > bx1) bx1 = fx;
			if (fy < by0) by0 = fy;
			if (fy > by1) by1 = fy;
		}
	}
	return {
		px,
		box: px ? {
			x: bx0,
			y: by0,
			width: bx1 - bx0 + 1,
			height: by1 - by0 + 1
		} : null
	};
}
var EDGE_DEFAULTS, CONTOUR_ALPHA, OUTSIDE, EDGE, INSIDE, r2, r4$1, r4rgb$1, INF, newRegion, box, N4X, N4Y, N8X, N8Y, byArea, zoneAcc, median$1, r6$1, SPECK_DEFAULTS, SEEN_THROUGH_DEFAULTS;
function init_matte() {
	return (init_matte = __esmMin((() => {
		init_sheet();
		EDGE_DEFAULTS = {
			from: "alpha",
			transparent: 2 / 255,
			opaque: 1 - 2 / 255,
			maxEdgeWidth: "auto",
			mainAreaShare: .25,
			listed: 5,
			screen: "green",
			spillMinAlpha: .1,
			spillThreshold: .03,
			changeAbove: .05,
			patchWindow: "auto"
		};
		CONTOUR_ALPHA = .5;
		OUTSIDE = 0;
		EDGE = 1;
		INSIDE = 2;
		r2 = (v) => Math.round(v * 100) / 100;
		r4$1 = (v) => Math.round(v * 1e4) / 1e4;
		r4rgb$1 = (v) => [
			r4$1(v[0]),
			r4$1(v[1]),
			r4$1(v[2])
		];
		INF = 0x56bc75e2d63100000;
		newRegion = () => ({
			area: 0,
			minX: Infinity,
			minY: Infinity,
			maxX: -1,
			maxY: -1,
			alphaSum: 0,
			alphaMax: 0,
			transparent: 0,
			touchesBorder: false
		});
		box = (r) => ({
			x: r.minX,
			y: r.minY,
			width: r.maxX - r.minX + 1,
			height: r.maxY - r.minY + 1
		});
		N4X = [
			1,
			-1,
			0,
			0
		];
		N4Y = [
			0,
			0,
			1,
			-1
		];
		N8X = [
			1,
			-1,
			0,
			0,
			1,
			1,
			-1,
			-1
		];
		N8Y = [
			0,
			0,
			1,
			-1,
			1,
			-1,
			1,
			-1
		];
		byArea = (a, b) => b.area - a.area;
		zoneAcc = () => ({
			pixels: 0,
			sum: 0,
			max: 0,
			changed: 0,
			minX: Infinity,
			minY: Infinity,
			maxX: -1,
			maxY: -1
		});
		median$1 = (xs) => {
			if (!xs.length) return null;
			const s = [...xs].sort((a, b) => a - b);
			const m = s.length;
			return m % 2 ? s[(m - 1) / 2] : (s[m / 2 - 1] + s[m / 2]) / 2;
		};
		r6$1 = (n) => Math.round(n * 1e6) / 1e6;
		SPECK_DEFAULTS = {
			opaque: .5,
			minArea: 20,
			maxArea: 2e3,
			neck: 1,
			minRun: 2
		};
		SEEN_THROUGH_DEFAULTS = {
			solid: .5,
			below: .95,
			deep: 30,
			minArea: 400,
			minRun: 2
		};
	})))();
}

// color/png16.js
function readChunks(buf) {
	if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error("not a PNG file");
	const chunks = [];
	let pos = 8;
	while (pos + 8 <= buf.length) {
		const length = buf.readUInt32BE(pos);
		const type = buf.toString("latin1", pos + 4, pos + 8);
		chunks.push({
			type,
			data: buf.subarray(pos + 8, pos + 8 + length)
		});
		pos += 12 + length;
		if (type === "IEND") break;
	}
	return chunks;
}
function channelsFor(colorType) {
	switch (colorType) {
		case 0: return 1;
		case 2: return 3;
		case 4: return 2;
		case 6: return 4;
		default: throw new Error(`unsupported PNG color type ${colorType} (palette images are out of scope)`);
	}
}
function paeth(a, b, c) {
	const p = a + b - c;
	const pa = Math.abs(p - a);
	const pb = Math.abs(p - b);
	const pc = Math.abs(p - c);
	if (pa <= pb && pa <= pc) return a;
	return pb <= pc ? b : c;
}
function decodePng(buf) {
	const chunks = readChunks(buf);
	const ihdr = chunks.find((c) => c.type === "IHDR");
	if (!ihdr) throw new Error("PNG missing IHDR");
	const width = ihdr.data.readUInt32BE(0);
	const height = ihdr.data.readUInt32BE(4);
	const bitDepth = ihdr.data.readUInt8(8);
	const colorType = ihdr.data.readUInt8(9);
	if (ihdr.data.readUInt8(12) !== 0) throw new Error("interlaced PNG is not supported");
	if (bitDepth !== 8 && bitDepth !== 16) throw new Error(`unsupported PNG bit depth ${bitDepth}`);
	const channels = channelsFor(colorType);
	const idat = Buffer.concat(chunks.filter((c) => c.type === "IDAT").map((c) => c.data));
	const raw = zlib.inflateSync(idat);
	const bytesPerSample = bitDepth / 8;
	const bytesPerPixel = channels * bytesPerSample;
	const stride = width * bytesPerPixel;
	if (raw.length < height * (stride + 1)) throw new Error("PNG pixel data truncated");
	const rgb = new Float64Array(width * height * 3);
	const alpha = channels === 2 || channels === 4 ? new Float64Array(width * height) : void 0;
	const maxVal = bitDepth === 16 ? 65535 : 255;
	const prev = Buffer.alloc(stride);
	const cur = Buffer.alloc(stride);
	const grayish = channels <= 2;
	for (let y = 0; y < height; y++) {
		const rowStart = y * (stride + 1);
		const filter = raw[rowStart];
		raw.copy(cur, 0, rowStart + 1, rowStart + 1 + stride);
		switch (filter) {
			case 0: break;
			case 1:
				for (let i = bytesPerPixel; i < stride; i++) cur[i] = cur[i] + cur[i - bytesPerPixel] & 255;
				break;
			case 2:
				for (let i = 0; i < stride; i++) cur[i] = cur[i] + prev[i] & 255;
				break;
			case 3:
				for (let i = 0; i < stride; i++) {
					const left = i >= bytesPerPixel ? cur[i - bytesPerPixel] : 0;
					cur[i] = cur[i] + (left + prev[i] >> 1) & 255;
				}
				break;
			case 4:
				for (let i = 0; i < stride; i++) {
					const left = i >= bytesPerPixel ? cur[i - bytesPerPixel] : 0;
					const upLeft = i >= bytesPerPixel ? prev[i - bytesPerPixel] : 0;
					cur[i] = cur[i] + paeth(left, prev[i], upLeft) & 255;
				}
				break;
			default: throw new Error(`unknown PNG filter ${filter} at row ${y}`);
		}
		for (let x = 0; x < width; x++) {
			const px = x * bytesPerPixel;
			const out = (y * width + x) * 3;
			for (let ch = 0; ch < 3; ch++) {
				const off = px + (grayish ? 0 : ch) * bytesPerSample;
				const v = bitDepth === 16 ? cur.readUInt16BE(off) : cur[off];
				rgb[out + ch] = v / maxVal;
			}
			if (alpha) {
				const off = px + (channels - 1) * bytesPerSample;
				const a = bitDepth === 16 ? cur.readUInt16BE(off) : cur[off];
				alpha[y * width + x] = a / maxVal;
			}
		}
		cur.copy(prev);
	}
	return alpha ? {
		width,
		height,
		rgb,
		alpha,
		bitDepth
	} : {
		width,
		height,
		rgb,
		bitDepth
	};
}
function chunk(type, data) {
	const head = Buffer.alloc(8);
	head.writeUInt32BE(data.length, 0);
	head.write(type, 4, "latin1");
	const crcBody = Buffer.concat([head.subarray(4), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(zlib.crc32(crcBody) >>> 0, 0);
	return Buffer.concat([
		head,
		data,
		crc
	]);
}
function encode8(width, height, colorType, srgbTags, write, level = 6) {
	const channels = colorType === 0 ? 1 : colorType === 2 ? 3 : 4;
	const stride = width * channels;
	const raw = Buffer.alloc(height * (stride + 1));
	for (let y = 0; y < height; y++) {
		const rowStart = y * (stride + 1);
		raw[rowStart] = 0;
		for (let x = 0; x < width; x++) write(y * width + x, raw, rowStart + 1 + x * channels);
	}
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr.writeUInt8(8, 8);
	ihdr.writeUInt8(colorType, 9);
	const gama = Buffer.alloc(4);
	gama.writeUInt32BE(45455, 0);
	return Buffer.concat([
		PNG_SIGNATURE,
		chunk("IHDR", ihdr),
		...srgbTags ? [chunk("sRGB", Buffer.from([0])), chunk("gAMA", gama)] : [],
		chunk("IDAT", zlib.deflateSync(raw, { level })),
		chunk("IEND", Buffer.alloc(0))
	]);
}
function encodePngSrgb8(width, height, rgb, level = 6) {
	return encode8(width, height, 2, true, (p, out, at) => {
		out[at] = to8(rgb[p * 3]);
		out[at + 1] = to8(rgb[p * 3 + 1]);
		out[at + 2] = to8(rgb[p * 3 + 2]);
	}, level);
}
function encodePngSrgbRgba8(width, height, rgb, alpha) {
	return encode8(width, height, 6, true, (p, out, at) => {
		out[at] = to8(rgb[p * 3]);
		out[at + 1] = to8(rgb[p * 3 + 1]);
		out[at + 2] = to8(rgb[p * 3 + 2]);
		out[at + 3] = to8(alpha[p]);
	});
}
function encodePngGray8(width, height, values) {
	return encode8(width, height, 0, false, (p, out, at) => {
		out[at] = to8(values[p]);
	});
}
var PNG_SIGNATURE, to8;
function init_png16() {
	return (init_png16 = __esmMin((() => {
		PNG_SIGNATURE = Buffer.from([
			137,
			80,
			78,
			71,
			13,
			10,
			26,
			10
		]);
		to8 = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255);
	})))();
}

// color/screen.js
function autoGrid(width, height) {
	const short = Math.min(width, height);
	const across = 4;
	const along = Math.max(1, Math.round(across * Math.max(width, height) / short));
	return width <= height ? {
		columns: across,
		rows: along
	} : {
		columns: along,
		rows: across
	};
}
function resolveScreenThresholds(args, width, height) {
	const grid = autoGrid(width, height);
	const short = Math.min(width, height);
	return {
		screen: args.screen ?? SCREEN_DEFAULTS.screen,
		minExcess: args.minExcess ?? SCREEN_DEFAULTS.minExcess,
		minDominance: args.minDominance ?? SCREEN_DEFAULTS.minDominance,
		minScreenShare: args.minScreenShare ?? SCREEN_DEFAULTS.minScreenShare,
		opaque: args.opaque ?? SCREEN_DEFAULTS.opaque,
		columns: args.columns ?? grid.columns,
		rows: args.rows ?? grid.rows,
		minCellShare: args.minCellShare ?? SCREEN_DEFAULTS.minCellShare,
		nearSkip: args.nearSkip ?? Math.max(2, Math.round(.01 * short)),
		nearBand: args.nearBand ?? Math.max(4, Math.round(.05 * short)),
		unevenRatio: args.unevenRatio ?? SCREEN_DEFAULTS.unevenRatio,
		grainAbove: args.grainAbove ?? SCREEN_DEFAULTS.grainAbove
	};
}
function screenArgsError(args) {
	if (args.screen !== void 0 && args.screen !== "auto" && args.screen !== "green" && args.screen !== "blue") return "`screen.screen` must be 'auto', 'green' or 'blue'";
	for (const key of [
		"minExcess",
		"minDominance",
		"minScreenShare",
		"opaque",
		"minCellShare",
		"grainAbove"
	]) {
		const v = args[key];
		if (v !== void 0 && (typeof v !== "number" || !(v >= 0 && v <= 1))) return `\`screen.${key}\` must be a number in 0..1`;
	}
	for (const key of ["columns", "rows"]) {
		const v = args[key];
		if (v !== void 0 && (!Number.isInteger(v) || v < 1 || v > 64)) return `\`screen.${key}\` must be a whole number from 1 to 64`;
	}
	const skip = args.nearSkip;
	if (skip !== void 0 && (typeof skip !== "number" || !Number.isFinite(skip) || skip < 0)) return "`screen.nearSkip` must be 0 or more (pixels)";
	const band = args.nearBand;
	if (band !== void 0 && (typeof band !== "number" || !Number.isFinite(band) || band < 1)) return "`screen.nearBand` must be at least 1 (pixels)";
	const u = args.unevenRatio;
	if (u !== void 0 && (typeof u !== "number" || !Number.isFinite(u) || u < 1)) return "`screen.unevenRatio` must be a number of 1 or more";
	return null;
}
function screenTest(rgb, p, ch, t) {
	const v = rgb[p * 3 + ch];
	const lead = v - (ch === 1 ? Math.max(rgb[p * 3], rgb[p * 3 + 2]) : Math.max(rgb[p * 3], rgb[p * 3 + 1]));
	return lead >= t.minExcess && lead >= t.minDominance * v;
}
function histMedian(h, count) {
	const out = [
		0,
		0,
		0
	];
	const half = (count + 1) / 2;
	for (let c = 0; c < 3; c++) {
		let acc = 0;
		const base = c * BINS;
		for (let b = 0; b < BINS; b++) {
			acc += h[base + b];
			if (acc >= half) {
				out[c] = b / 65535;
				break;
			}
		}
	}
	return out;
}
function addToHist(h, rgb, p) {
	for (let c = 0; c < 3; c++) {
		const v = Math.min(1, Math.max(0, rgb[p * 3 + c]));
		h[c * BINS + Math.round(v * 65535)]++;
	}
}
function measureScreen(img, t) {
	const { width, height, rgb } = img;
	const alpha = img.alpha;
	const n = width * height;
	const measuredAt = (p) => !alpha || alpha[p] >= t.opaque;
	let measured = 0;
	for (let p = 0; p < n; p++) if (measuredAt(p)) measured++;
	const leftOut = n - measured;
	const kinds = t.screen === "auto" ? ["green", "blue"] : [t.screen];
	let kind = kinds[0];
	let best = -1;
	for (const k of kinds) {
		let count2 = 0;
		for (let p = 0; p < n; p++) if (measuredAt(p) && screenTest(rgb, p, CH[k], t)) count2++;
		if (count2 > best) {
			best = count2;
			kind = k;
		}
	}
	const ch = CH[kind];
	const found = measured > 0 && best / measured >= t.minScreenShare && best > 0;
	const base = {
		stage: "capture",
		values: "capture",
		screen: found ? kind : null,
		chosen: t.screen === "auto" ? "detected" : "given",
		pixels: n,
		measured,
		leftOut,
		screenPixels: 0,
		share: 0,
		bounds: null,
		colour: null,
		subject: null,
		evenness: null,
		grain: null,
		reading: "",
		screenColourNote: SCREEN_COLOUR_NOTE
	};
	if (leftOut > n / 2) base.warning = `${Math.round(100 * leftOut / n)}% of the frame is transparent or partly transparent, as a keyed render is. Measure the source: set Keylight's View to 'source' (key.view) or switch the key off, and isolate the keyed layer so nothing else is in the render.`;
	if (!found) {
		const what = t.screen === "auto" ? "green or blue" : t.screen;
		base.reading = `no ${what} screen found: fewer than ${Math.round(t.minScreenShare * 100)}% of the ${measured} measured pixels have ${what} leading the other channels by at least ${t.minExcess} and ${Math.round(t.minDominance * 100)}% of its level`;
		return base;
	}
	const isScreen = new Uint8Array(n);
	const hist = new Uint32Array(3 * BINS);
	const sum = [
		0,
		0,
		0
	];
	let count = 0;
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -1;
	let maxY = -1;
	for (let p = 0; p < n; p++) {
		if (!measuredAt(p) || !screenTest(rgb, p, ch, t)) continue;
		isScreen[p] = 1;
		count++;
		addToHist(hist, rgb, p);
		for (let c = 0; c < 3; c++) sum[c] += rgb[p * 3 + c];
		const x = p % width;
		const y = (p - x) / width;
		if (x < minX) minX = x;
		if (x > maxX) maxX = x;
		if (y < minY) minY = y;
		if (y > maxY) maxY = y;
	}
	const median = histMedian(hist, count);
	const mean = [
		sum[0] / count,
		sum[1] / count,
		sum[2] / count
	];
	const labels = new Int32Array(n);
	const queue = new Int32Array(n);
	const ones = alpha ?? new Float64Array(n).fill(1);
	const regions = labelRegions(ones, width, height, (p) => measuredAt(p) && isScreen[p] === 0, true, labels, queue, -1);
	let subjectId = 0;
	for (let i = 0; i < regions.length; i++) if (subjectId === 0 || regions[i].area > regions[subjectId - 1].area) subjectId = i + 1;
	let subject = null;
	let nearSubject = null;
	if (subjectId > 0) {
		const s = regions[subjectId - 1];
		subject = {
			box: {
				x: s.minX,
				y: s.minY,
				width: s.maxX - s.minX + 1,
				height: s.maxY - s.minY + 1
			},
			area: s.area,
			share: r4(s.area / n)
		};
		const mask = new Float64Array(n);
		for (let p = 0; p < n; p++) if (labels[p] === subjectId) mask[p] = 1;
		const scratch = new Float32Array(n);
		const dist = new Float32Array(n);
		distanceTo(mask, width, height, (a) => a > .5, scratch, dist);
		const from = t.nearSkip;
		const to = t.nearSkip + t.nearBand;
		const nearHist = new Uint32Array(3 * BINS);
		let nearCount = 0;
		for (let p = 0; p < n; p++) {
			if (isScreen[p] === 0 || !(dist[p] > from && dist[p] <= to)) continue;
			addToHist(nearHist, rgb, p);
			nearCount++;
		}
		if (nearCount > 0) nearSubject = {
			colour: r4rgb(histMedian(nearHist, nearCount)),
			pixels: nearCount,
			band: {
				from,
				to
			}
		};
	}
	const evenness = measureEvenness(img, isScreen, measuredAt, ch, kind, t);
	const grain = measureGrain(img, isScreen, ch, kind, t);
	const near = nearSubject ? nearSubject.colour : null;
	const fmt = (c) => `(${c.map((v) => v.toFixed(3)).join(", ")})`;
	base.screenPixels = count;
	base.share = r4(count / measured);
	base.bounds = {
		x: minX,
		y: minY,
		width: maxX - minX + 1,
		height: maxY - minY + 1
	};
	base.colour = {
		median: r4rgb(median),
		mean: r4rgb(mean),
		nearSubject
	};
	base.subject = subject;
	base.evenness = evenness;
	base.grain = grain;
	base.reading = `${kind} screen, ${Math.round(base.share * 100)}% of the measured pixels; median ${fmt(median)}` + (near ? `, near the subject ${fmt(near)}` : "") + `. ${evenness.reading}. ${grain ? grain.reading : "grain not measured (no screen pixel has screen all round it)"}.`;
	return base;
}
function measureEvenness(img, isScreen, measuredAt, ch, kind, t) {
	const { width, height, rgb } = img;
	const cols = Math.min(t.columns, width);
	const rows = Math.min(t.rows, height);
	const xs = Array.from({ length: cols + 1 }, (_, i) => Math.floor(i * width / cols));
	const ys = Array.from({ length: rows + 1 }, (_, i) => Math.floor(i * height / rows));
	const cells = [];
	let s1 = 0;
	let su = 0;
	let sv = 0;
	let suu = 0;
	let suv = 0;
	let svv = 0;
	let sl = 0;
	let sul = 0;
	let svl = 0;
	const du = Math.max(1, width - 1);
	const dv = Math.max(1, height - 1);
	const perX = new Float64Array(width);
	const perY = new Float64Array(height);
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
		let m = 0;
		let k = 0;
		const acc = [
			0,
			0,
			0
		];
		for (let y = ys[r]; y < ys[r + 1]; y++) for (let x = xs[c]; x < xs[c + 1]; x++) {
			const p = y * width + x;
			if (!measuredAt(p)) continue;
			m++;
			if (isScreen[p] === 0) continue;
			k++;
			for (let q = 0; q < 3; q++) acc[q] += rgb[p * 3 + q];
			perX[x]++;
			perY[y]++;
			const u = x / du;
			const v = y / dv;
			const l = rgb[p * 3 + ch];
			s1++;
			su += u;
			sv += v;
			suu += u * u;
			suv += u * v;
			svv += v * v;
			sl += l;
			sul += u * l;
			svl += v * l;
		}
		const cellMean = k > 0 ? [
			acc[0] / k,
			acc[1] / k,
			acc[2] / k
		] : null;
		cells.push({
			column: c,
			row: r,
			box: {
				x: xs[c],
				y: ys[r],
				width: xs[c + 1] - xs[c],
				height: ys[r + 1] - ys[r]
			},
			screenShare: m > 0 ? r4(k / m) : 0,
			mean: cellMean ? r4rgb(cellMean) : null,
			luma: cellMean ? r4(luma(cellMean)) : null,
			level: cellMean ? r4(cellMean[ch]) : null
		});
	}
	const eligible = cells.filter((c) => c.level !== null && c.screenShare >= t.minCellShare);
	let darkest = null;
	let brightest = null;
	for (const c of eligible) {
		if (darkest === null || c.level < darkest.level) darkest = c;
		if (brightest === null || c.level > brightest.level) brightest = c;
	}
	const levelRatio = darkest && brightest && darkest.level > 0 ? r4(brightest.level / darkest.level) : null;
	const lumaRatio = darkest && brightest && darkest.luma > 0 ? r4(brightest.luma / darkest.luma) : null;
	const uneven = levelRatio !== null && levelRatio > t.unevenRatio;
	const plane = solve3([
		[
			s1,
			su,
			sv
		],
		[
			su,
			suu,
			suv
		],
		[
			sv,
			suv,
			svv
		]
	], [
		sl,
		sul,
		svl
	]);
	const [x0, x1] = percentileRange(perX, s1);
	const [y0, y1] = percentileRange(perY, s1);
	const extent = {
		x: x0,
		y: y0,
		width: x1 - x0 + 1,
		height: y1 - y0 + 1
	};
	let horizontal = null;
	let vertical = null;
	if (plane && s1 > 0) {
		const [a, b, c] = plane;
		const at = (u, v) => a + b * u + c * v;
		const ratio = (hi, lo) => lo > 0 && hi > 0 ? r4(hi / lo) : null;
		const uc = su / s1;
		const vc = sv / s1;
		if (x1 > x0) horizontal = ratio(at(x1 / du, vc), at(x0 / du, vc));
		if (y1 > y0) vertical = ratio(at(uc, y1 / dv), at(uc, y0 / dv));
	}
	const sides = [];
	if (horizontal !== null) sides.push({
		side: horizontal > 1 ? "left" : "right",
		strength: Math.max(horizontal, 1 / horizontal)
	});
	if (vertical !== null) sides.push({
		side: vertical > 1 ? "top" : "bottom",
		strength: Math.max(vertical, 1 / vertical)
	});
	const darkerSide = sides.filter((d) => d.strength > t.unevenRatio).sort((p, q) => q.strength - p.strength).map((d) => d.side);
	const where = (c) => `cell ${c.column},${c.row} at x ${c.box.x}, y ${c.box.y}`;
	let reading;
	if (darkest === null || brightest === null || levelRatio === null) reading = `no grid cell is at least ${Math.round(t.minCellShare * 100)}% screen, so evenness was not read`;
	else {
		const spread = `the screen's ${kind} level runs from ${darkest.level.toFixed(3)} (${where(darkest)}) to ${brightest.level.toFixed(3)} (${where(brightest)}), ${levelRatio.toFixed(2)}x`;
		reading = uneven ? `uneven: ${spread}` + (darkerSide.length ? `, darker on the ${darkerSide.join(" and the ")}` : "") + ". One Screen Colour will not fit all of it: key from the colour near the subject, then check the darker part in the Screen Matte view (Clip Black, a second key, or a garbage mask)" : `even: ${spread}`;
	}
	return {
		columns: cols,
		rows,
		cellWidth: xs[1] - xs[0],
		cellHeight: ys[1] - ys[0],
		cells,
		darkest,
		brightest,
		levelRatio,
		lumaRatio,
		uneven,
		extent,
		horizontal,
		vertical,
		darkerSide,
		reading
	};
}
function percentileRange(counts, total) {
	if (total <= 0) return [0, counts.length - 1];
	const lo = .05 * total;
	const hi = .95 * total;
	let acc = 0;
	let first = -1;
	let last = counts.length - 1;
	for (let i = 0; i < counts.length; i++) {
		acc += counts[i];
		if (first < 0 && acc >= lo) first = i;
		if (acc >= hi) {
			last = i;
			break;
		}
	}
	return [Math.max(0, first), last];
}
function solve3(m, v) {
	const det = (a) => a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
	const d = det(m);
	if (!Number.isFinite(d) || Math.abs(d) < 1e-12) return null;
	const col = (i) => m.map((row, r) => row.map((x, c) => c === i ? v[r] : x));
	return [
		det(col(0)) / d,
		det(col(1)) / d,
		det(col(2)) / d
	];
}
function measureGrain(img, isScreen, ch, kind, t) {
	const { width, height, rgb } = img;
	const ss = [
		0,
		0,
		0
	];
	let k = 0;
	for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
		const p = y * width + x;
		if (isScreen[p] === 0) continue;
		let all = true;
		for (let dy = -1; dy <= 1 && all; dy++) for (let dx = -1; dx <= 1; dx++) if (isScreen[p + dy * width + dx] === 0) {
			all = false;
			break;
		}
		if (!all) continue;
		for (let c = 0; c < 3; c++) {
			let s = 0;
			for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += rgb[(p + dy * width + dx) * 3 + c];
			const d = rgb[p * 3 + c] - s / 9;
			ss[c] += d * d;
		}
		k++;
	}
	if (k === 0) return null;
	const sd = [
		0,
		1,
		2
	].map((c) => Math.sqrt(ss[c] / k * 9 / 8));
	const level = sd[ch];
	const grainy = level > t.grainAbove;
	const steps = level * 255;
	return {
		stdDev: r4rgb(sd),
		level: r4(level),
		steps8bit: Math.round(steps * 100) / 100,
		samples: k,
		grainy,
		reading: `grain: ${kind} varies by ${level.toFixed(4)} (standard deviation, about ${steps.toFixed(1)} 8-bit steps) about its local mean` + (grainy ? "; grainy enough to break a hard matte into specks and chatter, so try Keylight's Screen Pre-blur before raising Clip Black" : "; fine enough not to need pre-blur")
	};
}
var SCREEN_DEFAULTS, SCREEN_COLOUR_NOTE, r4, r4rgb, luma, CH, BINS;
function init_screen() {
	return (init_screen = __esmMin((() => {
		init_matte();
		SCREEN_DEFAULTS = {
			screen: "auto",
			minExcess: .04,
			minDominance: .15,
			minScreenShare: .02,
			opaque: 1 - 2 / 255,
			columns: "auto",
			rows: "auto",
			minCellShare: .25,
			nearSkip: "auto",
			nearBand: "auto",
			unevenRatio: 1.1,
			grainAbove: .01
		};
		SCREEN_COLOUR_NOTE = "Colours are capture values: the opaque pixels of the render as saveFrameToPng wrote them, so the comp background does not mix in. In a project with no working space (8 bpc, as measured live in After Effects 2027) these are the footage's own 0..1 values, the scale Keylight's Screen Colour takes, so colour.nearSubject (or colour.median) can go to key.keylight's screenColour as it is. In a colour-managed project they are working-space values scaled by After Effects' capture transfer; that has not been checked against Keylight, so confirm the key with the Screen Matte and Status views. Measure the source un-keyed (Keylight View 'source', or the key off, and isolate the layer): a keyed render has no screen left, and Keylight despills what it outputs.";
		r4 = (v) => Math.round(v * 1e4) / 1e4;
		r4rgb = (v) => [
			r4(v[0]),
			r4(v[1]),
			r4(v[2])
		];
		luma = (c) => .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
		CH = {
			green: 1,
			blue: 2
		};
		BINS = 65536;
	})))();
}

// color/settled-read.js
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function settleTimeoutFor(frames, pixelsPerFrame) {
	const n = Math.max(1, Math.floor(frames));
	const perFrame = Math.max(SETTLE_MIN_PER_FRAME_MS, Math.round(SETTLE_PER_HD_FRAME_MS * Math.max(0, pixelsPerFrame) / HD_PIXELS));
	return SETTLE_BASE_MS + (n - 1) * perFrame;
}
async function stampFiles(paths) {
	return Promise.all(paths.map(async (p) => {
		try {
			const st = await promises.stat(p, { bigint: true });
			return {
				exists: true,
				size: Number(st.size),
				mtimeNs: st.mtimeNs,
				ino: st.ino
			};
		} catch {
			return {
				exists: false,
				size: 0,
				mtimeNs: 0n,
				ino: 0n
			};
		}
	}));
}
async function endsWithIend(p, size) {
	if (size < IEND.length) return false;
	let fh = null;
	try {
		fh = await promises.open(p, "r");
		const tail = Buffer.alloc(IEND.length);
		await fh.read(tail, 0, IEND.length, size - IEND.length);
		return tail.equals(IEND);
	} catch {
		return false;
	} finally {
		await fh?.close();
	}
}
async function waitForSettled(paths, opts) {
	const stableMs = opts.stableMs ?? 250;
	const start = Date.now();
	let deadline = start + opts.timeoutMs;
	const done = /* @__PURE__ */ new Set();
	const state = paths.map(() => ({
		size: -1,
		changedAt: start,
		status: "missing"
	}));
	for (;;) {
		const before = done.size;
		await Promise.all(paths.map(async (p, i) => {
			if (done.has(i)) return;
			const s = state[i];
			let st = null;
			try {
				st = await promises.stat(p, { bigint: true });
			} catch {}
			if (st === null) {
				s.status = "missing";
				s.size = -1;
				return;
			}
			const size = Number(st.size);
			const was = opts.before?.[i];
			if (was?.exists && was.size === size && was.mtimeNs === st.mtimeNs && was.ino === st.ino) {
				s.status = "unchanged";
				s.size = size;
				return;
			}
			if (size !== s.size) {
				s.size = size;
				s.changedAt = Date.now();
			}
			if (size === 0) {
				s.status = "empty";
				return;
			}
			s.status = "writing";
			if (await endsWithIend(p, size) || Date.now() - s.changedAt >= stableMs) done.add(i);
		}));
		if (opts.stallMs !== void 0 && done.size > before) deadline = Math.max(deadline, Date.now() + opts.stallMs);
		if (done.size === paths.length || Date.now() > deadline) break;
		await sleep(POLL_MS);
	}
	const settled = [...done].sort((a, b) => a - b);
	const unsettled = [];
	for (const [i, p] of paths.entries()) {
		if (done.has(i)) continue;
		unsettled.push({
			index: i,
			path: p,
			state: state[i].status,
			bytes: Math.max(0, state[i].size)
		});
	}
	return {
		settled,
		unsettled,
		waitedMs: Date.now() - start,
		timeoutMs: opts.timeoutMs,
		...opts.stallMs !== void 0 ? { stallMs: opts.stallMs } : {}
	};
}
async function readFileSettled(filePath, timeoutMs = SETTLE_BASE_MS, stableMs = 250) {
	if ((await waitForSettled([filePath], {
		timeoutMs,
		stableMs
	})).settled.length === 0) throw new Error(`file did not settle within ${timeoutMs}ms (saveFrameToPng writes asynchronously): ${filePath}`);
	return promises.readFile(filePath);
}
var SETTLE_BASE_MS, SETTLE_PER_HD_FRAME_MS, SETTLE_MIN_PER_FRAME_MS, HD_PIXELS, POLL_MS, IEND;
function init_settled_read() {
	return (init_settled_read = __esmMin((() => {
		SETTLE_BASE_MS = 15e3;
		SETTLE_PER_HD_FRAME_MS = 3e3;
		SETTLE_MIN_PER_FRAME_MS = 1e3;
		HD_PIXELS = 2073600;
		POLL_MS = 60;
		IEND = Buffer.from([
			0,
			0,
			0,
			0,
			73,
			69,
			78,
			68,
			174,
			66,
			96,
			130
		]);
	})))();
}

// color/calibration.js
function calibrationKey(projectFile, workingSpace, bitsPerChannel) {
	return `${projectFile ?? "(unsaved)"}|${workingSpace}|${bitsPerChannel}`;
}
function analyzeCalibrationPng(buf) {
	const img = decodePng(buf);
	const samples = [];
	for (let i = 0; i < CALIB_VALUES.length; i++) {
		const x = PATCH * i + PATCH / 2;
		const y = Math.floor(img.height / 2);
		samples.push({
			input: CALIB_VALUES[i],
			output: img.rgb[(y * img.width + x) * 3]
		});
	}
	const ratios = samples.map((s) => s.output / s.input);
	const min = Math.min(...ratios);
	const max = Math.max(...ratios);
	if (min > 0 && max / min < 1.03) {
		const scale = ratios.reduce((a, b) => a + b, 0) / ratios.length;
		if (Math.abs(scale - 1) < .02) return {
			kind: "identity",
			scale: 1,
			samples
		};
		return {
			kind: "linear",
			scale,
			samples
		};
	}
	return {
		kind: "unknown",
		scale: 1,
		samples
	};
}
async function measureCaptureTransfer(transport, key, allowRender = true) {
	const cached = cache.get(key);
	if (cached) return cached;
	if (!allowRender) return { error: "calibration needs a (transient, undo-grouped) render of a temporary comp, which read-only mode forbids" };
	const pngPath = path$1.join(os$1.tmpdir(), `mcp-ae-calib-${randomUUID()}.png`).replace(/\\/g, "/");
	const code = `
        var _vals = ${jsxVal(CALIB_VALUES)};
        var _patch = ${jsxVal(PATCH)};
        var _w = _patch * _vals.length;
        var _tmp = app.project.items.addComp("__mcp_calibration__", _w, _patch, 1, 1, 24);
        var _srcs = [];
        var _out = { ok: true };
        try {
            for (var _i = 0; _i < _vals.length; _i++) {
                var _v = _vals[_i];
                var _s = _tmp.layers.addSolid([_v, _v, _v], "c" + _i, _patch, _patch, 1);
                if (_s.source) _srcs.push(_s.source);
                _s.property("Transform").property("Position").setValue([_patch * _i + _patch / 2, _patch / 2]);
            }
            _tmp.saveFrameToPng(0, new File(${jsxVal(pngPath)}));
            _out.saved = true;
        } catch (eCal) { _out.ok = false; _out.error = AE.errText(eCal); }
        try { _tmp.remove(); } catch (eRm) { /* leave for undo */ }
        for (var _j = 0; _j < _srcs.length; _j++) { try { _srcs[_j].remove(); } catch (eRs) { } }
        return _out;
    `;
	const result = await transport.execute({
		code,
		label: "capture_calibration",
		timeoutMs: 6e4
	});
	if (!result.ok) return { error: `calibration render failed: ${result.error}` };
	const payload = result.result;
	if (!payload || payload.ok !== true || payload.saved !== true) return { error: `calibration failed inside AE: ${payload?.error ?? "no result"}` };
	let buf;
	try {
		buf = await readFileSettled(pngPath);
	} catch (err) {
		return { error: `calibration PNG unreadable: ${err instanceof Error ? err.message : String(err)}` };
	} finally {
		promises.unlink(pngPath).catch(() => {});
	}
	try {
		const analysis = analyzeCalibrationPng(buf);
		cache.set(key, analysis);
		return analysis;
	} catch (err) {
		return { error: `calibration analysis failed: ${err instanceof Error ? err.message : String(err)}` };
	}
}
var CALIB_VALUES, PATCH, cache;
function init_calibration() {
	return (init_calibration = __esmMin((() => {
		init_registry();
		init_png16();
		init_settled_read();
		CALIB_VALUES = [
			.05,
			.18,
			.5,
			1
		];
		PATCH = 40;
		cache = /* @__PURE__ */ new Map();
	})))();
}

// color/transform.js
function srgbEncode(x) {
	const v = Math.min(1, Math.max(0, x));
	return v <= .0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - .055;
}
function apply(m, r, g, b) {
	return [
		m[0][0] * r + m[0][1] * g + m[0][2] * b,
		m[1][0] * r + m[1][1] * g + m[1][2] * b,
		m[2][0] * r + m[2][1] * g + m[2][2] * b
	];
}
function rrtOdtFit(v) {
	return (v * (v + .0245786) - 90537e-9) / (v * (.983729 * v + .432951) + .238081);
}
function sceneLinearToDisplaySrgb(rgb, toRec709) {
	for (let i = 0; i < rgb.length; i += 3) {
		let [r, g, b] = apply(toRec709, rgb[i], rgb[i + 1], rgb[i + 2]);
		r = Math.max(0, r);
		g = Math.max(0, g);
		b = Math.max(0, b);
		[r, g, b] = apply(HILL_IN, r, g, b);
		r = rrtOdtFit(r);
		g = rrtOdtFit(g);
		b = rrtOdtFit(b);
		[r, g, b] = apply(HILL_OUT, r, g, b);
		rgb[i] = srgbEncode(r);
		rgb[i + 1] = srgbEncode(g);
		rgb[i + 2] = srgbEncode(b);
	}
}
function profileForWorkingSpace(workingSpace) {
	const ws = workingSpace.toLowerCase();
	if (ws.includes("acescg")) return {
		toRec709: AP1_TO_REC709,
		note: "ACEScg → sRGB via ACES output transform (RRT+ODT fit)"
	};
	if (ws.includes("aces2065") || ws.includes("aces 2065")) return {
		toRec709: AP0_TO_REC709,
		note: "ACES2065-1 → sRGB via ACES output transform (RRT+ODT fit)"
	};
	if (ws.includes("scene-referred rec.709") || ws.includes("linear rec.709")) return {
		toRec709: IDENTITY,
		note: "linear Rec.709 → sRGB via ACES output transform (RRT+ODT fit)"
	};
	return null;
}
var AP1_TO_REC709, AP0_TO_REC709, IDENTITY, HILL_IN, HILL_OUT;
function init_transform() {
	return (init_transform = __esmMin((() => {
		AP1_TO_REC709 = [
			[
				1.70505099,
				-.62179212,
				-.08325887
			],
			[
				-.13025642,
				1.1408047,
				-.01054832
			],
			[
				-.02400336,
				-.12896898,
				1.15297233
			]
		];
		AP0_TO_REC709 = [
			[
				2.52140088,
				-1.13399574,
				-.38756249
			],
			[
				-.27621892,
				1.37259556,
				-.09628267
			],
			[
				-.01538264,
				-.15292998,
				1.16835777
			]
		];
		IDENTITY = [
			[
				1,
				0,
				0
			],
			[
				0,
				1,
				0
			],
			[
				0,
				0,
				1
			]
		];
		HILL_IN = [
			[
				.59719,
				.35458,
				.04823
			],
			[
				.076,
				.90834,
				.01566
			],
			[
				.0284,
				.13383,
				.83777
			]
		];
		HILL_OUT = [
			[
				1.60475,
				-.53108,
				-.07367
			],
			[
				-.10208,
				1.10813,
				-.00605
			],
			[
				-.00327,
				-.07276,
				1.07602
			]
		];
	})))();
}

// color/look.js
function pieceMeasures(p) {
	const r = p.report, out = [];
	const add = (def, v) => {
		if (typeof v === "number" && Number.isFinite(v)) out.push({
			def,
			value: v
		});
	};
	add(P("levels.black", "levels", "black point", "", "add", D.levelStep, 3), r.levels.lumaBlack);
	add(P("levels.white", "levels", "white point", "", "add", D.levelStep, 3), r.levels.lumaWhite);
	add(P("levels.mean", "levels", "mean level", "", "add", D.levelStep, 3), r.levels.lumaMean);
	for (const g of r.regions) {
		add(P(`region.${g.name}.L`, "colour by region", `lightness (L*) at ${g.name}`, "", "add", D.lightnessStep, 1), g.colour.L);
		add(P(`region.${g.name}.a`, "colour by region", `a* at ${g.name}`, "", "add", D.castStep, 1), g.colour.a);
		add(P(`region.${g.name}.b`, "colour by region", `b* at ${g.name}`, "", "add", D.castStep, 1), g.colour.b);
	}
	add(P("texture.edge", "texture", "edge width", " px", "ratio", D.ratioStep, 2), r.sharpness.edgeWidth);
	add(P("texture.grain", "texture", "grain", "", "ratio", D.ratioStep, 2, .05), r.grain);
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
		add(P("rhythm.calmRun", "rhythm", "calm run, median", " s", "ratio", D.ratioStep, 2, .1), rh.census.calmRunMedian);
		add(P("rhythm.bursts", "rhythm", "bursts every 10 s", "", "ratio", D.ratioStep, 2, .2), rh.census.burstsPer10s);
		add(P("rhythm.shotMedian", "rhythm", "shot length, median", " s", "ratio", D.ratioStep, 2, .2), rh.shots.medianSeconds);
		add(P("rhythm.cutsPerMinute", "rhythm", "cuts a minute", "", "ratio", D.ratioStep, 1, 1), rh.shots.cutsPerMinute);
	}
	const t = p.type;
	if (t) {
		add(P("type.sizeMedian", "type", "text size, median (share of frame height)", "", "ratio", D.ratioStep, 3, .005), t.sizeMedian);
		add(P("type.sizeLargest", "type", "largest text size (share of frame height)", "", "ratio", D.ratioStep, 3, .005), t.sizeLargest);
		add(P("type.tracking", "type", "tracking, median", "", "add", 10, 0), t.trackingMedian);
	}
	return out;
}
function buildSheet(pieces) {
	const n = pieces.length, byKey = /* @__PURE__ */ new Map();
	for (const { piece } of pieces) for (const v of pieceMeasures(piece)) {
		if (!byKey.has(v.def.key)) byKey.set(v.def.key, []);
		byKey.get(v.def.key).push(v);
	}
	const measures = [];
	for (const vals of byKey.values()) {
		const def = vals[0].def, xs = vals.map((v) => v.value), min = Math.min(...xs), max = Math.max(...xs);
		const spreadSteps = (lv(def, max) - lv(def, min)) / lstep(def);
		const look = spreadSteps <= LOOK_RULES.lookSteps + 1e-9;
		measures.push({
			...def,
			median: median(xs),
			min,
			max,
			pieces: vals.length,
			look,
			...look ? {} : { why: `varies in your pieces: ${fmt$1(def, min)} to ${fmt$1(def, max)}, ${spreadSteps.toFixed(1)} steps apart (a look holds within ${LOOK_RULES.lookSteps})` }
		});
	}
	const clusters = [];
	pieces.forEach(({ piece }, i) => {
		for (const c of piece.report.palette.filter((c2) => c2.share >= LOOK_RULES.colourShare)) {
			const lab = [
				c.colour.L,
				c.colour.a,
				c.colour.b
			];
			const hit = clusters.find((k) => dE(k.lab, lab) <= D.colourMatch);
			if (hit) {
				hit.members.push({
					i,
					share: c.share,
					lab
				});
				const m = hit.members;
				hit.lab = [
					0,
					1,
					2
				].map((d) => m.reduce((s, x) => s + x.lab[d], 0) / m.length);
			} else clusters.push({
				lab,
				members: [{
					i,
					share: c.share,
					lab
				}]
			});
		}
	});
	const palette = clusters.map((k) => {
		const per = /* @__PURE__ */ new Map();
		for (const m of k.members) per.set(m.i, (per.get(m.i) ?? 0) + m.share);
		const shares = [...per.values()];
		return {
			hex: hexOfLab(k.lab),
			lab: k.lab.map((v) => Math.round(v * 10) / 10),
			pieces: per.size,
			ofPieces: n,
			shareMin: Math.round(Math.min(...shares) * 1e3) / 1e3,
			shareMax: Math.round(Math.max(...shares) * 1e3) / 1e3,
			look: per.size >= Math.ceil(LOOK_RULES.colourPieces * n - 1e-9)
		};
	}).sort((a, b) => b.pieces - a.pieces || b.shareMax - a.shareMax);
	const typed = pieces.filter((p) => p.piece.type);
	const fontCount = /* @__PURE__ */ new Map();
	for (const p of typed) for (const f of new Set(p.piece.type.fonts)) fontCount.set(f, (fontCount.get(f) ?? 0) + 1);
	const rhythmless = pieces.filter((p) => !p.piece.rhythm).map((p) => p.piece.label);
	return {
		kind: "look-sheet",
		version: 1,
		pieces: pieces.map(({ piece, file }) => ({
			label: piece.label,
			file,
			source: piece.source
		})),
		rules: LOOK_RULES,
		standing: standingOf(n),
		measures,
		palette,
		type: typed.length ? {
			fonts: [...fontCount].map(([font, k]) => ({
				font,
				pieces: k
			})).sort((a, b) => b.pieces - a.pieces),
			pieces: typed.length
		} : null,
		notMeasured: [
			...typed.length < n ? [`type (fonts, sizes, tracking): read only from a project, ${typed.length} of ${n} pieces had one; from a movie alone it is not measurable`] : [],
			...rhythmless.length ? [`rhythm for ${rhythmless.join(", ")}: needs the piece as a movie read by ffmpeg`] : [],
			"a cut-out's edge (not in version 1)",
			"the tracker's per-move numbers (not reliable enough to average)"
		],
		notes: ["The sheet describes what these pieces did, not what a new piece must do."]
	};
}
function compareWithSheet(sheet, piece) {
	const values = new Map(pieceMeasures(piece).map((v) => [v.def.key, v.value]));
	const n = sheet.pieces.length, of = (k) => `${k} piece${k === 1 ? "" : "s"}`;
	const diffs = [], inside = [], notCompared = [];
	for (const m of sheet.measures) {
		const v = values.get(m.key);
		if (!m.look) {
			notCompared.push(`${m.name} (${m.why})`);
			continue;
		}
		if (v === void 0) {
			if (m.group === "rhythm" || m.group === "type") notCompared.push(`${m.name} (not measured on this piece)`);
			continue;
		}
		const def = m, lo = lv(def, m.min), hi = lv(def, m.max), x = lv(def, v), st = lstep(def);
		const beyond = x < lo - st ? (lo - x) / st : x > hi + st ? (x - hi) / st : 0;
		if (!beyond) {
			inside.push(m.name);
			continue;
		}
		const range = m.min === m.max ? `your ${of(m.pieces)}: ${fmt$1(def, m.min)}` : `your pieces sit between ${fmt$1(def, m.min)} and ${fmt$1(def, m.max)} (${of(m.pieces)})`;
		const size = Math.round(beyond * 10) / 10;
		diffs.push({
			measure: m.name,
			size,
			value: Number(v.toFixed(m.digits)),
			range: [m.min, m.max],
			pieces: m.pieces,
			reading: `${m.name} ${fmt$1(def, v)}; ${range} (${size} step${size === 1 ? "" : "s"} outside).`
		});
	}
	const pal = piece.report.palette.map((c) => ({
		hex: c.hex,
		share: c.share,
		lab: [
			c.colour.L,
			c.colour.a,
			c.colour.b
		]
	}));
	for (const c of sheet.palette.filter((c2) => c2.look)) if (!pal.some((p) => dE(p.lab, c.lab) <= D.colourMatch)) diffs.push({
		measure: "main colours",
		size: 1,
		value: "missing",
		pieces: c.pieces,
		reading: `${c.hex} is missing; ${c.pieces} of your ${of(n)} carry it (${Math.round(c.shareMin * 100)} to ${Math.round(c.shareMax * 100)} % of the frame).`
	});
	for (const p of pal.filter((p2) => p2.share >= LOOK_RULES.newColourShare)) if (!sheet.palette.some((c) => dE(p.lab, c.lab) <= D.colourMatch)) diffs.push({
		measure: "main colours",
		size: 1,
		value: p.hex,
		pieces: n,
		reading: `${p.hex} covers ${Math.round(p.share * 100)} % of the frame; none of your ${of(n)} has a colour like it.`
	});
	if (sheet.type && piece.type) {
		const known = new Set(sheet.type.fonts.map((f) => f.font));
		const fresh = piece.type.fonts.filter((f) => !known.has(f));
		if (fresh.length) diffs.push({
			measure: "fonts",
			size: 1,
			value: fresh.join(", "),
			pieces: sheet.type.pieces,
			reading: `${fresh.join(", ")} ${fresh.length === 1 ? "is" : "are"} not in your pieces; they use ${sheet.type.fonts.map((f) => f.font).join(", ")} (${of(sheet.type.pieces)} with a project).`
		});
	}
	diffs.sort((a, b) => b.size - a.size);
	return {
		ok: true,
		against: "look sheet",
		standing: sheet.standing,
		differences: diffs,
		insideTheLook: inside,
		notCompared,
		reading: (diffs.length ? `${diffs.length} difference${diffs.length === 1 ? "" : "s"} from your ${sheet.standing.split(":")[0]}, largest first: ${diffs.map((d) => d.reading).join(" ")}` : `Within your pieces' range on every measure of the look (${sheet.standing.split(":")[0]}).`) + (n < LOOK_RULES.fewPieces && diffs.length ? ` ${FEW_PIECES_NOTE}` : "")
	};
}
function standingBase(s) {
	return s.standing.split(`. ${FEW_PIECES_NOTE}`)[0];
}
function isSheet(x) {
	return !!x && typeof x === "object" && x.kind === "look-sheet";
}
function isPiece(x) {
	return !!x && typeof x === "object" && x.kind === "look-piece";
}
function sheetMarkdown(s) {
	const of = (k) => `${k} piece${k === 1 ? "" : "s"}`;
	const row = (m) => {
		const d = m;
		return `| ${m.name} | ${fmt$1(d, m.median)} | ${m.min === m.max ? fmt$1(d, m.min) : `${fmt$1(d, m.min)} to ${fmt$1(d, m.max)}`} | ${m.pieces} |`;
	};
	const groups = [...new Set(s.measures.map((m) => m.group))];
	const base = standingBase(s);
	const lines = [
		`# Look sheet`,
		"",
		`${base[0].toUpperCase()}${base.slice(1)}: ${s.pieces.map((p) => p.label).join(", ")}.`,
		"",
		...s.pieces.length < LOOK_RULES.fewPieces ? [FEW_PIECES_NOTE, ""] : [],
		...s.notes.map((x) => `- ${x}`),
		""
	];
	for (const g of groups) {
		const look = s.measures.filter((m) => m.group === g && m.look);
		if (!look.length) continue;
		lines.push(`## ${g[0].toUpperCase()}${g.slice(1)}`, "", "| Measure | Middle | Range | Pieces |", "|---|---|---|---|", ...look.map(row), "");
		if (g === "rhythm") lines.push(SHOT_LIMIT, "");
	}
	const varies = s.measures.filter((m) => !m.look);
	if (varies.length) lines.push("## Varies in your pieces (not compared)", "", ...varies.map((m) => `- ${m.name}: ${m.why}`), "");
	lines.push("## Main colours", "", "| Colour | Pieces | Share of the frame | Part of the look |", "|---|---|---|---|", ...s.palette.map((c) => `| ${c.hex} | ${c.pieces} of ${c.ofPieces} | ${Math.round(c.shareMin * 100)} to ${Math.round(c.shareMax * 100)} % | ${c.look ? "yes" : "no"} |`), "");
	if (s.type) lines.push("## Type", "", `From ${of(s.type.pieces)} with a project: ${s.type.fonts.map((f) => `${f.font} (${f.pieces})`).join(", ")}.`, "");
	lines.push("## Not measured", "", ...s.notMeasured.map((x) => `- ${x}`), "");
	return lines.join("\n");
}
var LOOK_RULES, FEW_PIECES_NOTE, D, P, median, lv, lstep, fmt$1, dE, hexOfLab, SHOT_LIMIT, standingOf;
function init_look() {
	return (init_look = __esmMin((() => {
		init_sheet();
		LOOK_RULES = {
			/** A measure is part of the look when its range across pieces is within this many of its comparison steps. */
			lookSteps: 3,
			/** A main colour is part of the look when this share of the pieces carry it (at least two thirds). */
			colourPieces: 2 / 3,
			/** Main colours under this share of a piece are left out of its palette. */
			colourShare: .02,
			/** A build's colour this large with nothing like it in the pieces is named. */
			newColourShare: .05,
			/** Pieces before a sheet is called a look. */
			lookPieces: 3,
			/** Under this many pieces the ranges are narrow, and every reading says so. */
			fewPieces: 8
		};
		FEW_PIECES_NOTE = "With this few pieces, a piece of the same look will sit just outside several ranges: read the largest differences first, and add approved pieces to widen the sheet.";
		D = REFERENCE_DEFAULTS;
		P = (key, group, name, unit, how, step, digits, floor) => ({
			key,
			group,
			name,
			unit,
			how,
			step,
			digits,
			...floor ? { floor } : {}
		});
		median = (a) => {
			const s = [...a].sort((x, y) => x - y);
			const m = s.length >> 1;
			return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
		};
		lv = (def, v) => def.how === "ratio" ? Math.log(Math.max(v, def.floor ?? 1e-6)) : v;
		lstep = (def) => def.how === "ratio" ? Math.log(def.step) : def.step;
		fmt$1 = (def, v) => `${Number(v.toFixed(def.digits))}${def.unit}`;
		dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
		hexOfLab = (lab) => {
			const fy = (lab[0] + 16) / 116, fx = fy + lab[1] / 500, fz = fy - lab[2] / 200, inv = (t) => t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27);
			const X = inv(fx) * .95047, Y = inv(fy), Z = inv(fz) * 1.08883;
			return "#" + [
				3.2406 * X - 1.5372 * Y - .4986 * Z,
				-.9689 * X + 1.8758 * Y + .0415 * Z,
				.0557 * X - .204 * Y + 1.057 * Z
			].map((u) => Math.round(255 * Math.max(0, Math.min(1, u <= .0031308 ? 12.92 * u : 1.055 * u ** (1 / 2.4) - .055)))).map((v) => v.toString(16).padStart(2, "0")).join("");
		};
		SHOT_LIMIT = "Shot lengths come from video.shots, which can read a change inside a shot (a launch, a flip) as a cut, so a shot can read shorter than it is.";
		standingOf = (n) => `${n <= 1 ? "one piece: these are its own numbers, not a range" : n < LOOK_RULES.lookPieces ? `${n} pieces: a range, not yet a look` : `${n} pieces: a look`}${n < LOOK_RULES.fewPieces ? `. ${FEW_PIECES_NOTE}` : ""}`;
	})))();
}

// color/watch.js
function resolveWatchThresholds(args = {}) {
	const out = { ...WATCH_DEFAULTS };
	for (const key of Object.keys(WATCH_DEFAULTS)) {
		const v = args[key];
		if (typeof v === "number" || v === null && LIMITS[key].nullable) out[key] = v;
	}
	return out;
}
function watchArgsError(args) {
	for (const [key, value] of Object.entries(args)) {
		const limit = LIMITS[key];
		if (!limit) return `\`thresholds.${key}\` is not an option (options: ${Object.keys(LIMITS).join(", ")})`;
		if (value === null && limit.nullable) continue;
		if (typeof value !== "number" || !Number.isFinite(value)) return `\`thresholds.${key}\` must be a number${limit.nullable ? " or null" : ""}`;
		if ((limit.above ? value <= limit.min : value < limit.min) || value > limit.max || limit.int && !Number.isInteger(value)) {
			const range = limit.above ? `above ${limit.min} and at most ${limit.max}` : `${limit.min} to ${limit.max}`;
			return `\`thresholds.${key}\` must be ${limit.int ? "a whole number " : ""}${range}, not ${value}`;
		}
	}
	return null;
}
function measureFrame(pic, width, height, t) {
	let luma = 0;
	let dark = 0;
	let light = 0;
	let hr = 0;
	let hg = 0;
	let hb = 0;
	let ha = 0;
	let lr = 0;
	let lg = 0;
	let lb = 0;
	let la = 0;
	let hx0 = width;
	let hy0 = height;
	let hx1 = -1;
	let hy1 = -1;
	let lx0 = width;
	let ly0 = height;
	let lx1 = -1;
	let ly1 = -1;
	const { darkBelow, lightAbove } = t;
	for (let y = 0; y < height; y++) {
		let i = y * width * 3;
		for (let x = 0; x < width; x++, i += 3) {
			const r = pic[i];
			const g = pic[i + 1];
			const b = pic[i + 2];
			luma += .2126 * r + .7152 * g + .0722 * b;
			const max = r > g ? r > b ? r : b : g > b ? g : b;
			const min = r < g ? r < b ? r : b : g < b ? g : b;
			if (max <= darkBelow) dark++;
			if (min >= lightAbove) light++;
			if (max >= .9980392156862745) {
				if (r >= .9980392156862745) hr++;
				if (g >= .9980392156862745) hg++;
				if (b >= .9980392156862745) hb++;
				if (min >= .9980392156862745) {
					ha++;
					if (x < hx0) hx0 = x;
					if (x > hx1) hx1 = x;
					if (y < hy0) hy0 = y;
					if (y > hy1) hy1 = y;
				}
			}
			if (min <= .00196078431372549) {
				if (r <= .00196078431372549) lr++;
				if (g <= .00196078431372549) lg++;
				if (b <= .00196078431372549) lb++;
				if (max <= .00196078431372549) {
					la++;
					if (x < lx0) lx0 = x;
					if (x > lx1) lx1 = x;
					if (y < ly0) ly0 = y;
					if (y > ly1) ly1 = y;
				}
			}
		}
	}
	const n = width * height || 1;
	const box = (x0, y0, x1, y1) => x1 < 0 ? null : {
		x: x0,
		y: y0,
		width: x1 - x0 + 1,
		height: y1 - y0 + 1
	};
	return {
		meanLuma: r6(luma / n),
		darkShare: r6(dark / n),
		lightShare: r6(light / n),
		clipHigh: {
			r: r6(hr / n),
			g: r6(hg / n),
			b: r6(hb / n),
			all: r6(ha / n),
			box: box(hx0, hy0, hx1, hy1)
		},
		clipLow: {
			r: r6(lr / n),
			g: r6(lg / n),
			b: r6(lb / n),
			all: r6(la / n),
			box: box(lx0, ly0, lx1, ly1)
		}
	};
}
var WATCH_DEFAULTS, LIMITS, TOP_CODE, BOTTOM_CODE, r6, fmt, secs, PieceWatcher;
function init_watch() {
	return (init_watch = __esmMin((() => {
		init_motion();
		WATCH_DEFAULTS = {
			changeAbove: DIFF_DEFAULTS.changeAbove,
			spikeRatio: DIFF_DEFAULTS.spikeRatio,
			holdRatio: DIFF_DEFAULTS.holdRatio,
			quietBelow: DIFF_DEFAULTS.quietBelow,
			movingShare: DIFF_DEFAULTS.movingShare,
			window: DIFF_DEFAULTS.window,
			repeatBelow: DIFF_DEFAULTS.repeatBelow,
			frozenSeconds: .5,
			frozenShare: 2e-5,
			darkBelow: .04,
			lightAbove: .96,
			blackShare: .99,
			blackMean: .01,
			whiteShare: .99,
			whiteMean: .99,
			clipHighShare: .005,
			clipLowShare: null
		};
		LIMITS = {
			changeAbove: {
				min: 0,
				max: 1
			},
			spikeRatio: {
				min: 1,
				max: 1e3,
				above: true
			},
			holdRatio: {
				min: 0,
				max: 1,
				above: true
			},
			quietBelow: {
				min: 0,
				max: 1
			},
			movingShare: {
				min: 0,
				max: 1
			},
			window: {
				min: 1,
				max: 16,
				int: true
			},
			repeatBelow: {
				min: 0,
				max: 1
			},
			frozenSeconds: {
				min: 0,
				max: 3600,
				above: true
			},
			frozenShare: {
				min: 0,
				max: 1
			},
			darkBelow: {
				min: 0,
				max: 1
			},
			lightAbove: {
				min: 0,
				max: 1
			},
			blackShare: {
				min: 0,
				max: 1,
				above: true
			},
			blackMean: {
				min: 0,
				max: 1
			},
			whiteShare: {
				min: 0,
				max: 1,
				above: true
			},
			whiteMean: {
				min: 0,
				max: 1
			},
			clipHighShare: {
				min: 0,
				max: 1,
				above: true
			},
			clipLowShare: {
				min: 0,
				max: 1,
				above: true,
				nullable: true
			}
		};
		TOP_CODE = 254.5 / 255;
		BOTTOM_CODE = .5 / 255;
		r6 = (v) => Math.round(v * 1e6) / 1e6;
		fmt = (v) => v.toFixed(4);
		secs = (v) => `${r6(v)} s`;
		PieceWatcher = class {
			t;
			o;
			prev = null;
			frames = [];
			/** Pairs, split where a frame is missing or the size changes. */
			segments = [[]];
			gaps = 0;
			measureMs = 0;
			constructor(opts) {
				this.t = opts.thresholds;
				this.o = opts;
			}
			/** Measure one frame (frames must arrive in increasing order) and keep only what the report needs. */
			add(f) {
				const t0 = performance.now();
				this.frames.push({
					frame: f.frame,
					m: measureFrame(f.pic, f.width, f.height, this.t)
				});
				const p = this.prev;
				if (p !== null) {
					if (!(f.frame === p.frame + this.o.every && f.width === p.width && f.height === p.height)) {
						this.gaps++;
						if (this.segments[this.segments.length - 1].length > 0) this.segments.push([]);
					} else {
						const { all } = pictureChange(p.pic, f.pic, f.width, f.height, {
							...this.t,
							amplify: 1
						});
						this.segments[this.segments.length - 1].push({
							from: p.frame,
							to: f.frame,
							change: all.change,
							changedShare: all.changedShare,
							changedBounds: all.changedBounds
						});
					}
				}
				this.prev = f;
				this.measureMs += performance.now() - t0;
			}
			point(frame) {
				return {
					frame,
					time: r6(frame * this.o.frameDuration)
				};
			}
			ownedFrame(frame) {
				const own = this.o.owned;
				return own === void 0 || frame >= own.from && frame <= own.to;
			}
			scaleBox(b) {
				if (b === null) return null;
				const s = this.o.scale;
				return {
					x: Math.floor(b.x * s),
					y: Math.floor(b.y * s),
					width: Math.ceil(b.width * s),
					height: Math.ceil(b.height * s)
				};
			}
			finish() {
				const t = this.t;
				const every = this.o.every;
				const notes = [];
				const flags = [];
				let pairCount = 0;
				for (const seg of this.segments) {
					pairCount += seg.length;
					if (seg.length === 0) continue;
					const series = seg.map((p) => ({
						from: {
							index: p.from,
							time: r6(p.from * this.o.frameDuration)
						},
						to: {
							index: p.to,
							time: r6(p.to * this.o.frameDuration)
						},
						change: p.change,
						changedShare: p.changedShare
					}));
					const summary = summarizeSeries(series, {
						...t,
						amplify: 1
					});
					for (const sf of summary.flags) {
						const flag = this.momentOf(sf, seg);
						if (this.ownedFrame(flag.frame)) flags.push(flag);
					}
				}
				flags.sort((a, b) => a.frame - b.frame);
				if (this.gaps > 0) notes.push(`${this.gaps} gap${this.gaps > 1 ? "s" : ""} in the checked frames (a capture missing, or the size changed): pairs were not compared across ${this.gaps > 1 ? "them" : "it"}`);
				if (every > 1) notes.push(`every ${every}: 1 frame in every ${every} was checked, so a one-frame pop or flash on a frame in between is missed; a stutter or repeat here means two frames ${every} apart look the same while the frames around them move; frozen and other stretches may run up to ${every - 1} frame${every > 2 ? "s" : ""} further at each end`);
				const owned = this.frames.filter((f) => this.ownedFrame(f.frame));
				const stretches = [
					...this.frozenStretches(),
					...this.frameStretches("near-black", (m) => m.darkShare >= t.blackShare || m.meanLuma <= t.blackMean ? 1 - m.meanLuma : null),
					...this.frameStretches("near-white", (m) => m.lightShare >= t.whiteShare || m.meanLuma >= t.whiteMean ? m.meanLuma : null),
					...this.frameStretches("clipped-high", (m) => m.clipHigh.all >= t.clipHighShare ? m.clipHigh.all : null),
					...t.clipLowShare === null ? [] : this.frameStretches("clipped-low", (m) => m.clipLow.all >= t.clipLowShare ? m.clipLow.all : null)
				].filter((s) => this.ownedFrame(s.from.frame) || this.ownedFrame(s.to.frame) || this.spansOwned(s));
				const order = [
					"frozen",
					"near-black",
					"near-white",
					"clipped-high",
					"clipped-low"
				];
				stretches.sort((a, b) => a.from.frame - b.from.frame || order.indexOf(a.kind) - order.indexOf(b.kind));
				let extremes = null;
				if (owned.length > 0) {
					let hi = {
						max: -1,
						frame: null
					};
					let lo = {
						max: -1,
						frame: null
					};
					let lmin = Infinity;
					let lmax = -Infinity;
					for (const f of owned) {
						lmin = Math.min(lmin, f.m.meanLuma);
						lmax = Math.max(lmax, f.m.meanLuma);
						if (f.m.clipHigh.all > hi.max) hi = {
							max: f.m.clipHigh.all,
							frame: f.frame
						};
						if (f.m.clipLow.all > lo.max) lo = {
							max: f.m.clipLow.all,
							frame: f.frame
						};
					}
					const changes = this.segments.flat().filter((p) => this.ownedFrame(p.to)).map((p) => p.change).sort((a, b) => a - b);
					if (hi.max <= 0) hi.frame = null;
					if (lo.max <= 0) lo.frame = null;
					extremes = {
						meanLuma: {
							min: lmin,
							max: lmax
						},
						clipHighAll: hi,
						clipLowAll: lo,
						pairChange: {
							median: changes.length > 0 ? changes[Math.floor((changes.length - 1) / 2)] : 0,
							max: changes.length > 0 ? changes[changes.length - 1] : 0
						}
					};
				}
				return {
					step: every,
					framesChecked: owned.length,
					pairs: pairCount,
					flags,
					stretches,
					extremes,
					notes
				};
			}
			spansOwned(s) {
				const own = this.o.owned;
				return own !== void 0 && s.from.frame < own.from && s.to.frame > own.to;
			}
			momentOf(sf, seg) {
				const every = this.o.every;
				const into = (frame2) => seg.find((p) => p.to === frame2);
				let frame;
				let fromFrame;
				if (sf.kind === "cut" && sf.between) {
					frame = sf.between[1].index;
					fromFrame = sf.between[0].index;
				} else {
					const ref = sf.frame ?? (sf.between ? sf.between[1] : void 0);
					frame = ref ? ref.index : seg[sf.pairs[0]].to;
				}
				const pair = into(frame);
				let reading = sf.reading;
				if (every > 1 && (sf.kind === "stutter" || sf.kind === "repeat")) reading += ` (1 frame in every ${every} checked: frames ${frame - every} and ${frame} look the same; a hold of at least ${every + 1} frames, or motion that came back to the same place)`;
				const flag = {
					kind: sf.kind,
					frame,
					time: r6(frame * this.o.frameDuration),
					change: sf.change,
					reference: sf.reference,
					ratio: sf.ratio,
					reading
				};
				if (fromFrame !== void 0) flag.fromFrame = fromFrame;
				if (pair) flag.box = this.scaleBox(pair.changedBounds);
				if (sf.atSeriesEdge) flag.atSeriesEdge = true;
				if (sf.besideRepeat) flag.besideRepeat = true;
				return flag;
			}
			edges(from, to, first, last) {
				const out = {};
				if (this.o.every > 1) out.uncertainFrames = this.o.every - 1;
				if (this.o.openStart && from === first) out.openStart = true;
				if (this.o.openEnd && to === last) out.openEnd = true;
				return out;
			}
			frozenStretches() {
				const t = this.t;
				const fd = this.o.frameDuration;
				const out = [];
				const first = this.frames[0]?.frame;
				const last = this.frames[this.frames.length - 1]?.frame;
				for (const seg of this.segments) {
					let i = 0;
					while (i < seg.length) {
						if (seg[i].changedShare > t.frozenShare) {
							i++;
							continue;
						}
						let j = i;
						let largest = seg[i].change;
						while (j + 1 < seg.length && seg[j + 1].changedShare <= t.frozenShare) {
							j++;
							largest = Math.max(largest, seg[j].change);
						}
						const from = seg[i].from;
						const to = seg[j].to;
						const frames = to - from + 1;
						const seconds = frames * fd;
						if (seconds >= t.frozenSeconds - 1e-9) out.push({
							kind: "frozen",
							from: this.point(from),
							to: this.point(to),
							frames,
							seconds: r6(seconds),
							...this.edges(from, to, first, last),
							largestChange: largest,
							reading: `no visible change from ${secs(from * fd)} to ${secs(to * fd)} (frames ${from} to ${to}, ${r6(seconds)} s): at most ${fmt(t.frozenShare * 100)}% of pixels changed by more than ${t.changeAbove} between checked frames. A held title or a still is legitimate; a stop in the middle of a move is not`
						});
						i = j + 1;
					}
				}
				return out;
			}
			/** Runs of consecutive checked frames whose `score` is not null; the worst is the highest score. */
			frameStretches(kind, score) {
				const fd = this.o.frameDuration;
				const every = this.o.every;
				const out = [];
				const first = this.frames[0]?.frame;
				const last = this.frames[this.frames.length - 1]?.frame;
				let run = [];
				const close = () => {
					if (run.length === 0) return;
					const from = run[0].frame;
					const to = run[run.length - 1].frame;
					let worst = run[0];
					for (const f of run) if (score(f.m) > score(worst.m)) worst = f;
					const frames = to - from + 1;
					const s = {
						kind,
						from: this.point(from),
						to: this.point(to),
						frames,
						seconds: r6(frames * fd),
						...this.edges(from, to, first, last),
						reading: ""
					};
					const when = `${secs(from * fd)} to ${secs(to * fd)} (frames ${from} to ${to})`;
					const m = worst.m;
					if (kind === "near-black" || kind === "near-white") {
						const share = kind === "near-black" ? m.darkShare : m.lightShare;
						s.worst = {
							frame: worst.frame,
							time: r6(worst.frame * fd),
							share,
							meanLuma: m.meanLuma
						};
						s.reading = `${kind} from ${when}: at worst (frame ${worst.frame}) mean luma ${fmt(m.meanLuma)}, ${fmt(share * 100)}% of pixels ${kind === "near-black" ? `at or below ${this.t.darkBelow}` : `at or above ${this.t.lightAbove}`} in every channel`;
					} else {
						const c = kind === "clipped-high" ? m.clipHigh : m.clipLow;
						let box = null;
						for (const f of run) {
							const b = (kind === "clipped-high" ? f.m.clipHigh : f.m.clipLow).box;
							if (b === null) continue;
							if (box === null) box = { ...b };
							else {
								const x1 = Math.max(box.x + box.width, b.x + b.width);
								const y1 = Math.max(box.y + box.height, b.y + b.height);
								box.x = Math.min(box.x, b.x);
								box.y = Math.min(box.y, b.y);
								box.width = x1 - box.x;
								box.height = y1 - box.y;
							}
						}
						s.box = this.scaleBox(box);
						s.worst = {
							frame: worst.frame,
							time: r6(worst.frame * fd),
							share: c.all,
							channels: {
								r: c.r,
								g: c.g,
								b: c.b
							}
						};
						const code = kind === "clipped-high" ? "255 (the top code)" : "0 (the bottom code)";
						s.reading = `${kind} from ${when}: at worst (frame ${worst.frame}) ${fmt(c.all * 100)}% of pixels at ${code} in all three channels (per channel r ${fmt(c.r * 100)}%, g ${fmt(c.g * 100)}%, b ${fmt(c.b * 100)}%)` + (s.box ? `, inside x ${s.box.x}..${s.box.x + s.box.width}, y ${s.box.y}..${s.box.y + s.box.height} (comp pixels)` : "");
					}
					out.push(s);
					run = [];
				};
				for (const f of this.frames) {
					const prev = run[run.length - 1];
					if (prev !== void 0 && f.frame !== prev.frame + every) close();
					if (score(f.m) === null) close();
					else run.push(f);
				}
				close();
				return out;
			}
		};
	})))();
}

export { EDGE_DEFAULTS, FEW_PIECES_NOTE, LOOK_RULES, PieceWatcher, SEEN_THROUGH_DEFAULTS, SPECK_DEFAULTS, alphaChange, analyzeCurve, analyzeFrame, buildSheet, calibrationKey, compareReferences, compareRegions, compareWithSheet, composeContactSheet, curveGraph, cutoutRegions, decodePng, diffArgsError, distanceTo, edgeArgsError, enclosedHoles, encodePngGray8, encodePngSrgb8, encodePngSrgbRgba8, flattenOver, frameLabel, furthestFrame, growMask, histogramOf, init_calibration, init_look, init_matte, init_motion, init_png16, init_screen, init_settled_read, init_sheet, init_transform, init_watch, isPiece, isSheet, labOf, lookArgsError, lookCrops, matteCoverage, measureCaptureTransfer, measureEdge, measureLook, measureScreen, outlineTracker, parseTiming, pictureChange, pictureOf, profileForWorkingSpace, referenceReader, resample, resolveDiffThresholds, resolveEdgeThresholds, resolveScreenThresholds, resolveWatchThresholds, rgbHex, sampleRegions, sceneLinearToDisplaySrgb, screenArgsError, seenThroughInside, settleTimeoutFor, sheetMarkdown, soundOnsets, speckPieces, stampFiles, standingBase, subjectTop, summarizeFlicker, summarizeLookSeries, summarizeSeries, syncReport, unmatte, waitForSettled, watchArgsError };
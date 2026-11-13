import { __esmMin } from "./rolldown-runtime.js";
import { AMBIENT_CONTEXT_JSX, PACKAGE_ROOT, denyAppConfig, denyOperation, denyUnregisteredCategory, denyUnregisteredOperation, errorResult, getOp, init_config, init_errors, init_opschema, init_policy, init_registry, init_validate, jsxVal, listOps, policySummary, prepareOp, readOnlyMode, rejectedOutputPath, suggestName, summarizeParams, validateAeProjectDoc, validateOpArgs, wantsDialogSuppression, wantsRollback, wantsUndoGroup } from "./core-1.js";
import { init_instances, instanceLabel, listInstances, resolveTarget } from "./transport-1.js";
import { COMP_CORNERS_FN, COMP_INFO_FN, LAYER_FULL_FN, LIST_MISSING_FONTS_FN, LIST_MISSING_FOOTAGE_FN, MISSING_SOURCES_FN, OCIO_CAPTURE_FN, RENDER_FRAME_FN, init_snippets } from "./operations-4.js";
import { PieceWatcher, alphaChange, analyzeFrame, calibrationKey, compareRegions, composeContactSheet, decodePng, diffArgsError, edgeArgsError, encodePngGray8, encodePngSrgb8, encodePngSrgbRgba8, flattenOver, frameLabel, histogramOf, init_calibration, init_matte, init_motion, init_png16, init_screen, init_settled_read, init_sheet, init_transform, init_watch, lookArgsError, lookCrops, measureCaptureTransfer, measureEdge, measureLook, measureScreen, pictureChange, pictureOf, profileForWorkingSpace, resample, resolveDiffThresholds, resolveEdgeThresholds, resolveScreenThresholds, resolveWatchThresholds, rgbHex, sampleRegions, sceneLinearToDisplaySrgb, screenArgsError, settleTimeoutFor, stampFiles, summarizeFlicker, summarizeLookSeries, summarizeSeries, unmatte, waitForSettled, watchArgsError } from "./color-1.js";
import { promises, readFileSync, realpathSync } from "node:fs";
import * as os from "node:os";
import * as path$1 from "node:path";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";

// tools/capture-shared.js
function validRgb(value) {
	return Array.isArray(value) && value.length === 3 && value.every((v) => typeof v === "number" && Number.isFinite(v)) ? [
		value[0],
		value[1],
		value[2]
	] : null;
}
async function colorConversion(payload, transport) {
	const workingSpace = payload.workingSpace ?? "None";
	try {
		if (workingSpace === "None" || workingSpace === "") {
			payload.colorPipeline = "untagged 16-bit → 8-bit sRGB-tagged (values unchanged)";
			return () => {};
		}
		const calib = await measureCaptureTransfer(transport, calibrationKey(payload.projectFile ?? null, workingSpace, payload.bitsPerChannel ?? 8), !readOnlyMode());
		const calibFailed = "error" in calib || calib.kind === "unknown";
		const gain = !calibFailed && calib.kind === "linear" ? 1 / calib.scale : 1;
		const applyGain = (rgb) => {
			if (gain !== 1) for (let i = 0; i < rgb.length; i++) rgb[i] *= gain;
		};
		if (payload.captureKind === "ocio") {
			if (calibFailed) {
				payload.colorWarning = `AE applied its display transform, but the capture scale could not be measured (${"error" in calib ? calib.error : "non-linear transfer"}) \u2014 the file is uniformly dark by that unknown scale. Verify colors against the AE viewer manually.`;
				return null;
			}
			payload.colorPipeline = "AE OCIO display transform (viewer-exact, any working space)" + (gain !== 1 ? ` + capture scale 1/${gain.toFixed(2)} restored` : "");
			return applyGain;
		}
		const profile = profileForWorkingSpace(workingSpace);
		if (profile === null) {
			payload.colorWarning = `working space '${workingSpace}' has no built-in conversion \u2014 the file contains raw working-space values and will not match the viewer. Verify colors against the AE viewer manually if they matter here.`;
			return null;
		}
		if (calibFailed) {
			payload.colorWarning = `could not characterize this AE version's capture transfer (${"error" in calib ? calib.error : "non-linear transfer"}) \u2014 the file contains raw working-space values. Verify colors against the AE viewer manually if they matter here.`;
			return null;
		}
		payload.colorPipeline = `${profile.note}` + (gain !== 1 ? ` (capture scale 1/${gain.toFixed(2)} restored)` : "");
		return (rgb) => {
			applyGain(rgb);
			sceneLinearToDisplaySrgb(rgb, profile.toRec709);
		};
	} catch (err) {
		payload.colorWarning = `color post-processing failed, file left as raw capture: ${err instanceof Error ? err.message : String(err)}`;
		return null;
	}
}
function iccManagedReason(workingSpace, bitsPerChannel) {
	return `The project is colour-managed (working space '${workingSpace}'${bitsPerChannel ? `, ${bitsPerChannel} bpc` : ""}, After Effects' own colour engine): colour readings here do not match the viewer (measured: an 8-bit grey of 128 read as 67, a neutral read L* 28 for 54, and spill turned its verdict), so they are refused. Alpha-based readings (edge widths, coverage, holes, specks, the file check) read the same as in a project with no working space and are given. For colour, measure in a copy of the project set to no working space at 8 or 16 bpc, or pass colorManaged: 'off' for the raw working-space values.`;
}
function init_capture_shared() {
	return (init_capture_shared = __esmMin((() => {
		init_calibration();
		init_transform();
		init_policy();
	})))();
}

// tools/define-tool.js
function defineTool(spec) {
	return spec;
}
function jsonResult(payload) {
	const envelope = {
		ok: true,
		...payload
	};
	return {
		content: [{
			type: "text",
			text: JSON.stringify(envelope, null, 2)
		}],
		structuredContent: envelope,
		isError: false
	};
}
function jsxReportedFailure(result) {
	if (result === null || typeof result !== "object" || Array.isArray(result)) return null;
	const r = result;
	if (r.ok !== false) return null;
	return { error: typeof r.error === "string" ? r.error : "operation reported ok: false" };
}
function toMcpResult(result) {
	if (!result.ok) return errorResult(result.errorCode ?? "TRANSPORT", result.error ?? "unknown failure", {
		...result.dialogs?.length ? { details: { dialogs: result.dialogs } } : {},
		stack: result.stack,
		logs: result.logs,
		durationMs: result.durationMs
	});
	const reported = jsxReportedFailure(result.result);
	if (reported) return errorResult("OPERATION_FAILED", reported.error, {
		details: { result: result.result },
		logs: result.logs,
		durationMs: result.durationMs
	});
	return jsonResult({
		result: result.result,
		logs: result.logs,
		durationMs: result.durationMs
	});
}
function init_define_tool() {
	return (init_define_tool = __esmMin((() => {
		init_errors();
	})))();
}

// tools/render-frame.js
function frameWarnings(frames, near = NEAR_FRAME_BOUNDARY) {
	const parts = [];
	const firstAt = /* @__PURE__ */ new Map();
	for (const [i, f] of frames.entries()) {
		if (typeof f.frame !== "number") continue;
		const seen = firstAt.get(f.frame);
		if (seen === void 0) firstAt.set(f.frame, i);
		else parts.push(`#${seen} and #${i} both render frame ${f.frame}`);
	}
	for (const [i, f] of frames.entries()) {
		if (typeof f.frame !== "number" || typeof f.frameOffset !== "number") continue;
		const below = 1 - f.frameOffset;
		if (below > 0 && below <= near) parts.push(`#${i} (${f.time} s) renders frame ${f.frame}, ${(below * 100).toFixed(1)}% of a frame below frame ${f.frame + 1}`);
	}
	if (parts.length === 0) return void 0;
	return `${parts.join("; ")}. A time resolves to the frame it falls in, so a rounded time just below a boundary renders the frame before and a series of rounded times can repeat frames (diff then reads stutters). Pass \`frames: [..]\` to address frames by number, or exact times.`;
}
function invalid(message, hint) {
	return { error: errorResult("INVALID_ARGS", message, hint ? { hint } : {}) };
}
function parseColor(value) {
	if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) return [
		1,
		3,
		5
	].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
	if (Array.isArray(value) && value.length === 3 && value.every((v) => typeof v === "number" && v >= 0 && v <= 1)) return [
		value[0],
		value[1],
		value[2]
	];
	return null;
}
function checkEyesOptions(args, isStrip = false) {
	const channels = args.channels ?? "rgb";
	if (args.colorManaged === "off" && (channels !== "rgb" || args.over !== void 0)) return invalid("`channels` and `over` need colorManaged 'auto'", "colorManaged 'off' returns the raw capture untouched (it already keeps any alpha AE wrote).");
	let over = "background";
	if (args.over !== void 0) {
		if (channels !== "rgb") return invalid(`\`over\` applies only to channels 'rgb', not '${channels}'`, "'rgba' keeps transparency in the file; 'alpha' is the matte itself.");
		if (args.over === "checkerboard") over = { kind: "checkerboard" };
		else if (args.over !== "background") {
			const color = parseColor(args.over);
			if (color === null) return invalid("`over` must be 'background', 'checkerboard', '#rrggbb' or [r, g, b] in 0..1");
			over = {
				kind: "color",
				color
			};
		}
	}
	let isolate = null;
	if (args.isolate !== void 0) {
		isolate = Array.isArray(args.isolate) ? args.isolate : [args.isolate];
		if (isolate.length === 0) return invalid("`isolate` needs at least one layer");
		if (readOnlyMode()) return { error: errorResult("FORBIDDEN", "`isolate` switches layers off and back on, and AE_MCP_READONLY=1 is set", { hint: "Unset AE_MCP_READONLY, or render without isolate." }) };
	}
	let sample = null;
	if (args.sample !== void 0) {
		const regions = args.sample.regions ?? [];
		if (regions.length === 0) return invalid("`sample.regions` needs at least one region");
		const names = /* @__PURE__ */ new Set();
		for (const r of regions) {
			if (names.has(r.name)) return invalid(`region name '${r.name}' is used twice`);
			names.add(r.name);
		}
		const stage = args.sample.stage ?? "both";
		sample = {
			regions,
			stages: stage === "both" ? ["capture", "output"] : [stage]
		};
	}
	let histogram = null;
	if (args.histogram !== void 0 && args.histogram !== false) {
		const h = args.histogram === true ? {} : args.histogram;
		histogram = {
			bins: h.bins ?? HISTOGRAM_DEFAULT_BINS,
			stage: h.stage ?? "output"
		};
	}
	let compare = null;
	if (args.compare !== void 0) {
		const n = args.count;
		if (n < 2) return invalid("`compare` needs `times` (or `strip`) with at least two frames");
		if (sample === null) return invalid("`compare` needs `sample`: it reports differences for the sampled regions");
		const from = args.compare.from ?? 0;
		const to = args.compare.to ?? 1;
		if (from >= n || to >= n) return invalid(`\`compare\` indices must be below ${n}, the number of times`);
		if (from === to) return invalid("`compare.from` and `compare.to` must be different frames");
		compare = {
			from,
			to
		};
	}
	let edge = null;
	if (args.edge !== void 0 && args.edge !== false) {
		edge = args.edge === true ? {} : args.edge;
		if (typeof edge !== "object" || edge === null) return invalid("`edge` must be true or an object");
		const problem = edgeArgsError(edge);
		if (problem !== null) return invalid(problem);
	}
	let screen = null;
	if (args.screen !== void 0 && args.screen !== false) {
		screen = args.screen === true ? {} : args.screen;
		if (typeof screen !== "object" || screen === null) return invalid("`screen` must be true or an object");
		const problem = screenArgsError(screen);
		if (problem !== null) return invalid(problem);
	}
	let look = null;
	if (args.look !== void 0) {
		const problem = lookArgsError(args.look);
		if (problem !== null) return invalid(problem);
		look = args.look;
	}
	let diff = null;
	const diffArg = args.diff ?? (isStrip ? true : void 0);
	if (diffArg !== void 0 && diffArg !== false) {
		const d = diffArg === true ? {} : diffArg;
		if (typeof d !== "object" || d === null) return invalid("`diff` must be true or an object");
		if (args.count < 2) return invalid("`diff` needs `times` with at least two frames, or `strip`", "It compares consecutive rendered frames: `times: [1, 1.04, 1.08], diff: true`.");
		const problem = diffArgsError(d);
		if (problem !== null) return invalid(problem);
		const { sheet: sheetArg, ...thresholds } = d;
		const sheetOn = sheetArg ?? isStrip;
		if (sheetOn !== false && sheetOn !== true && (typeof sheetOn !== "object" || sheetOn === null)) return invalid("`diff.sheet` must be true, false or an object");
		diff = {
			thresholds: resolveDiffThresholds(thresholds),
			sheet: sheetOn === false ? null : sheetOn === true ? {} : sheetOn
		};
	}
	return { options: {
		channels,
		over,
		overGiven: args.over !== void 0,
		isolate,
		sample,
		histogram,
		compare,
		edge,
		screen,
		look,
		diff
	} };
}
function planStrip(strip) {
	const fail = (message) => ({ error: errorResult("INVALID_ARGS", message, { hint: "`strip: { at: 2.5, frames: 9 }` renders the nine frames around 2.5 s." }) });
	if (typeof strip !== "object" || strip === null) return fail("`strip` must be an object");
	const { at, frames } = strip;
	const step = strip.step ?? 1;
	const maxDimension = strip.maxDimension ?? STRIP_DEFAULT_MAX_DIMENSION;
	if (typeof at !== "number" || !Number.isFinite(at) || at < 0) return fail("`strip.at` must be a time in seconds, 0 or more");
	if (!Number.isInteger(frames) || frames < 2 || frames > 32) return fail("`strip.frames` must be a whole number from 2 to 32");
	if (!Number.isInteger(step) || step < 1) return fail("`strip.step` must be a whole number, 1 or more");
	if (!Number.isInteger(maxDimension) || maxDimension < 16 || maxDimension > 2048) return fail("`strip.maxDimension` must be a whole number of px from 16 to 2048");
	const first = -Math.floor((frames - 1) / 2);
	return { plan: {
		at,
		offsets: Array.from({ length: frames }, (_, k) => (first + k) * step),
		frames,
		step,
		maxDimension
	} };
}
function sheetPathFor(abs, explicit) {
	if (explicit !== void 0) return path$1.resolve(explicit).replace(/\\/g, "/");
	const ext = path$1.extname(abs) || ".png";
	return `${abs.slice(0, abs.length - (path$1.extname(abs).length || 0))}_sheet${ext}`;
}
function framePaths(abs, count, multi, call = newCallId()) {
	if (!multi) return [abs];
	const ext = path$1.extname(abs) || ".png";
	const stem = abs.slice(0, abs.length - (path$1.extname(abs).length || 0));
	const out = [];
	for (let i = 0; i < count; i++) out.push(`${stem}_${call}_${i}${ext}`);
	return out;
}
function renderJsx(args, times, paths, tryOcio, isolate, strip = null, frameNums = null) {
	return `
        ${RENDER_FRAME_FN}
        ${MISSING_SOURCES_FN}
        ${OCIO_CAPTURE_FN}
        ${ISOLATE_FN}
        var _arg = ${jsxVal(args.compNameOrId)};
        var comp = AE.findCompByNameOrId(_arg);
        if (!comp) return { ok: false, error: "no comp matching " + String(_arg) };
        var _missingMedia = _missingSources(comp);
        if (_missingMedia.length) return { ok: false, error: "source media missing for comp " + comp.name + "; restore or relink before rendering", missingFootage: _missingMedia };
        var _ws = AE.safeGet(function () { return app.project.workingSpace; }, "None");
        // 0: Adobe's own (ICC) colour management; 1: OCIO; null before After Effects 24.
        var _cms = AE.safeGet(function () { return Number(app.project.colorManagementSystem); }, null);
        var _times = ${jsxVal(times)};
        var _strip = ${jsxVal(strip === null ? null : {
		at: strip.at,
		offsets: strip.offsets
	})};
        var _frameNums = ${jsxVal(frameNums)};
        var _paths = ${jsxVal(paths)};
        var _pick = ${jsxVal(FRAME_PICK)};
        var _stripOut = null;
        if (_frameNums !== null) {
            var _lastF = Math.max(0, Math.round(comp.duration / comp.frameDuration) - 1);
            _times = [];
            for (var _ni = 0; _ni < _frameNums.length; _ni++) {
                if (_frameNums[_ni] > _lastF) return { ok: false, error: "frame " + _frameNums[_ni] + " is past the comp's last frame, " + _lastF + " (comp " + comp.name + ")" };
                _times.push((_frameNums[_ni] + _pick) * comp.frameDuration);
            }
        }
        if (_strip !== null) {
            var _fd = comp.frameDuration;
            var _lastK = Math.max(0, Math.round(comp.duration / _fd) - 1);
            var _k0 = Math.round(_strip.at / _fd);
            var _offs = _strip.offsets;
            var _shift = 0;
            if (_k0 + _offs[_offs.length - 1] > _lastK) _shift = _lastK - (_k0 + _offs[_offs.length - 1]);
            if (_k0 + _offs[0] + _shift < 0) _shift = -(_k0 + _offs[0]);
            _times = [];
            var _clamped = 0;
            for (var _si = 0; _si < _offs.length; _si++) {
                var _k = _k0 + _offs[_si] + _shift;
                if (_k > _lastK) { _k = _lastK; _clamped++; }
                _times.push((_k + _pick) * _fd);
            }
            _stripOut = {
                at: Math.round(_k0 * _fd * 1e6) / 1e6,
                frameRate: Math.round(1e3 / _fd) / 1e3,
                firstFrame: _k0 + _offs[0] + _shift,
                lastFrame: Math.min(_lastK, _k0 + _offs[_offs.length - 1] + _shift),
                shiftedFrames: _shift
            };
            if (_clamped > 0) _stripOut.note = "the comp is shorter than the strip: the last " + _clamped + " frames repeat the comp's last frame (they read as stutters in diff)";
        }
        var _useDst = ${jsxVal(!!args.useDisplayStartTime)};
        // The OCIO Display Transform only under OCIO: under Adobe's ICC engine it does not give the viewer's picture (measured 2026-11-12).
        var _useOcio = ${jsxVal(tryOcio)} && _ws !== "None" && _ws !== "" && _cms === 1;
        var _isolate = ${jsxVal(isolate)};
        var _frames = [];
        function _renderAll(kind) {
            for (var _fi = 0; _fi < _times.length; _fi++) {
                var _r = _renderFrame(comp, _times[_fi], _paths[_fi], _useDst);
                _r.captureKind = kind;
                if (_r.ok) {
                    // The frame this time falls in, counted from frame 0 in the
                    // convention of time; within a millionth of a frame of a
                    // boundary counts as on it (k / fps in floating point).
                    var _pos = _times[_fi] / comp.frameDuration;
                    var _fk = Math.floor(_pos + 1e-6);
                    _r.frame = _fk;
                    _r.frameOffset = Math.max(0, Math.round((_pos - _fk) * 1e6) / 1e6);
                }
                _frames.push(_r);
            }
        }
        var _iso = null;
        if (_isolate !== null) {
            _iso = _isolateLayers(comp, _isolate);
            if (!_iso.ok) return { ok: false, error: _iso.error };
        }
        var _renderError = null;
        try {
            if (_useOcio) {
                var _maxT = _times[0];
                for (var _mi = 1; _mi < _times.length; _mi++) { if (_times[_mi] > _maxT) _maxT = _times[_mi]; }
                if (_useDst) _maxT = _maxT + comp.displayStartTime;
                _captureWithOcio(comp, _maxT, _renderAll);
            }
            if (_frames.length === 0) _renderAll("direct");
        } catch (eRender) {
            _renderError = eRender;
        }
        var _isoReport = null;
        if (_iso) {
            var _notRestored = _restoreLayers(_iso.saved);
            _isoReport = { layers: _iso.layers, changed: _iso.changed, restored: _notRestored.length === 0 };
            if (_notRestored.length) _isoReport.notRestored = _notRestored;
        }
        if (_renderError !== null) {
            var _fail = { ok: false, error: "render failed: " + AE.errText(_renderError) };
            if (_isoReport) _fail.isolation = _isoReport;
            return _fail;
        }
        var _allOk = true;
        var _firstError = null;
        for (var _ci = 0; _ci < _frames.length; _ci++) {
            if (!_frames[_ci].ok) { _allOk = false; if (_firstError === null) _firstError = _frames[_ci].error; }
        }
        var _out = { ok: _allOk, frames: _frames, captureKind: _frames.length > 0 ? _frames[0].captureKind : null };
        if (_isoReport) _out.isolation = _isoReport;
        if (_stripOut) _out.strip = _stripOut;
        if (!_allOk) _out.error = _firstError;
        if (_allOk) {
            _out.compName = comp.name;
            _out.workingSpace = _ws;
            _out.colorManagementSystem = _cms;
            _out.bitsPerChannel = AE.safeGet(function () { return app.project.bitsPerChannel; }, 8);
            _out.projectFile = app.project.file ? app.project.file.fsName.replace(/\\\\/g, "/") : null;
            _out.bgColor = AE.safeGet(function () { return [comp.bgColor[0], comp.bgColor[1], comp.bgColor[2]]; }, null);
        }
        return _out;
    `;
}
async function nativeFlow(args, opts, abs, transport, strip = null) {
	const startedAt = performance.now();
	const frameNums = args.frames ?? null;
	const multi = args.times !== void 0 || strip !== null || frameNums !== null;
	const times = strip !== null || frameNums !== null ? null : args.times ?? [args.time];
	const count = strip?.frames ?? frameNums?.length ?? times?.length ?? 1;
	const callId = newCallId();
	const paths = framePaths(abs, count, multi, callId);
	const contactSheet = args.contactSheet ?? (strip !== null ? {} : void 0);
	const before = await stampFiles(paths);
	const tryOcio = args.colorManaged !== "off" && !readOnlyMode();
	const result = await transport.execute({
		code: renderJsx(args, times, paths, tryOcio, opts.isolate, strip, frameNums),
		label: "render_frame",
		timeoutMs: 12e4 + (count - 1) * 3e4
	});
	const aeCallMs = performance.now() - startedAt;
	if (!result.ok) return toMcpResult(result);
	const payload = result.result;
	const frames = payload?.frames ?? [];
	const frameSize = frames[0]?.size;
	if (payload && strip !== null) payload.strip = {
		at: strip.at,
		frames: strip.frames,
		step: strip.step,
		maxDimension: strip.maxDimension,
		...payload.strip
	};
	if (payload && payload.ok === true) {
		const warning = frameWarnings(frames);
		if (warning !== void 0) payload.frameWarning = warning;
	}
	if (payload && payload.ok === true && !multi && frames.length === 1) {
		payload.writtenTo = frames[0].writtenTo;
		payload.time = frames[0].time;
		if (frames[0].frame !== void 0) payload.frame = frames[0].frame;
		if (frames[0].frameOffset !== void 0) payload.frameOffset = frames[0].frameOffset;
		payload.size = frames[0].size;
		delete payload.frames;
	}
	if (!payload || payload.ok !== true) return toMcpResult(result);
	if (payload.isolation && !payload.isolation.restored) payload.isolationWarning = "some layer switches could not be restored after isolate — check these layers in the timeline: " + (payload.isolation.notRestored ?? []).join("; ");
	const written = (multi ? frames.map((f) => f.writtenTo) : [payload.writtenTo]).filter((p) => typeof p === "string");
	const put = (i, key, value) => {
		if (multi) frames[i][key] = value;
		else payload[key] = value;
	};
	const iccRefused = args.colorManaged !== "off" && typeof payload.workingSpace === "string" && payload.workingSpace !== "None" && payload.workingSpace !== "" && payload.colorManagementSystem !== 1;
	let analyze = args.analyze === true;
	let spillRefused = null;
	if (iccRefused) {
		const refused = [];
		const reason = iccManagedReason(payload.workingSpace, payload.bitsPerChannel);
		if (opts.sample) {
			if (opts.sample.stages.includes("output")) refused.push("sample (output)");
			const stages2 = opts.sample.stages.filter((st) => st === "capture");
			opts = {
				...opts,
				sample: stages2.length ? {
					...opts.sample,
					stages: stages2
				} : null
			};
		}
		if (opts.look) refused.push("look");
		if (opts.histogram) refused.push("histogram");
		if (opts.screen) refused.push("screen");
		if (opts.diff) refused.push("diff");
		if (analyze) refused.push("analyze");
		if (opts.edge) {
			refused.push("edge spill");
			spillRefused = reason;
		}
		if (opts.channels === "rgba") refused.push("channels rgba");
		if (opts.overGiven) refused.push("over");
		opts = {
			...opts,
			look: null,
			histogram: null,
			screen: null,
			diff: null,
			channels: "rgb",
			overGiven: false
		};
		analyze = false;
		payload.colorRefused = {
			reason,
			refused
		};
		payload.colorWarning = `${reason} The written files are the raw captures (working-space values at the capture's scale), not the viewer's picture.`;
	}
	const managed = args.colorManaged !== "off" && !iccRefused;
	let convert = null;
	let backdrop = null;
	if (managed) {
		payload.method = "native";
		payload.channels = opts.channels;
		convert = await colorConversion(payload, transport);
		if (convert === null && (opts.channels !== "rgb" || opts.overGiven)) payload.channelsWarning = "colour conversion failed (see colorWarning), so the raw capture was kept and `channels` / `over` were not applied";
		if (convert !== null && opts.channels === "rgb") backdrop = chooseBackdrop(payload, opts);
	}
	const bg = validRgb(payload.bgColor);
	const unmatting = convert !== null && (opts.channels === "rgba" || backdrop !== null);
	const settle = await waitForSettled(written, {
		timeoutMs: args.settleTimeoutMs ?? settleTimeoutFor(written.length, frameSize ? frameSize[0] * frameSize[1] : 2073600),
		before: before.slice(0, written.length)
	});
	payload.captureSettle = settle;
	const listBatch = () => {
		if (!multi) return;
		payload.batch = {
			id: callId,
			files: frames.map((f, i) => ({
				index: i,
				path: f.writtenTo ?? paths[i],
				frame: f.frame ?? null,
				time: f.time ?? null,
				ok: f.ok === true,
				...f.ok === true ? {} : { error: f.error ?? "not captured" }
			}))
		};
	};
	if (settle.unsettled.length > 0) {
		const secs = (settle.timeoutMs / 1e3).toFixed(1);
		for (const u of settle.unsettled) {
			if (!multi || !frames[u.index]) continue;
			frames[u.index].ok = false;
			frames[u.index].error = `the capture did not finish writing within ${secs} s (${u.state}, ${u.bytes} bytes)`;
		}
		payload.captureWarning = `${settle.unsettled.length} of ${written.length} captures did not finish writing within ${secs} s (saveFrameToPng writes asynchronously): frames ${settle.unsettled.map((u) => u.index).join(", ")}. ` + (settle.settled.length > 0 ? "The others were measured; see captureSettle, or render the missing ones again with a longer settleTimeoutMs." : "Nothing could be measured; try again with a longer settleTimeoutMs.");
		if (settle.settled.length === 0) {
			listBatch();
			if (args.analyze) payload.analysisWarning = "analysis failed: no capture finished writing";
			if (managed) payload.colorWarning = "color post-processing failed, file left as raw capture: no capture finished writing";
			return toMcpResult(result);
		}
	}
	listBatch();
	const finished = new Set(settle.settled);
	const keep = new Set(opts.compare ? [opts.compare.from, opts.compare.to] : []);
	const kept = /* @__PURE__ */ new Map();
	const sheetImages = [];
	const sheetLabels = [];
	let sheetThumb = null;
	const diffPairs = [];
	const diffThumbs = [];
	let diffPrev = null;
	let diffThumb = null;
	const diffSkipped = [];
	let read = 0;
	const edgePairs = [];
	let edgePrev = null;
	let edgeMeasured = 0;
	let edgeFromLuma = 0;
	let withAlpha = 0;
	const lookFrames = [];
	let writing = convert !== null;
	for (const [i, file] of written.entries()) {
		if (!finished.has(i)) continue;
		let capture;
		try {
			capture = decodePng(await promises.readFile(file));
			read++;
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			payload.captureWarning = `could not read the capture: ${msg}`;
			if (args.analyze) payload.analysisWarning = `analysis failed: ${msg}`;
			if (managed) payload.colorWarning = `color post-processing failed, file left as raw capture: ${msg}`;
			return toMcpResult(result);
		}
		if (capture.alpha) withAlpha++;
		if (opts.edge) {
			const fromLuma = opts.edge.from === "luma";
			if (fromLuma) edgeFromLuma++;
			if (!capture.alpha && !fromLuma) edgePrev = null;
			else try {
				const t = resolveEdgeThresholds(opts.edge, capture.width, capture.height);
				payload.edgeThresholds ??= t;
				const { report, frame } = measureEdge(capture, bg ?? [
					0,
					0,
					0
				], t);
				if (spillRefused !== null) report.spill = { refused: spillRefused };
				put(i, "edge", report);
				edgeMeasured++;
				if (edgePrev !== null && edgePrev.index === i - 1) edgePairs.push({
					from: {
						index: i - 1,
						time: frames[i - 1]?.time
					},
					to: {
						index: i,
						time: frames[i]?.time
					},
					...alphaChange(edgePrev.frame, frame, t)
				});
				edgePrev = multi ? {
					index: i,
					frame
				} : null;
			} catch (err) {
				payload.edgeWarning = `edge measurement failed: ${err instanceof Error ? err.message : String(err)}`;
				edgePrev = null;
			}
		}
		if (opts.screen) try {
			const t = resolveScreenThresholds(opts.screen, capture.width, capture.height);
			payload.screenThresholds ??= t;
			put(i, "screen", measureScreen(capture, t));
		} catch (err) {
			payload.screenWarning = `screen measurement failed: ${err instanceof Error ? err.message : String(err)}`;
		}
		if (analyze) try {
			put(i, "analysis", analyzeFrame(capture));
		} catch (err) {
			payload.analysisWarning = `analysis failed: ${err instanceof Error ? err.message : String(err)}`;
		}
		let output = capture;
		if (writing && convert !== null) try {
			output = await writeOutput(file, capture, convert, opts.channels, backdrop, bg ?? [
				0,
				0,
				0
			]);
		} catch (err) {
			payload.colorWarning = `color post-processing failed, file left as raw capture: ${err instanceof Error ? err.message : String(err)}`;
			writing = false;
		}
		const pixels = {
			capture,
			output
		};
		if (opts.sample) put(i, "samples", sampleReport(pixels, opts.sample));
		if (opts.look) try {
			put(i, "look", measureLook(output, opts.look));
			if (multi) lookFrames.push({
				index: i,
				frame: frames[i]?.frame,
				crops: lookCrops(output, opts.look)
			});
		} catch (err) {
			payload.lookWarning = `look measurement failed: ${err instanceof Error ? err.message : String(err)}`;
		}
		if (opts.histogram) {
			const { bins, stage } = opts.histogram;
			put(i, "histogram", {
				stage,
				...histogramOf(pixels[stage], bins)
			});
		}
		if (keep.has(i)) kept.set(i, pixels);
		const straight = output !== capture && output.alpha !== void 0;
		if (contactSheet) {
			sheetThumb ??= thumbSizeFor(output, contactSheet.thumbWidth ?? stripThumbWidth(strip, output));
			sheetImages.push(sheetTile(output === capture ? {
				...capture,
				alpha: void 0
			} : output, sheetThumb));
			sheetLabels.push(frameLabel(i, frames[i]?.time ?? payload.time));
		}
		if (opts.diff) {
			payload.diffThresholds ??= opts.diff.thresholds;
			const pic = pictureOf(output, straight);
			const { width, height } = output;
			if (diffPrev !== null && diffPrev.index !== i - 1) diffSkipped.push(`${diffPrev.index}>${i} (frames between are missing)`);
			else if (diffPrev !== null && (diffPrev.width !== width || diffPrev.height !== height)) diffSkipped.push(`${i - 1}>${i} (frame sizes differ)`);
			else if (diffPrev !== null) {
				if (opts.diff.sheet) diffThumb ??= thumbSizeFor(output, opts.diff.sheet.thumbWidth ?? contactSheet?.thumbWidth ?? stripThumbWidth(strip, output));
				try {
					const res = pictureChange(diffPrev.pic, pic, width, height, opts.diff.thresholds, {
						regions: opts.sample?.regions,
						thumb: diffThumb ?? void 0
					});
					const pair = {
						from: {
							index: i - 1,
							time: frames[i - 1]?.time
						},
						to: {
							index: i,
							time: frames[i]?.time
						},
						...res.all
					};
					if (res.regions) pair.regions = res.regions;
					if (res.thumb && diffThumb) {
						const grey = new Float64Array(res.thumb.length * 3);
						for (let k = 0; k < res.thumb.length; k++) grey.fill(res.thumb[k], k * 3, k * 3 + 3);
						diffThumbs.push({
							pair: diffPairs.length,
							img: {
								width: diffThumb.width,
								height: diffThumb.height,
								rgb: grey,
								bitDepth: 8
							}
						});
					}
					diffPairs.push(pair);
				} catch (err) {
					payload.diffWarning = `diff failed: ${err instanceof Error ? err.message : String(err)}`;
				}
			}
			payload.diff ??= {
				stage: "output",
				picture: diffPicture(output === capture, opts.channels, payload.over),
				pairs: [],
				series: summarizeSeries([], opts.diff.thresholds)
			};
			diffPrev = {
				index: i,
				pic,
				width,
				height
			};
		}
	}
	payload.alphaChannel = withAlpha === 0 ? "absent" : withAlpha === read ? "present" : "mixed";
	if (unmatting && withAlpha > 0 && bg === null) payload.channelsWarning = "the comp background colour (bgColor) is unknown, so the colour under it was recovered as if it were black; soft edges may carry the real background";
	if (convert !== null && payload.alphaChannel === "absent") {
		if (opts.channels === "alpha") payload.alphaWarning = "the capture has no alpha channel, so the matte is all white (fully opaque). If this comp should be transparent here, saveFrameToPng did not write alpha for it.";
		else if (opts.channels === "rgba") payload.alphaWarning = "the capture has no alpha channel, so the file's alpha is fully opaque";
		else if (opts.overGiven) payload.alphaWarning = "the capture has no alpha channel, so there was nothing to composite over `over`";
	}
	if (opts.edge) {
		if (edgeFromLuma === 0 && withAlpha < read) payload.edgeWarning = `${read - withAlpha} of ${read} captures have no alpha channel, so their matte could not be measured (a comp with no transparency, or an AE that flattens)`;
		else if (edgeFromLuma === 0 && edgeMeasured > 0 && bg === null) payload.edgeWarning = "the comp background colour (bgColor) is unknown, so the soft edge's colour was recovered as if it were black; the spill reading may carry the real background";
		if (edgePairs.length > 0) payload.edgeFlicker = {
			pairs: edgePairs,
			overall: summarizeFlicker(edgePairs)
		};
	}
	if (opts.look && lookFrames.length >= 2) {
		if (lookFrames.every((f, k) => k === 0 || typeof f.frame === "number" && typeof lookFrames[k - 1].frame === "number" && f.frame - lookFrames[k - 1].frame === 1)) payload.lookSeries = summarizeLookSeries(lookFrames.map((f) => f.crops), opts.look);
		else payload.lookWarning = "frame-to-frame grain needs consecutive frames (one frame apart, in order); these were not, so lookSeries was left out";
	}
	if (opts.compare && opts.sample) {
		const { from, to } = opts.compare;
		const a = kept.get(from);
		const b = kept.get(to);
		if (a && b) {
			const report = opts.sample.regions.map((r) => ({ name: r.name }));
			for (const stage of opts.sample.stages) compareRegions(a[stage], b[stage], opts.sample.regions).forEach((diff, j) => {
				report[j][stage] = stageBlock(diff, stage);
			});
			payload.comparison = {
				from: {
					index: from,
					time: frames[from]?.time
				},
				to: {
					index: to,
					time: frames[to]?.time
				},
				regions: report
			};
		}
	}
	if (opts.diff && payload.diff) {
		payload.diff.pairs = diffPairs;
		payload.diff.series = summarizeSeries(diffPairs, opts.diff.thresholds);
		if (diffSkipped.length > 0) payload.diffWarning = `some consecutive pairs were not compared: ${diffSkipped.join("; ")}` + (settle.unsettled.length > 0 ? " — captures missing, see captureSettle" : "");
	}
	const stages = /* @__PURE__ */ new Set([
		...opts.sample?.stages ?? [],
		...opts.histogram ? [opts.histogram.stage] : [],
		...opts.edge || opts.screen ? ["capture"] : [],
		...opts.diff ? ["output"] : []
	]);
	if (stages.size > 0) {
		payload.measurementStages = {};
		for (const s of stages) payload.measurementStages[s] = MEASUREMENT_STAGES[s];
	}
	if (contactSheet && sheetImages.length > 0) await attachContactSheet(payload, sheetLabels, sheetImages, sheetPathFor(abs, contactSheet.outPath), contactSheet);
	if (opts.diff?.sheet && payload.diff && diffThumbs.length > 0) await attachDiffSheet(payload, payload.diff, diffThumbs, abs, opts.diff.sheet, opts.diff.thresholds);
	const totalMs = performance.now() - startedAt;
	payload.timing = {
		aeCallMs: Math.round(aeCallMs),
		settleMs: settle.waitedMs,
		nodeMs: Math.max(0, Math.round(totalMs - aeCallMs - settle.waitedMs)),
		totalMs: Math.round(totalMs)
	};
	return toMcpResult(result);
}
function thumbSizeFor(img, thumbWidth) {
	const width = Math.max(16, Math.min(thumbWidth ?? 480, img.width));
	return {
		width,
		height: Math.max(1, Math.round(img.height * width / img.width))
	};
}
function stripThumbWidth(strip, img) {
	if (strip === null) return void 0;
	return Math.max(1, Math.round(strip.maxDimension * img.width / Math.max(img.width, img.height)));
}
function sheetTile(img, thumb) {
	const flat = img.alpha ? {
		...img,
		rgb: flattenOver(img, { kind: "checkerboard" }),
		alpha: void 0
	} : img;
	if (flat.width <= thumb.width) return flat;
	return {
		...flat,
		width: thumb.width,
		height: thumb.height,
		rgb: resample(flat, thumb.width, thumb.height)
	};
}
function diffPicture(raw, channels, over) {
	if (raw) return "the capture as AE wrote it (no colour conversion: colorManaged off, or the conversion failed): its RGB already laid over the comp background (bgColor), so empty areas read the background in both frames; alpha not compared";
	if (channels === "alpha") return "the written file: the matte (alpha as grey), white opaque";
	if (channels === "rgba") return "the written file's straight colour weighted by its alpha (as over black), so colour under transparent pixels does not count";
	if (over === void 0 || over === "background") return "the written file: the picture as AE composited it over the comp background (bgColor), so transparent areas read the background in both frames and do not change";
	return "the written file: the picture laid over `over`, so transparent areas read that backdrop";
}
async function attachDiffSheet(payload, diff, thumbs, abs, opts, t) {
	try {
		const flagged = new Set(diff.series.flags.flatMap((f) => f.pairs));
		const labels = thumbs.map(({ pair }) => {
			const p = diff.pairs[pair];
			return `#${p.from.index}>${p.to.index} ${p.change.toFixed(4)}${flagged.has(pair) ? " !" : ""}`;
		});
		const sheet = composeContactSheet(thumbs.map((th) => th.img), {
			columns: opts.columns,
			thumbWidth: thumbs[0].img.width,
			labels
		});
		const sheetPath = opts.outPath !== void 0 ? path$1.resolve(opts.outPath).replace(/\\/g, "/") : `${abs.slice(0, abs.length - path$1.extname(abs).length)}_diff${path$1.extname(abs) || ".png"}`;
		await promises.mkdir(path$1.dirname(sheetPath), { recursive: true });
		await promises.writeFile(sheetPath, encodePngSrgb8(sheet.width, sheet.height, sheet.rgb));
		payload.diffSheet = {
			writtenTo: sheetPath,
			size: [sheet.width, sheet.height],
			columns: sheet.columns,
			rows: sheet.rows,
			thumbSize: [sheet.thumbWidth, sheet.thumbHeight],
			frames: thumbs.length,
			amplify: t.amplify
		};
	} catch (err) {
		payload.diffWarning = `diff sheet failed: ${err instanceof Error ? err.message : String(err)}`;
	}
}
function stageBlock(stats, stage) {
	const { name: _name, ...rest } = stats;
	if (stage === "output" && Array.isArray(rest.mean)) rest.meanHex = rgbHex(rest.mean);
	return rest;
}
function sampleReport(pixels, sample) {
	const report = sample.regions.map((r) => ({ name: r.name }));
	for (const stage of sample.stages) sampleRegions(pixels[stage], sample.regions).forEach((stats, j) => {
		report[j][stage] = stageBlock(stats, stage);
	});
	return report;
}
function chooseBackdrop(payload, opts) {
	if (opts.over === "background") {
		payload.over = "background";
		return null;
	}
	payload.over = opts.over.kind === "checkerboard" ? "checkerboard" : opts.over.color;
	return opts.over;
}
async function attachContactSheet(payload, labels, tiles, sheetPath, opts) {
	try {
		const sheet = composeContactSheet(tiles, {
			columns: opts.columns,
			thumbWidth: opts.thumbWidth ?? tiles[0].width,
			labels
		});
		await promises.mkdir(path$1.dirname(sheetPath), { recursive: true });
		await promises.writeFile(sheetPath, encodePngSrgb8(sheet.width, sheet.height, sheet.rgb));
		payload.contactSheet = {
			writtenTo: sheetPath,
			size: [sheet.width, sheet.height],
			columns: sheet.columns,
			rows: sheet.rows,
			thumbSize: [sheet.thumbWidth, sheet.thumbHeight],
			frames: tiles.length
		};
	} catch (err) {
		payload.contactSheetWarning = `contact sheet failed: ${err instanceof Error ? err.message : String(err)}`;
	}
}
async function writeOutput(file, capture, convert, channels, backdrop, bg) {
	const { width, height } = capture;
	const opaque = () => new Float64Array(width * height).fill(1);
	let bytes;
	if (channels === "alpha") bytes = encodePngGray8(width, height, capture.alpha ?? opaque());
	else if (channels === "rgb" && backdrop === null) {
		const rgb = Float64Array.from(capture.rgb);
		convert(rgb);
		bytes = encodePngSrgb8(width, height, rgb);
	} else {
		const rgb = unmatte(capture, bg);
		convert(rgb);
		bytes = channels === "rgba" ? encodePngSrgbRgba8(width, height, rgb, capture.alpha ?? opaque()) : encodePngSrgb8(width, height, flattenOver({
			...capture,
			rgb
		}, backdrop));
	}
	await promises.writeFile(file, bytes);
	return decodePng(bytes);
}
var STRIP_DEFAULT_MAX_DIMENSION, FRAME_PICK, NEAR_FRAME_BOUNDARY, MEASUREMENT_STAGES, HISTOGRAM_DEFAULT_BINS, layerRefSchema, regionSchema, renderFrameTool, newCallId, ISOLATE_FN;
function init_render_frame() {
	return (init_render_frame = __esmMin((() => {
		init_matte();
		init_png16();
		init_screen();
		init_motion();
		init_settled_read();
		init_sheet();
		init_config();
		init_errors();
		init_policy();
		init_snippets();
		init_registry();
		init_capture_shared();
		init_define_tool();
		STRIP_DEFAULT_MAX_DIMENSION = 360;
		FRAME_PICK = .25;
		NEAR_FRAME_BOUNDARY = .02;
		MEASUREMENT_STAGES = {
			capture: "the PNG as saveFrameToPng wrote it, before any colour conversion: working-space values (scaled by AE's capture transfer in colour-managed projects), 8 or 16 bits. Its RGB is already laid over the comp background colour (`bgColor`): capture = colour·alpha + bgColor·(1 − alpha), so a half-covered pixel reads half background and an empty one reads bgColor; on a black background that is premultiplied colour. Alpha is the coverage AE wrote",
			output: "the file as written (writtenTo), after colour conversion when colorManaged is auto, so 8-bit display values. With channels 'rgb': over the comp background as AE composited it, or over `over`. With 'rgba': the colour recovered from under the background (straight, 0 where alpha is 0), plus alpha. With 'alpha': the matte, in r = g = b. The same as the capture when colorManaged is off or the conversion failed"
		};
		HISTOGRAM_DEFAULT_BINS = 32;
		layerRefSchema = z.union([
			z.string(),
			z.number().int().positive(),
			z.object({ id: z.number().int() })
		]);
		regionSchema = z.object({
			name: z.string().min(1).describe("Label reported back with the numbers."),
			x: z.number().int().describe("Left edge (or the point), capture pixels from the left."),
			y: z.number().int().describe("Top edge (or the point), capture pixels from the top."),
			width: z.number().int().positive().optional().describe("Omit with height for a single pixel."),
			height: z.number().int().positive().optional()
		});
		renderFrameTool = defineTool({
			name: "ae_render_frame",
			title: "Render frame",
			description: "Render one or more frames to PNG. Use to visually verify edits. The agent's 'eyes' — pair with mutations for a visual feedback loop. Headless and deterministic. Pass `time` for one frame, or `times` for several in ONE call (motion checks): files land at <outPath stem>_<call id>_<index>.png, a new call id every call, so a late write left by an earlier call can never be taken for this one's frame; `frames` lists them and `batch.files` says which frame each file holds. `contactSheet` tiles every frame into one labelled PNG (<stem>_sheet.png) so a motion check is one image; `analyze` measures each capture (uniform edge bands = black bars / transparent margins, content bounds, coverage) so off-frame elements and letterboxing are caught numerically. In color-managed projects (workingSpace != None) the capture applies AE's own display transform via a transient OCIO Display Transform adjustment layer, and the PNG comes back viewer-accurate and sRGB-tagged. Where that layer cannot be used — read-only mode, an AE without the OCIO effect, or a failed capture calibration — the result falls back to a pure-math ACES conversion or to raw values with an explicit colorWarning; check colorPipeline / colorWarning on the response. Seeing the matte: `channels` picks what the file holds — 'rgb' (default, transparency composited over `over`: the comp background as AE composites it, a checkerboard or a colour such as '#ff00ff'), 'rgba' (alpha kept, straight colour), or 'alpha' (the matte as greyscale: white opaque, black transparent). `isolate` renders one layer or a list alone (cameras and lights stay as they are), then restores every layer switch, even when the render fails. `alphaChannel` reports whether the capture carried alpha at all. Reading colour: `sample` takes named points or rectangles and returns mean / min / max per channel and alpha coverage for each; `histogram` counts the whole frame per channel; `compare` (with `times` and `sample`) reports each region's difference between two of the rendered frames. Matte quality: `edge` reports, from the capture's alpha, the shares of opaque / partly transparent / transparent pixels, edge width (typical and worst, px), holes, specks, partly transparent patches that are not thin edges (an unkeyed screen, a remnant), the soft edge's colour with the comp background taken out and whether it leans to the screen colour (spill), and with `times` the frame-to-frame change in alpha along the edge, inside the solid area and outside it (flicker). Green screen: `screen`, on a render of the UN-KEYED source (Keylight View 'source' or the key off, the keyed layer isolated), reports green or blue, which pixels are screen and their share, a suggested screen colour (the median, and the colour just outside the subject), evenness on a grid (darkest and brightest cells, the spread as a ratio, the darker side) and grain. Sitting in the scene: `look` reads grain, edge width, black and white points and CIELAB colour of named regions, names the cast on a neutral (with the gains that remove it) and skin's hue, and compares an element with its plate (add grain, soften, seat the blacks); with `times` on consecutive frames, the grain from frame to frame. Watching motion: `diff` (with `times`) reports how much the picture changes between consecutive frames, where, and per `sample` region, and flags pairs that stand out (a one-frame pop, a stutter where a frame repeats, a cut); `strip: { at, frames }` renders the frames around a moment into one small contact sheet with diff on. For playback at speed, render.preview (ae_do) writes a quick movie. It reports numbers and places, never a pass or fail. Every number is labelled with its stage — 'capture' (before colour conversion) or 'output' (the file as written) — described once in `measurementStages`.",
			group: "render",
			blockedInReadOnly: false,
			effect: "write",
			inputShape: {
				compNameOrId: z.union([z.string(), z.number()]).describe("Composition name or numeric item id."),
				time: z.number().nonnegative().optional().describe("Time in seconds to render. Give exactly one of `time`, `times`, `strip` or `frames`. Each rendered frame reports `frame` (the frame the time falls in: floor(time / frameDuration), worked out in After Effects) and `frameOffset` (where in it, 0..1); `frameWarning` says when two times land on one frame or a time sits within 2% of a frame below a boundary (a rounded time renders the frame before). Times are never moved."),
				times: z.array(z.number().nonnegative()).min(1).max(32).optional().describe("Several times in seconds, rendered in ONE call. Files are written as <outPath stem>_<call id>_<index><ext> (a new id every call) and reported in `frames` (index-aligned) and `batch.files` (path, frame, time)."),
				strip: z.object({
					at: z.number().nonnegative().describe("The moment, seconds (snapped to the nearest frame)."),
					frames: z.number().int().min(2).max(32).describe("How many consecutive frames, centred on `at` (one more after it when even)."),
					step: z.number().int().positive().optional().describe("Frames between rendered frames. Default 1 (every frame)."),
					maxDimension: z.number().int().min(16).max(2048).optional().describe("Longest side of each tile on the sheets, px. Default 360. The frames themselves are rendered at the comp's size.")
				}).optional().describe("'What happens around this moment' in one call: N consecutive frames around `at`, worked out from the comp's frame rate inside After Effects and rendered through the `times` path (files <stem>_<index>, listed in `frames`), tiled small into the contact sheet, with `diff` and its sheet on (pass `diff: false` to skip, or diff options to tune). The window is shifted to stay inside the comp; `strip` in the response says where it landed. Instead of `time` / `times`."),
				frames: z.array(z.number().int().nonnegative()).min(1).max(32).optional().describe("Frame numbers (0 = the comp's first frame) instead of times: each is rendered a quarter of a frame inside it, so a time never lands on the frame before. Through the `times` path: files <stem>_<call id>_<index>, reported in `frames` and `batch.files` with their `frame`. Instead of `time` / `times` / `strip`."),
				outPath: z.string().describe("Absolute path to write the PNG. Parent directory is created if missing. With `times`, used as the naming stem for every frame (plus a call id, new every call)."),
				useDisplayStartTime: z.boolean().optional().describe("If true, times are interpreted relative to comp.displayStartTime. Default false."),
				colorManaged: z.enum(["auto", "off"]).optional().describe("'auto' (default): detect the working space and return a viewer-accurate, 8-bit sRGB-tagged PNG. 'off': raw legacy output (16-bit, untagged, working-space values — dark/wrong-looking in color-managed projects)."),
				settleTimeoutMs: z.number().int().positive().max(6e5).optional().describe("How long to wait for the captures to finish writing (saveFrameToPng writes after the script returns). Default: 15 s for one frame, plus 3 s for each further 1080×1920 frame (scaled by size, at least 1 s each). Frames that do not finish are named in `captureSettle` and marked failed in `frames`; the others are still measured."),
				analyze: z.boolean().optional().describe("Measure each capture: uniform bands at every edge (width + transparent/color — black bars, letterboxing, empty margins), the bounding box of non-background pixels, coverage, mean RGB. Reported per frame as `analysis` (measured on the capture before color conversion)."),
				contactSheet: z.object({
					columns: z.number().int().positive().optional().describe("Tiles per row (default ceil(sqrt(n)))."),
					thumbWidth: z.number().int().min(16).max(2048).optional().describe("Tile width in px, never upscaled (default 480)."),
					outPath: z.string().optional().describe("Sheet path (default <outPath stem>_sheet.png).")
				}).optional().describe("Tile all rendered frames into ONE labelled PNG (#index + time above each tile). Pass {} for defaults. Frames that carry alpha (channels 'rgba') are shown over a checkerboard on the sheet."),
				channels: z.enum([
					"rgb",
					"rgba",
					"alpha"
				]).optional().describe("What the written file holds. 'rgb' (default): 8-bit sRGB, transparency composited over `over`. 'rgba': 8-bit sRGB with the alpha channel kept and straight colour (AE lays its capture over the comp background; that background is taken out again). 'alpha': the matte as 8-bit greyscale, white = opaque, black = transparent. Needs colorManaged 'auto'. If the capture has no alpha channel, `alphaWarning` says so."),
				over: z.union([
					z.enum(["background", "checkerboard"]),
					z.string().regex(/^#[0-9a-fA-F]{6}$/),
					z.array(z.number().min(0).max(1)).length(3)
				]).optional().describe("With channels 'rgb': what transparent pixels are shown against. 'background' (default): the comp's background colour (`bgColor`), as AE itself composites the capture. 'checkerboard': light and dark grey squares, so transparency is visible. A colour as '#rrggbb' or [r, g, b] in 0..1 — magenta shows holes in a key. For the last two the comp background is taken out of the capture first, so soft edges show the new backdrop only."),
				isolate: z.union([layerRefSchema, z.array(layerRefSchema).min(1)]).optional().describe("Render these layers alone: a layer (index, name, or { id }) or a list. Every other layer is switched off for the capture, adjustment layers included; camera, light and audio-only layers are left as they are; named layers are switched on even if they were off (to see a matte layer); solo is cleared. Every switch is restored afterwards, even when the render fails, and `isolation` reports it. Top-level layers of this comp only. Not available in read-only mode."),
				sample: z.object({
					regions: z.array(regionSchema).min(1).max(64),
					stage: z.enum([
						"both",
						"capture",
						"output"
					]).optional().describe("Which pixels to measure (default 'both'; see measurementStages).")
				}).optional().describe("Read colour values. Named points ({ name, x, y }) or rectangles (+ width, height) in capture pixels (comp pixels at full resolution); regions running off the frame are clipped. Per region and stage: mean / min / max of r, g, b (0..1), alpha mean / min / max and the shares of opaque, partly covered and transparent pixels; 'output' also gives meanHex. Reported as `samples` (per frame with `times`)."),
				histogram: z.union([z.boolean(), z.object({
					bins: z.number().int().min(2).max(256).optional().describe("Default 32."),
					stage: z.enum(["output", "capture"]).optional().describe("Default 'output'.")
				})]).optional().describe("Whole-frame per-channel histogram: pixel counts for r, g, b (and a when present) in equal bins over 0..1, 1.0 in the last bin. `true` for defaults."),
				compare: z.object({
					from: z.number().int().nonnegative().optional().describe("Index into `times` (default 0)."),
					to: z.number().int().nonnegative().optional().describe("Index into `times` (default 1).")
				}).optional().describe("With `times` and `sample`: each region's difference between two rendered frames, to − from, per stage: meanDelta (signed average shift), meanAbsDelta and maxAbsDelta per channel, and the same for alpha. Reported as `comparison`."),
				edge: z.union([z.boolean(), z.object({
					from: z.enum(["alpha", "luma"]).optional().describe("Where the matte is read: 'alpha' (default, the keyed result's coverage) or 'luma' (Rec. 709 luminance of the capture), for Keylight's Screen Matte (View 5) and Combined Matte (8) views, which write the matte in grey RGB with alpha 1 everywhere. With 'luma' spill is not read and no alpha channel is needed."),
					transparent: z.number().min(0).max(1).optional().describe("Alpha at or below counts as transparent. Default 2/255 (as `sample` counts)."),
					opaque: z.number().min(0).max(1).optional().describe("Alpha at or above counts as opaque. Default 1 − 2/255."),
					maxEdgeWidth: z.number().min(1).optional().describe("Widest transition still called a thin edge, px; wider partly transparent regions are reported as patches, and it is the edge band for flicker. Default 1% of the frame's shorter side, at least 4 (11 at 1080×1920)."),
					mainAreaShare: z.number().min(0).max(1).optional().describe("An island of covered pixels at least this share of the largest is a main solid area, smaller ones are specks. Default 0.25."),
					listed: z.number().int().min(0).max(50).optional().describe("How many holes, specks, patches and solid areas are listed (all are counted). Default 5."),
					screen: z.enum(["green", "blue"]).optional().describe("Screen colour spill is read against. Default 'green'."),
					spillMinAlpha: z.number().min(0).max(1).optional().describe("Partly transparent pixels below this alpha are left out of the spill colour. Default 0.1."),
					spillThreshold: z.number().min(0).max(1).optional().describe("The soft edge leans to the screen when its screen channel exceeds the larger other channel by more than this, and by this much more than the solid area's own. Default 0.03."),
					changeAbove: z.number().min(0).max(1).optional().describe("Flicker: an alpha change above this counts as changed. Default 0.05."),
					patchWindow: z.number().min(1).optional().describe("Side of the square window each patch's densest part is reported in, px. Default 4 × maxEdgeWidth (44 at 1080×1920).")
				})]).optional().describe("Matte quality as numbers, measured on the capture's alpha (stage 'capture'), or with `from: 'luma'` on its luminance (Keylight's matte views); `true` for the defaults. Each report says `matteFrom`. Reported as `edge` (per frame with `times`), with the thresholds used as `edgeThresholds`: shares {opaque, partial, transparent}; width {typical (median), p90, worst, worstAt, samples, unmeasured} — px the alpha takes from transparent to opaque across the 50% contour of the main solid areas (0 = hard edge; unmeasured = the alpha never reaches transparent or opaque anywhere, as when the screen is left partly opaque); solidAreas; holes {count, area, transparentArea, largest, list} — regions below opaque enclosed by the solid area (not touching the frame edge); specks {count, area, list} — islands outside the main areas; patches {count, area, list} — partly transparent regions thicker than maxEdgeWidth, each with its box, thickest {x, y, thickness} (the deepest point and the thickness there, px) and densest {x, y, width, height, pixels, share, meanAlpha} (the patchWindow square holding most of it, so a long band's box does not hide where it is); spill {mean, solidMean, excess, solidExcess, leansToScreen, reading} — the straight colour of the partly transparent pixels (comp background taken out) against the solid just inside the edge. Boxes are {x, y, width, height} in capture pixels. With two or more `times`: `edgeFlicker` {pairs, overall} — mean / max change in alpha and the changed share and bounds, for consecutive frames, split into edge, inside (a hole opening counts here) and outside (specks); real motion counts as change too."),
				screen: z.union([z.boolean(), z.object({
					screen: z.enum([
						"auto",
						"green",
						"blue"
					]).optional().describe("Which screen to look for. Default 'auto': green or blue, whichever has more pixels."),
					minExcess: z.number().min(0).max(1).optional().describe("A pixel is screen when its screen channel leads the larger other channel by at least this (capture values). Default 0.04."),
					minDominance: z.number().min(0).max(1).optional().describe("…and by at least this share of its own level. Default 0.15."),
					minScreenShare: z.number().min(0).max(1).optional().describe("Fewer screen pixels than this share of the measured ones means no screen. Default 0.02."),
					opaque: z.number().min(0).max(1).optional().describe("Pixels with alpha below this are left out (masked or transparent). Default 1 − 2/255."),
					columns: z.number().int().min(1).max(64).optional().describe("Evenness grid columns. Default: four cells across the shorter side, square-ish cells."),
					rows: z.number().int().min(1).max(64).optional().describe("Evenness grid rows. Default as columns."),
					minCellShare: z.number().min(0).max(1).optional().describe("A cell needs this share of screen pixels to count as darkest or brightest. Default 0.25."),
					nearSkip: z.number().min(0).optional().describe("The near-subject colour is read from screen pixels starting this many px from the subject. Default 1% of the shorter side, at least 2 (11 at 1080×1920)."),
					nearBand: z.number().min(1).optional().describe("…in a band this many px wide. Default 5% of the shorter side, at least 4 (54 at 1080)."),
					unevenRatio: z.number().min(1).optional().describe("A brightest / darkest level ratio above this reads as uneven. Default 1.1."),
					grainAbove: z.number().min(0).max(1).optional().describe("A screen-channel grain standard deviation above this reads as grainy. Default 0.01.")
				})]).optional().describe("Measure a green or blue screen, on the capture (stage 'capture'), opaque pixels only; `true` for the defaults. Render the UN-KEYED source: set Keylight's View to 'source' (key.view) or switch the key off, and isolate the keyed layer. Reported as `screen` (per frame with `times`), with the thresholds used as `screenThresholds`: screen ('green' | 'blue' | null), chosen, measured / leftOut pixels, screenPixels, share, bounds; colour {median, mean, nearSubject {colour, pixels, band}} — the suggested Screen Colour; subject {box, area, share}; evenness {columns, rows, cells [{column, row, box, screenShare, mean, luma, level}], darkest, brightest, levelRatio, lumaRatio, uneven, extent (5th to 95th percentile of the screen pixels' positions), horizontal (right / left) and vertical (bottom / top) read across that extent, darkerSide (every side darker past unevenRatio, strongest first), reading}; grain {stdDev, level, steps8bit, samples, grainy, reading}; reading; warning; screenColourNote (capture values and what they mean for Keylight's Screen Colour)."),
				look: z.object({
					regions: z.array(regionSchema.extend({ role: z.enum([
						"neutral",
						"skin",
						"plate",
						"element"
					]).optional().describe("neutral: a surface that should read grey or white (a wall, a card, a metal grille) — its cast is named and the gains that remove it given; skin: its hue angle is read against the usual range; plate / element: for `pairs`.") })).min(1).max(64),
					pairs: z.array(z.object({
						element: z.string(),
						plate: z.string()
					})).optional().describe("Element regions read against plate regions, by name: grain, edge width, black and white points, with what to do."),
					minContrast: z.number().gt(0).max(1).optional().describe("Smallest luma step (0..1) read as an edge. Default 0.1."),
					grainTolerance: z.number().gt(0).max(1).optional().describe("Default 0.25: within a quarter of the plate's grain matches."),
					background: z.array(z.number().min(0).max(1)).length(3).optional().describe("The background the subject was cut from (the wall's mean colour, [r, g, b] 0..1, read with `sample` on the take): each region's edgeColour then says how far the soft edge's colour leans toward it."),
					sharpnessTolerance: z.number().gt(0).max(1).optional().describe("Default 0.25: within a quarter of the plate's edge width matches.")
				}).optional().describe("Does it sit in the scene: for each named region, on the file as written (stage 'output'; with channels 'rgba' only the opaque pixels, straight colour), levels {black, white, mean per channel, lumaBlack, lumaWhite, lumaMean} (0.5th and 99.5th percentiles, 0..1), grain {spatial: per channel in 8-bit steps, the robust spread of each pixel against its 3 x 3 neighbourhood}, sharpness {edgeWidth: median 10 to 90% rise across edges with a luma step of at least minContrast, px (a hard step about 0.8, a Gaussian blur of sigma s about 2.56 s), p90 (the widest tenth), edges}, with alpha (channels 'rgba'): matte {edgeWidth, p90, edges, softBand: soft pixels (alpha 0.02 to 0.98) per pixel of outline, opaqueShare (alpha 0.99 or more) and minAlpha: a region inside the subject reads 1 and 1, so a see-through band shows} read on the alpha, and edgeColour {band, inside, difference, towardBackground, reading}: the soft edge's straight colour against the colour well inside, and with `background` how far it leans toward the background (wall colour ringing the subject); lookSeries adds matteChange (mean change in alpha over the region, frame to frame). colour (CIELAB L, a, b, chroma, hue of the mean). role 'neutral' adds cast {a, b, amount, toward, gains, channelMixer} and a reading; role 'skin' a hue reading. pairs add, per element and plate, grain, sharpness and levels compared, with readings (add grain, soften, seat the blacks). With `times` on consecutive frames, lookSeries adds frame-to-frame grain per region (a still element reads 0). Reported as `look` (per frame with `times`)."),
				diff: z.union([z.boolean(), z.object({
					changeAbove: z.number().min(0).max(1).optional().describe("A pixel has changed when one of its channels moved by more than this (display values). Default 0.04, about ten 8-bit steps: well above frame-to-frame grain."),
					spikeRatio: z.number().optional().describe("A pair stands out as a spike when its change is at least this many times its neighbours' on each side it has. Default 3."),
					holdRatio: z.number().optional().describe("A pair is a hold (a repeated frame) when its change is at most this share of the moving neighbours' on both sides. Default 0.25."),
					quietBelow: z.number().min(0).max(1).optional().describe("Mean changes below this read as no visible change: neighbours this quiet are not moving, and a spike is measured against at least this. Default 0.002."),
					movingShare: z.number().min(0).max(1).optional().describe("Neighbours count as moving, and a spike counts, only with at least this share of pixels changed. Default 0.0005 (about 1,000 pixels at 1080×1920)."),
					window: z.number().int().optional().describe("Pairs on each side compared with a pair. Default 3."),
					amplify: z.number().optional().describe("Gain of the difference images on the diff sheet. Default 8."),
					repeatBelow: z.number().min(0).max(1).optional().describe("A pair changing this little is a repeated frame (identical frames read 0); repeats are never a reference for other pairs. Default 0.0001."),
					sheet: z.union([z.boolean(), z.object({
						columns: z.number().int().positive().optional(),
						thumbWidth: z.number().int().min(16).max(2048).optional(),
						outPath: z.string().optional().describe("Default <outPath stem>_diff.png.")
					})]).optional().describe("Also write the difference images, amplified and labelled '#from>to change' ('!' on flagged pairs), tiled into one PNG beside the contact sheet. Default off; on with `strip`.")
				})]).optional().describe("Frame-to-frame change, with `times` (two or more) or `strip`; `true` for the defaults. Measured on the written file (stage 'output', display values; `diff.picture` says what exactly: with the default rgb output the capture is already over the comp background, so transparent areas do not change). Reported as `diff` {stage, picture, pairs, series} with the thresholds used as `diffThresholds`. Each consecutive pair: from, to, change (mean absolute difference over pixels and channels, 0..1), maxAbsDelta, changedPixels, changedShare (a channel moved by more than changeAbove), changedBounds, and with `sample` the same per region. series: pairs, median, mean, largest, smallest, flags [{kind 'pop' | 'stutter' | 'cut' | 'repeat', pairs, frame or between, change, reference, ratio, atSeriesEdge?, besideRepeat?, unreliablePairs?, reading}], reading. A pop is a frame that differs from both neighbours; a stutter a frame that repeats the one before while the frames around it move; a cut one pair far above its neighbours; a repeat an unchanged pair at the start or end of the series beside motion. Repeated frames are never a reference, and the pairs beside one are named unreliable. Flags are hints from numbers: look at the frames.")
			},
			handler: async (args, transport) => {
				if ([
					args.time,
					args.times,
					args.strip,
					args.frames
				].filter((v) => v !== void 0).length !== 1) return errorResult("INVALID_ARGS", "give exactly one of `time`, `times`, `strip` or `frames`", { hint: "`time: 1.5` renders one frame; `times: [0, 1, 2]` renders several in one call; `strip: { at: 1.5, frames: 9 }` renders the frames around a moment; `frames: [42, 43]` renders frames by number." });
				if (args.frames !== void 0 && (!Array.isArray(args.frames) || args.frames.length < 1 || args.frames.length > 32 || !args.frames.every((k) => Number.isInteger(k) && k >= 0))) return errorResult("INVALID_ARGS", "`frames` must be 1 to 32 whole frame numbers, 0 or more (0 = the comp's first frame)");
				if (args.settleTimeoutMs !== void 0 && !(Number.isInteger(args.settleTimeoutMs) && args.settleTimeoutMs > 0)) return errorResult("INVALID_ARGS", "`settleTimeoutMs` must be a positive whole number of ms");
				let strip = null;
				if (args.strip !== void 0) {
					const planned = planStrip(args.strip);
					if ("error" in planned) return planned.error;
					strip = planned.plan;
				}
				const count = strip?.frames ?? args.frames?.length ?? args.times?.length ?? 1;
				const checked = checkEyesOptions({
					...args,
					count
				}, strip !== null);
				if ("error" in checked) return checked.error;
				const rejection = rejectedOutputPath(args.outPath);
				if (rejection !== null) return errorResult("IO", rejection, {
					details: { outPath: path$1.resolve(args.outPath) },
					hint: "Render to a path outside the mailbox."
				});
				const abs = path$1.resolve(args.outPath).replace(/\\/g, "/");
				if (args.contactSheet?.outPath !== void 0) {
					const sheetRejection = rejectedOutputPath(args.contactSheet.outPath);
					if (sheetRejection !== null) return errorResult("IO", sheetRejection, {
						details: { outPath: path$1.resolve(args.contactSheet.outPath) },
						hint: "Write the contact sheet to a path outside the mailbox."
					});
				}
				return nativeFlow(args, checked.options, abs, transport, strip);
			}
		});
		newCallId = () => randomUUID().slice(0, 8);
		ISOLATE_FN = `
    function _refText(ref) {
        if (typeof ref === "string") return '"' + ref + '"';
        if (typeof ref === "number") return "index " + ref;
        if (ref && typeof ref.id === "number") return "id " + ref.id;
        return String(ref);
    }
    function _restoreLayers(saved) {
        var failed = [];
        for (var i = saved.length - 1; i >= 0; i--) {
            var s = saved[i];
            if (!s.changed) continue;
            try {
                if (s.layer.locked) s.layer.locked = false;
                if (s.layer.enabled !== s.enabled) s.layer.enabled = s.enabled;
                if (s.hasSolo && s.layer.solo !== s.solo) s.layer.solo = s.solo;
                if (s.locked) s.layer.locked = true;
            } catch (eRestore) {
                failed.push(AE.safeGet(function () { return s.layer.index + " " + s.layer.name; }, "?") + ": " + AE.errText(eRestore));
            }
        }
        return failed;
    }
    function _isolateLayers(c, refs) {
        var keep = {};
        var named = [];
        for (var ri = 0; ri < refs.length; ri++) {
            var hit = AE.findLayerInComp(c, refs[ri]);
            if (!hit) return { ok: false, error: "isolate: no layer matching " + _refText(refs[ri]) + " in comp " + c.name };
            if (keep["k" + hit.index]) continue;
            keep["k" + hit.index] = true;
            named.push({ index: hit.index, name: hit.name });
        }
        var saved = [];
        var changed = 0;
        try {
            for (var li = 1; li <= c.numLayers; li++) {
                var L = c.layer(li);
                // Audio-only layers put nothing in the picture, and their
                // video switch may refuse to change: leave them be.
                if (AE.safeGet(function () { return L.hasVideo; }, true) === false) continue;
                var mn = AE.safeGet(function () { return L.matchName; }, "");
                var view = (mn === "ADBE Camera Layer" || mn === "ADBE Light Layer");
                var s = { layer: L, enabled: L.enabled, locked: !!L.locked, hasSolo: false, solo: false, changed: false };
                try { s.solo = !!L.solo; s.hasSolo = true; } catch (eSolo) { }
                saved.push(s);
                var want = keep["k" + L.index] ? true : (view ? s.enabled : false);
                if (want === s.enabled && !s.solo) continue;
                s.changed = true;
                changed++;
                if (s.locked) L.locked = false;
                if (s.solo) L.solo = false;
                if (L.enabled !== want) L.enabled = want;
            }
        } catch (eIso) {
            var undone = _restoreLayers(saved);
            return { ok: false, error: "isolate: could not switch layers (" + AE.errText(eIso) + ")" + (undone.length ? "; NOT restored: " + undone.join("; ") : "; every switch restored") };
        }
        return { ok: true, saved: saved, layers: named, changed: changed };
    }
`;
	})))();
}

// tools/catalog.js
function visibleOps(category) {
	return listOps(category).filter((op) => denyOperation(op) === null);
}
function visibleCategories() {
	const categories = /* @__PURE__ */ new Set();
	for (const op of visibleOps()) categories.add(op.category);
	return Array.from(categories).sort();
}
var catalogTool;
function init_catalog() {
	return (init_catalog = __esmMin((() => {
		init_errors();
		init_policy();
		init_registry();
		init_define_tool();
		catalogTool = defineTool({
			name: "ae_catalog",
			title: "Operation catalog",
			description: "Discover available atomic operations for ae_do. Without args: all categories with their operation names. With a category: detailed params per operation. Only operations this server will actually execute are listed.",
			group: "operations",
			blockedInReadOnly: false,
			effect: "read",
			inputShape: { category: z.string().optional().describe("Filter by category. Omit to list all categories with operation counts, then drill into a specific category.") },
			handler: async (args, _transport) => {
				if (!args.category) {
					const summary = visibleCategories().map((c) => ({
						category: c,
						operationCount: visibleOps(c).length,
						operations: visibleOps(c).map((op) => op.name)
					}));
					return jsonResult({
						categories: summary,
						totalOperations: visibleOps().length,
						policy: policySummary(),
						undo: "every ae_do call runs in ONE automatic undo group — a single Ctrl+Z / project.undo reverts the whole call (batch.run included); never open an undo group yourself. undo/redo itself (project.undo, command.execute 16/2035) is the exception: it runs outside the group, so call it alone, never inside batch.run",
						...readOnlyMode() ? { note: "AE_MCP_READONLY=1 — only operations that cannot modify the project are listed." } : {}
					});
				}
				const ops = visibleOps(args.category);
				if (ops.length === 0) {
					const available = visibleCategories();
					const withheld = denyUnregisteredCategory(args.category);
					if (withheld) return errorResult("FORBIDDEN", withheld.message, {
						details: {
							category: args.category,
							availableCategories: available
						},
						hint: withheld.hint
					});
					const hiddenByPolicy = listOps(args.category).length > 0;
					return errorResult(hiddenByPolicy ? "FORBIDDEN" : "UNKNOWN_CATEGORY", hiddenByPolicy ? `category '${args.category}' exists but every operation in it is blocked by the current policy (${policySummary()})` : `no operations in category '${args.category}'`, {
						details: {
							category: args.category,
							availableCategories: available
						},
						hint: `Available categories: ${available.join(", ")}`
					});
				}
				const details = ops.map((op) => ({
					name: op.name,
					description: op.description,
					readOnly: op.readOnly === true,
					...op.appConfig ? { appConfig: true } : {},
					params: op.params.map((p) => ({
						name: p.name,
						type: p.type,
						required: p.required ?? false,
						description: p.description,
						...p.nullable ? { nullable: true } : {},
						...p.default !== void 0 ? { default: p.default } : {}
					}))
				}));
				return jsonResult({
					category: args.category,
					operations: details
				});
			}
		});
	})))();
}

// tools/check-comp-jsx.js
function planJsx(compNameOrId) {
	return `
        ${MISSING_SOURCES_FN}
        var _arg = ${jsxVal(compNameOrId)};
        var comp = AE.findCompByNameOrId(_arg);
        if (!comp) return { ok: false, error: "no comp matching " + String(_arg) };
        return {
            ok: true,
            compName: comp.name,
            compId: comp.id,
            width: comp.width,
            height: comp.height,
            frameDuration: comp.frameDuration,
            duration: comp.duration,
            workAreaStart: AE.safeGet(function () { return comp.workAreaStart; }, 0),
            workAreaDuration: AE.safeGet(function () { return comp.workAreaDuration; }, comp.duration),
            displayStartTime: AE.safeGet(function () { return comp.displayStartTime; }, 0),
            resolutionFactor: AE.safeGet(function () { return [comp.resolutionFactor[0], comp.resolutionFactor[1]]; }, null),
            workingSpace: AE.safeGet(function () { return app.project.workingSpace; }, "None"),
            colorManagementSystem: AE.safeGet(function () { return Number(app.project.colorManagementSystem); }, null),
            bitsPerChannel: AE.safeGet(function () { return app.project.bitsPerChannel; }, 8),
            missingFootage: _missingSources(comp)
        };
    `;
}
function captureJsx(compNameOrId, frames, paths, factor, tryOcio) {
	return `
        ${RENDER_FRAME_FN}
        ${OCIO_CAPTURE_FN}
        var _arg = ${jsxVal(compNameOrId)};
        var comp = AE.findCompByNameOrId(_arg);
        if (!comp) return { ok: false, error: "no comp matching " + String(_arg) };
        var _frameNums = ${jsxVal(frames)};
        var _paths = ${jsxVal(paths)};
        var _factor = ${jsxVal(factor)};
        var _pick = ${jsxVal(CHECK_FRAME_PICK)};
        var _ws = AE.safeGet(function () { return app.project.workingSpace; }, "None");
        var _cms = AE.safeGet(function () { return Number(app.project.colorManagementSystem); }, null);
        // The OCIO Display Transform only under OCIO (not right under Adobe's ICC engine, measured 2026-11-12).
        var _useOcio = ${jsxVal(tryOcio)} && _ws !== "None" && _ws !== "" && _cms === 1;
        var _frames = [];
        function _renderAll(kind) {
            for (var _fi = 0; _fi < _frameNums.length; _fi++) {
                var _k = _frameNums[_fi];
                var _r = _renderFrame(comp, (_k + _pick) * comp.frameDuration, _paths[_fi], false);
                _r.frame = _k;
                _r.captureKind = kind;
                _frames.push(_r);
            }
        }
        var _res = { asked: _factor, before: null, set: false };
        var _renderError = null;
        try {
            _res.before = AE.safeGet(function () { return [comp.resolutionFactor[0], comp.resolutionFactor[1]]; }, null);
            if (_factor !== null && _res.before !== null && (_res.before[0] !== _factor || _res.before[1] !== _factor)) {
                try {
                    comp.resolutionFactor = [_factor, _factor];
                    _res.set = true;
                } catch (eSet) {
                    _res.setError = AE.errText(eSet);
                }
            }
            if (_useOcio) {
                var _maxT = (_frameNums[_frameNums.length - 1] + _pick) * comp.frameDuration;
                _captureWithOcio(comp, _maxT, _renderAll);
            }
            if (_frames.length === 0) _renderAll("direct");
        } catch (eRender) {
            _renderError = eRender;
        } finally {
            if (_res.set) {
                try {
                    comp.resolutionFactor = _res.before;
                    _res.restored = true;
                } catch (eRestore) {
                    _res.restored = false;
                    _res.restoreError = AE.errText(eRestore);
                }
            }
        }
        if (_renderError !== null) return { ok: false, error: "capture failed: " + AE.errText(_renderError), resolution: _res, frames: _frames };
        return {
            ok: true,
            frames: _frames,
            captureKind: _frames.length > 0 ? _frames[0].captureKind : null,
            resolution: _res,
            workingSpace: _ws,
            bitsPerChannel: AE.safeGet(function () { return app.project.bitsPerChannel; }, 8),
            projectFile: app.project.file ? app.project.file.fsName.replace(/\\\\/g, "/") : null,
            bgColor: AE.safeGet(function () { return [comp.bgColor[0], comp.bgColor[1], comp.bgColor[2]]; }, null)
        };
    `;
}
function structureJsx(compNameOrId, o) {
	return `
        ${COMP_CORNERS_FN}
        ${LIST_MISSING_FONTS_FN}
        ${LIST_MISSING_FOOTAGE_FN}
        var _arg = ${jsxVal(compNameOrId)};
        var comp = AE.findCompByNameOrId(_arg);
        if (!comp) return { ok: false, error: "no comp matching " + String(_arg) };
        var _o = ${jsxVal(o)};
        var _W = comp.width;
        var _H = comp.height;
        var _fd = comp.frameDuration;
        var _safe = { left: _o.margins[0], top: _o.margins[1], right: _W - _o.margins[2], bottom: _H - _o.margins[3] };
        var _r1 = function (v) { return Math.round(v * 10) / 10; };
        var _r6 = function (v) { return Math.round(v * 1e6) / 1e6; };

        function _layerKind(L) {
            if (L instanceof TextLayer) return "text";
            if (L instanceof ShapeLayer) return "shape";
            if (L instanceof AVLayer) return "av";
            return null;
        }
        function _skipWhy(L, kind) {
            if (kind === null) return "camera or light";
            if (_o.boundsOf === "text" && kind !== "text") return "not text";
            if (AE.safeGet(function () { return L.guideLayer; }, false)) return "guide layer";
            if (AE.safeGet(function () { return L.adjustmentLayer; }, false)) return "adjustment layer";
            if (AE.safeGet(function () { return L.nullLayer; }, false)) return "null";
            if (AE.safeGet(function () { return L.isTrackMatte; }, false)) return "track matte";
            if (AE.safeGet(function () { return L.hasVideo; }, true) === false) return "no video";
            if (!L.enabled) return "hidden (eye off)";
            if (typeof L.sourceRectAtTime !== "function") return "no sourceRectAtTime";
            return null;
        }
        function _keyTimes(group, out, depth) {
            if (depth > 12) return;
            var n = AE.safeGet(function () { return group.numProperties; }, 0);
            for (var i = 1; i <= n; i++) {
                var p = AE.safeGet(function () { return group.property(i); }, null);
                if (!p) continue;
                if (AE.safeGet(function () { return p.propertyType; }, null) === PropertyType.PROPERTY) {
                    var nk = AE.safeGet(function () { return p.numKeys; }, 0);
                    for (var k = 1; k <= nk; k++) out.push(p.keyTime(k));
                } else {
                    _keyTimes(p, out, depth + 1);
                }
            }
        }
        function _sampleTimes(L) {
            var t0 = Math.max(_o.from, L.inPoint);
            var t1 = Math.min(_o.to, L.outPoint);
            var ts = [];
            if (t1 <= t0) return ts;
            for (var t = t0; t < t1 - 1e-9; t += _o.step) ts.push(t);
            var keys = [];
            _keyTimes(L, keys, 0);
            for (var ki = 0; ki < keys.length; ki++) {
                if (keys[ki] >= t0 && keys[ki] < t1) ts.push(keys[ki]);
            }
            ts.sort(function (a, b) { return a - b; });
            var out = [];
            for (var si = 0; si < ts.length; si++) {
                if (out.length === 0 || ts[si] - out[out.length - 1] > _fd / 2) out.push(ts[si]);
            }
            if (out.length <= _o.maxSamples) return out;
            var thin = [];
            for (var ti = 0; ti < _o.maxSamples; ti++) thin.push(out[Math.floor(ti * out.length / _o.maxSamples)]);
            return thin;
        }
        // Layer to comp space without sourcePointToComp: 2D transform math up
        // the parent chain. Null when a layer in the chain is 3D.
        function _toComp2D(L, pt, t) {
            var p = [pt[0], pt[1]];
            var cur = L;
            while (cur) {
                if (AE.safeGet(function () { return cur.threeDLayer; }, false)) return null;
                var tr = cur.property("ADBE Transform Group");
                var a = tr.property("ADBE Anchor Point").valueAtTime(t, false);
                var pos = tr.property("ADBE Position").valueAtTime(t, false);
                var sc = tr.property("ADBE Scale").valueAtTime(t, false);
                var rot = tr.property("ADBE Rotate Z").valueAtTime(t, false) * Math.PI / 180;
                var x = (p[0] - a[0]) * sc[0] / 100;
                var y = (p[1] - a[1]) * sc[1] / 100;
                p = [pos[0] + x * Math.cos(rot) - y * Math.sin(rot), pos[1] + x * Math.sin(rot) + y * Math.cos(rot)];
                cur = AE.safeGet(function () { return cur.parent; }, null);
            }
            return p;
        }
        function _boxAt(L, t) {
            var r = L.sourceRectAtTime(t, false);
            if (!r || r.width <= 0 || r.height <= 0) return null;
            var pts = null;
            try {
                var c = _compCorners(L, r);
                pts = [c.topLeft, c.topRight, c.bottomLeft, c.bottomRight];
            } catch (eSp) { pts = null; }
            var via = "sourcePointToComp";
            if (pts === null || !pts[0] || pts[0].length < 2) {
                via = "transform";
                pts = [];
                var corners = [[r.left, r.top], [r.left + r.width, r.top], [r.left, r.top + r.height], [r.left + r.width, r.top + r.height]];
                for (var ci = 0; ci < 4; ci++) {
                    var q = _toComp2D(L, corners[ci], t);
                    if (q === null) return { error: "3D layer: comp-space bounds not worked out" };
                    pts.push(q);
                }
            }
            var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            for (var pi = 0; pi < 4; pi++) {
                if (pts[pi][0] < x0) x0 = pts[pi][0];
                if (pts[pi][0] > x1) x1 = pts[pi][0];
                if (pts[pi][1] < y0) y0 = pts[pi][1];
                if (pts[pi][1] > y1) y1 = pts[pi][1];
            }
            return { x0: x0, y0: y0, x1: x1, y1: y1, via: via };
        }
        function _visibleAt(L, t) {
            if (t < L.inPoint || t >= L.outPoint) return false;
            var op = AE.safeGet(function () { return L.property("ADBE Transform Group").property("ADBE Opacity").valueAtTime(t, false); }, 100);
            return op > 0;
        }

        var _bounds = { layersChecked: 0, samples: 0, findings: [], skipped: [], total: 0 };
        var _prevTime = comp.time;
        try {
            for (var li = 1; li <= comp.numLayers; li++) {
                var L = comp.layer(li);
                var kind = _layerKind(L);
                var why = _skipWhy(L, kind);
                if (why !== null) {
                    if (kind === "text" || _o.boundsOf === "all") _bounds.skipped.push({ index: L.index, name: L.name, why: why });
                    continue;
                }
                var times = _sampleTimes(L);
                if (times.length === 0) continue;
                _bounds.layersChecked++;
                var open = {};
                var finish = function (edge) {
                    var run = open[edge];
                    if (!run) return;
                    open[edge] = null;
                    _bounds.total++;
                    if (_bounds.findings.length < _o.maxItems) _bounds.findings.push(run);
                };
                var edges = ["left", "top", "right", "bottom"];
                for (var ti = 0; ti < times.length; ti++) {
                    var t = times[ti];
                    var box = null;
                    if (_visibleAt(L, t)) {
                        comp.time = t;
                        box = _boxAt(L, t);
                        _bounds.samples++;
                    }
                    if (box && box.error) {
                        _bounds.skipped.push({ index: L.index, name: L.name, why: box.error });
                        break;
                    }
                    var over = { left: 0, top: 0, right: 0, bottom: 0 };
                    var wholly = false;
                    if (box) {
                        over.left = _safe.left - box.x0;
                        over.top = _safe.top - box.y0;
                        over.right = box.x1 - _safe.right;
                        over.bottom = box.y1 - _safe.bottom;
                        wholly = box.x1 <= _safe.left || box.x0 >= _safe.right || box.y1 <= _safe.top || box.y0 >= _safe.bottom;
                    }
                    for (var ei = 0; ei < 4; ei++) {
                        var e = edges[ei];
                        if (!box || over[e] <= 0.5) { finish(e); continue; }
                        var run = open[e];
                        if (!run) {
                            run = { index: L.index, name: L.name, type: kind, edge: e, from: _r6(t), to: _r6(t), byPx: 0, extent: "partly", at: _r6(t), box: null, via: box.via };
                            open[e] = run;
                        }
                        run.to = _r6(t);
                        if (wholly) run.extent = "wholly";
                        if (over[e] > run.byPx) {
                            run.byPx = _r1(over[e]);
                            run.at = _r6(t);
                            run.box = { x: _r1(box.x0), y: _r1(box.y0), width: _r1(box.x1 - box.x0), height: _r1(box.y1 - box.y0) };
                        }
                    }
                }
                for (var fe = 0; fe < 4; fe++) finish(edges[fe]);
            }
        } finally {
            comp.time = _prevTime;
        }

        // Expressions in error, in this comp and every comp nested in it, each once.
        var _expr = { compsWalked: 0, propertiesVisited: 0, total: 0, errors: [], truncated: false };
        function _exprWalk(group, path, layerRef) {
            var n = AE.safeGet(function () { return group.numProperties; }, 0);
            for (var i = 1; i <= n; i++) {
                if (_expr.propertiesVisited >= _o.maxProperties) { _expr.truncated = true; return; }
                var p = AE.safeGet(function () { return group.property(i); }, null);
                if (!p) continue;
                _expr.propertiesVisited++;
                var name = AE.safeGet(function () { return p.name; }, "?");
                if (AE.safeGet(function () { return p.propertyType; }, null) === PropertyType.PROPERTY) {
                    if (!AE.safeGet(function () { return p.canSetExpression && p.expressionEnabled && p.expression !== ""; }, false)) continue;
                    var msg = AE.safeGet(function () { return p.expressionError; }, "");
                    if (!msg) continue;
                    _expr.total++;
                    if (_expr.errors.length < _o.maxItems) {
                        _expr.errors.push({ comp: layerRef.comp, layer: layerRef.layer, index: layerRef.index, property: path + name, error: "" + msg });
                    }
                } else {
                    _exprWalk(p, path + name + " > ", layerRef);
                }
            }
        }
        var _queue = [comp];
        var _seen = {};
        while (_queue.length > 0 && !_expr.truncated) {
            var C = _queue.shift();
            if (_seen["c" + C.id]) continue;
            _seen["c" + C.id] = true;
            _expr.compsWalked++;
            for (var xi = 1; xi <= C.numLayers; xi++) {
                var XL = C.layer(xi);
                _exprWalk(XL, "", { comp: C.name, layer: XL.name, index: XL.index });
                var src = AE.safeGet(function () { return XL.source; }, null);
                if (src && src instanceof CompItem && !_seen["c" + src.id]) _queue.push(src);
            }
        }

        return {
            ok: true,
            bounds: _bounds,
            fonts: _listMissingFonts(),
            footage: _listMissingFootage(),
            nestedCompIds: (function () { var ids = []; for (var k in _seen) { if (_seen.hasOwnProperty(k)) ids.push(Number(k.substring(1))); } return ids; })(),
            expressions: _expr
        };
    `;
}
var CHECK_FRAME_PICK;
function init_check_comp_jsx() {
	return (init_check_comp_jsx = __esmMin((() => {
		init_snippets();
		init_registry();
		CHECK_FRAME_PICK = .25;
	})))();
}

// tools/check-comp.js
function frameOfCapture(file) {
	const m = /frame-(\d+)\.png$/.exec(file);
	return m ? Number(m[1]) : null;
}
function aeFrameSource(transport, comp, opts) {
	const stallMs = opts.stallMs ?? 6e4;
	const drain = async (paths, before) => {
		if (paths.length === 0) return {
			settled: /* @__PURE__ */ new Set(),
			outstanding: [],
			unsettled: []
		};
		const settle = await waitForSettled(paths, {
			timeoutMs: opts.settleTimeoutMs ?? settleTimeoutFor(paths.length, opts.pixels),
			before,
			stallMs
		});
		return {
			settled: new Set(settle.settled.map((i) => paths[i])),
			outstanding: settle.unsettled.map((u) => u.path),
			unsettled: settle.unsettled
		};
	};
	return { async capture(frames, dir) {
		const t0 = performance.now();
		const paths = frames.map((k) => frameFile(dir, k));
		await promises.mkdir(dir, { recursive: true });
		const before = await stampFiles(paths);
		const result = await transport.execute({
			code: captureJsx(comp, frames, paths, opts.factor, opts.tryOcio),
			label: "check_comp_capture",
			timeoutMs: 6e4 + frames.length * 5e3
		});
		if (!result.ok) {
			const error = result.error ?? "capture call failed";
			if (/never picked up/i.test(error)) return {
				error,
				details: result,
				outstanding: []
			};
			return {
				error,
				details: result,
				outstanding: (await drain(paths, before)).outstanding
			};
		}
		const payload = result.result;
		const rendered = payload?.frames ?? [];
		const ok = rendered.filter((f) => f.ok && typeof f.writtenTo === "string");
		const okPaths = ok.map((f) => f.writtenTo);
		const okBefore = ok.map((f) => before[frames.indexOf(f.frame)]);
		if (!payload || payload.ok !== true) {
			const d2 = await drain(okPaths, okBefore);
			return {
				error: payload?.error ?? "capture reported no result",
				details: { resolution: payload?.resolution },
				outstanding: d2.outstanding
			};
		}
		const d = await drain(okPaths, okBefore);
		return {
			frames: frames.map((frame) => {
				const r = rendered.find((f) => f.frame === frame);
				if (!r) return {
					frame,
					error: "not captured"
				};
				if (!r.ok) return {
					frame,
					error: r.error ?? "capture failed"
				};
				if (!d.settled.has(r.writtenTo)) {
					const u = d.unsettled.find((x) => x.path === r.writtenTo);
					return {
						frame,
						error: `the capture had not finished writing when the wait ended (no capture finished for ${(stallMs / 1e3).toFixed(0)} s; ${u?.state ?? "missing"}): After Effects may still write it`
					};
				}
				return {
					frame,
					path: r.writtenTo
				};
			}),
			info: {
				captureKind: payload.captureKind ?? null,
				workingSpace: payload.workingSpace,
				bitsPerChannel: payload.bitsPerChannel,
				projectFile: payload.projectFile ?? null,
				bgColor: payload.bgColor ?? null,
				resolution: payload.resolution
			},
			seconds: (performance.now() - t0) / 1e3,
			outstanding: d.outstanding
		};
	} };
}
async function readPicture(file, target, convert) {
	const img = decodePng(await promises.readFile(file));
	if (convert) convert(img.rgb);
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
	return {
		pic,
		rgb,
		width,
		height,
		captured: [img.width, img.height]
	};
}
function capWorst(items, kindOf, severity, cap) {
	const byKind = /* @__PURE__ */ new Map();
	for (const it of items) {
		const k = kindOf(it);
		if (!byKind.has(k)) byKind.set(k, []);
		byKind.get(k).push(it);
	}
	for (const list of byKind.values()) list.sort((a, b) => severity(b) - severity(a));
	const out = [];
	const lists = [...byKind.values()];
	for (let round = 0; out.length < cap && lists.some((l) => l.length > round); round++) for (const l of lists) if (round < l.length && out.length < cap) out.push(l[round]);
	return out;
}
function countBy(items, kindOf) {
	const out = {};
	for (const it of items) out[kindOf(it)] = (out[kindOf(it)] ?? 0) + 1;
	return out;
}
function sampled(first, end, every) {
	const out = [];
	for (let k = first; k < end; k += every) out.push(k);
	return out;
}
async function checkComp(args, transport) {
	const started = performance.now();
	const every = args.every ?? 1;
	const downsample = args.downsample ?? 4;
	const maxFrames = args.maxFrames ?? 300;
	const chunkFrames = args.chunkFrames ?? 100;
	const t = resolveWatchThresholds(args.thresholds ?? {});
	const notes = [];
	const planRes = await transport.execute({
		code: planJsx(args.compNameOrId),
		label: "check_comp_plan"
	});
	if (!planRes.ok) return toMcpResult(planRes);
	const plan = planRes.result;
	if (!plan || plan.ok !== true) return toMcpResult(planRes);
	const fd = plan.frameDuration;
	const compFrames = Math.max(1, Math.round(plan.duration / fd));
	const fromSec = args.from ?? plan.workAreaStart;
	const toSec = args.to ?? plan.workAreaStart + plan.workAreaDuration;
	const first = Math.max(0, Math.min(compFrames - 1, Math.floor(fromSec / fd + 1e-6)));
	const end = Math.max(first + 1, Math.min(compFrames, Math.ceil(toSec / fd - 1e-6)));
	const all = sampled(first, end, every);
	let startIdx = 0;
	if (args.startFrame !== void 0) {
		startIdx = all.findIndex((k) => k >= args.startFrame);
		if (startIdx < 0) return errorResult("INVALID_ARGS", `startFrame ${args.startFrame} is past the range (frames ${first} to ${all[all.length - 1]})`);
	}
	const owned = all.slice(startIdx, startIdx + maxFrames);
	const ownedFrom = owned[0];
	const ownedTo = owned[owned.length - 1];
	const remaining = all.length - (startIdx + owned.length);
	const before = startIdx > 0 ? Math.min(startIdx, t.window + 1 + Math.ceil(t.frozenSeconds / (fd * every))) : 0;
	const after = remaining > 0 ? Math.min(remaining, t.window + 1) : 0;
	const frames = all.slice(startIdx - before, startIdx + owned.length + after);
	const next = remaining > 0 ? {
		startFrame: ownedTo + every,
		time: r6((ownedTo + every) * fd),
		framesLeft: remaining
	} : null;
	const outDir = path$1.resolve(args.outDir ?? path$1.join(os.tmpdir(), "comp-room-check", `${String(plan.compName).replace(/[^A-Za-z0-9_-]+/g, "-").slice(0, 40)}-${Date.now()}`)).replace(/\\/g, "/");
	const capDir = path$1.join(outDir, `captures-${randomUUID().slice(0, 8)}`).replace(/\\/g, "/");
	const readOnly = readOnlyMode();
	const target = {
		width: Math.max(1, Math.round(plan.width / downsample)),
		height: Math.max(1, Math.round(plan.height / downsample))
	};
	const source = aeFrameSource(transport, args.compNameOrId, {
		factor: readOnly ? null : downsample,
		tryOcio: args.colorManaged !== "off" && !readOnly,
		settleTimeoutMs: args.settleTimeoutMs,
		stallMs: args.stallTimeoutMs,
		pixels: target.width * target.height
	});
	const report = {
		comp: {
			name: plan.compName,
			id: plan.compId,
			size: [plan.width, plan.height],
			frameRate: r3(1 / fd),
			duration: r6(plan.duration)
		},
		range: {
			from: {
				frame: first,
				time: r6(first * fd)
			},
			to: {
				frame: all[all.length - 1],
				time: r6(all[all.length - 1] * fd)
			},
			source: args.from !== void 0 || args.to !== void 0 ? "from/to" : "work area",
			framesToCheck: all.length
		},
		step: every
	};
	if (plan.missingFootage.length > 0) {
		report.picture = {
			checked: false,
			reason: `source media missing for comp ${plan.compName}; restore or relink it, then check again`
		};
		report.missingFootage = plan.missingFootage;
		report.structure = await runStructure(args, transport, plan, first, end, fd);
		report.next = null;
		report.timings = { totalSeconds: r3((performance.now() - started) / 1e3) };
		return jsonResult({ result: report });
	}
	if (args.colorManaged !== "off" && plan.workingSpace !== "None" && plan.workingSpace !== "" && plan.colorManagementSystem !== 1) {
		report.picture = {
			checked: false,
			reason: `${iccManagedReason(plan.workingSpace, plan.bitsPerChannel)} The whole-piece check's picture checks (blank frames, black bars, pops, stutters, cuts, clipping, elements off frame) are tuned on display values, so they are not run.`
		};
		report.structure = await runStructure(args, transport, plan, first, end, fd);
		report.next = null;
		report.timings = { totalSeconds: r3((performance.now() - started) / 1e3) };
		return jsonResult({ result: report });
	}
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
	let stalled = null;
	const outstanding = [];
	const stallMs = args.stallTimeoutMs ?? 6e4;
	let measuredFrames = 0;
	let measuredOwned = 0;
	let chunksAsked = 0;
	for (let c = 0; c < frames.length; c += chunkFrames) {
		const chunk = frames.slice(c, c + chunkFrames);
		chunksAsked++;
		const res = await source.capture(chunk, capDir);
		if ("error" in res) {
			captureError = {
				error: res.error,
				atFrame: chunk[0],
				details: res.details
			};
			outstanding.push(...res.outstanding);
			break;
		}
		captureSeconds += res.seconds;
		if (info === null) {
			info = res.info;
			Object.assign(color, res.info);
			if (args.colorManaged !== "off") convert = await colorConversion(color, transport);
		}
		if (res.info.resolution?.set && res.info.resolution.restored === false) notes.push(`the comp's resolution could not be put back to ${JSON.stringify(res.info.resolution.before)} after a capture (${res.info.resolution.restoreError ?? "unknown error"}): set it in the comp panel`);
		for (const f of res.frames) {
			if (!f.path) {
				failures.push({
					frame: f.frame,
					error: f.error ?? "capture failed"
				});
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
					owned: {
						from: ownedFrom,
						to: ownedTo
					},
					openStart: startIdx > 0,
					openEnd: remaining > 0
				});
				watcher.add({
					frame: f.frame,
					pic: pic.pic,
					width: pic.width,
					height: pic.height
				});
				measuredFrames++;
				if (f.frame >= ownedFrom && f.frame <= ownedTo) measuredOwned++;
			} catch (err) {
				failures.push({
					frame: f.frame,
					error: `could not read the capture: ${err instanceof Error ? err.message : String(err)}`
				});
			}
			readSeconds += (performance.now() - r0) / 1e3;
			await promises.rm(f.path, { force: true });
		}
		if (res.outstanding.length > 0) {
			outstanding.push(...res.outstanding);
			stalled = { atFrame: Math.min(...res.outstanding.map(frameOfCapture).filter((k) => k !== null)) };
			break;
		}
	}
	if (outstanding.length === 0) await promises.rm(capDir, {
		recursive: true,
		force: true
	});
	const findings = watcher ? watcher.finish() : null;
	const measureSeconds = watcher ? watcher.measureMs / 1e3 : 0;
	let nextOut = next;
	const stopAt = captureError?.atFrame ?? stalled?.atFrame ?? null;
	if (stopAt !== null && Number.isFinite(stopAt) && stopAt <= ownedTo) {
		const at = Math.max(stopAt, ownedFrom);
		nextOut = {
			startFrame: at,
			time: r6(at * fd),
			framesLeft: all.length - all.indexOf(at)
		};
	}
	report.checked = {
		from: {
			frame: ownedFrom,
			time: r6(ownedFrom * fd)
		},
		to: {
			frame: ownedTo,
			time: r6(ownedTo * fd)
		},
		frames: findings?.framesChecked ?? 0,
		contextFrames: {
			before,
			after
		},
		captureFailures: failures.length
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
		resolutionFactor: asked === null ? "not touched (read-only mode): captured at the comp's own resolution and shrunk in Node" : resolution?.setError ? `could not be set (${resolution.setError}): captured at the comp's own resolution and shrunk in Node` : honoured === null ? "unknown: nothing was captured" : honoured ? `honoured: saveFrameToPng wrote ${captured[0]}\xD7${captured[1]}` : `not honoured: saveFrameToPng wrote ${captured[0]}\xD7${captured[1]}, shrunk in Node to ${measured?.[0]}\xD7${measured?.[1]}`,
		captureKind: info?.captureKind ?? null,
		stage: "output",
		picture: convert !== null ? "display values of the picture the viewer sees, as ae_render_frame writes the file: after colour conversion (colorPipeline), clamped and rounded to 8 bits; the capture's RGB is already laid over the comp background, so transparent areas read that colour" : "the raw capture (colorManaged off, or the colour conversion failed: see colorWarning): working-space values, over the comp background",
		...color.colorPipeline ? { colorPipeline: color.colorPipeline } : {},
		...color.colorWarning ? { colorWarning: color.colorWarning } : {}
	};
	if (stalled !== null) notes.push(`After Effects stopped writing captures: ${outstanding.length} had not finished when no capture had finished for ${r3(stallMs / 1e3)} s, so nothing more was asked of it. What was measured is reported; call again with startFrame ${(nextOut ?? { startFrame: stalled.atFrame }).startFrame} to continue (look at After Effects first: a dialog, a full disk or its cache)`);
	if (captureError !== null) {
		report.captureError = captureError;
		notes.push(`capturing stopped at frame ${captureError.atFrame}: ${captureError.error}. What was measured is reported; call again with startFrame ${(nextOut ?? { startFrame: captureError.atFrame }).startFrame} to continue`);
	}
	if (failures.length > 0) {
		report.captureFailures = failures.slice(0, 20);
		notes.push(`${failures.length} frame${failures.length > 1 ? "s" : ""} could not be captured or read; the series is broken there (see captureFailures)`);
	}
	report.thresholds = t;
	const flags = findings?.flags ?? [];
	const stretches = findings?.stretches ?? [];
	const shownFlags = capWorst(flags, (f) => f.kind, flagSeverity, 20).sort((a, b) => a.frame - b.frame);
	const shownStretches = capWorst(stretches, (s) => s.kind, stretchSeverity, 20).sort((a, b) => a.from.frame - b.from.frame);
	report.counts = {
		flags: countBy(flags, (f) => f.kind),
		stretches: countBy(stretches, (s) => s.kind)
	};
	report.flags = shownFlags;
	if (shownFlags.length < flags.length) report.flagsOmitted = flags.length - shownFlags.length;
	report.stretches = shownStretches;
	if (shownStretches.length < stretches.length) report.stretchesOmitted = stretches.length - shownStretches.length;
	if (findings?.extremes) report.extremes = findings.extremes;
	notes.push(...findings?.notes ?? []);
	let structureSeconds = 0;
	let structure = null;
	if (nextOut === null && args.structure !== false) {
		const s0 = performance.now();
		structure = await runStructure(args, transport, plan, first, end, fd);
		structureSeconds = (performance.now() - s0) / 1e3;
		report.structure = structure;
	} else report.structure = {
		checked: false,
		reason: args.structure === false ? "structure: false" : "structure checks run on the call that reaches the end of the range (next is not null)"
	};
	let sheetSeconds = 0;
	report.sheet = null;
	if (args.sheet !== false && findings !== null && outstanding.length > 0) report.sheet = {
		writtenTo: null,
		skipped: "no sheet: captures of the check were still outstanding in After Effects, and none is queued behind them"
	};
	else if (args.sheet !== false && findings !== null) {
		const s0 = performance.now();
		const sheetOpts = typeof args.sheet === "object" ? args.sheet : {};
		const sheet = await makeSheet(source, outDir, shownFlags, shownStretches, structure, fd, {
			from: first,
			to: end - 1
		}, target, convert, sheetOpts.maxTiles ?? DEFAULT_MAX_TILES, sheetOpts.thumbWidth, `${ownedFrom}-${ownedTo}`);
		sheetSeconds = (performance.now() - s0) / 1e3;
		report.sheet = sheet.sheet;
		outstanding.push(...sheet.outstanding);
	}
	if (outstanding.length === 0) await promises.rmdir(outDir).catch(() => {});
	report.captureQueue = outstanding.length === 0 ? {
		outstanding: 0,
		reading: "every capture asked of After Effects had finished writing before the check returned: nothing of the check is left in its queue"
	} : {
		outstanding: outstanding.length,
		folder: outstanding.some((p) => p.startsWith(capDir + "/")) ? capDir : outDir,
		frames: outstanding.map(frameOfCapture).filter((k) => k !== null).slice(0, 20),
		reading: `${outstanding.length} capture${outstanding.length > 1 ? "s" : ""} asked of After Effects had not finished when the check returned (none had finished for ${r3(stallMs / 1e3)} s); After Effects has no way to cancel them, so it may still write them. Their folder was kept, not deleted (deleting it while After Effects writes raises an error box there). Delete it once After Effects is idle.`
	};
	const coverageComplete = nextOut === next && failures.length === 0 && outstanding.length === 0;
	report.coverage = {
		framesAsked: owned.length,
		framesMeasured: measuredOwned,
		complete: coverageComplete && measuredOwned === owned.length,
		reading: coverageComplete && measuredOwned === owned.length ? `all ${owned.length} frames of this call were measured` : `${measuredOwned} of the ${owned.length} frames of this call were measured` + (stalled !== null ? "; the pass stopped because After Effects stopped writing captures" : captureError !== null ? "; the pass stopped on a failed capture" : "") + (failures.length > 0 ? `; ${failures.length} could not be captured or read` : "") + ". The findings cover the measured frames only."
	};
	const total = (performance.now() - started) / 1e3;
	report.timings = {
		captureSeconds: r3(captureSeconds),
		readSeconds: r3(readSeconds),
		measureSeconds: r3(measureSeconds),
		structureSeconds: r3(structureSeconds),
		sheetSeconds: r3(sheetSeconds),
		totalSeconds: r3(total),
		framesCaptured: measuredFrames,
		chunks: chunksAsked,
		framesPerSecond: total > 0 ? r3(measuredFrames / total) : null,
		msPerFrame: measuredFrames > 0 ? {
			capture: r3(captureSeconds * 1e3 / measuredFrames),
			read: r3((readSeconds - measureSeconds) * 1e3 / measuredFrames),
			measure: r3(measureSeconds * 1e3 / measuredFrames)
		} : null
	};
	if (info?.resolution?.set || info?.captureKind === "ocio") notes.push(`${info?.resolution?.set ? "the comp's resolution was set for the captures" : "a colour-managed capture layer was added"} and put back afterwards; After Effects still marks the project as changed (unsaved), which cannot be avoided`);
	if (readOnly) notes.push("read-only mode: the comp's resolution and the OCIO capture layer were not touched, so captures were full size (slower) and colour came from the pure-math conversion");
	report.notes = notes;
	return jsonResult({ result: report });
}
async function runStructure(args, transport, plan, first, end, fd) {
	const pct = args.safeArea?.percent;
	const px = args.safeArea?.px;
	const margins = pct !== void 0 ? [
		plan.width * pct / 100,
		plan.height * pct / 100,
		plan.width * pct / 100,
		plan.height * pct / 100
	] : px !== void 0 ? [
		px,
		px,
		px,
		px
	] : [
		0,
		0,
		0,
		0
	];
	const step = Math.max(fd, Math.round((args.boundsStep ?? .1) / fd) * fd);
	const opts = {
		from: first * fd,
		to: end * fd,
		step,
		margins,
		boundsOf: args.boundsOf ?? "text",
		maxSamples: 400,
		maxItems: 20,
		maxProperties: 5e4
	};
	const res = await transport.execute({
		code: structureJsx(args.compNameOrId, opts),
		label: "check_comp_structure",
		timeoutMs: 12e4
	});
	if (!res.ok) return {
		checked: false,
		reason: `structure script failed: ${res.error ?? "unknown"}`
	};
	const s = res.result;
	if (!s || s.ok !== true) return {
		checked: false,
		reason: `structure script failed: ${s?.error ?? "no result"}`
	};
	const offFrame = s.bounds.findings.map((f) => ({
		layer: {
			index: f.index,
			name: f.name,
			type: f.type
		},
		edge: f.edge,
		from: {
			time: r6(f.from),
			frame: Math.floor(f.from / fd + 1e-6)
		},
		to: {
			time: r6(f.to),
			frame: Math.floor(f.to / fd + 1e-6)
		},
		byPx: f.byPx,
		extent: f.extent,
		worstAt: {
			time: r6(f.at),
			frame: Math.floor(f.at / fd + 1e-6)
		},
		box: f.box,
		reading: `${f.type} layer ${f.index} "${f.name}" ${f.extent === "wholly" ? "is wholly" : "is partly"} past the ${f.edge} edge of the ${margins.some((m) => m > 0) ? "safe area" : "frame"} from ${r6(f.from)} s to ${r6(f.to)} s while visible, by up to ${f.byPx} px (at ${r6(f.at)} s)`
	})).sort((a, b) => a.from.time - b.from.time);
	const footageInComp = s.footage.items.filter((it) => it.usedInComps.length > 0);
	return {
		checked: true,
		safeArea: {
			margins: {
				left: r6(margins[0]),
				top: r6(margins[1]),
				right: r6(margins[2]),
				bottom: r6(margins[3])
			},
			against: margins.some((m) => m > 0) ? "safe area" : "frame edge"
		},
		offFrame: {
			count: s.bounds.total,
			layersChecked: s.bounds.layersChecked,
			samples: s.bounds.samples,
			sampleStep: r6(step),
			boundsOf: opts.boundsOf,
			findings: offFrame,
			...s.bounds.total > offFrame.length ? { omitted: s.bounds.total - offFrame.length } : {},
			...s.bounds.skipped.length > 0 ? { skipped: s.bounds.skipped.slice(0, 20) } : {},
			note: "top-level layers of this comp only (not inside nested comps); sampled at keyframe times and every sampleStep seconds, so a range's ends are known to within one step; a layer is visible when its eye is on, the time is inside its in and out points and its own opacity is above 0 (a parent's opacity is not counted)"
		},
		missingFonts: s.fonts.ok ? {
			count: s.fonts.count ?? 0,
			fonts: (s.fonts.fonts ?? []).slice(0, 20),
			scope: "project-wide"
		} : {
			count: null,
			error: s.fonts.error
		},
		missingFootage: {
			count: s.footage.count,
			items: footageInComp.slice(0, 20).concat(s.footage.items.filter((it) => it.usedInComps.length === 0).slice(0, Math.max(0, 20 - footageInComp.length))),
			scope: "project-wide (usedInComps names the comps that use each)"
		},
		expressionErrors: {
			count: s.expressions.total,
			errors: s.expressions.errors,
			compsWalked: s.expressions.compsWalked,
			propertiesVisited: s.expressions.propertiesVisited,
			...s.expressions.truncated ? { truncated: true } : {},
			note: "read after the frames were rendered (expressionError is filled in when a broken expression is set; read late in case a just-opened project fills it only when evaluated)"
		}
	};
}
async function makeSheet(source, outDir, flags, stretches, structure, fd, range, target, convert, maxTiles, thumbWidth, tag) {
	const tiles = /* @__PURE__ */ new Map();
	const add = (frame, kind, why) => {
		const k = Math.max(range.from, Math.min(range.to, frame));
		const tile = tiles.get(k) ?? {
			frame: k,
			kinds: []
		};
		if (!tile.kinds.includes(kind)) tile.kinds.push(kind);
		if (why !== void 0) (tile.why ??= []).push(why);
		tiles.set(k, tile);
	};
	for (const f of flags) add(f.frame, f.kind);
	for (const s of stretches) add(s.kind === "frozen" ? s.from.frame : s.worst?.frame ?? s.from.frame, s.kind);
	const off = structure?.offFrame?.findings ?? [];
	for (const o of off) add(o.from.frame, `off-${o.edge}`, `off-${o.edge}: "${o.layer.name}" at the first sampled time past the ${o.edge} edge (${o.from.time} s), while still partly in frame; the finding's worstAt is when it is furthest out`);
	if (tiles.size === 0) return {
		sheet: null,
		outstanding: []
	};
	const all = [...tiles.values()].sort((a, b) => a.frame - b.frame);
	const chosen = all.slice(0, maxTiles);
	const res = await source.capture(chosen.map((c) => c.frame), outDir);
	if ("error" in res) return {
		sheet: {
			writtenTo: null,
			error: `the sheet's frames could not be captured: ${res.error}`
		},
		outstanding: res.outstanding
	};
	const images = [];
	const labels = [];
	const kept = [];
	for (const c of chosen) {
		const got = res.frames.find((f) => f.frame === c.frame);
		if (!got?.path) continue;
		try {
			const pic = await readPicture(got.path, target, convert);
			await promises.writeFile(got.path, encodePngSrgb8(pic.width, pic.height, pic.rgb));
			images.push({
				width: pic.width,
				height: pic.height,
				rgb: pic.rgb,
				bitDepth: 8
			});
			kept.push({
				frame: c.frame,
				time: r6(c.frame * fd),
				kinds: c.kinds,
				...c.why ? { why: c.why } : {},
				path: got.path
			});
		} catch {
			await promises.rm(got.path, { force: true });
		}
	}
	if (images.length === 0) return {
		sheet: {
			writtenTo: null,
			error: "none of the sheet's frames could be read"
		},
		outstanding: res.outstanding
	};
	const tileW = Math.min(thumbWidth ?? 320, images[0].width);
	const maxChars = Math.max(4, Math.floor((tileW - 4) / 12));
	for (const k of kept) labels.push(`${k.time.toFixed(2)}s ${k.kinds.map((x) => SHORT[x] ?? x).join("+")}`.slice(0, maxChars));
	const sheet = composeContactSheet(images, {
		columns: Math.min(4, images.length),
		thumbWidth: tileW,
		labels
	});
	const sheetPath = path$1.join(outDir, `check-sheet-${tag}.png`).replace(/\\/g, "/");
	await promises.writeFile(sheetPath, encodePngSrgb8(sheet.width, sheet.height, sheet.rgb));
	return {
		sheet: {
			writtenTo: sheetPath,
			size: [sheet.width, sheet.height],
			tiles: kept.length,
			omitted: all.length - chosen.length,
			frames: kept,
			label: "each tile is labelled '<time>s <kind>' (several joined by +; black, white, clip and crush stand for near-black, near-white, clipped-high and clipped-low), time in seconds from the comp's start"
		},
		outstanding: res.outstanding
	};
}
var CAPTURE_STALL_MS, frameFile, LIST_CAP, DEFAULT_MAX_TILES, r6, r3, stretchSeverity, flagSeverity, thresholdsSchema, CHECK_COMP_SHAPE, checkCompTool, SHORT;
function init_check_comp() {
	return (init_check_comp = __esmMin((() => {
		init_png16();
		init_settled_read();
		init_sheet();
		init_watch();
		init_config();
		init_errors();
		init_policy();
		init_capture_shared();
		init_check_comp_jsx();
		init_define_tool();
		CAPTURE_STALL_MS = 6e4;
		frameFile = (dir, frame) => path$1.join(dir, `frame-${frame}.png`).replace(/\\/g, "/");
		LIST_CAP = 20;
		DEFAULT_MAX_TILES = 12;
		r6 = (v) => Math.round(v * 1e6) / 1e6;
		r3 = (v) => Math.round(v * 1e3) / 1e3;
		stretchSeverity = (s) => s.kind === "clipped-high" || s.kind === "clipped-low" ? (s.worst?.share ?? 0) * 1e3 + s.frames : s.frames;
		flagSeverity = (f) => f.kind === "pop" || f.kind === "cut" ? f.ratio : 1 / (f.ratio + 1e-6);
		thresholdsSchema = z.record(z.string(), z.union([z.number(), z.null()])).optional().describe("Override any threshold (the rest keep their defaults, all reported back as `thresholds`): frozenSeconds 0.5 (a run with no visible change at least this long is a frozen stretch), frozenShare 0.00002 (a pair shows no visible change when at most this share of pixels changed by more than changeAbove), darkBelow 0.04 / lightAbove 0.96 (a pixel is near-black when its brightest channel is at or below, near-white when its darkest is at or above), blackShare 0.99 / blackMean 0.01 (a frame is near-black when that share of pixels is near-black, or its mean luma is at or below), whiteShare 0.99 / whiteMean 0.99 (the same for near-white), clipHighShare 0.005 (a frame is clipped when that share of pixels is at 255 in all three channels), clipLowShare null (the same at 0; null measures but never flags: a black background is at 0 by design), and the diff thresholds of ae_render_frame: changeAbove 0.04, spikeRatio 3, holdRatio 0.25, quietBelow 0.002, movingShare 0.0005, window 3, repeatBelow 0.0001.");
		CHECK_COMP_SHAPE = {
			compNameOrId: z.union([z.string(), z.number()]).describe("Composition name or numeric item id."),
			from: z.number().nonnegative().optional().describe("Start of the range, seconds from the comp's start (default: the work area's start)."),
			to: z.number().positive().optional().describe("End of the range (exclusive), seconds from the comp's start (default: the work area's end)."),
			startFrame: z.number().int().nonnegative().optional().describe("Continue a range: the `next.startFrame` an earlier call returned (same other arguments)."),
			every: z.number().int().min(1).max(60).optional().describe("Check every Nth frame (default 1, every frame). Above 1 is faster but a one-frame pop or flash between checked frames is missed, a stutter can no longer be told from a short hold, and stretch ends are known to within N − 1 frames; the result says so in `notes`."),
			downsample: z.number().int().min(1).max(8).optional().describe("Capture size: 1 full, 2 half, 4 quarter (default; 270×480 for 1080×1920). Applied through the comp's resolutionFactor before saveFrameToPng and put back afterwards, even when the script fails. Whether saveFrameToPng honours it is measured on the PNG that comes back (`capture`): a full-size capture is shrunk in Node to the asked size, so the numbers mean the same either way."),
			maxFrames: z.number().int().min(1).max(2e3).optional().describe("Frames checked per call at most (default 300); the rest is left for `next`."),
			chunkFrames: z.number().int().min(1).max(300).optional().describe("Frames per After Effects script (default 100). A script returns as soon as it has asked for the frames; the files arrive over the following seconds. The next chunk is asked for only once every capture of this one has finished, so After Effects never holds more than one chunk in its queue."),
			thresholds: thresholdsSchema,
			safeArea: z.object({
				percent: z.number().min(0).max(45).optional().describe("Inset on each side, as a percent of the frame's width (left/right) and height (top/bottom)."),
				px: z.number().min(0).optional().describe("Inset on each side, comp pixels.")
			}).optional().describe("Check bounds against a safe area instead of the frame edge (default: the frame)."),
			boundsOf: z.enum(["text", "all"]).optional().describe("Which layers the bounds check measures: 'text' (default) or 'all' visible layers with pixels. Other layer types are opt-in because backgrounds and shapes bleed off frame on purpose."),
			boundsStep: z.number().positive().optional().describe("Bounds are sampled at every keyframe time and every boundsStep seconds (default 0.1)."),
			structure: z.boolean().optional().describe("Run the structure checks on the call that reaches the end of the range (default true)."),
			colorManaged: z.enum(["auto", "off"]).optional().describe("'auto' (default) measures the picture after colour conversion, as ae_render_frame; 'off' the raw capture."),
			settleTimeoutMs: z.number().int().positive().optional().describe("How long to wait for the first captures of each chunk (default: grows with the chunk). The wait then goes on for as long as captures keep finishing, so a long or heavy comp is not cut off by it."),
			stallTimeoutMs: z.number().int().positive().optional().describe(`After Effects is taken to have stopped writing when no capture has finished for this long (default ${CAPTURE_STALL_MS / 1e3} s). The check then queues nothing more, keeps the capture folder (After Effects may still write into it) and says how many captures were outstanding and where to continue.`),
			outDir: z.string().optional().describe("Folder for the contact sheet and its frames (default: a new folder under the system temp folder)."),
			sheet: z.union([z.boolean(), z.object({
				maxTiles: z.number().int().min(1).max(48).optional(),
				thumbWidth: z.number().int().min(64).max(1024).optional()
			})]).optional().describe("The contact sheet of flagged moments (default on, at most 12 tiles; the rest are counted).")
		};
		checkCompTool = defineTool({
			name: "ae_check_comp",
			title: "Check comp",
			description: "Check a whole comp the way a viewer would watch it, in one call: walks the work area (or `from`..`to`), renders every frame (or every `every`th) at a reduced size, measures each in Node and lists what stands out. Flagged moments (`flags`, sorted by time): a one-frame pop or flash, a cut or jump, a stutter (a frame repeated while the frames around move) and a repeat at the edge of the range — the `diff` flags of ae_render_frame over the whole piece. Stretches: frozen (no visible change for at least frozenSeconds; a held title is legitimate, the report states the fact), near-black and near-white frames, and clipping (pixels at 255 in all three channels, with the box where they sit; per-channel shares alongside). Structure, read from the project on the call that reaches the end of the range: text layers whose bounds leave the frame (or `safeArea`) while visible — layer, time range, edge, by how many pixels, partly or wholly outside — missing fonts and footage, and expressions in error (in nested comps too). One contact sheet tiles the flagged moments, labelled with time and kind; the frames on it are kept beside it, every other capture is deleted as soon as it is measured. A clean comp returns empty lists and no sheet. Bounded: at most `maxFrames` frames a call (default 300); when the range is not finished the result says where to continue (`next.startFrame`): call again with the same arguments plus that startFrame. Captures are asked of After Effects a chunk at a time, the next chunk only once every capture of the last has finished writing, and the wait follows After Effects' pace (it goes on while captures keep arriving), so a long comp is not cut off part way. The check never returns with its captures still queued unless After Effects stopped writing (none finished for `stallTimeoutMs`): it then asks for nothing more, keeps the capture folder instead of deleting it, and says so in `captureQueue`; `coverage` says how many of the call's frames were measured. Numbers are display values of the picture the viewer sees (stage 'output', after colour conversion, as ae_render_frame writes the file), with the thresholds used; it never says pass or fail. Times are seconds from the comp's start (frame × frame duration), ignoring the display start time.",
			group: "render",
			blockedInReadOnly: false,
			effect: "write",
			inputShape: CHECK_COMP_SHAPE,
			handler: async (args, transport) => {
				const invalid = (message) => errorResult("INVALID_ARGS", message);
				if (args.thresholds !== void 0) {
					const err = watchArgsError(args.thresholds);
					if (err) return invalid(err);
				}
				if (args.from !== void 0 && args.to !== void 0 && args.to <= args.from) return invalid("`to` must be after `from`");
				if (args.safeArea && args.safeArea.percent === void 0 === (args.safeArea.px === void 0)) return invalid("`safeArea` takes exactly one of `percent` or `px`");
				if (args.outDir !== void 0) {
					const rejection = rejectedOutputPath(args.outDir);
					if (rejection !== null) return errorResult("IO", rejection, { hint: "Pick a folder outside the mailbox." });
				}
				return checkComp(args, transport);
			}
		});
		SHORT = {
			"near-black": "black",
			"near-white": "white",
			"clipped-high": "clip",
			"clipped-low": "crush"
		};
	})))();
}

// tools/comp-info.js
var compInfoTool;
function init_comp_info() {
	return (init_comp_info = __esmMin((() => {
		init_snippets();
		init_registry();
		init_define_tool();
		compInfoTool = defineTool({
			name: "ae_comp_info",
			title: "Comp info",
			description: "Detailed comp info: size, fps, duration, work area, motion blur, comp markers (`markers.keyframes`: each `time` in seconds and `value.comment`, `value.duration`; null when there are none), layer summaries. Pass a comp name or item id — or an ARRAY of them to fetch several comps in one call.",
			group: "inspect",
			blockedInReadOnly: false,
			effect: "read",
			inputShape: { nameOrId: z.union([
				z.string(),
				z.number(),
				z.array(z.union([z.string(), z.number()])).min(1)
			]).describe("Composition name (exact match) or numeric item id — or an array of either to batch several comps into one round trip. If you don't know any, call ae_project_info first.") },
			handler: async (args, transport) => {
				const targets = Array.isArray(args.nameOrId) ? args.nameOrId : null;
				const code = targets ? `
        ${COMP_INFO_FN}
        var _targets = ${jsxVal(targets)};
        var _comps = [];
        var _misses = 0;
        for (var _ti = 0; _ti < _targets.length; _ti++) {
            var _c = AE.findCompByNameOrId(_targets[_ti]);
            if (_c) {
                _comps.push(_compInfo(_c));
            } else {
                _misses++;
                _comps.push({ ok: false, found: false, error: "no comp matching " + String(_targets[_ti]) });
            }
        }
        return { ok: _misses === 0, count: _comps.length, missing: _misses, comps: _comps };
    ` : `
        ${COMP_INFO_FN}
        var _arg = ${jsxVal(args.nameOrId)};
        var _c = AE.findCompByNameOrId(_arg);
        if (!_c) return { ok: false, found: false, error: "no comp matching " + String(_arg) };
        return _compInfo(_c);
    `;
				const result = await transport.execute({
					code,
					label: "comp_info"
				});
				return toMcpResult(result);
			}
		});
	})))();
}

// tools/context.js
var CODE$1, contextTool;
function init_context() {
	return (init_context = __esmMin((() => {
		init_instances();
		init_define_tool();
		CODE$1 = `
    var proj = app.project;
    var ai = proj.activeItem;
    // The resident agent (pull path) marks the instance that answered; null
    // means this call came in through the push path (AfterFX.exe -r).
    var agent = AE.safeGet(function () { return $.global.AE_MCP_AGENT || null; }, null);
    var ctx = {
        project: {
            file: proj.file ? proj.file.fsName.replace(/\\\\/g, "/") : null,
            dirty: proj.dirty,
            numItems: proj.numItems,
            bitsPerChannel: proj.bitsPerChannel
        },
        instance: agent ? {
            id: agent.state.id,
            idSource: agent.state.idSource,
            served: agent.state.served
        } : null,
        activeComp: null,
        selectedLayers: [],
        helpers: [
            "AE.findCompByNameOrId(nameOrId)",
            "AE.findComps(nameOrIdOrPattern) \u2014 '*' glob supported",
            "AE.findItemById(id)",
            "AE.findItem(idOrName) \u2014 any project item",
            "AE.findFolder(idOrName) \u2014 null/undefined = root folder",
            "AE.findLayerInComp(comp, indexOrNameOrIdRef) \u2014 accepts { id: n } (stable Layer.id, AE 22+)",
            "AE.findLayerById(comp, id)",
            "AE.resolveLayers(comp, target) \u2014 index | name | { id: n } | 'selected' | 'all' | array of those",
            "AE.snapshotKeys(prop) / AE.applyKeys(prop, keys) / AE.removeAllKeys(prop)",
            "AE.setEase(prop, keyIndex, inInf, outInf, inSpeed?, outSpeed?) \u2014 dims/spatial handled",
            "AE.writeValue(prop, value, time?) / AE.readValue(prop, time?) \u2014 separated-dimension safe, __kind values accepted",
            "AE.offsetValue(prop, delta) \u2014 shift a value or every keyframe",
            "AE.applyKeySpecs(prop, [{time, value, interp?}], {replace, interp, spatialTangents}) \u2014 keyframe.apply's engine",
            "AE.moveAnchor(layer, [x, y]) \u2014 anchor move with position compensation",
            "AE.layerRect(layer, time) / AE.pointInRect(rect, preset) \u2014 anchor presets on rendered bounds",
            "AE.shapeGroupBounds(group, {time, includeStroke}) / AE.shapeLayerBounds(layer, opts)",
            "AE.walkShapeContents(contents, fn) / AE.recolorContents(contents, opts) / AE.canonicalGroup(group, precision)",
            "AE.geometryShape('ellipse'|'rect', center, size, roundness) \u2014 a Shape for masks/paths",
            "AE.propertyAtPath(root, path) \u2014 null instead of throwing",
            "AE.ownerLayer(prop) \u2014 the layer a property belongs to",
            "AE.bakeKeysAtTime(root, time) \u2014 freeze every animated property below root",
            "AE.layerIdSnapshot(comp) / AE.layersSince(comp, snap) \u2014 which layers a command created",
            "AE.withSelection(comp, layers, fn) \u2014 run a menu command on exactly these layers, selection restored",
            "AE.rect(shapeLayerOrGroup, [w,h], [x,y], {name, roundness, fill:[r,g,b], stroke, strokeWidth}) \u2014 group+path+style in one call",
            "AE.ellipse(shapeLayerOrGroup, [w,h], [x,y], {name, fill, stroke, strokeWidth})",
            "AE.ensureParentDir(path) \u2014 mkdir -p for an output file, returns the File",
            "AE.fitSpatialTangent(tangent, dims) \u2014 pad or trim a spatial tangent to the property's component count (Position holds 3 even on a 2D layer)",
            "AE.itemTypeName(item) \u2014 'CompItem' | 'FootageItem' | 'FolderItem' | 'UnknownItem'",
            "AE.serializeItemSummary(item)",
            "AE.serializeLayerSummary(layer)",
            "AE.serializeLayerFull(layer, opts) \u2014 opts.detail:'summary' drops default-value props",
            "AE.serializeTransform(layer)",
            "AE.serializePropertyGroup(group, depth, maxDepth, opts)",
            "AE.serializeCompMarkers(comp)",
            "AE.exportProject()",
            "AE.importProject(doc, opts)",
            "AE.safeGet(fn, fallback)",
            "AE.valueToJson(val)"
        ],
        es3Rules: [
            "var only (no let/const)",
            "function() {} only (no arrow =>)",
            "string concat only (no template literals)",
            "for(var i=0;i<n;i++) only (no for-of, no forEach/map/filter)",
            "indexOf !== -1 (no includes/startsWith/endsWith)",
            "NEVER chain ternaries: a ? b : c ? d : e parses LEFT-associative in ExtendScript \u2014 parenthesize or use if/else",
            "log('msg') to push breadcrumbs",
            "return <JSON-serializable> at end"
        ],
        tips: [
            "reparenting a layer that has keyframes: use layer.set_parent with jump:true (no transform compensation) \u2014 plain parent assignment rewrites values and corrupts keys",
            "easing: keyframe.set_easing (op) or AE.setEase (eval) \u2014 both handle the spatial=1/per-dimension KeyframeEase bookkeeping",
            "auditing a comp: ae_layer_info layerIndex:'all' with detail:'summary' skips default-value properties and includes key ease (speed/influence)",
            "render queue output folders are auto-created on render.add_to_queue / render.set_output / render.start",
            "many keys at once: keyframe.apply takes the whole list with per-key easing; its 'hold' only holds the OUT side, so a fade that ends in a hold key still fades",
            "Position separated into X/Y (Separate Dimensions, or layers from 'Create Shapes from Vector Layer'): every write op and AE.writeValue route to the followers automatically",
            "imported Illustrator layers: layer.convert_to_shapes (strips ' Outlines', can remove the source layer/footage); then shape.group_bounds / layer.split_groups to work per part",
            "layer targets accept arrays everywhere they accept 'all' \u2014 [\\"A\\", \\"B\\", { id: 12 }] is one call",
            "verifying motion: ae_render_frame times + contactSheet tiles the frames into one labelled PNG; analyze reports edge bands / content bounds; comp.sample reads values at several times",
            "several After Effects instances (AfterFX.exe -m): each MCP server addresses ONE, chosen by AE_MCP_INSTANCE (instance id or open project file name); the response's instances[] lists what is live \u2014 if the project you need is open elsewhere, say so instead of editing the wrong one"
        ],
        undoContract: [
            "every ae_do / eval.run call is auto-wrapped in ONE undo group",
            "one Ctrl+Z (or project.undo) reverts the entire call; batch.run = one call = one undo step",
            "NEVER call app.beginUndoGroup/endUndoGroup in eval.run code \u2014 an unbalanced group corrupts undo for the session",
            "if a call that changes the project THROWS, its own changes are rolled back before the error is returned: a marker is added inside the still-open group, the group is closed and undone once with dialogs suppressed; details.rollback says whether it worked (rolledBack, verified) and what is left if not \u2014 never undo again for a call that was rolled back",
            "a call that changed nothing is never followed by an undo (that would revert the user's previous action); read-only calls and calls outside the group (undo, redo, project open/new) are never rolled back",
            "eval.run and batch.run take rollback: false to keep a partial result; batch.run with stopOnError rolls the whole batch back unless rollback: false, and without stopOnError nothing is rolled back",
            "after a rollback, Redo would replay the failed call (and its marker folder): do not redo it",
            "render queue: After Effects 2027 has gone into crash recovery on undo after scripted render-queue changes (observed twice on 2026-11-10; a precaution, not a proven cause). A call that changed the render queue is never rolled back (details.rollback lists addedItems and what to do next), and once any call changed it, rollback and project.undo / project.redo / command 16/2035 refuse for the rest of the session unless acceptRenderQueueRisk: true (save first). project.open / project.new clear the block; ae_do's context shows undoBlocked while it is set",
            "undo/redo itself runs OUTSIDE the group, with dialogs suppressed: use project.undo / project.redo (or command.execute 16/2035) as its own call \u2014 never inside batch.run, and never via eval.run; their result reports any error After Effects raised (aeErrors, warning)",
            "a timeout AFTER the request was picked up most likely means a modal dialog in After Effects (instance.dialogs may not see it): look at the After Effects window before retrying",
            "ae_save_project and files written to disk (rendered PNGs, exported JSON) are NOT undoable"
        ]
    };
    if (ai && ai instanceof CompItem) {
        ctx.activeComp = {
            id: ai.id,
            name: ai.name,
            width: ai.width,
            height: ai.height,
            fps: ai.frameRate,
            duration: ai.duration,
            numLayers: ai.numLayers,
            bgColor: [ai.bgColor[0], ai.bgColor[1], ai.bgColor[2]]
        };
        var sel = [];
        for (var si = 1; si <= ai.numLayers; si++) {
            if (ai.layer(si).selected) sel.push({ index: si, name: ai.layer(si).name });
        }
        ctx.selectedLayers = sel;
    }
    // Item summary (compact). Type via AE.itemTypeName \u2014 the inline ternary
    // chain this used to be labelled EVERY item "Folder": ExtendScript parses
    // a ? b : c ? d : e left-associatively.
    var items = [];
    for (var i = 1; i <= Math.min(proj.numItems, 50); i++) {
        var it = proj.item(i);
        items.push({
            id: it.id,
            name: it.name,
            type: AE.itemTypeName(it)
        });
    }
    ctx.items = items;
    if (proj.numItems > 50) ctx.itemsTruncated = true;
    return ctx;
`;
		contextTool = defineTool({
			name: "ae_context",
			title: "Session context",
			description: "Ambient context: project state, active comp, selected layers, item list, AE.* helpers, ES3 rules, and the undo contract (every call = one auto undo group; a call that throws is rolled back). Call at session start; then rely on ae_do response context.",
			group: "inspect",
			blockedInReadOnly: false,
			effect: "read",
			inputShape: {},
			handler: async (_args, transport) => {
				const result = await transport.execute({
					code: CODE$1,
					label: "context"
				});
				if (!result.ok) return toMcpResult(result);
				const [instances, target] = await Promise.all([listInstances(), transport.describeTarget ? transport.describeTarget() : Promise.resolve(null)]);
				const merged = {
					...result.result !== null && typeof result.result === "object" && !Array.isArray(result.result) ? result.result : { value: result.result },
					transport: target === null ? null : target.mode === "pull" ? {
						mode: "pull",
						instance: target.instance.id
					} : target.mode === "push" ? { mode: "push" } : {
						mode: "error",
						message: target.message
					},
					instances: instances.map((i) => ({
						label: instanceLabel(i),
						id: i.id,
						alive: i.alive,
						busy: i.heartbeat?.busy ?? false,
						project: i.heartbeat?.project ?? null,
						aeVersion: i.heartbeat?.aeVersion ?? null,
						lastSeenMsAgo: i.ageMs
					}))
				};
				return toMcpResult({
					...result,
					result: merged
				});
			}
		});
	})))();
}

// tools/do.js
function rollbackSentence(rb) {
	if (!rb) return "";
	const errors = rb.aeErrors?.length ? ` After Effects reported during the undo: ${rb.aeErrors.join(" | ")}.` : "";
	if (rb.rolledBack) return ` \u2014 Rolled back: the call's changes were undone before this error was returned (${rb.verified === "signature" ? "checked against the project's items before the call" : rb.verified === "partial" ? "checked against the first 1000 items and the item count" : "checked by the rollback marker only"}).${errors}`;
	const next = rb.next ? ` Next: ${rb.next}` : "";
	if (!rb.attempted) return ` \u2014 Not rolled back (${rb.reason ?? "no reason given"})${rb.left ? `: ${rb.left}` : ""}.${next}${errors}`;
	return ` \u2014 NOT rolled back: ${rb.reason ?? "the rollback could not be confirmed"}. Left: ${rb.left ?? "unknown — inspect the project"}.${next}${errors}`;
}
function isBatchShaped(opResult) {
	if (opResult === null || typeof opResult !== "object") return false;
	return Array.isArray(opResult.results);
}
function countLines(text) {
	let n = 0;
	for (let i = 0; i < text.length; i++) if (text[i] === "\n") n++;
	return n;
}
function jsxErrorLocation(line, wrappedCode, wrapperLinesAboveUserJsx, opName, source) {
	if (typeof line !== "number" || !Number.isFinite(line)) return {};
	const wrappedLine = line - NEW_FUNCTION_HEADER_LINES;
	const out = { errorLine: line };
	const userLine = wrappedLine - wrapperLinesAboveUserJsx;
	if (opName === "eval.run") {
		if (userLine >= 1 && userLine <= source.userLines) {
			out.userCodeLine = userLine;
			if (source.file !== null) {
				out.file = source.file;
				out.fileLine = userLine;
			}
		} else out.inWrapper = true;
	}
	const lines = wrappedCode.split("\n");
	if (wrappedLine >= 1 && wrappedLine <= lines.length) {
		const from = Math.max(1, wrappedLine - 2);
		const to = Math.min(lines.length, wrappedLine + 2);
		const excerpt = [];
		for (let n = from; n <= to; n++) excerpt.push(`${n === wrappedLine ? ">" : " "} ${n - wrapperLinesAboveUserJsx}| ${lines[n - 1]}`);
		out.codeExcerpt = excerpt.join("\n");
	}
	return out;
}
function callerLineMessage(message, line, location) {
	if (typeof line !== "number") return message;
	const raw = `(line ${line})`;
	if (message.indexOf(raw) === -1) return message;
	let replacement = null;
	if (typeof location.fileLine === "number" && typeof location.file === "string") replacement = `(${location.file}:${location.fileLine})`;
	else if (typeof location.userCodeLine === "number") replacement = `(line ${location.userCodeLine} of your code)`;
	else if (location.inWrapper === true) replacement = `(line ${line} of the plugin's wrapper, not your code \u2014 see details.codeExcerpt)`;
	return replacement === null ? message : message.replace(raw, replacement);
}
var doTool, NEW_FUNCTION_HEADER_LINES;
function init_do() {
	return (init_do = __esmMin((() => {
		init_errors();
		/* @__PURE__ */ init_opschema();
		init_policy();
		init_registry();
		init_define_tool();
		doTool = defineTool({
			name: "ae_do",
			title: "Execute operation",
			description: "Execute an atomic operation by name (from ae_catalog). Operations can create, change and delete project content; open, close, clear and save projects; render and write files; run After Effects menu commands; change After Effects preferences; start or stop After Effects instances; read and close dialogs that block scripting; and, through eval.run when enabled, run custom ExtendScript with the user's own access to After Effects, files and system commands. Arguments are validated against the operation's declared parameters before anything reaches AE. Have more than one operation to run? Wrap them in ONE batch.run instead of several ae_do calls — read/verify steps (comp.info, layer.info, render.frame) can ride in the same batch. Every call is automatically wrapped in ONE undo group: a single Ctrl+Z (or project.undo) reverts the entire call, and a batch.run counts as one call. If a call that changes the project THROWS, its own changes are rolled back before the error is returned (one undo, with dialogs suppressed); details.rollback says whether that worked and what is left if not. eval.run and batch.run take rollback: false to keep a partial result. Never call app.beginUndoGroup/endUndoGroup in eval.run code — the wrapper already did. The exception is undo/redo itself (project.undo, project.redo, command.execute id 16/2035): those run outside the group, with dialogs suppressed, report any error After Effects raised, and cannot ride inside a batch.run. Response includes ambient context (active comp, selected layers, project state) at zero extra round trips. Example: ae_do({ operation: 'keyframe.add', args: { comp: 'Main', layer: 1, property: ['Transform','Position'], time: 2, value: [960,540] } })",
			group: "operations",
			blockedInReadOnly: false,
			effect: "destructive",
			inputShape: {
				operation: z.string().describe("Operation name from ae_catalog (e.g. 'layer.create_solid', 'keyframe.add')."),
				args: z.record(z.string(), z.unknown()).optional().describe("Arguments for the operation. Validated against ae_catalog's declared params: missing required args, wrong types, and unknown keys are rejected before AE is contacted. Omit for zero-param operations."),
				timeoutMs: z.number().int().positive().optional().describe("Per-call timeout in milliseconds (default 60000). Raise for long operations like render.start or big batch.run calls.")
			},
			handler: async (doArgs, transport) => {
				const op = getOp(doArgs.operation);
				if (!op) {
					const withheld = denyUnregisteredOperation(doArgs.operation);
					if (withheld) return errorResult("FORBIDDEN", withheld.message, {
						details: { operation: doArgs.operation },
						hint: withheld.hint
					});
					const suggestion = suggestName(doArgs.operation, listOps().map((o) => o.name));
					return errorResult("UNKNOWN_OPERATION", `unknown operation '${doArgs.operation}'`, {
						details: {
							operation: doArgs.operation,
							suggestion
						},
						hint: suggestion ? `Did you mean '${suggestion}'? Use ae_catalog to list operations.` : "Use ae_catalog to discover available operations."
					});
				}
				const denial = denyOperation(op);
				if (denial) return errorResult("FORBIDDEN", denial.message, {
					details: {
						operation: op.name,
						category: op.category
					},
					hint: denial.hint
				});
				const validated = validateOpArgs(op, doArgs.args);
				if (!validated.ok) return errorResult("INVALID_ARGS", `invalid arguments for '${op.name}': ` + validated.issues.map((i) => `${i.path} \u2014 ${i.message}`).join("; "), {
					details: {
						operation: op.name,
						issues: validated.issues,
						expected: summarizeParams(op.params)
					},
					hint: `ae_catalog({ category: '${op.category}' }) returns the full parameter reference.`
				});
				const consent = denyAppConfig(op, validated.value);
				if (consent) return errorResult("FORBIDDEN", consent, {
					details: {
						operation: op.name,
						category: op.category
					},
					hint: "Ask the user first if they have not explicitly requested this change."
				});
				const prepared = prepareOp(op, validated.value);
				if (!prepared.ok) return errorResult("INVALID_ARGS", `invalid arguments for '${op.name}': ${prepared.error}`, {
					details: { operation: op.name },
					...prepared.hint ? { hint: prepared.hint } : {}
				});
				const opArgs = prepared.args;
				const sourceFile = prepared.source?.file ?? null;
				if (op.run) {
					const started = Date.now();
					let opResult2;
					try {
						opResult2 = await op.run(opArgs, transport);
					} catch (err) {
						return errorResult("TRANSPORT", `${op.name}: ${err instanceof Error ? err.message : String(err)}`, {
							details: { operation: op.name },
							stack: err instanceof Error ? err.stack ?? null : null,
							durationMs: Date.now() - started
						});
					}
					const reported2 = jsxReportedFailure(opResult2);
					if (reported2) {
						const extra = opResult2;
						return errorResult(extra.errorCode ?? "OPERATION_FAILED", `${op.name}: ${reported2.error}`, {
							details: {
								operation: op.name,
								result: opResult2
							},
							durationMs: Date.now() - started,
							...extra.hint ? { hint: extra.hint } : {}
						});
					}
					return jsonResult({
						result: opResult2,
						context: null,
						logs: [],
						durationMs: Date.now() - started
					});
				}
				const userJsx = op.toJsx(opArgs);
				const wrappedCode = `
        var _opResult = (function() {
            ${userJsx}
        })();
        ${AMBIENT_CONTEXT_JSX}
        return { result: _opResult, context: _ctx };
    `;
				const wrapperLinesAboveUserJsx = countLines(wrappedCode.slice(0, wrappedCode.indexOf(userJsx)));
				const result = await transport.execute({
					code: wrappedCode,
					label: op.name,
					undoGroup: wantsUndoGroup(op, opArgs),
					suppressDialogs: wantsDialogSuppression(op, opArgs),
					rollback: wantsRollback(op, opArgs),
					acceptRenderQueueRisk: opArgs.acceptRenderQueueRisk === true,
					timeoutMs: doArgs.timeoutMs ?? 6e4
				});
				if (!result.ok) {
					const location = jsxErrorLocation(result.line, wrappedCode, wrapperLinesAboveUserJsx, op.name, {
						userLines: countLines(userJsx) + 1,
						file: sourceFile
					});
					const message = callerLineMessage(result.error ?? "unknown failure", result.line, location) + rollbackSentence(result.rollback);
					return errorResult(result.errorCode ?? "TRANSPORT", message, {
						details: {
							operation: op.name,
							...location,
							...result.rollback ? { rollback: result.rollback } : {},
							...result.dialogs?.length ? { dialogs: result.dialogs } : {}
						},
						stack: result.stack,
						logs: result.logs,
						durationMs: result.durationMs
					});
				}
				const { result: opResult, context } = result.result;
				const reported = jsxReportedFailure(opResult);
				if (reported) return errorResult("OPERATION_FAILED", `${op.name}: ${reported.error}${rollbackSentence(result.rollback)}`, {
					details: {
						operation: op.name,
						result: opResult,
						context,
						...result.rollback ? { rollback: result.rollback } : {}
					},
					logs: result.logs,
					durationMs: result.durationMs,
					...isBatchShaped(opResult) ? { hint: "Inspect details.result.results — each entry matches the input order and carries its own error." } : {}
				});
				return jsonResult({
					result: opResult,
					context,
					logs: result.logs,
					durationMs: result.durationMs,
					...result.rollback ? { rollback: result.rollback } : {}
				});
			}
		});
		NEW_FUNCTION_HEADER_LINES = 1;
	})))();
}

// tools/layer-info.js
var layerInfoTool;
function init_layer_info() {
	return (init_layer_info = __esmMin((() => {
		init_snippets();
		init_registry();
		init_define_tool();
		layerInfoTool = defineTool({
			name: "ae_layer_info",
			title: "Layer info",
			description: "Full layer info: transform, effects, masks, text, shape contents, keyframes (incl. interpolation names and bezier ease speed/influence). layerIndex accepts one index, an ARRAY of indices, or 'all' — auditing a whole comp is one call. detail:'summary' drops properties still at their default value (unkeyed, no expression) — start there for audits; the full tree is often 100KB+ per comp. Set includeProperties=false to skip the property tree walk entirely.",
			group: "inspect",
			blockedInReadOnly: false,
			effect: "read",
			inputShape: {
				compNameOrId: z.union([z.string(), z.number()]).describe("Composition name (exact match) or numeric item id."),
				layerIndex: z.union([
					z.number().int().positive(),
					z.array(z.number().int().positive()).min(1),
					z.literal("all")
				]).describe("1-based layer index — or an array of indices, or 'all' for every layer in the comp, returned together in one round trip."),
				includeProperties: z.boolean().optional().describe("Include the full property tree (Transform/Effects/Masks/Text). Default true."),
				detail: z.enum(["full", "summary"]).optional().describe("'summary' omits properties still at their default value (no keyframes, no expression, never touched) — typically 5-10x smaller. Group skeletons are kept, so effects/masks still show. Default 'full'.")
			},
			handler: async (args, transport) => {
				const multi = typeof args.layerIndex !== "number";
				const detailJsx = jsxVal(args.detail ?? "full");
				const code = multi ? `
        ${LAYER_FULL_FN}
        var _arg = ${jsxVal(args.compNameOrId)};
        var _incl = ${jsxVal(args.includeProperties !== false)};
        var _detail = ${detailJsx};
        var comp = AE.findCompByNameOrId(_arg);
        if (!comp) return { ok: false, found: false, error: "no comp matching " + String(_arg) };
        var _spec = ${jsxVal(args.layerIndex)};
        var _idxs = [];
        if (_spec === "all") {
            for (var _ai = 1; _ai <= comp.numLayers; _ai++) _idxs.push(_ai);
        } else {
            _idxs = _spec;
        }
        var _layers = [];
        var _misses = 0;
        for (var _li = 0; _li < _idxs.length; _li++) {
            var _idx = _idxs[_li];
            if (_idx < 1 || _idx > comp.numLayers) {
                _misses++;
                _layers.push({ ok: false, found: false, index: _idx, error: "layer index " + _idx + " out of range 1.." + comp.numLayers });
            } else {
                _layers.push(_layerFull(comp.layer(_idx), _incl, _detail));
            }
        }
        return { ok: _misses === 0, compName: comp.name, count: _layers.length, missing: _misses, layers: _layers };
    ` : `
        ${LAYER_FULL_FN}
        var _arg = ${jsxVal(args.compNameOrId)};
        var _idx = ${jsxVal(args.layerIndex)};
        var _incl = ${jsxVal(args.includeProperties !== false)};
        var _detail = ${detailJsx};
        var comp = AE.findCompByNameOrId(_arg);
        if (!comp) return { ok: false, found: false, error: "no comp matching " + String(_arg) };
        if (_idx < 1 || _idx > comp.numLayers) return { ok: false, found: false, error: "layer index " + _idx + " out of range 1.." + comp.numLayers };
        return _layerFull(comp.layer(_idx), _incl, _detail);
    `;
				const result = await transport.execute({
					code,
					label: "layer_info"
				});
				return toMcpResult(result);
			}
		});
	})))();
}

// tools/project-export.js
var projectExportTool;
function init_project_export() {
	return (init_project_export = __esmMin((() => {
		init_config();
		init_errors();
		init_define_tool();
		projectExportTool = defineTool({
			name: "ae_project_export_json",
			title: "Export project JSON",
			description: "Serialize the entire project to JSON (folders, comps, layers, keyframes, effects, shapes, markers, time remap, solids, file refs). Write to `outPath` or return inline.",
			group: "document",
			blockedInReadOnly: false,
			effect: "write",
			inputShape: {
				outPath: z.string().optional().describe("If set, write the exported JSON to this absolute path on disk. If omitted, the JSON is returned inline in the tool response (can get large)."),
				pretty: z.boolean().optional().describe("Pretty-print the JSON (2-space indent). Default: true when writing to disk, false otherwise.")
			},
			handler: async (args, transport) => {
				if (args.outPath) {
					const rejection = rejectedOutputPath(args.outPath);
					if (rejection !== null) return errorResult("IO", rejection, {
						details: { outPath: path$1.resolve(args.outPath) },
						hint: "Write the document somewhere outside the mailbox, or omit outPath to receive it inline."
					});
				}
				const result = await transport.execute({
					code: `
        var doc = AE.exportProject();
        return doc;
    `,
					label: "project_export_json",
					timeoutMs: 3e5
				});
				if (!result.ok) return toMcpResult(result);
				const doc = result.result;
				const pretty = args.pretty ?? !!args.outPath;
				const jsonText = JSON.stringify(doc, null, pretty ? 2 : 0);
				if (args.outPath) {
					const abs = path$1.resolve(args.outPath);
					try {
						await promises.mkdir(path$1.dirname(abs), { recursive: true });
						await promises.writeFile(abs, jsonText, "utf8");
					} catch (err) {
						return errorResult("IO", `exported the project but could not write ${abs}: ${err instanceof Error ? err.message : String(err)}`, {
							details: {
								outPath: abs,
								bytes: Buffer.byteLength(jsonText, "utf8")
							},
							hint: "Pick a writable absolute path, or omit outPath to receive the document inline."
						});
					}
					return jsonResult({
						writtenTo: abs.replace(/\\/g, "/"),
						bytes: Buffer.byteLength(jsonText, "utf8"),
						itemCount: doc && typeof doc === "object" && "items" in doc ? doc.items?.length ?? 0 : 0,
						durationMs: result.durationMs
					});
				}
				return {
					content: [{
						type: "text",
						text: jsonText
					}],
					structuredContent: {
						ok: true,
						doc,
						durationMs: result.durationMs
					},
					isError: false
				};
			}
		});
	})))();
}

// tools/project-import.js
function summarizePlan(doc) {
	const items = doc.items ?? [];
	let folders = 0, comps = 0, solids = 0, files = 0, layers = 0;
	for (const it of items) if (it.type === "FolderItem") folders++;
	else if (it.type === "CompItem") {
		comps++;
		if (Array.isArray(it.layers)) layers += it.layers.length;
	} else if (it.type === "FootageItem") {
		const sk = it.sourceKind;
		if (sk === "solid") solids++;
		else if (sk === "file") files++;
	}
	return {
		folders,
		comps,
		solids,
		files,
		layers
	};
}
var projectImportTool;
function init_project_import() {
	return (init_project_import = __esmMin((() => {
		init_errors();
		init_validate();
		init_define_tool();
		projectImportTool = defineTool({
			name: "ae_project_import_json",
			title: "Import project JSON",
			description: "Rebuild the project from JSON (produced by ae_project_export_json). Supports `clearFirst` (removes every existing project item before importing), `dryRun` (validate-only), `skipValidation`.",
			group: "document",
			blockedInReadOnly: true,
			effect: "destructive",
			inputShape: {
				inPath: z.string().optional().describe("Absolute path to a JSON document produced by ae_project_export_json. Mutually exclusive with `json`."),
				json: z.unknown().optional().describe("Inline JSON document (object, not string). Mutually exclusive with `inPath`."),
				clearFirst: z.boolean().optional().describe("Remove all existing items from the current project before importing. Default: false (appends)."),
				dryRun: z.boolean().optional().describe("If true, validate the document and return a plan without touching AE. Useful for debugging malformed exports."),
				skipValidation: z.boolean().optional().describe("Skip Node-side schema validation. Only use if you trust the input and want to hand broken data to AE for diagnosis.")
			},
			handler: async (args, transport) => {
				let doc;
				if (args.inPath) {
					const abs = path$1.resolve(args.inPath);
					try {
						doc = JSON.parse(await promises.readFile(abs, "utf8"));
					} catch (err) {
						return errorResult("IO", `cannot read project document at ${abs}: ${err instanceof Error ? err.message : String(err)}`, { details: { inPath: abs } });
					}
				} else if (args.json !== void 0) doc = args.json;
				else return errorResult("INVALID_ARGS", "must provide either `inPath` or `json`", { hint: "`inPath` takes an absolute path to a document produced by ae_project_export_json; `json` takes the document inline as an object." });
				let warnings = [];
				if (!args.skipValidation) {
					const v = validateAeProjectDoc(doc);
					if (!v.ok) return errorResult("VALIDATION", "document failed schema validation:\n" + v.issues.map((i) => `  ${i.path || "(root)"}: ${i.message}`).join("\n"), {
						details: {
							issues: v.issues,
							warnings: v.warnings
						},
						hint: "Run with dryRun: true to inspect the plan, or skipValidation: true to hand the document to AE as-is for diagnosis."
					});
					warnings = v.warnings;
				}
				if (args.dryRun) {
					const items = doc.items ?? [];
					return jsonResult({
						dryRun: true,
						valid: !args.skipValidation,
						itemCount: items.length,
						warnings,
						summary: summarizePlan(doc)
					});
				}
				const result = await transport.execute({
					code: `
        return AE.importProject(payload.doc, payload.opts);
    `,
					payload: {
						doc,
						opts: { clearFirst: !!args.clearFirst }
					},
					label: "project_import_json",
					timeoutMs: 6e5
				});
				return toMcpResult(result);
			}
		});
	})))();
}

// tools/project-info.js
function projectInfoCode(args) {
	const limit = Math.max(1, Math.min(1e3, Math.floor(args.limit ?? 100)));
	const offset = Math.max(0, Math.floor(args.offset ?? 0));
	return `
    var proj = app.project;
    var _limit = ${jsxVal(limit)};
    var _offset = ${jsxVal(offset)};
    var counts = {};
    var items = [];
    for (var i = 1; i <= proj.numItems; i++) {
        var it = proj.item(i);
        var tn = AE.itemTypeName(it);
        counts[tn] = (counts[tn] || 0) + 1;
        if (i > _offset && items.length < _limit) items.push(AE.serializeItemSummary(it));
    }
    var active = proj.activeItem;
    var shownTo = Math.min(proj.numItems, _offset + items.length);
    return {
        file: proj.file ? proj.file.fsName.replace(/\\\\/g, "/") : null,
        dirty: app.project.dirty,
        numItems: proj.numItems,
        counts: counts,
        bitsPerChannel: proj.bitsPerChannel,
        timeDisplayType: String(proj.timeDisplayType),
        activeItem: active ? { id: active.id, name: active.name, typeName: AE.itemTypeName(active) } : null,
        items: items,
        shown: { from: items.length ? _offset + 1 : 0, to: shownTo, of: proj.numItems },
        more: shownTo < proj.numItems ? "Items " + (shownTo + 1) + " to " + proj.numItems + " not listed: call again with offset " + shownTo + " (limit up to 1000), or use project.find_layers or comp info for what you need." : null
    };
`;
}
var PROJECT_INFO_DEFAULT_LIMIT, projectInfoTool;
function init_project_info() {
	return (init_project_info = __esmMin((() => {
		init_registry();
		init_define_tool();
		PROJECT_INFO_DEFAULT_LIMIT = 100;
		projectInfoTool = defineTool({
			name: "ae_project_info",
			title: "Project info",
			description: `Project-level info: file path, dirty flag, counts of items by type, active item, and the items with type/summary, ${100} at a time (offset and limit for the rest; \`more\` says what was left out). Start here.`,
			group: "inspect",
			blockedInReadOnly: false,
			effect: "read",
			inputShape: {
				limit: z.number().int().min(1).max(1e3).optional().describe(`Items to list (default ${100}; about 400 characters each).`),
				offset: z.number().int().min(0).optional().describe("Items to skip before listing (default 0).")
			},
			handler: async (args, transport) => {
				const result = await transport.execute({
					code: projectInfoCode(args),
					label: "project_info"
				});
				return toMcpResult(result);
			}
		});
	})))();
}

// tools/save-project.js
var saveProjectTool;
function init_save_project() {
	return (init_save_project = __esmMin((() => {
		init_registry();
		init_define_tool();
		saveProjectTool = defineTool({
			name: "ae_save_project",
			title: "Save project",
			description: "Save the project. Pass `path` for Save As.",
			group: "document",
			blockedInReadOnly: true,
			effect: "destructive",
			inputShape: { path: z.string().optional().describe("Optional absolute path to save the project to (Save As). If omitted, save to the existing path — errors if the project has never been saved.") },
			handler: async (args, transport) => {
				const code = `
        var _path = ${jsxVal(args.path ?? null)};
        if (_path) {
            // Save As into a folder that does not exist yet fails inside AE on a
            // temp file name; create the folder first, as the render ops do.
            var f = AE.ensureParentDir(_path);
            if (f.parent && !f.parent.exists) {
                return { ok: false, saved: false, error: "cannot create folder " + f.parent.fsName.replace(/\\\\/g, "/") + " for the project file" };
            }
            app.project.save(f);
            return { ok: true, saved: true, path: f.fsName.replace(/\\\\/g, "/") };
        }
        if (!app.project.file) {
            return { ok: false, saved: false, error: "project has no existing path; pass 'path' to save as" };
        }
        app.project.save();
        return { ok: true, saved: true, path: app.project.file.fsName.replace(/\\\\/g, "/") };
    `;
				const result = await transport.execute({
					code,
					label: "save_project"
				});
				return toMcpResult(result);
			}
		});
	})))();
}

// tools/version-info.js
var CODE, versionInfoTool;
function init_version_info() {
	return (init_version_info = __esmMin((() => {
		init_define_tool();
		CODE = `
    return {
        app: {
            version: app.version,
            buildName: AE.safeGet(function () { return app.buildName; }, null),
            buildNumber: AE.safeGet(function () { return app.buildNumber; }, null),
            language: AE.safeGet(function () { return String(app.isoLanguage); }, null),
            memoryInUse: AE.safeGet(function () { return app.memoryInUse; }, null),
            availableGPUs: AE.safeGet(function () { return app.availableGPUAccelTypes ? app.availableGPUAccelTypes.length : 0; }, null)
        },
        capabilities: {
            saveFrameToPng: AE.safeGet(function () {
                // A create/remove probe dirties even a previously clean project.
                // Inspect an existing comp only; null means there is no comp
                // from which to determine this capability safely.
                for (var i = 1; i <= app.project.numItems; i++) {
                    var item = app.project.item(i);
                    if (item instanceof CompItem) {
                        return typeof item.saveFrameToPng === "function";
                    }
                }
                return null;
            }, null),
            appEffects: AE.safeGet(function () { return !!(app.effects && app.effects.length); }, false),
            bridgeTalk: AE.safeGet(function () { return typeof BridgeTalk !== "undefined"; }, false),
            socket: AE.safeGet(function () { return typeof Socket !== "undefined"; }, false)
        },
        project: {
            numItems: app.project.numItems,
            file: app.project.file ? app.project.file.fsName.replace(/\\\\/g, "/") : null,
            dirty: app.project.dirty
        },
        // The resident agent (pull path), when this instance runs one. null
        // means the call arrived through the push path (AfterFX.exe -r).
        agent: AE.safeGet(function () {
            var a = $.global.AE_MCP_AGENT;
            if (!a) return null;
            return {
                id: a.state.id,
                idSource: a.state.idSource,
                agentVersion: a.state.agentVersion,
                ticks: a.state.ticks,
                served: a.state.served
            };
        }, null),
        server: {
            exportSchemaVersion: AE.EXPORT_SCHEMA_VERSION
        }
    };
`;
		versionInfoTool = defineTool({
			name: "ae_version_info",
			title: "Version info",
			description: "AE version, build, and read-only capabilities (saveFrameToPng, app.effects, Socket). saveFrameToPng is null when no existing comp can be inspected.",
			group: "inspect",
			blockedInReadOnly: false,
			effect: "read",
			inputShape: {},
			handler: async (_args, transport) => {
				const result = await transport.execute({
					code: CODE,
					label: "version_info"
				});
				return toMcpResult(result);
			}
		});
	})))();
}

// tools/index.js
function bindTransportToInstance(transport, instance) {
	return {
		execute: (req) => transport.execute({
			instance,
			...req
		}),
		describeTarget: () => resolveTarget(instance),
		...transport.close ? { close: () => transport.close() } : {}
	};
}
function withInstanceParam(tool) {
	if (INSTANCE_FREE_TOOLS.has(tool.name)) return tool;
	return {
		...tool,
		inputShape: {
			...tool.inputShape,
			instance: INSTANCE_PARAM
		},
		handler: async (args, transport) => {
			const { instance, ...rest } = args ?? {};
			const named = typeof instance === "string" ? instance.trim() : "";
			return tool.handler(rest, named ? bindTransportToInstance(transport, named) : transport);
		}
	};
}
var INSTANCE_PARAM, INSTANCE_FREE_TOOLS, ALL_TOOLS;
function init_tools() {
	return (init_tools = __esmMin((() => {
		init_instances();
		init_catalog();
		init_check_comp();
		init_comp_info();
		init_context();
		init_do();
		init_layer_info();
		init_project_export();
		init_project_import();
		init_project_info();
		init_render_frame();
		init_save_project();
		init_version_info();
		INSTANCE_PARAM = z.string().optional().describe("After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live.");
		INSTANCE_FREE_TOOLS = /* @__PURE__ */ new Set(["ae_catalog"]);
		ALL_TOOLS = [
			projectInfoTool,
			compInfoTool,
			layerInfoTool,
			renderFrameTool,
			checkCompTool,
			saveProjectTool,
			projectExportTool,
			projectImportTool,
			versionInfoTool,
			catalogTool,
			doTool,
			contextTool
		].map((tool) => withInstanceParam(tool));
	})))();
}

// tools/library-modules.js
function object(value) {
	return !!value && typeof value === "object" && !Array.isArray(value);
}
function fail(id, field, reason) {
	throw new Error(`Module ${id}: ${field}: ${reason}`);
}
function string(value, id, field) {
	if (typeof value !== "string" || !value.trim()) fail(id, field, "expected nonempty string");
}
function strings(value, id, field) {
	if (!Array.isArray(value)) fail(id, field, "expected string array");
	value.forEach((v) => string(v, id, field));
}
function isReportReference(value) {
	if (value.startsWith("https://")) try {
		const u = new URL(value);
		return !u.username && !u.password && u.hostname.includes(".") && !/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(u.hostname);
	} catch {
		return false;
	}
	return /^quality\/reports\/[a-zA-Z0-9._/-]+$/.test(value) && !value.split("/").some((p) => !p || p === "." || p === "..");
}
function validateCatalog(raw, refs) {
	if (!object(raw) || raw.schemaVersion !== 1) fail("<catalog>", "schemaVersion", "expected 1");
	if (!Array.isArray(raw.modules)) fail("<catalog>", "modules", "expected array");
	const ids = /* @__PURE__ */ new Set();
	for (const item of raw.modules) {
		if (!object(item)) fail("<unknown>", "module", "expected object");
		const id = typeof item.id === "string" ? item.id : "<unknown>";
		for (const field of [
			"id",
			"title",
			"summary",
			"entryDocument"
		]) string(item[field], id, field);
		if (!/^[a-z][a-z0-9-]*$/.test(id)) fail(id, "id", "expected lowercase hyphenated ID");
		if (ids.has(id)) fail(id, "id", "duplicate ID");
		ids.add(id);
		if (typeof item.kind !== "string" || ![
			"foundation",
			"capability",
			"style"
		].includes(String(item.kind))) fail(id, "kind", "unknown enum");
		for (const field of [
			"tags",
			"whenToUse",
			"whenNotToUse",
			"requires",
			"documents",
			"compatibleWith",
			"assetRequirements",
			"fontRequirements",
			"fallbacks",
			"examples",
			"reviewChecks",
			"provenanceRefs"
		]) strings(item[field], id, field);
		if (!Array.isArray(item.inputs)) fail(id, "inputs", "expected array");
		for (const input of item.inputs) {
			if (!object(input)) fail(id, "inputs", "expected object");
			string(input.name, id, "inputs.name");
			string(input.constraints, id, "inputs.constraints");
			if (typeof input.required !== "boolean") fail(id, "inputs.required", "expected boolean");
			if (input.default !== null && typeof input.default !== "string") fail(id, "inputs.default", "expected string or null");
		}
		const e = item.evidence;
		if (!object(e)) fail(id, "evidence", "expected object");
		if (typeof e.technical !== "string" || ![
			"not-tested",
			"passed",
			"failed"
		].includes(String(e.technical))) fail(id, "evidence.technical", "unknown enum");
		if (typeof e.visual !== "string" || ![
			"not-reviewed",
			"accepted",
			"revision-needed"
		].includes(String(e.visual))) fail(id, "evidence.visual", "unknown enum");
		strings(e.reports, id, "evidence.reports");
		if ((e.technical !== "not-tested" || e.visual !== "not-reviewed") && !e.reports.length) fail(id, "evidence.reports", "tested or reviewed status requires evidence");
		for (const report of e.reports) if (!isReportReference(report)) fail(id, "evidence.reports", "expected repository report path or public HTTPS URL");
	}
	const catalog = raw;
	for (const m of catalog.modules) {
		const check = (field, values, valid) => {
			for (const value of values) if (!valid.has(value)) fail(m.id, field, `missing reference ${value}`);
		};
		check("entryDocument", [m.entryDocument], refs.documentIds);
		check("documents", m.documents, refs.documentIds);
		check("examples", m.examples, refs.documentIds);
		check("requires", m.requires, ids);
		check("compatibleWith", m.compatibleWith, ids);
		check("provenanceRefs", m.provenanceRefs, refs.provenanceIds);
	}
	const byId = new Map(catalog.modules.map((m) => [m.id, m]));
	const visiting = /* @__PURE__ */ new Set(), visited = /* @__PURE__ */ new Set();
	function visit(id) {
		if (visiting.has(id)) fail(id, "requires", "dependency cycle");
		if (visited.has(id)) return;
		visiting.add(id);
		for (const dep of byId.get(id).requires) visit(dep);
		visiting.delete(id);
		visited.add(id);
	}
	for (const id of ids) visit(id);
	return catalog;
}
function findModules(catalog, query) {
	const q = query?.trim().toLowerCase();
	return catalog.modules.filter((m) => !q || [
		m.id,
		m.title,
		m.summary,
		...m.tags
	].some((v) => v.toLowerCase().includes(q)));
}
function init_library_modules() {
	return (init_library_modules = __esmMin((() => {})))();
}

// tools/library.js
function boundedFile(base, relative) {
	const candidate = path.resolve(base, relative);
	const inside = (file2) => {
		const rel = path.relative(base, file2);
		if (!rel || rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel)) throw new Error("Library path escapes bundle");
	};
	inside(candidate);
	const file = realpathSync(candidate);
	inside(file);
	return file;
}
function readLibrary(document, query, root = path.resolve(PACKAGE_ROOT, "../library")) {
	const base = realpathSync(root);
	const entries = JSON.parse(readFileSync(boundedFile(base, "manifest.json"), "utf8")).documents;
	const read = (entry2) => {
		const content = readFileSync(boundedFile(base, entry2.path), "utf8");
		if (createHash("sha256").update(content).digest("hex") !== entry2.sha256) throw new Error("Library hash mismatch: regenerate manifest after intentional edits");
		return content;
	};
	if (!document) {
		const needle = query?.trim().toLowerCase();
		const catalogEntry = entries.find((e) => e.id === "module-catalog");
		let catalog = {
			schemaVersion: 1,
			modules: []
		};
		if (catalogEntry) try {
			const raw = JSON.parse(read(catalogEntry));
			const sourceMap = JSON.parse(readFileSync(boundedFile(base, "source-map.json"), "utf8"));
			catalog = validateCatalog(raw, {
				documentIds: new Set(entries.map((e) => e.id)),
				provenanceIds: new Set((sourceMap.sources ?? []).map((s) => s.id).filter((id) => typeof id === "string"))
			});
		} catch (e) {
			throw new Error(`Module catalog: ${e instanceof Error ? e.message : String(e)}`);
		}
		const matches = findModules(catalog, query);
		const entryIds = new Set(matches.map((m) => m.entryDocument));
		const seen = /* @__PURE__ */ new Set();
		return {
			startHere: [
				"motion-language",
				"production-workflow",
				"brief-template"
			],
			documents: entries.filter((e) => {
				if (seen.has(e.id)) return false;
				if (!needle || `${e.id} ${e.title} ${e.kind}`.toLowerCase().includes(needle) || entryIds.has(e.id)) {
					seen.add(e.id);
					return true;
				}
				return false;
			}).map(({ id, title, kind }) => ({
				id,
				title,
				kind
			})),
			modules: matches.map(({ id, kind, title, summary, entryDocument, requires, tags, evidence }) => ({
				id,
				kind,
				title,
				summary,
				entryDocument,
				requires,
				tags,
				evidence
			}))
		};
	}
	const entry = entries.find((e) => e.id === document);
	if (!entry) throw new Error("Unknown library document. Call ae_library without arguments for valid IDs.");
	return {
		document: entry.id,
		title: entry.title,
		kind: entry.kind,
		content: read(entry)
	};
}
var libraryTool;
function init_library() {
	return (init_library = __esmMin((() => {
		init_config();
		init_define_tool();
		init_errors();
		/* @__PURE__ */ init_library_modules();
		libraryTool = defineTool({
			name: "ae_library",
			title: "Motion design library",
			group: "document",
			effect: "read",
			blockedInReadOnly: false,
			description: "Read the bundled production-derived motion language, detailed choreography/camera/material modules, worked scenes and native JSX. Begin every After Effects motion task with motion-language, production-workflow and brief-template. Craft applies to all styles; JoeB appearance is optional. Offline; no AE, original repo or account required. Omit document to list IDs and startHere; query filters the index. Pass an ID to read complete contents.",
			inputShape: {
				document: z.string().optional(),
				query: z.string().optional()
			},
			handler: async ({ document, query }) => {
				try {
					return jsonResult(readLibrary(document, query));
				} catch (e) {
					return errorResult("IO", e instanceof Error ? e.message : String(e));
				}
			}
		});
	})))();
}

export { ALL_TOOLS, iccManagedReason, init_capture_shared, init_library, init_render_frame, init_tools, libraryTool, renderFrameTool };
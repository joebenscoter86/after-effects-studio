import { __esmMin } from "./rolldown-runtime.js";
import { HEARTBEAT_STALE_MS, RUNTIME_DIR, RUNTIME_ROOT, agentInstallStatus, denyAppConfig, denyOperation, denyUnregisteredOperation, evalRunEnabled, getOp, init_agent_install, init_config, init_opschema, init_policy, init_registry, instanceDirFor, jsxCompLayerPreamble, jsxCompPreamble, jsxFail, jsxPropertyLookup, jsxVal, prepareOp, registerOp, rejectedOutputPath, resolveAfterFxPath, sanitizeInstanceId, summarizeParams, validateOpArgs, wantsUndoGroup } from "./core-1.js";
import { ACCESSIBILITY_HINT, SCRIPT_RUNNING_HINT, buildInstanceLaunchPlan, describeInstance, dialogBlockMessage, dialogHint, dialogScanSupported, dismissAeDialog, init_dialogs, init_instances, init_launcher, instanceLabel, listInstances, readInstance, scanAeDialogs, scanAeWindows, scriptRunningMessage, splitScriptProgress } from "./transport-1.js";
import { init_keying, init_layer, init_layer_advanced, init_layout } from "./operations-2.js";
import { COMP_INFO_FN, LAYER_FULL_FN, LIST_MISSING_FONTS_FN, LIST_MISSING_FOOTAGE_FN, RENDER_FRAME_FN, init_shape, init_snippets, init_text, init_timeline, init_transform, init_video, init_viewer } from "./operations-4.js";
import { init_look_sheet, init_marker, init_mask, init_pref, init_project, init_property, init_render, init_sample, init_shape_contents } from "./operations-3.js";
import { EDGE_DEFAULTS, compareReferences, compareWithSheet, composeContactSheet, cutoutRegions, decodePng, encodePngSrgb8, flattenOver, init_look, init_matte, init_png16, init_sheet, isPiece, isSheet, referenceReader, resample } from "./color-1.js";
import { iccManagedReason, init_capture_shared, init_render_frame, renderFrameTool } from "./tools-1.js";
import { init_decode, init_movie_rgb, init_rhythm, measureRhythm, movieColour, movieFrames, probeVideo } from "./video-1.js";
import { execFile, spawn } from "node:child_process";
import { promises, readFileSync, realpathSync, statSync } from "node:fs";
import * as path$1 from "node:path";

// operations/keyframe.js
function init_keyframe() {
	return (init_keyframe = __esmMin((() => {
		init_registry();
		registerOp({
			name: "keyframe.add",
			category: "keyframe",
			description: "Add a keyframe at a specific time with a value.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path, e.g. [\"Transform\",\"Position\"]",
					required: true
				},
				{
					name: "time",
					type: "number",
					description: "Time in seconds",
					required: true
				},
				{
					name: "value",
					type: "any",
					description: "Value at this keyframe",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            // Separated dimensions (and __kind-tagged values) are routed by
            // AE.writeValue \u2014 setValueAtTime on a separated leader throws an
            // error AE never shows.
            var _wr = AE.writeValue(_node, ${jsxVal(args.value)}, ${jsxVal(args.time)});
            return { ok: true, numKeys: _wr.separated ? AE.separationFollowers(_node)[0].numKeys : _node.numKeys, name: _node.name, separated: _wr.separated };
        `;
			}
		});
		registerOp({
			name: "keyframe.apply",
			category: "keyframe",
			description: "Write a whole keyframe list to a property in ONE call, easing included: keys = [{ time, value, interp?, inType?, outType?, inInfluence?, outInfluence?, inSpeed?, outSpeed? }]. interp: linear | ease (both sides bezier) | easeIn (in bezier, out linear) | easeOut | hold (OUT side only — the incoming segment keeps evaluating, unlike keyframe.set_easing's symmetric 'hold') | keep. Handles separated dimensions (X/Y Position followers) and __kind values (Shape, TextDocument). replace=true clears existing keys first. Applies the same list to every matched layer.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "Layer index, name, { id }, 'selected', 'all', or an array of those",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path, e.g. [\"Transform\",\"Position\"]",
					required: true
				},
				{
					name: "keys",
					type: "array",
					description: "[{ time, value, interp?, inType?, outType?, inInfluence?, outInfluence?, inSpeed?, outSpeed? }, …]",
					required: true
				},
				{
					name: "interp",
					type: "string",
					description: "Default interp for keys that do not set their own (default: AE's default, i.e. keep)",
					required: false
				},
				{
					name: "replace",
					type: "boolean",
					description: "Remove the property's existing keys first (default false)",
					required: false,
					default: false
				},
				{
					name: "spatialTangents",
					type: "string",
					description: "auto | linear — 'linear' zeroes the spatial tangents on Position/Anchor keys so the motion path is straight between keys (default auto = AE's auto-bezier)",
					required: false,
					default: "auto"
				}
			],
			toJsx(args) {
				const keys = Array.isArray(args.keys) ? args.keys : [];
				if (keys.length === 0) return jsxFail("keys must be a non-empty array");
				for (const [i, k] of keys.entries()) {
					const key = k;
					if (!key || typeof key !== "object" || typeof key.time !== "number" || key.value === void 0) return jsxFail(`keys[${i}] must be { time: number, value, \u2026 }`);
				}
				const spatial = args.spatialTangents ?? "auto";
				if (spatial !== "auto" && spatial !== "linear") return jsxFail("spatialTangents must be auto|linear");
				return `
            ${jsxCompPreamble(args)}
            var _layers = AE.resolveLayers(_comp, ${jsxVal(args.layer)});
            if (_layers.length === 0) return { ok: false, error: "no layers matched" };
            var _propPath = ${jsxVal(args.property)};
            var _specs = ${jsxVal(keys)};
            var _opts = { replace: ${jsxVal(args.replace === true)}, interp: ${jsxVal(args.interp ?? null)}, spatialTangents: ${jsxVal(spatial)} };
            var _out = [];
            var _failed = 0;
            for (var _li = 0; _li < _layers.length; _li++) {
                var _l = _layers[_li];
                var _node = AE.propertyAtPath(_l, _propPath);
                if (!_node || _node.propertyType !== PropertyType.PROPERTY) { _failed++; _out.push({ index: _l.index, name: _l.name, ok: false, error: "property path not found on this layer" }); continue; }
                try {
                    var _r = AE.applyKeySpecs(_node, _specs, _opts);
                    _out.push({ index: _l.index, name: _l.name, ok: true, numKeys: _r.numKeys, separated: _r.separated, warnings: _r.warnings });
                } catch (eK) {
                    _failed++;
                    _out.push({ index: _l.index, name: _l.name, ok: false, error: AE.errText(eK) });
                }
            }
            return { ok: _failed === 0, error: _failed === 0 ? null : (_failed + " of " + _out.length + " layers failed"), count: _out.length, layers: _out };
        `;
			}
		});
		registerOp({
			name: "keyframe.remove",
			category: "keyframe",
			description: "Remove a keyframe by its 1-based index.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path",
					required: true
				},
				{
					name: "keyIndex",
					type: "number",
					description: "1-based keyframe index to remove",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            if (${jsxVal(args.keyIndex)} < 1 || ${jsxVal(args.keyIndex)} > _node.numKeys) return { ok: false, error: "key index out of range" };
            _node.removeKey(${jsxVal(args.keyIndex)});
            return { ok: true, numKeys: _node.numKeys };
        `;
			}
		});
		registerOp({
			name: "keyframe.set_easing",
			category: "keyframe",
			description: "Apply easing to a keyframe. Preset: 'linear', 'ease', 'easeIn', 'easeOut', 'hold'. Or custom bezier with inSpeed/outSpeed/inInfluence/outInfluence. NOTE: 'hold' here sets BOTH sides to HOLD, which also freezes the segment BEFORE the key (a fade ending in such a key never fades). For the timeline's Toggle-Hold behaviour (out side only) use keyframe.set_interpolation outType:'hold' or keyframe.apply interp:'hold'.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path",
					required: true
				},
				{
					name: "keyIndex",
					type: "number",
					description: "1-based keyframe index",
					required: true
				},
				{
					name: "preset",
					type: "string",
					description: "linear|ease|easeIn|easeOut|hold (overrides custom params)",
					required: false
				},
				{
					name: "inSpeed",
					type: "number",
					description: "Custom in speed",
					required: false
				},
				{
					name: "outSpeed",
					type: "number",
					description: "Custom out speed",
					required: false
				},
				{
					name: "inInfluence",
					type: "number",
					description: "Custom in influence (0-100)",
					required: false,
					default: 33
				},
				{
					name: "outInfluence",
					type: "number",
					description: "Custom out influence (0-100)",
					required: false,
					default: 33
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            var _ki = ${jsxVal(args.keyIndex)};
            if (_ki < 1 || _ki > _node.numKeys) return { ok: false, error: "key index out of range" };
            var _preset = ${jsxVal(args.preset ?? null)};
            if (_preset === "linear") {
                _node.setInterpolationTypeAtKey(_ki, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
            } else if (_preset === "hold") {
                _node.setInterpolationTypeAtKey(_ki, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
            } else if (_preset === "ease") {
                AE.setEase(_node, _ki, 33, 33);
                _node.setInterpolationTypeAtKey(_ki, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
            } else if (_preset === "easeIn") {
                AE.setEase(_node, _ki, 75, 33);
                _node.setInterpolationTypeAtKey(_ki, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
            } else if (_preset === "easeOut") {
                AE.setEase(_node, _ki, 33, 75);
                _node.setInterpolationTypeAtKey(_ki, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
            } else {
                var _inS = ${jsxVal(args.inSpeed ?? 0)};
                var _outS = ${jsxVal(args.outSpeed ?? 0)};
                var _inI = ${jsxVal(args.inInfluence ?? 33)};
                var _outI = ${jsxVal(args.outInfluence ?? 33)};
                AE.setEase(_node, _ki, _inI, _outI, _inS, _outS);
                _node.setInterpolationTypeAtKey(_ki, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
            }
            return { ok: true, keyIndex: _ki, interpolation: "applied" };
        `;
			}
		});
		registerOp({
			name: "keyframe.set_batch",
			category: "keyframe",
			description: "Set many keyframes on one property in a single call (Property.setValuesAtTimes). times and values must have the same length.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path",
					required: true
				},
				{
					name: "times",
					type: "array",
					description: "Times in seconds",
					required: true
				},
				{
					name: "values",
					type: "array",
					description: "Values, one per time (same order)",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            var _times = ${jsxVal(args.times)};
            var _values = ${jsxVal(args.values)};
            if (_times.length === 0) return { ok: false, error: "times is empty" };
            if (_times.length !== _values.length) return { ok: false, error: "times (" + _times.length + ") and values (" + _values.length + ") must have the same length" };
            // A separated leader rejects setValuesAtTimes; feed each follower
            // its own component instead (same routing as AE.writeValue).
            var _followers = AE.separationFollowers(_node);
            if (_followers) {
                for (var _fi = 0; _fi < _followers.length; _fi++) {
                    var _comp2 = [];
                    for (var _vi = 0; _vi < _values.length; _vi++) _comp2.push(AE._componentFor(_values[_vi], _fi, _followers.length));
                    _followers[_fi].setValuesAtTimes(_times, _comp2);
                }
                return { ok: true, added: _times.length, numKeys: _followers[0].numKeys, separated: true };
            }
            var _native = [];
            for (var _ni = 0; _ni < _values.length; _ni++) _native.push(AE.nativeValue(_node, _values[_ni]));
            _node.setValuesAtTimes(_times, _native);
            return { ok: true, added: _times.length, numKeys: _node.numKeys, separated: false };
        `;
			}
		});
		registerOp({
			name: "keyframe.shift",
			category: "keyframe",
			description: "Retime all keyframes on a property: newTime = (time - pivot) * scale + pivot + offset. Preserves interpolation, ease, and spatial tangents best-effort.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path",
					required: true
				},
				{
					name: "offset",
					type: "number",
					description: "Seconds to shift by (default 0)",
					required: false,
					default: 0
				},
				{
					name: "scale",
					type: "number",
					description: "Time scale factor around pivot (default 1)",
					required: false,
					default: 1
				},
				{
					name: "pivot",
					type: "number",
					description: "Pivot time in seconds for scaling (default 0)",
					required: false,
					default: 0
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            if (!_node.numKeys || _node.numKeys === 0) return { ok: false, error: "property has no keyframes" };
            var _offset = ${jsxVal(args.offset ?? 0)};
            var _scale = ${jsxVal(args.scale ?? 1)};
            var _pivot = ${jsxVal(args.pivot ?? 0)};
            if (_scale === 0) return { ok: false, error: "scale must be non-zero" };
            var _keys = AE.snapshotKeys(_node);
            for (var _i = 0; _i < _keys.length; _i++) {
                _keys[_i].time = (_keys[_i].time - _pivot) * _scale + _pivot + _offset;
            }
            // Validate the whole target layout BEFORE removeAllKeys destroys
            // the current one. addKey inside applyKeys can throw (negative
            // time, collapsed times), and a throw after the removal leaves the
            // property stripped and half-rebuilt \u2014 an error result handed back
            // on top of a damaged project, which the dispatcher does not roll
            // back.
            var _times = [];
            for (var _v = 0; _v < _keys.length; _v++) {
                var _tv = _keys[_v].time;
                if (!isFinite(_tv)) return { ok: false, error: "shift produces a non-finite key time \u2014 check offset/scale/pivot" };
                if (_tv < 0) return { ok: false, error: "shift moves a key to " + _tv + "s; key times cannot be negative" };
                _times.push(_tv);
            }
            _times.sort(function (a, b) { return a - b; });
            for (var _d = 1; _d < _times.length; _d++) {
                if (_times[_d] - _times[_d - 1] < 1e-6) return { ok: false, error: "shift collapses two keys onto " + _times[_d] + "s; use a larger scale, or keyframe.set_batch to author the result directly" };
            }
            AE.removeAllKeys(_node);
            AE.applyKeys(_node, _keys);
            return { ok: true, numKeys: _node.numKeys, firstKeyTime: _node.keyTime(1), lastKeyTime: _node.keyTime(_node.numKeys) };
        `;
			}
		});
		registerOp({
			name: "keyframe.copy",
			category: "keyframe",
			description: "Copy all keyframes from one property to another (same or different layer/comp). Value types must be compatible. Existing target keys are kept.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Source comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "Source layer (1-based index or name)",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Source property path",
					required: true
				},
				{
					name: "targetComp",
					type: "any",
					description: "Target comp (default: same as source)",
					required: false
				},
				{
					name: "targetLayer",
					type: "any",
					description: "Target layer (1-based index or name)",
					required: true
				},
				{
					name: "targetProperty",
					type: "array",
					description: "Target property path (default: same as source)",
					required: false
				},
				{
					name: "timeOffset",
					type: "number",
					description: "Seconds to add to every copied key time (default 0)",
					required: false,
					default: 0
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            if (!_node.numKeys || _node.numKeys === 0) return { ok: false, error: "source property has no keyframes" };
            var _keys = AE.snapshotKeys(_node);
            var _tcArg = ${jsxVal(args.targetComp ?? null)};
            var _tComp = (_tcArg === null) ? _comp : AE.findCompByNameOrId(_tcArg);
            if (!_tComp) return { ok: false, error: "no target comp matching " + _tcArg };
            var _tLayer = AE.findLayerInComp(_tComp, ${jsxVal(args.targetLayer)});
            if (!_tLayer) return { ok: false, error: "no target layer matching " + ${jsxVal(String(args.targetLayer))} };
            var _tPath = ${jsxVal(args.targetProperty ?? null)} || _propPath;
            var _tNode = _tLayer;
            for (var _ti = 0; _ti < _tPath.length; _ti++) {
                var _tNext = null;
                try { _tNext = _tNode.property(_tPath[_ti]); } catch (eTp) {}
                if (!_tNext) return { ok: false, error: "target property segment '" + _tPath[_ti] + "' not found at depth " + _ti };
                _tNode = _tNext;
            }
            var _off = ${jsxVal(args.timeOffset ?? 0)};
            for (var _i = 0; _i < _keys.length; _i++) _keys[_i].time += _off;
            for (var _n = 0; _n < _keys.length; _n++) {
                if (!isFinite(_keys[_n].time) || _keys[_n].time < 0) return { ok: false, error: "timeOffset moves a key to " + _keys[_n].time + "s; key times cannot be negative" };
            }
            // A copied time landing on a key the target already has replaces it
            // rather than adding one, so report what was actually created.
            var _added = AE.applyKeys(_tNode, _keys);
            return { ok: true, copied: _added, sourceKeys: _keys.length, targetNumKeys: _tNode.numKeys };
        `;
			}
		});
		registerOp({
			name: "keyframe.set_spatial",
			category: "keyframe",
			description: "Set spatial tangents / continuity on a keyframe of a spatial property (Position, Anchor Point). Tangents are [x,y] or [x,y,z] offsets.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path",
					required: true
				},
				{
					name: "keyIndex",
					type: "number",
					description: "1-based keyframe index",
					required: true
				},
				{
					name: "inTangent",
					type: "array",
					description: "Incoming spatial tangent (default: keep current)",
					required: false
				},
				{
					name: "outTangent",
					type: "array",
					description: "Outgoing spatial tangent (default: keep current)",
					required: false
				},
				{
					name: "continuous",
					type: "boolean",
					description: "Spatial continuity flag",
					required: false
				},
				{
					name: "autoBezier",
					type: "boolean",
					description: "Spatial auto-bezier flag",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            if (!_node.isSpatial) return { ok: false, error: "property is not spatial" };
            var _ki = ${jsxVal(args.keyIndex)};
            if (_ki < 1 || _ki > _node.numKeys) return { ok: false, error: "key index out of range" };
            var _inT = ${jsxVal(args.inTangent ?? null)};
            var _outT = ${jsxVal(args.outTangent ?? null)};
            if (_inT !== null || _outT !== null) {
                if (_inT === null) _inT = _node.keyInSpatialTangent(_ki);
                if (_outT === null) _outT = _node.keyOutSpatialTangent(_ki);
                // Position is a three-component property even on a 2D layer:
                // AE rejects [x, y] there ("Value array does not have 3 elements").
                var _dims = _node.keyValue(_ki).length;
                _inT = AE.fitSpatialTangent(_inT, _dims);
                _outT = AE.fitSpatialTangent(_outT, _dims);
                _node.setSpatialTangentsAtKey(_ki, _inT, _outT);
            }
            var _cont = ${jsxVal(args.continuous ?? null)};
            if (_cont !== null) _node.setSpatialContinuousAtKey(_ki, _cont);
            var _autoB = ${jsxVal(args.autoBezier ?? null)};
            if (_autoB !== null) _node.setSpatialAutoBezierAtKey(_ki, _autoB);
            return { ok: true, keyIndex: _ki };
        `;
			}
		});
		registerOp({
			name: "keyframe.set_roving",
			category: "keyframe",
			description: "Set a keyframe to rove across time (smooth speed on a spatial path). First and last keyframes cannot rove.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path",
					required: true
				},
				{
					name: "keyIndex",
					type: "number",
					description: "1-based keyframe index",
					required: true
				},
				{
					name: "roving",
					type: "boolean",
					description: "true=roving, false=fixed",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            var _ki = ${jsxVal(args.keyIndex)};
            if (_ki < 1 || _ki > _node.numKeys) return { ok: false, error: "key index out of range" };
            if (_ki === 1 || _ki === _node.numKeys) return { ok: false, error: "first and last keyframes cannot rove" };
            _node.setRovingAtKey(_ki, ${jsxVal(!!args.roving)});
            return { ok: true, keyIndex: _ki, roving: _node.keyRoving(_ki) };
        `;
			}
		});
		registerOp({
			name: "keyframe.set_value",
			category: "keyframe",
			description: "Change the value of an existing keyframe without changing its time.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path",
					required: true
				},
				{
					name: "keyIndex",
					type: "number",
					description: "1-based keyframe index",
					required: true
				},
				{
					name: "value",
					type: "any",
					description: "New value",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            _node.setValueAtKey(${jsxVal(args.keyIndex)}, ${jsxVal(args.value)});
            return { ok: true, keyIndex: ${jsxVal(args.keyIndex)} };
        `;
			}
		});
		registerOp({
			name: "keyframe.set_interpolation",
			category: "keyframe",
			description: "Set a keyframe's in/out interpolation types directly (linear|bezier|hold — asymmetric combinations allowed, e.g. bezier in / hold out), and the temporal continuous / auto-bezier flags. For speed/influence curves use keyframe.set_easing.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path",
					required: true
				},
				{
					name: "keyIndex",
					type: "number",
					description: "1-based keyframe index",
					required: true
				},
				{
					name: "inType",
					type: "string",
					description: "linear|bezier|hold (default: keep current)",
					required: false
				},
				{
					name: "outType",
					type: "string",
					description: "linear|bezier|hold (default: keep current)",
					required: false
				},
				{
					name: "temporalContinuous",
					type: "boolean",
					description: "Temporal continuity flag",
					required: false
				},
				{
					name: "temporalAutoBezier",
					type: "boolean",
					description: "Temporal auto-bezier flag (true also enables continuity)",
					required: false
				}
			],
			toJsx(args) {
				const flagSets = [];
				if (args.temporalContinuous !== void 0) flagSets.push(`try { _node.setTemporalContinuousAtKey(_ki, ${jsxVal(args.temporalContinuous)}); } catch (eTc) { _w.push("temporalContinuous: " + AE.errText(eTc)); }`);
				if (args.temporalAutoBezier !== void 0) flagSets.push(`try { _node.setTemporalAutoBezierAtKey(_ki, ${jsxVal(args.temporalAutoBezier)}); } catch (eTb) { _w.push("temporalAutoBezier: " + AE.errText(eTb)); }`);
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            if (_node.propertyType !== PropertyType.PROPERTY) return { ok: false, error: "property path must resolve to a Property" };
            var _ki = ${jsxVal(args.keyIndex)};
            if (_ki < 1 || _ki > _node.numKeys) return { ok: false, error: "key index out of range" };
            var _w = [];
            var _itMap = { "linear": KeyframeInterpolationType.LINEAR, "bezier": KeyframeInterpolationType.BEZIER, "hold": KeyframeInterpolationType.HOLD };
            var _inArg = ${jsxVal(args.inType ?? null)};
            var _outArg = ${jsxVal(args.outType ?? null)};
            if (_inArg !== null || _outArg !== null) {
                if (_inArg !== null && !_itMap.hasOwnProperty(_inArg)) return { ok: false, error: "inType must be linear|bezier|hold" };
                if (_outArg !== null && !_itMap.hasOwnProperty(_outArg)) return { ok: false, error: "outType must be linear|bezier|hold" };
                var _in = _inArg !== null ? _itMap[_inArg] : _node.keyInInterpolationType(_ki);
                var _out = _outArg !== null ? _itMap[_outArg] : _node.keyOutInterpolationType(_ki);
                if (!_node.isInterpolationTypeValid(_in) || !_node.isInterpolationTypeValid(_out)) {
                    return { ok: false, error: "interpolation type not valid for this property" };
                }
                try { _node.setInterpolationTypeAtKey(_ki, _in, _out); } catch (eIt) { return { ok: false, error: "setInterpolationTypeAtKey failed: " + AE.errText(eIt) }; }
            }
            ${flagSets.join("\n")}
            function _itName(v) {
                if (v === KeyframeInterpolationType.LINEAR) return "linear";
                if (v === KeyframeInterpolationType.BEZIER) return "bezier";
                if (v === KeyframeInterpolationType.HOLD) return "hold";
                return null;
            }
            return {
                ok: true,
                keyIndex: _ki,
                inType: _itName(_node.keyInInterpolationType(_ki)),
                outType: _itName(_node.keyOutInterpolationType(_ki)),
                temporalContinuous: AE.safeGet(function () { return _node.keyTemporalContinuous(_ki); }, null),
                temporalAutoBezier: AE.safeGet(function () { return _node.keyTemporalAutoBezier(_ki); }, null),
                warnings: _w
            };
        `;
			}
		});
		registerOp({
			name: "keyframe.set_label",
			category: "keyframe",
			description: "Set a keyframe's label color (Property.setLabelAtKey, AE 22.6+).",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path",
					required: true
				},
				{
					name: "keyIndex",
					type: "number",
					description: "1-based keyframe index",
					required: true
				},
				{
					name: "label",
					type: "number",
					description: "Label color index 0-16 (0 = none)",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            if (_node.propertyType !== PropertyType.PROPERTY) return { ok: false, error: "property path must resolve to a Property" };
            var _ki = ${jsxVal(args.keyIndex)};
            if (_ki < 1 || _ki > _node.numKeys) return { ok: false, error: "key index out of range" };
            if (typeof _node.setLabelAtKey !== "function") return { ok: false, error: "setLabelAtKey needs AE 22.6+" };
            try { _node.setLabelAtKey(_ki, ${jsxVal(args.label)}); } catch (eLb) { return { ok: false, error: "setLabelAtKey failed: " + AE.errText(eLb) }; }
            return { ok: true, keyIndex: _ki, label: _node.keyLabel(_ki) };
        `;
			}
		});
		registerOp({
			name: "keyframe.set_selected",
			category: "keyframe",
			description: "Select or deselect keyframes on a property (Property.setSelectedAtKey) - e.g. to stage keys for a user-facing copy/paste in the UI.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path",
					required: true
				},
				{
					name: "keyIndex",
					type: "any",
					description: "1-based keyframe index, or 'all'",
					required: true
				},
				{
					name: "selected",
					type: "boolean",
					description: "true=select, false=deselect",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            if (_node.propertyType !== PropertyType.PROPERTY) return { ok: false, error: "property path must resolve to a Property" };
            var _kiArg = ${jsxVal(args.keyIndex)};
            var _sel = ${jsxVal(args.selected)};
            var _touched = 0;
            if (_kiArg === "all") {
                for (var _ki2 = 1; _ki2 <= _node.numKeys; _ki2++) {
                    try { _node.setSelectedAtKey(_ki2, _sel); _touched++; } catch (eK) {}
                }
            } else {
                if (_kiArg < 1 || _kiArg > _node.numKeys) return { ok: false, error: "key index out of range" };
                try { _node.setSelectedAtKey(_kiArg, _sel); _touched = 1; } catch (eK2) { return { ok: false, error: "setSelectedAtKey failed: " + AE.errText(eK2) }; }
            }
            return { ok: true, touched: _touched, selectedKeys: AE.valueToJson(_node.selectedKeys) };
        `;
			}
		});
	})))();
}

// operations/expression.js
function init_expression() {
	return (init_expression = __esmMin((() => {
		init_registry();
		registerOp({
			name: "expression.set",
			category: "expression",
			description: "Apply an expression to a property.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path",
					required: true
				},
				{
					name: "expression",
					type: "string",
					description: "Expression code string",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            if (!_node.canSetExpression) return { ok: false, error: "property does not support expressions" };
            _node.expression = ${jsxVal(args.expression)};
            _node.expressionEnabled = true;
            return { ok: true, name: _node.name, expressionEnabled: true };
        `;
			}
		});
		registerOp({
			name: "expression.disable_all",
			category: "expression",
			description: "Disable all expressions in a comp (all layers, all properties). Returns a manifest that can be used to re-enable them later via expression.restore_all. Manifest paths use numeric property indices; manifests produced by older versions of this operation (matchName-based paths) are not compatible.",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _manifest = [];
            function _walk(group, path, li) {
                for (var i = 1; i <= group.numProperties; i++) {
                    var p = group.property(i);
                    if (!p) continue;
                    try {
                        if (p.propertyType === PropertyType.PROPERTY && p.expressionEnabled) {
                            _manifest.push({ layer: li, path: path + "/" + p.propertyIndex, expr: p.expression });
                            p.expressionEnabled = false;
                        }
                    } catch(e) {}
                    if (p.numProperties > 0) _walk(p, path + "/" + p.propertyIndex, li);
                }
            }
            for (var li = 1; li <= _comp.numLayers; li++) {
                _walk(_comp.layer(li), "", li);
            }
            return { ok: true, disabled: _manifest.length, manifest: _manifest };
        `;
			}
		});
		registerOp({
			name: "expression.restore_all",
			category: "expression",
			description: "Re-enable expressions from a manifest produced by expression.disable_all. Optionally transform the expressions before restoring (e.g. replace content variable). Only manifests in the current format (numeric property-index paths) are supported; manifests from older versions are not compatible.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "manifest",
					type: "array",
					description: "Manifest array from expression.disable_all",
					required: true
				},
				{
					name: "replacements",
					type: "object",
					description: "Optional string replacements to apply to each expression before restoring, e.g. { \"old\": \"new\" }",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _manifest = ${jsxVal(args.manifest)};
            var _replacements = ${jsxVal(args.replacements ?? null)};
            var _restored = 0;
            var _errors = [];
            for (var i = 0; i < _manifest.length; i++) {
                var entry = _manifest[i];
                try {
                    var _layer = _comp.layer(entry.layer);
                    var parts = entry.path.split("/");
                    var node = _layer;
                    for (var j = 1; j < parts.length; j++) {
                        node = node.property(parseInt(parts[j], 10));
                    }
                    var expr = entry.expr;
                    if (_replacements) {
                        for (var key in _replacements) {
                            if (_replacements.hasOwnProperty(key)) {
                                expr = expr.split(key).join(_replacements[key]);
                            }
                        }
                    }
                    node.expression = expr;
                    node.expressionEnabled = true;
                    _restored++;
                } catch(e) {
                    _errors.push("layer " + entry.layer + " " + entry.path + ": " + AE.errText(e));
                }
            }
            return { ok: true, restored: _restored, errors: _errors };
        `;
			}
		});
		registerOp({
			name: "expression.remove",
			category: "expression",
			description: "Remove (disable) the expression on a property.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            _node.expression = "";
            _node.expressionEnabled = false;
            return { ok: true, name: _node.name, expressionEnabled: false };
        `;
			}
		});
	})))();
}

// operations/effect.js
var DROPDOWN_MENU_LOOKUP_JSX;
function init_effect() {
	return (init_effect = __esmMin((() => {
		init_registry();
		registerOp({
			name: "effect.add",
			category: "effect",
			description: "Add an effect to a layer by matchName. Use ae_do project.list_effects (or effect.list_on_layer on a reference layer) to find matchNames.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "matchName",
					type: "string",
					description: "Effect matchName (e.g. 'ADBE Gaussian Blur 2')",
					required: true
				},
				{
					name: "name",
					type: "string",
					description: "Custom display name for the effect",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _fx = _layer.property("Effects").addProperty(${jsxVal(args.matchName)});
            ${args.name ? `_fx.name = ${jsxVal(args.name)};` : ""}
            return { ok: true, effectIndex: _fx.propertyIndex, name: _fx.name, matchName: _fx.matchName };
        `;
			}
		});
		registerOp({
			name: "effect.remove",
			category: "effect",
			description: "Remove an effect by its 1-based index within the layer's Effects group.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "effectIndex",
					type: "number",
					description: "1-based effect index",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _fxRoot = _layer.property("Effects");
            if (${jsxVal(args.effectIndex)} < 1 || ${jsxVal(args.effectIndex)} > _fxRoot.numProperties) return { ok: false, error: "effect index out of range" };
            var _name = _fxRoot.property(${jsxVal(args.effectIndex)}).name;
            _fxRoot.property(${jsxVal(args.effectIndex)}).remove();
            return { ok: true, removed: _name };
        `;
			}
		});
		registerOp({
			name: "effect.list_on_layer",
			category: "effect",
			readOnly: true,
			description: "List the effects on a layer: index, name, matchName, enabled, and each top-level property's index, name and matchName. A short index on purpose; use effect.describe for one effect's values, value types, ranges and menu items before writing with effect.set_property.",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}, {
				name: "layer",
				type: "any",
				description: "1-based layer index, or the layer name",
				required: true
			}],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _fx = _layer.property("Effects");
            var _list = [];
            for (var i = 1; i <= _fx.numProperties; i++) {
                var _e = _fx.property(i);
                var _props = [];
                for (var j = 1; j <= _e.numProperties; j++) {
                    var _p = _e.property(j);
                    _props.push({ index: j, name: _p.name, matchName: _p.matchName });
                }
                _list.push({ index: i, name: _e.name, matchName: _e.matchName, enabled: _e.enabled, properties: _props });
            }
            return { ok: true, effects: _list, count: _list.length };
        `;
			}
		});
		registerOp({
			name: "effect.describe",
			category: "effect",
			readOnly: true,
			description: "Describe one effect on a layer as a flat table of every settable property, nested ones included: display-name path (usable as effect.set_property's property), matchName path, value type, current value, minValue/maxValue where After Effects reports them, units, whether it can be keyed, key count, expression, and menu items where the API exposes them (Dropdown Menu Control, AE 26+). Ranges are in scripting units, which can differ from the Effect Controls panel. Read this before writing effect values.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "effect",
					type: "any",
					description: "1-based effect index, effect display name, or effect matchName",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _fxRoot = _layer.property("Effects");
            if (!_fxRoot) return { ok: false, error: "layer has no Effects group" };
            var _fxArg = ${jsxVal(args.effect)};
            var _eff = null;
            try { _eff = _fxRoot.property(_fxArg); } catch (eEf) { _eff = null; }
            if (!_eff) {
                var _have = [];
                for (var _hi = 1; _hi <= _fxRoot.numProperties; _hi++) _have.push(_hi + " " + _fxRoot.property(_hi).name);
                return { ok: false, error: "no effect matching " + _fxArg + " on layer '" + _layer.name + "'; effects: " + (_have.length ? _have.join(", ") : "none") };
            }
            var _desc = AE.describeEffect(_eff);
            return {
                ok: true,
                effect: {
                    index: AE.safeGet(function () { return _eff.propertyIndex; }, null),
                    name: _eff.name,
                    matchName: _eff.matchName,
                    enabled: AE.safeGet(function () { return _eff.enabled; }, null)
                },
                properties: _desc.properties,
                count: _desc.properties.length,
                skippedNoValue: _desc.skippedNoValue
            };
        `;
			}
		});
		registerOp({
			name: "effect.set_property",
			category: "effect",
			description: "Set a property value on an effect. Property path is relative to the effect (e.g. ['Blurriness'] for Gaussian Blur); display names or matchNames. Before writing, the value is checked against what After Effects reports: a wrong type or number of dimensions, or a value outside the reported range, is refused with the valid range named, and nothing is written. Ranges are in scripting units, which can differ from the Effect Controls panel (Gradient Wipe completion is 0 to 1, not percent). A property with no reported range is written as given. Read ranges first with effect.describe.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "effectIndex",
					type: "number",
					description: "1-based effect index",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path within the effect",
					required: true
				},
				{
					name: "value",
					type: "any",
					description: "Value to set",
					required: true
				},
				{
					name: "time",
					type: "number",
					description: "If set, creates a keyframe at this time",
					required: false
				},
				{
					name: "skipCheck",
					type: "boolean",
					description: "Write without checking type, dimensions or the reported range. Only for the rare property whose range After Effects reports wrongly; After Effects may still reject the value.",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _fxRoot = _layer.property("Effects");
            var _fx = _fxRoot.property(${jsxVal(args.effectIndex)});
            if (!_fx) return { ok: false, error: "no effect at index " + ${jsxVal(args.effectIndex)} };
            var _propPath = ${jsxVal(args.property)};
            var _node = _fx;
            for (var _pi = 0; _pi < _propPath.length; _pi++) {
                var _next = null;
                try { _next = _node.property(_propPath[_pi]); } catch (e) {}
                if (!_next) return { ok: false, error: "effect property '" + _propPath[_pi] + "' not found" };
                _node = _next;
            }
            var _time = ${jsxVal(args.time ?? null)};
            var _val = ${jsxVal(args.value)};
            var _check = ${jsxVal(args.skipCheck !== true)};
            if (_check) {
                var _refusal = AE.checkPropertyWrite(_node, _val);
                if (_refusal !== null) {
                    var _rg = AE.propertyRange(_node);
                    return { ok: false, error: _refusal, name: _node.name, matchName: _node.matchName, value: _val, range: _rg };
                }
            }
            if (_time !== null) {
                _node.setValueAtTime(_time, _val);
            } else {
                _node.setValue(_val);
            }
            return { ok: true, name: _node.name, matchName: _node.matchName, checked: _check };
        `;
			}
		});
		registerOp({
			name: "effect.move",
			category: "effect",
			description: "Reorder an effect within a layer's effect stack (PropertyBase.moveTo). Effect order changes the render result.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "effectIndex",
					type: "number",
					description: "1-based index of the effect to move",
					required: true
				},
				{
					name: "toIndex",
					type: "number",
					description: "1-based target position in the stack",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _fx = _layer.property("Effects");
            if (!_fx) return { ok: false, error: "layer has no Effects group" };
            var _from = ${jsxVal(args.effectIndex)};
            var _to = ${jsxVal(args.toIndex)};
            if (_from < 1 || _from > _fx.numProperties) return { ok: false, error: "effectIndex out of range (1-" + _fx.numProperties + ")" };
            if (_to < 1 || _to > _fx.numProperties) return { ok: false, error: "toIndex out of range (1-" + _fx.numProperties + ")" };
            try { _fx.property(_from).moveTo(_to); } catch (eMv) { return { ok: false, error: "moveTo failed: " + AE.errText(eMv) }; }
            var _order = [];
            for (var _i = 1; _i <= _fx.numProperties; _i++) _order.push(_fx.property(_i).name);
            return { ok: true, order: _order };
        `;
			}
		});
		DROPDOWN_MENU_LOOKUP_JSX = `
    var _fx = _layer.property("Effects");
    if (!_fx) return { ok: false, error: "layer has no Effects group" };
    var _eff = null;
    try { _eff = _fx.property(_fxArg); } catch (eEf) {}
    if (!_eff) return { ok: false, error: "no effect matching " + _fxArg };
    var _menu = null;
    for (var _mi = 1; _mi <= _eff.numProperties; _mi++) {
        var _cand = _eff.property(_mi);
        var _isDd = false;
        try { _isDd = (_cand.isDropdownEffect === true); } catch (eDd) {}
        if (_isDd) { _menu = _cand; break; }
    }
    if (!_menu) return { ok: false, error: "effect '" + _eff.name + "' has no dropdown menu property \u2014 is it a Dropdown Menu Control (ADBE Dropdown Control)? (needs AE 17.0.1+)" };
`;
		registerOp({
			name: "effect.set_dropdown_items",
			category: "effect",
			description: `Set the menu items of a Dropdown Menu Control effect (Property.setPropertyParameters, AE 17.0.1+) \u2014 the key API for MOGRT dropdowns. Item strings must be unique; "-" inserts a separator. AE re-creates the control (references from earlier calls become invalid); this op preserves the effect's display name across that re-creation.`,
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "effect",
					type: "any",
					description: "1-based effect index or effect name (a Dropdown Menu Control)",
					required: true
				},
				{
					name: "items",
					type: "array",
					description: "Menu item strings, e.g. [\"Red\", \"Green\", \"-\", \"Custom\"]",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _fxArg = ${jsxVal(args.effect)};
            ${DROPDOWN_MENU_LOOKUP_JSX}
            var _items = ${jsxVal(args.items)};
            // setPropertyParameters RE-CREATES the control: afterwards _eff and
            // _menu are invalid (any member access throws "Object is invalid")
            // and the display name resets to the default. Capture identity
            // first, re-resolve by index after, and put the caller's name back.
            var _prevName = _eff.name;
            var _effIndex = _eff.propertyIndex;
            try { _menu.setPropertyParameters(_items); } catch (eSp) { return { ok: false, error: "setPropertyParameters failed: " + AE.errText(eSp) }; }
            var _eff2 = null;
            try { _eff2 = _fx.property(_effIndex); } catch (eRf) {}
            // The re-resolved reference can itself be invalid (every member
            // access throws "Object is invalid") \u2014 treat that the same as a
            // failed re-resolve so the read-back below skips it too.
            var _eff2Name = null;
            try { _eff2Name = _eff2 !== null ? _eff2.name : null; } catch (eNm) { _eff2 = null; }
            if (_eff2 !== null && _eff2Name !== _prevName) {
                try { _eff2.name = _prevName; } catch (eNm2) {}
            }
            var _read = null;
            if (_eff2 !== null) {
                for (var _mi2 = 1; _mi2 <= _eff2.numProperties; _mi2++) {
                    var _cand2 = _eff2.property(_mi2);
                    var _isDd2 = false;
                    try { _isDd2 = (_cand2.isDropdownEffect === true); } catch (eDd2) {}
                    if (_isDd2) {
                        try { _read = AE.valueToJson(_cand2.propertyParameters); } catch (ePp) {}
                        break;
                    }
                }
            }
            return { ok: true, effect: _prevName, itemCount: _items.length, propertyParameters: _read };
        `;
			}
		});
		registerOp({
			name: "effect.get_dropdown_items",
			category: "effect",
			readOnly: true,
			description: "Read a Dropdown Menu Control's items (Property.propertyParameters, AE 26.0+), current 1-based selection, and its text (valueText).",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "effect",
					type: "any",
					description: "1-based effect index or effect name (a Dropdown Menu Control)",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _fxArg = ${jsxVal(args.effect)};
            ${DROPDOWN_MENU_LOOKUP_JSX}
            return {
                ok: true,
                effect: _eff.name,
                value: AE.safeGet(function () { return _menu.value; }, null),
                valueText: AE.safeGet(function () { return _menu.valueText; }, null),
                items: AE.safeGet(function () { return AE.valueToJson(_menu.propertyParameters); }, null)
            };
        `;
			}
		});
	})))();
}

// operations/comp.js
var RENDERER_RESOLVE_JSX;
function init_comp() {
	return (init_comp = __esmMin((() => {
		init_registry();
		registerOp({
			name: "comp.create",
			category: "comp",
			description: "Create a new composition.",
			params: [
				{
					name: "name",
					type: "string",
					description: "Composition name",
					required: true
				},
				{
					name: "width",
					type: "number",
					description: "Width in px",
					required: true
				},
				{
					name: "height",
					type: "number",
					description: "Height in px",
					required: true
				},
				{
					name: "fps",
					type: "number",
					description: "Frame rate",
					required: true
				},
				{
					name: "duration",
					type: "number",
					description: "Duration in seconds",
					required: true
				},
				{
					name: "bgColor",
					type: "array",
					description: "[r,g,b] 0-1",
					required: false
				}
			],
			toJsx(args) {
				return `
            var _comp = app.project.items.addComp(${jsxVal(args.name)}, ${jsxVal(args.width)}, ${jsxVal(args.height)}, 1, ${jsxVal(args.duration)}, ${jsxVal(args.fps)});
            ${args.bgColor ? `_comp.bgColor = ${jsxVal(args.bgColor)};` : ""}
            return { ok: true, id: _comp.id, name: _comp.name };
        `;
			}
		});
		registerOp({
			name: "comp.set_label",
			category: "comp",
			description: "Set label color on comps. Can target by name, id, or pattern (e.g. 'review_id_*').",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name/id, or pattern with '*' wildcard",
				required: true
			}, {
				name: "label",
				type: "number",
				description: "Label index (0=None, 1=Red, 2=Yellow, 3=Aqua, 4=Pink, 5=Lavender, 6=Peach, 7=Sea Foam, 8=Blue, 9=Green, 10=Purple, 11=Orange, 12=Brown, 13=Fuchsia, 14=Cyan, 15=Sandstone, 16=Dark Green)",
				required: true
			}],
			toJsx(args) {
				return `
            var _comps = AE.findComps(${jsxVal(args.comp)});
            var _updated = 0;
            for (var ci = 0; ci < _comps.length; ci++) {
                _comps[ci].label = ${jsxVal(args.label)};
                _updated++;
            }
            return { ok: true, updated: _updated };
        `;
			}
		});
		registerOp({
			name: "comp.set_props",
			category: "comp",
			description: "Set composition properties (bgColor, workAreaStart, workAreaDuration, shutterAngle, motionBlur, etc.).",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}, {
				name: "props",
				type: "object",
				description: "Object with keys to set",
				required: true
			}],
			toJsx(args) {
				const props = args.props ?? {};
				const lines = [];
				for (const [k, v] of Object.entries(props)) lines.push(`try { _comp[${jsxVal(k)}] = ${jsxVal(v)}; } catch (e) { _w.push(${jsxVal(k)} + ": " + AE.errText(e)); }`);
				return `
            ${jsxCompPreamble(args)}
            var _w = [];
            ${lines.join("\n")}
            return { ok: true, name: _comp.name, warnings: _w };
        `;
			}
		});
		RENDERER_RESOLVE_JSX = `
    var _avail = _comp.renderers;
    var _has = {};
    for (var _ri = 0; _ri < _avail.length; _ri++) _has[_avail[_ri]] = true;
    var _renamed = _has.hasOwnProperty("ADBE Classic 3d");
    var _friendly = {};
    if (_renamed) {
        _friendly.classic3d = "ADBE Classic 3d";
        _friendly.advanced3d = "ADBE Advanced 3d";
        _friendly.cinema4d = "ADBE Cinema 4d";
    } else {
        _friendly.classic3d = "ADBE Advanced 3d";
        _friendly.advanced3d = "ADBE Calder";
        _friendly.cinema4d = "ADBE Ernst";
    }
`;
		registerOp({
			name: "comp.set_renderer",
			category: "comp",
			description: "Switch a comp's 3D renderer: classic3d | advanced3d | cinema4d (or a raw matchName from comp.list_renderers). Advanced 3D is required for 3D model layers, parametric meshes, and environment lights to render.",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}, {
				name: "renderer",
				type: "string",
				description: "classic3d|advanced3d|cinema4d, or an exact renderer matchName",
				required: true
			}],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            ${RENDERER_RESOLVE_JSX}
            var _arg = ${jsxVal(args.renderer)};
            var _target = _friendly.hasOwnProperty(_arg) ? _friendly[_arg] : _arg;
            if (!_has.hasOwnProperty(_target)) return { ok: false, error: "renderer '" + _target + "' not available \u2014 installed: " + _avail.join(", ") };
            try { _comp.renderer = _target; } catch (eRd) { return { ok: false, error: "renderer set failed: " + AE.errText(eRd) }; }
            return { ok: true, renderer: _comp.renderer, renderers: AE.valueToJson(_avail) };
        `;
			}
		});
		registerOp({
			name: "comp.list_renderers",
			category: "comp",
			readOnly: true,
			description: "List the comp's available 3D renderer matchNames, the current one, and the friendly-name mapping used by comp.set_renderer.",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            ${RENDERER_RESOLVE_JSX}
            return { ok: true, renderer: _comp.renderer, renderers: AE.valueToJson(_avail), friendlyNames: _friendly };
        `;
			}
		});
		registerOp({
			name: "comp.set_work_area",
			category: "comp",
			description: "Set the work area start and duration on a composition.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "start",
					type: "number",
					description: "Work area start in seconds",
					required: true
				},
				{
					name: "duration",
					type: "number",
					description: "Work area duration in seconds",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            _comp.workAreaStart = ${jsxVal(args.start)};
            _comp.workAreaDuration = ${jsxVal(args.duration)};
            return { ok: true, workAreaStart: _comp.workAreaStart, workAreaDuration: _comp.workAreaDuration };
        `;
			}
		});
		registerOp({
			name: "comp.add_guide",
			category: "comp",
			description: "Add a horizontal or vertical guide line to a comp (AE 16.1+).",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "orientation",
					type: "string",
					description: "horizontal|vertical",
					required: true
				},
				{
					name: "position",
					type: "number",
					description: "Position in px (y for horizontal, x for vertical)",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            if (typeof _comp.addGuide !== "function") return { ok: false, error: "guides need AE 16.1+" };
            var _orient = ${jsxVal(args.orientation)} === "vertical" ? 1 : 0;
            var _idx = _comp.addGuide(_orient, ${jsxVal(args.position)});
            return { ok: true, guideIndex: _idx, numGuides: _comp.guides.length };
        `;
			}
		});
		registerOp({
			name: "comp.remove_guide",
			category: "comp",
			description: "Remove a guide from a comp by its 0-based index (see comp.list_guides).",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}, {
				name: "guideIndex",
				type: "number",
				description: "0-based guide index",
				required: true
			}],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            if (typeof _comp.removeGuide !== "function") return { ok: false, error: "guides need AE 16.1+" };
            if (${jsxVal(args.guideIndex)} < 0 || ${jsxVal(args.guideIndex)} >= _comp.guides.length) {
                return { ok: false, error: "guide index out of range (comp has " + _comp.guides.length + " guides)" };
            }
            _comp.removeGuide(${jsxVal(args.guideIndex)});
            return { ok: true, numGuides: _comp.guides.length };
        `;
			}
		});
		registerOp({
			name: "comp.set_guide",
			category: "comp",
			description: "Move an existing guide to a new position (Item.setGuide). Orientation cannot be changed after creation — remove and re-add instead.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "guideIndex",
					type: "number",
					description: "0-based guide index",
					required: true
				},
				{
					name: "position",
					type: "number",
					description: "New position in px (y for horizontal, x for vertical)",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            if (typeof _comp.setGuide !== "function") return { ok: false, error: "guides need AE 16.1+" };
            if (${jsxVal(args.guideIndex)} < 0 || ${jsxVal(args.guideIndex)} >= _comp.guides.length) {
                return { ok: false, error: "guide index out of range (comp has " + _comp.guides.length + " guides)" };
            }
            _comp.setGuide(${jsxVal(args.position)}, ${jsxVal(args.guideIndex)});
            return { ok: true, guideIndex: ${jsxVal(args.guideIndex)}, position: ${jsxVal(args.position)} };
        `;
			}
		});
		registerOp({
			name: "comp.list_guides",
			category: "comp",
			readOnly: true,
			description: "List all guides on a comp with orientation and position (AE 16.1+).",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _guides = [];
            try {
                for (var _gi = 0; _gi < _comp.guides.length; _gi++) {
                    var _g = _comp.guides[_gi];
                    _guides.push({
                        index: _gi,
                        orientation: _g.orientationType === 1 ? "vertical" : "horizontal",
                        position: _g.position
                    });
                }
            } catch (eG) { return { ok: false, error: "guides need AE 16.1+: " + AE.errText(eG) }; }
            return { ok: true, count: _guides.length, guides: _guides };
        `;
			}
		});
		registerOp({
			name: "comp.delete",
			category: "comp",
			description: "Delete a composition from the project.",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _name = _comp.name;
            _comp.remove();
            return { ok: true, removed: _name };
        `;
			}
		});
	})))();
}

// operations/command.js
function isUndoRedoCommandId(id) {
	return id === 16 || id === 2035;
}
var UNDO_COMMAND_ID, REDO_COMMAND_ID;
function init_command() {
	return (init_command = __esmMin((() => {
		init_registry();
		UNDO_COMMAND_ID = 16;
		REDO_COMMAND_ID = 2035;
		registerOp({
			name: "command.execute",
			category: "command",
			description: "Execute an AE menu command by its numeric ID. Use command.list to discover common IDs. Undo (16) and Redo (2035) run outside this call's undo group, so they revert/replay the PREVIOUS call; like project.undo / project.redo they run with dialogs suppressed, report any error After Effects raised, and are refused after a scripted render-queue change in the session unless acceptRenderQueueRisk: true.",
			params: [{
				name: "id",
				type: "number",
				description: "Menu command ID",
				required: true
			}, {
				name: "acceptRenderQueueRisk",
				type: "boolean",
				description: "Default false. After a scripted render-queue change in this After Effects session, Undo/Redo (16/2035) are refused (After Effects 2027 has gone into crash recovery on undo after such changes — observed twice; a precaution). Pass true only when the user accepts that risk, ideally after saving.",
				required: false
			}],
			undoGroup: (args) => !isUndoRedoCommandId(args.id),
			toJsx(args) {
				if (isUndoRedoCommandId(args.id)) return `
            var _c = AE_MCP.undoRedo(${jsxVal(args.id)}, 1, ${jsxVal(args.acceptRenderQueueRisk === true)});
            _c.commandId = ${jsxVal(args.id)};
            return _c;
        `;
				return `
            app.executeCommand(${jsxVal(args.id)});
            return { ok: true, commandId: ${jsxVal(args.id)} };
        `;
			}
		});
		registerOp({
			name: "command.find",
			category: "command",
			readOnly: true,
			description: "Find a menu command ID by name (AE's app.findMenuCommandId). Note: not reliable across languages.",
			params: [{
				name: "name",
				type: "string",
				description: "Menu command name (English)",
				required: true
			}],
			toJsx(args) {
				return `
            var _id = app.findMenuCommandId(${jsxVal(args.name)});
            if (!_id || _id === 0) return { ok: false, error: "command not found: " + ${jsxVal(args.name)} };
            return { ok: true, name: ${jsxVal(args.name)}, commandId: _id };
        `;
			}
		});
		registerOp({
			name: "command.list",
			category: "command",
			readOnly: true,
			description: "Return a curated list of commonly-used menu command IDs.",
			params: [],
			toJsx() {
				return `
            return { ok: true, commands: [
                { id: 16, name: "Undo" },
                { id: 2004, name: "New Composition" },
                { id: 2005, name: "New Folder" },
                { id: 2019, name: "New Solid" },
                { id: 2025, name: "New Adjustment Layer" },
                { id: 2028, name: "New Null Object" },
                { id: 2030, name: "New Camera" },
                { id: 2031, name: "New Light" },
                { id: 2035, name: "Redo" },
                { id: 2040, name: "Deselect All" },
                { id: 2055, name: "Purge Image Caches" },
                { id: 2071, name: "Pre-compose" },
                { id: 2072, name: "Move All Attributes" },
                { id: 2078, name: "Trim Comp to Work Area" },
                { id: 2156, name: "Fit to Comp" },
                { id: 2157, name: "Fit to Comp Width" },
                { id: 2158, name: "Fit to Comp Height" },
                { id: 2243, name: "Convert Audio to Keyframes" },
                { id: 2349, name: "Convert to Bezier Path" },
                { id: 2371, name: "Time-Reverse Keyframes" },
                { id: 2450, name: "Fit to Screen" },
                { id: 2501, name: "Snap to Grid" },
                { id: 2691, name: "Render Queue" },
                { id: 2732, name: "Convert Expression to Keyframes" },
                { id: 3101, name: "Purge All Memory & Disk Cache" },
                { id: 10312, name: "Align Layers to Composition" }
            ] };
        `;
			}
		});
	})))();
}

// operations/delivery-sound.js
function runTool(cands, argv, timeoutMs = 12e4) {
	return new Promise((resolve) => {
		const tryAt = (i) => {
			if (i >= cands.length) return resolve(null);
			execFile(cands[i], argv, {
				timeout: timeoutMs,
				maxBuffer: 16777216
			}, (err, stdout, stderr) => {
				if (err && err.code === "ENOENT") return tryAt(i + 1);
				resolve({
					stdout: String(stdout),
					stderr: String(stderr),
					failed: err !== null
				});
			});
		};
		tryAt(0);
	});
}
function* boxes(buf, start, end) {
	let o = start;
	while (o + 8 <= end) {
		let size = buf.readUInt32BE(o);
		const type = buf.toString("latin1", o + 4, o + 8);
		let header = 8;
		if (size === 1) {
			if (o + 16 > end) return;
			size = Number(buf.readBigUInt64BE(o + 8));
			header = 16;
		} else if (size === 0) size = end - o;
		if (size < header || o + size > end) return;
		yield {
			type,
			start: o + header,
			end: o + size
		};
		o += size;
	}
}
function soundTrackFromMoov(moov) {
	const root = {
		type: "moov",
		start: 0,
		end: moov.length
	};
	const mvhd = child(moov, root, "mvhd");
	const movieTimescale = mvhd ? moov.readUInt32BE(mvhd.start + (moov[mvhd.start] === 1 ? 20 : 12)) : 0;
	for (const trak of boxes(moov, 0, moov.length)) {
		if (trak.type !== "trak") continue;
		const mdia = child(moov, trak, "mdia");
		if (!mdia) continue;
		const hdlr = child(moov, mdia, "hdlr");
		if (!hdlr || moov.toString("latin1", hdlr.start + 8, hdlr.start + 12) !== "soun") continue;
		const mdhd = child(moov, mdia, "mdhd");
		const mediaTimescale = mdhd ? moov.readUInt32BE(mdhd.start + (moov[mdhd.start] === 1 ? 20 : 12)) : 0;
		const minf = child(moov, mdia, "minf");
		const stbl = minf ? child(moov, minf, "stbl") : null;
		const stsd = stbl ? child(moov, stbl, "stsd") : null;
		let codec = "";
		let sampleRate = 0;
		if (stsd && stsd.start + 16 <= stsd.end) {
			const entry = stsd.start + 8;
			codec = moov.toString("latin1", entry + 4, entry + 8);
			if (entry + 36 <= stsd.end) sampleRate = moov.readUInt32BE(entry + 32) >>> 16;
		}
		let edits = null;
		const edts = child(moov, trak, "edts");
		const elst = edts ? child(moov, edts, "elst") : null;
		if (elst) {
			const v1 = moov[elst.start] === 1;
			const count = moov.readUInt32BE(elst.start + 4);
			edits = [];
			let o = elst.start + 8;
			for (let i = 0; i < count && o + (v1 ? 20 : 12) <= elst.end; i++) {
				const segmentDuration = v1 ? Number(moov.readBigUInt64BE(o)) : moov.readUInt32BE(o);
				const mediaTime = v1 ? Number(moov.readBigInt64BE(o + 8)) : moov.readInt32BE(o + 4);
				edits.push({
					segmentDuration,
					mediaTime
				});
				o += v1 ? 20 : 12;
			}
		}
		return {
			codec,
			sampleRate: sampleRate >= 8e3 ? sampleRate : mediaTimescale,
			mediaTimescale,
			movieTimescale,
			edits
		};
	}
	return null;
}
async function readMoov(file) {
	const fh = await promises.open(file, "r");
	try {
		const { size } = await fh.stat();
		const head = Buffer.alloc(16);
		let o = 0;
		while (o + 8 <= size) {
			await fh.read(head, 0, 16, o);
			let boxSize = head.readUInt32BE(0);
			const type = head.toString("latin1", 4, 8);
			let header = 8;
			if (boxSize === 1) {
				boxSize = Number(head.readBigUInt64BE(8));
				header = 16;
			} else if (boxSize === 0) boxSize = size - o;
			if (boxSize < header) return null;
			if (type === "moov") {
				const body = Buffer.alloc(boxSize - header);
				await fh.read(body, 0, body.length, o + header);
				return body;
			}
			o += boxSize;
		}
		return null;
	} finally {
		await fh.close();
	}
}
function soundSyncOf(t) {
	const rate = t.sampleRate || t.mediaTimescale || 48e3;
	let delaySeconds = 0;
	let skipped = 0;
	for (const e of t.edits ?? []) {
		if (e.mediaTime === -1) {
			delaySeconds += t.movieTimescale ? e.segmentDuration / t.movieTimescale : 0;
			continue;
		}
		skipped = t.mediaTimescale ? Math.round(e.mediaTime * rate / t.mediaTimescale) : e.mediaTime;
		break;
	}
	const aac = t.codec === "mp4a";
	const priming = aac ? skipped > 0 ? skipped : AE_AAC_PRIMING_SAMPLES : 0;
	const late = Math.max(0, priming - skipped) + Math.round(delaySeconds * rate);
	const lateMs = Math.round(late / rate * 1e5) / 100;
	return {
		codec: t.codec,
		sampleRate: rate,
		primingSamples: priming,
		skippedSamples: skipped,
		lateBySamples: late,
		lateMs,
		reading: late === 0 ? aac ? `the sound is on its frame: the edit list skips the AAC encoder's ${priming} samples of priming` : `the sound is on its frame (${t.codec || "uncompressed"} sound, no priming)` : `the sound plays ${late} samples (${lateMs} ms) late` + (aac && skipped === 0 ? `: the AAC encoder's ${priming} samples of priming are not skipped (no edit list)` : "")
	};
}
async function readSoundSync(file) {
	const moov = await readMoov(file).catch(() => null);
	if (!moov) return null;
	const t = soundTrackFromMoov(moov);
	return t ? soundSyncOf(t) : null;
}
async function alignSound(file, sync) {
	if (sync.lateBySamples <= 0) return {
		aligned: true,
		how: "already on its frame",
		before: sync,
		after: sync
	};
	const ext = path$1.extname(file);
	const tmp = path$1.join(path$1.dirname(file), `.${path$1.basename(file, ext)}.sound-aligned${ext}`);
	const offset = (sync.lateBySamples / sync.sampleRate).toFixed(9);
	const r = await runTool(FFMPEG, [
		"-hide_banner",
		"-loglevel",
		"error",
		"-y",
		"-i",
		file,
		"-itsoffset",
		`-${offset}`,
		"-i",
		file,
		"-map",
		"0",
		"-map",
		"-0:a",
		"-map",
		"1:a",
		"-c",
		"copy",
		tmp
	]);
	if (r === null) return {
		aligned: false,
		how: "ffmpeg is not installed, so the file could not be remuxed",
		before: sync
	};
	const giveUp = async (how) => {
		await promises.rm(tmp, { force: true });
		return {
			aligned: false,
			how,
			before: sync
		};
	};
	if (r.failed) return giveUp(`ffmpeg could not remux the file: ${r.stderr.trim().slice(0, 300)}`);
	const after = await readSoundSync(tmp).catch(() => null);
	const wanted = sync.skippedSamples + sync.lateBySamples;
	if (!after || Math.abs(after.skippedSamples - wanted) > 1 || after.lateBySamples > 1) return giveUp(`the remuxed file's edit list does not skip the ${wanted} samples (${after ? `it skips ${after.skippedSamples}` : "it has no sound track that could be read"}); the delivered file was left as it was`);
	await promises.rename(tmp, file);
	return {
		aligned: true,
		how: `remuxed with ffmpeg (-c copy, nothing re-encoded): an edit list on the sound track now skips the ${wanted} samples of priming`,
		before: sync,
		after
	};
}
function parseEbur128Summary(stderr) {
	const at = stderr.lastIndexOf("Summary:");
	if (at < 0) return null;
	const s = stderr.slice(at);
	const i = /Integrated loudness:\s*I:\s*(-?[\d.]+|-inf)\s*LUFS/.exec(s);
	const lra = /Loudness range:\s*LRA:\s*(-?[\d.]+)\s*LU/.exec(s);
	const tp = /True peak:\s*Peak:\s*(-?[\d.]+|-inf)\s*dBFS/.exec(s);
	if (!i || !tp) return null;
	return {
		integratedLufs: num(i[1]),
		loudnessRangeLu: lra ? Number(lra[1]) : null,
		truePeakDbtp: num(tp[1])
	};
}
function parseVolumedetect(stderr) {
	const m = /mean_volume:\s*(-?[\d.]+|-inf) dB/.exec(stderr);
	const x = /max_volume:\s*(-?[\d.]+|-inf) dB/.exec(stderr);
	return m && x ? {
		meanDb: num(m[1]),
		maxDb: num(x[1])
	} : {
		meanDb: null,
		maxDb: null
	};
}
var AE_AAC_PRIMING_SAMPLES, FFPROBE, FFMPEG, child, num;
function init_delivery_sound() {
	return (init_delivery_sound = __esmMin((() => {
		AE_AAC_PRIMING_SAMPLES = 1024;
		FFPROBE = [
			"ffprobe",
			"/opt/homebrew/bin/ffprobe",
			"/usr/local/bin/ffprobe"
		];
		FFMPEG = [
			"ffmpeg",
			"/opt/homebrew/bin/ffmpeg",
			"/usr/local/bin/ffmpeg"
		];
		child = (buf, parent, type) => {
			for (const b of boxes(buf, parent.start, parent.end)) if (b.type === type) return b;
			return null;
		};
		num = (s) => s === "-inf" ? -Infinity : Number(s);
	})))();
}

// operations/keying-shared.js
function alikeRegions(a, b) {
	if (iou(a, b) >= .5) return true;
	if (!intersects(a, b)) return false;
	const big = Math.max(a.area, b.area);
	const small = Math.min(a.area, b.area);
	return small > 0 && big / small <= 2;
}
function frozenAccepted(run, accept) {
	return accept.some((e) => isFrozenEntry(e) && (e.from === void 0 || e.from <= run.to) && (e.to === void 0 || e.to >= run.from));
}
function acceptedBy(f, accept) {
	return accept.some((e) => {
		if (isFrozenEntry(e)) return false;
		const box = "box" in e ? e.box : e;
		return (("box" in e ? e.kind : void 0) ?? "opening") === f.kind && iou(f.box, box) >= .5;
	});
}
function cutoutFindings(frames, limit) {
	const out = [];
	for (const kind of ["hole", "opening"]) {
		const groups = [];
		for (const fr of frames) for (const h of (kind === "hole" ? fr.holes : fr.openings) ?? []) {
			if (h.area < limit) continue;
			const b = {
				x: h.x,
				y: h.y,
				width: h.width,
				height: h.height
			};
			const g = groups.find((x) => x.members.some((m) => alikeRegions(m, h)));
			if (g) {
				const f = g.f;
				g.members.push(h);
				f.box = union(f.box, b);
				if (h.area > f.largestArea) {
					f.largestArea = h.area;
					f.largestFrame = fr.frame;
				}
				f.smallestArea = Math.min(f.smallestArea, h.area);
				if (!f.frames.includes(fr.frame)) f.frames.push(fr.frame);
				if (f.edges) {
					for (const e of h.edges ?? []) if (!f.edges.includes(e)) f.edges.push(e);
				}
			} else groups.push({
				members: [h],
				f: {
					kind,
					frames: [fr.frame],
					smallestArea: h.area,
					largestArea: h.area,
					largestFrame: fr.frame,
					box: b,
					...kind === "opening" ? { edges: [...h.edges ?? []] } : {}
				}
			});
		}
		out.push(...groups.map((g) => g.f).sort((a, b) => b.largestArea - a.largestArea));
	}
	return out;
}
async function writePng(io, file, data) {
	if (io.writePng) return io.writePng(file, data);
	await promises.mkdir(path$1.dirname(file), { recursive: true });
	await promises.writeFile(file, data);
}
async function statfsFree(dir) {
	let d = path$1.resolve(dir);
	for (;;) try {
		const st = await promises.statfs(d);
		return Number(st.bavail) * Number(st.bsize);
	} catch {
		const up = path$1.dirname(d);
		if (up === d) return null;
		d = up;
	}
}
async function spaceRefusal(io, dir, needed, margin, what) {
	const free = await (io.freeBytes ?? statfsFree)(dir);
	if (free === null || free >= needed + margin) return null;
	return {
		ok: false,
		error: `only ${gb(free)} free on the drive holding ${dir}; ${what} needs about ${gb(needed)} plus a margin of ${gb(margin)} (After Effects writes its disk cache to the same drive while it renders, and a render on a nearly full drive stalls instead of failing). Free some space first, for example by purging After Effects' cache: Edit > Purge > All Memory & Disk Cache. Nothing was rendered.`,
		space: {
			free,
			needed: Math.round(needed),
			margin,
			where: dir
		}
	};
}
function cacheBytesFor(frames, sourceSize) {
	const [w, h] = Array.isArray(sourceSize) && sourceSize.length >= 2 ? sourceSize : [1920, 1080];
	return frames * w * h * 8;
}
async function volumeKey(dir) {
	let d = path$1.resolve(dir);
	for (;;) try {
		return (await promises.stat(d)).dev;
	} catch {
		const up = path$1.dirname(d);
		if (up === d) return null;
		d = up;
	}
}
async function spacePlan(io, entries, margin, what) {
	const byVol = [];
	for (const e of entries) {
		const key = await (io.volumeOf ?? volumeKey)(e.where);
		const v = byVol.find((x) => x.key === key && key !== null);
		if (v) for (const [k, n] of Object.entries(e.parts)) v.parts[k] = (v.parts[k] ?? 0) + (n ?? 0);
		else byVol.push({
			key,
			where: e.where,
			parts: { ...e.parts }
		});
	}
	const volumes = [];
	let refusal = null;
	for (const v of byVol) {
		const free = await (io.freeBytes ?? statfsFree)(v.where);
		const needed = Object.values(v.parts).reduce((a, b) => a + (b ?? 0), 0);
		const ok = free === null || free >= needed + margin;
		const row = {
			where: v.where,
			free,
			parts: v.parts,
			needed: Math.round(needed),
			margin,
			ok
		};
		volumes.push(row);
		if (!ok && !refusal) {
			const partText = Object.entries(v.parts).map(([k, n]) => `${PART_NAMES[k]} ${gb(n ?? 0)}`).join(", ");
			refusal = {
				ok: false,
				error: `only ${gb(free)} free on the drive holding ${v.where}; ${what} needs about ${gb(needed)} there (${partText}) plus a margin of ${gb(margin)}. A render on a nearly full drive stalls instead of failing. Free some space first, for example by purging After Effects' cache: Edit > Purge > All Memory & Disk Cache. Nothing was rendered.`,
				space: {
					...row,
					volumes
				}
			};
		}
	}
	if (refusal) refusal.space.volumes = volumes;
	return {
		volumes,
		refusal
	};
}
function aeCacheRoot(folder, version) {
	if (!folder || !version) return null;
	const m = /^(\d+)\.(\d+)/.exec(version);
	if (!m) return null;
	return path$1.join(folder, "Adobe", "After Effects", `${m[1]}.${m[2]}`);
}
function frozenFinding(run, pictures) {
	const moved = run.footageChange > .001;
	return {
		kind: "frozen",
		...run,
		pictures,
		reading: `The cut-out's outline did not move for ${run.length} frames` + (moved ? ` while the footage did (frames ${run.from} to ${run.to}; ${(run.footageChange * 100).toFixed(1)}% of the frame changed inside the outline)` : ` (frames ${run.from} to ${run.to}), and the picture inside it barely changed either`) + `. The selection is probably not tracking: this happens when the layer's footage is replaced after the click. Click again on this footage (subject.prepare, then the steps). If the subject is genuinely motionless (a product on a table, a locked-off object) this is expected: pass accept: [{ kind: "frozen" }] to wave it through once seen.`
	};
}
async function renderChunked(io, base, frames, perFrameMs, outDir, stem, tally = renderTally(), firstCall = 0) {
	const size = Math.max(1, Math.min(32, Math.floor(SETTLE_MAX_MS / perFrameMs)));
	const out = [];
	for (let c = 0; c * size < frames.length; c++) {
		const chunk = frames.slice(c * size, (c + 1) * size);
		const t0 = performance.now();
		const payload = await io.render({
			...base,
			frames: chunk,
			outPath: path$1.join(outDir, `${stem}-${firstCall + c}.png`),
			settleTimeoutMs: Math.min(SETTLE_MAX_MS, Math.max(1, Math.round(perFrameMs * chunk.length)))
		});
		tally.calls++;
		tally.frames += chunk.length;
		tally.ms += since(t0);
		tally.aeCallMs += payload?.timing?.aeCallMs ?? 0;
		tally.settleMs += payload?.timing?.settleMs ?? payload?.captureSettle?.waitedMs ?? 0;
		tally.renderNodeMs += payload?.timing?.nodeMs ?? 0;
		if (!payload?.ok) {
			for (const frame of chunk) out.push({
				frame,
				ok: false,
				error: `the render call failed: ${payload?.error ?? "no result"}`
			});
			continue;
		}
		const list = payload.frames ?? (payload.writtenTo ? [{
			...payload,
			ok: true,
			frame: chunk[0]
		}] : []);
		for (const [i, frame] of chunk.entries()) {
			const f = list.find((x) => x.frame === frame) ?? list[i];
			if (!f) out.push({
				frame,
				ok: false,
				error: "not in the render's result"
			});
			else if (f.ok === false || typeof f.writtenTo !== "string") out.push({
				frame,
				ok: false,
				error: f.error ?? "the frame was not written"
			});
			else out.push({
				frame,
				ok: true,
				file: f.writtenTo,
				edge: f.edge
			});
		}
	}
	return out;
}
function parseHex(c) {
	const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
	if (!m) return [
		1,
		0,
		1
	];
	const v = parseInt(m[1], 16);
	return [
		(v >> 16 & 255) / 255,
		(v >> 8 & 255) / 255,
		(v & 255) / 255
	];
}
async function measureFrames(io, rendered, limit, over, sheetPath, tally = pixelTally(), pictures = true, onImage) {
	const started = performance.now();
	const colour = parseHex(over);
	const readings = [];
	const thumbs = [];
	const labels = [];
	const split = (list) => ({
		big: list.filter((r) => r.area >= limit),
		small: {
			count: list.filter((r) => r.area < limit).length,
			area: list.filter((r) => r.area < limit).reduce((s, r) => s + r.area, 0)
		}
	});
	for (const r of rendered) {
		if (!r.ok || !r.file) {
			readings.push({
				frame: r.frame,
				checked: false,
				holes: null,
				openings: null,
				error: r.error
			});
			continue;
		}
		let img;
		const tRead = performance.now();
		try {
			img = await io.readImage(r.file);
		} catch (err) {
			readings.push({
				frame: r.frame,
				checked: false,
				holes: null,
				openings: null,
				error: `could not read ${r.file}: ${err instanceof Error ? err.message : String(err)}`
			});
			continue;
		} finally {
			tally.readMs += since(tRead);
		}
		if (!img.alpha) {
			readings.push({
				frame: r.frame,
				checked: false,
				holes: null,
				openings: null,
				error: `${r.file} has no alpha channel`
			});
			continue;
		}
		tally.frames++;
		const tRegions = performance.now();
		const regions = cutoutRegions(img.alpha, img.width, img.height);
		let opaquePx = 0;
		const alpha = img.alpha;
		for (let p = 0; p < alpha.length; p++) if (alpha[p] >= EDGE_DEFAULTS.opaque) opaquePx++;
		tally.regionsMs += since(tRegions);
		const h = split(regions.holes);
		const o = split(regions.openings);
		const tPic = performance.now();
		if (!pictures) {
			readings.push({
				frame: r.frame,
				checked: true,
				file: r.file,
				opaqueShare: Math.round(opaquePx / img.alpha.length * 1e4) / 1e4,
				holes: h.big,
				openings: o.big,
				holesUnderLimit: h.small,
				openingsUnderLimit: o.small
			});
			onImage?.(readings[readings.length - 1], img);
			continue;
		}
		const composite = flattenOver(img, {
			kind: "color",
			color: colour
		});
		const picture2 = r.file.replace(/\.png$/i, "") + "_over.png";
		await writePng(io, picture2, encodePngSrgb8(img.width, img.height, composite, 1));
		const tw = Math.min(360, img.width);
		const th = Math.max(1, Math.round(img.height * tw / img.width));
		thumbs.push({
			width: tw,
			height: th,
			rgb: resample({
				...img,
				rgb: composite
			}, tw, th),
			bitDepth: 8
		});
		labels.push(`frame ${r.frame}`);
		tally.picturesMs += since(tPic);
		readings.push({
			frame: r.frame,
			checked: true,
			file: r.file,
			picture: picture2,
			opaqueShare: Math.round(opaquePx / img.alpha.length * 1e4) / 1e4,
			holes: h.big,
			openings: o.big,
			holesUnderLimit: h.small,
			openingsUnderLimit: o.small,
			edgeWidth: r.edge?.width ? {
				typical: r.edge.width.typical ?? null,
				p90: r.edge.width.p90 ?? null
			} : null,
			solidAreas: r.edge?.solidAreas?.count ?? null
		});
		onImage?.(readings[readings.length - 1], img);
	}
	let picture = null;
	const tSheet = performance.now();
	if (thumbs.length) {
		const sheet = composeContactSheet(thumbs, {
			labels,
			thumbWidth: 360
		});
		await writePng(io, sheetPath, encodePngSrgb8(sheet.width, sheet.height, sheet.rgb, 1));
		picture = sheetPath;
	}
	tally.sheetMs += since(tSheet);
	tally.ms += since(started);
	return {
		readings,
		picture
	};
}
function regionLines(findings, frames) {
	return findings.map((f) => `${f.smallestArea === f.largestArea ? `${fmt(f.largestArea)} px` : `${fmt(f.smallestArea)} to ${fmt(f.largestArea)} px (largest on frame ${f.largestFrame})`} at ${boxText(f.box)} on ${f.frames.length} of ${frames} frames (${f.frames.join(", ")})` + (f.kind === "opening" && f.edges?.length ? `, reaches the ${f.edges.join(" and ")} edge` : ""));
}
function summarize(readings, limit, accept, picture = null, passText = null) {
	const regions = cutoutFindings(readings, limit);
	const accepted = regions.filter((f) => acceptedBy(f, accept));
	const open = regions.filter((f) => !accepted.includes(f));
	const missed = readings.filter((r) => !r.checked);
	const checked = {
		frames: readings.length - missed.length,
		of: readings.length
	};
	const notChecked = missed.length ? [{
		kind: "not-checked",
		frames: missed.map((r) => r.frame),
		errors: [...new Set(missed.map((r) => r.error ?? "not rendered"))]
	}] : [];
	const holes = open.filter((f) => f.kind === "hole");
	const openings = open.filter((f) => f.kind === "opening");
	const parts = [];
	parts.push(missed.length ? `Checked ${checked.frames} of ${checked.of} frames; ${missed.length} did not render (${missed.map((r) => r.frame).join(", ")}): ${notChecked[0].errors.join("; ")}. Those frames were not checked.` : `Checked ${checked.frames} of ${checked.of} frames.`);
	if (holes.length) parts.push(`${plural(holes.length, "enclosed hole")} of ${fmt(limit)} px or more inside the cut-out: ${regionLines(holes, readings.length).join("; ")}. A hole is something in front of the subject not selected (a cup) or a gap inside a piece that no click fills (subject.fill_gaps).`);
	if (openings.length) parts.push(`${plural(openings.length, "opening")} of ${fmt(limit)} px or more, closed off by the subject and the frame edge: ${regionLines(openings, readings.length).join("; ")}. An opening may be something in front of the subject left out (a microphone, a desk), or a real gap such as between an arm and the body; the picture decides.`);
	if (!holes.length && !openings.length) parts.push(missed.length ? `No hole or opening of ${fmt(limit)} px or more on the ${checked.frames} frames checked; the other ${missed.length} were not checked.` : passText ?? `Nothing over the limit on ${checked.frames} of ${checked.of} frames; the picture is at ${picture ?? "(none)"}.`);
	if (accepted.length) parts.push(`Accepted earlier and not counted: ${regionLines(accepted, readings.length).join("; ")}.`);
	return {
		findings: [...open, ...notChecked],
		accepted,
		checked,
		text: parts.join(" ")
	};
}
async function overPicture(io, file, over) {
	try {
		const img = await io.readImage(file);
		const picture = file.replace(/\.png$/i, "") + "_over.png";
		await writePng(io, picture, encodePngSrgb8(img.width, img.height, flattenOver(img, {
			kind: "color",
			color: parseHex(over)
		}), 1));
		return picture;
	} catch {
		return null;
	}
}
function fillUnbuildJsx(args) {
	return `
            ${jsxCompPreamble(args)}
            var _names = [${jsxVal(args.fillLayer)}, ${jsxVal(args.maskLayer)}];
            var _removed = [];
            for (var _ni = 0; _ni < _names.length; _ni++) {
                for (var _li = _comp.numLayers; _li >= 1; _li--) {
                    var _l = _comp.layer(_li);
                    if (_l.name === _names[_ni]) { _l.remove(); _removed.push(_names[_ni]); break; }
                }
            }
            var _id = ${jsxVal(args.stillItemId)};
            if (_id !== null) {
                var _item = AE.safeGet(function () { return app.project.itemByID(_id); }, null);
                if (_item) { var _iname = _item.name; _item.remove(); _removed.push(_iname); }
            }
            return { ok: true, removed: _removed };
        `;
}
function fillBuildJsx(args) {
	return `
            ${jsxCompLayerPreamble(args)}
            var _fillName = _layer.name + " gap fill";
            var _maskName = _layer.name + " gap mask";
            for (var _li = 1; _li <= _comp.numLayers; _li++) {
                var _ln = _comp.layer(_li).name;
                if (_ln === _fillName || _ln === _maskName) return { ok: false, error: "comp " + _comp.name + " already has a layer '" + _ln + "'; delete the earlier fill's two layers first" };
            }
            var _file = new File(${jsxVal(args.stillPath)});
            if (!_file.exists) return { ok: false, error: "no file at " + ${jsxVal(args.stillPath)} };
            var _item = app.project.importFile(new ImportOptions(_file));
            var _mask = _comp.layers.add(_item);
            _mask.name = _maskName;
            var _fill = _layer.duplicate();
            _fill.name = _fillName;
            var _fxs = _fill.property("ADBE Effect Parade");
            var _removed = 0;
            if (_fxs) {
                for (var _fi = _fxs.numProperties; _fi >= 1; _fi--) {
                    if (_fxs.property(_fi).matchName === ${jsxVal(OBJECT_MATTE_MATCH_NAME)}) { _fxs.property(_fi).remove(); _removed++; }
                }
            }
            _fill.moveAfter(_layer);
            _mask.moveBefore(_fill);
            var _spanError = null;
            try {
                _mask.startTime = 0;
                _mask.inPoint = Math.min(_layer.inPoint, _layer.outPoint);
                _mask.outPoint = Math.max(_layer.inPoint, _layer.outPoint);
            } catch (eSpan) { _spanError = AE.errText(eSpan); }
            _fill.setTrackMatte(_mask, TrackMatteType.LUMA);
            _mask.enabled = false;
            var _audioOff = false;
            var _audioError = null;
            if (AE.safeGet(function () { return _fill.hasAudio; }, false)) {
                try { _fill.audioEnabled = false; _audioOff = true; } catch (eAud) { _audioError = AE.errText(eAud); }
            }
            var _out = { ok: true, fillLayer: _fill.name, fillIndex: _fill.index, maskLayer: _mask.name, maskIndex: _mask.index, stillItem: _item.name, stillItemId: AE.safeGet(function () { return _item.id; }, null), removedFromCopy: _removed, audioOff: _audioOff, hasAudio: AE.safeGet(function () { return _fill.hasAudio; }, false) };
            if (_audioError !== null) _out.audioError = _audioError;
            if (_spanError !== null) _out.maskSpanError = _spanError;
            return _out;
        `;
}
function liveCutoutIO(args, transport) {
	return {
		async status() {
			const code = getOp("subject.status").toJsx({
				comp: args.comp,
				layer: args.layer,
				effectIndex: args.effectIndex
			});
			const r = await transport.execute({
				code,
				label: "subject.status",
				undoGroup: false,
				timeoutMs: 3e4
			});
			return r.ok ? r.result : {
				ok: false,
				error: r.error ?? "subject.status failed"
			};
		},
		async render(renderArgs) {
			const out = await renderFrameTool.handler(renderArgs, transport);
			const sc = out.structuredContent;
			if (out.isError) return {
				ok: false,
				error: sc?.error?.message ?? sc?.error ?? "ae_render_frame failed",
				details: sc
			};
			return sc?.result ?? {
				ok: false,
				error: "ae_render_frame returned no result"
			};
		},
		async readImage(file) {
			return decodePng(await promises.readFile(file));
		},
		async unbuild(a) {
			const r = await transport.execute({
				code: fillUnbuildJsx(a),
				label: "subject.fill_gaps undo",
				undoGroup: true,
				suppressDialogs: true,
				timeoutMs: 6e4
			});
			return r.ok ? r.result : {
				ok: false,
				error: r.error ?? "undoing the build failed"
			};
		},
		async build(a) {
			const r = await transport.execute({
				code: fillBuildJsx(a),
				label: "subject.fill_gaps",
				undoGroup: true,
				suppressDialogs: true,
				rollback: true,
				timeoutMs: 6e4
			});
			return r.ok ? r.result : {
				ok: false,
				error: r.error ?? "the build failed",
				rollback: r.rollback
			};
		}
	};
}
function fileCompJsx(args) {
	return `
            var _item = null;
            var _imported = false;
            if (${jsxVal(args.item)} !== null) {
                _item = AE.safeGet(function () { return app.project.itemByID(${jsxVal(args.item)}); }, null);
                if (!_item) return { ok: false, error: "no project item with id " + ${jsxVal(args.item)} };
            } else {
                var _f = new File(${jsxVal(args.path)});
                if (!_f.exists) return { ok: false, error: "no file at " + ${jsxVal(args.path)} };
                _item = app.project.importFile(new ImportOptions(_f));
                _imported = true;
            }
            if (!AE.safeGet(function () { return _item.hasVideo; }, false)) return { ok: false, error: "'" + _item.name + "' has no video" };
            var _fr = AE.safeGet(function () { return _item.frameRate; }, 0) || 30;
            var _dur = _item.duration;
            var _c = app.project.items.addComp("check_file " + _item.name, _item.width, _item.height, AE.safeGet(function () { return _item.pixelAspect; }, 1) || 1, _dur, _fr);
            _c.layers.add(_item);
            return { ok: true, compId: _c.id, compName: _c.name, itemId: _item.id, itemName: _item.name, imported: _imported,
                width: _item.width, height: _item.height, frames: Math.round(_dur * _fr), frameRate: _fr };
        `;
}
function fileCleanupJsx(args) {
	return `
            var _removed = [];
            var _c = AE.safeGet(function () { return app.project.itemByID(${jsxVal(args.compId)}); }, null);
            if (_c) { var _cn = _c.name; _c.remove(); _removed.push(_cn); }
            var removeItem = ${jsxVal(args.removeItem)};
            if (removeItem && ${jsxVal(args.itemId)} !== null) {
                var _it = AE.safeGet(function () { return app.project.itemByID(${jsxVal(args.itemId)}); }, null);
                if (_it) { var _in = _it.name; _it.remove(); _removed.push(_in); }
            }
            return { ok: true, removed: _removed };
        `;
}
function liveFileIO(transport) {
	const cut = liveCutoutIO({}, transport);
	return {
		render: cut.render,
		readImage: cut.readImage,
		async execute(code, opts) {
			const r = await transport.execute({
				code,
				label: opts.label,
				timeoutMs: opts.timeoutMs,
				undoGroup: opts.undoGroup ?? true,
				suppressDialogs: true
			});
			return r.ok ? r.result : {
				ok: false,
				error: r.error ?? `${opts.label} failed`
			};
		},
		exists: (file) => promises.access(file).then(() => true, () => false)
	};
}
var compLayerParams, FX_ROOT_JSX, OBJECT_MATTE_MATCH_NAME, OBJECT_MATTE_SELECTIONS_MATCH_NAME, SUBJECT_WHOLE_PIECE_NOTE, CLOSE_CLICK_SHARE, COUNT_NOTE, NEED_CLICK, subjectIndexParam, CUTOUT_HOLE_LIMIT, CUTOUT_OVER, CUTOUT_SECONDS_PER_FRAME, SETTLE_MAX_MS, THUMB, PICTURE_DEFLATE, intersects, union, fmt, boxText, plural, boxArea, iou, isFrozenEntry, GB, gb, PICTURE_MARGIN_BYTES, captureBytes, PART_NAMES, trackedSpan, FROZEN_DEFAULTS, frozenOpts, renderTally, pixelTally, since, roundTally, needSelection, perFrameMsOf, regionsOf, NODE_ONLY, overParam, SOFT_EDGE_DEFAULTS;
function init_keying_shared() {
	return (init_keying_shared = __esmMin((() => {
		init_matte();
		init_png16();
		init_sheet();
		init_registry();
		init_render_frame();
		compLayerParams = [{
			name: "comp",
			type: "any",
			description: "Comp name or id",
			required: true
		}, {
			name: "layer",
			type: "any",
			description: "1-based layer index, or the layer name",
			required: true
		}];
		FX_ROOT_JSX = `
            var _fxRoot = _layer.property("ADBE Effect Parade");
            if (!_fxRoot) return { ok: false, error: "layer '" + _layer.name + "' cannot carry effects" };
`;
		OBJECT_MATTE_MATCH_NAME = "ADBE Samurai";
		OBJECT_MATTE_SELECTIONS_MATCH_NAME = "ADBE Samurai Strokes Group";
		SUBJECT_WHOLE_PIECE_NOTE = "For a whole piece, scale the take to delivery size first (a delivery-size copy of the footage, before the click: sourceAdvice), then render the cut-out in halves, emptying After Effects' disk cache between them: two halves of a 43.5 s piece at 1088 x 1920 took about 4.3 minutes and 12 GB of cache each. Check free disk space before each half. subject.render_cutout takes from and to (comp seconds) for each half; join the halves with a stream copy (HALVES_JOIN_NOTE).";
		CLOSE_CLICK_SHARE = .05;
		COUNT_NOTE = "A selection count is not a check: it does not say what was selected. Run subject.check and look at its picture before building anything on the cut-out.";
		NEED_CLICK = "run subject.prepare and ask the user for the click, relaying its steps word for word";
		subjectIndexParam = {
			name: "effectIndex",
			type: "number",
			description: "1-based index of the Object Matte to use when the layer has several (it must be Object Matte, ADBE Samurai). Default: the first in the stack.",
			required: false
		};
		CUTOUT_HOLE_LIMIT = 1e3;
		CUTOUT_OVER = "#ff00ff";
		CUTOUT_SECONDS_PER_FRAME = 60;
		SETTLE_MAX_MS = 6e5;
		THUMB = 360;
		PICTURE_DEFLATE = 1;
		intersects = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
		union = (a, b) => {
			const x = Math.min(a.x, b.x);
			const y = Math.min(a.y, b.y);
			return {
				x,
				y,
				width: Math.max(a.x + a.width, b.x + b.width) - x,
				height: Math.max(a.y + a.height, b.y + b.height) - y
			};
		};
		fmt = (n) => Math.round(n).toLocaleString("en-US");
		boxText = (b) => `(${b.x}, ${b.y}, ${b.width} \xD7 ${b.height})`;
		plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
		boxArea = (b) => b.width * b.height;
		iou = (a, b) => {
			const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
			const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
			if (w <= 0 || h <= 0) return 0;
			const inter = w * h;
			return inter / (boxArea(a) + boxArea(b) - inter);
		};
		isFrozenEntry = (e) => !("box" in e) && e.kind === "frozen";
		GB = 1e9;
		gb = (n) => `${(n / GB).toFixed(1)} GB`;
		PICTURE_MARGIN_BYTES = 1 * GB;
		captureBytes = (size) => (Array.isArray(size) ? size[0] * size[1] : 2073600) * 4;
		PART_NAMES = {
			movie: "the movie",
			cache: "After Effects' disk cache",
			pictures: "captures and pictures"
		};
		trackedSpan = (frames) => frames.length ? Math.max(...frames) - Math.min(...frames) + 1 : 0;
		FROZEN_DEFAULTS = {
			gap: 30,
			limit: .002,
			minFrames: 60
		};
		frozenOpts = (args) => ({
			gap: typeof args.frozenGap === "number" ? args.frozenGap : FROZEN_DEFAULTS.gap,
			limit: typeof args.frozenLimit === "number" ? args.frozenLimit : FROZEN_DEFAULTS.limit,
			minFrames: typeof args.frozenFrames === "number" ? args.frozenFrames : FROZEN_DEFAULTS.minFrames
		});
		renderTally = () => ({
			frames: 0,
			calls: 0,
			ms: 0,
			aeCallMs: 0,
			settleMs: 0,
			renderNodeMs: 0
		});
		pixelTally = () => ({
			frames: 0,
			readMs: 0,
			regionsMs: 0,
			picturesMs: 0,
			sheetMs: 0,
			ms: 0
		});
		since = (t) => performance.now() - t;
		roundTally = (t) => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, typeof v === "number" ? Math.round(v) : v]));
		needSelection = (st) => {
			if (!st?.objectMatte?.present || !Array.isArray(st.selections) || st.selections.length === 0) return `${st?.summary ?? "no selection"}; ${NEED_CLICK}`;
			return null;
		};
		perFrameMsOf = (args) => Math.max(1, Math.round((typeof args.secondsPerFrame === "number" && args.secondsPerFrame > 0 ? args.secondsPerFrame : 60) * 1e3));
		regionsOf = (r) => [...(r.holes ?? []).map((x) => ({
			...x,
			kind: "hole"
		})), ...(r.openings ?? []).map((x) => ({
			...x,
			kind: "opening"
		}))];
		NODE_ONLY = (name) => jsxFail(`${name} runs in Node (it reads pixels), so it cannot ride inside batch.run; call it through ae_do`);
		overParam = {
			name: "over",
			type: "string",
			description: `The flat colour of the picture (default '${CUTOUT_OVER}').`,
			required: false
		};
		SOFT_EDGE_DEFAULTS = {
			radius: 8,
			smooth: 0,
			chatterReduction: 2,
			decontaminate: true,
			feather: 60,
			regionDepth: .12,
			/** By default the check samples the click frame and every `nearStep`th frame after it, up to `near` frames on. */
			near: 60,
			nearStep: 10,
			/** The closing check: a pixel solid in the matte as clicked and more than this far inside its edge must stay solid. */
			deep: 30,
			/** Matte more than this far outside the outline as clicked counts as spread (a smear). */
			outside: 10,
			/** Spread pixels allowed before the build is undone (look C left 0 to 12 px on the take; look D's smear was 156). */
			outsideLimit: 50,
			/** Face colour against the matte as clicked, CIELAB difference allowed. */
			colourLimit: 1
		};
	})))();
}

// operations/keying-key.js
function readMap(settings, extra = {}) {
	const out = { ...extra };
	for (const [k, s] of Object.entries(settings)) out[k] = s.matchName;
	return out;
}
function colourValue(name, v) {
	if (!(Array.isArray(v) && (v.length === 3 || v.length === 4) && v.every((c2) => typeof c2 === "number" && Number.isFinite(c2) && c2 >= 0 && c2 <= 1))) return `\`${name}\` must be [r, g, b] or [r, g, b, a] with each number in 0..1 (capture values); got ${JSON.stringify(v)}`;
	const c = v;
	return c.length === 3 ? [...c, 1] : [...c];
}
function settingValue(name, s, v) {
	if (s.kind === "colour") return colourValue(name, v);
	if (s.kind === "switch") {
		if (typeof v !== "boolean" && v !== 0 && v !== 1) return `\`${name}\` must be true or false`;
		return v === true || v === 1 ? 1 : 0;
	}
	if (typeof v !== "number" || !Number.isFinite(v)) return `\`${name}\` must be a number; got ${JSON.stringify(v)}`;
	return v;
}
function keylightViewNumber(v) {
	if (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= KEYLIGHT_VIEWS.length) return v;
	if (typeof v === "string") {
		const norm = v.trim().toLowerCase().replace(/[\s-]+/g, "_").replace(/color/g, "colour");
		const i = KEYLIGHT_VIEWS.indexOf(norm);
		if (i >= 0) return i + 1;
	}
	return `unknown Keylight view ${JSON.stringify(v)}; views: ${VIEW_LIST}`;
}
function keylightLookupJsx(effectIndexJsx, hint) {
	return `
            var _kl = AE.pickEffect(_fxRoot, ${jsxVal(KEYLIGHT_MATCH_NAME)}, "Keylight", ${effectIndexJsx});
            if (_kl.error) return { ok: false, error: _kl.error };
            if (_kl.index === null) return { ok: false, error: "layer '" + _layer.name + "' has no Keylight (effects: " + AE.effectListText(_fxRoot) + ")" + ${jsxVal(hint)} };
`;
}
function cleanupGroup(name, v, settings) {
	if (v === false) return { want: false };
	if (v === void 0 || v === true) return {
		want: true,
		writes: [],
		fromKeylight: false
	};
	if (typeof v !== "object" || v === null || Array.isArray(v)) return `\`${name}\` must be an object of settings, true (defaults) or false (leave it out); got ${JSON.stringify(v)}`;
	const writes = [];
	let fromKeylight = false;
	for (const [key, val] of Object.entries(v)) {
		const s = settings[key];
		if (!s) return `\`${name}.${key}\` is not a setting; settings: ${Object.keys(settings).join(", ")}`;
		if (key === "keyColor" && val === "keylight") {
			fromKeylight = true;
			continue;
		}
		const value = settingValue(`${name}.${key}`, s, val);
		if (typeof value === "string") return value;
		writes.push({
			key,
			matchName: s.matchName,
			value
		});
	}
	return {
		want: true,
		writes,
		fromKeylight
	};
}
var KEYLIGHT_MATCH_NAME, KEY_CLEANER_MATCH_NAME, SPILL_SUPPRESSOR_MATCH_NAME, VIEW_MATCH_NAME, SCREEN_COLOUR_MATCH_NAME, KEYLIGHT_VIEWS, VIEW_LIST, KEYLIGHT_SETTINGS, KEY_CLEANER_SETTINGS, SPILL_SUPPRESSOR_SETTINGS, keylightIndexParam;
function init_keying_key() {
	return (init_keying_key = __esmMin((() => {
		init_registry();
		init_keying_shared();
		KEYLIGHT_MATCH_NAME = "Keylight 906";
		KEY_CLEANER_MATCH_NAME = "ADBE KeyCleaner";
		SPILL_SUPPRESSOR_MATCH_NAME = "ADBE Spill2";
		VIEW_MATCH_NAME = "Keylight 906-0002";
		SCREEN_COLOUR_MATCH_NAME = "Keylight 906-0004";
		KEYLIGHT_VIEWS = [
			"source",
			"source_alpha",
			"corrected_source",
			"colour_correction_edges",
			"screen_matte",
			"inside_mask",
			"outside_mask",
			"combined_matte",
			"status",
			"intermediate_result",
			"final_result"
		];
		VIEW_LIST = KEYLIGHT_VIEWS.map((v, i) => `${v} (${i + 1})`).join(", ");
		KEYLIGHT_SETTINGS = {
			screenColour: {
				matchName: SCREEN_COLOUR_MATCH_NAME,
				kind: "colour",
				doc: "Screen Colour [r, g, b] 0..1, capture values: from ae_render_frame `screen` (colour.nearSubject or colour.median) on the un-keyed source"
			},
			screenGain: {
				matchName: "Keylight 906-0005",
				kind: "number",
				doc: "Screen Gain, 0..5000 (default 100)"
			},
			screenBalance: {
				matchName: "Keylight 906-0006",
				kind: "number",
				doc: "Screen Balance, 0..100 (default 50)"
			},
			despillBias: {
				matchName: "Keylight 906-0007",
				kind: "colour",
				doc: "Despill Bias [r, g, b] 0..1 (default 0.498 grey)"
			},
			alphaBias: {
				matchName: "Keylight 906-0008",
				kind: "colour",
				doc: "Alpha Bias [r, g, b] 0..1 (default 0.498 grey)"
			},
			lockBiases: {
				matchName: "Keylight 906-0009",
				kind: "switch",
				doc: "Lock Biases Together (default on)"
			},
			screenPreBlur: {
				matchName: "Keylight 906-0010",
				kind: "number",
				doc: "Screen Pre-blur, 0..5000 (default 0)"
			},
			clipBlack: {
				matchName: "Keylight 906-0012",
				kind: "number",
				doc: "Clip Black, 0..100 (default 0)"
			},
			clipWhite: {
				matchName: "Keylight 906-0013",
				kind: "number",
				doc: "Clip White, 0..100 (default 100)"
			},
			clipRollback: {
				matchName: "Keylight 906-0014",
				kind: "number",
				doc: "Clip Rollback, 0..5000 (default 0)"
			},
			screenShrinkGrow: {
				matchName: "Keylight 906-0015",
				kind: "number",
				doc: "Screen Shrink/Grow, -5000..5000 (default 0)"
			},
			screenSoftness: {
				matchName: "Keylight 906-0016",
				kind: "number",
				doc: "Screen Softness, 0..5000 (default 0)"
			},
			despotBlack: {
				matchName: "Keylight 906-0017",
				kind: "number",
				doc: "Screen Despot Black, 0..5000 (default 0)"
			},
			despotWhite: {
				matchName: "Keylight 906-0018",
				kind: "number",
				doc: "Screen Despot White, 0..5000 (default 0)"
			}
		};
		KEY_CLEANER_SETTINGS = {
			additionalEdgeRadius: {
				matchName: "ADBE KeyCleaner-0006",
				kind: "number",
				doc: "Additional Edge Radius, 0..250 (default 10)"
			},
			reduceChatter: {
				matchName: "ADBE KeyCleaner-0002",
				kind: "switch",
				doc: "Reduce Chatter (default off)"
			},
			alphaContrast: {
				matchName: "ADBE KeyCleaner-0016",
				kind: "number",
				doc: "Alpha Contrast, 0..100 (default 0)"
			},
			strength: {
				matchName: "ADBE KeyCleaner-0001",
				kind: "number",
				doc: "Strength, 0..100 (default 100)"
			}
		};
		SPILL_SUPPRESSOR_SETTINGS = {
			method: {
				matchName: "ADBE Spill2-0001",
				kind: "number",
				doc: "Method, 1 or 2 (default 1)"
			},
			suppression: {
				matchName: "ADBE Spill2-1001",
				kind: "number",
				doc: "Suppression, 0..100 (default 100)"
			},
			keyColor: {
				matchName: "ADBE Spill2-0003",
				kind: "colour",
				doc: "Key Color [r, g, b] 0..1 (default pure green), or 'keylight' for Keylight's Screen Colour"
			},
			tolerance: {
				matchName: "ADBE Spill2-0004",
				kind: "number",
				doc: "Tolerance, 0..100 (default 50)"
			},
			desaturate: {
				matchName: "ADBE Spill2-0005",
				kind: "number",
				doc: "Desaturate, 0..100 (default 50)"
			},
			spillRange: {
				matchName: "ADBE Spill2-0006",
				kind: "number",
				doc: "Spill Range, 0..100 (default 50)"
			},
			spillColorCorrection: {
				matchName: "ADBE Spill2-0007",
				kind: "number",
				doc: "Spill Color Correction, 0..100 (default 50)"
			},
			lumaCorrection: {
				matchName: "ADBE Spill2-0008",
				kind: "number",
				doc: "Luma Correction, 0..100 (default 0)"
			}
		};
		keylightIndexParam = {
			name: "effectIndex",
			type: "number",
			description: "1-based index of the Keylight to use when the layer has several (it must be Keylight). Default: the first Keylight in the stack.",
			required: false
		};
		registerOp({
			name: "key.keylight",
			category: "key",
			description: "Key a layer with Keylight from measured values: add Keylight (Keylight 906) if the layer has none, or update the one there, then read every setting back. Measure first: render the un-keyed source with ae_render_frame { screen: true } and pass colour.nearSubject (or colour.median) as screenColour. Every value is checked against After Effects' reported range before anything is written; a refusal writes nothing and removes a Keylight this call added. Returns effectIndex, added, keylightCount, written, values (view and every setting below, as read back) and the effect order. With no settings it only reads. Then look at the result with key.view (screen_matte, status) and ae_render_frame { edge: true }.",
			params: [
				...compLayerParams,
				keylightIndexParam,
				...Object.entries(KEYLIGHT_SETTINGS).map(([name, s]) => ({
					name,
					type: s.kind === "colour" ? "array" : s.kind === "switch" ? "boolean" : "number",
					description: s.doc,
					required: false
				}))
			],
			toJsx(args) {
				const writes = [];
				for (const [key, s] of Object.entries(KEYLIGHT_SETTINGS)) {
					if (args[key] === void 0) continue;
					const v = settingValue(key, s, args[key]);
					if (typeof v === "string") return jsxFail(v);
					writes.push({
						key,
						matchName: s.matchName,
						value: v
					});
				}
				return `
            ${jsxCompLayerPreamble(args)}
            ${FX_ROOT_JSX}
            var _pick = AE.pickEffect(_fxRoot, ${jsxVal(KEYLIGHT_MATCH_NAME)}, "Keylight", ${jsxVal(args.effectIndex ?? null)});
            if (_pick.error) return { ok: false, error: _pick.error };
            var _writes = ${jsxVal(writes)};
            var _idx = _pick.index;
            var _added = false;
            if (_idx === null) {
                if (!${jsxVal(args.screenColour !== void 0)}) {
                    return { ok: false, error: "layer '" + _layer.name + "' has no Keylight (effects: " + AE.effectListText(_fxRoot) + ")" + ${jsxVal("; adding one needs screenColour: measure it from the un-keyed source with ae_render_frame { screen: true } and pass colour.nearSubject or colour.median")} };
                }
                _idx = _fxRoot.addProperty(${jsxVal(KEYLIGHT_MATCH_NAME)}).propertyIndex;
                _added = true;
            }
            var _refused = AE.checkEffectWrites(_fxRoot.property(_idx), _writes);
            if (_refused.length > 0) {
                if (_added) { try { _fxRoot.property(_idx).remove(); } catch (eRm) {} }
                var _msgs = [];
                for (var _ri = 0; _ri < _refused.length; _ri++) _msgs.push(_refused[_ri].error);
                return { ok: false, error: "nothing written: " + _msgs.join("; "), refused: _refused, removedAddedKeylight: _added };
            }
            var _failed = AE.applyEffectWrites(_fxRoot.property(_idx), _writes);
            var _written = [];
            for (var _wi = 0; _wi < _writes.length; _wi++) {
                var _bad = false;
                for (var _fi = 0; _fi < _failed.length; _fi++) if (_failed[_fi].setting === _writes[_wi].key) _bad = true;
                if (!_bad) _written.push(_writes[_wi].key);
            }
            var _out = {
                ok: _failed.length === 0,
                effectIndex: _idx,
                added: _added,
                keylightCount: _pick.count + (_added ? 1 : 0),
                name: _fxRoot.property(_idx).name,
                written: _written,
                values: AE.readEffectValues(_fxRoot.property(_idx), ${jsxVal(readMap(KEYLIGHT_SETTINGS, { view: VIEW_MATCH_NAME }))}),
                order: AE.effectOrder(_fxRoot)
            };
            if (_failed.length > 0) {
                _out.failed = _failed;
                _out.error = "After Effects rejected " + _failed.length + " of the checked writes; the rest were written";
            }
            return _out;
        `;
			}
		});
		registerOp({
			name: "key.view",
			category: "key",
			description: "Set Keylight's View and report the previous one (pass previous.number back to restore it). Look at the key in screen_matte (the key's own matte, before the layer masks), combined_matte (with the masks), status (white solid, black clear, grey partly transparent) and intermediate_result (keyed, without Keylight's own despill). Use source to measure the screen with ae_render_frame { screen: true }. The view is not keyframable.",
			params: [
				...compLayerParams,
				{
					name: "view",
					type: "any",
					description: `View by name or number: ${VIEW_LIST}. Spaces, hyphens and 'color' are accepted (Screen Matte, final-result).`,
					required: true
				},
				keylightIndexParam
			],
			toJsx(args) {
				const view = keylightViewNumber(args.view);
				if (typeof view === "string") return jsxFail(view);
				return `
            ${jsxCompLayerPreamble(args)}
            ${FX_ROOT_JSX}
            ${keylightLookupJsx(jsxVal(args.effectIndex ?? null), "; add one with key.keylight")}
            var _names = ${jsxVal(KEYLIGHT_VIEWS)};
            var _viewProp = _fxRoot.property(_kl.index).property(${jsxVal(VIEW_MATCH_NAME)});
            if (!_viewProp) return { ok: false, error: "Keylight has no View property " + ${jsxVal(VIEW_MATCH_NAME)} };
            var _prev = AE.safeGet(function () { return _viewProp.value; }, null);
            var _want = ${jsxVal(view)};
            var _why = AE.checkPropertyWrite(_viewProp, _want);
            if (_why !== null) return { ok: false, error: _why };
            _viewProp.setValue(_want);
            var _now = AE.safeGet(function () { return _viewProp.value; }, null);
            return {
                ok: true,
                effectIndex: _kl.index,
                view: { number: _now, name: _names[_now - 1] || null },
                previous: { number: _prev, name: _prev === null ? null : (_names[_prev - 1] || null) }
            };
        `;
			}
		});
		registerOp({
			name: "key.cleanup",
			category: "key",
			description: "Add or update Key Cleaner (ADBE KeyCleaner) and Advanced Spill Suppressor (ADBE Spill2) after the layer's Keylight, in that order, moving existing ones into place, with their main settings (checked before writing; a refusal writes and moves nothing and removes what this call added). Adobe's intended chain is Keylight on Intermediate Result (View 10), then Key Cleaner, then Advanced Spill Suppressor: with Keylight on Final Result, Keylight has already despilled what the others receive. The caller chooses: keylightView: 'intermediate_result' sets that view; otherwise the view is left and a chainNote says so. Returns keylight {index, view}, keyCleaner and spillSuppressor {index, added, written, values} (null when left out), the effect order, and chainNote. Remove spill only after the matte is right; read edge spill on the final alpha afterwards.",
			params: [
				...compLayerParams,
				{
					name: "keyCleaner",
					type: "any",
					description: `Key Cleaner settings object, true for its defaults (the default), or false to leave it out. Settings: ${Object.entries(KEY_CLEANER_SETTINGS).map(([k, s]) => `${k} (${s.doc})`).join("; ")}.`,
					required: false
				},
				{
					name: "spillSuppressor",
					type: "any",
					description: `Advanced Spill Suppressor settings object, true for its defaults (the default), or false to leave it out. Settings: ${Object.entries(SPILL_SUPPRESSOR_SETTINGS).map(([k, s]) => `${k} (${s.doc})`).join("; ")}. Which Method value is Standard and which Ultra was not confirmed live.`,
					required: false
				},
				{
					name: "keylightView",
					type: "any",
					description: "Also set Keylight's View (name or number, as key.view); 'intermediate_result' for Adobe's intended chain.",
					required: false
				},
				{
					...keylightIndexParam,
					name: "keylightIndex"
				}
			],
			toJsx(args) {
				const kc = cleanupGroup("keyCleaner", args.keyCleaner, KEY_CLEANER_SETTINGS);
				if (typeof kc === "string") return jsxFail(kc);
				const ss = cleanupGroup("spillSuppressor", args.spillSuppressor, SPILL_SUPPRESSOR_SETTINGS);
				if (typeof ss === "string") return jsxFail(ss);
				let view = null;
				if (args.keylightView !== void 0) {
					const v = keylightViewNumber(args.keylightView);
					if (typeof v === "string") return jsxFail(`keylightView: ${v}`);
					view = v;
				}
				return `
            ${jsxCompLayerPreamble(args)}
            ${FX_ROOT_JSX}
            ${keylightLookupJsx(jsxVal(args.keylightIndex ?? null), "; key the layer with key.keylight first")}
            var _names = ${jsxVal(KEYLIGHT_VIEWS)};
            var _wantKC = ${jsxVal(kc.want)};
            var _wantSS = ${jsxVal(ss.want)};
            var _kcWrites = ${jsxVal(kc.want ? kc.writes : [])};
            var _ssWrites = ${jsxVal(ss.want ? ss.writes : [])};
            var _view = ${jsxVal(view)};
            var _track = { kl: _kl.index, kc: null, ss: null };
            var _kcAnchorOnly = false;
            var _kcFound = AE.pickEffect(_fxRoot, ${jsxVal(KEY_CLEANER_MATCH_NAME)}, "Key Cleaner", null);
            if (_wantKC) _track.kc = _kcFound.index;
            else if (_kcFound.index !== null && _kcFound.index > _kl.index) { _track.kc = _kcFound.index; _kcAnchorOnly = true; }
            if (_wantSS) _track.ss = AE.pickEffect(_fxRoot, ${jsxVal(SPILL_SUPPRESSOR_MATCH_NAME)}, "Advanced Spill Suppressor", null).index;
            if (${jsxVal(ss.want && ss.fromKeylight)}) {
                var _sc = AE.safeGet(function () { return AE.valueToJson(_fxRoot.property(_kl.index).property(${jsxVal(SCREEN_COLOUR_MATCH_NAME)}).value); }, null);
                if (!_sc) return { ok: false, error: "could not read Keylight's Screen Colour for keyColor 'keylight'" };
                _ssWrites.push({ key: "keyColor", matchName: ${jsxVal(SPILL_SUPPRESSOR_SETTINGS.keyColor.matchName)}, value: _sc });
            }
            var _kcAdded = false;
            var _ssAdded = false;
            if (_wantKC && _track.kc === null) { _track.kc = _fxRoot.addProperty(${jsxVal(KEY_CLEANER_MATCH_NAME)}).propertyIndex; _kcAdded = true; }
            if (_wantSS && _track.ss === null) { _track.ss = _fxRoot.addProperty(${jsxVal(SPILL_SUPPRESSOR_MATCH_NAME)}).propertyIndex; _ssAdded = true; }
            var _refused = [];
            if (_wantKC) _refused = _refused.concat(AE.checkEffectWrites(_fxRoot.property(_track.kc), _kcWrites));
            if (_wantSS) _refused = _refused.concat(AE.checkEffectWrites(_fxRoot.property(_track.ss), _ssWrites));
            if (_view !== null) {
                var _vw = AE.checkPropertyWrite(_fxRoot.property(_track.kl).property(${jsxVal(VIEW_MATCH_NAME)}), _view);
                if (_vw !== null) _refused.push({ setting: "keylightView", error: _vw });
            }
            if (_refused.length > 0) {
                var _drop = [];
                if (_kcAdded) _drop.push(_track.kc);
                if (_ssAdded) _drop.push(_track.ss);
                _drop.sort(function (a, b) { return b - a; });
                for (var _di = 0; _di < _drop.length; _di++) { try { _fxRoot.property(_drop[_di]).remove(); } catch (eRm) {} }
                var _msgs = [];
                for (var _ri = 0; _ri < _refused.length; _ri++) _msgs.push(_refused[_ri].error);
                return { ok: false, error: "nothing written or moved: " + _msgs.join("; "), refused: _refused };
            }
            if (_wantKC) AE.placeTrackedAfter(_fxRoot, _track, "kc", "kl");
            if (_wantSS) AE.placeTrackedAfter(_fxRoot, _track, "ss", _track.kc !== null ? "kc" : "kl");
            var _failed = [];
            if (_wantKC) _failed = _failed.concat(AE.applyEffectWrites(_fxRoot.property(_track.kc), _kcWrites));
            if (_wantSS) _failed = _failed.concat(AE.applyEffectWrites(_fxRoot.property(_track.ss), _ssWrites));
            var _viewProp = _fxRoot.property(_track.kl).property(${jsxVal(VIEW_MATCH_NAME)});
            if (_view !== null) {
                try { _viewProp.setValue(_view); } catch (eV) { _failed.push({ setting: "keylightView", error: AE.errText(eV) }); }
            }
            function _keys(ws) { var o = []; for (var i = 0; i < ws.length; i++) o.push(ws[i].key); return o; }
            var _nowView = AE.safeGet(function () { return _viewProp.value; }, null);
            var _out = {
                ok: _failed.length === 0,
                keylight: { index: _track.kl, view: { number: _nowView, name: _names[_nowView - 1] || null } },
                keyCleaner: _wantKC ? {
                    index: _track.kc,
                    added: _kcAdded,
                    written: _keys(_kcWrites),
                    values: AE.readEffectValues(_fxRoot.property(_track.kc), ${jsxVal(readMap(KEY_CLEANER_SETTINGS))})
                } : null,
                spillSuppressor: _wantSS ? {
                    index: _track.ss,
                    added: _ssAdded,
                    written: _keys(_ssWrites),
                    values: AE.readEffectValues(_fxRoot.property(_track.ss), ${jsxVal(readMap(SPILL_SUPPRESSOR_SETTINGS))})
                } : null,
                order: AE.effectOrder(_fxRoot)
            };
            if (_kcAnchorOnly) _out.keyCleanerLeftAsIs = _track.kc;
            if (_nowView !== 10) _out.chainNote = ${jsxVal("Adobe's intended chain is Keylight on Intermediate Result (10), then Key Cleaner, then Advanced Spill Suppressor; on any other view Keylight hands the cleanup effects its own output (on Final Result already despilled). Pass keylightView: 'intermediate_result' (or use key.view) for that chain.")};
            if (_failed.length > 0) {
                _out.failed = _failed;
                _out.error = "After Effects rejected " + _failed.length + " of the checked writes; the rest were written";
            }
            return _out;
        `;
			}
		});
	})))();
}

// operations/keying-reference.js
function reportForReply(r) {
	const { map: _map, ...motion } = r.motion;
	return {
		...r,
		motion
	};
}
function referenceCompJsx(args) {
	return `
            ${jsxCompPreamble(args)}
            return { ok: true, name: _comp.name, id: _comp.id, width: _comp.width, height: _comp.height,
                frames: Math.round(_comp.duration * _comp.frameRate), frameRate: _comp.frameRate };
        `;
}
async function runReferenceReport(args, io) {
	const started = performance.now();
	const outPath = args.outPath;
	if (typeof outPath !== "string" || !path$1.isAbsolute(outPath) || !/\.json$/i.test(outPath)) return {
		ok: false,
		error: "`outPath` must be an absolute path for the report (.json)"
	};
	if ([
		"path",
		"item",
		"comp"
	].filter((k) => args[k] !== void 0 && args[k] !== null).length !== 1) return {
		ok: false,
		error: "give exactly one of `path` (a still, a folder of frames or a movie), `item` (a footage item's id) or `comp` (a build)"
	};
	const regions = Array.isArray(args.regions) ? args.regions : void 0;
	const cap = typeof args.maxFrames === "number" && args.maxFrames >= 1 ? Math.floor(args.maxFrames) : 400;
	const outDir = path$1.dirname(outPath);
	await promises.mkdir(outDir, { recursive: true });
	const keepCaptures = args.keepCaptures === true;
	const perFrameMs = Math.max(1, Math.round((typeof args.secondsPerFrame === "number" && args.secondsPerFrame > 0 ? args.secondsPerFrame : 10) * 1e3));
	const pick = (n) => {
		if (n <= cap) return Array.from({ length: n }, (_, i) => i);
		const out = /* @__PURE__ */ new Set();
		for (let i = 0; i < cap; i++) out.add(Math.floor(i * n / cap));
		return [...out].sort((a, b) => a - b);
	};
	let source;
	let report;
	const renders = renderTally();
	const p = typeof args.path === "string" ? args.path : null;
	if (p !== null && !path$1.isAbsolute(p)) return {
		ok: false,
		error: "`path` must be absolute"
	};
	const stat = p !== null ? await promises.stat(p).catch(() => null) : null;
	const viaAe = args.via === "after-effects";
	const movieInfo = p !== null && MOVIE_EXT.test(p) && !viaAe && stat ? await probeVideo(p) : null;
	const colour = movieInfo && !("error" in movieInfo) ? await movieColour(p) : null;
	if (p !== null && movieInfo && !("error" in movieInfo) && colour) {
		const idx = pick(movieInfo.frames);
		const reader = referenceReader({
			total: idx.length,
			regions,
			frameRate: movieInfo.nominalFps
		});
		for await (const fr of movieFrames(movieInfo, idx, colour)) reader.add({
			img: fr.img,
			frame: fr.frame,
			time: fr.time
		});
		report = reader.finish();
		source = {
			kind: "movie",
			path: p,
			via: "ffmpeg",
			frames: movieInfo.frames,
			read: idx.length,
			frameRate: movieInfo.nominalFps,
			colour: {
				matrix: colour.matrix,
				range: colour.range,
				tags: colour.tags,
				assumed: colour.assumed,
				reading: colour.reading
			}
		};
	} else if (p !== null && !MOVIE_EXT.test(p)) {
		if (!stat) return {
			ok: false,
			error: `nothing at ${p}`
		};
		const files = stat.isDirectory() ? (await promises.readdir(p)).filter((f) => /\.png$/i.test(f)).sort(naturalOrder).map((f) => path$1.join(p, f)) : [p];
		if (!files.length) return {
			ok: false,
			error: `no PNG frames in ${p}`
		};
		if (!files.every((f) => /\.png$/i.test(f))) return {
			ok: false,
			error: "a still must be a PNG (render other formats to PNG first)"
		};
		const idx = pick(files.length);
		const frameRate = typeof args.frameRate === "number" ? args.frameRate : void 0;
		const given = typeof args.frameStep === "number" && args.frameStep >= 1 ? Math.round(args.frameStep) : null;
		const nums = files.map((f) => {
			const m = /(\d+)(?!.*\d)/.exec(path$1.basename(f, path$1.extname(f)));
			return m ? Number(m[1]) : null;
		});
		const named = nums.every((n) => n !== null) && nums.every((n, i) => i === 0 || n > nums[i - 1]);
		const numberOf = (i) => given !== null ? i * given : named ? nums[i] : i;
		const steps = idx.slice(1).map((i, k) => numberOf(i) - numberOf(idx[k]));
		const even = steps.length > 0 && steps.every((d) => d === steps[0]) ? steps[0] : null;
		const spacing = given !== null ? {
			how: "given",
			step: idx.length < files.length ? null : given
		} : named ? {
			how: "file names",
			step: even
		} : {
			how: "assumed",
			step: even
		};
		const reader = referenceReader({
			total: idx.length,
			regions,
			frameRate,
			spacing
		});
		for (const i of idx) {
			const n = numberOf(i);
			reader.add({
				img: await io.readImage(files[i]),
				frame: n,
				time: frameRate ? n / frameRate : void 0
			});
		}
		report = reader.finish();
		source = {
			kind: stat.isDirectory() ? "frames" : "still",
			path: p,
			files: files.length,
			read: idx.length,
			frameRate: frameRate ?? null
		};
	} else {
		const cm = await io.execute("return { ok: true, workingSpace: String(AE.safeGet(function () { return app.project.workingSpace; }, 'None')), colorManagementSystem: AE.safeGet(function () { return Number(app.project.colorManagementSystem); }, null), bitsPerChannel: app.project.bitsPerChannel };", {
			label: "reference.report colour",
			timeoutMs: 3e4,
			undoGroup: false
		});
		if (cm?.ok && cm.workingSpace && cm.workingSpace !== "None" && cm.workingSpace !== "" && cm.colorManagementSystem !== 1) return {
			ok: false,
			error: `${iccManagedReason(cm.workingSpace, cm.bitsPerChannel)} reference.report reads colour, levels, grain and sharpness from rendered frames, so it does not run here. A PNG still or a folder of frames is read without After Effects and still works.`
		};
		const fromComp = args.comp !== void 0;
		const setup = fromComp ? await io.execute(referenceCompJsx({ comp: args.comp }), {
			label: "reference.report comp",
			timeoutMs: 6e4,
			undoGroup: false
		}) : await io.execute(fileCompJsx({
			path: p,
			item: typeof args.item === "number" ? args.item : null
		}), {
			label: "reference.report setup",
			timeoutMs: 12e4,
			undoGroup: true
		});
		if (!setup?.ok) return {
			ok: false,
			error: setup?.error ?? "could not read the source in After Effects",
			setup
		};
		const compRef = fromComp ? args.comp : setup.compId;
		let cleanup = null;
		try {
			const roomless = await spaceRefusal(io, outDir, 40 * captureBytes([setup.width, setup.height]), PICTURE_MARGIN_BYTES, "this reference report");
			if (roomless) return roomless;
			const idx = pick(setup.frames);
			const reader = referenceReader({
				total: idx.length,
				regions,
				frameRate: setup.frameRate
			});
			const size = Math.max(1, Math.min(32, Math.floor(SETTLE_MAX_MS / perFrameMs)));
			for (let b = 0; b * size < idx.length; b++) {
				const chunk = idx.slice(b * size, (b + 1) * size);
				const got = await renderChunked(io, { compNameOrId: compRef }, chunk, perFrameMs, outDir, "reference", renders, b);
				for (const r of got) {
					if (!r.ok || !r.file) return {
						ok: false,
						error: `frame ${r.frame} did not render: ${r.error ?? "no file"}`
					};
					reader.add({
						img: await io.readImage(r.file),
						frame: r.frame,
						time: r.frame / setup.frameRate
					});
					if (!keepCaptures) await promises.rm(r.file, { force: true });
				}
			}
			report = reader.finish();
		} finally {
			if (!fromComp) cleanup = await io.execute(fileCleanupJsx({
				compId: setup.compId,
				itemId: setup.itemId,
				removeItem: setup.imported === true
			}), {
				label: "reference.report cleanup",
				timeoutMs: 6e4,
				undoGroup: true
			});
		}
		source = fromComp ? {
			kind: "comp",
			name: setup.name,
			frames: setup.frames,
			frameRate: setup.frameRate
		} : {
			kind: p !== null ? "movie" : "item",
			path: p,
			item: setup.itemName,
			frames: setup.frames,
			frameRate: setup.frameRate,
			cleanup
		};
	}
	let rhythm = null, rhythmNote = null;
	if (args.rhythm === true) {
		if (p !== null && MOVIE_EXT.test(p)) {
			const r = await measureRhythm(p);
			if ("error" in r) rhythmNote = `The rhythm was not measured: ${r.error}`;
			else rhythm = r;
		} else rhythmNote = "The rhythm is measured on a movie only (video.census and video.shots read it): render the build to a file and report that.";
	}
	await promises.writeFile(outPath, JSON.stringify(rhythm ? {
		...report,
		rhythm
	} : report));
	let compare;
	if (typeof args.against === "string") try {
		const against = JSON.parse(await promises.readFile(args.against, "utf8"));
		compare = isSheet(against) ? compareWithSheet(against, {
			report,
			rhythm
		}) : compareReferences(against, report);
	} catch (e) {
		compare = { error: `could not compare with ${args.against}: ${e instanceof Error ? e.message : String(e)}` };
	}
	const reply = reportForReply(report);
	return {
		ok: true,
		source,
		frames: report.frames,
		report: reply,
		savedTo: outPath,
		...compare ? { compare } : {},
		notes: [
			...report.notes,
			...rhythmNote ? [rhythmNote] : [],
			...source.kind !== "frames" && source.kind !== "still" && !report.motion.consecutive && report.frames > 1 ? [`Only ${report.frames} frames spread over the source were read (maxFrames ${cap}), so cuts and motion were not.`] : []
		],
		...rhythm ? { rhythm } : {},
		timing: {
			render: roundTally(renders),
			totalMs: Math.round(since(started))
		},
		next: compare ? "Read the differences largest first and decide which to fix; measure again after each fix." : "Run the same report on the build (comp) with against: this file's path, or reference.compare with two saved reports."
	};
}
async function runReferenceCompare(args) {
	const read = async (k) => {
		const v = args[k];
		if (typeof v !== "string" || !path$1.isAbsolute(v)) throw new Error(`\`${k}\` must be the absolute path of a saved report`);
		return JSON.parse(await promises.readFile(v, "utf8"));
	};
	try {
		const ref = await read("reference");
		const build = await read("build");
		if (isSheet(ref)) {
			const piece = isPiece(build) ? build : {
				report: build,
				rhythm: build.rhythm ?? null,
				type: null
			};
			return compareWithSheet(ref, piece);
		}
		if (isSheet(build)) return {
			ok: false,
			error: "`build` is a look sheet: give the sheet as `reference` and the build's saved report as `build`"
		};
		return {
			ok: true,
			...compareReferences(ref, isPiece(build) ? build.report : build)
		};
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : String(e)
		};
	}
}
var MOVIE_EXT, naturalOrder;
function init_keying_reference() {
	return (init_keying_reference = __esmMin((() => {
		init_look();
		init_sheet();
		init_registry();
		init_capture_shared();
		init_movie_rgb();
		init_rhythm();
		init_keying_shared();
		MOVIE_EXT = /\.(mov|mp4|m4v|mxf|avi|webm|mkv|mpe?g)$/i;
		naturalOrder = (a, b) => a.localeCompare(b, void 0, { numeric: true });
		registerOp({
			name: "reference.report",
			category: "look",
			description: "Measure a reference, or a build, for working to it. Give exactly one source: `path` (a PNG still, a folder of PNG frames in name order, or a movie), `item` (a footage item's id) or `comp` (the build). Stills and folders are read in Node; a movie is decoded by ffmpeg in Node when ffmpeg is installed (its YUV-to-RGB matrix and range read from the file's tags, Rec. 709 video range assumed where a tag is missing, and the reply says which; checked against After Effects' own render of the same 400 frames of five delivered 1080 x 1920 reels: levels within 0.0013, CIELAB within 0.04, edge width and grain within 0.02), else, like an item, brought into a throwaway comp and, like a comp, rendered through ae_render_frame by frame numbers (a quarter of a frame inside each frame, so no time lands on the frame before; checked live at 30, 29.97 and 24 fps), read and removed a chunk at a time. Reports the main colours and their shares (k-means in CIELAB), black and white points and mean, CIELAB colour, edge width (sharpness) and grain at the grid's nine regions (top left to bottom right) and any named `regions`, where the weight of the frame sits (centres of brightness and of detail), and on consecutive frames the cuts, the mean change between frames and where the picture moves (a motion map; its centre is the moving subject in a talking-head shot). Colour and texture are read on 24 frames spread over the source, motion on every pair. Saves the whole report as JSON at `outPath` (the reply leaves the motion map out). With `against` (a saved report of the reference) it adds `compare`: the differences largest first, each over a step (a CIELAB a* or b* of 2 is a cast, a quarter in edge width or grain, 5% in the subject's size, 3% of the frame in a place), in words. The subject's size and place are compared by lining up the two motion maps, only when they match as the same footage. Measured live (After Effects 27.0): 235 frames of a 1080 x 1920 H.264 movie in 314 s, and of a comp in 317 s, nothing added to the disk cache. A comp renders without the compression noise of a delivered movie, so against a movie reference its grain reads lower: compare like with like where grain matters.",
			params: [
				{
					name: "path",
					type: "string",
					description: "Absolute path of a PNG still, a folder of PNG frames, or a movie.",
					required: false
				},
				{
					name: "item",
					type: "number",
					description: "A footage item's id, instead of path.",
					required: false
				},
				{
					name: "comp",
					type: "string",
					description: "A comp (the build), by name or id, instead of path.",
					required: false
				},
				{
					name: "outPath",
					type: "string",
					description: "Absolute path for the report (.json). Captures are written beside it and removed once read.",
					required: true
				},
				{
					name: "regions",
					type: "array",
					description: "Named regions in frame pixels, read beside the grid's nine ({ name, x, y, width, height, role? }); name the parts you mean (a wall, the subject's face, a neutral headrest) so the differences say them.",
					required: false
				},
				{
					name: "against",
					type: "string",
					description: "A saved report (the reference), or a look sheet (reference.sheet's sheet.json), to compare this one with. Against a sheet, only the measures of the user's look are compared, each against their own range and the number of pieces it rests on.",
					required: false
				},
				{
					name: "via",
					type: "string",
					description: "How a movie is read: 'ffmpeg' (the default when ffmpeg is installed: decoded in Node, no After Effects) or 'after-effects' (rendered frame by frame).",
					required: false
				},
				{
					name: "rhythm",
					type: "boolean",
					description: "Also measure a movie's rhythm (video.census over the whole movie and video.shots: calm, local and travel shares, travel moves a minute, calm runs, bursts, shot lengths, cuts a minute), kept in the saved report so a look sheet can compare it.",
					required: false
				},
				{
					name: "frameRate",
					type: "number",
					description: "Frames per second of a folder of frames (for times).",
					required: false
				},
				{
					name: "frameStep",
					type: "number",
					description: "How many frames apart a folder's files are (1: neighbours). Without it the step is read from numbers in the file names; with none, the files are taken as neighbours unless neighbouring files change by a median of 0.02 or more, as frames far apart do (a guess, said in notes). Cuts and movement are read only on neighbours.",
					required: false
				},
				{
					name: "maxFrames",
					type: "number",
					description: `Most frames read (default ${400}); beyond it frames are spread and cuts and motion are not read.`,
					required: false
				},
				{
					name: "secondsPerFrame",
					type: "number",
					description: "Render time allowed a frame (default 10).",
					required: false
				},
				{
					name: "keepCaptures",
					type: "boolean",
					description: "Keep the rendered frames (default false).",
					required: false
				}
			],
			toJsx: () => NODE_ONLY("reference.report"),
			run: (args, transport) => runReferenceReport(args, liveFileIO(transport))
		});
		registerOp({
			name: "reference.compare",
			category: "look",
			readOnly: true,
			description: "Compare two saved reference reports (reference.report's outPath): every difference over its step, largest first, in words (cast, lightness, sharpness, grain, levels, the moving subject's size and place, where the weight sits, main colours missing, cuts, motion). `reference` may be a look sheet (reference.sheet): then only the measures of the user's look are compared, each against their own range ('black point 0.09; your pieces sit between 0.02 and 0.04 (4 pieces)'); inside the range, or within one step of it, is no difference. No pass or fail. Node only; no After Effects.",
			params: [{
				name: "reference",
				type: "string",
				description: "Absolute path of the reference's saved report, or of a look sheet (sheet.json).",
				required: true
			}, {
				name: "build",
				type: "string",
				description: "Absolute path of the build's saved report (with its rhythm when reference.report measured it), or of a piece a sheet saved.",
				required: true
			}],
			toJsx: () => NODE_ONLY("reference.compare"),
			run: (args) => runReferenceCompare(args)
		});
	})))();
}

// operations/batch.js
function denialText(denial) {
	return denial.hint ? `${denial.message} \u2014 ${denial.hint}` : denial.message;
}
function rejectBlock(index, message, stopOnError) {
	return `
                if (!_stopped) {
                    _failed++;
                    _results.push({ ok: false, error: ${jsxVal(message)}, index: ${index} });
                    ${stopOnError ? `_stopped = true; _stoppedAt = ${index};` : ""}
                } else {
                    _results.push({ skipped: true });
                }
            `;
}
function init_batch() {
	return (init_batch = __esmMin((() => {
		/* @__PURE__ */ init_opschema();
		init_policy();
		init_registry();
		registerOp({
			name: "batch.run",
			category: "batch",
			description: "Execute multiple operations in a single IPC call (~400ms total instead of 400ms × N). Operations run sequentially inside ONE undo group — a single Ctrl+Z reverts the whole batch, however many ops it contained. That group is also why undo/redo children (project.undo, command.execute id 16/2035) are rejected here: call those as their own ae_do. If one fails, subsequent ops still run unless stopOnError. With stopOnError, a failure rolls the WHOLE batch back (one undo, issued before the response, reported in details.rollback) and still returns every child's result; pass rollback: false to keep the operations that ran before the failure instead — the result's `kept` says which. Without stopOnError nothing is rolled back: the other children's changes stand. Results array matches input order; the response reports how many failed. Mix in read/verify children — comp.info, layer.info, render.frame — to mutate AND verify in the same call, e.g. [...mutations, { operation: 'render.frame', args: { … } }].",
			params: [
				{
					name: "ops",
					type: "array",
					description: "Array of { operation, args } objects, e.g. [{ \"operation\": \"layer.create_solid\", \"args\": { \"comp\": \"Main\", \"color\": [1,0,0] } }]",
					required: true
				},
				{
					name: "stopOnError",
					type: "boolean",
					description: "Stop at the first failing op (default false). The batch is then rolled back as a whole unless rollback is false.",
					required: false
				},
				{
					name: "rollback",
					type: "boolean",
					description: "Default true. With stopOnError, revert the whole batch when an op fails, and revert it if the batch itself throws. false keeps whatever ran before the failure (for deliberately incremental work); the result's `kept` names it.",
					required: false
				},
				{
					name: "acceptRenderQueueRisk",
					type: "boolean",
					description: "Default false. After a scripted render-queue change in this After Effects session, undo is refused (After Effects 2027 has gone into crash recovery on undo after such changes — observed twice; a precaution). Pass true only when the user accepts that risk, ideally after saving.",
					required: false
				}
			],
			readOnly: true,
			rollback: (args) => args.rollback !== false,
			toJsx(args) {
				if (!Array.isArray(args.ops)) return `
                return { ok: false, error: "ops must be an array" };
            `;
				const ops = args.ops;
				const stopOnError = !!args.stopOnError;
				const rollback = args.rollback !== false;
				const opBlocks = [];
				for (let i = 0; i < ops.length; i++) {
					const entry = ops[i];
					const opName = entry && typeof entry === "object" && typeof entry.operation === "string" ? entry.operation : void 0;
					const op = opName !== void 0 ? getOp(opName) : void 0;
					if (!op) {
						const withheld = opName !== void 0 ? denyUnregisteredOperation(opName) : null;
						opBlocks.push(rejectBlock(i, withheld ? denialText(withheld) : `unknown operation: ${String(opName)}`, stopOnError));
						continue;
					}
					const denial = denyOperation(op);
					if (denial) {
						opBlocks.push(rejectBlock(i, denialText(denial), stopOnError));
						continue;
					}
					const validated = validateOpArgs(op, entry.args);
					if (!validated.ok) {
						const detail = `invalid arguments for '${op.name}': ` + validated.issues.map((issue) => `${issue.path} \u2014 ${issue.message}`).join("; ") + ` (expects ${summarizeParams(op.params).join(", ") || "no parameters"})`;
						opBlocks.push(rejectBlock(i, detail, stopOnError));
						continue;
					}
					const consent = denyAppConfig(op, validated.value);
					if (consent) {
						opBlocks.push(rejectBlock(i, consent, stopOnError));
						continue;
					}
					if (!wantsUndoGroup(op, validated.value)) {
						opBlocks.push(rejectBlock(i, `'${op.name}' cannot run inside batch.run \u2014 the batch is one undo group and undo/redo must not run inside one. Call it as its own ae_do.`, stopOnError));
						continue;
					}
					const prepared = prepareOp(op, validated.value);
					if (!prepared.ok) {
						opBlocks.push(rejectBlock(i, `'${op.name}': ${prepared.error}`, stopOnError));
						continue;
					}
					const jsx = op.toJsx(prepared.args);
					opBlocks.push(`
                if (!_stopped) {
                    try {
                        var _r${i} = (function() { ${jsx} })();
                        if (_r${i} && _r${i}.ok === false) { _failed++; ${stopOnError ? `_stopped = true; _stoppedAt = ${i};` : ""} }
                        _results.push(_r${i});
                    } catch(e) {
                        _failed++;
                        _results.push({ ok: false, error: AE.errText(e) });
                        ${stopOnError ? `_stopped = true; _stoppedAt = ${i};` : ""}
                    }
                } else {
                    _results.push({ skipped: true });
                }
            `);
				}
				return `
            var _results = [];
            var _failed = 0;
            var _stopped = false;
            var _stoppedAt = -1;
            ${opBlocks.join("\n")}
            var _kept = null;
            var _rollbackRequested = false;
            if (_stopped) {
                if (${rollback ? "true" : "false"} && typeof __mcp !== "undefined" && __mcp && __mcp.requestRollback) {
                    // serve.jsx reverts the whole request after this returns.
                    __mcp.requestRollback("batch.run stopped at operation " + _stoppedAt);
                    _rollbackRequested = true;
                } else {
                    if (_stoppedAt === 0) _kept = "nothing ran before it";
                    else if (_stoppedAt === 1) _kept = "operation 0 ran and was kept";
                    else _kept = "operations 0 to " + (_stoppedAt - 1) + " ran and were kept";
                    _kept += "; operation " + _stoppedAt + " failed (any change it made before failing was kept too)" +
                        "; the operations after it were skipped";
                }
            }
            return {
                ok: _failed === 0,
                error: _failed === 0 ? null : (_failed + " of " + _results.length + " operations failed" +
                    (_rollbackRequested ? "; the batch is being rolled back (stopOnError)" : "")),
                results: _results,
                count: _results.length,
                failed: _failed,
                stoppedAt: _stopped ? _stoppedAt : null,
                rollbackRequested: _rollbackRequested,
                kept: _kept
            };
        `;
			}
		});
	})))();
}

// operations/inspect.js
function init_inspect() {
	return (init_inspect = __esmMin((() => {
		init_config();
		init_registry();
		init_snippets();
		registerOp({
			name: "comp.info",
			category: "comp",
			description: "Comp details + per-layer summaries (same payload as ae_comp_info). As a batch.run child, lets the same call verify what a preceding mutation did.",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}],
			readOnly: true,
			toJsx(args) {
				return `
            ${COMP_INFO_FN}
            ${jsxCompPreamble(args)}
            return _compInfo(_comp);
        `;
			}
		});
		registerOp({
			name: "layer.info",
			category: "layer",
			description: "Full layer info incl. property trees and keyframes (same payload as ae_layer_info). Layer by 1-based index or name. detail='summary' drops default-value properties; includeProperties=false skips the tree entirely.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index or layer name",
					required: true
				},
				{
					name: "includeProperties",
					type: "boolean",
					description: "Walk the full property tree (default true)",
					required: false,
					default: true
				},
				{
					name: "detail",
					type: "string",
					description: "full|summary — 'summary' omits properties still at their default value (default full)",
					required: false,
					default: "full"
				}
			],
			readOnly: true,
			toJsx(args) {
				return `
            ${LAYER_FULL_FN}
            ${jsxCompLayerPreamble(args)}
            return _layerFull(_layer, ${jsxVal(args.includeProperties !== false)}, ${jsxVal(args.detail ?? "full")});
        `;
			}
		});
		registerOp({
			name: "render.frame",
			category: "render",
			description: "Render one frame to PNG (raw saveFrameToPng). As the LAST child of a batch.run, one call mutates and hands back visual proof. outPath must be absolute; raise ae_do's timeoutMs for slow renders. CAUTION: in color-managed projects (project.get_settings workingSpace != 'None') this writes raw working-space values that look dark/wrong — use the ae_render_frame TOOL there, which converts to display sRGB.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "time",
					type: "number",
					description: "Time in seconds to render",
					required: true
				},
				{
					name: "outPath",
					type: "string",
					description: "Absolute path for the PNG (parent directories are created)",
					required: true
				},
				{
					name: "useDisplayStartTime",
					type: "boolean",
					description: "Interpret `time` relative to comp.displayStartTime (default false)",
					required: false
				}
			],
			readOnly: true,
			toJsx(args) {
				const raw = String(args.outPath);
				if (!path$1.isAbsolute(raw)) return `
            return { ok: false, error: ${jsxVal(`outPath must be absolute, got: ${raw}`)} };
        `;
				const rejection = rejectedOutputPath(raw);
				if (rejection !== null) return `
            return { ok: false, error: ${jsxVal(rejection)} };
        `;
				const abs = path$1.resolve(raw).replace(/\\/g, "/");
				return `
            ${RENDER_FRAME_FN}
            ${jsxCompPreamble(args)}
            return _renderFrame(_comp, ${jsxVal(args.time)}, ${jsxVal(abs)}, ${jsxVal(!!args.useDisplayStartTime)});
        `;
			}
		});
	})))();
}

// operations/footage.js
function jsxFootagePreamble(args) {
	return `
        var _item = AE.findItem(${jsxVal(args.item)});
        if (!_item) return { ok: false, error: "no project item matching " + ${jsxVal(String(args.item))} };
        if (!(_item instanceof FootageItem)) return { ok: false, error: "item '" + _item.name + "' is not a FootageItem" };
    `;
}
function init_footage() {
	return (init_footage = __esmMin((() => {
		init_registry();
		init_snippets();
		registerOp({
			name: "footage.replace",
			category: "footage",
			description: "Relink a footage item to a different file (FootageItem.replace). Layers using the item keep keyframes/effects. Pass sequence=true to relink to an image sequence.",
			params: [
				{
					name: "item",
					type: "any",
					description: "Footage item id (number) or name (string)",
					required: true
				},
				{
					name: "path",
					type: "string",
					description: "Absolute path to the new file",
					required: true
				},
				{
					name: "sequence",
					type: "boolean",
					description: "Treat path as the first file of an image sequence (default false)",
					required: false,
					default: false
				},
				{
					name: "forceAlphabetical",
					type: "boolean",
					description: "Sequence only: force alphabetical order (default false)",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxFootagePreamble(args)}
            var _f = new File(${jsxVal(args.path)});
            if (!_f.exists) return { ok: false, error: "file not found: " + ${jsxVal(args.path)} };
            if (${jsxVal(!!args.sequence)}) {
                _item.replaceWithSequence(_f, ${jsxVal(!!args.forceAlphabetical)});
            } else {
                _item.replace(_f);
            }
            return { ok: true, id: _item.id, name: _item.name, file: _item.file ? _item.file.fsName.replace(/\\\\/g, "/") : null };
        `;
			}
		});
		registerOp({
			name: "footage.interpret",
			category: "footage",
			description: "Set footage interpretation: alpha mode, frame rate conform, looping, fields, pixel aspect (FootageItem.mainSource).",
			params: [
				{
					name: "item",
					type: "any",
					description: "Footage item id (number) or name (string)",
					required: true
				},
				{
					name: "alphaMode",
					type: "string",
					description: "ignore|straight|premultiplied",
					required: false
				},
				{
					name: "premulColor",
					type: "array",
					description: "[r,g,b] 0-1 matte color for premultiplied alpha",
					required: false
				},
				{
					name: "invertAlpha",
					type: "boolean",
					description: "Invert the alpha channel",
					required: false
				},
				{
					name: "guessAlpha",
					type: "boolean",
					description: "Auto-detect the alpha interpretation first",
					required: false
				},
				{
					name: "conformFrameRate",
					type: "number",
					description: "Conform to this frame rate (0 = native)",
					required: false
				},
				{
					name: "loop",
					type: "number",
					description: "Number of times to loop the footage",
					required: false
				},
				{
					name: "fieldSeparation",
					type: "string",
					description: "off|upper|lower",
					required: false
				},
				{
					name: "highQualityFields",
					type: "boolean",
					description: "High-quality field separation",
					required: false
				},
				{
					name: "pixelAspect",
					type: "number",
					description: "Pixel aspect ratio (e.g. 1, 0.9091, 1.4587)",
					required: false
				},
				{
					name: "guessPulldown",
					type: "string",
					description: "Auto-detect pulldown first: '3:2' or '24Pa' (runs guessPulldown)",
					required: false
				},
				{
					name: "removePulldown",
					type: "string",
					description: "off|WSSWW|SSWWW|SWWWS|WWWSS|WWSSW (needs field separation on)",
					required: false
				}
			],
			toJsx(args) {
				const sets = [];
				if (args.guessPulldown !== void 0) sets.push(`
        try {
            var _gpMap = { "3:2": PulldownMethod.PULLDOWN_3_2, "24Pa": PulldownMethod.ADVANCE_24P };
            if (_gpMap.hasOwnProperty(${jsxVal(args.guessPulldown)})) { _src.guessPulldown(_gpMap[${jsxVal(args.guessPulldown)}]); }
            else { _w.push("guessPulldown: pass '3:2' or '24Pa'"); }
        } catch (e) { _w.push("guessPulldown: " + AE.errText(e)); }`);
				if (args.guessAlpha) sets.push(`try { _src.guessAlphaMode(); } catch (e) { _w.push("guessAlpha: " + AE.errText(e)); }`);
				if (args.alphaMode !== void 0) sets.push(`
        try {
            var _amMap = { "ignore": AlphaMode.IGNORE, "straight": AlphaMode.STRAIGHT, "premultiplied": AlphaMode.PREMULTIPLIED };
            if (_amMap[${jsxVal(args.alphaMode)}] === undefined) { _w.push("alphaMode: unknown value"); }
            else { _src.alphaMode = _amMap[${jsxVal(args.alphaMode)}]; }
        } catch (e) { _w.push("alphaMode: " + AE.errText(e)); }`);
				if (args.premulColor !== void 0) sets.push(`try { _src.premulColor = ${jsxVal(args.premulColor)}; } catch (e) { _w.push("premulColor: " + AE.errText(e)); }`);
				if (args.invertAlpha !== void 0) sets.push(`try { _src.invertAlpha = ${jsxVal(args.invertAlpha)}; } catch (e) { _w.push("invertAlpha: " + AE.errText(e)); }`);
				if (args.conformFrameRate !== void 0) sets.push(`try { _src.conformFrameRate = ${jsxVal(args.conformFrameRate)}; } catch (e) { _w.push("conformFrameRate: " + AE.errText(e)); }`);
				if (args.loop !== void 0) sets.push(`try { _src.loop = ${jsxVal(args.loop)}; } catch (e) { _w.push("loop: " + AE.errText(e)); }`);
				if (args.fieldSeparation !== void 0) sets.push(`
        try {
            var _fsMap = { "off": FieldSeparationType.OFF, "upper": FieldSeparationType.UPPER_FIELD_FIRST, "lower": FieldSeparationType.LOWER_FIELD_FIRST };
            if (_fsMap[${jsxVal(args.fieldSeparation)}] === undefined) { _w.push("fieldSeparation: unknown value"); }
            else { _src.fieldSeparationType = _fsMap[${jsxVal(args.fieldSeparation)}]; }
        } catch (e) { _w.push("fieldSeparation: " + AE.errText(e)); }`);
				if (args.highQualityFields !== void 0) sets.push(`try { _src.highQualityFieldSeparation = ${jsxVal(args.highQualityFields)}; } catch (e) { _w.push("highQualityFields: " + AE.errText(e)); }`);
				if (args.pixelAspect !== void 0) sets.push(`try { _item.pixelAspect = ${jsxVal(args.pixelAspect)}; } catch (e) { _w.push("pixelAspect: " + AE.errText(e)); }`);
				if (args.removePulldown !== void 0) sets.push(`
        try {
            var _rpMap = { "off": PulldownPhase.OFF, "WSSWW": PulldownPhase.WSSWW, "SSWWW": PulldownPhase.SSWWW, "SWWWS": PulldownPhase.SWWWS, "WWWSS": PulldownPhase.WWWSS, "WWSSW": PulldownPhase.WWSSW };
            if (_rpMap.hasOwnProperty(${jsxVal(args.removePulldown)})) { _src.removePulldown = _rpMap[${jsxVal(args.removePulldown)}]; }
            else { _w.push("removePulldown: unknown phase"); }
        } catch (e) { _w.push("removePulldown (needs field separation on): " + AE.errText(e)); }`);
				return `
            ${jsxFootagePreamble(args)}
            var _src = _item.mainSource;
            var _w = [];
            ${sets.join("\n")}
            return { ok: true, name: _item.name, warnings: _w };
        `;
			}
		});
		registerOp({
			name: "footage.reload",
			category: "footage",
			description: "Reload a footage item from its source file (FileSource.reload) — picks up external edits to the file without relinking.",
			params: [{
				name: "item",
				type: "any",
				description: "Footage item id (number) or name (string)",
				required: true
			}],
			toJsx(args) {
				return `
            ${jsxFootagePreamble(args)}
            var _src = _item.mainSource;
            if (!_src || typeof _src.reload !== "function") return { ok: false, error: "item '" + _item.name + "' is not file-backed footage (solids/placeholders cannot reload)" };
            try { _src.reload(); } catch (eRl) { return { ok: false, error: "reload failed: " + AE.errText(eRl) }; }
            if (AE.safeGet(function () { return _item.footageMissing; }, false)) {
                var _missingPath = AE.safeGet(function () { return _src.missingFootagePath; }, null);
                return { ok: false, id: _item.id, name: _item.name, missingPath: _missingPath,
                    error: "source media is still missing after reload" + (_missingPath ? ": " + _missingPath : "") + "; restore the file and use footage.replace to relink" };
            }
            return { ok: true, id: _item.id, name: _item.name, file: _item.file ? _item.file.fsName.replace(/\\\\/g, "/") : null };
        `;
			}
		});
		registerOp({
			name: "footage.list_missing",
			category: "footage",
			readOnly: true,
			description: "List footage items whose source file is missing (footageMissing), with the last-known path. The footage counterpart of font.list_missing.",
			params: [],
			toJsx() {
				return `
            ${LIST_MISSING_FOOTAGE_FN}
            return _listMissingFootage();
        `;
			}
		});
		registerOp({
			name: "footage.replace_with_solid",
			category: "footage",
			description: "Replace a footage item's source with a solid color (FootageItem.replaceWithSolid). Layers using the item keep keyframes/effects.",
			params: [
				{
					name: "item",
					type: "any",
					description: "Footage item id (number) or name (string)",
					required: true
				},
				{
					name: "color",
					type: "array",
					description: "[r,g,b] 0-1",
					required: true
				},
				{
					name: "name",
					type: "string",
					description: "New source name",
					required: false
				},
				{
					name: "width",
					type: "number",
					description: "Width in px (default: keep)",
					required: false
				},
				{
					name: "height",
					type: "number",
					description: "Height in px (default: keep)",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxFootagePreamble(args)}
            var _wd = ${jsxVal(args.width ?? null)};
            var _ht = ${jsxVal(args.height ?? null)};
            if (_wd === null) _wd = _item.width || 1920;
            if (_ht === null) _ht = _item.height || 1080;
            var _nm = ${jsxVal(args.name ?? null)};
            if (_nm === null) _nm = _item.name;
            try { _item.replaceWithSolid(${jsxVal(args.color)}, _nm, _wd, _ht, _item.pixelAspect || 1); } catch (eRs) { return { ok: false, error: "replaceWithSolid failed: " + AE.errText(eRs) }; }
            return { ok: true, id: _item.id, name: _item.name, width: _item.width, height: _item.height };
        `;
			}
		});
		registerOp({
			name: "footage.replace_with_placeholder",
			category: "footage",
			description: "Replace a footage item's source with a placeholder (FootageItem.replaceWithPlaceholder) — e.g. to stand in for footage that will arrive later. Layers keep keyframes/effects.",
			params: [
				{
					name: "item",
					type: "any",
					description: "Footage item id (number) or name (string)",
					required: true
				},
				{
					name: "name",
					type: "string",
					description: "Placeholder name",
					required: false
				},
				{
					name: "width",
					type: "number",
					description: "Width in px (default: keep)",
					required: false
				},
				{
					name: "height",
					type: "number",
					description: "Height in px (default: keep)",
					required: false
				},
				{
					name: "frameRate",
					type: "number",
					description: "Frame rate (default 30)",
					required: false,
					default: 30
				},
				{
					name: "duration",
					type: "number",
					description: "Duration in seconds (default: keep, or 1)",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxFootagePreamble(args)}
            var _wd = ${jsxVal(args.width ?? null)};
            var _ht = ${jsxVal(args.height ?? null)};
            if (_wd === null) _wd = _item.width || 1920;
            if (_ht === null) _ht = _item.height || 1080;
            var _du = ${jsxVal(args.duration ?? null)};
            if (_du === null) _du = _item.duration || 1;
            var _nm = ${jsxVal(args.name ?? null)};
            if (_nm === null) _nm = _item.name;
            try { _item.replaceWithPlaceholder(_nm, _wd, _ht, ${jsxVal(args.frameRate ?? 30)}, _du); } catch (eRp) { return { ok: false, error: "replaceWithPlaceholder failed: " + AE.errText(eRp) }; }
            return { ok: true, id: _item.id, name: _item.name, footageMissing: AE.safeGet(function () { return _item.footageMissing; }, null) };
        `;
			}
		});
		registerOp({
			name: "footage.set_proxy",
			category: "footage",
			description: "Set or clear a proxy on any project item (comp or footage): a file, an image sequence, a solid color, or a placeholder. Omit path/solidColor/placeholder to remove the proxy.",
			params: [
				{
					name: "item",
					type: "any",
					description: "Project item id (number) or name (string)",
					required: true
				},
				{
					name: "path",
					type: "string",
					description: "Absolute path to the proxy file — omit to remove the proxy",
					required: false,
					nullable: true
				},
				{
					name: "sequence",
					type: "boolean",
					description: "Treat path as the first file of an image sequence (default false)",
					required: false
				},
				{
					name: "solidColor",
					type: "array",
					description: "[r,g,b] 0-1 — set a solid proxy instead of a file (setProxyWithSolid)",
					required: false
				},
				{
					name: "placeholder",
					type: "boolean",
					description: "Set a placeholder proxy sized like the item (setProxyWithPlaceholder)",
					required: false
				}
			],
			toJsx(args) {
				return `
            var _item = AE.findItem(${jsxVal(args.item)});
            if (!_item) return { ok: false, error: "no project item matching " + ${jsxVal(String(args.item))} };
            if (_item instanceof FolderItem) return { ok: false, error: "folders cannot have proxies" };
            var _solid = ${jsxVal(args.solidColor ?? null)};
            if (_solid !== null) {
                try { _item.setProxyWithSolid(_solid, _item.name + " proxy", _item.width || 1920, _item.height || 1080, _item.pixelAspect || 1); } catch (ePs) { return { ok: false, error: "setProxyWithSolid failed: " + AE.errText(ePs) }; }
                return { ok: true, name: _item.name, useProxy: _item.useProxy, proxy: "solid" };
            }
            if (${jsxVal(args.placeholder === true)}) {
                try { _item.setProxyWithPlaceholder(_item.name + " proxy", _item.width || 1920, _item.height || 1080, _item.frameRate || 30, _item.duration || 1); } catch (ePp) { return { ok: false, error: "setProxyWithPlaceholder failed: " + AE.errText(ePp) }; }
                return { ok: true, name: _item.name, useProxy: _item.useProxy, proxy: "placeholder" };
            }
            var _path = ${jsxVal(args.path ?? null)};
            if (_path === null) {
                _item.setProxyToNone();
                return { ok: true, name: _item.name, proxy: null };
            }
            var _f = new File(_path);
            if (!_f.exists) return { ok: false, error: "proxy file not found: " + _path };
            if (${jsxVal(!!args.sequence)}) {
                _item.setProxyWithSequence(_f, false);
            } else {
                _item.setProxy(_f);
            }
            return { ok: true, name: _item.name, useProxy: _item.useProxy, proxy: _path };
        `;
			}
		});
	})))();
}

// operations/item.js
function init_item() {
	return (init_item = __esmMin((() => {
		init_registry();
		registerOp({
			name: "folder.create",
			category: "item",
			description: "Create a folder in the project panel, optionally inside another folder.",
			params: [{
				name: "name",
				type: "string",
				description: "Folder name",
				required: true
			}, {
				name: "parent",
				type: "any",
				description: "Parent folder id or name (default: project root)",
				required: false
			}],
			toJsx(args) {
				return `
            var _parent = AE.findFolder(${jsxVal(args.parent ?? null)});
            if (!_parent) return { ok: false, error: "no folder matching " + ${jsxVal(String(args.parent))} };
            var _folder = app.project.items.addFolder(${jsxVal(args.name)});
            if (_parent.id !== app.project.rootFolder.id) _folder.parentFolder = _parent;
            return { ok: true, id: _folder.id, name: _folder.name, parent: _parent.name };
        `;
			}
		});
		registerOp({
			name: "item.move_to_folder",
			category: "item",
			description: "Move a project item (comp, footage, or folder) into a folder. Pass folder=null for the project root.",
			params: [{
				name: "item",
				type: "any",
				description: "Item id (number) or name (string)",
				required: true
			}, {
				name: "folder",
				type: "any",
				description: "Target folder id or name — null for project root",
				required: false,
				nullable: true
			}],
			toJsx(args) {
				return `
            var _item = AE.findItem(${jsxVal(args.item)});
            if (!_item) return { ok: false, error: "no project item matching " + ${jsxVal(String(args.item))} };
            var _folder = AE.findFolder(${jsxVal(args.folder ?? null)});
            if (!_folder) return { ok: false, error: "no folder matching " + ${jsxVal(String(args.folder))} };
            if (_item.id === _folder.id) return { ok: false, error: "cannot move a folder into itself" };
            _item.parentFolder = _folder;
            return { ok: true, item: _item.name, folder: _folder.name };
        `;
			}
		});
		registerOp({
			name: "item.set_props",
			category: "item",
			description: "Set project-item properties: name, label color (0-16), comment, selected. Works on comps, footage, and folders.",
			params: [
				{
					name: "item",
					type: "any",
					description: "Item id (number) or name (string)",
					required: true
				},
				{
					name: "name",
					type: "string",
					description: "New name",
					required: false
				},
				{
					name: "label",
					type: "number",
					description: "Label color index (0-16)",
					required: false
				},
				{
					name: "comment",
					type: "string",
					description: "Comment text",
					required: false
				},
				{
					name: "selected",
					type: "boolean",
					description: "Select/deselect in project panel",
					required: false
				}
			],
			toJsx(args) {
				const sets = [];
				if (args.name !== void 0) sets.push(`try { _item.name = ${jsxVal(args.name)}; } catch (e) { _w.push("name: " + AE.errText(e)); }`);
				if (args.label !== void 0) sets.push(`try { _item.label = ${jsxVal(args.label)}; } catch (e) { _w.push("label: " + AE.errText(e)); }`);
				if (args.comment !== void 0) sets.push(`try { _item.comment = ${jsxVal(args.comment)}; } catch (e) { _w.push("comment: " + AE.errText(e)); }`);
				if (args.selected !== void 0) sets.push(`try { _item.selected = ${jsxVal(args.selected)}; } catch (e) { _w.push("selected: " + AE.errText(e)); }`);
				return `
            var _item = AE.findItem(${jsxVal(args.item)});
            if (!_item) return { ok: false, error: "no project item matching " + ${jsxVal(String(args.item))} };
            var _w = [];
            ${sets.join("\n")}
            return { ok: true, id: _item.id, name: _item.name, warnings: _w };
        `;
			}
		});
		registerOp({
			name: "item.list",
			category: "item",
			readOnly: true,
			description: "List project items, optionally filtered by folder, type, or name substring. Lighter than ae_project_info for targeted lookups.",
			params: [
				{
					name: "folder",
					type: "any",
					description: "Only items directly inside this folder (id or name)",
					required: false
				},
				{
					name: "type",
					type: "string",
					description: "CompItem|FootageItem|FolderItem",
					required: false
				},
				{
					name: "nameContains",
					type: "string",
					description: "Case-insensitive substring match on item name",
					required: false
				},
				{
					name: "limit",
					type: "number",
					description: "Max results (default 200)",
					required: false
				}
			],
			toJsx(args) {
				return `
            var _folderArg = ${jsxVal(args.folder ?? null)};
            var _folder = _folderArg === null ? null : AE.findFolder(_folderArg);
            if (_folderArg !== null && !_folder) return { ok: false, error: "no folder matching " + _folderArg };
            var _type = ${jsxVal(args.type ?? null)};
            var _needle = ${jsxVal(args.nameContains ?? null)};
            if (_needle !== null) _needle = _needle.toLowerCase();
            var _limit = ${jsxVal(args.limit ?? 200)};
            var _items = [];
            var _total = 0;
            for (var _i = 1; _i <= app.project.numItems; _i++) {
                var _it = app.project.item(_i);
                if (_folder && (!_it.parentFolder || _it.parentFolder.id !== _folder.id)) continue;
                var _summary = AE.serializeItemSummary(_it);
                if (_type !== null && _summary.type !== _type) continue;
                if (_needle !== null && _it.name.toLowerCase().indexOf(_needle) === -1) continue;
                _total++;
                if (_items.length < _limit) _items.push(_summary);
            }
            return { ok: true, total: _total, returned: _items.length, items: _items };
        `;
			}
		});
		registerOp({
			name: "item.usages",
			category: "item",
			readOnly: true,
			description: "Reverse lookup: list every comp that uses a footage item or comp (AVItem.usedIn), with the layer indices that reference it.",
			params: [{
				name: "item",
				type: "any",
				description: "Item id (number) or name (string)",
				required: true
			}],
			toJsx(args) {
				return `
            var _item = AE.findItem(${jsxVal(args.item)});
            if (!_item) return { ok: false, error: "no project item matching " + ${jsxVal(String(args.item))} };
            if (_item instanceof FolderItem) return { ok: false, error: "folders have no usages \u2014 list their contents with item.list" };
            var _comps = [];
            try { _comps = _item.usedIn; } catch (eU) { return { ok: false, error: "usedIn failed: " + AE.errText(eU) }; }
            var _out = [];
            for (var _i = 0; _i < _comps.length; _i++) {
                var _c = _comps[_i];
                var _layers = [];
                for (var _li = 1; _li <= _c.numLayers; _li++) {
                    var _srcId = null;
                    try { _srcId = _c.layer(_li).source ? _c.layer(_li).source.id : null; } catch (eS) {}
                    if (_srcId === _item.id) _layers.push(_li);
                }
                _out.push({ compId: _c.id, compName: _c.name, layerIndices: _layers });
            }
            return { ok: true, item: _item.name, itemId: _item.id, usedIn: _out, count: _out.length };
        `;
			}
		});
	})))();
}

// operations/font.js
var FONT_INFO_JSX, CT_SCRIPT_MAP_JSX;
function init_font() {
	return (init_font = __esmMin((() => {
		init_registry();
		init_snippets();
		FONT_INFO_JSX = `
    function _fontInfo(_font) {
        function _enumStr(v) {
            try { if (typeof getEnumAsString === "function") return getEnumAsString(v); } catch (eEs) {}
            try { return String(v); } catch (eS) { return null; }
        }
        var _info = {
            postScriptName: AE.safeGet(function () { return _font.postScriptName; }, null),
            fullName: AE.safeGet(function () { return _font.fullName; }, null),
            familyName: AE.safeGet(function () { return _font.familyName; }, null),
            styleName: AE.safeGet(function () { return _font.styleName; }, null),
            nativeFamilyName: AE.safeGet(function () { return _font.nativeFamilyName; }, null),
            nativeFullName: AE.safeGet(function () { return _font.nativeFullName; }, null),
            nativeStyleName: AE.safeGet(function () { return _font.nativeStyleName; }, null),
            familyPrefix: AE.safeGet(function () { return _font.familyPrefix; }, null),
            isFromAdobeFonts: AE.safeGet(function () { return _font.isFromAdobeFonts; }, null),
            isSubstitute: AE.safeGet(function () { return _font.isSubstitute; }, null),
            location: AE.safeGet(function () { return _font.location; }, null),
            version: AE.safeGet(function () { return _font.version; }, null),
            technology: AE.safeGet(function () { return _enumStr(_font.technology); }, null),
            fontType: AE.safeGet(function () { return _enumStr(_font.type); }, null),
            hasDesignAxes: AE.safeGet(function () { return _font.hasDesignAxes; }, false),
            designAxesData: null,
            designVector: null
        };
        try {
            if (_info.hasDesignAxes) {
                _info.designAxesData = AE.valueToJson(_font.designAxesData);
                _info.designVector = AE.valueToJson(_font.designVector);
            }
        } catch (eAx) {}
        return _info;
    }
`;
		registerOp({
			name: "font.list",
			category: "font",
			readOnly: true,
			description: "List installed fonts with postScriptName/family/style (app.fonts, AE 24.0+). Use postScriptName with text.set_style. Filter with familyContains.",
			params: [{
				name: "familyContains",
				type: "string",
				description: "Case-insensitive substring match on family name",
				required: false
			}, {
				name: "limit",
				type: "number",
				description: "Max results (default 200)",
				required: false
			}],
			toJsx(args) {
				return `
            if (!app.fonts || !app.fonts.allFonts) return { ok: false, error: "app.fonts needs AE 24.0+" };
            var _needle = ${jsxVal(args.familyContains ?? null)};
            if (_needle !== null) _needle = _needle.toLowerCase();
            var _limit = ${jsxVal(args.limit ?? 200)};
            var _families = app.fonts.allFonts;
            var _out = [];
            var _total = 0;
            for (var _i = 0; _i < _families.length; _i++) {
                var _entry = _families[_i];
                // Documented as grouped (one array per family), but tolerate a
                // flat list of font objects too: guessing wrong would return
                // "ok, zero fonts installed" rather than an error, and
                // project.replace_font already treats a sibling API as flat.
                var _group = (_entry && typeof _entry.length === "number" && typeof _entry.postScriptName === "undefined") ? _entry : [_entry];
                for (var _j = 0; _j < _group.length; _j++) {
                    var _font = _group[_j];
                    var _fam = AE.safeGet(function () { return _font.familyName; }, "");
                    if (_needle !== null && _fam.toLowerCase().indexOf(_needle) === -1) continue;
                    _total++;
                    if (_out.length < _limit) {
                        _out.push({
                            postScriptName: AE.safeGet(function () { return _font.postScriptName; }, null),
                            familyName: _fam,
                            styleName: AE.safeGet(function () { return _font.styleName; }, null)
                        });
                    }
                }
            }
            return { ok: true, total: _total, returned: _out.length, fonts: _out };
        `;
			}
		});
		registerOp({
			name: "font.list_missing",
			category: "font",
			readOnly: true,
			description: "List fonts that are missing or substituted in the current project (app.fonts, AE 24.0+). Pair with project.replace_font to fix.",
			params: [],
			toJsx() {
				return `
            ${LIST_MISSING_FONTS_FN}
            return _listMissingFonts();
        `;
			}
		});
		registerOp({
			name: "font.info",
			category: "font",
			readOnly: true,
			description: "Full FontObject details for a font (AE 24.0+): names, location, Adobe Fonts / substitute flags, and variable-font design axes (designAxesData/designVector). Look up by postScriptName, or by family (+ optional style).",
			params: [
				{
					name: "postScriptName",
					type: "string",
					description: "PostScript name (preferred lookup)",
					required: false
				},
				{
					name: "family",
					type: "string",
					description: "Family name (used when postScriptName omitted)",
					required: false
				},
				{
					name: "style",
					type: "string",
					description: "Style name for family lookup (default 'Regular')",
					required: false
				}
			],
			toJsx(args) {
				return `
            if (!app.fonts) return { ok: false, error: "app.fonts needs AE 24.0+" };
            ${FONT_INFO_JSX}
            var _ps = ${jsxVal(args.postScriptName ?? null)};
            var _family = ${jsxVal(args.family ?? null)};
            var _list = null;
            try {
                if (_ps !== null) _list = app.fonts.getFontsByPostScriptName(_ps);
                else if (_family !== null) _list = app.fonts.getFontsByFamilyNameAndStyleName(_family, ${jsxVal(args.style ?? "Regular")});
                else return { ok: false, error: "pass postScriptName or family" };
            } catch (eLk) { return { ok: false, error: "font lookup failed: " + AE.errText(eLk) }; }
            if (!_list || _list.length === 0) return { ok: false, error: "no font matching " + (_ps !== null ? _ps : _family) };
            var _out = [];
            for (var _i = 0; _i < _list.length; _i++) _out.push(_fontInfo(_list[_i]));
            return { ok: true, count: _out.length, fonts: _out };
        `;
			}
		});
		registerOp({
			name: "font.check_glyphs",
			category: "font",
			readOnly: true,
			description: "Check whether a font has glyphs for every character of a string (FontObject.hasGlyphsFor, AE 25.1+). Essential before setting CJK or symbol text on a Latin-only font.",
			params: [{
				name: "postScriptName",
				type: "string",
				description: "Font PostScript name",
				required: true
			}, {
				name: "text",
				type: "string",
				description: "Characters to check",
				required: true
			}],
			toJsx(args) {
				return `
            if (!app.fonts) return { ok: false, error: "app.fonts needs AE 24.0+" };
            var _list = null;
            try { _list = app.fonts.getFontsByPostScriptName(${jsxVal(args.postScriptName)}); } catch (eLk) { return { ok: false, error: "font lookup failed: " + AE.errText(eLk) }; }
            if (!_list || _list.length === 0) return { ok: false, error: "no font matching " + ${jsxVal(args.postScriptName)} };
            var _font = _list[0];
            if (typeof _font.hasGlyphsFor !== "function") return { ok: false, error: "hasGlyphsFor needs AE 25.1+" };
            var _has = null;
            try { _has = _font.hasGlyphsFor(${jsxVal(args.text)}); } catch (eHg) { return { ok: false, error: "hasGlyphsFor failed: " + AE.errText(eHg) }; }
            return { ok: true, font: ${jsxVal(args.postScriptName)}, hasGlyphs: _has };
        `;
			}
		});
		registerOp({
			name: "font.list_used",
			category: "font",
			readOnly: true,
			description: "List every font used in the project with its usage references (Project.usedFonts, AE 24.5+). The reverse of font.list_missing: answers 'which fonts does this project depend on'.",
			params: [],
			toJsx() {
				return `
            var _used = null;
            try { _used = app.project.usedFonts; } catch (eU) { return { ok: false, error: "Project.usedFonts needs AE 24.5+: " + AE.errText(eU) }; }
            if (_used === undefined || _used === null) return { ok: false, error: "Project.usedFonts needs AE 24.5+" };
            var _out = [];
            for (var _i = 0; _i < _used.length; _i++) {
                var _entry = _used[_i];
                var _font = _entry.font;
                _out.push({
                    postScriptName: AE.safeGet(function () { return _font.postScriptName; }, null),
                    familyName: AE.safeGet(function () { return _font.familyName; }, null),
                    styleName: AE.safeGet(function () { return _font.styleName; }, null),
                    isSubstitute: AE.safeGet(function () { return _font.isSubstitute; }, null),
                    usedAt: AE.safeGet(function () { return AE.valueToJson(_entry.usedAt); }, null)
                });
            }
            return { ok: true, count: _out.length, fonts: _out };
        `;
			}
		});
		registerOp({
			name: "font.list_duplicates",
			category: "font",
			readOnly: true,
			description: "List groups of installed fonts that share a PostScript name (FontsObject.fontsDuplicateByPostScriptName, AE 24.6+) — the usual cause of 'wrong font picked' surprises.",
			params: [],
			toJsx() {
				return `
            if (!app.fonts) return { ok: false, error: "app.fonts needs AE 24.0+" };
            var _groups = null;
            try { _groups = app.fonts.fontsDuplicateByPostScriptName; } catch (eDp) { return { ok: false, error: "fontsDuplicateByPostScriptName needs AE 24.6+: " + AE.errText(eDp) }; }
            if (!_groups) return { ok: false, error: "fontsDuplicateByPostScriptName needs AE 24.6+" };
            var _out = [];
            for (var _i = 0; _i < _groups.length; _i++) {
                var _grp = _groups[_i];
                var _fonts = [];
                var _list = (_grp && typeof _grp.length === "number") ? _grp : [_grp];
                for (var _j = 0; _j < _list.length; _j++) {
                    var _font = _list[_j];
                    _fonts.push({
                        postScriptName: AE.safeGet(function () { return _font.postScriptName; }, null),
                        familyName: AE.safeGet(function () { return _font.familyName; }, null),
                        styleName: AE.safeGet(function () { return _font.styleName; }, null),
                        location: AE.safeGet(function () { return _font.location; }, null)
                    });
                }
                _out.push(_fonts);
            }
            return { ok: true, count: _out.length, groups: _out };
        `;
			}
		});
		registerOp({
			name: "font.get_lists",
			category: "font",
			readOnly: true,
			description: "Read the Character panel's Favorites and most-recently-used font family lists (AE 24.6+).",
			params: [],
			toJsx() {
				return `
            if (!app.fonts) return { ok: false, error: "app.fonts needs AE 24.0+" };
            var _fav = null;
            var _mru = null;
            try { _fav = AE.valueToJson(app.fonts.favoriteFontFamilyList); } catch (eF) {}
            try { _mru = AE.valueToJson(app.fonts.mruFontFamilyList); } catch (eM) {}
            if (_fav === null && _mru === null) return { ok: false, error: "font lists need AE 24.6+" };
            return { ok: true, favorites: _fav, recent: _mru };
        `;
			}
		});
		registerOp({
			name: "font.set_favorites",
			category: "font",
			appConfig: true,
			description: "Replace the Character panel's Favorites font family list (FontsObject.favoriteFontFamilyList, AE 24.6+).",
			params: [{
				name: "families",
				type: "array",
				description: "Font family names, in display order",
				required: true
			}],
			toJsx(args) {
				return `
            if (!app.fonts) return { ok: false, error: "app.fonts needs AE 24.0+" };
            try { app.fonts.favoriteFontFamilyList = ${jsxVal(args.families)}; } catch (eF) { return { ok: false, error: "favoriteFontFamilyList write needs AE 24.6+: " + AE.errText(eF) }; }
            return { ok: true, favorites: AE.valueToJson(app.fonts.favoriteFontFamilyList) };
        `;
			}
		});
		registerOp({
			name: "font.set_substitution",
			category: "font",
			appConfig: true,
			description: "Configure automatic replacement of substituted (missing) fonts (AE 24.6+): matchPolicy postScriptName|ctfiEqual|disabled, and freezeSync to stop Adobe Fonts auto-sync on project open.",
			params: [{
				name: "matchPolicy",
				type: "string",
				description: "postScriptName|ctfiEqual|disabled",
				required: false
			}, {
				name: "freezeSync",
				type: "boolean",
				description: "Suppress Adobe Fonts auto-sync of substituted fonts",
				required: false
			}],
			toJsx(args) {
				const sets = [];
				if (args.matchPolicy !== void 0) sets.push(`
        try {
            var _mpMap = { "postScriptName": SubstitutedFontReplacementMatchPolicy.POSTSCRIPT_NAME, "ctfiEqual": SubstitutedFontReplacementMatchPolicy.CTFI_EQUAL, "disabled": SubstitutedFontReplacementMatchPolicy.DISABLED };
            if (_mpMap.hasOwnProperty(${jsxVal(args.matchPolicy)})) { app.fonts.substitutedFontReplacementMatchPolicy = _mpMap[${jsxVal(args.matchPolicy)}]; }
            else { _w.push("matchPolicy: pass postScriptName|ctfiEqual|disabled"); }
        } catch (e) { _w.push("matchPolicy (AE 24.6+): " + AE.errText(e)); }`);
				if (args.freezeSync !== void 0) sets.push(`try { app.fonts.freezeSyncSubstitutedFonts = ${jsxVal(args.freezeSync)}; } catch (e) { _w.push("freezeSync (AE 24.6+): " + AE.errText(e)); }`);
				return `
            if (!app.fonts) return { ok: false, error: "app.fonts needs AE 24.0+" };
            var _w = [];
            ${sets.join("\n")}
            return { ok: true, warnings: _w };
        `;
			}
		});
		CT_SCRIPT_MAP_JSX = `
    var _scripts = {};
    function _addScript(name, member) {
        try { if (CTScript[member] !== undefined) _scripts[name] = CTScript[member]; } catch (eCs) {}
    }
    _addScript("roman", "CT_ROMAN_SCRIPT"); _addScript("japanese", "CT_JAPANESE_SCRIPT");
    _addScript("arabic", "CT_ARABIC_SCRIPT"); _addScript("cyrillic", "CT_CYRILLIC_SCRIPT");
    _addScript("greek", "CT_GREEK_SCRIPT"); _addScript("hebrew", "CT_HEBREW_SCRIPT");
    _addScript("thai", "CT_THAI_SCRIPT"); _addScript("devanagari", "CT_DEVANAGARI_SCRIPT");
`;
		registerOp({
			name: "font.get_default_for_script",
			category: "font",
			readOnly: true,
			description: "Read the default font for a writing script (FontsObject.getDefaultFontForCTScript, AE 25.1+): roman|japanese|arabic|cyrillic|greek|hebrew|thai|devanagari, or a raw CTScript member name like CT_HANGUL_SCRIPT.",
			params: [{
				name: "script",
				type: "string",
				description: "Writing script (see description)",
				required: true
			}],
			toJsx(args) {
				return `
            if (!app.fonts || typeof app.fonts.getDefaultFontForCTScript !== "function") return { ok: false, error: "getDefaultFontForCTScript needs AE 25.1+" };
            ${CT_SCRIPT_MAP_JSX}
            var _arg = ${jsxVal(args.script)};
            var _script = _scripts.hasOwnProperty(_arg) ? _scripts[_arg] : null;
            if (_script === null) { try { if (CTScript[_arg] !== undefined) _script = CTScript[_arg]; } catch (eRw) {} }
            if (_script === null) return { ok: false, error: "unknown script '" + _arg + "'" };
            var _font = null;
            try { _font = app.fonts.getDefaultFontForCTScript(_script); } catch (eG) { return { ok: false, error: "getDefaultFontForCTScript failed: " + AE.errText(eG) }; }
            if (!_font) return { ok: true, script: _arg, font: null };
            return { ok: true, script: _arg, font: { postScriptName: AE.safeGet(function () { return _font.postScriptName; }, null), familyName: AE.safeGet(function () { return _font.familyName; }, null), styleName: AE.safeGet(function () { return _font.styleName; }, null) } };
        `;
			}
		});
		registerOp({
			name: "font.set_default_for_script",
			category: "font",
			appConfig: true,
			description: "Set the default font AE uses for a writing script (FontsObject.setDefaultFontForCTScript, AE 25.1+). Script names as in font.get_default_for_script; font by PostScript name.",
			params: [{
				name: "script",
				type: "string",
				description: "Writing script",
				required: true
			}, {
				name: "postScriptName",
				type: "string",
				description: "Font PostScript name",
				required: true
			}],
			toJsx(args) {
				return `
            if (!app.fonts || typeof app.fonts.setDefaultFontForCTScript !== "function") return { ok: false, error: "setDefaultFontForCTScript needs AE 25.1+" };
            ${CT_SCRIPT_MAP_JSX}
            var _arg = ${jsxVal(args.script)};
            var _script = _scripts.hasOwnProperty(_arg) ? _scripts[_arg] : null;
            if (_script === null) { try { if (CTScript[_arg] !== undefined) _script = CTScript[_arg]; } catch (eRw) {} }
            if (_script === null) return { ok: false, error: "unknown script '" + _arg + "'" };
            var _list = null;
            try { _list = app.fonts.getFontsByPostScriptName(${jsxVal(args.postScriptName)}); } catch (eLk) {}
            if (!_list || _list.length === 0) return { ok: false, error: "no font matching " + ${jsxVal(args.postScriptName)} };
            try { app.fonts.setDefaultFontForCTScript(_script, _list[0]); } catch (eS) { return { ok: false, error: "setDefaultFontForCTScript failed: " + AE.errText(eS) }; }
            return { ok: true, script: _arg, font: ${jsxVal(args.postScriptName)} };
        `;
			}
		});
	})))();
}

// operations/egp.js
function init_egp() {
	return (init_egp = __esmMin((() => {
		init_registry();
		registerOp({
			name: "egp.set_name",
			category: "egp",
			description: "Set the Motion Graphics Template name of a comp (Essential Graphics panel title).",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}, {
				name: "name",
				type: "string",
				description: "Template name",
				required: true
			}],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            _comp.motionGraphicsTemplateName = ${jsxVal(args.name)};
            return { ok: true, name: _comp.motionGraphicsTemplateName };
        `;
			}
		});
		registerOp({
			name: "egp.add_property",
			category: "egp",
			description: "Expose a layer property in the Essential Graphics panel of a comp (Property.addToMotionGraphicsTemplateAs). The comp becomes the template master.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id (holds the property)",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path",
					required: true
				},
				{
					name: "controllerName",
					type: "string",
					description: "Display name in the Essential Graphics panel (default: property name)",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            var _can = false;
            try { _can = _node.canAddToMotionGraphicsTemplate(_comp); } catch (eCan) {
                return { ok: false, error: "canAddToMotionGraphicsTemplate unavailable (needs AE 15.0+)" };
            }
            if (!_can) return { ok: false, error: "property '" + _node.name + "' cannot be added to the template (unsupported type or already added)" };
            var _ctrlName = ${jsxVal(args.controllerName ?? null)};
            var _added = false;
            var _namedAs = false;
            if (_ctrlName !== null && typeof _node.addToMotionGraphicsTemplateAs === "function") {
                _added = _node.addToMotionGraphicsTemplateAs(_comp, _ctrlName);
                _namedAs = _added === true;
            } else {
                _added = _node.addToMotionGraphicsTemplate(_comp);
            }
            // Without addToMotionGraphicsTemplateAs the property still gets
            // added, just under its default name. Reporting the requested
            // controller name back would claim a rename that never happened.
            var _res = { ok: _added === true, property: _node.name, controller: _namedAs ? _ctrlName : null };
            if (_ctrlName !== null && !_namedAs) _res.warning = "controllerName ignored (addToMotionGraphicsTemplateAs needs AE 16.1+) \u2014 added under its default name";
            return _res;
        `;
			}
		});
		registerOp({
			name: "egp.list_controllers",
			category: "egp",
			readOnly: true,
			description: "List the Essential Graphics controllers exposed on a comp (AE 16.1+ for controller names).",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _count = 0;
            try { _count = _comp.motionGraphicsTemplateControllerCount; } catch (eC) {
                return { ok: false, error: "motionGraphicsTemplateControllerCount needs AE 16.1+" };
            }
            var _controllers = [];
            for (var _i = 0; _i < _count; _i++) {
                var _name = null;
                try { _name = _comp.getMotionGraphicsTemplateControllerName(_i); } catch (eN) {}
                _controllers.push({ index: _i, name: _name });
            }
            return { ok: true, templateName: AE.safeGet(function () { return _comp.motionGraphicsTemplateName; }, null), count: _count, controllers: _controllers };
        `;
			}
		});
		registerOp({
			name: "egp.export_mogrt",
			category: "egp",
			description: "Export a comp as a Motion Graphics Template (.mogrt) file for Premiere Pro (CompItem.exportAsMotionGraphicsTemplate).",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "path",
					type: "string",
					description: "Absolute destination FOLDER (the filename comes from the template name). Omit to save into the user's Motion Graphics Templates folder. Save the project first — a dirty project triggers a save prompt.",
					required: false
				},
				{
					name: "overwrite",
					type: "boolean",
					description: "Overwrite an existing file without asking (default true)",
					required: false,
					default: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            if (typeof _comp.exportAsMotionGraphicsTemplate !== "function") {
                return { ok: false, error: "exportAsMotionGraphicsTemplate needs AE 15.0+" };
            }
            var _path = ${jsxVal(args.path ?? null)};
            var _res = false;
            if (_path !== null) {
                _res = _comp.exportAsMotionGraphicsTemplate(${jsxVal(args.overwrite !== false)}, _path);
            } else {
                _res = _comp.exportAsMotionGraphicsTemplate(${jsxVal(args.overwrite !== false)});
            }
            return { ok: _res === true, templateName: AE.safeGet(function () { return _comp.motionGraphicsTemplateName; }, null), path: _path };
        `;
			}
		});
		registerOp({
			name: "egp.set_alternate_source",
			category: "egp",
			description: "Set a Media Replacement alternate source on an Essential Properties source (Property.setAlternateSource, AE 18.0+). Works on layers of a template comp opened from Essential Graphics.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path to the media-replacement essential property",
					required: true
				},
				{
					name: "item",
					type: "any",
					description: "Replacement source: project item id (number) or name (string)",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            var _item = AE.findItem(${jsxVal(args.item)});
            if (!_item) return { ok: false, error: "no project item matching " + ${jsxVal(String(args.item))} };
            if (_item instanceof FolderItem) return { ok: false, error: "item is a folder, not footage/comp" };
            // canSetAlternateSource is a property read, not a call: on an AE
            // that predates it the read yields undefined rather than throwing,
            // so a bare falsy test would blame the property instead of the host
            // version. Separate "API missing" from "API says no".
            var _can;
            try { _can = _node.canSetAlternateSource; } catch (eCan) { _can = undefined; }
            if (typeof _can === "undefined" || typeof _node.setAlternateSource !== "function") {
                return { ok: false, error: "setAlternateSource needs AE 18.0+ \u2014 this host does not expose it" };
            }
            if (!_can) return { ok: false, error: "property '" + _node.name + "' cannot take an alternate source" };
            _node.setAlternateSource(_item);
            return { ok: true, property: _node.name, source: _item.name };
        `;
			}
		});
		registerOp({
			name: "egp.add_layer",
			category: "egp",
			description: "Expose a whole LAYER in a comp's Essential Graphics panel as a Media Replacement controller (AVLayer.addToMotionGraphicsTemplate, AE 18.0+). For single properties use egp.add_property.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp containing the layer",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "1-based layer index, or the layer name",
					required: true
				},
				{
					name: "masterComp",
					type: "any",
					description: "Template master comp (default: same as comp)",
					required: false
				},
				{
					name: "controllerName",
					type: "string",
					description: "Display name in the Essential Graphics panel (default: layer name)",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _masterArg = ${jsxVal(args.masterComp ?? null)};
            var _master = _masterArg === null ? _comp : AE.findCompByNameOrId(_masterArg);
            if (!_master) return { ok: false, error: "no master comp matching " + String(_masterArg) };
            if (typeof _layer.addToMotionGraphicsTemplate !== "function") {
                return { ok: false, error: "addToMotionGraphicsTemplate needs AE 18.0+" };
            }
            var _can = false;
            try { _can = _layer.canAddToMotionGraphicsTemplate(_master); } catch (eCan) {}
            if (!_can) return { ok: false, error: "layer '" + _layer.name + "' cannot be added to the Essential Graphics panel of '" + _master.name + "' \u2014 only AVLayers with footage/comp sources qualify for media replacement" };
            var _name = ${jsxVal(args.controllerName ?? null)};
            var _added = false;
            var _namedAs = false;
            try {
                if (_name !== null && typeof _layer.addToMotionGraphicsTemplateAs === "function") {
                    _added = _layer.addToMotionGraphicsTemplateAs(_master, _name);
                    _namedAs = _added === true;
                } else {
                    _added = _layer.addToMotionGraphicsTemplate(_master);
                }
            } catch (eAdd) { return { ok: false, error: "addToMotionGraphicsTemplate failed: " + AE.errText(eAdd) }; }
            var _count = null;
            try { _count = _master.motionGraphicsTemplateControllerCount; } catch (eCnt) {}
            var _res = { ok: _added === true, layer: _layer.name, masterComp: _master.name, controllerCount: _count };
            if (_name !== null && !_namedAs) _res.warning = "controllerName ignored (addToMotionGraphicsTemplateAs unavailable on this AE) \u2014 added under its default name";
            return _res;
        `;
			}
		});
		registerOp({
			name: "egp.open_in_panel",
			category: "egp",
			description: "Open a comp in the Essential Graphics panel as the template master (CompItem.openInEssentialGraphics, AE 15.0+).",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            if (typeof _comp.openInEssentialGraphics !== "function") return { ok: false, error: "openInEssentialGraphics needs AE 15.0+" };
            try { _comp.openInEssentialGraphics(); } catch (eEg) { return { ok: false, error: "openInEssentialGraphics failed: " + AE.errText(eEg) }; }
            return { ok: true, comp: _comp.name };
        `;
			}
		});
	})))();
}

// operations/instance.js
function nodeOnly(name) {
	return jsxFail(`${name} runs on the Node side (it manages After Effects processes) \u2014 call it as its own ae_do, not inside batch.run`);
}
function fail(error, extra = {}) {
	return {
		ok: false,
		error,
		...extra
	};
}
function summarizeInstance(i) {
	return {
		label: instanceLabel(i),
		id: i.id,
		alive: i.alive,
		busy: i.heartbeat?.busy ?? false,
		project: i.heartbeat?.project ?? null,
		projectName: i.heartbeat?.projectName ?? null,
		dirty: i.heartbeat?.dirty ?? null,
		numItems: i.heartbeat?.numItems ?? null,
		aeVersion: i.heartbeat?.aeVersion ?? null,
		idSource: i.heartbeat?.idSource ?? null,
		lastSeenMsAgo: i.ageMs
	};
}
async function describeTargetOf(transport) {
	if (!transport.describeTarget) return null;
	const target = await transport.describeTarget();
	switch (target.mode) {
		case "pull": return {
			mode: "pull",
			instance: target.instance.id
		};
		case "push": return { mode: "push" };
		case "error": return {
			mode: "error",
			message: target.message
		};
	}
}
async function exists(p) {
	try {
		await promises.access(p);
		return true;
	} catch {
		return false;
	}
}
var INSTALL_CMD, DEFAULT_START_TIMEOUT_MS, DEFAULT_STOP_TIMEOUT_MS, sleep;
function init_instance() {
	return (init_instance = __esmMin((() => {
		init_agent_install();
		init_config();
		init_registry();
		init_dialogs();
		init_instances();
		init_launcher();
		INSTALL_CMD = "npx @kumoproductions/mcp-aftereffects install-agent";
		DEFAULT_START_TIMEOUT_MS = 12e4;
		DEFAULT_STOP_TIMEOUT_MS = 3e4;
		sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
		registerOp({
			name: "instance.list",
			category: "instance",
			description: "List the After Effects instances whose resident agent is live — id, open project, busy state — and which one this call would address. Instances are separate After Effects processes (AfterFX.exe -m), each with its own project; address one on any tool with `instance: <id or project name>`. Stale entries are instances that quit or stopped ticking (a modal dialog blocks scripting).",
			params: [],
			readOnly: true,
			toJsx: () => nodeOnly("instance.list"),
			async run(_args, transport) {
				const instances = await listInstances();
				return {
					ok: true,
					instances: instances.map(summarizeInstance),
					live: instances.filter((i) => i.alive).map((i) => i.id),
					target: await describeTargetOf(transport)
				};
			}
		});
		registerOp({
			name: "instance.start",
			category: "instance",
			description: "Start a NEW After Effects instance (AfterFX.exe -m) named `name`, wait until its agent registers, and optionally open a project in it — or a COPY of one (`copyFrom`), which is the safe way to work on a project another instance already has open (two instances saving one file overwrite each other). Returns when the instance can be addressed with `instance: name` on every tool. Cold starts take 10–40 s. Parallel workflow: instance.start { name: 'w1', copyFrom: <main .aep> } → work with instance: 'w1' → ae_save_project (instance: 'w1') → project.merge { path: <the copy> } on the main instance → instance.stop { name: 'w1' }. Requires the resident agent (" + INSTALL_CMD + ") — every instance loads it at launch.",
			params: [
				{
					name: "name",
					type: "string",
					description: "Instance id — becomes AE_MCP_INSTANCE for the new process. Letters, digits, '.', '_', '-'. Must not be live already.",
					required: true
				},
				{
					name: "project",
					type: "string",
					description: "Absolute .aep path to open in the new instance once it is up.",
					required: false
				},
				{
					name: "copyFrom",
					type: "string",
					description: "Absolute .aep path to COPY first; the copy is what gets opened. Use for a project the main instance has open.",
					required: false
				},
				{
					name: "copyTo",
					type: "string",
					description: "Where `copyFrom` is copied to (default: next to the original as <stem>__<name>.aep). Overwritten if present.",
					required: false
				},
				{
					name: "timeoutMs",
					type: "number",
					description: `How long to wait for the instance to register (default ${DEFAULT_START_TIMEOUT_MS}).`,
					required: false
				}
			],
			toJsx: () => nodeOnly("instance.start"),
			async run(args, transport) {
				const name = sanitizeInstanceId(typeof args.name === "string" ? args.name : "");
				if (!name) return fail("name must contain letters, digits, '.', '_' or '-'", { errorCode: "INVALID_ARGS" });
				if (args.project && args.copyFrom) return fail("pass either project or copyFrom, not both", { errorCode: "INVALID_ARGS" });
				let projectToOpen = null;
				let copiedFrom = null;
				let copyTo = null;
				if (typeof args.copyFrom === "string" && args.copyFrom) {
					const src = path$1.resolve(args.copyFrom);
					if (!await exists(src)) return fail(`copyFrom not found: ${src}`, { errorCode: "IO" });
					const ext = path$1.extname(src) || ".aep";
					copyTo = typeof args.copyTo === "string" && args.copyTo ? path$1.resolve(args.copyTo) : path$1.join(path$1.dirname(src), `${path$1.basename(src, ext)}__${name}${ext}`);
					if (copyTo === src) return fail("copyTo must differ from copyFrom", { errorCode: "INVALID_ARGS" });
					const rejected = rejectedOutputPath(copyTo);
					if (rejected) return fail(rejected, { errorCode: "IO" });
					copiedFrom = src;
					projectToOpen = copyTo;
				} else if (typeof args.project === "string" && args.project) {
					projectToOpen = path$1.resolve(args.project);
					if (!await exists(projectToOpen)) return fail(`project not found: ${projectToOpen}`, { errorCode: "IO" });
				}
				const clash = (await listInstances()).find((i) => i.alive && i.id === name);
				if (clash) return fail(`instance '${name}' is already live (${describeInstance(clash)}) \u2014 address it directly, or pick another name`);
				if (!(await agentInstallStatus()).some((s) => s.installed)) return fail("the resident agent is not installed, so a new instance could not be addressed once started", {
					errorCode: "NO_INSTANCE",
					hint: `Run \`${INSTALL_CMD}\` once (per After Effects version), then retry. Nothing was launched.`
				});
				let exe;
				try {
					exe = resolveAfterFxPath();
				} catch (err) {
					return fail(err instanceof Error ? err.message : String(err), { errorCode: "AE_NOT_FOUND" });
				}
				if (copiedFrom !== null && copyTo !== null) {
					await promises.mkdir(path$1.dirname(copyTo), { recursive: true });
					await promises.copyFile(copiedFrom, copyTo);
				}
				const plan = buildInstanceLaunchPlan(exe, name);
				const aePid = process.platform === "darwin" ? null : void 0;
				const launchedAt = Date.now();
				let spawnError = null;
				const child = spawn(plan.command, plan.args, {
					env: {
						...process.env,
						AE_MCP_INSTANCE: name
					},
					detached: true,
					stdio: "ignore",
					windowsHide: false
				});
				child.on("error", (err) => {
					spawnError = err;
				});
				child.unref();
				const timeoutMs = typeof args.timeoutMs === "number" && args.timeoutMs > 0 ? args.timeoutMs : DEFAULT_START_TIMEOUT_MS;
				const deadline = launchedAt + timeoutMs;
				let registered = null;
				while (Date.now() < deadline) {
					if (spawnError !== null) return fail(`could not launch After Effects (${exe}): ${spawnError.message}`, { errorCode: "TRANSPORT" });
					const info = await readInstance(instanceDirFor(name));
					if (info.alive && (info.heartbeat?.startedAt ?? 0) >= launchedAt - 5e3) {
						registered = info;
						break;
					}
					await sleep(500);
				}
				if (registered === null) {
					const dialogs = (await scanAeDialogs()).filter((d) => d.pid === child.pid || (d.startedAt ?? 0) >= launchedAt - 2e3);
					if (dialogs.length > 0) return {
						...fail(`instance '${name}' did not register within ${timeoutMs} ms: ${dialogBlockMessage(dialogs)}`, {
							errorCode: "DIALOG_OPEN",
							hint: dialogHint(dialogs)
						}),
						dialogs
					};
					return fail(`instance '${name}' did not register within ${timeoutMs} ms (After Effects was launched${aePid === null ? "" : `, pid ${child.pid ?? "?"}`})`, {
						errorCode: "NO_INSTANCE",
						hint: "Is the agent installed for THIS After Effects version (`mcp-aftereffects agent-status`)? Did After Effects stop at a dialog while starting? After a force-killed or crashed session, every launch waits at the 'We detected a crash' Safe Mode dialog until someone dismisses it on screen. Raise timeoutMs for a slow machine. The launched process is still running; quit it from its window rather than killing it."
					});
				}
				let opened = null;
				if (projectToOpen !== null) {
					const res = await transport.execute({
						instance: name,
						label: "instance.start",
						code: `
            var _f = new File(${jsxVal(projectToOpen)});
            if (!_f.exists) return { ok: false, error: "file not found: " + ${jsxVal(projectToOpen)} };
            app.open(_f);
            return { ok: true, file: app.project.file.fsName.replace(/\\\\/g, "/"), numItems: app.project.numItems };
        `,
						undoGroup: false,
						suppressDialogs: true,
						timeoutMs: 12e4
					});
					if (!res.ok) return fail(`instance '${name}' started but opening the project failed: ${res.error}`);
					const r = res.result;
					if (r.ok === false) return fail(`instance '${name}' started but opening the project failed: ${r.error}`);
					opened = {
						file: r.file ?? projectToOpen,
						numItems: r.numItems ?? 0
					};
				}
				return {
					ok: true,
					instance: name,
					pid: aePid === null ? null : child.pid ?? null,
					startupMs: Date.now() - launchedAt,
					project: opened,
					copiedFrom: copiedFrom === null ? null : copiedFrom.replace(/\\/g, "/"),
					hint: `Address it with instance: ${JSON.stringify(name)} on any tool; instance.stop { name: ${JSON.stringify(name)} } shuts it down.`
				};
			}
		});
		registerOp({
			name: "instance.stop",
			category: "instance",
			description: "Quit an After Effects instance by name. Refuses while the project has unsaved changes unless `save: true` (save in place — the project must have a file) or `discardChanges: true`. Returns once the instance has gone quiet. Use on workers you started with instance.start; it works on any live instance, so check instance.list before stopping one you did not start.",
			params: [
				{
					name: "name",
					type: "string",
					description: "Instance id (as in instance.list)",
					required: true
				},
				{
					name: "save",
					type: "boolean",
					description: "Save the project to its existing file before quitting (default false)",
					required: false
				},
				{
					name: "discardChanges",
					type: "boolean",
					description: "Quit even if the project has unsaved changes (default false)",
					required: false
				},
				{
					name: "timeoutMs",
					type: "number",
					description: `How long to wait for the instance to go quiet (default ${DEFAULT_STOP_TIMEOUT_MS}).`,
					required: false
				}
			],
			toJsx: () => nodeOnly("instance.stop"),
			async run(args, transport) {
				const name = sanitizeInstanceId(typeof args.name === "string" ? args.name : "");
				if (!name) return fail("name must contain letters, digits, '.', '_' or '-'", { errorCode: "INVALID_ARGS" });
				const dir = instanceDirFor(name);
				const before = await readInstance(dir);
				if (!before.alive) return fail(`instance '${name}' is not live (${describeInstance(before)})`, { errorCode: "NO_INSTANCE" });
				const res = await transport.execute({
					instance: name,
					label: "instance.stop",
					code: `
          var _save = ${jsxVal(!!args.save)};
          var _discard = ${jsxVal(!!args.discardChanges)};
          var _proj = app.project;
          var _file = _proj.file ? _proj.file.fsName.replace(/\\\\/g, "/") : null;
          if (_save) {
              if (!_file) return { ok: false, error: "the project has never been saved \u2014 save it with ae_save_project (path) first, or pass discardChanges: true" };
              _proj.save();
          } else if (_proj.dirty && !_discard) {
              return { ok: false, error: "the project has unsaved changes" + (_file ? " (" + _file + ")" : "") + " \u2014 pass save: true or discardChanges: true" };
          }
          // Close first so quitting never asks about saving; dialogs are
          // suppressed around this call anyway.
          _proj.close(CloseOptions.DO_NOT_SAVE_CHANGES);
          app.quit();
          return { ok: true, file: _file, saved: _save };
      `,
					undoGroup: false,
					suppressDialogs: true,
					timeoutMs: 3e4
				});
				let file = null;
				if (res.ok) {
					const r = res.result;
					if (r.ok === false) return fail(r.error ?? "refused");
					file = r.file ?? null;
				} else if (res.errorCode !== "TIMEOUT" && res.errorCode !== "NO_INSTANCE") return fail(res.error ?? "unknown failure");
				const timeoutMs = typeof args.timeoutMs === "number" && args.timeoutMs > 0 ? args.timeoutMs : DEFAULT_STOP_TIMEOUT_MS;
				const deadline = Date.now() + timeoutMs;
				let gone = false;
				while (Date.now() < deadline) {
					if (!(await readInstance(dir)).alive) {
						gone = true;
						break;
					}
					await sleep(500);
				}
				if (!gone) return fail(`instance '${name}' accepted the quit but is still ticking after ${timeoutMs} ms \u2014 check it for a dialog`);
				await promises.rm(dir, {
					recursive: true,
					force: true
				}).catch(() => {});
				return {
					ok: true,
					instance: name,
					stopped: true,
					saved: !!args.save,
					file
				};
			}
		});
		registerOp({
			name: "instance.dialogs",
			category: "instance",
			description: "List the modal dialogs every running After Effects is showing — the message text, the owning process and its window title, and an id for instance.dismiss_dialog. While a dialog is open no script runs (calls fail with DIALOG_OPEN, or an instance stops ticking), and the dialog is often hidden behind the main window. Windows and macOS. On macOS the text is read only with Accessibility permission for the app running this server; without it dialogs are still listed, with empty text (`accessibility: false`). After Effects' own 'Executing Script ...' progress window is not a dialog: it is reported under scriptRunning (a script is still running), never offered for dismissal — its only action cancels the script.",
			params: [],
			readOnly: true,
			toJsx: () => nodeOnly("instance.dialogs"),
			async run() {
				const { dialogs, scripts } = splitScriptProgress(await scanAeWindows());
				return {
					ok: true,
					dialogs,
					scriptRunning: scripts.map((w) => ({
						pid: w.pid,
						id: w.id,
						matchedBy: w.scriptProgress
					})),
					...scripts.length > 0 ? { note: `A script is still running. ${scriptRunningMessage(scripts)}. ${SCRIPT_RUNNING_HINT}` } : {},
					supported: dialogScanSupported()
				};
			}
		});
		registerOp({
			name: "instance.dismiss_dialog",
			category: "instance",
			description: "Close a modal dialog After Effects is showing by its cancel action (what Escape does). A warning (missing files or fonts, a script alert) is acknowledged; a question is cancelled, never answered: \"Save changes before closing?\" leaves the project open and unsaved. Take `id` from instance.dialogs or from a DIALOG_OPEN error's details.dialogs. When the user wants a dialog answered some other way (Save, Replace…), ask them to click it. Windows and macOS; on macOS it needs Accessibility permission. A dialog Escape does not close is left open unless it has a single button (an OK-only warning), which is pressed.",
			params: [{
				name: "id",
				type: "string",
				description: "The dialog's id, as listed by instance.dialogs",
				required: true
			}],
			toJsx: () => nodeOnly("instance.dismiss_dialog"),
			async run(args) {
				if (!dialogScanSupported()) return fail("instance.dismiss_dialog is only available on Windows and macOS");
				const id = typeof args.id === "string" ? args.id.trim() : "";
				const r = (await scanAeWindows()).find((w) => w.id === id && w.scriptProgress) ? {
					posted: false,
					closed: false,
					text: null,
					reason: "script_progress"
				} : await dismissAeDialog(id);
				if (r.reason === "script_progress") return fail(`window ${id} is After Effects' 'Executing Script' progress window, not a dialog: a script is still running, and that window's only action would cancel it. Nothing was sent.`, { hint: SCRIPT_RUNNING_HINT });
				if (r.reason === "no_permission") return fail(`cannot close After Effects dialog ${id}: no Accessibility permission`, { hint: ACCESSIBILITY_HINT });
				if (!r.posted) return fail(`no After Effects dialog with id ${JSON.stringify(id)} is open \u2014 it may already be closed`, { hint: "Call instance.dialogs for the current list." });
				const remaining = await scanAeDialogs();
				return {
					ok: true,
					dismissed: {
						id,
						text: r.text
					},
					closed: r.closed,
					remaining,
					...r.closed ? {} : { hint: "The dialog did not close on its cancel action — ask the user to answer it in After Effects." }
				};
			}
		});
	})))();
}

// operations/index.js
function init_operations() {
	return (init_operations = __esmMin((async () => {
		init_policy();
		init_layer();
		init_keyframe();
		init_expression();
		init_effect();
		init_transform();
		init_comp();
		init_shape();
		init_project();
		init_text();
		init_mask();
		init_keying();
		init_look_sheet();
		init_command();
		init_property();
		init_marker();
		init_batch();
		init_timeline();
		init_layer_advanced();
		init_render();
		init_inspect();
		init_footage();
		init_item();
		init_font();
		init_egp();
		init_viewer();
		init_pref();
		init_shape_contents();
		init_layout();
		init_sample();
		init_video();
		init_instance();
		if (evalRunEnabled()) await import("./eval.js");
	})))();
}

// operations/eval.js
function realOrResolved(p) {
	try {
		return realpathSync(p);
	} catch {
		return path$1.resolve(p);
	}
}
function isInside(p, root) {
	const rel = path$1.relative(root, p);
	return rel === "" || !rel.startsWith("..") && !path$1.isAbsolute(rel);
}
function refuse(error, hint) {
	return hint ? {
		ok: false,
		error,
		hint
	} : {
		ok: false,
		error
	};
}
function readScriptFile(file) {
	if (!path$1.isAbsolute(file)) return {
		ok: false,
		error: `file must be an absolute path (got '${file}'): the server's working directory is not yours`
	};
	let stat;
	try {
		stat = statSync(file);
	} catch (err) {
		const code = err.code;
		return code === "ENOENT" || code === "ENOTDIR" ? {
			ok: false,
			error: `script file ${file} does not exist`
		} : {
			ok: false,
			error: `cannot read script file ${file}: ${err.message}`
		};
	}
	if (!stat.isFile()) return {
		ok: false,
		error: `${file} is not a file`
	};
	if (stat.size === 0) return {
		ok: false,
		error: `script file ${file} is empty`
	};
	if (stat.size > 1048576) return {
		ok: false,
		error: `script file ${file} is too large (${stat.size} bytes; the limit is ${MAX_SCRIPT_FILE_BYTES})`,
		hint: "Split it, or move bulk data out of the code into a file the script reads itself."
	};
	const real = realOrResolved(file);
	for (const root of [RUNTIME_DIR, RUNTIME_ROOT]) if (isInside(real, realOrResolved(root))) return {
		ok: false,
		error: `refusing to run a script from inside the plugin's mailbox (${root})`,
		hint: "Keep scripts somewhere of your own; the mailbox only carries the plugin's requests."
	};
	let text;
	try {
		text = readFileSync(real, "utf8");
	} catch (err) {
		return {
			ok: false,
			error: `cannot read script file ${file}: ${err.message}`
		};
	}
	if (text.indexOf("\0") !== -1) return {
		ok: false,
		error: `script file ${file} looks binary (it contains NUL bytes); eval.run takes ExtendScript source`
	};
	if (text.charCodeAt(0) === 65279) text = text.slice(1);
	text = text.replace(/\r\n?/g, "\n");
	return {
		ok: true,
		code: text
	};
}
var MAX_SCRIPT_FILE_BYTES, MAX_SCRIPT_ARGS_BYTES;
function init_eval() {
	return (init_eval = __esmMin((() => {
		init_config();
		init_registry();
		MAX_SCRIPT_FILE_BYTES = 1048576;
		MAX_SCRIPT_ARGS_BYTES = 1048576;
		registerOp({
			name: "eval.run",
			category: "eval",
			description: "Execute custom ExtendScript (ES3). LAST RESORT — check ae_catalog first for a dedicated operation. Pass the code inline as `code`, or as a script `file` (an absolute path; read and checked before After Effects is contacted) — exactly one of the two. Code is a function body ending with `return <JSON-serializable>;`. AE.* helpers are in scope, and `args` holds the optional `args` value you pass (null when omitted). `log(msg)` pushes breadcrumbs. An error reports the line in YOUR code (or file:line), not in the plugin's wrapper. The code already runs inside an automatic undo group (one Ctrl+Z reverts the call). If it THROWS, the call is rolled back before the error is returned — its changes are undone with dialogs suppressed, and details.rollback says whether that succeeded and what is left if not; returning { ok: false } is not a throw and is not rolled back. Pass rollback: false for deliberately incremental work whose partial result you want to keep. No undo is ever issued for a call that changed the render queue, and after a scripted render-queue change in the session rollback is refused unless acceptRenderQueueRisk: true (After Effects 2027 has gone into crash recovery on undo after such changes — observed twice, a precaution); details.rollback then lists addedItems and what to do next. Do NOT call app.beginUndoGroup/endUndoGroup yourself; an unbalanced group leaks past this call and corrupts undo for the whole session (and defeats the rollback). Do NOT undo/redo from here either (app.executeCommand 16/2035): inside this call's group AE resolves them against it, so nothing is reverted — use project.undo / project.redo, which run outside the group. Do NOT close/open/replace the project from here (app.open, app.newProject, app.project.close): the open undo group is orphaned at the project boundary, AE raises an async 'UndoGroup Mismatch' dialog, and undo stays broken for the session — use project.open / project.new, which run outside the group.",
			params: [
				{
					name: "code",
					type: "string",
					description: "ExtendScript function body. Give this or `file`, not both.",
					required: false
				},
				{
					name: "file",
					type: "string",
					description: "Absolute path to a script file holding the function body (UTF-8, at most 1 MiB, not inside the plugin's mailbox). Give this or `code`, not both.",
					required: false
				},
				{
					name: "args",
					type: "any",
					description: "Any JSON value, available to the code as `args` (null when omitted).",
					required: false
				},
				{
					name: "rollback",
					type: "boolean",
					description: "Default true: if the code throws, undo the call's changes before returning the error. false keeps the partial result.",
					required: false
				},
				{
					name: "acceptRenderQueueRisk",
					type: "boolean",
					description: "Default false. After a scripted render-queue change in this After Effects session, undo is refused (After Effects 2027 has gone into crash recovery on undo after such changes — observed twice; a precaution). Pass true only when the user accepts that risk, ideally after saving.",
					required: false
				}
			],
			rollback: (args) => args.rollback !== false,
			prepare(args) {
				const hasCode = typeof args.code === "string";
				const hasFile = typeof args.file === "string";
				if (hasCode === hasFile) return refuse("give either `code` (inline ExtendScript) or `file` (an absolute path to a script), not both and not neither");
				if (args.args !== void 0) {
					const size = Buffer.byteLength(JSON.stringify(args.args) ?? "null", "utf8");
					if (size > 1048576) return refuse(`args is too large (${size} bytes serialized; the limit is ${MAX_SCRIPT_ARGS_BYTES})`);
				}
				if (!hasFile) return {
					ok: true,
					args
				};
				const file = String(args.file);
				const read = readScriptFile(file);
				if (!read.ok) return refuse(read.error, read.hint);
				return {
					ok: true,
					args: {
						...args,
						code: read.code
					},
					source: { file }
				};
			},
			toJsx(args) {
				return `var args = ${jsxVal(args.args)}; ${String(args.code)}`;
			}
		});
	})))();
}

export { AE_AAC_PRIMING_SAMPLES, CLOSE_CLICK_SHARE, COUNT_NOTE, CUTOUT_HOLE_LIMIT, CUTOUT_OVER, FFMPEG, FFPROBE, FX_ROOT_JSX, GB, MAX_SCRIPT_ARGS_BYTES, MAX_SCRIPT_FILE_BYTES, NEED_CLICK, NODE_ONLY, OBJECT_MATTE_MATCH_NAME, OBJECT_MATTE_SELECTIONS_MATCH_NAME, PICTURE_MARGIN_BYTES, REDO_COMMAND_ID, SETTLE_MAX_MS, SOFT_EDGE_DEFAULTS, SUBJECT_WHOLE_PIECE_NOTE, acceptedBy, aeCacheRoot, alignSound, alikeRegions, cacheBytesFor, captureBytes, compLayerParams, fileCleanupJsx, fileCompJsx, fmt, frozenAccepted, frozenFinding, frozenOpts, gb, init_command, init_delivery_sound, init_eval, init_keying_key, init_keying_reference, init_keying_shared, init_operations, intersects, liveCutoutIO, liveFileIO, measureFrames, needSelection, overParam, overPicture, parseEbur128Summary, parseHex, parseVolumedetect, perFrameMsOf, pixelTally, plural, readScriptFile, readSoundSync, regionsOf, renderChunked, renderTally, roundTally, runReferenceReport, runTool, since, spacePlan, spaceRefusal, statfsFree, subjectIndexParam, summarize, trackedSpan, writePng };
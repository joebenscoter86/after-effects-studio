import { __esmMin } from "./rolldown-runtime.js";
import { init_config, init_policy, init_registry, jsxCompLayerPreamble, jsxCompPreamble, jsxFail, jsxVal, readOnlyMode, registerOp, rejectedOutputPath } from "./core-1.js";
import { AE_AAC_PRIMING_SAMPLES, FFMPEG, FFPROBE, alignSound, init_delivery_sound, parseEbur128Summary, parseVolumedetect, readSoundSync, runTool } from "./operations-1.js";
import { analyzeCurve, curveGraph, encodePngSrgb8, init_motion, init_png16, parseTiming, soundOnsets, syncReport } from "./color-1.js";
import { promises } from "node:fs";
import * as path$1 from "node:path";

// operations/transform.js
function init_transform() {
	return (init_transform = __esmMin((() => {
		init_registry();
		registerOp({
			name: "transform.set",
			category: "transform",
			description: "Set transform properties on one or more layers. layer can be index, name, 'selected', or 'all'. For keyframes use keyframe.add.",
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
					description: "Layer index (number), name (string), 'selected', or 'all'",
					required: true
				},
				{
					name: "position",
					type: "array",
					description: "[x,y] or [x,y,z]",
					required: false
				},
				{
					name: "scale",
					type: "array",
					description: "[sx,sy] or [sx,sy,sz] in percent",
					required: false
				},
				{
					name: "rotation",
					type: "number",
					description: "Rotation in degrees",
					required: false
				},
				{
					name: "opacity",
					type: "number",
					description: "Opacity 0-100",
					required: false
				},
				{
					name: "anchorPoint",
					type: "array",
					description: "[x,y] or [x,y,z]",
					required: false
				},
				{
					name: "threeDLayer",
					type: "boolean",
					description: "Enable/disable 3D",
					required: false
				}
			],
			toJsx(args) {
				const sets = [];
				if (args.threeDLayer !== void 0) sets.push(`try { _l.threeDLayer = ${jsxVal(args.threeDLayer)}; } catch(e) { _w.push("3D: " + AE.errText(e)); }`);
				if (args.position !== void 0) sets.push(`try { AE.writeValue(_xf.position, ${jsxVal(args.position)}); } catch(e) { _w.push("position: " + AE.errText(e)); }`);
				if (args.scale !== void 0) sets.push(`try { _xf.scale.setValue(${jsxVal(args.scale)}); } catch(e) { _w.push("scale: " + AE.errText(e)); }`);
				if (args.rotation !== void 0) sets.push(`try { _xf.rotation.setValue(${jsxVal(args.rotation)}); } catch(e) { _w.push("rotation: " + AE.errText(e)); }`);
				if (args.opacity !== void 0) sets.push(`try { _xf.opacity.setValue(${jsxVal(args.opacity)}); } catch(e) { _w.push("opacity: " + AE.errText(e)); }`);
				if (args.anchorPoint !== void 0) sets.push(`try { AE.writeValue(_xf.anchorPoint, ${jsxVal(args.anchorPoint)}); } catch(e) { _w.push("anchorPoint: " + AE.errText(e)); }`);
				return `
            ${jsxCompPreamble(args)}
            var _layers = AE.resolveLayers(_comp, ${jsxVal(args.layer)});
            if (_layers.length === 0) return { ok: false, error: "no layers matched" };
            var _results = [];
            for (var _li = 0; _li < _layers.length; _li++) {
                var _l = _layers[_li];
                var _xf = _l.transform;
                var _w = [];
                ${sets.join("\n")}
                _results.push({ name: _l.name, warnings: _w });
            }
            return { ok: true, count: _results.length, layers: _results };
        `;
			}
		});
	})))();
}

// operations/shape.js
function jsxShapeGroupPreamble(args) {
	return `
        var _contents = _layer.property("Contents");
        // Non-shape layers have no Contents, and property(index) throws on
        // out-of-range instead of returning null. Both would surface as a raw
        // ExtendScript error without these checks.
        if (!_contents) return { ok: false, error: "not a shape layer (no Contents group)" };
        if (${jsxVal(args.groupIndex)} < 1 || ${jsxVal(args.groupIndex)} > _contents.numProperties) {
            return { ok: false, error: "no group at index " + ${jsxVal(args.groupIndex)} + " (layer has " + _contents.numProperties + ")" };
        }
        var _grp = _contents.property(${jsxVal(args.groupIndex)});
        if (!_grp) return { ok: false, error: "no group at index " + ${jsxVal(args.groupIndex)} };
    `;
}
function jsxGradientOpacity(varName, matchName, opacity) {
	if (opacity === void 0) return "";
	return `try { ${varName}.property(${jsxVal(matchName)}).setValue(${jsxVal(opacity)}); } catch (eOp) {}`;
}
function shapeTargetParams() {
	return [
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
			name: "groupIndex",
			type: "number",
			description: "1-based group index within Contents",
			required: true
		}
	];
}
function init_shape() {
	return (init_shape = __esmMin((() => {
		init_registry();
		registerOp({
			name: "shape.add_group",
			category: "shape",
			description: "Add a Vector Group to a shape layer's Contents.",
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
					description: "1-based layer index or name (must be a shape layer)",
					required: true
				},
				{
					name: "name",
					type: "string",
					description: "Group name",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _contents = _layer.property("Contents");
            var _grp = _contents.addProperty("ADBE Vector Group");
            ${args.name ? `_grp.name = ${jsxVal(args.name)};` : ""}
            return { ok: true, groupIndex: _grp.propertyIndex, name: _grp.name };
        `;
			}
		});
		registerOp({
			name: "shape.add_rect",
			category: "shape",
			description: "Add a Rectangle Path to a shape group.",
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
					name: "groupIndex",
					type: "number",
					description: "1-based group index within Contents",
					required: true
				},
				{
					name: "size",
					type: "array",
					description: "[width, height]",
					required: true
				},
				{
					name: "position",
					type: "array",
					description: "[x, y] offset from group center",
					required: false,
					default: [0, 0]
				},
				{
					name: "roundness",
					type: "number",
					description: "Corner roundness in px",
					required: false,
					default: 0
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _rect = _grp.property("Contents").addProperty("ADBE Vector Shape - Rect");
            _rect.property("ADBE Vector Rect Size").setValue(${jsxVal(args.size)});
            _rect.property("ADBE Vector Rect Position").setValue(${jsxVal(args.position ?? [0, 0])});
            _rect.property("ADBE Vector Rect Roundness").setValue(${jsxVal(args.roundness ?? 0)});
            return { ok: true, name: _rect.name };
        `;
			}
		});
		registerOp({
			name: "shape.add_ellipse",
			category: "shape",
			description: "Add an Ellipse Path to a shape group.",
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
					name: "groupIndex",
					type: "number",
					description: "1-based group index within Contents",
					required: true
				},
				{
					name: "size",
					type: "array",
					description: "[width, height]",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _el = _grp.property("Contents").addProperty("ADBE Vector Shape - Ellipse");
            _el.property("ADBE Vector Ellipse Size").setValue(${jsxVal(args.size)});
            return { ok: true, name: _el.name };
        `;
			}
		});
		registerOp({
			name: "shape.add_fill",
			category: "shape",
			description: "Add a Fill to a shape group.",
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
					name: "groupIndex",
					type: "number",
					description: "1-based group index within Contents",
					required: true
				},
				{
					name: "color",
					type: "array",
					description: "[r,g,b,a] 0-1",
					required: true
				},
				{
					name: "opacity",
					type: "number",
					description: "Opacity 0-100",
					required: false,
					default: 100
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _fill = _grp.property("Contents").addProperty("ADBE Vector Graphic - Fill");
            _fill.property("ADBE Vector Fill Color").setValue(${jsxVal(args.color)});
            ${args.opacity !== void 0 ? `_fill.property("ADBE Vector Fill Opacity").setValue(${jsxVal(args.opacity)});` : ""}
            return { ok: true, name: _fill.name };
        `;
			}
		});
		registerOp({
			name: "shape.add_path",
			category: "shape",
			description: "Add a custom bezier Path (vertices + tangents) to a shape group.",
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
					name: "groupIndex",
					type: "number",
					description: "1-based group index within Contents",
					required: true
				},
				{
					name: "vertices",
					type: "array",
					description: "Array of [x,y] points",
					required: true
				},
				{
					name: "inTangents",
					type: "array",
					description: "Array of [x,y] in-tangent offsets",
					required: false
				},
				{
					name: "outTangents",
					type: "array",
					description: "Array of [x,y] out-tangent offsets",
					required: false
				},
				{
					name: "closed",
					type: "boolean",
					description: "Close the path (default true)",
					required: false,
					default: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _pathProp = _grp.property("Contents").addProperty("ADBE Vector Shape - Group");
            var _shape = new Shape();
            _shape.vertices = ${jsxVal(args.vertices)};
            _shape.closed = ${jsxVal(args.closed !== false)};
            ${args.inTangents ? `_shape.inTangents = ${jsxVal(args.inTangents)};` : ""}
            ${args.outTangents ? `_shape.outTangents = ${jsxVal(args.outTangents)};` : ""}
            _pathProp.property("ADBE Vector Shape").setValue(_shape);
            return { ok: true, name: _pathProp.name };
        `;
			}
		});
		registerOp({
			name: "shape.add_trim_paths",
			category: "shape",
			description: "Add Trim Paths to a shape group. Essential for shape animation (line draw-on effects).",
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
					name: "groupIndex",
					type: "number",
					description: "1-based group index within Contents",
					required: true
				},
				{
					name: "start",
					type: "number",
					description: "Start % (0-100)",
					required: false,
					default: 0
				},
				{
					name: "end",
					type: "number",
					description: "End % (0-100)",
					required: false,
					default: 100
				},
				{
					name: "offset",
					type: "number",
					description: "Offset in degrees",
					required: false,
					default: 0
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _trim = _grp.property("Contents").addProperty("ADBE Vector Filter - Trim");
            _trim.property("ADBE Vector Trim Start").setValue(${jsxVal(args.start ?? 0)});
            _trim.property("ADBE Vector Trim End").setValue(${jsxVal(args.end ?? 100)});
            _trim.property("ADBE Vector Trim Offset").setValue(${jsxVal(args.offset ?? 0)});
            return { ok: true, name: _trim.name };
        `;
			}
		});
		registerOp({
			name: "shape.add_merge_paths",
			category: "shape",
			description: "Add Merge Paths to a shape group for combining/subtracting shapes.",
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
					name: "groupIndex",
					type: "number",
					description: "1-based group index within Contents",
					required: true
				},
				{
					name: "mode",
					type: "string",
					description: "merge|add|subtract|intersect|excludeIntersections",
					required: false,
					default: "merge"
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _merge = _grp.property("Contents").addProperty("ADBE Vector Filter - Merge");
            var _modeMap = { "merge": 1, "add": 2, "subtract": 3, "intersect": 4, "excludeIntersections": 5 };
            var _m = _modeMap[${jsxVal(args.mode ?? "merge")}] || 1;
            _merge.property("ADBE Vector Merge Type").setValue(_m);
            return { ok: true, name: _merge.name, mode: ${jsxVal(args.mode ?? "merge")} };
        `;
			}
		});
		registerOp({
			name: "shape.add_stroke",
			category: "shape",
			description: "Add a Stroke to a shape group.",
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
					name: "groupIndex",
					type: "number",
					description: "1-based group index within Contents",
					required: true
				},
				{
					name: "color",
					type: "array",
					description: "[r,g,b,a] 0-1",
					required: true
				},
				{
					name: "width",
					type: "number",
					description: "Stroke width",
					required: false,
					default: 2
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _stroke = _grp.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
            _stroke.property("ADBE Vector Stroke Color").setValue(${jsxVal(args.color)});
            _stroke.property("ADBE Vector Stroke Width").setValue(${jsxVal(args.width ?? 2)});
            return { ok: true, name: _stroke.name };
        `;
			}
		});
		registerOp({
			name: "shape.add_polystar",
			category: "shape",
			description: "Add a Polystar Path (star or polygon) to a shape group.",
			params: [
				...shapeTargetParams(),
				{
					name: "starType",
					type: "string",
					description: "star|polygon (default star)",
					required: false,
					default: "star"
				},
				{
					name: "points",
					type: "number",
					description: "Number of points",
					required: false,
					default: 5
				},
				{
					name: "position",
					type: "array",
					description: "[x, y] offset from group center",
					required: false,
					default: [0, 0]
				},
				{
					name: "rotation",
					type: "number",
					description: "Rotation in degrees",
					required: false
				},
				{
					name: "outerRadius",
					type: "number",
					description: "Outer radius in px",
					required: false,
					default: 100
				},
				{
					name: "innerRadius",
					type: "number",
					description: "Inner radius in px (star type only)",
					required: false
				},
				{
					name: "outerRoundness",
					type: "number",
					description: "Outer roundness % (0-100)",
					required: false
				},
				{
					name: "innerRoundness",
					type: "number",
					description: "Inner roundness % (star type only)",
					required: false
				}
			],
			toJsx(args) {
				const sets = [];
				if (args.rotation !== void 0) sets.push(`_star.property("ADBE Vector Star Rotation").setValue(${jsxVal(args.rotation)});`);
				if (args.innerRadius !== void 0) sets.push(`try { _star.property("ADBE Vector Star Inner Radius").setValue(${jsxVal(args.innerRadius)}); } catch (eIr) {}`);
				if (args.outerRoundness !== void 0) sets.push(`try { _star.property("ADBE Vector Star Outer Roundess").setValue(${jsxVal(args.outerRoundness)}); } catch (eOr) {}`);
				if (args.innerRoundness !== void 0) sets.push(`try { _star.property("ADBE Vector Star Inner Roundess").setValue(${jsxVal(args.innerRoundness)}); } catch (eIrn) {}`);
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _star = _grp.property("Contents").addProperty("ADBE Vector Shape - Star");
            _star.property("ADBE Vector Star Type").setValue(${jsxVal(args.starType ?? "star")} === "polygon" ? 2 : 1);
            _star.property("ADBE Vector Star Points").setValue(${jsxVal(args.points ?? 5)});
            _star.property("ADBE Vector Star Position").setValue(${jsxVal(args.position ?? [0, 0])});
            _star.property("ADBE Vector Star Outer Radius").setValue(${jsxVal(args.outerRadius ?? 100)});
            ${sets.join("\n")}
            return { ok: true, name: _star.name };
        `;
			}
		});
		registerOp({
			name: "shape.add_repeater",
			category: "shape",
			description: "Add a Repeater to a shape group — duplicates the group's contents with a per-copy transform offset.",
			params: [
				...shapeTargetParams(),
				{
					name: "copies",
					type: "number",
					description: "Number of copies",
					required: false,
					default: 3
				},
				{
					name: "offset",
					type: "number",
					description: "Copy offset (fractional copies to skip)",
					required: false
				},
				{
					name: "position",
					type: "array",
					description: "Per-copy position delta [x, y] (default [100, 0])",
					required: false
				},
				{
					name: "rotation",
					type: "number",
					description: "Per-copy rotation in degrees",
					required: false
				},
				{
					name: "scale",
					type: "array",
					description: "Per-copy scale [x, y] % (default [100, 100])",
					required: false
				},
				{
					name: "startOpacity",
					type: "number",
					description: "Opacity % of first copy",
					required: false
				},
				{
					name: "endOpacity",
					type: "number",
					description: "Opacity % of last copy",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _rep = _grp.property("Contents").addProperty("ADBE Vector Filter - Repeater");
            _rep.property("ADBE Vector Repeater Copies").setValue(${jsxVal(args.copies ?? 3)});
            ${args.offset !== void 0 ? `_rep.property("ADBE Vector Repeater Offset").setValue(${jsxVal(args.offset)});` : ""}
            var _rxf = _rep.property("ADBE Vector Repeater Transform");
            ${args.position !== void 0 ? `_rxf.property("ADBE Vector Repeater Position").setValue(${jsxVal(args.position)});` : ""}
            ${args.rotation !== void 0 ? `_rxf.property("ADBE Vector Repeater Rotation").setValue(${jsxVal(args.rotation)});` : ""}
            ${args.scale !== void 0 ? `_rxf.property("ADBE Vector Repeater Scale").setValue(${jsxVal(args.scale)});` : ""}
            ${args.startOpacity !== void 0 ? `_rxf.property("ADBE Vector Repeater Opacity 1").setValue(${jsxVal(args.startOpacity)});` : ""}
            ${args.endOpacity !== void 0 ? `_rxf.property("ADBE Vector Repeater Opacity 2").setValue(${jsxVal(args.endOpacity)});` : ""}
            return { ok: true, name: _rep.name };
        `;
			}
		});
		registerOp({
			name: "shape.add_rounded_corners",
			category: "shape",
			description: "Add Rounded Corners to a shape group.",
			params: [...shapeTargetParams(), {
				name: "radius",
				type: "number",
				description: "Corner radius in px",
				required: false,
				default: 10
			}],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _rc = _grp.property("Contents").addProperty("ADBE Vector Filter - RC");
            _rc.property("ADBE Vector RoundCorner Radius").setValue(${jsxVal(args.radius ?? 10)});
            return { ok: true, name: _rc.name };
        `;
			}
		});
		registerOp({
			name: "shape.add_offset_paths",
			category: "shape",
			description: "Add Offset Paths to a shape group (grow/shrink outlines).",
			params: [
				...shapeTargetParams(),
				{
					name: "amount",
					type: "number",
					description: "Offset in px (positive grows, negative shrinks)",
					required: false,
					default: 10
				},
				{
					name: "lineJoin",
					type: "string",
					description: "miter|round|bevel (default miter)",
					required: false
				},
				{
					name: "miterLimit",
					type: "number",
					description: "Miter limit",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _off = _grp.property("Contents").addProperty("ADBE Vector Filter - Offset");
            _off.property("ADBE Vector Offset Amount").setValue(${jsxVal(args.amount ?? 10)});
            var _joinMap = { "miter": 1, "round": 2, "bevel": 3 };
            ${args.lineJoin !== void 0 ? `_off.property("ADBE Vector Offset Line Join").setValue(_joinMap[${jsxVal(args.lineJoin)}] || 1);` : ""}
            ${args.miterLimit !== void 0 ? `_off.property("ADBE Vector Offset Miter Limit").setValue(${jsxVal(args.miterLimit)});` : ""}
            return { ok: true, name: _off.name };
        `;
			}
		});
		registerOp({
			name: "shape.add_wiggle_paths",
			category: "shape",
			description: "Add Wiggle Paths (roughen) to a shape group.",
			params: [
				...shapeTargetParams(),
				{
					name: "size",
					type: "number",
					description: "Wiggle size in px",
					required: false,
					default: 10
				},
				{
					name: "detail",
					type: "number",
					description: "Detail (segments)",
					required: false,
					default: 10
				},
				{
					name: "pointType",
					type: "string",
					description: "corner|smooth (default corner)",
					required: false
				},
				{
					name: "wigglesPerSecond",
					type: "number",
					description: "Temporal frequency (0 = static)",
					required: false
				},
				{
					name: "correlation",
					type: "number",
					description: "Correlation % (0-100)",
					required: false
				},
				{
					name: "seed",
					type: "number",
					description: "Random seed",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _wig = _grp.property("Contents").addProperty("ADBE Vector Filter - Roughen");
            _wig.property("ADBE Vector Roughen Size").setValue(${jsxVal(args.size ?? 10)});
            _wig.property("ADBE Vector Roughen Detail").setValue(${jsxVal(args.detail ?? 10)});
            ${args.pointType !== void 0 ? `_wig.property("ADBE Vector Roughen Points").setValue(${jsxVal(args.pointType)} === "smooth" ? 2 : 1);` : ""}
            ${args.wigglesPerSecond !== void 0 ? `_wig.property("ADBE Vector Temporal Freq").setValue(${jsxVal(args.wigglesPerSecond)});` : ""}
            ${args.correlation !== void 0 ? `_wig.property("ADBE Vector Correlation").setValue(${jsxVal(args.correlation)});` : ""}
            ${args.seed !== void 0 ? `_wig.property("ADBE Vector Random Seed").setValue(${jsxVal(args.seed)});` : ""}
            return { ok: true, name: _wig.name };
        `;
			}
		});
		registerOp({
			name: "shape.add_zigzag",
			category: "shape",
			description: "Add Zig Zag to a shape group.",
			params: [
				...shapeTargetParams(),
				{
					name: "size",
					type: "number",
					description: "Zig zag size in px",
					required: false,
					default: 10
				},
				{
					name: "ridgesPerSegment",
					type: "number",
					description: "Ridges per segment",
					required: false,
					default: 10
				},
				{
					name: "pointType",
					type: "string",
					description: "corner|smooth (default corner)",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _zz = _grp.property("Contents").addProperty("ADBE Vector Filter - Zigzag");
            _zz.property("ADBE Vector Zigzag Size").setValue(${jsxVal(args.size ?? 10)});
            _zz.property("ADBE Vector Zigzag Detail").setValue(${jsxVal(args.ridgesPerSegment ?? 10)});
            ${args.pointType !== void 0 ? `_zz.property("ADBE Vector Zigzag Points").setValue(${jsxVal(args.pointType)} === "smooth" ? 2 : 1);` : ""}
            return { ok: true, name: _zz.name };
        `;
			}
		});
		registerOp({
			name: "shape.add_pucker_bloat",
			category: "shape",
			description: "Add Pucker & Bloat to a shape group (negative = pucker, positive = bloat).",
			params: [...shapeTargetParams(), {
				name: "amount",
				type: "number",
				description: "Amount % (-100..100)",
				required: false,
				default: 0
			}],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _pb = _grp.property("Contents").addProperty("ADBE Vector Filter - PB");
            _pb.property("ADBE Vector PuckerBloat Amount").setValue(${jsxVal(args.amount ?? 0)});
            return { ok: true, name: _pb.name };
        `;
			}
		});
		registerOp({
			name: "shape.add_twist",
			category: "shape",
			description: "Add Twist to a shape group.",
			params: [
				...shapeTargetParams(),
				{
					name: "angle",
					type: "number",
					description: "Twist angle in degrees",
					required: false,
					default: 90
				},
				{
					name: "center",
					type: "array",
					description: "Twist center [x, y]",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _tw = _grp.property("Contents").addProperty("ADBE Vector Filter - Twist");
            _tw.property("ADBE Vector Twist Angle").setValue(${jsxVal(args.angle ?? 90)});
            ${args.center !== void 0 ? `_tw.property("ADBE Vector Twist Center").setValue(${jsxVal(args.center)});` : ""}
            return { ok: true, name: _tw.name };
        `;
			}
		});
		registerOp({
			name: "shape.add_gradient_fill",
			category: "shape",
			description: "Add a Gradient Fill to a shape group. Type and start/end points are scriptable; color stops are NOT scriptable in AE (defaults to white-to-black — edit stops manually or via a preset).",
			params: [
				...shapeTargetParams(),
				{
					name: "gradientType",
					type: "string",
					description: "linear|radial (default linear)",
					required: false,
					default: "linear"
				},
				{
					name: "startPoint",
					type: "array",
					description: "Gradient start [x, y]",
					required: false
				},
				{
					name: "endPoint",
					type: "array",
					description: "Gradient end [x, y]",
					required: false
				},
				{
					name: "opacity",
					type: "number",
					description: "Opacity 0-100",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _gf = _grp.property("Contents").addProperty("ADBE Vector Graphic - G-Fill");
            _gf.property("ADBE Vector Grad Type").setValue(${jsxVal(args.gradientType ?? "linear")} === "radial" ? 2 : 1);
            ${args.startPoint !== void 0 ? `_gf.property("ADBE Vector Grad Start Pt").setValue(${jsxVal(args.startPoint)});` : ""}
            ${args.endPoint !== void 0 ? `_gf.property("ADBE Vector Grad End Pt").setValue(${jsxVal(args.endPoint)});` : ""}
            ${jsxGradientOpacity("_gf", "ADBE Vector Fill Opacity", args.opacity)}
            return { ok: true, name: _gf.name, note: "gradient color stops are not scriptable in AE" };
        `;
			}
		});
		registerOp({
			name: "shape.add_gradient_stroke",
			category: "shape",
			description: "Add a Gradient Stroke to a shape group. Type, points, and width are scriptable; color stops are NOT scriptable in AE.",
			params: [
				...shapeTargetParams(),
				{
					name: "gradientType",
					type: "string",
					description: "linear|radial (default linear)",
					required: false,
					default: "linear"
				},
				{
					name: "startPoint",
					type: "array",
					description: "Gradient start [x, y]",
					required: false
				},
				{
					name: "endPoint",
					type: "array",
					description: "Gradient end [x, y]",
					required: false
				},
				{
					name: "width",
					type: "number",
					description: "Stroke width",
					required: false,
					default: 2
				},
				{
					name: "opacity",
					type: "number",
					description: "Opacity 0-100",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _gs = _grp.property("Contents").addProperty("ADBE Vector Graphic - G-Stroke");
            _gs.property("ADBE Vector Grad Type").setValue(${jsxVal(args.gradientType ?? "linear")} === "radial" ? 2 : 1);
            ${args.startPoint !== void 0 ? `_gs.property("ADBE Vector Grad Start Pt").setValue(${jsxVal(args.startPoint)});` : ""}
            ${args.endPoint !== void 0 ? `_gs.property("ADBE Vector Grad End Pt").setValue(${jsxVal(args.endPoint)});` : ""}
            _gs.property("ADBE Vector Stroke Width").setValue(${jsxVal(args.width ?? 2)});
            ${jsxGradientOpacity("_gs", "ADBE Vector Stroke Opacity", args.opacity)}
            return { ok: true, name: _gs.name, note: "gradient color stops are not scriptable in AE" };
        `;
			}
		});
		registerOp({
			name: "shape.add_wiggle_transform",
			category: "shape",
			description: "Add Wiggle Transform to a shape group - randomizes position/scale/rotation over time (the transform-space sibling of Wiggle Paths).",
			params: [
				...shapeTargetParams(),
				{
					name: "wigglesPerSecond",
					type: "number",
					description: "Temporal frequency (default 2)",
					required: false,
					default: 2
				},
				{
					name: "correlation",
					type: "number",
					description: "Correlation % (0-100)",
					required: false
				},
				{
					name: "position",
					type: "array",
					description: "[x,y] wiggle amount in px",
					required: false
				},
				{
					name: "scale",
					type: "array",
					description: "[sx,sy] wiggle amount in %",
					required: false
				},
				{
					name: "rotation",
					type: "number",
					description: "Rotation wiggle amount in degrees",
					required: false
				},
				{
					name: "seed",
					type: "number",
					description: "Random seed",
					required: false
				}
			],
			toJsx(args) {
				const wigglerXfJsx = args.position === void 0 && args.scale === void 0 && args.rotation === void 0 ? "" : `var _wxf = _wt.property("ADBE Vector Wiggler Transform");
            if (!_wxf) return { ok: false, error: "no 'ADBE Vector Wiggler Transform' group on the added Wiggle Transform" };`;
				return `
            ${jsxCompLayerPreamble(args)}
            ${jsxShapeGroupPreamble(args)}
            var _contents = _grp.property("Contents");
            if (!_contents) return { ok: false, error: "shape group '" + _grp.name + "' has no Contents group" };
            var _wt = _contents.addProperty("ADBE Vector Filter - Wiggler");
            _wt.property("ADBE Vector Xform Temporal Freq").setValue(${jsxVal(args.wigglesPerSecond ?? 2)});
            ${args.correlation !== void 0 ? `_wt.property("ADBE Vector Correlation").setValue(${jsxVal(args.correlation)});` : ""}
            ${args.seed !== void 0 ? `_wt.property("ADBE Vector Random Seed").setValue(${jsxVal(args.seed)});` : ""}
            ${wigglerXfJsx}
            ${args.position !== void 0 ? `_wxf.property("ADBE Vector Wiggler Position").setValue(${jsxVal(args.position)});` : ""}
            ${args.scale !== void 0 ? `_wxf.property("ADBE Vector Wiggler Scale").setValue(${jsxVal(args.scale)});` : ""}
            ${args.rotation !== void 0 ? `_wxf.property("ADBE Vector Wiggler Rotation").setValue(${jsxVal(args.rotation)});` : ""}
            return { ok: true, name: _wt.name };
        `;
			}
		});
	})))();
}

// operations/text.js
function jsxDocSet(target, attr, value, note = "") {
	return `try { ${target}.${attr} = ${jsxVal(value)}; } catch(e) { _w.push("${attr}${note}: "+AE.errText(e)); }`;
}
function jsxDocEnumSet(target, attr, enumName, map, value, note = "") {
	return `
        try {
            var _em_${attr} = { ${Object.entries(map).map(([k, m]) => `"${k}": ${enumName}.${m}`).join(", ")} };
            if (_em_${attr}.hasOwnProperty(${jsxVal(value)})) { ${target}.${attr} = _em_${attr}[${jsxVal(value)}]; }
            else { _w.push("${attr}: unknown value " + ${jsxVal(value)}); }
        } catch(e) { _w.push("${attr}${note}: "+AE.errText(e)); }`;
}
function jsxTextStyleSets(args, target) {
	const sets = [];
	const simple = [
		["font", ""],
		["fontSize", ""],
		["fillColor", ""],
		["strokeColor", ""],
		["strokeWidth", ""],
		["tracking", ""],
		["leading", ""],
		["applyFill", ""],
		["applyStroke", ""],
		["strokeOverFill", ""],
		["baselineShift", ""],
		["autoLeading", ""],
		["fauxBold", AE24],
		["fauxItalic", AE24],
		["horizontalScale", AE24],
		["verticalScale", AE24],
		["tsume", AE24],
		["kerning", AE24],
		["ligature", AE24],
		["noBreak", AE24],
		["autoHyphenate", AE24],
		["everyLineComposer", AE24],
		["hangingRoman", AE24],
		["firstLineIndent", AE24],
		["startIndent", AE24],
		["endIndent", AE24],
		["spaceBefore", AE24],
		["spaceAfter", AE24]
	];
	for (const [attr, note] of simple) if (args[attr] !== void 0) sets.push(jsxDocSet(target, attr, args[attr], note));
	if (args.justification !== void 0) sets.push(jsxDocEnumSet(target, "justification", "ParagraphJustification", {
		left: "LEFT_JUSTIFY",
		center: "CENTER_JUSTIFY",
		right: "RIGHT_JUSTIFY",
		fullLeft: "FULL_JUSTIFY_LASTLINE_LEFT",
		fullCenter: "FULL_JUSTIFY_LASTLINE_CENTER",
		fullRight: "FULL_JUSTIFY_LASTLINE_RIGHT",
		fullLastLineFull: "FULL_JUSTIFY_LASTLINE_FULL"
	}, args.justification));
	if (args.allCaps !== void 0 || args.smallCaps !== void 0) {
		const caps = args.allCaps ? "FONT_ALL_CAPS" : args.smallCaps ? "FONT_SMALL_CAPS" : "FONT_NORMAL_CAPS";
		sets.push(`try { ${target}.fontCapsOption = FontCapsOption.${caps}; } catch(e) { _w.push("allCaps/smallCaps${AE24}: "+AE.errText(e)); }`);
	}
	if (args.autoKernType !== void 0) sets.push(jsxDocEnumSet(target, "autoKernType", "AutoKernType", {
		none: "NO_AUTO_KERN",
		metric: "METRIC_KERN",
		optical: "OPTICAL_KERN"
	}, args.autoKernType, AE24));
	if (args.fontBaselineOption !== void 0) sets.push(jsxDocEnumSet(target, "fontBaselineOption", "FontBaselineOption", {
		normal: "FONT_NORMAL_BASELINE",
		superscript: "FONT_FAUXED_SUPERSCRIPT",
		subscript: "FONT_FAUXED_SUBSCRIPT"
	}, args.fontBaselineOption, AE24));
	if (args.baselineDirection !== void 0) sets.push(jsxDocEnumSet(target, "baselineDirection", "BaselineDirection", {
		withStream: "BASELINE_WITH_STREAM",
		verticalRotated: "BASELINE_VERTICAL_ROTATED",
		verticalCrossStream: "BASELINE_VERTICAL_CROSS_STREAM"
	}, args.baselineDirection, AE24));
	if (args.direction !== void 0) sets.push(jsxDocEnumSet(target, "direction", "ParagraphDirection", {
		leftToRight: "DIRECTION_LEFT_TO_RIGHT",
		rightToLeft: "DIRECTION_RIGHT_TO_LEFT"
	}, args.direction, AE24));
	if (args.leadingType !== void 0) sets.push(jsxDocEnumSet(target, "leadingType", "LeadingType", {
		roman: "ROMAN_LEADING_TYPE",
		japanese: "JAPANESE_LEADING_TYPE"
	}, args.leadingType, AE24));
	if (args.lineJoinType !== void 0) sets.push(jsxDocEnumSet(target, "lineJoinType", "LineJoinType", {
		miter: "LINE_JOIN_MITER",
		round: "LINE_JOIN_ROUND",
		bevel: "LINE_JOIN_BEVEL"
	}, args.lineJoinType, AE24));
	if (args.digitSet !== void 0) sets.push(jsxDocEnumSet(target, "digitSet", "DigitSet", {
		default: "DEFAULT_DIGITS",
		arabic: "ARABIC_DIGITS",
		hindi: "HINDI_DIGITS",
		farsi: "FARSI_DIGITS",
		arabicRtl: "ARABIC_DIGITS_RTL"
	}, args.digitSet, AE24));
	if (args.composerEngine !== void 0) sets.push(jsxDocEnumSet(target, "composerEngine", "ComposerEngine", {
		latinCjk: "LATIN_CJK_ENGINE",
		universalType: "UNIVERSAL_TYPE_ENGINE"
	}, args.composerEngine, AE24));
	if (args.lineOrientation !== void 0) sets.push(jsxDocEnumSet(target, "lineOrientation", "LineOrientation", {
		horizontal: "HORIZONTAL",
		verticalRtl: "VERTICAL_RIGHT_TO_LEFT",
		verticalLtr: "VERTICAL_LEFT_TO_RIGHT"
	}, args.lineOrientation, " (AE 24.2+)"));
	return sets.join("\n");
}
var AE24, TEXT_STYLE_PARAMS;
function init_text() {
	return (init_text = __esmMin((() => {
		init_registry();
		registerOp({
			name: "text.set_content",
			category: "text",
			description: "Set the text content of a text layer.",
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
					description: "1-based layer index or name (must be a TextLayer)",
					required: true
				},
				{
					name: "text",
					type: "string",
					description: "New text string",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            if (!(_layer instanceof TextLayer)) return { ok: false, error: "layer is not a TextLayer" };
            var _src = _layer.property("Source Text");
            var _doc = _src.value;
            _doc.text = ${jsxVal(args.text)};
            _src.setValue(_doc);
            return { ok: true, text: _doc.text };
        `;
			}
		});
		AE24 = " (AE 24.0+)";
		TEXT_STYLE_PARAMS = [
			{
				name: "font",
				type: "string",
				description: "Font postscript name (e.g. 'Arial-BoldMT')",
				required: false
			},
			{
				name: "fontSize",
				type: "number",
				description: "Font size in px",
				required: false
			},
			{
				name: "fillColor",
				type: "array",
				description: "[r,g,b] 0-1",
				required: false
			},
			{
				name: "strokeColor",
				type: "array",
				description: "[r,g,b] 0-1",
				required: false
			},
			{
				name: "strokeWidth",
				type: "number",
				description: "Stroke width in px",
				required: false
			},
			{
				name: "tracking",
				type: "number",
				description: "Tracking value",
				required: false
			},
			{
				name: "leading",
				type: "number",
				description: "Leading (line spacing) in px",
				required: false
			},
			{
				name: "applyFill",
				type: "boolean",
				description: "Enable fill",
				required: false
			},
			{
				name: "applyStroke",
				type: "boolean",
				description: "Enable stroke",
				required: false
			},
			{
				name: "strokeOverFill",
				type: "boolean",
				description: "Render stroke over fill",
				required: false
			},
			{
				name: "justification",
				type: "string",
				description: "left|center|right|fullLeft|fullCenter|fullRight|fullLastLineFull",
				required: false
			},
			{
				name: "baselineShift",
				type: "number",
				description: "Baseline shift in px",
				required: false
			},
			{
				name: "autoLeading",
				type: "boolean",
				description: "Use auto leading",
				required: false
			},
			{
				name: "allCaps",
				type: "boolean",
				description: "All caps via fontCapsOption (setter needs AE 24.0+)",
				required: false
			},
			{
				name: "smallCaps",
				type: "boolean",
				description: "Small caps via fontCapsOption (setter needs AE 24.0+)",
				required: false
			},
			{
				name: "fauxBold",
				type: "boolean",
				description: "Faux bold (setter needs AE 24.0+)",
				required: false
			},
			{
				name: "fauxItalic",
				type: "boolean",
				description: "Faux italic (setter needs AE 24.0+)",
				required: false
			},
			{
				name: "horizontalScale",
				type: "number",
				description: "Horizontal scale (1 = 100%, setter needs AE 24.0+)",
				required: false
			},
			{
				name: "verticalScale",
				type: "number",
				description: "Vertical scale (1 = 100%, setter needs AE 24.0+)",
				required: false
			},
			{
				name: "tsume",
				type: "number",
				description: "Tsume (normalized 0-1, CJK spacing, setter needs AE 24.0+)",
				required: false
			},
			{
				name: "kerning",
				type: "number",
				description: "Manual kerning amount (AE 24.0+)",
				required: false
			},
			{
				name: "autoKernType",
				type: "string",
				description: "none|metric|optical (AE 24.0+)",
				required: false
			},
			{
				name: "ligature",
				type: "boolean",
				description: "Enable ligatures (AE 24.0+)",
				required: false
			},
			{
				name: "noBreak",
				type: "boolean",
				description: "Prevent line breaks (AE 24.0+)",
				required: false
			},
			{
				name: "autoHyphenate",
				type: "boolean",
				description: "Paragraph auto-hyphenation (AE 24.0+)",
				required: false
			},
			{
				name: "everyLineComposer",
				type: "boolean",
				description: "true=Every-Line Composer, false=Single-Line (AE 24.0+)",
				required: false
			},
			{
				name: "hangingRoman",
				type: "boolean",
				description: "Roman hanging punctuation (burasagari, AE 24.0+)",
				required: false
			},
			{
				name: "firstLineIndent",
				type: "number",
				description: "Paragraph first-line indent in px (AE 24.0+)",
				required: false
			},
			{
				name: "startIndent",
				type: "number",
				description: "Paragraph start indent in px (AE 24.0+)",
				required: false
			},
			{
				name: "endIndent",
				type: "number",
				description: "Paragraph end indent in px (AE 24.0+)",
				required: false
			},
			{
				name: "spaceBefore",
				type: "number",
				description: "Paragraph space before in px (AE 24.0+)",
				required: false
			},
			{
				name: "spaceAfter",
				type: "number",
				description: "Paragraph space after in px (AE 24.0+)",
				required: false
			},
			{
				name: "fontBaselineOption",
				type: "string",
				description: "normal|superscript|subscript (AE 24.0+)",
				required: false
			},
			{
				name: "baselineDirection",
				type: "string",
				description: "withStream|verticalRotated|verticalCrossStream (tate-chu-yoko, AE 24.0+)",
				required: false
			},
			{
				name: "direction",
				type: "string",
				description: "leftToRight|rightToLeft paragraph direction (AE 24.0+)",
				required: false
			},
			{
				name: "leadingType",
				type: "string",
				description: "roman|japanese leading model (AE 24.0+)",
				required: false
			},
			{
				name: "lineJoinType",
				type: "string",
				description: "miter|round|bevel stroke joins (AE 24.0+)",
				required: false
			},
			{
				name: "digitSet",
				type: "string",
				description: "default|arabic|hindi|farsi|arabicRtl (AE 24.0+)",
				required: false
			},
			{
				name: "composerEngine",
				type: "string",
				description: "latinCjk|universalType (AE 24.0+; universalType needed for RTL)",
				required: false
			},
			{
				name: "lineOrientation",
				type: "string",
				description: "horizontal|verticalRtl|verticalLtr (whole document only, AE 24.2+)",
				required: false
			}
		];
		registerOp({
			name: "text.set_style",
			category: "text",
			description: "Set text styling on the whole document: font, fontSize, colors, tracking, leading, justification, caps, kerning, ligatures, paragraph indents/spacing, RTL direction, vertical baselines, digit set, and more. For a sub-range use text.set_style_range.",
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
				...TEXT_STYLE_PARAMS
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            if (!(_layer instanceof TextLayer)) return { ok: false, error: "not a TextLayer" };
            var _src = _layer.property("Source Text");
            var _doc = _src.value;
            var _w = [];
            ${jsxTextStyleSets(args, "_doc")}
            _src.setValue(_doc);
            return { ok: true, warnings: _w };
        `;
			}
		});
		registerOp({
			name: "text.set_style_range",
			category: "text",
			description: "Style a SUB-RANGE of a text layer (AE 24.3+): same attributes as text.set_style, applied to characters, paragraphs, or composed lines. Whole-document-only attributes (lineOrientation) are rejected by AE with a warning.",
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
					name: "rangeType",
					type: "string",
					description: "characters|paragraphs|lines (default characters)",
					required: false,
					default: "characters"
				},
				{
					name: "start",
					type: "number",
					description: "0-based start index (character, paragraph, or composed line)",
					required: true
				},
				{
					name: "end",
					type: "number",
					description: "Exclusive end index. Default: characters → end of text; paragraphs/lines → start+1",
					required: false
				},
				...TEXT_STYLE_PARAMS
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            if (!(_layer instanceof TextLayer)) return { ok: false, error: "not a TextLayer" };
            var _src = _layer.property("Source Text");
            var _doc = _src.value;
            if (typeof _doc.characterRange !== "function") return { ok: false, error: "text ranges need AE 24.3+" };
            var _rt = ${jsxVal(args.rangeType ?? "characters")};
            var _start = ${jsxVal(args.start)};
            var _end = ${jsxVal(args.end ?? null)};
            var _range = null;
            try {
                if (_rt === "characters") {
                    if (_end === null) _end = _doc.text.length;
                    _range = _doc.characterRange(_start, _end);
                } else if (_rt === "paragraphs") {
                    if (_end === null) _end = _start + 1;
                    _range = _doc.paragraphRange(_start, _end).characterRange();
                } else if (_rt === "lines") {
                    if (_end === null) _end = _start + 1;
                    _range = _doc.composedLineRange(_start, _end).characterRange();
                } else {
                    return { ok: false, error: "rangeType must be characters|paragraphs|lines" };
                }
            } catch (eRg) { return { ok: false, error: "range lookup failed: " + AE.errText(eRg) }; }
            if (!_range) return { ok: false, error: "range lookup returned nothing" };
            if (_range.isRangeValid === false) return { ok: false, error: "range is not valid for this text" };
            var _cs = AE.safeGet(function () { return _range.characterStart; }, null);
            var _ce = AE.safeGet(function () { return _range.characterEnd; }, null);
            var _w = [];
            ${jsxTextStyleSets(args, "_range")}
            _src.setValue(_doc);
            return { ok: true, characterStart: _cs, characterEnd: _ce, warnings: _w };
        `;
			}
		});
		registerOp({
			name: "text.measure",
			category: "text",
			readOnly: true,
			description: "Measure a text layer's composed layout: line/paragraph counts and character spans, per-line baselines (baselineLocs), box overflow. Range data needs AE 24.3+; missing fields come back null.",
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
            if (!(_layer instanceof TextLayer)) return { ok: false, error: "not a TextLayer" };
            var _doc = _layer.property("Source Text").value;
            var _out = { ok: true };
            _out.text = _doc.text;
            _out.boxText = AE.safeGet(function () { return _doc.boxText; }, false);
            _out.fontFamily = AE.safeGet(function () { return _doc.fontFamily; }, null);
            _out.fontStyle = AE.safeGet(function () { return _doc.fontStyle; }, null);
            _out.fontLocation = AE.safeGet(function () { return _doc.fontLocation; }, null);
            _out.composedLineCount = AE.safeGet(function () { return _doc.composedLineCount; }, null);
            _out.paragraphCount = AE.safeGet(function () { return _doc.paragraphCount; }, null);
            _out.baselineLocs = AE.safeGet(function () { return AE.valueToJson(_doc.baselineLocs); }, null);
            if (_out.boxText) {
                _out.boxTextSize = AE.safeGet(function () { return AE.valueToJson(_doc.boxTextSize); }, null);
                _out.boxTextPos = AE.safeGet(function () { return AE.valueToJson(_doc.boxTextPos); }, null);
                _out.boxOverflow = AE.safeGet(function () { return _doc.boxOverflow; }, null);
            }
            var _lines = [];
            try {
                var _n = _doc.composedLineCount;
                for (var _li2 = 0; _li2 < _n; _li2++) {
                    var _cr = _doc.composedLineRange(_li2, _li2 + 1);
                    var _lcs = _cr.characterStart;
                    var _lce = _cr.characterEnd;
                    _lines.push({ index: _li2, characterStart: _lcs, characterEnd: _lce, text: _doc.text.substring(_lcs, _lce) });
                }
            } catch (eLn) {}
            _out.lines = _lines;
            var _paras = [];
            try {
                var _np = _doc.paragraphCount;
                for (var _pi2 = 0; _pi2 < _np; _pi2++) {
                    var _pr = _doc.paragraphRange(_pi2, _pi2 + 1);
                    _paras.push({ index: _pi2, characterStart: _pr.characterStart, characterEnd: _pr.characterEnd });
                }
            } catch (ePa) {}
            _out.paragraphs = _paras;
            return _out;
        `;
			}
		});
		registerOp({
			name: "text.set_box",
			category: "text",
			description: "Resize, reposition, or configure the box of a paragraph (box) text layer, including the AE 24.6 auto-fit and alignment controls. Point<->box conversion is NOT scriptable in AE — create the layer as box text from the start (layer.create_text with boxSize).",
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
					name: "boxSize",
					type: "array",
					description: "[width, height] of the text box",
					required: false
				},
				{
					name: "boxPosition",
					type: "array",
					description: "[x, y] top-left of the box in layer space (AE 14.0+)",
					required: false
				},
				{
					name: "autoFitPolicy",
					type: "string",
					description: "none|heightCursor|heightPreciseBounds|heightBaseline (AE 24.6+)",
					required: false
				},
				{
					name: "verticalAlignment",
					type: "string",
					description: "top|center|bottom|justify (AE 24.6+)",
					required: false
				},
				{
					name: "firstBaselineAlignment",
					type: "string",
					description: "ascent|capHeight|emBox|leading|xHeight|legacyMetric|minimumValueAsian|minimumValueRoman|typoAscent (AE 24.6+)",
					required: false
				},
				{
					name: "firstBaselineAlignmentMinimum",
					type: "number",
					description: "Manual minimum offset of the first composed line (AE 24.6+)",
					required: false
				},
				{
					name: "insetSpacing",
					type: "number",
					description: "Inset spacing between box bounds and text, px (AE 24.6+)",
					required: false
				}
			],
			toJsx(args) {
				const sets = [];
				if (args.boxSize !== void 0) sets.push(`try { _doc.boxTextSize = ${jsxVal(args.boxSize)}; } catch (eBs) { _w.push("boxTextSize: " + AE.errText(eBs)); }`);
				if (args.boxPosition !== void 0) sets.push(`try { _doc.boxTextPos = ${jsxVal(args.boxPosition)}; } catch (eBp) { _w.push("boxTextPos (AE 14.0+): " + AE.errText(eBp)); }`);
				const AE246 = " (AE 24.6+)";
				if (args.autoFitPolicy !== void 0) sets.push(jsxDocEnumSet("_doc", "boxAutoFitPolicy", "BoxAutoFitPolicy", {
					none: "NONE",
					heightCursor: "HEIGHT_CURSOR",
					heightPreciseBounds: "HEIGHT_PRECISE_BOUNDS",
					heightBaseline: "HEIGHT_BASELINE"
				}, args.autoFitPolicy, AE246));
				if (args.verticalAlignment !== void 0) sets.push(jsxDocEnumSet("_doc", "boxVerticalAlignment", "BoxVerticalAlignment", {
					top: "TOP",
					center: "CENTER",
					bottom: "BOTTOM",
					justify: "JUSTIFY"
				}, args.verticalAlignment, AE246));
				if (args.firstBaselineAlignment !== void 0) sets.push(jsxDocEnumSet("_doc", "boxFirstBaselineAlignment", "BoxFirstBaselineAlignment", {
					ascent: "ASCENT",
					capHeight: "CAP_HEIGHT",
					emBox: "EM_BOX",
					leading: "LEADING",
					xHeight: "X_HEIGHT",
					legacyMetric: "LEGACY_METRIC",
					minimumValueAsian: "MINIMUM_VALUE_ASIAN",
					minimumValueRoman: "MINIMUM_VALUE_ROMAN",
					typoAscent: "TYPO_ASCENT"
				}, args.firstBaselineAlignment, AE246));
				if (args.firstBaselineAlignmentMinimum !== void 0) sets.push(jsxDocSet("_doc", "boxFirstBaselineAlignmentMinimum", args.firstBaselineAlignmentMinimum, AE246));
				if (args.insetSpacing !== void 0) sets.push(jsxDocSet("_doc", "boxInsetSpacing", args.insetSpacing, AE246));
				return `
            ${jsxCompLayerPreamble(args)}
            if (!(_layer instanceof TextLayer)) return { ok: false, error: "not a TextLayer" };
            var _src = _layer.property("Source Text");
            var _doc = _src.value;
            if (!_doc.boxText) return { ok: false, error: "layer is point text, not box text \u2014 conversion is not scriptable in AE" };
            var _w = [];
            ${sets.join("\n")}
            _src.setValue(_doc);
            var _out = _src.value;
            return { ok: true, boxText: _out.boxText, boxTextSize: [_out.boxTextSize[0], _out.boxTextSize[1]], boxOverflow: AE.safeGet(function () { return _out.boxOverflow; }, null), warnings: _w };
        `;
			}
		});
		registerOp({
			name: "text.set_variable_font",
			category: "text",
			description: `Set variable-font design axes on a text layer (AE 24.0+). axes maps axis tags to values, e.g. { "wght": 700, "wdth": 85 }. Unspecified axes keep their current values. Discover a font's axes with font.info (designAxesData).`,
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
					name: "axes",
					type: "object",
					description: "Axis tag -> value map, e.g. { \"wght\": 700 }",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            if (!(_layer instanceof TextLayer)) return { ok: false, error: "not a TextLayer" };
            var _src = _layer.property("Source Text");
            var _doc = _src.value;
            var _fo = null;
            try { _fo = _doc.fontObject; } catch (eFo) {}
            if (!_fo) return { ok: false, error: "TextDocument.fontObject needs AE 24.0+" };
            if (!_fo.hasDesignAxes) return { ok: false, error: "font '" + _fo.postScriptName + "' is not a variable font" };
            var _axes = ${jsxVal(args.axes)};
            var _data = _fo.designAxesData;
            var _vec = [];
            try {
                var _cur = _fo.designVector;
                for (var _i = 0; _i < _data.length; _i++) _vec.push(_cur[_i]);
            } catch (eCv) {
                // designVector unavailable \u2014 each axis keeps its documented
                // default. Subscripted: \`default\` is a reserved word in ES3.
                for (var _i2 = 0; _i2 < _data.length; _i2++) {
                    var _dflt = _data[_i2]["default"];
                    _vec.push(typeof _dflt === "number" ? _dflt : _data[_i2].min);
                }
            }
            var _w = [];
            var _known = {};
            for (var _di = 0; _di < _data.length; _di++) {
                var _ax = _data[_di];
                _known[_ax.tag] = true;
                if (_axes.hasOwnProperty(_ax.tag)) {
                    var _v = _axes[_ax.tag];
                    if (typeof _v !== "number") { _w.push(_ax.tag + ": value must be a number"); continue; }
                    if (_v < _ax.min || _v > _ax.max) _w.push(_ax.tag + ": " + _v + " outside [" + _ax.min + ", " + _ax.max + "] \u2014 AE may clamp");
                    _vec[_di] = _v;
                }
            }
            for (var _tag in _axes) {
                if (_axes.hasOwnProperty(_tag) && _known[_tag] !== true) _w.push(_tag + ": no such axis on this font");
            }
            var _ps = null;
            try { _ps = _fo.postScriptNameForDesignVector(_vec); } catch (ePs) { return { ok: false, error: "postScriptNameForDesignVector failed: " + AE.errText(ePs) }; }
            _doc.font = _ps;
            _src.setValue(_doc);
            return { ok: true, postScriptName: _ps, vector: AE.valueToJson(_vec), warnings: _w };
        `;
			}
		});
		registerOp({
			name: "text.add_font_axis",
			category: "text",
			description: "Add a variable-font axis property to a text animator (PropertyGroup.addVariableFontAxis, AE 26.0+) so the axis can be animated/keyframed. Targets an existing animator by 1-based index or name, or creates a new one.",
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
					name: "axisTag",
					type: "string",
					description: "Four-character axis tag, e.g. 'wght'",
					required: true
				},
				{
					name: "animator",
					type: "any",
					description: "Existing animator (1-based index or name). Omit to create a new animator.",
					required: false
				},
				{
					name: "value",
					type: "number",
					description: "Initial axis value",
					required: false
				}
			],
			toJsx(args) {
				const valueJsx = args.value === void 0 ? "" : `try { _axis.setValue(${jsxVal(args.value)}); } catch (eV) { _w.push("value: " + AE.errText(eV)); }`;
				return `
            ${jsxCompLayerPreamble(args)}
            if (!(_layer instanceof TextLayer)) return { ok: false, error: "not a TextLayer" };
            var _animators = _layer.property("ADBE Text Properties").property("ADBE Text Animators");
            if (!_animators) return { ok: false, error: "no Animators group on layer" };
            var _animArg = ${jsxVal(args.animator ?? null)};
            var _anim = null;
            if (_animArg === null) {
                _anim = _animators.addProperty("ADBE Text Animator");
            } else {
                try { _anim = _animators.property(_animArg); } catch (eA) {}
                if (!_anim) return { ok: false, error: "no animator matching " + _animArg };
            }
            var _animProps = _anim.property("ADBE Text Animator Properties");
            if (typeof _animProps.addVariableFontAxis !== "function") return { ok: false, error: "addVariableFontAxis needs AE 26.0+" };
            var _axis = null;
            try { _axis = _animProps.addVariableFontAxis(${jsxVal(args.axisTag)}); } catch (eAx) { return { ok: false, error: "addVariableFontAxis failed: " + AE.errText(eAx) }; }
            var _w = [];
            ${valueJsx}
            return { ok: true, animator: _anim.name, axis: AE.safeGet(function () { return _axis.name; }, ${jsxVal(args.axisTag)}), warnings: _w };
        `;
			}
		});
		registerOp({
			name: "text.add_animator",
			category: "text",
			description: "Add a text animator with animated properties and a selector. properties maps animator matchNames to initial values, e.g. {\"ADBE Text Position 3D\": [0,-50,0], \"ADBE Text Opacity\": 0}. Common: Position 3D, Scale 3D, Rotation, Opacity, Fill Color, Tracking Amount, Blur.",
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
					description: "1-based layer index, or the layer name (must be a TextLayer)",
					required: true
				},
				{
					name: "name",
					type: "string",
					description: "Animator name",
					required: false
				},
				{
					name: "properties",
					type: "object",
					description: "Map of animator-property matchName to initial value",
					required: true
				},
				{
					name: "selector",
					type: "string",
					description: "range|wiggly|expression|none (default range)",
					required: false,
					default: "range"
				},
				{
					name: "rangeStart",
					type: "number",
					description: "Range selector start % (0-100)",
					required: false
				},
				{
					name: "rangeEnd",
					type: "number",
					description: "Range selector end % (0-100)",
					required: false
				},
				{
					name: "rangeOffset",
					type: "number",
					description: "Range selector offset % (-100..100)",
					required: false
				}
			],
			toJsx(args) {
				const renameJsx = args.name ? `try { _anim.name = ${jsxVal(args.name)}; } catch (eN) {}` : "";
				const rangeSets = [];
				if (args.rangeStart !== void 0) rangeSets.push(`try { _sel.property("ADBE Text Percent Start").setValue(${jsxVal(args.rangeStart)}); } catch (eRs) { _w.push("rangeStart: " + AE.errText(eRs)); }`);
				if (args.rangeEnd !== void 0) rangeSets.push(`try { _sel.property("ADBE Text Percent End").setValue(${jsxVal(args.rangeEnd)}); } catch (eRe) { _w.push("rangeEnd: " + AE.errText(eRe)); }`);
				if (args.rangeOffset !== void 0) rangeSets.push(`try { _sel.property("ADBE Text Percent Offset").setValue(${jsxVal(args.rangeOffset)}); } catch (eRo) { _w.push("rangeOffset: " + AE.errText(eRo)); }`);
				return `
            ${jsxCompLayerPreamble(args)}
            if (!(_layer instanceof TextLayer)) return { ok: false, error: "not a TextLayer" };
            var _animators = _layer.property("ADBE Text Properties").property("ADBE Text Animators");
            if (!_animators) return { ok: false, error: "no Animators group on layer" };
            var _anim = _animators.addProperty("ADBE Text Animator");
            ${renameJsx}
            var _w = [];
            var _props = ${jsxVal(args.properties)};
            var _animProps = _anim.property("ADBE Text Animator Properties");
            var _added = [];
            for (var _k in _props) {
                if (!_props.hasOwnProperty(_k)) continue;
                try {
                    var _ap = _animProps.addProperty(_k);
                    if (_props[_k] !== null) _ap.setValue(_props[_k]);
                    _added.push(_k);
                } catch (eAp) { _w.push(_k + ": " + AE.errText(eAp)); }
            }
            var _selType = ${jsxVal(args.selector ?? "range")};
            var _selName = null;
            if (_selType !== "none") {
                try {
                    var _selectors = _anim.property("ADBE Text Selectors");
                    var _selMn = "ADBE Text Selector";
                    if (_selType === "wiggly") _selMn = "ADBE Text Wiggly Selector";
                    else if (_selType === "expression") _selMn = "ADBE Text Expressible Selector";
                    var _sel = _selectors.addProperty(_selMn);
                    _selName = _sel.name;
                    if (_selType === "range") {
                        ${rangeSets.join("\n")}
                    }
                } catch (eSel) { _w.push("selector: " + AE.errText(eSel)); }
            }
            return { ok: true, animator: _anim.name, animatorIndex: _anim.propertyIndex, addedProperties: _added, selector: _selName, warnings: _w };
        `;
			}
		});
		registerOp({
			name: "text.paste_range",
			category: "text",
			description: "Paste the TEXT AND STYLING of one character range into another (CharacterRange.pasteFrom, AE 25.1+) — replaces the target range's content. Source defaults to the same layer; pass sourceLayer to copy across layers.",
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
					description: "TARGET text layer (1-based index or name)",
					required: true
				},
				{
					name: "start",
					type: "number",
					description: "Target range start (0-based character index)",
					required: true
				},
				{
					name: "end",
					type: "number",
					description: "Target range end (exclusive; default: end of text)",
					required: false
				},
				{
					name: "sourceLayer",
					type: "any",
					description: "SOURCE text layer (default: same as layer)",
					required: false
				},
				{
					name: "sourceStart",
					type: "number",
					description: "Source range start (0-based character index)",
					required: true
				},
				{
					name: "sourceEnd",
					type: "number",
					description: "Source range end (exclusive; default: end of source text)",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            if (!(_layer instanceof TextLayer)) return { ok: false, error: "not a TextLayer" };
            var _srcLayerArg = ${jsxVal(args.sourceLayer ?? null)};
            var _srcLayer = _srcLayerArg === null ? _layer : AE.findLayerInComp(_comp, _srcLayerArg);
            if (!_srcLayer) return { ok: false, error: "no source layer matching " + String(_srcLayerArg) };
            if (!(_srcLayer instanceof TextLayer)) return { ok: false, error: "source layer is not a TextLayer" };
            var _tgtProp = _layer.property("Source Text");
            var _tgtDoc = _tgtProp.value;
            var _srcDoc = _srcLayer === _layer ? _tgtDoc : _srcLayer.property("Source Text").value;
            if (typeof _tgtDoc.characterRange !== "function") return { ok: false, error: "text ranges need AE 24.3+" };
            var _tStart = ${jsxVal(args.start)};
            var _tEnd = ${jsxVal(args.end ?? null)};
            if (_tEnd === null) _tEnd = _tgtDoc.text.length;
            var _sStart = ${jsxVal(args.sourceStart)};
            var _sEnd = ${jsxVal(args.sourceEnd ?? null)};
            if (_sEnd === null) _sEnd = _srcDoc.text.length;
            // pasteFrom on overlapping ranges of the SAME document mutates the
            // source while it is being read \u2014 refuse instead of corrupting.
            if (_srcDoc === _tgtDoc && _sStart < _tEnd && _tStart < _sEnd) {
                return { ok: false, error: "source and target ranges overlap in the same text document \u2014 use non-overlapping ranges or a separate source layer" };
            }
            var _tgt = null;
            var _src = null;
            try {
                _tgt = _tgtDoc.characterRange(_tStart, _tEnd);
                _src = _srcDoc.characterRange(_sStart, _sEnd);
            } catch (eRg) { return { ok: false, error: "range lookup failed: " + AE.errText(eRg) }; }
            if (typeof _tgt.pasteFrom !== "function") return { ok: false, error: "pasteFrom needs AE 25.1+" };
            try { _tgt.pasteFrom(_src); } catch (eP) { return { ok: false, error: "pasteFrom failed: " + AE.errText(eP) }; }
            _tgtProp.setValue(_tgtDoc);
            return { ok: true, text: _tgtProp.value.text };
        `;
			}
		});
		registerOp({
			name: "text.reset_style",
			category: "text",
			description: "Reset a text layer's styling to the default Character and/or Paragraph panel settings (TextDocument.resetCharStyle / resetParagraphStyle).",
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
					name: "scope",
					type: "string",
					description: "character|paragraph|both (default both)",
					required: false,
					default: "both"
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            if (!(_layer instanceof TextLayer)) return { ok: false, error: "not a TextLayer" };
            var _scope = ${jsxVal(args.scope ?? "both")};
            if (_scope !== "character" && _scope !== "paragraph" && _scope !== "both") return { ok: false, error: "scope must be character|paragraph|both" };
            var _src = _layer.property("Source Text");
            var _doc = _src.value;
            var _w = [];
            if (_scope === "character" || _scope === "both") {
                try { _doc.resetCharStyle(); } catch (eC) { _w.push("resetCharStyle: " + AE.errText(eC)); }
            }
            if (_scope === "paragraph" || _scope === "both") {
                try { _doc.resetParagraphStyle(); } catch (eP) { _w.push("resetParagraphStyle: " + AE.errText(eP)); }
            }
            _src.setValue(_doc);
            return { ok: true, scope: _scope, warnings: _w };
        `;
			}
		});
	})))();
}

// operations/render.js
function jsxRqItemPreamble(args) {
	return `
        var rq = app.project.renderQueue;
        if (rq.numItems === 0) return { ok: false, error: "render queue is empty" };
        var _qi = ${jsxVal(args.queueIndex ?? null)};
        if (_qi === null) _qi = rq.numItems;
        if (_qi < 1 || _qi > rq.numItems) return { ok: false, error: "queue index out of range (1-" + rq.numItems + ")" };
        var _rqi = rq.item(_qi);
    `;
}
function chooseDeliveryTemplate(preset, templates) {
	const p = DELIVERY_PRESETS[preset];
	if (!p) return { error: `no preset '${preset}'; presets: ${Object.keys(DELIVERY_PRESETS).join(", ")}` };
	const movies = templates.filter((t) => !isSequenceTemplate(t));
	const find = (rules) => {
		for (const r of rules) {
			const hit = movies.find((t) => typeof r === "string" ? t === r : r.test(t));
			if (hit) return hit;
		}
		return null;
	};
	if (movies.includes(p.first)) return {
		template: p.first,
		fallback: false,
		why: `${p.first}: ${p.what}`
	};
	const near = find(p.then);
	if (near) return {
		template: near,
		fallback: false,
		why: `${near} (${p.first} is not on this install): ${p.what}`
	};
	const fb = find(p.fallback);
	if (fb) return {
		template: fb,
		fallback: true,
		why: `${fb}: ${p.fallbackWhy}`
	};
	return { error: p.alpha ? `no movie template with alpha on this install (templates: ${templates.join(", ")}); make one in Edit > Templates > Output Module (QuickTime, Apple ProRes 4444, RGB + Alpha)` : `none of the templates this preset uses is on this install (templates: ${templates.join(", ")})` };
}
function checkDelivered(comp, file) {
	const findings = [];
	if (comp.width !== file.width || comp.height !== file.height) findings.push({
		kind: "size",
		reading: `The file is ${file.width} \xD7 ${file.height}; the comp is ${comp.width} \xD7 ${comp.height}.`
	});
	if (Math.abs(comp.frameRate - file.frameRate) > .01) findings.push({
		kind: "frame rate",
		reading: `The file runs at ${file.frameRate} fps; the comp at ${comp.frameRate}.`
	});
	if (Math.abs(comp.duration - file.duration) > .5 / (comp.frameRate || 30)) findings.push({
		kind: "duration",
		reading: `The file is ${file.duration.toFixed(3)} s; the comp is ${comp.duration.toFixed(3)} s.`
	});
	let sound;
	const lv = file.level;
	if (comp.hasSound) {
		const who = comp.soundLayers.length ? ` (${comp.soundLayers.slice(0, 3).join(", ")})` : "";
		if (!file.hasAudio) {
			findings.push({
				kind: "sound missing",
				reading: `The comp has sound${who} but the file has no sound track: check the output module's audio setting.`
			});
			sound = "no sound track";
		} else if (lv && (lv.source === "ffmpeg" && lv.maxDb <= -60 || lv.source === "After Effects" && lv.top < .1)) {
			const measured = lv.source === "ffmpeg" ? "max " + lv.maxDb + " dB" : "amplitude " + lv.top;
			findings.push({
				kind: "sound silent",
				reading: `The comp has sound${who} but the file's sound reads as silence (${measured}). A four-channel take has read as silence in After Effects with no warning: extract the voice to a mono WAV, use it in the comp, and deliver again.`
			});
			sound = "silent";
		} else if (lv && lv.source === "ffmpeg") sound = "sound at a mean of " + lv.meanDb + " dB (max " + lv.maxDb + " dB, ffmpeg)";
		else if (lv && lv.source === "After Effects") sound = "sound present (amplitude up to " + lv.top + ", After Effects)";
		else sound = "a sound track, whose level was not read (no ffmpeg, and After Effects could not read it)";
		const sync = file.sync;
		if (file.hasAudio && sync && sync.lateBySamples > 1) {
			const fr = comp.frameRate ? Math.round(sync.lateBySamples / sync.sampleRate * comp.frameRate * 100) / 100 : null;
			findings.push({
				kind: "sound late",
				reading: `The sound plays ${sync.lateBySamples} samples (${sync.lateMs} ms${fr !== null ? `, ${fr} of a frame` : ""}) late against the picture: ${sync.reading.replace(/^the sound plays [^:]*: ?/, "") || "the edit list delays it"}. It could not be fixed (${file.alignment?.how ?? "not attempted"}). Install ffmpeg and deliver again, or remux the file: ffmpeg -i in.mp4 -itsoffset -${(sync.lateBySamples / sync.sampleRate).toFixed(6)} -i in.mp4 -map 0 -map -0:a -map 1:a -c copy out.mp4`
			});
		} else if (file.hasAudio && sync) sound += file.alignment?.aligned && file.alignment.before && file.alignment.before.lateBySamples > 0 ? `; on its frame (it was ${file.alignment.before.lateBySamples} samples late: ${file.alignment.how})` : `; ${sync.reading.replace(/^the sound is /, "")}`;
		if (file.hasAudio && file.loudness) {
			const l = file.loudness;
			sound += `; ${l.integratedLufs} LUFS integrated, true peak ${l.truePeakDbtp} dBTP${l.loudnessRangeLu !== null ? `, range ${l.loudnessRangeLu} LU` : ""} (ffmpeg ebur128)`;
			if (l.truePeakDbtp > -1) sound += ` \u2014 the true peak is above ${-1} dBTP, which a platform's own encode can clip`;
		}
	} else sound = file.hasAudio ? "a sound track, though the comp has no sound on" : "no sound, as in the comp";
	const passed = findings.length === 0;
	return {
		passed,
		findings,
		comp,
		file,
		reading: passed ? `The file matches the comp: ${file.width} \xD7 ${file.height}, ${file.frameRate} fps, ${file.duration.toFixed(3)} s; ${sound}.` : findings.map((f) => f.reading).join(" ")
	};
}
function deliverPlanJsx(args) {
	return `
            ${jsxCompPreamble(args)}
            var rq = app.project.renderQueue;
            if (AE.safeGet(function () { return rq.rendering; }, false)) return { ok: false, error: "the render queue is already rendering" };
            var _sound = [];
            for (var _i = 1; _i <= _comp.numLayers; _i++) {
                var _l = _comp.layer(_i);
                if (AE.safeGet(function () { return _l.hasAudio && _l.audioEnabled; }, false)) _sound.push(_l.name);
            }
            var _tmp = null;
            var _out = [];
            try { _tmp = rq.items.add(_comp); _out = _tmp.outputModule(1).templates; } finally { if (_tmp) { try { _tmp.remove(); } catch (eRm) {} } }
            return { ok: true, comp: _comp.name, width: _comp.width, height: _comp.height, frameRate: _comp.frameRate, duration: _comp.duration,
                hasSound: _sound.length > 0, soundLayers: _sound, templates: _out };
        `;
}
function deliverRenderJsx(args) {
	return `
            ${jsxCompPreamble(args)}
            ${PARK_QUEUE_FN}
            var rq = app.project.renderQueue;
            var _want = ${jsxVal(args.outputPath)};
            if (new File(_want).exists && !${jsxVal(args.overwrite)}) return { ok: false, error: "a file already exists at " + _want + "; pass overwrite: true to replace it" };
            var _parked = _parkQueue(rq);
            var _rqi = null;
            var _out = null;
            try {
                _rqi = rq.items.add(_comp);
                var _om = _rqi.outputModule(1);
                var _w = AE.applyTemplate(_om, ${jsxVal(args.template)}, "outputTemplate");
                if (_w) throw new Error(_w);
                _om.file = AE.ensureParentDir(_want);
                var _path = _om.file.fsName.replace(/\\\\/g, "/");
                var _audio = {};
                try { var _st = _om.getSettings(GetSettingsFormat.STRING); for (var _k in _st) if (_st.hasOwnProperty(_k) && /audio|channels/i.test(_k)) _audio[_k] = String(_st[_k]); } catch (eA) {}
                var _t0 = new Date().getTime();
                rq.render();
                var _f = new File(_path);
                _out = { ok: _rqi.status === RQItemStatus.DONE && _f.exists && _f.length > 0, outputPath: _path, bytes: _f.exists ? _f.length : 0,
                    renderSeconds: Math.round(new Date().getTime() - _t0) / 1000, audio: _audio };
                if (!_out.ok) _out.error = "the render did not finish (status " + String(_rqi.status) + ")";
            } catch (eR) {
                _out = { ok: false, error: "the delivery render failed: " + AE.errText(eR) };
            } finally {
                if (_rqi) { try { _rqi.remove(); } catch (eRm) {} }
                _unparkQueue(rq, _parked);
            }
            return _out;
        `;
}
function deliverReadBackJsx(args) {
	return `
            var _f = new File(${jsxVal(args.path)});
            if (!_f.exists) return { ok: false, error: "no file at " + ${jsxVal(args.path)} };
            var _item = app.project.importFile(new ImportOptions(_f));
            var _res = { ok: true, width: _item.width, height: _item.height, frameRate: _item.frameRate, duration: _item.duration, hasAudio: !!_item.hasAudio, amplitudeTop: null };
            var _c = null;
            try {
                if (${jsxVal(args.readLevel)} && _item.hasAudio) {
                    _c = app.project.items.addComp("delivery sound check", 16, 16, 1, _item.duration, _item.frameRate || 30);
                    var _l = _c.layers.add(_item);
                    _c.openInViewer();
                    for (var _i = 1; _i <= _c.numLayers; _i++) _c.layer(_i).selected = false;
                    _l.selected = true;
                    var _id = app.findMenuCommandId("Convert Audio to Keyframes");
                    if (_id) {
                        app.executeCommand(_id);
                        var _top = 0;
                        for (var _j = 1; _j <= _c.numLayers; _j++) {
                            var _a = _c.layer(_j);
                            if (_a === _l || _a.name.indexOf("Audio Amplitude") !== 0) continue;
                            var _fx = _a.property("ADBE Effect Parade");
                            for (var _k = 1; _k <= 2 && _k <= _fx.numProperties; _k++) {
                                var _p = _fx.property(_k).property(1);
                                for (var _fr = 0; _fr < _c.duration * _c.frameRate; _fr++) _top = Math.max(_top, _p.valueAtTime(_fr / _c.frameRate, false));
                            }
                        }
                        _res.amplitudeTop = Math.round(_top * 1000) / 1000;
                    }
                }
            } finally {
                if (_c) { try { _c.remove(); } catch (eC) {} }
                try { _item.remove(); } catch (eI) {}
            }
            return _res;
        `;
}
async function runDeliver(args, io) {
	const started = Date.now();
	const outputPath = args.outputPath;
	if (typeof outputPath !== "string" || !path$1.isAbsolute(outputPath)) return {
		ok: false,
		error: "`outputPath` must be an absolute path"
	};
	const rejected = rejectedOutputPath(outputPath);
	if (rejected) return {
		ok: false,
		error: rejected
	};
	const preset = typeof args.preset === "string" ? args.preset : "";
	const plan = await io.execute(deliverPlanJsx({ comp: args.comp }), {
		label: "render.deliver plan",
		timeoutMs: 6e4,
		undoGroup: true
	});
	if (!plan?.ok) return {
		ok: false,
		error: plan?.error ?? "could not read the comp"
	};
	const pick = chooseDeliveryTemplate(preset, plan.templates ?? []);
	if ("error" in pick) return {
		ok: false,
		error: pick.error
	};
	const notes = [];
	const p = DELIVERY_PRESETS[preset];
	if (p.aspect && Math.abs(plan.width / plan.height - p.aspect) > .01) notes.push(`The comp is ${plan.width} \xD7 ${plan.height}, not 9:16: the reel will be delivered at the comp's size.`);
	const frames = Math.round(plan.duration * plan.frameRate);
	const estimate = frames * plan.width * plan.height * (p.alpha ? 4 : 3) * .6;
	const free = io.freeBytes ? await io.freeBytes(path$1.dirname(outputPath)) : null;
	if (free !== null && free < estimate + 3e9) return {
		ok: false,
		error: `not enough room: about ${(estimate / 1e9).toFixed(1)} GB for the file plus 3 GB, ${(free / 1e9).toFixed(1)} GB free`
	};
	const r = await io.execute(deliverRenderJsx({
		comp: args.comp,
		template: pick.template,
		outputPath,
		overwrite: args.overwrite === true
	}), {
		label: "render.deliver render",
		timeoutMs: 12e4 + frames * 5e3,
		undoGroup: true
	});
	if (!r?.ok) return {
		ok: false,
		error: r?.error ?? "the render failed",
		template: pick.template
	};
	const written = r.outputPath ?? outputPath;
	let sync = io.soundSync ? await io.soundSync(written).catch(() => null) : null;
	let alignment = null;
	if (sync && sync.lateBySamples > 1) {
		alignment = io.alignSound ? await io.alignSound(written, sync).catch((e) => ({
			aligned: false,
			how: `the remux failed: ${e instanceof Error ? e.message : String(e)}`,
			before: sync
		})) : {
			aligned: false,
			how: "no way to remux the file here",
			before: sync
		};
		if (alignment.aligned && io.soundSync) sync = await io.soundSync(written).catch(() => null) ?? sync;
	}
	const probe = io.probe ? await io.probe(written).catch(() => null) : null;
	const back = await io.execute(deliverReadBackJsx({
		path: written,
		readLevel: !(probe && probe.maxDb !== null)
	}), {
		label: "render.deliver read back",
		timeoutMs: 3e5,
		undoGroup: true
	});
	if (!back?.ok) return {
		ok: false,
		error: back?.error ?? "could not bring the file back",
		outputPath: written
	};
	const level = probe && probe.maxDb !== null && probe.meanDb !== null ? {
		source: "ffmpeg",
		meanDb: probe.meanDb,
		maxDb: probe.maxDb
	} : typeof back.amplitudeTop === "number" ? {
		source: "After Effects",
		top: back.amplitudeTop
	} : null;
	const check = checkDelivered({
		width: plan.width,
		height: plan.height,
		frameRate: plan.frameRate,
		duration: plan.duration,
		hasSound: plan.hasSound,
		soundLayers: plan.soundLayers ?? []
	}, {
		width: back.width,
		height: back.height,
		frameRate: back.frameRate,
		duration: back.duration,
		hasAudio: back.hasAudio,
		level,
		...io.probe ? { loudness: probe?.loudness ?? null } : {},
		...io.soundSync ? {
			sync,
			alignment
		} : {}
	});
	return {
		ok: true,
		preset,
		template: pick.template,
		templateWhy: pick.why,
		fallback: pick.fallback,
		outputPath: written,
		bytes: r.bytes,
		renderSeconds: r.renderSeconds,
		audioSettings: r.audio,
		check,
		notes,
		timing: { totalMs: Date.now() - started },
		next: check.passed ? "Delivered and checked. Watch it once at speed before calling it done." : "Stop: tell the user what the check found, in plain words, before calling it delivered."
	};
}
async function probeDelivered(file, tools = {
	ffmpeg: FFMPEG,
	ffprobe: FFPROBE
}) {
	const pr = await runTool(tools.ffprobe, [
		"-v",
		"error",
		"-show_entries",
		"stream=codec_type,width,height,r_frame_rate:format=duration",
		"-of",
		"json",
		file
	]);
	if (!pr) return null;
	let j;
	try {
		j = JSON.parse(pr.stdout);
	} catch {
		return null;
	}
	const v = (j.streams ?? []).find((s) => s.codec_type === "video");
	const hasAudio = (j.streams ?? []).some((s) => s.codec_type === "audio");
	if (!v) return null;
	const [a, b] = String(v.r_frame_rate ?? "0/1").split("/").map(Number);
	let meanDb = null;
	let maxDb = null;
	let loudness = null;
	if (hasAudio) {
		const vd = await runTool(tools.ffmpeg, [
			"-hide_banner",
			"-nostats",
			"-i",
			file,
			"-map",
			"0:a:0",
			"-af",
			"volumedetect,ebur128=peak=true",
			"-f",
			"null",
			"-"
		], 6e5);
		if (vd) {
			({meanDb, maxDb} = parseVolumedetect(vd.stderr));
			loudness = parseEbur128Summary(vd.stderr);
		}
	}
	return {
		width: v.width,
		height: v.height,
		frameRate: b ? Math.round(a / b * 1e3) / 1e3 : 0,
		duration: Number(j.format?.duration ?? 0),
		hasAudio,
		meanDb,
		maxDb,
		loudness
	};
}
function liveDeliverIO(transport) {
	return {
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
		exists: (f) => promises.access(f).then(() => true, () => false),
		freeBytes: async (dir) => {
			try {
				const st = await promises.statfs(dir);
				return st.bavail * st.bsize;
			} catch {
				return null;
			}
		},
		probe: probeDelivered,
		soundSync: readSoundSync,
		alignSound
	};
}
async function probeStreams(file, ffprobe) {
	const pr = await runTool(ffprobe, [
		"-v",
		"error",
		"-show_entries",
		"stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels,duration:format=duration",
		"-of",
		"json",
		file
	]);
	if (!pr || pr.failed) return null;
	let j;
	try {
		j = JSON.parse(pr.stdout);
	} catch {
		return null;
	}
	const streams = j.streams ?? [];
	const v = streams.find((x) => x.codec_type === "video") ?? null;
	const a = streams.find((x) => x.codec_type === "audio") ?? null;
	const fmtDur = Number(j.format?.duration ?? NaN);
	const dur = (x) => x && Number.isFinite(Number(x.duration)) ? Number(x.duration) : Number.isFinite(fmtDur) ? fmtDur : null;
	let video = null;
	if (v) {
		const [n, d] = String(v.r_frame_rate ?? "0/1").split("/").map(Number);
		video = {
			codec: v.codec_name,
			width: v.width,
			height: v.height,
			frameRate: d ? Math.round(n / d * 1e3) / 1e3 : 0,
			duration: dur(v)
		};
	}
	const audio = a ? {
		codec: a.codec_name,
		sampleRate: Number(a.sample_rate),
		channels: Number(a.channels),
		duration: dur(a)
	} : null;
	return {
		video,
		audio
	};
}
async function runMuxAudio(args, tools = {
	ffmpeg: FFMPEG,
	ffprobe: FFPROBE
}) {
	const started = Date.now();
	const video = args.video;
	const audio = args.audio;
	if (typeof video !== "string" || !path$1.isAbsolute(video)) return {
		ok: false,
		error: "`video` must be an absolute path to the rendered picture"
	};
	if (typeof audio !== "string" || !path$1.isAbsolute(audio)) return {
		ok: false,
		error: "`audio` must be an absolute path to the mix (a WAV)"
	};
	const offset = typeof args.offsetSeconds === "number" ? args.offsetSeconds : 0;
	if (!Number.isFinite(offset)) return {
		ok: false,
		error: "`offsetSeconds` must be a number of seconds"
	};
	const bitrate = typeof args.bitrate === "string" ? args.bitrate : "320k";
	if (!/^\d+(\.\d+)?k$/.test(bitrate)) return {
		ok: false,
		error: "`bitrate` is a number of kilobits a second followed by k, such as '320k'"
	};
	const ext = path$1.extname(video) || ".mp4";
	const output = typeof args.output === "string" ? args.output : path$1.join(path$1.dirname(video), `${path$1.basename(video, path$1.extname(video))}-mix${ext}`);
	if (!path$1.isAbsolute(output)) return {
		ok: false,
		error: "`output` must be an absolute path"
	};
	const rejected = rejectedOutputPath(output);
	if (rejected) return {
		ok: false,
		error: rejected
	};
	if (path$1.resolve(output) === path$1.resolve(video) || path$1.resolve(output) === path$1.resolve(audio)) return {
		ok: false,
		error: "`output` must be a new file, not the picture or the mix it is made from"
	};
	for (const [name, f] of [["video", video], ["audio", audio]]) if (!await promises.access(f).then(() => true, () => false)) return {
		ok: false,
		error: `no file at ${f} (\`${name}\`)`
	};
	if (await promises.access(output).then(() => true, () => false) && args.overwrite !== true) return {
		ok: false,
		error: `a file already exists at ${output}; pass overwrite: true to replace it`
	};
	const version = await runTool(tools.ffmpeg, ["-hide_banner", "-version"]);
	const probeOk = await runTool(tools.ffprobe, ["-hide_banner", "-version"]);
	if (version === null || probeOk === null) return {
		ok: false,
		error: "render.mux_audio needs ffmpeg and ffprobe, and " + (version === null ? "ffmpeg" : "ffprobe") + " is not installed (looked for it on the PATH, in /opt/homebrew/bin and /usr/local/bin). Install it (on a Mac: brew install ffmpeg) and call again. Nothing was written."
	};
	const vIn = await probeStreams(video, tools.ffprobe);
	if (!vIn?.video) return {
		ok: false,
		error: `ffprobe found no picture in ${video}`
	};
	const aIn = await probeStreams(audio, tools.ffprobe);
	if (!aIn?.audio) return {
		ok: false,
		error: `ffprobe found no sound in ${audio}`
	};
	const fps = vIn.video.frameRate || 30;
	const frame = 1 / fps;
	const rate = aIn.audio.sampleRate || 48e3;
	const shift = Math.round(Math.abs(offset) * rate);
	const filters = [];
	if (offset > 0) filters.push(`adelay=delays=${shift}S:all=1`);
	if (offset < 0) filters.push(`atrim=start_sample=${shift}`, "asetpts=PTS-STARTPTS");
	const tmp = path$1.join(path$1.dirname(output), `.${path$1.basename(output, path$1.extname(output))}.mux${path$1.extname(output) || ext}`);
	const argv = [
		"-hide_banner",
		"-loglevel",
		"error",
		"-y",
		"-i",
		video,
		"-i",
		audio,
		"-map",
		"0:v:0",
		"-map",
		"1:a:0",
		"-c:v",
		"copy",
		...filters.length ? ["-af", filters.join(",")] : [],
		"-c:a",
		"aac",
		"-b:a",
		bitrate,
		"-ar",
		"48000",
		tmp
	];
	const r = await runTool(tools.ffmpeg, argv, 18e5);
	if (r === null || r.failed) {
		await promises.rm(tmp, { force: true });
		return {
			ok: false,
			error: `ffmpeg could not join the picture and the mix: ${(r?.stderr ?? "ffmpeg is not installed").trim().slice(0, 400)}`,
			command: ["ffmpeg", ...argv].join(" ")
		};
	}
	await promises.rename(tmp, output);
	const probe = await probeDelivered(output, tools);
	const sync = await readSoundSync(output).catch(() => null);
	const out = await probeStreams(output, tools.ffprobe);
	const mixSeconds = aIn.audio.duration !== null ? aIn.audio.duration + offset : null;
	const pictureSeconds = vIn.video.duration;
	const check = checkDelivered({
		width: vIn.video.width,
		height: vIn.video.height,
		frameRate: fps,
		duration: pictureSeconds ?? 0,
		hasSound: true,
		soundLayers: [path$1.basename(audio)]
	}, {
		width: probe?.width ?? out?.video?.width ?? 0,
		height: probe?.height ?? out?.video?.height ?? 0,
		frameRate: probe?.frameRate ?? out?.video?.frameRate ?? 0,
		duration: probe?.duration ?? 0,
		hasAudio: probe?.hasAudio ?? !!out?.audio,
		level: probe && probe.meanDb !== null && probe.maxDb !== null ? {
			source: "ffmpeg",
			meanDb: probe.meanDb,
			maxDb: probe.maxDb
		} : null,
		loudness: probe?.loudness ?? null,
		sync,
		alignment: null
	});
	const r3 = (v) => Math.round(v * 1e3) / 1e3;
	if (mixSeconds !== null && pictureSeconds !== null && Math.abs(mixSeconds - pictureSeconds) > frame + 1e-6) {
		const diff = mixSeconds - pictureSeconds;
		check.findings.push({
			kind: "mix length",
			reading: `The mix ${offset !== 0 ? `(moved ${offset} s) ` : ""}runs ${r3(mixSeconds)} s and the picture ${r3(pictureSeconds)} s: ${r3(Math.abs(diff))} s (${Math.round(Math.abs(diff) / frame * 10) / 10} frames) ${diff > 0 ? "longer" : "shorter"}, more than a frame. ` + (diff > 0 ? "The file runs on past the picture's last frame with sound over a held or missing picture." : "The end of the picture is silent.") + " Check that the mix is the one for this cut."
		});
		check.passed = false;
		check.reading = check.findings.map((f) => f.reading).join(" ");
	}
	return {
		ok: true,
		output,
		video: {
			path: video,
			...vIn.video
		},
		audio: {
			path: audio,
			...aIn.audio,
			offsetSeconds: offset,
			encodedAs: `AAC ${bitrate} at 48 kHz`
		},
		mixLength: mixSeconds !== null && pictureSeconds !== null ? {
			mixSeconds: r3(mixSeconds),
			pictureSeconds: r3(pictureSeconds),
			differenceFrames: Math.round((mixSeconds - pictureSeconds) / frame * 10) / 10
		} : null,
		check,
		timing: { totalMs: Date.now() - started },
		next: check.passed ? "Joined and checked. Watch it once at speed before calling it done." : "Stop: tell the user what the check found, in plain words, before calling it delivered."
	};
}
var RENDER_QUEUE_UNDO_WARNING, READ_TEMPLATES_FN, QUEUE_CHANGE_NOTE, PARK_QUEUE_FN, PREVIEW_RESOLUTIONS, DELIVERY_PRESETS, isSequenceTemplate, DELIVERY_TRUE_PEAK_NOTE_DBTP, DELIVERY_SILENCE_TOP, DELIVERY_SILENCE_DB;
function init_render() {
	return (init_render = __esmMin((() => {
		init_config();
		init_policy();
		init_registry();
		init_delivery_sound();
		RENDER_QUEUE_UNDO_WARNING = " After this, undo and rollback are refused for the rest of the After Effects session unless acceptRenderQueueRisk: true: After Effects 2027 has gone into crash recovery on undo after scripted render-queue changes (observed twice on 2026-11-10; a precaution, not a proven cause). Save the project before undoing anything afterwards; project.open / project.new clear the block.";
		READ_TEMPLATES_FN = `
    function _readTemplates(_item) {
        var _render = [];
        var _output = [];
        try { _render = _item.templates; } catch (eR) {}
        try { _output = _item.outputModule(1).templates; } catch (eO) {}
        return { renderTemplates: _render, outputTemplates: _output };
    }
`;
		QUEUE_CHANGE_NOTE = "the project is left modified (unsaved): a render-queue item was added and removed. Nothing in the comps changed; save or revert as you normally would";
		PARK_QUEUE_FN = `
    function _parkQueue(rq) {
        var _parked = [];
        for (var _pi = 1; _pi <= rq.numItems; _pi++) {
            var _ex = rq.item(_pi);
            var _was = false;
            try { _was = _ex.render; } catch (eR) {}
            _parked.push(_was);
            if (_was) { try { _ex.render = false; } catch (eP) {} }
        }
        return _parked;
    }
    function _unparkQueue(rq, _parked) {
        for (var _ui = 0; _ui < _parked.length && _ui < rq.numItems; _ui++) {
            if (_parked[_ui]) { try { rq.item(_ui + 1).render = true; } catch (eU) {} }
        }
    }
`;
		registerOp({
			name: "render.add_to_queue",
			category: "render",
			description: "Add a composition to the render queue. Optionally set output path." + RENDER_QUEUE_UNDO_WARNING,
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}, {
				name: "outputPath",
				type: "string",
				description: "Output file path (optional, sets on the first output module)",
				required: false
			}],
			toJsx(args) {
				const outputPathJsx = args.outputPath ? `
                try {
                    _rqi.outputModules[1].file = AE.ensureParentDir(${jsxVal(args.outputPath)});
                    _result.outputPath = ${jsxVal(args.outputPath)};
                } catch(e) { _result.outputWarning = "could not set output path: " + AE.errText(e); }
            ` : "";
				return `
            ${jsxCompPreamble(args)}
            var _rqi = app.project.renderQueue.items.add(_comp);
            var _result = { ok: true, queueIndex: app.project.renderQueue.numItems, compName: _comp.name };
            ${outputPathJsx}
            return _result;
        `;
			}
		});
		registerOp({
			name: "render.start",
			category: "render",
			description: "Render queued items and verify each output file was newly written. Blocks until complete. Missing output directories are created first. Completed items are not counted as new renders." + RENDER_QUEUE_UNDO_WARNING,
			params: [],
			toJsx() {
				return `
            var rq = app.project.renderQueue;
            if (rq.numItems === 0) return { ok: false, error: "render queue is empty" };
            var _before = [];
            function _fileMeta(_path) {
                if (!_path) return { exists: false, bytes: 0, modifiedMs: null };
                var _file = new File(_path);
                if (!_file.exists) return { exists: false, bytes: 0, modifiedMs: null };
                var _date = _file.modified;
                return { exists: true, bytes: _file.length, modifiedMs: _date ? _date.getTime() : null };
            }
            // A completed item can retain a true render flag. Only QUEUED
            // items are candidates for this invocation's output evidence.
            for (var _ri = 1; _ri <= rq.numItems; _ri++) {
                var _it = rq.item(_ri);
                if (!_it.render || _it.status !== RQItemStatus.QUEUED) continue;
                var _outputs = [];
                for (var _oi = 1; _oi <= _it.numOutputModules; _oi++) {
                    var _target = _it.outputModule(_oi).file;
                    if (_target) AE.ensureParentDir(_target);
                    var _path = _target ? _target.fsName : null;
                    if (!_path) return { ok: false, rendered: 0,
                        error: "queued item " + _ri + " output module " + _oi + " has no output path" };
                    _outputs.push({ path: _path, before: _fileMeta(_path) });
                }
                _before.push({ index: _ri, outputs: _outputs });
            }
            if (_before.length === 0) return { ok: false, rendered: 0, error: "no queued render items; add a fresh queue item or requeue an eligible item" };
            rq.render();
            var _items = [];
            var _rendered = 0;
            for (var _bi = 0; _bi < _before.length; _bi++) {
                var _entry = _before[_bi];
                var _afterItem = rq.item(_entry.index);
                var _verified = _afterItem.status === RQItemStatus.DONE && _entry.outputs.length > 0;
                var _checked = [];
                for (var _ci = 0; _ci < _entry.outputs.length; _ci++) {
                    var _out = _entry.outputs[_ci];
                    var _meta = _fileMeta(_out.path);
                    var _fresh = _meta.exists && _meta.bytes > 0 &&
                        (!_out.before.exists || _meta.bytes !== _out.before.bytes ||
                         (_meta.modifiedMs !== null && _meta.modifiedMs !== _out.before.modifiedMs));
                    if (!_fresh) _verified = false;
                    _checked.push({ path: _out.path, exists: _meta.exists, bytes: _meta.bytes,
                        modifiedMs: _meta.modifiedMs, newlyWritten: _fresh });
                }
                if (_verified) _rendered++;
                _items.push({ index: _entry.index, done: _afterItem.status === RQItemStatus.DONE,
                    verified: _verified, outputs: _checked });
            }
            return { ok: _rendered === _before.length, rendered: _rendered,
                error: _rendered === _before.length ? null : "one or more queued items did not produce a verifiably new nonempty output file",
                items: _items };
        `;
			}
		});
		registerOp({
			name: "render.clear_queue",
			category: "render",
			description: "Remove all items from the render queue.",
			params: [],
			toJsx() {
				return `
            var rq = app.project.renderQueue;
            var removed = 0;
            while (rq.numItems > 0) {
                rq.item(1).remove();
                removed++;
            }
            return { ok: true, removed: removed };
        `;
			}
		});
		registerOp({
			name: "render.set_output",
			category: "render",
			description: "Configure a render-queue item: render/output templates, output path, time span, render flag, skipFrames, logType, postRenderAction. Discover template names with render.list_templates; raw settings via render.get_settings / render.set_settings.",
			params: [
				{
					name: "queueIndex",
					type: "number",
					description: "1-based queue item index (default: last item)",
					required: false
				},
				{
					name: "renderTemplate",
					type: "string",
					description: "Render settings template name (e.g. \"Best Settings\", \"Draft Settings\")",
					required: false
				},
				{
					name: "outputTemplate",
					type: "string",
					description: "Output module template name (e.g. \"Lossless\", \"High Quality\")",
					required: false
				},
				{
					name: "outputPath",
					type: "string",
					description: "Output file path",
					required: false
				},
				{
					name: "timeSpanStart",
					type: "number",
					description: "Render span start in seconds (comp time)",
					required: false
				},
				{
					name: "timeSpanDuration",
					type: "number",
					description: "Render span duration in seconds",
					required: false
				},
				{
					name: "outputModuleIndex",
					type: "number",
					description: "1-based output module index (default 1)",
					required: false,
					default: 1
				},
				{
					name: "render",
					type: "boolean",
					description: "Whether this item renders when the queue starts (the Render checkbox)",
					required: false
				},
				{
					name: "skipFrames",
					type: "number",
					description: "Render every Nth frame (0 = every frame)",
					required: false
				},
				{
					name: "logType",
					type: "string",
					description: "errorsOnly|errorsAndSettings|errorsAndPerFrameInfo",
					required: false
				},
				{
					name: "postRenderAction",
					type: "string",
					description: "none|import|importAndReplaceUsage|setProxy (on the output module)",
					required: false
				},
				{
					name: "includeSourceXMP",
					type: "boolean",
					description: "Embed source-footage XMP metadata in the output",
					required: false
				},
				{
					name: "queueItemNotify",
					type: "boolean",
					description: "Per-item Notify checkbox (AE 22.0+)",
					required: false
				},
				{
					name: "queueNotify",
					type: "boolean",
					description: "QUEUE-WIDE Notify checkbox (RenderQueue.queueNotify, AE 22.0+)",
					required: false
				}
			],
			toJsx(args) {
				const rqiSets = [];
				if (args.queueNotify !== void 0) rqiSets.push(`try { rq.queueNotify = ${jsxVal(args.queueNotify)}; } catch (eQq) { _w.push("queueNotify (AE 22.0+): " + AE.errText(eQq)); }`);
				if (args.renderTemplate !== void 0) rqiSets.push(`_applyTpl(_rqi, ${jsxVal(args.renderTemplate)}, "renderTemplate");`);
				if (args.timeSpanStart !== void 0) rqiSets.push(`try { _rqi.timeSpanStart = ${jsxVal(args.timeSpanStart)}; } catch (eTs) { _w.push("timeSpanStart: " + AE.errText(eTs)); }`);
				if (args.timeSpanDuration !== void 0) rqiSets.push(`try { _rqi.timeSpanDuration = ${jsxVal(args.timeSpanDuration)}; } catch (eTd) { _w.push("timeSpanDuration: " + AE.errText(eTd)); }`);
				if (args.render !== void 0) rqiSets.push(`try { _rqi.render = ${jsxVal(args.render)}; } catch (eRf) { _w.push("render: " + AE.errText(eRf)); }`);
				if (args.skipFrames !== void 0) rqiSets.push(`try { _rqi.skipFrames = ${jsxVal(args.skipFrames)}; } catch (eSk) { _w.push("skipFrames: " + AE.errText(eSk)); }`);
				if (args.logType !== void 0) rqiSets.push(`
                try {
                    var _ltMap = { "errorsOnly": LogType.ERRORS_ONLY, "errorsAndSettings": LogType.ERRORS_AND_SETTINGS, "errorsAndPerFrameInfo": LogType.ERRORS_AND_PER_FRAME_INFO };
                    if (_ltMap.hasOwnProperty(${jsxVal(args.logType)})) {
                        _rqi.logType = _ltMap[${jsxVal(args.logType)}];
                    } else { _w.push("logType: unknown value " + ${jsxVal(args.logType)}); }
                } catch (eLt) { _w.push("logType: " + AE.errText(eLt)); }
            `);
				if (args.queueItemNotify !== void 0) rqiSets.push(`try { _rqi.queueItemNotify = ${jsxVal(args.queueItemNotify)}; } catch (eQn) { _w.push("queueItemNotify (AE 22.0+): " + AE.errText(eQn)); }`);
				const omSets = [];
				if (args.outputTemplate !== void 0) omSets.push(`_applyTpl(_om, ${jsxVal(args.outputTemplate)}, "outputTemplate");`);
				if (args.outputPath !== void 0) omSets.push(`try { _om.file = AE.ensureParentDir(${jsxVal(args.outputPath)}); } catch (eOp) { _w.push("outputPath: " + AE.errText(eOp)); }`);
				if (args.postRenderAction !== void 0) omSets.push(`
                try {
                    var _praMap = { "none": PostRenderAction.NONE, "import": PostRenderAction.IMPORT, "importAndReplaceUsage": PostRenderAction.IMPORT_AND_REPLACE_USAGE, "setProxy": PostRenderAction.SET_PROXY };
                    if (_praMap.hasOwnProperty(${jsxVal(args.postRenderAction)})) {
                        _om.postRenderAction = _praMap[${jsxVal(args.postRenderAction)}];
                    } else { _w.push("postRenderAction: unknown value " + ${jsxVal(args.postRenderAction)}); }
                } catch (ePa) { _w.push("postRenderAction: " + AE.errText(ePa)); }
            `);
				if (args.includeSourceXMP !== void 0) omSets.push(`try { _om.includeSourceXMP = ${jsxVal(args.includeSourceXMP)}; } catch (eXm) { _w.push("includeSourceXMP: " + AE.errText(eXm)); }`);
				return `
            ${jsxRqItemPreamble(args)}
            var _w = [];
            // Template names are LOCALIZED ("Lossless" does not exist on a
            // Japanese AE). Exact name first, then a case-insensitive scan of
            // the target's own template list; when nothing matches, the
            // warning carries that list so the caller can self-correct
            // without a separate render.list_templates round trip.
            function _applyTpl(target, name, label) {
                try { target.applyTemplate(name); return; } catch (eT1) {}
                var _avail = [];
                try { _avail = target.templates; } catch (eT2) {}
                var _want = String(name).toLowerCase();
                for (var _ti = 0; _ti < _avail.length; _ti++) {
                    if (String(_avail[_ti]).toLowerCase() === _want) {
                        try { target.applyTemplate(_avail[_ti]); return; } catch (eT3) {}
                    }
                }
                _w.push(label + ": no template named '" + name + "' \u2014 available: " + _avail.join(" | "));
            }
            ${rqiSets.join("\n")}
            var _om = null;
            try { _om = _rqi.outputModule(${jsxVal(args.outputModuleIndex ?? 1)}); } catch (eOm) {}
            if (!_om) return { ok: false, error: "no output module at index " + ${jsxVal(args.outputModuleIndex ?? 1)} };
            ${omSets.join("\n")}
            return {
                ok: true,
                queueIndex: _qi,
                comp: _rqi.comp.name,
                timeSpanStart: _rqi.timeSpanStart,
                timeSpanDuration: _rqi.timeSpanDuration,
                outputPath: _om.file ? _om.file.fsName.replace(/\\\\/g, "/") : null,
                warnings: _w
            };
        `;
			}
		});
		registerOp({
			name: "render.get_settings",
			category: "render",
			readOnly: true,
			description: "Read the raw render settings of a queue item and the settings of each of its output modules (getSettings, AE 13.0+). format 'settable' returns only keys accepted by render.set_settings / render.set_om_settings.",
			params: [{
				name: "queueIndex",
				type: "number",
				description: "1-based queue item index (default: last item)",
				required: false
			}, {
				name: "format",
				type: "string",
				description: "settable|all (default settable)",
				required: false,
				default: "settable"
			}],
			toJsx(args) {
				return `
            ${jsxRqItemPreamble(args)}
            if (typeof _rqi.getSettings !== "function") return { ok: false, error: "getSettings needs AE 13.0+" };
            var _fmt = ${jsxVal(args.format ?? "settable")} === "all" ? GetSettingsFormat.STRING : GetSettingsFormat.STRING_SETTABLE;
            var _rs = null;
            try { _rs = _rqi.getSettings(_fmt); } catch (eRs) { return { ok: false, error: "getSettings failed: " + AE.errText(eRs) }; }
            var _oms = [];
            for (var _o = 1; _o <= _rqi.numOutputModules; _o++) {
                var _om = _rqi.outputModule(_o);
                var _os = null;
                try { _os = _om.getSettings(_fmt); } catch (eOs) {}
                _oms.push({ index: _o, name: AE.safeGet(function () { return _om.name; }, null), settings: _os });
            }
            return { ok: true, queueIndex: _qi, comp: _rqi.comp ? _rqi.comp.name : null, renderSettings: _rs, outputModules: _oms };
        `;
			}
		});
		registerOp({
			name: "render.set_settings",
			category: "render",
			description: "Set raw render settings on a queue item (RenderQueueItem.setSettings, AE 13.0+), e.g. { \"Quality\": \"Best\", \"Resolution\": \"Half\" }. Discover valid keys/values with render.get_settings.",
			params: [{
				name: "queueIndex",
				type: "number",
				description: "1-based queue item index (default: last item)",
				required: false
			}, {
				name: "settings",
				type: "object",
				description: "Key/value map from render.get_settings format 'settable'",
				required: true
			}],
			toJsx(args) {
				return `
            ${jsxRqItemPreamble(args)}
            if (typeof _rqi.setSettings !== "function") return { ok: false, error: "setSettings needs AE 13.0+" };
            try { _rqi.setSettings(${jsxVal(args.settings)}); } catch (eSs) { return { ok: false, error: "setSettings failed: " + AE.errText(eSs) }; }
            var _after = null;
            try { _after = _rqi.getSettings(GetSettingsFormat.STRING_SETTABLE); } catch (eAf) {}
            return { ok: true, queueIndex: _qi, renderSettings: _after };
        `;
			}
		});
		registerOp({
			name: "render.set_om_settings",
			category: "render",
			description: "Set raw output-module settings on a queue item (OutputModule.setSettings, AE 13.0+), e.g. { \"Format\": \"QuickTime\", \"Channels\": \"RGB + Alpha\" }. Discover valid keys/values with render.get_settings.",
			params: [
				{
					name: "queueIndex",
					type: "number",
					description: "1-based queue item index (default: last item)",
					required: false
				},
				{
					name: "outputModuleIndex",
					type: "number",
					description: "1-based output module index (default 1)",
					required: false,
					default: 1
				},
				{
					name: "settings",
					type: "object",
					description: "Key/value map from render.get_settings format 'settable'",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxRqItemPreamble(args)}
            var _om = null;
            try { _om = _rqi.outputModule(${jsxVal(args.outputModuleIndex ?? 1)}); } catch (eOm) {}
            if (!_om) return { ok: false, error: "no output module at index " + ${jsxVal(args.outputModuleIndex ?? 1)} };
            if (typeof _om.setSettings !== "function") return { ok: false, error: "setSettings needs AE 13.0+" };
            try { _om.setSettings(${jsxVal(args.settings)}); } catch (eSs) { return { ok: false, error: "setSettings failed: " + AE.errText(eSs) }; }
            var _after = null;
            try { _after = _om.getSettings(GetSettingsFormat.STRING_SETTABLE); } catch (eAf) {}
            return { ok: true, queueIndex: _qi, outputModuleIndex: ${jsxVal(args.outputModuleIndex ?? 1)}, settings: _after };
        `;
			}
		});
		registerOp({
			name: "render.remove_item",
			category: "render",
			description: "Remove ONE item from the render queue by its 1-based index (render.clear_queue removes all)." + RENDER_QUEUE_UNDO_WARNING,
			params: [{
				name: "queueIndex",
				type: "number",
				description: "1-based queue item index (explicit — no default for a destructive op)",
				required: true
			}],
			toJsx(args) {
				return `
            ${jsxRqItemPreamble(args)}
            var _compName = _rqi.comp ? _rqi.comp.name : null;
            try { _rqi.remove(); } catch (eRm) { return { ok: false, error: "remove failed: " + AE.errText(eRm) }; }
            return { ok: true, removed: _compName, remaining: rq.numItems };
        `;
			}
		});
		registerOp({
			name: "render.duplicate_item",
			category: "render",
			description: "Duplicate a render-queue item (RenderQueueItem.duplicate) — e.g. to render the same comp with a second settings/output combination.",
			params: [{
				name: "queueIndex",
				type: "number",
				description: "1-based queue item index (default: last item)",
				required: false
			}],
			toJsx(args) {
				return `
            ${jsxRqItemPreamble(args)}
            var _dup = null;
            try { _dup = _rqi.duplicate(); } catch (eDp) { return { ok: false, error: "duplicate failed: " + AE.errText(eDp) }; }
            return { ok: true, comp: _dup.comp ? _dup.comp.name : null, numItems: rq.numItems };
        `;
			}
		});
		registerOp({
			name: "render.list_templates",
			category: "render",
			readOnly: true,
			description: "List available render-settings templates and output-module templates. They are read from a queue item: the first one, or, when the queue is empty and `comp` is given, a temporary item for that comp that is removed again (the project is then left modified by the queue change; render.preview with listTemplates does the same). A temporary item counts as a render-queue change:" + RENDER_QUEUE_UNDO_WARNING,
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id for a temporary queue item, used only when the queue is empty",
				required: false
			}],
			toJsx(args) {
				return `
            ${READ_TEMPLATES_FN}
            var rq = app.project.renderQueue;
            if (rq.numItems > 0) {
                var _first = _readTemplates(rq.item(1));
                return { ok: true, renderTemplates: _first.renderTemplates, outputTemplates: _first.outputTemplates };
            }
            var _compArg = ${jsxVal(args.comp ?? null)};
            if (${jsxVal(readOnlyMode())}) return { ok: false, error: "the render queue is empty, and AE_MCP_READONLY=1 forbids the temporary queue item that would modify the project" };
            if (_compArg === null) return { ok: false, error: "the render queue is empty: pass comp (a temporary item is added, read and removed), or use render.preview with listTemplates" };
            var _comp = AE.findCompByNameOrId(_compArg);
            if (!_comp) return { ok: false, error: "no comp matching " + String(_compArg) };
            var _tmp = null;
            try {
                _tmp = rq.items.add(_comp);
                var _read = _readTemplates(_tmp);
                return { ok: true, renderTemplates: _read.renderTemplates, outputTemplates: _read.outputTemplates, temporaryItem: true, projectModified: true, projectNote: ${jsxVal(QUEUE_CHANGE_NOTE)} };
            } catch (eT) {
                return { ok: false, error: "could not read templates: " + AE.errText(eT) };
            } finally {
                if (_tmp) { try { _tmp.remove(); } catch (eRm) {} }
            }
        `;
			}
		});
		registerOp({
			name: "render.status",
			category: "render",
			readOnly: true,
			description: "Report the render queue state: per-item status, time spans, and output paths.",
			params: [],
			toJsx() {
				return `
            var rq = app.project.renderQueue;
            var _statusNames = {};
            try {
                _statusNames[RQItemStatus.WILL_CONTINUE] = "WILL_CONTINUE";
                _statusNames[RQItemStatus.NEEDS_OUTPUT] = "NEEDS_OUTPUT";
                _statusNames[RQItemStatus.UNQUEUED] = "UNQUEUED";
                _statusNames[RQItemStatus.QUEUED] = "QUEUED";
                _statusNames[RQItemStatus.RENDERING] = "RENDERING";
                _statusNames[RQItemStatus.USER_STOPPED] = "USER_STOPPED";
                _statusNames[RQItemStatus.ERR_STOPPED] = "ERR_STOPPED";
                _statusNames[RQItemStatus.DONE] = "DONE";
            } catch (eSn) {}
            var _items = [];
            for (var _i = 1; _i <= rq.numItems; _i++) {
                var _rqi = rq.item(_i);
                var _outputs = [];
                try {
                    for (var _o = 1; _o <= _rqi.numOutputModules; _o++) {
                        var _f = _rqi.outputModule(_o).file;
                        _outputs.push(_f ? _f.fsName.replace(/\\\\/g, "/") : null);
                    }
                } catch (eOut) {}
                _items.push({
                    index: _i,
                    comp: _rqi.comp ? _rqi.comp.name : null,
                    status: _statusNames[_rqi.status] || String(_rqi.status),
                    render: _rqi.render,
                    timeSpanStart: _rqi.timeSpanStart,
                    timeSpanDuration: _rqi.timeSpanDuration,
                    elapsedSeconds: AE.safeGet(function () { return _rqi.elapsedSeconds; }, null),
                    outputs: _outputs
                });
            }
            return { ok: true, rendering: rq.rendering, numItems: rq.numItems, canQueueInAME: AE.safeGet(function () { return rq.canQueueInAME; }, false), items: _items };
        `;
			}
		});
		registerOp({
			name: "render.queue_in_ame",
			category: "render",
			description: "Send the render queue to Adobe Media Encoder (for H.264/HEVC etc.). Requires AME installed. renderImmediately=true starts the AME queue.",
			params: [{
				name: "renderImmediately",
				type: "boolean",
				description: "Start rendering in AME right away (default false)",
				required: false,
				default: false
			}],
			toJsx(args) {
				return `
            var rq = app.project.renderQueue;
            if (rq.numItems === 0) return { ok: false, error: "render queue is empty" };
            if (typeof rq.queueInAME !== "function") return { ok: false, error: "queueInAME not available (needs AE 14.0 / CC 2017+)" };
            var _can = false;
            try { _can = rq.canQueueInAME; } catch (eC) {}
            if (!_can) return { ok: false, error: "cannot queue in AME \u2014 is Adobe Media Encoder installed and at least one item queued?" };
            rq.queueInAME(${jsxVal(!!args.renderImmediately)});
            return { ok: true, sent: rq.numItems, renderImmediately: ${jsxVal(!!args.renderImmediately)} };
        `;
			}
		});
		registerOp({
			name: "render.variants",
			category: "render",
			description: "Render the same comp several times with different property values — a slider that switches a state, a text that changes per version — in ONE call. Each variant sets its values (static properties only; keyed ones are refused), renders through a temporary queue item to outputPath with {name}/{index} substituted, then the original values are restored. Other queue items are not rendered. Blocks until done: raise timeoutMs.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "variants",
					type: "array",
					description: "[{ name, sets: [{ layer, property, value }, …] }, …] — e.g. [{ name: \"A\", sets: [{ layer: \"Ctrl\", property: [\"Effects\",\"Slider Control\",\"Slider\"], value: 1 }] }]",
					required: true
				},
				{
					name: "outputPath",
					type: "string",
					description: "Output file path template; {name} and {index} are replaced per variant",
					required: true
				},
				{
					name: "renderTemplate",
					type: "string",
					description: "Render settings template name",
					required: false
				},
				{
					name: "outputTemplate",
					type: "string",
					description: "Output module template name",
					required: false
				},
				{
					name: "timeSpanStart",
					type: "number",
					description: "Render span start in seconds",
					required: false
				},
				{
					name: "timeSpanDuration",
					type: "number",
					description: "Render span duration in seconds",
					required: false
				}
			],
			toJsx(args) {
				const variants = Array.isArray(args.variants) ? args.variants : [];
				if (variants.length === 0) return jsxFail("variants must be a non-empty array");
				for (const [i, v] of variants.entries()) {
					const variant = v;
					if (!variant || typeof variant !== "object" || typeof variant.name !== "string") return jsxFail(`variants[${i}] needs a string name`);
					if (!Array.isArray(variant.sets)) return jsxFail(`variants[${i}].sets must be an array of { layer, property, value }`);
					for (const [j, s] of variant.sets.entries()) {
						const set = s;
						if (!set || typeof set !== "object" || set.layer === void 0 || !Array.isArray(set.property) || set.value === void 0) return jsxFail(`variants[${i}].sets[${j}] must be { layer, property: [path], value }`);
					}
				}
				const template = String(args.outputPath);
				if (variants.length > 1 && !template.includes("{name}") && !template.includes("{index}")) return jsxFail("outputPath must contain {name} or {index} when rendering more than one variant, or every render overwrites the last");
				return `
            ${jsxCompPreamble(args)}
            var _variants = ${jsxVal(variants)};
            var _tpl = ${jsxVal(template)};
            var rq = app.project.renderQueue;
            ${PARK_QUEUE_FN}
            // Only the temporary item may render: park every existing item.
            var _parked = _parkQueue(rq);
            var _results = [];
            var _failed = 0;
            try {
                for (var _vi = 0; _vi < _variants.length; _vi++) {
                    var _v = _variants[_vi];
                    var _entry = { name: _v.name, ok: true, warnings: [] };
                    var _restore = [];
                    var _rqi = null;
                    try {
                        for (var _si = 0; _si < _v.sets.length; _si++) {
                            var _s = _v.sets[_si];
                            var _layer = AE.findLayerInComp(_comp, _s.layer);
                            if (!_layer) throw new Error("no layer matching " + String(_s.layer));
                            var _prop = AE.propertyAtPath(_layer, _s.property);
                            if (!_prop || _prop.propertyType !== PropertyType.PROPERTY) throw new Error("property " + _s.property.join("/") + " not found on '" + _layer.name + "'");
                            if (AE.hasKeys(_prop)) throw new Error("property " + _s.property.join("/") + " on '" + _layer.name + "' has keyframes \u2014 variants switch static values only");
                            _restore.push({ prop: _prop, value: AE.readValue(_prop) });
                            AE.writeValue(_prop, _s.value);
                        }
                        var _safe = String(_v.name).replace(/[\\\\\\/:*?"<>|]/g, "_");
                        var _path = _tpl.replace(/\\{name\\}/g, _safe).replace(/\\{index\\}/g, String(_vi));
                        _rqi = rq.items.add(_comp);
                        ${args.renderTemplate !== void 0 ? `var _wr = AE.applyTemplate(_rqi, ${jsxVal(args.renderTemplate)}, "renderTemplate"); if (_wr) _entry.warnings.push(_wr);` : ""}
                        var _om = _rqi.outputModule(1);
                        ${args.outputTemplate !== void 0 ? `var _wo = AE.applyTemplate(_om, ${jsxVal(args.outputTemplate)}, "outputTemplate"); if (_wo) _entry.warnings.push(_wo);` : ""}
                        _om.file = AE.ensureParentDir(_path);
                        ${args.timeSpanStart !== void 0 ? `_rqi.timeSpanStart = ${jsxVal(args.timeSpanStart)};` : ""}
                        ${args.timeSpanDuration !== void 0 ? `_rqi.timeSpanDuration = ${jsxVal(args.timeSpanDuration)};` : ""}
                        rq.render();
                        _entry.status = String(_rqi.status);
                        _entry.outputPath = _om.file ? _om.file.fsName.replace(/\\\\/g, "/") : _path;
                        if (_rqi.status === RQItemStatus.ERR_STOPPED || _rqi.status === RQItemStatus.USER_STOPPED) { _entry.ok = false; _entry.error = "render stopped (" + _entry.status + ")"; }
                    } catch (eV) {
                        _entry.ok = false;
                        _entry.error = AE.errText(eV);
                    } finally {
                        if (_rqi) { try { _rqi.remove(); } catch (eRm) {} }
                        for (var _ri = _restore.length - 1; _ri >= 0; _ri--) {
                            try { AE.writeValue(_restore[_ri].prop, _restore[_ri].value); } catch (eRs) { _entry.warnings.push("restore failed: " + AE.errText(eRs)); }
                        }
                    }
                    if (!_entry.ok) _failed++;
                    _results.push(_entry);
                }
            } finally {
                _unparkQueue(rq, _parked);
            }
            return { ok: _failed === 0, error: _failed === 0 ? null : (_failed + " of " + _results.length + " variants failed"), rendered: _results.length - _failed, variants: _results };
        `;
			}
		});
		registerOp({
			name: "render.save_template",
			category: "render",
			appConfig: true,
			description: "Save a queue item's current render settings, or an output module's current settings, as a named template (saveAsTemplate) for reuse via render.set_output.",
			params: [
				{
					name: "type",
					type: "string",
					description: "render (RenderQueueItem settings) | output (OutputModule settings)",
					required: true
				},
				{
					name: "name",
					type: "string",
					description: "Template name to save under",
					required: true
				},
				{
					name: "queueIndex",
					type: "number",
					description: "1-based queue item index (default: last item)",
					required: false
				},
				{
					name: "outputModuleIndex",
					type: "number",
					description: "1-based output module index (type=output only, default 1)",
					required: false,
					default: 1
				}
			],
			toJsx(args) {
				return `
            ${jsxRqItemPreamble(args)}
            var _type = ${jsxVal(args.type)};
            if (_type === "render") {
                try { _rqi.saveAsTemplate(${jsxVal(args.name)}); } catch (eSt) { return { ok: false, error: "saveAsTemplate failed: " + AE.errText(eSt) }; }
                return { ok: true, type: "render", name: ${jsxVal(args.name)} };
            }
            if (_type === "output") {
                var _om = null;
                try { _om = _rqi.outputModule(${jsxVal(args.outputModuleIndex ?? 1)}); } catch (eOm) {}
                if (!_om) return { ok: false, error: "no output module at index " + ${jsxVal(args.outputModuleIndex ?? 1)} };
                try { _om.saveAsTemplate(${jsxVal(args.name)}); } catch (eSo) { return { ok: false, error: "saveAsTemplate failed: " + AE.errText(eSo) }; }
                return { ok: true, type: "output", name: ${jsxVal(args.name)} };
            }
            return { ok: false, error: "type must be render|output" };
        `;
			}
		});
		PREVIEW_RESOLUTIONS = {
			full: "Full",
			half: "Half",
			third: "Third",
			quarter: "Quarter"
		};
		registerOp({
			name: "render.preview",
			category: "render",
			description: "Render a quick preview movie of a comp's work area (or the whole comp, or a span) through the render queue, so it can be watched at speed. Adds ONE temporary queue item, renders only that item (others are parked and their Render checkboxes restored), then removes it: the queue is left as it was found. Never overwrites an existing file unless overwrite is true; creates the output folder. Returns outputPath, timeSpanStart, durationSeconds, frameCount, frameRate, renderSeconds (wall clock of the render), elapsedSeconds (AE's own count), bytes, outputTemplate, resolution (+ resolutionReadBack) and warnings. It changes the render queue:" + RENDER_QUEUE_UNDO_WARNING + " Blocks until done: raise ae_do timeoutMs for long comps (235 frames at 1080×1920 with 'High Quality' took about 20 s). Defaults are what is known to work: output template 'High Quality' (a ProRes .mov) at full resolution; resolution 'half' was measured live (540×960 from 1080×1920, about a third of the time). listTemplates: true renders nothing and returns the render-settings and output-module template names, read from a temporary queue item that is removed again. Every answer carries projectModified: true and projectNote: adding and removing a queue item leaves the project unsaved.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "outputPath",
					type: "string",
					description: "Movie file path (the output template may change the extension; the path AE actually wrote is returned). Required unless listTemplates",
					required: false
				},
				{
					name: "listTemplates",
					type: "boolean",
					description: "Render nothing: return renderTemplates and outputTemplates, read from a temporary queue item for comp that is removed again",
					required: false,
					default: false
				},
				{
					name: "span",
					type: "string",
					description: "workArea (default) | comp — what to render when no explicit time span is given",
					required: false,
					default: "workArea"
				},
				{
					name: "timeSpanStart",
					type: "number",
					description: "Explicit span start in seconds (comp time); overrides span",
					required: false
				},
				{
					name: "timeSpanDuration",
					type: "number",
					description: "Explicit span duration in seconds; overrides span",
					required: false
				},
				{
					name: "outputTemplate",
					type: "string",
					description: "Output module template (default 'High Quality'); refused, with the available names, when it does not exist",
					required: false,
					default: "High Quality"
				},
				{
					name: "renderTemplate",
					type: "string",
					description: "Render settings template (default: the queue item's own default)",
					required: false
				},
				{
					name: "resolution",
					type: "string",
					description: "full (default, untouched) | half | third | quarter. Set through setSettings({ Resolution }) and read back; resolutionReadBack and a warning say whether it took",
					required: false,
					default: "full"
				},
				{
					name: "renderSettings",
					type: "object",
					description: "Raw render settings applied to the temporary item (RenderQueueItem.setSettings, keys from render.get_settings), after renderTemplate and resolution",
					required: false
				},
				{
					name: "overwrite",
					type: "boolean",
					description: "Replace an existing file at the output path (default false: refuse)",
					required: false,
					default: false
				}
			],
			toJsx(args) {
				if (args.listTemplates === true) return `
            ${jsxCompPreamble(args)}
            ${READ_TEMPLATES_FN}
            var rq = app.project.renderQueue;
            if (AE.safeGet(function () { return rq.rendering; }, false)) return { ok: false, error: "the render queue is already rendering; wait for it to finish" };
            var _tmp = null;
            try {
                _tmp = rq.items.add(_comp);
                var _read = _readTemplates(_tmp);
                return { ok: true, renderTemplates: _read.renderTemplates, outputTemplates: _read.outputTemplates, projectModified: true, projectNote: ${jsxVal(QUEUE_CHANGE_NOTE)} };
            } catch (eT) {
                return { ok: false, error: "could not read templates: " + AE.errText(eT), projectModified: true, projectNote: ${jsxVal(QUEUE_CHANGE_NOTE)} };
            } finally {
                if (_tmp) { try { _tmp.remove(); } catch (eRm) {} }
            }
        `;
				if (typeof args.outputPath !== "string" || args.outputPath === "") return jsxFail("outputPath is required (unless listTemplates is true)");
				const span = args.span ?? "workArea";
				if (span !== "workArea" && span !== "comp") return jsxFail("span must be workArea or comp");
				const resolution = String(args.resolution ?? "full").toLowerCase();
				if (!(resolution in PREVIEW_RESOLUTIONS)) return jsxFail("resolution must be full, half, third or quarter");
				if (args.timeSpanStart === void 0 !== (args.timeSpanDuration === void 0)) return jsxFail("give both timeSpanStart and timeSpanDuration, or neither");
				if (args.timeSpanDuration !== void 0 && !(Number(args.timeSpanDuration) > 0)) return jsxFail("timeSpanDuration must be above 0");
				return `
            ${jsxCompPreamble(args)}
            ${PARK_QUEUE_FN}
            var rq = app.project.renderQueue;
            if (AE.safeGet(function () { return rq.rendering; }, false)) return { ok: false, error: "the render queue is already rendering; wait for it to finish" };
            var _overwrite = ${jsxVal(!!args.overwrite)};
            var _want = ${jsxVal(String(args.outputPath))};
            function _meta(_path) {
                var _f = new File(_path);
                if (!_f.exists) return { exists: false, bytes: 0, modifiedMs: null };
                var _d = _f.modified;
                return { exists: true, bytes: _f.length, modifiedMs: _d ? _d.getTime() : null };
            }
            var _existing = _meta(_want);
            if (_existing.exists && !_overwrite) return { ok: false, error: "a file already exists at " + _want + "; pass overwrite: true to replace it, or choose another outputPath", existing: _want };
            var _w = [];
            var _out = null;
            var _rqi = null;
            var _numBefore = rq.numItems;
            var _parked = _parkQueue(rq);
            try {
                _rqi = rq.items.add(_comp);
                ${args.renderTemplate !== void 0 ? `var _wr = AE.applyTemplate(_rqi, ${jsxVal(args.renderTemplate)}, "renderTemplate"); if (_wr) throw new Error(_wr);` : ""}
                var _om = _rqi.outputModule(1);
                var _wo = AE.applyTemplate(_om, ${jsxVal(args.outputTemplate ?? "High Quality")}, "outputTemplate");
                if (_wo) throw new Error(_wo);
                var _start = ${args.timeSpanStart !== void 0 ? jsxVal(args.timeSpanStart) : span === "comp" ? "0" : "_comp.workAreaStart"};
                var _dur = ${args.timeSpanDuration !== void 0 ? jsxVal(args.timeSpanDuration) : span === "comp" ? "_comp.duration" : "_comp.workAreaDuration"};
                _rqi.timeSpanStart = _start;
                _rqi.timeSpanDuration = _dur;
                var _res = ${jsxVal(resolution)};
                var _resBack = null;
                if (_res !== "full") {
                    var _resName = ${jsxVal(PREVIEW_RESOLUTIONS[resolution])};
                    try { _rqi.setSettings({ "Resolution": _resName }); } catch (eRs) { _w.push("resolution: setSettings failed: " + AE.errText(eRs)); }
                    try { _resBack = _rqi.getSettings(GetSettingsFormat.STRING_SETTABLE)["Resolution"]; } catch (eRb) { _w.push("resolution: could not read it back: " + AE.errText(eRb)); }
                    if (_resBack !== null && String(_resBack) !== _resName) _w.push("resolution: asked for " + _resName + " but the item reads " + String(_resBack) + " \u2014 the preview may be full size");
                }
                ${args.renderSettings !== void 0 ? `try { _rqi.setSettings(${jsxVal(args.renderSettings)}); } catch (eSs) { _w.push("renderSettings: " + AE.errText(eSs)); }` : ""}
                _om.file = AE.ensureParentDir(_want);
                var _path = _om.file ? _om.file.fsName.replace(/\\\\/g, "/") : _want;
                var _before = _meta(_path);
                if (_path !== _want && _before.exists && !_overwrite) throw new Error("the output template writes " + _path + ", which already exists; pass overwrite: true to replace it");
                var _t0 = new Date().getTime();
                rq.render();
                var _t1 = new Date().getTime();
                var _after = _meta(_path);
                var _fresh = _after.exists && _after.bytes > 0 &&
                    (!_before.exists || _after.bytes !== _before.bytes || (_after.modifiedMs !== null && _after.modifiedMs !== _before.modifiedMs));
                var _status = _rqi.status;
                var _fd = _comp.frameDuration;
                _out = {
                    ok: _status === RQItemStatus.DONE && _fresh,
                    outputPath: _path,
                    span: ${args.timeSpanStart !== void 0 ? "\"custom\"" : jsxVal(span)},
                    timeSpanStart: _start,
                    durationSeconds: _dur,
                    frameCount: Math.round(_dur / _fd),
                    frameRate: Math.round(1e3 / _fd) / 1e3,
                    renderSeconds: Math.round(_t1 - _t0) / 1000,
                    elapsedSeconds: AE.safeGet(function () { return _rqi.elapsedSeconds; }, null),
                    bytes: _after.bytes,
                    outputTemplate: ${jsxVal(args.outputTemplate ?? "High Quality")},
                    resolution: _res,
                    overwritten: _before.exists,
                    warnings: _w
                };
                if (_res !== "full") _out.resolutionReadBack = _resBack;
                if (!_out.ok) _out.error = _status !== RQItemStatus.DONE ? "the render did not finish (status " + String(_status) + ")" : "the render left no new file at " + _path;
            } catch (eP) {
                _out = { ok: false, error: "preview render failed: " + AE.errText(eP), warnings: _w };
            } finally {
                if (_rqi) { try { _rqi.remove(); } catch (eRm) { _w.push("could not remove the preview's queue item: " + AE.errText(eRm)); } }
                _unparkQueue(rq, _parked);
            }
            if (rq.numItems !== _numBefore) _w.push("the render queue has " + rq.numItems + " items, it had " + _numBefore);
            _out.projectModified = true;
            _out.projectNote = ${jsxVal(QUEUE_CHANGE_NOTE)};
            return _out;
        `;
			}
		});
		DELIVERY_PRESETS = {
			"vertical-reel": {
				what: "a vertical reel for upload: H.264 at the comp's size and rate",
				first: "H.264 - Match Render Settings - 15 Mbps",
				then: [/^H\.264/i],
				fallback: ["High Quality", "Lossless"],
				fallbackWhy: "no H.264 template on this install, so ProRes 422 instead: a larger file that most upload sites take, or transcode it",
				alpha: false,
				aspect: 9 / 16
			},
			"master-alpha": {
				what: "a master with alpha for compositing elsewhere: ProRes 4444",
				first: "High Quality with Alpha",
				then: ["Lossless with Alpha"],
				fallback: [/alpha/i],
				fallbackWhy: "neither High Quality with Alpha nor Lossless with Alpha is on this install, so another movie template whose name says alpha",
				alpha: true
			},
			master: {
				what: "a master without alpha: ProRes 422",
				first: "High Quality",
				then: ["Lossless"],
				fallback: [/^H\.264/i],
				fallbackWhy: "neither High Quality nor Lossless is on this install, so H.264, which is not a master",
				alpha: false
			}
		};
		isSequenceTemplate = (n) => /sequence|photoshop|aiff|alpha only|^_hidden/i.test(n);
		DELIVERY_TRUE_PEAK_NOTE_DBTP = -1;
		DELIVERY_SILENCE_TOP = .1;
		DELIVERY_SILENCE_DB = -60;
		registerOp({
			name: "render.deliver",
			category: "render",
			description: `Deliver a comp with a named preset and check the file that was written. Presets: 'vertical-reel' (H.264 - Match Render Settings - 15 Mbps, else another H.264 template, else High Quality (ProRes 422) and says so), 'master-alpha' (High Quality with Alpha (ProRes 4444), else Lossless with Alpha, else another movie template whose name says alpha; refuses when there is none), 'master' (High Quality, else Lossless). High Quality, High Quality with Alpha and the three H.264 templates are what Adobe documents for a stock install; a template can be deleted, so the result says which was used and why. Renders the whole comp through one temporary queue item (other items parked), then brings the file back and compares size, frame rate and duration (within half a frame) with the comp, and the sound: when the comp has sound on, a file with no sound track, or one that reads as silence, is flagged (a four-channel take read as silence in After Effects with no warning). The level comes from ffmpeg (mean and max dB) when it is installed, else from After Effects' Convert Audio to Keyframes on the file. The sound is put on its frame: After Effects' AAC encoder starts the sound with ${AE_AAC_PRIMING_SAMPLES} samples of priming and writes no edit list, so in players the voice ran ${AE_AAC_PRIMING_SAMPLES} samples (0.64 of a frame at 30 fps, 48 kHz) late; the file's edit list is read from its own boxes, and when the priming is not skipped the file is remuxed with ffmpeg (-c copy, nothing re-encoded) so an edit list skips it, read back, and replaces the file only when it does (check.file.sync, check.file.alignment). Without ffmpeg that is a 'sound late' finding with the command that fixes it. With ffmpeg the check also reports the delivered file's integrated loudness (LUFS), loudness range (LU) and true peak (dBTP) from ebur128 (check.file.loudness), and says when the true peak is above -1 dBTP; it sets no loudness target. Returns \`check\` { passed, findings, reading }. After this, undo and rollback are refused for the rest of the After Effects session unless acceptRenderQueueRisk: true: After Effects 2027 has gone into crash recovery on undo after scripted render-queue changes (observed twice on 2026-11-10; a precaution, not a proven cause). Save the project before undoing anything afterwards; project.open / project.new clear the block.`,
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "preset",
					type: "string",
					description: "'vertical-reel', 'master-alpha' or 'master'",
					required: true
				},
				{
					name: "outputPath",
					type: "string",
					description: "Absolute path for the file (the template may change the extension; the path written is returned)",
					required: true
				},
				{
					name: "overwrite",
					type: "boolean",
					description: "Replace an existing file (default false)",
					required: false
				}
			],
			toJsx: () => jsxFail("render.deliver runs in Node; call it through ae_do"),
			run: (args, transport) => runDeliver(args, liveDeliverIO(transport))
		});
		registerOp({
			name: "render.mux_audio",
			category: "render",
			description: "Join a rendered picture with a mix made outside After Effects (a WAV): the recipe is render.deliver for the picture, then this, then look at its check. The picture is copied as it is (-c:v copy, nothing re-encoded); the mix is encoded to AAC at 48 kHz by ffmpeg, which writes its own edit list over the encoder's priming, so the sound sits on its frame. offsetSeconds moves the mix, sample-exact: positive pads silence before it, negative trims its start. Then the same file check as render.deliver on the new file: size, frame rate and duration against the picture, the sound's edit list read back (check.file.sync), its level, and its loudness (integrated LUFS, loudness range and true peak from ebur128, check.file.loudness); and a 'mix length' finding when the mix runs more than one frame longer or shorter than the picture. Needs ffmpeg and ffprobe: without them it says so and writes nothing. Does not touch the After Effects project.",
			readOnly: true,
			params: [
				{
					name: "video",
					type: "string",
					description: "Absolute path of the rendered picture (from render.deliver).",
					required: true
				},
				{
					name: "audio",
					type: "string",
					description: "Absolute path of the mix, a WAV made outside After Effects.",
					required: true
				},
				{
					name: "output",
					type: "string",
					description: "Absolute path for the joined file (default: <video name>-mix beside the picture, same extension).",
					required: false
				},
				{
					name: "overwrite",
					type: "boolean",
					description: "Replace an existing file at output (default false: refuse).",
					required: false
				},
				{
					name: "offsetSeconds",
					type: "number",
					description: "Move the mix against the picture, seconds: positive starts it later (silence before), negative trims its start (default 0).",
					required: false
				},
				{
					name: "bitrate",
					type: "string",
					description: "AAC bitrate, such as '320k' (default '320k').",
					required: false
				}
			],
			toJsx: () => jsxFail("render.mux_audio runs in Node; call it through ae_do"),
			run: (args) => runMuxAudio(args)
		});
	})))();
}

// operations/snippets.js
var COMP_INFO_FN, LAYER_FULL_FN, RENDER_FRAME_FN, MISSING_SOURCES_FN, OCIO_CAPTURE_FN, LIST_MISSING_FONTS_FN, LIST_MISSING_FOOTAGE_FN, COMP_CORNERS_FN;
function init_snippets() {
	return (init_snippets = __esmMin((() => {
		COMP_INFO_FN = `
    function _compInfo(c) {
        var _ciLayers = [];
        for (var _ci = 1; _ci <= c.numLayers; _ci++) {
            _ciLayers.push(AE.serializeLayerSummary(c.layer(_ci)));
        }
        var _ciOut = AE.serializeItemSummary(c);
        _ciOut.ok = true;
        _ciOut.found = true;
        _ciOut.workAreaStart = c.workAreaStart;
        _ciOut.workAreaDuration = c.workAreaDuration;
        _ciOut.pixelAspect = c.pixelAspect;
        _ciOut.shutterAngle = c.shutterAngle;
        _ciOut.shutterPhase = c.shutterPhase;
        _ciOut.motionBlur = c.motionBlur;
        // Comp markers (time, comment, duration per key), or null when there are none.
        _ciOut.markers = AE.serializeCompMarkers(c);
        _ciOut.layers = _ciLayers;
        return _ciOut;
    }
`;
		LAYER_FULL_FN = `
    function _layerFull(l, incl, detail) {
        var _lfOut = AE.serializeLayerFull(l, { includeProperties: incl, detail: detail });
        _lfOut.ok = true;
        _lfOut.found = true;
        return _lfOut;
    }
`;
		RENDER_FRAME_FN = `
    function _renderFrame(c, t0, outAbs, useDst) {
        var _rfT = t0;
        if (useDst) _rfT = _rfT + c.displayStartTime;
        var _rfFile = AE.ensureParentDir(outAbs);
        try {
            c.saveFrameToPng(_rfT, _rfFile);
            return {
                ok: true,
                writtenTo: _rfFile.fsName.replace(/\\\\/g, "/"),
                time: _rfT,
                compName: c.name,
                size: [c.width, c.height]
            };
        } catch (eRf) {
            return { ok: false, error: "saveFrameToPng failed: " + AE.errText(eRf) };
        }
    }
`;
		MISSING_SOURCES_FN = `
    function _missingSources(_msRoot) {
        var _msOut = [];
        var _msComps = {};
        var _msFootage = {};
        function _msWalk(_comp) {
            if (_msComps[_comp.id]) return;
            _msComps[_comp.id] = true;
            for (var _li = 1; _li <= _comp.numLayers; _li++) {
                var _source = AE.safeGet(function () { return _comp.layer(_li).source; }, null);
                if (!_source) continue;
                if (_source instanceof CompItem) { _msWalk(_source); continue; }
                if (!(_source instanceof FootageItem) || _msFootage[_source.id]) continue;
                _msFootage[_source.id] = true;
                var _file = AE.safeGet(function () { return _source.file; }, null);
                var _missing = AE.safeGet(function () { return _source.footageMissing; }, false);
                if (!_missing && (!_file || _file.exists)) continue;
                var _missingPath = AE.safeGet(function () { return _source.mainSource.missingFootagePath; }, null);
                if (!_missingPath && _file) _missingPath = _file.fsName;
                _msOut.push({ id: _source.id, name: _source.name, path: _missingPath });
            }
        }
        _msWalk(_msRoot);
        return _msOut;
    }
`;
		OCIO_CAPTURE_FN = `
    function _captureWithOcio(c, maxT, renderAll) {
        var _adj = null;
        var _adjSrc = null;
        var _ran = false;
        try {
            _adj = c.layers.addSolid([1, 1, 1], "__mcp_ocio__", c.width, c.height, c.pixelAspect);
            _adjSrc = _adj.source;
            _adj.adjustmentLayer = true;
            try {
                if (_adj.outPoint < maxT + c.frameDuration) _adj.outPoint = maxT + c.frameDuration;
            } catch (eOp) { }
            var _fxOk = false;
            try {
                _adj.property("Effects").addProperty("ADBE OCIO Display Transform");
                _fxOk = true;
            } catch (eFx) { /* pre-OCIO AE or ICC color engine */ }
            if (_fxOk) { _ran = true; renderAll("ocio"); }
        } catch (eTmp) { /* fall through to direct capture */ }
        if (_adj) { try { _adj.remove(); } catch (eRm) { } }
        if (_adjSrc) { try { _adjSrc.remove(); } catch (eRs) { } }
        return _ran;
    }
`;
		LIST_MISSING_FONTS_FN = `
    function _listMissingFonts() {
        if (!app.fonts) return { ok: false, error: "app.fonts needs AE 24.0+" };
        var _missing = [];
        try {
            var _list = app.fonts.missingOrSubstitutedFonts;
            for (var _i = 0; _i < _list.length; _i++) {
                var _font = _list[_i];
                _missing.push({
                    postScriptName: AE.safeGet(function () { return _font.postScriptName; }, null),
                    familyName: AE.safeGet(function () { return _font.familyName; }, null),
                    styleName: AE.safeGet(function () { return _font.styleName; }, null)
                });
            }
        } catch (eM) { return { ok: false, error: "missingOrSubstitutedFonts failed: " + AE.errText(eM) }; }
        return { ok: true, count: _missing.length, fonts: _missing };
    }
`;
		LIST_MISSING_FOOTAGE_FN = `
    function _listMissingFootage() {
        var _missing = [];
        for (var _i = 1; _i <= app.project.numItems; _i++) {
            var _it = app.project.item(_i);
            if (!(_it instanceof FootageItem)) continue;
            var _isMissing = AE.safeGet(function () { return _it.footageMissing; }, false);
            if (!_isMissing) continue;
            _missing.push({
                id: _it.id,
                name: _it.name,
                missingPath: AE.safeGet(function () { return _it.mainSource.missingFootagePath; }, null),
                usedInComps: AE.safeGet(function () {
                    var _u = [];
                    var _comps = _it.usedIn;
                    for (var _ci = 0; _ci < _comps.length; _ci++) _u.push(_comps[_ci].name);
                    return _u;
                }, [])
            });
        }
        return { ok: true, count: _missing.length, items: _missing };
    }
`;
		COMP_CORNERS_FN = `
    function _compCorners(layer, r) {
        return {
            topLeft: AE.valueToJson(layer.sourcePointToComp([r.left, r.top])),
            topRight: AE.valueToJson(layer.sourcePointToComp([r.left + r.width, r.top])),
            bottomLeft: AE.valueToJson(layer.sourcePointToComp([r.left, r.top + r.height])),
            bottomRight: AE.valueToJson(layer.sourcePointToComp([r.left + r.width, r.top + r.height]))
        };
    }
`;
	})))();
}

// operations/timeline.js
function init_timeline() {
	return (init_timeline = __esmMin((() => {
		init_registry();
		registerOp({
			name: "timeline.set_time",
			category: "timeline",
			description: "Set the current time indicator (CTI) in a composition.",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}, {
				name: "time",
				type: "number",
				description: "Time in seconds",
				required: true
			}],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            _comp.time = ${jsxVal(args.time)};
            return { ok: true, time: _comp.time };
        `;
			}
		});
		registerOp({
			name: "timeline.set_active_comp",
			category: "timeline",
			description: "Set the active (visible in UI) composition. Opens it in the viewer.",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            _comp.openInViewer();
            return { ok: true, name: _comp.name };
        `;
			}
		});
		registerOp({
			name: "timeline.select_layers",
			category: "timeline",
			description: "Select (or deselect) layers in a comp by index.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "indices",
					type: "array",
					description: "Array of 1-based layer indices to select",
					required: true
				},
				{
					name: "deselectOthers",
					type: "boolean",
					description: "Deselect all other layers first (default true)",
					required: false,
					default: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _indices = ${jsxVal(args.indices)};
            if (${jsxVal(args.deselectOthers !== false)}) {
                for (var i = 1; i <= _comp.numLayers; i++) _comp.layer(i).selected = false;
            }
            for (var j = 0; j < _indices.length; j++) {
                if (_indices[j] >= 1 && _indices[j] <= _comp.numLayers) {
                    _comp.layer(_indices[j]).selected = true;
                }
            }
            return { ok: true, selected: _indices.length };
        `;
			}
		});
	})))();
}

// operations/viewer.js
function init_viewer() {
	return (init_viewer = __esmMin((() => {
		init_registry();
		registerOp({
			name: "viewer.get_state",
			category: "viewer",
			readOnly: true,
			description: "Read the active viewer's state: type, zoom, exposure, channels.",
			params: [],
			toJsx() {
				return `
            var _v = app.activeViewer;
            if (!_v) return { ok: false, error: "no active viewer" };
            var _view = _v.views[_v.activeViewIndex];
            var _opts = _view ? _view.options : null;
            // Friendly names round-trip into viewer.set_options; unknown enum
            // values fall through as their raw string form.
            function _fpName(v) {
                try {
                    if (v === FastPreviewType.FP_OFF) return "off";
                    if (v === FastPreviewType.FP_ADAPTIVE_RESOLUTION) return "adaptiveResolution";
                    if (v === FastPreviewType.FP_DRAFT) return "draft";
                    if (v === FastPreviewType.FP_FAST_DRAFT) return "fastDraft";
                    if (v === FastPreviewType.FP_WIREFRAME) return "wireframe";
                } catch (eFp) {}
                return (v === undefined || v === null) ? null : String(v);
            }
            return {
                ok: true,
                type: String(_v.type),
                maximized: _v.maximized,
                zoom: _opts ? AE.safeGet(function () { return _opts.zoom; }, null) : null,
                exposure: _opts ? AE.safeGet(function () { return _opts.exposure; }, null) : null,
                channels: _opts ? AE.safeGet(function () { return String(_opts.channels); }, null) : null,
                checkerboards: _opts ? AE.safeGet(function () { return _opts.checkerboards; }, null) : null,
                fastPreview: _opts ? AE.safeGet(function () { return _fpName(_opts.fastPreview); }, null) : null,
                guidesLocked: _opts ? AE.safeGet(function () { return _opts.guidesLocked; }, null) : null,
                guidesSnap: _opts ? AE.safeGet(function () { return _opts.guidesSnap; }, null) : null
            };
        `;
			}
		});
		registerOp({
			name: "viewer.set_options",
			category: "viewer",
			readOnly: true,
			description: "Set active-viewer view options: zoom (1 = 100%), exposure (stops), checkerboard, guide/ruler visibility and lock/snap (AE 16.1+), fast-preview mode, and the displayed channels.",
			params: [
				{
					name: "zoom",
					type: "number",
					description: "Zoom factor (1 = 100%)",
					required: false
				},
				{
					name: "exposure",
					type: "number",
					description: "Exposure in stops",
					required: false
				},
				{
					name: "checkerboards",
					type: "boolean",
					description: "Show transparency checkerboard",
					required: false
				},
				{
					name: "guidesVisibility",
					type: "boolean",
					description: "Show guides (AE 16.1+)",
					required: false
				},
				{
					name: "guidesLocked",
					type: "boolean",
					description: "Lock guides (AE 16.1+)",
					required: false
				},
				{
					name: "guidesSnap",
					type: "boolean",
					description: "Snap to guides (AE 16.1+)",
					required: false
				},
				{
					name: "rulers",
					type: "boolean",
					description: "Show rulers (AE 16.1+)",
					required: false
				},
				{
					name: "maximized",
					type: "boolean",
					description: "Maximize the viewer panel",
					required: false
				},
				{
					name: "fastPreview",
					type: "string",
					description: "off|adaptiveResolution|draft|fastDraft|wireframe",
					required: false
				},
				{
					name: "channels",
					type: "string",
					description: "rgb|red|green|blue|alpha|alphaBoundary|alphaOverlay|rgbStraight",
					required: false
				}
			],
			toJsx(args) {
				const sets = [];
				if (args.fastPreview !== void 0) sets.push(`
        try {
            var _fpMap = { "off": FastPreviewType.FP_OFF, "adaptiveResolution": FastPreviewType.FP_ADAPTIVE_RESOLUTION, "draft": FastPreviewType.FP_DRAFT, "fastDraft": FastPreviewType.FP_FAST_DRAFT, "wireframe": FastPreviewType.FP_WIREFRAME };
            if (_fpMap.hasOwnProperty(${jsxVal(args.fastPreview)})) { _opts.fastPreview = _fpMap[${jsxVal(args.fastPreview)}]; }
            else { _w.push("fastPreview: unknown value " + ${jsxVal(args.fastPreview)}); }
        } catch (e) { _w.push("fastPreview: " + AE.errText(e)); }`);
				if (args.channels !== void 0) sets.push(`
        try {
            var _chMap = { "rgb": ChannelType.CHANNEL_RGB, "red": ChannelType.CHANNEL_RED, "green": ChannelType.CHANNEL_GREEN, "blue": ChannelType.CHANNEL_BLUE, "alpha": ChannelType.CHANNEL_ALPHA, "alphaBoundary": ChannelType.CHANNEL_ALPHA_BOUNDARY, "alphaOverlay": ChannelType.CHANNEL_ALPHA_OVERLAY, "rgbStraight": ChannelType.CHANNEL_RGB_STRAIGHT };
            if (_chMap.hasOwnProperty(${jsxVal(args.channels)})) { _opts.channels = _chMap[${jsxVal(args.channels)}]; }
            else { _w.push("channels: unknown value " + ${jsxVal(args.channels)}); }
        } catch (e) { _w.push("channels: " + AE.errText(e)); }`);
				if (args.guidesLocked !== void 0) sets.push(`try { _opts.guidesLocked = ${jsxVal(args.guidesLocked)}; } catch (e) { _w.push("guidesLocked (AE 16.1+): " + AE.errText(e)); }`);
				if (args.guidesSnap !== void 0) sets.push(`try { _opts.guidesSnap = ${jsxVal(args.guidesSnap)}; } catch (e) { _w.push("guidesSnap (AE 16.1+): " + AE.errText(e)); }`);
				if (args.zoom !== void 0) sets.push(`try { _opts.zoom = ${jsxVal(args.zoom)}; } catch (e) { _w.push("zoom: " + AE.errText(e)); }`);
				if (args.exposure !== void 0) sets.push(`try { _opts.exposure = ${jsxVal(args.exposure)}; } catch (e) { _w.push("exposure: " + AE.errText(e)); }`);
				if (args.checkerboards !== void 0) sets.push(`try { _opts.checkerboards = ${jsxVal(args.checkerboards)}; } catch (e) { _w.push("checkerboards: " + AE.errText(e)); }`);
				if (args.guidesVisibility !== void 0) sets.push(`try { _opts.guidesVisibility = ${jsxVal(args.guidesVisibility)}; } catch (e) { _w.push("guidesVisibility (AE 16.1+): " + AE.errText(e)); }`);
				if (args.rulers !== void 0) sets.push(`try { _opts.rulers = ${jsxVal(args.rulers)}; } catch (e) { _w.push("rulers (AE 16.1+): " + AE.errText(e)); }`);
				if (args.maximized !== void 0) sets.push(`try { _v.maximized = ${jsxVal(args.maximized)}; } catch (e) { _w.push("maximized: " + AE.errText(e)); }`);
				return `
            var _v = app.activeViewer;
            if (!_v) return { ok: false, error: "no active viewer \u2014 open a comp first (timeline.set_active_comp)" };
            var _view = _v.views[_v.activeViewIndex];
            if (!_view) return { ok: false, error: "active viewer has no view" };
            var _opts = _view.options;
            var _w = [];
            ${sets.join("\n")}
            return { ok: true, warnings: _w };
        `;
			}
		});
	})))();
}

// operations/shape-contents.js
var LAYER_TARGET_PARAM;
function init_shape_contents() {
	return (init_shape_contents = __esmMin((() => {
		init_registry();
		LAYER_TARGET_PARAM = {
			name: "layer",
			type: "any",
			description: "Layer index, name, { id }, 'selected', 'all', or an array of those (shape layers)",
			required: true
		};
		registerOp({
			name: "shape.group_bounds",
			category: "shape",
			readOnly: true,
			description: "Bounds of each top-level vector group of a shape layer, in LAYER space with the group's own transform applied — what you need to split, align, or anchor per part. Geometry-based (exact for paths/rects/ellipses; strokes padded in; stars and path modifiers such as Trim/Repeater are listed in `approximate`). Also reports the whole layer's bounds.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				LAYER_TARGET_PARAM,
				{
					name: "time",
					type: "number",
					description: "Evaluate animated paths/transforms at this time (default: current value)",
					required: false
				},
				{
					name: "includeStroke",
					type: "boolean",
					description: "Pad by half the widest stroke (default true)",
					required: false,
					default: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _layers = AE.resolveLayers(_comp, ${jsxVal(args.layer)});
            if (_layers.length === 0) return { ok: false, error: "no layers matched" };
            var _opts = { time: ${jsxVal(args.time ?? null)}, includeStroke: ${jsxVal(args.includeStroke !== false)} };
            var _out = [];
            for (var _li = 0; _li < _layers.length; _li++) {
                var _l = _layers[_li];
                if (!(_l instanceof ShapeLayer)) { _out.push({ index: _l.index, name: _l.name, ok: false, error: "not a shape layer" }); continue; }
                var _contents = _l.property("Contents");
                var _groups = [];
                for (var _gi = 1; _gi <= _contents.numProperties; _gi++) {
                    var _g = _contents.property(_gi);
                    if (_g.matchName !== "ADBE Vector Group") continue;
                    var _b = AE.shapeGroupBounds(_g, _opts);
                    _b.index = _gi;
                    _b.name = _g.name;
                    _groups.push(_b);
                }
                _out.push({ index: _l.index, name: _l.name, ok: true, layer: AE.shapeLayerBounds(_l, _opts), groups: _groups });
            }
            return { ok: true, count: _out.length, layers: _out };
        `;
			}
		});
		registerOp({
			name: "shape.recolor",
			category: "shape",
			description: "Replace fill and/or stroke colors throughout a shape layer's contents (any nesting depth). Either `color` (paint everything one color — silhouettes) or `map` ([{ from, to }] — per-color substitution, matched within `tolerance`). Colors are [r,g,b] 0-1 (alpha optional).",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				LAYER_TARGET_PARAM,
				{
					name: "target",
					type: "string",
					description: "fill|stroke|both (default both)",
					required: false,
					default: "both"
				},
				{
					name: "color",
					type: "array",
					description: "[r,g,b] — set every matching fill/stroke to this color",
					required: false
				},
				{
					name: "map",
					type: "array",
					description: "[{ from: [r,g,b], to: [r,g,b] }, …] — replace only colors that match `from`",
					required: false
				},
				{
					name: "tolerance",
					type: "number",
					description: "Per-channel match tolerance for `map` (default 0.01)",
					required: false,
					default: .01
				}
			],
			toJsx(args) {
				if (args.color === void 0 && args.map === void 0) return jsxFail("give either color (recolor everything) or map (per-color substitution)");
				return `
            ${jsxCompPreamble(args)}
            var _layers = AE.resolveLayers(_comp, ${jsxVal(args.layer)});
            if (_layers.length === 0) return { ok: false, error: "no layers matched" };
            var _target = ${jsxVal(args.target ?? "both")};
            if (_target !== "fill" && _target !== "stroke" && _target !== "both") return { ok: false, error: "target must be fill|stroke|both" };
            var _opts = { target: _target, color: ${jsxVal(args.color ?? null)}, map: ${jsxVal(args.map ?? null)}, tolerance: ${jsxVal(args.tolerance ?? .01)} };
            var _out = [];
            var _total = 0;
            for (var _li = 0; _li < _layers.length; _li++) {
                var _l = _layers[_li];
                if (!(_l instanceof ShapeLayer)) { _out.push({ index: _l.index, name: _l.name, ok: false, error: "not a shape layer" }); continue; }
                var _r = AE.recolorContents(_l.property("Contents"), _opts);
                _total += _r.changed;
                _out.push({ index: _l.index, name: _l.name, ok: true, changed: _r.changed, visited: _r.visited });
            }
            return { ok: true, changed: _total, layers: _out };
        `;
			}
		});
		registerOp({
			name: "shape.signature",
			category: "shape",
			readOnly: true,
			description: "Structural hash of a shape layer's contents and of each top-level group — matchNames plus rounded values, NO display names — so identical artwork hashes the same even after renaming. Use it to find duplicate layers when merging comps, or to check that a copy still matches its source.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				LAYER_TARGET_PARAM,
				{
					name: "precision",
					type: "number",
					description: "Decimal places kept when rounding values (default 2)",
					required: false,
					default: 2
				},
				{
					name: "time",
					type: "number",
					description: "Evaluate animated values at this time (default: current value)",
					required: false
				},
				{
					name: "includeLayerTransform",
					type: "boolean",
					description: "Also hash the layer's Transform group (default false — copies usually differ only in position)",
					required: false,
					default: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _layers = AE.resolveLayers(_comp, ${jsxVal(args.layer)});
            if (_layers.length === 0) return { ok: false, error: "no layers matched" };
            var _prec = ${jsxVal(args.precision ?? 2)};
            var _t = ${jsxVal(args.time ?? null)};
            var _withXf = ${jsxVal(args.includeLayerTransform === true)};
            var _out = [];
            for (var _li = 0; _li < _layers.length; _li++) {
                var _l = _layers[_li];
                if (!(_l instanceof ShapeLayer)) { _out.push({ index: _l.index, name: _l.name, ok: false, error: "not a shape layer" }); continue; }
                var _contents = _l.property("Contents");
                var _canon = AE.canonicalGroup(_contents, _prec, _t);
                if (_withXf) _canon += "|xf:" + AE.canonicalGroup(_l.property("Transform"), _prec, _t);
                var _groups = [];
                for (var _gi = 1; _gi <= _contents.numProperties; _gi++) {
                    var _g = _contents.property(_gi);
                    _groups.push({ index: _gi, name: _g.name, matchName: _g.matchName, signature: AE.hashString(AE.canonicalGroup(_g, _prec, _t)) });
                }
                _out.push({ index: _l.index, name: _l.name, ok: true, signature: AE.hashString(_canon), groups: _groups });
            }
            return { ok: true, count: _out.length, layers: _out };
        `;
			}
		});
		registerOp({
			name: "layer.split_groups",
			category: "layer",
			description: "Split a shape layer into one layer per top-level vector group (letters of a word, parts of a character), keeping every group's transform, fills and strokes. New layers stack in group order directly above the original. `anchor` re-anchors each new layer to its own artwork without moving it on screen.",
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
					description: "1-based layer index, name, or { id } (a shape layer)",
					required: true
				},
				{
					name: "groups",
					type: "array",
					description: "1-based indices of the groups to split out (default: every top-level group)",
					required: false
				},
				{
					name: "anchor",
					type: "string",
					description: "keep | center | topLeft | topCenter | topRight | centerLeft | centerRight | bottomLeft | bottomCenter | bottomRight — anchor each new layer on its own bounds (default keep)",
					required: false,
					default: "keep"
				},
				{
					name: "nameTemplate",
					type: "string",
					description: "Name for each new layer; tokens {group}, {layer}, {index} (default '{group}')",
					required: false,
					default: "{group}"
				},
				{
					name: "keepOriginal",
					type: "boolean",
					description: "Leave the source layer in place (default false: it is removed once split)",
					required: false,
					default: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            if (!(_layer instanceof ShapeLayer)) return { ok: false, error: "not a shape layer" };
            var _anchor = ${jsxVal(args.anchor ?? "keep")};
            if (_anchor !== "keep" && !AE.ANCHOR_PRESETS.hasOwnProperty(_anchor)) return { ok: false, error: "unknown anchor preset '" + _anchor + "'" };
            var _tpl = ${jsxVal(args.nameTemplate ?? "{group}")};
            var _contents = _layer.property("Contents");
            var _want = ${jsxVal(args.groups ?? null)};
            var _indices = [];
            if (_want === null) {
                for (var _gi = 1; _gi <= _contents.numProperties; _gi++) {
                    if (_contents.property(_gi).matchName === "ADBE Vector Group") _indices.push(_gi);
                }
            } else {
                for (var _wi = 0; _wi < _want.length; _wi++) {
                    var _w = _want[_wi];
                    if (_w < 1 || _w > _contents.numProperties) return { ok: false, error: "group index " + _w + " out of range (layer has " + _contents.numProperties + ")" };
                    _indices.push(_w);
                }
            }
            if (_indices.length === 0) return { ok: false, error: "no vector groups to split" };
            var _srcName = _layer.name;
            var _created = [];
            // duplicate() lands directly above the original, so each copy
            // slips in BELOW the copies made before it: creating the groups in
            // order leaves group 1 on top and the last group just above the
            // original, matching the render order inside the layer.
            for (var _k = 0; _k < _indices.length; _k++) {
                var _keep = _indices[_k];
                var _dup = _layer.duplicate();
                var _dc = _dup.property("Contents");
                for (var _ri = _dc.numProperties; _ri >= 1; _ri--) {
                    if (_ri !== _keep) _dc.property(_ri).remove();
                }
                var _grp = _dc.property(1);
                var _gname = _grp.name;
                _dup.name = _tpl.replace(/\\{group\\}/g, _gname).replace(/\\{layer\\}/g, _srcName).replace(/\\{index\\}/g, String(_keep));
                var _entry = { index: _dup.index, name: _dup.name, group: _gname, groupIndex: _keep };
                if (_anchor !== "keep") {
                    var _b = AE.shapeGroupBounds(_grp, {});
                    if (_b.empty) {
                        _entry.warning = "group has no geometry; anchor left unchanged";
                    } else {
                        var _pt = AE.pointInRect(_b, _anchor);
                        var _mv = AE.moveAnchor(_dup, _pt);
                        _entry.anchorPoint = _mv.anchorPoint;
                        if (_mv.warnings.length) _entry.warning = _mv.warnings.join("; ");
                    }
                }
                _created.push(_entry);
            }
            if (!${jsxVal(args.keepOriginal === true)}) _layer.remove();
            for (var _ci = 0; _ci < _created.length; _ci++) {
                _created[_ci].index = AE.findLayerInComp(_comp, _created[_ci].name) ? AE.findLayerInComp(_comp, _created[_ci].name).index : _created[_ci].index;
            }
            return { ok: true, source: _srcName, created: _created.length, layers: _created };
        `;
			}
		});
		registerOp({
			name: "layer.convert_to_shapes",
			category: "layer",
			description: "Run 'Create Shapes from Vector Layer' on imported Illustrator/vector layers: each becomes a shape layer directly above the original (which AE switches off). By default the ' Outlines' suffix AE appends is stripped; removeSource deletes the vector layers, removeFootage also deletes their footage items when nothing else uses them. Note: the shape layers can arrive with Position dimensions SEPARATED — every write in this server handles that.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				LAYER_TARGET_PARAM,
				{
					name: "stripSuffix",
					type: "boolean",
					description: "Rename the new layer to the original's name (drop ' Outlines' / localized suffix). Default true",
					required: false,
					default: true
				},
				{
					name: "removeSource",
					type: "boolean",
					description: "Delete the original vector layer after conversion (default false)",
					required: false,
					default: false
				},
				{
					name: "removeFootage",
					type: "boolean",
					description: "With removeSource: also delete the footage item when no other layer uses it (default false)",
					required: false,
					default: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _layers = AE.resolveLayers(_comp, ${jsxVal(args.layer)});
            if (_layers.length === 0) return { ok: false, error: "no layers matched" };
            var _cmd = 0;
            try { _cmd = app.findMenuCommandId("Create Shapes from Vector Layer"); } catch (eFind) {}
            // Menu names are localized; the id is not (3973 on every AE since CS6).
            if (!_cmd) _cmd = 3973;
            var _sources = [];
            for (var _si = 0; _si < _layers.length; _si++) {
                if (!(_layers[_si] instanceof AVLayer) || !_layers[_si].source) return { ok: false, error: "layer '" + _layers[_si].name + "' is not a footage layer" };
                _sources.push(_layers[_si]);
            }
            var _out = [];
            var _strip = ${jsxVal(args.stripSuffix !== false)};
            var _rmSrc = ${jsxVal(args.removeSource === true)};
            var _rmFoot = ${jsxVal(args.removeFootage === true)};
            try { _comp.openInViewer(); } catch (eV) {}
            for (var _i = 0; _i < _sources.length; _i++) {
                var _src = _sources[_i];
                var _srcName = _src.name;
                var _foot = _src.source;
                var _snap = AE.layerIdSnapshot(_comp);
                AE.withSelection(_comp, [_src], function () { app.executeCommand(_cmd); });
                var _added = AE.layersSince(_comp, _snap);
                var _shape = null;
                for (var _ai = 0; _ai < _added.length; _ai++) {
                    if (_added[_ai] instanceof ShapeLayer) { _shape = _added[_ai]; break; }
                }
                if (!_shape) { _out.push({ source: _srcName, ok: false, error: "the command created no shape layer (is the layer a vector footage layer?)" }); continue; }
                var _entry = { source: _srcName, ok: true, index: _shape.index, name: _shape.name, originalName: _shape.name };
                if (_strip) {
                    var _clean = _shape.name.replace(/\\s*Outlines$/, "").replace(/\\s*(\u306E)?\u30A2\u30A6\u30C8\u30E9\u30A4\u30F3$/, "");
                    if (_clean.length === 0) _clean = _srcName;
                    _shape.name = _clean;
                    _entry.name = _shape.name;
                }
                if (_rmSrc) {
                    _src.remove();
                    _entry.sourceRemoved = true;
                    if (_rmFoot && _foot) {
                        var _used = 0;
                        try { _used = _foot.usedIn.length; } catch (eU) { _used = 1; }
                        if (_used === 0) { try { _foot.remove(); _entry.footageRemoved = true; } catch (eF) { _entry.footageRemoved = false; } }
                        else _entry.footageRemoved = false;
                    }
                    _entry.index = _shape.index;
                }
                _out.push(_entry);
            }
            var _failed = 0;
            for (var _fi = 0; _fi < _out.length; _fi++) if (!_out[_fi].ok) _failed++;
            return { ok: _failed === 0, error: _failed === 0 ? null : (_failed + " of " + _out.length + " layers did not convert"), converted: _out.length - _failed, layers: _out };
        `;
			}
		});
	})))();
}

// operations/sample.js
function liveIO(transport) {
	return { async execute(code, opts) {
		const r = await transport.execute({
			code,
			label: opts.label,
			timeoutMs: opts.timeoutMs,
			undoGroup: opts.undoGroup ?? false,
			suppressDialogs: true
		});
		return r.ok ? r.result : {
			ok: false,
			error: r.error ?? `${opts.label} failed`
		};
	} };
}
function propertyPath(p) {
	if (Array.isArray(p) && p.length && p.every((x) => typeof x === "string")) return p;
	if (typeof p === "string") return TRANSFORM.includes(p) ? ["Transform", p] : [p];
	return null;
}
function curveReadJsx(args) {
	return `
            ${jsxCompLayerPreamble(args)}
            var _p = AE.propertyAtPath(_layer, ${jsxVal(args.path)});
            if (!_p || _p.propertyType !== PropertyType.PROPERTY) return { ok: false, error: "no property " + ${jsxVal(args.path.join(" > "))} + " on " + _layer.name };
            var _fd = _comp.frameDuration;
            var _s = ${jsxVal(args.start ?? null)};
            var _e = ${jsxVal(args.end ?? null)};
            if (_s === null) _s = Math.max(0, _layer.inPoint);
            if (_e === null) _e = Math.min(_comp.duration, _layer.outPoint);
            var _f0 = Math.round(_s / _fd);
            var _f1 = Math.round(_e / _fd);
            if (_f1 - _f0 > 3000) return { ok: false, error: "over 3000 frames; give start and end" };
            var _vals = [];
            for (var _f = _f0; _f <= _f1; _f++) {
                var _v = AE.valueToJson(AE.readValue(_p, _f * _fd));
                _vals.push(_v);
            }
            var _interp = function (v) {
                if (v === KeyframeInterpolationType.LINEAR) return "linear";
                if (v === KeyframeInterpolationType.BEZIER) return "bezier";
                if (v === KeyframeInterpolationType.HOLD) return "hold";
                return "other";
            };
            var _keys = [];
            for (var _k = 1; _k <= _p.numKeys; _k++) {
                var _kt = _p.keyTime(_k);
                _keys.push({ time: _kt, frame: Math.round(_kt / _fd), inInterpolation: _interp(_p.keyInInterpolationType(_k)), outInterpolation: _interp(_p.keyOutInterpolationType(_k)) });
            }
            return { ok: true, layer: _layer.name, property: _p.name, fps: 1 / _fd, startFrame: _f0, values: _vals, keys: _keys };
        `;
}
async function runCurve(args, io) {
	const p = propertyPath(args.property);
	if (!p) return {
		ok: false,
		error: "`property` must be a transform property's name or a path of names"
	};
	const num = (k) => typeof args[k] === "number" ? args[k] : void 0;
	const r = await io.execute(curveReadJsx({
		comp: args.comp,
		layer: args.layer,
		path: p,
		start: num("start"),
		end: num("end")
	}), {
		label: "motion.curve read",
		timeoutMs: 12e4
	});
	if (!r?.ok) return {
		ok: false,
		error: r?.error ?? "could not read the property"
	};
	const samples = r.values.map((v, i) => ({
		frame: r.startFrame + i,
		time: (r.startFrame + i) / r.fps,
		value: Array.isArray(v) ? v.map(Number) : [Number(v)]
	}));
	if (samples.some((s) => s.value.some((x) => !Number.isFinite(x)))) return {
		ok: false,
		error: `${r.property} is not a number or a list of numbers`
	};
	const report = analyzeCurve(samples, r.fps);
	let graph = null;
	if (typeof args.outPath === "string") {
		if (!path$1.isAbsolute(args.outPath)) return {
			ok: false,
			error: "`outPath` must be absolute (.png)"
		};
		const g = curveGraph(report, {
			width: 480,
			height: 160
		});
		await promises.mkdir(path$1.dirname(args.outPath), { recursive: true });
		await promises.writeFile(args.outPath, encodePngSrgb8(g.width, g.height, g.rgb));
		graph = args.outPath;
	}
	return {
		ok: true,
		layer: r.layer,
		property: r.property,
		fps: r.fps,
		span: {
			from: samples[0]?.frame ?? null,
			to: samples[samples.length - 1]?.frame ?? null
		},
		keys: r.keys,
		moves: report.moves,
		flags: report.flags,
		reading: report.reading,
		graph,
		...args.perFrame === true ? { frames: report.frames } : {}
	};
}
function amplitudeJsx(args) {
	return `
            ${jsxCompLayerPreamble(args)}
            if (!_layer.hasAudio) return { ok: false, error: _layer.name + " has no audio" };
            var _was = [];
            for (var _i = 1; _i <= _comp.numLayers; _i++) { _was.push(_comp.layer(_i).selected); _comp.layer(_i).selected = false; }
            var _before = _comp.numLayers;
            _comp.openInViewer();
            _layer.selected = true;
            var _id = app.findMenuCommandId("Convert Audio to Keyframes");
            if (!_id) return { ok: false, error: "After Effects has no Convert Audio to Keyframes command here" };
            app.executeCommand(_id);
            if (_comp.numLayers !== _before + 1) return { ok: false, error: "Convert Audio to Keyframes made no layer" };
            var _amp = null;
            for (var _j = 1; _j <= _comp.numLayers; _j++) { var _l = _comp.layer(_j); var _fx = _l.property("ADBE Effect Parade"); if (_fx && _fx.numProperties === 3 && _l !== _layer && _l.name.indexOf("Audio Amplitude") === 0) _amp = _l; }
            if (!_amp) return { ok: false, error: "could not find the Audio Amplitude layer" };
            var _fd = _comp.frameDuration;
            var _n = Math.round(_comp.duration / _fd);
            var _read = function (k) { var p = _amp.property("ADBE Effect Parade").property(k).property(1); var v = []; for (var f = 0; f < _n; f++) v.push(Math.round(p.valueAtTime(f * _fd, false) * 1000) / 1000); return v; };
            var _out = { ok: true, fps: 1 / _fd, left: _read(1), right: _read(2), both: _read(3) };
            _amp.remove();
            for (var _r = 1; _r <= _comp.numLayers && _r <= _was.length; _r++) _comp.layer(_r).selected = _was[_r - 1];
            return _out;
        `;
}
function fpsJsx(args) {
	return `
            ${jsxCompPreamble(args)}
            return { ok: true, fps: 1 / _comp.frameDuration };
        `;
}
function addMarkersJsx(args) {
	return `
            ${jsxCompPreamble(args)}
            var _mp = _comp.markerProperty;
            var _removed = 0;
            if (${jsxVal(args.replace)}) {
                for (var _k = _mp.numKeys; _k >= 1; _k--) if (String(_mp.keyValue(_k).comment).indexOf(${jsxVal(args.prefix + ":")}) === 0) { _mp.removeKey(_k); _removed++; }
            }
            var _ms = ${jsxVal(args.markers)};
            for (var _i = 0; _i < _ms.length; _i++) _mp.setValueAtTime(_ms[_i].time, new MarkerValue(_ms[_i].comment));
            return { ok: true, added: _ms.length, removed: _removed, numMarkers: _mp.numKeys };
        `;
}
async function runSoundMarkers(args, io) {
	const prefix = typeof args.prefix === "string" && args.prefix ? args.prefix : "sound";
	const hasTiming = typeof args.timing === "string";
	if (hasTiming === (args.layer !== void 0)) return {
		ok: false,
		error: "give exactly one of `timing` (a timing file) or `layer` (a layer with sound, read by loudness)"
	};
	let fps;
	let found;
	let source;
	if (hasTiming) {
		const f = args.timing;
		if (!path$1.isAbsolute(f)) return {
			ok: false,
			error: "`timing` must be an absolute path"
		};
		const r = await io.execute(fpsJsx({ comp: args.comp }), {
			label: "sound.markers fps",
			timeoutMs: 3e4
		});
		if (!r?.ok) return {
			ok: false,
			error: r?.error ?? "could not read the comp"
		};
		fps = r.fps;
		try {
			found = parseTiming(await promises.readFile(f, "utf8"), fps).map((m) => ({
				...m,
				frame: Math.round(m.time * fps)
			}));
		} catch (e) {
			return {
				ok: false,
				error: e instanceof Error ? e.message : String(e)
			};
		}
		source = {
			kind: "timing file",
			path: f
		};
	} else {
		const r = await io.execute(amplitudeJsx({
			comp: args.comp,
			layer: args.layer
		}), {
			label: "sound.markers amplitude",
			timeoutMs: 3e5,
			undoGroup: true
		});
		if (!r?.ok) return {
			ok: false,
			error: r?.error ?? "Convert Audio to Keyframes failed"
		};
		fps = r.fps;
		const left = r.left;
		const right = r.right;
		const louder = left.map((v, i) => Math.max(v, right[i] ?? 0));
		const top = Math.max(0, ...louder);
		if (top < .1) return {
			ok: false,
			error: `After Effects read this layer's sound as silence (Convert Audio to Keyframes' amplitude stays under ${SILENCE_BELOW} on every frame; its top was ${top}). A four-channel AAC take did this, though a four-channel WAV with the voice on its first channel read as left: extract the voice to a mono WAV (ffmpeg -i take.mp4 -af pan=mono|c0=c0 voice.wav), import that and read it instead, or give a timing file.`
		};
		found = soundOnsets(louder, fps, { share: typeof args.share === "number" ? args.share : void 0 }).map((o) => ({
			time: o.time,
			frame: o.frame,
			label: "beat",
			level: o.level
		}));
		source = {
			kind: "loudness",
			layer: args.layer,
			channels: {
				left: Math.max(0, ...left),
				right: Math.max(0, ...right)
			}
		};
	}
	const add = await io.execute(addMarkersJsx({
		comp: args.comp,
		markers: found.map((m) => ({
			time: m.time,
			comment: `${prefix}: ${m.label}`
		})),
		prefix,
		replace: args.replace !== false
	}), {
		label: "sound.markers add",
		timeoutMs: 6e4,
		undoGroup: true
	});
	if (!add?.ok) return {
		ok: false,
		error: add?.error ?? "could not add the markers"
	};
	return {
		ok: true,
		source,
		fps,
		markers: found,
		added: add.added,
		removed: add.removed,
		reading: `${found.length} marker${found.length === 1 ? "" : "s"} added as '${prefix}: \u2026'${add.removed ? `, ${add.removed} earlier ones replaced` : ""}.`
	};
}
function syncReadJsx(args) {
	return `
            ${jsxCompPreamble(args)}
            var _mp = _comp.markerProperty;
            var _markers = [];
            for (var _k = 1; _k <= _mp.numKeys; _k++) _markers.push({ time: _mp.keyTime(_k), comment: String(_mp.keyValue(_k).comment) });
            var _events = [];
            var _keys = ${jsxVal(args.keys)};
            for (var _i = 0; _i < _keys.length; _i++) {
                var _l = AE.findLayerInComp(_comp, _keys[_i].layer);
                if (!_l) return { ok: false, error: "no layer " + _keys[_i].layer };
                var _p = AE.propertyAtPath(_l, _keys[_i].path);
                if (!_p) return { ok: false, error: "no property " + _keys[_i].path.join(" > ") + " on " + _l.name };
                for (var _j = 1; _j <= _p.numKeys; _j++) _events.push({ name: _l.name + " " + _p.name + " key " + _j, time: _p.keyTime(_j) });
            }
            var _ins = ${jsxVal(args.inPoints)};
            for (var _n = 0; _n < _ins.length; _n++) {
                var _li = AE.findLayerInComp(_comp, _ins[_n]);
                if (!_li) return { ok: false, error: "no layer " + _ins[_n] };
                _events.push({ name: _li.name + " in-point", time: _li.inPoint });
            }
            return { ok: true, fps: 1 / _comp.frameDuration, markers: _markers, events: _events };
        `;
}
async function runSync(args, io) {
	const keys = Array.isArray(args.keys) ? args.keys.map((k) => ({
		layer: k.layer,
		path: propertyPath(k.property) ?? []
	})) : [];
	if (keys.some((k) => !k.path.length)) return {
		ok: false,
		error: "each of `keys` needs { layer, property }"
	};
	const inPoints = Array.isArray(args.inPoints) ? args.inPoints : [];
	const given = Array.isArray(args.events) ? args.events : [];
	if (!keys.length && !inPoints.length && !given.length) return {
		ok: false,
		error: "give events: `keys`, `inPoints` or `events` ({ name, time }, for example spikes from ae_render_frame diff)"
	};
	const r = await io.execute(syncReadJsx({
		comp: args.comp,
		keys,
		inPoints
	}), {
		label: "sound.sync read",
		timeoutMs: 6e4
	});
	if (!r?.ok) return {
		ok: false,
		error: r?.error ?? "could not read the comp"
	};
	const prefix = typeof args.markerPrefix === "string" ? args.markerPrefix : null;
	const markers = r.markers.filter((m) => prefix === null || m.comment.startsWith(prefix)).map((m) => ({
		time: m.time,
		label: m.comment
	}));
	const rep = syncReport([...r.events, ...given], markers, r.fps, {
		lateFrames: typeof args.lateFrames === "number" ? args.lateFrames : void 0,
		earlyFrames: typeof args.earlyFrames === "number" ? args.earlyFrames : void 0
	});
	return {
		ok: true,
		fps: r.fps,
		markers: markers.length,
		...rep
	};
}
var DEFAULT_PROPERTIES, TRANSFORM, SILENCE_BELOW;
function init_sample() {
	return (init_sample = __esmMin((() => {
		init_motion();
		init_png16();
		init_registry();
		DEFAULT_PROPERTIES = [
			["Transform", "Anchor Point"],
			["Transform", "Position"],
			["Transform", "Scale"],
			["Transform", "Rotation"],
			["Transform", "Opacity"]
		];
		registerOp({
			name: "comp.sample",
			category: "comp",
			readOnly: true,
			description: "Sample property values at several times across layers of one or more comps in ONE call. Each row says whether the layer is active at that time (enabled and inside its in/out span) and gives the post-expression value of every requested property (default: the five transform properties). Use it to verify motion, list what is visible when, or compare two comps for a match cut.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name/id, pattern ('shot_*'), or array of those",
					required: true
				},
				{
					name: "times",
					type: "array",
					description: "Times in seconds to sample",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "Layer filter: index | name | { id } | 'selected' | 'all' | array (default 'all')",
					required: false,
					default: "all"
				},
				{
					name: "properties",
					type: "array",
					description: "Property paths to read, e.g. [[\"Transform\",\"Position\"], [\"Effects\",\"Slider Control\",\"Slider\"]] (default: the five transform properties)",
					required: false
				},
				{
					name: "activeOnly",
					type: "boolean",
					description: "Omit layers that are not active at the sampled time (default false)",
					required: false,
					default: false
				}
			],
			toJsx(args) {
				const times = Array.isArray(args.times) ? args.times : [];
				if (times.length === 0 || !times.every((t) => typeof t === "number")) return jsxFail("times must be a non-empty array of numbers");
				const props = args.properties ?? DEFAULT_PROPERTIES;
				if (!Array.isArray(props) || !props.every((p) => Array.isArray(p) && p.length > 0)) return jsxFail("properties must be an array of property paths (arrays)");
				return `
            var _comps = AE.findComps(${jsxVal(args.comp)});
            if (_comps.length === 0) return { ok: false, error: "no comps matched" };
            var _times = ${jsxVal(times)};
            var _paths = ${jsxVal(props)};
            var _activeOnly = ${jsxVal(args.activeOnly === true)};
            var _out = [];
            for (var _ci = 0; _ci < _comps.length; _ci++) {
                var _c = _comps[_ci];
                var _layers = AE.resolveLayers(_c, ${jsxVal(args.layer ?? "all")});
                var _samples = [];
                for (var _ti = 0; _ti < _times.length; _ti++) {
                    var _t = _times[_ti];
                    var _rows = [];
                    for (var _li = 0; _li < _layers.length; _li++) {
                        var _l = _layers[_li];
                        var _active = _l.enabled && _t >= _l.inPoint && _t < _l.outPoint;
                        if (_activeOnly && !_active) continue;
                        var _row = { index: _l.index, name: _l.name, active: _active, values: {} };
                        for (var _pi = 0; _pi < _paths.length; _pi++) {
                            var _p = AE.propertyAtPath(_l, _paths[_pi]);
                            var _key = _paths[_pi].join("/");
                            if (!_p || _p.propertyType !== PropertyType.PROPERTY) { _row.values[_key] = null; continue; }
                            try { _row.values[_key] = AE.valueToJson(AE.readValue(_p, _t)); }
                            catch (eV) { _row.values[_key] = null; }
                        }
                        _rows.push(_row);
                    }
                    _samples.push({ time: _t, layers: _rows });
                }
                _out.push({ comp: _c.name, id: _c.id, samples: _samples });
            }
            return { ok: true, comps: _out };
        `;
			}
		});
		TRANSFORM = [
			"Anchor Point",
			"Position",
			"Scale",
			"Rotation",
			"Opacity",
			"X Position",
			"Y Position",
			"Z Position",
			"Orientation"
		];
		SILENCE_BELOW = .1;
		registerOp({
			name: "motion.curve",
			category: "motion",
			readOnly: true,
			description: "How a property moves: its value at every frame over a span (default the layer's span), speed per frame (units a second), the moves (from rest to rest), and flags: a move with no ease (its first or last moving frame already at 60% or more of its middle speed), a sudden jump in speed inside a move (2.5 times from one frame to the next and a quarter of its top speed), and how far a move overshoots and how many frames it takes to settle within 1%. `outPath` draws a 480 x 160 graph (values light, speed orange, moves shaded, flags red). Keys and their interpolation come with it. Thresholds are starting points, not judgments: a mechanical, constant move is linear on purpose.",
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
					description: "Layer index, name or { id }",
					required: true
				},
				{
					name: "property",
					type: "any",
					description: "A transform property's name ('Position') or a path of names",
					required: true
				},
				{
					name: "start",
					type: "number",
					description: "Seconds (default the layer's in-point)",
					required: false
				},
				{
					name: "end",
					type: "number",
					description: "Seconds (default the layer's out-point)",
					required: false
				},
				{
					name: "outPath",
					type: "string",
					description: "Absolute .png path for the graph",
					required: false
				},
				{
					name: "perFrame",
					type: "boolean",
					description: "Include value and speed of every frame (default false)",
					required: false
				}
			],
			toJsx: () => jsxFail("motion.curve runs in Node; call it through ae_do"),
			run: (args, transport) => runCurve(args, liveIO(transport))
		});
		registerOp({
			name: "sound.markers",
			category: "sound",
			description: "Put word or beat times on the comp as markers ('<prefix>: <label>', prefix default 'sound'; earlier ones with the same prefix are replaced unless replace: false). From `timing` (a JSON list of { word|w|text|label, start|time|t in seconds, or frame }, or CSV time,label) or from `layer`'s loudness: After Effects' Convert Audio to Keyframes is run on the layer (the comp is opened in the viewer for it), the amplitude read per frame (the louder of left and right), the helper layer removed, and a beat marked where loudness rises past 30% of the way from its median to its top. Checked live on mono, stereo and four-channel WAVs (signal on channel 1 reads as left). A track After Effects reads as silence is refused with what to do.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "timing",
					type: "string",
					description: "Absolute path of a timing file",
					required: false
				},
				{
					name: "layer",
					type: "any",
					description: "A layer with sound, read by loudness",
					required: false
				},
				{
					name: "prefix",
					type: "string",
					description: "Marker comment prefix (default 'sound')",
					required: false
				},
				{
					name: "replace",
					type: "boolean",
					description: "Replace earlier markers with the prefix (default true)",
					required: false
				},
				{
					name: "share",
					type: "number",
					description: "Loudness threshold, share of the way from median to top (default 0.3)",
					required: false
				}
			],
			toJsx: () => jsxFail("sound.markers runs in Node; call it through ae_do"),
			run: (args, transport) => runSoundMarkers(args, liveIO(transport))
		});
		registerOp({
			name: "sound.sync",
			category: "sound",
			readOnly: true,
			description: "How far named events sit from the nearest comp marker, in frames: key times of properties (`keys`: [{ layer, property }]), layers' in-points (`inPoints`), and any `events` you give ({ name, time }, for example spikes from ae_render_frame diff). Positive is after the marker. Flagged from 2 frames after or 4 before (ITU-R BT.1359's detectability thresholds, sound 45 ms early and 125 ms late, at 30 fps); `markerPrefix` keeps only markers whose comment starts with it.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "keys",
					type: "array",
					description: "[{ layer, property }]: each key is an event",
					required: false
				},
				{
					name: "inPoints",
					type: "array",
					description: "Layers whose in-points are events",
					required: false
				},
				{
					name: "events",
					type: "array",
					description: "[{ name, time }] in seconds",
					required: false
				},
				{
					name: "markerPrefix",
					type: "string",
					description: "Only markers whose comment starts with this",
					required: false
				},
				{
					name: "lateFrames",
					type: "number",
					description: "Flag from this many frames after (default 2)",
					required: false
				},
				{
					name: "earlyFrames",
					type: "number",
					description: "Flag from this many frames before (default 4)",
					required: false
				}
			],
			toJsx: () => jsxFail("sound.sync runs in Node; call it through ae_do"),
			run: (args, transport) => runSync(args, liveIO(transport))
		});
	})))();
}

export { COMP_CORNERS_FN, COMP_INFO_FN, LAYER_FULL_FN, LIST_MISSING_FONTS_FN, LIST_MISSING_FOOTAGE_FN, MISSING_SOURCES_FN, OCIO_CAPTURE_FN, PARK_QUEUE_FN, QUEUE_CHANGE_NOTE, RENDER_FRAME_FN, RENDER_QUEUE_UNDO_WARNING, init_render, init_sample, init_shape, init_shape_contents, init_snippets, init_text, init_timeline, init_transform, init_viewer };
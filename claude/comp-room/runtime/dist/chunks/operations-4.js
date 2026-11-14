import { __esmMin } from "./rolldown-runtime.js";
import { init_registry, jsxCompLayerPreamble, jsxCompPreamble, jsxFail, jsxVal, registerOp } from "./core-1.js";
import { init_run_moves, init_run_shots_census, init_run_track, runCensus, runMoves, runShots, runTrack } from "./video-1.js";

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

// operations/video.js
var common, ffmpegNote;
function init_video() {
	return (init_video = __esmMin((() => {
		init_registry();
		init_run_moves();
		init_run_shots_census();
		init_run_track();
		common = [
			{
				name: "file",
				type: "string",
				description: "Absolute path of the video file (a reference, or a build's render)",
				required: true
			},
			{
				name: "outDir",
				type: "string",
				description: "Absolute folder for the JSON and pictures (made if missing)",
				required: true
			},
			{
				name: "start",
				type: "number",
				description: "Seconds into the file to start (default its first frame)",
				required: false
			},
			{
				name: "end",
				type: "number",
				description: "Seconds into the file to end (default its last frame)",
				required: false
			},
			{
				name: "atFps",
				type: "number",
				description: "Also give frames at this rate beside seconds and the file's own frames (default 30)",
				required: false
			}
		];
		ffmpegNote = " Needs ffmpeg and ffprobe (refuses plainly without them); never uses After Effects, so it fills no disk cache. Frames are read at their own timestamps (a variable rate is said).";
		registerOp({
			name: "video.shots",
			category: "video",
			readOnly: true,
			description: "The shot list of a video file: exact cut frames (a cut changes the frame by 12 or more out of 255 on a 64 x 36 grey picture and by 4 times the median round it), one-frame swaps inside a shot (a frame that differs from both neighbours while they match, over the whole frame or one region of a 4 x 4 grid, which a scene score misses), brightness flashes set aside, and the shots. Writes shots.json, a contact sheet per shot and five consecutive frames round each change." + ffmpegNote,
			params: [...common, {
				name: "pictures",
				type: "boolean",
				description: "Write the contact sheets and change strips (default true)",
				required: false
			}],
			toJsx: () => jsxFail("video.shots runs in Node; call it through ae_do"),
			run: (args) => runShots(args)
		});
		registerOp({
			name: "video.census",
			category: "video",
			readOnly: true,
			description: "A census of movement: each short step (default 0.1 s) of a band of the frame classed calm (under 0.4 % of it changed), local movement, whole-stage travel (at least half the textured 16 px blocks moved) or a cut, with cadence numbers: shares, travel moves a minute and their median length and speed, bursts every 10 s, calm runs. A stage with little texture (a dark one) reads calmer than it looks. Writes census.json (labels c, l, T, X per step) and a strip." + ffmpegNote,
			params: [
				...common,
				{
					name: "window",
					type: "number",
					description: "Seconds a step (default 0.1)",
					required: false
				},
				{
					name: "band",
					type: "array",
					description: "[top, bottom] of the band as shares of the height (default [0.15, 0.6])",
					required: false
				},
				{
					name: "pageTest",
					type: "boolean",
					description: "Skip steps where the top of the frame is not a flat page (default false)",
					required: false
				}
			],
			toJsx: () => jsxFail("video.census runs in Node; call it through ae_do"),
			run: (args) => runCensus(args)
		});
		registerOp({
			name: "video.track",
			category: "video",
			readOnly: true,
			description: "Follow one thing across a span of a video file and measure its moves: position, scale and opacity per frame (normalised cross-correlation over a range of scales with a sub-pixel peak; opacity as the window's regression on the template), the moves in motion.curve's own terms, and each move fitted three ways with its rms (After Effects ease: out and in influence; linear; spring: frequency, damping, overshoot, settle, and the hand-study form A, f, d), the best and by how much, and its keys ready for keyframe.apply (a spring also as the library's motion-jsx spring, and baked keys). Repeated frames are found (a 24 fps piece in 30 fps repeats every fifth) and moves are fitted on the unique frames at their own times. Says where it lost the region and fits nothing past it. A move whose start or end was not seen (already moving at the first frame measured, or still moving where it stops) is partial: its duration, distance and the unseen ease are not measured. Each move has two durations: the fit's keys (what is set in After Effects) and the visible span (the last frame at rest to the first frame within 2 % of the end, as a hand study counts it); a witness (plain frame differencing round the region) gives the span over which anything there changes, and a move it outlasts is marked uncertain. Moves never span a cut. `ink` adds a second measure, a mask in a fixed box (by luma, colour, or difference from an empty frame) with its bounding box, centroid, area and level per frame: for anything that grows from nothing, draws on, fades, glows or blurs. Where both measures see a move, agreement within 2 frames and 5 % is a measurement and disagreement is reported, uncertain. Rotation, skew, blur and colour are not measured, and the reply says so. Writes track.json and track.csv." + ffmpegNote,
			params: [
				...common,
				{
					name: "region",
					type: "any",
					description: "[x, y, width, height] round the thing in the reference frame, in pixels or as shares of the frame (all 1 or under)",
					required: true
				},
				{
					name: "ref",
					type: "number",
					description: "Seconds: the reference frame where the region is drawn, the thing at rest (default the span's last frame)",
					required: false
				},
				{
					name: "scaleRange",
					type: "array",
					description: "[smallest, largest] scale to search, against the reference (default [0.25, 2.5])",
					required: false
				},
				{
					name: "stage",
					type: "any",
					description: "Whole-stage travel: true, or { band: [top, bottom] as shares of the height } to leave out what is fixed to the frame (a caption rail). Each frame is registered on the one before under a whole-frame shift and the shifts added up, as a 'stage' move; it stops at a cut, and a frame that does not register is a gap nothing is carried across",
					required: false
				},
				{
					name: "ink",
					type: "object",
					description: "The ink measure: { box (default the region), mask: { luma: [lo, hi] | minChannel: [lo, hi] | hue: [from, to] with minSat, minVal | rgb: [r, g, b] with tol | empty: seconds of a frame without the thing, with tol }, curves: any of centroid, x0, x1, y0, y1, width, height, size, level (default centroid, size, level), minCount, minPixels }. A moving ground defeats the empty-frame difference",
					required: false
				}
			],
			toJsx: () => jsxFail("video.track runs in Node; call it through ae_do"),
			run: (args) => runTrack(args)
		});
		registerOp({
			name: "video.moves",
			category: "video",
			readOnly: true,
			description: "The table of moves and a beat sheet in the brief's form, from video.track files (and video.shots and video.census when given): each move with its start, duration and distance, ease or spring values, fit and rms, marked measured, inferred (carried by hand, with the reason) or untested, and its keys ready to apply. The beat sheet has a scene per shot with the measured events; what the picture cannot say is left marked. Writes moves.json and beat-sheet.md. Reads files only.",
			params: [
				{
					name: "outDir",
					type: "string",
					description: "Absolute folder for moves.json and beat-sheet.md",
					required: true
				},
				{
					name: "tracks",
					type: "array",
					description: "track.json paths from video.track, or [{ path, label }]",
					required: true
				},
				{
					name: "shots",
					type: "string",
					description: "shots.json from video.shots",
					required: false
				},
				{
					name: "census",
					type: "string",
					description: "census.json from video.census",
					required: false
				},
				{
					name: "transcript",
					type: "string",
					description: "A transcript JSON (word or segment tokens with times): each scene gets its words and each event the word spoken as it starts",
					required: false
				},
				{
					name: "inferred",
					type: "array",
					description: "Moves carried by hand: [{ label, channel, reason, ... }]",
					required: false
				},
				{
					name: "untested",
					type: "array",
					description: "Moves named but not tracked: [{ label, reason }]",
					required: false
				},
				{
					name: "atFps",
					type: "number",
					description: "Frames at this rate (default 30)",
					required: false
				}
			],
			toJsx: () => jsxFail("video.moves runs in Node; call it through ae_do"),
			run: (args) => runMoves(args)
		});
	})))();
}

export { COMP_CORNERS_FN, COMP_INFO_FN, LAYER_FULL_FN, LIST_MISSING_FONTS_FN, LIST_MISSING_FOOTAGE_FN, MISSING_SOURCES_FN, OCIO_CAPTURE_FN, RENDER_FRAME_FN, init_shape, init_snippets, init_text, init_timeline, init_transform, init_video, init_viewer };
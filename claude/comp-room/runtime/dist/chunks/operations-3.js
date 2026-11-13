import { __esmMin } from "./rolldown-runtime.js";
import { init_registry, jsxCompLayerPreamble, jsxCompPreamble, jsxFail, jsxPropertyLookup, jsxVal, registerOp } from "./core-1.js";
import { REDO_COMMAND_ID, init_command } from "./operations-1.js";
import { COMP_CORNERS_FN, init_snippets } from "./operations-4.js";
import { promises } from "node:fs";
import * as path$1 from "node:path";

// operations/layer.js
function init_layer() {
	return (init_layer = __esmMin((() => {
		init_registry();
		registerOp({
			name: "layer.create_solid",
			category: "layer",
			description: "Create a solid layer in a composition.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "name",
					type: "string",
					description: "Layer name",
					required: false,
					default: "Solid"
				},
				{
					name: "color",
					type: "array",
					description: "[r,g,b] 0-1",
					required: false,
					default: [
						1,
						1,
						1
					]
				},
				{
					name: "width",
					type: "number",
					description: "Width in px (default: comp width)",
					required: false
				},
				{
					name: "height",
					type: "number",
					description: "Height in px (default: comp height)",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _w = ${jsxVal(args.width)} || _comp.width;
            var _h = ${jsxVal(args.height)} || _comp.height;
            var _layer = _comp.layers.addSolid(${jsxVal(args.color ?? [
					1,
					1,
					1
				])}, ${jsxVal(args.name ?? "Solid")}, _w, _h, _comp.pixelAspect, _comp.duration);
            return { ok: true, index: _layer.index, name: _layer.name };
        `;
			}
		});
		registerOp({
			name: "layer.create_adjustment",
			category: "layer",
			description: "Create an adjustment layer (a comp-sized solid with adjustmentLayer on) — the carrier for comp-wide effects such as Posterize Time or a color grade. Add effects with effect.add.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "name",
					type: "string",
					description: "Layer name",
					required: false,
					default: "Adjustment Layer"
				},
				{
					name: "width",
					type: "number",
					description: "Width in px (default: comp width)",
					required: false
				},
				{
					name: "height",
					type: "number",
					description: "Height in px (default: comp height)",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _w = ${jsxVal(args.width)} || _comp.width;
            var _h = ${jsxVal(args.height)} || _comp.height;
            var _layer = _comp.layers.addSolid([1, 1, 1], ${jsxVal(args.name ?? "Adjustment Layer")}, _w, _h, _comp.pixelAspect, _comp.duration);
            _layer.adjustmentLayer = true;
            return { ok: true, index: _layer.index, name: _layer.name, adjustmentLayer: _layer.adjustmentLayer };
        `;
			}
		});
		registerOp({
			name: "layer.create_shape",
			category: "layer",
			description: "Create an empty shape layer.",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}, {
				name: "name",
				type: "string",
				description: "Layer name",
				required: false
			}],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _layer = _comp.layers.addShape();
            ${args.name ? `_layer.name = ${jsxVal(args.name)};` : ""}
            return { ok: true, index: _layer.index, name: _layer.name };
        `;
			}
		});
		registerOp({
			name: "layer.create_text",
			category: "layer",
			description: "Create a text layer: point text by default, paragraph (box) text when boxSize is given, vertical when orientation='vertical' (AE 24.2+). Point<->box conversion is not scriptable, so pick the right kind here.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "text",
					type: "string",
					description: "Text content",
					required: false,
					default: ""
				},
				{
					name: "name",
					type: "string",
					description: "Layer name",
					required: false
				},
				{
					name: "boxSize",
					type: "array",
					description: "[width, height] — creates paragraph (box) text instead of point text",
					required: false
				},
				{
					name: "boxPosition",
					type: "array",
					description: "[x, y] top-left of the box in layer space (box text only)",
					required: false
				},
				{
					name: "orientation",
					type: "string",
					description: "horizontal|vertical (vertical needs AE 24.2+)",
					required: false,
					default: "horizontal"
				}
			],
			toJsx(args) {
				const boxPosJsx = !args.boxPosition ? "" : `try {
                var _src = _layer.property("Source Text");
                var _doc = _src.value;
                _doc.boxTextPos = ${jsxVal(args.boxPosition)};
                _src.setValue(_doc);
            } catch (eBp) {}`;
				return `
            ${jsxCompPreamble(args)}
            var _box = ${jsxVal(args.boxSize ?? null)};
            var _vertical = ${jsxVal(args.orientation)} === "vertical";
            var _layer;
            if (_box !== null) {
                if (_vertical) {
                    if (typeof _comp.layers.addVerticalBoxText !== "function") return { ok: false, error: "vertical box text needs AE 24.2+" };
                    _layer = _comp.layers.addVerticalBoxText(_box, ${jsxVal(args.text ?? "")});
                } else {
                    _layer = _comp.layers.addBoxText(_box, ${jsxVal(args.text ?? "")});
                }
            } else {
                if (_vertical) {
                    if (typeof _comp.layers.addVerticalText !== "function") return { ok: false, error: "vertical text needs AE 24.2+" };
                    _layer = _comp.layers.addVerticalText(${jsxVal(args.text ?? "")});
                } else {
                    _layer = _comp.layers.addText(${jsxVal(args.text ?? "")});
                }
            }
            ${args.name ? `_layer.name = ${jsxVal(args.name)};` : ""}
            ${boxPosJsx}
            return { ok: true, index: _layer.index, name: _layer.name, boxText: _box !== null, vertical: _vertical };
        `;
			}
		});
		registerOp({
			name: "layer.create_null",
			category: "layer",
			description: "Create a null object layer.",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}, {
				name: "name",
				type: "string",
				description: "Layer name",
				required: false
			}],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _layer = _comp.layers.addNull();
            ${args.name ? `_layer.name = ${jsxVal(args.name)};` : ""}
            return { ok: true, index: _layer.index, name: _layer.name };
        `;
			}
		});
		registerOp({
			name: "layer.create_camera",
			category: "layer",
			description: "Create a camera layer.",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}, {
				name: "name",
				type: "string",
				description: "Layer name",
				required: false,
				default: "Camera"
			}],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _layer = _comp.layers.addCamera(${jsxVal(args.name ?? "Camera")}, [_comp.width/2, _comp.height/2]);
            return { ok: true, index: _layer.index, name: _layer.name };
        `;
			}
		});
		registerOp({
			name: "layer.create_light",
			category: "layer",
			description: "Create a light layer.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "name",
					type: "string",
					description: "Layer name",
					required: false,
					default: "Light"
				},
				{
					name: "lightType",
					type: "string",
					description: "spot|parallel|point|ambient|environment (environment needs AE 24.3+ / Advanced 3D)",
					required: false,
					default: "spot"
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _ltMap = {
                "spot": LightType.SPOT,
                "parallel": LightType.PARALLEL,
                "point": LightType.POINT,
                "ambient": LightType.AMBIENT
            };
            // 24.3+ only \u2014 probed so older hosts keep the classic four.
            try { if (LightType.ENVIRONMENT !== undefined) _ltMap.environment = LightType.ENVIRONMENT; } catch (eEnv) {}
            var _ltArg = ${jsxVal(args.lightType ?? "spot")};
            if (!_ltMap.hasOwnProperty(_ltArg)) {
                return { ok: false, error: "unknown lightType '" + _ltArg + "'" + (_ltArg === "environment" ? " \u2014 environment lights need AE 24.3+" : "") };
            }
            var _layer = _comp.layers.addLight(${jsxVal(args.name ?? "Light")}, [_comp.width/2, _comp.height/2]);
            var _applied = null;
            try { _layer.lightType = _ltMap[_ltArg]; _applied = _ltArg; } catch (eLt) {}
            return { ok: true, index: _layer.index, name: _layer.name, lightType: _applied };
        `;
			}
		});
		registerOp({
			name: "layer.create_parametric_mesh",
			category: "layer",
			description: "Create a parametric 3D mesh layer (LayerCollection.addParametricMesh, AE 26.3+): cube|sphere|plane|cylinder|cone|torus. Best rendered with the Advanced 3D renderer (comp.set_renderer).",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "name",
					type: "string",
					description: "Layer name",
					required: false,
					default: "Mesh"
				},
				{
					name: "meshType",
					type: "string",
					description: "cube|sphere|plane|cylinder|cone|torus",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            if (typeof _comp.layers.addParametricMesh !== "function") return { ok: false, error: "addParametricMesh needs AE 26.3+" };
            var _mtMap = {
                "cube": ParametricMeshType.CUBE,
                "sphere": ParametricMeshType.SPHERE,
                "plane": ParametricMeshType.PLANE,
                "cylinder": ParametricMeshType.CYLINDER,
                "cone": ParametricMeshType.CONE,
                "torus": ParametricMeshType.TORUS
            };
            var _mtArg = ${jsxVal(args.meshType)};
            if (!_mtMap.hasOwnProperty(_mtArg)) return { ok: false, error: "meshType must be cube|sphere|plane|cylinder|cone|torus" };
            var _layer = null;
            try { _layer = _comp.layers.addParametricMesh(${jsxVal(args.name ?? "Mesh")}, _mtMap[_mtArg]); } catch (ePm) { return { ok: false, error: "addParametricMesh failed: " + AE.errText(ePm) }; }
            return { ok: true, index: _layer.index, name: _layer.name, meshType: _mtArg };
        `;
			}
		});
		registerOp({
			name: "layer.delete",
			category: "layer",
			description: "Delete layers. comp supports pattern ('review_id_*'). layer supports index, name, 'selected', 'all'.",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name/id/pattern (e.g. 'review_id_*')",
				required: true
			}, {
				name: "layer",
				type: "any",
				description: "Layer index, name, 'selected', or 'all'",
				required: true
			}],
			toJsx(args) {
				return `
            var _comps = AE.findComps(${jsxVal(args.comp)});
            if (_comps.length === 0) return { ok: false, error: "no comps matched" };
            var _removed = 0;
            for (var _ci = 0; _ci < _comps.length; _ci++) {
                var _layers = AE.resolveLayers(_comps[_ci], ${jsxVal(args.layer)});
                for (var _li = _layers.length - 1; _li >= 0; _li--) {
                    try { _layers[_li].remove(); _removed++; } catch(e) {}
                }
            }
            return { ok: true, removed: _removed, comps: _comps.length };
        `;
			}
		});
		registerOp({
			name: "layer.duplicate",
			category: "layer",
			description: "Duplicate a layer. Returns the new layer's index.",
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
					name: "newName",
					type: "string",
					description: "Name for the duplicate",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _dup = _layer.duplicate();
            ${args.newName ? `_dup.name = ${jsxVal(args.newName)};` : ""}
            return { ok: true, index: _dup.index, name: _dup.name };
        `;
			}
		});
		registerOp({
			name: "layer.set_parent",
			category: "layer",
			description: "Set or clear a layer's parent. By default AE compensates the child's transform so it doesn't move; jump=true skips compensation (setParentWithJump) so the child adopts the parent's space.",
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
					description: "1-based child layer index, or the layer name",
					required: true
				},
				{
					name: "parentLayer",
					type: "any",
					description: "1-based parent layer index or name. Pass null or 0 to unparent.",
					required: true,
					nullable: true
				},
				{
					name: "jump",
					type: "boolean",
					description: "true = no transform compensation (setParentWithJump). Default false.",
					required: false,
					default: false
				}
			],
			toJsx(args) {
				const parentVal = args.parentLayer === null || args.parentLayer === 0 ? "null" : `_comp.layer(${jsxVal(args.parentLayer)})`;
				const assign = args.jump === true ? `if (typeof _layer.setParentWithJump !== "function") return { ok: false, error: "setParentWithJump needs AE 17.1+" };
            _layer.setParentWithJump(${parentVal});` : `_layer.parent = ${parentVal};`;
				return `
            ${jsxCompLayerPreamble(args)}
            ${assign}
            return { ok: true, parent: _layer.parent ? { index: _layer.parent.index, name: _layer.parent.name } : null };
        `;
			}
		});
		registerOp({
			name: "layer.scene_edit_detection",
			category: "layer",
			description: "Run Scene Edit Detection on a video layer (Layer.doSceneEditDetection, AE 22.3+): find cuts in edited footage and mark or split at them.",
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
					name: "mode",
					type: "string",
					description: "markers (add layer markers) | split (split layer) | splitPrecomp (split + precompose each) | none (detect only)",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            if (typeof _layer.doSceneEditDetection !== "function") return { ok: false, error: "doSceneEditDetection needs AE 22.3+" };
            var _sdMap = {
                "markers": SceneEditDetectionMode.MARKERS,
                "split": SceneEditDetectionMode.SPLIT,
                "splitPrecomp": SceneEditDetectionMode.SPLIT_PRECOMP,
                "none": SceneEditDetectionMode.NONE
            };
            var _mode = ${jsxVal(args.mode)};
            if (!_sdMap.hasOwnProperty(_mode)) return { ok: false, error: "mode must be markers|split|splitPrecomp|none" };
            var _edits = null;
            try { _edits = _layer.doSceneEditDetection(_sdMap[_mode]); } catch (eSd) { return { ok: false, error: "doSceneEditDetection failed: " + AE.errText(eSd) }; }
            return { ok: true, mode: _mode, editTimes: AE.valueToJson(_edits), numLayers: _comp.numLayers };
        `;
			}
		});
		registerOp({
			name: "layer.move",
			category: "layer",
			description: "Move a layer to a new stacking position (1 = top).",
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
					description: "1-based current layer index, or the layer name",
					required: true
				},
				{
					name: "toIndex",
					type: "number",
					description: "1-based target index, within 1..numLayers",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _to = ${jsxVal(args.toIndex)};
            if (typeof _to !== "number" || isNaN(_to) || _to !== Math.floor(_to)) {
                return { ok: false, error: "toIndex must be a whole number, got " + _to };
            }
            if (_to < 1 || _to > _comp.numLayers) {
                return { ok: false, error: "toIndex " + _to + " is out of range (comp has " + _comp.numLayers + " layers)" };
            }
            var _from = _layer.index;
            // NOT _layer.moveTo(_to). Layer inherits moveTo from PropertyBase,
            // so it exists and type-checks \u2014 and then throws for every layer,
            // every time: "Can not moveTo this property, because parent is not
            // an INDEXED_GROUP". A layer's parent is the composition, not a
            // property group, so the inherited method never applies. Reordering
            // layers is only expressible relative to a sibling.
            if (_to < _from) {
                // Upward: land directly above whoever holds _to right now.
                _layer.moveBefore(_comp.layer(_to));
            } else if (_to > _from) {
                // Downward: everything between _from and _to shifts up by one
                // as soon as _layer vacates its slot, so the layer currently at
                // _to ends up at _to - 1 \u2014 landing AFTER it is what puts
                // _layer at _to.
                _layer.moveAfter(_comp.layer(_to));
            }
            return { ok: true, fromIndex: _from, newIndex: _layer.index, name: _layer.name };
        `;
			}
		});
		registerOp({
			name: "layer.create_footage",
			category: "layer",
			description: "Add an existing project item (footage or comp) as a layer in a composition.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "sourceItemId",
					type: "number",
					description: "Project item id to use as source",
					required: true
				},
				{
					name: "name",
					type: "string",
					description: "Layer name",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _src = AE.findItemById(${jsxVal(args.sourceItemId)});
            if (!_src) return { ok: false, error: "no item with id " + ${jsxVal(args.sourceItemId)} };
            var _layer = _comp.layers.add(_src);
            ${args.name ? `_layer.name = ${jsxVal(args.name)};` : ""}
            return { ok: true, index: _layer.index, name: _layer.name };
        `;
			}
		});
		registerOp({
			name: "layer.set_enabled",
			category: "layer",
			description: "Enable or disable a layer by name or index. Can target all comps matching a pattern.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name/id, or '*' for all comps, or 'review_id_*' for pattern match",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "Layer index (number) or name (string)",
					required: true
				},
				{
					name: "enabled",
					type: "boolean",
					description: "true=visible, false=hidden",
					required: true
				}
			],
			toJsx(args) {
				return `
            var _comps = AE.findComps(${jsxVal(args.comp)});
            var _updated = 0;
            for (var ci = 0; ci < _comps.length; ci++) {
                var _layer = AE.findLayerInComp(_comps[ci], ${jsxVal(args.layer)});
                if (_layer) { _layer.enabled = ${jsxVal(!!args.enabled)}; _updated++; }
            }
            return { ok: true, updated: _updated };
        `;
			}
		});
		registerOp({
			name: "layer.set_guide",
			category: "layer",
			description: "Set guideLayer on/off for a layer. Can target all comps matching a pattern.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name/id, or '*' for all comps, or 'review_id_*' for pattern match",
					required: true
				},
				{
					name: "layer",
					type: "any",
					description: "Layer index (number) or name (string)",
					required: true
				},
				{
					name: "guide",
					type: "boolean",
					description: "true=guide layer, false=normal",
					required: true
				}
			],
			toJsx(args) {
				return `
            var _comps = AE.findComps(${jsxVal(args.comp)});
            var _updated = 0;
            for (var ci = 0; ci < _comps.length; ci++) {
                var _layer = AE.findLayerInComp(_comps[ci], ${jsxVal(args.layer)});
                if (_layer) { _layer.guideLayer = ${jsxVal(!!args.guide)}; _updated++; }
            }
            return { ok: true, updated: _updated };
        `;
			}
		});
		registerOp({
			name: "layer.set_props",
			category: "layer",
			description: "Set basic layer properties. layer can be index, name, 'selected', or 'all'. Enum-valued attributes accept string names: quality (best|draft|wireframe), samplingQuality (bilinear|bicubic), frameBlendingType (off|frameMix|pixelMotion), autoOrient (off|alongPath|cameraOrPointOfInterest|charactersTowardCamera), blendingMode, lightType (spot|parallel|point|ambient|environment).",
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
					description: "Layer index, name, 'selected', or 'all'",
					required: true
				},
				{
					name: "props",
					type: "object",
					description: "Object with keys to set, e.g. { name: 'foo', enabled: false, label: 5, threeDLayer: true }",
					required: true
				}
			],
			toJsx(args) {
				const props = args.props ?? {};
				const lines = [];
				for (const [k, v] of Object.entries(props)) lines.push(`try { _l[${jsxVal(k)}] = AE.coerceLayerPropValue(${jsxVal(k)}, ${jsxVal(v)}); } catch (e) { _w.push(${jsxVal(k)} + ": " + AE.errText(e)); }`);
				return `
            ${jsxCompPreamble(args)}
            var _layers = AE.resolveLayers(_comp, ${jsxVal(args.layer)});
            if (_layers.length === 0) return { ok: false, error: "no layers matched" };
            var _results = [];
            for (var _li = 0; _li < _layers.length; _li++) {
                var _l = _layers[_li];
                var _w = [];
                ${lines.join("\n")}
                _results.push({ name: _l.name, warnings: _w });
            }
            return { ok: true, count: _results.length, layers: _results };
        `;
			}
		});
		registerOp({
			name: "layer.add_guide",
			category: "layer",
			description: "Add a ruler guide to a layer's Layer panel view (Layer.addGuide, AE 16.1+). Comp-panel guides live under comp.add_guide.",
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
            ${jsxCompLayerPreamble(args)}
            if (typeof _layer.addGuide !== "function") return { ok: false, error: "layer guides need AE 16.1+" };
            var _orient = ${jsxVal(args.orientation)} === "vertical" ? 1 : 0;
            var _idx = _layer.addGuide(_orient, ${jsxVal(args.position)});
            return { ok: true, guideIndex: _idx, numGuides: _layer.guides.length };
        `;
			}
		});
		registerOp({
			name: "layer.remove_guide",
			category: "layer",
			description: "Remove a Layer-panel ruler guide by its 0-based index (see layer.list_guides).",
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
					name: "guideIndex",
					type: "number",
					description: "0-based guide index",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            if (typeof _layer.removeGuide !== "function") return { ok: false, error: "layer guides need AE 16.1+" };
            var _guides = _layer.guides;
            if (${jsxVal(args.guideIndex)} < 0 || ${jsxVal(args.guideIndex)} >= _guides.length) {
                return { ok: false, error: "guide index out of range (0-" + (_guides.length - 1) + ")" };
            }
            _layer.removeGuide(${jsxVal(args.guideIndex)});
            return { ok: true, numGuides: _layer.guides.length };
        `;
			}
		});
		registerOp({
			name: "layer.move_guide",
			category: "layer",
			description: "Move an existing Layer-panel ruler guide to a new position (Layer.setGuide). Named move_guide because layer.set_guide already means the guide-LAYER flag.",
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
					name: "guideIndex",
					type: "number",
					description: "0-based guide index",
					required: true
				},
				{
					name: "position",
					type: "number",
					description: "New position in px",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            if (typeof _layer.setGuide !== "function") return { ok: false, error: "layer guides need AE 16.1+" };
            var _guides = _layer.guides;
            if (${jsxVal(args.guideIndex)} < 0 || ${jsxVal(args.guideIndex)} >= _guides.length) {
                return { ok: false, error: "guide index out of range (0-" + (_guides.length - 1) + ")" };
            }
            _layer.setGuide(${jsxVal(args.position)}, ${jsxVal(args.guideIndex)});
            return { ok: true, guideIndex: ${jsxVal(args.guideIndex)}, position: ${jsxVal(args.position)} };
        `;
			}
		});
		registerOp({
			name: "layer.list_guides",
			category: "layer",
			readOnly: true,
			description: "List a layer's Layer-panel ruler guides with orientation and position (AE 16.1+).",
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
            var _guides = null;
            try { _guides = _layer.guides; } catch (eG) {}
            if (!_guides) return { ok: false, error: "layer guides need AE 16.1+" };
            var _out = [];
            for (var _i = 0; _i < _guides.length; _i++) {
                _out.push({ index: _i, orientation: _guides[_i].orientationType === 1 ? "vertical" : "horizontal", position: _guides[_i].position });
            }
            return { ok: true, count: _out.length, guides: _out };
        `;
			}
		});
	})))();
}

// operations/project.js
function liveSnapshotIO(transport) {
	return { async execute(code, opts) {
		const r = await transport.execute({
			code,
			label: opts.label,
			timeoutMs: opts.timeoutMs,
			undoGroup: false,
			suppressDialogs: true
		});
		return r.ok ? r.result : {
			ok: false,
			error: r.error ?? `${opts.label} failed`
		};
	} };
}
function snapshotPlace(projectFile) {
	const ext = /\.aepx$/i.test(projectFile) ? ".aepx" : ".aep";
	const base = path$1.basename(projectFile).replace(/\.aepx?$/i, "");
	const folder = path$1.join(path$1.dirname(projectFile), `${base}${SNAP_DIR_SUFFIX}`);
	return {
		base,
		ext,
		folder,
		index: path$1.join(folder, "snapshots.json")
	};
}
function isSnapshotFile(file) {
	const m = /^(.*)_snapshot_\d+\.aepx?$/i.exec(path$1.basename(file));
	return !!m && path$1.basename(path$1.dirname(file)) === `${m[1]}${SNAP_DIR_SUFFIX}`;
}
async function readIndex(index) {
	try {
		return JSON.parse(await promises.readFile(index, "utf8"));
	} catch {
		return [];
	}
}
async function copySnapshot(projectFile, label) {
	const { base, ext, folder, index } = snapshotPlace(projectFile);
	await promises.mkdir(folder, { recursive: true });
	const list = await readIndex(index);
	const number = list.reduce((m, e) => Math.max(m, e.number), 0) + 1;
	const name = `${base}_snapshot_${String(number).padStart(3, "0")}${ext}`;
	await promises.copyFile(projectFile, path$1.join(folder, name));
	const entry = {
		number,
		file: name,
		takenAt: (/* @__PURE__ */ new Date()).toISOString(),
		label,
		fromUnsaved: false
	};
	await promises.writeFile(index, JSON.stringify([...list, entry], null, 1));
	return {
		...entry,
		path: path$1.join(folder, name)
	};
}
async function runSnapshot(args, io) {
	const label = typeof args.label === "string" ? args.label : null;
	const st = await io.execute(STATE_JSX, {
		label: "project.snapshot state",
		timeoutMs: 3e4
	});
	if (!st?.ok) return {
		ok: false,
		error: st?.error ?? "could not read the project"
	};
	if (!st.file) return {
		ok: false,
		error: "the project has never been saved, so there is no file to snapshot: save it first (ae_save_project with a path)"
	};
	if (isSnapshotFile(st.file)) return {
		ok: false,
		error: `the open project is itself a snapshot (${st.file}): open the working file first`
	};
	if (!st.dirty) {
		const e = await copySnapshot(st.file, label);
		return {
			ok: true,
			number: e.number,
			path: e.path,
			label,
			openFile: st.file,
			note: "A copy of the project file as last saved; After Effects and the open project were not touched. project.restore { number } puts it back."
		};
	}
	if (args.unsaved !== "save-as-snapshot") return {
		ok: false,
		error: "the project has unsaved changes, and a copy of its file on disk would miss them. Either save first (ae_save_project) and take the snapshot, or pass unsaved: 'save-as-snapshot' to save the current state as the snapshot: the user's file stays as last saved, but After Effects then has the snapshot open, and later saves go there. No command saves a copy without a dialog."
	};
	const { base, ext, folder, index } = snapshotPlace(st.file);
	await promises.mkdir(folder, { recursive: true });
	const list = await readIndex(index);
	const number = list.reduce((m, e) => Math.max(m, e.number), 0) + 1;
	const name = `${base}_snapshot_${String(number).padStart(3, "0")}${ext}`;
	const target = path$1.join(folder, name);
	const r = await io.execute(`app.project.save(new File(${jsxVal(target)})); return { ok: true, file: app.project.file ? app.project.file.fsName : null, dirty: app.project.dirty };`, {
		label: "project.snapshot save as",
		timeoutMs: 12e4
	});
	if (!r?.ok) return {
		ok: false,
		error: r?.error ?? "the save failed"
	};
	const entry = {
		number,
		file: name,
		takenAt: (/* @__PURE__ */ new Date()).toISOString(),
		label,
		fromUnsaved: true
	};
	await promises.writeFile(index, JSON.stringify([...list, entry], null, 1));
	return {
		ok: true,
		number,
		path: target,
		label,
		openFile: r.file,
		userFile: st.file,
		note: `The current state, unsaved changes included, was saved as snapshot ${number}. The user's file (${st.file}) is as last saved. After Effects now has the snapshot open: tell the user, and open their file again before going on (its unsaved changes are in the snapshot only).`
	};
}
async function runRestore(args, io) {
	const st = await io.execute(STATE_JSX, {
		label: "project.restore state",
		timeoutMs: 3e4
	});
	if (!st?.ok) return {
		ok: false,
		error: st?.error ?? "could not read the project"
	};
	if (!st.file) return {
		ok: false,
		error: "the project has never been saved, so it has no snapshots"
	};
	if (isSnapshotFile(st.file)) return {
		ok: false,
		error: `the open project is itself a snapshot (${st.file}): open the working file, then restore`
	};
	const { folder, index } = snapshotPlace(st.file);
	const list = await readIndex(index);
	if (!list.length) return {
		ok: false,
		error: `no snapshots beside ${st.file}`
	};
	const want = typeof args.number === "number" ? args.number : list[list.length - 1].number;
	const snap = list.find((e) => e.number === want);
	if (!snap) return {
		ok: false,
		error: `no snapshot ${want} (there are ${list.map((e) => e.number).join(", ")})`
	};
	if (st.dirty && args.discardUnsaved !== true) return {
		ok: false,
		error: "the project has unsaved changes, and restoring closes it without saving: save first (and snapshot it), or pass discardUnsaved: true to lose them"
	};
	const before = await copySnapshot(st.file, `before restoring ${want}${st.dirty ? " (as last saved; unsaved changes discarded)" : ""}`);
	const c = await io.execute("app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES); return { ok: true };", {
		label: "project.restore close",
		timeoutMs: 6e4
	});
	if (!c?.ok) return {
		ok: false,
		error: c?.error ?? "could not close the project",
		before
	};
	await promises.copyFile(path$1.join(folder, snap.file), st.file);
	const o = await io.execute(`app.open(new File(${jsxVal(st.file)})); return { ok: true, file: app.project.file ? app.project.file.fsName : null, dirty: app.project.dirty };`, {
		label: "project.restore open",
		timeoutMs: 12e4
	});
	if (!o?.ok) return {
		ok: false,
		error: `the snapshot was copied over ${st.file} but it did not open: ${o?.error ?? "unknown"}`,
		before
	};
	return {
		ok: true,
		restored: {
			number: snap.number,
			label: snap.label,
			takenAt: snap.takenAt
		},
		file: o.file,
		before: {
			number: before.number,
			path: before.path
		},
		note: `${st.file} now holds snapshot ${want} and is open. Its state before the restore${st.dirty ? ", as last saved (the unsaved changes were discarded)," : ""} is snapshot ${before.number}.`
	};
}
var TOOL_MAP_JSX, STATE_JSX, SNAP_DIR_SUFFIX;
function init_project() {
	return (init_project = __esmMin((() => {
		init_registry();
		init_command();
		registerOp({
			name: "project.open",
			category: "project",
			description: "Open a .aep project file. Closes the current project without saving.",
			params: [{
				name: "path",
				type: "string",
				description: "Absolute path to .aep file",
				required: true
			}, {
				name: "save",
				type: "boolean",
				description: "Save current project before closing (default false)",
				required: false
			}],
			undoGroup: () => false,
			toJsx(args) {
				return `
            var f = new File(${jsxVal(args.path)});
            if (!f.exists) return { ok: false, error: "file not found: " + ${jsxVal(args.path)} };
            if (${jsxVal(!!args.save)}) {
                if (app.project.dirty && !app.project.file) return { ok: false, error: "the open project is untitled and has unsaved changes: Save As first (ae_save_project with path), or open with save false to discard them" };
                if (app.project.dirty) app.project.save();
            } else if (app.project.dirty) {
                // dialogs are suppressed, and AE answers app.open's "save changes?" with its default, Save: close without saving first
                app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
            }
            app.open(f);
            // A new undo history: the render-queue undo block no longer applies.
            try { AE_MCP.clearRenderQueueRisk("project.open"); } catch (eClr) {}
            // A project saved by an older After Effects opens as an untitled converted copy: no file until it is saved
            if (!app.project.file) return { ok: true, numItems: app.project.numItems, file: null, untitled: true,
                note: "opened as an untitled copy (a project from an older After Effects version); Save As (ae_save_project with path) to keep it" };
            return { ok: true, numItems: app.project.numItems, file: app.project.file.fsName.replace(/\\\\/g,"/") };
        `;
			}
		});
		registerOp({
			name: "project.import_file",
			category: "project",
			description: "Import a file (image, video, audio) into the project as footage. Pass sequence=true with the first file of an image sequence to import the whole sequence.",
			params: [
				{
					name: "path",
					type: "string",
					description: "Absolute file path",
					required: true
				},
				{
					name: "name",
					type: "string",
					description: "Rename the imported item",
					required: false
				},
				{
					name: "sequence",
					type: "boolean",
					description: "Import as image sequence starting at path (default false)",
					required: false,
					default: false
				},
				{
					name: "forceAlphabetical",
					type: "boolean",
					description: "Sequence only: force alphabetical order (default false)",
					required: false
				},
				{
					name: "importAs",
					type: "string",
					description: "footage|comp|compRetainLayerSizes|project — for layered files like .psd/.ai (default footage)",
					required: false
				},
				{
					name: "rangeStart",
					type: "number",
					description: "Sequence only: first frame number to import (ImportOptions.rangeStart)",
					required: false
				},
				{
					name: "rangeEnd",
					type: "number",
					description: "Sequence only: last frame number to import (ImportOptions.rangeEnd)",
					required: false
				}
			],
			toJsx(args) {
				const rangeSets = [];
				if (args.rangeStart !== void 0) rangeSets.push(`try { imp.rangeStart = ${jsxVal(args.rangeStart)}; } catch (eRs) { return { ok: false, error: "rangeStart not supported on this AE: " + AE.errText(eRs) }; }`);
				if (args.rangeEnd !== void 0) rangeSets.push(`try { imp.rangeEnd = ${jsxVal(args.rangeEnd)}; } catch (eRe) { return { ok: false, error: "rangeEnd not supported on this AE: " + AE.errText(eRe) }; }`);
				return `
            var f = new File(${jsxVal(args.path)});
            if (!f.exists) return { ok: false, error: "file not found" };
            var imp = new ImportOptions(f);
            if (${jsxVal(!!args.sequence)}) {
                imp.sequence = true;
                imp.forceAlphabetical = ${jsxVal(!!args.forceAlphabetical)};
                ${rangeSets.join("\n")}
            }
            var _importAs = ${jsxVal(args.importAs ?? null)};
            if (_importAs !== null) {
                var _iaMap = { "footage": ImportAsType.FOOTAGE, "comp": ImportAsType.COMP, "compRetainLayerSizes": ImportAsType.COMP_CROPPED_LAYERS, "project": ImportAsType.PROJECT };
                if (_iaMap[_importAs] === undefined) return { ok: false, error: "unknown importAs: " + _importAs };
                if (!imp.canImportAs(_iaMap[_importAs])) return { ok: false, error: "file cannot be imported as " + _importAs };
                imp.importAs = _iaMap[_importAs];
            }
            var item = app.project.importFile(imp);
            ${args.name ? `item.name = ${jsxVal(args.name)};` : ""}
            var _out = { ok: true, id: item.id, name: item.name };
            try { _out.width = item.width; _out.height = item.height; _out.duration = item.duration; } catch (eDim) {}
            return _out;
        `;
			}
		});
		registerOp({
			name: "project.undo",
			category: "project",
			description: "Undo the last action. Equivalent to Ctrl+Z. Each prior ae_do call is ONE undo step (its automatic undo group), so count=1 reverts the whole previous call, batch included. Runs with After Effects' dialogs suppressed (an undo once raised an error box that blocked all scripting until a person clicked it); the result's aeErrors and warning carry anything After Effects reported, and an undo that throws stops the loop and fails the call. The result counts commands run (commandsRun), not steps undone: `changed` says whether the project's items or the active comp's layers changed (false means the history was empty OR the step only changed property values — inspect before assuming either), and `effect` says it in words. After a scripted render-queue change in this After Effects session it refuses (refused: true) unless acceptRenderQueueRisk: true — After Effects 2027 crashed on undo after such changes (observed twice on 2026-11-10; a precaution, not a proven cause). Save first if you override; project.open / project.new clear the block. A failed call that was rolled back already left no step of its own: do not undo again for it.",
			params: [{
				name: "count",
				type: "number",
				description: "Number of undos (default 1)",
				required: false,
				default: 1
			}, {
				name: "acceptRenderQueueRisk",
				type: "boolean",
				description: "Default false. After a scripted render-queue change in this After Effects session, undo is refused (After Effects 2027 has gone into crash recovery on undo after such changes — observed twice; a precaution). Pass true only when the user accepts that risk, ideally after saving.",
				required: false
			}],
			undoGroup: () => false,
			toJsx(args) {
				return `
            return AE_MCP.undoRedo(${16}, ${jsxVal(args.count ?? 1)}, ${jsxVal(args.acceptRenderQueueRisk === true)});
        `;
			}
		});
		registerOp({
			name: "project.redo",
			category: "project",
			description: "Redo the last undone action. Equivalent to Ctrl+Shift+Z. Runs like project.undo: outside the undo group, with dialogs suppressed, reporting any error After Effects raised (aeErrors, warning), and saying whether the project changed (changed, effect) rather than counting steps redone. Refused after a scripted render-queue change in the session unless acceptRenderQueueRisk: true, like project.undo.",
			params: [{
				name: "count",
				type: "number",
				description: "Number of redos (default 1)",
				required: false,
				default: 1
			}, {
				name: "acceptRenderQueueRisk",
				type: "boolean",
				description: "Default false. After a scripted render-queue change in this After Effects session, undo is refused (After Effects 2027 has gone into crash recovery on undo after such changes — observed twice; a precaution). Pass true only when the user accepts that risk, ideally after saving.",
				required: false
			}],
			undoGroup: () => false,
			toJsx(args) {
				return `
            return AE_MCP.undoRedo(${REDO_COMMAND_ID}, ${jsxVal(args.count ?? 1)}, ${jsxVal(args.acceptRenderQueueRisk === true)});
        `;
			}
		});
		registerOp({
			name: "project.purge",
			category: "project",
			description: "Purge AE memory/disk caches. Use when AE is consuming too much RAM.",
			params: [{
				name: "target",
				type: "string",
				description: "all|image|undo (default 'all')",
				required: false,
				default: "all"
			}],
			toJsx(args) {
				return `
            var t = ${jsxVal(args.target ?? "all")};
            if (t === "all") { app.purge(PurgeTarget.ALL_CACHES); }
            else if (t === "image") { app.purge(PurgeTarget.IMAGE_CACHES); }
            else if (t === "undo") { app.purge(PurgeTarget.UNDO_CACHES); }
            else { app.purge(PurgeTarget.ALL_CACHES); }
            return { ok: true, purged: t, memoryInUse: app.memoryInUse };
        `;
			}
		});
		registerOp({
			name: "project.replace_font",
			category: "project",
			description: "Replace a font throughout the entire project. Useful for font substitution.",
			params: [{
				name: "fromFont",
				type: "string",
				description: "Current font postscript name to replace",
				required: true
			}, {
				name: "toFont",
				type: "string",
				description: "New font postscript name",
				required: true
			}],
			toJsx(args) {
				return `
            if (!app.fonts || !app.fonts.getFontsByPostScriptName) {
                return { ok: false, error: "app.fonts.getFontsByPostScriptName is unavailable in this AE version (requires AE 24.0+)" };
            }
            if (!app.project.replaceFont) {
                return { ok: false, error: "app.project.replaceFont is unavailable in this AE version (requires AE 24.5+)" };
            }
            var _fromFonts = app.fonts.getFontsByPostScriptName(${jsxVal(args.fromFont)});
            if (!_fromFonts || _fromFonts.length === 0) {
                return { ok: false, error: "no installed font matches PostScript name " + ${jsxVal(args.fromFont)} };
            }
            var _toFonts = app.fonts.getFontsByPostScriptName(${jsxVal(args.toFont)});
            if (!_toFonts || _toFonts.length === 0) {
                return { ok: false, error: "no installed font matches PostScript name " + ${jsxVal(args.toFont)} };
            }
            try {
                app.project.replaceFont(_fromFonts[0], _toFonts[0]);
                return { ok: true, from: ${jsxVal(args.fromFont)}, to: ${jsxVal(args.toFont)} };
            } catch(e) {
                return { ok: false, error: "replaceFont failed: " + AE.errText(e) };
            }
        `;
			}
		});
		registerOp({
			name: "project.auto_fix_expressions",
			category: "project",
			description: "Find and replace text in all expressions across the project. Useful after renaming layers/comps.",
			params: [{
				name: "oldText",
				type: "string",
				description: "Text to find in expressions",
				required: true
			}, {
				name: "newText",
				type: "string",
				description: "Replacement text",
				required: true
			}],
			toJsx(args) {
				return `
            app.project.autoFixExpressions(${jsxVal(args.oldText)}, ${jsxVal(args.newText)});
            return { ok: true, replaced: ${jsxVal(args.oldText)}, with: ${jsxVal(args.newText)} };
        `;
			}
		});
		registerOp({
			name: "project.clear",
			category: "project",
			description: "Remove ALL items from the project. Destructive — use with caution.",
			params: [],
			toJsx() {
				return `
            var proj = app.project;
            var toRemove = [];
            for (var i = 1; i <= proj.numItems; i++) toRemove.push(proj.item(i));
            var removed = 0;
            for (var j = 0; j < toRemove.length; j++) {
                try { toRemove[j].remove(); removed++; } catch (e) {}
            }
            return { ok: true, removed: removed, remaining: proj.numItems };
        `;
			}
		});
		registerOp({
			name: "project.delete_item",
			category: "project",
			description: "Delete a project item by id.",
			params: [{
				name: "itemId",
				type: "number",
				description: "Numeric item id",
				required: true
			}],
			toJsx(args) {
				return `
            var _target = AE.findItemById(${jsxVal(args.itemId)});
            if (!_target) return { ok: false, error: "no item with id " + ${jsxVal(args.itemId)} };
            var _name = _target.name;
            _target.remove();
            return { ok: true, removed: _name };
        `;
			}
		});
		registerOp({
			name: "project.find_layers",
			category: "project",
			readOnly: true,
			description: "Search layers by name pattern and/or type across one or all comps.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Restrict to one comp (name or id). Omit to search all.",
					required: false
				},
				{
					name: "namePattern",
					type: "string",
					description: "Case-insensitive substring match on layer name",
					required: false
				},
				{
					name: "type",
					type: "string",
					description: "AVLayer|TextLayer|ShapeLayer|CameraLayer|LightLayer|ThreeDModelLayer|ParametricMeshLayer",
					required: false
				},
				{
					name: "limit",
					type: "number",
					description: "Max results (default 100)",
					required: false,
					default: 100
				}
			],
			toJsx(args) {
				return `
            var _namePat = ${jsxVal((args.namePattern ?? "").toLowerCase())};
            var _type = ${jsxVal(args.type ?? null)};
            var _limit = ${jsxVal(args.limit ?? 100)};
            var _arg = ${args.comp !== void 0 ? jsxVal(args.comp) : "null"};
            var comps = [];
            if (_arg !== null) {
                var c = AE.findCompByNameOrId(_arg);
                if (!c) return { ok: false, error: "no comp matching " + String(_arg) };
                comps.push(c);
            } else {
                for (var i = 1; i <= app.project.numItems; i++) {
                    if (app.project.item(i) instanceof CompItem) comps.push(app.project.item(i));
                }
            }
            function typeName(layer) {
                // 3D model / parametric mesh classes only exist on AE 24.4+ /
                // 26.3+ \u2014 probe before instanceof, and before the AVLayer
                // fallback (both are AVLayer subclasses).
                try { if (typeof ThreeDModelLayer !== "undefined" && layer instanceof ThreeDModelLayer) return "ThreeDModelLayer"; } catch (e3d) {}
                try { if (typeof ParametricMeshLayer !== "undefined" && layer instanceof ParametricMeshLayer) return "ParametricMeshLayer"; } catch (ePm) {}
                if (layer instanceof TextLayer) return "TextLayer";
                if (layer instanceof ShapeLayer) return "ShapeLayer";
                if (layer instanceof CameraLayer) return "CameraLayer";
                if (layer instanceof LightLayer) return "LightLayer";
                if (layer instanceof AVLayer) return "AVLayer";
                return "Layer";
            }
            var matches = [];
            for (var ci = 0; ci < comps.length; ci++) {
                var comp = comps[ci];
                for (var li = 1; li <= comp.numLayers; li++) {
                    var layer = comp.layer(li);
                    var tn = typeName(layer);
                    if (_type && tn !== _type) continue;
                    if (_namePat && String(layer.name).toLowerCase().indexOf(_namePat) === -1) continue;
                    matches.push({ compId: comp.id, compName: comp.name, index: layer.index, name: layer.name, type: tn });
                    if (matches.length >= _limit) break;
                }
                if (matches.length >= _limit) break;
            }
            return { ok: true, matches: matches, count: matches.length };
        `;
			}
		});
		registerOp({
			name: "project.list_effects",
			category: "project",
			readOnly: true,
			description: "List available effect matchNames in the running AE. Uses app.effects if available, otherwise a curated list.",
			params: [],
			toJsx() {
				return `
            var list = null;
            try {
                if (app.effects && app.effects.length) {
                    list = [];
                    for (var i = 0; i < app.effects.length; i++) {
                        list.push({ displayName: app.effects[i].displayName, matchName: app.effects[i].matchName, category: app.effects[i].category });
                    }
                }
            } catch (e) {}
            if (list) return { source: "app.effects", effects: list };
            return {
                source: "curated",
                effects: [
                    { displayName: "Fast Box Blur", matchName: "ADBE Box Blur2" },
                    { displayName: "Gaussian Blur", matchName: "ADBE Gaussian Blur 2" },
                    { displayName: "Glow", matchName: "ADBE Glo2" },
                    { displayName: "Drop Shadow", matchName: "ADBE Drop Shadow" },
                    { displayName: "Fill", matchName: "ADBE Fill" },
                    { displayName: "Tint", matchName: "ADBE Tint" },
                    { displayName: "Hue/Saturation", matchName: "ADBE HUE SATURATION" },
                    { displayName: "Levels", matchName: "ADBE Easy Levels2" },
                    { displayName: "Curves", matchName: "ADBE CurvesCustom" },
                    { displayName: "Brightness & Contrast", matchName: "ADBE Brightness & Contrast 2" },
                    { displayName: "Turbulent Noise", matchName: "ADBE Turbulent Noise" },
                    { displayName: "Transform", matchName: "ADBE Geometry2" },
                    { displayName: "Linear Wipe", matchName: "ADBE Linear Wipe" },
                    { displayName: "Radial Wipe", matchName: "ADBE Radial Wipe" }
                ]
            };
        `;
			}
		});
		registerOp({
			name: "comp.precompose",
			category: "comp",
			description: "Pre-compose selected layers into a new nested composition.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Source comp name or id",
					required: true
				},
				{
					name: "layerIndices",
					type: "array",
					description: "Array of 1-based layer indices to precompose",
					required: true
				},
				{
					name: "newName",
					type: "string",
					description: "Name for the new comp",
					required: true
				},
				{
					name: "moveAll",
					type: "boolean",
					description: "Move all attributes into new comp (default true)",
					required: false,
					default: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _indices = ${jsxVal(args.layerIndices)};
            var newComp = _comp.layers.precompose(_indices, ${jsxVal(args.newName)}, ${jsxVal(args.moveAll !== false)});
            return { ok: true, newCompId: newComp.id, newCompName: newComp.name };
        `;
			}
		});
		registerOp({
			name: "comp.duplicate",
			category: "comp",
			description: "Duplicate a composition.",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id to duplicate",
				required: true
			}, {
				name: "newName",
				type: "string",
				description: "Name for the duplicate",
				required: false
			}],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _dup = _comp.duplicate();
            ${args.newName ? `_dup.name = ${jsxVal(args.newName)};` : ""}
            return { ok: true, newCompId: _dup.id, newCompName: _dup.name };
        `;
			}
		});
		registerOp({
			name: "project.set_settings",
			category: "project",
			description: "Set project-wide settings: color depth, expression engine, working color space, time display.",
			params: [
				{
					name: "bitsPerChannel",
					type: "number",
					description: "Color depth: 8, 16, or 32",
					required: false
				},
				{
					name: "expressionEngine",
					type: "string",
					description: "'javascript-1.0' or 'extendscript'",
					required: false
				},
				{
					name: "workingSpace",
					type: "string",
					description: "Working color space name (see project.get_settings includeColorProfiles), or '' for None",
					required: false
				},
				{
					name: "workingGamma",
					type: "number",
					description: "Working gamma: 2.2 or 2.4",
					required: false
				},
				{
					name: "linearBlending",
					type: "boolean",
					description: "Blend colors using 1.0 gamma",
					required: false
				},
				{
					name: "timeDisplayType",
					type: "string",
					description: "timecode|frames",
					required: false
				},
				{
					name: "framesUseFeetFrames",
					type: "boolean",
					description: "Use feet+frames for frame display",
					required: false
				},
				{
					name: "framesCountType",
					type: "string",
					description: "start0|start1|timecode",
					required: false
				},
				{
					name: "transparencyGridThumbnails",
					type: "boolean",
					description: "Show checkerboard in thumbnails",
					required: false
				},
				{
					name: "gpuAccelType",
					type: "string",
					description: "software|opencl|cuda|metal",
					required: false
				},
				{
					name: "linearizeWorkingSpace",
					type: "boolean",
					description: "Linearize the working color space (AE 16.0+)",
					required: false
				},
				{
					name: "compensateForSceneReferredProfiles",
					type: "boolean",
					description: "Compensate for scene-referred profiles (AE 16.0+)",
					required: false
				},
				{
					name: "displayStartFrame",
					type: "number",
					description: "Frame count starts at 0 or 1 (when counting frames)",
					required: false
				},
				{
					name: "feetFramesFilmType",
					type: "string",
					description: "mm16|mm35 (film type for feet+frames display)",
					required: false
				},
				{
					name: "footageTimecodeDisplayStartType",
					type: "string",
					description: "start0|useSourceMedia (footage timecode start)",
					required: false
				}
			],
			toJsx(args) {
				const sets = [];
				if (args.linearizeWorkingSpace !== void 0) sets.push(`try { app.project.linearizeWorkingSpace = ${jsxVal(args.linearizeWorkingSpace)}; } catch (e) { _w.push("linearizeWorkingSpace (AE 16.0+): " + AE.errText(e)); }`);
				if (args.compensateForSceneReferredProfiles !== void 0) sets.push(`try { app.project.compensateForSceneReferredProfiles = ${jsxVal(args.compensateForSceneReferredProfiles)}; } catch (e) { _w.push("compensateForSceneReferredProfiles (AE 16.0+): " + AE.errText(e)); }`);
				if (args.displayStartFrame !== void 0) sets.push(`try { app.project.displayStartFrame = ${jsxVal(args.displayStartFrame)}; } catch (e) { _w.push("displayStartFrame: " + AE.errText(e)); }`);
				if (args.feetFramesFilmType !== void 0) sets.push(`
        try {
            var _ffMap = { "mm16": FeetFramesFilmType.MM16, "mm35": FeetFramesFilmType.MM35 };
            if (_ffMap.hasOwnProperty(${jsxVal(args.feetFramesFilmType)})) { app.project.feetFramesFilmType = _ffMap[${jsxVal(args.feetFramesFilmType)}]; }
            else { _w.push("feetFramesFilmType: pass mm16 or mm35"); }
        } catch (e) { _w.push("feetFramesFilmType: " + AE.errText(e)); }`);
				if (args.footageTimecodeDisplayStartType !== void 0) sets.push(`
        try {
            var _ftMap = { "start0": FootageTimecodeDisplayStartType.FTCS_START_0, "useSourceMedia": FootageTimecodeDisplayStartType.FTCS_USE_SOURCE_MEDIA };
            if (_ftMap.hasOwnProperty(${jsxVal(args.footageTimecodeDisplayStartType)})) { app.project.footageTimecodeDisplayStartType = _ftMap[${jsxVal(args.footageTimecodeDisplayStartType)}]; }
            else { _w.push("footageTimecodeDisplayStartType: pass start0 or useSourceMedia"); }
        } catch (e) { _w.push("footageTimecodeDisplayStartType: " + AE.errText(e)); }`);
				if (args.bitsPerChannel !== void 0) sets.push(`try { app.project.bitsPerChannel = ${jsxVal(args.bitsPerChannel)}; } catch (e) { _w.push("bitsPerChannel: " + AE.errText(e)); }`);
				if (args.expressionEngine !== void 0) sets.push(`try { app.project.expressionEngine = ${jsxVal(args.expressionEngine)}; } catch (e) { _w.push("expressionEngine: " + AE.errText(e)); }`);
				if (args.workingSpace !== void 0) sets.push(`try { app.project.workingSpace = ${jsxVal(args.workingSpace)}; } catch (e) { _w.push("workingSpace: " + AE.errText(e)); }`);
				if (args.workingGamma !== void 0) sets.push(`try { app.project.workingGamma = ${jsxVal(args.workingGamma)}; } catch (e) { _w.push("workingGamma: " + AE.errText(e)); }`);
				if (args.linearBlending !== void 0) sets.push(`try { app.project.linearBlending = ${jsxVal(args.linearBlending)}; } catch (e) { _w.push("linearBlending: " + AE.errText(e)); }`);
				if (args.timeDisplayType !== void 0) sets.push(`
        try {
            app.project.timeDisplayType = ${jsxVal(args.timeDisplayType)} === "frames" ? TimeDisplayType.FRAMES : TimeDisplayType.TIMECODE;
        } catch (e) { _w.push("timeDisplayType: " + AE.errText(e)); }`);
				if (args.framesUseFeetFrames !== void 0) sets.push(`try { app.project.framesUseFeetFrames = ${jsxVal(args.framesUseFeetFrames)}; } catch (e) { _w.push("framesUseFeetFrames: " + AE.errText(e)); }`);
				if (args.framesCountType !== void 0) sets.push(`
        try {
            var _fcMap = { "start0": FramesCountType.FC_START_0, "start1": FramesCountType.FC_START_1, "timecode": FramesCountType.FC_TIMECODE_CONVERSION };
            if (_fcMap[${jsxVal(args.framesCountType)}] === undefined) { _w.push("framesCountType: unknown value"); }
            else { app.project.framesCountType = _fcMap[${jsxVal(args.framesCountType)}]; }
        } catch (e) { _w.push("framesCountType: " + AE.errText(e)); }`);
				if (args.transparencyGridThumbnails !== void 0) sets.push(`try { app.project.transparencyGridThumbnails = ${jsxVal(args.transparencyGridThumbnails)}; } catch (e) { _w.push("transparencyGridThumbnails: " + AE.errText(e)); }`);
				if (args.gpuAccelType !== void 0) sets.push(`
        try {
            var _gpuMap = { "software": GpuAccelType.SOFTWARE, "opencl": GpuAccelType.OPENCL, "cuda": GpuAccelType.CUDA, "metal": GpuAccelType.METAL };
            if (_gpuMap[${jsxVal(args.gpuAccelType)}] === undefined) { _w.push("gpuAccelType: unknown value"); }
            else { app.project.gpuAccelType = _gpuMap[${jsxVal(args.gpuAccelType)}]; }
        } catch (e) { _w.push("gpuAccelType: " + AE.errText(e)); }`);
				return `
            var _w = [];
            ${sets.join("\n")}
            return { ok: true, warnings: _w, bitsPerChannel: app.project.bitsPerChannel };
        `;
			}
		});
		registerOp({
			name: "project.get_settings",
			category: "project",
			readOnly: true,
			description: "Read project-wide settings: color depth, expression engine, working color space, time display. Pass includeColorProfiles=true to list installed color profile names.",
			params: [{
				name: "includeColorProfiles",
				type: "boolean",
				description: "Also return installed color profile names (default false)",
				required: false,
				default: false
			}],
			toJsx(args) {
				return `
            var _p = app.project;
            var _out = {
                ok: true,
                file: _p.file ? _p.file.fsName.replace(/\\\\/g, "/") : null,
                numItems: _p.numItems,
                bitsPerChannel: AE.safeGet(function () { return _p.bitsPerChannel; }, null),
                expressionEngine: AE.safeGet(function () { return _p.expressionEngine; }, null),
                workingSpace: AE.safeGet(function () { return _p.workingSpace; }, null),
                workingGamma: AE.safeGet(function () { return _p.workingGamma; }, null),
                linearBlending: AE.safeGet(function () { return _p.linearBlending; }, null),
                framesUseFeetFrames: AE.safeGet(function () { return _p.framesUseFeetFrames; }, null),
                transparencyGridThumbnails: AE.safeGet(function () { return _p.transparencyGridThumbnails; }, null),
                gpuAccelType: AE.safeGet(function () { return String(_p.gpuAccelType); }, null),
                timeDisplayType: AE.safeGet(function () { return _p.timeDisplayType === TimeDisplayType.FRAMES ? "frames" : "timecode"; }, null),
                linearizeWorkingSpace: AE.safeGet(function () { return _p.linearizeWorkingSpace; }, null),
                compensateForSceneReferredProfiles: AE.safeGet(function () { return _p.compensateForSceneReferredProfiles; }, null),
                displayStartFrame: AE.safeGet(function () { return _p.displayStartFrame; }, null),
                feetFramesFilmType: AE.safeGet(function () { var _ff = _p.feetFramesFilmType; if (_ff === FeetFramesFilmType.MM16) return "mm16"; if (_ff === FeetFramesFilmType.MM35) return "mm35"; return String(_ff); }, null),
                footageTimecodeDisplayStartType: AE.safeGet(function () { var _ft = _p.footageTimecodeDisplayStartType; if (_ft === FootageTimecodeDisplayStartType.FTCS_START_0) return "start0"; if (_ft === FootageTimecodeDisplayStartType.FTCS_USE_SOURCE_MEDIA) return "useSourceMedia"; return String(_ft); }, null)
            };
            if (${jsxVal(!!args.includeColorProfiles)}) {
                try { _out.colorProfiles = _p.listColorProfiles(); } catch (eCp) { _out.colorProfiles = null; }
            }
            return _out;
        `;
			}
		});
		registerOp({
			name: "project.reduce",
			category: "project",
			description: "Reduce the project to only the given comps and everything they use (Project.reduceProject). Removes all other items — save a copy first.",
			params: [{
				name: "comps",
				type: "array",
				description: "Comp names or ids to keep",
				required: true
			}],
			toJsx(args) {
				return `
            var _targets = ${jsxVal(args.comps)};
            var _items = [];
            for (var _i = 0; _i < _targets.length; _i++) {
                var _c = AE.findCompByNameOrId(_targets[_i]);
                if (!_c) return { ok: false, error: "no comp matching " + _targets[_i] };
                _items.push(_c);
            }
            var _removed = app.project.reduceProject(_items);
            return { ok: true, removed: _removed, kept: _items.length, numItems: app.project.numItems };
        `;
			}
		});
		registerOp({
			name: "project.remove_unused_footage",
			category: "project",
			description: "Remove all footage items that are not used in any comp (Project.removeUnusedFootage).",
			params: [],
			toJsx() {
				return `
            var _removed = app.project.removeUnusedFootage();
            return { ok: true, removed: _removed, numItems: app.project.numItems };
        `;
			}
		});
		registerOp({
			name: "project.consolidate_footage",
			category: "project",
			description: "Merge duplicate footage items into one and update layer references (Project.consolidateFootage).",
			params: [],
			toJsx() {
				return `
            var _consolidated = app.project.consolidateFootage();
            return { ok: true, consolidated: _consolidated, numItems: app.project.numItems };
        `;
			}
		});
		registerOp({
			name: "project.import_placeholder",
			category: "project",
			description: "Create a placeholder footage item (Project.importPlaceholder) to build comps before the real footage exists. Relink later with footage.replace.",
			params: [
				{
					name: "name",
					type: "string",
					description: "Placeholder name",
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
					name: "frameRate",
					type: "number",
					description: "Frame rate",
					required: true
				},
				{
					name: "duration",
					type: "number",
					description: "Duration in seconds",
					required: true
				}
			],
			toJsx(args) {
				return `
            var _item = null;
            try {
                _item = app.project.importPlaceholder(${jsxVal(args.name)}, ${jsxVal(args.width)}, ${jsxVal(args.height)}, ${jsxVal(args.frameRate)}, ${jsxVal(args.duration)});
            } catch (eIp) { return { ok: false, error: "importPlaceholder failed: " + AE.errText(eIp) }; }
            return { ok: true, id: _item.id, name: _item.name, width: _item.width, height: _item.height, duration: _item.duration };
        `;
			}
		});
		registerOp({
			name: "project.new",
			category: "project",
			description: "Create a NEW empty project (app.newProject). Closes the current project — pass save=true to save it first (only works when it has a file path). Destructive to unsaved work.",
			params: [{
				name: "save",
				type: "boolean",
				description: "Save the current project before closing (default false; needs a file path)",
				required: false,
				default: false
			}],
			undoGroup: () => false,
			toJsx(args) {
				return `
            if (${jsxVal(!!args.save)}) {
                if (app.project.file) { app.project.save(); }
                else if (app.project.numItems > 0) { return { ok: false, error: "current project has no file path \u2014 save it first (ae_save_project with a path) or pass save=false to discard" }; }
            }
            app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
            var _p = app.newProject();
            if (!_p) return { ok: false, error: "app.newProject returned null" };
            try { AE_MCP.clearRenderQueueRisk("project.new"); } catch (eClr) {}
            return { ok: true, numItems: _p.numItems };
        `;
			}
		});
		registerOp({
			name: "project.parse_swatch",
			category: "project",
			readOnly: true,
			description: "Parse an Adobe swatch file (.ase) and return its colors (app.parseSwatchFile) - feed brand palettes to fills, solids, and text colors.",
			params: [{
				name: "path",
				type: "string",
				description: "Absolute path to the .ase file",
				required: true
			}],
			toJsx(args) {
				return `
            var _f = new File(${jsxVal(args.path)});
            if (!_f.exists) return { ok: false, error: "file not found: " + ${jsxVal(args.path)} };
            var _sw = null;
            try { _sw = app.parseSwatchFile(_f); } catch (eSw) { return { ok: false, error: "parseSwatchFile failed: " + AE.errText(eSw) }; }
            return { ok: true, swatch: AE.valueToJson(_sw) };
        `;
			}
		});
		registerOp({
			name: "project.get_xmp",
			category: "project",
			readOnly: true,
			description: "Read the project's XMP metadata packet (Project.xmpPacket) as an RDF/XML string.",
			params: [],
			toJsx() {
				return `
            var _xmp = null;
            try { _xmp = app.project.xmpPacket; } catch (eX) { return { ok: false, error: "xmpPacket read failed: " + AE.errText(eX) }; }
            return { ok: true, length: _xmp ? _xmp.length : 0, xmp: _xmp };
        `;
			}
		});
		registerOp({
			name: "project.set_xmp",
			category: "project",
			description: "Replace the project's XMP metadata packet (Project.xmpPacket). Pass a complete, well-formed RDF/XML packet - AE does not validate fragments.",
			params: [{
				name: "xmp",
				type: "string",
				description: "Complete XMP packet (RDF/XML)",
				required: true
			}],
			toJsx(args) {
				return `
            try { app.project.xmpPacket = ${jsxVal(args.xmp)}; } catch (eX) { return { ok: false, error: "xmpPacket write failed: " + AE.errText(eX) }; }
            return { ok: true, length: app.project.xmpPacket.length };
        `;
			}
		});
		registerOp({
			name: "project.set_default_import_folder",
			category: "project",
			appConfig: true,
			description: "Set the folder shown by default in the file import dialog (Project.setDefaultImportFolder).",
			params: [{
				name: "path",
				type: "string",
				description: "Absolute folder path",
				required: true
			}],
			toJsx(args) {
				return `
            var _f = new Folder(${jsxVal(args.path)});
            if (!_f.exists) return { ok: false, error: "folder not found: " + ${jsxVal(args.path)} };
            var _res = false;
            try { _res = app.project.setDefaultImportFolder(_f); } catch (eDf) { return { ok: false, error: "setDefaultImportFolder failed: " + AE.errText(eDf) }; }
            return { ok: true, set: _res, path: _f.fsName.replace(/\\\\/g, "/") };
        `;
			}
		});
		TOOL_MAP_JSX = `
    var _tools = {};
    var _missingTools = {};
    function _addTool(name, member) {
        try { if (ToolType[member] !== undefined) { _tools[name] = ToolType[member]; return; } } catch (eT) {}
        _missingTools[name] = member;
    }
    _addTool("selection", "Tool_Arrow"); _addTool("rotate", "Tool_Rotate");
    _addTool("hand", "Tool_Hand"); _addTool("zoom", "Tool_Magnify");
    _addTool("panBehind", "Tool_PanBehind");
    _addTool("rect", "Tool_Rect"); _addTool("roundedRect", "Tool_RoundedRect");
    _addTool("ellipse", "Tool_Oval"); _addTool("polygon", "Tool_Polygon"); _addTool("star", "Tool_Star");
    _addTool("textHorizontal", "Tool_TextH"); _addTool("textVertical", "Tool_TextV");
    _addTool("pen", "Tool_Pen"); _addTool("maskFeather", "Tool_Feather");
    _addTool("brush", "Tool_Paintbrush"); _addTool("cloneStamp", "Tool_CloneStamp"); _addTool("eraser", "Tool_Eraser");
    _addTool("puppetPin", "Tool_Pin"); _addTool("puppetStarch", "Tool_PinStarch");
    _addTool("puppetBend", "Tool_PinBend"); _addTool("puppetAdvanced", "Tool_PinAdvanced"); _addTool("puppetOverlap", "Tool_PinDepth");
    _addTool("cameraUnified", "Tool_CameraMaya"); _addTool("cameraOrbit", "Tool_CameraOrbit");
    _addTool("cameraTrackXY", "Tool_CameraTrackXY"); _addTool("cameraTrackZ", "Tool_CameraTrackZ");
    _addTool("cameraOrbitCursor", "Tool_CameraOrbitCursor"); _addTool("cameraOrbitScene", "Tool_CameraOrbitScene");
    _addTool("cameraOrbitCamera", "Tool_CameraOrbitCamera"); _addTool("cameraPanCursor", "Tool_CameraPanCursor");
    function _toolName(v) {
        for (var _tk in _tools) { if (_tools.hasOwnProperty(_tk) && _tools[_tk] === v) return _tk; }
        try { return String(v); } catch (eTn) { return null; }
    }
`;
		registerOp({
			name: "project.get_tool",
			category: "project",
			readOnly: true,
			description: "Read the active tool in the Tools panel (Project.toolType, AE 14.0+).",
			params: [],
			toJsx() {
				return `
            ${TOOL_MAP_JSX}
            var _cur = null;
            try { _cur = app.project.toolType; } catch (eTt) { return { ok: false, error: "toolType needs AE 14.0+: " + AE.errText(eTt) }; }
            return { ok: true, tool: _toolName(_cur) };
        `;
			}
		});
		registerOp({
			name: "project.set_tool",
			category: "project",
			appConfig: true,
			description: "Set the active tool in the Tools panel (Project.toolType, AE 14.0+): selection|rotate|hand|zoom|panBehind|rect|roundedRect|ellipse|polygon|star|textHorizontal|textVertical|pen|maskFeather|brush|cloneStamp|eraser|puppetPin|puppetStarch|puppetBend|puppetAdvanced|puppetOverlap|cameraUnified|cameraOrbit|cameraTrackXY|cameraTrackZ|cameraOrbitCursor|cameraOrbitScene|cameraOrbitCamera|cameraPanCursor.",
			params: [{
				name: "tool",
				type: "string",
				description: "Tool name (see description)",
				required: true
			}],
			toJsx(args) {
				return `
            ${TOOL_MAP_JSX}
            var _arg = ${jsxVal(args.tool)};
            if (!_tools.hasOwnProperty(_arg)) {
                if (_missingTools.hasOwnProperty(_arg)) return { ok: false, error: "tool '" + _arg + "' (ToolType." + _missingTools[_arg] + ") is not available on this AE" };
                return { ok: false, error: "unknown tool '" + _arg + "'" };
            }
            try { app.project.toolType = _tools[_arg]; } catch (eTt) { return { ok: false, error: "toolType set failed: " + AE.errText(eTt) }; }
            return { ok: true, tool: _toolName(app.project.toolType) };
        `;
			}
		});
		registerOp({
			name: "project.set_memory_limits",
			category: "project",
			appConfig: true,
			description: "Set AE memory usage limits (app.setMemoryUsageLimits): image cache percent and maximum memory percent. Percentages over 100 are allowed (AE interprets them against installed RAM).",
			params: [{
				name: "imageCachePercent",
				type: "number",
				description: "Image cache size as % of installed RAM",
				required: true
			}, {
				name: "maxMemoryPercent",
				type: "number",
				description: "Maximum AE memory as % of installed RAM",
				required: true
			}],
			toJsx(args) {
				return `
            try { app.setMemoryUsageLimits(${jsxVal(args.imageCachePercent)}, ${jsxVal(args.maxMemoryPercent)}); } catch (eMl) { return { ok: false, error: "setMemoryUsageLimits failed: " + AE.errText(eMl) }; }
            return { ok: true, memoryInUse: app.memoryInUse };
        `;
			}
		});
		registerOp({
			name: "project.set_multi_frame_rendering",
			category: "project",
			appConfig: true,
			description: "Configure Multi-Frame Rendering (app.setMultiFrameRenderingConfig, AE 22.0+): on/off and the maximum CPU percentage MFR may use.",
			params: [{
				name: "enabled",
				type: "boolean",
				description: "Enable MFR",
				required: true
			}, {
				name: "maxCpuPercent",
				type: "number",
				description: "Max CPU % for MFR (1-100, default 90)",
				required: false,
				default: 90
			}],
			toJsx(args) {
				return `
            if (typeof app.setMultiFrameRenderingConfig !== "function") return { ok: false, error: "setMultiFrameRenderingConfig needs AE 22.0+" };
            try { app.setMultiFrameRenderingConfig(${jsxVal(args.enabled)}, ${jsxVal(args.maxCpuPercent ?? 90)}); } catch (eMf) { return { ok: false, error: "setMultiFrameRenderingConfig failed: " + AE.errText(eMf) }; }
            return { ok: true, enabled: ${jsxVal(args.enabled)}, maxCpuPercent: ${jsxVal(args.maxCpuPercent ?? 90)} };
        `;
			}
		});
		registerOp({
			name: "project.merge",
			category: "project",
			description: "Import another .aep into the current project as a folder (After Effects' own project import): every comp, footage item and folder of `path` lands under one new folder with names preserved, and nothing already in the project is touched. This is how work done in another instance comes back — save there, merge here, then move or swap comps as needed (project.delete_item / item ops). Returns the folder and the comps and items it now holds.",
			params: [
				{
					name: "path",
					type: "string",
					description: "Absolute .aep path (saved by the other instance)",
					required: true
				},
				{
					name: "folderName",
					type: "string",
					description: "Rename the imported folder (default: the .aep's file name)",
					required: false
				},
				{
					name: "parentFolder",
					type: "any",
					description: "Folder (id or name) to put the imported folder into (default: project root)",
					required: false
				}
			],
			toJsx(args) {
				return `
            var _f = new File(${jsxVal(args.path)});
            if (!_f.exists) return { ok: false, error: "file not found: " + ${jsxVal(args.path)} };
            var _before = {};
            for (var _bi = 1; _bi <= app.project.numItems; _bi++) _before[app.project.item(_bi).id] = true;
            var _imported = app.project.importFile(new ImportOptions(_f));
            // The import returns the new top-level folder; find it by the item
            // diff regardless, so a build that returns something else still
            // reports the right folder.
            var _folder = (_imported && _imported instanceof FolderItem) ? _imported : null;
            var _items = [];
            var _comps = [];
            for (var _ai = 1; _ai <= app.project.numItems; _ai++) {
                var _it = app.project.item(_ai);
                if (_before[_it.id]) continue;
                if (_folder === null && _it instanceof FolderItem && _it.parentFolder === app.project.rootFolder) _folder = _it;
                _items.push({ id: _it.id, name: _it.name, type: AE.itemTypeName(_it) });
                if (_it instanceof CompItem) {
                    _comps.push({ id: _it.id, name: _it.name, width: _it.width, height: _it.height, duration: _it.duration, fps: _it.frameRate });
                }
            }
            if (_folder === null) return { ok: false, error: "import created no folder (" + _items.length + " new items)", items: _items };
            var _newName = ${jsxVal(args.folderName ?? null)};
            if (_newName) _folder.name = _newName;
            var _parentArg = ${jsxVal(args.parentFolder ?? null)};
            if (_parentArg !== null) {
                var _pf = AE.findFolder(_parentArg);
                if (!_pf) return { ok: false, error: "no folder matching " + _parentArg, folder: { id: _folder.id, name: _folder.name } };
                _folder.parentFolder = _pf;
            }
            return { ok: true, folder: { id: _folder.id, name: _folder.name }, comps: _comps, items: _items };
        `;
			}
		});
		registerOp({
			name: "project.lint",
			category: "project",
			readOnly: true,
			description: "Could another person open this project and work in it? Read only. Finds: default layer and comp names ('Shape Layer 3', 'Black Solid 1', 'Comp 2'); items outside folders (footage, solids and precomps at the top level; top-level comps nothing uses are left there, as deliverables); unused footage (solids too); missing footage; missing fonts (After Effects 24+; `fontsChecked` false when it cannot say); expressions in error (every property of every layer); and layers switched off with no role (not a track matte, not sound only, not a guide); layers the cut-out path keeps switched off for a re-click (with Object Matte on them, or their gap fill or soft edge), and video layers used for their sound alone (picture off, sound on), are listed under `kept`, not as findings; a layer with its picture and its sound off is a finding. Each finding names the item, the layer and what is wrong. `ignore` takes layer or item names kept on purpose (a matted layer kept for a re-click).",
			params: [{
				name: "ignore",
				type: "array",
				description: "Layer or item names to leave out (kept on purpose)",
				required: false
			}],
			toJsx(args) {
				return `
            var _missing = AE.missingFontNames();
            var _r = AE.lintProject(app.project, { missingFonts: _missing || [], ignore: ${jsxVal(Array.isArray(args.ignore) ? args.ignore : [])} });
            return { ok: true, file: app.project.file ? app.project.file.fsName : null, numItems: app.project.numItems,
                findings: _r.findings, counts: _r.counts, total: _r.findings.length, kept: _r.kept, fontsChecked: _missing !== null };
        `;
			}
		});
		STATE_JSX = "return { ok: true, file: app.project.file ? app.project.file.fsName : null, dirty: app.project.dirty };";
		SNAP_DIR_SUFFIX = " snapshots";
		registerOp({
			name: "project.snapshot",
			category: "project",
			description: "Keep a numbered copy of the project before a risky change: the way back that does not depend on undo. A saved project with no unsaved changes is copied as a file to '<project> snapshots/<project>_snapshot_NNN.aep' beside it (with snapshots.json: number, time, label); After Effects is not touched. With unsaved changes it refuses and says why, unless unsaved: 'save-as-snapshot', which saves the current state as the snapshot: the user's file stays as last saved, but After Effects then has the snapshot open (no command saves a copy without a dialog). A project never saved is refused.",
			params: [{
				name: "label",
				type: "string",
				description: "What the snapshot is before (shown by project.restore)",
				required: false
			}, {
				name: "unsaved",
				type: "string",
				description: "'save-as-snapshot' to snapshot unsaved changes by saving as the snapshot (the snapshot is then open)",
				required: false
			}],
			toJsx: () => jsxFail("project.snapshot runs in Node; call it through ae_do"),
			run: (args, transport) => runSnapshot(args, liveSnapshotIO(transport))
		});
		registerOp({
			name: "project.restore",
			category: "project",
			description: "Put snapshot `number` (default the latest) back: snapshots the current file first (so the restore can itself be undone), closes the project without saving, copies the snapshot over the project's own file and reopens it, so the user stays in their own file. Refuses over unsaved changes unless discardUnsaved: true, and when the open project is itself a snapshot.",
			params: [{
				name: "number",
				type: "number",
				description: "Snapshot number (default the latest)",
				required: false
			}, {
				name: "discardUnsaved",
				type: "boolean",
				description: "Restore even though the project has unsaved changes, losing them",
				required: false
			}],
			toJsx: () => jsxFail("project.restore runs in Node; call it through ae_do"),
			run: (args, transport) => runRestore(args, liveSnapshotIO(transport))
		});
	})))();
}

// operations/mask.js
function maskGeometryParams() {
	return [
		{
			name: "shape",
			type: "string",
			description: "ellipse|rect — build the path from center/size instead of vertices",
			required: false
		},
		{
			name: "center",
			type: "array",
			description: "[x, y] center in layer space (default: source center for footage/solids, [0,0] for shape/text layers)",
			required: false
		},
		{
			name: "size",
			type: "array",
			description: "[width, height] of the ellipse/rect",
			required: false
		},
		{
			name: "roundness",
			type: "number",
			description: "Corner radius for rect (default 0)",
			required: false,
			default: 0
		}
	];
}
function jsxGeometryShape(args) {
	const kind = args.shape;
	if (kind !== "ellipse" && kind !== "rect") return jsxFail("shape must be ellipse|rect");
	if (!Array.isArray(args.size) || args.size.length !== 2) return jsxFail("size must be [width, height]");
	return `
            var _center = ${jsxVal(args.center ?? null)};
            if (_center === null) _center = AE.defaultMaskCenter(_layer);
            var _shape = AE.geometryShape(${jsxVal(kind)}, _center, ${jsxVal(args.size)}, ${jsxVal(args.roundness ?? 0)});
        `;
}
function init_mask() {
	return (init_mask = __esmMin((() => {
		init_registry();
		registerOp({
			name: "mask.add",
			category: "mask",
			description: "Add a new mask to a layer. With shape ('ellipse'|'rect') + size (+ center) the mask path is built right away — mode/inverted can be set in the same call. Returns the mask index; animate the path afterwards with mask.set_path { time }.",
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
					name: "name",
					type: "string",
					description: "Mask name",
					required: false
				},
				...maskGeometryParams(),
				{
					name: "mode",
					type: "string",
					description: "Add|Subtract|Intersect|Lighten|Darken|Difference|None",
					required: false
				},
				{
					name: "inverted",
					type: "boolean",
					description: "Invert the mask",
					required: false
				}
			],
			toJsx(args) {
				const geometry = args.shape !== void 0 || args.size !== void 0 || args.center !== void 0 ? `${jsxGeometryShape(args)}
            _mask.property("ADBE Mask Shape").setValue(_shape);` : "";
				const modeJsx = args.mode === void 0 ? "" : `var _modeMap = { "Add": MaskMode.ADD, "Subtract": MaskMode.SUBTRACT, "Intersect": MaskMode.INTERSECT, "Lighten": MaskMode.LIGHTEN, "Darken": MaskMode.DARKEN, "Difference": MaskMode.DIFFERENCE, "None": MaskMode.NONE };
            if (!_modeMap.hasOwnProperty(${jsxVal(args.mode)})) return { ok: false, error: "unknown mode " + ${jsxVal(args.mode)} };
            _mask.maskMode = _modeMap[${jsxVal(args.mode)}];`;
				return `
            ${jsxCompLayerPreamble(args)}
            var _masks = _layer.property("Masks");
            if (!_masks) return { ok: false, error: "layer cannot carry masks (camera/light?)" };
            var _mask = _masks.addProperty("ADBE Mask Atom");
            ${args.name ? `_mask.name = ${jsxVal(args.name)};` : ""}
            ${geometry}
            ${modeJsx}
            ${args.inverted !== void 0 ? `_mask.inverted = ${jsxVal(args.inverted)};` : ""}
            return { ok: true, maskIndex: _mask.propertyIndex, name: _mask.name };
        `;
			}
		});
		registerOp({
			name: "mask.set_path",
			category: "mask",
			description: "Set a mask's path — from vertices (+ tangents), or geometrically from shape ('ellipse'|'rect') + size (+ center, roundness). With `time` the path is written as a keyframe, so two calls (small size at t0, large at t1) make a wipe. Vertices/center are in layer space.",
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
					name: "maskIndex",
					type: "number",
					description: "1-based mask index",
					required: true
				},
				{
					name: "vertices",
					type: "array",
					description: "Array of [x,y] points (omit when using shape/size)",
					required: false
				},
				...maskGeometryParams(),
				{
					name: "time",
					type: "number",
					description: "Write the path as a keyframe at this time instead of the static value",
					required: false
				},
				{
					name: "inTangents",
					type: "array",
					description: "Array of [x,y] in-tangent offsets (same length as vertices)",
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
				},
				{
					name: "featherSegLocs",
					type: "array",
					description: "Variable-width feather: 0-based segment index per feather point",
					required: false
				},
				{
					name: "featherRelSegLocs",
					type: "array",
					description: "Variable-width feather: relative position (0-1) on the segment, per point",
					required: false
				},
				{
					name: "featherRadii",
					type: "array",
					description: "Variable-width feather: radius in px per point. Sign must match featherTypes: outer points (type 0) need radius >= 0, inner points (type 1) need radius <= 0 — AE rejects mismatches",
					required: false
				},
				{
					name: "featherInterps",
					type: "array",
					description: "Variable-width feather: 0=smooth, 1=hold, per point (default all 0)",
					required: false
				},
				{
					name: "featherTensions",
					type: "array",
					description: "Variable-width feather: tension 0-1 per point (default all 0)",
					required: false
				},
				{
					name: "featherTypes",
					type: "array",
					description: "Variable-width feather: 0=outer, 1=inner, per point (default all 0)",
					required: false
				},
				{
					name: "featherRelCornerAngles",
					type: "array",
					description: "Variable-width feather: relative corner angle % per point (default all 0)",
					required: false
				}
			],
			toJsx(args) {
				const hasFeather = [
					args.featherSegLocs,
					args.featherRelSegLocs,
					args.featherRadii,
					args.featherInterps,
					args.featherTensions,
					args.featherTypes,
					args.featherRelCornerAngles
				].some((a) => a !== void 0);
				const returnJsx = !hasFeather ? `return { ok: true, maskIndex: ${jsxVal(args.maskIndex)}, numKeys: _pathProp.numKeys };` : `var _fpApplied = null;
            try { _fpApplied = _mask.property("ADBE Mask Shape").value.featherSegLocs.length; } catch (eFp) {}
            return { ok: true, maskIndex: ${jsxVal(args.maskIndex)}, numKeys: _pathProp.numKeys, featherPoints: _fpApplied };`;
				const useGeometry = args.vertices === void 0;
				if (useGeometry && args.shape === void 0 && args.size === void 0) return jsxFail("give vertices, or shape + size");
				if (!useGeometry && args.shape !== void 0) return jsxFail("give either vertices or shape, not both");
				const shapeJsx = useGeometry ? jsxGeometryShape(args) : `
            var _shape = new Shape();
            _shape.vertices = ${jsxVal(args.vertices)};
            _shape.closed = ${jsxVal(args.closed !== false)};
            ${args.inTangents ? `_shape.inTangents = ${jsxVal(args.inTangents)};` : ""}
            ${args.outTangents ? `_shape.outTangents = ${jsxVal(args.outTangents)};` : ""}
        `;
				const writeJsx = args.time === void 0 ? `_pathProp.setValue(_shape);` : `_pathProp.setValueAtTime(${jsxVal(args.time)}, _shape);`;
				const featherJsx = !hasFeather ? "" : `
            var _fSeg = ${jsxVal(args.featherSegLocs)};
            var _fRel = ${jsxVal(args.featherRelSegLocs)};
            var _fRad = ${jsxVal(args.featherRadii)};
            if (!_fSeg || !_fRel || !_fRad || _fSeg.length !== _fRel.length || _fSeg.length !== _fRad.length) {
                return { ok: false, error: "featherSegLocs, featherRelSegLocs and featherRadii must all be present with the same length" };
            }
            function _padded(arr, n) {
                var out = [];
                for (var _fi = 0; _fi < n; _fi++) out.push(arr && _fi < arr.length ? arr[_fi] : 0);
                return out;
            }
            _shape.featherSegLocs = _fSeg;
            _shape.featherRelSegLocs = _fRel;
            _shape.featherRadii = _fRad;
            _shape.featherInterps = _padded(${jsxVal(args.featherInterps)}, _fSeg.length);
            _shape.featherTensions = _padded(${jsxVal(args.featherTensions)}, _fSeg.length);
            _shape.featherTypes = _padded(${jsxVal(args.featherTypes)}, _fSeg.length);
            _shape.featherRelCornerAngles = _padded(${jsxVal(args.featherRelCornerAngles)}, _fSeg.length);
        `;
				return `
            ${jsxCompLayerPreamble(args)}
            var _masksRoot = _layer.property("Masks");
            if (!_masksRoot) return { ok: false, error: "layer has no Masks group" };
            if (${jsxVal(args.maskIndex)} < 1 || ${jsxVal(args.maskIndex)} > _masksRoot.numProperties) {
                return { ok: false, error: "no mask at index " + ${jsxVal(args.maskIndex)} + " (layer has " + _masksRoot.numProperties + ")" };
            }
            var _mask = _masksRoot.property(${jsxVal(args.maskIndex)});
            if (!_mask) return { ok: false, error: "no mask at index " + ${jsxVal(args.maskIndex)} };
            ${shapeJsx}
            ${featherJsx}
            var _pathProp = _mask.property("ADBE Mask Shape");
            ${writeJsx}
            ${returnJsx}
        `;
			}
		});
		registerOp({
			name: "mask.set_props",
			category: "mask",
			description: "Set mask properties: mode, feather, opacity, expansion, inverted, locked, color, rotoBezier, motionBlur, featherFalloff.",
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
					name: "maskIndex",
					type: "number",
					description: "1-based mask index",
					required: true
				},
				{
					name: "mode",
					type: "string",
					description: "Add|Subtract|Intersect|Lighten|Darken|Difference|None",
					required: false
				},
				{
					name: "feather",
					type: "array",
					description: "[x,y] feather in px",
					required: false
				},
				{
					name: "opacity",
					type: "number",
					description: "Mask opacity 0-100",
					required: false
				},
				{
					name: "expansion",
					type: "number",
					description: "Mask expansion in px",
					required: false
				},
				{
					name: "inverted",
					type: "boolean",
					description: "Invert the mask",
					required: false
				},
				{
					name: "locked",
					type: "boolean",
					description: "Lock the mask against UI editing",
					required: false
				},
				{
					name: "color",
					type: "array",
					description: "[r,g,b] 0-1 mask outline color in the UI",
					required: false
				},
				{
					name: "rotoBezier",
					type: "boolean",
					description: "Treat the path as a RotoBezier (tangents auto-computed)",
					required: false
				},
				{
					name: "motionBlur",
					type: "string",
					description: "sameAsLayer|on|off (per-mask motion blur)",
					required: false
				},
				{
					name: "featherFalloff",
					type: "string",
					description: "smooth|linear (feather falloff)",
					required: false
				}
			],
			toJsx(args) {
				const sets = [];
				if (args.mode !== void 0) sets.push(`
                var _modeMap = { "Add": MaskMode.ADD, "Subtract": MaskMode.SUBTRACT, "Intersect": MaskMode.INTERSECT, "Lighten": MaskMode.LIGHTEN, "Darken": MaskMode.DARKEN, "Difference": MaskMode.DIFFERENCE, "None": MaskMode.NONE };
                if (_modeMap[${jsxVal(args.mode)}]) _mask.maskMode = _modeMap[${jsxVal(args.mode)}];
            `);
				if (args.feather !== void 0) sets.push(`try { _mask.property("ADBE Mask Feather").setValue(${jsxVal(args.feather)}); } catch(e) {}`);
				if (args.opacity !== void 0) sets.push(`try { _mask.property("ADBE Mask Opacity").setValue(${jsxVal(args.opacity)}); } catch(e) {}`);
				if (args.expansion !== void 0) sets.push(`try { _mask.property("ADBE Mask Offset").setValue(${jsxVal(args.expansion)}); } catch(e) {}`);
				if (args.inverted !== void 0) sets.push(`try { _mask.inverted = ${jsxVal(args.inverted)}; } catch(e) { _w.push("inverted: " + AE.errText(e)); }`);
				if (args.locked !== void 0) sets.push(`try { _mask.locked = ${jsxVal(args.locked)}; } catch(e) { _w.push("locked: " + AE.errText(e)); }`);
				if (args.color !== void 0) sets.push(`try { _mask.color = ${jsxVal(args.color)}; } catch(e) { _w.push("color: " + AE.errText(e)); }`);
				if (args.rotoBezier !== void 0) sets.push(`try { _mask.rotoBezier = ${jsxVal(args.rotoBezier)}; } catch(e) { _w.push("rotoBezier: " + AE.errText(e)); }`);
				if (args.motionBlur !== void 0) sets.push(`
                var _mbMap = { "sameAsLayer": MaskMotionBlur.SAME_AS_LAYER, "on": MaskMotionBlur.ON, "off": MaskMotionBlur.OFF };
                if (_mbMap.hasOwnProperty(${jsxVal(args.motionBlur)})) {
                    try { _mask.maskMotionBlur = _mbMap[${jsxVal(args.motionBlur)}]; } catch(e) { _w.push("motionBlur: " + AE.errText(e)); }
                } else { _w.push("motionBlur: unknown value " + ${jsxVal(args.motionBlur)}); }
            `);
				if (args.featherFalloff !== void 0) sets.push(`
                var _ffMap = { "smooth": MaskFeatherFalloff.FFO_SMOOTH, "linear": MaskFeatherFalloff.FFO_LINEAR };
                if (_ffMap.hasOwnProperty(${jsxVal(args.featherFalloff)})) {
                    try { _mask.maskFeatherFalloff = _ffMap[${jsxVal(args.featherFalloff)}]; } catch(e) { _w.push("featherFalloff: " + AE.errText(e)); }
                } else { _w.push("featherFalloff: unknown value " + ${jsxVal(args.featherFalloff)}); }
            `);
				return `
            ${jsxCompLayerPreamble(args)}
            var _mask = _layer.property("Masks").property(${jsxVal(args.maskIndex)});
            if (!_mask) return { ok: false, error: "no mask at index " + ${jsxVal(args.maskIndex)} };
            var _w = [];
            ${sets.join("\n")}
            return { ok: true, maskIndex: ${jsxVal(args.maskIndex)}, warnings: _w };
        `;
			}
		});
		registerOp({
			name: "mask.remove",
			category: "mask",
			description: "Remove a mask from a layer by its 1-based index.",
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
					name: "maskIndex",
					type: "number",
					description: "1-based mask index",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _masks = _layer.property("Masks");
            if (!_masks) return { ok: false, error: "layer has no Masks group" };
            // PropertyGroup.property(index) throws on out-of-range rather than
            // returning null, so range-check first \u2014 otherwise the caller gets
            // a raw ExtendScript error instead of this message.
            if (${jsxVal(args.maskIndex)} < 1 || ${jsxVal(args.maskIndex)} > _masks.numProperties) {
                return { ok: false, error: "no mask at index " + ${jsxVal(args.maskIndex)} + " (layer has " + _masks.numProperties + ")" };
            }
            var _mask = _masks.property(${jsxVal(args.maskIndex)});
            if (!_mask) return { ok: false, error: "no mask at index " + ${jsxVal(args.maskIndex)} };
            var _name = _mask.name;
            _mask.remove();
            return { ok: true, removed: _name, remaining: _masks.numProperties };
        `;
			}
		});
		registerOp({
			name: "mask.get",
			category: "mask",
			readOnly: true,
			description: "Read a layer's masks back: index, name, mode by name (Add, Subtract, Intersect, Lighten, Darken, Difference, None — the names mask.add and mask.set_props take, plus the raw modeValue), inverted, locked, feather [x, y], expansion, opacity, featherFalloff, closed, vertexCount, vertices, inTangents and outTangents (layer space), featherPoints (variable-width feather), and numKeys / keyframed for path, feather, opacity and expansion. Read the masks before changing them with mask.set_path or mask.set_props. A wide feather on a garbage mask reads as a soft patch in ae_render_frame's edge report.",
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
					name: "mask",
					type: "any",
					description: "1-based mask index or mask name. Default: every mask on the layer.",
					required: false
				},
				{
					name: "time",
					type: "number",
					description: "Read the values at this comp time (seconds). Default: the current time.",
					required: false
				}
			],
			toJsx(args) {
				if (args.mask !== void 0 && typeof args.mask !== "number" && typeof args.mask !== "string") return jsxFail("mask must be a 1-based index or a mask name");
				return `
            ${jsxCompLayerPreamble(args)}
            var _masks = _layer.property("ADBE Mask Parade");
            if (!_masks) return { ok: false, error: "layer '" + _layer.name + "' cannot carry masks (camera or light?)" };
            var _want = ${jsxVal(args.mask ?? null)};
            var _time = ${jsxVal(args.time ?? null)};
            var _n = _masks.numProperties;
            var _have = [];
            for (var _hi = 1; _hi <= _n; _hi++) _have.push(_hi + " " + _masks.property(_hi).name);
            var _haveText = _have.length ? _have.join(", ") : "none";
            var _sel = [];
            if (_want === null) {
                for (var _ai = 1; _ai <= _n; _ai++) _sel.push(_ai);
            } else if (typeof _want === "number") {
                if (_want < 1 || _want > _n) return { ok: false, error: "no mask at index " + _want + " (masks: " + _haveText + ")" };
                _sel.push(_want);
            } else {
                for (var _si = 1; _si <= _n; _si++) if (_masks.property(_si).name === _want) _sel.push(_si);
                if (_sel.length === 0) return { ok: false, error: "no mask named '" + _want + "' (masks: " + _haveText + ")" };
            }
            var _list = [];
            for (var _li = 0; _li < _sel.length; _li++) _list.push(AE.describeMask(_masks.property(_sel[_li]), _sel[_li], _time));
            return { ok: true, layer: _layer.name, time: _time, count: _list.length, masks: _list };
        `;
			}
		});
	})))();
}

// operations/property.js
function init_property() {
	return (init_property = __esmMin((() => {
		init_registry();
		registerOp({
			name: "property.set",
			category: "property",
			description: "Set any layer property by path. layer can be index, name, 'selected', or 'all'.",
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
					description: "Layer index, name, 'selected', or 'all'",
					required: true
				},
				{
					name: "property",
					type: "array",
					description: "Property path, e.g. [\"Transform\",\"Position\"]",
					required: true
				},
				{
					name: "value",
					type: "any",
					description: "Value to set",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _layers = AE.resolveLayers(_comp, ${jsxVal(args.layer)});
            if (_layers.length === 0) return { ok: false, error: "no layers matched" };
            var _propPath = ${jsxVal(args.property)};
            var _results = [];
            for (var _li = 0; _li < _layers.length; _li++) {
                var _layer = _layers[_li];
                try {
                    var _node = _layer;
                    for (var _pi = 0; _pi < _propPath.length; _pi++) {
                        _node = _node.property(_propPath[_pi]);
                        if (!_node) throw new Error("not found: " + _propPath[_pi]);
                    }
                    // Separated dimensions and __kind values route through
                    // AE.writeValue; setValue on a separated leader throws.
                    var _wr = AE.writeValue(_node, ${jsxVal(args.value)});
                    _results.push({ name: _layer.name, ok: true, separated: _wr.separated });
                } catch(e) {
                    _results.push({ name: _layer.name, ok: false, error: AE.errText(e).substring(0, 50) });
                }
            }
            return { ok: true, count: _results.length, layers: _results };
        `;
			}
		});
		registerOp({
			name: "property.get",
			category: "property",
			readOnly: true,
			description: "Get the current value of any layer property by path.",
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
					name: "time",
					type: "number",
					description: "If set, get value at this time (for animated properties)",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            var _val;
            if (${jsxVal(args.time ?? null)} !== null) {
                _val = _node.valueAtTime(${jsxVal(args.time)}, false);
            } else {
                _val = _node.value;
            }
            return {
                ok: true,
                name: _node.name,
                matchName: _node.matchName,
                value: AE.valueToJson(_val),
                numKeys: _node.numKeys || 0,
                hasExpression: _node.canSetExpression ? _node.expressionEnabled : false
            };
        `;
			}
		});
		registerOp({
			name: "property.list",
			category: "property",
			readOnly: true,
			description: "List child properties/groups at a given path. Useful for discovering what's inside a property group.",
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
					description: "Property path to a group. Use [] for the layer root.",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            if (!_node.numProperties) return { ok: false, error: "not a property group (leaf property)" };
            var children = [];
            for (var i = 1; i <= _node.numProperties; i++) {
                var ch = _node.property(i);
                children.push({
                    index: i,
                    name: ch.name,
                    matchName: ch.matchName,
                    isGroup: ch.propertyType !== PropertyType.PROPERTY,
                    numChildren: ch.numProperties || 0
                });
            }
            return { ok: true, path: _propPath, children: children };
        `;
			}
		});
		registerOp({
			name: "property.add",
			category: "property",
			description: `Add a property to an indexed group by matchName (PropertyGroup.addProperty). Unlocks text animators ('ADBE Text Animator' on ["Text","Animators"]), layer styles, shape contents, etc. Use property.list to discover group paths.`,
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
					description: "Path to the group to add into, e.g. [\"Text\",\"Animators\"]. Use [] for layer root.",
					required: true
				},
				{
					name: "matchName",
					type: "string",
					description: "Match name (or display name) of the property to add, e.g. \"ADBE Text Animator\". NOTE: adding to an indexed group re-creates it, invalidating prior property references.",
					required: true
				},
				{
					name: "name",
					type: "string",
					description: "Rename the new property",
					required: false
				}
			],
			toJsx(args) {
				const renameJsx = args.name ? `try { _added.name = ${jsxVal(args.name)}; } catch (eName) {}` : "";
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            var _mn = ${jsxVal(args.matchName)};
            var _canAdd = false;
            try { _canAdd = _node.canAddProperty(_mn); } catch (eCan) {
                return { ok: false, error: "not a property group that supports addProperty" };
            }
            if (!_canAdd) return { ok: false, error: "group '" + _node.matchName + "' cannot add '" + _mn + "'" };
            var _added = _node.addProperty(_mn);
            ${renameJsx}
            return { ok: true, name: _added.name, matchName: _added.matchName, propertyIndex: _added.propertyIndex };
        `;
			}
		});
		registerOp({
			name: "property.remove",
			category: "property",
			description: "Remove a property or group by path (Property.remove). Works on members of indexed groups: effects, masks, shape contents, text animators, layer styles.",
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
					description: "Path to the property to remove",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            // An empty path leaves _node === _layer, and Layer.remove() would
            // delete the whole layer. property.add accepts [] for the layer
            // root, so a caller has every reason to try it here too.
            if (!_propPath.length) return { ok: false, error: "property path is empty \u2014 that would remove the layer itself, not a property" };
            ${jsxPropertyLookup()}
            var _removedName = _node.name;
            try { _node.remove(); } catch (eRm) {
                return { ok: false, error: "cannot remove '" + _removedName + "': " + AE.errText(eRm) };
            }
            return { ok: true, removed: _removedName };
        `;
			}
		});
		registerOp({
			name: "property.separate_dimensions",
			category: "property",
			description: "Separate (or rejoin) the dimensions of a multi-dimensional property such as Position. When separated, animate the followers (e.g. X Position) individually.",
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
					description: "Property path (e.g. Position)",
					required: true
				},
				{
					name: "separated",
					type: "boolean",
					description: "true=separate, false=rejoin",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            if (!_node.isSeparationLeader) return { ok: false, error: "property cannot separate dimensions" };
            _node.dimensionsSeparated = ${jsxVal(!!args.separated)};
            return { ok: true, dimensionsSeparated: _node.dimensionsSeparated };
        `;
			}
		});
		registerOp({
			name: "property.move",
			category: "property",
			description: "Reorder a property within its parent INDEXED group (PropertyBase.moveTo): masks, shape contents, text animators. For effects use effect.move.",
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
					description: "Path to the property to move (a member of an indexed group)",
					required: true
				},
				{
					name: "toIndex",
					type: "number",
					description: "1-based target position within the parent group",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            var _parent = _node.parentProperty;
            if (!_parent || _parent.propertyType !== PropertyType.INDEXED_GROUP) {
                return { ok: false, error: "property is not a member of an indexed group \u2014 only those can be reordered" };
            }
            var _to = ${jsxVal(args.toIndex)};
            if (_to < 1 || _to > _parent.numProperties) return { ok: false, error: "toIndex out of range (1-" + _parent.numProperties + ")" };
            try { _node.moveTo(_to); } catch (eMv) { return { ok: false, error: "moveTo failed: " + AE.errText(eMv) }; }
            var _order = [];
            for (var _i = 1; _i <= _parent.numProperties; _i++) _order.push(_parent.property(_i).name);
            return { ok: true, order: _order };
        `;
			}
		});
		registerOp({
			name: "property.select",
			category: "property",
			description: "Select or deselect a property in the timeline (PropertyBase.selected) - stages it for UI-side actions and makes it visible with the U-shortcut workflow.",
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
					name: "selected",
					type: "boolean",
					description: "true=select, false=deselect (default true)",
					required: false,
					default: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _propPath = ${jsxVal(args.property)};
            ${jsxPropertyLookup()}
            try { _node.selected = ${jsxVal(args.selected !== false)}; } catch (eSl) { return { ok: false, error: "selected set failed: " + AE.errText(eSl) }; }
            return { ok: true, property: _node.name, selected: _node.selected };
        `;
			}
		});
	})))();
}

// operations/marker.js
function jsxMarkerPreamble(args) {
	if (args.layer !== void 0 && args.layer !== null) return `
        ${jsxCompLayerPreamble(args)}
        var _mp = _layer.property("Marker");
        if (!_mp) return { ok: false, error: "layer has no Marker property" };
    `;
	return `
        ${jsxCompPreamble(args)}
        var _mp = _comp.markerProperty;
        if (!_mp) return { ok: false, error: "comp has no marker property" };
    `;
}
function jsxMarkerKeyLookup(args) {
	return `
        var _ki = ${jsxVal(args.keyIndex ?? null)};
        var _t = ${jsxVal(args.time ?? null)};
        if (_ki === null && _t === null) return { ok: false, error: "pass keyIndex or time" };
        if (_mp.numKeys === 0) return { ok: false, error: "no markers" };
        if (_ki === null) {
            _ki = _mp.nearestKeyIndex(_t);
            // nearestKeyIndex has no distance limit: with a single marker at 0s,
            // asking for t=10 returns that marker. These lookups feed destructive
            // ops, so require the hit to land on the requested time (within half
            // a frame) rather than silently retargeting the only marker there is.
            var _tol = 0.5 * (_comp.frameDuration || (1 / 30));
            if (Math.abs(_mp.keyTime(_ki) - _t) > _tol) {
                return { ok: false, error: "no marker at " + _t + "s (nearest is at " + _mp.keyTime(_ki) + "s) \u2014 pass keyIndex to target it explicitly" };
            }
        }
        if (_ki < 1 || _ki > _mp.numKeys) return { ok: false, error: "marker index out of range (1-" + _mp.numKeys + ")" };
    `;
}
function jsxMarkerFieldSets(args) {
	const sets = [];
	if (args.label !== void 0) sets.push(`_mv.label = ${jsxVal(args.label)};`);
	if (args.duration !== void 0) sets.push(`_mv.duration = ${jsxVal(args.duration)};`);
	if (args.chapter !== void 0) sets.push(`_mv.chapter = ${jsxVal(args.chapter)};`);
	if (args.url !== void 0) sets.push(`_mv.url = ${jsxVal(args.url)};`);
	if (args.frameTarget !== void 0) sets.push(`_mv.frameTarget = ${jsxVal(args.frameTarget)};`);
	if (args.cuePointName !== void 0) sets.push(`_mv.cuePointName = ${jsxVal(args.cuePointName)};`);
	if (args.eventCuePoint !== void 0) sets.push(`_mv.eventCuePoint = ${jsxVal(args.eventCuePoint)};`);
	if (args.params !== void 0) sets.push(`
            try {
                var _prm = ${jsxVal(args.params)};
                var _prmStr = {};
                for (var _pk in _prm) { if (_prm.hasOwnProperty(_pk)) _prmStr[_pk] = String(_prm[_pk]); }
                _mv.setParameters(_prmStr);
            } catch (ePrm) { _w.push("params: " + AE.errText(ePrm)); }
        `);
	if (args.protectedRegion !== void 0) sets.push(`try { _mv.protectedRegion = ${jsxVal(args.protectedRegion)}; } catch (ePr) { _w.push("protectedRegion: " + AE.errText(ePr)); }`);
	return sets.join("\n");
}
var MARKER_FIELD_PARAMS;
function init_marker() {
	return (init_marker = __esmMin((() => {
		init_registry();
		MARKER_FIELD_PARAMS = [
			{
				name: "label",
				type: "number",
				description: "Label color index (0-16)",
				required: false
			},
			{
				name: "duration",
				type: "number",
				description: "Marker duration in seconds",
				required: false
			},
			{
				name: "chapter",
				type: "string",
				description: "Chapter link text",
				required: false
			},
			{
				name: "url",
				type: "string",
				description: "Web link URL",
				required: false
			},
			{
				name: "frameTarget",
				type: "string",
				description: "Web link frame target (used with url)",
				required: false
			},
			{
				name: "cuePointName",
				type: "string",
				description: "Flash Video cue point name",
				required: false
			},
			{
				name: "eventCuePoint",
				type: "boolean",
				description: "true = event cue point, false = navigation cue point",
				required: false
			},
			{
				name: "params",
				type: "object",
				description: "Cue point key/value parameters, e.g. { \"speaker\": \"A\" } (values stringified)",
				required: false
			},
			{
				name: "protectedRegion",
				type: "boolean",
				description: "Protected-region flag (comp markers only)",
				required: false
			}
		];
		registerOp({
			name: "marker.add_comp",
			category: "marker",
			description: "Add a marker to a composition at a given time.",
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
					description: "Time in seconds",
					required: true
				},
				{
					name: "comment",
					type: "string",
					description: "Marker comment text",
					required: false,
					default: ""
				},
				...MARKER_FIELD_PARAMS
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _mv = new MarkerValue(${jsxVal(args.comment ?? "")});
            var _w = [];
            ${jsxMarkerFieldSets(args)}
            _comp.markerProperty.setValueAtTime(${jsxVal(args.time)}, _mv);
            return { ok: true, numMarkers: _comp.markerProperty.numKeys, warnings: _w };
        `;
			}
		});
		registerOp({
			name: "marker.add_layer",
			category: "marker",
			description: "Add a marker to a layer at a given time.",
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
					name: "time",
					type: "number",
					description: "Time in seconds",
					required: true
				},
				{
					name: "comment",
					type: "string",
					description: "Marker comment text",
					required: false,
					default: ""
				},
				...MARKER_FIELD_PARAMS
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _mv = new MarkerValue(${jsxVal(args.comment ?? "")});
            var _w = [];
            ${jsxMarkerFieldSets(args)}
            _layer.property("Marker").setValueAtTime(${jsxVal(args.time)}, _mv);
            return { ok: true, numMarkers: _layer.property("Marker").numKeys, warnings: _w };
        `;
			}
		});
		registerOp({
			name: "marker.remove",
			category: "marker",
			description: "Remove a marker from a comp (default) or a layer (pass layer). Target by keyIndex or nearest time.",
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
					description: "Layer index or name — omit for comp markers",
					required: false
				},
				{
					name: "keyIndex",
					type: "number",
					description: "1-based marker index",
					required: false
				},
				{
					name: "time",
					type: "number",
					description: "Remove the marker nearest to this time (used when keyIndex omitted)",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxMarkerPreamble(args)}
            ${jsxMarkerKeyLookup(args)}
            var _removedTime = _mp.keyTime(_ki);
            _mp.removeKey(_ki);
            return { ok: true, removedTime: _removedTime, numMarkers: _mp.numKeys };
        `;
			}
		});
		registerOp({
			name: "marker.update",
			category: "marker",
			description: "Update fields of an existing marker on a comp (default) or a layer (pass layer). Target by keyIndex or nearest time. Only the passed fields change.",
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
					description: "Layer index or name — omit for comp markers",
					required: false
				},
				{
					name: "keyIndex",
					type: "number",
					description: "1-based marker index",
					required: false
				},
				{
					name: "time",
					type: "number",
					description: "Update the marker nearest to this time (used when keyIndex omitted)",
					required: false
				},
				{
					name: "comment",
					type: "string",
					description: "New comment",
					required: false
				},
				...MARKER_FIELD_PARAMS
			],
			toJsx(args) {
				const commentSet = args.comment !== void 0 ? `_mv.comment = ${jsxVal(args.comment)};` : "";
				return `
            ${jsxMarkerPreamble(args)}
            ${jsxMarkerKeyLookup(args)}
            var _mv = _mp.keyValue(_ki);
            var _w = [];
            ${commentSet}
            ${jsxMarkerFieldSets(args)}
            _mp.setValueAtKey(_ki, _mv);
            return { ok: true, keyIndex: _ki, time: _mp.keyTime(_ki), warnings: _w };
        `;
			}
		});
		registerOp({
			name: "marker.list",
			category: "marker",
			readOnly: true,
			description: "List all markers on a comp (default) or a layer (pass layer).",
			params: [{
				name: "comp",
				type: "any",
				description: "Comp name or id",
				required: true
			}, {
				name: "layer",
				type: "any",
				description: "Layer index or name — omit for comp markers",
				required: false
			}],
			toJsx(args) {
				return `
            ${jsxMarkerPreamble(args)}
            var _markers = [];
            for (var _mi = 1; _mi <= _mp.numKeys; _mi++) {
                var _v = _mp.keyValue(_mi);
                _markers.push({
                    index: _mi,
                    time: _mp.keyTime(_mi),
                    comment: AE.safeGet(function () { return _v.comment; }, ""),
                    duration: AE.safeGet(function () { return _v.duration; }, 0),
                    label: AE.safeGet(function () { return _v.label; }, 0),
                    chapter: AE.safeGet(function () { return _v.chapter; }, ""),
                    url: AE.safeGet(function () { return _v.url; }, ""),
                    frameTarget: AE.safeGet(function () { return _v.frameTarget; }, ""),
                    cuePointName: AE.safeGet(function () { return _v.cuePointName; }, ""),
                    eventCuePoint: AE.safeGet(function () { return _v.eventCuePoint; }, false),
                    params: AE.safeGet(function () { return _v.getParameters(); }, {}),
                    protectedRegion: AE.safeGet(function () { return _v.protectedRegion; }, false)
                });
            }
            return { ok: true, count: _markers.length, markers: _markers };
        `;
			}
		});
	})))();
}

// operations/layer-advanced.js
function init_layer_advanced() {
	return (init_layer_advanced = __esmMin((() => {
		init_registry();
		init_snippets();
		registerOp({
			name: "layer.bounds",
			category: "layer",
			readOnly: true,
			description: "Measure a layer's rendered bounds via sourceRectAtTime — essential for aligning/fitting text and shape layers. Returns layer-space rect and, when the host supports it, comp-space corners.",
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
					name: "time",
					type: "number",
					description: "Time in seconds (default: current comp time)",
					required: false
				},
				{
					name: "includeExtents",
					type: "boolean",
					description: "Include pixel extents beyond the layer edges (default false)",
					required: false,
					default: false
				}
			],
			toJsx(args) {
				return `
            ${COMP_CORNERS_FN}
            ${jsxCompLayerPreamble(args)}
            if (typeof _layer.sourceRectAtTime !== "function") return { ok: false, error: "layer has no sourceRectAtTime (camera/light?)" };
            var _t = ${jsxVal(args.time ?? null)};
            if (_t === null) _t = _comp.time;
            var _r = _layer.sourceRectAtTime(_t, ${jsxVal(args.includeExtents ?? false)});
            var _out = { ok: true, time: _t, layerSpace: { top: _r.top, left: _r.left, width: _r.width, height: _r.height } };
            // Comp-space corners via sourcePointToComp (AE 13.2+; meaningful for
            // text layers \u2014 reflects the first character at the current comp
            // time). The function evaluates at the current time, so nudge and restore.
            try {
                if (typeof _layer.sourcePointToComp === "function") {
                    var _prevT = _comp.time;
                    // finally, not a trailing assignment: sourcePointToComp is
                    // documented for text layers and can throw on others, and
                    // this op is readOnly \u2014 leaving the playhead moved would be
                    // a visible edit made by a read-only call.
                    try {
                        _comp.time = _t;
                        _out.compSpace = _compCorners(_layer, _r);
                    } finally {
                        _comp.time = _prevT;
                    }
                }
            } catch (eSp) {}
            return _out;
        `;
			}
		});
		registerOp({
			name: "layer.convert_point",
			category: "layer",
			readOnly: true,
			description: "Convert a point between layer source space and comp space (sourcePointToComp / compPointToSource, AE 13.2+; designed for text layers — evaluates at the first character at the given time).",
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
					name: "direction",
					type: "string",
					description: "sourceToComp|compToSource",
					required: true
				},
				{
					name: "point",
					type: "array",
					description: "[x, y] point to convert",
					required: true
				},
				{
					name: "time",
					type: "number",
					description: "Evaluate at this time (default: current comp time)",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _toComp = ${jsxVal(args.direction)} === "sourceToComp";
            var _fn = _toComp ? _layer.sourcePointToComp : _layer.compPointToSource;
            if (typeof _fn !== "function") return { ok: false, error: "point conversion unavailable on this layer (text layers, AE 13.2+)" };
            var _t = ${jsxVal(args.time ?? null)};
            var _prevT = _comp.time;
            if (_t !== null) _comp.time = _t;
            var _res;
            try {
                _res = _toComp ? _layer.sourcePointToComp(${jsxVal(args.point)}) : _layer.compPointToSource(${jsxVal(args.point)});
            } catch (eCv) {
                _comp.time = _prevT;
                return { ok: false, error: "conversion failed: " + AE.errText(eCv) };
            }
            if (_t !== null) _comp.time = _prevT;
            return { ok: true, point: AE.valueToJson(_res) };
        `;
			}
		});
		registerOp({
			name: "layer.apply_preset",
			category: "layer",
			description: "Apply an animation preset (.ffx file) to a layer — applies effects/keyframes in one call.",
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
					name: "path",
					type: "string",
					description: "Absolute path to the .ffx preset",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _f = new File(${jsxVal(args.path)});
            if (!_f.exists) return { ok: false, error: "preset file not found: " + ${jsxVal(args.path)} };
            // applyPreset can target the comp's selected layers (e.g. presets that
            // create layers), so pin the selection to the target layer first \u2014
            // then put the user's selection back. "selected" is a real
            // addressing mode elsewhere in this registry and is reported in the
            // ambient context, so leaving it rewritten would silently retarget
            // later operations in the same batch. Layer references, not
            // indices: a preset may insert layers and shift every index.
            var _prevSel = [];
            for (var _si = 1; _si <= _comp.numLayers; _si++) {
                var _sl = _comp.layer(_si);
                if (_sl.selected) _prevSel.push(_sl);
                _sl.selected = false;
            }
            _layer.selected = true;
            try {
                _layer.applyPreset(_f);
            } finally {
                for (var _di = 1; _di <= _comp.numLayers; _di++) {
                    try { _comp.layer(_di).selected = false; } catch (eDs) {}
                }
                for (var _ri = 0; _ri < _prevSel.length; _ri++) {
                    try { _prevSel[_ri].selected = true; } catch (eRs) {}
                }
            }
            var _fx = 0;
            try { _fx = _layer.property("Effects").numProperties; } catch (eFx) {}
            return { ok: true, applied: _f.displayName, numEffects: _fx };
        `;
			}
		});
		registerOp({
			name: "layer.replace_source",
			category: "layer",
			description: "Replace a layer's source with another project item (footage or comp), keeping keyframes/effects. Set fixExpressions=false to skip expression rewriting.",
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
					name: "item",
					type: "any",
					description: "New source: project item id (number) or name (string)",
					required: true
				},
				{
					name: "fixExpressions",
					type: "boolean",
					description: "Rewrite expressions that reference the old source (default true)",
					required: false,
					default: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            if (!(_layer instanceof AVLayer)) return { ok: false, error: "layer has no source (not an AVLayer)" };
            var _item = AE.findItem(${jsxVal(args.item)});
            if (!_item) return { ok: false, error: "no project item matching " + ${jsxVal(String(args.item))} };
            if (_item instanceof FolderItem) return { ok: false, error: "item is a folder, not footage/comp" };
            _layer.replaceSource(_item, ${jsxVal(args.fixExpressions !== false)});
            return { ok: true, layer: _layer.name, source: _item.name };
        `;
			}
		});
		registerOp({
			name: "layer.set_track_matte",
			category: "layer",
			description: "Set (or remove) a track matte on a layer. Uses AVLayer.setTrackMatte (AE 23.0+): the matte can be ANY layer in the comp — it does not need to sit directly above the target.",
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
					description: "1-based index (or name) of the layer to apply matte TO",
					required: true
				},
				{
					name: "matteLayer",
					type: "any",
					description: "Matte source layer: 1-based index or name. Ignored when matteType is 'none'.",
					required: false
				},
				{
					name: "matteType",
					type: "string",
					description: "alpha|alphaInverted|luma|lumaInverted|none",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _matteMap = {
                "alpha": TrackMatteType.ALPHA,
                "alphaInverted": TrackMatteType.ALPHA_INVERTED,
                "luma": TrackMatteType.LUMA,
                "lumaInverted": TrackMatteType.LUMA_INVERTED,
                "none": TrackMatteType.NO_TRACK_MATTE
            };
            var _type = _matteMap[${jsxVal(args.matteType)}];
            if (!_type && ${jsxVal(args.matteType)} !== "none") return { ok: false, error: "unknown matteType" };
            if (${jsxVal(args.matteType)} === "none") {
                _layer.removeTrackMatte();
                return { ok: true, layer: _layer.name, matte: null };
            }
            var _matteArg = ${jsxVal(args.matteLayer ?? null)};
            if (_matteArg === null) return { ok: false, error: "matteLayer is required when matteType is not 'none'" };
            var _matte = AE.findLayerInComp(_comp, _matteArg);
            if (!_matte) return { ok: false, error: "no matte layer matching " + String(_matteArg) };
            if (_matte === _layer) return { ok: false, error: "a layer cannot be its own track matte" };
            _layer.setTrackMatte(_matte, _type);
            return { ok: true, layer: _layer.name, matte: _matte.name };
        `;
			}
		});
		registerOp({
			name: "layer.set_blend_mode",
			category: "layer",
			description: "Set blending mode on a layer.",
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
					name: "mode",
					type: "string",
					description: "normal|add|multiply|screen|overlay|softLight|hardLight|difference|exclusion|colorDodge|colorBurn|darken|lighten|stencilAlpha|stencilLuma|silhouetteAlpha|silhouetteLuma",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _modeMap = {
                "normal": BlendingMode.NORMAL, "add": BlendingMode.ADD,
                "multiply": BlendingMode.MULTIPLY, "screen": BlendingMode.SCREEN,
                "overlay": BlendingMode.OVERLAY, "softLight": BlendingMode.SOFT_LIGHT,
                "hardLight": BlendingMode.HARD_LIGHT, "difference": BlendingMode.DIFFERENCE,
                "exclusion": BlendingMode.EXCLUSION, "colorDodge": BlendingMode.COLOR_DODGE,
                "colorBurn": BlendingMode.COLOR_BURN, "darken": BlendingMode.DARKEN,
                "lighten": BlendingMode.LIGHTEN, "stencilAlpha": BlendingMode.STENCIL_ALPHA,
                "stencilLuma": BlendingMode.STENCIL_LUMA,
                "silhouetteAlpha": BlendingMode.SILHOUETTE_ALPHA,
                "silhouetteLuma": BlendingMode.SILHOUETTE_LUMA
            };
            var _mode = _modeMap[${jsxVal(args.mode)}];
            if (!_mode) return { ok: false, error: "unknown blend mode: " + ${jsxVal(args.mode)} };
            _layer.blendingMode = _mode;
            return { ok: true, layer: _layer.name, mode: ${jsxVal(args.mode)} };
        `;
			}
		});
		registerOp({
			name: "layer.split",
			category: "layer",
			description: "Split a layer at a given time. Creates a new layer that starts at the split time.",
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
					name: "time",
					type: "number",
					description: "Time in seconds to split at",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _t = ${jsxVal(args.time)};
            if (typeof _t !== "number") return { ok: false, error: "time must be a number" };
            if (_t <= _layer.inPoint || _t >= _layer.outPoint) {
                return { ok: false, error: "split time " + _t + " is outside the layer's span (" + _layer.inPoint + ", " + _layer.outPoint + ")" };
            }
            var _dup = _layer.duplicate();
            _layer.outPoint = _t;
            _dup.inPoint = _t;
            return { ok: true, originalIndex: _layer.index, newIndex: _dup.index, splitTime: _t };
        `;
			}
		});
		registerOp({
			name: "layer.copy_to_comp",
			category: "layer",
			description: "Copy a layer into another comp. The copy is identified by its Layer.id (never by assuming it landed on top). Options: timeOffset/startTime to place it in time, bakeAtTime to freeze every animated property at that source time and drop the keys (match-cut copies), name to rename. The copy keeps the source comp's span — use layer.set_timing outPoint:'comp' to extend it.",
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
					description: "1-based layer index, name, or { id } in the source comp",
					required: true
				},
				{
					name: "targetComp",
					type: "any",
					description: "Target comp name or id",
					required: true
				},
				{
					name: "timeOffset",
					type: "number",
					description: "Seconds added to the copy's startTime",
					required: false
				},
				{
					name: "startTime",
					type: "number",
					description: "Absolute startTime for the copy (applied after timeOffset)",
					required: false
				},
				{
					name: "bakeAtTime",
					type: "number",
					description: "Freeze every keyframed property of the copy at this SOURCE-comp time and remove its keys",
					required: false
				},
				{
					name: "name",
					type: "string",
					description: "Rename the copy",
					required: false
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            var _target = AE.findCompByNameOrId(${jsxVal(args.targetComp)});
            if (!_target) return { ok: false, error: "target comp not found" };
            var _snap = AE.layerIdSnapshot(_target);
            _layer.copyToComp(_target);
            var _added = AE.layersSince(_target, _snap);
            if (_added.length !== 1) {
                return { ok: false, error: "copyToComp added " + _added.length + " layers to " + _target.name + " (expected 1)" };
            }
            var _newLayer = _added[0];
            var _baked = 0;
            var _bakeT = ${jsxVal(args.bakeAtTime ?? null)};
            if (_bakeT !== null) _baked = AE.bakeKeysAtTime(_newLayer, _bakeT);
            var _off = ${jsxVal(args.timeOffset ?? null)};
            if (_off !== null) _newLayer.startTime = _newLayer.startTime + _off;
            var _start = ${jsxVal(args.startTime ?? null)};
            if (_start !== null) _newLayer.startTime = _start;
            ${args.name ? `_newLayer.name = ${jsxVal(args.name)};` : ""}
            return { ok: true, copied: _layer.name, targetComp: _target.name, newIndex: _newLayer.index, newName: _newLayer.name, newId: AE.safeGet(function () { return _newLayer.id; }, null), startTime: _newLayer.startTime, inPoint: _newLayer.inPoint, outPoint: _newLayer.outPoint, bakedProperties: _baked };
        `;
			}
		});
		registerOp({
			name: "layer.calculate_transform",
			category: "layer",
			readOnly: true,
			description: "Calculate the transform that maps a 3D layer onto three corner points (AVLayer.calculateTransformFromPoints) - corner-pin style placement in 3D space. Calculation-only: returns anchorPoint/position/x-y-zRotation/scale without touching the layer — apply them with property.set / layer.set_props.",
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
					description: "1-based layer index, or the layer name (3D layer)",
					required: true
				},
				{
					name: "topLeft",
					type: "array",
					description: "[x,y,z] world point for the layer's top-left",
					required: true
				},
				{
					name: "topRight",
					type: "array",
					description: "[x,y,z] world point for the top-right",
					required: true
				},
				{
					name: "bottomLeft",
					type: "array",
					description: "[x,y,z] world point for the bottom-left. The scripting guide names this pointBottomRight, but the implementation expects the bottom-left (the guide's own example passes bl): a true bottom-right returns the same placement with zScale skewed by sin(corner angle) — verified on AE 26.3.",
					required: true
				}
			],
			toJsx(args) {
				return `
            ${jsxCompLayerPreamble(args)}
            if (typeof _layer.calculateTransformFromPoints !== "function") return { ok: false, error: "calculateTransformFromPoints is not available on this layer" };
            if (!_layer.threeDLayer) return { ok: false, error: "layer must be 3D (threeDLayer: true) for calculateTransformFromPoints" };
            var _xf = null;
            try { _xf = _layer.calculateTransformFromPoints(${jsxVal(args.topLeft)}, ${jsxVal(args.topRight)}, ${jsxVal(args.bottomLeft)}); } catch (eCt) { return { ok: false, error: "calculateTransformFromPoints failed: " + AE.errText(eCt) }; }
            return { ok: true, transform: AE.valueToJson(_xf) };
        `;
			}
		});
	})))();
}

// operations/pref.js
function jsxPrefTypePreamble(args) {
	return `
        var _ptArg = ${jsxVal(args.prefType ?? null)};
        var _pt = null;
        if (_ptArg !== null) {
            var _ptMap = {};
            try {
                _ptMap.machineSpecific = PREFType.PREF_Type_MACHINE_SPECIFIC;
                _ptMap.machineIndependent = PREFType.PREF_Type_MACHINE_INDEPENDENT;
                _ptMap.machineIndependentRender = PREFType.PREF_Type_MACHINE_INDEPENDENT_RENDER;
                _ptMap.machineIndependentOutput = PREFType.PREF_Type_MACHINE_INDEPENDENT_OUTPUT;
                _ptMap.machineIndependentComposition = PREFType.PREF_Type_MACHINE_INDEPENDENT_COMPOSITION;
                _ptMap.machineSpecificText = PREFType.PREF_Type_MACHINE_SPECIFIC_TEXT;
                _ptMap.machineSpecificPaint = PREFType.PREF_Type_MACHINE_SPECIFIC_PAINT;
            } catch (ePt) {}
            if (!_ptMap.hasOwnProperty(_ptArg)) return { ok: false, error: "unknown prefType '" + _ptArg + "'" };
            _pt = _ptMap[_ptArg];
        }
    `;
}
var PREF_TYPE_PARAM;
function init_pref() {
	return (init_pref = __esmMin((() => {
		init_registry();
		PREF_TYPE_PARAM = {
			name: "prefType",
			type: "string",
			description: "Preferences file: machineSpecific (default) | machineIndependent | machineIndependentRender | machineIndependentOutput | machineIndependentComposition | machineSpecificText | machineSpecificPaint",
			required: false
		};
		registerOp({
			name: "pref.get",
			category: "pref",
			readOnly: true,
			description: "Read one After Effects preference (app.preferences.getPrefAs*). Section/key names match the prefs file, e.g. section \"Main Pref Section v2\", key \"Pref_SCOPES_ENABLE_DYNAMIC_PEAK\". Returns exists=false instead of failing when the pref is absent.",
			params: [
				{
					name: "section",
					type: "string",
					description: "Preference section name",
					required: true
				},
				{
					name: "key",
					type: "string",
					description: "Preference key name",
					required: true
				},
				{
					name: "type",
					type: "string",
					description: "string|bool|float|long (default string)",
					required: false,
					default: "string"
				},
				PREF_TYPE_PARAM
			],
			toJsx(args) {
				return `
            ${jsxPrefTypePreamble(args)}
            var _sec = ${jsxVal(args.section)};
            var _key = ${jsxVal(args.key)};
            var _has = false;
            try { _has = _pt === null ? app.preferences.havePref(_sec, _key) : app.preferences.havePref(_sec, _key, _pt); } catch (eH) { return { ok: false, error: "havePref failed: " + AE.errText(eH) }; }
            if (!_has) return { ok: true, exists: false, value: null };
            var _type = ${jsxVal(args.type ?? "string")};
            var _val = null;
            try {
                if (_type === "bool") _val = _pt === null ? app.preferences.getPrefAsBool(_sec, _key) : app.preferences.getPrefAsBool(_sec, _key, _pt);
                else if (_type === "float") _val = _pt === null ? app.preferences.getPrefAsFloat(_sec, _key) : app.preferences.getPrefAsFloat(_sec, _key, _pt);
                else if (_type === "long") _val = _pt === null ? app.preferences.getPrefAsLong(_sec, _key) : app.preferences.getPrefAsLong(_sec, _key, _pt);
                else if (_type === "string") _val = _pt === null ? app.preferences.getPrefAsString(_sec, _key) : app.preferences.getPrefAsString(_sec, _key, _pt);
                else return { ok: false, error: "type must be string|bool|float|long" };
            } catch (eG) { return { ok: false, error: "getPrefAs failed: " + AE.errText(eG) }; }
            return { ok: true, exists: true, value: _val };
        `;
			}
		});
		registerOp({
			name: "pref.set",
			category: "pref",
			appConfig: true,
			description: "Write one After Effects preference (app.preferences.savePrefAs*) and flush to disk. A wrong value can misconfigure AE until preferences are reset — read the current value with pref.get first.",
			params: [
				{
					name: "section",
					type: "string",
					description: "Preference section name",
					required: true
				},
				{
					name: "key",
					type: "string",
					description: "Preference key name",
					required: true
				},
				{
					name: "value",
					type: "any",
					description: "Value to write (matching `type`)",
					required: true
				},
				{
					name: "type",
					type: "string",
					description: "string|bool|float|long (default: inferred from the value)",
					required: false
				},
				PREF_TYPE_PARAM,
				{
					name: "persist",
					type: "boolean",
					description: "Flush prefs to disk immediately (default true)",
					required: false,
					default: true
				}
			],
			toJsx(args) {
				const persistJsx = args.persist === false ? "" : `try { app.preferences.saveToDisk(); } catch (eD) {}`;
				return `
            ${jsxPrefTypePreamble(args)}
            var _sec = ${jsxVal(args.section)};
            var _key = ${jsxVal(args.key)};
            var _val = ${jsxVal(args.value)};
            var _type = ${jsxVal(args.type ?? null)};
            if (_type === null) {
                if (typeof _val === "boolean") _type = "bool";
                else if (typeof _val === "number") _type = (_val === Math.floor(_val)) ? "long" : "float";
                else _type = "string";
            }
            try {
                if (_type === "bool") { if (_pt === null) app.preferences.savePrefAsBool(_sec, _key, _val); else app.preferences.savePrefAsBool(_sec, _key, _val, _pt); }
                else if (_type === "float") { if (_pt === null) app.preferences.savePrefAsFloat(_sec, _key, _val); else app.preferences.savePrefAsFloat(_sec, _key, _val, _pt); }
                else if (_type === "long") { if (_pt === null) app.preferences.savePrefAsLong(_sec, _key, _val); else app.preferences.savePrefAsLong(_sec, _key, _val, _pt); }
                else if (_type === "string") { if (_pt === null) app.preferences.savePrefAsString(_sec, _key, String(_val)); else app.preferences.savePrefAsString(_sec, _key, String(_val), _pt); }
                else return { ok: false, error: "type must be string|bool|float|long" };
            } catch (eS) { return { ok: false, error: "savePrefAs failed: " + AE.errText(eS) }; }
            ${persistJsx}
            return { ok: true, section: _sec, key: _key, type: _type };
        `;
			}
		});
		registerOp({
			name: "pref.delete",
			category: "pref",
			appConfig: true,
			description: "Delete one After Effects preference (app.preferences.deletePref).",
			params: [
				{
					name: "section",
					type: "string",
					description: "Preference section name",
					required: true
				},
				{
					name: "key",
					type: "string",
					description: "Preference key name",
					required: true
				},
				PREF_TYPE_PARAM
			],
			toJsx(args) {
				return `
            ${jsxPrefTypePreamble(args)}
            var _sec = ${jsxVal(args.section)};
            var _key = ${jsxVal(args.key)};
            var _has = false;
            try { _has = _pt === null ? app.preferences.havePref(_sec, _key) : app.preferences.havePref(_sec, _key, _pt); } catch (eH) { return { ok: false, error: "havePref failed: " + AE.errText(eH) }; }
            if (!_has) return { ok: true, deleted: false, existed: false };
            try { if (_pt === null) app.preferences.deletePref(_sec, _key); else app.preferences.deletePref(_sec, _key, _pt); } catch (eDel) { return { ok: false, error: "deletePref failed: " + AE.errText(eDel) }; }
            try { app.preferences.saveToDisk(); } catch (eD) {}
            return { ok: true, deleted: true, existed: true };
        `;
			}
		});
		registerOp({
			name: "pref.get_setting",
			category: "pref",
			readOnly: true,
			description: "Read a script-scoped setting (app.settings.getSetting) — the persistent key/value store AE offers to scripts, separate from application preferences.",
			params: [{
				name: "section",
				type: "string",
				description: "Settings section name",
				required: true
			}, {
				name: "key",
				type: "string",
				description: "Settings key name",
				required: true
			}],
			toJsx(args) {
				return `
            var _sec = ${jsxVal(args.section)};
            var _key = ${jsxVal(args.key)};
            var _has = false;
            try { _has = app.settings.haveSetting(_sec, _key); } catch (eH) { return { ok: false, error: "haveSetting failed: " + AE.errText(eH) }; }
            if (!_has) return { ok: true, exists: false, value: null };
            var _val = null;
            try { _val = app.settings.getSetting(_sec, _key); } catch (eG) { return { ok: false, error: "getSetting failed: " + AE.errText(eG) }; }
            return { ok: true, exists: true, value: _val };
        `;
			}
		});
		registerOp({
			name: "pref.set_setting",
			category: "pref",
			appConfig: true,
			description: "Write a script-scoped setting (app.settings.saveSetting). Values are stored as strings.",
			params: [
				{
					name: "section",
					type: "string",
					description: "Settings section name",
					required: true
				},
				{
					name: "key",
					type: "string",
					description: "Settings key name",
					required: true
				},
				{
					name: "value",
					type: "string",
					description: "Value to store",
					required: true
				}
			],
			toJsx(args) {
				return `
            try { app.settings.saveSetting(${jsxVal(args.section)}, ${jsxVal(args.key)}, ${jsxVal(args.value)}); } catch (eS) { return { ok: false, error: "saveSetting failed: " + AE.errText(eS) }; }
            return { ok: true };
        `;
			}
		});
	})))();
}

// operations/layout.js
var LAYER_TARGET_PARAM;
function init_layout() {
	return (init_layout = __esmMin((() => {
		init_registry();
		LAYER_TARGET_PARAM = {
			name: "layer",
			type: "any",
			description: "Layer index, name, { id }, 'selected', 'all', or an array of those",
			required: true
		};
		registerOp({
			name: "layer.set_anchor",
			category: "layer",
			description: "Move the anchor point WITHOUT moving the layer on screen (Position is compensated through Scale/Rotation; Position keyframes are all shifted). Address the anchor by preset on the layer's rendered bounds (sourceRectAtTime), by an explicit layer-space point, or by an offset from the current anchor.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				LAYER_TARGET_PARAM,
				{
					name: "preset",
					type: "string",
					description: "center | topLeft | topCenter | topRight | centerLeft | centerRight | bottomLeft | bottomCenter | bottomRight",
					required: false
				},
				{
					name: "point",
					type: "array",
					description: "[x, y] (or [x, y, z]) explicit anchor in layer space",
					required: false
				},
				{
					name: "offset",
					type: "array",
					description: "[dx, dy] added to the current anchor",
					required: false
				},
				{
					name: "time",
					type: "number",
					description: "Time at which the bounds are measured for a preset (default: current comp time)",
					required: false
				}
			],
			toJsx(args) {
				if ([
					args.preset,
					args.point,
					args.offset
				].filter((v) => v !== void 0).length !== 1) return jsxFail("give exactly one of preset, point, or offset");
				return `
            ${jsxCompPreamble(args)}
            var _layers = AE.resolveLayers(_comp, ${jsxVal(args.layer)});
            if (_layers.length === 0) return { ok: false, error: "no layers matched" };
            var _preset = ${jsxVal(args.preset ?? null)};
            if (_preset !== null && !AE.ANCHOR_PRESETS.hasOwnProperty(_preset)) return { ok: false, error: "unknown preset '" + _preset + "'" };
            var _point = ${jsxVal(args.point ?? null)};
            var _offset = ${jsxVal(args.offset ?? null)};
            var _t = ${jsxVal(args.time ?? null)};
            if (_t === null) _t = _comp.time;
            var _out = [];
            var _failed = 0;
            for (var _li = 0; _li < _layers.length; _li++) {
                var _l = _layers[_li];
                var _target = null;
                try {
                    if (_preset !== null) {
                        var _rect = AE.layerRect(_l, _t);
                        if (!_rect) throw new Error("layer has no measurable bounds");
                        _target = AE.pointInRect(_rect, _preset);
                    } else if (_point !== null) {
                        _target = _point;
                    } else {
                        var _cur = _l.transform.anchorPoint.value;
                        _target = [_cur[0] + (_offset[0] || 0), _cur[1] + (_offset[1] || 0)];
                        if (_cur.length > 2) _target.push(_cur[2] + (_offset[2] || 0));
                    }
                    var _r = AE.moveAnchor(_l, _target);
                    _out.push({ index: _l.index, name: _l.name, ok: true, anchorPoint: _r.anchorPoint, positionDelta: _r.positionDelta, positionKeysShifted: _r.positionKeysShifted, warnings: _r.warnings });
                } catch (eA) {
                    _failed++;
                    _out.push({ index: _l.index, name: _l.name, ok: false, error: AE.errText(eA) });
                }
            }
            return { ok: _failed === 0, error: _failed === 0 ? null : (_failed + " of " + _out.length + " layers failed"), count: _out.length, layers: _out };
        `;
			}
		});
		registerOp({
			name: "layer.set_timing",
			category: "layer",
			description: "Set a layer's timing in one call: shift (relative move of the whole layer), startTime, inPoint, outPoint ('comp' = comp start / comp end — e.g. to extend a layer copied out of a shorter comp), stretch. Applied in that order; AE clamps in/out to the source for footage.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				LAYER_TARGET_PARAM,
				{
					name: "shift",
					type: "number",
					description: "Seconds to move the layer by (in/out points follow)",
					required: false
				},
				{
					name: "startTime",
					type: "number",
					description: "Absolute layer start",
					required: false
				},
				{
					name: "inPoint",
					type: "any",
					description: "In point in seconds, or 'comp' for the comp start (0)",
					required: false
				},
				{
					name: "outPoint",
					type: "any",
					description: "Out point in seconds, or 'comp' for the comp end (comp.duration)",
					required: false
				},
				{
					name: "stretch",
					type: "number",
					description: "Time stretch in percent",
					required: false
				}
			],
			toJsx(args) {
				const sets = [];
				if (args.shift !== void 0) sets.push(`_l.startTime = _l.startTime + ${jsxVal(args.shift)};`);
				if (args.startTime !== void 0) sets.push(`_l.startTime = ${jsxVal(args.startTime)};`);
				if (args.inPoint !== void 0) sets.push(`_l.inPoint = (${jsxVal(args.inPoint)} === "comp") ? 0 : ${jsxVal(args.inPoint)};`);
				if (args.outPoint !== void 0) sets.push(`_l.outPoint = (${jsxVal(args.outPoint)} === "comp") ? _comp.duration : ${jsxVal(args.outPoint)};`);
				if (args.stretch !== void 0) sets.push(`_l.stretch = ${jsxVal(args.stretch)};`);
				if (sets.length === 0) return jsxFail("give at least one of shift, startTime, inPoint, outPoint, stretch");
				const inBad = typeof args.inPoint === "string" && args.inPoint !== "comp";
				const outBad = typeof args.outPoint === "string" && args.outPoint !== "comp";
				if (inBad || outBad) return jsxFail("inPoint/outPoint must be a number or 'comp'");
				return `
            ${jsxCompPreamble(args)}
            var _layers = AE.resolveLayers(_comp, ${jsxVal(args.layer)});
            if (_layers.length === 0) return { ok: false, error: "no layers matched" };
            var _out = [];
            var _failed = 0;
            for (var _li = 0; _li < _layers.length; _li++) {
                var _l = _layers[_li];
                try {
                    ${sets.join("\n                    ")}
                    _out.push({ index: _l.index, name: _l.name, ok: true, startTime: _l.startTime, inPoint: _l.inPoint, outPoint: _l.outPoint, stretch: _l.stretch });
                } catch (eT) {
                    _failed++;
                    _out.push({ index: _l.index, name: _l.name, ok: false, error: AE.errText(eT) });
                }
            }
            return { ok: _failed === 0, error: _failed === 0 ? null : (_failed + " of " + _out.length + " layers failed"), count: _out.length, layers: _out };
        `;
			}
		});
		registerOp({
			name: "layer.set_visibility_schedule",
			category: "layer",
			description: "Show layers only during given time ranges — sequential pops, material swaps, flip-books — in one call. mode 'opacity' (default) writes HOLD opacity keys (on inside each range, off outside; existing opacity keys replaced); mode 'inOut' sets in/out points (one range per layer).",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "entries",
					type: "array",
					description: "[{ layer, ranges: [[start, end], …] }] — layer accepts the usual index | name | { id } | 'selected' | 'all' | array",
					required: true
				},
				{
					name: "mode",
					type: "string",
					description: "opacity|inOut (default opacity)",
					required: false,
					default: "opacity"
				},
				{
					name: "onValue",
					type: "number",
					description: "Opacity inside the ranges (default 100)",
					required: false,
					default: 100
				},
				{
					name: "offValue",
					type: "number",
					description: "Opacity outside the ranges (default 0)",
					required: false,
					default: 0
				}
			],
			toJsx(args) {
				const mode = args.mode ?? "opacity";
				if (mode !== "opacity" && mode !== "inOut") return jsxFail("mode must be opacity|inOut");
				const entries = Array.isArray(args.entries) ? args.entries : [];
				for (const [i, entry] of entries.entries()) {
					const e = entry;
					if (!e || typeof e !== "object" || e.layer === void 0 || !Array.isArray(e.ranges)) return jsxFail(`entries[${i}] must be { layer, ranges: [[start, end], \u2026] }`);
					for (const [j, range] of e.ranges.entries()) if (!Array.isArray(range) || range.length !== 2 || typeof range[0] !== "number" || typeof range[1] !== "number" || !(range[1] > range[0])) return jsxFail(`entries[${i}].ranges[${j}] must be [start, end] with end > start`);
					if (mode === "inOut" && e.ranges.length !== 1) return jsxFail(`entries[${i}]: mode 'inOut' takes exactly one range per entry`);
				}
				return `
            ${jsxCompPreamble(args)}
            var _entries = ${jsxVal(entries)};
            var _mode = ${jsxVal(mode)};
            var _on = ${jsxVal(args.onValue ?? 100)};
            var _off = ${jsxVal(args.offValue ?? 0)};
            var _out = [];
            var _failed = 0;
            for (var _ei = 0; _ei < _entries.length; _ei++) {
                var _e = _entries[_ei];
                var _layers = AE.resolveLayers(_comp, _e.layer);
                if (_layers.length === 0) { _failed++; _out.push({ entry: _ei, ok: false, error: "no layers matched " + String(_e.layer) }); continue; }
                var _ranges = _e.ranges.slice(0);
                _ranges.sort(function (a, b) { return a[0] - b[0]; });
                for (var _li = 0; _li < _layers.length; _li++) {
                    var _l = _layers[_li];
                    try {
                        if (_mode === "inOut") {
                            _l.inPoint = _ranges[0][0];
                            _l.outPoint = _ranges[0][1];
                            _out.push({ entry: _ei, index: _l.index, name: _l.name, ok: true, inPoint: _l.inPoint, outPoint: _l.outPoint });
                        } else {
                            var _op = _l.transform.opacity;
                            var _specs = [];
                            if (_ranges[0][0] > 0) _specs.push({ time: 0, value: _off, interp: "hold" });
                            for (var _ri = 0; _ri < _ranges.length; _ri++) {
                                _specs.push({ time: _ranges[_ri][0], value: _on, interp: "hold" });
                                _specs.push({ time: _ranges[_ri][1], value: _off, interp: "hold" });
                            }
                            var _r = AE.applyKeySpecs(_op, _specs, { replace: true });
                            _out.push({ entry: _ei, index: _l.index, name: _l.name, ok: true, numKeys: _r.numKeys, warnings: _r.warnings });
                        }
                    } catch (eS) {
                        _failed++;
                        _out.push({ entry: _ei, index: _l.index, name: _l.name, ok: false, error: AE.errText(eS) });
                    }
                }
            }
            return { ok: _failed === 0, error: _failed === 0 ? null : (_failed + " entries failed"), count: _out.length, layers: _out };
        `;
			}
		});
		registerOp({
			name: "comp.set_layer_order",
			category: "comp",
			description: "Arrange layers by listing them top to bottom. The listed layers occupy startIndex.. in that order; unlisted layers keep their relative order below (or above) them.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name or id",
					required: true
				},
				{
					name: "layers",
					type: "array",
					description: "Layer references (index | name | { id }), top first",
					required: true
				},
				{
					name: "startIndex",
					type: "number",
					description: "1-based index the first listed layer lands on (default 1 = top)",
					required: false,
					default: 1
				}
			],
			toJsx(args) {
				return `
            ${jsxCompPreamble(args)}
            var _refs = ${jsxVal(args.layers)};
            var _start = ${jsxVal(args.startIndex ?? 1)};
            var _targets = [];
            var _seen = {};
            for (var _ri = 0; _ri < _refs.length; _ri++) {
                var _l = AE.findLayerInComp(_comp, _refs[_ri]);
                if (!_l) return { ok: false, error: "no layer matching " + String(_refs[_ri]) };
                var _key = "k" + _l.index;
                if (_seen.hasOwnProperty(_key)) return { ok: false, error: "layer '" + _l.name + "' listed twice" };
                _seen[_key] = true;
                _targets.push(_l);
            }
            if (_start < 1 || _start + _targets.length - 1 > _comp.numLayers) return { ok: false, error: "startIndex " + _start + " leaves no room for " + _targets.length + " layers (comp has " + _comp.numLayers + ")" };
            for (var _ti = 0; _ti < _targets.length; _ti++) AE.moveLayerToIndex(_targets[_ti], _start + _ti);
            var _order = [];
            for (var _oi = 1; _oi <= _comp.numLayers; _oi++) _order.push(_comp.layer(_oi).name);
            return { ok: true, moved: _targets.length, order: _order };
        `;
			}
		});
		registerOp({
			name: "comp.resize",
			category: "comp",
			description: "Change a comp's size and keep its content where it was: every unparented layer's Position (keyframes included, separated dimensions handled) is offset so the content stays pinned to `anchor` — 'center' keeps it centred, 'topLeft' keeps the top-left corner, etc. Children follow their parents. Comp accepts a name, id, pattern, or array.",
			params: [
				{
					name: "comp",
					type: "any",
					description: "Comp name/id, pattern ('shot_*'), or array of those",
					required: true
				},
				{
					name: "width",
					type: "number",
					description: "New width in px",
					required: false
				},
				{
					name: "height",
					type: "number",
					description: "New height in px",
					required: false
				},
				{
					name: "anchor",
					type: "string",
					description: "Where the existing content stays pinned: center | topLeft | topCenter | topRight | centerLeft | centerRight | bottomLeft | bottomCenter | bottomRight (default center)",
					required: false,
					default: "center"
				},
				{
					name: "offset",
					type: "array",
					description: "[dx, dy] explicit offset applied to every unparented layer instead of `anchor`",
					required: false
				}
			],
			toJsx(args) {
				if (args.width === void 0 && args.height === void 0) return jsxFail("give width and/or height");
				return `
            var _comps = AE.findComps(${jsxVal(args.comp)});
            if (_comps.length === 0) return { ok: false, error: "no comps matched" };
            var _anchor = ${jsxVal(args.anchor ?? "center")};
            if (!AE.ANCHOR_PRESETS.hasOwnProperty(_anchor)) return { ok: false, error: "unknown anchor '" + _anchor + "'" };
            var _explicit = ${jsxVal(args.offset ?? null)};
            var _out = [];
            for (var _ci = 0; _ci < _comps.length; _ci++) {
                var _c = _comps[_ci];
                var _oldW = _c.width, _oldH = _c.height;
                var _newW = ${jsxVal(args.width ?? null)};
                var _newH = ${jsxVal(args.height ?? null)};
                if (_newW === null) _newW = _oldW;
                if (_newH === null) _newH = _oldH;
                var _f = AE.ANCHOR_PRESETS[_anchor];
                var _d = _explicit !== null ? [_explicit[0] || 0, _explicit[1] || 0] : [(_newW - _oldW) * _f[0], (_newH - _oldH) * _f[1]];
                _c.width = _newW;
                _c.height = _newH;
                var _moved = 0;
                var _warn = [];
                for (var _li = 1; _li <= _c.numLayers; _li++) {
                    var _l = _c.layer(_li);
                    if (_l.parent) continue;
                    var _pos = null;
                    try { _pos = _l.transform.position; } catch (eP) {}
                    if (!_pos) continue;
                    try { AE.offsetValue(_pos, [_d[0], _d[1]]); _moved++; }
                    catch (eO) { _warn.push(_l.name + ": " + AE.errText(eO)); }
                    if (_l instanceof CameraLayer || _l instanceof LightLayer) {
                        try { var _poi = _l.transform.pointOfInterest; if (_poi) AE.offsetValue(_poi, [_d[0], _d[1]]); } catch (ePoi) {}
                    }
                }
                _out.push({ comp: _c.name, from: [_oldW, _oldH], to: [_c.width, _c.height], offset: _d, layersMoved: _moved, warnings: _warn });
            }
            return { ok: true, comps: _out };
        `;
			}
		});
		registerOp({
			name: "project.rename",
			category: "project",
			description: "Rename project items and/or layers in bulk: an exact `map` ({ from: to }) or a regex `pattern` + `replacement` ($1 works). scope 'items' covers comps, footage and folders; 'layers' covers layers in every comp (or the comps matched by `comp`). dryRun previews without renaming.",
			params: [
				{
					name: "scope",
					type: "string",
					description: "items|layers|all (default all)",
					required: false,
					default: "all"
				},
				{
					name: "map",
					type: "object",
					description: "{ 'old name': 'new name', … }",
					required: false
				},
				{
					name: "pattern",
					type: "string",
					description: "Regular expression (JavaScript syntax) applied to each name",
					required: false
				},
				{
					name: "replacement",
					type: "string",
					description: "Replacement for `pattern` matches ($1… for groups)",
					required: false
				},
				{
					name: "flags",
					type: "string",
					description: "Regex flags: any of g, i, m (default 'g')",
					required: false,
					default: "g"
				},
				{
					name: "comp",
					type: "any",
					description: "Restrict layer renames to these comps (name/id/pattern/array; default all)",
					required: false
				},
				{
					name: "itemTypes",
					type: "array",
					description: "Restrict item renames to these types: CompItem|FootageItem|FolderItem",
					required: false
				},
				{
					name: "dryRun",
					type: "boolean",
					description: "Report what would change without renaming (default false)",
					required: false,
					default: false
				}
			],
			toJsx(args) {
				const scope = args.scope ?? "all";
				if (scope !== "items" && scope !== "layers" && scope !== "all") return jsxFail("scope must be items|layers|all");
				const hasMap = args.map !== void 0;
				const hasPattern = args.pattern !== void 0;
				if (hasMap === hasPattern) return jsxFail("give exactly one of map or pattern (+ replacement)");
				const flags = String(args.flags ?? "g");
				if (hasPattern) {
					if (args.replacement === void 0) return jsxFail("pattern needs a replacement");
					if (!/^[gim]*$/.test(flags)) return jsxFail("flags may only contain g, i, m");
					try {
						RegExp(String(args.pattern), flags);
					} catch (regexErr) {
						const msg = regexErr instanceof Error ? regexErr.message : String(regexErr);
						return jsxFail(`invalid pattern: ${msg}`);
					}
				}
				return `
            var _scope = ${jsxVal(scope)};
            var _map = ${jsxVal(args.map ?? null)};
            var _re = ${hasPattern ? `new RegExp(${jsxVal(args.pattern)}, ${jsxVal(flags)})` : "null"};
            var _repl = ${jsxVal(args.replacement ?? "")};
            var _types = ${jsxVal(args.itemTypes ?? null)};
            var _dry = ${jsxVal(args.dryRun === true)};
            function _next(name) {
                if (_map !== null) return (_map.hasOwnProperty(name) && typeof _map[name] === "string") ? _map[name] : name;
                _re.lastIndex = 0;
                return name.replace(_re, _repl);
            }
            function _typeOk(t) {
                if (_types === null) return true;
                for (var _ti = 0; _ti < _types.length; _ti++) if (_types[_ti] === t) return true;
                return false;
            }
            var _changes = [];
            var _failed = 0;
            if (_scope !== "layers") {
                for (var _ii = 1; _ii <= app.project.numItems; _ii++) {
                    var _it = app.project.item(_ii);
                    var _t = AE.itemTypeName(_it);
                    if (!_typeOk(_t)) continue;
                    var _to = _next(_it.name);
                    if (_to === _it.name) continue;
                    var _ch = { kind: "item", type: _t, id: _it.id, from: _it.name, to: _to };
                    if (!_dry) { try { _it.name = _to; _ch.applied = true; } catch (eI) { _failed++; _ch.applied = false; _ch.error = AE.errText(eI); } }
                    _changes.push(_ch);
                }
            }
            if (_scope !== "items") {
                var _comps = AE.findComps(${args.comp !== void 0 ? jsxVal(args.comp) : "\"*\""});
                for (var _ci = 0; _ci < _comps.length; _ci++) {
                    var _c = _comps[_ci];
                    for (var _li = 1; _li <= _c.numLayers; _li++) {
                        var _l = _c.layer(_li);
                        var _lto = _next(_l.name);
                        if (_lto === _l.name) continue;
                        var _lch = { kind: "layer", comp: _c.name, index: _li, from: _l.name, to: _lto };
                        if (!_dry) { try { _l.name = _lto; _lch.applied = true; } catch (eL) { _failed++; _lch.applied = false; _lch.error = AE.errText(eL); } }
                        _changes.push(_lch);
                    }
                }
            }
            return { ok: _failed === 0, error: _failed === 0 ? null : (_failed + " renames failed"), dryRun: _dry, count: _changes.length, changes: _changes };
        `;
			}
		});
	})))();
}

export { init_layer, init_layer_advanced, init_layout, init_marker, init_mask, init_pref, init_project, init_property };
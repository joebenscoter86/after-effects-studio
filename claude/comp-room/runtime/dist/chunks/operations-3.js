import { __esmMin } from "./rolldown-runtime.js";
import { init_config, init_policy, init_registry, jsxCompLayerPreamble, jsxCompPreamble, jsxFail, jsxPropertyLookup, jsxVal, readOnlyMode, registerOp, rejectedOutputPath } from "./core-1.js";
import { AE_AAC_PRIMING_SAMPLES, FFMPEG, FFPROBE, NODE_ONLY, REDO_COMMAND_ID, alignSound, init_command, init_delivery_sound, init_keying_reference, init_keying_shared, liveFileIO, parseEbur128Summary, parseVolumedetect, readSoundSync, runReferenceReport, runTool } from "./operations-1.js";
import { FEW_PIECES_NOTE, LOOK_RULES, buildSheet, init_look, isPiece, isSheet, sheetMarkdown, standingBase } from "./color-1.js";
import { init_rhythm, measureRhythm } from "./video-1.js";
import { promises } from "node:fs";
import os from "node:os";
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

// operations/look-sheet.js
function typeJsx(comp) {
	return `var c = AE.findCompByNameOrId(${jsxVal(comp)});
if (!c) return { ok: false, error: "no comp " + ${jsxVal(String(comp))} };
var out = [];
for (var i = 1; i <= c.numLayers; i++) {
  var l = c.layer(i);
  if (!(l instanceof TextLayer) || !l.enabled) continue;
  var mid = (Math.max(0, l.inPoint) + Math.min(c.duration, l.outPoint)) / 2;
  var d = l.property("ADBE Text Properties").property("ADBE Text Document").valueAtTime(mid, false);
  var sc = AE.safeGet(function () { return l.property("ADBE Transform Group").property("ADBE Scale").valueAtTime(mid, false); }, [100, 100]);
  out.push({ font: String(d.font), size: d.fontSize * Math.abs(sc[1]) / 100, tracking: d.tracking, fill: d.applyFill ? d.fillColor : null });
}
return { ok: true, height: c.height, layers: out };`;
}
function hexOf(c) {
	return c ? "#" + c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("") : null;
}
async function measurePiece(spec, dir, io, maxFrames, regions) {
	const label = typeof spec.label === "string" && spec.label.trim() ? spec.label.trim() : null;
	if (!label) return { error: "every piece needs a `label` (it names the piece on the sheet's page)" };
	const hasPath = typeof spec.path === "string", hasComp = spec.comp !== void 0;
	if (hasPath === hasComp) return { error: `piece "${label}": give exactly one of \`path\` (a movie, a folder of PNG frames or a still) and \`comp\`` };
	const tmp = await promises.mkdtemp(path$1.join(os.tmpdir(), "look-piece-"));
	try {
		const r = await runReferenceReport({
			...hasPath ? { path: spec.path } : { comp: spec.comp },
			outPath: path$1.join(tmp, "report.json"),
			maxFrames,
			...regions ? { regions } : {},
			...spec.via ? { via: spec.via } : {}
		}, io);
		if (!r.ok) return { error: `piece "${label}": ${r.error}` };
		const report = JSON.parse(await promises.readFile(path$1.join(tmp, "report.json"), "utf8"));
		let rhythm = null, rhythmNote = null;
		if (hasPath && MOVIE_EXT.test(spec.path)) {
			const rh = await measureRhythm(spec.path);
			if ("error" in rh) rhythmNote = rh.error;
			else rhythm = rh;
		}
		let type = null;
		if (hasComp && spec.project === true) {
			const t = await io.execute(typeJsx(spec.comp), {
				label: "reference.sheet type",
				timeoutMs: 6e4,
				undoGroup: false
			});
			if (t?.ok) {
				const ls = t.layers, sizes = ls.map((l) => l.size / t.height).sort((a, b) => a - b), tr = ls.map((l) => l.tracking).sort((a, b) => a - b);
				const mid = (a) => a.length ? a[a.length >> 1] : null;
				type = {
					layers: ls.length,
					fonts: [...new Set(ls.map((l) => String(l.font)))],
					sizeMedian: mid(sizes),
					sizeLargest: sizes.length ? sizes[sizes.length - 1] : null,
					trackingMedian: mid(tr),
					fills: [...new Set(ls.map((l) => hexOf(l.fill)).filter((x) => !!x))]
				};
			}
		}
		const src = r.source;
		return {
			kind: "look-piece",
			label,
			report,
			rhythm,
			type,
			source: {
				kind: src.kind,
				via: src.via ?? (src.kind === "frames" || src.kind === "still" ? "node" : "after-effects"),
				frames: src.frames ?? src.files ?? null,
				read: r.frames,
				frameRate: src.frameRate ?? null,
				...src.colour ? { colour: src.colour } : {},
				...rhythmNote ? { rhythmNote } : {},
				path: spec.path ?? null,
				comp: spec.comp ?? null
			}
		};
	} finally {
		await promises.rm(tmp, {
			recursive: true,
			force: true
		});
	}
}
async function writeSheet(dir, pieces) {
	const sheet = buildSheet(pieces), json = path$1.join(dir, "sheet.json"), page = path$1.join(dir, "sheet.md");
	await promises.writeFile(json, JSON.stringify(sheet, null, 1));
	await promises.writeFile(page, sheetMarkdown(sheet));
	return {
		sheet,
		json,
		page
	};
}
function reply(sheet, json, page, started, measured) {
	const look = sheet.measures.filter((m) => m.look).length, varies = sheet.measures.length - look;
	return {
		ok: true,
		standing: sheet.standing,
		pieces: sheet.pieces.map((p) => ({
			label: p.label,
			via: p.source.via,
			colour: p.source.colour?.reading ?? null
		})),
		measured,
		measures: {
			look,
			varies
		},
		colours: sheet.palette.filter((c) => c.look).map((c) => c.hex),
		files: {
			sheet: json,
			page
		},
		seconds: Math.round((performance.now() - started) / 100) / 10,
		reading: `A look sheet from ${standingBase(sheet)}: ${look} measures hold across the pieces, ${varies} vary (not compared); ${sheet.palette.filter((c) => c.look).length} main colours are part of the look.${sheet.pieces.length < LOOK_RULES.fewPieces ? ` ${FEW_PIECES_NOTE}` : ""} Read ${path$1.basename(page)}; compare a build with reference.compare { reference: sheet.json, build } or reference.report { against: sheet.json }.`,
		next: "Compare a build with the sheet before hand-over: reference.report on its render with against: the sheet (rhythm: true for the rhythm)."
	};
}
async function runLookSheet(args, io) {
	const started = performance.now();
	if (typeof args.outDir !== "string" || !path$1.isAbsolute(args.outDir)) return {
		ok: false,
		error: "`outDir` must be an absolute folder for the sheet"
	};
	const pieces = Array.isArray(args.pieces) ? args.pieces : [];
	if (!pieces.length) return {
		ok: false,
		error: "`pieces` must list the approved pieces: [{ label, path } or { label, comp, project? }]"
	};
	const labels = pieces.map((p) => p?.label);
	if (new Set(labels).size !== labels.length) return {
		ok: false,
		error: "every piece needs its own `label`"
	};
	const maxFrames = typeof args.maxFrames === "number" && args.maxFrames >= 1 ? Math.floor(args.maxFrames) : 400;
	await promises.mkdir(path$1.join(args.outDir, "pieces"), { recursive: true });
	const done = [];
	for (const spec of pieces) {
		const p = await measurePiece(spec, args.outDir, io, maxFrames, args.regions);
		if ("error" in p) return {
			ok: false,
			error: p.error,
			measuredBefore: done.map((d) => d.piece.label)
		};
		const file = path$1.join("pieces", `${slug(p.label)}.json`);
		await promises.writeFile(path$1.join(args.outDir, file), JSON.stringify(p));
		done.push({
			piece: p,
			file
		});
	}
	const { sheet, json, page } = await writeSheet(args.outDir, done);
	return reply(sheet, json, page, started, done.map((d) => d.piece.label));
}
async function runLookSheetAdd(args, io) {
	const started = performance.now();
	if (typeof args.sheet !== "string" || !path$1.isAbsolute(args.sheet)) return {
		ok: false,
		error: "`sheet` must be the absolute path of a sheet.json from reference.sheet"
	};
	let sheet;
	try {
		sheet = JSON.parse(await promises.readFile(args.sheet, "utf8"));
	} catch (e) {
		return {
			ok: false,
			error: `could not read ${args.sheet}: ${e.message}`
		};
	}
	if (!isSheet(sheet)) return {
		ok: false,
		error: `${args.sheet} is not a look sheet`
	};
	const dir = path$1.dirname(args.sheet), spec = args.piece ?? {};
	if (sheet.pieces.some((p2) => p2.label === spec.label)) return {
		ok: false,
		error: `the sheet already has a piece labelled "${spec.label}"`
	};
	const old = [];
	for (const p2 of sheet.pieces) {
		const got = JSON.parse(await promises.readFile(path$1.join(dir, p2.file), "utf8"));
		if (!isPiece(got)) return {
			ok: false,
			error: `${p2.file} is not a measured piece`
		};
		old.push({
			piece: got,
			file: p2.file
		});
	}
	const p = await measurePiece(spec, dir, io, typeof args.maxFrames === "number" && args.maxFrames >= 1 ? Math.floor(args.maxFrames) : 400, args.regions);
	if ("error" in p) return {
		ok: false,
		error: p.error
	};
	let file = path$1.join("pieces", `${slug(p.label)}.json`);
	for (let k = 2; old.some((o) => o.file === file); k++) file = path$1.join("pieces", `${slug(p.label)}-${k}.json`);
	await promises.mkdir(path$1.join(dir, "pieces"), { recursive: true });
	await promises.writeFile(path$1.join(dir, file), JSON.stringify(p));
	const w = await writeSheet(dir, [...old, {
		piece: p,
		file
	}]);
	return reply(w.sheet, w.json, w.page, started, [p.label]);
}
var MOVIE_EXT, slug;
function init_look_sheet() {
	return (init_look_sheet = __esmMin((() => {
		init_look();
		init_registry();
		init_rhythm();
		init_keying_reference();
		init_keying_shared();
		MOVIE_EXT = /\.(mov|mp4|m4v|mxf|avi|webm|mkv|mpe?g)$/i;
		slug = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "piece";
		registerOp({
			name: "reference.sheet",
			category: "look",
			description: "A look sheet from a user's approved pieces: what stays the same across them, and how much it varies. Each piece is measured as reference.report measures it (a movie decoded by ffmpeg in Node when it is installed, no After Effects), with its rhythm from video.census over the whole movie and video.shots (calm, local and travel shares, travel moves a minute, calm runs, bursts, shot lengths, cuts a minute) and, for a comp with project: true, its type. For each measure the sheet keeps the middle value, the lowest and highest piece and how many pieces it rests on; a measure whose range is wider than 3 of reference.compare's steps varies in the user's pieces and is never compared. Main colours are matched across pieces (within CIELAB 10) and are part of the look when two thirds of the pieces carry them. One piece is its own numbers, two give a range, three or more a look, and the sheet says how many every time. Writes sheet.json, sheet.md (pieces named by their labels) and one file per piece under pieces/ (numbers only, nothing of the pictures), so reference.sheet_add never measures a piece twice. It describes what the pieces did, not what a new piece must do. Compare a build with reference.compare { reference: sheet.json } or reference.report { against: sheet.json }.",
			params: [
				{
					name: "pieces",
					type: "array",
					description: "The approved pieces: [{ label, path, via? }] for a movie, a folder of PNG frames or a still (via: 'after-effects' renders a movie through After Effects instead of decoding it with ffmpeg), or [{ label, comp, project? }] for a comp (project: true also reads its text layers' fonts, sizes and tracking). The label names the piece on the sheet's page.",
					required: true
				},
				{
					name: "outDir",
					type: "string",
					description: "Absolute folder for the sheet.",
					required: true
				},
				{
					name: "maxFrames",
					type: "number",
					description: `Most frames read a piece for its report (default ${400}); the rhythm is read over the whole movie.`,
					required: false
				},
				{
					name: "regions",
					type: "array",
					description: "Named regions in frame pixels, read beside the grid's nine in every piece.",
					required: false
				}
			],
			toJsx: () => NODE_ONLY("reference.sheet"),
			run: (args, transport) => runLookSheet(args, liveFileIO(transport))
		});
		registerOp({
			name: "reference.sheet_add",
			category: "look",
			description: "Add one approved piece to a look sheet (reference.sheet): the piece is measured, the others are read back from their saved files, and the sheet and its page are written again with the new ranges.",
			params: [
				{
					name: "sheet",
					type: "string",
					description: "Absolute path of the sheet.json.",
					required: true
				},
				{
					name: "piece",
					type: "object",
					description: "{ label, path } or { label, comp, project? }, as in reference.sheet.",
					required: true
				},
				{
					name: "maxFrames",
					type: "number",
					description: `Most frames read for the piece's report (default ${400}).`,
					required: false
				}
			],
			toJsx: () => NODE_ONLY("reference.sheet_add"),
			run: (args, transport) => runLookSheetAdd(args, liveFileIO(transport))
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

export { PARK_QUEUE_FN, QUEUE_CHANGE_NOTE, RENDER_QUEUE_UNDO_WARNING, init_layer, init_layout, init_look_sheet, init_marker, init_mask, init_pref, init_project, init_property, init_render };
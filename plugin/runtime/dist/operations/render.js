// Render queue operations.
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { rejectedOutputPath } from "../config.js";
import { readOnlyMode } from "../policy.js";
import { registerOp, jsxFail, jsxVal, jsxCompPreamble } from "../registry.js";
import { AE_AAC_PRIMING_SAMPLES, alignSound, FFMPEG, FFPROBE, parseEbur128Summary, parseVolumedetect, readSoundSync, runTool, } from "./delivery-sound.js";
/**
 * Said by every operation that changes the render queue (stage 7). serve.jsx
 * enforces it; this tells the caller before they find out by a refusal.
 */
export const RENDER_QUEUE_UNDO_WARNING = " After this, undo and rollback are refused for the rest of the After Effects session unless acceptRenderQueueRisk: true: After Effects 2027 has gone into crash recovery on undo after scripted render-queue changes (observed twice on 2026-11-10; a precaution, not a proven cause). Save the project before undoing anything afterwards; project.open / project.new clear the block.";
/**
 * Park and unpark the render queue, for operations that render one temporary
 * item of their own (render.variants, render.preview): every existing item's
 * Render checkbox is switched off and remembered, then switched back on.
 * Items are addressed by index, so the temporary item must be added after
 * parking (it lands at the end) and removed before unparking.
 */
/** Template names as a queue item and its first output module list them. */
const READ_TEMPLATES_FN = `
    function _readTemplates(_item) {
        var _render = [];
        var _output = [];
        try { _render = _item.templates; } catch (eR) {}
        try { _output = _item.outputModule(1).templates; } catch (eO) {}
        return { renderTemplates: _render, outputTemplates: _output };
    }
`;
/** Said on every render.preview answer and on a list that used a temporary item. */
export const QUEUE_CHANGE_NOTE = "the project is left modified (unsaved): a render-queue item was added and removed. Nothing in the comps changed; save or revert as you normally would";
export const PARK_QUEUE_FN = `
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
    params: [
        { name: "comp", type: "any", description: "Comp name or id", required: true },
        {
            name: "outputPath",
            type: "string",
            description: "Output file path (optional, sets on the first output module)",
            required: false,
        },
    ],
    toJsx(args) {
        const outputPathJsx = args.outputPath
            ? `
                try {
                    _rqi.outputModules[1].file = AE.ensureParentDir(${jsxVal(args.outputPath)});
                    _result.outputPath = ${jsxVal(args.outputPath)};
                } catch(e) { _result.outputWarning = "could not set output path: " + AE.errText(e); }
            `
            : "";
        return `
            ${jsxCompPreamble(args)}
            var _rqi = app.project.renderQueue.items.add(_comp);
            var _result = { ok: true, queueIndex: app.project.renderQueue.numItems, compName: _comp.name };
            ${outputPathJsx}
            return _result;
        `;
    },
});
registerOp({
    name: "render.start",
    category: "render",
    description: "Render queued items and verify each output file was newly written. Blocks until complete. Missing output directories are created first. Completed items are not counted as new renders." +
        RENDER_QUEUE_UNDO_WARNING,
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
    },
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
    },
});
/** Resolve `_rqi` from an optional queueIndex arg (default: last item). */
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
registerOp({
    name: "render.set_output",
    category: "render",
    description: "Configure a render-queue item: render/output templates, output path, time span, render flag, skipFrames, logType, postRenderAction. Discover template names with render.list_templates; raw settings via render.get_settings / render.set_settings.",
    params: [
        {
            name: "queueIndex",
            type: "number",
            description: "1-based queue item index (default: last item)",
            required: false,
        },
        {
            name: "renderTemplate",
            type: "string",
            description: 'Render settings template name (e.g. "Best Settings", "Draft Settings")',
            required: false,
        },
        {
            name: "outputTemplate",
            type: "string",
            description: 'Output module template name (e.g. "Lossless", "High Quality")',
            required: false,
        },
        { name: "outputPath", type: "string", description: "Output file path", required: false },
        {
            name: "timeSpanStart",
            type: "number",
            description: "Render span start in seconds (comp time)",
            required: false,
        },
        {
            name: "timeSpanDuration",
            type: "number",
            description: "Render span duration in seconds",
            required: false,
        },
        {
            name: "outputModuleIndex",
            type: "number",
            description: "1-based output module index (default 1)",
            required: false,
            default: 1,
        },
        {
            name: "render",
            type: "boolean",
            description: "Whether this item renders when the queue starts (the Render checkbox)",
            required: false,
        },
        {
            name: "skipFrames",
            type: "number",
            description: "Render every Nth frame (0 = every frame)",
            required: false,
        },
        {
            name: "logType",
            type: "string",
            description: "errorsOnly|errorsAndSettings|errorsAndPerFrameInfo",
            required: false,
        },
        {
            name: "postRenderAction",
            type: "string",
            description: "none|import|importAndReplaceUsage|setProxy (on the output module)",
            required: false,
        },
        {
            name: "includeSourceXMP",
            type: "boolean",
            description: "Embed source-footage XMP metadata in the output",
            required: false,
        },
        {
            name: "queueItemNotify",
            type: "boolean",
            description: "Per-item Notify checkbox (AE 22.0+)",
            required: false,
        },
        {
            name: "queueNotify",
            type: "boolean",
            description: "QUEUE-WIDE Notify checkbox (RenderQueue.queueNotify, AE 22.0+)",
            required: false,
        },
    ],
    toJsx(args) {
        const rqiSets = [];
        if (args.queueNotify !== undefined)
            rqiSets.push(`try { rq.queueNotify = ${jsxVal(args.queueNotify)}; } catch (eQq) { _w.push("queueNotify (AE 22.0+): " + AE.errText(eQq)); }`);
        if (args.renderTemplate !== undefined)
            rqiSets.push(`_applyTpl(_rqi, ${jsxVal(args.renderTemplate)}, "renderTemplate");`);
        if (args.timeSpanStart !== undefined)
            rqiSets.push(`try { _rqi.timeSpanStart = ${jsxVal(args.timeSpanStart)}; } catch (eTs) { _w.push("timeSpanStart: " + AE.errText(eTs)); }`);
        if (args.timeSpanDuration !== undefined)
            rqiSets.push(`try { _rqi.timeSpanDuration = ${jsxVal(args.timeSpanDuration)}; } catch (eTd) { _w.push("timeSpanDuration: " + AE.errText(eTd)); }`);
        if (args.render !== undefined)
            rqiSets.push(`try { _rqi.render = ${jsxVal(args.render)}; } catch (eRf) { _w.push("render: " + AE.errText(eRf)); }`);
        if (args.skipFrames !== undefined)
            rqiSets.push(`try { _rqi.skipFrames = ${jsxVal(args.skipFrames)}; } catch (eSk) { _w.push("skipFrames: " + AE.errText(eSk)); }`);
        if (args.logType !== undefined)
            rqiSets.push(`
                try {
                    var _ltMap = { "errorsOnly": LogType.ERRORS_ONLY, "errorsAndSettings": LogType.ERRORS_AND_SETTINGS, "errorsAndPerFrameInfo": LogType.ERRORS_AND_PER_FRAME_INFO };
                    if (_ltMap.hasOwnProperty(${jsxVal(args.logType)})) {
                        _rqi.logType = _ltMap[${jsxVal(args.logType)}];
                    } else { _w.push("logType: unknown value " + ${jsxVal(args.logType)}); }
                } catch (eLt) { _w.push("logType: " + AE.errText(eLt)); }
            `);
        if (args.queueItemNotify !== undefined)
            rqiSets.push(`try { _rqi.queueItemNotify = ${jsxVal(args.queueItemNotify)}; } catch (eQn) { _w.push("queueItemNotify (AE 22.0+): " + AE.errText(eQn)); }`);
        const omSets = [];
        if (args.outputTemplate !== undefined)
            omSets.push(`_applyTpl(_om, ${jsxVal(args.outputTemplate)}, "outputTemplate");`);
        if (args.outputPath !== undefined)
            omSets.push(`try { _om.file = AE.ensureParentDir(${jsxVal(args.outputPath)}); } catch (eOp) { _w.push("outputPath: " + AE.errText(eOp)); }`);
        if (args.postRenderAction !== undefined)
            omSets.push(`
                try {
                    var _praMap = { "none": PostRenderAction.NONE, "import": PostRenderAction.IMPORT, "importAndReplaceUsage": PostRenderAction.IMPORT_AND_REPLACE_USAGE, "setProxy": PostRenderAction.SET_PROXY };
                    if (_praMap.hasOwnProperty(${jsxVal(args.postRenderAction)})) {
                        _om.postRenderAction = _praMap[${jsxVal(args.postRenderAction)}];
                    } else { _w.push("postRenderAction: unknown value " + ${jsxVal(args.postRenderAction)}); }
                } catch (ePa) { _w.push("postRenderAction: " + AE.errText(ePa)); }
            `);
        if (args.includeSourceXMP !== undefined)
            omSets.push(`try { _om.includeSourceXMP = ${jsxVal(args.includeSourceXMP)}; } catch (eXm) { _w.push("includeSourceXMP: " + AE.errText(eXm)); }`);
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
                _w.push(label + ": no template named '" + name + "' — available: " + _avail.join(" | "));
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
    },
});
registerOp({
    name: "render.get_settings",
    category: "render",
    readOnly: true,
    description: "Read the raw render settings of a queue item and the settings of each of its output modules (getSettings, AE 13.0+). format 'settable' returns only keys accepted by render.set_settings / render.set_om_settings.",
    params: [
        {
            name: "queueIndex",
            type: "number",
            description: "1-based queue item index (default: last item)",
            required: false,
        },
        {
            name: "format",
            type: "string",
            description: "settable|all (default settable)",
            required: false,
            default: "settable",
        },
    ],
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
    },
});
registerOp({
    name: "render.set_settings",
    category: "render",
    description: 'Set raw render settings on a queue item (RenderQueueItem.setSettings, AE 13.0+), e.g. { "Quality": "Best", "Resolution": "Half" }. Discover valid keys/values with render.get_settings.',
    params: [
        {
            name: "queueIndex",
            type: "number",
            description: "1-based queue item index (default: last item)",
            required: false,
        },
        {
            name: "settings",
            type: "object",
            description: "Key/value map from render.get_settings format 'settable'",
            required: true,
        },
    ],
    toJsx(args) {
        return `
            ${jsxRqItemPreamble(args)}
            if (typeof _rqi.setSettings !== "function") return { ok: false, error: "setSettings needs AE 13.0+" };
            try { _rqi.setSettings(${jsxVal(args.settings)}); } catch (eSs) { return { ok: false, error: "setSettings failed: " + AE.errText(eSs) }; }
            var _after = null;
            try { _after = _rqi.getSettings(GetSettingsFormat.STRING_SETTABLE); } catch (eAf) {}
            return { ok: true, queueIndex: _qi, renderSettings: _after };
        `;
    },
});
registerOp({
    name: "render.set_om_settings",
    category: "render",
    description: 'Set raw output-module settings on a queue item (OutputModule.setSettings, AE 13.0+), e.g. { "Format": "QuickTime", "Channels": "RGB + Alpha" }. Discover valid keys/values with render.get_settings.',
    params: [
        {
            name: "queueIndex",
            type: "number",
            description: "1-based queue item index (default: last item)",
            required: false,
        },
        {
            name: "outputModuleIndex",
            type: "number",
            description: "1-based output module index (default 1)",
            required: false,
            default: 1,
        },
        {
            name: "settings",
            type: "object",
            description: "Key/value map from render.get_settings format 'settable'",
            required: true,
        },
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
    },
});
registerOp({
    name: "render.remove_item",
    category: "render",
    description: "Remove ONE item from the render queue by its 1-based index (render.clear_queue removes all)." +
        RENDER_QUEUE_UNDO_WARNING,
    params: [
        {
            name: "queueIndex",
            type: "number",
            description: "1-based queue item index (explicit — no default for a destructive op)",
            required: true,
        },
    ],
    toJsx(args) {
        return `
            ${jsxRqItemPreamble(args)}
            var _compName = _rqi.comp ? _rqi.comp.name : null;
            try { _rqi.remove(); } catch (eRm) { return { ok: false, error: "remove failed: " + AE.errText(eRm) }; }
            return { ok: true, removed: _compName, remaining: rq.numItems };
        `;
    },
});
registerOp({
    name: "render.duplicate_item",
    category: "render",
    description: "Duplicate a render-queue item (RenderQueueItem.duplicate) — e.g. to render the same comp with a second settings/output combination.",
    params: [
        {
            name: "queueIndex",
            type: "number",
            description: "1-based queue item index (default: last item)",
            required: false,
        },
    ],
    toJsx(args) {
        return `
            ${jsxRqItemPreamble(args)}
            var _dup = null;
            try { _dup = _rqi.duplicate(); } catch (eDp) { return { ok: false, error: "duplicate failed: " + AE.errText(eDp) }; }
            return { ok: true, comp: _dup.comp ? _dup.comp.name : null, numItems: rq.numItems };
        `;
    },
});
registerOp({
    name: "render.list_templates",
    category: "render",
    readOnly: true,
    description: "List available render-settings templates and output-module templates. They are read from a queue item: the first one, or, when the queue is empty and `comp` is given, a temporary item for that comp that is removed again (the project is then left modified by the queue change; render.preview with listTemplates does the same)." +
        " A temporary item counts as a render-queue change:" +
        RENDER_QUEUE_UNDO_WARNING,
    params: [
        {
            name: "comp",
            type: "any",
            description: "Comp name or id for a temporary queue item, used only when the queue is empty",
            required: false,
        },
    ],
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
    },
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
    },
});
registerOp({
    name: "render.queue_in_ame",
    category: "render",
    description: "Send the render queue to Adobe Media Encoder (for H.264/HEVC etc.). Requires AME installed. renderImmediately=true starts the AME queue.",
    params: [
        {
            name: "renderImmediately",
            type: "boolean",
            description: "Start rendering in AME right away (default false)",
            required: false,
            default: false,
        },
    ],
    toJsx(args) {
        return `
            var rq = app.project.renderQueue;
            if (rq.numItems === 0) return { ok: false, error: "render queue is empty" };
            if (typeof rq.queueInAME !== "function") return { ok: false, error: "queueInAME not available (needs AE 14.0 / CC 2017+)" };
            var _can = false;
            try { _can = rq.canQueueInAME; } catch (eC) {}
            if (!_can) return { ok: false, error: "cannot queue in AME — is Adobe Media Encoder installed and at least one item queued?" };
            rq.queueInAME(${jsxVal(!!args.renderImmediately)});
            return { ok: true, sent: rq.numItems, renderImmediately: ${jsxVal(!!args.renderImmediately)} };
        `;
    },
});
registerOp({
    name: "render.variants",
    category: "render",
    description: "Render the same comp several times with different property values — a slider that switches a state, a text that changes per version — in ONE call. Each variant sets its values (static properties only; keyed ones are refused), renders through a temporary queue item to outputPath with {name}/{index} substituted, then the original values are restored. Other queue items are not rendered. Blocks until done: raise timeoutMs.",
    params: [
        { name: "comp", type: "any", description: "Comp name or id", required: true },
        {
            name: "variants",
            type: "array",
            description: '[{ name, sets: [{ layer, property, value }, …] }, …] — e.g. [{ name: "A", sets: [{ layer: "Ctrl", property: ["Effects","Slider Control","Slider"], value: 1 }] }]',
            required: true,
        },
        {
            name: "outputPath",
            type: "string",
            description: "Output file path template; {name} and {index} are replaced per variant",
            required: true,
        },
        {
            name: "renderTemplate",
            type: "string",
            description: "Render settings template name",
            required: false,
        },
        {
            name: "outputTemplate",
            type: "string",
            description: "Output module template name",
            required: false,
        },
        {
            name: "timeSpanStart",
            type: "number",
            description: "Render span start in seconds",
            required: false,
        },
        {
            name: "timeSpanDuration",
            type: "number",
            description: "Render span duration in seconds",
            required: false,
        },
    ],
    toJsx(args) {
        const variants = Array.isArray(args.variants) ? args.variants : [];
        if (variants.length === 0) {
            return jsxFail("variants must be a non-empty array");
        }
        for (const [i, v] of variants.entries()) {
            const variant = v;
            if (!variant || typeof variant !== "object" || typeof variant.name !== "string") {
                return jsxFail(`variants[${i}] needs a string name`);
            }
            if (!Array.isArray(variant.sets)) {
                return jsxFail(`variants[${i}].sets must be an array of { layer, property, value }`);
            }
            for (const [j, s] of variant.sets.entries()) {
                const set = s;
                if (!set ||
                    typeof set !== "object" ||
                    set.layer === undefined ||
                    !Array.isArray(set.property) ||
                    set.value === undefined) {
                    return jsxFail(`variants[${i}].sets[${j}] must be { layer, property: [path], value }`);
                }
            }
        }
        const template = String(args.outputPath);
        if (variants.length > 1 && !template.includes("{name}") && !template.includes("{index}")) {
            return jsxFail("outputPath must contain {name} or {index} when rendering more than one variant, or every render overwrites the last");
        }
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
                            if (AE.hasKeys(_prop)) throw new Error("property " + _s.property.join("/") + " on '" + _layer.name + "' has keyframes — variants switch static values only");
                            _restore.push({ prop: _prop, value: AE.readValue(_prop) });
                            AE.writeValue(_prop, _s.value);
                        }
                        var _safe = String(_v.name).replace(/[\\\\\\/:*?"<>|]/g, "_");
                        var _path = _tpl.replace(/\\{name\\}/g, _safe).replace(/\\{index\\}/g, String(_vi));
                        _rqi = rq.items.add(_comp);
                        ${args.renderTemplate !== undefined ? `var _wr = AE.applyTemplate(_rqi, ${jsxVal(args.renderTemplate)}, "renderTemplate"); if (_wr) _entry.warnings.push(_wr);` : ""}
                        var _om = _rqi.outputModule(1);
                        ${args.outputTemplate !== undefined ? `var _wo = AE.applyTemplate(_om, ${jsxVal(args.outputTemplate)}, "outputTemplate"); if (_wo) _entry.warnings.push(_wo);` : ""}
                        _om.file = AE.ensureParentDir(_path);
                        ${args.timeSpanStart !== undefined ? `_rqi.timeSpanStart = ${jsxVal(args.timeSpanStart)};` : ""}
                        ${args.timeSpanDuration !== undefined ? `_rqi.timeSpanDuration = ${jsxVal(args.timeSpanDuration)};` : ""}
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
    },
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
            required: true,
        },
        { name: "name", type: "string", description: "Template name to save under", required: true },
        {
            name: "queueIndex",
            type: "number",
            description: "1-based queue item index (default: last item)",
            required: false,
        },
        {
            name: "outputModuleIndex",
            type: "number",
            description: "1-based output module index (type=output only, default 1)",
            required: false,
            default: 1,
        },
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
    },
});
const PREVIEW_RESOLUTIONS = {
    full: "Full",
    half: "Half",
    third: "Third",
    quarter: "Quarter",
};
registerOp({
    name: "render.preview",
    category: "render",
    description: "Render a quick preview movie of a comp's work area (or the whole comp, or a span) through the render queue, so it can be watched at speed. " +
        "Adds ONE temporary queue item, renders only that item (others are parked and their Render checkboxes restored), then removes it: the queue is left as it was found. " +
        "Never overwrites an existing file unless overwrite is true; creates the output folder. Returns outputPath, timeSpanStart, durationSeconds, frameCount, frameRate, " +
        "renderSeconds (wall clock of the render), elapsedSeconds (AE's own count), bytes, outputTemplate, resolution (+ resolutionReadBack) and warnings. " +
        "It changes the render queue:" +
        RENDER_QUEUE_UNDO_WARNING +
        " " +
        "Blocks until done: raise ae_do timeoutMs for long comps (235 frames at 1080×1920 with 'High Quality' took about 20 s). " +
        "Defaults are what is known to work: output template 'High Quality' (a ProRes .mov) at full resolution; resolution 'half' was measured live (540×960 from 1080×1920, about a third of the time). " +
        "listTemplates: true renders nothing and returns the render-settings and output-module template names, read from a temporary queue item that is removed again. " +
        "Every answer carries projectModified: true and projectNote: adding and removing a queue item leaves the project unsaved.",
    params: [
        { name: "comp", type: "any", description: "Comp name or id", required: true },
        {
            name: "outputPath",
            type: "string",
            description: "Movie file path (the output template may change the extension; the path AE actually wrote is returned). Required unless listTemplates",
            required: false,
        },
        {
            name: "listTemplates",
            type: "boolean",
            description: "Render nothing: return renderTemplates and outputTemplates, read from a temporary queue item for comp that is removed again",
            required: false,
            default: false,
        },
        {
            name: "span",
            type: "string",
            description: "workArea (default) | comp — what to render when no explicit time span is given",
            required: false,
            default: "workArea",
        },
        {
            name: "timeSpanStart",
            type: "number",
            description: "Explicit span start in seconds (comp time); overrides span",
            required: false,
        },
        {
            name: "timeSpanDuration",
            type: "number",
            description: "Explicit span duration in seconds; overrides span",
            required: false,
        },
        {
            name: "outputTemplate",
            type: "string",
            description: "Output module template (default 'High Quality'); refused, with the available names, when it does not exist",
            required: false,
            default: "High Quality",
        },
        {
            name: "renderTemplate",
            type: "string",
            description: "Render settings template (default: the queue item's own default)",
            required: false,
        },
        {
            name: "resolution",
            type: "string",
            description: "full (default, untouched) | half | third | quarter. Set through setSettings({ Resolution }) and read back; resolutionReadBack and a warning say whether it took",
            required: false,
            default: "full",
        },
        {
            name: "renderSettings",
            type: "object",
            description: "Raw render settings applied to the temporary item (RenderQueueItem.setSettings, keys from render.get_settings), after renderTemplate and resolution",
            required: false,
        },
        {
            name: "overwrite",
            type: "boolean",
            description: "Replace an existing file at the output path (default false: refuse)",
            required: false,
            default: false,
        },
    ],
    toJsx(args) {
        if (args.listTemplates === true) {
            return `
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
        }
        if (typeof args.outputPath !== "string" || args.outputPath === "")
            return jsxFail("outputPath is required (unless listTemplates is true)");
        const span = args.span ?? "workArea";
        if (span !== "workArea" && span !== "comp")
            return jsxFail("span must be workArea or comp");
        const resolution = String(args.resolution ?? "full").toLowerCase();
        if (!(resolution in PREVIEW_RESOLUTIONS))
            return jsxFail("resolution must be full, half, third or quarter");
        if ((args.timeSpanStart === undefined) !== (args.timeSpanDuration === undefined))
            return jsxFail("give both timeSpanStart and timeSpanDuration, or neither");
        if (args.timeSpanDuration !== undefined && !(Number(args.timeSpanDuration) > 0))
            return jsxFail("timeSpanDuration must be above 0");
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
                ${args.renderTemplate !== undefined ? `var _wr = AE.applyTemplate(_rqi, ${jsxVal(args.renderTemplate)}, "renderTemplate"); if (_wr) throw new Error(_wr);` : ""}
                var _om = _rqi.outputModule(1);
                var _wo = AE.applyTemplate(_om, ${jsxVal(args.outputTemplate ?? "High Quality")}, "outputTemplate");
                if (_wo) throw new Error(_wo);
                var _start = ${args.timeSpanStart !== undefined ? jsxVal(args.timeSpanStart) : span === "comp" ? "0" : "_comp.workAreaStart"};
                var _dur = ${args.timeSpanDuration !== undefined ? jsxVal(args.timeSpanDuration) : span === "comp" ? "_comp.duration" : "_comp.workAreaDuration"};
                _rqi.timeSpanStart = _start;
                _rqi.timeSpanDuration = _dur;
                var _res = ${jsxVal(resolution)};
                var _resBack = null;
                if (_res !== "full") {
                    var _resName = ${jsxVal(PREVIEW_RESOLUTIONS[resolution])};
                    try { _rqi.setSettings({ "Resolution": _resName }); } catch (eRs) { _w.push("resolution: setSettings failed: " + AE.errText(eRs)); }
                    try { _resBack = _rqi.getSettings(GetSettingsFormat.STRING_SETTABLE)["Resolution"]; } catch (eRb) { _w.push("resolution: could not read it back: " + AE.errText(eRb)); }
                    if (_resBack !== null && String(_resBack) !== _resName) _w.push("resolution: asked for " + _resName + " but the item reads " + String(_resBack) + " — the preview may be full size");
                }
                ${args.renderSettings !== undefined ? `try { _rqi.setSettings(${jsxVal(args.renderSettings)}); } catch (eSs) { _w.push("renderSettings: " + AE.errText(eSs)); }` : ""}
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
                    span: ${args.timeSpanStart !== undefined ? '"custom"' : jsxVal(span)},
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
    },
});
/**
 * Output templates a stock install has (Adobe's notes: High Quality and High
 * Quality with Alpha, ProRes 422 and 4444, since 2021; H.264 - Match Render
 * Settings at 5, 15 and 40 Mbps, 15 the default after a fresh install).
 * Lossless and Lossless with Alpha were present on the Mac this was built on
 * but are not named stock anywhere found; they are only fallbacks. A template
 * can be deleted, so each preset reads the list and says when it falls back.
 */
export const DELIVERY_PRESETS = {
    "vertical-reel": {
        what: "a vertical reel for upload: H.264 at the comp's size and rate",
        first: "H.264 - Match Render Settings - 15 Mbps",
        then: [/^H\.264/i],
        fallback: ["High Quality", "Lossless"],
        fallbackWhy: "no H.264 template on this install, so ProRes 422 instead: a larger file that most upload sites take, or transcode it",
        alpha: false,
        aspect: 9 / 16,
    },
    "master-alpha": {
        what: "a master with alpha for compositing elsewhere: ProRes 4444",
        first: "High Quality with Alpha",
        then: ["Lossless with Alpha"],
        fallback: [/alpha/i],
        fallbackWhy: "neither High Quality with Alpha nor Lossless with Alpha is on this install, so another movie template whose name says alpha",
        alpha: true,
    },
    master: {
        what: "a master without alpha: ProRes 422",
        first: "High Quality",
        then: ["Lossless"],
        fallback: [/^H\.264/i],
        fallbackWhy: "neither High Quality nor Lossless is on this install, so H.264, which is not a master",
        alpha: false,
    },
};
const isSequenceTemplate = (n) => /sequence|photoshop|aiff|alpha only|^_hidden/i.test(n);
export function chooseDeliveryTemplate(preset, templates) {
    const p = DELIVERY_PRESETS[preset];
    if (!p)
        return { error: `no preset '${preset}'; presets: ${Object.keys(DELIVERY_PRESETS).join(", ")}` };
    const movies = templates.filter((t) => !isSequenceTemplate(t));
    const find = (rules) => {
        for (const r of rules) {
            const hit = movies.find((t) => (typeof r === "string" ? t === r : r.test(t)));
            if (hit)
                return hit;
        }
        return null;
    };
    if (movies.includes(p.first))
        return { template: p.first, fallback: false, why: `${p.first}: ${p.what}` };
    const near = find(p.then);
    if (near)
        return { template: near, fallback: false, why: `${near} (${p.first} is not on this install): ${p.what}` };
    const fb = find(p.fallback);
    if (fb)
        return { template: fb, fallback: true, why: `${fb}: ${p.fallbackWhy}` };
    return {
        error: p.alpha
            ? `no movie template with alpha on this install (templates: ${templates.join(", ")}); make one in Edit > Templates > Output Module (QuickTime, Apple ProRes 4444, RGB + Alpha)`
            : `none of the templates this preset uses is on this install (templates: ${templates.join(", ")})`,
    };
}
/** True peak above this is reported: a platform's own lossy encode can clip it. */
export const DELIVERY_TRUE_PEAK_NOTE_DBTP = -1;
/** Convert Audio to Keyframes' amplitude under this on every frame is silence (stage 6: a 0.3 tone reads 21.2, a four-channel take 0.002). */
export const DELIVERY_SILENCE_TOP = 0.1;
/** ffmpeg's max_volume at or under this is silence. */
export const DELIVERY_SILENCE_DB = -60;
/** The file against its comp: size, frame rate, duration (within half a frame), and sound when the comp has some. */
export function checkDelivered(comp, file) {
    const findings = [];
    if (comp.width !== file.width || comp.height !== file.height)
        findings.push({ kind: "size", reading: `The file is ${file.width} × ${file.height}; the comp is ${comp.width} × ${comp.height}.` });
    if (Math.abs(comp.frameRate - file.frameRate) > 0.01)
        findings.push({ kind: "frame rate", reading: `The file runs at ${file.frameRate} fps; the comp at ${comp.frameRate}.` });
    if (Math.abs(comp.duration - file.duration) > 0.5 / (comp.frameRate || 30))
        findings.push({ kind: "duration", reading: `The file is ${file.duration.toFixed(3)} s; the comp is ${comp.duration.toFixed(3)} s.` });
    let sound;
    const lv = file.level;
    if (comp.hasSound) {
        const who = comp.soundLayers.length ? ` (${comp.soundLayers.slice(0, 3).join(", ")})` : "";
        if (!file.hasAudio) {
            findings.push({
                kind: "sound missing",
                reading: `The comp has sound${who} but the file has no sound track: check the output module's audio setting.`,
            });
            sound = "no sound track";
        }
        else if (lv && ((lv.source === "ffmpeg" && lv.maxDb <= DELIVERY_SILENCE_DB) || (lv.source === "After Effects" && lv.top < DELIVERY_SILENCE_TOP))) {
            const measured = lv.source === "ffmpeg" ? "max " + lv.maxDb + " dB" : "amplitude " + lv.top;
            findings.push({
                kind: "sound silent",
                reading: `The comp has sound${who} but the file's sound reads as silence (${measured}). A four-channel take has read as silence in After Effects with no warning: extract the voice to a mono WAV, use it in the comp, and deliver again.`,
            });
            sound = "silent";
        }
        else if (lv && lv.source === "ffmpeg")
            sound = "sound at a mean of " + lv.meanDb + " dB (max " + lv.maxDb + " dB, ffmpeg)";
        else if (lv && lv.source === "After Effects")
            sound = "sound present (amplitude up to " + lv.top + ", After Effects)";
        else
            sound = "a sound track, whose level was not read (no ffmpeg, and After Effects could not read it)";
        const sync = file.sync;
        if (file.hasAudio && sync && sync.lateBySamples > 1) {
            const fr = comp.frameRate ? Math.round((sync.lateBySamples / sync.sampleRate) * comp.frameRate * 100) / 100 : null;
            findings.push({
                kind: "sound late",
                reading: `The sound plays ${sync.lateBySamples} samples (${sync.lateMs} ms${fr !== null ? `, ${fr} of a frame` : ""}) late against the picture: ${sync.reading.replace(/^the sound plays [^:]*: ?/, "") || "the edit list delays it"}. ` +
                    `It could not be fixed (${file.alignment?.how ?? "not attempted"}). Install ffmpeg and deliver again, or remux the file: ffmpeg -i in.mp4 -itsoffset -${(sync.lateBySamples / sync.sampleRate).toFixed(6)} -i in.mp4 -map 0 -map -0:a -map 1:a -c copy out.mp4`,
            });
        }
        else if (file.hasAudio && sync) {
            sound += file.alignment?.aligned && file.alignment.before && file.alignment.before.lateBySamples > 0
                ? `; on its frame (it was ${file.alignment.before.lateBySamples} samples late: ${file.alignment.how})`
                : `; ${sync.reading.replace(/^the sound is /, "")}`;
        }
        if (file.hasAudio && file.loudness) {
            const l = file.loudness;
            sound += `; ${l.integratedLufs} LUFS integrated, true peak ${l.truePeakDbtp} dBTP${l.loudnessRangeLu !== null ? `, range ${l.loudnessRangeLu} LU` : ""} (ffmpeg ebur128)`;
            if (l.truePeakDbtp > DELIVERY_TRUE_PEAK_NOTE_DBTP)
                sound += ` — the true peak is above ${DELIVERY_TRUE_PEAK_NOTE_DBTP} dBTP, which a platform's own encode can clip`;
        }
    }
    else
        sound = file.hasAudio ? "a sound track, though the comp has no sound on" : "no sound, as in the comp";
    const passed = findings.length === 0;
    return {
        passed,
        findings,
        comp,
        file,
        reading: passed
            ? `The file matches the comp: ${file.width} × ${file.height}, ${file.frameRate} fps, ${file.duration.toFixed(3)} s; ${sound}.`
            : findings.map((f) => f.reading).join(" "),
    };
}
/** JSX: the comp's size, rate, length, which enabled layers carry sound, and the output templates. */
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
/** JSX: render the comp through one temporary queue item with the template; other items parked; the item removed. */
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
/** JSX: import the written file, read its size, rate, length and sound; its loudness through Convert Audio to Keyframes; remove what was added. */
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
export async function runDeliver(args, io) {
    const started = Date.now();
    const outputPath = args.outputPath;
    if (typeof outputPath !== "string" || !path.isAbsolute(outputPath))
        return { ok: false, error: "`outputPath` must be an absolute path" };
    const rejected = rejectedOutputPath(outputPath);
    if (rejected)
        return { ok: false, error: rejected };
    const preset = typeof args.preset === "string" ? args.preset : "";
    const plan = await io.execute(deliverPlanJsx({ comp: args.comp }), { label: "render.deliver plan", timeoutMs: 60_000, undoGroup: true });
    if (!plan?.ok)
        return { ok: false, error: plan?.error ?? "could not read the comp" };
    const pick = chooseDeliveryTemplate(preset, plan.templates ?? []);
    if ("error" in pick)
        return { ok: false, error: pick.error };
    const notes = [];
    const p = DELIVERY_PRESETS[preset];
    if (p.aspect && Math.abs(plan.width / plan.height - p.aspect) > 0.01)
        notes.push(`The comp is ${plan.width} × ${plan.height}, not 9:16: the reel will be delivered at the comp's size.`);
    const frames = Math.round(plan.duration * plan.frameRate);
    const estimate = frames * plan.width * plan.height * (p.alpha ? 4 : 3) * 0.6;
    const free = io.freeBytes ? await io.freeBytes(path.dirname(outputPath)) : null;
    if (free !== null && free < estimate + 3e9)
        return { ok: false, error: `not enough room: about ${(estimate / 1e9).toFixed(1)} GB for the file plus 3 GB, ${(free / 1e9).toFixed(1)} GB free` };
    const r = await io.execute(deliverRenderJsx({ comp: args.comp, template: pick.template, outputPath, overwrite: args.overwrite === true }), { label: "render.deliver render", timeoutMs: 120_000 + frames * 5_000, undoGroup: true });
    if (!r?.ok)
        return { ok: false, error: r?.error ?? "the render failed", template: pick.template };
    const written = r.outputPath ?? outputPath;
    // The sound on its frame: After Effects' AAC priming is not skipped by an edit list, so fix it before reading the file.
    let sync = io.soundSync ? await io.soundSync(written).catch(() => null) : null;
    let alignment = null;
    if (sync && sync.lateBySamples > 1) {
        alignment = io.alignSound
            ? await io.alignSound(written, sync).catch((e) => ({ aligned: false, how: `the remux failed: ${e instanceof Error ? e.message : String(e)}`, before: sync }))
            : { aligned: false, how: "no way to remux the file here", before: sync };
        if (alignment.aligned && io.soundSync)
            sync = (await io.soundSync(written).catch(() => null)) ?? sync;
    }
    const probe = io.probe ? await io.probe(written).catch(() => null) : null;
    const back = await io.execute(deliverReadBackJsx({ path: written, readLevel: !(probe && probe.maxDb !== null) }), {
        label: "render.deliver read back",
        timeoutMs: 300_000,
        undoGroup: true,
    });
    if (!back?.ok)
        return { ok: false, error: back?.error ?? "could not bring the file back", outputPath: written };
    const level = probe && probe.maxDb !== null && probe.meanDb !== null
        ? { source: "ffmpeg", meanDb: probe.meanDb, maxDb: probe.maxDb }
        : typeof back.amplitudeTop === "number"
            ? { source: "After Effects", top: back.amplitudeTop }
            : null;
    const check = checkDelivered({ width: plan.width, height: plan.height, frameRate: plan.frameRate, duration: plan.duration, hasSound: plan.hasSound, soundLayers: plan.soundLayers ?? [] }, {
        width: back.width,
        height: back.height,
        frameRate: back.frameRate,
        duration: back.duration,
        hasAudio: back.hasAudio,
        level,
        ...(io.probe ? { loudness: probe?.loudness ?? null } : {}),
        ...(io.soundSync ? { sync, alignment } : {}),
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
        next: check.passed
            ? "Delivered and checked. Watch it once at speed before calling it done."
            : "Stop: tell the user what the check found, in plain words, before calling it delivered.",
    };
}
/** ffprobe's streams and ffmpeg's volumedetect and ebur128 (loudness, true peak), when both are installed; only reads the file. */
export async function probeDelivered(file, tools = { ffmpeg: FFMPEG, ffprobe: FFPROBE }) {
    const pr = await runTool(tools.ffprobe, ["-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration", "-of", "json", file]);
    if (!pr)
        return null;
    let j;
    try {
        j = JSON.parse(pr.stdout);
    }
    catch {
        return null;
    }
    const v = (j.streams ?? []).find((s) => s.codec_type === "video");
    const hasAudio = (j.streams ?? []).some((s) => s.codec_type === "audio");
    if (!v)
        return null;
    const [a, b] = String(v.r_frame_rate ?? "0/1").split("/").map(Number);
    let meanDb = null;
    let maxDb = null;
    let loudness = null;
    if (hasAudio) {
        const vd = await runTool(tools.ffmpeg, ["-hide_banner", "-nostats", "-i", file, "-map", "0:a:0", "-af", "volumedetect,ebur128=peak=true", "-f", "null", "-"], 600_000);
        if (vd) {
            ({ meanDb, maxDb } = parseVolumedetect(vd.stderr));
            loudness = parseEbur128Summary(vd.stderr);
        }
    }
    return { width: v.width, height: v.height, frameRate: b ? Math.round((a / b) * 1000) / 1000 : 0, duration: Number(j.format?.duration ?? 0), hasAudio, meanDb, maxDb, loudness };
}
function liveDeliverIO(transport) {
    return {
        async execute(code, opts) {
            const r = await transport.execute({ code, label: opts.label, timeoutMs: opts.timeoutMs, undoGroup: opts.undoGroup ?? true, suppressDialogs: true });
            return r.ok ? r.result : { ok: false, error: r.error ?? `${opts.label} failed` };
        },
        exists: (f) => fs.access(f).then(() => true, () => false),
        freeBytes: async (dir) => {
            try {
                const st = await fs.statfs(dir);
                return st.bavail * st.bsize;
            }
            catch {
                return null;
            }
        },
        probe: probeDelivered,
        soundSync: readSoundSync,
        alignSound,
    };
}
registerOp({
    name: "render.deliver",
    category: "render",
    description: "Deliver a comp with a named preset and check the file that was written. Presets: 'vertical-reel' (H.264 - Match Render Settings - 15 Mbps, else another H.264 template, else High Quality (ProRes 422) and says so), 'master-alpha' (High Quality with Alpha (ProRes 4444), else Lossless with Alpha, else another movie template whose name says alpha; refuses when there is none), 'master' (High Quality, else Lossless). High Quality, High Quality with Alpha and the three H.264 templates are what Adobe documents for a stock install; a template can be deleted, so the result says which was used and why. " +
        "Renders the whole comp through one temporary queue item (other items parked), then brings the file back and compares size, frame rate and duration (within half a frame) with the comp, and the sound: when the comp has sound on, a file with no sound track, or one that reads as silence, is flagged (a four-channel take read as silence in After Effects with no warning). The level comes from ffmpeg (mean and max dB) when it is installed, else from After Effects' Convert Audio to Keyframes on the file. " +
        `The sound is put on its frame: After Effects' AAC encoder starts the sound with ${AE_AAC_PRIMING_SAMPLES} samples of priming and writes no edit list, so in players the voice ran ${AE_AAC_PRIMING_SAMPLES} samples (0.64 of a frame at 30 fps, 48 kHz) late; the file's edit list is read from its own boxes, and when the priming is not skipped the file is remuxed with ffmpeg (-c copy, nothing re-encoded) so an edit list skips it, read back, and replaces the file only when it does (check.file.sync, check.file.alignment). Without ffmpeg that is a 'sound late' finding with the command that fixes it. ` +
        "With ffmpeg the check also reports the delivered file's integrated loudness (LUFS), loudness range (LU) and true peak (dBTP) from ebur128 (check.file.loudness), and says when the true peak is above -1 dBTP; it sets no loudness target. Returns `check` { passed, findings, reading }." +
        RENDER_QUEUE_UNDO_WARNING,
    params: [
        { name: "comp", type: "any", description: "Comp name or id", required: true },
        { name: "preset", type: "string", description: "'vertical-reel', 'master-alpha' or 'master'", required: true },
        { name: "outputPath", type: "string", description: "Absolute path for the file (the template may change the extension; the path written is returned)", required: true },
        { name: "overwrite", type: "boolean", description: "Replace an existing file (default false)", required: false },
    ],
    toJsx: () => jsxFail("render.deliver runs in Node; call it through ae_do"),
    run: (args, transport) => runDeliver(args, liveDeliverIO(transport)),
});
// ---------------------------------------------------------------------------
// render.mux_audio: a mix made outside After Effects, joined to the picture
// ---------------------------------------------------------------------------
/** What ffprobe says of a file's first video and first audio stream. */
async function probeStreams(file, ffprobe) {
    const pr = await runTool(ffprobe, [
        "-v",
        "error",
        "-show_entries",
        "stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels,duration:format=duration",
        "-of",
        "json",
        file,
    ]);
    if (!pr || pr.failed)
        return null;
    let j;
    try {
        j = JSON.parse(pr.stdout);
    }
    catch {
        return null;
    }
    const streams = j.streams ?? [];
    const v = streams.find((x) => x.codec_type === "video") ?? null;
    const a = streams.find((x) => x.codec_type === "audio") ?? null;
    const fmtDur = Number(j.format?.duration ?? NaN);
    const dur = (x) => (x && Number.isFinite(Number(x.duration)) ? Number(x.duration) : Number.isFinite(fmtDur) ? fmtDur : null);
    let video = null;
    if (v) {
        const [n, d] = String(v.r_frame_rate ?? "0/1").split("/").map(Number);
        video = { codec: v.codec_name, width: v.width, height: v.height, frameRate: d ? Math.round((n / d) * 1000) / 1000 : 0, duration: dur(v) };
    }
    const audio = a
        ? { codec: a.codec_name, sampleRate: Number(a.sample_rate), channels: Number(a.channels), duration: dur(a) }
        : null;
    return { video, audio };
}
/**
 * Join a rendered picture with a mix made outside After Effects: the picture
 * copied as it is (-c:v copy), the WAV encoded to AAC at 48 kHz by ffmpeg,
 * which writes its own edit list over its priming. offsetSeconds moves the
 * mix: positive pads silence before it, negative trims its start, both
 * sample-exact (adelay / atrim). Then the same file check as render.deliver,
 * and a finding when the mix's length differs from the picture's by more
 * than a frame.
 */
export async function runMuxAudio(args, tools = { ffmpeg: FFMPEG, ffprobe: FFPROBE }) {
    const started = Date.now();
    const video = args.video;
    const audio = args.audio;
    if (typeof video !== "string" || !path.isAbsolute(video))
        return { ok: false, error: "`video` must be an absolute path to the rendered picture" };
    if (typeof audio !== "string" || !path.isAbsolute(audio))
        return { ok: false, error: "`audio` must be an absolute path to the mix (a WAV)" };
    const offset = typeof args.offsetSeconds === "number" ? args.offsetSeconds : 0;
    if (!Number.isFinite(offset))
        return { ok: false, error: "`offsetSeconds` must be a number of seconds" };
    const bitrate = typeof args.bitrate === "string" ? args.bitrate : "320k";
    if (!/^\d+(\.\d+)?k$/.test(bitrate))
        return { ok: false, error: "`bitrate` is a number of kilobits a second followed by k, such as '320k'" };
    const ext = path.extname(video) || ".mp4";
    const output = typeof args.output === "string" ? args.output : path.join(path.dirname(video), `${path.basename(video, path.extname(video))}-mix${ext}`);
    if (!path.isAbsolute(output))
        return { ok: false, error: "`output` must be an absolute path" };
    const rejected = rejectedOutputPath(output);
    if (rejected)
        return { ok: false, error: rejected };
    if (path.resolve(output) === path.resolve(video) || path.resolve(output) === path.resolve(audio))
        return { ok: false, error: "`output` must be a new file, not the picture or the mix it is made from" };
    for (const [name, f] of [["video", video], ["audio", audio]])
        if (!(await fs.access(f).then(() => true, () => false)))
            return { ok: false, error: `no file at ${f} (\`${name}\`)` };
    const outputExists = await fs.access(output).then(() => true, () => false);
    if (outputExists && args.overwrite !== true)
        return { ok: false, error: `a file already exists at ${output}; pass overwrite: true to replace it` };
    const version = await runTool(tools.ffmpeg, ["-hide_banner", "-version"]);
    const probeOk = await runTool(tools.ffprobe, ["-hide_banner", "-version"]);
    if (version === null || probeOk === null)
        return {
            ok: false,
            error: "render.mux_audio needs ffmpeg and ffprobe, and " +
                (version === null ? "ffmpeg" : "ffprobe") +
                " is not installed (looked for it on the PATH, in /opt/homebrew/bin and /usr/local/bin). Install it (on a Mac: brew install ffmpeg) and call again. Nothing was written.",
        };
    const vIn = await probeStreams(video, tools.ffprobe);
    if (!vIn?.video)
        return { ok: false, error: `ffprobe found no picture in ${video}` };
    const aIn = await probeStreams(audio, tools.ffprobe);
    if (!aIn?.audio)
        return { ok: false, error: `ffprobe found no sound in ${audio}` };
    const fps = vIn.video.frameRate || 30;
    const frame = 1 / fps;
    // The mix moved by the offset, sample-exact, and resampled to 48 kHz.
    const rate = aIn.audio.sampleRate || 48_000;
    const shift = Math.round(Math.abs(offset) * rate);
    const filters = [];
    if (offset > 0)
        filters.push(`adelay=delays=${shift}S:all=1`);
    if (offset < 0)
        filters.push(`atrim=start_sample=${shift}`, "asetpts=PTS-STARTPTS");
    const tmp = path.join(path.dirname(output), `.${path.basename(output, path.extname(output))}.mux${path.extname(output) || ext}`);
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
        ...(filters.length ? ["-af", filters.join(",")] : []),
        "-c:a",
        "aac",
        "-b:a",
        bitrate,
        "-ar",
        "48000",
        tmp,
    ];
    const r = await runTool(tools.ffmpeg, argv, 1_800_000);
    if (r === null || r.failed) {
        await fs.rm(tmp, { force: true });
        return { ok: false, error: `ffmpeg could not join the picture and the mix: ${(r?.stderr ?? "ffmpeg is not installed").trim().slice(0, 400)}`, command: ["ffmpeg", ...argv].join(" ") };
    }
    await fs.rename(tmp, output);
    // The file check, as render.deliver's, against the picture it was made from.
    const probe = await probeDelivered(output, tools);
    const sync = await readSoundSync(output).catch(() => null);
    const out = await probeStreams(output, tools.ffprobe);
    const mixSeconds = aIn.audio.duration !== null ? aIn.audio.duration + offset : null;
    const pictureSeconds = vIn.video.duration;
    const check = checkDelivered({ width: vIn.video.width, height: vIn.video.height, frameRate: fps, duration: pictureSeconds ?? 0, hasSound: true, soundLayers: [path.basename(audio)] }, {
        width: probe?.width ?? out?.video?.width ?? 0,
        height: probe?.height ?? out?.video?.height ?? 0,
        frameRate: probe?.frameRate ?? out?.video?.frameRate ?? 0,
        duration: probe?.duration ?? 0,
        hasAudio: probe?.hasAudio ?? !!out?.audio,
        level: probe && probe.meanDb !== null && probe.maxDb !== null ? { source: "ffmpeg", meanDb: probe.meanDb, maxDb: probe.maxDb } : null,
        loudness: probe?.loudness ?? null,
        sync,
        alignment: null,
    });
    const r3 = (v) => Math.round(v * 1000) / 1000;
    if (mixSeconds !== null && pictureSeconds !== null && Math.abs(mixSeconds - pictureSeconds) > frame + 1e-6) {
        const diff = mixSeconds - pictureSeconds;
        check.findings.push({
            kind: "mix length",
            reading: `The mix ${offset !== 0 ? `(moved ${offset} s) ` : ""}runs ${r3(mixSeconds)} s and the picture ${r3(pictureSeconds)} s: ` +
                `${r3(Math.abs(diff))} s (${Math.round((Math.abs(diff) / frame) * 10) / 10} frames) ${diff > 0 ? "longer" : "shorter"}, more than a frame. ` +
                (diff > 0 ? "The file runs on past the picture's last frame with sound over a held or missing picture." : "The end of the picture is silent.") +
                " Check that the mix is the one for this cut.",
        });
        check.passed = false;
        check.reading = check.findings.map((f) => f.reading).join(" ");
    }
    return {
        ok: true,
        output,
        video: { path: video, ...vIn.video },
        audio: { path: audio, ...aIn.audio, offsetSeconds: offset, encodedAs: `AAC ${bitrate} at 48 kHz` },
        mixLength: mixSeconds !== null && pictureSeconds !== null ? { mixSeconds: r3(mixSeconds), pictureSeconds: r3(pictureSeconds), differenceFrames: Math.round(((mixSeconds - pictureSeconds) / frame) * 10) / 10 } : null,
        check,
        timing: { totalMs: Date.now() - started },
        next: check.passed
            ? "Joined and checked. Watch it once at speed before calling it done."
            : "Stop: tell the user what the check found, in plain words, before calling it delivered.",
    };
}
registerOp({
    name: "render.mux_audio",
    category: "render",
    description: "Join a rendered picture with a mix made outside After Effects (a WAV): the recipe is render.deliver for the picture, then this, then look at its check. " +
        "The picture is copied as it is (-c:v copy, nothing re-encoded); the mix is encoded to AAC at 48 kHz by ffmpeg, which writes its own edit list over the encoder's priming, so the sound sits on its frame. " +
        "offsetSeconds moves the mix, sample-exact: positive pads silence before it, negative trims its start. " +
        "Then the same file check as render.deliver on the new file: size, frame rate and duration against the picture, the sound's edit list read back (check.file.sync), its level, and its loudness (integrated LUFS, loudness range and true peak from ebur128, check.file.loudness); and a 'mix length' finding when the mix runs more than one frame longer or shorter than the picture. " +
        "Needs ffmpeg and ffprobe: without them it says so and writes nothing. Does not touch the After Effects project.",
    readOnly: true,
    params: [
        { name: "video", type: "string", description: "Absolute path of the rendered picture (from render.deliver).", required: true },
        { name: "audio", type: "string", description: "Absolute path of the mix, a WAV made outside After Effects.", required: true },
        { name: "output", type: "string", description: "Absolute path for the joined file (default: <video name>-mix beside the picture, same extension).", required: false },
        { name: "overwrite", type: "boolean", description: "Replace an existing file at output (default false: refuse).", required: false },
        { name: "offsetSeconds", type: "number", description: "Move the mix against the picture, seconds: positive starts it later (silence before), negative trims its start (default 0).", required: false },
        { name: "bitrate", type: "string", description: "AAC bitrate, such as '320k' (default '320k').", required: false },
    ],
    toJsx: () => jsxFail("render.mux_audio runs in Node; call it through ae_do"),
    run: (args) => runMuxAudio(args),
});
//# sourceMappingURL=render.js.map
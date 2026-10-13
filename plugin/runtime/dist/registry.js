// Operation Registry — maps operation names to JSX code generators.
// Each operation has metadata (category, description, param schema) and a
// `toJsx(args)` function that returns the JSX code string to execute.
//
// The registry is the single source of truth for ae_catalog and ae_do.
// Adding a new operation = adding one entry to this map.
const operations = new Map();
/** The consent parameter injected into every appConfig operation. */
export const APP_CONFIG_CONFIRM_PARAM = {
    name: "confirm",
    type: "boolean",
    description: "Must be true. This operation changes the user's After Effects APPLICATION configuration (it persists beyond the project) — set it only when the user explicitly requested this change, never as a side effect of other work.",
    required: true,
};
export function registerOp(op) {
    if (op.appConfig && !op.params.some((p) => p.name === APP_CONFIG_CONFIRM_PARAM.name)) {
        op.params = [...op.params, APP_CONFIG_CONFIRM_PARAM];
    }
    operations.set(op.name, op);
}
/**
 * Denial text for an appConfig operation called without confirm: true.
 * Returns null when the call is allowed. Shared by ae_do and batch.run so the
 * contract reads identically on both paths.
 */
export function denyAppConfig(op, args) {
    if (!op.appConfig || args.confirm === true)
        return null;
    return (`'${op.name}' changes the user's After Effects application configuration, which persists beyond this project. ` +
        "It runs only with confirm: true — pass that only when the user explicitly asked for this configuration change.");
}
export function getOp(name) {
    return operations.get(name);
}
export function listOps(category) {
    const all = Array.from(operations.values());
    if (!category)
        return all;
    return all.filter((op) => op.category === category);
}
/** True when `op` may run inside the dispatcher's automatic undo group. */
export function wantsUndoGroup(op, args) {
    return op.undoGroup ? op.undoGroup(args) : true;
}
/** True when the dispatcher may suppress modal dialogs around `op`. */
export function wantsDialogSuppression(op, args) {
    return op.suppressDialogs ? op.suppressDialogs(args) : true;
}
export function listCategories() {
    const cats = new Set();
    for (const op of operations.values())
        cats.add(op.category);
    return Array.from(cats).sort();
}
// --- Helpers for JSX generation ---
/**
 * Safely embed a value as a JSX literal (JSON-stringified). Two subtleties:
 *  - `undefined` (a common value for an omitted optional arg) is normalized to
 *    `null` first: JSON.stringify(undefined) returns the *value* undefined, not
 *    a string, so calling .replace on it would throw. `null` embeds as a falsy
 *    literal, keeping patterns like `${jsxVal(args.w)} || _comp.width` working.
 *  - U+2028/U+2029 are legal raw inside JSON strings but are line terminators
 *    in ExtendScript's pre-ES2019 grammar — escape them or the generated
 *    script fails to parse.
 */
export function jsxVal(v) {
    return JSON.stringify(v === undefined ? null : v)
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}
/**
 * A whole operation body that reports a validation failure decided on the
 * Node side (before anything reaches AE). Use it for early returns from
 * `toJsx` instead of an inline `return { ok: false, error: \`…\` }` template:
 * an interpolated message that itself contains braces (`{ layer, ranges }`)
 * confuses the codegen lint's template scanner, and the message is embedded
 * through `jsxVal` here exactly once.
 */
export function jsxFail(message) {
    return `return { ok: false, error: ${jsxVal(message)} };`;
}
/** Build the standard comp lookup preamble (defines `_comp`). */
export function jsxCompPreamble(args) {
    return `
        var _comp = AE.findCompByNameOrId(${jsxVal(args.comp)});
        if (!_comp) return { ok: false, error: "no comp matching " + ${jsxVal(String(args.comp))} };
    `;
}
/**
 * Build the standard comp + layer lookup preamble (defines `_comp` and
 * `_layer`). Resolution goes through AE.findLayerInComp, which accepts a
 * 1-based index (range-checked — CompItem.layer() throws on out-of-range), a
 * layer name, or `{ id: n }` for a stable Layer.id reference (AE 22.0+).
 */
export function jsxCompLayerPreamble(args) {
    return `
        ${jsxCompPreamble(args)}
        var _layerArg = ${jsxVal(args.layer)};
        var _layer = AE.findLayerInComp(_comp, _layerArg);
        if (!_layer) {
            var _layerDesc = (_layerArg !== null && typeof _layerArg === "object") ? ("id " + _layerArg.id) : _layerArg;
            return { ok: false, error: "no layer matching " + _layerDesc + " (comp has " + _comp.numLayers + " layers)" };
        }
    `;
}
/** Build property lookup from a path array. */
export function jsxPropertyLookup(pathArg = "_propPath") {
    return `
        var _node = _layer;
        for (var _pi = 0; _pi < ${pathArg}.length; _pi++) {
            var _next = null;
            try { _next = _node.property(${pathArg}[_pi]); } catch (e) {}
            if (!_next) return { ok: false, error: "property segment '" + ${pathArg}[_pi] + "' not found at depth " + _pi };
            _node = _next;
        }
    `;
}
/** Ambient context JSX snippet — appended to every ae_do response. */
export const AMBIENT_CONTEXT_JSX = `
    var _ctx = {};
    try {
        var _ai = app.project.activeItem;
            _ctx.project = { numItems: app.project.numItems, dirty: app.project.dirty, file: app.project.file ? app.project.file.fsName.replace(/\\\\/g,"/") : null };
        // Which After Effects instance answered (its resident agent's id), so
        // a session driving several never has to guess where an edit landed.
        try { _ctx.instance = $.global.AE_MCP_AGENT ? $.global.AE_MCP_AGENT.state.id : null; } catch (eInst) { _ctx.instance = null; }
        if (_ai && _ai instanceof CompItem) {
            _ctx.activeComp = { id: _ai.id, name: _ai.name, width: _ai.width, height: _ai.height, fps: _ai.frameRate, duration: _ai.duration, numLayers: _ai.numLayers };
            var _sel = [];
            for (var _si = 1; _si <= _ai.numLayers; _si++) {
                if (_ai.layer(_si).selected) _sel.push({ index: _si, name: _ai.layer(_si).name });
            }
            _ctx.selectedLayers = _sel;
        } else {
            _ctx.activeComp = null;
            _ctx.selectedLayers = [];
        }
    } catch (eCtx) { _ctx.error = AE.errText(eCtx); }
`;
//# sourceMappingURL=registry.js.map
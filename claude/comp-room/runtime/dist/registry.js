const operations = /* @__PURE__ */ new Map();
const APP_CONFIG_CONFIRM_PARAM = {
  name: "confirm",
  type: "boolean",
  description: "Must be true. This operation changes the user's After Effects APPLICATION configuration (it persists beyond the project) \u2014 set it only when the user explicitly requested this change, never as a side effect of other work.",
  required: true
};
function registerOp(op) {
  if (op.appConfig && !op.params.some((p) => p.name === APP_CONFIG_CONFIRM_PARAM.name)) {
    op.params = [...op.params, APP_CONFIG_CONFIRM_PARAM];
  }
  operations.set(op.name, op);
}
function denyAppConfig(op, args) {
  if (!op.appConfig || args.confirm === true) return null;
  return `'${op.name}' changes the user's After Effects application configuration, which persists beyond this project. It runs only with confirm: true \u2014 pass that only when the user explicitly asked for this configuration change.`;
}
function getOp(name) {
  return operations.get(name);
}
function listOps(category) {
  const all = Array.from(operations.values());
  if (!category) return all;
  return all.filter((op) => op.category === category);
}
function wantsUndoGroup(op, args) {
  return op.undoGroup ? op.undoGroup(args) : true;
}
function wantsRollback(op, args) {
  if (!wantsUndoGroup(op, args)) return false;
  return op.rollback ? op.rollback(args) : !op.readOnly;
}
function prepareOp(op, args) {
  return op.prepare ? op.prepare(args) : { ok: true, args };
}
function wantsDialogSuppression(op, args) {
  return op.suppressDialogs ? op.suppressDialogs(args) : true;
}
function listCategories() {
  const cats = /* @__PURE__ */ new Set();
  for (const op of operations.values()) cats.add(op.category);
  return Array.from(cats).sort();
}
function jsxVal(v) {
  return JSON.stringify(v === void 0 ? null : v).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
function jsxFail(message) {
  return `return { ok: false, error: ${jsxVal(message)} };`;
}
function jsxCompPreamble(args) {
  return `
        var _comp = AE.findCompByNameOrId(${jsxVal(args.comp)});
        if (!_comp) return { ok: false, error: "no comp matching " + ${jsxVal(String(args.comp))} };
    `;
}
function jsxCompLayerPreamble(args) {
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
function jsxPropertyLookup(pathArg = "_propPath") {
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
const AMBIENT_CONTEXT_JSX = `
    var _ctx = {};
    try {
        var _ai = app.project.activeItem;
            _ctx.project = { numItems: app.project.numItems, dirty: app.project.dirty, file: app.project.file ? app.project.file.fsName.replace(/\\\\/g,"/") : null };
        // Which After Effects instance answered (its resident agent's id), so
        // a session driving several never has to guess where an edit landed.
        try { _ctx.instance = $.global.AE_MCP_AGENT ? $.global.AE_MCP_AGENT.state.id : null; } catch (eInst) { _ctx.instance = null; }
        // Set once a request changed the render queue in this session: undo
        // and rollback refuse until a project is opened or created.
        try { var _sess = $.global.AE_MCP_SESSION; if (_sess && _sess.renderQueueChanged) _ctx.undoBlocked = { reason: "render queue changed by a script in this session", by: _sess.renderQueueChanged.by, at: _sess.renderQueueChanged.at }; } catch (eSess) {}
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
export {
  AMBIENT_CONTEXT_JSX,
  APP_CONFIG_CONFIRM_PARAM,
  denyAppConfig,
  getOp,
  jsxCompLayerPreamble,
  jsxCompPreamble,
  jsxFail,
  jsxPropertyLookup,
  jsxVal,
  listCategories,
  listOps,
  prepareOp,
  registerOp,
  wantsDialogSuppression,
  wantsRollback,
  wantsUndoGroup
};

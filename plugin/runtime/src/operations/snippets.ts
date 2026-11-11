// JSX bodies shared between the read/render TOOLS (ae_comp_info,
// ae_layer_info, ae_render_frame) and their operation twins (comp.info,
// layer.info, render.frame). One body, two surfaces — what a batch.run child
// reports can never drift from what the standalone tool reports.
//
// Lives under src/operations/ so the jsx ES3 lint scans these template
// literals like any other generated code. Each snippet only DEFINES a
// function; the call site supplies the lookup preamble. Inside batch.run
// every child runs in its own IIFE, so two children defining the same
// function never collide.

/** Defines `_compInfo(c)` → the ae_comp_info payload for one comp. */
export const COMP_INFO_FN = `
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
        _ciOut.layers = _ciLayers;
        return _ciOut;
    }
`;

/** Defines `_layerFull(l, incl, detail)` → the ae_layer_info payload for one layer. */
export const LAYER_FULL_FN = `
    function _layerFull(l, incl, detail) {
        var _lfOut = AE.serializeLayerFull(l, { includeProperties: incl, detail: detail });
        _lfOut.ok = true;
        _lfOut.found = true;
        return _lfOut;
    }
`;

/** Defines `_renderFrame(c, timeSeconds, absOutPath, useDisplayStartTime)`. */
export const RENDER_FRAME_FN = `
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

/**
 * Defines `_missingSources(comp)` → the footage items a comp (and the comps
 * nested in it, each once) uses whose file is missing:
 * [{ id, name, path }]. ae_render_frame and ae_check_comp refuse to render
 * such a comp: the capture would show placeholder bars, not the piece.
 */
export const MISSING_SOURCES_FN = `
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

/**
 * Defines `_captureWithOcio(c, maxT, renderAll)`: in a colour-managed
 * project, lays a transient adjustment layer carrying AE's "OCIO Display
 * Transform" on top of `c`, calls renderAll("ocio") once (every capture of
 * the call shares the one layer) and removes the layer and its solid again.
 * `maxT` is the latest comp time captured, so the layer covers it. Returns
 * true when the OCIO capture ran; false (nothing captured) when the layer or
 * the effect could not be made — a pre-OCIO AE or the ICC colour engine — and
 * the caller captures directly. A throw from renderAll is swallowed here like
 * any other failure: the caller sees what renderAll recorded.
 */
export const OCIO_CAPTURE_FN = `
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

/** Defines `_listMissingFonts()` → the font.list_missing payload (project-wide, AE 24.0+). */
export const LIST_MISSING_FONTS_FN = `
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

/** Defines `_listMissingFootage()` → the footage.list_missing payload (project-wide). */
export const LIST_MISSING_FOOTAGE_FN = `
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

/**
 * Defines `_compCorners(layer, rect)` → the four corners of a layer-space
 * rectangle (sourceRectAtTime's {top, left, width, height}) in comp space,
 * through sourcePointToComp (AE 13.2+, documented for text layers). It
 * evaluates at the comp's CURRENT time: the caller sets comp.time and puts it
 * back (layer.bounds and ae_check_comp both do, in a finally).
 */
export const COMP_CORNERS_FN = `
    function _compCorners(layer, r) {
        return {
            topLeft: AE.valueToJson(layer.sourcePointToComp([r.left, r.top])),
            topRight: AE.valueToJson(layer.sourcePointToComp([r.left + r.width, r.top])),
            bottomLeft: AE.valueToJson(layer.sourcePointToComp([r.left, r.top + r.height])),
            bottomRight: AE.valueToJson(layer.sourcePointToComp([r.left + r.width, r.top + r.height]))
        };
    }
`;

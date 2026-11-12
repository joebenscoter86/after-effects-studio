const COMP_INFO_FN = `
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
const LAYER_FULL_FN = `
    function _layerFull(l, incl, detail) {
        var _lfOut = AE.serializeLayerFull(l, { includeProperties: incl, detail: detail });
        _lfOut.ok = true;
        _lfOut.found = true;
        return _lfOut;
    }
`;
const RENDER_FRAME_FN = `
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
const MISSING_SOURCES_FN = `
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
const OCIO_CAPTURE_FN = `
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
const LIST_MISSING_FONTS_FN = `
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
const LIST_MISSING_FOOTAGE_FN = `
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
const COMP_CORNERS_FN = `
    function _compCorners(layer, r) {
        return {
            topLeft: AE.valueToJson(layer.sourcePointToComp([r.left, r.top])),
            topRight: AE.valueToJson(layer.sourcePointToComp([r.left + r.width, r.top])),
            bottomLeft: AE.valueToJson(layer.sourcePointToComp([r.left, r.top + r.height])),
            bottomRight: AE.valueToJson(layer.sourcePointToComp([r.left + r.width, r.top + r.height]))
        };
    }
`;
export {
  COMP_CORNERS_FN,
  COMP_INFO_FN,
  LAYER_FULL_FN,
  LIST_MISSING_FONTS_FN,
  LIST_MISSING_FOOTAGE_FN,
  MISSING_SOURCES_FN,
  OCIO_CAPTURE_FN,
  RENDER_FRAME_FN
};

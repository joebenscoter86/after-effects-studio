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
export {
  COMP_INFO_FN,
  LAYER_FULL_FN,
  RENDER_FRAME_FN
};

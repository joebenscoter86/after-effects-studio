import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { jsxVal } from "../registry.js";
import { decodePng } from "./png16.js";
import { readFileSettled } from "./settled-read.js";
const CALIB_VALUES = [0.05, 0.18, 0.5, 1];
const PATCH = 40;
const cache = /* @__PURE__ */ new Map();
function calibrationKey(projectFile, workingSpace, bitsPerChannel) {
  return `${projectFile ?? "(unsaved)"}|${workingSpace}|${bitsPerChannel}`;
}
function analyzeCalibrationPng(buf) {
  const img = decodePng(buf);
  const samples = [];
  for (let i = 0; i < CALIB_VALUES.length; i++) {
    const x = PATCH * i + PATCH / 2;
    const y = Math.floor(img.height / 2);
    samples.push({ input: CALIB_VALUES[i], output: img.rgb[(y * img.width + x) * 3] });
  }
  const ratios = samples.map((s) => s.output / s.input);
  const min = Math.min(...ratios);
  const max = Math.max(...ratios);
  if (min > 0 && max / min < 1.03) {
    const scale = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    if (Math.abs(scale - 1) < 0.02) return { kind: "identity", scale: 1, samples };
    return { kind: "linear", scale, samples };
  }
  return { kind: "unknown", scale: 1, samples };
}
async function measureCaptureTransfer(transport, key, allowRender = true) {
  const cached = cache.get(key);
  if (cached) return cached;
  if (!allowRender) {
    return {
      error: "calibration needs a (transient, undo-grouped) render of a temporary comp, which read-only mode forbids"
    };
  }
  const pngPath = path.join(os.tmpdir(), `mcp-ae-calib-${randomUUID()}.png`).replace(/\\/g, "/");
  const code = `
        var _vals = ${jsxVal(CALIB_VALUES)};
        var _patch = ${jsxVal(PATCH)};
        var _w = _patch * _vals.length;
        var _tmp = app.project.items.addComp("__mcp_calibration__", _w, _patch, 1, 1, 24);
        var _srcs = [];
        var _out = { ok: true };
        try {
            for (var _i = 0; _i < _vals.length; _i++) {
                var _v = _vals[_i];
                var _s = _tmp.layers.addSolid([_v, _v, _v], "c" + _i, _patch, _patch, 1);
                if (_s.source) _srcs.push(_s.source);
                _s.property("Transform").property("Position").setValue([_patch * _i + _patch / 2, _patch / 2]);
            }
            _tmp.saveFrameToPng(0, new File(${jsxVal(pngPath)}));
            _out.saved = true;
        } catch (eCal) { _out.ok = false; _out.error = AE.errText(eCal); }
        try { _tmp.remove(); } catch (eRm) { /* leave for undo */ }
        for (var _j = 0; _j < _srcs.length; _j++) { try { _srcs[_j].remove(); } catch (eRs) { } }
        return _out;
    `;
  const result = await transport.execute({ code, label: "capture_calibration", timeoutMs: 6e4 });
  if (!result.ok) return { error: `calibration render failed: ${result.error}` };
  const payload = result.result;
  if (!payload || payload.ok !== true || payload.saved !== true) {
    return { error: `calibration failed inside AE: ${payload?.error ?? "no result"}` };
  }
  let buf;
  try {
    buf = await readFileSettled(pngPath);
  } catch (err) {
    return {
      error: `calibration PNG unreadable: ${err instanceof Error ? err.message : String(err)}`
    };
  } finally {
    fs.unlink(pngPath).catch(() => {
    });
  }
  try {
    const analysis = analyzeCalibrationPng(buf);
    cache.set(key, analysis);
    return analysis;
  } catch (err) {
    return {
      error: `calibration analysis failed: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}
export {
  analyzeCalibrationPng,
  calibrationKey,
  measureCaptureTransfer
};

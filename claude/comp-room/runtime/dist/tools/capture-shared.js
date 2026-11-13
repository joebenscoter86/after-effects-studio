import { measureCaptureTransfer, calibrationKey } from "../color/calibration.js";
import { profileForWorkingSpace, sceneLinearToDisplaySrgb } from "../color/transform.js";
import { readOnlyMode } from "../policy.js";
function validRgb(value) {
  return Array.isArray(value) && value.length === 3 && value.every((v) => typeof v === "number" && Number.isFinite(v)) ? [value[0], value[1], value[2]] : null;
}
async function colorConversion(payload, transport) {
  const workingSpace = payload.workingSpace ?? "None";
  try {
    if (workingSpace === "None" || workingSpace === "") {
      payload.colorPipeline = "untagged 16-bit \u2192 8-bit sRGB-tagged (values unchanged)";
      return () => {
      };
    }
    const calib = await measureCaptureTransfer(
      transport,
      calibrationKey(payload.projectFile ?? null, workingSpace, payload.bitsPerChannel ?? 8),
      !readOnlyMode()
    );
    const calibFailed = "error" in calib || calib.kind === "unknown";
    const gain = !calibFailed && calib.kind === "linear" ? 1 / calib.scale : 1;
    const applyGain = (rgb) => {
      if (gain !== 1) for (let i = 0; i < rgb.length; i++) rgb[i] *= gain;
    };
    if (payload.captureKind === "ocio") {
      if (calibFailed) {
        payload.colorWarning = `AE applied its display transform, but the capture scale could not be measured (${"error" in calib ? calib.error : "non-linear transfer"}) \u2014 the file is uniformly dark by that unknown scale. Verify colors against the AE viewer manually.`;
        return null;
      }
      payload.colorPipeline = "AE OCIO display transform (viewer-exact, any working space)" + (gain !== 1 ? ` + capture scale 1/${gain.toFixed(2)} restored` : "");
      return applyGain;
    }
    const profile = profileForWorkingSpace(workingSpace);
    if (profile === null) {
      payload.colorWarning = `working space '${workingSpace}' has no built-in conversion \u2014 the file contains raw working-space values and will not match the viewer. Verify colors against the AE viewer manually if they matter here.`;
      return null;
    }
    if (calibFailed) {
      payload.colorWarning = `could not characterize this AE version's capture transfer (${"error" in calib ? calib.error : "non-linear transfer"}) \u2014 the file contains raw working-space values. Verify colors against the AE viewer manually if they matter here.`;
      return null;
    }
    payload.colorPipeline = `${profile.note}` + (gain !== 1 ? ` (capture scale 1/${gain.toFixed(2)} restored)` : "");
    return (rgb) => {
      applyGain(rgb);
      sceneLinearToDisplaySrgb(rgb, profile.toRec709);
    };
  } catch (err) {
    payload.colorWarning = `color post-processing failed, file left as raw capture: ${err instanceof Error ? err.message : String(err)}`;
    return null;
  }
}
function iccManagedReason(workingSpace, bitsPerChannel) {
  return `The project is colour-managed (working space '${workingSpace}'${bitsPerChannel ? `, ${bitsPerChannel} bpc` : ""}, After Effects' own colour engine): colour readings here do not match the viewer (measured: an 8-bit grey of 128 read as 67, a neutral read L* 28 for 54, and spill turned its verdict), so they are refused. Alpha-based readings (edge widths, coverage, holes, specks, the file check) read the same as in a project with no working space and are given. For colour, measure in a copy of the project set to no working space at 8 or 16 bpc, or pass colorManaged: 'off' for the raw working-space values.`;
}
export {
  colorConversion,
  iccManagedReason,
  validRgb
};

// Shared by the capture tools (ae_render_frame, ae_check_comp): how a raw
// saveFrameToPng capture becomes the picture the viewer sees (stage
// 'output', display values), decided once per call.
import { measureCaptureTransfer, calibrationKey } from "../color/calibration.js";
import { profileForWorkingSpace, sceneLinearToDisplaySrgb } from "../color/transform.js";
import { readOnlyMode } from "../policy.js";
export function validRgb(value) {
    return Array.isArray(value) &&
        value.length === 3 &&
        value.every((v) => typeof v === "number" && Number.isFinite(v))
        ? [value[0], value[1], value[2]]
        : null;
}
/**
 * Decide how the captures are converted to viewer-accurate sRGB (see the
 * tool description for the three pipelines) and return the conversion,
 * applied in place to RGB only — alpha is coverage, not colour, and is never
 * converted. Reports through payload.colorPipeline / payload.colorWarning;
 * returns null (and never throws) when the files must stay raw.
 */
export async function colorConversion(payload, transport) {
    const workingSpace = payload.workingSpace ?? "None";
    try {
        if (workingSpace === "None" || workingSpace === "") {
            // Values are already display-referred; the only fix needed is an
            // explicit color tag so viewers stop guessing at the 16-bit file.
            payload.colorPipeline = "untagged 16-bit → 8-bit sRGB-tagged (values unchanged)";
            return () => { };
        }
        const calib = await measureCaptureTransfer(transport, calibrationKey(payload.projectFile ?? null, workingSpace, payload.bitsPerChannel ?? 8), !readOnlyMode());
        const calibFailed = "error" in calib || calib.kind === "unknown";
        const gain = !calibFailed && calib.kind === "linear" ? 1 / calib.scale : 1;
        const applyGain = (rgb) => {
            if (gain !== 1)
                for (let i = 0; i < rgb.length; i++)
                    rgb[i] *= gain;
        };
        if (payload.captureKind === "ocio") {
            if (calibFailed) {
                payload.colorWarning =
                    `AE applied its display transform, but the capture scale could not be measured (${"error" in calib ? calib.error : "non-linear transfer"}) — ` +
                        "the file is uniformly dark by that unknown scale. Verify colors against the AE viewer manually.";
                return null;
            }
            payload.colorPipeline =
                "AE OCIO display transform (viewer-exact, any working space)" +
                    (gain !== 1 ? ` + capture scale 1/${gain.toFixed(2)} restored` : "");
            return applyGain;
        }
        // Direct capture of a color-managed project (read-only mode, or an AE
        // without the OCIO effect): pure-math fallback for the working spaces we
        // know, verified within ~1.7/255 of the viewer on ACES/ACEScg.
        const profile = profileForWorkingSpace(workingSpace);
        if (profile === null) {
            payload.colorWarning =
                `working space '${workingSpace}' has no built-in conversion — the file contains raw working-space ` +
                    "values and will not match the viewer. Verify colors against the AE viewer manually if they matter here.";
            return null;
        }
        if (calibFailed) {
            payload.colorWarning =
                `could not characterize this AE version's capture transfer (${"error" in calib ? calib.error : "non-linear transfer"}) — ` +
                    "the file contains raw working-space values. Verify colors against the AE viewer manually if they matter here.";
            return null;
        }
        payload.colorPipeline =
            `${profile.note}` + (gain !== 1 ? ` (capture scale 1/${gain.toFixed(2)} restored)` : "");
        return (rgb) => {
            applyGain(rgb);
            sceneLinearToDisplaySrgb(rgb, profile.toRec709);
        };
    }
    catch (err) {
        payload.colorWarning = `color post-processing failed, file left as raw capture: ${err instanceof Error ? err.message : String(err)}`;
        return null;
    }
}
//# sourceMappingURL=capture-shared.js.map
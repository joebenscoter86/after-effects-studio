// Keying operations (agent-eyes plan, stage 6): Keylight from measured values,
// its views, and the cleanup effects after it. Every effect and property is
// addressed by matchName, never by display name. Match names, defaults, ranges
// and the eleven view numbers are the ones After Effects 2027 reported live
// (2026-11-10, an 8 bpc project with no working space). Every write goes
// through AE.checkPropertyWrite (stage 5) for all values first, so a refused
// value means nothing was written.
//
// The operations live in seven files by family, moved here unchanged (the keying split). This file imports first the
// modules it always imported for their values (a type-only import never loaded one), in the same order, then the seven
// files: every module evaluates, and every operation registers, in the order it always did. It exports what it always
// exported.
import "node:child_process";
import "node:fs";
import "node:path";
import "../color/matte.js";
import "../color/png16.js";
import "../color/sheet.js";
import "../config.js";
import "../registry.js";
import "./render.js";
import "../tools/render-frame.js";
import "../tools/capture-shared.js";
import "./keying-key.js";
import "./keying-subject-prepare.js";
import "./keying-subject-check.js";
import "./keying-subject-cutout.js";
import "./keying-subject-soften.js";
import "./keying-reference.js";
export { OBJECT_MATTE_MATCH_NAME, OBJECT_MATTE_SELECTIONS_MATCH_NAME, SUBJECT_WHOLE_PIECE_NOTE, CLOSE_CLICK_SHARE, CUTOUT_HOLE_LIMIT, CUTOUT_SECONDS_PER_FRAME, alikeRegions, acceptedBy, cutoutFindings, statfsFree, cacheBytesFor, aeCacheRoot, fillUnbuildJsx, fillBuildJsx, CHECK_FILE_MAX_FRAMES, SOFT_EDGE_DEFAULTS } from "./keying-shared.js";
export { KEYLIGHT_MATCH_NAME, KEY_CLEANER_MATCH_NAME, SPILL_SUPPRESSOR_MATCH_NAME, KEYLIGHT_VIEWS, KEYLIGHT_SETTINGS, KEY_CLEANER_SETTINGS, SPILL_SUPPRESSOR_SETTINGS, keylightViewNumber } from "./keying-key.js";
export { OBJECT_MATTE_SETTINGS, SUBJECT_ATTENDED_NOTE, SUBJECT_MATTE_NOTICE, subjectMatteSteps, selectionKind, OVERSIZE_FACTOR, sourceAdviceFor, soundAdviceFor, runSubjectPrepare, diskReport } from "./keying-subject-prepare.js";
export { closeClicks, runSubjectCheck, runFillGaps } from "./keying-subject-check.js";
export { HALVES_JOIN_NOTE, cutoutSpan, RENDER_MARGIN_BYTES, renderCutoutBytes, chooseAlphaTemplate, renderCutoutPlanJsx, renderCutoutJsx, runRenderCutout, CHECK_FILE_JUMP_LIMIT, checkFileFrames, SPECK_SKIN_A, SPECK_PALE_A, runCheckFile, useCutoutJsx } from "./keying-subject-cutout.js";
export { SOFT_EDGE_COST, softRegionBottom, softenBuildJsx, softenUndoJsx, runSoftenEdge } from "./keying-subject-soften.js";
export { runReferenceReport, runReferenceCompare } from "./keying-reference.js";
//# sourceMappingURL=keying.js.map
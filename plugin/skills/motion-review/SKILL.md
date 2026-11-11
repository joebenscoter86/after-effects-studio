---
name: motion-review
description: Review After Effects motion graphics for composition, typography, timing, continuity, editability, and final export quality. Use to diagnose flat animation, clipping, generic motion, weak hierarchy, broken renders, or delivery readiness, and to review a finished piece someone else built before it is handed over.
---

# Motion review

Read `review`, `quality` and `failure-atlas` through `ae_library`; use `reference-study` when judging against a reference. Inspect actual frames and timing, not just layer counts or a script. During review-only requests make no project changes; provide specific defects and the smallest useful corrections. During a build, fix issues in scope and re-render the affected section.

When you review a finished piece, as the build skills require before hand-over, work only from the brief, the `ae_check_comp` report, the frames and the comp. Set aside any builder notes or list of fixes you were given.

1. Run `ae_check_comp` on the whole delivered comp (again with `next.startFrame` until `next` is null) and look at its sheet. Judge each flag against the brief: a defect, or intended, with the reason.
2. Render full-size frames where the flags, the brief's cuts and beats, and the reading holds point. Look for what raises no flag: colour against the plate, edges round cutouts, focus, hits against their marker times, copy against the brief.
3. Say what you reviewed (project, comp, version, times, export), then return defects most noticeable first, each with time and frame, where in the frame, what a viewer sees, the evidence (file or number) and a severity: `first-watch`, `careful-watch` or `polish`. Then say what you could not judge. `review` has the scale and the hand-over.

Check message clarity, hierarchy, typography, staging, pacing, spatial continuity, asset and edge quality, and render correctness. Distinguish technical validation, visual judgment and user approval. Give no scores and no pass or fail. Event density is a craft choice. A technically clean but generic result is not ready if the brief demands distinctive motion. A gorgeous still does not prove motion pacing or audio sync; report unperformed playback and audio checks plainly.

To check motion: `ae_render_frame` with `strip: { at, frames }` renders the frames around a moment into one sheet with `diff` on (frame-to-frame change, and pops, stutters and cuts flagged), `diff` with `times` does the same for chosen times, and `render.preview` (through `ae_do`) renders a quick movie to watch at speed. The flags are hints from numbers; watch the movie before judging pacing.

For animated text, read typography-technique and typography-recipes. Check actual glyphs/resolved fonts, full copy, meaningful line breaks, optical spacing, source versus screen bounds, accent clearance and settled reading time. Verify editable text and original-copy traceability after replacement. Report taste judgments in words; do not turn a score or successful helper call into visual acceptance.

For paper collage, read paper-collage-style and paper-collage-recipes. Inspect cutout alpha and paper edges over contrasting backgrounds, contact/offset shadows, overlap order, seam continuity, material consistency and text clearance at full resolution. A smooth label beside stepped paper can be intentional; do not treat matched cadence as a default requirement. Verify the supplied-asset rights record or the disclosed native-only fallback, and keep full-speed perceptual judgment separate from helper success.

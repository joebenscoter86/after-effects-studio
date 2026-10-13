# AFT-17 — native type study, task-aware run

On 2026-10-10 (America/Los_Angeles), the installed After Effects Studio `0.1.0+codex.20261009184954` controlled AE 26.5x89 on macOS 26.6.2 (25G83). This was a task-aware continuation in the development workspace, **not an independent fresh-agent session**. The source base was `e8b58fd58955866a1da7f31d11c9407947a5fc57` plus substantial uncommitted work. No personal rig, external art or private Content asset was used. The [execution brief](brief.md) is derived from the prepared [AFT-17 type fixture](../../fixtures/2026-10-10-portable-type-brief.md). Packaged library reads covered `motion-language`, `production-workflow`, `brief-template`, `type-evidence`, `quality`, `failure-atlas`, `scripting` and `motion-jsx` before construction.

## Preflight and ownership

`ae_version_info` found an untitled, zero-item, 16-bpc AE project with no active composition. The user explicitly made AE fresh for this work. One controller operated AE. All new items used the `AFT17_TYPE_` prefix. The owned comp is `AFT17_TYPE_MARGIN03_v1_20261010` (ID 13), 1920×1080, 30 fps, seven seconds; its twelve native layers are six separate editable letters (IDs 28–33), slash (34), `03` (35), rule shape (36), payoff text (37), top label (38) and background (27). The solid footage item is ID 26. Helvetica Neue variants were enumerated before use. No unrelated project content was present or touched.

## Action and review

| Step | Action | Result |
|---|---|---|
| Build | Ran [build-v1.jsx](build-v1.jsx) in the empty project, then saved `margin-03-v1-diagnostic.aep`. | Native letters, rule, index and payoff were editable. |
| First render review | Rendered broad frames and inspected `v1-broad_sheet.png`. | **Failed visually:** the rule swept diagonally across the title near 2.7 s. The initial layout was not accepted. |
| Correction | Guarded [correct-rule.jsx](correct-rule.jsx) against a different project, comp or layer ID. The first guard attempt used ExtendScript `File.fullName` and failed before mutation because that value was `~/...`; switching to `File.fsName` located the actual file. Corrected only rule ID 36, then rendered dense samples and a full-size hold. | Rule now tracks below the title and turns into an upright tick beside `03`; the dense sheet showed no title crossing. Corrected v1 AEP saved. The exact first executed guard is preserved only in ignored raw evidence; the tracked copy uses a portable suffix guard. |
| v1 delivery | Rendered native H.264 movie and played all seven seconds in QuickTime. | 1920×1080, 30 fps, 210 frames; complete decode passed. |
| Revision | Changed payoff ID 37 from `Notes in motion.` to `Ideas with a place to land.` and recolored rule ID 36 from cobalt to muted orange; kept the other ten layers and the timing geometry. Measured payoff bounds and inspected broad/full-size v2 frames. | The longer line fits, title remains readable and the rule does not cross text. |
| v2 delivery | Rendered native H.264 movie, verified both distinct movie outputs, removed only the two verified owned completed render-queue entries, saved v2 AEP, reopened it, and rendered a 4.2 s frame. | Reopen retained 3 project items, all 12 layers and 0 missing fonts; queue empty. Reopened frame SHA-256 exactly matches the pre-reopen 4.2 s frame. v2 movie completed full decode and seven-second QuickTime playback. |

The native render queue reported `rendered: 2` during v2 export. Inspecting queue status and both movie files showed this was the cumulative count of two completed items, not a v1 overwrite. A five-second extraction from each file showed the separate blue/old-copy and orange/new-copy results. Both completed queue entries were verified owned before removal. The reopened v2 project remains loaded and clean.

## Checks

| Dimension | Result | Evidence |
|---|---|---|
| Runtime and native structure | Pass | Stable IDs 27–38, 12 layers, 3 project items after reopen; targeted edit left ten other layers in place. |
| Project preservation | Pass for this fixture | Started from a user-provided empty project; no unrelated content existed. |
| Rendered frames and type | Pass after correction | `v1-corrected-dense_sheet.png`, `v1-corrected-hold.png`, `v2-broad_sheet.png`, `v2-broad_7.png`, and movie hold frames inspected. Initial diagonal-rule failure retained as `v1-broad_sheet.png`. |
| Full-speed playback | Pass for visible pacing | Both seven-second movies played through in QuickTime. Silent brief; no audio judgment. |
| Editable AEP reopen | Pass | v2 reopened with twelve layers, no missing fonts, empty queue; 4.2 s frame hash equal before/after reopen (`b0a626a28ea0e5630fa240f1cd6febff1d3d0bb5e1f8a18c469f964cdea3d3c6`). |
| Movie metadata and full decode | Pass | Both H.264, 1920×1080, 30 fps, 210 frames, 7.000 s; `ffmpeg -v error -i <movie> -f null -` exited 0 for each. |
| Joe's creative acceptance | Pass for v2 | Joe reviewed the revised movie and said “looks great” on 2026-10-10. |

## Delivered local evidence and limits

Ignored local artifacts reside in `quality/renders/2026-10-10-portable-type-native/`. Corrected v1: `margin-03-v1-corrected.aep` (SHA-256 `b4f049d1fb7f2078886e685282c2a709599785854b314bde01133dac9c8d66b0`) and `margin-03-v1-corrected.mp4` (`a5af11060c2739b3a5cfe428195ddfe30cff6ef5e7d55819d090c6206a1d6782`). Revised v2: `margin-03-v2.aep` (`452d887af5cd125e09f60eef766b476eb11aae07693d39b8ffa2488d21666f1d`) and `margin-03-v2.mp4` (`7badbda85e66d6d1c4b7db67aa31fa54340128ca2603b86395a8867b09b8808f`). These hashes identify local evidence, not publicly delivered copies.

This proves a native, editable type build and targeted revision with visual, playback, reopen and Joe acceptance checks on the installed candidate. It does **not** close AFT-17's independent fresh-session, multi-style transfer requirement, the separate causal fixture, AFT-9's naturally occurring uncertain-write recovery requirement or second-Mac installation. Keep AFT-17 open.

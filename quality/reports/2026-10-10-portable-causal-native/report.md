# 2026-10-10 — fresh-session portable causal study

Current ticket disposition (D-012): AFT-17 is Done on the combined [three-style comparison](../2026-10-10-portable-craft-comparison/report.md). The open-ticket statements below describe this study before the dependency correction; its pacing and version limits remain factual.

AFT-17 / B-17, requirements R-05 and R-06. The installed candidate produced an editable, eight-second fictional temperature-control diagram and a coordinated nine-frame timing revision. Native structure, before/after reopen, causal timing, and export checks passed. Rendered-frame review supports a legible diagram with consistent contact geometry. Full-speed playback ran from start to end and was observed through live samples; continuous perceptual pacing review remains separate. Joe subsequently confirmed the revised sequence reads clearly. This is one causal fixture on the development Mac, not completion of the three-style assessment or public-release gates.

## Run identity and inputs

- Operator: fresh Codex task, with repository map and general AE workflow context. No prior AFT-15 script, AEP, contact sheet or Content asset was read or used. A different type study was incidentally visible in a QuickTime file dialog after this design/build, and was not used as a reference.
- Date/time zone: 2026-10-10 America/Los_Angeles; export metadata is UTC on 2026-10-11.
- Host: development Mac, macOS 26.6.2 (25G83); AE 26.5x89/build 89; shell Node 25.9.0. Codex application build was not captured. No clean-machine or permission-reset claim.
- Source HEAD: e8b58fd58955866a1da7f31d11c9407947a5fc57, with substantial pre-existing working-tree changes. This run added its own evidence only; plugin source and library were not changed.
- Installed candidate: 0.1.0+codex.20261009184954 at <local-home>/.codex/plugins/cache/personal/after-effects-studio/0.1.0+codex.20261009184954.
- Installed payload tree SHA-256: f51b34be7e378c9e9776e3b4f4593ed35e41e9d57447cf685e8742d20e6613eb. This is a deterministic digest over 54 file paths and hashes, not an archive hash. No symlinks were found. The manifest, MCP launcher, bundled runtime and JSX files are included in [package-verification.json](package-verification.json). The launcher imports its own runtime/dist/index.js.
- Request: [fresh causal fixture](../../fixtures/2026-10-10-portable-causal-brief.md). Authored direction before native writes: [brief.md](brief.md).
- Packaged ae_library reads: motion-language, production-workflow, brief-template, construction, quality, failure-atlas and scripting; see [library-read-log.json](library-read-log.json). Local motion-studio, ae-control and motion-review skills supplied execution/review routing.
- Inputs: no supplied artwork, footage, personal rig or real data. Native shape/text content, installed ArialMT and Arial-BoldMT. Values are visibly identified as illustrative.
- Heavy evidence: quality/renders/2026-10-10-portable-causal-native/ (ignored by Git). No publication or remote media delivery occurred.

## Preflight and ownership

[preflight.json](preflight.json) records an untitled project, dirty=false, zero items, 16 bpc, and no active composition. No unrelated content was present. This task was the sole AE controller under the handoff arrangement. No permission prompt or uncertain native write occurred.

Owned composition ID 1 is AFT17 | THRESHOLD | MASTER, 1920×1080, 30 fps, 8 seconds, with 30 layers. Authored composition/layer names have the AFT17 prefix; AE automatically created its standard Solids folder (ID 13) and Null 1 source (ID 14) for the controls layer. These standard source names are a small naming exception, not unrelated work. Individual layer IDs and native properties are in both native audits.

Stop conditions were unrelated or changed project ownership, ambiguous targets, modal interruption, or uncertain completion. Reopening was limited to the two saved, owned AEPs after checking current path and clean state. Nothing unrelated was closed, cleared or deleted.

## Executed actions

Sequence is recorded below; individual tool-call wall-clock timestamps were not retained. Movie creation times and file hashes are retained separately.

| Order | Action / tool | Result |
|---|---|---|
| 1 | ae_context, ae_catalog, ae_library; installed-font query | Verified empty project, operation contracts, packaged guidance and fonts. |
| 2 | eval.run with build-v1.jsx | Created native gauge, controls, signal route, receiver, vent and text. Static camera; an actual background layer supplies the pale field. |
| 3 | render.frame and native expression audit | Found receiver color expression dimension error and an unhelpful closed label during opening. |
| 4 | eval.run with correct-v1.jsx; audit and frame review | Added alpha to expression color arrays and introduced a single OPENING state. Final audits contain no expression errors. |
| 5 | render.add_to_queue / render.start; ae_save_project | Rendered v1 using installed Best Settings / High Quality, then saved the reviewed native project. Native ProRes creation time 2026-10-11 04:56:24 UTC. |
| 6 | ffmpeg extraction; view_image; QuickTime playback | Reviewed v1 broad/dense decoded frames, full-size type and actual normal-speed playback samples. |
| 7 | eval.run with revise-v2.jsx | Changed only the temperature key timing and threshold-frame control. Kept composition/layer IDs, layout, palette, numeric values and final state. |
| 8 | Native audit, queue/render/save and H.264 conversion | Rendered/saved v2, inspected its broad/dense frames and full-size final image, and ran normal-speed playback. |
| 9 | project.open; stable-ID native audit; missing-font/media queries; render.frame | Reopened v2 cleanly; 5,606 property records, layers and all 240 sampled frames matched its pre-save audit. Zero missing fonts/media. Reopened final native PNG visually inspected. |
| 10 | project.open v1; full audit; project.open v2 | Verified saved v1 also exactly matches its original audit, including all sampled values. Left v2 open, clean, with the same 3 project items and 30 layers. |
| 11 | ffprobe, full ffmpeg decode, SHA-256 | All four movie files pass. AEP/movie/still/sheet fingerprints captured. |

The reconstruction scripts are run-specific evidence, not end-user dependencies. No packaged-guidance change was warranted by the two ordinary authoring/audit errors.

## Causal revision comparison

Zero-based frame numbers at 30 fps. The numeric display floors the rising value so it cannot show 26 before the threshold. Signal position and trim follow the same measured 780-pixel path, including both corners and the receiver at [1260,560]. Opening begins after arrival; the final label switches only at full opening.

| Event | v1 | v2 | Delta |
|---|---:|---:|---:|
| Rise starts at value 20 | 45 | 45 | 0 |
| Value reaches 26; signal becomes visible | 105 | 114 | +9 |
| Value reaches 28 | 125 | 134 | +9 |
| Signal reaches receiver | 135 | 144 | +9 |
| Opening interval starts; OPENING label | 136 | 145 | +9 |
| First sampled nonzero louver movement | 137 | 146 | +9 |
| Fully open; VENT OPEN label | 159 | 168 | +9 |

The preserved f45 start means the approach to 26 is slightly slower; subsequent causal phases shift together without changing their durations. [revision-comparison.json](revision-comparison.json) shows two differing property records among 5,606: temperature slider key times and threshold-frame slider value. Layer records and composition metadata match. Both reopen checks independently confirm that the delivered AEPs preserve their respective native audits.

## Visual evidence and judgment

The restrained palette, fixed gauge anchor, clear threshold marker and physical receiver make the cause/effect readable. The route stays registered through its corners; the vent remains closed until contact; one status text layer prevents old/new-label overlap. Typography and edge detail are legible in the inspected full-size decoded/native frames. This is a modest geometric study, not a comparative claim of superior craft.

Reviewed contact sheets for each version are linked below. Every listed dense interval includes each frame unless an explicit list is given.

| Sheet | v1 frame coverage | v2 frame coverage |
|---|---|---|
| broad | 0, 12, 24, 40, 45, 75, 105, 120, 135, 147, 159, 239 | corresponding construction and revised action/payoff samples |
| threshold | 102–110 | 111–119 |
| travel | 116–124 | 125–133 |
| contact | 132–140 | 141–149 |
| opening / label | 137, 140, 144, 148, 152, 156–162 | same indices +9 |

See [sheet-generation script](make-review-sheets.py) for exact tile lists and [artifact-hashes.json](artifact-hashes.json) for fingerprints. All 240 frames per version were extracted, but this report does not claim visual inspection of every extracted frame.

QuickTime played both complete MP4s at normal speed. Live screenshots and elapsed/timeline samples near 0.5, 2, 4, 6 and 8 seconds verified ongoing playback and arrival at the final state; [playback-observations.json](playback-observations.json) records the method and observed times. Some live UI captures showed transient text gaps absent from inspected decoded files and native stills. Their cause was not established; this limits the live-capture judgment. Continuous human perception of motion smoothness/pacing is not established by these samples. No audio was requested or present.

## Check results

| Dimension | Result | Evidence and limit |
|---|---|---|
| Runtime and native structure | Pass | Native 30-layer scene; zero final expression errors; all 240 frame samples; causal event ordering. |
| Existing/unsaved project preservation | Pass for this precondition | Began with zero items. No unrelated-project preservation stress test claimed. |
| Rendered frames and full-size edge/type inspection | Pass in inspected frames | Broad and dense sheets, decoded v2 f168, initial/corrected native frames and reopened native final PNG. |
| Full-speed playback, pacing and audio | Partial | Complete normal-speed playback executed with live samples. Continuous pacing/smoothness assessment remains unverified; silent as requested. |
| Editable AEP reopen and linked assets | Pass | Both AEPs match their native property/layer/sample audits. Final v2 reports zero missing fonts/media and dirty=false. |
| Metadata, full decode and fingerprints | Pass | Four movies: 1920×1080, 30 fps, 240 frames, 8 seconds, no audio. ffmpeg full decode returns 0 with empty error output. SHA-256 recorded. No separate delivered-copy transport to compare. |
| Joe's creative acceptance | Pass for clarity of revised v2 | After viewing the revised movie, Joe answered “yup” when asked whether the causal sequence reads clearly. This does not separately establish smoothness or pacing quality. |

## Failures, corrections and final state

1. Receiver fill expression initially failed with “expression result must be of dimension 4, not 3”. RGB arrays were corrected to RGBA. The initial diagnostic still is retained; final native audits and re-rendered movies use the correction.
2. A VENT CLOSED label persisted during opening. It now changes to OPENING after contact and VENT OPEN only at the final pose. This was corrected before the reviewed v1 movie.
3. First reopen audit assumed project item index 1 was the composition. AE reordered its project items on reopen, placing the Solids folder first. The read-only audit failed; current context verified composition ID 1, and audit-native.jsx now resolves that stable ID. Both subsequent reopen audits pass. No native item was modified to accommodate the audit.
4. Initial metadata reporting encountered a Python KeyError on codec_name for the timecode data stream. The reporting code was corrected to accept absent codec fields, then all four full-decode checks completed. This was a verifier issue, not a movie decode failure.
5. A UI screenshot-resize helper import failed; direct UI snapshots were used instead. An initial QuickTime open-dialog shortcut sequence needed state-based recovery. Neither changed the AE project.

No cleanup removed authored evidence. Final AE state is threshold-v2.aep, clean, with the owned composition and its native source items. QuickTime has the revised MP4 available. No plugin/runtime/library source, license, distribution setting or release listing was changed.

## Deliverables

| Version | Editable project | Master | Review movie |
|---|---|---|---|
| Before | [threshold-v1.aep](../../renders/2026-10-10-portable-causal-native/threshold-v1.aep) | [ProRes MOV](../../renders/2026-10-10-portable-causal-native/threshold-v1.mov) | [H.264 MP4](../../renders/2026-10-10-portable-causal-native/threshold-v1.mp4) |
| After | [threshold-v2.aep](../../renders/2026-10-10-portable-causal-native/threshold-v2.aep) | [ProRes MOV](../../renders/2026-10-10-portable-causal-native/threshold-v2.mov) | [H.264 MP4](../../renders/2026-10-10-portable-causal-native/threshold-v2.mp4) |

Native masters are Apple ProRes 422 Standard, 10-bit 4:2:2; review copies are H.264 High, 8-bit 4:2:0, CRF 16. Both retain BT.709 tags and timecode data. Project uses 16 bpc and working space None; this does not prove calibrated cross-display color.

- [v1 broad sheet](../../renders/2026-10-10-portable-causal-native/v1-broad-sheet.jpg), [threshold](../../renders/2026-10-10-portable-causal-native/v1-threshold-sheet.jpg), [travel](../../renders/2026-10-10-portable-causal-native/v1-travel-sheet.jpg), [contact](../../renders/2026-10-10-portable-causal-native/v1-contact-sheet.jpg), [opening](../../renders/2026-10-10-portable-causal-native/v1-opening-sheet.jpg).
- [v2 broad sheet](../../renders/2026-10-10-portable-causal-native/v2-broad-sheet.jpg), [threshold](../../renders/2026-10-10-portable-causal-native/v2-threshold-sheet.jpg), [travel](../../renders/2026-10-10-portable-causal-native/v2-travel-sheet.jpg), [contact](../../renders/2026-10-10-portable-causal-native/v2-contact-sheet.jpg), [opening](../../renders/2026-10-10-portable-causal-native/v2-opening-sheet.jpg).
- [Reopened native final frame](../../renders/2026-10-10-portable-causal-native/v2-reopened-final.png).
- [Before native audit](../../renders/2026-10-10-portable-causal-native/native-v1.json), [after native audit](../../renders/2026-10-10-portable-causal-native/native-v2.json), [before reopen](reopen-v1-verification.json), [after reopen](reopen-verification.json), [export verification](export-verification.json). The complete audits are ignored local evidence because each exceeds 1 MiB.

AFT-17 remains In Progress. This adds one independently authored causal transfer/revision result for the installed payload, with Joe's acceptance of its clarity. The complete three-style comparison, continuous creative pacing review, and the ticket's AFT-14–AFT-16/AFT-9 dependency chain remain separate. No clean-machine, recovery, licensing or release-readiness gate is closed by this run.

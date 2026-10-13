# AFT-27 — accepted late revision and capability result

2026-10-11, America/Los_Angeles. Joe's approved [late revision](late-revision-request.md) is complete as a separate editable v2. The same nine native blades now unfold into a clearly different three-row arrangement during **Shape the landing**, with coordinated landing order, marker travel and center accent. The complete 24-second export and reopened AEP have been checked. After viewing v2, Joe said “this is perfect. looks like a professional motion graphic marketing video.” That is creative acceptance of this scoped film and its late revision, not publication or a claim that every motion brief is supported. AFT-27's declared capability probe passes within the limits below.

## Review files

All heavy outputs remain local and Git-ignored under `quality/renders/2026-10-10-capability-probe/`.

- [v2 review movie](../../renders/2026-10-10-capability-probe/after-effects-studio-v2.mp4)
- [v2 editable package: AEP, linked artwork, generator and movie](../../renders/2026-10-10-capability-probe/after-effects-studio-v2-editable.zip)
- [v2 AEP](../../renders/2026-10-10-capability-probe/after-effects-studio-v2.aep)
- [v2 ProRes master](../../renders/2026-10-10-capability-probe/after-effects-studio-v2.mov)
- [Normal-speed playback evidence sheet](../../renders/2026-10-10-capability-probe/playback-v2/normal-playback-sheet.jpg)
- [v1 evidence and original movie links](report.md)
- [Predeclared v2 plan](revision-plan-v2.md)

## Exact candidate and preservation

Used the same installed candidate `0.1.0+codex.20261011051151`; 54 of 54 payload files matched the packaged archive. Archive SHA-256 remains `4db855ec8596b8d4cad6d5a347fbd7ae03fb635adeb31c0abad8bedd63bf98ee`. No plugin/runtime/library edits were made for this revision. The host remains the development Mac; this is not clean-machine evidence.

Before writes, AE showed a different saved, clean 38-item project. Its path and before/after hash are retained only in ignored preservation evidence. Opened the exact saved v1, captured its native state, and saved v2 separately before edits. The unrelated project's disk hash and all four baseline v1 files (AEP, MOV, MP4, native JSON) remained unchanged. One controller operated AE. No private rig or asset was imported.

## Revision and native results

Blade IDs 65–73 persist, with the same paths and fills. The radial arrangement opens into three rows of three parallel fins. The column-first order is blade 1, 4, 7, 2, 5, 8, 3, 6, 9. Each movement lasts 27 frames, starts five frames after the previous part, and lands at frames 390, 395, 400, 405, 410, 415, 420, 425 and 430. The last landing is 14.333 seconds. The marker crosses its line over that landing sequence and reaches the endpoint with the last part; the center accent pulses on each landing. The completed arrangement holds until 17 seconds, then eases into the original editable-parts layout by 18.5 seconds.

The linked surface and its native rim move left and shrink together to make room for the rows. Shortest-equivalent rotations keep the fins from making unnecessary full turns. Native landing readback confirms every destination, 78% scale and equivalent 20-degree final orientation. Text, font, assets, 24-second duration and native path/keyframe content were retained.

Reopened v2: five project items, two comps, 48 layers, 26 native shape layers, 19 text layers, 362 keyed values and 37 enabled expressions. Zero expression errors at the revised pose, zero missing footage and zero substitute fonts. Both Avenir Next faces remain installed. The full native JSON comparison contains only 36 changed transform-expression strings, project filename and export timestamp; all other serialized properties match the baseline. The expressions remain editable, though this is more complex to hand-edit than a simple keyframe-only rig. The final AEP and `native-v2-final.json` are authoritative; `revise-v2.jsx` is the initial patch before visual corrections.

## Invariant comparison

The declared protected intervals are frames 0–359 and 645–719: the complete pre-refinement sequence and final end-card hold. Across all 435 frames and all 48 layers, evaluated position, scale, rotation, opacity, IDs, names and layer spans match v1 exactly. Evidence: `v1-invariant-samples.json`, `v2-invariant-samples.json`, `v2-native-invariant-comparison.json` and `v2-native-full-diff.json`.

Decoded ProRes frames are **not bit-identical**: the first hash comparison failed on every frame, including protected frames. Follow-up compared RGB pixels for all 435 protected frames. Worst per-frame mean absolute channel difference is 0.1281 on the 0–255 scale; maximum individual channel difference is 10. At worst one channel value among 6,220,800 exceeds a difference of 8 in a frame. Render/output settings agree between v1 and v2. These small differences are consistent with render/encoding variation; their exact origin was not isolated. The exact native comparison and inspected side-by-side opening image support visual preservation, not byte-identical image output. Full metrics are in `v2-decoded-pixel-metrics.json`; the failed hash check is retained in `v2-decoded-frame-comparison.json`.

## Actual visual review

Inspected the draft poses and a four-pose correction sheet, then all 216 decoded frames from f354 through f569 (11.8–18.967 seconds) in fourteen dense sheets. This covers entry into the revision, every part movement and landing, the hold, and the transition back to the established editable handoff. Also inspected the final landed arrangement at full resolution and a side-by-side opening comparison.

Selected QuickTime's **Normal** speed, played the entire MP4 from zero to its 24-second end without seeking or pausing, saved thirteen live screenshots at roughly two-second intervals, and inspected their sheet. Final UI state confirmed timeline 24 seconds and playback stopped. This is actual normal-speed playback reviewed through live samples, not continuous human perceptual assessment. The brief is silent; no audio judgment is claimed.

Visual judgment: the new arrangement reads much more clearly than v1's subtle settling. The large shape change carries the refinement beat even when the landing marker is small. The compact unfolding has brief overlaps between moving fins, and the surface crosses behind the lower fins during the editable handoff; they resolve into separated parts without a persistent collision or visible clipping in the inspected output. The weakest remaining feature is the small secondary marker/labels at product-page scale. The film remains a restrained abstract geometric demonstration, not evidence of photoreal or unlimited creative capability. Joe accepted the revised result as a professional motion graphic marketing video for this brief.

## Corrections, failures and effort

One initial native revision pass and one corrective pass were needed. Draft review caught excessive rotation travel and an accent that did not follow the surface during the exit. Corrected to nearest equivalent rotations and made the accent follow the surface until its existing fade. No native operation failed or timed out during v2; no human AE authoring was required. QuickTime navigation needed a refreshed file-dialog state and exact path entry. The failed frame-hash comparison and its measured follow-up are recorded above.

A fresh render-queue item produced the actual v2 MOV in 26.171 seconds. The response's `rendered: 3` denotes queue count and is not proof of three new outputs; file existence, metadata and complete decode provided the evidence. AFT-29 remains the separate render false-success issue. Active revision through playback, comparison and packaging took about ten minutes, plus final report/audit preparation; the exact final elapsed measurement is in `v2-run-timing.json`.

## Delivery checks and remaining gate

MOV and MP4 are both 1920×1080, 30 fps, 720 frames, 24.000 seconds, with no audio. MOV is ProRes 422 Standard; MP4 is H.264 High/yuv420p. Both full ffmpeg decodes exited zero with empty error output. ZIP members were compared byte-for-byte with the AEP, artwork, generator and review movie; no fonts are distributed. Metadata, decode results and all delivery hashes are in `v2-export-verification.json` and `v2-delivery-hashes.json`.

- AEP SHA-256: `cb8e6fdb28b4d33caa1fd26cd8a524c52aaff4f12eaee02136e3cfa14ba3cde8`.
- MOV SHA-256: `6544476438a8910b2ae752003143b77a1f4f3c8d685a2ebf6cb266d0b106ec56`.
- MP4 SHA-256: `0dbf94d0908a693c209d45010f69c61a3aaaca84fd7dccee42951ad01ddd53a3`.
- ZIP SHA-256: `ab452e2ad613c92c7ac50ffe1da5293ff1bddaaa939afcc3460ed30641434d41`.

## Capability boundary and disposition

This probe demonstrates that the installed candidate can construct and revise one 24-second first-party abstract marketing film on the development Mac, preserve approved native material through a demanding late change, deliver a reopenable editable AEP with linked original artwork, and produce technically verified exports. The work required an agent-authored script, visual corrections and explicit file checks; it is not one-click generation or a guarantee of equivalent quality for other briefs. The small marker/labels, expression-heavy editability and render-queue false-success behavior are recorded limits. [AFT-29](https://linear.app/jkbtech/issue/AFT-29/report-render-completion-only-when-a-new-output-file-exists) owns that runtime defect and blocks final release review independently; its fix was not slipped into this exact-candidate comparison.

AFT-27 is complete for its declared creative/control challenge following Joe's acceptance. Separate-machine portability, AFT-9 recovery, AFT-29 render reporting, licensing/distribution review and publication remain independent gates. Strict public-tree audit and review-only source snapshot were refreshed after the executed run; generated results are in `v2-public-tree-audit.json` and `v2-source-snapshot-result.json`. No film or repository was published.

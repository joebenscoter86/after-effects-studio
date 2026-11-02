# AFT-56 — requested alignment-clarity edit

Status: V2 alignment edit accepted by Joe; subsequent delivery preservation failed and AE is paused. Joe accepted the first complete lock film, then chose **“Make the five aligned joins clearer.”** [Actual request](revision-request.json). His acceptance of V2 and final delivery remain open.

## Candidate, session and scope

The exact 67-file RC.2 installation was reverified against the frozen ZIP; [identity](installed-identity.json). The same session `01a19d9c-8488-77b1-9fdf-de9951c219b5` ran as **GPT-6 Astra/high**, with memories/delegation disabled and the original isolated temporary workspace retained. Its sole native controller remained the explicitly bound `aft56_candidate`; existing invocation-only consent was unchanged. [Revision handoff](approved-revision-handoff.md) supplied Joe's requested clarity change and preservation contract, without an operator-authored treatment. No parent AE calls or creative/code corrections occurred during the revision.

[Run metadata](late-edit-run.json): **304.24 seconds / 22 underlying tool calls**, exit 0, no stop reason, within the 20-minute/80-tool revision cap. This excludes parent setup/reporting time. Trace SHA-256 `b618eaaad974ac4f6ab6bad9bfa7093ed98289ed85d4d97a41815993aa86e60e`; raw trace remains locally under release/packages/aft56-native-2026-11-02/late-edit.jsonl.

Before writes, the evaluator found clean, owned V1, expected comp ID 1, four project items, 40 layers and the preserved accepted AEP hash. V2's target did not exist. Only **AFT56_ALIGNMENT_PROOF, layer ID 42**, was edited. Five existing seam strokes changed from 4 to 6 px; five dark 10 px under-strokes and five 72×48 px open cyan outlines with dark edging were added. Outline centers remain unfilled. Existing per-join opacity keys, parent transform/fade, continuous shear line, component IDs, approved copy, camera, timing and mechanics were preserved. No pin movement or camera change was introduced by the emphasis.

## Result and preservation

Saved [pin-tumbler-v2.aep](../../renders/2026-11-02-lock-cutaway/pin-tumbler-v2.aep), 1,377,025 bytes, SHA-256 `db94c42e9b70c428dec4483e3e134f358e49eeeb7a00529e300c7de23c7e9511`. The same main comp `PIN_TUMBLER_EXPLAINER_v01`, ID 1, remains open at 12 seconds, 1920×1080, 30 fps, 22 seconds, 40 editable layers. [Final context](final-native-context.json) reports V2's path and dirty=false. V1 remains byte-for-byte unchanged, SHA-256 `a0ac9092f0ac0185dbd27d7bc96624926526ec7fb7b330f0ca967488a70250cd`; [file checks](revision-files.json).

The evaluator retained full read-only layer snapshots inside its execution state and programmatically compared serialized properties by stable ID. All **39 non-targeted layer snapshots are identical**. Target-layer transform/opacity is identical; original groups differ only by the five intended stroke-width changes. [Computed property comparison](revision-property-comparison.json). This covers exposed serialized properties, not every undocumented AE property. Large returned payloads were abbreviated in the outer CLI log. The parent's initial attempts to parse that abbreviated text failed; inspection of the evaluator's recorded JavaScript verified that the comparison used its retained structured native responses and wrote the resulting summary, rather than reconstructing missing data from the display. No native retry or modification was needed for this operator evidence check.

Decoded native PNG comparisons are identical at frames **36, 153, 299, 300, 435, 472 and 659**. The seven changed sampled frames lie within the emphasis passage; at settled target frames, changed pixels are confined to x=690–1430, y=473–595. [Pixel comparison](revision-pixel-comparison.json). These are representative preservation checks, not an all-660-frame identity assertion. Actual copy/font/fit readback remained unchanged; no enabled-expression errors were found.

## Visual review and limits

The evaluator inspected before/after frames **36, 153, 299, 300, 306, 312, 324, 360, 419, 428, 434, 435, 472, 659**, including full-size frame 360. Its additional onset/fade strip covers **299, 300, 301, 302, 303, 304, 306, 308, 310, 312, 420, 426, 432, 433, 434, 435, 436**. The parent independently viewed full-size revised frame 360 and the continuity strip. The five outlined joins are visibly easier to identify and count; copy and pin bodies remain readable, the fixed markers do not imply corrective physical movement, and the emphasis fades before axial rotation. This is frame-based judgment. Full-speed playback, movie export/decode and reopen checks were not performed on this adjustment.

An optional whole-project JSON export was rejected by the MCP host approval gate, created no file and was not retried through a different route. Native property snapshots and frame comparisons supplied preservation evidence through permitted tools. [Failed check](failed-checks.json). The scoped native mutation succeeded without a failed/retried write. No new operator tool-policy adjustment or alternative controller was used.

[Agent's detailed review](revision-review-v2.md) and [evidence inventory](evidence-files.json) preserve checks and 54 owned revision outputs. Heavy JSX/frames/AEP remain under the ignored quality/renders/2026-11-02-lock-cutaway/ directory. The installable candidate payload is unchanged.

## Next gate

Joe has been asked to scrub 10–14.5 seconds in the open V2 comp and accept or revise the alignment emphasis. No V2 creative acceptance is inferred. After acceptance, finish editable/reopen and final playback-export verification; continue the same session and inspect the actual project before any native action. AFT-56 remains In Progress. No public merge, tag/release, stable upgrade or OpenAI submission is authorized by this test.

After the evaluator exited, supported CLI removal cleared the temporary candidate installation and marketplace. Config inspection confirmed both absent and the stable plugin enabled. AE was left on saved V2 without another native operation. Reinstall/verify exact RC.2 before the final same-session continuation.

Follow-up: Joe selected “Accept V2 alignment edit.” The [delivery report](../2026-11-02-lock-cutaway-delivery/report.md) records the verified export/reopen work and unexpected on-disk V2 rewrite. Do not infer delivery completion from this earlier successful revision. AE is paused; see the [resume handoff](../2026-11-02-lock-cutaway-delivery/resume.md).

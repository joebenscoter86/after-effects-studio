# AFT-56 — fresh lock-cutaway planning

Status: the single authorized fresh planning turn is complete; creator approval of the actual plan is pending. Planning structure and isolation passed. One on-screen line needs a proposed precision correction before building, and axial rotation remains unproven in native AE. Joe authorized GPT-6 Astra/high, capped at ten minutes and 60 tool calls, on 2026-11-02. No native execution or publication is authorized by that planning approval.

Candidate source: draft PR #7 at `7bec6812dbb30e63ceb221379937e08b793ebe7d`. Manifest: `0.2.1-rc.2+codex.20261102`. Archive SHA-256: `16b8ea9dc200d8c315b03fb3b5546bb4ac85d95a699f128c7986df9ce4ab7b4d`. The supported temporary install uses `after-effects-studio@aft56-local-test`. All 67 installed files match the archive with no extras; [identity](installed-identity.json).

The [frozen input](frozen-input.json) contains only the ordinary creator brief, manufacturer factual source and isolation boundary. It does not tell the agent the desired storyboard, construction-plan contents or scoring criteria. The parent froze its [review criteria](review-criteria.md) separately, before inspecting the answer. The fresh session has memory disabled, a read-only command sandbox, unrelated plugins disabled for the invocation, and no permission for AE inspection, mutation, generation, file writing or delegation. Web access is limited to the supplied manufacturer's PDF (first page).

The [runner](run-installed-eval.py) is adapted from the already exercised AFT-54 harness, with explicit user-approved model/high effort and a distinct marketplace/input/evidence directory. Raw JSONL and stderr remain local under ignored release/packages/aft56-lock-planning-2026-11-02/; the completed run record preserves their identity and hash. The evaluator was not given access to this report or any earlier test output. It used the installed library's documented on-disk fallback rather than operating the native bridge.

## First-answer result

Session `01a19d9c-8488-77b1-9fdf-de9951c219b5` completed with verified `gpt-6-astra` / `high`, a read-only command sandbox, seven underlying tool calls and 146.68 seconds elapsed. The [run record](lock-cutaway-first-run.json) includes exact invocation, prompt hash and raw trace SHA-256. There was no rerun or operator coaching during generation. The host warned that skill descriptions were shortened to fit the context budget; the trace nevertheless shows a full read of the exact candidate's motion-studio skill and required foundations.

The [verbatim first answer](lock-cutaway-first-answer.md) proposes a 22-second, 1920×1080 / 30 fps film titled “Why the right key turns.” One three-quarter cutaway persists: obstructed plug → key-driven pin motion → aligned joins → axial plug turn → readable resolution. It supplies original vector/material direction, exact proposed copy, five contiguous beat ranges over frames 0–659, action/hold targets, font and asset assumptions, ownership intentions and a native implementation approach. It explicitly treats contact as geometry-driven rather than an arbitrary stagger and calls for a representative contact and alignment-to-turn proof before a full build.

| Criterion | Assessment |
| --- | --- |
| Creator-readable story and chosen defaults | Pass: one persistent mechanism, clear contact chain, dark/brass/cyan direction and reasoned landscape format; 22 seconds is the agent's proposed default, not a prior operator instruction |
| Separate construction plan | Pass: exact proposed words, 660-frame timebase, stated end-exclusive intervals, action/resolution/reading holds, editable geometry, type and silent-audio assumptions |
| Identity and hard middle | Pass at planning scope: key-contour-driven pins, joins aligned before turn, distinct moving plug/bottom pins and stationary housing/top pins/springs, explicit axial pivot and fixed camera |
| Observable review targets | Pass: contact f107/108/109, insertion f153/198/243, seating f269/270/271, alignment f299/300/301, rotation f434/435/436 and f472, resolution f510 and f659 |
| Factual copy precision | Partial: the physical sequence is consistent with the supplied first page, but “Clear of the pins, the cylinder can turn.” can suggest pins disappear or that the housing turns. Propose “With the joins aligned, the plug can turn.” No source or motion-library rule was changed to address this content-specific wording |
| Native feasibility and visual quality | Unproven: the proposed shared-coordinate vector projection must demonstrate a coherent axial turn and occlusion in AE. Exact dimensions/rig geometry, available fonts and measured rendered fit remain implementation checks, not inspected facts. The agent's own bounded hard-passage proof is the correct next native test after plan approval |
| Isolation and execution boundary | Pass: full [tool audit](tool-trace-audit.json) shows only candidate skill/library reads, manufacturer PDF open and page-zero screenshot. No general search, memory, earlier session/report/eval, development checkout, AE access, asset generation, write, install or delegation by the evaluator |

## Explicit operator intervention and approval copy

The [review plan V1](review-plan-v1.md) retains the agent's complete proposal and changes only the one on-screen sentence identified above. Its header exposes that delta and the native proof requirement. The first answer remains unchanged and was assessed before this proposed correction. This is one content-precision intervention, not a parent-supplied storyboard or an unassisted finished-film pass. It does not count as the later meaningful edit, which must be chosen only after the first complete native build is reviewable.

Do not infer approval of the new 22-second story, exact copy, frame timing or visual direction from Joe's permission to launch the planning task. Present review plan V1 for that decision. If approved, continue the same session under the [end-to-end handoff](../2026-11-02-planning-release-candidate/end-to-end-test-handoff.md), with the correction explicitly supplied and exact RC.2 reinstalled/verified before native work. Inspect the actual AE project before any write; a proposed new project name is not permission to replace unrelated work.

## Cleanup and current gate

The temporary `aft56-local-test` plugin/cache and marketplace were removed through the supported CLI after the planning answer. [Cleanup verification](cleanup-verification.json) confirms stable `0.2.0+codex.20261018` remains enabled. No AE project was inspected or changed. The source package and archive are unchanged; the new files are test evidence only. PR #7 stays draft and no tag, release asset or directory submission was created.

Next gate: Joe approves or revises review plan V1 before native work. AFT-56 remains In Progress until owned native construction, meaningful late edit, editable delivery and creative acceptance are evidenced. Preparing or reading a plan is not an AE or film-quality pass.

# Repeatable v1 quality scenarios

Prepared 2026-10-06 for AFT-13. These are manual, owned-scope scenarios, not an automatic runner against the user's open project. Use [the report template](../reports/report-template.md) for every run. Keep canonical creative authoring prompts in [plugin/evals/evals.json](../../plugin/evals/evals.json). All scenarios start by reading the exact AE version/project and confirming one controller. Never clear, close, switch or save over unrelated work. Use new dated render folders; cleanup requires readback of exact owned IDs.

The included [geometric mark](geometry-mark.png) is generated from original primitives by [generate-mark.py](generate-mark.py). It is a technical import/missing-media fixture, not authentic product art or a quality demonstration. Copy it to a run folder before deliberately making a *test-owned* link missing. No third-party or private asset is required for the native geometric scenarios.

| ID | Scenario | Release criteria / tickets |
|---|---|---|
| Q-01 | Install, connect and first editable scene | Clean installation, supported platform, first-use clarity / AFT-7, AFT-18 |
| Q-02 | Existing saved and unsaved project preservation | Recovery and preservation / AFT-10 |
| Q-03 | Missing media and font recovery | Recovery / AFT-9 |
| Q-04 | Busy, modal, denied permission and uncertain completion | Recovery / AFT-8, AFT-9 |
| Q-05 | Targeted copy, palette, pacing and framing revision | Revision, portable craft / AFT-11 |
| Q-06 | Editable AEP and complete movie handoff | Editable delivery / AFT-12 |
| Q-07 | Three styles and complete motion review | Visual outcomes, portable craft / AFT-14–AFT-17 |
| Q-08 | Candidate package and public install | Package, distribution, support / AFT-18, AFT-21–AFT-25 |

## Q-01 — First session

Use the exact candidate and [first-session guide](../../plugin/docs/first-session.md), with a separate Mac for AFT-18. Record whether a personal marketplace was already configured; for clean-machine acceptance it must not be. Capture install command/UI steps, permission prompts, Node/Codex/AE/macOS builds, candidate hash and every manual assist. Inspect a blank or explicitly owned project, create a named native scene from a no-asset geometric brief, render start/action/overlap/hold frames, revise a prominent detail and read back the same comp ID. Pair the successful creation with the initial read-only connection result. A developer-machine run does not satisfy the second-machine gate; a Joe-operated run proves portability but not novice usability.

## Q-02 — Project preservation

Use three deliberately owned test projects: blank, saved with an unrelated sentinel comp/layer, and unsaved with an unrelated sentinel comp/layer. Record project path, dirty state, item/layer IDs, key properties, footage links and active selection before. Add one named test comp only after inspection, then revise or remove only it. Read back all sentinels and project state; check no save, close, switch, overwrite or unexpected asset relink occurred. Compare more than item count. Record undo-history effects separately. Never manufacture the unsaved case by discarding someone else's project.

## Q-03 — Missing dependencies

In an owned project, import a *copy* of `geometry-mark.png` from the dated run folder and create a paired successful render with the link intact. Then make only that copied link missing. Check that `ae_render_frame` names the missing source and writes no new frame, even if AE still has a cached image or `footage.list_missing` has not caught up. Check that `footage.reload` reports a still-missing source rather than success. Restore the copy, use `footage.replace` to relink if AE retains its missing flag, and verify a successful render against the original. For font absence, create an owned text layer assigned a deliberately nonexistent PostScript name (the AE 26 fixture used `AFT9IntentionallyAbsent2026-Regular`), save its AEP to a dated run folder, reopen it and record `font.list_missing` plus the substituted render. If the host refuses that font assignment or no missing-font fixture is available, mark the case unverified. Any substitution requires disclosure and agreement before a final delivery claim.

## Q-04 — Connection and uncertain execution

Use isolated simulated transport fixtures for closed/stale AE, a fresh busy lock, dialog detection and explicit Automation `-1743`; pair each with a successful control of the same dispatch path. In an empty owned AE fixture, a controlled partial `batch.run` may pair successful writes around one known failing child; inspect the ordered result and all created items, including automatically generated solids, before cleanup. On a live machine, record actual error and permission state only when safe to exercise without risking an unrelated project. Never toggle permissions, induce a modal or hang the user's AE just to satisfy a test. For a naturally occurring timeout, record whether the request was consumed, inspect actual project/items before retry, and repair only verified owned scope. A generic timeout cannot certify scripting-file-access denial. No blind repeat of a possible write; no force-quit of unsaved work.

## Q-05 — Deliberate revision

Start from an owned comp with a before AEP/snapshot and rendered frames. Change exact copy, palette, timing and framing in separate cases, one coherent edit at a time. Read back stable comp/layer IDs and intended properties plus unrelated sentinels after each. Repeat a request once and verify it does not accumulate a duplicate scene. Render equivalent before/after times including the hardest overlap and hold; inspect full-size text fit and edge coverage. A script result alone does not prove the visual change.

## Q-06 — Delivery

Choose an owned output folder with an overwrite policy before saving. Deliver AEP plus referenced assets and a complete movie. Reopen the delivered AEP intentionally in a safe test instance, confirm native layers remain editable and links resolve, then verify movie duration/resolution/fps, full `ffmpeg -v error -i <movie> -f null -` decode and SHA-256 of delivered copies. Review at full speed and record audio checks if present. Preserve the original open project. If an export template or tool is missing, report the dependency instead of claiming delivery.

## Q-07 — Creative proof

Run separate type-led identity, causal explainer and authentic-art product briefs. Each needs an ordinary beat, difficult transition, stable subject identity, meaningful revision, editable AEP, complete movie, six or more purposeful sampled frames including overlap/hold, full-size inspection and full-speed playback. Record source/rights for actual product art; `geometry-mark.png` cannot stand in for authentic art. Use the bundled craft modules only in a fresh agent session and log which were read. Record runtime, visual critique and Joe's acceptance independently.

## Q-08 — Package and public channel

Validate the exact candidate archive/manifest/library/notices, source revision and hash. Audit private paths, credentials and media. On the separate Mac, install from the actual published Git-backed source with the documented creator steps, then repeat Q-01/Q-06. Check public support/privacy links and installed version/hash. Directory acceptance is a separate test if that route later becomes available. Publication itself requires separate authorization.

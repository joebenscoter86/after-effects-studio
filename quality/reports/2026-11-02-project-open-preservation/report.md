# Project-open preservation correction — RC.3

Status: native defect reproduced in frozen RC.2; smallest runtime correction and affected RC.3 engineering retests pass. AFT-56's original RC.2 delivery failure remains recorded. Acceptance of the revalidated replacement handoff is pending; do not relabel the original study as an unassisted RC.3 journey or claim restoration of the original accepted V2 bytes.

## Authority and isolation

Joe resumed AE, then explicitly authorized saving and closing his current project to open the test project: “save it and open you're project. these admin tasks are part of the tool to test. you're approved to close my project”. Parent inspected the saved, clean Claude duet project, copied a pre-save disk backup into ignored owned output, saved through ae_save_project, then used standalone project.new outside an undo group. All subsequent tests used uniquely named disposable AEPs with physical backups. Accepted V1/V2 and unrelated work were never fixtures. One native controller; no new AI evaluator or extension of the frozen evaluator budget. The canonical dirty checkout and reference-motion branch were untouched.

Worktree: `.codex/worktrees/brief-to-motion-planning/after-effects-studio`; branch `codex/planning-release-candidate`; draft PR #7. Host: macOS 26.6.2 arm64, Node 25.9.0, AE 26.5x89, push transport. Native probes used the supported runtime stdio/MCP interface serially; no direct mailbox or installed-cache edits.

## Reproduced cause and correction

RC.2 calls app.open directly while native dialogs are suppressed. Under this host, opening implicitly saves dirty current work even when the requested project.open save flag is false or omitted. Marker names and file hashes establish actual content writes. The small queue reproduction matches the original delivery sequence: render leaves disk unchanged; reopen writes the completed queue to disk; remove the queue and reopen writes again. This isolates the unexpected write to reopening, not render.start.

The correction validates target existence before any current-project save/discard, saves only when requested, refuses save=true on nonempty untitled work without a path, and explicitly closes with CloseOptions.DO_NOT_SAVE_CHANGES before app.open. A refused close or null open is reported. Project replacement remains outside undo groups. The [scripting reference](https://ae-scripting.docsforadobe.dev/general/project/#projectclose) documents the close option and Boolean completion result. An existing but invalid/unreadable target can still fail after an explicitly requested discard; this operation is not transactional or a general rollback facility.

## Checks performed

| Check | Old runtime | Corrected RC.3 |
| --- | --- | --- |
| Dirty same-file reopen, save=false | Writes unsaved marker into AEP | Saved hash unchanged; saved marker restored |
| Dirty different-file open, save omitted | Writes previous AEP | Both AEP hashes unchanged; target opens |
| Missing target, save=true | Saves current before failure | Current disk and dirty native state retained |
| Explicit save=true on saved work | Baseline not rerun | Intended edit saved and recovered on reopen |
| Nonempty untitled work, save=true | Covered in host-model red test | Refused; work remains open and dirty |
| Clean same-file reopen | Not separately rerun | Hash unchanged |
| Render then reopen without saving | Writes completed queue into AEP | AEP unchanged; queue returns to saved empty state |
| Remove saved queue then reopen without saving | Persists removal | AEP unchanged; saved queue restored |

Evidence: [complete old minimal cases](rc2-complete.json), [old queue sequence](rc2-queue.json), [six packaged correction cases](rc3-package.json), [packaged queue cases](rc3-queue.json). [First old probe](rc2-baseline.json) stopped at an expected file-not-found tool error because its runner initially treated every error as fatal; no uncertain retry occurred. The runner was corrected, context inspected, owned project reset and the complete characterization repeated under a new label. [Direct source probe](source-fixed.json) preceded versioned packaging; it is not claimed as an installed RC.3 test.

Six regression cases execute the real generated operation against a small external host model. Five failed and one passed before correction; all six passed after. Host-model behavior is a boundary contract, not a substitute for native characterization. New plus undo tests: 20 passed. Full offline suite: **38 files, 516 tests passed, four skipped**; both TypeScript checks and focused lint/format checks passed. Logs are retained here with terminal whitespace normalized; exact raw terminal output remains under the ignored raw-terminal-logs render folder. An initial duplicated runtime path ran no tests and is preserved as baseline-invocation-error.txt. No native upstream E2E suites were run against user work. Locked development dependencies report ten audit findings (eight moderate, two high); this correction does not resolve that separate dependency work.

A separate read-only reviewer inspected project.ts and project-open.test.ts, found no actionable issue, and noted invalid-target/nontransactional and host-model limitations. The reviewer neither changed files nor controlled AE.

## Real-film revalidation

The parent copied the observed post-failure V2 to a new owned `pin-tumbler-observed-v2-revalidated.aep`, preserving its source and a byte backup. The copy is **1,377,929 bytes**, SHA-256 `6745dc3aadcfe8d09ac9f66338fab7b5654ca18b7c5676624e6d3fa78dec5ed1`. It is not the unavailable 1,377,025-byte accepted original.

Through the extracted RC.3, the copy opened with the existing 40-layer comp, rendered the full 22 seconds, and reopened without saving. Copy and source hashes stayed unchanged; queue returned to zero. Full serialized layer/property results at 12 seconds match before/after for all 40 layers (within the bundled helper's serialization depth/type limits). Six native before/after frames are pixel-identical. Six captures using the same default color pipeline also match the prior delivery's native frames pixel-for-pixel. Parent visually inspected the contact sheet for opening, insertion, alignment, turn and end state. No new story, geometry, copy or motion was authored.

The fresh ProRes decode contains all 660 frames at 1920×1080/30fps/22 seconds. Its decoded frames are not byte-identical to the earlier ProRes (zero equal frame hashes); full-video SSIM is 0.999738. Do not claim deterministic encoded equality or infer a proven cause for those small export differences. Both ProRes files emit the existing chapter-track warning while decoding successfully. Initial comparison of unconverted colorManaged:off PNGs to historical default-converted PNGs was not exact; using the same pipeline resolved the six native image comparisons. The original H.264 playback file, already fully decoded and visibly player-reviewed, was copied alongside the AEP with a matching SHA-256; no new player review is claimed.

[Native retest summary](rc3-lock-retest.json) records hashes, states and capture paths. Full 24 MB native/property trace stays in ignored renders with its hash recorded in the summary. [Media comparison](lock-media-comparison.json), [same-pipeline native comparison](managed-native-comparison.json), [SSIM output](render-ssim.txt) and [handoff identities](handoff-files.json) retain the precise limits. AE is left on the clean revalidated project, comp PIN_TUMBLER_EXPLAINER_v01 at 12 seconds for scrubbing.

## Package and remaining gate

RC.3: **0.2.1-rc.3+codex.20261102**, 67-file ZIP SHA-256 **db30edab27a20b292ecea2843f24f4f7c00f9fdca088ccfb124a1e0e4ea37ae3**. Two builds produced identical metadata/archive bytes. Relative to RC.2, only the manifest version, README, provenance and bundled runtime changed; all 29 library documents, skills, licenses and notices retain their bytes. Frozen RC.2 ZIP remains SHA-256 16b8ea9dc200d8c315b03fb3b5546bb4ac85d95a699f128c7986df9ce4ab7b4d.

Extracted and exact installed-cache offline smoke passed handshake, all 29 library reads, routes, traversal rejection and catalog. All 67 cache files matched the ZIP with no extras. Supported temporary install/removal was used; only an empty marketplace cache root remains. Stable v0.2.0 remains enabled, so the correction is not yet the default installed or public runtime. Plugin Creator is still absent; the repository builder and supported CLI remain the documented fallback.

The engineering fix and affected retest are ready. **Joe must accept or reject the revalidated observed-V2 file as the final replacement handoff before closing AFT-56**, because the original accepted file cannot be restored byte-for-byte and full original pre-failure properties are unavailable. This asks about accepting the disclosed delivery recovery, not repeating the already approved creative work. AFT-56 remains In Progress until that decision. Publication, main merge, a new evaluator and stable upgrade remain separate. [Prepared RC.3 action sheet](../../../release/submission/planning-rc3-action-sheet.md) contains the later concrete prerelease proposal.

## Reproduction

From the repository root, run native-probe.mjs or queue-probe.mjs from this report folder with the absolute extracted-plugin path and a new lowercase unique label as arguments. They require AE to be empty before any mutation, use only owned date/label paths, refuse overwrite, and retain JSON responses and backups. Run them serially; they intentionally expose old-runtime writes. Expected tool errors are retained. A finished characterization is not automatically a passed preservation test: inspect each preserved/passed result. lock-retest.mjs is specific to this study's retained observed-V2 source and keeps the final owned project open. Do not use these diagnostic scripts as shipped runtime tests or run them on unrelated work.

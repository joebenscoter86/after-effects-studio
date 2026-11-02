# RC.3 preservation correction — review action sheet

Prepared, not authorized for publication. Supersedes RC.2 as the candidate to consider after the project.open defect. Retain the RC.2 archive and failed evidence.

## Exact review object

- Branch `codex/planning-release-candidate`, draft PR #7. Capture/recheck final full commit SHA before requesting any publication; do not infer merge authority from accepted tests.
- Manifest `0.2.1-rc.3+codex.20261102`.
- Local ZIP `release/packages/after-effects-studio-0.2.1-rc.3+codex.20261102.zip`, 67 files, SHA-256 `db30edab27a20b292ecea2843f24f4f7c00f9fdca088ccfb124a1e0e4ea37ae3`.
- [Release notes](../codex-release-notes-v0.2.1-rc.3.md), [correction and verification](../../quality/reports/2026-11-02-project-open-preservation/report.md), [per-file identity](../../quality/reports/2026-11-02-project-open-preservation/package-identity.json).

## Before any public action

Joe decides whether to accept the revalidated observed-V2 AEP as the AFT-56 replacement handoff. Its source was rewritten by the old bug; the original accepted bytes cannot be recovered. The correction preserves the replacement file, property snapshots and six native image samples during the affected delivery retest. Keep the original failure and parent intervention explicit. Close AFT-56 only after that decision; do not call the exact RC.2 delivery a pass.

If accepted, the recommended next separate decision is a public GitHub prerelease of RC.3 from the specifically reviewed branch commit, attaching the exact archive and notes. Retain v0.2.0 as latest stable. Recheck tag availability, commit/tree/payload and prerelease metadata immediately before execution. Do not merge the RC manifest into main/unpinned marketplace as part of this action. A main merge or stable promotion requires its own exact source/package review. No directory submission, outreach or announcement is included.

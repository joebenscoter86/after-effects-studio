# RC.3 preservation correction — review action sheet

Published on 2026-11-02 after Joe replied “approved publish” to the exact prerelease proposal. [Public RC.3 release](https://github.com/joebenscoter86/after-effects-studio/releases/tag/v0.2.1-rc.3). Retain the RC.2 archive and failed evidence.

## Exact review object

- Published tag `v0.2.1-rc.3` points to approved commit `92edeb0b9f8d27bf092d68d967851c792d5d8451` on `codex/planning-release-candidate`, draft PR #7. Later evidence commits do not move that tag.
- Manifest `0.2.1-rc.3+codex.20261102`.
- Local ZIP `release/packages/after-effects-studio-0.2.1-rc.3+codex.20261102.zip`, 67 files, SHA-256 `db30edab27a20b292ecea2843f24f4f7c00f9fdca088ccfb124a1e0e4ea37ae3`.
- [Release notes](../codex-release-notes-v0.2.1-rc.3.md), [correction and verification](../../quality/reports/2026-11-02-project-open-preservation/report.md), [per-file identity](../../quality/reports/2026-11-02-project-open-preservation/package-identity.json).

## Acceptance and published scope

Joe accepted the revalidated observed-V2 AEP as the AFT-56 replacement handoff on 2026-11-02 (“i agree, accept”). Its source was rewritten by the old bug; the original accepted bytes cannot be recovered. The correction preserves the replacement file, property snapshots and six native image samples during the affected delivery retest. The accepted recovery closes AFT-56 while retaining the original failure and parent intervention; the exact RC.2 delivery is not relabeled as a pass.

Joe separately authorized publication. The tag, commit, rebuilt archive and all 67 package entries were verified before publication. The public asset was then downloaded without authentication and matched the approved SHA-256 and all 67 file hashes. GitHub marks RC.3 as a published prerelease; v0.2.0 remains latest stable and main is unchanged. [Publication evidence](../../quality/reports/2026-11-02-rc3-publication/report.md). A main merge, stable promotion or local stable upgrade still requires its own authorization. No directory submission, outreach or announcement was included.

# Codex Git release — review action sheet

Status: **prepared, not authorized or published as stable.** [AFT-23's final candidate review](../../quality/reports/2026-10-15-release-candidate/report.md) passed for the exact archive below. Do not execute this sheet until Joe explicitly authorizes AFT-24's public release action.

## Proposed reviewed object

- Public destination: [joebenscoter86/after-effects-studio](https://github.com/joebenscoter86/after-effects-studio), Git-backed marketplace `jb-technology`, package path `plugin/`.
- Source review surface: [draft PR #2](https://github.com/joebenscoter86/after-effects-studio/pull/2), branch `codex/aft22-release-metadata`. Its reviewed source package rebuilds to the ZIP SHA-256 below; recheck the exact head at final freeze. Final merge commit and tag are not yet assigned.
- Proposed plugin version: `0.1.0+codex.20261015232719`. Candidate ZIP: `release/packages/after-effects-studio-0.1.0+codex.20261015232719.zip`, SHA-256 `95dd810919b9761b7a20a4c74575253ae041656919411bc4f48615d454fa2226`. The ZIP is ignored/local; do not imply GitHub hosts it yet.
- Proposed public action: merge only reviewed [draft PR #2](https://github.com/joebenscoter86/after-effects-studio/pull/2) into `main`, tag the resulting reviewed commit `v0.1.0`, create a GitHub Release using the notes below, and attach the exact ZIP/hash above. The tag is currently unused. No separate social announcement is part of this action.
- Public copy: [draft release notes](../codex-release-notes-v1.md), with product/support/privacy/terms and install/removal links checked on the final ref.

## Before publication authorization

1. Include [AFT-33's completed lifecycle evidence](../../quality/reports/2026-10-15-lifecycle-final/report.md) without overstating it as a separate-Mac UI hot-reload test. AFT-22 materials are complete on the draft PR. Recheck AFT-23's requirement matrix, package/resource hashes, current PR diff, support links and any post-review changes.
2. Confirm the final source commit/tag contains the exact reviewed `plugin/` payload. Rebuild the ZIP from that commit and compare its SHA-256 to the value above. If it differs, update the candidate/report and rerun affected tests; do not silently use this sheet's old hash.
3. Replace the proposed tag/ref here with actual verified values and attach the final archive/hash, icon and release notes for Joe's review. State explicitly that public Git source may already be installable, while the stable designation and release asset are the new public action.
4. Ask Joe to authorize the exact final merge/tag/release and any public announcement. Planning approval and prior source-publication approval do not authorize a stable release. No OpenAI directory submission is part of AFT-24.

## After a specifically authorized release

Merge or publish only the reviewed commit, create the approved tag/release, attach the reviewed ZIP, and verify the public marketplace/catalog points to the same payload. Record actual URLs and hashes. If a step returns an uncertain result, inspect GitHub state before retrying. Check public support and private incident routes. Begin AFT-25 immediately: install the actual stable artifact on the separate eligible Mac/account and repeat the advertised native journey. If any failure affects users, document its severity and the tested rollback route before further announcement.

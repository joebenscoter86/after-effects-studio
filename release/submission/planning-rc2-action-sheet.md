> Superseded candidate: RC.2 failed project-file preservation during AFT-56. Do not publish this candidate; see [RC.3 action sheet](planning-rc3-action-sheet.md). Retain this exact historical object and its evidence.

# Planning update RC.2 — review action sheet

Status: prepared, not authorized for public prerelease publication. AFT-55 prepares the package and the next local test; choosing that test does not publish the candidate.

## Reviewed object

- Base: main merge `de8464109084a001af8210e2541b74df31fda474`, containing approved PR #6 / AFT-54.
- Review branch: `codex/planning-release-candidate`; its draft PR is linked in AFT-55. Capture and recheck the final full commit SHA before requesting publication approval. Later evidence-only commits do not alter the ZIP, but the payload comparison must still pass.
- Candidate manifest version: `0.2.1-rc.2+codex.20261102`.
- Archive: `release/packages/after-effects-studio-0.2.1-rc.2+codex.20261102.zip`, 67 files, SHA-256 `16b8ea9dc200d8c315b03fb3b5546bb4ac85d95a699f128c7986df9ce4ab7b4d`.
- [Release notes](../codex-release-notes-v0.2.1-rc.2.md), [package/installation evidence](../../quality/reports/2026-11-02-planning-release-candidate/report.md), and [proposed local test](../../quality/reports/2026-11-02-planning-release-candidate/end-to-end-test-handoff.md).

## Preferred immediate action

Test the exact archive locally before asking for a public release decision. With Joe's authorization of the proposed fresh session, reinstall the extracted ZIP using a temporary local marketplace, verify its cache bytes and start the planning arm with only the ordinary creator brief, factual source and installed guidance. The actual story/build plan and owned AE project must be approved before native construction. Preserve the stable installation; remove the temporary install after its owned test and record cleanup.

## Optional later public prerelease — requires separate approval

The reviewable public proposal would be: tag the specifically approved candidate commit on its branch as `v0.2.1-rc.2`; create a GitHub **prerelease**, retaining v0.2.0 as the latest stable GitHub Release; attach the exact archive above and use the reviewed notes. Recheck tag availability, commit/tree/payload and current prerelease metadata immediately before executing. Do not silently merge the RC manifest into main: that would expose the candidate through the unpinned public marketplace. Any main merge or later stable `v0.2.1` promotion has its own exact source/package review and authorization.

A prerelease can be installed from a reviewed pinned Git ref or standalone ZIP. It does not establish separate-Mac support for RC.2, approval of a newly built film or OpenAI directory eligibility. No outreach, listing submission or separate announcement is included in this proposed action.

# Approved execution-plan update — 2026-10-13

Joe approved the path-forward review and explicitly requested all Linear tickets be updated with detailed instructions for less expensive build models.

## Changes

- Rewrote seven remaining original tickets (AFT-9, AFT-18, AFT-20, AFT-22–AFT-25) with authoritative inputs, procedural steps, tests, acceptance, evidence, external authorization checkpoints and handoffs. Preserved their prior full descriptions as clearly superseded historical comments.
- Created AFT-30–AFT-36 for directory eligibility, publication source/asset/license review, reviewed infrastructure publication, lifecycle acceptance, actual public-Git rehearsal, conditional directory preparation, and directory submission/publication.
- Annotated all 22 completed tickets with scoped-evidence retention and successor boundaries; preserved their Done status and original evidence.
- Removed AFT-9 → AFT-18. Replaced natural-timeout waiting with controlled test-only response-fault/native-state verification. Both remain final candidate gates.
- Changed AFT-20 to preparatory publisher/page acceptance. AFT-32 owns authorized infrastructure publication/live-link checks, avoiding the live-link/release dependency cycle.
- Made AFT-24/AFT-25 Codex-only. AFT-30/AFT-35/AFT-36 are the separate nonblocking directory track. Added an explicitly separate directory milestone; the six baseline stages remain.
- Updated project summary/description and S2/S4/S5 milestone descriptions.
- Synchronized D-013, [detailed execution specifications](../../../product/release-execution-plan.md), backlog mapping, routing, release/quality guidance, clean-install runbook and active reviewer/destination documents. Historical result reports were retained.

## Readback verification

[Structured live readback](linear-readback.json) records all 36 issues, actual statuses and blocker relations.

- 36 tickets: 22 Done, 12 Backlog, one In Progress (AFT-9), one In Review (AFT-20).
- Seven original remaining specs and seven new specs verified by direct get_issue reads, including titles, acceptance headings, contract markers and absence of unresolved template placeholders.
- All 22 completed descriptions have continuation notes; all 29 original statuses are unchanged.
- All expected blocker sets match live Linear; 65 total dependency edges.
- Directed graph cycle check passed.
- AFT-18 has no AFT-9 blocker.
- Transitive prerequisite traversal from AFT-25 includes none of AFT-30/AFT-35/AFT-36.
- Project execution index and new directory milestone verified by project readback.

One Linear write returned temporary upstream_unavailable/502 while adding completed-ticket notes. Already completed writes were inspected; remaining notes were applied and all tickets were reread. No duplicated notes were needed. List-issues descriptions are abbreviated; final description validation used direct get_issue rather than truncated list output.

## Boundaries

This pass updates planning and tracking. No native AE operations, build execution, runtime changes, outreach, identity verification, account purchase, repository/page/release publication, directory upload/submission or listing publication occurred. No new assignee, deadline or estimate was invented. The current development tree already contained substantial prior work; it was preserved.

The extra open-ticket count is a decomposition of approved release work and the separate external directory route, not reopened creative acceptance. Start recovery/eligible installation/page preparation/source review/lifecycle work as inputs allow. The directory inquiry needs a concrete approved recipient/message before sending.

## Local checks

Documentation and active-link consistency checks and the strict source-tree pattern scan are recorded after generation in checks.json. These are planning checks, not plugin acceptance results.


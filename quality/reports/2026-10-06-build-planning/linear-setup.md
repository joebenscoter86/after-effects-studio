# Linear setup evidence

Date: 2026-10-06 (America/Los_Angeles). Scope: publish the existing planning backlog to the user-selected After Effects Studio team and verify the resulting project structure.

- Team: After Effects Studio, key AFT, ID d32aaf1c-faf1-4721-a4fe-70ba82422a45.
- Project: [After Effects Studio — Public v1](https://linear.app/jkbtech/project/after-effects-studio-public-v1-11b497a84750), identifier P-AFT-59, UUID d20addb6-e40a-44e6-9717-eaf6e42e19f8.
- Authentication now succeeds. The initial project query exceeded the API complexity limit; a reduced query succeeded. No matching project or existing team issues were found before creation.
- Created six milestones S0–S5 and 25 issues AFT-1–AFT-25. All retain their B-xx planning key, scope, acceptance, evidence location and applicable R-xx requirements.
- Created and read back all 53 blocked-by dependency edges; exact sets match the local plan, including forward references such as B-09 depending on B-13.
- Read back every issue and checked team, project, title mapping, milestone, priority and planning key. Project list returned exactly 25 issues with no next page. Milestone list returned exactly six expected names in stage order.
- Created all tickets unassigned, without due dates or estimates. Local Normal priority maps to Linear Medium. Existing statuses are Backlog, Todo, In Progress, In Review, Done, Canceled and Duplicate.
- AFT-1 was created Done with the prior baseline evidence. AFT-2 was created In Progress for setup, then completed only after mapping and verification. Remaining implementation/release tickets were left Backlog.
- Repository mapping and workflow are recorded in product/backlog.md and product/build-plan.md; roadmap and AGENTS.md now route to the live tracker.

This verifies ticket setup, not plugin implementation or release readiness. No code changes, native AE operations, public release, outreach, assignments or artificial deadlines were part of this work. The earlier authentication failure remains in baseline.md as historical evidence and is superseded by this successful setup.

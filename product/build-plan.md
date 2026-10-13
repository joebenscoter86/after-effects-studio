# Staged v1 build

## Approved remaining execution — D-013

Use [release-execution-plan.md](release-execution-plan.md) and current Linear descriptions for the detailed 2026-10-13 contract. The six stages below remain; the original start sequence is historical foundation work. AFT-9 controlled uncertainty, AFT-18 separate-Mac installation, AFT-20 page/publisher preparation, AFT-31 source/rights review and AFT-33 lifecycle checks can proceed independently. AFT-32 publishes reviewed infrastructure after specific authorization; AFT-22 finalizes materials and AFT-34 tests the actual public Git route. AFT-23 freezes/reconciles the candidate, followed by authorized AFT-24 Codex release and AFT-25 stable-public verification. The directory milestone AFT-30 → AFT-35 → AFT-36 is separate and does not block Codex launch.

Prepared 2026-10-06. The four approved workspaces remain intact. The existing brief supplies product direction; the [PRD](prd.md) makes its requirements testable. This plan sequences the remaining work without treating imported evidence as a new release pass.

## Repository blueprint

No directory reorganization is needed. New planning files live in product/; each new evidence run lives in its own dated quality/reports/ folder.

```text
after-effects-studio/
  AGENTS.md                 canonical map and routing
  CLAUDE.md                 pointer to AGENTS.md
  README.md                 start and development instructions
  product/
    context.md
    brief.md                concise product narrative
    prd.md                  required behavior and acceptance
    decisions.md            settled choices and open decisions
    roadmap.md              current stage and next actions
    build-plan.md           stages, gates and working process
    backlog.md              ticket specifications and Linear mapping
  plugin/                   existing complete installable package
    context.md
    .codex-plugin/  .mcp.json
    runtime/  library/  skills/
    scripts/  tests/  evals/  examples/  assets/  docs/  verification/
    README.md  PROVENANCE.md  THIRD-PARTY-NOTICES.txt
  quality/
    context.md  release-criteria.md
    fixtures/  reports/  renders/
  release/
    context.md  release-plan.md  listing-draft.md
    submission/  website/  packages/
```

Existing internal package trees and historical filenames are preserved. New authored files use lowercase hyphenated names, evidence folders use YYYY-MM-DD-topic, and creative iterations use -v1/-v2. Heavy AE/media output stays under quality/renders/; archives stay under release/packages/. Both remain ignored by Git.

| Task | Read first | Work/evidence location |
|---|---|---|
| Choose scope | product/context.md, prd.md, decisions.md | product/ |
| Pick or track a ticket | product/roadmap.md, build-plan.md, backlog.md | Linear for live execution; local backlog for specifications/mapping |
| Implement | plugin/context.md, docs/ARCHITECTURE.md, ticket-specific source | plugin/ |
| Verify | quality/context.md, release-criteria.md, relevant scenario | quality/reports/ and quality/renders/ |
| Package or launch | release/context.md, release-plan.md, verified reports | release/ |

## Milestones and exit gates

| Stage | Outcome | Tickets | Exit gate |
|---|---|---|---|
| S0 — Build baseline | Requirements and execution tracking | B-01–B-02 | Requirements linked to tickets; baseline inspected; Linear project, milestones and dependencies verified |
| S1 — First use | Install, discover, connect, create, preview, revise | B-03–B-08 | Supported development install journey works locally with actionable setup errors; platform scope chosen; distribution investigation has a documented result or explicit external blocker |
| S2 — Safe revision and delivery | Preserve projects, recover safely, deliver AEP/movie | B-09–B-13 | Recovery matrix, preservation cases, revision cases and complete delivery pass with evidence |
| S3 — Creative proof | Three distinct complete demonstrations and a harder capability probe | B-14–B-17, B-27 | Type identity, causal explainer and transparently fictional concept-product film each have editable work, before/after revision, complete exports, full-speed review and separately recorded creative acceptance; the additional probe documents the practical limit and Joe's assessment |
| S4 — Release candidate | Independently installable, reviewed and reproducible | B-18–B-23, B-31–B-34 | Clean-machine run and all public v1 release criteria pass against an identified candidate; Joe resolves product decisions |
| S5 — Public launch | Authorized Codex release and verified stable public install | B-24–B-25 | Reviewed stable Git release is authorized/published; actual public artifact installs and support works |

S0 tracking setup is not a technical prerequisite for local implementation if Linear is unavailable. Native AE operations remain sequential; independent recovery, installation, content, rights and lifecycle work can progress separately. D-006/D-007 settle the initial route and scope; B-19 licensing and B-20 publisher decisions should begin early. A delayed directory response does not block the chosen Codex launch, local onboarding, recovery or demonstrations. It blocks only directory claims and launch through that route.

One native AE controller at a time, even when other research or documentation proceeds independently. A clean-machine run must use the selected candidate artifact; material candidate changes trigger affected revalidation and, when installation changes, another clean-install check.

Recruiting a technically skilled external tester is not a prerequisite for the clean-machine gate. One separate Mac operated by Joe can prove that the candidate installs and completes the documented journey outside the development machine. Record the operator and every assist; do not present that run as ordinary-user usability evidence. The user-facing install path must avoid Git expertise and source builds. Observe a creator using the guide when available, and use their friction to improve onboarding without blocking independent engineering work.

D-011 excludes Joe's company-managed Mac. Continue all independent development and release preparation while AFT-18 waits for a personally owned or expressly authorized separate Mac. Local isolation, package smoke checks and a fresh task on the development Mac can catch defects, but they do not replace the independent-machine gate or justify public-install claims.

## Start here

1. Open the Linear project and select the next unblocked ticket. B-02 setup has verified all 25 issues, six milestones and 53 dependencies; local B-xx keys map to AFT issue identifiers in backlog.md.
2. B-03 and B-04: apply D-006/D-007 to the release work. Verify the public Git install and exact tested versions before claims; do not hold unrelated local work for directory responses.
3. B-05: make prerequisite diagnostics dependable. B-06 can prepare supported install/update instructions alongside it.
4. B-07 and B-08: prove the full first-session journey and actionable failure recovery.
5. B-13 then B-09–B-12: build reusable quality scenarios and verify preservation, revision and delivery before scaling creative demos.

Do not rewrite the native engine simply because this is a new project. Use the existing bundled implementation and address observed gaps against the PRD.

## Ticket execution and completion

Each ticket contains a concrete result, scope, dependencies, acceptance checks and evidence destination. Select the next unblocked item, inspect its relevant guidance/source, make the smallest coherent change, run appropriate checks, then attach the evidence before changing status.

For native work: inspect and record the exact AE project, establish owned items/output locations, execute with one controller, inspect on uncertain completion and clean up only verified owned test items. Runtime success, visual judgment and user acceptance are separate fields in the report.

Use the team's existing Linear workflow. Suggested mapping: queued work → Backlog; dependency-satisfied selected work → Todo; active work → In Progress; awaiting inspection → Review if available; evidence accepted → Done. Represent an external wait with a dependency and a clear reason using available team conventions. Do not invent a status the team lacks or silently mark a blocked check complete.

Connected team: After Effects Studio (`AFT`, team ID d32aaf1c-faf1-4721-a4fe-70ba82422a45). Project: [After Effects Studio — Public v1](https://linear.app/jkbtech/project/after-effects-studio-public-v1-11b497a84750) (`P-AFT-59`). Verified workflow: Backlog → Todo → In Progress → In Review → Done, with Canceled and Duplicate available. Use In Review for inspection; do not create a separate Review status. All 25 issues were created unassigned, with High or Medium priority and no invented dates/estimates. See [setup evidence](../quality/reports/2026-10-06-build-planning/linear-setup.md).

After Linear publication, Linear owns day-to-day status, assignment, priority and dependencies. The repo owns requirements, product decisions, stage definitions and evidence. Keep local B-xx keys as durable planning references and map them to real Linear identifiers/URLs in backlog.md. Do not run two manually maintained status boards.

No dates, estimates or assignees have been invented. Estimate implementation tickets after their initial investigation; use measured throughput to forecast the launch. Joe owns product choices and launch authorization; implementation ownership is set when work is picked up.

## Current evidence and limits

The planning baseline is in [the dated audit](../quality/reports/2026-10-06-build-planning/baseline.md). Offline packaged startup and prerequisite discovery pass on this host. Historical native checks cover one Mac and sampled frames. Clean-machine installation, complete movie/AEP delivery, recovery coverage, all three finished demonstrations and public distribution remain open.

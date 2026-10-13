# Public v1 backlog

Authoritative remaining release specifications: [release-execution-plan.md](release-execution-plan.md), approved 2026-10-13 under D-013. Baseline history is retained; current Linear descriptions and the execution plan supersede conflicting old acceptance/dependency wording.

Prepared and published to Linear on 2026-10-06. The owning team is After Effects Studio (`AFT`). Local B-xx keys map to AFT-1–AFT-25 below; Linear owns live status, priorities, assignments and dependencies. The earlier authentication blocker is resolved.

Target project: After Effects Studio — Public v1. Use six milestones with the S0–S5 names in [build-plan.md](build-plan.md). Reuse a matching existing project after inspecting it. Before creating issues, search within the selected project for each local key/title and reuse a match. Keep B-xx in issue descriptions, record the resulting identifiers and URLs here, and verify dependencies and milestone placement after creation.

Priority: High means release-critical or prerequisite work; Normal maps to Linear's Medium priority and means required work that follows prerequisites. No issue is urgent by default. Dependencies below describe the initial hard completion dependencies; preparatory investigation can begin earlier. Initial assignments are empty. B-01 has baseline evidence; B-02 has verified Linear setup evidence. Check Linear for current status and dependency changes.

Every completed ticket requires an outcome note and relevant evidence. Implementation tickets include changed source/tests and appropriate checks. Native checks additionally record the exact project, owned scope, preservation, failures and cleanup. Quality runs include package version/hash, source revision, host, inputs, action log and output paths. Use the matching dated folder under quality/renders/ for heavy artifacts.

## S0 — Build baseline

### B-01 — Establish requirements, stage gates and repository baseline

- Priority: High. Dependencies: none. Local result: complete.
- Scope: preserve the approved four-room scaffold; link requirements, staged plan and ticket specifications; audit entry paths and current offline operation.
- Acceptance: every PRD requirement maps to tickets; every ticket belongs to a milestone; evidence distinguishes current checks from historical native results; all local document links resolve.
- Evidence: [baseline](../quality/reports/2026-10-06-build-planning/baseline.md), prd.md, build-plan.md and this backlog.

### B-02 — Connect Linear and publish the execution backlog

- Priority: High. Dependencies: B-01. External input: authenticated Linear connection and owning team.
- Scope: inspect existing projects/issues; create or reuse one project, six milestones and these 25 tickets; attach dependency relations, priorities and requirement references.
- Acceptance: all B-xx keys map to real identifiers/URLs, no duplicates, milestone/dependency readback matches this plan, existing team workflow is respected; only B-01 starts Done based on its evidence.
- Evidence: replace the pending mapping section below with links and record the project/team/workflow in build-plan.md. Do not recreate tickets after uncertain API completion without checking first.

## S1 — First use

### B-03 — Resolve the local-controller distribution route

- Priority: High. Dependencies: B-01. Joe chose the Codex-first route in D-006; directory review is a separate future input.
- Scope: verify current official host/plugin requirements, distinguish local plugin installation from hosted MCP submission, document data flow and prepare a technical submission brief. Existing release-plan statements are historical research to recheck.
- Acceptance: dated primary sources and verified constraints support the chosen route; unresolved directory questions and their owner are explicit; no cloud bridge is assumed. Close when the chosen route is recorded in decisions.md. Directory review does not block this Codex-first route decision.
- Evidence: release/submission/local-controller-brief.md and a dated quality report. Prepare outreach text if useful; sending it requires explicit instruction.

### B-04 — Choose the v1 platform and host support matrix

- Priority: High. Dependencies: B-01. Joe chose the initial scope in D-007; release-candidate testing still needs a separate Mac.
- Scope: propose macOS-first from existing evidence; define exact OS/AE/agent-host/runtime versions and required installation/creation/revision/export checks. Distinguish proposed, tested and advertised support.
- Acceptance: chosen matrix is recorded as a product decision; unverified platforms are excluded from release claims; each claimed combination has an assigned validation scenario and machine requirement.
- Evidence: quality/fixtures/platform-matrix.md, decisions.md and consistent requirement wording in plugin/release docs.

### B-05 — Make first-use prerequisite diagnostics actionable

- Priority: High. Dependencies: B-01.
- Scope: inspect doctor/start/launcher discovery; cover missing or old Node, missing bundle/library, standard/nonstandard AE locations and export prerequisites. Keep offline checks separate from live permission checks.
- Acceptance: supported fixtures produce correct success/failure exit behavior and a concrete next action; no false permission/support assurance from file existence; running doctor does not launch or change AE.
- Evidence: relevant automated checks and quality/reports/YYYY-MM-DD-first-use/diagnostics.md.

### B-06 — Document and verify supported install, update and cache refresh

- Priority: High. Dependencies: B-01.
- Scope: use Plugin Creator to install from the canonical package through the supported local workflow; document fresh-session/cache behavior and recovery from a stale version. Make the user-facing path a guided install from a reviewed package or marketplace source, with no Git expertise assumed.
- Acceptance: installed version/hash matches the intended package; startup works from an unrelated working directory without developer dependencies/private paths; existing unrelated MCP registrations survive; restore instructions are documented. The user does not need `git clone`, `npm ci`, a source build, or manual plugin config edits. If the supported host still requires a copy/paste command, document the exact command and its expected result.
- Evidence: plugin/README.md and a dated install/update report. Public-channel instructions remain dependent on B-03 and are finalized in B-22.

### B-07 — Complete the guided first-session journey

- Priority: High. Dependencies: B-05, B-06.
- Scope: implement the install → connect → inspect → brief → editable scene → inspected preview → meaningful revision path in an explicitly owned scene.
- Acceptance: documented instructions carry a fresh task through the entire journey; required permissions and missing information are surfaced at the right step; no private repo, rig or paid media service is required; project inspection precedes writes.
- Evidence: quality/reports/YYYY-MM-DD-first-session/ with exact prompt/actions, outputs and failures. This local run does not replace B-18.

### B-08 — Explain setup and connection failures with recovery steps

- Priority: High. Dependencies: B-05.
- Scope: diagnose AE closed/busy, connection timeout, macOS Automation denial and scripting-file-access denial where supported; map runtime errors to useful user instructions.
- Acceptance: each exercised failure identifies the problem and next action without claiming unobserved permission state; unsafe retries are prevented or explicitly withheld; all cases preserve the current project.
- Evidence: targeted failure fixtures/tests and quality/reports/YYYY-MM-DD-connection-recovery/; untestable cases stay explicitly unverified.

## S2 — Safe revision and delivery

### B-09 — Prove controlled uncertain-write recovery without duplicate mutations

- Authoritative remaining-work specification: [approved release execution plan](release-execution-plan.md) and the current AFT-9 Linear description.
- Completion prerequisites: AFT-8, AFT-13.
- D-013 (2026-10-13) supersedes conflicting historical scope, acceptance and dependency wording. The detailed plan lists exact inputs, steps, safety boundaries, tests, evidence, external checkpoints and definition of done.

### B-10 — Verify preservation of existing and unsaved projects

- Priority: High. Dependencies: B-13.
- Scope: use deliberately owned fixtures for blank, existing saved and existing unsaved projects; record project/layer identities, unrelated content, links and relevant properties before/after.
- Acceptance: no unrelated close/save/switch/overwrite; unrelated material remains intact; cleanup verifies ownership; checks go beyond project path/item count and describe unavoidable undo-history effects.
- Evidence: quality/reports/YYYY-MM-DD-project-preservation/ and reusable fixtures.

### B-11 — Verify targeted scene revisions

- Priority: High. Dependencies: B-07, B-10.
- Scope: exercise copy, palette, pacing and framing changes against an existing owned scene; use stable item identification and preserve approved material.
- Acceptance: before/after checks prove requested changes and unchanged unrelated content; repeated requests do not accumulate duplicate scenes; revised native structure stays editable and rendered output is inspected.
- Evidence: quality/reports/YYYY-MM-DD-revision/ with before/after AEP/video pointers and relevant regression checks.

### B-12 — Complete editable AEP and movie delivery

- Priority: High. Dependencies: B-11.
- Scope: establish save/export/asset collection and handoff workflow; check output ownership and overwrite behavior; specify required export tools and failures.
- Acceptance: safely reopen delivered AEP, verify linked assets/native layers, inspect full-speed playback, verify duration/resolution/fps and complete movie decode, hash-match delivered copies. Report missing dependencies instead of claiming delivery.
- Evidence: quality/reports/YYYY-MM-DD-delivery/ with verifier output and matching quality/renders/ artifacts.

### B-13 — Define repeatable quality scenarios and evidence template

- Priority: High. Dependencies: B-01.
- Scope: small rights-cleared fixtures and scenarios for setup, preservation, missing fonts/media, recovery, revision and export; retain canonical creative prompts in plugin/evals/.
- Acceptance: every release criterion maps to a repeatable scenario; reports specify package/version/hash, host, steps, output, failures, runtime result, visual review and user acceptance; native scenarios require state inspection and one controller.
- Evidence: quality/fixtures/ scenario documents and quality/reports/report-template.md. Do not create an automatic destructive E2E runner against the user's current project.

## S3 — Creative proof

### B-14 — Finish the type-led identity demonstration

- Priority: Normal. Dependencies: B-12, B-13. B-09 is a separate release reliability gate under D-012.
- Scope: distinct brand/type treatment using permitted fonts and assets; ordinary beat, difficult transition and meaningful revision.
- Acceptance: approved brief, editable AEP, complete movie, before/after revision, contact-sheet inspection and full-speed playback; readability, clipping, timing and holds checked; Joe's creative acceptance recorded separately.
- Evidence: quality/reports/YYYY-MM-DD-type-identity/ and matching renders folder.

### B-15 — Finish the causal explainer demonstration

- Priority: Normal. Dependencies: B-12, B-13. B-09 is a separate release reliability gate under D-012.
- Scope: show an understandable cause/state-change sequence with persistent object identity and a materially different style from B-14.
- Acceptance: same complete delivery/revision/review requirements as B-14; ordinary beat and difficult transition demonstrate causal clarity and continuity; Joe's creative acceptance recorded separately.
- Evidence: quality/reports/YYYY-MM-DD-causal-explainer/ and matching renders folder.

### B-16 — Finish the original-art concept product demonstration

- Priority: Normal. Dependencies: B-12, B-13. B-09 is a separate release reliability gate under D-012. Joe chose a generated-art route because no existing owned product artwork is available and approved the ARC 01 brief on 2026-10-07. The native production and acceptance evidence are in `quality/reports/2026-10-07-product-sequence/report.md`.
- Scope: product sequence adapted to one fixed, original concept-product image generated outside AE, with source/provenance, ordinary beat, difficult transition and meaningful revision. Present the depicted product as fictional; do not imply it is sold or has verified specifications.
- Acceptance: same delivery/revision/review requirements as B-14; the generated source is visibly inspected and hash-identified; no invented packaging represented as a real product; linked assets resolve and reuse terms are recorded; Joe's creative acceptance recorded separately.
- Evidence: quality/reports/YYYY-MM-DD-product-sequence/ with asset provenance and matching renders folder.

### B-17 — Evaluate portable craft across all three styles

- Priority: Normal. Dependencies: B-14, B-15, B-16.
- Scope: assess fresh-session use of packaged foundations/techniques, consistent craft and distinct appearance across the three demos; repair only demonstrated guidance gaps and regenerate library hashes after edits.
- Acceptance: read logs show no private source/rig dependency; runtime correctness and visual quality have separate results; corrections are reflected in packaged guidance and affected demos are rechecked. No claim of superior quality based solely on checklist scores.
- Evidence: plugin/evals/ updates when needed and quality/reports/YYYY-MM-DD-portable-craft/.

### B-27 — Probe the plugin's creative and control limits

- Priority: Normal. Dependencies: B-17. Blocks B-23 final release review. This post-baseline ticket was added after Joe accepted B-14/B-15 as proof-of-concept examples and asked for a harder test before the product is finished; it is scheduled later, not for immediate execution.
- Scope: choose one ambitious, rights-cleared real-world brief with several coordinated beats, layered visual hierarchy, a demanding transition, native and linked-asset work where relevant, and a meaningful late revision. Record its difficulty targets before construction. Use the packaged candidate in a fresh agent session and an inspected, owned AE project.
- Acceptance: reopen the editable AEP; inspect the complete movie at full speed and dense frames around difficult moments; verify movie metadata and full decode; prove the requested revision while approved material persists. Record time, interventions, failed operations, visual weaknesses, recovery and the practical capability boundary. Separate runtime result, visual judgment and Joe's assessment. A partial or failed attempt is valuable evidence, but not a pass; fix release-blocking defects or explicitly narrow claims before B-23.
- Evidence: quality/reports/YYYY-MM-DD-capability-probe/ and matching ignored renders folder.

## S4 — Release candidate

### B-18 — Run a separate-Mac install, create, revise and export acceptance test

- Authoritative remaining-work specification: [approved release execution plan](release-execution-plan.md) and the current AFT-18 Linear description.
- Completion prerequisites: AFT-4, AFT-7, AFT-12, AFT-21.
- D-013 (2026-10-13) supersedes conflicting historical scope, acceptance and dependency wording. The detailed plan lists exact inputs, steps, safety boundaries, tests, evidence, external checkpoints and definition of done.

### B-19 — Decide and apply original-material licensing

- Priority: High. Dependencies: B-01. External input: Joe's explicit license decision.
- Scope: inventory upstream licenses and original code/craft material; present redistribution/repackaging choices; preserve notices and apply only Joe's chosen terms.
- Acceptance: decision recorded in decisions.md, package terms and notices agree, media permissions are accounted for, free use is not mistaken for an open-source grant.
- Evidence: release/submission/licensing-inventory.md and final package license/notices.

### B-20 — Finalize publisher, support ownership and publication-ready page content

- Authoritative remaining-work specification: [approved release execution plan](release-execution-plan.md) and the current AFT-20 Linear description.
- Completion prerequisites: AFT-1.
- D-013 (2026-10-13) supersedes conflicting historical scope, acceptance and dependency wording. The detailed plan lists exact inputs, steps, safety boundaries, tests, evidence, external checkpoints and definition of done.

### B-21 — Build a reproducible and clean release package

- Priority: High. Dependencies: B-06, B-19.
- Scope: use Plugin Creator for candidate packaging; validate manifests, skills, resources and hashes; audit secrets, absolute/private dependencies, included assets and notices; define deterministic inputs and archive procedure.
- Acceptance: rebuild produces the same normalized payload/hashes; documented archive metadata differences are explained; clean unpacked startup works; source revision, package version and SHA-256 are recorded; public metadata is finalized through B-22/B-23.
- Evidence: quality/reports/YYYY-MM-DD-release-package/ and ignored release/packages/ candidate archive.

### B-22 — Finalize trustworthy Codex install, listing and reviewer materials

- Authoritative remaining-work specification: [approved release execution plan](release-execution-plan.md) and the current AFT-22 Linear description.
- Completion prerequisites: AFT-3, AFT-4, AFT-17, AFT-32.
- D-013 (2026-10-13) supersedes conflicting historical scope, acceptance and dependency wording. The detailed plan lists exact inputs, steps, safety boundaries, tests, evidence, external checkpoints and definition of done.

### B-23 — Freeze and review the exact Codex release candidate

- Authoritative remaining-work specification: [approved release execution plan](release-execution-plan.md) and the current AFT-23 Linear description.
- Completion prerequisites: AFT-2, AFT-3, AFT-4, AFT-9, AFT-10, AFT-17, AFT-18, AFT-19, AFT-20, AFT-21, AFT-22, AFT-27, AFT-29, AFT-31, AFT-32, AFT-33, AFT-34.
- D-013 (2026-10-13) supersedes conflicting historical scope, acceptance and dependency wording. The detailed plan lists exact inputs, steps, safety boundaries, tests, evidence, external checkpoints and definition of done.

## S5 — Public launch

### B-24 — Publish the reviewed Codex Git release after authorization

- Authoritative remaining-work specification: [approved release execution plan](release-execution-plan.md) and the current AFT-24 Linear description.
- Completion prerequisites: AFT-23.
- D-013 (2026-10-13) supersedes conflicting historical scope, acceptance and dependency wording. The detailed plan lists exact inputs, steps, safety boundaries, tests, evidence, external checkpoints and definition of done.

### B-25 — Verify the released Codex artifact and close launch handoff

- Authoritative remaining-work specification: [approved release execution plan](release-execution-plan.md) and the current AFT-25 Linear description.
- Completion prerequisites: AFT-24.
- D-013 (2026-10-13) supersedes conflicting historical scope, acceptance and dependency wording. The detailed plan lists exact inputs, steps, safety boundaries, tests, evidence, external checkpoints and definition of done.

### B-30 — Confirm OpenAI's review route for the local AE controller

- Authoritative remaining-work specification: [approved release execution plan](release-execution-plan.md) and the current AFT-30 Linear description.
- Completion prerequisites: None; external access/authorization requirements are stated in the specification.
- D-013 (2026-10-13) supersedes conflicting historical scope, acceptance and dependency wording. The detailed plan lists exact inputs, steps, safety boundaries, tests, evidence, external checkpoints and definition of done.

### B-31 — Complete publication source, asset and license review

- Authoritative remaining-work specification: [approved release execution plan](release-execution-plan.md) and the current AFT-31 Linear description.
- Completion prerequisites: None; external access/authorization requirements are stated in the specification.
- D-013 (2026-10-13) supersedes conflicting historical scope, acceptance and dependency wording. The detailed plan lists exact inputs, steps, safety boundaries, tests, evidence, external checkpoints and definition of done.

### B-32 — Publish reviewed repository and support pages after authorization

- Authoritative remaining-work specification: [approved release execution plan](release-execution-plan.md) and the current AFT-32 Linear description.
- Completion prerequisites: AFT-31, AFT-20.
- D-013 (2026-10-13) supersedes conflicting historical scope, acceptance and dependency wording. The detailed plan lists exact inputs, steps, safety boundaries, tests, evidence, external checkpoints and definition of done.

### B-33 — Verify update, uninstall and rollback preserve user work

- Authoritative remaining-work specification: [approved release execution plan](release-execution-plan.md) and the current AFT-33 Linear description.
- Completion prerequisites: AFT-6, AFT-21.
- D-013 (2026-10-13) supersedes conflicting historical scope, acceptance and dependency wording. The detailed plan lists exact inputs, steps, safety boundaries, tests, evidence, external checkpoints and definition of done.

### B-34 — Rehearse installation from the actual public Git marketplace

- Authoritative remaining-work specification: [approved release execution plan](release-execution-plan.md) and the current AFT-34 Linear description.
- Completion prerequisites: AFT-32, AFT-18.
- D-013 (2026-10-13) supersedes conflicting historical scope, acceptance and dependency wording. The detailed plan lists exact inputs, steps, safety boundaries, tests, evidence, external checkpoints and definition of done.

### B-35 — Prepare the route-specific OpenAI directory candidate and reviewer cases

- Authoritative remaining-work specification: [approved release execution plan](release-execution-plan.md) and the current AFT-35 Linear description.
- Completion prerequisites: AFT-30, AFT-23.
- D-013 (2026-10-13) supersedes conflicting historical scope, acceptance and dependency wording. The detailed plan lists exact inputs, steps, safety boundaries, tests, evidence, external checkpoints and definition of done.

### B-36 — Submit, track review and publish the approved OpenAI listing

- Authoritative remaining-work specification: [approved release execution plan](release-execution-plan.md) and the current AFT-36 Linear description.
- Completion prerequisites: AFT-35.
- D-013 (2026-10-13) supersedes conflicting historical scope, acceptance and dependency wording. The detailed plan lists exact inputs, steps, safety boundaries, tests, evidence, external checkpoints and definition of done.

## Linear mapping

Project: [After Effects Studio — Public v1](https://linear.app/jkbtech/project/after-effects-studio-public-v1-11b497a84750). Team: After Effects Studio (`AFT`). The initial 25-issue/six-stage baseline was verified with 53 dependency edges. D-013 adds explicit release follow-ups and a separate directory milestone; current dependencies are in release-execution-plan.md and Linear. Linear is the live status source; this table is a stable identifier map.

| Local key | Linear issue | Title |
|---|---|---|
| B-01 | [AFT-1](https://linear.app/jkbtech/issue/AFT-1/establish-requirements-stage-gates-and-repository-baseline) | Establish requirements, stage gates and repository baseline |
| B-02 | [AFT-2](https://linear.app/jkbtech/issue/AFT-2/connect-linear-and-publish-the-execution-backlog) | Connect Linear and publish the execution backlog |
| B-03 | [AFT-3](https://linear.app/jkbtech/issue/AFT-3/resolve-the-local-controller-distribution-route) | Resolve the local-controller distribution route |
| B-04 | [AFT-4](https://linear.app/jkbtech/issue/AFT-4/choose-the-v1-platform-and-host-support-matrix) | Choose the v1 platform and host support matrix |
| B-05 | [AFT-5](https://linear.app/jkbtech/issue/AFT-5/make-first-use-prerequisite-diagnostics-actionable) | Make first-use prerequisite diagnostics actionable |
| B-06 | [AFT-6](https://linear.app/jkbtech/issue/AFT-6/document-and-verify-supported-install-update-and-cache-refresh) | Document and verify supported install, update and cache refresh |
| B-07 | [AFT-7](https://linear.app/jkbtech/issue/AFT-7/complete-the-guided-first-session-journey) | Complete the guided first-session journey |
| B-08 | [AFT-8](https://linear.app/jkbtech/issue/AFT-8/explain-setup-and-connection-failures-with-recovery-steps) | Explain setup and connection failures with recovery steps |
| B-09 | [AFT-9](https://linear.app/jkbtech/issue/AFT-9/prove-safe-recovery-from-missing-assets-and-uncertain-execution) | Prove controlled uncertain-write recovery without duplicate mutations |
| B-10 | [AFT-10](https://linear.app/jkbtech/issue/AFT-10/verify-preservation-of-existing-and-unsaved-projects) | Verify preservation of existing and unsaved projects |
| B-11 | [AFT-11](https://linear.app/jkbtech/issue/AFT-11/verify-targeted-scene-revisions) | Verify targeted scene revisions |
| B-12 | [AFT-12](https://linear.app/jkbtech/issue/AFT-12/complete-editable-aep-and-movie-delivery) | Complete editable AEP and movie delivery |
| B-13 | [AFT-13](https://linear.app/jkbtech/issue/AFT-13/define-repeatable-quality-scenarios-and-evidence-template) | Define repeatable quality scenarios and evidence template |
| B-14 | [AFT-14](https://linear.app/jkbtech/issue/AFT-14/finish-the-type-led-identity-demonstration) | Finish the type-led identity demonstration |
| B-15 | [AFT-15](https://linear.app/jkbtech/issue/AFT-15/finish-the-causal-explainer-demonstration) | Finish the causal explainer demonstration |
| B-16 | [AFT-16](https://linear.app/jkbtech/issue/AFT-16/finish-the-original-art-concept-product-demonstration) | Finish the original-art concept product demonstration |
| B-17 | [AFT-17](https://linear.app/jkbtech/issue/AFT-17/evaluate-portable-craft-across-all-three-styles) | Evaluate portable craft across all three styles |
| B-18 | [AFT-18](https://linear.app/jkbtech/issue/AFT-18/run-a-clean-machine-acceptance-test) | Run a separate-Mac install, create, revise and export acceptance test |
| B-19 | [AFT-19](https://linear.app/jkbtech/issue/AFT-19/decide-and-apply-original-material-licensing) | Decide and apply original-material licensing |
| B-20 | [AFT-20](https://linear.app/jkbtech/issue/AFT-20/set-publisher-identity-and-public-support-ownership) | Finalize publisher, support ownership and publication-ready page content |
| B-21 | [AFT-21](https://linear.app/jkbtech/issue/AFT-21/build-a-reproducible-and-clean-release-package) | Build a reproducible and clean release package |
| B-22 | [AFT-22](https://linear.app/jkbtech/issue/AFT-22/finish-truthful-listing-support-and-reviewer-materials) | Finalize trustworthy Codex install, listing and reviewer materials |
| B-23 | [AFT-23](https://linear.app/jkbtech/issue/AFT-23/review-the-exact-candidate-against-every-launch-gate) | Freeze and review the exact Codex release candidate |
| B-24 | [AFT-24](https://linear.app/jkbtech/issue/AFT-24/submit-and-publish-the-approved-candidate) | Publish the reviewed Codex Git release after authorization |
| B-25 | [AFT-25](https://linear.app/jkbtech/issue/AFT-25/verify-public-installation-and-close-launch-handoff) | Verify the released Codex artifact and close launch handoff |
| B-26 | [AFT-26](https://linear.app/jkbtech/issue/AFT-26) | Fix color keyframe easing on native AE properties |
| B-27 | [AFT-27](https://linear.app/jkbtech/issue/AFT-27/probe-the-plugins-creative-and-control-limits) | Probe the plugin's creative and control limits |
| B-28 | [AFT-28](https://linear.app/jkbtech/issue/AFT-28) | Keep ae_version_info read-only on a clean AE project |
| B-29 | [AFT-29](https://linear.app/jkbtech/issue/AFT-29) | Report render completion only when a new output file exists |
| B-30 | [AFT-30](https://linear.app/jkbtech/issue/AFT-30) | Confirm OpenAI's review route for the local AE controller |
| B-31 | [AFT-31](https://linear.app/jkbtech/issue/AFT-31) | Complete publication source, asset and license review |
| B-32 | [AFT-32](https://linear.app/jkbtech/issue/AFT-32) | Publish reviewed repository and support pages after authorization |
| B-33 | [AFT-33](https://linear.app/jkbtech/issue/AFT-33) | Verify update, uninstall and rollback preserve user work |
| B-34 | [AFT-34](https://linear.app/jkbtech/issue/AFT-34) | Rehearse installation from the actual public Git marketplace |
| B-35 | [AFT-35](https://linear.app/jkbtech/issue/AFT-35) | Prepare the route-specific OpenAI directory candidate and reviewer cases |
| B-36 | [AFT-36](https://linear.app/jkbtech/issue/AFT-36) | Submit, track review and publish the approved OpenAI listing |

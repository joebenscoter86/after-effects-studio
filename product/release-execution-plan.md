# Approved release execution plan — 2026-10-13

Joe approved this plan and requested explicit Linear instructions suitable for less expensive build models. D-013 is the decision record. This document and the current Linear descriptions supersede conflicting historical natural-timeout, dependency and combined-launch wording. Historical reports remain evidence for their exact scope; do not rewrite them as current passes.

## Tracks and sequencing

The six S0–S5 build stages remain. A separate directory milestone is an external distribution track, not a seventh sequential prerequisite for Codex release.

1. Recovery (AFT-9), independent installation (AFT-18), publisher/page preparation (AFT-20), source/rights review (AFT-31), lifecycle acceptance (AFT-33), and directory inquiry preparation (AFT-30) can progress independently as inputs permit.
2. Review concrete public source/page actions, obtain specific authorization, and publish distribution infrastructure (AFT-32). This exposes downloadable source/catalog before a stable announcement; explicitly review that exposure.
3. Finalize public materials (AFT-22) and rehearse the actual public Git source on an eligible separate Mac (AFT-34). AFT-18 may share that run if both specifications are met.
4. Freeze/reconcile the exact final candidate (AFT-23), obtain specific stable-release authorization, publish Codex release (AFT-24), and verify the stable public artifact (AFT-25).
5. Separately obtain OpenAI's local-controller review answer (AFT-30), prepare a directory candidate only for a confirmed eligible route (AFT-35), then execute authorized submission/review/publication and directory-install verification (AFT-36). No directory ticket blocks Codex launch. A hosted companion requires a separate product decision.

No publication or outreach is authorized merely by approval of this plan.

## Dependency map

| Ticket | Concrete outcome | Completion prerequisites |
|---|---|---|
| AFT-9 | Prove controlled uncertain-write recovery without duplicate mutations | AFT-8, AFT-13 |
| AFT-18 | Run a separate-Mac install, create, revise and export acceptance test | AFT-4, AFT-7, AFT-12, AFT-21 |
| AFT-20 | Finalize publisher, support ownership and publication-ready page content | AFT-1 |
| AFT-22 | Finalize trustworthy Codex install, listing and reviewer materials | AFT-3, AFT-4, AFT-17, AFT-32 |
| AFT-23 | Freeze and review the exact Codex release candidate | AFT-2, AFT-3, AFT-4, AFT-9, AFT-10, AFT-17, AFT-18, AFT-19, AFT-20, AFT-21, AFT-22, AFT-27, AFT-29, AFT-31, AFT-32, AFT-33, AFT-34 |
| AFT-24 | Publish the reviewed Codex Git release after authorization | AFT-23 |
| AFT-25 | Verify the released Codex artifact and close launch handoff | AFT-24 |
| AFT-30 | Confirm OpenAI's review route for the local AE controller | None; external authorization/response may gate later steps |
| AFT-31 | Complete publication source, asset and license review | None; external authorization/response may gate later steps |
| AFT-32 | Publish reviewed repository and support pages after authorization | AFT-31, AFT-20 |
| AFT-33 | Verify update, uninstall and rollback preserve user work | AFT-6, AFT-21 |
| AFT-34 | Rehearse installation from the actual public Git marketplace | AFT-32, AFT-18 |
| AFT-35 | Prepare the route-specific OpenAI directory candidate and reviewer cases | AFT-30, AFT-23 |
| AFT-36 | Submit, track review and publish the approved OpenAI listing | AFT-35 |

A dependency prevents claiming completion where inputs are required; it need not prevent preparatory drafting expressly allowed by a ticket. In particular AFT-18 has no AFT-9 dependency, and AFT-22 can draft before AFT-32 supplies live URLs. Do not add AFT-23 as a blocker for AFT-32: that recreates a public-link cycle.

## Shared execution instructions

## Authoritative execution contract — approved 2026-10-13

This description implements Joe's approved path-forward review. It supersedes conflicting older acceptance/dependency wording; earlier evidence remains valid only for its recorded candidate and scope. Do not reconstruct requirements from old chat.

Repository: this canonical After Effects Studio checkout. Read AGENTS.md, the relevant workspace context.md, product/decisions.md (D-013), product/release-execution-plan.md, then the files listed below. Linear owns live status/dependencies; the repo owns decisions and evidence. Existing uncommitted work belongs to this project: inspect and preserve it; do not reset, stash away, or overwrite unrelated changes.

Product choices: After Effects Studio; publisher JB Technology LLC; GitHub account joebenscoter86; free launch; original-material license D-008; initial local Codex desktop/macOS/AE 2026 scope. No billing, Windows expansion, speculative cloud/device bridge, new showcase films, custom domain, or outside technical tester is required.

Execution boundaries:
- This ticket authorizes only its stated work. Planning approval is not authorization to contact OpenAI, publish a repository/pages/release, upload a submission, or publish an approved listing. Prepare the exact action/material first; obtain the specific outstanding authorization at the ticket's explicit checkpoint. Reuse existing explicit authorization if it covers that exact action.
- Before native writes inspect the exact AE project. One AE controller at a time. Use test-owned items and output folders; preserve unrelated saved/unsaved work. Inspect uncertain completion before any retry. Never hang AE deliberately, disable employer controls, or use Joe's company-managed Mac.
- Use the installed plugin's namespace for acceptance; a different AE controller/source checkout is not installation evidence. No personal Content checkout, private rig, or private asset dependency.
- Keep status honest: preparation is not a pass. Use In Progress for execution, In Review for reviewable results, Done only when acceptance is met. External waits need a precise reason/next action, not invented completion. Do not invent assignees, dates, estimates, contacts, or compatibility claims.

Evidence required: quality/reports/YYYY-MM-DD-topic/report.md; heavy AEP/media in quality/renders/YYYY-MM-DD-topic/; archives in release/packages/. Record source revision plus dirty-tree/changed-file snapshot, package version/SHA-256 and relevant installed-file hashes, actual OS/chip/Codex/Node/AE builds, operator, exact prompts/actions, outputs, checks, failures/interventions, residual limitations, and separate runtime/visual/operator results. Redact publication copies. Link the report and summarize acceptance in Linear before closure. Run relevant tests; report skips and unrelated baseline failures instead of claiming a universal pass.


## Ticket specifications

### AFT-9 — Prove controlled uncertain-write recovery without duplicate mutations

Completion prerequisites: AFT-8, AFT-13.

## Result
Close the remaining uncertainty-recovery requirement through a repeatable controlled fault test. Waiting for a naturally occurring timeout is no longer acceptance criteria. Earlier missing-media/font and partial-batch evidence remains valid for its recorded scope.

## Read first
plugin/context.md; plugin/docs/ARCHITECTURE.md; plugin/docs/connection-recovery.md; plugin/runtime/src/transport/FileIpcTransport.ts; plugin/runtime/src/transport/AeTransport.ts; plugin/runtime/tests/transport-pull.test.ts; plugin/runtime/tests/transport-offline.test.ts; quality/reports/2026-10-09-uncertain-reclaim/report.md; quality/reports/2026-10-06-uncertain-execution/offline-and-context.md. For native work read plugin/skills/ae-control/SKILL.md and quality/context.md.

## Implementation and verification
1. Inventory uncertainty paths already covered: request never consumed/reclaimed; request consumed with missing response; request-reclaim race; dialog/busy state; partial batches. Preserve conservative possible-execution wording and no-blind-replay behavior.
2. Design a TEST-ONLY transport/response interception harness using the production uncertainty path. Use an owned fixture and one harmless uniquely marked native mutation (e.g. an owned null/layer). Withhold/delay the response after AE consumes the request; impose a bounded client deadline, not a busy loop or AE hang. A wrapper that invents a timeout after successful return does not test production timeout handling.
3. Pair it with the identical successful-control operation on an equivalent owned fixture so dispatch and inspection are proven. Establish known project/comp/layer IDs and baseline properties before either run.
4. In the fault run observe possible-write timeout, let AE finish, then inspect actual AE state read-only. Verify exactly one marked mutation, unchanged unrelated baseline, no blind automatic replay, and a bounded recovery path. Explain how the caller distinguishes never-picked-up from possibly-executed.
5. Inspect request/response/busy-lock cleanup and late-response handling. Do not release a still-active write lock or dispatch a competing write merely to inspect. If state cannot be safely established, report uncertainty and stop; do not retry mutation.
6. Keep interception inaccessible in the distributable production package. Review the package diff and payload for test flags/hooks. If a code seam is needed, make it explicit, constrained to tests, and covered by regressions.
7. Run runtime typechecks and focused uncertainty/race regressions; run the relevant offline suite after source changes. Build/validate the refreshed package if runtime changes, then execute the native control/fault from the appropriate tested candidate/harness and document exact differences from production.
8. Guardedly clean up only verified owned items after recording evidence. Preserve failed attempts and limitations.

## Acceptance
Controlled possible-write failure + real native state inspection proves one mutation and no replay; paired success, offline race regressions and cleanup evidence pass. No induced hang, unrelated project mutation, or production fault-injection switch. Natural failures encountered later are supplementary evidence. Runtime success, visual inspection where applicable and operator acceptance remain separate.

## Dependencies and handoff
AFT-18 may start/finish independently of this ticket; this ticket blocks AFT-23 final release approval only. If tooling cannot safely exercise the intended production path, produce a concrete harness limitation/alternative proposal rather than restoring an indefinite wait gate.

### AFT-18 — Run a separate-Mac install, create, revise and export acceptance test

Completion prerequisites: AFT-4, AFT-7, AFT-12, AFT-21.

## Result
Prove package portability on one separate personally owned or expressly authorized Mac. AFT-9 is not a prerequisite for this run. Both recovery and installation evidence are required at AFT-23.

## Read first
quality/fixtures/clean-machine-runbook.md; quality/fixtures/platform-matrix.md; plugin/docs/local-install.md; plugin/docs/first-session.md; plugin/docs/delivery.md; release/build-clean-test-kit.py; latest identified package report. Update the runbook's old AFT-9 natural-timeout wording to D-013.

## Steps
1. Arrange an eligible Mac/account with licensed AE and Codex, no original Content checkout or preconfigured After Effects Studio cache/marketplace. Joe can operate it. Record operator/experience, hardware and exact macOS/Codex/Node/AE builds and initial plugin state. Company-managed Mac is excluded; no outside tester or policy bypass.
2. Identify the exact versioned artifact and expected SHA-256. Use the verified local kit if public infrastructure is unavailable; if public Git is ready, combine this run with AFT-34 while satisfying both tickets. Record the route actually used.
3. Follow only published/draft user instructions, recording prerequisites, Node installation if needed, actual CLI/UI output, permission prompts, elapsed time and every assist. No source builds, private repo, personal rig or silent developer config repairs.
4. Verify installed payload file hashes/version, run installed doctor, start a fresh task and discover the plugin's own skills/controller tools. Read AE version/context before writes; preserve unrelated current projects.
5. Build the runbook's 6–8s geometric gate scene using packaged guidance; inspect start/contact/transition/hold frames. Change the gate color and opening time without duplicating objects or disturbing approved layout.
6. Save owned AEP and complete movie, reopen AEP, verify editability and assets, inspect full-speed playback, verify metadata/full decode and delivered-copy hashes.
7. Log failures before fixing. If fixes change installation/runtime, build a new identified candidate and rerun affected install/journey checks; never mix candidate hashes under one pass.
8. Feed exact tested versions and setup friction into platform/install docs; distinguish tested builds from intended support range.

## Acceptance
One complete separate-Mac journey on an identified candidate with all interventions and outputs recorded. Joe-operated portability is correctly labeled, not novice usability. A fresh task on the development Mac, a ZIP checksum alone or a different AE controller cannot close this ticket. A local-kit pass does not prove public Git installation; AFT-34 covers that separately.

## Handoff
AFT-34 may reuse this eligible Mac/session. AFT-23 reviews evidence applicability to the final candidate. If no eligible Mac is available, keep the external machine constraint explicit and continue other work.

### AFT-20 — Finalize publisher, support ownership and publication-ready page content

Completion prerequisites: AFT-1.

## Result
Produce an approved publisher/support destination plan and reviewed page content ready for public infrastructure publication. Live URLs are verified in AFT-32; they are no longer required to close this preparatory ticket.

## Read first
product/decisions.md D-008/D-009/D-013; release/website/destination-plan.md; release/website/index.md, support.md, privacy.md, terms.md; release/submission/security-route.md; release/submission/licensing-inventory.md; plugin/.codex-plugin/plugin.json.

## Steps
1. Retain settled identity: After Effects Studio, JB Technology LLC publisher, joebenscoter86 account, GitHub Issues ordinary support. Verify authorized account access without exposing tokens. Do not require a new organization, custom domain or support-email purchase.
2. Specify planned repository/page destinations and owners. Label planned URLs as planned; do not put nonexistent URLs into release metadata. Check account/repo availability without creating it.
3. Review page content against current source: local stdio/IPC/OS scripting, project/file writes and eval, local mailbox cleanup, tool inputs/results/previews reaching the agent host, and distinct GitHub/host/optional-service practices. No blanket 'data never leaves the machine' claim.
4. Set ordinary support triage owner and private security/privacy intake plan; prefer available GitHub private reporting, with a fallback decision if unsuitable. Define redaction guidance, support-report retention/deletion ownership and user contact path. Do not invent an SLA.
5. Align terms with D-008 and upstream rights. Leave copyright with its actual owner unless Joe explicitly assigns it to the LLC. Escalate only specific unresolved rights/content decisions; AFT-31 owns the exhaustive source/asset/license audit.
6. Produce an exact publication-ready content/destination checklist for AFT-32 review. Get human review of concrete unresolved content/ownership items. No public actions in this ticket.

## Acceptance
Publisher/account/support ownership is documented; four page drafts and destination plan are consistent and reviewable; privacy data-flow and support-retention/private-intake plans are explicit; no guessed live URLs, unsupported support promise or new license choice. Real URL/private-route verification occurs after authorized infrastructure publication in AFT-32.

## Handoff
AFT-32 depends on this preparation and AFT-31. AFT-22 may draft copy/assets in parallel; final working links depend on AFT-32, not an indefinitely open AFT-20.

### AFT-22 — Finalize trustworthy Codex install, listing and reviewer materials

Completion prerequisites: AFT-3, AFT-4, AFT-17, AFT-32.

## Result
Finish the public Codex materials against the real route and candidate. Directory-specific package/form work belongs to AFT-35 after route confirmation.

## Read first
plugin/docs/local-install.md; plugin/README.md; release/listing-draft.md; release/website/; release/submission/git-marketplace-route.md; release/submission/reviewer-walkthrough.md; quality/reports/2026-10-10-listing-visuals/report.md; accepted creative reports; AFT-20/AFT-31/AFT-32 outputs.

## Steps
1. Draft in parallel with AFT-20/AFT-31; final completion waits for AFT-32's real public URLs. Explain the value, free launch, exact prerequisites and tested builds. Keep supported scope distinct from untested platform paths.
2. Write a guided public marketplace install with exact supported CLI/UI and expected result, new-task/restart instructions and actionable troubleshooting. Verify actual CLI help; no git clone, dependency build or hand-edited secret/config assumptions.
3. Add a plain-language trust section: publisher and authentic source, what executable runs locally, why Node/AE/Automation/file scripting permissions are required, read/write/delete capability, optional eval/read-only controls, removal and retained user files. Never suggest bypassing Gmail/employer protections.
4. Finalize real icon/logo and authentic screenshots/clips from accepted native work; record asset provenance and candidate association. Reuse existing films; do not commission new showcases without a specific uncovered requirement.
5. Finalize product/support/privacy/terms links from AFT-32 and update manifest/catalog docs with verified URLs. Reconcile material claims with evidence: no first/only, Windows/cloud support, universal creative ceiling or real ARC 01 commercial product claims.
6. Turn the reviewer walkthrough into executable prompts/checks with prerequisites, expected tools and observable results. Show editability, preview, revision, export/reopen and safe failure. Directory case-count/recording requirements remain conditional in AFT-35.
7. Link AFT-33 update/removal/rollback instructions and tested public install steps from AFT-34 when available. Check links, assets, JSON/manifests and final package metadata. If bytes change, rebuild/hash and inform AFT-23 of revalidation needs.

## Acceptance
Public install/trust/support materials are complete and accurate; actual links/assets validate as a public visitor; claims map to specific evidence; prerequisites/security settings are understandable; candidate and sample versions are identified. Historical audit findings are closed only by current checks. No directory listing or launch claim.

## Handoff
AFT-34 tests the public install journey (can run from AFT-32's minimum reviewed guide while this final copy is polished). AFT-23 owns the final package/claims reconciliation.

### AFT-23 — Freeze and review the exact Codex release candidate

Completion prerequisites: AFT-2, AFT-3, AFT-4, AFT-9, AFT-10, AFT-17, AFT-18, AFT-19, AFT-20, AFT-21, AFT-22, AFT-27, AFT-29, AFT-31, AFT-32, AFT-33, AFT-34.

## Result
One final Codex release report proves readiness of a specific source/payload/version/hash. OpenAI directory eligibility/submission is a separate track and must not block this gate.

## Read first
quality/release-criteria.md; product/prd.md; product/release-execution-plan.md; quality/reports/2026-10-11-release-gate-preflight/report.md; AFT-9/18/20/22/31/32/33/34 reports; accepted AFT-14–17/27 evidence; package scripts and notices.

## Steps
1. Freeze reviewed source snapshot/commit, package version, ZIP hash and per-file payload hashes; record actual installed versions and tested builds. Reconcile the dirty development tree rather than claiming its base commit identifies all candidate bytes.
2. Build a requirement/gate matrix linking PRD/release criteria to actual evidence. Runtime tests, inspected motion and Joe's creative acceptance are separate columns. No preparation-only report can count as a pass.
3. Review changes since each earlier film/fixture/install candidate. Map changed modules to affected scenarios. Rerun impacted regressions/native cases and the final complete journey; do not recreate every accepted film simply because a version changed. Explain inherited evidence and residual scope.
4. Confirm controlled uncertain-write recovery (AFT-9), separate-Mac portability (AFT-18), actual public-source rehearsal (AFT-34), lifecycle safety (AFT-33), reviewed publication source/rights (AFT-31), verified infrastructure/support (AFT-32), and truthful final materials (AFT-22).
5. Rerun final package validation/resource/library hashes, unpacked startup/smoke and installed controller checks. Run relevant offline typechecks/tests; explicitly report platform skips and unrelated baseline lint failures. No invented full lint/native coverage claim.
6. Confirm at least one complete install/create/preview/revise/save/export/reopen journey applies to final bytes; metadata/full decode/asset and editability checks pass. Candidate changes after AFT-18/34 require affected reruns, especially install/runtime changes.
7. Confirm release notes identify exact support scope, free use/license boundaries, known limitations, stable installation route and tested rollback/support procedure.
8. Assemble a concrete release action sheet for AFT-24: public destination/ref/tag, reviewed archive/hash, pages/support links, release copy and approval scope. Final human review concerns exact content/actions. Do not publish here.

## Acceptance
No unresolved Codex release blocker or unsupported claim; final checks pass with honest limits; all evidence maps to final candidate or justified unaffected earlier evidence; rollback/support and publication action are concrete. Approval here prepares authorization and does not imply OpenAI approval or authorize publication.

## Explicit exclusions
No directory-response wait, speculative cloud bridge, new creative-ceiling exercise, outside technical tester, billing, custom domain or expanded platform matrix. AFT-30/35/36 are not blockers.

### AFT-24 — Publish the reviewed Codex Git release after authorization

Completion prerequisites: AFT-23.

## Result
Publish the reviewed stable Codex Git release. OpenAI directory submission/publication moved to AFT-36; do not wait for it or claim OpenAI approval.

## Read first
AFT-23 final release report/action sheet; AFT-32 infrastructure record; release/submission/git-marketplace-route.md; final release notes; release/packages/ exact reviewed artifact; AFT-33 rollback procedure.

## Steps
1. Recheck AFT-23 gate and that source/ref, version, archive hash, marketplace payload and public metadata still match. Any post-review material change returns to affected validation.
2. Present the concrete stable release destination/tag/ref, artifact/hash, announcement/release copy and support scope for Joe's explicit publication instruction unless already covered by a specific existing authorization. Ticket-planning approval is not publication approval.
3. Perform only authorized actions: publish the reviewed Git commit/catalog/ref/tag and release asset/docs through the established account. Do not push old unreviewed development history or publish unrelated media. If source publication already occurred in AFT-32, verify its diff and publish the stable reviewed release designation/artifact.
4. Record actual public URLs/commit/tag, artifact hashes and marketplace resolution. Download/inspect the distributed artifact through the ordinary user path and compare payload to approved bytes.
5. Check support/private incident links and rollback availability. If publication fails/partially succeeds, inspect actual public state before retry; record partial outcomes.

## Acceptance
Actual authorized stable Codex release is publicly accessible and matches approved version/payload. Record publication date/IDs and exact scope. A prepared release draft is not published. No OpenAI directory claim. Handoff to AFT-25 immediately for final public-version acceptance.

### AFT-25 — Verify the released Codex artifact and close launch handoff

Completion prerequisites: AFT-24.

## Result
Prove the stable artifact that users actually receive matches the approved candidate and completes the supported journey after publication.

## Read first
AFT-24 actual release URLs/ref/hash; AFT-18/AFT-34 installation evidence; final user guide and support pages; quality/fixtures/clean-machine-runbook.md; AFT-33 lifecycle report.

## Steps
1. Use a clean supported installation context on the eligible separate Mac/account, preserving unrelated installs/work. Follow the actual public stable route/ref/release, not the local source kit or a stale development cache.
2. Record public commit/tag/asset, installed version and payload hashes; compare to AFT-23 approved candidate. Note host-generated cache files separately.
3. In a fresh task verify the installed plugin's own skills/tools, inspect an owned AE project, create/preview/revise/export a small native scene, reopen AEP and verify assets/editability/movie metadata/full decode and playback.
4. Test public installation/support/privacy/terms links logged out, ordinary support availability and the documented private incident intake. Confirm update/removal/rollback instructions match actual stable host behavior.
5. Log defects as linked issues with reproducible steps, severity, user impact and whether launch should be withdrawn/rolled back. Invoke only already-authorized rollback actions; obtain any required new public-action decision with concrete evidence.
6. Write the launch handoff: actual supported versions, public source/version/hash, known limits, support owner/triage, rollback route and next follow-ups. Creator usability observation remains optional future work.

## Acceptance
Actual public stable install and advertised journey pass; hash matches, live links/support work, discovered defects have disposition, and final handoff is linked. AFT-34 prerelease rehearsal is reused as context but cannot replace this post-publication check. This closes Codex launch; AFT-30/35/36 track directory separately.

### AFT-30 — Confirm OpenAI's review route for the local AE controller

Completion prerequisites: None; see ticket start gate/external inputs.

## Result
Obtain an actionable OpenAI answer about directory review for the existing local stdio MCP/application-access architecture. This is an external directory dependency; it must not block the Codex Git release.

## Read first
release/submission/local-controller-brief.md; plugin/.mcp.json; plugin/scripts/start.mjs; release/submission/reviewer-walkthrough.md. Recheck official OpenAI plugin submission, local-MCP and application-access guidance; date and link sources.

## Steps
1. Refresh the technical brief: final name/publisher, current candidate, local Node stdio + file IPC + OS scripting, project/file read/write/delete capabilities, eval/read-only controls, user permissions, temporary mailbox handling, preview/tool-result data reaching the agent host, supported tested scope, and current limitations. Remove the old provisional-name/version wording.
2. Identify a real official contact/channel. The documentation referring to an OpenAI partner/contact does not establish that Joe has one. Record how to reach the correct review team; do not invent an address or promise an exception.
3. Prepare an exact inquiry with the brief and bounded demo. Ask: supported local package route; reviewer hardware/setup; consent/approval/security expectations; supported client surfaces; private-file handling; format and required evidence; whether a hosted companion is mandatory.
4. Present the concrete recipient/channel and message for explicit outreach authorization unless already authorized. After authorization send through the approved channel, record sent date/reference and actual response.
5. Classify the answer: supported local path with requirements; a hosted design required; or unavailable/unresolved. Record missing answers and a follow-up action. If no supported local path is available, document that result and leave directory submission gated.

## Acceptance
- Current brief and evidence links are reviewable.
- An authoritative response establishes a usable route OR explicitly establishes no current local route; unresolved silence is not eligibility or Done.
- If a hosted bridge is required, stop for a product architecture decision; do not implement it under this ticket.
- No directory availability claim; no dependency added to the Codex release track.

## Handoff
AFT-35 consumes the confirmed requirements. If an explicit no-route result closes this investigation, keep its downstream directory tickets gated/deferred; a Done investigation does not authorize them.

### AFT-31 — Complete publication source, asset and license review

Completion prerequisites: None; see ticket start gate/external inputs.

## Result
Produce a specific, reviewable publication source snapshot and a closed ownership/notices/security checklist. This supplies the source/content approval prerequisite for public infrastructure.

## Read first
release/submission/public-repo-audit.md; release/submission/licensing-inventory.md; release/submission/security-route.md; release/build-public-source-snapshot.py; release/audit-public-tree.py; license.md; plugin/license.md; plugin/PROVENANCE.md; plugin/THIRD-PARTY-NOTICES.txt; plugin/library/source-map.json; existing public-source-redaction reports.

## Steps
1. Inventory the actual files proposed for public source, installable payload, docs, fixtures and demo assets. Record owner/provenance/license per class, including generated ARC 01 input and screenshots/clips. Do not assume a free launch grants redistribution.
2. Preserve upstream MIT runtime and bundled dependency notices. Reconcile the final bundled dependency graph/notices; map Joe's additions and custom terms without restricting upstream rights. Verify installation, private modification, commercial output and editable handoff match D-008.
3. Run python3 release/audit-public-tree.py --strict and build the review-only source snapshot. Inspect source/logs/JSON/media manually for secrets, project content, usernames/paths and third-party/private materials; pattern-scan success is only one check.
4. Inspect Git history separately. Existing history has prior path disclosures. Prepare a reviewed fresh-import publication snapshot/history plan without deleting or rewriting the development checkout. Record exact file hashes and excluded raw evidence.
5. List specific unresolved legal questions and the responsible reviewer. Escalate real ownership/custom-license ambiguity to Joe/counsel; do not add an undefined 'legal signoff' gate or claim OpenAI mandates an attorney opinion.
6. Write a pass/fail disposition for each finding and attach the exact snapshot hash for human review.

## Acceptance
Every included material has a documented disposition; no unresolved credential/private-content/ownership blocker; notices and D-008 agree; the proposed publication bytes/history are identified and reviewable. Human review is recorded with scope and reviewer. Publication is a separate action in AFT-32. Any source/content changes after this review require a diff review before publication.

### AFT-32 — Publish reviewed repository and support pages after authorization

Completion prerequisites: AFT-31, AFT-20.

## Result
Create the reviewed public distribution infrastructure under joebenscoter86 with working product/install, support, privacy and terms destinations. This is infrastructure publication, not plugin launch or OpenAI approval.

## Read first
release/website/destination-plan.md and all four page drafts; release/submission/git-marketplace-route.md; release/submission/security-route.md; .agents/plugins/marketplace.json; outputs of AFT-31 and AFT-20.

## Steps
1. Confirm account ownership, repository availability and exact contents/history to publish. Use the reviewed fresh-import snapshot plan; preserve the canonical development checkout and its history.
2. Prepare an action sheet: destination/visibility, source snapshot SHA-256, pages/media, license/notices, marketplace catalog and exposure, GitHub Issues ownership, security/privacy incident intake, retention procedure and rollback/removal options. Explicitly disclose that making the repo public makes its plugin source/catalog downloadable even before an announced stable release.
3. Obtain Joe's explicit authorization for these exact public actions. Approval of ticket updates alone is insufficient. Do not ask before the action sheet is concrete.
4. After authorization publish the reviewed repository/docs/pages only. No domain purchase, account purchase, unreviewed history push, OpenAI message or submission.
5. Enable/test the chosen private security/privacy report path (GitHub private vulnerability reporting if available); confirm notification ownership without posting a fake public sensitive report. Set a documented report-retention/deletion procedure; avoid unsupported response-time promises.
6. Verify all HTTPS URLs logged out/as a public visitor; verify Issues intake and marketplace resolution. Put only verified actual URLs into manifest/page metadata. This may change package bytes: rebuild/version/hash and notify AFT-18/AFT-23 of affected retests.

## Acceptance
Public URLs resolve to reviewed content; publisher/support control is evidenced; notices and private incident route are present/tested; actual public commit/catalog are recorded; no stable-release or directory claim. If a private route is unavailable, resolve an alternative with Joe before calling support ready.

## Handoff
AFT-34 tests the real public source; AFT-22 finalizes links/claims; AFT-24 later publishes the reviewed stable release. Do not wait for AFT-23 to publish infrastructure: that would create a live-link dependency cycle.

### AFT-33 — Verify update, uninstall and rollback preserve user work

Completion prerequisites: AFT-6, AFT-21.

## Result
A repeatable lifecycle test and user guide prove how to update, remove and restore the plugin while retaining AEPs/exports and unrelated host configuration.

## Read first
plugin/docs/local-install.md; plugin/docs/connection-recovery.md; plugin/scripts/start.mjs; existing install/update reports; current codex plugin --help and relevant subcommand help. Use actual supported host behavior, not guessed cache-edit commands.

## Steps
1. Choose a test-owned account/marketplace and keep original host config/cache inventory. Never remove Joe's active installation or unrelated plugins to manufacture clean state.
2. Identify two real versioned packages: known-good prior candidate and proposed candidate, with payload hashes. Do not relabel identical bytes as an update test.
3. Install the prior package, create/save a small owned AEP and export, and hash user artifacts/config.
4. Follow documented upgrade/refresh to the new package. In a fresh task confirm manifest/installed hashes and callable skills/tools; perform bounded read/create/revise/render checks. Expose stale caches if found instead of silently editing them.
5. Remove only the owned plugin/marketplace using supported commands/UI. Verify user AEP/export bytes, unrelated plugins and MCP settings survive; tools are absent in a new task as expected.
6. Restore the known-good package with a supported pin/restore path, reload in a fresh task, reopen the owned AEP and verify tool operation. If the host lacks rollback, document and test a concrete recovery route rather than promising one.
7. Add concise user instructions for update, removal, rollback, retained files and required app/task restart. Re-run affected package checks if docs or runtime change.

## Acceptance
All three lifecycle journeys are actually exercised with before/after version/hash/config/user-file evidence. User work remains intact; stale-cache behavior and recovery are explicit. Prefer the separate test Mac when available; owned development-Mac rehearsal is valid bounded lifecycle evidence and must be labeled. No separate-machine installation claim unless AFT-18 passes.

### AFT-34 — Rehearse installation from the actual public Git marketplace

Completion prerequisites: AFT-32, AFT-18.

## Result
Verify the actual public repo/catalog installation journey before approving a stable Codex release. A local ZIP/kit or existing cache does not prove the public channel.

## Read first
release/submission/git-marketplace-route.md; plugin/docs/local-install.md; quality/fixtures/clean-machine-runbook.md; AFT-18 and AFT-32 reports. Inspect actual CLI help/UI before retaining draft commands.

## Steps
1. Use the eligible separate Mac/account from AFT-18 with no preconfigured After Effects Studio marketplace/cache for this public-source run. Do not erase unrelated installs; use a clean account or alternate eligible environment and record it.
2. Record the actual public repo URL, commit/ref and catalog plus expected package payload hashes. Read the published guide as a public visitor.
3. Follow the supported user-facing marketplace add/install flow from public Git. Record exact commands/UI, output, network/auth prompts, installed location/version/hashes, time and every assist. No git clone, npm install/build or private developer configuration.
4. In a fresh task verify the installed plugin's own skills/tools; inspect a blank/owned AE project, create the small runbook scene, preview, revise, save/export, reopen and inspect full movie/decode.
5. Confirm trust text explains publisher, local executable, Node/AE prerequisites, Automation/scripting permissions, real download source and how to remove it. Do not advise email attachment/security-filter bypasses.
6. If a source pin is used, publish/test the exact supported pin instructions. After fixes record changed bytes and rerun affected steps.

## Acceptance
Actual public-source install works on an eligible separate Mac, payload matches the candidate/ref, first-use outputs pass, and guide/support links work publicly. This can share one documented session with AFT-18 if it independently satisfies both specifications. It proves the channel, not directory approval or novice usability. AFT-25 still verifies the final stable artifact after release.

### AFT-35 — Prepare the route-specific OpenAI directory candidate and reviewer cases

Completion prerequisites: AFT-30, AFT-23.

## Result
Prepare a directory submission package only after OpenAI confirms a usable local-controller route and the Codex candidate passes its release gate. Git launch does not depend on this ticket.

## Read first
AFT-30 response and technical brief; AFT-23 report; release/listing-draft.md; release/submission/reviewer-walkthrough.md; current official OpenAI packaging/guidelines/submission/error references.

## Start gate
A Done route investigation is insufficient if its result is 'no supported local route'. Require documented eligible route, supported host/reviewer setup and required security/consent controls. If a hosted bridge is demanded, stop for an explicit architecture decision/new scoped build; never strip MCP and submit skills-only while claiming working AE control.

## Steps
1. Make a route-specific compliance checklist: package structure/manifest, local execution, permissions, tool annotations/policy enforcement, file handling, skills, assets, URLs, reviewer setup and allowed hosts. Separate confirmed local requirements from standard remote-MCP requirements.
2. Check OpenAI organization/project ownership, Apps Management Write access and JB Technology LLC business verification. Joe performs identity/security steps; do not store verification documents or credentials in the repo.
3. Finalize listing name/short description/category/icons and authentic supported images/clips under current portal constraints. Current shortDescription is too long for the documented final directory limit; recheck and fix the actual field. No first/only, universal compatibility, real ARC 01 commercial product or cloud AE claims.
4. Convert the walkthrough into reproducible reviewer cases: prompt, prerequisites/sample data, expected tools, observable result and safe fallback. Reuse accepted evidence. Standard initial MCP review calls for exactly five positive and three negative cases, accessible demo recording and release notes; apply confirmed route requirements and document differences.
5. Record a reviewer-accessible walkthrough showing install/setup, editability, meaningful revision, rendering and safe failures. Use rights-cleared sample projects and accurate candidate version. Keep any reviewer credentials in the portal's secure fields, not ZIP/source.
6. Validate/rebuild the route-specific ZIP, hashes, resources, notices, skills and URLs. Review the change list from AFT-23; security/architecture or runtime changes trigger affected revalidation and a fresh release gate rather than inheriting earlier approval.

## Acceptance
Eligible route, verified identity/access, tested reviewer cases, accessible media, validated exact package and a concrete upload/submit action sheet. Any requirement still unknown remains open. No upload, outreach or submission occurs here. Hand off to AFT-36 for explicit action authorization.

### AFT-36 — Submit, track review and publish the approved OpenAI listing

Completion prerequisites: AFT-35.

## Result
Execute the confirmed OpenAI directory workflow with submission, review outcome and publication recorded separately. This ticket never blocks AFT-24/AFT-25 Codex launch.

## Steps
1. Verify AFT-35 acceptance and the exact current route, candidate version/hash, organization/project, verified publisher, reviewer access and real URLs. Prepare the specific upload/submission action and policy attestations for Joe; obtain explicit submission authorization.
2. Follow the current portal/product-specific instructions. Include the local MCP via the confirmed route; do not assume ordinary remote HTTPS setup applies. If ordinary remote submission is specifically required and separately built/approved, complete domain/auth/tool scans and reviewer setup against that implementation.
3. Upload the exact approved ZIP, retain draft/plugin IDs and portal validation/skill/security findings, fix required issues, and rerun affected tests before reupload. Do not silently attest unsupported statements.
4. Submit the selected draft for review; record submitted status/date/reference. Monitor when requested/working this ticket and handle feedback; no recurring monitor is implied. A pending review is not accepted or published. Do not create duplicate active reviews.
5. If rejected, record reason, linked fixes and resubmission evidence; seek decisions for scope/architecture/policy questions. Keep credentials and sample data available for reviews.
6. On approval, record the approved exact version. Obtain any outstanding explicit publication authorization, then publish that approved version. Do not equate submission authorization with automatic publication.
7. Install from the actual directory on the advertised supported local surface and verify its own skills/controller, first scene/revision/export and support links. Record the listing URL/IDs/hash mapping and open linked defects.

## Acceptance
Actual directory approval AND actual authorized publication AND post-publication installation evidence; unresolved review or unavailable local route keeps the ticket open/deferred. If Joe decides to abandon this route, mark Canceled with that decision, never Done. No directory marketing claims until publication is verified.


## Existing completed work

AFT-1–AFT-8, AFT-10–AFT-17, AFT-19, AFT-21 and AFT-26–AFT-29 retain scoped completion and original evidence. Follow-up notes in Linear point to the successor tickets. Their completion is not a public launch or directory approval. Recreate accepted creative work only when a specific affected behavior or new requirement warrants it.

## Deferred scope

Windows/additional hosts, billing, paid tiers, a custom domain, a speculative hosted AE/device bridge, additional showcase films and mandatory recruitment of an outside technical tester are excluded from the v1 critical path. Optional creator usability observation can improve onboarding separately. Real safety or eligibility defects discovered during execution still need linked issues and disposition.


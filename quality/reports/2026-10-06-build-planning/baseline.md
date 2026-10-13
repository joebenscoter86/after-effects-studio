# Build planning baseline

Date: 2026-10-06 (America/Los_Angeles). Scope: repository routing, planning documents, current prerequisite discovery and offline packaged startup. No native AE connection or mutation performed.

## Source and inspected evidence

- Source HEAD at inspection: e8b58fd, the initial workspace scaffold/import. Planning changes are an uncommitted documentation delta against that source.
- Plugin version: 0.1.0+codex.20261007025134. Underlying runtime package version: 0.3.1.
- Inspected AGENTS.md, all four workspace contexts, product brief/decisions/roadmap, architecture, package README, release criteria/plan, package audit and historical verification summary.
- Four approved workspaces and their contexts exist; no folder reorganization is needed. No remote Git repository is configured. Existing internal package layout and notices are preserved.

## Current checks

| Check | Observed result | Limit |
|---|---|---|
| `node plugin/scripts/doctor.mjs` | Exit 0; Node v25.9.0, darwin, bundle/library, AE 2026 path and ffmpeg/ffprobe found | File/prerequisite discovery does not prove Automation permission or native functionality |
| `node plugin/tests/smoke.mjs --output quality/reports/local-smoke` | Exit 0; MCP handshake/discovery, all 19 hashed resources, craft routing, traversal rejection and policy-filtered catalog pass | Offline only; raw output in ignored local-smoke/smoke-report.json |
| Linear team and matching-project reads | Both returned UNAUTHORIZED and requested reauthentication | No team/project/issue discovery or writes succeeded |
| Planning consistency | Ten changed/new documents checked for local Markdown links and whitespace; four context files present; nine requirements, 25 unique tickets, six milestones and acyclic valid dependencies; acceptance/evidence fields on every ticket | Checks validate the plan's internal structure, not implemented behavior |
| `git diff --check` | Pass | Tracked documentation delta; new documents also checked separately for whitespace |

Snapshot SHA-256 values for the tested package components (not a release-archive hash):

- plugin/.codex-plugin/plugin.json: `f4ff9d94ad5fc239bab495d75ce6422c816a7ad05d05a1cda3044a72ec7e1d9f`
- plugin/runtime/dist/index.js: `085227474cd32e10eb6a446be4438e459730539efc1706f0f1ce8511450f4efb`
- plugin/library/manifest.json: `4539d495fd7a96825ff09cfe79112d248f42cbccb15090504435ee4520787b77`

## Gaps that remain open

Historical verification reports 387 offline tests with four platform skips and native sampled-frame checks on macOS/AE 26.5. Those suites/native checks were not rerun for this documentation task. They do not establish clean-machine installation, full movie delivery, standalone editable AEP delivery, comprehensive preservation/recovery or three accepted finished examples.

The imported package audit reports eight unresolved release-preparation checks. Its listing rules need current verification for the chosen route; its monetization dependency is superseded by D-003 (free launch, monetization deferred), while original-material licensing remains unresolved. The historical audit is preserved unchanged.

Public distribution route, release platform matrix, second-machine access, license choice and publisher/support ownership remain open. The planning backlog tracks these separately from implementable local work. Linear publication waits for reconnection and team selection.

## Planning deliverables

PRD requirements R-01–R-09 map to 25 tickets in six stages. Each ticket defines outcome, dependencies, acceptance and evidence. Product decisions remain in product/decisions.md. The root/product routes point to the execution documents; no new product decision, release claim or public action is implied by writing the plan.

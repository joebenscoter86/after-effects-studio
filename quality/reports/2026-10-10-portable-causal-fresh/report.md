# AFT-17 fresh causal study — stopped at preflight

Run date: 2026-10-10, America/Los_Angeles. This independent fresh Codex chat read the installed package guidance but did not create the causal fixture. The current type-study project became dirty during the installed version inspection, and a single undo did not restore the clean flag. The user's explicit clean/saved-project condition remains unsatisfied. No causal render, revision, playback, reopen or export validation is claimed.

## Scope and environment

- Scenarios Q-07/Q-05/Q-06; AFT-17 / R-05, R-06. Input: quality/fixtures/2026-10-10-portable-causal-brief.md and the preparation report.
- Fresh chat: `01a1294a-28a6-72f3-bb2c-9b72d3c15b1e`. The chat received the prepared task and project routing/context, including high-level memory. A lightweight memory registry search returned no relevant causal-study entry; no historical motion recipe was used.
- This is a fresh agent session with task-specific context, not a blind test or a separate-machine test. Prior AFT-15 scripts, AEPs, renders/contact sheets and personal Content assets were not opened or used as examples. The pre-existing type AEP was inspected only for preservation.
- Installed candidate: `0.1.0+codex.20261009184954`; cache `<local-home>/.codex/plugins/cache/personal/after-effects-studio/0.1.0+codex.20261009184954/`.
- Candidate ZIP SHA-256: `ce507e03a6b288111849a65f7c9612efa9c85a640c2c176a2e5485d41038b6e3`. All 54 archived payload files matched the installed cache by SHA-256 in this run; see package-verification.json.
- Repository HEAD: `e8b58fd58955866a1da7f31d11c9407947a5fc57`, with extensive pre-existing staged/unstaged/untracked development work left untouched.
- Host: macOS 26.6.2 / 25G83; AE 26.5x89, build 89, en_US, push transport. Shell Node v25.9.0; MCP process Node executable was not independently measured. The app bundle found at /Applications/ChatGPT.app reports 26.928.40906 / 12694; a separate /Applications/Codex.app was absent.
- Parent delegated exclusive AE control and stated it would not operate AE during this run. No second controller was intentionally used.

## Packaged discovery

Read through installed `mcp__after_effects_studio__ae_library`: motion-language, production-workflow, brief-template, construction, quality, failure-atlas and scripting. Exact returned text is retained in library-read-log.json. These reads informed brief.md: stable gauge identity, progressive construction, registered signal contact, static camera, dense boundary review and separate acceptance claims. No motion implementation was copied from another fixture.

Skills read: installed motion-studio/SKILL.md and repository plugin/skills/ae-control/SKILL.md plus plugin/skills/motion-review/SKILL.md. AE Control directs the version/context preflight; Motion Review directs quality/failure-atlas reads. The repository AGENTS.md, roadmap, quality context, release criteria, scenario matrix, report template and B-17 acceptance were also read. The candidate smoke report was consulted only for package identification after the preservation issue appeared.

## Native action log and preservation

1. `ae_context` returned `<local-home>/after-effects-studio/quality/renders/2026-10-10-portable-type-native/margin-03-v2.aep`, dirty=false, 16 bpc, three items, no active comp or selected layers. Items: folder 25 Solids, footage 26 AFT17_TYPE_ground, comp 13 AFT17_TYPE_MARGIN03_v1_20261010. This matched the expressly owned type study in the task.
2. Offline library/catalog reads followed. No creation, save, switch or render was requested.
3. `ae_version_info` returned the same file and three-item count, but dirty=true. Subsequent `ae_context` confirmed dirty=true with the same item IDs/names.
4. Inspection of the installed runtime/dist/index.js at lines 45333–45336 found the version tool's saveFrameToPng capability probe creates a `__probe__` comp and immediately removes it. The tool is declared an inspection/read operation. This provides a concrete explanation for the dirty-state change. The session cannot certify every in-memory property against the initial state because the initial snapshot contained project/item summaries only.
5. One dedicated `ae_do` operation `project.undo` with count=1 attempted to reverse the owned probe. It returned undone=1, but dirty=true persisted. No further undo was attempted, to avoid crossing into prior project history. Final context still shows the same three items, path, no active comp/selection and dirty=true.
6. Native operations stopped. No project.new/open/save/clear, causal build, or render occurred. An explicit user decision was requested to reopen the unchanged saved type AEP before continuing. No answer is assumed.

The saved type AEP was not overwritten. Its SHA-256 is `452d887af5cd125e09f60eef766b476eb11aae07693d39b8ffa2488d21666f1d`, 289504 bytes. This run does not claim perfect in-memory preservation or a clean undo stack: version inspection had an unexpected write side effect and the undo did not establish a clean state. See preflight-evidence.json for initial/final context and undo readback.

## Checks and bounded result

| Dimension | Result | Evidence / limits |
|---|---|---|
| Installed payload identity | Pass | 54/54 cached files match candidate archive |
| Fresh-session packaged discovery | Pass, bounded | Seven exact library reads; fresh task with prepared context |
| Preservation preflight | Failed clean-state gate | Version probe dirtied owned saved project; one undo did not clear flag |
| Causal runtime/native structure | Unperformed | No causal comp created |
| Dense visual inspection / corrections | Unperformed | No frames rendered |
| Full movie playback | Unperformed | No movie produced |
| Nine-frame coordinated revision | Unperformed | Timing design only in brief.md |
| Editable AEP reopen | Unperformed | No causal AEP produced |
| Movie metadata/full decode/hashes | Unperformed | No causal export produced |
| Joe's creative acceptance | Pending | No causal result supplied for approval |

This exposes a runtime inspection/preservation defect, not a demonstrated motion-guidance gap. The installed candidate and source code were not changed during this run. AFT-17 remains In Progress; fresh-session causal execution, independently fresh type evidence, broader comparison and upstream dependencies remain open. Nothing was published or submitted.

## Subsequent resolution

The parent task later verified the saved type AEP's unchanged SHA-256 and three owned items, reopened that same saved file without writing the probe-induced dirty state, and created a new empty project. A separate fresh task then completed the [native causal study](../2026-10-10-portable-causal-native/report.md). This interrupted preflight remains a failed inspection-preservation check and is not retroactively counted as a causal run. The source-level correction and remaining native recheck are in the [version-inspection report](../2026-10-10-version-inspection-preservation/report.md).

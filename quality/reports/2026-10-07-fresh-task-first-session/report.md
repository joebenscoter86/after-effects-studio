# AFT-7 fresh-task first-session check — 2026-10-07

Publication copy: one developer home path was redacted on 2026-10-09; [the redaction manifest](../2026-10-09-public-source-redaction/manifest.json) identifies the original and public file hashes. All other recorded results are unchanged.

Result: blocked at plugin MCP attachment. This newly created Codex chat exposes the installed After Effects Studio skills, but its callable tools contain no After Effects Studio MCP namespace. The only AE controller exposed is `mcp__higgsfield_use_after_effects`, which was not used. AFT-7 remains In Progress; the guided native journey did not begin.

## Scenario and candidate

- Scenario Q-01; AFT-7 / B-07; requirements R-01 and R-02.
- Operator: fresh Codex chat created from source chat `01a11456-883b-7401-9bbb-358bb168224c`. This is developer-machine testing, not novice-user or separate-machine acceptance.
- Date: 2026-10-07, America/Los_Angeles. Package fingerprint captured at 12:36:09 PDT.
- Host: macOS 26.6.2, build 25G83, arm64; Node 25.9.0.
- Desktop host observed under `/Applications/ChatGPT.app`: bundle version 26.928.40906 (12694), with Codex framework 154.0.8037.57 in running process paths. The bundled CodexCLI plist reports build 1 with no short version; no standalone Codex application build was established.
- Installed AE bundle: 26.5.0 / 26.5.0.89. This is filesystem metadata, not a live `ae_version_info` result.
- Source revision: `e8b58fd58955866a1da7f31d11c9407947a5fc57`, with substantial pre-existing modified and untracked files. This run changes only its report and raw evidence; no source implementation or installation changes.
- Installed candidate: `0.1.0+codex.20261007055008`, verified in `<developer-home>/.codex/plugins/cache/personal/after-effects-studio/0.1.0+codex.20261007055008/.codex-plugin/plugin.json`. This development Mac already has the personal marketplace/cache; no clean installation was attempted.
- Installed tree fingerprint (450 files): SHA-256 `a42b0d9e8328e9878d52a3bd22b2760623ceb6e9bcc6699f99f808be7f1d1483`. Method: SHA-256 over UTF-8 lines containing each file's SHA-256, two spaces, relative POSIX path, and newline, in Python sorted Path order. This identifies installed contents; it is not a distributable archive hash. Per-file values are in the raw evidence.
- Manifest SHA-256: `77ff99e6e3ec2aacb7e9a0ba646a8b578a98121038c535269f7f31cce6221f04`.
- `.mcp.json` SHA-256: `bcbcc3185676a9c26cd81acd5d6780c2139fc865b9d4d347e471f48a2ce8b126`.
- Runtime bundle SHA-256: `3190af5545cf261a0488cfb7209bf906e66f0fe7d81822fff385f3dac745b757`.

## Inputs and preflight boundary

The requested journey was connection, brief, one editable native scene, sampled preview, meaningful revision and readback, using this exact installed plugin. The explicit stop condition was missing plugin tools or an unrelated/dirty AE project. The request specifically prohibited substituting Higgsfield or a manually launched source MCP client for the attachment check.

Read AGENTS.md, product/roadmap.md, plugin/docs/first-session.md, quality/fixtures/scenarios.md, quality/context.md, quality/release-criteria.md, the report template, and the local ae-control and motion-review skills. AFT-7's current specification/status was read from Linear. Historical app-reopen evidence was read as context, not treated as a current project snapshot.

Joe's statement that AE now has a fresh project could not be verified: this chat cannot call the required plugin's `ae_version_info` or `ae_context`. Exact project path, dirty state, active comp, item/layer IDs and ownership remain unknown. No native controller was invoked. No project save, switch, close, write, render or cleanup was attempted. No scene or media inputs were created. Concurrent controller activity was not independently established, and no claim of exclusive native access is made.

## Action log and evidence

| Sequence | Action | Result |
|---|---|---|
| 1 | Inspect complete callable tool metadata for AE/plugin operations | Only the separate Higgsfield AE namespace is present; no After Effects Studio tools. Raw names and relevant descriptions retained. |
| 2 | Read exact installed manifest and MCP configuration | Candidate version matches. `.mcp.json` declares server `after-effects-studio` with `node ${PLUGIN_ROOT}/scripts/start.mjs`; declaration alone does not prove attachment. |
| 3 | Run `node scripts/doctor.mjs` with cwd set to the installed candidate | Exit 0; Node, OS, bundled runtime/library, AE path and optional ffmpeg/ffprobe found. Doctor explicitly reports live connection and permissions untested. |
| 4 | Inspect host metadata, hash installed files, record source revision/status | Captured candidate/host provenance without invoking AE or starting an MCP client. |
| 5 | Search plugin directory for `after-effects-studio` | No matching result returned (only unrelated Descript). This directory result does not disprove the local cached installation. |
| 6 | Record blocked first-session result and update AFT-7 | Keep In Progress. Native connection and all downstream acceptance checks remain open. |

Raw evidence is local and Git-ignored under `quality/reports/raw/2026-10-07-fresh-task-first-session/`:

- `preflight.json`: callable tool inventory, AE-related tool provenance, initial Linear record, manifest/host/source command output, installed doctor result and directory search result.
- `package-fingerprints.json`: every installed file's relative path, size and SHA-256, plus aggregate fingerprint.
- `host-apps.json`: desktop/CLI/AE bundle metadata.
- `working-tree-status.txt`: working-tree status captured after adding this report; all other listed changes predate this run.
- `linear-update.json`: response to the AFT-7 evidence update.

No render directory was created because no native work occurred.

## Checks and observations

| Dimension | Result | Evidence / limits |
|---|---|---|
| Exact installed candidate present | Pass | Manifest and installed-file hashes. |
| Local prerequisites | Pass | Installed doctor exit 0. |
| Plugin MCP attached to fresh chat | Fail | Required namespace absent from callable inventory; skills alone are available. |
| Live AE version/context and permissions | Unverified | Required tools unavailable; no substitute used. |
| Brief, editable scene, revision and stable-ID readback | Unverified | Stopped before native journey. |
| Existing/unsaved project preservation | Unverified as an acceptance test | This run made zero native calls; actual project state was not read back. |
| Rendered preview, full-size text/edge review | Unverified | No frames generated or inspected. No visual quality conclusion. |
| Full-speed playback/pacing/audio | Unverified | No movie or playback. |
| Editable AEP reopen, linked assets and movie delivery | Unverified | No delivery requested or produced in this blocked run. |
| Joe's creative acceptance | Unverified | No creative result presented or accepted. |

## Failure and next step

The fresh-chat experiment reproduces missing tool exposure; it is no longer explained solely by reuse of the older chat. The reason for attachment failure remains undiagnosed. A passing filesystem doctor does not establish MCP startup, tool registration or native permissions. No native error code or paired successful connection exists in this run.

Resolve the installed plugin's MCP attachment in Codex, then repeat Q-01 with its own callable tools. Start with `ae_version_info` and `ae_context` against the exact current project before any write. Do not substitute prior direct-client or Higgsfield success for this gate. No second-machine acceptance, public install, release readiness or creative acceptance is claimed. No cleanup was needed because this run created no native items.

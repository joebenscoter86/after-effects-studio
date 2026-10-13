# After Effects Studio — second-Mac acceptance runbook

This is the AFT-18 test procedure, not a passing result. Joe's company-managed Mac is excluded by D-011; do not transfer or run the kit there. Use a personally owned or expressly authorized Mac other than the development Mac. Joe may run it; record that as a Joe-operated portability check, not an ordinary creator usability study. Do not use a machine with an existing After Effects Studio plugin cache, a configured test marketplace, or the original Content repository. Do not erase an existing installation or unrelated AE project to manufacture a clean state; choose another machine or account instead.

## Before installation

Record the operator's name and prior Codex/AE experience; macOS build and chip; Codex app/CLI version; AE version and license state; Node version or absence; and whether any After Effects Studio marketplace/cache/plugin is present. Keep the exact kit ZIP and expected SHA-256 from the accompanying handoff report. Compare the received ZIP hash before extracting it. Use an empty test folder for the kit, not the plugin source checkout.

The kit contains `.agents/plugins/marketplace.json` and `plugins/after-effects-studio/`. The marketplace entry is named `aft-clean-test` and points at this contained plugin. It is a local testing source; it does not claim a public distribution URL.

## Install and connect

1. Extract the verified kit ZIP to a new folder. In Terminal run `codex plugin marketplace add /absolute/path/to/extracted-kit`, then `codex plugin add after-effects-studio@aft-clean-test`. Capture the literal command output and installed cache path. If the command or UI differs on this host, record the difference instead of silently improvising. Current marketplace syntax is documented at https://developers.openai.com/plugins/build/plugins .
2. Confirm the installed manifest version and hash the installed package files against the kit payload. Record any files the host adds to its cache separately; do not compare an aggregate cache hash if it includes generated host files.
3. Run `node scripts/doctor.mjs` from the installed plugin folder. Record every prerequisite, warning and permission prompt. Node 24+, licensed local AE and macOS Automation/AE scripting-file-access permissions are expected. Doctor is read-only and does not itself prove AE permission.
4. Start a **new** Codex task and check that the installed After Effects Studio skills and `ae_context`, `ae_catalog`, `ae_do` and `ae_render_frame` tools are actually callable. Use the plugin's own namespace, not a different AE controller or a source-tree MCP client.
5. With AE open to a blank or expressly test-owned project, read `ae_version_info` and `ae_context` before any write. If the current project contains unrelated work, stop native steps and preserve it; do not clear or replace it for this test.

## Owned creation, revision and delivery

Use a fresh task prompt that asks for a silent 6–8 second geometric cause-and-effect scene with no supplied media or private assets: three teal dots approach a closed amber gate; the gate opens and the same three dots settle in a destination ring. Ask the agent to use the packaged motion guidance, build editable native AE shapes/text, render start/contact/transition/hold frames, then change the gate color to blue and move the opening 0.25 seconds later without duplicating dots or disturbing the prior layout. Save the AEP and a complete review movie in a dated test-owned folder.

Record the library document IDs actually read, comp and layer IDs before/after revision, native commands, warnings, manual interventions, failures and elapsed time. Inspect dense rendered frames around gate contact/opening, one full-resolution type/edge frame, and the movie at full speed. Reopen the delivered AEP and confirm the same linked/native structure and no missing fonts/media. Check movie resolution, frame rate, duration, complete decode and SHA-256. If no H.264 template is available, use an actually installed playable output option and record it. Runtime success, visual quality and operator approval are separate results.

Do not force a hang or modal dialog during this installation journey. Under D-013, AFT-9 separately exercises controlled test-only response failure after a harmless owned write and inspects actual native state; this is not an installation prerequisite. If uncertainty occurs here, inspect AE state before retrying and retain supplementary recovery evidence. Leave unrelated project content and application settings intact. AFT-34 may share this session when the actual public Git source is available; satisfy both specifications and record which installation route was tested.

## Record and return

Create `quality/reports/YYYY-MM-DD-clean-install/` using the [report template](../reports/report-template.md) and keep AEP/media/render files in matching ignored `quality/renders/`. Record the exact kit SHA-256, installed plugin version/files, source revision and host versions, each step's result, output paths and hashes, every assist and the final acceptance boundary. A clean second-Mac pass can satisfy package portability; it does not by itself prove a public Git-backed install or nontechnical-user ease of use. If any prerequisite or installation step fails, preserve the evidence and report the failure rather than calling the journey passed.

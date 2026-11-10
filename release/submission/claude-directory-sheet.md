# Comp Room — Anthropic directory submission sheet (CL-8)

Drafted 2026-11-09 from the live [submit page](https://claude.com/docs/plugins/submit) and [pre-submission checklist](https://claude.com/docs/plugins/pre-submission-checklist). Nothing here has been submitted. Submitting needs Joe's go-ahead and his acceptance of the [directory terms](https://support.claude.com/en/articles/13145338-anthropic-software-directory-terms), including the indemnity and removal clauses (CL-8 checkpoint).

## Before starting: Joe's decisions

1. **Which Claude account submits.** It needs a paid plan (Pro, Max, Ultra, Team or Enterprise; Team and Enterprise need an Owner). The first organization to submit a repository folder holds that listing, so submit from the account that should own Comp Room for JB Technology LLC.
2. **The contact email** Anthropic uses about the submission. It must be monitored.
3. **Accepting the terms** and the four compliance acknowledgements in the portal.
4. **Tracked tag or branch.** Recommended: a tag per release, starting with `comp-room-v0.2.1` (see "Source" below).

## Source step

| Field | Value |
|---|---|
| What would you like to submit? | **Plugin bundle** |
| Repository | `joebenscoter86/after-effects-studio` |
| Plugin path | `claude/comp-room` |
| Branch or tag | `comp-room-v0.2.1` (a tag on the `main` commit that carries 0.2.1) |

Why a tag: a tracked branch makes every merge to `main` a new candidate version, including merges that only touch the Codex package. A tag stays on its commit until it is changed in Settings → Tracked branch or tag, so each Comp Room release is deliberate: raise `version`, merge, tag, update the tracked tag.

**Validate.** Expected result: no blocking findings. Local checks on 2026-11-09: `claude plugin validate --strict` passes; 501 files (limit 512); largest non-image file 131 KB (limit 256 KiB); the only image is the SVG icon, which the manifest uses; no `.DS_Store`, symlinks, submodules, LFS pointers or `.gitattributes`; repository 3.6 MiB archived, 14 MiB unpacked, 1,683 files and folders; plain `node ${CLAUDE_PLUGIN_ROOT}/start.mjs`; no launcher, lockfile install or registry config; no credentials.

**Expected reviewer hold** ("Programs the validator can't read through"): the MCP command runs `start.mjs`, a non-shell file that imports the server in `runtime/`. Note for the reviewer:

> The server is this repository's own TypeScript, transpiled file by file into readable `runtime/dist/` (source in `plugin/runtime/src/`). Its dependencies are vendored unchanged in `runtime/node_modules/` with their licenses (`THIRD-PARTY-NOTICES.txt`); nothing installs or downloads at startup. `start.mjs` checks for Node 24+ and imports the server. The server talks to Claude over stdio, opens no network port and has no telemetry. It controls the user's local Adobe After Effects through macOS scripting and temporary files in a per-user folder, as the README's "What it runs and sends" section describes.

**Possible hold on tool scope** (CL-3 review, [report](../../quality/reports/2026-11-08-claude-policy-review/report.md)): `ae_do` is one dispatcher for native operations and is marked destructive; `eval.run` (custom ExtendScript) is on by default. Note for the reviewer:

> Every tool has a title and a read-only or destructive hint. Native operations go through one `ae_do` tool marked destructive, because its effect depends on the operation; `ae_catalog` lists them. The README discloses write access and custom scripting, and how to turn them off: `AE_MCP_ENABLE_EVAL=0` removes custom scripting and `AE_MCP_READONLY=1` makes a session inspection-only. The read-only switch was checked in a Claude Code session; the scripting switch is checked by the package tests. Listed plugins that script desktop apps (Affinity, Blender) expose comparable script tools.

## Listing details step

Read from `plugin.json` and the README; there are no separate fields. Name "Comp Room", description "Editable motion for Adobe After Effects: native control, typography, paper collage, a 30-style visual style library, and a production-derived motion language.", author JB Technology LLC, icon `assets/gate-mark.svg`. To change them, edit `claude/src/`, rebuild, merge, re-tag and re-validate.

## Data handling step

| Question | Answer |
|---|---|
| Does it read or store personal data? | It reads the After Effects project the user has open: item and layer names, settings, text, local file paths and frames the user asks for. These reach Claude as tool results. It stores nothing outside the user's Mac: temporary request and response files in a per-user folder, removed after each operation. |
| Does it send data to services other than its declared connectors? | No. It opens no network port and contacts no server. Optional style scripts run ffmpeg and Blender locally on files the user names. |
| How long does it keep data? | Temporary files are removed when each operation finishes; stale ones from a crash are cleaned up after an hour, when the server next starts. Projects and exports the user saves stay where the user puts them. |
| Is it intended for people under 18? | No. |

## Compliance step

- Contact email: Joe's decision 2.
- Vulnerability reports: [GitHub private vulnerability reporting](https://github.com/joebenscoter86/after-effects-studio/security/advisories/new), enabled on the repository (checked 2026-11-09) and named on the [support](../website/support.md) and [privacy](../website/privacy.md) pages.
- The four acknowledgements: Joe's decision 3.

## Review and submit step

- How new versions reach the directory: **GitHub push webhook** (default). Setting it up needs admin rights on the repository.
- Auto-publish: leave the default, **An Anthropic reviewer publishes each version**.

## After submitting

Answer holds with the notes above. If a reviewer asks for changes, fix them in `plugin/` or `claude/src/`, rebuild, raise `version`, merge, move the tag, then **Check for new commits**. Record the result, the listed version and a clean install from the directory in a CL-8 report.

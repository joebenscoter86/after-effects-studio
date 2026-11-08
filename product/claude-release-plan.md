# Claude release plan — approved 2026-11-08

Status: approved by Joe on 2026-11-08, together with the v1 scope and three planning decisions (D-014). Evidence is in [the route research](../quality/reports/2026-11-08-claude-directory-route/research.md). CL-keys below are local planning keys; no Linear tickets exist for them yet. Approval of this plan does not authorize publishing a Claude marketplace, submitting to the directory or accepting directory terms. Each has its own checkpoint.

## Intent

Bring After Effects Studio to Claude users with the same promise as the Codex release: create and revise editable motion in local After Effects, guided by the bundled motion language. Reuse the existing skills, library and native runtime. Distribute first through a self-hosted Claude marketplace in the public repository, then through Anthropic's directory as a community plugin bundle.

## Goals

- One Claude plugin bundle that installs in Claude Code, Cowork and claude.ai from the same folder.
- AE control in Claude Code (the release gate) and, if acceptance passes, in Cowork sessions running on the user's Mac.
- The skills install on every Claude surface. Regular chat gets no AE control and no promised behavior; CL-5 records what actually loads there. No restructuring for chat in v1.
- A package that passes `claude plugin validate --strict` and the directory's blocking checks, with as few reviewer holds as practical.
- Install, first-session, recovery and removal docs written for Claude users.
- Recorded native evidence on Claude, held to the same standard as the Codex reports.

## Non-goals (v1)

- A hosted relay or remote connector. Regular Claude chat gets skills only (D-014).
- Windows, older AE versions or other hosts beyond those that pass acceptance.
- Billing. The Claude listing is free.
- New showcase films, beyond what acceptance needs.

## Anti-goals

- Forking the craft library or skills into a second maintained copy. `plugin/` stays the single source (D-005); the Claude package is generated from it.
- Breaking the Codex package or its install route, or changing a frozen Codex release candidate.
- Claiming that AE control works in regular chat, or claiming directory approval before Anthropic publishes the listing.
- Hiding anything the plugin runs, writes or sends. The directory security scan rejects undisclosed behavior.
- Using Joe's company-managed Mac (D-011).

## Constraints

- macOS with After Effects 2026, the tested Claude Code build, and a local Cowork session. Advertise only builds that pass.
- Users install Node.js 24+; the nodejs.org installer is the documented route. Plugin servers are not documented to use Claude Desktop's bundled Node, and Claude Desktop may not see a Homebrew or nvm `node`. CL-5 checks what Claude Code and Cowork actually find.
- Source base: build from the head of public `main` when work starts. This planning worktree is 7 commits behind it, and v0.2.1-rc.3 is in flight on `codex/planning-release-candidate`. Shared `plugin/` changes never land in a frozen Codex candidate.
- Directory rules from the [pre-submission checklist](https://claude.com/docs/plugins/pre-submission-checklist): `.claude-plugin/plugin.json`; README of at least 40 words; LICENSE; no `.DS_Store`, symlinks, submodules or LFS; server started as plain `node ${CLAUDE_PLUGIN_ROOT}/...`; non-image files under 256 KiB and no more than 512 files (holds); no top-level `bin/`.
- Directory policy: every tool has a `title` and `readOnlyHint` or `destructiveHint`; narrow, accurate tool descriptions; privacy section; at least three example prompts; reasonably current dependencies.
- The original-material license (D-008) permits distribution only from an authorized source. It will be revised to name the Claude sources (Joe's decision 2) before anything is published.

## Package shape

The Claude package is a generated folder with this layout:

```
after-effects-studio/
  .claude-plugin/plugin.json
  .mcp.json                 node ${CLAUDE_PLUGIN_ROOT}/start.mjs
  start.mjs                 Node 24 check, then imports the runtime (no "..")
  README.md                 Claude install, what it runs/sends, privacy, prompts
  LICENSE                   original-material terms + pointer to runtime MIT
  PROVENANCE.md, THIRD-PARTY-NOTICES.txt
  skills/  library/  assets/  docs/  examples/
  runtime/                  readable server build, LICENSE, jsx/
  scripts/                  doctor, verify-export
```

`plugin.json` carries `name`, `displayName`, `version`, `description`, `author`, `license`, `keywords`, `homepage`, `repository` and the directory fields `icon`, `documentationUrl`, `supportUrl`, `privacyPolicyUrl` and `termsOfServiceUrl`. Those URLs reuse the live pages already in the Codex manifest. The server keeps `AE_MCP_ENABLE_EVAL=1` as today, disclosed in the README.

## Work items

| Key | Outcome | Needs |
|---|---|---|
| CL-1 | Claude package builder | — |
| CL-2 | Readable runtime build within file limits | — |
| CL-3 | Tool and server-instruction policy review | — |
| CL-4 | Claude docs, README, LICENSE and skill wording | CL-1 |
| CL-5 | Local validation and dev-Mac acceptance in Claude Code and Cowork | CL-1–CL-4 |
| CL-6 | Publish the self-hosted Claude marketplace | CL-5, settled name, approved license text, Joe's authorization |
| CL-7 | Separate-Mac install and native journey from the public marketplace | CL-6 |
| CL-8 | Directory submission, review and listing verification | CL-7, Joe's authorization |

CL-2 and CL-3 change shared runtime code. Re-run the Codex runtime tests and smoke checks after them so the Codex package stays good.

### CL-1 — Claude package builder

Add a builder next to `release/build-package.py` that copies an allowlist from `plugin/` into a generated Claude folder, writes the Claude manifest, `.mcp.json` and root `start.mjs`, and adds the Claude-only README and docs from the Claude source folder outside `plugin/`. It runs the same library hash checks as the Codex build. It fails if the output contains `.DS_Store`, symlinks, a top-level `bin/`, `package.json`/lockfiles, a non-image file over 256 KiB (unless CL-2 records an accepted exception) or more than 512 files.

Done when: the builder produces the folder reproducibly, its output passes `claude plugin validate --strict`, and a check proves the generated skills and library match `plugin/` byte for byte.

### CL-2 — Readable runtime build within file limits

Replace the single 1.7 MB bundle in the Claude package with a readable build where every file is under 256 KiB, for example compiled modules for the project's own code plus separately bundled dependencies. Keep `npm` installs out of the package; nothing installs at startup.

Done when: the runtime test suite passes; the MCP smoke test passes from the generated folder; no file exceeds 256 KiB. If a dependency cannot fit, record the exception, keep the single bundle, and say so in the submission notes. That is a reviewer hold, not a rejection.

### CL-3 — Tool and server-instruction policy review

All 12 MCP tools already have a `title` and read-only/destructive hints. Native operations, including `eval.run`, project open/close/new and deletes, run through the single `ae_do` tool, which is marked destructive. Keep that design: it matches the upstream runtime and listed precedents such as Affinity's `execute_script`. Do not split operations into separate tools for v1. If a reviewer objects to the generic dispatcher, revisit then.

Review tool descriptions and server instructions against policy section 2: each describes its tool accurately and does not pressure Claude into calls the user didn't ask for. Refresh dependencies and record `npm audit`.

Done when: an automated test lists every registered tool with its title and hints; the review notes and any wording changes are recorded; runtime tests pass.

### CL-4 — Claude docs, README, LICENSE and skill wording

- **README:** 40+ words; requirements (macOS, AE 2026, Node 24 on PATH); where AE control works (Claude Code, plus local Cowork only if CL-5 passes it) and where it doesn't (regular chat); everything the plugin runs, reads, writes and sends; how to disable writes (`AE_MCP_READONLY=1`) or custom scripting (`AE_MCP_ENABLE_EVAL=0`); a privacy section; at least three example prompts.
- **Docs:** Claude versions of install, first session, connection recovery and removal: Claude Code CLI and Customize → Plugins, marketplace add and update, and uninstall.
- **Skills and library:** in canonical `plugin/`, replace the GPT model guidance in `motion-studio/SKILL.md` and `library/references/quality.md` with wording that names no specific host until there is Claude evidence. Regenerate the library manifest. This ships to Codex in its next version.
- **License:** draft the revised original-material license (decision 2) for Joe's approval. The package `LICENSE` carries the approved text and points to the runtime's MIT license and the third-party notices.

Done when: the docs match the actually tested commands, and no Codex-only command or model claim remains in the Claude package.

### CL-5 — Local validation and dev-Mac acceptance

On the development Mac, load the generated folder in Claude Code with `--plugin-dir` and through a local marketplace, then in a local Cowork session. Record the macOS Automation prompt as it appears, the missing-Node behavior, read-only context check, a create, a revision and an export. Use the existing report template. Run the canonical `plugin/evals/` prompts with `claude plugin eval` against a no-plugin baseline.

Done when: reports exist under `quality/reports/` for Claude Code and Cowork, with each check marked Pass, Fail or Unverified. Claude Code must pass; the Cowork result decides what the README claims for Cowork. Joe's creative acceptance is recorded separately from technical results.

### CL-6 — Publish the self-hosted Claude marketplace

**Checkpoint:** Joe authorizes this exact public change.

Add `.claude-plugin/marketplace.json` at the repository root pointing at the generated Claude package, beside the existing Codex catalog. Publish to the public repository.

Done when: `claude plugin marketplace add joebenscoter86/after-effects-studio` and an install succeed from a clean Claude Code config, and Customize → Plugins → Add marketplace finds the plugin.

### CL-7 — Separate-Mac acceptance

On a personally owned or explicitly authorized separate Mac (D-011), install from the public marketplace. Run the read-only check, create, revise and export in Claude Code, plus a short Cowork run.

Done when: a redacted report records exact builds and results.

### CL-8 — Directory submission

**Checkpoint:** Joe authorizes the submission and accepts the [directory terms](https://support.claude.com/en/articles/13145338-anthropic-software-directory-terms), including the indemnity and removal clauses.

In the portal, choose Plugin bundle, the repository, the package path and a tracked tag. Run Validate and answer the data-handling questions from the README. Complete compliance with a monitored contact email and a channel for vulnerability reports. Submit and track the review, answering reviewer holds with the CL-2 and CL-3 notes.

Done when: the listing is live, it installs from the directory on a clean Claude Code config and in Customize → Plugins, and a report records the exact listed version.

## Joe's decisions (2026-11-08)

1. **Shared source changes are allowed.** Changes useful to both Codex and Claude, such as rewording the GPT model guidance in `motion-studio/SKILL.md` and `library/references/quality.md` (with the library manifest regenerated), or policy-driven tool and server-instruction wording, go into canonical `plugin/`. They reach Codex users in the next Codex version after its normal tests, never in a frozen candidate. Claude-only files, such as the manifest, MCP config, README and Claude install docs, live in a Claude source folder outside `plugin/` and are built into the package.
2. **The license will name its authorized sources.** Revise the original-material license (D-008) to name the public repository and its marketplaces, the Anthropic directory, and organization admins distributing unmodified copies to their own members. The repository `license.md` and `plugin/license.md` stay one text. Joe approves the exact wording before CL-6.
3. **Claude Code is the release gate.** If AE control fails or is impractical in local Cowork, release anyway, saying Cowork gets the skills only, and revisit Cowork later.

## Still open for Joe

1. **Plugin name.** `after-effects-studio` will likely be held as a brand match for Adobe. Keep it and explain the descriptive use to the reviewer, or choose a distinct slug while keeping "After Effects Studio" as the display name (D-009). Settle it before CL-4 finalizes docs; renaming after CL-6 breaks existing installs.
2. **Marketplace publication** at CL-6.
3. **Directory submission and terms** at CL-8, plus the monitored contact email and the paid Claude account or organization that submits as JB Technology LLC.

## Calls made in planning

These are planning calls by Claude, not Joe's decisions. Check them while reading.

- Regular chat is out of scope beyond installing the skills (follows D-014).
- `ae_do` stays one destructive dispatcher; no tool split for v1.
- Node 24+ from the nodejs.org installer is the documented prerequisite.
- Work starts from the head of public `main` and never edits a frozen Codex candidate.
- The name must be settled before CL-4 docs are final.

## Calls left to the builder

- The generated folder's location: a committed folder on `main` checked for drift, or a dedicated release branch. Either works with the marketplace and portal, which take a path and branch or tag.
- The exact CL-2 technique, provided files stay readable and nothing installs at startup.
- Whether to add a `userConfig` toggle for custom scripting. Any such option needs a default, or Cowork ignores the server.

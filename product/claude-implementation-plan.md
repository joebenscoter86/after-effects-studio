# Claude package (CL-1 to CL-4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a Claude plugin bundle of After Effects Studio from canonical `plugin/` that passes `claude plugin validate --strict` and the directory's file rules, with readable runtime code and Claude-specific docs.

**Architecture:** Claude-only source files live in `claude/src/`. A Node builder (`release/build-claude-package.mjs`) copies an allowlist from `plugin/`, applies `claude/src/` files, builds a readable runtime, and writes the committed package `claude/after-effects-studio/`. The runtime is the TypeScript source transpiled file by file, plus the exact dependency files the server imports, copied unchanged into `runtime/node_modules/`. Shared, host-neutral wording changes go into `plugin/` (D-014 decision 1).

**Tech Stack:** Node 24+ ESM, esbuild (already a runtime dev dependency), `node:test`, vitest (existing runtime tests), Claude Code 2.1.302+ CLI.

**Spec:** [claude-release-plan.md](claude-release-plan.md) (approved 2026-11-08), decision D-014, evidence in [the route research](../quality/reports/2026-11-08-claude-directory-route/research.md).

## Global Constraints

- Start from the head of `public/main`. Never edit `codex/planning-release-candidate` or any frozen Codex candidate. `plugin/skills/motion-studio/SKILL.md` also changed on that branch; expect a merge conflict when it lands and keep both intents.
- `plugin/` stays the single maintained source. Never hand-edit `claude/after-effects-studio/`; it is builder output.
- Package rules (blocking or held): `.claude-plugin/plugin.json` present; README of at least 40 words; LICENSE present; no `.DS_Store`, symlinks, submodules or LFS pointers; no path outside the plugin folder; no top-level `bin/`; no lockfile anywhere and no `package.json` at the package root; every non-image, non-font file under 256 KiB (262,144 bytes); at most 512 files.
- The MCP server starts as plain `node ${CLAUDE_PLUGIN_ROOT}/start.mjs`, with no `cwd`, shell, `npm run` or launcher. Keep `AE_MCP_ENABLE_EVAL=1` in its `env`.
- `start.mjs` exits with the existing Node 24 message when `process.versions.node` major is below 24.
- The MCP server name stays `after-effects-studio`. The plugin name is read from `claude/src/plugin.json`; Joe may still rename it, so no code hard-codes it.
- The Claude marketplace name is `jb-technology`, matching the Codex catalog, so documented install commands are `claude plugin marketplace add joebenscoter86/after-effects-studio` then `claude plugin install <name>@jb-technology`.
- No `codex` or `GPT-` text (case-insensitive) in any shipped Claude file.
- Directory URLs reuse the live pages already in `plugin/.codex-plugin/plugin.json` (`websiteURL`, `supportURL`, `privacyPolicyURL`, `termsOfServiceURL`).
- No marketplace publication, push to `public`, or directory submission in this plan (CL-6 and CL-8 need Joe's separate authorization).

## Review Focus

- **Vendored dependencies dropped by `.gitignore`.** The root `.gitignore` ignores every `node_modules/`, so a Git-based install would lack `zod` and the server would crash at start. Pinned by the `git check-ignore` test in Task 2.
- **Server launched from an unrelated working directory.** Claude starts servers from the user's project folder, not the plugin root. Pinned by the Task 3 smoke run with `cwd` set to a temp directory.
- **Install path containing spaces.** Desktop app plugin paths can sit under `Application Support`. Pinned by the Task 3 smoke run from a copied package path containing a space.
- **Stale Claude package after a `plugin/` edit.** A library or skill change without a rebuild ships old content. Pinned by `--check` drift detection in Task 1 and the byte-for-byte comparison test.
- **Library hash mismatch after shared wording edits.** Editing `quality.md` without regenerating `library/manifest.json` makes `ae_library` reject the document. Pinned by Task 5's manifest regeneration and the existing library tests.

---

### Task 1: Claude package builder and package checks

**Files:**
- Create: `claude/src/plugin.json`, `claude/src/mcp.json`, `claude/src/start.mjs`
- Create: `release/claude-checks.mjs`, `release/build-claude-package.mjs`
- Create: `release/tests/claude-package.test.mjs`

**Interfaces:**
- Produces: `checkPackage(dir: string): Promise<string[]>` in `release/claude-checks.mjs`; returns human-readable violations, empty when clean.
- Produces: `buildClaudePackage({ outDir?: string, runtime?: (pluginRuntimeDir: string, outRuntimeDir: string) => Promise<unknown> }): Promise<{ outDir: string, files: string[], violations: string[] }>` in `release/build-claude-package.mjs`. Default `outDir` is `claude/<manifest name>/`. The `runtime` hook defaults to copying `plugin/runtime/dist/index.js`; Task 2 replaces the default. Until Task 6, the CLI prints violations and exits 0; Task 6 makes them fatal.
- Produces CLI: `node release/build-claude-package.mjs` (writes the package) and `node release/build-claude-package.mjs --check` (builds to a temp dir, exits 1 and lists differing paths if the committed package differs).

- [ ] **Step 1: Write the source files.**
  - `claude/src/plugin.json`:
    - `name: "after-effects-studio"`, `displayName: "After Effects Studio"`, `version: "0.2.0"`.
    - `description` copied from the Codex manifest; `author: {"name": "JB Technology LLC"}`.
    - `license: "SEE LICENSE IN LICENSE"`, or omit `license` if `--strict` rejects it, since the `LICENSE` file satisfies the checklist.
    - `homepage`, `documentationUrl` and `supportUrl`, `privacyPolicyUrl`, `termsOfServiceUrl` copied from the Codex manifest; `repository: "https://github.com/joebenscoter86/after-effects-studio"`.
    - `icon: "./assets/gate-mark.svg"` and the Codex `keywords`.
  - `claude/src/mcp.json`: `{"mcpServers":{"after-effects-studio":{"command":"node","args":["${CLAUDE_PLUGIN_ROOT}/start.mjs"],"env":{"AE_MCP_ENABLE_EVAL":"1"}}}}`.
  - `claude/src/start.mjs`: the body of `plugin/scripts/start.mjs`, importing `./runtime/dist/index.js` (no `..`).

- [ ] **Step 2: Write failing tests in `release/tests/claude-package.test.mjs`** (`node:test` + `node:assert/strict`, building into `fs.mkdtemp` output):
  - `checkPackage flags each rule`: a fixture tree containing `.DS_Store`, a symlink, `bin/x`, `package-lock.json`, a root `package.json`, a 262,145-byte `.md`, 513 files, and a file containing `Codex` yields one violation per rule. A clean fixture yields `[]`.
  - `skills and library match plugin/ byte for byte`: every file under `skills/` and `library/` equals its `plugin/` source.
  - `manifest and MCP config`: `.claude-plugin/plugin.json` equals `claude/src/plugin.json`; `.mcp.json` args are exactly `["${CLAUDE_PLUGIN_ROOT}/start.mjs"]` with no `cwd`.
  - `LICENSE equals license.md`, and both are present.
  - `runtime/package.json` is `{"name":"after-effects-studio-runtime","version":<plugin/runtime/package.json version>,"private":true,"type":"module"}` with no `dependencies`.
  - `check mode detects drift`: after a build, appending a byte to one output file makes `--check` exit 1 and print that path.

- [ ] **Step 3: Run tests and confirm they fail.** Run `node --test release/tests/`. Expected: FAIL, modules not found.

- [ ] **Step 4: Implement `checkPackage` and `buildClaudePackage`.**
  - **Allowlist (mirrors `release/build-package.py`):**
    - Root files: `PROVENANCE.md`, `THIRD-PARTY-NOTICES.txt`, `license.md`, `runtime/LICENSE`, `scripts/doctor.mjs`, `scripts/doctor-core.mjs`, `scripts/verify-export.mjs`.
    - Trees: `assets`, `docs`, `examples`, `library`, `skills`, `runtime/jsx`.
  - **Then add:**
    - `.claude-plugin/plugin.json`, `.mcp.json` and `start.mjs` from `claude/src/`.
    - `LICENSE` as a copy of `license.md`.
    - The generated `runtime/package.json`.
    - Any file under `claude/src/docs/` or `claude/src/README.md`, replacing the same path.
  - **Checks:** reuse the private-path and credential regex from `build-package.py`. Exempt `.png`, `.svg`, `.jpg` and font files from the size rule only.
  - **Write:** clear and rewrite `outDir` on every build so removed files disappear.

- [ ] **Step 5: Run tests and confirm they pass.** Run `node --test release/tests/`. Expected: all PASS.

- [ ] **Step 6: Build and validate.** Run `node release/build-claude-package.mjs`. Expected: it writes the package and prints the known pending violations: the 1.7 MB bundle (fixed in Task 2), and `codex`/`GPT-` text (fixed in Tasks 5–6). Then run `claude plugin validate claude/after-effects-studio`. Expected: no errors about the manifest, MCP config or skills.

- [ ] **Step 7: Commit** `claude/src`, `release/claude-checks.mjs`, `release/build-claude-package.mjs`, `release/tests` and `claude/after-effects-studio` with message `feat(claude): generate Claude plugin package from plugin/`.

### Task 2: Readable runtime within file limits (CL-2)

**Files:**
- Create: `release/claude-runtime.mjs`
- Modify: `release/build-claude-package.mjs` (default `runtime` hook), `.gitignore`
- Test: `release/tests/claude-package.test.mjs`

**Interfaces:**
- Consumes: the `runtime` hook from Task 1.
- Produces: `buildReadableRuntime(pluginRuntimeDir: string, outRuntimeDir: string): Promise<{ appFiles: string[], vendorFiles: string[], packages: string[] }>` in `release/claude-runtime.mjs`.

- [ ] **Step 1: Write failing tests.**
  - `runtime is readable and within limits`: no file in the built `runtime/` exceeds 262,144 bytes; `runtime/dist/index.js` exists and contains `registerTool`.
  - `every vendored package has a license and a notice`: each `runtime/node_modules/<pkg>/` has a license file, and its name appears in `THIRD-PARTY-NOTICES.txt`.
  - `vendored modules are not ignored by git`: `git check-ignore -q claude/after-effects-studio/runtime/node_modules/zod/package.json` exits 1.
  - `builder fails cleanly without installed deps`: with `pluginRuntimeDir` pointing at a copy that has no `node_modules`, the call rejects with a message containing `npm ci --ignore-scripts`.

- [ ] **Step 2: Run tests and confirm they fail.** Run `node --test release/tests/`. Expected: the four new tests FAIL.

- [ ] **Step 3: Implement `buildReadableRuntime`.**
  - **Own code:** transpile every `src/**/*.ts` with esbuild (`bundle: false`, `format: "esm"`, `platform: "node"`, `target: "node24"`, `outbase: "src"`) into `outRuntimeDir/dist/`. Keep `dist/index.js` one level below `runtime/package.json`; `index.ts` and `config.ts` depend on that.
  - **Dependencies:**
    - Run an in-memory esbuild bundle of `src/index.ts` (`write: false`, `metafile: true`, same options as `plugin/scripts/build.mjs`).
    - Copy every metafile input under `node_modules/` unchanged to the same relative path under `outRuntimeDir/node_modules/`.
    - Also copy each package's `package.json` and its license file, found with the same lookup list `build.mjs` uses.
    - Measured on 2026-11-08: 224 files from 8 packages, the largest 128 KiB.

- [ ] **Step 4: Add the `.gitignore` exception** after `node_modules/`:

```
!claude/after-effects-studio/runtime/node_modules/
!claude/after-effects-studio/runtime/node_modules/**
```

- [ ] **Step 5: Make `buildReadableRuntime` the default hook** in `build-claude-package.mjs`.

- [ ] **Step 6: Run tests and confirm they pass.** In `plugin/runtime` run `npm ci --ignore-scripts`, then `node --test release/tests/`. Expected: all PASS.

- [ ] **Step 7: Rebuild and commit.** Run `node release/build-claude-package.mjs`. Expected: no size violation printed. Then `git status --short claude/` (vendored files listed as new). Commit with `feat(claude): readable runtime build within directory file limits`.

### Task 3: Smoke-test the generated package as Claude launches it

**Files:**
- Modify: `plugin/tests/smoke.mjs`
- Test: the same file, run against `claude/after-effects-studio`

**Interfaces:**
- Consumes: the package from Tasks 1–2.
- Produces CLI flags: `--host claude` and `--cwd <dir>` on `plugin/tests/smoke.mjs`.

- [ ] **Step 1: Implement the Claude launch path.** With `--host claude`:
  - Substitute `${CLAUDE_PLUGIN_ROOT}` in `command` and `args` with the plugin root path.
  - Require that the config has no `cwd`.
  - Spawn with `cwd` set to `--cwd` (default `os.tmpdir()`).
  - Skip the Codex-only `cwd === '.'` and no-`${` assertions.

  Without `--host`, behavior is unchanged.

- [ ] **Step 2: Run the Codex smoke to confirm no regression.** From `plugin/`, run `node tests/smoke.mjs`. Expected: same checks pass as before.

- [ ] **Step 3: Run the Claude smoke from the committed package.** Run `node plugin/tests/smoke.mjs --host claude --plugin-root claude/after-effects-studio --output "$TMPDIR/aes-smoke"`. Expected: initialize returns `after-effects-studio`; the tool list includes `ae_library`; the library checks pass.

- [ ] **Step 4: Run the Claude smoke from a path with a space.** Copy the package to `"$TMPDIR/aes test/after-effects-studio"` and rerun Step 3 with that `--plugin-root`. Expected: PASS.

- [ ] **Step 5: Run the library hash check against the Claude package.** Run `node plugin/tests/library-modules.mjs --plugin-root claude/after-effects-studio`. Expected: PASS.

- [ ] **Step 6: Commit** with `test: smoke the Claude package with plugin-root substitution and foreign cwd`.

### Task 4: Tool annotation guard and policy review (CL-3)

**Files:**
- Modify: `plugin/runtime/tests/mcp-server.test.ts`
- Possibly modify: `plugin/runtime/src/index.ts` (server instructions), `plugin/runtime/src/tools/*.ts` (descriptions)
- Create: `quality/reports/<date>-claude-policy-review/report.md`

- [ ] **Step 1: Write the test** `every tool declares a title and a behaviour hint` in `mcp-server.test.ts`. For all listed tools, `title` is a non-empty string, and annotations contain `readOnlyHint: true` or a boolean `destructiveHint`.

- [ ] **Step 2: Run it.** In `plugin/runtime` run `npx vitest run tests/mcp-server.test.ts`. Expected: PASS (all 12 tools already comply). This test guards against regressions.

- [ ] **Step 3: Review each tool description and the server `instructions` string.** Fetch the current [Software Directory Policy](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy) section 2 and check:
  - Each description states what the tool does and nothing else.
  - No text pressures Claude into calls the user didn't ask for.
  - `ae_do`'s description says it can run any catalog operation, including `eval.run` custom ExtendScript, and may modify or delete project content.

  Change wording only where a check fails. Keep `ae_do` as one destructive tool.

- [ ] **Step 4: Run `npm audit` and `npm outdated` in `plugin/runtime`.** Update a dependency only if audit reports a vulnerability. Rebuild the Codex bundle with `node plugin/scripts/build.mjs` only if `src/` or dependencies changed.

- [ ] **Step 5: Write the report.** Use the [report template](../quality/reports/report-template.md) headings that apply. Record each tool, its title, its hints, each description verdict (Pass or Changed, with the reason), the audit output and the outdated list.

- [ ] **Step 6: Verify.** Run `npm run typecheck && npx vitest run --exclude 'tests/e2e/**'` in `plugin/runtime`, `node tests/smoke.mjs` in `plugin/`, then `node release/build-claude-package.mjs --check`. Rebuild if the check reports drift. Expected: all pass.

- [ ] **Step 7: Commit** with `chore: directory policy review of MCP tools`.

### Task 5: Host-neutral shared wording and license draft (CL-4, shared part)

**Files:**
- Modify: `plugin/skills/motion-studio/SKILL.md` (the paragraph beginning "For visually demanding builds"), `plugin/library/references/quality.md` (line 5), `plugin/library/manifest.json` (regenerated), `plugin/docs/connection-recovery.md` (the "In a new Codex task" sentence)
- Modify: `license.md`, `plugin/license.md`, `release/build-package.py` (license title check)

- [ ] **Step 1: Replace the motion-studio model paragraph** with exactly:

```
For visually demanding builds, suggest the most capable model available in your host. A lower-cost model can still build editable drafts; treat its render as a draft until the delivered frames pass visual review. Do not switch models without the user's choice, and never treat model choice as creative acceptance.
```

- [ ] **Step 2: Replace `quality.md` line 5** with the same three sentences. Then run `node plugin/scripts/manifest.mjs`.

- [ ] **Step 3: In `connection-recovery.md`**, change "In a new Codex task" to "In a new task".

- [ ] **Step 4: Run the library checks.** Run `node plugin/tests/library-modules.mjs --plugin-root plugin` and `npx vitest run tests/library.test.ts tests/library-modules.test.ts` in `plugin/runtime`. Expected: PASS. A hash failure means Step 2's manifest run was missed.

- [ ] **Step 5: Draft License 1.1 in both `license.md` files (identical text).**
  - Change the title to `After Effects Studio Original Materials License 1.1`.
  - After the "You may, at no charge:" list, add exactly:

```
**Authorized sources** are: (a) the public repository at https://github.com/joebenscoter86/after-effects-studio and the plugin marketplaces it publishes; (b) the After Effects Studio listing in Anthropic's plugin directory published by JB Technology LLC; and (c) an organization administrator who obtained an unmodified copy from (a) or (b) and makes it available only to members of that organization.
```

  - Update the `release/build-package.py` check to accept `Original Materials License 1.` followed by any version.

- [ ] **Step 6: Joe's checkpoint.** Ask Joe to approve or edit the license text. Do not commit the license change until he approves. After approval, add one sentence to D-008 noting 1.1 and the approval date.

- [ ] **Step 7: Rebuild and verify.** Run `node release/build-claude-package.mjs` and `node --test release/tests/`. Expected: tests PASS. The builder still prints `codex`/`GPT-` violations for `README.md` and the docs that Task 6 replaces, and none for `skills/` or `library/`.

- [ ] **Step 8: Commit** with `docs: host-neutral model guidance and license 1.1 (approved)`. Mention that Codex picks these up in its next version.

### Task 6: Claude README and docs (CL-4, Claude part)

**Files:**
- Create: `claude/src/README.md`, `claude/src/docs/local-install.md`, `claude/src/docs/first-session.md`, `claude/src/docs/ARCHITECTURE.md`
- Test: `release/tests/claude-package.test.mjs`

- [ ] **Step 1: Write failing tests.**
  - `README covers directory requirements`. The generated `README.md`:
    - has at least 40 words outside code blocks;
    - contains the headings `## Requirements`, `## Where it works`, `## What it runs and sends`, `## Privacy`, `## Example prompts`, `## Install`, `## Remove`;
    - lists at least 3 bullet prompts under `## Example prompts`;
    - mentions `Node.js 24`, `nodejs.org`, `AE_MCP_READONLY=1` and `AE_MCP_ENABLE_EVAL=0`.
  - `install commands match the manifest name`: `docs/local-install.md` contains `claude plugin install <name>@jb-technology`, using the name from `claude/src/plugin.json`, and `claude plugin uninstall <name>@jb-technology`.
  - `build output passes all checks`: `checkPackage(outDir)` returns `[]`. This covers the `codex`/`GPT-` rule.
  - `builder exits 1 on violations`: run the CLI with `outDir` pointing at a temp build after adding a `.DS_Store`; expect exit 1.

- [ ] **Step 2: Run tests and confirm they fail.** Run `node --test release/tests/`. Expected: the four new tests FAIL.

- [ ] **Step 3: Write `claude/src/README.md`.**
  - **Where it works:** AE control works in Claude Code and, pending CL-5, in Cowork sessions on the user's Mac. Regular Claude chat loads the skills only.
  - **What it runs and sends:** derived from `plugin/README.md`, rewritten for Claude:
    - the local Node server, macOS OS scripting and the file mailbox;
    - no HTTP listener or cloud relay;
    - what reaches Claude: tool inputs and results, project metadata, previews.
  - **Privacy:** links to the privacy page.
  - **Example prompts:** the three `defaultPrompt` strings from the Codex manifest.
  - Link `LICENSE`, `PROVENANCE.md` and `THIRD-PARTY-NOTICES.txt`.

- [ ] **Step 4: Write `claude/src/docs/local-install.md`.** Cover:
  - Requirements: Node.js 24+ from the nodejs.org installer; a Homebrew or nvm `node` may be invisible to the Claude desktop app.
  - Claude Code: `claude plugin marketplace add joebenscoter86/after-effects-studio`, then `claude plugin install after-effects-studio@jb-technology`.
  - Claude app: Customize → Plugins → Add marketplace with the same repository.
  - Update: `claude plugin marketplace update jb-technology`, then `claude plugin update after-effects-studio@jb-technology`, then restart.
  - Remove: `claude plugin uninstall after-effects-studio@jb-technology`.
  - Local development: `claude --plugin-dir claude/after-effects-studio`.
  - Removal does not touch AE projects or exports. Mark every command "verified in CL-5" only after CL-5 runs it.

- [ ] **Step 5: Write `claude/src/docs/first-session.md` and `claude/src/docs/ARCHITECTURE.md`.**
  - `first-session.md`: the `plugin/docs/first-session.md` journey with Claude wording: new Claude Code session or Cowork task, the read-only check prompt, and the macOS Automation prompt naming Claude or Terminal.
  - `ARCHITECTURE.md`: the `plugin/docs/ARCHITECTURE.md` text with the first paragraph describing `.claude-plugin/plugin.json`, `.mcp.json` → `start.mjs` → `runtime/dist/index.js`, and the vendored `runtime/node_modules`.

- [ ] **Step 6: Make violations fatal, rebuild and run all checks.** In `build-claude-package.mjs`, exit 1 after printing any violation from `checkPackage`. Run `node release/build-claude-package.mjs` (exit 0), `node --test release/tests/`, and `claude plugin validate --strict claude/after-effects-studio`. Expected: all PASS, with no warnings under `--strict`. Fix any unrecognized manifest field it reports in `claude/src/plugin.json` and rebuild.

- [ ] **Step 7: Rerun the Task 3 Claude smoke.** Expected: PASS.

- [ ] **Step 8: Commit** with `docs(claude): README, install, first session and architecture for Claude users`.

## After this plan

CL-5 (dev-Mac acceptance in Claude Code and Cowork, plus `claude plugin eval` against a no-plugin baseline) runs next and needs After Effects open with owned test items. The plugin name must be settled before CL-6; renaming means editing `claude/src/plugin.json`, renaming `claude/after-effects-studio/` and the `.gitignore` exception, and rebuilding.

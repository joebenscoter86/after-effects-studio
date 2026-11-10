# Claude plugin distribution route research

Date: 2026-11-08 (America/Los_Angeles). Scope: decide whether the After Effects Studio package can be distributed to Claude users through Anthropic's plugin directory, and what must change. Research only. No package change, publication, submission, outreach or native AE operation was performed.

## Evidence inspected

Local package: `plugin/.codex-plugin/plugin.json`, `plugin/.mcp.json`, `plugin/scripts/start.mjs`, `plugin/runtime/package.json`, `plugin/runtime/src/index.ts` (tool annotation mapping), `plugin/skills/*/SKILL.md`, `plugin/docs/ARCHITECTURE.md`, `plugin/PROVENANCE.md`, `license.md` and `release/build-package.py`. Local CLI: Claude Code 2.1.302 `claude plugin --help` and `claude plugin validate --help`. Directory search: the Claude plugin catalog was searched for "after effects", "motion graphics", "adobe" and "animation".

Official pages read on 2026-11-08:

- Plugin format: [overview](https://code.claude.com/docs/en/plugins/overview), [manifest reference](https://code.claude.com/docs/en/plugins/manifest-reference), [MCP](https://code.claude.com/docs/en/mcp), [security](https://code.claude.com/docs/en/plugins/security).
- Marketplaces: [create a marketplace](https://code.claude.com/docs/en/plugins/create-marketplace), [Anthropic marketplaces](https://code.claude.com/docs/en/plugins/anthropic-marketplaces), [publish](https://code.claude.com/docs/en/plugins/publish).
- Directory: [publish to the directory](https://claude.com/docs/directory/publish), [submit a plugin](https://claude.com/docs/plugins/submit), [pre-submission checklist](https://claude.com/docs/plugins/pre-submission-checklist), [platform support](https://claude.com/docs/plugins/platform-support), [plugins overview](https://claude.com/docs/plugins/overview), [org rollout](https://claude.com/docs/plugins/org-sync).
- Desktop extensions: [MCPB docs](https://claude.com/docs/connectors/building/mcpb), [connector submission](https://claude.com/docs/connectors/building/submission), [MCPB manifest spec](https://github.com/modelcontextprotocol/mcpb/blob/main/MANIFEST.md).
- Policy and terms: [Anthropic Software Directory Policy](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy) (partly readable), [Anthropic Software Directory Terms](https://support.claude.com/en/articles/13145338-anthropic-software-directory-terms) (updated 2026-03-16).
- Repositories: [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official), [anthropics/claude-plugins-community](https://github.com/anthropics/claude-plugins-community).

## Findings

**The route exists.** The directory accepts third-party "Plugin bundle" submissions from a GitHub repository at [claude.ai/directory/manage](https://claude.ai/directory/manage). A submission names the repository, an optional plugin folder path and a tracked branch or tag. The repository may stay private during validation and review (Claude GitHub App required) but must be public before the listing goes live. Submitters need a Pro, Max, Ultra, Team or Enterprise plan. Every version gets automated validation and a security scan, and a person reviews each new listing. Updates ship by merging to the tracked branch with a raised `version`. Ten submissions per organization per 24 hours.

**Desktop extensions are closed to new listings.** The directory "no longer accepts local MCP servers packaged as desktop extensions (MCPB). To distribute a local MCP server through the directory, include it in a plugin bundle." Older Help Center text that still points to a desktop-extension submission form is stale.

**One format, three surfaces, with a surface limit.** The same plugin folder installs in Claude Code, Cowork and claude.ai. Skills load everywhere. A local MCP server (a command the app starts) loads in Claude Code and in Cowork only when the Cowork session runs on the user's computer. Ordinary Claude chat ignores it. AE control therefore works in Claude Code and local Cowork, not in regular chat. A top-level `bin/` folder makes claude.ai and Cowork refuse the plugin. Local servers whose `${user_config.*}` values have no default are ignored in Cowork. Plugin limit on claude.ai/Cowork: 5,000 files and 200 MB.

**Node.js is not documented for plugin servers.** Desktop extensions run on Node bundled with Claude Desktop. No official page says plugin MCP servers use it. A GitHub report ([anthropics/claude-code#66183](https://github.com/anthropics/claude-code/issues/66183), closed "not planned") says a plugin `node` command fails with `spawn node ENOENT` in Cowork without a system Node. Treat Node 24 on PATH as a user prerequisite until tested.

**Self-hosted marketplace needs no review.** A `.claude-plugin/marketplace.json` in a Git repository publishes a marketplace. Users add it with `claude plugin marketplace add owner/repo` or with Add marketplace in Customize → Plugins, then install. Anthropic does not review third-party marketplaces.

**Precedent.** The directory's community tier lists third-party plugins that bundle MCP servers (for example Very Good Ventures' Flutter plugin). Listed local integrations already script desktop apps: Affinity (`execute_script`), Blender, "Control Chrome" and an AppleScript "Control your Mac" connector. The catalog search found no After Effects plugin. Adobe's listing is a remote Creative Cloud plugin whose described tools do not include After Effects. A search is not exhaustive.

## Fit of the current package

| Directory rule | Current package | Effect |
|---|---|---|
| `.claude-plugin/plugin.json` required | Absent; Codex manifest only | Blocking until added |
| README ≥ 40 words and LICENSE file or `license` field in the plugin folder | `README.md` present; terms are in `license.md` | Add a `LICENSE` file or field; filename acceptance of `license.md` is unconfirmed |
| Local server started as plain `node ${CLAUDE_PLUGIN_ROOT}/...` | `node ./scripts/start.mjs` with `cwd: "."` | Must change. Any non-shell entry file is still held for a reviewer |
| Paths may not climb out of the plugin folder | `start.mjs` imports `../runtime/dist/index.js` | Inside the folder, but whether a textual `..` triggers the check is unconfirmed; moving the entry to the plugin root avoids it |
| Non-image files under 256 KiB (held) | `runtime/dist/index.js` is 1.7 MB (unminified esbuild bundle, 45,702 lines) | Held for a reviewer |
| Readable, not packed code (held if unreadable) | Bundle is readable; TS source exists | Likely readable; a modular build removes doubt |
| ≤ 512 files (held) | 478 in `plugin/`; the Codex release allowlist ships far fewer | A Claude allowlist build fits |
| `package.json` beside a lockfile at plugin root (held) | Only in `runtime/` | Rule is root-scoped; exclude both from the Claude package anyway |
| Name that matches a known brand (held) | `after-effects-studio` | Expect a reviewer hold |
| Every tool has `title`, `readOnlyHint`/`destructiveHint` (policy 5E) | All 12 MCP tools define a `title` (`src/tools/*.ts`); `annotationsFor()` in `src/index.ts` sets the hints | Already met; review only |
| Narrow, accurate tool descriptions; no hidden or coercive instructions (policy 2) | Native operations, including `eval.run` (arbitrary ExtendScript, enabled by default), project open/close/new and deletes, run through one generic `ae_do` tool marked destructive. MCP hints cannot differ per operation | Disclose plainly; expect scrutiny of a generic dispatcher. Listed precedents expose similar script tools |
| Privacy section, ≥ 3 example prompts, current dependencies (policy 3A/3E/5G) | Prompts exist in the Codex manifest; privacy page exists | Add to the Claude README; refresh dependencies |

Codex-specific content is small: GPT model guidance in `skills/motion-studio/SKILL.md` and in the hash-checked `library/references/quality.md`, the Codex manifest, and install/first-session docs. The five skills and the 29-document library are otherwise host-neutral.

## Unconfirmed

- Whether plugin MCP servers in Cowork can use Claude Desktop's bundled Node.
- How macOS Automation consent is attributed when Claude Code or Cowork starts the server, and whether the directory reviews desktop-app control specifically. The policy neither allows nor forbids it.
- Whether a `license.md` filename satisfies the LICENSE check.
- Whether the validator follows `import()` from the entry file.
- How policy 3D ("a standard testing account with sample data") applies to a local-only plugin. The plugin portal has no test-account step.

## Result

A Claude plugin bundle is the supported route. It needs a Claude manifest, a Claude-specific package build and policy work, not a new runtime. The expected reviewer holds (entry script, bundle size, brand-like name) are not rejections. On 2026-11-08 Joe chose a local-only v1 scope: AE control in Claude Code and local Cowork, no hosted relay. The plan is [claude-release-plan.md](../../../product/claude-release-plan.md); the decision is D-014.

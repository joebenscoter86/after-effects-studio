# 2026-11-09 — CL-6: the Claude marketplace is published and Comp Room installs from GitHub

- Scenario ID and requirement: CL-6 in [claude-release-plan.md](../../../product/claude-release-plan.md). Done when `claude plugin marketplace add joebenscoter86/after-effects-studio` and an install succeed from a clean Claude Code config, and Customize → Plugins → Add marketplace finds the plugin.
- Operator: Claude (Opus 5.5) in the Claude desktop app's Code tab; author of the package.
- Date; machine; host; Node: 2026-11-09 America/Los_Angeles; Joe's MacBook Air (personally owned, not the D-011 Mac); Claude Code CLI 2.1.302; Node 25.9.0. After Effects was not used.
- Authorization: Joe, 2026-11-09 ("go ahead"), with a full merge rather than a Claude-only tag (D-017).

## The public change

[Pull request 8](https://github.com/joebenscoter86/after-effects-studio/pull/8) merged this branch into public `main` (merge commit `9355a50`, branch head `349fa8e`). It adds `.claude-plugin/marketplace.json` (`jb-technology`, one plugin `comp-room` from `./claude/comp-room`; `claude plugin validate --strict` passes on it and on the package) and everything else on the branch. The Codex package's `plugin/` content changed under the unchanged version `0.2.0+codex.20261018`; the version is bumped before the Codex launch (D-017).

## Checks, from GitHub, in a throwaway `CLAUDE_CONFIG_DIR`

| Check | Result | Evidence |
|---|---|---|
| `claude plugin marketplace add joebenscoter86/after-effects-studio` | Pass | Marketplace `jb-technology` added |
| `claude plugin install comp-room@jb-technology` | Pass | 0.2.0 installed to `plugins/cache/jb-technology/comp-room/0.2.0/`, 503 files byte-identical to `claude/comp-room` |
| Registration | Pass | `claude plugin details`: "Comp Room (comp-room) 0.2.0", the marketplace description, six skills, one MCP server |
| Server start by Claude Code | Pass | `claude mcp list` (with `AE_MCP_READONLY=1`): `plugin:comp-room:comp-room` connected, started from the installed copy |
| Offline smoke from the installed copy | Pass | `plugin/tests/smoke.mjs --host claude`: handshake as `comp-room`, 91 library documents, catalog |
| Joe's own Claude configuration | Unchanged | No `comp-room` or `jb-technology` entry in `~/.claude` |
| Customize → Plugins → Add marketplace in the Claude app | Not run | Needs Joe's Claude app; the next step for him |

**Result:** Pass for the Claude Code part of CL-6. The Claude app check remains.

# 2026-11-08 — Claude package local validation (CL-5, partial)

- Scenario ID and requirement/ticket: CL-5 in [claude-release-plan.md](../../../product/claude-release-plan.md). Partial run: everything that needs no After Effects writes and no new Claude login.
- Operator and prior familiarity: Claude (Opus 5.5) in the Claude desktop app's Code tab; author of the package.
- Date/time zone; machine/OS build; host build; AE build; Node build: 2026-11-08 America/Los_Angeles; Joe's MacBook Air, personally owned, not MDM-enrolled (so not the company-managed Mac of D-011); macOS 26.6.2 (25G83); Claude Code CLI 2.1.302; After Effects 2027 27.0x78 (the only After Effects installed); Node 25.9.0.
- Source revision: `256cce6` on `claude/after-effects-anthropic-plugin-491bba`; package `claude/after-effects-studio` 0.2.0, 503 files.
- Installed source: a fresh `git clone` of that branch (committed files only) with a test-only `.claude-plugin/marketplace.json` added in the clone, installed with `claude plugin marketplace add <clone>` and `claude plugin install after-effects-studio@jb-technology` under a throwaway `CLAUDE_CONFIG_DIR`. Joe's own Claude configuration was not changed (checked: no `jb-technology` entry in `~/.claude`).

## Preflight and ownership

- Open project: `/Users/joeb/Assets/joeb/reels/2026-11-07-does-ai-dream/2026-11-07-does-ai-dream.aep`, saved, not dirty, 295 items. This is Joe's live reel project.
- Owned test items: none. Every live call ran with `AE_MCP_READONLY=1` (the smoke's default); no project write was attempted.
- One controller: no Higgsfield bridge or proxy process was running; the only After Effects calls were these read-only checks.
- Stop condition met: native create, revise and export would write into Joe's reel or replace it, so they wait for his decision.

## Checks

| Check | Result | Evidence |
|---|---|---|
| Package build, directory rules, `claude plugin validate --strict` | Pass | 503 files, no violations, strict validation passes; release tests 26/26 |
| Server start the way Claude starts it (plugin root substituted, foreign working folder, path with a space) | Pass | `plugin/tests/smoke.mjs --host claude` from the package and from a copy under `aes test/`; 12 tools, 91 library documents, 4 modules |
| Marketplace install from a Git clone | Pass | Installed to `plugins/cache/jb-technology/after-effects-studio/0.2.0/`; 503 files byte-identical to the committed package, including `runtime/node_modules` |
| Server from the installed copy | Pass | Offline smoke and read-only live smoke both pass from the cache path |
| Uninstall and marketplace removal | Pass | Both commands succeed and `claude plugin list` is empty; Claude Code keeps the cached copy on disk |
| After Effects discovery | Fail, then fixed | Before `2641415`, the server and doctor knew only AE 2024–2026 and reported `AE_NOT_FOUND`. After the fix both find AE 2027 unaided |
| Read-only live check | Pass | `ae_version_info` reports 27.0x78; `ae_context` identical before and after; no permission prompt appeared (Automation already granted to this host) |
| macOS Automation prompt wording | Unverified | Permission was already granted, so no prompt was shown |
| Missing or old Node behaviour inside the Claude app | Unverified | Needs a machine or account without Node 24 on the app's path |
| Skills registered | Pass | `claude plugin details`: six skills, one MCP server, about 596 always-on tokens (visual-styles about 210) |
| Skills trigger in a model session | Unverified | `claude -p` failed: the CLI's own login has expired ("OAuth session expired and could not be refreshed") |
| Environment switches (`AE_MCP_READONLY=1`, `AE_MCP_ENABLE_EVAL=0`) reach the server from the shell that starts Claude | Unverified in Claude | Proven only through the release test that mimics Claude's env merge |
| Create, revision and export in After Effects | Not run | Held: the open project is Joe's live reel |
| `claude plugin eval` against a no-plugin baseline | Not run | Needs the CLI login and After Effects writes |
| Cowork session on this Mac | Not run | Needs the Claude app driven by Joe |
| Joe's creative acceptance | Not applicable yet | — |

## Failures, corrections and cleanup

- AE 2027 discovery failure: fixed in `2641415` (shared runtime and doctor), with tests; the Codex package receives it in its next version. The README still names After Effects 2026 as the requirement; which versions to advertise is Joe's decision (D-007).
- Cleanup: the throwaway config, clone and smoke outputs live in the session scratchpad; nothing was written to After Effects or to Joe's Claude configuration.
- Remaining CL-5 work: native create/revise/export, the eval run, the triggering check, and Cowork, once Joe chooses how After Effects may be used and refreshes the CLI login.

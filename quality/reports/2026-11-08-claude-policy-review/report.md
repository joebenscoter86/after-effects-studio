# 2026-11-08 — Directory policy review of the MCP tools (CL-3)

- Scenario ID and requirement/ticket: CL-3 in [claude-release-plan.md](../../../product/claude-release-plan.md); Task 4 of [claude-implementation-plan.md](../../../product/claude-implementation-plan.md).
- Operator and prior familiarity: Claude (Opus 5.5) in Claude Code, executing the approved plan; author of the plan.
- Date/time zone; machine/OS build; host build; AE build; Node build: 2026-11-08 America/Los_Angeles; macOS (Darwin 25.6.0); Claude Code 2.1.302; After Effects not used (offline review); Node 25.9.0.
- Source revision plus uncommitted changes: branch `claude/after-effects-anthropic-plugin-491bba` at `cbcf820` plus this review's changes, committed together with this report.
- Policy read: [Anthropic Software Directory Policy](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy), read in full on 2026-11-08 (page shows "Updated over a week ago", no date). Sections applied: 2A–2G (tool descriptions), 5E (annotations), 5G (dependencies), 3A/3E (privacy, prompts; covered by CL-4).

No native After Effects operation ran. Preflight, ownership, render and creative rows of the template do not apply.

## Tools, titles and hints

Read from `tools/list` of the built Claude package. The new test `every tool declares a title and a behaviour hint` in `plugin/runtime/tests/mcp-server.test.ts` guards all twelve; a mutation run with one blank title failed it as intended.

| Tool | Title | Hints | Description verdict |
|---|---|---|---|
| `ae_project_info` | Project info | readOnlyHint | Pass |
| `ae_comp_info` | Comp info | readOnlyHint | Pass |
| `ae_layer_info` | Layer info | readOnlyHint | Pass |
| `ae_render_frame` | Render frame | destructiveHint false | Pass. Discloses the transient display-transform layer and file writes. |
| `ae_save_project` | Save project | destructiveHint true | Pass |
| `ae_project_export_json` | Export project JSON | destructiveHint false | Pass |
| `ae_project_import_json` | Import project JSON | destructiveHint true | Changed (2B). "Supports `clearFirst`" did not say it removes every existing project item; now it does. |
| `ae_version_info` | Version info | readOnlyHint | Pass |
| `ae_catalog` | Operation catalog | readOnlyHint | Pass |
| `ae_do` | Execute operation | destructiveHint true | Changed (2B). It did not say what its operations can do. It now states that operations can create, change and delete project content; open, close, clear and save projects; render and write files; run menu commands; change AE preferences; start or stop AE instances; read and close dialogs that block scripting; and, through `eval.run` when enabled, run custom ExtendScript with the user's own access to AE, files and system commands. These match the 24 catalog categories `ae_catalog` lists with `eval.run` enabled (23 without it). The dialog clause was added after the whole-branch review found `instance.dialogs` and `instance.dismiss_dialog` undisclosed. |
| `ae_context` | Session context | readOnlyHint | Pass |
| `ae_library` | Motion design library | readOnlyHint | Changed (2C/2D). "Begin EVERY motion task" could pull Claude into this library for motion work in other tools; now "every After Effects motion task". |

Server `instructions`: changed (2C/2D) from "Before designing or building motion" to "Before designing or building motion in After Effects", and "ALL styles" to "all styles". No instruction directs Claude to other software, to external instruction sources (2F) or to hidden content (2G); `ae_library` serves only bundled, hash-checked documents.

`ae_do` remains one destructive dispatcher, as the plan decides. No tool name exceeds 64 characters (5C).

## Dependencies (5G)

`npm audit` before: 8 advisories. Two affect packages the plugin ships: `zod` < 4.6.6 (high, memory exhaustion on oversized constrained collections, GHSA-mrhx-c7xc-m3w5) and `fast-uri` 3.0.0–3.1.8 (moderate, four URI-handling advisories). The rest (`body-parser`, `qs`, `ip-address`, `glob`, `minimatch`, `rimraf`, `vitest`/`@vitest/mocker`) are HTTP-transport or development dependencies the stdio server does not load.

`npm audit fix --ignore-scripts` (no `--force`) updated the lockfile within the declared ranges: `zod` 4.4.3 → 4.6.7, `fast-uri` 3.1.8 → 3.1.9, plus the transitive and development packages. `npm audit` after: 0 vulnerabilities.

`npm outdated` before the fix: `@modelcontextprotocol/sdk` 1.32.1 (1.32.2 available, no advisory; left as is), `zod` 4.4.3 (fixed above), and development tools (`@types/node`, `lefthook`, `oxfmt`, `oxlint`, `rimraf`, `typescript` 7 major, `vitest`). Development tools do not ship and were not updated beyond the audit fix.

## Checks

| Dimension | Pass / Fail / Unverified | Evidence and defects |
|---|---|---|
| Every tool has a title and a behaviour hint (5E) | Pass | New vitest guard; 12/12 tools. |
| Descriptions match functionality (2A, 2B) | Pass after changes | `ae_do` and `ae_project_import_json` rewritten as above. |
| No conflict with or coercion toward other software (2C, 2D, 2E) | Pass after changes | Library and instructions now scoped to After Effects. |
| No external or hidden instructions (2F, 2G) | Pass | Bundled library only. |
| Dependencies current and free of known advisories (5G) | Pass | `npm audit`: 0 vulnerabilities after the in-range fix. |
| Runtime regression | Pass | `npm run typecheck`; `npx vitest run --exclude 'tests/e2e/**'` 511 passed, 4 skipped; Codex smoke and Claude smoke both ok; Claude builder tests 14/14. |

## Failures, corrections and cleanup

- These are shared `plugin/` changes (D-014 decision 1). The Codex bundle `plugin/runtime/dist/index.js` was rebuilt with `node plugin/scripts/build.mjs`; Codex users receive the wording and dependency updates in the next Codex version after its normal tests, never in a frozen candidate.
- Remaining limits: whether a reviewer accepts one generic destructive dispatcher is unknown until review; the plan keeps it and answers a hold with these notes.

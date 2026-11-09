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
| Skills trigger in a model session (third run, below) | Pass | After the login was refreshed, a fresh session asked for a "slick dark software keynote" title loaded `motion-studio`, found `dark-keynote` through the library index and built it in After Effects. A session asked which styles suit a promo answered from the `visual-styles` description without loading the skill (see below) |
| Environment switches (`AE_MCP_READONLY=1`, `AE_MCP_ENABLE_EVAL=0`) reach the server from the shell that starts Claude | Pass for `AE_MCP_READONLY`; `AE_MCP_ENABLE_EVAL=0` not run in Claude | A session started with `AE_MCP_READONLY=1 claude -p … --plugin-dir` saw 10 of the 12 tools: `ae_save_project` and `ae_project_import_json`, which read-only mode withholds, were missing. `AE_MCP_ENABLE_EVAL` travels the same way and is covered by the release test that mimics Claude's env merge |
| Create in After Effects (second run, below) | Pass | One `batch.run` of native operations (no custom scripting): `comp.create`, `layer.create_text`, `text.set_style` (Inter Tight SemiBold 140), `keyframe.apply` for position and opacity, `layer.create_shape` with a rounded rectangle and fill, scale keys; frames at 0.1, 0.4, 0.8 and 2 s show the title fading up and the bar growing |
| Revision (second run) | Pass after a second revision | `text.set_content` ("Hello again, studio"), an earlier fade with `keyframe.apply` `replace`, `comp.set_props` duration 3 s. The longer line overflowed the frame at 140 px; `text.set_style` 112 px and `layer.bounds` put it at x 84 to 999 of 1080 |
| Export (second run) | Pass | `render.add_to_queue` and `render.start` reported the file as newly written and verified; `scripts/verify-export.mjs`: H.264, 1080 x 1920, 30 fps, 90 frames, 3.0 s, full decode passed. The default output module wrote `.mp4` although `.mov` was asked for, and the tool reported the real path |
| `claude plugin eval` against a no-plugin baseline (third run, below) | Pass | All 17 canonical cases, one run per arm: with the plugin 0.86, without 0.65, a mean gain of +0.21. The plugin scored at least as well as the baseline on every case and higher on eight. The two unrelated-request controls loaded no plugin skill in either arm |
| Cowork session on this Mac | Not run | Needs the Claude app driven by Joe |
| Joe's creative acceptance | Not applicable yet | — |

## Failures, corrections and cleanup

- AE 2027 discovery failure: fixed in `2641415` (shared runtime and doctor), with tests; the Codex package receives it in its next version. The README still names After Effects 2026 as the requirement; which versions to advertise is Joe's decision (D-007).
- Cleanup: the throwaway config, clone and smoke outputs live in the session scratchpad; nothing was written to After Effects or to Joe's Claude configuration.
- Remaining CL-5 work: the eval run, the triggering check and Cowork, once the CLI login is refreshed; the Automation prompt wording on a machine where it has not been granted.

## Second run: native create, revision and export (same day)

- Source revision `e62b7e8`, the committed package, started by a small MCP client the way Claude Code starts it (`${CLAUDE_PLUGIN_ROOT}` substituted, a foreign working folder, `AE_MCP_READONLY=0`). The CLI login was still expired, so this run drove the server's tools directly instead of through a Claude session.
- Preflight: Joe had closed his reel and said After Effects was free. The open project was untitled, unsaved, clean, with 0 items. A Higgsfield bridge proxy process was running in the background but was not used.
- Owned items: the comp `CL5 create check` and its render-queue item, removed afterwards (`comp.delete`, `render.clear_queue`). The style-library builds of CL-9 ran in the same session; see [their report](../2026-11-08-style-library-proofs/report.md).
- End state: `project.new` without saving; untitled, unsaved, clean, 0 items, the same as the preflight. Joe's reel was not opened, read or changed.
- Renders and the exported movie: `quality/renders/2026-11-08-claude-native-checks/` (git-ignored).

## Third run: fresh Claude sessions (same day, after the CLI login was refreshed)

- How the sessions were started: `claude -p` from an empty scratch folder with `--plugin-dir claude/after-effects-studio` (the committed package) and `--setting-sources project`, so none of Joe's own plugins or settings loaded. `--disallowedTools` hid the Higgsfield bridge, the Higgsfield connector and computer use, so the plugin was the only thing that could reach After Effects, and hid `ae_save_project`. A first probe confirmed the session saw the plugin's six skills and its server, and no other MCP server.
- `--strict-mcp-config` cannot be used for this: it also drops the MCP server of a `--plugin-dir` plugin. The probe with it saw the six skills and no tools.
- Model: `claude-opus-5-5`, the account's default.

**Build session.** The prompt asked for "a five-second vertical (1080x1920, 30 fps) opening title for a weather app called Drizzle that tells you when to bring an umbrella. Make it look like a slick dark software keynote", in a new comp in the empty test project, unsaved, with a few frames rendered to check it. It named no skill or style. The session:
- loaded the `motion-studio` skill, read `motion-language`, the library index and `production-workflow`, then `style-dark-keynote` and its module, and the operation catalog;
- built `Drizzle_Title_Vertical` (22 layers) in one `eval.run`;
- rendered eight frames and read them, then fixed four faults it found itself: a hard-edged light sweep, a handle short of the canopy, a milky glow, and rain crossing the tagline. It undid one attempt with `project.undo`, re-rendered and checked again;
- finished in 23 turns, 21 tool calls, 4.3 minutes and $1.87 of usage, with no tool errors.

The result follows the style: a near-black stage with a hairline grid, one violet accent (one of the style's sanctioned alternatives) used only for the drop, the umbrella and the notification dot, a light-revealed headline, typed mono labels, and a toast caption. It said itself that it had checked stills only, not motion at full speed. The comp was rendered afterwards to `quality/renders/2026-11-08-claude-session-check/drizzle.mp4` (150 frames, full decode passed) for Joe's review. The project held only the session's own comp, its solids and a null. It was then replaced with an empty project, unsaved.

**Style question.** A second session, with After Effects read-only, asked which visual styles suit a 15-second promo for a note-taking app. It answered in one turn ($0.07) with living screencast, Swiss motion and one-line drawing, without loading `visual-styles` or reading the library: the 30 style names in the skill's description were enough for it to answer. The picks agree with the library's "good for" column, but the reasons were not read from it. Recorded as a deferred minor: the skill description lists names, so a style question can be answered without the grammar.

**Plugin eval.** `release/claude-evals.mjs` converts the 17 canonical cases in `plugin/evals/evals.json` into a `claude plugin eval` suite:
- One case folder per prompt, with one LLM grader per canonical assertion; assertions about what the session did are judged on the trace.
- An indicator of whether a plugin skill fired (shown, not scored).
- For the two unrelated-request controls, a scored check that no plugin skill loads.
- Codex's `$skill` invocation becomes `/after-effects-studio:<skill>`.

The suite was written into a scratch copy of the committed package and run with `claude plugin eval <copy> --runs 1 -j 4 --allow-real-servers --no-publish --threshold 0`. The plugin's real server ran, but `--allow-tools` granted only its read tools (`ae_library`, `ae_catalog`, `ae_context`, `ae_version_info`, `ae_project_info`, `ae_comp_info`, `ae_layer_info`), so no case could change the open project.

The run took 12.3 minutes and $8.11 of usage, and every case completed without a run error. The report and full results are in `quality/renders/2026-11-08-claude-eval/` (git-ignored).

| Case | With | Without | Plugin skill fired |
|---|---|---|---|
| 01 inbox review build | 0.83 | 0.67 | yes |
| 02 grinder launch | 1.00 | 1.00 | yes |
| 03 fixed product image | 1.00 | 1.00 | no (answered in one turn) |
| 04 kinetic typography plan | 1.00 | 0.33 | yes |
| 05 explicit typography | 0.50 | 0.50 | slash command (see below) |
| 06 unrelated rewrite (control) | 1.00 | 1.00 | none in either arm, as required |
| 07 paper-collage invitation | 1.00 | 0.50 | yes |
| 08 explicit paper collage | 0.67 | 0.67 | slash command (see below) |
| 09 unrelated sentence (control) | 1.00 | 1.00 | none in either arm, as required |
| 10 River Day plan | 0.75 | 0.25 | yes |
| 11 River Day revision | 0.25 | 0.25 | yes |
| 12 clean kinetic type | 1.00 | 0.67 | yes |
| 13 cut-paper garden, no text | 1.00 | 0.67 | yes |
| 14 brand guide override | 1.00 | 1.00 | yes |
| 15 library book journey | 0.83 | 0.33 | yes |
| 16 relay baton handoff | 0.75 | 0.25 | yes |
| 17 perfume reveal | 1.00 | 1.00 | yes |

What the failures with the plugin mean:

- **Judge error (01, assertion 5):** the judge failed "follows the requested aubergine, ivory and mint look rather than imposing JoeB appearance". The answer's palette is aubergine `#24112A` and `#331A39`, ivory `#F4EBDD` and mint `#3DFFC2`, and it never mentions the JoeB look.
- **Conversion artefacts (05 and 08, assertion 1):** the assertions expect a `SKILL.md` read in the trace, which is how Codex loads an explicit skill. Claude injects a slash-invoked skill, so no read appears. Both traces read the foundation (core language, production workflow, brief template) and the specialist guide (typography; paper collage).
- **Conversion limits (11, assertions 2 to 4; 16, assertion 3):** these canonical cases continue an earlier session, one revising a scene built before and one answering a follow-up turn. A single-prompt case cannot meet them, and both arms fail them equally.
- **Real gaps, recorded as deferred minors:**
  - 10, assertion 1: the session loaded `paper-collage` and read only its worked example, not the foundation or typography guidance.
  - 15, assertion 5: the plan did not separate what is native and editable, what was inferred, and which missing assets would block a faithful finish.

One run per arm is a single sample. The canonical protocol uses three, so individual case scores are noisy, but the direction across the suite is clear.

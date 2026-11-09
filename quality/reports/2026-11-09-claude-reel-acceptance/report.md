# 2026-11-09 — CL-10 reel acceptance: the rehearsal (bridge against plugin) passes after two plugin fixes; the real reel is still to run

- Scenario ID and requirement: CL-10 in [claude-release-plan.md](../../../product/claude-release-plan.md), Task 4 of [claude-reel-acceptance-plan.md](../../../product/claude-reel-acceptance-plan.md): before a real JoeB reel goes through the plugin, build the same house reel twice from scratch, once through the Higgsfield bridge and once through the plugin route, and compare.
- Operator and prior familiarity: Claude (Opus 5.5) in the Claude desktop app's Code tab; author of the plugin route and of the package.
- Date/time zone; machine/OS build; host build; AE build; Node build: 2026-11-09 America/Los_Angeles; Joe's MacBook Air, personally owned, not MDM-enrolled (not the company-managed Mac of D-011); macOS 26.6.2 (25G83); Claude Code CLI 2.1.302; After Effects 2027 (aerender at `/Applications/Adobe After Effects 2027/aerender`); Node 25.9.0.
- Source revisions: this repo `29c88be`, then the plugin fixes `f74c204` and `b0f3628` (package `claude/after-effects-studio` 0.2.0 rebuilt after each); Content branch `cl10-plugin-route` at `50e7efe4` (not merged), run from its worktree `/Users/joeb/Projects/Content/.claude/worktrees/cl10-plugin-route`.
- Evidence: `quality/renders/2026-11-09-cl10-rehearsal/` (git-ignored): each route's renders, contact sheets, checks, build records and logs; `cta-both.png` (the CTA frame from both renders) and `bp5.png` (the first plugin render's broken frame against the bridge's).
- Input: the reference build `production/after-effects/2026-10-28-house-brief-test/` (its `00-reset.jsx`, `b*.jsx`, `STYLES`) and its take `brands/joe-b/clips/2026-10-28-house-brief-test/raw-still-proreslt.mov` (a still of Joe held 71 s over a voiceover). Joe's own test material; nothing published.

## Route

The plugin route was driven the way the runbook (`Content/.claude/skills/joeb-reel/references/plugin-route.md`) tells a Claude session to drive it, through the packaged server started the way Claude Code starts it (`node ${CLAUDE_PLUGIN_ROOT}/start.mjs`, `AE_MCP_READONLY=0`). The operator's runner (`runhandoff.mjs`, session scratch) read each manifest and made the runbook's calls: `ae_project_info`, a stop on someone else's unsaved work, `project.open` and `ae_save_project` for the setup, and `ae_do` `eval.run` with the manifest's `call` and `timeoutMs` 1,800,000. A Claude Code session with the plugin installed from a local marketplace is the real reel's route (Task 5), not this rehearsal's.

## Preflight and ownership

- Open project at the start: `~/Assets/joeb/reels/2026-11-08-projects-part-three/2026-11-08-projects-part-three.aep`, saved, not dirty, 394 items (Joe's; he said After Effects was free).
- One controller: no session held `/tmp/joeb-ae.lock`. Five Higgsfield bridge proxy pairs were running, owned by other Claude sessions. They were left running, because stopping them would break those sessions, and nothing on the plugin route called them. The bridge route used them on purpose, in its own step. For the real reel night, close those sessions first (the plan's "proxy stopped").
- Owned items: two scratch reels, `2026-11-09-cl10-rehearsal-bridge` and `2026-11-09-cl10-rehearsal-plugin`. Each had a project under `~/Assets/joeb/reels/<id>/` and a folder in the Content worktree.
- Stop conditions: someone else's unsaved project open at a handoff, a modal dialog, an `ERR` result, a log older than its manifest.

## Action log

| Step | Bridge route | Plugin route |
|---|---|---|
| Reel setup (`new_reel.sh`) | Through the bridge: rig opened, saved as the reel, take swapped, MASTER 71 s | One handoff (`open` the rig, `saveAs` the reel). First run: `project.open` threw `null is not an object` (finding 1). Resumed from Save As on the verified state: same result line as the bridge |
| Whole build (`build.sh`, 365 KB script) | 15 s for the whole `build.sh`, no bridge timeout; 376 layers | One handoff; `eval.run` 22.3 s; 376 layers; result read from the call, log newer than the manifest |
| Build record | `modes.json`, `titles.json` | **Byte-identical** to the bridge's. `last-build.log` the same text (the bridge route's `go.sh` adds a trailing newline when it rewrites it) |
| Undo | — | One `project.undo` reverted the whole build (MASTER 376 to 12 layers): one undo step, no UndoGroup Mismatch dialog |
| Purge | `purge.jsx` through the bridge | `ae_do` `project.purge` `all`, then the `.plugin-purged` stamp; `render.sh` used it up |
| Render (`render.sh`, aerender 2027) | 102 s | 108 s (first), 173 s (second): aerender time, not route time |

## Checks

| Dimension | Result | Evidence and defects |
|---|---|---|
| Runtime and native structure | Pass | Setup and build ran through the plugin with the same result lines, layer count and build records as the bridge |
| Bridge route unchanged | Pass | The bridge scratch reel built and rendered from the branch's scripts with no `AE_ROUTE`, as before |
| Existing/unsaved project preservation | Pass | Joe's project reopened at the end: same file, 394 items, not dirty, file time unchanged (10:04:34) |
| Rendered frames | Pass | `framediff.py` bridge against plugin (second plugin render): 2,129 frames each, 0 failing, mean 0.058 levels, worst tile 3.06 (limit 6), worst frame 0.552 (limit 2) |
| Audio | Pass | Decoded PCM md5 identical (`fcfbb250…`) |
| House scans | Same on both | Dropout, safe line, frame 1, blank panels, titles clean on both. Both FAIL `screens` for the same reason: the reference reel's `b01.jsx` predates the `// Brief:` line (`refused: b01.jsx names no brief that is there`). A route-independent limit of the test input |
| Non-ASCII text (review finding) | Pass | The CTA keyword's curly quotes (`house.jsx` line 494) render as “BRIEF” on both routes (`cta-both.png`); the handoff is UTF-8 with a byte-order mark |
| Joe's creative acceptance | Not applicable | A rehearsal of the route; the reel itself is Task 5 |

## Failures, corrections and cleanup

1. **`project.open` threw on a project that opens untitled (plugin bug, fixed).** After Effects 2027 opens the house rig, saved by an older version, as an untitled converted copy. `app.project.file` is null, and the operation read `app.project.file.fsName` after opening. The bridge never met this, because its setup script saves as straight after opening. Fixed in `plugin/runtime` (`f74c204`): it returns `file: null`, `untitled: true` and a note to Save As. The fix was tested by running the operation's own script against a fake After Effects, and checked live: the rig opened with `untitled: true`, and the rig file was untouched.
2. **`project.open` saved a dirty project it was told not to save (plugin bug, fixed).**
   - **What happened:** after the undo check, `project.open` on the same file, with `save` at its default `false`, wrote the undone state over the built project (426 KB at 11:11:46, against the bridge's 7.1 MB). The first plugin render therefore showed the bare take (`bp5.png`).
   - **The cause:** the dispatcher suppresses dialogs, and After Effects answers `app.open`'s "save changes?" with its default, Save. This was reproduced live on the scratch project.
   - **The fix** (`b0f3628`): with `save` false it closes `DO_NOT_SAVE_CHANGES` first, and it refuses to save an untitled dirty project. It was verified live: the file time was unchanged and the change was discarded.
   - **Effect on CL-10:** none. The runbook never calls `project.open` on a dirty project. It does matter for anyone else using the operation, so it was fixed now.
   - **Rebuild:** the plugin scratch project was restored to its post-setup state (the repro null and its unused solid removed, 12 layers, 13 items) and built again. The comparison above is from that rebuild.
3. **A handoff resumed by hand.** After failure 1, the converted rig copy was open and unsaved: owned and verified. The setup handoff was resumed from Save As (the runner's `--resume-after-open`) instead of discarding it.
4. **Cleanup.**
   - Joe's project was reopened, as above.
   - Both scratch projects and both scratch reel folders were moved to the Trash (`~/.Trash/2026-11-09-cl10-rehearsal-*`, `~/.Trash/cl10-content-*`). The evidence was copied first.
   - No handoff is waiting, and no lock is held.
   - `/tmp/house-last.log` now holds the rehearsal's last build log; `projects-part-three` keeps its own in its `scripts/last-build.log`.
5. **Earlier in the day:** the first failing-test run of `tests/test_route.py` reached the real bridge (recorded in the plan ledger). Seven probe scripts ran; nothing was changed. The tests now fake `node` on PATH and refuse unless the lock path can be overridden.

## Still open

- Task 5, the real reel: Joe names it and installs the package from the local marketplace in his own Claude Code, and the other bridge sessions are closed for the night.
- `render.sh` defaults to an After Effects 2026 `aerender` path that is not installed; this run set `AERENDER` to 2027. That's a Content setting for Joe, not part of the route.
- Speed: the plugin's `eval.run` took 22 s where the bridge's whole `build.sh` took 15 s. Both are well inside the 30-minute timeout. Recorded, not chased.

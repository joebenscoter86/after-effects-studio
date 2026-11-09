# CL-10 Reel Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real JoeB house reel from Stage 7 through master and cover with every After Effects call going through the installed Claude package instead of the Higgsfield bridge.

**Architecture:** Content's `house/run.sh` is the one place every house script sends ExtendScript to the bridge (`go.sh`, `build.sh`, `new_reel.sh`'s setup, `render.sh`'s purge, `wait.sh`, `markers.sh`). A new route, `AE_ROUTE=plugin`, makes `run.sh` write the assembled script and a small manifest to a handoff folder instead of sending it. The Claude session then runs each handoff through the plugin: `project.open` or `ae_save_project` when the manifest asks, then `ae_do` `eval.run` with `return $.evalFile(<script>)` and a raised `timeoutMs`. The bridge route stays the default and is unchanged byte for byte. `sheet.sh`, which calls a bridge-only tool, is replaced by the plugin's `ae_render_frame` contact sheet.

**Tech Stack:** bash and Python 3 (Content's house scripts, pytest tests with a fake `run.sh`/`call.mjs`), ExtendScript, the Claude package `claude/after-effects-studio` 0.2.0.

**Spec:** [claude-release-plan.md](claude-release-plan.md), section "CL-10 — Production acceptance". The reel pipeline itself is defined by Content's `.claude/skills/joeb-reel/SKILL.md` (Stages 7 to 10) and is not changed by this plan.

## Global Constraints

- Joe chooses the reel and approves the Content change before any Content commit (CL-10 checkpoint).
- The Content change lives on a Content branch in its own worktree. Content `main` has someone else's uncommitted work; never touch it.
- Reels already in production finish on the route they started on. With no `AE_ROUTE` set, every house script behaves exactly as it does today.
- One controller: the Higgsfield bridge MCP is off for the session and its proxy is stopped. Higgsfield and Blender keep making boards and art; the plugin generates nothing.
- Inspect the open After Effects project before every write. Never clear, close or replace unrelated work; a dirty project that is not the reel's stops the session for Joe.
- Opening or switching projects goes through `project.open` (or `ae_save_project` with `path` for Save As), never inside an `eval.run` script (eval.run's own rule: a project boundary inside its undo group breaks undo for the session).
- Install: the CL-5 package through a local marketplace, not `--plugin-dir`. Joe runs the install in his own Claude Code; Claude does not change his configuration.
- Joe's reel gates run exactly as `joeb-reel` defines them.
- Pass: Joe accepts the master and every After Effects call from Stage 7 on went through the plugin. Any fallback to the bridge is a Fail with its cause, fixed before CL-6.

## Review Focus

1. **A build that outlasts `timeoutMs`.** The call returns a timeout while After Effects is still building. The session must not resend it: it polls `ae_project_info` until AE answers, then reads `/tmp/house-last.log` and `last-build.log`. A second handoff while one is unrun is refused (Task 1 test).
2. **The whole build in one undo group, with a save inside it.** eval.run wraps the call in an undo group and the build saves the project at its end. The rehearsal (Task 4) checks that no "UndoGroup Mismatch" dialog appears and that `project.undo` still works after a build.
3. **Paths with spaces or quotes** in the script path passed to `$.evalFile`. The manifest carries the path JSON-encoded and the session pastes it as given (Task 1 test).
4. **A stale handoff run twice.** The session deletes the manifest after a run; `run.sh` refuses to write a new handoff while one is waiting (Task 1 test).
5. **An unrelated dirty project open at a handoff.** Today's guard saves it silently. On the plugin route the session stops and asks Joe instead (runbook, Task 3).

---

### Task 1: The plugin route in `run.sh`, `go.sh` and `build.sh` (Content branch)

**Files:**
- Modify: `production/after-effects/house/run.sh`, `go.sh`, and the `build.sh` template inside `new_reel.sh`
- Test: `production/after-effects/house/tests/test_route.py` (new; reuses `test_go.py`'s `rig()` and `reel_dir()` pattern with a fake `call.mjs` that fails the test if it is ever called)

**Interfaces:**
- Produces: with `AE_ROUTE=plugin`, `run.sh file.jsx` writes `$AE_HANDOFF/<n>.jsx` (default `AE_HANDOFF=/tmp/joeb-ae-handoff`) and `$AE_HANDOFF/<n>.json` = `{"script": <abs path>, "project": <PROJECT or null>, "open": <path or null>, "saveAs": <path or null>}`, prints the manifest's path on stdout, and exits **3**. The handoff script is the caller's script without `ae_guard_js` (the project step moves to the manifest). `go.sh` and `build.sh` pass exit 3 through and print `handed off: <manifest>`.

- [ ] **Step 1: Write the failing tests** in `tests/test_route.py`:
  - `test_plugin_route_writes_a_handoff_and_sends_nothing`: exit 3; the manifest exists; its `script` file holds the build and no `app.open(`; the fake `call.mjs` was never run.
  - `test_the_manifest_names_the_reel_project`: with `./PROJECT` = `/x/reel.aep`, `project` is `/x/reel.aep`; without it, `null`.
  - `test_the_route_refuses_a_script_that_opens_a_project`: a script containing `app.open(`, `app.newProject(` or `app.project.close(` exits 1 and the message names `project.open`.
  - `test_the_route_refuses_while_a_handoff_is_waiting`: an existing `*.json` in `$AE_HANDOFF` makes a second call exit 1 naming the waiting manifest.
  - `test_the_route_refuses_while_another_session_holds_the_lock`: `/tmp/joeb-ae.lock` (path overridable as `AE_LOCK` for the test) with a live pid exits 1.
  - `test_a_path_with_spaces_and_quotes_survives`: the manifest's `script` round-trips through `json.loads` to a file that exists.
  - `test_go_passes_a_handoff_through` and `test_build_passes_a_handoff_through_without_waiting`: exit 3, `handed off:` printed, `wait.sh` not run.
- [ ] **Step 2: Run them.** `python3 -m pytest production/after-effects/house/tests/test_route.py -q`. Expected: every test fails (no route yet).
- [ ] **Step 3: Implement** the route at the top of `run.sh`, before `ae_lock`: check the lock is free and no manifest is waiting, refuse project-boundary calls, write the script and manifest, exit 3. `go.sh`'s result parser treats exit 3 as its own case; `build.sh` exits 3 before its `wait.sh` branch.
- [ ] **Step 4: Run the new tests and the whole house suite.** `python3 -m pytest production/after-effects/house/tests -q`. Expected: all pass, `test_go.py` included (the bridge route is unchanged).
- [ ] **Step 5: Commit** on the Content branch: `feat(house): AE_ROUTE=plugin hands each After Effects call to the Claude plugin`.

### Task 2: The edges: reel setup, render purge, contact sheets, wait (Content branch)

**Files:**
- Modify: `production/after-effects/house/new_reel.sh`, `render.sh`, `sheet.sh`, `wait.sh`
- Test: `production/after-effects/house/tests/test_route.py`

**Interfaces:**
- Consumes: Task 1's manifest and exit 3.
- Produces: `new_reel.sh` on the plugin route sets `AE_OPEN=<rig>/house-rig.aep` and `AE_SAVEAS=<reel .aep>` for its setup call (they land in the manifest's `open` and `saveAs`) and drops the setup script's own `app.open`/`app.project.save(new File(...))` lines. `render.sh` on the plugin route renders only after a `.plugin-purged` stamp newer than `modes.json` (as built: the first draft's `PURGED=1` flag could be exported and skip later purges).

- [ ] **Step 1: Write the failing tests:**
  - `test_new_reel_setup_hands_off_the_project_step`: the manifest has `open` ending `house-rig.aep` and `saveAs` the reel's `.aep`; the script has no `app.open(`. `new_reel.sh` stops after the setup handoff with the next command to run once it has been run.
  - `test_render_on_the_plugin_route_wants_the_purge_first`: without a fresh stamp, or while a handoff waits, it exits 1 before aerender, naming `project.purge`; with one, step 2 is skipped, the stamp is used up and `checks.txt` says the purge ran through the plugin.
  - `test_sheet_on_the_plugin_route_points_at_ae_render_frame` and `test_wait_on_the_plugin_route_says_the_call_waits`: exit 1 with that message.
- [ ] **Step 2: Run them.** Expected: fail.
- [ ] **Step 3: Implement** the four changes; each is a guarded branch at the top of its script.
- [ ] **Step 4: Run the whole house suite.** Expected: all pass.
- [ ] **Step 5: Document** the route in `house/README.md` ("The three wrappers") and a new `joeb-reel/references/plugin-route.md`, linked from Stage 7 in one line. Commit: `docs(house): the plugin route`.

### Task 3: The session runbook (`joeb-reel/references/plugin-route.md`)

This is the procedure the Content session follows; it is written in Task 2's commit and checked here against the plugin's real tool names.

- [ ] **Step 1: Write the runbook.** Before the night: the bridge connector off for the session, the proxy stopped (`pgrep -f higgsfield-bridge-proxy` shows nothing), `ae_context` answers through the plugin, `ae_project_info` read and recorded. For each handoff: read the manifest; if the open project is dirty and not the reel's, stop for Joe; `open` → `ae_do` `project.open`; `saveAs` → `ae_save_project` with `path`; `project` not open → `project.open`; then `ae_do` `eval.run` `return $.evalFile(<script>);` with `timeoutMs` 1,800,000; then delete the manifest and its script. On a timeout: poll `ae_project_info` every 30 s up to 30 min, then read `/tmp/house-last.log`. Contact sheets: `ae_render_frame` with `contactSheet` `{columns: 3, thumbWidth: 466}`, saved to the reel's `qc/`. Before `render.sh`: `ae_do` `project.purge` `all`, then `touch .plugin-purged`, then `../../house/render.sh <tag>`. (As built, the dirty-project rule is exact: stop unless the open project's path is the manifest's `project`; after a timeout, accept only logs newer than the manifest.)
- [ ] **Step 2: Check every tool and operation name** in the runbook against `ae_catalog` and the server's tool list through the installed package (read-only call). Expected: all exist.

### Task 4: Rehearsal on a scratch reel (A/B against the bridge)

Proves the route before a real reel touches it. Needs After Effects free and Joe's go.

The reference build `production/after-effects/2026-10-28-house-brief-test/` has hand-filled section files and no `words.json`, so the rehearsal reuses its build files rather than a fresh scaffold.

- [ ] **Step 1: Bridge route.** `new_reel.sh 2026-11-xx-cl10-rehearsal-bridge <the reference reel's take>`, then copy the reference reel's `scripts/` build files (`00-reset.jsx`, `b*.jsx`, `STYLES`, and `THEME` and `LOOK` if present; not `PROJECT`, `LOCKED` or `build.sh`) into the new `scripts/`, and run `./build.sh`, timing it. Record `last-build.log`, `modes.json`, `titles.json`.
- [ ] **Step 2: Plugin route.** Turn the bridge off and stop the proxy, then repeat Step 1 with `AE_ROUTE=plugin` as `2026-11-xx-cl10-rehearsal-plugin`, running each handoff (the setup's included) through the runbook. Expected: `modes.json` and `titles.json` identical to Step 1's; `last-build.log` has no `ERR`; no UndoGroup dialog; `project.undo` answers afterwards; the hook card's curly quotes render as quotes, not `â€œ` (the handoff is UTF-8 with a BOM; confirm After Effects reads it so).
- [ ] **Step 3: Render both** with `render.sh`. Expected: both `checks.txt` PASS and the contact sheets match frame for frame by eye.
- [ ] **Step 4: Clean up** both scratch reels' projects and folders by name; leave After Effects as found. Write the rehearsal into the CL-10 report as its first section.

### Task 5: The real reel, Stage 7 to Stage 10

- [ ] **Step 1:** Joe installs the package from the local marketplace in his own Claude Code (Claude gives him the two commands) and names the reel.
- [ ] **Step 2:** A Claude Code session in the Content worktree runs `joeb-reel` Stage 7 on the plugin route, then Stage 8's fix pass on Joe's notes, Stage 9 and Stage 10's master and cover. Joe's gates are unchanged.
- [ ] **Step 3: Record**, per stage: every handoff (script, duration, result), every timeout, failure or fallback, build times beside the rehearsal's bridge time, and Joe's acceptance separately from the technical result.

### Task 6: The report and the release plan

- [ ] **Step 1:** `quality/reports/<date>-claude-reel-acceptance/report.md` from the report template: rehearsal, real reel, Pass or Fail with causes.
- [ ] **Step 2:** `product/claude-release-plan.md` progress: CL-10 result; on Pass, CL-6 is waiting only on the name, the license text and Joe's authorization. Commit: `test: CL-10 reel acceptance through the Claude plugin`.

## Calls made in this plan

Planning calls by Claude, not Joe's decisions. Check them while reading.

- The switch lives in `run.sh`, not only `go.sh`, because the purge, the wait and the reel setup also reach After Effects through it. Otherwise "every call from Stage 7 on" could not pass.
- `aerender` stays. It is After Effects' own command-line renderer, not control through the bridge, and rendering in the open app would tie it up for the whole render.
- `sheet.sh` is replaced by the plugin's contact sheet rather than ported, since it calls a bridge-only tool.
- No second reel session runs while CL-10 runs. The machine-wide lock cannot be held across a Claude tool call, so the plugin route refuses to start while a live session holds it, and Joe keeps other reels off the machine for the night.
- A rehearsal on scratch copies of the reference build comes before the real reel, so a route fault costs a scratch night and not a real one.
- Today's guard silently saves an unrelated dirty project before switching; the plugin route stops for Joe instead, following this project's rule.

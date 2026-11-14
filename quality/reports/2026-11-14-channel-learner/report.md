# Channel learner, first video: build record

Started 2026-11-14 01:20 PST. Branch `adobe/channel-learner` (from main at 770d926), local only. Design: `product/channel-learner-design.md`. Plan: `product/channel-learner-plan.md`. A resumed session reads this file first and carries on from the first task without a "done" line.

## Access check (01:20 to 01:30)

- Video `YBeMmC43Q1U`: 8 min 27 s, 3840 by 2160 at 60 fps (AV1), 25 chapters. Downloaded to `quality/renders/channel-study/YBeMmC43Q1U/source.mp4` (ignored by git).
- Captions: YouTube's automatic `en-orig` track, json3, 1,679 words with a time each. The translated `en` track answered HTTP 429 and is not needed.
- Text recognition: a single-image Swift prototype read a real frame (101 boxes, including the font name, timecode and layer names). Prototype: scratchpad `ocrtest/ocr.swift`.
- After Effects 2027 running; the plugin's tools answer (226 operations, eval on). A `claude plugin eval` run from another session was driving After Effects at 01:22, so no After Effects call has been made. Asked that session for a hand-over.
- The playlist id in Joe's link (`PLVp_u-zbRE48`) does not exist. The channel lists 400 or more videos.
- Layout seen on contact sheets: a screen recording of After Effects with a small viewer at the upper left of centre, an advert panel with moving thumbnails to its right, and the timeline below. Finished results also play full-frame at the start.

## Ledger

- Task 1 done (words, sentences, transcript comparison): 13 tests pass. On the real files: whisper 1,671 words, captions 1,682, agreement 97.3 %, 60 disagreements. Whisper is right on effect names where the captions are wrong ("roughen edges", "Auto-Orient", "pre-compose"); both miss "Gaussian" (whisper "gauge and", captions "gajon"), so the on-screen text has to settle it. The timeline uses whisper's words when there are no uploaded captions.
- 01:28 After Effects handed over by the other session. Its scratch project was closed unsaved at its request; our project is `proof/proofs.aep` in the study folder (8 bpc, no working space).
- Task 2 done (frame change measurement, noisy cells, kept frames): 12 tests pass. Measured about 540 frames a second on the real 4K file, so the whole video takes about a minute.
- Task 3 done (text recognition binary, value changes between frames): 12 tests pass. About 0.08 s an image in batches. One-digit values are kept (the video sets a grid spacing of 3 and a ball size of 7); confidence floor 0.6.
- Task 4 done (timeline, command line with a ledger, `--redo`): whole suite 54 tests pass. Commits c0967df, 63d6e57, 129843f, b3f535f, c659f41.
- 01:40 Task 5, first run on the real video: gather adopted the files on disk; align took 3 min 18 s (changes 77 s, frames 78 s, text 47 s). 68 sentences (whisper), 565 kept frames (385 motion, 133 settle, 47 sentence), all read.
  - Fault found: 43,067 "text changes" and a 1.5 MB timeline. The video's editor zooms, pans and cuts around the screen recording, so matching text boxes by position reports everything as new at each view change. Being reworked to match by property label (rows of label and value), with timecodes left out and a "named on screen" list per sentence. Task 5 is not done until that lands and three tips are checked by eye.
  - No cell is "noisy" by the 50 % rule (the advert panel moves with the zooms), so nothing is ignored.
- First proof ahead of the recipes, to prove the harness: technique 01 (dotted stroke) built by script through the plugin's eval.run, rendered with ae_render_frame, set beside the tutorial's frame at 0:34 (`proof/01/side-by-side.png`). It matches, including the doubled dot where the dashes wrap. The plugin has no operation for stroke dashes or line caps; done in ExtendScript.
- Prompts for writing, checking and proving recipes are in `tools/channel-learner/prompts/`. Proof builders get the recipe only, never the video: that is the test of whether a recipe is enough.
- Gather for the next three videos (8oVLS0ZlKC4, il_OcNyqDOE, eoBEBx1PbS4) started in the background.
- 01:41 After Effects lent to the other session for about fifteen minutes of read-only eval runs, at its request (our project saved first). **Send After Effects nothing until it messages that After Effects is free again; then reopen `proof/proofs.aep` with project.open.**
- 01:46 Task 5 done. The value list now matches by property label: 633 changed, 1,722 first-seen and 98 "named on screen" items; timeline.md is 44 KB (was 1.5 MB); suite 79 tests pass.
  - Checked by eye against frames and the builder's crops: tip 1 (Stroke Width 18.0, Line Cap Butt Cap → Round Cap, Dash → 0.0, Gap → 67.0: all right); tip 13 (Ball Size 100.0 → 7.0 right; the grid spacing of 3 is on screen but the recogniser never returns a lone digit, so it is missing); tip 18 (Shape Square → Ramp Up, Ease High → -50 %, Ease Low → 100 %, Offset → -100 %, and "Based On: Characters → Words", which the narrator never says).
  - Known limits: lone single digits are not recognised; open dropdown menus, layer-switch icons and text inside the footage leave some junk items.
- Task 6 started: eight writers in parallel, about three techniques each, recipes to `recipes/` in the study folder.
- 01:52 Task 6: all 25 recipes written (study folder `recipes/`); eight checkers running. Reference crops cut for all 25 (`proof/<n>/reference.png`, plus `reference.mp4` for the animated ones).
- 01:53 The other session reports a modal dialog open in After Effects on its scratch project after its eval runs; its worker is dealing with it. Still holding: nothing sent to After Effects.
- 01:55 Task 9 groundwork: three more videos from the channel gathered and aligned with the tool, no hand work (8oVLS0ZlKC4: 64 sentences, 524 frames; il_OcNyqDOE; eoBEBx1PbS4: 64 sentences, 596 frames). Study data now 7.5 GB. No recipes written for them yet.
- Checks so far: 15, 19, 24 pass; 13, 14, 20, 21, 22, 23, 25 failed and went back to their writers once (missing steps in 14 and 25, a result that pointed at the wrong panel in 22, a second glow described as shown when only a caption mentions it in 20).
- 01:58 **After Effects is blocked until Joe unlocks the Mac.** A warning with one OK button ("Attempt was made to run a second script while another script was already running") came up at the end of the other session's eval runs, on its scratch project; the screen is locked, so nothing can click it. One push notification sent to Joe. No force-quit, no relaunch, no second instance (a relaunch under a locked screen has hung before). `proofs.aep` on disk is intact (one comp, technique 01). **Proofs wait for the other session's "free" message; then reopen `proof/proofs.aep` with project.open.**
- Usage read: weekly limit 14 % used, resets 07:00 PST. Not a constraint tonight, so the other three videos get recipes too.
- Checks, first round: pass 01, 04, 08, 15, 17, 19, 24. Second round: pass 07, 09, 13, 14. Being fixed or re-checked: 02, 03, 05, 06, 10, 11, 12, 16, 18, 20, 21, 22, 23, 25.
- Ruling: "goes back once" is counted per failure point, not per recipe. A point first raised in the second check (the checker missed it, or the fix introduced it) gets one fix and a final check of the changed lines only. Cost if wrong: a recipe gets three looks instead of two before it is held.
- The commonest failure was the `result` line: the recording's editor zooms and rearranges panels every second or two, so a crop only holds for a short stretch. The recipe prompt now says so, with the other first-video failures.

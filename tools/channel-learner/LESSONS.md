# Channel learner: what its failures taught it

Each entry is a failure that got past the tool, why, and the rule that now catches it. Add to this file whenever a recipe, a check, a build or a review turns out wrong, and change the prompt or the code in the same commit. A lesson that lives only here changes nothing.

## How a video becomes a proven recipe, and where each stage can fail

| Stage | It can say "pass" when | Caught by |
|---|---|---|
| Write (`prompts/distil.md`) | the steps are faithful to the video but do not add up to the result | check 8, the build |
| Check (`prompts/check.md`) | every claim is said or shown, yet the result frame holds traits no step produces | the build, the look review |
| Build (`prompts/prove-run.md`) | the script runs and the one named layer carries the effect | the look review |
| Review (`prompts/prove-review.md`) | the mechanism measures right on one object | the owner's eye; now the "look" line |
| Owner | | |

The first video's 25 recipes all passed the check. Building them found three recipe errors and about twenty wordings the picture contradicts. Reviewing the builds on mechanism alone then passed one the owner rejected on sight.

## Lessons

### 1. A recipe can be faithful to every step and still not give the result (technique 11, 2026-11-14)
- **What happened.** The tip styles one white disc with two layer styles. The recipe recorded every setting correctly and passed its check. The build gave a tinted disc among flat white circles. The tutorial's result is five styled discs stacked with soft shadows. The reviewer measured the shading on the one disc and called it a match. The owner: "yours look like white circles with no effect, his look like 3D discs that stack."
- **Why.** The tutorial demonstrates a step inside a finished scene. The writer scoped the recipe to the step, set the shadows aside as "the next tip", and left "do the other discs carry the styles?" as an unknown the frame could answer. The checker checked claims, not sufficiency. The builder treated the rest as scene. The reviewer was told to judge "the technique, not the artwork".
- **Rule.** The unit of a recipe is the result frame, not the demonstrated step. Writer: account for every trait of the result (`distil.md`, first item of the build-failures list; the `layout` line). Checker: check 8, "would the steps give this picture?". Builder: build the whole described picture (`prove-run.md` step 4). Reviewer: judge the look first, in plain words, and name what the recipe does not produce (`prove-review.md`, `the look` and `missing from the recipe` lines); `matches` now needs the look.

- **Confirmed (2026-11-14).** With the recipe widened to the whole result and nothing else changed, a builder that never saw the video rebuilt it and the owner, scrubbing it in After Effects, called it perfect. The steps were never the problem; the scope was.
- **What the rebuild still had to invent.** The video gives no values for the scene's shadows. The builder found them (CC Radial Fast Blur Amount 95 to 97, centre about two radii out, then Gaussian Blur about 25, opacity 16 to 27 %) and one trap: Amount is steep, 80 gives almost no streak. These are now build notes in the recipe. Rule: when the result's look depends on values the video never shows, the recipe names the effect and the measured target, and the first build's working values are written back as build notes so the next builder does not search again.

### 2. A shown setting did not give the shown result (14: Shadow Darkness 45 %)
- The panel shows 45 %. The result's shadow measures 0.22 of the floor level; 45 % gives 0.55; 78 % matched. Rule: measure the effect on the result frame and compare (`distil.md`; check 9). A value found only by building goes in as a build note beside the tutorial's value, never over it.

### 3. Values that only mean something in the tutorial's scene (17 fog depths, 16 aperture, 21 curve point, 19 font size)
- Copying them into a new scene gave no effect or the wrong one. Rule: keep the value and also state the effect in scene-free terms a builder can aim for (`distil.md`).

### 4. Layout figures wrong or missing (04 radius 0.61 for 0.48; 19 letter height)
- Rule: every size in steps is checked against the result frame; disagreeing figures fail (check 9).

### 5. Direction and motion written from the words (11 "top-to-bottom"; 06 roll and travel; 18 hold then drop)
- Rule: for anything directional or moving, cut frames across the result and write direction, speed, and what holds (`distil.md`; check 10).

### 6. An effect credited to the wrong object (12: a bar's shadow read as the letters')
- Made by the writer's layout line and again by a reviewer. Rule: trace each shadow to where it starts (`distil.md`; check 10; `prove-review.md` measuring rules).

### 7. A reviewer's wrong measurement sent a builder the wrong way (06 roll 6 for 16 degrees and direction; 12 widening)
- Rule: angles, directions and speeds in `to fix` need two independent methods; reference and build measured the same way at the same place; fixes are targets marked untested (`prove-review.md`).

### 8. A match reached by tuning the stand-in art (17)
- Rule: the reviewer says when figures depend on the stand-in scene; such a match is weaker evidence (`prove-review.md`).

### 9. After Effects scripting facts that cost rounds
- Point controls and `fromComp`, match names, font substitutes, layer styles by menu command, cameras, one call per turn. Kept in `prove-run.md` under "What earlier builds learned".

### 10. Only the owner proves a recipe
- `status: proven` counts only with the owner's acceptance and its date written on the status line; `assemble.mjs` refuses a bare "proven" (test in `tests/assemble.test.mjs`). The draft's header counts proven recipes.

### 11. Plain stand-ins hide whether a technique sells (owner, 2026-11-14)
- Proofs on plain shapes showed mechanisms; the owner wants each to look as if a professional made it, and a few techniques cannot be judged at all without real art (a puppet pin needs a character; fog needs layered painted depth). Rule: every proof build gets designed artwork, generated to a brief (`prompts/art.md`): our own art of the same kind as the tutorial's, split into layers where the technique acts on layers.

### 12. Building on art pulls the technique off its recipe (2026-11-14)
- **What happened.** Rebuilding 24 proofs on generated art, builders changed the technique to make it sit well on the art: a shadow lightened from the measured 78 % to 50 % because it "drew a near-black slab" (14), a blur Amount cut from 95 to 70 because streaks ran off the frame (15), a shadow fan widened to 46 degrees because 15 looked faint (12), fog depths moved until the fog darkened the picture instead of hazing it (17), letter fray made into slow waves (21). Each looked better to the builder; each made the proof stop proving the technique.
- **Why.** The art was not made for the technique's measured targets (the forest's far trunks were painted lighter than the fog colour, the reverse of the tutorial), and the builder fixed the clash on the technique's side.
- **Rule.** The recipe's measured effect is fixed; the art and the layout bend to it. When the two clash, change the art (darken a plate, move a layer, re-generate) or the scene's scale, never the technique's measured result, and record the clash. Builders now measure their render against the recipe's figures after placing art (`prove-run.md` step 0), and art briefs state the technique's targets the art must allow (`art.md`).

### 13. The orchestrator's own slips
- Times written from guesses ran an hour fast: take every time from `date`.
- Verdicts were relayed to the owner before anyone had looked at a pair: look at each pair yourself before reporting it as matching, and say which ones you have not seen.
- Recipes edited after their check: `assemble.mjs` refuses them until a check is newer than the recipe.

### 14. Running the learner used a quarter of a week's usage (audit, 2026-11-21)
- **What happened.** One session built and ran the learner for 13 days. It started 118 agents itself, held their work in a context that grew to 966k, ran partly on Fable, and named Opus for most agents. Builders and reviewers were resumed with follow-up messages until they held 300k to 450k, and the runs opened about 2,700 images, many of them full-size frames. It came to about 24 % of the owner's week (build runs 4.1 %, writers 3.4 %, checkers 2.2 %, reviewers 1.4 %, the session itself 13 %), and the week ran out 37 hours early.
- **Why.** Nothing set a model per stage, so every agent took the strongest one; nothing capped a run or a video; one agent took several recipes and was then continued, so each new message re-read everything before it; and the prompts asked for full-size pairs and several frames per look.
- **Rule.** Stages run through `run-stage.mjs` only: one fresh headless run per recipe per stage, never resumed; each stage's model named in its `STAGES` table (Sonnet everywhere except `prove-review` on Opus; never Fable); every run has a turn limit, a dollar cap and a time limit, and one that hits it is a fail with its reason, not a retry; each video has a budget, and the runner stops before the next run once it is spent. Builders and reviewers look at one 512-px contact sheet and cut a full-size crop only for a figure (`prove-run.md` step 4, `prove-review.md` steps 1 and 2). The orchestrating session reads `runs.jsonl`, not the runs. Tests: `tests/run-stage.test.mjs`, `tests/contact-sheet.test.mjs`.

## Still open
- Checks 8 to 10 and the look review are new. They have not yet been run on the other four videos' 39 recipes, and the 24 "matches" on the first video were given before the look line existed.
- Nothing yet tests the prompts themselves. A cheap test: keep technique 11's first recipe as a fixture and confirm a fresh checker fails it on check 8.

## Running a video

Everything a model does goes through `run-stage.mjs`; the steps without a model (`learn.mjs`, `assemble.mjs`, `proofs/references.mjs`) are plain scripts. From the repository root, with `S` the study folder (for example `~/Assets/comp-room-studies/channel-study/<id>`):

1. Gather and align (no model): `node tools/channel-learner/learn.mjs gather <url> --out $S`, then `node tools/channel-learner/learn.mjs align $S`.
2. Preview the plan at no cost: `node tools/channel-learner/run-stage.mjs video --study $S --dry-run`.
3. Recipes: `node tools/channel-learner/run-stage.mjs video --study $S`. It lists the techniques, writes and checks each recipe in fresh runs, gives a failed recipe up to two fix rounds, holds what still fails, and assembles the draft. Run it in the background: a 25-technique video is many runs.
4. Proofs, one stage at a time, after `node tools/channel-learner/proofs/references.mjs $S`:
   `node tools/channel-learner/run-stage.mjs art --study $S` (generates images, which costs Higgsfield credits as well), then `prove-author --study $S --scripts tools/channel-learner/proofs/<id>`, then `prove-run` with the same `--scripts` (After Effects open on `$S/proof/proofs.aep`; one run at a time, always), then `prove-review --study $S`. The runner makes each proof's contact sheets before its review.
5. The menu, once drafts change: `node tools/channel-learner/run-stage.mjs menu`.

Follow a video in `$S/runs.jsonl` (one line per run: stage, technique, model, pass or fail, note, cost, turns, peak context), or total it with `node tools/channel-learner/run-stage.mjs spent --study $S`. Each video may spend `VIDEO_BUDGET_USD` (40 dollars as Claude Code counts them; `--budget-usd` changes it for one go). Past it the runner starts nothing more and prints where it stopped; run the same command again with a higher budget and it skips what already passed. `--only 04,07` reruns chosen techniques, `--jobs 3` runs text stages three at a time (never `prove-run`). Models, turn limits and caps per run are the `STAGES` table at the top of `run-stage.mjs`: change them there and nowhere else.


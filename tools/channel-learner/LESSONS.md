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

### 12. The orchestrator's own slips
- Times written from guesses ran an hour fast: take every time from `date`.
- Verdicts were relayed to the owner before anyone had looked at a pair: look at each pair yourself before reporting it as matching, and say which ones you have not seen.
- Recipes edited after their check: `assemble.mjs` refuses them until a check is newer than the recipe.

## Still open
- Checks 8 to 10 and the look review are new. They have not yet been run on the other four videos' 39 recipes, and the 24 "matches" on the first video were given before the look line existed.
- Nothing yet tests the prompts themselves. A cheap test: keep technique 11's first recipe as a fixture and confirm a fresh checker fails it on check 8.

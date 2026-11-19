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

### 14. Merge lines written from memory (second video, 7pgDb6NKEXM 03 and 08, 2026-11-15)
- **What happened.** Matching the second video against the catalog, the orchestrator wrote the `differs:` line of both variants itself, from its memory of the parents. Both were refused by the checker: 03 said the parent's pivot was off screen (it is inside the frame; 03's is the one off screen), called the parent's wheel still (its finished example turns) and said the steps were the same (the parent spreads its rotation in one drag); 08 listed the parent's own settings (40 degrees, Bevel Size 5) as differences and presented shadow figures from another recipe's proof build as shown in the parent's video.
- **Why.** No prompt covered matching, and nothing checked a merge: the catalog design said "a checker confirms the merge" but no check, prompt or code did.
- **Rule.** Matching follows `prompts/merge.md`: both recipes open side by side, every claim about the parent pointing at a line of the parent's section, nothing from memory. The checker's check 11 (`check.md`) confirms or refuses the merge, and `assemble.mjs` refuses a recipe with a `variant of:` line whose check does not say `merge: confirmed` (test in `tests/assemble.test.mjs`).

### 15. A finished example played in place of the build (second video, 01, 02)
- **What happened.** 01's result line named a frame from the pre-made finished version shown at the start of the chapter: darker, steeper strips, more window bars and sharper edges than anything the steps make. 02's second keyframe was read as 15 % from a panel shown just after a jump cut; the settled picture (a fully shadowed corner) rules it out.
- **Rule.** Already in `distil.md` ("the finished example is a different file"); this time the checker's check 8 caught both. Kept here because it is the commonest round-1 failure across both videos: writers should point the result at the build when the steps make the build, and give the pre-made version as a labelled reference with its own measurements.

### 16. The tool did not make the frames its prompts read (second video, 2026-11-15)
- **What happened.** Every writer and checker prompt reads `frames-small/` (1920-wide copies of the kept frames), but `learn.mjs align` only wrote the full-size `frames/`. On the first video they were made by hand; on the second the orchestrator noticed only because the folder was missing.
- **Rule.** `align`'s frames step now writes `frames-small/` too and fails if any is missing (test in `tests/learn.test.mjs`).

### 17. A percent typed into a 0 to 255 control (second video, 09 and 05, 2026-11-15)
- **What happened.** 09's builder set Drop Shadow Opacity to 19 believing it took percent; it renders at 7.5 %, so the title's shadow is far weaker than the recipe's. 05's builder set 50 on its first run and got a halo too faint to see, then found the control reads 0 to 255 by script.
- **Rule.** `prove-run.md` ("What earlier builds learned"): convert percent to the 0 to 255 scale and read the value back. 09 rebuilt with the corrected value.

### 18. A direction and an orientation that passed the check, built the wrong way (second video, 02 and 11, 2026-11-15)
- **What happened.** 02's recipe said the shadow sweeps in from the lower left towards the upper right; the reviewer measured upper left to lower right two ways (the build, following the shown angle, went the right way despite the words). 11's recipe said the plates turn "with their right side towards the camera"; the builder put the right edge nearest, the tutorial has the left edge nearest (pills 139 px tall at the left end against 120 at the right; a frame shows Y −64°), so the cards stopped overlapping and the focus fell on the wrong side. Both had passed check 10.
- **Why.** Lesson 5's rule asks for direction from frames, but a wipe's start corner and a turned plate's near edge were each read from one frame and a phrase that reads both ways.
- **Rule.** `distil.md`: a reveal names the corner it reaches first and last, checked on a half-way frame; a turned object names its nearer edge from a measurement. `check.md` check 10 confirms both the same way. Recipes 02 and 11 corrected and re-checked; proofs 02 and 11 rebuilt.

### 19. A figure measured mid-drag, on a picture that lagged its readout (second video, 11, 2026-11-16)
- **What happened.** Recipe 11 gave the camera move as a 6 % widening of the front face, measured from a frame showing camera Position X 1325.2. The tutorial never plays the move: the author drags with the orbit tool and the video cuts mid-drag, so 1325.2 is a value passed through, and the viewer (redrawing every 4 to 5 frames, 3 to 5 frames behind the readout) showed an earlier camera. Measured at that camera, two ways, the face widens 44 to 50 %; the proof build gave 42 %, which a review had called too much.
- **Rule.** `distil.md`: a value read during a drag is not a key; measure the picture only where the readout has held still, and say when a move is never played. Recipe 11 corrected and re-checked.

### 20. Recipes written before the lessons, re-checked (backlog of four videos, 39 recipes, 2026-11-16)
- **What happened.** All 39 had passed a check on 2026-11-14. Re-checked fresh under today's rules, 36 of 39 failed. Most failures were the old lessons at work (a recipe leaning on another by id without its figures, lesson 1; sizes read mid-drag, lesson 19; directions written from words, lessons 5 and 18), but four were new.
- **A recording that plays fast.** One preview in a video played 3.3 to 3.7 times real time (read from the viewer's time display) while others in the same video ran near real time; a speed timed against that stretch's own seconds would be three times too fast, and no one rate holds for a whole recording. Rule: speed comes from expressions, key spacing or the comp's time display (`distil.md`, "Speed from a screen recording"; `check.md` check 10).
- **"Animated" results that never move.** Two results were called animated or "playing" while the comp's time display held still; three recipes described motion ("slowly swells", "gently pulsing", "sways") that is never played. Rule: read the time display across the result window (`distil.md` result windows; `check.md` check 7); motion never played is said to be so, with what the settings imply (lesson 19).
- **A stale viewer frame named as the result.** A gold-text result frame was pixel-identical to a frame from before the last setting; once the viewer redrew, the sides looked whiter, not more golden. Rule: confirm the viewer has redrawn after the last change (`distil.md`; `check.md` check 7).
- **Sizes measured on the wrong ruler.** A checker turned the viewer's zoom percentage into pixels while the recording itself zoomed (a card read 600 px wide was about 1100); a writer measured circles against the viewer's guide lines instead of the comp's width (15 % too large). Rule: calibrate each frame on the comp's own visible edges (`distil.md` "No sizes"; `check.md` check 9).
- **Merge lines that read the parent too strongly.** Written with both recipes open (lesson 14's rule), 5 of 11 merge lines were still refused: each turned something the parent marks `inferred`, `unknown` or "from a proof build" into a plain fact about the parent. Rule: `merge.md` step 3 now says an inferred or unknown parent claim stays so in the `differs:` line.
- **A camera move nobody named.** A ring of cards was seen through the default view dollied by hand (the centre card 27 % of the width; the steps give 19 %). And "Set Focus Distance to Layer" was named where the screen showed a linked, expression-driven focus. Rule: a default-view camera move is a step with a stand-in camera layer; a command off screen is named from its visible effect, `inferred` (`distil.md`).

### 21. Studies kept inside a worktree, and builds written over (owner, 2026-11-19)
- **What happened.** Study material (videos, frames, recipes, art, proof projects, renders, reviews) lived in each session's git-ignored `quality/renders/channel-study/`, where archiving the session deletes it; the backlog's first study had to be rescued into `~/Assets`. And each rebuild or re-review wrote over the last `build.*` and `review.md`, so the failures that taught the lessons were lost.
- **Rule.** Every study is stored, failures included. `learn.mjs link <worktree>` points `quality/renders/channel-study` at `~/Assets/comp-room-studies/channel-study` (test in `tests/learn.test.mjs`; it refuses a real folder or a link elsewhere); `video-lead.md` runs it first and `AGENTS.md` says where studies live. `prove-run.md` step 3 and `prove-review.md` rename the earlier build, before frame, side-by-side and review to `-first`, `-second`, ... instead of overwriting, and build notes gain a section per run.

### 22. The art brief bent the technique's layout (backlog, il_OcNyqDOE 03, 08, 10, 2026-11-19)
- **What happened.** Lesson 12 tells builders the art bends, not the technique, but the bend moved upstream: an art director, planning our scene, shrank recipe 03's near branches (1.9 to 1.25 times their flat size) and grass (1.45 to 1.0) so they would not cover our lantern and ledge. The builder followed the brief, so 03, 08 and 10 lost the large framing leaves that make the depth read. A builder in 8oVLS0ZlKC4 05 did the same with our title, opening the end frame 1.5 times to fit it.
- **Rule.** `art.md` rule 2: never change the recipe's layout figures to fit the art; move or re-make the art. Reviewers already flag it (lesson 12); the art was re-laid (a free-standing lamp, a smaller wall) and the near layers put back at the recipe's sizes.

### 23. A hand step that does not exist in this After Effects (backlog, eoBEBx1PbS4 01, 2026-11-19)
- **What happened.** The recipe's material steps (Material Assignment > Add Override > All, then a Substance material in the Material dropdown) were written from the tutorial's screen. The builder found they cannot be scripted and sent the owner the clicks; with the 3D text layer selected, the owner's Properties panel showed Layer Transform, Text, Paragraph and Text Animation and no Material section. The step could not be done by hand either, so the proof was built on a scripted stand-in (the art's tile on the faces), on the owner's decision.
- **Rule.** Before sending the owner a hand step, the builder checks by script that the panel or property it names exists on this After Effects (read the layer's property groups), and says so in the request. The recipe records where the step was unavailable (build notes, 2026-11-19).

## Still open
- The 24 "matches" on the first video were given before the look line existed.
- Nothing yet tests the prompts themselves. A cheap test: keep technique 11's first recipe as a fixture and confirm a fresh checker fails it on check 8.

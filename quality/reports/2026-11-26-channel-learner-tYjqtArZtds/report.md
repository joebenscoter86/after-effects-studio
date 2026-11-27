# Channel learner: tYjqtArZtds (Zuyns, How to Animate Notifications Like Apple)

Explainer cookbook piece 11 (`product/explainer-cookbook-plan.md`), picked 2026-11-26 for introduce-tool, with flag-a-problem and fail-then-fix as support. Run 2026-11-26 on branch `adobe/amazing-gauss-e6be2e`, started from `public/main` at 930230b (piece 4's merge). The study data (video, frames, timeline, recipes, checks, art, proofs, renders) is git-ignored under `quality/renders/channel-study/tYjqtArZtds/`, which links to `~/Assets/comp-room-studies/channel-study/`. Credits: `product/arsenal-drafts/CREDITS.md`.

## Gather and align

- 8 min 55 s, 1920 × 1080 at 30 fps, thirteen chapters (intro, composition, shape, depth and stroke, adjustment layer and blur, nulls, logo and text, bounce, expression on all nulls, stagger, second notification, first one reacts, final result).
- Words from whisper; they agree 97.4 % with YouTube's automatic captions. 24 sentences (whisper gave long unpunctuated ones), 553 frames kept and all read. No bot check.
- A fresh worktree has no OCR helper, so the first align stopped at its text step with exit 1 and no message on screen; the reason was only in `state.json`. Building it (`tools/channel-learner/ocr/build.sh`) and running align again fixed it.
- **The expression.** The description's "Assets Link" is a Google Doc whose whole text is the bounce expression. It was fetched as plain text and copied word for word into `extras.md`, with the narration's pointers to it (lesson 36). It is the same text, with the same values (amp .04, freq 1.8, decay 3, time_max 3), as the "Bounce" expression in tYRvoI04pJk's pinned comment, apart from line breaks and one comment line.
- The description names the font, SF Pro, and says no plugins are needed.

## Techniques and their spans

- The listing found five techniques: frosted card, null grouping, bounce drop-in, stagger, and a second card with push-back.
- **Lesson 50.** Its spans cut three things out:
  - the card's own build: the 1350-wide shape and its roundness, 21–84 s;
  - "now do the same to every remaining null", 353–378 s;
  - the final result, 522–535 s.
- The lead stopped the runner after one writer had started (about a minute), widened the spans and kept the first list as `techniques-first.json`.
- The runner now ends the techniques line with `speech in no span` and each stretch of narration no span covers. `techniques.md` says the object a technique works on, and its full application, belong in its span, and `video-lead.md` lists first and widens spans before any writer starts.

## Recipes

All five were written and none is held. The first write, check and fix rounds cost $6.18.

| # | Technique | Checks | Catalog |
|---|---|---|---|
| 01 | Frosted-glass card from three stacked shape layers (adjustment layer with Fast Box Blur, a 5 % depth copy, a 4 px outline copy) | passed round 3; round 5 after its proof review | variant of 201iywIy74c #05 (glass bar); add-depth (finish-the-look) |
| 02 | Nulls for the card, logo and text under one main null | passed round 2; round 3 after its proof review | new build aid |
| 03 | Two-key drop-in that settles with the description's bounce expression on Position and Scale | passed round 3; round 7 in all (lesson 51 and two proof-review fixes) | variant of nHh0NRo8G2U #03; add-impact (introduce-tool) |
| 04 | Logo and text staggered 2 and 4 frames behind the card | passed round 3; round 5 after lesson 51 | variant of Tf0EiCGOEYs #05 (staggered slide-in); reveal-headline (add-impact) |
| 05 | A second card lands 15–20 frames later while the first sinks and shrinks behind it | passed round 2; round 3 after lesson 51 | new; list-items (add-depth, add-impact) |

- **What the first checks caught.**
  - 03 and 04 named still frames for moves, which lesson 45 refuses. The checker found a played drop at about 294 s.
  - The card's size: the screen settles on 1350 × 315, though the narrator says 350.
  - 01's ground is the comp's Background Color, not a layer.
  - 04 gave a logo offset that measured half the frame's.
- **Matching.** Five fresh Sonnet agents matched one recipe each. Each wrote its tags to `tags/<n>.json` and `tags/<n>-levels.json`, and the lead merged them into `product/arsenal-drafts/tags.json` and `levels.json`. Changed-lines checks confirmed the three variants' merge lines.
- **introduce-tool.** 03 carries it as a support job. `find introduce-tool` returns a recipe that only supports the job (match tier 1), and a variant whose parent does not serve the job comes up on its own. So once 03 is proven, the job stops coming back empty. No recipe takes it as its primary job: the tagger read 03's own beat as the drop and settle, with the app's mark and name riding on it.
- **Lesson 51.** 03, 04 and 05 named the description's expression by its values only ("exactly the description's"). The build scripts are written from the recipe alone and rebuilt the expression, and 04's lost the `easeOut` factor; the lead caught it reading the scripts before the first build.
  - `distil.md` now quotes such code word for word in a fenced block, and `check.md` item 12 compares it with `extras.md`.
  - The three recipes went back through lead checks and now quote it, and the three scripts take that exact text as a noted lead correction.
  - The changed-lines checks of 03 and 04 wrote `merge: confirmed` as a bullet, which `assemble.mjs` refused. The check's output form now shows the line on its own, and assemble accepts the bulleted form too.

## Proofs (9:16, generated art)

- **Lead notes.** The owner's requirements reached the art, script and build runs through `proof/lead-notes.md`, which the runner now names to those runs (reviews are not told). They set:
  - **One invented app, Larkvault** (no app by that name turned up in a search). Its icon, a white bird folded into a shield on an indigo squircle, was generated once (gpt_image_2_6, job 4cc384f0) and cut out locally.
  - **One pale lock-screen wallpaper** (seedream_v4_5, job 938f7e58), so the frosted blur has something to soften. The tutorial's ground is flat near-white.
  - **Inter Tight** (installed) standing in for SF Pro.
  - **The words on each card.**
  - **05's first card as a warning**: a red "Backup failed" title and a red "!" badge on the logo, then "Backup complete" landing over it.
  - The art runs made no further images. 04 and 05 graded their own copy of the wallpaper, darker and lighter, so the card and text read.
- **Spend.** Four Higgsfield images were made in all (two candidates each for the icon and the wallpaper). $19.82 of the video's $40 was spent across 78 runs.

| # | Builds | Reviews | Notes |
|---|---|---|---|
| 01 | 2 | partly, then matches | the recipe said Roundness 110 makes full half-circle ends; the review measured rounded corners with a straight side (corner radius about 0.33 of the height, the side straight for 35 %). Fixed in the recipe; every card rebuilt at Roundness 79 (110 × 0.72) |
| 02 | 2 | cannot be judged, then matches | a parenting rig shows nothing in a still; the rebuild moves the main null, then each group null, and the card's parts follow. 02's layout line also called the card a half-height pill, now corrected |
| 03 | 3 | cannot be judged, partly, matches | the first reference was the keys-only drop the author played before pasting the expression. The bounce plays in the preview loop at 315.1–316.2 s, with only the card null keyed: logo and text stand, the card keeps its size. The recipe now says so; `build.mov` renders that stage like for like and `build-full.mov` the whole technique (the phone file) |
| 04 | 2 | matches, matches | rebuilt only for the shared corner shape |
| 05 | 2 | matches, matches | rebuilt only for the shared corner shape; the warning-then-fix reads before the words are read |

- **Phone files.** `proof/phone/notif-01.mp4` to `notif-05.mp4`, 1080 × 1920 at 30 fps, 4–6 s:
  - 01 is the bare wallpaper, then the card;
  - 03 is `build-full.mov`;
  - 04 is its 2-second movie played twice.
  - They were sent to Joe on 2026-11-26.
- **Scripts.** The build scripts are in `tools/channel-learner/proofs/tYjqtArZtds`, with earlier copies kept under labels and no home-folder paths.
- **Lesson 52.** After 02's lead check, two check runs in a row printed a complete passing check as their last message and wrote no file, and assemble refused 02. A third run wrote it. The runner now saves a printed check for its own recipe (`savePrintedCheck`).

## Acceptance

- **Accepted.** Joe accepted all five on 2026-11-26 ("accept"). In each recipe only the status line changed, to proven, and each `checks/<n>.md` has a note saying so. Copies of the recipes from before acceptance are in the study's `scratch/lead/pre-accept/`. The draft now reads 5 recipes, 5 proven.
- **Stills.** The five `proof/<n>/build.png` stills are in `product/arsenal-drafts/proof-stills.json`. 02 is a build aid, so the arsenal shows no still for it, which leaves four new stills. 01's still is the bare card, as its recipe's result says; 03's is the card-only stage.
- **Catalog.** After the rebuild the arsenal holds 124 recipes and 151 stills, and no still is missing. `find introduce-tool` (proven only) returns 03 as a support recipe, next to the paper piece `piece-picture-face`, so the job is no longer empty. No recipe takes it as its primary job. flag-a-problem and fail-then-fix gained no technique: 05's proof plays a warning and its fix, but its tags stay list-items with add-depth and add-impact as matched, since the proposed retag was not taken up.
- **Rebuild.** `node tools/channel-learner/arsenal.mjs`, `npm ci --ignore-scripts` in `plugin/runtime`, `node plugin/scripts/build.mjs`, then `node release/build-claude-package.mjs` (425 files). In a fresh worktree `build.mjs` stops with `ERR_MODULE_NOT_FOUND` for esbuild until `npm ci` has run. The repo README already gives that order; the brief listed the two steps the other way round.
- **Tests.** After the rebuild, every suite passes:
  - learner, 227 of 227;
  - release, 125 of 125;
  - runtime offline (`npm run test:offline`), 100 files, with 1702 tests passed and 117 skipped (the After Effects opt-ins).
  The runtime bundle in `plugin/runtime/dist` is unchanged.

## Open

- 03's ring is a little livelier than the tutorial's. First peak: 9.1 % of the card's height against 7.8 %. Back-swing: 3.5 % against 4.9 %. The build shows a small second crest, which the tutorial does not. The review says nothing needs fixing. It suggests the tutorial's on-screen values may differ from the description's text, which is quoted as given.
- 04's wallpaper is graded darker than the others, so its card reads dimmer at phone size.
- flag-a-problem and fail-then-fix are still empty. 05's proof shows the warning-then-fix beat, and a retag of 05 to support them was proposed but not taken up. A recipe whose own job is the warning, or the later worked scene the plan describes (a problem marked, the change, the fixed state), would fill them.
- A stray test run: while writing lesson 50's test, the lead called the runner with the arguments in the wrong order, and one real listing run (a few cents) ran against a temporary folder. The test now uses the fake as intended.

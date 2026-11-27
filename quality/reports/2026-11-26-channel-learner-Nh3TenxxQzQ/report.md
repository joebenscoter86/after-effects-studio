# Channel learner: Nh3TenxxQzQ (Motion Nations, This LOGO Animation Method is so POWERFUL)

Explainer cookbook piece 12 (`product/explainer-cookbook-plan.md`), picked 2026-11-26 for introduce-tool. Run on 2026-11-26 on branch `adobe/piece-12-logo-reveal`, started from `public/main` at a88b1c9.

The study data is git-ignored under `quality/renders/channel-study/Nh3TenxxQzQ/`, which links to `~/Assets/comp-room-studies/channel-study/`. It holds the video, frames, timeline, recipes, checks, art, proofs and renders. Credits are in `product/arsenal-drafts/CREDITS.md`.

## Gather and align

- **The video.** 11 min 45 s at 60 fps, in seven chapters: introduction, applying the preset, creating the outline, adding glow and animation, logo reveal and composite, procedural customization, and saving the preset.
- **Words and frames.** The words come from whisper, which agrees 96.1 % with YouTube's automatic captions. The timeline has 58 sentences and 988 kept frames. The description has no expression or settings to copy, so the study has no `extras.md`.
- **Lesson 53.** The first gather fetched the video's details, then stopped at the video step with exit 1. yt-dlp reported `HTTP Error 403: Forbidden`; this was not the bot check. The same command a minute later fetched everything, and the rest ran clean. `learn.mjs` now fetches a 403'd video once more before the step fails.
- **Second source.** Fx Studio's shorter take on the effect (lRyUAE5r6MA) was not needed: the recipes did not come out thin.

## Techniques and their spans

- **The listing.** It found seven techniques, and its `speech in no span` covered only the intro and the outro.
- **The lead widened one span and dropped one technique.** The first list is kept as `techniques-first.json`.
  - 05 ended at 556 s. That is before the scale-down and the final result, "our final logo reveal just like that", at 9:20–9:43. Its span now runs to 583 s.
  - 07 was saving and applying the effect as an animation preset, at 10:23–11:10. The plan counts that a build aid at most, and the preset itself is sold on Patreon. It was dropped. 06's span (583–623 s) keeps the procedural swap the preset exists for.

## Recipes

All six were written and none is held. Writing, checking and fixing cost $11.60 in all: distil $5.78 and check $5.82, the checks including the lead's checks after proof reviews.

| # | Technique | Checks | Catalog |
|---|---|---|---|
| 01 | Edge-only light outline from a solid logo: Fill black, CC Light Sweep at Sweep Intensity 0 | round 3 | variant of tYRvoI04pJk #04; light-the-hero (introduce-tool) |
| 02 | Three coloured edge sweeps that spin in and meet at one angle | round 4 | variant of tYRvoI04pJk #04; introduce-tool (light-the-hero, add-impact) |
| 03 | Four stacked Glows (radii 50, 165, 480, 1000) blooming the outline | round 8 | variant of YBeMmC43Q1U #20; light-the-hero (finish-the-look) |
| 04 | Animated sweep width: the outline starts hidden, brightens and spreads | round 7 | variant of tYRvoI04pJk #04; introduce-tool (light-the-hero, add-impact) |
| 05 | The solid logo fading in over the glowing outline with CC Composite, under one hot flare and a small scale-down | round 5 | new; introduce-tool (add-impact, light-the-hero) |
| 06 | Swapping the logo or a word inside the finished setup | round 2 | new; introduce-tool (light-the-hero) |

**Matching.** Six fresh agents matched one recipe each against the catalog, using `scratch/lead/match-brief.md`. That brief carried the plan's framing: a recipe whose own result is the mark arriving takes introduce-tool as its main job. Each agent wrote its tags to `tags/<n>.json` and `tags/<n>-levels.json`, and the lead merged them into `product/arsenal-drafts/tags.json` and `levels.json`.

- **01 and 03 are light-the-hero.** 01's result is a still rim, and 03's is a bloom. Each is one part of the look, so neither takes introduce-tool as its main job; 01 supports it, as lesson 43 allows a variant.
- **Groups.** The CC Light Sweep recipes form the group "edge light sweep", and 03 joins "double glow".

**Lesson 54.** 04's merge check was a changed-lines round. It re-checked the round-3 fix and wrote no `merge:` line, so `assemble.mjs` could not take 04 as a variant. A lead note on the check named the merge lines, and the next round confirmed them.

- 01's and 03's merges were confirmed at the first try.
- 02's merge was refused, rightly: its `differs:` line stated the parent's inferred purpose as fact. After a distil fix, the next round confirmed it.
- The runner now tells a check about unconfirmed merge lines.

## Proofs (9:16, generated art)

**Lead notes.** The owner's requirements reached the art, script and build runs through `proof/lead-notes.md`. They set:

- **One invented tool, Lumenfold**, a video-editing app. A search found no product by that name.
- **A lockup** of the mark over the name, set in Montserrat SemiBold. It fills the tall frame's width as the tutorial's logo fills its frame's height. Pixel values from the recipes scale by the mark's height.
- **The name alone for 06**, set in Montserrat Black (see lesson 57's addendum).
- **The colours**: fully saturated magenta, violet and amber where a recipe names a colour only by word.

**The shared art.** The lead generated the mark and the ground once, for all six proofs.

- **First set.** The first mark had three folded bands round a play triangle (gpt_image_2_6, job 32a5a807). The first ground was a navy plate, centre about 32/34/69 (flux_2, job 438c70bd). 01 and 02 matched on them; 03 to 06 came back "partly" twice.
- **Lesson 57.** The angular mark lit in short pieces that the Glows turned into blobs, and the navy read as haze. The lead made a second mark of long smooth curves: a droplet with a curled tip, a notch and a play-triangle opening (gpt_image_2_6, job 4925b50a, one of three candidates, alpha hardened at 250). The lead also graded the ground to 0.18 of its level (centre about 6/6/12) and rebuilt all six, so the set shows one tool.
- **The art runs** wrote briefs and graded their own copies of the ground. They generated nothing.

**The lead's tests in After Effects.** All were done on scratch comps, which were deleted afterwards.

- **CC Composite.** A fresh effect reads Composite Original 3, and 3 is In front. Its Opacity fades the original in correctly (5 %, 50 % and 100 % white at 0, 50 and 100).
- **Glow Threshold.** By script it takes 0 to 255, units "percent".
- **The tutorial's Glow stack.** On a 4 px white ring 600 px across, it gives 50 % at 20 px out, 31 % at 40, 19 % at 80 and 10 % at 160.
- **Bit depth.** The tutorial's project is 16 bpc, but 8 and 16 bpc rendered 04 the same. The project was put back to 8 bpc.

**Builds and reviews:**

| # | Builds | Last review | Notes |
|---|---|---|---|
| 01 | 2 | matches | matched on the first mark too; rebuilt on the second so the set shows one tool |
| 02 | 2 | matches | the same |
| 03 | 5 | partly ("close") | its builds hit three problems: Threshold 24, which is 9.4 % (lesson 56); the first art (lesson 57); and Glow Colors left at its default (lesson 55's addendum). The last build's Glow stack reads back right: one unbroken lit stretch on a black ground, with each colour blooming in its own colour. Its line runs 76 % magenta against the tutorial's 30 %, so the white haze is about half as strong |
| 04 | 3 | matches | the third builder found Glow Colors: a fresh Glow reads 2, which renders A & B Colors, so every halo had been grey-white. Original Colors is 1 |
| 05 | 4 | matches | the first builder set Composite Original 1, saw the original cover everything, and swapped the recipe's mechanism (lesson 55). The flare, the halo falloff and the fade-out agree. The outline phase's haze is about 3× too strong, an optional fix |
| 06 | 3 | partly | the swap and the clean rest state match, with the stack carried over unchanged. But while tracing, the word sits 3–4× brighter than its rest, against the tutorial's 1.2×, and the thin outlines are lost |

**Phone files.** `proof/phone/logo-01.mp4` to `logo-06.mp4` are 1080 × 1920 at 30 fps, 5–6 s each. 03 is a before → build crossfade, since its technique is a still finish. `logo-01-first.mp4` and `logo-02-first.mp4` are the builds on the first mark. All six were sent to Joe on 2026-11-26.

**Scripts.** The build scripts are in `tools/channel-learner/proofs/Nh3TenxxQzQ`. Earlier copies are kept under labels, and no script contains a home-folder path.

**Lessons 55 and 56** came from these builds. Both rules are in `prove-run.md` ("What earlier builds learned"):

- read or test an effect menu's number for the label the recipe names (CC Composite, Glow Colors);
- Glow Threshold takes 0–255 by script (24 % is 61.2).

## Spend

$38.22 of the video's $40 was spent across 104 runs:

| Stage | Cost | Runs |
|---|---|---|
| techniques | $0.07 | 1 |
| distil | $5.78 | 24 |
| check | $5.82 | 29 |
| art | $1.47 | 6 |
| prove-author | $1.24 | 6 |
| prove-run | $15.86 | 19 |
| prove-review | $7.98 | 19 |

- The 12 "failed" checks are checks whose verdict was fail, which sent recipe gaps back to writers.
- The 13 "failed" reviews are reviews that did not end "matches".
- The lead stopped the runner once, mid-05, to save budget after Glow Colors was found. No dialog was open and the project was saved.
- No further fix round fit the budget, so 03 and 06 went to Joe as they are.

## Acceptance

- **Accepted.** Joe accepted all six on 2026-11-26 ("Accept all six"). In each recipe only the status line changed, to proven. For 03 and 06, that line also says what the last review found. Each `checks/<n>.md` has a note saying so. Copies of the recipes and checks from before acceptance are in the study's `scratch/lead/pre-accept/`. The draft now reads 6 recipes, 6 proven.
- **Stills.** The six `proof/<n>/build.png` stills are in `product/arsenal-drafts/proof-stills.json`. Each is the moment its review compared with the tutorial.
- **Catalog.** After the rebuild the arsenal holds 130 recipes and 157 stills, and no still is missing. Asked for introduce-tool, the current `findTechniques` returns these, all proven:
  - the paper piece `piece-picture-face`;
  - 02, 04, 05 and 06 as main recipes, with 02 and 04 "found here on its own", since their parent does not serve the job;
  - 03-expression-bounce-drop-in (piece 11) and 01 as support recipes.
- **Rebuild.** In order:
  1. `node tools/channel-learner/arsenal.mjs`
  2. `npm ci --ignore-scripts` in `plugin/runtime`
  3. `node plugin/scripts/build.mjs`
  4. `node release/build-claude-package.mjs` (431 files)

  The runtime bundle in `plugin/runtime/dist` is unchanged.
- **Tests.** After the rebuild, every suite passes:
  - learner, 232 of 232;
  - release, 125 of 125;
  - runtime offline (`npm run test:offline`): all 100 test files pass, with 1702 tests passed and 117 skipped (the After Effects opt-ins).

## Lessons from this run

- **53.** gather fetches a 403'd video once more (`learn.mjs`).
- **54.** The runner tells a check about unconfirmed merge lines (`run-stage.mjs`).
- **55.** An effect menu is set to the number that gives the recipe's label, found by testing, and a setting that seems not to work is tested alone before anything is substituted (`prove-run.md`). It names CC Composite and Glow Colors.
- **56.** Glow Threshold takes 0–255 by script (`prove-run.md`).
- **57.** Art that a light traces or blooms needs long smooth curves, type as heavy as the reference's, and a ground at the reference's level (`art.md` rule 2). The lead's own shared art meets that rule (`video-lead.md` step 6).

Each lesson is in `tools/channel-learner/LESSONS.md`, with a test in the learner suite.

## Open

- **03's colour split.** The line going into the Glows is mostly magenta, where the tutorial's is a hot white crescent with a short magenta curl. The review's target is to light the long stretch white with row peaks of 240 or more, and keep magenta to about 30 % of lit pixels. The recipe lists the sweep colours and widths that give this under unknowns.
- **06's trace phase.** The fix the review points at is in the shared stack, not the swap: what the sweeps light on a heavy word. Render with the Glows off and narrow the sweeps to edge slivers before touching the Glows.
- **05's outline haze.** It is about 3× the tutorial's at 3/8 and 5/8 of the clip, an optional fix. The lever is the rims' brightness, not the Glow threshold.
- **A stale compiled file.** `plugin/runtime/dist/tools/arsenal.js` is tracked but stale. It predates the variant rule (no `standOnTheirOwn`) and gives a wrong answer for introduce-tool if imported directly. The plugin runs the bundled `dist/index.js`, which `build.mjs` builds from source, so users are not affected.

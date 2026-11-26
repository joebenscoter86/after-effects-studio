# Channel learner: 201iywIy74c (five editing ideas)

Run 2026-11-25, branch `adobe/youtube-learner-session-4a7a8e` from main at 4470b2d. This is the first video taken through every stage of `run-stage.mjs`, proofs included. The study data (video, frames, timeline, recipes, checks, art, proofs, renders) is git-ignored under `quality/renders/channel-study/201iywIy74c/`, which links to `~/Assets/comp-room-studies/channel-study/`. Credits: `product/arsenal-drafts/CREDITS.md`.

## Gather and align

- 16 min 26 s, 3840 × 2160 at 29.97 fps, no chapters. The words come from whisper and agree 98.4 % with YouTube's automatic captions. 29,558 frames were measured and 1,178 kept and read; the timeline has 271 sentences. No bot check.
- Technique 01's expression appears only in the author's pinned comment, which was copied word for word into `extras.md` (lesson 36).

## Recipes

| # | Technique | Checks | Catalog |
|---|---|---|---|
| 01 | Bounce mix: word drops in with an inertial-bounce expression, shaped speed graph, word swap with a one-frame offset | passed round 5; merge check round 7; spacing rule round 8 | variant of nHh0NRo8G2U #03 (step icons pop with a bounce), group time stagger |
| 02 | Hypnotic background: gradient circle, Repeater of 10, the Repeater's scale and rotation keyed | passed round 3 | new; fill-the-backdrop; group duplicate-and-step ring |
| 03 | Minimal shadow: black Fill copy, CC Radial Fast Blur (85), 35 % opacity | passed round 3; merge round 4 | variant of YBeMmC43Q1U #12 (long soft shadow), group radial-blur shadow |
| 04 | Echo handwriting: five hand-drawn strokes, Trim Paths Individually draw-on and draw-off, Echo, Deep Glow | passed round 6 | new; reveal-headline; group trim paths draw-on |
| 05 | Glass bar: rotating, blurred, wave-warped star gradient seen through a displacement-map glass pill | passed round 3; placement line round 4 | new; fill-the-backdrop; new group frosted-glass refraction |

None is held. 01 and 04 were held after round 3, each on one small point (a key order marked as narrated; a cursor inside the result crop), and were brought back. Their re-checks reopened lines that had already passed, which led to lesson 37. The checks also caught a wrong handle speed, a second duplicate left out, a draw order reversed, Size keys misread (321, not 56), a false Wave Warp type and a product name in a merge line.

## Proofs (9:16, generated art)

| # | Builds | Review | Notes |
|---|---|---|---|
| 01 | 2 | matches | first build copied the author's word X values; the recipe now gives the rule (ink gap about 0.36 of the type size, line centred) |
| 02 | 3 | matches | first build replaced the Repeater with ten masked solids to get the gradient colours (lesson 41); rebuilt as one shape with a Repeater, colours by Tint; second review on the overshoot fixed |
| 03 | 1 | matches | within 1.5 grey levels |
| 04 | 2 | matches | Deep Glow 2 (installed); stroke rescaled to our word |
| 05 | 3 | partly (close) | mechanism right and placement fixed; the colour crosses the pill in bands where the tutorial's is one sweep, the gold lower-left rim crescent is missing and amber is thin. These depend on the star's angle at the frame and on the CC Toner stand-in for four gradient stops |

The lead looked at every pair before sending them. The phone files are `proof/phone/bv-01.mp4` … `bv-05.mp4`, with `bv-03.png` because 03 is a still. They were sent to Joe at about 15:33 PST.

**Joe accepted all five on 2026-11-25 ("Accept all five").** In each recipe only the status line changed (diffed against the checked copy). 05's line also records that the look review said partly (close) and that he accepted it as it is. Each check file has a note recording the acceptance. The draft now reads 5 recipes, 5 proven.

Before the proofs, After Effects was stopped at launch by its crash-recovery question ("Fog 3D may have caused After Effects to quit"); Joe chose Keep enabled.

## Cost

$23.63 of the $40 video budget (Claude Code's count). By stage: techniques $0.07, writers $3.50, checks $5.70, art $2.59, script authors $0.80, builds $6.74, reviews $4.23. Higgsfield used about 3 credits. Four art runs failed at no image cost (lesson 39).

## What the learner learned (lessons 36–42, each with its rule or test)

36 material given only in a pinned comment; 37 re-checks after round 2 look at changed lines only; 38 a pipe in a credits title, the `levels.json` record, and 9:16 in the prompts; 39 the headless name of the Higgsfield connector; 40 art never replaces a layer the technique builds; 41 keep the technique's structure when a value cannot be scripted (gradient colours by Tint or CC Toner); 42 rebuilds are told their review and their own script. Learner tests: 217 pass.

## Cookbook and package

- `proof-stills.json` gains the five proof renders. `arsenal.mjs` rebuilt the cookbook as catalog `3829f9f5` (main had `48668ceb`): 160 entries (155 before), 134 stills, 106 recipes. The new stills were cut from our own proof renders. No new entry fills an empty job: 01 and 04 serve reveal-headline, 02 and 05 fill-the-backdrop, and 03 serves add-depth.
- The shipped status line reads `proven (accepted 2026-11-25)`, and the shipped text names no one.
- The Claude package was rebuilt (408 files in `claude/comp-room`).
- Tests at that point: learner 217/217, release 125/125, runtime cookbook 72/72.
## Catalog check (Joe asked for every recipe to be checked against the current schema)

- **Every recipe's fields are complete.** All 106 recipes have the fields the schema asks for: a tag (kind, job, support, mood, needs, duration, motion, difficulty, group), a `levels.json` record with `provides` and renderer, and a still for every proven technique. There are no duplicate ids. The only gaps are five build aids with empty `provides`; build aids serve no beat, so that stays.
- **Variants could not be found for their own beats (lesson 43).** Every search put a variant behind its parent. 15 of the 16 variants serve a job or `provides` word their parent lacks, so a search for that job or word could not reach them. Examples:
  - 01 here (a title bounce) for reveal-headline;
  - 02-button-soft-lift-shadow for call-to-action;
  - 08-raised-white-shapes-with-long-shadows for reveal-headline.
- **The fix.** A variant now stands on its own wherever its parent does not answer the ask, and names its parent. The change is in the plugin's find and browse and in the dev mirror. A new test on the shipped catalog finds every variant for each of its jobs.
- **The merge catalog had fallen behind.** `product/arsenal-drafts/catalog.json`, which the merge step reads, still held 86 recipes. It now holds all 106, and `arsenal.mjs` rewrites it on every run.
- The runtime bundle (`plugin/runtime/dist/index.js`) and the Claude package were rebuilt.
- Tests: learner 218/218, release 125/125, runtime offline 1702 passed (117 skipped).

## Open

- 05: if Joe wants it closer, the review's targets are the star's angle at the frame (a rotation offset), a wider amber band, and the gradient's start and end points, which the video does not give.
- The plugin has no operation to set gradient stops (added to `product/deferred-after-0.4.2.md`, item 6).

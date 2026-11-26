# Channel learner: tYRvoI04pJk (TomsProject, SaaS Motion Graphics Masterclass)

Explainer cookbook piece 4 (`product/explainer-cookbook-plan.md`). Run 2026-11-25 to 2026-11-26 on branch `adobe/bold-darwin-7736f1`, which carries main's PR 45 merge on top of 4470b2d. The study data (video, frames, timeline, recipes, checks, art, proofs, renders) is git-ignored under `quality/renders/channel-study/tYRvoI04pJk/`, which links to `~/Assets/comp-room-studies/channel-study/`. Credits: `product/arsenal-drafts/CREDITS.md`.

## Gather and align

- 52 min 29 s, 3840 × 2160 at 25 fps, seven chapters:
  - Intro
  - The Upload Button
  - The Bottleneck Graphic
  - Scaling & Duplicating the Workflow
  - The Notes App Interface
  - The Glowing Orb
  - Outro
- The words come from whisper and agree 95.9 % with YouTube's automatic captions. The timeline has 972 sentences, and 3,760 frames were kept and read. No bot check.
- The video's two expressions (bounce and bouncy text) are only in the author's pinned comment. They were copied word for word into `extras.md`, as lesson 36 says. 02 ships the bounce expression as given.
- The plan said to skip the orb chapter if it repeated the Hyper-Cinematic orb (`06-gradient-shapes-blur-noise-glow-posterize`). It was kept because it is built another way: wiggled shapes, spin Radial Blur and CC Sphere. The merge step found no parent for it.

## Recipes

All 13 were written. None is held.

| # | Technique | Checks | Catalog |
|---|---|---|---|
| 01 | Red gradient pill button swings up in 3D and settles | first passed round 3 | new; call-to-action (add-impact, add-depth) |
| 02 | Bounce expression pop-in, icon and letters | round 3; 9 check runs in all | variant of nHh0NRo8G2U #03; add-impact |
| 03 | Glowing gradient stroke draws on from the button | round 3; 6 runs | new; relate-things |
| 04 | CC Light Sweep edge light on dark buttons | round 5; 6 runs | new; light-the-hero (add-impact) |
| 05 | Duplicate and stagger the layout, glowing links | round 3; 11 runs | new; one-to-many (relate-things) |
| 06 | Reversed gradient overlay and lens finish | round 5; 6 runs | new; finish-the-look |
| 07 | Buttons slide together and morph into an app window | round 4; 5 runs | new; hand-over (one-to-many, show-real-screen) |
| 08 | Window dots pop in, soft grid panel | round 3; 4 runs | new; fill-the-backdrop (finish-the-look) |
| 09 | Typewriter that types, deletes and retypes | round 3; 5 runs | new; make-concrete (reveal-headline, keep-it-alive) |
| 10 | Liquid gradient orb: wiggled shapes, spin blur, CC Sphere | round 3; 12 runs | new; light-the-hero (keep-it-alive) |
| 11 | Orb scales up from a dot through linked nulls | round 1; 2 runs | new; hand-over (light-the-hero, add-impact) |
| 12 | Hollow ring from the orb: inverted matte and Echo | round 5; 8 runs | new; fill-the-backdrop (light-the-hero, add-impact) |
| 13 | Text fills in from a soft ghost, sharpens and creeps larger | round 5; 6 runs | variant of YBeMmC43Q1U #18; reveal-headline (keep-it-alive) |

- **Held, then revived.** 04, 06, 07, 12 and 13 were held after round 3:
  - 04, 06 and 07 each failed on one small point.
  - 12 and 13 failed on their result frame.

  The lead revived all five for one more fix and a changed-lines check, pointing 12 and 13 at the clean playback of the finished piece at about 28.5–30.9 s. All five passed. The reason is in the study's `drafts-held.md`.
- **Re-checks after proofs.** Check runs after a recipe's first pass are proof-review gaps sent back to its writer through a lead check, as lesson 44's route back describes. Each kept its passed check as `checks/<n>-before-proof[-label].md`.
- **05's check rounds.** They failed on cited measurements: a right-hand button measured at 72.2 % scale, and handle readings that mixed a 2560-wide scale with the 3840-wide frame.

## Proofs (9:16, generated art)

| # | Builds | Last review | Notes |
|---|---|---|---|
| 01 | 2 | matches | first build set the button at 89 % of the frame width against the layout line's 36.6 % |
| 02 | 4 | matches | first review "cannot be judged": the recipe named a still for a move (lesson 45) |
| 03 | 2 | matches | the curve was given as shares of a 16:9 frame and came out steep (lesson 44) |
| 04 | 2 | matches | outline brightness and colour added to the recipe |
| 05 | 5 | matches | Glow radii were in the tutorial comp's pixels, four times too wide on our buttons (lesson 44); matched once rebuilds measured their review's figures (lesson 47) |
| 06 | 2 | matches | the label needed 03's curves around it to read as a stall, not a caption |
| 07 | 2 | matches | corner radius read against the card, not the picture (lesson 44) |
| 08 | 2 | matches | Grid drew a full checkerboard; the reference has two horizontal lines |
| 09 | 2 | matches | the reference clip shows only the typed end state |
| 10 | 11 | partly | see below |
| 11 | 2 | matches | the orb's final size was taken mid-swell as a share of the 16:9 width (lesson 44) |
| 12 | 5 | matches | the orb's gradient sets the ring's bright side; matched on the fifth build (lesson 47) |
| 13 | 1 | matches | first build |

- **10 never matched.** Across eleven builds it met these:
  - the smeared texture;
  - the sphere's clockwise spin;
  - its lumpiness, 1.15–1.41 against 1.17–1.29;
  - its median body luma;
  - the blue outer rings;
  - the pure black ground.

  It never got the tutorial's broad, round cyan glow off the centre, the dark violet shadow on the right, or a blue rim that stays at the edge. The tutorial never shows what causes that rim, and the recipe now says so. A fresh script written from the recipe alone missed it too. The lead stopped there and asked Joe.
- **Phone files.** They are `proof/phone/saas-01.mp4` … `saas-13.mp4`, each made after its build's movie, and were sent to Joe.
- **On disk.** Each proof folder holds its current `build.png`, `build.mov` (1080 × 1920, 2–6 s) and every earlier build under its label.
- **Scripts.** The build scripts are in `tools/channel-learner/proofs/tYRvoI04pJk`.

**Joe accepted all 13 on 2026-11-26 ("approved").** He had been asked whether to accept all 13, or 12 with the orb kept unproven. In each recipe only the status line changed. 10's line also records that its look review said partly and that he accepted it as it is. Each check file has a note recording the acceptance. The draft now reads 13 recipes, 13 proven.

## Final proof: Comp Room in 19 seconds

Joe asked for one 15–20 s SaaS animation that combines all the recipes, "about yourself". It was built as a Comp Room promo:

1. Upload button
2. A glowing line stalls at "Keyframing…"
3. The Brief / Design / Animate / Render flow
4. The Comp Room window
5. A brief types itself and is rewritten
6. Its full stop swells into the orb
7. The orb becomes a ring around "Editable motion / from one brief. / Comp Room"

- **Files.** They are outside the repository, in `~/Assets/comp-room-tests/2026-11-26-saas-showcase/`:
  - `brief.md`;
  - the generated art;
  - the editable project, `saas-showcase.aep` (master comp `SaaS showcase`, 1080 × 1920, 30 fps, 570 frames);
  - the scripts and `build-notes.md`;
  - `renders/comp-room-saas-showcase-v3.mp4`, delivered with its check passed: 19.000 s, H.264, no sound.
- **How it was made.** A Sonnet builder agent made it from the brief, using the proven scripts as working code. A hook blocks Opus subagents in this repository.
- **Review.** The independent review (`comp-room:motion-reviewer`) found eight defects, among them:
  - a six-frame freeze before the dark-to-light flip;
  - a title that faded out;
  - an empty frame after the scroll.

  The second round fixed links that vanished in one frame, buttons that did not touch, and echoes that collapsed in the final hold. Each fix was checked on frames cut from the delivered movie.
- **Left.** "Comp Room" sits a little high in the ring. A missing-font flag for Myriad Pro is left: no text layer uses that font.
- **Not watched.** Nobody played the movie at full speed before Joe.

## Cost

The runner counted $85.30 against the $40 video budget:

| Stage | Cost |
|---|---|
| techniques | $0.11 |
| writers | $16.21 |
| checks | $15.03 |
| art | $3.61 |
| script authors | $2.44 |
| builds | $29.59 |
| reviews | $18.30 |

- **Budget.** Joe first raised the budget to about $70 ("Raise to $70"), then said "budget is no issue here. fix them" when 05, 10 and 12 needed more rebuilds. The runner ran on with `--budget-usd 200`.
- **Not counted.** The showcase's builder and reviewer agents ran outside the runner, so their cost is not in that figure.

## What the learner learned (lessons 44–49, each with its rule or test)

- **44.** Sizes that held only in the tutorial's 16:9 frame: parts are sized against their own object, and an effect value in pixels comes with the size it was set for. Proof-review gaps go back to writers through a lead check.
- **45.** A move proved on a still: a motion technique needs a played result window.
- **46.** The proof project was opened by its real path and refused. The runner now gives build runs PROOF's real path.
- **47.** Rebuilds judged by eye: a rebuild measures its review's `to fix` and `what matches` figures, targets against measured, for up to five rounds.
- **48.** Home folders written into the public scripts: paths come from `args` or `~/`, and a test scans `tools/channel-learner/proofs/`.
- **49.** The runner named a kept copy as a rebuild's script: labelled copies are passed over.

Learner tests: 223 pass.

## Cookbook and package

- **Stills.** `proof-stills.json` gains the 13 proof renders.
- **Catalog.** `arsenal.mjs` rebuilt the cookbook as catalog `50a3bb54` (this branch had `3829f9f5`): 173 entries (160 before), 147 stills, 119 recipes. The new stills were cut from our own proof renders. Each new entry is a proven technique with a still.
- **Jobs this piece filled.** It filled none of the three empty jobs it targeted.
  - **introduce-tool and flag-a-problem are still empty.** The upload button became a call-to-action recipe (01). The "bottleneck" chapter taught only the glowing line (03, relate-things), and nothing in it reads as a warning.
  - **make-concrete** gains 09, its second recipe after piece 3's pyramid.
  - **show-real-screen** gains 07 as a support job only.
- **Shipped text.** The shipped status line reads `proven (accepted 2026-11-26)`, and the shipped text names no one.
- **Package.** The plugin was rebuilt (`plugin/scripts/build.mjs`, 162 library documents) after `npm ci --ignore-scripts` in `plugin/runtime`. The build needs the runtime's packages, so `npm ci` has to come first. The Claude package was rebuilt: 421 files in `claude/comp-room`.
- **Tests.** Learner 223/223, release 125/125, runtime offline 1702 passed (117 skipped).

## Open

- **10's rim and glow.** The tutorial never shows what makes the blue rim. Closing it needs either that cause or a layout of shapes that gives one broad cyan glow off the centre.
- **The plan's forecast.** It said only before-after and fail-then-fix would be empty after pieces 1–4. That did not hold: pieces 7 and 9 are still needed for introduce-tool and flag-a-problem.

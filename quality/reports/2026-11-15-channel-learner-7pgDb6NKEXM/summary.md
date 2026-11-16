# Channel learner, second video (7pgDb6NKEXM): where it stands (2026-11-16)

## The short version

- **11 techniques learned from one tutorial, all 11 built in After Effects on our own designed art, reviewed against the tutorial, and proven: Joe accepted all 11 on 2026-11-16** ("i accept all 11"). 11 was marked after its camera move was re-measured and the build still matched. Phone MP4s of each and a 65 s reel (`proof/mobile/all-11-proofs.mp4`) were sent as they landed.
- **Two are variants** of the first video's techniques (03 of the text carousel, 08 of the white-on-light finish); the rest are new, two of them build aids. The catalog now holds 75 recipes.
- **The tool learned six more lessons (14 to 19)**, each as a prompt, check or code change in the same commit.
- **Nothing is pushed.** Branch `adobe/channel-learner-7pgdb6nkexm-2ccb81`, local commits only; the repository's only remote is public.

## For Joe to decide

Nothing. All 11 are proven; their stills (9; the two build aids ship none) are in the arsenal.

## Results

| # | Technique | Verdict | Notes |
|---|---|---|---|
| 01 | Window-shadow map over a title card | matches | angle 32.5 degrees in both, two ways; darkness 0.52 against 0.54 |
| 02 | Shadow map wiped on | matches (after fix) | half the shadow by 0.23 s, all by 0.63 s, as the tutorial; recipe's direction corrected |
| 03 | Graphics riding a spinning real object | matches | anticlockwise about 20 degrees a second, measured two ways; variant of the first video's carousel |
| 04 | Swap footage, keep the edits | matches | only the photo windows change; build aid |
| 05 | Soft doubled drop shadow | matches | halo within 0.01 to 0.03 of the tutorial's at each distance |
| 06 | Graphics behind a person (Object Matte) | matches | needed one click from Joe; our presenter is an easy matte (short hair), so wispy edges are untested |
| 07 | Key a poor green wall with a machine-learning keyer | matches (after rebuild) | clean cut-out, curls kept, shirt turns peach (R +8, G −16, B +8 against +10, −22, +10), skin unchanged; the stock-keyer first try is weaker evidence (our veil came only from a Screen Colour darker than our wall; the tutorial's own swatch, now read on screen, matches its wall's darkest corner); build aid |
| 08 | Raised white discs with long shadows | matches | thirds 239/230/190 against 239/228/191; variant of the first video's white-on-light finish |
| 09 | Edge lens blur and grain | matches (after fix) | title shadow now at the intended 19 % |
| 10 | 2D graphics on an extruded 3D plate | matches (after two fixes) | sheen corner for corner (lower-left 228,222,212 against 232,222,211); shadow band same thickness and darkness; floor edge removed; roll 1.1 degrees short, not visible |
| 11 | Camera depth of field (Advanced 3D) | matches (after fix) | plates now turned left edge nearer, as the tutorial; blur within 0.1 % of the width |

## What the proofs found in the recipes

- 02 said the shadow comes in from the lower left; it comes from the upper left (measured two ways). Corrected.
- 11 said the plates turn "with their right side towards the camera"; the builder read it the other way, which is how the words read. The recipe now says which edge is nearer, from a measurement (Y −64 degrees shown on screen).
- 03 overcounted the cards on screen; 05 and 10 lacked two scripting facts (Drop Shadow's opacity is 0 to 255 by script; Advanced 3D's internal name). All corrected and re-checked (rounds 4 and 5).
- 11's camera move: the recipe's +6 % was read mid-drag on a picture that lagged its readout; re-measured at +44 to +50 %, which the build's +42 to +45 % matches (lesson 19). 07's stock-keyer first try (step 2) cannot be matched exactly on our plate with any one Screen Colour; the keyed result itself matches.

## What the tool learned today

- 14: merge lines (how a variant differs from its parent) must be written with both recipes open; a checker confirms them, and the drafts tool refuses an unconfirmed variant.
- 15: a finished example shown first is not the build the steps make.
- 16: the alignment step now makes the 1920-wide frames every prompt reads.
- 17: a percent typed into a 0 to 255 control.
- 18: a wipe names the corner it reaches first, and a turned object names its nearer edge, from measurement.
- 19: a value read while the author drags is not a key; the viewer lags its readout by 3 to 5 frames.
- Art: a generator does not hold a figure asked for in words; measure the art against its targets before building on it (07's first plate came back far harsher than briefed).

## Where things are

- Report (the full ledger): `quality/reports/2026-11-15-channel-learner-7pgDb6NKEXM/report.md`.
- Draft recipes: `product/arsenal-drafts/7pgDb6NKEXM.md`. Study folder, proofs, art, reviews (git-ignored): `quality/renders/channel-study/7pgDb6NKEXM/`. Proof scripts: `tools/channel-learner/proofs/7pgDb6NKEXM/`.
- Higgsfield: balance 1,323 credits.

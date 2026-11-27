# Channel learner: UehuuNiZVuk (After Effects Channel, Cross animation in after effects with trim paths)

Explainer cookbook piece 13 (`product/explainer-cookbook-plan.md`), learned for flag-a-problem. Run on 2026-11-26 with pieces 5 and 14, one after another, on branch `adobe/pieces-5-13-14-cc165f`, started from `public/main` at 406369a.

The study data is git-ignored under `quality/renders/channel-study/UehuuNiZVuk/`, which links to `~/Assets/comp-room-studies/channel-study/`. Credits are in `product/arsenal-drafts/CREDITS.md`.

## Gather and align

- **The video.** 3 min 35 s, narrated, no chapters. The words come from whisper, which agrees 94.9 % with YouTube's automatic captions. Gather and align ran clean.

## Techniques and recipes

- **The listing found three; the lead merged the first two.** The first list (kept as `techniques-first.json`) had 01, drawing a stroke with round caps and no fill (21.9–61 s), and 02, Trim Paths keyed so the line grows and clears (61.6–159 s). Setting up the stroke is the base of the travelling line, not a technique of its own, so 01 now runs 21.9–159 s. 02 is the cross (162.6–207 s).
- **01, the travelling round-cap line**: Trim Paths End 0 → 100 %, then Start 0 → 100 % a little later, so the tail chases the head off the far end. The check passed in round 3; round 2 failed on a sentence copied whole.
- **02, the X**: the travelling line duplicated and turned to +45° and −45°. The check passed in round 3 before the proof; after its review it passed again in round 7 (see below).
- **Catalog.** Both new, no variants. 01: main job add-impact, group "trim paths draw-on". 02: main job flag-a-problem, support add-impact.

## Proofs (9:16, generated art)

- **The beat.** A quick quiz on a desk: QUICK QUIZ, the question 2 + 2 × 2 = ?, and two answer tiles, 8 (wrong) above 6 (right). The owner asked for a red X landing over a wrong answer, so the stroke is #D7263D in place of the tutorial's teal and olive; every other stroke value is the recipe's. 01's line strikes once through the 8; 02's X strikes once over it. The author's X draws on and clears again (Start follows End), so the proofs show it that way; the lead notes forbid dropping the Start keys to leave it on screen.
- **Art.** A pale paper desk lit from the upper left, with a pencil and an eraser along the bottom edge, generated on Higgsfield with gpt_image_2_6 (job b297c4fa). The tiles and type are built in After Effects, in Montserrat.
- **First builds: both "partly".** Both read as the same accent, but glided where the tutorial's strokes creep, snap and settle.
  - 01's review found nothing missing from the recipe. Its builder had solved influences by hand from two played points and checked the timing only on the four-moment sheet, so the tail peaked at 15 % of the line a frame where the clip's reaches 39 %.
  - 02's review found the recipe short. Its layout said the peak was about 5 times the average speed, but its build notes said Easy Ease at 33.3 %, which peaks at about 1.5 times.
- **Recipe 02 fixed (video-lead step 7).** The passed check is kept as `checks/02-before-proof.md`, and a lead check sent the gap to a writer. Round 4 failed: an 80–85 % influence cannot reach a 40 % step. The lead then computed After Effects' two-key ease table and added it to the check as a lead note. Rounds 5 and 6 failed on small miscounts (slow frames, the settle list), and round 7 passed: influences of about 90–95 % on both sides, with an odd frame count putting the peak on one frame.
- **Lesson 62.** `distil.md` now gives the influence table and the odd/even frame rule; `check.md` check 9 fails an Easy Ease written against a much harder played step; `prove-run.md` says an ease is checked by numbers on every frame across its fastest part, never on the sheet.
- **01 rebuilt.** Only the eases changed (tail out 90 %, in 99 %; head out 65 %, in 80 %), key times kept. Measured on every frame against the review's targets: the tail creeps to 8.1 % over its first 6 frames, then goes 19.9 → 48.4 → 75.3 % in two frames, its fastest frame 28.5 % of the line (target at least 30 %), and settles from 87.7 % to gone in 9 frames. The head crosses 13 → 80 % in 8 frames with a 12.3 % peak, as targeted. The builder says one Bezier segment over the fixed 22-frame span cannot reach both the creep and a 30 % step.
- **02 rebuilt.** Only the eases changed: speed 0 and influence 95 % on all four keys, with the key spans made odd (End 0 → 17 f, Start 15 → 32 f) so the fastest moment lands on one frame. The \ arm leading the / arm by a frame was not built (optional; no step gives it).
- **Both rebuilds review "matches".** 01: the tail goes 17.6 → 33.6 → 72.5 % in two frames against the clip's 10.7 → 34.3 → 73.5 %. Its fastest step is 39.0 % of the line against 39.1 %, about 3.2 times the head's in both, and the settle agrees frame for frame. The reviewer's 39.0 % differs from the 28.5 % in the builder's notes; the review measured the final `build.mov`. 02: the head's fastest step is 252 px, 47 % of the run, against the clip's 272 px and 49 %; the tail's is 252 against 245 px. The only difference left is the optional one-frame lead.
- **Phone files.** `proof/phone/strike-01.mp4` and `x-02.mp4`, 1080 × 1920 at 30 fps.
- **Scripts.** `tools/channel-learner/proofs/UehuuNiZVuk/`, with the first builds' scripts kept as `-first.jsx`. No home-folder paths.

## Cost

$8.65 of the $40 budget: techniques $0.05, distil $2.30 and check $1.53 (ten runs each, most of them recipe 02's fix after its first review), art $0.47, prove-author $0.36, prove-run $2.25, prove-review $1.68. The art was generated on Higgsfield credits, outside the runner's spend.

## Acceptance

Joe accepted both proofs in chat on 2026-11-26 ("accepted"), after the four phone files from pieces 5, 13 and 14 were sent to him together. Only the status lines changed in the recipes, and each check notes it. The stills are in `product/arsenal-drafts/proof-stills.json`, and the arsenal (134 recipes, 161 stills), the plugin bundle and the Claude package are rebuilt. All three suites pass: channel learner 239/239, release 125/125, runtime offline 1702 passed and 117 skipped.

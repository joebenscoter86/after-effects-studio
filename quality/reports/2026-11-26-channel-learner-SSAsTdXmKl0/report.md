# Channel learner: SSAsTdXmKl0 (Move Shapes, Simple Before & After Transition)

Explainer cookbook piece 5 (`product/explainer-cookbook-plan.md`), learned for before-after. Run on 2026-11-26 with pieces 13 and 14, one after another, on branch `adobe/pieces-5-13-14-cc165f`, started from `public/main` at 406369a.

The study data is git-ignored under `quality/renders/channel-study/SSAsTdXmKl0/`, which links to `~/Assets/comp-room-studies/channel-study/`. It holds the video, frames, timeline, recipe, checks, art, proof and renders. Credits are in `product/arsenal-drafts/CREDITS.md`.

## Gather and align

- **The video.** 3 min 30 s, no chapters, and no speech: music over the screen recording.
- **Lesson 59.** The first gather stopped with exit 2, "no speech", because a screen-only video had to have chapters to split it by. A short video can be read as one span. `learn.mjs` now aligns a screen-only video with no chapters as one span when it is 5 minutes or shorter (`SCREEN_ONLY_UNCHAPTERED_MAX_S`), and still stops on a longer one. Tests in `tests/learn.test.mjs`; the techniques prompt says a short chapterless video comes as one chapter.

## Technique and recipe

- **One technique**, 21–206 s: a rectangle keyed across the comp on x, duplicated as a track matte over the "after" picture, with a thin stroke riding its edge. It is more than a plain masked wipe (the edge line, the matte made from a keyed shape, the out-hold-back timing), but small, so it was written as one short recipe, as the plan said.
- **The check passed in round 3.** Rounds 1 and 2 failed on the stroke (the author typed white at 1 px; the clip's line measures pale amber about 1.5 px) and on the motion, which the recipe first gave from the author's keys rather than from the finished clip.
- **Catalog.** New, no variant. Main job before-after, support compare; group "media in shape matte". The lead dropped the matcher's "material: wireframe" tag: the wire mesh is the tutorial's demo art, not the technique.

## Proof (9:16, generated art)

- **Art.** One room, before and after its renovation, registered on the same pixels (window, ceiling line and corners checked at half opacity). Generated on Higgsfield with gpt_image_2_6: the after from a text prompt (job 7236014d), the before as an edit with the after as its reference (job 5d2a4146). Each was scaled to 1086 × 1920 and cropped 3 px a side. Small BEFORE and AFTER pills in Montserrat SemiBold ride inside each picture's precomp, so the label wipes with its picture.
- **First build: partly.** The lead notes told the builder to keep the recipe's key times. The recipe's `layout` line said the finished clip plays on a different timing from the author's on-screen keys, and the review measured against the clip: the wipe and its hold were late, and the resting start differed (lesson 63).
- **Second build: matches.** The lead corrected the notes to aim at the clip's measured edge positions. The builder fitted 12 keys to them, each with its speed set to the local slope; measured against target at eight times, every one is within half a percent of the width (for example 60.4 % against 60 % at 1.0 s; peak 999 px/s against about 1000). The review's only measurable gap is a hold about 0.6 s longer off the right side before the return, with an optional fix it leaves untested. The hairline is faint against the pale plaster wall; the review credits that to the art, not the stroke.
- **Phone files.** `proof/phone/wipe-01.mp4` (the second build) and `wipe-01-first.mp4` (the first), 1080 × 1920 at 30 fps.
- **Script.** `tools/channel-learner/proofs/SSAsTdXmKl0/01-before-after-sliding-matte-wipe.jsx`, with the first build's script kept as `-first.jsx`. No home-folder paths.

## Cost

$4.10 of the $40 budget: techniques $0.09, distil $0.82, check $0.90, art $0.27, prove-author $0.15, prove-run $0.94, prove-review $0.93. The art was generated on Higgsfield credits, outside the runner's spend.

## Acceptance

Joe accepted the proof in chat on 2026-11-26 ("accepted"), after the four phone files from pieces 5, 13 and 14 were sent to him together. Only the status line changed in the recipe, and its check notes it. The still is in `product/arsenal-drafts/proof-stills.json`, and the arsenal (134 recipes, 161 stills), the plugin bundle and the Claude package are rebuilt. All three suites pass: channel learner 239/239, release 125/125, runtime offline 1702 passed and 117 skipped.

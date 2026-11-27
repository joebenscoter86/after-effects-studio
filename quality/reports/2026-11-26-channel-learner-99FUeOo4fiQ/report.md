# Channel learner: 99FUeOo4fiQ (Smertimba Graphics, Countdown Timer Tutorial)

Explainer cookbook piece 14 (`product/explainer-cookbook-plan.md`), learned for show-time. Run on 2026-11-26 with pieces 5 and 13, one after another, on branch `adobe/pieces-5-13-14-cc165f`, started from `public/main` at 406369a.

The study data is git-ignored under `quality/renders/channel-study/99FUeOo4fiQ/`, which links to `~/Assets/comp-room-studies/channel-study/`. Credits are in `product/arsenal-drafts/CREDITS.md`.

## Gather and align

- **The video.** 2 min 5 s, narrated, no chapters.
- **The author's code.** The narration says the expression is in the pinned comment. It was fetched with `yt-dlp --write-comments` and copied word for word into `extras.md` (lesson 36), trailing spaces kept. It has no semicolon before `else`, which is why the narration says to switch to the Legacy ExtendScript engine.
- **Lesson 60.** The creator's own captions came first in the sources, and the first timeline read scrambled: 61 % agreement with whisper. The captions are roll-up events whose spans overlap, and the parser spread each event's words to its end, past where the next event starts. `parseJson3` now ends each event's words at the next event's start. `align` also falls back to whisper when the creator's captions agree with it on under 80 % (`MIN_CREATOR_AGREEMENT`). Re-aligned with `--redo timeline`, the creator's captions agree 98 % and the order is right. The scrambled timeline is kept as `timeline-scrambled.md`. Tests in `tests/words.test.mjs` and `tests/learn.test.mjs`.

## Technique and recipe

- **One technique**: a Slider Control keyed in seconds drives a Source Text expression that pads minutes and seconds into MM:SS. The recipe quotes the pinned code whole, marked `said (pinned comment)`, and gives the engine switch as its own step.
- **The check passed in round 3.** Round 3 checked only the merge lines.
- **Catalog.** A variant of SKU3QdqKLOs #01 (the value-driven counter), merge confirmed. Main job show-time, support land-number; group "value slider rig".

## Proof (9:16, generated art)

- **The beat.** "Ready in 15 minutes": a kitchen timer counts 15:05 down to 15:00 at one displayed second per comp second, lands at about 4.5 s and holds for 2 s. The recipe's `variations` line says the values are the user's to choose, so only the key values are the beat's.
- **Art.** A dark kitchen at night, the wall behind the clock near black (about 6 % brightness), generated on Higgsfield with gpt_image_2_6 (job 48ccdee9) at 9:16. READY IN in Montserrat SemiBold sits above the Montserrat Black digits.
- **Lesson 61.** The builders may not change project settings, so the lead set the expression engine to Legacy ExtendScript on the proof project by script and saved it. It read back "extendscript", but every render showed "0": Source Text reported the JavaScript engine's `Unexpected token 'else'`. The builder rightly left the author's code alone and stopped. The lead reopened the project by the same path, and the expression then evaluated. `video-lead.md` step 6 now says to set such a setting, save and reopen; `prove-run.md` says a builder who sees the other engine's error stops and reports. Test in `tests/run-stage.test.mjs`.
- **Second build: matches.** No script change, rendered after the reopen. The digits flip once every 30 frames, digit height 147 px against the recipe's 147, colon and spacing the same; the review found nothing missing and nothing to fix. The reference clip is a scrubbed preview, so it gives no speed to compare.
- **Phone file.** `proof/phone/timer-01.mp4`, 1080 × 1920 at 30 fps.
- **Script.** `tools/channel-learner/proofs/99FUeOo4fiQ/01-slider-countdown.jsx`, with the first run's copy kept as `-first.jsx`. No home-folder paths.
- **Project defaults.** The engine setting did not leak: a new project afterwards read javascript-1.0, 8 bpc and no working space.

## Cost

$2.69 of the $40 budget: techniques $0.05, distil $0.39, check $0.60, art $0.29, prove-author $0.15, prove-run $0.92 (the first run stopped on the engine), prove-review $0.29. The art was generated on Higgsfield credits, outside the runner's spend.

## Acceptance

Joe accepted the proof in chat on 2026-11-26 ("accepted"), after the four phone files from pieces 5, 13 and 14 were sent to him together. Only the status line changed in the recipe, and its check notes it. The still is in `product/arsenal-drafts/proof-stills.json`, and the arsenal (134 recipes, 161 stills), the plugin bundle and the Claude package are rebuilt. All three suites pass: channel learner 239/239, release 125/125, runtime offline 1702 passed and 117 skipped.

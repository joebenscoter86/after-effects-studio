# Channel learner: composed 01 (fail-then-fix, from recipes already proven)

Explainer cookbook piece 10 (`product/explainer-cookbook-plan.md`). No tutorial: the recipe chains three parts the cookbook had already proven into one fail-then-fix beat. Run on 2026-11-26 on branch `adobe/piece-10-fail-then-fix-7f033c`, started from `public/main` at d234fc7.

The study data is git-ignored under `quality/renders/channel-study/composed/`, which links to `~/Assets/comp-room-studies/channel-study/composed/`. It holds the recipe and its parts as the build read them, the art, the proof project, the renders, both reviews and the phone files.

## Filing: a main recipe, not a build aid or a library scene

- **How `find` treats each kind.** `ae_arsenal find` by job returns only entries of kind `technique` or `piece`, never `build-aid`, `unmatched` or `style`, and a library document never. The plan's two options (a build aid that names the recipes, or a worked scene in the library) would not come up when a brief asks for fail-then-fix. Joe agreed on 2026-11-26 to file it as a recipe whose main job is fail-then-fix.
- **How composed entries were filed.** Only pieces carried `composes` (from their "works with" line) and `requires` (the pieces they load with `PCS.need`); every written recipe shipped `composes: []`.
- **The filing chosen.** A new draft, `product/arsenal-drafts/composed.md`, for recipes learned from no video. A recipe there is a `technique` whose `composes:` line names its parts by catalog id; the catalog ships them as `composes`. `catalog.mjs` gives a composed recipe no video (so the file's name is never scrubbed from shipped text as a video id is), and refuses a part that is no recipe in the drafts, a composed recipe without a `composes:` line, and a `composes:` line in a video's draft. `arsenal.mjs` refuses a piece or style part that is in no catalog, when the build has the pieces and styles. Tests in `tests/catalog.test.mjs` and `tests/arsenal.test.mjs`. The runtime test `plugin/runtime/tests/arsenal.test.ts` checks that `find fail-then-fix`, proven only, returns the recipe as its main job, and that every part of a composed recipe is a proven catalog entry.

## The recipe

- **01, "Fail, then fix: a red X on the wrong state, a wipe to the fixed one, a tick on the result".** Main job fail-then-fix; supports flag-a-problem and before-after. It composes `02-duplicate-rotate-lines-into-cross` (piece 13's X), `01-before-after-sliding-matte-wipe` (piece 5's wipe) and `piece-tick`.
- **What it adds.** The order and the hand-offs: the X sits inside the wrong picture's precomp and stays drawn (02's clearing tail is dropped), so the wipe takes it away with the picture it marks; the wipe runs only its forward leg, on the keys its own proof fitted to the tutorial's clip, with a soft start so no hairline shows before it; the tick waits until the edge has left the frame. Times for 30 fps and 6 s: the X from 0.4 s, held 0.97–1.8 s, the wipe from 1.8 s (off the frame at about 4.35 s), the tick at 4.45 s, the hold to 6 s.
- **No check round.** There is no video to check it against; the proof and its review are the test.

## Proof (9:16, generated art)

- **Art.** An AI image tool's two renders of a bakery front, from one camera: the first with a garbled sign ("BRAED & BUTRTE"), the second spelled right ("BREAD & BUTTER"). Generated on Higgsfield with gpt_image_2_6 at 9:16: the fixed render from a text prompt (job 7eea8143), the wrong one as an edit with it as the reference (job 6fb18980). A difference image shows only the sign's lettering changed (rows 529–628). Each was scaled to 1086 × 1920 and cropped 3 px a side. Labels "TEXT MODE · OFF" and "TEXT MODE · ON" in Montserrat SemiBold ride in each picture's precomp; a 190 px green disc rides with the fixed one. 8 credits.
- **Blind build.** The runner's author run wrote the script from the recipe, its parts as the plugin ships them, the brief and the lead notes, without After Effects ($0.22); the builder run ran it unchanged on the first call ($0.37).
- **First review: partly.** An independent reviewer (the plugin's motion-reviewer agent, given the brief, the comp, the render and the parts' recipes and stills, not the build notes or script) judged it against the job and the parts' proven looks:
  - The job reads at a glance: wrong, the change, right.
  - X: 43 % of the stroke in its fastest frame (0.667→0.700 s), against 48 % in its proof.
  - Wipe: hairline (160, 150, 115) at 1.5 px; the edge from −1 px at 1.8 s to off the frame at 4.333 s, peak about 915 px/s against the proof's about 900.
  - Tick: from 4.467 s, 4 frames after the edge leaves.
  - The one defect: both labels were centred, and the ON pill is 31 px narrower, so "TEXT MODE ·" sat 16 px further right and its letters jumped as the edge crossed (lesson 64).
- **Rebuild: matches.** Both labels left-justified at one x, with one pill width; the builder also pinned the text layers' anchors, since the prelude centres each on its own text ($0.61). Measured from the two renders: every frame above the labels is identical to the reviewed build, and the letters of "TEXT MODE ·" share 2,432 of 2,446 white pixels across the two states (the rest is anti-aliasing over different cobbles), first column x 286 in both (it was 286 against 302). The second review covered only those changed lines.
- **Phone files.** `proof/phone/fail-then-fix-01.mp4` (the rebuild) and `fail-then-fix-01-first.mp4`, 1080 × 1920 at 30 fps, 6 s.
- **Still.** The 2.8 s frame (`proof/01/still.png`): "BREAD &" already fixed, "BUTRTE" still under the X.
- **Script.** `tools/channel-learner/proofs/composed/01-red-x-then-wipe-then-tick.jsx`, with the first build's kept as `-first.jsx`. No home-folder paths.

## Lessons

- **65.** Support-only pieces outranked a job's main recipe; the runtime ranking is the rule change (see Catalog and find).
- **64.** Centred labels that change one word across a wipe do not line up. The rule went into the recipe's `layout:` line, `art.md` (brief writers) and `prove-run.md` (builders, even where a brief says "centred"), with a test in `tests/run-stage.test.mjs`.

## Catalog and find

- After the rebuild the arsenal holds 135 recipes and 162 stills, and no still is missing.
- **The ranking.** Before this run, `find` by job ranked pieces before written recipes whatever their job tier. `find fail-then-fix` (proven only, default limit 5) returned four pieces that only support the job (flip, tick, tip-away, two-sided), then composed 01, the only main recipe, fifth of five. Joe approved fixing it in this PR (relayed by the coordinating session: "apprved, whatever you suggest").
- **The change.** `plugin/runtime/src/tools/arsenal.ts` `findTechniques`: entries whose main job is the asked one now rank above every entry that only supports it, piece or not; within each group the order is as before (pieces first, then tier, proven, taught, mood, duration). The dev mirror `tools/channel-learner/catalog.mjs` holds no pieces and already ranked by tier first, so only its comment changed. The tool's description, the index text and the three-levels design line say the new order.
- **What depended on pieces first.** One runtime fixture test asserted that a support-only piece comes before a recipe whose main job it is; it now asserts the reverse. "A job find for before-after lists the flip piece first" still holds (flip's main job is before-after). The plain-words `find` (query) still lists pieces first and is unchanged. No skill or motion-studio text relies on the order.
- **Tests.** `find fail-then-fix` returns composed 01 first; on the shipped catalog, for every job, proven only and any status, no support-only entry ranks above a main entry.
- **Effect on every job** (proven only, default limit 5). Seven top results changed, each from a support-only piece to a main recipe:

| Job | Top before | Top after |
|---|---|---|
| compare | piece-flip (support) | 07-stroked-bars-grow-in-stagger-with-value-labels |
| fail-then-fix | piece-flip (support) | 01-red-x-then-wipe-then-tick |
| introduce-tool | piece-picture-face (support) | 02-multi-colour-edge-lines-converging |
| flag-a-problem | piece-flip (support) | 02-duplicate-rotate-lines-into-cross |
| add-impact | piece-move (support) | 01-trim-paths-travelling-round-cap-line |
| move-camera | piece-hand-over (support) | 11-camera-depth-of-field-advanced-3d |
| keep-it-alive | piece-spot (support) | 06-3d-orbit-rings |

  Eleven more keep their top result and change order below it, main recipes moving above support-only pieces: land-number, list-items, before-after, relate-things, make-concrete, show-proof, reveal-headline, establish-place, add-depth, light-the-hero, hand-over. The other nine jobs are unchanged.

## Cost

$1.21 of the $40 budget, as the runner counts it: prove-author $0.22, prove-run $0.37 and $0.61. Not in that figure: 8 Higgsfield credits for the art, and the reviewer agent (about 184,000 tokens), which ran inside the lead session.

## Acceptance

Joe accepted the proof on 2026-11-26 ("Accept") after the phone file was sent to him. Only the recipe's status line changed. The still is in `product/arsenal-drafts/proof-stills.json`, and the arsenal, the plugin bundle and the Claude package are rebuilt.

## After Effects

The piece 13 project (`UehuuNiZVuk/proof/proofs.aep`, worktree bold-darwin-7736f1) was open with unsaved changes when this run began. It was kept as `proofs snapshots/proofs_snapshot_001.aep` beside it, and the project file stays as last saved. After Effects now has `composed/proof/proofs.aep` open.

# Tags against jobs v1: notes

`tags.json` tags all 64 recipes against jobs v1 (the 27 ids in Content `320c2656`). The tags are stored as data only, and no recipe text was changed. The primary job was taken from each recipe's `what it does for a beat` and `what it looks like` lines, not from its old craft category.

**Kinds:** 55 technique, 8 build-aid, 1 unmatched.

Build aids: YBeMmC43Q1U #05 (stagger by drag), #07 (auto-orient towards camera), #08 (recording a pin by hand), #15 (Grow Bounds), #22 (shy), #23 (shutter angle), #24 (crisp precomp), and il_OcNyqDOE #01 (splitting found vector art into one layer per object, which is setup with nothing to show on screen). Their `duration` is 0 because they are never on screen alone.

## Counts per job (primary / support)

| Group | Job | Primary | Support |
|---|---|---|---|
| line | land-number | 0 | 0 |
| line | count-things | 0 | 0 |
| line | show-time | 0 | 2 |
| line | list-items | 5 | 1 |
| line | step-through-process | 0 | 0 |
| line | compare | 0 | 0 |
| line | before-after | 0 | 0 |
| line | fail-then-fix | 0 | 0 |
| line | one-to-many | 0 | 2 |
| line | relate-things | 1 | 0 |
| line | make-concrete | 0 | 0 |
| line | show-real-screen | 2 | 0 |
| line | introduce-tool | 0 | 0 |
| line | show-proof | 0 | 0 |
| line | reveal-headline | 8 | 5 |
| line | point-at-detail | 1 | 2 |
| line | flag-a-problem | 0 | 0 |
| line | call-to-action | 0 | 0 |
| picture | establish-place | 1 | 8 |
| picture | add-depth | 7 | 10 |
| picture | light-the-hero | 4 | 8 |
| picture | fill-the-backdrop | 6 | 4 |
| picture | finish-the-look | 4 | 10 |
| picture | add-impact | 0 | 3 |
| connective | hand-over | 2 | 0 |
| connective | move-camera | 3 | 2 |
| connective | keep-it-alive | 11 | 11 |

The most common primary jobs are keep-it-alive (11), reveal-headline (8), add-depth (7), fill-the-backdrop (6) and list-items (5). Picture and connective jobs carry 38 of the 55 techniques. This fits Decision 3: the arsenal serves house reels mainly through picture jobs.

**Jobs with no recipe as primary (14).** These should head the wanted list.
- No recipe at all, primary or support (11): `land-number`, `count-things`, `step-through-process`, `compare`, `before-after`, `fail-then-fix`, `make-concrete`, `introduce-tool`, `show-proof`, `flag-a-problem`, `call-to-action`.
- Support only (3): `show-time` (the loader uses of YBeMmC43Q1U #01, and the "progress moments" in 8oVLS0ZlKC4 #05), `one-to-many` (the liquid merge in 8oVLS0ZlKC4 #04, and the "many stories" trail in ZqRE3ho8iP4 #06), `add-impact` (the swoosh, the confetti, the weighty letter entrance).

Almost every line job is empty. The five tutorials teach looks, depth and loops. They don't teach the beats that carry an argument: numbers, comparisons, a process, proof, a warning or a call to action. The house devices cover these today (Decision 3).

## Unmatched

- **il_OcNyqDOE #11, `11-matching-closeup-telephoto-compression`.** Its beat line: "Cut from an established wide scene to a close-up of the character without building a new world." **Proposed job: "cut in to a matching close-up of the subject"** (for example `cut-to-closeup`, a connective job). It is not `hand-over`, because that job must not read as a cut, and this one is a cut. It is not `point-at-detail` or `move-camera` either, because the picture is not held and nothing moves. It might fold into an existing job if `hand-over` were widened to cover a motivated cut-in. Its support tags (`establish-place`, `add-depth`) are kept so it is still findable.

## Hard to tag, and why

- **Title looks with no reveal motion:** eoBEBx1PbS4 #01, #07, #08 and YBeMmC43Q1U #21. These give a title its material (bevelled metal, gold sides, hollow chrome, printed paper) but don't animate it arriving. I tagged them `reveal-headline` because a beat asks for a headline and the look rides on `mood`. A query for `reveal-headline` will return them next to real entrances (#18, eoBEBx1PbS4 #05), so ranking should prefer `motion: one-shot` when the beat wants an entrance.
- **Framing a photo or clip:** YBeMmC43Q1U #25 (a notched media window) and ZqRE3ho8iP4 #01 (a rounded media card). I tagged them `show-real-screen` because it is the only job about presenting real media. Its definition says "app, page or recording" and leaves out photos. If briefs often ask to show a photo or clip in a designed frame, that is a candidate job (or a wider `show-real-screen`).
- **Gallery or "many images" loops:** ZqRE3ho8iP4 #05, #07, #08, #10 (and #06 as a list). Their beat lines say "gallery", "moodboard", "many stories", "many images moment". No job means "show lots of examples at once". I tagged them `keep-it-alive` (they are loops under a held picture, matching that job's "ring of cards turning slowly" example), with `list-items` for the step carousels. A "show many examples" job is the second candidate for the proposals queue.
- **Stroke primitives:** YBeMmC43Q1U #01 (dotted ring), #02 (line with end dots), #03 (tapered stroke). These are drawing parts more than beat answers. #01 is a ring circling a title (`point-at-detail`, the "ring" in its definition). #02 has "connector lines" (`relate-things`). #03 is a light arc behind a headline (`fill-the-backdrop`). All three could reasonably be build-aids instead.
- **Camera-property switches that change the picture:** YBeMmC43Q1U #16 (focus linked to a layer) and ZqRE3ho8iP4 #11 (a wide lens). They are near build-aids, but each makes a visible difference (a hero kept sharp through a push, a flat ring made immersive), so they stay techniques under `move-camera` and `add-depth`. YBeMmC43Q1U #07 (auto-orient) went the other way: it only fixes a fault.
- **add-depth or finish-the-look:** YBeMmC43Q1U #17 (depth fog) fits both. The add-depth definition names fog and says "read as one space", which is the recipe's own result line, so it is primary there with finish-the-look as support.
- **Particle drift:** YBeMmC43Q1U #10 says "Fill a scene" and il_OcNyqDOE #07 says "sells wind". Both are `keep-it-alive`, so the duplicate group shares one job, with `fill-the-backdrop` as support. The particles sit over the scene rather than under it, so `fill-the-backdrop` didn't fit as primary.

## Field conventions used

- `group` is the INDEX "Taught more than once" group in short form. When a recipe sits in two groups, the more specific one is kept: ZqRE3ho8iP4 #04/#05/#06 are also in "time stagger", 8oVLS0ZlKC4 #02 is also in "double glow", il_OcNyqDOE #11 also reuses the DOF camera push, and il_OcNyqDOE #12 is also in "wave warp wind".
- `difficulty` comes from the step count (about 5 or fewer is 1, 6 to 9 is 2, 10 or more is 3), raised for hand-only parts such as puppet pins and dolly-tool pushes.
- `duration` is my estimate of the natural on-screen length. It is not measured.

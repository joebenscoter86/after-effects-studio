# Channel learner: where it stands (2026-11-14, afternoon)

## The short version

- **All 25 techniques from the first video are built in After Effects on designed artwork** and checked against the tutorial's own result. On the reviewers' measurements, 23 match and 1 is proven on Joe's word (11). One cannot be proven by script: 8, puppet pins, is done by hand.
- **The tool learned from its failures.** Every miss today is written into its prompts and `tools/channel-learner/LESSONS.md`, so the next video starts from them.
- **Nothing is pushed.** About 95 local commits on `adobe/channel-learner`; the repository is public.

## How the day went

1. **Plain builds.** The 25 recipes were built blind (the builder never sees the video) and reviewed against the tutorial: 24 "matched".
2. **Joe rejected one on sight.** 11 looked like "white circles with no effect" against the tutorial's stacked 3D discs. Every stage had passed it for a narrow reason. The recipe was widened to cover the whole result, a blind rebuild was accepted ("perfect"), and 11 became the first proven recipe.
3. **Look-first reviews.** Re-judged on the look, four of the other "matches" fell and three were close calls.
4. **Artwork for every proof.** At Joe's word, three art directors generated our own designed art on Higgsfield (about 175 credits; balance about 2,050), and all 24 were rebuilt on it.
5. **Drift, caught and fixed.** Building on art, builders bent the technique to suit the art on ten proofs. A rule now fixes the recipe's measured effect and bends the art. The fog scene's forest was regenerated because its trunks were painted lighter than the fog.
6. **Four polish passes, a final review, last fixes.** All 24 now match on measurement, apart from 8.

## Results

| # | Technique | Verdict |
|---|---|---|
| 1 | Dotted ring | matches |
| 2 | Arcs with end dots | matches |
| 3 | Tapered planet rim | matches after final fix (rim now 0.028 h deep at the crest, as the tutorial's) |
| 4 | Word carousel | matches |
| 5 | Staggered cards | matches |
| 6 | 3D orbit ring | matches |
| 7 | Face the camera | matches |
| 8 | Puppet pin | cannot be judged: by hand; a scripted stand-in sways her head |
| 9 | Endless train window | matches |
| 10 | Leaves as particles | matches |
| 11 | White-on-light finish | **proven** (Joe) |
| 12 | Long soft shadow | matches after final fix (direction 9.7 degrees against 7 to 12; band 3 to 13 % wider) |
| 13-25 | Dot grid to media frame | all match |

3, 4 and 12 were fixed after the final review; their fixes were measured by the builder, not re-reviewed.

## What the tool learned today (all in its prompts)

- A recipe must account for the whole result picture, not just the step shown.
- A check now asks: would these steps give this picture?
- Reviews judge the look first, then the mechanism; angles and directions need two measurements.
- Only Joe proves a recipe; the draft builder refuses a "proven" without his recorded acceptance (tested).
- Every proof is built on art made to a brief; the art bends to the technique's measured effect, never the reverse.
- Builders render exact spans (no blank last frame), address layers by name, and send one After Effects call at a time.

## Decisions for Joe

1. **Accept more as proven.** Watch `proof/mobile/all-25-proofs.mp4` (2 minutes) and name the ones you accept.
2. **Write the build findings back into the recipes.** Several proofs needed values the tutorial never shows (14's darkness, 15's shadow copy, 17's fog depths); they are in the build notes, not yet in the recipes.
3. **More videos.** YouTube's bot check still blocks downloads; a slow pace or your own files.
4. **Push** `adobe/channel-learner`.
5. **Update Comp Room to 0.3.0** in the app (released today by the other session).

## Where to look

- Phone reel: `quality/renders/channel-study/YBeMmC43Q1U/proof/mobile/all-25-proofs.mp4`
- Each proof: `proof/<n>/` (`build.mov`, `review-final.md`, `art/brief.md`, `build-notes.md`)
- Lessons: `tools/channel-learner/LESSONS.md`
- Full record: `quality/reports/2026-11-14-channel-learner/report.md`

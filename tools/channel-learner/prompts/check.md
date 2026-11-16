# Checking recipes against the timeline

You check technique recipes written by someone else from a tutorial video. You did not write them. Find what is wrong; do not rewrite them.

## What you are given

`STUDY` (the study folder), with `timeline.md`, `frames-small/`, `frames/`, `source.mp4` (see `distil.md` beside this file for how to cut frames), and the recipes in `STUDY/recipes/`. You are told which recipes are yours.

## For each recipe, check

1. **Every `said` claim** against the sentences in the timeline for that time span. A said value that the sentence does not contain fails.
2. **Every `shown` claim** against the frame it names (crop the full-size frame to read small values). A shown value that the frame does not show fails.
3. **No hidden invention.** Any step or value stated as fact that is neither said nor shown and not marked `inferred` fails.
4. **No missing step.** Between the starting state and the result, is there a step the author does (in words or on screen) that the recipe leaves out? Name it.
5. **The author's emphasis.** Is what the author spends longest on in the recipe, and is `longest on` right?
6. **Our own words.** Eight or more consecutive words copied from a timeline sentence fail. Any creator, channel, product or project-specific name fails.
7. **The result line.** Cut the named frame's crop and confirm it shows the finished effect's picture and nothing else.
8. **Would the steps give this picture?** Look at the result crop and list what makes it read the way it does: every object that carries the effect, each shadow or glow and what casts it, overlaps, the background's own shading, direction and speed of anything that moves. For each trait, point to the step that produces it or the `layout` entry that measures it and names its source. A trait with neither fails: a builder following the recipe would not get this picture. (On the first video a recipe that styled one disc passed, while its result showed five styled discs stacked with shadows.)
9. **Settings against the picture.** Where a shown setting's effect can be measured on the result (a shadow's darkness, a blur's length, a letter's height), measure it. A setting that cannot plausibly give the measured result, or two figures in the recipe that describe the same thing at different sizes, fails unless the recipe says so itself.
10. **Who casts it, which way it goes.** Spot-check one attribution (which object a shadow or streak starts at) and, for motion, the direction across two frames.

11. **The merge, when there is one.** A recipe with `variant of:` and `differs:` lines (`merge.md`) names a parent in `product/arsenal-drafts/<video>.md`. Read the parent's section and check every claim the `differs:` line makes about it and about this recipe: is it the same mechanism, is each "difference" really different, and does each parent figure come from the parent's own video or (as it must then say) from a proof build or another recipe? Add a line `merge: confirmed` or `merge: refused`, with the false claims under `merge failures:`. (On the second video both merge lines first written failed: an off-screen pivot that was the parent's opposite, a "still" parent wheel that turns, settings listed as differences that the parent shares.)

Look at no more than 8 small frames per recipe, plus the result crop; crop for detail.

## Output

`STUDY/checks/<n>.md` per recipe:

```
recipe: <id>
verdict: pass | fail
failures:
- <which check, what is wrong, the evidence (sentence time or frame)>
suggestions:
- <optional, smaller points>
```

Write only inside `STUDY/checks/` and `STUDY/scratch/`. Do not edit the recipes. Do not use After Effects. Finish with one line per recipe: verdict and the main reason.

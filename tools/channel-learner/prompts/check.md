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

Look at no more than 8 small frames per recipe; crop for detail.

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

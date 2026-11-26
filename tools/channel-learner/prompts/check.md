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
7. **The result line.** Cut the named frame's crop and confirm it shows the finished effect's picture and nothing else. For a result called animated, confirm it plays: the comp's time display moves across the window, or, where the display is frozen during a preview (it often is), the viewer's redraws between two loop restarts match the work area's frame count; confirm the viewer has redrawn after the last change shown in the panels (compare with a frame from before it). A technique that is a move (keys, a bounce expression, a stagger) needs a played window: a still result for it fails, unless the recipe shows that no played window exists. Do not ask a writer to swap a played window for a still to clear a crop (`distil.md`, result windows).
8. **Would the steps give this picture?** Look at the result crop and list what makes it read the way it does: every object that carries the effect, each shadow or glow and what casts it, overlaps, the background's own shading, direction and speed of anything that moves. For each trait, point to the step that produces it or the `layout` entry that measures it and names its source. A trait with neither fails: a builder following the recipe would not get this picture. (On the first video a recipe that styled one disc passed, while its result showed five styled discs stacked with shadows.)
9. **Settings against the picture.** A saturated mid-tone colour measured on a screen recording may be inflated by the display's gamut (`distil.md`, colour from a screen recording): a recipe that gives one as a target must say so. Calibrate sizes on the comp's visible edges, not on the viewer's zoom percentage or its guide lines. Where a shown setting's effect can be measured on the result (a shadow's darkness, a blur's length, a letter's height), measure it. A setting that cannot plausibly give the measured result, or two figures in the recipe that describe the same thing at different sizes, fails unless the recipe says so itself. A part sized only as a share of the 16:9 picture's width (not against its own object), a main object without its size against the frame's short side, or an effect's pixel value without the object size it was set for fails (`distil.md`, sizes that only hold in a 16:9 frame).
10. **Who casts it, which way it goes.** Spot-check one attribution (which object a shadow or streak starts at) and, for motion, the direction across two frames. For a wipe or reveal, cut a frame at about half way and confirm which corner it reaches first; for a turned object, confirm which edge is nearer by a measurement. Any speed must come from an expression, key spacing or the comp's time display, never from the recording's own seconds (one recording's previews played 3.3 to 3.7 times real time). (On the second video a wipe said to run from lower left to upper right ran from upper left to lower right, and "right side towards the camera" was built the wrong way round; both had passed this check.) For motion blur, the recipe gives the smear at peak speed and the shutter it implies; a recipe that only says motion blur is on fails. For a curved path, the points it gives are tracked on played frames by the object's outline, not read off the drawn path or a handle mid-drag: check one point on a played frame. (On Tf0EiCGOEYs, three recipes passed with motion blur as a bare switch and one cursor route taken from a mid-drag handle bowed nearly three times too deep; all three builds came back "partly" at review.)

11. **The merge, when there is one.** A recipe with `variant of:` and `differs:` lines (`merge.md`) names a parent in `product/arsenal-drafts/<video>.md`. Read the parent's section and check every claim the `differs:` line makes about it and about this recipe: is it the same mechanism, is each "difference" really different, and does each parent figure come from the parent's own video or (as it must then say) from a proof build or another recipe? Add a line `merge: confirmed` or `merge: refused`, with the false claims under `merge failures:`. (On the second video both merge lines first written failed: an off-screen pivot that was the parent's opposite, a "still" parent wheel that turns, settings listed as differences that the parent shares.)

12. **The author's code, quoted whole.** A step that runs on an expression or script text the author gave (in `STUDY/extras.md`, or readable on screen) carries that text in full in a fenced block. Compare it with `extras.md` (or the frame) word for word, line breaks and comments aside; a paraphrase, its values alone, or "exactly as given" without the text fails (`distil.md`, the author's code).

A value you suggest is held to the same test as the recipe's: cite the frame where it has landed, never one taken while it is still being dragged or typed. (On nHh0NRo8G2U a checker's round-1 suggestion was a speed-graph tooltip read mid-drag; it cost a round.)

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
merge: confirmed | refused   (only for a recipe with `variant of:`, on its own line, never as a bullet)
merge failures:              (only when refused)
- <each false claim>
```

Write only inside `STUDY/checks/` and `STUDY/scratch/`. Do not edit the recipes. Do not use After Effects. Finish with one line per recipe: verdict and the main reason.

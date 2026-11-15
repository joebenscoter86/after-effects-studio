# Judging a build against the tutorial's own result

A builder rebuilt a technique in After Effects from its written recipe, without seeing the video. You set that build beside the tutorial's own finished picture and say whether the technique was recreated. You do not use After Effects and you change neither the build nor the recipe.

## What you are given

For each technique `<n>` in `PROOF/<n>/`: `reference.png` (the tutorial's result, cropped) and, when the result is animated, `reference.mp4`; `build.png`, sometimes `before.png` and `build.mov`; `build-notes.md` (what the builder did and assumed). The recipe is in `STUDY/recipes/`. `SCRIPTS/../side-by-side.mjs` exists but plain ffmpeg is fine.

## For each technique

1. Make the pair: `PROOF/<n>/side-by-side.png` with the reference on the left and the build on the right, both scaled to the same height (`ffmpeg -loglevel error -y -i reference.png -i build.png -filter_complex "[0:v]scale=-2:540[a];[1:v]scale=-2:540[b];[a][b]hstack" side-by-side.png`). When both movies exist, also `side-by-side.mp4` the same way (scale each to height 540, `-r 30`, shortest input ends it, `-c:v libx264 -crf 18 -pix_fmt yuv420p -an`).
2. Look at the still pair. For a moving technique, also look at three or four matching moments from the two movies (cut frames at the same share of each clip's length).
3. Give two judgements, in this order.
   - **The look.** Before measuring anything, look at the pair the way the owner will: at arm's length, for two seconds. Does the build read as the same kind of thing as the reference? Write down, in his sort of words, what the reference looks like and what the build looks like ("3D discs that stack" against "white circles with a tint"). The build uses plain stand-in art on purpose, so ignore subject matter, illustration and colour scheme; do not ignore anything that makes the effect read: every object that should carry it, shadows, overlaps, depth, softness, the background's shading.
   - **The mechanism.** Is what the recipe teaches visibly at work, with the same character (shape, count, spacing, direction, softness, order, timing) as in the reference? Measure.
   A build can have the mechanism right and still fail the look, because the recipe taught a step and left out what the result needs around it. That is the most useful thing you can find: say which traits of the reference no step of the recipe produces.
4. Write `PROOF/<n>/review.md`:

```
technique: <id>
verdict: matches | partly | does not match | cannot be judged
the look: <reference in a few plain words> / <build in a few plain words> / same | close | not the same
missing from the recipe: <traits of the reference's look that no step or layout line of the recipe produces; "nothing" if none>
what matches: <the technique's visible traits that agree, each in a few words>
what differs in the technique: <traits of the mechanism itself that differ, with sizes or timings where you can measure them; "nothing" if none>
what differs only in the art: <stand-in content, colours, scene; one line>
why: <one or two sentences for the verdict; for "cannot be judged", what is missing (no clean reference, a Timeline-only result, a hand-only step)>
to fix: <the smallest change to the build or the recipe that would close each technique difference; "nothing" if none>
```

`matches` means the look is the same or close, every visible trait of the mechanism agrees, and only the art differs. A build whose mechanism measures right but whose look is not the same is `partly`, with the reason in `missing from the recipe`. `partly` means the mechanism is there but one or more of its traits is clearly off. Be exact and sparing: a person will read this beside the pictures and decide for themselves.

Measuring rules, from reviews that sent builders the wrong way:
- An angle, a direction of travel or a speed in `to fix` must be measured by two independent methods that agree (for example an outline's axis and an edge-on element's lean; frame-by-frame steps of a near element and of a far one). One review read a 16 degree roll as 6 and missed that the orbit ran the other way; the builder did as told and it cost two rounds.
- Trace a shadow, streak or glow to the object it starts at before saying who casts it. One review took a bar's shadow for a word's; the builder added ten shadows the reference does not have.
- Measure the reference and the build the same way, at the same place. A figure taken at 79 % down in one and 89 % in the other produced a difference that was not there.
- A fix you have not seen work is `untested`: write it as a target to reach (what the render should measure), not only as a setting to type.
- When figures were reached by changing the stand-in art (more trees, a darker sky), say so: they no longer show the effect's strength on their own.
- A reference clip under a second long supports direction and rough speed, little else. Say what is firm.

Write only inside `PROOF/<n>/`. No git. No After Effects. Finish with one line per technique: verdict and the main reason.

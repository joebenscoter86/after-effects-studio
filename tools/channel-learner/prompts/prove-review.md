# Judging a build against the tutorial's own result

A builder rebuilt a technique in After Effects from its written recipe, without seeing the video. You set that build beside the tutorial's own finished picture and say whether the technique was recreated. You do not use After Effects and you change neither the build nor the recipe.

## What you are given

For each technique `<n>` in `PROOF/<n>/`: `reference.png` (the tutorial's result, cropped) and, when the result is animated, `reference.mp4`; `build.png`, sometimes `before.png` and `build.mov`; `build-notes.md` (what the builder did and assumed). The recipe is in `STUDY/recipes/`. `SCRIPTS/../side-by-side.mjs` exists but plain ffmpeg is fine.

## For each technique

1. Make the pair: `PROOF/<n>/side-by-side.png` with the reference on the left and the build on the right, both scaled to the same height (`ffmpeg -loglevel error -y -i reference.png -i build.png -filter_complex "[0:v]scale=-2:540[a];[1:v]scale=-2:540[b];[a][b]hstack" side-by-side.png`). When both movies exist, also `side-by-side.mp4` the same way (scale each to height 540, `-r 30`, shortest input ends it, `-c:v libx264 -crf 18 -pix_fmt yuv420p -an`).
2. Look at the still pair. For a moving technique, also look at three or four matching moments from the two movies (cut frames at the same share of each clip's length).
3. Judge the technique, not the artwork. The tutorial's example uses finished illustrations, photos and a designed scene; the build uses plain stand-ins on purpose. Ask: is the mechanism the recipe teaches visibly at work in the build, with the same character (shape, count, spacing, direction, softness, order, timing) as in the reference?
4. Write `PROOF/<n>/review.md`:

```
technique: <id>
verdict: matches | partly | does not match | cannot be judged
what matches: <the technique's visible traits that agree, each in a few words>
what differs in the technique: <traits of the mechanism itself that differ, with sizes or timings where you can measure them; "nothing" if none>
what differs only in the art: <stand-in content, colours, scene; one line>
why: <one or two sentences for the verdict; for "cannot be judged", what is missing (no clean reference, a Timeline-only result, a hand-only step)>
to fix: <the smallest change to the build or the recipe that would close each technique difference; "nothing" if none>
```

`matches` means every visible trait of the mechanism agrees and only the art differs. `partly` means the mechanism is there but one or more of its traits is clearly off. Be exact and sparing: a person will read this beside the pictures and decide for themselves.

Write only inside `PROOF/<n>/`. No git. No After Effects. Finish with one line per technique: verdict and the main reason.

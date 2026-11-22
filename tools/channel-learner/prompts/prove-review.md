# Judging a build against the tutorial's own result

A builder rebuilt a technique in After Effects from its written recipe, without seeing the video. You set that build beside the tutorial's own finished picture and say whether the technique was recreated. You do not use After Effects and you change neither the build nor the recipe.

## What you are given

For each technique `<n>` in `PROOF/<n>/`: `reference.png` (the tutorial's result, cropped) and, when the result is animated, `reference.mp4`; `build.png`, sometimes `before.png` and `build.mov`; `build-notes.md` (what the builder did and assumed). The recipe is in `STUDY/recipes/`.

The pictures you look at are made for you before you start, small on purpose (the runner calls `proofs/contact-sheet.mjs`, beside the prompts folder; run it on `PROOF/<n>` yourself only if a sheet is missing):
- `sheet.png`: the tutorial's result above the build, each 512 wide.
- `sheet-motion.png`, when both movies exist: four matching moments (1/8, 3/8, 5/8 and 7/8 of each clip), one per row, the tutorial left and the build right, each 256 wide.
- `side-by-side.png` and `side-by-side.mp4` are the full-size pairs for the owner. Do not open them, and do not open `reference.png`, `build.png` or a movie frame whole: look at the sheets, and cut crops for figures (measuring rules below).

You judge one technique per run; the next technique gets a fresh run.

## For your technique

1. Look at `sheet.png`. For a moving technique, also look at `sheet-motion.png`.
2. When a judgement needs a figure the sheet cannot show (an angle, a shadow's darkness, a gap, a fray's width), take it from the full-size files, one crop per figure: cut the same place, as a share of each picture, from `reference.png` and from `build.png` (`ffmpeg -loglevel error -y -i PROOF/<n>/reference.png -vf crop=W:H:X:Y PROOF/<n>/crop-<name>-ref.png`, and the same for the build), each crop at most 400 by 400, and look at those two crops. A level or colour can be read as numbers without looking (`-vf crop=W:H:X:Y,signalstats,metadata=print -f null -`). For movement, cut the one moment you need from `reference.mp4` and `build.mov` with `-ss` and crop it the same way.
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
- Colours read off the tutorial's recording can be more saturated than its render was (a wide-gamut display recorded as sRGB). Before calling a hue or saturation gap, put the build through the same transform (treat its sRGB values as Display-P3 and convert to sRGB) and compare again; say which comparison you used.
- A thin coloured line (a grid, a hairline, small type) loses its colour in 4:2:0 video: its brightness survives but its hue is averaged into its neighbours, so a pale blue grid reads grey on faintly tinted cells. Before calling a thin line's colour wrong, put the build through the same encoding (scale it to the reference's pixel scale, encode yuv420p, scale back) and compare again. A grid's "grey" was once nothing more than this.
- A fix you have not seen work is `untested`: write it as a target to reach (what the render should measure), not only as a setting to type.
- When figures were reached by changing the stand-in art (more trees, a darker sky), say so: they no longer show the effect's strength on their own.
- A reference clip under a second long supports direction and rough speed, little else. Say what is firm.
- The sheets are for the look and for what is plainly there or missing. Every figure you write in `what differs in the technique` or `to fix` comes from a full-size crop or from numbers, never from the 512-px sheet; say which crop.

Keep every earlier review: if `review.md` or `side-by-side.*` already exist, rename them to `review-<label>.md` and `side-by-side-<label>.*` (`<label>` the first unused of `first`, `second`, ...) before you write the new ones; never overwrite or delete one. Write only inside `PROOF/<n>/`. No git. No After Effects. Finish with one line: verdict and the main reason.

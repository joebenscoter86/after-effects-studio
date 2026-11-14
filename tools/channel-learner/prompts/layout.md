# Adding measured layout to recipes written before the form had it

Some recipes were written before the recipe form (see `distil.md` beside this file) gained its `layout:` line. Builders working from them had to guess every size. You add that one line to each recipe you are given, and change nothing else.

## For each recipe

1. Read the recipe, then its `result:` line: the time window, the crop (x,y,w,h in the full-size source frame) and the frame it names (a kept frame `STUDY/frames/fNNNNNN.png`, or a cut in `STUDY/scratch/<n>/`). Cut the crop out of that frame (`ffmpeg -loglevel error -y -i <frame> -vf crop=W:H:X:Y STUDY/scratch/<n>/layout-crop.png`; cut the frame from `STUDY/source.mp4` at the window's middle if no file is named) and look at it.
2. Decide what the crop shows: the whole comp, or a zoomed-in or panned part of it. Check the viewer's zoom readout and whether the comp's edges are inside the viewer in the full frame. If the crop is only part of the comp, say so in the line and, where an earlier frame shows the whole comp, give the sizes against the comp as well.
3. Measure the technique's main elements as shares of the picture: widths, heights, positions of centres or edges, gaps between repeated elements, how far a pivot or anchor sits from its layer when that can be seen. Overlay a grid if it helps (`-vf drawgrid=w=iw/10:h=ih/10:t=1:c=red@0.6`). Measure only what the picture shows; three to six figures is enough.
4. Add the line just before `timing and easing:` in this form, every figure marked `measured`, with what it was measured against:
   `layout: <element>: <figure> (measured on <frame>, shares of <the whole comp | the result crop, which shows about N% of the comp's width>); ...`
5. If the result is not a picture of the technique (a Timeline panel, for instance), write `layout: not a picture of the comp; <what the panel shows, with any counts or spacings that can be read>`.

## Rules

Change only the `layout:` line. Do not touch steps, values, tags or the result line; if you see something wrong elsewhere, put it in your report. Our own words; no creator, product or project names. Write only the recipe files you were given and `STUDY/scratch/`. No git. No After Effects.

Finish with a report of at most one line per recipe: the main figures, and whether the crop was the whole comp.

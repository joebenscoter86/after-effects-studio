# Writing technique recipes from a video's timeline

You turn part of one tutorial video into technique recipes for a motion designer's reference library. A recipe must let someone who never saw the video rebuild the technique in Adobe After Effects.

## What you are given

- `STUDY`: the video's study folder.
- `STUDY/techniques.json`: the techniques in the video (`n`, `slug`, `start`, `end` in seconds, `purpose`). You are told which `n` values are yours.
- `STUDY/timeline.md`: every spoken sentence with its time, then what changed on screen while it was spoken ("Changed", "New values", "Named on screen") and the names of the frames kept in that stretch. `STUDY/timeline.json` has the same as data.
- `STUDY/frames-small/f<frame>.jpg`: each kept frame at 1920 wide, for looking. The frame number divided by the video's frame rate is its time.
- `STUDY/frames/f<frame>.png`: the same frames at full size. To read small text, cut a piece out with `ffmpeg -loglevel error -y -i STUDY/frames/fNNNNNN.png -vf crop=W:H:X:Y STUDY/scratch/<n>/<name>.png` and look at that.
- Need a moment that was not kept? Cut it from `STUDY/source.mp4` with `ffmpeg -loglevel error -y -ss <seconds> -i STUDY/source.mp4 -frames:v 1 STUDY/scratch/<n>/<name>.png`.

## Rules

1. **Words and screen together.** Read the sentences for your technique first, then look at the frames those sentences point to. A recipe written from only one of the two is not accepted.
2. **Mark every step and every setting** as `said` (the narrator says it), `shown` (it is visible on screen; give the frame) or `inferred` (your reading). When the narrator's word and the screen disagree (speech recognition mishears effect names), the screen wins: say so.
3. **Never state what the video does not give.** A value that is neither said nor shown goes under `unknowns`, not into a step.
4. **Our own words.** Do not reuse the narrator's sentences. Do not name the creator, the channel, their products or their project's layer and file names; describe the example generically ("a white logo on a pale background").
5. **Look sparingly.** At most 10 small frames per technique; choose them from the timeline (frames where values changed, and the last frames of the technique, where the result plays). Crop instead of opening more frames.
6. **Say what the author dwells on.** Name the element or step the author spends longest on or stresses.
7. **Find the result.** Record when the finished effect is visible in the viewer and where the viewer's picture is in the full-size frame at that moment (the picture only, without panel edges), so a build can be compared with it.
8. Write only inside `STUDY/recipes/` and `STUDY/scratch/`. Do not edit tracked files. Do not use After Effects.

## What failed the check on the first video (avoid these)

- **A frame cited for something it does not show.** Before you write `shown fNNNNNN`, look at that frame (or a crop of it) and confirm it shows exactly that value or state. A value still being dragged, a menu still open, or a switch not yet clicked does not count: cite the frame where it has landed.
- **Result windows that do not hold.** The recording's editor zooms, pans and rearranges panels every second or two, so a crop is only right for a short stretch. Give a narrow window in which your crop holds the finished picture from start to end (cut a frame at each end and check), and name a clean frame: no mouse arrow, no selection handles, no dialog, no viewer label or panel border inside the crop. Cut one from `source.mp4` if no kept frame is clean. When the result is in a panel, not the viewer (a timeline change, for example), crop that panel.
- **Menu paths and shortcuts tagged `said`.** If the narrator only names the action ("duplicate", "make a solid") and the menu is not on screen, the menu path or shortcut is `inferred`.
- **Steps done on screen without a word.** Watch for a layer's eye switched off and on, a layer dragged up or down the stack, effects enabled one at a time, a property changed in a dialog. If the result depends on it, it is a step.
- **The finished example made a different way.** Sometimes the author demonstrates one route (keyframes) while the finished example on screen is driven another way (an expression, a preset). Say which is which and what is not shown.
- **Eight or more words in a row from the narration,** or the example's own on-screen sentence, or a name from the creator's project or products.
- **"Longest on" guessed.** Time it: seconds on screen for each part, from the frame numbers.
- **No sizes.** Builders working from the first video's recipes had to guess every size (a ring's diameter, how far a pivot sits from its layer), because tutorials rarely say them. Measure the main elements on the result frame as shares of the picture and give them in `layout`.

## Output

One file per technique: `STUDY/recipes/<n>-<slug>.md`, exactly in this form.

```
## <Name, in our own words>
id: <n>-<slug>
status: unproven
source: <video id> <start>–<end> s
jobs: <one or more of: lines and shapes; layout and repetition; depth and finish; shadows and light; energy and impact; camera and 3D; type; texture; glow and colour; transitions; trending formats; B-roll scenes; workflow>
what it does for a beat: <one or two sentences: when a designer would reach for this>
what it looks like: <one to three sentences on the finished look in the tutorial's own example, described generically>
ingredients:
- <effect or feature> — <stock | paid | built-in>; <menu path if said or shown>
steps:
1. <what to do> (said | shown fNNNNNN | inferred)
   - <Property>: <value> (said | shown fNNNNNN | inferred)
layout: <sizes and positions of the main elements as shares of the picture, measured on the result frame: "ring diameter about 37% of the picture height, centred"; mark each `measured`>
timing and easing: <keyframes, durations, eases given; or "none given">
variations: <what the author says can be changed; or "none given">
pitfalls: <warnings the author gives; or "none given">
longest on: <what the author spends longest on or stresses>
build notes: <how to do this by script in After Effects: effect and property names as After Effects shows them, anything that can only be done by hand in the interface>
result: start=<s> end=<s> <still | animated> crop=<x,y,w,h> frame=fNNNNNN
before: <frame showing the starting state, if any>
unknowns: <values or steps the video does not give>
```

Finish with a short report: for each technique, one line on how sure you are and what you could not read.

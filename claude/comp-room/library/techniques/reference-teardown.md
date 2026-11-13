# Tearing down a reference's motion, and checking a build against it

A reference is a finished piece by someone else: study how it moves, then build in its manner. This technique measures the reference from its video file, turns the measurements into a table of moves and a beat sheet, and after the build, measures the build the same way and compares the two move by move. It does not fetch anything: give it a file. It does not write the brief either: what the piece is about, and which moves to borrow, are the director's.

## When to use it

- The user hands over a reference video and wants a piece that moves like it.
- A build "feels off" against a reference and the difference has to be named in frames, not adjectives.
- A build's own render needs checking against the moves it was meant to have.

## The loop

1. **Shots.** `video.shots { file, outDir }` gives the cut frames, one-frame swaps inside a shot, flashes set aside, the shots, a contact sheet per shot and five frames round each change. Look at the strips before believing a count.
2. **Census.** `video.census { file, outDir, band }` classes each 0.1 s of a band of the frame as calm, local movement, whole-stage travel or a cut, and gives the cadence: how often it moves, how long the calm stretches are. Pick the band where the stage is (default 15 % to 60 % of the height).
3. **Tracked moves.** For each move worth borrowing, `video.track { file, outDir, region, start, end, ref, ink }`. The region is a box round the thing in the reference frame (`ref`, where it is at rest), in pixels or as shares of the frame. The span runs from a little before the move to a little after it: a span that starts or ends mid-move gives a partial move. You get the move in `motion.curve`'s terms, three fits (After Effects ease, linear, spring) with their rms, the best one and by how much, two durations, and keys ready to apply. Add `ink` (below) whenever the thing is not a rigid picture.
4. **The table and the beat sheet.** `video.moves { outDir, tracks, shots, census }`. Each move is marked:
   - **measured:** from the picture, its fit within an rms of 0.05;
   - **inferred:** a value you carry by hand, with its reason;
   - **untested:** named but not tracked.

   The beat sheet is in the brief's scene form, with the measured events filled and the rest left for you.
5. **Build.** Apply each measured move's `apply.keys` with `keyframe.apply`: two keys with their influences, speeds at zero. A spring comes three ways:
   - linear keys to the moment it first reaches its end value;
   - the library's spring (`motion-jsx`): `value + v × amp × sin(freq × t × 2π) / exp(decay × t)` after the last key, with `freq`, `decay` and `amp` given;
   - `baked` keys, one a frame, when an expression is not wanted.
6. **Compare.** Two checks:
   - `reference.report` and `reference.compare` on the same spans, for look and colour;
   - `motion.compare_moves`, per move, for motion, against both the property (`comp, layer, property`) and the build's render (`video.track` on the rendered file, then `buildTrack`).

   You get sentences such as "move 7 (position): duration 14 frames against 12, outside tolerance". The render is the one that counts. On the first full piece, a zoom checked on its property passed while the picture was 15 % off, because the speaker leaned.

## Real files are not clean

References come out of social apps re-encoded. The tools read each frame's own timestamp, not its index over a rate:
- **Variable frame rate:** said in the reply.
- **A piece made at 24 fps inside a 30 fps file:** it repeats every fifth frame. The cadence and the likely original rate are reported, and moves are fitted on the unique frames at their own times.
- **Frame numbers:** given at the source's own rate and at `atFps` (default 30). Convert a study's frames before comparing; a 24 fps study's 12 frames are 15 at 30.

## What is not measured

Every track says so in its reply:
- rotation;
- skew and perspective;
- motion blur and its shutter;
- colour and tint change;
- depth;
- anything outside the region's own picture (shadows, reflections).

Ink that grows (a draw-on stroke, a word fading in letter by letter, a flicker) is not a region that moves: measure it with the ink measure below, not the match.

When the tracker loses its region, it says at which frame and fits nothing past it. A fit of noise is not a measurement:
- a frame matched under 0.8 is no match;
- a move whose frames match under 0.85 at the median is marked **uncertain**, not measured, because on real files a wrong lock matched at 0.6 to 0.8;
- every fit carries its rms on the move normalised to 0..1: under 0.03 is a clean fit, over 0.05 is marked loose.

## Two measures: the match and the ink

- **The match** follows a template of the settled frame: right for a rigid thing sliding or scaling moderately on a steady ground.
- **The ink** (`ink: { box, mask, curves }`) masks a fixed box per frame and reads the mask's bounding box (`x0`, `x1`, `y0`, `y1`, `width`, `height`), `centroid`, `size` (square root of its area) and the box's mean `level`. The mask is by luma (`luma: [lo, hi]`), by the darkest channel (`minChannel`, white ink on colour), by hue (`hue: [from, to]`, `minSat`, `minVal`), by a colour (`rgb`, `tol`), or by difference from a frame the caller names as empty (`empty: seconds`). Reach for it for anything that grows from nothing, draws on, fades, glows or blurs: a template of the settled frame cannot hold those, and a mask can. It is how the hand studies measured almost everything.
  - A moving ground defeats the difference from an empty frame.
  - The box is fixed: something that travels across it while the camera moves is better matched.
  - Name the curve that is the move: the edge a slide leads with, the width of a thing that grows, the level of a fade or a draw-on.
- **Both, where both can run.** When the two see the same move, agreement within 2 frames and 5 % marks it measured; disagreement reports both and marks it uncertain. A weak or partial match is no second measure: it is reported beside the ink and cannot overrule it.

## Not seen is not measured

- **Partial.** A move already moving at the first frame measured (it entered from outside the frame or the search, or it was blurred out of the match) has its start unseen: its duration, distance and ease out are not measured, only the settle. Likewise a move still moving where the measure stops has its end unseen. A partial move carries no keys.
- **Its start is seen** when it begins at a cut (a shot's first frame, the move already under way: an ease out of 0), or when the thing appears in an empty box away from the box's edges. First seen at the box's edge, it is entering, already moving.
- **Moves never span a cut.**
- **The witness.** Plain frame differencing in a box round everything the region touched gives the frames over which anything there changes at all. It survives blur, scale and non-rigid change. When it outlasts the frames a measure covers by more than 2 frames, the move is marked uncertain: "the region changes from frame a to b; the track covers c to d". On a moving ground the witness says it cannot see.

## Three durations, named

- **Visible** (`duration.seconds`, `duration.visible`): from the last frame at rest to the first frame that stays within 2 % of the end value. This is how the hand studies counted a move (one of them gave both its 98 % span and the span to its last changed pixel: 69 and 88 frames). Compare a study's numbers and a build's render with it; `motion.compare_moves` does.
- **Keys** (`duration.keys`): the free fit's two keys, what is set in After Effects. A slow ease in puts the last key well after the move looks finished, so these run longer.
- **Witness** (`witness`): to the last frame of any change at all.

The influences to compare with a study are `fits.easeVisible` (keys held at the visible span's ends); the keys to build with are `apply.keys`.

## Not measured, by design

Whole-stage travel where the content leaves the frame (a pan or a whip that carries one picture out and the next in) is not measured: each thing in it enters or leaves partial, and the tool does not yet add up frame-to-frame shifts of the whole stage. Mark such a move inferred, with the hand's numbers, or untested.

**A fast pan reads as a cut.** `video.shots` and the tracker call a fast pan a cut: on one whole reel, 4 of its 6 pans, the fastest at 186 px a frame. A fast move on the first frame after a real cut reads as a second cut. Look at the strip round every cut before building one: a build that cuts where the reference pans is the wrong build.

## Values that worked

- Cuts: change at least 12 out of 255 on a 64 × 36 grey picture, and 4 times the median of the 12 frames each side.
- One-frame swaps: by region. No global scene score caught swaps between two dark pictures, or cuts on the same paper background.
- Census: 16 px blocks matched within 6 px on a picture 320 px on its long side.
  - Travel: at least half the textured blocks moved.
  - Calm: under 0.4 % of the band changed.
  - A dark stage reads calmer than it looks.
- Tolerances that suit a hand study's own precision: duration within 2 frames at 30 fps, distance within 5 %, ease within 10 points, spring A within 0.05, f within 0.15 Hz, d within 1 per second. Tighter ones (1 frame, 2 %) hold on clean synthetic clips.

## How far it is tested

- **Synthetic clips with known moves:** each case holds at 1 frame, 2 % and 10 points:
  - an After Effects ease, a linear move, a spring, a scale and a fade;
  - a slide over a moving ground;
  - a variable-rate file and a 24 fps piece in 30.

  A slide that enters from outside the frame, and a slide blurred through its first half, come back partial or uncertain, never as a clean fit. Every cut and one-frame swap is found, with no false ones.
- **A hand study of 15 moves on real reels** (tuned on it): 5 within its tolerances on the first run; 6 on the second, with the ink measure, partial moves, the witness and the visible span. The misses:
  - **blurred whips:** the match fails inside the blur, and a fixed box cannot follow the line;
  - **a slide that settles into a slow drift:** the drift is joined to the move, which then runs long;
  - **a label growing from a few pixels** beside an axis line that the camera moves into the box;
  - **a pop with heavy blur;**
  - **a glow on a moving camera** (the box is fixed);
  - **a draw-on** that both measures time right but that disagree, so it is marked uncertain.
- **A second study, held out, run once with no tuning:** 2 of 14. Run again after its failures were read: 0 of 14, more of them honestly partial or uncertain (a slide from the frame's edge, a whip, a pan) and five still measured but wrong, mostly on duration.
- **A whole reel, against its own hand measurements:** 1 of 10 within. Its cuts were 6 of 7 right; it also found 6 false cuts, 4 of them fast pans. A build of one stretch, compared on its render: 1 of 6 measured moves within; on its properties: 2 of 5.
- **Still confidently wrong at times:** across those three second runs, 12 moves are reported measured (4 loosely) and miss the hand, mostly on duration. Read every track's frames before trusting its numbers.
- **The census:** 97 to 99.8 % agreement with a study's own labels, step for step, on five reels, one of them a dark stage.

## Checks

1. Every cut and swap in `shots.json` matches its strip by eye.
2. Each track's `lost` is null over the span you fitted, and its best fit's rms is under 0.05.
3. A move fitted as a spring shows a visible overshoot in its curve. A spring that fits slightly better than an ease on a move that never overshoots is noise; the `margin` says by how much it won.
4. The build passes `motion.compare_moves` on its render, not only on its properties.

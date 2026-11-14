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

The influences to compare with a study, or a build with its reference, are `fits.easeVisible` (keys held at the visible span's ends); `motion.compare_moves` uses them on both sides. The keys to build with are `apply.keys`.

`motion.compare_moves` also:
- compares a one-frame move (a pop, a hard replace) on its duration and distance only;
- compares scale as a ratio, end over start;
- says when the build makes a move as two where the reference has one, or the other way round.

## Pans, cuts and the stage's travel

- **A pan is not a cut.** At every cut candidate, `video.shots` registers the frame on the one before under a whole-frame shift. Two frames of one picture, panned fast, match at some shift; two different pictures match at none. A pan is listed under `notCuts` with its shift in source pixels a frame, and it ends no shot. Candidates within 3 frames of each other are one change, and its largest frame decides: a pan's looser first and last frames go with it, and a cut stays on the first frame that changed. `video.track` takes its cuts from the same shot list. The census's cut class is the census study's own rule, and a fast pan can still read as one there: `video.shots` is the authority on cuts.
- **Still read as cuts:** a picture that changes inside a shot without a whole-frame shift. On one reel these were a car launching, a card's flip, and a bar growing beside a scan line. None of them registers, and no rule here separates them. Look at the strip round every cut before building one: a build that cuts where the reference pans is the wrong build.
- **The stage's travel** (`video.track` with `stage: true`, or `stage: { band: [top, bottom] }` to leave out what is fixed to the frame, such as a caption rail). Each frame is registered on the one before, coarse to fine with a sub-pixel peak, and the shifts are added up as a `stage` move: its distance, the three durations, the fits and keys, like any move.
  - **Measured:** the whole picture's shift across a span, inside a shot, in one plane.
  - **Not measured:** travel across a cut (the sum starts again), across a frame that does not register (a gap, named in the reply, which leaves the move partial), parallax (layers moving at different speeds read as one compromise shift), and zoom or rotation of the stage (`video.track` without `stage` measures a scale).

## A slow drift is not the move

A slide that settles into a slow creep is two moves. Where a move's speed falls under 10 % of its peak and stays there, in one direction and not dying away (a settle decays to rest, and a spring's tail turns back), the move ends near where its speed comes down to the drift's own. The drift is reported as its own move, with its speed (`drift`). The move's `seen.ends` says `"drift"`.

## Values that worked

- Cuts: change at least 12 out of 255 on a 64 × 36 grey picture, and 4 times the median of the 12 frames each side.
- Not a cut (a pan): the frame registers on the one before with a normalised cross-correlation of at least 0.85 over the overlap, every shift up to half the frame, and that shift leaves at most 0.35 of the change. On drawn clips, pans scored 0.875 to 1.0 with leftovers up to 0.34; cuts scored 0.19 to 0.795 with leftovers from 0.47. The clips were a blurred eased pan at up to a quarter of the width a frame with a chip fixed to the frame, a cut between two layouts on one paper ground, and a cut followed by a fast move.
- The stage's travel: the same score, 0.85, frame to frame. Inside a shot the leftover is not used: between two slow, blurred frames it means little.
- A drift: speed under 10 % of the move's peak, staying there for at least 6 frames, chosen on a drawn slide of 240 px handing over to a creep of 0.8 px a frame.
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

  Other drawn clips:
  - A slide that enters from outside the frame, and a slide blurred through its first half, come back partial or uncertain, never as a clean fit.
  - Every cut and one-frame swap is found, with no false ones.
  - A blurred fast pan, at up to a quarter of the width a frame, is a pan, not a cut. Its travel measures 592.8 px against 600, with a visible span of 12 frames against 11.
  - A cut followed by a fast move is one cut, on its first frame, and a cut between two layouts on one paper ground is still a cut.
  - A slide handing over to a creep measures 240 px against 240 and 15 frames against 15, with the creep reported apart.
- **A hand study of 15 moves on real reels** (tuned on it): 5 within its tolerances on the first run, 6 on the second and 6 on the third, after the fixes for pans, travel, drift and comparison. On the third run the misses are:
  - a slide that runs on into the next cut, so its "drift" speeds up and is no drift, and runs long;
  - a label growing from a few pixels beside an axis line;
  - a pop with heavy blur;
  - a whip;
  - a glow on a moving camera;
  - a draw-on that both measures time right but that disagree, so it is marked uncertain.
- **A second study:** 2 of 14 held out, run once with no tuning; 0 of 14 on the second and third runs, after its failures were read. Two of the third run's misses are worth naming:
  - A whip whose end the old tracker called a cut is now, by `video.shots`' own rule, a flash, so the move runs on into the next picture and reads 45 px against 301.
  - A card's drop followed by a creep is split where the hand took one ease (55 px over 10 frames against 64 over 17).
- **A whole reel, against its own hand measurements:** 1 of 10 within. Its cuts:
  - before the fixes, 6 of its 7 hard cuts and 6 false ones, 4 of them fast pans;
  - after the fixes, the same 6 of 7 and 3 false ones (a car launching, a card's flip, a bar growing), with all six pans read as pans;
  - missed: a cut to two empty grid frames, and a cut to black (set aside as a flash).

  The stage's travel on its factory pan is 668 px against the hand's 674, a visible 17 frames against 17, and ease 70 / 53 against 70 / 52. A build of one stretch, compared on its render, came to 1 of 6 measured moves within. Mended where the tool had put a cut for a pan, the build's pan is within on its render: 720 px against 724, 20 frames against 20.
- **Still confidently wrong at times:** across the three third runs, 12 moves are reported measured (5 of them loosely) and miss the hand, mostly on duration. Read every track's frames before trusting its numbers.
- **The stage's travel reads any whole-band change as a shift.** A thing growing from a point inside the band reads as travel, so give it a span that holds the pan and no more.
- **The census:** 97 to 99.8 % agreement with a study's own labels, step for step, on five reels, one of them a dark stage.

## Checks

1. Every cut and swap in `shots.json` matches its strip by eye.
2. Each track's `lost` is null over the span you fitted, and its best fit's rms is under 0.05.
3. A move fitted as a spring shows a visible overshoot in its curve. A spring that fits slightly better than an ease on a move that never overshoots is noise; the `margin` says by how much it won.
4. The build passes `motion.compare_moves` on its render, not only on its properties.

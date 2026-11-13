# Tearing down a reference's motion, and checking a build against it

A reference is a finished piece by someone else: study how it moves, then build in its manner. This technique measures the reference from its video file, turns the measurements into a table of moves and a beat sheet, and after the build, measures the build the same way and compares the two move by move. It does not fetch anything: give it a file. It does not write the brief either: what the piece is about, and which moves to borrow, are the director's.

## When to use it

- The user hands over a reference video and wants a piece that moves like it.
- A build "feels off" against a reference and the difference has to be named in frames, not adjectives.
- A build's own render needs checking against the moves it was meant to have.

## The loop

1. **Shots.** `video.shots { file, outDir }` gives the cut frames, one-frame swaps inside a shot, flashes set aside, the shots, a contact sheet per shot and five frames round each change. Look at the strips before believing a count.
2. **Census.** `video.census { file, outDir, band }` classes each 0.1 s of a band of the frame as calm, local movement, whole-stage travel or a cut, and gives the cadence: how often it moves, how long the calm stretches are. Pick the band where the stage is (default 15 % to 60 % of the height).
3. **Tracked moves.** For each move worth borrowing, `video.track { file, outDir, region, start, end, ref }`. The region is a box round the thing in the reference frame (`ref`, where it is at rest), in pixels or as shares of the frame. The span runs from a little before the move to a little after it. You get the move in `motion.curve`'s terms, three fits (After Effects ease, linear, spring) with their rms, the best one and by how much, and keys ready to apply.
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

Ink that grows (a draw-on stroke, a word fading in letter by letter, a flicker) is not a region that moves. Measure it as opacity over a fixed box, or mark it untested.

When the tracker loses its region, it says at which frame and fits nothing past it. A fit of noise is not a measurement:
- a frame matched under 0.8 is no match;
- a move whose frames match under 0.85 at the median is marked **uncertain**, not measured, because on real files a wrong lock matched at 0.6 to 0.8;
- every fit carries its rms on the move normalised to 0..1: under 0.03 is a clean fit, over 0.05 is marked loose.

## Two ways to time a move

- **As seen** (`duration`, `fits.easeSeen`): its keys where it crosses 1.5 % and 98.5 % of its travel, interpolated between frames, with the influences fitted between them. This is how a study times a move by hand, from when it visibly starts to when it visibly stops. Compare it with a study's numbers, and use it in `motion.compare_moves`.
- **The keys that rebuild it** (`fits.ease`, `apply.keys`): After Effects' two keys with free times, the lowest rms. A slow ease in puts the real last key well after the move looks finished, so these keys run longer than the move as seen. Use them to build.

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

  Every cut and one-frame swap is found, with no false ones.
- **A hand study of 15 moves on real reels** (tuned on it): 5 within its tolerances. The misses:
  - **blurred whips:** the match fails inside the blur;
  - **growth from a few pixels:** a 10 % label, a card at 32 % on a low-contrast page;
  - **pops with heavy blur;**
  - **regions that are not rigid:** a draw-on, a glow pulse, a word fade;
  - **two eases a few points outside 10.**
- **A second study, held out, run once with no tuning:** 2 of 14. The tool does not yet generalise to moves like these, so read every track's frames before trusting its numbers.
- **The census:** 97 to 99.8 % agreement with a study's own labels, step for step, on five reels, one of them a dark stage.

## Checks

1. Every cut and swap in `shots.json` matches its strip by eye.
2. Each track's `lost` is null over the span you fitted, and its best fit's rms is under 0.05.
3. A move fitted as a spring shows a visible overshoot in its curve. A spring that fits slightly better than an ease on a move that never overshoots is noise; the `margin` says by how much it won.
4. The build passes `motion.compare_moves` on its render, not only on its properties.

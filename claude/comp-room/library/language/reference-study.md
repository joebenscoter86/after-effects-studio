# Learn from references without flattening them

The pipeline's strongest changes came from measuring a short shot and comparing a native study against it. A prose description such as “dynamic,” “cinematic” or “premium” omits the mechanics that matter.

## Inspection sheet

Record source identity, shot bounds, source fps, output format and what you actually inspected. Extract frames at known timestamps; label them with source frame numbers. For a 3–4s shot, inspect the full temporal sequence, then isolate the action peak and hand-off. A contact sheet is sampled visual evidence, not continuous audiovisual playback.

Measure: main object bounding boxes and anchors; trajectory by frame; rotation/scale; title size and reading duration; palette and contrast; overlap/order; camera move duration; hold length; material/shadow direction; draw-on/reveal sequence. Quantify the visual operation before picking numerical presets.

## Measure the reference and the build

When the user gives a reference to match (a still, frames, or a movie), measure it, measure the build the same way, and fix the differences largest first. Looking alone missed all three of the differences below in a build that lost a blind comparison.

1. **Report on the reference.** `ae_do { operation: "reference.report", args: { path, outPath, regions } }`. `path` is a PNG still, a folder of PNG frames (name order; give `frameRate`), or a movie. Stills and folders are read in Node. A movie is decoded by ffmpeg in Node when ffmpeg is installed (the reply says which colour matrix and range were read from the file and which were assumed); without ffmpeg, or with `via: "after-effects"`, it is brought into a throwaway comp and rendered by frame number, then removed. On five delivered 1080 × 1920 reels, 400 frames each, the two read the same: levels within 0.0013, CIELAB within 0.04, edge width and grain within 0.02. ffmpeg read the five in 562 s, After Effects in 984 s; most of either is the measuring itself, about 3 s for each of the 24 frames colour and texture are read on. `outPath` is where the report is saved (.json). Name the parts you mean in `regions` ({ name, x, y, width, height }, frame pixels; `role: "neutral"` for a surface that should read grey), for example the room's shelves, a wall or a headrest, so the differences use those names. Otherwise they use the grid's nine regions (top left to bottom right).
2. **Report on the build, against it.** `ae_do { operation: "reference.report", args: { comp, outPath, regions, against: <the reference's outPath> } }`. The build is rendered by frame number and read one chunk at a time. `compare` lists every difference over its step, largest first:
   - a cast: CIELAB a* or b* differing by 2 or more, region by region, with the direction in words;
   - lightness: 3 in L*;
   - sharpness and grain: a quarter either way in edge width or grain;
   - levels: 0.02 in the black point, white point or mean;
   - the moving subject's size (5%) and place (3% of the frame);
   - where the weight of brightness and of detail sits;
   - main colours of the reference the build lacks;
   - cuts one has and the other does not;
   - how much the picture moves.
   `reference.compare` compares two saved reports without After Effects.
3. **Fix the largest, then measure again.** The steps are starting points, not judgments. A difference may be the user's intent (a softer room on purpose). Say which you are keeping and why.

**Frames that are not neighbours.** A folder cannot say how far apart its frames are. Pass `frameStep` (1 for neighbours). Without it the step is read from numbers in the file names. Names that count up by one, as ffmpeg numbers frames it pulls, and names with no numbers are checked against the change between neighbouring files: a median of 0.02 or more reads as frames far apart (on the round-two movies, every twentieth frame read 0.026 and 0.029, every frame 0.007). That is a guess, and `notes` says so. On frames that are not neighbours, cuts and movement are not read or compared. The motion map then shows what differs across the frames read: the subject's size from it rests on spread frames, and the compare says so. Every twentieth frame of the round-two pair still put the subject at 81 to 82%, at correlation 0.68 to 0.71 against 0.93 on every frame.

**How the subject's size is found.** Each report keeps a motion map: the mean change between frames per 16 px cell, with cuts left out. In a talking-head shot the person is what moves. The compare lines the build's map up with the reference's, searching scales 0.5 to 1.6 and shifts round their centres. It names a size and place only when the two match as the same footage (correlation 0.6 or more). On other footage it says so and leaves the size out.

**Measured on the round-two head-to-head** (2026-11-10, green-screen passage, 235 frames at 1080 × 1920). The code build that won was the reference, and the After Effects build that lost was the build. Both were read from their delivered files, offline, as PNG frames. The referee had seen three things by eye: a heavy magenta cast on him, him smaller in frame, and a blurred room. With two room regions named (the shelves on the left, the wall on the right), the compare's three largest differences were those three:

- **Sharpness:** the build is softer in the room: the wall on the right 16.5 px against 4.5, the shelves 13.9 against 8.0, top left 8.2 against 4.1.
- **Cast:** the build leans magenta in 10 of 11 regions (a* +3.9 and b* +2.0 on average; the middle reads a* 16.9 against 10.9).
- **Subject size:** the moving subject is 81% of its size in the reference (the two maps lined up at correlation 0.93). The build's own notes set him at 78%, with a slow camera creep on top.

With the grid alone the same three came first, in the order cast, subject, sharpness. After them: lightness in five regions, less grain in nine (the blur took the grain out too), and a cut at frame 1 in the build only, which is its first frame. Both builds read the cuts at frames 123 and 125, the stray source frames before the cut. Reading 235 frames took about 2 minutes a build offline, most of it decoding the PNGs.

**Checked live** (After Effects 27.0, on a copy of the round-two project):

- **Exact frames:** a movie imported as footage rendered the right frame through `ae_render_frame` `frames` on all 32 tried at 30, 29.97 and 24 fps. With `times`, the 29.97 fps movie also rendered the right frames, but every time from frame 26 on sat on a frame boundary (`frameWarning`), so the report addresses frames by number.
- **The whole report:** on the code build's delivered movie (235 frames, 314 s) and on the After Effects build's comp `H3_MAIN` (235 frames, 317 s), with `against`. Nothing was added to the disk cache; free space dipped while After Effects swapped memory to disk and came back afterwards.
- **The order:**
  - grain first: the build smoother in eleven regions, top 0.22 against 0.93;
  - then the soft room: the wall on the right 16.9 px against 4.7;
  - the magenta cast: 10 of 11 regions, a* +3.9;
  - the subject at 80% (correlation 0.94).
- **Why grain came first live:** the comp renders without the H.264 noise of the delivered reference, so its grain reads lower than the file's. Compare a comp with a rendered file of the reference, or a movie with a movie, where grain matters.
- **Cuts:** the comp reads a cut at frame 18, the slam flash; the delivered file read one at frame 1 instead.

## The user's own look: a look sheet

When the user has pieces they approved, measure them once and keep the result, so a new piece is compared with their look without being told it again. `reference.sheet { pieces: [{ label, path }], outDir }` measures each piece as `reference.report` does, adds its rhythm (`video.census` over the whole piece, and `video.shots`), and writes `sheet.json`, a readable `sheet.md` (pieces named by their labels) and one file per piece. `reference.sheet_add { sheet, piece }` adds a piece without measuring the others again.

- **What it holds.** For each measure, the middle value, the lowest and highest piece, and how many pieces it rests on:
  - levels;
  - colour by region;
  - edge width and grain;
  - the centres of brightness and detail, and the moving subject's place;
  - the rhythm: calm, local and travel shares, travel moves a minute, calm runs, bursts, shot lengths and cuts a minute;
  - the main colours, matched across pieces.

  Type comes only from a comp's project (`{ label, comp, project: true }`): from a movie alone it is not measurable, and the sheet says so.
- **What is the look.** A measure whose range across the pieces stays within 3 of `reference.compare`'s own steps is part of the look. Wider, it "varies in your pieces" and is never compared. A main colour is part of the look when two thirds of the pieces carry it.
- **How many pieces.** One piece is its own numbers. Two give a range, not yet a look. Three or more are a look, and the sheet says how many every time. Under eight pieces the ranges are narrow, and the sheet, its page and every comparison say so: a piece of the same look will sit just outside several ranges. On one user's reels, a fifth piece held out from a sheet of four sat inside on 23 of the 32 measures compared. Some of the other nine were real (a cooler room, darker graphics, a busier cut), and some were the arithmetic of four pieces. Read the largest differences first, and add approved pieces to widen the sheet.
- **Compare a build with it** before hand-over: render the build to a movie, then `reference.report { path: <render>, outPath, rhythm: true, against: <sheet.json> }`, or `reference.compare { reference: <sheet.json>, build: <saved report> }`. Only the look's measures are compared, each against the user's own range, with how far outside it is: "black point 0.09; your pieces sit between 0.02 and 0.04 (4 pieces) (2.5 steps outside)". Inside the range, or within one step of it, is no difference. There is no pass or fail.
- **It describes what the user did, not what they must do.** A piece meant to look new will read as different; say which differences are the point.
- **Not in it:**
  - a cut-out's edge;
  - the tracker's per-move numbers;
  - type from a movie.

  The shot lengths carry the shot list's limit: a change inside a shot can read as a cut.

## Rebuild a bounded study

Where permitted, reproduce one short mechanism in a separate study comp. Align reference-left/study-right renders on the same frame, then compare middle and endpoint. Off-by-two-to-four-frame labels once hid a timing mismatch until the side-by-side exposed it. Don't assume equal timestamps mean equal frame alignment after trimming or retiming.

Transfer what the study teaches to a new subject and style. Do not ship someone else's branding, paid assets or exact finished scene as your original. A reference can establish a technique without supplying redistributable media.

## Evidence classes

- Measured: positions, values, times and sampled counts observed in a specific reference.
- Inferred: a reason the movement may work, such as maintained identity or a clearer landing.
- User-approved: a particular artifact the user liked, at the scope they approved.
- Untested: a new adaptation or genre. Preserve the mechanism, then render to validate.

The 66-project mining study yielded 307 unique moves after collapsing near-duplicate templates. It was dominated by a few pack styles; it did not inspect every move's final on-screen result or measure audience response. Use the easing/stagger observations as technique evidence, not universal creative law.

## When no reference is supplied

Use the plugin's worked scenes and measurable motion grammar as a starting point. Choose a distinct subject, palette and typographic hierarchy from the brief. Write the assumptions. Build and critique a representative scene instead of asking the user to design everything. Do not invent a reference you did not inspect.

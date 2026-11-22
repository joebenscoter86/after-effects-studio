# Arsenal recipes: Picture jobs: how the picture has to read, whatever the line says (part 2)

Generated from the recipe drafts; do not edit by hand. Recipes whose primary job is in this group. Find candidates for a beat with ae_arsenal find; read one with ae_arsenal get, or a section here by its heading.

## Stepped jitter and black-and-white photos for a hand-made finish
id: 05-stop-motion-jitter-and-mono-finish
revision: 3f58811c
job: finish-the-look; support: keep-it-alive
status: proven (accepted 2026-11-21)
what it does for a beat: Takes a clean, flat infographic and gives it a cut-out, stop-motion feel: photos go monochrome, each one twitches on its own a few times a second, the whole frame shakes slightly and all motion steps at a low frame rate. Reach for it when a data beat looks too slick or digital.
what it looks like: The same infographic (a lime and pale-blue phase bar with labels, six cut-out photos below joined by small white arrows, on black) now has grey photos while the bar keeps its colour; every few frames each photo hops a few pixels in a random direction, independently of the others, and the whole picture hops a few pixels together at the same moments; the bar's draw and the photos' pops step rather than glide.
ingredients:
- Pre-compose — built-in (Layer > Pre-compose; menu not shown)
- Adjustment layer — built-in (Layer > New > Adjustment Layer, shortcut said as Option+Command+Y)
- Hue/Saturation — stock (Effect > Color Correction > Hue/Saturation; added through a search panel)
- Expressions posterizeTime() and wiggle() on Position — built-in
- Posterize Time — stock (Effect > Time > Posterize Time)
- Transform — stock (Effect > Distort > Transform)
steps:
1. Select all six photo layers and pre-compose them into one photo precomp (said; shown : the precomp holds the six photo layers, which still carry their pop-in animation).
2. Inside the photo precomp add an adjustment layer at the top and put Hue/Saturation on it (said; shown).
   - Channel Control: Master (shown)
   - Master Saturation: −100 (shown)
   - Master Hue 0, Master Lightness 0, Colorize off (shown)
   - The author tries Tritone on the same layer as an alternative (sepia or a project colour; said; shown with Highlights white, Midtones brown, Shadows black) but keeps plain black and white: the photos render grey with no tint (shown). Tritone is not part of the result.
3. On one photo layer, Option/Alt-click Position's stopwatch and type this expression (said; shown, full-size crop):
   ```
   posterizeTime(6)
   wiggle(222,3)
   ```
   - The narration's "222 comma three" is the screen's wiggle(222,3): frequency 222 per second, amplitude 3 px. With posterizeTime(6) the expression is only evaluated 6 times a second, and at 222 Hz each evaluation lands on an unrelated random offset, so the photo jumps to a new spot within about ±3 px every 4 frames (inferred from the expression; confirmed by measurement below)
4. Copy the expression only and paste it on Position of every photo layer (said: right-click > Copy Expression Only, paste onto all; the paste on the other five layers is not shown, but the result shows each photo moving on its own, measured below).
5. Back in the main comp, add an adjustment layer at the top with Posterize Time (said; shown).
   - Frame Rate: 12.0 (shown, full-size crop; the field read 24.0 before)
6. Add a second adjustment layer with the Transform effect for a whole-frame jitter (said; shown). In the timeline it sits second from the top, below the Posterize Time layer (shown).
   - Scale: 101.0, Uniform Scale on (shown)
   - Anchor Point 960, 540; Skew 0; Rotation 0; Opacity 100; Use Composition's Shutter Angle on; Shutter Angle 0; Sampling Bilinear — all left at default (shown)
   - Position: Option/Alt-click and enter the same expression as the photos (said); the screen shows posterizeTime(6) on line 1 and wiggle(222 being typed on line 2 when the video cuts (shown, cut frame :); the closing ",3)" is inferred from the words "the same expression" and from the readouts that follow, Position 959.6, 539.8 and 957.6, 539.3 (timeline note at 13:24), both within 3 px of 960, 540
7. Play it back (shown onwards).
layout: Measured on the clean result frame (cut from the source video; crop), calibrated on the black picture's own edges: 1804×1014 screen px for 1920×1080 (0.940 px per comp px). The photos are about 100 px across (about 5 % of the width, the bowl measured at 94 screen px), centred on a row at about 63 % of the picture height; the rest of the picture is made outside this recipe but is part of the result, so here are its figures, measured on the same crop: the phase bar runs from 47.5 % to 53.0 % of the height (5.5 % thick), lime (renders about 187, 236, 101) from 19.0 % to 62.6 % of the width and pale blue (renders about 145, 211, 223) from 63.2 % to 81.3 %, with a thin black gap between (colour warning: these two are recording colours, and a wide-gamut screen recording shows mid-tone greens and blues more saturated than the render; the lime's typed value, #BFF06C according to the check of the bar's own recipe, not shown in this window, comes through almost unchanged, while the pale blue's typed value was never shown, so treat its reading as approximate and match lightness rather than hue); two one-word white labels in a bold sans sit above it, each left-aligned with its segment, about 3.0 % of the height tall with their tops at 42.9 %; five small white arrows (3 px strokes, each about 40 comp px long with a curled two-barb head about 26 px tall) sit on the photos' row, centred at 28.2, 38.6, 49.0, 61.9 and 73.0 % of the width, one in each gap between photos.
  Every photo is grey: saturation removed fully, lightness unchanged; the bar segments, the labels and the white arrows keep their own colours because they sit outside the photo precomp.
  Jitter, measured over one played pass (viewer frames): the whole picture shifts together by up to about ±2.7 comp px on each axis (bar's left edge ranged over 5 screen px in x and 5 in y); each photo moves a further ±3 comp px or so on its own (the bowl's offset from the bar ranged over 6 screen px in x and 4 in y) while the arrows keep a fixed offset from the bar (±1 px, measurement noise), so the arrows carry only the whole-frame jitter. Photo hops and frame hops happen at the same instants, six times a second, because both use posterizeTime(6). No blur, no rotation in the jitter.
  The 1 % scale-up pushes the frame's edges out by about 9.6 px left and right and 5.4 px top and bottom, more than the jitter's reach, so no empty edge ever shows (inferred purpose; on this black ground it is not visible either way).
timing and easing: posterizeTime(6) on both wiggles: a new random position every 4 comp frames (23.976 fps). Posterize Time effect at 12 fps over everything below it: every other animation (bar draw, photo pop, arrow draw) advances only every second frame (inferred from the setting; the recording's preview ran slower than real time here — the time display went from 0:00:02:18 to 0:00:05:04, 58 comp frames, in about 81 recorded frames — so the stepping cannot be timed from the recording).
variations: Swap Hue/Saturation for Tint or Tritone to give the photos a sepia or brand-coloured look instead of grey (said; Tritone shown). Push the wiggle's values up or down to taste (said).
pitfalls: none given
build notes: Photo precomp: adjustment layer with "ADBE HUE SATURATION" (Master Saturation −100). Each photo layer: transform.position.expression = "posterizeTime(6)\nwiggle(222,3)". Main comp, top: adjustment layer with "ADBE Posterize Time" (Frame Rate 12); below it an adjustment layer with "ADBE Geometry2" (Transform): Scale 101 (uniform), Position expression the same two lines. Both adjustment layers must sit above every content layer (precomps, labels, bar, and any background solids added later) so the whole frame steps and shakes together. The comp is 23.976 fps on screen (the narrator says 24).
unknowns: The transform layer's finished expression is never fully on screen (",3)" inferred); the paste onto the other five photos is not shown, though all six photos' offsets from the bar change between hops in the played pass (median-position track of each), so all carry their own wiggle; the stacking inside the photo precomp beyond "adjustment layer on top" (shown); whether Tritone was deleted or switched off.

## Faint graph-paper backdrop
id: 06-faint-graph-paper-backdrop
revision: 089b44ae
job: fill-the-backdrop; support: finish-the-look
status: proven (accepted 2026-11-21)
what it does for a beat: Swaps a plain black ground for an off-white sheet ruled with tiny pale-blue squares, like school exercise paper, so a flat infographic reads as hand-made and educational rather than digital.
what it looks like: The phase-bar infographic (lime and pale-blue bar segments, labels now dark green, grey cut-out photos) sits centred on an off-white ground covered edge to edge with a very fine, faint blue-grey square grid; the grid is barely there, more a texture than lines.
ingredients:
- Pre-compose — built-in
- Solid (Layer > New > Solid; Solid Settings dialog shown) — built-in
- Grid — stock (Effect > Generate > Grid; added through a search panel, named on screen)
- Text fill colour — built-in
steps:
1. Select the infographic's content layers (bar, labels, photo precomp, arrow precomps) and pre-compose them into one content precomp; the two jitter adjustment layers (figures under layout) stay above it in the main comp (said "select all your layers"; shown : the main comp holds the Posterize Time adjustment layer, the Transform adjustment layer, then the content precomp).
2. Make a new solid at comp size and move it to the bottom of the stack (said: "a whitish" solid; shown Solid Settings and stack, the solid last).
   - Colour: #F3F3F3 (16-bit 31,226 per channel; shown, full-size crop)
   - Size: 1920 × 1080, square pixels (shown)
3. Inside the content precomp, select both phase labels and change their fill to a dark green so they read on the pale ground (said; shown both labels selected; Fill dialog shown on the cut frame).
   - Fill: #253814 (H 92°, S 63 %, B 22 %) (shown)
4. Centre the whole group in the frame, checking it against the viewer's grid overlay (said "open up your grid, center that up"; shown with the viewer's pink grid overlay on, and the group sitting centred on). The layer moved is the content precomp: it is the selected layer in the timeline before and after the move (shown). It goes up by about 60 px (inferred from the picture: the bar's top went from 47 % to 41.5 % of the height).
5. Make another solid named for the grid, place it directly above the ground solid and below the content precomp, and apply Grid to it (said; shown stack: content precomp, grid layer, ground solid). Its own solid colour does not matter because of the blending setting below (inferred).
6. Set the Grid effect (final values shown and held; full-size crop):
   - Anchor: 960.0, 540.0 (default, unchanged)
   - Size From: Corner Point
   - Corner: 977.0, 554.0 (dragged from the default 1152, 648, shown → mid-drag → landed). This makes each cell 17 px wide and 14 px tall (Corner minus Anchor), so the cells are slightly wider than tall (inferred from the values; matches the measured pitch below)
   - Border: 2.0 (changed from 5.0; said "something like two"; shown)
   - Feather: not opened (unknown; probably default 0)
   - Invert Grid: off
   - Color: #C0DEF8 (H 207°, S 22 %, B 97 %; shown with OK being clicked; the author passed through bluer #579DD8, #72B4EC, #86BEEE first)
   - Opacity: 100.0 %
   - Blending Mode: None (grid lines only, rest of the layer transparent — the effect's standard behaviour, inferred)
   - A yellow warning icon shows beside the effect name: the project is 16 bpc and Grid works in 8 bpc (icon shown; project's "16 bpc" shown; reading inferred)
layout: Measured on the clean result frame (calibrated on the picture's own edges: 2165×1218 screen px for 1920×1080, 1.128 px per comp px).
  Ground: flat off-white over the whole frame (reads 241 grey in the recording before the grid went on, between grid lines it reads about 235, 240, 243 — a faint blue cast the settings do not explain).
  Grid: covers the full frame, lines aligned so one crossing sits on the frame centre. Measured line pitch 19.25 screen px across and 15.75 down = 17 × 14 comp px, i.e. about 113 columns and 77 rows across the frame (cells 0.89 % of the width and 1.30 % of the height). Lines set 2 px; they render about 4 recording px wide and very shallow and nearly grey: a column average across a line is about 11 levels darker than the cells on every channel (cells ≈ 235, 240, 243; lines ≈ 224, 230, 233; the darkest line pixels ≈ 209, 216, 218), so the lines sit at roughly 5–10 % contrast. Warning: this is about a third of the ink a 2 px line of #C0DEF8 at 100 % over #F3F3F3 should leave, and at 1.128 recording px per comp px the viewer does not thin a 2 px line below a pixel, so zoom does not explain it; the Grid swatch itself still reads pale blue (about 181, 214, 240), and with Border 5 the lines read about 186, 209, 230. Why they render this faint is unknown (Feather, the 8 bpc effect in a 16 bpc project and the viewer are all possible). Keep the shown settings, and check a full-size render with a target that does not depend on zoom: the mean level of an empty patch of paper, grid included, is about 233, 238, 241, against 241 grey for the bare ground before the grid.
  Content (made outside this recipe, but part of the result; figures measured): the infographic is centred: its block runs from about 19 % to 81 % of the width (left edge of the labels to the right end of the pale-blue segment) and from about 37 % to 64 % of the height (top of the labels to the bottom of the photos). The phase bar runs from 41.5 % to 46.8 % of the height (about 5.5 % thick), lime (renders about 187, 237, 102) from 18.9 % to 62.5 % of the width and pale blue (renders about 144, 212, 225, median of the segment's core) from 63.2 % to 81.3 % (colour warning: these two are recording colours, and a wide-gamut screen recording shows mid-tone greens and blues more saturated than the render; the lime's typed value, #BFF06C according to the check of the bar's own recipe, not shown in this window, comes through almost unchanged, while the pale blue's typed value was never shown, so treat its reading as approximate and match lightness rather than hue). Two one-word labels in a bold sans sit above it, each left-aligned with its segment, about 3.0 % of the height tall with their tops at 36.9 %, dark green (render about 44, 56, 35 on average, anti-aliased). Six grey cut-out photos, each about 100 comp px across (about 5 % of the width), sit on a row centred at about 57 % of the height (they span 50 % to 64 %) and pop in one by one during the result window.
  The small white arrows between the photos (3 px white strokes, set up before this step) are not changed and vanish on this ground: in the result there are no visible arrows between the photos (shown).
  Everything, ground and grid included, sits under two adjustment layers set up before this step, so the paper shakes and steps with the scene (stack shown): on top, Posterize Time at Frame Rate 12; below it, Transform at Scale 101 (uniform) with the Position expression posterizeTime(6) then wiggle(222,3), which hops the whole frame within about ±3 px six times a second. Each photo also carries that expression on its own Position and is made grey by Hue/Saturation at Master Saturation −100 inside its precomp, so the photos twitch independently on top of the frame shake.
timing and easing: none given (the backdrop is static; it moves only with the whole-frame jitter described under layout)
variations: A bluish grid colour for an exercise-book look (said); the solid can be any near-white (said "a whitish").
pitfalls: Text that was white on black must be darkened for the pale ground (said). Not said but visible: white strokes (the arrows) disappear on it too.
build notes: Ground: solid 1920×1080, colour [0.953, 0.953, 0.953], at the bottom. Grid layer: comp-size solid with "ADBE Grid"; properties as After Effects shows them: Anchor [960,540], Size From = Corner Point, Corner [977,554], Border 2, Invert Grid off, Color [0.753, 0.871, 0.973], Opacity 100, Blending Mode None. Order from top: adjustment layer with "ADBE Posterize Time" (Frame Rate 12), adjustment layer with "ADBE Geometry2" (Scale 101, Position expression "posterizeTime(6)\nwiggle(222,3)"), content precomp, grid solid, ground solid. Change the label fill to [0.145, 0.220, 0.078]. Render a full-size frame and compare the line contrast with the measured target above before adjusting anything.
unknowns: Grid Feather; the grid solid's own colour; exactly how far the content precomp was moved to centre the group; why the cells read slightly blue and the lines render far fainter and greyer than the set colour (cause unknown).

## Faint grid held inside the chart's box, and the whole chart stepped to 12 fps
id: 09-grid-clipped-to-the-chart-area
revision: 6216762b
job: fill-the-backdrop; support: show-proof, finish-the-look
status: proven (accepted 2026-11-21)
what it does for a beat: Gives a bar chart a quiet graph-paper backing that stops at the chart's edges, and a slightly hand-made, stepped motion, so a plain data beat reads as designed rather than default.
what it looks like: Behind the four yellow bars a faint grey grid of near-square cells fills only a rectangle from the baseline up to a little above the tallest bar and from one end of the baseline to the other; the labels to the left sit on plain black. The bars and labels build on as before but in visible steps, each picture held for two frames.
ingredients:
- Solid with Grid — built-in; Effect > Generate > Grid (effect name shown; menu path not shown, inferred)
- Shape layer with a filled rectangle used as a track matte — built-in; Track Matte pick whip in the Timeline (said; shown)
- Adjustment layer with Posterize Time — built-in; Effect > Time > Posterize Time (effect shown; menu path inferred; the narrator copies the layer from an earlier comp)
- The chart itself (recipe 07 and 08), whose figures this recipe needs are repeated under step 1 and in layout
steps:
1. Start from the finished bar chart: 1920 x 1080, 23.976 fps, black. Four bars as 60 px yellow strokes centred at x 724, 881, 1039, 1196.5, tops at y 319.5, 462, 560, 708, standing on a 3 px yellow baseline from x 657 to 1264 at y 735; right-aligned white labels ending at x 625 with baselines at y 329, 462, 558, 707. Bars grow upwards with Trim Paths End 0 → 100 % over 18 frames starting at frames 7, 17, 27, 37 (tallest first); labels slide 113 px right over 12 frames starting at the same frames; the baseline draws from its centre over frames 0–12. (recipe 07 and 08, shown)
2. Make a new comp-size solid, add Grid to it and move it to the bottom of the stack, under all chart layers. (said "add the grid" and move it behind; shown : a full-size solid, Position and Anchor 960,540, Scale 100 %, at the bottom of the stack, Grid applied)
   - The solid's own colour does not show: with Blending Mode None, Grid draws only the lines (inferred from the result, where the space between lines is black)
3. Set the Grid's cell size and line. (said "scale it down", "a bit skinnier", "about two", "narrower to get the square look"; values shown)
   - Anchor: 960, 540 (shown, unchanged through)
   - Size From: Corner Point (shown)
   - Corner: 1004, 585, so cells are 44 px wide and 45 px tall (shown; passed through 1152,617, 1152,586, 998,585 on the way)
   - Border: first 2.0 (said "about two", shown), then lowered to 1.0 for the final look (shown; not said)
   - Feather: default; Invert Grid: off; Opacity: 100 %; Blending Mode: None (shown)
4. Draw a rectangle with the shape tool: no stroke, any loud fill, dragged from the start of the chart over the whole chart. (said; Rectangle Path Size 619.0, 466.0 and Position 0,0 inside the shape shown; the layer's Position is not shown)
   - Place it so it covers the chart from the baseline up to a little above the tallest bar and from one end of the baseline to the other: centre about (960, 501) (measured, see layout; inferred placement)
   - Put it directly under the Grid layer (shown, layer 11 under the Grid's layer 10)
5. Set the Grid layer's Track Matte to the rectangle's layer with the pick whip, alpha matte. (said "pick whip the track"; shown, the Grid's Track Matte column reads the shape layer, alpha icon; the matte layer's own picture is hidden, inferred from the result where no fill shows)
6. Make the grid faint: change Grid's Color from white to a mid grey. (said "a little bit faint", "a slight grayish color"; the colour dialog shows #B5B5B5, H 0 S 0 B 71 %, with the pointer heading for OK; earlier in the same drag it passed #A69D9D,. The final value is not shown after the dialog closes, so #B5B5B5 is the best reading, inferred as final)
7. Copy an adjustment layer carrying Posterize Time to the top of the stack. (said "copy that layer over and paste it"; shown : an adjustment layer first in the stack with only Posterize Time)
   - Frame Rate: 12.0 (shown)
layout: Measured (Full-resolution viewer at 62.7 %; comp edges at x 1425–3588, y 153–1369 of the full-size frame, 1.127 screen px per comp px), in comp pixels. Grid area (the matte): x about 657–1264 (607 px, the same span as the baseline), y about 268–735 (467 px), from the baseline up to about 53 px above the tallest bar's top; centre about (960, 501). The shown rectangle size is 619 x 466, so the measured width is about 12 px narrower than the shown size; aim for the measured span (the edges of a matte cut through 1-px lines are hard to place within ±5 px). Grid lines: verticals at x = 960 + 44k (measured 785.6, 830.0, 874.4, 917.8, 961.8, 1005.7, 1050.0, 1094.4, 1138.3, 1182.2, 1226.6), horizontals at y = 540 + 45k (measured 271.5, 317.2, 361.5, 405.9, 451.5, 496.9, 542.1, 586.0, about 632, 677.8, 721.8), each about 1.5 px right of or below the exact multiple; 14 columns and about 10 rows of cells inside the area. Line brightness: very faint, a neutral grey peaking at about 27–50 of 255 on the black in the recording (most lines 41–50, about 16–19 % of white; the weaker peaks are lines that fall between screen pixels), at 62.7 % viewer zoom; the same lines at white and 100 % zoom (Half resolution) peaked 34–84, so a 1-px Grid line reads much darker than its colour value even before the grey; judge the render at 100 % against "faint, clearly below the labels' brightness". Stacking: grid behind everything; the bars and the baseline cover the lines where they cross; the labels lie outside the grid on plain black. The grid is static and present from frame 0 (shows it before anything else has drawn). Stepped motion: in the playback the viewer's clock runs at about real time (2:16 of comp time in 68 recorded frames) and the picture changes on every second recorded frame, i.e. 12 pictures a second; bars and labels move in two-frame steps. No other finish: no shadow, glow, grain or vignette; pure black ground.
timing and easing: No keys of its own. Posterize Time 12 fps over a 23.976 fps comp holds each picture for 2 frames. The chart's own timing is in step 1.
variations: The grid's size can be changed afterwards because the rectangle, not the grid, sets the visible area; the grid can be widened or moved freely under the matte (said). The colour can be changed (said).
pitfalls: Give the rectangle a loud fill while drawing it so its extent is easy to see; the fill never shows once it is the matte (said).
build notes: Solid 1920 x 1080 at the bottom; effect ADBE Grid: Anchor [960,540], Size From 1 (Corner Point), Corner [1004,585], Border 1, Color [0.71,0.71,0.71] (#B5B5B5), Opacity 100, Blending Mode None. Shape layer directly below the Grid layer in the stack: one rectangle, Size about [607, 467] (shown 619 x 466), layer Position about [960, 501], Fill any colour, no stroke. In After Effects 2023 and later set gridLayer.setTrackMatte(shapeLayer, TrackMatteType.ALPHA); earlier versions need the matte directly above the Grid layer with trackMatteType ALPHA. Adjustment layer at the top with ADBE Posterize Time, Frame Rate 12. If the 1-px lines render brighter than the target, lower Grid Opacity rather than changing the matte or the cell size. The tutorial's project is set to 16 bpc (shown, Project panel "16 bpc"; the colour dialog gives channels out of 32768); the look does not depend on it, and a script that changes bit depth carries it into later projects, so leave the project at 8 bpc.
unknowns: The rectangle layer's Position and whether its size was changed (the measured area is a little narrower than 619). The final Grid colour after the dialog closed (#B5B5B5 read in the open dialog). The solid's colour (it does not show). The narrator later pastes in an arrow from an earlier part of the video (20:01); it is not in this result window and is left out.

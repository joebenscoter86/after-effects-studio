# Techniques from one video (25 recipes, all unproven)

Written by the channel learner from the video's narration and screen together, then checked against the video by a second reader. Every recipe here passed that check; none has been accepted by Joe, and none is in the plugin. `status: unproven` means it has not been built in After Effects and compared with the tutorial's own result.

Each step is marked `said` (narrated), `shown` (on screen; `fNNNNNN` is a frame in the local study folder, frame number divided by the video's frame rate is seconds) or `inferred` (our reading). The `source` and frame references are for checking and stay out of the plugin. Credits: `CREDITS.md`.

| # | Technique | Jobs | Check passed in round |
|---|---|---|---|
| 01 | Round dots from a shape stroke | lines and shapes; layout and repetition | 1 |
| 02 | Arc with a dot at each end | lines and shapes | 2 |
| 03 | Fade both ends of an open stroke with Taper | lines and shapes; glow and colour | 2 |
| 04 | Text carousel from rotated copies around one pivot | layout and repetition; type | 1 |
| 05 | Even time stagger by dragging a whole stack at once | workflow; layout and repetition | 2 |
| 06 | Tilted 3D ring of discs orbiting a centre | camera and 3D; layout and repetition | 2 |
| 07 | Keep an orbiting 3D layer turned towards the camera | camera and 3D; workflow | 2 |
| 08 | Perform puppet-pin motion live with the mouse | workflow; B-roll scenes | 1 |
| 09 | Slide a background endlessly with mirrored tiling | B-roll scenes; layout and repetition | 2 |
| 10 | Leaf-shaped particles from any graphic | texture; energy and impact; B-roll scenes | 2 |
| 11 | Soft embossed finish for white shapes on a pale background | depth and finish; shadows and light; glow and colour | 3 |
| 12 | Long soft shadow from a radially blurred black copy | shadows and light; depth and finish | 2 |
| 13 | Fine dot-grid background from a ball-grid effect | texture; layout and repetition | 2 |
| 14 | Real cast shadows on an invisible 3D floor | shadows and light; camera and 3D; depth and finish | 2 |
| 15 | Un-clip an effect with Grow Bounds | workflow; shadows and light | 1 |
| 16 | Keep a chosen layer sharp while the camera travels | camera and 3D; depth and finish | 2 |
| 17 | Tie a 3D scene together with depth fog over the precomp | depth and finish; camera and 3D; glow and colour | 1 |
| 18 | Soft word-by-word rise-and-fade text reveal | type | 2 |
| 19 | Text that runs round a drawn path | type; lines and shapes | 1 |
| 20 | Two stacked glows for a soft cinematic bloom | glow and colour; depth and finish | 3 |
| 21 | Paper texture through a title matte, with roughened edges | texture; type; depth and finish | 3 |
| 22 | Tuck helper layers out of the timeline with the shy switch | workflow | 2 |
| 23 | Dial motion blur strength with the comp's shutter angle | energy and impact; workflow | 2 |
| 24 | Keep a scaled-up precomp of vector art crisp | workflow; depth and finish | 1 |
| 25 | Frame video in a custom shape with a track matte | layout and repetition; B-roll scenes | 3 |

## Round dots from a shape stroke
id: 01-dotted-stroke
status: unproven
source: YBeMmC43Q1U 18–39 s
jobs: lines and shapes; layout and repetition
what it does for a beat: Turns any stroked line or outline into an evenly spaced row or ring of round dots with no extra layers, for loaders, orbit rings, borders and decorative circles around a title.
what it looks like: A thin white ring of about thirty small round dots circles a short white word on a near-black background, and the ring slowly turns.
ingredients:
- Shape layer with a stroked path (here an ellipse) — built-in; Ellipse tool, stroke on, fill off
- Stroke > Dashes — built-in; the plus button beside "Dashes" inside the stroke
steps:
1. Draw an ellipse with the Ellipse tool on a new shape layer: white stroke, no fill. (shown f001441)
   - Stroke Width: 18 (shown f001631)
   - Fill: off. The toolbar fill swatch is crossed out (shown f001441), and the group still holds a "Fill 1" with its eye switched off (shown f001766, f002051). A scripted build must remove or disable that fill so it does not show.
   - Color: white (shown f001631)
2. Open Contents > Ellipse 1 > Stroke 1 and click the plus button beside Dashes twice. (said; shown f001766, after both clicks) The first click adds only Dash and Offset (shown f001561); the second adds Gap (shown f001766).
   - Dash: 10.0 and Gap: 10.0 after the clicks (shown f001766); these are just what appeared, not chosen values
   - Offset: 0.0 (shown f001766)
3. Set Line Cap to Round Cap. (said; shown f001631, the menu open; f002051 set)
4. Set Dash to 0. With a round cap, a dash of zero length draws as a dot as wide as the stroke. (said; shown f002051)
   - Dash: 0.0 (said; shown f002051)
5. Raise Gap until the dots are as far apart as you want. (said; shown f002051)
   - Gap: 67.0 in the example, with an 18 px stroke (shown f002051)
6. A finishing touch, not part of the spoken trick: the finished ring turns on layer Rotation keyframes, one at 0 s and another around 3 s. (shown f002288 only; the end value is not shown)
   - Rotation at first key: 0x+0.0° (shown f002288)
layout: dot ring: 28 dots, outer diameter 0.29 of the comp's width and 0.52 of its height (a true circle), centre at 0.50 across, 0.51 down; each dot about 0.009 of the width across; dot centres about 0.033 of the width apart along the ring; word inside: about 0.085 of the width wide, cap height about 0.048 of the height, centred at 0.50, 0.50 (all measured on scratch/01/layout-crop.png, cut at 38.9 s, shares of the whole comp: the viewer shows the full 16:9 picture at 43.2%)
timing and easing: The finished example turns through layer Rotation keyframes: 0° at 0:00 and a second key at about 3 s (the timeline marker sits near 03:06f in a 23.976 fps comp, shown f002288). The end angle and ease are not given.
variations: The narrator says it works on any line or stroke, straight or a shape outline (said). The gap sets the spacing (said).
pitfalls: none given
longest on: Setting up the Dashes: clicking the plus twice, then Dash to zero and dragging Gap. Most of the tip's frames sit on the stroke's Dashes group.
build notes: By script: on the stroke group ("ADBE Vector Graphic - Stroke") set "ADBE Vector Stroke Width" to 18 and "ADBE Vector Stroke Line Cap" to 2 (Round Cap). Under "ADBE Vector Stroke Dashes" add "ADBE Vector Stroke Dash 1" (value 0) and "ADBE Vector Stroke Gap 1" (value 67); an "ADBE Vector Stroke Offset" is optional. Check these match names on the build machine before relying on them. The ellipse comes from "ADBE Vector Shape - Ellipse"; leave the fill out or switch it off. To animate, keyframe the layer's "ADBE Rotate Z". The dot count is the path length divided by the gap, so pick a gap that divides the circumference evenly or the dots will bunch where the path closes. That last point is inferred, not shown.
result: start=37.9 end=39.5 animated crop=824,344,1488,837 frame=scratch/01/result-38.9.png (cut from source.mp4 at 38.9 s; no frame in the window is fully clean because the mouse pointer is always in the viewer, and at 38.9 s it sits below the ring, off the dots. Kept frame f002288 shows the same with the pointer inside the ring. Before 37.9 s the selection handles show around the ring.)
before: f001441 (solid white stroked ring, no dashes)
unknowns: The ellipse size. The ring fills roughly a fifth of the comp's width in the viewer, but no size is given. The second Rotation keyframe's value and its ease. The text and background treatment around the ring, which a separate glow layer makes and the tip does not cover. Whether an even dot count was chosen on purpose.

## Arc with a dot at each end
id: 02-line-with-end-dots
status: unproven
source: YBeMmC43Q1U 39–58 s
jobs: lines and shapes
what it does for a beat: A thin line or arc with a round dot at each end, built inside one shape layer, for orbit segments, connector lines, data callouts and ring loaders.
what it looks like: Three thin white arcs, each with a small round white dot at both ends, sit evenly around a short white word on near-black. Together they nearly close a circle and they move in the finished piece.
ingredients:
- Shape layer holding the dotted ellipse from technique 01 (Dash 0, round cap) — built-in
- A second ellipse group with a plain, undashed stroke in the same shape layer — built-in; Add > Ellipse, or a copy of the group
- Trim Paths — built-in; Add > Trim Paths
- Null object as a parent for several copies — built-in
steps:
1. Start from a shape layer whose ellipse has a dotted stroke, as in technique 01. (inferred; the narration gives no values for the dot group; the values below are shown f003334)
   - Stroke Width: 18.0 (shown f003334)
   - Line Cap: Round Cap (shown f003334)
   - Dash: 0.0 (shown f003334)
2. In the same shape layer, add a second ellipse group with a solid stroke, so there is a thin line on the same path. It sits above the dotted group: "Ellipse 2" above "Ellipse 1". (said; shown f002816, f003200)
   - Stroke Width: 3.0 (shown f002969; the timeline shows it changed from 18)
   - Line Cap: Round Cap (shown f002969)
   - Dashes: none, so the line is solid (shown f002969, viewer)
   - Composite: Below Previous in Same Group (shown f002969)
3. Add Trim Paths inside the solid line's group, from the Add menu, and shorten the line to an arc. (said; shown f002816, menu open; f002969)
   - Start: 77.0% (shown f003070; dragged up from 70%, f002969)
   - End: 100.0% (shown f003070)
   - Offset: 0x+0.0° (shown f003070)
   - Trim Multiple Shapes: Simultaneously (shown f003070)
4. On the dotted group's stroke, drag Gap up until only two dots are left, one at each end of the arc. (said; shown f003334) Why it works: dots fall at the start of the path and then every Gap pixels along it, so a long enough gap leaves one dot at the path start, where the trimmed arc ends, and one more where the arc begins. (inferred; f003334 fits it, with one dot at 12 o'clock and one at about 9 o'clock)
   - Gap: 1136.3 (shown f003334, cropped from the full frame in scratch/02/gap-3334.png; the screen reader caught 164.3 mid-drag at f003260)
5. The finished design repeats this on three layers, parented to one null, laid out around the centre. (shown f002816 and f002408, layer list; f003401, viewer; how they were offset is not shown)
layout: arcs: three arcs of one circle, diameter about 0.27 of the comp's width and 0.47 of its height, centre at 0.50 across, 0.50 down; each arc spans about 82° with gaps of about 32°, 38° and 44° between them (one gap at the top, between about 77° and 110° from the right); line about 0.002 of the width thick; end dots about 0.010 of the width across, roughly four to five times the line width; word in the middle about 0.086 of the width wide, centred at 0.50, 0.50 (all measured on scratch/02/layout-crop.png, cut at 56.2 s, shares of the whole comp: the viewer shows the full 16:9 picture at 43.2%)
timing and easing: none given. The finished arcs move in the result (f003401 compared with f002408), but no keyframes are shown.
variations: The narrator says it lets you make your own line shapes quickly. The same set-up should work on any custom path, not only ellipses (said).
pitfalls: none given
longest on: The Trim Paths step and then dragging Gap until exactly two dots remain. Most of the tip's kept frames are on these two properties.
build notes: By script: in one shape layer, make two groups on the same ellipse ("ADBE Vector Shape - Ellipse" with the same size). Group A, the dots: "ADBE Vector Graphic - Stroke" with width 18, Line Cap 2 (Round), and under "ADBE Vector Stroke Dashes" a "ADBE Vector Stroke Dash 1" of 0 and a "ADBE Vector Stroke Gap 1". Group B, the line: stroke width 3, Line Cap 2, no dashes, plus "ADBE Vector Filter - Trim" inside the group with "ADBE Vector Trim Start" 77 and "ADBE Vector Trim End" 100. Work out the gap rather than eyeballing it (inferred). The second dot must land where the trimmed arc begins, so Gap = (Start% / 100) × the ellipse's circumference: for a circle of diameter d, Gap ≈ 0.77 × π × d. Work it out from the real ellipse size in your build. Do not copy 1136.3: that value implies a circle about 470 px across, but the circle in the viewer measures roughly 400 comp px (f003334, 63.3% zoom), so the layer may be scaled or the path may differ. Treat the diameter as unknown. Check the path direction too: an After Effects ellipse starts at the top and runs clockwise, so 77–100% is the arc from just above 9 o'clock to 12 o'clock (inferred, consistent with f003334). Check the match names on the build machine.
result: start=55.8 end=56.6 animated crop=800,148,1407,790 frame=scratch/02/result-56.2.png (cut from source.mp4 at 56.2 s; the mouse pointer is in the viewer for the whole window, and at 56.2 s it sits at the lower right, clear of the arcs. Before 55.8 s the crop shows the unfinished single arc with its selection box; from about 56.8 s the panels shift. Kept frame f003401 is the same picture with the pointer touching the lower arc.)
before: f002969 (full ring of dots with a thin trimmed arc drawn over part of it)
unknowns: The ellipse size (the inferred 470 px does not match the roughly 400 px measured on screen). How the second group was made (a new ellipse or a copy with the dashes removed). How the three arc layers are rotated or offset around the null, and what animates them in the result. The arc colours and glow, if any. The dash settings on the dot group beyond Dash and Gap.

## Fade both ends of an open stroke with Taper
id: 03-tapered-stroke
status: unproven
source: YBeMmC43Q1U 58–68 s
jobs: lines and shapes; glow and colour
what it does for a beat: Makes an open stroke thin to nothing at both ends, so a light streak, horizon arc or swoosh fades out softly instead of stopping in a hard square end.
what it looks like: A glowing blue-white arc, like a planet's rim, curves over a centred multi-line headline on a dark navy background. It is brightest and thickest at the top and thins to nothing at both ends.
ingredients:
- Shape layer with an open stroked path (here a trimmed ellipse) — built-in
- Stroke > Taper — built-in; inside the stroke group
- Gaussian Blur, CC Radial Fast Blur and Glow on the same layer — stock; already applied with their settings, then switched on one at a time on screen
steps:
1. Start from a shape layer with an open stroke: here an ellipse shortened with Trim Paths to an arc, white, butt cap. (shown f003856, f003923)
   - Stroke Width: 16.0 (shown f003923)
   - Color: white (shown f003923)
   - Line Cap: Butt Cap (shown f003923)
   - Trim Paths 1: present inside the shape's contents (shown f003856); its values are not shown
2. Build up the look by switching on the stroke layer's own effects in order. The effects are already applied with the settings below; on screen their eyes are turned on one at a time, and nothing is said about it. (shown)
   - Start: all three effects off and the headline not visible; the viewer shows a plain thin white arc on black (shown f003641, f003701)
   - Then Gaussian Blur and CC Radial Fast Blur on: the arc becomes a soft, rayed streak (shown f003761)
   - Then Glow on, with the headline visible again: the streak glows blue-white behind the headline (shown f003821)
   - Gaussian Blur > Blurriness: 9.9; Repeat Edge Pixels: on (shown f003856)
   - CC Radial Fast Blur > Center: 962.4, 692.4; Amount: 62.0; Zoom: Brightest (shown f003856)
   - Glow > Glow Based On: Color Channels; Glow Threshold: 60.0%; Glow Radius: 90.0; Glow Intensity: 1.0; Composite Original: Behind; Glow Operation: Add; Glow Colors: Original Colors; Color Looping: Triangle A>B>A; Color Loops: 1.0; Color Phase: 0x+0.0° (shown f003856)
3. Open Contents > Ellipse 1 > Stroke 1 > Taper. (said; shown f003923, f003963)
   - Length Units: Percent (shown f003963)
4. Raise Start Length and End Length so the stroke thins from its middle out to each end. (said; shown f003963, being dragged; f004018 set)
   - Start Length: 100.0% (shown f004018)
   - End Length: 100.0% (shown f004018)
   - Start Width: 0.0% (shown f004018; left at default)
   - End Width: 0.0% (shown f004018; left at default)
   - Start Ease: 0.0% (shown f004018; left at default)
layout: arc: a glowing arc across the top half, visible from about 0.18 to 0.84 of the comp's width (0.66 wide); its crest sits at 0.51 across, 0.19 down, and its two faded ends at about 0.46–0.49 down, level with the headline's second line; its core is thickest at the crest (about 0.03 of the height with glow) and narrows to a hairline and dim at both ends; it reads as part of a circle of radius roughly 0.37–0.45 of the width centred below the crest (rough fit); headline block: about 0.40 of the width wide, centred at 0.50, from 0.39 to 0.75 down (all measured on scratch/03/layout-crop.png, cut at 68.6 s, shares of the whole comp: the viewer shows the full 16:9 picture at 43.2%)
timing and easing: none given
variations: none given
pitfalls: The narrator ties it to open stroked lines (said). On a closed path there are no ends to taper, which is why the example's ellipse is trimmed open first (inferred).
longest on: The narration stresses only Taper's Start Length and End Length, the one setting changed (about 64.3–67 s). By screen time the effect build-up, plain arc then blurs then glow, runs longer (about 59.7–63.7 s).
build notes: By script: in the stroke ("ADBE Vector Graphic - Stroke"), the taper group is "ADBE Vector Stroke Taper". Set "ADBE Vector Taper Length Units" to Percent, then "ADBE Vector Taper Start Length" and "ADBE Vector Taper End Length" to 100. Start Width and End Width stay at 0. Taper needs After Effects 2020 (17.0) or later. The arc comes from "ADBE Vector Filter - Trim" on an ellipse. The blue colour is not explained: the Glow uses Original Colors, so something else tints it, perhaps an effects layer higher in the stack. Check the match names on the build machine.
result: start=68.3 end=68.8 animated crop=761,138,1326,746 frame=scratch/03/result-68.6.png (cut from source.mp4 at 68.6 s. The recording's panels settle at 68.3 s and move again after 68.8 s. Within the window the arc and headline hold still; only the thin top and bottom credit lines and the mouse pointer change, so for the arc alone it is a still. The crop's top-left corner includes the viewer's "Active Camera (Default)" label over the picture, and the pointer is in the viewer for the whole window: at 68.6 s it sits left of centre, below the arc. Kept frame f004085, at 68.08 s, has a different layout and does not fit this crop.)
before: f003923 (the same arc with Taper at its defaults: an even width that stops abruptly at both ends). In f003996 and f004018 a thin line runs down to the lower corners. That is the selected layer's path outline drawn by the viewer, not the stroke: Taper does not make the arc longer.
unknowns: The Trim Paths start and end, and the ellipse size, which set the arc's length. The End Ease value, which is off screen. Where the blue tint comes from. The Gaussian Blur's Blur Dimensions setting, cut off as "Horizontal and…", probably Horizontal and Vertical. Whether the arc animates later in the piece; it holds still in the result window.

## Text carousel from rotated copies around one pivot
id: 04-carousel-by-rotation
status: unproven
source: YBeMmC43Q1U 68.0–88.8 s
jobs: layout and repetition; type
what it does for a beat: Builds a wheel of repeated words (or any layer) curving around an off-screen pivot. Use it for list reveals, title wheels and "rolodex" type moments without expressions or plugins.
what it looks like: A stack of short bold phrases in pale mint on a near-black background, fanned out along an arc that bulges to the right of frame. Each phrase is a copy of one text layer turned a few degrees further than the one above it, so the words follow the curve of a large ring whose centre sits far to the left of the words.
ingredients:
- Text layer (or any 2D layer) — built-in
- Pan Behind (Anchor Point) tool — built-in; toolbar (shown f004445, tool highlighted)
- Duplicate layer (Edit > Duplicate, Ctrl/Cmd+D) — built-in (duplicating is said; the command used is inferred)
- Ctrl+Alt (Windows) / Cmd+Option (macOS) drag on a property value with several layers selected — built-in; spreads the change across the selected layers in layer order (said)
steps:
1. Start with one text layer, e.g. a two-word phrase set in a bold sans, light mint on a dark background (shown f004445).
   - Font: a bold geometric sans; the Character panel shows Plus Jakarta Sans Bold (shown f004445)
   - Rotation: 0x+0.0° (shown f004919)
2. Move the layer's anchor point to the spot that should be the centre of the wheel — here well to the left of the words, at about the same height (said; shown f004625, f004919 — anchor crosshair sits roughly a third of the frame width left of the text). With the Pan Behind tool the text stays in place while the anchor moves (inferred from the tool shown f004445 and text not moving between f004445 and f004919).
3. Duplicate the layer as many times as you want items in the wheel (said). In the example there are 55 copies, numbered up to 55 in their names (shown f004919, f005116).
4. Show Rotation on every copy and select all the copies (shown f004919, every layer has Rotation twirled open; pressing R with all layers selected is inferred, the keystroke is not shown).
5. Hold Ctrl+Alt (Cmd+Option) and drag the Rotation value of the top selected layer. The top layer stays at 0° and each layer below gets a further equal step, so the copies fan out around the anchor (said; shown f005116, f005236, f005326).
   - Rotation step while dragging: about −7.8° (shown f005116), then −6.3° (shown f005236); it settles at −6.5° per layer (shown f005326: 0, −6.5, −13.1, −19.6, −26.1, −32.7, −39.2, −45.8, −52.3, −58.8)
   - Direction: negative values, so each lower layer is turned further counter-clockwise (shown f005326)
6. Adjust the drag until the gap between neighbouring copies looks even; the top copy stays at 0°, so 55 copies make 54 steps, and at about 6.53° the ring spans roughly 353°, close to a full turn (inferred).
layout: word wheel: words stacked on the right half, their left ends from about 0.50 to 0.57 of the comp's width, bowing furthest right at the middle word, which is level (centred 0.50 down); the left ends follow an arc of radius about 0.61 of the width (1.09 of the height) whose hub sits just off the comp's left edge at about 0.50 down (fitted); about ten words show at once, about 0.12 of the height apart near the middle, tilting more the further they sit from the middle (about 20° at the top and bottom edges); middle word about 0.32 of the width wide, cap height about 0.066 of the height; title block on the left from 0.04 to 0.49 of the width, centred 0.49 down (all measured on scratch/04/layout-crop.png, cut at 72.0 s, shares of the whole comp: the viewer shows the full 16:9 picture at 43.2%)
timing and easing: none given for the build. The finished example rotates the wheel so words scroll past (shown f004140–f004325, words move between frames); the copies there are parented to a null (shown f004205, Parent column), but how that null is animated is not shown.
variations: The same Ctrl+Alt (Cmd+Option) drag also offsets layers in time (said; see recipe 05). In the finished example each copy carries a different word and a small index number (shown f004205), not the same phrase.
pitfalls: none given
longest on: The Ctrl+Alt / Cmd+Option drag on Rotation — the narrator singles it out as the key step and the drag itself runs about 6 s on screen (about 82.5–88.8 s: every copy is still 0° at f004919, 82.0 s, the first offsets appear at f004992, 83.2 s, and the values settle by f005326, 88.8 s). The 77.6–82 s before it show the duplicating (f004745).
build notes: By script: set `layer.transform.anchorPoint` to the pivot in layer space (and compensate `position` so the text does not move), duplicate with `layer.duplicate()` N−1 times, then for the i-th layer from the top set `transform.rotation` = −i × step (step ≈ 6.5°, or 360 / N for a closed ring). The Ctrl/Cmd+Alt proportional drag itself is an interface gesture and cannot be scripted; the loop reproduces its result. To spin the carousel, parent all copies to a null placed at the pivot and keyframe the null's Rotation (inferred from the parenting shown f004205).
result: start=71.9 end=72.1 animated crop=881,371,1499,838 frame=f004320 (cut from source.mp4 at 72.0 s, no cursor or handles: scratch/04/result-72.0.png). The recording drifts and zooms slowly through 69.5–72.4 s, so this crop only holds for that 0.2 s window (viewer picture at 72.0 s is x 878–2382, y 368–1211; the crop is inset 3 px for drift, measured). The crop also holds the comp's title block on the left; the carousel itself fills roughly the right half (x ≈ 1600–2379). The other frames checked in this playback (69.8–71.1 s, 71.9 s, 72.1 s) all have the mouse cursor over the words (shown, scratch/04/strip2.png, strip3.png, strip4.png).
before: f004445 (single text layer, anchor being moved)
unknowns: exact pivot coordinates and comp size; font size; text colour value; how the finished carousel is animated (null rotation keyframes, speed, easing); whether the comp in the build is 1920×1080 (the comp runs at 60 fps, shown f004205).

## Even time stagger by dragging a whole stack at once
id: 05-stagger-layers-in-time
status: unproven
source: YBeMmC43Q1U 88.1–93.4 s
jobs: workflow; layout and repetition
what it does for a beat: Makes a stack of copies appear one after another at an even interval, so items of a list, ring or grid arrive in sequence. A quick replacement for Sequence Layers or hand-nudging each bar.
what it looks like: In the timeline the layer bars form a clean diagonal staircase: the bottom layer still starts at 0, and each layer above it starts the same few frames later than the one below, so the top of a 60-layer stack starts about 22 s in. In the example these are the word layers of the text carousel from recipe 04.
ingredients:
- Ctrl+Alt (Windows) / Cmd+Option (macOS) drag of layer bars with several layers selected — built-in; the same shortcut as the rotation offset in recipe 04 (said)
steps:
1. Select every layer to be staggered (shown f005530, all word layers highlighted; inferred that all are selected).
   - Layers in the example: 60 text layers (layers 6–65), each parented to a null (shown f005590)
2. Hold Ctrl+Alt (Cmd+Option) and drag a layer bar sideways in the timeline. The bars spread out in layer order instead of moving together (said; shown f005530 → f005590).
   - Which layer stays put: the bottom layer (layer 65) keeps its start at 0; the higher a layer sits, the later it starts (shown f005590)
   - Per Layer offset: 0:00:00:22.34, i.e. about 22.34 frames at 60 fps ≈ 0.37 s (shown in the drag tooltip, source 92.8 s, crop scratch/05/tooltip.png)
   - Total Offset: 0:00:21:58 (shown, same tooltip)
3. Let go when the per-layer offset shown in the tooltip is what you want (inferred from the live tooltip).
layout: not a picture of the comp; the Timeline panel shows a straight staircase of 45 text-layer bars (layers 21–65 visible, all parented to the same null), the bottom layer starting at 0 s and each layer above starting one even step later: 28.7 px per row against a ruler of 77 px per second, so about 0.373 s (22.4 frames at 60 fps) per layer, and about 16.4 s from the bottom bar to the top visible one; rows are 35.8 px apart, bars about 29 px tall; every bar runs on past the panel's right edge (all measured on scratch/05/layout-crop.png, cut at 93.17 s, and the ruler in scratch/05/layout-full.png)
timing and easing: Even linear stagger of 22.34 frames per layer at 60 fps in the example (shown, tooltip at 92.8 s). The per-layer value is fractional, so layers would land between frames (inferred from the tooltip value; no frame shows a layer between frames).
variations: The same shortcut offsets property values instead of time (said; recipe 04).
pitfalls: none given
longest on: A very short demonstration: the bars stay aligned at 0 s through 92.0 s while the narrator finishes the sentence (shown, source cuts at 89.0–92.0 s), the drag with its tooltip lasts about 1 s (92.0–93.0 s, tooltip shown at 92.5 and 92.8 s), and the settled staircase is on screen from about 93.0 s until the next chapter at about 93.45 s.
build notes: By script, for the i-th selected layer counted from the bottom (i = 0 for the bottom layer) set `layer.startTime = base + i * step`, with step = 22.34 / 60 s in the example, or use whole frames (`Math.round(...) / comp.frameRate`) to keep layers on frame boundaries. Whether the gesture moves the whole bar (Start Time) or only trims the In point is not visible; the bars' right ends are off screen, so moving the whole layer (startTime) is inferred. The Ctrl/Cmd+Alt drag itself is interface-only.
result: start=93.0 end=93.4 still crop=1500,492,2340,1588 frame=f005590 (93.17 s; full crop saved as scratch/05/result-93.17.png). The crop holds only the staggered bars (y 492–2079, between the timeline header and the panel's bottom edge, measured) and the panel layout stays put over 93.0–93.4 s (shown, scratch/05/strip2.png). No clean frame exists: the mouse cursor sits on or near the staircase edge in every frame of the window, at about x 2000–2380, y 900–1390 in the full frame (shown, read from scratch/05/strip2.png).
before: f005530 (all bars aligned at 0 s)
unknowns: the exact layer grabbed for the drag; whether a whole-frame offset is possible from the gesture; the stagger is never played back in the viewer in this chapter, so the visual result of the staggered carousel is not shown.

## Tilted 3D ring of discs orbiting a centre
id: 06-3d-orbit-rings
status: unproven
source: YBeMmC43Q1U 93.0–112.0 s
jobs: camera and 3D; layout and repetition
what it does for a beat: Wraps a central object in a tilted, torus-like ring of repeated flat shapes that pass in front of and behind it. Use it for an orbit or "planet with rings" look, or any hero object that needs a 3D halo, with no 3D plugin.
what it looks like: A solid black circle sits in the middle of a pale grey frame. Around it runs a tilted ring of white discs with thin dark outlines, each disc standing edge-on to the centre like slices of a doughnut; the near discs overlap the black circle and the far ones go behind it. Small black four-point sparkles float around.
ingredients:
- Shape layer with an ellipse — built-in (shown f005793)
- 3D Layer switch — built-in (said)
- Pan Behind (Anchor Point) tool or Anchor Point value — built-in (moving the anchor is said; method inferred)
- Ctrl+Alt (Windows) / Cmd+Option (macOS) drag on a value with several layers selected — built-in (inferred from the identical even spread and from recipe 04; the narrator only says to duplicate and offset, not how)
steps:
1. Make the centre object: a filled black circle in the middle of the comp, set to 3D (shown f005793, f005983; 3D switch on, shown f006213).
2. Make one disc: an ellipse shape layer with a white fill and a dark stroke (shown f005793 — toolbar Fill white, Stroke dark).
   - Stroke width: 6 px (shown f005793)
   - Scale: 48.0, 48.0 % (shown f005923)
3. Move the disc's anchor point so the disc sits above the centre object while the anchor stays at the object's centre (said, anchor moved up; shown f005983 — disc above the black circle, anchor crosshair at the circle's centre).
   - Anchor Point: 0.0, 0.0 → 0.0, 910.0 (shown f005863 → f005923)
   - Position: 962.8, 542.7, i.e. about comp centre (shown f005923)
4. Turn on the disc's 3D switch and set Y Rotation to 90° so the disc turns edge-on (said; shown f006163, f006213 — disc becomes a thin vertical line above the circle).
   - Y Rotation: 0x+90.0° (said; shown f006163). At f006667 the cursor hides the top disc's Y Rotation value (shown, scratch/06/f006667-props.png), and the screen reader's 180° there is unconfirmed; the top disc still shows as a single vertical edge-on line in the viewer at f006667 (shown, scratch/06/f006667-crop.png), which fits 90° rather than 180° (inferred).
5. Duplicate the disc (said). The example has 36 discs (shown f006476, layer named up to 36).
6. Select all discs and offset Orientation Z evenly so each copy is turned further around the centre, forming an orbit (said; shown f006403 → f006521).
   - Orientation Z step: grows from 2.7° (shown f006403) through 40.7° (shown f006476) and settles at 41.1° per layer — 0, 41.1, 82.2, 123.3 … (shown f006521)
   - Top layer keeps Orientation 0, 0, 0 (shown f006476, f006521)
7. Tilt the whole ring with the other two Orientation values (said). In the example only X is changed; the three top discs visible at f006667 all read the same value, and that every disc shares it is inferred.
   - Orientation X: 315.0° (shown f006607), then 307.0° (shown f006667)
   - Orientation Y: 0.0° (shown f006667)
8. Result: a tilted ring of discs around the black circle, near discs in front of it and far ones behind (shown f006667, crop scratch/06/f006667-crop.png).
layout: disc ring: a loop of edge-on discs filling 0.09–0.90 of the comp's width and 0.16–0.96 of its height, centred at about 0.49 across, 0.55 down, seen from above so its back half sits higher; front discs are the largest (about 0.45 of the height tall), back discs smaller; black sphere: 0.28 of the width and 0.52 of the height across (a true circle), centred at 0.51, 0.50, so the ring passes in front of it at the bottom and behind it at the top; two four-point stars: about 0.13 of the width across at 0.17, 0.35 and about 0.07 across at 0.18, 0.79 (all measured on scratch/06/layout-crop.png, cut at 93.9 s, shares of the whole comp: the viewer shows the full 16:9 picture at 43.2%)
timing and easing: none given for the build. The finished example moves (shown f005650–f005770 and f006727–f006787 playing); its discs are parented to a null (shown f005650, Parent column), but how that null or the discs are animated is not shown. The comp runs at 23.976 fps (shown f005793).
variations: Tilt the ring to any angle by changing Orientation X and Y on all the discs (said).
pitfalls: none given
longest on: Time splits about evenly: the single-disc setup (anchor moved up, made 3D, Y Rotation 90°) runs about 7 s (96.5–103.6 s, f005793–f006213; 93.6–96.5 s plays the finished piece), and duplicating, offsetting Orientation Z and tilting runs about 6.5 s (104.7–111 s, f006285–f006667). The narrator stresses the setup, which gets the first and longest sentence.
build notes: By script: shape layer with `ADBE Vector Shape - Ellipse`, fill white, stroke 6 px; `threeDLayer = true`; `transform.anchorPoint = [0, 910]` (the example value; it is the orbit radius in layer pixels before scale) and `transform.position` at the centre object; `transform.yRotation = 90`. Duplicate to N layers and set `transform.orientation = [tiltX, 0, i * stepZ]` for the i-th copy from the top. The example uses N = 36, stepZ = 41.1°, tiltX = 307°; note 36 × 41.1° ≈ 4.1 turns, so the discs land spread around the ring rather than packed in one quarter; for a single tidy pass use stepZ = 360 / N (inferred). The centre object must be a 3D layer for discs to pass behind it. To make the ring orbit, parent the discs to a 3D null at the centre and keyframe the null's rotation (inferred from the parenting shown f005650).
result: start=93.85 end=94.1 animated crop=663,266,1157,649 frame=f005634 (cut from source.mp4 at 93.9 s, no cursor: scratch/06/result-93.9.png). Over 93.85–94.1 s the viewer picture holds at x 661–1821, y 264–916 (measured), then the recording starts zooming (it grows about 10 px per 0.2 s from 94.15 s). The crop is inset 2 px, so the viewer border is left out. The finished piece plays again at 112.1–112.7 s with the viewer at x 809–2217, y 337–1128 (measured), just after this chapter.
before: f005793 (single flat disc and black circle, discs not yet made 3D)
unknowns: comp size; disc ellipse size before scaling and exact colours; size and colour of the centre circle; whether the offset was made with the Ctrl/Cmd+Alt drag or typed; the orbit animation (what is keyframed, speed, easing); the sparkle layers and the noise/texture layer in the finished example are not explained in this chapter; camera (the viewer shows Active Camera (Default), shown f005793, so no camera layer is needed for the build).

## Keep an orbiting 3D layer turned towards the camera
id: 07-face-the-camera
status: unproven
source: YBeMmC43Q1U 112–127 s
jobs: camera and 3D; workflow
what it does for a beat: When a flat 3D layer circles around something (a moon round a planet, an icon on an orbit), it turns edge-on and thins out at parts of the loop; this keeps it reading as a full, flat shape the whole way round.
what it looks like: White line art on black: a large outlined circle with a tilted elliptical ring around it, and a small black-filled, white-outlined circle travelling round the ring. Before the fix the small circle squashes into a thin sliver as it orbits; after it, it stays a perfect circle facing the viewer.
ingredients:
- Auto-Orient (Orient Towards Camera) — built-in; Layer > Transform > Auto-Orient
- A camera layer and a 3D layer orbiting via parented nulls — built-in (carried over from the previous orbit set-up, not built in this section)
steps:
1. Start from a 3D layer that orbits a centre in a scene viewed through a camera; here the small circle is parented to a rotating null, which is parented in turn to a parent null at the centre (shown f006813)
   - Starting state: the small circle is seen nearly edge-on as a thin ellipse at the lower left of the ring (shown f006813)
2. Select the orbiting layer (said; shown f007146, the layer highlighted with its 3D gizmo in the viewer)
3. Open Layer > Transform > Auto-Orient (said; cursor on the Layer menu title shown f007217, the menu itself not visible open)
   - The dialog that opens offers Off (still selected at f007407), Orient Along Path, and Orient Towards Camera, plus a greyed text-only option for orienting each character (shown f007407)
4. Choose Orient Towards Camera (said; selected, shown f007464) and confirm with OK (shown f007464, cursor on OK)
   - Auto-Orientation: Orient Towards Camera (said, shown f007464)
5. Play the comp: the small circle now stays round and flat to the viewer as it goes round the ring (shown f007493, at the same comp time 0:00:00:10 as the edge-on view behind the dialog at f007407; and f007522)
layout: all figures measured on f007522 as shares of the result crop, which is only part of the comp (the viewer is at 50% zoom, the black background fills it and no comp edge is inside the viewer here or at f006813, so the comp's size and the crop's share of it cannot be read); large centre circle: diameter about 24% of the width and 45% of the height, centre about 50% across, 45% down (measured); tilted orbit ring: spans about 30–70% across and 27–70% down, about 1.7 times the circle's diameter wide, long axis tilted slightly down to the right (measured); small orbiting circle: diameter about 8% of the width (about a third of the large circle), centre about 53% across, 69% down, on the ring's near edge below the large circle (measured)
timing and easing: none given (the orbit animation already existed; nothing is keyframed here)
variations: none given
pitfalls: none given
longest on: the look before and after. About the first 6 s (113.5–119 s, f006813 onward) play the orbit with the small circle turning edge-on and then select the layer, and the narrator stresses that the shape should face the viewer the whole way round with no turning (said). The menu and dialog take about 4.6 s (120.3–124.9 s, f007217 to f007493)
build notes: Scripting: set the orbiting layer's `threeDLayer = true` and `layer.autoOrient = AutoOrientType.CAMERA_OR_POINT_OF_INTEREST`. The comp needs an active camera layer (the viewer reads Active Camera, shown f007146) or the option has nothing to face. Orbit rig as seen in the timeline (inferred from f006813): a rotating null parented to a centre null; the orbiting shape parented to the rotating null; the ring path parented to the centre null. Glow and noise adjustment layers sit on top (shown f006813) and are not part of this trick.
result: start=125.4 end=127.0 animated crop=840,410,1486,778 frame=f007522 (crop sits below the viewer's camera-name label and inside the panel borders)
before: f006813
unknowns: how the orbit itself is animated (rotation axis, speed) is not shown in this section; the small circle's size, stroke width (toolbar shows 5 px for the selected shape, f007146, not confirmed as this layer's stroke) and fill; camera settings; the glow and noise settings.

## Perform puppet-pin motion live with the mouse
id: 08-record-puppet-pin-motion
status: unproven
source: YBeMmC43Q1U 127–139 s
jobs: workflow; B-roll scenes
what it does for a beat: For organic secondary motion on an illustrated character (a head sway, a nod, a drifting limb) where hand-placing keyframes would look stiff or take too long; you act the motion out once and After Effects writes the keyframes.
what it looks like: An illustrated girl with headphones sits by a train window with a landscape outside. A puppet pin on the top of her head is dragged during recording, so her head tilts and sways gently while pins at her shoulders hold the body still.
ingredients:
- Puppet Position Pin tool and the Puppet effect — built-in; Puppet tool in the toolbar (shown f007771)
- Live recording by holding Ctrl (Windows) or Cmd (Mac) while dragging a pin — built-in (said)
steps:
1. Take a cut-out character layer and place puppet pins with the Puppet Position Pin tool (shown f007771, f007997)
   - Pins: three — one on top of the head and two low on the body near the shoulders/chest (shown f007997; the timeline lists Puppet Pin 1–3 at f008370)
   - Puppet Engine: Advanced (shown f007997)
   - Mesh Rotation Refine: 20 (shown f007997)
   - On Transparent: off (shown f007997)
   - Toolbar Expansion: 3, Density: 10 (shown f007771)
2. Put the time indicator where the motion should start; here 0:00:00:00 (shown f008070)
3. With the Puppet tool active (shown f007997, tool highlighted), select the pin to animate (said); here the head pin (shown f007997, f008070)
4. Hold Ctrl/Cmd on the selected pin to live-record its movement (said), dragging it in the viewer while the mouse is held; the cursor changes to a circle and the head moves with the playhead parked at 0:00 (shown f008070, f008190; 135.5–137.2 s)
5. Release to stop (inferred); the pin's Position now carries about a dozen irregularly spaced keyframes, while the other pins keep only their single starting keyframe (shown f008370)
   - Puppet Pin 1 (head) Position at 0:00:00:18: 1035.3, 416.8, with keyframes spread from 0:00 to past 3:12 (shown f008370)
   - Puppet Pin 2 Position: 431.3, 1297.1 — one keyframe at the start (shown f008370)
   - Puppet Pin 3 Position: 910.0, 1348.5 — one keyframe at the start (shown f008370)
6. Play back to see the recorded head movement (shown f008250, f008370)
layout: character's head with bun: from about 10% to 72% down (about 62% of the height), face centre about 44% across (measured on f008250, shares of the whole comp: viewer at 43.2%, picture edges just inside the viewer and matching the crop); shoulders: about 14–53% across where the bottom edge cuts them (measured on f008250, shares of the whole comp: viewer at 43.2%, picture edges just inside the viewer and matching the crop); headphone ear cup centre: about 30% across, 50% down (measured on f008250, shares of the whole comp: viewer at 43.2%, picture edges just inside the viewer and matching the crop); window opening behind her: about 4–91% across, down to about 90%, with a window post filling about 91–100% across (measured on f008250, shares of the whole comp: viewer at 43.2%, picture edges just inside the viewer and matching the crop)
timing and easing: Keyframes are generated by the recording; the head pin has about a dozen keys from 0:00 to beyond 3:12, several frames apart at irregular spacing (shown f008370). No easing was set by hand (inferred).
variations: none given
pitfalls: none given
longest on: the Ctrl/Cmd-drag live recording itself; the section shows the pin being dragged and then the resulting keyframes
build notes: Live recording is hand-only in the interface (Record Options in the Puppet toolbar sets speed and smoothing; not opened in the video). Puppet pins cannot be created by script, but if a Puppet effect ("Puppet", match name ADBE FreePin3) with pins already exists, a script can write keyframes to each pin's Position (Puppet > Mesh 1 > Deform > Puppet Pin N > Position), e.g. a sampled smooth path or a slow wiggle on the head pin, to imitate a recorded performance. The comp runs at 23.976 fps (shown f008070).
result: start=137.5 end=139.0 animated crop=843,338,1460,822 frame=f008250 (the landscape outside the window also slides in this stretch; that comes from the next technique's tiling already in the project and is not part of this one; the next section starts at 139 s)
before: f008070
unknowns: the exact path the pin was dragged along; Record Options settings (speed, smoothing); the head pin's starting position; whether the default Expansion/Density were changed (values shown look like defaults); how long the drag lasted in real time.

## Slide a background endlessly with mirrored tiling
id: 09-endless-background-tile
status: unproven
source: YBeMmC43Q1U 139–152 s
jobs: B-roll scenes; layout and repetition
what it does for a beat: For a background that has to keep moving longer than the artwork is wide, such as the view out of a moving vehicle's window; the image is repeated and slid along without visible seams.
what it looks like: An illustrated landscape (hills, trees, sky) seen through a train window behind a seated character. With the effect animating, the landscape scrolls sideways past the window and keeps going, the repeated copies flipped at the joins so there is no hard edge.
ingredients:
- Motion Tile — stock; found by typing in the Effects & Presets search (shown f008703)
steps:
1. Select the background artwork layer (here a vector landscape layer that already has a Curves effect) and apply Motion Tile (said; search shown f008703, effect in Effect Controls f008837)
   - Tile Center: 960.0, 540.0 (default, shown f008837)
   - Tile Width: 100.0 (shown f008837)
   - Tile Height: 100.0 (shown f008837)
   - Output Width: 100.0 (shown f008837)
   - Output Height: 100.0 (shown f008837)
   - Phase: 0x +0.0° (shown f008837)
   - Horizontal Phase Shift: off (shown f008837)
2. Tick Mirror Edges (said; unticked f008837, ticked f008916)
   - Mirror Edges: on (said, shown f008916)
3. Animate Tile Center (said), changing only X (shown f008976). As demonstrated on screen: the stopwatch is switched on with 960.0, 540.0 at 0:00:03:20 (shown f008916), then X is dragged at 0:00:03:21 (3720.0 at f008976; 3920.0 at 149.8 s, cut from source). This keyframed version is never played back in the video.
4. The finished example that plays is set up differently: Tile Center has its stopwatch off (no keyframes) and its value shown in red, (shown f009036, f009096, playhead reading 0:00:04:00); After Effects shows a value in red when an expression drives it, so the finished slide comes from an expression (inferred)
   - Tile Center: -6006.0, 540.0 as displayed (shown f009036, f009096). The screen wins here over the timeline's "6006.0": the value is negative.
   - The expression itself is never shown (see unknowns)
5. Play back: the landscape slides sideways through the window continuously (shown f009096 against f008424)
layout: main window opening the landscape slides through: about 4–90% across, top edge at about 15% down, bottom edge at about 90% down (the part left of the post behind her starts lower, at about 30% down) (measured on f009096, shares of the whole comp: viewer at 43.9%, picture edges inside the viewer and matching the crop to within a few pixels); character in front of it: about 15–52% across (measured on f009096, shares of the whole comp: viewer at 43.9%, picture edges inside the viewer and matching the crop to within a few pixels); second narrow window strip: about 97–100% across (measured on f009096, shares of the whole comp: viewer at 43.9%, picture edges inside the viewer and matching the crop to within a few pixels); landscape inside the window: mountain peaks about 25–30% down, tree line from about 35% down to the window's bottom; the mirrored joins do not show in this still (measured on f009096, shares of the whole comp: viewer at 43.9%, picture edges inside the viewer and matching the crop to within a few pixels)
timing and easing: Only X of Tile Center changes; Y stays 540 (shown). Keyframed demonstration: 960 at 3:20, X being dragged to about 3720–3920 at 3:21 (shown f008916, f008976), never played. Final playback: expression-driven, speed and direction not given. Easing none given.
variations: none given
pitfalls: none given
longest on: ticking Mirror Edges and animating Tile Center; the narrator stresses that these two steps alone make the background repeat forever
build notes: Effect "Motion Tile" (match name ADBE Tile). Properties as shown: Tile Center, Tile Width, Tile Height, Output Width, Output Height, Mirror Edges, Phase, Horizontal Phase Shift. Script: add the effect and set Mirror Edges to 1. The result shown is driven by an expression on Tile Center whose text is not shown; a linear time-based X offset such as [960 - time*k, 540] is our guess (inferred). The keyframed route the author demonstrates (Tile Center X from 960 to a far value) should also work but is not seen playing (inferred). Default Tile Center 960, 540 implies a 1920x1080 comp (inferred). The comp has a camera (Active Camera shown f008837) but the tile is a 2D effect.
result: start=150.4 end=152.0 animated crop=906,340,1542,870 frame=f009096 (the mouse cursor sits in the picture throughout, and the character's recorded head sway from the previous technique also plays; ignore both when comparing)
before: f008424
unknowns: the Tile Center expression that drives the finished playback (only its red displayed value, -6006.0, 540.0, is seen); the second keyframe of the demonstration (its time and final X are not legible); direction and speed of the slide; whether Output Width was raised (all sizes stay at 100 in the frames seen); a jump cut at about 150.2 s shows Mirror Edges unticked and Tile Center at 960, 540 at 0:00, so the edit order is unclear.

## Leaf-shaped particles from any graphic
id: 10-graphic-as-particles
status: unproven
source: YBeMmC43Q1U 152–171 s
jobs: texture; energy and impact; B-roll scenes
what it does for a beat: Fill a scene with drifting copies of a small graphic (leaves, petals, confetti, logos) without hand-placing them; the particle system births, spins and moves each copy for you.
what it looks like: Dozens of small green leaf graphics of varied size tumble and spin as they drift across a dark frame, spread through depth; in the tutorial's scene they are meant to float over an illustrated window view.
ingredients:
- CC Particle World — stock (Cycore, ships with After Effects); effect name said; the author types "CC" into the Effects & Presets search (shown f009409), but the effect itself is not in the visible part of that list
- Solid layer to carry the effect — built-in (said)
- The graphic to use as the particle, as its own layer in the comp (here a leaf vector file scaled down) — built-in
steps:
1. Put the graphic (a single leaf illustration) in the comp as its own layer and scale it down (shown f009409)
   - Scale: 32.0, 32.0 % (shown f009409)
2. Make a solid layer and apply CC Particle World to it (said; the solid is a black layer at the top of the stack, shown f009409)
3. In the Particle group, set Particle Type to Textured QuadPolygon right away (said; dropdown reads "Textured Quad..." shown f009898)
4. Open Particle > Texture and set Texture Layer to the graphic's layer (said; the menu shows the graphic's layer number, shown f009898)
   - Texture Layer second dropdown: "So..." — most likely Source (shown f009898, reading inferred)
   - Scatter: 0.0 (shown f009898)
   - Texture Time: Current (shown f009898)
   - Align To Direction: off (shown f009898)
5. Particle look values visible on screen at this point (shown f009898; not said, possibly defaults)
   - Rotation Speed: 180.0 (shown f009898)
   - Initial Rotation: 360.0 (shown f009898)
   - Rotation Axis: Any Axis (shown f009898)
   - Birth Size: 0.250 (shown f009898)
   - Death Size: 0.250 (shown f009898)
   - Size Variation: 50.0 % (shown f009898)
   - Max Opacity: 75.0 % (shown f009898)
   - Color Map: Birth to Death (shown f009898)
   - Birth Rate: 2.0; Longevity (sec): 1.00 (shown f009598)
6. Customise the emitter and physics to turn the upward burst into a sideways drift (said "customise"; Direction Axis and the starting values shown f010018, the changed values first shown f010078)
   - Producer > Position X: -0.58 (changed from 0.00; shown f010078)
   - Producer > Position Y / Z: 0.00 / 0.00 (shown f010018, f010078)
   - Producer > Radius X: 0.025 (shown f010078)
   - Producer > Radius Y: 0.225 (changed from 0.025 shown f010018; new value shown f010078)
   - Producer > Radius Z: 0.025 (shown f010078)
   - Physics > Animation: Direction Axis (changed from Explosive; shown f010018, Explosive shown f009958)
   - Physics > Velocity: 1.08 (changed from 1.00 shown f010018; new value shown f010078)
   - Physics > Gravity: 0.030 (changed from 0.500 shown f010018; new value shown f010078)
   - Physics > Inherit Velocity %: 0.0; Resistance: 0.0; Extra: 0.50; Extra Angle: 1x +0.0° (shown f010018, f010078)
7. Composite the particle layer over the scene (inferred; the scene with the particle layer switched off is shown f010138, and earlier copies of the particle layer sit lower in the stack, shown f009173)
layout: leaves visible at once: about 140 (measured on f010078, shares of the result crop, which shows the comp's full width and about 90% of its height, the top ~10% left off below the camera label; viewer at 43.9%); leaf long side: mostly 0.7–2.1% of the width, median about 1.3%, largest about 2.6% (measured on f010078, shares of the result crop, which shows the comp's full width and about 90% of its height, the top ~10% left off below the camera label; viewer at 43.9%); spread: 2–97% across, the middle 80% of leaves between about 24% and 79% down, no visible clustering at the emitter (measured on f010078, shares of the result crop, which shows the comp's full width and about 90% of its height, the top ~10% left off below the camera label; viewer at 43.9%)
timing and easing: none given (no keyframes shown; the particles animate by themselves)
variations: the narrator says the particle settings are free to change to suit the scene; any graphic can be the texture
pitfalls: none given
longest on: the setup order — solid, CC Particle World, Particle Type to Textured QuadPolygon, Texture Layer to the graphic — which is the whole first sentence and about 12 s of screen time; the physics tweak follows briefly
build notes: Values are dragged into place between about 166.5 and 167.6 s (Gravity passes through negative values on the way); the settled drift with the guide grid gone holds from about 167.7 to 168.8 s, after which the full scene returns (shown, source cuts). The result crop starts below the viewer's camera label. Effect "CC Particle World" (match name CC Particle World). Properties as shown in the Effect Controls: "Birth Rate", "Longevity (sec)", "Producer" group ("Position X/Y/Z", "Radius X/Y/Z"), "Physics" group ("Animation" popup, "Velocity", "Gravity", ...), "Particle" group ("Particle Type" popup, "Texture" group with "Texture Layer", "Scatter", "Texture Time", then "Rotation Speed", "Initial Rotation", "Rotation Axis", "Birth Size", "Death Size", "Size Variation", "Max Opacity", "Color Map"). Popup values are set by index, so read the menu order in the installed version (Textured QuadPolygon, Direction Axis). Texture Layer is a layer-reference property: set it to the graphic layer's index. The graphic layer can stay switched off (inferred; it is a texture source). The viewer in the tutorial uses a 3D camera (Active Camera shown f009898); the effect works without one.
result: start=167.7 end=168.8 animated crop=908,430,1560,795 frame=f010078
before: f009898 (Particle Type and Texture Layer already set, producer and physics still at their defaults: an Explosive burst of tiny leaves rising from the centre over the effect's grid)
unknowns: Direction Axis sub-settings (axis X/Y/Z) not shown; whether the rotation, size, opacity values were changed from the defaults or left; the solid's colour and size; the comp size; the leaf graphic's colour; whether Grid & Guides was switched off (the grid is gone by f010078 but the change is not shown); how the particle layer was blended into the final scene (blend mode, opacity, depth of field) is not shown in this stretch

## Soft embossed finish for white shapes on a pale background
id: 11-white-on-light-finish
status: unproven
source: YBeMmC43Q1U 197–224 s
jobs: depth and finish; shadows and light; glow and colour
what it does for a beat: When a pure white shape or title vanishes into a light background, two layer styles give it a faint cool shading and a bright rim so it reads as a raised, soft-plastic object.
what it looks like: A large white disc carrying a small dark two-line title sits on a near-white, cool grey background among other pale discs; the disc gets a very gentle top-to-bottom grey-blue shading and a crisp light edge, so it looks pressed out of the page.
ingredients:
- Gradient Overlay layer style — built-in; right-click the layer > Layer Styles > Gradient Overlay (shown f012182; the same submenu also sits under the Layer menu, inferred)
- Bevel and Emboss layer style — built-in; right-click the layer > Layer Styles > Bevel and Emboss (shown f012790)
steps:
1. Select the white shape layer and add a Gradient Overlay layer style (said; menu shown f012182, style in the timeline shown f012257)
   - Blend Mode: Normal (shown f012257)
   - Opacity: 100 % (shown f012257)
   - Gradient Smoothness: 100.0 % (shown f012257)
   - Angle: 0x +40.0° (shown f012257; not said)
   - Style: Linear; Reverse: Off; Align with Layer: On; Scale: 100.0 %; Offset: 0.0, 0.0 (shown f012257)
2. Click Edit Gradient and pick two light-to-mid grey-blue colours (said "light to medium grey bluish"; values shown in the Gradient Editor)
   - Stop at 0 %: #F1F5F7 (H 200°, S 2 %, B 97 %) (shown f012350)
   - Stop at 99.8 %: #DAE1E7 (H 210°, S 5 %, B 91 %) after trying #E0E5E9 and #DDE3E9 (shown f012590, earlier values f012487, f012534)
3. Add a Bevel and Emboss layer style to the same layer (said; menu shown f012790)
   - Style: Inner Bevel (shown f013130)
   - Technique: Smooth (shown f013130)
   - Depth: 100.0 % (shown f013130)
   - Direction: Up (shown f013130)
   - Size: 5.0 (shown f013130)
   - Soften: 0.0 (shown f013130)
   - Use Global Light: Off; Angle: 0x +120.0°; Altitude: 0x +30.0° (shown f013130)
   - Highlight Mode: Screen; Highlight Color: white (shown f013130)
   - Highlight Opacity: 100 % (said "both opacities to 100 %"; shown f013130)
   - Shadow Mode: Screen (said; shown f013130)
   - Shadow Color: white (said; shown f013130)
   - Shadow Opacity: 100 % (said; shown f013187 — still 75 % in f013130 before it was changed)
layout: styled disc: diameter about 37.5% of the width (about 67% of the height), centre about 50% across, 50% down (measured on f013332, shares of the whole comp: viewer at 43.5%, picture edges inside the viewer and matching the crop); title on the disc: first line about 39–61% across, letters about 4% of the height tall, at about 47% down; second line about 42–58% across, about 2.5% tall, at about 52% down (measured on f013332, shares of the whole comp: viewer at 43.5%, picture edges inside the viewer and matching the crop); other pale discs, all partly behind the main one: one peeking out above its top at about 52–62% across, 0–13% down; one to the left at about 17–32% across, 36–64% down; one at the lower left at about 26–39% across, 68% down to the bottom edge; one at the lower right at about 56–73% across, 66–97% down (measured on f013332, shares of the whole comp: viewer at 43.5%, picture edges inside the viewer and matching the crop)
timing and easing: none given (static finish; the comp's own build-on animation plays at the end but is not part of the technique)
variations: none given beyond "any white graphic"
pitfalls: none given
longest on: choosing the two gradient colours in the Gradient Editor (about 10 s of screen time across f012292–f012790); the narrator stresses that the bevel's shadow must become white in Screen mode
build notes: Result window: before 222.2 s the viewer is still zooming and moving within the crop, and from about 223.2 s the comp loops to an empty background (shown, source cuts). The mouse cursor sits over the picture throughout the window (no cursor-free frame exists), and the other discs carry the next technique's long shadows; mask both when comparing. Layer styles cannot be added with addProperty; select the layer and run app.executeCommand(app.findMenuCommandId("Gradient Overlay")) and app.executeCommand(app.findMenuCommandId("Bevel and Emboss")). Properties then sit under "Layer Styles" > "Gradient Overlay" ("Blend Mode", "Opacity", "Colors", "Gradient Smoothness", "Angle", "Style", "Reverse", "Align with Layer", "Scale", "Offset") and "Layer Styles" > "Bevel and Emboss" ("Style", "Technique", "Depth", "Direction", "Size", "Soften", "Use Global Light", "Angle", "Altitude", "Highlight Mode", "Highlight Color", "Highlight Opacity", "Shadow Mode", "Shadow Color", "Shadow Opacity"). The gradient "Colors" value cannot be set by script; set the two stops by hand in the Gradient Editor, or apply a saved style/preset that already holds them. In the example the layer is a shape layer (shown f012257).
result: start=222.2 end=223.1 animated crop=760,312,1336,752 frame=f013332
before: none clean — the unstyled disc is never shown: frames up to about 201.8 s (e.g. f012113) show the finished, styled scene, f011866 is a blurred transition, and from the moment the Layer Styles menu opens the viewer is scrolled out of sight (f012182 shows only a sliver of the disc) until the Gradient Overlay is already applied
unknowns: the background colour and the disc's own fill (white is said for the graphic, exact value not shown); the gradient angle reason (40° shown, not explained); whether the other discs in the scene carry the same styles; the extra shadow copies seen in the scene belong to the next technique and are not part of this one

## Long soft shadow from a radially blurred black copy
id: 12-long-soft-shadow
status: unproven
source: YBeMmC43Q1U 224–252 s
jobs: shadows and light; depth and finish
what it does for a beat: Gives flat shapes or letters a long, fading directional shadow, as if lit by a low sun, which reads especially well on bright, pale backgrounds.
what it looks like: Pale grey-blue bars, blocks and a large two-word title on a near-white dotted background each cast a long soft grey shadow streaking diagonally down and to the right, dense at the object and fading out.
ingredients:
- Duplicate of the layer — built-in; duplicating is said, the menu path (Edit > Duplicate) is inferred
- Fill — stock; Effect > Generate > Fill (shown f014532; menu path inferred)
- CC Radial Fast Blur — stock (Cycore); found by typing "cc ra" in Effects & Presets (shown f014532)
- Gaussian Blur — stock (shown f015072)
steps:
1. Duplicate the layer; the copy that sits underneath becomes the shadow (said). In the finished example each existing shadow layer sits below its object and is parented to it (shown f013692, Parent column); the copy the author makes on screen keeps the original's parent, a null that drives the scene (shown f014352), so parenting the shadow to its object is a reading of the finished example, not a step shown
2. Make sure the shadow copy has no layer styles (said)
3. Turn the copy solid black, either by colouring the layer black or with the Fill effect (said; Fill applied, shown f014352)
   - Fill > Color: black (shown f014352; "black" said)
   - Fill > Opacity: 100.0 %; Fill Mask: None; Invert: off; feathers 0.0 (shown f014352)
4. Apply CC Radial Fast Blur to the copy (said; screen confirms the name, shown f014532)
   - Amount: 95.0 (said "nearly 100"; shown f014772)
   - Zoom: Standard (shown f014772)
5. Move the blur's centre point to aim the shadow: the streak runs away from the centre, so a centre placed up and to the left throws the shadow down and to the right (narrator calls it the anchor point; the screen shows the effect's Center being dragged in the viewer — the screen wins; direction reading inferred)
   - Center: 224.7, 366.6 then 137.7, 375.0 (shown f014772, f015072)
6. For extra blending, add Gaussian Blur to the copy (said "gauge and blur" — speech recognition; screen shows Gaussian Blur, f015072)
   - Blurriness: 25.6 (shown, cropped from f015132)
   - Blur Dimensions: Horizontal and Vertical (shown f015072, label truncated)
   - Repeat Edge Pixels: on (shown f015072)
layout: shadow direction differs from object to object, because each shadow comes from its own radial blur and points away from that object's blur centre: top-left block (about 12–17% across, 10–21% down) nearly level, about 7–12° below horizontal, reaching about 28% across at about 16–17% down; tall right bar (87–91% across, 21–42% down) about 36–40°, running off the right edge; small lower block (about 32–35% across, 78–83% down) about 40°; letters of the lower word about 55–65°; left bar (4–18% across, 60–66% down) almost straight down, about 71°, fading out at about 88–92% down (measured on f013692, shares of the whole comp: viewer at 43.5%, picture edges inside the viewer and matching the crop; angles in picture pixels, from the centre line of each shadow's darkening); shadow length from object edge to fade-out: about 9–14% of the width (measured on f013692, shares of the whole comp: viewer at 43.5%, picture edges inside the viewer and matching the crop; angles in picture pixels, from the centre line of each shadow's darkening); shadow width: about the object's own width at the object, densest there (measured on f013692, shares of the whole comp: viewer at 43.5%, picture edges inside the viewer and matching the crop; angles in picture pixels, from the centre line of each shadow's darkening); title: lower word about 27–72% across, 37–66% down; upper word about 40–62% across, 20–40% down (measured on f013692, shares of the whole comp: viewer at 43.5%, picture edges inside the viewer and matching the crop; angles in picture pixels, from the centre line of each shadow's darkening)
timing and easing: none given (static shadow; because the shadow is parented to its object it follows it, inferred)
variations: colour the copy black either by the layer's own colour or by the Fill effect (said)
pitfalls: the shadow copy must not keep the original's layer styles (said)
longest on: making the black copy — duplicating, stripping the layer styles and filling it black takes the longest sentence (about 13 s); the radial fast blur amount and aiming it follow
build notes: Result window: the comp plays its build-on with a slow camera drift, and every object has its finished shadow from about 228.0 to 229.0 s; at about 229.15 s the author stops and solos one bar (shown, source cuts). Later frames such as f014112 show one bar mid-rebuild without a finished shadow, plus selection handles and the camera label. The cursor sits over the word in f013692; mask it when comparing. The author also solos the bar and deletes its old shadow before duplicating (shown, around 229.5 s), and switches the original off after duplicating (still on in f014112, off in f014352); that is housekeeping, not part of the technique. layer.duplicate(), then move the copy below the original (moveAfter). Leaving it with the original's parent (as on screen) or parenting it to the original (as in the finished example) both keep it in step (inferred). Remove layer styles from the copy (Layer > Layer Styles > Remove All, via app.executeCommand(app.findMenuCommandId("Remove All")) with the copy selected). Effects: "ADBE Fill" ("Color" black, "Opacity" 100 %), "CC Radial Fast Blur" ("Center" point, "Amount" 95, "Zoom" Standard), "ADBE Gaussian Blur 2" ("Blurriness" 25.6, "Repeat Edge Pixels" on). Center is in layer space, so pick it relative to the shape; the shadow may run past the layer's edge — the copy in the example is a shape layer, which is not clipped, but other layer types may need room (inferred).
result: start=228.0 end=229.0 animated crop=768,312,1356,764 frame=f013692
before: f014352 (the new copy filled solid black sitting on one bar, with no blur yet; the other objects already show their finished shadows)
unknowns: the shadow layer's opacity or blend mode (not shown; shadows read as mid grey, so it may be lowered); the order of the layers when the original is switched off during editing (the original is hidden in f014352); exact Center values for the other objects in the scene; the background and object colours

## Fine dot-grid background from a ball-grid effect
id: 13-dot-grid-texture
status: unproven
source: YBeMmC43Q1U 252–272 s
jobs: texture; layout and repetition
what it does for a beat: A quick, quiet design texture for a plain or pale background, so an empty backdrop reads as designed rather than blank without pulling focus from the type or graphics in front.
what it looks like: A pale grey-blue background covered by an even grid of tiny grey dots, sitting behind 3D-looking letters and simple outline shapes; the dots are only noticeable when you look closely.
ingredients:
- CC Ball Action — stock (Cycore effects that ship with After Effects); effect name shown in the Effect Controls (f016035)
- Solid layer, black — built-in (said "black solid layer"); menu path not said or shown, Layer > New > Solid (inferred); Solid Settings dialog shown f015615
- Effect found by typing "CC" in the Effects & Presets search (shown f015735)
steps:
1. Create a black solid (said) the size of the composition (shown f015615) and place it directly above the background layer, below all the graphics (shown f016035, f016275: solid is layer 30, background layer 31)
   - Width x Height: 1920 x 1080 px, 100.0 % of comp, so the comp is 1920 x 1080 (shown f015615)
   - Color: black, R0 G0 B0 (shown f015615)
2. Apply CC Ball Action to the black solid (said; shown f015855)
   - Defaults seen before changing: Grid Spacing 5, Ball Size 100.0, Coloring Medium, Shading -75.0, Scatter 0.0, Displace 0.0, Twist Angle 0x+0.0°, Rotation 0x+0.0° (shown f015855)
3. Set the grid spacing and ball size small (said)
   - Grid Spacing: 3 (said "three"; shown f016035, cropped f016275 full-size frame read by eye)
   - Ball Size: 7.0 (said "seven"; shown typed f016035, settled 7.0 f016275)
   - Coloring: Medium, Shading: -75.0 left at default (shown f016275)
4. Leave the rest at default; the black areas between balls become empty, so only the dots sit over the pale background (inferred from viewer f016275: the solid no longer hides the background)
layout: crop is a zoomed-in part of the comp: the viewer reads 180.2 % and no comp edge is inside it; scaled from a 1920-wide comp measuring 1506 px at 43.5 % in f019326 and corrected for this frame's recording scale (menu bar Edit to Window 887 px here against 842 px in f019326, factor 1.053), the crop shows about 24 % of the comp's width and 25 % of its height (measured on f016275); dot grid: square, pitch 27.5 crop px across and down, about 58 columns by 33 rows across the crop, so 1.7 % of the crop's width, which is about 0.42 % of the comp's width or roughly 8 comp px (measured on f016275); dot core: about 4 crop px, 0.25 % of the crop's width, roughly 1 comp px across (measured on f016275); dots cover the whole picture evenly, behind the shapes as well as in the open areas (measured on f016275, shares of the result crop, which shows about 24 % of the comp's width)
timing and easing: none given (static texture)
variations: the author says "somewhere around those values" — spacing near 3 and ball size near 7 are a starting point, not exact (said)
pitfalls: none given
longest on: setting the two values, Grid Spacing and Ball Size, on the effect; the opening shows a zoomed-in view of the dots to point them out (f015152, f015489)
build notes: Script: comp.layers.addSolid([0,0,0], "dots", comp.width, comp.height, 1); layer.property("ADBE Effect Parade").addProperty("CC Ball Action"); set effect("CC Ball Action")("Grid Spacing")=3 and ("Ball Size")=7; move the layer to just above the background. Check the dots' tone against the background after a render; the tutorial's dots render mid grey, not black, on a pale background (cause unknown). The author zooms the viewer to 180.2 % (magnification menu f016155, value f016275) to show the dots; at 100 % they are barely visible, so compare a build at similar zoom or on a crop (inferred). Nothing here needs the interface.
result: start=270 end=272 still crop=894,355,1592,909 frame=f016275 (viewer at 180.2 %; mask the "Active Camera (Default)" label and the mouse pointer when comparing)
before: f015855 (CC Ball Action at defaults: one huge ball fills the frame, background hidden)
unknowns: Why the dots read mid grey rather than black (layer opacity and blend mode are not shown; no Opacity or mode change is seen); whether the solid is 3D (no 3D switch is visible on it, f016275).

## Real cast shadows on an invisible 3D floor
id: 14-3d-floor-shadows
status: unproven
source: YBeMmC43Q1U 272–309 s
jobs: shadows and light; camera and 3D; depth and finish
what it does for a beat: Grounds flat 3D layers in a scene by giving them soft, believable shadows on the ground, without letting the light change the colour of the graphics themselves.
what it looks like: A pale UI-style scene (a rounded panel of icon buttons, a weather card, small stock tickers, a big bold title) gains a soft grey shadow that spreads across the floor beneath the objects, darkest just under them (about 78 to 88 % down) and lightening toward the bottom edge; the graphics keep their original flat colours.
ingredients:
- Solid layer as the floor — built-in (said "create a solid layer"); menu path Layer > New > Solid (inferred, not shown)
- 3D layer switch — built-in (said)
- Point Light — built-in (said "create a point light"); menu path Layer > New > Light (inferred, not shown); Light Options type "Point" shown f018257
- Material Options (Casts Shadows, Accepts Shadows, Accepts Lights) — built-in (said; shown f017788, f018538)
steps:
1. Make a solid layer, turn on its 3D switch (said)
   - Width x Height: 1920 x 1080 px, 100.0 % of comp (shown f016711)
   - Color: white, FFFFFF (shown f016711)
2. Lay the solid flat as a floor (said)
   - X Rotation: 0x+90.0° (said "90 degrees"; shown f017646)
3. Move the floor under the 3D graphics and scale it up a lot (said)
   - Position: 960.0,840.0,0.0 (shown f017646; earlier step value 960.0,968.0,0.0 seen at 4:36)
   - Scale: 233.0,233.0,233.0% (shown f017646)
   - Anchor Point: 960.0,540.0,0.0 left at default (shown f017646)
4. Move the floor down the layer stack so it sits directly below the 3D graphic layers (shown: layer 1 in f017131, layer 14 just under the 3D precomps 10-13 in f017646, f017788). In this comp only those layers and the floor have the 3D switch on; the title, noise and other layers above are 2D (shown f017646). With the Classic 3D renderer a 2D layer between 3D layers splits them into separate groups that cannot shadow each other, so the floor must sit next to the 3D graphics in the stack (inferred; not said)
5. Add a point light and place it so shadows fall where wanted; here it sits up, to the left and behind the graphics: positive Z points away from the default camera, so Z 2483.3 puts it behind them, and the shadows fall forward and down toward the camera (said "anywhere ... like behind your graphics"; position shown f018294; shadow direction shown f018354)
   - Position: -440.0,460.0,2483.3 (shown f018294 crop; the on-screen reader dropped the minus once)
6. Set the floor's Material Options so it shows only the shadows falling on it (said)
   - Accepts Shadows: Only (said; shown f017788)
   - Casts Shadows: Off (shown f017788)
7. In the light's options, soften and lighten the shadow and use a smooth falloff (said)
   - Casts Shadows: On (shown f018294)
   - Shadow Darkness: 45% (said "decrease"; shown f018294)
   - Shadow Diffusion: 205.0 pixels (said "decrease ... diffusion"; shown f018294 — the screen shows it scrubbed up from about 100 (f018257) to 205, so the narrator's word "decrease" fits darkness, not diffusion)
   - Falloff: Smooth (said; shown f018257)
   - Radius: 3530.0 (said "mess with the falloff settings"; shown f018294)
   - Falloff Distance: 500.0 left at default (shown f018294)
   - Intensity: 100%, Color: white (shown f018294)
8. Set each 3D graphic layer to ignore the light so its colours stay as designed, while still casting shadows (said)
   - Accepts Lights: Off (said; shown f018538, f018604)
   - Casts Shadows: On, Accepts Shadows: On (shown f018538); shown switched on two of the 3D precomps (f018538, f018604, and about 308.6 s)
layout: crop is the whole comp at 43.5 % (a 1920-wide comp at 43.5 % measures 1506 px in f019326; corrected for this frame's recording scale, menu bar Edit to Window 795 px here against 842 px there, it is about 1422 px, and the crop is 1420 x 796; measured on f018354); button panel: 17-51 % across, 12-78 % down; weather card: 53-85 % across, 51-76 % down; bold title word: 54-86 % across, 24-45 % down, with the script word above it reaching about 11 % down and 57-90 % across (measured on f018354); shadow on the floor: starts at the objects' bottom edge at about 78 % down, darkest from 78 % to about 88 % down (grey level about 47 against about 215 for open floor), lightening to about 180-190 at the bottom edge, and spans from about 20 % across to the right edge, with nothing at the far left (measured on f018354, compared with f016568 where the same area is an even pale grey) (all shares of the whole comp)
timing and easing: none given (static set-up; the graphics have their own animations)
variations: the light can be placed anywhere; behind the graphics is suggested (said). Shadow and falloff values are to taste ("you might want", "mess with") (said).
pitfalls: Without turning off Accepts Lights on the graphics, the point light will shade and tint them (said, as the reason for the last step).
longest on: the floor set-up (4:36-4:47) and the light settings (4:58-5:06) take about equal speaking time; the light settings — shadow darkness, shadow diffusion, smooth falloff and radius — with many settle frames while values are scrubbed (f017874–f018354)
build notes: Script: floor = comp.layers.addSolid([1,1,1],"floor",1920,1080,1); floor.threeDLayer=true; transform X Rotation 90, Position [960,840,0], Scale [233,233,233]; floor.moveAfter(<lowest 3D graphic layer>) so no 2D layer sits between it and the 3D graphics; floor.property("ADBE Material Options Group")("ADBE Accepts Shadows").setValue(2) (2 = Only), ("ADBE Casts Shadows").setValue(0). light = comp.layers.addLight("Point Light 1",[960,540]); light.lightType=LightType.POINT; Position [-440,460,2483.3]; Light Options: "Casts Shadows" 1, "Shadow Darkness" 45, "Shadow Diffusion" 205, "Falloff" 2 (Smooth), "Radius" 3530, "Falloff Distance" 500. For each 3D graphic: Material Options "Accepts Lights" 0, "Casts Shadows" 1. The scene uses the Classic 3D renderer (Geometry Options greyed, "Change Renderer..." shown); shadows need the graphics to be 3D layers or collapsed 3D precomps. Dropdown index values should be checked in the target After Effects version.
result: start=305 end=309 still crop=790,328,1420,796 frame=f018354 (taken just before the last step, Accepts Lights Off, so graphics may still be lit slightly; no clean later frame exists, the tip ends with gizmos showing f018604. Mask the light icon, pink selection handles at top left, yellow bounds on the cards and the camera label)
before: f016568 (same scene with no floor and no shadow)
unknowns: The comp's camera (default active camera shown, no custom camera given); how the graphics were made 3D (they are already 3D before the tip); the exact Classic 3D grouping reason for the stack move is not said.

## Un-clip an effect with Grow Bounds
id: 15-grow-bounds-fix
status: unproven
source: YBeMmC43Q1U 309–321 s
jobs: workflow; shadows and light
what it does for a beat: Fixes effects that are cut off with a hard edge because the layer's bounding box is too small, for example a blurred or stretched shadow running past the edge of its source artwork.
what it looks like: In a cartoon landscape of rolling green hills, trees and a sunset sky, each tree has a long soft shadow made from a dark-filled, radially blurred copy; before the fix the shadow stops at a straight edge, after it streaks smoothly across the hills.
ingredients:
- Grow Bounds — stock; Effect > Utility > Grow Bounds (effect name said and shown f019095; menu path not shown, inferred)
- Fill — stock (shown in the same stack, f018855)
- CC Radial Fast Blur — stock (shown f018855)
- Gaussian Blur — stock (shown f018855)
steps:
1. Start from a layer whose effects are being clipped at its edges; here a shadow copy of a tree with Fill (dark colour), CC Radial Fast Blur and Gaussian Blur (shown f018855)
   - Fill Opacity: 100.0%, Horizontal/Vertical Feather 0.0 (shown f018855)
   - CC Radial Fast Blur Center: 97.8,512.3; Amount: 95.0; Zoom: Standard (shown f018855)
   - Gaussian Blur Blurriness: 71.2; Blur Dimensions: Horizontal and Vertical; Repeat Edge Pixels: on (shown f018855)
2. Add Grow Bounds and drag it to the top of the effect stack, above every effect it must make room for (said; shown first in stack f019095, f019155)
3. Raise Pixels until the effect is no longer cut off (inferred from the value change; said only "solve the issue")
   - Pixels: 2050 (shown f019155)
layout: crop is the whole comp at 43.5 % (comp edges at the crop edges, measured on f019326); hill crest under the trees: about 64 % down; figure: centred at 50 % across, 57-64 % down; trees beside it at about 40 % and 60 % across, tops about 55 % down; repaired shadows: thin darker streaks running straight down from each base, from about 65 % to about 72-73 % down, roughly as long as the figure or tree is tall, about a third darker than the hill beside them (measured on f019326, shares of the whole comp)
timing and easing: none given
variations: none given
pitfalls: Grow Bounds must be at the top of the stack (said). It only helps effects limited by the layer's bounding box (said).
longest on: the frustration of clipped effects and placing Grow Bounds first in the stack
build notes: Script: var gb = layer.property("ADBE Effect Parade").addProperty("ADBE Grow Bounds"); gb.moveTo(1); gb.property("Pixels").setValue(2050). Very large values cost render time; use the smallest value that removes the clip (inferred, general advice). In the tutorial the layers are 3D under a camera (shown f018855); a 2D case is not shown.
result: start=322.0 end=322.4 still crop=860,352,1504,842 frame=f019326 (whole landscape at 43.5 %; repaired shadows show as thin dark streaks down the hills; mask the dotted selection box over the sun). Close-up reference: f019155 at 200 %, shadow now spreads past the old box edge, compare with f018855 (transform gizmo in both)
before: f018855 (shadow ends in a hard clipped edge on the hill, viewer zoomed to 200%)
unknowns: how the shadow copy is made and positioned (outside this tip); the Pixels value before scrubbing is partly covered by the cursor in f019095; it reads about 10, the effect default (shown, partly). Fill colour is a dark near-black grey (shown f018855), exact value unreadable.

## Keep a chosen layer sharp while the camera travels
id: 16-lock-focus-to-layer
status: unproven
source: YBeMmC43Q1U 321–341 s
jobs: camera and 3D; depth and finish
what it does for a beat: Use when a camera push or drift through a layered 3D scene should keep the hero element crisp the whole time, so depth of field never drifts off the subject as the camera's distance to it changes.
what it looks like: A stylised 3D landscape of rounded hills, trees and puffy clouds against a big warm sun; the camera pushes in from a wide view towards a small silhouetted figure on a hilltop, and the figure stays sharp while nearer hills and farther trees soften.
ingredients:
- 3D camera with depth of field — built-in; Layer > New > Camera (inferred)
- Link Focus Distance to Layer — built-in; layer context menu > Camera > Link Focus Distance to Layer (said; shown f020069)
steps:
1. Build the scene from 3D layers and animate a camera move through it (inferred; the move plays at 337–341 s but its keyframes are not shown)
   - The camera is parented to a null (shown f019589, f019709: the camera's parent column reads a null); that the push is animated on this null is inferred, neither said nor shown
2. Make sure the camera's depth of field is on so that focus matters (inferred; before the link the figure itself is soft, f019709, so depth of field is already on; the switch itself is not shown)
3. Select the camera layer and the layer to keep in focus together (said; shown f019889, camera and the figure layer both highlighted)
4. Right-click one of them and choose Camera > Link Focus Distance to Layer (said; shown f020069)
   - Not the neighbouring "Set Focus Distance to Layer", which sets the value once; Link keeps it following (inferred from the menu in f020069 and the narrator's "the entire time")
   - "Link Focus Distance to Point of Interest" is greyed out in this menu (shown f020069), so it was not an option for this camera (inferred: likely a one-node camera)
5. Play the camera move: the chosen layer stays in focus for the whole move (said; shown in the playback after the link, 337–341 s: wide view pushing in to the figure, figure sharp, near hills soft; f020429)
layout: crop is the whole comp at 43.5 % (comp edges at the crop edges, measured on scratch/16/result-340.8.png); at the end of the push: figure centred at 50 % across, 50-65 % down (about 15 % of the comp's height), feet on the hill crest at about 65 % down; trees either side at 25-34 % and 69-75 % across; sun disc about 55 % of the comp's width, centred at 50 % across; at the start of the push (scratch/16/layout-start-337.6.png, 337.6 s): figure at 50 % across, 58.5-64 % down (about 5.5 % of the comp's height), sun disc about 27 % of the comp's width, so the push roughly doubles the sun and nearly triples the figure while the figure's feet stay near 64-65 % down (measured on scratch/16/result-340.8.png and scratch/16/layout-start-337.6.png, shares of the whole comp)
timing and easing: none given (the camera move itself was pre-built; its keyframes are not shown)
variations: none given
pitfalls: none given
longest on: the menu route — selecting both layers and finding Camera > Link Focus Distance to Layer in the right-click menu; most of the tip's time is the menu on screen.
build notes: Camera layer: Camera Options > Depth of Field must be On (property "Depth of Field", matchName ADBE Camera Depth of Field). The menu command writes an expression on Camera Options > Focus Distance (ADBE Camera Focus Distance) that measures the world-space distance from the camera to the target layer; a script can write an equivalent expression itself, for example `var t = thisComp.layer("TARGET"); length(toWorld([0,0,0]), t.toWorld(t.anchorPoint));` (inferred; the expression text is not shown in the video). Use toWorld because the camera is parented to a null. The menu command itself can only be reached by hand in the interface (or app.executeCommand with an id we do not have).
result: start=340.5 end=341.0 animated crop=866,352,1518,852 frame=scratch/16/result-340.8.png (cut from source.mp4 at 340.8 s; kept frame f020429 is the same shot). The push itself plays 337.5–340.5 s in the same crop; from 340.5 to 341.0 the pushed-in, finished framing holds and the layout does not shift. No clean frame exists: the mouse cursor sits in the picture just below the figure throughout the playback.
before: f019709 (comp time 0:00:05:00, just before the link: the figure on the hilltop is visibly out of focus)
unknowns: camera Aperture, Blur Level, F-Stop and Focal Length; whether depth of field was switched on by the author in this tip or earlier; the camera rig's keyframes, duration and easing; the exact expression the command writes.

## Tie a 3D scene together with depth fog over the precomp
id: 17-depth-fog
status: unproven
source: YBeMmC43Q1U 341–356 s
jobs: depth and finish; camera and 3D; glow and colour
what it does for a beat: Use when separately made 3D layers look pasted together; a coloured depth fog over the finished scene lifts the darks and sinks the distance into one atmosphere.
what it looks like: A dark blue-teal night forest with tree trunks receding behind a small character in an orange cloak holding a flame; with the fog on, the background trunks and blacks lift into a soft teal haze and the scene reads as one space (compare f020709 off with f021339 on).
ingredients:
- Fog 3D — stock (3D Channel category); Effects & Presets search "Fog", listed under 3D Channel (shown f020840)
- precomp of the 3D scene — built-in; Layer > Pre-compose (said)
steps:
1. Precompose the 3D scene so it becomes one layer in an outer comp (said; shown f020482, the scene is one precomp layer)
2. Apply Fog 3D to that precomp layer (to show the defaults the author deletes it and applies it fresh, 345–350 s: f020840 has no effect on the layer, f021117 shows the defaults), found by typing "Fog" in Effects & Presets (said; shown f020840; the narrator's "on top of the composition" is shown as the effect sitting on the precomp layer itself, f020482)
3. Set the fog colour to a dark blue-teal matched to the scene (shown f020482; value inferred from the swatch, sampled between about RGB 9,37,55 and 15,39,55 in different frames, so treat it as approximate)
4. Adjust the depth range and density by eye until it looks right (said: "mess with the settings"); the values used:
   - Fog Start Depth: 51.00 (shown f020482; default 0.00 shown f021117)
   - Fog End Depth: -23.00 (shown f020482; default 0.00 shown f021117)
   - Fog Opacity: 100.00 (shown f020482)
   - Scattering Density: 24.00 (shown f020482; default 50.00 shown f021117)
   - Foggy Background: on (shown f020482)
   - Gradient Layer: None, Source (inferred from truncated menu text "N..." and "So..." in f020482)
   - Layer Contribution: 100.00 (shown f020482; default 0.00 shown f021117)
5. Toggle the effect off and on to judge it (shown f020709 off, f021339 on; the author flicks the fx switch repeatedly from about 353 to 356 s)
layout: crop is the whole comp at 43.5 % (the selected precomp's corner and edge handles sit on the crop edges, measured on scratch/17/result-356.2.png); character: 39-57 % across, 34-83 % down, centred near 49 % across; tree trunks fill the upper 60 % of the picture, foliage the bottom 40 %; fog effect: the upper 60 % gets about a third brighter (mean level 15.5 to 20.5 on 0-255) and the trunk-to-gap contrast across a row at 15 % down nearly halves, while the bottom 20 % changes little (measured on scratch/17/result-356.2.png against f020709 fog off, shares of the whole comp)
timing and easing: none given (static settings)
variations: none given beyond tuning the settings to taste (said)
pitfalls: none given
longest on: the Fog 3D settings — the author shows the default values, scrubs Fog Start Depth, and lands on the values above; the stress is that it is a matter of tuning to the scene.
build notes: Effect display name "Fog 3D" (match name ADBE FOG3D, inferred), properties "Fog Color", "Fog Start Depth", "Fog End Depth", "Fog Opacity", "Scattering Density", "Foggy Background", "Gradient Layer", "Layer Contribution". Apply to the precomp layer (layer.property("ADBE Effect Parade").addProperty("ADBE FOG3D")). The comp in the example runs at 23.976 fps with Quarter resolution in the viewer. Fog 3D is a 3D Channel effect that reads depth from the layer; whether it gets real depth from a precomp of After Effects 3D layers depends on the version and renderer, so check that the fog actually varies with depth before relying on it (inferred, not covered by the video).
result: start=355.7 end=356.5 still crop=896,362,1576,884 frame=scratch/17/result-356.2.png (cut from source.mp4 at 356.2 s; kept frame f021339 at 355.65 s is also fog-on). Before 355.7 s the effect is being switched off and on every half second or so, so only this window holds the fog-on picture throughout; at 356.6 s the video cuts to the next tip. No fully clean frame: the precomp layer is selected, so its handles and anchor-point mark show in the picture; the cursor is outside it.
before: f020709 (same frame with Fog 3D switched off)
unknowns: exact Fog Color value (only sampled from the video); how the precomp's depth reaches the effect; the units of Start/End depth relative to the scene; the effects on a separate adjustment-style layer above the scene are not part of this tip.

## Soft word-by-word rise-and-fade text reveal
id: 18-smooth-text-reveal
status: unproven
source: YBeMmC43Q1U 356–383 s
jobs: type
what it does for a beat: Use for a headline or tagline that should arrive gently, words sliding up and fading in one after another with a smooth overlap, with no per-word keyframes.
what it looks like: A two-line bold sans headline in near-black on an off-white background; words rise a short distance and fade from grey to solid left to right, each overlapping the next (f022965: the first three words solid, the fourth still pale and low). The fan of photo cards above, the underline under one word and the small button below are separate layers with their own animations (shown f021753, separate layers parented to a null), not part of this technique.
ingredients:
- Text animator with Position and Opacity — built-in; text layer > Animate > Position, then Animator 1 > Add > Property > Opacity (said; shown f021753)
- Range Selector Advanced options — built-in (shown f022319)
steps:
1. On a text layer add a Position animator (said; shown f021753, Animator 1 with Position)
2. Add Opacity to the same animator via its Add menu (said; shown f021753, cursor on Add)
3. Push the animator's Position down and set its Opacity to 0% (said)
   - Position: 0.0,115.0 at first (shown f022123), later changed to 0.0,75.0 (shown f022629; not said)
   - Opacity: 0% (said; shown f022123)
4. Open Range Selector 1 > Advanced and set:
   - Based On: Words (shown f022319; not said)
   - Units: Percentage, Mode: Add, Amount: 100% (shown f022319, left at default)
   - Shape: Ramp Up (said; shown f022319, f022565)
   - Ease High: -50% (said "like -50"; shown f022565)
   - Ease Low: 100% (said; shown f022565)
   - Randomize Order: Off (shown f022565)
   - Start 0%, End 100% left at default (shown f022565)
5. Keyframe Range Selector Offset from -100% to 100% (said)
   - Offset: -100% at 0:00:01:05 comp time, the layer's in point (shown f023025)
   - Offset: 100% at 0:00:03:06 (shown f022899)
6. Play: the words rise and fade in left to right (shown f022965 mid-reveal, f023025 finished)
   - The text layer is parented to a null (shown f022965: parent column reads "3. Null 1"); mid-reveal the whole first line sits about 11 % of the comp's height higher than when finished (measured on f022965 against scratch/18/result-384.1.png), so the block also travels down while the words reveal, most likely because the parent null moves (inferred; its keyframes are not shown)
layout: crop is the whole comp at 43.5 % (comp edges at the crop edges, measured on scratch/18/result-384.1.png); finished headline: centred on 50 % across; line 1 spans 19.9-80.1 % across (60 % of the comp's width), ink 55.2-61.9 % down; line 2 spans 32.3-68.1 % across (36 %), ink 66.3-73.1 % down; line to line 11.1 % of the comp's height (measured on scratch/18/result-384.1.png); mid-reveal: a settled word's ink is about 7 % of the comp's height tall and the word still entering sits about 3.5 % of the comp's height lower and mid grey, about half the 75 px push (measured on f022965); the whole first line sits about 11 % of the comp's height higher mid-reveal than when finished, so something else moves the block as well (measured on f022965 against scratch/18/result-384.1.png) (all shares of the whole comp)
timing and easing: Two Offset keyframes, -100% at comp frame 29 (0:00:01:05) and 100% at frame 78 (0:00:03:06) in a 23.976 fps comp, about 49 frames / 2.0 s (shown f023025, f022899). Both keyframes are linear diamonds (shown f022899, cropped); the softness comes from Ramp Up plus Ease High/Low, not from keyframe easing (inferred).
variations: none given
pitfalls: none given
longest on: the Range Selector Advanced settings — Shape Ramp Up with Ease High -50% and Ease Low 100% — which the author presents as what makes it smooth.
build notes: Text layer > Text > Animators: addProperty("ADBE Text Animator"); in its Properties add "ADBE Text Position 3D" (0,75) and "ADBE Text Opacity" (0). Range selector "ADBE Text Selector": Advanced > "Based On" = Words (3; menu order Characters 1, Characters Excluding Spaces 2, Words 3, Lines 4; from memory, verify in After Effects), "Shape" = Ramp Up (2; from memory, verify in After Effects), "Ease High" -50, "Ease Low" 100; keyframe "Offset" -100 → 100 with linear interpolation. All settable by script.
result: start=383.7 end=384.2 still crop=856,340,1506,848 frame=scratch/18/result-384.1.png (cut from source.mp4 at 384.1 s; kept frame f023025 at 383.75 s also shows the finished state). The reveal itself plays 381.6–383.6 s in the same crop (f022965 is mid-reveal); from 383.7 s both lines are solid and the layout holds until the cut to the next tip at about 384.3 s. No fully clean frame: the mouse cursor is in the picture throughout; at 384.1 s it sits lower left by the button, off the text. The cards and button in the picture are separate animations.
before: f022123 (animator set, Position 0,115 and Opacity 0%, text hidden)
unknowns: whether Position 115 or 75 was the intended final value (75 is what the end state shows); font size and font (two different fonts appear in the character panel across frames); whether the author also changed anything on the layer's own transform; the parent null's motion (keyframes, distance, timing and easing are not shown; only the block's roughly 11 % shift between mid-reveal and finished is seen).

## Text that runs round a drawn path
id: 19-text-on-a-path
status: unproven
source: YBeMmC43Q1U 383–404 s
jobs: type; lines and shapes
what it does for a beat: Wrap a repeated line of type round a circle (or any shape you draw) and slide it along the path, so a badge or seal of words circles a central title.
what it looks like: A short all-caps phrase repeated three times sits in a ring round a bold two-line title, white on near-black; the ring of words travels round the circle as the first margin animates.
ingredients:
- Text layer — built-in
- Mask on the text layer, drawn with the Ellipse (shape) tool or the Pen tool — built-in
- Text > Path Options (Path, Reverse Path, Perpendicular To Path, Force Alignment, First Margin, Last Margin) — built-in; in the text layer's Text group in the timeline
steps:
1. Make a single-line text layer holding the phrase repeated until it is long enough to fill the circle (shown f023385)
   - Font: a heavy geometric sans, Black weight (shown f023644; family name not used here)
   - Size: 35 px, later raised to 48.7 px (shown f023644, f023911)
   - Tracking: 125 (shown f023644)
   - Fill: white character colour (shown f023644); the layer also carries a Fill effect set to white (shown f023644, Effect Controls)
2. With the text layer selected, draw a closed circular mask on it with the Ellipse tool; the Pen tool works for a custom shape (said; ellipse tool active shown f023385, circle mask shown f023644)
3. Open Text > Path Options and set Path to the mask (said; shown f023725). The type now wraps the circle, letters perpendicular to the path (Perpendicular To Path On, shown f023725; that On is the default is inferred)
4. Set the mask's mode to None so it no longer cuts the layer (shown f023725, f023911: Mask 1 mode None)
5. Resize the text so the phrase fills the circle without overlapping (said; size raised to 48.7 px, shown f023911)
6. Turn Reverse Path On if the type sits inside or reads the wrong way round (said; Reverse Path On shown f024031; after it the letters stand on the outside of the ring reading clockwise)
7. Animate First Margin to make the type travel round the path (said; shown f024031, f024211)
   - First Margin keyframe 1: 0.0 at 0:00:00:00 (shown f024031)
   - First Margin keyframe 2: 512.0 at 0:00:03:01 (shown f024211; comp is 23.976 fps)
   - Force Alignment: Off, Last Margin: 0.0 (shown f024211)
8. A separate bold two-line title layer sits in the centre of the ring; it is example content, not part of the technique (hidden in f023385–f023911, visible from f024031: shown)
layout: ring of type: outer diameter about 43% of the comp's width and 76% of its height, i.e. a circle about 0.76 of the comp height across (measured on scratch/19/f024114.png, shares of the whole comp: the viewer is at 43.5% zoom with the comp's edges at the panel's edges, and the result crop covers about 97% of the comp's width, missing a sliver at the right); ring centre at about 50% across, 50% down (measured, same frame, shares of the whole comp); ring letters about 4% of the comp's height tall, three repeats of the phrase with roughly one word-space between them (measured, same frame, shares of the whole comp); centre title block about 25% of the comp's width by 24% of its height, centred at about 51% across, 51% down, tilted about 10 to 13 degrees anticlockwise (measured, same frame, shares of the whole comp)
timing and easing: First Margin 0 to 512 over about 3 s (0:00:00:00 to 0:00:03:01 at 23.976 fps); no ease given (keyframes look linear, inferred from the diamond icons in f024211).
variations: Path can be any mask drawn with the shape tools or the Pen tool (said).
pitfalls: none given (inferred: leaving the mask on Add hides everything outside the circle, which is why it is set to None).
longest on: Path Options: choosing the mask, then Reverse Path and the First Margin animation (said and shown f023725–f024211).
build notes: Script: add a text layer; layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom") with an elliptical Shape (four vertices with tangents), maskMode = MaskMode.NONE. Then layer.property("ADBE Text Properties").property("ADBE Text Path Options"): "ADBE Text Path" = mask index (1), "ADBE Text Reverse Path" = 1, "ADBE Text Perpendicular To Path" = 1, "ADBE Text Force Align Path" = 0, "ADBE Text First Margin" setValueAtTime(0, 0) and setValueAtTime(3.04, 512). Tracking and size via TextDocument (tracking 125, fontSize 48.7). Everything is scriptable.
result: start=401.9 end=404 animated crop=828,304,1392,804 frame=f024114 (not a kept frame: cut from source.mp4 at 401.9 s, saved as scratch/19/f024114.png; same state as f024211, no cursor)
before: f023385 (phrase on one straight line with the circle being drawn)
unknowns: exact phrase length/number of repeats needed; circle diameter not given (measured: the ring is about 0.77 of the comp's height across, about 830 comp px, about 360 px on screen at 43.5%; on scratch/19/f024114.png); keyframe easing; comp size; whether the mask is inside the text layer or a separate path layer (shown inside, Masks > Mask 1, f023725).

## Two stacked glows for a soft cinematic bloom
id: 20-two-pass-glow
status: unproven
source: YBeMmC43Q1U 404–421 s
jobs: glow and colour; depth and finish
what it does for a beat: A finishing pass on bright line art or type on a dark ground: one tight glow for a halo near the edges plus one very wide glow for a faint bloom, without looking blown out.
what it looks like: Thin white circle arcs with dot ends and a light word in the centre, on near-black; the white parts carry a close soft halo and a wide, faint haze around the whole graphic.
ingredients:
- Adjustment layer above the graphic — built-in; Layer > New > Adjustment Layer (inferred menu path; adjustment switch on the top layer shown f024631)
- Glow — stock; Effect > Stylize > Glow (shown f024451, Effects & Presets search "Glow" under Stylize)
steps:
1. Put an adjustment layer at the top of the comp over the graphic (said; shown f024631)
2. Apply Glow to the adjustment layer (said; shown f024451)
3. Raise Glow Radius slightly from its default (said; shown f024631)
   - Glow Radius: 39.0 (shown f024631, f024751)
   - Glow Threshold: 60.0% (shown f024631; default)
   - Glow Intensity: 1.0 (shown f024631; default)
   - Glow Based On: Color Channels; Composite Original: Behind; Glow Operation: Add; Glow Colors: Original Colors (shown f024631; all defaults)
4. Duplicate the Glow effect on the same layer (said). The duplicate itself never appears on screen: only one Glow, labelled "Glow", is ever visible, directly under Noise in an unscrolled Effect Controls panel (shown f025291). A caption burned into the video states that the glow was duplicated (shown f024751). The keyboard shortcut (Ctrl/Cmd+D) is neither said nor shown (inferred)
5. Raise one glow's radius to just above 200 (said "just above 200 or so")
   - Glow Radius: 242.0 on the visible effect labelled "Glow", scrubbed from 39.0 (shown f024751) up to 282.0 (shown f024871), back through 266.0 (shown f025051) to 242.0 (shown f025291)
   - The other glow is never shown; it presumably keeps radius 39 (inferred)
   - Other properties of the visible glow: unchanged (Threshold 60%, Intensity 1.0, Behind, Add; shown f025291)
layout: arc ring: about 26% of the comp's width and 47% of its height across, centred at about 51% across, 50% down (measured on f025291, shares of the whole comp: the viewer is at 43.5% zoom and the result crop takes in the whole comp); three arcs of about 80 to 85 degrees each, centred about 120 degrees apart, with gaps of about 33 to 43 degrees between them (measured, same frame, angles read from the arc ends); dot ends about 1% of the comp's width across, line about 0.2% (measured, same frame, shares of the whole comp); centre word about 9% of the comp's width wide and 5% of its height tall (measured, same frame, shares of the whole comp)
timing and easing: none given (static finish).
variations: The second radius is "around" 200 (said); the first is only a slight increase (said).
pitfalls: none given.
longest on: Setting the very large radius; the author scrubs it up to 282 and back to 242 (shown f024871, f025051, f025291).
build notes: Script: adj = comp.layers.addSolid([1,1,1], "Glow", w, h, 1); adj.adjustmentLayer = true; adj.moveToBeginning(). g1 = adj.property("ADBE Effect Parade").addProperty("ADBE Glo2"); g1.property("Glow Radius").setValue(39). g2 = g1.duplicate() (or add a second "ADBE Glo2"); g2.property("Glow Radius").setValue(242). Leave Threshold 60%, Intensity 1.0. Fully scriptable. The example adjustment layer also carries a Noise effect at 12% above the glow (shown f024631); that is a separate finish, not part of this tip.
result: start=419 end=421.5 still crop=856,340,1490,844 frame=f025291
before: none clean; the tip opens on the already-glowing graphic (f024331)
unknowns: the duplicate glow is never shown, so which glow carries 39 and which 242, and their order in the stack, are not given (for a build the order matters little: both use Add and the same threshold, inferred); the comp's colours beyond white on near-black; whether the noise effect matters to the look.

## Paper texture through a title matte, with roughened edges
id: 21-texture-through-a-matte
status: unproven
source: YBeMmC43Q1U 421–445 s
jobs: texture; type; depth and finish
what it does for a beat: Make a title look printed or stamped into a worn paper texture instead of floating on top of it: the texture itself forms the letters, brightened, and the letter edges are broken up.
what it looks like: A tall condensed all-caps word in grey, made of the same creased, scratched dark paper as the background, with ragged, eroded edges; small white labels sit around it.
ingredients:
- A texture layer (dark creased paper footage or still) and a duplicate of it — built-in; Edit > Duplicate
- A title layer filled black (Fill effect, colour black) — built-in (shown f026231)
- Track Matte column, Alpha matte — built-in (menu shown f025640; alpha matte set shown f025962, crop scratch/21/matte-icon.png)
- Curves — stock; Effect > Color Correction > Curves (shown f025962)
- Roughen Edges — stock; Effect > Stylize > Roughen Edges (shown f026231)
steps:
1. Start with the texture as the bottom layer and a black title above it (said; shown f025640, title reads black on the paper)
2. Duplicate the texture layer and move the copy directly under the title (said; shown f025640: two texture layers, copy at layer 6 under the title at 5)
3. Set the copy's Track Matte to the black title layer, Alpha matte, not inverted (said; menu shown f025640, alpha icon shown f025962). The title layer's own visibility is off once the matte is set (shown f025962; in f025640 its eye is still on)
4. Add Curves to the matted texture copy and lift it so the title reads lighter than the background (said; shown f026082)
   - Channel: RGB (shown f026082)
   - Curve: white point dragged far left, roughly input 33 of 255 to output 255, a steep straight line (read by eye from the opening preview of the finished state, f025351, inferred; during the build in f026082 the drag is still in progress at about input 100)
5. On the title layer (the matte), add Roughen Edges (said; title layer selected and Roughen Edges found under Stylize in f026231; effect on the title layer shown f026537)
   - Edge Type: Roughen (shown f026357, f026717; that it is the default is inferred)
   - Border: scrubbed through 26.10 (shown f026357) and 20.00 (shown f026537), ending at 19.00 (shown f026717); a starting value of 8.00 comes from the text reader, not checked on a frame
   - Edge Sharpness: 1.00 (shown f026357) → 10.00 (shown f026717)
   - Fractal Influence: 1.00 (shown f026717)
   - Scale: 100.0 (shown f026357) → 10.0 (said "lower the scale"; shown f026717)
   - Stretch Width or Height: 0.00; Offset (Turbulence): 0.0, 0.0; Complexity: 2 (shown f026717)
   - Evolution: 1x +161.4° (shown f026717)
6. The title layer also carries a Displacement Map that pushes the letters with the texture (shown f026231; not narrated)
   - Displacement Map Layer: the bottom texture layer, Effects & Masks (shown f026231)
   - Use For Horizontal: Red, Max Horizontal Displacement: 0.0 (shown f026231)
   - Use For Vertical: Green, Max Vertical Displacement: 46.0 (shown f026231)
   - Displacement Map Behavior: Center Map; Wrap Pixels Around: off; Expand Output: on (shown f026231)
layout: title word: about 54% of the comp's width wide (left edge at 23%, right at 77%) and 42% of its height tall (top at 26%, bottom at 68%), centred at about 50% across, 47% down (measured on f026657, shares of the whole comp: the viewer is at 41.4% zoom and the result crop takes in the whole comp); letter strokes about 3% of the comp's width thick; roughened edge breaks up the outline by about 0.5% of the comp's width (measured, same frame); small label line under the title at about 77% down, about 15% of the width wide; top label line centred at about 12% down; bottom-left label block at about 4% in, 85 to 94% down (measured, same frame, shares of the whole comp)
timing and easing: none given for the technique (the title has an "IN" layer marker, shown f025640, so it likely animates on; not covered).
variations: Works for "anything", a title or a graphic, as long as the matte layer is black (said).
pitfalls: Once matted, the texture copy matches the background, so the title nearly vanishes (shown f026082, title faint; inferred cause: it is the same texture); Curves is what brings the title back (said). Lowering Roughen Edges Scale is what blends the edge into the grunge (said).
longest on: Roughen Edges, especially lowering Scale; the author scrubs Border, Edge Sharpness, Scale and Evolution (shown f026357, f026537, f026717).
build notes: Script: tex2 = tex.duplicate(); tex2.moveAfter(title) (must sit directly below the matte); in AE 2023+ tex2.setTrackMatte(title, TrackMatteType.ALPHA), older: tex2.trackMatteType = TrackMatteType.ALPHA with title directly above; title.enabled = false. Curves ("ADBE CurvesCustom") curve points are not scriptable: set by hand, or substitute Levels ("ADBE Easy Levels2") with Input White about 33/255 (inferred equivalent). Title: Fill ("ADBE Fill", Color black), Displacement Map ("ADBE Displacement Map"), Roughen Edges ("ADBE Roughen Edges") with "Border" 19, "Edge Sharpness" 10, "Scale" 10, "Complexity" 2, "Evolution" 161.4 + 360 deg.
result: start=443 end=445.3 still crop=986,386,1514,850 frame=f026657 (same state as f026717, no cursor)
before: f025640 (black title sitting on the paper texture before the matte)
unknowns: the texture source; title font, size and colour beyond black; exact curve points; whether the Displacement Map is meant as part of this technique; the title's in-animation.

## Tuck helper layers out of the timeline with the shy switch
id: 22-hide-layers-shy
status: unproven
source: YBeMmC43Q1U 445–461 s
jobs: workflow
what it does for a beat: When a comp has dozens of support layers (mattes, lines, labels) and you only want to touch a few, mark the rest shy and hide them from the layer stack without precomposing. The comp structure and the render stay unchanged.
what it looks like: In the example, a long stack of about ninety layers (photo cards arranged around a wheel, each with its own matte, outline, decoration and text layers) shrinks to a short list: the card images, their box layers, a null, an effects layer, the wheel and the background. Pressing the master toggle leaves the composition picture as it was.
ingredients:
- Shy layer switch (per layer, in the A/V switches column) — built-in
- Hide All Shy Layers toggle (comp button above the layer stack in the Timeline panel) — built-in
steps:
1. In the Timeline, click the shy switch on each layer you want out of the way; its icon changes to the "peeking figure" shape (said; shown f027224)
   - Layers marked here: the decoration, outline and text layers and the mattes; the card image, box, null, effects, wheel and background layers stay unmarked (shown f027224, f027653)
2. Click the Hide All Shy Layers button in the Timeline panel's top bar to collapse the marked layers out of view (said; shown f027410, tooltip "Hides all layers for which the 'Shy' switch is set" at about 458.5 s)
3. Work on the remaining layers (said); the shy layers still render, since the viewer shows the same picture before and after the toggle (shown f027410 → f027653)
layout: not a picture of the comp; the Timeline panel after hiding shows 28 of 88 layers (measured on f027653): FX (1), Null 1 (2), twelve image layers each followed by its box shape layer (7/9, 14/16, 21/23 … 84/86, a pair every 7 layer numbers, so 5 shy layers per card; the image is parented to its box and each box to Null 1), then the wheel (87) and background (88); 60 layers hidden; rows about 36 px apart at this recording's interface scale
timing and easing: none given
variations: none given
pitfalls: none given (the author only contrasts it with precomposing, which is not needed)
longest on: Clicking the per-layer shy switches down the long stack, about 10 s (7:25.9–7:35.6), against about 5 s on the master toggle.
build notes: Set `layer.shy = true` on each layer to hide, then `comp.hideShyLayers = true`. Both are scriptable; nothing has to be done by hand. Shy affects only the Timeline display, never the render, so compare a build by its Timeline layer list, not by a render.
result: start=460.2 end=461.0 still crop=430,1060,1410,1040 frame=f027653 (the Timeline panel's shortened layer stack, layers 1, 2, 7, 9, 14 … 86, 87, 88; the composition picture does not change)
before: f027044 (full stack, layers 27–73 visible, no hiding)
unknowns: Which layers were marked shy before the recording began: f026777 shows most switches already set, while f027044 shows switches unset, so the author cleared and set them again on camera. The interface layout keeps shifting until about 460.2 s, so the crop only fits from there.

## Dial motion blur strength with the comp's shutter angle
id: 23-shutter-angle-blur
status: unproven
source: YBeMmC43Q1U 461–475 s
jobs: energy and impact; workflow
what it does for a beat: When motion blur is on but reads too subtle (or too smeary), change the composition's shutter angle to set how long each frame's blur streak is, without touching the animation.
what it looks like: A ring of white bold words spinning in 3D on a dark grainy background; at the default angle the letters show a light trail, and after raising the angle the moving words smear into long, soft horizontal streaks.
ingredients:
- Layer Motion Blur switch and the comp Enable Motion Blur toggle — built-in
- Composition > Composition Settings (Ctrl+K) > Advanced tab > Motion Blur group — built-in
steps:
1. Have motion blur switched on for the moving layers and for the comp (inferred; layer motion blur switches appear filled on the two text layers and the comp toggle lit in f027900)
2. Open Composition > Composition Settings (said; shown f028080, menu item "Composition Settings... Ctrl+K")
3. Go to the Advanced tab (said; shown f028191)
4. Change Shutter Angle (said "mess with the shutter angle"; shown f028191 → f028264)
   - Shutter Angle: 180° default → 720° (shown f028191, f028264)
   - Shutter Phase: -90° left unchanged (shown f028191)
   - Samples Per Frame: 16 (shown f028191)
   - Adaptive Sample Limit: 128 (shown f028191)
5. Leave Preview ticked (shown f028264), confirm the dialog and play the comp to compare (inferred; the dialog is gone and the blurred spin plays by about 473.8 s)
   - The example has two text layers holding the same word, both parented to a null (shown in the Timeline, f028450); the second shows as a darker copy one cap height below each word (measured on f028450)
   - Comp: 1920 x 1080, 23.976 fps (shown on the Basic tab at about 469.0 s, crop scratch/23/basic-469.0.png; 23.976 fps also in the timecode, f027900)
layout: spinning ring of words: spans about 24% to 75% across (about 51% of the comp's width) and about 33% to 72% down, centred at about 50% across (measured on f028450, shares of the whole comp: the viewer is at 41.4% zoom and the result crop takes in the whole comp); the front word is about 31% of the comp's width wide with capitals about 10% of its height tall, the back word about 7% tall (measured, same frame, shares of the whole comp); a darker copy of each word sits directly under it, offset down by about one cap height (measured, same frame); at 720 degrees the vertical strokes of the front word are smeared sideways by about 1% of the comp's width (measured, same frame, shares of the whole comp)
timing and easing: none given (the spinning ring's animation is pre-built in the example)
variations: Any angle can be used to dial the blur amount up or down (said)
pitfalls: none given
longest on: On screen, playing the spin at the default angle before opening the dialog (about 7:42–7:48, f027720–f028020); the dialog itself is open about 3.5 s (f028191–f028392). The narration puts its weight on the shutter angle as the control for blur amount.
build notes: `comp.motionBlur = true`; `layer.motionBlur = true` on the moving layers; `comp.shutterAngle = 720` (range 0–720); `comp.shutterPhase = -90`; `comp.motionBlurSamplesPerFrame = 16`; `comp.motionBlurAdaptiveSampleLimit = 128`. All scriptable.
result: start=473.8 end=475.2 animated crop=896,342,1366,768 frame=f028450
before: f027900 (same spin at the default 180°)
unknowns: The motion behind the effect (how the ring of words is animated, its speed); whether any other comp settings were touched; the exact moment the dialog was confirmed. Whether the second, darker text layer is flipped like a reflection cannot be told at this blur. Whether the viewer updated live with Preview on is not shown (the viewer is the same in f028191 and f028264).

## Keep a scaled-up precomp of vector art crisp
id: 24-sharp-scaled-precomp
status: unproven
source: YBeMmC43Q1U 475–488 s
jobs: workflow; depth and finish
what it does for a beat: When a precomp built from shape and text layers is pushed far past 100% (a big push-in or a hero zoom), turn on the layer's collapse/rasterize switch so the vector contents are redrawn at the new size instead of being enlarged as pixels.
what it looks like: An old-style error-dialog graphic (black title bar, grey panel, X icon, "FIX" button) is scaled until a few letters fill the frame; without the switch the edges are soft and blocky, with it the letters stay razor sharp.
ingredients:
- Collapse Transformations / Continuously Rasterize switch (the sunburst switch in the Switches column) — built-in
steps:
1. Put the vector-built graphic (shape and text layers) in a precomp and place it in the main comp (shown f028572, the precomp's contents)
2. Scale the precomp layer up a long way; it turns blurry and pixelated (said; shown f028752, f028973)
   - Scale: 100% → 670% → 2050% (shown f028752, f028973)
3. Click the sunburst switch on the precomp layer, the one the narrator calls continuously rasterize (said; shown f029105, switch filled)
4. The enlarged graphic re-renders sharp; scaling back down (160% around f029225, then 400%) also stays clean (shown f029105, f029285)
layout: at 2050% scale the word FIX has capitals about 45% of the comp's height tall and spans about 10.5% to 55% across, its stems about 3.3% of the comp's width thick (measured on f029105, shares of the whole comp: the viewer is at 41.4% zoom and the result crop takes in the whole comp); the gap between FIX and the next word is about 11.6% of the comp's width; the line above sits with its baseline about 61% of the comp's height higher (measured, same frame, shares of the whole comp); the layer's anchor point marker is at the comp centre, 50% across, 50% down, just right of the X (measured, same frame); background a flat light grey
timing and easing: none given
variations: none given
pitfalls: Scaling a precomp far up makes it pixelated if the switch is off (said)
longest on: Pushing the scale up to show the blurry, pixelated edges before the fix.
build notes: `precompLayer.collapseTransformation = true` (the same switch is labelled Collapse Transformations on precomp layers and Continuously Rasterize on vector/Illustrator layers). Scale via `layer.transform.scale.setValue([2050,2050])`. Works only when the precomp's contents are vector (shape/text); raster footage inside will still soften.
result: start=485.1 end=486.5 still crop=986,374,1520,856 frame=f029105
before: f028973 (same zoom at 2050%, switch off, edges soft)
unknowns: Precomp and comp sizes; whether the scale was keyframed (no stopwatch shown, values changed by scrubbing).

## Frame video in a custom shape with a track matte
id: 25-custom-media-frame
status: unproven
source: YBeMmC43Q1U 488–505 s
jobs: layout and repetition; B-roll scenes
what it does for a beat: When a photo or clip should sit in a designed window rather than a plain rectangle (for example, a cut-out that leaves room for a headline), draw any shape and use it as the clip's matte.
what it looks like: On a white slide, a dark building photo fills a wide frame whose lower middle is notched out, so a white panel with a large black headline sits inside the notch; the image reads as a custom-shaped placeholder.
ingredients:
- Shape layer drawn with the Rectangle tool (or the Pen tool) — built-in
- Track Matte column (Alpha Matte) on the media layer — built-in
steps:
1. Draw the frame shape with the Pen tool or shape tools (said); here, three rectangles inside one shape layer (shown f029645, f029765)
   - Rectangle 1: a wide bar across the top (shown f029645)
   - Rectangles 2 and 3: two blocks hanging down at the left and right, leaving a gap in the middle for the text (shown f029765, f029885)
   - Rectangle 3 Size: 595.0, 1285.0 (shown f030065)
   - Rectangle 3 Roundness: 20.0 (shown f030065)
   - Rectangle 3 Position: 1374.5, 261.5 (shown f030065)
   - Comp: 3840 x 2160 (measured: a 3840 comp at the 20% zoom readout is about 1378 px on screen and the result crop is 1376 px, f030125)
   - Fill: grey; Stroke Width 3.0 with the stroke switched off (shown f030065)
   - The clip layer's visibility (eye) is off while the shape is drawn, so the grey shape is seen over the slide (shown f029645, f029885)
2. Drag the video or image layer from below the shape (layer 3 in f029645) to directly above it (layer 1, shape on layer 2; shown f029885)
3. Turn the clip layer's eye back on; a hidden layer renders nothing even with a matte (shown f029885 cursor on the eye column, eye on in f030065; the reason is inferred)
4. Set the clip's Track Matte to the shape layer, alpha matte (said "matte your video or images to it"; shown f030065, Track Matte "2. Shape L…" with the alpha icon)
5. The shape layer's visibility turns off and the clip shows only inside the shape (shown f030065, f030125)
layout: whole frame: about 87% of the comp's width (6.3% to 93.4% across) by 59% of its height (33% to 92% down) (measured on f030125, shares of the whole comp: the viewer is at 20% zoom and the result crop takes in the whole comp; the comp is 3840 x 2160: the viewer reads 20% and the crop is 1376 px wide against about 1378 px for a 3840 comp at that zoom, measured); top bar about 29% of the comp's height deep across the full frame width; left and right blocks each about 15.4% of the comp's width wide, running the full frame height; the notch between them about 56% of the width wide and 30% of the height deep, centred at 50% across (measured, same frame, shares of the whole comp); corner rounding about 0.4% of the comp's width (measured, same frame); the headline in the notch about 52% of the width wide, capitals about 12% of the height tall, centred at 50% across (measured, same frame, shares of the whole comp)
timing and easing: none given
variations: Any shape made with the pen or shape tools works (said)
pitfalls: none given
longest on: Drawing and arranging the rectangles that make up the frame around the text.
build notes: Add a shape layer with three `ADBE Vector Shape - Rect` groups (Size, Position, Roundness) and a Fill; put the footage layer above it with `footage.enabled = true` (a hidden footage layer renders nothing), then call `footage.setTrackMatte(shapeLayer, TrackMatteType.ALPHA)` (AE 23+; older: move footage directly above and set `trackMatteType`). All scriptable.
result: start=501.1 end=502.1 still crop=938,376,1376,776 frame=f030125
before: f029885 (grey shape over the slide, clip hidden, no matte yet); f029405 at the start shows the template's finished version with large rounded corners, which the author then rebuilds
unknowns: Sizes and positions of Rectangles 1 and 2; the fill colour value. A later shot (f030245, 504 s) shows the same layout with clearly rounded corners on every edge, but the step that rounded them is not shown (Roundness reads 20 throughout).

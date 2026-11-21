# Techniques from one video (5 recipes, all unproven)

Written by the channel learner from the video's narration and screen together, then checked against the video by a second reader. Every recipe here passed that check; none is in the plugin. `status: proven` means it was built in After Effects from the recipe alone, compared with the tutorial's own result, and accepted by Joe (0 of 5); `status: unproven` means it has not been.

Each step is marked `said` (narrated), `shown` (on screen; `fNNNNNN` is a frame in the local study folder, frame number divided by the video's frame rate is seconds) or `inferred` (our reading). The `source` and frame references are for checking and stay out of the plugin. Credits: `CREDITS.md`.

| # | Technique | Jobs | Check passed in round | Status |
|---|---|---|---|---|
| 01 | Counter driven by one slider on a control null | type; workflow | 2 | unproven |
| 02 | Ring that fills to the counter's value | lines and shapes; workflow | 3 | unproven |
| 03 | Round-capped bars that grow to their own values | lines and shapes; layout and repetition | 2 | unproven |
| 04 | Icon that fills up to a value | lines and shapes; layout and repetition | 3 | unproven |
| 05 | Map regions that fade up one by one | layout and repetition; transitions | 4 | unproven |

## Counter driven by one slider on a control null
id: 01-value-driven-counter
status: unproven
source: SKU3QdqKLOs 15.2–93.4 s (the prefix and suffix tip runs to 89.6 s and belongs here)
jobs: type; workflow
what it does for a beat: A stat that counts up (or down) to a figure, so a number lands with weight. The same slider later drives a ring (02-ring-fills-to-value) and bars (03-bars-grow-to-values), so one keyframed value moves the number and its graphic together.
what it looks like: A large heavy white number on a flat near-black ground counts from 0% to 83% in whole steps, sitting left of centre beside a heading and a short paragraph.
ingredients:
- Null Object — built-in; Layer > New > Null Object (inferred: the menu is not on screen)
- Slider Control — built-in; Effect > Expression Controls > Slider Control (said "expression controls"; menu not on screen, path inferred)
- Text layer with an expression on Source Text — built-in
steps:
1. Make a text layer and type any placeholder word; it will be replaced by the number (said; shown f001761, a white placeholder word left of centre)
   - Paragraph: left-aligned (shown by the picture: the number's left edge holds at 22.4–22.6 % of the width for "2%", "14%" and "83%", cuts at 92.2, 92.6 and 92.083 s, and it grows to the right as digits are added)
   - Font: Montserrat, Black style, 111 px, white (shown f002109, Character panel; inferred to be the text layer's settings since the panel keeps the last text style; the measured digit height agrees, see layout)
2. Add a null object and apply a Slider Control to it (said; shown f002109: null layer with "Slider Control", Slider 0.00)
3. Rename the Slider Control effect to a short value name with a number; we call it `Value 1` (said; shown f002708 with the video's own name being typed)
4. On the text layer, Alt-click the Source Text stopwatch to add an expression (said "alt click"), then drag the expression pick whip onto the null's Slider (said "pick whip"; the word "parent" in the narration means this pick-whip link, not layer parenting)
   - Resulting expression: `thisComp.layer("<null name>").effect("Value 1")("Slider")` (shown f003107, with the video's own layer and effect names)
5. Keyframe the Slider from a start figure to the end figure (said)
   - Slider at 0:00: 0 (shown f003385, time 0:00:00:00, Slider 0.00, key at 0:00)
   - Slider at 3:00: 83 (shown f003107, time 0:00:03:00, Slider 83.00)
   - Interpolation: linear (shown f004027: diamond key icons; confirmed by value: 64.56 at 2:08, f004720, which is exactly 83 × 56/72)
6. Wrap the expression in `Math.round( … )` so the text shows whole numbers instead of a long decimal (said; before: f003385 shows the long decimal; after: shown f004027)
   - Expression: `Math.round(thisComp.layer("<null name>").effect("Value 1")("Slider"))` (shown f004027)
7. Optional prefix: put a quoted symbol and `+` at the start of the expression (said; shown f004720 with `"$" + Math.round(…)`)
8. Optional suffix: add `+` and a quoted symbol at the end (said; shown f005346 with `Math.round(…) + "%"`). The finished counter uses the suffix only: `Math.round(thisComp.layer("<null name>").effect("Value 1")("Slider")) + "%"` (shown f005346; the prefix is gone, result frame shows "83%" with no "$")
layout: Comp 1920×1080 (shown: in the same project's bar comp a layer at Position 499.9,671.0, f013272, sits at 26.1 % and 62.1 % of the picture; the 83.6 % viewer picture measures 2567×1444 screen px, a 1.6 display scale). Measured on the result frame (cut at 92.083 s, picture crop 531,193,2567,1444): the text is left-aligned with its left edge fixed at about 22.4 % of the picture width at every value; the finished "83%" spans 22.6–35.0 % (centre about 28.8 %), "2%" spans 22.4–31.2 % and 46.2–53.7 % of the height (digit height 7.5 % of the picture height, centred on the middle line) — measured. Digits pure white; ground flat RGB about 26,26,32 corner to corner, no vignette or grain (measured). The condensed all-caps heading (about 49.9–67.7 % of the width, 39.4–47.4 % of the height, pale blue-white) and the three-line paragraph below it are already in the example comp before the tip starts (f001761) and are not built here; in the preview they type on during the count. They are dressing from the finished example only. Motion: only the value changes; the left edge stays put and the figure extends rightward as digits are added; no move or scale.
timing and easing: Slider keys 0 at 0:00 and 83 at 3:00, linear (shown f004027, f004720). Comp time base 23.976 fps (shown, timecode sub-label in f002109). Do not time the count against the recording: the preview plays near real time but not exactly.
variations: Count down instead of up by keying a high start and a low end (said). Prefix or suffix symbol of choice (said; "$" and "%" shown).
pitfalls: Without rounding the source text shows the slider's full decimal, e.g. 49.5694444… (said; shown f003385).
longest on: Fixing the decimal with Math.round, about 19 s (52.1–71.4 s), slightly longer than the prefix/suffix tip (about 18 s, 71.4–89.6 s) and the null/slider/pick-whip set-up (about 17 s, 29.7–46.5 s).
build notes: Null: `comp.layers.addNull()`. Effect: match name `ADBE Slider Control`, its value property `ADBE Slider Control-0001` (displayed "Slider"); set the effect's `name` to `Value 1`. Text: `layer.property("ADBE Text Properties").property("ADBE Text Document").expression = 'Math.round(thisComp.layer("Controls").effect("Value 1")("Slider")) + "%"'` (use the null's actual name). Keys with `setValueAtTime(0,0)` and `setValueAtTime(3.003,83)` (3:00 at 23.976 fps), linear interpolation. Nothing here needs the interface.
result: start=91.6 end=92.08 animated crop=531,193,2567,895 frame=f005525 (cut from source.mp4 at 92.083 s; saved as scratch/writer-a/01/result_f005525.png). The crop is the top 62 % of the picture: the mouse arrow sits lower in the picture throughout this window and is outside the crop; earlier in the same pass (89.5–91.5 s) it wanders near the number. The window shows the count's tail, 73 % to 83 %; 83 % is on screen only at 92.07–92.10 s before the preview loops to 0. The full picture is 531,193,2567,1444.
before: f001761 (placeholder word and the example's heading, no number yet)
unknowns: The text layer's anchor and position in pixels (left edge at about 431 px of 1920 from the measured share); comp duration; colour of the ground as typed (only rendered colour measured); whether the heading's type-on is keyframes or a preset.

## Ring that fills to the counter's value
id: 02-ring-fills-to-value
status: unproven
source: SKU3QdqKLOs 93.4–153.0 s (the wiggle trick at 142.9–153 s belongs here; the template advert from 153 s is left out)
jobs: lines and shapes; workflow
what it does for a beat: A percentage stat shown as a donut that draws on to the same figure the number counts to, so the graphic and the number can never disagree. Builds on 01-value-driven-counter: it reuses that recipe's null and slider.
what it looks like: A thick yellow arc grows clockwise from twelve o'clock over a dim full ring until it covers 83 % of the circle, with the white counter centred in the ring's hole; with the optional wiggle the arc and the number keep drifting a few percent after they land.
ingredients:
- Everything from 01-value-driven-counter (null with a Slider Control renamed `Value 1`, keyed 0 → 83, and the counter text) — built-in
- Shape layer drawn with the Ellipse tool — built-in
- Trim Paths — built-in; shape layer Contents > Add > Trim Paths (said "add trim paths"; the Add menu is not seen landing, path inferred)
- wiggle() expression on the slider (optional) — built-in
steps:
1. Start from the 01 set-up: null with the value slider and the rounded counter text with a "%" suffix (said "the slider control that we created in our first technique"; shown f008014: the null's slider and the text's `Math.round(…) + "%"` expression)
2. Draw a circle with the Ellipse tool on a new shape layer (said "any shape"; shown f006647, Ellipse tool active, layer contents "Ellipse 1")
3. Turn the fill off, turn the stroke on, and make the stroke thick (said)
   - Fill: none (shown f007038, toolbar Fill swatch struck through)
   - Stroke width: 100 px (shown f007038, toolbar "100 px"; the narrator passes through other numbers while dragging, 100 is where it lands)
   - Line cap: left at the default Butt Cap (inferred: at 0 % the arc shows as a thin straight sliver, f008498, not a round dot)
4. Colour this ring a little lighter than the ground; it is the dim track (said "brighter or darker color than our background")
   - Stroke colour: #2A2733 (R42 G39 B51) (shown f007303, Stroke Color dialog with Preview on; the ring in the viewer already shows the dim colour)
5. Nudge the counter about 19 px left so the landed "83%" centres in the ring, at the same height (not said; the move is not shown being made; measured: its left edge sits at 21.6 % of the width in f008304 against 22.6 % in 01 at 92.083 s, and the landed "83%" centre is 27.8 % against the ring centre 28.0 %, where in 01 it was 28.8 %; f007038 shows the number in the ring's hole)
6. Duplicate the ring layer and give the copy the main colour (said)
   - Stroke colour of the copy: #FFC200 (R255 G194 B0) (shown f007651, Stroke Color dialog; the copy is the upper layer)
   - Stacking: yellow copy on top, dim track under it, then the null and the counter text (shown f008014)
7. Open the yellow copy's contents and add Trim Paths (said; shown f008014, "Trim Paths 1" inside "Ellipse 1" with Start 0.0 %, End 100.0 %, Offset 0x+0.0°)
8. Alt-click the Trim Paths End stopwatch and pick-whip it to the 01 slider (said "parent it to the slider control"; the screen shows an expression link, not parenting)
   - End expression: `thisComp.layer("<null name>").effect("Value 1")("Slider")` (shown f008304, with the video's own names; End reads 69.2 % while the slider reads 69.17)
   - Start 0 %, Offset 0° left as they are (shown f008304); the arc grows clockwise from twelve o'clock (shown f008277, result frame)
9. Optional: Alt-click the slider's own stopwatch and add a wiggle so the value keeps drifting after it lands (said; the narration's "all good stopwatch" is Alt-click)
   - Slider expression: `wiggle(2,5)` (shown f008923; two wiggles a second, up to 5 units either way); the keyframes stay under it (shown f009121, key icons at 0:00 and 3:00 with the expression)
layout: Measured on the result frame (cut at 141.1 s, picture crop 681,170,2240,1260): ring centre 28.0 % across, 49.9 % down; outer diameter 57.0 % of the picture height; band thickness 9.1 % of the picture height (= 100 px in a 1080-high comp, matching the stroke) — measured. So the ellipse path's own diameter is about 47.9 % of the height (about 515 px in the 1920×1080 comp). Counter digits 7.5 % of the picture height, same size and height as in 01, about 19 px further left (see step 5) — measured. The counter is left-aligned (see 01): only the landed "83%" looks centred in the ring (27.8 % across); every value starts at the same left edge, 21.6 % of the width (f008304, "69%" spans 21.6–34.2 %), so small values such as "1%" and "2%" sit left of the ring's centre during the count. Rendered colours: ground RGB 26,26,32; track 39,38,49 (agrees with typed #2A2733); arc 255,186,0 against the typed #FFC200 (a saturated colour from a screen recording; use the typed value). Both rings are the same size and position; the arc covers the track exactly where drawn. No shadows, glows, gradients or grain. The arc's tail stays at twelve o'clock; its head travels clockwise and stops at 83 % (about ten o'clock). The heading and paragraph to the right are the example comp's pre-existing dressing (see 01). With the wiggle on (150.3–152.8 s) the landed value reads 80–86 % and the arc's head moves with it.
timing and easing: Slider keys at 0:00 and 3:00, end value 83 (shown landed as "83%" at 140.93–141.27 s). By this point both keys are Easy Ease (hourglass icons, shown f008014 crop), not the linear keys of 01; the change is not shown being made. Influence 100 % in and out, speed 0, on both keys (inferred from values: that curve gives 69.12 at 1:16 and 70.86 at 1:17, the panels read 69.17, f008014, and 70.89, f008887; it gives 6.7 at 1:02 and 13.9 at 1:08, which fits the preview; default 33 % Easy Ease would give 48 at 1:16). Look: the count creeps for about a second, jumps from about 14 to 64 within about 6 comp frames mid-way, then settles slowly into 83. Wiggle: frequency 2 per second, amplitude 5 (shown f008923).
variations: Any shape drawn with the shape tools can be used, not only a circle (said). Track colour can be lighter or darker than the ground (said). The wiggle is optional (said).
pitfalls: none given. (Inferred: the wiggle acts from frame 0, not only after the count lands, so near 0 % the number can briefly read negative and the arc's End clamps at 0.)
longest on: Building the two rings — circle, fill off, thick stroke, dim colour, duplicate, yellow — about 20 s (107.3–127.8 s), longer than the trim-paths link (about 11 s) and the wiggle tip (about 10 s). The opening look at a finished ring takes about 14 s.
build notes: Shape layer: `comp.layers.addShape()`; Contents > `ADBE Vector Group` > `ADBE Vectors Group` > `ADBE Vector Shape - Ellipse` (Size [515,515], inferred), `ADBE Vector Graphic - Stroke` (Color, Stroke Width 100, Line Cap 1 = Butt), no fill. Duplicate the layer, set the copy's stroke to [1,0.761,0]; add `ADBE Vector Filter - Trim` to the copy's group and set `ADBE Vector Trim End` expression to the slider reference. AE's ellipse path starts at the top and runs clockwise, which gives the twelve-o'clock start with Offset 0. Ease both slider keys with `setTemporalEaseAtKey(k,[new KeyframeEase(0,100)],[new KeyframeEase(0,100)])` (100 % influence; a default Easy Ease is visibly softer). Wiggle: set the slider property's `expression = "wiggle(2,5)"`. Nothing needs the interface.
result: start=140.93 end=141.27 still crop=681,170,2240,1260 frame=f008466 (cut from source.mp4 at 141.1 s; saved as scratch/writer-a/02/result_141.1.png). This is the landed hold at the end of the preview before it loops, without the wiggle. No clean frame exists: the mouse arrow sits inside the ring's hole at about ten to eleven o'clock, just inside the yellow edge (picture x about 20–22 %, y 41–44 %); mask it when comparing. The finished example shown at 97.9–104 s is a different, pre-made comp (counter inside the ring, outline bubbles, grain) and is not what was built.
before: f006647 (a plain white filled circle beside the heading)
unknowns: Ellipse size as typed (only measured share); whether the 100 % influence was typed or came from a preset (only the curve is settled).

## Round-capped bars that grow to their own values
id: 03-bars-grow-to-values
status: unproven
source: SKU3QdqKLOs 180.8–230.5 s
jobs: lines and shapes; layout and repetition
what it does for a beat: A comparison beat: several figures rise side by side, each to its own value, so the viewer reads which is biggest. Builds on 01-value-driven-counter (a null whose sliders hold the values) and 02-ring-fills-to-value (dim track under a coloured copy, Trim Paths End linked to a slider).
what it looks like: Thick yellow pill-ended bars rise from a common baseline inside dim full-height tracks of the same width, on a near-black ground with a percent scale at left, month labels below and a value above each bar. The build makes two bars (54 % and 64 %); the finished example plays twelve.
ingredients:
- Null with Slider Controls, one per bar, set up as in 01-value-driven-counter — built-in
- Shape layers drawn with the Pen tool — built-in
- Stroke Line Cap: Round Cap — built-in
- Trim Paths — built-in
steps:
1. In the chart comp, have a null with a Slider Control renamed `Value 1`, keyed from 0 to the first bar's figure, as in 01 (said "the value you've created"; shown f012955: a null in this comp with "Value1", Slider 54.00 at 3:00, key at 0:00; the bar starts as a dot at 0, build preview about 209 s)
   - Value 1: 0 at 0:00 → 54 at 3:00 (end value shown f012955; start value inferred from the bar starting at 0 in the preview)
2. With the Pen tool, draw one straight vertical line from the baseline up to the top of the scale (said "a long, straight line"; shown f012418, the line spans the 0 % row to the 100 % row, here already yellow). Draw it bottom first: Trim Paths End grows from the path's first point, and the bar grows upward (shown f012955; the click order itself is inferred)
3. Set the stroke (said "round cap"; values shown)
   - Stroke Width: 35 (shown f011872, landed; toolbar "35 px" also in f012085)
   - Line Cap: Round Cap (shown f011872 with the menu open on Round Cap; landed result shown as rounded ends in f012955)
   - Fill: none (shown f012085, toolbar Fill struck through)
   - This first line is the dim track; colour about RGB 44,40,55 (#2C2837) (read from the Color swatch in f011872; near-grey, so little gamut error; agrees with the rendered 44,42,54)
4. Duplicate the line and give the copy the bar colour (said)
   - Stroke colour of the copy: #FFC600 (R255 G198 B0) (shown f012116, Stroke Color dialog)
   - The copy sits above the track (inferred: Duplicate places it above, and the yellow covers the track in f012955)
5. Add Trim Paths to the yellow copy and link its End to the slider by Alt-clicking End's stopwatch and pick-whipping to `Value 1` (said "like before"; shown f012418, pick whip dragged onto the null's Slider) — the same link as 02
   - End expression: `thisComp.layer("<null name>").effect("Value 1")("Slider")` (shown f013272, with the video's own names, on the duplicated bar before it is re-pointed)
6. Duplicate the slider effect on the null (it keeps its keys) and change the copy's end key to the second figure (said)
   - Value 2: 64 at 3:00 (shown f012955, Effect Controls "Value2" Slider 64.00 at 0:00:03:00; Value 1 read 54.19 earlier, f012418, and 54.00 here, so 54 is the end value)
7. Duplicate both lines (track and yellow), move the pair right to the next column, and re-point the copy's End expression at `Value 2` (said; shown f013272: moved pair at Position 499.9,671.0, Anchor Point -573.7,131.0, i.e. about 112 px right of the first pair at about 388 px; f013392 shows the pick whip being dragged to Value2's Slider, both bars still at 54 % there)
8. Repeat for more bars, one slider per bar (said "continue to create more bar lines")
layout: Comp 1920×1080 (shown: Position 499.9,671.0 in f013272 sits at 26.1 % and 62.1 % of the picture). Build (measured on f013392, picture crop 788,247,2567,1444, where both bars still read 54 % because the second link is mid-drag): bar centres at 20.2 % and 26.1 % of the picture width (spacing 5.9 % of the width); bar thickness 3.1–3.2 % of the picture height (= 35 px in a 1080-high comp); each track runs from 37.5 % to 86.7 % of the height including its round caps, so the path is about 46 % of the height long (about 497 px of 1080); yellow from 58.7 % to 86.7 % for 54 % — measured. Rendered colours: ground RGB 17,17,20 (flat); track 44,42,54; bar 255,190,0 against the typed #FFC600 (saturated colour from a screen recording; use the typed value). The scale labels (0–100 % at left), month labels under each column, the value labels above each column and the condensed heading with a two-line subtitle are already in the comp (shown f012085) and are not built in this tip. Finished example (a different, pre-made comp, measured on the 226.0 s cut, viewer at 100 % showing the middle of the comp): twelve bars, first centre about 20 % and last about 82 % across, spacing about 5.6 % of the width; bars thinner, about 2.7 % of the picture height; tracks about 37 % to 85.5 % of the height; bar colour renders RGB 255,171,0, deeper than the build's; a fine animated grain over everything; values 54, 64, 47, 81, 73, 67, 59, 55, 74, 93, 82, 72 %. In the finished example the tracks also draw on from the bottom, the bars rise with a left-to-right stagger and the value labels count up with them; none of that is built in this tip. No shadows or glows in either.
timing and easing: Keys at 0:00 and 3:00 on each slider (shown f012955); the key at 0:00 is Easy Ease (hourglass icon, f012955); the 3:00 key is hidden under the playhead. Bars in the build share one key timing because the second slider is a duplicate of the first. Finished example (read from the viewer's time display, which redraws only every few frames, so approximate): the first bar appears at about 0:00:00:23 and the last at about 0:00:01:05, so all twelve start within about 6 comp frames, left to right (roughly half a frame apart); each settles about 18–24 frames after it starts; all hold from about 0:00:02:10.
variations: Any number of bars, each with its own slider value (said).
pitfalls: none given.
longest on: The trim-paths link and watching one bar animate to its value, about 10.5 s (201.9–212.4 s); the opening look at the finished chart takes about as long (180.8–191.3 s). The second bar (value copy plus duplicated lines) takes about 11.5 s over two steps.
build notes: Per bar, two shape layers (or two groups) each with `ADBE Vector Shape - Group` holding a two-point vertical path, bottom vertex first; `ADBE Vector Graphic - Stroke` with Stroke Width 35 and Line Cap 2 (Round). Top copy colour [1,0.776,0]; add `ADBE Vector Filter - Trim` and set `ADBE Vector Trim End` expression to `thisComp.layer("Controls").effect("Value N")("Slider")`. On the null, one `ADBE Slider Control` per bar named `Value N`, keys 0 → figure, eased. Space columns 5.6–5.9 % of the comp width apart. All of it can be scripted.
result: start=225.9 end=227.4 still crop=776,244,2596,1452 frame=f013560 (cut from source.mp4 at 226.0 s; saved as scratch/writer-a/03/result_226.0.png). This is the finished twelve-bar example, not the two-bar build; the viewer is at 100 % so the crop holds only the middle of the comp (comp edges lie outside the viewer). Bars and labels hold through the window; only the grain flickers. No clean frame: the mouse arrow sits on the lower part of the third bar (about 26 % across, 81 % down the crop); mask it when comparing. No frame in the video shows the two-bar build landed at 54 % and 64 %; f013392 (crop 788,247,2567,1444) shows both bars at 54 % with the second link mid-drag, usable for geometry only.
before: f011944 (the chart comp's labels with only the first line drawn)
unknowns: The Easy Ease influence in this comp; the start value of the sliders (0 inferred); how the finished example's stagger, track draw-on and counting labels are made (only their timing is read).

## Icon that fills up to a value
id: 04-icon-fills-to-value
status: unproven
source: SKU3QdqKLOs 230.5–269.5 s
jobs: lines and shapes; layout and repetition
what it does for a beat: Turns a flat icon into a gauge: a bright copy of the icon rises from the bottom over a dim copy and stops at a figure, so a stat reads as "how full". Reach for it beside a counter when a percentage needs a picture.
what it looks like: A dim slate-blue rocket icon on a near-black ground; a golden-yellow copy of the same icon fills it from the bottom edge upward with a hard horizontal edge, stopping at about 86 % of the icon's height, next to a large white figure with a small caption (the figure finishes counting before the fill starts to rise).
ingredients:
- Fill — built-in; Effect > Generate > Fill (the Effect menu with Generate highlighted is shown f014501; the submenu item itself is inferred)
- Shape layer drawn with the Pen tool, Stroke only — built-in
- Trim Paths — built-in; shape layer Contents > Add > Trim Paths (shown f015459)
- Slider Control on a Null Object (effect renamed "Value1") — built-in; Effect > Expression Controls > Slider Control (inferred; the menu item is visible in the Effect menu f014501)
- Track Matte column (layer-picker style, AE 2023+) — built-in (shown f015846)
steps:
1. Start from the value rig of 01-value-driven-counter: a Null Object carrying a Slider Control whose effect is named "Value1". In this comp a fresh Null Object with that slider sits at the top of the stack (shown f015600; the narrator only says to link "like we've been doing"). (shown f015600)
   - Slider keyframes: 0.00 at 0:00, a second key at 3:00 (positions measured on the timeline ruler) (shown f015977, f015825)
   - Both keys Easy Ease (hourglass key icons) (shown f015825)
   - Slider mid-move at 0:00:01:18: 72.33 (shown f015825)
   - Second key's value: not readable; see unknowns
2. Bring in the icon as a flat single-colour graphic (here a vector shape layer; the narrator says a PNG or illustration works too). (said; shape layer shown f014501)
3. Apply Fill to the icon and set a dim, desaturated colour — the bottom copy that stays visible as the "empty" part. (said; shown f014694)
   - Color: a dark slate blue, swatch reads about RGB 39 54 65 (#273641) (shown f014694, sampled from the swatch)
   - Opacity: 100 % (shown f014694)
4. Duplicate the icon (Edit > Duplicate, Ctrl+D inferred) and on the copy, which sits above, set the Fill colour to the bright accent colour. (said; shown f014883)
   - Color: #FFCD10 (H 48°, S 94 %, B 100 %; R 255 G 205 B 16) (shown f014883)
5. Use the Pen tool (with no layer selected, inferred) to draw a straight two-point vertical path through the middle of the icon, a little longer than the icon is tall, then set a very thick stroke so the square of stroke covers the whole icon. (said; shown f015281)
   - Stroke Width: 464 px (shown f015281)
   - Fill: none (Fill swatch shows the red slash) (shown f015281)
   - Stroke colour: yellow (it is only a matte, so the colour does not matter) (shown f015281)
   - Path length about 375 comp px, from about 16 px above the icon's top to about 14 px below its bottom; stroke square about 464 x 375 px (measured: the 464 px stroke gives the scale in f015281, a punched-in shot about 1.245x larger than f015825/f016163, mapped into the result frame through the figure's size and position; check: End 72.33 then predicts 74.8 % fill, and f015825 measures 74.5 %)
   - Path direction: the reveal grows from the bottom, so the path's first point must be the bottom one; if it grows from the top, reverse the path direction (inferred from the result)
6. Add Trim Paths to the shape layer. (said; shown f015459)
   - Start: 0.0 %, End: 100.0 %, Offset: 0x+0.0°, Trim Multiple Shapes: Simultaneously (shown f015600)
7. Add an expression to End (Alt-click its stopwatch, inferred) and pick-whip it to the null's Value1 Slider so End equals the slider value. (said; pick-whip being dragged shown f015600 — the finished expression is not shown)
   - Expression: thisComp.layer("Null Object").effect("Value1")("Slider") (inferred)
8. On the bright copy, set Track Matte to the stroke shape layer (alpha matte). The matte layer's eye switches off on its own. (said; shown f015846)
   - Layer order top to bottom: Null Object, stroke shape layer (matte, hidden), bright icon copy, dim icon, counter rig layers from 01, background (shown f015846)
   - Matte type alpha (filled-circle mode icon), invert off (empty invert box) (shown f015846, full-size crop)
9. Play: the bright copy climbs from the bottom as the slider rises, and stops at the slider's final value. (said; shown in source 265.5–267.2 s and again 267.3–269.1 s as the preview loops)
layout: Measured on the result frame at the viewer's 100 % zoom (the comp is larger than the viewer, so its edges are not in the picture; sizes are given in comp pixels with the 464 px stroke as the scale). Icon (a rocket pointing up-right) about 344 x 344 comp px (measured: 552 x 550 rec px at about 1.60 rec px per comp px), centred vertically on the figure-and-caption block to its right (inferred from the frame). Bright fill's top edge sits at 86 % of the icon's height from its bottom (measured on f016163; holds from source 269.1 s), a perfectly horizontal hard edge, no feather. The dim part above reads RGB 39 54 66 and the bright part RGB 255 197 5 in the recording (measured; the typed bright value is #FFCD10 and the dim swatch reads #273641 — recording on a wide-gamut screen can shift the yellow). Ground RGB 20 18 25 (measured), a flat solid with no shading or grain. The icon's porthole is a hole showing the ground. Next to the icon: a large heavy white figure over a lighter caption, both from 01-value-driven-counter; in the result playback the figure counts up first and finishes (source 265.0 s 126k; then 650k, 704k, 752k, 793k, 825k, 861k between 265.45 and 265.70 s; 863k from about 265.7 s) while the fill has only just started (about 2 % at 265.5 s); they do not run together, and whether the same slider drives both is not shown. No shadows, glows or overlaps besides the bright copy over the dim one.
timing and easing: Slider keyed 0 at 0:00 to its final value at 3:00, both keys Easy Ease (shown f015825, f015977). Comp frame rate 23.976 fps (shown f014501). In playback the fill rises from near empty to its final level and holds; the preview readouts lag and cannot give a reliable curve.
variations: Works with any flat graphic — PNG, illustration, or a photo (said). The fill colour of either copy can be anything (shown: red tried first f014623, then slate blue).
pitfalls: none given
longest on: Colouring the two copies with Fill and duplicating (about 9 s, 240.4–249.6 s), ahead of drawing the thick stroke (about 5 s), the trim-paths link (about 6 s) and the track matte (about 5 s).
build notes: All scriptable. Fill match name ADBE Fill (property "Color"); Slider Control ADBE Slider Control renamed "Value1"; on the matte shape layer: ADBE Root Vectors Group > ADBE Vector Group > ADBE Vectors Group with an ADBE Vector Shape - Group (two vertices, bottom first), ADBE Vector Graphic - Stroke (Stroke Width 464) and ADBE Vector Filter - Trim with End's expression set to the slider. Duplicate with layer.duplicate(); set the matte with brightCopy.setTrackMatte(strokeLayer, TrackMatteType.ALPHA) (AE 2023+) or by placing the stroke layer directly above and setting trackMatteType. Size the path to the icon's height plus about 4 % margin at each end (16 px over a 344 px icon); fill share of the icon = (End x 375 - 14) / 344. To match the result, aim the final slider key at End about 83 (gives 86 %); the typed value in the video is unknown.
result: start=269.1 end=269.5 still crop=260,200,2560,1400 frame=f016163
before: f014694 (single dim icon beside the figure, before duplicating)
unknowns: The second slider key's typed value: not readable on any frame; build to the measured 86 % fill (End about 83). The 72.33 readout at 1:18 does not fit a default Easy Ease from 0 to about 83 at 3:00 (that would read about 52), so the readout or the key times may differ from what the ruler suggests; do not derive the final value from it. The exact expression text; the comp's size; whether the counter figure is driven by the same slider; the dim Fill colour's typed value (only its swatch is visible). The rise plays at source 265.5–267.2 s and again 267.3–269.1 s (preview loop); the result window above is the held end state (fill 86 % from 269.1 s, checked at 269.1, 269.2, 269.4 and 269.5 s).

## Map regions that fade up one by one
id: 05-map-regions-fade-up
status: unproven
source: SKU3QdqKLOs 269.5–324.6 s
jobs: layout and repetition; transitions
what it does for a beat: Marks places on a map: chosen regions light up in colour over a grey base map, each with a numbered list entry, so a viewer reads "these places" in order. Use it for coverage, rankings or "where" beats.
what it looks like: A pale grey map of a continent on an off-white ground, with a numbered list down the left third. Six regions, each a different saturated colour (amber, orange, coral red, navy, sky blue, light cyan) with its name in white, fade up one after another over the grey map, each together with its matching numbered entry.
ingredients:
- A vector map with each region as its own shape — outside After Effects (stock vector art in the tutorial)
- Adobe Illustrator, Layers panel — outside After Effects; used to split regions into their own top-level layers (shown f017680)
- Opacity keyframes — built-in
steps:
1. Get a vector map of the area. (said)
2. In Illustrator, move each region you want to animate out of the map's group into its own top-level layer; the rest of the map stays together on one base layer. (said; shown f017680 — new top-level layers above the base map layer, whose sublayers are the individual countries)
3. Save as an Illustrator file. (said; the File menu's Save is named on screen near f018419, not checked)
4. Import into After Effects as a composition so each Illustrator layer becomes its own layer. (said; the import dialog is not shown, so the exact import type is inferred: "Composition – Retain Layer Sizes" or "Composition")
   - Resulting comp: 1920 x 1080, 23.976 fps, 0:00:10:00 (shown f018944)
   - Layers top to bottom, all imported Illustrator layers: Layer 8 (the numbered list art, inferred from the picture), Ukraine, Finland, Spain, Italy, Germany, United Kingdom, Europe map (shown f018944)
   - Region layers carry region names (renaming is not shown or said; inferred)
5. Select the region layers, open Opacity (T, inferred) and key a fade from 0 % to full. All selected layers get the same keys at the same times. (said; shown f019253)
   - Opacity: 0 % at 0:00 (shown f019253)
   - Second key at about 0:00:01:01 (measured from key position on the ruler) (shown f019253)
   - Second key value: 100 % (inferred; Opacity read 100 % before keying, f019160)
   - The base map and the list layer are not faded (shown f019253: list and grey map stay visible at 0 %)
6. The finished example (a separate, pre-made comp, not the build) staggers the regions: each region and its numbered entry appear in turn, by staggered layer in-points with a short fade. (shown f019393, source 321.4–324.0 s)
   - In-points of five layers in the finished example: about 0.50, 1.05, 1.50, 2.00 and 2.69 s; one more is present from 0:00 (measured from the layer bars f019393)
   - Order of appearance: amber region and 01 first, then orange (02), coral (03), navy (04), sky blue (05), light cyan (06) (shown source 321.4–324.0 s)
   - The last region is half faded at 0:00:03:01 and full at 0:00:03:07, so each fade lasts roughly 0.3–0.6 s (measured from readouts; inferred)
layout: Measured on the result frame, comp 1920 x 1080 (picture edges found at the viewer's comp border). Ground off-white RGB 251 251 251, flat (measured). Base map light grey RGB 210–221 (regions differ slightly), with small dark grey country labels; it spans about 35–98 % of the width and 2–97 % of the height (measured). Numbered list in the left third: six rows, circles about 4.5 % of the width (8 % of the height) across, centred about 10 % from the left, rows about 15.7 % of the height apart starting at about 11 % from the top (measured); each row a coloured title and two grey lines of placeholder text, circle and title in the region's colour. Region colours in the recording: amber RGB 255 175 7, orange 255 125 0, coral 236 88 83, navy 0 75 127, sky blue 42 166 228, light cyan 90 197 218 (measured; saturated colours may read stronger than the render on a wide-gamut recording). Each coloured region carries its name in white caps; the grey regions' names are dark. Example sizes: the amber region spans roughly 71–87 % of the width and 48–66 % of the height; the orange one 38–52 % and 70–90 % (inferred from the frame). No shadows, strokes or depth; the coloured regions simply cover their grey counterparts. The finished example's stack is a Noise adjustment layer with effects on top, a separate Names layer, six region layers (Layer 2–7), a graphics precomp and the map art (shown f016532, f019393); the ground in the result crop is flat 251 (no visible grain), so the noise adds nothing a builder needs. In the build the list (top Illustrator layer) does not fade; in the finished example each list row fades with its region, which means the list is split per row there.
timing and easing: Build: all regions fade 0 → 100 % over about 1 s from 0:00, linear keys (shown f019253; ease not shown). Finished example: staggered in-points about 0.5 s apart, short fades (see step 6).
variations: Each region's layer can be animated "any way" — the opacity fade is the simplest (said).
pitfalls: none given
longest on: Splitting the map into layers in Illustrator (about 14 s, 290.5–304.6 s), against about 9 s for saving and importing and under 3 s for the opacity keys.
build notes: The After Effects part is only an opacity fade per layer and fully scriptable: layer.opacity.setValueAtTime(t, 0) / setValueAtTime(t + 0.5, 100), offset per region (or set layer.inPoint). The region separation is an Illustrator step a script cannot follow, and we do not need it: our route is generated map art delivered as separate, pre-aligned region layers — one full-frame PNG with alpha per highlighted region (the region in its colour, no label), with all region names on their own always-visible labels layer above the regions — in the finished example the white names sit on a separate Names layer and show before their regions fade in (f016532: GERMANY and ITALY white over grey). Below the regions goes one base map with every region grey, and the numbered list comes as one layer per row so each row can fade with its region. Import each as footage, stack at the comp centre, and key the fades. If shape layers are wanted instead, an SVG/AI per region can be imported and converted with Layer > Create > Create Shapes from Vector Layer (a menu command; check how it can be called by script before relying on it).
result: start=324.0 end=324.5 still crop=474,176,2406,1354 frame=f019463
before: f019253 (grey map with list, all regions at 0 %)
unknowns: The exact import type; the second opacity key's value and easing in the build; how the finished example fades each region (in-point plus opacity, or keys only) and the per-region times beyond the five measured in-points; which layer holds which region in the finished example; how the list is split there. The build's own fade is never played on screen; the result shows the finished example.

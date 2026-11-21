# Arsenal recipes: Line jobs: what the viewer must get from this line (part 2)

Generated from the recipe drafts; do not edit by hand. Recipes whose primary job is in this group. Find candidates for a beat with ae_arsenal find; read one with ae_arsenal get, or a section here by its heading.

## Bar chart of thick strokes that grow up in a ladder, with value labels sliding in beside them
id: 07-stroked-bars-grow-in-stagger-with-value-labels
revision: 4731c114
job: compare; support: show-proof, list-items
status: proven (accepted 2026-11-21)
what it does for a beat: A quick "how big is each one" moment: four bars rise one after another from a shared baseline, left to right, tallest first, while each value label slides in from the left. Use it when a narrated figure needs a chart that builds as the voice lists the numbers.
what it looks like: On a black frame, four warm-yellow vertical bars of equal width stand on a thin yellow baseline in the middle of the picture, falling in height from left to right. Right-aligned white labels in a bold geometric sans ("$500 M"-style figures) sit in a column to the left of the bars, each label's baseline level with the top of its own bar.
ingredients:
- Shape layers with a single open path, Stroke and Trim Paths — built-in; Add > Trim Paths in the shape layer's contents (shown, Trim Paths 1 under the layer's Contents)
- Text layers (point text, right-aligned) — built-in
- An easing extension that applies cubic curves to selected keys (the panel shows preset curves and an APPLY button) — paid; only a convenience, the curves are given below as numbers (shown)
- A free layer-sequencing extension (offsets selected layers by N frames) — free; only a convenience, the resulting offsets are given below (shown, SEQUENCE with offset 10)
- Build aid only: the layout was drawn in a vector illustration program and sent to After Effects with a paid transfer plugin, then split into one shape layer per path with the free sequencing extension (said; illustration shown, the extension panel with EXTRACT and SEQUENCE shown). A script can draw the layout directly from the figures below.
steps:
1. Make a 1920 x 1080 comp, black background, 23.976 fps. (size said at 11.5 s, in the intro, for all the video's comps; frame rate shown time display "(23.976 fps)", though the narrator says 24; background shown : no background layer in the stack, picture black)
2. Draw the baseline: one horizontal open path, its own shape layer, centred horizontally. (said "straight line", shown)
   - Length: 607 px, from x 657 to x 1264, at y 735 (measured; see layout)
   - Stroke width: about 3 px (measured, Full-resolution viewer; the width was never shown, the narrator only says it was thickened a little)
   - Stroke colour: the same yellow as the bars (shown; inferred that all shapes were recoloured together, said "change the stroke")
3. Draw four bars, each as its own shape layer holding one vertical open path drawn from the bottom up (start point on the baseline, end point at the bar's top), so that Trim Paths End grows the bar upwards. (said: click, hold shift and go up; growth direction shown in the result)
   - Stroke Width: 60 (shown, Properties panel "Stroke Width 60" and toolbar "Stroke 60 px"; measured 58.6 px wide, which agrees within the viewer's blur)
   - Line Cap: Butt Cap; Line Join: Miter Join (shown, first icon of each row highlighted)
   - Fill: None (said "remove the fill"; shown Fill Color "None")
   - Stroke Color: a warm yellow; swatch reads about RGB 243,190,6 (shown, swatch sampled), renders about RGB 247,187,3 (measured). This is a saturated colour read off a screen recording and may be inflated (see build notes).
   - Bar centres x 724, 881, 1039, 1196.5 (pitch 157.5 px); tops y 319.5, 462, 560, 708; bottoms on the baseline at y 735 (measured; the fourth bar's layer Position reads 1195.5,721, shown, which agrees with the measured centre)
   - Stack order: baseline at the bottom of the stack, then the tallest (leftmost) bar, up to the shortest (rightmost) bar at the top of the shape layers (shown : Group 1 to Group 5 from top to bottom; inferred, where Group 1 is the selected shortest bar, and from the order of growth in the result)
4. Add four point-text layers, right-aligned, white-ish, a bold geometric sans, reading the four values from largest to smallest. (text and font said: "500 million", "350", "100", "5M" and the Satoshi typeface; right alignment said and shown; colour said "whitish")
   - Final Position (anchor at the right end of the text baseline): (628.1, 329.3), (628.1, 462.0), (629.0, 558.0), (628.1, 707.0) for the largest to the smallest (shown for the first three at 0:00:03:00; the fourth's y 707.0 shown, its final x inferred to be 628.1 like the others, since its first-key x is 515.1 like theirs)
   - Size: capital height (the "M") about 19 px, measured 18–19.6 px; the "$" is taller, about 23 px, because it reaches above the capitals and below the baseline (measured). Font size not shown; about 27 px inferred from the M
   - Fill colour: renders about RGB 247,247,247 at its brightest (measured); the value typed is not shown
   - Text layers sit above all shape layers (shown)
5. Animate each bar: add Trim Paths to the bar's contents and key End from 0 % to 100 % over 18 frames. (End keyed and moved forward a little, then set to 0 at the start: said; keys shown; 18 frames measured from the key spacing, 161 px at 8.92 px a frame; an earlier reading gave 17.5, so 18 is the nearest whole frame)
   - Start: 0 %, Offset: 0 (shown)
   - Ease on both End keys: cubic-bezier (0.88, 0.14, 0.12, 0.86), a strong symmetric ease in and out (curve and numbers shown with APPLY pressed, preset selected; keys shown as eased)
6. Stagger the bars 10 frames apart, tallest (leftmost) first: each bar layer starts at its first key. (said "sequence them, 10 frames", in the reverse of the stack order because the first bar is lowest in the stack; result shown)
   - Tallest bar: layer in and End keys at frames 7 → 25 (shown)
   - Second: 17 → 35; third: 27 → 45; shortest: 37 → 55 (shown)
7. Animate each label: Position keyed so it enters 113 px left of its final place and slides right into place over 12 frames; the layer starts at its first key, so the label appears on that frame already moving. (slide in from the side, 12 frames back, move it left, trim the layers at the start: said; positions shown (628.1) and (515.1 at the first key); in-points shown)
   - Ease on both Position keys: cubic-bezier (0.04, 0.47, 0.53, 0.93), fast start that settles slowly (said "fast in"; preset name and numbers shown)
   - Only x changes; y stays at the values above (shown against)
   - No track matte on the labels (shown, "No Matte"): each label simply pops on at the left and slides
8. Stagger the labels 10 frames apart, largest value first, so each starts on the same frame as its bar. (said "sequence them by 10", reverse order because the largest is at the top of the stack, "move it to the very beginning"; result shown)
   - "$500"-style label: in and keys 7 → 19; second 17 → 29; third 27 → 39; smallest 37 → 49 (shown)
9. The baseline's own draw-on from the centre is recipe 08 (keys 0 → 12 frames; the line is fully drawn by frame 12 and stays). Its figures are in layout so this recipe stands alone. (shown)
layout: Measured (comp at 0:00:02:12, viewer redrawn, comp edges at x 1189–2991, y 194–1207 of the full-size frame, 0.939 screen px per comp px) and checked. All figures in comp pixels of 1920 x 1080. Baseline: x 657–1264 (607 px, 31.6 % of the width, centred, 960.5), y 735 (68.1 % down), about 3 px thick, yellow. Bars: 60 px wide (3.1 % of the width), centres at x 724, 881, 1039, 1196.5 (37.7 %, 45.9 %, 54.1 %, 62.3 % of the width), equal 157.5 px pitch (97.5 px gap between bars); heights above the baseline 415.5, 273, 175, 27 px (38.5 %, 25.3 %, 16.2 %, 2.5 % of the picture height; 1 : 0.66 : 0.42 : 0.065 — exaggerated, not to the figures' scale, the smallest bar was shortened on purpose, said). The baseline overhangs the outer bar edges by 37 px on both sides. Labels: right edges at x 625 (32.6 % of the width), 69 px left of the first bar's left edge and 32 px left of the baseline's start; baselines at y 329, 462, 558, 707, each level with the top of its own bar within 2 px except the tallest (label 10 px below its bar's top); capital "M" about 19 px tall (1.75 % of the height), the "$" about 23 px. Whole chart block: x 532–1264, y 309–737, slightly right of centre because the labels hang off the left. Nothing else in the frame: no shadows, no glow, no background shading, no grain; flat colour on pure black. No motion blur: the switches show none set, and a bar's top edge stays sharp mid-growth. Motion: bars grow straight up from the baseline, bottom fixed; the tallest grows 415 px in 18 frames (about 98 px a frame in the two middle frames, 4.2 times the average 23 px a frame, from the 0.88 ease; the played heights on consecutive recorded frames from about run about 4, 8, 15, 24, 35, 51, 72, 109, 207, 305, 342, 363, 378, 390, 399, 406, 411, 416 px). Labels move only rightwards, 113 px in 12 frames, most of it in the first few frames; a little past half way a label is about 20 px short of its place (measured, the 09 playback, where the first bar is at about 17 % of its height and the label about 7 frames into its 12). Order in the picture: left to right, tallest first, one bar every 10 frames; whole build done at frame 55 (2.3 s).
timing and easing: Baseline 0–12 f (recipe 08). Bars: End 0 → 100 % over 18 f, in at 7, 17, 27, 37 f, ease cubic-bezier(0.88, 0.14, 0.12, 0.86) on both keys. Labels: Position x −113 px → final over 12 f, in at 7, 17, 27, 37 f, ease cubic-bezier(0.04, 0.47, 0.53, 0.93). In After Effects terms (inferred conversion, not shown): bars outgoing and incoming influence 88 %, speed 16 % of the average (about 21 %/s on End); labels outgoing influence 4 % at about 11.75 times the average speed (about 2650 px/s), incoming influence 47 % at about 0.15 times the average (about 34 px/s). Why the first bar starts at 7 f, not 0, is not said.
variations: The labels can slide up from below instead of in from the side (said). The layout can be drawn directly in After Effects (said: the illustration program is only easier for lining up).
pitfalls: Shapes arrive from the transfer with a black fill and so are invisible on the black comp until the fill is removed (said). The sequencing order has to be reversed because the first bar and the largest label sit at opposite ends of the stack (said twice). Trim Paths only grows the bar upwards if the path was drawn from the bottom up (inferred from the drawing step).
build notes: Script it as five shape layers, each with ADBE Root Vectors Group > a group holding one path (ADBE Vector Shape - Group), ADBE Vector Graphic - Stroke (Stroke Width 60, Line Cap Butt = 1, colour) and ADBE Vector Filter - Trim (End keyed). Draw each bar path with vertices [[x, 735], [x, top]] in that order so End grows upwards. Set the layer in-point (inPoint/startTime) to the first key's time and stack them so the tallest bar is lowest among the bars. Text: point text, ParagraphJustification.RIGHT_JUSTIFY, a bold geometric sans (Satoshi Bold is free; any similar one will do), size about 27 to reach a 19 px capital height (check the "M", not the "$"); layer anchor left at 0,0 so Position is the right end of the baseline. Keys at frame n are at n / 23.976 s. Apply the eases with setTemporalEaseAtKey using the influences and speeds in timing (for Position use a one-dimensional KeyframeEase per key, since it is spatial). The yellow was read from a screen recording: pure-ish yellows come through nearly unchanged, but if it looks too orange or too green in the render, aim for RGB about 243,190,6. No motion blur.
unknowns: The baseline's stroke width (about 3 px measured, never shown). The labels' font size, weight and fill value (only their rendered look is measured). The comp's length. Why the stagger begins at frame 7. Whether the fourth label's final x is 628.1 (its first-key x 515.1 is shown; final inferred). The exact keyframe frame of the bars' second key was read as 17.5 and 18 from two timelines; 18 is used. In the result crop the comp's top 90 px are off the recording (the comp's top edge is at y −101 of the frame; the crop holds comp rows 90–1080, all of the chart), and the viewer is at Half resolution, so thin lines read softer than they render.

## Chart baseline that draws outward from its middle
id: 08-baseline-draws-out-from-centre
revision: 24d327a4
job: show-proof; support: compare
status: proven (accepted 2026-11-21)
what it does for a beat: Opens a chart (or any divider) with a line that grows out to both ends at once from its centre, a calm, balanced first move before the data arrives.
what it looks like: On a black frame a thin warm-yellow horizontal line appears as a short dash in the middle of the picture and stretches evenly left and right to its full length in half a second, slow at first, fast in the middle, settling at the ends. In the tutorial it is the baseline of a four-bar chart, and the first bar starts rising from it before it has finished.
ingredients:
- Shape layer with one open horizontal path and a Stroke — built-in
- Trim Paths — built-in; Add > Trim Paths in the shape layer's contents (said "adding a trim paths"; shown, Trim Paths 1 under the layer's Contents)
- An easing extension that applies cubic curves to selected keys — paid; only a convenience, the curve is given below as numbers (shown)
steps:
1. Make a 1920 x 1080 comp, black background, 23.976 fps. (size said; frame rate shown "(23.976 fps)"; background shown)
2. Draw the baseline as one shape layer holding one horizontal open path, centred on the comp's width. (said "straight line", "center it up"; shown)
   - From x 657 to x 1264 at y 735 (607 px long) (measured, see layout)
   - Stroke Width: about 3 px (measured, not shown in any panel)
   - Stroke Color: warm yellow, swatch about RGB 243,190,6, the same as the chart's bars (bars' swatch shown; that the baseline shares it is inferred from the matching rendered colour; saturated colour from a screen recording, may be inflated)
   - Line Cap: not shown; Butt is inferred (the line's ends look square)
   - The layer sits at the bottom of the chart's stack and starts at frame 0 (shown, layer 9 of 9, bar from 0)
3. Add Trim Paths to the line's contents rather than pasting the bars' Trim Paths, because it animates differently. (said)
   - Start: 50 %, End: 50 % at frame 0, both keyed (said "set both to 50"; shown at 0:00:00:00, Start 50.0 %, End 50.0 %, keys on both)
   - Trim Multiple Shapes: Simultaneously (shown, default)
4. About 12 frames later, set Start to 0 % and End to 100 %. (said "about 12 frames", and that start goes to zero and end to 100; second keys shown at exactly 12 frames, 107 px at 8.92 px a frame; values shown at 0:00:00:12, Start 0.0 %, End 100.0 %, both pairs of keys eased; the line reaches both full ends by frame 12)
5. Select all four keys and apply a strong ease in and out. (said, as an easing preset; the speech names it "60 speed", the screen shows the same preset as the bars, cubic-bezier (0.88, 0.14, 0.12, 0.86), selected in the curve panel; the screen wins)
layout: Measured (comp at 0:00:02:12, comp edges at x 1189–2991 of the full-size frame, 0.939 screen px per comp px) and on the played frames (comp edges x 1424–3588, 1.127 screen px per comp px). In comp pixels: line from x 657 to 1264 (607 px, 31.6 % of the width), centre x 960.5, at y 735 (68.1 % down the picture), about 3 px thick (a 1–3 px band of the frame, Half-resolution viewer; about 3 px on the Full-resolution). Colour rendered about RGB 247,187,3 at the line's core (the core is partly blurred by the Half-resolution viewer, so it reads darker than the bars). Growth, read on consecutive played frames (the viewer redraws every frame here; one frame repeats): total length 8, 22, 43, 43, 129, 303, 476, 533, 563, 584, 597, 608 px; both ends always equidistant from x 960 (e.g. 949–972, then 809–1112 and 722–1199, then 657–1264). Half length at about frame 6 of 12; peak speed about 175 px a frame in total (about 87 px a frame for each end), against an average of 50. Nothing else: no glow, shadow or motion blur (the moving ends stay crisp). The rest of the chart (four 60 px bars and right-aligned labels, recipe 07) starts at frame 7, so the first bar has begun rising at the left before the line is complete; on the result frame (comp frame 12) the tallest bar is already a 60 x 35 px yellow block standing on the line's left part (centre x 724, about 8 % of its final height; its End reads 8.7 %), and the largest label is in the picture about three quarters of the way through its slide, its right edge near x 594 against a final 625 (Position x 596.4 against 628.1). To compare a build of the line alone, compare the line and ignore those two, or build them as in recipe 07.
timing and easing: Start 50 → 0 % and End 50 → 100 %, both keyed at 0 and 12 frames (0.5 s at 23.976 fps), ease cubic-bezier(0.88, 0.14, 0.12, 0.86) on all four keys. In After Effects terms (inferred conversion, not shown): outgoing and incoming influence 88 %, speed 16 % of the average, about 16 %/s on each property.
variations: none given
pitfalls: The line's Trim Paths is set up on its own rather than pasted from the bars, because it animates differently (said). Pasted, it would draw from one end like the bars (inferred).
build notes: Shape layer: ADBE Root Vectors Group > group > ADBE Vector Shape - Group with vertices [[657, 735], [1264, 735]] in comp space (or centred on the layer), ADBE Vector Graphic - Stroke (width 3, Butt cap), and ADBE Vector Filter - Trim with Start (property 1) and End (property 2) keyed at 0 and 12/23.976 s. Apply KeyframeEase(16, 88) on both sides of each End key and KeyframeEase(-16, 88) on the Start keys, since Start falls (speed 16 %/s, influence 88; the sign is inferred from how After Effects stores speed). Do not use speed 0: KeyframeEase(0, 88) is a different, steeper curve, cubic-bezier(0.88, 0, 0.12, 1), and the played lengths match only the 16 %/s one. Direction of the path does not matter: start and end move symmetrically.
unknowns: The line's stroke width and cap (about 3 px and square ends, measured). In the result crop the comp's top 90 px are off the recording (comp top at y −101 of the frame); the line is well inside the crop.

## Pie chart from one fat stroke, with the share pushed out
id: 10-pie-slice-from-a-stroked-ring
revision: e2f0e818
job: show-proof; support: land-number, compare
status: proven (accepted 2026-11-21)
what it does for a beat: A single-statistic beat ("X % of all ..."): a pie sweeps round from twelve o'clock, then the highlighted share slides out from the centre so the number has a piece to point at.
what it looks like: On a black frame, a solid disc about a quarter of the frame height across, centred. It is lilac, apart from an 18 % wedge in warm yellow that starts at twelve o'clock and runs clockwise. Both parts sweep on clockwise together in one second with a strong S-curve ease. Then the yellow wedge slides about 36 px up and to the right along its own centre line, leaving an even black gap about 20 px wide along both of its straight edges. Flat colour, no outline, no shadow, no gradient.
ingredients:
- Shape layer with an Ellipse path, Stroke only, no visible Fill — built-in (ellipse tool; fill removed said, Fill switched off shown)
- Trim Paths — built-in (shape layer Contents > Add > Trim Paths; menu path inferred)
- A keyframe-easing extension — paid; used only to apply one S-curve ease, given below as numbers
steps:
1. Comp: 1920 x 1080 at 23.976 fps, black background. (1920 x 1080 said; 23.976 shown in the project panel; black shown)
2. Draw an ellipse shape layer centred in the comp. Keep only a Stroke: the Fill is switched off with its eye (shown, "Fill 1" still in Contents) or deleted (said); either gives the same picture.
3. Make the stroke so fat that it closes the hole: the stroke is wider than the ellipse. (said "make it a pie"; values shown)
   - Stroke Width: 131 px (shown and toolbar; the author scrubbed 182 → 156 → 131)
   - Ellipse Size: 127.9, 127.9 (shown; tried 208.9 and 140.9 on the way)
   - Because the width (131) is larger than the diameter (127.9), the inner edge passes the centre and the ring renders as a solid disc 127.9 + 131 ≈ 259 px across. (inferred from the values; matches the measured 256–259 px)
   - Line cap: butt (inferred from the square wedge edges)
4. Add Trim Paths to this layer. (said "trim pass"; shown)
5. Duplicate the layer. Name the top copy "slice" and the lower one "base". (said; layer order shown)
6. Colour the slice yellow and the base lilac. (said; dialog values shown)
   - Slice stroke: #FCCE02 (shown : the dialog is open on the base layer, showing the colour both copies still share before the base is recoloured, so the slice keeps it). Renders about RGB 247, 202, 3.
   - Base stroke: #DA87EF (shown, dialog open; kept). Earlier the author tried #02B6FC (blue) and #F602FC (magenta). It renders about RGB 207–214, 113–134, 231–235.
   - P3 caution: both colours are saturated. The recording was probably captured in a wide-gamut space, so the measured render values are lower than the typed hex. Type the hex values, then compare against the measured values in an sRGB render. (inferred)
7. Set the base's Trim Paths to Start 18 %, End 100 %, Offset 0°, Trim Multiple Shapes "Simultaneously". (shown)
8. Set the slice's Trim Paths to Start 0 %, End 18 %. (said; shown keys)
   - The two layers now meet at twelve o'clock and at 18 % (64.8° clockwise). Trim runs clockwise from twelve o'clock on an ellipse drawn with the tool. (shown in the played result)
9. Key the sweep-on over 1 s (0 f to 24 f). (shown in the timeline)
   - Base Start: 0 % at 0 f, then 18 % at 24 f
   - Base End: 0 % at 0 f, then 100 % at 24 f
   - Slice End: 0 % at 0 f, then 18 % at 24 f (Start stays 0)
10. Ease every key with the S-curve cubic-bezier 0.88, 0.14, 0.12, 0.86. This is a saved curve in the easing extension. (preset selected on screen, shown; speech recognition reads it as "60 speed"; numbers shown)
    - In After Effects terms: Influence 88 % in and out on every key. Speed at each key is 0.159 × the move's average speed. For Base End that is 0.159 × 100 %/1 s ≈ 15.9 %/s; for Base Start and Slice End it is 0.159 × 18 %/1 s ≈ 2.9 %/s. (inferred conversion)
11. Push the slice out. The slice's Anchor Point stays at the layer centre, so Position moves the wedge without changing its shape. (anchor said "centred")
    - Position: 960, 540 → 980, 510. That is +20 in x and −30 in y: 36 px along a line 34° clockwise from straight up, which is the wedge's own centre line (18 % / 2 = 32.4°). (shown, readout 980.0, 510.0; direction computed)
    - Key times: about 28 f → 44 f (1:04 → 1:20), a 16-frame move that starts just after the sweep lands. (inferred from key positions on the timeline ruler, ±1 f; the keys were first set at 1:17–2:09, then dragged earlier)
    - Same S-curve ease on both keys (shown, the extension panel showing the preset). In After Effects terms, Influence 88 % and speed 0.159 × (36 px / 16 f ≈ 54 px/s) ≈ 8.6 px/s at each key. (inferred conversion)
layout: Measured (viewer at 62.7 %, comp edges at full x 1188–2991: 0.939 full recording px per comp px) and (viewer at 100 %: about 1.81 full px per comp px). measured: the disc is centred on 960, 540 and is about 256–259 px across: 24 % of the frame height and 13.4 % of the width. The wedge covers 18 % of the turn, from twelve o'clock clockwise to about 64.8°. After the push, the wedge's tip sits about 20 px right of and 30 px above the centre. The black gap along each straight edge is 19–20 comp px wide, and the gap along the circle edge is the same 36 px offset. The base is an 82 % sector with its notch exactly where the wedge came from. Background pure black, no grain, no outline, no shadow, no glow. In the full video's own finished version of this chart (a different file, shown in the intro at about 11.5–12.1 s), the same shape is pale green with a dark value label. At it is pale blue with a soft glow, laid over the presenter's shot.
timing and easing: Sweep 0–24 f; slice push about 28–44 f; S-curve (0.88, 0.14, 0.12, 0.86) on all keys. This is a strong slow-in/slow-out with the middle about 6–7 × the average speed. Motion blur: not seen switched on, and no smear is visible on the wedge during the push.
variations: The share is just the Trim Paths split value (18 here). Any percentage works by setting the base's Start and the slice's End to the same number. The colours were tried in blue and magenta before lilac. (shown)
pitfalls: If the stroke is thinner than the ellipse is wide, the result is a donut, not a pie. Keep Stroke Width ≥ Ellipse Size. (inferred from the values tried) The push must follow the wedge's centre line, or the gaps on the two straight edges come out uneven. (inferred)
build notes: Shape layer: "ADBE Root Vectors Group" > "ADBE Vector Group" > "ADBE Vector Shape - Ellipse" (Size 127.9, 127.9) and "ADBE Vector Graphic - Stroke" (Stroke Width 131, colour as above). Delete any Fill. Add "ADBE Vector Filter - Trim" ("ADBE Vector Trim Start", "ADBE Vector Trim End"). Ease by script: `setTemporalEaseAtKey(k, [new KeyframeEase(s, 88)], [new KeyframeEase(s, 88)])` with s from step 10/11. Position is two-dimensional, so it takes one ease per key. Duplicating the shape layer keeps the trim; then set the values per layer.
unknowns: The stroke's line cap and line join settings (not opened). The exact push key times are read from ruler pixels (±1 f), not from a readout. Whether the comp background is set to black or is empty (renders black either way). Motion-blur switches not legible. The comp's duration.

## Value label that rises in one word at a time
id: 11-label-rises-word-by-word
revision: 6464b2db
job: land-number; support: reveal-headline
status: proven (accepted 2026-11-21)
what it does for a beat: Puts a short stat sentence next to a chart's highlighted piece ("18% of all ..."). The words pop up one after another two frames apart, so the line reads as it lands.
what it looks like: On a black frame, a single line of white heavy sans-serif lower-case words (the number first, with its percent sign) to the upper right of a pie chart's pushed-out wedge. Each word appears 49 px below its place with no fade and shoots up fast, then settles gently. The five words start 2 frames apart, left to right, so the line ripples up like a short wave. An optional posterised-time finish is then added; its choppy stop-motion feel is the setting's expected effect, not seen played here.
ingredients:
- Text layer, font Satoshi Black (a free font) — built-in text
- DecomposeText (a script that splits a text layer into one layer per word) — free third-party script (said "free", 23:05.8)
- Motion Tools 2 (free script panel), its Sequence layers feature — free third-party script (said "a free plugin", 23:27.6); version 2.1.2 shown
- A keyframe-easing extension — paid; used only to apply an ease, given below as numbers
- Adjustment layers with Posterize Time and Transform — stock (Effect > Time > Posterize Time; Effect > Distort > Transform)
- The pie from recipe 10 (a lilac disc 259 px across centred at 960, 540, with an 18 % yellow wedge pushed 36 px out towards about one o'clock). Only needed so the label has something to sit beside.
steps:
1. Comp: 1920 x 1080 at 23.976 fps, black, with the pie described under ingredients. (1920 x 1080 said; 23.976 shown in the project panel)
2. Type the label as one text layer: white fill, no stroke, Satoshi Black, tracking 0, left aligned. (font and fill shown; alignment inferred from the layout)
   - Size: 36.3 px, leading 30.4 px, Scale 100 % (shown, Properties panel). The 73 px seen is the value before it was set down. The rendered cap height measures about 26 comp px. (measured)
   - Place it so its left edge is level with the pushed wedge's right-most corner and its cap top is level with the wedge's top: the text starts at comp x ≈ 1093, cap top y ≈ 375, baseline y ≈ 401 (Position 1090, 402, shown). (measured)
3. Run DecomposeText on the layer with "Decompose into: Words" and "Original position using expressions" turned on. Then delete the original text layer. (settings shown; delete said)
   - Result: five text layers, one per word, stacked in reading order top to bottom ("18%", "of", "all", "coffee", "beans"). Each has the same Position (1090, 402) and keeps its word where it sat in the line. (shown)
   - For a script: make one text layer per word. Give each the same font settings and the same Position (the line's start point). Pad each layer's text with the preceding words' width, or set each layer's Position x to that word's original left edge. The script used here does the former with expressions, keeping one shared Position value. (exact expression not shown; how it offsets each word is inferred)
4. On every word layer, key Position from 1090, 451 to 1090, 402: 49 px up (4.5 % of the frame height) over 16 frames. (shown and keys crops)
   - First key: 1:16 (40 f), value 1090, 451 (shown)
   - Second key: 2:08 (56 f), value 1090, 402 (shown; the key position is read from the ruler, ±1 f)
5. Ease both keys with the curve cubic-bezier 0.04, 0.47, 0.53, 0.93 (the extension's "Fast In" preset). (preset name said; numbers shown)
   - In After Effects terms: out key Influence 4 % with speed 11.75 × average; in key Influence 47 % with speed 0.149 × average. Average = 49 px / 16 f ≈ 73.4 px/s, so out speed ≈ 863 px/s and in speed ≈ 10.9 px/s. (inferred conversion)
   - The result is an almost instant launch that spends most of the move gliding in to rest.
6. Trim every word layer's in-point to its first key, so a word does not exist before it starts to rise. There is no opacity key. (said; in-points shown)
7. Stagger the words 2 frames apart in reading order. (Motion Tools Sequence with offset 2, step 1, descending ladder, shown)
   - In-points and first keys: "18%" 40 f, "of" 42 f, "all" 44 f, "coffee" 46 f, "beans" 48 f. Each word's two keys keep their 16-frame spacing. (measured on the timeline)
   - So the last word lands at 64 f (2:16).
8. Optional finish: paste two adjustment layers on top of the comp, above the word layers (shown). One has Posterize Time at 12 fps (shown in the comp it was copied from). The other has a Transform effect with Scale 101 % (shown there) and a Position expression `posterizeTime(6); wiggle(222,3)` for a whole-frame jitter of about ±3 px every 4 frames (`posterizeTime(6)` and `wiggle(222` shown there; the closing `,3)` inferred).
layout: Measured (viewer at 62.7 %, comp edges at full x 1188–2991: 0.939 full recording px per comp px). measured: the line runs from comp x 1093 to 1493: 400 px, 20.8 % of the width, starting 57 % across. Cap top at y 375, baseline y 400–402 (about 37 % down). Cap height about 26 px (2.4 % of the height). The line sits above and right of the pie: its left end is level with the pushed wedge's right-most corner (about x 1097), and its cap top is level with the wedge's top (about y 380); the baseline is about 22 px lower. Word spaces are ordinary spaces at tracking 0. Pure white on pure black; no shadow, no outline, no glow. Each word rises from 49 px below and does not fade in. Motion blur: not on (no smear on the rising words in the played pass).
timing and easing: Per word 16 f rise, curve 0.04, 0.47, 0.53, 0.93, start times 2 f apart (40, 42, 44, 46, 48 f). The whole line is up by 64 f (about 2.7 s into the comp, 1 s after the slice push ends). With Posterize Time 12 over the comp, the rise moves in 2-frame steps. (inferred from the setting; the comp was not replayed after the paste)
variations: Split by characters or lines instead of words (DecomposeText offers these; not shown chosen). Change the stagger offset in Motion Tools for a slower ripple. (inferred)
pitfalls: Delete the original text layer after decomposing, or the full line sits on top of the animated words. (said) Trim the in-points; otherwise each word sits visibly 49 px low before its rise. (said, in effect)
build notes: Text by script: `layer.property("Source Text")` with TextDocument fontSize 36.3, leading 30.4, font "Satoshi-Black" (PostScript name inferred), fillColor [1,1,1], applyStroke false, tracking 0, justification LEFT_JUSTIFY. For a scripted build, skip DecomposeText. Create one text layer per word, set its x from the measured word positions or from the sourceRectAtTime() widths of the line's preceding text, and key Position y +49 → 0. Ease: `setTemporalEaseAtKey(1, [inEase], [new KeyframeEase(863, 4)])` on key 1 and `setTemporalEaseAtKey(2, [new KeyframeEase(10.9, 47)], [outEase])` on key 2. With separated dimensions, apply these to Y Position; otherwise to Position. In-points: `layer.inPoint = key1Time`. Posterize Time match name "ADBE Posterize Time"; Transform "ADBE Geometry2".
unknowns: How DecomposeText's position expression offsets each word (not shown). The second key time per word is read from the ruler (±1 f). Whether the Posterize/jitter layers change the label's feel: the comp is not played after they are pasted.

## Photo pyramid that dips, then splits into tiers to reveal labels
id: 12-pyramid-tiers-spread-to-reveal-labels
revision: 8f0a59ee
job: make-concrete; support: add-impact
status: proven (accepted 2026-11-21)
what it does for a beat: A hierarchy or "levels" beat. A real-looking pyramid sits whole, gathers itself, then pulls apart into three tiers, and a label appears in each opening gap.
what it looks like: A black-and-white, punchy-contrast photo of a stone pyramid, centred on black. It first squeezes in slightly: the top tier dips down and the base lifts up for half a second. Then the top shoots up and the base drops down in a sudden burst that eases out to rest, while the middle tier stays put. The cut faces show a flat dark grey band under each upper tier, so the slices read as solid blocks. Two small white bold lower-case labels ("level 2" and "level 1") sit in the black gaps, hidden behind the tiers until the gaps open.
ingredients:
- Art (build aid, not the technique): one pyramid photo cut into three tier images on transparent backgrounds. All three are the same canvas size and stay registered when stacked. Each upper tier carries a painted flat dark band along its bottom edge as its cut interior face. When closed, the tier below covers that band; when the tiers part, it shows. (said; the cutting was done in an image editor)
- Three image layers (here smart-object layers from a layered file) — built-in import
- Graph Editor, speed graph — built-in
- A keyframe-easing extension — paid; used only for a starting ease, given below as numbers
- An inertial-bounce expression on Position — built-in expressions; copied from the same video's earlier step-picture comp, where its first two lines are on screen
- Text layers — built-in
- Adjustment layer with Hue/Saturation and Levels — stock (Effect > Color Correction > Hue/Saturation; Effect > Color Correction > Levels)
steps:
1. Comp: 1920 x 1080 at 23.976 fps, black, 16 bpc (Levels shows a 0–32768 range). (1920 x 1080 said; 23.976 shown in the project panel; 16 bpc inferred from the Levels range shown)
2. Import the three tier images and stack them all at Position 960, 540 so they form the whole pyramid. (paste said; positions shown in)
   - Layer order top to bottom: base, middle, top (shown). Each lower tier covers the dark band of the tier above it.
   - Closed pyramid spans comp x 351–1571 and y 239–840: 63.5 % of the width, 55.6 % of the height, centred. (measured)
3. Key the top and base tiers' Position at 0 f, at about 13 f and at 1:11 (35 f). The middle tier gets no keys. (shown; 13 f read from the ruler, ±1 f)
   - Base: 960, 540 → 960, 521 (anticipation, 19 px up) → 960, 761 (221 px below rest)
   - Top: 960, 540 → 960, 555 (anticipation, 15 px down) → 960, 315 (225 px above rest)
   - The base tier also has a fourth Position key at 2:02 (50 f), added and kept to the end (shown). Its value reads 960, 762.2, which includes the bounce, so it holds the base where it already rests; it can be ignored.
   - The small opposite move first is the anticipation (said); the big move is the spread.
4. Ease all keys with cubic-bezier 0.88, 0.14, 0.12, 0.86 (the extension's saved S-curve). (preset said; numbers shown)
   - In After Effects terms, Influence 88 % in and out, with speed at each key 0.159 × that segment's average speed. (inferred conversion)
5. Open the speed graph and reshape the anticipation segment so it is gentle and the spread is the burst. (said; shown)
   - The 0 f key's outgoing handle is dragged down to Speed 0.00 px/s, Influence 24.57 % (shown, tooltip, the 41.61 px/s readings at 29.48 % and 43.24 % are mid-drag, and the settled graph starts at zero speed)
   - Speed at the 13 f key: roughly 35–40 px/s (read off the graph)
   - Final speed graph (shown): a small hump of about 150 px/s at about 2 f, falling to about 40 px/s at 13 f. Then the spread spikes to a sharp peak of about 1850 px/s at 24 f (1:00) and falls to about 30 px/s at 35 f. (peak values read off the graph, ±10 %)
   - Before the edit, the anticipation hump peaked near 500 px/s (shown); the edit cut it to about a third.
6. Add an inertial-bounce expression to the three tiers' Position. It is copied with Copy Expression Only from the step pictures' Scale in the earlier comp, and pasted onto the tiers. (said 28:38.9–28:51.1; Copy Expression Only shown; values turned red, shown)
   - Its first lines, `amp = .1;` and `freq = 2.0;`, are shown in that earlier comp. The rest is not on screen; the standard form below, with decay 2.0, is inferred there from a measured overshoot:
     ```
     amp = .1;
     freq = 2.0;
     decay = 2.0;
     n = 0;
     if (numKeys > 0){ n = nearestKey(time).index; if (key(n).time > time){ n--; } }
     if (n == 0){ t = 0; } else { t = time - key(n).time; }
     if (n > 0 && t < 1){
       v = velocityAtTime(key(n).time - thisComp.frameDuration/10);
       value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);
     } else { value; }
     ```
   - Measured effect: small but visible. At 1:12 the base reads 960, 763.0 against its 761 key and the top 960, 313.1 against 315, about 2 px past the key (shown).
7. Add the labels as white, bold, lower-case, centred text layers. In the stack, put them below the tier layers so the tiers hide them until the gaps open. Then trim both labels' in-points to about 17 f (said 29:16.8; label bars starting at about 0:17 shown), so neither can peek past the pyramid's narrow top during the 0–13 f squeeze (reason inferred).
   - "level 2" centred in the upper gap: comp y 312–342, x 904–1014 (measured)
   - "level 1" centred in the lower gap: comp y 744–774, x 909–1010 (measured)
   - The ascender height is about 30 px, so the size is about 40 px (inferred). The font is a heavy geometric sans (inferred from shape; not named here).
8. Add an adjustment layer on top with Hue/Saturation and Levels. (shown)
   - Hue/Saturation: Master Saturation −100, Master Lightness 0 (shown)
   - Levels (16 bpc): Input Black 3469.6, Input White 25186.4, Gamma 1.00, Output Black 0, Output White 32768 (shown). In 8-bit terms, Input Black 27 and Input White 196 (computed).
9. Precompose the tiers and labels for later reuse. (said; the precomp layer is seen; the labels are inside it, since they scale with the tiers when the precomp is enlarged)
layout: Measured on the settled spread at 1:12 (cut from the source, viewer at 50 %). measured: top tier y 13–258, x 753–1210. Middle tier y 399–663, x 513–1401. Base y 821–1064, x 351–1568. The black gaps are about 141 px (top to middle) and 158 px (middle to base). The labels sit in the vertical centre of those gaps; the top tier nearly touches the frame top (13 px) and the base nearly touches the bottom (16 px). The dark interior band renders flat grey level 44/255 after the grade. In colour it was a dark olive, painted as a flat fill. The photo renders full black-and-white with crushed blacks and bright highlights (from Levels). Background pure black, apart from faint dotted stray edge pixels in the black beside the tiers. These come from the art's cut edges, and the Levels push makes them show. No shadow between tiers, no blur, no grain beyond the photo's own texture. Motion blur: not seen switched on; the burst frames show no smear (only stepped positions).
timing and easing: Anticipation 0–13 f (≤19 px). The spread is 13–35 f with peak speed about 1850 px/s at 24 f, then settles by 35 f (1:11). Middle tier still. The burst is the point: the top and base each cover about 240 px in under a second, most of it in the 6 frames around 24 f.
variations: The same idea works with any layered photo object: buildings, cakes or stacks. More tiers give more labels. A finished version in the same video (a different file) sits on a white grid with tilted grey tiers. (shown)
pitfalls: If the labels sit above the tiers in the stack, they show over the closed pyramid. Keep them below. (said) Without the painted interior band, the parted tiers look like thin paper cut-outs. (inferred from the build aid's purpose)
build notes: Position keys by script, then `setTemporalEaseAtKey` per key. To match the shown speed graph: key 1 (0 f) gets out speed 0 px/s with Influence 24.57 % (shown). Key 2 (13 f) gets in/out speed ≈ 35–40 px/s (read off the graph). Key 3 (35 f) gets incoming speed ≈ 30 px/s and Influence ≈ 88 % or higher, so the peak lands near 24 f. Set `position.expression` on all three tiers to the text in step 6. Effects: "ADBE HUE SATURATION" (Master Saturation −100); "ADBE Easy Levels2" (in a 16 bpc project, Input Black 3469.6/32768 = 0.1059, Input White 25186.4/32768 = 0.7686 as normalised values). Labels: text layers moved below the tier layers with `moveAfter`.
unknowns: The bounce expression's lines after `freq = 2.0;` (decay 2.0 inferred). The label font and exact size. The anticipation key time (about 13 f, from the ruler). The speed values other than the one tooltip (read off the graph).  Whether the grade adjustment layer went inside the precomp.

## Pinned instant photos swaying on a grey map
id: 14-pinned-photos-swaying-on-a-map
revision: 8c3d0093
job: point-at-detail; support: keep-it-alive, establish-place
status: proven (accepted 2026-11-21)
what it does for a beat: Marks a few places on a map with small pinned instant photos that hang and sway a little, so a travel or "where it happened" beat feels hand-made and alive while the camera holds or moves over it.
what it looks like: An old printed two-page world map, turned grey and lifted in contrast, with three small instant-photo prints (white frame, thick bottom border, soft shadow) each held by a red pushpin at its top centre. Each print slowly rocks a few degrees around its pin; the pins do not move.
ingredients:
- Hue/Saturation — stock; Effect > Color Correction > Hue/Saturation (inferred menu)
- Levels — stock; Effect > Color Correction > Levels (inferred menu)
- Adjustment layer — built-in; Layer > New > Adjustment Layer (inferred menu)
- Pre-compose — built-in; Shift+Cmd+C, "leave all attributes" option (said)
- Pan Behind (anchor point) tool — built-in; Y key (said)
- Null object — built-in; Layer > New > Null Object. The author used a free null-making extension (said); its nulls show as shape-type layers with an fx switch (shown). A plain null does the same job (inferred)
- wiggle() expression on Rotation — built-in; Alt-click Rotation's stopwatch (said, shown)
- Art: a large scan of an old printed world map, an empty instant-photo frame PNG with a soft drop shadow baked in, a red pushpin PNG with its own shadow baked in, and one photo per place (generated landscape pictures: mountains, a green valley, a sunny jungle)
steps:
1. Import the map scan and the art. The scan is very large. (said, shown)
   - Map scan size: 9786 x 6309 px (shown; the narrator says a rounder figure, the panel wins)
   - Project bit depth: 16 bpc (shown)
2. Pre-compose the map layer, keeping all attributes, into a map precomp. Everything below is built inside that precomp. (said; shortcut said)
   - Precomp length: 0:00:15:00 at 23.976 fps (shown)
   - The outer comp the precomp sits in is 1920 x 1080 at 23.976 fps (said; size also inferred from the camera dialog in recipe 16)
3. Add an adjustment layer directly above the map and give it Hue/Saturation to remove the colour. (shown)
   - Channel Control: Master; Master Saturation: −100; all else default (shown)
4. Add Levels to the same adjustment layer, below Hue/Saturation, to deepen the ink and brighten the paper. (shown)
   - Channel: RGB (shown)
   - Input Black: 2056.0 (16 bpc scale) ≈ 16 on an 8-bit scale (shown; 8-bit figure inferred)
   - Input White: 28784.4 (16 bpc scale) ≈ 224 on an 8-bit scale (shown; 8-bit figure inferred)
   - Gamma: 1.00; Output Black: 0.0; Output White: 32768.0 (shown)
   - Clip To Output Black / White: "Off for 32 bpc Color" (defaults, shown)
5. Above the adjustment layer, place one photo, the instant-photo frame on top of it, and the pushpin on top of both. The photo sits inside the frame's window. (said, shown)
   - Frame layer Scale: 479% (shown; depends on the frame PNG's own size)
   - Photo scaled to fill the frame's window, about 88% of the frame's width and the top ~75% of its height (inferred from the result frame)
6. Rotate the pushpin slightly so its baked shadow falls naturally, scale it up a little, and centre it on the frame's top edge using the grid and proportional grid. (said)
7. Duplicate photo + frame + pin once per place and swap in each place's photo. Colour-label each set (the author uses one label colour per place). (said, shown)
8. Pre-compose each photo + frame pair (not the pin) into its own precomp named for the place. (said, shown)
9. With the Pan Behind tool, drag each photo precomp's anchor point up to the pin's point, so it will swing from the pin. (said, shown mid-drag)
10. Select the pin and its photo precomp, create a null, and parent both to it. One null per place. (said; only the North-America set is done — one null, with that pin and print parented to it, the other sets still "None" with their eyes off; all three nulls exist, each parenting its own pin and print, the nulls themselves unparented, shown)
11. Scale each null down and move it onto its place: one on North America, one on western Europe (France), one on Asia. (said; P and S shortcuts said)
12. On the first photo precomp, Alt-click the Rotation stopwatch and type a wiggle. (said, shown)
   - First try: wiggle(1,10) (shown)
   - Final: wiggle(.5,10), i.e. half a sway per second, up to about 10° either side (shown)
13. Copy the expression and paste it onto the other two photo precomps' Rotation. (said, shown : each photo precomp has Rotation with an expression; one reads wiggle(.5,10))
   - Readouts at the same moment differ per print, because each layer's wiggle has its own random seed: −3.7°, +0.2°, −2.3° (shown)
layout: Measured on the 20% viewer (picture region in the full-size frame: x 850–3340, y 190–1210). The result view is a crop of the map at the editor's zoom, not the whole page: the map runs past all four edges, showing only its middle band (from the northern empire lettering down to the southern-ocean lettering), about 64–65% of the map's width, centred on the centre gutter, which runs vertically through the middle; the page edges, the far-north ocean and the bottom cartouche are outside it (measured; width share inferred from the viewer scale). To match it, frame that band, not the whole page. Each print is small: the western-Europe print about 4.4–4.6%, the Asia print about 4.2–4.4% and the North-America print about 3.5% of the crop's width (measured); North America's print is the smallest; cross-checked against the 51 px border stroke of recipe 15, a print is about 250–330 map px wide, about 3% of the 9786 px map width (measured, ±20%). Print height ≈ 1.18 × its width (measured). The photo fills the top ~75% of the print's height and ~88% of its width, leaving a thick white bottom border (measured). The pushpin is about 11% of the print's width, centred on the print's top edge and overlapping it (measured). Each print carries a soft, fairly even shadow halo all round, a little heavier below, and each pin a small shadow of its own, both baked into the PNGs (shown), not made by a step. Grey map tones on the rendered viewer: paper about 230, ink about 48 of 255, median 203 (measured); the old paper's blotches and fold shading come from the scan itself. The adjustment layer sits below the prints, so the photos and the red pins stay in full colour over the grey map (shown, layer order). Stack inside the map precomp, top to bottom: per place [null → pin → photo precomp], then the highlight and border shape layers of recipe 15 (Multiply), then the adjustment layer, then the map (shown). Motion: each print rocks about its pin; speed comes from the expression, wiggle(.5,10): about half a random change a second, up to ±10° either side (shown). The recorded preview cannot time it: the comp time display stays frozen at 0:00:00:21 through it (shown 049918–050063). The pins and the map do not move.
timing and easing: No keys. Rotation is driven by wiggle(.5,10): about 0.5 random changes per second, amplitude up to ±10° (shown). Readouts: −4.4° at 0:00:03:16 with wiggle(1,10) (shown); +8.4° at 0:00:05:14 with wiggle(.5,10) (shown). The preview's start is not readable; the display holds at 0:00:00:21 while it plays (shown 049918–050063).
variations: The author first used a sway of one per second and slowed it to half (shown). A plain null replaces the extension's null (inferred). A tape PNG was tried as the holder and deleted in favour of the pin (said).
pitfalls: Put the anchor point at the pin before adding the wiggle, or the print spins around its own centre instead of hanging (said, inferred). Keep the pin outside the photo precomp so it does not rotate (shown). Put the prints above the grey adjustment layer, or they turn grey too (shown).
build notes: Hue/Saturation is "ADBE HUE SATURATION" ("Master Saturation"); Levels is "ADBE Easy Levels2" (Input Black, Input White, Gamma, Output Black, Output White; values by script are on a 0–1 scale: Input Black ≈ 0.0627, Input White ≈ 0.8784). Set the anchor point by script to the pin's point in layer space and offset Position by the same amount so nothing jumps. Parent with layer.parent = null layer. Rotation expression: wiggle(.5,10). In 8 bpc the Levels values are the 8-bit figures above. Everything is scriptable.
unknowns: The exact anchor-point values and each null's position and scale. The photo precomps' own size and duration. The pin's rotation and scale values. The photos' scale inside the frame. Whether the result clip is the live comp or an earlier save (the time display holds at 0:00:08:11 through the window, so it is a still view of the build).

## Ink-blend place highlights and a self-drawing border on a grey map
id: 15-map-highlights-and-border-trace
revision: 7eb6b455
job: point-at-detail; support: establish-place
status: proven (accepted 2026-11-21)
what it does for a beat: Points at a region on an old map with soft coloured blobs that look printed into the paper, and draws a country's outline on cue, for "here is where it happened" beats in a travel or history piece.
what it looks like: On a grey, contrasty old world map, translucent cyan ovals sit over three places like watercolour washes (the map's lines show through them), and a thick mustard-yellow line traces around the United States, drawing itself from the top middle round the outline; in the result it is about 98% drawn, with a short undrawn piece left at the top middle. Where the cyan and the yellow overlap the paint reads green.
ingredients:
- Ellipse shape layer with fill — built-in; Ellipse tool on the toolbar (inferred)
- Pen-drawn shape layer with stroke — built-in; Pen tool (said)
- Multiply blend mode — built-in; layer Mode column (shown)
- Trim Paths — built-in; shape layer Contents > Add > Trim Paths (said; menu inferred)
- Hue/Saturation and Levels on an adjustment layer for the grey map — stock (shared set-up, below)
- A keyframe-easing extension's curve preset (an extension; the same curve can be typed as a cubic bezier or set by influence, below)
steps:
1. Shared set-up, as in recipe 14: inside a map precomp (scan 9786 x 6309 px, 16 bpc project, 23.976 fps, 15 s), an adjustment layer above the map with Hue/Saturation Master Saturation −100 and Levels Input Black 2056.0 / Input White 28784.4 on the 16 bpc scale (≈16 / 224 on 8-bit), Gamma 1.00, Output 0.0–32768.0. (shown)
2. Draw an ellipse over the first place (western Europe, around Paris). Remove its stroke and give it a fill. (said, shown)
   - Fill Color: swatch about RGB 31, 201, 248 (#1FC9F8) (shown, sampled from the swatch). Wide-gamut warning: this is a saturated mid-tone sampled from the recording, so the swatch reading itself may be inflated by the display gamut; treat it as approximate (inferred).
   - Scale: 189% (shown; depends on the drawn ellipse's size)
   - Mode: Multiply (shown)
3. Place the ellipse layer just above the grey adjustment layer and below the pushpins and photos. Being above the adjustment layer keeps it in colour. (said; layer order shown — words and screen agree)
4. Duplicate it, scale the copy up and move it over the south of North America (around New Orleans); duplicate again for Asia. All three stay in Multiply. (said, shown)
5. Solo the map and draw a closed-looking outline round the mainland United States with the Pen, on a new shape layer. (said, shown)
   - Fill: None (shown)
   - Stroke Width: 51 px (scrubbed down from about 101, shown)
   - Stroke Color: swatch about RGB 231, 193, 79 (#E7C14F) (changed from blue; shown). Wide-gamut warning: this is a saturated mid-tone sampled from the recording, so the swatch reading itself may be inflated by the display gamut; treat it as approximate (inferred).
   - Mode: Multiply (shown)
6. Place the border layer just above the adjustment layer, below the three ellipses. (shown)
7. Add Trim Paths to the border's contents, keyframe End, and set the first key to 0%. (said, shown)
   - End: 0% at about 0:00:00:13, 100% at about 0:00:01:21 — about 32 frames, 1.33 s (shown; read from key positions on the ruler, ±1 frame)
   - Start: 0%; Offset: 0° (defaults, inferred)
   - The keys first sat at about 0:00:00:21 and 0:00:01:14 and were moved earlier before the result (shown then)
8. Apply the extension's slow-in, slow-out curve to both End keys. (said, shown)
   - Curve values: 0.88, 0.14, 0.12, 0.86 (a cubic bezier) (shown)
   - Check: the readout of 97.9% at 0:00:01:18 matches this bezier (98.1% predicted), so the curve is applied (measured)
9. Preview. (shown 053290–053339; the preview's comp range is not readable — the time display holds at 0:00:00:21 while it plays and reads 0:00:01:18 only after it stops, shown)
10. The comp is never played past 0:00:01:18 here: End reads 97.9% and the author fits the view and leaves the precomp (shown). Running End on to 100% closes the outline (inferred, where the untrimmed stroke is continuous across the start point).
layout: Measured on the result frame (viewer picture region in the full-size frame: x 1004–3840, y 146–1378). The border's bounding box spans x 15.5–75.4% and y 15–90% of that picture (measured). The North-America oval's centre is at about (49.6%, 68.7%) of the picture, its diameter about 14.8% of the picture width (measured), about 0.75 × the width of the nearby photo print (the print is about 19.7% of the picture width). The stroke is about 15% of that print's width; the 51 px stroke measures about 92–100 full-size px thick on the result frame, i.e. ≈1.8–1.95 full-size px per comp px (measured). In scene-free terms: the stroke is about 1/20 of the outline's width, and an oval is roughly the size of a large region (a few states, or half of France and its neighbours). Colour as rendered: cyan over paper ≈ RGB 3, 158–183, 188–221; yellow over paper ≈ RGB 209, 173, 35; cyan over yellow reads green; the map's black ink shows through both because of Multiply (measured). Wide-gamut warning: these saturated mid-tones render darker and more saturated than the swatch (the cyan's red of about 3, where swatch × paper would give about 28, points to display-gamut inflation of both the swatch and the render), and a different working colour space will shift them, so treat both as approximate. The pins and photo prints (recipe 14) sit above all shapes and stay in full colour (shown). Stack inside the map precomp, top to bottom: per place [null → pin → photo precomp], ellipses 1–3 (Multiply), border (Multiply), adjustment layer, map (shown). Draw direction (measured on preview frames): the line starts at the top middle of the US near the Great Lakes, runs west along the northern border, down the west coast, east along the Gulf, up the east coast and back west along the top; in the result a short gap remains at the top centre: that is the last 2.1% of the path, not yet drawn at End 97.9% (shown; before Trim Paths, the stroke is continuous there). In the finished tour (recipe 16) the trim keys are moved so the outline draws as the camera arrives over North America (said; montage frames 58792–58816 show it a short piece and then nearly closed).
timing and easing: Trim Paths End 0% → 100% over about 1.33 s (32 frames) with a strong slow-in, slow-out: cubic bezier (0.88, 0.14, 0.12, 0.86) (shown). As an After Effects ease (inferred conversion): influence 88% on both keys, speed at each end about 0.16 × the average, peak in the middle about 7 × the average. The ovals do not animate.
variations: The stroke was tried at about 101 px and reduced (shown). The stroke was blue first and changed to yellow (shown). The ovals are one ellipse duplicated and rescaled per place (said).
pitfalls: Leave the shapes above the grey adjustment layer or they turn grey (shown). Use Multiply, not Normal, so the map's lines show through (shown).
build notes: Shape layer contents: "ADBE Vector Shape - Ellipse", "ADBE Vector Graphic - Fill" (Color 0.122, 0.788, 0.973), "ADBE Vector Graphic - Stroke" (Color 0.906, 0.757, 0.310, Stroke Width 51), "ADBE Vector Filter - Trim" (Start, End, Offset). layer.blendingMode = BlendingMode.MULTIPLY. The border path's vertices are hand-drawn round the scan's own coastline; by script, trace it from the map (or sample points along the scan's US border) — the shape follows the artwork. Ease by script: on a 0→100% End move over 1.33 s the average speed is about 75 %/s; KeyframeEase(12, 88) as the first key's out-ease and the last key's in-ease reproduces the curve (handles 0.88, 0.14 and 0.12, 0.86). KeyframeEase(0, 88) would give zero speed at the ends, i.e. (0.88, 0, 0.12, 1), a close but stronger approximation. Layer order: moveAfter/moveBefore relative to the adjustment layer.
unknowns: Each ellipse's drawn size and position in map pixels (only Scale 189% for the first is shown). The exact path vertices. Whether the ellipse had any feather (none visible). The other ovals' scale values. The exact key times (read ±1 frame). The extension's preset name and whether the curve is its default.

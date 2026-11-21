# Techniques from one video (15 recipes, all unproven)

Written by the channel learner from the video's narration and screen together, then checked against the video by a second reader. Every recipe here passed that check; none is in the plugin. `status: proven` means it was built in After Effects from the recipe alone, compared with the tutorial's own result, and accepted by Joe (0 of 15); `status: unproven` means it has not been.

Each step is marked `said` (narrated), `shown` (on screen; `fNNNNNN` is a frame in the local study folder, frame number divided by the video's frame rate is seconds) or `inferred` (our reading). The `source` and frame references are for checking and stay out of the plugin. Credits: `CREDITS.md`.

| # | Technique | Jobs | Check passed in round | Status |
|---|---|---|---|---|
| 01 | Two-colour phase bar that draws on segment after segment | lines and shapes; layout and repetition | 2 | unproven |
| 02 | Labels that rise out of their own bar segment | type; transitions | 2 | unproven |
| 03 | Step pictures that pop in one after another with a small bounce | energy and impact; layout and repetition | 2 | unproven |
| 04 | Small swept-head arrow that draws itself between steps | lines and shapes; layout and repetition | 3 | unproven |
| 05 | Stepped jitter and black-and-white photos for a hand-made finish | texture; energy and impact; glow and colour | 3 | unproven |
| 06 | Faint graph-paper backdrop | texture; layout and repetition | 3 | unproven |
| 07 | Bar chart of thick strokes that grow up in a ladder, with value labels sliding in beside them | lines and shapes; layout and repetition; type | 2 | unproven |
| 08 | Chart baseline that draws outward from its middle | lines and shapes | 2 | unproven |
| 09 | Faint grid held inside the chart's box, and the whole chart stepped to 12 fps | texture; layout and repetition; lines and shapes | 2 | unproven |
| 10 | Pie chart from one fat stroke, with the share pushed out | lines and shapes | 2 | unproven |
| 11 | Value label that rises in one word at a time | type | 2 | unproven |
| 12 | Photo pyramid that dips, then splits into tiers to reveal labels | depth and finish; energy and impact | 3 | unproven |
| 13 | Cut mid-move to a close-up, carried by a shared upward drift | transitions | 2 | unproven |
| 14 | Pinned instant photos swaying on a grey map | layout and repetition; depth and finish; texture; B-roll scenes | 3 | unproven |
| 15 | Ink-blend place highlights and a self-drawing border on a grey map | lines and shapes; glow and colour; texture; B-roll scenes | 2 | unproven |

## Two-colour phase bar that draws on segment after segment
id: 01-segmented-progress-bar-draws-in-order
status: unproven
source: nHh0NRo8G2U 43–396 s
jobs: lines and shapes; layout and repetition
what it does for a beat: A process or timeline beat ("first this phase, then that one"): one straight bar split into coloured phases that fill left to right, the second phase starting just as the first slows down, with step pictures lined up underneath.
what it looks like: On a black frame, a thick horizontal bar across the middle 62 % of the width, about seven tenths lime green and the rest pale sky blue, split by a hairline gap. A short white bold label sits above the start of each segment and six cut-out step pictures sit in a row under the bar. The green fills from the left in one second, and the blue continues from the gap.
ingredients:
- Shape layer drawn with the Pen tool (an open two-point path with a stroke, no fill) — built-in
- Trim Paths (shape layer Contents > Add > Trim Paths; menu path inferred, "Trim Paths 1" under the layer's Contents shown f002750) — built-in
- Text layers (Satoshi Black, a free font) — built-in text; font shown f004936
- Six cut-out PNG step pictures (art, not technique)
- Flow (keyframe-easing extension) — paid; only used to apply an S-curve ease, given below as numbers
steps:
1. Comp: 1920 x 1080, black background. The narrator says 24 fps; the project panel shows 23.976 for every comp, so build at 23.976 (the screen wins). The project is 16 bpc. (said 1920 x 1080; shown f001926 for 23.976 and 16 bpc, also f007908; black background shown f012940; background colour setting inferred)
2. With the Pen tool, no fill and a stroke, click two points with Shift held to make a straight horizontal line, then centre the layer in the comp. (said; shown f001926)
   - Fill: none (shown f001926)
   - Stroke width: 54 px while drawing (shown f001926), later 60 px (shown f007908, Properties panel "Stroke Width 60"). Use 60.
   - Stroke colour: #BFF06C (shown f007908, the colour dialog opened on the duplicate before it was recoloured, H 82 S 55 B 94)
   - Layer Position 960, 540; Anchor Point 9.1, 0.8 (shown f007908 and f008214)
   - Path ends at about x 365 and x 1556 in comp pixels (1191 px long, butt caps), centred on y 540 (measured on the result frame; endpoint positions not shown as numbers)
3. Add Trim Paths to the line. Set the first segment: Start 0 %, End 70 %. (said "trim paths"; values: Start 0 shown f003931, End 70 % shown f012169)
4. Duplicate the layer. On the copy's Trim Paths set Start 71 %, End 100 %, so a 1 % gap separates the two segments. (duplicate said; Start 71.0 % shown f007714; End 100 % shown f012169)
   - The author tried 20/25, 22/74, 80/81 and 68/69 before landing on 70/71 (shown f002750–f007551). The gap is always 1–5 % of the whole line, so spacing stays even because it is a share of one path. (said)
5. Recolour the copy pale blue. (said "bluish"; shown f007908–f007986 as the dialog moves through teal values)
   - Typed value: not legible; the dialog's last visible value is #60BFAD and the video then cuts. The rendered bar measures RGB 143, 211, 224 (#8FD3E0) on the result frame; use that as the target. (measured; typed value unknown)
6. Add two labels above the segments: Satoshi, Black weight, 40.9 px, tracking −95, fill #F3F3F3, left aligned, anchor at 0,0. (font said as "otoshi", screen reads Satoshi: shown f004936; fill F3F3F3 shown f004523; left alignment said)
   - Label 1 position 366.6, 493 (shown f004936); label 2 position 1212.1, 493 (shown f011881) — each starts a few pixels right of its segment's left end, baseline 15 px above the bar.
7. Import six cut-out PNG step pictures, scale each so they look the same size (their sources differ in size), and line them up in a row under the bar, numbered left to right; the last two sit under the blue segment. (said; shown f011425)
   - Scales used: 26, 14, 7, 7, 8, 7 % for pictures 1–6 (shown f011425); these depend only on the source images' sizes, so aim for the sizes in `layout`, not the percentages.
   - The 70/71 split was chosen after the pictures were placed, so the gap falls between picture 4 and picture 5. (said; shown f007504)
8. Animate the first segment: keyframe Trim Paths End 0 % at frame 0 and 70 % at frame 24 (1 s). (said "about one second"; keys shown f012940 crop scratch/03/tl12940_right.png)
9. Animate the second segment: keyframe its End 71 % (equal to its Start, so nothing shows) to 100 %, over 24 frames. (71 said and shown f012940 at time 0; 100 % shown f012169)
10. Ease all four keys with an S-curve: cubic-bezier 0.88, 0.14, 0.12, 0.86 (a saved curve in Flow). (ease said by its preset name; the numbers shown f012940, scratch/03/flow12940.png)
    - In After Effects terms (converted, inferred): every key Influence 88 %; speed at each key = 0.159 x the average speed of the move. First segment: speed 11.1 %/s at both keys; second segment: 4.6 %/s.
11. Slide the second segment's two keys earlier so it starts as the first is slowing: first segment 0–24 f, second segment 20–44 f. (said "as soon as it starts to slow"; frames read from key positions f012940, ±1 frame)
layout: Measured on the settled result frame (cut at 540.15 s, comp 1920 x 1080, calibrated on the picture's own borders: 1804 x 1015 px in the recording = 1920 x 1080). measured: the bar runs from x 365 to x 1556 (19.0 % to 81.0 % of the width, 62 % of the width long), centred on y 540 (50 %), thickness 61 px (5.7 % of the height). Green segment 365–1199.5 (70 % of the bar); gap 10.6 px; blue 1210–1556. Labels: baseline y 494 (45.7 % of the height), cap-plus-ascender height 31–33 px (about 3 % of the height), the longer word 180 px wide (9.4 % of the width); bottom of the labels 15 px above the bar's top edge. Step pictures: six in a row, centres at 22.9, 33.1, 43.7, 55.9, 67.4 and 78.0 % of the width, centred about y 675–684 (62.5–63.3 % of the height); heights 103–144 px (9.6–13.3 % of the height), widths 85–160 px; their tops 32–60 px below the bar's bottom edge; the row starts 15 px inside the bar's left end and ends 16 px inside its right end. Background pure black (0, 0, 0), no grain, no vignette, no shadows except a soft dark shadow baked into one picture's PNG (a packaging cut-out). Colours: green renders 188, 237, 101; blue renders 143, 211, 224; labels near white. The labels' slide-up comes from recipe 02 (they rise 61 px from behind their segment, inverted track matte, keys 10–22 f and 32–44 f, ease cubic-bezier 0.04, 0.47, 0.53, 0.93). The pictures' pop comes from recipe 03 (scale 0 to full over 12 frames, same S-curve as here, a bounce expression with about 2.5 % overshoot, starting at 22 f and every 10 frames after). For this recipe alone, the labels and pictures simply sit at their final positions. Motion: both segments fill from their left end towards the right. The green's leading edge (with picture lag, ±1 frame) is at x 370 at frame 1, 547 at frame 10, 947 at frame 13 (70 % of its run; frame 12, the half-way point, is a dropped recording frame), 1164 at frame 20 (95 %); the blue appears at frame 20 and reaches the bar's right end by about frame 43.
timing and easing: Segment 1 Trim End 0→70 % at 0–24 f; segment 2 Trim End 71→100 % at 20–44 f (24 f each, 4 frames overlap). Ease cubic-bezier(0.88, 0.14, 0.12, 0.86) on all keys: a strong S, the middle about 7 times the average speed. Measured play: about real time (the step pictures start 10 recording frames apart for keys 10 comp frames apart). Motion blur off: the motion-blur switch column is empty for every layer (shown f012940).
variations: One long segment is fine; any number of segments by duplicating and setting Start/End percentages with a small gap; labels may sit above the bar or inside it. (said)
pitfalls: Key the second segment's End from its own Start value (71), not from 0, or it draws in behind the first segment. (said)
longest on: Splitting the single line into segments with Trim Paths percentages and choosing the gap (about 107 s across 98–176 s and 293–322 s), more than placing the pictures (about 75 s) or keyframing the draw-on (about 63 s).
build notes: Shape layer contents: "ADBE Vector Group" > "ADBE Vector Shape - Group" (path with two vertices), "ADBE Vector Graphic - Stroke" (Stroke Width 60, Line Cap butt), then "ADBE Vector Filter - Trim" at the layer's Contents level (Start "ADBE Vector Trim Start", End "ADBE Vector Trim End"). Ease by script: `prop.setTemporalEaseAtKey(k, [new KeyframeEase(speed, 88)], [new KeyframeEase(speed, 88)])` with the speeds in step 10. Text: font PostScript name for Satoshi Black is likely "Satoshi-Black" (inferred); tracking −95, fontSize 40.9, justification LEFT_JUSTIFY. The pictures are any six cut-out PNGs of a process; scale each to the measured heights.
result: start=536.2 end=540.2 animated crop=1188,194,1804,1015 frame=f012950 (not a kept frame: cut from source.mp4 at 540.15 s, saved as scratch/03/result_540.15.png; clean, all elements settled). The playback shows the finished comp with recipes 02 and 03 applied; for this recipe compare the bar and the static layout. The comp time display runs 0:00:00:07 at 536.7 s, 0:00:01:17 at 537.9 s, 0:00:02:20 at 539.2 s and holds at 0:00:04:00 from about 540.4 s (it lags the picture by 3–5 frames). Selection outlines appear on the bars from 540.3 to 541.0 s, so end the window at 540.2.
before: f001926 (the bare straight line before splitting)
unknowns: The blue's typed colour value (only its render is measured). The comp's background colour setting and duration (the ruler runs to about 15 s; preview stops at 4:00, work area inferred). The exact path vertex coordinates (only their rendered ends are measured).

## Labels that rise out of their own bar segment
id: 02-labels-rise-from-behind-the-bar
status: unproven
source: nHh0NRo8G2U 396–464 s
jobs: type; transitions
what it does for a beat: Names each phase of a progress bar as that phase fills: the word slides up out of the bar as if it was tucked behind it, timed to its segment.
what it looks like: Above a thick two-colour bar on black, a white bold word pops up out of the green segment's top edge and settles just above it; about a second later a second word rises out of the blue segment the same way. Nothing of either word shows inside the bar.
ingredients:
- Text layers — built-in
- Track matte, Alpha Inverted, set to the bar segment's shape layer (the Track Matte column's pick whip / menu, invert switch) — built-in; shown f012940
- Flow (keyframe-easing extension) — paid; only used to apply an ease, given below as numbers
- The segmented bar from recipe 01 (figures below so this stands alone)
steps:
1. Start from the phase bar (recipe 01): 1920 x 1080 comp at 23.976 fps, black. One straight 60 px stroke from x 365 to x 1556 at y 540, duplicated: copy A Trim Paths Start 0 / End 70 % in #BFF06C, End keyed 0→70 % over frames 0–24; copy B Start 71 / End 100 % in a pale blue rendering #8FD3E0, End keyed 71→100 % over frames 20–44; all keys eased cubic-bezier 0.88, 0.14, 0.12, 0.86 (After Effects: Influence 88 %, speed 0.159 x the average speed). (from recipe 01, where each value is cited)
2. Labels (recipe 01): Satoshi Black 40.9 px, tracking −95, fill #F3F3F3, left aligned, anchor 0,0. Label A over copy A at final position 366.6, 493; label B over copy B at 1212.1, 493. (shown f004936, f011881)
3. On each label key Position: final value at a later key, and 12 frames earlier the same x with y 554, i.e. 61 px lower, which puts the whole word inside the bar. (12 frames said; 554 shown f012940 at time 0; 493 shown f011881)
   - The author first keyed 2:12 → 3:00 (shown f010116), then moved the keys during staggering (step 6).
4. Ease both keys of each label with cubic-bezier 0.04, 0.47, 0.53, 0.93 (a saved "fast in" curve in Flow: very fast start, long slow settle). (said as "fast end" preset, the screen shows "Fast In" and the numbers: shown f010116, scratch/02/fastin.png)
   - In After Effects terms (converted, inferred): outgoing key Influence 4 %, speed 11.75 x the average (about 1430 px/s for a 61 px move in 12 frames); incoming key Influence 47 %, speed 0.149 x the average (about 18 px/s).
5. Set each label's track matte to its own segment layer (label A → copy A, label B → copy B) and switch the matte to inverted, so the word is hidden wherever the bar is drawn. Turn the segment layers' visibility back on, since assigning a matte hides them. (said; matte assignment by pick whip shown f010621; both labels on "Alpha Inverted" with the invert switch lit shown f012940, scratch/02/matte12940.png)
6. Trim each label's in-point to its first key, then slide the labels in time so each rises as its segment fills: label A keys at frames 10–22 (in-point 10), label B keys at 32–44 (in-point 32). (trim said; frames read from key positions and layer bars f012940, ±1 frame)
layout: Measured on the settled result frame (cut at 540.15 s; comp 1920 x 1080 calibrated on the picture's borders, 1804 x 1015 px in the recording). measured: bar from x 365 to 1556 (19–81 % of the width) at y 509–570 (thickness 5.7 % of the height); label baselines at y 494 (45.7 % of the height), 15 px above the bar's top edge; cap-plus-ascender height about 31–33 px (3 % of the height); label A 180 px wide starting at x 369, label B 177 px wide starting at x 1213 (each about 4 px right of its segment's left end). The rise (61 px, 5.6 % of the height) equals the bar's thickness, so at the first key the word's top (y about 523) is inside the bar and the word is fully masked. The rest of the picture (six cut-out step pictures in a row below the bar, centres at 22.9–78.0 % of the width, about 63 % of the height, 9.6–13.3 % of the height tall) belongs to recipes 01 and 03; it does not affect this effect. Background pure black. Motion, measured on played frames (comp frame = recording frame − 12855, ±1): label A starts to show at frame 11, one frame after its first key, as a sliver along the bar's top edge (top y 504) as soon as its top clears the bar; its top is at y 490 at frame 13, then 484 at 14, 476 at 16, 469 at 18, 465 at 20, 462 at 22 and holds; it is cut off along the bar's top edge (y about 506) while rising. Label B first shows at frame 34 (top 496) and settles at 463 by frame 43. Both rise straight up, no horizontal drift, no fade. Over the green's fill, label A appears when the green front is near x 950 (half its run) and label B when the blue front is past the word.
timing and easing: Label A Position y 554→493 at frames 10–22; label B the same at frames 32–44 (12 frames each, 22 frames apart). Ease cubic-bezier(0.04, 0.47, 0.53, 0.93): about 55 % of the rise in the first 3 frames, the rest settling. The bar segments draw at 0–24 f and 20–44 f. Motion blur off: the switch column is empty on both labels and both bar layers (shown f012940).
variations: Instead of a matte, the labels can sit underneath the bar layers in the stack so the bar covers them. (said)
pitfalls: Without the invert the word shows only inside the bar, the reverse of what is wanted. (said)
longest on: Keyframing and easing the rise (about 34 s, 396–430 s), more than the inverted matte (about 22 s) or the stagger (about 12 s).
build notes: `textLayer.setTrackMatte(segmentLayer, TrackMatteType.ALPHA_INVERTED)` (After Effects 2023 and later; it leaves the matte layer visible, which is what is wanted). In older versions place the label directly under a duplicate of the segment and set trackMatteType = ALPHA_INVERTED. Position is spatial: one KeyframeEase per key side, e.g. out `[new KeyframeEase(1430, 4)]` on the first key, in `[new KeyframeEase(18, 47)]` on the second; set the layer's inPoint to the first key time. Since the matte is the trimmed stroke, the mask grows with the fill: a word over a part of its segment not yet drawn would show early, so time each label after its segment's front has passed the word.
result: start=536.2 end=540.2 animated crop=1188,194,1804,1015 frame=f012950 (not a kept frame: cut from source.mp4 at 540.15 s, saved as scratch/03/result_540.15.png; clean). The rise itself plays 536.6–537.1 s (label A) and 537.5–538.0 s (label B). The comp time display runs 0:00:00:07 at 536.7 s, 0:00:01:17 at 537.9 s and holds 0:00:04:00 from about 540.4 s; the viewer redraws every recording frame. This is the build shown in the steps, with recipe 03's step pictures also animating.
before: f010116 (labels sitting inside the bar at the first key, before the matte)
unknowns: Whether After Effects' own ease would be re-tuned by Flow for a spatial property (the conversion in step 4 is inferred).

## Step pictures that pop in one after another with a small bounce
id: 03-step-icons-pop-with-bounce-in-sequence
status: unproven
source: nHh0NRo8G2U 464–547 s
jobs: energy and impact; layout and repetition
what it does for a beat: Brings in a row of step pictures under a timeline one by one, each growing from nothing with a slight overshoot and settle, so the eye walks the process left to right.
what it looks like: Under a lime-and-blue phase bar on black, six cut-out pictures of a process appear left to right, each growing from a point at its centre to full size in half a second, swelling a few percent past full size and settling back.
ingredients:
- Scale keyframes on each picture layer — built-in
- An "inertial bounce" expression on Scale (a widely shared expression; only its first two lines are on screen) — built-in expressions
- Flow (keyframe-easing extension) — paid; only used to apply the ease, given below as numbers
- Motion Tools (free extension), Sequence with offset — only used to stagger; given below as frame offsets
- Six cut-out PNG step pictures (art, not technique)
steps:
1. Start from the phase-bar layout (recipe 01): 1920 x 1080 comp at 23.976 fps (narrator says 24; screen shows 23.976, f001926), black. A 60 px stroke from x 365 to 1556 at y 540, split by Trim Paths into a lime segment (#BFF06C, 0–70 %) and a pale blue one (renders #8FD3E0, 71–100 %), drawing on at frames 0–24 and 20–44. Two white labels rise above the segments (recipe 02, frames 10–22 and 32–44). (from recipes 01 and 02, where each value is cited)
2. Place six cut-out pictures in a row under the bar, each scaled so they look alike in size, anchor at the picture's centre (default). (said in recipe 01's span; scales 26, 14, 7, 7, 8, 7 % shown f011425; centre anchor inferred from the measured growth staying centred)
3. Select all six, key Scale at their full size, and 12 frames earlier key Scale 0 %. (said "12 frame animation"; 0 % shown f012940; full values shown f011425)
4. Ease all Scale keys with cubic-bezier 0.88, 0.14, 0.12, 0.86 (the same S-curve as the bar). (said by its preset name; numbers shown f012940, scratch/03/flow12940.png)
   - In After Effects terms (converted, inferred): Influence 88 % on both keys, speed 0.159 x the average speed, i.e. 0.159 x (full scale ÷ 0.5 s). For a picture at 26 %: 8.3 %/s; at 7 %: 2.2 %/s.
5. Alt/Option-click Scale's stopwatch on one picture and paste the bounce expression; then right-click Scale > Copy Expression Only and paste it onto the other five. (said; the expression's first lines shown f012169 and f012940; that all six bounce is shown by the played frames, see layout)
   - Shown lines: `amp = .1;` and `freq = 2.0;` (shown f012940)
   - The rest is not on screen. The standard form of this expression, consistent with the measured bounce (inferred, decay 2.0 inferred from the measured overshoot ratio):
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
6. Stagger the six so the leftmost starts first and each next one 10 frames later (Motion Tools: offset 10, step 1, Sequence with the top layer first), then slide the whole group earlier. (offset 10 said and shown f012546; f012474 still shows 1 with the cursor in the field; order said)
   - Resulting keys: picture 1 frames 22–34, picture 2 32–44, picture 3 42–54, picture 4 52–64, picture 5 62–74, picture 6 72–84. (read from key positions f012940, scratch/03/tl12940_right.png, ±1 frame)
layout: Measured on the settled result frame (cut at 540.15 s; comp 1920 x 1080 calibrated on the picture's borders, 1804 x 1015 px in the recording). measured: six pictures with centres at x 440, 635, 838, 1074, 1294, 1497 (22.9, 33.1, 43.7, 55.9, 67.4, 78.0 % of the width), centred about y 673–684 (62.5–63.3 % of the height); heights 131, 103, 144, 139, 129, 134 px (9.6–13.3 % of the height), widths 119, 104, 93, 160, 128, 85 px; their tops 32–60 px below the bar's bottom edge (y 570). The row spans x 380–1540, just inside the bar's ends (365–1556); the last two sit under the blue segment. The bar (thickness 5.7 % of the height, 62 % of the width, centred) and the two labels (baselines at 45.7 % of the height, about 3 % of the height tall) come from recipes 01 and 02. Background pure black; the only shadow is one baked into a packaging cut-out's PNG. Motion, measured on played frames (comp frame = recording frame − 12855, ±1; the preview plays at about real time, the pictures starting 10 recording frames apart): each picture grows about its own centre (picture 3's centre holds within 3 px at x 835–838, y 674–676). Growth for picture 1: 3 % of its height at 2 frames in, 20 % at 5, 49 % at 6, 77 % at 7, 87 % at 8, 92 % at 9, 98 % at 11, 100 % at 12. Bounce: peak overshoot about +2.5 % of the final size (picture 3: 148 against 144 px; picture 4: 164 against 160 px wide; picture 6: 137 against 134 px tall) 1–3 frames after the last key; an undershoot of about −1.5 % around 7 frames after; a second swell of about +1 % around 12–14 frames after; settled within about 16 frames. The period (about 12 frames, 0.5 s) matches freq 2. The overshoot is proportional to the speed at the last key: with this ease that speed is only 0.159 of the average, which is why the bounce is small; a different ease changes it (predicted from the expression with decay 2: +2.5 %, −1.5 %, +0.9 % at 3, 9 and 15 frames, matching the measurement).
timing and easing: Scale 0 → full over 12 frames per picture, pictures 10 frames apart, first at frame 22 (as the lime segment finishes at 24), last settled by about frame 100. Ease cubic-bezier(0.88, 0.14, 0.12, 0.86) plus the bounce expression (amp 0.1, freq 2, decay 2 inferred). Motion blur off: the switch column is empty for all six picture layers (shown f012940).
variations: none given
pitfalls: Sequence direction matters: the layer order sets which picture comes first, so put the first step on top. (said)
longest on: The bounce expression: introducing it and pasting it to all layers (about 29 s, 484–513 s), more than the scale keys and ease (about 20 s) or the stagger (about 20 s).
build notes: Scale keys by script: `scale.setValueAtTime(t0, [0,0,0]); scale.setValueAtTime(t0 + 12*fd, [s,s,100])` (2D layers still take three values); ease with `scale.setTemporalEaseAtKey(k, [e,e,e], [e,e,e])` where `e = new KeyframeEase(0.159*s/0.5005, 88)` (one ease per dimension). Set `scale.expression` to the text in step 5. Stagger by adding 10 frames × index to each layer's key times (Motion Tools not needed). The pictures are any six cut-out PNGs of a process, scaled to the measured heights.
result: start=536.2 end=540.2 animated crop=1188,194,1804,1015 frame=f012950 (not a kept frame: cut from source.mp4 at 540.15 s, saved as scratch/03/result_540.15.png; clean, all pictures settled). The pops play 537.1–540.2 s. The comp time display runs 0:00:00:07 at 536.7 s, 0:00:01:17 at 537.9 s, 0:00:02:20 at 539.2 s and holds 0:00:04:00 from about 540.4 s (3–5 frames behind the picture). Selection outlines cover the bars 540.3–541.0 s. This is the build from the steps (with recipes 01 and 02 playing too), not a separate finished file.
before: f011881 (bar and labels done, pictures at scale 0)
unknowns: The expression's lines after `freq = 2.0;` (form and decay 2.0 inferred from the measured overshoot). The pictures' exact positions as typed values (only measured).

## Small swept-head arrow that draws itself between steps
id: 04-curved-arrow-draws-between-steps
status: unproven
source: nHh0NRo8G2U 547–705 s
jobs: lines and shapes; layout and repetition
what it does for a beat: Ties a row of step images into a process: a tiny arrow draws itself between each pair just as the next step appears, so the eye is led left to right one step at a time.
what it looks like: On a black ground, a row of six cut-out photos sits under a two-colour phase bar; between each pair a small thin white arrow (a straight shaft and a two-barb head whose barbs curl outward) draws on, shaft first, then the head flicks out from the tip. Five identical arrows appear one after another as the images pop in.
ingredients:
- Shape layers drawn with the Pen tool (stroke only, no fill) — built-in
- Trim Paths (shape layer Add > Trim Paths) — built-in
- A keyframe-easing panel extension used to apply a saved cubic curve — paid (any way of setting the same bezier ease works; see timing)
- Pre-compose and Duplicate — built-in
steps:
1. With no layer selected (inferred for the shaft; said only for the head), pick the Pen tool and set fill to none and a white stroke (shown f013418; white swatch, matching the white labels — said). Zoom the viewer to 400 % to draw (said "four"; shown f013756 reads 400%).
   - Stroke width: 5 px first (said; f013418 shows 5 being typed into the toolbar field), then lowered to 3 px (said; shown f013642 toolbar "3 px")
2. Draw the shaft: click once at the left, Shift-click to the right to make a straight horizontal line, in the gap between the first two images (said; shown f013756). This makes its own shape layer.
   - Shaft length: about 40 px in a 1920×1080 comp (measured on the result, 45 screen px at 1.127 px per comp px; 2.1 % of the picture width)
3. Deselect, and draw the head as two more separate shape layers, one upper barb and one lower barb, each a two-point path that starts at the shaft's right end (the tip) and is bent by dragging a handle so it curls (said: a bent arrow; shown f014210, second barb being drawn with handles out). The arrow is then three shape layers (shown f014695 layer list).
   - Barb shape on the result: each leaves the tip at about 45° back from the shaft and curls outward so its free end points nearly straight up (upper) or down (lower); each spans about 13 px back and 13 px out from the tip; the whole head is about 26 px tall (measured, scratch/04/arrow1_zoom.png)
   - Stroke on every part: white, 3 px, butt cap, miter join, fill none (shown f015575, Properties panel of a barb layer)
4. On the shaft layer add Trim Paths and key Start from 100 % to 0 % over 12 frames (said; shown f014695 Start 100 % at 0:00:04:00 with nothing drawn; f014825 the full shaft at 0:00:04:12). Because the shaft was drawn left to right, this grows the shaft from the tip backwards towards the tail (shown on the played result, scratch/04/zoomdraw.png: the line starts as a dot at the tip end and lengthens leftward).
   - Ease both keys with the cubic curve 0.88, 0.14, 0.12, 0.86 (shown f013418/f015575: the easing panel's curve readout; applied as "add the saved curve" — said). In After Effects terms (inferred, converted from the curve): influence 88 % on both keys, and speed at each key 0.14 ÷ 0.88 ≈ 0.16 times the average rate, not zero — for the shaft's 100 % in 12 frames that is about 32 %/s at each key. A sharp ease-in-out that still creeps at the ends; most of the move happens in the middle third
5. On each barb layer add Trim Paths and key End from 0 % to 100 %, starting about one frame after the shaft starts and lasting about 13 frames; ease with the same curve (said: key End, move forward, add the same curve; shown f015575 two End keys on a barb, End reads 100 % after them; the 0 % start value is inferred from the played frames, where each barb grows from the tip outward, scratch/04/barbs.png). The narration and the picture disagree here: the words read as End being keyed down to zero a little later, and the head's first click as being at a barb's free end; the played frames show each barb growing out from the tip, so the picture wins — key End 0 → 100 on a path whose first vertex is the tip. Copy the Trim Paths from the first barb to the second so both open together (said).
   - Final key times inside the arrow's own timeline (measured on the timeline, f016079, ±1 frame): shaft Start 100→0 at frames 35→47; both barbs End 0→100 at frames 36→49
   - The author first keyed the head about 6 frames after the shaft start, then dragged it earlier "to be snappier" and then slid all keys to just before the second image's pop (said; shown f015575 versus f016079)
6. Select the three arrow layers and pre-compose them into one arrow comp (said; shown f016854: the project holds a new arrow comp and the three shape layers are gone from the main comp).
7. Duplicate the arrow precomp four times (five in all), move each copy right with Shift + arrow keys to sit in the next gap, and slide each copy later in time so it draws as the image it points to pops in (said; shown f016854: five arrow precomp layers, staggered in-points).
   - In-point offsets of the five copies, left to right (measured on f016854's timeline at 7.0 px per frame, ±1 frame): 0, 8, 17, 29, 39 frames
   - So the arrows draw at about frames 35, 43, 52, 64 and 74 of the main comp (inferred from the offsets plus step 5's keys), each starting within a few frames of the pop of the image to its right (shown on the played result, scratch/04/m1.png)
layout: Measured on the clean result frame (f016906, crop below; comp calibrated on the black picture's own edges: 2164×1216 screen px for 1920×1080, 1.127 px per comp px). Five arrows, all the same size: length about 40 px (2.1 % of the width), head about 26 px tall (2.4 % of the height), stroke about 3.5 px rendered (3 px set), plain white (renders about 215 grey at its thin core, no glow, no shadow). All sit on one horizontal line at 63 % of the picture height (comp y about 682), the line of the image centres. Arrow centres at 28.2 %, 38.6 %, 49.0 %, 61.9 % and 73.0 % of the width — each centred in the gap between two neighbouring images, so the spacing is uneven (200, 199, 249, 213 px) because the images are unevenly spaced. Each image is roughly 100 px across (about 5 % of the width); arrows leave a clear margin of roughly 25–40 px to each image. Background flat black; nothing else in the comp affects the arrows. The phase bar, its labels and the images' pop are made outside this recipe; only the arrows are this recipe's. What the result shows of them (measured on the same crop): the bar runs from 47.4 % to 52.8 % of the height (about 5.5 % thick, centred at 50 %, so its centre is 13 % of the height above the arrows' row), lime (renders about 187, 236, 101) from 19.1 % to 62.5 % of the width and pale blue (renders about 144, 211, 223) from 63.1 % to 81.0 %, with a thin black gap between (colour warning: these two are recording colours, and a wide-gamut screen recording shows mid-tone greens and blues more saturated than the render; the lime's typed value, #BFF06C according to the check of the bar's own recipe, not shown in this window, comes through almost unchanged, while the pale blue's typed value was never shown, so treat its reading as approximate and match lightness rather than hue). Above it sit two one-word white labels in a bold sans, each left-aligned with its segment's left edge, about 3.0 % of the height tall (cap top to baseline) with their tops at 42.8 %.
  Motion: each arrow draws left-to-right in reading order of the row, but each arrow itself grows from its tip backwards (shaft) and then its head opens from the tip outward (barbs); the shaft takes 12 frames and the head 13, overlapping almost entirely, with a sharp ease so each part creeps at both ends (about a sixth of its average speed) and snaps through the middle. No motion blur.
timing and easing: Shaft Trim Start 100→0 % over 12 frames; barb Trim End 0→100 % over 13 frames starting 1 frame after the shaft; cubic ease 0.88, 0.14, 0.12, 0.86 on all keys (inferred conversion: 88 % influence each side, speed ≈ 0.16 × the average rate — about 32 %/s for the shaft, 29 %/s for the barbs). Copies offset 0, 8, 17, 29, 39 frames. Comp 23.976 fps on screen (the narrator calls it 24).
variations: The shaft can be drawn to grow either way (the author picks one, said); the head can be straight barbs (click with Shift for straight) instead of curled ones (said). Copies can be placed wherever a new element appears (said).
pitfalls: Draw the head with nothing selected so each barb is its own path/layer (said). Keep the stroke thin (3 px) so the arrow does not look heavy (said).
longest on: Animating the head's Trim Paths and lining its keys up with the shaft's (about 43 s, 617–660 s), then the duplicating and timing of the copies (about 33 s, 672–705 s); drawing the shaft and head took about 48 s together.
build notes: Three shape layers each with one Path, one Stroke ("ADBE Vector Graphic - Stroke", width 3, colour white, Line Cap Butt, Line Join Miter) and one Trim Paths ("ADBE Vector Filter - Trim"); shaft path vertices (−20, 0) → (20, 0); barbs from (20, 0) with a curved handle to about (7, −13) and (7, 13) (inferred from the measured shape). Set ease (inferred conversion of the shown curve) with KeyframeEase(speed, 88) on both sides of each key, speed = 0.159 × 100 % ÷ the move's duration in seconds: about 31.8 for the shaft (12 frames) and 29.3 for the barbs (13 frames). KeyframeEase(0, 88) would give a harder ease than the one shown. Pre-compose the three layers at comp size, duplicate the precomp and set each copy's startTime to 0, 8, 17, 29, 39 frames and its position to the gap centres. In a later step of this video the background turns pale (06) and the arrows, still white, disappear there — change their stroke to the label colour if you use a pale ground.
result: start=700.5 end=705.29 animated crop=1424,153,2164,1216 frame=f016906 (cut from source.mp4 at 705.13 s: scratch/04/f016906.png; crop alone in scratch/04/result_crop_705.13.png). The preview plays at about real time (the viewer's time display runs 0:00:01:12 to 0:00:03:08 between 700.5 and 702.5 s and the viewer redraws every frame); all five arrows have drawn by about 703 s and the picture then holds. A mouse arrow and a thin grey line pass through the crop between about 703.5 and 704.9 s; 705.00–705.29 s is clean and still.
before: f013418 (the step row with no arrow yet; viewer at 200 %)
unknowns: The barbs' exact vertex and handle positions (only their drawn result is measured); the arrow precomp's size and duration (it keeps the comp's 23.976 fps, shown in the project panel f016854); the exact first value of the barbs' End key (0 % inferred from the played draw); the exact image-pop frames each copy was aligned to (aligned by eye).

## Stepped jitter and black-and-white photos for a hand-made finish
id: 05-stop-motion-jitter-and-mono-finish
status: unproven
source: nHh0NRo8G2U 705–804 s
jobs: texture; energy and impact; glow and colour
what it does for a beat: Takes a clean, flat infographic and gives it a cut-out, stop-motion feel: photos go monochrome, each one twitches on its own a few times a second, the whole frame shakes slightly and all motion steps at a low frame rate. Reach for it when a data beat looks too slick or digital.
what it looks like: The same infographic (a lime and pale-blue phase bar with labels, six cut-out photos below joined by small white arrows, on black) now has grey photos while the bar keeps its colour; every few frames each photo hops a few pixels in a random direction, independently of the others, and the whole picture hops a few pixels together at the same moments; the bar's draw and the photos' pops step rather than glide.
ingredients:
- Pre-compose — built-in (Layer > Pre-compose; menu not shown)
- Adjustment layer — built-in (Layer > New > Adjustment Layer, shortcut said as Option+Command+Y)
- Hue/Saturation — stock (Effect > Color Correction > Hue/Saturation; added through a search panel, f017362)
- Expressions posterizeTime() and wiggle() on Position — built-in
- Posterize Time — stock (Effect > Time > Posterize Time)
- Transform — stock (Effect > Distort > Transform)
steps:
1. Select all six photo layers and pre-compose them into one photo precomp (said; shown f017362: the precomp holds the six photo layers, which still carry their pop-in animation).
2. Inside the photo precomp add an adjustment layer at the top and put Hue/Saturation on it (said; shown f017393).
   - Channel Control: Master (shown f017414)
   - Master Saturation: −100 (shown f017414)
   - Master Hue 0, Master Lightness 0, Colorize off (shown f017414)
   - The author tries Tritone on the same layer as an alternative (sepia or a project colour; said; shown f017640 with Highlights white, Midtones brown, Shadows black) but keeps plain black and white: by f018126 the photos render grey with no tint (shown). Tritone is not part of the result.
3. On one photo layer, Option/Alt-click Position's stopwatch and type this expression (said; shown f018163, full-size crop scratch/05/expr.png):
   ```
   posterizeTime(6)
   wiggle(222,3)
   ```
   - The narration's "222 comma three" is the screen's wiggle(222,3): frequency 222 per second, amplitude 3 px. With posterizeTime(6) the expression is only evaluated 6 times a second, and at 222 Hz each evaluation lands on an unrelated random offset, so the photo jumps to a new spot within about ±3 px every 4 frames (inferred from the expression; confirmed by measurement below)
4. Copy the expression only and paste it on Position of every photo layer (said: right-click > Copy Expression Only, paste onto all; the paste on the other five layers is not shown, but the result shows each photo moving on its own, measured below).
5. Back in the main comp, add an adjustment layer at the top with Posterize Time (said; shown f018658).
   - Frame Rate: 12.0 (shown f018658, full-size crop scratch/05/post12.png; the field read 24.0 before, f018610)
6. Add a second adjustment layer with the Transform effect for a whole-frame jitter (said; shown f018865). In the timeline it sits second from the top, below the Posterize Time layer (shown f018937).
   - Scale: 101.0, Uniform Scale on (shown f018865)
   - Anchor Point 960, 540; Skew 0; Rotation 0; Opacity 100; Use Composition's Shutter Angle on; Shutter Angle 0; Sampling Bilinear — all left at default (shown f018865)
   - Position: Option/Alt-click and enter the same expression as the photos (said); the screen shows posterizeTime(6) on line 1 and wiggle(222 being typed on line 2 when the video cuts (shown, cut frame f018987: scratch/05/transform_expr_f018987.png); the closing ",3)" is inferred from the words "the same expression" and from the readouts that follow, Position 959.6, 539.8 (f019000) and 957.6, 539.3 (timeline note at 13:24), both within 3 px of 960, 540
7. Play it back (shown f019182 onwards).
layout: Measured on the clean result frame f019120 (cut from source.mp4 at 797.46 s; crop scratch/05/result_crop_p060.png), calibrated on the black picture's own edges: 1804×1014 screen px for 1920×1080 (0.940 px per comp px). The photos are about 100 px across (about 5 % of the width, the bowl measured at 94 screen px), centred on a row at about 63 % of the picture height; the rest of the picture is made outside this recipe but is part of the result, so here are its figures, measured on the same crop: the phase bar runs from 47.5 % to 53.0 % of the height (5.5 % thick), lime (renders about 187, 236, 101) from 19.0 % to 62.6 % of the width and pale blue (renders about 145, 211, 223) from 63.2 % to 81.3 %, with a thin black gap between (colour warning: these two are recording colours, and a wide-gamut screen recording shows mid-tone greens and blues more saturated than the render; the lime's typed value, #BFF06C according to the check of the bar's own recipe, not shown in this window, comes through almost unchanged, while the pale blue's typed value was never shown, so treat its reading as approximate and match lightness rather than hue); two one-word white labels in a bold sans sit above it, each left-aligned with its segment, about 3.0 % of the height tall with their tops at 42.9 %; five small white arrows (3 px strokes, each about 40 comp px long with a curled two-barb head about 26 px tall) sit on the photos' row, centred at 28.2, 38.6, 49.0, 61.9 and 73.0 % of the width, one in each gap between photos.
  Every photo is grey: saturation removed fully, lightness unchanged; the bar segments, the labels and the white arrows keep their own colours because they sit outside the photo precomp.
  Jitter, measured over one played pass (viewer frames 795.0–798.4 s, scratch/05/bar_track.txt): the whole picture shifts together by up to about ±2.7 comp px on each axis (bar's left edge ranged over 5 screen px in x and 5 in y); each photo moves a further ±3 comp px or so on its own (the bowl's offset from the bar ranged over 6 screen px in x and 4 in y) while the arrows keep a fixed offset from the bar (±1 px, measurement noise), so the arrows carry only the whole-frame jitter. Photo hops and frame hops happen at the same instants, six times a second, because both use posterizeTime(6). No blur, no rotation in the jitter.
  The 1 % scale-up pushes the frame's edges out by about 9.6 px left and right and 5.4 px top and bottom, more than the jitter's reach, so no empty edge ever shows (inferred purpose; on this black ground it is not visible either way).
timing and easing: posterizeTime(6) on both wiggles: a new random position every 4 comp frames (23.976 fps). Posterize Time effect at 12 fps over everything below it: every other animation (bar draw, photo pop, arrow draw) advances only every second frame (inferred from the setting; the recording's preview ran slower than real time here — the time display went from 0:00:02:18 to 0:00:05:04, 58 comp frames, in about 81 recorded frames — so the stepping cannot be timed from the recording).
variations: Swap Hue/Saturation for Tint or Tritone to give the photos a sepia or brand-coloured look instead of grey (said; Tritone shown f017640). Push the wiggle's values up or down to taste (said).
pitfalls: none given
longest on: The per-photo wiggle expression: typing it and copying it to every photo, about 28 s (740–768 s), narrowly ahead of the two main-comp adjustment layers (about 27 s together); the black-and-white step and the Tritone detour took about 23 s (717–740 s).
build notes: Photo precomp: adjustment layer with "ADBE HUE SATURATION" (Master Saturation −100). Each photo layer: transform.position.expression = "posterizeTime(6)\nwiggle(222,3)". Main comp, top: adjustment layer with "ADBE Posterize Time" (Frame Rate 12); below it an adjustment layer with "ADBE Geometry2" (Transform): Scale 101 (uniform), Position expression the same two lines. Both adjustment layers must sit above every content layer (precomps, labels, bar, and any background solids added later) so the whole frame steps and shakes together. The comp is 23.976 fps on screen (the narrator says 24).
result: start=795.0 end=798.4 animated crop=1188,194,1804,1014 frame=f019120 (cut from source.mp4 at 797.46 s). In this window the viewer plays one loop pass from 0:00:02:18 to 0:00:05:04 (time display, scratch/05/times.png; the 05:04 reading is on the recorded frame at 798.375 s, scratch/05/tcend/sheet.png) with the phase bar complete, all six photos in place and the jitter running; the crop holds the black picture from start to end, no cursor or handles inside it. The loop restarts at about 798.4 s.
before: f016854 (same infographic, photos in colour, no jitter)
unknowns: The transform layer's finished expression is never fully on screen (",3)" inferred); the paste onto the other five photos is not shown, though all six photos' offsets from the bar change between hops in the played pass (median-position track of each, 795.0–798.4 s), so all carry their own wiggle; the stacking inside the photo precomp beyond "adjustment layer on top" (shown f017393); whether Tritone was deleted or switched off.

## Faint graph-paper backdrop
id: 06-faint-graph-paper-backdrop
status: unproven
source: nHh0NRo8G2U 804–858 s
jobs: texture; layout and repetition
what it does for a beat: Swaps a plain black ground for an off-white sheet ruled with tiny pale-blue squares, like school exercise paper, so a flat infographic reads as hand-made and educational rather than digital.
what it looks like: The phase-bar infographic (lime and pale-blue bar segments, labels now dark green, grey cut-out photos) sits centred on an off-white ground covered edge to edge with a very fine, faint blue-grey square grid; the grid is barely there, more a texture than lines.
ingredients:
- Pre-compose — built-in
- Solid (Layer > New > Solid; Solid Settings dialog shown) — built-in
- Grid — stock (Effect > Generate > Grid; added through a search panel, named on screen f020293)
- Text fill colour — built-in
steps:
1. Select the infographic's content layers (bar, labels, photo precomp, arrow precomps) and pre-compose them into one content precomp; the two jitter adjustment layers (figures under layout) stay above it in the main comp (said "select all your layers"; shown f019453: the main comp holds the Posterize Time adjustment layer, the Transform adjustment layer, then the content precomp).
2. Make a new solid at comp size and move it to the bottom of the stack (said: "a whitish" solid; shown f019595 Solid Settings and f020446 stack, the solid last).
   - Colour: #F3F3F3 (16-bit 31,226 per channel; shown f019595, full-size crop scratch/06/hex.png)
   - Size: 1920 × 1080, square pixels (shown f019595)
3. Inside the content precomp, select both phase labels and change their fill to a dark green so they read on the pale ground (said; shown f019692 both labels selected; Fill dialog shown on the cut frame f019751, scratch/06/text_fill_253814_f019751.png).
   - Fill: #253814 (H 92°, S 63 %, B 22 %) (shown f019751)
4. Centre the whole group in the frame, checking it against the viewer's grid overlay (said "open up your grid, center that up"; shown f019796 with the viewer's pink grid overlay on, and the group sitting centred from f019837 on). The layer moved is the content precomp: it is the selected layer in the timeline before and after the move (shown f019796, f019837). It goes up by about 60 px (inferred from the picture: the bar's top went from 47 % to 41.5 % of the height between f019453 and f020446).
5. Make another solid named for the grid, place it directly above the ground solid and below the content precomp, and apply Grid to it (said; shown f020446 stack: content precomp, grid layer, ground solid). Its own solid colour does not matter because of the blending setting below (inferred).
6. Set the Grid effect (final values shown f020293 and held to f020446; full-size crop scratch/06/gridfx.png):
   - Anchor: 960.0, 540.0 (default, unchanged)
   - Size From: Corner Point
   - Corner: 977.0, 554.0 (dragged from the default 1152, 648, shown f020029 → f020259 mid-drag → f020293 landed). This makes each cell 17 px wide and 14 px tall (Corner minus Anchor), so the cells are slightly wider than tall (inferred from the values; matches the measured pitch below)
   - Border: 2.0 (changed from 5.0; said "something like two"; shown f020293)
   - Feather: not opened (unknown; probably default 0)
   - Invert Grid: off
   - Color: #C0DEF8 (H 207°, S 22 %, B 97 %; shown f020155 with OK being clicked; the author passed through bluer #579DD8, #72B4EC, #86BEEE first, f020059–f020107)
   - Opacity: 100.0 %
   - Blending Mode: None (grid lines only, rest of the layer transparent — the effect's standard behaviour, inferred)
   - A yellow warning icon shows beside the effect name: the project is 16 bpc and Grid works in 8 bpc (icon shown f020293; project's "16 bpc" shown f019453; reading inferred)
layout: Measured on the clean result frame f020446 (calibrated on the picture's own edges: 2165×1218 screen px for 1920×1080, 1.128 px per comp px).
  Ground: flat off-white over the whole frame (reads 241 grey in the recording before the grid went on, f019995; between grid lines it reads about 235, 240, 243 — a faint blue cast the settings do not explain).
  Grid: covers the full frame, lines aligned so one crossing sits on the frame centre. Measured line pitch 19.25 screen px across and 15.75 down = 17 × 14 comp px, i.e. about 113 columns and 77 rows across the frame (cells 0.89 % of the width and 1.30 % of the height). Lines set 2 px; they render about 4 recording px wide and very shallow and nearly grey: a column average across a line is about 11 levels darker than the cells on every channel (cells ≈ 235, 240, 243; lines ≈ 224, 230, 233; the darkest line pixels ≈ 209, 216, 218), so the lines sit at roughly 5–10 % contrast. Warning: this is about a third of the ink a 2 px line of #C0DEF8 at 100 % over #F3F3F3 should leave, and at 1.128 recording px per comp px the viewer does not thin a 2 px line below a pixel, so zoom does not explain it; the Grid swatch itself still reads pale blue (about 181, 214, 240) in f020446, and with Border 5 (f020259) the lines read about 186, 209, 230. Why they render this faint is unknown (Feather, the 8 bpc effect in a 16 bpc project and the viewer are all possible). Keep the shown settings, and check a full-size render with a target that does not depend on zoom: the mean level of an empty patch of paper, grid included, is about 233, 238, 241 in f020446, against 241 grey for the bare ground before the grid (f019995).
  Content (made outside this recipe, but part of the result; figures measured on f020446): the infographic is centred: its block runs from about 19 % to 81 % of the width (left edge of the labels to the right end of the pale-blue segment) and from about 37 % to 64 % of the height (top of the labels to the bottom of the photos). The phase bar runs from 41.5 % to 46.8 % of the height (about 5.5 % thick), lime (renders about 187, 237, 102) from 18.9 % to 62.5 % of the width and pale blue (renders about 144, 212, 225, median of the segment's core) from 63.2 % to 81.3 % (colour warning: these two are recording colours, and a wide-gamut screen recording shows mid-tone greens and blues more saturated than the render; the lime's typed value, #BFF06C according to the check of the bar's own recipe, not shown in this window, comes through almost unchanged, while the pale blue's typed value was never shown, so treat its reading as approximate and match lightness rather than hue). Two one-word labels in a bold sans sit above it, each left-aligned with its segment, about 3.0 % of the height tall with their tops at 36.9 %, dark green (render about 44, 56, 35 on average, anti-aliased). Six grey cut-out photos, each about 100 comp px across (about 5 % of the width), sit on a row centred at about 57 % of the height (they span 50 % to 64 %) and pop in one by one during the result window.
  The small white arrows between the photos (3 px white strokes, set up before this step) are not changed and vanish on this ground: in the result there are no visible arrows between the photos (shown f020446).
  Everything, ground and grid included, sits under two adjustment layers set up before this step, so the paper shakes and steps with the scene (stack shown f020446): on top, Posterize Time at Frame Rate 12; below it, Transform at Scale 101 (uniform) with the Position expression posterizeTime(6) then wiggle(222,3), which hops the whole frame within about ±3 px six times a second. Each photo also carries that expression on its own Position and is made grey by Hue/Saturation at Master Saturation −100 inside its precomp, so the photos twitch independently on top of the frame shake.
timing and easing: none given (the backdrop is static; it moves only with the whole-frame jitter described under layout)
variations: A bluish grid colour for an exercise-book look (said); the solid can be any near-white (said "a whitish").
pitfalls: Text that was white on black must be darkened for the pale ground (said). Not said but visible: white strokes (the arrows) disappear on it too.
longest on: Setting up the Grid effect (about 23 s, 836–858 s), most of it choosing the colour in the picker and dragging the corner to shrink the squares; the solid and text-colour changes took about 15 s and 11 s.
build notes: Ground: solid 1920×1080, colour [0.953, 0.953, 0.953], at the bottom. Grid layer: comp-size solid with "ADBE Grid"; properties as After Effects shows them: Anchor [960,540], Size From = Corner Point, Corner [977,554], Border 2, Invert Grid off, Color [0.753, 0.871, 0.973], Opacity 100, Blending Mode None. Order from top: adjustment layer with "ADBE Posterize Time" (Frame Rate 12), adjustment layer with "ADBE Geometry2" (Scale 101, Position expression "posterizeTime(6)\nwiggle(222,3)"), content precomp, grid solid, ground solid. Change the label fill to [0.145, 0.220, 0.078]. Render a full-size frame and compare the line contrast with the measured target above before adjusting anything.
result: start=848.9 end=853.1 animated crop=1424,152,2165,1218 frame=f020446. The viewer plays a preview (its time display reads 0:00:09:08 at f020446 while the timeline cursor sits at 0:00:02:02) with the photos popping in during the window; the crop holds the picture from f020350 to f020446 (grid cells and edges identical, no cursor or handles inside at either end; a cursor enters at f020470).
before: f019453 (the same infographic on black, before the solid)
unknowns: Grid Feather; the grid solid's own colour; exactly how far the content precomp was moved to centre the group; why the cells read slightly blue and the lines render far fainter and greyer than the set colour (cause unknown).

## Bar chart of thick strokes that grow up in a ladder, with value labels sliding in beside them
id: 07-stroked-bars-grow-in-stagger-with-value-labels
status: unproven
source: nHh0NRo8G2U 864–1086 s
jobs: lines and shapes; layout and repetition; type
what it does for a beat: A quick "how big is each one" moment: four bars rise one after another from a shared baseline, left to right, tallest first, while each value label slides in from the left. Use it when a narrated figure needs a chart that builds as the voice lists the numbers.
what it looks like: On a black frame, four warm-yellow vertical bars of equal width stand on a thin yellow baseline in the middle of the picture, falling in height from left to right. Right-aligned white labels in a bold geometric sans ("$500 M"-style figures) sit in a column to the left of the bars, each label's baseline level with the top of its own bar.
ingredients:
- Shape layers with a single open path, Stroke and Trim Paths — built-in; Add > Trim Paths in the shape layer's contents (shown f024625, Trim Paths 1 under the layer's Contents)
- Text layers (point text, right-aligned) — built-in
- An easing extension that applies cubic curves to selected keys (the panel shows preset curves and an APPLY button) — paid; only a convenience, the curves are given below as numbers (shown f026967)
- A free layer-sequencing extension (offsets selected layers by N frames) — free; only a convenience, the resulting offsets are given below (shown f023941, SEQUENCE with offset 10)
- Build aid only: the layout was drawn in a vector illustration program and sent to After Effects with a paid transfer plugin, then split into one shape layer per path with the free sequencing extension (said; illustration shown f023708, the extension panel with EXTRACT and SEQUENCE shown f023941). A script can draw the layout directly from the figures below.
steps:
1. Make a 1920 x 1080 comp, black background, 23.976 fps. (size said at 11.5 s, in the intro, for all the video's comps; frame rate shown f026967 time display "(23.976 fps)", though the narrator says 24; background shown f026967: no background layer in the stack, picture black)
2. Draw the baseline: one horizontal open path, its own shape layer, centred horizontally. (said "straight line", shown f023708)
   - Length: 607 px, from x 657 to x 1264, at y 735 (measured f026967; see layout)
   - Stroke width: about 3 px (measured on f028684 cut at 1196.4 s, Full-resolution viewer; the width was never shown, the narrator only says it was thickened a little)
   - Stroke colour: the same yellow as the bars (shown f026967; inferred that all shapes were recoloured together, said "change the stroke")
3. Draw four bars, each as its own shape layer holding one vertical open path drawn from the bottom up (start point on the baseline, end point at the bar's top), so that Trim Paths End grows the bar upwards. (said: click, hold shift and go up; growth direction shown in the result, f028638)
   - Stroke Width: 60 (shown f024625, Properties panel "Stroke Width 60" and toolbar "Stroke 60 px"; measured 58.6 px wide on f026967, which agrees within the viewer's blur)
   - Line Cap: Butt Cap; Line Join: Miter Join (shown f024625, first icon of each row highlighted)
   - Fill: None (said "remove the fill"; shown f024625 Fill Color "None")
   - Stroke Color: a warm yellow; swatch reads about RGB 243,190,6 (shown f024625, swatch sampled), renders about RGB 247,187,3 (measured f026967). This is a saturated colour read off a screen recording and may be inflated (see build notes).
   - Bar centres x 724, 881, 1039, 1196.5 (pitch 157.5 px); tops y 319.5, 462, 560, 708; bottoms on the baseline at y 735 (measured f026967; the fourth bar's layer Position reads 1195.5,721, shown f024625, which agrees with the measured centre)
   - Stack order: baseline at the bottom of the stack, then the tallest (leftmost) bar, up to the shortest (rightmost) bar at the top of the shape layers (shown f026967: Group 1 to Group 5 from top to bottom; inferred from f024625, where Group 1 is the selected shortest bar, and from the order of growth in the result)
4. Add four point-text layers, right-aligned, white-ish, a bold geometric sans, reading the four values from largest to smallest. (text and font said: "500 million", "350", "100", "5M" and the Satoshi typeface; right alignment said and shown f023708; colour said "whitish")
   - Final Position (anchor at the right end of the text baseline): (628.1, 329.3), (628.1, 462.0), (629.0, 558.0), (628.1, 707.0) for the largest to the smallest (shown f025631 for the first three at 0:00:03:00; the fourth's y 707.0 shown f026889, cut at 1121.5 s; its final x inferred to be 628.1 like the others, since its first-key x is 515.1 like theirs)
   - Size: capital height (the "M") about 19 px, measured 18–19.6 px on f026967 and f024625; the "$" is taller, about 23 px, because it reaches above the capitals and below the baseline (measured f026967). Font size not shown; about 27 px inferred from the M
   - Fill colour: renders about RGB 247,247,247 at its brightest (measured f026967); the value typed is not shown
   - Text layers sit above all shape layers (shown f026967)
5. Animate each bar: add Trim Paths to the bar's contents and key End from 0 % to 100 % over 18 frames. (End keyed and moved forward a little, then set to 0 at the start: said; keys shown f024800; 18 frames measured from the key spacing on f026889, 161 px at 8.92 px a frame; an earlier reading on f024800 gave 17.5, so 18 is the nearest whole frame)
   - Start: 0 %, Offset: 0 (shown f024625)
   - Ease on both End keys: cubic-bezier (0.88, 0.14, 0.12, 0.86), a strong symmetric ease in and out (curve and numbers shown f024800 with APPLY pressed, preset selected; keys shown as eased in f024983)
6. Stagger the bars 10 frames apart, tallest (leftmost) first: each bar layer starts at its first key. (said "sequence them, 10 frames", in the reverse of the stack order because the first bar is lowest in the stack; result shown f026967 and f026889)
   - Tallest bar: layer in and End keys at frames 7 → 25 (shown f026889)
   - Second: 17 → 35; third: 27 → 45; shortest: 37 → 55 (shown f026889)
7. Animate each label: Position keyed so it enters 113 px left of its final place and slides right into place over 12 frames; the layer starts at its first key, so the label appears on that frame already moving. (slide in from the side, 12 frames back, move it left, trim the layers at the start: said; positions shown f025631 (628.1) and f026889 (515.1 at the first key); in-points shown f026889)
   - Ease on both Position keys: cubic-bezier (0.04, 0.47, 0.53, 0.93), fast start that settles slowly (said "fast in"; preset name and numbers shown f025815)
   - Only x changes; y stays at the values above (shown f025631 against f026889)
   - No track matte on the labels (shown f026889, "No Matte"): each label simply pops on at the left and slides
8. Stagger the labels 10 frames apart, largest value first, so each starts on the same frame as its bar. (said "sequence them by 10", reverse order because the largest is at the top of the stack, "move it to the very beginning"; result shown f026889)
   - "$500"-style label: in and keys 7 → 19; second 17 → 29; third 27 → 39; smallest 37 → 49 (shown f026889)
9. The baseline's own draw-on from the centre is recipe 08 (keys 0 → 12 frames; the line is fully drawn by frame 12 and stays). Its figures are in layout so this recipe stands alone. (shown f026889)
layout: Measured on f026967 (comp at 0:00:02:12, viewer redrawn, comp edges at x 1189–2991, y 194–1207 of the full-size frame, 0.939 screen px per comp px) and checked on f026889. All figures in comp pixels of 1920 x 1080. Baseline: x 657–1264 (607 px, 31.6 % of the width, centred, 960.5), y 735 (68.1 % down), about 3 px thick, yellow. Bars: 60 px wide (3.1 % of the width), centres at x 724, 881, 1039, 1196.5 (37.7 %, 45.9 %, 54.1 %, 62.3 % of the width), equal 157.5 px pitch (97.5 px gap between bars); heights above the baseline 415.5, 273, 175, 27 px (38.5 %, 25.3 %, 16.2 %, 2.5 % of the picture height; 1 : 0.66 : 0.42 : 0.065 — exaggerated, not to the figures' scale, the smallest bar was shortened on purpose, said). The baseline overhangs the outer bar edges by 37 px on both sides. Labels: right edges at x 625 (32.6 % of the width), 69 px left of the first bar's left edge and 32 px left of the baseline's start; baselines at y 329, 462, 558, 707, each level with the top of its own bar within 2 px except the tallest (label 10 px below its bar's top); capital "M" about 19 px tall (1.75 % of the height), the "$" about 23 px. Whole chart block: x 532–1264, y 309–737, slightly right of centre because the labels hang off the left. Nothing else in the frame: no shadows, no glow, no background shading, no grain; flat colour on pure black. No motion blur: the switches in f026967 show none set, and a bar's top edge stays sharp mid-growth (f028638). Motion: bars grow straight up from the baseline, bottom fixed; the tallest grows 415 px in 18 frames (about 98 px a frame in the two middle frames, 4.2 times the average 23 px a frame, from the 0.88 ease; the played heights on consecutive recorded frames from about f026842 run about 4, 8, 15, 24, 35, 51, 72, 109, 207, 305, 342, 363, 378, 390, 399, 406, 411, 416 px). Labels move only rightwards, 113 px in 12 frames, most of it in the first few frames; a little past half way a label is about 20 px short of its place (measured on f028638, the 09 playback, where the first bar is at about 17 % of its height and the label about 7 frames into its 12). Order in the picture: left to right, tallest first, one bar every 10 frames; whole build done at frame 55 (2.3 s).
timing and easing: Baseline 0–12 f (recipe 08). Bars: End 0 → 100 % over 18 f, in at 7, 17, 27, 37 f, ease cubic-bezier(0.88, 0.14, 0.12, 0.86) on both keys. Labels: Position x −113 px → final over 12 f, in at 7, 17, 27, 37 f, ease cubic-bezier(0.04, 0.47, 0.53, 0.93). In After Effects terms (inferred conversion, not shown): bars outgoing and incoming influence 88 %, speed 16 % of the average (about 21 %/s on End); labels outgoing influence 4 % at about 11.75 times the average speed (about 2650 px/s), incoming influence 47 % at about 0.15 times the average (about 34 px/s). Why the first bar starts at 7 f, not 0, is not said.
variations: The labels can slide up from below instead of in from the side (said). The layout can be drawn directly in After Effects (said: the illustration program is only easier for lining up).
pitfalls: Shapes arrive from the transfer with a black fill and so are invisible on the black comp until the fill is removed (said). The sequencing order has to be reversed because the first bar and the largest label sit at opposite ends of the stack (said twice). Trim Paths only grows the bar upwards if the path was drawn from the bottom up (inferred from the drawing step).
longest on: Drawing and aligning the layout in the illustration program: about 126 s (864–990 s) of the 222 s, against about 22 s on the bars' Trim Paths and easing (1026–1048 s) and about 25 s on the labels' slide and stagger (1060–1086 s).
build notes: Script it as five shape layers, each with ADBE Root Vectors Group > a group holding one path (ADBE Vector Shape - Group), ADBE Vector Graphic - Stroke (Stroke Width 60, Line Cap Butt = 1, colour) and ADBE Vector Filter - Trim (End keyed). Draw each bar path with vertices [[x, 735], [x, top]] in that order so End grows upwards. Set the layer in-point (inPoint/startTime) to the first key's time and stack them so the tallest bar is lowest among the bars. Text: point text, ParagraphJustification.RIGHT_JUSTIFY, a bold geometric sans (Satoshi Bold is free; any similar one will do), size about 27 to reach a 19 px capital height (check the "M", not the "$"); layer anchor left at 0,0 so Position is the right end of the baseline. Keys at frame n are at n / 23.976 s. Apply the eases with setTemporalEaseAtKey using the influences and speeds in timing (for Position use a one-dimensional KeyframeEase per key, since it is spatial). The yellow was read from a screen recording: pure-ish yellows come through nearly unchanged, but if it looks too orange or too green in the render, aim for RGB about 243,190,6. No motion blur.
result: start=1119.2 end=1121.6 animated crop=1424,0,2164,1116 frame=f026891
before: f023708 (the drawn layout in the illustration program, black bars and labels on white, before it was sent to After Effects)
unknowns: The baseline's stroke width (about 3 px measured, never shown). The labels' font size, weight and fill value (only their rendered look is measured). The comp's length. Why the stagger begins at frame 7. Whether the fourth label's final x is 628.1 (its first-key x 515.1 is shown; final inferred). The exact keyframe frame of the bars' second key was read as 17.5 and 18 from two timelines; 18 is used. In the result crop the comp's top 90 px are off the recording (the comp's top edge is at y −101 of the frame; the crop holds comp rows 90–1080, all of the chart), and the viewer is at Half resolution, so thin lines read softer than they render.

## Chart baseline that draws outward from its middle
id: 08-baseline-draws-out-from-centre
status: unproven
source: nHh0NRo8G2U 1086–1127 s
jobs: lines and shapes
what it does for a beat: Opens a chart (or any divider) with a line that grows out to both ends at once from its centre, a calm, balanced first move before the data arrives.
what it looks like: On a black frame a thin warm-yellow horizontal line appears as a short dash in the middle of the picture and stretches evenly left and right to its full length in half a second, slow at first, fast in the middle, settling at the ends. In the tutorial it is the baseline of a four-bar chart, and the first bar starts rising from it before it has finished.
ingredients:
- Shape layer with one open horizontal path and a Stroke — built-in
- Trim Paths — built-in; Add > Trim Paths in the shape layer's contents (said "adding a trim paths"; shown f026889, Trim Paths 1 under the layer's Contents)
- An easing extension that applies cubic curves to selected keys — paid; only a convenience, the curve is given below as numbers (shown f026800)
steps:
1. Make a 1920 x 1080 comp, black background, 23.976 fps. (size said; frame rate shown f026967 "(23.976 fps)"; background shown f026967)
2. Draw the baseline as one shape layer holding one horizontal open path, centred on the comp's width. (said "straight line", "center it up"; shown f026967)
   - From x 657 to x 1264 at y 735 (607 px long) (measured f026967, see layout)
   - Stroke Width: about 3 px (measured on f028684, cut at 1196.4 s; not shown in any panel)
   - Stroke Color: warm yellow, swatch about RGB 243,190,6, the same as the chart's bars (bars' swatch shown f024625; that the baseline shares it is inferred from the matching rendered colour on f026967; saturated colour from a screen recording, may be inflated)
   - Line Cap: not shown; Butt is inferred (the line's ends look square on f026967)
   - The layer sits at the bottom of the chart's stack and starts at frame 0 (shown f026889, layer 9 of 9, bar from 0)
3. Add Trim Paths to the line's contents rather than pasting the bars' Trim Paths, because it animates differently. (said)
   - Start: 50 %, End: 50 % at frame 0, both keyed (said "set both to 50"; shown f026889 at 0:00:00:00, Start 50.0 %, End 50.0 %, keys on both)
   - Trim Multiple Shapes: Simultaneously (shown f026889, default)
4. About 12 frames later, set Start to 0 % and End to 100 %. (said "about 12 frames", and that start goes to zero and end to 100; second keys shown at exactly 12 frames on f026889, 107 px at 8.92 px a frame; values shown f026800 at 0:00:00:12, Start 0.0 %, End 100.0 %, both pairs of keys eased; the line reaches both full ends by frame 12 on f026845)
5. Select all four keys and apply a strong ease in and out. (said, as an easing preset; the speech names it "60 speed", the screen shows the same preset as the bars, cubic-bezier (0.88, 0.14, 0.12, 0.86), selected in the curve panel on f026800; the screen wins)
layout: Measured on f026967 (comp at 0:00:02:12, comp edges at x 1189–2991 of the full-size frame, 0.939 screen px per comp px) and on the played frames f026834–f026845 (comp edges x 1424–3588, 1.127 screen px per comp px). In comp pixels: line from x 657 to 1264 (607 px, 31.6 % of the width), centre x 960.5, at y 735 (68.1 % down the picture), about 3 px thick (a 1–3 px band of the frame, Half-resolution viewer; about 3 px on the Full-resolution f028684). Colour rendered about RGB 247,187,3 at the line's core on f026967 (the core is partly blurred by the Half-resolution viewer, so it reads darker than the bars). Growth, read on consecutive played frames f026834–f026845 (the viewer redraws every frame here; one frame repeats): total length 8, 22, 43, 43, 129, 303, 476, 533, 563, 584, 597, 608 px; both ends always equidistant from x 960 (e.g. 949–972, then 809–1112 on f026839 and 722–1199 on f026840, then 657–1264 on f026845). Half length at about frame 6 of 12; peak speed about 175 px a frame in total (about 87 px a frame for each end), against an average of 50. Nothing else: no glow, shadow or motion blur (the moving ends stay crisp on f026839). The rest of the chart (four 60 px bars and right-aligned labels, recipe 07) starts at frame 7, so the first bar has begun rising at the left before the line is complete; on the result frame f026845 (comp frame 12) the tallest bar is already a 60 x 35 px yellow block standing on the line's left part (centre x 724, about 8 % of its final height; its End reads 8.7 % on f026800), and the largest label is in the picture about three quarters of the way through its slide, its right edge near x 594 against a final 625 (Position x 596.4 against 628.1 on f026800). To compare a build of the line alone, compare the line and ignore those two, or build them as in recipe 07.
timing and easing: Start 50 → 0 % and End 50 → 100 %, both keyed at 0 and 12 frames (0.5 s at 23.976 fps), ease cubic-bezier(0.88, 0.14, 0.12, 0.86) on all four keys. In After Effects terms (inferred conversion, not shown): outgoing and incoming influence 88 %, speed 16 % of the average, about 16 %/s on each property.
variations: none given
pitfalls: The line's Trim Paths is set up on its own rather than pasted from the bars, because it animates differently (said). Pasted, it would draw from one end like the bars (inferred).
longest on: Setting up the two keyed values from 50: about 30 s (1095–1125 s), against a few seconds on the ease.
build notes: Shape layer: ADBE Root Vectors Group > group > ADBE Vector Shape - Group with vertices [[657, 735], [1264, 735]] in comp space (or centred on the layer), ADBE Vector Graphic - Stroke (width 3, Butt cap), and ADBE Vector Filter - Trim with Start (property 1) and End (property 2) keyed at 0 and 12/23.976 s. Apply KeyframeEase(16, 88) on both sides of each End key and KeyframeEase(-16, 88) on the Start keys, since Start falls (speed 16 %/s, influence 88; the sign is inferred from how After Effects stores speed). Do not use speed 0: KeyframeEase(0, 88) is a different, steeper curve, cubic-bezier(0.88, 0, 0.12, 1), and the played lengths match only the 16 %/s one. Direction of the path does not matter: start and end move symmetrically.
result: start=1119.17 end=1119.67 animated crop=1424,0,2164,1116 frame=f026845
before: f026832 (cut at 1119.13 s: the empty black comp at frame 0, before the line appears)
unknowns: The line's stroke width and cap (about 3 px and square ends, measured). In the result crop the comp's top 90 px are off the recording (comp top at y −101 of the frame); the line is well inside the crop.

## Faint grid held inside the chart's box, and the whole chart stepped to 12 fps
id: 09-grid-clipped-to-the-chart-area
status: unproven
source: nHh0NRo8G2U 1127–1201 s
jobs: texture; layout and repetition; lines and shapes
what it does for a beat: Gives a bar chart a quiet graph-paper backing that stops at the chart's edges, and a slightly hand-made, stepped motion, so a plain data beat reads as designed rather than default.
what it looks like: Behind the four yellow bars a faint grey grid of near-square cells fills only a rectangle from the baseline up to a little above the tallest bar and from one end of the baseline to the other; the labels to the left sit on plain black. The bars and labels build on as before but in visible steps, each picture held for two frames.
ingredients:
- Solid with Grid — built-in; Effect > Generate > Grid (effect name shown f027186; menu path not shown, inferred)
- Shape layer with a filled rectangle used as a track matte — built-in; Track Matte pick whip in the Timeline (said; shown f028323)
- Adjustment layer with Posterize Time — built-in; Effect > Time > Posterize Time (effect shown f028598; menu path inferred; the narrator copies the layer from an earlier comp)
- The chart itself (recipe 07 and 08), whose figures this recipe needs are repeated under step 1 and in layout
steps:
1. Start from the finished bar chart: 1920 x 1080, 23.976 fps, black. Four bars as 60 px yellow strokes centred at x 724, 881, 1039, 1196.5, tops at y 319.5, 462, 560, 708, standing on a 3 px yellow baseline from x 657 to 1264 at y 735; right-aligned white labels ending at x 625 with baselines at y 329, 462, 558, 707. Bars grow upwards with Trim Paths End 0 → 100 % over 18 frames starting at frames 7, 17, 27, 37 (tallest first); labels slide 113 px right over 12 frames starting at the same frames; the baseline draws from its centre over frames 0–12. (recipe 07 and 08, shown f026889 and f026967)
2. Make a new comp-size solid, add Grid to it and move it to the bottom of the stack, under all chart layers. (said "add the grid" and move it behind; shown f027186: a full-size solid, Position and Anchor 960,540, Scale 100 %, at the bottom of the stack, Grid applied)
   - The solid's own colour does not show: with Blending Mode None, Grid draws only the lines (inferred from the result, where the space between lines is black)
3. Set the Grid's cell size and line. (said "scale it down", "a bit skinnier", "about two", "narrower to get the square look"; values shown)
   - Anchor: 960, 540 (shown f027186, unchanged through f028323)
   - Size From: Corner Point (shown f027186)
   - Corner: 1004, 585, so cells are 44 px wide and 45 px tall (shown f028024, f028265, f028323; passed through 1152,617, 1152,586, 998,585 on the way, f027260–f027454)
   - Border: first 2.0 (said "about two", shown f027339), then lowered to 1.0 for the final look (shown f028265, f028323; not said)
   - Feather: default; Invert Grid: off; Opacity: 100 %; Blending Mode: None (shown f028323)
4. Draw a rectangle with the shape tool: no stroke, any loud fill, dragged from the start of the chart over the whole chart. (said; Rectangle Path Size 619.0, 466.0 and Position 0,0 inside the shape shown f028323; the layer's Position is not shown)
   - Place it so it covers the chart from the baseline up to a little above the tallest bar and from one end of the baseline to the other: centre about (960, 501) (measured, see layout; inferred placement)
   - Put it directly under the Grid layer (shown f028323, layer 11 under the Grid's layer 10)
5. Set the Grid layer's Track Matte to the rectangle's layer with the pick whip, alpha matte. (said "pick whip the track"; shown f028323 and f028598, the Grid's Track Matte column reads the shape layer, alpha icon; the matte layer's own picture is hidden, inferred from the result where no fill shows)
6. Make the grid faint: change Grid's Color from white to a mid grey. (said "a little bit faint", "a slight grayish color"; the colour dialog shows #B5B5B5, H 0 S 0 B 71 %, on f028377 with the pointer heading for OK; earlier in the same drag it passed #A69D9D, f028353. The final value is not shown after the dialog closes, so #B5B5B5 is the best reading, inferred as final)
7. Copy an adjustment layer carrying Posterize Time to the top of the stack. (said "copy that layer over and paste it"; shown f028598: an adjustment layer first in the stack with only Posterize Time)
   - Frame Rate: 12.0 (shown f028598)
layout: Measured on f028684 (cut at 1196.4 s; Full-resolution viewer at 62.7 %; comp edges at x 1425–3588, y 153–1369 of the full-size frame, 1.127 screen px per comp px), in comp pixels. Grid area (the matte): x about 657–1264 (607 px, the same span as the baseline), y about 268–735 (467 px), from the baseline up to about 53 px above the tallest bar's top; centre about (960, 501). The shown rectangle size is 619 x 466, so the measured width is about 12 px narrower than the shown size; aim for the measured span (the edges of a matte cut through 1-px lines are hard to place within ±5 px). Grid lines: verticals at x = 960 + 44k (measured 785.6, 830.0, 874.4, 917.8, 961.8, 1005.7, 1050.0, 1094.4, 1138.3, 1182.2, 1226.6), horizontals at y = 540 + 45k (measured 271.5, 317.2, 361.5, 405.9, 451.5, 496.9, 542.1, 586.0, about 632, 677.8, 721.8), each about 1.5 px right of or below the exact multiple; 14 columns and about 10 rows of cells inside the area. Line brightness: very faint, a neutral grey peaking at about 27–50 of 255 on the black in the recording (most lines 41–50, about 16–19 % of white; the weaker peaks are lines that fall between screen pixels), at 62.7 % viewer zoom; the same lines at white and 100 % zoom (Half resolution) peaked 34–84 (f028323), so a 1-px Grid line reads much darker than its colour value even before the grey; judge the render at 100 % against "faint, clearly below the labels' brightness". Stacking: grid behind everything; the bars and the baseline cover the lines where they cross; the labels lie outside the grid on plain black. The grid is static and present from frame 0 (f028625 shows it before anything else has drawn). Stepped motion: in the playback the viewer's clock runs at about real time (2:16 of comp time in 68 recorded frames) and the picture changes on every second recorded frame (f028625–f028692), i.e. 12 pictures a second; bars and labels move in two-frame steps. No other finish: no shadow, glow, grain or vignette; pure black ground.
timing and easing: No keys of its own. Posterize Time 12 fps over a 23.976 fps comp holds each picture for 2 frames. The chart's own timing is in step 1.
variations: The grid's size can be changed afterwards because the rectangle, not the grid, sets the visible area; the grid can be widened or moved freely under the matte (said). The colour can be changed (said).
pitfalls: Give the rectangle a loud fill while drawing it so its extent is easy to see; the fill never shows once it is the matte (said).
longest on: Sizing the grid cells and line (Corner and Border dragged until the cells looked square): about 23 s (1127–1150 s), against about 21 s on drawing the rectangle and setting the matte (1150–1171 s), about 17 s on making it faint (1171–1188 s) and about 13 s on Posterize Time (1188–1201 s).
build notes: Solid 1920 x 1080 at the bottom; effect ADBE Grid: Anchor [960,540], Size From 1 (Corner Point), Corner [1004,585], Border 1, Color [0.71,0.71,0.71] (#B5B5B5), Opacity 100, Blending Mode None. Shape layer directly below the Grid layer in the stack: one rectangle, Size about [607, 467] (shown 619 x 466), layer Position about [960, 501], Fill any colour, no stroke. In After Effects 2023 and later set gridLayer.setTrackMatte(shapeLayer, TrackMatteType.ALPHA); earlier versions need the matte directly above the Grid layer with trackMatteType ALPHA. Adjustment layer at the top with ADBE Posterize Time, Frame Rate 12. If the 1-px lines render brighter than the target, lower Grid Opacity rather than changing the matte or the cell size. The tutorial's project is set to 16 bpc (shown f028401, Project panel "16 bpc"; the colour dialog on f028377 gives channels out of 32768); the look does not depend on it, and a script that changes bit depth carries it into later projects, so leave the project at 8 bpc.
result: start=1193.9 end=1196.7 animated crop=1425,153,2164,1217 frame=f028684
before: f026967 (the same chart before the grid and Posterize Time were added)
unknowns: The rectangle layer's Position and whether its size was changed after f028323 (the measured area is a little narrower than 619). The final Grid colour after the dialog closed (#B5B5B5 read in the open dialog). The solid's colour (it does not show). The narrator later pastes in an arrow from an earlier part of the video (20:01); it is not in this result window and is left out.

## Pie chart from one fat stroke, with the share pushed out
id: 10-pie-slice-from-a-stroked-ring
status: unproven
source: nHh0NRo8G2U 1224–1371 s
jobs: lines and shapes
what it does for a beat: A single-statistic beat ("X % of all ..."): a pie sweeps round from twelve o'clock, then the highlighted share slides out from the centre so the number has a piece to point at.
what it looks like: On a black frame, a solid disc about a quarter of the frame height across, centred. It is lilac, apart from an 18 % wedge in warm yellow that starts at twelve o'clock and runs clockwise. Both parts sweep on clockwise together in one second with a strong S-curve ease. Then the yellow wedge slides about 36 px up and to the right along its own centre line, leaving an even black gap about 20 px wide along both of its straight edges. Flat colour, no outline, no shadow, no gradient.
ingredients:
- Shape layer with an Ellipse path, Stroke only, no visible Fill — built-in (ellipse tool; fill removed said, Fill switched off shown f030109)
- Trim Paths — built-in (shape layer Contents > Add > Trim Paths; menu path inferred)
- A keyframe-easing extension — paid; used only to apply one S-curve ease, given below as numbers
steps:
1. Comp: 1920 x 1080 at 23.976 fps, black background. (1920 x 1080 said; 23.976 shown in the project panel; black shown f032870)
2. Draw an ellipse shape layer centred in the comp. Keep only a Stroke: the Fill is switched off with its eye (shown f030109, "Fill 1" still in Contents) or deleted (said); either gives the same picture.
3. Make the stroke so fat that it closes the hole: the stroke is wider than the ellipse. (said "make it a pie"; values shown)
   - Stroke Width: 131 px (shown f030109 and toolbar; the author scrubbed 182 → 156 → 131)
   - Ellipse Size: 127.9, 127.9 (shown f030209 and f030515; tried 208.9 and 140.9 on the way)
   - Because the width (131) is larger than the diameter (127.9), the inner edge passes the centre and the ring renders as a solid disc 127.9 + 131 ≈ 259 px across. (inferred from the values; matches the measured 256–259 px)
   - Line cap: butt (inferred from the square wedge edges)
4. Add Trim Paths to this layer. (said "trim pass"; shown f031394)
5. Duplicate the layer. Name the top copy "slice" and the lower one "base". (said; layer order shown f031394)
6. Colour the slice yellow and the base lilac. (said; dialog values shown)
   - Slice stroke: #FCCE02 (shown f030974: the dialog is open on the base layer, showing the colour both copies still share before the base is recoloured, so the slice keeps it). Renders about RGB 247, 202, 3.
   - Base stroke: #DA87EF (shown f031394, dialog open; kept in f031442). Earlier the author tried #02B6FC (blue, f031011/f031294) and #F602FC (magenta, f031337). It renders about RGB 207–214, 113–134, 231–235.
   - P3 caution: both colours are saturated. The recording was probably captured in a wide-gamut space, so the measured render values are lower than the typed hex. Type the hex values, then compare against the measured values in an sRGB render. (inferred)
7. Set the base's Trim Paths to Start 18 %, End 100 %, Offset 0°, Trim Multiple Shapes "Simultaneously". (shown f031394)
8. Set the slice's Trim Paths to Start 0 %, End 18 %. (said; shown f032234 keys)
   - The two layers now meet at twelve o'clock and at 18 % (64.8° clockwise). Trim runs clockwise from twelve o'clock on an ellipse drawn with the tool. (shown in the played result)
9. Key the sweep-on over 1 s (0 f to 24 f). (shown in the f032234 timeline)
   - Base Start: 0 % at 0 f, then 18 % at 24 f
   - Base End: 0 % at 0 f, then 100 % at 24 f
   - Slice End: 0 % at 0 f, then 18 % at 24 f (Start stays 0)
10. Ease every key with the S-curve cubic-bezier 0.88, 0.14, 0.12, 0.86. This is a saved curve in the easing extension. (preset selected on screen, shown f032234; speech recognition reads it as "60 speed"; numbers shown f032234 and f032870)
    - In After Effects terms: Influence 88 % in and out on every key. Speed at each key is 0.159 × the move's average speed. For Base End that is 0.159 × 100 %/1 s ≈ 15.9 %/s; for Base Start and Slice End it is 0.159 × 18 %/1 s ≈ 2.9 %/s. (inferred conversion)
11. Push the slice out. The slice's Anchor Point stays at the layer centre, so Position moves the wedge without changing its shape. (anchor said "centred")
    - Position: 960, 540 → 980, 510. That is +20 in x and −30 in y: 36 px along a line 34° clockwise from straight up, which is the wedge's own centre line (18 % / 2 = 32.4°). (shown, readout 980.0, 510.0 in f032870; direction computed)
    - Key times: about 28 f → 44 f (1:04 → 1:20), a 16-frame move that starts just after the sweep lands. (inferred from key positions on the timeline ruler in f032870 and f034296, ±1 f; the keys were first set at 1:17–2:09, then dragged earlier)
    - Same S-curve ease on both keys (shown f032870, the extension panel showing the preset). In After Effects terms, Influence 88 % and speed 0.159 × (36 px / 16 f ≈ 54 px/s) ≈ 8.6 px/s at each key. (inferred conversion)
layout: Measured on f034296 (viewer at 62.7 %, comp edges at full x 1188–2991: 0.939 full recording px per comp px) and f032870 (viewer at 100 %: about 1.81 full px per comp px). measured: the disc is centred on 960, 540 and is about 256–259 px across: 24 % of the frame height and 13.4 % of the width. The wedge covers 18 % of the turn, from twelve o'clock clockwise to about 64.8°. After the push, the wedge's tip sits about 20 px right of and 30 px above the centre. The black gap along each straight edge is 19–20 comp px wide, and the gap along the circle edge is the same 36 px offset. The base is an 82 % sector with its notch exactly where the wedge came from. Background pure black, no grain, no outline, no shadow, no glow. In the full video's own finished version of this chart (a different file, shown in the intro at about 11.5–12.1 s, f000289), the same shape is pale green with a dark value label. At 1441–1450 s it is pale blue with a soft glow, laid over the presenter's shot.
timing and easing: Sweep 0–24 f; slice push about 28–44 f; S-curve (0.88, 0.14, 0.12, 0.86) on all keys. This is a strong slow-in/slow-out with the middle about 6–7 × the average speed. Motion blur: not seen switched on, and no smear is visible on the wedge during the push.
variations: The share is just the Trim Paths split value (18 here). Any percentage works by setting the base's Start and the slice's End to the same number. The colours were tried in blue and magenta before lilac. (shown)
pitfalls: If the stroke is thinner than the ellipse is wide, the result is a donut, not a pie. Keep Stroke Width ≥ Ellipse Size. (inferred from the values tried) The push must follow the wedge's centre line, or the gaps on the two straight edges come out uneven. (inferred)
longest on: Trim Paths, duplicating and choosing the colours: about 60 s (1258–1318 s). Then keys and ease, about 34 s (1318–1352). Then setting up the fat-stroke ring, about 28 s (1230–1258), and the slice push, about 19 s (1352–1371).
build notes: Shape layer: "ADBE Root Vectors Group" > "ADBE Vector Group" > "ADBE Vector Shape - Ellipse" (Size 127.9, 127.9) and "ADBE Vector Graphic - Stroke" (Stroke Width 131, colour as above). Delete any Fill. Add "ADBE Vector Filter - Trim" ("ADBE Vector Trim Start", "ADBE Vector Trim End"). Ease by script: `setTemporalEaseAtKey(k, [new KeyframeEase(s, 88)], [new KeyframeEase(s, 88)])` with s from step 10/11. Position is two-dimensional, so it takes one ease per key. Duplicating the shape layer keeps the trim; then set the values per layer.
result: start=1368.3 end=1372.7 animated crop=1820,308,1000,1000 frame=f032870 (comp time display runs 0:00:00:16 → 0:00:02:08 between about 1368.4 and 1370.5 s, then holds at 2:08. The slice's selection corner marks are inside the crop until about 1368.2 s, and the next step's label is being typed inside the crop's right edge by 1373.0 s, so the window is 1368.3–1372.7. The cursor in f032870 is outside the crop.)
before: f030109 (the plain stroked ring before it is fattened into a disc)
unknowns: The stroke's line cap and line join settings (not opened). The exact push key times are read from ruler pixels (±1 f), not from a readout. Whether the comp background is set to black or is empty (renders black either way). Motion-blur switches not legible. The comp's duration.

## Value label that rises in one word at a time
id: 11-label-rises-word-by-word
status: unproven
source: nHh0NRo8G2U 1371–1452 s
jobs: type
what it does for a beat: Puts a short stat sentence next to a chart's highlighted piece ("18% of all ..."). The words pop up one after another two frames apart, so the line reads as it lands.
what it looks like: On a black frame, a single line of white heavy sans-serif lower-case words (the number first, with its percent sign) to the upper right of a pie chart's pushed-out wedge. Each word appears 49 px below its place with no fade and shoots up fast, then settles gently. The five words start 2 frames apart, left to right, so the line ripples up like a short wave. An optional posterised-time finish is then added; its choppy stop-motion feel is the setting's expected effect, not seen played here.
ingredients:
- Text layer, font Satoshi Black (a free font) — built-in text
- DecomposeText (a script that splits a text layer into one layer per word) — free third-party script (said "free", 23:05.8)
- Motion Tools 2 (free script panel), its Sequence layers feature — free third-party script (said "a free plugin", 23:27.6); version 2.1.2 shown f034077
- A keyframe-easing extension — paid; used only to apply an ease, given below as numbers
- Adjustment layers with Posterize Time and Transform — stock (Effect > Time > Posterize Time; Effect > Distort > Transform)
- The pie from recipe 10 (a lilac disc 259 px across centred at 960, 540, with an 18 % yellow wedge pushed 36 px out towards about one o'clock). Only needed so the label has something to sit beside.
steps:
1. Comp: 1920 x 1080 at 23.976 fps, black, with the pie described under ingredients. (1920 x 1080 said; 23.976 shown in the project panel)
2. Type the label as one text layer: white fill, no stroke, Satoshi Black, tracking 0, left aligned. (font and fill shown f033065; alignment inferred from the layout)
   - Size: 36.3 px, leading 30.4 px, Scale 100 % (shown f033099 and f033308, Properties panel). The 73 px seen in f033065 is the value before it was set down. The rendered cap height measures about 26 comp px. (measured)
   - Place it so its left edge is level with the pushed wedge's right-most corner and its cap top is level with the wedge's top: the text starts at comp x ≈ 1093, cap top y ≈ 375, baseline y ≈ 401 (Position 1090, 402, shown f033308). (measured)
3. Run DecomposeText on the layer with "Decompose into: Words" and "Original position using expressions" turned on. Then delete the original text layer. (settings shown f033428; delete said)
   - Result: five text layers, one per word, stacked in reading order top to bottom ("18%", "of", "all", "coffee", "beans"). Each has the same Position (1090, 402) and keeps its word where it sat in the line. (shown f033778)
   - For a script: make one text layer per word. Give each the same font settings and the same Position (the line's start point). Pad each layer's text with the preceding words' width, or set each layer's Position x to that word's original left edge. The script used here does the former with expressions, keeping one shared Position value. (exact expression not shown; how it offsets each word is inferred)
4. On every word layer, key Position from 1090, 451 to 1090, 402: 49 px up (4.5 % of the frame height) over 16 frames. (shown f033778 and keys crops)
   - First key: 1:16 (40 f), value 1090, 451 (shown)
   - Second key: 2:08 (56 f), value 1090, 402 (shown; the key position is read from the ruler, ±1 f)
5. Ease both keys with the curve cubic-bezier 0.04, 0.47, 0.53, 0.93 (the extension's "Fast In" preset). (preset name said; numbers shown f033778)
   - In After Effects terms: out key Influence 4 % with speed 11.75 × average; in key Influence 47 % with speed 0.149 × average. Average = 49 px / 16 f ≈ 73.4 px/s, so out speed ≈ 863 px/s and in speed ≈ 10.9 px/s. (inferred conversion)
   - The result is an almost instant launch that spends most of the move gliding in to rest.
6. Trim every word layer's in-point to its first key, so a word does not exist before it starts to rise. There is no opacity key. (said; in-points shown f034296)
7. Stagger the words 2 frames apart in reading order. (Motion Tools Sequence with offset 2, step 1, descending ladder, shown f034077)
   - In-points and first keys: "18%" 40 f, "of" 42 f, "all" 44 f, "coffee" 46 f, "beans" 48 f. Each word's two keys keep their 16-frame spacing. (measured on the f034296 timeline)
   - So the last word lands at 64 f (2:16).
8. Optional finish: paste two adjustment layers on top of the comp, above the word layers (shown f034516). One has Posterize Time at 12 fps (shown in the comp it was copied from, f018658). The other has a Transform effect with Scale 101 % (shown there, f018865) and a Position expression `posterizeTime(6); wiggle(222,3)` for a whole-frame jitter of about ±3 px every 4 frames (`posterizeTime(6)` and `wiggle(222` shown there; the closing `,3)` inferred).
layout: Measured on f034296 (viewer at 62.7 %, comp edges at full x 1188–2991: 0.939 full recording px per comp px). measured: the line runs from comp x 1093 to 1493: 400 px, 20.8 % of the width, starting 57 % across. Cap top at y 375, baseline y 400–402 (about 37 % down). Cap height about 26 px (2.4 % of the height). The line sits above and right of the pie: its left end is level with the pushed wedge's right-most corner (about x 1097), and its cap top is level with the wedge's top (about y 380); the baseline is about 22 px lower. Word spaces are ordinary spaces at tracking 0. Pure white on pure black; no shadow, no outline, no glow. Each word rises from 49 px below and does not fade in. Motion blur: not on (no smear on the rising words in the played pass).
timing and easing: Per word 16 f rise, curve 0.04, 0.47, 0.53, 0.93, start times 2 f apart (40, 42, 44, 46, 48 f). The whole line is up by 64 f (about 2.7 s into the comp, 1 s after the slice push ends). With Posterize Time 12 over the comp, the rise moves in 2-frame steps. (inferred from the setting; the comp was not replayed after the paste)
variations: Split by characters or lines instead of words (DecomposeText offers these; not shown chosen). Change the stagger offset in Motion Tools for a slower ripple. (inferred)
pitfalls: Delete the original text layer after decomposing, or the full line sits on top of the animated words. (said) Trim the in-points; otherwise each word sits visibly 49 px low before its rise. (said, in effect)
longest on: Keying the rise and choosing the ease, about 19 s (about 1395–1414 s). Typing and styling the label took about 14 s, the stagger about 12 s, decomposing about 10 s and the posterise paste about 5 s. (times approximate, from the frames sampled)
build notes: Text by script: `layer.property("Source Text")` with TextDocument fontSize 36.3, leading 30.4, font "Satoshi-Black" (PostScript name inferred), fillColor [1,1,1], applyStroke false, tracking 0, justification LEFT_JUSTIFY. For a scripted build, skip DecomposeText. Create one text layer per word, set its x from the measured word positions or from the sourceRectAtTime() widths of the line's preceding text, and key Position y +49 → 0. Ease: `setTemporalEaseAtKey(1, [inEase], [new KeyframeEase(863, 4)])` on key 1 and `setTemporalEaseAtKey(2, [new KeyframeEase(10.9, 47)], [outEase])` on key 2. With separated dimensions, apply these to Y Position; otherwise to Position. In-points: `layer.inPoint = key1Time`. Posterize Time match name "ADBE Posterize Time"; Transform "ADBE Geometry2".
result: start=1426.3 end=1430.5 animated crop=1880,440,1110,500 frame=f034296 (comp time display runs 0:00:00:01 at about 1426.2 s to 0:00:03:08 at about 1429.6 s, updating about every 6 frames. The crop holds the pie and the whole line with no UI; the layout holds unchanged until about 1435 s.)
before: f033428 (the single, undivided text layer before it is split into words)
unknowns: How DecomposeText's position expression offsets each word (not shown). The second key time per word is read from the ruler (±1 f). Whether the Posterize/jitter layers change the label's feel: the comp is not played after they are pasted.

## Photo pyramid that dips, then splits into tiers to reveal labels
id: 12-pyramid-tiers-spread-to-reveal-labels
status: unproven
source: nHh0NRo8G2U 1640–1796 s
jobs: depth and finish; energy and impact
what it does for a beat: A hierarchy or "levels" beat. A real-looking pyramid sits whole, gathers itself, then pulls apart into three tiers, and a label appears in each opening gap.
what it looks like: A black-and-white, punchy-contrast photo of a stone pyramid, centred on black. It first squeezes in slightly: the top tier dips down and the base lifts up for half a second. Then the top shoots up and the base drops down in a sudden burst that eases out to rest, while the middle tier stays put. The cut faces show a flat dark grey band under each upper tier, so the slices read as solid blocks. Two small white bold lower-case labels ("level 2" and "level 1") sit in the black gaps, hidden behind the tiers until the gaps open.
ingredients:
- Art (build aid, not the technique): one pyramid photo cut into three tier images on transparent backgrounds. All three are the same canvas size and stay registered when stacked. Each upper tier carries a painted flat dark band along its bottom edge as its cut interior face. When closed, the tier below covers that band; when the tiers part, it shows. (said; the cutting was done in an image editor, 1464–1640 s)
- Three image layers (here smart-object layers from a layered file) — built-in import
- Graph Editor, speed graph — built-in
- A keyframe-easing extension — paid; used only for a starting ease, given below as numbers
- An inertial-bounce expression on Position — built-in expressions; copied from the same video's earlier step-picture comp, where its first two lines are on screen
- Text layers — built-in
- Adjustment layer with Hue/Saturation and Levels — stock (Effect > Color Correction > Hue/Saturation; Effect > Color Correction > Levels)
steps:
1. Comp: 1920 x 1080 at 23.976 fps, black, 16 bpc (Levels shows a 0–32768 range). (1920 x 1080 said; 23.976 shown in the project panel; 16 bpc inferred from the Levels range shown f042749)
2. Import the three tier images and stack them all at Position 960, 540 so they form the whole pyramid. (paste said; positions shown in scratch/12/keys.png)
   - Layer order top to bottom: base, middle, top (shown f040562). Each lower tier covers the dark band of the tier above it.
   - Closed pyramid spans comp x 351–1571 and y 239–840: 63.5 % of the width, 55.6 % of the height, centred. (measured)
3. Key the top and base tiers' Position at 0 f, at about 13 f and at 1:11 (35 f). The middle tier gets no keys. (shown keys.png and f040562; 13 f read from the ruler, ±1 f)
   - Base: 960, 540 → 960, 521 (anticipation, 19 px up) → 960, 761 (221 px below rest)
   - Top: 960, 540 → 960, 555 (anticipation, 15 px down) → 960, 315 (225 px above rest)
   - The base tier also has a fourth Position key at 2:02 (50 f), added at about 1751.8 s and kept to the end (shown f042000, f042198, f042442). Its value reads 960, 762.2, which includes the bounce, so it holds the base where it already rests; it can be ignored.
   - The small opposite move first is the anticipation (said); the big move is the spread.
4. Ease all keys with cubic-bezier 0.88, 0.14, 0.12, 0.86 (the extension's saved S-curve). (preset said; numbers shown f040562)
   - In After Effects terms, Influence 88 % in and out, with speed at each key 0.159 × that segment's average speed. (inferred conversion)
5. Open the speed graph and reshape the anticipation segment so it is gentle and the spread is the burst. (said; shown f041085 and f041133)
   - The 0 f key's outgoing handle is dragged down to Speed 0.00 px/s, Influence 24.57 % (shown about 1714.0 s, tooltip, scratch/12/drag.png; the 41.61 px/s readings at 29.48 % (f041085) and 43.24 % (about 1713.0 s) are mid-drag, and the settled graph f041133 starts at zero speed)
   - Speed at the 13 f key: roughly 35–40 px/s (read off the f041085 graph)
   - Final speed graph (shown f041133): a small hump of about 150 px/s at about 2 f, falling to about 40 px/s at 13 f. Then the spread spikes to a sharp peak of about 1850 px/s at 24 f (1:00) and falls to about 30 px/s at 35 f. (peak values read off the graph, ±10 %)
   - Before the edit, the anticipation hump peaked near 500 px/s (shown); the edit cut it to about a third.
6. Add an inertial-bounce expression to the three tiers' Position. It is copied with Copy Expression Only from the step pictures' Scale in the earlier comp, and pasted onto the tiers. (said 28:38.9–28:51.1; Copy Expression Only shown about 1732 s; values turned red, shown about 1740.5 s, scratch/12/exprred.png)
   - Its first lines, `amp = .1;` and `freq = 2.0;`, are shown in that earlier comp (f012940). The rest is not on screen; the standard form below, with decay 2.0, is inferred there from a measured overshoot:
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
   - Measured effect: small but visible. At 1:12 the base reads 960, 763.0 against its 761 key and the top 960, 313.1 against 315, about 2 px past the key (shown f042749).
7. Add the labels as white, bold, lower-case, centred text layers. In the stack, put them below the tier layers so the tiers hide them until the gaps open. Then trim both labels' in-points to about 17 f (said 29:16.8; label bars starting at about 0:17 shown f042442 and f042749), so neither can peek past the pyramid's narrow top during the 0–13 f squeeze (reason inferred).
   - "level 2" centred in the upper gap: comp y 312–342, x 904–1014 (measured)
   - "level 1" centred in the lower gap: comp y 744–774, x 909–1010 (measured)
   - The ascender height is about 30 px, so the size is about 40 px (inferred). The font is a heavy geometric sans (inferred from shape; not named here).
8. Add an adjustment layer on top with Hue/Saturation and Levels. (shown f042749)
   - Hue/Saturation: Master Saturation −100, Master Lightness 0 (shown)
   - Levels (16 bpc): Input Black 3469.6, Input White 25186.4, Gamma 1.00, Output Black 0, Output White 32768 (shown). In 8-bit terms, Input Black 27 and Input White 196 (computed).
9. Precompose the tiers and labels for later reuse. (said about 1790 s; the precomp layer is seen in f043239; the labels are inside it, since they scale with the tiers when the precomp is enlarged, f044268)
layout: Measured on the settled spread at 1:12 (cut from the source at 1790.0 s, scratch/12/r1790.png; viewer at 50 %). measured: top tier y 13–258, x 753–1210. Middle tier y 399–663, x 513–1401. Base y 821–1064, x 351–1568. The black gaps are about 141 px (top to middle) and 158 px (middle to base). The labels sit in the vertical centre of those gaps; the top tier nearly touches the frame top (13 px) and the base nearly touches the bottom (16 px). The dark interior band renders flat grey level 44/255 after the grade. In colour it was a dark olive, painted as a flat fill. The photo renders full black-and-white with crushed blacks and bright highlights (from Levels). Background pure black, apart from faint dotted stray edge pixels in the black beside the tiers. These come from the art's cut edges, and the Levels push makes them show. No shadow between tiers, no blur, no grain beyond the photo's own texture. Motion blur: not seen switched on; the burst frames show no smear (only stepped positions).
timing and easing: Anticipation 0–13 f (≤19 px). The spread is 13–35 f with peak speed about 1850 px/s at 24 f, then settles by 35 f (1:11). Middle tier still. The burst is the point: the top and base each cover about 240 px in under a second, most of it in the 6 frames around 24 f.
variations: The same idea works with any layered photo object: buildings, cakes or stacks. More tiers give more labels. A finished version in the same video (a different file, about 1870–1872 s) sits on a white grid with tilted grey tiers. (shown)
pitfalls: If the labels sit above the tiers in the stack, they show over the closed pyramid. Keep them below. (said) Without the painted interior band, the parted tiers look like thin paper cut-outs. (inferred from the build aid's purpose)
longest on: Preparing the tiers in the image editor, about 176 s (1464–1640), but that is a build aid. In After Effects: the keys and speed-graph shaping, about 90 s (1641–1730); the labels about 27 s (1743–1770); the black-and-white grade about 19 s (1771–1790).
build notes: Position keys by script, then `setTemporalEaseAtKey` per key. To match the shown speed graph: key 1 (0 f) gets out speed 0 px/s with Influence 24.57 % (shown). Key 2 (13 f) gets in/out speed ≈ 35–40 px/s (read off the graph). Key 3 (35 f) gets incoming speed ≈ 30 px/s and Influence ≈ 88 % or higher, so the peak lands near 24 f. Set `position.expression` on all three tiers to the text in step 6. Effects: "ADBE HUE SATURATION" (Master Saturation −100); "ADBE Easy Levels2" (in a 16 bpc project, Input Black 3469.6/32768 = 0.1059, Input White 25186.4/32768 = 0.7686 as normalised values). Labels: text layers moved below the tier layers with `moveAfter`.
result: start=1788.0 end=1793.5 still crop=1650,282,1712,956 frame=1790.0 s (not a kept frame: cut from source.mp4 at 1790.0 s, saved as scratch/12/r1790.png; comp time holds at 0:00:01:12 throughout. The comp edges are at 1642,274,1728,972; selection-handle marks sit on the edges, so the crop is inset 8 px.) The animated spread plays at about 1796–1799.5 s (comp 0:00 → 1:04, partial).
before: f040562 (closed pyramid with the keys being set)
unknowns: The bounce expression's lines after `freq = 2.0;` (decay 2.0 inferred). The label font and exact size. The anticipation key time (about 13 f, from the ruler). The speed values other than the one tooltip (read off the graph).  Whether the grade adjustment layer went inside the precomp.

## Cut mid-move to a close-up, carried by a shared upward drift
id: 13-match-cut-carried-by-movement
status: unproven
source: nHh0NRo8G2U 1796–1872 s
jobs: transitions
what it does for a beat: Moves from an overview to a detail without a visible transition. At the fastest moment of an animation, the shot cuts to a doubled-size view of the same animation. Both shots drift upward through the cut, so the eye reads one continuous move. A later slide down then visits the next detail.
what it looks like: A whole black-and-white photo pyramid starts splitting into tiers. At the instant the tiers fly apart, the picture jumps to a close-up about twice as big. The close-up shows the left half of one opening gap, with a white label ("level 1") in the left third of the frame between two big stone slabs. Before the cut the wide shot is sliding up, and after it the close-up keeps sliding up, then eases to rest. Under the upper slab's stone edge, a wide flat grey band (the tier's painted cut face) makes the slab read as a solid block. About a second later, the close-up glides straight down in one smooth S-curve move to the next gap and its label ("level 2"). The whole thing steps at a low frame rate, like stop-motion. The glide and the stepping are what the keys and settings give; neither is seen played here (the glide is only scrubbed, and the stepping is pasted after the only playback).
ingredients:
- A precomp with the animation to cut inside: recipe 12-pyramid-tiers-spread-to-reveal-labels. — built-in precomp. What the close-up needs from it:
  - Three registered tier images of a stone pyramid photo. Closed, they span x 351–1571, y 239–840. The middle tier stays at 960, 540; the top moves 960, 540 → 555 → 315 and the base 960, 540 → 521 → 761, at 0, 13 and 35 f. The burst peaks at about 1850 px/s at 24 f, and an inertial bounce adds about 2 px past the key.
  - Settled boxes at 1:12: top y 13–258, x 753–1210; middle y 399–663, x 513–1401; base y 821–1064, x 351–1568.
  - Each upper tier carries a painted flat dark band along its lower edge as its cut face. It renders flat grey about level 44/255 after the grade, and the tier below hides it while closed.
  - Grade on an adjustment layer: Hue/Saturation Master Saturation −100; Levels Input Black 27, Input White 196 in 8-bit terms (3469.6 / 25186.4 in the 16 bpc project), gamma 1.0. The result is black-and-white with crushed blacks.
  - White bold lower-case labels sit inside the precomp in the gaps, below the tiers in the stack, trimmed to start at about 17 f: "level 2" at comp y 312–342 and "level 1" at y 744–774, both centred near x 960.
- Split Layer (Edit > Split Layer, Cmd/Ctrl+Shift+D) — built-in (said "split the layer"; menu inferred)
- Position and Scale keys — built-in
- A keyframe-easing extension — paid; only applies an S-curve ease, given below as numbers
- An adjustment layer with Posterize Time — stock (Effect > Time > Posterize Time)
steps:
1. Comp: 1920 x 1080 at 23.976 fps, black. The precomp layer is at Position 960, 540, Scale 100 %. (1920 x 1080 said; 23.976 shown in the timeline f044268)
2. Split the precomp layer at 1:01 (25 f), the moment the inner animation is moving fastest. (said; time display 0:00:01:01 shown, scratch/13/keys.png first tile, about 1803 s)
   - Lower layer ("first piece"): 0 f to 1:01. Upper layer ("second piece"): 1:01 onward. (shown f044268, layer bars)
3. Scale the second piece to 206 % and move it so the close-up frames the left half of the lower gap with its label. (said "scale it up and position it over to the side"; Scale shown about 1806 s, keys.png, scrubbed 100 → 110 → 206.0 %)
   - Rest Position of the second piece: 352, 134 (shown f044268)
   - The first piece keeps Scale 100 % (not changed on screen; inferred).
4. Key Position on both pieces at 0:18 (18 f) and 1:10 (34 f). That puts the cut at 25 f, inside both moves. (said "keyframe it to both"; key times read from ruler pixels in f044268, ±1 f)
   - First piece: 960, 540 → 960, 387 (153 px up) (shown keys.png, about 1838–1848 s)
   - Second piece: 352, 333 → 352, 134 (199 px up) (shown keys.png, values at 0:00 and 1:23)
   - So before the cut the wide shot is drifting up, and after the cut the close-up is also drifting up. That is the "upward flow" that hides the cut. (said, in effect)
   - Both moves look eased (hourglass key icons, shown f044268). The extension panel beside them shows the same S-curve 0.88, 0.14, 0.12, 0.86 selected (shown f044268), but applying it is not shown. (preset inferred)
5. Put a Posterize Time adjustment layer on top of the comp, pasted from another comp: Frame Rate 12. (said "posturized time"; one pasted layer, "Adjustment Layer 2", shown at the top of the stack about 1856.4 and 1863.5 s; in the comp it was copied from, the layer of that name is Posterize Time at 12.0, shown f018658)
   - Only this one layer is pasted. The jitter Transform layer in that comp ("Adjustment Layer 3", f018865) is not. (shown)
6. Optional second stop: add two more Position keys on the second piece to slide down to the next label. (said; shown keys2.png)
   - 2:21 (69 f): 352, 134 (a copy of the rest value, a hold key)
   - 3:18 (90 f): 352, 1024 (890 px down, over 21 f) (shown about 1863 s; first dragged to 352, 1030, then set to 1024)
   - 890 px is exactly the gap between the two labels inside the precomp (744 − 312 = 432 px) × 2.06. So the move lands "level 2" where "level 1" was. (computed)
   - Ease both keys with cubic-bezier 0.88, 0.14, 0.12, 0.86. (said "60 speed"; numbers shown about 1867.5 s, scratch/13/flow.png, with Apply under the cursor)
   - In After Effects terms: Influence 88 % in and out; speed at each key 0.159 × (890 px / 21 f ≈ 1016 px/s) ≈ 162 px/s. (inferred conversion)
layout: Measured on f044268 (viewer at 50 %; comp edges at small-frame x 821–1685, y 137–623, so 0.45 small px per comp px). Close-up at rest (1:23): "level 1" spans comp x 242–458, y 551–618: the label is in the left quarter of the frame, a little below centre, and about 62 px tall (5.7 % of the height). The upper slab (the middle tier) fills the top of the frame. Its stone ends at y ≈ 273 at the left. Below that runs its cut-face band, flat mid-grey: y 274–402 at x 100 (about 127 px, 12 % of the frame height), 325–397 at x 600 (72 px) and 374–389 at x 1100 (16 px). The slab's lower edge, band included, runs from y ≈ 403 at the left to ≈ 390 near its right tip (x ≈ 1264). (column profile of f044268) The lower slab (the base) rises from the bottom to a top edge from y ≈ 733 at the left to ≈ 855 at its right tip (x ≈ 1498). Black beyond the tips on the right. Check: 352 + 2.06 × (909 − 960) = 247, and 134 + 2.06 × (744 − 540) = 554, which matches the measured label. Wide shot before the cut: the whole pyramid centred, 1220 × 601 px when closed. Faint dotted stray pixels from the art's cut edges show in the black to the right of the slab tips; they come from the precomp's art, not from a step. Everything is grey-scale with deep blacks (from the precomp's grade). Motion blur: not seen on.
timing and easing: Cut at 25 f. Upward drift keys 18 f → 34 f on both pieces (16 f), the cut 7 frames into the drift. The inner tier burst peaks at 24 f, one frame before the cut. Hold until 69 f, then slide down 890 px over 69 → 90 f with the S-curve. Posterize Time 12 fps over all of it (value shown in the source comp).
variations: Cut to any second framing of the same precomp (other label, other side). The drift can go in any direction, as long as both pieces share it. (inferred)
pitfalls: The cut must land while things are moving fast. If it lands on a still moment, it reads as a jump cut. (said, in effect: "pretty rough cut" before the drift was added) The two pieces must drift the same way, or the cut breaks. (said, in effect)
longest on: Keying both pieces' drift, about 30 s (1816–1846). The split and reframe took about 20 s (1796–1816), the extra slide down about 11 s (1857–1868) and the Posterize paste about 10 s (1846–1856).
build notes: Split by script: `var b = layer.duplicate(); layer.outPoint = t; b.inPoint = t;` (equivalent to Split Layer) with t = 25/23.976 s. Second piece: `transform.scale.setValue([206,206])`. Position keys as above, then `setTemporalEaseAtKey(k, [new KeyframeEase(s, 88)], [new KeyframeEase(s, 88)])`. The drift keys' speeds are not shown; use the S-curve conversion (s = 0.159 × 153/16 × 23.976 ≈ 36 px/s for the first piece and 0.159 × 199/16 × 23.976 ≈ 47 px/s for the second). Posterize Time match name "ADBE Posterize Time" (Frame Rate 12).
result: start=1843.8 end=1849.5 animated crop=1642,274,1728,972 frame=f044268 (the comp time display shows 0:00:00:00 from about 1843.75 s and 0:00:01:23 from about 1845.25 s, then holds at 1:23 until about 1849.5. At 1843.5 the viewer still shows the settled close-up from before the replay; it shows the closed pyramid from about 1843.9 to 1844.5 and the "level 1" close-up from about 1845. Only the drift part is played, before the Posterize paste and the slide down. The slide to "level 2" is only scrubbed, at about 1864.5–1868.5 s.)
before: f043239 (the single precomp layer just after the split, before scaling)
unknowns: The ease on the drift keys (eased icons and the S-curve preset are visible, but applying it is not shown). The drift key times are read from the ruler (±1 f). The comp's duration and work area. A full real-time playback of the finished cut with the slide down is not shown.

## Pinned instant photos swaying on a grey map
id: 14-pinned-photos-swaying-on-a-map
status: unproven
source: nHh0NRo8G2U 1877–2107 s
jobs: layout and repetition; depth and finish; texture; B-roll scenes
what it does for a beat: Marks a few places on a map with small pinned instant photos that hang and sway a little, so a travel or "where it happened" beat feels hand-made and alive while the camera holds or moves over it.
what it looks like: An old printed two-page world map, turned grey and lifted in contrast, with three small instant-photo prints (white frame, thick bottom border, soft shadow) each held by a red pushpin at its top centre. Each print slowly rocks a few degrees around its pin; the pins do not move.
ingredients:
- Hue/Saturation — stock; Effect > Color Correction > Hue/Saturation (inferred menu)
- Levels — stock; Effect > Color Correction > Levels (inferred menu)
- Adjustment layer — built-in; Layer > New > Adjustment Layer (inferred menu)
- Pre-compose — built-in; Shift+Cmd+C, "leave all attributes" option (said)
- Pan Behind (anchor point) tool — built-in; Y key (said)
- Null object — built-in; Layer > New > Null Object. The author used a free null-making extension (said); its nulls show as shape-type layers with an fx switch (shown f050491). A plain null does the same job (inferred)
- wiggle() expression on Rotation — built-in; Alt-click Rotation's stopwatch (said, shown f050087)
- Art: a large scan of an old printed world map, an empty instant-photo frame PNG with a soft drop shadow baked in, a red pushpin PNG with its own shadow baked in, and one photo per place (generated landscape pictures: mountains, a green valley, a sunny jungle)
steps:
1. Import the map scan and the art. The scan is very large. (said, shown f046054)
   - Map scan size: 9786 x 6309 px (shown f046054; the narrator says a rounder figure, the panel wins)
   - Project bit depth: 16 bpc (shown f046054)
2. Pre-compose the map layer, keeping all attributes, into a map precomp. Everything below is built inside that precomp. (said; shortcut said)
   - Precomp length: 0:00:15:00 at 23.976 fps (shown f046054)
   - The outer comp the precomp sits in is 1920 x 1080 at 23.976 fps (said; size also inferred from the camera dialog in recipe 16)
3. Add an adjustment layer directly above the map and give it Hue/Saturation to remove the colour. (shown f046196)
   - Channel Control: Master; Master Saturation: −100; all else default (shown f046196)
4. Add Levels to the same adjustment layer, below Hue/Saturation, to deepen the ink and brighten the paper. (shown f046268)
   - Channel: RGB (shown f046268)
   - Input Black: 2056.0 (16 bpc scale) ≈ 16 on an 8-bit scale (shown f046268; 8-bit figure inferred)
   - Input White: 28784.4 (16 bpc scale) ≈ 224 on an 8-bit scale (shown f046268; 8-bit figure inferred)
   - Gamma: 1.00; Output Black: 0.0; Output White: 32768.0 (shown f046268)
   - Clip To Output Black / White: "Off for 32 bpc Color" (defaults, shown f046268)
5. Above the adjustment layer, place one photo, the instant-photo frame on top of it, and the pushpin on top of both. The photo sits inside the frame's window. (said, shown f047165)
   - Frame layer Scale: 479% (shown f047165; depends on the frame PNG's own size)
   - Photo scaled to fill the frame's window, about 88% of the frame's width and the top ~75% of its height (inferred from the result frame)
6. Rotate the pushpin slightly so its baked shadow falls naturally, scale it up a little, and centre it on the frame's top edge using the grid and proportional grid. (said)
7. Duplicate photo + frame + pin once per place and swap in each place's photo. Colour-label each set (the author uses one label colour per place). (said, shown f049444)
8. Pre-compose each photo + frame pair (not the pin) into its own precomp named for the place. (said, shown f049444)
9. With the Pan Behind tool, drag each photo precomp's anchor point up to the pin's point, so it will swing from the pin. (said, shown f048568 mid-drag)
10. Select the pin and its photo precomp, create a null, and parent both to it. One null per place. (said; at f049444 only the North-America set is done — one null, with that pin and print parented to it, the other sets still "None" with their eyes off; by f050317 all three nulls exist, each parenting its own pin and print, the nulls themselves unparented, shown f050317, f050491)
11. Scale each null down and move it onto its place: one on North America, one on western Europe (France), one on Asia. (said; P and S shortcuts said)
12. On the first photo precomp, Alt-click the Rotation stopwatch and type a wiggle. (said, shown f050087)
   - First try: wiggle(1,10) (shown f050087)
   - Final: wiggle(.5,10), i.e. half a sway per second, up to about 10° either side (shown f050317)
13. Copy the expression and paste it onto the other two photo precomps' Rotation. (said, shown f050491: each photo precomp has Rotation with an expression; one reads wiggle(.5,10))
   - Readouts at the same moment differ per print, because each layer's wiggle has its own random seed: −3.7°, +0.2°, −2.3° (shown f050491)
layout: Measured on the 20% viewer at f050563 (picture region in the full-size frame: x 850–3340, y 190–1210). The result view is a crop of the map at the editor's zoom, not the whole page: the map runs past all four edges, showing only its middle band (from the northern empire lettering down to the southern-ocean lettering), about 64–65% of the map's width, centred on the centre gutter, which runs vertically through the middle; the page edges, the far-north ocean and the bottom cartouche are outside it (measured; width share inferred from the viewer scale). To match it, frame that band, not the whole page. Each print is small: the western-Europe print about 4.4–4.6%, the Asia print about 4.2–4.4% and the North-America print about 3.5% of the crop's width (measured); North America's print is the smallest; cross-checked against the 51 px border stroke of recipe 15, a print is about 250–330 map px wide, about 3% of the 9786 px map width (measured, ±20%). Print height ≈ 1.18 × its width (measured). The photo fills the top ~75% of the print's height and ~88% of its width, leaving a thick white bottom border (measured). The pushpin is about 11% of the print's width, centred on the print's top edge and overlapping it (measured). Each print carries a soft, fairly even shadow halo all round, a little heavier below, and each pin a small shadow of its own, both baked into the PNGs (shown f047165), not made by a step. Grey map tones on the rendered viewer: paper about 230, ink about 48 of 255, median 203 (measured f053387); the old paper's blotches and fold shading come from the scan itself. The adjustment layer sits below the prints, so the photos and the red pins stay in full colour over the grey map (shown f049444, layer order). Stack inside the map precomp, top to bottom: per place [null → pin → photo precomp], then the highlight and border shape layers of recipe 15 (Multiply), then the adjustment layer, then the map (shown f052839). Motion: each print rocks about its pin; speed comes from the expression, wiggle(.5,10): about half a random change a second, up to ±10° either side (shown f050317). The recorded preview cannot time it: the comp time display stays frozen at 0:00:00:21 through it (shown 049918–050063). The pins and the map do not move.
timing and easing: No keys. Rotation is driven by wiggle(.5,10): about 0.5 random changes per second, amplitude up to ±10° (shown f050317). Readouts: −4.4° at 0:00:03:16 with wiggle(1,10) (shown f050087); +8.4° at 0:00:05:14 with wiggle(.5,10) (shown f050317). The preview's start is not readable; the display holds at 0:00:00:21 while it plays (shown 049918–050063).
variations: The author first used a sway of one per second and slowed it to half (shown f050087, f050317). A plain null replaces the extension's null (inferred). A tape PNG was tried as the holder and deleted in favour of the pin (said).
pitfalls: Put the anchor point at the pin before adding the wiggle, or the print spins around its own centre instead of hanging (said, inferred). Keep the pin outside the photo precomp so it does not rotate (shown f049444). Put the prints above the grey adjustment layer, or they turn grey too (shown f049444).
longest on: Setting up the prints, pins, their precomps and nulls: about 2 min, from about 1940 s to 2067 s (f046513–f049556). The grey grade is on screen for well under 30 s (Hue/Saturation and Levels shown at f046196–f046268), and the wiggle for about 25 s (f049900–f050491, ≈2081–2106 s). Timed from frame numbers.
build notes: Hue/Saturation is "ADBE HUE SATURATION" ("Master Saturation"); Levels is "ADBE Easy Levels2" (Input Black, Input White, Gamma, Output Black, Output White; values by script are on a 0–1 scale: Input Black ≈ 0.0627, Input White ≈ 0.8784). Set the anchor point by script to the pin's point in layer space and offset Position by the same amount so nothing jumps. Parent with layer.parent = null layer. Rotation expression: wiggle(.5,10). In 8 bpc the Levels values are the 8-bit figures above. Everything is scriptable.
result: start=2106.7 end=2110.5 still crop=850,190,2490,1020 frame=f050563
before: f046054 (the same map in its original colour, before the grey grade)
unknowns: The exact anchor-point values and each null's position and scale. The photo precomps' own size and duration. The pin's rotation and scale values. The photos' scale inside the frame. Whether the result clip is the live comp or an earlier save (the time display holds at 0:00:08:11 through the window, so it is a still view of the build).

## Ink-blend place highlights and a self-drawing border on a grey map
id: 15-map-highlights-and-border-trace
status: unproven
source: nHh0NRo8G2U 2107–2234 s
jobs: lines and shapes; glow and colour; texture; B-roll scenes
what it does for a beat: Points at a region on an old map with soft coloured blobs that look printed into the paper, and draws a country's outline on cue, for "here is where it happened" beats in a travel or history piece.
what it looks like: On a grey, contrasty old world map, translucent cyan ovals sit over three places like watercolour washes (the map's lines show through them), and a thick mustard-yellow line traces around the United States, drawing itself from the top middle round the outline; in the result it is about 98% drawn, with a short undrawn piece left at the top middle. Where the cyan and the yellow overlap the paint reads green.
ingredients:
- Ellipse shape layer with fill — built-in; Ellipse tool on the toolbar (inferred)
- Pen-drawn shape layer with stroke — built-in; Pen tool (said)
- Multiply blend mode — built-in; layer Mode column (shown f051218)
- Trim Paths — built-in; shape layer Contents > Add > Trim Paths (said; menu inferred)
- Hue/Saturation and Levels on an adjustment layer for the grey map — stock (shared set-up, below)
- A keyframe-easing extension's curve preset (an extension; the same curve can be typed as a cubic bezier or set by influence, below)
steps:
1. Shared set-up, as in recipe 14: inside a map precomp (scan 9786 x 6309 px, 16 bpc project, 23.976 fps, 15 s), an adjustment layer above the map with Hue/Saturation Master Saturation −100 and Levels Input Black 2056.0 / Input White 28784.4 on the 16 bpc scale (≈16 / 224 on 8-bit), Gamma 1.00, Output 0.0–32768.0. (shown f046196, f046268)
2. Draw an ellipse over the first place (western Europe, around Paris). Remove its stroke and give it a fill. (said, shown f051218)
   - Fill Color: swatch about RGB 31, 201, 248 (#1FC9F8) (shown f051218, sampled from the swatch). Wide-gamut warning: this is a saturated mid-tone sampled from the recording, so the swatch reading itself may be inflated by the display gamut; treat it as approximate (inferred).
   - Scale: 189% (shown f051218; depends on the drawn ellipse's size)
   - Mode: Multiply (shown f051218)
3. Place the ellipse layer just above the grey adjustment layer and below the pushpins and photos. Being above the adjustment layer keeps it in colour. (said; layer order shown f051832, f052839 — words and screen agree)
4. Duplicate it, scale the copy up and move it over the south of North America (around New Orleans); duplicate again for Asia. All three stay in Multiply. (said, shown f051832)
5. Solo the map and draw a closed-looking outline round the mainland United States with the Pen, on a new shape layer. (said, shown f052209)
   - Fill: None (shown f052618)
   - Stroke Width: 51 px (scrubbed down from about 101, shown f052618)
   - Stroke Color: swatch about RGB 231, 193, 79 (#E7C14F) (changed from blue at f052660; shown f052839). Wide-gamut warning: this is a saturated mid-tone sampled from the recording, so the swatch reading itself may be inflated by the display gamut; treat it as approximate (inferred).
   - Mode: Multiply (shown f052839)
6. Place the border layer just above the adjustment layer, below the three ellipses. (shown f052839)
7. Add Trim Paths to the border's contents, keyframe End, and set the first key to 0%. (said, shown f053307)
   - End: 0% at about 0:00:00:13, 100% at about 0:00:01:21 — about 32 frames, 1.33 s (shown f053387; read from key positions on the ruler, ±1 frame)
   - Start: 0%; Offset: 0° (defaults, inferred)
   - The keys first sat at about 0:00:00:21 and 0:00:01:14 and were moved earlier before the result (shown f053307 then f053387)
8. Apply the extension's slow-in, slow-out curve to both End keys. (said, shown f053387)
   - Curve values: 0.88, 0.14, 0.12, 0.86 (a cubic bezier) (shown f053387)
   - Check: the readout of 97.9% at 0:00:01:18 matches this bezier (98.1% predicted), so the curve is applied (measured)
9. Preview. (shown 053290–053339; the preview's comp range is not readable — the time display holds at 0:00:00:21 while it plays and reads 0:00:01:18 only after it stops, shown f053387)
10. The comp is never played past 0:00:01:18 here: End reads 97.9% and the author fits the view and leaves the precomp (shown f053387, f053411, f053459). Running End on to 100% closes the outline (inferred from f052839, where the untrimmed stroke is continuous across the start point).
layout: Measured on the result frame f053387 (viewer picture region in the full-size frame: x 1004–3840, y 146–1378). The border's bounding box spans x 15.5–75.4% and y 15–90% of that picture (measured). The North-America oval's centre is at about (49.6%, 68.7%) of the picture, its diameter about 14.8% of the picture width (measured), about 0.75 × the width of the nearby photo print (the print is about 19.7% of the picture width). The stroke is about 15% of that print's width; the 51 px stroke measures about 92–100 full-size px thick on the result frame, i.e. ≈1.8–1.95 full-size px per comp px (measured). In scene-free terms: the stroke is about 1/20 of the outline's width, and an oval is roughly the size of a large region (a few states, or half of France and its neighbours). Colour as rendered: cyan over paper ≈ RGB 3, 158–183, 188–221; yellow over paper ≈ RGB 209, 173, 35; cyan over yellow reads green; the map's black ink shows through both because of Multiply (measured f053387). Wide-gamut warning: these saturated mid-tones render darker and more saturated than the swatch (the cyan's red of about 3, where swatch × paper would give about 28, points to display-gamut inflation of both the swatch and the render), and a different working colour space will shift them, so treat both as approximate. The pins and photo prints (recipe 14) sit above all shapes and stay in full colour (shown f052839). Stack inside the map precomp, top to bottom: per place [null → pin → photo precomp], ellipses 1–3 (Multiply), border (Multiply), adjustment layer, map (shown f052839). Draw direction (measured on preview frames): the line starts at the top middle of the US near the Great Lakes, runs west along the northern border, down the west coast, east along the Gulf, up the east coast and back west along the top; in the result a short gap remains at the top centre: that is the last 2.1% of the path, not yet drawn at End 97.9% (shown f053387; at f052839, before Trim Paths, the stroke is continuous there). In the finished tour (recipe 16) the trim keys are moved so the outline draws as the camera arrives over North America (said; montage frames 58792–58816 show it a short piece and then nearly closed).
timing and easing: Trim Paths End 0% → 100% over about 1.33 s (32 frames) with a strong slow-in, slow-out: cubic bezier (0.88, 0.14, 0.12, 0.86) (shown f053387). As an After Effects ease (inferred conversion): influence 88% on both keys, speed at each end about 0.16 × the average, peak in the middle about 7 × the average. The ovals do not animate.
variations: The stroke was tried at about 101 px and reduced (shown f052618). The stroke was blue first and changed to yellow (shown f052660). The ovals are one ellipse duplicated and rescaled per place (said).
pitfalls: Leave the shapes above the grey adjustment layer or they turn grey (shown f052839). Use Multiply, not Normal, so the map's lines show through (shown).
longest on: The ovals: about 50 s (f050600–f051832, ≈2108–2163 s), then the border path and its stroke about 26 s (f052209–f052839, ≈2178–2204 s) and Trim Paths with the curve about 21 s (f052900–f053387, ≈2206–2227 s). Timed from frame numbers.
build notes: Shape layer contents: "ADBE Vector Shape - Ellipse", "ADBE Vector Graphic - Fill" (Color 0.122, 0.788, 0.973), "ADBE Vector Graphic - Stroke" (Color 0.906, 0.757, 0.310, Stroke Width 51), "ADBE Vector Filter - Trim" (Start, End, Offset). layer.blendingMode = BlendingMode.MULTIPLY. The border path's vertices are hand-drawn round the scan's own coastline; by script, trace it from the map (or sample points along the scan's US border) — the shape follows the artwork. Ease by script: on a 0→100% End move over 1.33 s the average speed is about 75 %/s; KeyframeEase(12, 88) as the first key's out-ease and the last key's in-ease reproduces the curve (handles 0.88, 0.14 and 0.12, 0.86). KeyframeEase(0, 88) would give zero speed at the ends, i.e. (0.88, 0, 0.12, 1), a close but stronger approximation. Layer order: moveAfter/moveBefore relative to the adjustment layer.
result: start=2227.0 end=2227.3 still crop=1004,146,2836,1232 frame=f053387
before: f052839 (ovals and the full border before Trim Paths; f050803 shows the map with prints only)
unknowns: Each ellipse's drawn size and position in map pixels (only Scale 189% for the first is shown). The exact path vertices. Whether the ellipse had any feather (none visible). The other ovals' scale values. The exact key times (read ±1 frame). The extension's preset name and whether the curve is its default.

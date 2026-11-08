# Whiteboard explainer

> An explainer drawn live on one glossy dry-erase board: single-line handwriting that is actually written stroke by stroke, floating markers with no hand, magnets that hold things up, and a camera that travels across the board instead of cutting.

Adapted for native After Effects from Lemo-Opuscar's *Whiteboard Explainer* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only: never copy RSA Animate, Cognitive Media or minutephysics drawings, characters, hands or music.

## 1. What it is, and what it is not

One physical whiteboard. Everything the viewer learns is drawn in dry-erase marker in front of them, in real writing order, finishing on the word the voice says. The board is a map: each idea lives in its own region, and the camera travels between regions, often led by the pen; distance on the board is distance in the argument. Real marker, not animated type: strokes wobble, overshoot and don't quite close, ink darkens where it overlaps, ghosts of old lessons remain, a glossy sheen drifts slower than the board. No hands: markers float with a cast shadow that grows when they lift, park outside the frame between phrases and fly back in. Magnets are the only things that move on the board.

Not Blueprint (no blue sheet, no drafting conventions), not a crayon picture book (no wax, no children's story), not kinetic type (text is written stroke by stroke, never animated as blocks), not a screen recording.

## 2. Grammar

- **Board.** A warm white `#F8F7F3` with a soft radial falloff, a faint scuff, about thirty **ghost marks** (old words, circles, arrows) at 9 to 11% in grey or pale blue, and a couple of dozen eraser smears at 5%. A soft diagonal **window sheen** (white, Add, 5%) moves at 0.35 x the camera: the detail that sells "glossy". The board is 3600 x 5400 in an aluminium frame with a tray, on a grey wall; the frame and wall show only when the camera pulls back past the board edge.
- **Ink.** Three markers at most, each with a meaning held for the whole film: dark `#23262C` for things and structure, blue `#2A5CB3` for signals, process and arrows, the accent `#D97757` for the one thing that matters in each region (one accent mark per region). Ink layers multiply onto the board at 94%, so overlaps darken like marker. Drawing width 8 to 9 px, accent marks 12 to 13 px, lettering about 10% of cap height (6 to 22 px).
- **Stroke character.** Every stroke is resampled every ~0.6 x its width with a long, low hand wobble along the normal (a few px, a wavelength of 260 to 480 px) and a fine tremor; lines overshoot their ends and bow slightly; circles start at an angle and overlap past closure; boxes are four strokes with corner overshoot. A stroke shorter than its width becomes a dot (punctuation survives).
- **Lettering.** Single-line handwriting only: EMS Tech (OFL; a single-stroke derivative of Architects Daughter), written in the font's own stroke order, each glyph with a small rotation, baseline and scale jitter. Titles 140 to 230 px cap height, labels 66 to 120 px, a hero number up to 400 px. Lower case for sentences, capitals for titles.
- **Subtitles.** Burned in: an off-white rounded label at 90% with a faint shadow, Architects Daughter 46 px in the dark ink, a short accent dash at its left. Bottom 12% of the frame is kept free of board content in every shot.
- **Motion.** Every stroke follows a slow-fast-slow curve (`u - sin(2 pi u) / 2 pi x 0.8`); the strokes of a word share the word's spoken window, each stroke getting time for its length plus a floor, each lift a short hop. Writing finishes on the word. A label takes 0.2 to 0.6 s, a title about a second. Faster than a real hand, never so fast the stroke order is lost.

## 3. Camera grammar

A 2D camera over a big board: a `ZOOM` null scales about the frame centre, a `PAN` null (its child) slides the board, and both are baked per frame from one function, so the pens and the speckle can follow it exactly. Zoom eases in 1/z so pushes feel like dollies; long moves dip out up to 22% at their middle.

| Move | Expresses | In AE |
|---|---|---|
| Travel to the next region | the next idea, on the same board | PAN eased (cubic in-out) over 0.3 to 0.35 s with a small zoom dip, starting just before the beat so the pen leads |
| Hold still | read now | no change between keys |
| Return to an earlier region | a callback, for free | a whip (0.3 s, 22% dip) back to the earlier region |
| Ride the line the pen is drawing | one thing leads to the next | PAN follows the arrow with a gentle slow-fast-slow while the pen draws it |
| Slow push into one symbol | this term is the point | zoom 1.0 to 1.05 over the hold |
| Pull back past the board edge to the wall | the whole lesson as one picture | zoom to 0.265 on the board centre: frame, tray, wall and every region at once; the pens fly into the tray |

No cuts on the board, no dissolves. Motion blur on (180 degrees, 12 samples) for everything that rides the camera.

## 4. Native moves (pick what the story needs)

Writing in stroke order (the reveal is the explanation, term by term as it is spoken) · the pen leads the camera (a drawn arrow the camera rides into the next idea) · magnets (a print slides in under its magnet; a second magnet drops) · two pens at once (the accent pen underlines or rings while the dark pen is still writing) · ghosts of the old lesson · the full-board view at the end. Not in the proof, available: the eraser rewinding a trail (an inverted Trim on a wide board-coloured stroke), a magnet carrying a hero along a path.

## 5. Sound palette

Every stroke sounds: felt on gloss (a hiss band around 2 to 7.5 kHz with body at 0.5 to 1.5 kHz) shaped by the stroke's own speed curve, a nib tick at its start, on some long strokes the dry-erase squeak (1.5 to 2.6 kHz with a 7 to 13 Hz vibrato). Each colour sounds slightly different; pan follows the stroke's screen x. Props: magnet clack on steel with a low board thump, cap off and on, the tray bounce at the end. Low room tone; one diegetic ticker can own a silence. Music: a solo piano figure, a brushed jazz trio, plucked strings and kalimba, or clockwork minimalism (marimba, pizzicato, woodblock, glockenspiel), well under the voice. Voice on top, foley about 11 dB under it, master about -14 LUFS. Render audio outside AE and place it as a layer.

## 6. AE recipe (`whiteboard.jsx`, AESWhiteboard)

1. Prepare: `tools/font.mjs` turns `assets/fonts/EMSTech.json` into `font.json` (cap-height units, y down, each glyph's ink centred in its advance, plus a tick and an arrow); `tools/print.mjs` makes the real frame into a 1000 px photo print. The module reads the font with `AESLib.readJSON`.
2. Camera nulls `ZOOM` (anchor and position at the frame centre) and `PAN` (child of ZOOM) are made at identity first, every board layer is parented to PAN and placed in board coordinates, and the camera is baked last (one `setValuesAtTimes` per property).
3. Board, bottom to top: wall solid (radial ramp), the frame and tray (one shape layer, drop shadow), the board solid (radial ramp), a scuff (stretched Fractal Noise, Multiply 5%), then the ink.
4. Ink: every writing pass is a **job** (one pen, one window, a list of strokes) and becomes one shape layer: one path per stroke in one group, a round-capped stroke, Trim Paths set to *Individually* (sequential) with Trim End keyed in one call at six samples per stroke along the slow-fast-slow curve, held through the hops. Multiply, 94%. `layout()` sets a string in EMS Tech (one job per word, on its spoken window), `line()`, `ellipse()`, `box()`, `rbox()` and `arrowHead()` make hand-drawn shapes, `marker()` resamples and wobbles any raw polyline.
5. Ghosts and smears are static jobs (no Trim), one layer per tone, placed away from the regions.
6. The print: a white bordered shape layer with a contact shadow, the frame layer parented inside it, sliding in with the accent magnet (eased position, shadow distance 34 to 7); the second magnet drops (scale 136 to 100 in 0.12 s, its drop shadow shrinking).
7. Over the ink: the dry-marker speckle (a screen-size solid, Fractal Noise at contrast 520 and brightness -150, Screen 70%) whose Offset Turbulence and Scale are baked from the camera so it stays locked to the board, fading out when the camera is wide; the sheen (three blurred bands, Add 5%, blur 220, baked at 0.35 x the camera, gone when wide).
8. Pens: one marker per colour (felt nib, cone, white barrel, colour band, cap) and a blurred silhouette for its shadow, both in screen space and baked per frame from the jobs: on a stroke the nib sits on the trim head; between jobs less than 0.9 s apart it hops (the shadow slides out and blurs with the lift); longer gaps send it off frame and bring it back 0.32 s before its next stroke; after its last job it flies into the tray during the pull back.
9. Subtitles: one text layer with every line keyed in one `AESLib.textKeys` call, centred by an anchor expression on `sourceRectAtTime`; the label's width follows the line by expression.

**Gotchas found while proving it**

- ExtendScript groups a nested ternary left to right: `a ? b : c ? d : e` runs as `(a ? b : c) ? d : e`. A centring line `o.center ? x - w / 2 : o.right ? x - w : x` right-aligned every centred word, and a clamp written as one ternary returned the maximum when the value was below the minimum (the first blue line came out at 20 px wide). Never nest a ternary in a module: parenthesise it or use if/else. The same pattern sits in `AESLib.text` (justification) and `AESLib.ease` (the exit ease) and is likely the "justification does not take" gotcha other packages recorded; not changed here.
- Trim Paths set to Individually draws the paths of a group in the order they were added (the first added is drawn first), each in proportion to its length, so a pen baked from the same lengths stays on the trim head.
- Make the camera nulls at identity and parent every board layer before keying them: setting `parent` keeps the world position, so a layer parented after the camera moved lands somewhere else.
- After Effects may not see the scene folder, so the frame comes in through a prepare tool (`tools/print.mjs`) like every other input.
- The sheen at 9% with 140 px blur read as stripes across every beat; 5% with 220 px blur reads as gloss.
- Lettering at 7.5% of cap height looked thin beside the poster; 10% (6 to 22 px) matches it.

**Close, not identical:** the reference renders each stroke with a pressure ramp, a chisel width that changes with direction, a pooled ink dot at the start of long strokes and a dry streak texture subtracted from the ink; here a stroke has one width and the dryness is a screened speckle over the frame. Lemo's pens solve hand speed against deadlines in its own engine; here the schedule is solved in the module and baked.

## 7. Dependencies

Architects Daughter Regular installed (`assets/fonts/`, OFL) for subtitles. EMS Tech is not an installed font: its stroke data ships as `assets/fonts/EMSTech.json` (OFL, `OFL-EMSTech.txt`). Node 20+ for `tools/font.mjs`, Node and ffmpeg for `tools/print.mjs`. Stock effects only: Gradient Ramp, Fractal Noise, Drop Shadow, Gaussian Blur, plus shape layers, Trim Paths and a few expressions (subtitle anchor and label width).

## 8. Pitfalls of the medium

One pen with too many jobs drifts later and later: give each pass a window and hand overlapping work to another pen. Words spoken quickly give a very short window: a three-letter word in 0.1 s still reads, a twelve-stroke word in 0.15 s does not, so split titles across lines and let the camera arrive early. A label half cut by a push looks sloppy: keep each region inside the frame at its zoom, and the bottom 12% free for subtitles. More than one accent mark per region kills the accent. Motion blur with few samples strobes the lettering on a whip. Ghost marks too dark read as mistakes.

## Reference

Before import, the shared test scene was built by `buildScene` from a blank project and rendered in the author's proof setup, then compared with Lemo-Opuscar's whiteboard reference. In this plugin, render frames of your own build and check them against this file.

Build time: about 5 s for 63 layers (43 ink jobs); render about 90 s. The subtitles take one batched Source Text call (`AESLib.textKeys`); every board word is a Trim Paths write-on, never Source Text keys.

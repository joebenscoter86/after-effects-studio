# One-line drawing

> A single ink line that never leaves the paper. Everything on screen is that one line being drawn; scenes do not cut, they morph, and the last pull back shows it was all one picture.

Adapted for native After Effects from Lemo-Opuscar's *One-line Drawing* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only: the references are Cavandoli's *La Linea*, Gjon Mili's light drawings of Picasso and McLaren's lines drawn to music. Never copy La Linea's character or voice, or any specific continuous-line illustration.

## 1. What it is, and what it is not

One continuous line on warm white paper. The pen never lifts: in the module the whole film is literally one point array, from the first touch of the nib to the stop. Everything is that line: people, objects, a number, a horizon the words are written on, a frame around the proof. There are no fills, no shading, no background art. We watch the line being drawn: the camera follows the nib with a little lag and anticipation. Besides the ink there is only the paper and a soft shadow of the pen above it. One accent colour, used once, on the stretch of line that means the most.

Not a whiteboard explainer (no marker, no floating pens, no boards full of text, no erasing), not ink wash (no tones, no brush bloom), not line-art animation with cuts and many separate strokes.

## 2. Grammar

- **Paper.** Warm white `#F4EFE4` with a soft mottle (Fractal Noise, Soft Light 30%) and long fibres (stretched Fractal Noise, Multiply 6%) anchored to the paper, the fibres fading out when the camera is wide so they never shimmer; a light radial vignette in screen space.
- **Ink.** A warm black `#1D1A17`. The line is about 7 px on paper at zoom 1; its width follows pen pressure from speed (`0.7 + 0.75 x exp(-v / 1400)`, fast is thin, slow is fat) with a fine noise of about 8%. A faint bleed (the same line blurred, 20%) sits under it. Small round pools where the pen slows into a sharp turn. A screen-space minimum width: on a pull back the width is multiplied by `max(1, 0.5 / zoom)` so the wide view keeps its weight.
- **Accent.** One stretch of line in red `#B8322A`, used once, with a short blend into and out of the ink. In the proof it is the frame drawn round the real picture: the proof is the thing that matters.
- **The pen is never drawn**: a soft blurred wedge of shadow leaving the nib toward the lower left, and a tiny contact dot. When the pen lifts at the end the shadow drifts off and fades.
- **The stop.** Where the line ends, ink spreads into a teardrop blot: the tip at the nib, the belly sagging downward, a dark tide line at the rim.
- **Type.** Text is written like the line. Caveat (OFL) for everything: titles and the spoken line written on the paper character by character inside each spoken word's window, so the words appear as they are said; subtitles at the bottom in Caveat 62, ink at 84%, no box, centred, written on left to right (0.2 s plus 17 ms a character) behind a paper-coloured halo so a passing line never crosses the letters. Beats whose words are already written on the paper carry no subtitle.
- **Motion.** Everything on ones. Time along the line is weighted by `1 + K x turn`, smoothed, so sharp turns take longer and the speed never jumps. Retracing an existing line is legal and invisible (it only thickens slightly): the person's limbs, the document's text lines and the 3s of the number are left by retracing.

## 3. Camera grammar

One continuous move, never a cut: a `ZOOM` null (scale and roll about the frame centre) and a `PAN` null (its child) baked per frame from composed keys (centre, zoom, roll, follow weight). The follow point averages the nib over -0.45 to +0.3 s; a soft clamp keeps the nib inside the central 70% of the frame while the camera is close.

| Move | Expresses | In AE |
|---|---|---|
| Macro on the nib | the first touch; the act of making | zoom 2.6 on the first point, follow 0.9, pulling out to 1.0 over the title |
| Composed frame, low follow | a scene that reads as a whole | follow 0.12 to 0.2 on the picture and the frame |
| Follow the nib | travel; a thread of time | follow 0.55 to 0.85 on connectors and the carry |
| Lateral scroll, line running ahead | a horizon the words are written on | follow 0.85 along the spoken line |
| Roll with the line | play | a 6 degree roll through the loop-the-loop |
| Slow push into the stop | weight; a stop | zoom 1.0 to 1.24 onto the blot |
| Continuous pull back | everything was one picture | zoom to fit the whole path (about 0.32) on its centre |

No cuts, no dissolves. Transitions are the line itself: the last stroke of one image is the first of the next.

## 4. Native moves (pick what the story needs)

The pen never lifts (the whole piece as one gesture) · transformation (a small frame becomes a loop becomes the swing into the next idea) · line as graph (the tally row under the number) · a horizon the words are written on (the line runs ahead of the spoken sentence) · stopping is an event (the nib stops, ink pools into a blot, sound goes silent) · the reveal (pull back: every vignette was part of one picture). Not in the proof, available: the line's character changing with age or strain (vary the width base and the tremble per chapter), a handoff to a second pen shadow, two lines drawn in alternation until they meet.

## 5. Sound palette

One solo instrument, one unbroken melodic line, written to the drawing: a cello, a clarinet, a harp, a hummed voice; notes on the corners (speed minima at sharp turns), short notes for fast line, one long note into silence at the stop. The pen on paper is the main sound: band-passed noise shaped by the nib speed (brighter fast, duller slow), paper-fibre ticks with density following speed, panned with the nib's screen x; a wooden tap on the first touch, a faint wet swell for the blot. Silence is literal at the stop (no reverb tails). Music ducks about 5 dB and the pen about 4 dB under the voice; master about -14 LUFS. Render audio outside AE and place it as a layer.

## 6. AE recipe (`oneline.jsx`, AESOneLine)

1. Prepare: `tools/lineart.mjs` turns the real frame into ink lines on white with ffmpeg (greyscale, blur, `edgedetect`, inverted, thickened), so the proof frame is more line, never a photo.
2. `plan(scene, widths)` is pure geometry (it also runs in Node, for previewing the whole path): it builds the film as one point array with a time per point and a region per point. Pieces are arcs, polylines, a 3 (two bowls meeting in a cusp), an 8 (a lemniscate of Gerono, a real crossing), a loop-the-loop and rounded frames; connectors are tangent-continuous Hermite splines through hand-placed vias, so they fall outside the pictures. Points are resampled every 5 px and a fine tremble is added along the normal.
3. Paper text first: Caveat layers are made and measured (`sourceRectAtTime`), the plan is rebuilt from the real widths, and each text is written on with one `AESLib.bakeText` call.
4. Camera nulls at identity; every paper layer (paper, mottle, fibres, frame art, ink, text) is parented to `PAN` in paper coordinates; the camera is baked last, one `setValuesAtTimes` per property.
5. The line: cut into chunks of about 80 px (breaking at each beat), each chunk its own group in its beat's shape layer: one open path, Trim Paths, a round-capped stroke whose width comes from the chunk's pen pressure and whose colour blends to the accent. Trim End is keyed at every point's own time by arc length, one call per chunk. A slider on the `CAM` null carries the screen-space width clamp and every stroke width reads it by expression.
6. Bleed: each beat's ink layer duplicated under itself with Gaussian Blur 7 at 20%. Pools: small ellipses scaled in from 0 where the pen turns back on itself.
7. The frame art: the line-work frame inside the accent border, Tint to ink, Multiply 88%, wiped in top to bottom with Linear Wipe (angle 180, feather 140) as the border is drawn.
8. The stop: a teardrop shape at the last point, scaled in over 0.6 s with a dark rim stroke.
9. Pen shadow and contact dot in screen space, baked per frame from the nib through the camera; after the stop the shadow lifts (drifts, grows, fades).
10. Subtitles: one Caveat layer per spoken line with a paper-coloured stroke as the halo, placed by its measured width so the write-on grows from a fixed left edge, one `bakeText` call each, fading out as the next begins.

**Gotchas found while proving it**

- The paper fibres as Fractal Noise at contrast 260, Scale Height 9, Multiply 6% read as brushed metal across every beat; contrast 160, brightness +30, Scale Height 5 at 3% reads as paper.
- A pen shadow wedge 900 px long at 20% read as a pole standing on the paper; 560 px with blur 26 at 15% reads as the pen above it.
- The soft clamp that keeps the nib in the middle 70% fought every composed frame (the ring round the picture was pushed off one side); it now only runs when the follow weight is above 0.1.
- A write-on of a centred text layer jumps sideways as it grows: make it left-justified and place it by the full string's measured width (`sourceRectAtTime`) before baking the strings.
- Text widths shape the line (underline lengths, where the end flick lands), so the plan runs twice: once with estimates to place the text, once with the measured widths.
- The subtitle of a beat held until the next subtitle started, so "338 frames, counted." sat under the spoken line; each now fades within 0.5 s of its last word.
- About 400 chunks (one shape group each, every stroke width on one expression) build in about 12 s and render in about 60 s; no slowdown worth splitting further.

**Close, not identical:** the reference renders the ink as a filled polygon whose width changes continuously point by point, with dry-brush gaps and bristle strands; here the width steps once per 80 px chunk (hidden by round caps) and there is no dry brush. Lemo's camera follows a smoothed nib in its own engine; here the follow is solved in the module and baked.

## 7. Dependencies

Caveat Regular installed (`assets/fonts/Caveat[wght].ttf`, OFL). Node 20+ and ffmpeg for `tools/lineart.mjs`. Stock effects only: Fractal Noise, Gradient Ramp, Gaussian Blur, Tint, Linear Wipe, plus shape layers, Trim Paths, a Slider Control and one expression per line chunk (the width clamp).

## 8. Pitfalls of the medium

Stray connectors ruin a reveal: every extra line reads as a wrinkle or a scar, so plan the topology (where each beat enters and leaves) before the drawing, and let connectors fall on natural lines (a horizon, an underline, a swing round the outside). Each region is drawn once; retrace to leave a closed shape. Lines drawn too close braid together once width is applied. A round blot reads as a mole: sag it into a teardrop. Thin lines on a pull back: clamp the width. A short scene forces a fast line: give the most important stroke the most time, and keep connectors short. Titles must sit away from the path; check the whole path at once (the Node preview) after every change.

## Reference

Before import, the shared test scene was built by `buildScene` from a blank project and rendered in the author's proof setup, then compared with Lemo-Opuscar's one-line reference. In this plugin, render frames of your own build and check them against this file.

Build time: about 12 s for 36 layers (about 400 line chunks over the seven beats); render about 60 s. Every written word is one batched Source Text call per layer (`AESLib.bakeText`); the line itself is Trim Paths, never Source Text keys.

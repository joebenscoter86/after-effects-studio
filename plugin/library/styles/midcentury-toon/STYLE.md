# Mid-century cartoon

> A 1950s follow-along film in flat printed colour: a geometric presenter holds still while one hand does the step, every cel printed a few px off its broken ink line.

## 1. What it is, and what it is not

Flat, printed-looking colour with a thin warm-ink line that never quite closes. Every fill is a separate cel printed a few px down-right of its line and re-registered on twos, so the picture shimmers like hand-registered paint while the camera glides. Light paper tooth and grain, a warm vignette. People and things are geometric: an egg head with the nose drawn into the face line, simple garments in two or three flat colours, slender hands. A presenter's body is one held drawing: only the arms, hands, eyes and mouth animate, and the hand is the step. Rooms are not drawn: a scene is one colour plane, a floor band, a horizon line with gaps, and one or two props.

It performs a real use (a set-up guide, a how-to, a rules card, a recipe) rather than telling a story: the viewer should come away able to do the thing. It is not the 1930s rubber-hose cartoon (no black and white, no bouncing world, no hot jazz), not a whiteboard explainer (it shows how to do, not why; the pictures are printed, not written on), and not a modern flat vector explainer (the register, the broken line, the paper and the held bodies are the period). Never copy a studio's characters, drawings, lettering or music.

## 2. Grammar

- **Off-register cels.** Each drawing is two layers: the colour cel below, parented to the line and offset (6, 5) px down-right, its offset re-rolled by up to 1.6 px on twos. Text gets the same: slab titles sit in ink over an offset colour plate.
- **Line.** Warm near-black `#2B221D`, 3 to 5 px, broken: a long dash and a short gap (gap about 10 % of the dash) so outlines never close. A light Turbulent Displace boil on twos.
- **Shading.** One flat darker plane clipped inside a shape (the turtleneck's far side), never a gradient. Drop shadows are a copy of the shape offset down-right in a paper shade at about 60 %.
- **Colour.** A warm paper ground `#F1E6CF`, soft atomic-age complements: coral `#E2674A`, mustard `#E3B13E`, turquoise `#3E9A94`, powder blue `#86A8C9`, olive `#9BA653`, pink `#EFB0A4`. Nothing pure, nothing neon, nothing white. One ground per scene: a light tint on the wall, a darker shade on the floor band. The product (here the real frame) keeps one colour (a turquoise rim) through the film; the presenter's accent (coral) is a different hue; grounds rotate through cream, powder blue, mustard and sage.
- **The presenter.** Egg head in three-quarter profile, the nose one bump of the face outline, a bob with a mustard headband, a dot eye and a brow, a pink cheek, a coral turtleneck with a darker plane, a mustard belt, navy slacks, ink shoes. Arms are a thick ink ribbon with a coral sleeve ribbon on top, from the torso's corners; hands are skin, one union outline, a pointing pose and an open pose.
- **Ornaments.** 4-point atomic sparkles (they turn on twos), starbursts (12 to 22 points), sunburst rays (30 wedges, semi-transparent), numbered ink medallions with a paper numeral, a ribbon tag with notched ends, plus marks and a wavy line in the floor band.
- **Type.** Oleo Script Bold for a kicker (coral, a darker coral plate), written on left to right. Alfa Slab One for titles, numerals and medallion numbers, in ink over an offset mustard or coral plate. Jost SemiBold for labels, tags and captions, letter-spaced caps for a small line. Detail tags: a paper pill with a thin ink border, a coral star bullet, the label in Jost; data lands on the picture, never as a slide.
- **Motion.** Drawings, hand poses and the register on twos (12 fps); the camera, wipes and irises on ones. Held body, moving hand: each hand action has anticipation (a small pull back toward the shoulder), a fast action (0.16 s, eased out, a 5 % overshoot) and a settle on the beat. Medallions stamp on (from 240 % down to 90 %, a damped rebound); tags, titles and pictures pop with a back-ease (about 0.3 s); slab lines slide in on twos.

## 3. Camera grammar

The camera is the stand: never handheld. A slow push of 3 % across each scene (on ones), reset on every cut. Transitions are colour-block wipes (turning the manual's page: the next ground slides over everything from the side or from the bottom, an ink edge leading), cuts on a beat, an iris through a medallion (the number is the door: an ink disc grows out of it and the next scene opens from a circle), and an iris-out onto one object to close. No dissolves.

Here: the title and the three pictures share the cream room; a wipe from the right brings the blue call-out; a wipe up brings the mustard count; a wipe from the left brings the sage caption card; a cut brings the call-out back; the medallion stamped on it is the door into the end card, which closes on an iris.

## 4. Native moves

- **The hand is the step.** The presenter never moves; the right hand points at each thing on its word, with anticipation and a settle. Standing arms never stretch: the hand reaches along the pointing direction at the arm's natural length.
- **The numbered medallion** marks hierarchy and opens the next step: it stamps onto the outgoing subject and the camera goes through it.
- **The round call-out** is the close-up: the real frame lives inside a turquoise rim, joined to the pointing hand by a leader line; the detail lands next to it on its word.
- **Off-register colour** makes every card hand-made, the real frame included (`tools/cel.mjs` prints it in four flat inks off its own line).
- **Colour-block wipes** turn the manual's page, one ground per step.
- **The count in the slab** runs on twos over its colour plate and lands with a pop; the label slides in letter-spaced; the tag stamps the result.

## 5. Sound palette

An original West Coast cool-jazz combo: flute or muted trumpet, vibraphone (one chord per step, glissandi on wipes), pizzicato walking bass, brushes, celesta, bongos or finger snaps. Not ragtime, not a spy big band. Silence before the most important action, so the first sound after it is the step. Foley by material: damped rubber stamps for medallions, paper swishes for wipes, a slide whistle for an arrow, rising pips for "connected", an iris "shhk". Warm room tone, very quiet; a mantel-clock tick on the grid. A calm classroom narrator, one clause per line. Music ducks about 8 dB under the voice.

## 6. AE recipe

Module `midcentury-toon.jsx`, global `AESMidcenturyToon`. Comps: `CAST` (comp size: every drawing and every word), `STAGE` (comp size: the grounds, CAST, the wipes and irises), `CALLOUT` (640 x 640: the printed real frame). The main comp holds STAGE as the camera stand, then the paper.

1. **Shapes.** Everything is drawn from node lists (`emit`): rect, rounded rect, ellipse, star, polygon, open line, Catmull-Rom curve (`smooth`), nested groups with pivot, position, rotation, scale, opacity. Node order is painter's order. A node has `fill`, an ink line `sw`, a colour ribbon `csw` / `cc`, `brk` (dash length, or `false` for an unbroken line) and `whole`.
2. **The two layers (`piece`).** One node list is emitted twice: `F`, the colour cel (fills that are not ink, colour ribbons), and `L`, the line (ink strokes, ink fills). F is made first (below), parented to L at once, set to (6, 5) and given the register expression `posterizeTime(12); seedRandom(floor(time * 12), true); value + random jitter`. Layer transforms (pops, slides) go on L and F follows. `whole` nodes (arms, hands, eyes, mouth) are drawn complete on L only, so their keys live on one layer.
3. **The broken line.** In L, every closed ink outline of 3 px or more gets one dash and one gap (gap = dash x 0.1, the dash length varied per node), added by `breakLines` after the layer is drawn.
4. **The presenter (`presenterNodes`, `rigArms`).** One shape layer, feet at its origin, about 780 tall (scale 0.8 here). Arms `AL` / `AR` are paths whose shape is an expression: `createPath` through the shoulder, a slightly bent midpoint and the hand group's position; the sleeve is a coral stroke over a thicker ink stroke on the same path. Hands `HL` / `HR` hold `POINT` and `OPEN` groups swapped by held opacity keys; their rotation expression points them along the arm. `EY` blinks by a scale expression on twos; `SMILE` / `TALK` swap on the spoken onsets. `reachTo` turns a stage point into a hand position at the arm's length; `gestures` writes anticipation, action, overshoot and settle keys.
5. **Type (`words`).** A text layer and, under it, an identical plate layer parented to it, offset (7, 7) with the register expression. The count bakes its numbers on twos into both layers (`AESLib.bakeText`, one call per layer) and centres them with `sourceRectAtTime` expressions. Scripts write on with a keyed rectangle mask (the same mask on the plate). Caption rows are typed on the spoken onsets with `AESLib.textKeys`, one call per row.
6. **Props.** `medallion` (ink disc, paper numeral, stamp keys), `tag` (pill, star bullet, Jost label, pop), `sparkle`, `rays` (30 wedges at 40 to 55 % opacity, turning `time * 7` on twos), `arrow` (a dashed curve drawn on with Trim Paths and a paper-dart head), the round pictures (a colour disc on a pale starburst ring with a shadow disc).
7. **The real frame (`tools/cel.mjs`).** ffmpeg: crop a square on the face, grey, contrast and gamma lift, four bands mapped to ink, brick, peach and cream, the colour shifted 6 px down-right, then multiplied by an inked edge (edge detect, eroded) in warm ink; 12 fps. It plays in `CALLOUT` under a round mask, inside a turquoise rim with two broken ink rings, and is used twice (the carry's start time is offset so the footage runs on).
8. **CAST on twos.** CAST is a layer in STAGE with Posterize Time 12 and Turbulent Displace (amount 1.6, size 30, evolution `(floor(time * 12) % 3) * 120`).
9. **STAGE.** One ground layer per scene (`ground`: wall plane, floor band from y 1640, a horizon line with gaps, a wavy line and plus marks in the band), then CAST, then the transitions: `wipe` (a copy of the next ground with an ink leading edge sliding in over the 0.26 s before the cut), the medallion door (an ink disc scaling 100 to 2600 % over 0.3 s from the medallion's centre), `iris` (an ink layer with an even-odd hole) to open the end and to close it.
10. **The stand and the paper.** In the main comp: a paper solid, STAGE with a scale expression (3 % push per scene, reset on each cut), Fractal Noise tooth (Overlay 12 %), a large Fractal Noise brush mottling (Soft Light 22 %), mono Noise 3, a warm brown vignette (inverted feathered ellipse, Multiply 30 %).

**Gotchas found while proving it**

- **Set a shape layer's position to (0, 0) when its nodes are in comp coordinates.** A new shape layer sits at the comp's centre; with the anchor at (0, 0) every ground and arrow landed 540 x 960 off, and the floor band vanished.
- **Dash a stroke after the layer is drawn, and never touch the Dashes' Offset.** Dashes added inside the emitter failed with "the property or a parent property is hidden". `emit` now only names the stroke (`BRK<dash>_<n>`); `breakLines` walks the finished layer, re-resolves each stroke from the root by index and adds Dash 1 and Gap 1. Setting the dash Offset still failed, so the dash length is varied per node instead.
- **Painter's order only holds inside one layer.** An ink-filled shape (a phone body) goes to the line layer, which sits above the colour cel, so the screen's colour under it vanished into a black blob. Give big bodies a colour fill (navy), and keep ink fills for small accents (eyes, shoes).
- **`rot` on a node is the group's rotation.** A star given `rot` swung around the piece's origin and left the ribbon. A star's own point angle is `srot`.
- **An ink door must not fill the frame early.** The medallion door scaled to 2600 % covered the whole frame within a third of its run; 1450 % with a slow start reaches the far corner just on the cut.
- **ffmpeg's blend runs in YUV unless told otherwise.** The multiply of the colour cel and the ink line turned the real frame green; both inputs go through `format=gbrp` first. Inside a filter graph, escape commas in `lutrgb` expressions with a backslash and do not quote them.

## 7. Dependencies

Stock After Effects effects only: Posterize Time, Turbulent Displace, Fractal Noise, Noise. Fonts (OFL, `assets/fonts/`): Oleo Script Bold, Alfa Slab One, Jost (variable, SemiBold instance). Node 20+ and ffmpeg for `tools/cel.mjs`. No generated pieces: the presenter, the props, the grounds and the cards are native shape layers.

## 8. Pitfalls of the medium

- A separate nose wedge looks glued on: draw the nose as one bump of the head's outline.
- Thin arms read as sticks from the neck: shoulders at the torso's corners, the sleeve a thick ink ribbon with a colour ribbon on top.
- A stretched standing arm breaks the period: point at the arm's length, never reach.
- A moving body kills the limited animation: hold the body, move the hand, one action per beat.
- Gradients, pure white or neon break the print: flat planes, warm paper, soft complements.
- Detail text without reading time: put data on the picture as a tag, context in the title and the voice.
- Dissolves are wrong here: wipe, iris or cut on the beat.
- The register everywhere but the line too: the line stays put; only the colour moves.

## Reference

Lemo-Opuscar `styles/midcentury-toon` (MIT, LemoLab), cloned at `~/Assets/lemo-opuscar/styles/midcentury-toon/` (`STYLE.md`, `DEMO.md`, `poster.jpg`, the demo engine in `demo/`). Grammar after early-1950s limited animation, 1950s classroom films and appliance manuals; no character, drawing or lettering is copied.

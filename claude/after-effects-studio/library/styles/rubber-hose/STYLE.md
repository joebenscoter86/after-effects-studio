# Rubber hose cartoon

> A 1930s black-and-white hand-inked cartoon where a living object stars and the whole world swings to the band, projected from a worn print.

## 1. What it is, and what it is not

Early sound-era cartoon animation: characters with rubber-hose limbs (equal-width tubes, no elbows, no knees), white four-finger gloves, pie eyes (a black oval pupil with a wedge cut out), big round shoes, and bodies that squash and stretch like balloons. The star is usually an object brought to life, and the whole object is the body (never an object head on a human body). Behind it, a room painted in soft middle greys; everything in it breathes in time with the music. The picture is a worn print projected through a rounded gate: flicker, weave, a jump on every cut, scratches, dust, a hair, a vignette.

It is not a 1950s flat cartoon (no limited animation, no colour, no graphic backgrounds), not a silent film (the synchronised beat is the engine; silent film is hand-cranked and deadpan), and not a retro filter over modern animation (no joints, no rendered shading, no gradients on the characters). Never copy an existing cartoon character, name, silhouette, melody or logo; the hero here is our own clapperboard.

## 2. Grammar

- **Gate.** A portrait print in a rounded gate (r 28) on black, with a soft inner shadow on its edge. Here the gate is 1000 x 1500 inside the 1080 x 1920 frame.
- **Characters.** Flat fills: character white `#F7F7F7`, ink `#0F0F0F`, one hard-edged light grey form-shadow band on the side away from an upper-left light, never a gradient. Ink outline about 7 px. Light line boil (three drawings cycling at 12 fps).
- **Anatomy kit.** Limbs are tubes of constant width (about 1/20 of the character's height) with one smooth bend and round caps. Gloves: palm, three fat fingers, a thumb, a flared cuff with a fold line, three stitches; outlined as one union. Pie eyes: a white oval, a big pupil (about 64 % x 74 % of the eye) with a wedge cut toward the upper right; they blink. Mouths: an open grin with teeth and tongue, a smile with cheek ticks, an "O". Shoes: big black ovals with a white toe glint.
- **The hero.** A living clapperboard: the slate is the body (face on the slate), the striped clapper stick is its hat and its gag: it opens on the anticipation and snaps shut on the beat.
- **Supporting cast.** The same kit at a smaller scale: a person (black bean body, white round head, flat cap), a document (a sheet with a dog-eared corner), a cathedral radio, a wall clock. Each has a face and breathes.
- **The set.** Middle greys only: wallpaper with stripes and diamond motifs, a picture rail, a window with curtains, a shelf of jars, panelled wainscot, a checker floor in perspective; thin dark-grey outlines, soft blotches, darker edges. It never boils. The characters own the extremes (white and ink).
- **Colour.** Strictly greyscale, about six grey steps plus the character white; the print adds warm paper whites and a slight contrast boost. No hue anywhere, not in the damage either.
- **Type.** Titles in Shrikhand (fat retro script), white face, heavy ink outline (about 14 % of the size) under the fill, ink drop shadow down-right; letters hop in a travelling wave on the beat. Sub-lines in Limelight caps on a near-black plate. Cards (the singalong, the end) are near-black plates with a white double rule and dot-and-ring corner ornaments; card text in IM Fell English SC. Cards pop on with a squash; nothing fades.
- **Motion.** Characters on twos (12 fps); a fixed tempo of one beat every 0.5 s. Every idle thing squashes and stretches with cos(2 pi beats): stretch on the beat, squash on the off-beat, about 5 to 7 %, all in phase. Anticipation, hold, snap before a big move; impacts squash with an exponential spring-back. Drops land on the beat.

## 3. Camera grammar

A theatre camera, mostly locked. Stage-wide for a routine; hard cut on a beat to a closer framing for a reaction or a reveal; iris in to open, iris out to close (the film is an object). No dissolves: transitions are an iris, a hard cut on the beat (the print jumps), a title rolling up like a window shade, or a transformation in a puff.

Here: an iris opens on the hero, stage-wide; the title rolls up on "Three"; hard cuts on every beat; the real frame is held up closer; the end closes with an iris on the hero's face.

## 4. Native moves

- **Everything breathes on the beat.** The hero, the props, the clock on the wall, the title letters: one tempo, one phase.
- **Rubber-hose stretch.** Arms reach any length in one unbroken tube: here the hero reaches up to each piece as it lands, and holds the real frame up by its corners.
- **The clap.** The hero's clapper is its gag: open (anticipation), hold, snap on the word, with star lines.
- **Drops on the beat.** Things fall from above and land with a squash and spring-back on the spoken word.
- **The bouncing-ball singalong.** A card with the line, a ball hopping from word to word on the spoken onsets, each word typed as the ball lands.
- **Transformation.** One thing becomes the next mid-motion: here the real frame squashes, stretches, spins away into a puff and the end card pops out of it.
- **The film is an object.** Irises, the jump on every cut, a hair in the gate, a title rolled up like a shade.
- **The real frame as a cel.** Footage flattened into a few flat greys with thick ink contours, on twos, held in an ornate frame by gloved hands.

## 5. Sound palette

A 1930s hot dance band: stride piano, clarinet, trumpet (open and plunger-mute wah-wah), trombone smears, tuba oom-pah, banjo on 2 and 4, brushed snare, xylophone, woodblocks, slide whistle, cymbal. No string pads, no synths. Mickey-mouse the action: a woodblock or snare hit on every clap, a slide whistle on every stretch, a cymbal or stinger on a landing, a xylophone note per hop of the bouncing ball, a hard band stop before a gag. Foley by material (wood is a woodblock, springs boing). A period voice (a radio announcer) through a radio chain (high pass about 260 Hz, low pass about 4.6 kHz, saturation); an optical soundtrack pass with hiss, crackle and projector clatter.

## 6. AE recipe

Module `rubber-hose.jsx`, global `AESRubberHose`. Comps: `CAST` (gate size, every drawing), `STAGE` (gate size: the painted set and CAST), `FRAMED` (820 x 620: the real frame in its ornate frame). The main comp holds STAGE as the print.

1. **Shapes.** Everything is drawn from node lists (`emit`): rect, rounded rect, ellipse, polygon, open line, Catmull-Rom curve (`smooth`), pie pupil (`pie`), nested groups with pivot, position, rotation, scale and opacity. Node order is painter's order.
2. **Union outline (`inked`).** For a glove or the radio's body, every part is emitted first in ink with a thick stroke, then every part again filled without a stroke, so only the outside of the union is outlined.
3. **The hero rig (`hero`).** One shape layer, feet at its origin, about 520 px tall. Arms `AL` / `AR` are paths whose shape is an expression: `createPath` through the shoulder, a bent midpoint (perpendicular offset 0.15 of the length, outward) and the glove group's position, with tangents along the arm. Gloves `HL` / `HR` are groups whose position is keyed in body coordinates; their rotation expression points them along their arm. `EY` blinks by an expression on its scale; `EY/PUP` is keyed for a look; mouths `GRIN`, `SMILE`, `OH` swap by held opacity keys; `CLAP` (the stick, pivot at the hinge) is keyed open, hold, snap shut, a small bounce, per clap time; `SR` (a shoe) can tap.
4. **Breathing.** Every character and prop layer gets `posterizeTime(12); b = cos(2 pi time 2)` on scale: x by 1 - 0.6 a b, y by 1 + a b (a 0.05 to 0.07), anchored at the feet, multiplied over any keyed squash.
5. **Drops and pops.** `drop` keys a fall (0.2 s, linear) onto the beat with a squash (124 / 74) and two spring-backs; `pop` scales a card in from 0 with an overshoot.
6. **Type.** `title` makes a Shrikhand layer with an ink stroke under the fill (14 %), an ink Drop Shadow (direction 135, softness 0) and a `HOP` text animator: Position [0, -h] under an Expression Selector whose amount is `100 * max(0, sin((time * 2 - (textIndex - 1) * 0.11) * 2 pi))^2` on twos. The count is baked on twos with `AESLib.bakeText`.
7. **Singalong.** The card rows are left-justified layers anchored by the full row's box; each word is typed on its spoken onset (`AESLib.textKeys`, one call per row). The ball's position is one expression: landing times and points (word centres measured with temporary text layers), a parabola between them, a squash near each landing.
8. **The real frame (`tools/ink.mjs`).** ffmpeg: crop, grey, gamma lift, five flat grey steps, thick inked edges (edge detect, eroded twice), 12 fps. It plays inside `FRAMED` (masked to a rounded window) and FRAMED is used twice: held up in the input beat and transformed in the carry (start time offset so the footage continues).
9. **CAST on twos.** CAST is a layer in STAGE with Posterize Time 12 and Turbulent Displace (amount 2.4, size 26, evolution `(floor(time * 12) % 3) * 120`, three drawings cycling).
10. **Title sunburst.** Behind the title, a ring of alternating grey wedges (12 of 24 drawn darker) turning `time * 24` on twos; it rolls up with the title like a shade.
11. **STAGE.** The set shape layer, a Fractal Noise blotch solid (Soft Light 45), a black edge solid with an inverted feathered mask (35 %), then CAST.
12. **The print.** On the STAGE layer in the main comp: Tint (black `#0E0D0B`, white `#F2EEE6`), Brightness and Contrast (contrast 12), Gaussian Blur 0.8; position weave on 4 Hz plus a 7 px jump for two frames on every cut and a rare frame jump. Above it: a flicker adjustment (brightness random -6 to 4 per frame), Noise 6 mono, three broken scratches, six dust specks, a hair for two seconds, a feathered vignette (58 %).
13. **The gate.** A black shape with an even-odd hole (rounded rect r 28) and a blurred black stroke on the hole's edge as the inner shadow.
14. Every text change goes through `AESLib.textKeys` / `AESLib.bakeText`, one call per layer.

**Gotchas found while building it**

- **Draw the card plate before its text.** `layers.add` puts each new layer on top, so a plate made after its title hides it. Build back to front.
- **Rest the gloves at hip height, not at the feet.** Hands at body y -150 sat on the shoes and read as a second pair of feet; -210 to -230 reads as hands.
- **A grab must sit on the arm's own side.** A right hand reaching a point left of or straight above its shoulder makes the bent hose cross the body. Put the hero beside the thing it grabs (the hero left, the frame right).
- **The swap needs cover.** A transformation reads only if the puff is bigger than both the thing leaving and the thing arriving: 13 clouds at a radius of 330, starting just before the new card pops.
- **The arm hose is a path expression, the glove a keyed group.** `content("HL").transform.position` read from the arm's path follows the keys exactly, so only the hands are animated; the arm and the glove's rotation follow.
- **Pie pupils are a polygon.** A 26-point ellipse arc with a notch toward the centre is enough at this size; an even-odd cut-out is not needed.
- **CAST on twos through Posterize Time on its precomp layer.** That steps every keyed and expression move inside; the camera, the weave and the print damage stay on ones in the main comp.

## 7. Dependencies

Stock After Effects effects only: Posterize Time, Turbulent Displace, Fractal Noise, Tint, Brightness and Contrast, Gaussian Blur, Noise, Drop Shadow. Fonts (free (OFL) from Google Fonts, not included): Shrikhand, Limelight, IM Fell English SC. Node 20+ and ffmpeg for `tools/ink.mjs`. No generated pieces: the cast, the set and the cards are native shape layers.

## 8. Pitfalls of the medium

- Flat grey frames: keep the set in the middle greys and the characters at the extremes, and boost the print's contrast.
- Wide shots kill gags: keep the hero at a medium size, faces readable.
- A gradient or rendered shading on a character breaks the period: one flat form-shadow band only.
- Limbs with elbows or tapering read as modern: equal-width tubes, one bend.
- Smoke puffs in a row read as thought bubbles: scatter and grow them.
- Fades are wrong here: cards pop, scenes cut on the beat or iris.
- A white that blows out loses the print: the print's white is a warm paper, never pure.

## Reference

Lemo-Opuscar `styles/rubber-hose` (MIT, LemoLab), at `https://github.com/lemomo-ai/lemo-opuscar/tree/main/styles/rubber-hose/` (`STYLE.md`, `DEMO.md`, `poster.jpg`, the demo engine in `demo/`). Grammar after early 1930s sound cartoons; no character, name or design is copied.

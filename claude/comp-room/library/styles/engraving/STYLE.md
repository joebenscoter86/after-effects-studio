# Copperplate engraving

> An intaglio plate that engraves itself: fine ink lines swell where the form turns from the light, crossing families build the shadows, lettering is cut glyph by glyph, and colour arrives last as a hand-laid wash.

Adapted for native After Effects from Lemo-Opuscar's *Copperplate Engraving* style (MIT, LemoLab; see `library/styles/LICENSE-lemo-opuscar.txt`). Grammar only, after nineteenth-century natural-history plates and the burin line of Hogarth and Dore: never their plates, poses, borders or titles.

## 1. What it is, and what it is not

Each shot is one plate of a natural-history book: warm near-black ink on cream laid paper, inside a pressed plate mark and a ruled border. Three rules hold everywhere:

1. Tone is made of lines, never of fills. Light is bare paper; a half-tone is one family of parallel lines; shadow is a second family crossing it; the deepest dark a third.
2. Every line swells and tapers. It is a hair where the form faces the light and thickens where it turns away.
3. Colour comes afterwards, by hand: a transparent wash laid under the ink, spilling a little past the lines. Colour arriving is an event.

Not a woodcut (black block, white gouges: `woodcut`), not a pen sketch, not an engineering drawing (`blueprint`), not a sepia filter over a photo.

## 2. Grammar

- **Two values carry the print**: ink `#1C1510` on paper `#F1E8D2`; the sheet beyond the plate mark is a shade darker (`#E8DFC7`). All tone is line density.
- **Tone is an engraving instruction.** Every drawing is made in tone: 1 is bare paper, 0 the deepest shadow. The first family starts below about 0.86, the crossing family below 0.52, the darks below 0.29. One light, upper left; contours are tone 0; cast shadows are soft tone 0.4 to 0.5.
- **Washes**: transparent, muted earth and mineral pigments (amber `#DCAD6B`, blue-grey `#9FB3BA`), at most one stronger. Never on lettering, rules or bare paper outside a figure. Reserve them for the finish.
- **Type belongs to the plate**: roman capitals in Bodoni Moda (titles about 56 to 104 px, wide tracking; labels 22 to 34 px), Bodoni Moda Italic for names and figure numbers, Pinyon Script for notes. Roman letters are cut glyph by glyph; script is written. Nothing fades in.
- **Plate furniture**: a running head (small capitals) top left, the plate number (PL. I.) top right, credits in italic below the border ("Ad viv. del.", "Aere incid."). Notes sit in the bottom margin on a deckled paper slip.
- **Motion**: the cutting order is the animation (outline and first hatching sweep across the plate, then the crossing, then the darks). Figures and the burin move on twos; the hatching never boils, the screens are fixed per plate.

## 3. Camera grammar

The camera is a loupe over a sheet.

| Move | Expresses | In AE |
|---|---|---|
| Locked plate with a breathing push | the plate as a document; reading time | the sheet layer scales 100 to 101.5 over the film |
| Roundel flown on an arc | where to what: a magnified detail | a precomp in DRAW keyed on an eased arc (spatial tangents), growing 16 to 100 % |
| Following the burin | making; one point of attention | the burin's tip keyed to the end of the last written word, on twos |
| The proof pulled | a draft becomes final; one plate gives way to the next | the sheet held at a frame (time remap) lifts off the bed (scale 103 %, a few degrees, its drop shadow growing longer and softer), then is drawn away up and to the left |

Transitions come from printmaking only: a new plate cut in place (hard cut, the families sweep), the proof pulled off the bed, a slip laid down. Never a dissolve or a wipe of the whole frame.

## 4. Native moves (pick what the story needs)

The three passes (outline, crossing, darks) · the magnification roundel with its label cut on landing · the engraved note written by the burin, swarf curling ahead · a real frame engraved by the same families · the proof pulled to show the finished plate · hand colouring that blooms from where the brush touched · the finished plate with every label and credit locked.

## 5. Sound palette

Foley by material: high band-passed burin hiss with chatter and a tick on lift, paper peel and slip tapped down, press thump, a water plip and a wet brush swish for the wash. Instruments: harpsichord, string quartet, solo cello or viola da gamba, lute. Plucked and dry while lines are cut, bowed only when the colour arrives. A quiet workroom, silence before the finish. Music about half under the voice. Render audio outside AE and place it as a layer.

## 6. AE recipe (`engraving.jsx`, AESEngraving)

Comps: **DRAW** (frame size, white) holds the tone drawing; three **family** comps (F1, F2, F3) each hatch it with their own line screen; **INK** multiplies the families in cutting order; **SHEET** prints the ink on paper with the plate furniture; the main comp holds the sheet, the peel and the note slips. Precomp **ROUNDEL** carries the real frame and its rings.

1. Tone pieces: `piece(comp, name, nodes, pos)` from nested nodes (`poly`, `line`, `rect`, `circle`, `ellipse`, `group` with `pivot`) whose `fill` and stroke `sc` are tones. `sphere()` is a solid with a radial Ramp (highlight upper left, 0.98 to 0.06) masked to a circle. Pieces arrive with `cutIn()` (a feathered Linear Wipe).
2. Families, `familyComp()`: DRAW, then the family's screen (`screenComp()`: white bars half the period high, a Repeater, Gaussian Blur 0.32 x the period) rotated per plate (hold keys) plus the family's turn, roughened (Turbulent Displace 1.4 / 30) and bent by DRAW's luminance (Displacement Map, vertical 6 px), in Linear Light at opacity p; then an adjustment layer with Gaussian Blur 0.9, Threshold at the family's level, Gaussian Blur 0.55. A family draws where tone + p x (2 x screen - 1) is below its level.

   | Family | Period | p | Level | Starts below tone | Turn |
   |---|---|---|---|---|---|
   | F1 first hatching | 9 px | 0.40 | 0.46 | 0.86 | 0 |
   | F2 crossing | 10 px | 0.32 | 0.20 | 0.52 | +62 degrees |
   | F3 darks | 8 px | 0.22 | 0.07 | 0.29 | -30 degrees |

   The line width follows the tone along each line, so lines swell into shadow and taper to a hair towards the light by themselves.
3. INK, `inkComp()`: white, F1, then F2 and F3 in Multiply. Each has a Linear Wipe (feather 140) keyed per plate: it jumps to 100 at the plate's cut and sweeps to 0 after an offset (F1 at 0 s over 0.42 s, F2 at 0.22 s, F3 at 0.42 s), so every new plate is cut in order. The first plate starts at 55 so frame one is never empty.
4. SHEET, `paperSheet()` then `printInk()` then `border()`: outer paper, a soft shadow and a light bevel line make the pressed plate mark; laid lines (a 1 px Repeater every 5 px, Multiply 7 %) and chain lines; fibre (Fractal Noise, Overlay 12 %); a few blurred foxing spots (Multiply 30 %); the ink in Multiply with Tint (black to ink, white to white); the rule and hairline border. Beat lettering is lifted above the paper and ink after they exist.
5. Lettering: `words()` places a layer by its ink box; `cutGlyphs(layer, t0, dur)` adds a text animator (Opacity 0, smoothness 0) whose range start steps 0 to 100, so capitals are cut one glyph at a time. Counts use `AESLib.bakeText`; written lines and the plate number use `AESLib.textKeys`, one batched call per layer.
6. Washes, `wash()`: a shape in Multiply at 72 % placed directly under the ink, with a darker tide-line stroke, Roughen Edges (border 7, evolution keyed while it spreads) and Gaussian Blur 1.6, offset 4 / 3 px (misregister), scaling from the touch point 4 to 100 %. A `band` width lays it as a ring instead.
7. Real footage: `tools/tone.mjs` crops the clip, greys it, softens it and lifts it through a gentle curve (darks to about 0.1, skin to about 0.85), multiplies a thin keep-line from its edges, and writes an mp4 on twos (or a still). In the roundel it is masked to a circle, its opacity rising so the light hatching is cut first.
8. The proof pulled: SHEET again (2D), time remap held at a frame of plate III, anchored at its top-left corner. From just before "becomes" it lifts over 0.3 s (scale 100 to 103, rotation 0 to -2.5, Drop Shadow at 135 degrees rising from nothing to distance 30 and softness 60), then is drawn away to (-0.55 W, -1.12 H) turning to -9 degrees by just after "next", slow then fast, the shadow stretching to distance 70 and softness 120. Its scale multiplies the sheet's breathing push so nothing jumps at the cut.
9. Note slips (main comp): a slip-coloured solid with Roughen Edges (border 5, the deckle) and a Drop Shadow, scaled 103 to 100 as it is laid down; Pinyon Script written left to right by a Linear Wipe.

**Gotchas found while building it**

- `setSpatialTangentsAtKey` on a 2D position still wants three-value arrays (`[x, y, 0]`); two values throw "Value array does not have 3 elements" and the roundel flies straight.
- A Linear Wipe at 90 degrees, keyed from 100 to 0, reveals from the right; script must be written with 270 to run left to right.
- A cast-shadow ellipse is part of the tone drawing, so it hatches too: keep shadows inside any ruled frame or their lines poke through it.
- The real frame's tone curve decides how much skin stays bare paper. Too bright (skin at 0.93) and the face loses its hatching and a wash over it reads as a flat blob; keep skin about 0.86 and lay the wash on the face only, not the whole medallion.
- A flat page hinged in 3D about its top edge (Rotate X, no camera) read as a skewed trapezoid, not a page; CC Page Turn's corner controls folded unpredictably and laid the mirrored back over the plate. The proof pulled off the bed in 2D with a growing, softening drop shadow reads as paper and is fully predictable.
- A trailing `//` comment pasted onto a line that ends a block swallows the closing brace; the bridge only says "After Effects reported an error executing the command". Syntax-check the module with Node before building.

## 7. Dependencies

- After Effects 2023 or later.
- Fonts (free (OFL) from Google Fonts, not included): Bodoni Moda Regular and Italic (variable), Pinyon Script Regular.
- Node 20+ and ffmpeg for `tools/tone.mjs`. No generated pieces.

## 8. Pitfalls of the medium

- A uniform line reads as a pen drawing: keep figures in mid tones so lines swell; flat tone 0 areas print solid and lose the engraving.
- Hatching everything reads as grey: keep lit surfaces near tone 1 (bare paper) and let the cast shadow carry weight.
- Colour on the lettering or over the whole sheet reads as a tint filter: washes stay inside a figure, under the ink.
- Moving tone pieces swim through fixed screens; keep moving figures small and short (the burin, the roundel's flight).
- Close rather than exact: the lines are three fixed screens per plate bent by tone, not Lemo's per-stroke burin (contour hatching that wraps each form, separate strokes cut at constant speed, stipple and fur); the cut order is a feathered sweep per family, not stroke timing; the proof is pulled away flat, not curled; copper, the raking view of the plate and the score are not built.
- A 9:16 reel turns the landscape plate portrait: the figure sits in the middle, title on top, notes in the bottom margin.

## Reference

Lemo-Opuscar `styles/engraving/` (STYLE.md, DEMO.md, `demo/engine/` burin, plate and wash; poster.jpg). The proof is `proof/compare.jpg` (Lemo's poster above our seven beats) and `proof/proof.mp4`.

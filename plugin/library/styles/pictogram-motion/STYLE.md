# Pictogram motion

> A beat-locked flash-card film: a square grid of discs and patterned cells whose rows slide past each other, faceless figures of round-capped bars, and huge bold type that slides up out of masks, one hue per card.

Adapted for native After Effects from Lemo-Opuscar's *Pictogram Motion* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only: never copy a real games' pictograms, emblem, slogan, pattern artwork or colour names, and never name a real event in the film.

## 1. What it is, and what it is not

A catalogue film: items shown one card at a time, fast, on the beat. Each card is one pictogram doing one action, a huge title, a second line under it and a mono index ("03 / 07"). Cards group into chapters and each chapter owns one hue. A frame reads as this style from four things at once:

1. **The grid pattern.** Big discs and half-discs spanning square cells, about half the cells carrying a small geometric motif, all in five tones of one hue, with whole rows cut and shifted sideways by one cell.
2. **The pictogram figure.** Flat and faceless: round-capped bars and a disc head, far limbs mixed toward the background. Props are discs, rings, capsules and lines.
3. **Type as architecture.** A 900-weight grotesk set very large, a heavy second line, small mono meta text in the corners like a broadcast HUD, a tick bar for progress.
4. **Beat lock.** Every card starts on a cut, every key action lands on a beat or a spoken onset.

Not an isometric infographic (no depth), not Swiss motion (the figure and the pattern carry as much as the type), not a cartoon (figures never emote and have no faces), not a data film (numbers are labels, not charts).

## 2. Grammar

- **Grid.** One square cell, `C = 180` px (1/6 of the 1080 frame width; Lemo uses 1/6 of the height in landscape). The pattern, the rows and the transitions all live on it.
- **Colour.** A set of hues plus one dark neutral, each a ramp from its darkest to its lightest tone; the five tones are the ramp at 0, .25, .5, .75 and 1. The proof's set (invented names): turf green, harbour blue, brick red, night neutral, dusk violet, ochre. One cream (`#F9F4E7`) for every figure and every line of type, one signal red (`#E8412A`) for tag chips, gold (`#F2B33D`) as the accent on brick and on the neutral. Under type the pattern runs at low contrast (the ramp from .1 to .62); a chapter card opens at full contrast and settles. No outlines, no highlights except one soft light sweep.
- **Pattern model.** Each grid row is one shape layer, drawn two cells wider than the frame on both sides and masked to its band: a mid-dark fill (tone 1), cell-radius discs on every other grid node (some with an inner disc), and about half the cells carrying one motif in two tones, rotated by a multiple of 90 degrees. The motifs are generic geometry only: quarter disc, half disc, concentric rings, dot scale, triangle teeth, stepped stripes, sun wheel, checker, crescent, fish scales, concentric quarter arcs.
- **Figure model.** Unit = 1/138 of the body height, origin at the hip. Far arm and far leg (stroke opacity 60), torso, near leg, near arm, head disc. Bars have round caps and joins: torso 16 units wide, legs 11, arms 9, head radius 10. Poses are joint tables (`AESPictogram.POSES`: `read`, `typeA`, `typeB`, `cheer`).
- **Stage.** The figure stands on a large sun disc in a neighbouring tone (tone .75 of the grey stack, printed by Tint), crossed by one faint light sweep. Figure and text never overlap: the stage holds the top of the vertical frame, the text column the bottom.
- **Type.** Inter Tight Black for titles (auto-fitted to the 936 px measure, tracking -20), Inter Tight ExtraBold for the second line, Space Mono Bold for all meta (index, HUD, chips, captions) with wide tracking. Titles enter by mask slide-up: title first, second line about 0.08 s later, the chip after; meta types on one character a frame with no caret.
- **HUD.** Mono corner text on every card (library and style top left; the chapter top right, typed on at the cut) and a tick bar of one tick per card at the bottom (current tall, done dimmed, the rest faint).
- **Captions.** With a voice, captions are a mono line on a solid band in the card's darkest tone at the bottom, never over the title, each word appearing on its spoken onset.
- **Motion.** Exponential ease out for entrances (zero speed, 6% influence out of the first key, 92% into the second), exponential in and out for whips (88% both sides). The rows whip one cell at every cut in alternating directions, a few thousandths of a second apart, top to bottom, with motion blur; between cuts they drift a few pixels. The figure arrives as four horizontal bands sliding into register from alternating sides. Props pop open about their centre. Nothing fades and nothing dissolves.

## 3. Camera grammar

Mostly a locked flat frame; energy comes from row shifts, cuts and figure actions. When the camera moves, it moves along the grid.

| Move | Expresses | In AE |
|---|---|---|
| Locked flat frame | clarity, the card as a poster | no camera: rows drift, the card changes on the cut |
| Row whip at the cut | the next card, same family | `keys()` on each row's separated X position: one cell, 0.2 s, staggered a few ms per row, Tint swaps the hue on the cut |
| Push into one disc until it fills the frame | zooming into a part | scale the disc layer (anchor at its centre) past the frame's far corner |
| Pull back to the stage | the part becomes the next card | scale it back to the stage size and turn it into the sun disc (both Tint maps to one tone) |
| Rows stop one by one | the end, the last card held | each row's last key a few hundredths of a second after the one above |
| Rows slide in from alternating sides | the opening | each row starts one frame width plus two cells off-screen |

Never a dissolve, a 3D camera move, handheld shake or depth of field.

## 4. Native moves (pick what the story needs)

One card = one item, and the count is the hook · chapter = colour · one verb per item (a held pose change per beat or spoken word) · the figure assembles in bands · a count-up slam (a giant number rolling to its value on a bar, zero-padded so the width holds) · a part pushed to full bleed that becomes the next card · rows stopping one by one at the end.

## 5. Sound palette

Percussion is the spine: a drum family that suits the topic (frame drums, taiko, marching snares, steel pans, an electronic kit) plus rim clicks, claps, shakers and crashes, every card onset a hit. Colour instruments on top: plucks, mallets (marimba, glockenspiel), detuned chord stabs, a synth bass. Per-chapter foley accents on the cuts (a whoosh on a row whip, a pok on a prop popping, a tick per HUD character). Silence as a tool: half a beat of muted drums before a big hit, or one bar stripped to a single tick under a count. The voice, if any, is calm and sits above the music; mix to about -14 LUFS. Render the audio outside AE and place it as a layer.

## 6. AE recipe (`pictogram.jsx`, AESPictogram)

Layer stack, bottom to top:

1. **Grey stack** (printed by one Tint): a page solid at tone 1; `patternRows(comp, prefix, seed, nRows)` builds one shape layer per row (masked to its band, motion blur on); stage discs (`shapeLayer` with one ellipse at grey 3) that pop open on the card's cut.
2. **Tint adjustment** (`ADBE Tint`): Map Black To and Map White To hold-keyed per card to the hue's ramp ends (full contrast for a chapter card, `LOW` = .1 and .62 under type). Everything above it keeps its own colours.
3. **The real frame**: `tools/disc.mjs` crops the scene frame to a grey square; the layer has a circular mask and its own Tint (darkest tone to cream), scale keyed for the iris, the push to full bleed and the return.
4. **Light sweeps**: a 180 px white rect with a 90 px horizontal mask feather, 16 degrees, 9% opacity, Add, travelling across each stage card.
5. **Figures and props**: `figure(comp, name, seq, x, y, s, color, t, t1)` draws the figure once (held path keys for pose changes), duplicates it into four band copies with band masks and slides them into register; `prop(comp, name, nodes, pos, t, t1)` pops a prop open.
6. **The count**: one text layer rolled with `AESLib.bakeText` (21 zero-padded values on an exponential ease, one batched call), a signal or gold bar filling under it over a faint track.
7. **Text column**: `txt()` sets a layer flush left (anchor at the ink's left edge) or flush right; `fit()` shrinks a title to the measure; `slide(T, t, { out })` is the mask slide-up (the mask is keyed against the layer's rise so the clip stays still in the comp); `typeOn(T, t, n)` steps a mask one character a frame.
8. **HUD, caption band, tick bar**, then a grain adjustment (`ADBE Noise`, 3%, not colour) on top.

Motion blur is on for the comp, the rows, the figure bands, props, titles and the frame.

Build time: about 5 s for 134 layers (about 2 s of it the eleven pattern rows); render about 2 minutes with aerender.

**Gotchas found while proving it**

- Effect colour properties (Tint's Map Black To and Map White To, a shape fill) ease as ONE dimension: `setTemporalEaseAtKey` with four `KeyframeEase` objects fails ("Value array does not have 1 elements"). `easeArr()` gives colours a single ease.
- Set `inPoint` before `outPoint` on a layer whose keys are added afterwards: the numeral set its out point first and then its in point, and stayed on screen through every later card.
- A text column with a two-line title and a chip runs into the caption band unless the block starts higher; the end card starts its block at y 1150, and `buildScene` clamps any chip above the band (and says so in the notes).
- Typed meta uses a stepped mask, not Source Text keys: each HUD line is one static layer per card, so its anchor (flush left or flush right) never jitters while it types on. Only the count rolls Source Text, in one `AESLib.bakeText` call, zero-padded so the width holds.
- The rows separate their position dimensions and key X only, so a whip never picks up spatial overshoot.

**Close, not identical:** Lemo draws five hand-picked tones per hue; here Tint prints a grey stack along a straight ramp between the darkest and lightest tone, which reads the same but loses any hue shift inside the ramp. The proof scene is English only, so the "second language" line is a heavy English second line (a reel can set it in a second language with a CJK-capable face). The proof does not stage the long take, the pace ladder or the icon wall; they are moves a reel adds when its list calls for them. The light sweep is a feathered rect, not a gradient. Grain is an AE Noise layer rather than a mux-time filter.

## 7. Dependencies

Inter Tight installed with its Black and ExtraBold styles (`assets/fonts/InterTight[wght].ttf`, OFL) and Space Mono Bold (`assets/fonts/SpaceMono-Bold.ttf`, OFL); `AESPictogram.fontOK()` checks. Node 20+ and ffmpeg for `tools/disc.mjs`. Effects: Tint and Noise only; everything else is shape layers, text layers, masks and keys.

## 8. Pitfalls of the medium

Figure parts spreading into the text column: keep the stage on top and the text column below, and move a horizontal pose's stage outward. Cream on a light hue fails contrast: dark type and dark figures on light hues, with the disc a lighter tone. The sun disc vanishes on the dark neutral: give it a lighter tone. Imitating a real games identity too closely: your own palette, names and motifs. Too many motif kinds at full contrast under type turn to noise: low contrast under type. Text a viewer must read needs time (at least 1.8 s, or the line's length plus 0.6 s); a card that must be read holds at least 1.6 s.

## Reference

The proof is the shared test scene, built by `buildScene` and proven with `node production/styles/harness/prove.mjs pictogram-motion`, which rebuilds it from a blank project and renders it with aerender. `proof/compare.jpg` sets it beside Lemo-Opuscar's pictogram-motion poster.

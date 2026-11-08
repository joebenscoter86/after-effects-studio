# Woodcut print

> A relief print that carves itself: every frame is a black wood block on laid paper, and light exists only where a knife has cut it away.

Adapted for native After Effects from Lemo-Opuscar's *Woodcut Print* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only, after the wordless woodcut novels (Masereel, Lynd Ward), Kollwitz's gouges and Dore's line spacing: never their plates, figures, borders or titles.

## 1. What it is, and what it is not

Each shot is one printed plate: black ink on warm laid paper, inside a paper margin. Three rules of relief printing hold everywhere:

1. Black is the wood, white is what the knife removed. A bright area is many wide cuts, a dark area is untouched wood.
2. Pictures appear by being carved. Nothing fades in: cuts grow, brightest first.
3. The block is a mirror. Letters read backwards on the block and true once the paper is pulled.

Not a copperplate engraving (no swelling burin lines built up on white), not a linocut poster (no flat colour areas), not a photo run through a threshold filter (the cuts are a line screen whose width follows tone, bent by the image).

## 2. Grammar

- **Two values carry everything**: ink `#17130F` on laid paper `#EFE6D2`. The raw wood colour (`#241A12` inked, `#B98A5B` in the grooves) appears only while the block itself is shown.
- **Tone is a carving instruction.** Every drawing is made in tone: 0 is uncut wood, 1 is cut clean away, between is hatched, with wider cuts where it is brighter. Far is dark and dense, near the light is wide. Skies are ramps that open towards the light.
- **Figures**: a black silhouette with a white knife outline; skin carved white with the features left black; grazing light as a narrow mid-tone band on the lit edge only, so a few cuts land there and flat areas stay black.
- **Stab cuts** (white flecks) are stars, snow, wood chips and counts; they need black behind them.
- **One colour plate at most**, copper `#C25A2B`, printed only where wood was cut away (Darken: it never touches the ink). It is for the one thing that matters, spreads at its peak and shrinks to a single highlight afterwards.
- **Type**: titles are carved into the block (IM FELL English SC, wide tracking); carved lines in IM FELL English Italic; numbers in IM FELL English. Captions are letterpress in the paper margin below the block (IM FELL English Italic, ink, slightly roughened): ink comes up in 0.1 s with no slide and fades over 0.15 s. Plate numbers (PLATE I, II...) sit in the top margin, like a woodcut novel.
- **Motion**: characters and objects on twos (12 fps, `posterizeTime(12)` on their keys); the camera and the carving on ones. The cuts never boil: the line screen is fixed per plate.

## 3. Camera grammar

The camera moves over the paper; the margin never moves.

| Move | Expresses | In AE |
|---|---|---|
| Locked plate | a page of a wordless novel; reading time | no keys on the sheet; only pieces carve in and act |
| Slow macro push on a carved frame | patience, attention | scale on the footage inside DRAW (100 to 107), so the cuts keep their width |
| Track with the knife tip | making; the line is the story | the knife's tip keyed to the end of the last carved word, on twos |
| Hard cut on the beat, a new impression | a series of prints | the ink layer jumps 5 px then 2 px for two frames (misregistration), then sits |
| The peel | one state printed over another | the held sheet (a time-remapped instance of SHEET) rotates off about its top edge, slow then fast, showing the next plate |

Transitions are hard cuts (new impressions), the peel, and at the open the paper laid onto the block. Never a dissolve.

## 4. Native moves (pick what the story needs)

Light is carved (radial cuts from a sun or a lamp) · carving = time (cuts grow along a wipe, brightest first) · mirrored block to true print (the open) · stab cuts as a count · the one colour plate spreads and withdraws · a real frame carved by the same knife · wordless-novel sequencing (plate numbers, few words) · the frame in a frame (an arched window, an oval medallion).

## 5. Sound palette

Low strings (pizzicato, spiccato), wood and skin (log drum, woodblock, frame drum), timpani, one tam-tam, struck metal. Foley follows the material: knife into wood (transient plus torn fibre), chips, brayer tack, paper air, baren rasp, the wet peel. Silence before the loudest moment. Music ducks about 8 dB under the voice. Render audio outside AE and place it as a layer.

## 6. AE recipe (`woodcut.jsx`, AESWoodcut)

Four comps: **DRAW** (block size, 952 x 1380) holds the tone drawing; **SCREEN** (2000 square) is the knife's line screen; **CARVE** (block size) cuts DRAW with SCREEN; **SHEET** (frame size) prints CARVE on paper. The main comp holds the table and the block (open), the sheet, the blank paper, the peel, captions and plate numbers.

1. Tone pieces: `piece(comp, name, nodes, pos)` from nested nodes (`poly`, `line`, `rect`, `circle`, `ellipse`, `group` with `pivot`) whose `fill` and stroke `sc` are tones (0 to 1); strokes sit on top of fills, so a black part with `sw: 6, sc: 1` gets its white knife outline. `ramp()` is a solid with a linear Ramp for skies and grounds. `flecks()` scatters stab cuts.
2. Carve reveal, `carveIn(layer, t0, dur, angle, feather)`: a Linear Wipe (feather 50 to 90) keyed from 100 to 0, so the cuts grow along a direction. A tone that rises from 0 (opacity keys) grows its cuts brightest first.
3. SCREEN, `screenComp()`: black, one white bar (height half the period, 15 px period) repeated down the comp (Repeater), Gaussian Blur 0.32 x the period: a soft line profile.
4. CARVE, `carvePass()`, bottom to top: DRAW (Turbulent Displace 1.6 / size 5, static: chipped edges); SCREEN (rotation held per plate, Turbulent Displace 5 / size 34, Displacement Map from DRAW's luminance, vertical 9 px, then Linear Light at 40%); CHIPS (Fractal Noise scale 16, Linear Light 8%); an adjustment layer with Gaussian Blur 1.4, Threshold 0.5, Gaussian Blur 0.7. Tone + 0.4 x (2 x screen - 1) crosses 0.5 only where tone allows, so tone 0 never cuts and tone 1 always does.
5. SHEET, `printSheet()`: paper; CARVE with Tint (black to ink, white to paper) and Roughen Edges (border 9, the ragged block edge), its position expression adding the two-frame misregistration after every cut; GRAIN (Fractal Noise, scale 1600 x 26, Multiply 16%: wood grain in the cut white); SPECKS (Fractal Noise, contrast 600, Screen 40%); PAPERTEX (Fractal Noise, Overlay 14%).
6. Colour plate, `colourPlate()`: a copper shape on SHEET in Darken, offset 3 / 2 px, moved directly above the print (under grain, specks and paper texture). The count's plate scales open in Y on its word; the end's plate fills the medallion, then shrinks to a point on the ring.
7. Real footage: `tools/tone.mjs` crops the clip, greys it, softens it and pushes it through an S-curve (darks sink to uncut wood, skin lifts to about 0.8), multiplies a thin keep-line from its edges, and writes an mp4 at 12 fps (on twos) or a still. It sits in DRAW inside an arched window (alpha track matte), opacity keyed up so the cuts grow brightest first.
8. The open: the block (CARVE again, Tint to inked wood and pale grooves, scale X -100) on a dark table with a wood side, a brayer highlight (Add 22%, feathered mask) rolling down; a blank paper sheet (3D, hinged at its top edge) lays down from -84 degrees between 0.3 and 0.48 s; a Radial Wipe (feather 160) on it is the baren's spiral as the print soaks through.
9. The peel: SHEET again, 3D, time remap held at a frame of the input, hinged at its top edge, Rotate X keyed 0 to -96 from "becomes" to "next", slow then fast (its bottom swings towards the camera), revealing the live sheet below.
10. Captions and plate numbers: `AESLib.text` in ink in the margins, opacity keyed, Roughen Edges border 1.4 on captions. Every text change goes through `AESLib.textKeys` / `AESLib.bakeText` in one call per layer.

**Gotchas found while proving it**

- Multiply is the wrong mode for the colour plate: copper times ink is visibly darker than ink, so the plate's rectangle showed over the black. Darken keeps the ink exactly and colours only the cut paper. The plate also has to sit under the grain, specks and paper texture, or their lift shows its box.
- Roughen Edges' Scale has a minimum of 10 from scripting (8 throws "out of range 10 to 1000").
- Radial rays long enough to fill the sky ran through the carved title; keep rays below the title band (outer radius about 560 from a horizon sun).
- A tonal ramp that crosses the 0.1 to 0.3 band over a large area turns into broken, noisy cuts (the chip noise dominates there). Start skies at black lower down and keep the transition short; a "glow" ramp under a carved line read as dirt and was dropped.
- A knife whose handle points up-right covers the word it has just cut; point the handle down-right from the tip.
- A 3D orientation tilt on the peel made the sheet look crooked before it moved; a straight Rotate X about the top edge reads as a page pulled.
- The Displacement Map's map layer is set by index (`setValue(layer.index)`) right after the map layer exists; AE keeps the reference when later layers shift the indices.

## 7. Dependencies

- After Effects 2023 or later (`Layer.setTrackMatte`).
- Fonts (OFL, bundled in `assets/fonts/`): IM FELL English SC Regular, IM FELL English Regular and Italic.
- Node 20+ and ffmpeg for `tools/tone.mjs`. No generated pieces.

## 8. Pitfalls of the medium

- White marks on white are invisible: stab cuts and knife outlines need black behind them.
- Hatching every surface reads as fur or rain: keep most areas at tone 0 or 1 and give mid tones only to light (skies towards the sun, lit edges, screens, pages).
- Tones near the screen's limits flicker their cuts: keep fills at 0, 1 or clearly between (0.15 to 0.85).
- The style's captions want at least 1.8 s on screen; the proof scene's beats are shorter by design.
- Close rather than exact: the cuts are one line screen per plate, bent by the image's tone, not Lemo's per-stroke engine (separate cuts with blunt entries and tapered exits, streamlines that wrap each form); the carve reveal is a feathered wipe or a rising tone, not stroke-by-stroke timing; the peel is a flat page about its top edge, not a sheet curling on a cylinder with mirrored show-through; the score and foley are not built.
- A 9:16 reel puts the block in a portrait plate with a tall bottom margin; the reference's plates are landscape.

## Reference

Lemo-Opuscar `styles/woodcut/` (STYLE.md, DEMO.md, `demo/engine/` carve and print passes; poster.jpg). The proof is `proof/compare.jpg` (Lemo's poster above our seven beats) and `proof/proof.mp4`.

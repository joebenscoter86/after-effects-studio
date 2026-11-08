# Risograph print

> Animation that looks printed, frame by frame, on a stencil duplicator: two or three translucent spot inks overprinted on warm paper, halftone dots fixed to the sheet, ink grain, and plates that never quite line up.

Adapted for native After Effects from Lemo-Opuscar's *Risograph Print* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only, after real riso prints and the small-figure-in-a-wide-world tradition of riso illustration: never a machine maker's brand, logo or trade dress (ink names are colour references only), and never a real illustrator's characters or compositions.

## 1. What it is, and what it is not

A risograph prints one colour at a time: each colour is its own stencil, a plate, with its own drum of translucent ink. That one fact makes the look. A tiny palette (two or three spot inks on warm off-white paper). Overprint mixing: inks multiply, so two inks make a third colour. Misregistration: every plate lands a few pixels off, so edges show slivers of paper or a coloured fringe. Halftone dots for every tone, each plate on its own screen angle, the dots fixed to the paper. Imperfect ink: pinholes in solids, streaks along the feed, blotchy density. Flat shapes and silhouettes, no outlines.

Not flat vector art with a noise overlay (every colour comes from the plates), not CMYK pop-art halftone (no process colours, no keyline), not a screen-print poster (riso ink is translucent and grainy, not opaque), not paper collage (nothing is cut out or lifted; it is one printed sheet).

## 2. Grammar

- **Inks.** Blue `#0078BF`, fluorescent pink `#FF48B0`, yellow `#FFE800` on paper `#F4EEE2` (`AESRiso.PALETTE`; override per brand with `opts.palette`, three inks and their names). Every other colour is an overprint or a tint: blue over pink is violet, blue over yellow is green, pink over yellow is orange. Paper white is a colour too (knockouts, highlights, subtitle strips).
- **Densities, not colours.** Everything is drawn once, in the `ART` comp, in density triplets `[plate 1, plate 2, plate 3]` from 0 (paper) to 1 (solid): `[1, 0, 0]` is solid blue, `[.24, 0, 1]` is solid yellow with a 24 percent blue tint (a green-yellow field), `[1, 1, 0]` is the double hit of blue and pink. Normal blending is a **knockout** (the paper shows through every plate beneath); Add blending is an **overprint** (it adds ink only to the plates it names).
- **Composition.** At most two plates in any area, at most one of them as a tint (three halftones on top of each other is mud). Big flat shapes, lots of solid ink and paper; halftone in a few stepped bands (16, 32, 52, 100 percent) for sky and distance. One horizon, one big disc, one small figure with its head against the flattest colour in the frame. Design for the one-plate version: blue alone carries every silhouette, so a frame with only the blue plate still reads.
- **Halo.** Figures, pieces and type get a paper-white knockout halo (5 to 11 px). The plates misregister around it, so it picks up coloured fringes like a real trap.
- **Type is printed.** Titles in a heavy grotesque (Archivo Black, OFL), captions in a geometric sans, tracked caps (Josefin Sans SemiBold, OFL). A title printed on two plates (`[1, 1, 0]`) shows the riso double hit when they misregister. Subtitles sit on a paper-white knockout strip with the text on one plate. Prints do not fade: type arrives on a beat and leaves on a cut.
- **Motion.** Figures and pieces on twos (12 fps); camera moves and plates on ones. Registration is fixed per shot (1 to 3 px), kicks on accents (8 to 14 px, ringing out in a quarter second) and drifts through a held moment (up to about 25 px), snapping back on the downbeat. Grain boils partly (about a third of it re-rolls at 8 fps); streaks and blots stay put.

## 3. Camera grammar

| Move | Expresses | In AE |
|---|---|---|
| Wide lateral track, small figure, empty sky | travel, routine | a null in ART keyed on ones, the world parented to it; the figure walks on twos in screen space |
| Locked composition: horizon, disc, figure | stillness, a title | no keys; the figure's head against the disc |
| Static wide, pieces land in turn | building a picture | each piece eased in on twos on its spoken word, a registration kick when the picture completes |
| Push into the print | a close look | the photo's scale keyed on ones; the dots do not grow, the image slides under the screen |
| Overprint growth | one thing becomes the next | a disc on Add grows over the frame, turning everything beneath into its mix, then shrinks into the next shot's key shape |
| Plates roll in, plates lift off | an arrival, an ending | a mask on a plate layer whose edge sweeps down the sheet (the feed direction) |
| Hard cut on the beat | punch | in and out points on the beat times |

Framing: lots of paper and solid ink, text on empty sky or a knockout strip. Never a cross-dissolve, never a soft digital wipe.

## 4. Native moves (pick what the story needs)

Plates as narrative (the frame opens in one ink and gains a plate at each turning point) · two inks, a third where they meet (the count printed in pink over a yellow sky and a blue hill) · the overprint transition (the photo becomes a pink disc that floods the frame and shrinks into the sun) · registration as rhythm (kicks on accents, a drift through the typed line, a snap on the downbeat) · the knockout reveal (a shape made only of missing ink) · halftone scale (push in until the dots are shapes) · one ink left (plates lift away until the last line stands in blue).

## 5. Sound palette

Warm, dry, handmade, slightly lo-fi: upright or electric bass, vibraphone or marimba, nylon guitar, a whistled melody, Rhodes, toy piano, brushed kit, shaker, a small drum machine through tape saturation. Layering like plates (each new plate brings one instrument; they leave one by one at the end). The machine is the signature foley: a feed "shhk", a drum "ka-chunk" when a plate rolls in, motor hum, a sheet landing on a stack. Silence pairs with a registration drift and the snap brings everything back. Dry and close; music ducked about 8 dB under the voice; about -14 LUFS. No grain added at the mux: it is in the print. Render the audio outside AE and place it as a layer.

## 6. AE recipe (`riso.jsx`, AESRiso)

1. **Prepare.** `tools/screen.mjs` writes one halftone screen per plate, the size of the frame: a cosine spot function, period 9 px, on its own angle (15, 45, 75 degrees), stored as a threshold from 0.04 at a dot centre to 0.82 between dots. `tools/separate.mjs` turns the real frame into a density PNG: R = the shadows (a smoothstep, solid below lightness 0.1, none above 0.55), G = a 40 percent tint wherever it is not paper (the skin), B = 0.
2. **ART** (`plates()` makes it): a comp the size of the frame with a black solid at the bottom. Everything in the scene is drawn here in density triplets. Normal = knockout, Add = overprint. Shape layers come from `piece(comp, name, nodes, pos)` (nested `poly`, `circle`, `rect`, `group` nodes, later on top); type from `type(comp, name, str, o)` (anchored on its ink centre; `halo` px becomes a black text stroke behind the fill); subtitle strips from `strip()` (a zero-ink rounded rect).
3. **The halo.** `halo(L, px)` duplicates the layer under itself, adds Fill (black) and Simple Choker (Choke Matte = minus px). Call it after the layer's keys and expressions are set: the copy carries them. Never on an Add layer (an overprint has no trap).
4. **Plate comps**, one per ink, bottom to top: a black solid; the ART comp with Shift Channels (Take Red, Green and Blue all from the plate's channel: 2, 3 or 4); the plate's screen on Subtract; Fractal Noise solids on Subtract for the ink: blot (scale 450, 10 percent), feed streaks (scale 4 by 1400, 8 percent), grain (contrast 220, rendered 2.5 times larger and scaled down, 16 percent), a boiling grain (the same, Evolution `posterizeTime(8); time * 777`, 9 percent) and pinholes (contrast 700, brightness -300, 100 percent, boiling); an adjustment layer with Levels (input black 0, input white 0.06: the cut, about half a pixel of anti-aliasing) then Tint (black to white, white to the ink).
5. **The sheet** (the main comp): the paper solid, the three plate comps on Multiply (translucent ink: two inks make a third), then a mottle (Fractal Noise, Overlay 12 percent) and fibre (stretched Fractal Noise, Soft Light 9 percent) over all of it.
6. **Registration.** `register(plates, beats, kicks, drifts)` keys each plate layer's position in one call: a fixed offset per shot (hold keys on the beat times), kicks (offset times 1, -0.45, 0.2, -0.08, 0 at 0, 0.05, 0.1, 0.17, 0.27 s, linear), drifts (linear to the drift, hold, then the next shot's offset or kick snaps it back).
7. **Gates.** `gate(L, { in: [t0, t1], out: [t0, t1] })` puts one rect mask on a plate layer (feather 8 px vertical): rolling in, its lower edge sweeps down the sheet; lifting off, its upper edge does.
8. **Figures and pieces** move on twos: `posterizeTime(12); value;` on position and rotation, limbs driven by one clock expression on twos (`figure()`, feet at the layer origin, 300 px tall at scale 100, legs and arms `24 sin p` and opposite, a pink scarf). Camera nulls and the photo's push are keyed on ones.
9. **Text keys.** The count and the typed line are one `AESLib.bakeText` call per layer. Never key Source Text one call per key.

**Gotchas found while proving it**

- Fractal Noise will not go below scale 10, which made the ink grain and pinholes blobby next to a 9 px dot screen. Render the noise solid 2 to 2.5 times the frame size and scale the layer down by the same factor.
- A solid printed at density 1 needs headroom over the screen's top value plus the Levels cut, or the grain punches it full of holes: with the screen topping out at 0.82 and the cut at 0.06, a solid has 0.12 to spare, and the grain layers stay under that except at the pinholes.
- A title at 158 px (and the end card at 200 px) ran off a 1080 frame once the halo stroke was added: size big type for its width including the halo.
- Levels in ExtendScript took 0 to 1 values (`Input White` 0.06), Shift Channels took the menu index (2 Red, 3 Green, 4 Blue); both set cleanly in AE 2026 with no notes.

**Close, not identical:** the reference prints in a shader with a roller sweep that carries a heavier ink band at its edge, per-plate rotation as well as offset, and a feed-direction density gradient; here the roller is a plain feathered mask, plates only translate, and density varies by blot noise alone. The reference's figures are drawn with halftoned shading and limbs by 2-bone IK; here figures are flat one-ink silhouettes on simple swinging limbs. The real frame is a still separation (one frame of the clip) rather than the moving clip.

## 7. Dependencies

Archivo Black Regular and Josefin Sans SemiBold installed (`assets/fonts/`, OFL; `AESRiso.fontOK()` checks). Node 20+ and ffmpeg for `tools/screen.mjs` (one halftone screen per plate) and `tools/separate.mjs` (a real frame into plate densities). Stock effects only: Shift Channels, Levels, Tint, Fractal Noise, Fill, Simple Choker, plus shape layers, masks, text strokes and blending modes (Add, Subtract, Multiply).

## 8. Pitfalls of the medium

Three halftoned plates in one area are mud: two plates, one tint. A main colour without the first plate floats loose when the other plates are off: build every colour up from the blue silhouette. Dots of a saturated ink on skin look like a rash: skin is a light tint. Per-frame registration jitter flickers and bloats the file: one offset per shot, kicks on accents, partial boil only. A stepped camera judders: camera on ones, figures on twos. A screen fixed to the drawing instead of the paper makes the dots crawl with the picture: the screens live in the plate comps, in screen space. Very light tints (under about 10 percent) print nothing: the dots never reach the threshold. A halftone shown at 25 percent turns into flat colour; judge the dots at 100 and 50 percent.

## Reference

The proof is the shared test scene, built by `buildScene` and proven with `node production/styles/harness/prove.mjs risograph`, which rebuilds it from a blank project and renders it with aerender. `proof/compare.jpg` sets it beside Lemo-Opuscar's risograph poster.

Build time: about 5 s for 56 layers (three plate comps over one ART comp); render about 55 s alone, about 170 s with the finer grain while other proofs shared the machine. The count and the typed line are one batched Source Text call each (`AESLib.bakeText`).

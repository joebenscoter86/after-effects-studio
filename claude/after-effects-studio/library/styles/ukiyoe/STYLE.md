# Ukiyo-e woodblock print

> Edo woodblock prints brought to life on a handscroll: a sumi key line, a few flat colour blocks each a hair out of register, bokashi skies, paper you can feel, and a camera that slides from print to print.

Adapted for native After Effects from Lemo-Opuscar's *Ukiyo-e* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only, after the landscape and actor prints of the 19th century (Hokusai, Hiroshige, the okubi-e head portraits) and the anime *Mononoke*: never a specific print, its composition or its characters (no copy of *The Great Wave* or *Red Fuji*).

## 1. What it is, and what it is not

Every shot is one complete woodblock print: a sheet of warm washi inside a thick and thin ink border, flat colour printed from separate blocks, a black key block on top, cream cartouches for titles and a red seal. The world is flat on purpose. Depth comes from stacked horizontal bands (sky, mountain, mist, sea), bold cropping and an extreme foreground (a pine, a plum branch), never from perspective, light or shading.

What makes it read as printed rather than vector: the paper always shows; each colour is its own block, set 1.5 to 2.5 px off the key line; colour carries woodgrain, uneven density and fine specks; skies and grounds are bokashi (hand-wiped gradients with a wandering edge).

Not a flat vector illustration with a paper overlay, not Chinese ink wash (no bleeding, colour is printed), not cel shading (no light and shadow on forms). A real frame is not a photo with a filter: it is cut into blocks (key line, flesh, hair, a pale blue-grey beard, the garment) and printed like everything else.

## 2. Grammar

- **A pigment set, not a colour wheel**: paper `#EFE4CC` is the white; sumi `#1C1A1D` key line over everything; Prussian blue `#1F3D73` carries skies and water with pale blue `#8FAECB`; indigo `#2B4070` garments; greens `#557352`; ochre `#CC9E54` and brown for wood and straw; flesh `#F4D9C2`; beni red `#BF3A2E` is rare: the seal, a sun, an obi, plum blossom. A second impression changes the colour blocks only (night: `#17244A` sky, indigo sea, moon left as paper; the portrait: beni ground, grey-green garment, mauve beard, flesh left as paper).
- **Blocks**: every drawing is printed twice: its colour block (fills, offset by its registration) and its key block (outlines, 3 to 3.4 px, slightly roughened). Distant things (far hills, mist) get no key line. Foam, snow and mist are paper.
- **Bokashi** in every sky and ground: an ink graded into paper over 500 to 900 px, its edge wandering about 26 px per column.
- **Type**: Shippori Mincho Medium in sumi on cream slips with a thick and thin border. A title cartouche holds the main line and a pale pink tab with a tracked capital line under it; a vertical cartouche holds kanji (試し刷り "test print", 似顔絵 "likeness", 一枚 "one sheet"); a seal holds one character cut out of red (試, 景, 数, 詞, 再). Subtitles are horizontal cartouches with a small seal at the left, fixed near the bottom of the screen.
- **Motion**: prints are still. Most of the frame never moves; each view has one small action (birds, rain). Birds step at 8 fps, rain and counts at 12, the camera on ones.

## 3. Camera grammar

The camera moves over prints and between them; it never rotates in 3D inside one.

| Move | Expresses | In AE |
|---|---|---|
| Handscroll slide, right to left (the next print arrives from the left) | the next station, the next step | the SCROLL comp's anchor point keyed from one sheet's centre to the next in 0.34 s, eased, with motion blur |
| Locked frame on one sheet | reading a print | no keys while a view prints and holds |
| Very slow push | attention narrowing | SCROLL scale 100 to 104 over the portrait |
| Printing, block by block | something being made | see section 6 step 4 |
| The same key block, a second impression | before and after, one thing becomes the next | the portrait's key matte on a new sheet, new colour mattes on its words |
| Wash back to paper | an ending, a clean start | the print's opacity to 0, the seal left on the sheet |

Transitions are scroll slides, printing reveals and the wash. No dissolves, no 3D flips.

## 4. Native moves (pick what the story needs)

The handscroll (sheets in a row, the camera slides) · printing block by block (key, then each colour lands and snaps into register) · a real frame cut into blocks (an okubi-e of the speaker) · alternate impressions (the same key block in a second palette) · cartouche and seal as the view's full stop (the seal stamps on the last word) · paper is the white (mist, foam, snow, the moon, and the final wash) · a count stamped as "counted" (the seal lands on the word).

## 5. Sound palette

Japanese instruments rather than piano and pads: shamisen with sawari buzz, shakuhachi, koto, taiko and shime-daiko, kotsuzumi calls, hyoshigi clappers, a small bell. Silence as ma. Foley follows the material: baren rub on each printing reveal, a scroll slide, the seal (a low thump and a tacky peel), rain. Music ducks about 8 dB under the voice. Render audio outside AE and place it as a layer.

## 6. AE recipe (`ukiyoe.jsx`, AESUkiyoe)

Comps: one **INK** comp per view (the image area, 908 x 1600: the blocks), one **SHEET** comp per view (1000 x 1760: washi, the INK, the border, fibres, ageing), one **SCROLL** comp (all sheets side by side right to left, 1180 px apart, on mount paper) and the main comp (the SCROLL under the camera, then subtitles).

1. Drawings are node lists (`poly`, `smooth` Catmull-Rom, `line`, `sline`, `rect`, `circle`, `ellipse`, `group`) with `fill`, `key` (key-line width, 0 = none) and optional coloured strokes `sw` / `sc`. `block()` emits the fills at the block's registration offset (`REG`, 1.5 to 2.5 px a different way per block); `keyLine()` emits the outlines in sumi with Roughen Edges (border 1.2, scale 10).
2. `bokashi(C, name, ink, y0, y1, wander)`: a solid of the ink with a LUMA track matte: a Ramp (white at y0, black at y1) bent per column by a static Turbulent Displace (size 260, amount about 26).
3. INK layer order, bottom to top: colour blocks and bokashi; `inkTexture()` (GRAIN: Fractal Noise 1300 x 16 with Turbulent Displace 34 / 140, Overlay 26%; MOTTLE: Fractal Noise scale 180, Overlay 20%; both Preserve Transparency so they touch only ink); key blocks, cartouches, text and seals; `inkSpecks()` (Fractal Noise contrast 620, brightness -175, scale 4, Screen 30%, Preserve Transparency).
4. Printing, `printIn(layer, t, 0.3, slide, mover)`: Linear Wipe at 225 degrees (a diagonal baren sweep from the top left; feather 120, completion 100 to 0) followed by Roughen Edges whose border is keyed 26 to 0 (a noisy edge while it lands, the block's own edge after), and the block (or its matte) sliding 5 to 6 px into register. Text uses angle 270 (left to right). Cartouches drop in (16 px and a fade over 0.26 s); seals stamp (scale 135 to 100 in 0.2 s).
5. The real frame: `tools/blocks.mjs` cuts the clip into one grey matte per block (key, flesh, hair, beard, cloth) at 8 fps, scaled to the image area (ground above the head, the garment carried down to the border). In the INK comp each block is a flat solid with its matte video as LUMA track matte (time remapped so it holds its last frame); the matte slides into register while the solid's sweep reveals it. Order: ground bokashi, flesh, beard, garment, hair, texture, key.
6. SHEET (`finish()`): paper; the INK; the border (a 7 px rule 5 px outside the image and a 2.2 px rule 17 px outside); FIBRES twice (Fractal Noise 300 x 5 at 28 degrees and 260 x 4 at -52, Screen 16% and 12%); WASHI (Fractal Noise scale 120, Overlay 12%); AGE (a brown solid with an inverted feathered mask, Multiply 30%).
7. SCROLL: mount colour, a mount fibre tile per sheet slot (Fractal Noise 420 x 30, Overlay 18%; the tile joins read as the mount's seams), each sheet with a Drop Shadow (distance 4, softness 16). Sheet layers and tiles are trimmed to the time they can be seen, so only one or two views render per frame.
8. Camera: the SCROLL layer's anchor point holds on a sheet's centre and is keyed to the next one 0.12 s before each beat (0.34 s, ease 80/80). Comp motion blur on, shutter 180.
9. Subtitles: Shippori Mincho 42 on a cream slip with a seal, fixed at y 1716, opacity up in 0.12 s, text printed in with the sweep. Every text change goes through `AESLib.textKeys` / `AESLib.bakeText` in one call per layer (the count).

**Gotchas found while proving it**

- A new shape layer sits at the comp centre with anchor 0: nodes drawn in comp coordinates came out half a sheet off (the border drew a cross through every print). Set anchor and position to 0 for any layer whose shapes use absolute coordinates.
- Inside one shape layer, groups added later draw below earlier ones: a slip that emitted its fills before its key lines hid the inner half of its border. Emit the key groups first.
- Roughen Edges at border 26 is right for a colour block's baren sweep but eats 30 px type mid-print; type uses border 5.
- A matte video used as a LUMA track matte vanishes after its last frame, so the portrait disappeared during the slide out. Time-remap the matte layer and extend its out point: it holds its last frame.
- The portrait cut (`tools/blocks.mjs`): the navy wall is near black too, so dark means `b < r + 5`; the beige chair has a skin hue, so flesh needs saturation above 0.27; the stubble has the same colour as the cheeks, so the beard is found by texture (local variance above 0.00012) inside the face's rows below its middle, then blurred into one soft block. A seed pixel at the face centre can land on an eye and invert the figure: take every piece that holds face pixels, plus any big piece (the body below the jaw, which a jaw shadow can cut off).
- Vertical cartouche text is one character per line (`\r`) with fixed leading; Shippori Mincho carries the kanji and kana.
- Opening on a cartouche that drops in leaves frame 0 without a title: the opening print's cartouche and key block are already printed at frame 0 and only the colour blocks and the title line print in.

## 7. Dependencies

- After Effects 2023 or later (`Layer.setTrackMatte`).
- Font (OFL, bundled in `assets/fonts/`): Shippori Mincho Medium (Latin and the kanji of the cartouches and seals).
- Node 20+ and ffmpeg for `tools/blocks.mjs`. No generated pieces: every view is drawn natively, and the portrait is cut from the scene's own clip.

## 8. Pitfalls of the medium

- Too much speck or fibre makes dark areas look like sandpaper: specks 30%, fibres 12 to 16%.
- A perspective grid for floors looks digital: planks are parallel slanted lines, never converging.
- The portrait must stay blocks: shading kept from the photo reads as a filtered photo, a busy segmentation reads as a muddy posterised blob. Keep four or five flat blocks and few key lines.
- A seal on a dark ground in Multiply vanishes: seals are Normal.
- Close rather than exact: the key line is an even stroke, not Lemo's tapered variable-width contours; woodgrain and mottle are Fractal Noise, not iso-lines of a warped noise field, and there are no circular baren streaks; the printing sweep is a wipe with a roughened edge; the portrait's key line comes from a segmentation and a local-darkness test, so it is thinner on features than a carver's line; the score and foley are not built.
- A 9:16 reel puts each print in a portrait sheet; the reference's sheets are landscape.

## Reference

Lemo-Opuscar `styles/ukiyoe/` (STYLE.md, DEMO.md, `demo/print.js` and `views.js`; poster.jpg). The proof is `proof/compare.jpg` (Lemo's poster above our seven beats) and `proof/proof.mp4`.

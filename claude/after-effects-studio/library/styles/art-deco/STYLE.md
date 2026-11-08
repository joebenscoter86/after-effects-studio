# Art Deco

> Black lacquer, engraved gold line and airbrushed geometry: a 1930s poster that moves. Every composition has one centre axis, things open and close along it, and light arrives as bulbs switching on one by one.

Adapted for native After Effects from Lemo-Opuscar's *Art Deco* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only: never copy a real poster layout, a real building, a typeface design or a melody.

## 1. What it is, and what it is not

A world of gold keylines on warm black, filled with airbrushed hard-edged volumes, organised around one vertical axis. Ornament is the picture: the sunburst is the background, a stepped plaque is the title, an arched window is a frame, a dial is the number, a row of bulbs is a reveal. Motion is mechanical and symmetrical: things unfold from the centre, doors split along the seam, lights switch on in a counted order. Native register: glamour with a clock ticking (an event, a deadline, a launch, a gala).

Not a gold-foil slideshow (things move and have volume), not Art Nouveau (no whiplash curves, no flowers), not a flat vector poster (volumes are airbrushed and rimmed), not a 60s spy title (no silhouettes on flat colour).

## 2. Grammar

- **Ground.** Warm lacquer black (`#090704`), never neutral, with a warm centre (`#33240F`) behind the axis, a slow sunburst of gold hairlines (60%) and alternating wedges (13%) turning a few degrees over the whole film, a soft vignette and light grain.
- **Gold is a material, not a colour.** Everything gold is drawn in white into one precomp (ART) and gilded once: a banded metal (a four-colour gradient of dark, mid and light gold, `#6B4A1A` to `#EDCF85`, with stretched fractal bands in overlay) shows through ART as a luma matte, over a black silhouette of ART. White is full gold, grey is shadowed gold, black is lacquer that hides what is behind it.
- **The signature stroke.** A 3.2 px keyline and its 1.4 px parallel twin; a dark engraved underline (Drop Shadow, 2.5 px) and a highlight on the lit edge (Bevel Alpha, light from the upper left); a faint glow on the brightest gold. Nothing gets a black cartoon outline.
- **Volumes are airbrushed.** A grey Gradient Ramp inside a hard-edged shape (light upper left, dark lower right) becomes a gold volume through the matte; engraved detail on a volume is drawn in black.
- **One jewel colour.** Burgundy (`#851A29`, airbrushed from `#BD3845` to `#3D0A12`) is reserved for the protagonist, here the mat behind the real frame, and it follows that frame to the end. It is the only saturated area.
- **Type.** Limelight for titles and plaques, Josefin Sans SemiBold for context, labels and subtitles (wide tracking, 380 to 520), Poiret One for numerals. Titles sit on stepped plaques. Subtitles are ivory (`#F2E8D1`) on a lacquer card with stepped ends and a double keyline, the words appearing on their spoken onsets.
- **Motifs are structure:** the sunburst (ground), stepped plaques and setback legs (titles), arched windows (frames), chevrons and half medallions (doors), the dial (numbers), the diamond medallion (the end), four-point sparkles (accents).
- **Motion.** Everything unfolds from the centre: a point, a hairline, then the plaque opens symmetrically and the text opens out of the axis. Mechanical ease (firm in and out, a small settle on doors), never floaty. Bulbs switch on with an ignition overshoot (1.6x, settling in 0.18 s). Light sweeps across the gold on the hits. The centre axis never drifts.

## 3. Camera grammar

| Move | Expresses | In AE |
|---|---|---|
| Symmetric split (two door leaves meeting at the seam) | a threshold crossed; the next room | `group()` nulls for each leaf, `mech` position from off frame to the seam (a 6 px settle), then apart |
| Unfold from the axis / fold back into it | a title or a chapter arriving or leaving | `hinge(null, keys)`: scale X of a group null on the axis, children parented while it is at 100% |
| Push-in on a dial or medallion | the number is the plot | scale a group null about the medallion's centre |
| Match on shape (rect to diamond, circle to circle) | one thing becomes the next | key the same vertex count on the photo's mask, the mat and the keylines with one ease |
| Low oblique along a marquee | light travelling letter by letter | bulbs at a beat each (`bulb()`), a sheen sweep after |
| Pull back to the whole poster | where the moment sits | scale the ART layer in the main comp |

Never a dissolve or a slide. Transitions are splits, folds, arch openings and shape matches.

## 4. Native moves (pick what the story needs)

Counted light (bulbs, one per beat or event) · threshold doors · dials carry the plot · sheen sweep and draw-on on the hit · the one colour on the protagonist · the shape match (the frame becomes the medallion) · the closing plaque.

## 5. Sound palette

Symphonic jazz of the 1920s and 30s, not a 60s big band: stride or concert piano, clarinet, strings, muted trumpet, brushes, harp glissandi, celesta. One hit per counted bulb; a glissando under a gold draw-on; a fanfare for the title plaque. Foley by material: brass click, knife-switch chunk and filament hum on a bulb, relay ticks on a dial, door spring and a bronze clang on the split, a champagne cork for the end. Silence before the most important sound. Duck music about 9 dB under the voice, master about -14 LUFS, light film grain. Render the audio outside AE and place it as a layer.

## 6. AE recipe (`deco.jsx`, AESDeco)

1. Make an ART comp the size of the main comp. Draw everything gold into it in **white**: `line()` and `sh()` (shape layers in comp coordinates, Trim Paths draw-on with `draw: { mode: "end" | "centre" }`; centre opens from the top centre of a closed path built clockwise from there), `keyline()` (a key line and its twin), `lacquer()` (black fills that hide the sunburst), `volume()` (white fill with a grey Gradient Ramp: an airbrushed gold volume), `type()` (centred on its ink, `maxW` shrinks a wide Limelight line to fit), `openMask()` (a mask that opens a text layer from its centre axis).
2. Group a plaque or a chapter under a null on the axis (`group()`), parent its layers while the null is at 100%, then `hinge(null, [[t, 0], [t1, 100], ...])` unfolds and folds it.
3. `makeGold(main, prefix, ART)`: METAL comp (solid with `ADBE 4ColorGradient` + a stretched `ADBE Fractal Noise` solid in Overlay at 55%), GILD comp (ART with `ADBE Fill` black at the bottom, METAL luma-matted by a second ART on top with `setTrackMatte(matte, TrackMatteType.LUMA)`, `CC Light Sweep` on METAL), and the GILD layer in the main comp with Bevel Alpha (1.4, -45 degrees, 0.55), Drop Shadow (near black, 95%, 150 degrees, 2.5 px, softness 3) and Glow (based on colour channels, threshold 62%, radius 16, intensity 0.5).
4. `sheen(sweep, height, hits)`: the light sweep's centre runs across the frame in 0.55 s on each hit, then holds off frame.
5. `ground(comp, prefix, cx, cy)`: the lacquer solid with a radial ramp, 32 faint wedges and 64 gold hairline rays from the axis, drawn outward at the start and turning 5 degrees over the film.
6. The jewel colour lives in the main comp **under** the gold layer (where ART is empty it shows; where ART has lacquer, the lacquer hides it). Ivory subtitles (`spoken()`) and bulbs (`bulb()`) sit above the gold. Then a vignette (an inverted, feathered mask on a black solid at 55%) and grain (`ADBE Noise` at 3.5 on an adjustment layer).
7. Numbers: the counter is one `AESLib.bakeText` call (a held step per frame on an ease-out curve) with an anchor expression that keeps it centred as it widens; the needle's rotation is keyed on the same curve, and each bulb switches on when the needle passes it.

**Gotchas found while proving it**

- Gilding the real frame through the same luma matte as the line work made it read as a solarised print: Bevel Alpha and Glow embossed every bright patch and the metal bands ran across the face. The photo now lives in the main comp **under** the gold layer with a Tint (black to lacquer, white to pale gold), so it reads as a sepia gold print, and the doors' lacquer in ART still hides it until they split.
- A group folded to a sliver (`hinge` keys at 0) still drew as a hairline on the axis for the whole film before it opened. `hinge()` now moves the in point of every child to the first key when it starts folded, and the out point to the last key when it ends folded (keeping each out point when the in point moves).
- `setTrackMatte` (After Effects 2023 and later) takes the matte layer and the type; the matte copy of ART is switched off explicitly. Effects on the matted layer (the light sweep) run before the matte, so the sweep only shows on the gold.
- Limelight is wide: a four-word title at 126 px overran a 920 px plaque. `type()` takes `maxW` and shrinks the size until the ink fits.
- Centre justification is not trusted (as in Swiss and Blueprint): every text layer is anchored on its ink's centre from `sourceRectAtTime`, and the counter, whose width changes, keeps an anchor expression.
- A layer placed with `position` after being parented lands in the parent's space: pass `pos` to `sh()` so it is set before the parent.
- The first title line needs about a quarter second to open and the title folds 0.1 s before its beat ends; anything tighter left the second line half open when the fold began.

**Close, not identical:** the reference draws a true banded gradient along every stroke and a pinhole camera with real perspective; here the bands are a frame-wide metal seen through the drawing, and the camera is flat (2D nulls). Bulb signs from glyph skeletons are not built; bulbs are rows and dials.

## 7. Dependencies

Limelight Regular, Poiret One Regular and Josefin Sans SemiBold installed (`assets/fonts/`, all OFL; `AESDeco.fontOK()` checks). Node 20+ and ffmpeg for `tools/plate.mjs` (a real frame cropped and printed grey with lifted contrast, so the luma matte gilds it). Stock effects only: Gradient Ramp, 4-Color Gradient, Fractal Noise, Fill, CC Light Sweep, Bevel Alpha, Drop Shadow, Glow, Noise.

## 8. Pitfalls of the medium

A gold point on pure black reads as a broken frame: keep the warm centre and the faint sunburst behind everything. Ornament stuck on as stickers reads as clip art: every motif must be a frame, a background or a transition. A second saturated colour kills the one colour. An off-centre composition must resolve to the axis within the shot. Text a viewer must read needs time (hold at least 1.8 s, longer than the line takes to say plus 0.6 s). A dissolve anywhere breaks the style.

## Reference

Before import, the shared test scene was built by `buildScene` from a blank project and rendered in the author's proof setup, then compared with Lemo-Opuscar's art-deco reference. In this plugin, render frames of your own build and check them against this file.

Build time: about 2.5 s for about 140 layers across the main comp and ART; the only text keys are the counter's, in one batched call (`AESLib.bakeText`).

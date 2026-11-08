# Low-poly island

> A tiny faceted world seen through an orthographic isometric lens: everything is a geometric block, and everything that appears arrives with a bounce.

## 1. What it is, and what it is not

A miniature world built from flat-shaded low-poly geometry (hexagonal tile columns, box houses with prism roofs, cone and icosahedron trees) floating in a faceted sea, watched by an orthographic camera at an isometric angle. No perspective and no horizon: the far sea dissolves into a screen-space sky gradient, so the world looks like a model suspended in colour. Light, not texture, tells the time: every facet changes colour as the sun moves, and in the dark only emissive blocks (windows, lamps, the lighthouse lantern) keep their colour.

The main character is the island itself and its hero piece, the lighthouse: a red and white tower that stacks floor by floor on the centre tile and switches on, its beam sweeping the night. The world around it is the sea, the sky gradient and the small islets where the story's other pieces land.

It is not a voxel game (no cubes of cubes, no pixel texture), not a tilt-shift photo of a real place (no perspective, no photo detail), and not a smooth-shaded 3D cartoon (no rounded normals, no subsurface).

## 2. Grammar

**Type.** Two geometric OFL faces. Wide-tracked caps (Josefin Sans SemiBold, tracking 220 to 520) for titles, labels and the end line, warm white over a soft dark-blue shadow, with a thin rule. A rounded face (Fredoka SemiBold) for subtitles and spoken lines. Titles behave like tiles: each letter (or word, for a spoken line) rises from under a water line with a cubic ease and a damped overshoot, the same curve as the tiles. Subtitles have no box: warm white with a soft dark-blue shadow, centred low, a small flat-shaded tile icon beside them whose top colour follows the time of day.

**Colour.** Pastel and low contrast, a handful of hues: sand, grass and lilac rock for the ground; off-white, peach and pale blue walls; coral, teal, plum and red roofs. Time of day is a keyed set of colours (sun, ambient, deep and shallow sea, sky zenith and horizon): airy cool day, an apricot dusk, a blue-violet night where warm windows and lamps are the only bright things. No outlines, no black; shadows and AO are the only darks.

**Motion.** Smooth, on ones. The charm is in the arrival curves: tiles rise from below (cubic ease up, then a damped-sine overshoot, a splash ring the moment they break the surface); houses, roofs, pieces and lighthouse floors drop and stack (an ease-in fall, a damped bounce, volume-preserving squash on landing); trees and small details pop (scale 1 minus e^(-ks) cos(ws), about 25 percent overshoot). Life runs underneath: the windmill turns, the boat bobs, the sea's facets shimmer. Growth is scheduled one piece per slot, so a busy passage accelerates by density, not speed.

**Composition.** Portrait: the world sits in the lower two thirds; the top third is the sky band, where titles and the spoken line sit with the world still visible below them. Subtitles sit low (y about 1690).

## 3. Camera grammar

`OrthographicCamera` only: the ortho scale is the zoom, the projection never changes. One camera whose keys jump at the cuts.

| Move | What it expresses | In the shared scene |
|---|---|---|
| Low wide, slow turntable, mid-construction | a world being built | title: outer tiles rise around a half-built island, houses drop, trees pop |
| Lateral truck along a row of tiles | a list, a sequence | picture: three islets rise, a figure, a document and a device drop onto them |
| Tight close-up, low elevation, slow ortho push | the one piece that matters | input: the screen pops up on the centre tile, the real clip playing on it |
| Locked 3/4 on one arrival | the bounce and the splash | number: the digits rise out of the sea one by one, the label rises under them |
| Locked wide, light as the clock | time passing | line: dusk to night in one beat, a window lights for every spoken word |
| One take: pure ortho zoom out plus elevation | scale, and one thing becoming the next | carry: the screen folds flat into its tile and the lighthouse stacks on it |
| Locked 3/4 wide at night, slow turntable | the world lives on its own | end: the lamp switches on, the beam sweeps, the words rise into the night |

Transitions: hard cuts on the beat; the carry and the end are one take. No dissolves, no perspective whip-pans.

## 4. Native moves

- **Procedural growth**: tiles rise, floors stack, trees pop, each on its own slot.
- **Emissive blocks in the dark**: a window per word, lamps one by one, then the lighthouse beam sweeping like a clock hand.
- **Light as clock**: the sun, the ambient, the sea and the sky are keyed colours, so a whole day can pass inside one beat.
- **Scale by pure zoom**: the carry pulls from a close-up on one tile to the whole island without any perspective change.
- **Building is composing**: every arrival is an event with a time, so a score (or foley) can hit each one.

## 5. Sound palette

Pitched percussion that suits the facets: marimba, kalimba, woodblock, bells, celesta, vibraphone; a soft pad and light shaker underneath; pentatonic so any order of notes stays consonant; no piano, no strings. Each arrival carries a note. Foley by material: bubble sweep and splash with droplet ticks for a rising tile, a wooden knock and a quieter bounce knock for a floor or roof landing, a glass tink for a window, a low whump with an electric hum for the lamp. Beds: low-passed water, a few gliding bird chirps by day, crickets at night. Voice clear and gentle, well above the music; no grain on the picture.

## 6. AE recipe

The world is a Blender plate; everything around and inside it is built by `buildScene` in `lowpoly-island.jsx` from a blank project.

1. **The plate** (prepare): `tools/plate.mjs` renders `tools/island.py` with local Blender (EEVEE, 32 samples, about 3 to 10 s a frame at 1080x1920 on an M5, 15 to 50 minutes for the shared scene depending on what else is rendering) into `{cache}/plate/island_NNNN.png` and writes `{cache}/track.json`. The whole scene is one Blender world: a hex island (37 columns plus three, axial layout, a thin top cap over a darker side column sunk below it, a 6 percent gap so the seams read, lightness jittered per tile through the object colour), six houses, nine trees, a windmill, lamps, a dock and a boat; three islets for the picture beat 40 units east; the digits 40 units west; a faceted sea (a triangulated grid, flat shaded, displaced by a drifting Clouds texture) whose colour mixes deep to shallow near land and whose alpha fades with the camera's view depth over a band that is a fixed fraction of the frame height (from 10 to 34 percent above the centre), so the horizon band stays in the top third at any zoom. One material for every solid piece (base colour from the object colour, roughness 0.9); emissive parts have their own small objects whose object colour alpha drives the emission, so each window can switch on alone. The screen's face is a Holdout. Khronos PBR Neutral view transform, transparent film. The plate is cached by a hash of `island.py`, the scene, its words and the font; render it before proving (prove runs prepare while it holds the After Effects lock).
2. **Track** (`track.json`): per frame, the screen face's four corners in pixels (TL, TR, BL, BR), whether the screen is up, the lamp and a beam tip 7.5 units away in the sweeping direction, the lamp-on time and the spoken word times of the line beat.
3. **Sky** (bottom layer): a solid with Ramp (linear, from the top to y 820), Start and End Colour keyed on the same four time-of-day keys as the plate (0, line minus 0.6, line plus 0.45, carry minus 0.05). Stars: one shape layer of 70 small ellipses in the top 740 px, each with a twinkle expression on its group opacity; the layer fades in through dusk. The plate's opaque sea covers them below the haze.
4. **The real clip**: a 948x675 precomp holding the clip offset to the webcam frame; in the main comp, Easy Levels (Output Black 0.06), then Corner Pin keyed every frame from the track while the screen is up, under the plate. The plate's holdout shows it exactly where the screen face is, occluded by anything in front, and it folds with the screen in the carry.
5. **Plate**: the PNG sequence (imported as a sequence, conformed to the comp rate, straight alpha).
6. **Bloom**: a second copy of the plate in Add with Easy Levels (Input Black 0.62, so only the lit windows, lamps and lantern survive) and Gaussian Blur 34, its opacity keyed 0 by day, 35 at dusk, 85 at night. **Tilt-shift**: an adjustment layer with Gaussian Blur 7 through an inverted rectangular mask over the middle band (feather 340), so only the top and bottom edges soften.
7. **Beam**: two solids in Add, each a horizontal Ramp (white to black) tinted to warm, through a tapered feathered mask (narrow at the root, wide at the tip): BEAM (46 px, 55 percent) and BEAMHALO (150 px, 22 percent, feather 70). Anchor at the root; position, rotation (unwrapped so it never spins the long way) and X scale keyed every frame from the lamp and tip in the track. A lamp glow is a solid with a feathered elliptical mask in Add.
8. **Type**: `riser` makes a text layer with a Position animator (0, 90 to 160 px down) and an Expression Selector whose amount is 100 times (1 minus the tile curve) per letter, offset by a step per letter (or, based on words, by each word's spoken time), and a mask that hides everything below the baseline: the water line. Every title gets a shadow twin (the same layer, filled dark blue, Gaussian Blur 8 to 12, offset 3 and 5 px, 70 percent) and a rule that grows from the centre. Subtitles (`subtitle`) are a Fredoka line with its shadow twin and a `tileIcon` (a hexagon top over a side band, both colours keyed with the time of day), faded in and out over 0.15 s.

**Gotchas found while proving it**

- The proof harness passes the scene to After Effects without its folder, so `words.json` cannot be read there: the line beat's word times travel in `track.json` from `island.py`, which reads them anyway to light a window per word.
- `hide_render` on a parent does not hide its children in Blender, so a piece that falls in later hung in the air at its start height until it dropped. Every dropper is scaled to zero before its arrival instead (scale reaches the children).
- The far sea with a Dithered alpha left visible grain in the haze band at 16 samples; the sea uses Blended, and the separate coarse far plane was dropped (two blended layers would double the haze).
- A Glow adjustment layer over the whole comp (threshold 72) washed the day sky to white and turned the night sand hot pink and the sky royal blue. Bloom is a thresholded, blurred copy of the plate in Add instead, so only the emissive blocks glow.
- At the first framing (ortho 14.2) the lighthouse was a speck in the end shot; the hero is built 1.3 times larger and the carry ends at ortho 11.6, so the tower owns the last frame while the island still fills it.

**Close, not identical:** the reference renders live in three.js with GTAO, a screen-space haze over linearised depth, a sea whose shallow map is redrawn per frame from the land, surf rings and a sky shader with stars. Here the world is a Blender EEVEE render (its own AO and shadows), the haze is the sea's alpha against an After Effects gradient, the shallow water is radial around each piece of land, the beam is drawn in After Effects from the tracked lamp (it does not light the ground, and it is not occluded by the tower), and the score is the scene's voiceover only.

## 7. Dependencies

- Fonts (OFL, bundled in `assets/fonts/`): Josefin Sans SemiBold, Fredoka SemiBold. Blender reads the bundled Fredoka file for the 3D digits.
- Blender 5.2 (`/Applications/Blender.app`, or set `BLENDER`), run locally and headless by `tools/plate.mjs` (Node 20+). No GPU rental, no generated images.
- Cache: `~/Assets/joeb/styles/lowpoly-island/` (`plate/`, `track.json`), per scene for reel renders.
- Effects: all stock (listed in `style.json`).

## 8. Pitfalls of the medium

- A perspective camera breaks it at once: keep the camera orthographic and change only the ortho scale, the azimuth and the elevation.
- The camera must sit far from its target (here 90 units) or the frame bottom shows below the sea.
- A side column and a top cap sharing one plane z-fight: sink the column under the cap.
- Smooth normals turn the facets into a cartoon: every mesh is flat shaded, no bevels.
- Low sun behind the target turns the faceted sea into glare: keep the sun to the side in key shots.
- Pure black anywhere reads as a hole: night is blue-violet, the darkest value is a deep indigo.
- Two arrivals in one slot muddy the rhythm: one piece per slot.
- Do not copy a specific game's grids, buildings or UI.

## Reference

Adapted from Lemo-Opuscar's `lowpoly-island` (MIT, LemoLab): `~/Assets/lemo-opuscar/styles/lowpoly-island/`. Grammar only; no demo code or art is copied. See `assets/LICENSE-lemo-opuscar.txt`.

# Isometric infographic

> A system diagram comes alive: a floating isometric diorama of flat three-tone blocks, thin ink label pins and route lines, numbers built from identical icons, and insets that open on a leader, under a camera that pans and zooms but never breaks the projection.

Adapted for native After Effects from Lemo-Opuscar's *Isometric Infographic* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only: its references (true-isometric puzzle-game architecture, cutaway city-builder dioramas, science explainer channels, the Isotype picture language of Otto Neurath and Gerd Arntz, *Powers of Ten*) are traditions, not designs to copy. Use none of their characters, buildings, icons, palettes or music.

## 1. What it is, and what it is not

A whole system on one floating board, seen in true isometric, where every step of a process is a station you can find in a wide shot. The infographic furniture (pins, leaders, rules, dashed routes, rings, the legend) lives in the world, drawn in thin ink; the things themselves are flat colour blocks with no outlines, separated only by the three tones of their faces. Numbers are not stated, they are built: a row of identical icons that adds up.

Not low-poly 3D (no perspective, no lighting beyond three face tones), not a flat 2D explainer (everything has isometric depth), not a blueprint (colour blocks, not line drawings on blue), not a dataviz chart (the numbers live in the world as objects, not on axes).

## 2. Grammar

- **Projection.** Axes at 30 degrees: `sx = (x - y) cos30 K`, `sy = ((x + y) / 2 - z) K`; x runs down-right, y down-left, z up; painter depth is `x + y + z`. The projection never rotates or tilts; the camera only pans and zooms.
- **Three tones per face, from one base colour.** Top: 20% toward warm white (`#FFF8EC`). The +y side (facing down-left): the base. The +x side (facing down-right): 22% toward a cool dark (`#231A2C`), so shadows are slightly cool. No outlines on solids.
- **The board.** A 12 by 12 plinth floating on a pale ground (`#F1E7D3`) with a faint isometric dot lattice and a soft blurred shadow. Its front faces show the strata: a thin band of land (`#9CC27E`), soil (`#8A6142`), rock (`#5E4A3C`).
- **Colour codes meaning, like a legend.** One hue per role, never reused: here the person is teal `#2E9C93`, the document mustard `#E2A83A`, the device steel blue `#4F7CAC`, and frames of the video (the subject) coral `#E0533D`. The subject's hue is reserved; when the story needs "this one", everything else greys (focus and context). One ink colour (`#2B2230`) for all furniture.
- **Stations** that must be found in a wide shot stand on a pale plate (`#FAF4E8`) with a dashed ink outline, plus one accent hue for the destination.
- **People** are minimal billboards: a round head, a tapered two-tone body, one thick arm stroke, hair for identity, no face.
- **Type.** One geometric sans (Poppins, standing in for Jost): titles SemiBold, all caps, tracked about 0.12 em; numbers Regular and large, units at half size. Every label has a halo of about 7 px in the ground colour (a text stroke under the fill), so it reads over any block.
- **Label pins.** Dot (an ink ring with a pale fill), then a vertical leader, then a horizontal rule, then the text. Pins point up or down, left or right, chosen per station so labels never cover the subject. The furniture keeps one pixel size at every zoom.
- **The subtitle is a map label.** A pale card with a small radius and an ink border, a tiny iso cube in the subject's hue as its legend chip, bottom centre. The border draws first, then the words type on as they are spoken.
- **The end frame is the legend.** Title, the total, the Isotype key (one square per unit, the last one cut to its fraction), "NOT TO SCALE".

## 3. Camera grammar

A 2D camera (a world null) with a world point, a zoom and a screen point per key, baked per frame with a log-interpolated zoom (`z = exp(lerp(log z0, log z1, u))`), so a pull-out reads the same at every scale. The projection never changes. Pick from the vocabulary; opening and ending come from the topic.

| Move | Expresses | Can serve |
|---|---|---|
| Locked frame while things accumulate | a system filling up | stations arriving; a queue; data growing |
| Hold wide plus circular inset | the system and the individual together | one real frame from a video; one worker in a factory |
| Pan to a station and push | attention moves along the process | the count; the next step |
| Close on one object, everything else greys | focus and context | the device doing the work; one patient |
| Follow along a route | process, cause to effect | the input carried to the end; a journey |
| Fast log pull-out | release, the big picture | the scale reveal; the legend |
| Switch boards | before and after; here and there | two cities; two designs |
| Top-to-bottom tilt through strata | layers, depth | a software stack; geology |

Framing: the subject is at least a third of the frame height at key moments; labels never cover it; the subtitle zone (the bottom 300 px of a vertical frame) stays clear.

## 4. Native moves

- **Station drop.** A plate pops, then the object falls onto it (an accelerating fall), squashes about 18% on landing and bounces once. Solids arrive by motion, never by alpha.
- **Route line.** A dashed ink polyline along the iso axes, drawn a step ahead of whatever it leads (a station, a vehicle, a carried subject).
- **Label pin.** Dot pops, leader grows, rule draws, title wipes in, number wipes in.
- **Isotype number.** Identical icons in a grid, one per unit, popping with a back-ease and arriving faster and faster (accumulation is acceleration); a count-up runs over the same span; the last icon is cut to its fraction so the total adds up exactly.
- **Frame within the frame.** A leader grows from an object into a circular inset with an ink ring and a halo; it can fold back into the object and re-open later.
- **Focus and context.** Everything below the subject greys toward warm grey (a Tint adjustment), the subject keeps its hue.
- **Tracked subject.** The inset rides the route with a dashed "you are here" ring in the subject's hue and lands on the destination plate, which squashes under it.
- **Scale reveal.** Pull back until every label is on screen; the legend card slides up and draws its border.
- Not used in this proof but in the grammar: the cutaway (cut line, the skin slides away, hatched section rims), strata stories (the board's edge changes), switching boards.

## 5. Sound palette

Acoustic and light: kalimba, marimba, nylon guitar, pizzicato, woodblock and hand percussion, upright or synth bass, glockenspiel, toy piano, or a clean electronic pulse for technical systems. A short motif marks the subject each time it appears. One sound per icon as numbers fill; J-cuts (the next station's sound half a second before it appears); one note per station during the final pull-back. Foley by material (paper, ceramic, steel, a soft thud for each landing). Music about 8 dB under the voice, ambience about 7 dB; master about -14 LUFS. Render audio outside AE and place it as a layer.

## 6. AE recipe (`iso.jsx`, AESIso)

1. **World.** A ground solid (screen space), then one null (`_WORLD`, anchor and position at 0) that every world layer is parented to while it has no keys; the camera is keyed last with `camera()`, one `setValuesAtTimes` per property, linear keys with zeroed spatial tangents.
2. **Projection.** `iso(x, y, z)` returns rest-frame comp coordinates (K = 46 px per unit, the board centre at 540, 860). Every vertex is built in those coordinates, so a world layer's own space is world space.
3. **Solids.** `solids(layer, boxes)` turns axis-aligned boxes into three face groups each (top, +x, +y) with tones from `tones(base)`, sorted front first by `x + y + z` plus an optional bias for composites (a monitor's slab in front of its neck). Flat details on a face: `onTop(pts, z)` and `onPX(x, pts)`. An object is one shape layer whose anchor and position are its base point (`objectLayer`), so `drop()` lands it and the squash stays grounded.
4. **Layer order is painter order.** Ground, lattice (one dot plus two Repeaters along the iso axes), board shadow (Gaussian Blur), the board, routes, plates, the Isotype cubes (sorted back to front), the stations, the focus adjustment, the device, the inset, the pins, the subtitles, the legend.
5. **Pins.** `pin()` makes a null on a world point whose scale expression cancels the camera (`10000 / WORLD.scale`), so every pin, leader and label keeps its pixel size. Dot, leader and rule are one shape layer with Trim Paths; text layers wipe in with a keyed mask. A count-up number is one `AESLib.textKeys` call.
6. **Type.** `tx()` wraps `AESLib.text` (left justified), adds the halo as a text stroke (ground colour, 14 px, under the fill) and anchors on the ink's left edge; widths come from `sourceRectAtTime` measured when the full string is set, before any text keys.
7. **Inset.** A counter-scaled null on the device's screen, a keyed inner null (its scale shrinks the inset for the carry), a centre null that pops. The real clip is a footage layer with Time Remapping (it plays `clipStart` to `clipEnd` as the inset opens, holds while it is folded away, plays on during the carry) and a circle mask; a halo disc sits under it and an ink ring over it.
8. **Focus.** An adjustment solid with Tint (black to ink mixed 35% toward the ground, white to warm white) sits directly under the device's layer; its opacity keys in to about 80% for the beat.
9. **Subtitles and legend.** Screen space. A card is a shape layer with a fill group (opacity in) and a border group (Trim Paths draws it first); its chip is a tiny iso cube; the words are typed with one `AESLib.textKeys` call. The legend card rides a null that slides up 60 px.

**Gotchas found while proving it**

- Moving a shape group (`moveTo`) or adding a sibling group invalidates every handle to the other groups in that layer ("Object is invalid"). Finish a group (paths, fill, stroke, Trim) before adding the next one, and reorder by name (`top(layer, name)`), fetching groups again afterwards.
- A local variable named like a helper (`var top = [...]` inside a function that calls `top()`) fails as "Function Array is undefined".
- The text halo is a stroke under the fill, but AE's default Fill & Stroke order is per character: each letter's halo covers the letter before it ("of" read as "cf"). Set the text layer's More Options > Fill & Stroke to All Fills Over All Strokes (value 2).
- A null that will be scaled must be scaled only after its children are parented: parenting to a scaled null makes AE compensate each child's scale (the legend came apart).
- A shape group's scale pivots on the group's Anchor Point, not on the shape's position: set the group's anchor and position to the shape's centre before squashing it (the person's shadow drifted up off the board).
- Furniture at a constant pixel size runs off a vertical frame when the camera pushes: choose each pin's side for the tightest shot it appears in (the device label moved twice), and frame the count shot off centre.
- A count-up number keeps its right edge on its unit with an anchor expression on the ink's right edge; the wipe mask is set from the full string first.
- A clip in an inset needs Time Remapping: plain playback runs out before the scene ends. Remove the default end key before adding your own.
- Build errors report a line in the combined proof script; a `STAGE` marker per section, added to the thrown error, finds the failing call in one run.

## 7. Dependencies

- Fonts: Poppins SemiBold and Regular (OFL, bundled in `assets/fonts/`; install both before proving). Jost, the reference's face, is not installed; Poppins is the closest installed geometric sans.
- Effects: Tint, Gaussian Blur (both stock).
- No tools, no generated pieces: everything is drawn by AE. The proof reads the scene's clip (`scene.clip`) for the inset.

## 8. Pitfalls of the medium

- Painter sorting breaks on composites (a monitor's neck under its slab, a sheet on a folder): build composites in one layer with a depth bias, front first.
- Semi-transparent moving solids look like ghosts: solids move, never fade; only furniture, cards and shadows fade.
- Labels that zoom with the world grow huge in a push and vanish in a pull-out: counter-scale the pin nulls.
- A pull-out through a tall object gives one ugly frame: keep tall objects away from the pull-out path or bring them in by motion after it.
- An object with the wrong silhouette reads as something else: give machines their tell-tale parts (the monitor's stand and screen, the folder's tab).
- Every icon in an Isotype number must be identical; vary only the last one's fraction, and say what one icon is worth in the key.
- The subtitle should hold for at least 1.8 s or the speech plus 0.6 s; the shared scene's beats are shorter, so here each card holds for its beat only.

## Reference

- Lemo-Opuscar, `styles/iso-infographic/STYLE.md` and `poster.jpg` (MIT, LemoLab), cloned at `~/Assets/lemo-opuscar`.
- Proof: `proof/compare.jpg` (the reference poster above our seven beats), `proof/sheet.jpg`, `proof/proof.mp4` (local, not in git).

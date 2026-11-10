# Data storytelling

> A chart that tells the story: real numbers drawn mark by mark on cream paper by a red and blue pencil, handwritten notes pinned to the values, and the chart itself as the camera, the rhythm and the plot.

Adapted for native After Effects from Lemo-Opuscar's *Data Storytelling* style (MIT, LemoLab; see `library/styles/LICENSE-lemo-opuscar.txt`). Grammar only: its references (one dot as a character, warming stripes, scrollytelling with pinned notes) are traditions, not layouts to copy, and they are never named in the film.

## 1. What it is, and what it is not

The chart is the film. Every mark is a real number and every movement is a chart operation: a mark lands, an axis grows, the scale ratchets, a series morphs, a note is pinned. You change the framing, never the numbers. Three layers make it a story rather than an infographic: a human scale (handwritten notes pinned to marks), a performer (a physical pencil that draws them) and the data's own rhythm (each mark lands on its beat or its spoken word).

Pick the chart the data asks for: bars or a ranked race for categories; scatter for two measures; a map for place; units or a waffle for parts of a whole; slope or dumbbell for before and after; histogram or beeswarm for a distribution; line, dots or stripes for change over time.

Not a dashboard (one idea at a time), not a keynote with charts (no slides, no cards, no device frames), never decoration, never invented or "illustrative" numbers.

## 2. Grammar

- **Paper.** Warm cream `#F5F0E6`, a fixed fibre (Fractal Noise multiplied at about 9%, it does not move frame to frame) and a faint dot grid every 36 px in world space, so it pans with the sheet.
- **Ink.** Dark warm ink `#2B2622` for axes and series, pale warm grey `#E3DACA` for gridlines, `#CDBFA8` for the reference line, grey `#8A8176` for ticks and labels in IBM Plex Mono.
- **Colour encodes one thing: the value.** Diverging data takes RdBu (`#2166AC` to a paper-pale centre `#F2EEE8` to `#B2182B`) centred on the mean of a meaningful reference, with a symmetric span; data with no natural centre takes one sequential ramp. Pale values stay pale; never stretch the ramp for drama. Everything else is ink on cream.
- **The two leads mean something.** Blue `#2F5E9E` for memories and human notes, red `#B8323A` for records and warnings. Flipping the pencil to the other lead marks a turn.
- **Marks.** A dot is a small rounded rect (so it can morph) with a thin ink ring so pale values stay visible. It lands with a short pop (0 to 128 to 100% in 0.15 s) and a thin ripple; no ripple when marks arrive closer than 0.1 s apart.
- **Notes.** Caveat, written on left to right as the pencil tip dances over the x-height. A leader is a bowed curve, never a straight rule, ending at an un-closed ring around the mark (its gap facing the leader). Notes are pinned in data space, so a rescale carries them.
- **Type.** The headline is the chart's own (Newsreader Medium, world space, above the plot). The subtitle is the figure caption: Newsreader Regular, ink, flush left with the chart, at most two lines, a hairline rule above and a small mono kicker for the range drawn so far, each word appearing on its spoken onset over a paper-colour band.
- **Motion.** The rhythm of the data is the rhythm of the film: marks land on their beats (here, on the spoken words). A rescale reads as ratchet clicks (stepped, each step eased). A morph is a staggered sweep. No fades to blank, no dissolves: transitions are chart operations.

## 3. Camera grammar

A 2D camera over one sheet of paper: a world null that every sheet layer is parented to; the caption band stays in screen space. A film is one take; a hard cut is rare and meaningful.

| Move | Expresses | In AE |
|---|---|---|
| Pull and pan along the paper to more real data | a scale switch | ease the world null's position to the next sheet (S-curve, about 0.5 s) |
| Full view first, then dive to one mark | the pattern before the case | ease the world null's scale and position about the mark |
| Hold on one mark, then pull back | the part inside the whole | key the world null from a close scale back to 100 |
| Track the pencil, newest mark at about 60% of width | progress | key the world null's x against the pencil's keys |
| Punch in over two frames, a decaying shake | an outlier, a broken frame | two-frame scale key on the world null, a few damped position keys |
| Locked off | the transformation is the movement | no camera keys during a morph |

Framing: the subject fills at least a third of the frame height at key moments. When the real axis scrolls off screen, pin its tick labels to a paper strip at the frame edge.

## 4. Native moves (pick what the story needs)

One mark = one fact · axes grow with the story (the unit arrives when the narration names it) · pinned annotations whose colour and content carry the arc · breaking the frame (the series tears through the plot, the pierced state holds, the scale ratchets to make room, the scar stays) · encoding morph (dots into stripes, bars into units) · scale switch (one value, then the series, then a longer real record, never extrapolated) · the empty next cell (a dashed slot for the value nobody knows yet).

## 5. Sound palette

Foley is graphite, paper and wood: tick-and-paper taps on each mark, scratches for handwriting, a ruler hiss for an axis, a paper puncture for a broken frame, a wooden click for the pencil flip, ratchet teeth for a rescale, a paper sweep for a morph. The music can be the data (sonification: pitch = value, rhythm = time density, a soft low-pass-gate plonk going from wood to metal as values rise) over a detuned pad, soft kick and shaker. True silence before a key mark, a morph or a verdict. Voice neutral, music ducked about 11 dB under it, master about -14 LUFS, no grain. Render audio outside AE and place it as a layer.

## 6. AE recipe (`dataviz.jsx`, AESDataviz)

1. **World.** A null at the origin (`_WORLD`); a paper solid, a Fractal Noise solid (Multiply, about 9%) and a dot grid shape layer (one 3.4 px dot, two Repeaters at 36 px) are parented to it, sized for every sheet the film visits. Camera keys go on the null last, after everything is parented (parenting reads the null at the comp's current time).
2. **Data in, never typed in.** `tools/series.mjs` measures a real series (here the clip's mean brightness per frame with ffmpeg `signalstats`, 338 values) into JSON the module reads with `AESLib.readJSON`; the spoken words' lengths come from the scene's word times. `tools/frame.mjs` makes the pinned print.
3. **Plot.** Gridlines, axes and the reference line are open paths stroked with Trim Paths keyed linear (a ruler drawing them). Ticks are mono text layers anchored on the baseline at their right edge or centre with `txt()` (the anchor fixes alignment whatever AE's justification does).
4. **Series.** One path through every point; its Trim End is keyed in one call so the line reaches each point on that point's beat. Each dot is its own shape layer: a rounded rect (fill = `ramp(value)`, ink stroke) plus a ripple group whose group transform scales out and fades.
5. **Ratchet rescale.** Key the series path itself (one Shape per range, eased "settle", equal pairs for the stepped holds), never the layer's scale (a non-uniform scale distorts the stroke). Tick labels re-label with one `AESLib.textKeys` call each, padded to fixed width in mono so they never drift. Pins on the series (ring, leader end, mark) take the same keys.
6. **Notes.** `note()` sets Caveat and writes it on with a mask whose right edge travels linear; `leader()` bows a path from note to mark and draws it on; `ring()` draws an ellipse to 85% with Trim Paths, rotated so its gap faces the leader.
7. **Morph.** Stagger each dot's rect Size, Position, Roundness and stroke width into a stripe the height of the plot (`AESLib.ease`, "travel", about 0.02 s apart); retract the series line by Trim Start; erase notes by moving their mask's left edge across as the sweep passes.
8. **Pencil.** Native shapes (hex body with two facets, wood cone, coloured lead), its anchor at the tip, rotated 34 degrees so only the tip end shows from the lower right, with a Drop Shadow whose Distance and Softness grow with lift. A `Performer` collects taps, writing and moves in any order, sorts them and keys Position, Distance and Softness in one call each. The lead flip is held fill-colour keys.
9. **Caption band.** A paper-colour rect over the bottom of the frame in screen space, a hairline rule, a mono kicker per beat and one Newsreader text layer per spoken word (in on its onset, out at the beat's end).

**Gotchas found while building it**

- Right and centred labels came out off by half their width (the y ticks ran into the axis). The rect `sourceRectAtTime` returns straight after a text layer is made can be stale: a diagnostic showed the layer ended right-justified (left -78, width 76) while its anchor had been set from another rect. `txt()` sets every layer left and records right or centred ones; `realign()` re-anchors them from a fresh rect once the build is done. Flush-left layers anchored at `r.left` were never affected.
- A text layer with Source Text keys shows its first key's value before that key, so plot B's ticks showed the rescaled range before the ratchet. Every re-labelling layer gets a key at 0 with its starting text (still one `AESLib.textKeys` call).
- The pencil's taps, writing and moves are added beat by beat, not in time order; keying them as they came dropped every earlier one. `Performer` sorts all events, keeps one per 1/60 s and keys Position, shadow Distance and Softness in one call each.
- Fractal Noise at scale 45, contrast 140 and 9% Multiply read as clouds, not paper. Scale 14, contrast 80, complexity 4 at 4% reads as fibre.
- A shallow pencil (34 degrees) lay across the whole plot as a long bar. At 56 degrees the body runs down under the caption band and only the tip end reads. Drop Shadow's Direction is in layer space, so it is the wanted angle minus the layer's rotation.
- Rescaling by the layer's scale distorts the stroke; the ratchet keys the path itself, one Shape per range.

**Close, not identical:** the scene's beats are 1.3 to 1.7 s, shorter than the style's caption hold (max(1.8 s, speech + 0.6 s)), and the carry's caption runs over the morph; a reel paced by this style gives each caption its hold. The proof has no sonification. The reference is a Canvas engine with a true 2D camera and per-glyph handwriting jitter; here the camera is a null, the handwriting is Caveat revealed by a mask, and the graphite grain on the notes is not reproduced. The pencil is drawn from flat shapes, not a rendered object.

## 7. Dependencies

Newsreader (Medium and Regular), IBM Plex Mono Regular and Caveat Regular installed (free (OFL) from Google Fonts, not included; `AESDataviz.fontOK()` checks). Effects: Fractal Noise and Drop Shadow. Node 20+ and ffmpeg for `tools/series.mjs` and `tools/frame.mjs`.

## 8. Pitfalls of the medium

Pick data columns by header name, never by index, and print every fact the narration claims. Notes collide with later data: pin them in data space and keep a memory zone. A frame break rescaled too fast is invisible: hold the pierced state at least half a beat. A right-aligned note is still written left to right (the pencil hops to its first letter). Text a viewer must read needs time (at least max(1.8 s, speech + 0.6 s)); no caption over a signature chart operation or a silence. In dense passages the pencil lies across fresh marks: steepen its angle.

## Reference

Before import, the shared test scene was built by `buildScene` from a blank project and rendered in the author's proof setup, then compared with Lemo-Opuscar's dataviz reference. In this plugin, render frames of your own build and check them against this file.

Build time: about 4.8 s for 158 layers; every text key goes in through one batched call per layer (`AESLib.textKeys`).

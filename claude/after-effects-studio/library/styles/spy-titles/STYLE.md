# Spy titles

> A cut-paper, four-ink opening title for a film that never existed: silhouettes move through sets built out of the credits themselves, every beat is a hard cut, and the title is assembled from the pieces.

Adapted for native After Effects from Lemo-Opuscar's *60s Spy Title Sequence* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only, after the 1960s cut-paper title tradition: never a gun-barrel opening, never a real film's logo, lettering, characters or shots, and credits name fictional roles only, never real people.

## 1. What it is, and what it is not

Flat, opaque inks on paper, four of them and no gradients. Every piece has a hand-cut edge, a thin cut gap in the ground's colour and a small paper shadow. People are reduced to silhouettes in profile who act in outline and timing. Typography is the picture's structure: a credit line is the location (letters stand like buildings on a rail bed, a number is architecture an agent runs across). Each beat of the voice is a new location with its own ground, and the cut lands on the beat.

Not flat vector motion graphics (the edges are cut and the paper is physical), not a halftone print (no dots), not a Swiss grid (diagonals, jaunty letters, play), not a spy parody with gadgets and gun barrels.

## 2. Grammar

- **Inks.** Black `#1B1714`, cream `#EFE4C9`, red `#D23A22`, mustard `#E2A52A` (`AESSpy.PALETTE`). One dominant ground per location, changed at each cut; figures and type in the other inks. Background props go in a darker version of the ground (`mustardDark`, `creamDark`, `redDark`), never black, or they read as letters. Red is the hero's accent and danger; mustard marks the object of the chase.
- **Edges.** Roughen Edges on every piece, computed in the piece's own layer space, so a moving cut-out keeps the same edge (screen-space edges would crawl). The cut gap is a text stroke behind the fill in the ground's colour (letters) or a black keyline (the object); the paper shadow is a Drop Shadow (black, 32%, 135 degrees, 5 px, softness 10).
- **Type.** A condensed display face for credits (Bebas Neue, OFL; the reference used League Gothic), a heavier condensed face for the title (Anton, OFL). Every letter is its own layer, re-cut: rotation jitter about 0.8 degrees (3 for the title), baseline jitter 1.5 px (12 for the title), a cut gap, roughened edges. Credits are always seen whole at some moment.
- **Figures.** A tall hatted agent in a trench coat, about seven heads, profile only, hands as wedges, no face. One accent (a scarf) that streams back when running. All pieces share one ink in one shape layer, so the body reads as one merged outline.
- **Paper.** One full-frame mottle (Fractal Noise, Overlay 16%) and fibres (stretched Fractal Noise, Soft Light 10%) over everything, a sparse speckle of ink voids (Screen), and film grain (Noise 5%).
- **Motion.** Puppets on twos (15 fps in a 30 fps comp): limbs, positions of figures and landing letters. Camera moves, credit slides and band slides on ones. Credits slide along a grid line and stop dead on the beat (linear out of the first key, a short ease into the mark); letters land with a drop and a small rotation, a paper slap. Stop-time: on a stab the picture freezes for the rest of the beat.

## 3. Camera grammar

| Move | Expresses | In AE |
|---|---|---|
| Wide on a full credit line | reading, then action | the set as built; no keys |
| Hard cut on the beat | punch; a new location | each location's ground and pieces have in and out points on the beat times |
| Truck in | closing on the object | a camera null (anchor = position) whose scale is keyed on ones (`AESSpy.travel`), every layer of the location parented to it |
| Vertical pan down a column of type | descent; a list | the same null, position keyed upward |
| Diagonal split | many at once | three bands on 30 degree cut lines sliding in along their own edges, each carrying one silhouette |
| Silhouette against a giant circle | the hero moment | a circle in the ground's darker ink or the object's ink behind a running agent |
| Graphic match cut | rhyme; one thing becomes the next | the circle returns at the exact centre and radius it had at the end of the previous shot |
| Stop-time | a near miss, a double take | the agent's clock expression holds `t` from the stab to the cut |

Framing: strong 30 degree diagonals, big flat grounds, figures small against type. No dissolves.

## 4. Native moves (pick what the story needs)

Type is the set (a line of credits stands as the location's architecture) · credits are rhythm (each word lands on its spoken onset) · the diagonal split into bands · silhouette puppets on twos · a giant circle behind the hero · graphic match cuts on the circle · stop-time on a stab · the object of the chase becomes the title (here the keyhole circle with the real frame flies down the diagonal to be the title's full stop).

## 5. Sound palette

A 1960s spy big band: stacked staccato brass stabs (the cuts), surf guitar twang through spring reverb, walking upright bass, brushes, bongos, vibraphone, flute, organ stabs. Minor keys, chromatic lines; original motifs only, never the famous spy theme's crawl or its ending chord. Place each stab about 8 ms early so its peak hits the cut. Foley follows the paper: card slaps for letters landing, slides for credits, a tear, a tape click. Stop-time is true silence. Voice through a tape chain (band-pass about 220 to 5200 Hz, soft saturation), music ducked about 7 dB under it, master about -14 LUFS. Render the audio outside AE and place it as a layer.

## 6. AE recipe (`spy.jsx`, AESSpy)

1. One comp. The location grounds are full-frame solids created first (bottom of the stack), each with in and out points on its beat. Everything else is built per location above them; the paper texture layers go on top last.
2. Pieces: `piece(comp, name, nodes, pos)` builds one shape layer from nested nodes (`poly`, `circle`, `rect`, `group` with `pivot` and `rot`), later nodes on top, one fill per node. `cut(L, { border, scale, shadow, dist })` adds Roughen Edges (border 3, sharpness 3, fractal influence 0.7, scale 32, complexity 2) then a Drop Shadow.
3. The agent: `agent(comp, name, { x0, x1, y, t0, t1, tm0, tm1, scale, facing, gait, accent, freeze, parent })`. Feet at the layer origin, 600 px tall at scale 100. Legs (thigh > shin) and arms (upper arm > forearm) are nested shape groups named `LB`, `LF`, `AB`, `AF` (child `S` or `F`), and the scarf `SC`. One clock expression drives them all on twos: `posterizeTime(15); var t = time; (stop-time hold) var p = 2 * Math.PI * hz * t;`, then thighs `A sin p` and `-A sin p`, knees `max(0, sin(p - .6)) * 1.7A`, arms opposite, scarf `-14 + 10 sin 2p` when running. Position keys (linear) move it; its expression adds the bob and reads `valueAtTime(t)` so stop-time freezes the travel too. Gaits: run (A 40, 2.4 Hz, lean 10), walk (A 20, 1.4 Hz, lean 2), stand. `facing: -1` mirrors with a negative x scale.
4. Cut letters: `letters(comp, name, str, { x, y, size, family, color, gap, maxW, times | t + step, drop, jit, base, seed, parent, t1 })` measures the line once with the font's own spacing (one probe layer, prefix widths), fits it to `maxW`, then makes one text layer per letter anchored at its ink's baseline centre, with a stroke behind the fill in the ground's colour (the cut gap), rotation and baseline jitter, and `cut()`. Landing keys (drop 0.3 em, 9 degrees of rotation, 0.14 s) are eased into the mark and evaluated on twos by `posterizeTime(15); value;`. `wordTimes(str, onsets)` gives each word's letters one frame apart from its spoken onset.
5. Credit slides: `slideCredit(comp, name, str, { x, y, size, from, t0, t1, out, rot })` parents a line of static letters to a null that slides in along its grid line on ones and stops dead (`dead()`).
6. The diagonal split: three band polygons between cut lines `y = b - tan30 * x`, each with its silhouette parented to it, keyed along the band's own direction `(cos 30, -sin 30)` so the edges stay on their lines. Parent first, then set the child's position.
7. The real frame: `tools/inkprint.mjs` crops it, softens it (Gaussian 2.2), and snaps every pixel to black, red or cream by brightness (cuts 58 and 128), so the photograph becomes three flat inks. In AE it is masked by two masks (a circle and a trapezoid: a keyhole), roughened, and sits on a black keyhole backing 18 px larger.
8. A number: one text layer with a cream stroke behind the fill and tracking 30; it counts on twos with one `AESLib.bakeText(layer, strings, 15, t0)` call. Never key Source Text one call per key.
9. The object of the chase: a mustard circle on a black keyline returns at the keyhole circle's exact centre and radius after the truck in (a match cut), then travels and scales on ones to the title's full stop.
10. Paper: `paperTexture(comp, prefix)` adds the mottle, fibres, ink voids and grain on top.

**Gotchas found while proving it**

- A new text layer ignores the justification it is given (asked for left, it came back right-aligned, with `left` about minus its width), so ink left and right edges are not stable: lay letters out from ink **widths** only (the width of each prefix is letter i's right edge from the line's ink left) and anchor each letter from its own `sourceRectAtTime`.
- Re-setting one probe layer's Source Text and reading `sourceRectAtTime` again returned the first measurement every time, so every letter of a line piled onto one spot. Measure with a fresh probe layer per string, then remove it.
- Setting `inPoint` after `outPoint` lost the out point: slide-credit letters stayed on screen into every later location. Set in, then out.
- A chained ternary (`a ? b : c ? d : e`) choosing between shape builders sent the agent's head circle down the rect branch (NaN vertices, "Unable to set vertices"). Plain `if` statements fixed it; `poly()` now throws with the bad point list, which is how it was found.
- Parent a piece before setting its position: parenting by script keeps the layer where it is at the current time, so a child parented after its band was keyed off-screen was compensated by the band's offset. Every location null has its anchor at its position, so a child's local coordinates are comp coordinates.
- Landing letters and limbs use `posterizeTime(15)` in an expression rather than the Posterize Time effect, so the twos can be held per property (the camera and the slides stay on ones), and the agent's stop-time is the same expression holding its clock.

**Close, not identical:** the reference cuts each glyph's outline in code (opentype.js), resamples every edge and caches it; here Roughen Edges does that per layer, which is close but its edge is a fractal, not a resampled polygon. The reference's figures merge in an offscreen layer and get joint slits and a cut-gap outline; here a figure is one ink with no outline, so it relies on its ground for contrast. Custom geometric title glyphs are replaced by Anton re-cut with jitter. Subtitles on a paper strip are not built in the proof, because the scene's words are already the credits.

## 7. Dependencies

Bebas Neue Regular and Anton Regular installed (`assets/fonts/`, OFL; `AESSpy.fontOK()` checks). Node 20+ and ffmpeg for `tools/inkprint.mjs`. Stock effects only: Roughen Edges, Drop Shadow, Fractal Noise, Noise, plus shape layers, masks, text strokes and one clock expression per moving limb.

## 8. Pitfalls of the medium

A black figure on a black ground vanishes: give every location a ground the figure reads on, or keyline it. Black background props read as letters: use the ground's darker ink. A credit only ever seen partially is uncomfortable: open wide on the full line before the camera moves. A circle dropped into a word covers its neighbours: lay the word out around it. Match cuts fail if the circle's centre or size moves across the cut. A stepped camera judders: keep the camera, slides and bands on ones, and only puppets and landing letters on twos. More than one accent colour on the hero, or red used for anything but the hero and danger, flattens the hierarchy.

## Reference

Before import, the shared test scene was built by `buildScene` from a blank project and rendered in the author's proof setup, then compared with Lemo-Opuscar's spy-titles reference. In this plugin, render frames of your own build and check them against this file.

Build time: about 23 s for 211 layers (most of it is measuring letters with probe layers; every credit letter is its own layer); render about 51 s. The number counts with one batched Source Text call (`AESLib.bakeText`); no letter is ever keyed one Source Text key at a time.

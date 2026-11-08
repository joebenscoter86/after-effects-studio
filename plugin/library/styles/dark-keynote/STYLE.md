# Dark keynote

> A software launch film where the interface itself is the star: a near-black stage, a hairline grid, soft cool light, one luminous accent, and UI that lands on the beat with one small overshoot.

Adapted for native After Effects from Lemo-Opuscar's *Dark Tech Keynote* style (MIT, LemoLab; see `library/styles/LICENSE-lemo-opuscar.txt`). Grammar only: never use a real company's interface, system controls, fonts, logos or names, never draw traffic-light window buttons, menu bars or docks, and never name a real keynote in the film.

## 1. What it is, and what it is not

A keynote-grade product film for software. There is no physical product: the protagonist is the interface (a cursor, a window, cards, a toast, a number). It lives on a dark stage lit by soft cool light, with **one accent** reserved for the single most important element. Drama comes from contrast and precision: everything snaps to a grid and lands on a beat; light reveals; a giant number gets its own screen.

Not a glass product render (no physical object), not a screencast (no real OS or apps; a real frame may appear only inside one of our own windows), not a hologram HUD (no scanlines), not a chart film (one number, not a chart), not grain or texture.

## 2. Grammar

- **Stage.** Near-black `#06080C` with a radial lift `#141923` at the upper centre (Ramp, radial), one large cool glow (`#3050FF` at 9%, blurred 240) off-centre low, a 55% elliptical vignette. A hairline grid on a 48 px module: white at 4%, every fourth line at 8%, with a major line through the centre of the frame. The stage and grid never move.
- **Surfaces.** Three raised dark steps (`#101319`, `#161A22`, `#1D222C`), a 1.5 px border at 9% white, a 1 px inner top highlight at 14% white, a soft drop shadow (the surface's own shape in black at 70%, blurred 60, dropped 30 px). Windows have a title bar with only a small glyph and a mono title.
- **Colour.** A cool neutral ladder only: text `#EDEFF3`, secondary `#9AA1AD`, label `#5C6370`. **One accent** (lime `#B7F34A` here; electric violet `#8B7CFF` or signal orange `#FF7A1A` are equally valid, one per film), with its own glow, reserved for what the product is or does: the caret, the toast's speaking dot, the key number, the last tile. Secondary hues only as small category codes (the file badge).
- **Type.** Inter Tight SemiBold for headlines and the giant number (tracking -30 for headlines, -45 for the number), Inter Tight Medium for typed text and toasts, IBM Plex Mono for labels, filenames and window titles (wide tracking, 260 to 300, in small caps labels). One line or two per screen for a headline.
- **Captions are a UI component.** A bottom-centre toast: a dark translucent pill (`#1D222C` at 92%), 1 px light border, soft shadow, Inter Tight Medium 40 px, a small accent speaking dot. It rises 22 px and fades in over 0.16 s. Typed text is its own subtitle (no toast while the line is typed); the big number gets no caption.
- **Motion.** On ones, no stepping. The land is fast out with one small overshoot (`back`, about 8% past, peak at 60% of the move) and an immediate settle. Spawns are short pops (0.26 s). Disappearing is designed: CRT-off (the real surface squashes to a hairline, then to a point) or a put-away (one card per sixteenth). Mono labels type themselves. The caret blinks whenever it is idle: it is the metronome.

## 3. Camera grammar

| Move | Expresses | In AE |
|---|---|---|
| Locked frame, one focal element | intimacy, one thing alive on the screen | no camera: the stage holds, the element acts |
| Light reveal | presentation, the product as hero | `reveal()`: a feathered intersect mask sweeps the layer, a dim copy sits under it at 6 to 7%, a soft additive band travels with the front |
| UI expand / collapse | every shot change | `on(N, t)` and `off(N, t)` on a group null: a point opens to a hairline, then to the surface with a small overshoot; the reverse to close |
| Push-in on a held frame | focus narrowing | a linear scale on the window's group null (100 to 108%) |
| Return to an earlier framing | rhyme: what changed | re-open the same window null with `on()` |
| Squash into an element | the thing becomes the next | scale the window's null non-uniformly to the tile's size, then pop the tile in its place |

Never a dissolve, never a blank frame. The stage and grid move only if a camera moves them.

## 4. Native moves (pick what the story needs)

The snap grid (scattered cards fly into the slots of one window in one beat) · the living element (the caret, blinking as a metronome, solid while it types) · light reveal · number from glyph noise (digits scramble in grey and lock one per sixteenth in the accent with a small drop) · put-away (one part per beat until one is left) · one tile left lit in the accent on an empty grid.

## 5. Sound palette

Tuned percussion and pads (marimba, vibraphone, glockenspiel, celesta, a synth pad, a low sine pulse, felt piano), clean and dry, music as a visible process (phasing, an additive build, a subtractive one, one chord everything lands on). Two sound families tell the story: disorder is scattered (detuned, random pans), the product is one family in one mode, centred. Foley: cursor tick, low-profile keys for typed text, notification glass for a toast, file plop for a card pop, window whoosh for an expand, digit grains for the scramble, a CRT-off for a collapse, a light-sweep shimmer. Silence is a tool; the first sound after it matters most. Music ducks about 8 dB and foley 4 dB under the voice; master about -14 LUFS. Render the audio outside AE and place it as a layer.

## 6. AE recipe (`keynote.jsx`, AESKeynote)

1. **Stage** (bottom to top): a stage solid with `ADBE Ramp` (radial, start `[540, 360]` lift colour, end `[540, 1500]` stage colour); a cool glow ellipse (9%, `ADBE Gaussian Blur 2` 240); the grid, one shape layer with four groups (minor and major, vertical and horizontal), each a single 1 px path with a Repeater (copies to fill, offset one step); a black vignette solid with an inverted elliptical mask (feather 620, 55%). Build everything else, then move vignette, grid, glow and stage to the end in that order.
2. **Pieces**: `draw(comp, name, items, pos)` draws rounded rects and ellipses in one shape layer whose origin is `pos` (items in layer space, later on top; fill and stroke opacity per item). `surfaceItems(w, h, r, fill)` gives the raised surface with border and top highlight; `shadow()` is the same shape in black, blurred and dropped. `win()` adds the title bar, glyph and mono title.
3. **Type**: `txt()` sets one layer with left justification and its anchor on the ink (`sourceRectAtTime`), left edge or centre. `typed()` keys every prefix in one `AESLib.textKeys` call; `typeOut()` spreads a string's characters across a span.
4. **Light reveal**: `reveal(comp, name, L, box, t0, t1)` duplicates the layer (dim copy below at 6 to 7%), adds a feathered mask (intersect if the layer already has one, feather 150 horizontal) whose right edge sweeps the box with the travel ease, and an additive blurred white band (12%) moving with the edge. Call it on a layer at rest, after parenting, so the dim copy inherits the parent.
5. **Groups**: `grp()` parents layers to a null anchored at a point without moving them (all keys on the children are set first or are in comp space; the null is at rest when they are parented). `off(N, t)` and `on(N, t)` key the null's scale.
6. **Accent**: `glow(L)` adds `ADBE Glo2` with Glow Based On set to colour channels (2), threshold 35, radius 26 to 50. Caret: a lime bar with an opacity expression that blinks (2.2 Hz) whenever no position key is within 0.3 s; typing moves it with hold keys.
7. **Number**: per digit, a grey noise layer whose Source Text changes every two frames (one `textKeys` call) until its lock, and a lime digit (centre anchored, glow) that drops 34 px into place with the back ease on its lock, one per sixteenth (0.125 s). A soft lime halo (10%, blurred 160) sits behind.
8. **Toast**: a pill sized from the measured line, a glowing dot, the text, all parented to a null that rises in; each layer's opacity fades 0.16 s in and 0.14 s out.
9. **The real frame**: the source clip in the window's content area, cropped by a rounded mask in layer space (`[84, 1222, 912, 640]` of the 1080 x 1920 source), `startTime` set so the beat opens on `clipStart`, audio off, revealed by the light.

**Gotchas found while building it**

- A local named `base` (the typed-line prefix) silently replaced the stage solid's variable of the same name in the same function, and the build died at the end on `base.moveToEnd`. ExtendScript has function scope only: give every layer handle in `buildScene` a name nothing else uses (`stg`).
- A Source Text with a single key holds that value for all time, before the key too: the window title read "clip.mp4" during the picture beat. Key the first value at 0 as well (two keys in one `textKeys` call).
- `setOut()` over a whole group after the fact overrode the noise digits' own lock out points, so a grey digit lingered behind each lime one. Layers with their own out points are left out of the group-wide out point.

**Close, not identical:** Lemo's engine is a Canvas 2D renderer with a 2.5D camera and depth blur; here depth is a drop shadow and a camera move is a group null's transform. The back ease is three keys (start, an overshoot peak, rest), an approximation of the `back` curve. JetBrains Mono is replaced by IBM Plex Mono (both OFL monospaces) and Inter by Inter Tight Medium, so the package needs only two families. The proof does not stage generated accumulation (hundreds of spawned items) or type streams with coloured trails; a reel adds them when its story has them. Toasts hold for their beat (about 1.4 s in the shared scene), shorter than Lemo's 1.8 s minimum, because the scene's beats are short.

## 7. Dependencies

Inter Tight installed with its SemiBold and Medium styles (free (OFL) from Google Fonts, not included), IBM Plex Mono Regular and Medium (free (OFL) from Google Fonts, not included); `AESKeynote.fontOK()` checks. Effects: `ADBE Ramp`, `ADBE Gaussian Blur 2`, `ADBE Glo2` (all stock). No tools, no generated pieces: everything is drawn in AE.

## 8. Pitfalls of the medium

A hard white glint reads as a sticker reflection: keep the light band soft and under 20%. A flat tinted rectangle for closing looks like a placeholder: squash the real surface. If two things are accent-coloured, one is wrong. Too few elements leave holes in a grid that read as a mistake: generate by rule, then trim or pad to exactly the slot count. Warm neutrals break the stage: keep every grey slightly blue. A fade anywhere except a toast's entrance breaks the precision.

## Reference

Before import, the shared test scene was built by `buildScene` from a blank project and rendered in the author's proof setup, then compared with Lemo-Opuscar's dark-keynote reference. In this plugin, render frames of your own build and check them against this file.

Build time: about 3.5 s for 63 layers, render about 17 s; every text key goes in through one batched call per layer (`AESLib.textKeys`).

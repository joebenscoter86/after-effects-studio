# Hologram HUD

> An object is scanned into a glowing wireframe above a projector pad; target boxes lock onto it, leaders pull out to HUD cards, and every number rolls out of garbage glyphs into the real value, turning the one warm accent on the frame it becomes true.

Adapted for native After Effects from Lemo-Opuscar's *Sci-fi Hologram HUD* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only: copy no film's HUD layouts, icons, fonts or colours, and never name a film franchise in a film made with it.

## 1. What it is, and what it is not

A scene style for any subject with parts: a spec walkthrough, a teardown, a trade-show loop, an upgrade. The subject is always a **line wireframe made of light** standing on a round **projector pad** on a near-black stage, never a rendered object. Everything reads as scanned data: a scan plane grows the model, target boxes say "look here now", numbers are computed on screen. Three depth layers are always present: a background dot grid (slow parallax), the subject with its pad, and the foreground HUD (corner brackets, rulers that parallax faster, subject // mode top left, a live status line top right, telemetry at the bottom).

Not a type-driven keynote (dark-keynote: raised dark surfaces, a light sweep), not a drafting sheet (blueprint: paper, ink, construction lines), not a product render (no shaded surfaces, no reflections), not a CRT terminal (no phosphor, no barrel). A real picture may appear, but only as a hologram: tinted in the hue, additive, with scanlines, on its own plate.

## 2. Grammar

- **Stage.** Near-black tinted by the hue (`#010608`), a radial lift (`#06181E`) behind the subject, a 48 px dot grid in the hue at about 25% that fades out from the centre, a strong elliptical vignette (70%).
- **One cold hue, one warm accent.** The hue (cyan `#38D9F2` here; violet, ice-blue or mint are equally valid, one per film) carries every line, plate border, label and fill. The accent (amber `#F4B53F`) is **spent on locked values only**: a value turns amber on the frame it becomes true and nothing else ever uses it. White is heat: the scan front, a target's three-frame flash, a lock's one-frame flash, the pad's hot ring on ignition. Everything at rest sits in the hue's alpha levels, with depth fog (near lines about 100%, far ones about 30%).
- **Wireframe.** Additive strokes about 2 px, a few alpha levels, two glow passes (a tight one and a wide soft one). Real CAD topology: round things are rings plus longitudinal lines, boxes are two outlines plus edge connectors, details are inset outlines. Every piece touches the body.
- **Pad.** Concentric rings in true perspective (one bright at r 1.05, one dashed at 1.12, faint ones at 0.7, 1.45 and 2.1), 72 ticks (every sixth long) and 24 faint rays that rotate slowly (0.12 rad/s), a faint floor disc.
- **Text never sits on the wireframe.** Every text block has its own **plate**: translucent near-black (`#010A0E` at 62 to 72%), a 1 px hue border at 28%, 12 px corner ticks in the hue.
- **Type.** Rajdhani, all caps, for everything big: Light for the big values and the title (wide tracking, 120), SemiBold for labels (tracking 200 to 220), Medium for subtitles and typed text. Share Tech Mono for micro data (coordinates, counters, status, telemetry) at 24 to 28 px with wide tracking.
- **Rolling values.** One text layer per character at a fixed centre (so proportional glyphs never jitter), scrambling through garbage glyphs every frame, locking one by one: values right to left, words left to right. On its lock a character flashes white for one frame and turns its final colour (near-white, or the accent for a value).
- **Subtitles are HUD.** A plate bottom centre with corner ticks, two slanted brackets, four voiceprint bars that move with the words, near-white Rajdhani Medium 46 px; the line decodes out of garbage glyphs in about six frames. Typed text is its own subtitle (no plate while the line is typed); the title and the end lockup are their own captions.
- **Motion.** On ones; only glyph scrambles step, every frame. A target lock starts at 190%, rotated 45 degrees, at 30%, and snaps to fit in 0.22 s (ease out), flashing white for three frames. A leader is an anchor ring, a diagonal and a horizontal, drawn in 0.3 s. A finished value docks: its card fades in 0.3 s and a chip slides into the side rail and stays to the end.
- **No cuts and no fades inside the scene.** Things appear and vanish only by a scan front (a hot line that reveals or erases top-down), a rolled scramble, or a target snap. The one exception is a card fading as its value docks.

## 3. Camera grammar

One orbit camera (yaw, pitch, distance, focal) aimed at a target point, with the target's screen position as a parameter so the subject can sit beside text. The subject stays at least a quarter of the 9:16 frame's height at every key moment.

| Move | Expresses | In AE |
|---|---|---|
| High 3/4, slow orbit craning down | examination; the scan plane reads as an ellipse | key `Yaw` down and `Pitch` down on the camera null, ease travel |
| Push-in | this part matters | key `Dist` down |
| Turntable | every side | `Yaw` keyed linearly through a wide angle |
| Nearly static slow drift | reading time without a dead frame | `Yaw` drifting a few degrees over seconds |
| Eye-level profile, locked | the object as it stands in use | `Pitch` near 0, no keys |
| Pull back plus a loupe | where and what at once | `Dist` up, a second hologram panel of the detail on its own plate |
| Whip following the target box | attention jumps to the next part | fast `Yaw` / `Dist` keys starting before the next lock; motion blur on the wire layers only |

The HUD never moves with the camera except by parallax: the dot grid and the rulers read the camera's yaw.

## 4. Native moves (pick what the story needs)

Scan growth (this is real data) · target lock (look here now; the box is the camera) · local explode (a shell slides along its own axis, the contents stay and glow) · rolling digits (the payoff beat) · chip accumulation in a side rail (reading time for three to five facts) · loupe (two scales at once) · the real picture as a hologram panel, turned into its own line art by a scan front · a fold down into the pad that ignites the beam · power-down (edges cool, panels switch off until only the pad glows).

## 5. Sound palette

Music first, on a grid: one bar is one information beat and every lock lands on a downbeat. A synth palette: a saw or square arpeggio with ping-pong delay (scooped 1 to 4 kHz under the voice), a square pulse, an eighth-note bass, synth hats and claps, detuned saw pads. Density follows information: half-time for reading, one beat of true digital silence before the biggest change, a drop (an 808 glide under a wide saw chord) for it. Foley follows the material: light is sines and FM blips in the key, a lock is a thump plus a clack plus a two-tone beep, rolls tick at the frame rate; a projector hum (40, 80, 120 Hz) and room tone under everything. Duck music and foley with a held envelope under the voice; master about -14 LUFS. Render the audio outside AE and place it as a layer.

## 6. AE recipe (`hologram.jsx`, AESHologram)

1. **Stage** (bottom to top): a stage solid with `ADBE Ramp` (radial, the lift at the subject, the stage colour 900 px out); the dot grid, one shape layer with one 3 px ellipse and two Repeaters (26 across, 44 down, 48 px), 26% opacity, an elliptical feathered mask (feather 420) and a position expression that drifts with the camera's yaw; a black vignette solid with an inverted elliptical mask (feather 520, 70%).
2. **Camera null** (`<prefix>_CAM`) with Slider Controls `Yaw`, `Pitch`, `Dist`, `Focal`, `TargetY`, `CX`, `CY` and `Scan` (the scan plane's height). All camera motion and the scan are keys on these sliders. `camAt(t)` reads them back with `valueAtTime` so the script can place boxes and leaders where the projection will put things.
3. **Wireframes.** `wire(comp, name, model, camName, o)`: one shape layer at the comp origin, a group per polyline. Each path's value is a **`createPath` expression** that projects its own 3D points through the camera null (`camHead()` + `pathExpr()`): rotate by the yaw about the vertical axis, by the pitch about the horizontal, divide by depth, add the target's screen point. Each stroke's opacity is a second expression (`fogExpr()`) that fogs by the depth of the polyline's centroid. Optional per-layer sliders: `Off X` (an object's position on the pad, keyed for assembly or explode), `Spin` (rotation about the pad's axis). Blending `Add`, two `ADBE Glo2` passes (radius 10 at 1.1, radius 46 at 0.7, colour channels). Models are plain data: `person()`, `documentModel()`, `device()`, `pad()`, `padTicks()`; `proj()` and `bounds()` run the same maths in ExtendScript (and in Node, for a framing preview before any proof).
4. **Scan plane.** A hot ring (`#D8FBFF`, 3 px, a 9% fill) at the `Scan` height, visible only while it moves (hold keys on opacity). The objects share one **scan matte**: a disabled shape layer whose path expression is a rectangle from the projected scan height down; each object layer takes it with `setTrackMatte(matte, ALPHA)`. Raising `Scan` grows the objects; lowering it erases them; raising it again rescans.
5. **HUD furniture.** Corner brackets (46 px arms, 44 px in); two rulers (ticks every 24 px, every fifth long, a feathered mask, a position expression on the yaw); subject // mode top left typed on; a right-aligned status line (one `textKeys` call, an anchor expression `sourceRectAtTime` keeps it flush right); telemetry bottom left (a frame counter) and bottom right (the camera's yaw, pitch and distance, read off the sliders and baked every two frames).
6. **Type.** `txt()` sets one layer left-justified with its anchor on the ink (left, centre or right). `roll()` sets one layer per character at its centre in the final string (measured with a fresh probe per prefix), bakes its scramble in one `bakeText` call, and keys its colour with an `ADBE Fill` effect on hold keys (dim, one white frame, final). `decodeStrings()` is the single-layer version for labels and subtitles.
7. **Target lock.** `target()`: four corner brackets in one shape layer; scale 190 to 100, rotation 45 to 0, opacity 30 to 100 over 0.22 s; every bracket's stroke colour keyed white for three frames on hold keys. A tag plate (a two- or three-character mono code) and a SemiBold label that decodes.
8. **Hologram panel.** `holoPanel()`: the real picture with `ADBE Tint` (black to near-black teal, white to pale cyan), a light `ADBE Glo2`, `Add` at 88%; a scanline layer (a 2 px black rect with a Repeater every 4 px, 45%); a border plate with corner ticks. `scanMatte()` reveals or erases the whole group top-down (a matte rectangle keyed linearly plus a hot line with glow travelling with the front). For the carry, the picture's matte scans it in and then erases it top-down while a second matte reveals the line art (`tools/holo.mjs`: ffmpeg edge detection, white on black, tinted in the hue, additive) behind the same front.
9. **Leader, card, chip.** The leader is one shape layer (a ring plus a two-segment polyline) drawn with Trim Paths. The value card is a plate with a decoding label, the rolled value in the accent, a unit and a typed detail line. On docking, the card's layers fade 0.3 s and a chip (plate, mono label, value in the accent, unit) slides 52 px into the rail.
10. **Beam.** A solid with a vertical `ADBE Ramp` (hue at the pad, black at the top), a feathered trapezoid mask, `Add`, at 16% under a panel and 34% at ignition settling to 20%.

**Gotchas found while proving it**

- A path property fetched before a sibling Fill was added to the same vector group was dead by the time it was keyed ("Object is invalid" on `setValuesAtTimes` in `scanMatte`). Re-fetch a property after adding anything beside it; the same goes for a stroke after its dashes are added.
- With the scan parked at -0.4 under the pad, the near edge of the bust's base ring still projected below the front and showed before the scan started. Park it at -1.2 and jump to just under the pad one frame before the rise.
- The scan ring with a 9% fill and the wireframe's two glow passes bloomed into a white disc. The ring gets a 3% fill and one glow.
- On a 1080 px wide frame the subject // mode label and the right-aligned status line collided at 28 px with tracking 120. Use 24 px with tracking 80 and a short subject label.
- A layer takes one track matte. The carry's picture needs both its scan-in and the conversion front, so it takes one matte with an "in" segment followed by an "out" segment (the out front is the conversion's hot line); the line art takes its own "in" matte on the same times.
- The sheet samples the middle of each beat: the title roll starts on "style" and the 338 locks by the end of "338", so neither is still scrambling at mid-beat.
- Build about 22 s for 177 layers (about 200 `createPath` expressions); render about 90 s, most of it the glow passes over the expression paths.

**Close, not identical:** Lemo's engine is a Canvas renderer with sub-frame motion blur, a low-res glow chain and Fresnel-shaded solid faces. Here glow is two `Glo2` passes per layer and the solid hologram (faces plus interlace) is not staged in the proof; a reel can add it as a filled copy of the wireframe under `ADBE Venetian Blinds`. The shared scene has no object with mechanical parts, so the local explode is shown as assembly (three pieces sliding together into one picture) rather than a shell sliding along its axis. Subtitles hold for their beat (about 1.4 s), shorter than Lemo's 1.8 s minimum, because the scene's beats are short.

## 7. Dependencies

Rajdhani Light, Medium and SemiBold and Share Tech Mono Regular installed (`assets/fonts/`, OFL; `AESHologram.fontOK()` checks). Node 20+ and ffmpeg for `tools/holo.mjs` (the real frame cropped and greyed, and its line art). Stock effects only: Gradient Ramp, Glow, Fill, Tint, Slider Control, plus shape layers, Repeaters, Trim Paths, masks, track mattes and `createPath` expressions. No generated pieces: the wireframes are data in the module.

## 8. Pitfalls of the medium

Target boxes that balloon or drift off the part read as a bug: compute them from the projected bounds at the lock and keep the camera slow while they show. A long diagonal leader points at the wrong thing: put the ring on the body. Two things in amber means one is wrong. Text over the wireframe is unreadable: every block gets a plate, and the camera keeps the subject clear of text. A piece floating off the body is noticed first. A fade anywhere but a docking card breaks the "scanned data" fiction. Generic boxes do not read as the part: give each object its characteristic silhouette (a sphere head, a folded corner, a phone's rounded rect and tile grid).

## Reference

The proof is the shared test scene, built by `buildScene` and proven with `node production/styles/harness/prove.mjs hologram-hud`, which rebuilds it from a blank project and renders it with aerender. `proof/compare.jpg` sets it beside Lemo-Opuscar's hologram-hud poster.

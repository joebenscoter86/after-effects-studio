# Tilt-shift miniature

> A real-looking place filmed from high above through a tilted lens and a time-lapse clock, so the whole world reads as a tabletop model.

## 1. What it is, and what it is not

A place seen from high up through a tilt-shift lens: only a thin horizontal strip of the frame is sharp, and everything above and below melts into blur. The eye reads that as a macro shot of something small, so the world becomes a model. Two more things make the trick work: saturated, sunny colour (model-railway paint) and time-lapse (cars, boats and people move in fast, jittery steps like wind-up toys, while the camera glides).

The hero of this package is a small Mediterranean harbour town: whitewashed and pastel blocks with terracotta roofs and cobalt shutters, a quay road with candy-coloured cars and one red van, turquoise water with boats, a paved plaza full of capsule people, and a billboard on a roof that carries the titles in neon and the real clip as a screen.

Not a toy or clay render (the world is meant to look real, only the lens and the clock make it small), not a game's top-down view (no UI, no flat shading), not drone footage (the band, the saturation and the stutter are mandatory).

## 2. Grammar

- **The band**: a physical depth of field in Blender, focused on the shot's subject every frame, with the aperture solved per frame so that a point a quarter frame above the focus is blurred by a chosen number of pixels (the band's width, 16 to 26 px at 1080 wide; larger is narrower). After Effects adds a gentle screen-space band (Gaussian Blur 13 outside a feathered strip that follows the subject's screen height from the track), so the blur keeps a band shape even on near top-down shots where depth is flat.
- **Vantage**: always high. Oblique shots at 36 to 47 degrees pitch from 40 to 102 m with a 48 mm lens on a 24 mm sensor (28 degrees vertical), one near top-down (74 degrees) for the board-game view of the painted digits.
- **Colour**: a pale warm ground of whitewash and sand with candy accents (terracotta roofs, cobalt and teal shutters, a few ochre and coral facades), very saturated greens, dark asphalt so the white markings and cars pop, turquoise water fading to cobalt. Shadows stay blue (a sky-gradient world with a warm ground bounce). The subject you want found is the one saturated thing in the sharp band: the red van, the yellow raincoat, the yellow middle digit.
- **Light**: one hard sun, cheated per shot so the facades the camera sees are front-lit, lowering and warming through the film (late golden light by the end). Cloud shadows (flattened blobs above the town, invisible to the camera) sweep across in the stepped clock.
- **Motion**: the world clock `tw(t)` steps at 10 Hz (holds 3 frames at 30 fps) at x12; everything that moves reads it (cars, boats, walkers, the van, the hero, clouds, the water's ripple). The camera is smooth on every frame. In the end beat the clock drops to x1 and runs smooth: the world goes silky and nearly still.
- **Type**: the town's own signage. Titles are neon capitals on the rooftop billboard (cyan over pink, a flicker on). Subtitles are cobalt harbour-notice panels with a white border and rounded corners, white Barlow Semi Condensed (a highway-sign grotesk), flipping on like a sign, sitting in the lower blur band. A time-lapse clock chip (IBM Plex Mono) reads `x12 TIME-LAPSE 07:41:12` with a red dot blinking on the steps, and switches to `x1 REAL TIME` with a green dot when time drops.

## 3. Camera grammar

| Move | Used for |
|---|---|
| High oblique wide, very slow slide, band on the billboard | title: the place at a glance, the neon title |
| Rack of the band from one subject to the next | picture: person, kiosk, booth on the words |
| Slow push on the billboard | input: the real clip on the rooftop screen |
| Near top-down, slowly rotating | number: the digits painted on the plaza, people walking over them |
| Lateral track along the quay, band on one subject | line: the red van pulling out and driving east |
| Logarithmic rise and swing from the billboard | carry: the screen turns into the sign as the town opens out |
| Locked high frame, time dropped to real time | end: the neon words, the world gone still |

Transitions are cuts on the beat. The carry is one continuous move. No dissolves (they reveal the fake lens).

## 4. Native moves

- **The speed drop (x12 to x1)**: the stutter stops, the clock chip flips to `x1 REAL TIME`, and the world nearly freezes. Here it lands on the end title.
- **The band as pointer**: the focus follows the subject; in the picture beat it racks person, kiosk, booth on "Three", "build", "picture".
- **Titles in the world**: neon on the billboard, digits painted on the plaza one at a time (a crew's work in time-lapse).
- **Cloud shadows sweeping**: weather crossing the model in every shot.
- Not used in the shared scene: long-exposure light trails at dusk, the scale reveal rise to a pattern, the dive from high to actor height.

## 5. Sound palette

Tuned percussion carries the style (marimba, glockenspiel, vibraphone, woodblocks, celesta), pulse-based and minimalist, with world events gating notes of a fixed phrase. In time-lapse: music first, a faint sped-up hiss, clacks and relay clicks. At real speed the world turns real: idling engines, gulls, small voices. Silence is the moment real time arrives. The proof carries only the scene's voiceover.

## 6. AE recipe

The world is a Blender plate; everything on and around it is built by `buildScene` in `tilt-shift.jsx` from a blank project.

1. **The plate** (prepare): `tools/plate.mjs` renders `tools/town.py` with local Blender 5.2 (EEVEE, 48 samples, jittered depth of field, bokeh max 46 px, fast GI, Khronos PBR Neutral) into PNG frames, files them as one ProRes 4444 movie with alpha at `{cache}/town.mov` and deletes the frames; it also writes `{cache}/track.json`. About 3.5 s a frame at 1080x1920 on an M5, 15 to 20 minutes for the shared scene. Cached by a hash of `town.py`, the scene, its words and the digit font. Render it by hand before proving: prove runs prepare while it holds the After Effects lock.
   The town is a few merged meshes built with bmesh (walls with a colour attribute, darkened toward the ground and broken by world-space noise; windows as dark glossy panes with shutter pairs, doors, awnings and balconies; gable roofs in four terracottas or flat roofs with parapets and clutter; ground, markings, trees), plus separate movers: 36 cars and the red van (body colour from the object colour, dark glass, brake lights), 9 boats, 112 capsule walkers (30 percent larger than life), the yellow-raincoat hero under a red umbrella (a quarter larger again, walkers kept 3 m clear of it), cloud blobs (camera-invisible, shadow only), the kiosk and the booth, and the digits as font curves on the plaza. Every mover is placed from a Python function of the stepped clock each frame; nothing is keyframed. The billboard's face is a Holdout.
2. **Track** (`track.json`): per frame, the screen face's four corners in pixels (TL, TR, BL, BR), the band (subject screen y and an estimated half height), the world clock and the speed (12 or 1), the van's screen position; plus the line beat's word times, the digit paint times and the step length.
3. **Under the plate**: the sign precomp (948x675: a dark board, an amber neon rim, the title lines and the end lines in Barlow capitals, cyan and pink, each with a Glow in its own colour and a hold-key flicker on) corner-pinned for the whole film; the clip precomp (the webcam frame of the input picture, Easy Levels) corner-pinned above it from the input beat until the switch, coming on with a flicker and going off by collapsing a mask to a thin line (the pin owns the corners, so the layer cannot be scaled).
4. **Plate**: the movie, alpha set to straight.
5. **Neon spill**: the sign precomp pinned again over the plate in Add, Easy Levels Input Black 0.35, Gaussian Blur 26, 70 percent, so the glow bleeds past the board.
6. **Grade**: an adjustment layer with Hue/Saturation (Master Saturation 42) and Brightness and Contrast (14, 4); a warm solid (#FFB46A) in Soft Light at 12 to 26 percent, rising toward the end; a black vignette solid (inverted elliptical mask, feather 420) in Multiply at 42 percent.
7. **Band**: an adjustment layer with Gaussian Blur 13 through an inverted feathered (280) rectangular mask whose path is keyed every second frame from the track's band.
8. **Type**: `notice` builds a harbour notice (cobalt rounded panel with a 5 px white stroke, a soft blurred shadow, Barlow text, a scale-Y flip on with a small settle and a fold out). The line beat is a two-line notice whose Source Text is keyed on the spoken word times. The number label is a wide-tracked notice under the painted digits. `clockHUD` bakes the clock string per frame and holds the red dot's opacity on the steps; a Fill effect turns the readout amber in time-lapse and green at real time.

**Gotchas found while proving it**

- A `Batch` of bmesh boxes renders nothing until it is written to a mesh and linked: the first still showed only the loose movers on transparent black.
- The town floor has to reach far past the blocks: the oblique shots look a long way north, and a short floor leaves alpha at the top of the frame.
- A plaza kiosk in the middle of the plaza sat on the middle digit in the top-down shot; the digits moved north and shrank, and the plaza paving went darker (#B9A385) so white paint reads on it.
- The first proof lost the hero: a yellow figure among 46 bright walkers, under a corner tree. It got a red umbrella, the plaza went to 30 walkers kept 3 m clear of it, and the trees over it went.
- Cars on the van's lane drove straight through it: cars are now placed after the van and queue 6.5 m behind or ahead of it.
- Quay palms 4.6 m tall sat between the camera and the van on the line beat; they dropped to 3.4 m and the line shot tilted to 52 degrees.
- The first band (8 to 18 px) read as a soft drone shot: it needs 20 to 26 px a quarter frame off the focus (bokeh max 46 px) plus the After Effects band at 13 to read as a model. The title at 150 m made the neon unreadable; it sits at 94 to 102 m.
- Leaning the billboard back takes a negative X rotation in Blender (a positive one tilts the face down, away from the camera).

**Close, not identical:** the reference renders live in three.js with a custom post pass (a physical CoC mixed with a screen-space band, gathered at output resolution after a 2x supersampled render), a procedural city with a facade shader, an IDM traffic sim with signals and a sampled marimba score gated by world events. Here the lens is Blender EEVEE's depth of field with a per-frame aperture plus a light After Effects band, the facades are geometry rather than a shader, traffic is constant-speed loops (no signals or car-following), the neon sign is After Effects type under a holdout, and the score is the scene's voiceover only.

## 7. Dependencies

- Blender 5.2 at `/Applications/Blender.app` (or `BLENDER`), ffmpeg with `prores_ks`, Node 20+.
- Fonts (bundled, OFL): Barlow Semi Condensed SemiBold, IBM Plex Mono Medium; both must be installed for After Effects. The plaza digits use the bundled Barlow file.
- Stock effects: Corner Pin, Glow, Gaussian Blur, Easy Levels, Hue/Saturation, Brightness and Contrast.
- No generated pieces.

## 8. Pitfalls of the medium

- Tall buildings and a shallow pitch hide the ground: keep blocks low (two to five floors) and pitch 36 degrees or more.
- A subject in a street canyon or behind a facade loses the band: route it on the camera side (the van drives on the quay, not behind the blocks).
- A pure top-down has no depth, so a physical lens gives no band; tilt it (74 degrees here) and lean on the screen-space band.
- One fixed sun leaves half a film backlit and grey: cheat the azimuth per shot.
- Time-lapse speed that is too honest turns cars into teleports: keep world speeds low (4 to 6.5 m/s) so a 10 Hz step at x12 jumps about 6 m.
- Anything After Effects draws on the world (the sign, the clip) is not blurred by the plate's lens: keep it in the band, or blur it to match.

## Reference

- Lemo-Opuscar `tilt-shift` (MIT, LemoLab): `https://github.com/lemomo-ai/lemo-opuscar/tree/main/styles/tilt-shift/STYLE.md`, `DEMO.md` and `demo/`.
- Grammar: tilt-shift time-lapse photography (high vantage, the blur band, time-lapse rhythm, cloud shadows). No real places, landmarks or brands.

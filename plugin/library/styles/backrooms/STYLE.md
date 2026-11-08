# Liminal found footage

> A camcorder tape recovered from an empty, endless office: rules instead of monsters, and the camera's own machinery tells the story.

## 1. What it is, and what it is not

One first-person consumer camcorder recording from the 1990s, handheld and continuous, inside an empty interior that is familiar but wrong and seems to go on forever: mustard wallpaper, a stained carpet, a drop ceiling with humming light panels, partitions with gaps that always show more emptiness. Nobody is there. The dread comes from emptiness, repetition, bureaucratic notices, and the camera failing at the wrong moment: focus that hunts, exposure that lags behind a blackout, tape that tears and skips time.

The main character is the place itself, and what the camera finds in it: the rooms, the light panels and the dead zones where the haze goes dark, a laser-printed notice from Management, a CRT on an AV cart that plays the real clip and is later somewhere else, a far silhouette that is almost human, and one red alarm lamp. The medium (OSD, tape damage, captions) is the storyteller around it.

It is not a horror film (no monster close-up, no gore, no jump scare, no score sting), not a CRT terminal piece (the artefacts are tape and lens, not phosphor and scanlines; see `crt-terminal`), and not a ruin (the space is clean, the decay is in single-digit percentages). Never name the internet folklore it borrows its grammar from, and never use its level numbers, entity names or any real organisation on screen: every notice, rule and company voice is original.

## 2. Grammar

**Type.** Three families, three jobs. The camcorder OSD and its title generator use one bitmap face (VT323), white with a black outline, never touched by the tape: REC with a red dot top left, the battery, SP and a counter top right, the date and a running clock bottom left. The title generator is the same face larger, cut on and off with no animation. Closed captions (CEA-608 look) are IBM Plex Mono Medium 50 px, white on a solid black box per row, at most 32 characters, centred above the date; the line beat is painted on word by word as it is spoken; SDH descriptions go in brackets (`[LIGHTS FLICKER]`). Printed notices are part of the picture, never captioned: a condensed sans (Barlow Semi Condensed SemiBold) in black on yellowed paper with tape at the corners, a header, a form number and revision, numbered rules and a polite closing line from Management.

**Colour.** One dominant sickly hue from the materials: wallpaper `#D5BD66`, darker trim `#4D3D26`, a mottled carpet `#8C763C`, a near-white warm ceiling `#E6DFC6`. Exactly one saturated colour, the red alarm lamp, which is the only thing that blooms. White balance drifts (warm, green after the tear, cool after the blackout); colour is never graded clean, blacks are lifted and whites soft-clipped.

**Motion.** One continuous handheld take: walking gait (bob, sway, a little roll), breathing at about 0.27 Hz, and tremor whose amplitude follows a fear curve; at a held breath all of it freezes. Autofocus hunts with overshoot (blur, lock, slip, lock); zooming in opens the aperture. Lights drop out for about 0.1 s and auto-exposure catches up over about 0.45 s. Things move by themselves only off camera. The only cuts are tape events: the power-on roll, a tracking tear, the battery dying on a frozen frame.

## 3. Camera grammar

A vocabulary, not a route: walking POV down a corridor (routine, the endless); a slow pan off a detail to the space (a reveal); crouch and hold on printed text with the lens parallel to the page (reading, bureaucracy); zoom and focus hunt into the distance (seeing, not seeing); identical framing after a tear with only the OSD changed (time removed); backing away while filming (retreat); a whip toward a sound, then nothing (or something). A presence is always small, far, and in a region of dead lights. Text is readable and uncovered for three seconds or more.

In the shared scene: the title is the first shot down a corridor after the power-on roll, with the title generator over it; the picture beat walks and pans, finding a far silhouette at the corridor's dead end (it is there only while the focus is right), then a notice and a CRT on a cart through a doorway (person, document, device); the input beat zooms on the CRT, focus hunting, the real clip on its screen; a tracking tear cuts to the number beat, a crouched hold on the notice whose form reads the number, while the OSD counter runs up to it and the clock has jumped; the line beat backs away (the cart is empty now) while the caption types itself; the carry is a blackout and a whip toward a sound: the CRT is on the floor deep in the dark room, still playing; the end zooms toward it with a held breath under the title generator, and the battery dies on a frozen frame.

## 4. Native moves

- **Autofocus and auto-exposure hunting.** Something exists only while focus is correct.
- **Tape tracking damage.** A tear is the cut; after it the clock has jumped and a battery bar is gone.
- **The OSD is plot.** REC, battery, counter, date and time are evidence (the counter counts the number beat).
- **Rules as text in frame.** A notice that starts ordinary and drifts wrong; the same notice repeated elsewhere.
- **Emptiness and repetition.** A room with one detail changed: the empty cart.
- **The thing that is almost human.** A far organic silhouette, wrong by a quarter (small head, long neck, narrow high shoulders, long arms), standing in dead light.

## 5. Sound palette

No score. Only what the tape would have heard: a 120 Hz fluorescent hum with harmonics and a ballast whine, gated by the same light curve (it cuts out in a blackout); carpet footsteps, cloth, the camcorder's motor, zoom servo and focus ticks; a ballast tink when the lights return; silence (digital zero) as the strongest tool, captioned `[SILENCE]`; a calm corporate PA voice with a short original chime if the story needs announcements. Mix in-world sound about 8 dB under the voice, -14 LUFS. The proof carries the scene's voiceover only.

## 6. AE recipe

The rooms are a Blender plate; everything the camcorder adds is built by `buildScene` in `backrooms.jsx` from a blank project.

1. **The plate** (prepare): `tools/plates.mjs` renders `tools/rooms.py` with local Blender (EEVEE, 24 samples, 720x1280 on purpose: low resolution hides CG cleanliness and the tape pass upscales it), files it as `plates.mp4` (H.264, CRF 12) with `data.json`, and deletes the frames. About two minutes on an M5 alone. Cached in `{cache}/plates-<key>/` by a hash of `rooms.py`, the scene, its words and the notice font; render it by hand before proving, because prove runs prepare while it holds the After Effects lock. The world: partitions 0.12 m thick on a grid with gaps and stubs, pillars, a 2.75 m drop ceiling (0.6 m tiles with seams, a few yellowed), a light panel every 2.4 m, each an emissive plane plus an area light with **shadows off** and a 3.9 m cutoff (flat light that leaks through walls, like the reference), per-panel tint jitter of a few percent, 5 percent dead, 6 percent flickering, and two dead zones (the corridor's end, the far room) where every panel is dead. A world Principled Volume (density 0.035) is the fog: lit only by nearby panels, so it goes dark where the lights are dead. Procedural wallpaper (hard-edged stripes every 0.16 m, mottle, a discoloured band under the ceiling, tide marks at the foot), carpet with stains, dark trim. The notice is Blender text on a paper plane, with the scene's number and label. The CRT is a parented rig with an emissive screen and its own area light; it sits on the cart, vanishes during the number beat, and is on the floor in the dark room after the carry's blackout. Every frame is set from a function of time: the camera path per beat, handheld noise, focal length, focus distance and f-stop, blackouts on every panel, the silhouette's window. AgX Base Contrast.
2. **Track** (`data.json`): per frame, the screen's four corners in comp pixels (TL, TR, BL, BR), whether it shows, its blur (the circle of confusion of the screen from the camera's focal length, f-stop and focus distance, in comp pixels) and a fog factor; the blackouts, the tear time, the freeze time and the line beat's spoken word times.
3. **TAPE comp**: the plate scaled 150 percent; the real clip in a 900x675 comp (the webcam frame, time-remapped from the input beat's `clipStart` and held on its last frame, a 1.5 px soften, Output Black 0.07 and a dark feathered rim) corner-pinned from the track, Gaussian blur keyed from the screen's blur (times 0.55), opacity from the fog, and hidden by a hold expression where the screen is off; a bloom copy of the plate (Easy Levels Input Black 0.78, blur 46, Add, 55 percent); an AGC adjustment with Exposure keyed per blackout (+1.9 in the dark, +1.1 as the lights return, back to 0 over 0.45 s).
4. **VHS pass** (main comp, bottom to top): black; TAPE, time-remapped to freeze at the battery's death, opacity off for four frames, a per-frame horizontal jitter of about a pixel, then Offset (the power-on roll from 1500 px below, and a roll through the tear), Gaussian Blur 3.4 horizontal (soft luma), Channel Blur red 14 and blue 18 horizontal (smeared chroma), Sharpen 28 (edge ringing), Noise 9 to 14 percent in colour, Easy Levels (Output Black 0.075, Output White 0.93, gamma 0.94: lifted blacks, soft clip), Color Balance (HLS) Saturation 28, then `lens`: scale 107 and Optics Compensation FOV 12 (barrel on the image only, its black corners pushed off screen); a head-switching band (a second TAPE through the same `lens`, masked to a 46 px band at the bottom of the visible picture, pushed right 18 to 34 px a frame, Noise 45); tracking tears (a third TAPE through the same `lens`, masked to a random band each frame and shifted 40 to 170 px, plus 18 white noise lines in Screen) inside windows at power-on, around the cut, in the line's blackout and at the freeze; dropouts (three short white streaks on about one frame in eight); white balance (a solid with Fill keyed warm, green, cool, warm, in Soft Light at about 16 percent); a vignette (a black solid through an inverted feathered ellipse, 72 percent).
5. **OSD** (above the tape): `osdText` is VT323 white with a black stroke behind the fill; REC at 120 px with a 52 px red shape dot (until the freeze); `battery` (scaled 165 percent) draws an outline, nub and three bars that drain at the tear and the end and blink before the battery dies; SP and a four-digit counter at 92 px, the counter that counts up to the scene's number in the number beat; the date and a clock at 100 px bottom left, keyed once a second, that jumps at the tear. Big and chunky, as in the reference: at 60 px it read as a phone UI, not a camcorder.
6. **Title generator**: the OSD face at 92 and 118 px, centred, cut on after the roll and off at the picture beat; the end line from the end beat to the last frame, above the CRT (y 640).
7. **Captions**: `ccRow` is a Plex Mono text layer with a shape box under it whose size and position follow `sourceRectAtTime` (so a painted-on line grows its box); rows at y 1340 and 1414, above the date.

**Gotchas found while proving it**

- Blender is called by its app path, not the PATH: `plates.mjs` finds it at `/Applications/Blender.app` or through `BLENDER`.
- The battery's bar handles went invalid once more shape groups were added beside them ("Object is invalid"): the bars are re-fetched from the root group by index after every group exists.
- With Optics Compensation at FOV 22 on the tape, the frame's corners went black and curved like a TV tube, and the head-switching copy (no barrel) showed as a stray strip under them. Every copy of the tape goes through the same `lens` (overscale 107, FOV 12), and the head-switching band is masked at the bottom of the visible picture, not of the layer.
- The first proof was washed out next to the reference: AgX plus the fog flatten the mustard. Saturation 28 and gamma 0.94 in the tape pass, and hard-edged wallpaper stripes in Blender, brought it back.
- The line beat's blackout fell on the frame the proof sheet samples (6.97 s), so the beat read as a black frame; it moved to 7.40 s, after the empty cart has been seen.
- The red lamp at 40 W flooded the whole far room red, which read as an alarm scene rather than one signal colour; 14 W keeps it a lamp with a pool of red.
- The end title at y 880 sat across the CRT, the end's main character; it moved up to y 640.

**Close, not identical:** the reference renders in three.js with a texture of thousands of light values summed per fragment, fog coloured by local light over the average, GTAO, depth of field and bloom, then a VHS shader pass (line wobble per scanline, head switching, tracking tears, luma blur with ringing, chroma smear) and a 4:3 frame pillarboxed in 16:9. Here Blender's EEVEE does the light (area lights with shadows off), the fog (a world volume, lit locally by the same lights) and the depth of field; the tape pass is stock After Effects effects on the whole frame (the jitter moves the whole picture, not each line); and the frame is the reel's full 9:16, with no pillarbox, because the reel is vertical.

## 7. Dependencies

- Fonts (OFL, bundled in `assets/fonts/`): VT323, IBM Plex Mono Medium, Barlow Semi Condensed SemiBold (Blender reads the bundled Barlow file for the notice).
- Blender 5.2 (`/Applications/Blender.app`, or set `BLENDER`), run locally and headless by `tools/plates.mjs` (Node 20+, ffmpeg). No GPU rental, no generated images.
- Cache: the folder you pass as `--cache` (`plates-<key>/plates.mp4`, `data.json`, `plates.json`).
- Effects: all stock (listed in `style.json`).

## 8. Pitfalls of the medium

- A fully bright space reads as a hospital corridor: partitions with gaps, far areas falling dark.
- Lights leak through walls (no occlusion): a dead zone needs every panel within the cutoff distance dead, and dim space behind it.
- Uniform fog lifts a silhouette to grey: the fog has to be lit by the local lights only, so it goes dark in a dead zone, and the silhouette stands where lit space is behind it.
- Line wobble skews text and pitching the camera down at a vertical sheet shears it into fake italics: keep the jitter about a pixel and hold the lens parallel to the page.
- Primitive-built figures read as toys: the presence is an organic flat silhouette, far and small.
- A red that does not bloom reads as orange paint: the lamp's emission is driven far above the bloom threshold.
- Captions and OSD go above the tape pass; barrel, vignette and noise on them would make them look like part of the picture, which a TV-decoded caption is not.

## Reference

Lemo-Opuscar `backrooms` (MIT, LemoLab): `https://github.com/lemomo-ai/lemo-opuscar/tree/main/styles/backrooms/STYLE.md` and its demo (`demo/world.js`, `vhs.js`, `osd.js`, `subs.js`, `thing2d.js`, `story.js`). License copy in `assets/LICENSE-lemo-opuscar.txt`.

# Glass product

> A launch film for a fictional object of glass, metal and light floating in an infinite black studio: strips it never shows draw its outline with rainbow edges, light travels inside it, caustic rings spread on the floor, and its parts float apart and snap shut on the beat.

Adapted from Lemo-Opuscar's *Glass Product Render* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only: the object is always fictional; never a real product silhouette (a famous phone, earbud or watch outline), a real brand, logo, typeface or interface, and never name a real launch film.

## 1. What it is, and what it is not

One hero object of **clear and frosted glass, satin metal and light** in a black strip-light studio. Long emissive strips behind and beside it turn clear glass into a thin white outline with rainbow edges; the internals (a screen, a light-guide ring, a gold-traced board, a satin frame) show through as in a display case. Material and light are the subject. Everything moves slowly and precisely, and every cut, sweep and pulse lands on a beat.

The hero here is a thick clear glass tile (a fictional object): front glass, a screen, a light-guide ring with comet pulses, a satin metal frame, a board with gold traces, a frosted back. A reel replaces the object with its own (keep the studio and the materials).

Not a white-cyclorama catalogue shot, not a wireframe HUD, not a keynote slide (that is `dark-keynote`, where the interface is the star): here a physical object is.

## 2. Grammar

- **Studio.** Pure black, no HDRI. Light comes only from emissive strips the camera cannot see: two tall strips behind left and right (the silhouette), a wide far strip (a horizon rim), a soft cool top box (volume for frosted glass and metal), a weak front card, an accent card driven by the pulses, and **the sweep**: a tall strip travelling on an arc behind the object, so its highlight, refraction and dispersion move physically. Never paint a 2D highlight on the object.
- **Background.** Black with a dark-grey radial sweep high in the frame that only camera rays see (it separates glass edges and never shows in the glass); the floor fades into it. No horizon line.
- **Floor.** Black gloss, a blurred mirror that carries only the objects (the strips are light-linked off it), with procedural caustics: a lens ring under the object with its red, green and blue radii offset, and event rings that spread from a snap.
- **Clear glass.** Transmission, roughness about 0.015, IOR about 1.5, real thickness (bevelled slabs), dispersion on. **Frosted glass**: rough transmission with a milky cool tint; it reads only with something bright behind or inside it. **Metals**: satin aluminium (roughness 0.24, anisotropic), chrome no shinier than roughness 0.14, gold traces on a near-black board. Anything inside glass is opaque.
- **Colour.** The world is neutral: black, greys, the white of the strips, the metals' own tints. **One accent family, reserved for light**: ice blue `#6BC7FF` drifting to soft violet `#A985FF` with a pulse's age. Emitters that only illuminate (inside frosted glass) stay cool white `#DBEAFF` and dim. Rainbows only at thick glass edges and in the caustic, never on surfaces or type.
- **Type.** Inter Tight (OFL). Titles in ExtraLight, very large (about 130 px on the 1080 frame) with very wide tracking (about 420), caps, centred in the upper third; a diagonal glint sweeps across the letters with the sweep light. A slogan or the end line in Light. Small tracked caps (Regular, 24 to 30 px, tracking 640 to 700) in grey for labels and credits. Near-white `#EEF2F7`, grey `#9AA3AF`.
- **Subtitles are a slab of frosted glass**: a centred rounded bar filled with the live frame blurred and lifted, a little cool white, a thin highlight stroke and a short accent line on top; Inter Tight Light 42 px. Names, numbers and the slogan are title cards, never subtitle lines.
- **Motion.** On ones, eased: ease in and out for camera orbits, ease out for parts decelerating into a float, ease in for a snap back. The camera always drifts; never locked off, never handheld, except a couple of frames of micro shake on an impact. An exploded view spreads along the object's axis (about its own size), each part with a small fixed tilt and a spin proportional to its offset: a long ease out apart, a short hover, a very short ease in snap on a downbeat. Light pulses and sweeps are events on the beat grid.

## 3. Camera grammar

| Move | Expresses | In this package |
|---|---|---|
| Sweep over a dark object, slow push | contour before content | the title plate: the object unlit, the sweep crossing behind it, the strips fading up |
| Slow high 3/4 orbit | the whole object in one move | the line-up plate (three objects on a diagonal) |
| Macro, rack focus surface to part inside | nothing to hide | the input plate: focus pulls from the front glass to the screen as the camera pushes |
| Side or 3/4 macro orbit | material contrast | the line plate: shallow focus on the ring and the seam while comets run |
| Exploded view, axis about 40 degrees to view, orbiting | technical beauty, suspension | the carry plate |
| Straight-on front, slight push | declaration | the number plate: the number itself in thick glass |
| Slow pull back into negative space | room for type | the end plate, the object low and small, the end line above |
| Top-down on the floor, low orbit under the object | range; weight | not in the proof; a reel adds them in `glass_scene.py` |

One hero, centred or on a strong diagonal, never cropped by the frame edge in a wide. Each shot is its own stage (no spatial continuity is needed). Cut only on beats; transitions are cuts or a sweep passing through black, never dissolves or wipes.

## 4. Native moves (pick what the story needs)

Find the invisible thing the subject does and make it visible as light inside glass.

- **Transparency**: the inside is the hero; rack focus from the shell to the part within (the real frame shown on the tile's screen, under its front glass).
- **Lensing**: thick glass bends what is behind it (the glass digits).
- **Dispersion**: a sweep crossing a thick edge becomes a moving spectrum.
- **Light that travels inside**: energy as comet pulses in a light guide (one comet per spoken word, a counter running round the number).
- **Caustics**: an internal pulse becomes a ring spreading over the floor (the snap).
- **Exploded view and snap**: parts float apart and snap back on a downbeat.
- **Frost to clear**: a frosted shell clears and the inside appears (not in the proof; animate the frosted material's roughness and tint to zero).

## 5. Sound palette

Minimal electronic, never piano and strings: bowed or wet-finger glass tones, granular crystal clouds, glass bells and FM glass plucks, a filtered tick grid, a warm pad, a sub drone, soft short kicks and claps, an 808 with a pitch envelope, noise and saw risers, a high glass ding. Minor and modal colours. Lock every pulse, sweep and snap to the score (one hit list shared by the score and the plates). Silence before a release. Foley follows the material: glass shimmer for sweeps, glass and metal friction for moving parts, magnetic clicks, air puffs, a snap as a cluster of clicks plus an inharmonic glass chord. A restrained, low voice with very few short lines. Music ducks about 12 dB and foley about 6 dB under the voice; about -14 LUFS. Render the audio outside AE and place it as a layer.

## 6. AE recipe (`glass.jsx`, AESGlass)

The object and its light are Blender plates; After Effects cuts them, pushes them a little, and does the type.

1. **Plates** (`tools/glass_scene.py`, Blender 5.2 Cycles on the Metal GPU, 64 samples, adaptive, denoised, Khronos PBR Neutral view transform). One shot per beat at 30 fps: `title` 39 frames, `picture` 52, `input` 45, `number` 52, `line` 41, `carry` 41, `end` 54. Run it per shot (`shot=<id> out=<frames dir>`; `preview` renders four stills at half size, `draft` every frame at a quarter size). The input shot textures the screen with the scene clip from `clipss` for 1.5 s, cropped square around the face (`crop=640:640:220:1215` for the shared scene); the number shot extrudes `number=` in glass. Frames are cached under `~/Assets/joeb/styles/glass-product/frames/<shot>/`; `tools/plates.mjs` (a `prepare` step) encodes each finished folder once into `<cache>/<shot>.mov` (ProRes 422 HQ) and keeps it, and prints the Blender command for any plate that is missing. Delete the frame folders once the plates are filed.
2. **Materials** (in `glass_scene.py`): clear glass is three Refraction BSDFs tinted red, green and blue at IOR 1.47, 1.50 and 1.535 added together, mixed with a Glossy by a Fresnel (this Cycles has no dispersion input); frosted glass is a Principled with full transmission, roughness 0.42, base `#9EA8B8`-ish milky cool, a light coat; the light guide is dark clearcoated acrylic plus an emission whose strength is a Gaussian head and an exponential tail around the ring's object-space angle (`head1`, `head2` and `power` value nodes are keyed; the colour ramps from white at the head through ice blue to violet with age). The floor emission is three Gaussian rings per channel (lens ring and event ring, R inside, B outside), keyed through value nodes `lensR`, `lensI`, `ringR`, `ringI`.
3. **Studio**: the strips are emissive planes with camera visibility off; **light linking** gives them a receiver collection of every object but the floor. The background radial is the world's strength (window coordinates, multiplied by Is Camera Ray), and the floor mixes to Transparent beyond 3 m from its centre, so it fades into that radial with no horizon.
4. **Plates in AE**: `plate()` imports each `.mov`, starts it on its beat, enables time remapping with `Math.min(time - startTime, duration - frameDuration)` (a beat a fraction longer than its plate holds the last frame instead of going black), fits the plate to the frame width and adds a linear push (100 to 101.5 to 104%). Cuts are hard, on the beat. `shake()` keys four linear position keys around the snap (7 px). A Glow adjustment (colour channels, threshold 78%, radius 60, intensity 0.35) is the bloom above the highlights.
5. **Type**: `txt()` sets centred text on a baseline (`AESLib.text`, centre justified); `fit()` shrinks a title until its ink fits 920 to 940 px. `arrive()` fades a layer up with a blur that clears (eased out, no slide). `glint()` duplicates a text layer in white, clears its effects and keys, mattes it (`setTrackMatte`, alpha) with a soft white band rotated 24 degrees and blurred 26 that travels across the ink, and adds it with a small glow.
6. **Subtitle slab** (`slab()`): an adjustment layer the size of the comp with a rounded-rect mask (the bar), `ADBE Gaussian Blur 2` 34 (repeat edge pixels) and `ADBE Easy Levels2` (Output Black 0.05, Output White 0.6, Gamma 1.15), so the bar is the live frame blurred and lifted but no brighter than 60%; a shape layer with the bar in cool white at 9% and a 1.2 px white stroke at 22%; a 160 px accent line on the top edge with a glow; the line in Light 42 px. The bar is sized from the measured line. The line beat keys one word per spoken word (`AESLib.textKeys`).
7. **Beats**: title (the context huge in caps, the hero as a slogan, a glint), picture, input and carry on the slab, line typed on the slab, number (the glass digits in the plate, a tracked label under them that grows on the spoken words, a glint), end (the end line ultra-thin in the upper third clearing from blur on its first word, a tracked credit, a glint).

**Gotchas found while proving it**

- Cycles in Blender 5.2 has no dispersion input on the Principled or Glass BSDF: fake it with three tinted refraction lobes at slightly different IORs. Keep the IOR spread small (about 0.065 in all) or a whole face takes a red or blue cast.
- A tall strip's mirror image on a gloss floor is a white column running from the object toward the camera. Hiding the strip from glossy rays would also hide it in the glass: light-link the strips to every object except the floor instead. A text (FONT) object must be in that receiver collection too, or the glass digits render black.
- A strip that reaches below the floor shows through the floor where it fades to transparent: every strip ends above the floor.
- An emissive backdrop plane draws a hard horizon where the floor cuts it: put the grey radial in the world (camera rays only) instead.
- CPU and GPU enabled together rendered slower than the Metal GPU alone on Apple silicon (about 60 s against 17 s a frame at 1080 x 1920); persistent data, fewer bounces and caustics off (the caustics are procedural) also helped. Another session rendering Blender at the same time roughly halves the speed.
- Plates are a whole number of frames and some beats are not (1.74 s is 52.2 frames): time remap with a clamp so the last frame holds rather than dropping to black for a frame.

- `glint()` duplicates a text layer, so it inherits its keys: remove the opacity keys before setting a value, and recolour a keyed Source Text key by key (`setValueAtKey`), or AE refuses `setValue()` on a property with keyframes.
- A bright strip behind the subtitle slab washed out the first letters through the lifted blur: cap the slab's Levels at Output White 0.6.
- The bridge timed out ("could not reach After Effects") twice while another session's long build was still running in AE; a ping a few minutes later answered and a plain rerun worked. Nothing was wrong with AE.

**Close, not identical:** Lemo's engine renders real-time WebGL with a PMREM strip environment re-baked every frame; here the same strip kit is real geometry in Cycles, rendered once per beat, so a camera move after the render is limited to the small push in AE (a new move means a new plate). Dispersion is three refraction lobes rather than a spectral model. The caustics are procedural rings on the floor, as in Lemo, without the Voronoi filaments. Depth of field is Blender's; there is no 2x supersampling (Cycles samples instead). The frosted subtitle bar blurs the composited frame under it, as Lemo's CSS blur does. Subtitles hold for their beat (1.4 to 1.7 s in the shared scene), shorter than the 1.8 s minimum, because the beats are short.

## 7. Dependencies

- **Blender 5.2** at `/Applications/Blender.app` (Cycles with Metal) to render the plates; not needed once the plates are in the cache. A full set for the shared scene is about 324 frames, about 17 s a frame on the M5 GPU when nothing else is rendering (about 95 minutes). No Runpod or paid GPU without Joe's go on the price.
- **ffmpeg** for `tools/plates.mjs` (ProRes encode) and the input shot's clip frames; Node 20+.
- **Inter Tight** installed with its ExtraLight, Light and Regular styles (`assets/fonts/InterTight[wght].ttf`, OFL); `AESGlass.fontOK()` checks. The glass digits use Inter ExtraBold (`~/Library/Fonts/Inter-ExtraBold.otf`, OFL) when it is installed, else Blender's default font.
- Effects: `ADBE Gaussian Blur 2`, `ADBE Glo2`, `ADBE Easy Levels2` (stock).
- No Higgsfield pieces: every object is modelled and rendered in Blender.

## 8. Pitfalls of the medium

- Frosted glass on black reads as dark grey plastic unless something bright is behind or inside it; a strong top light on it reads as a white slab instead. Keep its base milky but not white and light it from inside.
- A coloured emitter inside frosted glass tints the whole object: the cores stay cool white and dim.
- An exploded view seen perpendicular to its axis is a row of edge-on lines: keep the axis about 40 degrees to the camera.
- A pure profile reads as a simple shape: 3/4 views.
- Mirror chrome becomes a white disc: roughness at least 0.14.
- AgX and Filmic wash the accent toward white: use the neutral view transform.
- A rough floor reflecting very bright strips adds noise and glare; the floor should carry the objects and the caustics, not the light kit.
- A grey idle screen behind clear glass reads as "off": keep it nearly black unless it shows something.

## Reference

The proof is the shared test scene, built by `buildScene` and proven with `node production/styles/harness/prove.mjs glass-product`, which encodes the cached Blender plates (`prepare`), rebuilds the scene from a blank project and renders it with aerender. `proof/compare.jpg` sets it beside Lemo-Opuscar's glass-product poster. For a reel, render its plates with `glass_scene.py` into the reel scene's cache (`~/Assets/joeb/styles/glass-product/scenes/<scene id>/frames/<shot>/`, with its own `clip=`, `clipss=`, `crop=` and `number=`), then `prove.mjs glass-product --scene <dir> --out <dir>`.

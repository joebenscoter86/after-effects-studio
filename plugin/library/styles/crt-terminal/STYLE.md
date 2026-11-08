# CRT terminal

> Everything on screen is a real character on a monospace grid, lit by the phosphor of an old monochrome CRT.

Adapted for native After Effects from Lemo-Opuscar's *ASCII / CRT Terminal* style (MIT, LemoLab; see THIRD-PARTY-NOTICES). Proven in AE on 2026-10-15 against the code-rendered original: same glyphs, layout, power-on, glass and colour, built from text layers and stock effects.

## 1. What it is, and what it is not

A single monochrome terminal screen: amber (P3), green (P1) or white (P4) phosphor on dark curved glass with scanlines. Every image, title, picture and subtitle is **real glyphs on a character grid**, chosen by ink density. The camera is the grid: bigger characters push in, smaller characters pull out. The mood is cold, patient, machine-calm: typed text, a blinking cursor as suspense, one warm surprise.

Not an image under an "ASCII filter"; not green hacker rain; not pixel art (no sprites, no free pixels); not a sci-fi HUD (no vector lines or floating panels).

## 2. Grammar

- **Grid.** One monospace font, VT323 (bundled, OFL). Cell = 0.4 em wide, 0.8 em tall (1:2): `cw` px wide, `2cw` tall; font size = `cw / 0.4`, leading = `2cw`. Column counts by shot: title about 20, terminal 40 to 80, picture 120 or more.
- **Pictures.** `tools/glyphs.mjs` turns real footage into glyph frames: each cell's ink (or light) picks a glyph from VT323's measured density ramp, with three brightness tiers (dim, normal, bold); `--rows-from/--rows-to` and `--cols-from/--cols-to` crop to one region of a layout (the proof keeps only the on-camera window of a reel) and an ordered dither. Negative space makes ASCII art readable; silhouettes beat texture.
- **Colour.** One phosphor carries everything. **At most one soft second colour**, for one thing only (the object the story is about), switched on once. It can be a second phosphor for the hero picture (the proof draws the face in `white` over the `amber` world, as Lemo-Opuscar draws its moon: `glyphTiers(..., { phosphor: "white" })`) or a red accent tier (`--accent-red`, with `--accent-box` and `--accent-from/--to` keeping it off everything else red).
- **Type.** Subtitles are terminal output: the **LOG strip** at the bottom (separator, inverse `LOG` tag, a prompt, the spoken line in uppercase typed word by word on the voice's word times). Text the story shows (a prompt, a command, counts) is picture. Titles are typed with key clicks.
- **Motion.** Characters never move off the grid; typing, scrolling and counters jump cell to cell. Only three things move continuously: the grid's scale (the camera), CRT physics, and particles in a declared transformation. Machine typing is even and fast (10 to 40 ms a character); human typing is uneven, with pauses.

## 3. Camera grammar

| Move | Expresses | In AE |
|---|---|---|
| Static terminal | waiting, procedure, machine time | one text grid, no camera |
| Push in (cells grow) | attention, a decision | scale the grid layer (or its precomp) about the point |
| Pull out (cells shrink) | context, scale, one of many | scale down; a new grid can arrive around it |
| Push into one glyph | what a symbol is made of | scale a single glyph until its cell holds a picture grid, then fade the glyph |
| Scroll | accumulation, time | bake the buffer rows as Source Text keys |
| Clear screen / redraw | a cut, a new state | swap the text; never crossfade two screens |
| Power on / off | birth, an ending | `crtStack` power-on (dot, line, frame) |

## 4. Native moves (pick what the story needs)

The picture is made of words · font size is the camera · typing rhythm is editing rhythm · CRT physics (power, afterglow, bloom) · a single colour change · the log file (timestamps, progress bars, error codes tell the story).

## 5. Sound palette

Original analog-synth score (detuned saws and squares through a resonant low-pass, square-wave sequencers, tape wow, long reverb), never chiptune. Silence is the main instrument; drop to digital zero for a shock. Foley: relay click and degauss hum at power-on, buckling-spring keys (Enter heavier), teletype ticks for machine output, BEL and square-wave error beeps, room tone with a very quiet flyback whine. Music ducked about 8 dB under the voice; master about -14 LUFS. Render the audio outside AE and place it as a layer.

## 6. AE recipe (`crt.jsx`, AESCrt)

1. Make two comps of the delivery size: `SCREEN` (everything that glows) and the output comp. Put every glyph layer in SCREEN.
2. Pictures: run `tools/glyphs.mjs` on the footage, read the JSON with `AESCrt.readJSON(path)`, call `AESCrt.glyphTiers(SCREEN, data, { x, y, phosphor })`. It makes one text layer per tier and **bakes each frame into Source Text hold keys**.
3. Terminal text: `AESCrt.mono()` for a grid line, `AESCrt.typed(layer, str, AESCrt.handTimes(str, t0, .045))` or `evenTimes(...)` for typing.
4. Subtitles: `AESCrt.logStrip(SCREEN, words, { y, cw, cols })` with `[[start, end, "WORD"], ...]` from a transcript.
5. The tube: `AESCrt.crtStack(OUTPUT, SCREEN, { phosphor, powerOn: [0, .42] })` adds glass, the screen in Add mode with a power-on (scale + exposure + beam line by expression), two Glows (bloom and halo), noise, ~1% flicker, 3 px scanlines, Optics Compensation curvature, a vignette and a rounded bezel.

**Gotchas found while proving it (each cost a render):**
- `aerender` drops text driven by a JSON footage expression (`footage().sourceData`): the frames render in the AE UI but come out blank on the command line. Always bake keys.
- AE Glow on "Original" colours drifts to lemon when red clips. Set Glow Colors to A & B with the phosphor's two colours (`PHOSPHOR.*.glowA/glowB`).
- The phosphor's tier colours are tuned under that glow; pure brightness-scaled amber reads yellow-white.
- Adding a second effect invalidates a handle to the first: re-fetch the Effect Parade before setting properties.
- Baking about 4 tiers x 100 frames of 120 x 74 text takes longer than a short bridge timeout; the build continues in AE. Inspect before re-running.

**Close, not identical, to the shader original:** scanlines are even (the shader narrows them on bright areas); the bloom is AE Glow, not a multi-level blur in the phosphor's own ramp.

## 7. Dependencies

VT323 installed (`assets/fonts/VT323-Regular.ttf`, OFL; `AESCrt.fontOK()` checks). Node 20+ and ffmpeg for `tools/glyphs.mjs`. Stock effects only: Glow, Noise, Exposure, Venetian Blinds, Optics Compensation, CC Vignette, masks.

## 8. Pitfalls of the medium

Every dark pixel becomes a character (threshold, gamma about 1.25, local contrast); noise-textured subjects read as blobs (use silhouettes and sparse shadow sides); text the viewer must read needs time (hold at least 1.8 s, and longer than the line takes to say plus 0.6 s); a power-on at progress 0 still shows the centre dot (keep exposure at 0 before it).

## Reference

The proof is the shared test scene, built by `buildScene` and proven with `node production/styles/harness/prove.mjs crt-terminal`, which rebuilds it from a blank project and renders it with aerender. `proof/compare.jpg` sets it beside Lemo-Opuscar's ascii-crt poster.

Build time: every text key goes in through one `setValuesAtTimes` call per layer (`AESLib.textKeys`). Writing keys one at a time froze After Effects for minutes on this scene; batched, the proof builds in about 6 s.

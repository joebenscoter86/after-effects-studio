# Halftone dossier

> A retro print case file, read out one exhibit at a time: cream archive paper, overprinted halftone dots in a few flat inks, heavy serif headlines with misregistered shadows, caption bars, and rubber stamps that slam.

## 1. What it is, and what it is not

- **The whole film is paper.** A warm cream sheet with mottling, a centre fold, a vignette and dust specks. Nothing glows.
- **Shading is never a gradient.** Tone is halftone dots whose size follows a density field (radial halos, edges crowding the frame, ramps "lit from above"). Two dot layers at different screen angles overprint (Multiply): that is the printed feel.
- **Bureaucratic apparatus is the frame**: a case number, a chapter chip that counts the exhibits, a REC dot and a date, numbered exhibit cards, a height chart, a name plate, a transcript sheet, a manila folder, stamps.
- **Loud but readable**: one idea per beat, one headline, one exhibit, one caption line.

It is not risograph (no grainy two-ink texture as the whole look, no zine collage), not Swiss motion (no grid-driven kinetic type on white), not game show (no candy sets). Dots, paper and stamps are visible in every frame.

## 2. Grammar

**Inks.** A paper ground, one dark ink and four flat spot inks, no more:

| Role | Ink |
|---|---|
| Paper | `#F1E9D4` (cards and sheets `#FBF6EA`) |
| Dark ink: outlines, body text, caption bars, HUD | navy `#1E2A4A` |
| Overprint shadow: misregistration, caption shadows, dot halos | cobalt `#2D4FC0` |
| Highlight: keywords, the numeral | yellow `#F2C230` |
| Second dot layer, labels, cheeks | pink `#E8508A` |
| Stamps and alarms only | red `#D8342C` |

A character may own one local colour (the face). Flat inks only; tone comes from dot size and overprint.

**Type.**

- Headlines: Newsreader ExtraBold, 140 to 180 px, left-aligned at the margin (66 px), with a misregistration shadow (+5 % of the size in cobalt, Multiply).
- Display and numerals: Titan One (fat rounded), with a navy outline; the giant numeral bleeds near the frame edge.
- Data and HUD: Space Mono Bold (case number, chip, dates, ruler numbers, transcript).
- Captions and stamps: Anton.
- **Caption bar**: a navy pill with a cobalt offset shadow, sheet-coloured text, the keyword in yellow. It pops in after the headline and carries the spoken line. Beats whose exhibit already prints the words (the numeral, the transcript) go without one.

**Motion.** 30 fps transforms. Everything enters with overshoot (a back ease, 0.3 to 0.45 s): rising from below the frame or scaling from 0. Nothing fades in. Headlines pop glyph by glyph (drop 60 px and scale from 0, stagger 0.05 s; labels 0.025 s). Stamps slam from 2.6x to 1x in 0.09 s (ease in), then a damped bounce, with a camera shake (quadratic decay) and a flash capped at 50 % on the same frame. Landings squash and keep their volume. Line boil (Turbulent Displace reseeded at 10 fps) on drawn subjects only, never on text, dots or captions. A blink, a blinking REC dot. Between files, a dot wipe; otherwise hard cuts. No dissolves.

## 3. Camera grammar

A 2D camera null per beat over a flat, frontal page. A vocabulary, not a route:

| Move | Expresses | In the proof |
|---|---|---|
| Locked frontal | the page as a poster | title, picture, line |
| Slow push-in (1 to 1.04 / 1.06) | scrutiny before a verdict | the mugshot, the closed file |
| Shake with quadratic decay (6 to 22 px) | impact | every stamp, the strings landing |
| Flash (50 % white to 0 in 0.18 s) | being photographed, a verdict | "real", "counted", "test" |
| Folder slide / page rises from below | next file | the transcript sheet, the photo and memo dropping into the folder |
| Dot wipe (coarse screen, diagonal) | next chapter | line into carry |

Compose like a printed page: headline top-left, subject centre or right-centre, caption bar bottom-centre, HUD in the corners.

## 4. Native moves

- **The accusation frame**: "the case of X", counts and exhibits.
- **Numbered exhibits**: cards labelled EXHIBIT A, B, C rise onto a board, each with a halo of dots; red string links the pins.
- **The stamp**: OPEN, COUNTED, CLOSED. A verdict is a physical slam.
- **The mugshot**: height chart, the real frame printed in two inks, a name plate, the flash.
- **Halftone-filled numeral**: a yellow numeral with a pink dot ramp clipped inside it, over a cobalt shadow, counting up on twos.
- **Dot density is emotion**: halos swell on an entrance, dots crowd the edges as tension rises, a bloom breaks out behind the verdict.
- **Redaction**: the transcript is printed under ink bars that lift on each spoken word.
- **The file closes**: exhibits drop into a manila folder and the flap closes.

## 5. Sound palette

Synth pop-print: kick, snare, clap, hat; a square-ish 8th-note bass; a marimba-like pluck. Foley follows the print: a pitch-dropping boom and click for every stamp, a camera shutter on the flash, paper slides and folder flaps, typewriter clicks for the transcript, a whoosh into the dot wipe, small pops on headline glyphs. Empty the music just before a verdict so the stamp lands alone. Narration, if any, is dry and deadpan. Mix SFX ahead of the music on impacts, -14 LUFS.

## 6. AE recipe

Module `dossier.jsx` (`AESDossier`), built on `AESLib`. Layer names start with the scene prefix.

1. **Paper** (`paper`): a `#F1E9D4` solid at the bottom of the comp.
2. **Halftone** (`dots`): one dot layer is a precomp at comp size: a black solid; the density fields above it in Add mode; the dot screen (`tools/screen.mjs`, a grey PNG of each pixel's distance to its dot centre over k x step) on top in **Subtract**. In the main comp the precomp gets **Exposure** (+4.4 stops, +5 for the coarse wipe screen) so the difference becomes a crisp dot with about a pixel of anti-aliasing, and it is the **luma track matte** (`setTrackMatte`) of a flat ink solid set to **Multiply**. The matte layer is disabled and parented to the beat's camera null.
   - Fields: `radial` (Ramp, radial, white at the centre; End of Ramp keyed so the halo grows), `linear` (Ramp, linear), `edge` (a white solid with an inset rectangular mask in Subtract mode, feathered 340 px), `sweep` (the dot wipe: two linear Ramps whose points travel the diagonal, white spreading until it covers, then black).
   - Screens: 24 px at 45 degrees for the main ink, 21 px at 15 degrees for the overprint ink, 135 px at 0 degrees (k 0.88, so the cell corners sit at 0.8 and full density covers them) for the wipe.
   - A clipped dot layer (the numeral): inside the precomp, a copy of the numeral (same baked keys) is the **Alpha Inverted** matte of a black solid on top, so dots exist only inside the glyph.
3. **Headlines** (`headline`): two text layers, the cobalt shadow (Multiply, offset 5 % of the size) under the navy line. Each gets a `POP` animator: Scale 0 and Position (0, -60) driven by an Expressible Selector whose amount follows a back ease per `textIndex`, so no keys. Anchor from `sourceRectAtTime`.
4. **Caption bar** (`caption`): an Anton line with a `KEY` animator (Fill Color yellow, Range Selector start/end at the keyword's character percentages) over two rounded rects (cobalt offset, navy pill), all on a null that scales in with overshoot.
5. **Stamp** (`stamp`): an Anton word and a double rounded frame (12 px and 5 px strokes) in red, Roughen Edges (border 4, scale 16, complexity 3), opacity 93 %, on a null tilted -9 to -11 degrees whose scale is keyed 260 -> 100 (linear in) -> 93 -> 102 -> 100. The beat's camera null gets the shake expression (`seedRandom` per frame, `add(value, mul(...))`, decay squared over 0.45 s) and a white solid flashes 50 -> 0.
6. **Exhibits** (`exhibit`): a card (sheet fill, 7 px navy stroke), the subject as flat shape groups with heavy outlines and Turbulent Displace boil (amount 3, size 26, evolution posterized at 10 fps), a Space Mono label and a red pin, on a null that rises from below with overshoot and squashes on landing. The person's eyes are a named shape group whose scale blinks.
7. **Mugshot**: a height chart (one shape layer of rules, two multi-line Space Mono layers with 150 px leading for the numbers), the real frame printed by `tools/print.mjs` (cobalt at 15 degrees for everything but the highlights, nudged 3 px; navy at 45 degrees for the shadows; on white) multiplied on a photo card.
8. **Transcript**: a sheet, the line in Space Mono, and one navy bar per word (positions from the measured monospace advance) whose scale X keys to 0 on the word's onset.
9. **Folder** (`folder`): back panel and tab, the photo and a memo dropping in with a squash, the front flap hinged at its bottom edge (scale Y -100 -> 104 -> 100).
10. **HUD** (`hud`): case number, the EXHIBIT chip whose number is keyed per beat in one `textKeys` call, the REC box with a dot that blinks (a sheet-coloured cover, opacity expression). Above the pages, below the wipe.
11. **Paper texture** (`paperTexture`), over everything: Fractal Noise mottling (Overlay 11 %), a blurred centre fold (Multiply 16 %), a vignette (feathered elliptical mask, Multiply 16 %), sheet specks (high-contrast Fractal Noise, Screen) and ink specks (an ink solid through a luma matte of the same kind of noise), both reseeded at 15 fps.

**Gotchas found while building it**

- A new shape layer from `comp.layers.addShape()` sits at the comp centre with anchor (0, 0): a path drawn in comp coordinates (the red string) landed 540, 960 off and ran out of frame. Zero its position (`piece` does this for every other shape).
- The dot wipe's coarse screen first used k 0.75, which puts the cell corners at 0.94: after Exposure the "full" cover still showed star-shaped gaps of paper at every corner. k 0.88 puts the corners at 0.8 and full density covers. The wipe ink is also Normal, not Multiply, or the page below shows through the navy.
- The front flap hangs open below the folder at scale Y -100, so its label prints mirrored there: its opacity is held at 0 until the flap closes.
- A layer's order matters for Multiply over shapes: the end bloom has to sit under the folder's back panel (`moveAfter`), or pink dots print over the yellow folder top.
- An inline `//` comment added mid-line swallowed the rest of that line's statements (`sv is undefined`): end-of-line comments only, in a module of long lines.
- Paper read grey next to Lemo's cream at first (mottling Overlay 18 %, a dark vignette at 30 %): lighter vignette colour at 16 % and mottling at 11 % keep it warm.
- Ink specks first multiplied an inverted Fractal Noise through Tint: the Invert did not take, so a mostly dark noise multiplied the whole page grey (a plain paper pixel measured 178, 175, 167 against 241, 233, 212). Measure a plain pixel of the render. The specks are now an ink solid through a luma matte of the noise.
- Ramp colours and Fill take four-component colours (`[r, g, b, 1]`); Exposure's master exposure is effect property 3.

## 7. Dependencies

Fonts (free (OFL) from Google Fonts, not included): Newsreader ExtraBold (variable font), Titan One, Space Mono Bold, Anton. Node 20+ for `tools/screen.mjs`; Node 20+ and ffmpeg for `tools/print.mjs`. Stock effects only: Ramp, Exposure, Roughen Edges, Turbulent Displace, Fractal Noise, Gaussian Blur, track mattes. No generated pieces: the exhibits are drawn natively.

## 8. Pitfalls of the medium

- Dots under about 14 px of step at 1080 wide alias into moire after encoding; keep the main screens at 21 to 24 px.
- Too many inks lose the print: at most five plus paper.
- Boil on text or dots turns them to mush: subjects only.
- A dot wipe short of full coverage at the cut shows the hard switch: the coarse screen uses k 0.88 so its corners sit at 0.8 and full density covers them.
- A 100 % white flash reads as a dropped frame: cap at 50 %.
- Every element invisible before its cue needs its in point (or a scale of 0) before the cue: nothing fades in.

## Reference

Lemo-Opuscar `styles/halftone-dossier` (MIT, LemoLab; `library/styles/LICENSE-lemo-opuscar.txt`), grammar from Ben-Day-dot pop-art printing, riso and offset overprint zines, police mugshot height charts and case-file folders. Proof: `proof/compare.jpg`, `proof/proof.mp4`.

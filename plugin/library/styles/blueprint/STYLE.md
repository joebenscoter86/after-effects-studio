# Blueprint

> Engineering drawings that draw themselves on a sheet of cyanotype paper: white line work on Prussian blue, laid down in drafting order, with notes and dimensions that move.

Adapted for native After Effects from Lemo-Opuscar's *Blueprint* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only: never copy a real patent, a real inventor's machine or signature, or any film's credit sequence.

## 1. What it is, and what it is not

The whole film happens on one sheet of blueprint paper. Everything on it is a 2D drawing convention: centre lines, outlines, detail lines, 45 degree hatching, dimension lines with arrowheads, part balloons with leaders, hand-lettered labels, a header, a title block with fields and a GENERAL NOTES column. The drawing is dry and exact; the notes carry the wit or warmth. The designed thing is the character; people appear only as drawn figures.

Not a hologram HUD (no glowing wireframe, no 3D orbit), not a whiteboard (no marker on white), not an engraving (no tonal burin hatching as the whole look), not a 3D render (orthographic and oblique projection only).

## 2. Grammar

- **Sheet.** Two Prussian blues, `#12295C` to `#21479A`, uneven: a radial ramp, fbm mottling (Fractal Noise, Overlay), vertical coating streaks (stretched Fractal Noise, Soft Light), two fold creases (a pale line beside a dark one), bleached edges. It lies on a dark drafting table `#0D1116` with a soft drop shadow, seen when the camera pulls back.
- **Line.** Pale blue-white `#E7F0F9`, never another hue; weight and softness vary instead. Four weights at 1080 wide: outline 4.4, detail 2.8, thin 1.8, hair 1.2 (`AESBlueprint.W`; Lemo's 3.2 / 2 / 1.25 / 0.9 are for a 1920 wide frame and vanish at reel scale). Dash conventions as stroke dashes: centre line long-short, hidden short, phantom (cutting plane) long-short-short (`AESBlueprint.DASH`). One adjustment layer over the drawing blurs it 0.8 px and adds a faint Glow, so the lines look exposed into the paper rather than vector-sharp.
- **Colour.** Blue and white only. **One** non-blue colour, used once: the red rubber stamp `#CC2924` that carries the verdict.
- **Type.** Hand lettering (Architects Daughter, OFL) in capitals for the header, labels, notes and subtitles; a technical sans (B612, OFL) for title-block field names, dimension values and tags. Text is written on left to right with a nib, word by word on the voice.
- **Subtitles are drawing notes.** A double-ruled box with a `NOTE / n` cell, lettered on the spoken onsets, placed in empty space on the sheet, never a bottom bar. Every spoken line is also lettered into the title block's GENERAL NOTES column after it is said, so the final wide holds the whole voiceover as notes.
- **Motion.** Strokes draw on along their length at an even pen speed (linear Trim Paths) with a glowing nib at the head. Drafting order inside a figure: centre line, outline, detail, hatching, balloon, label. Cuts land on beats; a figure change is a strike-through and a rewrite of its FIG. label. The only continuous moves are the camera, a section line sweeping, and a dimension's value counting.

## 3. Camera grammar

| Move | Expresses | In AE |
|---|---|---|
| Locked on the drawing | drafting, deliberation | no keys on the camera null |
| Whole sheet on the table | the document as an object; the verdict | scale the camera null (every sheet layer is parented to it) down to about 86%, which shows the table and the sheet's shadow |
| Small bump | a physical impact (the stamp, a paper slap) | three linear position keys on the camera null, a few px, 0.15 s |
| Section line sweeping | inside versus outside; one state becoming the next | a phantom line with A markers keyed down the figure while a mask on the layer under it follows |
| Fig. number rewrite | the next version or step | `strike()` the FIG. label, cut it, letter the new one in the same place |
| Push or pan to a part | the mechanism's heart | key the camera null's scale and position (not used in the proof) |

Never a dissolve. Transitions are cuts on beats and FIG. rewrites.

## 4. Native moves (pick what the story needs)

Drafting order (the object draws itself as an engineer would) · live annotations (a dimension whose value counts, balloons on parts) · FIG. numbers as transitions · a section line that reveals or converts what is under it · the photograph as a cyanotype print with its edges traced as line work · the title block as story (status field, revision, the stamp) · the whole sheet on the table for the ending.

## 5. Sound palette

Contrapuntal, mechanical music: harpsichord, bassoon, spiccato strings, harp, celesta, music box, a small wind ensemble; an invention or canon whose interlocking lines feel like parts. Foley follows the paper and the tools: technical pen scratch for each stroke (length = stroke length), lettering bursts, compass squeak on circles, hatching strokes, T-square slide, paper slap on a cut, rubber stamp thump with a small low thud on the verdict. Silence holds only paper sounds. Voice dry and understated, music ducked well under it, master about -14 LUFS. Render the audio outside AE and place it as a layer.

## 6. AE recipe (`blueprint.jsx`, AESBlueprint)

1. One comp. A table solid at the bottom; a camera null `_CAM` anchored at the comp centre; `sheet(comp, prefix, cam)` builds the paper (ramp + drop shadow, mottle, streaks, folds, bleach), every layer parented to the camera.
2. Strokes: `stroke(comp, name, pts, { w, dash, closed, t, dur, cam, out })` makes one shape layer with one path (groups named `G`, `P`, `T` so expressions can find them), a round-capped stroke, optional dashes, and Trim Paths End keyed 0 to 100 linear over `dur`. Unless `nib: false`, a nib layer (an 8 px dot and a 26 px halo) follows the head by expression: `content("G").content("P").path.pointOnPath(content("G").content("T").end / 100)`. Helpers build point lists: `rect()`, `circle()` (a 48-gon).
3. Hatching: `hatch(comp, name, x, y, w, h, gap, t, dur, cam)` puts every 45 degree segment in one group with Trim Paths set to Individually, so the strokes go down one after another.
4. Lettering: `letter(comp, name, str, { family, style, size, x, y, t, dur | keys, center, nib, cam })` sets a flush-left (or centred) text layer and writes it on with an Opacity 0 animator whose range Start is keyed linear. `spokenKeys(str, words)` turns word onsets into those keys, so each word appears as it is said. `strike()` draws through a lettered label.
5. Annotations: `dim(comp, name, x0, x1, y, { from, gap, t, cam })` (extension lines, the line in two halves leaving a gap for the value, open arrowheads); `balloon(...)` (a numbered circle, a leader, a dot on the part).
6. Numbers: a centred text layer whose value counts with `AESLib.bakeText` (one batched call); a NOTE number flips with one `AESLib.textKeys` call.
7. A photograph: `tools/cyanotype.mjs` crops the frame to the figure and writes a grey `tone` print and a white-on-black edge `trace`. In AE the tone is tinted (black to black, white to `[.5, .64, .86]`) and screened at 50% so the blue shows through its shadows; the trace is tinted to the line colour and added. Both are revealed left to right by a keyed mask behind a scan line.
8. The ink adjustment layer (Gaussian Blur 0.8; Glow based on Color Channels, threshold 92%, radius 12, intensity 0.6) sits over the drawing; the stamp (two rounded rects and B612 Bold text in the stamp red, Roughen Edges, 88% opacity, scale 128 to 100 in 0.07 s) sits above it so it does not glow.

**Gotchas found while proving it**

- Glow on an adjustment layer over an opaque page: a Glow added by script glowed on alpha, so the whole sheet bloomed and every pixel's blue clipped at 255 (an electric cyan page) before a single line was drawn. Set `Glow Based On` to 2 (Color Channels) explicitly, and keep the threshold above the paper's brightest channel (92%) so only the line work glows.
- Fractal Noise's Transform section is not a property group in scripting: `Scale`, `Uniform Scaling`, `Scale Width`, `Scale Height` and `Rotation` sit flat on the effect (`fx.property("Scale")`).
- Centre justification did not take on a new text layer (the stamp's word sat right of its box, the NOTE number spilled out of its cell): anchor from `sourceRectAtTime(0, false)` instead, as Swiss motion found for flush left.
- The verdict stamp is timed to the last spoken word's onset, not its end, so it lands on the word and holds through the end card.
- A build that throws can leave its untitled project open in AE. Inspect it before the next build, and never discard unsaved work you did not create.
- Coating streaks and mottle read as scratches above about 10% opacity once the page is lit correctly: streaks 6% Soft Light, mottle 14% Overlay.

**Close, not identical:** the reference draws on a WebGL sheet shader with true ink bleed, wet stains and line weights that scale with zoom (screen width = sheet width x zoom^0.65); here the paper is stacked stock effects and the lines scale with the camera null. The proof scene has no mechanism, exploded view or "one real thing"; a reel adds those when its story has them.

## 7. Dependencies

Architects Daughter Regular and B612 Bold and Regular installed (`assets/fonts/`, OFL; `AESBlueprint.fontOK()` checks). Node 20+ and ffmpeg for `tools/cyanotype.mjs`. Stock effects only: Gradient Ramp, Drop Shadow, Fractal Noise, Tint, Gaussian Blur, Glow, Roughen Edges, plus shape layers, Trim Paths, masks, text animators and one expression per nib.

## 8. Pitfalls of the medium

A figure near the sheet edge shows the table in the wide: keep margins. Line work that is too thin vanishes in the pulled-back wide; too thick reads as sausages when pushed in. Subtitles on a bottom bar break the sheet (the bottom is the title block): place notes in empty sky. More than one non-blue colour, or the red used twice, kills the verdict. Text a viewer must read needs time (hold at least 1.8 s, and longer than the line takes to say plus 0.6 s). A fade anywhere reads as video, not drawing: draw on, cut, or strike and rewrite.

## Reference

Before import, the shared test scene was built by `buildScene` from a blank project and rendered in the author's proof setup, then compared with Lemo-Opuscar's blueprint reference. In this plugin, render frames of your own build and check them against this file.

Build time: about 2 s for 147 layers; the number and the NOTE tag each take one batched Source Text call (`AESLib.bakeText`, `AESLib.textKeys`); lettering is a range-selector animator, never Source Text keys.

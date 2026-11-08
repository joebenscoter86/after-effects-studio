# Swiss motion

> International Typographic Style in motion: a column grid, one grotesque, ink on paper with one signal colour, and movement as exact as a printing press.

Adapted for native After Effects from Lemo-Opuscar's *Swiss Motion Graphics* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only: never copy a historical poster's composition, never use Helvetica or Akzidenz files, never name a real institution on a poster.

## 1. What it is, and what it is not

Pure 2D graphic design animated on a grid: flat page, black type and bars, a very light grey, and **one** saturated signal colour. Every element sits on a column or a baseline, every move lands on a beat, nothing bounces. The frame obeys a system, so the one thing that carries the signal colour (or breaks the grid) becomes the character. Extreme scale contrast: a giant numeral beside tiny technical notes.

Not a keynote (no gradients, glow, device renders or shadows), not lyric-video kinetic type (words never fly, spin or bounce), not a chart (bars are graphic mass, not plotted data, unless the grid gives them that meaning), not a Bauhaus pastiche of primary shapes, not grain or texture.

## 2. Grammar

- **Grid.** Vertical 1080 x 1920: six columns of 136 px, 24 px gutters, 72 px margins (`AESSwiss.GRID`, `colX(comp, i)`, `colW(comp, n)`). Fewer, wider modules give elements mass; many thin columns read as a chart. The column guides can be drawn faintly as part of the picture.
- **Colour.** Page `#EAE9E5`, paper `#FFFFFF`, ink `#111111`, greys `#CFCEC9` (secondary voice) and a lighter guide grey, one signal (`#E30613` red; orange, ultramarine or green are equally valid, chosen for the topic, then never a second). Only one thing carries the signal. Photographs are printed in one ink: grey, a little contrast (`tools/print.mjs`).
- **Type.** One family for the whole film: Inter Tight (OFL, bundled), Bold for statements and numerals, Medium for notes. Tracking -20 (about -2%) at 90 px and up. Flush left, ragged right, every line on a baseline; white space is part of the layout. Giant numerals are optically flush left (shifted left by about 6% of their size to cancel the side bearing).
- **Subtitles are layout.** A spoken line is set in the composition at a column start: a small grey lead-in and a large bold statement, each word clip-revealed on its spoken onset. Caption rows are about 24 px Medium with a 1 px rule above (a museum label: "Fig. 1", a module count, a technical note).
- **Motion.** Two curves only. The snap is `cubic-bezier(.7, 0, .2, 1)` (`AESSwiss.snap`: zero speed, 70% influence out of the first key, 80% into the second); linear is for rules being drawn and for the exception. A snap starts one note value early and lands on the beat. Entrances are clip-reveals and wipes, never fades; exits lift out of the same clip; deletions are knife cuts. Ripples go in order, a few hundredths of a second apart.

## 3. Camera grammar

| Move | Expresses | In AE |
|---|---|---|
| Locked page | a rule applied; cause and effect | no camera: the programme (title) holds the top, the field below changes |
| Push into one module | detail; the unit of the system | `group()` a module's layers under a null anchored at its centre, `snap` scale and position to full bleed |
| Hard pan by one column or page | the next step | `snap` a group null's position by `colW` or the page height |
| Rotate 90 degrees and stop | the same thing read another way | `snap` the group's rotation; rotate, hold, then add labels |
| Split into equal cells | parallel cases | modules on `colX(comp, 2 * i)` |
| Knife cut | removal; a cut to the next state | `knife()`: a signal line drawn across, then the group collapses to that midline |

Never a dissolve. Transitions are wipes, knife cuts, pushes and re-flows.

## 4. Native moves (pick what the story needs)

The grid means something (columns become a quantity) · snap = beat · programme (rules applied one by one, then the same programme generating many) · extreme scale contrast · the exception (one element linear and unsnapped, off the grid) · knife cut · re-flow (everything else rearranges around a change, nearest first).

## 5. Sound palette

Music with a grid of its own: a steady pulse whose subdivisions give the snap durations (motorik kit and bass, minimal techno, marimba or vibraphone patterns, a mechanical piano ostinato, drum machine and glockenspiel). Foley follows the materials of print, dry and close: letterpress clack, ruling-pen "tss" on a drawn rule, guillotine snick on a knife cut, paper slap on a wipe, numeral thunk, block snap. Drop the drums for the exception; a hard stop on a downbeat makes the next snap an event. Voice compressed and at least 6 dB above music, music ducked about 10 dB under the voice, master about -14 LUFS. Render the audio outside AE and place it as a layer.

## 6. AE recipe (`swiss.jsx`, AESSwiss)

1. One comp, a page-colour solid at the bottom. Optional column guides: `rule(comp, name, colX(comp, i), 0, H, 1, PALETTE.guide, t0, t1, { vertical: true })`, drawn in a ripple.
2. Type: `word(comp, name, str, { x, y, size, style, color, t, out })` sets one flush-left text layer on a baseline and clip-reveals it: a rectangular mask is keyed against the layer's rise (same `snap`, opposite offset), so the clip stays still in the comp while the word rises into it and lands on `t`; `out` lifts it out of the same clip. `setLine(comp, prefix, words, times, { x, y, size, maxW, leading, out })` measures each word and wraps flush left.
3. Flat pieces: `shapes(comp, name, items, pos)` draws rects and ellipses in one shape layer with its anchor at the top-left (1 px overdraw against seams), so a wipe is `snap(L.scale, t0, t1, [100, 0], [100, 100])` (down) or `[0, 100]` (right).
4. Rules: `rule(...)` draws along its length with Trim Paths, linear; `retract(L, t0, t1)` takes it away from its start.
5. Photos: `tools/print.mjs` crops a frame to the module and prints it grey; `photo(comp, name, path, x, y, w, h, t)` wipes the white paper in from the left, then the print down onto it.
6. Groups and cuts: `group(comp, name, x, y, layers)` parents layers to a null anchored at (x, y) without moving them; `knife(comp, name, group, x, y, len, t)` draws the signal line across at y and collapses the group to it, landing on `t`.
7. Numbers: a giant numeral climbs in held Source Text steps (one `AESLib.textKeys` call) while a bar under it snaps to each step.

**Gotchas found while proving it**

- Left justification on a new text layer did not take in the proof: every word rendered centred on its x, so flush-left lines piled up and the caption row ran off the left edge. `word()` now sets the anchor to the ink's left edge (`sourceRectAtTime(0, false).left`, baseline 0), which is flush left whatever the justification says; `measure()` returns the rect's width only.
- A knife on a group that was already pushed (the carry) must read the group's scale at the cut time (`valueAtTime`), not `.value`, which is the value at the comp's current time and would snap it back to 100% first.
- A two-line end card standing on a rule: start the first baseline one leading above the rule and wrap with a narrower `maxW`, so the last line, not the first, sits on the rule.

**Close, not identical:** the proof scene carries the signal in the rules and the knife (the red line is the protagonist); it does not stage the exception, the one element that moves linear and off the grid, which a reel adds when its story has one. The reference draws on a canvas with its own 2D camera matrix; here a camera move is a null's transform. The snap ease is AE's influence approximation of the cubic-bezier, not the exact curve.

## 7. Dependencies

Inter Tight installed with its Bold and Medium styles (`assets/fonts/InterTight[wght].ttf`, OFL; `AESSwiss.fontOK()` checks). Node 20+ and ffmpeg for `tools/print.mjs`. No effects: shape layers, text layers, masks, nulls and Trim Paths only.

## 8. Pitfalls of the medium

Too many thin columns look like a chart: fewer, wider modules. Tilting a layout is not a better composition; a stronger diagonal, a larger signal element, a bleed or type over colour is. Rotating and labelling at once reads as noise: rotate, hold, then label. Text a viewer must read needs time (hold at least 1.8 s, and longer than the line takes to say plus 0.6 s). Put visual onsets on whole frames. A fade anywhere breaks the style.

## Reference

The proof is the shared test scene, built by `buildScene` and proven with `node production/styles/harness/prove.mjs swiss-motion`, which rebuilds it from a blank project and renders it with aerender. `proof/compare.jpg` sets it beside Lemo-Opuscar's swiss-motion poster.

Build time: about 1.6 s for 55 layers; every text key goes in through one batched call per layer (`AESLib.textKeys`).

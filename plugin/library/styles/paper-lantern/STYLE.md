# Paper-cut lightbox

> A layered paper-cut shadow box lit from behind: six to nine sheets of flat cut card in a shallow box, a warm light glowing through the paper, windows burning through holes, soft shadows falling from each sheet onto the next.

## 1. What it is, and what it is not

Every shot is one physical object: a shallow box of parallel cut sheets. Everything on screen is one of three things:

1. **A paper sheet**: one flat colour, a thin warm rim on its top edge and a dark band on its bottom edge. Back sheets are lighter and translucent, the front almost black. That value ladder is the depth.
2. **Light through paper**: a warm glow, strongest near the light source (a moon, a lantern, a lit screen). Windows, fires and lanterns are emissive holes that burn and bloom.
3. **Shadows**: a top light casts a soft shadow from every sheet onto the sheet behind. Never turn it off; it is what sells real paper in a real box.

The film may step out of the box (the lit lamp in a dark room) to say "this is an object someone keeps".

It is not flat paper-cut animation (here there is depth, backlight and cast shadow), not shadow puppetry (no single screen, no rods) and not a 3D diorama (every element is a flat sheet parallel to the box front). For flat cut paper on a desk use `paper-collage`; for a single red cut sheet use `papercut-red`.

## 2. Grammar

**Colour.** One ladder per shot, back light and translucent to front dark and opaque; never break it (a pale front sheet flattens the box). One temperature per stack, and changing the ladder is how the film says "another place". The light is warm (amber to gold) and is the only saturated element besides one accent: a seal red (`#C0262A`) for the stamp and the lantern tassel. Ladders in the module (`AESLantern.LADDERS`):

| Ladder | Back to front | Light |
|---|---|---|
| night village | `#0A1330` sky, `#6A86C2` far, `#3F5A92` mid, `#2B3C6E` houses, `#111A3B` water, `#060A1C` front | moon `#FFF1C8`, windows `#FFB862` |
| warm interior | `#E9BC80` wall, `#B86E48` drapes, `#5E2A1A` desk, `#170A05` frame | lantern `#FF9A3C`, screen `#FFE2AE` |
| violet street | `#1A1030` sky, `#7A6AA8` far, `#4A3A78` facade, `#0E081C` street | windows `#FFB862` |
| dusk desert | `#E8B884` sky, `#BC7450` far dunes, `#6A3020` mid, `#3A180E` near, `#170A05` front | fires `#FFD080` |

**Type.** Text in the picture is paper: titles are gold card letters (`#E2B970`, Cormorant Garamond SemiBold and SemiBold Italic) with the same rim and shadow as any sheet, revealed from their anchor edge by a wipe (glyphs are never squashed); a typed line is a cream strip (`#EFE3C8`) that grows from its left edge as each word is spoken, the words cut through it (the night shows in the letters, `#16224A`). Subtitles are a quiet burned-in line under the story (Cormorant Garamond Medium 52 px, warm off-white `#F3E6CF`, soft shadow), and only where the words are not already paper in the picture: never show the same words twice.

**Motion.** Everything moves like paper on a stick: sheets slide in x or y, rotate about a pivot, are revealed from one edge, or light up. No squash and stretch, no morphing, no bending. Jointed figures are a body sheet plus limb sheets anchored at the joint, animated by rotation only. Light cues are the big motion: the source, then each sheet back to front in a stagger, then the windows one by one, then a flicker (`1 + .06 sin(7.3t) sin(3.1t)` on every Glow). Hard action lands on spoken words (a seal slams, a strip grows, a screen switches on). Render on ones; a hand-held micro-drift keeps a locked frame alive.

## 3. Camera grammar

The lens is small and the box is shallow, so moves are short. Each shot comp has a CAM null; every sheet follows it by its depth factor (0 = the back of the box, 1 = the front): CAM position is a lateral or vertical travel (parallax for free), CAM scale above 100 is a dolly in (front sheets grow faster than back ones).

| Move | CAM keys | Serves |
|---|---|---|
| Slow dolly in | scale 100 to 104 to 108 over the shot | being drawn into a place, a detail that matters |
| Slow dolly out | scale down to 100 | context, the whole place at once |
| Tilt up the stack | position y from +260 to 0 | climbing into the sky, hope |
| Lateral travel with depth parallax | position x across the shot, linear | a journey, time passing, a process in stages |
| Locked frame, only light changing | none (drift only) | waiting, a vigil, the lamp turning on |
| Pull out of the box | the shot layer scales to 80 inside a wooden frame (main comp) | the frame as an object, an ending |
| Near-plane curtain | two dark halves meet exactly at their front edges, then part | chapter changes, a secret revealed |

Framing: the story layer in focus, the front sheet softly blurred; box edges fully out of frame inside, clearly in frame outside, never half. Transitions: dissolves, light off then on, a near-plane curtain, a match (the round window becomes the next shot's moon). No whip pans, no digital zooms.

## 4. Native moves

- **The lamp turns on.** Source first, then each sheet back to front about 0.07 s apart, then the windows one by one (`village(S, { on })`).
- **The lights go out one by one.** The reverse, front to back, the last window last and the moon after it (`village(S, { off })`).
- **Paper that writes itself.** A cream strip grows from its edge on each spoken word, the words cut through it.
- **Depth as distance.** A lateral travel moves each sheet at its depth's speed.
- **Silhouette in a window.** A jointed figure in front of a lit screen; the arm reaches on its word and the screen switches on.
- **A window that becomes a light.** The real frame in a round paper window rises and turns into the next shot's moon.
- **The box as keepsake.** The camera pulls out of the box: a wooden frame with a black lining in a dark room lit by the lamp's spill.

## 5. Sound palette

Instruments that sit like light behind paper: felt piano, music box, celesta, harp or plucked zither, bamboo flute, soft strings; no drum kit, percussion only as single soft strokes (woodblock, small gong). Foley is paper and light: a switch click with a rising shimmer when a lamp turns on, paper rustle and slide when a sheet moves, a card-stock tap when a seal slams, a soft whoosh for the curtain, chimes on reveals. Silence when the lamp goes off, then room tone returns with the light. Voice warm and close, a storyteller at a table; music ducked 5 to 6 dB under speech.

## 6. AE recipe

One shot comp per box (`<P>_SHOT_<NAME>`, scene size and full length, layers timed in main-comp time so nothing is remapped), each with its own `<P>_CAM` null (disabled, a sine micro-drift expression on its position). The main comp holds the shots in order, each later one above the earlier, plus the transitions and the paper and lens layers.

**A sheet** (`AESLantern.sheet`) is one shape layer, anchor and position `[0, 0]`, drawn in comp coordinates and running past the frame edges, with effects in this order:

1. `ADBE Ramp`, radial, start at the shot's light point in the lit colour, end at radius r in the sheet's colour (the backlight through the paper). Front sheets skip it.
2. `ADBE Tint` (only when the lamp switches): Map Black To black, Map White To the sheet colour at 55%; Amount to Tint keyed 100 (off) to 0 (lit) over 0.2 s.
3. `ADBE Bevel Alpha`: Edge Thickness 2.4, Light Angle -90, Light Color `#FFE0B0`, Intensity 0.55 (the warm top rim and the dark bottom band).
4. `ADBE Drop Shadow`: colour `#05060F`, opacity 62%, Direction 180, Distance 8 to 26 (larger nearer the lens), Softness 2.6 x Distance + 6.
5. `ADBE Gaussian Blur 2` on the front sheet only (4 to 6, Repeat Edge Pixels off): depth of field.

Position and Scale carry the rig expression: `k = 1 + (CAM.scale / 100 - 1) * p`, position `C + (value - C) * k + (CAM.position - C) * p`, scale `value * k`, with C the comp centre and p the sheet's depth. Fold lines (the cut contours inside each mountain) are a separate stroked layer at the same depth, 50% opacity.

**A light** (`AESLantern.light`) is an emissive shape layer with `ADBE Glo2` (Color Channels, threshold 20%, radius 10 to 70, intensity 0.8 to 1.5) and the flicker expression on Glow Intensity; it switches by opacity. **A moon** is a disk with two Glows (radius 0.7 r and 0.18 r) over a halo solid nine radii wide with a radial Ramp that reaches black at 4.2 r, in Add (the ramp reaches black well inside the solid, so no square edge shows).

**Real footage** sits at the back of the box (depth 0.15) behind three stacked frame sheets with arched holes (even-odd fill; the front hole is widest, each sheet behind steps in), tinted 42% towards a warm duotone (`#120A20` to `#FFEBC6`).

**Main comp, top to bottom:** captions; vignette (black solid, inverted elliptical mask, feather 420, 55%); fibre grain (Fractal Noise stretched 70 x 14 on a solid 2.2 times the frame, scaled down, Overlay 14%); pulp mottle (Fractal Noise scale 260, Soft Light 34%); the light-off black; the curtain halves; the box frame (wood `#3A2414` with a 14 px black lining, scale linked to the end shot); the shots; the room (a warm radial spill on near-black) under the end shot.

**Gotchas found while proving it**

- A light switched by opacity keys cannot take a later `opacity.setValue()` (AE refuses setValue on a keyed property and the build stops). `light()` takes the resting opacity as `o.op` and scales its on and off keys to it.
- `words()` placed by its left edge (`o.left`) still called `setValue([o.x, o.y])` first, with `o.x` undefined: one or the other, never both.
- A cloud placed above the moon collided with the end title (gold card over cream cloud reads as mush). Keep the sky above the moon clear for paper words; clouds sit beside or below the light.
- Fires drawn in pale gold with Glow 1.3 clipped to white triangles. Emissive pieces that are not the main source take the lantern orange and Glow intensity 0.6 or less; only the moon or the main lamp may clip.
- The bridge can drop mid-build (network) and `prove.mjs` then reports an empty response with no result file: nothing is wrong with the module, rerun. If it says AE is not connected, the Higgsfield panel needs Connect pressed (Joe).
- Measured: 123 layers across eight comps, build about 8 s, render about 85 s with aerender.

**Close, not identical:** Lemo renders real lit planes in WebGL (a backlight shader with pulp translucency, true cast shadows from a top spot, depth of field and bloom). Here the backlight is a radial Ramp per sheet, the cast shadow is a Drop Shadow straight down, depth of field is a blur on the front sheet, and pulp is one Soft Light Fractal Noise over the whole frame rather than per sheet. The camera is a 2.5D parallax rig, not an AE 3D camera. Subtitles hold for their beat (about 1.4 s), shorter than Lemo's 1.8 s minimum, because the scene's beats are short.

## 7. Dependencies

- After Effects 2023 or later.
- Fonts (OFL, bundled in `assets/fonts/`): Cormorant Garamond SemiBold, Medium and SemiBold Italic (the variable files carry all three named styles). `AESLantern.fontOK()` checks.
- Effects, all stock: `ADBE Ramp`, `ADBE Tint`, `ADBE Bevel Alpha`, `ADBE Drop Shadow`, `ADBE Glo2`, `ADBE Gaussian Blur 2`, `ADBE Fractal Noise`, `ADBE Linear Wipe`.
- No tools and no generated pieces: every sheet is drawn in AE. The real frame comes from the scene's clip.

## 8. Pitfalls of the medium

- A pale front sheet flattens the box: keep the ladder dark at the front.
- A transparent radial glow on a small solid shows its square edge in Add: make the solid much larger than the ramp radius, and ramp to pure black.
- Near-plane curtain halves must meet exactly at their front edges, or a slit of the old shot shows.
- A sheet narrower than the travel shows its edge during a lateral move: draw sheets past the frame by at least the CAM offset times the depth.
- Too many lights flatten the stack: one source per box, windows as the only other emissive.

## Reference

Lemo-Opuscar `styles/paper-lantern` ("Paper-cut Lightbox", MIT, LemoLab), cloned at `~/Assets/lemo-opuscar/styles/paper-lantern`. Grammar from commercial paper-cut shadow-box lamps, Lotte Reiniger's silhouette films for the jointed figure, and Chinese paper-cut motifs (auspicious clouds, stepped gables, mountains).

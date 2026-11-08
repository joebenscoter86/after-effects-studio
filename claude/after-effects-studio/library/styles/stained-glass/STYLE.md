# Stained glass

> A leaded glass window seen from inside a dark stone hall, alive only where the sun touches it: light is the clock, the camera and the story.

Adapted for native After Effects from Lemo-Opuscar's *Stained Glass* style (MIT, LemoLab; see `library/styles/LICENSE-lemo-opuscar.txt`). Grammar only, after 12th and 13th century Chartres glass (colour logic, grisaille, leading), the window prologue of *Beauty and the Beast* (1991, pane by pane) and the glass knight of *Young Sherlock Holmes* (1985, glass that cracks and recombines): never their figures, compositions or music. Secular: no crosses, saints, halos or other religious imagery.

## 1. What it is, and what it is not

Every picture is a window: cut pieces of coloured glass held in dark lead cames, faces and folds painted in brown grisaille, set in a stone wall. Three rules hold everywhere:

1. Glass has no light of its own. Unlit it is dark and milky (the figures ghostly but readable); lit from behind it glows, and throws a soft coloured copy of itself onto the floor.
2. Things appear by being lit, never by fading in. A piece is there from the start; the sun (a band, a pool, a turning wheel) wakes it.
3. Glass is rigid. Pieces step (8 fps), slide along the leads, crack and are re-leaded; they never bend or morph.

Not vector art with black outlines (every piece is textured glass in a lead, and the lead network is one plane), not a kaleidoscope or Voronoi filter (pieces are hand-cut: lozenge quarries, medallions, borders), not Tiffany Art Nouveau, not mosaic (mosaic reflects, glass transmits).

## 2. Grammar

- **Colour**: two hues carry the picture, cobalt `#2047B0` (the ground) and ruby `#B01E2E` (borders, medallion rings, the hot piece); gold `#E0AA2A`, green `#2F7F3C` and murrey `#74264F` only as small touches; greenish white `#C7D1B8` sparingly (scrolls, the page, the screen). Flesh darker than you think (`#B38061`), or backlit faces burn white. Lead `#121010`; grisaille `#4A2C1A` (`#331C0F` for painted text). Stone and lead take colour only from spilled or projected light.
- **The sun's colour is the clock**: blue-white at dawn (the title), white at noon, gold in the afternoon, deep orange at dusk (the end). It is one keyed Fill on the lit glass, the shafts and the tablet band.
- **Pieces**: every piece is a filled shape whose stroke is its lead (8 to 10 px for big pieces, 5 px for small); one colour is one piece. Grisaille is thin translucent brown strokes on a piece: trace lines (eyes, brows into the nose, mouth, folds) and pattern. Expression lives in brows and mouth.
- **The window**: an equilateral pointed lancet with a ruby border of white pearls (a dashed stroke with dash 0 and round caps) and a white fillet; a cobalt ground cut into tall lozenge quarries, a few a shade lighter or darker; a roundel in the arch; a ruby-ringed medallion in the middle that holds each beat's scene. Iron saddle bars cross above and below the medallion.
- **The rose**: twelve petals alternating ruby and cobalt, a gold outer ring, a white centre: a dial. Petals light in turn like hours.
- **Type**: titles are incised Roman capitals in the stone (Cinzel Bold, wide tracking): a light lower lip, the dark cut, and gilding that appears only behind a band of light crossing the tablet; a second line in IM FELL English Italic. Inside the glass, text exists only as grisaille on white glass (IM FELL English). Subtitles ride a parchment banderole near the bottom (IM FELL English Italic 46 px, dark ink): it unfurls from the centre in 0.3 s and the line inks in once it is three quarters open; it rolls up again at the end.
- **Motion**: figures, the count and the shards step at 8 fps (`posterizeTime(8)` or hold keys an eighth of a second apart); light, camera, shafts and dust move on ones.

## 3. Camera grammar

The ROOM is one large comp (1800 x 3700); the camera is its layer's anchor point (what we look at) and scale (how close).

| Move | Expresses | In AE |
|---|---|---|
| Push on the carved tablet | the rule, set in stone | anchor on the tablet, scale 106 to 112 |
| Tilt up to the lancet as it wakes | the picture leaves the stone and becomes light | anchor eases up the wall, scale 118 |
| Locked close-up on the medallion | this pane is now | anchor on the medallion, scale 138 to 146, slow drift |
| Tilt up to the rose | something above the panels governs them: a clock, a count | anchor on the rose, scale 182 to 190 |
| Hold through a crack, no cut | the event is the medium breaking | a two-frame shake (position expression) and a white flash (Add) |
| Pull back to window, tablet and floor | the whole story at once; the end | scale 92 to 88 under dusk light |

Transitions are moving light, a tilt, a crack, or darkness. Never a dissolve, wipe or flip.

## 4. Native moves (pick what the story needs)

Light is time (a feathered band trucks across between beats; only the lit pane is alive) · pieces appear on their words (light pools) · the rose as a dial (a stepped Radial Wipe lights the petals as the count rises) · glass projects onto stone (the lit window corner-pinned, mirrored and blurred onto the flagstones) · a real frame cut into glass by the same rule (`tools/glass.mjs`) · glass cracks and lead mends (jagged cracks race from an impact, shards step out along the leads and back, each landing with a weld spark, cracks become leads) · incised titles gilded by a passing band of light · clouds cover the sun (every pane dims at once at the end).

## 5. Sound palette

Organ (pedal drone, soft stops), harp, hand chimes, tubular bells, recorder or a chant-like voice, water-glass notes, timpani; church modes, open fifths, drones. One note that means "the light" each time a pane wakes. Foley follows the material: struck glass (inharmonic partials about 1 : 2.32 : 4.25 : 6.63 : 9.38), the crack (snap, pane thump, a rain of tinkles), lead creak, glass sliding in a came, the solder hiss and tick, stone-hall air. Silence before the crack. Music ducks about 9 dB under the voice. Render audio outside AE and place it as a layer.

## 6. AE recipe (`stained-glass.jsx`, AESStainedGlass)

Seven comps. **GLASS** (640 x 1500, the lancet) holds the pieces; **LIGHT** (the same size, white = lit) says where the sun is; **LIT** is GLASS luma-matted by LIGHT, times the sun's colour. **ROSEGLASS**, **ROSELIGHT** and **ROSELIT** do the same for the rose (460 square). **ROOM** (1800 x 3700) is the hall. The main comp holds the ROOM as the camera, the crack flash, a vignette and the banderoles.

1. Pieces: `piece(comp, name, nodes, pos)` from nested nodes (`poly`, `line`, `rect`, `circle`, `ellipse`, `shape`, `group` with `pivot`), each with `fill` (glass colour), `sw` / `sc` (the lead; default lead colour) and optional `dash` (`[0, gap]` with round caps = pearls) and `so` (stroke opacity, for grisaille). `grisaille(pts, w)` is a brown stroke at 85%. `lancetPts(d, offset)` is the pointed arch inset by `d` (negative = outset, for embrasures).
2. The frame, `frameGlass()`: ruby lancet (lead 10), pearls on the 14 px inset, white fillet at 26, cobalt field at 36; the quarry lattice is two families of lead lines (slope 1.44, 70 px apart) alpha-matted by the field; a few quarry diamonds lighter or darker at 45% under the lattice; a sun roundel in the arch.
3. Each beat's scene sits in the medallion (`medallion(ground)`: ruby ring, pearls, a ground of sky, ruby or none), spanned to its beat.
4. Glass texture, `glassTexture()`: three solids with Preserve Transparency on top of GLASS: Fractal Noise stretched to 900 x 22 and rotated -24 degrees (streaks, Multiply 26%), clouds (scale 90, Overlay 34%), seeds (contrast 700, Screen 35%).
5. LIGHT: one white solid 1300 x 2600 with a 260 px feathered mask, rotated 10 degrees, its X keyed between off (-900), on (320) and gone (1560), with holds where it jumps; feathered elliptical pools whose opacity is held on at a word. The rose's light is a white solid with a Radial Wipe stepped at 8 fps plus a centre disc.
6. LIT, `litComp()`: LIGHT and GLASS nested, `GLASS.setTrackMatte(LIGHT, LUMA)`, then a white solid with Preserve Transparency in Multiply whose ADBE Fill colour is keyed to the sun.
7. The window in the room, `windowIn()`: GLASS with Exposure -2.7 and Hue/Saturation -45 (unlit), a lancet-shaped grey haze in Screen 9% (weathering, room-lit), LIT in Add with Exposure +0.35 and Glow (threshold 55, radius 36, intensity 0.7: bright glass eats into the lead).
8. ROOM, bottom to top: stone solid, Fractal Noise in Overlay 40%; ashlar mortar (two staggered rects, horizontal and vertical Repeaters, stroke only); perspective flagstones; embrasures, sill and tablet (lighter stone); spill (a radial Ramp in Add, opacity driven by the lit level); the lancet and the rose (step 7); iron saddle bars; the floor patch (LIT again with Corner Pin mapping the window's top to the near edge, Gaussian Blur 26, saturation -22, Add 85%); a shaft (a masked solid with a Ramp from black at the window to warm light below, Add, opacity driven by the lit level) and dust (Fractal Noise, contrast 600, evolving, in the same mask); the tablet band (a feathered ellipse in the sun's colour, Add 34%, keyed across the tablet); the incised text.
9. Incised text, `incised()`: three text layers per line, the lip (+3 px, light), the cut (dark) and the gild (gold, -1 px), the gild alpha-matted by a wide feathered solid whose right edge follows the tablet band (position expression), so the gilding stays where the light has passed.
10. Real footage: `tools/glass.mjs` smooths the frame (median 4, blur 2.5) and cuts it the way a glazier would, by what each part is rather than by colour distance: skin becomes one flesh pane (`#C4926E`) with a darker pane for beard, hair and shadow (`#7E4A33`), bright things white glass, clothes and the darkest hair deep murrey, foliage green, everything else the cobalt ground. A 7x7 majority pass rounds the cuts, pieces under 300 px join their neighbour, every boundary gets a lead (about 6 px), the big ground is cut into jittered lozenge quarries, each piece takes its own slight shade and darkens by its lead. The face is then painted back in dark brown grisaille on the skin panes only: trace lines where the unsmoothed frame is locally darker than its surroundings or has a strong edge (eyes, brows, nostrils, mouth, the beard line). It writes an mp4 at 8 fps or a still. In GLASS it sits in the medallion under a circular mask with Exposure -1.1 and saturation -18, time-remapped to hold its last frame.
11. The carry: the still cut into six shards (`shardPolys(impact, n, radius, seed)`: jagged cuts from an impact), each the still with a polygon mask, all alpha-matted by the medallion disc; cracks are the same cuts as lead lines in white, Trim End 0 to 100 in 0.25 s on the word, then held to the lead colour and widened once the shards are back; shards step 10 then 26 px out along their bisector, staggered a sixteenth of a second, and back two words later; weld sparks (four-point stars) flash at the ring. The main comp adds a two-frame shake and a white flash (Add 55% to 0 in 0.1 s).
12. Banderoles, `banderole()`: a parchment shape with a gentle sag, a rule and curled ends, scale X 4 to 100 from the centre; the text's opacity steps on at 0.2 s. Every text change goes through `AESLib.textKeys` / `AESLib.bakeText` in one call per layer.

**Gotchas found while building it**

- A medallion ring drawn as a filled ruby disc with the ground on top works only when there is a ground: over footage (the input and carry panes) the disc covered the face completely. Draw the ring as a thick stroke band (radius halfway between ring and ground, width the difference) with separate lead circles, and add the ground disc only when the scene has one.
- Lit glass blows out fast. LIT is added on top of the unlit window, so with Exposure +0.35 and Glow (threshold 55, intensity 0.7) cobalt went cyan and white glass went pure white, washing away grisaille text and the count. LIT at Exposure -0.35, Glow threshold 72 / intensity 0.45, white glass at `#C7D1B8` and a darker grisaille (`#331C0F`) keep jewel blue and legible painting.
- The Overlay cloud texture at 34% made the cobalt mottled and cyan; 16% reads as glass thickness.
- Cutting footage by nearest palette colour gave a posterised orange-and-black blob, not glass (found in review): three flesh tones and the blue-pushed shadows cut the face into many small regions crossed by leads, and the grisaille sat under them. Cut by role instead (skin, bright, dark, foliage, room), keep the face one flesh pane, and let the grisaille carry the features: that is how a glazier leads a face, and it stays recognisable.
- Flesh burns yellow under a gold sun: the footage layers take Exposure -1.1 and saturation -18 inside GLASS (LIT is added on top of the unlit pane, so a pane that looks right flat doubles when lit) (Lemo: flesh darker than you think).
- Dust spread over the whole shaft landed as white specks on the gilded end title; the dust mask stops at the sill.
- A saddle bar through the rose's centre crossed the count; the rose has no bar.
- The light lower lip of the incised text at +3 px and a light grey read as a blur at a pulled-back framing; +2 px and a darker grey read as a cut edge.

## 7. Dependencies

- After Effects 2023 or later (`Layer.setTrackMatte`, several layers sharing one matte).
- Fonts (free (OFL) from Google Fonts, not included): Cinzel Bold (the variable font's named instance), IM FELL English Regular and Italic.
- Node 20+ and ffmpeg for `tools/glass.mjs`. No generated pieces.

## 8. Pitfalls of the medium

- Hidden leads must not show through front pieces: draw each scene's pieces on top of the ground, and keep the quarry lattice matted to the field.
- Flat fills read as clip-art: every piece needs the texture, grisaille and its lead; a figure without grisaille is a sticker.
- A sharp floor patch looks like a decal: blur it, desaturate it, let it sit on the stone in Add.
- Shafts at full strength at the window wash out the pane: they start black at the glass.
- Incised text in a dark wide shot is unreadable: push in and park a light on it.
- Close rather than exact: the light is a feathered band and pools, not Lemo's per-pixel backlight and hue-preserving tone mapping; the glass texture is three noise layers, not per-piece streak angles and thickness; the floor patch is one corner pin, not a stone-modulated projection map; the re-leading is a step out and back along fixed cracks, not piece groups sliding into a new picture; the score and foley are not built.

## Reference

Lemo-Opuscar `styles/stained-glass/` (STYLE.md, DEMO.md, `demo/` WebGL compositor, glass and window builders; poster.jpg). The proof is `proof/compare.jpg` (Lemo's poster above our seven beats) and `proof/proof.mp4`.

# Silkscreen poster

> A screen-print travel poster printed on camera: opaque flat inks pulled one colour at a time, stepped colour bands instead of gradients, thin paper slivers where the registration slips, and the facts printed last in a dark info band.

A print-tier style for After Effects, adapted from Lemo-Opuscar's `silkscreen-poster` (MIT). Everything is native: shape layers for every ink, alpha track mattes for the pulls, stock effects for the ink body. The one real frame is separated into three flat inks by `tools/separate.mjs` (Node and ffmpeg). No generated pieces.

## 1. What it is, and what it is not

A poster being printed. Every colour is one opaque ink on its own layer; a later ink covers an earlier one completely. A squeegee drags each ink across the sheet in a straight, steady pull, and the ink appears behind its ragged front. The poster follows a fixed template: a cream paper border, an art area with a stepped-band sky, value-stepped planes (far light, near dark), one bright accent (a sun, a number, a product), and a dark info band at the foot holding a name, a number, a rule and a row of stats. Several posters make a series: one template, a new palette per poster.

What makes it read as silkscreen rather than flat vector art: registration offsets of 1 to 3 units per ink, a hard dark overprint ghost under each ink, an ink-thickness rim (light top-left, dark bottom-right) with a wet sheen that dries in under a second, paper rings knocked out of the sky around the sun, and a mottled, pinholed paper over everything.

It is not risograph (no translucent fluorescent overprint, no halftone grain), not woodcut or ukiyo-e (no carved key line), not a gradient illustration (gradients are forbidden: a sky is solid, thinning stripes, then the next ink). There is no fade anywhere.

## 2. Grammar

- **Type.** Big Shoulders Display (Black for heroes and the big value, ExtraBold for names and stat values), condensed and auto-fit to its column; Outfit SemiBold for letter-spaced labels. Headers are printed into the sky, tracked wide. The info band prints last.
- **Colour.** At most six inks per poster, by role: `sky1` (light sky), `sky2` (bands, lit facets), `far`, `mid`, `near` (darkest, also the info band) and one rare `accent` (the sun, the number, the rule). Values step from far (light) to near (dark); depth is value, never blur. Paper is a colour: unprinted sheet is the brightest thing on it. Text inks are chosen by contrast against the ink under them. The module carries five palettes: `dawn`, `noon`, `ember` (for a photo: peach, rust, deep teal), `dusk`, `night`.
- **Motion.** Pulls are linear and steady (a squeegee does not ease). One ink, one beat: each pull lands on a spoken word. Info items print left to right on subdivisions of the beat, each by a short pull of its own. Loose layers drift by depth and snap into register on one hold key. A palette re-ink is a wide squeegee travelling diagonally; behind its blade the same geometry is in the new palette.

## 3. Camera grammar

A vocabulary, used sparingly:

| Move | Expresses | In the proof |
|---|---|---|
| Locked full sheet with a slow push (2 to 4 %) | layers stacking into a picture | every poster |
| Truck through a foreground silhouette (a mass of pines) | passing to the next poster | each poster change, full cover for about two frames on the switch |
| Diagonal re-ink squeegee (blade at -12 degrees, 0.32 s) | the same thing becoming the next | the carry |
| Log pull-back from the last poster to the wall | the series, the poster in the world | the end |

Close-ups keep the sheet's edge in frame. No dissolves, no bare cuts.

## 4. Native moves

- **One ink, one beat** (`pull`): a ragged-front alpha matte shared by every layer of the pull, its front keyed linearly; the squeegee (`squeegee`) rides it, parented to the poster layer so pushes carry it.
- **Split fountain**: one pull with several inks; the bead shows a segment per ink.
- **Stepped bands** (`stripes`): the gradient substitute.
- **The info band** (`band`): name, number, rule, three stats; items print left to right.
- **Registration slip, then snap**: planes offset and turned a little, drifting by depth with a thicker paper shadow, snapping to register on one hold key before the key facts (the number poster).
- **A real frame in three inks** (`tools/separate.mjs`): one RGBA separation per ink, stacked lightest first, recoloured in AE with Fill so the same separations re-ink in any palette.
- **Palette re-ink**: a second comp of the same geometry in a new palette, revealed behind a diagonal blade.
- **The series wall**: every poster hung on the wood wall under a banner, as the final lockup.

## 5. Sound palette

Not built into the module. Lemo's palette fits: acoustic, hand-played instruments (strummed guitar, upright bass, brushes); one pull, one hit; a registration snap on a loud downbeat; foley by material (squeegee on mesh, a screen clack, paper stamps). Music ducks a few dB under foley. Place audio outside the module.

## 6. AE recipe

`silk.jsx` (`AESSilk`), loaded after `AESLib`:

1. **Posters are precomps** (1000 x 1500, the scene's length and frame rate), one per beat; layers are timed in main-comp time, so a poster is fully printed whenever it is shown later (the wall reuses them).
2. **Inside a poster, bottom to top:** the paper solid; then one shape layer per ink in print order (`inkPiece`), each with `ink()`: Drop Shadow (black, 30 %, 135 degrees, 2 px, softness 1) for the overprint ghost, then Bevel Alpha (edge 1.6, light angle -45, intensity keyed 0.75 to 0.32 over 0.9 s after the pull for the wet sheen). Text items are `AESLib.text` layers anchored on their own ink.
3. **Each pull** is one disabled shape layer with a ragged bottom edge (`front`), position keyed linearly from v0 to v1; every layer of the pull takes it with `setTrackMatte(M, TrackMatteType.ALPHA)`. Each pulled layer is first shifted 1 to 3 units (registration).
4. **The real frame**: `node tools/separate.mjs --in input.png --out sepN.png --level N` for N = 0, 1, 2 (cuts 215, 135, 70 on a softened grey frame); each is imported, recoloured with Fill and pulled on its word.
5. **Main comp, bottom to top:** the WALL null (anchor and position at the last poster's place on the wall), the wood (planks, then a Fractal Noise grain layer in Overlay at 22 %), the poster layers at 104 % with a soft hang shadow and their squeegees (parented to the poster), the wall copies, the re-ink matte and blade, the pine trucks (motion blur on), then paper mottle (Overlay 14 %), fibres (Soft Light 9 %), pinholes (Screen 40 %) and grain (Noise 4 %).
6. **Camera:** WALL holds the last poster full-frame (scale 104 / 44) until the end beat, then eases to 100 %, revealing the series.

**Gotchas found while proving it**

- Bevel Alpha's handle must be taken from the `addProperty` result, not by index: on a footage layer the Fill effect comes first and index 2 is the Drop Shadow.
- A reused poster precomp must not get its squeegees again (they are separate layers and would replay at the original times).
- No keys before time 0: the first pull's squeegee starts its pre-roll where it would be at 0.
- A layer's Position is ThreeD_SPATIAL even in a 2D comp: zero the spatial tangents with three values, or collinear keys bow.
- Fractal Noise replaces a layer's pixels: wood grain is its own layer in Overlay, not an effect on the planks.
- The pine truck first held full cover for about 0.2 s (every frame near a switch was a dark blank): its tiers reached 1000 px either side of centre. Keep the mass only a little wider than the frame (core 1120, tier tips about 1300), cross 2600 px in 0.4 s, and draw it in the outgoing poster's own `near` ink. Cover then lasts about two frames.
- The re-ink matte is a 6000-deep rect: park it at the end of its sweep. Pushing it further on slides its far edge back across the sheet and cuts the poster diagonally on the wall.
- Parent the wall copies and the wood to the WALL null before keying it (parenting compensates for the parent's transform), and give pins their in point at the end beat, not at the re-ink.

## 7. Dependencies

- Fonts (OFL, bundled in `assets/fonts`): Big Shoulders Display (variable; the Black and ExtraBold instances), Outfit (variable; SemiBold). Copy them to `~/Library/Fonts`.
- Effects: Drop Shadow, Bevel Alpha, Fill, Fractal Noise, Noise. Track mattes need After Effects 2023 or later (`setTrackMatte`).
- Tools: Node 20+ and ffmpeg for `tools/separate.mjs`.
- No generated pieces.

## 8. Pitfalls of the medium

- A stroke on a unioned path draws internal lines: fills only.
- Cool shadow facets next to water read as water: shadows in the near ink.
- A silhouette wipe that holds full cover reads as a dark blank: centre the truck on the switch so cover lasts about two frames.
- Accent everywhere stops being an accent: the sun, the number, the rule, nothing else.
- Too many stats at honest reading times overrun a short beat: print them in one pull side by side, or let them be read on the final wall.
- Random coloured dots read as confetti: paper pinholes stay paper-coloured and sparse.

## Reference

- Lemo-Opuscar `styles/silkscreen-poster` (MIT, LemoLab): `STYLE.md`, `poster.jpg`, the demo engine `demo/engine/silk.js` (read for technique only, never copied).
- Shared scene: the library's seven-beat test scene (not shipped).

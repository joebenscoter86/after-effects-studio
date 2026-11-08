# Silent film

> A 1920s one-reel picture as it looks projected: an inked, hatched grey drawing on a flickering silver print in a gate between velvet drapes, intertitles instead of voices, and a pianist in the pit.

Adapted for native After Effects from Lemo-Opuscar's *1920s Silent Film* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only, after Keaton's locked-off wide shots, Lloyd's near-miss, Melies's iris and trick cut, and the photoplay cue sheet: never the Tramp look (bowler, toothbrush moustache, cane), never a real film's gags, shots or title cards, never a published melody.

## 1. What it is, and what it is not

A film seen in a picture house. The print sits in a rounded gate; around it are the house's black masking, velvet drapes lit by the screen's spill, a scalloped valance with a brass cord, a stage lip with footlights, a pianist in the pit and a row of heads. Inside the gate everything is an ink drawing in grey values with a thin ink line, cross-hatched in its darks, printed on silver stock that flickers, weaves, scratches and burns. Nobody speaks on screen: the words are intertitle cards, a few words each. Things are told by action in wide shots; irises open and close on what matters.

Not a noir (no hard shadow as mood, no voice-over look), not a sepia photo filter on modern animation (the picture itself is drawn and hatched), not a Chaplin pastiche, not a generic "old film" overlay on footage (footage is redrawn into the same ink first).

## 2. Grammar

- **Values carry everything.** The drawing is grey only, in print densities: ink 0.07, dark cloth 0.15 to 0.3, mid wood 0.45 to 0.6, skin 0.8, linen 0.9 to 0.95. Dark clothes against pale walls, pale faces against dark interiors. Every shape has a 2 to 3 px ink line (0.07).
- **Hatching is one global pass**, not drawn per object: 45 degree hatch wherever the drawing is darker than about 0.46, crossed at 135 degrees below about 0.29. Real footage goes through the same pass, so footage and drawing share one hand. The hatch and the line boil on twos (12 fps), as if redrawn by hand.
- **The print.** Silver with a little sepia (print black `#130F0C`, print white `#F2EBD9`), a touch of contrast, halation on highlights, flicker every output frame, uneven density, gate weave with an occasional perforation jump, two-octave grain, broken vertical scratches (light = scraped emulsion, dark = dirt on the negative), dust and a hair in the gate, brown burn creeping from the edges, a vignette, and a rounded aperture with a soft dark rim. Tint and damage are mood controls: colder and more damaged when things go wrong, warmer and cleaner when the film turns tender.
- **Hand-cranked.** The picture is sampled at 16 fps (Posterize Time on the print); the damage, flicker and grain change every output frame. That mix is what reads as projected rather than merely low frame rate.
- **Intertitles are the subtitles.** A black painted card (0.075) with a deco border that follows the emotion: a double rule, stepped corners and fans for narration; one heavy rule for a shout (and the words shake); a thin rule with curls and dots for tenderness. Playfair Display SC (Bold, Regular) for titles, numbers and shouts, wide tracking; Old Standard TT Italic for narration and dialogue, dialogue between curly quotes. Few words per card, three to five cards in a short film, and a card never explains what the picture shows.
- **Figures.** Realistic proportions (about 7.5 heads), deadpan, front-on, silent-era make-up (pale skin, dark lids and lips); identity by silhouette marks (here a flat cap and a dark waistcoat). The face barely changes; the body and the eyes act. Objects act too: a wobble before rest, a ritardando.
- **One colour, at most.** Monochrome inside the gate; the only colour in the frame is the house (velvet, brass, footlights), which is outside the print.

## 3. Camera grammar

| Move | Expresses | In AE |
|---|---|---|
| Locked-off wide | the premise in one frame; cause and effect seen whole | a set built once in DRAW, no camera keys; only figures and objects move |
| Iris in / out | attention on one thing; the start or end of a thought | `iris()`: a black shape layer, a huge rect plus an ellipse with an even-odd fill, the ellipse size keyed (eased) |
| Half-open iris, held | a look shared with the audience | an iris mask on the footage layer held at a radius, then opened |
| Substitution cut | trickery (Melies) | an object's layer starts on the beat, no transition, then rocks to rest |
| Iris travelling into a shape | one thing becomes the next | the mask radius and the layer position keyed together until the circle sits exactly where the next card's medallion is, then a hard cut |
| Curtain | the start or end of the show | drapes scaled in X from their outer edges (the velvet folds bunch as they gather) |

Most shots are locked. Transitions are iris, hard cut, fade to black and the curtain. No dissolves inside a scene, no whip pans, no close-ups of rigged faces (keep a face small or inside an iris).

## 4. Native moves (pick what the story needs)

The intertitle twist (a card reframes the next shot in a few words) · the near-miss · the chain in one take · undercranked chaos (raise the crank rate and the damage together) · iris on the look · redrawn footage (real video through the ink pass) · the echo gesture (the end card repeats the title card's border) · the film breaks (the print burns through to the lamp's white).

## 5. Sound palette

The instrument is the sound design, as in a picture house: an upright piano (optionally reed organ or theatre organ) plays every event in the manner of a photoplay cue sheet (Hurry, Misterioso, Agitato, Tenderly, Maestoso), stride left hand, a theme that returns changed. Mickey-mousing: grace note for a wink, forearm cluster for a crash, rolled chord for a reveal, descending glissando for a fall, nervous trill for hesitation. No foley, no voice on screen. The projector is the ambience: lamp click, motor spin-up, claw-and-motor purr, film flapping on the take-up reel at the end. Silence is the music stopping with the projector left running. Original music only; tame the hammer transients with light compression, master about -14 LUFS. Render audio outside AE and place it as a layer.

## 6. AE recipe (`silent.jsx`, AESSilent)

Three comps. **DRAW** (gate size, 960 x 1320 in the proof) holds the picture: tonal shape layers, the redrawn footage, the cards and the irises, black underneath. **FILM** (gate size) holds DRAW twice over: the drawing itself (Turbulent Displace 2.2 / size 30, Evolution `posterizeTime(12); time * 720`, the line boil) and two hatch passes. The **main comp** holds the house, the FILM layer with the print pass, the damage layers (each gate-sized, so they stay inside the gate), the aperture, then the theatre in front.

1. Shapes: `piece(comp, name, nodes, pos)` from nested nodes (`poly`, `line`, `rect`, `circle`, `ellipse`, `group` with `pivot`), each with a grey `fill` and an ink stroke `sw` (stroke added before the fill, so it sits on top). Later nodes draw on top.
2. Hatch pass, `hatch(FILM, P, DRAW, level, dir)`: a second copy of DRAW with Threshold (Level 0.46 for the 45 degree pass, 0.29 for the crossed 135 degree pass; black in the darks, white elsewhere), then Venetian Blinds (completion 66 / 70, width 7 / 6, feather 0.6, direction 45 / 135) cutting it into stripes, set to Multiply at 92% / 85%: white stripes vanish, black stripes are the hatch. Its position jitters 1.5 px on twos.
3. Cards: `card(comp, P, kind, t0, t1, extraNodes)` lays a 0.075 solid and a border piece (`cardBorder(W, H, kind)`: narration, shout, tender) plus any ornament (`ornament(cx, y, half)`, a rule with a diamond). `words(comp, name, full, o)` makes a left-justified text layer anchored on the full string's ink box, so a line written on word by word (`build(str, onsets, t0)`, one `AESLib.textKeys` call) never jumps. A counter uses `AESLib.bakeText` at 16 fps with an anchor expression on `sourceRectAtTime`. A shout's words shake for 0.35 s by a per-frame position expression.
4. The figure: `figure(comp, name, { x0, x1, y, tw0, tw1, scale, look })`, feet at the origin, legs `LL` / `LR` and arms `AL` / `AR` (forearm `F`) as nested groups. One clock expression walks it while `tw0 < time < tw1` (legs plus or minus 9 degrees, arms 7, a 7 px bob at 1.8 Hz). The eyes are a group `EY` whose position is keyed with holds (look at the object, then snap back to camera: the deadpan take).
5. Irises: `iris()` for a drawn shot; for footage, an elliptical mask on the footage layer keyed through `ell()` shapes (feather 14 for a soft iris, 4 for a medallion edge).
6. Redrawn footage: `tools/redraw.mjs` crops the real clip, lifts the mids (gamma 1.45), posterises luminance into five soft wash steps and multiplies ink contours (edgedetect wires, eroded) over them, writing an mp4 at 16 fps. AE hatches its darks through the same pass as the drawing. A second instance with time remapping (linear, then a hold) carries the face into the end card's medallion.
7. Print pass on the FILM layer, in this order: Posterize Time 16, Tint (black to print black, white to print white), Brightness and Contrast (contrast 14), Glow (based on colour channels, threshold 78, radius 26, intensity 0.45). Position: `posterizeTime(16)` weave of about 1.5 px plus a 16 px perforation jump on 3.5% of frames.
8. Damage, gate-sized, above the print: DENSITY (Fractal Noise scale 900, Overlay 22%, Evolution random per frame), FLICKER (adjustment, Brightness random -9 to 6 per frame), GRAIN (adjustment, Noise 9, monochrome), SILVER (Fractal Noise scale 4, Overlay 14%, random per frame), four SCRATCH lines (each runs for a 1.3 s stretch with 55% odds, x jitters 3 px and length and offset change every frame), DUST (seven specks re-scattered every frame), a HAIR for a few seconds, BURN (brown, an inverted rounded-rect mask feathered 150, Multiply, offset and opacity flickering) and VIGNETTE (inverted ellipse feathered 380, 62%).
9. The aperture: a black shape layer, the frame rect plus the rounded gate (radius 34) with an even-odd fill, Gaussian Blur 26: the soft dark rim.
10. The house, `theatre(comp, P, gate)`: stage lip and footlights (Glow), a piano and a pianist whose head bobs on sixes, a row of heads, two drapes and a valance from `velvet()` (Fractal Noise stretched to vertical folds, 26 or 14 wide by 6000 high, then Tint to `#080102` / `#6B0D12`), a scalloped mask and a brass cord with tassels, the screen's spill (radial Ramp, Multiply, the gate masked out) and the footlights' warm glow from below (linear Ramp, Add 70%). The drapes part in the first 0.7 s by scale X from their outer edges.
11. The end: `burnThrough()` grows a char ring, a brown edge and the lamp's white (each roughened, 1500% over the last half second) from one point in the print.

**Gotchas found while proving it**

- Threshold's Level is on a 0 to 1 scale from scripting, not 0 to 255: `setValue(118)` clamps to "everything is dark" and hatches the whole frame evenly. Use 0.46 and 0.29.
- The first build used a luma track matte (a disabled DRAW copy with Threshold and Invert) and hatched every value; with the Level clamped, that matte was all white. The matte-free pass above (the threshold copy itself cut into stripes and multiplied) needs no matte layer at all, so it stayed.
- A new shape layer sits at the comp centre with its anchor at 0: any layer whose paths are drawn in comp coordinates (the iris, the aperture, the valance cord) needs `anchorPoint` and `position` set to `[0, 0]`, or it lands offset by half the comp (the aperture then blacks out half the frame).
- A linear Ramp keeps its start colour past its start point: the footlight glow (Add) browned the whole house below the stage until it was masked to the area above the stage lip, with the gate subtracted.
- Posterize Time on the FILM layer also posterizes that layer's own expressions, so per-frame flicker, grain and density live on separate gate-sized layers above it; only the weave is on the FILM layer (on 16, which is right for a projector).

## 7. Dependencies

- After Effects 2023 or later (`Layer.setTrackMatte` with a matte layer anywhere in the stack).
- Fonts (OFL, bundled in `assets/fonts/`): Playfair Display SC Bold and Regular, Old Standard TT Italic.
- Node 20+ and ffmpeg for `tools/redraw.mjs`. No generated pieces.

## 8. Pitfalls of the medium

- The period print is 4:3 landscape. In a 9:16 reel the gate here is a portrait print (960 x 1320) with the house above and below it; that is an adaptation, close rather than exact. For a 16:9 film use a 4:3 gate between the drapes, as the reference does.
- Too much content kills a silent film: one legible action per shot, with a pause in it, beats a busy chain at small figure scale.
- A card never explains what the picture already shows, and holds long enough to read (Lemo: max(1.8 s, reading time + 0.6 s)); the proof scene's beats are shorter than that by design.
- Pose pops: drive figures by eased keys and clock expressions, never by switching drawings.
- Closed drapes lit only by a dark screen go black: the footlights' glow keeps them readable.
- Hatching keys on values, so a mid grey drifting across the threshold (0.46 or 0.29) flickers its hatch on and off: keep fills away from the thresholds.
- Close rather than exact: the figure is a flat front-on puppet (two swinging legs and arms, eyes that look), not the reference's 2.5D rig solved in 3D; the score and projector sound are not built (render them outside AE).
- Heavy grain makes big files; re-encode with `-tune grain` at a higher CRF for delivery.

## Reference

Lemo-Opuscar `styles/silent-film/` (STYLE.md, DEMO.md, `demo/engine/` ink, redraw, film and cards passes; poster.jpg). The proof is `proof/compare.jpg` (Lemo's poster above our seven beats) and `proof/proof.mp4`.

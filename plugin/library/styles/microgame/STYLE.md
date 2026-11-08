# Microgame frenzy

> A rapid-fire party-game film: one shouted command word, a few seconds, one action, one result; every microgame drawn in a completely different medium, all held together by one loud toon game-show stage, and the whole film keeps getting faster.

Adapted for native After Effects from Lemo-Opuscar's *Microgame Frenzy* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only: its genre reference (party microgame collections) is a tradition, not a layout to copy. The host (a round-faced presenter in a top hat), the hero (a round helmet with a visor and an antenna ball), the stage and every game in this package are our own; never use another game's name, characters, UI, microgames or music.

## 1. What it is, and what it is not

A run of microgames. Each one is a command word (BUILD!, CATCH!, COUNT!, TYPE!), a rule grasped in under a second, one action and one result (an OK! stamp, or a funny failure). Each game is drawn in a different medium (crayon, pixel, Swiss type, amber terminal, and more) and the jolt of each switch is both the joke and the beat. One fixed home look holds the film together: a show stage with a TV, a host, a lives board and a stage badge, which the film returns to between games. Every few games the tempo, the game length, the stage dwell and the command hold all step up together.

The hero survives every medium by keeping its marks: a round head, a visor and an antenna with a ball in the hero colour (in the Swiss game it is reduced to the signal-red circle; in the terminal it is the block cursor with an antenna).

Not game-show flat (one art style, rounds of bars), not a style sampler (every game has stakes and the lives connect them), not a montage (each game has a rule you get in under a second).

## 2. Grammar

- **Home stage.** Flat toon, a thick near-black ink outline (7 px), flat fills and one hard shadow (the same shape in the shade colour, offset down-right). Fixed furniture: a gold TV whose screen is the frame-within-the-frame, a marquee of chasing bulbs with the show's sign, a stage badge (top left), a lives board of hero heads (top right), a host (lower left) and a big red trigger button on a podium (lower right), all on a rotating sunburst over a magenta round stage.
- **Home palette** (the stage only): violet ground `#2A0F5C` with burst wedges `#3A1680`, ink `#160A2E`, magenta `#FF2E88`, gold `#FFC928`, cyan `#1FD1D1`, plus a fixed success green `#2ED15A` and fail red `#FF3B3B` used only by stamps and the lives board. The hero colour `#FF4F3F` follows the hero into every medium that allows it.
- **Each medium brings its own palette and type** and is never tinted with the home palette:
  - crayon: paper `#F2ECDD`, wax red, blue, green, yellow, a dark-blue crayon line; Caveat for a scribbled caption;
  - pixel: night `#15103A`, a five-colour sprite palette; Silkscreen;
  - Swiss: off-white `#F2F0EB`, black, one signal red `#E3241B`; Inter Tight Bold on a six-column grid;
  - terminal: amber phosphor `#FFB000` on `#0B0703`; VT323.
- **The command word is the subtitle.** Titan One, white, a thick ink outline, a coloured hard drop, a burst behind it, skewed. It slams in over three frames (overshoot, settle), holds, then shrinks into a corner tag before the first action so the result is never covered. One-off banners (SPEED UP!, FLIP!) fly out instead, so tags never pile up.
- **Frame rate is part of the ladder.** Crayon pieces step at 8 fps, the pixel game at 12, the Swiss game at 15; the camera, the transitions and the timer spark run on ones.
- **The timer is visible**: a fuse with a knot per beat and a bomb at the end; the spark passes each knot on its beat and reaches the bomb on the result.

## 3. Camera grammar

| Move | Expresses | In AE |
|---|---|---|
| Locked frontal home frame | the constant; only the scoreboard changes | the world null at scale 100 |
| Push into the screen | a game starts | the world null (anchor on the screen centre) scales until the screen fills the frame (174 %), 0.25 s, shorter each round |
| Shrink back into the TV | return with the result stamped | the same key pair reversed, 0.3 s, the OK! stamp parented to the world so it rides back with the game |
| Hard switch inside the screen | the medium jolt | the next game comp starts on the cut, no fade |
| Tile flip | the past becomes the material of the present (a boss, a recap) | a grid of masked tiles of each earlier game's last frame, each flipping on X into a tile of the new picture |
| Snap back to wide on one beat | release | a fast eased key back to 100, then a slow drift |

Framing: the screen is a fixed share of the frame (620 of 1080 px). Inside a game keep the top-left corner clear for the command tag and the bottom edge clear for the fuse.

## 4. Native moves (pick what the story needs)

Style switch per game (each task in the medium that suits it) · command word as subtitle and downbeat · lives as UI (3, 2, 1 blinking) · SPEED UP! (everything steps up together) · failure becomes the solution (an earlier failure's material is the final answer) · the boss mixes the rules (the final game is built from pieces of earlier media) · instant replay (freeze, half speed, push-in, letterbox, a caption in the medium's type).

## 5. Sound palette

Music first: a tempo grid and a cue table before any animation, every picture hit on a listed cue. A constant groove (kit with ghost notes, slap bass, brass stabs) plus one colour instrument per medium (toy piano for crayon, square beeps for pixel, claves for Swiss, a teletype relay for the terminal). Foley follows the medium (wax squeaks, bit-crushed hops, a typewriter); the home stage gets a spring trigger click, card flips and sparse claps. A rising brass run into each speed-up. One real silence before the biggest hit. The host shouts each command a hair after the stab. Duck music about 11 dB and foley about 6 dB under voice; master about -14 LUFS. Render audio outside AE and place it as a layer.

## 6. AE recipe (`microgame.jsx`, AESMicrogame)

1. **Games are comps.** Each microgame is its own 1080 by 1920 comp (`<P>_G1_CRAYON`, `_G2_PIXEL`, `_G3_SWISS`, `_G4_TERMINAL`, `_G5_BOSS`, plus `_G0_READY` for the attract screen), nested in the main comp at 57.4 % on the TV's screen, so a game is clipped to the screen for free and is full frame when the camera pushes in. Each nested layer is trimmed to its game's slot.
2. **World.** One null (`_WORLD`, anchor and position on the screen centre) that every stage layer, every nested game and every OK! stamp is parented to, while it has no keys; the camera is its scale, keyed last (100 wide, 174.19 in).
3. **Toon shapes.** `shp()` builds one shape layer from rects, ellipses, paths and stars; `toon()` adds the ink outline and the hard shadow to every filled item. `keys(prop, [{ t, v, e }])` sets all keys in one call with an ease per key (`lin`, `hold`, `settle`, `travel`, `snap`, `out`).
4. **Command word.** A null with the text (Titan One, ink stroke, Transform skew, a hard Drop Shadow in a colour) and a burst star behind it, both parented; the null's scale slams 330, 86, 108, 100 over 0.18 s, holds, then scale and position travel into the corner tag (34 %). Rotate the null only after its children are parented.
5. **Crayon.** Each drawing is two shape layers, wax and line. Wax is hatched with Venetian Blinds (completion about 50, 9 px, direction 32 to 50 degrees); both boil with Turbulent Displace whose Evolution is `posterizeTime(8)` and get a paper-tooth edge with Roughen Edges. A Fractal Noise solid multiplied at 14 % is the paper.
6. **Pixel.** Sprites are shape layers of runs, one group per colour, from rows of characters; the hero has stand, two run frames and a catch pose shown with hold keys. The real frame is pixelated with Mosaic (Sharp Colors) and Posterize, both hold-keyed back to full resolution once it is caught. Positions snap to the 18 px grid in an expression on 12 fps.
7. **Swiss.** A counter typed per frame with `AESLib.bakeText` (an ease-out count), a label typed on, a signal-red circle with separated X and Y keys that slides along a rule and hops down to be the full stop.
8. **Terminal.** The line is wrapped to rows and typed one character per key, each word's letters spread over its spoken time, in one `AESLib.textKeys` call; the block cursor (the hero) steps with hold keys; Glow on an adjustment layer, Venetian Blinds scanlines, CC Vignette.
9. **Boss.** Fifteen tiles: each is an earlier game comp with Time Remapping frozen on its last good frame and a rectangular mask, flipping (scale X 100 to 0) into a masked tile of the real frame (0 to 100) in a diagonal wave; an ink grid over the seams until the picture is whole.
10. **HUD.** The fuse (Trim Paths start on the rope, knots hidden with hold keys on group opacity, a glowing spark star), the command words and the banners are not parented, so they stay the same size while the camera moves.

**Gotchas found while proving it**

- Parenting compensates for the parent's transform at the current time: a layer drawn around its own origin and then parented to a null that is already keyed somewhere else lands far away. `attach()` parents and then resets the position to the parent's origin; a null is rotated only after its children are parented.
- With Separate Dimensions on, `layer.property("ADBE Position_0")` returns null on a shape layer (the matchname lives under the Transform group); use `layer.transform.xPosition` and `yPosition`. `keys()` throws with the values and times when it is handed a missing property, which names the culprit in one render instead of a bare "null is not an object".
- Freezing a nested game with Time Remapping: removing every key hides the property and `setValue` then fails. Set the value of the two keys AE adds when remapping is enabled instead.
- `keys()` keeps one key per 1/60 s, so a "hold until the landing" key 0.01 s before a squash key is swallowed and the squash shows from the start. Put the hold key at least two frames earlier.
- A title banner over the TV hides whatever the attract screen draws in the screen's middle; keep the attract screen's READY? and hero above the banner's band.
- The end text and the CLEAR! stamp must not sit on the end card (the real frame): the banner rides the bottom bezel, the stamp the cabinet's top corner.
- Tiny hero heads on the lives board read as faces with nostrils when the eyes sit in a small skin rect; a round visor, wider-set eyes, a smile line and a bigger antenna ball keep them heroes.

**Close, not identical:** the reference renders each medium with WebGL material shaders over channel buffers (pressure, wetness, plate densities); here each medium is a stock-effect recipe (hatching by Venetian Blinds, boil by Turbulent Displace, pixels by Mosaic and Posterize, phosphor by Glow and blinds). The scene is about 11 s, so it shows four games and a boss rather than a 45 to 60 s ladder, and every game succeeds (no lost life). The proof has no sound.

## 7. Dependencies

Titan One, Lilita One, Silkscreen, Inter Tight Bold, VT323 and Caveat installed (all OFL, bundled in `assets/fonts/`; `AESMicrogame.fontOK()` checks). Effects: Venetian Blinds, Turbulent Displace, Roughen Edges, Fractal Noise, Mosaic, Posterize, Glow, Drop Shadow, Transform, CC Vignette. Node 20+ and ffmpeg for `tools/frame.mjs` (fills the real frame to the game size).

## 8. Pitfalls of the medium

A failure at high tempo goes unread: make the action overshoot and hit something, or give it an instant replay. Command tags pile up: secondary commands fly out. A 100 % white flash reads as a blank frame: cap it near 60 %. Tinting a medium with the home palette kills the jolt: each medium keeps its own colours and type. A luminance-ramp ASCII figure is mush: draw terminal pictures with structural glyphs. Ink shapes read as smoke unless the silhouette is designed. Single-word TTS commands grow a vowel tail: generate a two-word phrase and cut after the first word.

## Reference

The proof is the shared test scene, built by `buildScene` and proven with `node production/styles/harness/prove.mjs microgame`, which rebuilds it from a blank project and renders it with aerender. `proof/compare.jpg` sets it beside Lemo-Opuscar's microgame poster.

Build time: about 10 s for 163 layers across seven comps, render about 43 s; every text key goes in through one batched call per layer (`AESLib.textKeys` / `AESLib.bakeText`).

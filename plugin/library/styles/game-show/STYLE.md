# Game Show

> A rhythm-game variety show in flat vector: toy mascots with thick ink outlines hop on a fixed beat over candy sets, every hit lands on the grid, and a judgement word pops when a round is won.

## 1. What it is, and what it is not

- Everything is on the grid. One fixed, fast tempo (138 BPM here, a beat of 0.435 s). Every drop, pop, stamp, typed character and frame punch sits on a beat or a half beat of its round.
- One drawing kit, many sets. Flat fills, one heavy near-black ink outline, round caps and joins, hard offset shadows. Each round gets its own saturated colour and pattern.
- The characters are toys. One bean body for the whole cast, told apart by colour, the belly patch and the antenna ball. They drop in, hop on the beat, squash on contact and throw their arms up on a shout.
- A round is a verb plus a win. The story is split into rounds; each ends on a judgement the viewer reads in one glance.

It is not a microgame frenzy (no countdown timer, no new art style per round), not a mid-century cartoon (no painted textures, no character acting), and not a keynote (no slow reveals, no gradients, no blur, no soft shadows).

## 2. Grammar

Type: Fredoka Bold for every telop and number, Fredoka SemiBold for typed lines in a bubble. Telop text is white or yellow with an ink stroke about 14 % of the size painted under the fill, plus a hard ink shadow offset down-right. Titles are built glyph by glyph (each character pops on its own). The telops are the subtitles: the spoken line sits on the floor band in the same outlined type, never a thin caption.

Colour: ink `#1E1A2B`, white and cream `#FFF4DC` for cards and paper, and candy hues (yellow, orange, red, pink, green, lime, sky, blue, purple). One set is one hue: ground, its pattern one step lighter, a darker floor band with an ink line on top. Neighbouring rounds never share a hue. A character is never the hue of the set it stands on. Judgement words are yellow or pink.

Sets used in the proof: tangerine ground `#FFB870` with `#FFA85A` stripes; teal with white dots at 24 %; sky with a turning sunburst; navy with a gold sunburst at 22 %; pink stripes; lime with dots; grape with dots under a red scalloped valance for the finale.

Motion: idle is a hop on every beat (neighbours hop on the off-beat so a crowd ripples). Every contact gets a damped squash. Entrances drop from the sky with an ease-in and land exactly on their beat. Anything appearing pops with a back ease (0, overshoot about 116 %, a small undershoot, rest, in 0.3 s). Nothing fades in. Shout pose (arms up, mouth open) for about half a beat. Typed text goes a character a frame from the spoken onset.

## 3. Camera grammar

The stage is a frontal, symmetrical proscenium; the frame itself does the moving.

- Beat punch: a scale of 1 to 3.5 % around the centre on each hit, decaying in 0.16 s. Never more than about 6 % at once.
- Hard cut on the round line with a two-frame white flash. No dissolves.
- Snap zoom onto one prop: a hard cut to about 1.2x framing on the detail, back on the next beat (the proof uses it on "real").
- Shrink to thumbnail: a finished bit scales down into a slot in a ribbon of rounds, and can grow back out of it (the carry).
- Locked frontal wide for the crowd and the scoreboard.

Characters stand on the floor band, the round banner sits top left, judgement words centre, telops on the floor band.

## 4. Native moves

- Round banner: a red sticker top left, `ROUND n` in yellow over the round's name in white, popping on every cut.
- Drop and land: a cast member or prop falls on an ease-in and lands on the grid with a burst (star, ring, speed lines) and a frame punch.
- Judgement word: a big outlined word pops at an angle on the round's last hit (`Counted!`, `Perfect!`).
- Stats as game UI: a scoreboard with chasing bulbs, a counter racing up and landing on the number, a label pill.
- Call and response: a mascot shouts each word and the word is typed into its speech bubble.
- Remix board: a ribbon of slots, one per round in its colour; an item lives as a thumbnail in its slot and grows back out of it.
- Crowd drop: the cast drops in one per quarter or half beat, then hops in a ripple and shouts together under confetti.

## 5. Sound palette

All toy-like and pitched, synthesized from the picture's own events: a sine kick and claps on the grid, a slap bass, brass stabs on the round cards, a pop and a boing on every landing (pitched pips can spell a melody as a crowd drops in), typewriter clicks, a ding on the judgement, a short crowd shout ("Hey!") placed 20 to 30 ms before its beat. A bright major loop, one chord per bar, a new flavour per round rather than a new song. The proof carries the voiceover only.

## 6. AE recipe

All in one comp at 1080 x 1920, built by `AESGameShow.buildScene` (module `gameshow.jsx`). Layer order, bottom to top:

1. Per round, the set: a ground solid; a pattern shape layer (stripes: one 74 px rect with a 42-copy Repeater at 140 px, layer rotated -35 and scrolled linearly; dots: a 19 px ellipse at 24 % fill opacity with two Repeaters 14 x 23 at 100 px, a second copy offset 50, 50, drifting diagonally; sunburst: 18 wedges of radius 1800 turning linearly); a floor shape (darker band from y 1500 and a 10 px ink line). In and out points are the round's own times.
2. The finale valance: one path with a scalloped hem (eight bezier sags of 70 px), red fill, 9 px ink stroke.
3. The round ribbon (carry): six 128 px rounded plates (shadow rect in ink offset 9 px under the coloured rect with an 8 px ink stroke), numbers as telops parented to them, popping a quarter beat apart.
4. The card: a precomp (cream rounded rect with a 10 px ink stroke, the real frame, a 6 px ink line round it, the caption `FRAME 135`), on one layer with Drop Shadow (ink, full opacity, direction 135, distance 16, softness 0). Its scale, position, rotation and opacity keys carry it from the input round into a slot of the ribbon and out of it into the finale.
5. Cast and props, each one shape layer with the origin at the feet: arms (an ink line 32 px under a darker body-colour line 18 px, a white mitten with a 6 px ink stroke) in groups named `ARM_L` and `ARM_R` pivoting at the shoulder; the antenna; the bean body (a five-point bezier) with a 9 px ink stroke; belly, cheeks, eyes with catch-lights; `MOUTH_C` (a smile stroke) and `MOUTH_O` (an open mouth). Shouts are hold keys on the arm rotations (plus or minus 150) and the two mouth opacities. The drop is two position keys (ease-in, linear into the landing); the hop and the squash are expressions on position and scale, pure functions of time.
6. Bursts: eight speed lines, a ring and a five-point star, scaled 25 to 118 % and gone in 0.3 s.
7. Round content: the title's hero line (a glyph-pop animator: Scale 0 driven by an Expression Selector whose amount is a back-out per character, grouping alignment 0, -40); the scoreboard (ink plate, yellow inner frame, 24 bulbs whose group opacity flips every half beat by expression, the counter as baked text keys, the label pill); the speech bubble (plate plus a tail, a cream patch hiding the seam) and the typed line.
8. Telops on the floor band and the corner banners (plate plus two telops parented to it, rotated -3, popped).
9. Confetti: one shape layer, 46 small rects whose group position and rotation are expressions of time.
10. A white solid flash: opacity 75 for two frames on each cut, hold keys.
11. Two adjustment layers with a Transform effect each: the zoom layer sits under the telops and banners and holds the snap zoom (anchor on the card, hold keys on position and scale to 122 %); the top one carries every beat punch on its Scale (1.2 to 3.5 %, decaying in 0.16 s).

Text keys go through `AESLib.textKeys` or `AESLib.bakeText`, one call per layer (the counter and the typed line).

**Gotchas found while building it**

- Parenting a child to a layer whose scale is already keyed from 0 hides the child for good (script parenting compensates at time 0, where the parent's scale is 0). The ribbon's slot numbers vanished in the first proof. Parent first, then add the pop keys, or pop each layer on its own (the scoreboard bulbs do).
- One adjustment layer for the punch and the snap zoom cropped the corner banner during the zoom. The zoom now has its own adjustment layer under the telops and banners, and only the beat punch sits above everything.
- At Lemo's proportions in a 1080 x 1920 frame, the cast at 100 % (a body 170 px tall) reads as tiny next to the poster. Use 150 to 200 % for one or two characters and about 110 % for a crowd of five across the width.
- A judgement word and its burst must not share an edge: keep the burst clear of the word's last letter, or the word reads as cut off.
- Fredoka is a variable font. After Effects lists its named instances (Bold, SemiBold), so `getFontsByFamilyNameAndStyleName("Fredoka", "Bold")` works once the file is installed in `~/Library/Fonts`. The proof found it without restarting After Effects.

## 7. Dependencies

- Fredoka (free (OFL) from Google Fonts, not included) (the variable font exposes Bold and SemiBold). Install it before building; After Effects may need a restart to list it.
- Effects: Drop Shadow, Transform. Everything else is shape layers, text and expressions.
- `tools/frame.mjs` (Node 20+ and ffmpeg): crops the real frame out of the scene's input still and sizes it for the card.
- No generated pieces.

## 8. Pitfalls of the medium

- Stateful motion breaks parallel renders: the hop, the squash, the bulbs and the confetti are expressions of `time` only, never accumulated state.
- Cue drift: derive every event from the round's grid (`grid(t, t0)` snaps to a half beat of the round) rather than from a separate hand list.
- Parenting to a layer whose scale is keyed from 0 divides by zero: parent first, then add the pop keys (or pop each layer on its own).
- Text measured before the font is available overflows its plate: `fontOK()` runs first and every plate is sized from `sourceRectAtTime`.
- Real products as characters: names go on tags, mascots stay original, no logos or UI.

## Reference

Lemo-Opuscar `styles/game-show` (MIT, LemoLab), `STYLE.md` and its poster; licence in `library/styles/LICENSE-lemo-opuscar.txt`. Grammar only: no names, characters, UI or music from the rhythm-game and variety-show references it cites.

# Pixel headline

> A speaker on a clean ground. One sentence at a time is set around them: a small lead-in, one giant word in the accent colour that lands on the voice, and a few video cards that pop in after it. Pixel blocks and a drawn line carry the eye from one move to the next.

This style is the plugin's own. It was not adapted from another library: it was measured frame by frame from the finished result of one reference shot (a vertical talking-head reel) and rebuilt in native After Effects until every element matched within a frame. Each rule is marked **said** (the reference's narration explains it), **measured** (read off its finished frames) or **extended** (our reading beyond the one shot, not yet tried on a piece).

Two readers. Sections 1 to 6 are for whoever writes a brief: what the style is and what it may choose. Section 9 is for whoever builds: the exact mechanics of every element, with every number marked. The builders in `pixelheadline.jsx` (global `AESPixelHeadline`) hold section 9 as code, so a builder called with a brief's words and times cannot get the bounce, the glow or the stagger wrong.

## 1. What it is, and what it is not

- **The speaker is the picture.** They are visible at once and stay visible; text and animation support them. (said)
- **Clean, contrasty, saturated.** A plain ground, deep blacks, colour pushed but not washed out. (said)
- **One accent colour.** The giant word, the pixel blocks and the drawn line share it, and no other graphic does. (said)
- **One move leads to the next.** Each element starts at or just before the peak of the one before, so a beat reads as one motion. (said, and measured)
- **Every move gets a sound.** (said)

It is not word-by-word captions, not a collage that hides the speaker, not several colours, and not constant motion. A beat lands, settles and holds.

## 2. Grammar

- **Stage.** The speaker cut out (the plugin's subject operations) on a flat, light ground, centred. Nothing ever covers the face.
- **Type.** One bold grotesque: Inter Bold. Three lines in a triangle: a small lead-in, the giant word, a tail line. The giant word is sized by letter height, not by width: a font size of 28.4 % of the frame's width, whatever width the word then takes, shrinking only past 85 %. Its baseline sits at 27.5 % of the height and its tallest letters just reach the lead-in's baseline. The tail's capitals are 1.35 times the lead-in's, and the tail sits clear of any descender. (measured)
- **The text is the spoken sentence.** The giant word is the word the speaker stresses. Each line starts when the speaker starts saying it. (said)
- **Layers, back to front.** Ground, speaker, cards, drawn line, lead-in line, pixel blocks, giant word (with its glow), tail line. The blocks cover the lead-in's letters and the word covers the blocks (measured). Cards may overlap the speaker's body, never the face. The ground does not move with the push.

## 3. The beat

A beat is one sentence with one stressed word. Frames at 30 fps, counted from W, the giant word's first frame, which sits on the spoken stress.

| Order | Element | Motion signature (measured) |
|---|---|---|
| 1 | Push | Starts far in on the face and eases out to the full frame, fast then slow: 1.4 after 4 frames, 1.25 after 8, 1.10 after 18, 1.03 after 28, still after 34. Its first frame is a motion-blurred streak. It opens the beat. |
| 2 | Lead-in line | Word by word, each falling 136 px (at 1080 wide) into place and fading up on one curve over 28 frames, 4.75 frames apart. |
| 3 | Giant word | Scale from 0 to 1.155 at W+8, down to 0.92 at W+14.5, still at W+22. Its glow flares with it and cuts off at W+23. |
| 4 | Pixel blocks | Small squares of mixed strength on all sides of the word, switching on and off without fades. First at W+1, a jump at W+4, peak at W+7, gone after W+16. They run outward: close to the word at first, about one and a half of its half-widths out by W+11 to W+13. |
| 5 | Cards | Upright video cards, each popping to 1.08 at +5.5, dipping to 0.85 at +13, still at +20. The first at W+8, then one every 4 frames. They arrive blurred and over-bright and are clear by +12. The reference: three, stepped down one side, each 28 % of the width, each a third over the one before. |
| 6 | Drawn line | From under the word down through the cards. Drawn on from W+7.5 to W+18, wiped from its top from W+15 to W+22, both at a steady rate. |
| 7 | Tail line | Word by word from the left, 154 px, softly blurred, 6.4 frames apart, from about W+20. |
| 8 | Hold | Everything still by about W+60. Hold until the sentence ends. |

Motion blur is on for everything that moves.

## 4. What is fixed and what a brief may choose

**Fixed, or it stops being this style:**
- one accent colour per piece;
- the face always clear;
- one giant word per beat, on the voice;
- the two pop curves, for anything that pops: the word's (over by 15 %, under by 8 %, still at +22) and the cards' (over by 8 %, under by 15 %, still at +20). The cards' curve is not the word's scaled down;
- text lines ease into place with no overshoot;
- the order: word, then cards and line, then tail, each starting at or just before the peak of the one before, never waiting for it to settle;
- a settled hold before the next beat.

**A brief chooses:**
- the words, and which word is stressed;
- which elements a beat uses (the beat types below);
- how many cards there are and where they sit (the reference: three, stepped down one side);
- the accent and ground colours;
- whether a beat opens with the push.

**Beat types for a 30 to 60 second piece (extended):**

| Beat | Uses | For |
|---|---|---|
| Opener | everything in section 3 | the hook; at most one every 8 to 10 seconds |
| Punch | giant word, glow, pixel blocks | a single stressed word mid-thought |
| Evidence | cards and the drawn line, with a small label | showing examples while the speaker carries on |
| Rest | the speaker alone | between beats; the style stays clean only if it rests |

## 4b. Going beyond the reference

The reference is one shot. A real piece will ask for things it never showed: a fourth card, cards on both sides, cards circling the speaker's head. This card does not list what is allowed; it gives the test a new idea has to pass.

**A new idea is in the style if it keeps all of these:**
1. The speaker is still the picture, and the face is clear on every frame.
2. The accent appears only on the giant word, the pixel blocks and the drawn line. Other graphics are white or neutral; any other colour comes from a card's footage.
3. Whatever pops uses one of the two pop curves. Whatever is one of several arrives in a stagger of a few frames, not all at once.
4. It starts at or just before the peak of the move before it and hands on to the next, so the beat still reads as one motion.
5. It is timed from the voice.
6. The frame comes to rest before the next beat asks for attention.

**Then say which it is in the brief:**
- **In the style:** keeps all six. Build it from the builders with different inputs.
- **A stretch:** bends one, on purpose, for a reason the script gives. Name the rule it bends, so whoever builds and reviews it knows to look.
- **Out of the style:** bends two or more, or the first. Use another style for that beat.

**Worked examples.**

| The script asks for | Answer |
|---|---|
| Four cards, or five | In the style. The stagger stays at 4 frames; the cards shrink so the column keeps its span (`cardStack` does this), and the hold gets longer because there is more to look at. |
| Cards on the other side | In the style. `side: "right"` mirrors the column. |
| Cards on both sides | In the style, if the giant word still lands first and each side staggers. Two `cardStack` calls, the second starting 4 frames after the first's last card. |
| Cards circling the speaker's head | A stretch of rule 6. Each card still pops with the card curve, in a stagger, after the word; the ones at the back pass behind the head, so the face stays clear. What bends is the rest: a circle that keeps turning never settles. Let it turn once and ease to a stop, or keep it slow enough to read as a hold, and say so. `card` places one card anywhere; the circle's motion is the brief's own. |
| Two giant words in one sentence | A stretch of "one giant word per beat". Split the sentence into two beats instead, unless the two words are a pair the speaker stresses together. |
| A full-screen graphic that covers the speaker | Out of the style for that beat. Cut to another style and come back. |

## 5. What a brief must supply

- The take (the speaker cut out) and its voice, or a script with word times.
- Per beat: its type, the sentence's words with their spoken start times, the stressed word, and where the lead-in and tail split (default: before and after the stressed word).
- Per card: an upright clip of at least two seconds, and the moment in it to show.
- The accent colour, the ground colour, the side for the cards.
- The speaker's face box in the settled frame (comp pixels), so the cards can keep off it; and, if the speaker leans during the push, their head size over it (see the push).

Limits: a giant word of up to about eight letters keeps its size, longer ones shrink; lines of up to about 24 characters; cards need upright clips; the speaker must be cut out or shot on a plain ground.

`AESPixelHeadline.beat(comp, brief)` takes it as one object:

```
{ type: "opener" | "punch",
  take: FootageItem, takeStart: seconds into the take at the comp's 0, speakerScale: %, speakerX,
  face: { x0, y0, x1, y1 }, pivotY: the face's centre height, sway: [{ f, r }] (optional),
  words: [{ text, t }], stressed: index, split: [leadEnd, tailStart] (optional),
  clips: [{ item: FootageItem, start: seconds }], side: "left" | "right",
  accent: [r, g, b], ground: [r, g, b], grade: { mixer, inBlack, inWhite, gamma, saturation },
  glow: "auto" | "deep" | "stock", exposure (optional), seed, push: true | false }
```

## 6. What the build reports back

`beat` returns W, which glow it used (`deep` or `stock`), the cards' first frames, the push's start and whether the speaker's sway was divided out, the word's settled box and size, the card scale and positions, the drawn line's path, the number of pixel blocks, and warnings (for example, cards that cannot clear the face). After a render, check: the face clear on every frame; text inside the frame; the giant word within a frame of the spoken stress; each pop's peak, low and settle against section 3; the file check.

## 7. Dependencies

A cut-out speaker. Inter Bold (OFL, from Google Fonts; `fontOK()` stops the build when it is missing). The text reveal is a native text animator with two sliders; it needs no plugin. The glow uses Deep Glow (`PEDG2`) when it is installed and two stock Glows otherwise; `beat` reports which. The stock pair matches the haze near the word and falls short further out.

## 8. How far it is tested

- **Calibrated on one reference shot.** Every element of one opener beat was measured on the reference's finished frames and matched through these builders alone, with no hand corrections, using the reference's own words-to-frames as inputs and a different speaker. Within a frame: the word's peak, low and settle; each card's peak, low and settle; the push's four marks on a pass with the speaker frozen; the lead-in's words (first frame and fall); the pixel blocks' first, peak and last frames, their peak amount (within 20 %), their spread round the word and their outward run from W+4 to W+13.
- **Tolerances left:** one lead-in word's last fade step 2 frames late; the tail's last word first visible 2 frames late; the drawn line's end up to 2 frames early; the push reads still 3 frames late on the delivered picture when the speaker sways about 1 % (under the 3 % at which the builder divides the sway out); the pixel blocks' first three frames and W+14 to W+15, where only one to three blocks show, read 0.3 to 0.9 half-widths further out than the reference's (its few early and late blocks sit in the gaps between its word's letters, which differ from word to word).
- **Tried through the builders, inputs only:** four cards on the other side with another word and a blue accent: the word and all four cards passed their pops within a frame and 3 %, and the face stayed clear on every frame (the stack fell back to a straight column to keep off it); the blue glow read heavier than the red. A punch beat (word, glow and blocks alone) with a four-letter word: the word passed its pop exactly and the face stayed clear, but the blocks overcrowded the shorter word (see 9.5).
- **Not yet:** a whole piece, the evidence and rest beats, any card layout other than a column, and the blocks for words much shorter or longer than five letters.

## 9. Recipe, element by element

Every number carries one of three marks:

- **signature**: the feel. Keep it exactly; changing it is what makes a pass read as a knockoff.
- **scaled**: follows a stated rule from the frame, the words or the voice. Work it out; do not copy the reference's figure.
- **free**: the reference's own choice; the brief decides.

Frames are at 30 fps (a time in seconds is frames / 30). Sizes are at 1080 × 1920; every pixel figure scales with the frame's width. All keys are bezier unless marked; an influence is the AE temporal-ease influence, a speed is per second.

### 9.1 Grade and ground: `stage(comp, o)`

**Its job.** A plain, light, neutral ground that everything reads against, and the speaker graded clean, contrasty and saturated on it.

**Build.**
1. Ground, the bottom layer, not parented to the push: a solid of the ground colour (reference 0.80, 0.80, 0.81); Gradient Ramp (`ADBE Ramp`), radial, from (540, 900) at the ground + 0.04 to (540, 2300) at the ground − 0.06; Noise (`ADBE Noise2`) 1.3 %. The comp's background is the same colour.
2. The speaker over it, bottom-anchored (anchor at the bottom centre of the footage, position on the frame's bottom edge), centred across, sound off. Effects in order: Channel Mixer (`ADBE CHANNEL MIXER`) Red-Red, Green-Green, Blue-Blue; Levels (`ADBE Easy Levels2`) Input Black, Input White, Gamma, Output Black 0; Hue/Saturation (`ADBE HUE SATURATION`) Master Saturation.

| Number | Mark | Rule |
|---|---|---|
| A light neutral ground, about 205 of 255, a slight radial falloff, a trace of noise | signature | Within 10 of 205, no hue. |
| The ground does not push | signature | |
| Speaker deep and saturated | signature (said) | Deep blacks, colour pushed, skin not clipped. |
| The grade's values (the calibration take: mixer 90 / 105 / 84, levels 0.03 / 0.52 / 1.85, saturation +30) | scaled | Per take: the mixer from its cast, the levels for deep blacks, saturation until the skin is rich, not orange. |
| The speaker's scale (calibration: 90 %) | scaled | The face in the lower half, below the text triangle, with room for the cards. |
| The ground's colour | free | Any plain ground the accent reads on. |

**Why.** A cast take sits on top of the ground instead of in it; correct the cast before judging the style. At full size a chest-up take fills the frame and leaves no room for the cards.

**Check.** The ground behind the lead-in within 10 of 205; the speaker's blacks under 25; the face below the text triangle.

### 9.2 Push: `push(comp, { at, pivotY, layers, sway })`

**Its job.** It opens the beat: the frame starts far in on the face and eases out, fast then slow, and is still before the giant word lands.

**Build.**
1. One null, `PH Camera`; every layer of the beat except the ground parented to it; motion blur on for all.
2. Scale, two keys: 171.5 % at P (out: influence 2 %, leaving at −2,202 % per second); 100 % at P + 42 (in: influence 38.5 %).
3. Position expression, so the zoom pivots on the face: `[540, Py + (960 − Py) × scale / 100]`, with Py the face's height.
4. The speaker's own movement: given their head size over P to P + 45 as a ratio to P + 40, the builder divides it out of the scale (a `Speaker sway` slider keyed per frame, blended back to 1 over 10 frames) when it moves by more than 3 %. Below that, start the beat on a steady stretch of the take.

| Number | Mark | Rule |
|---|---|---|
| 1.4 at +4, 1.25 at +8, 1.1 at +18, 1.03 at +28, still at +34 | signature | Very fast out of the first frame, a long tail. A plain ease-in-out is the cheap read. |
| 171.5 % with 2 % out-influence | signature | Together they make the first-frame streak. |
| 42 frames between keys | signature | |
| P | scaled | 18 frames before the lead-in's first word (the reference: 48 frames before W). |
| Pivot | scaled | The speaker's face in the settled frame. |
| Whether a beat pushes | free | An opener usually does; a punch usually does not. |

**Why.** The reference's first frame is already a blurred streak; a first key that holds still before it gives a sharp first frame. A speaker who leans in during the take adds their own zoom (one calibration take was 1.15 times bigger at its first frame than 40 frames later) and the delivered picture then reads 1.71 / 1.44 / 1.19 at +1 / +8 / +20 instead of 1.55 / 1.26 / 1.10, while a frozen-speaker measure says all is well.

**Check.** The speaker's scale against P + 40, per frame, on the delivered movie and on a pass with the speaker frozen: the four marks within a frame, the start (at P + 1) within 3 %, still within a frame (3 when the speaker sways about 1 %).

### 9.3 Lead-in line: `leadIn(comp, { text, at, colour })`

**Its job.** It sets up the stressed word: the words fall a short way into place one after another, so the line has finished arriving when the giant word lands.

**Build.**
1. One text layer, Inter Bold 64, white, centred, at (540, 282): the baseline at 14.7 % of the height.
2. The reveal, all native: two Slider Controls, `Reveal Strength` and `Reveal Delay` (frames at 30 fps), and one text animator `PH Reveal` with one Expression Selector `PH Words`, Based On = Words, whose Amount is
   ```
   var s = effect("Reveal Strength")(1).valueAtTime(time - (textIndex - 1) * effect("Reveal Delay")(1) / 30);
   [s, s, s];
   ```
   and whose properties are Position (0, −136) and Opacity 0. At Strength 100 a word is fully up and clear; at 0 it is in place.
3. Reveal Delay 4.75. Reveal Strength, two keys from L, the line's spoken start: 100 at L − 1.865 (out: influence 1 %, leaving at −69.7 per second); 0 at L + 26.12 (in: influence 82 %).

| Number | Mark | Rule |
|---|---|---|
| The fall: 136 px over 28 frames, 1 % out, 82 % in | signature | |
| Delay 4.75 frames per word | signature | The words flow at this pace; they do not land on their spoken times. |
| Opacity and position on one curve | signature | A word shows from about 85 % up its fall. |
| L | scaled | The line's spoken start. |
| Size and position | scaled | Capitals 4.3 % of the width; baseline at 14.7 % of the height. Shrink past 85 % of the width. |
| The words, their number | free | Each extra word lands 4.75 frames later. |
| White | free | Any neutral that reads on the ground; never the accent. |

**Why.** Each word landing in 7 frames from 65 px passed a "half-landing within a frame" check and still read as cheap: a third of the travel at twice the speed. Gate the whole fall. Measure the line by luma above the ground, not with a near-white threshold, which hides the first third of each fall.

**Check.** Per word: first frame, offset passing 60, 30 and 10 px, opacity passing 0.5, 0.8 and 0.9 of its plateau, each within a frame. Words still rising when the giant word arrives have no plateau; gate them on first frame and offset.

### 9.4 Giant word and glow: `heroWord(comp, { text, at, colour, glow, exposure })`

**Its job.** The one word the speaker stresses, and the event the beat hangs off. Everything after it is timed from W.

**Build.**
1. One text layer, Inter Bold at 28.4 % of the width, the accent colour, centred; anchor 18 px above the baseline, position (540, 510): the baseline at 27.5 % of the height. Hidden before W.
2. Scale, four keys from W:

| Frame | Scale | Ease into the key | Ease out of the key |
|---|---|---|---|
| W − 1.65 | 0 % | | influence 7.3 %, leaving at 301 % per second |
| W + 8.90 | 115.6 % | influence 89 % | influence 9.7 % |
| W + 13.89 | 92.0 % | influence 31 % | influence 46 % |
| W + 24.93 | 100 % | influence 67 % | |

   With motion blur on these read as: first seen at W, peak 1.155 at W + 8, low 0.92 at W + 14.5, still at W + 22.
3. Glow, Deep Glow (`PEDG2`) on the word's own layer at its defaults (Exponential, Screen, Radius 1000). Exposure: 0 at W − 2 (influence 33 %); 0.64 at W (in 30.7 %, out 83.3 %); 0 at W + 24.26 (in 5 %). It holds near full and cuts off within one frame at W + 23.
4. Without Deep Glow: a copy of the word under it (`PH Word glow`) with two Glows (`ADBE Glo2`: threshold 30, radius 110, intensity 1.803; threshold 30, radius 420, intensity 0.35) and its opacity keyed linearly per frame from W − 1: 0, 55, 69, 70, 70, 70, 70, 70, 67, 62, 54, 54, 46, 46, 48, 51, 51, 50, 46, 42, 40, 35, 28, 16, 0.

| Number | Mark | Rule |
|---|---|---|
| Peak 1.155 at +8, low 0.92 at +14.5, still at +22, and the eases | signature | The word's pop. Fast out of zero, a long ease into the peak. |
| W | scaled | The stressed word's spoken start. |
| Size | scaled | By letter height (font size 28.4 % of the width); the width is whatever the word gives (five-letter words run 66 % to 95 %); shrink only past 85 %. |
| Position | scaled | By the frame, not the head. |
| Glow cut at W + 23 | signature | It ends as the word settles; it does not fade. |
| Exposure 0.64 | scaled | For a red word at this letter height on a light ground. A smaller word needs more, not less, and the accent changes it too: a blue accent at 0.64 reads as a much heavier haze. Set it from one test render per accent. |
| The colour, the word | free | |

**Why.** The glow is not keyed down after its peak; most of its measured fall is the word shrinking inside its own haze. Deep Glow's haze does not rise in step with Exposure (2.5 times the Exposure gave 1.5 times the haze at the peak), so set it from a render. With motion blur on, a pop reads about a third of a frame ahead of its keys, so pops are fitted on a render, never on keys alone. A word whose tall letters reach above the lead-in's baseline covers the lead-in's last words as it grows; check the lead-in still reads.

**Check.** The word's shape fitted per frame against its settled shape: peak, low and settle within a frame of the table, amounts within 3 %; nothing before W.

### 9.5 Pixel blocks: `pixelBlocks(comp, { word, at, colour, seed })`

**Its job.** A burst of small blocks in the accent round the giant word as it lands: they spark with it, crowd round it at its peak, run outward and are gone as it settles.

**Build.**
1. One shape layer `PH Pixels`, under the word and its glow and above the lead-in, parented to the push, motion blur on.
2. Squares 39 px (3.6 % of the width) on a grid of the same size, each a group with a Rectangle and a Fill in the accent, its group Opacity on three Hold keys: 0, its strength at its first frame, 0 at its last. No fades.
3. Strong blocks (70 to 100 %) carry the schedule; weak ones (25 to 50 %), 0.7 times as many on the same rules, give the mixed strengths.
4. The schedule (`blockSchedule`), per frame from W. How many strong blocks are on: 0, 2, 2, 3, 60, 66, 88, 89, 39, 36, 34, 22, 10, 9, 3, 2, 1, 0. The distance from the word's centre, in its half-sizes (the larger of |dx| / half-width and |dy| / half-height), at which new blocks appear: 0.34, 0.62, 0.62, 0.62, 0.36, 0.43, 0.49, 0.68, 1.11, 1.65, 1.67, 2.17, 2.00, 2.19, 0.26, 0.57, 0.24, 1.04. Each frame: blocks furthest from that distance go first when there are too many, and one block that has fallen more than 0.35 inside it is replaced, so the burst travels; a new block's side is the one furthest below its share (above 33 %, left 40 %, right 15 %, below 12 %); a new block may bring up to two neighbours in a short run; nothing lands on the lead-in's line before W + 6. Many blocks fall behind the letters, which is why the counts run higher than what shows.

**What shows** (the signature, on a 608-wide picture): strong red outside the word, per frame from W: 7, 429, 697, 973, 6307, 6701, 8827, 11260, 6800, 6959, 8297, 7525, 6104, 5825, 2860, 2076, 811, 55 px. The visible blocks' mean distance from the word's centre from W + 1 to W + 15: 0.32, 0.32, 0.32, 0.61, 0.59, 0.59, 0.67, 0.82, 1.01, 1.15, 1.51, 1.58, 1.76, 0.73, 0.87.

| Number | Mark | Rule |
|---|---|---|
| First W + 1, jump W + 4, peak W + 7, gone after W + 16 | signature | Starts with the word, peaks just before it does, ends as it settles. |
| The outward run, W + 4 to W + 13 | signature | From about 0.6 to 1.8 half-sizes. |
| Peak strong red about 1.7 % of the frame | signature | Scales with the frame's area (the builder does this). |
| 39 px blocks on a grid, Hold keys, mixed strengths | signature | Scale the block with the width. |
| All four sides in about these shares | signature | At least three sides with 8 % each. |
| Which cells | free | A seed. |

**For any layout:** the blocks belong to the giant word and follow it, placed round its settled box on its timing. A beat without a giant word has none.

**Open: other word lengths.** The schedule was fitted on a five-letter word about 76 % of the width wide. Its counts include the blocks that hide behind those letters, so a shorter word shows far more of them: with a four-letter word the visible blocks ran 4 to 6 times the reference's on the jump and peak frames and crowded the letters enough to change how one read. The counts need a rule tied to the word's box (or to the visible coverage) before the builder is used with words much shorter or longer than five letters; until then, check the blocks by eye.

**Why.** Blocks built by drawing a few strokes round the word and breaking them with Turbulent Displace and Mosaic came out as one clump on one side, three frames late, at 2.5 times the amount, and could not be steered. Scheduled grid squares give the look and can be fitted frame by frame. Measure strong red (R > 170, G < 90, B < 90) in the top 45 %, outside the word's shape fitted per frame and grown 10 px; measure the distance on blocks alone (after an opening with a 13 px square), or the drawn line's top, which runs through the same region, reads as blocks.

**Check.** First, peak and last frames within one; peak within 20 %; at least three sides with 8 % or more; distance within 0.3 of the reference's from W + 4 to W + 13.

### 9.6 Cards: `card(comp, { clip, clipStart, at, pos, scale, name })`, `cardStack(comp, { clips, at, side, face })`

**Their job.** Upright video cards that show the evidence while the speaker carries on: they pop in one after another after the word lands, arriving blurred and over-bright and clearing as they settle, in front of the speaker's body, never the face.

**Build (one card).**
1. A card comp (1080 × 1920) holding, bottom to top: `Outer`, a rounded rectangle 790 × 1100, roundness 60, white, at 106 %; `Rim`, an adjustment layer alpha-matted to Outer with Gaussian Blur 25 (Repeat Edge Pixels on) and Exposure 0.15, which frosts whatever is behind into a soft light rim; `Inner`, the same rectangle at 100 %; `Clip`, the video at 76 %, alpha-matted to Inner, sound off, with Gaussian Blur (Repeat Edge Pixels on) keyed 70 at F − 2, 70 at F + 7, 0 at F + 12 and Exposure keyed 2, 2, 0 on the same frames. The entrance goes on the clip inside, not on the card layer (there it would blur the rim away).
2. The card comp in the main comp, sound off, parented to the push, motion blur on. Scale, four keys from F, the card's first frame, with S its settled scale:

| Frame | Scale | Ease into the key | Ease out of the key |
|---|---|---|---|
| F − 1.43 | 0 | | influence 13 % |
| F + 5.50 | 1.078 × S | influence 100 % | influence 69 % |
| F + 13.27 | 0.854 × S | influence 52 % | influence 34 % |
| F + 23.09 | S | influence 85 % | |

**The stack (`cardStack`).** n cards in a column on one side: each card's visible width (rim included) is 27.8 % of the frame's width when n = 3; the column keeps its span, so the card height is span / (1 + 0.65 (n − 1)) and four cards are 0.78 times the size of three. The first card's top at 24.4 % of the height, its edge 2.9 % in from the side; each next card 0.65 card heights lower (a third overlapped) and 4.6 % of the width toward the speaker. If that would reach the face at peak scale, the step goes away from the speaker; if that leaves the frame, a straight column; if the face is still reached, a warning. F = W + 8, then every 4 frames.

| Number | Mark | Rule |
|---|---|---|
| The card pop: 1.078 at +5.5, 0.854 at +13.3, still at +20, these eases | signature | A smaller overshoot and a deeper dip than the word's; not the word's curve scaled down. |
| Stagger 4 frames | signature | Whatever the count. |
| First card at W + 8 | signature | At the word's peak. |
| Entrance: blur 70, exposure 2, held to F + 7, clear at F + 12 | signature (blur scaled to content) | Unreadable on arrival, sharp as it starts its dip. Check the first 8 frames are unreadable on bold content. |
| Rim 106 %, frosted | signature | 110 % reads as a thick white frame. |
| Shape 790 × 1100, roundness 60 | signature | |
| Size | scaled | 27.8 % of the width for three; smaller with more, as above. |
| Count, side, positions, clips | free | |

**For any count or layout:** each card pops on the card curve; consecutive cards start 4 frames apart; the first starts at W + 8; no card covers the face on any frame, peak scale included; a card may tuck under the giant word's lower edge, as the reference's top card does, but the word stays above it in the layer order and must still read; the rim and the entrance as above. The last card is still at W + 8 + 4 (n − 1) + 23; hold no earlier. For a ring or both sides, place each card with `card` and keep the same timing; cards passing behind the head go under the speaker's layer.

**Why.** The reference's narration values (blur 25, exposure 2) were set on its own clips; on bold, dark clips blur 25 left them readable and exposure 2 flashed. The entrance is measured as how unreadable the card is. Measure the pop on a pass with plain white cards (clip and rim off), from each card's left edge against its settled width.

**Check.** Per card: peak, low and settle within a frame, amounts within 3 %; the visible width within 1 % of its share; sharpness under 10 % of settled from F + 2 to F + 7 and past 50 % by F + 12; the face clear.

### 9.7 Drawn line: `drawnLine(comp, { at, path, colour, cards })`

**Its job.** One stroke in the accent from under the giant word down through the cards, curling off toward the speaker: drawn on as the cards arrive and wiped from its top before they settle.

**Build.**
1. One shape layer `PH Line`: an open path, Stroke in the accent at 18 px (1.7 % of the width), no fill, parented to the push, motion blur on, above the cards and under all text.
2. The path (`linePath`, from the stack): from the word's baseline, 3.9 % of the width inside the first card's centre; straight down to just below the middle card's centre; to just below the last card's centre; curling 12.9 % of the width toward the speaker, below the last card. Tangents: 8.3 % of the height down from the first vertex, 4.7 % around the middle ones.
3. Trim Paths: End 0 → 100 linear from W + 7.5 to W + 18; Start 0 → 100 linear from W + 15 to W + 22. With more than three cards both run 4 frames later per extra card.

| Number | Mark | Rule |
|---|---|---|
| Drawn over 10.5 frames, wiped over 7, linear | signature | A steady rate; the wipe starts 3 frames before the draw ends, so the whole line is never on screen. |
| Start at W + 7.5 | signature | With the first card. |
| Width 1.7 % of the width, the accent | signature | |
| The path | scaled | From the stack; never across the face. |

**Why.** The timing is read off the reference's frames directly. A drawn-length measure that suggested drawing 1.5 frames later left the line's top in the pixel blocks' region for two frames too long.

**Check.** Drawn length per frame (the span of its red along its main axis, below the word) within 50 px of the reference's from W + 13; peak within a frame; gone at W + 22.

### 9.8 Tail line: `tail(comp, { text, at, colour, under })`

**Its job.** It finishes the sentence under the giant word: its words slide in from the left, softly blurred, overlapping as they come, and the beat comes to rest on it.

**Build.**
1. One text layer, Inter Bold 86 (capitals 1.35 times the lead-in's), white, centred, at (540, 611): the baseline at 31.8 % of the height, moved down by the word's descender when `under` has one.
2. The reveal as for the lead-in, with Position (−154, 0), Opacity 0, Blur (10, 10), Reveal Delay 6.4, and Reveal Strength keyed from T, its spoken start: 100 at T − 0.38 (out: influence 6.6 %, leaving at −65.5 per second); 0 at T + 26.08 (in: influence 84 %).

| Number | Mark | Rule |
|---|---|---|
| The slide: 154 px over 26.5 frames, 6.6 % out, 84 % in | signature | Its own curve, not the lead-in's. |
| Delay 6.4 frames per word | signature | Slower than the lead-in's. |
| Blur 10, clearing with the slide | signature | Enough to soften, not to hide a word's first frames. |
| Capitals 1.35 times the lead-in's | signature | |
| T | scaled | The tail's spoken start. |
| Position | scaled | Clear of the word's baseline and descenders. |
| The words | free | Each extra word lands 6.4 frames later. |

**Why.** At blur 20 the last word stayed hidden four frames longer than in the reference; at 10, two. Measure the line as a whole (mass, right edge, sharpness): its words slide across each other's columns.

**Check.** The right edge against its settled place within 3 px of the reference's once visible; mass passing 0.5 and 0.9 within a frame; first frames within 2.

### 9.9 Motion blur: `motionBlur(comp, layers)`

**Its job.** Every move here is fast at its start; motion blur makes those first frames streaks instead of small sharp shapes.

**Build.** The comp's motion blur on; every layer of the beat on (the builders do it). Shutter 180°, phase 0°, 16 samples per frame, adaptive limit 128.

| Number | Mark | Rule |
|---|---|---|
| On for everything that moves | signature (said) | |
| 180° at phase 0°, 16 samples | signature | As calibrated. A phase of −90° would centre the blur on the frame and shift how each pop's first frame reads (not tested). |

**Why.** With it on, the push's first frame reads at 0.60 of the speaker's settled sharpness against the reference's 0.59, and the next frames follow within 0.03. It also moves how a pop's first frames read by about a third of a frame, which the keys already allow for.

**Check.** The speaker's sharpness over the push's first 10 frames within 0.05 of the reference's; nothing visible a frame before W.

## 10. Using the module

Load the shared helpers and the module in the same `eval.run` call as the build: `$.evalFile(File(LIB + "/styles/aes-lib.jsx")); $.evalFile(File(LIB + "/styles/pixel-headline/pixelheadline.jsx"));`. Then `AESPixelHeadline.beat(comp, brief)` builds a whole beat into a comp you made (1080 × 1920 at 30 fps for the calibrated figures; other sizes scale). Each element's builder is also exported for briefs the beat types do not cover: `stage`, `push`, `leadIn`, `heroWord`, `pixelBlocks` (and the pure `blockSchedule`), `card`, `stackLayout`, `cardStack`, `linePath`, `drawnLine`, `tail`, `motionBlur`. `AESPixelHeadline.SIG` holds every signature number in section 9. Layers it makes are named `PH …`; `AESLib.clearOwned(comp, "PH ")` removes them.

## 11. Beyond the reference: what a whole piece needs (extended)

The reference shows one beat and nothing leaving. These inputs are built and tested offline; they are marked extended because no reference measured them.

- **Many beats in one comp.** Give each beat its own `prefix` (for example `"PH B3 "`), build the stage once, and pass the first beat's `speaker`, `groundLayer` (when there is one) and `camera` to every later `beat`. Each later push adds its keys to the same camera null and holds the full frame until its own start (a hold key one frame before), so the jump in reads as a cut.
- **The footage as the ground.** `stage(comp, { take, footageGround: true })` (or `footageGround: true` in the brief) uses the take as it is, filling the frame, with no cut-out and no ground solid; the take is pushed with the scene. On a dark ground the glow needs its own exposure: pass `darkGround: true` (or `exposure`) and set the figure from one test render (see `SIG.deepGlow.darkGround` once measured). The accent changes it too.
- **The zoom-out inset.** `zoomOut(comp, { speaker, scale, position, feather, ground, at, dur })` scales the footage down inside the frame so the speaker sits small and leaves room above: a rectangular mask on the footage's own edges, feathered by `feather` on screen and pulled in by half of it, over a full-frame solid of the ground colour. `ground: "sample"` reads the colour from a strip along the footage's top edge by expression (`sampleImage`), so it follows the room's light. With `at`, it moves there from where it is, no overshoot. `exitInset(comp, { speaker, at })` returns to the full frame in 8 frames.
- **Exits.** `exitBeat(comp, { prefix, at })` clears a beat: the lead-in and tail leave by word from the last word, 1 frame apart, each over 6 frames, back the way they came (the reveal's `Reveal Exit` slider flips the order); the giant word scales to 0 over 7 frames; cards go from the last one at up to a 2-frame stagger, each over 6 frames; the pixel blocks and drawn line are cut if still on. Every exit starts slow and leaves fast (75 % influence out, 10 % in), with no overshoot, and the whole beat is gone within 10 frames of `at`. Start it so it ends before the next beat's first element.
- **Two-line lead-in or tail.** Text longer than `maxChars` (24) wraps at the word boundary that makes the two lines most even. The words still arrive in reading order at the same stagger. The lead-in's lines stack upward from its baseline and the tail's downward from its own, so the giant word's place does not move. Leading 1.2 times the font size.
- **Cards of any shape.** `card(comp, { size: [w, h], width, ... })` builds a card of any proportion, for example 1280 × 800 (16:10) shown at 88 % of the frame's width above the speaker. The pop, the frosted rim and the blurred, over-bright entrance are the same. The rim and corners scale by the card's shorter side: rim 3 % of it on every edge, corner radius 7.6 % of it (the rim's outer radius adds the rim), rim blur 3.2 % of it, the entrance blur 70 × (shorter side / 790). The clip covers the card. The upright default keeps the calibrated 106 % rim.

# Techniques from one video (5 recipes, 5 proven)

Written by the channel learner from the video's narration and screen together, then checked against the video by a second reader. Every recipe here passed that check; none is in the plugin. `status: proven` means it was built in After Effects from the recipe alone, compared with the tutorial's own result, and accepted by Joe (5 of 5); `status: unproven` means it has not been.

Each step is marked `said` (narrated), `shown` (on screen; `fNNNNNN` is a frame in the local study folder, frame number divided by the video's frame rate is seconds) or `inferred` (our reading). The `source` and frame references are for checking and stay out of the plugin. Credits: `CREDITS.md`.

| # | Technique | Jobs | Check passed in round | Status |
|---|---|---|---|---|
| 01 | Overshoot bounce on a word's drop-in, with a second word staggered behind it | type; energy and impact; transitions | 8 | proven |
| 02 | Concentric gradient discs from a Repeater with eased scale and rotation | layout and repetition; texture; glow and colour; B-roll scenes | 3 | proven |
| 03 | Long soft shadow from a blacked-out copy and a radial blur | shadows and light; depth and finish | 4 | proven |
| 04 | Hand-traced script word that draws itself and glows | type; glow and colour; lines and shapes | 6 | proven |
| 05 | Frosted glass bar refracting a smeared gradient star | glow and colour; depth and finish; layout and repetition | 4 | proven |

## Overshoot bounce on a word's drop-in, with a second word staggered behind it
id: 01-bounce-keyframes-word-stagger
status: proven (accepted by Joe 2026-11-25: rebuilt in After Effects on generated artwork from this recipe alone, reviewed against the tutorial's result and phone MP4s sent; he said "Accept all five")
variant of: 03-step-icons-pop-with-bounce-in-sequence (nHh0NRo8G2U #03)
differs: Shared: both put an inertial-bounce expression on an animated property of several layers whose keys are eased, so each layer overshoots and settles after its last key, and both bring the layers in one after another by offsetting their keys in time; the parent says the size of the overshoot follows the speed at the last key, which here step 6 sets with the raised handle. Differences: here the expression is on Position and the words drop in from above; in the parent it is on Scale and the pictures grow from 0 % (shown f012940). Here the expression text is the author's pinned comment, with amp 0.06, freq 1.8, decay 5 and a guard for the first key; in the parent only the first two lines are on screen (amp = .1, freq = 2.0) and the parent infers the rest, including decay 2.0. Here the ease is F9 Easy Ease followed by lifting the incoming handle in the Graph Editor to about 1,350 px/s (about 0.3 x the average speed, inferred), with the move over 3 to 4 frames; in the parent the ease is the cubic-bezier 0.88, 0.14, 0.12, 0.86 set by a paid easing extension (the parent converts it, inferred, to influence 88 % with arrival speed 0.159 x average) over 12 frames. Here the stagger is one frame between the pair, done by dragging copied keys, with a first word that also exits through the bottom with three further keys; in the parent six pictures start 10 frames apart (sequenced with an offset helper, shown f012546) and none exits. Here Motion Blur is switched on (said; the switch itself is not shown); in the parent it is off (the switch column is empty, shown f012940). Here the items are point-text words in one style; in the parent they are six cut-out PNG pictures of a process.
source: 201iywIy74c 20.6–193 s
jobs: type; energy and impact; transitions
what it does for a beat: Reach for it when a title or intro line needs words that snap in quickly, spring slightly past their rest spot, and swap out for the next word without a gap. It is a cheap way to get a lively, smooth text intro with only a few keys.
what it looks like: Bold dark-grey sans-serif words on a pale grey, flat ground. A word drops fast from near the top of the frame to the middle, wobbles once or twice and settles; later it falls out through the bottom while the next word is already dropping in. With two words the second follows the first by one frame, so the pair reads as one smooth line. Motion blur smears the letters vertically while they move.

ingredients:
- Type tool, one point-text layer per word — built-in
- Expression on Position (overshoot that reads the arriving speed of the key before it) — built-in expression; the author supplies it in a pinned comment (full text under build notes)
- Keyframe Position + Easy Ease (F9) + Graph Editor speed graph — built-in; F9 is said, Graph Editor is shown (f002611, f003023)
- Motion Blur layer switch (and comp switch) — built-in; named by the narrator, the switch itself is not shown
- Layer duplication, U (show keyed properties), in-point trim — built-in; said, no menu shown
- A bezier-curve helper panel is open in every frame (a curve box reading 0.33, 0.00, 0.00, 1.00, a smooth-looking curve preset highlighted) — paid third-party; whether it was used on these keys is not said or shown (see unknowns)

steps:
1. Start from a pale grey 1920×1080 comp (its creation is not shown; inferred from the picture) and, with the Type tool, click and type one word in a bold sans-serif at about 103 px, dark grey fill, no stroke (said: type tool, word; shown f005582: 103.2 px, Bold, Fill on, Stroke off; fill and ground colours inferred from pixels).
   - Comp size: 1920×1080 (inferred: the centred position reads 960,540 at f001788/f002611)
   - Ground colour: about 242 on all three channels (measured f005582)
2. Re-centre the text layer so its anchor sits in the middle of the word, and the layer sits at frame centre (said "recenter the layer"; shown f005582 anchor −0.6, −36.3, which is the middle of the glyph block; the command used is inferred, for example Align or Pan Behind).
   - Position at rest: 960, 540 (shown f002611)
3. Paste the bounce expression onto Position: press P, Alt-click the Position stopwatch, paste (said). Expression text: see build notes (said, pinned comment). The layer's position field turns red once an expression is on (shown f002611).
4. Set up the entrance with two keys (said). First key at the layer's start, where Position y is moved well above rest; second key a few frames later at rest. Order as spoken (said, 0:47.9-0:55.9): set the first key at the start, move forward 3 or 4 frames, then change Y at the start. The first key is made at frame 0 at rest, 960,540 (shown f001569, f001617: one key at 0f, playhead 0;00;00;00). Which frame the second (540) key was created at is not visible; that it ends up as a rest key at frame 3 or 4 is inferred.
   - Second key: 3 to 4 frames after the first (said "three or four"; shown f002611 playhead on the second key at 0;03, graph label 03f)
   - Second key value: 960, 540 (shown f001788 as the reference value; f002611)
   - First key value: dragged from 540 up to 375, then 97 (shown f001697, f001761, f001788). Later frames read 102 (shown f003023, f005582), so the author nudged it; either lands the word a little under the top edge (inferred: about 9–10 % of picture height from the top).
5. Select both keys and press F9 (Easy Ease) (said). Open the Graph Editor and fit the graph (said). The speed graph then shows a bell that falls to zero at the second key (shown f002611). The bounce is dead at that point, because the expression takes its swing size from the speed the word has on arrival (said that it stops working, f002465–f002525 frames in motion; the cause is inferred from the expression).
6. In the Graph Editor, select the second key and drag its incoming handle left to lengthen it, then drag it upward so the speed at the second key is above zero (said both moves). On the way the handle passes a high setting, about 4,650 px/s (shown f002993, f003023), a stronger bounce with a softer landing, as the author says of any raised handle (said); that this setting is too high is inferred from the later, lower reading, not stated.
   - Final speed at the arrival key: about 1,350 px/s (shown f003053, f003078: handle y≈913 where the axis reads 1000 at y≈923 and 2000 at y≈893), about 0.3 × the average speed over the move (average about 4,380 px/s, 438 px in 3 frames; inferred from those two numbers).
   - Incoming influence at key 2: about 50 % of the 3-frame segment (measured f003053; inferred)
   - Outgoing influence at key 1: about 16 % (measured f003023: 21 px of 131; inferred)
7. Judge by eye how high to lift the handle: higher gives a stronger bounce but a softer landing impact (said). The author settles on a low point, "the sweet spot", at about 1,350 px/s (said at 1:41; shown f003053, f003078 after the graph is closed). Close the Graph Editor.
8. Trim the layer start by one frame (said "trim it by one frame"; direction shown f005732: the first word's bar starts about 1 frame after its first key, bar edge x≈71 against key x≈48 at 25 px per frame, so the in-point moved later and the frame-0 key sits before the bar; the next word's bar likewise starts a frame after its first key; in the 1920-wide frame the gap is about 10 px, about 1 frame). Switch on Motion Blur (said only as "turn on the motion blur"; the layer switch and the comp switch are inferred, neither is shown).
9. Add the exit. With the playhead where the bounce has settled, set a Position key at rest (said); go forward and lift the word slightly (said "a little bit, not a lot"); go forward again and drag it down off the bottom (said; shown f003841 y 764 mid-drag, final readings 1290.4 at f004826 and 1272.8 at f005732; these two figures are values read at different playhead times, not one setting). Select the three keys and press F9 (said).
   - Key times on the first word's layer, read from the timeline at f005732 (25.4 px per frame at full size): about 0, 3, 25, 30, 34 f (measured f005732 ruler: 0f at x 47, 25f at 681, 30f at 808, 35f at 935, 25.4 px per frame at full size)
   - Lift: a small lift, height not given. 535.4 is read by the text reader at f004298 (a blurred transition frame, unreadable on screen) and 543.3 at 2:09.6, so neither is shown; see unknowns.
10. Play and adjust the three exit keys by eye (said "play around with the key frames").
11. First duplicate (the left word): duplicate the first word's layer, press U to reveal the keys, delete the three exit keys on the copy, and slide the copy's entrance keys so it starts as the first word falls out (said; final offsets in step 13). Change the copy's text to a different word (said "swap it with something different"; f004481 shows the copy with an auto-numbered name). Put the playhead on one of its keys, select both of its keys and drag them left in X, so the rest X goes 960 -> 726 -> 688 (said "select both of them and drag it to the left", 2:41.0; 726 shown in the 2:41.0 readout, 688 in the 2:44.3 readout and f005732).
12. Second duplicate (the right word): duplicate that left-hand copy (said, 2:44.3), press U (said), select its entrance keys and drag them to the right in X (said "this time ... to the right"). Replace its word with a third word (said, 2:51.2). Its rest X reads 1073 at 2:53.2, then 1085.9 after adjusting (shown f005732). Result: three layers, the first word (keeps the exit, falls out through the bottom, rest X 960), the left word (rest X 688) and the right word (rest X 1085.9). The Position expression stays on all three (shown f005732).
   - Rest X for the left word: 688; for the right word: 1085.9 (shown f005732 properties panel and layer rows)
   - What those two numbers achieve, for other words: the pair reads as one centred title line, one ordinary word space apart. On the result frame the left word's ink spans about 581–795 px and the right word's about 832–1343 px of the 1920-wide comp, a gap of about 37 px (about 0.36 of the 103 px type size) with the line's centre at about 962 px, the frame's centre (measured on the result frame; the rule is our reading, inferred). With other words, place them by that rule (ink gap about 0.36 of the type size, line centred), not by 688 and 1085.9.
   - All rest at y 540 (inferred; shown f005582 text centred vertically)
13. Offset the right word's keys one frame later than the left word's (said "to the right by one frame"; measured f005732: the left word has keys at 32 and 35 f, the right word at 33 and 36 f; ruler 25.4 px per frame).
14. Preview (said). The result frame shows the word pair at rest with a neat dark line (shown f005582).

layout:
- Comp is 1920×1080 (inferred from the layer centre at 960,540). At f005582 the picture runs from x 930 to 2850 and y 270 to 1350 of the full-size frame (measured; edges of the pale comp against the dark panel).
- Rest line of the pair: about 39.9 % of the picture width wide (measured f005582, 383 of 960 px in the small frame), centred at about 50 % across and 50.4 % down (measured). Letter height: capital T about 6.9 % of the picture height (measured; matches 103 px type at 1080).
- Text colour: near black with a slight grey cast, about 34 on each channel (read by eye from f005582, not sampled; inferred). Ground: flat, no vignette or grain visible (measured: sampled 242, 242, 242 at one spot).
- Every word in the example is styled alike: same face, same size, same colour. The example has three word layers: a first word that falls through the bottom, then a pair side by side (shown f005732). In the example the bounce layers are all the same layer type, with one Position expression each.
- Bounce size from the expression's numbers (inferred): swing at the arrival key = arrival speed × 0.06, so with about 1,350 px/s about 80 px; the first swing peaks about 0.14 s after the key at about half that, about 40 px (about 4 % of picture height) below rest, then back above it; one wobble lasts about 0.56 s (about 17 frames) and the size has fallen to a few percent by then. Check against the picture: at f005357 (comp time 1;06) the pair sits 30 px below rest (position field 570.1 against 540), and a sheet cut at 185.6–186.1 s shows offsets of about 40–50 comp px. A 4,650 px/s build would overshoot about 3.5 times too far.
- Direction: the first word comes from above and drops to the middle; it falls down out of the bottom on exit (shown f001788 with the start key above rest, f005732 with exit values above 1080). The overshoot goes below rest first (inferred from the sign of the speed).
- Motion blur: seen only while moving; at f005357 the letters are smeared vertically, glyph edges run about 20–26 px beyond a letter's own top and bottom in comp pixels (measured). The entrance's speed curve peaks above about 5,000 px/s (about 167 px per frame) mid-move, but the speed at f005357 is not known, so no shutter angle can be derived from it; start at the default 180° and compare (inferred). The peak speed, not the arrival speed, sets the smear.
- The result frame f005582 is one still at rest, so smear and bounce are not visible in it; the preview loop around it is described under result.

timing and easing: Entrance: two keys 3–4 frames apart (said), easy ease with the incoming handle at the second key raised so arrival speed is above zero, final about 1,350 px/s (said; shown f003053). Exit: from the settled position, hold, then a small lift, then a drop through the bottom, three keys with easy ease (said F9); the five-key layout on the first word's layer is about 0, 3, 25, 30, 34 frames (measured f005732). The pair's keys sit at 32 and 35 f (first) and 33 and 36 f (second). Two-word stagger: one frame (said, measured f005732). Bounce numbers from the expression: amplitude 0.06, 1.8 cycles a second, decay 5 (said pinned comment; screen shows the expression is on Position).

variations: The sweet spot of the handle height is a taste call: higher gives a stronger bounce but softer impact (said). The same set-up works on objects and characters, not only words (said). Two or more words can be offset by a frame (said).

pitfalls: With a plain easy ease, the bounce stops, because the speed at the end of the move is zero (said, shown f002611 where the graph falls to zero at the second key). Trim the layer start by one frame so motion blur is already on at the first visible frame (said).

longest on: The Graph Editor work on the second key (making the bounce work again with a raised handle and finding the sweet spot), from about 1:07 to 1:42 (about 35 s). The second-word work taken as one topic (duplicate, move left, move right, offset, 2:17.7–3:04.7, about 47 s) is longer than the Graph Editor block; it is split here into about 16 s and 31 s only for step numbering. Others: the exit keys about 21 s (1:57–2:17), the expression paste about 10 s (0:37.7–0:47.9).

build notes: In After Effects, add a Position expression to each text layer (Alt-click the stopwatch). The pinned expression, copied word for word from the author's pinned comment (the description holds only an advert link):

```
n = 0;
if (numKeys > 0) {
  n = nearestKey(time).index;
  if (key(n).time > time) { n--; }
}
t = (n == 0) ? 0 : time - key(n).time;
if (n > 0) {
  v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);
  amp = 0.06; freq = 1.8; decay = 5;
  value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);
} else { value; }
```

(said, pinned comment). By script: `layer.property("Position").setValueAtTime(...)`, then `setTemporalEaseAtKey(k, [new KeyframeEase(speed, influence)], [new KeyframeEase(speed, influence)])`; Easy Ease is influence 33.33 with speed 0, and the raised handle is a non-zero speed on the incoming ease of the second key (units are px/s; use about 1,350 with influence about 50 as a start, inferred). Set `layer.motionBlur = true` and `comp.motionBlur = true`. Duplicate with `layer.duplicate()`, delete keys with `removeKey`. Position expressions need the keys to exist; with only one key the expression returns plain value. The curve-helper panel is a third-party panel and cannot be scripted from here. In-point trim: `layer.inPoint = layer.inPoint + comp.frameDuration` (inferred direction).

result: start=186.0 end=186.4 still crop=930,270,1920,1080 frame=f005582 (pair at rest, crop clean). Wider loop 185.6–187.3 s is a preview: pair blurred and dropping at 185.6, at rest 185.8–186.4, first word back 186.5–187.0, pair dropping again 187.3. The viewer's time display is frozen at 0;00;01;21, so redraws against the work area (about 23 f) are not counted here.
before: f001443 (first word at rest before any keys are set, shown with the expression window closed)
unknowns:
- Whether the bezier helper panel's smooth-looking curve (0.33, 0.00, 0.00, 1.00) was applied to these keys: it is highlighted on screen from the first frames but the narrator names only F9 (Easy Ease) and handle dragging.
- Text and ground colour values as typed in the app (only read from pixels).
- Font size is shown as 103.2 px; the name of the typeface is a paid-font name shown in the Character panel (not copied here).
- The exact final handle influence (read from the graph only; the speed of about 1,350 px/s is read at f003053).
- The final y value of the exit key (1272.8 and 1290.4 appear at different playhead times) and the exact lift height (535.4 and 543.3 are text-reader readings only; f004328 shows 960.0,540.0 on the 25f key).
- Whether the comp's Motion Blur switch and the shutter angle were set (not shown); the shutter, speed and smear cannot be tied together from one frame.
- Whether the played preview at the result window is the final pair or the first word alone: the preview time display held at 1;21 while the picture changed, and the viewer shows both. Only the crop's position, which held from 186.0 to 186.7 s on four cuts, is measured.

## Concentric gradient discs from a Repeater with eased scale and rotation
id: 02-repeater-hypnotic-background
status: proven (accepted by Joe 2026-11-25: rebuilt in After Effects on generated artwork from this recipe alone, reviewed against the tutorial's result and phone MP4s sent; he said "Accept all five")
source: 201iywIy74c 195–333 s
jobs: layout and repetition; texture; glow and colour; B-roll scenes
what it does for a beat: A calm, minimal animated backdrop for a title or explainer; it sits behind text that pops in with an overshoot bounce.
what it looks like: A pale-lilac field filled edge to edge with soft concentric rings. Each ring is a white-to-purple left-to-right gradient disc, larger than the one inside it, so the whole thing reads as a tunnel that slowly swells and twists.

ingredients:
- Ellipse path on a shape layer — built-in; ellipse tool from the toolbar's shape group (said, 3:31)
- Gradient Fill (linear) — built-in; fill type switched from solid in the layer's Properties panel (said; panel shown f006936–f007066)
- Repeater — built-in; Contents > Add > Repeater (said)
- Graph editor easing — built-in; F9 then drag handles (said)
- Hue/Saturation effect — stock; used for recolouring (said, 5:30; panel shown f010087)

steps:
1. Draw one circle in the centre of the comp, holding Shift for a true circle (said). Behind it is a near-white light grey ground (about F2F2F2, shown f006597; whether it is the comp background colour or a layer is not shown, inferred a plain background). Size 410 x 410, stroke none, centred at comp middle (position 960,540) (shown f006597 for 410 and 960,540; the comp is 1920x1080 inferred from those values)
   - Anchor/shape position recentred (said "recenter"). Before: layer Anchor Point -85,-17 and Shape Transform Position -85,-17, Shape Transform Anchor 0,0 (shown f006652). After: layer Anchor Point 0,0 and Shape Transform Position 0,0, layer Position 960,540 (shown f009514). The zeroing itself is not narrated and no click is seen; the final state is what matters: ellipse at 0,0 inside the repeater's 0,0 anchor, so the rings are concentric.
2. Change the fill from solid to Linear Gradient (said; shown f007066)
   - Gradient: left stop white, right stop hex C49FFF (RGB 196,159,255); the hex is typed with the editor open (shown f007066). Gradient runs left to right across the disc (shown f007739). Motion blur: not seen on (switch not visible); treat as off.
3. Soften the gradient's middle by editing the gradient's path handles: double-click the line of the gradient on the shape, then drag one end dot toward the left (said), and the other end dot the same way from its own side (said "the same thing with the other side"; its direction is inferred, outward toward the right) so the blend is smoother ( result shown f007739; precise handle positions not given)
4. Contents > Add > Repeater (said). 
   - Copies: 3 default, set to 10 (said; shown f008137/f008490)
   - Offset: 0 (shown f008490)
   - Composite: Below (shown f008490: default, never changed)
5. Open Transform: Repeater (the repeater's own transform, not the layer's) (said). It first shows Position 72,0 (shown f008490: copies fan out right); set Position to 0,0 so the copies stack in place (said; shown f008544 area)
6. At time 0 add keyframes on Scale and Rotation of the repeater transform (100%, 0°) (said; shown f008544)
7. Move forward in time (the second key sits at about 10 s 21 frames in the demonstration: comp time 0;00;10;21 shown f008968), raise Scale to 143.3% and Rotation to about 34.3° (scale shown f008968/f009379; rotation 0x+34.3° read in the full-size crop of f009379 (timeline reads 34.39) graph panel). The values were dragged to taste ("something like that").
8. Select all keys, F9 (Easy Ease), open the graph editor, fit graphs and drag the end handle left, then the other handle left (said; graph with steep start decaying to zero by the last key shown f009379). The curves are speed graphs: very fast early, long slow tail.
9. Squeeze the two keys closer together for a quicker look (said "squeeze in these keyframes"). Later frames show the second key at about 2.9 s (f009904, f010087: key marks at about 0 and 3 s).
10. Add text on top with the bounce pop-in from technique 01 (said; f009746 shows the word over the rings).
11. Optional recolour: Hue/Saturation effect, play with Master Hue (said). The panel starts at 0° (f010087); the author passes through about 162° (timeline, 5:30s) and lands on Master Hue 0x+91.0°, which turns the lilac rings pink (shown f010198).

layout: Comp picture in the full-size frame is x 984–2902, y 270–1350 (measured, f009514), i.e. 1918x1080, scale ~1920x1080.
- Base disc: diameter 21.4% of picture width / 37.8% of height (measured f007739; matches 410 of 1920). Centred.
- Ring radii at f009514 (viewer time 0;00;01;29 on the long keys), measured along the vertical and horizontal lines through the centre as shares of picture width: 0.107 (base disc), 0.136, 0.172, 0.216, 0.274, 0.346, then an outer edge near 0.43. So 6 to 7 rings are legible; each is about 1.26 times the one inside it. The factor per ring is the repeater scale at that moment (compounding per copy). It reaches 1.43 only when scale lands on 143.3%; on the later squeezed keys f010087 (1;25, scale 141.1%, rotation 32.6°) the ratio is about 1.41. The "143%" and these 1.26 describe the same picture at two moments of the swell, not two sizes.
- Start of the move (f009409, viewer 0;00;00;15): a single disc about 55% of the picture width across (largest copy radius about 0.275), with the ten copies bunched inside it, so the light-grey ground shows all round; scale per copy at that moment is about 1.11 (inferred from 0.275/0.107 over nine steps). By 1;15 (f009439) the rings fill the picture.
- Gradient and twist: each ring is the same white-to-purple gradient, but rotation compounds per copy, so the base disc is purple at its right while the outer rings are purple at left and bottom and nearly white at upper right (f009514). Colours measured at f009514 (display gamut caveat): bottom-left corner C8A4FF, just right of the base disc CFB5FE, upper-right corner FBFBFD.
- Rings overlap with hard edges and no shadow; each larger ring sits behind the smaller ones (Composite Below) (shown f008490).
- Ground: near-white light grey (f006597), covered by the rings once they swell (f009514).
- Every copy carries the effect; one layer, no shadows.
- Motion: animated. Viewer time reads 0;15, 1;15, 1;29, 3;18 across f009409–f009570 while the timeline stays at 0, so it is a running preview. Fast start, long tail: per-ring ratio is about 1.11 at viewer 0;15, 1.26 at 1;29 and about 1.42 at the end value, so about 26 % of the scale change has happened by 0;15 and about 60 % by 1;29. Twist direction: clockwise on screen with positive rotation; in f009514 the purple side runs from right (base disc) to lower right, bottom and left (outer rings) (shown f009514). The work area in f009514 runs from 0 to about 13 s (end marker about 13.1 s on the ruler). Speed from keys: scale 100%→143.3% and rotation 0→34.3° over the key gap (about 10.7 s on the first keys, about 3 s once squeezed); loop length in redraws was not counted.
- Recoloured variant (after step 11, f010198): same rings, pink (Master Hue 91°), lighter toward the upper right.

timing and easing: Two keys on repeater Scale and Rotation; start at 0 s, end about 10.7 s in the first demo (f008968) and later about 3 s after squeezing (f010087). Easy ease with the first-key handle pulled so the speed is high at the start and falls to zero at the last key; tooltip at first handle read speed 0 %/s influence 2.31% (shown f009379; read with the cursor on the handle, probably mid-drag). The very steep start implies the first key's outgoing handle was pulled to a very small influence (inferred); which handle "end handle" means in step 8 is not stated. Speed values not otherwise given.
variations: Squeeze the keys for faster movement; slow for hypnotic feel; recolour via Hue/Saturation Master Hue; pair with the bounce text.
pitfalls: Use the Repeater's own Transform, not the layer's Transform (said). Click directly on the gradient line when editing it or it may not work (said).
longest on: No single long stretch. Circle, recentring and gradient (3:28.6–4:19.0, about 50 s) is split into the ellipse tool, circle and recenter (3:28.6–3:48.7, about 20 s), picking the colours (3:48.7–3:59.3, about 11 s) and smoothing the gradient (3:59.3–4:19.0, about 20 s). The repeater block (4:19.0–5:13.1, about 54 s) is slightly longer; its longest part is the repeater transform and keyframes (4:33.8–5:13.1, about 39 s).
build notes: Shape layer > Ellipse 1 (Size 410,410) with Gradient Fill (Type: Linear), start point left, end point right, stops white and #C49FFF. Add Repeater: Copies 10, Offset 0, Composite Below; Transform: Repeater 1: Position 0,0, Scale 143.3%, Rotation ~34°, keyframed with ease. Gradient handle smoothing (step 3) is done by hand; in script, add a mid-point stop or adjust the gradient midpoint. Anchor Point of repeater is 0,0 so scaling is about the disc centre.
result: start=313.7 end=319.4 animated crop=984,270,1918,1080 frame=f009514 (viewer time 0;00;01;29; the picture changes across the whole window, so compare against this frame only)
before: f006597
unknowns: Exact gradient midpoint position after smoothing; exact handle influence values of the ease; loop length of the preview in redraws; real-time speed of the playback; text-free result window; comp size not displayed in the frames I viewed; motion blur switch not seen (treated as off).

## Long soft shadow from a blacked-out copy and a radial blur
id: 03-radial-blur-long-shadow
status: proven (accepted by Joe 2026-11-25: rebuilt in After Effects on generated artwork from this recipe alone, reviewed against the tutorial's result and phone MP4s sent; he said "Accept all five")
variant of: 12-long-soft-shadow (YBeMmC43Q1U #12)
differs: the same mechanism as the parent: a duplicate of the layer kept below the original, made solid black with Fill (parent step 3, Fill Color black, Opacity 100 %), then CC Radial Fast Blur with Zoom Standard (parent step 4), its Center dragged so the streaks run away from it (parent step 5, which gives the downward-right direction as inferred from the screen; here the same reading is inferred too). Differences: here the scene is one rounded 16:9 picture card on a near-white ground with a single shadow, where the parent has several pale bars and blocks around a title, each with its own shadow and its own Center (parent layout line); here Amount ends at 85 (shown f012268), where the parent uses 95 (parent step 4); here Center is 438,159 (shown f012268), where the parent shows 224.7,366.6 then 137.7,375.0 (parent step 5); here the layer Opacity is set to 35 % (said, T key, step 8), where the parent's section never shows the shadow layer's opacity or blend mode (parent unknowns line), and the roughly 70 % the parent mentions came from a proof build, not its video (parent build notes), so no difference is claimed against it; here there is no Gaussian Blur, where the parent adds Gaussian Blur 25.6 as a further step (parent step 6).
source: 201iywIy74c 337–437 s
jobs: shadows and light; depth and finish
what it does for a beat: Reach for it when a card, thumbnail or panel on a plain light ground needs to lift off the page with a long, soft, directional shadow, as a stronger and softer alternative to the stock drop shadow.
what it looks like: A rounded 16:9 picture card on a near-white ground. A pale grey shadow streams from its lower and right edges, fading out with distance and aimed away from a point up and to the left of the card; the card's edges themselves stay sharp.
ingredients:
- Duplicate of the artwork layer, renamed "Shadow" and kept below the original — built-in (duplicate step inferred; the rename is said)
- Fill — stock; effect applied to the shadow layer (said; panel shown f010972, f011003)
- CC Radial Fast Blur — stock; the effects search box shows it (shown f011188)
- Layer Opacity — built-in (said, T key)
steps:
1. Duplicate the artwork layer so two copies stand one above the other over a white background layer (said; layer stack shown f010701). Shortcut/menu inferred.
2. Rename the lower copy "Shadow" (said; shown f011003).
3. Switch the top copy's eye off while working so only the shadow layer is visible (said; shown f011003, top layer's eye off).
4. Apply Fill to the Shadow layer (said). It turns the card solid red at first (shown f011003).
   - Color: black (said; shown f011188, card solid black)
   - Opacity of Fill: 100% (shown f011188)
5. Apply CC Radial Fast Blur to the Shadow layer, below Fill in the effect stack (said; shown f011188 with the stack Fill then CC Radial Fast Blur in f011292).
   - Amount: raised until the black card smears out into a large grey halo; 93.3 at f011292 (shown), 91.3 when the centre is moved (shown f011392)
6. Drag the blur's Center (Center 438,159 already settled at f012000) to choose which way the shadow falls (said). The shadow streams away from the Center point (inferred from f011392 and the final frame).
   - Center: 865,540 mid-drag (shown f011392, still being dragged, not final); 438,159 as settled (shown f012134)
   - Zoom: Standard (shown f012134)
7. Switch the top artwork copy back on so the card sits over the blur (said; shown f012000).
8. Lower the Shadow layer's Opacity (said, T key).
   - Opacity: 35% (said; shown f012134 in the timeline)
9. Reduce the blur Amount a little for a shorter drop (said "85 should do").
   - Amount: 85 (said; shown f012268, landed, panel reads 85.0 with Center 438.0,159.0 unchanged). Passed through while dragging: 89.1 at f012198, 82.4 at f012240 (not final).
layout: All measured on f012334 cropped to the picture (comp 1920x1080; crop = viewer picture at 405,219 size 2976x1674 in the full frame, edges inexact by a few px).
- Card: about 32% of picture width and 32% of picture height (16:9 itself, ~415x230 on a 1280x720 view of the picture), centred (measured). Corners rounded, radius about 1–1.25% of picture width (measured: about 24 px at the top row, zero by about 30 px down, on the 2976-wide crop, f012334).
- Ground: near-white solid layer below everything, flat (measured).
- Shadow (reach figures are at the final Amount 85; at Amount 91.3, f012134, the reach is longer, about 21% right of picture width, approximate as the tail is faint, and about 28% down of picture height): only the one blacked-out copy casts it; the upper card sits unblurred at full size on top (shown). The copy is the same size and position as the card (shown f011003). Shadow extends right of the card's right edge by about 7.5% of picture width to the 2% grey level (10.8% to near white) and below the card's bottom edge by about 16.5% of picture height, widest at the lower right and also lapping the lower left; hardly any shadow shows above the card (measured on f012334).
- Darkness: sampled on f012334 (white = 0%): just under the card's bottom edge the grey is about 30% (pixel 179 at 16 px below, of 255), 24% (194) at 36 px, 15% (217) at 76 px, 5% (242) at 176 px, 2% (250) at 276 px; right of the card it is 187 at the edge, 217 about 70 px out, 252 about 320 px out (all on the 2976-wide crop; ground about 253). Nothing above or left of the card. 35% opacity of a black layer that has already been blurred fits this (inferred).
- Direction: the streaks run radially away from the blur Center, which at 438,159 lies up and left of the card, so the shadow falls down and to the right (shown f012134; the same direction in f011392 with Center at 865,540 is a looser halo around the card).
- The card has no drop shadow of its own and no other layer casts shadows; the artwork's own bevel and glow come from the artwork itself.
- This final card is the thumbnail artwork (letters, rounded blue card); the shadow is independent of what's on it, only the silhouette matters.
timing and easing: none given. All stills; no keyframes.
variations: Move the blur Center to choose the drop direction; change Amount for how far it falls; lower Opacity for subtlety (said). A paid plugin does the same with a gradient fill and light direction, applied in one step (said in passing; its settings are another technique).
pitfalls: none given. Seen on screen: with the top copy off, the bare blur looks like light rays (author remarks on this); the shadow reads right only with the card on top.
longest on: Dragging Center and Amount to place the shadow and then the opacity/amount tweak, about 6:10–6:50 of the video (roughly 40 s, f011091–f012288; this span also takes in the Fill and CC Radial Fast Blur setup, the Center/Amount drag is 6:15–6:30 and the opacity/amount tweak 6:34–6:50), then the before/after comparison (~5 s).
build notes: Duplicate layer, rename "Shadow", place under the original. Effects: Fill (Color black) then CC Radial Fast Blur (Center, Amount; Zoom Standard). Set the layer's Opacity to 35. Center is in comp pixels (1920x1080), about 438,159. Amount 85 (shown f012268); Center stays 438,159 (shown f012268, also f012000). Effect order matters: Fill above blur so the blur acts on black. Everything is scriptable; the on-screen Center position is by hand only for taste.
result: start=411.5 end=412.1 still crop=405,219,2976,1674 frame=f012334
before: f010701 (artwork on white, no shadow); f012309 area also shows the no-shadow state in the author's before/after
unknowns: The Fill colour's typed value is black by eye (swatch), exact values not read. The duplicate's menu path/shortcut is unseen.

## Hand-traced script word that draws itself and glows
id: 04-echo-stroke-text-reveal
status: proven (accepted by Joe 2026-11-25: rebuilt in After Effects on generated artwork from this recipe alone, reviewed against the tutorial's result and phone MP4s sent; he said "Accept all five")
source: 201iywIy74c 439–646 s
jobs: type; glow and colour; lines and shapes
what it does for a beat: A designer reaches for this when a short word (a greeting, a title) should look written by a glowing line on a dark ground.
what it looks like: A thin single-line script word, centred on black, is drawn stroke by stroke. Strokes have a pale, near-white hot core inside a gold halo; no brighter head or visible trail is seen in the played frames. A wide soft halo of the stroke's colour surrounds the word. The lines then un-draw in the same order, so for a moment the whole word is visible. The author shows gold first and later swaps to violet and mint green.

ingredients:
- Type tool plus a script-style font — built-in; font name and weight not shown (said that a different font is picked; script look is inferred from the result)
- Pen tool, shape layer with several separate stroke-only paths — built-in
- Trim Paths on the shape layer — built-in; Add menu of the shape layer's Contents (said)
- Echo — stock; effect on the shape layer (said; Effect Controls shown f018124)
- Deep Glow — paid (third-party plug-in); shown in Effect Controls f018525
- A bezier-curve preset panel (curve-preset panel) for key easing — extension (third-party); shown f018124

steps:
1. Make a comp of 1920×1080 with a black ground (shown f018525: layer position 960,540; the viewer at 100 % spans 960 of the 1920 small-frame px, i.e. 1920 full-frame px; picture pure black). Black ground itself is inferred, not said.
2. Type a short word with the Type tool and choose a flowing script font (said only that a different font is picked; "flowing script" and the weight are inferred from the result picture). The word here is a two-letter greeting. Centre it (inferred from the later result).
3. Select the Pen tool and draw over the letters as separate open paths, one path per pen stroke (said). Click for a corner point, click-and-drag for a curve point (said). Before the first path, turn Fill off and Stroke on (said; toolbar shown f014086). Stroke colour white, width 2.9 px (shown f015219 toolbar "2.9 px", white swatch in Shape 1's Stroke).
   - Each path must be started as a new shape inside the same layer: deselect the path (or click the layer) before the next first point (said, "within the same layer… start another shape"). Result: five shapes in one layer (shown f015219).
   - Paths run in natural writing order; the author mentions they will be re-ordered next.
4. Delete the text layer's text but keep the shape layer (said; the text is gone in f015219).
5. With the shape layer open, Add > Trim Paths (said that trim paths is added; menu not on screen, so the path "Add > Trim Paths" is inferred). One Trim Paths 1 sits below the five shapes (shown f018525).
6. Keyframe End (said): the narrator says to set a key somewhere later and change the first value to zero. Result: End 0 % at the first key (shown f018525, reads 0.0 %) and 100 % at the playhead after the second key (shown f016137). The reveal therefore runs 0 → 100 %.
7. Set Trim Multiple Shapes to Individually (said; shown f016137), so the five strokes draw one after the other and not all at once.
8. Re-order the five shapes in the stack so the strokes draw in writing order. The author's final stack is Shape 1 at the top … Shape 5 at the bottom (shown f018525); before it was Shape 5 at the top (shown f016137). Narrated reason: the reveal was running from the wrong end. The top shape draws first: Shape 1 (the first path drawn) is on top at f018525, and the played loop (cut from source every 0.25 s, 623.4–625.4 s) shows the first letter's curl, then its body, then the i last; on un-draw the first letter goes first and the i is last.
9. Key Start too (said): 0 % at the beginning, 100 % at the end. Move both Start keys later than the End keys by about 0.34 s (said "drag them forward"; spacing measured from keys: f018525 Start keys at 0.34 s and 1.69 s, End keys at 0 s and 1.35 s). While the Start and End keys were still lined up the layer showed nothing (said).
10. Ease the keys with a bezier curve with handle values 0.33, 0, 0, 1 (preset picked, shown f017183 and f017302, readout f018124; the narrator only says to apply a graph and that this one looks smooth). That it went onto all four keys is inferred: no frame shows which keys were selected or the Apply press. A 0.76, 0, 0.24, 1 curve is highlighted in the panel at f015219 before any Trim Paths exists; whether it was ever tried on these keys is not shown. The values 85.9 % and 97.0 % at about 48 % / 73 % through the spans (f019342) match this curve, so it is on at least the keys that showed them (inferred).
11. Pick the stroke colour: select all five shapes with Shift (said), change the stroke colour; the author starts at gold (typed value not shown; the swatch reads about 253,195,74 in the recording f019226, a saturated mid-tone from a screen recording that may be over-saturated from a wide-gamut display, so not a target).
12. Add Echo to the shape layer (said; shown f018124):
   - Echo Time: −0.013 s (shown f018124; the sign's meaning as trailing is inferred; it is under one frame of 0.033 s) — the author's earlier trials (−0.033, 0.333, 1.033) are passed-through values.
   - Number Of Echoes: 10 (said; shown f018124)
   - Starting Intensity: 0.15 (shown f018262/f018525; it was 1.00, then 1.08 on the way, the author says "decrease it so it's more subtle"; said)
   - Decay: 1.00 (shown f018124; untouched)
   - Echo Operator: Maximum (said; shown f018124)
13. Add Deep Glow on top of Echo (said; shown f018525, order Echo then Deep Glow in Effect Controls):
   - Radius: 500 first (shown f018525); later raised to 857 (shown f019226, readout 857.00).
   - Exposure: 1.00 first (shown f018525); later 1.10 (shown f019226).
   - Blend Mode (Style): Screen first (shown f018525); then "Add" (shown f019226). The narrator says to play with the blend mode; the final list shows Add.
   - Other settings left at default (shown f018525: Source Opacity 100 %, Unmult on, View Final Render).
14. The author floats sliding the key set later so the full word shows longer, then drops it ("this is perfect"); the keys do not move (f018525 and f019342 show the same positions). Not a step.
15. Optional restyle at the end (said): other colours — violet typed as hex C34CFF (R195 G76 B255) (shown f019226 dialog), then a mint green (typed value not shown; recording swatch ≈ 74,252,171 f019342, wide-gamut caution as above, not a target). The stroke width was dragged to 11 px and 5.4 px as tests (shown f019342, s645) and ended back at 2.9 px (shown source frame at 647.5 s, panel reads 2.9).

layout: Comp 1920×1080 (inferred from layer position 960,540, shown f018525). Measured on f018720 (viewer at 158.2 %, 1 comp px ≈ 0.79 px of the 1920-wide frame): the word's selection box is about 233 px wide and 152 px high (12 % of picture width × 14 % of height; measured); centred in the picture (box centre within 1 % of picture centre; measured). Stroke width 2.9 px (shown). The word is built of five open paths in one layer, one per pen stroke; the crossbar of the first letter and the i are separate strokes (measured on f018660/f018780: the i is drawn last and is the last to vanish).
  Each stroke carries the effect: all five are in one layer, so Echo and Deep Glow act on the group as one.
  Glow: a soft round halo of the stroke colour, centred on the word, visible out to about 190–240 px from the word's centre (about 18–22 % of picture height; measured on f018720 with Radius 500 and Exposure 1.00); at Radius 857 / Exposure 1.10 it is wider and brighter (f018906, f019226). The ground outside it is flat black. No shadows, no grain.
  Stroke core: the line itself reads pale yellow-white with a darker gold glow around it. The stroke colour is the typed gold; the light core is inferred to come from Deep Glow adding light over the thin gold line (Exposure 1.00, Screen), not from a different stroke colour.
  Brightness: strokes read even in brightness in frames cut at 623.65 and 624.1 s; no bright head, no visible trail (echo spacing is under a frame). Echo settings are as shown; their visible effect is slight.
  Motion: the top shape draws first: the first letter's curl, then its body, then the i; strokes overlap somewhat in time (part of the i appears at 624.1 s while the first letter's legs still draw), so it is not strictly one after another. On un-draw the first letter goes first and the i is last (f018660 whole word, f018720 first letter partly gone, f018780 only the i left). The Start trim follows 0.34 s behind the End trim, so a line of constant length travels, then the word is all there for a short moment. Speed per second is not given.
  The finished example on screen is the author's own build, the same layer; later colour swaps are in the same layer. Gold with Radius 500 is the version in the result window; the Radius 857, Exposure 1.10, Add version is seen only with selection handles (f018906). The word in the result window is the author's own build.

timing and easing: Four keys. End: 0 s (0 %) → about 1.35 s (100 %). Start: about 0.34 s (0 %) → about 1.69 s (100 %). Times measured from the key marker positions (f018525), start-to-end spans equal (1.35 s ≈ 40 frames at 29.97 fps). The curve with handles 0.33, 0, 0, 1 is shown (f017183, f018124); all four keys carrying it is inferred: a fast start and a long soft landing. The author mentions but does not do a later move of the keys.
variations: Another colour, stroke width, blend mode (said), glow radius/exposure (said), (timing was floated, not done). The author calls out the order of strokes as something to get right.
pitfalls: Strokes that start in the same shape will trim together; start each path as a new shape (said). If Trim Multiple Shapes stays on Simultaneously all strokes draw at once, and with Individually the stack order decides who draws first (said). If Start and End keys line up, nothing shows (said).
longest on: Setting up the Trim Paths reveal and conceal — order, offset, easing (8:28–9:38 ≈ 70 s). The pen-drawing of the strokes took ≈ 46 s (7:38–8:24), Echo ≈ 28 s, glow and colours ≈ 32 s.
build notes: Create a shape layer; add five Path groups (Shape 1–5), each with a Stroke (white, 2.9) and no fill; add Trim Paths to the layer's Contents (Trim Paths sits below the groups) and set Trim Multiple Shapes to Individually (property "Trim Multiple Shapes" = 2). Keyframe Trim Paths 1 "Start" and "End". Apply Echo (property names: Echo Time (seconds), Number Of Echoes, Starting Intensity, Decay, Echo Operator) then Deep Glow (Radius, Exposure, Style > Blend Mode). Paths must be hand-drawn; scripted, build them from the traced point lists (not given). The Flow easing is set by hand; use a temporal ease for the 0.33, 0, 0, 1 curve (see easing).
result: start=624.30 end=624.34 still (word fully drawn and holding only about 0.04 s; the mouse arrow is inside the crop at 624.29 s, beside the i, and the first letter's lower curl starts dimming by 624.36 s; the whole loop 623.6–625.2 s is animated) crop=1600,560,680,375 frame=source.mp4 at 624.30 s (cut from source; no mouse arrow, no handles, glow even; the whole word is inside: top of the first letter's curl at about y=685, lowest strokes (H's leg and the i's foot) at about y=930 in the 3840×2160 frame, so the crop's bottom edge y=935 clears them by about 5 px; word spans x≈1755–2125). Cuts at 624.30 and 624.34 s re-checked in round 6: both clean and whole.
before: f015219 (white thin word on black, five shapes, no trim yet)
unknowns: Font name; the exact path points; typed gold stroke value; timing figures between the keys beyond measured marker positions; whether Trim Paths direction was 100→0 or 0→100 for the Start keys (only the reading from the preview was used); the exact keys' frames after the later "move forward" step; the stroke colour of the white pre-colour paths in the result window is gold (not white).

## Frosted glass bar refracting a smeared gradient star
id: 05-glass-bar-refraction
status: proven (accepted by Joe 2026-11-25: rebuilt in After Effects on generated artwork from this recipe alone, reviewed against the tutorial's result and phone MP4s sent; he said "Accept all five"; the look review said partly (close), and he accepted it as it is)
source: 201iywIy74c 648–975 s
jobs: glow and colour; depth and finish; layout and repetition
what it does for a beat: A premium title or UI backdrop: a pill-shaped pane of frosted glass sits over a soft, flowing colour field and bends what lies behind it. Reach for it when text needs a rich, calm, frosted-glass ground.
what it looks like: On black, a streaky, blurred ribbon of blue, amber, red and pink flows horizontally. A rounded pill with a thin bright rim sits across it; inside the pill the colours are brighter, blurrier and shifted sideways, so it reads as refracting glass. A mirrored smear spills below the pill.
ingredients:
- Shape layer with Polystar (star) and linear gradient fill — built-in; star tool in the toolbar (said, 11:07)
- Expression on Rotation — built-in (said)
- Fast Box Blur — stock; Effects & Presets (said)
- Wave Warp — stock (said)
- Turbulent Displace — stock (said; added at the end only)
- Rounded Rectangle shape layer, duplicated; Size property linked by pick whip — built-in (said)
- Layer Styles > Inner Glow — built-in (said; menu shown f025145 region as right-click, layer styles)
- Adjustment Layer switch — built-in (said)
- Exposure — stock (said)
- Displacement Map — stock (said; screen f027118)
- Optional: a text-reveal preset from a paid pack for a white script word on top (said; the preset is not shown in detail)
steps:
1. Comp on black (shown f021690: black viewer). Draw a star with the star tool near the centre (said; its Shape Transform position reads -7,10 at f021690, shown).
   - Type: Star (shown f021690); Points: 8 (shown f021690)
   - Inner Radius 186.8, Outer Radius 128.3 (shown f021690). Stroke: none, Fill on. (shown f021690)
2. Change Fill from Solid to Linear Gradient and open the gradient editor; make four colour stops. (said; shown f021622)
   - Stop at 0 %: 55A4FF blue (shown f021192)
   - Stop at 30.5 %: FFC655 amber (shown f021409)
   - Stop at 64.7 %: FF5555 red (shown f021532; the author nudged the position, said)
   - Stop at 100 %: FF9090 pink (shown f021622)
   - Gradient runs left to right across the star (shown f021690). Author advises light colours (said).
3. Name the layer BG. Alt-click the Rotation stopwatch and type a time multiple for constant spin. (said)
   - Rotation expression: time*20 (said)
4. Add Fast Box Blur to BG. (said)
   - Blur Radius: 15 (said; shown f022966)
5. Add Wave Warp to BG. (said)
   - Wave Type: Uncircle (said 12:29; shown f022966)
   - Wave Height 200, Wave Width 200 (said; shown f022966)
   - Direction 0° so the smear is horizontal (said; shown f022966)
   - Wave Speed 0 (said; shown f022966)
6. Draw a rounded rectangle at the centre; Fill solid black; name it Bar. (said)
   - Size seen: 369 × 130 at that point; Roundness 158 (shown, timeline 13:00 frames; value read from the changed list)
   Layer order top to bottom: Edge (1), Bar (2), BG (3) (shown f027389 layer panel). The author also recentres the star layer and the Bar layer after drawing them (position/anchor edits; values not read). (shown/inferred)
7. Duplicate Bar and name the copy Edge. Link the two Size properties with the pick whip, Edge's Size following Bar's (direction inferred from the expression); unlock proportions to change only X. (said)
8. Animate the Size X: stopwatch on, squeeze narrow then widen later; select both keys, F9, and in the graph editor make a peak on the left of the curve (said; "fast-out" is not said). 
   - Size at comp time 0: 321 × 130 (shown f027213, key diamond on Size, pill measures 321 px). The later key value is unknown; the result pill measures ≈498 px at preview time 2;13, but the pill may still be growing there, so that is not known to be the end value. The values 56 and 501 seen in the timeline were passed while dragging, not keys. Exact key times: unknown.
9. On Edge: Layer Styles > Inner Glow. (said)
   - Blend Mode Screen, Opacity 75 %, Technique Softer, Source Edge, Choke 0 %, Range 50 % (shown f025413)
   - Colour: swatch is pale yellow with Size 5.0 at f025413 (shown); the author later says white (said, 14:11); set white.
   - Size: raised from 5 to 34.0 (final panel value 34.0, timeline note; said "bump up")
10. Collapse the Inner Glow property group in Effect Controls (said "close it down" at 14:18; Size stays 34.0, so the glow is not shrunk), then turn Edge's eye off (order: inferred). Turn Bar into an adjustment layer with its switch. (said)
11. On Bar add Fast Box Blur, then Exposure, then Displacement Map. (said)
   - Fast Box Blur Radius: 9.1 (shown f026847; narrator says about nine)
   - Exposure: 0.50 (shown f026847)
12. Displacement Map settings. (said)
   - Displacement Map Layer: the Edge layer, source "Effects & Masks" (said; shown f027118 "Effect"). Trap: the layer list defaults to Bar (shown), so pick Edge explicitly.
   - Use for Horizontal: Red (shown f027118); Use for Vertical: Green (shown f027118)
   - Max Horizontal Displacement: 68 (shown f027118; said "around 70")
   - Max Vertical Displacement: 46.0 (shown, landed f027360 and f027389; said 45; f027213 reads 40.0 mid-change)
   - Displacement Map Behavior: Center Map; Expand Output on; Wrap off (shown f027118)
13. Optional finish: tweak the star (e.g. Outer Radius ≈94, Inner ≈153) and add Turbulent Displace on BG (Displacement Turbulent, Amount 50, Size 100, Complexity 1) so the smear is less perfect. (shown f028978 panel; said)
14. Optional: white script text on top with a blur-up preset from a paid pack. (said)
layout: (Share measures are of the crop at the result frame, not the comp, because the viewer is at 225 % and clipped; measured.); where the colour sits against the pill: the lit colour mass is centred on the pill's height (its centroid about 50 % down the result crop, the pill's centre about 49 %), with colour both above and below the pill, and the row through the pill's centre lit across the pill's right two-thirds while its left third stays dark (measured on the result frame; this placement is what the star's position under the bar must give, inferred: the video does not show the star being placed for this frame)
- Pill: ~54 % of crop width, ~26 % of crop height, ends fully round, centred slightly left of crop centre (measured f027389).
- Rim: thin bright edge, widest and brightest on the lower-left curve, thin amber/white; top edge a faint blue-white hairline (measured f027389).
- Inside the pill: the left third is black (inferred: displaced image shifted away), colours brighter (exposure 0.5) and more blurred than outside.
- Outside colours: a fan of blue/amber above, pink/red mirrored below the pill's lower edge; in the 2045-wide crop a hard lower streak at the pill's bottom height (y≈685 of 1100) runs x≈170–1840 against pill x≈455–1575, about 14 % of crop width beyond each end; a hard upper streak at y≈237, well above the pill top (y≈405), runs x≈410–1700; a faint blue/amber smear sits above it (y≈120–235) (measured f027389). Streaks inferred to come from Wave Warp on BG, not from the bar.
- Black background, no grain.
- Bar is a single pane; Edge is hidden and only drives displacement. The rim seen is inferred to come from the displacement of Edge's inner glow acting on Bar's backdrop (Edge hidden).
- Finished example vs build: the finished clip at 16:00 shows the same pill with a white script word, a smaller star and turbulent displace; the hand-built state at 14:55 has the star at 128.3/186.8 and no turbulence.
timing and easing: Bar Size has keys narrow-to-wide, but key times are not shown (layer collapsed in f027213/f027389) and not said; the preview time display moving 0;00;01;19 (f027360) → 0;00;02;13 (f027389) is only where the preview had reached, not a key time. Graph editor: a peak on the left; influence not shown. Star spins at 20°/s from the expression. Wave Speed 0 so no wave motion.
variations: Change the star's points, radii and colours for different looks (said). Inner Glow size on Edge controls how much distortion appears at the rim (said). Move the star under the bar to get other effects (said).
pitfalls: Pick light gradient colours (said). Inferred (not an author warning): keep Edge in the comp with its eye off, because the Displacement Map reads it. The author wishes it had been 4K (said).
longest on: Bar and Edge setup with keyframes, about 55 s (13:00–13:55). Gradient colours about 38 s (11:24.8–12:02.8), Wave Warp about 20 s (12:27–12:49), displacement tuning about 24 s (14:44.9–15:09).
build notes: Shape Layer > Polystar; Gradient Fill with 4 stops; Rotation expression "time*20"; Fast Box Blur (ADBE Box Blur2); Wave Warp; Exposure; Displacement Map; Turbulent Displace. Edge→Bar link: Size on Edge with expression thisComp.layer("Bar").content("Rectangle 1").content("Rectangle Path 1").size. The adjustment-layer switch and graph editor ease are done by hand. Layer Styles inner glow can be added by hand.
result: start=913.0 end=916.0 animated crop=880,260,2045,1100 frame=f027389
before: f021690
unknowns: the exact Roundness/Size of the final pill; the displacement map layer's precise source at 14:49 (said Edge, effects and masks); the text preset's name and settings; the Bar-layer comp size; the true comp-share sizes of elements (viewer zoomed and clipped); easing influence values; a clean result frame is f027389 but cursor-free only at the crop shown; the star's exact start rotation.

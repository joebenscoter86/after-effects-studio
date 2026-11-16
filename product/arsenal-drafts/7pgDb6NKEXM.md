# Techniques from one video (11 recipes, all unproven)

Written by the channel learner from the video's narration and screen together, then checked against the video by a second reader. Every recipe here passed that check; none is in the plugin. `status: proven` means it was built in After Effects from the recipe alone, compared with the tutorial's own result, and accepted by Joe (0 of 11); `status: unproven` means it has not been.

Each step is marked `said` (narrated), `shown` (on screen; `fNNNNNN` is a frame in the local study folder, frame number divided by the video's frame rate is seconds) or `inferred` (our reading). The `source` and frame references are for checking and stay out of the plugin. Credits: `CREDITS.md`.

| # | Technique | Jobs | Check passed in round | Status |
|---|---|---|---|---|
| 01 | Window-light shadow map over a flat layout | shadows and light; depth and finish | 3 | unproven |
| 02 | Soft diagonal wipe-on for a shadow map | shadows and light; transitions | 3 | unproven |
| 03 | Graphics riding a spinning real object | layout and repetition; B-roll scenes | 3 | unproven |
| 04 | Swap a layer's photo and keep everything built on it | workflow | 2 | unproven |
| 05 | Seat a cut-out object with a soft, doubled drop shadow | shadows and light; depth and finish | 3 | unproven |
| 06 | Tuck graphics behind a person with an automatic object matte | layout and repetition; B-roll scenes | 3 | unproven |
| 07 | Key a rough, unevenly lit green backdrop with a machine-learning keyer | B-roll scenes; workflow | 2 | unproven |
| 08 | Stacked white discs that grow out of the centre with long soft shadows | depth and finish; shadows and light; layout and repetition; B-roll scenes | 3 | unproven |
| 09 | Soft lens blur at the frame sides plus fine grain | depth and finish; texture; B-roll scenes | 3 | unproven |
| 10 | Flat UI graphic on a glossy extruded plate | camera and 3D; depth and finish; shadows and light | 2 | unproven |
| 11 | Depth of field on a row of glossy plates (Advanced 3D camera) | camera and 3D; depth and finish | 2 | unproven |

## Window-light shadow map over a flat layout
id: 01-shadow-map-overlay
status: unproven
source: 7pgDb6NKEXM 10.6–65.3 s
jobs: shadows and light; depth and finish
what it does for a beat: Makes a flat title card or layout look as if it sits in a room with sunlight falling through a window: long soft diagonal shadows with light bands between them. Reach for it when a clean graphic looks too digital and needs contrast and a sense of place without any 3D.
what it looks like: A pale grid-paper background with a black brush-lettered title and small logos. Two broad grey shadow strips run diagonally from upper left to lower right, a large shadow fills the upper-right corner, and the white bands of "sunlight" between them are crossed by short grey bars, like window frames. The shadow darkens everything it covers, title included, and its edges are soft.
ingredients:
- Solid layer — built-in; Layer > New > Solid (the dialog is shown; the menu is not)
- Pen tool masks — built-in
- Multiply blend mode — built-in; layer Mode column
- Fill — stock; Effect > Generate > Fill (the Effects & Presets search shows it under Generate, cut from source at 68.6 s)
- Mask Feather — built-in
steps:
1. Start from a finished flat composition, 1920 x 1080 at 23.976 fps, holding the artwork (here one precomp of the title on a pale grid background, plus a separate adjustment-style layer above it). (shown f001501 for the size; f004721 for 23.976 fps)
2. Make a new solid the size of the comp. (said; Solid Settings dialog shown f001501)
   - Width: 1920 px, Height: 1080 px, Square Pixels (shown f001501, crop)
   - Colour: a mid grey (shown f001861; the Fill effect in step 7 decides the final colour, so this value does not matter)
3. With the solid selected, take the Pen tool and draw a long, narrow four-point mask that runs diagonally down to the right and gets wider the further it goes from its start; let both ends run well outside the comp. (said; pen tool active, mask shown f001861 and f002221)
4. Draw a second strip of the same kind parallel to the first, leaving a band of open space between them; that open band becomes the sunlight. (shown f002641)
5. Draw two small, thin parallelogram masks across the open band between the strips, roughly at right angles to the strips, so the light band is broken into window panes. (said "smaller rectangle ... in the middle to simulate a window"; shown f002641, blue masks)
6. Draw a fifth, large mask that covers the upper-right corner of the comp above the upper strip. (shown f002761; not mentioned in the narration)
   - All five masks: mode Add, Inverted off (shown f003892, crop of the mask list)
   - Mask order as built: strip, window bar, strip, window bar, corner shape (shown f002761)
7. Put the solid above the artwork and set its blend mode to Multiply. (said; Mode menu open with Multiply highlighted f003116; landed as Multiply f003892)
   - In the build the solid sits second, under the adjustment-style layer and above the artwork (shown f003892); in the pre-made version at 20 s it is the top layer (shown f001201). What the layer above does is not shown, so whether the order matters is unknown (inferred).
8. Add Fill to the solid and use its Color to set how dark the shadow is: any grey between white (no shadow) and black. (said; Fill controls shown f003619)
   - Fill Mask: None; All Masks: off; Invert: off; Horizontal and Vertical Feather 0.0; Opacity 100.0% (shown f003892)
   - Color: the narrator drags the picker while talking; the dialog shows #737373 at f003619 and #636363 at 60.8 s (cut from source), but neither is the value that lands. After OK the swatch reads about RGB 164 grey, #A4A4A4 (shown f003892 and f004061, measured from the swatch pixels). By 70.7 s, with nothing said, it reads about RGB 139, #8B8B8B (shown f004241, swatch pixels). That darker value stays to the end of the chapter (f004721) and is the one in the result, so use 139 (inferred: it is the last value on screen). It also matches the darkness of the pre-made version at 20 s (measured, see layout).
9. Feather every mask a little to soften the shadow edges. (said; select all masks and press F for Mask Feather, shown f003975)
   - Mask Feather: 42.0, 42.0 pixels on all five masks (shown f004061; 40 at f003975 was still being dragged)
layout: The result is the build (the same masks as f004061) with Fill 139, played back at 78.9–79.7 s; a settled Linear Wipe from technique 02 sits on the layer and clears nothing visible there. Geometry was measured on f004061 (picture 1714 x 960 px, clean, Fill 164) and darkness on the result frames. The pre-made version at 20 s (f001201, picture 1446 x 812) is a different file, given only as a reference below; these steps do not reproduce its geometry. Directions are given on the picture, with y going down.
- Shadow darkness (measured): lit paper about 249 grey. Shadow 136–137 in the result at Fill 139 (0.55 of the lit level, measured at 79.0 s across a 5 x 5 grid of samples) and 160 in f004061 at Fill 164 (0.64). Multiply with a grey Fill gives shadow = paper x Fill/255. The pre-made version measures the same 0.55. The shadow also darkens the black title and logos where it crosses them; they stay black.
- Coverage (measured): shadow covers about 57–60% of the picture and light about 35–41%.
- Strip angle (measured): the strip edges run down to the right at about 25–33° below horizontal in the build and about 45° in the pre-made reference (an edge-direction histogram of each frame). The window bars run roughly at right angles to the strips.
- Bands in the build, f004061 (measured along the picture edges, as shares of width W or height H): along the left edge, light 0–0.24 H, shadow 0.24–0.46 H, light 0.46–1.0 H. Along the right edge, shadow 0–0.65 H (the corner shape and upper strip), light 0.65–0.81 H, shadow 0.81–1.0 H. Along the top edge, light 0–0.08 W, shadow 0.08–0.24 W, light 0.24–0.38 W, shadow 0.38–1.0 W. Along the bottom edge, light 0–0.42 W, shadow 0.42–0.71 W, light 0.71–0.81 W, shadow 0.81–1.0 W. The large lower-left area is lit, the upper-right corner is in shadow, and two lit bands cross the middle diagonally.
- Window bars: two short shadow bars cross the lit band just above and around the title's left half and middle, each about 0.03 H thick and about 0.15–0.2 H long (estimated from f002641 and f004061). The pre-made reference has three or four such bars, which break its light bands into separate panes (f001201).
- Edge softness (measured, 10–90 % of the step across the edge): about 4 % of the picture height in the build (vertical crossings of about 44 px on f004061 at a 33° edge give about 37 px perpendicular, 3.9 % of H), from the 42 px feather in a 1080 comp; about 2.2 % in the pre-made reference, which is sharper. Pre-made reference, as a whole: same darkness as the result, strips at about 45°, three or four bars and sharper edges (smaller feather). Its band positions along the edges are: left edge, light 0–0.16 H, shadow 0.16–0.44 H, light 0.44–1.0 H; right edge, shadow 0–0.75 H, light 0.75–1.0 H; top edge, light 0–0.11 W, shadow 0.11–0.36 W, light 0.36–0.53 W, shadow 0.53–1.0 W; bottom edge, light 0–0.29 W, shadow 0.29–0.45 W, light 0.45–0.68 W, shadow 0.68–0.86 W, light 0.86–1.0 W. To aim at it, steepen the strips to 45°, add a bar across each light band and lower the feather to about 25 px (inferred from the softness).
- Background: pale paper with a fine grey grid and slight grain. That belongs to the artwork, not the shadow.
- The opening 10.6–17 s shows the same idea on other finished layouts (a dark title on a beige ground, f000721), with light patches at a similar diagonal.
timing and easing: none given (static). Technique 02 animates it.
variations: Any arrangement of masks works, so the window shape is free; the darkness is set with the Fill colour, anywhere between white and black. (said)
pitfalls: none given
longest on: Drawing the masks: about 18 s (28.3–46.6 s) on the widening strips and the small window bars, against 5–7 s each on the blend mode, the Fill and the feather.
build notes: By script, add a solid (`comp.layers.addSolid([0.5,0.5,0.5], name, 1920, 1080, 1)`), then add masks with `layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom")` and set "ADBE Mask Shape" to a Shape with four vertices, closed. Make each strip about 0.10–0.20 H wide at its start and wider at its far end, with both ends outside the comp. Set `maskMode = MaskMode.ADD` and Mask Feather ("ADBE Mask Feather") to [42,42]. Use `layer.blendingMode = BlendingMode.MULTIPLY`. Fill's match name is "ADBE Fill"; set its Color to [0.545,0.545,0.545] (139 grey), as in the result. To match the result, check the shadow-to-paper ratio (about 0.55) rather than the colour number, because paper that is not white changes it.
result: start=78.9 end=79.7 still crop=930,385,1690,940 frame=f004781 (the build at Fill 139, comp time 0:00:01:11 to 0:00:02:05 during a playback; pre-made reference: start=19.97 end=20.06 crop=790,316,1410,690 frame=f001201)
before: f001081 (same composition, shadow layer switched off: flat white grid, title and logos)
unknowns: The exact mask vertex positions, read here only from pictures. Why the Fill changes from 164 to 139 off-narration. The pre-made version has more window bars, a steeper angle and sharper edges than the build; its own mask and feather values are not shown. During 20.2–21.5 s the pre-made shadow pattern changes while the comp time stays at 0:00:04:09; what is being changed is not shown or said. The mouse pointer is inside the picture throughout the result window (at f004781 it sits on the title), so no fully clean frame exists for the build; f004061 is clean but falls during a pan, so it holds no window. The reference crop leaves out the bottom 12 % of the picture, because the pointer passes through there.

## Soft diagonal wipe-on for a shadow map
id: 02-shadow-map-wipe-on
status: unproven
source: 7pgDb6NKEXM 65.3–80.0 s
jobs: shadows and light; transitions
what it does for a beat: Brings window-light shadows into a shot as if the sun had just come out: the shadow sweeps across the layout along the strips over about a second instead of popping on. Use it on the opening beat of a title card that carries a shadow map.
what it looks like: On a pale grid-paper title card, grey diagonal shadow strips and window bars spread in from the lower left with a very soft leading edge and fill the frame towards the upper right within about three-quarters of a second, while the title fades in. They end at full strength over almost the whole frame.
ingredients:
- The shadow map from 01-shadow-map-overlay — a solid with five pen masks, Multiply, Fill, Mask Feather 42 (see the figures below)
- Linear Wipe — stock; Effect > Transition > Linear Wipe (inferred; the menu is not shown, the effect appears in Effect Controls f004241). The speech recognition hears "linear white"; the screen shows Linear Wipe, and the screen wins.
steps:
1. Build the shadow map first (01-shadow-map-overlay), so this recipe stands alone (shown f004061, f004241):
   - comp 1920 x 1080, 23.976 fps, pale grid-paper artwork with a black title
   - a comp-size solid above the artwork, blend mode Multiply
   - masks, all Add with Mask Feather 42 px: two long strips running down to the right at about 25–33° below horizontal and widening along their length, two short window bars crossing the light band between them, and one large shape covering the upper-right corner
   - Fill effect on the solid with Color about RGB 139 grey (#8B8B8B; swatch measured f004241) and Opacity 100%, which makes the shadow about 0.55 of the paper's brightness (measured on the result, see layout)
2. Add Linear Wipe to the same solid, below Fill in the effect stack. (said; shown f004241)
   - Defaults on adding: Transition Completion 0%, Wipe Angle 0x+90.0°, Feather 0.0 (shown f004241)
3. Turn Wipe Angle until the wipe edge lines up with your design. The author matches it to the window bars, so the edge runs roughly at right angles to the strips. (said: match the angle to the design; the angle lands at −49°)
   - Wipe Angle: 0x−49.0° (shown f004481, f004601)
   - To check the angle he scrubs Transition Completion to 44% and 52% with Feather 0: the upper-right part of the shadow is cleared and the lower-left part stays, along a straight edge that rises to the right at about 50° from horizontal (shown f004481, f004601)
4. Raise the wipe's Feather so the leading edge is very soft. (said "don't forget about the feather")
   - Feather: 139.0 (shown f004601)
5. Keyframe Transition Completion so the shadow wipes on. (said "keyframe the completion")
   - First keyframe at 0:00:00:00: 100% (shadow fully hidden) (shown f004721, timeline value at the current time)
   - Second keyframe about 1 s later (0:00:01:00 on the time ruler), shown with the hourglass Easy Ease icon (shown f004721; keyframe icons in a crop of a frame cut from source at 78.2 s)
   - Value at the second keyframe: about 0% (inferred from the picture). The settled frames at 79.0–80.0 s show full shadow (136 grey) right into the top-right corner (median of x 2560–2620, y 375–440 in full-size pixels). At 15% with this angle the corner would be clear or fading, because at 44% the wipe has already cleared the upper right (f004481). Effect Controls reads 15% during the playback (f004721, f004841), but that reading comes straight after a jump cut: at 77.3–77.4 s the author is still scrubbing Completion (0%, 4%); the Completion stopwatch is already blue (shown in a crop at 77.3 s), but the layer is collapsed, so the keyframes are not in view and nothing ties the 15% to the key. The first key is a plain linear diamond.
layout: Measured on frames cut from the playback (78.0–79.5 s), picture about 1730 x 973 px in the full frame:
- Final state (comp time after 1 s): shadow at 130–138 grey on paper at about 249 grey, the same 0.55 ratio everywhere I sampled, including the top-right corner. The wipe has cleared nothing visible: it reads as the full shadow map (measured over a 5 x 5 grid of samples on the frame at 79.0 s), which is why the second key is taken as about 0%.
- Strips run down to the right at about 25–33° (from 01). The wipe edge, measured at 44% without feather (f004481), rises to the right at about 50°, so it crosses the strips at roughly 80°. The edge therefore travels along the strips' length.
- Motion, in comp time (viewer timecode read in crops): at 0:00:00:05 the lower-left half of the frame already carries shadow and the upper right fades out over a very wide soft edge. At 0:00:00:11 shadow reaches past the title. At 0:00:00:17 it is almost complete. At 0:00:01:05 it holds still. The reveal travels from the lower-left corner towards the upper-right corner. Most of the change happens in the first 0.7 s, with the end eased.
- At the same time the title fades in letter by letter (at 0:00:00:05 the last letter is still missing). That animation is part of the artwork, not of this technique.
- The shadow-map geometry (bands, bars, edge softness about 4 % of the picture height) is as given in 01-shadow-map-overlay.
timing and easing: Transition Completion 100% at 0 s to about 0% at about 1 s; the second key is Easy Ease and the first is linear (shown f004721 keyframe icons). The ease's influence values are not shown.
variations: The wipe angle should follow whatever shadow design you drew. (said)
pitfalls: Remember the wipe's Feather, or the shadow arrives behind a hard straight edge (said; f004481 shows the hard edge at Feather 0).
longest on: Setting the wipe up, about 10 s (adding it, turning the angle and test-scrubbing Completion to check the edge, 67–77 s). The narration stresses matching the angle to the design and not forgetting the feather; the keyframes take about 1 s on screen.
build notes: `layer.property("ADBE Effect Parade").addProperty("ADBE Linear Wipe")`, then set "Transition Completion" (percent, 0–100), "Wipe Angle" (degrees, −49) and "Feather" (139) by display name. Keyframes: `setValueAtTime(0,100)` and `setValueAtTime(1.0,0)`; then on key 2 set an ease, for example `setTemporalEaseAtKey(2,[new KeyframeEase(0,33.33)],[new KeyframeEase(0,33.33)])`, and leave key 1 linear. Check the direction in a render: at 50% the shadow should remain in the lower left and be gone from the upper right. If yours is reversed, flip the angle by 180° (to 131°). At the end the top-right corner must be fully in shadow; if it is not, lower the second key.
result: start=77.6 end=79.0 animated crop=930,385,1690,940 frame=f004721
before: f004061 (the finished static shadow map before the wipe is added)
unknowns: The value at the second keyframe: about 0% read from the picture; Effect Controls shows 15% after a jump cut, and the key itself is never shown. Its exact time is also unknown (about 1 s, read from the ruler). The ease influence. Whether the fill grey changed from about 164 to about 139 on purpose: it changes off-narration between 67.7 s and 70.7 s. The mouse pointer is inside the picture throughout the result window, so no fully clean frame exists; f004721 has it just below the title.

## Graphics riding a spinning real object
id: 03-graphics-orbit-a-real-object
status: unproven
variant of: 04-carousel-by-rotation (YBeMmC43Q1U #04)
differs: the same mechanism as the parent: copies of one layer, each turned a fixed step further about an anchor point moved onto a shared pivot, with the ring spun by parenting it to a rotating parent. Pivot: here the centre of a photographed round object, below the frame (about 1.21 of the picture height down); in the parent an empty point inside the frame, left of the words. Copies: here twelve at 30 degrees, each a whole card (photo in a matte plus caption) gathered under its own master layer, duplicated and turned +30 degrees one at a time; in the parent 55 copies of one text layer at -6.5 degrees, spread in one drag across all selected copies. Both make about a full turn; the step is a design choice (card width against word height). Spin: here every master is parented to the object, which turns by a time expression (time * -20); in the parent the copies are parented to a null whose animation is not shown (rotation keys inferred).
source: 7pgDb6NKEXM 81.5–125.2 s
jobs: layout and repetition; B-roll scenes
what it does for a beat: Lets a real photographed object drive the motion: a cut-out wheel (or any round object) spins, and a ring of graphic cards fanned around its centre turns with it like a carousel. Use it for a "meet the team" or product-range beat that should feel physical rather than a plain slider.
what it looks like: On a very pale blue-white background, the top half of a cut-out bicycle wheel rises from the bottom edge. Portrait photo cards with white caption tabs stand around it like spokes, each tilted so its bottom points at the hub, and the whole fan turns slowly anticlockwise with the wheel.
ingredients:
- A cut-out photo of a round object (a bicycle wheel PNG with transparency) — your own footage
- Expression on Rotation — built-in
- Shape layers, text layers and a photo layer for one card — built-in
- Parenting (pick whip / Parent & Link column) — built-in
- Pan Behind (Anchor Point) tool — built-in
- Duplicate — built-in; Edit > Duplicate (inferred, the command is not shown)
steps:
1. Comp 1920 x 1080, 23.976 fps, 15 s, with a flat pale background layer. (shown f005524, project panel)
   - Background: very pale cyan-white, about RGB 236–239, 238–250, 242–251 (measured on a frame cut from source at 123.5 s)
2. Place the wheel photo so that only its upper half shows: its hub sits below the bottom of the frame, centred left to right. (shown f005772)
   - Anchor Point on the hub: 3157.7, 2236.2 in the photo's own pixels (shown f005772; this value belongs to that image, so put the anchor on your own object's centre)
   - Position: 974.0, 1316.5; Scale: 37.0 % (shown f005772)
3. Spin the wheel with an expression on Rotation: Alt/Option-click the stopwatch and type `time*-20`. (said; expression shown f005772)
   - This turns it 20° per second, anticlockwise on screen (negative). (inferred from the expression and shown on the result: the valve stem moves about 28° in 1.45 s, top moving left, see layout)
4. Build one card upright, centred above the wheel: a portrait photo on top and a white caption tab below it holding two lines of dark text (a bold name and a lighter role) with a short rule above them. Make the white tab the master and parent every other part of the card to it. (said "parent everything to one master graphic"; shown f006314, all parts parented to the tab)
   - Card parts as shown: the photo, a hidden shape used as its matte (eye off), two text layers, a short line shape, one more shape, and the white tab as master (shown f005524, f006314)
5. With the master selected, take the Pan Behind (Anchor Point) tool and drag the master's anchor point down onto the wheel's hub. (said "move the anchor point ... to the center of the rotation"; tool highlighted and anchor at the card centre in a frame cut from source at 105.6 s; anchor dragged below the frame onto the hub at 108.6 s, cut from source)
6. Select the whole card (master and its children) and duplicate it; the copy's children follow the new master. Give the new master Rotation +30°. (said "duplicate my work and offset the rotation"; shown f006954: copy rotated 0x+30.0°, swung clockwise to the right of the first card)
7. Repeat until the cards go all the way round: 12 masters at 0°, 30°, 60° … 330°. (said "revolve around the entire wheel"; f007482 lists masters up to the twelfth; the intermediate angles are inferred from 12 x 30° = 360°)
8. Select all twelve masters and parent them to the wheel layer, so they turn at exactly its speed. (said; Parent & Link column shows the wheel for every master, f007482)
layout: Measured on a frame cut from source at 123.5 s (picture 1560 x 876 px in the full frame, x 826–2386, y 324–1200). Shares are of the picture height H unless marked W.
- Wheel: hub at 0.51 W across and 1.21 H down (below the frame; the shown Position 974, 1316.5 gives 0.507 W, 1.219 H). Outer tyre radius about 0.62 H, so about the top 0.41 H of the wheel shows above the bottom edge. Tyre black, rim silver, thin spokes, one dark valve stem on the rim (measured with a circle fit to the tyre's top edge).
- Cards: about 0.30–0.34 H wide and about 0.40 H tall. The photo takes the top 70 % of the card, with one rounded corner (top right, from its matte); the white tab takes the bottom 30 %. Behind each card a faint paler panel shows, offset up and to the left, and it cuts across the photo's top-left corner. It is roughly the card's size, offset about 0.02–0.03 H, and reads as white at roughly half opacity (estimated by eye on f007422). It most likely comes from the card's extra shape layer, the one stacked above the short line in f006314 (inferred). Card centres sit about 0.89 H from the hub, and the inner (tab) edge about 0.68 H from it, which leaves a gap of about 0.06 H above the tyre (0.10 H in the static frame f006314). Measured.
- 12 cards at 30° spacing. Each is rotated so its bottom faces the hub, like spokes. About 6–7 show at once along the upper arc; the outer ones are cut off by the left and right edges.
- No shadows, no overlap between cards, flat background. In the build every card holds the same photo and caption.
- Motion: the wheel and cards turn together anticlockwise on screen (the valve stem and the cards move left across the top between 123.2 s and 124.2 s). 20° per second gives a card speed of about 0.31 H per second at the card centres. Nothing else moves.
- The opening clip of this chapter (81.5–87 s, f005021) is a different, pre-made comp: five or more cards, each with a different person and name, on the same kind of wheel. There the cards are parented through a null rather than to the wheel, and the soft drop shadows come from technique 05. It also turns anticlockwise.
timing and easing: Constant speed from the expression (−20° per second, linear); no keyframes.
variations: Any set of graphics can ride any real object that turns; the motion of the object motivates the graphics. (said)
pitfalls: none given
longest on: Building the master card and moving its anchor to the hub, about 12 s (98.5–110.3 s), just ahead of the rotation expression (about 10.6 s, 87.9–98.5 s). Duplicating with 30° offsets takes about 8 s and parenting about 6 s.
build notes: Wheel: set `rotation.expression = "time*-20"`, anchor point on the hub (for a centred PNG, `[w/2, h/2]` of the source if the wheel is centred in it), position [974, 1316.5] in a 1920 x 1080 comp, scaled so that the tyre radius is about 0.62 x 1080 ≈ 670 px. Card: make the white tab a shape layer and parent the other parts to it. Set the tab's anchor so that it lands on the hub (anchor = hub's comp position converted into the tab's layer space; with an unrotated, unscaled tab at position P and anchor A, set anchor = A + (hub − P) and position = hub). Duplicate the group 11 times by script (`layer.duplicate()` for the master and each child, then re-parent each child copy to its new master) and set the masters' rotation to 30·i. Parent the masters to the wheel last: setting `.parent` by script keeps their look at the current time, so do it at time 0, where the expression gives 0°, to keep the layer values clean.
result: start=123.05 end=124.4 animated crop=840,338,1530,850 frame=f007422
before: f005772 (the wheel alone, before any cards)
unknowns: The card's own sizes in pixels, its fonts, the photo matte's corner radius, the pale backing panel's size and opacity (read here only from the picture). The rotation values of copies 3–12 (inferred 60°…330°). Whether the master's tab or the photo is centred on the radius. What the adjustment-style layer at the top of the stack does, and what effects the wheel layer and the background carry (fx switches on in f006314 and f007422; no shadow or grade is visible in the result). The mouse pointer is inside the picture throughout the result window, so no fully clean frame exists; at f007422 it sits just left of the top card's caption tab.

## Swap a layer's photo and keep everything built on it
id: 04-swap-footage-keep-edits
status: unproven
source: 7pgDb6NKEXM 125.2–135.3 s
jobs: workflow
what it does for a beat: A time-saver, not a look. Once one card, slot or frame is fully built (transforms, masks or mattes, parenting, keyframes, effects), you put a different photo or clip into it without rebuilding anything.
what it looks like: The result is a before/after swap in the viewer: in a ring of portrait cards orbiting a bicycle wheel, the photo inside one card changes from a woman in an orange cardigan to a different portrait, while the card's position, tilt, crop window and caption stay exactly where they were. The author repeats it on several cards.
ingredients:
- Replace layer source by Alt/Option-drag from the Project panel — built-in; no menu used on screen (Layer > ... not shown)
- Scale property of the swapped layer — built-in
steps:
1. In the Timeline, select the layer whose photo you want to change (the card's photo layer, which sits inside the card build and is parented to its card) (said; shown f007542: the photo layer is highlighted in the layer list)
2. Hold Alt (Windows) or Option (Mac) and drag the new image from the Project panel onto the selected layer in the Timeline (said; shown f007602: drag in progress over the layer list with the add cursor; landed in f007722, where the layer's source name has changed and the card shows the new portrait)
   - The layer keeps its place in the stack, its parent, its position and rotation, and the window the photo is clipped to (shown f007902: the new portrait sits tilted inside the same card window; the parent column is unchanged)
3. Because the new image has different pixel dimensions, re-fit it: open the swapped layer's Scale and scrub it until the photo fills the card window again (shown f007722 / f007782; not said)
   - Scale: reads 16.0 % just after the swap (shown f007722, value under the cursor) and is scrubbed to 21.0 % (shown f007842: settled at 21.0, 21.0 % with no cursor on it)
4. Repeat on other cards with other portraits (shown f008082: three of the five visible cards now carry new photos; a second card's photo layer has a new source)
layout: Measured on f008082 (picture crop below, 1400 x 788). Five cards stand on an arc above a bicycle wheel. The upright centre card is about 17 % of the picture width wide and 39 % of the picture height tall (photo about 28 % of the height, white caption strip below it) (measured). The wheel's tyre is a circle about 70 % of the picture width across (fitted to the outer edge; the visible chord at the bottom edge is about 65 %), centred, its top at about 59 % of the picture height, its hub below the frame (measured). Each photo is clipped to a rounded window on its card (one corner clipped at 45 degrees); the swapped photo fills that same window after the swap (measured by eye on f008082). Background pale blue-grey. Nothing in the look is made by this tip: the cards, the arc and the wheel come from technique 03 (the orbiting graphics). The wheel has no shadow yet in this result (the background beside the tyre measures the same as open background, 241–246 against 243); the soft halo of technique 05 is added only after 135.3 s, so do not add one to match this frame (measured).
timing and easing: none given (no keyframes are touched; any existing keyframes stay on the layer — inferred from how Replace Footage works, not shown)
variations: the author says it works for a photo or a video clip (said)
pitfalls: The new image keeps the old layer's Scale, so if it is larger or smaller in pixels it no longer fits its window and Scale must be corrected (shown f007722–f007782; not said). Alt/Option must be held while dropping; a plain drag adds a new layer instead (inferred).
longest on: The repeated swaps: about 10 s on screen across at least three cards (125.2–135.3 s), with about 2 s on re-fitting Scale after the first swap (128.7–130.5 s, f007722–f007782). The stressed point is holding Alt/Option while dragging.
build notes: By script: `layer.replaceSource(newFootageItem, false)` on the AVLayer does what the Alt/Option-drag does; then correct `layer.property("ADBE Transform Group").property("ADBE Scale")` so the new image covers the old window (inferred, neither said nor shown: scale by old-width/new-width when the clipping window was sized for the old image). Effects, masks, track mattes, parenting and keyframes stay on the layer.
result: start=134.4 end=135.0 still crop=741,296,1400,788 frame=f008082 (the right-edge card still shows its small selection handles; every frame in this stretch has a selected layer, none is fully clean)
before: f007542 (crop 813,320,1533,862: the upper-left card still shows the woman in the orange cardigan, as do the other cards)
unknowns: The original Scale of the photo layer before the swap; whether the other swapped cards needed their Scale corrected; how the photo is clipped to its card window (mask, track matte or alpha matte: the layer shows a matte-type icon but its kind is not readable); the menu equivalent (Layer > Replace Footage is not shown).

## Seat a cut-out object with a soft, doubled drop shadow
id: 05-soft-doubled-drop-shadow
status: unproven
source: 7pgDb6NKEXM 135.3–160.6 s
jobs: shadows and light; depth and finish
what it does for a beat: When a photographed object cut out of its background (a product, a prop, a wheel) is dropped into a flat graphic scene and looks pasted on, a very soft, barely offset drop shadow gives it a dark halo that grounds it. Stack a second, even softer copy when the first is too faint.
what it looks like: A cut-out bicycle wheel, rim and tyre seen from the side with its hub below the frame, sits on a pale blue-grey background under an arc of portrait cards. After the effect a smoky grey halo hugs the black tyre on every side, darkest right at the rubber and fading out over a few percent of the picture, slightly heavier to the lower right.
ingredients:
- Drop Shadow — stock; Effect > Perspective > Drop Shadow (applied by typing its name in the Effects & Presets search, shown f008262; the menu path is inferred)
- a second Drop Shadow on the same layer (a duplicate of the first) — stock
- a cut-out photo with real transparency (a PNG of the wheel) — built-in footage
steps:
1. Select the cut-out object's layer (the wheel) and apply Drop Shadow (said; shown f008262: "Dr" typed in the Effects & Presets search with the wheel layer selected; the effect is on the layer below an existing Curves effect in f008562)
   - Shadow Color: black (shown f008562; default)
   - Opacity: 50 % (shown f008562; default, not changed)
   - Direction: 0x+135.0° (shown f008562; default, not changed)
2. Raise Distance well above the default (said: increase the distance; shown f008562)
   - Distance: 37.0 (shown f008562; the screen reader also caught 44.0 during the scrub, so it was dragged past and back)
3. Raise Softness massively (said)
   - Softness: 262.0 (shown f008802)
4. For extra darkness, duplicate the Drop Shadow so the layer carries two (said; shown f008802: "Drop Shadow 2" below the first, with the same Distance 37.0 and Softness 262.0 as the copy was made; the duplicate command itself is inferred, Ctrl/Cmd+D on the selected effect)
5. On the copy, push Softness to a very large value (said: max it out; shown f009021)
   - Drop Shadow 2 Softness: 1051.0 (shown f009021)
   - Drop Shadow 2 Opacity 50 %, Direction 135°, Distance 37.0, black: unchanged from the first (shown f009021)
layout: Measured on the result frame (cut from source at 149.0 s, crop 896,354,1694,953), in shares of the picture. The wheel: tyre outer diameter about 70 % of the picture width, from a circle fitted to the outer edge (the visible chord at the bottom edge is about 66 %), centred (centre about 50.5 % across), tyre top at about 59 % of the picture height, hub below the bottom edge so only the upper part of the wheel shows (measured). The wheel layer is scaled to 37 % in a 1920 x 1080 comp (shown f005592, technique 03), so the effect's values are in the wheel image's own pixels: 37 px distance is about 14 comp pixels, Softness 262 about 97 and 1051 about 390 comp pixels (inferred: effects render before the layer's scale). The shadow, measured as the background's brightness next to the tyre divided by the open background's (243 of 255): on the right side 0.60 at 0.4 % of the picture width from the rubber, 0.69 at 1 %, 0.79 at 1.8 %, 0.88 at 3 %, 0.91 at 4 %, 0.96 at 6 %, gone by about 8 % (measured). On the left side it is lighter: 0.74, 0.80, 0.84, 0.89, 0.93, 0.95 at the same distances (measured). Directly above the tyre: 0.74 at 0.5 % of the height, 0.85 at 3 %, 0.92 at 6 % (measured). So it reads as an all-round halo with a slight lower-right bias, not as a cast shadow. Only the wheel carries the shadow: the cards above it have none (the background just under the centre card measures the same as open background before the effect, f008142) (measured). The background is not flat: very slightly lighter at top centre (about 247) than at the corners (about 238), presumably from an adjustment layer at the top of the comp (the wheel layer sits under it; the layer above the wheel carries effects, f008562), which this tip does not build (inferred). The wheel layer also already carries a Curves effect above the Drop Shadows (shown f008562; values not shown; not part of this tip). The cards, their orbit and the wheel's spin come from technique 03. The finished example that plays at 151–160 s (a separate finished comp with different portraits, f009267; a rendered clip layer is switched on at the top of that comp, so the picture may be a pre-rendered clip rather than its live layers) measures the same halo on the tyre's right side (0.60, 0.70, 0.79, 0.88, 0.93, 0.97 at the same distances), so the build and the finished example agree.
timing and easing: none given (the shadow is static; nothing is keyframed)
variations: Use one shadow for a subtle seat; add the second, maxed-out copy only when more darkness is needed (said).
pitfalls: The author keeps it subtle: large distance only in the sense of moving off the default, and softness pushed far (said). Distance looked large in the panel but in the comp it is small because the layer is scaled down (inferred from the shown scale). On a spinning layer the shadow's offset turns with the layer, because the effect renders in the layer's own space; at this softness the turning should not be visible, but check it over a few seconds of the spin, not on one frame (inferred).
longest on: Setting the first shadow: about 11 s from searching for the effect to Softness 262 (135.3–146.7 s, f008116–f008802). The doubled copy takes about 3 s (147.7–150.4 s). The finished carousel then plays for about 9 s (151–160 s).
build notes: Effect "Drop Shadow" (match name "ADBE Drop Shadow"); properties Shadow Color, Opacity, Direction, Distance, Softness, Shadow Only, as After Effects shows them. Add it twice to the wheel layer; set the first to Distance 37, Softness 262 and the second to Distance 37, Softness 1051, both Opacity 50 % and Direction 135°. These values assume a layer image scaled to 37 % in a 1920 x 1080 comp; on a layer at 100 % scale, aim for the measured halo instead (about 14 px offset, darkness 0.6 of the background at the edge, fading out by about 6–8 % of the picture width), which is roughly Distance 14, Softness 100 and 390 (inferred). Check the halo against the layout figures after placing the art. Set Softness by value; whether the slider reaches 1051 or it was scrubbed past the slider range is not shown.
result: start=149.0 end=149.2 still crop=896,354,1694,953 frame=f008940 (cut from source.mp4 at 149.0 s; no kept frame is clean: the cursor sits on the wheel at 149.4–150.6 s and a render-quality label shows before 148.9 s; a small layer-handle square stays on the centre card's caption in every build frame)
before: f008142 (crop 733,293,1386,780: the same wheel and cards with no halo; small selection handles on the right-edge card)
unknowns: Values of the Curves effect already on the wheel; whether the cards in the finished example carry any shadow of their own (none measures in the build); the menu path for Drop Shadow (it was found by search); how the duplicate was made.

## Tuck graphics behind a person with an automatic object matte
id: 06-graphics-behind-subject-object-matte
status: unproven
source: 7pgDb6NKEXM 187.0–212.5 s (the last step, removing the matte from the background copy, lands at 212.5–214.7 s)
jobs: layout and repetition; B-roll scenes
what it does for a beat: For talking-head or presenter footage on a plain wall: cards, titles and text sit between the person and the wall, so the person stands in front of the graphics. Reach for it when overlays would otherwise cover the face or body.
what it looks like: A smiling young man in a checked shirt against a flat teal studio wall. Rounded promo cards (a navy one, a white one, a peach one) and two blocks of bold text fill the frame around him; where they meet his body they pass behind his shoulders and arms, and the wall behind them is still the original footage.
ingredients:
- Object Matte tool — built-in in recent After Effects releases (the narrator calls it new; toolbar button, shown f012085; the tool applies an effect named Object Matte to the layer)
- Layer panel (double-click the footage layer) — built-in
- a duplicate of the footage layer as a background plate — built-in
steps:
1. Put the graphics (cards, text, title precomps) in the comp under the footage layer, with the footage layer on top (shown f012644: footage on top, eleven graphic layers below it (layers 2 to 12: six text layers, three shape layers and two title precomps); said: place graphics behind the subject)
2. Double-click the footage layer to open it in the Layer panel (said; shown f011965: Layer panel open)
3. Pick the Object Matte tool in the toolbar (said: grab the new tool; shown f012085: the tool's button is highlighted)
4. Hover over the person: the area the tool will take shows as a magenta overlay; click to select the subject (said: select your subject; shown f011965 hover overlay, f012085 a magenta outline round him after the click). The panel's View switches to Object Matte (shown f012085)
   - The effect arrives with: Version 4.0, Fine-tune Object Matte on, Feather 5.0, Contrast 80.0 %, Shift Edge 0.0 %, Reduce Chatter 0 %, Render Refine Edge on, Refine Edge Matte Smooth 0, Feather 0, Contrast 0 %, Shift Edge 0 %, Chatter Reduction Off, Reduce Chatter 50 % (shown f012085)
   - The matte span covers 0:00:00:00 to 0:00:07:11 (7:12 long) (shown f012085)
5. Move the playhead forward and let the matte propagate through the span; a green bar reports progress (said; shown f012359: propagating 58 of 131)
6. Tune the matte so the edge sits inside the body (shown f012750, read on the duplicate made in step 8, which copies the original's effect; the moment of setting them is not shown; not said)
   - Contrast: 86.6 % (shown f012750)
   - Shift Edge: -69.0 % (shown f012750)
   - Reduce Chatter: 100 % (shown f012750)
7. Back in the comp, the cut-out person now sits over the graphics, on black, because nothing is under them (shown f012454)
8. Duplicate the footage layer and move the copy to the bottom of the stack as the background plate (said: use the original footage as a background plate; shown f012644: the copy is the bottom layer; the duplicate command is inferred, Ctrl/Cmd+D)
9. Delete the Object Matte effect from the bottom copy so it shows the full original frame (shown f012750: the effect selected on the copy; f012884: the copy's Effect Controls are empty and the teal wall is back; not said)
layout: Measured on the result frame (cut from source at 213.0 s, crop 872,306,1576,886, which leaves out about 1 % at each edge to avoid selection handles), as shares of the crop. The person is centred: shirt from about 28 % to 69 % of the width, head about 42–57 % across with its top at about 4 % from the top, body cut by the bottom edge (measured). Navy card: 12–37 % across, 9–37 % down. White card: 12–37 % across, 40–68 % down. Peach card: 60–85 % across, 9–37 % down. A three-line text block lower left, 6–30 % across, 73–93 % down; a two-line bold headline lower right, 67–97 % across, 72–91 % down (measured). Stacking that makes the look: the person's shoulder on the viewer's left covers the right edge of the white card, his arm on the viewer's left cuts the lower-left text mid-word, and his side on the viewer's right covers the first letter of the headline (measured). The matte edge is clean at full size: no teal fringe or halo along the shirt and arms (measured on a crop at full size). No shadows anywhere: the cards cast none on the wall and the person casts none on the cards (measured). The wall is the untouched plate: teal with a hot spot behind the person, brightest just to the viewer's right of the head, about 60–70 % across near the top (about RGB 147,206,211), a little darker at the viewer's right edge (about 130–138,194–199,200–206), darker again at the viewer's left edge (about 104,166,169) and darkest at bottom-left (about 76,133,136) (measured). The blue highlight box on the headline's first word, the dashed box, small cursor graphic and sticker in the lower-left block belong to the graphics' own design, not to the matte. The graphics' own designs, colours and type animation are not part of this tip; they come with the comp. The clip that plays at 187–196 s (f011607) is a separate finished montage with a different person and the same graphics; this build is not that clip.
timing and easing: none given for the matte. The graphics carry their own in/out animation (the cards and text build on as the playhead moves, 213.8–214.6 s), not built here.
variations: Any graphic can go behind the subject (said). The tool selects by object, not by colour, so the wall need not be a keying colour (inferred; the narrator's remark about a clip not shot as a green screen belongs to the next clip, technique 07).
pitfalls: After the matte is made, the area around the person is empty; without a plate under the graphics the comp shows black (shown f012454–f012704). A duplicate of the matted layer brings the matte with it, so the copy shows black until its Object Matte is deleted (shown f012704–f012884). Propagation only happens as the playhead moves through the span (said).
longest on: Building the stack and the background plate: about 8 s (206.8–214.7 s, f012426–f012884). Selecting the subject takes about 4 s (197.4–201.4 s) and propagation about 5 s (201.4–206 s). The finished montage plays for about 9 s at the start (187–196 s).
build notes: The Object Matte tool and its click-to-select cannot be driven by script; the tracking (propagation) is interactive in the Layer panel. By script you can only add the comp stack (graphics between the matted footage and a plain duplicate at the bottom) and set the effect's values once it exists: Feather 5, Contrast 86.6 %, Shift Edge -69 %, Reduce Chatter 100 % (names as the Effect Controls show them; match names not known). A scriptable substitute when the tool is unavailable: Roto Brush (also interactive) or a keyer if the wall is a flat colour.
result: start=213.0 end=213.4 still crop=872,306,1576,886 frame=f012780 (cut from source.mp4 at 213.0 s; the selected layer's anchor-point marker shows on the shirt's chest; no frame in this stretch is without it, and the cursor enters from 213.8 s)
before: f011845 (crop 932,380,1752,990: the same man in front of the plain teal wall, no graphics showing)
unknowns: When and how the matte values in step 6 were set; whether the subject selection needed extra clicks to add or remove areas; the graphics' own animation; the comp's background colour (black shows where nothing renders).

## Key a rough, unevenly lit green backdrop with a machine-learning keyer
id: 07-key-imperfect-green-screen
status: unproven
source: 7pgDb6NKEXM 212.5–243.3 s
jobs: B-roll scenes; workflow
what it does for a beat: For stock or found footage shot against a coloured wall that was never meant to be keyed (uneven light, olive green, shadows), when a classic colour keyer leaves grey residue. The person comes out clean, hair included, ready to sit over graphics.
what it looks like: A smiling woman with big curly hair making a peace sign against an olive-green studio wall that is bright on the left and falls into shadow on the right. After the key she stands alone on black with soft, natural hair edges and no green rim; her top, yellow-green before, turns peach once spill is removed. In the finished example she then stands in front of the same promo cards and text used in technique 06, on a pale blue gradient.
ingredients:
- a free machine-learning green-screen keyer plugin — free third-party plugin, not stock; installed separately, it appears under its maker's own submenu in the Effect menu (shown f013492); the narrator says it is free and links it in the description
- substitute: no stock keyer is offered in words. On screen the author first applies After Effects' bundled colour keyer (it shows as version 1.2; menu path Effect > Keying inferred: the Keying submenu is visible in f013492 but the keyer is never picked from it on screen) and removes it after it leaves residue (shown f013124, f013492). The finished example's footage layer also carries Object Matte and Advanced Spill Suppressor, both switched off (shown f014551)
steps:
1. Put the green-screen clip in the comp; hide the layers below it so the key shows against black (shown f013124: only the top adjustment layer and the footage have their eyes on; not said)
2. (Shown, not said) The bundled colour keyer, tried first, with its View on Final Result, Screen Gain 100.0, Screen Balance 50.0, Screen Pre-blur 0.0 and a green Screen Colour: the shadowed right side of the wall keys out, but the lit left side stays as a dark grey veil (about RGB 56,53,46 over black) (shown f013124). Remove it (shown f013492: the footage's Effect Controls are empty)
3. Apply the machine-learning keyer from its submenu in the Effect menu (said: drop it onto the footage; shown f013492: Effect menu open on the plugin's submenu)
   - Mode: Full Frame (shown f013627)
   - Alpha Hint: None, with a second menu reading Source (shown f013627)
   - Quality: 1024 (shown f013627)
   - Auto Crop: on (shown f013627)
   - Output: Cutout (shown f013627)
   - Despill Strength: 0.00 (shown f013627)
4. Wait while the plugin loads its model the first time (shown f013904: a loading dialog over the viewer at 40 %; not said). The key then appears: the person on black, hair edges soft, but a green glow on the outer hair and a green cast on the top (shown f014095)
5. Raise the spill suppression (said)
   - Despill Strength: 1.00 (shown f014360)
   - Effect: the green rim on the hair goes, leaving a faint brownish halo of wispy hair; the top shifts from about RGB 204,180,111 to 214,158,121, yellow-green to peach; skin is unchanged (measured on frames cut at 238.6 and 239.0 s)
6. Turn the graphic layers back on to place the person over them (shown 240.6–241.4 s: the eyes come back on; the graphics' order is the comp's own)
layout: Measured on the result frame (cut from source at 239.0 s, crop 958,390,1720,968), as shares of that crop. The woman stands a little left of centre: hair from about 30 % to 59 % of the width, top of the hair about 5 % from the top, her raised hand reaching to about 29 % across, body cut by the bottom edge (measured). Background black (empty comp). Edges: hair keeps soft semi-transparent wisps with no green; a faint warm-mauve halo about 1 % of the width wide remains round the outer curls (measured on a crop at full size). The source plate (f013627): olive green, about RGB 130,160,80 on the lit left and 70–95,100–130,30–50 on the shadowed right, the right side about 0.65 as bright as the left (measured) — this unevenness is what makes it a poor screen. The finished example that plays at 241.4–243.3 s is a separate finished comp (shown f014551; a rendered clip layer is switched on at the top of it, so the picture may be a pre-rendered clip rather than the live layers): the same keyed woman over a pale blue-white gradient, with three rounded cards behind her (navy and peach top, white below left), text lower left passing behind her arm, and a bold two-line headline lower right whose first letter overlaps her arm, the title layer sitting above the footage in that comp (measured on frames cut at 242.4–243.2 s; shown f014551). Its graphics and gradient come from the comp, not from this tip; placing graphics behind a person is technique 06.
timing and easing: none given for the key. The finished example's text types on over about 2 s (241.4–243.2 s); not built here.
variations: none given (the narrator only says spill suppression can be raised)
pitfalls: The plate is not a proper green screen (said). A classic colour keyer leaves the lit part of such a wall as a grey veil (shown f013124, not said). Despill at full strength also pulls green out of the subject's own colours: the yellow top turns peach (measured; not said). The model takes a moment to load the first time (shown f013904).
longest on: Applying the plugin and waiting for it: about 13 s (223.4–236.6 s, f013402–f014195). Showing the clip and the failed bundled key: about 11 s (212.5–223.4 s). Despill: about 3 s (236.9–239.3 s).
build notes: The plugin is third-party and must be installed before any script can apply it; its match name is unknown, so apply it by its display name from the Effect menu, or by script with `layer.property("ADBE Effect Parade").addProperty("<display name>")` once installed. Set Despill Strength to 1.0 and leave the rest at the values shown. If it is not installed, the stock route is the bundled colour keyer with Screen Colour picked from the lit part of the wall, followed by Advanced Spill Suppressor; expect to fight the uneven light (on this plate the stock key left a veil, f013124), so a garbage mask, a Screen Matte clip or a second key on the lit side would be needed (inferred). Object Matte (technique 06) is the other stock route; it ignores the wall colour altogether.
result: start=238.9 end=239.2 still crop=958,390,1720,968 frame=f014340 (cut from source.mp4 at 239.0 s; the selected layer's anchor-point marker sits on the right shoulder strap, ignore it in a comparison; kept frame f014360 at 239.3 s shows the same key but the cursor is on her face)
before: f013627 (crop 910,366,1706,962: the raw olive-green plate with the plugin applied but not yet rendered; cursor and a spinner at upper left)
unknowns: Whether the bundled keyer's Screen Colour was picked from the plate or left as found; whether any plugin setting other than Despill Strength was changed from its default; what the second Alpha Hint menu does; whether the finished example's Object Matte and Advanced Spill Suppressor ever took part in its look (both are off there).

## Stacked white discs that grow out of the centre with long soft shadows
id: 08-raised-white-shapes-with-long-shadows
status: unproven
variant of: 11-white-on-light-finish (YBeMmC43Q1U #11)
differs: the same finish as the parent (Gradient Overlay, Normal, Linear, 40 degrees, Align with Layer; Bevel and Emboss Size 5, angle 120, altitude 30, highlight and shadow both white in Screen at 100 %; a black, blurred copy under each white shape as its shadow, on a pale cyan left-to-right page), applied to a different scene and in motion. Scene: about eight concentric discs grow from nothing out of the centre, one pair (styled top, shadow copy below) after another, staggered in time, instead of the parent's still stack; each shadow copy is its own layer and grows with its disc. Shadow: here its settings are shown (CC Radial Fast Blur Amount 95, centre about 2.3 disc radii out to the left, Gaussian Blur 72.6, opacity about 21 %); the parent's video never opens its shadow layers, and its figures (Gaussian about 25, opacity 16 to 27 %, centre about 2 radii out) come from another recipe and its proof build. The shadows fall to the right of each disc and pile up so the right third of the frame goes grey, where the parent's fall left and down. Gradient stops: #F1F6F8 to #D7E0E4 here, #F1F5F7 to #DAE1E7 in the parent.
source: 7pgDb6NKEXM 243.3–326.8 s
jobs: depth and finish; shadows and light; layout and repetition; B-roll scenes
what it does for a beat: A title or opener background that makes a near-white frame look premium and tactile: white discs swell out from the centre one after another, each one raised off the one below with a pale rim and a long, soft shadow to one side. Reach for it when a clean white brand look needs depth and slow motion behind type.
what it looks like: A pale cool-white frame filled with concentric white discs, about eight, the smallest in the middle; on the right half each inner disc reads a little lighter than the one beneath, while on the left all faces are nearly the same white. Every disc has a thin bright rim and casts a soft grey shadow that streaks off its right-hand edge onto the disc below, so the right half of the picture reads darker than the left. In the finished example a black hand-lettered title sits over the centre (that title is a ready-made graphic, not part of the technique).
ingredients:
- Shape layer with an Ellipse — built-in; ellipse tool (shown f015331: Ellipse 1 inside Shape Layer 1, ellipse tool active)
- Layer Styles > Gradient Overlay — built-in; right-click layer > Layer Styles > Gradient Overlay (said; context menu shown 266.0 s, f015960)
- Layer Styles > Bevel and Emboss — built-in; same menu (said; shown f017124 area)
- CC Radial Fast Blur — stock (ships with After Effects); found by typing its name into the Effects & Presets search box (search shown 296.0 s, f017760; effect shown applied f018120)
- Gaussian Blur — built-in (said; shown f018540)
- A solid background layer — built-in (shown f016264, named generically here as "the background")

steps:
1. Work in a 1920 x 1080 comp at 23.976 fps, about 10 s long, over a pale cool-white background solid. (comp rate shown f015631; 1920 x 1080 inferred from the default position 960,540 shown f015331 and the radial blur centre values; length inferred from the timeline ruler, shown f016614)
   - Background: a horizontal ramp from about RGB 233,239,242 at the left to 240,251,252 at the right (measured on f015331). The solid carries an effect the video never opens (fx switch shown f015631); a left-to-right gradient ramp such as Gradient Ramp or 4-Color Gradient gives this (inferred).
2. Draw a circle with the ellipse tool, centred in the comp. (said: "create any shape"; shown f015331)
   - Position 960,540, Anchor Point 0,0 (inferred: the on-screen reader logged these values near f015331, and the circle sits centred in the frame there)
   - Size: at 100 % scale its diameter is about 0.84 of the comp height (about 900 px). (measured on 276.9 s, f016614: 384 of 834 viewer pixels wide at 97.9 %)
   - Fill white, no stroke (shown f015331: toolbar Fill swatch white, Stroke swatch crossed out)
3. Animate Scale from 0 % at 0 s up past full frame, so the disc grows from a point until it covers the whole picture. (said; shown f015510 at 258.5 s: Scale 0.0,0.0 % with a keyframe at 0 s)
   - Second keyframe: ends at about 5.0 s in the final layout (shown f016614: keyframes at 0 s and about 5 s); it was first set near 3 s and dragged later (shown f015570, f015631).
   - End value: not shown. The disc reads 97.9 % at 1:20 (1.83 s) with the end key at 5 s (shown f016614), which with linear interpolation means about 265–270 %; 191.5 % at 2:23 with the key at about 4.1 s (shown f015631) gives the same figure. So the end scale is about 265 %, a diameter about 2.2 times the frame height, past the frame corners. (inferred)
   - Interpolation: linear keyframe icons; the two readings above are consistent with a constant rate. (inferred)
4. Duplicate the shape layer. Call the upper copy "top" and the lower one "bottom". Both keep the same scale keyframes. (said "duplicate"; names shown f016264; Ctrl+D shortcut inferred)
5. On top: Layer Styles > Gradient Overlay. (said; shown f016264)
   - Colors > Edit Gradient: stop at 0 % #F1F6F8 (a very light grey-blue) (said as "very light grayish blue"; shown 273.6 s, f016416); stop at 100 % #D7E0E4 (a slightly darker blue-grey) (said; shown 276.0 s, f016560)
   - Angle: 40° (said "adjust the angle, not necessary"; value shown 279.0 s, f016740; tried 22° first)
   - Blend Mode Normal, Opacity 100 %, Gradient Smoothness 100 %, Style Linear, Reverse Off, Align with Layer On, Scale 100 %, Offset 0,0 (shown f016264; left at defaults)
6. On top: Layer Styles > Bevel and Emboss, then turn both its light and its dark side white. (said; shown 290.5 s, f017430)
   - Style Inner Bevel, Technique Smooth, Depth 100 %, Direction Up, Size 5.0, Soften 0.0 (shown f017430 and f017283)
   - Use Global Light Off, Angle 120°, Altitude 30° (shown f017430)
   - Highlight Mode Screen, Highlight Color white, Highlight Opacity 100 % (said "both opacities to 100 %"; shown f017430)
   - Shadow Mode Screen (said), Shadow Color white (said), Shadow Opacity 100 % (said; shown f017430)
   - Result: a thin bright rim all round the disc, no dark bevel edge. (inferred from the settings; visible on the result f019620)
7. Hide top (eye off) while working on bottom. (not said; shown f017565)
8. Make bottom black: with bottom selected, click the toolbar Fill swatch and set #000000. (said "make it black"; Shape Fill Color dialog at 000000 with bottom selected, shown 294.0 s, f017640)
9. On bottom: Effect > CC Radial Fast Blur. (said; shown 302.0 s, f018120)
   - Amount: 95.0 (said "like 95"; shown f018120; it opened at 87 before being set)
   - Center: -13.6,569.2, entered as given in the layer's own unscaled space: about 974 units left of and 29 below the disc centre (default 960,540). It scales with the layer, so it sits near the comp's left edge only at about 98 % scale (inferred from f018120) and moves further left as the disc grows; the black disc streaks out to the right. (said: move the point to make a long drop shadow; shown 313.0 s, f018780; passed 17.8,569.2 on the way, f018120)
   - Zoom: Standard (shown f018780)
10. On bottom: add Gaussian Blur after the radial blur and raise it. (said; shown f018780)
    - Blurriness: 43.3 first (shown f018780), then 72.6 (shown f019016). Use 72.6.
    - Blur Dimensions Horizontal and Vertical; Repeat Edge Pixels on (shown f018780)
11. Lower bottom's Opacity until the shadow sits softly on the background. (said; shown 314.5 s, f018870: 21 %; the value was dragged through 46 % and the timeline also read 16 % and 20 % on the way)
    - Opacity: about 20 % (shown f018870; final value between 20 and 21 %)
12. Turn top back on. Order: top directly above bottom. (top eye on shown 313.0 s, f018780; order shown f016264)
13. Select the pair (top and bottom), duplicate it, and stack each new pair above the previous one. Repeat until there are eight pairs. (said "duplicate this circle a lot of times"; shown 315.5 s, f018930 and 325.5 s, f019530: eight pairs, highest number on top)
14. Offset each new pair later in time than the one below it, like a staircase, so the newest (top) disc starts last and so is the smallest. (said; shown f019530)
    - Offset: about 0.6 to 0.8 s per pair, dragged by hand and uneven; the eighth pair starts at about 4.8 s. Measured starts: about 0, 0.66, 1.37, 2.12–2.16, 2.86–2.93, 3.45–3.54, 4.04–4.15, 4.67–4.79 s (two readings of the same timeline; the last pair starts nearer 4.7 s). (shown / measured on f019620 timeline)
15. (Finished example only) Turn on the title layer and move it to the top of the stack. (not said; shown f019530: title layer 1, eye on; it sat hidden at the bottom during the build, f015631)

layout: Measured on the frame without the title at 323.0 s (comp time 3:15, f019380, picture crop 661,243,1296,729) and on the result frame f019620 (comp time 4:07). Discs are concentric on the frame centre. At 3:15 the visible disc radii are about 0.04, 0.17, 0.34, 0.51, 0.67 and 0.82 of the picture height (measured), and the outer discs run past the frame; at 4:07 they are about 0.19, 0.32, 0.49, 0.66 and 0.82 H (measured). Neighbouring edges are about 0.15 to 0.17 H apart (measured), slightly closer towards the outside. Each newer disc lies on top of the older, larger one. The light: each disc has a thin bright white rim (the white bevel, step 6) and a face that is very slightly darker toward the upper right and lightest toward the lower left, about 229–231 grey at the top against 238–240 at the bottom-left away from shadows (measured on f019380; the 40° gradient overlay, step 5). Each upper disc's top and bottom edges also carry a short shadow, about 204–214 just outside against 229–238, fading within about 0.04 H (measured); it comes from the same radial-blurred black copy and needs no extra step. The shadows: each disc's own black, radial-blurred copy streaks outward to the right from the disc's right edge onto the disc below. On the horizontal centre line the surface just past a disc's right edge reads about 168–189 (0–255 grey), against 205–235 on the lit faces and about 238 on the open background (measured on f019380). So a shadow darkens what it falls on by roughly 20–28 % at its darkest, and it fades out over about one ring spacing (about 0.15 H) (measured). The left edges show no shadow. Because the shadows pile up, the right third of the frame is visibly greyer (about 190–215) than the left third (about 235–240) (measured). The background is not flat: it runs left to right from about RGB 233,239,242 to about 240,251,252, lighter and slightly more cyan on the right (measured on f015331), most likely a gradient effect on the solid (inferred; the effect is never opened). In the result it is almost all covered by discs, so it shows mainly in the first second. Motion: every disc grows from the centre at a constant rate, its radius increasing by about 0.22–0.23 H per second (0.42 H at 100 % times 265 % over 5 s gives 0.22; measured 0.23 H/s on one disc between 323.0 s and 327.0 s), and a new one appears every 0.6–0.8 s; nothing else moves. The black hand-lettered title (about 0.27 H tall caps, centred) with a small grey subline and a row of badges is a ready-made graphic from the finished example, not made by any step here; in a later shot (342.6 s) it carries an Invert and a soft Drop Shadow (see 09).
timing and easing: Scale 0 % at 0 s to about 265 % at about 5.0 s, linear (inferred from two readings). Pairs staggered about 0.6–0.8 s apart (measured). Comp at 23.976 fps. No eases shown.
variations: Any shape and any animation can be used (said). The gradient angle is optional (said).
pitfalls: none given
longest on: The gradient overlay: picking and adjusting its two colours and angle takes about 20 s of screen time (264–281 s), longer than any other part (the bevel takes about 10 s, the black copy with radial blur about 13 s, the gaussian blur and opacity about 11 s, the duplicating and staggering about 12 s). The author stresses the long drop shadow made by moving the radial blur centre.
build notes: Layer styles cannot be added through scripting properties directly; apply them by menu command (Layer > Layer Styles > Gradient Overlay / Bevel and Emboss) through app.executeCommand on the selected layer, then set the values under the layer's "Layer Styles" group. The effect match names "CC Radial Fast Blur" and "ADBE Gaussian Blur 2" are the usual ones. CC Radial Fast Blur's Center: enter the value as given, -13.6,569.2. It is in the layer's own unscaled space (its default 960,540 is the disc centre), i.e. about 974 units left of and 29 below the disc centre, and it scales with the layer; it lands on comp x ≈ 17.8 only at about 98 % scale (shown f018120). Do not solve for a layer value that hits a fixed comp point at another scale: that puts the centre too near the disc and shortens the streaks. An earlier rebuild of a similar look in this library found Amount steep: about 95 to 97 gives a long streak, 80 gives almost none. Duplicate the top/bottom pair with layer.duplicate() and offset startTime (or the keyframes) by about 16 frames per pair.
result: start=327.0 end=327.05 still crop=785,316,1488,836 frame=f019620
before: f015510 (258.5 s: Scale keyed at 0 %, so the viewer shows only the empty pale background; f015331 shows the one flat white disc before any styles)
unknowns: The end value of the scale keyframe (about 265 % is inferred, not shown); whether either scale keyframe is eased; the background solid's effect and exact colour; the ellipse's exact pixel size (measured only); the final opacity of the bottom copies, between 20 and 21 %; whether every bottom copy carries Blurriness 72.6 (the original and the second copy do, f019016 and 318.98 s). The result window is only a moment long because the recording pans before and after 327.0 s; 323.0 s (crop 661,243,1296,729) shows the same discs without the title, but it is a passing zoom too.

## Soft lens blur at the frame sides plus fine grain
id: 09-edge-lens-blur-and-noise-finish
status: unproven
source: 7pgDb6NKEXM 326.8–343.0 s
jobs: depth and finish; texture; B-roll scenes
what it does for a beat: A last pass that makes a clean, drawn graphic look as if it was shot through a lens: the left and right sides go slightly soft while the centre stays crisp, and a little grain breaks up the flat digital fills. Use it on any finished graphic or title plate, especially pale ones where the cleanliness gives away that they are drawn.
what it looks like: The white-disc title plate from 08: the centre, where the title sits, stays sharp; the disc edges near the left and right sides of the frame are visibly softer; the whole picture carries a faint fine grain.
ingredients:
- Adjustment layer — built-in; Layer > New > Adjustment Layer, Ctrl+Alt+Y (named "adjustment layer" in speech; menu with the shortcut shown 328.6 s, f019716)
- Camera Lens Blur — built-in (said "camera lens blur"; shown 332.5 s, f019950)
- Ellipse mask in Subtract mode with feather — built-in (said "masking tools … subtract"; shown 335.6 s, f020136 and 340.0 s, f020400)
- Noise — built-in (said "noise effect"; shown 341.5 s, f020490)

The scene it finishes (from 08, so this recipe stands alone): a 1920 x 1080, 23.976 fps comp on a pale cool-white background ramping left to right from about RGB 233,239,242 to 240,251,252. Eight or more concentric white discs grow from the centre, each a pair of layers: a top copy with a Gradient Overlay (#F1F6F8 to #D7E0E4, angle 40°) and a Bevel and Emboss (Inner Bevel, Smooth, Depth 100 %, Size 5, angle 120°, altitude 30°, highlight and shadow both Screen, white, 100 %), and below it a black copy with CC Radial Fast Blur (Amount 95, Center entered as -13.6,569.2 in the layer's unscaled space, about 974 units left of the disc centre) and Gaussian Blur 72.6, at about 20 % opacity, which throws a long soft shadow off each disc's right edge. Each disc scales linearly from 0 % at 0 s to about 265 % at about 5 s, and each pair starts about 0.6–0.8 s after the one below it. A ready-made black title sits on top. Recipe 08 has the full steps and measurements.

steps:
1. Add a new adjustment layer at the top of the stack, above the title. (said; menu shown f019716; position above the title shown 335.6 s, f020136)
2. On it: Effect > Blur & Sharpen > Camera Lens Blur, found by typing in the Effects & Presets search. (said; search shown about 329.5 s; effect shown f019950; the category path is inferred)
   - Blur Radius: 5.0 (shown 333.5 s, f020010; the value was handled with the mouse but ended where it started; not said)
   - Iris Properties: Shape Hexagon, Roundness 0 %, Aspect Ratio 1.0, Rotation 0°, Diffraction Fringe 100.0 (shown f019950)
   - Blur Map Layer: None (shown f019950)
   - Highlight: Gain 0, Threshold 204, Saturation 0 (shown f019950)
   - Edge Behavior: Repeat Edge Pixels on; Use Linear Working Space on (shown f019950)
   - Before the mask, the whole picture is softened, title included. (shown 334.0 s, f020040)
3. With the adjustment layer selected, draw an ellipse mask with the ellipse tool: a circle centred on the frame, its diameter about the full frame height, touching top and bottom. (said "use one of the masking tools"; shown f020136; size measured there: about 0.56 of the width by 1.0 of the height of the picture, i.e. a circle about 1080 px across in this comp)
   - Mask mode first Add, which blurs only inside the circle (shown f020136).
4. Set the mask mode to Subtract, so the centre is cut out of the blur and only the sides outside the circle go soft. (said; menu shown 336.2 s, f020172; set to Subtract shown f020400)
   - Mask Feather: 135.0, 135.0 px, about 0.125 of the frame height, spread half inside and half outside the path, so the soft and sharp zones blend. (not said; shown 340.0 s, f020400)
5. Add a second adjustment layer above the first and apply Effect > Noise & Grain > Noise. (said "noise effect"; second adjustment layer shown f020400; Noise found by search, shown 339.0 s; category path inferred)
   - Amount of Noise: 8.0 % (shown f020490; not said)
   - Noise Type: switch Use Color Noise off; it is on when the effect is applied (shown on, 340.0 s, f020400) and off by f020490. Not said.
   - Clipping: Clip Result Values on (shown f020490)
6. (Finished example only, not narrated) The title layer carries Invert (Channel RGB, Blend With Original 0 %) and Drop Shadow (Shadow Color black, Opacity 19 %, Direction 135°, Distance 43.0, Softness 338.0, Shadow Only off). These belong to the ready-made title, which turns its white lettering black on the pale plate with a very soft shadow. (shown 342.6 s, f020556; the opacity was lowered to 19 % around 337–341 s without a word)
7. (Finished example only, not narrated) By the end the stack has eleven disc pairs instead of eight, and the title's start is moved later (layer starting about 3.3 s, its IN marker about 6 s). (shown 343.0 s, f020580)

layout: Measured on the result frame f020568 (comp time about 3:08, picture crop 682,203,1284,722). The discs are those of 08: concentric on the frame centre, the visible edges right of the title at about 0.60 and 0.76 of the picture height from the centre (measured), neighbouring edges about 0.17 H apart, each disc's long soft shadow streaking right, the right side greyer than the left. The blur: the mask circle has a diameter of about 1.0 H centred on the frame (measured on f020136), so the sharp zone is the central circle where the title sits, and, since After Effects spreads a mask's feather half inside and half outside the path, the blur starts to rise inside the circle at about 0.44 H from the centre and reaches full strength at about 0.56 H (the 135 px feather, about 0.125 H wide), so only the left and right sides are fully soft. The effect is gentle: across the ring edges at the far left and right fifths of the frame the sharpest one-pixel step falls from about 17–27 grey levels before (f019620) to about 8–10 after (f020568), while edges in the centre are untouched (measured, rough, on compressed video). The grain: not measurable on the recording; flat 16 x 16 patches on ring faces read a standard deviation of about 0.4–0.7 grey levels both before and after the noise (measured), because compression and the viewer's downscale erase it. The target is the shown setting at comp resolution: Noise 8 %, monochrome, clipped, which at 1920 x 1080 should give a clearly visible fine grain, far stronger than the recording shows (inferred; not measurable here). The title is the finished example's own graphic, black, centred, the main word about 0.27 H tall, with a soft shadow down and to the right (from its Drop Shadow at 135°). Motion: nothing in this recipe moves; the discs keep growing as in 08, and in this shot the title's letters and sub-line type on (from the title graphic, not this recipe).
timing and easing: none given; both adjustment layers run the full length of the comp (shown f020400).
variations: The blur is optional and how you mask it is up to you (said). Noise makes "perfect" graphics less perfect (said); its amount is not discussed.
pitfalls: none given
longest on: Camera Lens Blur and its mask: about 9 s (327.5–337 s) of the 16 s, against about 4 s for the noise. The author stresses that only the sides should blur.
build notes: Match names: "ADBE Camera Lens Blur", "ADBE Noise". Add the mask with layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), set its "ADBE Mask Shape" to an ellipse (four-vertex shape with tangents) of diameter equal to the comp height centred on the comp, maskMode = MaskMode.SUBTRACT, "ADBE Mask Feather" = [135,135] (or about 0.125 x comp height in another comp size). Blur Radius 5 is for a 1920 x 1080 comp; scale it with the comp width. Noise: Amount of Noise 8, Use Color Noise off, Clip Result Values on.
result: start=342.7 end=342.9 animated crop=682,203,1284,722 frame=f020568
before: f019620 (327.0 s, the same plate sharp all over and with no grain, crop 785,316,1488,836; note it is at comp 4:07 with eight pairs, the result at comp 3:08 with eleven pairs, so disc radii differ; use it for sharpness only)
unknowns: Whether the Blur Radius was ever left at a value other than 5.0 (the drag at 332.5 s ends at 5.0); whether the noise layer has a mask (it does not appear to, but its mask group is never opened); the Camera Lens Blur's Iris Rotation, Blur Focal Distance and other values not changed are at their defaults as far as the frames show; why the stack grows from eight to eleven pairs (not shown being done); the title graphic's own animation. The result window is short (about 0.2 s): the recording pans before 342.0 s and the mouse arrow enters the picture from 343.0 s, and the title is still typing on in this window.

## Flat UI graphic on a glossy extruded plate
id: 10-2d-graphics-on-extruded-3d-plate
status: unproven
source: 7pgDb6NKEXM 344.4–426.6 s
jobs: camera and 3D; depth and finish; shadows and light
what it does for a beat: Turns a flat 2D card or UI panel into a solid, glossy object floating over a pale floor with a real cast shadow, while the graphic on its face keeps its exact flat colours. Reach for it when a 2D layout needs to read as a physical product shot without leaving After Effects.
what it looks like: A black rounded-rectangle panel with three light-grey pill buttons (icon plus label) and a small header row floats over a near-white, faintly cool background. The panel is tipped back slightly; its lower part catches a warm silvery reflection, a thin dark rim shows its thickness, and a soft dark shadow lies on the floor beneath it with a clear gap between panel and shadow.
ingredients:
- Advanced 3D renderer — built-in; the renderer menu at the bottom right of the Composition viewer (shown f021842)
- Shape layer with Geometry Options (Extrusion Depth) and Material Options — built-in
- Pre-compose — built-in; Layer > Pre-compose dialog (shown f021526)
- Environment light — built-in; Layer > New > Light, Light Type Environment (shown f023797; the menu entry with its shortcut is on screen during 386.6–397 s)
- Plane mesh layer used as a shadow catcher — built-in (layer's Mesh Options read Plane, shown f024634); how it was created is not shown
- The UI artwork itself came from a third-party template plugin; any flat vector card works (inferred)
steps:
1. Build the flat graphic in a 1920 x 1080 comp: one shape layer that is the background plate (a black rounded rectangle) and, above it, all the elements that sit on it (pills, icons, text). (said; plate and elements shown f021842; comp size inferred from the camera in recipe 11: Zoom 2666.7 px = 39.6° horizontal, which fits a 1920-wide comp; frame rate 23.976 shown in the timecode readout, f022203)
2. Select every element except the plate and pre-compose them into one precomp. (said; shown f021526)
   - Option: Move all attributes into the new composition (shown f021526)
   - Adjust composition duration to the time span of the selected layers: ticked (shown f021526)
   - Open New Composition: unticked (shown f021526)
3. Turn on the 3D switch for both the plate and the graphics precomp, and set the comp's renderer to Advanced 3D. (said; Advanced 3D ticked in the renderer menu, shown f021842)
4. On the plate, open Geometry Options and give it a little thickness. (said; shown f022203)
   - Extrusion Depth: 26.0 (shown f022203)
   - Bevel Style: None; Bevel Depth 2.0; Hole Bevel Depth 100.0% (left at defaults; shown f022203)
5. On the plate, open Material Options. (said; shown f022550)
   - Casts Shadows: On (said; shown f022550)
   - Accepts Shadows: On; Accepts Lights: On (shown f022550)
   - Ambient 100%, Diffuse 50%, Specular Intensity 50% (left as they were; shown f022550)
   - Specular Shininess: 100% (raised from 5%) (said "max out"; shown f022550)
   - Metal: 78% (lowered from 100%) (said "lower a touch"; shown f022550)
6. Parent the graphics precomp to the plate. (said; Parent column reads the plate, shown f022819)
7. Set the graphics precomp's Position Z to exactly -1, keeping its X and Y as they are (they read 1920.0,1080.0 after parenting), so its face sits just in front of the plate's front face and moves with it. (said; Position 1920.0,1080.0,-1.0 shown f023077; Z was 20 before, per the timeline)
8. On the graphics precomp, set Material Options > Accepts Lights to Off so its colours stay flat and unshaded. (said; Accepts Lights Off and Accepts Shadows On shown in a crop of f023737)
9. Add a light: Layer > New > Light. (said "environment light"; dialog shown f023737, f023797)
   - Light Type: Environment (said; shown f023797)
   - Intensity: 100% at creation (shown f023797)
   - Casts Shadows: ticked (said; shown f023797)
   - Shadow Darkness: 100% at creation (shown f023797); Shadow Diffusion is greyed out for this light type (shown f023797)
   - Source: Default, i.e. no environment image (shown in the light's Light Options, f025123)
10. Rotate the plate so it is seen at an angle (not narrated as a step; done on screen while the material and light are set). Just after the result the plate reads X Rotation -29°, Z Rotation +2° (shown in a crop cut from source.mp4 at 423.5 s). Y Rotation is being dragged then and passes +7° and -6° (shown f025423, and a cut at 423.7 s) before reaching -45° at 424.2 s; in the result the plate's left and right edges stand at nearly the same height, so Y is close to 0 (measured). Earlier passing values (X -29°, Y -33° to -37°, Z -17° at 386.6 s) are not the result; aim for the layout shares.
11. Create a large plane mesh for the floor. (said; layer with Mesh Options Plane shown f024634)
12. Rotate the plane 90° on X so it lies flat, then move it down below the plate. (said "rotate by 90" and "lower it"; X Rotation 90° shown f024277, sign hidden under the cursor; Position 1096.0,616.0,0.0 → 1096.0,952.0,0.0 shown f024397)
13. Set the plane's Accepts Shadows to Only, so only the shadow shows and the plane itself is invisible. (said; Compositing Options > Accepts Shadows: Only shown f024634)
14. Scale the plane up until its far edge leaves the picture. (said; Scale 543% shown f024763, then 888% shown f024816)
15. Rotate the environment light and adjust its Intensity and Shadow Darkness until the shadow sits under the plate. (said; values at the result shown in crops cut from source.mp4 at 422.1–422.3 s)
   - X Rotation: +92° (shown, cut at 422.1 s)
   - Y Rotation: +200° (shown, cut at 422.1 s)
   - Intensity: 136% (tried 195% and 216% on the way; shown, cut at 422.1 s and in the 418–421 s crops)
   - Shadow Darkness: 66% (from 100%; shown, cut at 422.3 s; it is still being dragged at 422.1 s, reading 68%, and lands on 66% by 422.25 s)
layout: Measured on the result frame (picture 1770 x 995 px, full-frame origin 928,297). Plate face: about 41% of the picture width (x 0.29–0.70) and 74% of its height (top edge y 0.09–0.12, bottom edge y 0.82–0.83), centred a little left of middle; the top edge is narrower than the bottom, so the top leans away from the camera, and the panel rolls slightly clockwise (measured). Pills: three, each about 32% of the picture width (x 0.33–0.66) and 12–14% of its height, centred at y about 0.28, 0.44 and 0.62 (measured); their fill reads flat neutral grey RGB 228,228,228 everywhere because Accepts Lights is off (measured). Header row (back arrow, label, time) sits across the top tenth of the plate (measured). Plate shading: pure black (RGB about 20) over the top two-thirds, grading through grey-brown to a warm silver highlight of about RGB 239,230,218 at the lower-left corner; this reflection comes from Metal 78% and Shininess 100% under the default environment light (measured; its source inferred). A thin darker rim about 1% of the picture height runs along the bottom edge; that is the 26-unit extrusion seen from above (measured). Shadow: one soft, wide band on the floor directly below the plate, from y about 0.84 to 0.93, as wide as the plate (x about 0.30–0.71), soft on the left and right ends, firmer along its lower edge, and separated from the plate's bottom edge by a visible gap, so the plate floats (measured). It is cast by the plate (the graphics precomp casts too but sits on the plate face). Its darkest value is about RGB 88 against a floor of about 237, i.e. 0.37 of the floor level; Shadow Darkness 66% predicts about 0.34, so the shown setting fits (measured). Background: near white with a faint cool tint, RGB about 233,239,242 on the left and 240,251,252 on the right, so slightly lighter towards the right; it comes from the comp's background solid, which carries an effect not opened on screen (measured; effect unknown). No floor edge or horizon is visible: the plane is invisible except for its shadow (measured). Nothing moves in the result.
timing and easing: none given; the result is a still pose (the example's elements carry their own template animation, not part of this technique)
variations: Rotate the plate freely once the graphics are parented and sit at Z -1 (said). Move the light's rotation and intensity to place the shadow, and change Shadow Darkness to taste (said). Any design or animation can be built on the plate afterwards (said).
pitfalls: The plane shows a hard edge until it is scaled up well past the frame (said). Shadows only appear on a layer that accepts shadows, so the floor plane is needed to see one (said). The graphics layer must have Accepts Lights off or its flat colours get shaded (said). While the Advanced 3D viewer refines, the shadow and reflections look grainy (seen at 418–421 s); judge the look after it settles (inferred).
longest on: The floor and shadow: creating, rotating, lowering, shadow-only setting and scaling the plane mesh, then rotating and tuning the environment light (397–426.6 s, about 30 s of the 82 s). Next is setting up the flat graphic and pre-composing it (344–360 s, about 16 s, mostly template browsing).
build notes: Set the comp's renderer to Advanced 3D (scripting: comp.renderer; the Advanced 3D renderer's match name is believed to be "ADBE Advanced 3d", check comp.renderers before using it). Extrusion lives on the shape layer under Geometry Options > Extrusion Depth; Material Options holds Casts Shadows, Accepts Shadows, Accepts Lights, Specular Shininess and Metal. Accepts Shadows has three states (Off, On, Only); "Only" is what the floor plane needs. Parenting and Position Z = -1 are plain transform settings. The environment light and the plane mesh may not be creatable by older scripting APIs; if a script cannot make them, create them by hand (Layer > New > Light, type Environment; a plane mesh layer) and then set their values by script. No environment image is loaded (Source: Default), so the reflection comes from the default lighting.
result: start=422.25 end=422.4 still crop=928,400,1770,891 frame=f025335 (cut from source.mp4 at 422.25 s; no kept frame is clean in this window)
before: f021842 (the flat graphic on its flat plate, before extrusion)
unknowns: The plate's exact Y Rotation at the result (near 0 by the picture; read -6° to +7° mid-drag at 423.7 s). The plate's size in pixels and its X/Y position. The sign of the plane's 90° X rotation. How the plane mesh layer was created (menu not shown). The background solid's effect (likely a gradient, not opened). Whether the graphics precomp's Casts Shadows was changed (it read On before the change and was not shown after). The light's position is irrelevant for an environment light; its rotation values between 397 and 418 s were passing values.

## Depth of field on a row of glossy plates (Advanced 3D camera)
id: 11-camera-depth-of-field-advanced-3d
status: unproven
source: 7pgDb6NKEXM 426.6–451.0 s
jobs: camera and 3D; depth and finish
what it does for a beat: Gives a 3D product-style scene a photographic lens: duplicated objects staggered in depth fall progressively out of focus, and a small camera move adds life. Use it to sell scale and depth once a scene from recipe 10 exists.
what it looks like: Three identical black panels with light-grey pill buttons stand in a diagonal row receding to the left over a near-white floor. The nearest (right) panel is only slightly soft and its labels half readable; the middle one is softer and the rear one is a blur, with soft grey shadows falling down and to the left on the floor.
ingredients:
- The scene from recipe 10 (extruded plate in the Advanced 3D renderer, graphics precomp parented at Z -1 with Accepts Lights off, environment light with shadows, plane mesh set to Accepts Shadows Only) — built-in
- Camera — built-in; Layer > New > Camera (menu inferred; Camera Settings dialog shown f025819)
- Camera Options > Depth of Field, Aperture, Focus Distance, Focus Area Width, Near, Far Blur Level — built-in; the last two appear on cameras in the Advanced 3D renderer (shown f026359)
steps:
1. Start from the finished scene of recipe 10, with these changes made on screen without narration: the plate's Scale set to 64% (shown f025483) and the environment light's rotation set to X +7°, Y 0° (shown f025483, f025603). Intensity 136% and Shadow Darkness 66% from recipe 10 were not shown changed (inferred unchanged).
   - Recipe 10 essentials, so this stands alone: comp in Advanced 3D; plate = black rounded-rectangle shape layer, Extrusion Depth 26, Material: Casts Shadows On, Specular Shininess 100%, Metal 78%; graphics precomp parented to it at Position Z -1, Accepts Lights Off; Environment light, Source Default, Casts Shadows on; plane mesh rotated 90° on X, Position Y 952, Scale 888%, Accepts Shadows Only. (shown in recipe 10's frames)
2. Duplicate the plate together with its graphics precomp twice, so there are three pairs, each graphics layer parented to its own plate. (not narrated; three pairs with parents pointing to the plate under each shown f025663)
3. (Before duplicating, the original plate's Position is changed to 960,459,0 (shown, cut from source.mp4 at 425.0 s); not narrated, covered by the final values below.) Spread the three plates in X and Z so they form a diagonal row receding to the left (not narrated; shown f025663):
   - Front plate: Position 1136.0,459.0,0.0 (shown f025663)
   - Middle plate: Position 826.0,459.0,140.0 (shown f025663)
   - Rear plate: Position 506.0,459.0,362 (Z being dragged; last digits partly hidden; shown f025663)
   - Rotation of the three plates at this point: not shown (they keep whatever the original had; see unknowns)
4. Add a camera. (said "cameras"; dialog shown f025819)
   - Type: Two-Node Camera (shown f025819)
   - Preset: 50mm (shown f025819); this gives Zoom 940.74 mm, Angle of View 39.60°, Film Size 36 mm, Focal Length 50 mm (shown f025819)
   - Enable Depth of Field: left unticked in the dialog (shown f025819); it is switched on in the timeline next
   - In the timeline the camera's Zoom reads 2666.7 pixels (39.6° H) (shown f026059)
5. In the camera's Camera Options, turn depth of field on and push the blur. (said: raise the aperture and the blur controls)
   - Depth of Field: On (from Off) (shown f026239)
   - Aperture: 181.3 pixels (from 25.3) (shown f026239)
   - Focus Distance: 2102.7 pixels (from 2343.7) (shown f026359)
   - Focus Area Width: 0.0 (left at its value) (shown f026359)
   - Near, Far Blur Level: 462.0, 462.0% (linked; from 100.0, 100.0%) (shown f026359)
6. Keyframe the camera's Point of Interest and Position for a slow move. (said; keyframes shown f026539 and f026779)
   - At comp time 0:00: Point of Interest 934.0,490.2,0.0; Position 934.0,490.2,-2388.6 (shown f026539)
   - At comp time 0:00:04:22 (about 4.92 s at 23.976 fps): Point of Interest 921.9,493.6,16.6; Position 1325.2,365.5,-2334.2 (shown f026779; values set by dragging with the orbit tool in the viewer, several passing values shown 444–446.5 s)
   - The move is a pure orbit: the camera-to-target distance is 2388.6 px at both keys, so the focus relation holds while the camera swings about 390 px right and 125 px up and the plates' faces turn more towards the viewer (computed from the two keys; direction shown f026539 → f026779)
   - In the tutorial's comp the graphics have not appeared yet at comp time 0:00 (bare plates, shown f026539), because the template elements animate on; a builder keying from 0:00 with static graphics will not see that
layout: Measured on the result frame (picture 1644 x 925 px, full-frame origin 870,324), with the blur settings of step 5 and the camera before the move is keyed (its values then are not shown; presumably those of the first key, inferred). Three plates in a row, each overlapping the one behind it: front plate x 0.565–0.735, y 0.03–0.90; middle plate x 0.37–0.565, y 0.06–0.86; rear plate x 0.20–0.37 visible (its right part hidden), y 0.10–0.84 (measured). Each plate reads tall and narrow (visible face about 17–20% of the picture width, 75–87% of its height) because the plates are turned well away from square to the camera (measured; the rotation itself is not shown). Pills: three per plate, light grey, stacked as in recipe 10 (measured). Focus: no plate is fully sharp, because the focus distance (2102.7) is about 290 px nearer than the front plate, which sits about 2390 px from the camera; the front plate's labels are half readable, the middle plate's are smeared, the rear's are unreadable (measured; distance inferred from the values). Blur, measured as the 10–90% width of pill edges: front plate about 0.3–0.7% of the picture width (left edges 4–7 px, top edges about 12 px), middle about 0.6–1.1% (9–18 px), rear about 0.9–1.3% (14–21 px); the rear plate's outer edge against the floor about 0.8%. For comparison the sharp scene of recipe 10 gives 2–4 px (measured). These per-plate blur widths are the target. The shown Aperture 181.3 px and Near, Far Blur Level 462% do not transfer as a blur size: a thin-lens estimate from the shown Zoom, Aperture and Focus Distance predicts blur discs several times to ten times larger than the picture shows, so treat 181.3 and 462% as the tutorial's own values and tune your scene until the per-plate edge widths match (inferred from the measurement and the estimate). Extruded side: along the front plate's right edge the plate's thickness shows as a grey graded strip about 3% of the picture width, lighter towards the top, so the plates are turned with their right side towards the camera (measured). Shadows: each plate casts a soft grey shadow down and to the left onto the floor, the shadows merging into one band from y about 0.84 to 0.99 that reaches left to about x 0.10; darkest about RGB 100–105 against a floor of about 237, i.e. 0.43 of the floor level (measured). The shadow is blurred further by the depth of field near the bottom of the frame (inferred). Background: near white, faintly cool, RGB about 233,239,242 on the left and 239,250,251 on the right (measured). The finished example shown at 351 s and 447–451 s is a different, pre-made file: the plates lean back steeply and fly in with template animation, the nearest plate is sharp and the rear ones heavily blurred, the camera is parented to a null and an adjustment layer sits on top; none of its values are shown (shown f021058).
timing and easing: Two camera keyframes, at 0:00 and 0:00:04:22 (comp time, 23.976 fps), on Point of Interest and Position (shown f026779). Interpolation not shown; the keys look like plain linear diamonds (inferred).
variations: Raise the aperture and blur levels as far as the look needs (said). Animate Point of Interest and Position, or use the viewer's camera tools (orbit, pan, dolly) to shape the final move (said).
pitfalls: none given
longest on: Setting up the camera and its depth-of-field values (about 427–439.5 s, roughly half the stretch), with Aperture, Focus Distance and the Near, Far Blur Level dragged up one after another. The camera move takes the next 7 s or so.
build notes: In scripting, the camera's Camera Options group holds Zoom, Depth of Field, Focus Distance and Aperture (long-standing properties). Focus Area Width and Near, Far Blur Level exist only on Advanced 3D cameras in recent versions; reach them by their displayed names and check they exist before setting them. Near, Far Blur Level is a linked two-value property (462, 462). Do not copy the blur values as a size; match the measured edge widths in layout. Duplicating a plate and its graphics precomp together keeps each copy's parent pointing at the new plate; check the Parent column. The aperture and focus values are in pixels and tied to this scene's scale (a 1920 x 1080 comp, camera about 2390 px from the front plate, plates about 310 px apart in X and 140–220 px apart in Z); in another scene aim for the measured blur instead: nearest plate's edges spread over about 0.3–0.7% of the picture width with half-readable labels, middle about 0.6–1.1%, rear about 0.9–1.3% and unreadable.
result: start=439.3 end=439.5 still crop=870,420,1644,829 frame=f026359 (Focus Distance is still being dragged before 439.3 s and a selection outline and the mouse enter the crop by 439.6 s)
before: f025724 (the three plates, before the camera exists, everything sharp)
unknowns: The plates' rotation in this shot (the last reading before duplication was X -29°, Y about -45°, Z +2° at 424 s, but the plates are not shown after that). The rear plate's exact Z (read as 362). Whether the light's Intensity or Shadow Darkness changed after recipe 10. The camera keyframes' interpolation. The finished example's camera, blur and null values.

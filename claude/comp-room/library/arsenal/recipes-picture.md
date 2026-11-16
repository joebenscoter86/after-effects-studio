# Arsenal recipes: Picture jobs: how the picture has to read, whatever the line says

Generated from the recipe drafts; do not edit by hand. Recipes whose primary job is in this group. Find candidates for a beat with ae_arsenal find; read one with ae_arsenal get, or a section here by its heading.

## Window-light shadow map over a flat layout
id: 01-shadow-map-overlay
revision: a2dfdc7d
job: add-depth; support: finish-the-look, establish-place
status: unproven
what it does for a beat: Makes a flat title card or layout look as if it sits in a room with sunlight falling through a window: long soft diagonal shadows with light bands between them. Reach for it when a clean graphic looks too digital and needs contrast and a sense of place without any 3D.
what it looks like: A pale grid-paper background with a black brush-lettered title and small logos. Two broad grey shadow strips run diagonally from upper left to lower right, a large shadow fills the upper-right corner, and the white bands of "sunlight" between them are crossed by short grey bars, like window frames. The shadow darkens everything it covers, title included, and its edges are soft.
ingredients:
- Solid layer — built-in; Layer > New > Solid (the dialog is shown; the menu is not)
- Pen tool masks — built-in
- Multiply blend mode — built-in; layer Mode column
- Fill — stock; Effect > Generate > Fill (the Effects & Presets search shows it under Generate, cut from source)
- Mask Feather — built-in
steps:
1. Start from a finished flat composition, 1920 x 1080 at 23.976 fps, holding the artwork (here one precomp of the title on a pale grid background, plus a separate adjustment-style layer above it). (shown for the size; for 23.976 fps)
2. Make a new solid the size of the comp. (said; Solid Settings dialog shown)
   - Width: 1920 px, Height: 1080 px, Square Pixels (shown, crop)
   - Colour: a mid grey (shown; the Fill effect in step 7 decides the final colour, so this value does not matter)
3. With the solid selected, take the Pen tool and draw a long, narrow four-point mask that runs diagonally down to the right and gets wider the further it goes from its start; let both ends run well outside the comp. (said; pen tool active, mask shown)
4. Draw a second strip of the same kind parallel to the first, leaving a band of open space between them; that open band becomes the sunlight. (shown)
5. Draw two small, thin parallelogram masks across the open band between the strips, roughly at right angles to the strips, so the light band is broken into window panes. (said "smaller rectangle ... in the middle to simulate a window"; shown, blue masks)
6. Draw a fifth, large mask that covers the upper-right corner of the comp above the upper strip. (shown; not mentioned in the narration)
   - All five masks: mode Add, Inverted off (shown, crop of the mask list)
   - Mask order as built: strip, window bar, strip, window bar, corner shape (shown)
7. Put the solid above the artwork and set its blend mode to Multiply. (said; Mode menu open with Multiply highlighted; landed as Multiply)
   - In the build the solid sits second, under the adjustment-style layer and above the artwork (shown); in the pre-made version at 20 s it is the top layer (shown). What the layer above does is not shown, so whether the order matters is unknown (inferred).
8. Add Fill to the solid and use its Color to set how dark the shadow is: any grey between white (no shadow) and black. (said; Fill controls shown)
   - Fill Mask: None; All Masks: off; Invert: off; Horizontal and Vertical Feather 0.0; Opacity 100.0% (shown)
   - Color: the narrator drags the picker while talking; the dialog shows #737373 and #636363 (cut from source), but neither is the value that lands. After OK the swatch reads about RGB 164 grey, #A4A4A4 (shown, measured from the swatch pixels). By, with nothing said, it reads about RGB 139, #8B8B8B (shown, swatch pixels). That darker value stays to the end of the chapter and is the one in the result, so use 139 (inferred: it is the last value on screen). It also matches the darkness of the pre-made version at 20 s (measured, see layout).
9. Feather every mask a little to soften the shadow edges. (said; select all masks and press F for Mask Feather, shown)
   - Mask Feather: 42.0, 42.0 pixels on all five masks (shown; 40 was still being dragged)
layout: The result is the build (the same masks as) with Fill 139, played back; a settled Linear Wipe from technique 02 sits on the layer and clears nothing visible there. Geometry was measured (picture 1714 x 960 px, clean, Fill 164) and darkness on the result frames. The pre-made version at 20 s (picture 1446 x 812) is a different file, given only as a reference below; these steps do not reproduce its geometry. Directions are given on the picture, with y going down.
- Shadow darkness (measured): lit paper about 249 grey. Shadow 136–137 in the result at Fill 139 (0.55 of the lit level, measured across a 5 x 5 grid of samples) and 160 at Fill 164 (0.64). Multiply with a grey Fill gives shadow = paper x Fill/255. The pre-made version measures the same 0.55. The shadow also darkens the black title and logos where it crosses them; they stay black.
- Coverage (measured): shadow covers about 57–60% of the picture and light about 35–41%.
- Strip angle (measured): the strip edges run down to the right at about 25–33° below horizontal in the build and about 45° in the pre-made reference (an edge-direction histogram of each frame). The window bars run roughly at right angles to the strips.
- Bands in the build, (measured along the picture edges, as shares of width W or height H): along the left edge, light 0–0.24 H, shadow 0.24–0.46 H, light 0.46–1.0 H. Along the right edge, shadow 0–0.65 H (the corner shape and upper strip), light 0.65–0.81 H, shadow 0.81–1.0 H. Along the top edge, light 0–0.08 W, shadow 0.08–0.24 W, light 0.24–0.38 W, shadow 0.38–1.0 W. Along the bottom edge, light 0–0.42 W, shadow 0.42–0.71 W, light 0.71–0.81 W, shadow 0.81–1.0 W. The large lower-left area is lit, the upper-right corner is in shadow, and two lit bands cross the middle diagonally.
- Window bars: two short shadow bars cross the lit band just above and around the title's left half and middle, each about 0.03 H thick and about 0.15–0.2 H long (estimated). The pre-made reference has three or four such bars, which break its light bands into separate panes.
- Edge softness (measured, 10–90 % of the step across the edge): about 4 % of the picture height in the build (vertical crossings of about 44 px at a 33° edge give about 37 px perpendicular, 3.9 % of H), from the 42 px feather in a 1080 comp; about 2.2 % in the pre-made reference, which is sharper. Pre-made reference, as a whole: same darkness as the result, strips at about 45°, three or four bars and sharper edges (smaller feather). Its band positions along the edges are: left edge, light 0–0.16 H, shadow 0.16–0.44 H, light 0.44–1.0 H; right edge, shadow 0–0.75 H, light 0.75–1.0 H; top edge, light 0–0.11 W, shadow 0.11–0.36 W, light 0.36–0.53 W, shadow 0.53–1.0 W; bottom edge, light 0–0.29 W, shadow 0.29–0.45 W, light 0.45–0.68 W, shadow 0.68–0.86 W, light 0.86–1.0 W. To aim at it, steepen the strips to 45°, add a bar across each light band and lower the feather to about 25 px (inferred from the softness).
- Background: pale paper with a fine grey grid and slight grain. That belongs to the artwork, not the shadow.
- The opening 10.6–17 s shows the same idea on other finished layouts (a dark title on a beige ground), with light patches at a similar diagonal.
timing and easing: none given (static). Technique 02 animates it.
variations: Any arrangement of masks works, so the window shape is free; the darkness is set with the Fill colour, anywhere between white and black. (said)
pitfalls: none given
build notes: By script, add a solid (`comp.layers.addSolid([0.5,0.5,0.5], name, 1920, 1080, 1)`), then add masks with `layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom")` and set "ADBE Mask Shape" to a Shape with four vertices, closed. Make each strip about 0.10–0.20 H wide at its start and wider at its far end, with both ends outside the comp. Set `maskMode = MaskMode.ADD` and Mask Feather ("ADBE Mask Feather") to [42,42]. Use `layer.blendingMode = BlendingMode.MULTIPLY`. Fill's match name is "ADBE Fill"; set its Color to [0.545,0.545,0.545] (139 grey), as in the result. To match the result, check the shadow-to-paper ratio (about 0.55) rather than the colour number, because paper that is not white changes it.
unknowns: The exact mask vertex positions, read here only from pictures. Why the Fill changes from 164 to 139 off-narration. The pre-made version has more window bars, a steeper angle and sharper edges than the build; its own mask and feather values are not shown. During 20.2–21.5 s the pre-made shadow pattern changes while the comp time stays at 0:00:04:09; what is being changed is not shown or said. The mouse pointer is inside the picture throughout the result window (it sits on the title), so no fully clean frame exists for the build; is clean but falls during a pan, so it holds no window. The reference crop leaves out the bottom 12 % of the picture, because the pointer passes through there.

## Soft diagonal wipe-on for a shadow map
id: 02-shadow-map-wipe-on
revision: 8dc40155
job: add-depth; support: reveal-headline
status: unproven
what it does for a beat: Brings window-light shadows into a shot as if the sun had just come out: the shadow sweeps across the layout along the strips over about a second instead of popping on. Use it on the opening beat of a title card that carries a shadow map.
what it looks like: On a pale grid-paper title card, grey diagonal shadow strips and window bars spread in from the upper left with a very soft leading edge and fill the frame towards the lower right within about two-thirds of a second, while the title fades in. They end at full strength over almost the whole frame.
ingredients:
- The shadow map from 01-shadow-map-overlay — a solid with five pen masks, Multiply, Fill, Mask Feather 42 (see the figures below)
- Linear Wipe — stock; Effect > Transition > Linear Wipe (inferred; the menu is not shown, the effect appears in Effect Controls). The speech recognition hears "linear white"; the screen shows Linear Wipe, and the screen wins.
steps:
1. Build the shadow map first (01-shadow-map-overlay), so this recipe stands alone (shown):
   - comp 1920 x 1080, 23.976 fps, pale grid-paper artwork with a black title
   - a comp-size solid above the artwork, blend mode Multiply
   - masks, all Add with Mask Feather 42 px: two long strips running down to the right at about 25–33° below horizontal and widening along their length, two short window bars crossing the light band between them, and one large shape covering the upper-right corner
   - Fill effect on the solid with Color about RGB 139 grey (#8B8B8B; swatch measured) and Opacity 100%, which makes the shadow about 0.55 of the paper's brightness (measured on the result, see layout)
2. Add Linear Wipe to the same solid, below Fill in the effect stack. (said; shown)
   - Defaults on adding: Transition Completion 0%, Wipe Angle 0x+90.0°, Feather 0.0 (shown)
3. Turn Wipe Angle until the wipe edge lines up with your design. The author matches it to the window bars, so the edge runs roughly at right angles to the strips. (said: match the angle to the design; the angle lands at −49°)
   - Wipe Angle: 0x−49.0° (shown)
   - To check the angle he scrubs Transition Completion to 44% with Feather 0 and to 52% after Feather is raised to 139.0 : the lower-right part of the shadow is cleared and the upper-left part stays, along a straight edge that rises to the right at about 50° from horizontal (shown)
4. Raise the wipe's Feather so the leading edge is very soft. (said "don't forget about the feather")
   - Feather: 139.0 (shown)
5. Keyframe Transition Completion so the shadow wipes on. (said "keyframe the completion")
   - First keyframe at 0:00:00:00: 100% (shadow fully hidden) (shown, timeline value at the current time)
   - Second keyframe about 1 s later (0:00:01:00 on the time ruler), shown with the hourglass Easy Ease icon (shown; keyframe icons in a crop of a frame cut from source)
   - Value at the second keyframe: about 0% (inferred from the picture). The settled frames show full shadow (136 grey) right into the top-right corner (median of x 2560–2620, y 375–440 in full-size pixels) and into the lower-right corner (136 grey, measured on a frame). At 15% with this angle the lower-right corner would be clear or fading, because the lower right is the last part this wipe uncovers (at 44% the lower right is already clear and the upper left still shadowed). Effect Controls reads 15% during the playback, but that reading comes straight after a jump cut: the author is still scrubbing Completion (0%, 4%); the Completion stopwatch is already blue (shown in a crop), but the layer is collapsed, so the keyframes are not in view and nothing ties the 15% to the key. The first key is a plain linear diamond.
layout: Measured on frames cut from the playback, picture about 1730 x 973 px in the full frame:
- Final state (comp time after 1 s): shadow at 130–138 grey on paper at about 249 grey, the same 0.55 ratio everywhere I sampled, including the top-right corner. The wipe has cleared nothing visible: it reads as the full shadow map (measured over a 5 x 5 grid of samples on the frame), which is why the second key is taken as about 0%.
- Strips run down to the right at about 25–33° (from 01). The wipe edge, measured at 44% without feather, rises to the right at about 50°, so it crosses the strips at roughly 80°. The edge therefore travels along the strips' length.
- Motion, in comp time (viewer timecode read in crops): at 0:00:00:05 the upper-left part of the frame (about 40 % of the final shadow) already carries shadow and the lower right fades out over a very wide soft edge. At 0:00:00:11 shadow reaches past the title. At 0:00:00:17 it is almost complete. At 0:00:01:05 it holds still. The reveal travels from the upper-left corner towards the lower-right corner: the edge rises to the right at about 47–50° and moves about 43° below horizontal, at about 2.4 picture heights per second while it crosses the frame (measured on the arrival time of every pixel, proof review 02; arrival order checked on frames cut at 77.50, 77.60,: upper left first, lower right and right edge last). Most of the change happens in the first 0.5 s, with the end eased.
- Arrival target (measured): share of the final shadow present, in time from the first frame of the looped preview (no shadow): about half by 0.15–0.25 s, 90 % by 0.35–0.5 s, complete by 0.55–0.7 s. Two ways of finding comp time give the ranges (the loop's first frame, and the viewer timecode, which steps in real time); my own pass over frames cut every 1/60 s gave 55 % at 0.15 s, 89–92 % at 0.33–0.38 s, 98 % at 0.53 s, 100 % at 0.68 s.
- At the same time the title fades in letter by letter (at 0:00:00:05 the last letter is still missing). That animation is part of the artwork, not of this technique.
- The shadow-map geometry (bands, bars, edge softness about 4 % of the picture height) is as given in 01-shadow-map-overlay.
timing and easing: Transition Completion 100% at 0 s to about 0% at about 1 s; the second key is Easy Ease and the first is linear (shown keyframe icons). The ease's influence values are not shown. These keys and the measured arrival (layout) do not agree: the second key sits at 1.0 s on the ruler (crop of a frame: key at the 01s tick), yet the shadow is complete by about 0.6 s; a build with exactly these keys, Feather 139 and −49° reached half at 0.44 s and complete at 0.85 s, about 0.25 s late (proof 02). Aim for the measured arrival; the shown keys alone do not reach it, and what closes the gap (a stronger ease, an earlier key) is not shown.
variations: The wipe angle should follow whatever shadow design you drew. (said)
pitfalls: Remember the wipe's Feather, or the shadow arrives behind a hard straight edge (said; shows the hard edge at Feather 0).
build notes: `layer.property("ADBE Effect Parade").addProperty("ADBE Linear Wipe")`, then set "Transition Completion" (percent, 0–100), "Wipe Angle" (degrees, −49) and "Feather" (139) by display name. Keyframes: `setValueAtTime(0,100)` and `setValueAtTime(1.0,0)`; then on key 2 set an ease, for example `setTemporalEaseAtKey(2,[new KeyframeEase(0,33.33)],[new KeyframeEase(0,33.33)])`, and leave key 1 linear. Check the direction in a render: at 50% the shadow should remain in the upper left and be gone from the lower right (as at 44%). If yours is reversed, flip the angle by 180° (to 131°). At the end the lower-right and top-right corners must be fully in shadow; if they are not, lower the second key. Then check the arrival target in layout (half by 0.15–0.25 s, 90 % by 0.35–0.5 s, complete by 0.55–0.7 s); with the shown keys a build arrives about 0.25 s late. The review's untested suggestion is to move the second key from 1.0 s to about 0.7 s, or keep it and start the first key at about 85 %; measure the share of shadow after either.
unknowns: The value at the second keyframe: about 0% read from the picture; Effect Controls shows 15% after a jump cut, and the key itself is never shown. Its exact time is also unknown (about 1 s, read from the ruler). The ease influence. Whether the fill grey changed from about 164 to about 139 on purpose: it changes off-narration between and. The mouse pointer is inside the picture throughout the result window, so no fully clean frame exists; has it just below the title.

## Seat a cut-out object with a soft, doubled drop shadow
id: 05-soft-doubled-drop-shadow
revision: 7d484d90
job: add-depth; support: light-the-hero
status: unproven
what it does for a beat: When a photographed object cut out of its background (a product, a prop, a wheel) is dropped into a flat graphic scene and looks pasted on, a very soft, barely offset drop shadow gives it a dark halo that grounds it. Stack a second, even softer copy when the first is too faint.
what it looks like: A cut-out bicycle wheel, rim and tyre seen from the side with its hub below the frame, sits on a pale blue-grey background under an arc of portrait cards. After the effect a smoky grey halo hugs the black tyre on every side, darkest right at the rubber and fading out over a few percent of the picture, slightly heavier to the lower right.
ingredients:
- Drop Shadow — stock; Effect > Perspective > Drop Shadow (applied by typing its name in the Effects & Presets search, shown; the menu path is inferred)
- a second Drop Shadow on the same layer (a duplicate of the first) — stock
- a cut-out photo with real transparency (a PNG of the wheel) — built-in footage
steps:
1. Select the cut-out object's layer (the wheel) and apply Drop Shadow (said; shown : "Dr" typed in the Effects & Presets search with the wheel layer selected; the effect is on the layer below an existing Curves effect)
   - Shadow Color: black (shown; default)
   - Opacity: 50 % (shown; default, not changed)
   - Direction: 0x+135.0° (shown; default, not changed)
2. Raise Distance well above the default (said: increase the distance; shown)
   - Distance: 37.0 (shown; the screen reader also caught 44.0 during the scrub, so it was dragged past and back)
3. Raise Softness massively (said)
   - Softness: 262.0 (shown)
4. For extra darkness, duplicate the Drop Shadow so the layer carries two (said; shown : "Drop Shadow 2" below the first, with the same Distance 37.0 and Softness 262.0 as the copy was made; the duplicate command itself is inferred, Ctrl/Cmd+D on the selected effect)
5. On the copy, push Softness to a very large value (said: max it out; shown)
   - Drop Shadow 2 Softness: 1051.0 (shown)
   - Drop Shadow 2 Opacity 50 %, Direction 135°, Distance 37.0, black: unchanged from the first (shown)
layout: Measured on the result frame (cut from source, crop 896,354,1694,953), in shares of the picture. The wheel: tyre outer diameter about 70 % of the picture width, from a circle fitted to the outer edge (the visible chord at the bottom edge is about 66 %), centred (centre about 50.5 % across), tyre top at about 59 % of the picture height, hub below the bottom edge so only the upper part of the wheel shows (measured). The wheel layer is scaled to 37 % in a 1920 x 1080 comp (shown, technique 03), so the effect's values are in the wheel image's own pixels: 37 px distance is about 14 comp pixels, Softness 262 about 97 and 1051 about 390 comp pixels (inferred: effects render before the layer's scale). The shadow, measured as the background's brightness next to the tyre divided by the open background's (243 of 255): on the right side 0.60 at 0.4 % of the picture width from the rubber, 0.69 at 1 %, 0.79 at 1.8 %, 0.88 at 3 %, 0.91 at 4 %, 0.96 at 6 %, gone by about 8 % (measured). On the left side it is lighter: 0.74, 0.80, 0.84, 0.89, 0.93, 0.95 at the same distances (measured). Directly above the tyre: 0.74 at 0.5 % of the height, 0.85 at 3 %, 0.92 at 6 % (measured). So it reads as an all-round halo with a slight lower-right bias, not as a cast shadow. Only the wheel carries the shadow: the cards above it have none (the background just under the centre card measures the same as open background before the effect) (measured). The background is not flat: very slightly lighter at top centre (about 247) than at the corners (about 238), presumably from an adjustment layer at the top of the comp (the wheel layer sits under it; the layer above the wheel carries effects), which this tip does not build (inferred). The wheel layer also already carries a Curves effect above the Drop Shadows (shown; values not shown; not part of this tip). The cards, their orbit and the wheel's spin come from technique 03. The finished example that plays (a separate finished comp with different portraits, a rendered clip layer is switched on at the top of that comp, so the picture may be a pre-rendered clip rather than its live layers) measures the same halo on the tyre's right side (0.60, 0.70, 0.79, 0.88, 0.93, 0.97 at the same distances), so the build and the finished example agree.
timing and easing: none given (the shadow is static; nothing is keyframed)
variations: Use one shadow for a subtle seat; add the second, maxed-out copy only when more darkness is needed (said).
pitfalls: The author keeps it subtle: large distance only in the sense of moving off the default, and softness pushed far (said). Distance looked large in the panel but in the comp it is small because the layer is scaled down (inferred from the shown scale). On a spinning layer the shadow's offset turns with the layer, because the effect renders in the layer's own space; at this softness the turning should not be visible, but check it over a few seconds of the spin, not on one frame (inferred).
build notes: Effect "Drop Shadow" (match name "ADBE Drop Shadow"); properties Shadow Color, Opacity, Direction, Distance, Softness, Shadow Only, as After Effects shows them. Add it twice to the wheel layer; set the first to Distance 37, Softness 262 and the second to Distance 37, Softness 1051, both Opacity 50 % and Direction 135°. By script, Drop Shadow's Opacity runs 0–255, not 0–100: 50 % is `setValue(127.5)` (a fresh Drop Shadow reads 127.5; setting 50 gives about 19.6 %; found in proof build 05, whose first render came out far too light). These values assume a layer image scaled to 37 % in a 1920 x 1080 comp; on a layer at 100 % scale, aim for the measured halo instead (about 14 px offset, darkness 0.6 of the background at the edge, fading out by about 6–8 % of the picture width), which is roughly Distance 14, Softness 100 and 390 (inferred). Check the halo against the layout figures after placing the art. Set Softness by value; whether the slider reaches 1051 or it was scrubbed past the slider range is not shown.
unknowns: Values of the Curves effect already on the wheel; whether the cards in the finished example carry any shadow of their own (none measures in the build); the menu path for Drop Shadow (it was found by search); how the duplicate was made.

## Tuck graphics behind a person with an automatic object matte
id: 06-graphics-behind-subject-object-matte
revision: 1572d05b
job: add-depth; support: reveal-headline
status: unproven
what it does for a beat: For talking-head or presenter footage on a plain wall: cards, titles and text sit between the person and the wall, so the person stands in front of the graphics. Reach for it when overlays would otherwise cover the face or body.
what it looks like: A smiling young man in a checked shirt against a flat teal studio wall. Rounded promo cards (a navy one, a white one, a peach one) and two blocks of bold text fill the frame around him; where they meet his body they pass behind his shoulders and arms, and the wall behind them is still the original footage.
ingredients:
- Object Matte tool — built-in in recent After Effects releases (the narrator calls it new; toolbar button, shown; the tool applies an effect named Object Matte to the layer)
- Layer panel (double-click the footage layer) — built-in
- a duplicate of the footage layer as a background plate — built-in
steps:
1. Put the graphics (cards, text, title precomps) in the comp under the footage layer, with the footage layer on top (shown : footage on top, eleven graphic layers below it (layers 2 to 12: six text layers, three shape layers and two title precomps); said: place graphics behind the subject)
2. Double-click the footage layer to open it in the Layer panel (said; shown : Layer panel open)
3. Pick the Object Matte tool in the toolbar (said: grab the new tool; shown : the tool's button is highlighted)
4. Hover over the person: the area the tool will take shows as a magenta overlay; click to select the subject (said: select your subject; shown hover overlay, a magenta outline round him after the click). The panel's View switches to Object Matte (shown)
   - The effect arrives with: Version 4.0, Fine-tune Object Matte on, Feather 5.0, Contrast 80.0 %, Shift Edge 0.0 %, Reduce Chatter 0 %, Render Refine Edge on, Refine Edge Matte Smooth 0, Feather 0, Contrast 0 %, Shift Edge 0 %, Chatter Reduction Off, Reduce Chatter 50 % (shown)
   - The matte span covers 0:00:00:00 to 0:00:07:11 (7:12 long) (shown)
5. Move the playhead forward and let the matte propagate through the span; a green bar reports progress (said; shown : propagating 58 of 131)
6. Tune the matte so the edge sits inside the body (shown, read on the duplicate made in step 8, which copies the original's effect; the moment of setting them is not shown; not said)
   - Contrast: 86.6 % (shown)
   - Shift Edge: -69.0 % (shown)
   - Reduce Chatter: 100 % (shown)
7. Back in the comp, the cut-out person now sits over the graphics, on black, because nothing is under them (shown)
8. Duplicate the footage layer and move the copy to the bottom of the stack as the background plate (said: use the original footage as a background plate; shown : the copy is the bottom layer; the duplicate command is inferred, Ctrl/Cmd+D)
9. Delete the Object Matte effect from the bottom copy so it shows the full original frame (shown : the effect selected on the copy; : the copy's Effect Controls are empty and the teal wall is back; not said)
layout: Measured on the result frame (cut from source, crop 872,306,1576,886, which leaves out about 1 % at each edge to avoid selection handles), as shares of the crop. The person is centred: shirt from about 28 % to 69 % of the width, head about 42–57 % across with its top at about 4 % from the top, body cut by the bottom edge (measured). Navy card: 12–37 % across, 9–37 % down. White card: 12–37 % across, 40–68 % down. Peach card: 60–85 % across, 9–37 % down. A three-line text block lower left, 6–30 % across, 73–93 % down; a two-line bold headline lower right, 67–97 % across, 72–91 % down (measured). Stacking that makes the look: the person's shoulder on the viewer's left covers the right edge of the white card, his arm on the viewer's left cuts the lower-left text mid-word, and his side on the viewer's right covers the first letter of the headline (measured). The matte edge is clean at full size: no teal fringe or halo along the shirt and arms (measured on a crop at full size). No shadows anywhere: the cards cast none on the wall and the person casts none on the cards (measured). The wall is the untouched plate: teal with a hot spot behind the person, brightest just to the viewer's right of the head, about 60–70 % across near the top (about RGB 147,206,211), a little darker at the viewer's right edge (about 130–138,194–199,200–206), darker again at the viewer's left edge (about 104,166,169) and darkest at bottom-left (about 76,133,136) (measured). The blue highlight box on the headline's first word, the dashed box, small cursor graphic and sticker in the lower-left block belong to the graphics' own design, not to the matte. The graphics' own designs, colours and type animation are not part of this tip; they come with the comp. The clip that plays is a separate finished montage with a different person and the same graphics; this build is not that clip.
timing and easing: none given for the matte. The graphics carry their own in/out animation (the cards and text build on as the playhead moves), not built here.
variations: Any graphic can go behind the subject (said). The tool selects by object, not by colour, so the wall need not be a keying colour (inferred; the narrator's remark about a clip not shot as a green screen belongs to the next clip, technique 07).
pitfalls: After the matte is made, the area around the person is empty; without a plate under the graphics the comp shows black (shown). A duplicate of the matted layer brings the matte with it, so the copy shows black until its Object Matte is deleted (shown). Propagation only happens as the playhead moves through the span (said).
build notes: The Object Matte tool and its click-to-select cannot be driven by script; the tracking (propagation) is interactive in the Layer panel. By script you can only add the comp stack (graphics between the matted footage and a plain duplicate at the bottom) and set the effect's values once it exists: Feather 5, Contrast 86.6 %, Shift Edge -69 %, Reduce Chatter 100 % (names as the Effect Controls show them; match names not known). A scriptable substitute when the tool is unavailable: Roto Brush (also interactive) or a keyer if the wall is a flat colour.
unknowns: When and how the matte values in step 6 were set; whether the subject selection needed extra clicks to add or remove areas; the graphics' own animation; the comp's background colour (black shows where nothing renders).

## Soft lens blur at the frame sides plus fine grain
id: 09-edge-lens-blur-and-noise-finish
revision: 2ba1df5b
job: finish-the-look; support: add-depth
status: unproven
what it does for a beat: A last pass that makes a clean, drawn graphic look as if it was shot through a lens: the left and right sides go slightly soft while the centre stays crisp, and a little grain breaks up the flat digital fills. Use it on any finished graphic or title plate, especially pale ones where the cleanliness gives away that they are drawn.
what it looks like: The white-disc title plate from 08: the centre, where the title sits, stays sharp; the disc edges near the left and right sides of the frame are visibly softer; the whole picture carries a faint fine grain.
ingredients:
- Adjustment layer — built-in; Layer > New > Adjustment Layer, Ctrl+Alt+Y (named "adjustment layer" in speech; menu with the shortcut shown)
- Camera Lens Blur — built-in (said "camera lens blur"; shown)
- Ellipse mask in Subtract mode with feather — built-in (said "masking tools … subtract"; shown)
- Noise — built-in (said "noise effect"; shown)

The scene it finishes (from 08, so this recipe stands alone): a 1920 x 1080, 23.976 fps comp on a pale cool-white background ramping left to right from about RGB 233,239,242 to 240,251,252. Eight or more concentric white discs grow from the centre, each a pair of layers: a top copy with a Gradient Overlay (#F1F6F8 to #D7E0E4, angle 40°) and a Bevel and Emboss (Inner Bevel, Smooth, Depth 100 %, Size 5, angle 120°, altitude 30°, highlight and shadow both Screen, white, 100 %), and below it a black copy with CC Radial Fast Blur (Amount 95, Center entered as -13.6,569.2 in the layer's unscaled space, about 974 units left of the disc centre) and Gaussian Blur 72.6, at about 20 % opacity, which throws a long soft shadow off each disc's right edge. Each disc scales linearly from 0 % at 0 s to about 265 % at about 5 s, and each pair starts about 0.6–0.8 s after the one below it. A ready-made black title sits on top. Recipe 08 has the full steps and measurements.

steps:
1. Add a new adjustment layer at the top of the stack, above the title. (said; menu shown; position above the title shown)
2. On it: Effect > Blur & Sharpen > Camera Lens Blur, found by typing in the Effects & Presets search. (said; search shown; effect shown; the category path is inferred)
   - Blur Radius: 5.0 (shown, the value was handled with the mouse but ended where it started; not said)
   - Iris Properties: Shape Hexagon, Roundness 0 %, Aspect Ratio 1.0, Rotation 0°, Diffraction Fringe 100.0 (shown)
   - Blur Map Layer: None (shown)
   - Highlight: Gain 0, Threshold 204, Saturation 0 (shown)
   - Edge Behavior: Repeat Edge Pixels on; Use Linear Working Space on (shown)
   - Before the mask, the whole picture is softened, title included. (shown)
3. With the adjustment layer selected, draw an ellipse mask with the ellipse tool: a circle centred on the frame, its diameter about the full frame height, touching top and bottom. (said "use one of the masking tools"; shown; size measured there: about 0.56 of the width by 1.0 of the height of the picture, i.e. a circle about 1080 px across in this comp)
   - Mask mode first Add, which blurs only inside the circle (shown).
4. Set the mask mode to Subtract, so the centre is cut out of the blur and only the sides outside the circle go soft. (said; menu shown, set to Subtract shown)
   - Mask Feather: 135.0, 135.0 px, about 0.125 of the frame height, spread half inside and half outside the path, so the soft and sharp zones blend. (not said; shown)
5. Add a second adjustment layer above the first and apply Effect > Noise & Grain > Noise. (said "noise effect"; second adjustment layer shown; Noise found by search, shown; category path inferred)
   - Amount of Noise: 8.0 % (shown; not said)
   - Noise Type: switch Use Color Noise off; it is on when the effect is applied (shown on) and off. Not said.
   - Clipping: Clip Result Values on (shown)
6. (Finished example only, not narrated) The title layer carries Invert (Channel RGB, Blend With Original 0 %) and Drop Shadow (Shadow Color black, Opacity 19 %, Direction 135°, Distance 43.0, Softness 338.0, Shadow Only off). These belong to the ready-made title, which turns its white lettering black on the pale plate with a very soft shadow. (shown, the opacity was lowered to 19 % around without a word)
7. (Finished example only, not narrated) By the end the stack has eleven disc pairs instead of eight, and the title's start is moved later (layer starting about 3.3 s, its IN marker about 6 s). (shown)

layout: Measured on the result frame (comp time about 3:08, picture crop 682,203,1284,722). The discs are those of 08: concentric on the frame centre, the visible edges right of the title at about 0.60 and 0.76 of the picture height from the centre (measured), neighbouring edges about 0.17 H apart, each disc's long soft shadow streaking right, the right side greyer than the left. The blur: the mask circle has a diameter of about 1.0 H centred on the frame (measured), so the sharp zone is the central circle where the title sits, since After Effects spreads a mask's feather half inside and half outside the path, the blur starts to rise inside the circle at about 0.44 H from the centre and reaches full strength at about 0.56 H (the 135 px feather, about 0.125 H wide), so only the left and right sides are fully soft. The effect is gentle: across the ring edges at the far left and right fifths of the frame the sharpest one-pixel step falls from about 17–27 grey levels before to about 8–10 after, while edges in the centre are untouched (measured, rough, on compressed video). The grain: not measurable on the recording; flat 16 x 16 patches on ring faces read a standard deviation of about 0.4–0.7 grey levels both before and after the noise (measured), because compression and the viewer's downscale erase it. The target is the shown setting at comp resolution: Noise 8 %, monochrome, clipped, which at 1920 x 1080 should give a clearly visible fine grain, far stronger than the recording shows (inferred; not measurable here). The title is the finished example's own graphic, black, centred, the main word about 0.27 H tall, with a soft shadow down and to the right (from its Drop Shadow at 135°). Motion: nothing in this recipe moves; the discs keep growing as in 08, and in this shot the title's letters and sub-line type on (from the title graphic, not this recipe).
timing and easing: none given; both adjustment layers run the full length of the comp (shown).
variations: The blur is optional and how you mask it is up to you (said). Noise makes "perfect" graphics less perfect (said); its amount is not discussed.
pitfalls: none given
build notes: Match names: "ADBE Camera Lens Blur", "ADBE Noise". Add the mask with layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"), set its "ADBE Mask Shape" to an ellipse (four-vertex shape with tangents) of diameter equal to the comp height centred on the comp, maskMode = MaskMode.SUBTRACT, "ADBE Mask Feather" = [135,135] (or about 0.125 x comp height in another comp size). Blur Radius 5 is for a 1920 x 1080 comp; scale it with the comp width. Noise: Amount of Noise 8, Use Color Noise off, Clip Result Values on.
unknowns: Whether the Blur Radius was ever left at a value other than 5.0 (the drag ends at 5.0); whether the noise layer has a mask (it does not appear to, but its mask group is never opened); the Camera Lens Blur's Iris Rotation, Blur Focal Distance and other values not changed are at their defaults as far as the frames show; why the stack grows from eight to eleven pairs (not shown being done); the title graphic's own animation. The result window is short (about 0.2 s): the recording pans and the mouse arrow enters the picture, and the title is still typing on in this window.

## Flat UI graphic on a glossy extruded plate
id: 10-2d-graphics-on-extruded-3d-plate
revision: 8970559a
job: add-depth; support: light-the-hero, show-real-screen
status: unproven
what it does for a beat: Turns a flat 2D card or UI panel into a solid, glossy object floating over a pale floor with a real cast shadow, while the graphic on its face keeps its exact flat colours. Reach for it when a 2D layout needs to read as a physical product shot without leaving After Effects.
what it looks like: A black rounded-rectangle panel with three light-grey pill buttons (icon plus label) and a small header row floats over a near-white, faintly cool background. The panel is tipped back slightly; its lower part catches a warm silvery reflection, a thin dark rim shows its thickness, and a soft dark shadow lies on the floor beneath it with a clear gap between panel and shadow.
ingredients:
- Advanced 3D renderer — built-in; the renderer menu at the bottom right of the Composition viewer (shown)
- Shape layer with Geometry Options (Extrusion Depth) and Material Options — built-in
- Pre-compose — built-in; Layer > Pre-compose dialog (shown)
- Environment light — built-in; Layer > New > Light, Light Type Environment (shown; the menu entry with its shortcut is on screen during)
- Plane mesh layer used as a shadow catcher — built-in (layer's Mesh Options read Plane, shown); how it was created is not shown
- The UI artwork itself came from a third-party template plugin; any flat vector card works (inferred)
steps:
1. Build the flat graphic in a 1920 x 1080 comp: one shape layer that is the background plate (a black rounded rectangle), above it, all the elements that sit on it (pills, icons, text). (said; plate and elements shown; comp size inferred from the camera in recipe 11: Zoom 2666.7 px = 39.6° horizontal, which fits a 1920-wide comp; frame rate 23.976 shown in the timecode readout)
2. Select every element except the plate and pre-compose them into one precomp. (said; shown)
   - Option: Move all attributes into the new composition (shown)
   - Adjust composition duration to the time span of the selected layers: ticked (shown)
   - Open New Composition: unticked (shown)
3. Turn on the 3D switch for both the plate and the graphics precomp, and set the comp's renderer to Advanced 3D. (said; Advanced 3D ticked in the renderer menu, shown)
4. On the plate, open Geometry Options and give it a little thickness. (said; shown)
   - Extrusion Depth: 26.0 (shown)
   - Bevel Style: None; Bevel Depth 2.0; Hole Bevel Depth 100.0% (left at defaults; shown)
5. On the plate, open Material Options. (said; shown)
   - Casts Shadows: On (said; shown)
   - Accepts Shadows: On; Accepts Lights: On (shown)
   - Ambient 100%, Diffuse 50%, Specular Intensity 50% (left as they were; shown)
   - Specular Shininess: 100% (raised from 5%) (said "max out"; shown)
   - Metal: 78% (lowered from 100%) (said "lower a touch"; shown)
6. Parent the graphics precomp to the plate. (said; Parent column reads the plate, shown)
7. Set the graphics precomp's Position Z to exactly -1, keeping its X and Y as they are (they read 1920.0,1080.0 after parenting), so its face sits just in front of the plate's front face and moves with it. (said; Position 1920.0,1080.0,-1.0 shown; Z was 20 before, per the timeline)
8. On the graphics precomp, set Material Options > Accepts Lights to Off so its colours stay flat and unshaded. (said; Accepts Lights Off and Accepts Shadows On shown in a crop)
9. Add a light: Layer > New > Light. (said "environment light"; dialog shown)
   - Light Type: Environment (said; shown)
   - Intensity: 100% at creation (shown)
   - Casts Shadows: ticked (said; shown)
   - Shadow Darkness: 100% at creation (shown); Shadow Diffusion is greyed out for this light type (shown)
   - Source: Default, i.e. no environment image (shown in the light's Light Options)
10. Rotate the plate so it is seen at an angle (not narrated as a step; done on screen while the material and light are set). Just after the result the plate reads X Rotation -29°, Z Rotation +2° (shown in a crop cut from the source video). Y Rotation is being dragged then and passes +7° and -6° (shown, and a) before reaching -45°; in the result the plate's left and right edges stand at nearly the same height, so Y is close to 0 (measured). Earlier passing values (X -29°, Y -33° to -37°, Z -17°) are not the result; aim for the layout shares.
11. Create a large plane mesh for the floor. (said; layer with Mesh Options Plane shown)
12. Rotate the plane 90° on X so it lies flat, then move it down below the plate. (said "rotate by 90" and "lower it"; X Rotation 90° shown, sign hidden under the cursor; Position 1096.0,616.0,0.0 → 1096.0,952.0,0.0 shown)
13. Set the plane's Accepts Shadows to Only, so only the shadow shows and the plane itself is invisible. (said; Compositing Options > Accepts Shadows: Only shown)
14. Scale the plane up until its far edge leaves the picture. (said; Scale 543% shown, then 888% shown)
15. Rotate the environment light and adjust its Intensity and Shadow Darkness until the shadow sits under the plate. (said; values at the result shown in crops cut from the source video)
   - X Rotation: +92° (shown)
   - Y Rotation: +200° (shown)
   - Intensity: 136% (tried 195% and 216% on the way; shown, and in the crops)
   - Shadow Darkness: 66% (from 100%; shown, it is still being dragged, reading 68%, and lands on 66%)
layout: Measured on the result frame (picture 1770 x 995 px, full-frame origin 928,297). Plate face: about 41% of the picture width (x 0.29–0.70) and 74% of its height (top edge y 0.09–0.12, bottom edge y 0.82–0.83), centred a little left of middle; the top edge is narrower than the bottom, so the top leans away from the camera, and the panel rolls slightly clockwise (measured). Pills: three, each about 32% of the picture width (x 0.33–0.66) and 12–14% of its height, centred at y about 0.28, 0.44 and 0.62 (measured); their fill reads flat neutral grey RGB 228,228,228 everywhere because Accepts Lights is off (measured). Header row (back arrow, label, time) sits across the top tenth of the plate (measured). Plate shading: pure black (RGB about 20) over the top two-thirds, grading through grey-brown to a warm silver highlight of about RGB 239,230,218 at the lower-left corner; this reflection comes from Metal 78% and Shininess 100% under the default environment light (measured; its source inferred). A thin darker rim about 1% of the picture height runs along the bottom edge; that is the 26-unit extrusion seen from above (measured). Shadow: one soft, wide band on the floor directly below the plate, from y about 0.84 to 0.93, as wide as the plate (x about 0.30–0.71), soft on the left and right ends, firmer along its lower edge, and separated from the plate's bottom edge by a visible gap, so the plate floats (measured). It is cast by the plate (the graphics precomp casts too but sits on the plate face). Its darkest value is about RGB 88 against a floor of about 237, i.e. 0.37 of the floor level; Shadow Darkness 66% predicts about 0.34, so the shown setting fits (measured). Background: near white with a faint cool tint, RGB about 233,239,242 on the left and 240,251,252 on the right, so slightly lighter towards the right; it comes from the comp's background solid, which carries an effect not opened on screen (measured; effect unknown). No floor edge or horizon is visible: the plane is invisible except for its shadow (measured). Nothing moves in the result.
timing and easing: none given; the result is a still pose (the example's elements carry their own template animation, not part of this technique)
variations: Rotate the plate freely once the graphics are parented and sit at Z -1 (said). Move the light's rotation and intensity to place the shadow, and change Shadow Darkness to taste (said). Any design or animation can be built on the plate afterwards (said).
pitfalls: The plane shows a hard edge until it is scaled up well past the frame (said). Shadows only appear on a layer that accepts shadows, so the floor plane is needed to see one (said). The graphics layer must have Accepts Lights off or its flat colours get shaded (said). While the Advanced 3D viewer refines, the shadow and reflections look grainy (seen); judge the look after it settles (inferred).
build notes: Set the comp's renderer to Advanced 3D: `comp.renderer = "ADBE Calder"`. "ADBE Advanced 3d" is Classic 3D, not Advanced 3D: under it Geometry Options are hidden and setting Extrusion Depth throws "property ... is hidden" (found in proof build 10 on After Effects 27.0, where comp.renderers lists "ADBE Advanced 3d", "ADBE Calder" and "ADBE Ernst", the last being Cinema 4D). Extrusion needs "ADBE Calder"; read comp.renderer back to check it took. Extrusion lives on the shape layer under Geometry Options > Extrusion Depth; Material Options holds Casts Shadows, Accepts Shadows, Accepts Lights, Specular Shininess and Metal. Accepts Shadows has three states (Off, On, Only); "Only" is what the floor plane needs. Parenting and Position Z = -1 are plain transform settings. The environment light and the plane mesh may not be creatable by older scripting APIs; if a script cannot make them, create them by hand (Layer > New > Light, type Environment; a plane mesh layer) and then set their values by script. No environment image is loaded (Source: Default), so the reflection comes from the default lighting. Sheen target, measured on the result: the face stays dark and the sheen is warm and bright only at the lower-left corner: just inside the corner about RGB 236,226,212 (the red channel touches 254 in spots, no pixel is white in all three channels), about 190 a third of the way along the bottom, about 145 at the middle of the bottom, about 79,75,69 at the lower-right corner; along the left margin it stays below 80 down to about 58 % of the plate height and passes 100 only in the bottom third. (The proof review of this recipe (proof 10), measuring a little further in, gives 191,186,180 at the lower-left and 81,77,72 at the lower-right, with no clipping.) A build with the shown Metal, Shininess and light rotation came out much whiter, with a band across the full width that clipped (proof 10). The review puts that down to the plate's size and distance from the camera and its view angle; what sets the sheen is not shown. The tutorial's plate Scale reads 78 % when its Scale row is first opened, just after the result and before it is dragged down to 66 % for recipe 11 (shown, crop of a frame). That it is the value at the result is inferred: between the plate's rotation and the light's rotation change (light X 92 / Y 200, X +7 / Y 0) and there is a jump cut between, so not every change is seen, but the plate's height on screen is about the same on both sides of the cut. The light change comes after the result, so the sheen target here is under X 92 / Y 200; recipe 11's frames are lit by X +7 / Y 0 and their sheen is not this target. The view is the comp's default camera ("Active Camera (Default)" in the viewer; no camera layer), so the camera distance is the default for a 1920-wide comp (Zoom 2666.7). With the face 41 % of the picture wide at 78 % and Z about 0 (the plate reads Z 0.0), the plate is about 1000 px wide and about 1170 px tall before scaling (inferred from the layout shares). Note that proof build 10 already used a 1000 x 1160 plate at 79 % and Z 0 under the default camera, so size and distance alone may not close the gap; the reference also rolls about 3° clockwise against the build's 1.6–1.9° (review), and its Y Rotation at the result is not shown. Tune the scene, not Metal, Shininess or the light, until the render measures as above.
unknowns: The plate's exact Y Rotation at the result (near 0 by the picture; read -6° to +7° mid-drag). The plate's size in pixels and its X/Y position. The sign of the plane's 90° X rotation. How the plane mesh layer was created (menu not shown). The background solid's effect (likely a gradient, not opened). Whether the graphics precomp's Casts Shadows was changed (it read On before the change and was not shown after). The light's position is irrelevant for an environment light; its rotation values between were passing values.

## Soft one-way blurred dark shapes with a bright stroke fringe on a pale ground
id: 01-blurred-stroked-shapes-on-light-ground
revision: 7620130e
job: fill-the-backdrop; support: finish-the-look
status: unproven
what it does for a beat: Turns two flat, crude shapes into a soft, lens-like backdrop in under a minute. Reach for it when a title or scene needs an organic, out-of-focus base layer rather than hard vector art.
what it looks like: Two huge near-black navy circles, one pushing in from above the frame and one from below, leave an hourglass of pale ice-blue light between them. Their edges are smeared vertically into wide soft gradients, and a saturated blue stroke on the circles shows as a thin blue band where dark meets light.
ingredients:
- Shape layers drawn with the Ellipse tool — built-in; toolbar Ellipse tool (shown)
- Solid layer for the background — built-in; Layer > New > Solid (inferred; the Solid Settings dialog is shown)
- Gaussian Blur — stock; found by typing in the Effects & Presets panel, where it sits under Blur & Sharpen (shown)
- Shape stroke — built-in; set from the toolbar Stroke swatch and width with both shape layers selected (shown)
steps:
1. With the Ellipse tool, draw a very large circle whose lower edge dips into the top of the frame; zoom the viewer well out (about 12–15 %) so it can extend far past the edges (said; shown)
   - Fill: a very dark blue, close to black (said "darkest blue"; the sampled fill reads about RGB 2, 11, 23 — inferred from pixels)
   - Stroke: none at this stage (shown, toolbar Stroke swatch crossed out)
2. Draw a second, equally large circle whose upper edge rises into the bottom of the frame, so the two leave a curved hourglass gap in the middle (said; shown)
3. Add a solid that fills the comp, set its colour to a very pale blue and put it at the bottom of the stack (said; shown)
   - Color: R 228, G 244, B 255 (#E4F4FF) (shown)
   - Size: 1920 x 1080, same as comp (shown)
4. Apply Gaussian Blur to the lower circle (said; shown)
   - Blurriness: 103.6 (said "around 100"; shown)
   - Blur Dimensions: Vertical (shown; the menu is opened from the default Horizontal and Vertical and Vertical is picked). The narrator suggests trying both one-way options; only Vertical is shown being chosen (said / shown)
   - Repeat Edge Pixels: off — the author calls this the most important part (said; shown)
5. Give the upper circle the same Gaussian Blur with the same three settings (shown; how it was copied is not shown — copy and paste of the effect is inferred)
6. Select both circle layers and give them a bright blue stroke from the toolbar (said "light colour"; shown)
   - Stroke Width: 9 px (shown; it passes through 10 px while being dragged)
   - Stroke Color: R 0, G 130, B 255 (#0082FF) (shown in the Shape Stroke Color dialog, frame 3630, as OK is pressed; the landed blue swatch is shown). The narrator says a light colour; the screen shows a saturated mid blue, and the screen wins. A paler blue (about #5598D8) is tried just before (shown).
layout: each circle is about 1.5 times the picture width across, so both overhang the left and right edges (measured, where the selected circle's box is about 387 px against a 255 px wide comp; not measurable on the blurred result frame); on the result frame the pale gap, measured at half brightness, runs from about 42 % to 55 % of the picture height near the centre and widens to about 18 % to 79 % at the left edge (measured); the gap is centred horizontally and roughly symmetric top to bottom (measured)
timing and easing: none given (nothing is animated in this part; the motion comes in technique 02)
variations: any shapes can stand in for the circles (said); either one-way blur direction can be used, swapping between Horizontal and Vertical for a different distortion (said)
pitfalls: leaving Repeat Edge Pixels on is the thing to avoid — it is stressed as the key setting (said); no other warnings given
build notes: Shape layers: comp.layers.addShape(), add "ADBE Vector Group" > "ADBE Vector Shape - Ellipse" (Size about 1.5x comp width, about 2900 px on a 1920 comp, measured — no value is given in the video), "ADBE Vector Graphic - Fill" (Color) and "ADBE Vector Graphic - Stroke" (Color, Stroke Width). Background: comp.layers.addSolid([228/255,244/255,1], name, 1920, 1080, 1) moved to the bottom. Effect: layer.Effects.addProperty("ADBE Gaussian Blur 2"); properties "Blurriness" = 103.6, "Blur Dimensions" = 3 (1 Horizontal and Vertical, 2 Horizontal, 3 Vertical), "Repeat Edge Pixels" = 0. All of this can be done by script; nothing here needs the interface. Comp: The composition reads 1920 x 1080 at 60 fps (solid "100% of comp" at 1920 x 1080, shown; 60.00 fps under the timecode, shown). Comparison crop: the frame is cut from the source video. Both circle layers stay selected to the end of this part, so their anchor and path handles sit at the centre of the picture; the crop is the left 47 % of the picture, which holds the blurred edges, stroke fringe and pale gap without handles or the mouse. The whole viewer picture at that moment spans about x 800–2576, y 380–1379.
unknowns: the exact fill colour of the dark circles (only sampled from pixels); the circles' exact size and position; how the blur was copied to the second circle; whether the stroke is added before or after the blur in the layer's contents order (default order assumed); the stroke's line join and other stroke options

## Breathing glow, darkest radial blur and fine grain finish for bright scenes
id: 02-glow-radial-blur-noise-finish-stack
revision: 37c482d0
job: finish-the-look; support: keep-it-alive
status: unproven
what it does for a beat: A three-adjustment-layer finish that makes any soft, light-backed composition bloom, pulse and gain film grit, with motion coming only from wiggle expressions. Use it over a blurred or abstract backdrop (in the tutorial, the blurred shapes of technique 01) when the frame feels static and digital.
what it looks like: The pale gap between two dark soft forms blooms into a near-white glow whose edges turn electric blue; the light slowly swells and recedes, the dark edges are pulled toward the centre by a radial streak, and a fine monochrome grain sits over everything.
ingredients:
- Adjustment layers (three) — built-in; Layer > New > Adjustment Layer, Ctrl+Alt+Y on Windows (menu shown)
- Glow — stock (Stylize category; applied from the Effects & Presets search, inferred)
- CC Radial Fast Blur — stock (Blur & Sharpen category, inferred)
- Noise — stock; Noise & Grain > Noise in the Effects & Presets panel (shown)
- wiggle() expressions — built-in; Alt-click the property's stopwatch (said)
steps:
1. Start from a composition with a bright, pale background and soft dark shapes over it (the result of 01, or any similar light-ground scene) (shown)
2. Add an adjustment layer on top of the stack (said; shown for the menu, for the layer)
3. Apply Glow to it and push the threshold to the top and the radius very high, because the background is bright (said; shown)
   - Glow Based On: Color Channels (shown)
   - Glow Threshold: 100.0 % (said "max out"; shown)
   - Glow Radius: 331 (said "highly increase"; shown)
   - Glow Intensity: 0.3 (said "lower the intensity"; shown)
   - Composite Original: Behind; Glow Operation: Add; Glow Colors: Original Colors; Color Looping: Triangle A>B>A; Color Loops: 1.0 (left at defaults; shown)
   - Glow Dimensions: reads "Horizontal..." truncated; taken to be the default Horizontal and Vertical (inferred)
4. Alt-click the Glow Radius stopwatch and enter a wiggle expression (said; shown)
   - Glow Radius expression: wiggle(2,100) (shown)
5. Duplicate the Glow effect on the same adjustment layer, so a second Glow with the same settings and the same radius expression sits under the first (said "duplicate the effect"; shown, where the copy reads Threshold 100.0 %, Intensity 0.3 and an expression-driven radius)
6. Add a second, separate adjustment layer above the first (said; shown)
7. Apply CC Radial Fast Blur to it (said; shown)
   - Center: 960.0, 540.0, the comp centre (default; shown)
   - Amount: 95.0 (said "around 95"; shown)
   - Zoom: Darkest, chosen because the background is bright (said; shown)
8. Alt-click the Amount stopwatch and add a wiggle (said; shown in a crop)
   - Amount expression: wiggle(2,10) (shown)
9. Optional: add a third adjustment layer on top and apply Noise for grit (said "if you want"; shown)
   - Amount of Noise: 9.0 % (shown)
   - Use Color Noise: off, unticked from its default of on (shown; still on, off)
   - Clip Result Values: on (shown)
layout: the adjustment layers are full-frame, comp-sized — the noise layer's handles sit on the picture's corners and edge midpoints and the glow layer's (measured); the radial-blur layer's size is never shown and is taken to be the same (inferred); the CC Radial Fast Blur centre is at the comp centre, 50 % / 50 % of the picture (measured from Center 960, 540 on a 1920 x 1080 comp); the underlying shapes are as in 01 (measured there)
timing and easing: no keyframes; all motion comes from wiggle expressions — wiggle(2,100) on both Glow Radius values and wiggle(2,10) on the radial blur Amount, i.e. two random moves a second (shown)
variations: on a bright background the glow wants maximum threshold and the radial blur wants Darkest (said); by implication a dark background would use other settings, but none are given here; the Noise layer is optional (said)
pitfalls: too much glow intensity overpowers the image, so keep it low (said); none other given
build notes: Each adjustment layer: comp.layers.addSolid([1,1,1], name, comp.width, comp.height, 1) then layer.adjustmentLayer = true, added so it sits above the scene. Glow: Effects.addProperty("ADBE Glo2"); set "Glow Threshold" (100 %), "Glow Radius" (331), "Glow Intensity" (0.3); check how the threshold is scaled by script before setting it. Then glowRadius.expression = "wiggle(2,100)"; the duplicate is easiest as effect.duplicate() or a second addProperty with the same values and expression. CC Radial Fast Blur: matchName "CC Radial Fast Blur"; "Center" [960,540], "Amount" 95 with expression "wiggle(2,10)", "Zoom" menu = Darkest (menu index 3 in Standard/Brightest/Darkest order — verify). Noise: "ADBE Noise"; "Amount of Noise" 9, "Use Color Noise" 0, "Clip Result Values" 1. Layer order from bottom: scene, glow layer, radial-blur layer, noise layer (shown). Comparison crop: frame cut from the source video; the noise adjustment layer is selected, so its handles sit on the picture's edges and centre — the crop is a left-side inset (about 43 % of the width) that avoids them; the whole viewer picture spans about x 760–2440, y 365–1300 at that time. The look wiggles, so compare the overall level and edge colour, not exact pixels. The mouse arrow flickers into the crop at 125.1, so the clean stretch is only about frames 7507–7514, checked frame by frame.
unknowns: whether the second Glow differs in any value (only threshold, intensity and an expression-driven radius are readable); how the Glow effect was found (likely the Effects & Presets search); whether anything was changed on the Glow Colors or Color A/B (they read Original Colors, white and black); blending modes of the adjustment layers (none changed on screen); noise defaults beyond those three values

## Drifting pockets of light from heavily blurred edge shapes
id: 03-blurred-light-shapes-at-frame-edges
revision: 7f0e0985
job: fill-the-backdrop; support: light-the-hero, keep-it-alive
status: unproven
what it does for a beat: Adds soft, moving patches of lighter tone around the edges of an otherwise finished frame, so the dark areas are not flat and the eye is pulled toward the centre. A quick pass to make a background feel lit and alive.
what it looks like: Inside the dark navy masses at the top and bottom of the frame, faint blue shafts and glows appear: one hazy patch spread sideways at the top centre and two vertical light columns rising from the bottom edge, all very soft and gently pulsing in strength.
ingredients:
- Shape layers drawn with the Ellipse tool — built-in (shown)
- Gaussian Blur — stock; Blur & Sharpen (shown)
- wiggle() expression — built-in (said; shown)
steps:
1. Draw circles in a lighter blue than the dark shapes and place them so they are cut by the frame edges: one at the top centre and two along the bottom (said "around the sides"; shown)
   - Fill: a mid blue, sampled at about RGB 53, 94, 160 (#355EA0) (inferred from pixels; the value is not shown)
   - Stroke: none (shown, toolbar Stroke swatch crossed out; a Stroke Options dialog is used on the way)
2. Keep these new layers above the finishing adjustment layers from technique 02, so the glow, radial blur and noise do not act on them (shown in the layer stack; not said — the effect of the order is inferred)
3. Give the circles Gaussian Blur with a very high blurriness, one-way on the bottom (said "vertical or horizontal"; shown)
   - One bottom circle: Blurriness 599.6, Blur Dimensions Vertical, Repeat Edge Pixels off (shown). The value appears first at 103.6, the dark shapes' value, before being raised, so the blur was probably copied from them (inferred)
   - Top circle: Blurriness 555.6, a fixed value shown in blue, not expression-driven (shown); Blur Dimensions reads a truncated "Horizontal...", which is how this panel shows Horizontal and Vertical (a plain Horizontal would fit, as Vertical does), so Horizontal and Vertical is taken (inferred; the menu is open with the pointer over Horizontal, so the pick is not certain); Repeat Edge Pixels off (shown)
   - Other bottom circle: has an effect (fx switch) but its settings are never shown
4. Scale the top circle down (not said; shown)
   - Scale: 70.0, 70.0 % (shown; changed from 75 %)
5. Alt-click the Blurriness stopwatch and add a wiggle so the light pockets pulse (said; shown)
   - Blurriness expression: wiggle(2,100) (shown, on one bottom circle only; the top circle's 555.6 shows in blue, so it has no expression)
6. In the finished state the three light circles are parented to the lower dark shape from technique 01 (shown; done off camera and not explained)
layout: each light circle is about 18 % of the picture width across before blurring (measured, about 132 px of a 714 px picture); the top circle is centred at about 48 % across with its centre on the top edge, then scaled to 70 % (about 13 % of the width; measured/shown); the bottom circles are centred at about 28 % and 68 % across with their centres on the bottom edge, each cut in half (measured). On the result frame the two bottom light columns are centred at about 27 % and 67 % across and each about 17 % wide at the bottom, and the top glow is centred at about 49 % across, about 20–21 % of the width at half brightness (measured)
timing and easing: no keyframes; motion comes from wiggle(2,100) on Blurriness (shown)
variations: Vertical or Horizontal can be chosen per shape (said); placement and number of shapes are free (inferred from "around the sides")
pitfalls: none given
build notes: Three shape layers with "ADBE Vector Shape - Ellipse" and "ADBE Vector Graphic - Fill" (no stroke), moved above the adjustment layers (layer.moveToBeginning() or moveBefore). Effects.addProperty("ADBE Gaussian Blur 2"): bottom circle "Blurriness" 599.6 with blurriness.expression = "wiggle(2,100)", "Blur Dimensions" 3 (Vertical); top circle "Blurriness" 555.6, no expression, "Blur Dimensions" 1 (Horizontal and Vertical, most likely); "Repeat Edge Pixels" 0 on both. The second bottom circle is not shown; mirroring the first is a guess. Top circle transform "Scale" [70,70]. Parenting: layer.parent = the lower dark shape. Everything is scriptable. Comparison crop: frame cut from the source video. At this moment the recording's UI is zoomed and the viewer picture spans about x 744–2386, y 156–1080; the crop is slightly inset to stay clear of panel edges. It is the only clean stretch: a circle is selected and shows handles, and title text starts to animate in over the picture. The look is still, apart from the wiggle.
unknowns: the light circles' fill colour (only sampled); the second bottom circle's blur settings and whether it has the expression; whether the top circle's Blur Dimensions is Horizontal and Vertical or Horizontal (the display points to the former); why the circles are parented to the dark shape; whether their opacity or blending mode was changed (nothing seen)

## Liquid merge of outlined circles with blur and choke
id: 04-blur-and-choke-gooey-morph
revision: fff1d625
job: fill-the-backdrop; support: keep-it-alive, one-to-many
status: unproven
what it does for a beat: Makes separate shapes fuse like drops of liquid when one drifts into another, so a plain layout of circles becomes an organic, slow-breathing background or a morph between two forms.
what it looks like: Near-black circles with a thin bright-blue rim on a pale cyan-white ground; where two circles touch they bulge into each other with a smooth neck instead of overlapping. After the finish the whole picture is soft and stretched vertically, with glowing blue edges and fine grain.
ingredients:
- Shape layers (Ellipse with fill and stroke) — built-in
- Adjustment layer — built-in
- Gaussian Blur — stock; Effects > Blur & Sharpen (menu path inferred; the search is not shown)
- Simple Choker — stock; Effects & Presets > Matte > Simple Choker (shown)
- Pre-compose — built-in; Layer > Pre-compose (dialog shown; menu path inferred)
- One Glow adjustment layer carrying two Glow effects, and one Noise adjustment layer, carried over from the finishing stack taught earlier in the video — stock
- 4-Color Gradient — stock; present on the shape layers in the finished example but switched off (shown)
steps:
1. In a comp with a black background, draw several circles of very different sizes (one large pair, a few medium, one small), each its own shape layer with a near-black navy fill and a bright-blue stroke. (said: shapes that already carry a stroke; shown)
   - Fill: about #020B17, near-black navy (shown, toolbar swatch; hex sampled)
   - Stroke colour: about #0080FF (shown, Stroke 1 Color swatch; hex sampled)
   - Stroke width: 9 px (shown)
   - Stroke Composite: Below Previous in Same Group (shown)
   - Number of shape layers: six (shown)
2. Add an adjustment layer above all shapes and apply Gaussian Blur at exactly 100. (said; shown)
   - Blurriness: 100.0 (said "exactly 100"; shown)
   - Blur Dimensions: menu reads "Horizontal…" truncated; most likely Horizontal and Vertical (shown; full wording inferred)
   - Repeat Edge Pixels: on (shown)
3. On the same adjustment layer, below the blur, add Simple Choker and raise Choke Matte until the blur halo is gone and the shapes have hard, smooth edges again. (said; shown)
   - View: Final Output (shown)
   - Choke Matte: 14.20 (shown)
4. Move one shape toward another; where they meet, the edges flow together. On screen the author drags a medium circle from the top left rightwards and slightly down into the very large top-right circle; the smallest circle stays put. (said; shown start, merged)
   - Position is keyframed in the finished example: motion paths are visible on several layers (shown). The author's own keys and timing for the demo are not shown (inferred).
5. Animate the stroke away while two shapes fully merge, so the rim fades out during the join. (said; shown)
   - Stroke Width: 9.0 → 0.0 (shown at 9.0 with the playhead before the keys; 0.0 landed)
   - Keys at about 3.1 s and 4.0 s comp time on one shape layer (shown, keys read off the ruler; playhead 3:58 on the second key)
6. Select every layer (shapes and the blur/choke adjustment layer) and pre-compose them, moving all attributes into the new comp. (said; shown)
7. In the parent comp put a pale background solid at the bottom. (said: white background at the bottom; shown)
   - Colour: very pale cyan-white, about #CCFEF9 as rendered under the finish (inferred from the result frame; the solid's own value is not shown)
8. Apply the shape blur from the first technique to the pre-comp layer. (said; shown)
   - Gaussian Blur Blurriness: 103.6 to start (shown), then lowered (said) to about 55–60, last reading 57.9 (shown)
   - Blur Dimensions: Vertical (shown)
   - Repeat Edge Pixels: off (shown)
   - Pre-comp layer Scale: 107% (shown), later 109% (shown); likely to push the soft, un-repeated edges off frame (inferred)
9. Apply the finishing stack from earlier: copy the Glow adjustment layer (one layer holding two Glow effects, Glow and Glow 2, shown) and the Noise adjustment layer from the first technique's comp and paste them above the pre-comp (the earlier comp is opened to fetch them, shown). Visible values in this span: (said; shown)
   - Glow: Glow Based On Color Channels, Threshold 100.0%, Radius driven by an expression (value shown in red, 367.2 at that moment), Intensity 0.3, Composite Behind, Operation Add (shown)
   - Noise: Amount of Noise 9.0%, Use Color Noise off, Clip Result Values on (shown)
   - Layer order top to bottom: Noise adjustment, Glow adjustment, pre-comp, pale background (shown). The earlier radial-blur adjustment layer is not copied here (shown : only the two adjustment layers are present).
layout: measured on the result frame, as shares of the cropped viewer picture (which is the whole comp): a large dark mass fills the left side, its right edge running from about 25% across at the top to about 50% across at the bottom, with a rounded bump (a merged circle) at its top-left reaching down to about 25% of the height (measured). A second large dark mass fills the upper right, its left edge at about 52% across at the top curving down to about 60% across at 50% height, and it necks down at about 80% across, 75% height, into a smaller lobe at the bottom right starting about 76% across (measured). The pale ground shows as a diagonal channel about 20–25% of the picture width wide, running from top centre to bottom right (measured). Blue rims about 2–3% of the width wide line every edge (measured).
timing and easing: Stroke Width 9 → 0 over roughly 3.1–4.0 s on one layer; easing not readable. Position animation in the finished example exists (motion paths) but its keys, durations and eases are not shown.
variations: Lower the pre-comp's blur amount to taste (said). The morph can be animated in any way (said).
pitfalls: The blur must be exactly 100 before the choker is tuned (said; the choke value 14.2 pairs with it, inferred).
build notes: Shapes: ADBE Vector Group with ADBE Vector Shape - Ellipse, ADBE Vector Graphic - Fill, ADBE Vector Graphic - Stroke (Stroke Width 9, Composite "Below Previous in Same Group"). Adjustment layer: comp.layers.addSolid(...) with adjustmentLayer = true. Effects: "ADBE Gaussian Blur 2" (Blurriness, Blur Dimensions, Repeat Edge Pixels), "ADBE Simple Choker" (View, Choke Matte). Order matters: blur first, choker second, on the same adjustment layer. Stroke fade: keyframe the shape's Stroke Width. Pre-compose: comp.layers.precompose([indices], name, true). Pre-comp: "ADBE Gaussian Blur 2" Vertical, Repeat Edge Pixels off, Scale 107–109. Finish: two "ADBE Glo2" on one adjustment layer (first: Threshold 100, Intensity 0.3, Radius with a wiggle-type expression; second from technique 02) and "ADBE Noise" (Amount 9) on adjustment layers. 4-Color Gradient ("ADBE 4ColorGradient") sits disabled on the finished shapes and can be skipped. All of this can be scripted; dragging the shapes into each other is just Position keyframes.
unknowns: Comp size (likely 1920x1080) and background colour value; exact Blur Dimensions setting of the adjustment-layer blur (menu text truncated); circle sizes and positions; position keyframes, durations and easing of the merge in the finished example; whether other layers also have stroke-width keys; final pre-comp blur value (dragging stopped near 57.9); the glow radius expression text and the second Glow's settings (from technique 02); why the shapes carry a disabled 4-Color Gradient.

## Turning a crude gradient disc into a grainy glowing orb
id: 06-gradient-shapes-blur-noise-glow-posterize
revision: e00e3d8c
job: light-the-hero; support: finish-the-look
status: unproven
what it does for a beat: Rescues a deliberately plain graphic (two gradient circles) into a soft, filmic hero object for a title card or an event poster background, using only blur, heavy grain, a huge glow and posterize.
what it looks like: On a near-black ground, a blurred white ring whose top edge is brightest, holding a smaller disc that fades from dark at the top to bright white at the bottom; a wide soft halo around it and coarse monochrome grain over the whole frame.
ingredients:
- Ellipse shape layers with a Gradient Fill — built-in
- Parenting — built-in
- Gaussian Blur — stock
- Noise — stock; Effects & Presets > Noise & Grain > Noise (shown)
- Glow — stock
- Posterize — stock
- CC Radial Fast Blur — stock (Blur & Sharpen); found by search in Effects & Presets
- Adjustment layers — built-in
steps:
1. On a black background, draw a large circle as a shape layer with a linear black-to-white gradient fill and no stroke. (said: black to white gradient; shown)
   - Gradient Fill Type: Linear (shown)
   - Start Point: 0.0, -283.6; End Point: 0.4, 112.6 (shown). These give a hard light-to-dark edge across the middle (shown) and are the values before a jump cut.
   - At a jump cut around the gradient is changed off screen: from then on both discs fade softly across their whole height, the outer circle white at the top to black at the bottom, the inner disc the reverse (shown). The new Start/End Point or colour-stop values are not shown; spread the ramp across the full disc (inferred).
   - Stroke 1: switched off (shown)
2. Duplicate the circle, turn the copy 180 degrees and scale it down, so the smaller disc's gradient runs the opposite way inside the ring. (said; shown)
   - Rotation: 180° (said; the inverted gradient is visible, the value itself is not shown)
   - Scale: 80% (shown)
   - Parent the copy to the original circle (not spoken; it appears across the same jump cut, shown)
3. Blur the shapes with Gaussian Blur. (said; shown)
   - Blurriness: 79.3 on the outer circle (shown)
   - Blur Dimensions: menu reads "Horizontal…" truncated; most likely Horizontal and Vertical (shown; full wording inferred)
   - Repeat Edge Pixels: off (shown)
   - The inner copy also carries an effect (fx switch, shown); its value is not shown (inferred to be the same blur)
4. Add an adjustment layer over both shapes and apply Noise, turned up hard. (said; shown)
   - Amount of Noise: 24.0% (shown; 19% first)
   - Use Color Noise: off; Clip Result Values: on (shown)
5. On the same adjustment layer add Glow with a very large radius. (said; shown)
   - Glow Threshold: 60.0%; Glow Intensity: 1.0 (shown; the effect defaults, left alone, inferred)
   - Glow Radius: 163 first (shown), then 832.0 (shown)
   - Composite Origin Behind, Glow Operation Add, Glow Colors Original Colors, Color Looping Triangle, Glow Dimensions "Horizontal…" (shown)
6. On the same adjustment layer add Posterize. (said; shown)
   - Level: 21 (shown)
7. Dark-background option: keep the background dark rather than bright. In this build the background is a black solid carrying a white Fill effect that is switched off (shown) and then deleted (shown). The bright version is not shown in this span. (said; shown)
8. Add a second adjustment layer on top with CC Radial Fast Blur at a low value. (said; shown)
   - Center: 960.0, 540.0 (shown)
   - Amount: 50.0, which is the effect's starting value; the narrator asks for a low value but no change from 50 is seen (shown)
   - Zoom: changed from the default Standard (shown) to Brightest (shown)
9. Optional: switch on the blurred side-light shapes from the earlier light-contrast technique for extra edge light (reuse of the frame-edge shapes; values from that technique). (said: side lighting; shown, one side shape with Gaussian Blur 308.7)
layout: measured on the result frame, as shares of the cropped viewer picture (the whole comp): the outer ring spans about 26–75% of the width and 10–85% of the height, so about 49% of the width and 75% of the height (blurred edges included), centred about 50% across and 47% down (measured). The bright band of the ring is thickest at the top, about 10% of the height (measured). The inner disc spans about 33–67% of the width and 22–84% of the height, its brightest part at the bottom (measured). A faint halo reaches about 5% of the width beyond the ring (measured).
timing and easing: none given; the build is a still image.
variations: Keep the ground dark rather than light (said). Rework the same ideas on any basic object (said). A glass-refraction pass is mentioned but taught elsewhere, not in this video.
pitfalls: none given
build notes: Shapes: ADBE Vector Group with ADBE Vector Shape - Ellipse and ADBE Vector Graphic - G-Fill (Type Linear, Start Point, End Point; gradient colours need the Colors property set via a gradient-stops value, which is awkward by script and easy by hand in Edit Gradient). Duplicate with layer.duplicate(), set Rotation 180, Scale 80, parent to the original. "ADBE Gaussian Blur 2" (Blurriness about 79, Repeat Edge Pixels off). Adjustment layer 1 in this order: "ADBE Noise" (Amount of Noise 24, Use Color Noise off), "ADBE Glo2" (Glow Radius 832, Threshold 60, Intensity 1), "ADBE Posterize" (Level 21). Adjustment layer 2 above it: "CC Radial Fast Blur" (Center 960,540, Amount 50 or lower, Zoom Brightest). Background: black solid; the white "ADBE Fill" is the bright-background switch.
unknowns: The final gradient's Start Point, End Point and colour stops after the off-screen change; comp size (Center 960,540 suggests 1920x1080); circle size and position; exact gradient colours; the inner copy's blur value; the exact Blur Dimensions of the shape blur; whether the radial blur Amount was lowered below 50; what the bright-background version looks like with this stack; the finished example shown at the start of the span contains extra layers (displacement, a separate blur layer, titles) whose settings are not taught here.

## Fade both ends of an open stroke with Taper
id: 03-tapered-stroke
revision: c61c2fb0
job: fill-the-backdrop; support: add-impact
status: proven (accepted 2026-11-14)
what it does for a beat: Makes an open stroke thin to nothing at both ends, so a light streak, horizon arc or swoosh fades out softly instead of stopping in a hard square end.
what it looks like: A glowing blue-white arc, like a planet's rim, curves over a centred multi-line headline on a dark navy background. It is brightest and thickest at the top and thins to nothing at both ends.
ingredients:
- Shape layer with an open stroked path (here a trimmed ellipse) — built-in
- Stroke > Taper — built-in; inside the stroke group
- Gaussian Blur, CC Radial Fast Blur and Glow on the same layer — stock; already applied with their settings, then switched on one at a time on screen
steps:
1. Start from a shape layer with an open stroke: here an ellipse shortened with Trim Paths to an arc, white, butt cap. (shown)
   - Stroke Width: 16.0 (shown)
   - Color: white (shown)
   - Line Cap: Butt Cap (shown)
   - Trim Paths 1: present inside the shape's contents (shown); its values are not shown
2. Build up the look by switching on the stroke layer's own effects in order. The effects are already applied with the settings below; on screen their eyes are turned on one at a time, and nothing is said about it. (shown)
   - Start: all three effects off and the headline not visible; the viewer shows a plain thin white arc on black (shown)
   - Then Gaussian Blur and CC Radial Fast Blur on: the arc becomes a soft, rayed streak (shown)
   - Then Glow on, with the headline visible again: the streak glows blue-white behind the headline (shown)
   - Gaussian Blur > Blurriness: 9.9; Repeat Edge Pixels: on (shown)
   - CC Radial Fast Blur > Center: 962.4, 692.4; Amount: 62.0; Zoom: Brightest (shown)
   - Glow > Glow Based On: Color Channels; Glow Threshold: 60.0%; Glow Radius: 90.0; Glow Intensity: 1.0; Composite Original: Behind; Glow Operation: Add; Glow Colors: Original Colors; Color Looping: Triangle A>B>A; Color Loops: 1.0; Color Phase: 0x+0.0° (shown)
3. Open Contents > Ellipse 1 > Stroke 1 > Taper. (said; shown)
   - Length Units: Percent (shown)
4. Raise Start Length and End Length so the stroke thins from its middle out to each end. (said; shown, being dragged; set)
   - Start Length: 100.0% (shown)
   - End Length: 100.0% (shown)
   - Start Width: 0.0% (shown; left at default)
   - End Width: 0.0% (shown; left at default)
   - Start Ease: 0.0% (shown; left at default)
layout: arc: a glowing arc across the top half, visible from about 0.18 to 0.84 of the comp's width (0.66 wide); its crest sits at 0.51 across, 0.19 down, and its two faded ends at about 0.46–0.49 down, level with the headline's second line; its core is thickest at the crest (about 0.03 of the height with glow) and narrows to a hairline and dim at both ends; it reads as part of a circle of radius roughly 0.37–0.45 of the width centred below the crest (rough fit); headline block: about 0.40 of the width wide, centred at 0.50, from 0.39 to 0.75 down (all measured on a still of the result, shares of the whole comp: the viewer shows the full 16:9 picture at 43.2%)
timing and easing: none given
variations: none given
pitfalls: The narrator ties it to open stroked lines (said). On a closed path there are no ends to taper, which is why the example's ellipse is trimmed open first (inferred).
build notes: By script: in the stroke ("ADBE Vector Graphic - Stroke"), the taper group is "ADBE Vector Stroke Taper". Set "ADBE Vector Taper Length Units" to Percent (value 1; 2 is Pixels, and with Pixels the percent lengths are hidden and cannot be set: inferred: found in a proof build, not said or shown), then "ADBE Vector Taper Start Length" and "ADBE Vector Taper End Length" to 100. Start Width and End Width stay at 0. Taper needs After Effects 2020 (17.0) or later. The arc comes from "ADBE Vector Filter - Trim" on an ellipse. The blue colour is not explained: the Glow uses Original Colors, so something else tints it, perhaps an effects layer higher in the stack. Check the match names on the build machine.
unknowns: The Trim Paths start and end, and the ellipse size, which set the arc's length. The End Ease value, which is off screen. Where the blue tint comes from. The Gaussian Blur's Blur Dimensions setting, cut off as "Horizontal and…", probably Horizontal and Vertical. Whether the arc animates later in the piece; it holds still in the result window.

## Slide a background endlessly with mirrored tiling
id: 09-endless-background-tile
revision: dff1920a
job: fill-the-backdrop; support: keep-it-alive, establish-place
status: proven (accepted 2026-11-14)
what it does for a beat: For a background that has to keep moving longer than the artwork is wide, such as the view out of a moving vehicle's window; the image is repeated and slid along without visible seams.
what it looks like: An illustrated landscape (hills, trees, sky) seen through a train window behind a seated character. With the effect animating, the landscape scrolls sideways past the window and keeps going, the repeated copies flipped at the joins so there is no hard edge.
ingredients:
- Motion Tile — stock; found by typing in the Effects & Presets search (shown)
steps:
1. Select the background artwork layer (here a vector landscape layer that already has a Curves effect) and apply Motion Tile (said; search shown, effect in Effect Controls)
   - Tile Center: 960.0, 540.0 (default, shown)
   - Tile Width: 100.0 (shown)
   - Tile Height: 100.0 (shown)
   - Output Width: 100.0 (shown)
   - Output Height: 100.0 (shown)
   - Phase: 0x +0.0° (shown)
   - Horizontal Phase Shift: off (shown)
2. Tick Mirror Edges (said; unticked, ticked)
   - Mirror Edges: on (said, shown)
3. Animate Tile Center (said), changing only X (shown). As demonstrated on screen: the stopwatch is switched on with 960.0, 540.0 at 0:00:03:20 (shown), then X is dragged at 0:00:03:21 (3720.0; 3920.0, cut from source). This keyframed version is never played back in the video.
4. The finished example that plays is set up differently: Tile Center has its stopwatch off (no keyframes) and its value shown in red, (shown, playhead reading 0:00:04:00); After Effects shows a value in red when an expression drives it, so the finished slide comes from an expression (inferred)
   - Tile Center: -6006.0, 540.0 as displayed (shown). The screen wins here over the timeline's "6006.0": the value is negative.
   - The expression itself is never shown (see unknowns)
5. Play back: the landscape slides sideways through the window continuously (shown against)
layout: main window opening the landscape slides through: about 4–90% across, top edge at about 15% down, bottom edge at about 90% down (the part left of the post behind her starts lower, at about 30% down) (measured, shares of the whole comp: viewer at 43.9%, picture edges inside the viewer and matching the crop to within a few pixels); character in front of it: about 15–52% across (measured, shares of the whole comp: viewer at 43.9%, picture edges inside the viewer and matching the crop to within a few pixels); second narrow window strip: about 97–100% across (measured, shares of the whole comp: viewer at 43.9%, picture edges inside the viewer and matching the crop to within a few pixels); landscape inside the window: mountain peaks about 25–30% down, tree line from about 35% down to the window's bottom; the mirrored joins do not show in this still (measured, shares of the whole comp: viewer at 43.9%, picture edges inside the viewer and matching the crop to within a few pixels)
timing and easing: Only X of Tile Center changes; Y stays 540 (shown). Keyframed demonstration: 960 at 3:20, X being dragged to about 3720–3920 at 3:21 (shown), never played. Final playback: expression-driven; the expression is not given, but in the result clip the landscape slides right to left by about 65 px of the result crop, about 80 comp px, per comp frame (measured on). That fits a steady slide from 960 at 0 s to the −6006 seen at 4 s, about 1740 px a second (inferred). Easing none given.
variations: none given
pitfalls: none given
build notes: Effect "Motion Tile" (match name ADBE Tile). Properties as shown: Tile Center, Tile Width, Tile Height, Output Width, Output Height, Mirror Edges, Phase, Horizontal Phase Shift. Script: add the effect and set Mirror Edges to 1. The result shown is driven by an expression on Tile Center whose text is not shown; a linear time-based X offset such as [960 - time*k, 540] is our guess (inferred). The keyframed route the author demonstrates (Tile Center X from 960 to a far value) should also work but is not seen playing (inferred). Default Tile Center 960, 540 implies a 1920x1080 comp (inferred). The comp has a camera (Active Camera shown) but the tile is a 2D effect.
unknowns: the Tile Center expression that drives the finished playback (only its red displayed value, -6006.0, 540.0, is seen); the second keyframe of the demonstration (its time and final X are not legible); the exact speed of the slide (direction and rough speed are measured, see timing); whether Output Width was raised (all sizes stay at 100 in the frames seen); a jump shows Mirror Edges unticked and Tile Center at 960, 540 at 0:00, so the edit order is unclear.

## Soft embossed finish for white shapes on a pale background
id: 11-white-on-light-finish
revision: 0f345098
job: add-depth; support: finish-the-look
status: proven (accepted 2026-11-14)
what it does for a beat: When a pure white shape or title vanishes into a light background, two layer styles give it a faint cool shading and a bright rim. On their own they only tint the shape; it reads as a raised, soft-plastic object once a long soft shadow lies under it and the shapes around it get the same treatment, so the pieces look stacked.
what it looks like: Five pale discs stacked on a near-white, faintly cyan page: a large one in the middle carrying a small dark two-line title, and four smaller ones tucked partly behind it, slightly out of focus. Every disc has the same gentle diagonal grey-blue shading (lightest lower left, darkest upper right) and throws a long, soft grey shadow to the left and downward, darkest right at its own edge, so the left half of the page is full of overlapping shadow and the right third is clean; the big disc's shadow lies across the discs behind it. The bright rim shows only where that dark shadow sits behind it. The full scene, seen before the demonstration, has five more small sharp discs in front of the big one, each shading its face.
ingredients:
- Gradient Overlay layer style — built-in; right-click the layer > Layer Styles > Gradient Overlay (shown; the same submenu also sits under the Layer menu, inferred)
- Bevel and Emboss layer style — built-in; right-click the layer > Layer Styles > Bevel and Emboss (shown)
- A long soft shadow layer under each disc — stock effects; the next tip's method, recipe 12 (layer shown; method inferred)
- An adjustment layer that softens the discs behind the main one — built-in layer, stock blur (layer shown; effect inferred)
- A page with a faint left-to-right gradient — stock (measured on the source; how it is made is not shown)
steps:
1. Select the white shape layer and add a Gradient Overlay layer style (said; menu shown, style in the timeline shown)
   - Blend Mode: Normal (shown)
   - Opacity: 100 % (shown)
   - Gradient Smoothness: 100.0 % (shown)
   - Angle: 0x +40.0° (shown; not said)
   - Style: Linear; Reverse: Off; Align with Layer: On; Scale: 100.0 %; Offset: 0.0, 0.0 (shown)
2. Click Edit Gradient and pick two light-to-mid grey-blue colours (said "light to medium grey bluish"; values shown in the Gradient Editor)
   - Stop at 0 %: #F1F5F7 (H 200°, S 2 %, B 97 %) (shown)
   - Stop at 99.8 %: #DAE1E7 (H 210°, S 5 %, B 91 %) after trying #E0E5E9 and #DDE3E9 (shown, earlier values)
3. Add a Bevel and Emboss layer style to the same layer (said; menu shown)
   - Style: Inner Bevel (shown)
   - Technique: Smooth (shown)
   - Depth: 100.0 % (shown)
   - Direction: Up (shown)
   - Size: 5.0 (shown)
   - Soften: 0.0 (shown)
   - Use Global Light: Off; Angle: 0x +120.0°; Altitude: 0x +30.0° (shown)
   - Highlight Mode: Screen; Highlight Color: white (shown)
   - Highlight Opacity: 100 % (said "both opacities to 100 %"; shown)
   - Shadow Mode: Screen (said; shown)
   - Shadow Color: white (said; shown)
   - Shadow Opacity: 100 % (said; shown — still 75 % before it was changed)
4. Give every other disc in the scene the same two styles; the finish is not on the main disc alone (inferred from the picture: the layers of the other discs are never opened, but each disc's face carries the same diagonal shading and a front disc shows the bright rim)
   - Shading on the other discs: about 231 at the upper right to about 238 at the lower left of each face, grey level, half way out from the centre; the main disc reads 224 to 240 edge to edge (shown, measured for the five front discs and for the top and lower-right back discs)
   - Rim on a front disc: about 242 against a face of 229 (shown, measured); on the four back discs the rim is smeared away by their blur (shown)
5. Put a shadow layer directly under every disc and parent it to that disc: in the layer stack each disc is followed by its own shadow layer, which carries effects and has the disc as its parent (shown, layer list with hidden layers revealed: seven disc-and-shadow pairs are in view, and the layer numbers of the rest, seen, leave one gap under each remaining disc; ten discs in all)
   - How the shadow layers are made is not opened in this scene. Their naming, position under the object and parenting are the same as in the next tip's finished example, which uses a black copy without layer styles, smeared with CC Radial Fast Blur at a high amount and softened with Gaussian Blur (inferred; see recipe 12 for that method)
   - Target for each shadow: no shadow at all on the disc's upper-right side; full strength right at the disc's edge on the left and lower side, about 55 to 65 grey levels below the clean page there (page about 238 to 243, shadow about 172 to 185, a neutral grey near #B0B7B8, as if black at roughly a quarter strength); no hard outer edge anywhere (shown, measured; per-disc figures in layout)
   - No separate tight contact shadow: just outside the main disc's edge the grey is flat (172 for at least 6 px at the left) and then lightens steadily; the long shadow itself is densest at the edge (shown, measured)
6. Stack the scene in this order, bottom to top: page; the four back discs, each above its own shadow; an adjustment layer that softens everything beneath it; the main disc's shadow; the main disc; five smaller front discs, each above its own shadow (switched off while the result plays); an adjustment layer carrying effects; the two title text layers; a nested comp with small credit lines (shown with hidden layers revealed; the picture shows the front discs switched on, with the hidden layers folded away in its list)
   - Because the main disc's shadow sits above the back discs and the softening layer, it falls across those discs and stays as sharp as it was made: the left back disc reads 222 to 226 on its far side and 174 to 183 beside the main disc (shown, measured)
   - Back discs slightly out of focus: their edges change over about 0.3 to 0.5% of the picture width (4 to 7 px in 1336), the main disc's over about 0.15 to 0.2% (2 to 2.5 px), so the back discs are two to three times as soft (shown, measured on the edges that face clean page; that the adjustment layer's effect is a blur is inferred from this and from its position, the effect is never opened)
7. Give the page a slow left-to-right gradient, not a flat colour (shown, measured on the source, where the comp is at its first frame and the page is almost empty)
   - Left edge about #E8EFF2 (238), centre about #EBF5F6 (243), right edge about #EFFAFB (247); the bottom about 2 to 4 levels darker than the top; no vignette at the corners, no grain (a flat patch of page has no pixel noise) (shown, measured on the source)
layout: all figures measured on the result picture (crop as in result; shares of the picture's width W and height H; grey levels are the mean of R, G, B; angles counted anticlockwise from the picture's right: 0° right, 90° up, 180° left, 270° down). Main disc: diameter 37.5% W (about 67% H), centre 50% across, 50.5% down (measured); shading along the 40° diagonal across the disc itself, about #ECF2F3 just inside the lower-left edge, #E3E9EC at the centre, #DAE1E6 just inside the upper-right edge, 15 to 16 levels end to end, so the dark end lands on the upper-right edge at the #DAE1E7 stop, while the light end stops 3 to 5 levels short of the #F1F5F7 stop (measured; why the light stop does not reach the edge is not shown); rim about 0.2% W wide (2 to 3 px in a picture 1336 px wide), 248 to 254 on the lower-left half against a face of 239 and a shadow of 172 behind it, and level with the page (245 against 243) on the upper right, where the face is 224 (measured). Main disc's shadow: covers the arc from about 80° round through the left to about 300°, nothing from 340° through 0° to 60°; long axis toward about 210° (left and about 30° down); at the edge 38 to 56 levels below the clean page on the upper left (100° to 160°) and 59 to 70 on the left and lower left (180° to 260°); on the short upper-left side it halves 12% of the disc's diameter out (about 5% W) and is gone half a diameter out (19% W); along the long axis it is still at full depth a quarter of a diameter out, halves about half a diameter out (19% W) and is about 14 levels at three quarters of a diameter (28% W); the left frame edge at the bottom corner is still about 8 levels down (measured; along the long axis the back discs' shadows add to it). Back discs, all partly under the main one (centres and diameters from circle fits to the visible edge, measured): top disc centre 57% across, 9% down, diameter about 10.5% W, shadow to the left, about 180°, about 40 levels at the edge, 31 to 36 half a radius out, about 20 at one and a half radii (a few of those levels are the main disc's upper-left shadow); left disc centre 25% across, 50% down, diameter about 16.5% W, shadow mostly downward, about 250°, 55 to 65 levels at the edge, about 45 half a radius out, about 30 one radius out; lower-left disc centre 36.5% across, 85% down, diameter about 21% W, shadow to the left, about 180° to 200°, 62 to 64 at the edge, 45 half a radius out, 30 one radius out (10.5% W), 19 at one and a half radii; lower-right disc centre 64.5% across, 81% down, diameter about 18% W, shadow down and left, about 240°, 45 to 50 at the edge from 240° to 260°, about 32 at 280°, 12 at 300°, 5 or 6 at 320° and 330°, clean from 340° through 0° to 60° (below 240° it merges with the main disc's shadow and the bottom line of text, so its direction is read from the 240° to 330° side only). The directions differ from disc to disc, as they do in the next tip's example; every one falls to the left or downward, none to the right or upward. Where two shadows overlap they add up, to about 85 levels below the page between the two lower discs (measured). Clean page: nothing darker than the page gradient right of about 75% across (measured). Title on the main disc: first line about 39–61% across, letters about 4% H tall, at about 47% down; second line about 42–58% across, about 2.5% H tall, at about 52% down (measured). Front discs of the full scene (comp at its first frame, discs still moving in, so positions are not final): five discs of about 16%, 9%, 9%, 5% and 5% W across, sharp-edged, sitting over the main disc's rim; each darkens the main disc's face to its left by about 20 to 50 levels (measured)
timing and easing: none given (static finish; the comp's own build-on animation plays at the end but is not part of the technique)
variations: none given beyond "any white graphic". The author's own scene exists in two states: the full one with ten discs and the one the result plays, with the five front discs switched off; either is a fair target (shown)
pitfalls: none given by the author. From a proof build (inferred: found in a proof build, not said or shown): the two styles alone on one disc, with plain white discs and no shadows around it, come out as a tinted disc with a thin rim among flat circles; the stacked, raised look needs steps 4 to 7. The rim cannot be seen against the page (245 against 243), only against a shadow, so a disc with no shadow behind its lower-left edge shows no rim however the bevel is set. A white disc with no styles on the pale page is lighter than the page; the reference discs are darker than the page at the upper right (224 against 243) and that edge is drawn by the face, not by the rim
build notes: Result window: the viewer is still zooming and moving within the crop, and the comp loops to an empty background (shown, source cuts). The mouse cursor sits over the picture throughout the window (no cursor-free frame exists); mask it when comparing. Do not mask the shadows or the other discs: they are most of the look, and a build is to be judged on the whole picture, shadows included. Layer styles cannot be added with addProperty; select the layer and run app.executeCommand(app.findMenuCommandId("Gradient Overlay")) and app.executeCommand(app.findMenuCommandId("Bevel and Emboss")). Properties then sit under "Layer Styles" > "Gradient Overlay" ("Blend Mode", "Opacity", "Colors", "Gradient Smoothness", "Angle", "Style", "Reverse", "Align with Layer", "Scale", "Offset") and "Layer Styles" > "Bevel and Emboss" ("Style", "Technique", "Depth", "Direction", "Size", "Soften", "Use Global Light", "Angle", "Altitude", "Highlight Mode", "Highlight Color", "Highlight Opacity", "Shadow Mode", "Shadow Color", "Shadow Opacity"). The gradient "Colors" value cannot be set by script; set the two stops by hand in the Gradient Editor, or apply a saved style/preset that already holds them. If a Gradient Ramp effect stands in for the overlay, run it across the disc's own diameter along 40° and give its two points as plain comp pixels on a shape layer; a ramp spanning the layer's bounding box, or points passed through fromComp(), gave shading only half as deep in a proof build (inferred: found in a proof build, not said or shown). In the example the layer is a shape layer (shown). Scene around the styles (inferred, not run): build the page as a solid with a Gradient Ramp from about #E8EFF2 at the left edge to about #EFFAFB at the right. Make every disc a white shape layer (Fill swatch white, no stroke, shown with the main disc selected; under a 100 % Normal Gradient Overlay the fill colour does not show) and give each the two styles. For each disc: layer.duplicate(), moveAfter the disc, set parent to the disc, remove the copy's layer styles, then "ADBE Fill" black, "CC Radial Fast Blur" (Amount about 95, Center placed on the side of the disc away from where the shadow should fall: up and to the right of the disc for a shadow down and to the left; a centre close to or inside the disc fans the shadow wide, as here, where it wraps more than half way round the disc), "ADBE Gaussian Blur 2" (about 25); none of these values is shown for this scene, they are the next tip's. Then set the shadow layer's opacity so that the page just outside the disc's lower-left edge reads 55 to 65 levels below the clean page (about a quarter black) and check the reach against the layout figures. Put an adjustment layer with a small Gaussian Blur above the back discs and their shadows and below the main disc's shadow; raise it until the back discs' edges are about two and a half times as wide as the main disc's. Check a render by sampling: just outside the main disc at 200° about 175, at 30° the clean page about 243. Proof build of the rescoped recipe (inferred: found in a proof build, built without the video and accepted on review; none of these values is said or shown for this scene). Values that reached the look in a 1920 x 1080 comp: on every shadow copy CC Radial Fast Blur Amount 95 to 97 with its Center about 2 disc radii from the disc's centre on the side away from the shadow (3 radii for the lower-right disc), then Gaussian Blur about 25 with Repeat Edge Pixels on, and the shadow layer's opacity 16 to 27 % (main 27, top 24, lower right 24, lower left 18, left 16); Gaussian Blur about 11 on the softening adjustment layer; Gradient Ramp in place of Gradient Overlay on every disc, run along 40° across each disc's own diameter. Amount is steep, not proportional: at 50 to 80 there is almost no streak, and from 93 to 97 to 99 the distance at which the shadow is at half strength goes from about 100 to 190 to past 300 px; 98 roughly doubles the length that 95 gives, and moving the Center farther away lengthens it too, so set the length with both and check it against the layout figures. A radial-blur shadow is a cone whose two sides are straight lines touching the disc; after the Gaussian Blur they can still show as a faint band edge (8 to 12 levels on the main disc's upper side in the proof build), while the tutorial's shadow has no hard outer edge anywhere (the page above the main shadow darkens smoothly, a level or two per 10 px, with no step); the build was accepted with it, but a wider Gaussian Blur or a second, softer copy is worth a try if the edge shows (untried). The cone also always darkens the edge well past 90° either side of its direction, so a shadow cannot stop sharply on the disc's edge: on the lower-right disc the reference fades over 280° to 320° rather than stopping, and the build reached it with the shadow aimed at 230° and the Center 3 radii out (11 levels at 320° against the reference's 5 or 6). The per-disc shadow figures in the layout are read on the finished picture, where shadows overlap, so they cannot all be met by tuning each shadow on its own. The disc's own shadow is what can be read where no other lies: the main disc's edge all round and its whole upper-left side (100° to 160°) out to where it fades; the top disc's edge and the first half radius to its left; the lower-right disc's edge from 240° to 330°. Elsewhere the main disc's shadow is part of the reading: it covers the whole left and lower-left back discs (their far sides read about 220 and 205 to 218 against a face of about 235), so those two discs' own shadows are lighter than the layout figures (the lower-left disc's own edge is nearer 45 to 50 than 65), and the left disc's one-radius figure lies on the main shadow's long axis. Set the main disc's shadow first, add the others, and judge the overlaps by the totals. Face colour to aim for at the lower-left edge: the measured #ECF2F3, not the #F1F5F7 stop; the picture's light end stops short of the stop (layout), and a ramp starting at #F1F5F7 came out 3 to 5 levels too light there in the proof build, which also left the rim only 2 to 4 levels above the face instead of 9 to 15. With Gradient Ramp standing in, start it at about #ECF2F3 and end it at #DAE1E7 (inferred from the measurement, not run). Back-disc softness: the back discs' edges are two to three times as wide as the main disc's (step 6); Blur 11 gave 3 to 4 times in the proof build, on the soft side, so somewhat less than 11 should be closer (untried).
unknowns: the settings of the shadow layers in this scene (effects, blur centres, opacity, blend mode: the layers are never opened; only their place under each disc, their parent and their effects switch are shown); which effects the other disc layers carry (they show an effects switch that the main disc lacks, and their layer styles are never twirled open, so that they hold the same two styles is read from the picture only); what is on the two adjustment layers (the lower one softens the back discs, amount not shown; the top one's effects are not shown and leave no visible grain or vignette); how the page gradient is made (the page layer has an effects switch, never opened); which named back layer is which disc, and the order of the four back discs among themselves (they do not overlap one another in the result); final resting positions of the five front discs (only seen moving in at the comp's first frame); the gradient angle reason (40° shown, not explained); the main disc's look with no styles (never shown)

## Stacked white discs that grow out of the centre with long soft shadows
id: 08-raised-white-shapes-with-long-shadows
revision: 3aa9fdaf
job: fill-the-backdrop; support: add-depth, reveal-headline
status: unproven
variant of: 11-white-on-light-finish
differs: the same finish as the parent (Gradient Overlay, Normal, Linear, 40 degrees, Align with Layer; Bevel and Emboss Size 5, angle 120, altitude 30, highlight and shadow both white in Screen at 100 %; a black, blurred copy under each white shape as its shadow, on a pale cyan left-to-right page), applied to a different scene and in motion. Scene: about eight concentric discs grow from nothing out of the centre, one pair (styled top, shadow copy below) after another, staggered in time, instead of the parent's still stack; each shadow copy is its own layer and grows with its disc. Shadow: here its settings are shown (CC Radial Fast Blur Amount 95, centre about 2.3 disc radii out to the left, Gaussian Blur 72.6, opacity about 21 %); the parent's video never opens its shadow layers, and its figures (Gaussian about 25, opacity 16 to 27 %, centre about 2 radii out) come from another recipe and its proof build. The shadows fall to the right of each disc and pile up so the right third of the frame goes grey, where the parent's fall left and down. Gradient stops: #F1F6F8 to #D7E0E4 here, #F1F5F7 to #DAE1E7 in the parent.
what it does for a beat: A title or opener background that makes a near-white frame look premium and tactile: white discs swell out from the centre one after another, each one raised off the one below with a pale rim and a long, soft shadow to one side. Reach for it when a clean white brand look needs depth and slow motion behind type.
what it looks like: A pale cool-white frame filled with concentric white discs, about eight, the smallest in the middle; on the right half each inner disc reads a little lighter than the one beneath, while on the left all faces are nearly the same white. Every disc has a thin bright rim and casts a soft grey shadow that streaks off its right-hand edge onto the disc below, so the right half of the picture reads darker than the left. In the finished example a black hand-lettered title sits over the centre (that title is a ready-made graphic, not part of the technique).
ingredients:
- Shape layer with an Ellipse — built-in; ellipse tool (shown : Ellipse 1 inside Shape Layer 1, ellipse tool active)
- Layer Styles > Gradient Overlay — built-in; right-click layer > Layer Styles > Gradient Overlay (said; context menu shown)
- Layer Styles > Bevel and Emboss — built-in; same menu (said; shown area)
- CC Radial Fast Blur — stock (ships with After Effects); found by typing its name into the Effects & Presets search box (search shown, effect shown applied)
- Gaussian Blur — built-in (said; shown)
- A solid background layer — built-in (shown, named generically here as "the background")

steps:
1. Work in a 1920 x 1080 comp at 23.976 fps, about 10 s long, over a pale cool-white background solid. (comp rate shown; 1920 x 1080 inferred from the default position 960,540 shown and the radial blur centre values; length inferred from the timeline ruler, shown)
   - Background: a horizontal ramp from about RGB 233,239,242 at the left to 240,251,252 at the right (measured). The solid carries an effect the video never opens (fx switch shown); a left-to-right gradient ramp such as Gradient Ramp or 4-Color Gradient gives this (inferred).
2. Draw a circle with the ellipse tool, centred in the comp. (said: "create any shape"; shown)
   - Position 960,540, Anchor Point 0,0 (inferred: the on-screen reader logged these values near, and the circle sits centred in the frame there)
   - Size: at 100 % scale its diameter is about 0.84 of the comp height (about 900 px). (measured on, : 384 of 834 viewer pixels wide at 97.9 %)
   - Fill white, no stroke (shown : toolbar Fill swatch white, Stroke swatch crossed out)
3. Animate Scale from 0 % at 0 s up past full frame, so the disc grows from a point until it covers the whole picture. (said; shown: Scale 0.0,0.0 % with a keyframe at 0 s)
   - Second keyframe: ends at about 5.0 s in the final layout (shown : keyframes at 0 s and about 5 s); it was first set near 3 s and dragged later (shown).
   - End value: not shown. The disc reads 97.9 % at 1:20 (1.83 s) with the end key at 5 s (shown), which with linear interpolation means about 265–270 %; 191.5 % at 2:23 with the key at about 4.1 s (shown) gives the same figure. So the end scale is about 265 %, a diameter about 2.2 times the frame height, past the frame corners. (inferred)
   - Interpolation: linear keyframe icons; the two readings above are consistent with a constant rate. (inferred)
4. Duplicate the shape layer. Call the upper copy "top" and the lower one "bottom". Both keep the same scale keyframes. (said "duplicate"; names shown; Ctrl+D shortcut inferred)
5. On top: Layer Styles > Gradient Overlay. (said; shown)
   - Colors > Edit Gradient: stop at 0 % #F1F6F8 (a very light grey-blue) (said as "very light grayish blue"; shown); stop at 100 % #D7E0E4 (a slightly darker blue-grey) (said; shown)
   - Angle: 40° (said "adjust the angle, not necessary"; value shown, tried 22° first)
   - Blend Mode Normal, Opacity 100 %, Gradient Smoothness 100 %, Style Linear, Reverse Off, Align with Layer On, Scale 100 %, Offset 0,0 (shown; left at defaults)
6. On top: Layer Styles > Bevel and Emboss, then turn both its light and its dark side white. (said; shown)
   - Style Inner Bevel, Technique Smooth, Depth 100 %, Direction Up, Size 5.0, Soften 0.0 (shown)
   - Use Global Light Off, Angle 120°, Altitude 30° (shown)
   - Highlight Mode Screen, Highlight Color white, Highlight Opacity 100 % (said "both opacities to 100 %"; shown)
   - Shadow Mode Screen (said), Shadow Color white (said), Shadow Opacity 100 % (said; shown)
   - Result: a thin bright rim all round the disc, no dark bevel edge. (inferred from the settings; visible on the result)
7. Hide top (eye off) while working on bottom. (not said; shown)
8. Make bottom black: with bottom selected, click the toolbar Fill swatch and set #000000. (said "make it black"; Shape Fill Color dialog at 000000 with bottom selected, shown)
9. On bottom: Effect > CC Radial Fast Blur. (said; shown)
   - Amount: 95.0 (said "like 95"; shown; it opened at 87 before being set)
   - Center: -13.6,569.2, entered as given in the layer's own unscaled space: about 974 units left of and 29 below the disc centre (default 960,540). It scales with the layer, so it sits near the comp's left edge only at about 98 % scale (inferred) and moves further left as the disc grows; the black disc streaks out to the right. (said: move the point to make a long drop shadow; shown, passed 17.8,569.2 on the way)
   - Zoom: Standard (shown)
10. On bottom: add Gaussian Blur after the radial blur and raise it. (said; shown)
    - Blurriness: 43.3 first (shown), then 72.6 (shown). Use 72.6.
    - Blur Dimensions Horizontal and Vertical; Repeat Edge Pixels on (shown)
11. Lower bottom's Opacity until the shadow sits softly on the background. (said; shown, : 21 %; the value was dragged through 46 % and the timeline also read 16 % and 20 % on the way)
    - Opacity: about 20 % (shown; final value between 20 and 21 %)
12. Turn top back on. Order: top directly above bottom. (top eye on shown, order shown)
13. Select the pair (top and bottom), duplicate it, and stack each new pair above the previous one. Repeat until there are eight pairs. (said "duplicate this circle a lot of times"; shown, : eight pairs, highest number on top)
14. Offset each new pair later in time than the one below it, like a staircase, so the newest (top) disc starts last and so is the smallest. (said; shown)
    - Offset: about 0.6 to 0.8 s per pair, dragged by hand and uneven; the eighth pair starts at about 4.8 s. Measured starts: about 0, 0.66, 1.37, 2.12–2.16, 2.86–2.93, 3.45–3.54, 4.04–4.15, 4.67–4.79 s (two readings of the same timeline; the last pair starts nearer 4.7 s). (shown / measured timeline)
15. (Finished example only) Turn on the title layer and move it to the top of the stack. (not said; shown : title layer 1, eye on; it sat hidden at the bottom during the build)

layout: Measured on the frame without the title (comp time 3:15, picture crop 661,243,1296,729) and on the result frame (comp time 4:07). Discs are concentric on the frame centre. At 3:15 the visible disc radii are about 0.04, 0.17, 0.34, 0.51, 0.67 and 0.82 of the picture height (measured), and the outer discs run past the frame; at 4:07 they are about 0.19, 0.32, 0.49, 0.66 and 0.82 H (measured). Neighbouring edges are about 0.15 to 0.17 H apart (measured), slightly closer towards the outside. Each newer disc lies on top of the older, larger one. The light: each disc has a thin bright white rim (the white bevel, step 6) and a face that is very slightly darker toward the upper right and lightest toward the lower left, about 229–231 grey at the top against 238–240 at the bottom-left away from shadows (measured; the 40° gradient overlay, step 5). Each upper disc's top and bottom edges also carry a short shadow, about 204–214 just outside against 229–238, fading within about 0.04 H (measured); it comes from the same radial-blurred black copy and needs no extra step. The shadows: each disc's own black, radial-blurred copy streaks outward to the right from the disc's right edge onto the disc below. On the horizontal centre line the surface just past a disc's right edge reads about 168–189 (0–255 grey), against 205–235 on the lit faces and about 238 on the open background (measured). So a shadow darkens what it falls on by roughly 20–28 % at its darkest, and it fades out over about one ring spacing (about 0.15 H) (measured). The left edges show no shadow. Because the shadows pile up, the right third of the frame is visibly greyer (about 190–215) than the left third (about 235–240) (measured). The background is not flat: it runs left to right from about RGB 233,239,242 to about 240,251,252, lighter and slightly more cyan on the right (measured), most likely a gradient effect on the solid (inferred; the effect is never opened). In the result it is almost all covered by discs, so it shows mainly in the first second. Motion: every disc grows from the centre at a constant rate, its radius increasing by about 0.22–0.23 H per second (0.42 H at 100 % times 265 % over 5 s gives 0.22; measured 0.23 H/s on one disc between), and a new one appears every 0.6–0.8 s; nothing else moves. The black hand-lettered title (about 0.27 H tall caps, centred) with a small grey subline and a row of badges is a ready-made graphic from the finished example, not made by any step here; in a later shot it carries an Invert and a soft Drop Shadow (see 09).
timing and easing: Scale 0 % at 0 s to about 265 % at about 5.0 s, linear (inferred from two readings). Pairs staggered about 0.6–0.8 s apart (measured). Comp at 23.976 fps. No eases shown.
variations: Any shape and any animation can be used (said). The gradient angle is optional (said).
pitfalls: none given
build notes: Layer styles cannot be added through scripting properties directly; apply them by menu command (Layer > Layer Styles > Gradient Overlay / Bevel and Emboss) through app.executeCommand on the selected layer, then set the values under the layer's "Layer Styles" group. The effect match names "CC Radial Fast Blur" and "ADBE Gaussian Blur 2" are the usual ones. CC Radial Fast Blur's Center: enter the value as given, -13.6,569.2. It is in the layer's own unscaled space (its default 960,540 is the disc centre), i.e. about 974 units left of and 29 below the disc centre, and it scales with the layer; it lands on comp x ≈ 17.8 only at about 98 % scale (shown). Do not solve for a layer value that hits a fixed comp point at another scale: that puts the centre too near the disc and shortens the streaks. An earlier rebuild of a similar look in this library found Amount steep: about 95 to 97 gives a long streak, 80 gives almost none. Duplicate the top/bottom pair with layer.duplicate() and offset startTime (or the keyframes) by about 16 frames per pair.
unknowns: The end value of the scale keyframe (about 265 % is inferred, not shown); whether either scale keyframe is eased; the background solid's effect and exact colour; the ellipse's exact pixel size (measured only); the final opacity of the bottom copies, between 20 and 21 %; whether every bottom copy carries Blurriness 72.6 (the original and the second copy do). The result window is only a moment long because the recording pans before; (crop 661,243,1296,729) shows the same discs without the title, but it is a passing zoom too.

## Long soft shadow from a radially blurred black copy
id: 12-long-soft-shadow
revision: 5b8fb6a4
job: add-depth; support: finish-the-look
status: proven (accepted 2026-11-14)
what it does for a beat: Gives flat shapes or letters a long, fading directional shadow, as if lit by a low sun, which reads especially well on bright, pale backgrounds.
what it looks like: Pale grey-blue bars and blocks around a large two-word title on a near-white dotted background each cast a long soft grey shadow streaking diagonally down and to the right, dense at the object and fading out; the title's letters lie flat and throw no shadow.
ingredients:
- Duplicate of the layer — built-in; duplicating is said, the menu path (Edit > Duplicate) is inferred
- Fill — stock; Effect > Generate > Fill (shown; menu path inferred)
- CC Radial Fast Blur — stock (Cycore); found by typing "cc ra" in Effects & Presets (shown)
- Gaussian Blur — stock (shown)
steps:
1. Duplicate the layer; the copy that sits underneath becomes the shadow (said). In the finished example each existing shadow layer sits below its object and is parented to it (shown, Parent column); the copy the author makes on screen keeps the original's parent, a null that drives the scene (shown), so parenting the shadow to its object is a reading of the finished example, not a step shown
2. Make sure the shadow copy has no layer styles (said)
3. Turn the copy solid black, either by colouring the layer black or with the Fill effect (said; Fill applied, shown)
   - Fill > Color: black (shown; "black" said)
   - Fill > Opacity: 100.0 %; Fill Mask: None; Invert: off; feathers 0.0 (shown)
4. Apply CC Radial Fast Blur to the copy (said; screen confirms the name, shown)
   - Amount: 95.0 (said "nearly 100"; shown)
   - Zoom: Standard (shown)
5. Move the blur's centre point to aim the shadow: the streak runs away from the centre, so a centre placed up and to the left throws the shadow down and to the right (narrator calls it the anchor point; the screen shows the effect's Center being dragged in the viewer — the screen wins; direction reading inferred)
   - Center: 224.7, 366.6 then 137.7, 375.0 (shown)
6. For extra blending, add Gaussian Blur to the copy (said "gauge and blur" — speech recognition; screen shows Gaussian Blur)
   - Blurriness: 25.6 (shown, cropped)
   - Blur Dimensions: Horizontal and Vertical (shown, label truncated)
   - Repeat Edge Pixels: on (shown)
layout: shadow direction differs from object to object, because each shadow comes from its own radial blur and points away from that object's blur centre: top-left block (about 12–17% across, 10–21% down) nearly level, about 7–12° below horizontal, reaching about 28% across at about 16–17% down; tall right bar (87–91% across, 21–42% down) about 36–40°, running off the right edge; small lower block (about 32–35% across, 78–83% down) about 40°; the title's letters throw no shadow (the page under the lower word's middle letters is not darkened; the streaks at about 55–65° under its first and last letters and beside it start at the pale bars standing at the word's two ends and at a third pale bar inside the word); left bar (4–18% across, 60–66% down) almost straight down, about 71°, fading out at about 88–92% down (measured, shares of the whole comp: viewer at 43.5%, picture edges inside the viewer and matching the crop; angles in picture pixels, from the centre line of each shadow's darkening); shadow length from the object's edge: down to half strength at about 6 to 9% of the width, about a tenth left at 17 to 20% (measured, shares of the whole comp: viewer at 43.5%, picture edges inside the viewer and matching the crop; angles in picture pixels, from the centre line of each shadow's darkening); shadow width: about the object's own width at the object, densest there (measured, shares of the whole comp: viewer at 43.5%, picture edges inside the viewer and matching the crop; angles in picture pixels, from the centre line of each shadow's darkening); title: lower word about 27–72% across, 37–66% down; upper word about 40–62% across, 20–40% down (measured, shares of the whole comp: viewer at 43.5%, picture edges inside the viewer and matching the crop; angles in picture pixels, from the centre line of each shadow's darkening)
timing and easing: none given (static shadow; because the shadow is parented to its object it follows it, inferred)
variations: colour the copy black either by the layer's own colour or by the Fill effect (said)
pitfalls: the shadow copy must not keep the original's layer styles (said)
build notes: Result window: the comp plays its build-on with a slow camera drift, and every object has its finished shadow from about 228.0; the author stops and solos one bar (shown, source cuts). Later frames such as show one bar mid-rebuild without a finished shadow, plus selection handles and the camera label. The cursor sits over the word; mask it when comparing. The author also solos the bar and deletes its old shadow before duplicating (shown, around), and switches the original off after duplicating (still on, off); that is housekeeping, not part of the technique. layer.duplicate(), then move the copy below the original (moveAfter). Leaving it with the original's parent (as on screen) or parenting it to the original (as in the finished example) both keep it in step (inferred). Remove layer styles from the copy (Layer > Layer Styles > Remove All, via app.executeCommand(app.findMenuCommandId("Remove All")) with the copy selected). Effects: "ADBE Fill" ("Color" black, "Opacity" 100 %), "CC Radial Fast Blur" ("Center" point, "Amount" 95, "Zoom" Standard), "ADBE Gaussian Blur 2" ("Blurriness" 25.6, "Repeat Edge Pixels" on). Center is in layer space, so pick it relative to the shape (on comp-sized, unscaled shape and text layers a proof build found Center read as comp pixels, and a fromComp() conversion put every centre near the comp's top-left corner; a centre several object-widths away kept each shadow a near-parallel band where a close one fanned it out; shadow layer opacity of about 70 % matched the tutorial's darkness at the object: inferred: found in a proof build, not said or shown); the shadow may run past the layer's edge — the copy in the example is a shape layer, which is not clipped, but other layer types may need room (inferred).
unknowns: the shadow layer's opacity or blend mode (not shown; shadows read as mid grey, so it may be lowered); the order of the layers when the original is switched off during editing (the original is hidden); exact Center values for the other objects in the scene; the background and object colours

## Fine dot-grid background from a ball-grid effect
id: 13-dot-grid-texture
revision: 4222655e
job: fill-the-backdrop; support: finish-the-look
status: proven (accepted 2026-11-14)
what it does for a beat: A quick, quiet design texture for a plain or pale background, so an empty backdrop reads as designed rather than blank without pulling focus from the type or graphics in front.
what it looks like: A pale grey-blue background covered by an even grid of tiny grey dots, sitting behind 3D-looking letters and simple outline shapes; the dots are only noticeable when you look closely.
ingredients:
- CC Ball Action — stock (Cycore effects that ship with After Effects); effect name shown in the Effect Controls
- Solid layer, black — built-in (said "black solid layer"); menu path not said or shown, Layer > New > Solid (inferred); Solid Settings dialog shown
- Effect found by typing "CC" in the Effects & Presets search (shown)
steps:
1. Create a black solid (said) the size of the composition (shown) and place it directly above the background layer, below all the graphics (shown : solid is layer 30, background layer 31)
   - Width x Height: 1920 x 1080 px, 100.0 % of comp, so the comp is 1920 x 1080 (shown)
   - Color: black, R0 G0 B0 (shown)
2. Apply CC Ball Action to the black solid (said; shown)
   - Defaults seen before changing: Grid Spacing 5, Ball Size 100.0, Coloring Medium, Shading -75.0, Scatter 0.0, Displace 0.0, Twist Angle 0x+0.0°, Rotation 0x+0.0° (shown)
3. Set the grid spacing and ball size small (said)
   - Grid Spacing: 3 (said "three"; shown, cropped full-size frame read by eye)
   - Ball Size: 7.0 (said "seven"; shown typed, settled 7.0)
   - Coloring: Medium, Shading: -75.0 left at default (shown)
4. Leave the rest at default; the black areas between balls become empty, so only the dots sit over the pale background (inferred from viewer : the solid no longer hides the background)
layout: crop is a zoomed-in part of the comp: the viewer reads 180.2 % and no comp edge is inside it; scaled from a 1920-wide comp measuring 1506 px at 43.5 % and corrected for this frame's recording scale (menu bar Edit to Window 887 px here against 842 px, factor 1.053), the crop shows about 24 % of the comp's width and 25 % of its height (measured); dot grid: square, pitch 27.5 crop px across and down, about 58 columns by 33 rows across the crop, so 1.7 % of the crop's width, which is about 0.42 % of the comp's width or roughly 8 comp px (measured); dot core: about 4 crop px, 0.25 % of the crop's width, roughly 1 comp px across (measured); dots cover the whole picture evenly, behind the shapes as well as in the open areas (measured, shares of the result crop, which shows about 24 % of the comp's width)
timing and easing: none given (static texture)
variations: the author says "somewhere around those values" — spacing near 3 and ball size near 7 are a starting point, not exact (said)
pitfalls: none given
build notes: Script: comp.layers.addSolid([0,0,0], "dots", comp.width, comp.height, 1); layer.property("ADBE Effect Parade").addProperty("CC Ball Action"); set effect("CC Ball Action")("Grid Spacing")=3 and ("Ball Size")=7; move the layer to just above the background. Check the dots' tone against the background after a render; the tutorial's dots render mid grey, not black, on a pale background; a proof build got the same mid grey from the effect's own default shading (Coloring Medium, Shading -75) with the layer at 100 % opacity and Normal mode, so nothing else is needed (inferred: found in a proof build, not said or shown). The author zooms the viewer to 180.2 % (magnification menu, value) to show the dots; at 100 % they are barely visible, so compare a build at similar zoom or on a crop (inferred). Nothing here needs the interface.
unknowns: Why the dots read mid grey rather than black (layer opacity and blend mode are not shown; no Opacity or mode change is seen); whether the solid is 3D (no 3D switch is visible on it).

## Real cast shadows on an invisible 3D floor
id: 14-3d-floor-shadows
revision: b210d945
job: add-depth; support: light-the-hero
status: proven (accepted 2026-11-14)
what it does for a beat: Grounds flat 3D layers in a scene by giving them soft, believable shadows on the ground, without letting the light change the colour of the graphics themselves.
what it looks like: A pale UI-style scene (a rounded panel of icon buttons, a weather card, small stock tickers, a big bold title) gains a soft grey shadow that spreads across the floor beneath the objects, darkest just under them (about 78 to 88 % down) and lightening toward the bottom edge; the graphics keep their original flat colours.
ingredients:
- Solid layer as the floor — built-in (said "create a solid layer"); menu path Layer > New > Solid (inferred, not shown)
- 3D layer switch — built-in (said)
- Point Light — built-in (said "create a point light"); menu path Layer > New > Light (inferred, not shown); Light Options type "Point" shown
- Material Options (Casts Shadows, Accepts Shadows, Accepts Lights) — built-in (said; shown)
steps:
1. Make a solid layer, turn on its 3D switch (said)
   - Width x Height: 1920 x 1080 px, 100.0 % of comp (shown)
   - Color: white, FFFFFF (shown)
2. Lay the solid flat as a floor (said)
   - X Rotation: 0x+90.0° (said "90 degrees"; shown)
3. Move the floor under the 3D graphics and scale it up a lot (said)
   - Position: 960.0,840.0,0.0 (shown; earlier step value 960.0,968.0,0.0 seen at 4:36)
   - Scale: 233.0,233.0,233.0% (shown)
   - Anchor Point: 960.0,540.0,0.0 left at default (shown)
4. Move the floor down the layer stack so it sits directly below the 3D graphic layers (shown: layer 1, layer 14 just under the 3D precomps 10-13). In this comp only those layers and the floor have the 3D switch on; the title, noise and other layers above are 2D (shown). With the Classic 3D renderer a 2D layer between 3D layers splits them into separate groups that cannot shadow each other, so the floor must sit next to the 3D graphics in the stack (inferred; not said)
5. Add a point light and place it so shadows fall where wanted; here it sits up, to the left and behind the graphics: positive Z points away from the default camera, so Z 2483.3 puts it behind them, and the shadows fall forward and down toward the camera (said "anywhere ... like behind your graphics"; position shown; shadow direction shown)
   - Position: -440.0,460.0,2483.3 (shown crop; the on-screen reader dropped the minus once)
6. Set the floor's Material Options so it shows only the shadows falling on it (said)
   - Accepts Shadows: Only (said; shown)
   - Casts Shadows: Off (shown)
7. In the light's options, soften and lighten the shadow and use a smooth falloff (said)
   - Casts Shadows: On (shown)
   - Shadow Darkness: 45% (said "decrease"; shown)
   - Proof-build note: on a white floor that takes only shadows, 45% gave a shadow core at 0.55 of the open-floor level, where the tutorial's picture shows about 0.22 (47 against 215, see layout); about 78% matched it. Something not on screen adds to the darkness in the example (inferred: found in a proof build, not said or shown; 45% stays the value on screen)
   - Shadow Diffusion: 205.0 pixels (said "decrease ... diffusion"; shown — the screen shows it scrubbed up from about 100 to 205, so the narrator's word "decrease" fits darkness, not diffusion)
   - Falloff: Smooth (said; shown)
   - Radius: 3530.0 (said "mess with the falloff settings"; shown)
   - Falloff Distance: 500.0 left at default (shown)
   - Intensity: 100%, Color: white (shown)
8. Set each 3D graphic layer to ignore the light so its colours stay as designed, while still casting shadows (said)
   - Accepts Lights: Off (said; shown)
   - Casts Shadows: On, Accepts Shadows: On (shown); shown switched on two of the 3D precomps
layout: crop is the whole comp at 43.5 % (a 1920-wide comp at 43.5 % measures 1506 px; corrected for this frame's recording scale, menu bar Edit to Window 795 px here against 842 px there, it is about 1422 px, and the crop is 1420 x 796; measured); button panel: 17-51 % across, 12-78 % down; weather card: 53-85 % across, 51-76 % down; bold title word: 54-86 % across, 24-45 % down, with the script word above it reaching about 11 % down and 57-90 % across (measured); shadow on the floor: starts at the objects' bottom edge at about 78 % down, darkest from 78 % to about 88 % down (grey level about 47 against about 215 for open floor), lightening to about 180-190 at the bottom edge, and spans from about 20 % across to the right edge, with nothing at the far left (measured, compared where the same area is an even pale grey) (all shares of the whole comp)
timing and easing: none given (static set-up; the graphics have their own animations)
variations: the light can be placed anywhere; behind the graphics is suggested (said). Shadow and falloff values are to taste ("you might want", "mess with") (said).
pitfalls: Without turning off Accepts Lights on the graphics, the point light will shade and tint them (said, as the reason for the last step).
build notes: Script: floor = comp.layers.addSolid([1,1,1],"floor",1920,1080,1); floor.threeDLayer=true; transform X Rotation 90, Position [960,840,0], Scale [233,233,233]; floor.moveAfter(<lowest 3D graphic layer>) so no 2D layer sits between it and the 3D graphics; floor.property("ADBE Material Options Group")("ADBE Accepts Shadows").setValue(2) (2 = Only), ("ADBE Casts Shadows").setValue(0). light = comp.layers.addLight("Point Light 1",[960,540]); light.lightType=LightType.POINT; Position [-440,460,2483.3]; Light Options: "Casts Shadows" 1, "Shadow Darkness" 45, "Shadow Diffusion" 205, "Falloff" 2 (Smooth), "Radius" 3530, "Falloff Distance" 500. For each 3D graphic: Material Options "Accepts Lights" 0, "Casts Shadows" 1. The scene uses the Classic 3D renderer (Geometry Options greyed, "Change Renderer..." shown); shadows need the graphics to be 3D layers or collapsed 3D precomps. Dropdown index values should be checked in the target After Effects version.
unknowns: The comp's camera (default active camera shown, no custom camera given); how the graphics were made 3D (they are already 3D before the tip); the exact Classic 3D grouping reason for the stack move is not said.

## Tie a 3D scene together with depth fog over the precomp
id: 17-depth-fog
revision: 443696ce
job: add-depth; support: finish-the-look
status: proven (accepted 2026-11-14)
what it does for a beat: Use when separately made 3D layers look pasted together; a coloured depth fog over the finished scene lifts the darks and sinks the distance into one atmosphere.
what it looks like: A dark blue-teal night forest with tree trunks receding behind a small character in an orange cloak holding a flame; with the fog on, the background trunks and blacks lift into a soft teal haze and the scene reads as one space (compare off on).
ingredients:
- Fog 3D — stock (3D Channel category); Effects & Presets search "Fog", listed under 3D Channel (shown)
- precomp of the 3D scene — built-in; Layer > Pre-compose (said)
steps:
1. Precompose the 3D scene so it becomes one layer in an outer comp (said; shown, the scene is one precomp layer)
2. Apply Fog 3D to that precomp layer (to show the defaults the author deletes it and applies it fresh,: has no effect on the layer, shows the defaults), found by typing "Fog" in Effects & Presets (said; shown; the narrator's "on top of the composition" is shown as the effect sitting on the precomp layer itself)
3. Set the fog colour to a dark blue-teal matched to the scene (shown; value inferred from the swatch, sampled between about RGB 9,37,55 and 15,39,55 in different frames, so treat it as approximate)
4. Adjust the depth range and density by eye until it looks right (said: "mess with the settings"); the values used:
   - Fog Start Depth: 51.00 (shown; default 0.00 shown)
   - Fog End Depth: -23.00 (shown; default 0.00 shown)
   - Fog Opacity: 100.00 (shown)
   - Scattering Density: 24.00 (shown; default 50.00 shown)
   - Foggy Background: on (shown)
   - Gradient Layer: None, Source (inferred from truncated menu text "N..." and "So...")
   - Layer Contribution: 100.00 (shown; default 0.00 shown)
   - Proof-build note: the two depth values do not carry to another scene. There Fog 3D read depth as the distance from the precomp's camera in that scene's own units (pixels), and with 51 and -23 none of the 3D layers was fogged; a start just behind the hero (2700 with the figure 2667 from the camera) and an end far enough back that the last trunks are still only veiled is what the tutorial's picture asks for. Read your own scene's distances and tune from them (inferred: found in a proof build, not said or shown; 51.00 and -23.00 stay the values on screen)
5. Toggle the effect off and on to judge it (shown off, on; the author flicks the fx switch repeatedly from about 353)
layout: crop is the whole comp at 43.5 % (the selected precomp's corner and edge handles sit on the crop edges, measured on a still of the result); character: 39-57 % across, 34-83 % down, centred near 49 % across; tree trunks fill the upper 60 % of the picture, foliage the bottom 40 %; fog effect: the upper 60 % gets about a tenth brighter (mean level about 24 to 26.5 on 0-255); across a row at 15 % down the darkest trunks lift and the lightest gaps dim (5th to 95th percentile 5-41 becomes 13-35), and every trunk, near or far, keeps about 0.42 to 0.56 of its depth below the gap beside it, so none disappears; the bottom 20 % changes little (measured on a still of the result against fog off, and trunk by trunk on the aligned pair, shares of the whole comp)
timing and easing: none given (static settings)
variations: none given beyond tuning the settings to taste (said)
pitfalls: none given
build notes: Effect display name "Fog 3D" (match name ADBE FOG_3D, properties ADBE FOG_3D-0001 to -0008; the earlier guess ADBE FOG3D does not exist: inferred: found in a proof build, not said or shown), properties "Fog Color", "Fog Start Depth", "Fog End Depth", "Fog Opacity", "Scattering Density", "Foggy Background", "Gradient Layer", "Layer Contribution". Apply to the precomp layer (layer.property("ADBE Effect Parade").addProperty("ADBE FOG_3D")). The comp in the example runs at 23.976 fps with Quarter resolution in the viewer. Fog 3D is a 3D Channel effect that reads depth from the layer; whether it gets real depth from a precomp of After Effects 3D layers depends on the version and renderer, so check that the fog actually varies with depth before relying on it (inferred, not covered by the video). In a proof build with a precomp of 3D layers and its own camera it did read real depth, and 2D layers inside the precomp read as depth 0 (inferred: found in a proof build, not said or shown).
unknowns: exact Fog Color value (only sampled from the video); how the precomp's depth reaches the effect; the units of Start/End depth relative to the scene; the effects on a separate adjustment-style layer above the scene are not part of this tip.

## Two stacked glows for a soft cinematic bloom
id: 20-two-pass-glow
revision: 295cc9bc
job: finish-the-look; support: light-the-hero
status: proven (accepted 2026-11-14)
what it does for a beat: A finishing pass on bright line art or type on a dark ground: one tight glow for a halo near the edges plus one very wide glow for a faint bloom, without looking blown out.
what it looks like: Thin white circle arcs with dot ends and a light word in the centre, on near-black; the white parts carry a close soft halo and a wide, faint haze around the whole graphic.
ingredients:
- Adjustment layer above the graphic — built-in; Layer > New > Adjustment Layer (inferred menu path; adjustment switch on the top layer shown)
- Glow — stock; Effect > Stylize > Glow (shown, Effects & Presets search "Glow" under Stylize)
steps:
1. Put an adjustment layer at the top of the comp over the graphic (said; shown)
2. Apply Glow to the adjustment layer (said; shown)
3. Raise Glow Radius slightly from its default (said; shown)
   - Glow Radius: 39.0 (shown)
   - Glow Threshold: 60.0% (shown; default)
   - Glow Intensity: 1.0 (shown; default)
   - Glow Based On: Color Channels; Composite Original: Behind; Glow Operation: Add; Glow Colors: Original Colors (shown; all defaults)
4. Duplicate the Glow effect on the same layer (said). The duplicate itself never appears on screen: only one Glow, labelled "Glow", is ever visible, directly under Noise in an unscrolled Effect Controls panel (shown). A caption burned into the video states that the glow was duplicated (shown). The keyboard shortcut (Ctrl/Cmd+D) is neither said nor shown (inferred)
5. Raise one glow's radius to just above 200 (said "just above 200 or so")
   - Glow Radius: 242.0 on the visible effect labelled "Glow", scrubbed from 39.0 (shown) up to 282.0 (shown), back through 266.0 (shown) to 242.0 (shown)
   - The other glow is never shown; it presumably keeps radius 39 (inferred)
   - Other properties of the visible glow: unchanged (Threshold 60%, Intensity 1.0, Behind, Add; shown)
layout: arc ring: about 26% of the comp's width and 47% of its height across, centred at about 51% across, 50% down (measured, shares of the whole comp: the viewer is at 43.5% zoom and the result crop takes in the whole comp); three arcs of about 80 to 85 degrees each, centred about 120 degrees apart, with gaps of about 33 to 43 degrees between them (measured, same frame, angles read from the arc ends); dot ends about 1% of the comp's width across, line about 0.2% (measured, same frame, shares of the whole comp); centre word about 9% of the comp's width wide and 5% of its height tall (measured, same frame, shares of the whole comp)
timing and easing: none given (static finish).
variations: The second radius is "around" 200 (said); the first is only a slight increase (said).
pitfalls: none given.
build notes: Script: adj = comp.layers.addSolid([1,1,1], "Glow", w, h, 1); adj.adjustmentLayer = true; adj.moveToBeginning(). g1 = adj.property("ADBE Effect Parade").addProperty("ADBE Glo2"); g1.property("Glow Radius").setValue(39). g2 = g1.duplicate() (or add a second "ADBE Glo2"); g2.property("Glow Radius").setValue(242). Leave Threshold 60%, Intensity 1.0. Fully scriptable. The example adjustment layer also carries a Noise effect at 12% above the glow (shown); that is a separate finish, not part of this tip.
unknowns: the duplicate glow is never shown, so which glow carries 39 and which 242, and their order in the stack, are not given (for a build the order matters little: both use Add and the same threshold, inferred); the comp's colours beyond white on near-black; whether the noise effect matters to the look.

## Wide-lens camera inside the card ring
id: 11-wide-lens-camera-distortion
revision: 9d356f19
job: add-depth
status: unproven
what it does for a beat: A one-step finish for the ring of cards in 10-inner-ring-carousel: a short-focal-length camera stretches the perspective so the ring reads as a wide, immersive sweep rather than three flat cards. Use it whenever a 3D layout looks too flat under the default view.
what it looks like: The same turning ring now shows about seven cards across the frame: the middle card is small and square-on, and the cards toward the left and right edges grow taller and lean inward, so the row bows like the inside of a drum around the viewer.
ingredients:
- The finished ring from 10-inner-ring-carousel — built-in layers (shown). On screen the camera goes into the pre-made 15-card file with its own photos, not into the 16-card build (shown timeline rows)
- Camera layer, Two-Node Camera — built-in (said "create another camera"; type shown); right-click in the timeline > New > Camera… (right-click menu with "New ›" shown; New submenu open with "Camera…" highlighted shown, crop)
steps:
1. Start from the ring of 3D cards on its spinning 3D null, seen through the default view (shown, viewer label reads the default active camera).
2. Add a new camera (said; right-click menu shown, New > Camera… highlighted shown, Camera Settings dialog shown).
   - Type: Two-Node Camera (shown, crop)
   - Preset: 24mm, picked from the preset list in place of the default 50mm (said "wide focal length preset"; list open, 24mm landed)
   - Focal Length: 24.00 mm; Zoom: 451.56 mm; Angle of View: 73.74°; Film Size: 36.00 mm, measured horizontally (shown)
   - Enable Depth of Field: off (shown)
   - Lock to Zoom: on (shown)
   - Create Camera From Current View: off (shown); turning it on would change where the camera is placed
3. Click OK (shown, OK pressed). No camera move is seen afterwards, so the camera is taken to stay where the dialog puts it (inferred; the camera is layer 5 with its row collapsed, so its keyframes cannot be seen).
4. Play: the null's expression keeps the ring turning, now seen through the wide lens (shown).
layout: Measured on the result crop (1502 x 840 px, the whole picture less a 2 px edge). Middle card: about 14% of the picture width and 31% of its height, centred (centre at about 52% across, 50% down) (measured). Next cards out: about 15% wide and 32% tall, centres at about 36% and 68% across (measured). Next: about 17–18% wide and 37–39% tall, centres at about 19% and 86% (measured). The cards cut off at the left and right edges are about 44–45% tall (measured). Gaps between cards about 1.5–2% of the width (measured). Seven cards are in view, against three under the default camera, where the middle card was about 27% wide and 59% tall (measured, technique 10).
timing and easing: none given for the camera (no keyframes). The ring's spin comes from technique 10 (`time*20` on the null's Y Rotation).
variations: none given (the narrator only says a wide preset; 24mm is the one picked on screen).
pitfalls: none given
build notes: By script: `comp.layers.addCamera("Camera", [comp.width/2, comp.height/2])` makes a two-node camera; set `cameraOption.zoom` to the 24mm value in pixels, which for a 36 mm film width is `comp.width * 24 / 36` = 1280 px in a 1920-wide comp (inferred from 451.56 mm zoom on a 677.33 mm comp width, both shown). The dialog route with the 24mm preset should place the camera at Z = −1280, inside a ring of radius about 1500 px; that is what makes the near cards swing in large at the edges (inferred). By script, `addCamera` likely places the camera using the comp's default zoom (Z about −2667 for a 1920-wide comp), and setting the zoom afterwards does not move it, so also set the camera's Position to [960, 540, −1280] (point of interest at the comp centre); otherwise the camera sits outside the ring and the picture will not match (not tested in After Effects; confirm in a build). Leave `cameraOption.depthOfField` off. Picking the preset from the dialog's Preset list is a by-hand step; by script set the zoom directly.
unknowns: The camera's position and point of interest after creation, and whether it is moved or keyed afterwards (not shown; the camera row is never opened; the default placement is assumed); whether any other camera setting was changed after OK; how the dressed-up version with title, logos and buttons (seen) was built; the 16th card overlapping one place, carried over from technique 10.

## Backlit environment light over a shadow-only floor
id: 02-backlit-environment-light-with-shadow-floor
revision: 57bcf211
job: add-depth; support: light-the-hero
status: unproven
what it does for a beat: The quick way to make a textured 3D title look photographed rather than flat: one environment light turned round behind the text so long soft shadows fall toward the viewer onto an invisible floor, with a slow light swing for movement.
what it looks like: The rusty pale-blue bevelled word stands on a seamless pale sky-blue background; dark, soft-edged shadows stretch from the base of each letter toward the camera, the front faces are a little darker (lit from behind) and the shadows drift slowly as the light turns.
ingredients:
- Environment light — built-in; new light layer, Light Type: Environment (shown). Menu path Layer > New > Light... is inferred.
- Solid layer, comp size, pale sky blue — built-in (shown). Menu path Layer > New > Solid... is inferred.
- Duplicate of that solid made 3D as a floor, with Material Options > Accepts Shadows: Only — built-in (shown)
- Builds on 01 (Advanced 3D renderer, extruded textured text). The word ends up at about 74% of the comp's width, up from 01's size of about 52–55%. It keeps 01's size inside this technique and grows across an edit, after the backdrop is made and before the floor. At the cut the viewer zoom changes from 63.3% to 44.7% while the word stays the same size on screen (measured; how the change was made is not shown)
steps:
1. Add a light and in Light Settings set Light Type to Environment (said; shown menu open on Environment, the layer "Environment Light 1" in the timeline)
   - Source: Default (no image) (shown)
   - Starting values: X Rotation 0x+0.0°, Y Rotation 0x+0.0°, Intensity 100%, Casts Shadows On, Shadow Darkness 100% (shown)
2. Add a comp-size solid behind the text in a colour that suits the texture, and keep it 2D as the backdrop (said; shown)
   - Size: 1920 x 1080 px (shown)
   - Colour: pale sky blue, about RGB 181,231,252 (#B5E7FC) sampled from the swatch (shown; value read by pixel sample)
   - Stack: bottom of the layer stack, 3D switch off (shown)
3. Duplicate the solid, switch the copy to 3D (said; shown — copy sits above the backdrop with its cube switch on)
4. Lay the copy flat and drop it under the letters, then scale it up (said; values shown)
   - X Rotation: 0x+90.0° (shown)
   - Position: 960.0, 721.0, 0.0 (shown)
   - Scale: 627.0, 627.0, 627.0% (shown)
5. On the floor copy open Material Options and set Accepts Shadows to Only, so the floor stays the backdrop colour and only the shadows show (said; shown)
   - Casts Shadows: On, Accepts Lights: On (shown, left unchanged)
   - Floor material defaults seen: Ambient 100%, Diffuse 50%, Specular Intensity 50%, Specular Shininess 5%, Metal 100% (shown)
   - The floor's eye is switched off and back on around (shown eye off, eye on) — a before/after check, not needed for the result (inferred)
6. Rotate the environment light so the shadows come toward the camera, making it a backlight (said; values shown)
   - X Rotation: scrubbed from 0x+0.0° to 0x-25.0° (shown at 0°, pointer scrubbing the value, at -25°)
   - Y Rotation: 0x+223.0° (shown)
7. Raise the light's intensity because the backlit front is dark (said; value shown)
   - Intensity: 100% → 187% (shown at 100%, at 187%)
   - Casts Shadows: On; Shadow Darkness: 100% (shown)
8. Animate the light's Y Rotation slowly for movement (said; keyframes shown)
   - Keyframe at 0:00:00:00: Y Rotation 0x+235.0° (shown — the first key now reads 235°, changed after step 6)
   - Keyframe at 0:00:04:23: Y Rotation 0x+195.0° (shown — key selected at 0:00:04:23)
timing and easing: Two Y Rotation keys, 235° at 0 s to 195° at 0:00:04:23 (about 5 s at 23.976 fps). Linear: the keys are plain diamonds (shown) and the value 219.5° at 0:00:01:21 (shown) sits on a straight line between them (measured).
variations: Backdrop colour chosen to match the texture or anything else (said). The floor's size and height are set by eye (inferred).
pitfalls: Leaving Accepts Shadows On instead of Only lets the floor take light and shade and no longer match the flat backdrop (said in substance).
layout: picture = the comp viewer, whole 16:9 comp visible (picture box x 690–2160, y 330–1156 in the full frame). The word spans about 13% to 87% of the picture width (centred) and about 33% to 66% of the picture height; its base sits at about 66%, which is also where the floor meets the backdrop. The soft shadows start at the letter bases and darken the floor from about 65% down to the bottom edge, densest between about 66% and 80% (measured)
build notes: comp.layers.addSolid([0.71,0.906,0.988], name, 1920, 1080, 1) for the backdrop; duplicate(), threeDLayer = true, Transform > X Rotation 90, Position [960,721,0], Scale [627,627,627]. Material Options > Accepts Shadows takes Off/On/Only (Only is the third state, value 2 — inferred). Light: comp.layers.addLight(name, [960,540]) then lightType = LightType.ENVIRONMENT (needs a recent After Effects; inferred); Transform > X Rotation -25, Y Rotation keyed 235 → 195 over 0–4.96 s with linear keys; Light Options > Intensity 187. Requires the comp renderer to be Advanced 3D (from 01).
unknowns: Light Settings dialog values other than type (hidden behind the open menu); floor Y position was dragged by eye (721 is where it landed); whether the floor Position's 721 vs 719 seen mid-drag matters.

## Shadowless parallel light as an extra backlight
id: 03-parallel-rim-light-no-shadows
revision: fad26040
job: light-the-hero; support: finish-the-look
status: unproven
what it does for a beat: A small finishing touch on a lit 3D title: a second, shadowless directional light from behind and to one side brightens the edges and tops of the letters without adding a second set of shadows.
what it looks like: The same backlit rusty word on the pale blue floor, now with brighter, slightly glinting top and right-hand edges on the letters and lighter faces, while the single set of soft shadows toward camera is unchanged.
ingredients:
- Parallel light — built-in; new light, Light Type: Parallel (shown menu, layer). Menu path Layer > New > Light... is inferred (the cursor is on the Layer menu).
- Builds on 02 (environment backlight, shadow-only floor) and 01 (textured 3D text)
steps:
1. Add another light; in Light Settings change Light Type from Environment to Parallel (said; shown type menu open with Parallel under the cursor, layer named Parallel Light 1 with Light Options: Parallel)
2. In the same Light Settings dialog untick Casts Shadows, then OK (said; shown still ticked, unticked with the pointer moving to OK; Light Options reads Casts Shadows: Off)
   - Dialog leaves Intensity at 100% and Color white (shown dialog); intensity is raised afterwards in step 4
3. Push the light back in Z, over to the right and up, aiming at the text centre, by scrubbing the Position values in the timeline (said; shown starting at 1040.0, 460.0, -346.7 with the scrub cursor on the Z value, landed)
   - Position: 2920.0, -100.0, 2663.3 (shown)
   - Point of Interest: 960.0, 540.0, 0.0 (shown, left at default — inferred)
4. Raise the intensity in Light Options (said "mess with the intensity"; values shown)
   - Intensity: 100% → 407% (shown)
   - Colour: white (shown)
   - Shadow Darkness: 100% (shown; irrelevant with shadows off)
timing and easing: none given (the light is not animated; the environment light's Y Rotation animation from 02 keeps playing)
variations: Intensity is to taste (said); right after this stretch the same light's Intensity is dragged down through 316% to 186%/216% (shown —, just outside this technique's window), so 400% is a starting point, not a final value.
pitfalls: none given beyond keeping its shadows off so it does not add a second shadow set (said in substance).
layout: picture = the comp viewer, whole 16:9 comp visible (picture box x 698–2196, y 332–1176 in the full frame). The word spans about 13% to 87% of the picture width and about 33% to 66% of its height, base at about 66% where the floor begins; shadows darken the floor from there to the bottom edge. The result crop covers only about 0–47% of the picture width and 7–97% of its height, i.e. the first two letters and the floor below them (measured)
build notes: var L = comp.layers.addLight(name, [960,540]); L.lightType = LightType.PARALLEL; Transform > Position [2920,-100,2663.3], Point of Interest [960,540,0]; Light Options > Intensity 407, Casts Shadows off (property "Casts Shadows" under "Light Options", value 0). Advanced 3D renderer from 01; the scene from 02.
unknowns: The final intensity the author settled on for this light (it is scrubbed down to 316% and later 186–216%, in the next technique's stretch). The result crop is only the left part of the viewer (the S, T and floor): everywhere in this stretch the selected light's gizmo and aim line cross the right half of the picture, so no clean full-viewer frame exists. The crop holds at 407% with no pointer, handles or gizmo from 181.72 (checked at both ends; the pointer is on the Intensity value in the timeline, outside the crop). The rim on the right-hand letters shows best in the full viewer (not clean: gizmo and aim line in the upper right) — use it to judge the rim, the crop to compare pixels.

## Soft front fill from a point light with smooth falloff
id: 04-point-light-falloff-front-fill
revision: bf8ba489
job: light-the-hero
status: unproven
what it does for a beat: Reach for this when lit 3D type reads as one flat wash from the front; a small, soft pool of light off to one side gives the faces a gentle gradient so the letters stop looking evenly lit.
what it looks like: Extruded, rust-textured letters standing on a pale floor against a pale sky-blue background, backlit so their shadows fall toward the camera; the left end of the word is a touch brighter on its front faces and the brightness fades off toward the right.
ingredients:
- Builds on 02 and 03: the environment light, shadow-catching floor and slow-turning backlight from 02 and the shadowless parallel rim light from 03 are already in the comp at the start of this span; this recipe gives only the added point light
- Point light (Light Settings dialog, Light Type: Point, Falloff: Smooth) — built-in; reached through a Light Settings dialog (shown); the menu that opened it is not on screen
- The 02/03 set-up: Environment Light, Parallel Light, a 3D text layer with Advanced 3D geometry and material, a 3D floor solid — built-in
steps:
1. Lower the rim (parallel) light from technique 03 a little before adding anything (shown →; the narrator only says to adjust intensity as needed)
   - Parallel light Intensity: 316% at the start of this span, settled at 216% (shown)
2. Add a new light and open its Light Settings (shown; the menu path Layer > New > Light… is inferred, though the Layer > New submenu with "Light…" and Ctrl+Alt+Shift+L is visible later)
3. In Light Settings set the type to Point, keep Falloff on Smooth, then OK (said "point light with a smooth fall off"; shown; Smooth already showed, greyed, while the type was still Parallel, so it may be the dialog's carried-over value rather than a choice made here: inferred)
   - Name: Point Light 1 (shown)
   - Light Type: Point (shown)
   - Color: white (shown)
   - Intensity: 100% (shown; left unchanged, still 100%)
   - Falloff: Smooth (shown)
   - Radius: 250 at creation (shown)
   - Falloff Distance: 200 at creation (shown)
   - Casts Shadows: off (shown)
   - Shadow Darkness 100% / Shadow Diffusion 100 px are greyed out with shadows off (shown)
4. Move the light in front of the word and over to its left (said; shown)
   - Position after creation: 1040.0,460.0,-666.7 in a 1920x1080 comp (shown — the X field is being scrubbed in that frame, so treat 1040 as the creation value: inferred)
   - Final Position: 456.0,530.0,-666.7 (shown); Z was never changed; reading -666.7 as well in front of the text plane at Z 0 is inferred
5. Widen the light's reach with Radius and Falloff Distance until the gradient is subtle (said; shown)
   - Radius: 589.0 (shown; passes through 614.0 and 608.0 while being dragged)
   - Falloff Distance: 373.0 (shown)
6. Compare: switch each light's eye off and on in turn (point, parallel, environment) to see what each one adds, and leave all of them on (shown point light off, parallel off, environment off; all on) — done without a word, but it is how the author judges the result
layout: measured on the result crop 716,400,1512,790 (shares of that crop, which is the comp view through the default camera): the word spans about 13%–87% of the width, centred (measured); letter tops at about 29% and bottoms at about 64% of the height, so letters are about 35% of the picture height (measured); the dark floor shadow fills the frame from about 65–69% of the height down (measured); the point light's gain is in the left half of the word — mean brightness of the letter band by quarter, light off then on : 129→162, 147→163, 123→123, 119→120 (measured)
timing and easing: none given (the point light is not animated; the playhead stays at 0:00:02:21 of a 23.976 fps comp throughout)
variations: the narrator says to adjust intensity to taste (said); radius and falloff are tuned by eye (said)
pitfalls: none given beyond the aim: avoid a single flat front light (said)
build notes: comp.layers.addLight("Point Light 1", [960,540]) then light.lightType = LightType.POINT. Under "Light Options" (as the timeline shows it): Intensity 100, Color white, Falloff = Smooth, Radius 589, Falloff Distance 373, Casts Shadows off (match names believed to be ADBE Light Intensity, ADBE Light Falloff Type, ADBE Light Falloff Start, ADBE Light Falloff Distance, ADBE Light Casts Shadows — confirm against the installed version). Transform > Position = [456,530,-666.7]. Leave the 02 environment light, floor and 03 parallel light in place and set the parallel light's Intensity to 216. Everything here can be scripted; nothing needs the interface. Lights only affect the text and floor because they use the Advanced 3D renderer set up in 01/02.
unknowns: how the light was created (menu or shortcut not on screen); whether the light's Point of Interest or orientation matters (a point light has none shown); the comp camera is the default active camera, so its exact view is not given; exact parallel-light intensity the narrator recommends (only 216% is seen); whether any value changed while the eye switches were being toggled

## One mood grade for mismatched art: Tritone plus a single-point Curves, pasted to every layer
id: 02-tritone-curves-mood-grade
revision: b858b451
job: finish-the-look; support: establish-place
status: unproven
what it does for a beat: When a scene is built from stock pieces that do not match (saturated greens, different palettes), this pulls them into one night-time or moody colour world in a minute, before any lighting or depth work. Assumes: a composition in which every scene object is its own layer (technique 01).
what it looks like: The same dusk scene turned into a cold blue-teal night: leaves, grass, trees and figures lose their bright colours and become dark blue-grey shapes, highlights are held down, and the figures read almost as silhouettes against a slightly lighter cloudy sky. Steps 1–6 alone leave the street lamp and stone wall graded too, so the lamp is a dull grey. In the later picture used as the result, the wall layer's Tritone is switched off (step 7), so the wall keeps its grey stone and the lamp glows warm orange, the only warm spot in the frame.
ingredients:
- Tritone — stock; Effects & Presets > Color Correction > Tritone (shown)
- Curves — stock; Effects & Presets > Color Correction > Curves (shown)
- Copy and paste of effects between layers — built-in
steps:
1. Select one layer (the example starts on a foreground branch) and apply Tritone from the Effects & Presets panel (said; shown search, effect on that layer)
2. Set Tritone Midtones to the colour that sets the mood; the narrator calls this the main control (said)
   - Midtones: #1C3C4C (H 200°, S 63%, B 30%; R 28, G 60, B 76), a dark slate blue (shown typed in the colour dialog, landed swatch)
3. Set Tritone Highlights down from white to a grey to hold the brightness down (said)
   - Highlights: #282828 (B 16%, R/G/B 40), a very dark grey rather than a mid grey (shown typed in the colour dialog; landed swatch)
   - Shadows: left at its default black (shown)
   - Blend With Original: 0.0% (shown)
4. Add Curves on the same layer, below Tritone, and drag one point on the RGB curve down to darken the midtones (said; shown)
   - Channel: RGB (shown)
   - One point placed at roughly input 63%, output 37% of the range (about 160 → 95 on a 0–255 scale), giving a curve that sags below the diagonal (curve shape shown; the numbers are inferred from its position on the grid)
5. Copy both effects and paste them onto the other layers (said; menu path or shortcut not shown, so Edit > Copy / Edit > Paste or Ctrl+C / Ctrl+V is inferred)
   - By the end of the pass the two foreground branches, grass, both figures, wall, ledge, the tall pine and both bare trees (10 layers) carry the effects (shown for the first seven, for all ten)
   - The paste onto the pine and bare trees carries on just past the span's end: the pine's Effect Controls show Curves and a bare tree shows Tritone and Curves
   - The city, the shape layer and the sky photo get no grade (shown, no fx switch on those rows)
6. On the stone-wall layer only, raise Tritone's Blend With Original to 36.0% so it keeps some of its own colour; this is done on screen without comment (shown; the value still reads 36.0%)
7. Switch off the Tritone effect (its fx eye in Effect Controls) on the stone-wall layer, leaving its Curves on, so the wall and its lamp keep their own colour. This happens off screen and is never mentioned: Tritone is on and off (shown both); when and why it was switched off is not shown
layout: measured on the result frame against the picture inside the crop (the whole comp view), as shares of its width (x) and height (y): the two figures stand together with their centre at about 43% x, about 32% of the picture height tall, feet about 75% down (measured); the ledge spans about 15%–59% x with its top about 71% down (measured); the pine stands at about 29% x, about 53% of the height tall, top about 20% down (measured); the lamp at about 66% x, 70%–80% down (measured); the stone wall at the right, about 79%–100% x, 34%–88% down (measured); bare trees frame the left ~30% and the right ~40% from the top edge (measured)
timing and easing: none given (a static grade, no keyframes)
variations: The midtone colour is chosen to suit your mood; blue is just the example (said). Curves is optional extra help (said).
pitfalls: none given
build notes: All scriptable. layer.property("ADBE Effect Parade").addProperty("ADBE Tritone"); set "Highlights" to [40/255,40/255,40/255,1], "Midtones" to [28/255,60/255,76/255,1], leave "Shadows" black and "Blend With Original" 0 (36 on the wall layer). Curves ("ADBE CurvesCustom") stores its curve in a hidden binary property that a script cannot set point by point; either apply a saved .ffx preset with layer.applyPreset(), or substitute Levels ("ADBE Easy Levels2", Gamma about 0.55 for a similar midtone drop), and note the substitution. For step 7 set the wall layer's Tritone effect .enabled = false (keep its Curves enabled). Loop over the scene layers instead of copy/paste, skipping the sky, city and any guide/shape layer.
unknowns: Whether the curve point was placed numerically (only the dragged shape is shown); when and why the wall layer's Tritone was switched off (off screen); whether the wall's 36% blend was meant as a step or a test before that switch-off; the exact Curves point on the other layers (assumed identical, as it was pasted); why the city and sky were left ungraded (not said).

## Flat cut-outs into a deep stage: push far layers back in Z, pull near ones forward, rescale to frame
id: 03-z-depth-push-and-rescale
revision: d871fbdb
job: add-depth; support: move-camera
status: unproven
what it does for a beat: Sets up real parallax and depth of field for a 2D illustrated scene: the picture through the default view barely changes, but layers now sit thousands of pixels apart, so any later camera move or focus pull separates them. Assumes: the scene is already split into one layer per object (technique 01) and graded (technique 02), with Tritone switched off on the stone-wall layer so its lamp glows warm (off).
what it looks like: The same blue night scene, framed almost as before: sky and skyline far behind, the two figures on the ledge in the middle, grass and two dark leafy branches large and close at the bottom and sides. The difference is structural (Z positions spread from about -1800 to about 7900), not yet visible as motion.
ingredients:
- 3D Layer switch — built-in; timeline switch column (shown)
- Layer Transform: Position (Z), Scale — built-in
- No camera layer yet: the viewer reads "Active Camera (Default)", i.e. the composition's default camera (shown)
steps:
1. Turn on the 3D Layer switch for every layer (said; shown, all 13 rows switched on)
2. Push the farthest element, the sky photo, far back in Z: the narrator asks for 5000 or more (said)
   - Sky Position Z: 7940 (shown; it passes 3690 on the way)
3. Scale that far layer back up until it fills the frame again (said)
   - Sky Scale: from 76.0% to 312.0% (shown for 76%, for 312%)
4. Pull the foreground elements toward the viewer, i.e. negative Z, and resize them for the framing you want (said; shown)
   - Both foreground branches: Position Z -1700 at first (shown), finally -1810 (shown)
   - Both foreground branches: Scale 37.0% (shown for both); they pass 57% and 41/59% while being adjusted
   - Grass: Position Z -830 (shown)
   - Stone wall: Position Z -600 (shown)
5. Leave the main subject at Z 0 (said)
   - Both figures: Position Z 0.0 (shown)
   - Ledge they stand on: Position Z 0.0 (shown)
6. Spread the remaining middle and back layers over a range of depths rather than one plane, the narrator stresses variety (said)
   - Tall pine: Position Z 1200 (shown)
   - Both bare trees: Position Z 1770 (shown)
   - One bare tree mirrored and enlarged: Scale about -146, 146, 146% (shown while still being dragged); the other bare tree stays at 100% (shown)
   - City skyline: Scale 275.0% (shown)
7. Switch the shape layer's 3D switch back off so it stays 2D; done on screen without comment (shown on, off)
   - Housekeeping, no effect on the picture: the Shy switch is turned on for every layer except the sky photo (still on); Hide Shy Layers is not used
layout: measured on the result frame against my crop (the comp view minus a thin top strip under the camera label, so y shares run from just below the picture's top edge), as shares of its width (x) and height (y): the two figures stand together with their centre at about 43% x, about 34% of the crop height tall, feet about 74% down (measured); the ledge spans about 1%–59% x with its top about 70% down (measured); the pine stands at about 30% x, about 61% of the height tall, top about 10% down (measured); the lamp at about 61% x, 63%–76% down (measured); the stone wall at the right, about 80%–100% x, 25%–88% down (measured); the dark foreground branches cover the left ~27% from the top down and the right ~43% from ~5% down (measured)
timing and easing: none given (static layout; nothing keyframed in this technique)
variations: Use whatever is furthest away (sky or other background) as the layer to push back (said). Vary the depths as much as the scene allows (said).
pitfalls: Pushing a layer back makes it smaller on screen, so it must be scaled up again (said). The shape layer is turned back to 2D without explanation (shown, reason unknown).
build notes: All scriptable. layer.threeDLayer = true for each layer (skip any 2D guide/shape layer). Set "ADBE Transform Group" > "ADBE Position" to [x, y, z] and "ADBE Scale" to [s, s, s]. To keep a pushed layer the same apparent size through the default camera, multiply its scale by (zoom + z) / zoom, where zoom is the default camera's 2666.7 px for a 1920-wide comp (this formula is inferred, not given): the sky's 76% × (2666.7 + 7940) / 2666.7 ≈ 303%, close to the 312% used. Foreground layers were deliberately left bigger than that compensation would give (37% instead of about 19%), so they loom larger. Set Continuously Rasterize on .ai layers scaled above 100%.
unknowns: The X/Y repositioning of most layers (values change but are not discussed); the city's final Z (it reads 0 while being edited); the grass and wall Scale; whether the composition's default camera or a specific view was used to judge framing (only "Active Camera (Default)" is shown); what the shape layer contains and why it is left 2D; Continuously Rasterize settings.

## Rain slanted to match the wind
id: 08-rainfall-matched-to-wind
revision: 8f1f79ee
job: establish-place; support: keep-it-alive, finish-the-look
status: unproven
what it does for a beat: Adds weather on top of a wind-animated scene so the motion has a reason, with the rain leaning the same way everything else is blowing. Assumes a scene that already moves in one wind direction (techniques 05–07; here the leaves enter from the left edge).
what it looks like: Fine, faint white rain streaks over the whole night scene, slanted rather than vertical, layered over the drifting leaves and swaying trees.
ingredients:
- Adjustment layer — built-in; Layer > New > Adjustment Layer (shown)
- CC Rainfall — stock (Cycore); applied through the Effects & Presets search (search box in use, inferred route; the effect first)
steps:
1. Make a new adjustment layer at the top of the comp (said; menu shown; layer at the top)
2. Apply CC Rainfall to it (said; shown)
   - Drops: 5000, Size: 3.00, Scene Depth: 5000, Speed: 4000 (shown, left at default)
   - Variation % (Wind): 0.0, Spread: 6.0, Color: white, Opacity: 25.0 (shown, left at default)
   - Transfer Mode: Lighten, Composite With Original: on (shown)
3. Set Wind so the drops lean the same way as the scene's wind (said; shown)
   - Wind: 840.0 (shown; dragged through -140.0, 840.0)
layout: measured, as shares of the crop (the whole viewer picture minus its edges): the two figures span about 34% to 49% of the width, about 42% of the crop height tall, feet at about 83% down (measured); rain streaks are thin, faint lines about 5–7% of the crop height long, covering the whole picture, leaning only slightly from vertical (measured)
timing and easing: none given; the rain is not keyframed.
variations: the author offers rainfall as one example of weather; other weather effects are implied but not named.
pitfalls: the author stresses the one thing that matters: the rain's direction must agree with the wind direction already in the scene (said).
build notes: comp.layers.addSolid then adjustmentLayer = true (or Layer > New > Adjustment Layer by hand); addProperty("CC Rainfall"); set "Wind" to 840. All other properties as shown are the defaults. The layer is later renamed to a plain name for rain (seen in technique 10's frames). Positive Wind is assumed to push drops toward the right to match leaves travelling left to right (inferred, not stated).
unknowns: whether positive Wind slants rain to the right in this version (direction not stated); whether any other CC Rainfall value was changed later.

## Film-stock grain and mood finish on a top adjustment layer
id: 10-film-grain-finish-stack
revision: 78d8fc73
job: finish-the-look
status: unproven
what it does for a beat: The last pass on an illustrated shot: real-film grain, one last overall curve, and an optional posterize for a rougher look, all in one layer over everything. Assumes the full scene is built beneath (techniques 01–09).
what it looks like: The rainy night scene gets fine colourless grain over the whole frame and slightly deeper midtones; with Posterize on, the tones become a little banded and gritty.
ingredients:
- Adjustment layer — built-in; Layer > New > Adjustment Layer (shown)
- Add Grain — stock; Effects & Presets search, Noise & Grain group (shown)
- Curves — stock; found by search (shown)
- Posterize — stock; found by search, Stylize group (shown search; group seen in the search results)
steps:
1. Make an adjustment layer at the very top of the comp (said; shown)
2. Apply Add Grain (said; shown)
   - Viewing Mode: Final Output (said; shown; dropdown open)
   - Preset: Kodak Vision 500T (5279) (shown hovered in the list, landed and cut short as "Kodak Vision 50..."); the author says to pick a favourite
   - Tweaking: Intensity, Size, Softness, Aspect Ratio all 1.000 (shown, unchanged)
3. Under Color, tick Monochromatic so the grain carries no colour (said; shown)
   - Tint Amount: 100.0%, Saturation greyed out (shown; unchanged)
4. Add Curves below Add Grain for the overall mood (said; shown)
   - RGB curve: one point near the middle pulled slightly down, about input 0.53 to output 0.47 (shown; numbers read from the graph, inferred)
5. Optionally add Posterize for a gritty look (said; shown)
   - Level: 14 (shown; the default is 7, so it was changed; I did not check frames between applying it and for the change)
   - The author toggles its eye while comparing (inferred, mouse on the switch); it is on at the end (shown)
layout: measured, as shares of the crop, which is the whole viewer picture: the two figures span about 36% to 46% of the width, about 27% of the picture height tall, feet at about 72% down (measured); the grain is a fine, even texture over the whole frame, specks about one pixel at this size, too small to measure (measured)
timing and easing: none given; no keyframes.
variations: any grain preset (said); Curves to taste (said); Posterize is optional and part of the author's own style (said).
pitfalls: the author prefers no colour in the noise, hence Monochromatic. Not said but true of Add Grain: in Preview viewing mode it shows grain only in a small preview box, so Final Output is needed to see it on the full frame (inferred).
build notes: comp.layers.addSolid with adjustmentLayer = true, moved to index 1. addProperty("ADBE Add Grain"): "Viewing Mode" popup (Final Output, third item in the list), "Preset" popup (Kodak Vision 500T (5279) is the 8th entry after [None]; check the index), "Color" > "Monochromatic" = true. addProperty("ADBE CurvesCustom"): the curve shape cannot be set by ordinary scripting, so set it by hand or apply a saved .acv/.ffx preset. addProperty("ADBE Posterize") with "Level" = 14. Effect order on the layer: Add Grain, Curves, Posterize.
unknowns: the exact Curves point; whether Posterize stays on in the final render; whether any Add Grain Application or Animation values were changed (not opened). Result caveat: frame is cut from the source video; the comp is playing with the camera dolly, and the adjustment layer is deselected only in this short window.

## Side-light a face with a matted Curves layer
id: 13-masked-curves-relight-track-matte
revision: 6dc3df1a
job: light-the-hero; support: finish-the-look
status: unproven
what it does for a beat: Assumes a close-up with the character on its own layer (or pre-comp) under a scene grade (techniques 11 and 12). Adds a soft wash of differently coloured light to one side of the face and hair only, so a flat close-up gains a light direction without touching the background.
what it looks like: The right side of the girl's face and the hair falling on that side (frame right) take on a cool green-cyan, slightly brighter tint, fading softly toward the centre of the face; the sky, tree and city behind her are unchanged.
ingredients:
- Adjustment layer — built-in; Layer > New > Adjustment Layer (inferred, not shown)
- Curves — stock; Effect > Color Correction > Curves (inferred path)
- Pen tool mask — built-in
- Track Matte (Alpha) — built-in; timeline Track Matte column
steps:
1. Add an adjustment layer (said) at the top of the close-up comp (shown : layer 1, above the camera)
2. Apply Curves to it and shape a different look (said)
   - RGB: one point raised above the diagonal at about input 40% to output 48% (shown; point position is our reading of the graph, crop)
   - Red: one point pulled below the diagonal at about input 55% to output 42% (shown; same crop), which brightens a little and pushes the area toward cyan-green
3. With the pen tool, draw a mask on the adjustment layer around one side of the character's face (said; shown : a closed path down the frame-right side of the face and hair, running off the top and bottom of the frame)
   - Mask mode: Add, not inverted (shown)
4. Set the adjustment layer's Track Matte to the character layer so the look lands only on her (said; shown : Track Matte set to the character pre-comp, layer 5)
   - Matte type: Alpha, not inverted (shown, crop)
5. Feather the mask heavily (said); Mask Feather: 143.0, 143.0 pixels (shown)
layout: on the result crop, the face (brow to chin) spans about 37–63% of the width, centred at 50%, eyes at about 35% of the height, chin at about 75% (measured); the cool side light covers the frame-right cheek and hair from about 52% to 82% of the width, full height, fading out toward 48% (measured).
timing and easing: none given; the relight is static.
variations: the narrator suggests it for close-ups; the look inside Curves is free (said: make a different look).
pitfalls: remember to feather the mask (said).
build notes: Script: comp.layers.addSolid at comp size, then set adjustmentLayer = true. Effect "ADBE CurvesCustom": curve points cannot be set from script directly; apply a saved .ffx preset or use a substitute such as "ADBE Easy Levels2"/Levels (Individual Controls) with Red gamma lowered and RGB gamma raised. Mask: layer.Masks.addProperty("ADBE Mask Atom"), set maskShape vertices, Mask Feather [143,143], Mask Mode ADD. Track matte: in After Effects 2023+ use layer.setTrackMatte(characterLayer, TrackMatteType.ALPHA); the matte layer stays visible.
unknowns: exact Curves point values (read off the graph only); green looks untouched (in the Red view its line runs on the diagonal with no point); blue is not shown; mask vertex positions; whether the mask was drawn before or after the matte was set (both are in place); the result frame is cut from the source video. The time display reads 0:00:02:06 throughout, so the result is a still.

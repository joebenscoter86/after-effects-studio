# Techniques from one video (11 recipes, all unproven)

Written by the channel learner from the video's narration and screen together, then checked against the video by a second reader. Every recipe here passed that check; none has been accepted by Joe, and none is in the plugin. `status: unproven` means it has not been built in After Effects and compared with the tutorial's own result.

Each step is marked `said` (narrated), `shown` (on screen; `fNNNNNN` is a frame in the local study folder, frame number divided by the video's frame rate is seconds) or `inferred` (our reading). The `source` and frame references are for checking and stay out of the plugin. Credits: `CREDITS.md`.

| # | Technique | Jobs | Check passed in round |
|---|---|---|---|
| 01 | Rounded-rectangle matte card that carries its media and labels | layout and repetition; workflow | 2 |
| 02 | Card that swings round a pivot below the frame, one step at a time, forever | layout and repetition; energy and impact | 2 |
| 03 | Card shrinks and leans outward at the ends of its swing | layout and repetition; energy and impact | 3 |
| 04 | Chained copies of a swinging card, placed with a helper null | layout and repetition; workflow | 2 |
| 05 | Cards orbiting an ellipse drawn as a mask | layout and repetition; trending formats | 2 |
| 06 | Cards growing along a drawn path into a stacked trail | layout and repetition; energy and impact; trending formats | 2 |
| 07 | Spinning square box built from four 3D cards | camera and 3D; layout and repetition; B-roll scenes | 1 |
| 08 | Counter-spinning tunnel from stacked card boxes | camera and 3D; layout and repetition; B-roll scenes | 2 |
| 09 | Camera push into the card tunnel with depth of field | camera and 3D; depth and finish; B-roll scenes | 2 |
| 10 | Ring of 3D photo cards seen from inside | camera and 3D; layout and repetition | 2 |
| 11 | Wide-lens camera inside the card ring | camera and 3D | 2 |

## Rounded-rectangle matte card that carries its media and labels
id: 01-rounded-shape-matte-media-card
status: unproven
source: ZqRE3ho8iP4 31–79 s
jobs: layout and repetition; workflow
what it does for a beat: Turns any photo or clip into a tidy rounded card whose size and position are driven by one shape layer, so the card can later be swung, scaled or duplicated as a unit. Reach for it as the base piece of any card carousel or media stack.
what it looks like: A portrait photo of a model, cropped into a rounded upright card in the middle of a plain cream frame, with a bold two-line white headline, two small outlined pill tags laid over the lower part of the card, and a small white logo mark in the card's top-left corner.
ingredients:
- Shape layer from the Rectangle Tool — built-in; toolbar shape-tool flyout (Rectangle Tool shown f002068)
- Track Matte (alpha matte from the shape layer) — built-in; Track Matte column of the timeline (shown f003401)
- Parenting (Parent & Link) — built-in; Parent & Link column (shown f004641)
steps:
1. Pick the Rectangle Tool from the shape-tool flyout and drag out an upright rectangle in the composition (said; tool menu shown f002068)
   - Composition: about 1920x1080, 23.976 fps (fps shown f002068; size inferred from the rectangle filling 29% x 66% of the picture at 556x712)
   - Rectangle Path Size: 556.0,712.0 (shown f002854)
   - Rectangle Path Position: 0.0,0.0 (shown f002854)
   - Fill: black, Stroke off (shown f002787; the fill colour does not matter because the layer is only used as a matte — inferred)
2. Centre the shape layer in the frame (said, stressed as exact; the Align panel is set to "Composition" in f003142, but no click on an align button is seen — how it was centred is inferred)
   - Shape layer Position as shown: about 958–960,538 (shown f004128 at 68.8 s, partly under the cursor), i.e. within a couple of pixels of the comp centre rather than exactly 960,540
3. Open Contents > Rectangle 1 > Rectangle Path 1 and raise Roundness to round the corners (said)
   - Roundness: 54.0 (shown f002854; dragged up through 20 and 41 first, f002730, f002787)
4. Drop the photo or video into the comp directly above the shape layer (said; shown f003142, photo layer at index 1 above the shape layer)
5. On the photo layer set Track Matte to the shape layer, using the alpha matte (said "track matte"; matte chosen shown f003401; alpha rather than luma is inferred from the matte icon)
   - The shape layer's own visibility goes off when it becomes the matte (shown f003809, eye column empty on the shape layer)
6. Scale the photo inside the card until it frames well (said "control the sizing")
   - Photo Scale: 70.0,70.0% (shown f003809)
7. Rename the shape layer so it is easy to find, for example "matte" (shown f003809; not said)
8. Parent the photo layer to the shape layer so moving or scaling the shape moves the photo with it (said; shown f004488, photo layer Parent = the matte layer)
9. Add the overlay elements on top — a two-line headline text layer, two pill-shaped outline boxes with a one-word text tag in each, a small logo image — and parent every one of them to the shape layer too (said; shown f004641, all six overlay layers parented to the matte layer)
   - Optional test: after parenting the photo, the matte's Position is dragged away and back to show the photo following it (shown at 68–70 s); it is put back, so it does not change the result
   - The overlay layers have no track matte (Track Matte = No Matte, shown f004641), so they sit on top of the card rather than being cut by it
   - The overlays are switched on one at a time while the layers are set up (shown at 71–74 s); this is housekeeping, not part of the look
layout: card width about 29% of the picture width and height about 66% of the picture height, centred both ways (measured on the result frame); corner radius about 54 px on a 556 px wide card, about 10% of the card width (measured from the Roundness value); headline sits in the lower third of the card, left-aligned with a margin of about 7% of the card width, letter height about 6% of the picture height; pill tags under the headline, each about 4% of the picture height tall; logo mark in the card's top-left corner, about 7% of the card width in from the left edge and about 5% of the card height down, roughly 11% of the card width wide (measured on the result frame, also visible in f004641)
timing and easing: none given (this part is static set-up)
variations: any media works — photos or video (said); any shape can be drawn (said "any shape that you want")
pitfalls: the shape must be exactly centred in the frame (said, stressed); the media and all text and graphics must be parented to the matte shape so one layer moves everything (said, stressed as "most importantly")
longest on: placing the media and setting the track matte to the shape, about 16 s (47.8–63.6 s); drawing and centring the rectangle about 13 s (31–43.8 s); parenting the overlays about 12 s (63.6–75.5 s)
build notes: by script — layers.addShape(); add "ADBE Vector Group" with "ADBE Vector Shape - Rect" (Size [556,712], Roundness 54) and "ADBE Vector Graphic - Fill"; set layer Position to the comp centre; import the media, move it above the shape, then mediaLayer.setTrackMatte(shapeLayer, TrackMatteType.ALPHA) (AE 2023+; older versions: put the shape directly above and set trackMatteType = TrackMatteType.ALPHA); mediaLayer.parent = shapeLayer and the same for each text, box and logo layer; media Transform > Scale [70,70]. Nothing here needs the interface.
result: start=74.0 end=74.05 still crop=796,244,1688,948 frame=f004440 (cut from source.mp4 at 74.0 s, saved as scratch/01/result_f004440.png; at 73.9 s the crop's top rows still catch the panel edge, from 74.1 s a selection box appears on the logo, and the editor view drifts by a few pixels every half second)
before: f002854 (the comp holds only a plain cream full-frame background layer, present from f002068, plus the black rounded rectangle just drawn); f003401 shows the photo just matted to it
unknowns: exact composition size (inferred 1920x1080); how the layer was centred (align button or position typed); fonts, sizes and colours of the headline and tags; size and roundness of the pill boxes; the logo artwork; whether the photo is a still or a clip in the finished build (a still is used here)

## Card that swings round a pivot below the frame, one step at a time, forever
id: 02-pivot-null-swing-loop
status: unproven
source: ZqRE3ho8iP4 79–136 s
jobs: layout and repetition; energy and impact
what it does for a beat: Gives a card (or later a row of cards) a carousel step: it swings in from one side on a big arc, settles upright, pauses, then swings out the other side, and the step repeats endlessly from only three keyframes. Use it for product or photo carousels, list reveals, or any "next item" rhythm.
what it looks like: The rounded photo card from 01-rounded-shape-matte-media-card arrives from the lower right tilted about 34 degrees, rocks up into the centre on a wide arc, holds upright for a moment, then falls away to the lower left on the same arc and leaves the frame; the step keeps repeating, so with a single card it does not come back (each cycle adds another −34°).
ingredients:
- The matte card from 01-rounded-shape-matte-media-card (shape matte with media and overlays parented to it)
- Pan Behind (Anchor Point) Tool — built-in; toolbar (said)
- Null Object — built-in; Layer > New > Null Object, Ctrl+Alt+Shift+Y (menu shown f005248)
- loopOut("offset") expression on Rotation — built-in (said; shown f007354)
- Easy Ease (F9) and the Graph Editor speed graph — built-in (said)
steps:
1. Build the card as in 01-rounded-shape-matte-media-card (inferred link; said "builds on")
2. With the Pan Behind tool, drag the matte layer's anchor point down to the bottom edge of the card, centred (said; result shown f008527, Anchor Point 3.8,359.8 on a 712 px tall rectangle, so the anchor sits on its bottom edge)
3. Make a null object (said; New > Null Object menu shown f005248)
4. Parent the matte layer to the null (said; shown f005817, matte layer Parent = the null)
5. With the Pan Behind tool, drag the null's anchor point straight down below the composition to where the swing should pivot (said; shown f006048, the null's anchor sits centred horizontally below the frame)
   - Pivot: centred, about 0.36 picture heights below the bottom edge of the frame, i.e. about 0.53 picture heights below the card's bottom edge (measured on f006048)
6. Test the arc by scrubbing the null's Rotation value back and forth and watching the card travel round the pivot (shown f006048, scrub cursor on the Rotation value; the timeline also records about −81° during this stretch; not said; the value is then put back to 0)
7. On the null's Rotation, set a keyframe of 0 degrees around frame 20 (said "around 20 ish frames"; shown f006324, key at about 20 f, 0x+0.0°)
8. Go to frame 0 and rotate the null so the card sits off to one side (said; shown f006769)
   - Rotation at 0 f: 0x+34.0° (shown f006769; card to the right)
9. Add a third keyframe a few frames after the 0-degree one, with the same value, to make a short hold (said; shown f006769, a third key about 3 f later)
   - Final key times after retiming: 0 f (+34°), 17 f (0°), 24 f (0°) at 23.976 fps (shown f008128, measured on the timeline ruler; the move from 20 f to 17 f is not seen being done)
10. Alt-click the Rotation stopwatch and type the offset loop (said; the auto-complete list of continue / cycle / offset / pingpong shown f007212)
   - Expression: loopOut("offset") (shown f007354)
   - Each cycle now adds another −34° step, so the card keeps moving right → centre → left and out (inferred from how offset looping works; the playback at 133.6–135.5 s shows the card leaving to the lower left)
11. Select the first two keyframes and apply Easy Ease with F9 (said; hourglass Easy Ease icons on keys 1 and 2, third key left linear, shown f008128)
12. In the Graph Editor (speed graph), pull the ease handles out to make a strong, symmetric ease in and out (said "smooth out the animation however you need"; final shape shown f007938 and unchanged in cuts at 132.6 s and 133.0 s, just before the playback)
   - Key 1 outgoing handle: Speed 0.00 °/s, Influence 76.71% (shown f007938, tooltip)
   - Key 2 incoming handle: about the same length, so about 77% too (inferred from the matching handle length)
   - Resulting speed graph: peak about −199 °/s at about frame 8.5 of the 17-frame swing, symmetric, near-zero speed for the first and last few frames (shown f007938 and at 132.6 s, read off the graph's degree scale)
   - On the way the author drags an earlier, lopsided shape (peak about −116 °/s near frame 5, mid-drag in f007915); that is not the final shape
layout: card upright and centred at the hold, card about 29% of picture width and 66% of picture height (measured, unchanged from 01); at frame 0 the card centre sits about 77% across and 62% down the picture, tilted +34° (measured on f006769); pivot centred about 0.36 picture heights below the frame's bottom edge (measured on f006048)
timing and easing: 23.976 fps; null Rotation keys 0 f = +34°, 17 f = 0°, 24 f = 0° (24-frame cycle: 17 f swing, 7 f hold); Easy Ease on the first two keys, then both handles pulled to about 77% influence for a symmetric ease with a peak of about 199 °/s mid-swing; loopOut("offset") repeats the step forever
variations: none given beyond "however you need" for the graph shape (said)
pitfalls: parenting the card to a null that is itself moved creates layers of parenting ("null-ception", said); without a loop expression the keyframes only play one swing (said); without easing the step looks mechanical (said: ease is highly suggested)
longest on: moving the two anchor points and setting up the null, about 22 s of the span (79–101.4 s); the loop expression about 14 s (114–128 s); the keyframes about 13 s (101.4–114 s); the graph editor about 8 s (128–136 s)
build notes: by script — matte.property("ADBE Transform Group").property("ADBE Anchor Point") set to [0, rectHeight/2] and Position compensated so the card does not jump (the Pan Behind tool does this compensation by hand); var n = comp.layers.addNull(); move the null's anchor/position so its position lies at [compW/2, compH*1.36]; matte.parent = n; n Rotation setValueAtTime(0,34), (17/23.976,0), (24/23.976,0); expression 'loopOut("offset")'; KeyframeEase on keys 1–2: key 1 outgoing new KeyframeEase(0, 76.71) and key 2 incoming new KeyframeEase(0, about 77) (key 1 value shown f007938; key 2 inferred from its matching handle); key 2 outgoing and key 3 can stay linear. Nothing needs the interface.
result: start=133.6 end=135.5 animated crop=723,333,1542,864 frame=f008100 (cut from source.mp4 at 135.0 s; a mouse arrow sits in the picture for the whole playback, so no kept or cut frame in the window is fully clean; the panel shifts by up to 8 px across the window)
before: f004641 (the card upright and centred, before any anchor change or null)
unknowns: how the keys moved from about 20 f / 23 f to 17 f / 24 f (somewhere in 123–131 s, not checked); the exact influence of key 2's incoming handle; the null's exact position values; the composition length; whether anything else in the comp is animated

## Card shrinks and leans outward at the ends of its swing
id: 03-tilt-and-shrink-on-swing
status: unproven
source: ZqRE3ho8iP4 136–162.2 s
jobs: layout and repetition; energy and impact
what it does for a beat: Adds a size-and-lean change on top of the pivot swing so the card is small and tipped outward while it is off to the side and full size and upright when it reaches the top. This is what makes a swinging carousel feel like it is "resizing" and gives the centred item its emphasis.
what it looks like: The rounded photo card enters from the lower right at about two-thirds size and leaning hard outward, grows to full size as it rises upright into the centre, holds, then shrinks and leans outward again as it falls away to the lower left.
ingredients:
- The swinging card from 02-pivot-null-swing-loop (matte card parented to a pivot null with a looping rotation)
- Scale and Rotation keyframes on the matte shape layer — built-in (said)
- Easy Ease (F9) and the Graph Editor — built-in (shown about 156.8–161.4 s)
steps:
1. Start from the finished 02-pivot-null-swing-loop set-up: null keys 0 f +34°, 17 f 0°, 24 f 0° with loopOut("offset") (inferred link; null keys still visible in f008527)
2. Select the matte shape layer (the card) and open Scale and Rotation; its anchor is already on the card's bottom edge (shown f008527, Anchor Point 3.8,359.8)
   - Housekeeping: the photo, text, box and logo layers are hidden from the timeline with the shy switch, leaving only the null, the matte and the background listed (shown f008527, f008779); this does not change the picture
3. At frame 17, where the null reaches 0°, set keyframes for Scale and Rotation at full size and upright (said "hold the sizing rotation at the top"; shown f008527 and f008821)
   - Scale: 100.0,100.0% (shown f008821)
   - Rotation: 0x+0.0° (shown f008821)
4. At frame 0, where the card sits to the right, set Scale and Rotation so the card is smaller and leans further outward (said "slightly tilt and scale down"; shown f008779 and again in f009150)
   - Scale: 68.0,68.0% (shown f008779)
   - Rotation: 0x+23.0° (shown f008779 and f009150; added on top of the null's +34°, so the card leans about 57° in all — inferred sum)
5. At frame 24, where the null's hold ends, add a matching full-size, upright key so the card holds at the top (shown f008995, a third key added with 100% and 0°; the author says to hold the size and rotation at the top)
6. At frame 41, where the null's next step has carried the card to the left (24 f + 17 f), set the shrink and lean again in the other direction (said: repeat the shrink and tilt when the card reaches the other side)
   - Scale: 68.0,68.0% (shown f009381)
   - Rotation: 0x−22.0° (shown f009381; the key first reads 68% and +23° in f009150 — that it was copied and pasted from frame 0 is inferred, no copy or paste is seen — then it is changed to −22, so the card leans about −56° in all with the null at −34° — inferred sum)
   - Key times measured on the timeline ruler: 0 f, 17 f, 24 f, 41 f (shown f009381)
7. Smooth the Scale and Rotation keys (said "smooth out those keyframes if you want")
   - Easy Ease on all four keys of both properties: hourglass icons on every key by 156.8 s (shown in a cut at 156.8 s; all four keys selected in f009348)
   - Then in the Graph Editor (about 157–161.4 s) the handles are pulled long: a tooltip on the first key's outgoing handle reads Speed 0.00 °/s, Influence 86.23% (shown in a cut at 161.0 s)
   - Resulting speed graphs for Scale (red) and Rotation (cyan): near zero speed around every key, with one narrow, tall spike inside each change: at about frame 7.5 of the 0–17 f stretch and about frame 32 of the 24–41 f stretch (Rotation peaks roughly −500 °/s and beyond the graph's lower edge; shown at 161.0 s, key positions measured on the graph), so each change is slow at both ends and very quick in the middle; the other handles' influences are not readable and are taken as the same (inferred)
layout: at the centre hold the card is 29% of picture width and 66% of picture height, upright, centred (measured, from 01); at the side extremes the card is about 20% of picture width (68% of full size), its centre about 77% across and 77% down the picture on the right (f008779) and about 23% across and 76% down on the left (f009381), leaning about 57° outward, so it partly drops below the frame's bottom edge (measured)
timing and easing: 23.976 fps; matte keys at 0 f (68%, +23°), 17 f (100%, 0°), 24 f (100%, 0°), 41 f (68%, −22°), timed to the null's 0 f / 17 f / 24 f / 41 f positions; Easy Ease on all keys, then strong eases with long handles (first key outgoing influence 86.23%, shown at 161.0 s; the others assumed similar, inferred)
variations: the smoothing is optional (said "if you want")
pitfalls: none given
longest on: setting the four Scale/Rotation keys and matching them to the null's step, about 16 s on screen (f008416 at 140.3 s to f009381 at 156.3 s); easing about 4–5 s (157–161.4 s); the author stresses that the size and rotation must hold at the top
build notes: by script — on the matte layer: Scale setValueAtTime at 0, 17, 24, 41 frames (÷23.976) with [68,68], [100,100], [100,100], [68,68]; Rotation ("ADBE Rotate Z") with 23, 0, 0, −22; apply KeyframeEase(0, 86.23) in and out on every key to match the shown first-key handle (the other keys' values inferred). The null's Rotation loops with loopOut("offset"), but the video does not show any loop on the matte's Scale and Rotation, so as built here they play once (0–41 f); a single card that leaves the frame after 41 f does not need more, and in a multi-card chain each copy carries its own keys (see the next step of the video, not part of this recipe).
result: none — no clean frame of the finished effect exists. Inside 136–162.2 s the card is always drawn with the layer's selection handles, the easing is set only at 157–161.4 s, and the finished tilt-and-shrink is never played back in the span (at 161.25 s, f009675, the card is simply upright at the hold). The next part of the video (196–212 s) shows still frames of a multi-card build, also with handles. The opening montage (about 6 s) shows a clean multi-card version, but it is a finished template example made a different way, so it is not this build. For the state at the left-hand extreme, see f009381 (with handles, before easing): crop=686,308,1456,819.
before: f008527 (card full size and upright at frame 17, keys being set)
unknowns: the influence of every handle except the first key's outgoing one (86.23%); whether the matte's keys are looped by an expression; why the left-side lean (−22°) differs from the right-side lean (+23°) by one degree; a clean playback of the finished effect within this span

## Chained copies of a swinging card, placed with a helper null
id: 04-duplicate-cards-round-the-pivot
status: unproven
source: ZqRE3ho8iP4 162.2–211.0 s
jobs: layout and repetition; workflow
what it does for a beat: Turns one looping swing card into a carousel of several cards that follow each other round the same pivot, one swing step apart, so a new card always arrives as the previous one leaves. Reach for it for product, photo or profile carousels where each beat shows the next item.
what it looks like: A cream background with one upright rounded photo card (a woman in a cap over a red text panel with a two-word headline and two pill tags) held in the centre, while smaller copies lean in from the lower right and fall away to the lower left on the same arc; after the media swap the copies carry different photos.
ingredients:
- The swinging card from 01-rounded-shape-matte-media-card, 02-pivot-null-swing-loop and 03-tilt-and-shrink-on-swing (matte card with its media, text and graphics parented to it; matte parented to a pivot null whose Rotation is keyed 0 f +34°, 17 f 0°, 24 f 0° with loopOut("offset"); matte Scale/Rotation keyed 0, 17, 24, 41 f)
- Duplicate (Edit > Duplicate) — built-in; menu path or shortcut not shown (inferred)
- A second null object used only as a placement helper — built-in
- Parent & Link column — built-in (shown)
- Replace layer source by dragging an image from the Project panel onto a selected layer — built-in; modifier key not shown (inferred)
steps:
1. Select every layer of the card (matte, media, logo, headline, tags and boxes) and duplicate them, so a second card set exists whose children are parented to the copied matte (said "duplicate all four elements"; shown f009866: copies named with a "2", children parented to the copied matte, copied matte still parented to the main null)
   - The narration says four elements; the screen shows eight card layers duplicated (logo, two tag texts, two boxes, headline, image, matte). Screen wins.
2. Duplicate the main pivot null once (said; shown f010101: a second null at the top of the stack, still carrying the rotation keys)
3. On the duplicated null, delete the Rotation expression and keyframes so it is static (said; shown f010411: stopwatch off, Rotation 0x-0.0°)
4. Parent the copied matte to the duplicated null (said; shown f010411: copied matte's parent reads the second null)
5. Rotate the duplicated null by the same angle as one swing step of the main null, so the copy moves one step round the arc (said "the same amount" as the initial rotation; shown f010902)
   - Rotation: 0x+34.0° (shown f010902; the drag passes +35° in f010646 and settles at +34°)
   - With Null 1 at 0° the copy now leans in from the lower right while the original stands upright (shown f010902)
6. Re-parent the copied matte to the main (looping) null (said; shown f010902: copied matte's parent reads the first null). The helper null is left in the comp, unparented and unused (shown f011408 and f011963)
   - After re-parenting, the copied matte's first Rotation key reads 0x+57.0° (shown f011143) — the original +23° lean from 03 plus the helper's +34° folded in by the parenting (inferred sum)
7. Slide all of the copied matte's Scale and Rotation keyframes later in time so its tilt-and-shrink fires when the copy reaches the top, one cycle after the original (said "offset" the keys; the narration says position and rotation, the screen shows Scale and Rotation being dragged — screen wins; f011143 shows the keys while the drag is still going, tooltip visible; landed positions shown in a cut at 187.0 s, scratch/04/k187.0.png)
   - Offset: about 24 f (one full cycle of the null) — first key moved from 0 f to 1:00 (24 f at 23.976 fps); keys now at about 24, 41, 48 and 65 f (measured on the ruler in the 187.0 s cut; f011143 is mid-drag)
8. Repeat steps 1–7 to add more cards until the arc is filled (said "continue the process"; shown f011963: mattes numbered 4, 5 and 6 in the visible part of the stack, each parented to the main null, children of each parented to their own matte; f012657 also lists a matte numbered 3; six cards in all inferred from the numbering, no frame lists all six at once)
   - Per-copy helper rotations and key offsets for cards 3–6 are not shown
9. To change a card's photo, select its media layer in the timeline and drag a new image from the Project panel onto it so the layer keeps its parent and matte (said; shown f012189: media layer selected while an image is dragged from the Project panel; f012657: the media layers now show different image files with the same parents)
10. Resize and reposition the new image to fill the card (said; shown f012657)
   - Scale on the swapped images: 31.0%, 35.0%, 36.0% (shown f012657; each value depends on the source image size)
layout: the result frame shows two cards only, the centred card and the incoming copy at the right (the outgoing left copy is off screen at that moment); centred card upright, about 29% of the picture width and 67% of the picture height, top edge about 17% and bottom edge about 83% down (measured on the result frame); the incoming copy at the right, its centre about 77% across and 78% down, at 68% scale (from 03) and leaning about +57° (position measured; scale and lean from 03 and step 6); in the editor view at 199 s (f011963) a matching outgoing copy sits at the lower left, its centre about 22% across (measured); side cards overlap the centre card's lower corners
timing and easing: 23.976 fps; main null keys 0 f +34°, 17 f 0°, 24 f 0° with loopOut("offset") (from 02); each copy's matte Scale/Rotation keys shifted later by one 24-frame cycle per step (shown for the first copy only); eases as set in 02 and 03
variations: swap in any picture or video per card (said); "continue the process" for as many cards as wanted (said)
pitfalls: none given
longest on: placing the first copy with the helper null — duplicate, static helper, parent, rotate, re-parent, offset — about 25 s (162–187 s); filling out the remaining copies about 13 s (187–200 s); the media swap about 11 s (200–211 s)
build notes: by script — duplicate the card layers with layer.duplicate() (re-point each child's parent to the new matte; AE does this when the matte and its children are duplicated together). Easiest equivalent of the helper-null trick: for copy k, set its matte parent to the main null and add k×34° to every Rotation keyframe value of the copied matte (ADBE Rotate Z), then shift every Scale and Rotation key by k×24 frames (k×24/23.976 s) — read each key's time/value, removeKey, setValueAtTime at the new time, re-apply ease. Or reproduce literally: addNull(), set its anchor/position equal to the main null's, Rotation = k×34, matte.parent = helper, then matte.parent = mainNull (AE folds the helper rotation into the matte's transform). Media swap: mediaLayer.replaceSource(newFootageItem, false), then set Scale to fit. Note that keys shifted later leave the copy at its first-key state before 24 f; the video does not show a loopIn or pre-roll.
result: start=213.3 end=213.4 animated crop=626,289,1320,740 frame=f012798
before: none clean in this span; the single card from 03-tilt-and-shrink-on-swing is the starting state (f009866 already shows the duplicate stacked on the original)
unknowns: how cards 3–6 were placed (helper rotations of 68°, 102°… or −34° are not shown) and their key offsets; whether the helper null is deleted later; the modifier key used for the media swap (Alt/Option-drag inferred); position values of the swapped images; total card count in the final comp beyond the six mattes listed; comp length. The result window is just after the span end (the playback at 211–215 s, before the template advert) because no clean in-span frame shows the finished carousel; the recording zooms slowly here, so the crop holds only for about 0.1 s (at 213.2 s the viewer's right border is inside the crop) and frame f012798 is a cut from source.mp4 at 213.3 s (saved as scratch/04/result-213.3.png), not a kept frame.

## Cards orbiting an ellipse drawn as a mask
id: 05-mask-path-to-position-loop
status: unproven
source: ZqRE3ho8iP4 247.2–305.0 s
jobs: layout and repetition; trending formats
what it does for a beat: Sends a ring of photo cards round an oval forever, framing a title or product in the middle. Use it for an endless moodboard or gallery loop behind a headline, or a hold that has to run for any length.
what it looks like: On a warm off-white background, about sixteen flat, square-cornered photo cards of mixed portrait and landscape shapes (flowers, portraits, a jar, interiors) travel round a wide oval that fills most of the frame, overlapping slightly, with an empty middle where the example sets a dark green two-line title.
ingredients:
- A shape-layer matte with an image on track matte, the image parented to it, as in 01-rounded-shape-matte-media-card (here the rectangle has Roundness 0) — built-in (said "an image and a shape matte ready"; shown f015929)
- Ellipse tool with the Tool Creates Mask option — built-in (said; shown f015657, mask option highlighted in the toolbar)
- Mask Path copied and pasted into Position — built-in (said)
- loopOut() expression on Position — built-in (said "regular loop out"; shown f016617)
steps:
1. Start with one card: a rectangle shape layer used as a matte with an image matted to it and parented to it, both centred (said; shown f015929)
   - Matte Position: 960.9,542.4 (shown f015929)
   - Rectangle Size: 300.5,214.3, Roundness 0.0 (shown on the first copy before it was resized, f017037 — the original's own size panel is not shown; inferred same)
2. With the matte layer selected, pick the Ellipse tool, switch on Tool Creates Mask, and drag out a wide ellipse round the card in one drag, about 86% of the comp width (said; Tool Creates Mask highlighted in the toolbar in f015657, which is mid-drag; landed oval shown f015929)
3. Set the mask mode to None so the mask no longer cuts the card (said "turn off the mask"; shown f015929, Mask 1 mode None)
4. Select Mask Path, copy it, select the matte's Position and paste, which turns the outline into Position keyframes (said; shown f016437: Position keyed, motion path drawn as an oval, card jumped to the top of the oval)
   - First key Position: 958.6,205.5 (top of the oval; shown f016437)
   - Position at 12:07 while looping, about 2.4 s into the cycle and near the left end of the oval: 147.6,484.3 (shown f016617; close to, not on, the 2.5 s key) — the card travels top → left → bottom → right, counter-clockwise
5. Drag the last Position keyframe out to slow the orbit (said "stretch out the final keyframe"; shown f017356)
   - Keys at 0, 2.5, 5, 7.5 and 10 s, the middle three as roving keys (small dots) (shown f017356; times measured on the ruler)
6. Add the expression loopOut() to Position so the card keeps going round (said; typed in f016497, shown f016617)
   - Expression: loopOut() (shown f016617)
7. Duplicate the matte and its image together (said "duplicate both of these elements"; shown f017356: second matte and image pair)
8. Optionally change the copy's shape and photo (said "change the shape's size" and "insert new imagery"; shown f017157 and f017356)
   - Rectangle Size on the copy: 222.5,300.3 (shown f017157; constrain proportions off, landscape changed to portrait)
   - Copy's image: a different photo, parented to the copied matte (shown f017356)
9. Slide the copy's Position keyframes a little later so it trails the first card round the oval (said "move those keyframes over by a touch"; f017532 shows the drag in progress, first key heading to about 0.6 s; f017712 shows the landed stagger, each newer copy's first Position key later than the one before)
10. Duplicate, re-shape, re-photo and offset again and again until the cards fill the whole oval (said; shown f018081: the stack lists mattes numbered up to about 16, each with its own image)
layout: orbit path measured from the key values in a 1920×1080 comp — centre about 50% across and roughly 45% down, width about 84% of the picture (half-width about 811 px), height about 52% of the picture (top at 205.5 px; centre y about 484 px, approximate because 147.6,484.3 was read near, not on, the left key) (measured from shown values); first card 300.5×214.3 px, about 16% of the width and 20% of the height (measured from shown values); on the result frame the cards run from about 2% to 98% across and 10% to 93% down, each about 10–14% of the picture width and 18–25% of its height, the middle about 40% wide left empty (measured)
timing and easing: Position keys pasted from the mask, last key moved to 10 s (orbit 10 s per lap, inferred from key spacing 0/2.5/5/7.5/10 s); middle keys roving; loopOut() cycles it; each copy offset "by a touch" (about 0.6 s for the first copy, mid-drag); no eases given
variations: change each card's shape size and swap in new pictures (said)
pitfalls: none given
longest on: duplicating, re-shaping, re-photographing and offsetting copies until the loop is full, about 26 s (277–303 s); drawing the mask and pasting it into Position about 15 s (252–267 s)
build notes: by script — create a shape layer with a Rectangle (ADBE Vector Shape - Rect, Size [300.5,214.3], Roundness 0), image layer with trackMatteType = TrackMatteType.ALPHA (or setTrackMatte on AE 2023+) and parent = matte. Build the orbit directly instead of via a mask: set Position keys at 0, 2.5, 5, 7.5, 10 s on the four extreme points of an ellipse centred [958.6,484.3] with radii about [811,279] (the centre y is approximate) (top, left, bottom, right, top) and give the middle keys spatial tangents so the path is elliptical (each tangent ≈ 0.5523 × radius along the path), or set mask path vertices on a mask and copy them to Position with Shape → keys conversion done by hand in the interface (pasting a mask path into Position is an interface-only action). Set roving on keys 2–4 (setRovingAtKey). Expression 'loopOut()'. Duplicate pairs with layer.duplicate(), set each copy's matte Size and image via replaceSource, then shift each copy's Position keys by its offset. The mask itself can stay with mode None (MaskMode.NONE).
result: start=248.4 end=249.4 animated crop=771,352,1646,925 frame=f014937
before: f015929 (one centred card inside the oval mask, mode None)
unknowns: the original card's exact rectangle size; the offset per copy after the first and whether it was even; the final card count (about sixteen mattes are listed); whether the copies were also given loopIn or a pre-roll so they do not sit still before their first key; every copy's size. The result window is the author's pre-made finished example shown at the start of the span, in a separate comp that also holds a dark green two-line title and a noise layer that this tutorial does not build (shown f015057); by 301 s the build comp has gained the same title and an adjustment layer off screen (shown f018081). The same ring is played again in the build comp at about 300–303 s but the mouse arrow sits in the viewer throughout. The recording zooms slowly, so the crop drifts by a few pixels across the window.

## Cards growing along a drawn path into a stacked trail
id: 06-path-trail-scale-rotate-in
status: unproven
source: ZqRE3ho8iP4 305.0–343.0 s
jobs: layout and repetition; energy and impact; trending formats
what it does for a beat: A stream of photo cards is born as specks, grows and straightens as it sweeps along a looping path, and brakes to a stop in a fanned stack. Use it for a gallery reveal, a "many stories" opener, or a build-up behind a title.
what it looks like: On a pale grey background, flat square-cornered photo cards (portraits, fashion, interiors) appear tiny and tilted near the lower left, sweep up the left side and across the top while growing, and land one behind another on the right, the newest card full size in front, leaving a fanned stack arcing round a centred dark green two-line title.
ingredients:
- Shape-layer matte with an image matted and parented to it, as in 01-rounded-shape-matte-media-card and 05-mask-path-to-position-loop — built-in (shown f018861)
- Pen tool drawing a mask on the matte layer — built-in (said; shown f018861)
- Mask Path copied and pasted into Position, as in 05 — built-in (said)
- Scale and Rotation keyframes with Easy Ease on the last keys — built-in (said; shown f019922)
steps:
1. Start from one matte card with an image matted and parented to it, centred (shown f018861; the card is landscape, about 26% of the picture width and 35% of its height at full size, measured on f019922)
   - Matte Anchor Point: 11.9,7.3 (shown f019922)
2. With the matte layer selected, draw a custom open path with the Pen tool, dragging out Bézier handles (said; shown f018861, mask being drawn as a curve)
3. Copy the mask path and paste it into the matte's Position, as in 05 (said "as before"; shown f019221: Position keyed and the card moved to the path's first point)
   - First key Position: 755.9,919.3 (shown f019221)
   - No loop expression this time (said)
4. Drag the last Position keyframe out to set the travel time (not said; shown f019221, last key selected and placed at 6 s)
   - Keys at about 0, 1.4, 3.4, 4.8 and 6.0 s in f019221 (shown f019221; measured on the ruler). The middle three are roving keys (small dots, shown f019922), so After Effects re-times them as the eases change: they sit elsewhere in later frames, and their times follow from the path and eases rather than being set
5. Key Scale and Rotation at both ends of the move: tiny and tilted at the start, full size and level at the end (said "start small and tilted"; start values shown f019761)
   - Scale at 0 s: 0.0,0.0% (shown f019761; values were tried while dragging — 49%, 35%, 41% — before landing, cut at 325.9–328.4 s)
   - Rotation at 0 s: 0x+19.0° (shown f019761; the on-screen text reader's "40°" and "10%" are mid-edit readings, not landed values)
   - Scale at 6 s: 100% and Rotation at 6 s: 0° (inferred: the keys at 6 s were set at the layer's default values, shown f019461 with Scale 100.0,100.0% and Rotation 0x+0.0° before the start values were changed; at 5:04 the card reads 96.0% and +0.8° on the way to them, shown f019922)
6. Ease the last keys so the card brakes to a soft stop (said "smooth out our final two keyframes"; shown f019922: the 6 s keys of Position, Scale and Rotation all carry Easy Ease icons; the 0 s keys stay linear)
7. Duplicate the matte and image pair many times, swap the photo on each copy, and stagger them in time (said "duplicate, replace and offset"; shown f020169: copied pairs whose layer bars start about 0.36 s later; replacement not done on screen in the build — every copy still uses the same photo in f020169)
   - Offset method shown: whole layers slid later in the timeline (layer in-points move), not key-dragging as in 05 (shown f020169 and f020589)
   - Stagger in the finished build comp: about 0.25–0.4 s between successive pairs, roughly sixteen to eighteen pairs, each with a different image (shown f020589; measured from the bar starts against the ruler)
layout: path in a 1920×1080 comp (measured from the drawn path on f019581, converted to comp pixels): starts at 755.9,919.3 (39% across, 85% down), bends left to about 15% across and 47% down, crests at about 59% across and 18% down, runs down the right side at about 85% across and 51% down, ends about 82% across and 70% down; on the result frame the front card spans about 72–99% across and 50–87% down (about 28% wide and 37% tall), the stack fans from about 8% to 99% across and 0% to 87% down, and the smallest cards sit near 28% across and 83% down (measured)
timing and easing: Position, Scale and Rotation keys 0 s → 6 s (23.976 fps comp); 0 s keys linear, 6 s keys Easy Ease; middle Position keys roving; copies staggered by about 0.25–0.4 s each; no loop
variations: duplicate, replace and offset as many times as wanted (said)
pitfalls: none given
longest on: about equal between duplicating and offsetting copies, about 11 s (332–343 s), and setting the Scale and Rotation start values and easing the stop, about 10 s (322–332 s); drawing the path and pasting it about 8 s (312–320 s)
build notes: by script — shape-layer matte with Rectangle, image layer matted and parented as in 05. Position keys: setValueAtTime at 0 and 6.0 s with the middle three points roving (or at about 1.4, 3.4, 4.8 s before setting them roving) on the five path points above (comp pixels) with spatial tangents to round the curve (setSpatialTangentsAtKey), roving on keys 2–4 (setRovingAtKey); pasting a mask path into Position is interface-only, so either do that by hand or approximate the curve with tangents. Scale ("ADBE Scale") [0,0] at 0 s and [100,100] at 6 s; Rotation ("ADBE Rotate Z") 19 at 0 s and 0 at 6 s; on the 6 s keys apply KeyframeEase(0, 33) incoming (Easy Ease) for Position, Scale and Rotation. Copies: duplicate both layers, replaceSource the image, then shift both layers' startTime by k × about 0.3 s.
result: start=308.85 end=309.0 animated crop=729,332,1553,875 frame=f018540
before: f018861 (one centred card while the path is being drawn)
unknowns: the exact pen path vertices and handles (read from the screen, not from values); the middle keys' times (roving, so they shift with the eases); the end Scale and Rotation values (100% / 0° inferred); whether the eases were changed beyond Easy Ease; how each copy's image was replaced (not shown in the build); the exact stagger per copy and the final count. The result is the author's pre-made finished example shown at the start of the span in a separate 60 fps comp (shown f018441) that also holds the title and a noise layer not built here; the finished build comp plays only after the span ends (about 343 s). The mouse arrow wanders across the viewer during that playback, so the clean window is only about 0.15 s (the arrow enters the crop by 309.05 s); frame f018540 is a cut from source.mp4 at 309.0 s (saved as scratch/06/result-309.0.png), not a kept frame, and the slow zoom of the recording moves the crop by a few pixels.

## Spinning square box built from four 3D cards
id: 07-3d-spinning-box-of-cards
status: unproven
source: ZqRE3ho8iP4 352.3–395.7 s
jobs: camera and 3D; layout and repetition; B-roll scenes
what it does for a beat: Turns a handful of photo cards into a rotating four-walled box seen end-on, a quick 3D showcase loop for a gallery or "many images" moment, and the base unit for the tunnel in 08.
what it looks like: Four rounded photo cards stand edge-on round the centre of a dark frame, forming the walls of a square box seen down its axis, with gaps at the corners; the whole box spins steadily clockwise around the view axis.
ingredients:
- Rounded shape-matte media cards (recipe 01: rounded-rectangle shape layer as track matte for an image, image parented to the shape) — built-in
- 3D layer switch — built-in
- Anchor Point (Z), Orientation, Y Rotation — built-in transform properties
- Null object (3D) — built-in; Layer > New > Null Object (inferred; the timeline's context menu is open at f023123)
- Expression on the null's Z Rotation — built-in
steps:
1. Start from one shape-matte card (recipe 01): a rounded shape layer used as track matte for an image, the image parented to the shape; the comp is 1920x1080 (shown f021189).
2. Switch both the image and the shape layer to 3D (said; 3D switches on both rows shown f022613 crop).
3. On the shape layer, turn Y Rotation to a little over 90 degrees so the card faces sideways; the narrator says 90 or slightly more for nicer perspective (said).
   - Y Rotation: 0x+97.0° (shown f022853; f021753 shows 98° while still being dragged)
4. Push the shape layer's anchor point out along Z so the card slides off to one side of the frame while its pivot stays at the frame centre (said).
   - Anchor Point before: 269.7, 137.5, 0.0 (shown f021867) — X and Y are the card's own centre (half its width and height), so the card is about 539 x 275 px (inferred)
   - Anchor Point first set: 269.7, 137.5, 560.0 (shown f022307)
5. Duplicate the card (image and shape layer together) and set the copy's Orientation Z to 90° (said; shown f022613 crop).
6. After the first copy, both shapes' anchor Z is pulled in so the walls sit closer together (not said; done on screen).
   - Anchor Point: 269.7, 137.5, 440.0 on both shapes (shown f022721)
7. Repeat for two more copies so the four shapes have Orientation Z 0°, 90°, 180°, 270°, all with Y Rotation 97° and anchor Z 440 (said "repeat"; 180° and 270° shown f022853).
8. Swap the images on the copies so each wall shows a different photo (said; result frames show four different images).
9. Add a null, make it 3D, and parent the four shape layers to it; the images stay parented to their own shapes (said; parent column shown f023614).
10. Add an expression to the null's Z Rotation so it spins with time (said).
    - Expression: time*40 (shown f023614; crop scratch/07/expr.png) — 40 degrees per second
layout: Measured on the result frame (source 394.2 s, crop below). The viewer shows only the middle 82% x 82% of the 1920x1080 picture, so the box overflows the crop vertically. Box centred on the frame centre (measured). Outer extent of the four walls about 69% of the crop width, i.e. about 57% of the picture width (measured); in the unspun state (f023123) the empty square opening in the middle is about 32% of the picture width and 58% of its height (measured). Each wall reads as a long thin trapezoid because the card is seen almost edge-on (Y Rotation 97°). Background is a dark, near-black solid (shown f022307, bottom layer).
timing and easing: No keyframes; continuous spin from the expression, 40°/s, one turn every 9 s (inferred from time*40). Default camera, no camera layer.
variations: Y Rotation exactly 90° or a bit more for more perspective (said). Any images can be swapped into the cards (said).
pitfalls: none given
longest on: Setting the first card's Y Rotation (about 10 s, f021189–f021819), closely followed by duplicating and orienting the copies with the anchor tweak (about 9 s, f022307–f022853).
build notes: Script: for each card, layer.threeDLayer = true on both the image and shape layer; shape.transform.yRotation = 97; shape.transform.anchorPoint = [w/2, h/2, 440]; shape.transform.orientation = [0, 0, k*90] for k = 0..3; image.parent = shape. Null: comp.layers.addNull(), threeDLayer = true, position at comp centre, transform.zRotation.expression = "time*40"; set each shape's parent to the null (parent after positioning so the cards keep their place). Track matte from recipe 01 (image.setTrackMatte(shape, TrackMatteType.ALPHA) in recent versions). All doable by script.
result: start=394.0 end=394.4 animated crop=700,318,1540,860 frame=scratch/07/result.png (cut from source.mp4 at 394.2 s; no kept frame in the window is clean)
before: f021867 (single flat card turned sideways, anchor Z still 0)
unknowns: Card size and corner radius (from recipe 01; size only inferred from the anchor values); the shapes' Position (presumably comp centre, not shown); the null's position (not shown, presumably comp centre); whether the anchor change from 560 to 440 was applied to the third and fourth copies before or after duplication (they show 440 indirectly through the closed box only); background colour value.

## Counter-spinning tunnel from stacked card boxes
id: 08-tunnel-from-stacked-boxes
status: unproven
source: ZqRE3ho8iP4 395.7–418.0 s
jobs: camera and 3D; layout and repetition; B-roll scenes
what it does for a beat: Extends the spinning box (07) into a deep tunnel of photo walls whose alternate rings turn in opposite directions; a hypnotic gallery loop or the set for a camera fly-through (09).
what it looks like: Seen end-on, a near square ring of photo cards sits in front of a smaller copy further back, the two rings twisting against each other so the walls cross and fan; more rings can be stacked behind.
ingredients:
- The finished box from 07 (four 3D shape-matte cards parented to a 3D null spinning with time*40)
- A second 3D null — built-in
- Expression on Z Rotation — built-in
steps:
1. Build the box from recipe 07 (said: builds on it).
2. Duplicate all four cards (images and shapes together) (said). The copies keep the same four images as the first box (shown f024394: the copied shapes carry the same image layers as the originals).
3. Push the copied shapes back in Z through Position (said); the four copies are still parented to the first null at this point (shown f024394).
   - Position: 0.0, 0.0, 1340.0 on each copied shape, in the null's space (shown f024394)
4. Add a second null and make it 3D (said "another null"; its Orientation and X/Y/Z Rotation rows shown f024574).
5. Give the second null a negative time expression on Z Rotation so it spins the opposite way (said; value shown f024574 and crop scratch/08/expr.png).
   - Expression: time*-40 (shown f024574)
6. Re-parent the four pushed-back shapes from the first null to the second null (shown f024754; not spoken).
   - Their Position still reads about 0, 0, 1340 after re-parenting, so the second null sits where the first one does (timeline reading at f024673, frame not opened; the null's position is inferred)
7. Optionally keep duplicating rings and moving them back, alternating parents between the two nulls (said: the narrator invites any number of further copies and Z moves; a third and fourth ring are added, with one ring on the second null and the next on the first, shown f024867).
layout: Measured on the result frame (source 411.9 s, crop below; the viewer shows the middle 70% x 64% of the 1920x1080 picture). Tunnel centred on the frame centre (measured). The front ring's outer extent is about 69% of the crop width (measured); the back ring, 1340 px further away, reads about 43% of the crop width (measured), so it appears about 0.6x the front ring. Gaps between walls show the dark background. Two small red outlines at the centre are the nulls' viewer icons, not part of the picture.
timing and easing: No keyframes; first null turns at +40°/s, second at -40°/s (shown expressions), so neighbouring rings counter-rotate at a relative 80°/s (inferred).
variations: As many extra rings and Z moves as you like (said). The opposite spin is optional ("if you like") (said).
pitfalls: none given
longest on: Duplicating the box and pushing the copies back in Z (about 9 s, f023854–f024394); the second null and its negative expression take about 5 s.
build notes: Script: duplicate each image/shape pair of the box (layer.duplicate()), set copy shape.transform.position = [0, 0, 1340] while parented to null A (or set parent first and then position); null B = comp.layers.addNull(), threeDLayer = true, same position as null A, transform.zRotation.expression = "time*-40"; set the copied shapes' parent to null B. For further rings repeat with Z = 2*1340, 3*1340 (spacing for rings 3 and 4 not shown) and alternate parents.
result: start=411.4 end=412.3 animated crop=575,340,1310,670 frame=scratch/08/result.png (cut from source.mp4 at 411.9 s; the two nulls' red outlines are drawn at the centre throughout this playback)
before: f023734 (single spinning box from 07)
unknowns: Z positions of rings three and four (not shown); null positions in numbers; whether the second null is otherwise a copy of the first.

## Camera push into the card tunnel with depth of field
id: 09-camera-fly-through-with-depth-of-field
status: unproven
source: ZqRE3ho8iP4 418.0–443.0 s
jobs: camera and 3D; depth and finish; B-roll scenes
what it does for a beat: Flies the viewer into the counter-spinning card tunnel (08) while shallow focus melts the near and far walls, for an immersive opener or transition through a wall of images.
what it looks like: From outside, the camera travels straight down the tunnel axis until photo walls surround the frame and stream past; with depth of field on, the nearest cards blur heavily while a band of cards a little further in stays sharper.
ingredients:
- The tunnel from 08 (rings of 3D shape-matte cards on two counter-spinning nulls)
- Camera layer, Two-Node Camera, preset 50mm — built-in; new camera from the timeline's right-click New menu (inferred: the menu is glimpsed at about 420 s)
- Camera Options: Depth of Field, Focus Distance, Aperture, Blur Level — built-in
- Camera dolly tool (dolly towards cursor) — built-in
- Layer Motion Blur switch, on for every image and matte layer in the prepared comp — built-in (shown f025776; not spoken)
steps:
1. Add a camera (said).
   - Type: Two-Node Camera (shown f025287)
   - Preset: 50mm; Zoom 2666.7 px, 39.6° horizontal angle in the 1920x1080 comp (shown f025287 dialog and f026316)
   - Enable Depth of Field left off in the dialog (shown f025287)
2. Turn on stopwatches for Position and Point of Interest at 0 s with the camera's default values (said "keyframes for position and point of interest"; shown f025596).
   - Point of Interest: 960.0, 540.0, 0.0 (shown f025596)
   - Position: 960.0, 540.0, -2666.7 (shown f025596)
3. Move to 6 s and push the camera into the tunnel with the dolly tool, which moves position and point of interest together (said; dolly tool highlighted in the toolbar and values shown f025776).
   - Point of Interest: 967.4, 537.0, 3942.2 (shown f025776)
   - Position: 967.4, 537.0, 1275.5 (shown f025776)
4. Open Camera Options, set Depth of Field to On and raise Aperture and Blur Level (said; shown f026316).
   - Depth of Field: On (shown f026316)
   - Aperture: 98.3 px, up from 25.3 (shown f026316; start value from the timeline's reading)
   - Blur Level: 203% (shown f026316)
5. Pull Focus Distance down from 2666.7 px so a different depth comes into focus (said).
   - Focus Distance: 2489.7 px, held still from 440.6 s to 441.5 s and the value the result picture uses (shown source 441.2 s; crop scratch/09/fd_stack.png)
   - Afterwards it is dragged on to 2472.7 px as a later tweak just before the section ends (shown source 442.2 s, cursor still dragging)
layout: Measured on the result frame (source 441.2 s, camera parked at 1 s, crop below; viewer shows the middle 82% x 74% of the picture). Card walls fill the whole crop; the dark open core of the tunnel is a narrow diamond about 22% of the crop width, centred (measured). Nearest cards, at the frame edges, are heavily blurred; mid-depth cards at about a third of the way in from the edges are the sharpest (measured by eye). Red outlines in the centre are the nulls' viewer icons.
timing and easing: Two keyframes on Position and Point of Interest, 0 s and 6 s (shown f025776); keyframe markers look like plain linear diamonds (inferred from f026016); no easing mentioned.
variations: Focus distance can be set to choose what is sharp ("for better focus") (said).
pitfalls: none given
longest on: The depth-of-field settings, about 14 s (f025686 to the end), against about 10 s for adding and keying the camera.
build notes: Script: cam = comp.layers.addCamera("Camera", [960,540]); cam.autoOrient default two-node (Point of Interest active); zoom 2666.7 (50mm in a 1920-wide comp). Keys: cam.transform.position.setValueAtTime(0,[960,540,-2666.7]), (6,[967.4,537,1275.5]); pointOfInterest (0,[960,540,0]), (6,[967.4,537,3942.2]). cameraOption: depthOfField = 1, aperture = 98.3, blurLevel = 203, focusDistance = 2489.7 (2472.7 was a later tweak). The prepared comp has Motion Blur on for every image and matte layer: layer.motionBlur = true (whether the comp-level motion blur button is on cannot be read). The dolly tool is only an interface convenience; keying the values is equivalent.
result: start=441.0 end=441.5 still crop=716,390,1540,780 frame=scratch/09/result.png (cut from source.mp4 at 441.2 s; picture held at camera time 1 s with Focus Distance steady at 2489.7 px throughout the window; the nulls' red outlines sit at the centre)
before: f025596 (camera at default position outside the tunnel)
unknowns: Where the focus drag after 442.2 s ends (2472.7 is the last value read); keyframe easing; the full fly-through is not played back clean in this span. From the camera step on, the comp on screen holds 16 cards with different images from the one built in 07–08, and Motion Blur is switched on for every image and matte layer there, which the 07–08 build does not have (shown f025776; crop scratch/09/switches.png), so the author appears to have switched to a prepared version of the tunnel; its ring spacing and count beyond 16 cards are not shown.

## Ring of 3D photo cards seen from inside
id: 10-inner-ring-carousel
status: unproven
source: ZqRE3ho8iP4 448.8–489.0 s
jobs: camera and 3D; layout and repetition
what it does for a beat: Puts the viewer in the middle of a slowly turning ring of photo cards, so a gallery wraps around the frame instead of sliding past it. Reach for it for a portfolio, lookbook or "many stories" moment.
what it looks like: On a flat pale grey ground, a row of portrait photo cards with softly rounded corners curves away to both sides; the middle card faces the viewer square-on and its neighbours turn inward like the inside wall of a drum. The ring turns steadily about its vertical axis.
ingredients:
- Shape layer (rectangle) used as a matte card with a photo layer parented to it — built-in (shown f027145; the card itself is technique 01-rounded-shape-matte-media-card)
- 3D Layer switch — built-in (said; shown f027145, f027465)
- Anchor Point Z — built-in (said; shown f027465)
- Y Rotation — built-in (said; shown f027882)
- Null object, 3D — built-in (said; shown f029138, f029195); Layer > New > Null Object (inferred, menu not shown)
- Expression on the null's Y Rotation — built-in (said "time expression"; text shown at 487.8 s, scratch/10/expression-487.8s.png)
steps:
1. Start from one card: a centred rectangle shape layer with a photo layer parented to it; the shape's eye is off and the photo shows only inside it (shown f027145: photo's Parent column points at the shape, shape's eye off). That the shape is the photo's track matte is inferred from technique 01.
   - Comp: 1920 x 1080, 23.976 fps, 15 s (shown f027145, project panel)
   - Background: flat pale grey, about RGB 228, 228, 228 (measured on the result frame)
2. Turn on the 3D switch for both the shape and the photo (said; shown f027145 being clicked, both on at f027465).
3. Push the shape layer's Anchor Point Z far negative so the card moves away from the viewer and its pivot stays at the comp centre (said, "negative 1500"; shown). The card shrinks in the viewer as the value grows (shown f027145 → f027465).
   - Anchor Point: 0.0, 0.0, Z (shown). The value was scrubbed, not typed: −1430 (f027441), −1510 (f027465), and the last reading before the property was closed is −1480.0 (shown f027527 and scratch/10/anchor-459.0s.png). The narrator says −1500; the screen ends at −1480. Either works: this number is the ring's radius in pixels.
   - X and Z Rotation stay 0 (shown f027882)
4. Duplicate the card (shape and its photo together) and give the copy's shape a Y Rotation one step further round (said; shown f027882).
   - Y Rotation: 0x−24.0° (said "negative or positive 24 degrees"; shown f027882, crop scratch/10/yrot-027882.png)
   - Orientation stays 0, 0, 0 (shown f027882)
5. Keep doubling: select all the newest copies, duplicate them, and with the new shape layers selected scrub their Y Rotation together so every copy moves the same amount and the 24° spacing carries on (said, "incremental plus 24 degree moves"; the screen steps negative, and the screen wins on the sign; shown, several layers' Y Rotation moving in step under one drag cursor at f028380, scratch/10/yrots-028380.png). The ring grows 1 → 2 → 4 → 8 → 16 cards (shown f027882, f028110, f028613, f028864).
   - To keep the list short while doing this, the photo layers are set shy and shy layers are hidden, so only the card shapes are listed (shown: only the shape rows, even layer numbers, remain in the list at f028380; the photo rows carry the shy switch in f029304; the click on the hide-shy button itself is not seen, inferred). This does not change the picture.
   - Cards 3 and 4: −48°, −72° (shown f028110, scratch/10/tl2-028110.png)
   - Cards 5–8: −96°, −120°, −144°, −168° (shown f028613, scratch/10/yrots-028613.png)
   - Cards 11–16: −216°, −240°, −264°, −288°, −312°, −336° (shown f028747, scratch/10/tl3-028747.png)
   - 360 / 24 = 15, so 15 cards close the ring exactly. The build makes 16, and by the values shown two cards share one place (inferred). The finished version shown at 488 s has 15 cards (shown at 488.1 s, the top card layer is the 15th; scratch/10/null-488.1.png).
6. Add a null, parent every card shape to it (said; shown f029138, Parent column of all shapes set to the null), then turn the null's 3D switch on (shown f029138 being clicked; f029195 null shows Orientation and X/Y/Z Rotation). The photos stay parented to their own shapes (shown f029304).
   - Null position: left where it was made; its outline's corner sits at the picture centre in the result (shown f029304; that it is at the comp centre is inferred)
7. Add an expression to the null's Y Rotation so the ring turns on its own (said "time expression"; the stopwatch tooltip and the typed expression are shown at 487.2–487.8 s, scratch/10/null-487.2.png and expression-487.8s.png). Alt-clicking the stopwatch is the usual way and the tooltip mentions it, but the click itself is not seen (inferred).
   - Expression on Y Rotation: `time*20` (shown, scratch/10/expression-487.8s.png)
8. Swap in different photos per card (shown in the finished file at f029304, every card has its own photo). The recording does not show the swap: at 487.8 s the build still has 16 card shapes, and from 488.1 s the screen shows a different, pre-made file with 15 card shapes, photo layers labelled differently and set shy (shown f029304).
layout: Measured on the result crop (picture 1492 x 840 with the top 50 px left out, so heights below are shares of the full 840 px picture height). Centre card: about 27% of the picture width and 59% of its height, centred (measured). Its two neighbours sit with centres at about 19% and 81% of the width, about 28% wide and 62–64% tall, turned inward (measured); only thin slivers of the next cards show at the left and right edges (measured). Gaps between cards about 3% of the width (measured). The flat card before it was made 3D measured about 30% of the comp width by 66% of its height (measured on f027145, about 570 x 710 px in the 1920 x 1080 comp; approximate, small frame).
timing and easing: Ring spin from the expression `time*20`: 20° per second, a full turn in 18 s (shown expression; arithmetic inferred). No keyframes, no easing.
variations: The narrator gives the step as "negative or positive" 24°, so the ring can be built in either direction (said).
pitfalls: none given
longest on: Duplicating and stepping the Y Rotation: about 18 s (460.7–479.1 s, f027641–f028747). Making the card 3D and pushing the Z anchor takes about 6.5 s (452.4–458.8 s, f027145–f027527), the null and expression about 7 s (481.1–487.8 s), and the finished piece opens the chapter for about 3 s (448.8–451.5 s). The author calls this one his favourite.
build notes: By script: for i in 0..14, a rectangle shape layer (`ADBE Vector Shape - Rect`, about 570 x 710 px, rounded corners) at the comp centre with `threeDLayer = true`, `transform.anchorPoint = [0, 0, -1500]` (or −1480 as on screen) and `transform.yRotation = -24 * i`; above each, a 3D photo layer parented to its shape and set to use the shape as its alpha track matte (`setTrackMatte(shape, TrackMatteType.ALPHA)` in AE 2023+), shape hidden. Add a 3D null at the comp centre (`layers.addNull()`, `threeDLayer = true`), parent all shapes to it, and set `transform.yRotation.expression = "time*20"`. Note: the anchor offset goes on the shape layer, whose position is the ring's centre; the photo just follows its parent. The default camera (no camera layer) gives the result frame here; technique 11 adds a wide camera. Check in a build: by the numbers (anchor about −1500, default camera about 2667 px in front of the centre) the near half of the ring sits between the camera and the ring centre. In the build at f028747 those near cards show in the viewer only as thin outlines spanning the frame and no photos render there; confirm that they do not block the view under the default camera.
result: start=488.3 end=489.0 still crop=676,345,1492,788 frame=f029304 (clean cut: scratch/10/result-488.5.png). The viewer picture is at x 674–2170, y 295–1135 (measured) and holds still from 487.9 to 489.2 s, except that a green layer outline with handles shows round the right-hand card from about 488.0 to 488.2 s (green-pixel count in the crop 140 at 488.05 and 488.15 s, 25–27 at 487.9 s and from 488.25 s on), so the window starts at 488.3 s. The crop is inset 2 px at the sides and bottom and starts 50 px below the picture top to leave out the viewer's camera label; all cards are inside it. The comp is parked at frame 0, so the spin itself is not seen until the camera is added (technique 11). A null's thin red outline shows on the middle card in every frame of the window; it is a viewer overlay, not part of the render, so ignore it when comparing. This result is the pre-made 15-card file with its own photos, not the 16-card build made in steps 4–6.
before: f027145 (one flat card, not yet 3D)
unknowns: Card size in pixels and corner radius (the card build belongs to technique 01); whether the Z anchor was meant to land on −1500 or −1480; Y Rotation of cards 9 and 10 (not shown; inferred −168° and −192°); how the photos were swapped; the null's exact position; the photos' own scale.

## Wide-lens camera inside the card ring
id: 11-wide-lens-camera-distortion
status: unproven
source: ZqRE3ho8iP4 489.0–501.0 s
jobs: camera and 3D
what it does for a beat: A one-step finish for the ring of cards in 10-inner-ring-carousel: a short-focal-length camera stretches the perspective so the ring reads as a wide, immersive sweep rather than three flat cards. Use it whenever a 3D layout looks too flat under the default view.
what it looks like: The same turning ring now shows about seven cards across the frame: the middle card is small and square-on, and the cards toward the left and right edges grow taller and lean inward, so the row bows like the inside of a drum around the viewer.
ingredients:
- The finished ring from 10-inner-ring-carousel — built-in layers (shown f029304). On screen the camera goes into the pre-made 15-card file with its own photos, not into the 16-card build (shown f029434, f029606 timeline rows)
- Camera layer, Two-Node Camera — built-in (said "create another camera"; type shown f029606); right-click in the timeline > New > Camera… (right-click menu with "New ›" shown f029366; New submenu open with "Camera…" highlighted shown f029434, crop scratch/11/menu-029434.png)
steps:
1. Start from the ring of 3D cards on its spinning 3D null, seen through the default view (shown f029304, viewer label reads the default active camera).
2. Add a new camera (said; right-click menu shown f029366, New > Camera… highlighted shown f029434, Camera Settings dialog shown f029533).
   - Type: Two-Node Camera (shown f029606, crop scratch/11/dialog-029606.png)
   - Preset: 24mm, picked from the preset list in place of the default 50mm (said "wide focal length preset"; list open at f029533, 24mm landed at f029606)
   - Focal Length: 24.00 mm; Zoom: 451.56 mm; Angle of View: 73.74°; Film Size: 36.00 mm, measured horizontally (shown f029606)
   - Enable Depth of Field: off (shown f029606)
   - Lock to Zoom: on (shown f029606)
   - Create Camera From Current View: off (shown f029606); turning it on would change where the camera is placed
3. Click OK (shown f029606, OK pressed). No camera move is seen afterwards, so the camera is taken to stay where the dialog puts it (inferred; at f029732 the camera is layer 5 with its row collapsed, so its keyframes cannot be seen).
4. Play: the null's expression keeps the ring turning, now seen through the wide lens (shown f029732, 495.5 s).
layout: Measured on the result crop (1502 x 840 px, the whole picture less a 2 px edge). Middle card: about 14% of the picture width and 31% of its height, centred (centre at about 52% across, 50% down) (measured). Next cards out: about 15% wide and 32% tall, centres at about 36% and 68% across (measured). Next: about 17–18% wide and 37–39% tall, centres at about 19% and 86% (measured). The cards cut off at the left and right edges are about 44–45% tall (measured). Gaps between cards about 1.5–2% of the width (measured). Seven cards are in view, against three under the default camera, where the middle card was about 27% wide and 59% tall (measured on f029304, technique 10).
timing and easing: none given for the camera (no keyframes). The ring's spin comes from technique 10 (`time*20` on the null's Y Rotation).
variations: none given (the narrator only says a wide preset; 24mm is the one picked on screen).
pitfalls: none given
longest on: The playing result: about 6.5 s (493.6–500.1 s), alternating between the bare ring and a dressed-up version with a title and buttons. Setting up the camera takes about 4 s (489.4–493.4 s, f029366–f029606). The narrator calls this his favourite tip.
build notes: By script: `comp.layers.addCamera("Camera", [comp.width/2, comp.height/2])` makes a two-node camera; set `cameraOption.zoom` to the 24mm value in pixels, which for a 36 mm film width is `comp.width * 24 / 36` = 1280 px in a 1920-wide comp (inferred from 451.56 mm zoom on a 677.33 mm comp width, both shown). The dialog route with the 24mm preset should place the camera at Z = −1280, inside a ring of radius about 1500 px; that is what makes the near cards swing in large at the edges (inferred). By script, `addCamera` likely places the camera using the comp's default zoom (Z about −2667 for a 1920-wide comp), and setting the zoom afterwards does not move it, so also set the camera's Position to [960, 540, −1280] (point of interest at the comp centre); otherwise the camera sits outside the ring and the picture will not match (not tested in After Effects; confirm in a build). Leave `cameraOption.depthOfField` off. Picking the preset from the dialog's Preset list is a by-hand step; by script set the zoom directly.
result: start=495.53 end=495.7 animated crop=686,304,1502,840 frame=f029732 (clean cut: scratch/11/result-495.65.png). In this window the viewer picture spans about x 683–2194, y 301–1149 and grows by about 1 px every 0.1 s as the recording slowly zooms (measured from cuts every 0.1 s); the crop is inside it throughout. Before 495.53 s the viewer shows a dressed-up version with a title and buttons; faint grey button shapes start to ghost in at the bottom by about 495.8 s (darkest level 217–221 against a 228 background), so the window ends at 495.7 s. A second stretch of the bare ring through the same camera is at 494.05–494.45 s, viewer at about x 676–2176, y 297–1138 (measured).
before: f029304 (ring under the default camera: three large cards across the frame)
unknowns: The camera's position and point of interest after creation, and whether it is moved or keyed afterwards (not shown; the camera row is never opened; the default placement is assumed); whether any other camera setting was changed after OK; how the dressed-up version with title, logos and buttons (seen at 448.8 s and 494.6–495.45 s) was built; the 16th card overlapping one place, carried over from technique 10.

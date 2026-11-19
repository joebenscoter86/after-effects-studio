# Arsenal recipes: Line jobs: what the viewer must get from this line

Generated from the recipe drafts; do not edit by hand. Recipes whose primary job is in this group. Find candidates for a beat with ae_arsenal find; read one with ae_arsenal get, or a section here by its heading.

## Round dots from a shape stroke
id: 01-dotted-stroke
revision: 228e87a2
job: point-at-detail; support: show-time, keep-it-alive
status: proven (accepted 2026-11-14)
what it does for a beat: Turns any stroked line or outline into an evenly spaced row or ring of round dots with no extra layers, for loaders, orbit rings, borders and decorative circles around a title.
what it looks like: A thin white ring of about thirty small round dots circles a short white word on a near-black background, and the ring slowly turns.
ingredients:
- Shape layer with a stroked path (here an ellipse) — built-in; Ellipse tool, stroke on, fill off
- Stroke > Dashes — built-in; the plus button beside "Dashes" inside the stroke
steps:
1. Draw an ellipse with the Ellipse tool on a new shape layer: white stroke, no fill. (shown)
   - Stroke Width: 18 (shown)
   - Fill: off. The toolbar fill swatch is crossed out (shown), and the group still holds a "Fill 1" with its eye switched off (shown). A scripted build must remove or disable that fill so it does not show.
   - Color: white (shown)
2. Open Contents > Ellipse 1 > Stroke 1 and click the plus button beside Dashes twice. (said; shown, after both clicks) The first click adds only Dash and Offset (shown); the second adds Gap (shown).
   - Dash: 10.0 and Gap: 10.0 after the clicks (shown); these are just what appeared, not chosen values
   - Offset: 0.0 (shown)
3. Set Line Cap to Round Cap. (said; shown, the menu open; set)
4. Set Dash to 0. With a round cap, a dash of zero length draws as a dot as wide as the stroke. (said; shown)
   - Dash: 0.0 (said; shown)
5. Raise Gap until the dots are as far apart as you want. (said; shown)
   - Gap: 67.0 in the example, with an 18 px stroke (shown). With the ring at the layout's size a proof build got only 25 dots from Gap 67 and needed about 60.5, the path's length divided by 28, for the layout's 28 dots; work the gap out from your own ring (inferred: found in a proof build, not said or shown)
6. A finishing touch, not part of the spoken trick: the finished ring turns on layer Rotation keyframes, one at 0 s and another around 3 s. (shown only; the end value is not shown)
   - Rotation at first key: 0x+0.0° (shown)
layout: dot ring: 28 dots, outer diameter 0.29 of the comp's width and 0.52 of its height (a true circle), centre at 0.50 across, 0.51 down; each dot about 0.009 of the width across; dot centres about 0.033 of the width apart along the ring; word inside: about 0.085 of the width wide, cap height about 0.048 of the height, centred at 0.50, 0.50 (all measured on a still of the result, shares of the whole comp: the viewer shows the full 16:9 picture at 43.2%)
timing and easing: The finished example turns through layer Rotation keyframes: 0° at 0:00 and a second key at about 3 s (the timeline marker sits near 03:06f in a 23.976 fps comp, shown). The end angle and ease are not given.
variations: The narrator says it works on any line or stroke, straight or a shape outline (said). The gap sets the spacing (said).
pitfalls: none given
build notes: By script: on the stroke group ("ADBE Vector Graphic - Stroke") set "ADBE Vector Stroke Width" to 18 and "ADBE Vector Stroke Line Cap" to 2 (Round Cap). Under "ADBE Vector Stroke Dashes" add "ADBE Vector Stroke Dash 1" (value 0) and "ADBE Vector Stroke Gap 1" (value 67); an "ADBE Vector Stroke Offset" is optional. Check these match names on the build machine before relying on them. The ellipse comes from "ADBE Vector Shape - Ellipse"; leave the fill out or switch it off. To animate, keyframe the layer's "ADBE Rotate Z". The dot count is the path length divided by the gap, so pick a gap that divides the circumference evenly or the dots will bunch where the path closes. That last point is inferred, not shown.
unknowns: The ellipse size. The ring fills roughly a fifth of the comp's width in the viewer, but no size is given. The second Rotation keyframe's value and its ease. The text and background treatment around the ring, which a separate glow layer makes and the tip does not cover. Whether an even dot count was chosen on purpose.

## Arc with a dot at each end
id: 02-line-with-end-dots
revision: 1571ddbc
job: relate-things; support: point-at-detail
status: proven (accepted 2026-11-14)
what it does for a beat: A thin line or arc with a round dot at each end, built inside one shape layer, for orbit segments, connector lines, data callouts and ring loaders.
what it looks like: Three thin white arcs, each with a small round white dot at both ends, sit evenly around a short white word on near-black. Together they nearly close a circle and they move in the finished piece.
ingredients:
- Shape layer holding the dotted ellipse from technique 01 (Dash 0, round cap) — built-in
- A second ellipse group with a plain, undashed stroke in the same shape layer — built-in; Add > Ellipse, or a copy of the group
- Trim Paths — built-in; Add > Trim Paths
- Null object as a parent for several copies — built-in
steps:
1. Start from a shape layer whose ellipse has a dotted stroke, as in technique 01. (inferred; the narration gives no values for the dot group; the values below are shown)
   - Stroke Width: 18.0 (shown)
   - Line Cap: Round Cap (shown)
   - Dash: 0.0 (shown)
2. In the same shape layer, add a second ellipse group with a solid stroke, so there is a thin line on the same path. It sits above the dotted group: "Ellipse 2" above "Ellipse 1". (said; shown)
   - Stroke Width: 3.0 (shown; the timeline shows it changed from 18)
   - Line Cap: Round Cap (shown)
   - Dashes: none, so the line is solid (shown, viewer)
   - Composite: Below Previous in Same Group (shown)
3. Add Trim Paths inside the solid line's group, from the Add menu, and shorten the line to an arc. (said; shown, menu open)
   - Start: 77.0% (shown; dragged up from 70%)
   - End: 100.0% (shown)
   - Offset: 0x+0.0° (shown)
   - Trim Multiple Shapes: Simultaneously (shown)
4. On the dotted group's stroke, drag Gap up until only two dots are left, one at each end of the arc. (said; shown) Why it works: dots fall at the start of the path and then every Gap pixels along it, so a long enough gap leaves one dot at the path start, where the trimmed arc ends, and one more where the arc begins. (inferred; fits it, with one dot at 12 o'clock and one at about 9 o'clock)
   - Gap: 1136.3 (shown, cropped from the full frame in; the screen reader caught 164.3 mid-drag)
5. The finished design repeats this on three layers, parented to one null, laid out around the centre. (shown, layer list; viewer; how they were offset is not shown)
layout: arcs: three arcs of one circle, diameter about 0.27 of the comp's width and 0.47 of its height, centre at 0.50 across, 0.50 down; each arc spans about 82° with gaps of about 32°, 44° and 38° between them, in that order going counter-clockwise from the 32° gap at the top (which lies between about 77° and 110° from the right); line about 0.002 of the width thick; end dots about 0.010 of the width across, roughly four to five times the line width; word in the middle about 0.086 of the width wide, centred at 0.50, 0.50 (all measured on a still of the result, shares of the whole comp: the viewer shows the full 16:9 picture at 43.2%)
timing and easing: none given. The finished arcs move in the result, but no keyframes are shown.
variations: The narrator says it lets you make your own line shapes quickly. The same set-up should work on any custom path, not only ellipses (said).
pitfalls: none given
build notes: By script: in one shape layer, make two groups on the same ellipse ("ADBE Vector Shape - Ellipse" with the same size). Group A, the dots: "ADBE Vector Graphic - Stroke" with width 18, Line Cap 2 (Round), and under "ADBE Vector Stroke Dashes" a "ADBE Vector Stroke Dash 1" of 0 and a "ADBE Vector Stroke Gap 1". Group B, the line: stroke width 3, Line Cap 2, no dashes, plus "ADBE Vector Filter - Trim" inside the group with "ADBE Vector Trim Start" 77 and "ADBE Vector Trim End" 100. Work out the gap rather than eyeballing it (inferred). The second dot must land where the trimmed arc begins, so Gap = (Start% / 100) × the ellipse's circumference: for a circle of diameter d, Gap ≈ 0.77 × π × d. Work it out from the real ellipse size in your build. Do not copy 1136.3: that value implies a circle about 470 px across, but the circle in the viewer measures roughly 400 comp px (63.3% zoom), so the layer may be scaled or the path may differ. Treat the diameter as unknown. Check the path direction too: an After Effects ellipse starts at the top and runs clockwise, so 77–100% is the arc from just above 9 o'clock to 12 o'clock (inferred, consistent). Check the match names on the build machine.
unknowns: The ellipse size (the inferred 470 px does not match the roughly 400 px measured on screen). How the second group was made (a new ellipse or a copy with the dashes removed). How the three arc layers are rotated or offset around the null, and what animates them in the result. The arc colours and glow, if any. The dash settings on the dot group beyond Dash and Gap.

## Text carousel from rotated copies around one pivot
id: 04-carousel-by-rotation
revision: 3a03f5d0
job: list-items; support: reveal-headline
status: proven (accepted 2026-11-14)
what it does for a beat: Builds a wheel of repeated words (or any layer) curving around an off-screen pivot. Use it for list reveals, title wheels and "rolodex" type moments without expressions or plugins.
what it looks like: A stack of short bold phrases in pale mint on a near-black background, fanned out along an arc that bulges to the right of frame. Each phrase is a copy of one text layer turned a few degrees further than the one above it, so the words follow the curve of a large ring whose centre sits far to the left of the words.
ingredients:
- Text layer (or any 2D layer) — built-in
- Pan Behind (Anchor Point) tool — built-in; toolbar (shown, tool highlighted)
- Duplicate layer (Edit > Duplicate, Ctrl/Cmd+D) — built-in (duplicating is said; the command used is inferred)
- Ctrl+Alt (Windows) / Cmd+Option (macOS) drag on a property value with several layers selected — built-in; spreads the change across the selected layers in layer order (said)
steps:
1. Start with one text layer, e.g. a two-word phrase set in a bold sans, light mint on a dark background (shown).
   - Font: a bold geometric sans; the Character panel shows Plus Jakarta Sans Bold (shown)
   - Rotation: 0x+0.0° (shown)
2. Move the layer's anchor point to the spot that should be the centre of the wheel — here well to the left of the words, at about the same height (said; shown — anchor crosshair sits roughly a third of the frame width left of the text). With the Pan Behind tool the text stays in place while the anchor moves (inferred from the tool shown and text not moving).
3. Duplicate the layer as many times as you want items in the wheel (said). In the example there are 55 copies, numbered up to 55 in their names (shown).
4. Show Rotation on every copy and select all the copies (shown, every layer has Rotation twirled open; pressing R with all layers selected is inferred, the keystroke is not shown).
5. Hold Ctrl+Alt (Cmd+Option) and drag the Rotation value of the top selected layer. The top layer stays at 0° and each layer below gets a further equal step, so the copies fan out around the anchor (said; shown).
   - Rotation step while dragging: about −7.8° (shown), then −6.3° (shown); it settles at −6.5° per layer (shown : 0, −6.5, −13.1, −19.6, −26.1, −32.7, −39.2, −45.8, −52.3, −58.8)
   - Direction: negative values, so each lower layer is turned further counter-clockwise (shown)
6. Adjust the drag until the gap between neighbouring copies looks even; the top copy stays at 0°, so 55 copies make 54 steps, and at about 6.53° the ring spans roughly 353°, close to a full turn (inferred).
layout: word wheel: words stacked on the right half, their left ends from about 0.50 to 0.57 of the comp's width, bowing furthest right at the middle word, which is level (centred 0.50 down); the left ends follow an arc of radius about 0.48 of the width (0.85 of the height) whose hub sits inside the comp at about 0.09 across, 0.50 down (fitted from the row spacing, which grows from about 0.11 of the height at 0.63 across to about 0.145 at 0.80 across with the 6.5° step); about ten words show at once, about 0.10 of the height apart at their left ends, tilting more the further they sit from the middle (about 20° at the top and bottom edges); middle word about 0.32 of the width wide, cap height about 0.066 of the height; title block on the left from 0.04 to 0.49 of the width, centred 0.49 down (all measured on a still of the result, shares of the whole comp: the viewer shows the full 16:9 picture at 43.2%)
timing and easing: none given for the build. The finished example rotates the wheel so words scroll past (shown, words move between frames); the copies there are parented to a null (shown, Parent column), but how that null is animated is not shown.
variations: The same Ctrl+Alt (Cmd+Option) drag also offsets layers in time (said; see recipe 05). In the finished example each copy carries a different word and a small index number (shown), not the same phrase.
pitfalls: none given
build notes: By script: set `layer.transform.anchorPoint` to the pivot in layer space (and compensate `position` so the text does not move), duplicate with `layer.duplicate()` N−1 times, then for the i-th layer from the top set `transform.rotation` = −i × step (step ≈ 6.5°, or 360 / N for a closed ring). The Ctrl/Cmd+Alt proportional drag itself is an interface gesture and cannot be scripted; the loop reproduces its result. To spin the carousel, parent all copies to a null placed at the pivot and keyframe the null's Rotation (inferred from the parenting shown).
unknowns: exact pivot coordinates and comp size; font size; text colour value; how the finished carousel is animated (null rotation keyframes, speed, easing); whether the comp in the build is 1920×1080 (the comp runs at 60 fps, shown).

## Graphics riding a spinning real object
id: 03-graphics-orbit-a-real-object
revision: aa669c47
job: list-items; support: keep-it-alive, make-concrete
status: proven (accepted 2026-11-16)
variant of: 04-carousel-by-rotation
differs: the same mechanism as the parent: copies of one layer, each turned a fixed step further about an anchor point moved onto a shared pivot, with the ring spun by parenting it to a rotating parent. Pivot: here the centre of a photographed round object, below the frame (about 1.21 of the picture height down); in the parent an empty point inside the frame, left of the words. Copies: here twelve at 30 degrees, each a whole card (photo in a matte plus caption) gathered under its own master layer, duplicated and turned +30 degrees one at a time; in the parent 55 copies of one text layer at -6.5 degrees, spread in one drag across all selected copies. Both make about a full turn; the step is a design choice (card width against word height). Spin: here every master is parented to the object, which turns by a time expression (time * -20); in the parent the copies are parented to a null whose animation is not shown (rotation keys inferred).
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
1. Comp 1920 x 1080, 23.976 fps, 15 s, with a flat pale background layer. (shown, project panel)
   - Background: very pale cyan-white, about RGB 236–239, 238–250, 242–251 (measured on a frame cut from source)
2. Place the wheel photo so that only its upper half shows: its hub sits below the bottom of the frame, centred left to right. (shown)
   - Anchor Point on the hub: 3157.7, 2236.2 in the photo's own pixels (shown; this value belongs to that image, so put the anchor on your own object's centre)
   - Position: 974.0, 1316.5; Scale: 37.0 % (shown)
3. Spin the wheel with an expression on Rotation: Alt/Option-click the stopwatch and type `time*-20`. (said; expression shown)
   - This turns it 20° per second, anticlockwise on screen (negative). (inferred from the expression and shown on the result: the valve stem moves about 28° in 1.45 s, top moving left, see layout)
4. Build one card upright, centred above the wheel: a portrait photo on top and a white caption tab below it holding two lines of dark text (a bold name and a lighter role) with a short rule above them. Make the white tab the master and parent every other part of the card to it. (said "parent everything to one master graphic"; shown, all parts parented to the tab)
   - Card parts as shown: the photo, a hidden shape used as its matte (eye off), two text layers, a short line shape, one more shape, and the white tab as master (shown)
5. With the master selected, take the Pan Behind (Anchor Point) tool and drag the master's anchor point down onto the wheel's hub. (said "move the anchor point ... to the center of the rotation"; tool highlighted and anchor at the card centre in a frame cut from source; anchor dragged below the frame onto the hub, cut from source)
6. Select the whole card (master and its children) and duplicate it; the copy's children follow the new master. Give the new master Rotation +30°. (said "duplicate my work and offset the rotation"; shown : copy rotated 0x+30.0°, swung clockwise to the right of the first card)
7. Repeat until the cards go all the way round: 12 masters at 0°, 30°, 60° … 330°. (said "revolve around the entire wheel"; lists masters up to the twelfth; the intermediate angles are inferred from 12 x 30° = 360°)
8. Select all twelve masters and parent them to the wheel layer, so they turn at exactly its speed. (said; Parent & Link column shows the wheel for every master)
layout: Measured on a frame cut from source (picture 1560 x 876 px in the full frame, x 826–2386, y 324–1200). Shares are of the picture height H unless marked W.
- Wheel: hub at 0.51 W across and 1.21 H down (below the frame; the shown Position 974, 1316.5 gives 0.507 W, 1.219 H). Outer tyre radius about 0.62 H, so about the top 0.41 H of the wheel shows above the bottom edge. Tyre black, rim silver, thin spokes, one dark valve stem on the rim (measured with a circle fit to the tyre's top edge).
- Cards: about 0.30–0.34 H wide and about 0.40 H tall. The photo takes the top 70 % of the card, with one rounded corner (top right, from its matte); the white tab takes the bottom 30 %. Behind each card a faint paler panel shows, offset up and to the left, and it cuts across the photo's top-left corner. It is roughly the card's size, offset about 0.02–0.03 H, and reads as white at roughly half opacity (estimated by eye). It most likely comes from the card's extra shape layer, the one stacked above the short line (inferred). Card centres sit about 0.89 H from the hub, and the inner (tab) edge about 0.68 H from it, which leaves a gap of about 0.06 H above the tyre (0.10 H in the static frame). Measured.
- 12 cards at 30° spacing. Each is rotated so its bottom faces the hub, like spokes. Five show at once along the upper arc, plus at some angles a sixth cut off at a lower corner (from a sliver to about half a card); the outer ones are cut off by the left and right edges (measured: counted on frames cut at 123.10,: 6, 5 and 6 pieces, the sixth always a corner piece).
- No shadows, no overlap between cards, flat background. In the build every card holds the same photo and caption.
- Motion: the wheel and cards turn together anticlockwise on screen (the valve stem and the cards move left across the top between). 20° per second gives a card speed of about 0.31 H per second at the card centres. Nothing else moves.
- The opening clip of this chapter is a different, pre-made comp: five or more cards, each with a different person and name, on the same kind of wheel. There the cards are parented through a null rather than to the wheel, and the soft drop shadows come from technique 05. It also turns anticlockwise.
timing and easing: Constant speed from the expression (−20° per second, linear); no keyframes.
variations: Any set of graphics can ride any real object that turns; the motion of the object motivates the graphics. (said)
pitfalls: none given
build notes: Wheel: set `rotation.expression = "time*-20"`, anchor point on the hub (for a centred PNG, `[w/2, h/2]` of the source if the wheel is centred in it), position [974, 1316.5] in a 1920 x 1080 comp, scaled so that the tyre radius is about 0.62 x 1080 ≈ 670 px. Card: make the white tab a shape layer and parent the other parts to it. Set the tab's anchor so that it lands on the hub (anchor = hub's comp position converted into the tab's layer space; with an unrotated, unscaled tab at position P and anchor A, set anchor = A + (hub − P) and position = hub). Duplicate the group 11 times by script (`layer.duplicate()` for the master and each child, then re-parent each child copy to its new master) and set the masters' rotation to 30·i. Parent the masters to the wheel last: setting `.parent` by script keeps their look at the current time, so do it at time 0, where the expression gives 0°, to keep the layer values clean.
unknowns: The card's own sizes in pixels, its fonts, the photo matte's corner radius, the pale backing panel's size and opacity (read here only from the picture). The rotation values of copies 3–12 (inferred 60°…330°). Whether the master's tab or the photo is centred on the radius. What the adjustment-style layer at the top of the stack does, and what effects the wheel layer and the background carry (fx switches on; no shadow or grade is visible in the result). The mouse pointer is inside the picture throughout the result window, so no fully clean frame exists; it sits just left of the top card's caption tab.

## Chained copies of a swinging card, placed with a helper null
id: 04-duplicate-cards-round-the-pivot
revision: fafb7596
job: list-items; support: keep-it-alive
status: unproven
variant of: 04-carousel-by-rotation
differs: the same mechanism as the parent: copies of one layer, each turned one fixed step further about a single shared pivot, so they fan out round a wheel (parent steps 2–5, the source video.md L168–L173), with the copies of the finished wheel parented to a null (L176; that the wheel is spun by keying that null is inferred, L180). What is copied: here a whole card set (matte shape, photo, headline, tags, boxes, logo: eight layers), each copy's children still parented to its own copied matte (step 1); in the parent one text layer, 55 copies (L169). Pivot: here the anchor of the null the card hangs on, inherited from 02 (ingredients); in the parent each copy's own anchor point, moved to a spot well to the left of the words at about the same height, the text staying put (the Pan Behind tool is inferred there) (L168); the hub sits at about 0.09 across, 0.50 down, inside the title block's 0.04–0.49 (layout, L175). Step: here 34°, one swing step, set by duplicating the pivot null, deleting its keys and expression, rotating that static copy to +34°, parenting the copied matte to it and then re-parenting the matte to the looping null, which folds the step into the matte's own rotation (+57° on its first key) (steps 2–6); in the parent −6.5° per layer, spread over all the selected copies in one Ctrl+Alt (Cmd+Option) drag on Rotation (L171–L172). Count: here six cards, a count inferred from the layer numbering (step 8); 55 in the parent (L169). Motion: here every copy rides the main null's looping step rotation from 02, and the copy's Scale and Rotation keys from 03 are slid later so its tilt-and-shrink fires as it reaches the top: one full cycle (24 f) for the first copy, shown, and k × 24 f for copy k in the build notes, the other copies' offsets not shown (steps 7–8, build notes); in the parent the finished wheel turns, words scrolling past, and its copies are parented to a null, but how the wheel is animated is not shown (L176, L183; that the null carries the turn is inferred, L180), and nothing is offset in time. Media: here each copy's photo is replaced by dragging an image from the Project panel onto its media layer, then rescaled (31–36 %) to fill the card (steps 9–10); in the parent the finished example gives each copy a different word and a small index number (L177).
what it does for a beat: Turns one looping swing card into a carousel of several cards that follow each other round the same pivot, one swing step apart, so a new card always arrives as the previous one leaves. Reach for it for product, photo or profile carousels where each beat shows the next item.
what it looks like: A cream background with one upright rounded photo card (a woman in a cap over a red text panel with a two-word headline and two pill tags) held in the centre, while smaller copies lean in from the lower right and fall away to the lower left on the same arc; after the media swap the copies carry different photos.
ingredients:
- The swinging card from 01-rounded-shape-matte-media-card, 02-pivot-null-swing-loop and 03-tilt-and-shrink-on-swing (matte card with its media, text and graphics parented to it; matte parented to a pivot null whose Rotation is keyed 0 f +34°, 17 f 0°, 24 f 0° with loopOut("offset"); matte Scale/Rotation keyed 0, 17, 24, 41 f)
- Duplicate (Edit > Duplicate) — built-in; menu path or shortcut not shown (inferred)
- A second null object used only as a placement helper — built-in
- Parent & Link column — built-in (shown)
- Replace layer source by dragging an image from the Project panel onto a selected layer — built-in; modifier key not shown (inferred)
steps:
1. Select every layer of the card (matte, media, logo, headline, tags and boxes) and duplicate them, so a second card set exists whose children are parented to the copied matte (said "duplicate all four elements"; shown : copies named with a "2", children parented to the copied matte, copied matte still parented to the main null)
   - The narration says four elements; the screen shows eight card layers duplicated (logo, two tag texts, two boxes, headline, image, matte). Screen wins.
   - The copied set lands directly above its source set in the layer stack (shown in a, Matte-2's set at layers 3–10 above Matte-1's set at 11–18); each later copy goes above the one before, so Matte-6's set ends up at the top (shown). This order decides the overlaps: a later card is drawn in front of an earlier one (see `layout`). Keep it when building
2. Duplicate the main pivot null once (said; shown : a second null at the top of the stack, still carrying the rotation keys)
3. On the duplicated null, delete the Rotation expression and keyframes so it is static (said; shown : stopwatch off, Rotation 0x-0.0°)
4. Parent the copied matte to the duplicated null (said; shown : copied matte's parent reads the second null)
5. Rotate the duplicated null by the same angle as one swing step of the main null, so the copy moves one step round the arc (said "the same amount" as the initial rotation; shown)
   - Rotation: 0x+34.0° (shown; the drag passes +35° and settles at +34°)
   - With Null 1 at 0° the copy now leans in from the lower right while the original stands upright (shown)
6. Re-parent the copied matte to the main (looping) null (said; shown : copied matte's parent reads the first null). The helper null is left in the comp, unparented and unused (shown)
   - After re-parenting, the copied matte's first Rotation key reads 0x+57.0° (shown) — the original +23° lean from 03 plus the helper's +34° folded in by the parenting (inferred sum)
7. Slide all of the copied matte's Scale and Rotation keyframes later in time so its tilt-and-shrink fires when the copy reaches the top, one cycle after the original (said "offset" the keys; the narration says position and rotation, the screen shows Scale and Rotation being dragged — screen wins; shows the keys while the drag is still going, tooltip visible; landed positions shown in a)
   - Offset: about 24 f (one full cycle of the null) — first key moved from 0 f to 1:00 (24 f at 23.976 fps); keys now at about 24, 41, 48 and 65 f (measured on the ruler in the cut; is mid-drag)
8. Repeat steps 1–7 to add more cards until the arc is filled (said "continue the process"; shown : mattes numbered 4, 5 and 6 in the visible part of the stack, each parented to the main null, children of each parented to their own matte; also lists a matte numbered 3; six cards in all inferred from the numbering, no frame lists all six at once)
   - Per-copy helper rotations and key offsets for cards 3–6 are not shown
9. To change a card's photo, select its media layer in the timeline and drag a new image from the Project panel onto it so the layer keeps its parent and matte (said; shown : media layer selected while an image is dragged from the Project panel; : the media layers now show different image files with the same parents)
10. Resize and reposition the new image to fill the card (said; shown)
   - Scale on the swapped images: 31.0%, 35.0%, 36.0% (shown; each value depends on the source image size)
layout: background the flat cream solid of 01 (RGB about 247,244,237); cards flat with no shadow, as in 01. At the result frame two cards show: the first card (the original) nearly upright in the centre, about 29% of the picture width and 67% of the picture height, top edge about 17% and bottom edge about 85% down (measured on a still of the result; it is still finishing its rise, upright), and the first copy at the lower right, its centre about 78% across and 78% down, at 68% scale and leaning about +57° (position measured; scale and lean from 03 and step 6; its left edge rises at about 33° from horizontal, which agrees). The left slot is empty at that moment because no card comes before the first one; it fills from the second step on: the cards are still mid-step (the first copy tilted and rising towards the centre, the original still travelling to the lower left, a third card entering at the lower right), and they have settled: the original at the lower left, partly cut by the bottom edge, the first copy upright in the centre, the third card at the lower right (cuts at 213.3,:, each cropped 626,289,1308,736). Stacking: each later card is drawn in front of the one before it, so the incoming card at the right covers the centre card's lower-right corner, and the outgoing card at the left sits behind the centre card, whose lower-left corner covers its upper-right corner (shown in those cuts; it follows from the layer order in step 1). Each card carries its own photo after the media swap (steps 9–10): the centre card a woman in a green cap, the incoming one a man in a dark jacket, the next a woman in a beige cap. Motion: right to left; the cards hold through the null's 7-frame key hold (comp frames 17–24 of each 24-frame cycle), which reads as about 12–15 still comp frames because of the long eases either side, then all step together one slot to the left, each card's centre moving about 27% of the picture width, almost all of it in about 5 comp frames, about frames 29–33 of the second cycle (in the recording, where the preview runs at about real time), peaking at about 1.5 picture widths per second (as measured for 02); a card grows to full size and stands upright as it reaches the centre and shrinks and leans outward as it leaves (03)
timing and easing: 23.976 fps; main null keys 0 f +34°, 17 f 0°, 24 f 0° with loopOut("offset") (from 02); each copy's matte Scale/Rotation keys shifted later by one 24-frame cycle per step (shown for the first copy only); eases as set in 02 and 03
variations: swap in any picture or video per card (said); "continue the process" for as many cards as wanted (said)
pitfalls: none given
build notes: by script — duplicate the card layers with layer.duplicate() (re-point each child's parent to the new matte; AE does this when the matte and its children are duplicated together). Easiest equivalent of the helper-null trick: for copy k, set its matte parent to the main null and add k×34° to every Rotation keyframe value of the copied matte (ADBE Rotate Z), then shift every Scale and Rotation key by k×24 frames (k×24/23.976 s) — read each key's time/value, removeKey, setValueAtTime at the new time, re-apply ease. Or reproduce literally: addNull(), set its anchor/position equal to the main null's, Rotation = k×34, matte.parent = helper, then matte.parent = mainNull (AE folds the helper rotation into the matte's transform). Media swap: mediaLayer.replaceSource(newFootageItem, false), then set Scale to fit. Note that keys shifted later leave the copy at its first-key state before 24 f; the video does not show a loopIn or pre-roll.
unknowns: how cards 3–6 were placed (helper rotations of 68°, 102°… or −34° are not shown) and their key offsets; whether the helper null is deleted later; the modifier key used for the media swap (Alt/Option-drag inferred); position values of the swapped images; total card count in the final comp beyond the six mattes listed; comp length. The result window is just after the span end (the playback, before the template advert) because no clean in-span frame shows the finished carousel; frame is a cut from the source video, not a kept frame.

## Soft word-by-word rise-and-fade text reveal
id: 18-smooth-text-reveal
revision: 8c8e30dd
job: reveal-headline
status: proven (accepted 2026-11-14)
what it does for a beat: Use for a headline or tagline that should arrive gently, words sliding up and fading in one after another with a smooth overlap, with no per-word keyframes.
what it looks like: A two-line bold sans headline in near-black on an off-white background; words rise a short distance and fade from grey to solid left to right, each overlapping the next (: the first three words solid, the fourth still pale and low). The fan of photo cards above, the underline under one word and the small button below are separate layers with their own animations (shown, separate layers parented to a null), not part of this technique.
ingredients:
- Text animator with Position and Opacity — built-in; text layer > Animate > Position, then Animator 1 > Add > Property > Opacity (said; shown)
- Range Selector Advanced options — built-in (shown)
steps:
1. On a text layer add a Position animator (said; shown, Animator 1 with Position)
2. Add Opacity to the same animator via its Add menu (said; shown, cursor on Add)
3. Push the animator's Position down and set its Opacity to 0% (said)
   - Position: 0.0,115.0 at first (shown), later changed to 0.0,75.0 (shown; not said)
   - Opacity: 0% (said; shown)
4. Open Range Selector 1 > Advanced and set:
   - Based On: Words (shown; not said)
   - Units: Percentage, Mode: Add, Amount: 100% (shown, left at default)
   - Shape: Ramp Up (said; shown)
   - Ease High: -50% (said "like -50"; shown)
   - Ease Low: 100% (said; shown)
   - Randomize Order: Off (shown)
   - Start 0%, End 100% left at default (shown)
5. Keyframe Range Selector Offset from -100% to 100% (said)
   - Offset: -100% at 0:00:01:05 comp time, the layer's in point (shown)
   - Offset: 100% at 0:00:03:06 (shown)
6. Play: the words rise and fade in left to right (shown mid-reveal, finished)
   - The text layer is parented to a null (shown : parent column reads "3. Null 1"); through the reveal the whole block holds still about 11.7 % of the comp's height above its final place (first word's ink top at about 43.4 % down, against 55.2 % when finished), then drops into place in about 0.4 s as the last two words arrive, slow at first, fast, then slowing into the stop; it does not drift while the earlier words reveal (measured on, in the result crop). The parent null most likely carries this move (inferred; its keyframes are not shown)
layout: crop is the whole comp at 43.5 % (comp edges at the crop edges, measured on a still of the result); finished headline: centred on 50 % across; line 1 spans 19.9-80.1 % across (60 % of the comp's width), ink 55.2-61.9 % down; line 2 spans 32.3-68.1 % across (36 %), ink 66.3-73.1 % down; line to line 11.1 % of the comp's height (measured on a still of the result); mid-reveal: a settled word's ink is about 7 % of the comp's height tall and the word still entering sits about 3.5 % of the comp's height lower and mid grey, about half the 75 px push (measured); the whole block holds about 11.7 % of the comp's height above its final place until the last two words arrive, then drops in about 0.4 s (measured on) (all shares of the whole comp)
timing and easing: Two Offset keyframes, -100% at comp frame 29 (0:00:01:05) and 100% at frame 78 (0:00:03:06) in a 23.976 fps comp, about 49 frames / 2.0 s (shown). Both keyframes are linear diamonds (shown, cropped); the softness comes from Ramp Up plus Ease High/Low, not from keyframe easing (inferred). The block's separate drop runs from about 383.2 in the source, over the last two words (measured).
variations: none given
pitfalls: none given
build notes: Text layer > Text > Animators: addProperty("ADBE Text Animator"); in its Properties add "ADBE Text Position 3D" (0,75) and "ADBE Text Opacity" (0). Range selector "ADBE Text Selector": Advanced > "Based On" = Words (3; menu order Characters 1, Characters Excluding Spaces 2, Words 3, Lines 4; from memory, verify in After Effects), "Shape" = Ramp Up (2; from memory, verify in After Effects), "Ease High" -50, "Ease Low" 100; keyframe "Offset" -100 → 100 with linear interpolation. All settable by script.
unknowns: whether Position 115 or 75 was the intended final value (75 is what the end state shows); font size and font (two different fonts appear in the character panel across frames); whether the author also changed anything on the layer's own transform; the parent null's keyframes and easing (not shown; the hold about 11.7 % high and the drop of about 0.4 s are measured, see step 6).

## Letters tumble in from just in front of the lens, one after another
id: 05-per-character-3d-fly-in-ramp-up
revision: 95094a0c
job: reveal-headline; support: add-impact
status: unproven
variant of: 18-smooth-text-reveal
differs: the same mechanism as the parent: one text animator carrying a Position offset and a second property, its Range Selector 1 Offset keyed from −100 % to 100 %, with Advanced > Shape Ramp Up and Ease Low 100 %, and Units Percentage, Mode Add, Amount 100 %, Start 0 % and End 100 % left as they are (parent steps 1–5, the source video.md L685–L700). Second property: here Rotation with Enable Per-character 3D on, X 0°, Y 76°, Z 79° (steps 1–2); in the parent Opacity 0 % (L689). Position: here 0,0,−530, then 0,−35,−530, a negative Z that starts each letter between the word and the camera and lifts it clear of the floor (steps 3, 8); in the parent 0,115, then 0,75, a drop below the line (L688). Based On: here Characters (step 5); Words in the parent (L691). Ease High: here 0 %, left at its default (step 6); −50 % in the parent (L694). Order: here Randomize Order On, Seed 0, as an option (step 9); Off in the parent (L696). Keys: here 0:00:00:00 to 0:00:04:01, the second key dragged later from about 2.84 s, both made Easy Ease (steps 4, 7, 10); in the parent 0:00:01:05 to 0:00:03:06 (L699–L700), linear diamonds (timing, L704). Scene: here extruded, textured 3D letters in a lit Advanced 3D scene, each dragging its own shadow across the floor as it flies (ingredients); in the parent a flat two-line headline on off-white (L680), its layer parented to a null, and the whole block drops into place, most likely on that null (inferred in the parent, L702; the null's keyframes and easing are unknown, L711).
what it does for a beat: A smooth, weighty title entrance for extruded 3D type: each letter starts turned and in front of the lens, then swings into place in a rolling wave, so the word assembles itself without any hard pop.
what it looks like: The frame starts as plain sky; tumbling, rust-textured letters arrive one at a time, each first seen large and close to the lens and spun on two axes, and each shrinks back into its place on the floor with its shadow under it. With random order on, the letters arrive out of sequence: the fourth and fifth letters come in through the right edge, the second drops in from above, the third swings in over the right half, and the first comes in last through the left edge.
ingredients:
- Text animator with per-character 3D (Animate > Enable Per-character 3D) — built-in; shown
- Animator properties Rotation (X, Y, Z Rotation) and Position — built-in; Animate menu shown, Add property menu shown
- Range Selector 1 with its Advanced group (Shape, Ease High, Ease Low, Randomize Order) — built-in
- The lit scene the animation plays in, already built before this span (top to bottom: a point light, a parallel light, an environment light, the text, a floor solid, a backdrop solid) — built-in. Its figures, so this recipe stands alone:
  - Comp 1920x1080, 23.976 fps, Advanced 3D renderer (the renderer, extrusion, bevel and rust-and-pale-blue texture material come from 01); seen through the default active camera in this span, through 06's camera in the result
  - Text: one word of five capitals, Character panel Poppins Black, 100 px, Tracking 17 with the text layer selected (shown). The tracking was 0 at the end of 04 (where two letters touch) and is changed off screen between the two spans: set it to 17 so the letters stand with small gaps and do not collide as they tumble (shown; the word is about 2–3% of the picture wider here than in 04 under the same default camera, 76% against 74% of the width: measured). Layer transform: Anchor Point 151.4,-35.7,0.0, Position 960,540,0, Scale 472% (shown)
  - Backdrop (02): a 2D comp-size solid, pale sky blue RGB about 181,231,252 (#B5E7FC), at the bottom of the stack
  - Floor (02): a duplicate of the backdrop made 3D, X Rotation 90°, Position 960,721,0, Scale 627%, Material Options > Accepts Shadows: Only, so it keeps the backdrop colour and shows only shadows; before the first letter arrives the frame is flat sky with no visible floor (measured:, grey 221 everywhere)
  - Environment light (02): Intensity 187%, Casts Shadows On, Shadow Darkness 100%, X Rotation -25°, Y Rotation keyed linearly 235° at 0:00:00:00 → 195° at 0:00:04:23; this backlight casts every letter's shadow toward the camera, so each flying letter drags its own soft shadow across the floor
  - Parallel rim light (03): Position 2920,-100,2663.3, Point of Interest 960,540,0, Casts Shadows Off, Intensity 216%
  - Point fill light (04): Position 456,530,-666.7, Intensity 100%, Falloff Smooth, Radius 589, Falloff Distance 373, Casts Shadows Off; it brightens the first letter's face by about two-fifths
  - the three lights keep the values they had at the end of 04 (no change to them is shown between the spans: inferred)
steps:
1. Twirl open the text layer, from Animate, choose Enable Per-character 3D (said "enable per character 3D"; shown menu open, ticked)
   - Note: the same Animate menu in this version also lists Front, Bevel, Side and Back submenus (greyed here) beside the usual properties (shown)
2. From Animate add Rotation; with per-character 3D on it brings X Rotation, Y Rotation and Z Rotation (said "add like a rotation value"; shown hovering Rotation, animator with three rotations)
   - X Rotation: 0x+0.0° (shown)
   - Y Rotation: 0x+76.0° (shown)
   - Z Rotation: 0x+79.0° (shown)
3. Add Position to the same animator (said "add in a position"; shown property menu, Position row in Animator 1; the exact click path Add > Property > Position is inferred)
   - Position: 0.0,0.0,-530.0 — a negative Z so the letters start between the word and the camera (said "come past the camera"; shown). In scene-free terms: the animator's position is in the text layer's own space, so the layer's Scale of 472% makes -530 about -2500 comp px; with the default camera 2666.7 px from the word, each letter starts about 165 px in front of the lens, about 94% of the way from the word to the camera (inferred from the values; it is why each letter is first seen huge and cut by a frame edge)
4. Open Range Selector 1 and keyframe Offset from -100% to 100% (said; shown)
   - Offset at 0:00:00:00: -100% (shown)
   - Offset second keyframe: 100%, first set at 0:00:02:20 (shown; position on the ruler matches ~2.84 s)
   - Start 0%, End 100% left at defaults (shown)
5. Under Advanced, set Shape to Ramp Up (said "set the shape to ramp up"; shown dropdown open, landed)
   - Units: Percentage, Based On: Characters, Mode: Add, Amount: 100% (all defaults; shown)
6. Set Ease Low to 100% (said; shown)
   - Ease High: 0% (left at default; shown)
7. Make both Offset keyframes Easy Ease (said "feel free", F9 is said; shown, keyframes changed from diamonds to hourglass easy-ease icons)
8. Lift the animator's Y so the letters do not cut into the floor while they travel (said; shown)
   - Animator Position: 0.0,-35.0,-530.0 (shown; X passes through 8.0 while being scrubbed, then returns to 0.0). In scene-free terms -35 is about 165 comp px up at Scale 472% (inferred)
9. Optional: under Advanced turn Randomize Order on so letters arrive out of order (said "optional"; shown)
   - Randomize Order: On, Random Seed: 0 (shown)
10. Drag the 100% Offset keyframe later, from about 2.84 s to 0:00:04:01, to slow the whole wave down (not said; shown key at ~2.84 s, key selected at 0:00:04:01 with Offset 100%)
11. The work area end is moved along the way (about 4.3 s, about 3.4 s, about 4.1 s); it only limits the preview and does not change the result (shown)
layout: all shares are of the result crop 730,350,1510,845, which lies within 8–17 px of the viewer picture's edges (viewer x 724–2257, y 344–1206), so they are near-true comp shares through 06's camera. Comp time = real time − in this playback (measured from the red playback line in the timeline, 178 px per ruler second: 0.53 s at 334.55, 1.15 s at 335.2, 2.02 s at 336.0, 3.03 s at 337.0, so it plays at real speed). The red preview-time line is the time display that moves across the window; the timecode field stays parked at 0:00:04:23 through this playback and at 0:00:04:01 through 05's own playback (read on frames), so the parked timecode does not make the result a still.
  - named frame (comp about 1.15 s; cut from the source video), letters mid-flight: the second letter nearly in place, slightly tilted, at about 28–49% of the width and 22–69% of the height; the third letter huge, tilted and soft, swinging across about 52–89% of the width from near the top edge (2%) to 73% of the height, in front of the fourth letter; the fifth letter landed at about 79–96%; the first letter not yet in; the floor shadows under the landed letters, plus a large soft shadow at the bottom centre from the third letter (grey about 85 against the sky's 221 at 90–98% of the height) (measured by eye on the crop and by grey level, ±2%)
  - settled word, frame (comp about 2.8 s): word spans about 11%–92% of the width, centred; letter tops at about 33% and bases at about 67% of the height, so the capitals are about a third of the picture height; letters at rest at about 11–28%, 28–44%, 44–64%, 64–78% and 78–92% of the width (measured). In this technique's own framing (default camera, no push, crop 640,262,1366,764, arrow in frame) the settled word spans about 13%–89% with tops at about 33% (measured), so 06's push makes it a little larger
  - floor shadow: the word's own shadow from the environment backlight (02), toward the camera, full width. Top edge about 69% of the height under the word and 72% at the frame edges; darkest at 75–78%, about 0.35–0.5 of the sky level (grey 78–107 against 221), lightening to about 0.7 (grey 150–160) at the bottom edge (measured on columns at 3%, 50% and 97%)
  - background: flat pale sky blue RGB 181,231,252 (grey 221), no gradient (measured)
  - motion, letter by letter (Random Seed 0, same order in 05's own playback and in 06's; comp times from 06's playback; letters named by their place in the word, 1 = leftmost) (measured on frames cut every 0.1 s):
    - 4th letter first: seen at about 0.6 s entering through the right edge in the upper half, turned about 45°, moving left and down; upright by about 0.8 s at about 80–90% of the width, then creeps left into its place (64–78%) by about 1.5 s
    - 5th letter: enters through the right edge at letter height at about 0.9 s, slides left into place (78–92%) by about 1.2 s
    - 2nd letter: seen at about 1.0 s huge, through the top edge over the upper middle (about 15–65% of the width), dropping down and to the left as it shrinks; near its place by 1.2 s, settled by about 1.4 s
    - 3rd letter: seen at about 1.1 s huge over the right half (about 55–100%), swings left as it shrinks, lands at 44–64% by about 1.5 s
    - 1st letter last: enters through the left edge at about 1.3 s huge, lands at 11–28% by about 1.7 s
    - speed: each letter takes about 0.3–0.5 s from first sight to near rest; crossing the frame edge it moves at roughly the picture's width per second (the 4th letter covers about 20% of the width in 0.2 s), then slows to a crawl over its last 0.2–0.3 s; starts come about 0.1–0.3 s apart; the word is down by about 2.0 s except the first letter, which creeps the last 1% of the height until about 2.5 s (its top at 31.4% at 2.0 s, 32.3% at 2.25 s, 32.7% at 2.5 s and after: measured); nothing visible moves after that except 06's camera push (word width 82.6% at 1.7 s, 80.8% at 2.0 s, 81.5% at 3.1 s: measured)
    - every letter is seen nearest the camera first and lands upright; no letter is seen behind the word
timing and easing: comp is 23.976 fps (shown). Range Selector Offset: -100% at 0:00:00:00 → 100% at 0:00:04:01 (final; first set at 0:00:02:20), both keyframes Easy Ease (shown). The animator's own Position and Rotation values are static; only Offset is keyframed. Shape Ramp Up with Ease High 0% / Ease Low 100% gives each letter a soft landing. On screen the visible motion runs from about 0.6 s to about 2.0 s of comp time, plus the first letter's last 1% creep to about 2.5 s; the second half of the 4.04 s Offset ramp moves almost nothing that can be seen (measured; that this comes from Ease Low 100% and Easy Ease is inferred). A build whose letters are all down by about 2–2.5 s is right.
variations: the narrator says there are many ways to animate type and this is one; Randomize Order is optional (said); easy-easing the keyframes is optional (said); raise Y only if letters clip the floor (said)
pitfalls: without Ramp Up the animation does not behave correctly (said, paraphrased); letters can dip into the floor during the move unless the animator Y is raised (said)
build notes: textLayer.threeDLayer = true and textLayer.threeDPerChar = true. Animators: textLayer.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator"); in its "ADBE Text Animator Properties" add Position (ADBE Text Position 3D) [0,-35,-530], X Rotation (ADBE Text Rotation X) 0, Y Rotation (ADBE Text Rotation Y) 76, Z Rotation (ADBE Text Rotation) 79. Range Selector 1: Offset (ADBE Text Percent Offset) keys at 0 s = - (0:00:04:01 at 23.976) = 100, then setTemporalEaseAtKey with KeyframeEase(0, 33.33) on both and KeyframeInterpolationType.BEZIER. Advanced: Shape = Ramp Up (ADBE Text Range Shape), Ease High (ADBE Text Levels Max Ease) 0, Ease Low (ADBE Text Levels Min Ease) 100, Randomize Order (ADBE Text Randomize Order) 1, Random Seed 0. Confirm match names and the Shape enum index in the installed After Effects 27 before relying on them. Set the text's Tracking to 17 (TextDocument.tracking = 17). The text layer's own transform in the tutorial: Anchor Point 151.4,-35.7,0.0, Position 960,540,0, Scale 472% (shown); if the text is built at another scale, keep the scene-free start (about 165 px in front of the lens, about 165 px up) rather than the -530/-35 values. Build the lit scene listed under ingredients first. Another font or seed gives another order: compare the build letter by letter with the order in `layout` only when Seed 0 and a five-letter word are used. The animation itself is all scriptable.
unknowns: no clean result exists for this technique alone: its own playback has the mouse arrow inside the viewer in every frame once the letters appear. The result named above is 06's playback of the same entrance (frame, cut from the source video; the settled frame is saved beside it); in it the depth-of-field blur on near letters and the slight camera push come from 06, not from this technique — in 05's own playback the near letters are sharp (shown). This technique gives the letters' paths, rotations, order and timing. Comp duration and work area length beyond ~4 s are not given; Random Seed is left at 0 and no other seed is tried; whether Easy Ease came from F9 or a menu is not seen

## Text that runs round a drawn path
id: 19-text-on-a-path
revision: d8d51815
job: reveal-headline; support: keep-it-alive
status: proven (accepted 2026-11-14)
what it does for a beat: Wrap a repeated line of type round a circle (or any shape you draw) and slide it along the path, so a badge or seal of words circles a central title.
what it looks like: A short all-caps phrase repeated three times sits in a ring round a bold two-line title, white on near-black; the ring of words travels round the circle as the first margin animates.
ingredients:
- Text layer — built-in
- Mask on the text layer, drawn with the Ellipse (shape) tool or the Pen tool — built-in
- Text > Path Options (Path, Reverse Path, Perpendicular To Path, Force Alignment, First Margin, Last Margin) — built-in; in the text layer's Text group in the timeline
steps:
1. Make a single-line text layer holding the phrase repeated until it is long enough to fill the circle (shown)
   - Font: a heavy geometric sans, Black weight (shown; family name not used here)
   - Size: 35 px, later raised to 48.7 px (shown); a heavy sans at 48.7 px has capitals about 34 px tall, which is the 3.2 % of the height measured in the layout only if the comp is 1080 high (inferred)
   - Tracking: 125 (shown)
   - Fill: white character colour (shown); the layer also carries a Fill effect set to white (shown, Effect Controls)
2. With the text layer selected, draw a closed circular mask on it with the Ellipse tool; the Pen tool works for a custom shape (said; ellipse tool active shown, circle mask shown)
3. Open Text > Path Options and set Path to the mask (said; shown). The type now wraps the circle, letters perpendicular to the path (Perpendicular To Path On, shown; that On is the default is inferred)
4. Set the mask's mode to None so it no longer cuts the layer (shown : Mask 1 mode None)
5. Resize the text so the phrase fills the circle without overlapping (said; size raised to 48.7 px, shown). In the result the three repeats stop short of filling it and leave the gaps given in the layout (measured on a still of the result)
6. Turn Reverse Path On if the type sits inside or reads the wrong way round (said; Reverse Path On shown; after it the letters stand on the outside of the ring reading clockwise)
7. Animate First Margin to make the type travel round the path (said; shown)
   - First Margin keyframe 1: 0.0 at 0:00:00:00 (shown)
   - First Margin keyframe 2: 512.0 at 0:00:03:01 (shown; comp is 23.976 fps)
   - Force Alignment: Off, Last Margin: 0.0 (shown)
8. A separate bold two-line title layer sits in the centre of the ring; it is example content, not part of the technique (hidden, visible: shown)
layout: ring of type: outer diameter about 43% of the comp's width and 76% of its height, i.e. a circle about 0.76 of the comp height across (measured on a still of the result, shares of the whole comp: the viewer is at 43.5% zoom with the comp's edges at the panel's edges, and the result crop covers about 97% of the comp's width, missing a sliver at the right); ring centre at about 50% across, 50% down (measured, same frame, shares of the whole comp); ring letters about 3.2% of the comp's height tall (about 0.042 of the ring's diameter), three repeats of the phrase with gaps of about 12 to 15.5 degrees between them, four to five times the word-spaces of about 3 degrees (measured, same frame, shares of the whole comp); centre title block about 25% of the comp's width by 24% of its height, centred at about 51% across, 51% down, tilted about 10 to 13 degrees anticlockwise (measured, same frame, shares of the whole comp)
timing and easing: First Margin 0 to 512 over about 3 s (0:00:00:00 to 0:00:03:01 at 23.976 fps); no ease given (keyframes look linear, inferred from the diamond icons).
variations: Path can be any mask drawn with the shape tools or the Pen tool (said).
pitfalls: none given (inferred: leaving the mask on Add hides everything outside the circle, which is why it is set to None).
build notes: Script: add a text layer; layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom") with an elliptical Shape (four vertices with tangents), maskMode = MaskMode.NONE. Then layer.property("ADBE Text Properties").property("ADBE Text Path Options"): "ADBE Text Path" = mask index (1), "ADBE Text Reverse Path" = 1, "ADBE Text Perpendicular To Path" = 1, "ADBE Text Force Align Path" = 0, "ADBE Text First Margin" setValueAtTime(0, 0) and setValueAtTime(3.04, 512). Tracking and size via TextDocument (tracking 125, fontSize 48.7). Everything is scriptable.
unknowns: exact phrase length/number of repeats needed; circle diameter not given (measured: the ring is about 0.77 of the comp's height across, about 830 comp px, about 360 px on screen at 43.5%; on); keyframe easing; comp size; whether the mask is inside the text layer or a separate path layer (shown inside, Masks > Mask 1).

## Spinning ring of standing 3D letters, stackable
id: 09-rotating-3d-text-ring-loop
revision: a5ed1d79
job: reveal-headline; support: keep-it-alive, fill-the-backdrop
status: unproven
variant of: 19-text-on-a-path
differs: the same mechanism as the parent: a circular mask drawn with the Ellipse tool on the text layer itself, Text > Path Options > Path set to that mask so the letters follow the circle with Perpendicular To Path On, Force Alignment Off and Last Margin 0, the mask no longer cutting the layer, and the word repeated until it runs all the way round (parent steps 1–4, the source video.md L725–L732, L738). Reverse Path: here Off (step 2); On in the parent (L734). First Margin: here 0, not animated (step 2); in the parent keyed 0 to 512 over 0:00:00:00 to 0:00:03:01, which is what moves the type (L735–L737). Standing ring: here the text is 3D in the Advanced 3D renderer, a per-character 3D animator sets X Rotation +90° so each letter stands up off the path, the layer's own X Rotation −90° lays the circle flat, and the layer drops to Position 960,778,165 near the floor (steps 4–6); the parent's ring stays flat to the camera round a title (L719, L739). Filling the ring: here the mask is enlarged with Free Transform (Ctrl+T) and more copies of the word are typed in (step 8); in the parent the text size is raised from 35 to 48.7 px (L727, L733). Spin: here the anchor is centred on the ring and the layer's Z Rotation runs on time*−30 (steps 10–11); in the parent the type travels along the path through First Margin (L735). Stacking: here a duplicate raised to 960,418,165 runs time*30, so two rings turn opposite ways (steps 12–13); one ring in the parent. Camera: here the camera's parent null is pulled back to Z −1335.7 (step 9); the parent has no camera step. Type: here extruded, textured Poppins Black at layer Scale 472 % (ingredients); in the parent a heavy geometric sans, Black weight, white fill (L726, L729).
what it does for a beat: A seamless looping title or bumper: a word repeated around a circle stands up like a carousel and turns forever, and stacked copies make a tower of rings; good for intros, loops and background type.
what it looks like: Chunky extruded letters with rusted blue-grey painted-metal faces and plain, untextured cream metal sides stand upright around a flat circle and spin on the spot over a pale blue backdrop with a dark floor; two rings are stacked one above the other and turn in opposite directions, and a shallow depth of field blurs the far side.
ingredients:
- Starts from the lit advanced-3D title as technique 07 leaves it, in a fresh copy of that comp with the word repeated. So this recipe stands alone, the scene it needs (figures from those recipes, each shown in its own span):
  - Text (01, 05, 07): Poppins Black 100 px, layer Scale 472 %, 3D layer, comp renderer Advanced 3D, comp 1920x1080 at 23.976 fps; Geometry Options Extrusion Depth 20, Bevel Style Convex, Bevel Depth 2, Hole Bevel Depth 100 %; a rusty blue-grey painted-metal Substance material (.sbsar) on Front, Bevel and Back, texture Scale 17 %, Uniform Tiling on, Randomize Offset on. From 07: Material Assignment Side set back to Default (plain sides), fill colour #FFDCAD, Material Options > Specular Shininess 100 %. In this span the Character fill swatch is pale yellow (shown) and the sides are plain cream metal with no rust (seen on the result frame); the Side override and the shininess are not shown again here (inferred from 07 and the picture). Starting from 01 alone gives rusty sides and will not match.
  - Backdrop and floor (02): a 2D comp-size solid #B5E7FC at the bottom of the stack; a duplicate switched to 3D, X Rotation 90°, Position 960,721,0, Scale 627 %, Material Options > Accepts Shadows: Only (both layers are in this comp's timeline, shown in a).
  - Environment light (02): X Rotation −25°, Y Rotation keyed 235° at 0 s to 195° at 0:00:04:23, Intensity 187 %, Casts Shadows On, Shadow Darkness 100 %; it backlights the rings and casts their shadows towards the camera. Whether this copy of the comp still carries the keys is not shown (08's static 120.5° was set later, in the other comp).
  - Parallel light (03, 04): Position 2920,−100,2663.3, Point of Interest 960,540,0, Intensity 216 %, Casts Shadows Off. Point light (04): Position 456,530,−666.7, Intensity 100 %, Falloff Smooth, Radius 589, Falloff Distance 373, Casts Shadows Off.
  - Camera (06), as seen in this comp at the end: 50 mm two-node camera parented to a 3D null, Zoom 2666.7 px, Depth of Field On, Focus Distance 2962.7 px, Aperture 96.3 px, Focus Area Width 0, Near, Far Blur Level 100,100 % (shown). These differ from 06's Focus Distance 2343.7 and Aperture 30.3; when they were changed is not shown. This deep focus and wide aperture are what blur the far side of the rings.
- Ellipse Tool mask on the text layer — built-in; toolbar shape tools > Ellipse Tool (shown)
- Text Path Options > Path — built-in (shown)
- Text animator with per-character 3D Rotation — built-in; Animate > Rotation with Enable Per-character 3D ticked (shown)
- Composition viewer 2 Views layout with a Top view, Draft 3D — built-in (shown)
- Expression on Z Rotation — built-in (shown)
- Null object (the camera's parent from 06) — built-in (shown)
steps:
1. With the text layer selected, pick the Ellipse Tool and draw a circular mask on it (said; tool menu shown; mask circle in viewer). It is drawn in the default Add mode (shown).
   - Mask 1 mode: Add when drawn (shown); it reads None once it is picked as the text path in step 2, with no click seen, so the switch looks automatic (shown; automatic switch inferred)
2. Under Text > Path Options set Path to Mask 1; the letters now follow the circle (said; shown).
   - Path: Mask 1; Reverse Path Off; Perpendicular To Path On; Force Alignment Off; First Margin 0.0; Last Margin 0.0 (shown)
3. Delete the earlier text animators (the letter entrance from 05) so the ring is static before it spins (said; animator selected for deletion).
4. Click Animate > Rotation (Enable Per-character 3D is ticked) to make a new animator, and set its X Rotation to exactly +90° so each letter turns upright relative to the path (said; menu shown; value shown).
   - Animator X Rotation: 0x+90.0°; Y Rotation 0x+0.0°; Z Rotation 0x+0.0° (shown)
5. In the layer's own Transform set X Rotation to -90°, which lays the circle flat so the letters stand around a horizontal ring (said; shown).
   - Layer X Rotation: 0x-90.0° (shown)
   - Layer Scale is 472.0,472.0,472.0% from the earlier build (shown)
6. Move the layer down so the ring sits near the floor (said "lower this down"; shown).
   - Position: 960.0,778.0,165.0 (shown; crop)
7. Check the ring from above: switch the viewer to 2 Views, set the second view to Top, with Draft 3D on and the viewer extended (said; menu shown; Top view shown).
8. Close the gaps in the ring: select the mask and press Ctrl+T (shortcut said; that it is Free Transform Points is inferred) to enlarge it past the letters' extent, and type more copies of the word into the text so the letters run all the way round (said; the word appears twice and three times).
9. Pull the camera back by moving the null that the camera is parented to (said "use a null object to zoom out"; shown).
   - Null Position: 960.0,540.0,-1335.7 (shown)
10. Centre the text layer's anchor point on the ring before animating; the author opens Layer > Transform for this (stressed; menu shown; the exact submenu item is not seen, inferred: Center Anchor Point in Layer Content).
11. Alt-click the stopwatch of the layer's Z Rotation and enter a time expression with a negative multiplier so the ring spins (said; shown).
   - Z Rotation expression: time*-30 (shown)
12. Duplicate the text layer and move the copy up to stack a second ring; more copies can be added the same way (said; shown, copy is layer 6, original layer 7 keeps its expression).
   - Copy Position: 960.0,418.0,165.0 (shown)
13. Edit the copy's Z Rotation expression to a positive multiplier so the two rings turn in opposite directions (not said; edit in progress, landed: layer 6, the copy, reads time*30 while layer 7, the original, still reads time*-30).
   - Copy Z Rotation expression: time*30 (shown)
   - On screen the lower ring (original, time*-30) carries its near letters from left to right and the upper ring (copy, time*30) carries its near letters from right to left (measured on the result, below).
layout: (all measured on the result frame, a; the viewer picture there spans x 768–2164, y 303–1088 at full size, the whole comp) the two-ring stack is centred horizontally; its nearest letters span about 9% to 91% of the picture width, so the ring's front-on diameter is about 82% of the picture width (measured); upper ring's front letters run from about 17% to 47% of the picture height and the lower ring's from about 45% to 76%, so each band of letters is about 30% of the picture height and the two bands just touch (measured); the floor horizon sits at about 72% of the picture height (measured). In comp units the copy starts at Y 768, where the original was when duplicated (shown in a), passes 468 and 398 and lands at Y 418 (shown), so the rings are about 350 px apart (measured from those two values). Background: flat pale sky blue #B5E7FC (181,231,252) above the floor (measured). Floor in front of the rings: darkest just under the lower ring's near letters at about 76% of the height, about 26,33,35, then lightening slowly to about 45,56,61 at 79%, 53,68,74 at 88% and 63,82,89 at the bottom edge, so the whole floor reads dark, about a quarter to a third of the sky's brightness (measured; from 02's backlight and shadow-only floor with the two rings' shadows overlapping). Sides of the letters: plain cream metal, brightest where the backlight catches the edges (seen; from 07's settings). Depth of field: the near letters of both rings are sharp; letters turning round the far side and the ends of the rings are soft (seen; from the camera values under ingredients). Motion: between cuts 0.1 s apart from 478.4 the upper ring's near letters shift left by about 30 to 47 px and the lower ring's shift right by about 26 to 42 px at full size, about 0.23 to 0.26 of the picture width per second each way (measured by matching horizontal strips through each ring's near letters); this agrees with 30° a second on a ring about 82% of the width across (about 0.21 of the width per second at the front). Nothing else moves: the camera and floor hold still during the result.
timing and easing: Linear, endless spin from the expressions: time*-30 on the original (−30° per second on Z, so one turn every 12 s) (shown) and time*30 on the copy (shown), same speed, opposite directions; rate inferred from the expressions and matching the measured motion. No keyframes.
variations: Two, three or four stacked copies (said). Lower the ring as needed (said).
pitfalls: Centre the anchor point on the ring before adding the spin, or it goes badly (said, stressed); what goes wrong is not said: presumably the ring orbits or wobbles around an off-centre pivot instead of turning in place (inferred).
build notes: By script: textLayer.mask.addProperty("ADBE Mask Atom") with a circular shape, then set maskMode MaskMode.NONE explicitly (in the interface it flips from Add to None by itself when used as the path); Text > Path Options > Path = mask index 1 ("ADBE Text Path Options" > "ADBE Text Path"). Animator: add "ADBE Text Animator" with "ADBE Text Rotate X" = 90 (requires per-character 3D: textLayer.threeDPerChar = true). Layer: transform.xRotation = -90, position [960,778,165]. Expression on transform.zRotation: "time*-30" on the original; after layer.duplicate(), set the copy's to "time*30" and its position to [960,418,165]. Camera Options as seen at the end: Depth of Field 1, Focus Distance 2962.7, Aperture 96.3 (ADBE Camera Focus Distance, ADBE Camera Aperture). Anchor: compute sourceRectAtTime centre or use app.executeCommand for Center Anchor Point in Layer Content. Viewer layout (2 Views, Top, Draft 3D) is interface only. Mask scaling with Ctrl+T is by hand, or scale the mask vertices by script. Duplicate with layer.duplicate().
unknowns: The ellipse mask's size and position and how far it was enlarged; the exact repeated text; the original ring's final Y after the copy was made (it was 778 and 768 when duplicated; whether the original moved again after the copy is not shown); the anchor-point command used; whether the earlier camera push from 06 still runs in this comp; when and how the camera's Focus Distance and Aperture were changed to the values under ingredients (only their end state is shown); whether the environment light's Y Rotation keys from 02 are still on in this comp.

## Paper texture through a title matte, with roughened edges
id: 21-texture-through-a-matte
revision: c33c4c28
job: reveal-headline; support: finish-the-look
status: proven (accepted 2026-11-14)
what it does for a beat: Make a title look printed or stamped into a worn paper texture instead of floating on top of it: the texture itself forms the letters, brightened, and the letter edges are broken up.
what it looks like: A tall condensed all-caps word in grey, made of the same creased, scratched dark paper as the background, with ragged, eroded edges; small white labels sit around it.
ingredients:
- A texture layer (dark creased paper footage or still) and a duplicate of it — built-in; Edit > Duplicate
- A title layer filled black (Fill effect, colour black) — built-in (shown)
- Track Matte column, Alpha matte — built-in (menu shown; alpha matte set shown, crop)
- Curves — stock; Effect > Color Correction > Curves (shown)
- Roughen Edges — stock; Effect > Stylize > Roughen Edges (shown)
steps:
1. Start with the texture as the bottom layer and a black title above it (said; shown, title reads black on the paper)
2. Duplicate the texture layer and move the copy directly under the title (said; shown : two texture layers, copy at layer 6 under the title at 5)
3. Set the copy's Track Matte to the black title layer, Alpha matte, not inverted (said; menu shown, alpha icon shown). The title layer's own visibility is off once the matte is set (shown; its eye is still on)
4. Add Curves to the matted texture copy and lift it so the title reads lighter than the background (said; shown)
   - Channel: RGB (shown)
   - Curve: white point dragged far left, roughly input 33 of 255 to output 255, a steep straight line (read by eye from the opening preview of the finished state, inferred; during the build the drag is still in progress at about input 100). The white point only has meaning against the texture's own levels: in a proof build a paper peaking near 77 of 255 clipped the title to white at this setting and one peaking near 29 read grey, so set the lift by the result, letters about six times the paper's level as in the tutorial (median about 87 to 90 against 15, measured), and not by the number (inferred: the dependence was found in a proof build)
5. On the title layer (the matte), add Roughen Edges (said; title layer selected and Roughen Edges found under Stylize; effect on the title layer shown)
   - Edge Type: Roughen (shown; that it is the default is inferred)
   - Border: scrubbed through 26.10 (shown) and 20.00 (shown), ending at 19.00 (shown); a starting value of 8.00 comes from the text reader, not checked on a frame
   - Edge Sharpness: 1.00 (shown) → 10.00 (shown)
   - Fractal Influence: 1.00 (shown)
   - Scale: 100.0 (shown) → 10.0 (said "lower the scale"; shown)
   - Stretch Width or Height: 0.00; Offset (Turbulence): 0.0, 0.0; Complexity: 2 (shown)
   - Evolution: 1x +161.4° (shown)
6. The title layer also carries a Displacement Map that pushes the letters with the texture (shown; not narrated)
   - Displacement Map Layer: the bottom texture layer, Effects & Masks (shown)
   - Use For Horizontal: Red, Max Horizontal Displacement: 0.0 (shown)
   - Use For Vertical: Green, Max Vertical Displacement: 46.0 (shown)
   - Displacement Map Behavior: Center Map; Wrap Pixels Around: off; Expand Output: on (shown)
layout: title word: about 54% of the comp's width wide (left edge at 23%, right at 77%) and 42% of its height tall (top at 26%, bottom at 68%), centred at about 50% across, 47% down (measured, shares of the whole comp: the viewer is at 41.4% zoom and the result crop takes in the whole comp); letter strokes about 2.2 to 2.4% of the comp's width thick; roughened edge breaks up the outline by about 0.5% of the comp's width (measured, same frame); small label line under the title at about 77% down, about 15% of the width wide; top label line centred at about 12% down; bottom-left label block at about 4% in, 85 to 94% down (measured, same frame, shares of the whole comp)
timing and easing: none given for the technique (the title has an "IN" layer marker, shown, so it likely animates on; not covered).
variations: Works for "anything", a title or a graphic, as long as the matte layer is black (said).
pitfalls: Once matted, the texture copy matches the background, so the title nearly vanishes (shown, title faint; inferred cause: it is the same texture); Curves is what brings the title back (said). Lowering Roughen Edges Scale is what blends the edge into the grunge (said).
build notes: Script: tex2 = tex.duplicate(); tex2.moveAfter(title) (must sit directly below the matte); in AE 2023+ tex2.setTrackMatte(title, TrackMatteType.ALPHA), older: tex2.trackMatteType = TrackMatteType.ALPHA with title directly above; title.enabled = false. Curves ("ADBE CurvesCustom") curve points are not scriptable: set by hand, or substitute Levels ("ADBE Easy Levels2") with Input White about 33/255 (inferred equivalent). Title: Fill ("ADBE Fill", Color black), Displacement Map ("ADBE Displacement Map"), Roughen Edges ("ADBE Roughen Edges") with "Border" 19, "Edge Sharpness" 10, "Scale" 10, "Complexity" 2, "Evolution" 161.4 + 360 deg. With Max Vertical Displacement 46 the Displacement Map moved the whole title about 40 px down in a proof build whose stand-in texture had a green channel far from mid grey, so check the title's place after adding it (inferred: found in a proof build, not said or shown).
unknowns: the texture source; title font, size and colour beyond black; exact curve points; whether the Displacement Map is meant as part of this technique; the title's in-animation.

## Frame video in a custom shape with a track matte
id: 25-custom-media-frame
revision: 8c6d3c5f
job: show-real-screen; support: reveal-headline
status: proven (accepted 2026-11-14)
what it does for a beat: When a photo or clip should sit in a designed window rather than a plain rectangle (for example, a cut-out that leaves room for a headline), draw any shape and use it as the clip's matte.
what it looks like: On a white slide, a dark building photo fills a wide frame whose lower middle is notched out, so a white panel with a large black headline sits inside the notch; the image reads as a custom-shaped placeholder.
ingredients:
- Shape layer drawn with the Rectangle tool (or the Pen tool) — built-in
- Track Matte column (Alpha Matte) on the media layer — built-in
steps:
1. Draw the frame shape with the Pen tool or shape tools (said); here, three rectangles inside one shape layer (shown)
   - Rectangle 1: a wide bar across the top (shown)
   - Rectangles 2 and 3: two blocks hanging down at the left and right, leaving a gap in the middle for the text (shown)
   - Rectangle 3 Size: 595.0, 1285.0 (shown)
   - Rectangle 3 Roundness: 20.0 (shown)
   - Rectangle 3 Position: 1374.5, 261.5 (shown)
   - Comp: 3840 x 2160 (measured: a 3840 comp at the 20% zoom readout is about 1378 px on screen and the result crop is 1376 px)
   - Fill: grey; Stroke Width 3.0 with the stroke switched off (shown)
   - The clip layer's visibility (eye) is off while the shape is drawn, so the grey shape is seen over the slide (shown)
2. Drag the video or image layer from below the shape (layer 3) to directly above it (layer 1, shape on layer 2; shown)
3. Turn the clip layer's eye back on; a hidden layer renders nothing even with a matte (shown cursor on the eye column, eye on; the reason is inferred)
4. Set the clip's Track Matte to the shape layer, alpha matte (said "matte your video or images to it"; shown, Track Matte "2. Shape L…" with the alpha icon)
5. The shape layer's visibility turns off and the clip shows only inside the shape (shown)
layout: whole frame: about 87% of the comp's width (6.3% to 93.4% across) by 59% of its height (33% to 92% down) (measured, shares of the whole comp: the viewer is at 20% zoom and the result crop takes in the whole comp; the comp is 3840 x 2160: the viewer reads 20% and the crop is 1376 px wide against about 1378 px for a 3840 comp at that zoom, measured); top bar about 29% of the comp's height deep across the full frame width; left and right blocks each about 15.4% of the comp's width wide, running the full frame height; the notch between them about 56% of the width wide and 30% of the height deep, centred at 50% across (measured, same frame, shares of the whole comp); corner rounding about 0.4% of the comp's width (measured, same frame); the headline in the notch about 52% of the width wide, capitals about 12% of the height tall, centred at 50% across (measured, same frame, shares of the whole comp)
timing and easing: none given
variations: Any shape made with the pen or shape tools works (said)
pitfalls: none given
build notes: Add a shape layer with three `ADBE Vector Shape - Rect` groups (Size, Position, Roundness) and a Fill; put the footage layer above it with `footage.enabled = true` (a hidden footage layer renders nothing), then call `footage.setTrackMatte(shapeLayer, TrackMatteType.ALPHA)` (AE 23+; older: move footage directly above and set `trackMatteType`). All scriptable. The Rectangle Position values on screen are in the shape layer's own space with the layer left at the comp centre; read that way in a 3840 x 2160 comp, Rectangle 3 lands on the layout's right block (inferred: found in a proof build, not said or shown).
unknowns: Sizes and positions of Rectangles 1 and 2; the fill colour value. A later shot shows the same layout with clearly rounded corners on every edge, but the step that rounded them is not shown (Roundness reads 20 throughout).

## Rounded-rectangle matte card that carries its media and labels
id: 01-rounded-shape-matte-media-card
revision: 6305ccdf
job: show-real-screen; support: list-items
status: unproven
variant of: 25-custom-media-frame
differs: the same mechanism as the parent: a shape layer drawn with the Rectangle tool sits directly under the photo or clip, the media's Track Matte is set to that shape as an alpha matte, and the shape's own visibility goes off so the media shows only inside it (parent steps 1, 2, 4 and 5, the source video.md L919, L928, L930, L931). Shape: here one upright rectangle, Rectangle Path Size 556 × 712, Roundness 54, centred in the frame (steps 1–3); in the parent three rectangles in one shape layer, a top bar and two hanging blocks that leave a notch for a headline, Rectangle 3 at Size 595 × 1285 and Roundness 20 (L919–L923). Order: here the photo is dropped in directly above the shape (step 4); in the parent the clip starts below the shape, is dragged above it and has its eye turned back on, since a hidden layer renders nothing (L928–L929). Parenting: here the photo (Scale 70 %) and every overlay (a two-line headline, two pill tags with a word in each, a logo) are parented to the shape, so one layer moves and scales the whole card, and the overlays carry no matte so they sit on top of it (steps 6, 8, 9); the parent has no parenting step (its steps, L919–L931). Comp: here about 1920 × 1080 at 23.976 fps (step 1); the parent's comp is 3840 × 2160 (L925).
what it does for a beat: Turns any photo or clip into a tidy rounded card whose size and position are driven by one shape layer, so the card can later be swung, scaled or duplicated as a unit. Reach for it as the base piece of any card carousel or media stack.
what it looks like: A portrait photo of a model, cropped into a rounded upright card in the middle of a plain cream frame, with a bold two-line white headline, two small outlined pill tags laid over the lower part of the card, and a small white logo mark in the card's top-left corner.
ingredients:
- Shape layer from the Rectangle Tool — built-in; toolbar shape-tool flyout (Rectangle Tool shown)
- Track Matte (alpha matte from the shape layer) — built-in; Track Matte column of the timeline (shown)
- Parenting (Parent & Link) — built-in; Parent & Link column (shown)
steps:
1. Pick the Rectangle Tool from the shape-tool flyout and drag out an upright rectangle in the composition (said; tool menu shown)
   - Composition: about 1920x1080, 23.976 fps (fps shown; size inferred from the rectangle filling 29% x 66% of the picture at 556x712)
   - Rectangle Path Size: 556.0,712.0 (shown)
   - Rectangle Path Position: 0.0,0.0 (shown)
   - Fill: black, Stroke off (shown; the fill colour does not matter because the layer is only used as a matte — inferred)
2. Centre the shape layer in the frame (said, stressed as exact; the Align panel is set to "Composition", but no click on an align button is seen — how it was centred is inferred)
   - Shape layer Position: no settled readout is ever on screen. The only readouts come during the drag-away-and-back test (step 9), while the value is being scrubbed: Y stays 538.0 and X passes 868 to 1448 (cuts from); these are values passed through, not the layer's set position. The recording then cuts (X reading 768, card left of centre) to a state where the card is centred again. Measured on the result frame, the card's centre sits at 0.501 x 0.501 of the picture, so aim for the comp centre, 960,540 (measured; the 538 seen while dragging is within reading error)
3. Open Contents > Rectangle 1 > Rectangle Path 1 and raise Roundness to round the corners (said)
   - Roundness: 54.0 (shown; dragged up through 20 and 41 first)
4. Drop the photo or video into the comp directly above the shape layer (said; shown, photo layer at index 1 above the shape layer)
5. On the photo layer set Track Matte to the shape layer, using the alpha matte (said "track matte"; matte chosen shown; alpha rather than luma is inferred from the matte icon)
   - The shape layer's own visibility goes off when it becomes the matte (shown, eye column empty on the shape layer)
6. Scale the photo inside the card until it frames well (said "control the sizing")
   - Photo Scale: 70.0,70.0% (shown)
7. Rename the shape layer so it is easy to find, for example "matte" (shown; not said)
8. Parent the photo layer to the shape layer so moving or scaling the shape moves the photo with it (said; shown, photo layer Parent = the matte layer)
9. Add the overlay elements on top — a two-line headline text layer, two pill-shaped outline boxes with a one-word text tag in each, a small logo image — and parent every one of them to the shape layer too (said; shown, all six overlay layers parented to the matte layer)
   - Optional test: after parenting the photo, the matte's Position is dragged away and back to show the photo following it (shown); it is put back, so it does not change the result
   - The overlay layers have no track matte (Track Matte = No Matte, shown), so they sit on top of the card rather than being cut by it
   - The overlays are switched on one at a time while the layers are set up (shown); this is housekeeping, not part of the look
layout: background a flat, full-frame cream solid, RGB about 247,244,237, the same value in all four corners and mid-edges of the result crop, with no vignette, gradient or grain (measured on a still of the result; the layer is present); card width about 29% of the picture width and height about 66% of the picture height, centred both ways (measured on the result frame: 491 x 634 px in the 1688 x 948 crop, centre 0.501 x 0.501); the card is flat, with no drop shadow, edge glow or stroke: the two rows just below its bottom edge are a lighter anti-aliased fringe, and from the third row down the pixels are within 4 levels of the background, exact from the seventh (measured at the card's centre column and near its left corner); corner radius: Roundness 54 shown, which in After Effects is the radius in comp pixels (about 10% of the 556 px card width); measured on the result crop the corner fits a circle of about 45 crop px on the 491 px card, about 51 comp px or 9% of the card width, the same on the top-left, top-right and bottom-left corners (measured; within reading error of 54); headline sits in the lower third of the card, left-aligned with a margin of about 7% of the card width, letter height about 6% of the picture height; pill tags under the headline, each about 4% of the picture height tall; logo mark in the card's top-left corner, about 7% of the card width in from the left edge and about 5% of the card height down, roughly 11% of the card width wide (measured on the result frame, also visible)
timing and easing: none given (this part is static set-up)
variations: any media works — photos or video (said); any shape can be drawn (said "any shape that you want")
pitfalls: the shape must be exactly centred in the frame (said, stressed); the media and all text and graphics must be parented to the matte shape so one layer moves everything (said, stressed as "most importantly")
build notes: by script — layers.addShape(); add "ADBE Vector Group" with "ADBE Vector Shape - Rect" (Size [556,712], Roundness 54) and "ADBE Vector Graphic - Fill"; set layer Position to the comp centre; import the media, move it above the shape, then mediaLayer.setTrackMatte(shapeLayer, TrackMatteType.ALPHA) (AE 2023+; older versions: put the shape directly above and set trackMatteType = TrackMatteType.ALPHA); mediaLayer.parent = shapeLayer and the same for each text, box and logo layer; media Transform > Scale [70,70]. Nothing here needs the interface.
unknowns: exact composition size (inferred 1920x1080); how the layer was centred (align button or position typed) and its settled Position value; fonts, sizes and colours of the headline and tags; size and roundness of the pill boxes; the logo artwork; whether the photo is a still or a clip in the finished build (a still is used here)

## Card that swings round a pivot below the frame, one step at a time, forever
id: 02-pivot-null-swing-loop
revision: e8d498e7
job: list-items; support: keep-it-alive
status: unproven
what it does for a beat: Gives a card (or later a row of cards) a carousel step: it swings in from one side on a big arc, settles upright, pauses, then swings out the other side, and the step repeats endlessly from only three keyframes. Use it for product or photo carousels, list reveals, or any "next item" rhythm.
what it looks like: The rounded photo card from 01-rounded-shape-matte-media-card arrives from the lower right tilted about 34 degrees, rocks up into the centre on a wide arc and holds upright; the next step carries it on the same arc to the mirror of where it started, lower left and tilted about −34°, where it holds again with its lower-left corner about 6% of the picture height below the frame's bottom edge, the card cut by that edge along about 8% of the picture width; only the step after that (−68°) takes it mostly out of frame, one corner still showing at the lower left. Each cycle adds another −34°, so a single card never comes back.
ingredients:
- The matte card from 01-rounded-shape-matte-media-card (shape matte with media and overlays parented to it)
- Pan Behind (Anchor Point) Tool — built-in; toolbar (said)
- Null Object — built-in; Layer > New > Null Object, Ctrl+Alt+Shift+Y (menu shown)
- loopOut("offset") expression on Rotation — built-in (said; shown)
- Easy Ease (F9) and the Graph Editor speed graph — built-in (said)
steps:
1. Build the card as in 01-rounded-shape-matte-media-card (inferred link; said "builds on")
2. With the Pan Behind tool, drag the matte layer's anchor point down to the bottom edge of the card, centred (said; result shown, Anchor Point 3.8,359.8 on a 712 px tall rectangle, so the anchor sits on its bottom edge)
3. Make a null object (said; New > Null Object menu shown)
4. Parent the matte layer to the null (said; shown, matte layer Parent = the null)
5. With the Pan Behind tool, drag the null's anchor point straight down below the composition to where the swing should pivot (said; shown, the null's anchor sits centred horizontally below the frame)
   - Pivot: centred, about 0.36 picture heights below the bottom edge of the frame, i.e. about 0.53 picture heights below the card's bottom edge (measured)
6. Test the arc by scrubbing the null's Rotation value back and forth and watching the card travel round the pivot (shown, scrub cursor on the Rotation value; the timeline also records about −81° during this stretch; not said; the value is then put back to 0)
7. On the null's Rotation, set a keyframe of 0 degrees around frame 20 (said "around 20 ish frames"; shown, key at about 20 f, 0x+0.0°)
8. Go to frame 0 and rotate the null so the card sits off to one side (said; shown)
   - Rotation at 0 f: 0x+34.0° (shown; card to the right)
9. Add a third keyframe a few frames after the 0-degree one, with the same value, to make a short hold (said; shown, a third key about 3 f later)
   - Final key times after retiming: 0 f (+34°), 17 f (0°), 24 f (0°) at 23.976 fps (shown, measured on the timeline ruler; the move from 20 f to 17 f is not seen being done)
10. Alt-click the Rotation stopwatch and type the offset loop (said; the auto-complete list of continue / cycle / offset / pingpong shown)
   - Expression: loopOut("offset") (shown)
   - Each cycle now adds another −34° step and its own 7-frame hold, so the card goes right (+34°) → centre (0°, hold) → lower left (−34°, hold) → mostly out (−68°) (inferred from how offset looping works; confirmed in the playback, cut every 0.05 s from 133.5, upright hold, swing, left hold, next step, then a still corner at the lower left)
11. Select the first two keyframes and apply Easy Ease with F9 (said; hourglass Easy Ease icons on keys 1 and 2, third key left linear, shown)
12. In the Graph Editor (speed graph), pull the ease handles out to make a strong, symmetric ease in and out (said "smooth out the animation however you need"; final shape shown and unchanged, just before the playback)
   - Key 1 outgoing handle: Speed 0.00 °/s, Influence about 77% (shown, a tooltip reading 76.71% read while the handle is still being dragged, so a value passed through; the settled graph has the same shape, so about 77% stands as approximate)
   - Key 2 incoming handle: about the same length, so about 77% too (inferred from the matching handle length)
   - Resulting speed graph: peak about −199 °/s at about frame 8.5 of the 17-frame swing, symmetric, near-zero speed for the first and last few frames (shown, read off the graph's degree scale)
   - On the way the author drags an earlier, lopsided shape (peak about −116 °/s near frame 5, mid-drag); that is not the final shape
layout: card upright and centred at the hold, card about 29% of picture width and 66% of picture height (measured, unchanged from 01); the card keeps this size through the whole swing, with no shrink or lean of its own (that is 03) (measured: its pixel area is 18.9% of the picture upright and 18.5% at the left hold); at the left hold (−34°) the card's centre sits about 23% across and 64% down, its lower-left corner about 6% of the picture height below the frame's bottom edge, so the bottom edge cuts the card along about 8% of the picture width, from about 19% to 27% across (measured on the last picture row of a full, the corner depth from the geometry: centre 64% down, −34° tilt puts the lower-left corner about 450 comp px below the centre); after the next step (−68°) only about a third of the card shows, low in the bottom-left corner (measured); motion is right to left: each step carries the card's centre about 27% of the picture width, almost all of it in about 5 comp frames mid-swing, peaking at about 1.5 picture widths per second (from about 7.8° per comp frame on a pivot about 0.48 picture widths below the card centre; measured); at frame 0 the card centre sits about 77% across and 62% down the picture, tilted +34° (measured); pivot centred about 0.36 picture heights below the frame's bottom edge (measured)
timing and easing: 23.976 fps; null Rotation keys 0 f = +34°, 17 f = 0°, 24 f = 0° (24-frame cycle: 17 f swing, 7 f hold); Easy Ease on the first two keys, then both handles pulled to about 77% influence for a symmetric ease with a peak of about 199 °/s mid-swing; loopOut("offset") repeats the step forever
variations: none given beyond "however you need" for the graph shape (said)
pitfalls: parenting the card to a null that is itself moved creates layers of parenting ("null-ception", said); without a loop expression the keyframes only play one swing (said); without easing the step looks mechanical (said: ease is highly suggested)
build notes: by script — matte.property("ADBE Transform Group").property("ADBE Anchor Point") set to [0, rectHeight/2] and Position compensated so the card does not jump (the Pan Behind tool does this compensation by hand); var n = comp.layers.addNull(); move the null's anchor/position so its position lies at [compW/2, compH*1.36]; matte.parent = n; n Rotation setValueAtTime(0,34), (17/23.976,0), (24/23.976,0); expression 'loopOut("offset")'; KeyframeEase on keys 1–2: key 1 outgoing new KeyframeEase(0, 76.71) and key 2 incoming new KeyframeEase(0, about 77) (key 1 value shown; key 2 inferred from its matching handle); key 2 outgoing and key 3 can stay linear. Nothing needs the interface.
unknowns: how the keys moved from about 20 f / 23 f to 17 f / 24 f (somewhere in, not checked); the exact influence of key 2's incoming handle; the null's exact position values; the composition length; whether anything else in the comp is animated

## Card shrinks and leans outward at the ends of its swing
id: 03-tilt-and-shrink-on-swing
revision: 66c61d6a
job: list-items; support: point-at-detail
status: unproven
what it does for a beat: Adds a size-and-lean change on top of the pivot swing so the card is small and tipped outward while it is off to the side and full size and upright when it reaches the top. This is what makes a swinging carousel feel like it is "resizing" and gives the centred item its emphasis.
what it looks like: The rounded photo card enters from the lower right at about two-thirds size and leaning hard outward, grows to full size as it rises upright into the centre, holds, then shrinks and leans outward again as it falls away to the lower left.
ingredients:
- The swinging card from 02-pivot-null-swing-loop (matte card parented to a pivot null with a looping rotation)
- Scale and Rotation keyframes on the matte shape layer — built-in (said)
- Easy Ease (F9) and the Graph Editor — built-in (shown)
steps:
1. Start from the finished 02-pivot-null-swing-loop set-up: null keys 0 f +34°, 17 f 0°, 24 f 0° with loopOut("offset") (inferred link; null keys still visible)
2. Select the matte shape layer (the card) and open Scale and Rotation; its anchor is already on the card's bottom edge (shown, Anchor Point 3.8,359.8)
   - Housekeeping: the photo, text, box and logo layers are hidden from the timeline with the shy switch, leaving only the null, the matte and the background listed (shown); this does not change the picture
3. At frame 17, where the null reaches 0°, set keyframes for Scale and Rotation at full size and upright (said "hold the sizing rotation at the top"; shown)
   - Scale: 100.0,100.0% (shown)
   - Rotation: 0x+0.0° (shown)
4. At frame 0, where the card sits to the right, set Scale and Rotation so the card is smaller and leans further outward (said "slightly tilt and scale down"; shown and again)
   - Scale: 68.0,68.0% (shown)
   - Rotation: 0x+23.0° (shown; added on top of the null's +34°, so the card leans about 57° in all — inferred sum)
5. At frame 24, where the null's hold ends, add a matching full-size, upright key so the card holds at the top (shown, a third key added with 100% and 0°; the author says to hold the size and rotation at the top)
6. At frame 41, where the null's next step has carried the card to the left (24 f + 17 f), set the shrink and lean again in the other direction (said: repeat the shrink and tilt when the card reaches the other side)
   - Scale: 68.0,68.0% (shown)
   - Rotation: 0x−22.0° (shown; the key first reads 68% and +23° — that it was copied and pasted from frame 0 is inferred, no copy or paste is seen — then it is changed to −22, so the card leans about −56° in all with the null at −34° — inferred sum)
   - Key times measured on the timeline ruler: 0 f, 17 f, 24 f, 41 f (shown)
7. Smooth the Scale and Rotation keys (said "smooth out those keyframes if you want")
   - Easy Ease on all four keys of both properties: hourglass icons on every key (shown in a; all four keys selected)
   - Then in the Graph Editor the handles are pulled long: a tooltip on the first key's outgoing handle reads Speed 0.00 °/s, Influence 86.23% (shown in a, read while the handle is still being dragged, so a value passed through, not a settled key: the same handle is still short, and the graph is closed; take it as about 86%)
   - Resulting speed graphs for Scale (red) and Rotation (cyan): near zero speed around every key, with one narrow, tall spike inside each change: at about frame 7.5 of the 0–17 f stretch and about frame 32 of the 24–41 f stretch (Rotation peaks roughly −500 °/s and beyond the graph's lower edge; shown, key positions measured on the graph), so each change is slow at both ends and very quick in the middle; the other handles' influences are not readable and are taken as the same (inferred)
layout: at the centre hold the card is 29% of picture width and 66% of picture height, upright, centred (measured, from 01); at the side extremes the card is about 20% of picture width (68% of full size), its centre about 77% across and 77% down the picture on the right and about 23% across and 76% down on the left, leaning about 57° outward, so it partly drops below the frame's bottom edge (measured on editor frames with handles); Scale and Rotation act about the anchor on the card's bottom edge (from 02), so the card shrinks down towards its bottom edge and tips about it: that is why the shrunk side card sits low, partly below the frame, rather than floating at mid-height (inferred from the anchor, matches the frames); after 41 f a single card holds at 68% and −22° (about −56° in all) at the lower left until the null's next step carries it out of frame (inferred from the keys; no key after 41 f is shown); in the reference result (see `result`) the centre card is visibly smaller and leaning and full size and upright, 29.4% of the picture wide (still tilting slightly) and 67% tall (measured on a still of the result to), while the incoming copy at the lower right shows the frame-0 state: 68% size, leaning about +57°, centre about 78% across and 78% down; the left side is empty at that moment because no card precedes the first one; the incoming card is drawn in front of the centre card (its corner covers the centre card's red lower-right corner); the background is the flat cream of 01
timing and easing: 23.976 fps; matte keys at 0 f (68%, +23°), 17 f (100%, 0°), 24 f (100%, 0°), 41 f (68%, −22°), timed to the null's 0 f / 17 f / 24 f / 41 f positions; Easy Ease on all keys, then strong eases with long handles (first key outgoing influence about 86%, read mid-drag; the others assumed similar, inferred)
variations: the smoothing is optional (said "if you want")
pitfalls: none given
build notes: by script — on the matte layer: Scale setValueAtTime at 0, 17, 24, 41 frames (÷23.976) with [68,68], [100,100], [100,100], [68,68]; Rotation ("ADBE Rotate Z") with 23, 0, 0, −22; apply KeyframeEase(0, 86) in and out on every key to match the first-key handle read mid-drag (the other keys' values inferred). The null's Rotation loops with loopOut("offset"), but the video does not show any loop on the matte's Scale and Rotation, so as built here they play once (0–41 f); a single card that leaves the frame after 41 f does not need more, and in a multi-card chain each copy carries its own keys (see the next step of the video, not part of this recipe).
unknowns: the influence of every handle (the first key's outgoing 86.23% was read mid-drag); whether the matte's keys are looped by an expression; why the left-side lean (−22°) differs from the right-side lean (+23°) by one degree; a clean playback of the single-card effect (only the chained build of 04 is played clean)

## Cards growing along a drawn path into a stacked trail
id: 06-path-trail-scale-rotate-in
revision: 8a4d9a97
job: list-items; support: reveal-headline, one-to-many
status: unproven
what it does for a beat: A stream of photo cards is born as specks, grows and straightens as it sweeps along a looping path, and brakes to a stop in a fanned stack. Use it for a gallery reveal, a "many stories" opener, or a build-up behind a title.
what it looks like: On a pale grey background, flat square-cornered photo cards (portraits, fashion, interiors) appear as specks near the lower left of centre, tilted counter-clockwise, sweep up the left side and across the top while growing and straightening, and brake into a stack at the lower right. The first card to arrive stays full size in front; each later card arrives behind it, so the cards still braking show as strips fanned above and behind the front card, arcing round a centred dark green two-line title.
ingredients:
- Shape-layer matte with an image matted and parented to it, as in 01-rounded-shape-matte-media-card and 05-mask-path-to-position-loop — built-in (shown)
- A solid for the background — built-in (shown, bottom layer)
- Pen tool drawing a mask on the matte layer — built-in (said; shown)
- Mask Path copied and pasted into Position, as in 05 — built-in (said)
- Scale and Rotation keyframes with Easy Ease on the last keys — built-in (said; shown)
- A two-line text title and a top grain/adjustment layer — built-in (shown in the finished example and in the build comp, not demonstrated)
steps:
1. Make a background solid at the bottom of the comp, pale neutral grey (not said; shown, a solid at the bottom of the stack)
   - Colour on the result: about RGB 228,228,228 (measured on the result crop; the solid's own value is not shown)
2. Start from one matte card with an image matted and parented to it, centred, the image scaled to cover the card (shown; the card is landscape, about 26 % of the picture width and 35 % of its height at full size, measured; the image scale is not shown here, 05 shows the same set-up at Scale 20 %)
   - Matte Anchor Point: 11.9,7.3 (shown)
3. With the matte layer selected, draw a custom open path with the Pen tool, dragging out Bézier handles (said; shown, mask being drawn as a curve)
4. Copy the mask path and paste it into the matte's Position, as in 05 (said "as before"; shown : Position keyed and the card moved to the path's first point)
   - First key Position: 755.9,919.3 (shown)
   - No loop expression this time (said)
5. Drag the last Position keyframe out to set the travel time (not said; shown, last key selected and placed at 6 s)
   - Keys at about 0, 1.4, 3.4, 4.8 and 6.0 s (shown; measured on the ruler). The middle three are roving keys (small dots, shown), so After Effects re-times them as the eases change: they sit elsewhere in later frames, and their times follow from the path and eases rather than being set
6. Key Scale and Rotation at both ends of the move: tiny and tilted at the start, full size and level at the end (said "start small and tilted"; start values shown)
   - Scale at 0 s: 0.0,0.0% (shown; values were tried while dragging — 49%, 35%, 41% — before landing)
   - Rotation at 0 s: on the result about −20° (counter-clockwise), not the +19° shown in the panel. The panel reads 0x+19.0° (and +0.8° at 5:04), and the single card played before duplication leans clockwise to match (: top edge falling to the right). But every young card on the result leans the other way: the smallest card near the path start has its top edge rising to the right at about 20°, the next two at about 10–18°, and the build comp's own playback shows the same counter-clockwise lean (the small card near the path start, about 20°). Use about −20° to get the result (measured); the change from +19° is not shown
   - Scale at 6 s: 100% and Rotation at 6 s: 0° (inferred: the keys at 6 s were set at the layer's default values, shown with Scale 100.0,100.0% and Rotation 0x+0.0° before the start values were changed; at 5:04 the card reads 96.0% and +0.8° on the way to them, shown; the landed front card on the result is level)
7. Ease the last keys so the card brakes to a soft stop (said "smooth out our final two keyframes"; shown : the 6 s keys of Position, Scale and Rotation all carry Easy Ease icons; the 0 s keys stay linear)
8. Duplicate the matte and image pair many times, swap the photo on each copy, and stagger them in time (said "duplicate, replace and offset"; shown : copied pairs whose layer bars start about 0.36 s later; replacement not done on screen in the build — every copy still uses the same photo)
   - Offset method shown: whole layers slid later in the timeline (layer in-points move), not key-dragging as in 05 (shown)
   - Stacking: keep the earlier-starting pairs above the later ones — in both the build comp and the finished example the pair that starts at 0 s is at the top of the layer stack and each pair below it starts later (shown; finished example's timeline). A plain duplicate lands above its original, so after duplicating move the copy below (or slide the original later instead); the result depends on this (step not said)
   - Stagger in the finished build comp: about 0.25–0.4 s between successive pairs, roughly sixteen to eighteen pairs, each with a different image (shown; measured from the bar starts against the ruler); the finished example's bars start about 0.3 s apart too (measured on its timeline), and its photos repeat after a while
9. Add the title in the middle and a grain/adjustment layer on top (not demonstrated; both are in the finished example and in the build comp, : two text layers and an adjustment layer at the top)
layout: All shares measured on the result crop, which is about the whole 1920×1080 picture (1551 × 875 px; about 0.81 crop px per comp px). Path in a 1920×1080 comp (measured from the drawn path, converted to comp pixels): starts at 755.9,919.3 (39 % across, 85 % down), bends left to about 15 % across and 47 % down, crests at about 59 % across and 18 % down, runs down the right side at about 85 % across and 51 % down, ends about 82 % across and 70 % down; the path is about 2,400–2,600 comp px long (about 1.3 picture widths). Front card (the first to arrive, landed, level, full size): about 71–99 % across and 52–88 % down, about 27 % of the width and 36 % of the height (about 525 × 390 comp px). Stack: the cards still braking show as horizontal strips stacked upward from the front card's top edge, each a strip higher and further behind, reaching up to the top of the picture; along the top and left side the growing cards overlap their neighbours, each older card (further along the path) lying on top of the younger card behind it; the whole trail fans from about 7 % to 99 % across and 0 % to 88 % down. Young cards: the newest is a speck at about 38 % across, 85 % down (the path start); the next ones near 25–30 % across and 70–85 % down are about 6–20 % of full size and lean counter-clockwise about 20° (top edge rising to the right), straightening as they grow. Background: flat pale grey about RGB 228,228,228, no visible shading (measured). Title: dark green (about RGB 7,33,27), centred at about 51 % across and 50 % down; a large capitalised word about 31 % of the picture wide with capitals about 11 % high, over a small, widely letter-spaced lowercase line about 22 % wide whose centre sits about 59 % down; the cards on the left and right pass close to it but do not cover it at the result moment. Motion: clockwise round the loop (up the left side, across the top, down the right into the stack); each card covers the whole path in 6 s, an average of about 22 % of the picture width per second, faster in the middle and braking over its last second or so (from the key spacing, the path length and the Easy Ease end keys; cross-checked on the result, where the playback runs at about real time — viewer time display 3:43 and 6:44 — and a card crossing the top right covers about 22 % of the width in one second). New cards keep being born at the start every 0.25–0.4 s while the front card holds still.
timing and easing: Position, Scale and Rotation keys 0 s → 6 s (23.976 fps comp); 0 s keys linear, 6 s keys Easy Ease; middle Position keys roving; copies staggered by about 0.25–0.4 s each (about 0.3 s in the finished example), earlier pairs on top; no loop
variations: duplicate, replace and offset as many times as wanted (said)
pitfalls: none given
build notes: by script — background solid at the bottom, about RGB 228,228,228. Shape-layer matte with Rectangle (about 525 × 390 px at full size), image layer matted and parented as in 05, image scaled to cover. Position keys: setValueAtTime at 0 and 6.0 s with the middle three points roving (or at about 1.4, 3.4, 4.8 s before setting them roving) on the five path points above (comp pixels) with spatial tangents to round the curve (setSpatialTangentsAtKey), roving on keys 2–4 (setRovingAtKey); pasting a mask path into Position is interface-only, so either do that by hand or approximate the curve with tangents. Scale ("ADBE Scale") [0,0] at 0 s and [100,100] at 6 s; Rotation ("ADBE Rotate Z") −20 at 0 s and 0 at 6 s (negative is counter-clockwise in After Effects; the panel's +19 gives the opposite lean to the result); on the 6 s keys apply KeyframeEase(0, 33) incoming (Easy Ease) for Position, Scale and Rotation. Copies: duplicate both layers, replaceSource the image, shift both layers' startTime by k × about 0.3 s, and order the stack so the pair with startTime 0 is on top and each later pair sits below the one before (moveAfter), matte directly above its image. Title: two text layers centred, dark green about RGB 7,33,27, sizes as in layout.
unknowns: the exact pen path vertices and handles (read from the screen, not from values); the middle keys' times (roving, so they shift with the eases); the end Scale and Rotation values (100 % / 0° inferred); the start Rotation actually used for the result (about −20° measured; the panel showed +19° and the change is not shown); whether the eases were changed beyond Easy Ease; how each copy's image was replaced (not shown in the build); the exact stagger per copy and the final count; the title's font and the grain layer's settings. The result is the author's pre-made finished example shown at the start of the span in a separate 60 fps comp (shown) that also holds the title and a noise layer not built here; its path, card size, lean and stacking match the build comp's own playback after the span, which has the same title. The mouse arrow wanders across the viewer during the finished example's playback, so the clean window is only about 0.15 s (the arrow); the slow zoom of the recording moves the picture by a few pixels, and the crop above is inside the picture at both ends.

## Bevelled 3D text wrapped in a tiled material
id: 01-bevelled-3d-text-material-texture
revision: 593535c4
job: reveal-headline; support: add-depth
status: proven (accepted 2026-11-19)
what it does for a beat: Turns a flat title into a solid, physical object with rounded edges and a real surface (metal, stone, paint) in a few clicks; the base for any lit 3D title shot.
what it looks like: A single short word in heavy sans-serif capitals, extruded with soft rounded front edges, every face covered in a pale-blue painted metal with rust patches; the texture is shifted per letter so no two letters show the same patch, with big rust patches up to about two strokes across, some letters far rustier than others, and rust running round the letter edges.
ingredients:
- Text layer with the 3D Layer switch on — built-in
- Advanced 3D renderer — built-in; viewer's renderer dropdown (Classic 3D / Advanced 3D / Cinema 4D) (shown)
- Geometry Options (Bevel Style, Bevel Depth, Hole Bevel Depth, Extrusion Depth) — built-in; layer > Geometry Options in the timeline (shown)
- Material Assignment > Add Override (new in After Effects 27 — the version number appears only in the video's title, so inferred) — built-in; layer's Material Assignment group in the timeline, and the Properties panel's Material Assignment section (shown)
- A Substance material (.sbsar), here a rusty painted-metal one — stock; free materials from Adobe Substance 3D Community Assets, reachable from the Material section's panel menu "Get Substance Community Assets..." (shown)
steps:
1. Start from an ordinary white text layer: a single word, heavy sans caps (said; shown)
   - Font: Poppins Black, 100 px, white fill (shown)
   - Size on screen does not match 100 px: the word measures about 51 % of the comp's width and its capitals about 22 % of the comp's height (measured, see layout). 100 px capitals in this font would be about 70 px, 6.5 % of 1080, so the word is about 3.4 times larger than the Character panel's 100 px gives. The panel reads 100 px with the layer selected and Transform stays collapsed in every frame, so the cause (a layer scale of about 340 %, or another size) is not shown. Build to the measured size, not to 100 px (measured)
   - Comp: 1920x1080 (shown, the solid dialog later uses comp size), 23.976 fps (shown timeline)
2. Switch on the layer's 3D Layer switch (said; shown — cube icon on, transform gizmo with Z axis in the viewer)
3. Make sure the comp renderer is Advanced 3D (said; shown — Advanced 3D ticked in the viewer's renderer menu)
4. Extrude the text: open Geometry Options and drag Extrusion Depth up from 0 (said "extrude"; shown drag starting at 0)
   - Extrusion Depth: 20.0 (shown)
5. Set Bevel Style to Convex to round the edges (said; shown)
   - Bevel Style: Convex (shown)
   - Bevel Depth: 2.0 (shown; already 2.0 before any change, so left at its default)
   - Hole Bevel Depth: 100.0% (shown; already 100.0%, left at its default)
6. In the layer's Material Assignment group click Add Override and choose All; this adds Front, Bevel, Side and Back slots, each at Default (said; shown)
7. First route, per face: in the timeline, set the Front dropdown under Material Assignment to the rusty-metal .sbsar; only the front faces take the texture (shown — Front set to the material, Bevel/Side/Back at Default, textured fronts in the viewer); that the bevels and sides stay white cannot be seen there, as the straight-on view hides them (inferred from the Default slots)
8. Put Front back to Default (shown — all four slots Default again)
9. Open the Properties panel with the text layer selected; it replaces the right-hand panel's tab (shown "Properties: STYLE" tab; menu path Window > Properties is inferred)
10. In the Properties panel's Material Assignment section, with Front/Bevel/Side/Back listed together, pick the material from the single Material dropdown so every face gets it at once (said; shown dropdown at Default, set to the rusty-metal .sbsar, "Used 12 times")
   - Material: a rusty painted-metal .sbsar (shown)
   - Resolution: 1024 (shown; not touched — inferred)
11. Scale the texture down; the author says this makes it look richer in detail (said; value shown). The frames do not show the feature size shrinking steadily with Scale: at 100 % fine rust bands and small blue lumps, the same layout on every letter; at 48 % almost uniform pale blue with small specks; at 17 % with Randomize Offset large pale-blue areas with rust patches up to about two strokes across. Aim for the look in layout, not the number (measured)
   - Scale: 17%, 17% (linked) (shown)
   - Uniform Tiling: on (shown; already on — inferred)
12. Tick Randomize Offset so each letter samples a different part of the texture (said; shown, timeline row reads Randomize Offset On)
   - Randomize Offset Seed: 0 (shown)
   - Texture Offset: 0%, 0%; Rotation: 0x+0° (shown, untouched)
timing and easing: none given (the technique is static)
variations: Any material from the Substance 3D Community Assets library can be dropped in (said, browsed on screen). Each face slot (Front/Bevel/Side/Back) can take its own material from its timeline dropdown: the front-only version is shown (textured fronts, plain white bevels and sides) before the author reverts it and textures all faces from the Properties panel.
pitfalls: none given
layout: measured against the comp frame, only on frames where the recording's editor has not zoomed the interface (both at 44.7 %, show the word at 48 % and 58 % of the comp, so zoomed frames are not used). The comp's size on screen comes, where the pale backdrop fills the comp at 44.7 % viewer zoom: 1470 x 826 px in the full frame. At (44.8 %, same interface scale as) the word measures 744 x 181 px: about 51 % of the comp's width, capitals about 22 % of its height (measured). At the result frame (viewer 63.3 %) the word is 1128 x 288 px; the interface there is itself enlarged about 1.06 times (Character panel rows 332 px apart against 314), so the comp is about 2200 x 1240 px on screen and the word again about 51 % by 23 % (measured; the extra height is the bevel and extrusion). This is the target size; 100 px type does not give it (step 1). Centred on the comp both ways, assuming the viewer is centred on the comp (inferred).
Everything else in the picture: a plain black background (the comp's own, no layer; measured). Seen straight on through the default camera, no camera layer (viewer label "Active Camera (Default)", shown; inferred that no camera exists). No light layer exists yet, so the shading is After Effects' default lighting (inferred): each letter's rounded rim is lit at its upper left and darker at its lower right, and the sides barely show. The texture on all five letters, every face: pale blue covers about 60 % of the letter area (measured: 59 % of letter pixels are bluish), the rest rust in brown, orange and grey-blue, a different region on each letter (measured). The rust comes in big patches: the largest about two letter strokes across, about 15 % of the word's width, the next ones about 11.5, 11.5 and 10 %, down to about 7 % (proof review's measurement). The letters differ strongly in how much rust they carry: paint per letter from left to right about 67, 83, 56, 47 and 43 % (measured; the review gives 68, 83, 58, 51, 44 %), so the first two letters are mostly paint and the last three about half rust. Rust also runs round the letters' edges, giving each a dark worn outline: only about 41 % of the outer 7 to 10 px band of the letters is paint, against about 65 % inside (measured, outer 8 px band at the result frame's scale; the review gives 41 %)
build notes: comp.renderer = "ADBE Calder" (Advanced 3D; found by the proof build. "ADBE Advanced 3d" is Classic 3D in After Effects 27 and hides Geometry Options); textLayer.threeDLayer = true. Geometry Options live under the text layer as "Geometry Options" (Bevel Style dropdown: None/Angular/Concave/Convex; Bevel Depth; Hole Bevel Depth; Extrusion Depth) and can probably be set by script by display name (inferred). Material Assignment > Add Override and assigning an .sbsar material are new in After Effects 27. Assigning the material (Material Assignment > Add Override > All, then the Material dropdown) and fetching a Substance material cannot be done by script (found by the proof build): they are hand steps in the interface. That hand step was not available in the owner's After Effects: on 2026-11-19, with the 3D text layer selected, the owner found no Material section in the Properties panel (only Layer Transform, Text, Paragraph and Text Animation), so the Substance material could not be applied to 3D text there; the proof build uses a scripted stand-in instead (a tile on the faces). Whether the texture properties (Uniform Tiling, Randomize Offset, Scale) can be set by script once the material is assigned is not known; they appear under Material Assignment > Front in the timeline (shown). The .sbsar must first be imported into the project.
unknowns: Why the owner's After Effects showed no Material section in the Properties panel for 3D text (2026-11-19) when the tutorial's does : a different version or a setup difference, not known. Why the word is about 3.4 times the size 100 px gives (layer scale, a different font size, or something else; not shown). The import of the .sbsar files is not shown — seven materials are already in the project's Material dropdown; the material's own parameters (only Resolution 1024 and Random Seed 0 seen); the lighting in the viewer at this stage (no light layer yet, so After Effects' default lighting — inferred). The result window is short: the view is still shifting and a panel border sits in the crop, and the screen shows a browser.

## Warm-sided metal title: textured faces, plain tinted sides
id: 07-gold-face-plain-sides-look
revision: c21c2d9c
job: reveal-headline; support: light-the-hero
status: unproven
what it does for a beat: A fast restyle of an already-built textured 3D title when you want a warmer, more polished metal read without rebuilding the material: keep the texture only where it matters and let the extruded sides catch light as a tinted metal.
what it looks like: Chunky extruded capital letters on a pale sky-blue background with a dark, soft floor shadow falling towards the camera; the front, bevel and back keep a rusted blue-grey painted-metal texture while the sides become smooth, bright, almost white metal (only a faint warmth is left once the shininess is raised), flashing brightest where the backlight hits the edges.
ingredients:
- Builds on the scene of 01 to 06; this span only changes the existing text layer. So this recipe stands alone, the scene it needs is (figures from those recipes, all shown in their own spans):
  - Text (01, 05): one word, Poppins Black 100 px, layer Scale 472 %, 3D layer, comp renderer Advanced 3D, comp 1920x1080 at 23.976 fps; Geometry Options Extrusion Depth 20, Bevel Style Convex, Bevel Depth 2, Hole Bevel Depth 100 %; Material Assignment > Add Override > All, every face set to one rusty blue-grey painted-metal Substance material (.sbsar), texture Scale 17 %, Uniform Tiling on, Randomize Offset on (seed 0). Any rusted painted-metal material of the same kind will do.
  - Backdrop and floor (02): a 2D comp-size solid #B5E7FC at the bottom of the stack; a duplicate of it switched to 3D, X Rotation 90°, Position 960,721,0, Scale 627 %, Material Options > Accepts Shadows: Only.
  - Environment light (02): X Rotation −25°, Y Rotation keyed 235° at 0 s to 195° at 0:00:04:23 (linear), Intensity 187 %, Casts Shadows On, Shadow Darkness 100 %. This backlight gives the shadow towards the camera and the bright side edges.
  - Parallel light (03, 04): Position 2920,−100,2663.3, Point of Interest 960,540,0, Intensity 216 % (03 sets 407 %, 04 lowers it to 216 %), Casts Shadows Off.
  - Point light (04): Position 456,530,−666.7, Intensity 100 %, Falloff Smooth, Radius 589, Falloff Distance 373, Casts Shadows Off.
  - Letter entrance (05) and camera (06): a 50 mm two-node camera with Depth of Field On, Aperture 30.3, Focus Distance 2343.7, parented to a 3D null whose Z Position goes 0 to 231 over 0 to 0:00:04:23. The result below is at comp time 0:00:04:10, with the letters landed (shown in the timecode of the).
- Advanced 3D text layer, Material Assignment override (Front / Bevel / Side / Back dropdowns) — built-in, After Effects 27; text layer > Material Assignment (shown)
- Material Options > Specular Shininess — built-in; text layer > Material Options (shown)
- Character panel fill colour (Text Color dialog) — built-in (shown)
steps:
1. Start from the finished textured title of technique 01: in the text layer's Material Assignment group the Front, Bevel, Side and Back faces each use the rusted-metal material (shown).
2. Remove the texture from the extruded sides only: set the Side dropdown under Material Assignment back to Default; Front, Bevel and Back keep the material (said; shown).
   - Side: Default (shown)
3. Change the base colour of the text to a pale yellow so the now-untextured sides read as warm metal; the Text Color dialog is open from the Character panel fill swatch (said "yellowish"; shown; how the dialog was opened is inferred from the Character panel swatch changing).
   - Text Color: H 34°, S 32 %, B 100 %, #FFDCAD (shown, dialog still open; applied colour visible in the Character fill swatch)
4. Open Material Options on the text layer and raise Specular Shininess to 100% (said; shown). It read 5% just before the change (shown in a) and was dragged up through 11% and 98% to land at 100%. The viewer does not redraw ("Interactive Render Quality" label) and settles; only then do the sides lose most of their cream tint and turn almost white (measured: bright side pixels about 245,245,224, before the redraw, against about 246,244,241).
   - Specular Shininess: 100% (shown)
   - Other Material Options left as they were: Casts Shadows On, Accepts Shadows On, Accepts Lights On, Ambient 100%, Diffuse 50%, Specular Intensity 50%, Metal 100% (shown)
5. Carry-over: the pale yellow fill and Specular Shininess 100% are not changed again in technique 08 and give that look's rims their warm glint (inferred: no further change seen; fill swatch still pale yellow).
6. Not a step: around the author switches the Parallel Light 1 eye off and it is on again; this is a quick comparison, not part of the look (inferred).
layout: (all measured on the result frame; the viewer picture there spans x 689–2143, y 154–972 at full size, the whole comp seen through 06's camera) word centred horizontally, spanning about 10% to 92% of the picture width (about 82% wide) (measured); cap tops at about 32% and letter bottoms/floor contact at about 67% of the picture height, so letters are about 35% of the picture height (measured). Background flat pale sky blue #B5E7FC (181,231,252) above the floor line (measured; from 02's backdrop). Floor shadow (from 02's environment backlight on the shadow-only floor): falls from the letter bases towards the camera, soft, no hard edge; darkest just under the letters at about 69% of the height, about 33,44,47 (about 0.19 of the sky's brightness), then lightening steadily: about 75,96,105 at 72%, 86,110,119 at 80% and 129,164,179 at the bottom edge (about 0.7 of the sky) (measured). Sides: smooth, untextured, near-white metal, about 246,244,241 at their brightest, brightest on the edges the backlight catches (the right side of the S and the left sides of the L and E) (measured; from steps 2 to 4 with 02's backlight). Front faces: the blue-grey rusted paint of 01, shifted per letter, with the S and T showing the most rust (from 01). No grain or vignette.
timing and easing: none given (no keyframes are set in this span; the existing camera push and letter animation from 05–06 are untouched).
variations: The narrator offers this as one example of how quickly the style can be changed; the colour is described loosely as "yellowish" (said).
pitfalls: none given by the author. On screen, raising Specular Shininess to 100 % makes the sides whiter and less yellow, not more golden, although the narration presents it as the step that gives the gold (shown:). The cream tint comes from the #FFDCAD fill and is strongest while shininess is still 5 %. Judge the result on the near-white sides of the result frame, not on the narration (inferred from the measurements). The viewer redraws about 0.5 to 1 s after a value lands, so a frame taken right after a change shows the old state.
build notes: By script, on the text layer: the Material Assignment group and its Side override are new in After Effects 27 (names exactly as shown: "Material Assignment", "Front", "Bevel", "Side", "Back"; set Side to "Default"); scripting access to these overrides may not exist yet, so plan to do step 2 by hand in the Timeline if the property cannot be found. Fill colour: set via the TextDocument fillColor [1, 0.863, 0.678]. Specular Shininess sits under "Material Options" as the timeline shows it and can be set to 100 by script; find it by its display name, as its match name is not known (walk the group by script to read it).
unknowns: Whether the text colour was changed through the Character panel swatch or another route (only the dialog is seen); the light and floor settings are not shown again in this span, so the figures under ingredients are those last shown in 02 to 06 (the timeline lists the same layers: null, camera, point, parallel and environment lights, the text).

## Hollow chrome outline title: faces hidden, bevels and walls remain
id: 08-outline-only-3d-title
revision: fdb05df9
job: reveal-headline; support: light-the-hero
status: unproven
what it does for a beat: A cut-out, stroke-like 3D title for a sleek or dark mood: the letter faces vanish and only the rounded bevels and the extrusion walls remain, so the word reads as a hollow metal outline standing on a floor.
what it looks like: The same chunky extruded word, now with see-through front and back faces. Each letter is outlined twice by a thin, bright, rounded metal tube (the convex bevel at the front edge and again at the back edge), with the darker, grainy side walls showing between the two tubes inside the hollow letters. First shown on the pale blue background, then on a near-black background where the tubes glint pale silver-gold, with only a thin dark contact line under the letters.
ingredients:
- Continues directly from technique 07's state, itself a variant of 01 (bevelled advanced-3D text with Material Assignment overrides) lit as in 02–04: the text fill is still pale yellow #FFDCAD (Character swatch shown) and Material Options > Specular Shininess is still 100% (set in 07, not changed here: inferred). These two settings give the rims their warm glint; starting from 01's white fill and low shininess will not match.
- So this recipe stands alone, the scene it needs (figures from those recipes, each shown in its own span):
  - Text (01, 05): one word, Poppins Black 100 px, layer Scale 472 %, 3D layer, comp renderer Advanced 3D, comp 1920x1080 at 23.976 fps. Geometry Options: Extrusion Depth 20, Bevel Style Convex, Bevel Depth 2, Hole Bevel Depth 100 % (01). The bevel is what makes the bright tubes: Front and Back Opacity hide only the flat front and back faces, not the bevel, so without a convex bevel the result is flat ribbon walls. Extrusion Depth sets how much grainy wall shows between the two tubes.
  - Floor (02): a 3D comp-size solid, X Rotation 90°, Position 960,721,0, Scale 627 %, Material Options > Accepts Shadows: Only, so only shadows show on it; the 2D backdrop solid below it is replaced or covered by the dark solid of step 5.
  - Parallel light (03, 04): Position 2920,−100,2663.3, Point of Interest 960,540,0, Intensity 216 % (03 sets 407 %, 04 lowers it to 216 %), Casts Shadows Off.
  - Point light (04): Position 456,530,−666.7, Intensity 100 %, Falloff Smooth, Radius 589, Falloff Distance 373, Casts Shadows Off.
  - Environment light (02, retuned in steps 6 and 7 here): X Rotation −25°, Intensity 187 %, Casts Shadows On, Shadow Darkness 100 %.
  - Letter entrance (05) and camera (06): a 50 mm two-node camera with Depth of Field On, Aperture 30.3, Focus Distance 2343.7, parented to a 3D null whose Z Position goes 0 to 231 over 0 to 0:00:04:23. The result is at comp time 0:00:04:10, letters landed (shown in the). The entrance animator from 05 stays on the layer: when the author plays the comp from 0 s right after the still, the outlined letters tumble in as in 05 (shown).
- The lights, floor and camera are not changed in this span apart from steps 6 and 7; the timeline lists null, camera, point, parallel and environment lights, the text, the floor and the dark solid (shown in a).
- Advanced 3D text layer, Material Assignment overrides — built-in, After Effects 27 (shown)
- Text animator properties Front Opacity and Back Opacity — built-in, After Effects 27; Animate > Front > Color > Opacity (shown), then the animator's Add > Property > Back > Color > Opacity (shown)
- Solid layer for the background — built-in (Solid Settings dialog shown)
- Environment Light (Light Options: Environment) — built-in (shown)
steps:
1. Remove every texture from the title: under the text layer's Material Assignment set Front, Bevel, Side and Back all to Default (said; partly done with Bevel, Side and Back on Default; all four Default).
   - Front / Bevel / Side / Back: Default (shown)
2. On the text layer click Animate and choose Front > Color > Opacity; this adds a new animator, Animator 2 (shown), beside the existing Animator 1 (inferred: the letter entrance from 05) holding Front Opacity (said; menu shown; Front Opacity 100% in Animator 2 shown).
3. In that same animator use Add > Property > Back > Color > Opacity to add Back Opacity (said; menu shown).
4. Set both to 0% so the flat front and back faces disappear; the convex bevels at both edges and the side walls are still drawn (said; shown; the bevels' survival measured on the result). The animator's Range Selector 1 is left at its defaults (inferred: it is not opened).
   - Front Opacity: 0% (shown)
   - Back Opacity: 0% (shown)
5. Darken the background: a Solid Settings / Solid Color dialog is used to make a dark grey solid, and the bottom layer is a solid named as a second background; the panel already reads Effect Controls for that solid and the dialog is Solid Settings with "Affect all layers that use this solid", so the solid existed before its colour was set (said "change your background colour"; shown; the bottom layer reads as a new dark solid). The colour first tried is #0E0E0E (shown, dialog open; crop) and then #282828 (shown, dialog still open; crop).
   - Solid colour: #282828 (shown, dialog open). The background in the result frame measures RGB 23,23,23 (#171717) everywhere, inside the letters too, matching neither dialog value, so the final colour is not settled; aim for #171717 (measured on the).
6. On Environment Light 1, click the stopwatch of Y Rotation off, which deletes the keyframes it carried from technique 02; the value stays at 0x+198.5° and the light becomes static (not said; shown in cuts: the keyframe navigator and a keyframe are present, they are gone and the stopwatch is plain).
7. Retune the now-static light so the rims catch light from a better angle: drag Y Rotation from 0x+198.5° down to 0x+120.5° (said "adjust your environment lights rotation"; shown).
   - X Rotation: 0x-25.0° (shown, unchanged)
   - Y Rotation: 0x+120.5°, no keyframes (shown)
   - Intensity: 187% (shown; it was scrubbed down to 142% and 101% and left back at 187%)
   - Casts Shadows: On; Shadow Darkness: 100% (shown)
8. Not a step: the author briefly opens another comp holding a different textured word before returning; nothing there is changed (inferred).
layout: (measured on the result frame, a. There the viewer panel spans x 661–2102, y 360–1120 at full size and the comp, at the same 44.7 % zoom as in 07, runs slightly past the panel, so its edges are not visible.) The word measures x 812–1979, y 574–866 at full size, about 1167 x 292 px (measured). It is the same word at the same comp time and camera as 07's result, where it spans about 10% to 92% of the comp width and its caps run from about 32% to 67% of the comp height (measured on 07's); use those shares. Background flat #171717 (23,23,23), inside the hollow letters too (measured). Outline: on each letter a bright rounded tube at the front edge and another at the back edge, about 5 px wide at full size (about 1.7 % of the letter height) where seen edge-on, brightest pixels about 208,203,191 (pale warm silver) with highlights near white (measured; zoom); between the tubes the side walls show as darker, grainy bands, about 89,85,75 on average (measured), visible inside the counters and on the inner walls of the L and E. Floor: a thin near-black contact line right under the letter bases (about 3 to 6 at y 868), then a faint shadow that rises from about 17 back to the background's 23 within about 25 px below the bases (measured); no long shadow is visible on the dark background. Light: the brightest glints sit on the S's right-hand curve and on the inner walls of the L and E (seen on the result crop), from the environment light at Y 120.5° plus 03's parallel light and 04's point light.
timing and easing: none given. No keyframes on Front/Back Opacity, and the environment light's Y Rotation keyframes from 02 are deleted in step 6, so the light is static in this look (shown).
variations: The background colour and the environment light's rotation should be set to suit your own build (said).
pitfalls: none given
build notes: By script: Material Assignment overrides are new in After Effects 27 and may not be exposed to scripting; set them to Default by hand if needed. The animator: add a Text Animator to the text layer ("ADBE Text Animators") and, if the AE 27 per-face colour properties are scriptable, add the properties shown as "Front Opacity" and "Back Opacity" and set both to 0; otherwise add them by hand via Animate > Front > Color > Opacity and Add > Property > Back > Color > Opacity. Background: comp.layers.addSolid([0.157,0.157,0.157], ...) placed at the bottom. Light: on Environment Light 1 remove all Y Rotation keyframes (while numKeys > 0 removeKey(1)), then set Y Rotation = 120.5 as a static value; Intensity 187. Keep the text fill [1, 0.863, 0.678] and Specular Shininess 100 from 07. Keep 01's Geometry Options (Bevel Style Convex, Bevel Depth 2, Hole Bevel Depth 100, Extrusion Depth 20): the bright tubes are the bevel. The dialog shows #282828 ([0.157,0.157,0.157]) but the result measures #171717; to match the picture use [0.09,0.09,0.09].
unknowns: Whether the dark background is a new solid or the old one recoloured (the layer name changes, so a new solid is likely); which colour was kept (#0E0E0E and #282828 are seen in the dialog, the picture measures #171717); the Range Selector settings of the new animator.

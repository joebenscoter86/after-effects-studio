# Techniques from one video (6 recipes, all unproven)

Written by the channel learner from the video's narration and screen together, then checked against the video by a second reader. Every recipe here passed that check; none has been accepted by Joe, and none is in the plugin. `status: unproven` means it has not been built in After Effects and compared with the tutorial's own result.

Each step is marked `said` (narrated), `shown` (on screen; `fNNNNNN` is a frame in the local study folder, frame number divided by the video's frame rate is seconds) or `inferred` (our reading). The `source` and frame references are for checking and stay out of the plugin. Credits: `CREDITS.md`.

| # | Technique | Jobs | Check passed in round |
|---|---|---|---|
| 01 | Soft one-way blurred dark shapes with a bright stroke fringe on a pale ground | depth and finish; glow and colour; lines and shapes | 2 |
| 02 | Breathing glow, darkest radial blur and fine grain finish for bright scenes | glow and colour; depth and finish; texture | 2 |
| 03 | Drifting pockets of light from heavily blurred edge shapes | shadows and light; depth and finish; glow and colour | 3 |
| 04 | Liquid merge of outlined circles with blur and choke | lines and shapes; depth and finish; B-roll scenes | 2 |
| 05 | A dark mass split open behind a travelling ball | lines and shapes; transitions; depth and finish | 3 |
| 06 | Turning a crude gradient disc into a grainy glowing orb | depth and finish; glow and colour; texture | 2 |

## Soft one-way blurred dark shapes with a bright stroke fringe on a pale ground
id: 01-blurred-stroked-shapes-on-light-ground
status: unproven
source: 8oVLS0ZlKC4 13.76–61.52 s
jobs: depth and finish; glow and colour; lines and shapes
what it does for a beat: Turns two flat, crude shapes into a soft, lens-like backdrop in under a minute. Reach for it when a title or scene needs an organic, out-of-focus base layer rather than hard vector art.
what it looks like: Two huge near-black navy circles, one pushing in from above the frame and one from below, leave an hourglass of pale ice-blue light between them. Their edges are smeared vertically into wide soft gradients, and a saturated blue stroke on the circles shows as a thin blue band where dark meets light.
ingredients:
- Shape layers drawn with the Ellipse tool — built-in; toolbar Ellipse tool (shown f001259)
- Solid layer for the background — built-in; Layer > New > Solid (inferred; the Solid Settings dialog is shown f002050)
- Gaussian Blur — stock; found by typing in the Effects & Presets panel, where it sits under Blur & Sharpen (shown f002389)
- Shape stroke — built-in; set from the toolbar Stroke swatch and width with both shape layers selected (shown f003664)
steps:
1. With the Ellipse tool, draw a very large circle whose lower edge dips into the top of the frame; zoom the viewer well out (about 12–15 %) so it can extend far past the edges (said; shown f001626)
   - Fill: a very dark blue, close to black (said "darkest blue"; the sampled fill reads about RGB 2, 11, 23 — inferred from pixels)
   - Stroke: none at this stage (shown f002948, toolbar Stroke swatch crossed out)
2. Draw a second, equally large circle whose upper edge rises into the bottom of the frame, so the two leave a curved hourglass gap in the middle (said; shown f001626, f002152)
3. Add a solid that fills the comp, set its colour to a very pale blue and put it at the bottom of the stack (said; shown f002152)
   - Color: R 228, G 244, B 255 (#E4F4FF) (shown f001970)
   - Size: 1920 x 1080, same as comp (shown f002050)
4. Apply Gaussian Blur to the lower circle (said; shown f002948)
   - Blurriness: 103.6 (said "around 100"; shown f002948)
   - Blur Dimensions: Vertical (shown f002948; the menu is opened from the default Horizontal and Vertical at f002700 and Vertical is picked by f002800). The narrator suggests trying both one-way options; only Vertical is shown being chosen (said / shown)
   - Repeat Edge Pixels: off — the author calls this the most important part (said; shown f002948)
5. Give the upper circle the same Gaussian Blur with the same three settings (shown f003441; how it was copied is not shown — copy and paste of the effect is inferred)
6. Select both circle layers and give them a bright blue stroke from the toolbar (said "light colour"; shown f003664)
   - Stroke Width: 9 px (shown f003664; it passes through 10 px while being dragged in f003441)
   - Stroke Color: R 0, G 130, B 255 (#0082FF) (shown in the Shape Stroke Color dialog at source 60.5 s, frame 3630, as OK is pressed; the landed blue swatch is shown f003664). The narrator says a light colour; the screen shows a saturated mid blue, and the screen wins. A paler blue (about #5598D8) is tried just before (shown at source 59.5 s).
layout: each circle is about 1.5 times the picture width across, so both overhang the left and right edges (measured on f001626, where the selected circle's box is about 387 px against a 255 px wide comp; not measurable on the blurred result frame); on the result frame the pale gap, measured at half brightness, runs from about 42 % to 55 % of the picture height near the centre and widens to about 18 % to 79 % at the left edge (measured on f003680); the gap is centred horizontally and roughly symmetric top to bottom (measured)
timing and easing: none given (nothing is animated in this part; the motion comes in technique 02)
variations: any shapes can stand in for the circles (said); either one-way blur direction can be used, swapping between Horizontal and Vertical for a different distortion (said)
pitfalls: leaving Repeat Edge Pixels on is the thing to avoid — it is stressed as the key setting (said); no other warnings given
longest on: the Gaussian Blur step, about 15 s (36.8–52.2 s), against about 8 s drawing the circles, 9 s on the background and 9 s on the stroke; within it the author stresses switching Repeat Edge Pixels off
build notes: Shape layers: comp.layers.addShape(), add "ADBE Vector Group" > "ADBE Vector Shape - Ellipse" (Size about 1.5x comp width, about 2900 px on a 1920 comp, measured — no value is given in the video), "ADBE Vector Graphic - Fill" (Color) and "ADBE Vector Graphic - Stroke" (Color, Stroke Width). Background: comp.layers.addSolid([228/255,244/255,1], name, 1920, 1080, 1) moved to the bottom. Effect: layer.Effects.addProperty("ADBE Gaussian Blur 2"); properties "Blurriness" = 103.6, "Blur Dimensions" = 3 (1 Horizontal and Vertical, 2 Horizontal, 3 Vertical), "Repeat Edge Pixels" = 0. All of this can be done by script; nothing here needs the interface. Comp: The composition reads 1920 x 1080 at 60 fps (solid "100% of comp" at 1920 x 1080, shown f002050; 60.00 fps under the timecode, shown f002152). Comparison crop: the frame is cut from source.mp4 (saved as scratch/01/f003680.png). Both circle layers stay selected to the end of this part, so their anchor and path handles sit at the centre of the picture; the crop is the left 47 % of the picture, which holds the blurred edges, stroke fringe and pale gap without handles or the mouse. The whole viewer picture at that moment spans about x 800–2576, y 380–1379.
result: start=61.2 end=61.5 still crop=806,384,834,990 frame=f003680
before: f002152 (the two hard-edged circles on the pale solid, no blur, no stroke)
unknowns: the exact fill colour of the dark circles (only sampled from pixels); the circles' exact size and position; how the blur was copied to the second circle; whether the stroke is added before or after the blur in the layer's contents order (default order assumed); the stroke's line join and other stroke options

## Breathing glow, darkest radial blur and fine grain finish for bright scenes
id: 02-glow-radial-blur-noise-finish-stack
status: unproven
source: 8oVLS0ZlKC4 61.52–127.12 s
jobs: glow and colour; depth and finish; texture
what it does for a beat: A three-adjustment-layer finish that makes any soft, light-backed composition bloom, pulse and gain film grit, with motion coming only from wiggle expressions. Use it over a blurred or abstract backdrop (in the tutorial, the blurred shapes of technique 01) when the frame feels static and digital.
what it looks like: The pale gap between two dark soft forms blooms into a near-white glow whose edges turn electric blue; the light slowly swells and recedes, the dark edges are pulled toward the centre by a radial streak, and a fine monochrome grain sits over everything.
ingredients:
- Adjustment layers (three) — built-in; Layer > New > Adjustment Layer, Ctrl+Alt+Y on Windows (menu shown f004024)
- Glow — stock (Stylize category; applied from the Effects & Presets search, inferred)
- CC Radial Fast Blur — stock (Blur & Sharpen category, inferred)
- Noise — stock; Noise & Grain > Noise in the Effects & Presets panel (shown f007370)
- wiggle() expressions — built-in; Alt-click the property's stopwatch (said)
steps:
1. Start from a composition with a bright, pale background and soft dark shapes over it (the result of 01, or any similar light-ground scene) (shown f003664)
2. Add an adjustment layer on top of the stack (said; shown f004024 for the menu, f005197 for the layer)
3. Apply Glow to it and push the threshold to the top and the radius very high, because the background is bright (said; shown f005197)
   - Glow Based On: Color Channels (shown f005197)
   - Glow Threshold: 100.0 % (said "max out"; shown f005197)
   - Glow Radius: 331 (said "highly increase"; shown f005197)
   - Glow Intensity: 0.3 (said "lower the intensity"; shown f005704)
   - Composite Original: Behind; Glow Operation: Add; Glow Colors: Original Colors; Color Looping: Triangle A>B>A; Color Loops: 1.0 (left at defaults; shown f005197, f005704)
   - Glow Dimensions: reads "Horizontal..." truncated; taken to be the default Horizontal and Vertical (inferred from f005704)
4. Alt-click the Glow Radius stopwatch and enter a wiggle expression (said; shown f005704)
   - Glow Radius expression: wiggle(2,100) (shown f005704)
5. Duplicate the Glow effect on the same adjustment layer, so a second Glow with the same settings and the same radius expression sits under the first (said "duplicate the effect"; shown f005926, where the copy reads Threshold 100.0 %, Intensity 0.3 and an expression-driven radius)
6. Add a second, separate adjustment layer above the first (said; shown f006133)
7. Apply CC Radial Fast Blur to it (said; shown f006937)
   - Center: 960.0, 540.0, the comp centre (default; shown f006937)
   - Amount: 95.0 (said "around 95"; shown f006937)
   - Zoom: Darkest, chosen because the background is bright (said; shown f006937)
8. Alt-click the Amount stopwatch and add a wiggle (said; shown in a crop of f007138, saved as scratch/02/f7138.png)
   - Amount expression: wiggle(2,10) (shown f007138)
9. Optional: add a third adjustment layer on top and apply Noise for grit (said "if you want"; shown f007610)
   - Amount of Noise: 9.0 % (shown f007610)
   - Use Color Noise: off, unticked from its default of on (shown f007610; still on at source 124.8 s, off from 125.0 s)
   - Clip Result Values: on (shown f007610)
layout: the adjustment layers are full-frame, comp-sized — the noise layer's handles sit on the picture's corners and edge midpoints at 124.6 s and the glow layer's at f005197 (measured); the radial-blur layer's size is never shown and is taken to be the same (inferred); the CC Radial Fast Blur centre is at the comp centre, 50 % / 50 % of the picture (measured from Center 960, 540 on a 1920 x 1080 comp, f006937); the underlying shapes are as in 01 (measured there)
timing and easing: no keyframes; all motion comes from wiggle expressions — wiggle(2,100) on both Glow Radius values and wiggle(2,10) on the radial blur Amount, i.e. two random moves a second (shown f005704, f005926, f007138)
variations: on a bright background the glow wants maximum threshold and the radial blur wants Darkest (said); by implication a dark background would use other settings, but none are given here; the Noise layer is optional (said)
pitfalls: too much glow intensity overpowers the image, so keep it low (said); none other given
longest on: the Glow layer, about 41 s (61.5–102.9 s), including about 16 s on the wiggle and the duplicate; CC Radial Fast Blur gets about 16 s (102.9–119.0 s) and Noise about 8 s (119.0–127.1 s)
build notes: Each adjustment layer: comp.layers.addSolid([1,1,1], name, comp.width, comp.height, 1) then layer.adjustmentLayer = true, added so it sits above the scene. Glow: Effects.addProperty("ADBE Glo2"); set "Glow Threshold" (100 %), "Glow Radius" (331), "Glow Intensity" (0.3); check how the threshold is scaled by script before setting it. Then glowRadius.expression = "wiggle(2,100)"; the duplicate is easiest as effect.duplicate() or a second addProperty with the same values and expression. CC Radial Fast Blur: matchName "CC Radial Fast Blur"; "Center" [960,540], "Amount" 95 with expression "wiggle(2,10)", "Zoom" menu = Darkest (menu index 3 in Standard/Brightest/Darkest order — verify). Noise: "ADBE Noise"; "Amount of Noise" 9, "Use Color Noise" 0, "Clip Result Values" 1. Layer order from bottom: scene, glow layer, radial-blur layer, noise layer (shown f008910). Comparison crop: frame cut from source.mp4 at 125.2 s (scratch/02/f007512.png); the noise adjustment layer is selected, so its handles sit on the picture's edges and centre — the crop is a left-side inset (about 43 % of the width) that avoids them; the whole viewer picture spans about x 760–2440, y 365–1300 at that time. The look wiggles, so compare the overall level and edge colour, not exact pixels. The mouse arrow flickers into the crop at 125.1, 125.3 and 125.4 s, so the clean stretch is only about frames 7507–7514 (125.12–125.23 s), checked frame by frame.
result: start=125.12 end=125.23 animated crop=790,400,730,850 frame=f007512
before: f003664 (the blurred, stroked shapes before any adjustment layer)
unknowns: whether the second Glow differs in any value (only threshold, intensity and an expression-driven radius are readable); how the Glow effect was found (likely the Effects & Presets search); whether anything was changed on the Glow Colors or Color A/B (they read Original Colors, white and black); blending modes of the adjustment layers (none changed on screen); noise defaults beyond those three values

## Drifting pockets of light from heavily blurred edge shapes
id: 03-blurred-light-shapes-at-frame-edges
status: unproven
source: 8oVLS0ZlKC4 127.12–147.12 s (the expression is finished and the result shown just after, up to 148.6 s)
jobs: shadows and light; depth and finish; glow and colour
what it does for a beat: Adds soft, moving patches of lighter tone around the edges of an otherwise finished frame, so the dark areas are not flat and the eye is pulled toward the centre. A quick pass to make a background feel lit and alive.
what it looks like: Inside the dark navy masses at the top and bottom of the frame, faint blue shafts and glows appear: one hazy patch spread sideways at the top centre and two vertical light columns rising from the bottom edge, all very soft and gently pulsing in strength.
ingredients:
- Shape layers drawn with the Ellipse tool — built-in (shown f008030)
- Gaussian Blur — stock; Blur & Sharpen (shown f008840)
- wiggle() expression — built-in (said; shown f008887)
steps:
1. Draw circles in a lighter blue than the dark shapes and place them so they are cut by the frame edges: one at the top centre and two along the bottom (said "around the sides"; shown f008030, f008270)
   - Fill: a mid blue, sampled at about RGB 53, 94, 160 (#355EA0) (inferred from pixels in f008030; the value is not shown)
   - Stroke: none (shown f008150, toolbar Stroke swatch crossed out; a Stroke Options dialog is used on the way, f007850)
2. Keep these new layers above the finishing adjustment layers from technique 02, so the glow, radial blur and noise do not act on them (shown f008150 and f008910 in the layer stack; not said — the effect of the order is inferred)
3. Give the circles Gaussian Blur with a very high blurriness, one-way on the bottom (said "vertical or horizontal"; shown f008840, f008750)
   - One bottom circle: Blurriness 599.6, Blur Dimensions Vertical, Repeat Edge Pixels off (shown f008840). The value appears first at 103.6, the dark shapes' value, before being raised, so the blur was probably copied from them (inferred)
   - Top circle: Blurriness 555.6, a fixed value shown in blue, not expression-driven (shown f008750); Blur Dimensions reads a truncated "Horizontal...", which is how this panel shows Horizontal and Vertical (a plain Horizontal would fit, as Vertical does), so Horizontal and Vertical is taken (inferred from f008750; at f008570 the menu is open with the pointer over Horizontal, so the pick is not certain); Repeat Edge Pixels off (shown f008750)
   - Other bottom circle: has an effect (fx switch, f008750) but its settings are never shown
4. Scale the top circle down (not said; shown f008840)
   - Scale: 70.0, 70.0 % (shown f008840; changed from 75 %)
5. Alt-click the Blurriness stopwatch and add a wiggle so the light pockets pulse (said; shown f008887)
   - Blurriness expression: wiggle(2,100) (shown f008887, on one bottom circle only; the top circle's 555.6 shows in blue, so it has no expression)
6. In the finished state the three light circles are parented to the lower dark shape from technique 01 (shown f008910; done off camera and not explained)
layout: each light circle is about 18 % of the picture width across before blurring (measured on f008150, about 132 px of a 714 px picture); the top circle is centred at about 48 % across with its centre on the top edge, then scaled to 70 % (about 13 % of the width; measured/shown f008840); the bottom circles are centred at about 28 % and 68 % across with their centres on the bottom edge, each cut in half (measured on f008150). On the result frame f008910 the two bottom light columns are centred at about 27 % and 67 % across and each about 17 % wide at the bottom, and the top glow is centred at about 49 % across, about 20–21 % of the width at half brightness (measured)
timing and easing: no keyframes; motion comes from wiggle(2,100) on Blurriness (shown f008887)
variations: Vertical or Horizontal can be chosen per shape (said); placement and number of shapes are free (inferred from "around the sides")
pitfalls: none given
longest on: drawing and placing the light circles, about 9 s (127.1–135.9 s); the blur gets about 8 s (135.9–143.6 s) and the wiggle about 4 s spoken plus typing to 148.1 s. The author stresses not forgetting the wiggle.
build notes: Three shape layers with "ADBE Vector Shape - Ellipse" and "ADBE Vector Graphic - Fill" (no stroke), moved above the adjustment layers (layer.moveToBeginning() or moveBefore). Effects.addProperty("ADBE Gaussian Blur 2"): bottom circle "Blurriness" 599.6 with blurriness.expression = "wiggle(2,100)", "Blur Dimensions" 3 (Vertical); top circle "Blurriness" 555.6, no expression, "Blur Dimensions" 1 (Horizontal and Vertical, most likely); "Repeat Edge Pixels" 0 on both. The second bottom circle is not shown; mirroring the first is a guess. Top circle transform "Scale" [70,70]. Parenting: layer.parent = the lower dark shape. Everything is scriptable. Comparison crop: frame cut from source.mp4 at 148.5 s (scratch/03/f008910.png). At this moment the recording's UI is zoomed and the viewer picture spans about x 744–2386, y 156–1080; the crop is slightly inset to stay clear of panel edges. It is the only clean stretch: before 148.45 s a circle is selected and shows handles, and from 148.65 s title text starts to animate in over the picture. The look is still, apart from the wiggle.
result: start=148.5 end=148.6 still crop=760,170,1610,890 frame=f008910
before: f007790 (the finished look from 02 with no light shapes)
unknowns: the light circles' fill colour (only sampled); the second bottom circle's blur settings and whether it has the expression; whether the top circle's Blur Dimensions is Horizontal and Vertical or Horizontal (the display points to the former); why the circles are parented to the dark shape; whether their opacity or blending mode was changed (nothing seen)

## Liquid merge of outlined circles with blur and choke
id: 04-blur-and-choke-gooey-morph
status: unproven
source: 8oVLS0ZlKC4 183.12–257.76 s
jobs: lines and shapes; depth and finish; B-roll scenes
what it does for a beat: Makes separate shapes fuse like drops of liquid when one drifts into another, so a plain layout of circles becomes an organic, slow-breathing background or a morph between two forms.
what it looks like: Near-black circles with a thin bright-blue rim on a pale cyan-white ground; where two circles touch they bulge into each other with a smooth neck instead of overlapping. After the finish the whole picture is soft and stretched vertically, with glowing blue edges and fine grain.
ingredients:
- Shape layers (Ellipse with fill and stroke) — built-in
- Adjustment layer — built-in
- Gaussian Blur — stock; Effects > Blur & Sharpen (menu path inferred; the search is not shown)
- Simple Choker — stock; Effects & Presets > Matte > Simple Choker (shown f012304)
- Pre-compose — built-in; Layer > Pre-compose (dialog shown f014065; menu path inferred)
- One Glow adjustment layer carrying two Glow effects, and one Noise adjustment layer, carried over from the finishing stack taught earlier in the video — stock
- 4-Color Gradient — stock; present on the shape layers in the finished example but switched off (shown f013700)
steps:
1. In a comp with a black background, draw several circles of very different sizes (one large pair, a few medium, one small), each its own shape layer with a near-black navy fill and a bright-blue stroke. (said: shapes that already carry a stroke; shown f011803, f012970)
   - Fill: about #020B17, near-black navy (shown f012970, toolbar swatch; hex sampled)
   - Stroke colour: about #0080FF (shown f013460, Stroke 1 Color swatch; hex sampled)
   - Stroke width: 9 px (shown f012970)
   - Stroke Composite: Below Previous in Same Group (shown f013460)
   - Number of shape layers: six (shown f012304)
2. Add an adjustment layer above all shapes and apply Gaussian Blur at exactly 100. (said; shown f012601)
   - Blurriness: 100.0 (said "exactly 100"; shown f012601)
   - Blur Dimensions: menu reads "Horizontal…" truncated; most likely Horizontal and Vertical (shown f012601; full wording inferred)
   - Repeat Edge Pixels: on (shown f012601)
3. On the same adjustment layer, below the blur, add Simple Choker and raise Choke Matte until the blur halo is gone and the shapes have hard, smooth edges again. (said; shown f012670)
   - View: Final Output (shown f012670)
   - Choke Matte: 14.20 (shown f012670)
4. Move one shape toward another; where they meet, the edges flow together. On screen the author drags a medium circle from the top left rightwards and slightly down into the very large top-right circle; the smallest circle stays put. (said; shown f012601 start, f012970 merged)
   - Position is keyframed in the finished example: motion paths are visible on several layers (shown f013820). The author's own keys and timing for the demo are not shown (inferred).
5. Animate the stroke away while two shapes fully merge, so the rim fades out during the join. (said; shown f013580, f013460)
   - Stroke Width: 9.0 → 0.0 (shown f013580 at 9.0 with the playhead before the keys; 0.0 landed at f013520)
   - Keys at about 3.1 s and 4.0 s comp time on one shape layer (shown f013580, keys read off the ruler; f013520 playhead 3:58 on the second key)
6. Select every layer (shapes and the blur/choke adjustment layer) and pre-compose them, moving all attributes into the new comp. (said; shown f014065)
7. In the parent comp put a pale background solid at the bottom. (said: white background at the bottom; shown f014591)
   - Colour: very pale cyan-white, about #CCFEF9 as rendered under the finish (inferred from the result frame; the solid's own value is not shown)
8. Apply the shape blur from the first technique to the pre-comp layer. (said; shown f014751)
   - Gaussian Blur Blurriness: 103.6 to start (shown f014751), then lowered (said) to about 55–60, last reading 57.9 (shown f015011)
   - Blur Dimensions: Vertical (shown f014751)
   - Repeat Edge Pixels: off (shown f014751)
   - Pre-comp layer Scale: 107% (shown f014751), later 109% (shown f015266); likely to push the soft, un-repeated edges off frame (inferred)
9. Apply the finishing stack from earlier: copy the Glow adjustment layer (one layer holding two Glow effects, Glow and Glow 2, shown f014382) and the Noise adjustment layer from the first technique's comp and paste them above the pre-comp (the earlier comp is opened to fetch them, shown f014382). Visible values in this span: (said; shown f014442, f014591)
   - Glow: Glow Based On Color Channels, Threshold 100.0%, Radius driven by an expression (value shown in red, 367.2 at that moment), Intensity 0.3, Composite Behind, Operation Add (shown f014442)
   - Noise: Amount of Noise 9.0%, Use Color Noise off, Clip Result Values on (shown f014591)
   - Layer order top to bottom: Noise adjustment, Glow adjustment, pre-comp, pale background (shown f014591). The earlier radial-blur adjustment layer is not copied here (shown f014591, f015266: only the two adjustment layers are present).
layout: measured on the result frame f015546, as shares of the cropped viewer picture (which is the whole comp): a large dark mass fills the left side, its right edge running from about 25% across at the top to about 50% across at the bottom, with a rounded bump (a merged circle) at its top-left reaching down to about 25% of the height (measured). A second large dark mass fills the upper right, its left edge at about 52% across at the top curving down to about 60% across at 50% height, and it necks down at about 80% across, 75% height, into a smaller lobe at the bottom right starting about 76% across (measured). The pale ground shows as a diagonal channel about 20–25% of the picture width wide, running from top centre to bottom right (measured). Blue rims about 2–3% of the width wide line every edge (measured).
timing and easing: Stroke Width 9 → 0 over roughly 3.1–4.0 s on one layer; easing not readable. Position animation in the finished example exists (motion paths, f013820) but its keys, durations and eases are not shown.
variations: Lower the pre-comp's blur amount to taste (said). The morph can be animated in any way (said).
pitfalls: The blur must be exactly 100 before the choker is tuned (said; the choke value 14.2 pairs with it, inferred).
longest on: Bringing in the finish (pre-compose, background, pre-comp blur, copying the adjustment layers): about 18 s (229.1–247.2 s), longer than any single step of the morph itself (blur about 8.5 s, choker about 7 s, stroke fade about 8 s). The author stresses that the blur must be exactly 100.
build notes: Shapes: ADBE Vector Group with ADBE Vector Shape - Ellipse, ADBE Vector Graphic - Fill, ADBE Vector Graphic - Stroke (Stroke Width 9, Composite "Below Previous in Same Group"). Adjustment layer: comp.layers.addSolid(...) with adjustmentLayer = true. Effects: "ADBE Gaussian Blur 2" (Blurriness, Blur Dimensions, Repeat Edge Pixels), "ADBE Simple Choker" (View, Choke Matte). Order matters: blur first, choker second, on the same adjustment layer. Stroke fade: keyframe the shape's Stroke Width. Pre-compose: comp.layers.precompose([indices], name, true). Pre-comp: "ADBE Gaussian Blur 2" Vertical, Repeat Edge Pixels off, Scale 107–109. Finish: two "ADBE Glo2" on one adjustment layer (first: Threshold 100, Intensity 0.3, Radius with a wiggle-type expression; second from technique 02) and "ADBE Noise" (Amount 9) on adjustment layers. 4-Color Gradient ("ADBE 4ColorGradient") sits disabled on the finished shapes and can be skipped. All of this can be scripted; dragging the shapes into each other is just Position keyframes.
result: start=259.08 end=259.17 animated crop=701,343,1546,868 frame=f015546 (cut from source.mp4 at 259.10 s; saved as scratch/04/f015546.png)
before: f011803
unknowns: Comp size (likely 1920x1080) and background colour value; exact Blur Dimensions setting of the adjustment-layer blur (menu text truncated); circle sizes and positions; position keyframes, durations and easing of the merge in the finished example; whether other layers also have stroke-width keys; final pre-comp blur value (dragging stopped near 57.9); the glow radius expression text and the second Glow's settings (from technique 02); why the shapes carry a disabled 4-Color Gradient.

## A dark mass split open behind a travelling ball
id: 05-path-opening-split-driven-by-moving-ball
status: unproven
source: 8oVLS0ZlKC4 260.0–328.8 s
jobs: lines and shapes; transitions; depth and finish
what it does for a beat: A small ball crosses the frame and a large dark form tears open behind it, revealing the light ground; good for line-led animation, progress moments or a reveal that clears space for a headline.
what it looks like: A near-black navy mass fills the frame; a white dot starts at the right edge and travels left along the middle, and behind it the mass parts into two curved lobes with a soft, glowing blue rim, opening a widening pale cyan wedge. The whole picture is soft and grainy from the finishing stack.
ingredients:
- Pen Tool — built-in; toolbar Pen Tool (shown f016086)
- Shape layer with fill and stroke (closed path) — built-in
- Ellipse shape layer for the ball — built-in
- Gaussian Blur on the split shape — stock
- Finishing stack from earlier in the video (Noise, Blur and Glow adjustment layers over a pale background) — stock
steps:
1. Start in a comp that already holds the finishing stack from earlier: three adjustment layers (noise, a blur layer, glow) above a pale cyan-white background solid. (shown f016086; the stack itself is "apply the finishing stack from earlier", values not visible in this span)
2. With the Pen Tool, draw one large closed shape that covers most of the frame, with long smooth curves; the author says to hold Shift while pulling out the curve handles. (said; shown f016086, f017090)
   - Fill: near-black navy (shown f016086 toolbar swatch)
   - Stroke: bright blue, 9 px (shown f016086 toolbar)
3. Make one vertex a hard point where the two curves meet: hold Alt (Option on Mac) on that vertex to break its handles so each side can be pulled separately. The point is centred vertically and about 23% in from the left edge, where the ball's last key will land (Position x 467.3 is about 24% of 1920). (said; shown f017090, tip measured on the full frame)
4. Drag the drawn shape layer down under the three adjustment layers, just above the background, so the finish applies to it. (not spoken; shown f017533: shape sits at position 5 of 6, under the adjustment layers)
5. Draw a small ball and leave it on top of the stack, above the adjustment layers, so it stays crisp. (said: add a sphere; shown f017413, f017533)
   - Diameter: about 3.4% of the comp width on the result frame at Scale about 126%, so about 50–55 px at 100% in a 1920-wide comp (measured on f019155). The Size field reads 20.9 at f017413 but is still being dragged there, so that is not the final value.
   - Fill: white; its Stroke 1 is switched off (shown f017413)
   - The ellipse was drawn off-centre and the layer's Anchor Point set to the ellipse (Anchor Point -492.7,-1.7 equal to the ellipse offset) (shown f017413; how the anchor was set is inferred)
6. Animate the ball's Position straight across the frame, right to left. (said: animate its position; shown f017593)
   - Position at 0 s: 1717.3, 538.3 (shown f017593)
   - Second key at about 4.9 s; value 467.3, 538.3, the ball's original spot near the point (shown f017413 / f017533 as the earlier value; that it is the end key's value is inferred)
7. Also animate the ball's Scale so it is bigger at the start and shrinks to normal by the end. (not spoken; shown f018108, f017899)
   - Scale: 169% at 0 s (shown f018108) → 100% at about 4.9 s (shown f017899)
8. Keyframe the split shape's Path so its opening follows the ball: at the end the pointed tip sits at the ball's final spot and the two lobes are wide open; at 0 s the tip and lobes are pushed to the right edge so only a thin pale strip shows. (said: animate the opening of the path; shown f017899 end state, f018228 start state, f018777 Path keys at 0 s and about 4.9 s)
9. Add Gaussian Blur to the split shape itself, copied from a background shape in the first technique's comp (shown f018854) and pasted at that value and then turned down to a low amount. (said: low blur; shown f019152)
   - Blurriness: 103.6 pasted (shown f018970), lowered to 30.0 (shown f019152)
   - Blur Dimensions: Vertical (shown f019152)
   - Repeat Edge Pixels: off (shown f019152)
layout: measured on the result frame f019155 (comp time 3:05), as shares of the cropped viewer picture (the whole comp): the ball's centre sits about 49% across and 50% down, diameter about 3.4% of the picture width (6% of the height) (measured). The pointed tip of the opening touches the ball; the pale wedge widens to the right, about 10% of the height tall at 70% across, and the pale ground fills the full height from about 90% across to the right edge (measured). The two dark lobes' rounded ends reach about 90% across, centred about 15% from the top and 15% from the bottom (measured). In the end state (f017899) the tip sits about 23% across (measured on the full frame).
timing and easing: Ball Position, ball Scale and the split shape's Path all keyed at 0 s and about 4.9 s (shown f017593, f017899, f018777); the work area ends there. Key icons look like plain linear diamonds (inferred); no easing is mentioned or shown.
variations: Suited to line-driven animation or anything that shows progress (said).
pitfalls: Getting the main shape to open and close cleanly can be fiddly (said).
longest on: Drawing the split shape: about 25 s (260.0–285.4 s), of which about 15 s on pulling smooth curves and about 10 s on the hard centre point. Animating the path opening is next at about 16 s (293.4–309.4 s).
build notes: Shape: ADBE Vector Group > ADBE Vector Shape - Group (Path) with Fill and Stroke 9 px; a corner point is a vertex whose in and out tangents are set independently (scriptable through a Shape object's vertices, inTangents, outTangents). Path keyframes: two Shape values on "ADBE Vector Shape" at 0 s and about 4.9 s; the start shape must keep the same vertex count as the end shape. Ball: Ellipse about 50–55 px, white Fill, stroke disabled, Position 1717.3,538.3 → 467.3,538.3 and Scale 169 → 100 over the same span, on the topmost layer. Blur on the split shape: "ADBE Gaussian Blur 2", Blurriness 30, Blur Dimensions Vertical (value 3), Repeat Edge Pixels off. Finishing adjustment layers come from technique 02. Hand-tuning the path's curves to look good at both keys is the slow, interface-heavy part.
result: start=319.10 end=319.45 still crop=663,316,1450,816 frame=f019155 (cut from source.mp4 at 319.25 s; saved as scratch/05/f019155.png). The picture is held part-way through the move, at comp time 3:05 (ball Scale about 126%, ball about halfway across), not at the last key; compare a build at about 3.1 s.
before: f017090
unknowns: The ball's exact Ellipse Size (never shown landed; 20.9 is a mid-drag reading); comp size (likely 1920x1080) and exact fill, stroke and background colours; the vertex positions of the path at either key; whether the ball's end Position is exactly 467.3,538.3; easing of all keys; the settings of the three finishing adjustment layers in this comp (only their presence is shown); the blur layer's effect (the earlier technique uses a radial blur).

## Turning a crude gradient disc into a grainy glowing orb
id: 06-gradient-shapes-blur-noise-glow-posterize
status: unproven
source: 8oVLS0ZlKC4 330.55–387.84 s
jobs: depth and finish; glow and colour; texture
what it does for a beat: Rescues a deliberately plain graphic (two gradient circles) into a soft, filmic hero object for a title card or an event poster background, using only blur, heavy grain, a huge glow and posterize.
what it looks like: On a near-black ground, a blurred white ring whose top edge is brightest, holding a smaller disc that fades from dark at the top to bright white at the bottom; a wide soft halo around it and coarse monochrome grain over the whole frame.
ingredients:
- Ellipse shape layers with a Gradient Fill — built-in
- Parenting — built-in
- Gaussian Blur — stock
- Noise — stock; Effects & Presets > Noise & Grain > Noise (shown f021752)
- Glow — stock
- Posterize — stock
- CC Radial Fast Blur — stock (Blur & Sharpen); found by search in Effects & Presets
- Adjustment layers — built-in
steps:
1. On a black background, draw a large circle as a shape layer with a linear black-to-white gradient fill and no stroke. (said: black to white gradient; shown f020841, f020760)
   - Gradient Fill Type: Linear (shown f020760)
   - Start Point: 0.0, -283.6; End Point: 0.4, 112.6 (shown f020760). These give a hard light-to-dark edge across the middle (shown f020841, f021068) and are the values before a jump cut.
   - At a jump cut around 351.3–351.5 s the gradient is changed off screen: from then on both discs fade softly across their whole height, the outer circle white at the top to black at the bottom, the inner disc the reverse (shown f021294). The new Start/End Point or colour-stop values are not shown; spread the ramp across the full disc (inferred).
   - Stroke 1: switched off (shown f020760)
2. Duplicate the circle, turn the copy 180 degrees and scale it down, so the smaller disc's gradient runs the opposite way inside the ring. (said; shown f021068, f021294)
   - Rotation: 180° (said; the inverted gradient is visible at f021294, the value itself is not shown)
   - Scale: 80% (shown f021068)
   - Parent the copy to the original circle (not spoken; it appears across the same jump cut, shown f021294)
3. Blur the shapes with Gaussian Blur. (said; shown f021621)
   - Blurriness: 79.3 on the outer circle (shown f021621)
   - Blur Dimensions: menu reads "Horizontal…" truncated; most likely Horizontal and Vertical (shown f021621; full wording inferred)
   - Repeat Edge Pixels: off (shown f021621)
   - The inner copy also carries an effect (fx switch, shown f021752); its value is not shown (inferred to be the same blur)
4. Add an adjustment layer over both shapes and apply Noise, turned up hard. (said; shown f021978)
   - Amount of Noise: 24.0% (shown f021978; 19% first)
   - Use Color Noise: off; Clip Result Values: on (shown f021978)
5. On the same adjustment layer add Glow with a very large radius. (said; shown f022284)
   - Glow Threshold: 60.0%; Glow Intensity: 1.0 (shown f022284; the effect defaults, left alone, inferred)
   - Glow Radius: 163 first (shown f021978), then 832.0 (shown f022284)
   - Composite Origin Behind, Glow Operation Add, Glow Colors Original Colors, Color Looping Triangle, Glow Dimensions "Horizontal…" (shown f022284)
6. On the same adjustment layer add Posterize. (said; shown f022320)
   - Level: 21 (shown f022320)
7. Dark-background option: keep the background dark rather than bright. In this build the background is a black solid carrying a white Fill effect that is switched off (shown f022335) and then deleted (shown f022511). The bright version is not shown in this span. (said; shown f022335, f022511)
8. Add a second adjustment layer on top with CC Radial Fast Blur at a low value. (said; shown f022910)
   - Center: 960.0, 540.0 (shown f022910)
   - Amount: 50.0, which is the effect's starting value; the narrator asks for a low value but no change from 50 is seen (shown f022910)
   - Zoom: changed from the default Standard (shown f022816) to Brightest (shown f022910)
9. Optional: switch on the blurred side-light shapes from the earlier light-contrast technique for extra edge light (reuse of the frame-edge shapes; values from that technique). (said: side lighting; shown f023134, one side shape with Gaussian Blur 308.7)
layout: measured on the result frame f023145, as shares of the cropped viewer picture (the whole comp): the outer ring spans about 26–75% of the width and 10–85% of the height, so about 49% of the width and 75% of the height (blurred edges included), centred about 50% across and 47% down (measured). The bright band of the ring is thickest at the top, about 10% of the height (measured). The inner disc spans about 33–67% of the width and 22–84% of the height, its brightest part at the bottom (measured). A faint halo reaches about 5% of the width beyond the ring (measured).
timing and easing: none given; the build is a still image.
variations: Keep the ground dark rather than light (said). Rework the same ideas on any basic object (said). A glass-refraction pass is mentioned but taught elsewhere, not in this video.
pitfalls: none given
longest on: Building the crude starting graphic (gradient circle, duplicate, rotate, scale): about 13 s (342.0–355.0 s). Next is the dark-background and radial-blur option at about 10 s. The author singles out Posterize as a personal favourite and asks for the noise to be cranked up.
build notes: Shapes: ADBE Vector Group with ADBE Vector Shape - Ellipse and ADBE Vector Graphic - G-Fill (Type Linear, Start Point, End Point; gradient colours need the Colors property set via a gradient-stops value, which is awkward by script and easy by hand in Edit Gradient). Duplicate with layer.duplicate(), set Rotation 180, Scale 80, parent to the original. "ADBE Gaussian Blur 2" (Blurriness about 79, Repeat Edge Pixels off). Adjustment layer 1 in this order: "ADBE Noise" (Amount of Noise 24, Use Color Noise off), "ADBE Glo2" (Glow Radius 832, Threshold 60, Intensity 1), "ADBE Posterize" (Level 21). Adjustment layer 2 above it: "CC Radial Fast Blur" (Center 960,540, Amount 50 or lower, Zoom Brightest). Background: black solid; the white "ADBE Fill" is the bright-background switch.
result: start=385.62 end=385.92 still crop=712,348,1560,876 frame=f023145 (cut from source.mp4 at 385.75 s; saved as scratch/06/f023145.png). In this window the frame-edge side-light layers (step 9) are mostly switched off, and the text layers are off, so the result shows steps 1–8 only.
before: f021294
unknowns: The final gradient's Start Point, End Point and colour stops after the off-screen change at about 351.4 s; comp size (Center 960,540 suggests 1920x1080); circle size and position; exact gradient colours; the inner copy's blur value; the exact Blur Dimensions of the shape blur; whether the radial blur Amount was lowered below 50; what the bright-background version looks like with this stack; the finished example shown at the start of the span contains extra layers (displacement, a separate blur layer, titles) whose settings are not taught here.

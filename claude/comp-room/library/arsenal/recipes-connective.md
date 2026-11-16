# Arsenal recipes: Connective jobs: between and across pictures

Generated from the recipe drafts; do not edit by hand. Recipes whose primary job is in this group. Find candidates for a beat with ae_arsenal find; read one with ae_arsenal get, or a section here by its heading.

## Depth of field on a row of glossy plates (Advanced 3D camera)
id: 11-camera-depth-of-field-advanced-3d
revision: 5af2a365
job: move-camera; support: add-depth
status: proven (accepted 2026-11-16)
what it does for a beat: Gives a 3D product-style scene a photographic lens: duplicated objects staggered in depth fall progressively out of focus, and a small camera move adds life. Use it to sell scale and depth once a scene from recipe 10 exists.
what it looks like: Three identical black panels with light-grey pill buttons stand in a diagonal row receding to the left over a near-white floor. The nearest (right) panel is only slightly soft and its labels half readable; the middle one is softer and the rear one is a blur, with soft grey shadows falling down and to the left on the floor.
ingredients:
- The scene from recipe 10 (extruded plate in the Advanced 3D renderer, graphics precomp parented at Z -1 with Accepts Lights off, environment light with shadows, plane mesh set to Accepts Shadows Only) — built-in
- Camera — built-in; Layer > New > Camera (menu inferred; Camera Settings dialog shown)
- Camera Options > Depth of Field, Aperture, Focus Distance, Focus Area Width, Near, Far Blur Level — built-in; the last two appear on cameras in the Advanced 3D renderer (shown)
steps:
1. Start from the finished scene of recipe 10, with these changes made on screen without narration: the plate's Scale set to 66% (dragged down from 78%, passing 64%, 61% and 63%; lands on 66% and holds, shown in crops cut from the source video) and the environment light's rotation set to X +7°, Y 0° (shown). Intensity 136% and Shadow Darkness 66% from recipe 10 were not shown changed (inferred unchanged).
   - Recipe 10 essentials, so this stands alone: comp in Advanced 3D; plate = black rounded-rectangle shape layer, Extrusion Depth 26, Material: Casts Shadows On, Specular Shininess 100%, Metal 78%; graphics precomp parented to it at Position Z -1, Accepts Lights Off; Environment light, Source Default, Casts Shadows on; plane mesh rotated 90° on X, Position Y 952, Scale 888%, Accepts Shadows Only. (shown in recipe 10's frames)
2. Duplicate the plate together with its graphics precomp twice, so there are three pairs, each graphics layer parented to its own plate. (not narrated; three pairs with parents pointing to the plate under each shown)
3. (Before duplicating, the original plate's Position is changed to 960,459,0 (shown, cut from the source video); not narrated, covered by the final values below.) Spread the three plates in X and Z so they form a diagonal row receding to the left (not narrated; shown):
   - Front plate: Position 1136.0,459.0,0.0 (shown)
   - Middle plate: Position 826.0,459.0,140.0 (shown)
   - Rear plate: Position 506.0,459.0,362 (Z being dragged; last digits partly hidden; shown)
   - Rotation of the three plates at this point: not shown (they keep whatever the original had; see unknowns)
4. Add a camera. (said "cameras"; dialog shown)
   - Type: Two-Node Camera (shown)
   - Preset: 50mm (shown); this gives Zoom 940.74 mm, Angle of View 39.60°, Film Size 36 mm, Focal Length 50 mm (shown)
   - Enable Depth of Field: left unticked in the dialog (shown); it is switched on in the timeline next
   - In the timeline the camera's Zoom reads 2666.7 pixels (39.6° H) (shown)
5. In the camera's Camera Options, turn depth of field on and push the blur. (said: raise the aperture and the blur controls)
   - Depth of Field: On (from Off) (shown)
   - Aperture: 181.3 pixels (from 25.3) (shown)
   - Focus Distance: 2102.7 pixels (from 2343.7) (shown)
   - Focus Area Width: 0.0 (left at its value) (shown)
   - Near, Far Blur Level: 462.0, 462.0% (linked; from 100.0, 100.0%) (shown)
6. Keyframe the camera's Point of Interest and Position for a slow move. (said; first key shown; the second key's final value is never shown, see below)
   - At comp time 0:00: Point of Interest 934.0,490.2,0.0; Position 934.0,490.2,-2388.6 (shown)
   - At comp time 0:00:04:22 (about 4.92 s at 23.976 fps): the second key is set by dragging the camera with the orbit tool in the viewer, and the video cuts away while the drag is still running, so its end value is never seen (shown: the next frame is the following section). Position 1325.2,365.5,-2334.2 with Point of Interest 921.9,493.6,16.6 is a value the drag passes through, not an end key: the readout changes every frame (934 → 768 → 1942.2 → 333.5 → 954.8 → 1325.2 → 1584.5 → 1814.5, last about 1851.5,365.5,-2138.0; proof/11/camera-move.md, and a frame cut just reads 1365.7,365.5,-2324.1). The comp is never played over the move (the time indicator stays at 0:00:04:22 during the drag).
   - The move is a pure orbit: every readout during the drag keeps the camera 2388.6 px from its Point of Interest, so the focus relation holds while the camera swings right and up (Position Y 490 → 365). Target (measured): front face about +45 % wider over the move, orbiting right and up at a constant 2388.6 px from the target. Each face points a little to the right of the camera (left edge nearer, Y Rotation −64°, see layout), and the camera swings towards that side, so the faces turn towards the viewer and the front plate gains the most. Measured two ways at readout 1325.2 against the start pose (Position 934.0,490.2,-2388.6): front face span +44 %, middle pill length +50 %, on the viewer's redraw. The viewer redraws only every 4–5 frames and lags the readout by 3–5 frames, so the image still shows an earlier camera (about X 870–1080) and must not be used for this (proof/11/camera-move.md; checked on frames cut: the face is only a little wider in the image and much wider in the next redraw).
   - In the tutorial's comp the graphics have not appeared yet at comp time 0:00 (bare plates, shown), because the template elements animate on; a builder keying from 0:00 with static graphics will not see that
layout: Measured on the result frame (picture 1644 x 925 px, full-frame origin 870,324), with the blur settings of step 5 and the camera before the move is keyed (its values then are not shown; presumably those of the first key, inferred). Three plates in a row, each overlapping the one behind it: front plate x 0.565–0.735, y 0.03–0.90; middle plate x 0.37–0.565, y 0.06–0.86; rear plate x 0.20–0.37 visible (its right part hidden), y 0.10–0.84 (measured). Each plate reads tall and narrow (visible face about 17–20% of the picture width, 75–87% of its height) because the plates are turned well away from square to the camera (measured; the plate's Y Rotation reads −64° just before duplication, see the near-edge note below). Pills: three per plate, light grey, stacked as in recipe 10 (measured). Focus: no plate is fully sharp, because the focus distance (2102.7) is about 290 px nearer than the front plate, which sits about 2390 px from the camera; the front plate's labels are half readable, the middle plate's are smeared, the rear's are unreadable (measured; distance inferred from the values). Blur, measured as the 10–90% width of pill edges: front plate about 0.3–0.7% of the picture width (left edges 4–7 px, top edges about 12 px), middle about 0.6–1.1% (9–18 px), rear about 0.9–1.3% (14–21 px); the rear plate's outer edge against the floor about 0.8%. For comparison the sharp scene of recipe 10 gives 2–4 px (measured). These per-plate blur widths are the target. The shown Aperture 181.3 px and Near, Far Blur Level 462% do not transfer as a blur size: a thin-lens estimate from the shown Zoom, Aperture and Focus Distance predicts blur discs several times to ten times larger than the picture shows, so treat 181.3 and 462% as the tutorial's own values and tune your scene until the per-plate edge widths match (inferred from the measurement and the estimate). Near edge: each plate's LEFT edge is nearer the camera and its right edge farther away. Pills are taller at their left end (front plate 139 px against 120 px at the right end, middle plate 122 against 108, full-size pixels) and the front plate's bottom edge rises to the right (y 731 at its left end, 672 at its right, in the result crop), so the plate in front covers the right part of the one behind (measured). This fits the plate's rotation last shown before it is duplicated: X 0°, Y −64°, Z 0°, held (shown, crops cut from the source video; it appears across a jump cut between, where the frame before reads X +11°, Y −45°, so how it was reached is not seen; the copies are not opened afterwards, so that they keep it is inferred). A negative Y Rotation is what brings the left edge forward: a build with Y +60° got the right edge nearest, the opposite of this picture (proof 11). The grey graded strip about 3% of the picture width along the front plate's right edge, lighter towards the top, is therefore not the plate's thickness turned to the camera; it is most likely sheen on the far margin of the face or the rounded rim (inferred). Shadows: each plate casts a soft grey shadow down and to the left onto the floor, the shadows merging into one band from y about 0.84 to 0.99 that reaches left to about x 0.10; darkest about RGB 100–105 against a floor of about 237, i.e. 0.43 of the floor level (measured). The shadow is blurred further by the depth of field near the bottom of the frame (inferred). Background: near white, faintly cool, RGB about 233,239,242 on the left and 239,250,251 on the right (measured). The finished example shown and is a different, pre-made file: the plates lean back steeply and fly in with template animation, the nearest plate is sharp and the rear ones heavily blurred, the camera is parented to a null and an adjustment layer sits on top; none of its values are shown (shown). Motion: the camera orbits right and up at a constant 2388.6 px from its target; the front face grows about +45 % in width over the move (measured at readout 1325.2 against the start pose; the move's end is never shown, see step 6). That +45 % is the widening at the passing value used as the second key; the tutorial's drag carries on past it, to about +79 % (face span) just before the cut (measured, proof/11/camera-move.md; a rough check against gives about +80–90 %). Nothing else moves except the template graphics animating on during the same span (bare plates at 0:00, graphics in place at 0:00:04:22; step 6).
timing and easing: Two camera keyframes, at 0:00 and 0:00:04:22 (comp time, 23.976 fps), on Point of Interest and Position (key icons and time shown). The second key's final value is not shown (the video cuts mid-drag); aim for the front face about +45 % wider at 4:22 (measured, see step 6). The move is never played, so its pace in playback is not shown. Interpolation not shown; the keys look like plain linear diamonds (inferred).
variations: Raise the aperture and blur levels as far as the look needs (said). Animate Point of Interest and Position, or use the viewer's camera tools (orbit, pan, dolly) to shape the final move (said).
pitfalls: none given
build notes: In scripting, the camera's Camera Options group holds Zoom, Depth of Field, Focus Distance and Aperture (long-standing properties). Focus Area Width and Near, Far Blur Level exist only on Advanced 3D cameras in recent versions; reach them by their displayed names and check they exist before setting them. Near, Far Blur Level is a linked two-value property (462, 462). Do not copy the blur values as a size; match the measured edge widths in layout. Camera move: the proof build keyed the second key at the passing value Position 1325.2,365.5,-2334.2 / Point of Interest 921.9,493.6,16.6, linear, and its front face widened +42 % (pill +45 %), on the +45 % target (proof/11/camera-move.md). Duplicating a plate and its graphics precomp together keeps each copy's parent pointing at the new plate; check the Parent column. The aperture and focus values are in pixels and tied to this scene's scale (a 1920 x 1080 comp, camera about 2390 px from the front plate, plates about 310 px apart in X and 140–220 px apart in Z); in another scene aim for the measured blur instead: nearest plate's edges spread over about 0.3–0.7% of the picture width with half-readable labels, middle about 0.6–1.1%, rear about 0.9–1.3% and unreadable. A build's values, not the tutorial's (proof 11, After Effects 27.0, 1920 x 1080 comp, camera Zoom 2666.7 px, about 2390 px from the front plate): Aperture 17 px with Focus Distance 2102.7 and Near, Far Blur Level 462, 462% reached the measured top-edge widths (front 0.59%, middle 0.78%, rear 1.10% against 0.57, 0.86 and 1.20 in the tutorial); the tutorial's Aperture 181.3 at 462% turned the whole picture into dark smears, blur discs well over 100 px. That build's plates were turned the wrong way (right edge nearest), so its vertical pill edges came out about twice as soft as the tutorial's; with the left edge nearest, retune the Aperture against the measured widths.
unknowns: The second camera key's final value (the video mid-drag; 1325.2 is a passing value). The plates' rotation after duplication (the last reading before it is X 0°, Y −64°, Z 0°, held; it appears across a jump cut after readings of X −29°/Y −45° and X +11°/Y −45°; the copies are not opened afterwards). The rear plate's exact Z (read as 362). Whether the light's Intensity or Shadow Darkness changed after recipe 10. The camera keyframes' interpolation. The finished example's camera, blur and null values.

## A dark mass split open behind a travelling ball
id: 05-path-opening-split-driven-by-moving-ball
revision: ce7f0409
job: hand-over; support: reveal-headline, show-time
status: unproven
what it does for a beat: A small ball crosses the frame and a large dark form tears open behind it, revealing the light ground; good for line-led animation, progress moments or a reveal that clears space for a headline.
what it looks like: A near-black navy mass fills the frame; a white dot starts at the right edge and travels left along the middle, and behind it the mass parts into two curved lobes with a soft, glowing blue rim, opening a widening pale cyan wedge. The whole picture is soft and grainy from the finishing stack.
ingredients:
- Pen Tool — built-in; toolbar Pen Tool (shown)
- Shape layer with fill and stroke (closed path) — built-in
- Ellipse shape layer for the ball — built-in
- Gaussian Blur on the split shape — stock
- Finishing stack from earlier in the video (Noise, Blur and Glow adjustment layers over a pale background) — stock
steps:
1. Start in a comp that already holds the finishing stack from earlier: three adjustment layers (noise, a blur layer, glow) above a pale cyan-white background solid. (shown; the stack itself is "apply the finishing stack from earlier", values not visible in this span)
2. With the Pen Tool, draw one large closed shape that covers most of the frame, with long smooth curves; the author says to hold Shift while pulling out the curve handles. (said; shown)
   - Fill: near-black navy (shown toolbar swatch)
   - Stroke: bright blue, 9 px (shown toolbar)
3. Make one vertex a hard point where the two curves meet: hold Alt (Option on Mac) on that vertex to break its handles so each side can be pulled separately. The point is centred vertically and about 23% in from the left edge, where the ball's last key will land (Position x 467.3 is about 24% of 1920). (said; shown, tip measured on the full frame)
4. Drag the drawn shape layer down under the three adjustment layers, just above the background, so the finish applies to it. (not spoken; shown : shape sits at position 5 of 6, under the adjustment layers)
5. Draw a small ball and leave it on top of the stack, above the adjustment layers, so it stays crisp. (said: add a sphere; shown)
   - Diameter: about 3.4% of the comp width on the result frame at Scale about 126%, so about 50–55 px at 100% in a 1920-wide comp (measured). The Size field reads 20.9 but is still being dragged there, so that is not the final value.
   - Fill: white; its Stroke 1 is switched off (shown)
   - The ellipse was drawn off-centre and the layer's Anchor Point set to the ellipse (Anchor Point -492.7,-1.7 equal to the ellipse offset) (shown; how the anchor was set is inferred)
6. Animate the ball's Position straight across the frame, right to left. (said: animate its position; shown)
   - Position at 0 s: 1717.3, 538.3 (shown)
   - Second key at about 4.9 s; value 467.3, 538.3, the ball's original spot near the point (shown as the earlier value; that it is the end key's value is inferred)
7. Also animate the ball's Scale so it is bigger at the start and shrinks to normal by the end. (not spoken; shown)
   - Scale: 169% at 0 s (shown) → 100% at about 4.9 s (shown)
8. Keyframe the split shape's Path so its opening follows the ball: at the end the pointed tip sits at the ball's final spot and the two lobes are wide open; at 0 s the tip and lobes are pushed to the right edge so only a thin pale strip shows. (said: animate the opening of the path; shown end state, start state, Path keys at 0 s and about 4.9 s)
9. Add Gaussian Blur to the split shape itself, copied from a background shape in the first technique's comp (shown) and pasted at that value and then turned down to a low amount. (said: low blur; shown)
   - Blurriness: 103.6 pasted (shown), lowered to 30.0 (shown)
   - Blur Dimensions: Vertical (shown)
   - Repeat Edge Pixels: off (shown)
layout: measured on the result frame (comp time 3:05), as shares of the cropped viewer picture (the whole comp): the ball's centre sits about 49% across and 50% down, diameter about 3.4% of the picture width (6% of the height) (measured). The pointed tip of the opening touches the ball; the pale wedge widens to the right, about 10% of the height tall at 70% across, and the pale ground fills the full height from about 90% across to the right edge (measured). The two dark lobes' rounded ends reach about 90% across, centred about 15% from the top and 15% from the bottom (measured). In the end state the tip sits about 23% across (measured on the full frame).
timing and easing: Ball Position, ball Scale and the split shape's Path all keyed at 0 s and about 4.9 s (shown); the work area ends there. Key icons look like plain linear diamonds (inferred); no easing is mentioned or shown.
variations: Suited to line-driven animation or anything that shows progress (said).
pitfalls: Getting the main shape to open and close cleanly can be fiddly (said).
build notes: Shape: ADBE Vector Group > ADBE Vector Shape - Group (Path) with Fill and Stroke 9 px; a corner point is a vertex whose in and out tangents are set independently (scriptable through a Shape object's vertices, inTangents, outTangents). Path keyframes: two Shape values on "ADBE Vector Shape" at 0 s and about 4.9 s; the start shape must keep the same vertex count as the end shape. Ball: Ellipse about 50–55 px, white Fill, stroke disabled, Position 1717.3,538.3 → 467.3,538.3 and Scale 169 → 100 over the same span, on the topmost layer. Blur on the split shape: "ADBE Gaussian Blur 2", Blurriness 30, Blur Dimensions Vertical (value 3), Repeat Edge Pixels off. Finishing adjustment layers come from technique 02. Hand-tuning the path's curves to look good at both keys is the slow, interface-heavy part.
unknowns: The ball's exact Ellipse Size (never shown landed; 20.9 is a mid-drag reading); comp size (likely 1920x1080) and exact fill, stroke and background colours; the vertex positions of the path at either key; whether the ball's end Position is exactly 467.3,538.3; easing of all keys; the settings of the three finishing adjustment layers in this comp (only their presence is shown); the blur layer's effect (the earlier technique uses a radial blur).

## Tilted 3D ring of discs orbiting a centre
id: 06-3d-orbit-rings
revision: 55063a18
job: keep-it-alive; support: light-the-hero, add-depth
status: proven (accepted 2026-11-14)
what it does for a beat: Wraps a central object in a tilted, torus-like ring of repeated flat shapes that pass in front of and behind it. Use it for an orbit or "planet with rings" look, or any hero object that needs a 3D halo, with no 3D plugin.
what it looks like: A solid black circle sits in the middle of a pale grey frame. Around it runs a tilted ring of white discs with thin dark outlines, each disc standing edge-on to the centre like slices of a doughnut; the near discs overlap the black circle and the far ones go behind it. Small black four-point sparkles float around.
ingredients:
- Shape layer with an ellipse — built-in (shown)
- 3D Layer switch — built-in (said)
- Pan Behind (Anchor Point) tool or Anchor Point value — built-in (moving the anchor is said; method inferred)
- Ctrl+Alt (Windows) / Cmd+Option (macOS) drag on a value with several layers selected — built-in (inferred from the identical even spread and from recipe 04; the narrator only says to duplicate and offset, not how)
steps:
1. Make the centre object: a filled black circle in the middle of the comp, set to 3D (shown; 3D switch on, shown).
2. Make one disc: an ellipse shape layer with a white fill and a dark stroke (shown — toolbar Fill white, Stroke dark).
   - Stroke width: 6 px (shown)
   - Scale: 48.0, 48.0 % (shown)
3. Move the disc's anchor point so the disc sits above the centre object while the anchor stays at the object's centre (said, anchor moved up; shown — disc above the black circle, anchor crosshair at the circle's centre).
   - Anchor Point: 0.0, 0.0 → 0.0, 910.0 (shown →)
   - Position: 962.8, 542.7, i.e. about comp centre (shown)
4. Turn on the disc's 3D switch and set Y Rotation to 90° so the disc turns edge-on (said; shown — disc becomes a thin vertical line above the circle).
   - Y Rotation: 0x+90.0° (said; shown). At the cursor hides the top disc's Y Rotation value (shown), and the screen reader's 180° there is unconfirmed; the top disc still shows as a single vertical edge-on line in the viewer (shown), which fits 90° rather than 180° (inferred).
5. Duplicate the disc (said). The example has 36 discs (shown, layer named up to 36).
6. Select all discs and offset Orientation Z evenly so each copy is turned further around the centre, forming an orbit (said; shown →).
   - Orientation Z step: grows from 2.7° (shown) through 40.7° (shown) and settles at 41.1° per layer — 0, 41.1, 82.2, 123.3 … (shown)
   - Top layer keeps Orientation 0, 0, 0 (shown)
7. Tilt the whole ring with the other two Orientation values (said). In the example only X is changed; the three top discs visible all read the same value, and that every disc shares it is inferred.
   - Orientation X: 315.0° (shown), then 307.0° (shown)
   - Orientation Y: 0.0° (shown)
   - Proof-build note: under the default camera the 307° on screen made the ring too fat across its short axis for the layout; 292° came close; the reviewer's suggested 294 to 295° made the ring taller when tried (0.893 of the height at 294° against 0.864 at 292°), 290° gave 0.840, and the layout's 0.81 would need about 287 to 288°, which was not built. The shown anchor 910 and scale 48 % also gave a ring only about 0.51 of the width wide there, so the build was moved toward the camera to reach the layout's size. The example's camera and comp size are not known, which may explain both (inferred: found in a proof build, not said or shown; 307° stays the value on screen)
8. Result: a tilted ring of discs around the black circle, near discs in front of it and far ones behind (shown, crop).
layout: disc ring: a loop of edge-on discs filling 0.09–0.90 of the comp's width and 0.16–0.96 of its height, centred at about 0.49 across, 0.55 down, seen from above so its back half sits higher, and rolled about 16° with its left end higher (the edge-on front disc leans 15 to 16° from upright, its top to the right); front discs are the largest (about 0.45 of the height tall), back discs smaller; black sphere: 0.28 of the width and 0.52 of the height across (a true circle), centred at 0.51, 0.50, so the ring passes in front of it at the bottom and behind it at the top; two four-point stars: about 0.13 of the width across at 0.17, 0.35 and about 0.07 across at 0.18, 0.79 (all measured on a still of the result, shares of the whole comp: the viewer shows the full 16:9 picture at 43.2%)
timing and easing: none given for the build. The finished example moves (shown playing); its discs are parented to a null (shown, Parent column), but how that null or the discs are animated is not shown. In the result clip the discs travel round the ring, front discs left to right and back discs right to left: an outline on the row 0.62 down moves right by about 0.35 % of the comp's width per comp frame, and outlines on the row 0.21 down move left (measured on, in the result crop). That is about 19 to 21° a second round the ring (inferred: a proof build turning 19° a second moved 0.36 % per frame on the same row). The comp runs at 23.976 fps (shown).
variations: Tilt the ring to any angle by changing Orientation X and Y on all the discs (said).
pitfalls: none given
build notes: By script: shape layer with `ADBE Vector Shape - Ellipse`, fill white, stroke 6 px; `threeDLayer = true`; `transform.anchorPoint = [0, 910]` (the example value; it is the orbit radius in layer pixels before scale) and `transform.position` at the centre object; `transform.yRotation = 90`. Duplicate to N layers and set `transform.orientation = [tiltX, 0, i * stepZ]` for the i-th copy from the top. The example uses N = 36, stepZ = 41.1°, tiltX = 307°; note 36 × 41.1° ≈ 4.1 turns, so the discs land spread around the ring rather than packed in one quarter; for a single tidy pass use stepZ = 360 / N (inferred). The centre object must be a 3D layer for discs to pass behind it. To make the ring orbit, parent the discs to a 3D null at the centre and keyframe the null's rotation (inferred from the parenting shown). In the proof build the roll came from a Z Rotation of about 16 to 17° on that null, and the orbit from an expression adding to every disc's Orientation Z over time; the sign that sent the front discs left to right there was negative (inferred: found in a proof build, not said or shown).
unknowns: comp size; disc ellipse size before scaling and exact colours; size and colour of the centre circle; whether the offset was made with the Ctrl/Cmd+Alt drag or typed; the orbit animation (what is keyframed and its easing; direction and rough speed are measured, see timing); the sparkle layers and the noise/texture layer in the finished example are not explained in this chapter; camera (the viewer shows Active Camera (Default), shown, so no camera layer is needed for the build).

## Leaf-shaped particles from any graphic
id: 10-graphic-as-particles
revision: f4725be7
job: keep-it-alive; support: fill-the-backdrop, add-impact
status: proven (accepted 2026-11-14)
what it does for a beat: Fill a scene with drifting copies of a small graphic (leaves, petals, confetti, logos) without hand-placing them; the particle system births, spins and moves each copy for you.
what it looks like: Dozens of small green leaf graphics of varied size tumble and spin as they drift across a dark frame, spread through depth; in the tutorial's scene they are meant to float over an illustrated window view.
ingredients:
- CC Particle World — stock (Cycore, ships with After Effects); effect name said; the author types "CC" into the Effects & Presets search (shown), but the effect itself is not in the visible part of that list
- Solid layer to carry the effect — built-in (said)
- The graphic to use as the particle, as its own layer in the comp (here a leaf vector file scaled down) — built-in
steps:
1. Put the graphic (a single leaf illustration) in the comp as its own layer and scale it down (shown)
   - Scale: 32.0, 32.0 % (shown)
2. Make a solid layer and apply CC Particle World to it (said; the solid is a black layer at the top of the stack, shown)
3. In the Particle group, set Particle Type to Textured QuadPolygon right away (said; dropdown reads "Textured Quad..." shown)
4. Open Particle > Texture and set Texture Layer to the graphic's layer (said; the menu shows the graphic's layer number, shown)
   - Texture Layer second dropdown: "So..." — most likely Source (shown, reading inferred)
   - Scatter: 0.0 (shown)
   - Texture Time: Current (shown)
   - Align To Direction: off (shown)
5. Particle look values visible on screen at this point (shown; not said, possibly defaults)
   - Rotation Speed: 180.0 (shown)
   - Initial Rotation: 360.0 (shown)
   - Rotation Axis: Any Axis (shown)
   - Birth Size: 0.250 (shown)
   - Death Size: 0.250 (shown)
   - Size Variation: 50.0 % (shown)
   - Max Opacity: 75.0 % (shown)
   - Color Map: Birth to Death (shown)
   - Birth Rate: 2.0; Longevity (sec): 1.00 (shown)
6. Customise the emitter and physics to turn the upward burst into a sideways drift (said "customise"; Direction Axis and the starting values shown, the changed values first shown)
   - Producer > Position X: -0.58 (changed from 0.00; shown)
   - Producer > Position Y / Z: 0.00 / 0.00 (shown)
   - Producer > Radius X: 0.025 (shown)
   - Producer > Radius Y: 0.225 (changed from 0.025 shown; new value shown)
   - Producer > Radius Z: 0.025 (shown)
   - Physics > Animation: Direction Axis (changed from Explosive; shown, Explosive shown)
   - Physics > Velocity: 1.08 (changed from 1.00 shown; new value shown)
   - Physics > Gravity: 0.030 (changed from 0.500 shown; new value shown)
   - Physics > Inherit Velocity %: 0.0; Resistance: 0.0; Extra: 0.50; Extra Angle: 1x +0.0° (shown)
7. Composite the particle layer over the scene (inferred; the scene with the particle layer switched off is shown, and earlier copies of the particle layer sit lower in the stack, shown)
layout: leaves visible at once: about 140 (measured, shares of the result crop, which shows the comp's full width and about 90% of its height, the top ~10% left off below the camera label; viewer at 43.9%); leaf long side: mostly 0.7–2.1% of the width, median about 1.3%, largest about 2.6% (measured, shares of the result crop, which shows the comp's full width and about 90% of its height, the top ~10% left off below the camera label; viewer at 43.9%); spread: 2–97% across, the middle 80% of leaves between about 24% and 79% down, no visible clustering at the emitter (measured, shares of the result crop, which shows the comp's full width and about 90% of its height, the top ~10% left off below the camera label; viewer at 43.9%)
timing and easing: none given (no keyframes shown; the particles animate by themselves)
variations: the narrator says the particle settings are free to change to suit the scene; any graphic can be the texture
pitfalls: none given
build notes: Values are dragged into place between (Gravity passes through negative values on the way); the settled drift with the guide grid gone holds from about 167.7, after which the full scene returns (shown, source cuts). The result crop starts below the viewer's camera label. Effect "CC Particle World" (match name CC Particle World). Properties as shown in the Effect Controls: "Birth Rate", "Longevity (sec)", "Producer" group ("Position X/Y/Z", "Radius X/Y/Z"), "Physics" group ("Animation" popup, "Velocity", "Gravity", ...), "Particle" group ("Particle Type" popup, "Texture" group with "Texture Layer", "Scatter", "Texture Time", then "Rotation Speed", "Initial Rotation", "Rotation Axis", "Birth Size", "Death Size", "Size Variation", "Max Opacity", "Color Map"). Popup values are set by index, so read the menu order in the installed version (Textured QuadPolygon, Direction Axis). Texture Layer is a layer-reference property: set it to the graphic layer's index. The graphic layer can stay switched off (inferred; it is a texture source). The viewer in the tutorial uses a 3D camera (Active Camera shown); the effect works without one. Proof-build notes (inferred: found in a proof build, not said or shown): leave the Direction Axis values at their default (0, −1, 0); with the Producer and Physics values on screen that filled the frame as the layout measures, while an axis of (1, 0, 0) sent the leaves away from the viewer in a shrinking cluster. In scripting the effect's groups are flat: Producer, Physics and the rest are label rows and their properties follow as siblings, so look properties up by name across the whole effect. Starting the particle layer 2 s before the comp gives a full field on the first frame. Birth Size and Death Size of 0.29 matched the tutorial's leaf size more closely than the 0.250 on screen (median long side 1.65 % of the width against 1.62 %); that depends on the texture's own pixel size, so 0.250 stays the shown value.
unknowns: Direction Axis sub-settings (axis X/Y/Z) not shown; whether the rotation, size, opacity values were changed from the defaults or left; the solid's colour and size; the comp size; the leaf graphic's colour; whether Grid & Guides was switched off (the grid is gone but the change is not shown); how the particle layer was blended into the final scene (blend mode, opacity, depth of field) is not shown in this stretch

## Keep a chosen layer sharp while the camera travels
id: 16-lock-focus-to-layer
revision: 45bd25eb
job: move-camera; support: light-the-hero, add-depth
status: proven (accepted 2026-11-14)
what it does for a beat: Use when a camera push or drift through a layered 3D scene should keep the hero element crisp the whole time, so depth of field never drifts off the subject as the camera's distance to it changes.
what it looks like: A stylised 3D landscape of rounded hills, trees and puffy clouds against a big warm sun; the camera pushes in from a wide view towards a small silhouetted figure on a hilltop, and the figure stays sharp, as do the two trees standing beside it at about its own depth, while the clouds and the nearer hill soften.
ingredients:
- 3D camera with depth of field — built-in; Layer > New > Camera (inferred)
- Link Focus Distance to Layer — built-in; layer context menu > Camera > Link Focus Distance to Layer (said; shown)
steps:
1. Build the scene from 3D layers and animate a camera move through it (inferred; the move plays but its keyframes are not shown)
   - The camera is parented to a null (shown : the camera's parent column reads a null); that the push is animated on this null is inferred, neither said nor shown
2. Make sure the camera's depth of field is on so that focus matters (inferred; before the link the figure itself is soft, so depth of field is already on; the switch itself is not shown)
3. Select the camera layer and the layer to keep in focus together (said; shown, camera and the figure layer both highlighted)
4. Right-click one of them and choose Camera > Link Focus Distance to Layer (said; shown)
   - Not the neighbouring "Set Focus Distance to Layer", which sets the value once; Link keeps it following (inferred from the menu and the narrator's "the entire time")
   - "Link Focus Distance to Point of Interest" is greyed out in this menu (shown), so it was not an option for this camera (inferred: likely a one-node camera)
5. Play the camera move: the chosen layer stays in focus for the whole move (said; shown in the playback after the link,: wide view pushing in to the figure, figure sharp, near hills soft)
layout: crop is the whole comp at 43.5 % (comp edges at the crop edges, measured on a still of the result); at the end of the push: figure centred at 50 % across, 50-65 % down (about 15 % of the comp's height), feet on the hill crest at about 65 % down; trees either side at 25-34 % and 69-75 % across, on the figure's own hill and as crisp as the figure; sun disc about 55 % of the comp's width, centred at 50 % across; at the start of the push : figure at 50 % across, 58.5-64 % down (about 5.5 % of the comp's height), sun disc about 27 % of the comp's width, so the push roughly doubles the sun and nearly triples the figure while the figure's feet stay near 64-65 % down (measured on a still of the result, shares of the whole comp)
timing and easing: none given (the camera move itself was pre-built; its keyframes are not shown)
variations: none given
pitfalls: none given
build notes: Camera layer: Camera Options > Depth of Field must be On (property "Depth of Field", matchName ADBE Camera Depth of Field). The menu command writes an expression on Camera Options > Focus Distance (ADBE Camera Focus Distance) that measures the world-space distance from the camera to the target layer; a script can write an equivalent expression itself, for example `var t = thisComp.layer("TARGET"); length(toWorld([0,0,0]), t.toWorld(t.anchorPoint));` (inferred; the expression text is not shown in the video). Use toWorld because the camera is parented to a null. The video gives no aperture; in a proof build's own scene Aperture 400 with Blur Level 100 (Zoom 2666.7) gave clouds and a near hill about as soft as the tutorial's, where 200 gave little, and anything meant to stay crisp with the hero has to stand at its depth (inferred: found in a proof build, not said or shown; the right aperture depends on the scene's depths). The menu command itself can only be reached by hand in the interface (or app.executeCommand with an id we do not have).
unknowns: camera Aperture, Blur Level, F-Stop and Focal Length; whether depth of field was switched on by the author in this tip or earlier; the camera rig's keyframes, duration and easing; the exact expression the command writes.

## Cards orbiting an ellipse drawn as a mask
id: 05-mask-path-to-position-loop
revision: 0a285402
job: keep-it-alive; support: fill-the-backdrop, reveal-headline
status: unproven
what it does for a beat: Sends a ring of photo cards round an oval forever, framing a title or product in the middle. Use it for an endless moodboard or gallery loop behind a headline, or a hold that has to run for any length.
what it looks like: On a warm off-white background, about sixteen flat, square-cornered photo cards of mixed portrait and landscape shapes (flowers, portraits, a jar, interiors) travel round a wide oval that fills most of the frame, overlapping slightly, with an empty middle where the example sets a dark green two-line title.
ingredients:
- A shape-layer matte with an image on track matte, the image parented to it, as in 01-rounded-shape-matte-media-card (here the rectangle has Roundness 0) — built-in (said "an image and a shape matte ready"; shown)
- Ellipse tool with the Tool Creates Mask option — built-in (said; shown, mask option highlighted in the toolbar)
- Mask Path copied and pasted into Position — built-in (said)
- loopOut() expression on Position — built-in (said "regular loop out"; shown)
steps:
1. Start with one card: a rectangle shape layer used as a matte with an image matted to it and parented to it, both centred (said; shown)
   - Matte Position: 960.9,542.4 (shown)
   - Rectangle Size: 300.5,214.3, Roundness 0.0 (shown on the first copy before it was resized, — the original's own size panel is not shown; inferred same)
2. With the matte layer selected, pick the Ellipse tool, switch on Tool Creates Mask, and drag out a wide ellipse round the card in one drag, about 86% of the comp width (said; Tool Creates Mask highlighted in the toolbar, which is mid-drag; landed oval shown)
3. Set the mask mode to None so the mask no longer cuts the card (said "turn off the mask"; shown, Mask 1 mode None)
4. Select Mask Path, copy it, select the matte's Position and paste, which turns the outline into Position keyframes (said; shown : Position keyed, motion path drawn as an oval, card jumped to the top of the oval)
   - First key Position: 958.6,205.5 (top of the oval; shown)
   - Position at 12:07 while looping, about 2.4 s into the cycle and near the left end of the oval: 147.6,484.3 (shown; close to, not on, the 2.5 s key) — the card travels top → left → bottom → right, counter-clockwise
5. Drag the last Position keyframe out to slow the orbit (said "stretch out the final keyframe"; shown)
   - Keys at 0, 2.5, 5, 7.5 and 10 s, the middle three as roving keys (small dots) (shown; times measured on the ruler)
6. Add the expression loopOut() to Position so the card keeps going round (said; typed, shown)
   - Expression: loopOut() (shown)
7. Duplicate the matte and its image together (said "duplicate both of these elements"; shown : second matte and image pair)
8. Optionally change the copy's shape and photo (said "change the shape's size" and "insert new imagery"; shown)
   - Rectangle Size on the copy: 222.5,300.3 (shown; constrain proportions off, landscape changed to portrait)
   - Copy's image: a different photo, parented to the copied matte (shown)
9. Slide the copy's Position keyframes a little later so it trails the first card round the oval (said "move those keyframes over by a touch"; shows the drag in progress, first key heading to about 0.6 s; shows the landed stagger, each newer copy's first Position key later than the one before)
10. Duplicate, re-shape, re-photo and offset again and again until the cards fill the whole oval (said; shown : the stack lists mattes numbered up to about 16, each with its own image)
layout: orbit path measured from the key values in a 1920×1080 comp — centre about 50% across and roughly 45% down, width about 84% of the picture (half-width about 811 px), height about 52% of the picture (top at 205.5 px; centre y about 484 px, approximate because 147.6,484.3 was read near, not on, the left key) (measured from shown values); first card 300.5×214.3 px, about 16% of the width and 20% of the height (measured from shown values); on the result frame the cards run from about 2% to 98% across and 10% to 93% down, each about 10–14% of the picture width and 18–25% of its height, the middle about 40% wide left empty (measured)
timing and easing: Position keys pasted from the mask, last key moved to 10 s (orbit 10 s per lap, inferred from key spacing 0/2.5/5/7.5/10 s); middle keys roving; loopOut() cycles it; each copy offset "by a touch" (about 0.6 s for the first copy, mid-drag); no eases given
variations: change each card's shape size and swap in new pictures (said)
pitfalls: none given
build notes: by script — create a shape layer with a Rectangle (ADBE Vector Shape - Rect, Size [300.5,214.3], Roundness 0), image layer with trackMatteType = TrackMatteType.ALPHA (or setTrackMatte on AE 2023+) and parent = matte. Build the orbit directly instead of via a mask: set Position keys at 0, 2.5, 5, 7.5, 10 s on the four extreme points of an ellipse centred [958.6,484.3] with radii about [811,279] (the centre y is approximate) (top, left, bottom, right, top) and give the middle keys spatial tangents so the path is elliptical (each tangent ≈ 0.5523 × radius along the path), or set mask path vertices on a mask and copy them to Position with Shape → keys conversion done by hand in the interface (pasting a mask path into Position is an interface-only action). Set roving on keys 2–4 (setRovingAtKey). Expression 'loopOut()'. Duplicate pairs with layer.duplicate(), set each copy's matte Size and image via replaceSource, then shift each copy's Position keys by its offset. The mask itself can stay with mode None (MaskMode.NONE).
unknowns: the original card's exact rectangle size; the offset per copy after the first and whether it was even; the final card count (about sixteen mattes are listed); whether the copies were also given loopIn or a pre-roll so they do not sit still before their first key; every copy's size. The result window is the author's pre-made finished example shown at the start of the span, in a separate comp that also holds a dark green two-line title and a noise layer that this tutorial does not build (shown); the build comp has gained the same title and an adjustment layer off screen (shown). The same ring is played again in the build comp but the mouse arrow sits in the viewer throughout. The recording zooms slowly, so the crop drifts by a few pixels across the window.

## Spinning square box built from four 3D cards
id: 07-3d-spinning-box-of-cards
revision: 257f8710
job: keep-it-alive; support: add-depth
status: unproven
what it does for a beat: Turns a handful of photo cards into a rotating four-walled box seen end-on, a quick 3D showcase loop for a gallery or "many images" moment, and the base unit for the tunnel in 08.
what it looks like: Four rounded photo cards stand edge-on round the centre of a dark frame, forming the walls of a square box seen down its axis, with gaps at the corners; the whole box spins steadily clockwise around the view axis.
ingredients:
- Rounded shape-matte media cards (recipe 01: rounded-rectangle shape layer as track matte for an image, image parented to the shape) — built-in
- 3D layer switch — built-in
- Anchor Point (Z), Orientation, Y Rotation — built-in transform properties
- Null object (3D) — built-in; Layer > New > Null Object (inferred; the timeline's context menu is open)
- Expression on the null's Z Rotation — built-in
steps:
1. Start from one shape-matte card (recipe 01): a rounded shape layer used as track matte for an image, the image parented to the shape; the comp is 1920x1080 (shown).
2. Switch both the image and the shape layer to 3D (said; 3D switches on both rows shown crop).
3. On the shape layer, turn Y Rotation to a little over 90 degrees so the card faces sideways; the narrator says 90 or slightly more for nicer perspective (said).
   - Y Rotation: 0x+97.0° (shown; shows 98° while still being dragged)
4. Push the shape layer's anchor point out along Z so the card slides off to one side of the frame while its pivot stays at the frame centre (said).
   - Anchor Point before: 269.7, 137.5, 0.0 (shown) — X and Y are the card's own centre (half its width and height), so the card is about 539 x 275 px (inferred)
   - Anchor Point first set: 269.7, 137.5, 560.0 (shown)
5. Duplicate the card (image and shape layer together) and set the copy's Orientation Z to 90° (said; shown crop).
6. After the first copy, both shapes' anchor Z is pulled in so the walls sit closer together (not said; done on screen).
   - Anchor Point: 269.7, 137.5, 440.0 on both shapes (shown)
7. Repeat for two more copies so the four shapes have Orientation Z 0°, 90°, 180°, 270°, all with Y Rotation 97° and anchor Z 440 (said "repeat"; 180° and 270° shown).
8. Swap the images on the copies so each wall shows a different photo (said; result frames show four different images).
9. Add a null, make it 3D, and parent the four shape layers to it; the images stay parented to their own shapes (said; parent column shown).
10. Add an expression to the null's Z Rotation so it spins with time (said).
    - Expression: time*40 (shown; crop) — 40 degrees per second
layout: Measured on the result frame (crop below). The viewer shows only the middle 82% x 82% of the 1920x1080 picture, so the box overflows the crop vertically. Box centred on the frame centre (measured). Outer extent of the four walls about 69% of the crop width, i.e. about 57% of the picture width (measured); in the unspun state the empty square opening in the middle is about 32% of the picture width and 58% of its height (measured). Each wall reads as a long thin trapezoid because the card is seen almost edge-on (Y Rotation 97°). Background is a dark, near-black solid (shown, bottom layer).
timing and easing: No keyframes; continuous spin from the expression, 40°/s, one turn every 9 s (inferred from time*40). Default camera, no camera layer.
variations: Y Rotation exactly 90° or a bit more for more perspective (said). Any images can be swapped into the cards (said).
pitfalls: none given
build notes: Script: for each card, layer.threeDLayer = true on both the image and shape layer; shape.transform.yRotation = 97; shape.transform.anchorPoint = [w/2, h/2, 440]; shape.transform.orientation = [0, 0, k*90] for k = 0..3; image.parent = shape. Null: comp.layers.addNull(), threeDLayer = true, position at comp centre, transform.zRotation.expression = "time*40"; set each shape's parent to the null (parent after positioning so the cards keep their place). Track matte from recipe 01 (image.setTrackMatte(shape, TrackMatteType.ALPHA) in recent versions). All doable by script.
unknowns: Card size and corner radius (from recipe 01; size only inferred from the anchor values); the shapes' Position (presumably comp centre, not shown); the null's position (not shown, presumably comp centre); whether the anchor change from 560 to 440 was applied to the third and fourth copies before or after duplication (they show 440 indirectly through the closed box only); background colour value.

## Counter-spinning tunnel from stacked card boxes
id: 08-tunnel-from-stacked-boxes
revision: 5cabc2f0
job: keep-it-alive; support: add-depth
status: unproven
what it does for a beat: Extends the spinning box (07) into a deep tunnel of photo walls whose alternate rings turn in opposite directions; a hypnotic gallery loop or the set for a camera fly-through (09).
what it looks like: Seen end-on, a near square ring of photo cards sits in front of a smaller copy further back, the two rings twisting against each other so the walls cross and fan; more rings can be stacked behind.
ingredients:
- The finished box from 07 (four 3D shape-matte cards parented to a 3D null spinning with time*40)
- A second 3D null — built-in
- Expression on Z Rotation — built-in
steps:
1. Build the box from recipe 07 (said: builds on it).
2. Duplicate all four cards (images and shapes together) (said). The copies keep the same four images as the first box (shown : the copied shapes carry the same image layers as the originals).
3. Push the copied shapes back in Z through Position (said); the four copies are still parented to the first null at this point (shown).
   - Position: 0.0, 0.0, 1340.0 on each copied shape, in the null's space (shown)
4. Add a second null and make it 3D (said "another null"; its Orientation and X/Y/Z Rotation rows shown).
5. Give the second null a negative time expression on Z Rotation so it spins the opposite way (said; value shown and crop).
   - Expression: time*-40 (shown)
6. Re-parent the four pushed-back shapes from the first null to the second null (shown; not spoken).
   - Their Position still reads about 0, 0, 1340 after re-parenting, so the second null sits where the first one does (timeline reading, frame not opened; the null's position is inferred)
7. Optionally keep duplicating rings and moving them back, alternating parents between the two nulls (said: the narrator invites any number of further copies and Z moves; a third and fourth ring are added, with one ring on the second null and the next on the first, shown).
layout: Measured on the result frame (crop below; the viewer shows the middle 70% x 64% of the 1920x1080 picture). Tunnel centred on the frame centre (measured). The front ring's outer extent is about 69% of the crop width (measured); the back ring, 1340 px further away, reads about 43% of the crop width (measured), so it appears about 0.6x the front ring. Gaps between walls show the dark background. Two small red outlines at the centre are the nulls' viewer icons, not part of the picture.
timing and easing: No keyframes; first null turns at +40°/s, second at -40°/s (shown expressions), so neighbouring rings counter-rotate at a relative 80°/s (inferred).
variations: As many extra rings and Z moves as you like (said). The opposite spin is optional ("if you like") (said).
pitfalls: none given
build notes: Script: duplicate each image/shape pair of the box (layer.duplicate()), set copy shape.transform.position = [0, 0, 1340] while parented to null A (or set parent first and then position); null B = comp.layers.addNull(), threeDLayer = true, same position as null A, transform.zRotation.expression = "time*-40"; set the copied shapes' parent to null B. For further rings repeat with Z = 2*1340, 3*1340 (spacing for rings 3 and 4 not shown) and alternate parents.
unknowns: Z positions of rings three and four (not shown); null positions in numbers; whether the second null is otherwise a copy of the first.

## Camera push into the card tunnel with depth of field
id: 09-camera-fly-through-with-depth-of-field
revision: df331963
job: hand-over; support: move-camera, add-depth
status: unproven
what it does for a beat: Flies the viewer into the counter-spinning card tunnel (08) while shallow focus melts the near and far walls, for an immersive opener or transition through a wall of images.
what it looks like: From outside, the camera travels straight down the tunnel axis until photo walls surround the frame and stream past; with depth of field on, the nearest cards blur heavily while a band of cards a little further in stays sharper.
ingredients:
- The tunnel from 08 (rings of 3D shape-matte cards on two counter-spinning nulls)
- Camera layer, Two-Node Camera, preset 50mm — built-in; new camera from the timeline's right-click New menu (inferred: the menu is)
- Camera Options: Depth of Field, Focus Distance, Aperture, Blur Level — built-in
- Camera dolly tool (dolly towards cursor) — built-in
- Layer Motion Blur switch, on for every image and matte layer in the prepared comp — built-in (shown; not spoken)
steps:
1. Add a camera (said).
   - Type: Two-Node Camera (shown)
   - Preset: 50mm; Zoom 2666.7 px, 39.6° horizontal angle in the 1920x1080 comp (shown dialog)
   - Enable Depth of Field left off in the dialog (shown)
2. Turn on stopwatches for Position and Point of Interest at 0 s with the camera's default values (said "keyframes for position and point of interest"; shown).
   - Point of Interest: 960.0, 540.0, 0.0 (shown)
   - Position: 960.0, 540.0, -2666.7 (shown)
3. Move to 6 s and push the camera into the tunnel with the dolly tool, which moves position and point of interest together (said; dolly tool highlighted in the toolbar and values shown).
   - Point of Interest: 967.4, 537.0, 3942.2 (shown)
   - Position: 967.4, 537.0, 1275.5 (shown)
4. Open Camera Options, set Depth of Field to On and raise Aperture and Blur Level (said; shown).
   - Depth of Field: On (shown)
   - Aperture: 98.3 px, up from 25.3 (shown; start value from the timeline's reading)
   - Blur Level: 203% (shown)
5. Pull Focus Distance down from 2666.7 px so a different depth comes into focus (said).
   - Focus Distance: 2489.7 px, held still and the value the result picture uses (shown; crop)
   - Afterwards it is dragged on to 2472.7 px as a later tweak just before the section ends (shown, cursor still dragging)
layout: Measured on the result frame (camera parked at 1 s, crop below; viewer shows the middle 82% x 74% of the picture). Card walls fill the whole crop; the dark open core of the tunnel is a narrow diamond about 22% of the crop width, centred (measured). Nearest cards, at the frame edges, are heavily blurred; mid-depth cards at about a third of the way in from the edges are the sharpest (measured by eye). Red outlines in the centre are the nulls' viewer icons.
timing and easing: Two keyframes on Position and Point of Interest, 0 s and 6 s (shown); keyframe markers look like plain linear diamonds (inferred); no easing mentioned.
variations: Focus distance can be set to choose what is sharp ("for better focus") (said).
pitfalls: none given
build notes: Script: cam = comp.layers.addCamera("Camera", [960,540]); cam.autoOrient default two-node (Point of Interest active); zoom 2666.7 (50mm in a 1920-wide comp). Keys: cam.transform.position.setValueAtTime(0,[960,540,-2666.7]), (6,[967.4,537,1275.5]); pointOfInterest (0,[960,540,0]), (6,[967.4,537,3942.2]). cameraOption: depthOfField = 1, aperture = 98.3, blurLevel = 203, focusDistance = 2489.7 (2472.7 was a later tweak). The prepared comp has Motion Blur on for every image and matte layer: layer.motionBlur = true (whether the comp-level motion blur button is on cannot be read). The dolly tool is only an interface convenience; keying the values is equivalent.
unknowns: Where the focus drag ends (2472.7 is the last value read); keyframe easing; the full fly-through is not played back clean in this span. From the camera step on, the comp on screen holds 16 cards with different images from the one built in 07–08, and Motion Blur is switched on for every image and matte layer there, which the 07–08 build does not have (shown; crop), so the author appears to have switched to a prepared version of the tunnel; its ring spacing and count beyond 16 cards are not shown.

## Ring of 3D photo cards seen from inside
id: 10-inner-ring-carousel
revision: 6aaef1bc
job: keep-it-alive; support: add-depth
status: unproven
what it does for a beat: Puts the viewer in the middle of a slowly turning ring of photo cards, so a gallery wraps around the frame instead of sliding past it. Reach for it for a portfolio, lookbook or "many stories" moment.
what it looks like: On a flat pale grey ground, a row of portrait photo cards with softly rounded corners curves away to both sides; the middle card faces the viewer square-on and its neighbours turn inward like the inside wall of a drum. The ring turns steadily about its vertical axis.
ingredients:
- Shape layer (rectangle) used as a matte card with a photo layer parented to it — built-in (shown; the card itself is technique 01-rounded-shape-matte-media-card)
- 3D Layer switch — built-in (said; shown)
- Anchor Point Z — built-in (said; shown)
- Y Rotation — built-in (said; shown)
- Null object, 3D — built-in (said; shown); Layer > New > Null Object (inferred, menu not shown)
- Expression on the null's Y Rotation — built-in (said "time expression"; text shown)
steps:
1. Start from one card: a centred rectangle shape layer with a photo layer parented to it; the shape's eye is off and the photo shows only inside it (shown : photo's Parent column points at the shape, shape's eye off). That the shape is the photo's track matte is inferred from technique 01.
   - Comp: 1920 x 1080, 23.976 fps, 15 s (shown, project panel)
   - Background: flat pale grey, about RGB 228, 228, 228 (measured on the result frame)
2. Turn on the 3D switch for both the shape and the photo (said; shown being clicked, both on).
3. Push the shape layer's Anchor Point Z far negative so the card moves away from the viewer and its pivot stays at the comp centre (said, "negative 1500"; shown). The card shrinks in the viewer as the value grows (shown →).
   - Anchor Point: 0.0, 0.0, Z (shown). The value was scrubbed, not typed: −1430, −1510, and the last reading before the property was closed is −1480.0 (shown). The narrator says −1500; the screen ends at −1480. Either works: this number is the ring's radius in pixels.
   - X and Z Rotation stay 0 (shown)
4. Duplicate the card (shape and its photo together) and give the copy's shape a Y Rotation one step further round (said; shown).
   - Y Rotation: 0x−24.0° (said "negative or positive 24 degrees"; shown, crop)
   - Orientation stays 0, 0, 0 (shown)
5. Keep doubling: select all the newest copies, duplicate them, and with the new shape layers selected scrub their Y Rotation together so every copy moves the same amount and the 24° spacing carries on (said, "incremental plus 24 degree moves"; the screen steps negative, and the screen wins on the sign; shown, several layers' Y Rotation moving in step under one drag cursor). The ring grows 1 → 2 → 4 → 8 → 16 cards (shown).
   - To keep the list short while doing this, the photo layers are set shy and shy layers are hidden, so only the card shapes are listed (shown: only the shape rows, even layer numbers, remain in the list; the photo rows carry the shy switch; the click on the hide-shy button itself is not seen, inferred). This does not change the picture.
   - Cards 3 and 4: −48°, −72° (shown)
   - Cards 5–8: −96°, −120°, −144°, −168° (shown)
   - Cards 11–16: −216°, −240°, −264°, −288°, −312°, −336° (shown)
   - 360 / 24 = 15, so 15 cards close the ring exactly. The build makes 16, and by the values shown two cards share one place (inferred). The finished version shown has 15 cards (shown, the top card layer is the 15th).
6. Add a null, parent every card shape to it (said; shown, Parent column of all shapes set to the null), then turn the null's 3D switch on (shown being clicked; null shows Orientation and X/Y/Z Rotation). The photos stay parented to their own shapes (shown).
   - Null position: left where it was made; its outline's corner sits at the picture centre in the result (shown; that it is at the comp centre is inferred)
7. Add an expression to the null's Y Rotation so the ring turns on its own (said "time expression"; the stopwatch tooltip and the typed expression are shown). Alt-clicking the stopwatch is the usual way and the tooltip mentions it, but the click itself is not seen (inferred).
   - Expression on Y Rotation: `time*20` (shown)
8. Swap in different photos per card (shown in the finished file, every card has its own photo). The recording does not show the swap: the build still has 16 card shapes, and the screen shows a different, pre-made file with 15 card shapes, photo layers labelled differently and set shy (shown).
layout: Measured on the result crop (picture 1492 x 840 with the top 50 px left out, so heights below are shares of the full 840 px picture height). Centre card: about 27% of the picture width and 59% of its height, centred (measured). Its two neighbours sit with centres at about 19% and 81% of the width, about 28% wide and 62–64% tall, turned inward (measured); only thin slivers of the next cards show at the left and right edges (measured). Gaps between cards about 3% of the width (measured). The flat card before it was made 3D measured about 30% of the comp width by 66% of its height (measured, about 570 x 710 px in the 1920 x 1080 comp; approximate, small frame).
timing and easing: Ring spin from the expression `time*20`: 20° per second, a full turn in 18 s (shown expression; arithmetic inferred). No keyframes, no easing.
variations: The narrator gives the step as "negative or positive" 24°, so the ring can be built in either direction (said).
pitfalls: none given
build notes: By script: for i in 0..14, a rectangle shape layer (`ADBE Vector Shape - Rect`, about 570 x 710 px, rounded corners) at the comp centre with `threeDLayer = true`, `transform.anchorPoint = [0, 0, -1500]` (or −1480 as on screen) and `transform.yRotation = -24 * i`; above each, a 3D photo layer parented to its shape and set to use the shape as its alpha track matte (`setTrackMatte(shape, TrackMatteType.ALPHA)` in AE 2023+), shape hidden. Add a 3D null at the comp centre (`layers.addNull()`, `threeDLayer = true`), parent all shapes to it, and set `transform.yRotation.expression = "time*20"`. Note: the anchor offset goes on the shape layer, whose position is the ring's centre; the photo just follows its parent. The default camera (no camera layer) gives the result frame here; technique 11 adds a wide camera. Check in a build: by the numbers (anchor about −1500, default camera about 2667 px in front of the centre) the near half of the ring sits between the camera and the ring centre. In the build those near cards show in the viewer only as thin outlines spanning the frame and no photos render there; confirm that they do not block the view under the default camera.
unknowns: Card size in pixels and corner radius (the card build belongs to technique 01); whether the Z anchor was meant to land on −1500 or −1480; Y Rotation of cards 9 and 10 (not shown; inferred −168° and −192°); how the photos were swapped; the null's exact position; the photos' own scale.

## Depth-of-field camera on a null, pushed in through the shot
id: 06-depth-of-field-camera-push-on-null
revision: cecbb36e
job: move-camera; support: keep-it-alive, add-depth
status: unproven
what it does for a beat: Add this on top of a 3D type entrance to make it feel filmed: letters close to the lens go soft, and a slow camera push keeps the frame alive after the word has landed.
what it looks like: The same tumbling-letter entrance as 05, now seen through a camera with depth of field: letters that pass close to the lens are heavily blurred while the ones at the word's depth stay sharp, and the camera creeps slightly closer over the whole clip.
ingredients:
- Camera layer, Two-Node Camera, Preset 50mm — built-in; Layer > New > Camera… (shown, shortcut Ctrl+Alt+Shift+C shown in the menu)
- Null Object (3D) — built-in; right-click in the timeline > New > Null Object (shown context menu; Null Object, Ctrl+Alt+Shift+Y, named on screen)
- The animated 3D type from 05 — built-in
steps:
1. Add a camera from Layer > New > Camera… (said "create a camera layer"; menu shown, so the path is shown, not said)
2. In Camera Settings keep the defaults and click OK (shown)
   - Type: Two-Node Camera (shown)
   - Preset: 50mm; Zoom 940.74 mm; Focal Length 50.00 mm; Film Size 36.00 mm; Angle of View 39.60° (shown)
   - Enable Depth of Field: unticked in the dialog (shown); the viewer confirms no blur yet
3. Twirl open Camera Options and switch Depth of Field On (said "enabled depth of field"; shown)
   - Zoom: 2666.7 pixels (39.6° H) (shown)
   - Focus Distance: 2343.7 pixels (default, unchanged; shown)
   - Focus Area Width: 0.0 (shown; a Camera Options property shown in this version)
   - Near, Far Blur Level: 100.0,100.0% (shown; also shown in this version)
4. Raise Aperture a little for stronger blur (not said; shown)
   - Aperture: 25.3 pixels → 30.3 pixels (shown)
5. Create a Null Object (said "create like a 3d null object"; shown context menu, the new null at the top of the stack) and switch its 3D Layer switch on (said "3d"; shown switch empty, cursor on it, on)
6. Parent the camera to the null with the Parent & Link column (said; shown, Camera's parent reads the null)
7. Keyframe the null's Position in Z so the camera travels forward across the clip (said "keyframe the z position of the null"; shown)
   - Null Position at 0:00:00:00: 960.0,540.0,0.0 (shown)
   - Null Position at 0:00:04:23: 960.0,540.0,231.0 (shown; first typed as 206.0, then raised to 231.0)
8. Extend the work area end from about 4.1 s to about 5.0 s so the preview covers the push (not said; shown against the; preview only, it does not change the render)
9. Play it back to judge the blur and push (shown; frame cut from source)
layout: measured on the result crop 730,350,1510,845 (shares of that crop, i.e. the comp view through the new camera):, after the word has landed and while the push continues, the word spans about 11%–91% of the width, centred (measured); letter tops at about 33% and bottoms at about 66% of the height (measured); the floor shadow fills the frame from about 68–70% of the height down (measured); in 05's framing without the push the same word spans about 13%–89% (measured); a letter entering at the right edge already covers about the right quarter of the width, cut off by the edge, and is soft (measured)
timing and easing: two linear Position keyframes on the null (diamond icons, shown): Z 0 at 0:00:00:00 → Z 231 at 0:00:04:23 (comp at 23.976 fps). The 05 text animation itself ends at 0:00:04:01, so the push carries on slightly past the landing. No easing given.
variations: parenting to a null is offered as optional ("if you wish", said); the narrator calls it just his way of moving a camera (said)
pitfalls: none given
build notes: cam = comp.layers.addCamera("Camera 1", [960,540]) (Two-Node by default with point of interest; preset values from a 50 mm camera on a 1920x1080 comp give Zoom 2666.7). cam.property("ADBE Camera Options Group").property("ADBE Camera Depth of Field").setValue(1); Aperture (ADBE Camera Aperture) = 30.3; Focus Distance left 2343.7. Focus Area Width and Near, Far Blur Level are Camera Options properties as this version shows them; their match names are not known — find them by walking the Camera Options group by script or set them by hand (here they stay at defaults, so they can be left alone). nul = comp.layers.addNull(); nul.threeDLayer = true; cam.parent = nul; nul Position keys [960,540,0] at 0 and [960,540,231] at 4.96 s (0:00:04:23). Positive Z on the null moves the camera toward the word (the comp's default camera space has the lens at negative Z).
unknowns: frame is cut from the source video. Whether the playback runs at real speed is not settled (the entrance looks quick on screen; inferred only), so use the keyframe times, not the on-screen speed. The camera's own Position and Point of Interest are not shown after parenting; the comp's total length is not shown; the null's Position keys are not eased on screen

## Depth-of-field camera locked on the subject, with a slow dolly in
id: 04-camera-depth-of-field-focus-lock-dolly
revision: 4baff6c1
job: move-camera; support: establish-place, add-depth
status: unproven
what it does for a beat: Turns a staged 2D-in-3D layout into a filmed shot: near and far layers fall out of focus, the subject stays sharp, and a short push-in gives the opening beat life without any layer being animated.
what it looks like: Two small figures on a rocky ledge in a dark blue night scene; foreground branches, a distant tree line and city are soft while the figures stay crisp, and over three seconds the view creeps in towards them.
assumes: the layers are already 3D and spread out in Z (far scenery pushed back and scaled up, foreground pulled forward, the subject at Z 0), as in technique 03.
ingredients:
- Camera layer, Two-Node Camera, 50mm preset — built-in; Layer > New > Camera (path inferred; the Camera Settings dialog is shown)
- Camera Options > Depth of Field, Aperture — built-in
- Set Focus Distance to Layer (layer right-click menu) — built-in
- Dolly to Cursor tool — built-in (tool active in the toolbar, shown; named on screen with shortcut 3)
steps:
1. Add a camera layer to the comp. (said; Camera Settings dialog shown)
   - Type: Two-Node Camera (shown)
   - Preset: 50mm, giving Zoom 2666.7 pixels (39.6° H) in a 1920-wide comp (shown for the preset; zoom shown)
   - Enable Depth of Field box: left unticked in the dialog (shown); depth of field is switched on afterwards in the timeline (step 2)
2. Open the camera's Camera Options and set Depth of Field to On. (said; On shown)
3. Raise the Aperture so out-of-focus layers blur more. (said)
   - Aperture: starts at the default 25.3 pixels (shown), dragged up and landed at 80.3 pixels on the first pass (shown); the final build uses 26.3 pixels (step 7)
   - Focus Area Width: 0.0; Near, Far Blur Level: 100.0, 100.0% (shown, unchanged defaults)
4. Select the subject layer (the two-figure layer) together with the camera layer, right-click, and choose Set Focus Distance to Layer. (said; the two layers selected and the context menu open, shown; the command's submenu position is off-screen, so the menu path is inferred)
   - Result: Focus Distance turns red (driven by an expression) and reads 2666.7 pixels, the distance to the subject (shown)
5. At 0:00, set keyframes on the camera's Point of Interest and Position. (said; keyframes shown)
   - Point of Interest: 960.0, 540.0, 0.0 (shown)
   - Position: 960.0, 540.0, -2666.7 (shown)
6. Move to 0:00:03:00 and push the camera in with the Dolly to Cursor tool, which records new keyframes on both properties. (said; first try shown : Point of Interest 958.3, 542.6, 0.0, Position 958.3, 542.6, -1474.3, Focus Distance red 1474.3)
7. The author then redoes the shot with less blur, done on screen without a word: (shown)
   - Back at 0:00 the focus lock is gone — Focus Distance reads a plain white 2343.7 — and Aperture is being dragged down (shown)
   - Aperture: 26.3 pixels, with Focus Distance red again at 2666.7, so Set Focus Distance to Layer has been applied again (shown)
   - The 0:00 keys stay at Point of Interest 960.0, 540.0, 0.0 and Position 960.0, 540.0, -2666.7 (shown)
   - So the final build order is: Aperture 26.3 → Set Focus Distance to Layer → keys → dolly (inferred from the order). The result was filmed at Aperture 26.3, not 80.3.
8. Dolly in again to the end key at 0:00:03:00. (shown)
   - Point of Interest: 958.7, 542.0, 0.0 (shown)
   - Position: 958.7, 542.0, -1749.5 (shown)
   - Focus Distance follows automatically: 1749.5 pixels at 3:00, 2475.6 at 0:00:00:15 (shown)
9. Play it back: the shot dollies in and the figures stay sharp throughout. (shown)
layout: on the result frame (part-way through the push; the framing grows over the move): the two figures stand together from about 35% to 50% of the picture width, heads at about 41% and feet at about 80% of the picture height, so each figure is about 39% of the picture height tall (measured); the ledge's flat top sits at about 78% of the height and its front edge ends at about 62% of the width (measured); the lamp glows at about 64% across, 72–80% down (measured); a soft pine stands at about 20–33% across, from about 10% down (measured); a soft stone wall fills the right 10% (measured).
timing and easing: two keyframes on Position and Point of Interest, 0:00 and 0:00:03:00 in a 23.976 fps comp (shown); the keyframe icons look like plain diamonds, i.e. linear, no ease (inferred).
variations: the aperture can be raised for heavier blur (said).
pitfalls: without linking focus to the subject, a moving camera lets the subject drift out of focus — that is the reason given for the focus lock (said, paraphrased).
build notes: `comp.layers.addCamera("Camera 1", [960,540])` then set `cameraOption.depthOfField = 1`, `cameraOption.aperture = 26.3` (the value the result was filmed at), zoom 2666.7. "Set Focus Distance to Layer" is a menu command (Layer > Camera > Set Focus Distance to Layer — path inferred); by script, write the equivalent expression on `cameraOption.focusDistance`, e.g. `length(toWorld([0,0,0]), thisComp.layer("<subject>").toWorld(thisComp.layer("<subject>").transform.anchorPoint))` (inferred; the expression text After Effects writes is not shown). Keyframe `transform.pointOfInterest` and `transform.position` with `setValueAtTime(0, …)` and `setValueAtTime(3, …)`; the Dolly to Cursor drag itself is interface-only but only its resulting values matter.
unknowns: why the author lowered the aperture from 80.3 to 26.3 and redid the lock and keys (not said); keyframe easing (not set on screen); exact comp size (960, 540 centre suggests 1920×1080, inferred); the expression text that Set Focus Distance to Layer creates.

## Endless wind sway from two rotation keys and a ping-pong loop
id: 05-looping-wind-sway-rotation
revision: 1cb03031
job: keep-it-alive; support: establish-place
status: unproven
what it does for a beat: Gives a still illustrated scene a reason to move (wind) with almost no keyframing: each branch or tree rocks back and forth forever from just two keys.
what it looks like: Silhouetted foreground branches with leaves at the frame edges rock gently by about ten degrees, back and forth, while the rest of the night scene holds still.
assumes: separate 3D layers per scene element (technique 01/03) and, optionally, the camera from technique 04; nothing here depends on the camera.
ingredients:
- Layer Z Rotation keyframes — built-in
- Anchor Point (moved to the branch's base if needed) — built-in
- Expression `loopOut("pingpong")` — built-in
steps:
1. Pick the branch layer to animate. On a 3D layer the rotation that rocks it in the picture plane is Z Rotation. (said: rotate the branches and trees; Z Rotation used, shown)
2. If the branch does not pivot from its base, move its anchor point there first, since rotation turns around the anchor. (said; the anchor move itself is not shown)
3. At 0:00 set a keyframe on Z Rotation. The branch already sat at 123.0° before any key, so the first key just records its existing rotation. (shown: 123.0° with no stopwatch on)
   - Z Rotation at 0:00: 123.0° (shown — the value at 0:00:00 with the loop already on, which equals the first key)
4. Move to 0:00:00:23 (23 frames, just under one second at 23.976 fps) and set a second key a few degrees further. (shown)
   - Z Rotation at 0:00:00:23: 134.0° (shown, landed; keys at 0:00 and 0:00:00:23 visible)
5. Add an expression to Z Rotation (the narrator's word is heard as "alter the stopwatch", read here as Alt-click on the stopwatch — inferred) and type `loopOut("pingpong")`. (said: use the loop out ping pong expression; typed text shown)
6. Scrub or play: the branch now swings 123° → 134° → 123° … for the whole comp. (shown: 133.5° at 0:00:01:00)
7. Repeat on another branch with its own values. (shown, not spoken)
   - Second branch Z Rotation: already 64.0° before any key (shown); first key at 0:00 at 64.0° (shown)
   - Second key at 0:00:01:00, dragged to roughly 70° — the cursor covers the digits at every kept moment (shown, unread); no expression is seen being added to this second branch before the author moves on
layout:, measured inside the result crop (the build comp with the playhead at 0:00:00:22, part-way through the camera push): two leafy foreground branches, heavily blurred by the camera's depth of field, frame the shot — one up the left side (about 0–25% of the width, full height) and one across the upper right (about 65–100% of the width, top 41% of the height) (measured); the outline of the selected layer (the second branch, not the first swaying one) runs from its top handle at about 47% across, 2% down, towards about 72% across at the bottom edge (measured); the two figures stand at about 36–49% of the width, heads about 39% and feet about 77% down (measured).
timing and easing: two keys, 0:00 and 0:00:00:23 (shown); swing 11°; ease not set on screen (keys look like plain diamonds, inferred); loop by `loopOut("pingpong")`.
variations: use it on trees as well as branches (said).
pitfalls: rotation turns around the anchor point, so a badly placed anchor makes the branch spin rather than sway (said, paraphrased).
build notes: `layer.property("ADBE Transform Group").property("ADBE Rotate Z").setValueAtTime(0,123); …setValueAtTime(23/23.976,134); prop.expression = 'loopOut("pingpong")';`. For the anchor: set `ADBE Anchor Point` to the branch base and compensate Position so the art does not jump (by hand in the interface with the Pan Behind tool, or by script). Nothing here needs the interface.
unknowns: a clean view of the sway on its own (none exists in the video, see result); how the finished scene's branches were driven (keys plus loopOut, or something else); where the anchor point was placed; the second branch's second value and whether it got the loop expression. From the first branch reads a plain 134.0° at 0:00:01:00 where it earlier read 133.5° from the loop — whether its keys or expression were touched in between is not shown.

## Grass rippling in the wind with Wave Warp
id: 06-wave-warp-grass-wind
revision: e6a8aee2
job: keep-it-alive; support: establish-place
status: unproven
what it does for a beat: Makes a field of many thin blades (grass, reeds, fur-like edges) move in the wind without animating a single blade: one effect, one setting, and it moves on its own.
what it looks like: A strip of dark silhouetted grass blades along the bottom of a night scene ripples sideways in a continuous soft wave while the camera dollies in.
assumes: the grass is its own layer (technique 01), already graded with the scene's Tritone and Curves (technique 02); the camera move from technique 04 is playing but is not needed.
ingredients:
- Wave Warp — stock; Effects & Presets search, found under Distort > Wave Warp (shown)
steps:
1. Select the grass layer, if useful, solo it to see the blades alone. (shown, not spoken: solo on, grass alone on black, solo off again)
2. Find Wave Warp in Effects & Presets (search text "Wave wa") and drag it onto the grass layer in the timeline; it sits below the layer's existing Tritone and Curves. (said: try the Wave Warp effect; search and Distort group shown; applied, shown)
   - Wave Type: Sine (shown, default)
   - Wave Height: 10 (shown, default)
   - Direction: 0x +90.0° (shown, default)
   - Wave Speed: 1.0 (shown, default)
   - Pinning: None (shown, default)
   - Phase: 0x +0.0° (shown, default)
   - Antialiasing (Best Quality): Low (shown, default)
3. Widen the waves — the one setting the author says to play with. (said)
   - Wave Width: 40 → 65 (said: change the wave width; 65 shown, landed)
4. Duplicate the grass layer, possibly with other changes. (inferred) The video jump-cuts between; after the cut: (shown, not spoken)
   - the stack holds two grass layers next to each other where there was one
   - the tall tree layer has moved from above the two dead-tree layers to below them
   - a switch in the first switches column is now on for seven layers (both branches, both grass, both dead trees and the tall tree layer); which switch it is cannot be told for sure from the icon
   - the Effect Controls panel is empty and the viewer shows a different render
   The duplication itself, and whether the copy carries the same Wave Warp, is never shown; the playback in step 5 is of this changed state.
5. Play: the blades ripple continuously with no keyframes. (shown)
layout: on the result frame (one moment of the looping camera-push playback; the framing changes over the window): the grass is a dark fringe of blades along the bottom of the picture, about the lowest 12% of the height, easiest to see from about 60% to 100% across (measured); the ledge top, with its own tufts, runs at about 80–83% down from the left edge to about 64% across (measured); the two figures stand at about 33–50% across, heads about 41% and feet about 84% down (measured); the lamp glows at about 66–70% across, 80–90% down (measured).
timing and easing: none given; Wave Warp animates by itself from Wave Speed 1.0, no keyframes (no keyframe icons on the effect, shown).
variations: Wave Width is the value to adjust (said); none else given.
pitfalls: none given.
build notes: `layer.property("ADBE Effect Parade").addProperty("ADBE Wave Warp")`, then set "Wave Width" to 65; leave Wave Type Sine, Wave Height 10, Direction 90°, Wave Speed 1.0, Pinning None, Phase 0 (defaults). Duplicate with `layer.duplicate()`. Soloing (`layer.solo = true/false`) is only for looking.
unknowns: the duplication and the other changes in the jump (tree layer reordered, a switch turned on for seven layers) are not shown being made or explained, and the result playback comes after them; whether the grass copy was offset, scaled or given different Wave Warp values; whether Pinning was meant to stay None (the layer's edges are free to move); the grass is small in the frame at the end of the dolly, so the ripple is hard to read in a single still — compare motion along the bottom strip over the window, not one frame.

## Leaves blown across the frame with textured particles
id: 07-leaf-particles-blown-across
revision: 59d14a07
job: keep-it-alive; support: establish-place, fill-the-backdrop
status: unproven
what it does for a beat: Sells wind in an illustrated scene by sending a steady trickle of tumbling leaves across it from one side, without animating a single leaf by hand. Assumes a finished, graded 2D scene in a 3D comp with a camera (techniques 02–04) and the scene's Tritone plus Curves grade on a layer to copy from.
what it looks like: Two versions are on screen. At the author first shows an already-finished scene comp with its own CC Particle World settings, then rebuilds the effect step by step in a working comp; the steps below follow the rebuild, and the finished example's values are given in step 13. In both, small dark-green leaves, graded to match the night scene, drift and spin from the left edge across a moody 2D landscape with two figures on a cliff, scattered over the whole frame at different sizes.
ingredients:
- a single leaf illustration (vector or PNG) as a layer in the comp — built-in (footage)
- Solid layer — built-in; Solid Settings dialog shown
- CC Particle World — stock (Cycore); applied to the solid (shown; how it was applied is not shown; the narration's "particle world" matches the screen)
- Tritone and Curves copied from another scene layer — stock (shown)
steps:
1. Bring a leaf image into the comp as its own layer at the top of the stack (said; shown)
   - Leaf layer Scale: changed from 45.0% to 31.0% (shown then; probably irrelevant, see build notes)
2. Make a new comp-size solid and rename it for the particles (said "solid layer"; shown)
   - Width x Height: 1920 x 1080, comp size (shown)
   - Colour: any; it is replaced by the effect (inferred)
3. Apply CC Particle World to the solid (said; shown)
   - Birth Rate: 2.0, left at default (shown)
4. Under Particle, set the particle type to textured quads and point the texture at the leaf layer (said; shown)
   - Particle Type: Textured QuadPolygon (shown)
   - Texture Layer: the leaf layer (shown; still None)
   - Rotation Speed 180.0, Initial Rotation 360.0, Rotation Axis Any Axis, Size Variation 50.0%, Max Opacity 75.0%, Color Map Birth to Death: left as found (shown; not touched on screen, so likely defaults — inferred)
5. Switch off the leaf layer's visibility so only the particles show it (said; shown, eye of the leaf layer is empty)
6. Move the producer to one side of the frame (said; shown)
   - Producer > Position X: -0.82 (shown)
   - Producer > Radius Y: 0.245 (shown; not mentioned, it turns the emitter into a tall vertical strip so leaves enter along the whole left edge — inferred)
   - Radius X and Radius Z: 0.025, unchanged (shown)
7. Raise Longevity so particles live long enough to cross the frame (said; shown)
   - Longevity (sec): 26.30 first (shown), later 28.70 (shown)
8. Under Physics, set Animation to Twirl (said as the way to see the particles; shown; changed from the default Explosive: menu open on Explosive, Twirl is the fifth entry, after Explosive, Direction Axis, Cone Axis, Viscouse; the untouched Velocity 1.00, Gravity 0.500, Extra 0.50 show with Twirl already set)
9. Lower gravity so leaves fly sideways rather than drop (said; shown)
   - Gravity: 0.020 (shown; dragged through -0.080 on the way, panel crop)
10. Tune Velocity and Extra until the drift looks right (said; shown)
   - Velocity: 0.91 (shown)
   - Extra: 0.80 (shown; 1.02 is mid-drag)
   - Inherit Velocity 0.0, Resistance 0.0, Extra Angle 1x +0.0°: unchanged (shown)
11. Copy the scene's mood grade (Tritone, then Curves) from a scene element that already carries the technique-02 grade (here a branch layer) and paste onto the particle solid so the leaves sit in the same light (said; shown on the source layer, on the particle layer)
12. Adjust particle size under Particle (said; shown)
   - Birth Size: 0.150 (shown; 0.250 before)
   - Death Size: 1.500 (shown; Birth Size lands, Death Size, — just after the technique's end; leaves grow as they age)
13. For reference, the finished example comp shown at the start uses different CC Particle World values; match these if you want the author's own final look rather than the rebuild (shown)
   - Birth Rate 2.0; Longevity (sec) 30.00; Producer Position X -1.18, Position Y 0.00, Position Z 0.00; Radius X 0.025, Radius Y 1.365 (an emitter strip about as tall as the frame), Radius Z 0.025 (shown)
   - Physics: Animation Twirl, Velocity 0.93, Inherit Velocity 0.0, Gravity 0.002, Resistance 0.0, Extra 1.16, Extra Angle 1x +0.0° (shown)
   - Rebuild versus finished: Longevity 28.70 vs 30.00; Position X -0.82 vs -1.18; Radius Y 0.245 vs 1.365; Velocity 0.91 vs 0.93; Gravity 0.020 vs 0.002; Extra 0.80 vs 1.16. The finished example's Particle settings (type, sizes) were not shown in that frame.
layout: measured on a still of the result, as shares of the crop (the viewer picture minus a thin top strip, so close to the whole comp): the two figures stand side by side from about 33% to 50% of the width, each about 49% of the crop height tall, feet at about 86% down (measured); the cliff top sits at about 81% down (measured); leaves are specks about 1% of the crop width across, scattered over the upper two-thirds (measured); in this frame only a dozen or so leaves are in view (measured)
timing and easing: none given; the effect runs on its own from the solid's in-point, no keyframes shown.
variations: the author says to play with the physics values until the leaves fly across as wanted, and that size can be changed under the particle settings.
pitfalls: none given beyond the implied ones: with normal gravity the leaves just fall (said), and with short longevity they die before crossing (said).
build notes: Layer > New > Solid (comp size), then addProperty("CC Particle World"). Properties as shown in Effect Controls: "Birth Rate", "Longevity (sec)", group "Producer" ("Position X", "Radius X/Y/Z"), group "Physics" ("Animation" popup — Twirl, fifth menu entry (whether the script index counts the menu separators is untested, inferred); "Velocity", "Gravity", "Extra"), group "Particle" ("Particle Type" popup — Textured QuadPolygon; "Texture" > "Texture Layer" takes a layer index; "Birth Size", "Death Size"). The second Texture Layer dropdown reads "Sou..." (Source, shown), so the leaf layer's own Scale should not affect the particles (inferred). Set leaf layer enabled = false. Copy Tritone/Curves by duplicating the property values from the graded layer onto the solid (Tritone colours and the Curves shape are given in technique 02). Popup index values must be checked against the installed CC Particle World.
unknowns: result caveat: the only clean stretch after the final sizes land is (frame cut from the source video); it is short and shows few leaves, and a Layer menu covers the viewer. A longer stretch with the final values is with the same crop, but the particle layer is selected there, so its anchor crosshair sits near the right-hand figure (best frame:); the earlier stretch has the old 0.250 sizes. At the author opens the Opacity Map graph; nothing visibly changes there. Also: how the leaf image was made or chosen; the solid's colour; whether Birth Rate, Rotation and Opacity values were ever changed (they look like defaults); Extra Angle, Floor, Direction Axis and Gravity Vector were not opened; leaf texture colour before the grade; the exact copied grade values (see technique 02).

## Small body shifts on a wide-shot figure with puppet pins
id: 09-puppet-pin-subtle-character-motion
revision: 51175c8a
job: keep-it-alive; support: establish-place
status: unproven
what it does for a beat: Keeps a still character from looking frozen in a wide establishing shot by nudging a few puppet pins, enough to read as breathing or shifting weight. Assumes the character is its own layer in the scene (technique 01), here already carrying the scene grade (technique 02).
what it looks like: A small dark silhouette of a standing figure on a cliff edge makes a slight shift of head, hips and one leg; at the shot's size the movement is barely noticeable, which is the point.
ingredients:
- Puppet Position Pin Tool — built-in; toolbar (shown, highlighted)
- Puppet effect (added automatically by the first pin) — built-in (shown in the layer's Effects list)
- Layer panel — built-in; the character layer opened on its own (shown)
steps:
1. Open the character layer in its Layer panel and pick the Puppet Position Pin Tool (shown; not said)
   - Mesh Expansion: 3, Density: 10 (shown, toolbar; defaults, not changed)
2. Click pins onto the figure: head, waist, both knees, both feet — six in all (said "puppet pin tool"; shown)
   - Puppet Engine: Advanced (shown)
3. Move some pins over time to make the subtle motion (said; shown)
   - Pins are placed with the time indicator at 0:00:01:22, about 1.9 s (shown)
   - The author then goes to 0:00:00:23, about 0.96 s, and moves pins there, giving second keys at that time (shown); by then the first keys sit at 0 s (shown; how they got there is not shown)
4. Select the second keys and drag them later, to about 1.43 s, so the move is slower (shown, end state; not said)
   - Pins with two Position keyframes (0 s and about 1.43 s, measured on the ruler): head, waist, one knee, one foot (shown)
   - Pins with one keyframe at the start only, acting as anchors: the other knee and foot (shown)
   - Second-key values on screen, Layer-panel pixels: head 569.1,89.1; waist 498.3,516.6; knee 610.3,749.7; foot 603.4,1001.1; anchors 468.6,761.1 and 475.4,969.1 (shown)
layout: measured on frame, as shares of the crop, which is the whole viewer picture: the two figures span about 35% to 46% of the width, each about 30% of the picture height tall, feet at about 76% down (measured); the pinned figure is the left one (inferred from its spiky hair, matching the Layer panel)
timing and easing: two keys per moving pin, at 0 and about 1.43 s, after the second keys were retimed from about 0.96 s (shown); ease not visible, keyframe icons look like plain diamonds (inferred linear). No loop shown, so after 1.43 s the pose holds.
variations: the author says simple motion is enough for a wide shot and to go further if wanted; nothing specific.
pitfalls: none given.
build notes: ExtendScript cannot create puppet pins; placing them needs the Puppet Position Pin Tool by hand in the Layer or Comp panel. Once pins exist, their keyframes can be set by script under the Puppet effect: "Puppet" > "Mesh 1" > "Deform" > "Puppet Pin N" > "Position" (names shown). Pin numbers follow click order: on screen pin 1 is the head and pin 6 a foot.
unknowns: the starting position of each pin (the reader's "New values" list is not tied to pin numbers); easing; whether the second figure was pinned too (only one is shown); how much each pin moved (the screen shows only end values; probably a few to a few tens of pixels, inferred). Result caveat: frame is cut from the source video; the panels zoom before and after this 0.3 s window, and the panel timecode there reads 0:00:00:00, before the keys move anything. The pin motion cannot be judged in this crop; check a build by comparing pin values instead.

## Wind in a still character's hair
id: 12-isolated-hair-wave-and-puppet
revision: 62e1b40d
job: keep-it-alive
status: unproven
what it does for a beat: Assumes a single flat character image already placed and graded in a close-up comp (technique 11). Gives a still illustrated character life in a close-up by letting only the hair drift, without a rigged model.
what it looks like: A front-facing anime girl with long wavy hair; the hair is cut out on its own layer and gently warped and pinned so it moves slightly, while the face and body stay still; a skin-coloured patch behind the face covers any gap the moving hair opens.
ingredients:
- Pre-compose — built-in; right-click the layer > Pre-compose... (Ctrl+Shift+C), context menu shown (crop)
- Quick Selection Tool (Layer panel), which adds the Object Matte effect — built-in (Object Matte Version 4.0 shown; it needs a recent After Effects release that has these tools, inferred)
- Wave Warp — stock; Effect > Distort > Wave Warp (Distort category shown in Effects & Presets)
- Puppet Position Pin Tool / Puppet effect — built-in
- Solid layer with a pen mask — built-in; Layer > New > Solid (inferred; Solid Settings dialog shown)
steps:
1. (Optional) look for a character pack with several angles of the same character (said; a stock site of character sets is)
2. Pre-compose the character layer (said); in the dialog choose "Leave all attributes" so the grade stays on the outer layer (shown, crop; the menu entry is shown)
   - New composition name: given a new name while typing (shown); the resulting comp is the image's own size, 2752 x 1536, 15:00, 23.976 fps (shown)
3. Open the new comp, open the character layer in the Layer panel and pick the Quick Selection Tool from the toolbar flyout (shown; the flyout lists Object Matte Tool, Quick Selection Tool, Selection Brush Tool, Refine Edge Tool, all Alt+W)
4. Paint over the hair to select it (said; shown — pink outline around the hair in the Layer panel); hold Alt and paint to take away parts you do not want (said; the Alt strokes themselves are not clearly visible)
   - This adds an Object Matte effect: Version 4.0, Feather 5.0, Contrast 80.0%, Shift Edge 0.0%, Reduce Chatter 0%, Fine-tune Object Matte on, Render Refine Edge on (shown)
   - Result: hair alone on black, with a small sliver of neck/skin left in (shown); the author admits the cut is rough (said)
5. Duplicate the layer (said; Ctrl+D inferred; two copies shown)
6. On the lower copy, tick Object Matte > Invert Foreground/Background so it shows everything except the hair (said; shown,: layer 2 selected, box ticked, whole character visible)
7. On the upper (hair) copy, raise Object Matte Feather to 18.4 (shown, unsaid)
8. Drag Wave Warp onto the hair layer (said; shown dropping it on layer 1)
   - Wave Type: Sine (shown crop)
   - Wave Height: 2 (shown, read from crop)
   - Wave Width: 300 (shown; changed from 40 to 300)
   - Direction: 0x +90.0°; Wave Speed: 1.0; Pinning: None; Phase: 0x +0.0° (shown)
9. With the Puppet Position Pin Tool, place pins over the hair and move them a little over time (said; shown : ten pins along the outer hair and fringe, keyframed)
   - Puppet Engine: Advanced; Mesh Rotation Refinement: 20 (shown)
   - Toolbar: Expansion 3, Density 10 (shown)
   - Pin keyframes at 0 s on all pins, at about 1 s on some pins and at 0:00:02:07 on all (shown); example pin values at 2:07: 1952.0,461.7; 731.4,676.6; 1995.4,939.4; 1789.7,1126.9; 909.7,1245.7; 672.0,1250.3 (shown)
   - Keep the motion very small (said)
   - In the effect stack Puppet sits above Wave Warp (shown)
10. Make a solid the colour of the skin to hide the gaps the moving hair opens (said)
   - Solid Settings: 2752 x 1536 px, comp size, Square Pixels (shown)
   - Colour picked with the eyedropper from the face (shown, dialog still open); the solid's label swatch after OK is a pale peach, about #FAD3A1 (shown, crop; hex is approximate, sampled from compressed video)
11. Place the solid at the bottom of the stack and draw a pen mask so it only fills the face area behind the hair (said: use the pen tool to mask it in; shown : solid as layer 3 below both character copies, a mask outlining the face from the fringe down to the chin and collar)
12. Go back to the close-up comp, where the pre-comp now stands in for the character (shown)
layout: on the result crop, the face (brow to chin) spans about 37–63% of the width, centred at about 50%, eyes at about 42% of the height, chin at about 78% (measured); hair spans about 22–83% of the width and runs off the top and bottom (measured); the pine silhouette fills about 0–25% of the width on the left (measured).
timing and easing: puppet pin keys at 0 s, about 1 s and 2:07 (23.976 fps comp); no easing shown. Wave Warp moves on its own at Wave Speed 1.0.
variations: the author says other routes are better (a proper rigged model or a multi-angle character pack); this one is a stopgap.
pitfalls: keep the puppet motion subtle (said); the method leaves visible seams that must be hidden with the colour-matched solid (said); be tidier than the author when selecting the hair (said).
build notes: Pre-compose by script: comp.layers.precompose([idx], name, false) (false = leave attributes). The Quick Selection / Object Matte stroke is painted by hand in the Layer panel; it cannot be scripted. Fallback by script: duplicate the layer, draw a hand-made mask around the hair on the top copy and the same mask Subtract on the lower copy. Wave Warp: "ADBE Wave Warp" (Wave Type Sine, Wave Height 2, Wave Width 300, Direction 90, Wave Speed 1). Puppet: the pins are placed by hand with the Puppet Position Pin Tool; scripting pin creation is not supported, but existing pin positions can be keyed via script. Solid: comp.layers.addSolid([0.98,0.83,0.64], name, w, h, 1), moveToEnd(), add a mask via layer.Masks.addProperty("ADBE Mask Atom").
unknowns: the exact painted hair selection and the Alt subtractions; whether Reduce Chatter 50% on the refine edge was set deliberately (it); the solid's mask shape, feather and whether the solid was dragged down or created there; the puppet pins' starting positions and the about-1 s values; how the hair actually moves: the hair motion is never played back on screen (the comp time display holds 2:07 in the pre-comp and 0:00:02:23 in the close-up through the result window; only rain noise and render refresh change), so a build can only be compared with a held frame; the result frame is cut from the source video. The finished example's character (a separate 1920 x 1080 pre-comp used twice) may have been built differently; its insides are not shown.

# Arsenal recipes: Build aids and unmatched recipes

Generated from the recipe drafts; do not edit by hand. Recipes that help a build but serve no beat, and recipes that fit no job yet. A beat query never returns them; read one by id with ae_arsenal get.

## Swap a layer's photo and keep everything built on it
id: 04-swap-footage-keep-edits
revision: 74f0fe70
job: none (build-aid)
status: proven (accepted 2026-11-16)
what it does for a beat: A time-saver, not a look. Once one card, slot or frame is fully built (transforms, masks or mattes, parenting, keyframes, effects), you put a different photo or clip into it without rebuilding anything.
what it looks like: The result is a before/after swap in the viewer: in a ring of portrait cards orbiting a bicycle wheel, the photo inside one card changes from a woman in an orange cardigan to a different portrait, while the card's position, tilt, crop window and caption stay exactly where they were. The author repeats it on several cards.
ingredients:
- Replace layer source by Alt/Option-drag from the Project panel — built-in; no menu used on screen (Layer > ... not shown)
- Scale property of the swapped layer — built-in
steps:
1. In the Timeline, select the layer whose photo you want to change (the card's photo layer, which sits inside the card build and is parented to its card) (said; shown : the photo layer is highlighted in the layer list)
2. Hold Alt (Windows) or Option (Mac) and drag the new image from the Project panel onto the selected layer in the Timeline (said; shown : drag in progress over the layer list with the add cursor; landed, where the layer's source name has changed and the card shows the new portrait)
   - The layer keeps its place in the stack, its parent, its position and rotation, and the window the photo is clipped to (shown : the new portrait sits tilted inside the same card window; the parent column is unchanged)
3. Because the new image has different pixel dimensions, re-fit it: open the swapped layer's Scale and scrub it until the photo fills the card window again (shown; not said)
   - Scale: reads 16.0 % just after the swap (shown, value under the cursor) and is scrubbed to 21.0 % (shown : settled at 21.0, 21.0 % with no cursor on it)
4. Repeat on other cards with other portraits (shown : three of the five visible cards now carry new photos; a second card's photo layer has a new source)
layout: Measured (picture crop below, 1400 x 788). Five cards stand on an arc above a bicycle wheel. The upright centre card is about 17 % of the picture width wide and 39 % of the picture height tall (photo about 28 % of the height, white caption strip below it) (measured). The wheel's tyre is a circle about 70 % of the picture width across (fitted to the outer edge; the visible chord at the bottom edge is about 65 %), centred, its top at about 59 % of the picture height, its hub below the frame (measured). Each photo is clipped to a rounded window on its card (one corner clipped at 45 degrees); the swapped photo fills that same window after the swap (measured by eye). Background pale blue-grey. Nothing in the look is made by this tip: the cards, the arc and the wheel come from technique 03 (the orbiting graphics). The wheel has no shadow yet in this result (the background beside the tyre measures the same as open background, 241–246 against 243); the soft halo of technique 05 is added only, so do not add one to match this frame (measured).
timing and easing: none given (no keyframes are touched; any existing keyframes stay on the layer — inferred from how Replace Footage works, not shown)
variations: the author says it works for a photo or a video clip (said)
pitfalls: The new image keeps the old layer's Scale, so if it is larger or smaller in pixels it no longer fits its window and Scale must be corrected (shown; not said). Alt/Option must be held while dropping; a plain drag adds a new layer instead (inferred).
build notes: By script: `layer.replaceSource(newFootageItem, false)` on the AVLayer does what the Alt/Option-drag does; then correct `layer.property("ADBE Transform Group").property("ADBE Scale")` so the new image covers the old window (inferred, neither said nor shown: scale by old-width/new-width when the clipping window was sized for the old image). Effects, masks, track mattes, parenting and keyframes stay on the layer.
unknowns: The original Scale of the photo layer before the swap; whether the other swapped cards needed their Scale corrected; how the photo is clipped to its card window (mask, track matte or alpha matte: the layer shows a matte-type icon but its kind is not readable); the menu equivalent (Layer > Replace Footage is not shown).

## Key a rough, unevenly lit green backdrop with a machine-learning keyer
id: 07-key-imperfect-green-screen
revision: 03ffee48
job: none (build-aid)
status: proven (accepted 2026-11-16)
what it does for a beat: For stock or found footage shot against a coloured wall that was never meant to be keyed (uneven light, olive green, shadows), when a classic colour keyer leaves grey residue. The person comes out clean, hair included, ready to sit over graphics.
what it looks like: A smiling woman with big curly hair making a peace sign against an olive-green studio wall that is bright on the left and falls into shadow on the right. After the key she stands alone on black with soft, natural hair edges and no green rim; her top, yellow-green before, turns peach once spill is removed. In the finished example she then stands in front of the same promo cards and text used in technique 06, on a pale blue gradient.
ingredients:
- a free machine-learning green-screen keyer plugin — free third-party plugin, not stock; installed separately, it appears under its maker's own submenu in the Effect menu (shown); the narrator says it is free and links it in the description
- substitute: no stock keyer is offered in words. On screen the author first applies After Effects' bundled colour keyer (it shows as version 1.2; menu path Effect > Keying inferred: the Keying submenu is visible but the keyer is never picked from it on screen) and removes it after it leaves residue (shown). The finished example's footage layer also carries Object Matte and Advanced Spill Suppressor, both switched off (shown)
steps:
1. Put the green-screen clip in the comp; hide the layers below it so the key shows against black (shown : only the top adjustment layer and the footage have their eyes on; not said)
2. (Shown, not said) The bundled colour keyer, tried first, with its View on Final Result, Screen Gain 100.0, Screen Balance 50.0, Screen Pre-blur 0.0 and a Screen Colour whose swatch reads about RGB 78,111,32 (measured on a crop of the full-size frame, swatch at x 460–486, y 577–589; a panel swatch, so approximate). That is darker and greener than the lit and middle wall (about 130,160,80 and 110,140,56) and about the colour of the darkest wall, in the lower-right corner (about 68–82,100–116,30–37, measured), so the pick sits at the dark end of the wall, not on the lit part: the shadowed right side of the wall keys out, but the lit left side stays as a dark grey veil (about RGB 56,53,46 over black) (shown). Remove it (shown : the footage's Effect Controls are empty)
3. Apply the machine-learning keyer from its submenu in the Effect menu (said: drop it onto the footage; shown : Effect menu open on the plugin's submenu)
   - Mode: Full Frame (shown)
   - Alpha Hint: None, with a second menu reading Source (shown)
   - Quality: 1024 (shown)
   - Auto Crop: on (shown)
   - Output: Cutout (shown)
   - Despill Strength: 0.00 (shown)
4. Wait while the plugin loads its model the first time (shown : a loading dialog over the viewer at 40 %; not said). The key then appears: the person on black, hair edges soft, but a green glow on the outer hair and a green cast on the top (shown)
5. Raise the spill suppression (said)
   - Despill Strength: 1.00 (shown)
   - Effect: the green rim on the hair goes, leaving a faint brownish halo of wispy hair; the top shifts from about RGB 204,180,111 to 214,158,121, yellow-green to peach; skin is unchanged (measured on frames)
6. Turn the graphic layers back on to place the person over them (shown: the eyes come back on; the graphics' order is the comp's own)
layout: Measured on the result frame (cut from source, crop 958,390,1720,968), as shares of that crop. The woman stands a little left of centre: hair from about 30 % to 59 % of the width, top of the hair about 5 % from the top, her raised hand reaching to about 29 % across, body cut by the bottom edge (measured). Background black (empty comp). Edges: hair keeps soft semi-transparent wisps with no green; a faint warm-mauve halo about 1 % of the width wide remains round the outer curls (measured on a crop at full size). The source plate : olive green, about RGB 130,160,80 on the lit left and 70–95,100–130,30–50 on the shadowed right, the right side about 0.65 as bright as the left (measured) — this unevenness is what makes it a poor screen. The finished example that plays is a separate finished comp (shown; a rendered clip layer is switched on at the top of it, so the picture may be a pre-rendered clip rather than the live layers): the same keyed woman over a pale blue-white gradient, with three rounded cards behind her (navy and peach top, white below left), text lower left passing behind her arm, and a bold two-line headline lower right whose first letter overlaps her arm, the title layer sitting above the footage in that comp (measured on frames; shown). Its graphics and gradient come from the comp, not from this tip; placing graphics behind a person is technique 06.
timing and easing: none given for the key. The finished example's text types on over about 2 s; not built here.
variations: none given (the narrator only says spill suppression can be raised)
pitfalls: The plate is not a proper green screen (said). A classic colour keyer leaves the lit part of such a wall as a grey veil (shown, not said). Despill at full strength also pulls green out of the subject's own colours: the yellow top turns peach (measured; not said). The model takes a moment to load the first time (shown).
build notes: The plugin is third-party and must be installed before any script can apply it; its match name is unknown, so apply it by its display name from the Effect menu, or by script with `layer.property("ADBE Effect Parade").addProperty("<display name>")` once installed. Set Despill Strength to 1.0 and leave the rest at the values shown. If it is not installed, the stock route is the bundled colour keyer, followed by Advanced Spill Suppressor; expect to fight the uneven light (on this plate the stock key left a veil), so a garbage mask, a Screen Matte clip or a second key on the lit side would be needed (inferred). Object Matte (technique 06) is the other stock route; it ignores the wall colour altogether. To reproduce step 2's veil (a build's finding, not the tutorial's): proof build 07 got a veil only with a Screen Colour darker than any part of its own wall (77,92,46 on a wall of about 156,171,92 lit and 104,118,64 shadowed); a pick from its lit wall cleared the whole wall to black and a pick from its shadowed wall left only a faint veil (about 14). Check the render for a veil of about 50 on the lit side falling to near black on the shadowed side.
unknowns: How the bundled keyer's Screen Colour was set (eyedropper or typed; not shown). Its swatch, about 78,111,32, matches only the darkest wall at the lower-right corner, so if it was picked from the plate it was picked there (inferred); whether any plugin setting other than Despill Strength was changed from its default; what the second Alpha Hint menu does; whether the finished example's Object Matte and Advanced Spill Suppressor ever took part in its look (both are off there).

## Even time stagger by dragging a whole stack at once
id: 05-stagger-layers-in-time
revision: 9201d48e
job: none (build-aid)
status: proven (accepted 2026-11-14)
what it does for a beat: Makes a stack of copies appear one after another at an even interval, so items of a list, ring or grid arrive in sequence. A quick replacement for Sequence Layers or hand-nudging each bar.
what it looks like: In the timeline the layer bars form a clean diagonal staircase: the bottom layer still starts at 0, and each layer above it starts the same few frames later than the one below, so the top of a 60-layer stack starts about 22 s in. In the example these are the word layers of the text carousel from recipe 04.
ingredients:
- Ctrl+Alt (Windows) / Cmd+Option (macOS) drag of layer bars with several layers selected — built-in; the same shortcut as the rotation offset in recipe 04 (said)
steps:
1. Select every layer to be staggered (shown, all word layers highlighted; inferred that all are selected).
   - Layers in the example: 60 text layers (layers 6–65), each parented to a null (shown)
2. Hold Ctrl+Alt (Cmd+Option) and drag a layer bar sideways in the timeline. The bars spread out in layer order instead of moving together (said; shown →).
   - Which layer stays put: the bottom layer (layer 65) keeps its start at 0; the higher a layer sits, the later it starts (shown)
   - Per Layer offset: 0:00:00:22.34, i.e. about 22.34 frames at 60 fps ≈ 0.37 s (shown in the drag tooltip, crop)
   - Total Offset: 0:00:21:58 (shown, same tooltip)
3. Let go when the per-layer offset shown in the tooltip is what you want (inferred from the live tooltip).
layout: not a picture of the comp; the Timeline panel shows a straight staircase of 45 text-layer bars (layers 21–65 visible, all parented to the same null), the bottom layer starting at 0 s and each layer above starting one even step later: 28.7 px per row against a ruler of 77 px per second, so about 0.373 s (22.4 frames at 60 fps) per layer, and about 16.4 s from the bottom bar to the top visible one; rows are 35.8 px apart, bars about 29 px tall; every bar runs on past the panel's right edge (all measured on a still of the result, and the ruler in)
timing and easing: Even linear stagger of 22.34 frames per layer at 60 fps in the example (shown, tooltip). The per-layer value is fractional, so layers would land between frames (inferred from the tooltip value; no frame shows a layer between frames).
variations: The same shortcut offsets property values instead of time (said; recipe 04).
pitfalls: none given
build notes: By script, for the i-th selected layer counted from the bottom (i = 0 for the bottom layer) set `layer.startTime = base + i * step`, with step = 22.34 / 60 s in the example, or use whole frames (`Math.round(...) / comp.frameRate`) to keep layers on frame boundaries. Whether the gesture moves the whole bar (Start Time) or only trims the In point is not visible; the bars' right ends are off screen, so moving the whole layer (startTime) is inferred. The Ctrl/Cmd+Alt drag itself is interface-only.
unknowns: the exact layer grabbed for the drag; whether a whole-frame offset is possible from the gesture; the stagger is never played back in the viewer in this chapter, so the visual result of the staggered carousel is not shown.

## Keep an orbiting 3D layer turned towards the camera
id: 07-face-the-camera
revision: 59029d99
job: none (build-aid)
status: proven (accepted 2026-11-14)
what it does for a beat: When a flat 3D layer circles around something (a moon round a planet, an icon on an orbit), it turns edge-on and thins out at parts of the loop; this keeps it reading as a full, flat shape the whole way round.
what it looks like: White line art on black: a large outlined circle with a tilted elliptical ring around it, and a small black-filled, white-outlined circle travelling round the ring. Before the fix the small circle squashes into a thin sliver as it orbits; after it, it stays a perfect circle facing the viewer.
ingredients:
- Auto-Orient (Orient Towards Camera) — built-in; Layer > Transform > Auto-Orient
- A camera layer and a 3D layer orbiting via parented nulls — built-in (carried over from the previous orbit set-up, not built in this section)
steps:
1. Start from a 3D layer that orbits a centre in a scene viewed through a camera; here the small circle is parented to a rotating null, which is parented in turn to a parent null at the centre (shown)
   - Starting state: the small circle is seen nearly edge-on as a thin ellipse at the lower left of the ring (shown)
2. Select the orbiting layer (said; shown, the layer highlighted with its 3D gizmo in the viewer)
3. Open Layer > Transform > Auto-Orient (said; cursor on the Layer menu title shown, the menu itself not visible open)
   - The dialog that opens offers Off (still selected), Orient Along Path, and Orient Towards Camera, plus a greyed text-only option for orienting each character (shown)
4. Choose Orient Towards Camera (said; selected, shown) and confirm with OK (shown, cursor on OK)
   - Auto-Orientation: Orient Towards Camera (said, shown)
5. Play the comp: the small circle now stays round and flat to the viewer as it goes round the ring (shown, at the same comp time 0:00:00:10 as the edge-on view behind the dialog)
layout: all figures measured as shares of the result crop, which is only part of the comp (the viewer is at 50% zoom, the black background fills it and no comp edge is inside the viewer here, so the comp's size and the crop's share of it cannot be read); large centre circle: diameter about 24% of the width and 45% of the height, centre about 50% across, 45% down (measured); tilted orbit ring: spans about 30–70% across and 27–70% down, about 1.7 times the circle's diameter wide, long axis tilted slightly down to the right (measured); small orbiting circle: diameter about 8% of the width (about a third of the large circle), centre about 53% across, 69% down, on the ring's near edge below the large circle (measured)
timing and easing: none given (the orbit animation already existed; nothing is keyframed here)
variations: none given
pitfalls: none given
build notes: Scripting: set the orbiting layer's `threeDLayer = true` and `layer.autoOrient = AutoOrientType.CAMERA_OR_POINT_OF_INTEREST`. The comp needs an active camera layer (the viewer reads Active Camera, shown) or the option has nothing to face. Orbit rig as seen in the timeline (inferred): a rotating null parented to a centre null; the orbiting shape parented to the rotating null; the ring path parented to the centre null. Glow and noise adjustment layers sit on top (shown) and are not part of this trick. Where the facing layer's plane crosses the ring's plane the ring's line can cut into its fill; in a proof build, moving the layer toward the camera by a little more than its own radius (Anchor Point Z 70 for a 125 px circle) cleared it all the way round (inferred: found in a proof build, not said or shown).
unknowns: how the orbit itself is animated (rotation axis, speed) is not shown in this section; the small circle's size, stroke width (toolbar shows 5 px for the selected shape, not confirmed as this layer's stroke) and fill; camera settings; the glow and noise settings.

## Perform puppet-pin motion live with the mouse
id: 08-record-puppet-pin-motion
revision: 1ecba9c9
job: none (build-aid)
status: unproven
what it does for a beat: For organic secondary motion on an illustrated character (a head sway, a nod, a drifting limb) where hand-placing keyframes would look stiff or take too long; you act the motion out once and After Effects writes the keyframes.
what it looks like: An illustrated girl with headphones sits by a train window with a landscape outside. A puppet pin on the top of her head is dragged during recording, so her head tilts and sways gently while pins at her shoulders hold the body still.
ingredients:
- Puppet Position Pin tool and the Puppet effect — built-in; Puppet tool in the toolbar (shown)
- Live recording by holding Ctrl (Windows) or Cmd (Mac) while dragging a pin — built-in (said)
steps:
1. Take a cut-out character layer and place puppet pins with the Puppet Position Pin tool (shown)
   - Pins: three — one on top of the head and two low on the body near the shoulders/chest (shown; the timeline lists Puppet Pin 1–3)
   - Puppet Engine: Advanced (shown)
   - Mesh Rotation Refine: 20 (shown)
   - On Transparent: off (shown)
   - Toolbar Expansion: 3, Density: 10 (shown)
2. Put the time indicator where the motion should start; here 0:00:00:00 (shown)
3. With the Puppet tool active (shown, tool highlighted), select the pin to animate (said); here the head pin (shown)
4. Hold Ctrl/Cmd on the selected pin to live-record its movement (said), by hand, dragging it in the viewer while the mouse is held; the cursor changes to a circle and the head moves with the playhead parked at 0:00 (shown)
5. Release to stop (inferred); the pin's Position now carries about a dozen irregularly spaced keyframes, while the other pins keep only their single starting keyframe (shown)
   - Puppet Pin 1 (head) Position at 0:00:00:18: 1035.3, 416.8, with keyframes spread from 0:00 to past 3:12 (shown)
   - Puppet Pin 2 Position: 431.3, 1297.1 — one keyframe at the start (shown)
   - Puppet Pin 3 Position: 910.0, 1348.5 — one keyframe at the start (shown)
6. Play back to see the recorded head movement (shown)
layout: character's head with bun: from about 10% to 72% down (about 62% of the height), face centre about 44% across (measured, shares of the whole comp: viewer at 43.2%, picture edges just inside the viewer and matching the crop); shoulders: about 14–53% across where the bottom edge cuts them (measured, shares of the whole comp: viewer at 43.2%, picture edges just inside the viewer and matching the crop); headphone ear cup centre: about 30% across, 50% down (measured, shares of the whole comp: viewer at 43.2%, picture edges just inside the viewer and matching the crop); window opening behind her: about 4–91% across, down to about 90%, with a window post filling about 91–100% across (measured, shares of the whole comp: viewer at 43.2%, picture edges just inside the viewer and matching the crop)
timing and easing: Keyframes are generated by the recording; the head pin has about a dozen keys from 0:00 to beyond 3:12, several frames apart at irregular spacing (shown). No easing was set by hand (inferred).
variations: none given
pitfalls: none given
build notes: This technique is done by hand: placing the pins and recording the drag both need a person at the interface, and neither can be scripted, so a scripted build can only imitate the result and proves nothing about the technique. Live recording is hand-only in the interface (Record Options in the Puppet toolbar sets speed and smoothing; not opened in the video). Puppet pins cannot be created by script, but if a Puppet effect ("Puppet", match name ADBE FreePin3) with pins already exists, a script can write keyframes to each pin's Position (Puppet > Mesh 1 > Deform > Puppet Pin N > Position), e.g. a sampled smooth path or a slow wiggle on the head pin, to imitate a recorded performance. The comp runs at 23.976 fps (shown).
unknowns: the exact path the pin was dragged along; Record Options settings (speed, smoothing); the head pin's starting position; whether the default Expansion/Density were changed (values shown look like defaults); how long the drag lasted in real time.

## Un-clip an effect with Grow Bounds
id: 15-grow-bounds-fix
revision: 8e648131
job: none (build-aid)
status: proven (accepted 2026-11-14)
what it does for a beat: Fixes effects that are cut off with a hard edge because the layer's bounding box is too small, for example a blurred or stretched shadow running past the edge of its source artwork.
what it looks like: In a cartoon landscape of rolling green hills, trees and a sunset sky, each tree has a long soft shadow made from a dark-filled, radially blurred copy; before the fix the shadow stops at a straight edge, after it streaks smoothly across the hills.
ingredients:
- Grow Bounds — stock; Effect > Utility > Grow Bounds (effect name said and shown; menu path not shown, inferred)
- Fill — stock (shown in the same stack)
- CC Radial Fast Blur — stock (shown)
- Gaussian Blur — stock (shown)
steps:
1. Start from a layer whose effects are being clipped at its edges; here a shadow copy of a tree with Fill (dark colour), CC Radial Fast Blur and Gaussian Blur (shown)
   - Fill Opacity: 100.0%, Horizontal/Vertical Feather 0.0 (shown)
   - CC Radial Fast Blur Center: 97.8,512.3; Amount: 95.0; Zoom: Standard (shown)
   - Gaussian Blur Blurriness: 71.2; Blur Dimensions: Horizontal and Vertical; Repeat Edge Pixels: on (shown)
2. Add Grow Bounds and drag it to the top of the effect stack, above every effect it must make room for (said; shown first in stack)
3. Raise Pixels until the effect is no longer cut off (inferred from the value change; said only "solve the issue")
   - Pixels: 2050 (shown)
layout: crop is the whole comp at 43.5 % (comp edges at the crop edges, measured); hill crest under the trees: about 64 % down; figure: centred at 50 % across, 57-64 % down; trees beside it at about 40 % and 60 % across, tops about 55 % down; repaired shadows: thin darker streaks running straight down from each base, from about 65 % to about 72-73 % down, roughly as long as the figure or tree is tall, about a third darker than the hill beside them (measured, shares of the whole comp)
timing and easing: none given
variations: none given
pitfalls: Grow Bounds must be at the top of the stack (said). It only helps effects limited by the layer's bounding box (said).
build notes: Script: var gb = layer.property("ADBE Effect Parade").addProperty("ADBE Grow Bounds"); gb.moveTo(1); gb.property("Pixels").setValue(2050). Very large values cost render time; use the smallest value that removes the clip (inferred, general advice). In the tutorial the layers are 3D under a camera (shown); a 2D case is not shown; in a 2D proof build the clip and the fix both showed, and CC Radial Fast Blur's Center was read in the precomp layer's own pixel space (inferred: found in a proof build, not said or shown).
unknowns: how the shadow copy is made and positioned (outside this tip); the Pixels value before scrubbing is partly covered by the cursor; it reads about 10, the effect default (shown, partly). Fill colour is a dark near-black grey (shown), exact value unreadable.

## Tuck helper layers out of the timeline with the shy switch
id: 22-hide-layers-shy
revision: ff77e41e
job: none (build-aid)
status: proven (accepted 2026-11-14)
what it does for a beat: When a comp has dozens of support layers (mattes, lines, labels) and you only want to touch a few, mark the rest shy and hide them from the layer stack without precomposing. The comp structure and the render stay unchanged.
what it looks like: In the example, a long stack of about ninety layers (photo cards arranged around a wheel, each with its own matte, outline, decoration and text layers) shrinks to a short list: the card images, their box layers, a null, an effects layer, the wheel and the background. Pressing the master toggle leaves the composition picture as it was.
ingredients:
- Shy layer switch (per layer, in the A/V switches column) — built-in
- Hide All Shy Layers toggle (comp button above the layer stack in the Timeline panel) — built-in
steps:
1. In the Timeline, click the shy switch on each layer you want out of the way; its icon changes to the "peeking figure" shape (said; shown)
   - Layers marked here: the decoration, outline and text layers and the mattes; the card image, box, null, effects, wheel and background layers stay unmarked (shown)
2. Click the Hide All Shy Layers button in the Timeline panel's top bar to collapse the marked layers out of view (said; shown, tooltip "Hides all layers for which the 'Shy' switch is set")
3. Work on the remaining layers (said); the shy layers still render, since the viewer shows the same picture before and after the toggle (shown →)
layout: not a picture of the comp; the Timeline panel after hiding shows 28 of 88 layers (measured): FX (1), Null 1 (2), twelve image layers each followed by its box shape layer (7/9, 14/16, 21/23 … 84/86, a pair every 7 layer numbers, so 5 shy layers per card; the image is parented to its box and each box to Null 1), then the wheel (87) and background (88); 60 layers hidden; rows about 36 px apart at this recording's interface scale
timing and easing: none given
variations: none given
pitfalls: none given (the author only contrasts it with precomposing, which is not needed)
build notes: Set `layer.shy = true` on each layer to hide, then `comp.hideShyLayers = true`. Both are scriptable; nothing has to be done by hand. Shy affects only the Timeline display, never the render, so compare a build by its Timeline layer list, not by a render.
unknowns: Which layers were marked shy before the recording began: shows most switches already set, while shows switches unset, so the author cleared and set them again on camera. The interface layout keeps shifting, so the crop only fits from there.

## Dial motion blur strength with the comp's shutter angle
id: 23-shutter-angle-blur
revision: 955188f5
job: none (build-aid)
status: proven (accepted 2026-11-14)
what it does for a beat: When motion blur is on but reads too subtle (or too smeary), change the composition's shutter angle to set how long each frame's blur streak is, without touching the animation.
what it looks like: A ring made of one white bold word repeated four times with a round dot between repeats, spinning in 3D on a dark grainy background, with a darker copy under each word; at the default angle the letters show a light trail, and after raising the angle their upright strokes smear sideways by about 1.25% of the comp's width, soft-edged but still readable.
ingredients:
- Layer Motion Blur switch and the comp Enable Motion Blur toggle — built-in
- Composition > Composition Settings (Ctrl+K) > Advanced tab > Motion Blur group — built-in
steps:
1. Have motion blur switched on for the moving layers and for the comp (inferred; layer motion blur switches appear filled on the two text layers and the comp toggle lit)
2. Open Composition > Composition Settings (said; shown, menu item "Composition Settings... Ctrl+K")
3. Go to the Advanced tab (said; shown)
4. Change Shutter Angle (said "mess with the shutter angle"; shown →)
   - Shutter Angle: 180° default → 720° (shown)
   - Shutter Phase: -90° left unchanged (shown)
   - Samples Per Frame: 16 (shown)
   - Adaptive Sample Limit: 128 (shown)
5. Leave Preview ticked (shown), confirm the dialog and play the comp to compare (inferred; the dialog is gone and the blurred spin plays)
   - The example has two text layers holding the same word, both parented to a null (shown in the Timeline); the second shows as a darker copy one cap height below each word (measured)
   - Comp: 1920 x 1080, 23.976 fps (shown on the Basic tab, crop; 23.976 fps also in the timecode)
layout: spinning ring of words (four repeats of one word with a round dot between each: the front one reading normally, the back one mirrored, two seen edge-on at the sides): spans about 24% to 75% across (about 51% of the comp's width) and about 33% to 72% down, centred at about 50% across (measured, shares of the whole comp: the viewer is at 41.4% zoom and the result crop takes in the whole comp); the front word is about 31% of the comp's width wide with capitals about 10% of its height tall, the back word about 7% tall (measured, same frame, shares of the whole comp); a darker copy of each word sits directly under it, offset down by about one cap height (measured, same frame); at 720 degrees the vertical strokes of the front word are smeared sideways by about 1.25% of the comp's width (10 to 90 % of each edge), and the word stays readable (measured, same frame, shares of the whole comp)
timing and easing: none given (the spinning ring's animation is pre-built in the example)
variations: Any angle can be used to dial the blur amount up or down (said)
pitfalls: none given
build notes: `comp.motionBlur = true`; `layer.motionBlur = true` on the moving layers; `comp.shutterAngle = 720` (range 0–720); `comp.shutterPhase = -90`; `comp.motionBlurSamplesPerFrame = 16`; `comp.motionBlurAdaptiveSampleLimit = 128`. All scriptable.
unknowns: The motion behind the effect (how the ring of words is animated, its speed); whether any other comp settings were touched; the exact moment the dialog was confirmed. Whether the second, darker text layer is flipped like a reflection cannot be told at this blur. Whether the viewer updated live with Preview on is not shown (the viewer is the same).

## Keep a scaled-up precomp of vector art crisp
id: 24-sharp-scaled-precomp
revision: 42775cad
job: none (build-aid)
status: proven (accepted 2026-11-14)
what it does for a beat: When a precomp built from shape and text layers is pushed far past 100% (a big push-in or a hero zoom), turn on the layer's collapse/rasterize switch so the vector contents are redrawn at the new size instead of being enlarged as pixels.
what it looks like: An old-style error-dialog graphic (black title bar, grey panel, X icon, a two-line message and a small button) is scaled until a few letters of the message fill the frame; without the switch the edges are soft and blocky, with it the letters stay razor sharp.
ingredients:
- Collapse Transformations / Continuously Rasterize switch (the sunburst switch in the Switches column) — built-in
steps:
1. Put the vector-built graphic (shape and text layers) in a precomp and place it in the main comp (shown, the precomp's contents)
2. Scale the precomp layer up a long way; it turns blurry and pixelated (said; shown)
   - Scale: 100% → 670% → 2050% (shown)
3. Click the sunburst switch on the precomp layer, the one the narrator calls continuously rasterize (said; shown, switch filled)
4. The enlarged graphic re-renders sharp; scaling back down (160% around, then 400%) also stays clean (shown)
layout: at 2050% scale the word FIX, here the word in the second line of the dialog's two-line message and not the button's label, has capitals about 45% of the comp's height tall and spans about 10.5% to 55% across, its stems about 3.3% of the comp's width thick (measured, shares of the whole comp: the viewer is at 41.4% zoom and the result crop takes in the whole comp); the gap between FIX and the next word is about 11.6% of the comp's width; the line above sits with its baseline about 61% of the comp's height higher (measured, same frame, shares of the whole comp); the layer's anchor point marker is at the comp centre, 50% across, 50% down, just right of the X (measured, same frame); background a flat light grey
timing and easing: none given
variations: none given
pitfalls: Scaling a precomp far up makes it pixelated if the switch is off (said)
build notes: `precompLayer.collapseTransformation = true` (the same switch is labelled Collapse Transformations on precomp layers and Continuously Rasterize on vector/Illustrator layers). Scale via `layer.transform.scale.setValue([2050,2050])`. Works only when the precomp's contents are vector (shape/text); raster footage inside will still soften.
unknowns: Precomp and comp sizes; whether the scale was keyframed (no stopwatch shown, values changed by scrubbing).

## Found vector art, one object per file, laid out as separate layers
id: 01-vector-art-split-into-layers
revision: 7b170ad6
job: none (build-aid)
status: unproven
what it does for a beat: The groundwork for a lit, deep 2D scene when you cannot draw: gather ready-made vector illustrations, keep only the pieces you need, and bring every object into After Effects as its own layer so each one can later be graded and placed in depth on its own. Assumes: nothing; it starts from an empty project.
what it looks like: A dusk scene assembled from stock pieces: a cloudy sky, a far city skyline, a rocky ledge with two small figures seen from behind, a stone wall, a street lamp, bare trees, bright grass along the bottom and two leafy branches framing the left and right edges. At this stage nothing is graded, so the pieces still clash (very saturated green grass and leaves against a cool sky).
ingredients:
- A web browser and a free stock-vector site, searched with a "Vectors" type filter — external; shown (web search), (vector site search "Characters" with the Vectors filter)
- Adobe Illustrator — paid (separate Adobe app); used to open the stock files, delete unwanted objects and save one object per file
- After Effects footage import (.ai, .png, .jpg) — built-in
- Layer Transform: Position, Scale, Rotation — built-in
steps:
1. (Browser) Search the web for free vector art and open a stock-vector site; filter results to vectors and search for what the scene needs, e.g. characters (said; shown)
2. (Illustrator) Open a downloaded stock file. The example is a character sheet holding many poses and heads on one artboard (said; shown)
3. (Illustrator) Delete every object you do not need, leaving one object (here one figure seen from behind) alone on the artboard (said; shown part-way through deleting, single figure left)
   - The object is a Group; the Layers panel still holds a single "Layer 1" — the separation is done by keeping one object per file, not by Illustrator layers (shown)
4. (Illustrator) Move the remaining object to the middle of the square artboard and scale it up until it nearly fills the artboard's height; done on screen without comment (shown small at the artboard's left edge, about 65% of its height; centred; enlarged, about 90% of the height; saved like that)
   - The tool used (a selection drag of the bounding box) is inferred; no numeric values are shown
5. (Illustrator) Save that file on its own: File > Save As, file type Adobe Illustrator (*.AI) (shown File menu open, Save As dialog with the type list open and Adobe Illustrator (*.AI) highlighted)
   - The narrator says a PNG works as well (said); the Save As type list has no PNG entry, so that route would be File > Export (inferred, not shown)
   - The file name in the dialog is the stock file's own name; whether the original was overwritten or saved elsewhere is not shown
   - Repeat for every object you want as a separate piece (inferred; the save folder already holds several such .ai files)
6. (After Effects) Import all the pieces; the project holds one footage item per object, a mix of .ai (characters, branches, grass, trees), .png (wall, ledge, city) and a .jpg sky (shown)
   - One illustration appears imported as a composition with its layers, since a "… Layers" folder sits in the Project panel (shown; how it was imported is inferred)
   - Example sizes in the Project panel: a character .ai at 1080 x 1080, the sky .jpg at 2912 x 1460 (shown)
7. (After Effects) Put each object on its own layer in one composition and arrange it by hand with Scale, Position and Rotation, adding pieces one at a time (said; shown)
   - Order the frames show, not back to front: first one figure alone on black, its Scale being dragged; then the ledge under it; then the second figure and the sky (where the city is being scaled in); a shape layer and the city; the grass and one bare tree; the stone wall; then the two foreground branches, all 11 in place. The pine and the second bare tree come later (step 7's last item)
   - Composition frame rate: 23.976 fps (shown)
   - One foreground branch: Rotation 0x+47.0° (shown)
   - The other foreground branch: Scale 60.0% (shown)
   - The stone wall: Scale 94.0% (shown)
   - Layer order, top to bottom, in the 13-layer stack: two foreground branches, grass, the two figures, wall, ledge, a tall pine, two bare trees, the city, a shape layer, the sky (shown). In the earlier 11-layer stack a bare tree sits between the grass and the figures, so it was moved down and the pine and second bare tree added later (shown by the two frames; when is not shown)
8. Keep every object as a separate layer; the narrator stresses this is what later lets you control light and depth per object (said)
layout: measured on the result frame against the picture inside the crop (the whole comp view), as shares of its width (x) and height (y): the two figures stand together with their centre at about 43% x, about 31% of the picture height tall, feet about 75% down (measured); the ledge spans about 19%–60% x with its top about 72% down (measured); the bright grass band fills roughly the bottom 18% (measured); the left leafy branch covers the left ~27% from ~27% down to the bottom, the right one the right ~25% from ~22% down (measured); the lamp sits at about 67% x, 70%–79% down (measured); the stone wall is cut by the right edge, about 40%–80% down (measured); the city skyline runs across at about 50%–72% down behind the ledge (measured). The upper half of the picture: a tall pine stands with its centre at about 29% x, crown about 26%–36% x at its widest, top about 20% down, its foot hidden behind the ledge at about 70% down, so about half the picture tall (measured); two bare-tree layers, both copies of one bare-tree file : one spans about 6%–28% x from the top edge down behind the left branch, trunk at about 15%–18% x (measured), the other about 63%–80% x, from about 25% down to the ground at about 80% (measured); a large near-black bare tree fills the upper right, about 60%–100% x, from the top edge down to the top of the wall at about 40% (measured). That near-black tree, the lamp and a small bare tree behind the wall are part of the stone-wall image, not pieces of their own: none of them is in the picture before the wall layer is added and all three arrive with it (shown without the wall, with it). Tones, measured on the result crop: the pine (about RGB 40,46,48), both bare-tree layers (darkest parts about 26–40, 35–40, 41–48) and the city (about 31–35, 45–49, 60–62) are low-contrast, close to the sky (open cloud about 39,63,90), while the wall's tree goes near-black (down to about 2,6,19). Nothing is graded yet at this point (grading starts) and no opacity change is shown, so this falloff comes from the art itself: the pine file's own Project-panel thumbnail is a mid-grey tree (shown). The grass and leafy branches are the only saturated pieces (bright yellow-green)
timing and easing: none given
variations: Save each isolated object as PNG instead of an Illustrator file (said). Any layout you like (said).
pitfalls: none given
build notes: A build aid prepared mostly outside After Effects (in a browser and a vector program; the After Effects part is only importing and placing the pieces): there is nothing of its own to prove in After Effects, so it stays unproven by design and no proof brief should expect a build of it (owner's decision, 2026-11-16). The browser and Illustrator stages are by hand. In After Effects, script the rest: app.project.importFile(new ImportOptions(File(...))) for each piece (for a layered .ai use importAs = ImportAsType.COMP to get its layers), comp.layers.add(item) per piece, then set layer.property("ADBE Transform Group").property("ADBE Scale"/"ADBE Position"/"ADBE Rotate Z"). Set "Continuously Rasterize" (layer.collapseTransformation = true) on .ai layers if they are scaled above 100% later. Placement is an artistic layout; only the few values above are given.
unknowns: The exact stock files and how many objects were saved; whether PNGs were used for any piece made in Illustrator (the wall, ledge, city and sky arrive as .png/.jpg, source not shown); composition size and duration (1920 x 1080 inferred from a 960,540 centre seen later); Position values for most layers and Scale for most pieces (a character layer is being dragged down to about 45% but its landed value is not shown; several Scale values flash by while dragging: 46, 69, 76, 32, 37%); the content of the shape layer near the bottom of the stack; the Import dialog settings; Opacity of the pine and bare-tree layers (never shown; their pale tone matches the pine's own thumbnail, so 100% is the likely value).

## Long-lens close-up that matches the wide shot
id: 11-matching-closeup-telephoto-compression
revision: f83795fe
job: none (unmatched)
status: proven (accepted 2026-11-19)
what it does for a beat: Assumes a finished wide scene already exists with separate 2D layers, a cold grade on each (Tritone + Curves, technique 02), a 3D camera with depth of field (04), sway on trees (05), rain and finishing adjustment layers (08, 10). Cut from an established wide scene to a close-up of the character without building a new world: reuse the wide shot's backdrop pieces, camera and finishing layers, and push the backdrop very deep so the close-up reads as shot on a long lens.
what it looks like: A head-and-shoulders anime-style girl fills the frame, sharp, graded almost colourless and very dark (a neutral, faintly warm grey; her brightest whites sit at about 30 % grey); behind her a dark blue-grey pine silhouette, a faint distant city skyline and a stormy blue sky sit far back, soft and large, under falling rain. The sky and city carry no effects: their blue is the photo's own, so the only cold colour in the frame is the backdrop, not the girl.
ingredients:
- new composition for the close-up — built-in
- recycled layers from the wide scene (sky, distant city, one tree) — built-in, copied across
- 3D layer switch on every layer that should sit in depth — built-in
- camera with Depth of Field on — built-in; Layer > New > Camera (inferred, the camera arrives already made)
- Tritone + Curves grade on the new character layer, later replaced by the finished example's pasted stack (Tritone, Curves, Cartoon switched off, Tint) — stock; Edit > Copy / Paste of effects (inferred, not shown)
- grain adjustment layer with Add Grain (eye off here) — stock
steps:
1. Make a separate composition for the close-up and bring in only the backdrop pieces worth reusing: the sky, the far city, a tree (said; the new comp holds a cloud sky, a city image and the character image; a long tree is added, crop)
2. Add the close-up character image above them (shown : a front-facing anime girl, head and shoulders)
3. Rearrange the reused pieces so the new framing makes sense, rather than copying their wide-shot positions (said)
   - City layer Scale: 679.0% (shown)
   - City layer Position: 1620.0, -1015.0, 4730.0 (shown)
   - Tree layer Scale: 334.6% (shown, crop)
   - Tree layer Position, first placing: 129.9, 2613.3, 1500.0 (shown), then -126.1, 2154.3, 1500.0 (shown)
4. Bring the wide scene's camera, rain layer and grain adjustment layer into the close-up comp (shown: the comp has no camera and the viewer reads "Active Camera (Default)"; it holds a camera, a rain layer and a grain adjustment layer. How they were brought over is not shown; copy and paste from the wide comp is inferred)
   - The grain adjustment layer carries Add Grain: Viewing Mode Final Output, Preset Kodak Vision 32... (name cut off on screen), Intensity, Size, Softness, Aspect Ratio 1.000, Monochromatic on, Tint Amount 100.0% (shown, crop)
   - Its eye is off in this comp, so it does not change the result (shown)
5. Keep depth of field on the camera (said); camera options as shown :
   - Zoom: 2666.7 pixels (39.6° H) (shown)
   - Depth of Field: On (shown)
   - Focus Distance: 2343.7 pixels (shown)
   - Aperture: 25.3 pixels — scrubbed and lands at 25.3 (shown; the value is hidden under the cursor)
   - Focus Area Width: 0.0; Near, Far Blur Level: 100.0, 100.0% (shown)
6. Turn on the 3D switch for the character layer (shown, unsaid: the 3D box is empty and filled; crop). Its Z position is not shown.
7. For the close-up, push the backdrop pieces much further back in Z and then scale them up to fill the frame again (said). The tree goes from Z 1500 to Z 4170 (shown : Position -946.1, 2154.3, 4170.0). The text reader later drops the minus sign (reads 946.1); the tree stays on the left of frame, so -946.1 holds (inferred). Whether the tree was re-scaled after the push is not shown.
8. First grade on the character: Tritone + Curves (shown : Tritone Highlights mid grey, Midtones dark slate, Shadows black; Curves with the RGB line pulled down in the lower half). Blend With Original is scrubbed (the cursor is still on the value at 35.0%) and lands at 21.0% (shown, crop)
9. Replace that first grade by pasting the finished example's whole character effect stack onto the new character (shown, unsaid: between the stack changes in one step, crops; the finished example's character carries the same stack; copy and paste is inferred). After the paste:
   - Tritone Highlights: white; Midtones: slate blue; Shadows: black; Blend With Original: 32.0% (shown)
   - Curves RGB: a deep sag — black point at 0,0, one point at about input 56% / output 9%, white point at input 100% / output about 36% (shown, crop; positions are our reading of the graph). The white point sits between the 25% and 50% grid lines on the crop, so about 36% (a checker's reading of about 75% does not match this crop)
   - Tint Map Black To: black; Map White To: white; Amount to Tint: 72.0% (shown)
   - What the pasted stack does, in terms for any scene (measured, the ungraded character against the result crop): light skin (252, 204, 159) renders (67, 65, 61), about 31 % of its brightness, its red-to-blue gap shrinking from 93 levels to 6, so colour is nearly gone and only a faint warm cast is left; the brightest white of the collar renders about (76, 74, 71), roughly 30 % grey; mid orange hair (222, 158, 90) renders a neutral dark grey of 25–38; dark hair and line work go to black. No blue tint lands on her
   - Cartoon is present but its eye switch is off, so it does nothing (shown, crop); its values: Render Fill & Edges, Detail Radius 9.2, Detail Threshold 0.0, Shading Steps 16.9, Shading Smoothness 59.6, Edge Threshold 4.51, Width 1.1, Softness 0.0, Opacity 100% (shown)
layout: on the result crop, the face (brow to chin) spans about 37–63% of the width, centred at 50%, eyes at about 33% of the height, chin at about 70% (measured); hair spans about 18–82% of the width and runs off the bottom (measured); the pine silhouette fills about 0–22% of the width on the left and runs off the top (measured); the city skyline is a faint band at the right edge, about 85–100% of the width, 55–75% of the height (measured). The crop trims the top of the picture to avoid the viewer label. Other traits of the result picture (measured on a still of the result):
  - colour: the girl is neutral grey with a faint warm cast (cheek (67, 65, 61), collar (76, 74, 71), see step 9). The sky is a mid stormy blue, (47, 71, 96) to (64, 93, 118) in its lit clouds, and fills the whole frame behind her with no edge in view; it and the city carry no effects in this comp (their fx switches are empty, shown), so their blue is the photos' own. The pine carries effects (fx switch shown), presumably the grade it brought from the wide scene (technique 02, inferred); it renders near black in its core, about (3, 5, 8) and (0, 0, 0) in places, to a dark blue-grey of about (24, 36, 52) at a soft edge (measured; about (12, 19, 28) is only the average over the whole silhouette).
  - depth of field: the pine's trunk edge spreads over about 10 px of the 1336-px crop (about 0.75 % of the width) while the outlines on her face stay within about 3 px (measured).
  - rain: faint white streaks over the whole frame, leaning about 10–12° from vertical with the top to the left and the lower end to the right (measured two ways in the open sky right of her hair: row-shift correlation, about 3 px right per 16 px down, and the streaks traced on a high-pass zoom), each about 5–12 % of the picture height long, the brightest about 10–25 grey levels above the sky behind them (measured). It is the wide scene's rain layer brought into this comp (step 4); how to make it is technique 08.
  - grain: the grain layer's eye is off here, so the result has no added grain (shown).
timing and easing: none given for this technique. The tree carries a Z Rotation keyframe (0x+0.9°) from the earlier sway animation (shown).
variations: the narrator says the reused pieces depend on your scene (sky, background city, trees in this case); any layers can be recycled to save time.
pitfalls: do not forget the camera and its depth of field in the new shot (said).
build notes: Script: comp.layers.add for each reused footage item; layer.threeDLayer = true for backdrop and character; set Transform > Position [x,y,z] and Scale; add camera via comp.layers.addCamera, then Camera Options > Depth of Field = 1, Focus Distance, Aperture, Zoom. A layer pushed back in Z by a factor k must be scaled about k times larger (relative to camera distance) to keep its framing; the video gives the end values, not the formula. Effects: "ADBE Tritone", "ADBE CurvesCustom" (curve points cannot be set by property value from script without preset/.ffx), "ADBE Tint" (Amount to Tint 72). Copying layers between comps is by hand or by script (copyToComp). The demonstrated comp is a simplified rebuild; the finished close-up shown has many more layers (branches, a dead tree, a second character layer, a camera parented to a null, several adjustment layers). The result window falls just after the technique's spoken stretch, while the same arrangement is still on screen before the hair work starts.
unknowns: the character layer's Z position and scale; the sky layer's position and scale (it fills the frame in the result, measured); whether the tree was scaled again after its Z push; how the camera, rain and grain layers were brought into the new comp; camera position and point of interest; comp size; exact hex values of the Tritone colours; how the effect stack was copied.

## Null hierarchy: three group nulls under one master null
id: 02-null-hierarchy-for-grouped-motion
revision: 1102a00e
job: none (build-aid)
status: proven (accepted 2026-11-26)
what it does for a beat: Reach for it before animating a card made of many layers (shapes, text, logo). Each part-group gets its own null, and one master null sits above them, so the whole card or any single group moves with one layer.
what it looks like: Nothing visible changes. A wide, pale, rounded notification card on a near-white ground shows a round mint logo on the left, a bold name with a grey message line under it, and a small grey "NOW" at the top right. Only the layer stack (parent column) records the technique.

ingredients:
- Null Object layer — built-in; Layer > New > Null Object (inferred; the menu is not shown, only the new null "Null 1" appears)
- Parent & Link column (pick whip or drop-down) — built-in; shown in the timeline,
- Text layers, imported logo image — built-in (the example's content, any will do)

steps:
1. Start from a finished card made of three shape layers (a depth/shadow copy, the main card, an outline copy), in a 16:9 comp with a pale ground. (shown)
2. Add a null and rename it as the shapes' controller. It lands on top of the stack. (said; shown with the name field open, renamed "Null Notification")
3. Select the three shape layers and parent them to that null (said). The parent column of all three reads the null (shown : "5. Null Notific" on Stroke, Notification, Depth).
   - Parent: the shape-controller null (shown)
4. Import the logo image and place it at the left end of the card; add the text layers and arrange them. (said that the logo is placed and the text arranged; shown for the layers; the side is shown only: the narration says "right side", but every frame on has the logo at the LEFT, so the screen wins)
   - Logo: left end of the card, round mint badge (shown; the narration's "right" disagrees)
   - Text: name above, message below, both left-aligned beside the logo, "NOW" at upper right (shown)
   - The imported image layer still reads "[Artboa… ]" and reads "Logo": the author renamed it in between, with no word about it (shown). Later steps use the name "Logo".
5. Add a second null, rename it "Text Null", and parent all three text layers to it. (said; shown for the name being typed and the three text layers reading "1. Null 2"; shows the finished name "Text Null" with text layers "1. Text Null")
   - Text layer colours were changed to mark them in the timeline (said; layer label colour shifts from red to blue). Cosmetic only.
6. Add a third null, rename it "Logo Null", and parent the logo layer to it (said; shown renaming "Logo Nu…", logo parent "5. Logo Null").
7. Add a fourth null and parent the three nulls (shape controller, Text Null, Logo Null) to it; the narration calls it "main", but it still reads "[Null 4]", so the name is said, not shown. (said; shown)
   - Chains (shown): Text Null → 1. Null 4; Logo Null → 1. Null 4; the shape-controller null → 1. Null 4. Then the three text layers → 2. Text Null; Logo → 6. Logo Null; Stroke, Notification, Depth → 8. Null Notific[ation]. Null 4 → None.
   - At the three nulls still read parent None and Null 4 exists; they are parented, so the parenting happens between (shown).
8. Copy the bounce expression from the description, and add a Position keyframe on the shape-controller null (said). The key is at time 0 with value 0,0 (shown : Position 0.0, 0.0 with the stopwatch on, tooltip 0:00:00:00 • 0.0, 0.0). Because this null is now a child of Null 4, 0,0 is a position relative to its parent, not to the comp. Its box (dashed square, anchor at its top-left corner) sits with that corner on the comp centre, which fits a parent whose own position is the comp centre (inferred: the parent's value is not on screen). Pasting the expression belongs to technique 03 (see extras.md: pasted).

Final stack (top to bottom): main null, Text Null, "NOW", name, message line, Logo Null, Logo, shape-controller null, Stroke, Notification, Depth (shown). Chains: text layers → Text Null → main; Logo → Logo Null → main; Stroke/Notification/Depth → shape-controller null → main.

layout: Comp 1920×1080 shown at 50 % (the viewer's picture is at x 555–1515, y 131–671 of the full frame, measured). Frame short side = height. Measured (a clean frame; the view is 50 %, so comp px = 2 × view px):
- Card outline: x 696–1373, y 321–480 of the frame, i.e. 1354 × 318 comp px: 70.5 % of the comp width, 29.4 % of the comp height (measured on the outline, stroke included), centred on the comp. It is a rounded rectangle, not a pill: corner radius about 0.33 of the card's height (about 105 comp px, 7.8 % of its width), with the left and right sides straight for about 35 % of the height (measured on the crop). It is wider than the 290 px Size shown in technique 01, so the card was resized between, or the outline adds to it; build to the measured 1354 × 318.
- Card look (measured): fill light grey about 236 (ground about 250, near-white), a soft darker inner edge, a thin grey outline about 2–3 view px wide (value 202–216 at the edge row) and a faint lighter halo outside it. These come from technique 01 (stroke, depth and blur layers); no step here makes them.
- Logo: mint round badge, diameter 94 view px = 188 comp px (17.4 % of the comp height, 59 % of the card height), vertically centred on the card; its left edge is 38 view px (5.6 % of card width) in from the card's left edge. Rendered badge colour about (182,250,237); the dark glyph inside about 54 view px wide. This is the example's imported artwork: a builder may use any round logo of this size.
- Text, all left-aligned with its left edge 163 view px (24 % of card width) in from the card's left edge: name, bold black, cap height about 26 view px (about 4.8 % of comp height; inferred font about 72 comp px); message line, regular mid-grey (about 150), cap height 21 view px (3.9 % of comp height; inferred font about 60 px); "NOW" at the upper right, regular light grey, cap height about 14 view px (inferred about 37–40 px; the Character panel reads 37 px, grey, Regular on the selected layer, which fits this label). Name sits in the card's upper half and message below it; the two together are centred vertically on the card. Font in the panel: SF Pro Display (shown; the description names SF Pro). Text content is the example's: the builder is free to pick words.
- Null boxes: default null size 100 × 100 comp px (50 view px = 5.2 % of comp width, 9.3 % of comp height), anchor at the top-left corner, which sits on the comp centre, so the box lies just below-right of the centre (x 1035–1085, y 401–451). Dashed null boxes are layer outlines, drawn by the editor, not rendered. Every kept frame shows this box inside the card, so no frame of the card is free of it; the clean sub-crop below avoids it.
- No shadows or animation belong to this technique: the picture is the same before and after parenting (comp time reads 0:00:00:00 throughout).
timing and easing: none given for the parenting itself. One Position key at the start (time 0) on the shape-controller null, shown.
variations: Group different layers per null as the design needs (said in effect: shapes, text, logo each in its own null). Colour-label the layers to keep them apart (said).
pitfalls: none given. Order matters in practice: parent the child nulls only after each is named and filled (inferred).
build notes: Script: comp.layers.addNull(); null.name = "..."; child.parent = null for each layer (set the parent after creating all nulls); main.parent not set; children of main: the three group nulls. Shape-layer parenting must keep world position (setting .parent in script keeps transform values, so the nulls should be at the comp centre or positions offset). The shown child position is 0,0 relative to its parent, so either leave the three group nulls at 0,0 under a main null placed at the comp centre, or keep them at the comp centre and leave the main null at 0,0; do not offset both (inferred: the parent's value is not on screen). The layer rename of the logo is cosmetic.
unknowns:
- The parent null's own Position, and any step where the author zeroed the child's Position: not on screen.
- Null layer size (100×100 default?) and which nulls were moved: not given.
- The exact new null colours/labels beyond red/blue: not given.
- The name "main" is said but the layer reads "Null 4" through.
- Where in the stack each null was dragged: only visible in the layer order above.
- Stroke/Notification/Depth settings: from technique 01, not this video segment.

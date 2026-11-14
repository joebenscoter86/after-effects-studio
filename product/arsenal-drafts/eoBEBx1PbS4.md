# Techniques from one video (9 recipes, all unproven)

Written by the channel learner from the video's narration and screen together, then checked against the video by a second reader. Every recipe here passed that check; none has been accepted by Joe, and none is in the plugin. `status: unproven` means it has not been built in After Effects and compared with the tutorial's own result.

Each step is marked `said` (narrated), `shown` (on screen; `fNNNNNN` is a frame in the local study folder, frame number divided by the video's frame rate is seconds) or `inferred` (our reading). The `source` and frame references are for checking and stay out of the plugin. Credits: `CREDITS.md`.

| # | Technique | Jobs | Check passed in round |
|---|---|---|---|
| 01 | Bevelled 3D text wrapped in a tiled material | type; texture; depth and finish | 3 |
| 02 | Backlit environment light over a shadow-only floor | shadows and light; depth and finish; camera and 3D | 4 |
| 03 | Shadowless parallel light as an extra backlight | shadows and light; depth and finish | 2 |
| 04 | Soft front fill from a point light with smooth falloff | shadows and light; depth and finish; camera and 3D | 2 |
| 05 | Letters tumble in from behind the camera, one after another | type; camera and 3D; energy and impact | 2 |
| 06 | Depth-of-field camera on a null, pushed in through the shot | camera and 3D; depth and finish | 2 |
| 07 | Warm-sided metal title: textured faces, plain tinted sides | depth and finish; type; glow and colour | 2 |
| 08 | Hollow chrome outline title: only the extruded edge renders | depth and finish; type; shadows and light | 3 |
| 09 | Spinning ring of standing 3D letters, stackable | camera and 3D; type; layout and repetition; trending formats | 3 |

## Bevelled 3D text wrapped in a tiled material
id: 01-bevelled-3d-text-material-texture
status: unproven
source: eoBEBx1PbS4 23.76–84.8 s
jobs: type; texture; depth and finish
what it does for a beat: Turns a flat title into a solid, physical object with rounded edges and a real surface (metal, stone, paint) in a few clicks; the base for any lit 3D title shot.
what it looks like: A single short word in heavy sans-serif capitals, extruded with soft rounded front edges, every face covered in a pale-blue painted metal with rust patches; the texture is tiled small and shifted per letter so no two letters show the same patch.
ingredients:
- Text layer with the 3D Layer switch on — built-in
- Advanced 3D renderer — built-in; viewer's renderer dropdown (Classic 3D / Advanced 3D / Cinema 4D) (shown f002150)
- Geometry Options (Bevel Style, Bevel Depth, Hole Bevel Depth, Extrusion Depth) — built-in; layer > Geometry Options in the timeline (shown f002721)
- Material Assignment > Add Override (new in After Effects 27 — the version number appears only in the video's title, so inferred) — built-in; layer's Material Assignment group in the timeline, and the Properties panel's Material Assignment section (shown f003063, f003461)
- A Substance material (.sbsar), here a rusty painted-metal one — stock; free materials from Adobe Substance 3D Community Assets, reachable from the Material section's panel menu "Get Substance Community Assets..." (shown f004879, f005062)
steps:
1. Start from an ordinary white text layer: a single word, heavy sans caps (said; shown f001922)
   - Font: Poppins Black, 100 px, white fill (shown f001922)
   - Comp: 1920x1080 (shown f007128, the solid dialog later uses comp size), 23.976 fps (shown f001922 timeline)
2. Switch on the layer's 3D Layer switch (said; shown f002030 — cube icon on, transform gizmo with Z axis in the viewer)
3. Make sure the comp renderer is Advanced 3D (said; shown f002150 — Advanced 3D ticked in the viewer's renderer menu)
4. Extrude the text: open Geometry Options and drag Extrusion Depth up from 0 (said "extrude"; shown f002333 drag starting at 0)
   - Extrusion Depth: 20.0 (shown f002721)
5. Set Bevel Style to Convex to round the edges (said; shown f002721)
   - Bevel Style: Convex (shown f002721)
   - Bevel Depth: 2.0 (shown f002721; already 2.0 before any change at f002333, so left at its default)
   - Hole Bevel Depth: 100.0% (shown f002721; already 100.0% at f002333, left at its default)
6. In the layer's Material Assignment group click Add Override and choose All; this adds Front, Bevel, Side and Back slots, each at Default (said; shown f003063)
7. First route, per face: in the timeline, set the Front dropdown under Material Assignment to the rusty-metal .sbsar; only the front faces take the texture, bevel and sides stay white (shown f003210 — Front set, Bevel/Side/Back at Default, viewer shows textured fronts on white sides)
8. Put Front back to Default (shown f003461 — all four slots Default again)
9. Open the Properties panel with the text layer selected; it replaces the right-hand panel's tab (shown f003461 "Properties: STYLE" tab; menu path Window > Properties is inferred)
10. In the Properties panel's Material Assignment section, with Front/Bevel/Side/Back listed together, pick the material from the single Material dropdown so every face gets it at once (said; shown f003595 dropdown at Default, f003996 set to the rusty-metal .sbsar, "Used 12 times")
   - Material: a rusty painted-metal .sbsar (shown f003996)
   - Resolution: 1024 (shown f003996; not touched — inferred)
11. Scale the texture down so it reads as finer detail (said; value shown)
   - Scale: 17%, 17% (linked) (shown f004979)
   - Uniform Tiling: on (shown f003996, f004979; already on — inferred)
12. Tick Randomize Offset so each letter samples a different part of the texture (said; shown f004979, timeline row reads Randomize Offset On)
   - Randomize Offset Seed: 0 (shown f004979)
   - Texture Offset: 0%, 0%; Rotation: 0x+0° (shown f004979, untouched)
timing and easing: none given (the technique is static)
variations: Any material from the Substance 3D Community Assets library can be dropped in (said, browsed on screen f005062). Each face slot (Front/Bevel/Side/Back) can take its own material from its timeline dropdown: the front-only version is shown at f003210 (textured fronts, plain white bevels and sides) before the author reverts it and textures all faces from the Properties panel.
pitfalls: none given
longest on: Material Assignment — adding the override and choosing the material runs about 22 s (45.5–67.5 s), longer than the 3D/extrude setup (about 8 s) or the bevel (about 13 s); the texture scale and Randomize Offset get about 15 s (67.5–82.3 s). The author stresses that the Properties panel textures every face with one pick.
layout: measured against the comp frame, not the viewer. At f004979 the viewer is zoomed to 63.3% and its black background hides the comp edges, so it shows only about 75% of the comp's width. The comp's size on screen comes from f009845, where the pale backdrop fills the comp at 44.7% (1470 x 826 px in the full frame), scaled to 63.3% (about 2082 x 1170 px). Against that, the word is about 55% of the comp's width (1121 px) and about 24% of its height (283 px). At f003782 (44.7%) its middle sits on the viewer's centre and it measures about 56% wide and 26% tall. It is centred on the comp both ways, assuming the viewer is centred on the comp (inferred). On a black background (measured)
build notes: comp.renderer = "ADBE Advanced 3d"; textLayer.threeDLayer = true. Geometry Options live under the text layer as "Geometry Options" (Bevel Style dropdown: None/Angular/Concave/Convex; Bevel Depth; Hole Bevel Depth; Extrusion Depth) and can be set by script by display name. Material Assignment > Add Override and assigning an .sbsar material are new in After Effects 27; whether the override and the texture properties (Uniform Tiling, Randomize Offset, Scale) are reachable by script is unknown — plan to do the override and material pick by hand in the Properties panel, then check whether the per-face "Scale"/"Randomize Offset" properties appear under Material Assignment > Front in the timeline (they do on screen, f004979) and can be set by name. The .sbsar must first be imported into the project.
result: start=82.98 end=83.30 still crop=730,420,1530,780 frame=f004979
before: f001922 (flat white 2D text on black)
unknowns: The import of the .sbsar files is not shown — seven materials are already in the project's Material dropdown (f003782); the material's own parameters (only Resolution 1024 and Random Seed 0 seen); the lighting in the viewer at this stage (no light layer yet, so After Effects' default lighting — inferred). The result window is short: before 82.98 s the view is still shifting and a panel border sits in the crop, and from about 83.36 s the screen shows a browser.

## Backlit environment light over a shadow-only floor
id: 02-backlit-environment-light-with-shadow-floor
status: unproven
source: eoBEBx1PbS4 108.29–165.77 s
jobs: shadows and light; depth and finish; camera and 3D
what it does for a beat: The quick way to make a textured 3D title look photographed rather than flat: one environment light turned round behind the text so long soft shadows fall toward the viewer onto an invisible floor, with a slow light swing for movement.
what it looks like: The rusty pale-blue bevelled word stands on a seamless pale sky-blue background; dark, soft-edged shadows stretch from the base of each letter toward the camera, the front faces are a little darker (lit from behind) and the shadows drift slowly as the light turns.
ingredients:
- Environment light — built-in; new light layer, Light Type: Environment (shown f006771, f006951). Menu path Layer > New > Light... is inferred.
- Solid layer, comp size, pale sky blue — built-in (shown f007128). Menu path Layer > New > Solid... is inferred.
- Duplicate of that solid made 3D as a floor, with Material Options > Accepts Shadows: Only — built-in (shown f008167)
- Builds on 01 (Advanced 3D renderer, extruded textured text). The word ends up at about 74% of the comp's width, up from 01's size of about 52–55%. It keeps 01's size inside this technique (f006951, f007357) and grows across an edit cut at about 122.7–123.2 s, after the backdrop is made and before the floor. At the cut the viewer zoom changes from 63.3% to 44.7% while the word stays the same size on screen (measured; how the change was made is not shown)
steps:
1. Add a light and in Light Settings set Light Type to Environment (said; shown f006771 menu open on Environment, f006951 the layer "Environment Light 1" in the timeline)
   - Source: Default (no image) (shown f009210)
   - Starting values: X Rotation 0x+0.0°, Y Rotation 0x+0.0°, Intensity 100%, Casts Shadows On, Shadow Darkness 100% (shown f008413)
2. Add a comp-size solid behind the text in a colour that suits the texture, and keep it 2D as the backdrop (said; shown f007128, f007357)
   - Size: 1920 x 1080 px (shown f007128)
   - Colour: pale sky blue, about RGB 181,231,252 (#B5E7FC) sampled from the swatch (shown f007128; value read by pixel sample)
   - Stack: bottom of the layer stack, 3D switch off (shown f008296)
3. Duplicate the solid, switch the copy to 3D (said; shown f007767 — copy sits above the backdrop with its cube switch on)
4. Lay the copy flat and drop it under the letters, then scale it up (said; values shown)
   - X Rotation: 0x+90.0° (shown f007954)
   - Position: 960.0, 721.0, 0.0 (shown f007954)
   - Scale: 627.0, 627.0, 627.0% (shown f007954)
5. On the floor copy open Material Options and set Accepts Shadows to Only, so the floor stays the backdrop colour and only the shadows show (said; shown f008167)
   - Casts Shadows: On, Accepts Lights: On (shown f008167, left unchanged)
   - Floor material defaults seen: Ambient 100%, Diffuse 50%, Specular Intensity 50%, Specular Shininess 5%, Metal 100% (shown f008210)
   - The floor's eye is switched off and back on around 135–138 s (shown f008167 eye off, f008296 eye on) — a before/after check, not needed for the result (inferred)
6. Rotate the environment light so the shadows come toward the camera, making it a backlight (said; values shown)
   - X Rotation: scrubbed from 0x+0.0° to 0x-25.0° (shown f008413 at 0°, f008488 pointer scrubbing the value, f009210 at -25°)
   - Y Rotation: 0x+223.0° (shown f009210)
7. Raise the light's intensity because the backlit front is dark (said; value shown)
   - Intensity: 100% → 187% (shown f008413 at 100%, f009477 and f009845 at 187%)
   - Casts Shadows: On; Shadow Darkness: 100% (shown f009477)
8. Animate the light's Y Rotation slowly for movement (said; keyframes shown)
   - Keyframe at 0:00:00:00: Y Rotation 0x+235.0° (shown f009845 — the first key now reads 235°, changed after step 6)
   - Keyframe at 0:00:04:23: Y Rotation 0x+195.0° (shown f009774 — key selected at 0:00:04:23)
timing and easing: Two Y Rotation keys, 235° at 0 s to 195° at 0:00:04:23 (about 5 s at 23.976 fps). Linear: the keys are plain diamonds (shown f009845) and the value 219.5° at 0:00:01:21 (shown f009905) sits on a straight line between them (measured).
variations: Backdrop colour chosen to match the texture or anything else (said). The floor's size and height are set by eye (inferred).
pitfalls: Leaving Accepts Shadows On instead of Only lets the floor take light and shade and no longer match the flat backdrop (said in substance).
longest on: Building the backdrop and floor — about 26 s (113.7–139.8 s), versus about 14 s on turning the light into a backlight (139.8–153.8 s), about 12 s on intensity and keyframes, and 5 s creating the light. The point the author stresses most is backlighting: turn the light so shadows face the viewer.
layout: picture = the comp viewer, whole 16:9 comp visible at f009845 (picture box x 690–2160, y 330–1156 in the full frame). The word spans about 13% to 87% of the picture width (centred) and about 33% to 66% of the picture height; its base sits at about 66%, which is also where the floor meets the backdrop. The soft shadows start at the letter bases and darken the floor from about 65% down to the bottom edge, densest between about 66% and 80% (measured)
build notes: comp.layers.addSolid([0.71,0.906,0.988], name, 1920, 1080, 1) for the backdrop; duplicate(), threeDLayer = true, Transform > X Rotation 90, Position [960,721,0], Scale [627,627,627]. Material Options > Accepts Shadows takes Off/On/Only (Only is the third state, value 2 — inferred). Light: comp.layers.addLight(name, [960,540]) then lightType = LightType.ENVIRONMENT (needs a recent After Effects; inferred); Transform > X Rotation -25, Y Rotation keyed 235 → 195 over 0–4.96 s with linear keys; Light Options > Intensity 187. Requires the comp renderer to be Advanced 3D (from 01).
result: start=161.5 end=165.5 animated crop=700,390,1450,760 frame=f009845
before: f006951 (textured text on black, environment light just added, no floor; the word is still 01's smaller size, before the cut at about 122.7–123.2 s)
unknowns: Light Settings dialog values other than type (hidden behind the open menu in f006771); floor Y position was dragged by eye (721 is where it landed); whether the floor Position's 721 vs 719 seen mid-drag matters.

## Shadowless parallel light as an extra backlight
id: 03-parallel-rim-light-no-shadows
status: unproven
source: eoBEBx1PbS4 165.77–182.53 s
jobs: shadows and light; depth and finish
what it does for a beat: A small finishing touch on a lit 3D title: a second, shadowless directional light from behind and to one side brightens the edges and tops of the letters without adding a second set of shadows.
what it looks like: The same backlit rusty word on the pale blue floor, now with brighter, slightly glinting top and right-hand edges on the letters and lighter faces, while the single set of soft shadows toward camera is unchanged.
ingredients:
- Parallel light — built-in; new light, Light Type: Parallel (shown f010322 menu, f010786 layer). Menu path Layer > New > Light... is inferred (the cursor is on the Layer menu at f010134).
- Builds on 02 (environment backlight, shadow-only floor) and 01 (textured 3D text)
steps:
1. Add another light; in Light Settings change Light Type from Environment to Parallel (said; shown f010322 type menu open with Parallel under the cursor, f010786 layer named Parallel Light 1 with Light Options: Parallel)
2. In the same Light Settings dialog untick Casts Shadows, then OK (said; shown f010322 still ticked, f010425 unticked with the pointer moving to OK; Light Options reads Casts Shadows: Off at f010919)
   - Dialog leaves Intensity at 100% and Color white (shown f010425 dialog); intensity is raised afterwards in step 4
3. Push the light back in Z, over to the right and up, aiming at the text centre, by scrubbing the Position values in the timeline (said; shown f010601 starting at 1040.0, 460.0, -346.7 with the scrub cursor on the Z value, f010786 landed)
   - Position: 2920.0, -100.0, 2663.3 (shown f010786, f010859)
   - Point of Interest: 960.0, 540.0, 0.0 (shown f010786, left at default — inferred)
4. Raise the intensity in Light Options (said "mess with the intensity"; values shown)
   - Intensity: 100% → 407% (shown f010859)
   - Colour: white (shown f010859)
   - Shadow Darkness: 100% (shown f010859; irrelevant with shadows off)
timing and easing: none given (the light is not animated; the environment light's Y Rotation animation from 02 keeps playing)
variations: Intensity is to taste (said); right after this stretch the same light's Intensity is dragged down through 316% to 186%/216% (shown f010952, f011081 — 182.5–184 s, just outside this technique's window), so 400% is a starting point, not a final value.
pitfalls: none given beyond keeping its shadows off so it does not add a second shadow set (said in substance).
longest on: The Light Settings dialog (type and shadows), about 169–174 s, and placing the light by scrubbing Position in the timeline, about 176–180 s (f010601–f010786) — roughly 5 s each; raising the intensity takes about 2 s (180–182 s). The author frames the whole step as a small extra gain, not a major one.
layout: picture = the comp viewer, whole 16:9 comp visible at f010919 (picture box x 698–2196, y 332–1176 in the full frame). The word spans about 13% to 87% of the picture width and about 33% to 66% of its height, base at about 66% where the floor begins; shadows darken the floor from there to the bottom edge. The result crop covers only about 0–47% of the picture width and 7–97% of its height, i.e. the first two letters and the floor below them (measured)
build notes: var L = comp.layers.addLight(name, [960,540]); L.lightType = LightType.PARALLEL; Transform > Position [2920,-100,2663.3], Point of Interest [960,540,0]; Light Options > Intensity 407, Casts Shadows off (property "Casts Shadows" under "Light Options", value 0). Advanced 3D renderer from 01; the scene from 02.
result: start=181.72 end=182.0 animated crop=700,390,700,760 frame=f010919
before: f010134 (scene from 02 with only the environment light)
unknowns: The final intensity the author settled on for this light (from about 182.05 s it is scrubbed down to 316% and later 186–216%, in the next technique's stretch). The result crop is only the left part of the viewer (the S, T and floor): everywhere in this stretch the selected light's gizmo and aim line cross the right half of the picture, so no clean full-viewer frame exists. The crop holds at 407% with no pointer, handles or gizmo from 181.72 to 182.0 s (checked at both ends; the pointer at f010919 is on the Intensity value in the timeline, outside the crop). The rim on the right-hand letters shows best in the full viewer at f010919 (not clean: gizmo and aim line in the upper right) — use it to judge the rim, the crop to compare pixels.

## Soft front fill from a point light with smooth falloff
id: 04-point-light-falloff-front-fill
status: unproven
source: eoBEBx1PbS4 182.53–205.31 s
jobs: shadows and light; depth and finish; camera and 3D
what it does for a beat: Reach for this when lit 3D type reads as one flat wash from the front; a small, soft pool of light off to one side gives the faces a gentle gradient so the letters stop looking evenly lit.
what it looks like: Extruded, rust-textured letters standing on a pale floor against a pale sky-blue background, backlit so their shadows fall toward the camera; the left end of the word is a touch brighter on its front faces and the brightness fades off toward the right.
ingredients:
- Builds on 02 and 03: the environment light, shadow-catching floor and slow-turning backlight from 02 and the shadowless parallel rim light from 03 are already in the comp at the start of this span; this recipe gives only the added point light
- Point light (Light Settings dialog, Light Type: Point, Falloff: Smooth) — built-in; reached through a Light Settings dialog (shown f011521); the menu that opened it is not on screen
- The 02/03 set-up: Environment Light, Parallel Light, a 3D text layer with Advanced 3D geometry and material, a 3D floor solid — built-in
steps:
1. Lower the rim (parallel) light from technique 03 a little before adding anything (shown f010952 → f011136; the narrator only says to adjust intensity as needed)
   - Parallel light Intensity: 316% at the start of this span, settled at 216% (shown f010952, f011136)
2. Add a new light and open its Light Settings (shown f011350; the menu path Layer > New > Light… is inferred, though the Layer > New submenu with "Light…" and Ctrl+Alt+Shift+L is visible later at f019016)
3. In Light Settings set the type to Point, keep Falloff on Smooth, then OK (said "point light with a smooth fall off"; shown f011521; Smooth already showed, greyed, while the type was still Parallel at f011350, so it may be the dialog's carried-over value rather than a choice made here: inferred)
   - Name: Point Light 1 (shown f011521)
   - Light Type: Point (shown f011521)
   - Color: white (shown f011521)
   - Intensity: 100% (shown f011521; left unchanged, still 100% at f012074)
   - Falloff: Smooth (shown f011521)
   - Radius: 250 at creation (shown f011521)
   - Falloff Distance: 200 at creation (shown f011521)
   - Casts Shadows: off (shown f011521)
   - Shadow Darkness 100% / Shadow Diffusion 100 px are greyed out with shadows off (shown f011521)
4. Move the light in front of the word and over to its left (said; shown f011632, f011702, f012074)
   - Position after creation: 1040.0,460.0,-666.7 in a 1920x1080 comp (shown f011632 — the X field is being scrubbed in that frame, so treat 1040 as the creation value: inferred)
   - Final Position: 456.0,530.0,-666.7 (shown f012074); Z was never changed; reading -666.7 as well in front of the text plane at Z 0 is inferred
5. Widen the light's reach with Radius and Falloff Distance until the gradient is subtle (said; shown f011841, f011972)
   - Radius: 589.0 (shown f011972, f012074; passes through 614.0 at f011841 and 608.0 at f011905 while being dragged)
   - Falloff Distance: 373.0 (shown f011972, f012074)
6. Compare: switch each light's eye off and on in turn (point, parallel, environment) to see what each one adds, and leave all of them on (shown f012152 point light off, f012206 parallel off, f012306 environment off; all on at f012190) — done without a word, but it is how the author judges the result
layout: measured on the result crop 716,400,1512,790 of f012190 (shares of that crop, which is the comp view through the default camera): the word spans about 13%–87% of the width, centred (measured); letter tops at about 29% and bottoms at about 64% of the height, so letters are about 35% of the picture height (measured); the dark floor shadow fills the frame from about 65–69% of the height down (measured); the point light's gain is in the left half of the word — mean brightness of the letter band by quarter, light off (f012152) then on (f012190): 129→162, 147→163, 123→123, 119→120 (measured)
timing and easing: none given (the point light is not animated; the playhead stays at 0:00:02:21 of a 23.976 fps comp throughout)
variations: the narrator says to adjust intensity to taste (said); radius and falloff are tuned by eye (said)
pitfalls: none given beyond the aim: avoid a single flat front light (said)
longest on: placing the point light and tuning its Radius/Falloff Distance, about 8 s on screen (f011590 → f012074, 192.6–200.6 s); the Light Settings dialog takes about 5 s (f011225 → f011521) and the eye-switch comparison about 3 s (f012152 → f012306). The narrator stresses the goal of a subtle variation so the front is not flat.
build notes: comp.layers.addLight("Point Light 1", [960,540]) then light.lightType = LightType.POINT. Under "Light Options" (as the timeline shows it): Intensity 100, Color white, Falloff = Smooth, Radius 589, Falloff Distance 373, Casts Shadows off (match names believed to be ADBE Light Intensity, ADBE Light Falloff Type, ADBE Light Falloff Start, ADBE Light Falloff Distance, ADBE Light Casts Shadows — confirm against the installed version). Transform > Position = [456,530,-666.7]. Leave the 02 environment light, floor and 03 parallel light in place and set the parallel light's Intensity to 216. Everything here can be scripted; nothing needs the interface. Lights only affect the text and floor because they use the Advanced 3D renderer set up in 01/02.
result: start=202.95 end=203.25 still crop=716,400,1512,790 frame=f012190
before: f012152 (same framing, point light switched off)
unknowns: how the light was created (menu or shortcut not on screen); whether the light's Point of Interest or orientation matters (a point light has none shown); the comp camera is the default active camera, so its exact view is not given; exact parallel-light intensity the narrator recommends (only 216% is seen); whether any value changed while the eye switches were being toggled after 205.3 s

## Letters tumble in from behind the camera, one after another
id: 05-per-character-3d-fly-in-ramp-up
status: unproven
source: eoBEBx1PbS4 249.2–312.64 s
jobs: type; camera and 3D; energy and impact
what it does for a beat: A smooth, weighty title entrance for extruded 3D type: each letter starts turned and in front of the lens, then swings into place in a rolling wave, so the word assembles itself without any hard pop.
what it looks like: The frame starts empty; tumbling, rust-textured letters sweep in from the right and from in front of the camera, each spun on two axes, settle onto the floor with their shadows, and the word ends standing in its rest pose. With random order on, the letters arrive out of sequence.
ingredients:
- Text animator with per-character 3D (Animate > Enable Per-character 3D) — built-in; shown f015183
- Animator properties Rotation (X, Y, Z Rotation) and Position — built-in; Animate menu shown f015514, Add property menu shown f015977
- Range Selector 1 with its Advanced group (Shape, Ease High, Ease Low, Randomize Order) — built-in
- The lit, extruded text layer from 01/02 (a 3D text layer with Geometry Options, Material Options and Material Assignment groups, which After Effects 27 shows under the text layer) — built-in
steps:
1. Twirl open the text layer and, from Animate, choose Enable Per-character 3D (said "enable per character 3D"; shown f015183 menu open, f015514 ticked)
   - Note: the same Animate menu in this version also lists Front, Bevel, Side and Back submenus (greyed here) beside the usual properties (shown f015183)
2. From Animate add Rotation; with per-character 3D on it brings X Rotation, Y Rotation and Z Rotation (said "add like a rotation value"; shown f015514 hovering Rotation, f015846 animator with three rotations)
   - X Rotation: 0x+0.0° (shown f016081)
   - Y Rotation: 0x+76.0° (shown f016081)
   - Z Rotation: 0x+79.0° (shown f016081)
3. Add Position to the same animator (said "add in a position"; shown f015977 property menu, f016081 Position row in Animator 1; the exact click path Add > Property > Position is inferred)
   - Position: 0.0,0.0,-530.0 — a negative Z so the letters start between the camera and the word (said "come past the camera"; shown f016466)
4. Open Range Selector 1 and keyframe Offset from -100% to 100% (said; shown f017243)
   - Offset at 0:00:00:00: -100% (shown f017243)
   - Offset second keyframe: 100%, first set at 0:00:02:20 (shown f016875; position on the ruler matches ~2.84 s at f017243)
   - Start 0%, End 100% left at defaults (shown f016466)
5. Under Advanced, set Shape to Ramp Up (said "set the shape to ramp up"; shown f017192 dropdown open, f017243 landed)
   - Units: Percentage, Based On: Characters, Mode: Add, Amount: 100% (all defaults; shown f017243)
6. Set Ease Low to 100% (said; shown f018432)
   - Ease High: 0% (left at default; shown f018432)
7. Make both Offset keyframes Easy Ease (said "feel free", F9 is said; shown f018432, keyframes changed from diamonds at f017243 to hourglass easy-ease icons)
8. Lift the animator's Y so the letters do not cut into the floor while they travel (said; shown f018432)
   - Animator Position: 0.0,-35.0,-530.0 (shown f018506; X passes through 8.0 while being scrubbed, then returns to 0.0)
9. Optional: under Advanced turn Randomize Order on so letters arrive out of order (said "optional"; shown f018506)
   - Randomize Order: On, Random Seed: 0 (shown f018506)
10. Drag the 100% Offset keyframe later, from about 2.84 s to 0:00:04:01, to slow the whole wave down (not said; shown f018432 key at ~2.84 s, f018686 key selected at 0:00:04:01 with Offset 100%)
11. The work area end is moved along the way (about 4.3 s at f016875, about 3.4 s at f017243, about 4.1 s at f018686); it only limits the preview and does not change the result (shown)
layout: measured on the result crop 730,350,1510,845 at 336.8 s (shares of that crop, i.e. the comp view through 06's camera, after the word has landed): word spans about 11%–91% of the width, centred (measured); letter tops at about 33% and bottoms at about 66% of the height, so letters are about a third of the picture height (measured); floor shadow from about 68–70% of the height down (measured). In this technique's own framing (default camera, crop 640,262,1366,764 at 311.6 s, arrow in frame) the settled word spans about 13%–89% of the width with tops at about 33% (measured), so 06's push makes it a little larger. Text layer transform: Anchor Point 151.4,-35.7,0.0, Position 960,540,0, Scale 472% (shown f015183)
timing and easing: comp is 23.976 fps (shown f017243). Range Selector Offset: -100% at 0:00:00:00 → 100% at 0:00:04:01 (final; first set at 0:00:02:20), both keyframes Easy Ease (shown f018432, f018686). The animator's own Position and Rotation values are static; only Offset is keyframed. Shape Ramp Up with Ease High 0% / Ease Low 100% gives each letter a soft landing.
variations: the narrator says there are many ways to animate type and this is one; Randomize Order is optional (said); easy-easing the keyframes is optional (said); raise Y only if letters clip the floor (said)
pitfalls: without Ramp Up the animation does not behave correctly (said, paraphrased); letters can dip into the floor during the move unless the animator Y is raised (said)
longest on: the Range Selector — Offset keyframes, Shape and Ease Low — about 24 s (273.5–297.8 s, f016407 → f017834); the rotations take about 8 s (f015402 → f015846), the Z position about 9 s, the Y lift about 7 s, Randomize Order about 8 s. The narrator stresses the smoothness that Ramp Up plus Ease Low 100% gives.
build notes: textLayer.threeDLayer = true and textLayer.threeDPerChar = true. Animators: textLayer.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator"); in its "ADBE Text Animator Properties" add Position (ADBE Text Position 3D) [0,-35,-530], X Rotation (ADBE Text Rotation X) 0, Y Rotation (ADBE Text Rotation Y) 76, Z Rotation (ADBE Text Rotation) 79. Range Selector 1: Offset (ADBE Text Percent Offset) keys at 0 s = -100 and 4.04 s (0:00:04:01 at 23.976) = 100, then setTemporalEaseAtKey with KeyframeEase(0, 33.33) on both and KeyframeInterpolationType.BEZIER. Advanced: Shape = Ramp Up (ADBE Text Range Shape), Ease High (ADBE Text Levels Max Ease) 0, Ease Low (ADBE Text Levels Min Ease) 100, Randomize Order (ADBE Text Randomize Order) 1, Random Seed 0. Confirm match names and the Shape enum index in the installed After Effects 27 before relying on them. The text layer's own transform in the tutorial: Anchor Point 151.4,-35.7,0.0, Position 960,540,0, Scale 472% (shown f015183). The look depends on the 01–04 material and lights; the animation itself is all scriptable.
result: start=334.0 end=336.8 animated crop=730,350,1510,845 frame=f020112
before: f015514 (word standing still in the viewer just before the animator is added; Animate menu open outside the viewer)
unknowns: no clean result exists for this technique alone: its own playback (about 309.8–311.3 s, settled to 312.4 s) has the mouse arrow inside the viewer in every frame once the letters appear. The result named above is the 06 playback of the same entrance (frame f020112, cut from source.mp4, saved as STUDY/scratch/06/clean_f020112.png); in it the depth-of-field blur on near letters and the slight camera push in come from 06, not from this technique — this technique gives the letters' paths, rotations, order and timing. Whether either playback runs at real speed is not settled (inferred only), so use the keyframe times above, not on-screen speed. Comp duration and work area length beyond ~4 s are not given; Random Seed is left at 0 and no other seed is tried; whether Easy Ease came from F9 or a menu is not seen

## Depth-of-field camera on a null, pushed in through the shot
id: 06-depth-of-field-camera-push-on-null
status: unproven
source: eoBEBx1PbS4 313.81–337.12 s
jobs: camera and 3D; depth and finish
what it does for a beat: Add this on top of a 3D type entrance to make it feel filmed: letters close to the lens go soft, and a slow camera push keeps the frame alive after the word has landed.
what it looks like: The same tumbling-letter entrance as 05, now seen through a camera with depth of field: letters that pass close to the lens are heavily blurred while the ones at the word's depth stay sharp, and the camera creeps slightly closer over the whole clip.
ingredients:
- Camera layer, Two-Node Camera, Preset 50mm — built-in; Layer > New > Camera… (shown f019016, shortcut Ctrl+Alt+Shift+C shown in the menu)
- Null Object (3D) — built-in; right-click in the timeline > New > Null Object (shown f019496 context menu; Null Object, Ctrl+Alt+Shift+Y, named on screen)
- The animated 3D type from 05 — built-in
steps:
1. Add a camera from Layer > New > Camera… (said "create a camera layer"; menu shown f019016, so the path is shown, not said)
2. In Camera Settings keep the defaults and click OK (shown f019136)
   - Type: Two-Node Camera (shown f019136)
   - Preset: 50mm; Zoom 940.74 mm; Focal Length 50.00 mm; Film Size 36.00 mm; Angle of View 39.60° (shown f019136)
   - Enable Depth of Field: unticked in the dialog (shown f019136); the viewer at f019196 confirms no blur yet
3. Twirl open Camera Options and switch Depth of Field On (said "enabled depth of field"; shown f019316)
   - Zoom: 2666.7 pixels (39.6° H) (shown f019256)
   - Focus Distance: 2343.7 pixels (default, unchanged; shown f019256, f019436)
   - Focus Area Width: 0.0 (shown f019256; a Camera Options property shown in this version)
   - Near, Far Blur Level: 100.0,100.0% (shown f019256; also shown in this version)
4. Raise Aperture a little for stronger blur (not said; shown f019436)
   - Aperture: 25.3 pixels → 30.3 pixels (shown f019256, f019436)
5. Create a Null Object (said "create like a 3d null object"; shown f019496 context menu, f019556 the new null at the top of the stack) and switch its 3D Layer switch on (said "3d"; shown f019556 switch empty, f019590 cursor on it, f019616 on)
6. Parent the camera to the null with the Parent & Link column (said; shown f019676, Camera's parent reads the null)
7. Keyframe the null's Position in Z so the camera travels forward across the clip (said "keyframe the z position of the null"; shown f019736, f020036)
   - Null Position at 0:00:00:00: 960.0,540.0,0.0 (shown f019736)
   - Null Position at 0:00:04:23: 960.0,540.0,231.0 (shown f020036; first typed as 206.0 at f019916, then raised to 231.0)
8. Extend the work area end from about 4.1 s to about 5.0 s so the preview covers the push (not said; shown f019016 against the cut at 335.4 s; preview only, it does not change the render)
9. Play it back to judge the blur and push (shown 334.0–336.8 s; frame f020112 cut from source)
layout: measured on the result crop 730,350,1510,845 (shares of that crop, i.e. the comp view through the new camera): at 336.8 s, after the word has landed and while the push continues, the word spans about 11%–91% of the width, centred (measured); letter tops at about 33% and bottoms at about 66% of the height (measured); the floor shadow fills the frame from about 68–70% of the height down (measured); in 05's framing without the push the same word spans about 13%–89% (measured at 311.6 s); at 334.7 s a letter entering at the right edge already covers about the right quarter of the width, cut off by the edge, and is soft (measured)
timing and easing: two linear Position keyframes on the null (diamond icons, shown f020036): Z 0 at 0:00:00:00 → Z 231 at 0:00:04:23 (comp at 23.976 fps). The 05 text animation itself ends at 0:00:04:01, so the push carries on slightly past the landing. No easing given.
variations: parenting to a null is offered as optional ("if you wish", said); the narrator calls it just his way of moving a camera (said)
pitfalls: none given
longest on: the null push (creating, parenting and keyframing Z), about 9 s (f019496 → f020036, 324.9–333.9 s); camera creation and dialog about 3 s (f019016 → f019196); depth of field and aperture about 3 s (f019256 → f019436). The narrator stresses the depth-of-field blur as what makes the letters look nice.
build notes: cam = comp.layers.addCamera("Camera 1", [960,540]) (Two-Node by default with point of interest; preset values from a 50 mm camera on a 1920x1080 comp give Zoom 2666.7). cam.property("ADBE Camera Options Group").property("ADBE Camera Depth of Field").setValue(1); Aperture (ADBE Camera Aperture) = 30.3; Focus Distance left 2343.7. Focus Area Width and Near, Far Blur Level are Camera Options properties as this version shows them; their match names are not known — find them by walking the Camera Options group by script or set them by hand (here they stay at defaults, so they can be left alone). nul = comp.layers.addNull(); nul.threeDLayer = true; cam.parent = nul; nul Position keys [960,540,0] at 0 and [960,540,231] at 4.96 s (0:00:04:23). Positive Z on the null moves the camera toward the word (the comp's default camera space has the lens at negative Z).
result: start=334.0 end=336.8 animated crop=730,350,1510,845 frame=f020112
before: f019196 (camera added, depth of field still off, same moment of the animation; viewer picture at about 694,330,1476,826 in that layout — a different crop from the result)
unknowns: frame f020112 is cut from source.mp4 (saved as STUDY/scratch/06/clean_f020112.png). Whether the playback runs at real speed is not settled (the entrance looks quick on screen; inferred only), so use the keyframe times, not the on-screen speed. The camera's own Position and Point of Interest are not shown after parenting; the comp's total length is not shown; the null's Position keys are not eased on screen

## Warm-sided metal title: textured faces, plain tinted sides
id: 07-gold-face-plain-sides-look
status: unproven
source: eoBEBx1PbS4 341.69–356.58 s
jobs: depth and finish; type; glow and colour
what it does for a beat: A fast restyle of an already-built textured 3D title when you want a warmer, more polished metal read without rebuilding the material: keep the texture only where it matters and let the extruded sides catch light as a tinted metal.
what it looks like: Chunky extruded capital letters on a pale sky-blue background with a soft floor shadow; the front and bevel keep a rusted-metal texture while the sides become a smooth, near-white pale cream metal with a warm tint only at the edges, flashing bright where the backlight hits.
ingredients:
- Builds on 01 (bevelled 3D text with a Material Assignment override per face) and the lighting of 02–04 (environment light, shadow-catcher floor, parallel and point lights); this span only changes the existing text layer.
- Advanced 3D text layer, Material Assignment override (Front / Bevel / Side / Back dropdowns) — built-in, After Effects 27; text layer > Material Assignment (shown f020613)
- Material Options > Specular Shininess — built-in; text layer > Material Options (shown f021182)
- Character panel fill colour (Text Color dialog) — built-in (shown f020971)
steps:
1. Start from the finished textured title of technique 01: in the text layer's Material Assignment group the Front, Bevel, Side and Back faces each use the rusted-metal material (shown f020613).
2. Remove the texture from the extruded sides only: set the Side dropdown under Material Assignment back to Default; Front, Bevel and Back keep the material (said; shown f020784).
   - Side: Default (shown f020784)
3. Change the base colour of the text to a pale yellow so the now-untextured sides read as warm metal; the Text Color dialog is open from the Character panel fill swatch (said "yellowish"; shown f020971; how the dialog was opened is inferred from the Character panel swatch changing).
   - Text Color: H 34°, S 32 %, B 100 %, #FFDCAD (shown f020971, dialog still open; applied colour visible in the Character fill swatch at f021052)
4. Open Material Options on the text layer and raise Specular Shininess to 100% (said; shown f021182). It read 5% just before the change (shown in a cut at 351.8 s, scratch/07/s01.png) and was dragged up through 11% and 98% to land at 100% at about 352.7 s.
   - Specular Shininess: 100% (shown f021182)
   - Other Material Options left as they were: Casts Shadows On, Accepts Shadows On, Accepts Lights On, Ambient 100%, Diffuse 50%, Specular Intensity 50%, Metal 100% (shown f021182)
5. Carry-over: the pale yellow fill and Specular Shininess 100% are not changed again in technique 08 and give that look's rims their warm glint (inferred: no further change seen; fill swatch still pale yellow at f022171).
6. Not a step: around 355.5–356.5 s the author switches the Parallel Light 1 eye off (f021392) and it is on again by f021872; this is a quick comparison, not part of the look (inferred).
layout: (all measured on the result frame f021165; the viewer picture there spans x 688–2145, y 154–973 at full size, the whole comp) word centred horizontally, spanning about 10% to 92% of the picture width (about 82% wide) (measured); cap tops at about 31% and letter bottoms/floor contact at about 67% of the picture height, so letters are about 36% of the picture height (measured); floor shadow fills the lower third below about 67% (measured).
timing and easing: none given (no keyframes are set in this span; the existing camera push and letter animation from 05–06 are untouched).
variations: The narrator offers this as one example of how quickly the style can be changed; the colour is described loosely as "yellowish" (said).
pitfalls: none given
longest on: Roughly even split. Turning the side texture off takes about 4 s (342–346 s), picking the yellow in the colour dialog about 3 s (347.5–350.5 s), the shininess change about 2 s (350.9–352.7 s); the remaining ~4 s show the result and a light toggle. The narration stresses the shininess step as the thing that makes it read as gold.
build notes: By script, on the text layer: the Material Assignment group and its Side override are new in After Effects 27 (names exactly as shown: "Material Assignment", "Front", "Bevel", "Side", "Back"; set Side to "Default"); scripting access to these overrides may not exist yet, so plan to do step 2 by hand in the Timeline if the property cannot be found. Fill colour: set via the TextDocument fillColor [1, 0.863, 0.678]. Specular Shininess sits under "Material Options" (matchName ADBE Material Options Group > specular shininess) and can be set to 100 by script.
result: start=352.75 end=354.2 still crop=700,250,1380,700 frame=f021165 (not a kept frame: cut from source.mp4 at 352.75 s, saved as scratch/07/f021165.png; the small dark arrow-shaped mark inside the lower counter of the first letter is the letter's own geometry, not the mouse)
before: f020613
unknowns: Whether the text colour was changed through the Character panel swatch or another route (only the dialog is seen); environment and other light settings in this comp are not shown in this span.

## Hollow chrome outline title: only the extruded edge renders
id: 08-outline-only-3d-title
status: unproven
source: eoBEBx1PbS4 356.58–398.87 s
jobs: depth and finish; type; shadows and light
what it does for a beat: A cut-out, stroke-like 3D title for a sleek or dark mood: the letter faces vanish and only the lit extrusion walls remain, so the word reads as a hollow metal outline standing on a floor.
what it looks like: The same chunky extruded word, now with see-through front and back faces, so each letter is a thin bright metal rim of its own depth; first shown on the pale blue background, then on a near-black background where the rims glint silver-gold against the dark with a faint floor shadow.
ingredients:
- Continues directly from technique 07's state, itself a variant of 01 (bevelled advanced-3D text with Material Assignment overrides) lit as in 02–04: the text fill is still pale yellow #FFDCAD (Character swatch shown f022171, f022925) and Material Options > Specular Shininess is still 100% (set in 07, not changed here: inferred). These two settings give the rims their warm glint; starting from 01's white fill and low shininess will not match.
- Advanced 3D text layer, Material Assignment overrides — built-in, After Effects 27 (shown f022171)
- Text animator properties Front Opacity and Back Opacity — built-in, After Effects 27; Animate > Front > Color > Opacity (shown f022270), then the animator's Add > Property > Back > Color > Opacity (shown f022675)
- Solid layer for the background — built-in (Solid Settings dialog shown f023335)
- Environment Light (Light Options: Environment) — built-in (shown f023755)
steps:
1. Remove every texture from the title: under the text layer's Material Assignment set Front, Bevel, Side and Back all to Default (said; partly done at f021872 with Bevel, Side and Back on Default; all four Default at f022171).
   - Front / Bevel / Side / Back: Default (shown f022171)
2. On the text layer click Animate and choose Front > Color > Opacity; this adds a new animator, Animator 2 (shown f022675), beside the existing Animator 1 (inferred: the letter entrance from 05) holding Front Opacity (said; menu shown f022270; Front Opacity 100% in Animator 2 shown f022675).
3. In that same animator use Add > Property > Back > Color > Opacity to add Back Opacity (said; menu shown f022675).
4. Set both to 0% so only the extruded sides are drawn (said; shown f022925). The animator's Range Selector 1 is left at its defaults (inferred: it is not opened).
   - Front Opacity: 0% (shown f022925)
   - Back Opacity: 0% (shown f022925)
5. Darken the background: a Solid Settings / Solid Color dialog is used to make a dark grey solid, and the bottom layer is a solid named as a second background; at f023335 the panel already reads Effect Controls for that solid and the dialog is Solid Settings with "Affect all layers that use this solid", so the solid existed before its colour was set (said "change your background colour"; shown f023335; the bottom layer reads as a new dark solid at f023455). The colour first tried is #0E0E0E (shown in the open dialog, scratch/08/f023206-crop.jpg) and then #282828 (shown f023335, dialog still open).
   - Solid colour: #282828 (shown f023335, dialog open). The background in the result frame measures RGB 23,23,23 (#171717), matching neither dialog value, so the final colour is not settled (measured on f023688).
6. On Environment Light 1, click the stopwatch of Y Rotation off, which deletes the keyframes it carried from technique 02; the value stays at 0x+198.5° and the light becomes static (not said; shown in cuts: at 393.0 s the keyframe navigator and two keyframes are present, at 393.5 s both are gone and the stopwatch is plain, scratch/08/v2/ys.png).
7. Retune the now-static light so the rims catch light from a better angle: drag Y Rotation from 0x+198.5° down to 0x+120.5° (said "adjust your environment lights rotation"; shown f023755).
   - X Rotation: 0x-25.0° (shown f023755, unchanged)
   - Y Rotation: 0x+120.5°, no keyframes (shown f023755)
   - Intensity: 187% (shown f023755; it was scrubbed down to 142% and 101% at f023455/f023515 and left back at 187%)
   - Casts Shadows: On; Shadow Darkness: 100% (shown f023755)
8. Not a step: at 357.5 s the author briefly opens another comp holding a different textured word (f021452) before returning; nothing there is changed (inferred).
layout: (all measured on the result frame f023688; the viewer picture there spans x 672–2084, y 320–1114 at full size, the whole comp) word centred horizontally, spanning about 9% to 92% of the picture width (about 82% wide) (measured); cap tops at about 31% and letter bottoms at about 67% of the picture height, letters about 36% of the picture height (measured); background flat #171717 with a faint floor shadow just under the letters (measured).
timing and easing: none given. No keyframes on Front/Back Opacity, and the environment light's Y Rotation keyframes from 02 are deleted in step 6, so the light is static in this look (shown, cuts at 393.0/393.5 s).
variations: The background colour and the environment light's rotation should be set to suit your own build (said).
pitfalls: none given
longest on: Building the opacity animator: about 15 s (367–382 s) going through the Animate and Add menus for Front and Back Opacity and setting them to 0%. Removing the textures takes about 10 s (357–367 s), the background colour about 5 s (384–389 s) and the light (intensity scrub, stopwatch off, rotation) about 6 s (389–395 s).
build notes: By script: Material Assignment overrides are new in After Effects 27 and may not be exposed to scripting; set them to Default by hand if needed. The animator: add a Text Animator to the text layer ("ADBE Text Animators") and, if the AE 27 per-face colour properties are scriptable, add the properties shown as "Front Opacity" and "Back Opacity" and set both to 0; otherwise add them by hand via Animate > Front > Color > Opacity and Add > Property > Back > Color > Opacity. Background: comp.layers.addSolid([0.157,0.157,0.157], ...) placed at the bottom. Light: on Environment Light 1 remove all Y Rotation keyframes (while numKeys > 0 removeKey(1)), then set Y Rotation = 120.5 as a static value; Intensity 187. Keep the text fill [1, 0.863, 0.678] and Specular Shininess 100 from 07.
result: start=394.75 end=394.95 still crop=690,410,1380,660 frame=f023688 (not a kept frame: cut from source.mp4 at 394.8 s, saved as scratch/08/f023688.png; the drag ends at 394.6 s and the editor re-zooms at 395.0 s, then the mouse enters the picture, so the window is short)
before: f021872 (part-way through step 1: Bevel, Side and Back already Default, Front still textured; 07's finished state is seen at f021206)
unknowns: Whether the dark background is a new solid or the old one recoloured (the layer name changes, so a new solid is likely); which colour was kept (#0E0E0E and #282828 are seen in the dialog, the picture measures #171717); the Range Selector settings of the new animator.

## Spinning ring of standing 3D letters, stackable
id: 09-rotating-3d-text-ring-loop
status: unproven
source: eoBEBx1PbS4 404.88–484.0 s
jobs: camera and 3D; type; layout and repetition; trending formats
what it does for a beat: A seamless looping title or bumper: a word repeated around a circle stands up like a carousel and turns forever, and stacked copies make a tower of rings; good for intros, loops and background type.
what it looks like: Chunky extruded letters with rusted-metal faces and bright metal sides stand upright around a flat circle and spin on the spot over a pale blue backdrop with a soft floor; two rings are stacked one above the other and a shallow depth of field blurs the far side.
ingredients:
- Starts from the textured, lit advanced-3D title of 01–06 (environment light, shadow-catcher floor, camera parented to a null with depth of field); a fresh copy of that comp is used with the word repeated.
- Ellipse Tool mask on the text layer — built-in; toolbar shape tools > Ellipse Tool (shown f024431)
- Text Path Options > Path — built-in (shown f024930)
- Text animator with per-character 3D Rotation — built-in; Animate > Rotation with Enable Per-character 3D ticked (shown f025272)
- Composition viewer 2 Views layout with a Top view, Draft 3D — built-in (shown f026266, f027058)
- Expression on Z Rotation — built-in (shown f028004)
- Null object (the camera's parent from 06) — built-in (shown f027445)
steps:
1. With the text layer selected, pick the Ellipse Tool and draw a circular mask on it (said; tool menu shown f024431; mask circle in viewer f024930). It is drawn in the default Add mode (shown f024619).
   - Mask 1 mode: Add when drawn (shown f024619); it reads None once it is picked as the text path in step 2, with no click seen, so the switch looks automatic (shown f025001; automatic switch inferred)
2. Under Text > Path Options set Path to Mask 1; the letters now follow the circle (said; shown f024930).
   - Path: Mask 1; Reverse Path Off; Perpendicular To Path On; Force Alignment Off; First Margin 0.0; Last Margin 0.0 (shown f024930)
3. Delete the earlier text animators (the letter entrance from 05) so the ring is static before it spins (said; animator selected for deletion at f025001).
4. Click Animate > Rotation (Enable Per-character 3D is ticked) to make a new animator, and set its X Rotation to exactly +90° so each letter turns upright relative to the path (said; menu shown f025272; value shown f025554).
   - Animator X Rotation: 0x+90.0°; Y Rotation 0x+0.0°; Z Rotation 0x+0.0° (shown f025554)
5. In the layer's own Transform set X Rotation to -90°, which lays the circle flat so the letters stand around a horizontal ring (said; shown f025854).
   - Layer X Rotation: 0x-90.0° (shown f025854)
   - Layer Scale is 472.0,472.0,472.0% from the earlier build (shown f025854)
6. Move the layer down so the ring sits near the floor (said "lower this down"; shown in a crop of f026034, scratch/09/ps.png).
   - Position: 960.0,778.0,165.0 (shown f026034 crop)
7. Check the ring from above: switch the viewer to 2 Views, set the second view to Top, with Draft 3D on and the viewer extended (said; menu shown f026266; Top view shown f027058).
8. Close the gaps in the ring: select the mask and press Ctrl+T (shortcut said; that it is Free Transform Points is inferred) to enlarge it past the letters' extent, and type more copies of the word into the text so the letters run all the way round (said; the word appears twice at f027058 and three times at f028004).
9. Pull the camera back by moving the null that the camera is parented to (said "use a null object to zoom out"; shown f027445).
   - Null Position: 960.0,540.0,-1335.7 (shown f027445)
10. Centre the text layer's anchor point on the ring before animating; the author opens Layer > Transform for this (stressed; menu shown f027601; the exact submenu item is not seen, inferred: Center Anchor Point in Layer Content).
11. Alt-click the stopwatch of the layer's Z Rotation and enter a time expression with a negative multiplier so the ring spins (said; shown f028071).
   - Z Rotation expression: time*-30 (shown f028071)
12. Duplicate the text layer and move the copy up to stack a second ring; more copies can be added the same way (said; shown f028479, copy is layer 6, original layer 7 keeps its expression).
   - Copy Position: 960.0,418.0,165.0 (shown f028479)
layout: (all measured on the result frame f028719; the viewer picture there spans x 768–2164, y 303–1088 at full size, the whole comp) the two-ring stack is centred horizontally; its nearest letters span about 9% to 91% of the picture width, so the ring's front-on diameter is about 82% of the picture width (measured); upper ring's front letters run from about 17% to 47% of the picture height and the lower ring's from about 45% to 76%, so each band of letters is about 30% of the picture height and the two bands just touch (measured); the floor horizon sits at about 72% of the picture height (measured). In comp units the copy starts at Y 768, where the original was when duplicated (shown in a cut at 470.9 s, scratch/09/v2/p470.9.png), passes 468 and 398 (f028409) and lands at Y 418 (shown f028479), so the rings are about 350 px apart (measured from those two values).
timing and easing: Linear, endless spin from the expression time*-30 (−30° per second on Z, so one turn every 12 s) (shown f028071; rate inferred from the expression). No keyframes.
variations: Two, three or four stacked copies (said). Lower the ring as needed (said).
pitfalls: Centre the anchor point on the ring before adding the spin, or it goes badly (said, stressed); what goes wrong is not said: presumably the ring orbits or wobbles around an off-centre pivot instead of turning in place (inferred).
longest on: Standing the letters up: about 14 s (417–431 s) on the +90° animator and the -90° layer rotation. Close behind are drawing the mask and setting the path (about 12 s, 405–417 s), the top-view check (about 11 s) and closing the loop with Ctrl+T and extra text (about 11 s). The anchor-point warning is the point the author stresses most.
build notes: By script: textLayer.mask.addProperty("ADBE Mask Atom") with a circular shape, then set maskMode MaskMode.NONE explicitly (in the interface it flips from Add to None by itself when used as the path); Text > Path Options > Path = mask index 1 ("ADBE Text Path Options" > "ADBE Text Path"). Animator: add "ADBE Text Animator" with "ADBE Text Rotate X" = 90 (requires per-character 3D: textLayer.threeDPerChar = true). Layer: transform.xRotation = -90, position [960,778,165]. Expression on transform.zRotation: "time*-30". Anchor: compute sourceRectAtTime centre or use app.executeCommand for Center Anchor Point in Layer Content. Viewer layout (2 Views, Top, Draft 3D) is interface only. Mask scaling with Ctrl+T is by hand, or scale the mask vertices by script. Duplicate with layer.duplicate().
result: start=478.3 end=479.1 animated crop=800,330,1300,700 frame=f028719 (not a kept frame: cut from source.mp4 at 478.65 s, saved as scratch/09/f028719.png; the narration here is already the sign-off, but the picture is the finished two-ring spin; the mouse enters the picture at about 479.2 s and the editor re-zooms just before 478.3 s)
before: f024431
unknowns: The ellipse mask's size and position and how far it was enlarged; the exact repeated text; the original ring's final Y after the copy was made (it was 778 at f026034 and 768 when duplicated; whether the original moved again after the copy is not shown); the anchor-point command used; whether the earlier camera push from 06 still runs in this comp (the camera keeps Depth of Field On, Focus Distance 2962.7 px, Aperture 96.3 px, Zoom 2666.7 px, shown f028917, which is inside the sign-off).

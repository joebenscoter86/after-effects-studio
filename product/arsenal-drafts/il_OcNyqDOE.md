# Techniques from one video (13 recipes, all unproven)

Written by the channel learner from the video's narration and screen together, then checked against the video by a second reader. Every recipe here passed that check; none has been accepted by Joe, and none is in the plugin. `status: unproven` means it has not been built in After Effects and compared with the tutorial's own result.

Each step is marked `said` (narrated), `shown` (on screen; `fNNNNNN` is a frame in the local study folder, frame number divided by the video's frame rate is seconds) or `inferred` (our reading). The `source` and frame references are for checking and stay out of the plugin. Credits: `CREDITS.md`.

| # | Technique | Jobs | Check passed in round |
|---|---|---|---|
| 01 | Found vector art, one object per file, laid out as separate layers | workflow; layout and repetition | 2 |
| 02 | One mood grade for mismatched art: Tritone plus a single-point Curves, pasted to every layer | glow and colour; depth and finish | 2 |
| 03 | Flat cut-outs into a deep stage: push far layers back in Z, pull near ones forward, rescale to frame | camera and 3D; depth and finish | 2 |
| 04 | Depth-of-field camera locked on the subject, with a slow dolly in | camera and 3D; depth and finish | 2 |
| 05 | Endless wind sway from two rotation keys and a ping-pong loop | energy and impact; workflow | 3 |
| 06 | Grass rippling in the wind with Wave Warp | energy and impact; texture | 3 |
| 07 | Leaves blown across the frame with textured particles | B-roll scenes; layout and repetition | 3 |
| 08 | Rain slanted to match the wind | B-roll scenes; texture | 1 |
| 09 | Small body shifts on a wide-shot figure with puppet pins | B-roll scenes | 2 |
| 10 | Film-stock grain and mood finish on a top adjustment layer | depth and finish; texture; glow and colour | 1 |
| 11 | Long-lens close-up that matches the wide shot | camera and 3D; depth and finish; B-roll scenes; workflow | 2 |
| 12 | Wind in a still character's hair | B-roll scenes; energy and impact; workflow | 2 |
| 13 | Side-light a face with a matted Curves layer | shadows and light; glow and colour; depth and finish | 1 |

## Found vector art, one object per file, laid out as separate layers
id: 01-vector-art-split-into-layers
status: unproven
source: il_OcNyqDOE 12.96–70.5 s
jobs: workflow; layout and repetition
what it does for a beat: The groundwork for a lit, deep 2D scene when you cannot draw: gather ready-made vector illustrations, keep only the pieces you need, and bring every object into After Effects as its own layer so each one can later be graded and placed in depth on its own. Assumes: nothing; it starts from an empty project.
what it looks like: A dusk scene assembled from stock pieces: a cloudy sky, a far city skyline, a rocky ledge with two small figures seen from behind, a stone wall, a street lamp, bare trees, bright grass along the bottom and two leafy branches framing the left and right edges. At this stage nothing is graded, so the pieces still clash (very saturated green grass and leaves against a cool sky).
ingredients:
- A web browser and a free stock-vector site, searched with a "Vectors" type filter — external; shown f001557 (web search), f001856 (vector site search "Characters" with the Vectors filter)
- Adobe Illustrator — paid (separate Adobe app); used to open the stock files, delete unwanted objects and save one object per file
- After Effects footage import (.ai, .png, .jpg) — built-in
- Layer Transform: Position, Scale, Rotation — built-in
steps:
1. (Browser) Search the web for free vector art and open a stock-vector site; filter results to vectors and search for what the scene needs, e.g. characters (said; shown f001557, f001856)
2. (Illustrator) Open a downloaded stock file. The example is a character sheet holding many poses and heads on one artboard (said; shown f001961)
3. (Illustrator) Delete every object you do not need, leaving one object (here one figure seen from behind) alone on the artboard (said; shown f002149 part-way through deleting, f002743 single figure left)
   - The object is a Group; the Layers panel still holds a single "Layer 1" — the separation is done by keeping one object per file, not by Illustrator layers (shown f002443, f002743)
4. (Illustrator) Move the remaining object to the middle of the square artboard and scale it up until it nearly fills the artboard's height; done on screen without comment (shown f002503 small at the artboard's left edge, about 65% of its height; f002563 centred; f002683 enlarged, about 90% of the height; saved like that, f002743)
   - The tool used (a selection drag of the bounding box) is inferred; no numeric values are shown
5. (Illustrator) Save that file on its own: File > Save As, file type Adobe Illustrator (*.AI) (shown f002863 File menu open, f003043 Save As dialog with the type list open and Adobe Illustrator (*.AI) highlighted)
   - The narrator says a PNG works as well (said); the Save As type list has no PNG entry, so that route would be File > Export (inferred, not shown)
   - The file name in the dialog is the stock file's own name; whether the original was overwritten or saved elsewhere is not shown
   - Repeat for every object you want as a separate piece (inferred; the save folder already holds several such .ai files, f003043)
6. (After Effects) Import all the pieces; the project holds one footage item per object, a mix of .ai (characters, branches, grass, trees), .png (wall, ledge, city) and a .jpg sky (shown f003343, f004123)
   - One illustration appears imported as a composition with its layers, since a "… Layers" folder sits in the Project panel (shown f003343; how it was imported is inferred)
   - Example sizes in the Project panel: a character .ai at 1080 x 1080, the sky .jpg at 2912 x 1460 (shown f003343, f004123)
7. (After Effects) Put each object on its own layer in one composition and arrange it by hand with Scale, Position and Rotation, adding pieces one at a time from the back (sky, city) to the front (grass, branches) (said; shown f003343, f004123; build order inferred from the 60–70 s stretch)
   - Composition frame rate: 23.976 fps (shown f004123)
   - One foreground branch: Rotation 0x+47.0° (shown f004123)
   - The other foreground branch: Scale 60.0% (shown f004123)
   - The stone wall: Scale 94.0% (shown f004123)
   - Layer order, top to bottom, in the 13-layer stack: two foreground branches, grass, the two figures, wall, ledge, a tall pine, two bare trees, the city, a shape layer, the sky (shown f005058). In the earlier 11-layer stack a bare tree sits between the grass and the figures (f004123), so it was moved down and the pine and second bare tree added later (shown by the two frames; when is not shown)
8. Keep every object as a separate layer; the narrator stresses this is what later lets you control light and depth per object (said)
layout: measured on the result frame against the picture inside the crop (the whole comp view), as shares of its width (x) and height (y): the two figures stand together with their centre at about 43% x, about 31% of the picture height tall, feet about 75% down (measured); the ledge spans about 19%–60% x with its top about 72% down (measured); the bright grass band fills roughly the bottom 18% (measured); the left leafy branch covers the left ~27% from ~27% down to the bottom, the right one the right ~25% from ~22% down (measured); the lamp sits at about 67% x, 70%–79% down (measured); the stone wall is cut by the right edge, about 40%–80% down (measured); the city skyline runs across at about 50%–72% down behind the ledge (measured)
timing and easing: none given
variations: Save each isolated object as PNG instead of an Illustrator file (said). Any layout you like (said).
pitfalls: none given
longest on: Arranging the pieces in After Effects, about 19.7 s (f003058–f004230), just ahead of the Illustrator clean-up and save, about 18 s (f001961–f003043); the web search takes about 9.5 s. The narrator stresses that every object must be its own layer.
build notes: The browser and Illustrator stages are by hand. In After Effects, script the rest: app.project.importFile(new ImportOptions(File(...))) for each piece (for a layered .ai use importAs = ImportAsType.COMP to get its layers), comp.layers.add(item) per piece, then set layer.property("ADBE Transform Group").property("ADBE Scale"/"ADBE Position"/"ADBE Rotate Z"). Set "Continuously Rasterize" (layer.collapseTransformation = true) on .ai layers if they are scaled above 100% later. Placement is an artistic layout; only the few values above are given.
result: start=73.88 end=74.05 still crop=814,324,1434,806 frame=f004437 (not a kept frame: cut from source.mp4 at 73.95 s, saved as scratch/01/result-73.95.png). The finished, still ungraded layout is shown again at the start of the next chapter; inside 01's own span every view of it carries selection handles or the mouse.
before: f001961 (the raw stock sheet in Illustrator, before anything is deleted)
unknowns: The exact stock files and how many objects were saved; whether PNGs were used for any piece made in Illustrator (the wall, ledge, city and sky arrive as .png/.jpg, source not shown); composition size and duration (1920 x 1080 inferred from a 960,540 centre seen later); Position values for most layers and Scale for most pieces (a character layer is being dragged down to about 45% at f003343 but its landed value is not shown; several Scale values flash by while dragging: 46, 69, 76, 32, 37%); the content of the shape layer near the bottom of the stack; the Import dialog settings.

## One mood grade for mismatched art: Tritone plus a single-point Curves, pasted to every layer
id: 02-tritone-curves-mood-grade
status: unproven
source: il_OcNyqDOE 70.5–116.13 s
jobs: glow and colour; depth and finish
what it does for a beat: When a scene is built from stock pieces that do not match (saturated greens, different palettes), this pulls them into one night-time or moody colour world in a minute, before any lighting or depth work. Assumes: a composition in which every scene object is its own layer (technique 01).
what it looks like: The same dusk scene turned into a cold blue-teal night: leaves, grass, trees and figures lose their bright colours and become dark blue-grey shapes, highlights are held down, and the figures read almost as silhouettes against a slightly lighter cloudy sky. Steps 1–6 alone leave the street lamp and stone wall graded too, so the lamp is a dull grey (f006948). In the later picture used as the result, the wall layer's Tritone is switched off (step 7), so the wall keeps its grey stone and the lamp glows warm orange, the only warm spot in the frame.
ingredients:
- Tritone — stock; Effects & Presets > Color Correction > Tritone (shown f005058)
- Curves — stock; Effects & Presets > Color Correction > Curves (shown f006295)
- Copy and paste of effects between layers — built-in
steps:
1. Select one layer (the example starts on a foreground branch) and apply Tritone from the Effects & Presets panel (said; shown f005058 search, f005648 effect on that layer)
2. Set Tritone Midtones to the colour that sets the mood; the narrator calls this the main control (said)
   - Midtones: #1C3C4C (H 200°, S 63%, B 30%; R 28, G 60, B 76), a dark slate blue (shown f005548 typed in the colour dialog, landed swatch f005648)
3. Set Tritone Highlights down from white to a grey to hold the brightness down (said)
   - Highlights: #282828 (B 16%, R/G/B 40), a very dark grey rather than a mid grey (shown f006024 typed in the colour dialog; landed swatch f006104)
   - Shadows: left at its default black (shown f005648)
   - Blend With Original: 0.0% (shown f005648)
4. Add Curves on the same layer, below Tritone, and drag one point on the RGB curve down to darken the midtones (said; shown f006570)
   - Channel: RGB (shown f006570)
   - One point placed at roughly input 63%, output 37% of the range (about 160 → 95 on a 0–255 scale), giving a curve that sags below the diagonal (curve shape shown f006570; the numbers are inferred from its position on the grid)
5. Copy both effects and paste them onto the other layers (said; menu path or shortcut not shown, so Edit > Copy / Edit > Paste or Ctrl+C / Ctrl+V is inferred)
   - By the end of the pass the two foreground branches, grass, both figures, wall, ledge, the tall pine and both bare trees (10 layers) carry the effects (shown f006948 for the first seven, f009621 for all ten)
   - The paste onto the pine and bare trees carries on just past the span's end: the pine's Effect Controls show Curves at about 116.3 s and a bare tree shows Tritone and Curves at about 117.3 s (cut from source.mp4, scratch/02/wgrid.png)
   - The city, the shape layer and the sky photo get no grade (shown f009621, no fx switch on those rows)
6. On the stone-wall layer only, raise Tritone's Blend With Original to 36.0% so it keeps some of its own colour; this is done on screen without comment (shown f006888; the value still reads 36.0% at f010901)
7. Switch off the Tritone effect (its fx eye in Effect Controls) on the stone-wall layer, leaving its Curves on, so the wall and its lamp keep their own colour. This happens off screen and is never mentioned: Tritone is on at f006888 and off at f010901 (shown both); when and why it was switched off is not shown
layout: measured on the result frame against the picture inside the crop (the whole comp view), as shares of its width (x) and height (y): the two figures stand together with their centre at about 43% x, about 32% of the picture height tall, feet about 75% down (measured); the ledge spans about 15%–59% x with its top about 71% down (measured); the pine stands at about 29% x, about 53% of the height tall, top about 20% down (measured); the lamp at about 66% x, 70%–80% down (measured); the stone wall at the right, about 79%–100% x, 34%–88% down (measured); bare trees frame the left ~30% and the right ~40% from the top edge (measured)
timing and easing: none given (a static grade, no keyframes)
variations: The midtone colour is chosen to suit your mood; blue is just the example (said). Curves is optional extra help (said).
pitfalls: none given
longest on: Setting up Tritone, about 21 s from the effect search to the Highlights dialog closing (f004822–f006104), of which about 9 s go to the midtone colour, which the narrator names the main control. Curves takes about 8 s (f006104–f006570) and the paste across layers about 6 s.
build notes: All scriptable. layer.property("ADBE Effect Parade").addProperty("ADBE Tritone"); set "Highlights" to [40/255,40/255,40/255,1], "Midtones" to [28/255,60/255,76/255,1], leave "Shadows" black and "Blend With Original" 0 (36 on the wall layer). Curves ("ADBE CurvesCustom") stores its curve in a hidden binary property that a script cannot set point by point; either apply a saved .ffx preset with layer.applyPreset(), or substitute Levels ("ADBE Easy Levels2", Gamma about 0.55 for a similar midtone drop), and note the substitution. For step 7 set the wall layer's Tritone effect .enabled = false (keep its Curves enabled). Loop over the scene layers instead of copy/paste, skipping the sky, city and any guide/shape layer.
result: start=155.22 end=155.42 still crop=722,288,1270,714 frame=f009318 (not a kept frame: cut from source.mp4 at 155.30 s, saved as scratch/02/result-155.30.png). This picture includes step 7 (wall Tritone off, warm lamp), which is not shown being done. The state at the end of steps 1–6 (wall graded, dull lamp, pine and bare trees not yet pasted) is f006948, but no clean view of it exists: inside 02's own span the viewer always shows an anchor icon or selection handles. This clean view of the fully graded flat layout appears at the start of the 3D chapter, right after a cut at 155.2 s, while the screen recording slowly zooms about 1% across the window.
before: f004437 (cut from source.mp4 at 73.95 s; the ungraded layout, same picture as technique 01's result)
unknowns: Whether the curve point was placed numerically (only the dragged shape is shown); when and why the wall layer's Tritone was switched off (between f006888 and f010901, off screen); whether the wall's 36% blend was meant as a step or a test before that switch-off; the exact Curves point on the other layers (assumed identical, as it was pasted); why the city and sky were left ungraded (not said).

## Flat cut-outs into a deep stage: push far layers back in Z, pull near ones forward, rescale to frame
id: 03-z-depth-push-and-rescale
status: unproven
source: il_OcNyqDOE 151.11–191.84 s
jobs: camera and 3D; depth and finish
what it does for a beat: Sets up real parallax and depth of field for a 2D illustrated scene: the picture through the default view barely changes, but layers now sit thousands of pixels apart, so any later camera move or focus pull separates them. Assumes: the scene is already split into one layer per object (technique 01) and graded (technique 02), with Tritone switched off on the stone-wall layer so its lamp glows warm (off at f010901).
what it looks like: The same blue night scene, framed almost as before: sky and skyline far behind, the two figures on the ledge in the middle, grass and two dark leafy branches large and close at the bottom and sides. The difference is structural (Z positions spread from about -1800 to about 7900), not yet visible as motion.
ingredients:
- 3D Layer switch — built-in; timeline switch column (shown f009621)
- Layer Transform: Position (Z), Scale — built-in
- No camera layer yet: the viewer reads "Active Camera (Default)", i.e. the composition's default camera (shown f009621)
steps:
1. Turn on the 3D Layer switch for every layer (said; shown f009621, all 13 rows switched on)
2. Push the farthest element, the sky photo, far back in Z: the narrator asks for 5000 or more (said)
   - Sky Position Z: 7940 (shown f009890; it passes 3690 on the way, f009808)
3. Scale that far layer back up until it fills the frame again (said)
   - Sky Scale: from 76.0% to 312.0% (shown f009932 for 76%, f010241 for 312%)
4. Pull the foreground elements toward the viewer, i.e. negative Z, and resize them for the framing you want (said; shown f010455, f010759, f011462)
   - Both foreground branches: Position Z -1700 at first (shown f010455), finally -1810 (shown f011462)
   - Both foreground branches: Scale 37.0% (shown f010699 for both, f010759); they pass 57% and 41/59% while being adjusted (f010538, f010639)
   - Grass: Position Z -830 (shown f011462)
   - Stone wall: Position Z -600 (shown f011462)
5. Leave the main subject at Z 0 (said)
   - Both figures: Position Z 0.0 (shown f011462)
   - Ledge they stand on: Position Z 0.0 (shown f011462)
6. Spread the remaining middle and back layers over a range of depths rather than one plane, the narrator stresses variety (said)
   - Tall pine: Position Z 1200 (shown f011239, f011462)
   - Both bare trees: Position Z 1770 (shown f011239)
   - One bare tree mirrored and enlarged: Scale about -146, 146, 146% (shown f011119 while still being dragged); the other bare tree stays at 100% (shown f011119)
   - City skyline: Scale 275.0% (shown f011059)
7. Switch the shape layer's 3D switch back off so it stays 2D; done on screen without comment (shown on at f009621, off at f011510)
   - Housekeeping, no effect on the picture: the Shy switch is turned on for every layer except the sky photo between f009621 and f010455 (still on at f011510); Hide Shy Layers is not used
layout: measured on the result frame against my crop (the comp view minus a thin top strip under the camera label, so y shares run from just below the picture's top edge), as shares of its width (x) and height (y): the two figures stand together with their centre at about 43% x, about 34% of the crop height tall, feet about 74% down (measured); the ledge spans about 1%–59% x with its top about 70% down (measured); the pine stands at about 30% x, about 61% of the height tall, top about 10% down (measured); the lamp at about 61% x, 63%–76% down (measured); the stone wall at the right, about 80%–100% x, 25%–88% down (measured); the dark foreground branches cover the left ~27% from the top down and the right ~43% from ~5% down (measured)
timing and easing: none given (static layout; nothing keyframed in this technique)
variations: Use whatever is furthest away (sky or other background) as the layer to push back (said). Vary the depths as much as the scene allows (said).
pitfalls: Pushing a layer back makes it smaller on screen, so it must be scaled up again (said). The shape layer is turned back to 2D without explanation (shown, reason unknown).
longest on: Pushing the sky back and rescaling it, about 10 s (f009681–f010267), stressed with the "5000 or more" figure; the foreground branches take about 9 s (f010287–f010819), turning layers 3D about 8 s, the remaining mid layers about 6 s.
build notes: All scriptable. layer.threeDLayer = true for each layer (skip any 2D guide/shape layer). Set "ADBE Transform Group" > "ADBE Position" to [x, y, z] and "ADBE Scale" to [s, s, s]. To keep a pushed layer the same apparent size through the default camera, multiply its scale by (zoom + z) / zoom, where zoom is the default camera's 2666.7 px for a 1920-wide comp (this formula is inferred, not given): the sky's 76% × (2666.7 + 7940) / 2666.7 ≈ 303%, close to the 312% used. Foreground layers were deliberately left bigger than that compensation would give (37% instead of about 19%), so they loom larger. Set Continuously Rasterize on .ai layers scaled above 100%.
result: start=187.60 end=187.95 still crop=798,370,1396,738 frame=f011268 (not a kept frame: cut from source.mp4 at 187.80 s, saved as scratch/03/result-187.80.png). The crop leaves out a thin strip at the top of the viewer where the "Active Camera (Default)" label sits and the viewer's right border; from 188.1 s hover outlines appear on the figures.
before: f009621 (graded, flat layout, all layers just switched to 3D, default camera)
unknowns: The X/Y repositioning of most layers (values change but are not discussed); the city's final Z (it reads 0 at f010999 while being edited); the grass and wall Scale; whether the composition's default camera or a specific view was used to judge framing (only "Active Camera (Default)" is shown); what the shape layer contains and why it is left 2D; Continuously Rasterize settings.

## Depth-of-field camera locked on the subject, with a slow dolly in
id: 04-camera-depth-of-field-focus-lock-dolly
status: unproven
source: il_OcNyqDOE 191.84–231.8 s
jobs: camera and 3D; depth and finish
what it does for a beat: Turns a staged 2D-in-3D layout into a filmed shot: near and far layers fall out of focus, the subject stays sharp, and a short push-in gives the opening beat life without any layer being animated.
what it looks like: Two small figures on a rocky ledge in a dark blue night scene; foreground branches, a distant tree line and city are soft while the figures stay crisp, and over three seconds the view creeps in towards them.
assumes: the layers are already 3D and spread out in Z (far scenery pushed back and scaled up, foreground pulled forward, the subject at Z 0), as in technique 03.
ingredients:
- Camera layer, Two-Node Camera, 50mm preset — built-in; Layer > New > Camera (path inferred; the Camera Settings dialog is shown f011824)
- Camera Options > Depth of Field, Aperture — built-in
- Set Focus Distance to Layer (layer right-click menu) — built-in
- Dolly to Cursor tool — built-in (tool active in the toolbar, shown f013733; named on screen with shortcut 3)
steps:
1. Add a camera layer to the comp. (said; Camera Settings dialog shown f011824)
   - Type: Two-Node Camera (shown f011824)
   - Preset: 50mm, giving Zoom 2666.7 pixels (39.6° H) in a 1920-wide comp (shown f011824 for the preset; zoom shown f012100)
   - Enable Depth of Field box: left unticked in the dialog (shown f011824); depth of field is switched on afterwards in the timeline (step 2)
2. Open the camera's Camera Options and set Depth of Field to On. (said; On shown f012100)
3. Raise the Aperture so out-of-focus layers blur more. (said)
   - Aperture: starts at the default 25.3 pixels (shown f012100), dragged up and landed at 80.3 pixels on the first pass (shown f012310); the final build uses 26.3 pixels (step 7)
   - Focus Area Width: 0.0; Near, Far Blur Level: 100.0, 100.0% (shown f012100, unchanged defaults)
4. Select the subject layer (the two-figure layer) together with the camera layer, right-click, and choose Set Focus Distance to Layer. (said; the two layers selected and the context menu open, shown f012588; the command's submenu position is off-screen, so the menu path is inferred)
   - Result: Focus Distance turns red (driven by an expression) and reads 2666.7 pixels, the distance to the subject (shown f012615)
5. At 0:00, set keyframes on the camera's Point of Interest and Position. (said; keyframes shown f012855)
   - Point of Interest: 960.0, 540.0, 0.0 (shown f012855)
   - Position: 960.0, 540.0, -2666.7 (shown f012855)
6. Move to 0:00:03:00 and push the camera in with the Dolly to Cursor tool, which records new keyframes on both properties. (said; first try shown f013167: Point of Interest 958.3, 542.6, 0.0, Position 958.3, 542.6, -1474.3, Focus Distance red 1474.3)
7. The author then redoes the shot with less blur, done on screen without a word: (shown)
   - Back at 0:00 the focus lock is gone — Focus Distance reads a plain white 2343.7 — and Aperture is being dragged down (shown f013303)
   - Aperture: 26.3 pixels, with Focus Distance red again at 2666.7, so Set Focus Distance to Layer has been applied again (shown f013433)
   - The 0:00 keys stay at Point of Interest 960.0, 540.0, 0.0 and Position 960.0, 540.0, -2666.7 (shown f013433)
   - So the final build order is: Aperture 26.3 → Set Focus Distance to Layer → keys → dolly (inferred from the order of f013303, f013433, f013733). The result was filmed at Aperture 26.3, not 80.3.
8. Dolly in again to the end key at 0:00:03:00. (shown f013733)
   - Point of Interest: 958.7, 542.0, 0.0 (shown f013733)
   - Position: 958.7, 542.0, -1749.5 (shown f013733)
   - Focus Distance follows automatically: 1749.5 pixels at 3:00, 2475.6 at 0:00:00:15 (shown f013733 and f013493)
9. Play it back: the shot dollies in and the figures stay sharp throughout. (shown, source 226.0–228.6 s)
layout: on the result frame f013610 (part-way through the push; the framing grows over the move): the two figures stand together from about 35% to 50% of the picture width, heads at about 41% and feet at about 80% of the picture height, so each figure is about 39% of the picture height tall (measured); the ledge's flat top sits at about 78% of the height and its front edge ends at about 62% of the width (measured); the lamp glows at about 64% across, 72–80% down (measured); a soft pine stands at about 20–33% across, from about 10% down (measured); a soft stone wall fills the right 10% (measured).
timing and easing: two keyframes on Position and Point of Interest, 0:00 and 0:00:03:00 in a 23.976 fps comp (shown f013733); the keyframe icons look like plain diamonds, i.e. linear, no ease (inferred from f013733).
variations: the aperture can be raised for heavier blur (said).
pitfalls: without linking focus to the subject, a moving camera lets the subject drift out of focus — that is the reason given for the focus lock (said, paraphrased).
longest on: the dolly keyframes and their playback, about 17 s (frames f012855 → f013610 plus playback to about 231 s), against about 11 s for creating the camera and setting depth of field (f011525 → f012180) and about 7 s for the focus lock (f012180 → f012615). The focus lock is the step the author stresses as the thing that keeps the subject sharp.
build notes: `comp.layers.addCamera("Camera 1", [960,540])` then set `cameraOption.depthOfField = 1`, `cameraOption.aperture = 26.3` (the value the result was filmed at), zoom 2666.7. "Set Focus Distance to Layer" is a menu command (Layer > Camera > Set Focus Distance to Layer — path inferred); by script, write the equivalent expression on `cameraOption.focusDistance`, e.g. `length(toWorld([0,0,0]), thisComp.layer("<subject>").toWorld(thisComp.layer("<subject>").transform.anchorPoint))` (inferred; the expression text After Effects writes is not shown). Keyframe `transform.pointOfInterest` and `transform.position` with `setValueAtTime(0, …)` and `setValueAtTime(3, …)`; the Dolly to Cursor drag itself is interface-only but only its resulting values matter.
result: start=226.0 end=228.6 animated crop=856,342,1482,830 frame=f013610
before: f011661 (the staged layers seen through the default camera, no blur)
unknowns: why the author lowered the aperture from 80.3 to 26.3 and redid the lock and keys (not said); keyframe easing (not set on screen); exact comp size (960, 540 centre suggests 1920×1080, inferred); the expression text that Set Focus Distance to Layer creates.

## Endless wind sway from two rotation keys and a ping-pong loop
id: 05-looping-wind-sway-rotation
status: unproven
source: il_OcNyqDOE 232.1–268.3 s
jobs: energy and impact; workflow
what it does for a beat: Gives a still illustrated scene a reason to move (wind) with almost no keyframing: each branch or tree rocks back and forth forever from just two keys.
what it looks like: Silhouetted foreground branches with leaves at the frame edges rock gently by about ten degrees, back and forth, while the rest of the night scene holds still.
assumes: separate 3D layers per scene element (technique 01/03) and, optionally, the camera from technique 04; nothing here depends on the camera.
ingredients:
- Layer Z Rotation keyframes — built-in
- Anchor Point (moved to the branch's base if needed) — built-in
- Expression `loopOut("pingpong")` — built-in
steps:
1. Pick the branch layer to animate. On a 3D layer the rotation that rocks it in the picture plane is Z Rotation. (said: rotate the branches and trees; Z Rotation used, shown f015110)
2. If the branch does not pivot from its base, move its anchor point there first, since rotation turns around the anchor. (said; the anchor move itself is not shown)
3. At 0:00 set a keyframe on Z Rotation. The branch already sat at 123.0° before any key, so the first key just records its existing rotation. (shown: 123.0° with no stopwatch on, f014693)
   - Z Rotation at 0:00: 123.0° (shown f015585 — the value at 0:00:00 with the loop already on, which equals the first key)
4. Move to 0:00:00:23 (23 frames, just under one second at 23.976 fps) and set a second key a few degrees further. (shown f015110)
   - Z Rotation at 0:00:00:23: 134.0° (shown f015110, landed; keys at 0:00 and 0:00:00:23 visible)
5. Add an expression to Z Rotation (the narrator's word is heard as "alter the stopwatch", read here as Alt-click on the stopwatch — inferred) and type `loopOut("pingpong")`. (said: use the loop out ping pong expression; typed text shown f015508)
6. Scrub or play: the branch now swings 123° → 134° → 123° … for the whole comp. (shown: 133.5° at 0:00:01:00, f015666)
7. Repeat on another branch with its own values. (shown, not spoken)
   - Second branch Z Rotation: already 64.0° before any key (shown f015585); first key at 0:00 at 64.0° (shown f015666)
   - Second key at 0:00:01:00, dragged to roughly 70° — the cursor covers the digits at every kept moment (shown, unread); no expression is seen being added to this second branch before the author moves on
layout: on f015643, measured inside the result crop (the build comp with the playhead at 0:00:00:22, part-way through the camera push): two leafy foreground branches, heavily blurred by the camera's depth of field, frame the shot — one up the left side (about 0–25% of the width, full height) and one across the upper right (about 65–100% of the width, top 41% of the height) (measured); the outline of the selected layer (the second branch, not the first swaying one) runs from its top handle at about 47% across, 2% down, towards about 72% across at the bottom edge (measured); the two figures stand at about 36–49% of the width, heads about 39% and feet about 77% down (measured).
timing and easing: two keys, 0:00 and 0:00:00:23 (shown f015110); swing 11°; ease not set on screen (keys look like plain diamonds, inferred); loop by `loopOut("pingpong")`.
variations: use it on trees as well as branches (said).
pitfalls: rotation turns around the anchor point, so a badly placed anchor makes the branch spin rather than sway (said, paraphrased).
longest on: the first branch, about 17.6 s from keyframing to the typed expression and a scrub (f014693 → f015748, 244.9–262.5 s); the finished-scene playback that opens the section runs about 9 s (232–241 s); the second branch about 4 s.
build notes: `layer.property("ADBE Transform Group").property("ADBE Rotate Z").setValueAtTime(0,123); …setValueAtTime(23/23.976,134); prop.expression = 'loopOut("pingpong")';`. For the anchor: set `ADBE Anchor Point` to the branch base and compensate Position so the art does not jump (by hand in the interface with the Pan Behind tool, or by script). Nothing here needs the interface.
result: no clean view of the sway alone exists. Best available for comparison: start=259.5 end=261.0 still crop=830,380,1450,760 frame=f015643 — not a playback but held frames at three playhead times in the build comp, with the loop on: 0:00:00:00 until about 260.4 s, then clicked to 0:00:00:22 (f015643), then to 0:00:01:00, with a jump between each; compare the branch angle at those three times. Not this technique in it: the selected second branch's outline and handles are drawn over the picture, technique 04's camera has moved the view between the three times, and the foreground branches are blurred by depth of field. The author's finished comp (236.0–237.6 s) also shows swaying branches but mixed with a large camera move, rain, leaf particles and the grade, so it is not usable as this technique's result.
before: f014693 (the branch layer selected in the build comp, at 123.0° with no keys)
unknowns: a clean view of the sway on its own (none exists in the video, see result); how the finished scene's branches were driven (keys plus loopOut, or something else); where the anchor point was placed; the second branch's second value and whether it got the loop expression. From about 262.5 s the first branch reads a plain 134.0° at 0:00:01:00 where it earlier read 133.5° from the loop (f015666) — whether its keys or expression were touched in between is not shown.

## Grass rippling in the wind with Wave Warp
id: 06-wave-warp-grass-wind
status: unproven
source: il_OcNyqDOE 268.3–289.2 s (preparation from about 264 s)
jobs: energy and impact; texture
what it does for a beat: Makes a field of many thin blades (grass, reeds, fur-like edges) move in the wind without animating a single blade: one effect, one setting, and it moves on its own.
what it looks like: A strip of dark silhouetted grass blades along the bottom of a night scene ripples sideways in a continuous soft wave while the camera dollies in.
assumes: the grass is its own layer (technique 01), already graded with the scene's Tritone and Curves (technique 02); the camera move from technique 04 is playing but is not needed.
ingredients:
- Wave Warp — stock; Effects & Presets search, found under Distort > Wave Warp (shown f016326)
steps:
1. Select the grass layer and, if useful, solo it to see the blades alone. (shown, not spoken: solo on, grass alone on black, f016016; solo off again f016096)
2. Find Wave Warp in Effects & Presets (search text "Wave wa") and drag it onto the grass layer in the timeline; it sits below the layer's existing Tritone and Curves. (said: try the Wave Warp effect; search and Distort group shown f016326; applied, shown f016443)
   - Wave Type: Sine (shown f016443, default)
   - Wave Height: 10 (shown f016443, default)
   - Direction: 0x +90.0° (shown f016443, default)
   - Wave Speed: 1.0 (shown f016443, default)
   - Pinning: None (shown f016443, default)
   - Phase: 0x +0.0° (shown f016443, default)
   - Antialiasing (Best Quality): Low (shown f016443, default)
3. Widen the waves — the one setting the author says to play with. (said)
   - Wave Width: 40 → 65 (said: change the wave width; 65 shown f016901, landed)
4. Duplicate the grass layer, possibly with other changes. (inferred) The video jump-cuts between source 281.75 s and 282.0 s; after the cut: (shown, source 282.0 s, not spoken)
   - the stack holds two grass layers next to each other where there was one
   - the tall tree layer has moved from above the two dead-tree layers to below them
   - a switch in the first switches column is now on for seven layers (both branches, both grass, both dead trees and the tall tree layer); which switch it is cannot be told for sure from the icon
   - the Effect Controls panel is empty and the viewer shows a different render
   The duplication itself, and whether the copy carries the same Wave Warp, is never shown; the playback in step 5 is of this changed state.
5. Play: the blades ripple continuously with no keyframes. (shown, source 282.6–284.6 s)
layout: on the result frame f017027 (one moment of the looping camera-push playback; the framing changes over the window): the grass is a dark fringe of blades along the bottom of the picture, about the lowest 12% of the height, easiest to see from about 60% to 100% across (measured); the ledge top, with its own tufts, runs at about 80–83% down from the left edge to about 64% across (measured); the two figures stand at about 33–50% across, heads about 41% and feet about 84% down (measured); the lamp glows at about 66–70% across, 80–90% down (measured).
timing and easing: none given; Wave Warp animates by itself from Wave Speed 1.0, no keyframes (no keyframe icons on the effect, shown f016901).
variations: Wave Width is the value to adjust (said); none else given.
pitfalls: none given.
longest on: dialling Wave Width, about 6 s (f016474 → f016819), and the playback afterwards, about 6 s (282.5–288 s); finding and applying the effect takes about 5 s (f016146 → f016443).
build notes: `layer.property("ADBE Effect Parade").addProperty("ADBE Wave Warp")`, then set "Wave Width" to 65; leave Wave Type Sine, Wave Height 10, Direction 90°, Wave Speed 1.0, Pinning None, Phase 0 (defaults). Duplicate with `layer.duplicate()`. Soloing (`layer.solo = true/false`) is only for looking.
result: start=282.6 end=284.6 animated crop=856,348,1528,856 frame=f017027
before: f016016 (the grass layer soloed, before Wave Warp)
unknowns: the duplication and the other changes in the jump cut at 281.75–282.0 s (tree layer reordered, a switch turned on for seven layers) are not shown being made or explained, and the result playback comes after them; whether the grass copy was offset, scaled or given different Wave Warp values; whether Pinning was meant to stay None (the layer's edges are free to move); the grass is small in the frame at the end of the dolly, so the ripple is hard to read in a single still — compare motion along the bottom strip over the window, not one frame.

## Leaves blown across the frame with textured particles
id: 07-leaf-particles-blown-across
status: unproven
source: il_OcNyqDOE 289.6–346.5 s
jobs: B-roll scenes; layout and repetition
what it does for a beat: Sells wind in an illustrated scene by sending a steady trickle of tumbling leaves across it from one side, without animating a single leaf by hand. Assumes a finished, graded 2D scene in a 3D comp with a camera (techniques 02–04) and the scene's Tritone plus Curves grade on a layer to copy from.
what it looks like: Two versions are on screen. At 289.8–291.8 s (f017447) the author first shows an already-finished scene comp with its own CC Particle World settings, then rebuilds the effect step by step in a working comp; the steps below follow the rebuild, and the finished example's values are given in step 13. In both, small dark-green leaves, graded to match the night scene, drift and spin from the left edge across a moody 2D landscape with two figures on a cliff, scattered over the whole frame at different sizes.
ingredients:
- a single leaf illustration (vector or PNG) as a layer in the comp — built-in (footage)
- Solid layer — built-in; Solid Settings dialog shown f017616
- CC Particle World — stock (Cycore); applied to the solid (shown f018716; how it was applied is not shown; the narration's "particle world" matches the screen)
- Tritone and Curves copied from another scene layer — stock (shown f020365, f020526)
steps:
1. Bring a leaf image into the comp as its own layer at the top of the stack (said; shown f017974)
   - Leaf layer Scale: changed from 45.0% to 31.0% (shown f018022 then f018104; probably irrelevant, see build notes)
2. Make a new comp-size solid and rename it for the particles (said "solid layer"; shown f017616, f017974)
   - Width x Height: 1920 x 1080, comp size (shown f017616)
   - Colour: any; it is replaced by the effect (inferred)
3. Apply CC Particle World to the solid (said; shown f018716)
   - Birth Rate: 2.0, left at default (shown f018716)
4. Under Particle, set the particle type to textured quads and point the texture at the leaf layer (said; shown f020862)
   - Particle Type: Textured QuadPolygon (shown f018362, f020862)
   - Texture Layer: the leaf layer (shown f020862; still None in f018362)
   - Rotation Speed 180.0, Initial Rotation 360.0, Rotation Axis Any Axis, Size Variation 50.0%, Max Opacity 75.0%, Color Map Birth to Death: left as found (shown f018362, f020862; not touched on screen, so likely defaults — inferred)
5. Switch off the leaf layer's visibility so only the particles show it (said; shown f018716, eye of the leaf layer is empty)
6. Move the producer to one side of the frame (said; shown f019169)
   - Producer > Position X: -0.82 (shown f019169)
   - Producer > Radius Y: 0.245 (shown f020309; not mentioned, it turns the emitter into a tall vertical strip so leaves enter along the whole left edge — inferred)
   - Radius X and Radius Z: 0.025, unchanged (shown f020309)
7. Raise Longevity so particles live long enough to cross the frame (said; shown f019169, f020309)
   - Longevity (sec): 26.30 first (shown f019169), later 28.70 (shown f020309)
8. Under Physics, set Animation to Twirl (said as the way to see the particles; shown f019882; changed from the default Explosive: menu open on Explosive, source 321.2 s; Twirl is the fifth entry, after Explosive, Direction Axis, Cone Axis, Viscouse; the untouched Velocity 1.00, Gravity 0.500, Extra 0.50 show with Twirl already set at f019346)
9. Lower gravity so leaves fly sideways rather than drop (said; shown f019882)
   - Gravity: 0.020 (shown f019882; dragged through -0.080 on the way, f019527 panel crop)
10. Tune Velocity and Extra until the drift looks right (said; shown f019882, f020309)
   - Velocity: 0.91 (shown f019882)
   - Extra: 0.80 (shown f020309; 1.02 in f019882 is mid-drag)
   - Inherit Velocity 0.0, Resistance 0.0, Extra Angle 1x +0.0°: unchanged (shown f019882)
11. Copy the scene's mood grade (Tritone, then Curves) from a scene element that already carries the technique-02 grade (here a branch layer) and paste onto the particle solid so the leaves sit in the same light (said; shown f020365 on the source layer, f020526 on the particle layer)
12. Adjust particle size under Particle (said; shown f020862)
   - Birth Size: 0.150 (shown f020862; 0.250 before, f018362)
   - Death Size: 1.500 (shown f020862; Birth Size lands about 346.7 s, f020800, Death Size about 347.7 s, f020862 — just after the technique's end; leaves grow as they age)
13. For reference, the finished example comp shown at the start uses different CC Particle World values; match these if you want the author's own final look rather than the rebuild (shown f017447)
   - Birth Rate 2.0; Longevity (sec) 30.00; Producer Position X -1.18, Position Y 0.00, Position Z 0.00; Radius X 0.025, Radius Y 1.365 (an emitter strip about as tall as the frame), Radius Z 0.025 (shown f017447)
   - Physics: Animation Twirl, Velocity 0.93, Inherit Velocity 0.0, Gravity 0.002, Resistance 0.0, Extra 1.16, Extra Angle 1x +0.0° (shown f017447)
   - Rebuild versus finished: Longevity 28.70 vs 30.00; Position X -0.82 vs -1.18; Radius Y 0.245 vs 1.365; Velocity 0.91 vs 0.93; Gravity 0.020 vs 0.002; Extra 0.80 vs 1.16. The finished example's Particle settings (type, sizes) were not shown in that frame.
layout: measured on scratch/07/result-349.95.png, as shares of the crop (the viewer picture minus a thin top strip, so close to the whole comp): the two figures stand side by side from about 33% to 50% of the width, each about 49% of the crop height tall, feet at about 86% down (measured); the cliff top sits at about 81% down (measured); leaves are specks about 1% of the crop width across, scattered over the upper two-thirds (measured); in this frame only a dozen or so leaves are in view (measured)
timing and easing: none given; the effect runs on its own from the solid's in-point, no keyframes shown.
variations: the author says to play with the physics values until the leaves fly across as wanted, and that size can be changed under the particle settings.
pitfalls: none given beyond the implied ones: with normal gravity the leaves just fall (said), and with short longevity they die before crossing (said).
longest on: the Physics tuning (Animation, Gravity, Velocity, Extra), about 320–334 s (~14 s, from opening Physics at the default Explosive through f019882), with Extra settling by f020309; next is the particle type and texture setup, about 300–312 s (~12 s).
build notes: Layer > New > Solid (comp size), then addProperty("CC Particle World"). Properties as shown in Effect Controls: "Birth Rate", "Longevity (sec)", group "Producer" ("Position X", "Radius X/Y/Z"), group "Physics" ("Animation" popup — Twirl, fifth menu entry (source 321.2 s; whether the script index counts the menu separators is untested, inferred); "Velocity", "Gravity", "Extra"), group "Particle" ("Particle Type" popup — Textured QuadPolygon; "Texture" > "Texture Layer" takes a layer index; "Birth Size", "Death Size"). The second Texture Layer dropdown reads "Sou..." (Source, shown f020862), so the leaf layer's own Scale should not affect the particles (inferred). Set leaf layer enabled = false. Copy Tritone/Curves by duplicating the property values from the graded layer onto the solid (Tritone colours and the Curves shape are given in technique 02). Popup index values must be checked against the installed CC Particle World.
result: start=349.9 end=350.05 animated crop=1000,440,1560,800 frame=f020997
before: source.mp4 at 288.5 s (the scene with no leaves; saved as scratch/07/before288.png)
unknowns: result caveat: the only clean stretch after the final sizes land is 349.9–350.05 s (frame f020997 cut from source.mp4 at 349.95 s, saved as scratch/07/result-349.95.png); it is short and shows few leaves, and a Layer menu covers the viewer from about 350.1 s. A longer stretch with the final values is 347.75–348.4 s with the same crop, but the particle layer is selected there, so its anchor crosshair sits near the right-hand figure (best frame: source 348.0 s); the earlier 342.5–346.4 s stretch has the old 0.250 sizes. At 348–349 s the author opens the Opacity Map graph; nothing visibly changes there. Also: how the leaf image was made or chosen; the solid's colour; whether Birth Rate, Rotation and Opacity values were ever changed (they look like defaults); Extra Angle, Floor, Direction Axis and Gravity Vector were not opened; leaf texture colour before the grade; the exact copied grade values (see technique 02).

## Rain slanted to match the wind
id: 08-rainfall-matched-to-wind
status: unproven
source: il_OcNyqDOE 346.7–360.4 s
jobs: B-roll scenes; texture
what it does for a beat: Adds weather on top of a wind-animated scene so the motion has a reason, with the rain leaning the same way everything else is blowing. Assumes a scene that already moves in one wind direction (techniques 05–07; here the leaves enter from the left edge).
what it looks like: Fine, faint white rain streaks over the whole night scene, slanted rather than vertical, layered over the drifting leaves and swaying trees.
ingredients:
- Adjustment layer — built-in; Layer > New > Adjustment Layer (shown, source 351.0 s)
- CC Rainfall — stock (Cycore); applied through the Effects & Presets search (search box in use f021099, inferred route; the effect first appears at about 353.8 s, f021228)
steps:
1. Make a new adjustment layer at the top of the comp (said; menu shown source 351.0 s; layer at the top f021099)
2. Apply CC Rainfall to it (said; shown f021311)
   - Drops: 5000, Size: 3.00, Scene Depth: 5000, Speed: 4000 (shown f021311, left at default)
   - Variation % (Wind): 0.0, Spread: 6.0, Color: white, Opacity: 25.0 (shown f021311, left at default)
   - Transfer Mode: Lighten, Composite With Original: on (shown f021311)
3. Set Wind so the drops lean the same way as the scene's wind (said; shown f021617)
   - Wind: 840.0 (shown f021617; dragged from about 355.5 s through -140.0 at 356.0 s, 840.0 by about 358.3 s)
layout: measured on f021557, as shares of the crop (the whole viewer picture minus its edges): the two figures span about 34% to 49% of the width, about 42% of the crop height tall, feet at about 83% down (measured); rain streaks are thin, faint lines about 5–7% of the crop height long, covering the whole picture, leaning only slightly from vertical (measured)
timing and easing: none given; the rain is not keyframed.
variations: the author offers rainfall as one example of weather; other weather effects are implied but not named.
pitfalls: the author stresses the one thing that matters: the rain's direction must agree with the wind direction already in the scene (said).
longest on: making the adjustment layer and applying the effect, about 351.0–355.2 s (~4 s), is slightly longer on screen than the Wind drag, about 355.5–358.3 s (~3 s); but Wind is what the author stresses as the most important part.
build notes: comp.layers.addSolid then adjustmentLayer = true (or Layer > New > Adjustment Layer by hand); addProperty("CC Rainfall"); set "Wind" to 840. All other properties as shown are the defaults. The layer is later renamed to a plain name for rain (seen in technique 10's frames). Positive Wind is assumed to push drops toward the right to match leaves travelling left to right (inferred, not stated).
result: start=357.9 end=359.5 animated crop=1000,380,1600,880 frame=f021557
before: f020862 (leaves without rain)
unknowns: whether positive Wind slants rain to the right in this version (direction not stated); whether any other CC Rainfall value was changed later.

## Small body shifts on a wide-shot figure with puppet pins
id: 09-puppet-pin-subtle-character-motion
status: unproven
source: il_OcNyqDOE 362.2–379.4 s
jobs: B-roll scenes
what it does for a beat: Keeps a still character from looking frozen in a wide establishing shot by nudging a few puppet pins, enough to read as breathing or shifting weight. Assumes the character is its own layer in the scene (technique 01), here already carrying the scene grade (technique 02).
what it looks like: A small dark silhouette of a standing figure on a cliff edge makes a slight shift of head, hips and one leg; at the shot's size the movement is barely noticeable, which is the point.
ingredients:
- Puppet Position Pin Tool — built-in; toolbar (shown f021996, highlighted)
- Puppet effect (added automatically by the first pin) — built-in (shown f022188 in the layer's Effects list)
- Layer panel — built-in; the character layer opened on its own (shown f021996, f022188)
steps:
1. Open the character layer in its Layer panel and pick the Puppet Position Pin Tool (shown f021996; not said)
   - Mesh Expansion: 3, Density: 10 (shown f021996, toolbar; defaults, not changed)
2. Click pins onto the figure: head, waist, both knees, both feet — six in all (said "puppet pin tool"; shown f022545)
   - Puppet Engine: Advanced (shown f022188)
3. Move some pins over time to make the subtle motion (said; shown f022545)
   - Pins are placed with the time indicator at 0:00:01:22, about 1.9 s (shown f021996, f022188, source 371.1 s)
   - The author then goes to 0:00:00:23, about 0.96 s, and moves pins there, giving second keys at that time (shown source 374.6 and 375.1 s); by then the first keys sit at 0 s (shown source 374.6 s; how they got there is not shown)
4. Select the second keys and drag them later, to about 1.43 s, so the move is slower (shown source 375.5 and 375.8 s, end state f022545; not said)
   - Pins with two Position keyframes (0 s and about 1.43 s, measured on the f022545 ruler): head, waist, one knee, one foot (shown f022545)
   - Pins with one keyframe at the start only, acting as anchors: the other knee and foot (shown f022545)
   - Second-key values on screen, Layer-panel pixels: head 569.1,89.1; waist 498.3,516.6; knee 610.3,749.7; foot 603.4,1001.1; anchors 468.6,761.1 and 475.4,969.1 (shown f022545)
layout: measured on frame f022617 (scratch/09/result-376.95.png), as shares of the crop, which is the whole viewer picture: the two figures span about 35% to 46% of the width, each about 30% of the picture height tall, feet at about 76% down (measured); the pinned figure is the left one (inferred from its spiky hair, matching the Layer panel)
timing and easing: two keys per moving pin, at 0 and about 1.43 s, after the second keys were retimed from about 0.96 s (shown source 375.1–375.8 s); ease not visible, keyframe icons look like plain diamonds (inferred linear). No loop shown, so after 1.43 s the pose holds.
variations: the author says simple motion is enough for a wide shot and to go further if wanted; nothing specific.
pitfalls: none given.
longest on: placing and dragging pins in the Layer panel, about 366–376 s (~10 s of the 17 s); the author stresses keeping it basic because the shot is wide.
build notes: ExtendScript cannot create puppet pins; placing them needs the Puppet Position Pin Tool by hand in the Layer or Comp panel. Once pins exist, their keyframes can be set by script under the Puppet effect: "Puppet" > "Mesh 1" > "Deform" > "Puppet Pin N" > "Position" (names shown f022545). Pin numbers follow click order: on screen pin 1 is the head and pin 6 a foot.
result: start=376.8 end=377.1 animated crop=810,270,1330,730 frame=f022617
before: f021996 (the figure in the Layer panel before pins are placed)
unknowns: the starting position of each pin (the reader's "New values" list is not tied to pin numbers); easing; whether the second figure was pinned too (only one is shown); how much each pin moved (the screen shows only end values; probably a few to a few tens of pixels, inferred). Result caveat: frame f022617 is cut from source.mp4 at 376.95 s (saved as scratch/09/result-376.95.png); the panels zoom before and after this 0.3 s window, and the panel timecode there reads 0:00:00:00, before the keys move anything. The pin motion cannot be judged in this crop; check a build by comparing pin values (f022545) instead.

## Film-stock grain and mood finish on a top adjustment layer
id: 10-film-grain-finish-stack
status: unproven
source: il_OcNyqDOE 379.6–414.2 s
jobs: depth and finish; texture; glow and colour
what it does for a beat: The last pass on an illustrated shot: real-film grain, one last overall curve, and an optional posterize for a rougher look, all in one layer over everything. Assumes the full scene is built beneath (techniques 01–09).
what it looks like: The rainy night scene gets fine colourless grain over the whole frame and slightly deeper midtones; with Posterize on, the tones become a little banded and gritty.
ingredients:
- Adjustment layer — built-in; Layer > New > Adjustment Layer (shown f023201, f023247)
- Add Grain — stock; Effects & Presets search, Noise & Grain group (shown f023371)
- Curves — stock; found by search (shown f023957)
- Posterize — stock; found by search, Stylize group (shown f024490 search; group seen in the search results at about 408 s)
steps:
1. Make an adjustment layer at the very top of the comp (said; shown f023201, f023247, f023566)
2. Apply Add Grain (said; shown f023371, f023566)
   - Viewing Mode: Final Output (said; shown f023566; dropdown open in f023450)
   - Preset: Kodak Vision 500T (5279) (shown hovered in the list f023535, landed and cut short as "Kodak Vision 50..." f023566); the author says to pick a favourite
   - Tweaking: Intensity, Size, Softness, Aspect Ratio all 1.000 (shown f023566, unchanged)
3. Under Color, tick Monochromatic so the grain carries no colour (said; shown f023957)
   - Tint Amount: 100.0%, Saturation greyed out (shown f023957; unchanged)
4. Add Curves below Add Grain for the overall mood (said; shown f024256, f024490)
   - RGB curve: one point near the middle pulled slightly down, about input 0.53 to output 0.47 (shown f024490; numbers read from the graph, inferred)
5. Optionally add Posterize for a gritty look (said; shown f024705, f024819)
   - Level: 14 (shown f024705, f024819; the default is 7, so it was changed; I did not check frames between applying it and f024705 for the change)
   - The author toggles its eye while comparing (inferred, mouse on the switch f024705); it is on at the end (shown f024819)
layout: measured on f024804 (scratch/10/result-413.4.png), as shares of the crop, which is the whole viewer picture: the two figures span about 36% to 46% of the width, about 27% of the picture height tall, feet at about 72% down (measured); the grain is a fine, even texture over the whole frame, specks about one pixel at this size, too small to measure (measured)
timing and easing: none given; no keyframes.
variations: any grain preset (said); Curves to taste (said); Posterize is optional and part of the author's own style (said).
pitfalls: the author prefers no colour in the noise, hence Monochromatic. Not said but true of Add Grain: in Preview viewing mode it shows grain only in a small preview box, so Final Output is needed to see it on the full frame (inferred).
longest on: Add Grain setup, about 384–399 s (~15 s: new layer, applying, Viewing Mode, preset, Monochromatic); Posterize about 405–413 s (~8 s); Curves about 399–405 s (~6 s).
build notes: comp.layers.addSolid with adjustmentLayer = true, moved to index 1. addProperty("ADBE Add Grain"): "Viewing Mode" popup (Final Output, third item in the list f023450), "Preset" popup (Kodak Vision 500T (5279) is the 8th entry after [None] in f023535; check the index), "Color" > "Monochromatic" = true. addProperty("ADBE CurvesCustom"): the curve shape cannot be set by ordinary scripting, so set it by hand or apply a saved .acv/.ffx preset. addProperty("ADBE Posterize") with "Level" = 14. Effect order on the layer: Add Grain, Curves, Posterize.
result: start=413.25 end=413.7 animated crop=880,340,1450,800 frame=f024804
before: f022681 (the same view before the finishing layer: rain and leaves, no grain)
unknowns: the exact Curves point; whether Posterize stays on in the final render; whether any Add Grain Application or Animation values were changed (not opened). Result caveat: frame f024804 is cut from source.mp4 at 413.4 s (saved as scratch/10/result-413.4.png); the comp is playing with the camera dolly, and the adjustment layer is deselected only in this short window.

## Long-lens close-up that matches the wide shot
id: 11-matching-closeup-telephoto-compression
status: unproven
source: il_OcNyqDOE 414.2–453.4 s
jobs: camera and 3D; depth and finish; B-roll scenes; workflow
what it does for a beat: Assumes a finished wide scene already exists with separate 2D layers, a cold grade on each (Tritone + Curves, technique 02), a 3D camera with depth of field (04), sway on trees (05), rain and finishing adjustment layers (08, 10). Cut from an established wide scene to a close-up of the character without building a new world: reuse the wide shot's backdrop pieces, camera and finishing layers, and push the backdrop very deep so the close-up reads as shot on a long lens.
what it looks like: A head-and-shoulders anime-style girl fills the frame, sharp; behind her a dark pine silhouette, a distant city skyline and a stormy blue sky sit far back, soft and large, under falling rain and the same cold, desaturated grade as the wide shot.
ingredients:
- new composition for the close-up — built-in
- recycled layers from the wide scene (sky, distant city, one tree) — built-in, copied across
- 3D layer switch on every layer that should sit in depth — built-in
- camera with Depth of Field on — built-in; Layer > New > Camera (inferred, the camera arrives already made)
- Tritone + Curves grade on the new character layer, later replaced by the finished example's pasted stack (Tritone, Curves, Cartoon switched off, Tint) — stock; Edit > Copy / Paste of effects (inferred, not shown)
- grain adjustment layer with Add Grain (eye off here) — stock
steps:
1. Make a separate composition for the close-up and bring in only the backdrop pieces worth reusing: the sky, the far city, a tree (said; at f025396 the new comp holds a cloud sky, a city image and the character image; a long tree is added by f025695, crop scratch/11/tl025695.png)
2. Add the close-up character image above them (shown f025396: a front-facing anime girl, head and shoulders)
3. Rearrange the reused pieces so the new framing makes sense, rather than copying their wide-shot positions (said)
   - City layer Scale: 679.0% (shown f025396)
   - City layer Position: 1620.0, -1015.0, 4730.0 (shown f025920)
   - Tree layer Scale: 334.6% (shown f025695, crop scratch/11/tl025695.png)
   - Tree layer Position, first placing: 129.9, 2613.3, 1500.0 (shown f025755), then -126.1, 2154.3, 1500.0 (shown f025920)
4. Bring the wide scene's camera, rain layer and grain adjustment layer into the close-up comp (shown: at f025920 the comp has no camera and the viewer reads "Active Camera (Default)"; by f026330 it holds a camera, a rain layer and a grain adjustment layer. How they were brought over is not shown; copy and paste from the wide comp is inferred)
   - The grain adjustment layer carries Add Grain: Viewing Mode Final Output, Preset Kodak Vision 32... (name cut off on screen), Intensity, Size, Softness, Aspect Ratio 1.000, Monochromatic on, Tint Amount 100.0% (shown f026047, crop scratch/11/prow.png)
   - Its eye is off in this comp, so it does not change the result (shown f026330, f027881)
5. Keep depth of field on the camera (said); camera options as shown f026330:
   - Zoom: 2666.7 pixels (39.6° H) (shown f026330)
   - Depth of Field: On (shown f026330)
   - Focus Distance: 2343.7 pixels (shown f026330)
   - Aperture: 25.3 pixels — scrubbed on screen at 436 s and lands at 25.3 (shown f026330; the value is hidden under the cursor at f026167)
   - Focus Area Width: 0.0; Near, Far Blur Level: 100.0, 100.0% (shown f026330)
6. Turn on the 3D switch for the character layer (shown, unsaid: the 3D box is empty at f025920 and filled at f026330; crop scratch/11/d.png). Its Z position is not shown.
7. For the close-up, push the backdrop pieces much further back in Z and then scale them up to fill the frame again (said). The tree goes from Z 1500 to Z 4170 (shown f026330: Position -946.1, 2154.3, 4170.0). The text reader later drops the minus sign (reads 946.1); the tree stays on the left of frame, so -946.1 holds (inferred). Whether the tree was re-scaled after the push is not shown.
8. First grade on the character: Tritone + Curves (shown f025920: Tritone Highlights mid grey, Midtones dark slate, Shadows black; Curves with the RGB line pulled down in the lower half). Blend With Original is scrubbed (the cursor is still on the value at 35.0% at f025920) and lands at 21.0% (shown, cut frame at 447.0 s, crop scratch/11/p447.0.png)
9. Replace that first grade by pasting the finished example's whole character effect stack onto the new character (shown, unsaid: between 447.0 and 448.0 s the stack changes in one step, crops scratch/11/p447.0.png and p448.0.png; the finished example's character carries the same stack at f026631; copy and paste is inferred). After the paste:
   - Tritone Highlights: white; Midtones: slate blue; Shadows: black; Blend With Original: 32.0% (shown f027881)
   - Curves RGB: a deep sag — black point at 0,0, one point at about input 56% / output 9%, white point at input 100% / output about 36% (shown f027107, crop scratch/11/crv.png; positions are our reading of the graph). The white point sits between the 25% and 50% grid lines on the f027107 crop, so about 36% (a checker's reading of about 75% does not match this crop)
   - Tint Map Black To: black; Map White To: white; Amount to Tint: 72.0% (shown f026918)
   - Cartoon is present but its eye switch is off, so it does nothing (shown f026918, crop scratch/11/cartpair.png); its values: Render Fill & Edges, Detail Radius 9.2, Detail Threshold 0.0, Shading Steps 16.9, Shading Smoothness 59.6, Edge Threshold 4.51, Width 1.1, Softness 0.0, Opacity 100% (shown f026918)
layout: on the result crop, the face (brow to chin) spans about 37–63% of the width, centred at 50%, eyes at about 33% of the height, chin at about 70% (measured); hair spans about 18–82% of the width and runs off the bottom (measured); the pine silhouette fills about 0–22% of the width on the left and runs off the top (measured); the city skyline is a faint band at the right edge, about 85–100% of the width, 55–75% of the height (measured); grid in scratch/11/layout.png. The crop trims the top of the picture to avoid the viewer label.
timing and easing: none given for this technique. The tree carries a Z Rotation keyframe (0x+0.9°) from the earlier sway animation (shown f026107).
variations: the narrator says the reused pieces depend on your scene (sky, background city, trees in this case); any layers can be recycled to save time.
pitfalls: do not forget the camera and its depth of field in the new shot (said).
longest on: rearranging the reused backdrop layers inside the new close-up comp (scale and position of city and tree, about 420–429 s, roughly 9 s), then the camera depth of field and the deep Z push (about 432–439 s, roughly 7 s), then looking at the finished example and pasting its character grade (about 440–449 s, roughly 9 s, split across two comps). The narration stresses the deep-Z-then-scale-up idea, likening it to an 85 to 100 mm lens.
build notes: Script: comp.layers.add for each reused footage item; layer.threeDLayer = true for backdrop and character; set Transform > Position [x,y,z] and Scale; add camera via comp.layers.addCamera, then Camera Options > Depth of Field = 1, Focus Distance, Aperture, Zoom. A layer pushed back in Z by a factor k must be scaled about k times larger (relative to camera distance) to keep its framing; the video gives the end values, not the formula. Effects: "ADBE Tritone", "ADBE CurvesCustom" (curve points cannot be set by property value from script without preset/.ffx), "ADBE Tint" (Amount to Tint 72). Copying layers between comps is by hand or by script (copyToComp). The demonstrated comp is a simplified rebuild; the finished close-up shown at 440–445 s (f026631) has many more layers (branches, a dead tree, a second character layer, a camera parented to a null, several adjustment layers). The result window falls just after the technique's spoken stretch, while the same arrangement is still on screen before the hair work starts.
result: start=464.2 end=464.9 still crop=816,370,1336,696 frame=f027881
before: f024954 (the wide establishing scene with two small figures under a stormy sky)
unknowns: the character layer's Z position and scale; the sky layer's position and scale; whether the tree was scaled again after its Z push; how the camera, rain and grain layers were brought into the new comp; camera position and point of interest; comp size; exact hex values of the Tritone colours; how the effect stack was copied.

## Wind in a still character's hair
id: 12-isolated-hair-wave-and-puppet
status: unproven
source: il_OcNyqDOE 453.7–518.4 s
jobs: B-roll scenes; energy and impact; workflow
what it does for a beat: Assumes a single flat character image already placed and graded in a close-up comp (technique 11). Gives a still illustrated character life in a close-up by letting only the hair drift, without a rigged model.
what it looks like: A front-facing anime girl with long wavy hair; the hair is cut out on its own layer and gently warped and pinned so it moves slightly, while the face and body stay still; a skin-coloured patch behind the face covers any gap the moving hair opens.
ingredients:
- Pre-compose — built-in; right-click the layer > Pre-compose... (Ctrl+Shift+C), context menu shown f028038 (crop scratch/12/menu.png)
- Quick Selection Tool (Layer panel), which adds the Object Matte effect — built-in (Object Matte Version 4.0 shown f028881; it needs a recent After Effects release that has these tools, inferred)
- Wave Warp — stock; Effect > Distort > Wave Warp (Distort category shown in Effects & Presets f029549)
- Puppet Position Pin Tool / Puppet effect — built-in
- Solid layer with a pen mask — built-in; Layer > New > Solid (inferred; Solid Settings dialog shown f030544)
steps:
1. (Optional) look for a character pack with several angles of the same character (said; a stock site of character sets is on screen 453–459 s)
2. Pre-compose the character layer (said); in the dialog choose "Leave all attributes" so the grade stays on the outer layer (shown, crop scratch/12/precomp308.png from f028308; the menu entry is shown f028038)
   - New composition name: given a new name while typing (shown f028308); the resulting comp is the image's own size, 2752 x 1536, 15:00, 23.976 fps (shown f028547)
3. Open the new comp, open the character layer in the Layer panel and pick the Quick Selection Tool from the toolbar flyout (shown f028547; the flyout lists Object Matte Tool, Quick Selection Tool, Selection Brush Tool, Refine Edge Tool, all Alt+W)
4. Paint over the hair to select it (said; shown f028881 — pink outline around the hair in the Layer panel); hold Alt and paint to take away parts you do not want (said; the Alt strokes themselves are not clearly visible)
   - This adds an Object Matte effect: Version 4.0, Feather 5.0, Contrast 80.0%, Shift Edge 0.0%, Reduce Chatter 0%, Fine-tune Object Matte on, Render Refine Edge on (shown f028881)
   - Result: hair alone on black, with a small sliver of neck/skin left in (shown, cut frame scratch/12/f029160.png at 486.0 s); the author admits the cut is rough (said)
5. Duplicate the layer (said; Ctrl+D inferred; two copies shown, scratch/12/inv487.5.png)
6. On the lower copy, tick Object Matte > Invert Foreground/Background so it shows everything except the hair (said; shown, cut frame scratch/12/f029340.png at 489.0 s: layer 2 selected, box ticked, whole character visible)
7. On the upper (hair) copy, raise Object Matte Feather to 18.4 (shown f029384, unsaid)
8. Drag Wave Warp onto the hair layer (said; shown f029549 dropping it on layer 1)
   - Wave Type: Sine (shown f029724 crop scratch/12/ww029724.png)
   - Wave Height: 2 (shown, read from crop scratch/12/ww029724.png)
   - Wave Width: 300 (shown; changed from 40 at f029656 to 300 at f029724)
   - Direction: 0x +90.0°; Wave Speed: 1.0; Pinning: None; Phase: 0x +0.0° (shown f029724)
9. With the Puppet Position Pin Tool, place pins over the hair and move them a little over time (said; shown f030222: ten pins along the outer hair and fringe, keyframed)
   - Puppet Engine: Advanced; Mesh Rotation Refinement: 20 (shown f030222)
   - Toolbar: Expansion 3, Density 10 (shown f030222)
   - Pin keyframes at 0 s on all pins, at about 1 s on some pins and at 0:00:02:07 on all (shown f030222); example pin values at 2:07: 1952.0,461.7; 731.4,676.6; 1995.4,939.4; 1789.7,1126.9; 909.7,1245.7; 672.0,1250.3 (shown f030222)
   - Keep the motion very small (said)
   - In the effect stack Puppet sits above Wave Warp (shown f030222)
10. Make a solid the colour of the skin to hide the gaps the moving hair opens (said)
   - Solid Settings: 2752 x 1536 px, comp size, Square Pixels (shown f030544)
   - Colour picked with the eyedropper from the face (shown f030544, dialog still open); the solid's label swatch after OK is a pale peach, about #FAD3A1 (shown f030724, crop scratch/12/sw.png; hex is approximate, sampled from compressed video)
11. Place the solid at the bottom of the stack and draw a pen mask so it only fills the face area behind the hair (said: use the pen tool to mask it in; shown f030724: solid as layer 3 below both character copies, a mask outlining the face from the fringe down to the chin and collar)
12. Go back to the close-up comp, where the pre-comp now stands in for the character (shown f030844)
layout: on the result crop, the face (brow to chin) spans about 37–63% of the width, centred at about 50%, eyes at about 42% of the height, chin at about 78% (measured); hair spans about 22–83% of the width and runs off the top and bottom (measured); the pine silhouette fills about 0–25% of the width on the left (measured); grid in scratch/12/layout.png.
timing and easing: puppet pin keys at 0 s, about 1 s and 2:07 (23.976 fps comp); no easing shown. Wave Warp moves on its own at Wave Speed 1.0.
variations: the author says other routes are better (a proper rigged model or a multi-angle character pack); this one is a stopgap.
pitfalls: keep the puppet motion subtle (said); the method leaves visible seams that must be hidden with the colour-matched solid (said); be tidier than the author when selecting the hair (said).
longest on: isolating the hair with the Quick Selection Tool and Object Matte, then duplicating and inverting (about 475.8–490 s, roughly 14 s); next the puppet pins (about 496.6–506 s, roughly 10 s). The narration stresses the puppet pins as the key part.
build notes: Pre-compose by script: comp.layers.precompose([idx], name, false) (false = leave attributes). The Quick Selection / Object Matte stroke is painted by hand in the Layer panel; it cannot be scripted. Fallback by script: duplicate the layer, draw a hand-made mask around the hair on the top copy and the same mask Subtract on the lower copy. Wave Warp: "ADBE Wave Warp" (Wave Type Sine, Wave Height 2, Wave Width 300, Direction 90, Wave Speed 1). Puppet: the pins are placed by hand with the Puppet Position Pin Tool; scripting pin creation is not supported, but existing pin positions can be keyed via script. Solid: comp.layers.addSolid([0.98,0.83,0.64], name, w, h, 1), moveToEnd(), add a mask via layer.Masks.addProperty("ADBE Mask Atom").
result: start=515.2 end=515.5 still crop=884,332,1420,790 frame=f030930
before: f027881 (the close-up with the still character, before pre-composing)
unknowns: the exact painted hair selection and the Alt subtractions; whether Reduce Chatter 50% on the refine edge was set deliberately (it appears at 488 s, inv488.0.png); the solid's mask shape, feather and whether the solid was dragged down or created there; the puppet pins' starting positions and the about-1 s values; how the hair actually moves: the hair motion is never played back on screen (the comp time display holds 2:07 in the pre-comp and 0:00:02:23 in the close-up through the result window; only rain noise and render refresh change), so a build can only be compared with a held frame; the result frame f030930 is cut from source.mp4 at 515.5 s and saved as scratch/12/f030930.png. The finished example's character (a separate 1920 x 1080 pre-comp used twice) may have been built differently; its insides are not shown.

## Side-light a face with a matted Curves layer
id: 13-masked-curves-relight-track-matte
status: unproven
source: il_OcNyqDOE 518.45–539.7 s
jobs: shadows and light; glow and colour; depth and finish
what it does for a beat: Assumes a close-up with the character on its own layer (or pre-comp) under a scene grade (techniques 11 and 12). Adds a soft wash of differently coloured light to one side of the face and hair only, so a flat close-up gains a light direction without touching the background.
what it looks like: The right side of the girl's face and the hair falling on that side (frame right) take on a cool green-cyan, slightly brighter tint, fading softly toward the centre of the face; the sky, tree and city behind her are unchanged.
ingredients:
- Adjustment layer — built-in; Layer > New > Adjustment Layer (inferred, not shown)
- Curves — stock; Effect > Color Correction > Curves (inferred path)
- Pen tool mask — built-in
- Track Matte (Alpha) — built-in; timeline Track Matte column
steps:
1. Add an adjustment layer (said) at the top of the close-up comp (shown f031263: layer 1, above the camera)
2. Apply Curves to it and shape a different look (said)
   - RGB: one point raised above the diagonal at about input 40% to output 48% (shown f031546; point position is our reading of the graph, crop scratch/13/curvespair.png)
   - Red: one point pulled below the diagonal at about input 55% to output 42% (shown f031674; same crop), which brightens a little and pushes the area toward cyan-green
3. With the pen tool, draw a mask on the adjustment layer around one side of the character's face (said; shown f031986: a closed path down the frame-right side of the face and hair, running off the top and bottom of the frame)
   - Mask mode: Add, not inverted (shown f032106)
4. Set the adjustment layer's Track Matte to the character layer so the look lands only on her (said; shown f031986: Track Matte set to the character pre-comp, layer 5)
   - Matte type: Alpha, not inverted (shown, crop scratch/13/tm.png from f031986)
5. Feather the mask heavily (said); Mask Feather: 143.0, 143.0 pixels (shown f032106)
layout: on the result crop, the face (brow to chin) spans about 37–63% of the width, centred at 50%, eyes at about 35% of the height, chin at about 75% (measured); the cool side light covers the frame-right cheek and hair from about 52% to 82% of the width, full height, fading out toward 48% (measured); grid in scratch/13/layout.png.
timing and easing: none given; the relight is static.
variations: the narrator suggests it for close-ups; the look inside Curves is free (said: make a different look).
pitfalls: remember to feather the mask (said).
longest on: drawing the pen mask and setting the matte (about 528.9–533 s, roughly 4–5 s); making the adjustment layer and applying Curves (518.5–524 s) and shaping the curves (524.6–528 s) take similar stretches.
build notes: Script: comp.layers.addSolid at comp size, then set adjustmentLayer = true. Effect "ADBE CurvesCustom": curve points cannot be set from script directly; apply a saved .ffx preset or use a substitute such as "ADBE Easy Levels2"/Levels (Individual Controls) with Red gamma lowered and RGB gamma raised. Mask: layer.Masks.addProperty("ADBE Mask Atom"), set maskShape vertices, Mask Feather [143,143], Mask Mode ADD. Track matte: in After Effects 2023+ use layer.setTrackMatte(characterLayer, TrackMatteType.ALPHA); the matte layer stays visible.
result: start=535.25 end=535.5 still crop=930,400,1440,760 frame=f032118
before: f031263 (the close-up with the new, still empty adjustment layer)
unknowns: exact Curves point values (read off the graph only); green looks untouched (in the Red view its line runs on the diagonal with no point, f031674); blue is not shown; mask vertex positions; whether the mask was drawn before or after the matte was set (both are in place at f031986); the result frame f032118 is cut from source.mp4 at 535.3 s and saved as scratch/13/f032118.png. The time display reads 0:00:02:06 throughout, so the result is a still.

# Keying and compositing a green screen

How to key green-screen footage in After Effects through Comp Room, and how to tell from numbers whether the key is good. For cutting a person or object out of footage with or without a green screen, see [Cutting a subject out with Object Matte](#cutting-a-subject-out-with-object-matte) at the end: it needs one click from the user. The method is: measure, change one thing, measure again. Every step below names the call that does it.

The tools:

- `ae_render_frame` with `screen: true` measures the screen in the un-keyed source.
- `ae_render_frame` with `edge: true` measures a matte: shares, edge width, holes, specks, patches, spill and, with `times`, flicker.
- `ae_render_frame` with `sample`, `channels`, `over`, `isolate` and `times` reads colours, shows the matte and lays the key over a test colour.
- `ae_render_frame` with `diff` (with `times`) or `strip` measures how the picture changes from frame to frame and flags pops, stutters and cuts; `render.preview` (through `ae_do`) renders a quick movie to watch at speed.
- `key.keylight` adds or updates Keylight from measured values and reads every setting back.
- `key.view` switches Keylight's view and reports the previous one.
- `key.cleanup` adds Key Cleaner and Advanced Spill Suppressor after Keylight.
- `mask.get` reads masks back; `mask.add`, `mask.set_path` and `mask.set_props` change them.
- `effect.describe` lists any effect's properties with their ranges before you write them.
- `subject.prepare`, `subject.status` and `subject.settings` cut a subject out with After Effects' Object Matte, around one click by the user (last section).

## Facts that are easy to get wrong

These were measured in After Effects 2027 on a real shot (an 8 bpc project with no working space). They hold for that setup; colour-managed and 32 bpc projects have not been checked.

1. **A capture's RGB is laid over the comp background.** `saveFrameToPng` writes captured = colour × alpha + background × (1 − alpha). A half-transparent pixel reads half background. Sample opaque pixels, or use `channels: "rgba"` (straight colour) or `over`. `screen` measures opaque pixels only, and `edge` takes the background out before it reads spill.
2. **Keylight despills its own output.** On Final Result the soft edge has already had its green removed, so `edge`'s spill reading on a keyed render does not show a screen left partly opaque. Read the screen's colour and evenness from the source (Keylight View `source`, or the key off). Read the key's quality from the alpha (`edge` shares, width and patches), not from its colour.
3. **A wide feathered garbage mask reads as a soft patch.** A mask with a 24 px feather made a 40 to 60 px partly transparent band that `edge` reports as a patch. Measure the key before the masks as well as the final alpha (see step 4). `mask.get` shows each mask's feather. On the measured shot the key before its masks read partial share 0.024, typical width 6 px (p90 68, worst 91), with a patch at the chair (215 × 297 px, 91 px thick) and one at the lower left: the chair remnant was a key problem, and the soft band low in the masked result was the mask's feather.
4. **Real screens are uneven.** The measured shot's screen, 200 × 200 px squares with the key off:

   | | left | | | right |
   |---|---|---|---|---|
   | top | (0.21, 0.37, 0.24) | (0.24, 0.43, 0.29) | (0.27, 0.47, 0.32) | (0.29, 0.49, 0.33) |
   | below | (0.25, 0.42, 0.29) | (0.30, 0.49, 0.34) | (0.34, 0.54, 0.38) | (0.36, 0.56, 0.40) |

   Green runs from 0.37 at the top left to 0.56 on the right, a 1.5x range, and lower down the right side it fell to (0.17, 0.28, 0.21). One Screen Colour cannot fit all of it.
5. **A stored or house key does not transfer.** On that shot the house values (Screen Colour (0.255, 0.576, 0.325), Screen Gain 105, Clip Black 12, Clip White 85) left the screen about a third opaque: `edge` read partial share 0.236, typical width 48 px and one frame-sized patch at mean alpha 0.35. The key set from measurement (Screen Colour (0.31, 0.505, 0.35), Screen Gain 124, Clip Black 40, Clip White 76, Screen Shrink/Grow −0.6, Screen Softness 0.6, Screen Pre-blur 0.5, Despot Black 2) read partial share 0.040, typical width 7.1 px, and edge flicker 0.02 to 0.04 mean alpha change per frame pair. Those numbers belong to that shot. Measure every new shot.
6. **The skin tone did not shift.** The subject's forehead read (0.67, 0.46, 0.50) in Source, Corrected Source, Intermediate Result and Final Result, so on that shot Keylight did not change the subject's colour.
7. **Keylight's views by number.** After Effects does not give scripts the names; these were confirmed by rendering each. `key.view` takes the names.

   | number | name | what it shows |
   |---|---|---|
   | 1 | `source` | the footage with the layer's masks applied, screen still green |
   | 2 | `source_alpha` | the mask shape only |
   | 3 | `corrected_source` | the subject over black, despilled |
   | 4 | `colour_correction_edges` | a thin outline of the edge |
   | 5 | `screen_matte` | the key's own matte, before the layer masks, written in grey RGB with alpha 1 everywhere (read it with `edge: { from: "luma" }`) |
   | 6 | `inside_mask` | Keylight's inside mask (black when none is set) |
   | 7 | `outside_mask` | Keylight's outside mask (black when none is set) |
   | 8 | `combined_matte` | the screen matte combined with the masks |
   | 9 | `status` | white solid, black clear, grey partly transparent; colours where the screen or foreground colour was changed |
   | 10 | `intermediate_result` | keyed, without Keylight's own despill and colour correction |
   | 11 | `final_result` | the default |

8. **Keylight's Screen Matte view is a picture, not an alpha.** Its capture holds the matte in RGB (screen 0, forehead 1, the chair remnant 0.60) with alpha 1 at every pixel, so plain `edge` reads it as fully opaque. Ask `edge` to read the matte from luminance: `edge: { from: "luma" }`. That gives every matte number and flicker, but no spill reading (there is no subject colour in a matte view). Only view 5 was measured; Combined Matte (8) is very likely the same, so check `shares` before trusting it.
9. **A layer's alpha can only be measured on its own.** Over a plate, the comp's alpha is 1 everywhere. Use `isolate: "<keyed layer>"` on every `edge` and `screen` render.
10. **`edge` reports a patch as one box.** A long soft band gets a box covering most of the frame. Each patch also has `thickest` (the deepest point and the band's thickness there) and `densest` (the window holding most of it): look there, not at the box. On the measured shot the band under the masks read thickest 53 px, and the chair patch 35 px.
11. **Clean-up effects do not always help.** On the measured shot, Key Cleaner and Advanced Spill Suppressor at their defaults (Keylight on Intermediate Result) made the numbers worse: partial share 0.040 to 0.050, typical edge width 7.1 to 15.1 px, 23 holes and 21 specks, edge flicker 0.030 to 0.043. With Reduce Chatter on, the width was 19.6 px and flicker 0.033. By eye over magenta they kept more fine hair and smoothed the chair edge but added a wider soft halo. The skin tone did not change. Measure before and after, and keep clean-up only where it helps (step 6).
12. **Measuring the screen worked.** With the masks on, `screen`'s near-subject colour, (0.306, 0.502, 0.353), came within 0.005 of the colour found by hand, and keying from it gave the hand-tuned matte numbers (partial 0.0397, typical width 7.12 px). With the masks off the whole screen read median (0.271, 0.459, 0.318), level ratio 2.63, brighter to the right and darker towards the bottom (horizontal 1.60, vertical 0.616, read at the frame's edges by the first version of `screen`). Each `screen` call took about 2.5 s on a 1080 × 1920 frame.

## The procedure

Work on a held frame first, then check several. Keep a short log of each change and the numbers it gave.

### 0. Inspect

Read what is there before changing anything: `ae_layer_info` on the keyed layer, `effect.list_on_layer`, and `mask.get`. If Keylight is already on the layer, `key.keylight` with no settings reads its values. Note the view so you can restore it.

### 1. Measure the screen from the source

Put Keylight on `source` (`key.view { view: "source" }`, keep `previous`) or work before any key exists. Then:

```
ae_render_frame { compNameOrId, time, outPath, isolate: "<layer>", screen: true }
```

Read:

- `screen.screen`: green or blue. Null means no screen was found; do not key blind.
- `screen.share` and `screen.bounds`: how much of the frame is screen, and where.
- `screen.colour.nearSubject.colour`: the screen just outside the subject. This is where the key has to work, so it is the first Screen Colour to try. `colour.median` is the whole screen's.
- `screen.evenness`: `levelRatio` (brightest cell / darkest cell), `darkerSide` (every darker side, strongest first), `darkest` (its box and mean colour), `horizontal` and `vertical` (fitted ratios across `extent`, where screen was actually measured). Above about 1.1 the screen is uneven: plan for step 5.
- `screen.leftOut`: pixels left out because they are not opaque. Keylight's `source` view applies the layer's masks, so a masked layer leaves the masked-out part out; that is fine for the screen colour near the subject. To see the whole screen's evenness, set the mask modes to None for the measurement (step 4 shows how) and restore them.
- `screen.grain`: `grainy` means the matte will chatter without some pre-blur.
- `screen.warning`: most of the frame is transparent, so this was a keyed render. Go back to the source.

If the subject moves across the screen or the light changes, measure at several `times`.

The colours are capture values. In a project with no working space they are the scale Keylight's Screen Colour takes (`screen.screenColourNote` says this with every report).

### 2. Set the key from the measurement

```
key.keylight { comp, layer, screenColour: <colour.nearSubject.colour> }
```

Start from Keylight's defaults plus the measured colour. If `grain.grainy`, add `screenPreBlur: 0.5` (what the measured shot used). Every value is range-checked; a refusal writes nothing.

### 3. Look at the matte

- `key.view { view: "screen_matte" }`, then render it and look. White should be the subject, black the screen. To measure it, render with `edge: { from: "luma" }` (step 4).
- `key.view { view: "status" }`, render and look. Grey inside the subject is a hole; grey in the screen is the screen left partly opaque.
- `key.view { view: "final_result" }` (or `intermediate_result`, see step 6) before measuring the alpha.

### 4. Read `edge` before the masks and on the final alpha

The final alpha includes the layer's masks, and a feathered mask hides or adds softness. So measure twice:

1. Before the masks, either way:
   - Keylight on `screen_matte` (the key's own matte, before the masks), read from luminance:
     ```
     ae_render_frame { compNameOrId, time, outPath, isolate: "<layer>", edge: { from: "luma" } }
     ```
   - or Keylight on Final Result with the masks switched off: read the masks with `mask.get`, set each mask's mode to `None` with `mask.set_props`, render with `edge: true`, then put each mode back from what `mask.get` returned.
2. The final alpha, masks on, Keylight on its final view:
   ```
   ae_render_frame { compNameOrId, time, outPath, isolate: "<layer>", channels: "alpha", edge: true }
   ```

`channels: "alpha"` writes the matte so you can look at it beside the numbers. A problem that shows before the masks is the key's; one that shows only after is the masks'.

### 5. What the numbers say to change

Change one setting at a time, by a modest step, and measure again.

| what `edge` shows | likely cause | try |
|---|---|---|
| `shares.transparent` near 0, `shares.partial` about the screen's share, `width.unmeasured` far above `width.samples`, one frame-sized patch | the screen is left partly opaque | check Screen Colour against `screen.colour`; raise Clip Black (the measured shot needed 40); raise Screen Gain a little (124 there) |
| a patch whose `densest` box sits where `screen.evenness.darkest` is | the darker part of the screen is not keyed | raise Clip Black; if that eats the subject's edge, key that part separately: duplicate the layer (`layer.duplicate`), `key.keylight` on the copy with the darkest cell's colour, and mask each copy to its side |
| a patch or speck where there is no screen at all (rigging, the screen's edge, the floor) | not a keying problem | a garbage mask (`mask.add`, mode Subtract, or an Add mask around the subject) with a small feather |
| a patch along a mask's edge, about as wide as its feather | the mask's feather | lower the feather (`mask.get` shows it); confirm with the before-masks reading |
| `holes` inside the subject, `meanAlpha` well below 1 | the subject is being keyed | lower Clip White (76 on the measured shot); raise Screen Despot White; check grey in the Status view |
| many tiny `specks` outside the subject | grain in the screen | Screen Despot Black 1 to 3; Screen Pre-blur |
| `width.typical` much more than a few px at HD, or a ring-shaped patch around the subject | the edge is too soft | lower Screen Softness; a small negative Screen Shrink/Grow (−0.5 to −1) |
| `width.typical` 0 to 1 and the edge looks cut out | the edge is too hard | Screen Softness 0.5 to 1 |
| `edgeFlicker.overall.edge.meanAbsDelta` high on a held shot | chatter | Screen Pre-blur; Key Cleaner's Reduce Chatter (step 6), measured before and after, since on the measured shot it widened the edge |

A good key on the measured shot read: partial share about 0.04, typical width about 7 px, no frame-sized patch, edge flicker 0.02 to 0.04. Use those as a sense of scale, not as targets.

### 6. Remove spill

```
key.cleanup { comp, layer, keylightView: "intermediate_result" }
```

Adobe's intended chain is Keylight on Intermediate Result, then Key Cleaner, then Advanced Spill Suppressor: Keylight keys, Key Cleaner recovers edge detail and reduces chatter, and the spill suppressor removes the green. `key.cleanup` adds both in that order after Keylight and sets the view when you ask. Leaving Keylight on Final Result also works, but then Keylight has already despilled what the others get, and the call's `chainNote` says so. Choose one and say which.

`spillSuppressor: { keyColor: "keylight" }` copies Keylight's Screen Colour into the suppressor's Key Color.

Then read spill where it can be read: `edge.spill` on the final alpha after the suppressor, and `sample` with `channels: "rgba"` on hair and shoulder regions. Green leading red and blue at the edge, more than in the subject's own colour, is spill.

Measure the matte before and after clean-up, with the same `edge` call on the same frames, and look over magenta. Keep each effect only where its numbers or the picture get better. On the measured shot the defaults doubled the edge width (7.1 to 15.1 px) and raised flicker, so they had to be tuned or taken out (`effect.remove`). Report which you kept and why.

### 7. Grade the subject to the plate

With the subject over the plate in the comp, sample both in one render:

```
ae_render_frame { compNameOrId, time, outPath, sample: { regions: [
  { name: "subject shadow", x, y, width, height },
  { name: "plate shadow", x, y, width, height },
  { name: "subject highlight", ... }, { name: "plate highlight", ... },
  { name: "subject neutral", ... }, { name: "plate neutral", ... } ] } }
```

Match the black level first (darkest areas), then the white level, then the colour cast (the ratio of red, green and blue in neutral areas). Use a grading effect found with `project.list_effects`, read its ranges with `effect.describe`, and sample again after each change. Compare like with like: shadow to shadow, not skin to wall.

### 8. Seat objects with contact shadows

Where the subject or an object touches the plate (feet, a hand on a table, a cup), add a contact shadow: a soft dark shape under the contact point, on its own layer under the subject, blurred, with Multiply or a low opacity. Sample the plate's own shadows for its darkness and colour, and match its direction to the plate's light. Check it at the same zoom the viewer will see.

### 9. Check edges over magenta

```
ae_render_frame { compNameOrId, time, outPath, isolate: "<layer>", over: "#ff00ff" }
```

Magenta shows a green fringe, a dark halo or a leftover screen patch that disappears over the plate. Look at hair, shoulders, hands and motion-blurred edges. Do it at several times, not one.

### 10. Read flicker across consecutive frames

Render four or more consecutive frames (one frame apart at the comp's frame rate) where the subject holds still:

```
ae_render_frame { compNameOrId, frames: [k, k + 1, k + 2, k + 3], outPath, isolate: "<layer>", channels: "alpha", edge: true, contactSheet: {} }
```

Address frames by number (`frames`), not by rounded times. A time a hair below a frame boundary renders the frame before: on the measured shot, times rounded to four decimals (43/30 written as 1.4333) repeated every third frame, which made a flicker reading compare a repeated frame and a two-frame step. With `times`, each frame reports the `frame` it rendered, and `frameWarning` names times that share a frame or sit just below a boundary.

Read `edgeFlicker.overall.edge` and `worstPair`. Real motion counts as change too, so judge it on held frames. Chatter along the edge points to Screen Pre-blur or Key Cleaner's Reduce Chatter.

`edgeFlicker` measures the matte's alpha. To see the composite move, and to catch a frame that jumps, use `strip` on the final comp (not isolated), around the moment you are judging:

```
ae_render_frame { compNameOrId, strip: { at: t, frames: 9 }, outPath }
```

It renders the nine frames around `t` into one small contact sheet and turns on `diff`: per consecutive pair, `change` (mean absolute difference of the picture), `changedShare`, `changedBounds`, and in `diff.series` the median and the pairs that stand out. A `pop` is one frame that differs from both neighbours, a `stutter` a frame that repeats the one before while the rest moves, a `cut` one pair far above its neighbours, a `repeat` an unchanged pair at the start or end beside motion. Stutters on footage with no repeated frames usually mean the requested times were rounded (see `frameWarning`). The diff sheet (`<stem>_diff.png`) shows each pair's change amplified 8×: chatter shows as a lit outline around the subject on held frames, real motion as the moving part. Add `sample` regions (an edge box, the face, the plate) to see where a change comes from. The flags are hints; numbers for a good key over a plate have not been measured yet.

Then watch it at speed. Stills do not show flicker the way playback does:

```
ae_do { operation: "render.preview", args: { comp: "<comp>", outputPath: "<scratch>/preview.mov" }, timeoutMs: 180000 }
```

It renders the work area through the render queue with the `High Quality` template, removes its queue item afterwards and returns the movie's path, duration, frame count and render time. Report what you saw in the movie separately from the numbers.

### 11. Restore and finish

Put Keylight back on the view the shot should render with (Final Result, or Intermediate Result if you used Adobe's chain). Restore any mask modes you changed for measuring. Render the final frames and look at them.

### 12. Stop and report honestly

Stop when the numbers stop improving: two or three changes in a row that do not move the reading the right way, or a change that fixes one number by breaking another (fewer patches but more holes). Do not keep turning settings. Report:

- the numbers before and after, for each `edge` reading you took;
- what you changed, in order;
- what is still wrong, with its box (`patches.list`, `holes.list`) and the frames where it shows;
- what would need a different technique: a clean plate or difference key, rotoscoping, or a reshoot. This kit does not include those.

Say what you checked by looking and what you checked by numbers. A good number is not a good picture, and a picture that looks right at one frame can chatter at the next.

## Cutting a subject out with Object Matte

After Effects 2027's own AI matte, Object Matte (the old Roto Brush), cuts a person or an object out of footage from one click on it. It needs no green screen, and it does not care how the screen is lit. A script cannot make that click, so the user makes it. Everything before and after the click is done through Comp Room.

### Facts measured in After Effects 27.0

Measured on macOS on 2026-11-11, on 1080 × 1920 clips of a seated presenter, one of them in front of an unevenly lit green screen.

1. **The effect.** The user's click adds it. It is "Object Matte & Refine Edge" in the effect list (match name `ADBE Samurai`, category `_Obsolete`, so not in the Effect menu) and shows on the layer as "Object Matte". A script can add it too, but an Object Matte with no selection makes no matte.
2. **A script cannot make the selection.** Each click or stroke is one child of the effect's Selections group (`ADBE Samurai Strokes Group`): a click with the Object Matte Tool is named "Add Object 1", "Add Object 2" and so on, newest first; a stroke with the old brush is "Quick Select Foreground 1". A script can read them. It can add an empty one, but cannot set its path ("This propertyValueType CUSTOM_VALUE has not been implemented"). It cannot pick the Object Matte Tool either (setting `app.project.toolType` to 161 fails), and no menu command selects a subject or freezes the matte.
3. **After one click the matte is there at every frame.** With one click on the subject at frame 0, `ae_render_frame` with `channels: "alpha"` returned the matte at any frame, across a cut in the footage, with no Spacebar and no Freeze. The first frame after the click took 7.8 s; after that, about 0.13 s for each frame After Effects has to track through, so a frame 10 seconds in costs about 40 s the first time. Render early frames first, and give long calls a longer timeout. The selection survives saving and reopening the project.
4. **What it gave.** A smooth, hard edge about 1 px wide (`edge`: partial share 0.0016, typical width 1). Things not clicked were left out: a microphone and a pale headrest. A black chair back touching the presenter's black shirt was kept. A second click on the microphone added its head, not its stand. Edge flicker between consecutive frames was 0.029 on a hold and 0.054 on fast hands with Reduce Chatter at 0, the same range as a Keylight key (fact 5 above).
5. **What the user sees.** The first time, a tip titled "Object Matte" with an OK button. A warning ("Use the paint and Object Matte tools in a Layer panel...") if the click lands in the Composition panel, which is why `subject.prepare` opens the Layer panel. A yellow bar in the Layer panel, "Draw Object Matte strokes at full resolution (View > Resolution > Full) for best results", while the viewer draws at less than Full: setting the comp's resolution to Full did not clear it when the viewer was on Auto (it drew at Half); choosing View > Resolution > Full did. A script can choose it: with the comp open in the viewer, `app.executeCommand(app.findMenuCommandId("Full"))` set `comp.resolutionFactor` to [1, 1] ("Half" set [2, 2]), the viewer's dropdown read Full and the bar was gone. Auto is not in that menu, so a script cannot choose it, and starting from Auto by script was not tested. `subject.prepare` runs the command and reads the resolution back. Hovering tints the object magenta before the click. Option-click (or Option-drag) takes something out of the selection.
6. **Its settings**, as After Effects reports them (`subject.status` reads them all; `subject.settings` writes feather, contrast, shift edge, reduce chatter, invert and decontaminate edge colours, each checked against its range first):

   | setting | name | range | default |
   |---|---|---|---|
   | `version` | Version | 1 to 4 | 4 |
   | `feather` | Feather | 0 to 1000 | 5 |
   | `contrast` | Contrast | 0 to 100 | 80 |
   | `shiftEdge` | Shift Edge | −100 to 100 | 0 |
   | `reduceChatter` | Reduce Chatter | 0 to 100 | 0 |
   | `invert` | Invert Foreground/Background | off or on | |
   | `fineTune` | Fine-tune Object Matte | off or on | on |
   | `useMotionBlur` | Use Motion Blur | not measured | |
   | `decontaminateEdgeColors` | Decontaminate Edge Colors | off or on | |

   The match names (`/rmshiftedges` and the others) and the display names both resolve in a script. The operations still fall back to walking the effect's properties, and each setting's `foundBy` says which way it was found.
7. **Computer use.** Background control did not work on After Effects (a background click registered as a zero-length stroke in the wrong place). Full-screen control did.
8. **Reduce Chatter 50 is the setting.** Edge flicker over six consecutive frames of a hold: 0.034 at Reduce Chatter 0, 0.0235 at 50, 0.024 at 100. 100 buys nothing more than 50.
9. **Feather and Contrast set the edge's width.** The defaults (Feather 5, Contrast 80) give an edge about 1 px wide. Feather 15 with Contrast 50 gave a typical width of 7 px (p90 8 px) and flicker 0.0325, with 23 % of the edge's pixels changing from frame to frame.
10. **Shift Edge is not a choke in pixels.** At −50 and at +50 the opaque share differed by 0.004 of the frame, well under a pixel of edge either way. To pull the matte in or push it out by pixels, add Simple Choker after Object Matte (`effect.add { matchName: "ADBE Simple Choker" }`) and set its Choke Matte (`ADBE Simple Choker-0002`, with `effect.set_property`): positive pulls in, negative pushes out, in pixels.
11. **Decontaminate Edge Colors takes the screen out of the edge.** On green-screen footage the edge's green excess went from −0.0005 to −0.009 with it on (the area just inside the edge read −0.036). The edge report did not flag a lean either way.
12. **Copies keep the selection.** Duplicating the layer copies Object Matte with its selections, and each copy renders its own matte. A copy can be another layer's alpha track matte (`layer.set_track_matte`).
13. **The whole-piece check is quick on it.** `ae_check_comp` (quarter size) took 79 ms a frame with Object Matte on.

These were measured the same evening on a take with no green screen (2176 × 3840, 30 fps, 10.7 s, locked camera, a pale wall and a white chair, the microphone in front; a 1080 × 1920 comp with the layer at 50 %):

14. **The person came out clean; the microphone did not.** Edge 1 px typical, 1.41 px at p90; flicker 0.0081 on holds and 0.0184 with hands moving, at Reduce Chatter 50. The user's second click, meant for the microphone, landed on himself: `subject.status` said "2 objects selected" and the matte had a microphone-shaped gap in his chest on every frame. Only the picture over a flat colour showed it. The gap was not a hole: the microphone runs off the bottom of the frame, so the transparent region reaches the frame edge. Sealing each frame edge between the subject's outermost contacts with it makes it an opening of 111,800 to 116,400 px at the comp's size on four frames (fact 18).
15. **Each selection's Transform > Position is where the click landed**, in source pixels (`ADBE Paint Transform` > `ADBE Paint Position`). The two clicks were at (1138, 2400) and (1081, 2403), about 57 px apart (56.4 as read live); the microphone's head was at about (1330, 3190). `subject.status` returns each point and warns when two are close.
16. **Something in front of the subject can be several pieces.** The microphone was two to the tool: hovering the head tinted only the head, and hovering below it tinted the stand and shock mount. Each took its own click. A click that drags a little becomes "Add Object Rect N", which may select nothing; `remove()` on a selection took it out by script, and the matte read the same afterwards.
17. **A gap inside a piece stays open.** A gap in the shock mount, with the shirt behind it, stayed transparent on every frame (about 44 × 130 px, 4,400 to 4,600 px, an enclosed hole) whatever was clicked, because the person was selected with the microphone's outline cut out of him. Filling it from a still made at one frame (`subject.fill_gaps`) took the enclosed holes on eight frames from about 5,000 px to between 7 and 835 px, with the edge width unchanged (probed by hand, not through the operation).
18. **Holes and openings on the take**, regions of 1,000 px or more at the comp's size on frames 15, 60, 150 and 240. With the microphone missed: one opening of 111,818 to 116,422 px (the microphone, x 489 to 910, y 1460 to the bottom edge), and on frame 15 an opening of 10,373 px between the arm and the body. With the microphone in: the shock-mount hole of 4,424 to 4,623 px, an opening of 1,785 to 1,985 px under the stand, and the same arm opening on frame 15. The arm and stand openings are real gaps, so a correct cut-out of this take also stops the check once; the user accepts them (`accept`).
19. **The renders are slow the first time.** Through `ae_render_frame`, four frames not rendered before took 84 to 159 s on this take (20 to 40 s a frame), eight took 82 to 92 s, and a frame rendered before took well under a second. With the default settle time, nine frames came back "did not finish writing within 39 s"; `subject.check` now allows 60 s a frame and splits long lists over several renders.
20. **Each selection's Duration start is its click time in seconds** (0.49999667 for a click at frame 15); `subject.status` reports it as `clickTime`, and `clickFrame` in comp frames.
21. **Through the operations, on the same take.** `subject.check` with the defaults checked 9 of 9 frames in 121 to 123 s: with the microphone missed, an opening of 115,785 px on all nine frames (bottom edge), the arm opening of 11,926 px on three, and the close clicks; with it in, the shock-mount hole of 4,107 to 4,623 px on eight. `subject.fill_gaps` at frame 15 filled 5 holes (5,782 px, grown to 7,774), left the 2 openings alone, and took 180 s; the fill layer alone covered exactly the mask (7,774 px); the mask layer, switched off, still matted; afterwards no hole of 1,000 px or more on 9 of 9 frames, the edge unchanged (1 px typical, 1.41 px at p90), and holes of 9 to 781 px left. The fill copy kept the footage's audio on, so the comp played the sound twice; `subject.fill_gaps` now switches it off.
22. **Removing a redundant click changed nothing.** With two clicks on the subject's chest, taking the later one out (`subject.remove_selection`) left the matte the same (opaque share 0.3083 on frame 0 and 0.3108 on frame 15, before and after).
23. **A frame did not repeat, once.** On one run frame 0 rendered without the microphone (opaque share about 0.26 instead of 0.31); two minutes later the same check rendered it with the microphone. It could not be made to happen again (after purging the caches, switching between comps with different selections, removing a selection). The cause is not known. `subject.check` renders each frame with a finding a second time and reports a frame that differs as `unstable`; two renders that agree may both come from the cache, so agreement does not prove a frame stable.
24. **The delivered cut-out, frame by frame.** The filled comp of this take, rendered to ProRes 4444 with alpha (320 frames, 390 s), was read outside After Effects: the opaque share ran from 0.279 to 0.314, with no jump over 0.012 from one frame to the next, so the microphone is in every frame, frame 0 included. A dropped object would show as a jump of about 0.05. That is a cheap test of a whole rendered cut-out; it is a candidate for the whole-piece check (`ae_check_comp`), not built.
25. **Where `subject.check`'s time goes.** Three checks of nine frames took 252, 186 and 245 s, although frames already rendered come back from `ae_render_frame` in about a second each (four frames with `channels: "rgba"` and `edge`: 61.9 s the first time after the fill was built, then 12.8, 10.3, 3.8 and 3.1 s). Offline, the check's own work in Node on nine 1080 x 1920 frames of noise (the worst case for compression) was about 0.6 s a frame; it is now about 0.36 s on the first render and 0.13 s on the second. Inside `ae_render_frame`, `edge` takes about 1 s a frame and writing the RGBA file about 0.85 s, so the second render now asks for no `edge`, and frames whose regions are all accepted are not rendered a second time. Where the rest of the live time went is not known yet: every check now returns `timing` (status, each render's After Effects call, settle wait and Node work, the pixel work and the total) and `timeReading`, one sentence that says it when most of it was After Effects rendering.
26. **After Effects recomputes Object Matte on every capture.** Five identical `ae_render_frame` calls for the same nine frames spread over the take (frames 0 to 280, `channels: "rgba"`, `edge`) took 236, 287, 285, 286 and 284 s, with or without isolating the layer: nothing is kept between calls. In `subject.check`'s own timing almost all of it was the settle wait for the files (130 to 409 s of a 135 to 414 s check), and the plugin's pixel work about 1 s. Frames near the click frame render in seconds. The rendered cut-out (ProRes 4444 with alpha, `render.preview` with 'High Quality with Alpha', 320 frames in 390 s) read back through `ae_render_frame` at about 0.55 s a frame (32 frames in 16.4 to 19.2 s). There is no Freeze by script: `app.findMenuCommandId` gives 0 for "Freeze", "Freeze Roto Brush", "Unfreeze", "Freeze Object Matte" and "Freeze Propagation". On one run the live matte reported an opening of 21,694 px that the run before did not: it does not read the same twice. Hence the path of steps 4 to 11: a quick check near the click, one render, a check of every frame of the file, and building on the file.

### Tell the user first

When a brief involves cutting a person or object out of footage, tell the user before building starts that one manual step in After Effects will be needed, when it comes (once the footage is in its comp, before anything is laid over or behind the subject), and that it takes about ten seconds. When the moment comes, `subject.prepare` returns this notice and the steps:

One step here needs you in After Effects: a single click on the subject, about ten seconds. Everything before and after it I do.

1. After Effects is showing your clip in the Layer panel (the tab reads "Layer", then the clip's name). I opened it for you.
2. In the toolbar at the top, click the Object Matte Tool: the dashed square with an arrow, just left of the pin. If that icon looks different, click and hold it and choose "Object Matte Tool" from the list.
3. If a tip titled "Object Matte" appears, click OK.
4. If a yellow bar in the Layer panel says "Draw Object Matte strokes at full resolution", choose View > Resolution > Full in the menu bar, and tell me the bar was there.
5. Move the pointer over the person in the Layer panel. They tint magenta. Click once.
6. Anything else that should stay in the cut-out, such as a microphone, can be several pieces: hover each piece, check that it tints magenta, and click it. Do not click the person again.
7. Tell me "done". No Spacebar and no Freeze are needed. I will then check the cut-out and show you what is in and what is out.

`subject.prepare` fills in the clip's name in step 1 and, when you pass `subject`, puts it in steps 5 and 6: "the presenter" gives "Move the pointer over the presenter in the Layer panel. The presenter tints magenta. Click once."; "yourself" (the user cutting themself out) gives "Move the pointer over yourself in the Layer panel. You tint magenta. Click once." and "Do not click yourself again." Give the user its `userMessage` word for word; do not paraphrase the steps. In a plan made before After Effects is open, quote the steps above as they are.

### What the click does not include

Only what the user clicks is in the matte. Things the subject holds or sits against (a microphone, a cup, a chair, a headrest) are left out unless they get their own click, and a second click can take only part of an object (the microphone's head, not its stand). Dark furniture touching dark clothing comes along with the subject (a black chair back against a black shirt). Look for both on every cut-out (steps 4 to 6): a missed object that runs off the frame edge shows as an opening, not a hole.

### The procedure

1. **Pick the frame.** Choose a time where the subject is clearly visible, whole and still (not mid-gesture or behind something). Look at it first: `ae_render_frame` at that time.
2. **Prepare.** `ae_do { operation: "subject.prepare", args: { comp, layer, time, subject: "the presenter" } }`. It brings the comp forward, chooses View > Resolution > Full and reads the comp's resolution back, moves to `time`, selects only that layer and opens it in the Layer panel. `viewerResolution.verified` is true only when the comp read [1, 1] after the command and again after the Layer panel opened; otherwise `couldNotDo` says what it read. It adds no effect and does not pick the tool. Read `couldNotDo`: when the Layer panel did not open, `beforeSteps` says what to tell the user before step 1. `existing` shows an Object Matte already on the layer.
3. **Ask for the click.** Relay `userMessage` word for word and wait for "done". Where you have computer use with full-screen control and the user asks you to click, say you will, then for each piece: hover it, take a screenshot and check that the magenta tint is on the piece you mean (and only that piece), click, and go on to the next. Background control does not work on After Effects.
4. **Check the cut-out quickly, before anything else is built.** `ae_do { operation: "subject.check", args: { comp, layer, outDir } }`. It reads the selections and where each click landed, renders the cut-out with its alpha at the click frames and two frames either side (seconds: those frames are cheap to render, fact 26), finds holes and openings, draws each frame over magenta, and returns `picture` (a contact sheet), `findings`, `checked`, `inOut` and `stop`.
   - A **hole** is a region below opaque that the frame edge cannot reach. An **opening** reaches the frame edge only between two places where the subject touches that edge: something in front of the subject left out (the microphone of fact 14 ran off the bottom of the frame) or a real gap (between an arm and the body). The picture decides which.
   - A hole or opening of 1,000 px or more at the comp's size (`holeLimit`) is a finding. So is a frame that did not render (`not-checked`: it is never counted as clean; run the check again on those frames with a larger `secondsPerFrame`), and so are two clicks close together.
   - A selection count ("2 objects selected") is not a check: the missed microphone of fact 14 had one.
5. **When `stop` is true, stop and show it.** Show the user `picture`, say what is out in plain words (from `inOut` and from looking: "the microphone is not in the cut-out: the background shows where it is"), and fix it before building anything:
   - something left out: another click (run `subject.prepare` again and relay its steps; for a piece of something in front, the user hovers each piece until it tints and clicks it);
   - two clicks on the same thing (`close-clicks`): take the later one out with `subject.remove_selection { comp, layer, selection }` (the finding's `advice` names it; fact 22: the matte does not change), then ask for the click that was meant for something else, if there was one;
   - a wrong click (the wrong person, an "Add Object Rect"): `subject.remove_selection`, then ask for the right click;
   - a gap inside a piece that no click fills (fact 17, a hole): `subject.fill_gaps` (below);
   - a real gap the user says is fine (an arm against the body, under a stand): run `subject.check` again with `accept: [<that finding's box>]` (a plain box accepts an opening; `{ box, kind: "hole" }` a hole), and it is listed in `accepted` instead. An entry accepts only a finding of its kind in about the same place and size, never a hole inside an accepted opening's box;
   - a frame that came out differently on two renders (`unstable`, fact 23): run `subject.check` again, and look at the first frames of the delivered video;
   - the whole selection wrong: `effect.remove { comp, layer, effectIndex }` and start again from step 2.

   Then run `subject.check` again: frames whose regions are all accepted are not rendered a second time, and `timeReading` says where the time went. With nothing left, it reads "Nothing over the limit on N of N frames; the picture is at …" and `stop` is false. Look at its picture even then: a number cannot tell the background kept from the subject.
6. **Tell the user what is in and what is out**, especially what the subject holds or sits against (a microphone, a chair, a cup). Ask for another click only when something the brief names is missing.
7. **Fill enclosed gaps** that no click fills: `ae_do { operation: "subject.fill_gaps", args: { comp, layer, stillPath, frame, only } }`. It reads the matte at `frame` (use the click frame), keeps the holes (regions the frame edge cannot reach; openings are never filled, since the wall can be behind them), drops those under 20 px, grows the rest by 3 px, saves them as a still at `stillPath` (keep it with the project), and puts a copy of the same footage under the cut-out that shows only through that still (luma track matte), with the copy's audio switched off so the sound plays once. It then renders the fill layer alone, and undoes the build if that covers more than the still (not verified in After Effects: it has not happened there), and measures holes and openings again near the reference frame (`across: true` for the clip, which takes minutes) and reports what is left; the render and the file check (steps 9 and 10) then cover every frame. It refuses, building nothing, when the reference frame does not render. Its limits, said in every result: the still is from one frame, so it needs a locked camera and a piece in front that does not move; what shows through is whatever is behind the gap, which is the subject only while the subject is behind it; and it fills every enclosed gap, including a real one (between an arm and the body), unless `only` boxes (from `subject.check`'s findings) name the gaps you mean. Show the user the picture after the fill. From then on `subject.check` renders the cut-out together with its gap fill (`fillLayer` in the result), so a filled gap no longer counts.
8. **Set the edge** with `subject.settings` from the `edge` numbers (recipe 1 below), one setting at a time, measuring again near the click frame after each.
9. **Render the cut-out once.** Tell the user it takes about one pass through the clip (390 s for the 320 frames of the 2176 × 3840 take, about 1.2 s a frame), then `ae_do { operation: "subject.render_cutout", args: { comp, layer, outputPath } }`. It renders the layer with its gap fill, alone, over the layer's span, to a movie with alpha (an output template whose name says alpha, such as 'High Quality with Alpha'; it refuses when there is none), and puts every layer switch back. It changes the render queue, so undo is refused afterwards unless `acceptRenderQueueRisk` (save first). The movie is in comp space. The original layer keeps the sound.
10. **Check the file.** `ae_do { operation: "subject.check_file", args: { path: <outputPath>, outDir, accept } }`, with the `accept` boxes the user agreed to in step 5. It reads every frame (up to 400; beyond that, pairs of neighbouring frames in steps and the first and last three), finds holes and openings as `subject.check` does, measures the opaque share of every frame, and reports a `jump` when neighbouring frames differ by more than 0.025 (fact 24: the take ran 0.279 to 0.314 with no step over 0.012; a dropped microphone is about 0.05). A frame it could not read stops it. Stop and show the picture as in step 5; a jump or a hole on one frame means that frame rendered wrong, so render again (step 9) and check the new file.
11. **Build on the file.** `ae_do { operation: "subject.use_cutout", args: { comp, layer, path: <outputPath>, startTime: <timeSpanStart> } }` puts the movie in the comp directly above the cut-out, over the same span, and switches the cut-out's and the fill's pictures off. They stay in the project, with the selections, for a later re-click. Build the piece on the movie: it cannot change between renders the way the live matte did (fact 23).
12. **Check flicker** on the file, across held frames and fast motion, as in step 10 of the keying procedure above.

The spread across the clip on the live matte (`subject.check { across: true }`) is still there, but it costs minutes for a sample of nine frames (fact 26); the file check reads every frame in less.

### Recipe 1: Object Matte alone (the default, with or without a green screen)

Verified on one clip: a 1080 × 1920 seated presenter in front of an unevenly lit green screen, frame 127.

```
subject.settings { comp, layer, reduceChatter: 50 }
```

Then choose the edge from the `edge` numbers on the matte (`channels: "alpha"`, `edge: true`) and from the subject over a flat colour:

| what `edge` and the picture show | try |
|---|---|
| `width.typical` about 1 and the edge looks cut out against the new background (hair, motion blur) | raise `feather` from 5 and lower `contrast` from 80, together, in steps; Feather 15 with Contrast 50 gave 7 px (fact 9) |
| `edgeFlicker` high on a held shot | `reduceChatter: 50` (fact 8); more does not help |
| the edge leans to the screen colour (`edge.spill`, or `sample` on the edge with `channels: "rgba"`) | `decontaminateEdgeColors: true` (fact 11), or the spill suppressor from step 6 above |
| a ring of the old background round the subject, or the edge chewed into it | Simple Choker after Object Matte, a pixel or two either way (fact 10); not Shift Edge |
| something the subject holds is missing, or the wrong thing is in | a click, not a setting (procedure step 6) |

What it gave, against the other two builds on the same frame:

| build | edge width typical / p90 | patches, holes, specks | flicker on a hold |
|---|---|---|---|
| Object Matte alone, Reduce Chatter 50 | 1 / 1.41 px | 0, 0, 0 | 0.0235 |
| Object Matte body + Keylight edge (recipe 2: core choked 6 px, cover spread 8 px, Keylight between) | 1.41 / 4 px | 0, up to 1, 0 | 0.036 |
| Keylight alone, no garbage masks | 5 / 17 px | 17, 5, 4 | 0.041 |

Expect it to leave out what was not clicked and to keep dark things touching dark clothes (above).

### Recipe 2: Object Matte body with a Keylight edge (an option, not shown to help)

Only for fine, wispy edges (long loose hair) on a well and evenly lit green screen. On the one clip it was tried on, a badly lit screen and short hair, it was worse than recipe 1: inside the band it brought back Keylight's stair-stepped edge at the shadowed shoulder, and it kept a sliver of the pale headrest beside the face. It has not been shown to help anywhere yet. Build it only to compare it with recipe 1, with the same `edge` calls on the same frames and by looking at those frames, and keep it only if it is better on both.

Three copies of the footage layer (`layer.duplicate`; each keeps the selection, fact 12):

1. **The core.** One copy keeps Object Matte, with Simple Choker after it pulling the matte in (Choke Matte positive; 6 px on the measured clip), so it is solid inside the subject and stops short of the edge.
2. **The fine edge.** One copy has Object Matte removed (`effect.remove`) and is keyed with Keylight as in the procedure at the top (`key.keylight` from the measured screen colour, then `key.cleanup` where it helps). Its alpha track matte is the third copy (`layer.set_track_matte`).
3. **The cover.** The third copy keeps Object Matte with Simple Choker pushing the matte out (Choke Matte negative; −8 px on the measured clip), a moving garbage matte that removes everything Keylight left outside the subject, including uneven screen and the frame's corners.

Choose the two Choke Matte values from `edge` reports: the core's from Keylight's typical width (pull in until the core sits inside Keylight's soft band), the cover's from Keylight's `width.p90` and how far the hair reaches (push out until the hair is inside). Shift Edge does not do this (fact 10): a first build using Shift Edge −50 and +50 rendered the same as recipe 1. Measure the result as one layer: precompose the three (`comp.precompose`) and run `edge` on the precomp.

### Keylight alone

The procedure at the top of this document stays the route when the user will not make the click, or for footage where Object Matte fails.

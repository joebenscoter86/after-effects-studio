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
5. **What the user sees.** The first time, a tip titled "Object Matte" with an OK button. A warning ("Use the paint and Object Matte tools in a Layer panel...") if the click lands in the Composition panel, which is why `subject.prepare` opens the Layer panel. A yellow banner in the Layer panel saying to draw at full resolution, which is why it sets the comp to full resolution. Hovering tints the object magenta before the click. Option-click (or Option-drag) takes something out of the selection.
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

### Tell the user first

When a brief involves cutting a person or object out of footage, tell the user before building starts that one manual step in After Effects will be needed, when it comes (once the footage is in its comp, before anything is laid over or behind the subject), and that it takes about ten seconds. When the moment comes, `subject.prepare` returns this notice and the steps:

One step here needs you in After Effects: a single click on the subject, about ten seconds. Everything before and after it I do.

1. After Effects is showing your clip in the Layer panel (the tab reads "Layer", then the clip's name). I opened it for you.
2. In the toolbar at the top, click the Object Matte Tool: the dashed square with an arrow, just left of the pin. If that icon looks different, click and hold it and choose "Object Matte Tool" from the list.
3. If a tip titled "Object Matte" appears, click OK.
4. Move the pointer over the person in the Layer panel. They tint magenta. Click once.
5. Anything else that should stay with them, such as a microphone: hover it and click it too.
6. Tell me "done". No Spacebar and no Freeze are needed.

`subject.prepare` fills in the clip's name in step 1 and, when you pass `subject` ("the presenter", "the bottle"), puts it in step 4 ("Move the pointer over the presenter in the Layer panel. The presenter tints magenta. Click once."). Give the user its `userMessage` word for word; do not paraphrase the steps. In a plan made before After Effects is open, quote the steps above as they are.

### What the click does not include

Only what the user clicks is in the matte. Things the subject holds or sits against (a microphone, a cup, a chair, a headrest) are left out unless they get their own click, and a second click can take only part of an object (the microphone's head, not its stand). Dark furniture touching dark clothing comes along with the subject (a black chair back against a black shirt). Look for both on every cut-out (step 6).

### The procedure

1. **Pick the frame.** Choose a time where the subject is clearly visible, whole and still (not mid-gesture or behind something). Look at it first: `ae_render_frame` at that time.
2. **Prepare.** `ae_do { operation: "subject.prepare", args: { comp, layer, time, subject: "the presenter" } }`. It brings the comp forward, sets full resolution, moves to `time`, selects only that layer and opens it in the Layer panel. It adds no effect and does not pick the tool. Read `couldNotDo`: when the Layer panel did not open, `beforeSteps` says what to tell the user before step 1. `existing` shows an Object Matte already on the layer.
3. **Ask for the click.** Relay `userMessage` word for word and wait for "done". Where you have computer use with full-screen control, you may make the click yourself after saying you will; background control does not work on After Effects.
4. **Check the state.** `subject.status { comp, layer }`. `summary` says what is there in one sentence ("1 object selected", or "no selection yet: the user has not clicked"). With no selection, ask for the click again.
5. **Look at the cut-out.** Render the subject over a flat colour and the matte, at the clicked frame and at frames further on (early ones first, fact 3):
   ```
   ae_render_frame { compNameOrId, time, outPath, isolate: "<layer>", over: "#ff00ff" }
   ae_render_frame { compNameOrId, time, outPath, isolate: "<layer>", channels: "alpha", edge: true }
   ```
6. **Tell the user what is in and what is out.** Name what the matte kept and what it left out, especially what the subject holds or sits against (a microphone, a chair, a cup). Ask for another click only when something the brief names is missing ("the microphone is not in the cut-out; hover it and click it too"). When the selection is wrong (the wrong person, the background), start again: remove the Object Matte with `effect.remove { comp, layer, effectIndex }` (`subject.status` gives `effectIndex`), run `subject.prepare` and ask for the click again. One wrong extra can also be taken out by the user Option-clicking it.
7. **Set the edge** with `subject.settings` from the `edge` numbers (recipe 1 below), one setting at a time, measuring again after each.
8. **Check flicker** across consecutive held frames and fast motion, as in step 10 above.

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

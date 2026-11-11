# Keying and compositing a green screen

How to key green-screen footage in After Effects through Comp Room, and how to tell from numbers whether the key is good. The method is: measure, change one thing, measure again. Every step below names the call that does it.

The tools:

- `ae_render_frame` with `screen: true` measures the screen in the un-keyed source.
- `ae_render_frame` with `edge: true` measures a matte: shares, edge width, holes, specks, patches, spill and, with `times`, flicker.
- `ae_render_frame` with `sample`, `channels`, `over`, `isolate` and `times` reads colours, shows the matte and lays the key over a test colour.
- `key.keylight` adds or updates Keylight from measured values and reads every setting back.
- `key.view` switches Keylight's view and reports the previous one.
- `key.cleanup` adds Key Cleaner and Advanced Spill Suppressor after Keylight.
- `mask.get` reads masks back; `mask.add`, `mask.set_path` and `mask.set_props` change them.
- `effect.describe` lists any effect's properties with their ranges before you write them.

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
ae_render_frame { compNameOrId, times: [t, t + 1/fps, t + 2/fps, t + 3/fps], outPath, isolate: "<layer>", channels: "alpha", edge: true, contactSheet: {} }
```

Read `edgeFlicker.overall.edge` and `worstPair`. Real motion counts as change too, so judge it on held frames. Chatter along the edge points to Screen Pre-blur or Key Cleaner's Reduce Chatter.

### 11. Restore and finish

Put Keylight back on the view the shot should render with (Final Result, or Intermediate Result if you used Adobe's chain). Restore any mask modes you changed for measuring. Render the final frames and look at them.

### 12. Stop and report honestly

Stop when the numbers stop improving: two or three changes in a row that do not move the reading the right way, or a change that fixes one number by breaking another (fewer patches but more holes). Do not keep turning settings. Report:

- the numbers before and after, for each `edge` reading you took;
- what you changed, in order;
- what is still wrong, with its box (`patches.list`, `holes.list`) and the frames where it shows;
- what would need a different technique: a clean plate or difference key, rotoscoping, or a reshoot. This kit does not include those.

Say what you checked by looking and what you checked by numbers. A good number is not a good picture, and a picture that looks right at one frame can chatter at the next.

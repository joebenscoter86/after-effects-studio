# 2026-11-12 — Probe: tracking, stabilizing, camera tracking, fill and Mocha from a script

- Plan item: professional-finish plan, stage 8 ("Probe: tracking, roto and camera"). Roto Brush was probed on 2026-11-11 (the plan has the result); this covers the other five.
- Question, for each tool: can a script apply it, start its analysis, know when it has finished, and read the result?
- Operator: Claude (Opus 5.5), driving After Effects 27.0x78 on macOS through the plugin's file-IPC transport from Node, with nobody at the screen.
- Projects: new untitled scratch projects, closed without saving; the open project (a test project, saved and clean) was reopened unchanged after each run.
- Clips, 540 × 960, 30 fps, 3 s (90 frames), ProRes 422:
  - **locked**: three seconds of the half-size green-free test take (a person talking to a locked camera), scaled down;
  - **moving**: a slow pan and zoom made with ffmpeg (`zoompan`) across one still of a furnished room. It is a 2D move of a flat picture with no parallax, so it is a weak test of the 3D Camera Tracker. No real handheld clip was among the test assets.
- Stop rules: stop a probe at any dialog or click it needs; dismiss nothing; measure free space and After Effects' disk cache folder before and after; stop at 12 GB free.

## The answer

| Tool | Apply by script | Start the analysis | Know when it has finished | Read the result |
|---|---|---|---|---|
| Layer tracker (Track Motion) | Yes: menu command "Track Motion" (2568) on the selected layer adds Tracker 1 / Track Point 1 | **No**: no menu command for Analyze Forward or Backward (15 names tried); the analysis is a button in the Tracker panel | Not applicable without an analysis; a script could watch the track point's keys appear | Yes, in principle: Feature Center, Attach Point, Confidence and the rest are ordinary properties a script reads (and sets: Feature Center moved to 270, 300). Keys after a real analysis: not tried |
| Warp Stabilizer | Yes: `addProperty("ADBE SubspaceStabilizer")` (or menu command "Warp Stabilizer VFX", 3986, not run) | **Yes, indirectly**: the analysis starts on its own when the effect is added, and again when a setting that needs it changes (Detailed Analysis set by script restarted it) | **Yes**: the effect's first property's *name* carries the progress ("1% (frame 2 of 90)", "72% (frame 66 of 90)") and, when done, "90 frames @ 0:00:00:00"; "Auto-scale" becomes "Auto-scale (102.3%)" | Only as pixels: a render after the analysis is stabilized. The per-frame correction is not exposed (no keys; the analysis lives in an unreadable custom property). **A frame rendered during the analysis has an "Analyzing in background (step 1 of 2)" banner burned into it** |
| 3D Camera Tracker | Yes: `addProperty("ADBE 3D Tracker")` (or "Track Camera", 3983, not run) | **Yes, indirectly**, as Warp Stabilizer; but added while another comp was in the viewer it did not start in 18 s even after its comp was opened, until a setting changed | **Yes**: the same progress name ("46% (frame 43 of 90)"), then "Method Used: Mostly Flat Scene" and "Average Error: 0.06 pixels" | The solve's quality, as text in property names. The camera and track points: **no**. The camera is made by the effect's Create Camera button or the comp viewer's context menu; no menu command (9 names tried). After a person creates it, it is an ordinary camera layer whose keys a script reads (not tried) |
| Content-Aware Fill | No scripting object (`ContentAwareFill` and `contentAwareFill` undefined globally and on `app`) | **No**: menu command "Content-Aware Fill" (5025) opens its panel in 245 ms with no dialog; generating the fill layer is a button in the panel | No | The generated fill layer would be ordinary footage a script reads (not tried) |
| Mocha AE | Yes: `addProperty("mochaAECC")`, no dialog | **No**: tracking happens in Mocha's own window, opened by the effect's "Launch Mocha AE" button or the menu command "Track in Boris FX Mocha" (5008). Neither was pressed, because it opens a separate application window | No | Yes, in principle: the effect's Tracking Data (Top Left, Top Right, Bottom Left, Bottom Right, Center, Rotation, Scale) and its matte settings are ordinary properties, and they get keys when a person tracks and the result is sent back. Not tried |

So After Effects is on both sides of the line: the two automatic analyses (Warp Stabilizer, 3D Camera Tracker) a script can run and wait for, the three that need a panel or a separate window (the layer tracker, Content-Aware Fill, Mocha AE) it cannot, though it can set them up.

## What was tried, in order

1. **Names, read only, on the open project.** `app.effects` lists Warp Stabilizer (`ADBE SubspaceStabilizer`, Distort), 3D Camera Tracker (`ADBE 3D Tracker`, Perspective) and Mocha AE (`mochaAECC`, Boris FX Mocha). `app.findMenuCommandId` finds Track Motion (2568), Track Camera (3983), Warp Stabilizer VFX (3986), Track in Boris FX Mocha (5008), Tracker (5005, the panel), Content-Aware Fill (5025) and Track Mask (10311). Not found: Stabilize Motion, Analyze Forward and its variants, Create Camera and its variants, Generate Fill Layer.
2. **Layer tracker**, locked clip: the layer selected, its comp in the viewer, `app.executeCommand(2568)`. The layer got `ADBE MTrackers` > Tracker 1 > Track Point 1 with Feature Center, Feature Size (20, 20), Search Offset, Search Size (40, 40), Confidence (100), Attach Point and Attach Point Offset. Feature Center read (269, 480) and was set to (270, 300). After 5 s idle, no keys on Feature Center or Attach Point: nothing analyses by itself.
3. **Warp Stabilizer**, moving clip: added, then its properties and a render of frame 45 read every 5 s. At 5 s the render carried the banner (mean difference from the raw frame 0.024); from 10 s it was the stabilized frame (0.057) and the names read "90 frames @ 0:00:00:00" and "Auto-scale (102.3%)". In a second run the names were read every 3 s: "1% (frame 2 of 90)" at 3 s, done at 6 s; Detailed Analysis set to on by script: "72% (frame 66 of 90)", then done with "Auto-scale (102.1%)".
4. **3D Camera Tracker**, moving clip: added with its comp in the viewer, done within 5 s: "Method Used: Mostly Flat Scene", "Average Error: 0.06 pixels" (a flat picture panned and zoomed is a flat scene). The render was unchanged (track points are not rendered by default). In the second run, added while another comp was in the viewer: "Average Error: -" for 18 s; Detailed Analysis set by script: "46% (frame 43 of 90)", then done.
5. **Mocha AE**, locked clip: added with no dialog; 60 properties, among them Launch Mocha AE (a button), Matte (View Matte, Apply Matte, Shape, Feather, Invert Mask), Tracking Data (the corner pins and transform) and Export Option.
6. **Content-Aware Fill**: a subtracting mask on the moving clip's layer, the layer selected, `app.executeCommand(5025)`: the call returned in 245 ms with no error and no dialog. The panel stays open in After Effects' workspace afterwards.

## Cost

- Disk: nothing measurable. The disk cache folder went from 13.4 GB to 10.2 GB during the first Warp Stabilizer analysis (After Effects trimming its own cache) and did not grow with any analysis; free space rose from 20 to 22 GB. The analyses keep their data in the project, not the cache.
- Time on 90 frames at 540 × 960: Warp Stabilizer 3 to 10 s, the 3D Camera Tracker 3 to 5 s once started.

## Where the answer is no: what a person does, and how close a script can bring them

- **Layer tracker:** a script can add the tracker, place and size the feature and search boxes, put the comp and layer in front, and open the Tracker panel (command 5005). The person clicks Analyze Forward (one click). A script can then read the track point's keys and apply them (or link a layer to them with an expression). One click away.
- **3D Camera Tracker:** analysis needs no click; the camera does. The person clicks Create Camera in the effect's controls (or right-clicks chosen track points). One click away; a script can select the layer and open the effect controls first.
- **Content-Aware Fill:** a script can draw the mask, set it to Subtract, select the layer and open the panel. The person chooses the fill method and clicks Generate Fill Layer; a script can then find the new fill layer. One click away (two if the method needs choosing).
- **Mocha AE:** a script can add the effect. The person launches Mocha, tracks a plane there, and sends the result back; that is a session in another application, not a click.

## Not tried

- Keys from a real analysis for the layer tracker, Mocha's tracking data, a camera made by Create Camera, a generated fill layer: each needs a person.
- Mask tracking ("Track Mask", 10311).
- A real handheld clip; a long clip; Windows.
- Whether the background analyses run while After Effects is rendering from a script without any idle time between calls (here every check was a separate call with idle time between).

## A small operation the answers make worth having (proposed, not built)

`motion.analyze`: add Warp Stabilizer or the 3D Camera Tracker to a layer, open its comp in the viewer, start the analysis (setting a setting it needs when it has not started), wait while reading the progress from the effect's property names, and return when they say it is done (with the auto-scale or the solve's method and average error), refusing to render before that, since frames rendered during the analysis carry a banner. For the three that need a person, `motion.prepare` would set each up and say the one click to make, as `subject.prepare` does for Object Matte.

# Techniques from one video (1 recipes, 1 proven)

Written by the channel learner from the video's narration and screen together, then checked against the video by a second reader. Every recipe here passed that check; none is in the plugin. `status: proven` means it was built in After Effects from the recipe alone, compared with the tutorial's own result, and accepted by Joe (1 of 1); `status: unproven` means it has not been.

Each step is marked `said` (narrated), `shown` (on screen; `fNNNNNN` is a frame in the local study folder, frame number divided by the video's frame rate is seconds) or `inferred` (our reading). The `source` and frame references are for checking and stay out of the plugin. Credits: `CREDITS.md`.

| # | Technique | Jobs | Check passed in round | Status |
|---|---|---|---|---|
| 01 | Before/after reveal with a sliding rectangle matte and thin edge line | transitions; lines and shapes | 3 | proven |

## Before/after reveal with a sliding rectangle matte and thin edge line
id: 01-before-after-sliding-matte-wipe
status: proven (accepted by Joe 2026-11-26: rebuilt in After Effects on generated artwork from this recipe alone, reviewed against the tutorial's result and phone MP4s sent; he said "accepted")
source: SSAsTdXmKl0 21–206 s
jobs: transitions; lines and shapes
what it does for a beat: Show the same subject before and after one change. The "after" picture sits over the "before" picture and is uncovered by a straight vertical edge that sweeps across and then back.
what it looks like: A square picture of a dark glossy robot (the "after") is uncovered from the left by a vertical edge, over a shaded white wire-mesh render of the same robot on black (the "before"). A hairline in a pale amber (measured on the finished clip) runs along the moving edge. The edge sweeps left to right, then right to left. In the clip only the forward start is soft; the forward leg ends off the right side and the return leg is cut while still fast. The soft ends belong to the build's Easy Ease keys, not to the clip.

ingredients:
- Two stills of the same subject, one per state — built-in (imported footage); the author used a black-background robot render and a wireframe-style render of it.
- Shape layer with a Rectangle (Rectangle tool) — built-in
- Position keyframes with Easy Ease — built-in; Animation > Keyframe Assistant > Easy Ease (shown f003766, F9 overlay)
- Edit > Duplicate (shown f003792 menu)
- Track Matte, Alpha Matte on the "after" layer — built-in; layer's TrkMat dropdown (shown f005572)

steps:
1. Make a square composition, 1080 × 1080 px, square pixels, 30 fps, 12 s long, black background. (shown f000828)
2. Bring both stills into the comp: "after" above "before", both filling the 1080 square. (shown f001667; the way they were added is inferred)
3. Draw a rectangle with the Rectangle tool: a shape layer with "Rectangle 1" whose selection handles sit a little outside the comp edge. (shown f002236 for the layer, f002380 for the box)
   - Size: about 1160 px square, centred, so it is about 7 % wider and taller than the comp (inferred from the handle box against the comp edge at f002380 and f002884; not typed on screen)
   - Position: 540, 540 (shown f002537; this is the layer's Transform Position, opened with the on-screen "Press P", not the Rectangle Path's Position; the path stays centred on the layer anchor, inferred)
4. Give the rectangle a thin stroke and no fill, and rename the layer "Line" (the rename was in place by f002537, before the keys). (stroke row shown f002166)
   - Fill: none (red slash) (shown f002166)
   - Stroke colour: the toolbar swatch is WHITE (shown f002166, also f002380, f003864, f004710)
   - Stroke width: 1 px (shown f002166)
   - The finished clip's hairline is pale amber, about 160,150,115 at about 1.5 px (measured, anti-aliased); no frame shows the white stroke being changed to amber, see unknowns.
5. Key the layer's Position, x only (y stays 540). (shown f003533, f003864)
   - 0:00: x = −581, y 540 — the rectangle's right edge then sits just outside the comp's left side (shown f003864 for the −581 value; a context menu at f003766 reads −582.0, 540.0 for the same key, so the true value is −581 or −582)
   - 3:00: x = 540, y 540 — the rectangle covers the comp (inferred; the 3:00 key is not yet present at f003301, where a 485.7 readout is only a value passed while setting up, not evidence)
   - 6:00: x = −581 again, so it goes back (the third key is seen as a hump pair in the graph, shown f003960; three diamonds at 0:00, 3:00 and 6:00 and −581.0, 540.0 at 6:00 shown f003633 and f003716)
6. Select all three keys and apply Easy Ease (F9). (shown f003766: menu path Keyframe Assistant > Easy Ease with an on-screen "Press F9"). Open the Graph Editor, speed view: two humps, zero speed at each key, top of the hump near the 500 px/sec grid mark (shown f003960 and f004081).
7. Duplicate the layer (Edit > Duplicate, shown f003792 menu). Rename the copy "Fill". (shown f004873)
   - On "Fill": fill = solid colour, stroke = none (shown f004710 Fill Options dialog with Solid Color; Stroke Options dialog with "None" at f005134 tile)
   - Fill colour: orange, rendered 254, 152, 0 on screen (shown f005402; saturated, may be inflated by the recording's wide-gamut display); the typed value is not readable
8. Put "Line" above "Fill" in the stack by dragging, so the stack is: Line, Fill, after, before. (shown f005331 drag, f005572 final order). Both stills already carry padlocks from f001667 (a starting state, not a step); at f005572 only the "before" still is locked, and the "after" still is unlocked while its TrkMat menu is open.
9. On the "after" layer open the TrkMat column and pick Alpha Matte "Fill". (shown f005572 menu)
   - The orange of "Fill" vanishes and the "after" picture shows only where the rectangle is. (shown f005600 tile)
10. Play. The edge of the rectangle, with its stroke, crosses the picture and returns. (shown f005677–f006057)

layout: All figures are on the 1080 px square picture of the finished clip (full frame 1920 × 1080; the picture is the full-height square at x 420–1500, measured: left edge pixel at x 420, ground at 242,136,8 outside it).
- Picture: 1080 × 1080 px, centred, 56.25 % of the frame width and 100 % of its height. (measured)
- Moving edge, measured on the full-size frames from the picture's left edge: f000031 edge at 1073 px = 60.5 % of the picture width; f000061 edge near 97 % (the hairline at the far right); f000122 (return leg) edge at 1252 px = 77 %. After state is always to the LEFT of the edge, before state to the right. (measured)
- Edge hairline: about 1–2 px wide on a 1080 px picture (0.1–0.2 %), a pale muted amber. Measured over clean black at full frame (anti-aliased): about 160–165, 150–155, 115–120 (f000061 col 1466–1467 and f000122 col 1252–1253, each about 1.5 px; f000031 col 1073–1075 at row 200 a 1–2 px line rising to 246,253,215). Brighter readings (230,225,160 or 255,193,68) come from rows crossing the bright mesh or the robot's own rings and are not the line. No glow or soft shadow around it.
- At rest at the start the hairline sits about 4.3 % in from the picture's left (x 466 at f000000, full height, measured, about 46 px on a 1080 picture). The build as written does NOT give this: its 0:00 key puts the rectangle's right edge at about x −1, outside the picture, so no line shows at rest. To get it, start x would be about 46 px further right (≈ −535). Likewise the 3:00 key (right edge at 1120) hides the line; the example shows it at 96.9 % at 2.03 s. The example's own keys are not shown and differ from the build's; a builder wanting visible lines at both ends must pick keys so the right edge lands inside the picture (inferred).
- The finished clip's surround is not part of the build: a diagonal gradient behind the square picture, orange (242,136,8) at the left to a yellower orange at the right and top. The build is square and black; this gradient comes from the finished example only (also f000075).
- The "after" picture is a near-black glossy render with amber rings; the "before" is a pale grey wire-mesh render of the same pose, aligned pixel for pixel; the edge cuts both without any change in position or scale of the picture.
- Matte rectangle: about 1160 px square (inferred); stroke on its right edge is the line; at the 3 s key the left and bottom/top stroke edges fall outside the comp so only the right edge is seen.
- Finished clip's motion, cut every 0.1 s from source.mp4 (crop 420,0,1080,1080), edge as share of picture width: 4.6 % (0.0 s), 6.5, 9, 12, 16 (0.4 s), 20, 26, 33, 42, 51, 60.5 (1.0 s), 68 (1.1 s), about 75 (1.2 s), 96.9 (2.03 s, f000061), off the picture by 2.5 s (f000075). So the forward leg is already moving at 0.0 s, starts softly (about 2 % per 0.1 s) and runs to about 2.4 s, peaking near 9 % per 0.1 s around 0.8–1.0 s; it ends off the right side with no soft stop. Return leg: about 75 % at 4.0 s, 77 % at f000122, 41 % at 4.5 s, 33 % at 4.6 s, about 26 % at 4.7 s, none at 4.8 s (about 7 % per 0.1 s, cut while still fast). Direction: forward left to right, return right to left, after state left of the edge. Soft ends are the build's Easy Ease (graph f003960), not the clip. Clip seconds are the video's, not real-time speed. The build's keys, 0/3/6 s with no hold, give no such hold; whether the example uses a hold, other keys or a faster playback is not shown.

timing and easing: Keys at 0:00, 3:00, 6:00 (shown f003533, f003960), 3 s per leg. Easy Ease on all keys (shown f003766). Speed graph: two humps, zero speed at each key, peak near the 500 px/sec grid mark (shown f003960); for a 1121 px move in 3 s the average is about 374 px/s, so the peak of about 500–560 px/s fits the default 33 % influence (inferred).

variations: none given (no narration).

pitfalls: none given (no narration). Observed: the "Line" has to be above "Fill" and neither can sit under the "after" layer, or the matte would not read; the matte layer itself turns invisible once it is used as a matte (shown f005600 tile).

longest on: Building and keying the rectangle (drawing it, typing position, keys, graph editor): roughly 62–152 s of the video, about 90 s, the longest block; the Fill/Stroke dialogs are short. Setup (21–62 s) took about 41 s and the matte and finish (152–196 s) about 44 s. Times are from the timeline's frame numbers.

build notes: Comp 1080×1080, 30 fps, 12 s. Add the two stills. Add shape layer "Line": Contents > Rectangle 1 > Rectangle Path > Size ≈ [1160,1160]; Stroke 1 with Fill 1 removed (or disabled); Transform > Position keys at 0 s [−581,540], 3 s [540,540], 6 s [−581,540]; set keys to Easy Ease via KeyframeEase(0,33.33) at each key (in/out), inferred from the default F9 behaviour. Duplicate the layer, name "Fill", enable Fill 1 (orange about 1.0, 0.596, 0 — screen-read, saturation may be inflated; the fill is only a matte so its colour does not show) and remove or disable Stroke 1. Order: Line, Fill, after, before. Set the "after" layer's trackMatteType = TrackMatteType.ALPHA, with the matte layer directly above it (Fill) — in recent AE versions use setTrackMatte(fillLayer, TrackMatteType.ALPHA). The thin hairline's width is the stroke width on the Line layer (shown 1 px, white; set it amber about 160,150,115 to match the clip, or keep white as drawn; for the rest-position line, start at x ≈ −535). The gradient surround is added separately if the 16:9 look is wanted.

result: start=0.0 end=4.7 animated crop=420,0,1080,1080 frame=f000031
before: f000000 (full "before" state with the hairline at the left); start of build comp seen at f001667
unknowns: Typed rectangle size; how the white stroke became amber, or whether the example used another colour; the fill's typed colour; whether the stroke has rounded or square caps; the exact key value at 3:00 (540 assumed) and 6:00 (−581 assumed); how the stills were put in the comp and the exact reason for the lock icons; the opacity and mode changes the on-screen text shows around 0:54 and 1:10 (read as housekeeping, not seen to matter); the finished clip's own key times and hold (they differ from the build's 0/3/6 s); playback speed of the example; the shutter, since no motion blur is visible or switched on.

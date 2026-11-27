# Recipes composed from proven recipes (1 recipe, 1 proven)

Not learned from a video. Each recipe here chains recipes the cookbook has already proven into one beat, and names them on its `composes:` line by their catalog ids. Read those recipes for how each part is built; this file adds only what the chain needs: the order, the timing and the hand-offs between the parts, and what each part looks like inside the chain. `status: proven` means the chain was built in After Effects from this text and the named recipes, reviewed against the job's definition and the parts' own proven looks, and accepted by Joe; `status: unproven` means it has not been.

| # | Recipe | Job | Status |
|---|---|---|---|
| 01 | Fail, then fix: a red X on the wrong state, a wipe to the fixed one, a tick on the result | fail-then-fix | proven |

## Fail, then fix: a red X on the wrong state, a wipe to the fixed one, a tick on the result
id: 01-red-x-then-wipe-then-tick
status: proven (accepted by Joe 2026-11-26: built in After Effects on generated artwork from this text and the recipes it names, reviewed against the job and the parts' proven looks, rebuilt once for the labels, and the phone MP4 sent; he said "Accept")
composes: 02-duplicate-rotate-lines-into-cross, 01-before-after-sliding-matte-wipe, piece-tick
what it does for a beat: Show something going wrong and then the fix making it right, as one beat: the wrong state is struck with a red X, a straight edge wipes the fixed state on over it and takes the X away, and a tick draws on the result.
what it looks like: One subject fills the frame in its wrong state (a garbled render, a failed upload, a broken layout). A red X draws across the thing that is wrong in about half a second, snapping through the middle of its stroke as the cross recipe does, and stays. A beat later a vertical edge with a thin pale hairline sweeps from the left side to the right; left of it is the same subject fixed, on the same pixels, and the X goes with the wrong picture as the edge passes it. A small label in each state names the one thing that changed, and the edge swaps it with its picture. Once the edge has left the frame, a white tick draws on a green disc that arrived with the fixed picture, and the fixed state holds.

ingredients:
- The cross: recipe 02-duplicate-rotate-lines-into-cross, which turns the travelling line of recipe 01-trim-paths-travelling-round-cap-line into an X. Read both with ae_arsenal get.
- The wipe: recipe 01-before-after-sliding-matte-wipe (a rectangle keyed on x, duplicated as the track matte of the upper picture, with a stroke copy riding its edge). Only its forward leg is used.
- The tick: piece-tick (PCS.tick, loaded with pcs-core.jsx; ae_arsenal get piece-tick gives the call).
- Two pictures of the same subject, wrong and fixed, registered pixel for pixel, each filling the frame. Make the fixed one first and the wrong one as an edit of it, so only the wrong part differs.
- Type for the two labels (one line each).

steps:
1. Make the comp at the frame the beat plays in (1080 × 1920 at 9:16), 30 fps, 6 s.
2. Make a precomp "wrong", the comp's size: the wrong picture full frame at 100 %, its label, and the X. Build the X inside this precomp as recipe 02 does (two copies of the round-capped Trim Paths line, Rotation +45 and −45, the same Position), centred on the thing that is wrong. The X lives in the wrong state's precomp so that the wipe takes it away with the picture it marks.
3. Make a precomp "fixed", the comp's size: the fixed picture full frame at 100 %, its label, and a green disc for the tick (an ellipse shape, no stroke). The disc arrives with the fixed picture as the edge uncovers it.
4. In the main comp, build recipe 01's stack over the two precomps, bottom to top: "wrong", "fixed" (Track Matte: Alpha Matte "Fill"), "Fill", "Line". Size both rectangles about 7 % larger than the comp each way (1160 × 2060 for 1080 × 1920), Position y at the comp's centre.
5. Key the X (inside "wrong"): both arms carry the same keys. Trim Paths End 0 → 100 over 17 frames, from 0.4 s; speed 0 and influence 92 % on both keys. Leave Start at 0 with no keys: in this chain the X stays drawn until the wipe takes it, instead of clearing as recipe 02's X does.
6. Key the wipe (Position x of "Fill" and "Line", the same keys on both) from 1.8 s: the forward leg only, then no more keys, so the fixed state stays. See timing and easing for the keys.
7. Put PCS.tick on the disc in the main comp, above "Line" (or inside "fixed", over the disc), starting 0.1 s after the edge has left the frame.
8. Leave the fixed state still to the end of the comp.

layout: Figures are for a 1080 × 1920 frame; scale them with the frame's width.
- Pictures: full frame, centred, unmoved, both at 100 %; check the registration by overlaying them at half opacity before building.
- X: the arms' paths at ±372 px from the centre, so the X is about 545 px across with its caps (about half the frame's width), stroke 16.4 px with round caps, red about #D7263D. These are the flag-a-problem proof's figures for recipe 02 at 9:16. Centre it on the thing that is wrong; it may sit off the frame's middle.
- Edge: the matte rectangle's right edge is the edge (Position x + 580 for a 1160 px rectangle). The hairline is recipe 01's: pale muted amber about 160, 150, 115, 1.5 px, no glow.
- Labels: one short line each (the setting, the step or the version that changed), on a dark pill about 70 % opaque, white type with a cap height about 1.6 % of the frame's height. Write them so they share every word but the one that changed ("TEXT MODE · OFF", "TEXT MODE · ON"). Left-justify both texts at one x and give both pills one width, the longer label's, at one place in their precomps, so the shared words sit on the same pixels and the edge changes only the last word. Centred labels of different lengths do not line up: in the first proof the shorter one sat 16 px further right, and its letters jumped as the edge crossed them.
- Disc and tick: a green disc about 190 px across (about 18 % of the width), clear of the thing the fix is about (beside the label works); PCS.tick with size about 150 and a white colour, centred on the disc.

timing and easing: 30 fps, comp 6 s. Times are from the start of the beat.
- 0.0–0.4 s: the wrong state alone, so it is seen before it is marked.
- 0.4 s: the X draws (End 0 → 100 over 17 frames, 92 % influence), complete at about 0.97 s. Recipe 02's snap: the middle frame carries about half the stroke.
- 0.97–1.8 s: the X held whole, about 0.8 s, long enough to read the state as wrong.
- 1.8 s: the wipe's forward leg, as the before-after proof fitted it to the tutorial's finished clip, with a soft start added so no hairline shows before the wipe. Keys on Position x (time after 1.8 s, x, speed in px/s, influence 33.33 % in and out): 0.0 s −581 (speed 0, the edge just off the left side); 0.3 s −529 (250); 0.7 s −411.5 (500); 1.1 s −126.4 (856); 1.3 s 73 (864); 1.5 s 219 (580); 1.9 s 392 (310); 2.3 s 468 (125); 2.8 s 530 (0). The edge passes the X's middle at about 1.2 s into the leg (3.0 s) and leaves the frame at about 2.55 s into the leg (about 4.35 s).
- 4.45 s: the tick draws, 0.3 s.
- 4.75–6.0 s: the fixed state holds with its tick, at least 1 s.

pitfalls:
- An X that clears on its own (recipe 02's Start keys) before the wipe reads as the mistake going away by itself; keep it drawn and let the wipe take it.
- An X in the main comp above the stack stays on the fixed picture after the wipe. It has to be inside the wrong state's precomp.
- A wipe that returns (recipe 01's hold-and-back) undoes the fix; stop after the forward leg.
- Pictures that are not registered make the edge cut two different subjects, and the change no longer reads as one change.
- A tick that starts while the edge is still on the frame competes with the wipe; wait until it has left.

build notes: All by script, no dialogs. Build recipe 02's X as its own steps say (a horizontal path from (−372, 0) to (372, 0), round-cap stroke, Trim Paths; duplicate; Rotation ±45), inside the "wrong" precomp, and set the temporal ease with KeyframeEase(0, 92) on both End keys. Build recipe 01's two rectangles in the main comp and set the track matte with layer.setTrackMatte(fillLayer, TrackMatteType.ALPHA) on "fixed". Set the wipe's keys with setValueAtTime and setTemporalEaseAtKey(k, [new KeyframeEase(speed, 33.33)], [new KeyframeEase(speed, 33.33)]). For the tick, $.evalFile pcs-core.jsx, PCS.need('tick'), then PCS.tick(comp, { size: 150, color: [1, 1, 1], t: 4.45, dur: 0.3 }) and set its Position to the disc's centre.
